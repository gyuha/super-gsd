---
phase: 22-skills
fixed_at: 2026-05-23T00:00:00Z
review_path: .planning/phases/22-skills/22-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 22: Code Review Fix Report

**Fixed at:** 2026-05-23T00:00:00Z
**Source review:** .planning/phases/22-skills/22-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (CR-01, CR-02, CR-03, WR-01, WR-02, WR-03, WR-04, WR-05, WR-06, WR-07)
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-01: sg-quick — node JSON parsing replaced with python3

**Files modified:** `skills/sg-quick/SKILL.md`
**Commit:** `4956682`
**Applied fix:** Replaced two `node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'))..."` expressions with `python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('quick_id') or d.get('id',''))"` and the task_dir equivalent. This eliminates the Node.js hard-dependency and aligns with the project's Bash/Python stack.

---

### CR-02: sg-start — unknown stage exit 1 replaced with warn + fallback

**Files modified:** `skills/sg-start/SKILL.md`
**Commit:** `8c9821f`
**Applied fix:** Replaced `exit 1` in the `*)` branch of the stage case statement with a warning message to stderr and `STAGE_RAW="init"` fallback, so an unrecognized HANDOFF.md stage no longer crashes session resume.

---

### CR-03: sg-execute — PHASE_NUM numeric validation added

**Files modified:** `skills/sg-execute/SKILL.md`
**Commit:** `c24fd2e`
**Applied fix:** Added a `grep -qE '^[0-9]+'` validation block immediately after PHASE_NUM is resolved in Step 1. Non-numeric values (including path traversal attempts with `../`) now exit with a clear error message before any file path construction occurs.

---

### WR-01: sg-health — duplicate step 8 renumbered + success_criteria count fixed

**Files modified:** `skills/sg-health/SKILL.md`
**Commit:** `e26b49c`
**Applied fix:** Renumbered the second "8. **요약 출력**" step to "9. **요약 출력**". Updated the process header from "7개 항목" to "8개 항목". Updated success_criteria item 1 from "7개 진단 항목" to "8개 진단 항목" with the full list including "Hook scripts".

---

### WR-02: sg-execute — complete/ship re-execute behavior documented

**Files modified:** `skills/sg-execute/SKILL.md`
**Commit:** `c24fd2e`
**Applied fix:** Added success_criteria item 5 clarifying that re-running sg-execute after a `complete` or `ship` stage bypasses the idempotency check (which only matches `superpowers`/`parallel` in the To column) and appends a new handoff row. This is documented as intentional behavior.

---

### WR-03: sg-lessons — milestone arg validation added

**Files modified:** `skills/sg-lessons/SKILL.md`
**Commit:** `1c0a056`
**Applied fix:** Added `grep -qE '^[a-zA-Z0-9._-]+$'` validation for `$MILESTONE_ARG` before using it to construct the file path. Path traversal attempts (e.g., `--milestone=../../etc/passwd`) now exit with "Invalid milestone argument."

---

### WR-04: sg-plan — dead gsd-sdk roadmap.get-phase call removed

**Files modified:** `skills/sg-plan/SKILL.md`
**Commit:** `822157b`
**Applied fix:** Removed the entire Step 1.5 (Visual Companion detection) block from both the `<process>` and `<success_criteria>` sections. The `gsd-sdk query roadmap.get-phase` command does not exist, making `PHASE_SECTION` permanently empty and the UI detection branch permanently unreachable dead code.

---

### WR-05: sg-quick — awk failure now exits sg-quick cleanly

**Files modified:** `skills/sg-quick/SKILL.md`
**Commit:** `4956682`
**Applied fix:** Appended `|| { echo "ERROR: Failed to update STATE.md — ### Quick Tasks Completed section may be missing"; exit 1; }` to the awk+mv pipeline in Step 7. When awk exits 1 (section not found) or mv fails, the entire sg-quick command now terminates with a clear error instead of silently continuing to the git commit step.

---

### WR-06: sg-start — parallel case added to Step 4 NEXT_CMD mapping

**Files modified:** `skills/sg-start/SKILL.md`
**Commit:** `8c9821f`
**Applied fix:** Added `parallel)    NEXT_CMD="/super-gsd:sg-review" ;;` to the Step 4 case statement, matching the behavior in sg-status. Previously the `parallel` stage fell through to `*)` producing `NEXT_CMD="(unknown stage: parallel)"`.

---

### WR-07: sg-review — misleading error message corrected

**Files modified:** `skills/sg-review/SKILL.md`
**Commit:** `20093f4`
**Applied fix:** Replaced the error message that incorrectly suggested passing a base SHA as argument (which sg-review interprets as DESCRIPTION, not a git range base). New message directs users to commit their changes first or run from a diverged feature branch.

---

_Fixed: 2026-05-23T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
