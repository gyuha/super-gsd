---
phase: quick-260516-dsz
plan: 01
subsystem: commands
tags: [sg-update, ux, install-detection]
key-files:
  modified:
    - commands/sg-update.md
decisions:
  - "Install-detection via `command -v gsd-sdk || npm list -g` for GSD; `claude plugin list | grep -qi` for plugins"
  - "GSD path only captures before/after version; plugin paths record installed vs updated (no version available)"
  - "Step 5 (super-gsd) preserved byte-for-byte per constraint"
metrics:
  duration: ~3min
  completed: 2026-05-16
---

# Quick Task 260516-dsz: sg-update Install/Update Detection Summary

Added install-detection logic to `sg-update` Steps 2-4 so users see "Installing..." vs "Updating..." depending on whether each tool is already present, with GSD capturing before/after version numbers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add install-detection logic to sg-update process | 80fe4e0 | commands/sg-update.md |

## Changes Made

**commands/sg-update.md** — Steps 2, 3, 4, 6 rewritten:
- Step 2 (GSD): checks `command -v gsd-sdk || npm list -g get-shit-done-cc`; prints "Installing GSD..." or "Updating GSD..." with before/after version capture
- Step 3 (superpowers): checks `claude plugin list | grep -qi superpowers`; prints "Installing superpowers..." or "Updating superpowers..."
- Step 4 (hookify): checks `claude plugin list | grep -qi hookify`; prints "Installing hookify..." or "Updating hookify..."
- Step 6 (summary): updated to show per-tool `<status>` (installed or updated) instead of a static list
- Step 5 (super-gsd): unchanged per constraint
- `<success_criteria>` point 3: updated from "Summary shows what was updated" to "Summary shows installed/updated state for each tool"

## Verification

- `grep -c "Installing\|Updating" commands/sg-update.md` → 7 (expected ≥ 6)
- `grep -c "super-gsd" commands/sg-update.md` → 7 (Step 5 still present)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- commands/sg-update.md: FOUND
- Commit 80fe4e0: FOUND
