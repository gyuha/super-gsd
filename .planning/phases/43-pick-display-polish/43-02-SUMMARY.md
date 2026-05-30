---
phase: 43-pick-display-polish
plan: 02
status: complete
files_modified:
  - .agents/skills/sg-retro/SKILL.md
lines_before: 370
lines_after: 418
delta: +48
---

# Plan 43-02 Summary — `.agents/skills/sg-retro/SKILL.md` --pick + Display Polish (Codex/Gemini/Antigravity 변종)

## Overview

`.agents/skills/sg-retro/SKILL.md`를 surgical edit 하여 plan 43-01이 `skills/sg-retro/SKILL.md`에 적용한 변경과 **의미적으로 동등**한 변경을 적용했다. 두 파일은 구조적 차이가 있으므로 단순 미러링이 아닌 **동일 의미 단위**의 변경을 각 파일 구조에 맞게 적용했다.

1. **LENS-03 `--pick` graceful fallback** (D-01~D-07, D-17) — 탐지·충돌 reject는 plan 43-01과 byte-identical, AskUserQuestion 호출은 `.agents/` 환경에서는 graceful early-exit로 대체
2. **DISPLAY-01 P1 visual emphasis** (D-08~D-11) — plan 43-01과 byte-identical
3. **DISPLAY-02 lens intent line** (D-12~D-15) — plan 43-01과 byte-identical + `<lens_templates>` 3개 템플릿 일관성 갱신

라인 수는 370 → 418 (+48 lines). 보존 영역(STATE.md parsing 블록, Phase 42 smart default 분기, dropped reject 분기, Step 3/3b/4 전체, Step 5 sub-block, Step 6 LENS_NAME case + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + single `>>` redirect block + auto-suggest)은 byte-identical 유지.

## Changes Applied

### Task 1 — PICK_MODE 탐지 + 충돌 reject + graceful fallback + 산문/frontmatter 갱신 (LENS-03 + D-17)

**A. argument-hint frontmatter 갱신 (Claude 재량, 권장 문구)**

frontmatter line 4를 `--pick` 사용법 + graceful exit 안내를 포함하도록 갱신:
- 변경 후: `argument-hint: "[phase] [lens...|--pick] - e.g. '14 ssc' or '14 --pick'. lens: ssc|dspm|analyze. Omit lens for smart default (dspm+ssc). --pick is not supported in this environment (AskUserQuestion required) — use positional args instead."`

**B. `<constraints>` 블록 갱신 (D-17 옵션 b — Phase 42 retro prose drift 교훈 적용)**

첫 줄에 `--pick` graceful early-exit 동작 한 문장 추가. SubagentStop / Superpowers 줄은 byte-identical 보존.

**C. `<objective>` 산문 갱신**

기존 본문 `... apply the smart default (dspm+ssc).` 뒤에 `The \`--pick\` flag is accepted for argument compatibility but triggers a graceful early-exit since AskUserQuestion is unavailable in this environment.` 한 문장 삽입.

**D. Step 1 — PICK_MODE 탐지 블록 신설 (D-01, D-02)**

`set -- $ARGUMENTS` 직후에 plan 43-01과 byte-identical bash 블록 (for-loop + NEW_ARGS + 정상 positional 파싱) 추가:

```bash
PICK_MODE=false
NEW_ARGS=""
for ARG in "$@"; do
  case "$ARG" in
    --pick)
      PICK_MODE=true
      ;;
    *)
      NEW_ARGS="${NEW_ARGS}${NEW_ARGS:+ }${ARG}"
      ;;
  esac
done
# shellcheck disable=SC2086 — intentional word splitting for positional re-set
set -- $NEW_ARGS
PHASE_RAW="${1:-}"
LENS_RAW="${2:-}"
```

**E. Step 1 본문 산문 갱신**

`Parse \`$ARGUMENTS\` into \`PHASE_RAW\` and \`LENS_RAW\`.` 뒤에 `Detect \`--pick\` token anywhere in the argument list and strip it before positional parsing (D-01, D-02).` 한 문장 삽입.

**F. Step 2 — 충돌 reject 분기 신설 (D-03)**

smart default 분기 **바로 위**에 plan 43-01과 byte-identical 분기 추가. 메시지는 plan 43-01과 byte-identical:

```bash
if [ "$PICK_MODE" = "true" ] && { [ -n "$LENS_RAW" ] || [ -n "$EXTRA_LENS_CODES" ]; }; then
  printf 'Cannot combine --pick with positional lens argument.\nUse either: sg-retro {phase} {lens...}  (explicit args)\nOr:         sg-retro {phase} --pick     (interactive picker)\n' >&2
  exit 1
fi
```

**G. Step 5 — graceful fallback 분기 신설 (D-05, D-06, D-17 — `.agents/` 변종 고유)**

`ANALYZE_LENS_RAN=false` 직후, lens loop 진입 텍스트 직전에 graceful early-exit 분기 신설. plan 43-01의 AskUserQuestion 호출 placeholder와 달리, `.agents/` 환경에서는 AskUserQuestion이 부재하므로 즉시 stderr 안내 + exit 1:

```bash
# D-05, D-06, D-17: --pick 모드 — AskUserQuestion 미지원 환경 graceful fallback
if [ "$PICK_MODE" = "true" ]; then
  printf -- '--pick is not supported in this environment (AskUserQuestion required).\nUse positional lens args (e.g. '\''sg-retro %s ssc dspm'\'') or omit lens for smart default (dspm+ssc).\n' "${PHASE_RAW}" >&2
  exit 1
fi
```

`printf --` 사용 이유: `--pick`이 메시지 본문에 포함되므로 `--` 종결자로 옵션 해석 차단. single-quote escape `'\''` 패턴은 BSD/GNU 양립.

### Task 2 — INTENT_LINE + P1 emoji + `<lens_templates>` + success_criteria (DISPLAY-01, DISPLAY-02)

**A. Step 6 — INTENT_LINE case 매핑 신설 (D-12, D-14)**

LENS_NAME case **직후**에 plan 43-01과 byte-identical INTENT_LINE case 매핑 추가. 3개 lens 각각 고정 영문 italic single-line:
- `ssc`: `_Intent: surface behavior changes — what to start, stop, or continue doing next phase._`
- `dspm`: `_Intent: capture technical decisions, unexpected outcomes, recurring techniques, and verification failures from this phase._`
- `analyze`: `_Intent: scan session transcript for frustration, correction, repetition, and validated-success signals; propose sg-rule drafts._`

em-dash `—` U+2014 사용 (ASCII `--` 아님). single-quote `'...'` 사용 (bash expansion 차단 + underscore 보존). 2-space 들여쓰기 + `analyze` 7자 패딩 정렬.

**B. Step 6 — single `>>` redirect block 내부 INTENT_LINE printf 삽입 (D-13, D-21 보존)**

```bash
{
  printf '%s\n' "$LENS_HEADER"
  printf '_Captured: %s_\n' "$NOW_ISO"      # \n\n → \n 축소
  printf '%s\n\n' "$INTENT_LINE"            # 신규 삽입
  # BODY_PRINTF — insert subheading + bullet printf lines here (confirmed content)
```

빈 줄 총 개수 보존: `_Captured` 다음 줄에 `_Intent` 그리고 빈 줄 1개 (intent line의 `\n\n`이 담당). single `>>` redirect block은 그대로 유지(D-21).

**C. Step 6 — ACTION_ITEMS_PRINTF 주석 가이드 갱신 (D-08, D-09, D-11)**

```
  # ACTION_ITEMS_PRINTF — insert row printf lines here
  # DISPLAY-01 (D-08, D-09): P1 행은 priority 셀에 `🔴 P1` prefix로 emit. P2/P3는 prefix 없음.
  #   printf '| 🔴 P1 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"   # P1 only
  #   printf '| P2 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P2 unchanged
  #   printf '| P3 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P3 unchanged
```

주석 갱신만 — 실행 동작 변경 없음. Claude가 execute 시점에 이 가이드를 읽고 printf 라인 생성.

**D. Step 5 "Common flow" 항목 #5 산문 갱신**

`_Captured: {NOW_ISO}_` 뒤에 `+ \`_Intent: ..._\`` 토큰 삽입. `+ subheadings + Action Items`까지 명시.

**E. `<lens_templates>` 3개 템플릿에 `_Intent:` 줄 추가 (DISPLAY-02 템플릿 일관성)**

세 템플릿(ssc/dspm/analyze) 각각의 `_Captured: {ISO-8601 UTC}_` 줄 직후에 해당 lens의 `_Intent: ..._` 줄을 추가. `_Captured:` 다음 빈 줄 1개 → `_Intent:` 줄 + 빈 줄 1개로 교체. 빈 줄 총 개수 보존.

**F. `<lens_templates>` Action Items P1 예시 행 갱신 (DISPLAY-01 일관성)**

세 템플릿의 Action Items 예시 행:
- 변경 전: `| P1 | [summary] | [concrete step] |`
- 변경 후: `| 🔴 P1 | [summary] | [concrete step] |`

3개 템플릿 모두 동일.

**G. `<success_criteria>` 신규 항목 3개 추가 (#8, #9, #10)**

기존 7개 항목(#1~#7) 본문은 byte-identical 보존. #7 직후에 신규 항목 3개 추가:
- #8: `--pick` graceful exit + 충돌 reject + smart default 보존 (LENS-03, D-01, D-02, D-05, D-17)
- #9: DISPLAY-01 P1 emoji prefix (DISPLAY-01, D-08, D-09)
- #10: DISPLAY-02 lens intent line (DISPLAY-02, D-12, D-13, D-14, D-15)

### 보존 영역 (byte-identical)

- frontmatter `name`/`description` 필드 + `<language>` 블록 + `<execution_context>` 블록
- `<constraints>` 블록의 SubagentStop / Superpowers 줄 (첫 줄만 갱신)
- Step 1 STATE.md parsing 블록 (`# --- BEGIN ... ---` ~ `# --- END ---`)
- Step 1 phase validation / PHASE_PAD / PHASE_DIR / EXTRA_LENS_CODES 파싱
- Step 2 lens case 매핑 3-lens (ssc/dspm/analyze) + dropped reject (4ls/sail/5why + *) + VALID_EXTRAS inner case
- Step 2 smart default 분기 (`LENS_CODES_ARRAY="dspm ssc"`) — Phase 42 carry-forward
- Step 3, 3b, 4 전체
- Step 5 sub-block 본문 (ssc/dspm + DSPM explicit guard / analyze 7-step + ANALYZE_LENS_RAN=true)
- Step 6 LENS_NAME case (INTENT_LINE 추가는 그 직후) + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + auto-suggest
- `<success_criteria>` 항목 #1~#7 본문
- `.agents/skills/sg-learn/SKILL.md` (D-11 thin pass-through 보존)

## Verification Results

### Task 1 — PASS

- `grep -c 'argument-hint:.*\[lens\.\.\.|--pick\]'` → 1 (frontmatter 갱신)
- `grep -c '\-\-pick is not supported in this environment'` → 2 (argument-hint + Step 5 graceful exit) — acceptance ≥2 satisfied
- `` grep -c '`--pick` flag triggers a graceful early-exit' `` → 1 (constraints 갱신)
- `` grep -c '`--pick` flag is accepted for argument compatibility but triggers a graceful early-exit' `` → 1 (objective 갱신)
- `grep -c 'PICK_MODE=false'` → 1
- `grep -c 'PICK_MODE=true'` → 1 (assignment) — Plan-spec deviation도 plan 43-01과 동일 (아래 참조)
- `grep -cE 'for ARG in "\$@"; do'` → 1
- `grep -c 'D-01, D-02: --pick 토큰을'` → 1
- `` grep -c 'Detect `--pick` token anywhere in the argument list' `` → 1
- `grep -c 'D-03: --pick + positional lens 충돌 reject'` → 1
- `grep -c 'Cannot combine --pick with positional lens argument'` → 1
- `grep -c 'D-05, D-06, D-17: --pick 모드'` → 1
- `grep -c 'AskUserQuestion with the spec below'` → 0 (`.agents/` 변종은 AskUserQuestion 호출 안 함) ✓
- `grep -c 'LENS_CODES_ARRAY="dspm ssc"'` → 1 (Phase 42 smart default 보존)
- `grep -c 'BEGIN STATE.md Phase parsing block'` → 1
- `grep -c 'no longer supported (removed in v2.9)'` → 4 (case + VALID_EXTRAS inner + success_criteria #3 산문)
- `git diff --stat HEAD -- .agents/skills/sg-learn/SKILL.md | wc -l` → 0 (D-11 sg-learn 미변경)

### Task 2 — PASS

- `grep -c "INTENT_LINE='_Intent:"` → 3 (3개 lens)
- `grep -c 'D-12, D-14: lens intent line'` → 1
- `grep -cF "printf '%s\n\n' \"\$INTENT_LINE\""` → 1
- `grep -c 'DISPLAY-01 (D-08, D-09): P1 행은 priority 셀에'` → 1
- `` grep -c "printf '| 🔴 P1 | %s | %s |" `` → 1 (가이드 예시)
- `` grep -c '_Captured: {NOW_ISO}_` + `_Intent: ..._`' `` → 1
- `grep -c '^_Intent: '` → 3 (lens_templates 3개)
- `grep -c '^_Intent: surface behavior changes'` → 1
- `grep -c '^_Intent: capture technical decisions'` → 1
- `grep -c '^_Intent: scan session transcript'` → 1
- `grep -c '| 🔴 P1 | \[summary\] | \[concrete step\] |'` → 3 (3개 템플릿)
- `grep -cE '^\| P1 \| \[summary\]'` → 0 (기존 P1 예시 행 부재)
- `grep -c 'LENS-03, D-01, D-02, D-05, D-17'` → 1 (success_criteria #8)
- `grep -c 'DISPLAY-01, D-08, D-09'` → 1 (success_criteria #9)
- `grep -c 'DISPLAY-02, D-12, D-13, D-14, D-15'` → 1 (success_criteria #10)
- `grep -c '<success_criteria>'` / `grep -c '</success_criteria>'` → 1/1
- `grep -c '<lens_templates>'` / `grep -c '</lens_templates>'` → 1/1
- `grep -c '} >> "\$LESSONS_FILE"'` → 1 (D-21 single redirect 보존)
- `grep -c 'sg-rule drafts were included in the Conversation Analyzer'` → 1 (auto-suggest 보존)
- LENS_NAME case 3-lens 보존 → 각 1

### Task 3 — PASS (D-18 시나리오 1-5, 7-9 정적 검증)

- **시나리오 1 (`--pick` graceful early-exit, `.agents/` 변종 고유)**: `D-05, D-06, D-17: --pick 모드` 다음 라인에 `exit 1` 1회 + stderr 메시지 존재 ✓
- **시나리오 2 (`--pick` + positional 충돌 reject)**: `D-03: --pick + positional` 다음에 `exit 1` 1회 ✓
- **시나리오 3 (`--pick` 위치 무관)**: `for ARG in "$@"; do` 루프 존재 — 모든 위치 탐지 보장 ✓
- **시나리오 4 (smart default 보존)**: `LENS_CODES_ARRAY="dspm ssc"` 분기 byte-identical ✓
- **시나리오 5 (sg-learn pass-through)**: `git diff --stat HEAD -- .agents/skills/sg-learn/SKILL.md | wc -l` → 0 ✓
- **시나리오 6 (0-selection silent exit)**: `.agents/` 환경에서는 AskUserQuestion이 호출되지 않으므로 시나리오 1으로 covered ✓
- **시나리오 7 (DISPLAY-01 P1 emoji prefix)**: ACTION_ITEMS_PRINTF 가이드 + `<lens_templates>` 예시 행 모두 `🔴 P1` 사용 ✓
- **시나리오 8 (DISPLAY-02 intent line)**: INTENT_LINE 3개 case + redirect block printf + `<lens_templates>` 3개 템플릿 적용 ✓
- **시나리오 9 (pairwise 의미 단위 동등성)**: PASS — 아래 pairwise 섹션 참조 ✓

### Pairwise Diff Check (D-16) — PASS

`skills/sg-retro/SKILL.md` (plan 43-01 적용 완료)와 `.agents/skills/sg-retro/SKILL.md` (본 plan 적용 완료) 간 의미적 동등성:

**공통 토큰 (양쪽 파일에 모두 존재):**
- `PICK_MODE=false` 탐지: 양쪽 각 1
- `Cannot combine --pick with positional lens argument` 충돌 메시지: 양쪽 각 1 (byte-identical)
- `INTENT_LINE=` 3개 case (ssc/dspm/analyze): 양쪽 각 3 (byte-identical 문구)
- `printf '| 🔴 P1 |` ACTION_ITEMS_PRINTF 가이드: 양쪽 각 1

**의도적 차이 (plan 의도와 일치):**
- `AskUserQuestion with the spec below`: skills/ 1, .agents/ 0 — `.agents/`는 AskUserQuestion 호출 안 함
- `--pick is not supported in this environment`: .agents/ 2, skills/ 0 — `.agents/`만 graceful exit
- `<constraints>`: .agents/ 1, skills/ 0 — `.agents/` 변종 고유 블록
- `<lens_templates>`: .agents/ 1, skills/ 0 — `.agents/` 변종 고유 블록
- `argument-hint`: .agents/ 1 (frontmatter), skills/ 0 — `.agents/` 변종 고유 frontmatter

모두 plan 43-02 `<interfaces>` "차이 허용 토큰" 명세와 일치한다.

## Lines Changed

- Before (HEAD): 370 lines
- After: 418 lines
- Delta: +48 lines

`git diff --stat HEAD -- .agents/skills/sg-retro/SKILL.md` → `1 file changed, 57 insertions(+), 9 deletions(-)`

## Affected Prose Tokens (Phase 42 P1 #1 적용 — enumerate)

Plan의 `<interfaces>` "변경되는 산문 토큰" 항목 모두 적용:

1. `<objective>` 본문 — `... apply the smart default (dspm+ssc).` 뒤에 `--pick` graceful exit 한 문장 추가 ✓
2. `<constraints>` 첫 항목 — `--pick` graceful early-exit 동작 한 문장 추가 (D-17 옵션 b) ✓
3. Step 1 본문 산문 — `Parse $ARGUMENTS ...` 뒤에 `--pick` 탐지 안내 한 문장 추가 ✓
4. Step 5 "Common flow" 항목 #5 — `_Captured: {NOW_ISO}_` 뒤에 `+ \`_Intent: ..._\`` + `+ subheadings + Action Items` 토큰 추가 ✓
5. argument-hint frontmatter — `[lens]` → `[lens...|--pick]` + `--pick` 예시 + 미지원 안내 한 문장 추가 ✓
6. `<lens_templates>` 3개 템플릿 — 각 `_Captured:` 다음에 `_Intent:` 줄 추가 + Action Items 예시 행 `P1` → `🔴 P1` ✓
7. `<success_criteria>` — 신규 #8/#9/#10 항목 추가 ✓

보존된 산문 토큰(절대 변경 금지) 모두 byte-identical:
- `<language>` 블록 / `<execution_context>` 블록 / frontmatter `name`+`description` 필드
- `<constraints>` 블록의 SubagentStop / Superpowers 줄
- Step 1 STATE.md parsing 블록
- Step 2 case 매핑 본문 + dropped reject + VALID_EXTRAS inner + smart default 분기
- Step 3/3b/4 전체
- Step 5 sub-block 본문 + DSPM explicit guard + analyze 7-step + ANALYZE_LENS_RAN setter
- Step 6 LENS_NAME case + RUN_SUFFIX + LENS_HEADER + 신규 파일 헤더 + auto-suggest
- `<success_criteria>` 항목 #1~#7 본문

## Plan-spec Deviations (Surfaced)

### Deviation 1: `grep -c 'PICK_MODE=true'` literal count

Plan의 Task 1 acceptance criterion은 `grep -c 'PICK_MODE=true'` literal substring count를 측정하지만, 본 plan은 `[ "$PICK_MODE" = "true" ]` (공백 + 따옴표) 형태로 비교를 수행한다. 두 표현의 grep substring 매칭:

- `PICK_MODE=true` (정확 substring) → assignment 1회만 매칭 (`PICK_MODE=true` 라인)
- `[ "$PICK_MODE" = "true" ]` → `PICK_MODE=true` substring 미포함 (공백+따옴표 때문)

따라서 `grep -c 'PICK_MODE=true'` 결과는 1이 된다. plan 43-01과 동일 패턴이며 (`grep -c 'PICK_MODE=true' → 1`), 의미적 동등성은 유지. acceptance에서 ≥1만 요구하므로 PASS.

### No other plan-spec deviations

`<interfaces>`의 모든 토큰 명세와 acceptance criteria가 일관되게 적용되었다. plan 43-01과 본 plan 모두 동일 패턴(`PICK_MODE=true` 1회 assignment + `[ "$PICK_MODE" = "true" ]` 다회 비교)을 사용 — pairwise 의미적 동등성 유지.

## Constraints Satisfied

- ✓ Did not call `superpowers:executing-plans`
- ✓ Did not write to `.planning/HANDOFF.md`
- ✓ Did not update `.planning/STATE.md`
- ✓ Did not modify GSD/Superpowers internal files
- ✓ Did not run `git commit` (D-16 staging constraint — phase-level commit only)
- ✓ Did not touch `skills/sg-retro/SKILL.md` (Plan 43-01's responsibility)
- ✓ Did not touch `.agents/skills/sg-learn/SKILL.md` (D-11 thin pass-through preserved)
- ✓ Did not touch `skills/sg-learn/SKILL.md` (D-11, plan 43-01 responsibility — not this plan)
- ✓ Did not touch any other unrelated file
- ✓ Only `.agents/skills/sg-retro/SKILL.md` and this SUMMARY.md were modified/created by this plan
