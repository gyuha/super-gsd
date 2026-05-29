<!-- refreshed: 2026-05-29 -->
# Architecture

**Analysis Date:** 2026-05-29

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        User / Claude Code Session                    │
│                  /super-gsd:sg-* slash commands                      │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  Skill() dispatch
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Skills Layer                                 │
│  `skills/sg-*/SKILL.md`  ·  `.agents/skills/sg-*/SKILL.md`          │
│                                                                      │
│  sg-plan  sg-execute  sg-parallel-execute  sg-review  sg-learn      │
│  sg-retro sg-ship     sg-complete          sg-next     sg-status     │
│  sg-start sg-new      sg-quick             sg-ui-plan  sg-setup      │
│  sg-update sg-health  sg-phase             sg-explore  sg-lessons    │
│  sg-cleanup                                                          │
└────┬───────────┬──────────────────┬──────────────────────────────────┘
     │ Agent()   │ Skill() delegate  │ Bash
     │           ▼                   │
     │  ┌─────────────────────┐      │  delegates to external skills
     │  │ GSD Skill           │      ├→ gsd-discuss-phase, gsd-plan-phase
     │  │ (gsd-*)             │      ├→ superpowers:executing-plans
     │  └─────────────────────┘      ├→ superpowers:requesting-code-review
     │                               ├→ superpowers:brainstorming
     │                               └→ sg-retro, gsd-ship, gsd-complete-milestone
     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Hooks Layer                                  │
│  `hooks/stop_hook.cjs`        Stop / SubagentStop events             │
│  `hooks/rule_runner.cjs`      PreToolUse events                      │
│  `hooks/transcript_matcher.cjs`  Signal detection (lib)              │
│  `hooks/lessons_ranker.cjs`   CLI — lessons scoring                  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ reads
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Planning Artifacts (Data Layer)                   │
│                                                                      │
│  `.planning/HANDOFF.md`       append-only audit log                  │
│  `.planning/STATE.md`         current phase / milestone              │
│  `.planning/ROADMAP.md`       phase definitions + success criteria   │
│  `.planning/lessons/*.md`     retrospective outputs                  │
│  `.planning/phases/NN-*/`     per-phase CONTEXT/PLAN/SUMMARY         │
│  `.planning/config.json`      runtime toggles (auto_advance etc.)   │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File(s) |
|-----------|----------------|---------|
| Skills Layer | Defines slash commands as markdown instruction files | `skills/sg-*/SKILL.md` |
| .agents mirror | Identical skills for Codex / multi-agent contexts | `.agents/skills/sg-*/SKILL.md` |
| stop_hook.cjs | Detects workflow completion, emits `systemMessage` next-step | `hooks/stop_hook.cjs` |
| rule_runner.cjs | Evaluates sg-rule files on PreToolUse; warn or block | `hooks/rule_runner.cjs` |
| transcript_matcher.cjs | Reads last 200 lines of transcript, returns signal enum | `hooks/transcript_matcher.cjs` |
| lessons_ranker.cjs | CLI: ranks lessons by frequency × recency × severity | `hooks/lessons_ranker.cjs` |
| HANDOFF.md | Append-only 6-column audit log; source of truth for current stage | `.planning/HANDOFF.md` |
| STATE.md | YAML frontmatter + prose; source of truth for current phase | `.planning/STATE.md` |
| config.json | `super_gsd.auto_advance` toggle; disables hooks when false | `.planning/config.json` |
| plugin.json | Claude Code plugin manifest; declares `skills` directory | `.claude-plugin/plugin.json` |
| hooks.json | Hook event → command mapping for Claude Code | `hooks/hooks.json` |
| .codex/hooks.json | Hook event → command mapping for Codex | `.codex/hooks.json` |
| .gemini/settings.json | Hook event → command mapping for Gemini CLI | `.gemini/settings.json` |
| bin/setup.js | `npx @gyuha/super-gsd install` — copies hooks/.agents/.codex into target | `bin/setup.js` |
| sg-rule files | YAML-frontmatter Markdown rules consumed by rule_runner | `.claude/sg-rule.*.local.md` |

## Pattern Overview

**Overall:** Two-layer orchestrator — Skills (Claude-interpreted markdown instructions) on top, Hooks (Node.js event handlers) on the bottom. Skills orchestrate multi-tool workflows; hooks provide ambient signaling between sessions.

**Key Characteristics:**
- Skills are pure markdown; Claude Code interprets them as imperative instructions at runtime — no transpilation or build step.
- Hooks run as child processes (`node hooks/*.cjs`) invoked by Claude Code on lifecycle events; they communicate via stdin/stdout JSON.
- The append-only HANDOFF.md is the only shared mutable state between skill runs; STATE.md is the phase identity register.
- The same skill logic is duplicated in `skills/` (Claude Code) and `.agents/skills/` (Codex / other agents) — updates must be applied to both.

## Layers

**Skills Layer:**
- Purpose: Define the 21 `/super-gsd:sg-*` slash commands as executable markdown instruction sets
- Location: `skills/sg-*/SKILL.md` (primary), `.agents/skills/sg-*/SKILL.md` (Codex mirror)
- Contains: YAML frontmatter (name, description, argument-hint), `<language>`, `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` blocks
- Depends on: Planning Artifacts (HANDOFF.md, STATE.md, ROADMAP.md, lessons/), external GSD/Superpowers skills via `Skill()` calls, `hooks/lessons_ranker.cjs` for lesson injection
- Used by: Claude Code (interprets as slash command definitions), .agents/ runtime

**Hooks Layer:**
- Purpose: Intercept Claude Code lifecycle events and inject workflow guidance or enforce rules
- Location: `hooks/*.cjs`
- Contains: Node.js CommonJS modules; each is standalone (no inter-hook imports except stop_hook → transcript_matcher)
- Depends on: `.planning/HANDOFF.md` (last row read), `.planning/config.json` (auto_advance guard), `CLAUDE_PLUGIN_ROOT` env var
- Used by: Claude Code (PreToolUse, Stop, SubagentStop events per `hooks/hooks.json`)

**Planning Artifacts (Data Layer):**
- Purpose: Persist workflow state across sessions; serve as context for skills and hooks
- Location: `.planning/`
- Contains: HANDOFF.md, STATE.md, ROADMAP.md, config.json, lessons/*.md, phases/NN-*/
- Depends on: Nothing (leaf layer; all writes originate from skills)
- Used by: Every skill and hook reads from here; skills write via Edit/Write tools

**Rule Files:**
- Purpose: Guard against known mistake patterns at PreToolUse time
- Location: `.claude/sg-rule.*.local.md`
- Contains: YAML frontmatter (name, enabled, event, pattern/conditions, action) + markdown warning body
- Depends on: rule_runner.cjs (evaluates the files)
- Used by: rule_runner.cjs on every Bash/Edit/Write/MultiEdit call

## Data Flow

### Primary Workflow Path (Phase Execution Cycle)

1. User invokes `/super-gsd:sg-plan <N>` → `skills/sg-plan/SKILL.md` executes
2. sg-plan calls `lessons_ranker.cjs --top 5` to inject prior lessons, then spawns `Agent(gsd-discuss-phase)` and delegates to `Skill(gsd-plan-phase)`. Appends `gsd-plan` row to `.planning/HANDOFF.md`.
3. GSD plan-phase completes → `stop_hook.cjs` detects `gsd-plan-complete` signal via `transcript_matcher.cjs` → emits `systemMessage` directing user to run `sg-execute`.
4. User invokes `/super-gsd:sg-execute` → `skills/sg-execute/SKILL.md` executes
5. sg-execute reads `.planning/phases/NN-*/*-PLAN.md`, computes plan hash, checks HANDOFF.md idempotency, appends `superpowers` row, then calls `Skill(superpowers:executing-plans)` (or `sg-parallel-execute` if wave fields detected).
6. Superpowers completes → `stop_hook.cjs` detects `superpowers-implementation-complete` → directs user to `sg-review`.
7. `/super-gsd:sg-review` → calls `Skill(superpowers:requesting-code-review)` with git range context. Appends `review` row.
8. Review completes → `stop_hook.cjs` detects `superpowers-review-complete` → directs user to `sg-learn`.
9. `/super-gsd:sg-learn` → calls `Skill(sg-retro)`. Retrospective writes `.planning/lessons/NN-YYYY-MM-DD.md`.
10. sg-retro completes → `stop_hook.cjs` detects `sg-retro-complete` → directs user to `sg-ship`.
11. `/super-gsd:sg-ship` → calls `Skill(gsd-ship)`. Appends `ship` row.

```
sg-plan → [Agent: gsd-discuss-phase] → Skill(gsd-plan-phase)
    ↓ HANDOFF row: gsd-plan
stop_hook → "run sg-execute"
    ↓
sg-execute → Skill(superpowers:executing-plans)
    ↓ HANDOFF row: superpowers
stop_hook → "run sg-review"
    ↓
sg-review → Skill(superpowers:requesting-code-review)
    ↓ HANDOFF row: review
stop_hook → "run sg-learn"
    ↓
sg-learn → Skill(sg-retro) → .planning/lessons/
    ↓ HANDOFF row: sg-retro
stop_hook → "run sg-ship"
    ↓
sg-ship → Skill(gsd-ship)
    ↓ HANDOFF row: ship
```

### Parallel Execution Path

When PLAN.md files contain `wave:` fields forming 2+ independent groups, `sg-execute` detects them and routes to `sg-parallel-execute` instead of `superpowers:executing-plans`. `sg-parallel-execute` dispatches up to 3 concurrent `Task()` agents per wave, processes waves sequentially (wave number = dependency barrier), and appends `parallel` to HANDOFF.md.

### Automatic Advance (Hook-Driven)

`stop_hook.cjs` runs on every Stop/SubagentStop event. It reads the transcript path from stdin, passes it to `transcript_matcher.cjs`, which scans the last 200 lines for signal strings. The four signals and their responses:

| Signal detected | `systemMessage` |
|-----------------|-----------------|
| `gsd-plan-complete` | Run `/super-gsd:sg-execute` |
| `superpowers-implementation-complete` | Run `/super-gsd:sg-review` |
| `superpowers-review-complete` | Run `/super-gsd:sg-learn` |
| `sg-retro-complete` | Run `/super-gsd:sg-ship` |

Hook is disabled when `.planning/config.json` has `super_gsd.auto_advance: false`.

### Lessons Feedback Loop

`lessons_ranker.cjs` scores `.planning/lessons/*.md` entries by `0.4 × frequency_norm + 0.4 × recency + 0.2 × severity`. `sg-plan` and `sg-execute` call it via `--top 5` before each invocation, injecting the ranked patterns as reminders into the session context.

### Stage State Machine

HANDOFF.md `To` column drives the stage state machine. `sg-status` and `sg-next` read the last data row to determine the current stage and route to the correct next command.

```
init → gsd-plan → superpowers/parallel → review → sg-retro → ship → complete → (new milestone)
                                  ↑
                             ui-plan (branch from init, same next-cmd as gsd-plan)
                                  ↑
                            execute (legacy; maps to superpowers display)
```

Stage-to-next-command routing table (locked as D-03; must be updated identically in `sg-status`, `sg-next`):

| Storage enum | Next command |
|--------------|-------------|
| `init` | `/super-gsd:sg-plan [N]` |
| `gsd-plan` | `/super-gsd:sg-execute` |
| `ui-plan` | `/super-gsd:sg-execute` |
| `superpowers` | `/super-gsd:sg-review` |
| `parallel` | `/super-gsd:sg-review` |
| `execute` | `/super-gsd:sg-review` |
| `review` | `/super-gsd:sg-learn` |
| `sg-retro` | `/super-gsd:sg-ship` |
| `ship` | `/super-gsd:sg-plan N+1` or `/super-gsd:sg-complete` |
| `complete` | `/super-gsd:sg-new` |

## Key Abstractions

**SKILL.md (Skill Definition):**
- Purpose: A markdown file Claude Code interprets as an executable instruction set for a slash command
- Examples: `skills/sg-plan/SKILL.md`, `skills/sg-execute/SKILL.md`
- Pattern: YAML frontmatter (name, description, argument-hint) + `<language>` + `<objective>` + `<execution_context>` + `<process>` + `<success_criteria>` blocks. The `<process>` block is the imperative script Claude follows.

**HANDOFF.md (Audit Log):**
- Purpose: Append-only pipe-delimited table; single source of truth for current workflow stage
- Location: `.planning/HANDOFF.md`
- Pattern: 6 columns — `| Timestamp | Phase | From | To | Plan Hash | User |`. Never modified in place; new rows appended only. The last data row `To` column determines current stage.

**sg-rule File (Rule):**
- Purpose: Warn or block a tool call when a condition matches; consumed by `rule_runner.cjs`
- Examples: `.claude/sg-rule.warn-handoff-single-condition.local.md`
- Pattern: YAML frontmatter with `name`, `enabled`, `event` (bash|file|all), `pattern` or `conditions[]`, `action` (warn|block), followed by markdown body that becomes the warning message.

**Signal String (Transcript Signal):**
- Purpose: Plain text patterns in the transcript that `transcript_matcher.cjs` uses to detect stage transitions
- Examples: `'plan-phase complete'`, `'finishing-a-development-branch'`, `'review complete'`, `'## Lens:'`
- Pattern: Defined as string arrays in `hooks/transcript_matcher.cjs` lines 5–25; no regex, exact substring match.

## Entry Points

**Slash Commands (primary):**
- Location: `skills/sg-*/SKILL.md`
- Triggers: User types `/super-gsd:sg-<name>` in Claude Code
- Responsibilities: Orchestrates the full workflow step for that stage

**Hook Events (ambient):**
- Location: `hooks/hooks.json` → `hooks/stop_hook.cjs` (Stop/SubagentStop), `hooks/rule_runner.cjs` (PreToolUse)
- Triggers: Automatically by Claude Code on session stop and before each tool call
- Responsibilities: Detect completion signals; emit next-step guidance; enforce rules

**npx Installer:**
- Location: `bin/setup.js`
- Triggers: `npx @gyuha/super-gsd install` run in a target project
- Responsibilities: Copies `hooks/`, `.agents/`, `.codex/` from npm package into the target project root

## Architectural Constraints

- **No shared modules between hooks (except transcript_matcher):** Each `.cjs` file is standalone to simplify deployment. `stop_hook.cjs` imports `transcript_matcher.cjs` via `require('./transcript_matcher.cjs')`. All other hooks have no inter-hook dependencies.
- **Python-compatible JSON serialization:** `stop_hook.cjs` and `rule_runner.cjs` hand-roll a `_pyJsonDumps()` function to produce byte-identical output to Python's `json.dumps()` defaults. This parity was required when the hooks were ported from Python (v2.4).
- **Skill duplication constraint:** `skills/sg-*/SKILL.md` and `.agents/skills/sg-*/SKILL.md` must remain in sync. Changing one without the other is flagged as a blocker in code review (Phase 32 Medium-1). Not all 21 skills have a `.agents/` mirror — only the 11 listed in `.agents/skills/`.
- **HANDOFF.md append-only:** No skill or hook ever modifies existing rows. New transitions are always appended. `stop_hook.cjs` reads only the last row.
- **Stage enum lock (D-03):** The 10 storage enum values (`init`, `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `ship`, `complete`) and the routing table must be updated simultaneously in `skills/sg-status/SKILL.md` and `skills/sg-next/SKILL.md`. They are marked with `# --- BEGIN/END ... block (D-07) ---` comments.
- **macOS/BSD shell compatibility:** No `grep -P` (PCRE); use `-E` (ERE). No awk pipe-parsing of markdown tables. `shasum -a 256` with `sha256sum` fallback.
- **`auto_advance` guard:** Both `stop_hook.cjs` and `rule_runner.cjs` check `config.json` `super_gsd.auto_advance` at startup. If false, they emit `{}` and exit immediately.

## Anti-Patterns

### Single-condition HANDOFF.md initialization

**What happens:** `if [ ! -f "$HANDOFF_FILE" ]; then` — only checks file existence.
**Why it's wrong:** A file can exist but have no header row (e.g. empty or corrupted). The guard fails to re-initialize, causing append failures.
**Do this instead:** `if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then` — enforced by `.claude/sg-rule.warn-handoff-single-condition.local.md`.

### Updating only skills/ without .agents/skills/

**What happens:** A skill in `skills/sg-X/SKILL.md` is updated but `.agents/skills/sg-X/SKILL.md` is not.
**Why it's wrong:** Codex and multi-agent runners use `.agents/skills/` — the update silently takes no effect in those contexts.
**Do this instead:** Always update both files in the same commit. Any plan touching `skills/*/SKILL.md` must explicitly list the corresponding `.agents/skills/*/SKILL.md` path.

### Using `grep -P` in hook/skill bash snippets

**What happens:** `grep -P` for PCRE patterns in Bash blocks inside SKILL.md files.
**Why it's wrong:** macOS ships BSD grep, which does not support `-P`. The command silently fails or errors.
**Do this instead:** Use `grep -E` (ERE) for extended regular expressions.

## Error Handling

**Strategy:** Hooks always exit 0 and write a JSON response (even on error). Skills use `exit 1` with an explicit error message to halt execution cleanly.

**Patterns:**
- Hooks: `try/catch` around all logic; on exception, emit `{ systemMessage: "super-gsd hook error: ..." }` to stdout, then `process.exit(0)`.
- Skills: Guard clauses with explicit messages (e.g. `"Could not resolve current phase. Pass phase number explicitly: ..."`) followed by `exit 1`.
- Idempotency: `sg-execute` checks plan hash against the last HANDOFF.md row; identical hash → skip with message, no re-invocation.
- `auto_advance` guard: hooks emit `{}` and exit 0 immediately when disabled — no output to Claude at all.

## Cross-Cutting Concerns

**Language detection:** Every SKILL.md includes a `<language>` block directing Claude to respond in the user's input language. Command names, enums, file paths, and timestamps stay verbatim in English regardless of language.
**Lessons injection:** `sg-plan` and `sg-execute` both call `lessons_ranker.cjs --top 5` before their main logic to surface prior learnings.
**HANDOFF.md audit:** Every state transition (plan, execute, review, retro, ship, complete) appends a row. `sg-next` appends a `sg-next` meta-row and uses the `From` column on scan-back to recover the actual preceding stage.

---

*Architecture analysis: 2026-05-29*
