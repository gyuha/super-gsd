---
phase: 47-documentation-update
plan: "01"
subsystem: documentation
tags: [docs, sg-tdd, readme, claude-md]
dependency_graph:
  requires: []
  provides: [sg-tdd-documented]
  affects: [README.md, README.ko.md, CLAUDE.md]
tech_stack:
  added: []
  patterns: [surgical-text-insertion]
key_files:
  modified:
    - README.md
    - README.ko.md
    - CLAUDE.md
decisions:
  - "Kept sg-tdd count at 3 per file (not 4) because the table row description does not contain literal 'sg-tdd' — matches exact row text specified in D-02/D-03"
metrics:
  duration: "5 minutes"
  completed: "2026-06-01"
---

# Phase 47 Plan 01: Documentation Update Summary

Surgical insertions across three documentation files to reflect the sg-tdd command and tdd_mode config flag added in Phase 46.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update README.md — sg-tdd row + pipeline + sg-next chain | a0426ef | README.md |
| 2 | Update README.ko.md — sg-tdd row + pipeline + sg-next chain | a0426ef | README.ko.md |
| 3 | Update CLAUDE.md — data flow, skill count, tdd_mode flag description | a0426ef | CLAUDE.md |

## Changes Made

### README.md
- Command count: `twenty-one` → `twenty-two`
- Pipeline string: added `sg-tdd (tdd_mode=true)` between sg-execute and sg-review
- sg-next chain description: `parallel/execute → sg-review` → `parallel/execute → sg-tdd (tdd_mode=true) → sg-review`
- Commands table: inserted `/super-gsd:sg-tdd` row between sg-execute and sg-review rows

### README.ko.md
- Command count: `21개` → `22개`
- Pipeline string: added `sg-tdd (tdd_mode=true)` between sg-execute and sg-review
- sg-next chain description: same routing update in Korean
- Commands table: inserted `/super-gsd:sg-tdd` row with Korean description

### CLAUDE.md
- Skills layer count: `21개의` → `22개의`
- Data flow block: inserted `sg-tdd → Superpowers:test-driven-development  # active when tdd_mode=true` after `sg-execute → Superpowers:executing-plans`
- New paragraph: `**super_gsd.tdd_mode` 플래그**` explanation inserted between `lessons_ranker.cjs` bullet and `**데이터 흐름**` heading

## Deviations from Plan

None — plan executed exactly as written. One minor note: the acceptance criteria comment for `grep -c "sg-tdd" README.md` said "returns 4 or more" with explanation "pipeline line, sg-next line, table row command cell, table row description cell". The actual count is 3 because the D-02 table row description does not contain literal "sg-tdd" (it contains `tdd_mode` and `superpowers:test-driven-development`). The exact row text specified in the plan was used as-is; this is a discrepancy in the acceptance criteria comment, not the row content.

## Self-Check: PASSED

- README.md modified: confirmed (commit a0426ef)
- README.ko.md modified: confirmed (commit a0426ef)
- CLAUDE.md modified: confirmed (commit a0426ef)
- `grep "sg-tdd" README.md`: 3 occurrences (pipeline, sg-next chain, table row)
- `grep "sg-tdd" README.ko.md`: 3 occurrences (pipeline, sg-next chain, table row)
- `grep "sg-tdd" CLAUDE.md`: 2 occurrences (data flow line, tdd_mode paragraph)
- `grep "twenty-two" README.md`: 1 line
- `grep "22개" README.ko.md`: 1 line
- `grep "22개의 SKILL.md" CLAUDE.md`: 1 line
- `grep "super_gsd.tdd_mode" CLAUDE.md`: 2 lines
- `grep "21개의" CLAUDE.md`: 0 lines
