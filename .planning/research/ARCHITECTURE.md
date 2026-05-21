# Architecture: Parallel Agent Integration for sg-execute

**Scope:** v1.4 Team Agent Parallel Execution
**Researched:** 2026-05-21
**Confidence:** HIGH (based on actual codebase + Claude Code official docs + superpowers 5.1.0 source)

---

## Grounding Facts (verified, not assumed)

### PLAN.md format already encodes dependency information

Every `*-PLAN.md` file has YAML frontmatter with two relevant fields:

```yaml
wave: 1          # execution wave (1 = first, 2 = after wave-1 completes, etc.)
depends_on: []   # list of plan IDs this plan requires before starting
                 # e.g. depends_on: [01-01]
```

This is the authoritative dependency signal. Wave-1 plans with `depends_on: []` are unconditionally independent. Wave-2+ plans list which prior plan(s) must complete first.

No new dependency syntax needs to be invented. The structure is already there.

### superpowers:executing-plans does NOT support partial plan execution

Reading the skill source (`executing-plans/SKILL.md`), it:
- Takes a prompt blob as its single input
- Executes all tasks in that blob sequentially
- Calls `superpowers:finishing-a-development-branch` at the end

There is no parameter for "execute only tasks N through M" or "execute this subset." The skill is a single-agent, all-tasks-in-sequence executor. It cannot be split into partial runs without creating multiple separate prompt blobs, each containing only the tasks for that agent.

### superpowers:dispatching-parallel-agents is the right reference pattern

Superpowers 5.1.0 ships `dispatching-parallel-agents/SKILL.md` explicitly for this:
- One agent per independent problem domain
- Each agent gets a focused, self-contained prompt with only its tasks
- The orchestrator dispatches them via `Task(...)` calls in parallel
- After all return, the orchestrator integrates results

This is the documented, supported pattern. The orchestrator calls multiple `Task()` invocations, which Claude Code executes concurrently.

### Claude Code Task tool runs subagents concurrently

When the host Claude session issues multiple `Task(...)` calls in one response turn, they execute in parallel (up to `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`, default 10). The worktree isolation option (`isolation: worktree`) prevents parallel agents from clobbering each other's file edits.

For this project's use case: parallel agents implementing different PLAN.md tasks will almost certainly edit different files (different commands, hooks, or skills). Worktree isolation is a safety net but may not always be required.

---

## Answers to the Seven Questions

### 1. Should sg-execute orchestrate directly, or delegate to a new skill?

**Delegate to a new skill: `skills/sg-parallel-execute/SKILL.md`.**

Rationale:
- `sg-execute.md` is already at its complexity ceiling (nine numbered steps, idempotency logic, HANDOFF.md writes). Adding dependency analysis and multi-agent dispatch into the same file makes it unreadable and unmaintainable.
- The existing `sg-execute.md` → `superpowers:executing-plans` handoff is a clean terminal action. Parallel execution changes that to a multi-step orchestration. That is a different behavior shape, and the two should not live in the same file.
- A new skill keeps the command file as an entry point and router, not an implementor.
- This matches how superpowers itself separates `executing-plans` from `dispatching-parallel-agents`.

`sg-execute.md` becomes: analyze → route. If N independent wave-1 groups > 1 → call `skills/sg-parallel-execute`. Otherwise → fall back to `superpowers:executing-plans` (unchanged path, zero regression).

### 2. Where does PLAN.md task parsing happen?

**In `sg-execute.md` (frontmatter extraction), then consumed by `skills/sg-parallel-execute` (grouping logic).**

`sg-execute.md` already collects and concatenates all `*-PLAN.md` bodies. For parallel execution, add one step before the final Skill invocation: extract the frontmatter fields (`wave`, `depends_on`, `files_modified`) from each `*-PLAN.md` and include a pre-parsed dependency manifest table in the prompt blob.

```markdown
# Dependency Manifest
| Plan ID | Wave | Depends On | Files Modified |
|---------|------|------------|----------------|
| 14-01   | 1    | (none)     | AGENTS.md, .agents/skills/sg-retro/SKILL.md |
| 14-02   | 1    | (none)     | .agents/skills/sg-execute/SKILL.md |
| 14-03   | 2    | 14-01      | .agents/skills/sg-plan/SKILL.md |
```

The skill then reads this manifest to group tasks. This avoids YAML parsing inside a Markdown skill (which has no bash environment at parse time) and makes the grouping logic readable in plain markdown instructions.

Do not put YAML parsing in the skill itself — skills run as Claude instructions, not as shell scripts.

### 3. How to split a PLAN.md into N independent task groups for N agents?

Group by wave, then by file-scope overlap within wave-1:

```
Step 1: Read dependency manifest from prompt blob
Step 2: Collect all plans with wave=1 and depends_on=(none) → candidate set
Step 3: Within candidate set, check files_modified overlap across plans
         Plans with overlapping files are NOT safely parallelizable
         Merge overlapping plans into one agent group
Step 4: Remaining distinct groups → each becomes one agent's workload
Step 5: N = number of groups after merging
Step 6: If N == 1, fall back to single-agent execution
Step 7: If N > 1, dispatch N parallel Task() calls
Step 8: Wave-2+ plans execute after all wave-1 agents complete
```

File conflict detection is the critical safety check. The `depends_on` field is set by plan authors and may be incomplete. Two plans that both modify `commands/sg-execute.md` cannot run in parallel regardless of what `depends_on` says.

### 4. How do N parallel agents report back / merge results?

Each `Task(...)` call returns a text result (the agent's summary). The orchestrating skill collects these after all Tasks complete.

Merge protocol in `skills/sg-parallel-execute`:
1. Wait for all N Task results (Claude Code handles this — the session blocks until all Task() calls resolve)
2. Review each summary for blocker signals ("BLOCKED", "FAILED", "could not complete")
3. If any agent reports a blocker: halt, surface all summaries to the user, do not proceed to wave-2
4. If all agents succeed: execute wave-2 plans sequentially (they have explicit dependencies and cannot be parallelized arbitrarily)
5. After all waves complete: the skill returns a final summary to the sg-execute session

HANDOFF.md is written by `sg-execute.md` before the skill is invoked (existing Step 8). The skill does not write to HANDOFF.md. This preserves the idempotency check.

There is no git branch merging because agents work in the same worktree (current branch). File-scope separation enforced at grouping time (Step 3 above) prevents write conflicts. Worktree isolation (`isolation: worktree`) is explicitly deferred — it adds merge complexity and is unnecessary when file scopes are enforced.

### 5. Does superpowers:executing-plans support partial plan execution?

**No.** Confirmed from source reading. It is an all-or-nothing sequential executor that also calls `superpowers:finishing-a-development-branch` at the end.

To use superpowers:executing-plans per-agent would trigger the finishing-a-development-branch skill N times (git finalization, commit, push loop). That is wrong.

For parallel agents, use bare `Task(...)` calls with custom prompts instructing each agent to implement its specific tasks and return a summary. The `superpowers:executing-plans` skill is only appropriate for the single-agent fallback path.

### 6. What changes are needed in commands/sg-execute.md?

Two targeted changes only:

**Add Step 8.5** (between current Step 8 HANDOFF append and Step 9 skill invocation):

Extract dependency manifest from PLAN.md frontmatter using awk/grep on the YAML blocks of each `*-PLAN.md` file. Emit a markdown table: Plan ID | Wave | Depends On | Files Modified. Count wave-1 plans with no dependencies. Store the count as `PARALLEL_GROUPS`.

```bash
# Pseudocode — actual awk depends on YAML structure
for f in "$PHASE_DIR"/*-PLAN.md; do
  PLAN_ID=$(basename "$f" -PLAN.md)
  WAVE=$(awk '/^wave:/{print $2; exit}' "$f")
  DEPENDS=$(awk '/^depends_on:/{found=1; next} found && /^  - /{print $2} found && /^[^ ]/{exit}' "$f" | tr '\n' ',' | sed 's/,$//')
  FILES=$(awk '/^files_modified:/{found=1; next} found && /^  - /{gsub(/^  - /,""); printf "%s ", $0} found && /^[^ ]/{exit}' "$f")
  echo "| $PLAN_ID | ${WAVE:-1} | ${DEPENDS:-(none)} | $FILES |"
done
```

**Modify Step 9** (routing decision):

```
If PARALLEL_GROUPS > 1:
  Invoke Skill(skill="sg-parallel-execute", args="<prompt blob with dependency manifest>")
Else:
  Invoke Skill(skill="superpowers:executing-plans", args="<existing prompt blob>")
```

No other changes. The lessons reminder, phase resolution, meta extraction, plan hash, idempotency check, and HANDOFF.md append all remain exactly as-is.

### 7. Should there be a fallback to single-agent mode when tasks are all dependent?

**Yes, and it is the majority path for existing phases.**

Looking at the project history: most phases have 1-2 PLAN.md files, with wave-2 depending on wave-1. The v1.3 phases (14, 15, 16) each have a single plan. Only phases with 3+ independent plans benefit from parallelism.

The routing logic:

```
Count independent groups in wave-1
  0 or 1 → superpowers:executing-plans (existing path, untouched)
  2+     → skills/sg-parallel-execute (new path)
```

The single-agent fallback must remain fully functional and is the default. The parallel path is opt-in based on the plan structure — the plan author controls this by setting `wave` and `depends_on` correctly.

---

## Component Boundaries

| Component | Role | Change Type |
|-----------|------|-------------|
| `commands/sg-execute.md` | Entry point: resolves phase, collects plans, routes to single or parallel | MODIFY (Step 8.5 + routing in Step 9) |
| `skills/sg-parallel-execute/SKILL.md` | Reads dependency manifest, groups tasks, dispatches parallel Task() calls, collects results, triggers wave-2 | CREATE |
| `superpowers:executing-plans` | Single-agent sequential executor (fallback path) | NO CHANGE |
| `superpowers:dispatching-parallel-agents` | Reference pattern only | NO CHANGE |
| `.planning/HANDOFF.md` | Audit log — single row written before skill invocation | NO CHANGE to schema or write logic |
| `hooks/lessons_ranker.py` | Lessons reminder | NO CHANGE |

---

## Data Flow

Single-agent path (unchanged):

```
sg-execute.md
  → resolve phase, collect PLAN.md bodies
  → extract dependency manifest (Step 8.5, new)
  → PARALLEL_GROUPS = 1
  → append HANDOFF.md row
  → Skill(superpowers:executing-plans, prompt_blob)
```

Parallel path (new):

```
sg-execute.md
  → resolve phase, collect PLAN.md bodies
  → extract dependency manifest (Step 8.5)
  → PARALLEL_GROUPS = N > 1
  → append HANDOFF.md row (same schema, same timing)
  → Skill(sg-parallel-execute, prompt_blob_with_manifest)
      → parse manifest
      → check files_modified overlap → merge conflicting plans into same group
      → group wave-1 independent plans
      → Task("Execute group 1: plan-A tasks") ─┐
      → Task("Execute group 2: plan-B tasks") ─┤ concurrent
      → Task("Execute group N: plan-N tasks") ─┘
      → collect all results
      → if any blocker: halt, surface to user
      → if wave-2 plans exist: execute sequentially
      → return final summary
```

---

## Build Order

1. **Step 8.5 in `sg-execute.md`** — frontmatter extraction and dependency manifest generation. Pure bash; verifiable independently before any skill work.

2. **Routing decision in `sg-execute.md` Step 9** — the if/else that counts independent groups and routes. Requires Step 8.5 complete.

3. **`skills/sg-parallel-execute/SKILL.md`** — the new skill. Largest new artifact. Receives the manifest, groups tasks, dispatches Tasks, collects results, handles wave-2.

4. **Integration test with a synthetic phase** — create a temporary phase directory with 2+ wave-1 plans (no `depends_on`) and verify agents are dispatched concurrently and results collected correctly.

5. **Regression test on a single-plan phase** — verify the single-agent path through `superpowers:executing-plans` is completely unchanged.

---

## Critical Constraints

- **Non-invasive principle**: Do not modify superpowers internals. Use bare `Task(...)` calls for parallel agents, not `superpowers:executing-plans` per-agent (which triggers git finalization N times).
- **Idempotency**: HANDOFF.md append in `sg-execute.md` happens once, before skill invocation, same as today. The skill writes nothing to HANDOFF.md.
- **File conflict rule**: Plans with overlapping `files_modified` are merged into one agent group regardless of `wave`/`depends_on` values. This is non-negotiable for correctness.
- **Wave-2 sequencing**: Wave-2 plans execute only after all wave-1 agents complete successfully. The skill does not start wave-2 if any wave-1 agent returned a blocker signal.
- **Fallback must be zero-regression**: If `PARALLEL_GROUPS <= 1`, `sg-execute.md` behaves identically to today. The new Step 8.5 is additive (adds manifest to prompt blob); it does not alter the existing prompt structure in a way that breaks `superpowers:executing-plans`.
