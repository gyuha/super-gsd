---
name: sg-retro
description: Run a structured retrospective on a GSD phase with one of six lenses (SSC, 4Ls, DSPM, Sailboat, Five Whys, Conversation Analyzer) — select multiple lenses in one call — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md.
---

<objective>
Run a structured retrospective on a GSD phase. Auto-collect phase artifacts and git context. Let the user pick one or more of six lenses — Start/Stop/Continue (ssc), 4Ls (4ls), Decisions/Surprises/Patterns/Mistakes (dspm), Sailboat (sail), Five Whys (5why), Conversation Analyzer (analyze) — via AskUserQuestion multiSelect or directly via arguments. Facilitate each lens (artifact-grounded for ssc/4ls/dspm/sail; user-driven for 5why; transcript-native for analyze), then append all results sequentially to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. After all lenses complete, auto-suggest hookify rule drafts once.
</objective>

<execution_context>
Self-contained. Reads `.planning/STATE.md`, `.planning/phases/{NN}-*/{NN}-CONTEXT.md`, all `{NN}-*-PLAN.md`, all `{NN}-*-SUMMARY.md`, and `git log`/`git diff`. Writes only `.planning/lessons/{NN}-{YYYY-MM-DD}.md` (and creates `.planning/lessons/` if missing). The Skill bypasses `hooks/stop_hook.py` entirely — no helper invocation, no Python lessons writer — and never touches the append-only audit log used by other sg-* commands.
</execution_context>

<process>

**Step 1 — Argument parsing + phase resolve.**

Parse `$ARGUMENTS` into `PHASE_RAW` and `LENS_RAW`. If `PHASE_RAW` is empty, fall back to `.planning/STATE.md` `^Phase:` line using the multi-line `sed` pattern below (Phase 7 D-04~D-06 lock). **Do not introduce a single-token regex shortcut** — preserve the full grep + sed + awk pipeline as-is.

```bash
set -- $ARGUMENTS
PHASE_RAW="${1:-}"
LENS_RAW="${2:-}"

if [ -z "$PHASE_RAW" ]; then
  # --- BEGIN STATE.md Phase parsing block (D-08: Phase 7 D-04~D-06 multi-line 패턴 인라인 복제) ---
  PHASE_RAW=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
              | sed -E 's/^Phase:[[:space:]]*//' \
              | sed -E 's/[[:space:]]+$//' \
              | awk '{print $1}')
  # --- END STATE.md Phase parsing block ---
fi

# D-02: 숫자만 허용
if ! printf '%s' "$PHASE_RAW" | grep -qE '^[0-9]+$'; then
  echo "Phase token must be a number. Got: '${PHASE_RAW}'." >&2
  if [ -d .planning/phases ]; then
    echo "Available phases:" >&2
    ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  fi
  exit 1
fi

PHASE_PAD=$(printf "%02d" "$PHASE_RAW")
PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-*/ 2>/dev/null | head -1)

# D-04: 디렉터리 미존재 에러
if [ -z "$PHASE_DIR" ]; then
  echo "Phase ${PHASE_RAW} not found. Available phases:" >&2
  ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  exit 1
fi
PHASE_DIR="${PHASE_DIR%/}"  # trailing slash 제거

# D-21: 3번째 이후 토큰을 추가 lens 코드로 파싱
EXTRA_LENS_CODES=""
if [ -n "${3:-}" ]; then
  shift 2
  EXTRA_LENS_CODES="$@"
fi

LENS_CODES_ARRAY=""
```

**Step 2 — Lens code mapping or AskUserQuestion fallback.**

Map `LENS_RAW` to one of `ssc`/`4ls`/`dspm`/`sail`/`5why`/`analyze` (case-insensitive). If empty or unmapped, invoke AskUserQuestion with header `Lens`, multiSelect:true, and the six options below. No default option is preselected.

```bash
LENS_CODE=""
if [ -n "$LENS_RAW" ]; then
  LENS_LC=$(printf '%s' "$LENS_RAW" | tr '[:upper:]' '[:lower:]')
  case "$LENS_LC" in
    ssc)     LENS_CODE="ssc"     ;;
    4ls)     LENS_CODE="4ls"     ;;
    dspm)    LENS_CODE="dspm"    ;;
    sail)    LENS_CODE="sail"    ;;
    5why)    LENS_CODE="5why"    ;;
    analyze) LENS_CODE="analyze" ;;
    *)       LENS_CODE=""        ;;  # 매핑 실패 → AskUserQuestion fallback
  esac
fi
```

If `LENS_CODE` is empty, call AskUserQuestion as follows (header `Lens`, 6 options, multiSelect:true, no default):

```
AskUserQuestion(
  questions: [{
    question: "Which retrospective lens(es) do you want to run?",
    header: "Lens",
    multiSelect: true,
    options: [
      { label: "Start/Stop/Continue (ssc)", description: "Behavior change — what to begin, stop, and continue based on phase artifacts." },
      { label: "4Ls (4ls)", description: "Liked / Learned / Lacked / Longed For — emotion + knowledge balance." },
      { label: "Decisions/Surprises/Patterns/Mistakes (dspm)", description: "Technical retrospective — locked decisions, pivots, recurring techniques, and verification failures." },
      { label: "Sailboat (sail)", description: "Wind / Anchor / Sun / Rock — metaphorical retrospective on propulsion, drag, energy, and risks." },
      { label: "Five Whys (5why)", description: "User-driven root cause analysis — state a problem, answer 5 iterative Why questions, derive root cause." },
      { label: "Conversation Analyzer (analyze)", description: "Extract frustration signals, correction patterns, repeated issues, and validated successes from the session transcript." }
    ]
  }]
)
```

Extract lens codes from multiSelect response and build LENS_CODES_ARRAY:

```bash
# multiSelect 응답에서 각 코드 추출 (괄호 안 코드 파싱)
LENS_CODES_ARRAY=$(printf '%s' "$ASKUSERQUESTION_RESPONSE" \
  | grep -oE '\((ssc|4ls|dspm|sail|5why|analyze)\)' \
  | tr -d '()')
```

Single-lens argument 경로 (D-19):

```bash
# D-19: 인수 경로 — LENS_CODE가 있으면 배열 구성, EXTRA_LENS_CODES가 있으면 추가
if [ -n "$LENS_CODE" ]; then
  if [ -n "$EXTRA_LENS_CODES" ]; then
    # D-21: 3번째 이후 토큰도 배열에 포함
    VALID_EXTRAS=""
    for EC in $EXTRA_LENS_CODES; do
      EC_LC=$(printf '%s' "$EC" | tr '[:upper:]' '[:lower:]')
      case "$EC_LC" in
        ssc|4ls|dspm|sail|5why|analyze) VALID_EXTRAS="${VALID_EXTRAS} ${EC_LC}" ;;
      esac
    done
    LENS_CODES_ARRAY="${LENS_CODE}${VALID_EXTRAS}"
  else
    LENS_CODES_ARRAY="$LENS_CODE"
  fi
fi
```

**Step 3 — Collect target artifacts.**

Collect exactly three artifact types (`{NN}-CONTEXT.md` + all `{NN}-*-PLAN.md` + all `{NN}-*-SUMMARY.md`). Do NOT auto-include `{NN}-PATTERNS.md`, `{NN}-VERIFICATION.md`, `{NN}-RESEARCH.md`, or `{NN}-DISCUSSION-LOG.md` (D-05). Use the Read tool inline on each path in the lens facilitation step.

```bash
CONTEXT_FILE="${PHASE_DIR}/${PHASE_PAD}-CONTEXT.md"
PLAN_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-PLAN.md 2>/dev/null)
SUMMARY_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-SUMMARY.md 2>/dev/null)

# 표시(stderr 진단용; lens facilitation은 본문에서 직접 Read 도구로 읽음)
echo "Collected artifacts:" >&2
[ -f "$CONTEXT_FILE" ] && echo "  $CONTEXT_FILE" >&2
[ -n "$PLAN_FILES" ] && printf '  %s\n' $PLAN_FILES >&2
[ -n "$SUMMARY_FILES" ] && printf '  %s\n' $SUMMARY_FILES >&2
```

**Step 3b — Collect session transcript (analyze lens용).**

```bash
# D-06: 세션 transcript 수집 (analyze lens용)
PROJECT_SLUG=$(pwd | tr '/' '-' | sed 's/^-//')
TRANSCRIPT_DIR="$HOME/.claude/projects/${PROJECT_SLUG}"
TRANSCRIPT_FILE=$(ls -t "${TRANSCRIPT_DIR}"/*.jsonl 2>/dev/null | head -1)
if [ -z "$TRANSCRIPT_FILE" ]; then
  echo "[Conversation Analyzer] No transcript found at ${TRANSCRIPT_DIR}." >&2
  TRANSCRIPT_FILE=""
fi
```

**Step 4 — Collect git context.**

Compute `BASE` as the last commit touching `.planning/phases/${PHASE_PAD}-*/`. If empty, fallback to `HEAD~10..HEAD` (D-06). Apply adaptive 1000-line cap to diff (D-07); log is uncapped.

```bash
BASE=$(git log -1 --format=%H -- .planning/phases/${PHASE_PAD}-*/ 2>/dev/null)
if [ -z "$BASE" ]; then
  RANGE="HEAD~10..HEAD"
else
  RANGE="${BASE}..HEAD"
fi

# git log: cap 없이 oneline 전체
GIT_LOG=$(git log ${RANGE} --oneline 2>/dev/null)

# git diff: 적응형 1000줄 cap
DIFF=$(git diff ${RANGE} 2>/dev/null)
LINES=$(printf '%s\n' "$DIFF" | wc -l | tr -d ' ')
if [ "$LINES" -gt 1000 ]; then
  GIT_DIFF=$(printf '[diff truncated — %s lines exceeded 1000-line cap; showing --stat summary]\n' "$LINES"; git diff --stat ${RANGE} 2>/dev/null)
else
  GIT_DIFF="$DIFF"
fi

echo "Git range: ${RANGE}" >&2
```

**Step 5 — Multi-lens execution loop + lens facilitation (artifact-grounded draft-then-confirm).**

Execute each lens in LENS_CODES_ARRAY sequentially. For each iteration, set LENS_CODE to the current code and run the matching sub-block. After the sub-block completes, run Step 6 append for that lens.

```
for LENS_CODE in $LENS_CODES_ARRAY; do
  [run sub-block for LENS_CODE]
  [run Step 6 append for this LENS_CODE]
done
```

Five Whys(`5why`)가 배열에 포함된 경우, 대화형 흐름이 완전히 완료될 때까지 다음 lens로 진행하지 않는다. Lens 사이 "다음으로 진행?" 확인은 없다 — 자동 순차 실행.

Common flow for ssc/4ls/dspm/sail lenses (D-09 hybrid + D-10 artifact-grounded draft-then-confirm):

1. Read all three artifact types (CONTEXT, PLAN(s), SUMMARY(s)) and capture key signals from `${GIT_LOG}` and `${GIT_DIFF}` (range: `${RANGE}`).
2. For each lens-specific subheading, propose 2–5 draft bullet items grounded in the artifacts above. Each bullet must cite the source (file path or commit hash). Present the full draft as a single markdown block.
3. Ask the user to confirm/edit/add/delete each subheading's items. Use the user's input language (D-16 — auto-detect; this is the body content language, not the markdown structure markers). Single round-trip preferred — present all subheadings at once, not one-by-one.
4. After items are finalized, propose 2–4 Action Items rows: priority (`P1`/`P2`/`P3`) | one-sentence item | concrete next step or `deferred to Phase N` label. **No owner column (D-12).** User confirms/edits the table.
5. Assemble the final lens section (header + `_Captured: {NOW_ISO}_` + subheadings + Action Items) and append to `${LESSONS_FILE}` using the bash block in Step 6. Empty body or empty action items violates RETRO-04. Emit `Lessons saved to ${LESSONS_FILE}.` to stdout. No other output.

Lens-specific sub-blocks:

**Sub-block `ssc` (Start/Stop/Continue):**
- Fixed subheadings: `### Start` / `### Stop` / `### Continue`.
- Facilitation: For **Start**, propose practices/tools/conventions the team should begin adopting based on PLAN.md gaps and SUMMARY follow-ups. For **Stop**, propose anti-patterns visible in `git diff` or CONTEXT decisions reversed mid-phase. For **Continue**, propose practices visible in SUMMARY that delivered observed value.

**Sub-block `4ls` (4Ls):**
- Fixed subheadings: `### Liked` / `### Learned` / `### Lacked` / `### Longed For`.
- Facilitation: **Liked** = observed strengths in CONTEXT/PLAN/SUMMARY artifacts. **Learned** = unexpected discoveries from `git diff` or SUMMARY lessons. **Lacked** = missing capabilities/info revealed by phase decisions. **Longed For** = wishes inferred from SUMMARY deferrals or CONTEXT "Deferred Ideas" section.

**Sub-block `dspm` (Decisions/Surprises/Patterns/Mistakes):**
- Fixed subheadings: `### Decisions` / `### Surprises` / `### Patterns` / `### Mistakes`.
- Facilitation: **Decisions** = D-XX locks from CONTEXT and SUMMARY lock-in. **Surprises** = `git log` commit messages that pivoted phase direction. **Patterns** = recurring techniques across multiple PLAN tasks. **Mistakes** = verification failures + known risks not mitigated (CONTEXT "Known Risk Sites" that surfaced).
- **Explicit guard:** DSPM derives all four categories strictly from collected phase artifacts + `git log`/`git diff`. **Do NOT read or analyze session transcript, even if it appears relevant.** Phase 10 ANALYZER will add transcript-based merging additively (D-11).

**Sub-block `sail` (Sailboat):**
- Fixed subheadings: `### Wind` / `### Anchor` / `### Sun` / `### Rock`
- Facilitation: D-11 artifact-grounded draft-then-confirm 방식. Wind/Sun은 SUMMARY의 긍정 신호(완료 항목, 예상보다 빠른 성과)에서, Anchor/Rock은 CONTEXT "Known Risk Sites" + 지연된 태스크 + git diff의 revertion 패턴에서 초안 도출. 각 항목은 출처 파일 경로 또는 commit hash를 인용. 전체 초안을 한 번에 제시한 뒤 사용자 수정/확정. Action Items 2-4개 확정 후 append.

**Sub-block `5why` (Five Whys):**
- Fixed subheadings: `### Problem Statement` / `### Why 1` ~ `### Why 5` / `### Root Cause`
- Facilitation (D-14, D-16 — 사용자 주도 대화형):
  1. AskUserQuestion header `"Five Whys"`, question `"What problem do you want to analyze? (Leave blank to let me suggest from phase artifacts)"` 로 problem statement 수집. 사용자가 공백 입력 시 Claude가 phase artifacts에서 Mistakes 또는 알려진 위험 항목을 후보로 제시하되 사용자 확인 필요.
  2. Why 1 질문을 plain text로 출력: `"Why did [problem statement] happen?"`. 사용자 답변 대기.
  3. Why 2~5까지 답변을 입력받으며 순차 진행. 각 단계에서 이전 답변을 why 질문의 대상으로 사용.
  4. 5번 완료 후 Root Cause 도출 요약 + Action Items 확정 후 append.
  - git artifacts는 문맥 보강용으로만 참조 (D-16).

**Sub-block `analyze` (Conversation Analyzer):**
- Fixed subheadings: `### Analysis Findings` (표) / `### Draft Hookify Rules` / `### Action Items`
- Facilitation (D-05, D-07, D-08):
  1. TRANSCRIPT_FILE이 비어 있으면 즉시 종료: `echo "No transcript found — skipping Conversation Analyzer." >&2` 후 해당 lens 결과 없이 다음 lens로 진행 또는 종료. ANALYZE_LENS_RAN은 설정하지 않음.
  2. TRANSCRIPT_FILE이 있으면 Claude가 Read 도구로 TRANSCRIPT_FILE을 직접 읽는다 (bash grep 금지 — D-05).
  3. 기본 스캔 범위: 최근 20-30 메시지 (D-07). 사용자가 "deep" 또는 `analyze deep` 토큰을 명시하면 전체 transcript 또는 최근 100 메시지로 확장.
  4. D-08 신호를 탐색하여 4 카테고리 분류:
     - `frustration`: "왜", "안 돼", "다시", "틀렸", "I didn't ask", "That's wrong" 등 사용자 불만 표현
     - `correction`: 사용자가 assistant의 이전 행동을 되돌리거나 재지시하는 패턴
     - `repeated`: 같은 종류의 실수 또는 지시가 2회 이상 반복
     - `validated-success`: 사용자가 명시적으로 수용·확인한 non-obvious assistant 선택
  5. 결과를 D-03 스키마 표로 출력:
     `| category | tool/event | pattern | context | severity |`
     severity: high(즉각 수정 필요) / medium(주의) / low(참고용)
  6. high/medium severity 항목 기반 Draft Hookify Rules 섹션 생성. 각 rule: `warn-{slug}` 또는 `block-{slug}` — Event: {tool}, Pattern: `{regex}`, Severity: {level} 형식.
  7. Action Items 확정 후 append.
  8. D-02 auto-suggest: `analyze` lens를 명시 선택한 경우, 이 sub-block 내부에서 rule draft를 포함하므로 Step 6의 별도 auto-suggest와 중복되지 않도록 `ANALYZE_LENS_RAN=true` 플래그를 설정.

```bash
ANALYZE_LENS_RAN=false
```

**Step 6 — Append to lessons file (per lens iteration).**

Write the assembled lens section (header `## Lens: {name}{run-suffix}` + `_Captured: ${NOW_ISO}_` italic line + lens-specific subheadings + Action Items table) to `.planning/lessons/${PHASE_PAD}-${TODAY}.md` using a single `>>` redirect block (D-21). Create the directory if missing. Emit `lessons file: {path} +N lines` to stderr for verification.

```bash
# UTC 기준 ISO 날짜 (D-17)
TODAY=$(date -u +%Y-%m-%d)
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LESSONS_DIR=".planning/lessons"
LESSONS_FILE="${LESSONS_DIR}/${PHASE_PAD}-${TODAY}.md"

mkdir -p "$LESSONS_DIR"

# Lens English name 결정 (D-13 라벨과 일치)
case "$LENS_CODE" in
  ssc)     LENS_NAME="Start/Stop/Continue" ;;
  4ls)     LENS_NAME="4Ls" ;;
  dspm)    LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
  sail)    LENS_NAME="Sailboat" ;;
  5why)    LENS_NAME="Five Whys" ;;
  analyze) LENS_NAME="Conversation Analyzer" ;;
esac

# D-20: 같은 lens 중복 실행 disambiguation
# 파일이 있으면 같은 lens 헤더 개수를 세서 (run N) 접미사 결정
RUN_SUFFIX=""
if [ -f "$LESSONS_FILE" ]; then
  COUNT=$(grep -cE "^## Lens: ${LENS_NAME}( \(run [0-9]+\))?\$" "$LESSONS_FILE" 2>/dev/null)
  COUNT=${COUNT:-0}
  if [ "$COUNT" -gt 0 ]; then
    RUN_SUFFIX=" (run $((COUNT + 1)))"
  fi
fi

LENS_HEADER="## Lens: ${LENS_NAME}${RUN_SUFFIX}"

# D-21: append 전 라인 카운트
if [ -f "$LESSONS_FILE" ]; then
  BEFORE=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
else
  BEFORE=0
fi

# D-21: 새 파일이면 최상위 헤더 + 빈 줄 1개 먼저 작성
if [ ! -f "$LESSONS_FILE" ]; then
  {
    printf '# Lessons: Phase %s (%s)\n\n' "$PHASE_RAW" "$TODAY"
  } > "$LESSONS_FILE"
fi

# D-19/D-21: lens 섹션 전체를 한 번에 >> append (partial-write 회피)
#
# IMPORTANT — Claude execution contract:
# Before running this block, Claude MUST replace the BODY_PRINTF placeholder
# below with explicit `printf` lines that emit:
#   1. Each lens-specific fixed subheading (`### Start`/`### Liked`/etc.) per
#      `LENS_CODE` (Step 5 sub-blocks list the exact subheadings — 3 for ssc,
#      4 for 4ls, 4 for dspm, 4 for sail, 8 for 5why, 2+ for analyze).
#   2. The user-confirmed bullet items under each subheading as `- {item}`
#      lines (user input language, D-16).
# AND replace the ACTION_ITEMS_PRINTF placeholder with explicit `printf` lines
# emitting the confirmed 2–4 action item rows in the exact 3-column format.
#
# Do NOT leave the body or action item rows empty — that violates RETRO-04
# (consistent output structure) and breaks Phase 12 LESSONS-02 parsing.
{
  printf '%s\n' "$LENS_HEADER"
  printf '_Captured: %s_\n\n' "$NOW_ISO"
  # BODY_PRINTF — Claude inserts subheading + bullet `printf` lines here.
  # Example for ssc (replace at execution time with confirmed content):
  #   printf '### Start\n'
  #   printf '%s\n' "- ${ITEM_START_1}"
  #   printf '### Stop\n'
  #   printf '%s\n' "- ${ITEM_STOP_1}"
  #   printf '### Continue\n'
  #   printf '%s\n' "- ${ITEM_CONTINUE_1}"
  printf '\n### Action Items\n'
  printf '| priority | item | next step |\n'
  printf '|----------|------|-----------|\n'
  # ACTION_ITEMS_PRINTF — Claude inserts row `printf` lines here, e.g.:
  #   printf '| P1 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"
  printf '\n'
} >> "$LESSONS_FILE"

AFTER=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
DELTA=$((AFTER - BEFORE))
echo "lessons file: ${LESSONS_FILE} +${DELTA} lines" >&2
```

After the multi-lens loop completes, auto-suggest hookify rule drafts once:

```bash
# D-02: 모든 lens 완료 후 hookify rule draft auto-suggest (1회만)
# analyze lens가 이미 rule draft를 생성했으면 별도 출력 없이 reminder만.
if [ "${ANALYZE_LENS_RAN:-false}" = "true" ]; then
  echo "Hookify rule drafts were included in the Conversation Analyzer output above." >&2
else
  # Claude: high/medium severity 분석 결과 기반 또는 Action Items 기반 rule draft 제안
  echo "[Auto-suggest] Review the Action Items above and consider creating hookify rules for repeated patterns." >&2
fi
```

</process>

<lens_templates>

The following six markdown skeletons are the canonical output shape per lens. Claude uses them as reference during Step 5 facilitation. The structural markers (`## Lens:`, `### ...`, table column headers) are deterministic English (D-16 — Phase 12 parser keys). The bracketed `[user-language item]` placeholders are filled in the user's input language (D-16 auto-detect; the user's confirmed/edited body content).

**Start/Stop/Continue (ssc):**

```markdown
## Lens: Start/Stop/Continue
_Captured: {ISO-8601 UTC}_

### Start
- [user-language item]

### Stop
- [user-language item]

### Continue
- [user-language item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

**4Ls (4ls):**

```markdown
## Lens: 4Ls
_Captured: {ISO-8601 UTC}_

### Liked
- [user-language item]

### Learned
- [user-language item]

### Lacked
- [user-language item]

### Longed For
- [user-language item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

**Decisions/Surprises/Patterns/Mistakes (dspm):**

```markdown
## Lens: Decisions/Surprises/Patterns/Mistakes
_Captured: {ISO-8601 UTC}_

### Decisions
- [user-language item]

### Surprises
- [user-language item]

### Patterns
- [user-language item]

### Mistakes
- [user-language item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

**Sailboat (sail):**

```markdown
## Lens: Sailboat
_Captured: {ISO-8601 UTC}_

### Wind
- [user-language item — what propelled progress]

### Anchor
- [user-language item — what slowed down]

### Sun
- [user-language item — bright spot / energy source]

### Rock
- [user-language item — risk or obstacle encountered or ahead]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

**Five Whys (5why):**

```markdown
## Lens: Five Whys
_Captured: {ISO-8601 UTC}_

### Problem Statement
- [user-provided problem]

### Why 1
- [user answer]

### Why 2
- [user answer]

### Why 3
- [user answer]

### Why 4
- [user answer]

### Why 5
- [user answer]

### Root Cause
- [derived root cause statement]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

**Conversation Analyzer (analyze):**

```markdown
## Lens: Conversation Analyzer
_Captured: {ISO-8601 UTC}_

### Analysis Findings

| category | tool/event | pattern | context | severity |
|----------|------------|---------|---------|----------|
| frustration | Bash | `rm -rf` | User said "왜 삭제해" after cleanup | high |
| correction | Edit | `.env` write | User reverted env file change | high |
| repeated | Bash | `cat` instead of Read | Same correction 3 times | medium |
| validated-success | Edit | Surgical Edit over Write | User accepted minimal-change approach | low |

### Draft Hookify Rules

- `warn-dangerous-rm` — Event: bash, Pattern: `rm\s+-rf`, Severity: high
- `block-env-write` — Event: file, Pattern: `\.env$`, Severity: high

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
```

</lens_templates>

<success_criteria>
1. Calling `Skill(skill="sg-retro", args="...")` resolves the phase argument via zero-pad to exactly one `.planning/phases/{NN}-*/` directory. If no directory matches, the Skill emits an error to stderr and exits 1 (D-04).
2. When the second argument is `ssc`/`4ls`/`dspm`/`sail`/`5why`/`analyze` (case-insensitive), AskUserQuestion is skipped. Otherwise the Skill invokes AskUserQuestion with header `Lens`, multiSelect:true, and six options carrying the `(ssc)`/`(4ls)`/`(dspm)`/`(sail)`/`(5why)`/`(analyze)` codes.
3. Each lens output follows exactly: `## Lens: {name}` header + `_Captured: {ISO}_` italic line + lens-specific fixed subheadings + a `### Action Items` 3-column table (`priority | item | next step`) (D-09, D-12). No owner column.
4. The lessons file is written to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. If the file does not exist, the top-level header and the first lens section are written; if it exists, only the new lens section is appended at the end (D-17, D-18, D-19, D-21). A same-day same-lens repeat uses a `(run 2)`/`(run 3)`/... disambiguating suffix (D-20).
5. The DSPM lens derives its content strictly from phase artifacts + `git log`/`git diff`. Session-transcript scanning is never performed for ssc/4ls/dspm/sail lenses (D-11).
6. When `multiSelect: true` AskUserQuestion returns multiple lens labels, LENS_CODES_ARRAY contains all selected codes and each lens is executed sequentially with its result appended to the same lessons file (D-18, D-20, RETRO-05).
7. args="10 sail" / "10 5why" / "10 analyze" trigger direct execution of the respective lens without AskUserQuestion (D-19 extension to sail/5why/analyze).
8. args="10 4ls dspm" builds LENS_CODES_ARRAY=["4ls", "dspm"] and appends both lens sections to the same file in order (D-21).
9. When TRANSCRIPT_FILE is empty, the analyze lens emits "No transcript found" to stderr and exits the lens gracefully without appending to lessons (D-06).
10. The Conversation Analyzer reads the JSONL file using Claude's Read tool (not bash grep) and outputs a 5-column findings table (category/tool-event/pattern/context/severity) + Draft Hookify Rules section (ANALYZER-01, ANALYZER-02).
11. hookify rule draft auto-suggest occurs exactly once per sg-retro invocation — after all lenses complete (D-02). If analyze lens ran, its Draft Hookify Rules section serves as the auto-suggest output; no duplicate suggestion is made.
</success_criteria>
