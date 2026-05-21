# Technology Stack — v1.4 Team Agent Parallel Execution

**Project:** super-gsd v1.4
**Researched:** 2026-05-21
**Scope:** Claude Code APIs needed to implement parallel agent execution in sg-execute.
**Previous STACK.md (v1.3 Codex):** Replaced by this file. v1.3 content is in CHANGELOG.md and git history.

---

## The Core Question

sg-execute currently packages PLAN.md and calls `Skill(skill="superpowers:executing-plans", ...)` once — a single sequential agent. The goal is to detect independent task groups in PLAN.md and run them in parallel agents. What APIs does Claude Code actually provide for this?

---

## Finding 1: The Agent Tool (formerly Task Tool)

**Status:** HIGH confidence (official docs)
**Source:** https://code.claude.com/docs/en/sub-agents

**Rename note:** In Claude Code v2.1.63, the `Task` tool was renamed to `Agent`. Existing `Task(...)` references in settings and agent definitions still work as aliases. Both names refer to the same mechanism.

### How it works

Claude spawns a subagent by calling the `Agent` tool. The subagent runs in its own isolated context window. When the main conversation includes multiple `Agent` tool calls in a single response message, the calls execute concurrently. The parent agent receives all results before proceeding.

The key phrase from official docs: "Multiple subagents can be spawned to perform parallel research on independent investigations, allowing each subagent to explore its area independently before Claude synthesizes the findings."

### What a subagent gets

- Its own context window (does NOT inherit parent conversation history)
- Loads project CLAUDE.md, MCP servers, and skills fresh (same as a new session)
- Receives only the spawn prompt from the parent
- Can use any tools allowed by its definition

### What a subagent cannot do

- Spawn its own subagents (no nesting — "subagents cannot spawn other subagents")
- Communicate with sibling subagents (only reports back to the spawning parent)
- Inherit the parent's conversation history

### Parallelism mechanic

Claude emits multiple `Agent` tool calls in a single response → they run concurrently → results return together. This is how `/simplify` in Claude Code works ("Spawns three review agents in parallel, aggregates their findings, and applies fixes").

**Critical caveat — known bug (issue #29181):** There is a documented issue where, in subsequent attempts within the same conversation, only 1 of N intended parallel `Agent` calls may actually execute. The remaining "results" are hallucinated (plausible-looking but fabricated outputs). The issue was closed as "not planned / duplicate" with no official workaround documented. Root cause is unclear (model-side vs client-side). This is a reliability risk for parallel execution inside a command that might be re-run in the same session.

---

## Finding 2: Agent Teams (TeamCreate) — Experimental, Disabled by Default

**Status:** HIGH confidence (official docs)
**Source:** https://code.claude.com/docs/en/agent-teams

### What it is

Agent teams coordinate multiple full Claude Code sessions (not just subagents within one session). One session acts as "team lead," spawning "teammates" that have their own context and can communicate with each other through a shared task list and mailbox system.

### Enabling

Agent teams are **disabled by default**. Enable with:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Requires Claude Code v2.1.32 or later.

### How it differs from parallel Agent() calls

| Dimension | Parallel Agent() calls | Agent Teams |
|-----------|----------------------|-------------|
| Scope | Single session, subagents within it | Multiple full Claude Code sessions |
| Communication | Subagents report to parent only | Teammates message each other directly |
| Coordination | Parent manages all work | Shared task list with self-coordination |
| State | Experimental / known bug in practice | Experimental, labeled with known limitations |
| Token cost | Lower (results summarized back) | Higher (each teammate is a full session) |
| Availability | Always available | Must enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` |
| Suitable for | Focused tasks where only result matters | Complex work requiring inter-agent discussion |

### TeamCreate API

There is **no `TeamCreate` tool exposed as a named API** that a command file can call directly. Agent teams are created by telling Claude (the lead session) to "create an agent team" in natural language, or the lead session automatically proposes it when the task benefits from parallel work. The infrastructure is managed automatically — team config stored in `~/.claude/teams/{team-name}/config.json`, task list in `~/.claude/tasks/{team-name}/`.

**Implication for sg-execute:** You cannot call `TeamCreate(...)` from a command file's `<process>` block the way you call `Skill(...)`. Agent teams are invoked by framing the task description to the lead session. The lead then creates the team.

### Known limitations

- No session resumption with in-process teammates (`/resume` and `/rewind` do not restore in-process teammates)
- Task status can lag (teammates fail to mark tasks complete, blocking dependent tasks)
- One team at a time (must clean up before creating a new one)
- No nested teams (teammates cannot spawn their own teams)
- Lead is fixed — cannot transfer leadership
- Split-pane mode requires tmux or iTerm2 (not supported in VS Code integrated terminal, Windows Terminal, or Ghostty)

### Recommendation for sg-execute

Agent teams are experimental, require opt-in env variable, and have substantial known limitations. They are **not suitable as the primary parallel execution mechanism** for sg-execute in v1.4. The parallel `Agent()` subagent approach is more reliable for the specific pattern sg-execute needs (fan-out independent tasks, collect results, integrate).

---

## Finding 3: Git Worktree Isolation

**Status:** HIGH confidence (official docs)
**Source:** https://code.claude.com/docs/en/worktrees

### What worktrees solve

When parallel subagents edit the same files, last-write wins. Worktrees give each agent its own git checkout so edits never collide. They share the same repository history and remote but each has its own working directory and branch.

### Claude Code worktree support

Claude Code has native `--worktree` flag and `EnterWorktree` tool:

```bash
# Start an isolated session
claude --worktree feature-auth
# Each run gets .claude/worktrees/<name>/ at repo root, on branch worktree-<name>
```

### Subagent-level isolation

Custom subagents can declare `isolation: worktree` in frontmatter:

```yaml
---
name: task-executor
description: Executes an independent PLAN.md task group
isolation: worktree
tools: Read, Write, Edit, Bash
---
```

With `isolation: worktree`, each time this subagent is spawned it gets a temporary git worktree. The worktree auto-cleans if the subagent makes no changes.

### Key mechanics

- Default base: branches from `origin/HEAD` (remote default branch)
- Local HEAD base: set `worktree.baseRef: "head"` in settings to branch from current local HEAD (important for in-progress work)
- `.worktreeinclude`: file using `.gitignore` syntax; files that match AND are gitignored (e.g., `.env`) are copied into every new worktree automatically
- Task claiming uses file locking to prevent race conditions when multiple agents claim the same task simultaneously

### Merge responsibility

Worktrees isolate during execution. After parallel agents finish, their branches must be merged back. This is the orchestrator's responsibility, not automatic. Two parallel agents editing the same file will produce a merge conflict at integration time — worktrees delay but do not eliminate conflicts. File ownership partitioning (each agent owns different files) is the only reliable conflict prevention.

### /batch command — relevant pattern

The `/batch` command (a built-in skill) demonstrates the exact pattern sg-execute needs:
- Takes a high-level instruction
- Researches the codebase, decomposes work into 5–30 independent units
- Presents a plan for approval
- Spawns one background subagent per unit in an isolated git worktree
- Each subagent implements its unit, runs tests, and opens a pull request

This is the production-proven pattern in Claude Code for parallel isolated implementation. sg-execute should follow the same fan-out structure.

---

## Finding 4: Maximum Parallel Agents

**Status:** MEDIUM confidence (community-reported, not in official docs)
**Source:** Web search results, multiple community sources agree on 10

The practical limit is approximately **10 concurrent subagents**. Official docs say "there's no hard limit on the number of teammates" for agent teams but note "diminishing returns beyond a certain point." The recommendation from official docs for agent teams: "Start with 3–5 teammates for most workflows." Community sources citing a 10-agent limit for parallel `Agent()` calls in a single session likely reflect a soft constraint or model behavior, not a hard API limit.

For sg-execute, PLAN.md tasks typically group into 2–5 independent groups. The 10-agent limit is not a practical constraint.

---

## Finding 5: /fork Command — Alternative Parallelism

**Status:** HIGH confidence (official docs)
**Source:** https://code.claude.com/docs/en/sub-agents#fork-the-current-conversation

```
/fork draft unit tests for the parser changes so far
```

Spawns a subagent that inherits the **entire current conversation context** (unlike normal subagents that start fresh). The fork name is derived from the first words of the directive. When `CLAUDE_CODE_FORK_SUBAGENT` is set, `/fork` spawns a forked subagent instead of branching the conversation.

This is less relevant to sg-execute than the standard `Agent()` approach because sg-execute needs fresh context per task group, not a copy of the parent conversation.

---

## Recommended Tech Approach for sg-execute Parallel Execution

### Approach: Parallel subagent calls via Agent() with prompt-driven task partitioning

**Why not Agent Teams:** Experimental, requires env var opt-in, substantial known limitations, no direct API call from command files.

**Why not /batch:** /batch is a built-in skill that operates on the whole codebase via natural language instruction. sg-execute needs to partition specific, already-written PLAN.md tasks — the partitioning logic is structured, not free-form.

**Why plain parallel Agent() calls:** Available by default, no setup required, directly invocable from Claude's response, pattern is used by built-in Claude Code skills (`/simplify` spawns 3 parallel review agents). The known parallel-call bug (issue #29181) is a risk but mitigable by design (see Pitfalls).

### Implementation pattern

sg-execute v1.4 should work as follows:

**Step 1 — Dependency analysis in orchestrator (main agent):**
Parse PLAN.md task sections, detect which tasks have dependencies on others, group independent tasks into parallel batches. This is done by Claude (the orchestrator reading PLAN.md), not by a separate agent.

**Step 2 — Define task-executor subagent in `.claude/agents/`:**

```yaml
---
name: sg-task-executor
description: Executes an independent task group from a PLAN.md batch. Spawned by sg-execute for parallel work.
isolation: worktree
tools: Read, Write, Edit, Bash, Glob, Grep
model: inherit
permissionMode: acceptEdits
---

You are a focused implementation agent. You receive a specific task group from a PLAN.md phase.
Execute only the tasks assigned to you. When done, summarize what you implemented and any blockers encountered.
Do not modify files outside the scope of your assigned tasks.
```

**Step 3 — sg-execute command instructs orchestrator to spawn parallel agents:**

The `<process>` block in sg-execute.md adds a parallel execution section after the existing PLAN.md parsing:

```
After collecting PLAN.md bodies and identifying independent task groups:
- For each independent group, instruct Claude to spawn an sg-task-executor subagent
- Multiple spawn calls in a single response execute in parallel
- Each subagent receives only its task group content plus success criteria
- After all subagents complete, orchestrator integrates results and updates HANDOFF.md
```

**Step 4 — Sequential fallback:**

If PLAN.md has no identifiable independent groups (all tasks depend on each other), fall back to the existing behavior: single `Skill(skill="superpowers:executing-plans", ...)` call.

### Worktree decision

Use `isolation: worktree` on the `sg-task-executor` subagent definition. Reasons:
- PLAN.md task groups in different phases routinely touch different files
- Worktree isolation prevents silent overwrites during parallel execution
- Post-execution merge is orchestrator's responsibility (standard `git merge` workflow)
- Base ref should be `"head"` (current branch) since the work is always in-progress, not on remote default

Add `.claude/worktrees/` to `.gitignore`.

### What NOT to implement

- Do not implement a custom dependency graph parser in Python — let Claude read PLAN.md and identify independent groups through natural language understanding
- Do not use Agent Teams (experimental, too many limitations for a production plugin feature)
- Do not expose worktree merge logic to the user — if conflicts occur, the user resolves them like any git merge

---

## Sources

- Subagents (Agent tool): https://code.claude.com/docs/en/sub-agents [HIGH]
- Agent teams: https://code.claude.com/docs/en/agent-teams [HIGH]
- Worktrees: https://code.claude.com/docs/en/worktrees [HIGH]
- Parallel agents comparison: https://code.claude.com/docs/en/agents [HIGH]
- Commands reference (/batch): https://code.claude.com/docs/en/commands [HIGH]
- Parallel Task bug report: https://github.com/anthropics/claude-code/issues/29181 [HIGH — closed as duplicate/not planned]
- Community max-agents claim (10): Multiple web sources [MEDIUM — unverified against official docs]
