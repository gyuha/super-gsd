---
phase: 32-skill-superpowers-migration
plan: 01
subsystem: skills
tags: [refactor, bash-portability, superpowers-migration, read-tool]
dependency_graph:
  requires: []
  provides: [skills/sg-complete, skills/sg-plan, skills/sg-ship, skills/sg-ui-plan, skills/sg-execute, skills/sg-review, skills/sg-lessons, skills/sg-quick]
  affects: [skills/sg-complete/SKILL.md, skills/sg-plan/SKILL.md, skills/sg-ship/SKILL.md, skills/sg-ui-plan/SKILL.md, skills/sg-execute/SKILL.md, skills/sg-review/SKILL.md, skills/sg-lessons/SKILL.md, skills/sg-quick/SKILL.md]
tech_stack:
  added: []
  patterns: [Read-tool-based file parsing, node -e inline JS for argument extraction]
key_files:
  created: []
  modified:
    - skills/sg-complete/SKILL.md
    - skills/sg-plan/SKILL.md
    - skills/sg-ship/SKILL.md
    - skills/sg-ui-plan/SKILL.md
    - skills/sg-execute/SKILL.md
    - skills/sg-review/SKILL.md
    - skills/sg-lessons/SKILL.md
    - skills/sg-quick/SKILL.md
decisions:
  - Read tool + Claude interpretation replaces grep/sed/awk pipelines for STATE.md and HANDOFF.md parsing
  - node -e inline JS replaces grep -oE and sed pipelines for argument extraction
  - HANDOFF.md init blocks (printf table headers) kept as bash — these are write ops, not parsing
  - EXISTING_HASH grep line in sg-execute Step 7 preserved (idempotency check, not a parsing portability issue)
  - Step 8.5 wave/files_modified awk block in sg-execute preserved (complex logic, not listed in plan)
metrics:
  duration: ~8m
  completed: 2026-05-26
  tasks_completed: 3
  files_modified: 8
---

# Phase 32 Plan 01: Skill Bash→Superpowers Migration Summary

Replaced BSD-incompatible `grep -E '^Phase:'|sed|awk` pipelines and `grep -oE` argument extractors across 8 SKILL.md files with Read-tool-based Claude interpretation and `node -e` inline JS patterns.

## What Changed Per File

### skills/sg-complete/SKILL.md (3 replacements)
- Step 1: `grep -E '^Phase:' .planning/STATE.md | sed | awk` → `Read .planning/STATE.md, extract Phase: value`
- Step 1.3: `grep -E '^milestone:' .planning/STATE.md | awk '{print $2}'` → `Read .planning/STATE.md, extract milestone: value`
- Step 1.5: `grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' ...` → `Read .planning/HANDOFF.md, extract To column from last data row`
- HANDOFF init block (`if [ ! -f "$HANDOFF_FILE" ]...printf ...`) left unchanged

### skills/sg-plan/SKILL.md (2 replacements)
- Step 1: Phase parsing pipeline → Read tool
- Step 2.5: PREV_STAGE awk extraction → Read tool
- HANDOFF init block, idempotency grep lines left unchanged

### skills/sg-ship/SKILL.md (2 replacements)
- Step 1: Phase parsing pipeline → Read tool
- Step 1.5: FROM_STAGE awk extraction → Read tool (default "review" if empty)

### skills/sg-ui-plan/SKILL.md (2 replacements)
- Step 1: Phase parsing pipeline → Read tool
- Step 4: FROM_STAGE awk extraction → Read tool

### skills/sg-execute/SKILL.md (3 replacements)
- Step 1: Phase parsing pipeline → Read tool
- Step 3: Entire ROADMAP.md bash block (PHASE_HEADER, PHASE_NAME, HEADER_LINE, GOAL, REQ_IDS, SC_TEXT variables) → Read tool with structured extraction instructions
- Step 8: FROM_STAGE awk extraction → Read tool
- Step 8.5 wave/files_modified awk block preserved (explicitly excluded by plan)
- Step 7 EXISTING_HASH grep line preserved (idempotency logic, not a portability issue)

### skills/sg-review/SKILL.md (4 replacements)
- Step 3: PHASE_NUM parsing pipeline → Read tool
- Step 3: PLAN_REQUIREMENTS `sed -n '/<objective>/,/<\/objective>/p'` → Read tool
- Step 3.9: PHASE_NUM_R parsing pipeline → Read tool (note: reuse from Step 3)
- Step 3.9: FROM_STAGE_R awk extraction → Read tool

### skills/sg-lessons/SKILL.md (2 replacements)
- Step 0: MILESTONE_ARG `echo | grep -oE 'milestone=...' | sed 's/milestone=//'` → `node -e` regex match
- Step 2: ARG_NUM `echo | grep -oE '[0-9]+'` → `node -e` regex match

### skills/sg-quick/SKILL.md (2 replacements)
- Step 1: DESCRIPTION `echo "$ARGS" | sed 's/--discuss//g; ...'` → `node -e` replace+trim
- Step 7: Entire `awk -v row="$NEW_ROW" '...'` STATE.md table-append block → Read/Edit tool instructions
- `ARGS="$ARGUMENTS"` line preserved (used by flag parsing loop)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- skills/sg-complete/SKILL.md: FOUND
- skills/sg-execute/SKILL.md: FOUND
- skills/sg-review/SKILL.md: FOUND
- skills/sg-lessons/SKILL.md: FOUND
- skills/sg-quick/SKILL.md: FOUND
- Commit dc0fbc0: FOUND
- Commit fcb6e48: FOUND
- Commit f4fa3d2: FOUND
