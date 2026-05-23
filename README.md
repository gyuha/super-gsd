# super-gsd

Orchestrator plugin that auto-chains GSD → Superpowers → sg-retro so planning, implementation, and retrospection stay connected as a single learning loop.

## What this is

`super-gsd` is a Claude Code plugin whose only job is to keep GSD, Superpowers, and the built-in `sg-retro` skill talking to each other. Strategy lives in GSD. Implementation lives in Superpowers. Retrospection lives in `sg-retro`. When one of them finishes a stage, `super-gsd` is responsible for handing the context to the next one — so the user does not have to remember which command comes next, and so lessons learned in one cycle actually reach the next plan.

The problem this solves is that manual handoff between these three tools is fragile. People forget to run the review, skip the retro, lose context between sessions, or re-run a planning command that overwrites half-finished work. By separating roles and then orchestrating the seams between them, the same mistakes stop showing up.

All sixteen slash commands covering the full GSD → Superpowers → sg-retro cycle are available — from starting a new milestone to closing it out and beginning the next. Use `sg-next` at any point to auto-detect the current stage and invoke the next command without having to remember it. See the **Commands** section below for the quick-reference table, and `docs/COMMANDS.md` for the full per-command reference.

## Workflow

```
sg-new/sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship → sg-complete
                                  ↑                                    |                      ↓
                                  └──── lessons auto-injected ←────────┘               → sg-new
                                        (.planning/lessons/ + sg-lessons)          (next milestone)
```

`sg-status` can be run at any point to check current position. `sg-quick` handles one-off tasks outside the main flow.

## Commands

Quick reference for all `/super-gsd:sg-*` slash commands.

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/super-gsd:sg-start` | Scaffold a new project or milestone via `gsd-new-project` | At the very beginning of a new project or milestone |
| `/super-gsd:sg-explore` | Map and analyse the codebase via `gsd-map-codebase` | After `sg-start`, before planning |
| `/super-gsd:sg-plan` | Gather phase context then create an execution plan (2-step chain: `gsd-discuss-phase` → `gsd-plan-phase`) | After `sg-explore`, when ready to plan |
| `/super-gsd:sg-ui-plan` | UI 설계 전용 brainstorming — `superpowers:brainstorming`을 직접 실행한다 | sg-plan에서 Visual Companion 없이 진행했지만 UI 설계가 필요할 때 |
| `/super-gsd:sg-execute` | Package the current phase plan and hand off to Superpowers (`superpowers:executing-plans`) | After `sg-plan` is complete |
| `/super-gsd:sg-review` | Request a code review via `superpowers:requesting-code-review` | After implementation is complete |
| `/super-gsd:sg-learn` | Run a retrospective via `sg-retro` to extract patterns and generate hooks | After the review is done |
| `/super-gsd:sg-lessons` | List prior lessons from `.planning/lessons/`; accepts optional phase filter | Before `sg-plan` to review what was learned |
| `/super-gsd:sg-ship` | Merge and ship the current phase via `gsd-ship` | After learning is captured |
| `/super-gsd:sg-complete` | Archive and close the current milestone via `gsd-complete-milestone` | After all phases are shipped |
| `/super-gsd:sg-new` | Start a new milestone via `gsd-new-milestone` | After `sg-complete`, to begin the next milestone |
| `/super-gsd:sg-next` | Detect the current workflow stage from HANDOFF.md and STATE.md and immediately invoke the next sg-* command — no confirmation required | Any time you want to auto-advance to the next step without remembering the command |
| `/super-gsd:sg-status` | Show current stage, last handoff timestamp, and next recommended command | At any point to check where you are |
| `/super-gsd:sg-update` | Check, install, or update GSD, superpowers, and super-gsd (installs missing tools automatically) | When you want to install or update all workflow tools at once |
| `/super-gsd:sg-quick` | Execute a small, ad-hoc task with GSD guarantees (plan + execute + commit) | For one-off tasks outside the main phase workflow |
| `/super-gsd:sg-health` | Self-diagnose the installation: GSD/Superpowers presence, hook registration, HANDOFF.md schema | When something feels broken or after a fresh install |

See [docs/COMMANDS.md](./docs/COMMANDS.md) for the full per-command reference including arguments and detailed descriptions.

## Phase management (add / insert / remove / edit)

`super-gsd` does not wrap GSD's phase CRUD operations — they are invoked directly through GSD's own `/gsd:phase` command. All four modes share the same command, routed by a flag.

| Flag | Action | When to use |
|------|--------|-------------|
| (none) | Add a new integer phase at the end of the current milestone | Planning the next planned phase normally |
| `--insert <N> <description>` | Insert a decimal phase (e.g. `7.1`) after Phase N — no renumbering of existing phases | Urgent work discovered mid-milestone that cannot wait for the next milestone |
| `--remove <N>` | Remove a future (unstarted) phase and renumber subsequent phases | Cancelling a planned phase before any work has begun |
| `--edit <N>` | Edit fields (Goal / Requirements / Plans / etc.) of an existing phase in place | Correcting scope or metadata without renumbering |

**Inserting a phase mid-milestone:**

```shell
/gsd:phase --insert 7 critical auth bypass fix
# → creates Phase 7.1 with (INSERTED) marker in ROADMAP.md
# → creates .planning/phases/7.1-critical-auth-bypass-fix/
# → updates STATE.md to point next steps at 7.1
```

Subsequent inserts after the same anchor produce `7.2`, `7.3`, etc. — integer phase numbers are preserved so existing references and dependencies stay intact. After insertion, drive the new phase through the standard `sg-plan` → `sg-execute` → `sg-review` → `sg-learn` → `sg-ship` chain like any other phase.

**Anti-patterns (rejected by GSD):**

- Don't use `--insert` for planned work at the end of a milestone — use the no-flag form instead.
- Don't insert before Phase 1 (`Phase 0.1` is not allowed).
- Don't try to renumber existing integer phases — the decimal scheme exists precisely to avoid that.

## Usage Examples

### End-to-End Workflow

The typical flow for adding a new feature milestone to an existing project (e.g., adding a payment module to `my-saas-app`):

```shell
# 1. Start a new milestone — scaffolds .planning/ context for "payment module"
/super-gsd:sg-start add payment module

# 2. Explore the codebase — maps existing code so the plan is grounded in reality
/super-gsd:sg-explore

# 3. Plan the phase — reviews prior lessons, then runs gsd-discuss-phase → gsd-plan-phase
/super-gsd:sg-plan

# 4. Execute — hands the finished plan to Superpowers for implementation
/super-gsd:sg-execute

# ... Superpowers implements the payment module across one or more sessions ...

# 5. Review — requests a Superpowers code review when implementation is complete
/super-gsd:sg-review

# 6. Learn — runs sg-retro retrospective; findings are saved to .planning/lessons/
/super-gsd:sg-learn

# 7. Ship — merges the phase via gsd-ship (repeat steps 3–7 for each phase)
/super-gsd:sg-ship

# 8. Complete — archives and closes the milestone once all phases are done
/super-gsd:sg-complete

# 9. New — starts the next milestone
/super-gsd:sg-new
```

Each command hands context to the next automatically. You do not need to copy-paste state between steps.

### Individual Command Examples

**Check your current position at any time:**

```shell
/super-gsd:sg-status
```

**Review lessons from previous cycles before planning:**

```shell
# List all lessons
/super-gsd:sg-lessons

# Filter to a specific phase
/super-gsd:sg-lessons phase-03
```

**Update all workflow tools at once:**

```shell
/super-gsd:sg-update
```

**Run a small, one-off task outside the main workflow** (bug fix, doc update, config tweak):

```shell
/super-gsd:sg-quick fix null pointer in payment webhook handler
```

`sg-quick` wraps the task in a lightweight GSD plan-execute-commit cycle without starting a full milestone.

## Installation

**Step 1 — Install super-gsd:**

Run these two commands in your Claude Code session:

```
/plugin marketplace add gyuha/super-gsd
/plugin install super-gsd@super-gsd
```

The first command registers this repository as a self-hosted plugin marketplace. The second installs the `super-gsd` plugin from that marketplace.

**Step 2 — Install prerequisites with `sg-update`:**

Once super-gsd is loaded, run:

```
/super-gsd:sg-update
```

`sg-update` detects whether GSD and Superpowers are already installed and installs any that are missing. Running it on a fresh machine will install both automatically. On an existing setup it updates them to their latest versions.

Move on to **Verify install** once `sg-update` completes.

## Multi-Platform Support

super-gsd hooks work on Codex and Gemini/Antigravity CLI without the Claude Code plugin marketplace. Clone the repository manually — the hook configuration files are already in place.

### Feature Delta

| Feature | Claude Code | Codex | Gemini / Antigravity CLI |
|---------|:-----------:|:-----:|:------------------------:|
| `/sg-*` slash commands | ✅ | ❌ use `$sg-*` skills | ❌ use `$sg-*` skills |
| Stop hook auto-handoff | ✅ | ✅ `.codex/hooks.json` | ✅ `.gemini/settings.json` |
| SubagentStop hook | ✅ | ❌ not supported | ❌ not supported |
| PreToolUse / BeforeTool hook | ✅ | ✅ | ✅ |
| Superpowers integration | ✅ | ❌ | ❌ |
| AskUserQuestion UI | ✅ | ❌ numbered list fallback | ❌ numbered list fallback |
| 6 skills (sg-retro, sg-plan, sg-execute, etc.) | ✅ | ✅ via `.agents/skills/` | ✅ via `.agents/skills/` |

### Codex

```bash
git clone https://github.com/gyuha/super-gsd.git ~/super-gsd
cd your-project
# Copy hook config and hook scripts (both are required):
mkdir -p .codex
cp ~/super-gsd/.codex/hooks.json .codex/hooks.json
cp -r ~/super-gsd/hooks .
```

`.codex/hooks.json` registers Stop and PreToolUse hooks automatically. The `hooks/` directory contains the Python scripts that the hooks invoke — omitting it causes all hooks to fail silently. Use `$sg-retro`, `$sg-plan`, `$sg-execute`, `$sg-review`, `$sg-start`, `$sg-status` skill syntax. See `AGENTS.md` for the full workflow.

### Gemini / Antigravity CLI

Gemini CLI is supported. Antigravity CLI compatibility has not been independently verified — see `.planning/phases/15-platform-hooks-python-fix/15-01-VERIFICATION.md`.

```bash
git clone https://github.com/gyuha/super-gsd.git ~/super-gsd
cd your-project
# Copy hook config and hook scripts (both are required):
mkdir -p .gemini
cp ~/super-gsd/.gemini/settings.json .gemini/settings.json
cp -r ~/super-gsd/hooks .
```

`.gemini/settings.json` registers SessionEnd and BeforeTool hooks. The `hooks/` directory contains the Python scripts that the hooks invoke — omitting it causes all hooks to fail silently. Use `.agents/skills/` skills. See `AGENTS.md` for the full workflow.

## Prerequisites

`super-gsd` orchestrates three tools. `sg-update` (above) installs them automatically — this section is a reference for what each one does.

- **GSD** (`get-shit-done-cc`) — provides the `/gsd-*` planning commands and the `.planning/` directory convention this plugin reads from.
- **Superpowers** (`claude-plugins-official/superpowers`) — provides the `superpowers:*` skill tree used during the build / review stage.

### Optional

- **Hookify** (`claude-plugins-official/hookify`) — historical retrospection tool. `sg-learn` now routes to the built-in `sg-retro` skill; Hookify is no longer required.

`super-gsd` is non-invasive: it does not modify, fork, or replace any of these tools.

## Verify install

After installation, confirm `super-gsd` loaded cleanly and your existing tools still work.

1. Run `/plugin list` and confirm that `super-gsd` appears in the listing with name, version, and description matching `.claude-plugin/plugin.json`.
2. Run `/gsd-progress` (or any other GSD command) and confirm GSD responds normally — this proves GSD remains intact and unmodified.
3. Open the `Skill` tree and confirm that `superpowers:*` skills are still discoverable and invokable — this proves Superpowers remains intact and unmodified.

If all three checks pass, `super-gsd` is installed correctly and non-invasively.

## Roadmap

`super-gsd` ships in MVP vertical slices. Each phase delivers a coherent, testable user behavior.

- **Phase 1 — Plugin Scaffold (shipped):** installable plugin shell with manifest, marketplace metadata, README, and verify checklist. No commands or hooks yet.
- **Phase 2 — Manual Handoff & Status (shipped):** introduces `/super-gsd:sg-execute` (package a finished GSD phase as a Superpowers-ready prompt) and `/super-gsd:sg-status` (inspect current stage, last handoff, next recommended command).
- **Phase 3 — sg- Command Set & README (shipped):** delivers the full 14-command `sg-` interface and updated documentation so the entire GSD → Superpowers → sg-retro cycle has discoverable slash commands.
- **Phase 4 — Auto-Advance Hooks (shipped):** registers `Stop` hooks so stage transitions are auto-detected — completed `plan-phase` surfaces a handoff prompt, completed `code-reviewer` suggests Hookify via `systemMessage`.
- **Phase 5 — Lessons Feedback Loop (shipped):** persists Hookify findings into `.planning/lessons/` and surfaces them automatically when the next GSD phase begins, closing the learning loop.
- **Phase 6 — sg-health (shipped):** introduces `sg-health` self-diagnosis command — checks GSD/Superpowers installation, hook registration, and HANDOFF.md schema integrity with `[OK]`/`[WARN]`/`[FAIL]` output.
- **Phase 7 — Status Accuracy (shipped):** fixes `sg-status` STATE.md Phase line parsing and storage/display enum separation so the current workflow stage is always correctly shown.
- **Phase 8 — Session Restore (shipped):** `sg-start` detects an existing session and presents Resume / Start new milestone / Cancel so users can safely return after a break.
- **Phase 9 — sg-retro Skill Scaffold (shipped):** introduces the built-in `sg-retro` skill with 3 retrospection lenses; results are saved to `.planning/lessons/` without requiring Hookify.
- **Phase 10 — Conversation Analyzer + Lens Expansion (shipped):** adds a self-contained transcript analyzer that extracts frustration/correction/repeated/validated-success patterns, and expands to 6 total lenses (Sailboat, Five Whys, and more).
- **Phase 11 — Self-Contained Rule Runner (shipped):** registers a `PreToolUse` hook that runs `.claude/sg-rule.*.local.md` rules directly — Hookify is no longer required for guard execution.
- **Phase 12 — Lessons Aggregation & Recurrence Guard (shipped):** groups lessons by phase and milestone, surfaces weighted top-N patterns in `sg-plan`/`sg-execute` to prevent repeated mistakes.
- **Phase 13 — sg-learn Routing Switch + Hookify Removal (shipped):** reroutes `sg-learn` to the built-in `sg-retro` skill and removes all Hookify dependencies from commands and documentation.
- **Phase 14 — Codex Entry Point + .agents/skills/ (v1.3 — shipped):** rewrites `AGENTS.md` with Codex vocabulary and creates 6 `.agents/skills/` skill files so Codex, Gemini CLI, and Antigravity CLI users can follow the workflow without Claude Code slash commands.
- **Phase 15 — Platform Hooks + Python Fix (v1.3 — shipped):** creates `.codex/hooks.json` and `.gemini/settings.json` hook configs, and fixes `hooks/*.py` path fallback so hooks run without `CLAUDE_PLUGIN_ROOT` in Codex/Gemini environments.
- **Phase 16 — README Multi-Platform Section (v1.3 — shipped):** adds per-platform install guides and a feature delta table (works / limited / not available) to the README.
- **Phase 26 — sg-next Auto-Advance (v2.2 — shipped):** `sg-next` reads HANDOFF.md and STATE.md to detect the current workflow stage, routes to the next sg-* command using the same table as `sg-status`, and invokes it immediately. Ambiguous states (`complete` or `init`) surface an `AskUserQuestion` instead of auto-invoking.

## License

Released under the MIT License. See [LICENSE](./LICENSE) for the full text.

---

한국어 문서: [README.ko.md](./README.ko.md)
