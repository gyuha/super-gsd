# Team Workflow Guide

This guide covers the super-gsd team workflow conventions for developers who already have super-gsd installed.

---

## Quick Start

Verify your git identity is set before starting any phase work. super-gsd records `git config user.name` in HANDOFF.md to track who did what.

```bash
# Check your git identity
git config user.name
# Expected: your name (e.g. "Alice")
# If empty: git config --global user.name "Your Name"
```

Then check the current team status:

```bash
/super-gsd:sg-status --team
```

Sample output:

```
## 팀 현황

| 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |
| ---- | --------- | --------- | ---------- |
| Alice | 41-team-documentation | plan | 2026-05-29T10:00Z |
| Bob   | 40-sg-execute-branch-workflow | review | 2026-05-28T18:30Z |
```

---

## Branch strategy

When you run `sg-execute` from the `main` or `master` branch, super-gsd detects this and offers to create a dedicated phase branch before starting work.

**Branch naming convention:** `phase/{PHASE_PAD}-{slug}`

Examples:
- `phase/41-team-documentation`
- `phase/40-sg-execute-branch-workflow`

**How it works (Step 1.5 of sg-execute):**

1. sg-execute resolves the phase number from STATE.md or `$ARGUMENTS`.
2. It runs `git rev-parse --abbrev-ref HEAD` to detect the current branch.
3. If the current branch is `main` or `master`, it prompts via AskUserQuestion:
   - **Create branch (recommended)** — runs `git checkout -b phase/{N}-{slug}` and continues.
   - **Skip — continue on main** — proceeds without creating a branch.
4. If you are already on any other branch (e.g. a `phase/*` branch), sg-execute skips the prompt entirely and proceeds.

Non-git environments or git errors also skip the prompt and proceed normally.

---

## File ownership

These are the planning files touched during normal workflow. Only modify files in your designated role.

| File | Owner | When modified |
|------|-------|---------------|
| `.planning/STATE.md` | GSD (auto) | After each sg-* command via gsd-sdk |
| `.planning/ROADMAP.md` | Human | Phase planning decisions only |
| `.planning/HANDOFF.md` | super-gsd (auto) | Append-only at each sg-* command |

**HANDOFF.md schema (6 columns):**

```
| Timestamp | Phase | From | To | Plan Hash | User |
```

- `Timestamp` — ISO-8601 UTC time of the handoff
- `Phase` — phase slug (e.g. `41-team-documentation`)
- `From` — source stage (e.g. `plan`, `superpowers`, `review`)
- `To` — destination stage (e.g. `superpowers`, `review`, `ship`)
- `Plan Hash` — short hash of the plan content for idempotency checks
- `User` — `git config user.name` at the time of the command; `-` if unset

HANDOFF.md is append-only. Never edit or delete existing rows.

---

## Retrospective workflow

After implementation review, capture lessons before shipping so the next phase starts with current context.

**When to run sg-learn:**

Run `/super-gsd:sg-learn` immediately after `sg-review` completes and before `sg-ship`. Skipping this step is the most common cause of lessons drift between phases.

**What sg-learn does:**

`sg-learn` is a thin pass-through to the `sg-retro` skill. Without arguments, sg-retro runs a smart default of two lenses (`dspm` + `ssc`) — no prompt, no AskUserQuestion. Results are appended to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`.

**When to use `--pick`:**

Pass `--pick` when you need a non-default lens combination — for example to run only `analyze` (conversation transcript scan), only `ssc` (behavior changes), or all three lenses together. `sg-learn --pick` or `sg-retro {phase} --pick` opens a single AskUserQuestion multiSelect with the three available lenses (`ssc`, `dspm`, `analyze`). Combining `--pick` with a positional lens argument is rejected with a graceful error — pick one form.

**Where results live:**

| Artifact | Path | Mode |
|----------|------|------|
| Lessons file | `.planning/lessons/{NN}-{YYYY-MM-DD}.md` | append-only |
| Handoff row | `.planning/HANDOFF.md` (one row per sg-learn invocation) | append-only |

The lessons file groups output by lens (`## Lens: ...` headers). Action Items rated P1 are emphasized with a `🔴 P1` prefix in the priority cell so the next phase's `sg-plan` surfaces them first.

---

## Merge order

When `sg-complete [N]` (or `sg-phase complete N`) finishes a phase, it outputs PR guidance. Follow this order to merge cleanly:

**If `gh` CLI is available:**

```bash
gh pr create --base main --title "phase/{N}-{slug}"
```

**If `gh` is not available:**

```bash
git push -u origin HEAD
# Then open a PR manually on GitHub/GitLab from the branch URL printed above.
```

Always target `main` as the base branch. Do not merge directly without a PR unless you are the sole contributor on this repo.
