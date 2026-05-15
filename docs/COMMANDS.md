# sg- Command Reference

Full reference for all `/super-gsd:sg-*` slash commands.

See [README.md](../README.md) for installation and quick-start.

## Workflow

```
sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
  (GSD)       (GSD)      (GSD)    (Superpowers) (Superpowers) (Hookify)  (GSD)
                                                                    |
                         lessons feed back into next sg-plan cycle ←
```

`sg-status` can be run at any point to check current position.

## Quick Reference

| Command | Maps to | Args | Description |
|---------|---------|------|-------------|
| `/super-gsd:sg-start` | `gsd-new-project` | `[project-name]` | Scaffold a new project or milestone |
| `/super-gsd:sg-explore` | `gsd-explore` | (none) | Map and analyse the codebase |
| `/super-gsd:sg-plan` | `gsd-discuss-phase` → `gsd-plan-phase` | `[phase]` | Gather context and create a phase plan (2-step chain) |
| `/super-gsd:sg-execute` | `sg-executing-plans` Skill | `[phase]` | Package phase plan and hand off to Superpowers |
| `/super-gsd:sg-review` | `superpowers:requesting-code-review` | (none) | Request a code review via Superpowers |
| `/super-gsd:sg-learn` | `hookify:hookify` | (none) | Run Hookify retrospective to capture patterns |
| `/super-gsd:sg-ship` | `gsd-ship` | `[phase]` | Complete and ship the current milestone |
| `/super-gsd:sg-status` | reads `HANDOFF.md` + `STATE.md` | (none) | Show current stage and next recommended command |

---

## sg-start

**Slash command:** `/super-gsd:sg-start`

**Maps to:** `gsd-new-project`

**Arguments:** `[project-name]` — optional. Passed through to `gsd-new-project`.

**What it does:** Invokes the `gsd-new-project` Skill to scaffold a new project or milestone. `gsd-new-project` handles new vs. existing project detection internally, so `sg-start` simply forwards `$ARGUMENTS` unchanged.

**Example:**
```
/super-gsd:sg-start my-new-app
/super-gsd:sg-start
```

After completion, the command prints a message guiding you to run `sg-explore` next.

---

## sg-explore

**Slash command:** `/super-gsd:sg-explore`

**Maps to:** `gsd-explore`

**Arguments:** (none)

**What it does:** Invokes the `gsd-explore` Skill to analyse and map the current codebase. No arguments required — `gsd-explore` uses the current working directory.

**Example:**
```
/super-gsd:sg-explore
```

After completion, the command prints a message guiding you to run `sg-plan` next.

---

## sg-plan

**Slash command:** `/super-gsd:sg-plan`

**Maps to:** `gsd-discuss-phase` → `gsd-plan-phase` (2-step chain)

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Executes a 2-step chain automatically: first invokes `gsd-discuss-phase` to gather phase context, then invokes `gsd-plan-phase` to create the execution plan. Progress messages are printed before each step so you can see which step is running.

**Example:**
```
/super-gsd:sg-plan
/super-gsd:sg-plan 03
```

Progress output:
```
[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...
[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...
```

After completion, the command prints a message guiding you to run `sg-execute` next.

---

## sg-execute

**Slash command:** `/super-gsd:sg-execute`

**Maps to:** `sg-executing-plans` Skill (via Superpowers)

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Packages the current phase's `PLAN.md` bodies, `REQUIREMENTS.md` REQ-ID mapping, and `ROADMAP.md` success criteria into a single Superpowers-ready prompt, then auto-invokes the `sg-executing-plans` Skill. Appends a timestamped row to `.planning/HANDOFF.md`. Re-running on an unchanged plan is idempotent (skips append when plan hash matches).

**Example:**
```
/super-gsd:sg-execute
/super-gsd:sg-execute 03
```

After completion, the command prints a message guiding you to run `sg-status` to inspect workflow state.

---

## sg-review

**Slash command:** `/super-gsd:sg-review`

**Maps to:** `superpowers:requesting-code-review`

**Arguments:** (none) — `$ARGUMENTS` is passed through to the Skill if provided.

**What it does:** Invokes the `superpowers:requesting-code-review` Skill to initiate a code review. Delegates entirely to Superpowers.

**Example:**
```
/super-gsd:sg-review
```

After completion, the command prints a message guiding you to run `sg-learn` next.

---

## sg-learn

**Slash command:** `/super-gsd:sg-learn`

**Maps to:** `hookify:hookify`

**Arguments:** (none) — `$ARGUMENTS` is passed through to the Skill if provided.

**What it does:** Invokes the `hookify:hookify` Skill to run a retrospective and extract learnable patterns from the current session. Captures lessons that feed back into the next `sg-plan` cycle.

**Example:**
```
/super-gsd:sg-learn
```

After completion, the command prints a message guiding you to run `sg-ship` next.

---

## sg-ship

**Slash command:** `/super-gsd:sg-ship`

**Maps to:** `gsd-ship`

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Resolves the target phase then invokes the `gsd-ship` Skill to complete and ship the milestone.

**Example:**
```
/super-gsd:sg-ship
/super-gsd:sg-ship 03
```

After completion, the command prints a message guiding you to run `sg-start` to begin the next project or milestone.

---

## sg-status

**Slash command:** `/super-gsd:sg-status`

**Maps to:** reads `.planning/HANDOFF.md` + `.planning/STATE.md` (no Skill)

**Arguments:** (none)

**What it does:** Reads `.planning/HANDOFF.md` to determine the current stage, `.planning/STATE.md` for the current phase number and name, and `.planning/ROADMAP.md` for next-phase lookup. Outputs exactly three header lines, a blank line, and one `Next:` line.

**Example:**
```
/super-gsd:sg-status
```

Example output:
```
Phase: 3 (sg- Command Set & README)
Stage: superpowers
Last handoff: 2026-05-15T14:30:00Z

Next: /hookify
```

---

## Workflow Guide

Run the commands in sequence to complete a full GSD → Superpowers → Hookify cycle:

1. **`sg-start`** — begin a new project or milestone. GSD scaffolds the `.planning/` directory.
2. **`sg-explore`** — map the codebase. GSD produces an exploration report.
3. **`sg-plan`** — gather context and create a phase plan. The 2-step chain handles `discuss-phase` and `plan-phase` automatically.
4. **`sg-execute`** — hand the plan to Superpowers. The packaged prompt is passed to `sg-executing-plans` automatically.
5. **`sg-review`** — request a code review via Superpowers when implementation is complete.
6. **`sg-learn`** — run a Hookify retrospective after the review. Extracted patterns feed back into the next planning cycle.
7. **`sg-ship`** — close out the milestone via GSD.

At any point, run **`sg-status`** to see where you are in the cycle and what command to run next.

Each command prints a completion message that names the next command, so you never have to memorize the sequence.
