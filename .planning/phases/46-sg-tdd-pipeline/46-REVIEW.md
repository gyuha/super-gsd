---
phase: 46-sg-tdd-pipeline
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - skills/sg-tdd/SKILL.md
  - .agents/skills/sg-tdd/SKILL.md
  - hooks/transcript_matcher.cjs
  - hooks/stop_hook.cjs
  - skills/sg-next/SKILL.md
  - skills/sg-status/SKILL.md
  - .agents/skills/sg-next/SKILL.md
  - .agents/skills/sg-status/SKILL.md
findings:
  critical: 2
  warning: 1
  info: 1
  total: 4
status: issues_found
---

# Phase 46: Code Review Report

**Reviewed:** 2026-06-01T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

The TDD pipeline wiring is largely correct: the signal string `"TDD verification complete"` in `transcript_matcher.cjs` exactly matches the `echo` in `sg-tdd/SKILL.md`; `stop_hook.cjs` has the `tdd` case in `stageToSignal`; all validation case-statements across all four routing files include `tdd`; macOS compatibility is maintained (no `grep -P`, no `jq`); and `tdd_mode: false` triggers a warning + continue (no hard block).

Two blockers require fixes before this ships: the `.agents/` mirror of `sg-tdd` contradicts its own `<constraints>` block by still calling Superpowers directly, and `sg-tdd` hardcodes `From=execute` in the HANDOFF.md append, making retry calls write a corrupt audit row. One warning: `skills/sg-next/SKILL.md` is missing the `tdd)` branch in its D-07 STAGE_DISPLAY block.

---

## Critical Issues

### CR-01: `.agents/skills/sg-tdd` calls `Skill("superpowers:test-driven-development")` despite `<constraints>` declaring Superpowers unavailable

**File:** `.agents/skills/sg-tdd/SKILL.md:18-23, 118-121, 135`

**Issue:** The `<constraints>` block (lines 18-23) explicitly states:

> "Superpowers integration unavailable: superpowers:test-driven-development skill cannot be used. Runs in direct TDD verification mode."

Yet Step 7 of the `<process>` (line 120) still contains:

```
Skill(skill="superpowers:test-driven-development", args="<the context blob above>")
```

And `<success_criteria>` item 2 (line 135) still says:

> "tdd_mode: true 상태에서 호출하면 Superpowers test-driven-development 스킬을 정확히 한 번 호출한다."

A Codex/Gemini agent executing this skill will attempt to call a Superpowers skill that does not exist on that platform, causing a runtime failure. The `<constraints>` block is decorative — it is never acted upon because the `<process>` body was not adapted for non-Claude-Code platforms.

**Fix:** Remove the `Skill()` call from the `.agents/` process body and replace with direct TDD verification steps. The `<success_criteria>` item 2 must also be rewritten to reflect platform-specific behavior:

```
7. **프롬프트 빌드 + TDD 직접 검증 + 완료 신호 출력 (D-06).**
   ...컨텍스트 blob 출력 후...
   echo "TDD verification complete"

   Superpowers 대신 다음 항목을 직접 확인한다:
   (1) 구현 파일마다 대응 테스트 파일이 존재하는지 확인
   (2) 테스트 러너 실행 (npm test / pytest / go test 등) 후 결과 보고
   (3) 커버리지 없는 프로덕션 코드를 목록으로 출력
   검증 완료 후 실패가 있으면 아래 numbered list를 출력하고 사용자 응답을 기다린다.
```

`<success_criteria>` item 2 should become:

```
2. tdd_mode: true 상태에서 호출하면 직접 TDD 검증을 수행한다 (Superpowers 호출 없음 — Codex/Gemini 미지원).
```

---

### CR-02: `sg-tdd` hardcodes `From=execute` — corrupts HANDOFF.md on retry

**File:** `skills/sg-tdd/SKILL.md:80, 86` and `.agents/skills/sg-tdd/SKILL.md:80, 86, 93`

**Issue:** Step 6 unconditionally writes:

```bash
echo "| $TS | $PHASE_SLUG | execute | tdd | - | $GIT_USER |" >> .planning/HANDOFF.md
```

The comment says "sg-tdd는 항상 execute 뒤에 온다" — but this is false on retry. When a user re-runs `sg-tdd` after TDD failures (the skill itself presents this as an option via AskUserQuestion/numbered list), the prior HANDOFF.md last row already shows `tdd`. The new row will claim `From=execute` when the actual prior stage was `tdd`. The audit log becomes incorrect. Additionally, `sg-next` can invoke `sg-tdd` from the `execute` stage but after a `tdd` row already exists, compounding the issue.

The From column is also never read for re-routing decisions (`detectStageFromHandoff` only reads the `To` column), so no routing bug results — but the audit log integrity requirement ("append-only" implies each row accurately reflects the transition) is violated.

**Fix:** Resolve `FROM_STAGE` from the actual last HANDOFF.md `To` value, defaulting to `execute`:

```bash
LAST_REAL_TO=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
  | awk -F'|' '{gsub(/ /,"",$5); print $5}' \
  | grep -vE '^sg-next$' | tail -1)
FROM_STAGE="${LAST_REAL_TO:-execute}"
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | tdd | - | $GIT_USER |" >> .planning/HANDOFF.md
```

Apply the same fix to both `skills/sg-tdd/SKILL.md` and `.agents/skills/sg-tdd/SKILL.md`.

---

## Warnings

### WR-01: `skills/sg-next` STAGE_DISPLAY block missing `tdd)` branch — D-07 violation

**File:** `skills/sg-next/SKILL.md:65-79`

**Issue:** The HANDOFF.md stage detection block in sg-next (which carries the D-07 replication comment) is missing the `tdd)` case in the STAGE_DISPLAY mapping:

```bash
# skills/sg-next/SKILL.md — current (lines 65-77)
case "$STAGE_RAW" in
  init)         STAGE_DISPLAY="init" ;;
  gsd-plan)     STAGE_DISPLAY="gsd" ;;
  ui-plan)      STAGE_DISPLAY="gsd" ;;
  superpowers)  STAGE_DISPLAY="superpowers" ;;
  parallel)     STAGE_DISPLAY="superpowers" ;;
  execute)      STAGE_DISPLAY="superpowers" ;;
  review)       STAGE_DISPLAY="superpowers" ;;   # ← tdd) is absent
  sg-retro)     STAGE_DISPLAY="sg-retro" ;;
  ...
```

The reference block in `skills/sg-status/SKILL.md` (lines 123-136) contains `tdd) STAGE_DISPLAY="superpowers" ;;`. The D-07 contract states these blocks must be updated simultaneously. The comment on line 78 even reads "preserved to maintain D-07 block identity" — which is false as written.

The bug is dormant (sg-next does not print `STAGE_DISPLAY` per the comment on line 78), but the D-07 contract is broken and future readers/tools that diff these blocks will miss the divergence.

**Fix:** Add the missing branch to match sg-status exactly:

```bash
  execute)      STAGE_DISPLAY="superpowers" ;;
  tdd)          STAGE_DISPLAY="superpowers" ;;   # ← add this line
  review)       STAGE_DISPLAY="superpowers" ;;
```

Also apply to `.agents/skills/sg-next/SKILL.md` — that file does not have a STAGE_DISPLAY block at all (the agents version skips the display mapping), so D-07 does not apply there.

---

## Info

### IN-01: `transcript_matcher.cjs` TDD signal checked last — IMPLEMENTATION_SIGNALS can shadow it in transcript fallback path

**File:** `hooks/transcript_matcher.cjs:50-54`

**Issue:** `detectSignal` checks `IMPLEMENTATION_SIGNALS` before `TDD_SIGNALS`. If a session runs sg-execute and then sg-tdd without restarting, both `"finishing-a-development-branch"` (from implementation) and `"TDD verification complete"` may appear in the last 200 transcript lines. The earlier IMPLEMENTATION signal wins and returns `superpowers-implementation-complete` instead of `tdd-complete`. The advice to the user (`Run sg-review`) would still be correct, but the signal label is wrong.

This only affects the transcript fallback path — `stop_hook.cjs` uses HANDOFF.md first (authoritative) and falls back to transcript only for projects with no HANDOFF.md. Since sg-tdd always writes a HANDOFF.md row, a fresh project with no prior HANDOFF.md cannot reach sg-tdd, making this scenario practically unreachable.

**Fix (optional):** Move TDD signal check before IMPLEMENTATION to give it priority over older session signals:

```javascript
if (TDD_SIGNALS.some(sig => recent.includes(sig))) return 'tdd-complete';
if (IMPLEMENTATION_SIGNALS.some(sig => recent.includes(sig))) return 'superpowers-implementation-complete';
```

No urgency — HANDOFF.md path makes this a dead code path in normal operation.

---

_Reviewed: 2026-06-01T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
