# super-gsd

Orchestrator plugin that auto-chains GSD → Superpowers → Hookify so planning, implementation, and retrospection stay connected as a single learning loop.

## What this is

`super-gsd` is a Claude Code plugin whose only job is to keep three other Claude Code plugins talking to each other. Strategy lives in GSD. Implementation lives in Superpowers. Retrospection lives in Hookify. When one of them finishes a stage, `super-gsd` is responsible for handing the context to the next one — so the user does not have to remember which command comes next, and so lessons learned in one cycle actually reach the next plan.

The problem this solves is that manual handoff between these three tools is fragile. People forget to run the review, skip the retro, lose context between sessions, or re-run a planning command that overwrites half-finished work. By separating roles and then orchestrating the seams between them, the same mistakes stop showing up.

All thirteen slash commands covering the full GSD → Superpowers → Hookify cycle are available — from starting a new milestone to closing it out and beginning the next. See the **Commands** section below for the quick-reference table, and `docs/COMMANDS.md` for the full per-command reference.

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
| `/super-gsd:sg-execute` | Package the current phase plan and hand off to Superpowers (`superpowers:executing-plans`) | After `sg-plan` is complete |
| `/super-gsd:sg-review` | Request a code review via `superpowers:requesting-code-review` | After implementation is complete |
| `/super-gsd:sg-learn` | Run a Hookify retrospective to extract patterns and generate hooks (`hookify:hookify`) | After the review is done |
| `/super-gsd:sg-lessons` | List prior Hookify lessons from `.planning/lessons/`; accepts optional phase filter | Before `sg-plan` to review what was learned |
| `/super-gsd:sg-ship` | Merge and ship the current phase via `gsd-ship` | After learning is captured |
| `/super-gsd:sg-complete` | Archive and close the current milestone via `gsd-complete-milestone` | After all phases are shipped |
| `/super-gsd:sg-new` | Start a new milestone via `gsd-new-milestone` | After `sg-complete`, to begin the next milestone |
| `/super-gsd:sg-status` | Show current stage, last handoff timestamp, and next recommended command | At any point to check where you are |
| `/super-gsd:sg-update` | Check, install, or update GSD, superpowers, hookify, and super-gsd (installs missing tools automatically) | When you want to install or update all workflow tools at once |
| `/super-gsd:sg-quick` | Execute a small, ad-hoc task with GSD guarantees (plan + execute + commit) | For one-off tasks outside the main phase workflow |

See [docs/COMMANDS.md](./docs/COMMANDS.md) for the full per-command reference including arguments and detailed descriptions.

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

# 6. Learn — runs Hookify retrospective; findings are saved to .planning/lessons/
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

`sg-update` detects whether GSD, Superpowers, and Hookify are already installed and installs any that are missing. Running it on a fresh machine will install all three automatically. On an existing setup it updates them to their latest versions.

Move on to **Verify install** once `sg-update` completes.

## Prerequisites

`super-gsd` orchestrates three tools. `sg-update` (above) installs them automatically — this section is a reference for what each one does.

- **GSD** (`get-shit-done-cc`) — provides the `/gsd-*` planning commands and the `.planning/` directory convention this plugin reads from.
- **Superpowers** (`claude-plugins-official/superpowers`) — provides the `superpowers:*` skill tree used during the build / review stage.
- **Hookify** (`claude-plugins-official/hookify`) — provides the `/hookify:*` commands used during the retrospection stage.

`super-gsd` is non-invasive: it does not modify, fork, or replace any of these tools.

## Verify install

After installation, confirm `super-gsd` loaded cleanly and your existing tools still work.

1. Run `/plugin list` and confirm that `super-gsd` appears in the listing with name, version, and description matching `.claude-plugin/plugin.json`.
2. Run `/gsd-progress` (or any other GSD command) and confirm GSD responds normally — this proves GSD remains intact and unmodified.
3. Open the `Skill` tree and confirm that `superpowers:*` skills are still discoverable and invokable — this proves Superpowers remains intact and unmodified.
4. Run `/hookify:help` and confirm Hookify responds with its usual help output — this proves Hookify remains intact and unmodified.

If all four checks pass, `super-gsd` is installed correctly and non-invasively.

## Roadmap

`super-gsd` ships in MVP vertical slices. Each phase delivers a coherent, testable user behavior.

- **Phase 1 — Plugin Scaffold (shipped):** installable plugin shell with manifest, marketplace metadata, README, and verify checklist. No commands or hooks yet.
- **Phase 2 — Manual Handoff & Status (shipped):** introduces `/super-gsd:sg-execute` (package a finished GSD phase as a Superpowers-ready prompt) and `/super-gsd:sg-status` (inspect current stage, last handoff, next recommended command).
- **Phase 3 — sg- Command Set & README (shipped):** delivers the full 8-command `sg-` interface and updated documentation so the entire GSD → Superpowers → Hookify cycle has discoverable slash commands.
- **Phase 4 — Auto-Advance Hooks (shipped):** registers `Stop` hooks so stage transitions are auto-detected — completed `plan-phase` surfaces a handoff prompt, completed `code-reviewer` suggests Hookify via `systemMessage` (Claude Code hooks API does not support auto-executing slash commands; suggestions require user confirmation).
- **Phase 5 — Lessons Feedback Loop (shipped):** persists Hookify findings into `.planning/lessons/` and surfaces them automatically when the next GSD phase begins via `sg-plan` Step 0 injection and the new `sg-lessons` command, closing the learning loop.

## License

Released under the MIT License. See [LICENSE](./LICENSE) for the full text.

---

한국어 문서: [README.ko.md](./README.ko.md)
