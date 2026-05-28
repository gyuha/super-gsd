---
phase: quick-260528-fbn
plan: "01"
type: execute
one_liner: "sg-complete now dispatches by argument shape — number→phase (sg-phase complete), vX.Y→milestone close, empty→current milestone; fixes the phase-number-as-version bug. README EN/KO updated."
key_files:
  created: []
  modified:
    - skills/sg-complete/SKILL.md
    - README.md
    - README.ko.md
requirements: [QUICK-260528-fbn]
---

# Summary — 260528-fbn: sg-complete argument-shape routing

## What changed

`skills/sg-complete/SKILL.md` reworked from "always resolve a phase and feed it to gsd-complete-milestone" to **argument-shape dispatch**:

| Argument | Route | Action |
|----------|-------|--------|
| bare number `36` | phase | `Skill(skill="super-gsd:sg-phase", args="complete 36")` — NO milestone close |
| version `v1.4` | milestone | lessons archive + HANDOFF `complete` row + `gsd-complete-milestone v1.4` |
| (empty) | current milestone | resolve `MILESTONE_VER` from STATE.md `milestone:`, then milestone close |
| anything else | unknown | one usage line, no delegation, no mutation |

The version pattern `^v[0-9]+\.[0-9]+$` is tested **before** the number pattern `^[0-9]+(\.[0-9]+)?$`, so `v1.4` never misclassifies as a phase.

## Bug fixed

Previously sg-complete resolved the STATE Phase (or a passed phase number) and handed it to `gsd-complete-milestone`, which expects a **version** — nearly producing a broken `v36`-style tag/archive when closing v2.7 earlier this session. Now a phase number is NEVER passed to gsd-complete-milestone; numbers route to phase completion, `vX.Y` to milestone close.

## Preserved

- `<language>` auto-detect directive (verbatim).
- Milestone-close steps 1.3 (lessons archive) / 1.5 (HANDOFF `complete` row) / 2 (gsd-complete-milestone) — now fed the resolved `MILESTONE_VER` (vX.Y). One deliberate change: the HANDOFF `complete` row's Phase column holds `$MILESTONE_VER` (a milestone close has no single phase) instead of a phase slug.

## README

`README.md` and `README.ko.md` sg-complete Commands-table rows updated to describe the dual behavior (number → phase via sg-phase; vX.Y → close that milestone; empty → current milestone), EN/KO in parity. Surgical — only the sg-complete row touched.

## Verification

- Task 1 verify: PASS — `<language>`, both regex patterns, `super-gsd:sg-phase`, `gsd-complete-milestone`, usage line present; version regex precedes number regex.
- Behavioral test of the shape classifier: `36`→phase, `v1.4`/`v2.7`→version, empty→current-milestone, `1.4`→phase, `v1`/`foo`/`complete`→unknown. All correct.
- Task 2 verify: PASS — both READMEs' sg-complete rows reference sg-phase + vX.Y.

## Conventions honored

- Read tool for STATE/HANDOFF; bash regex only for argument shape (no awk pipe-splitting / grep -P).
- No version bump (deferred to 배포 deploy trigger).
- No `.agents/skills/sg-complete` pair (none existed; not created).
- Direct-to-main (config `branching_strategy: none`).

## Follow-ups (not done)

- End-to-end run of each route not exercised (logic verified structurally + classifier tested). First real `sg-complete v1.4` would also validate the gsd-complete-milestone delegation path.
- `v1`-style single-component versions classify as unknown (versions are vX.Y) — acceptable; flag if vX (no minor) should be supported.
