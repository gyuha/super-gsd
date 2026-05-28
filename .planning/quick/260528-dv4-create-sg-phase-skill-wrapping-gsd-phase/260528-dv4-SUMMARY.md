---
phase: quick-260528-dv4
plan: "01"
type: execute
one_liner: "Added /super-gsd:sg-phase — edit/remove delegate to gsd-phase, complete reconciles phase-completion metadata; README EN/KO updated."
key_files:
  created:
    - skills/sg-phase/SKILL.md
  modified:
    - README.md
    - README.ko.md
requirements: [QUICK-260528-dv4]
---

# Summary — 260528-dv4: sg-phase skill

## What was built

New `/super-gsd:sg-phase` slash command (`skills/sg-phase/SKILL.md`) routing by leading subcommand:

- **`edit <N> [changes]`** → delegates to `Skill(skill="gsd-phase", args="--edit ...")` (terminal handoff).
- **`remove <N>`** → delegates to `Skill(skill="gsd-phase", args="--remove <N>")` (terminal handoff).
- **`complete [N]`** → NEW inline reconcile logic (gsd-phase has no complete mode). Resolves the phase (arg or STATE.md), locates the zero-padded phase dir, recomputes Plans-complete (`SUMMARY/PLAN` count, or `— (ad-hoc)` when no dir), sets the ROADMAP `## Progress` row to `Complete` + today's date, flips the `## Phases` checkbox to `[x]`, syncs STATE.md, and optionally appends a HANDOFF.md `complete` row. All ROADMAP/STATE mutation via Read + Edit (no awk pipe-splitting / grep -P, per CLAUDE.md macOS portability).
- Empty/unknown subcommand → single usage line, no delegation, no mutation.

`complete` automates the manual phase-completion reconciliation done for phases 36/37/38 earlier in the session — filling the gap GSD lacks (gsd-health detects Progress-table drift but does not repair it).

## README

`README.md` and `README.ko.md` phase-management sections: removed the stale "super-gsd does not wrap gsd-phase" / "wrapping하지 않는다" claim, reframed gsd-phase as the 4-mode CRUD source, and added a `/super-gsd:sg-phase` subcommand table (edit/remove/complete) in EN/KO parity.

## Verification

- Task 1 verify: `OK` — file exists, `name: sg-phase`, `<language>` block, both gsd-phase delegations, complete logic present.
- Task 2 verify: `OK` — both READMEs reference sg-phase; stale claims gone; 3 sg-phase subcommand rows in each (EN/KO parity).

## Conventions honored

- `<language>` auto-detect directive included (v2.7 i18n); machine tokens verbatim.
- No version bump (deferred to 배포 deploy trigger).
- No `.agents/skills/sg-phase` pair (out of scope; .agents/ mirrors core workflow skills only).
- Direct-to-main (config `branching_strategy: none`); no feature branch.

## Follow-ups (not done)

- Add sg-phase to README command tables + `docs/COMMANDS.md` (would bump the "16 commands" count) — discoverability, separate from this task.
- Optional `.agents/skills/sg-phase` for Codex/Gemini parity.
- Functional test of `complete` against a real phase (logic verified structurally, not yet executed end-to-end).
