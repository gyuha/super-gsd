---
phase: 33-npx-installer
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - bin/setup.js
  - package.json
  - CLAUDE.md
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 33: Code Review Report

**Reviewed:** 2026-05-26
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the new `bin/setup.js` npx installer, `package.json` (updated with bin entry and files field), and `CLAUDE.md` (updated version-bump convention to include package.json). The installer is structurally sound — PKG_ROOT calculation is correct for both npx and symlink invocation, `fs.cpSync` is available in the Node 18+ minimum, and parent directories are created before copy. One critical defect was found: the installer exits with code 0 even when every copy operation fails. Two warnings cover the unconditional "Installation complete." success message and stale-file accumulation on directory upgrades.

## Critical Issues

### CR-01: Exit code 0 on copy errors — installer silently succeeds even on total failure

**File:** `bin/setup.js:82-87`

**Issue:** After the copy loop, `process.stdout.write('\nInstallation complete.\n')` runs unconditionally on line 82, and there is no `process.exit(1)` branch when `errors > 0`. Any CI/CD pipeline running `npx @gyuha/super-gsd install` will see exit code 0 even if all three copy operations failed (e.g., PKG_ROOT was miscalculated, the package was installed without its asset directories, or the destination is read-only). The "Errors: N (see above)" line is printed to stdout only if errors > 0, but the process still exits 0, making scripted use unreliable.

The only `process.exit(1)` calls are at line 31 (wrong subcommand) and line 95 (parseArgs throws). A total-failure install is indistinguishable from a successful one to a calling script.

**Fix:**
```javascript
  process.stdout.write('\nInstallation ' + (errors > 0 ? 'finished with errors' : 'complete') + '.\n');
  process.stdout.write('  Copied:  ' + copied  + ' items\n');
  process.stdout.write('  Skipped: ' + skipped + ' items (already exist)\n');
  if (errors > 0) {
    process.stdout.write('  Errors:  ' + errors + ' (see above)\n');
    process.exit(1);
  }
```

## Warnings

### WR-01: "Installation complete." printed unconditionally — misleading on full failure

**File:** `bin/setup.js:82`

**Issue:** `process.stdout.write('\nInstallation complete.\n')` is the first line after the loop, before the errors guard. If `copied=0`, `skipped=0`, `errors=3`, the output is:

```
Installation complete.
  Copied:  0 items
  Skipped: 0 items (already exist)
  Errors:  3 (see above)
```

A user reading the terminal will see "Installation complete." as the headline and may miss the errors line below it. This is compounded by CR-01 (exit code 0) and is the usability-facing symptom of the same root cause. The fix in CR-01 also resolves this warning.

### WR-02: `--force` on directories merges rather than replaces — stale hook files accumulate after upgrades

**File:** `bin/setup.js:67-68`

**Issue:** When `--force` is passed and a destination directory already exists (e.g., `hooks/`), the code calls `fs.cpSync(srcPath, destPath, { recursive: true })`. `cpSync` merges source into destination: it overwrites files that exist in both, but it does **not** delete files in destination that no longer exist in source. This means a user who runs `npx @gyuha/super-gsd install --force` after a package upgrade that renamed or deleted a hook file will retain the old hook file in their project. Stale `.cjs` hook files registered in Claude Code's hooks config will continue to execute, potentially causing unexpected behavior.

**Fix:** For directory items with `--force`, remove the destination before copying, or document the limitation prominently in the usage message:

```javascript
if (item.type === 'dir') {
  if (existed && values.force) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(srcPath, destPath, { recursive: true });
}
```

Alternatively, add a note to the skipped/force message: `"--force merges directories; remove hooks/ manually to delete stale files"`.

## Info

### IN-01: CLAUDE.md version-bump convention updated to 3 files — inconsistency with system-level CLAUDE.md

**File:** `CLAUDE.md:38-44`

**Issue:** The in-repo `CLAUDE.md` now correctly documents that three files must be updated on version bump: `.claude-plugin/plugin.json`, `package.json`, and `CHANGELOG.md`. However, the system-level `~/.claude/CLAUDE.md` (loaded from user's global config) still describes only two files (plugin.json + CHANGELOG.md), omitting `package.json`. This creates a split-brain situation where a session using the global profile but not the project profile would follow an incomplete convention and produce a non-compliant commit. This is already mitigated in practice because the project `CLAUDE.md` takes precedence when both are loaded, but the global file should be updated to stay consistent.

**Fix:** Update `~/.claude/CLAUDE.md` deploy trigger section to add step 3 (`package.json` version sync) matching the in-repo convention.

---

_Reviewed: 2026-05-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
