---
phase: 36
plan: "03"
subsystem: skills
tags: [i18n, language-detection, skills, multilingual]
dependency_graph:
  requires: [36-01, 36-02]
  provides: [I18N-04]
  affects: [skills/sg-*/SKILL.md]
tech_stack:
  added: []
  patterns: [language-directive-block, frontmatter-insertion]
key_files:
  created: []
  modified:
    - skills/sg-retro/SKILL.md
    - skills/sg-next/SKILL.md
    - skills/sg-parallel-execute/SKILL.md
    - skills/sg-start/SKILL.md
    - skills/sg-health/SKILL.md
    - skills/sg-setup/SKILL.md
    - skills/sg-execute/SKILL.md
    - skills/sg-ui-plan/SKILL.md
    - skills/sg-plan/SKILL.md
    - skills/sg-lessons/SKILL.md
    - skills/sg-new/SKILL.md
    - skills/sg-complete/SKILL.md
    - skills/sg-status/SKILL.md
    - skills/sg-review/SKILL.md
    - skills/sg-explore/SKILL.md
    - skills/sg-learn/SKILL.md
    - skills/sg-quick/SKILL.md
    - skills/sg-ship/SKILL.md
    - skills/sg-update/SKILL.md
decisions:
  - "Inserted <language> block as insertion-only operation — no existing content removed or reordered"
  - "Idempotency rule applied: checked all 19 files before editing; none had the block already"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-27"
  tasks_completed: 1
  files_modified: 19
---

# Phase 36 Plan 03: Language Directive Insertion Summary

All 19 SKILL.md files in skills/ now contain the `<language>` auto-detection directive, completing I18N-04 for Wave 2.

## What Was Built

Inserted a `<language>` block into all 19 SKILL.md files in the skills/ directory. The block is positioned immediately after the closing `---` of the YAML frontmatter, before `<objective>`. This enables Claude to detect the user's input language and respond in that language throughout any skill's execution.

The 5 files that were not modified in Wave 1 (sg-explore, sg-learn, sg-quick, sg-ship, sg-update) were read first to confirm content before editing.

## Verification Results

All 4 checkpoint checks passed:

1. Language block count: 19 of 19 files confirmed.
2. Korean character check: zero Korean characters found in skills/ — combined result of Wave 1 translation + Wave 2 directive insertion.
3. Structure check: sg-explore shows correct order: frontmatter → blank line → `<language>` block → blank line → `<objective>`.
4. Bash command integrity: sg-health `test -d "$HOME/.claude/get-shit-done"` unchanged.

## Deviations from Plan

None — plan executed exactly as written. All 19 files were missing the `<language>` block and were updated in a single pass.

## Known Stubs

None.

## Threat Flags

None. This was a pure insertion operation with no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- Commit 2f511fe: 19 files changed, 133 insertions, 0 deletions.
- All 19 modified files staged individually (no git add -A).
- Post-commit deletion check: no unexpected deletions.
