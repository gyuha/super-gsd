<!-- refreshed: 2026-05-29 -->
# Architecture

**Analysis Date:** 2026-05-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Claude Code User                              │
│               /super-gsd:sg-* slash commands                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Skills Layer                                  │
│  `skills/sg-*/SKILL.md`  (21 skills, primary dispatch layer)        │
│                                                                      │
│  sg-start → sg-plan → sg-execute → sg-review → sg-learn → sg-ship  │
│                  ↓           ↓            ↓                          │
│            sg-parallel-   sg-ui-plan  sg-retro                      │
│            execute                                                   │
└──────┬───────────────────┬───────────────────────┬──────────────────┘
       │                   │                       │
       ▼                   ▼                       ▼
┌────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
│ GSD Skills │   │  Superpowers     │   │  Planning Artifacts      │
│ (external) │   │  Skills          │   │  `.planning/`            │
│ gsd-plan-  │   │  (external)      │   │  STATE.md, HANDOFF.md,   │
│ phase,     │   │  superpowers:    │   │  ROADMAP.md, lessons/,   │
│ gsd-ship,  │   │  executing-plans │   │  phases/<N>-*/           │
│ etc.       │   │  requesting-code-│   │                          │
│            │   │  review          │   │                          │
└────────────┘   └──────────────────┘   └──────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Hooks Layer                                   │
│  `hooks/` — Node.js .cjs, event-driven, Claude Code lifecycle       │
│                                                                      │
│  stop_hook.cjs     ← Stop/SubagentStop events                       │
│  rule_runner.cjs   ← PreToolUse events                              │
│  transcript_matcher.cjs  ← signal detection utility                 │
│  lessons_ranker.cjs      ← CLI scoring tool                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| sg-plan | Inject lessons, run gsd-discuss-phase + gsd-plan-phase chain | `skills/sg-plan/SKILL.md` |
| sg-execute | Build Superpowers prompt, detect parallel groups, hand off to execution | `skills/sg-execute/SKILL.md` |
| sg-parallel-execute | Dispatch up to 3 concurrent Task() agents per wave group | `skills/sg-parallel-execute/SKILL.md` |
| sg-review | Derive git range, invoke superpowers:requesting-code-review | `skills/sg-review/SKILL.md` |
| sg-learn | Thin wrapper — delegates to sg-retro | `skills/sg-learn/SKILL.md` |
| sg-retro | Multi-lens retrospective, writes `.planning/lessons/{NN}-{date}.md` | `skills/sg-retro/SKILL.md` |
| sg-ship | Resolve phase, append HANDOFF row, invoke gsd-ship | `skills/sg-ship/SKILL.md` |
| sg-next | Read HANDOFF.md + STATE.md, auto-invoke the correct next sg-* command | `skills/sg-next/SKILL.md` |
| sg-status | Display milestone/phase progress and stage, recommend next command | `skills/sg-status/SKILL.md` |
| sg-start | Detect existing session, offer Resume/New/Cancel | `skills/sg-start/SKILL.md` |
| sg-complete | Complete a phase (delegate to sg-phase) or close a milestone | `skills/sg-complete/SKILL.md` |
| sg-new | Start a new milestone via gsd-new-milestone | `skills/sg-new/SKILL.md` |
| sg-health | Read-only diagnostics for GSD/Superpowers/hooks installation | `skills/sg-health/SKILL.md` |
| sg-setup | Copy hooks/.agents/.codex to a target project (in-session installer) | `skills/sg-setup/SKILL.md` |
| sg-phase | Edit/remove/complete a phase; complete fills metadata gap | `skills/sg-phase/SKILL.md` |
| sg-explore | Delegate to gsd-map-codebase for codebase analysis | `skills/sg-explore/SKILL.md` |
| sg-quick | Ad-hoc task execution via Superpowers | `skills/sg-quick/SKILL.md` |
| sg-ui-plan | UI design planning skill | `skills/sg-ui-plan/SKILL.md` |
| sg-lessons | Display ranked lessons from `.planning/lessons/` | `skills/sg-lessons/SKILL.md` |
| sg-cleanup | Phase cleanup and archiving | `skills/sg-cleanup/SKILL.md` |
| sg-update | Update skill/hook files | `skills/sg-update/SKILL.md` |
| stop_hook.cjs | Stop/SubagentStop: detect workflow signals, emit systemMessage guidance | `hooks/stop_hook.cjs` |
| rule_runner.cjs | PreToolUse: evaluate `.claude/sg-rule.*.local.md` warn/block rules | `hooks/rule_runner.cjs` |
| transcript_matcher.cjs | Read last 200 lines of transcript, classify into 4 signal types | `hooks/transcript_matcher.cjs` |
| lessons_ranker.cjs | CLI: score lessons by frequency+recency+severity, archive by milestone | `hooks/lessons_ranker.cjs` |

## Pattern Overview

**Overall:** Orchestrator-of-orchestrators plugin pattern

**Key Characteristics:**
- Skills are pure Markdown instruction documents (SKILL.md); Claude interprets them as execution directives — no compiled code runs in the skill layer itself.
- Each skill calls exactly one external Skill at its terminal step (GSD, Superpowers, or another sg-* skill) — no two terminal calls in the same skill.
- HANDOFF.md is an append-only audit log. Every sg-* command that triggers a stage transition appends exactly one row before invoking its terminal Skill. This is the single source of truth for current workflow stage.
- Hooks are the only always-running code: Node.js .cjs files evaluated on Claude Code lifecycle events, with no side effects when `auto_advance: false` in `.planning/config.json`.

## Layers

**Skills Layer:**
- Purpose: Define the `/super-gsd:sg-*` slash commands as Markdown instruction documents
- Location: `skills/sg-*/SKILL.md`
- Contains: YAML frontmatter (name, description, argument-hint), `<language>` directive, `<objective>`, `<execution_context>`, `<process>` (bash + prose), `<success_criteria>`
- Depends on: GSD skills, Superpowers skills, hooks/lessons_ranker.cjs, .planning/ artifacts
- Used by: Claude Code skill dispatch mechanism

**Mirror Layer (.agents/skills/):**
- Purpose: Identical copies of a subset of skills for agent/Codex/Gemini platform compatibility
- Location: `.agents/skills/sg-*/SKILL.md`
- Contains: 11 skills mirrored: sg-execute, sg-learn, sg-next, sg-parallel-execute, sg-plan, sg-retro, sg-review, sg-setup, sg-ship, sg-start, sg-status
- Depends on: Must stay in sync with `skills/` — any drift is flagged at code review
- Used by: Codex, Gemini, and other agent platforms

**Hooks Layer:**
- Purpose: Event-driven automation glued to Claude Code lifecycle
- Location: `hooks/`
- Contains: `stop_hook.cjs`, `rule_runner.cjs`, `transcript_matcher.cjs`, `lessons_ranker.cjs`
- Depends on: `.planning/config.json` (auto_advance flag), `.claude/sg-rule.*.local.md` (rule files), `.planning/lessons/` (for ranker CLI)
- Used by: Claude Code hook system (registered in `hooks/hooks.json`)

**Rules Layer:**
- Purpose: Project-specific PreToolUse guardrails that warn or block dangerous operations
- Location: `.claude/sg-rule.*.local.md`
- Contains: YAML frontmatter (name, enabled, event, pattern/conditions, action) + Markdown body (warning message)
- Depends on: `hooks/rule_runner.cjs` for evaluation
- Used by: rule_runner.cjs on every PreToolUse event

**Planning Artifacts Layer:**
- Purpose: Persistent state and audit trail for the GSD workflow
- Location: `.planning/`
- Contains: STATE.md (current phase/milestone), HANDOFF.md (append-only audit log), ROADMAP.md, lessons/*, phases/<N>-*/
- Depends on: Nothing (pure data)
- Used by: All sg-* skills (read-only for most; sg-retro, sg-ship, sg-plan write to it)

## Data Flow

### Primary Workflow Path (Phase Execution Cycle)

1. `/super-gsd:sg-plan <N>` — inject lessons via `hooks/lessons_ranker.cjs`, spawn subagent for gsd-discuss-phase, then `Skill(gsd-plan-phase, N)` → writes HANDOFF row `To: gsd-plan`
2. `/super-gsd:sg-execute` — read phase PLANs, detect parallel groups (`wave:` fields), append HANDOFF row `To: superpowers|parallel`, then `Skill(superpowers:executing-plans, prompt)` or `Skill(sg-parallel-execute, groups_json_file)`
3. `/super-gsd:sg-review` — derive git range, append HANDOFF row `To: review`, then `Skill(superpowers:requesting-code-review, context)`
4. `/super-gsd:sg-learn` — thin pass-through → `Skill(sg-retro, args)` — sg-retro writes `.planning/lessons/{NN}-{date}.md` and appends HANDOFF row `To: sg-retro`
5. `/super-gsd:sg-ship` — append HANDOFF row `To: ship`, then `Skill(gsd-ship, phase)`
6. `/super-gsd:sg-complete` — archive lessons via `lessons_ranker.cjs --archive`, append HANDOFF row `To: complete`, then `Skill(gsd-complete-milestone, vX.Y)`

### Stop Hook Signal Detection Path

1. Claude session ends (Stop/SubagentStop event)
2. `hooks/stop_hook.cjs` reads stdin JSON (contains `transcript_path`)
3. Calls `hooks/transcript_matcher.cjs:detectSignal(transcriptPath)` — scans last 200 lines for 4 signal sets
4. Returns `{ systemMessage: "... Run /super-gsd:sg-[cmd] ..." }` to guide the user to the next step
5. Returns `{}` (no-op) if no signal detected or `auto_advance: false`

### Rule Evaluation Path

1. User runs any Bash/Edit/Write/MultiEdit tool
2. `hooks/rule_runner.cjs` reads stdin JSON (tool_name + tool_input)
3. Globs `.claude/sg-rule.*.local.md`, parses YAML frontmatter + message body
4. Evaluates all matching conditions; on match: returns `{ systemMessage }` (warn) or `{ permissionDecision: 'deny', systemMessage }` (block)

### Lessons Injection Path (sg-plan + sg-execute)

```
.planning/lessons/*.md
      ↓
hooks/lessons_ranker.cjs --top 5 (frequency × 0.4 + recency × 0.4 + severity × 0.2)
      ↓
Weighted top-N printed before planning step
```

### HANDOFF.md Stage Detection (sg-status, sg-next)

```
.planning/HANDOFF.md  →  last data row  →  To column  →  STAGE_RAW
                                                              ↓
                                               Storage enum → Display enum
                       (sg-next meta-row → recover from FROM column)
```

**State Management:**
- Current stage: last row `To` column of `.planning/HANDOFF.md` (append-only, never modified)
- Current phase: `Phase:` field in `.planning/STATE.md` YAML frontmatter
- auto_advance toggle: `.planning/config.json` `super_gsd.auto_advance` boolean (default true)

## Key Abstractions

**HANDOFF.md Audit Log:**
- Purpose: Append-only 6-column pipe-delimited Markdown table tracking every stage transition
- Location: `.planning/HANDOFF.md`
- Schema: `| Timestamp | Phase | From | To | Plan Hash | User |`
- Pattern: Every sg-* command that causes a stage transition appends exactly one row immediately before invoking its terminal Skill. The `To` column determines current stage for all status/routing logic.

**Stage Enum (storage):**
- Values: `init`, `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `ship`, `complete`, `sg-next`
- `sg-next` is a meta-transition marker — routing reads `From` column instead
- Display enum collapses `ui-plan`/`gsd-plan` → `gsd`; `superpowers`/`parallel`/`execute`/`review` → `superpowers`

**Plan Hash:**
- Purpose: 7-char SHA256 of concatenated `*-PLAN.md` bodies — idempotency guard for sg-execute
- Pattern: If current phase already has a `superpowers|parallel` row with matching hash, sg-execute skips re-handoff

**Parallel Groups JSON:**
- Purpose: Computed by sg-execute when PLAN.md files contain `wave:` fields; saved to `.planning/phases/<N>-*/parallel_groups.json`
- Pattern: `[{ "wave": N, "plans": ["xx-PLAN.md"], "merged": bool }, ...]` — sg-parallel-execute reads this to dispatch Task() agents

**D-07 Block Replication:**
- Purpose: STATE.md Phase parsing and HANDOFF.md stage detection logic is replicated verbatim across sg-status, sg-next, sg-start, sg-retro (comment block delimiters enforce identity)
- Constraint: When changing the parsing block, ALL skills containing it must be updated simultaneously

## Entry Points

**User-facing slash commands (Claude Code):**
- Location: `skills/sg-*/SKILL.md` — 21 skills registered via `plugin.json` → `"skills": "./skills/"`
- Triggers: User types `/super-gsd:sg-<name>` in Claude Code
- Responsibilities: Each skill is its own entry point with isolated logic

**Hook entry points:**
- `hooks/stop_hook.cjs` — triggered by Claude Code on Stop/SubagentStop events
- `hooks/rule_runner.cjs` — triggered by Claude Code on every PreToolUse event
- Registered via: `hooks/hooks.json` (Claude Code), `.codex/hooks.json` (Codex), `.gemini/settings.json` (Gemini)

**CLI entry point:**
- `bin/setup.js` — `npx @gyuha/super-gsd install` — copies hooks + .agents + .codex to a target project

## Architectural Constraints

- **No shared state in hooks:** Each hook invocation reads fresh from filesystem; no module-level mutable state.
- **Terminal Skill pattern:** Each sg-* skill delegates to exactly one external Skill as its final step. Code after `Skill(...)` does not execute — session control transfers.
- **Append-only invariant:** `.planning/HANDOFF.md` rows are never modified or deleted. All reads use tail-based parsing.
- **D-07 replication lock:** STATE.md Phase parsing block and HANDOFF.md stage detection block are duplicated verbatim in multiple SKILL.md files. Drift between copies is a blocker at code review.
- **macOS/BSD compatibility:** No `grep -P` (PCRE), no pipe-delimited awk table parsing. All Bash uses `-E` (ERE) and `cut -d'|'` or `awk -F'|'` patterns.
- **Idempotency:** sg-execute uses Plan Hash to skip duplicate handoff rows. sg-plan uses HANDOFF.md to skip duplicate `gsd-plan` rows. sg-next skips HANDOFF append for `complete`/`init` until user confirms.
- **auto_advance guard:** Both `stop_hook.cjs` and `rule_runner.cjs` check `.planning/config.json` `super_gsd.auto_advance` at startup and exit cleanly if false.

## Anti-Patterns

### Passing phase number to gsd-complete-milestone

**What happens:** Calling `gsd-complete-milestone` with a bare phase number instead of a `vX.Y` version string.
**Why it's wrong:** gsd-complete-milestone uses the argument as a milestone version tag — passing `39` produces a broken `v39` tag/archive rather than closing the correct milestone.
**Do this instead:** Use `sg-complete` which detects argument shape: bare number → `sg-phase complete N`; `vX.Y` → `gsd-complete-milestone vX.Y` (`skills/sg-complete/SKILL.md`)

### awk `{print $1}` on raw STATE.md Phase line

**What happens:** Piping `grep '^Phase:'` output directly into `awk '{print $1}'` without stripping the `Phase:` prefix first.
**Why it's wrong:** Returns the literal string "Phase" instead of the phase number when the line is `Phase: Phase 22 (Not started...)`.
**Do this instead:** Use the D-07 three-step pipeline: `grep -E '^Phase:' | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//'` (enforced by `.claude/sg-rule.state-phase-awk.local.md`)

### Modifying plugin.json without `"skills"` field

**What happens:** Editing `plugin.json` and omitting the `"skills": "./skills/"` field.
**Why it's wrong:** Claude Code uses this field to register all `/super-gsd:sg-*` slash commands — removing it silently breaks all skill dispatch.
**Do this instead:** Keep `"skills": "./skills/"` in every plugin.json write (enforced by `.claude/sg-rule.plugin-json-skills.local.md`)

### Updating only `skills/` without updating `.agents/skills/`

**What happens:** Modifying a SKILL.md in `skills/sg-*/` without applying the same change to the mirror in `.agents/skills/sg-*/SKILL.md`.
**Why it's wrong:** Codex/Gemini/agent platforms use `.agents/skills/` and will get stale behavior.
**Do this instead:** Treat `skills/sg-X/SKILL.md` and `.agents/skills/sg-X/SKILL.md` as a mandatory pair — list both in every plan task and both in every PR diff.

## Error Handling

**Strategy:** Fail-fast with explicit messages, exit 1, no silent fallback.

**Patterns:**
- Phase resolution failure: print exact usage line (`Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-<cmd> <phase>`), exit 1.
- Hook errors: caught in `try/catch`, emit `{ systemMessage: "super-gsd hook error: ..." }`, always call `process.exit(0)` (hooks must not crash Claude Code).
- Bad regex in rules: swallowed silently (`try/catch` in `_matchCondition`) — rule is treated as non-matching.
- Missing HANDOFF.md: auto-initialized with header row by any skill that writes to it.

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Skills print progress lines (`[sg-plan] Step 1/2: ...`). Hooks write errors to stdout as JSON `systemMessage`.
**Validation:** Input validation done inline in each skill's bash block with `grep -qE` pattern checks. Phase numbers validated as `^[0-9]+(\.[0-9]+)?$`.
**Authentication:** None — all operations are local filesystem + git. External skills (GSD, Superpowers) handle their own auth.

---

*Architecture analysis: 2026-05-29*
