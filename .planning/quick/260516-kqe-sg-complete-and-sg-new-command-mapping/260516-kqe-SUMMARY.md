---
phase: quick-260516-kqe
plan: "01"
subsystem: commands
tags: [slash-command, sg-complete, sg-new, gsd-complete-milestone, gsd-new-milestone]
dependency_graph:
  requires: []
  provides: [commands/sg-complete.md, commands/sg-new.md]
  affects: [README.md, README.ko.md, docs/COMMANDS.md]
tech_stack:
  added: []
  patterns: [sg-ship pattern — frontmatter + process + success_criteria]
key_files:
  created:
    - commands/sg-complete.md
    - commands/sg-new.md
  modified:
    - README.md
    - README.ko.md
    - docs/COMMANDS.md
decisions:
  - sg-complete phase resolution matches sg-ship pattern exactly (grep STATE.md, fail-fast on missing)
  - sg-new has no phase resolution — forwards $ARGUMENTS directly to gsd-new-milestone
  - README.ko.md updated alongside README.md per plan instruction
metrics:
  duration: ~3min
  completed: "2026-05-16"
  tasks_completed: 2
  files_changed: 5
---

# Quick Task 260516-kqe: sg-complete and sg-new Command Mapping Summary

sg-complete (gsd-complete-milestone) and sg-new (gsd-new-milestone) slash commands added with documentation in README.md, README.ko.md, and docs/COMMANDS.md.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | sg-complete.md 및 sg-new.md 커맨드 파일 생성 | 1fbf4c3 | commands/sg-complete.md, commands/sg-new.md |
| 2 | README.md 및 docs/COMMANDS.md 문서 갱신 | 9050ffd | README.md, README.ko.md, docs/COMMANDS.md |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced.

## Self-Check: PASSED

- commands/sg-complete.md: EXISTS, contains "gsd-complete-milestone"
- commands/sg-new.md: EXISTS, contains "gsd-new-milestone"
- README.md: contains sg-complete and sg-new rows in Commands table
- README.ko.md: contains sg-complete and sg-new rows in Commands table
- docs/COMMANDS.md: Quick Reference table updated, detail sections added for both commands
- Commits 1fbf4c3 and 9050ffd confirmed in git log
