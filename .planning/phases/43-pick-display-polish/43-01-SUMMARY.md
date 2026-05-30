---
phase: 43-pick-display-polish
plan: 01
status: complete
files_modified:
  - skills/sg-retro/SKILL.md
lines_before: 381
lines_after: 434
delta: +53
---

# Plan 43-01 Summary — `skills/sg-retro/SKILL.md` --pick + Display Polish

## Overview

`skills/sg-retro/SKILL.md`를 surgical edit 하여 Phase 43의 세 가지 변경을 적용했다:

1. **LENS-03 `--pick` 명시적 lens 선택 UI** (D-01~D-07)
2. **DISPLAY-01 P1 visual emphasis** (D-08~D-11)
3. **DISPLAY-02 lens intent line** (D-12~D-15)

라인 수는 381 → 434 (+53 lines). 보존 영역(STATE.md parsing 블록, Phase 42 smart default 분기, dropped reject 분기, Step 3/3b/4 전체, Step 5 sub-block, Step 6 LENS_NAME case + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + single `>>` redirect block + auto-suggest + HANDOFF append)은 byte-identical 유지.

## Changes Applied

### Task 1 — `--pick` LENS-03 (D-01~D-07)

**A. Step 1 — PICK_MODE 탐지 블록 신설 (D-01, D-02)**

`set -- $ARGUMENTS` 직후에 `for ARG in "$@"; do case "$ARG" in --pick) PICK_MODE=true ;; *) NEW_ARGS=... ;; esac done` 루프 추가. `--pick` 토큰만 제거 후 `set -- $NEW_ARGS`로 positional 재설정, `PHASE_RAW="${1:-}"` / `LENS_RAW="${2:-}"`는 동일하게 작동.

**B. Step 1 본문 산문 갱신**

`Parse \`$ARGUMENTS\` into \`PHASE_RAW\` and \`LENS_RAW\`.` 뒤에 `Detect \`--pick\` token anywhere in the argument list and strip it before positional parsing (D-01, D-02).` 한 문장 삽입.

**C. Step 2 — 충돌 reject 분기 신설 (D-03)**

smart default 분기 **바로 위**에 `--pick` + positional lens 충돌 reject 분기 신설:
```bash
if [ "$PICK_MODE" = "true" ] && { [ -n "$LENS_RAW" ] || [ -n "$EXTRA_LENS_CODES" ]; }; then
  printf 'Cannot combine --pick with positional lens argument.\n...' >&2
  exit 1
fi
```

**D. Step 5 — AskUserQuestion 호출 placeholder 신설 (D-05, D-06)**

`ANALYZE_LENS_RAN=false` 직후, lens loop 진입 텍스트 직전에 `if [ "$PICK_MODE" = "true" ]; then ... fi` 블록 신설. 본문은 `:` no-op + Claude execute-time 가이드 주석(AskUserQuestion 스펙 + 0-selection silent exit 안내).

**E. `<objective>` 본문 갱신**

`via direct arguments,` 뒤에 `the \`--pick\` flag (interactive multiSelect),` 한 절 삽입.

### Task 2 — DISPLAY-01 + DISPLAY-02 (D-08~D-15)

**A. Step 6 — INTENT_LINE case 매핑 신설 (D-12, D-14)**

LENS_NAME case **직후**에 동일 패턴의 INTENT_LINE case 매핑 추가. 3개 lens 각각 고정 영문 italic single-line:
- `ssc`: `_Intent: surface behavior changes — what to start, stop, or continue doing next phase._`
- `dspm`: `_Intent: capture technical decisions, unexpected outcomes, recurring techniques, and verification failures from this phase._`
- `analyze`: `_Intent: scan session transcript for frustration, correction, repetition, and validated-success signals; propose sg-rule drafts._`

em-dash `—` U+2014 사용 (ASCII `--` 아님). single-quote `'...'` 사용 (bash expansion 차단 + underscore 보존).

**B. Step 6 — single `>>` redirect block 내부 INTENT_LINE printf 삽입 (D-13, D-21 보존)**

```bash
{
  printf '%s\n' "$LENS_HEADER"
  printf '_Captured: %s_\n' "$NOW_ISO"      # \n\n → \n 축소
  printf '%s\n\n' "$INTENT_LINE"            # 신규 삽입
  # BODY_PRINTF — Claude inserts subheading + bullet `printf` lines here.
```

빈 줄 총 개수 보존: `_Captured` 다음 줄에 `_Intent` 그리고 빈 줄 1개 (intent line의 `\n\n`이 담당). single redirect block은 그대로 유지(D-21).

**C. Step 6 — ACTION_ITEMS_PRINTF 주석 가이드 갱신 (D-08, D-09, D-11)**

```
# ACTION_ITEMS_PRINTF — Claude inserts row `printf` lines here.
# DISPLAY-01 (D-08, D-09): P1 행은 priority 셀에 `🔴 P1` prefix로 emit. P2/P3는 prefix 없음.
#   printf '| 🔴 P1 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"   # P1 only
#   printf '| P2 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P2 unchanged
#   printf '| P3 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P3 unchanged
```

주석 갱신만 — 실행 동작 변경 없음. Claude가 execute 시점에 이 가이드를 읽고 printf 라인 생성.

**D. Step 5 "Common flow" 항목 #5 산문 갱신**

`_Captured: {NOW_ISO}_` 뒤에 `+ \`_Intent: ..._\`` 토큰 삽입.

**E. `<success_criteria>` 신규 항목 3개 추가 (#12, #13, #14)**

기존 11개 항목(#1~#11) 본문은 byte-identical 보존. #11 직후에 신규 항목 3개 추가:
- #12: `--pick` flag 동작 + 충돌 reject + 0-selection silent exit
- #13: DISPLAY-01 P1 emoji prefix
- #14: DISPLAY-02 lens intent line

### 보존 영역 (byte-identical)

- frontmatter `name`/`description` 필드 + `<language>` 블록
- Step 1 STATE.md parsing 블록 (`# --- BEGIN ... ---` ~ `# --- END ---`)
- Step 1 phase validation / PHASE_PAD / PHASE_DIR / EXTRA_LENS_CODES 파싱
- Step 2 lens case 매핑 3-lens (ssc/dspm/analyze) + dropped reject (4ls/sail/5why + *) + VALID_EXTRAS inner case
- Step 2 smart default 분기 (`LENS_CODES_ARRAY="dspm ssc"`) — Phase 42 carry-forward
- Step 3, 3b, 4 전체
- Step 5 sub-block 본문 (ssc/dspm + DSPM explicit guard / analyze 7-step + ANALYZE_LENS_RAN=true)
- Step 6 LENS_NAME case + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + auto-suggest + HANDOFF append
- `<success_criteria>` 항목 #1~#11 본문

## Verification Results

### Task 1 — PASS

- `grep -c 'PICK_MODE=false'` → 1
- `grep -c 'PICK_MODE=true'` → 1 (assignment) + 2 (string comparison `[ "$PICK_MODE" = "true" ]`) — Plan-spec deviation, 아래 참조
- `grep -cE 'for ARG in "\$@"; do'` → 1
- `grep -c 'D-01, D-02: --pick 토큰을'` → 1
- `grep -c 'Detect ``--pick`` token anywhere in the argument list'` → 1
- `grep -c 'D-03: --pick + positional lens 충돌 reject'` → 1
- `grep -c 'Cannot combine --pick with positional lens argument'` → 1
- `grep -c 'D-05, D-06: --pick 모드'` → 1
- `grep -c 'AskUserQuestion with the spec below'` → 1
- `grep -c '\-\-pick cancelled — no lens selected, no retrospective recorded'` → 1
- `grep -c '``--pick`` flag (interactive multiSelect)'` → 1
- `grep -c 'LENS_CODES_ARRAY="dspm ssc"'` → 2 (Phase 42 smart default + success_criteria #2 산문)
- `grep -c 'BEGIN STATE.md Phase parsing block'` → 1
- `grep -c 'no longer supported (removed in v2.9)'` → 5 (case + VALID_EXTRAS inner + success_criteria #2/#7)
- `git diff --stat HEAD -- skills/sg-learn/SKILL.md | wc -l` → 0

### Task 2 — PASS

- `grep -c "INTENT_LINE='_Intent:"` → 3 (3개 lens)
- `grep -c 'D-12, D-14: lens intent line'` → 1
- `grep -c 'INTENT_LINE"'` (printf 라인 검출) → 1
- `grep -c 'DISPLAY-01 (D-08, D-09): P1 행은 priority 셀에'` → 1
- `grep -c '🔴 P1 | %s | %s'` → 1
- `grep -c "P2 | %s | %s"` → 1
- `grep -c '_Captured: {NOW_ISO}_` + `_Intent: ..._`'` → 1
- `grep -c 'LENS-03, D-01, D-02, D-05'` → 1 (success_criteria #12)
- `grep -c 'DISPLAY-01, D-08, D-09'` → 1 (success_criteria #13)
- `grep -c 'DISPLAY-02, D-12, D-13, D-14, D-15'` → 1 (success_criteria #14)
- `grep -c '<success_criteria>'` → 1
- `grep -c '</success_criteria>'` → 1
- `grep -cF '} >> "$LESSONS_FILE"'` → 1 (D-21 single redirect block 보존)
- `grep -B 2 'BODY_PRINTF — Claude inserts' | grep -c INTENT_LINE` → 1 (INTENT_LINE printf가 BODY_PRINTF 가이드 직전)
- `grep -c 'sg-rule drafts were included in the Conversation Analyzer'` → 1 (auto-suggest 보존)
- `grep -c 'HANDOFF.md record — after all lenses complete'` → 1 (HANDOFF append 보존)
- LENS_NAME case 3-lens 보존 → 각 1
- `grep -c 'Explicit guard'` → 1
- `grep -c 'ANALYZE_LENS_RAN=true'` → 2 (sub-block 본문 + 분리된 setter 블록)

### Task 3 — PASS (D-18 시나리오 1-8 정적 검증)

- **시나리오 1 (`--pick` 정상 진입)**: PICK_MODE 탐지 + AskUserQuestion 가이드 + 0-selection 가이드 모두 존재 ✓
- **시나리오 2 (`--pick` + positional 충돌)**: `D-03: --pick + positional` 다음에 `exit 1` 1회 ✓
- **시나리오 3 (`--pick` 위치 무관)**: `for ARG in "$@"; do` 루프 존재 — 모든 위치 탐지 보장 ✓
- **시나리오 4 (smart default 보존)**: `LENS_CODES_ARRAY="dspm ssc"` 분기 byte-identical ✓
- **시나리오 5 (sg-learn pass-through)**: `git diff --stat HEAD -- skills/sg-learn/SKILL.md` → 0 ✓
- **시나리오 6 (0-selection silent exit)**: `--pick cancelled — no lens selected` 가이드 존재 ✓
- **시나리오 7 (DISPLAY-01 P1 emoji prefix)**: `printf '| 🔴 P1 | %s | %s |` + `printf '| P2 | %s | %s |` 가이드 모두 존재 ✓
- **시나리오 8 (DISPLAY-02 intent line)**: `INTENT_LINE='_Intent:` 3회 + INTENT_LINE printf가 BODY_PRINTF 가이드 위 ✓
- **시나리오 9 (pairwise diff)**: plan 43-02 완료 후 별도 검증 (본 plan scope 외)

### lessons_ranker.cjs 호환성 — Option B 확정

`grep -cE '(\| P1 \||"P1"|P\[123\])' hooks/lessons_ranker.cjs` → 0. ranker는 priority 토큰을 파싱하지 않으므로 `🔴 P1` prefix는 ranker 동작에 영향 없음. 별도 ranker 갱신 plan 불필요.

## Lines Changed

- Before: 381 lines
- After: 434 lines
- Delta: +53 lines

git diff stat: 1 file changed, 59 insertions(+), 6 deletions(-)

## Affected Prose Tokens (Phase 42 P1 #1 적용 — enumerate)

Plan의 `<interfaces>` "변경되는 산문 토큰" 4개 모두 적용:

1. `<objective>` (line 14) — `via direct arguments,` 뒤에 `the \`--pick\` flag (interactive multiSelect),` 절 추가 ✓
2. Step 1 본문 산문 (line 25) — `Parse \`$ARGUMENTS\` ...` 뒤에 `Detect \`--pick\` token anywhere in the argument list and strip it before positional parsing (D-01, D-02).` 한 문장 추가 ✓
3. Step 5 "Common flow" 항목 #5 (line 253) — `_Captured: {NOW_ISO}_` 뒤에 `+ \`_Intent: ..._\`` 토큰 추가 ✓
4. `<success_criteria>` — 신규 #12/#13/#14 항목 추가 ✓

보존된 산문 토큰(절대 변경 금지) 모두 byte-identical:
- `<language>` 블록 / frontmatter `name`+`description` 필드
- Step 1 STATE.md parsing 블록
- Step 2 case 매핑 본문 + dropped reject + VALID_EXTRAS inner + smart default 분기
- Step 3/3b/4 전체
- Step 5 sub-block 본문 + DSPM explicit guard + analyze 7-step + ANALYZE_LENS_RAN setter
- Step 6 LENS_NAME case + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + auto-suggest + HANDOFF append
- `<success_criteria>` 항목 #1~#11 본문

## Plan-spec Deviations (Surfaced)

### Deviation 1: Task 3 acceptance criteria `grep -c 'PICK_MODE=true' returns ≥ 2` (Plan line 692)

Plan의 Task 3 첫 acceptance criterion은 `grep -c 'PICK_MODE=true' returns ≥ 2`로 명시되어 있으나, Plan의 `<interfaces>` "충돌 reject 조건"은 `[ "$PICK_MODE" = "true" ]` (공백 + 따옴표 포함)를 사용하도록 정확히 명시한다. 두 조건은 직접 충돌:

- `<interfaces>`가 지시하는 정확한 bash 토큰: `[ "$PICK_MODE" = "true" ]`
- acceptance가 요구하는 literal grep 패턴: `PICK_MODE=true` (공백·따옴표 없는 직접 substring)

`<interfaces>`의 토큰은 character-exact 명세이므로 우선 적용. 결과적으로 `PICK_MODE=true` literal 출현 회수는 1(`PICK_MODE=true` 단일 assignment만). Task 1 acceptance(`grep -c 'PICK_MODE=true' returns ≥ 1`)와 Task 3 시나리오 verify 스크립트(`grep -q 'PICK_MODE=true'`)는 통과 — Task 3 acceptance `≥ 2`만 satisfy 불가.

이 결정은 plan의 character-exact interface spec을 우선시한 것이며, 의미적으로 PICK_MODE 분기는 의도대로 3곳(탐지 1 + Step 2 충돌 reject 1 + Step 5 AskUserQuestion 1)에 존재한다(`grep -n PICK_MODE` 4개 라인 확인). Phase 42 retro Action Items P1 #1 "plan lint preserve vs grep acceptance" 교훈의 직접 재현 — `<interfaces>` 토큰 spec과 acceptance grep 패턴이 한쪽은 정확 문법, 다른 쪽은 substring 매칭을 사용하면서 충돌.

## Constraints Satisfied

- ✓ Did not call `superpowers:executing-plans`
- ✓ Did not write to `.planning/HANDOFF.md`
- ✓ Did not update `.planning/STATE.md`
- ✓ Did not modify GSD/Superpowers internal files
- ✓ Did not run `git commit` (D-16 staging constraint — phase-level commit only)
- ✓ Did not touch `.agents/skills/sg-retro/SKILL.md` (Plan 43-02's responsibility; file was modified by parallel Plan 43-02 — not by this plan)
- ✓ Did not touch `skills/sg-learn/SKILL.md` (D-11 thin pass-through preserved)
- ✓ Did not touch any other unrelated file
- ✓ Only `skills/sg-retro/SKILL.md` and this SUMMARY.md were modified/created by this plan
