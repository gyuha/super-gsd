# Phase 42: Smart Default Lens + Lens Consolidation - Pattern Map

**Mapped:** 2026-05-30
**Files analyzed:** 2 (pairwise sg-retro/SKILL.md)
**Analogs found:** 2 / 2 (in-file self-analogs — same file, surgical edits)

> 핵심 메모: 본 phase는 두 SKILL.md를 **외부 analog로부터 복사**하는 것이 아니라, **자기 자신**의 기존 case-statement·sub-block·success_criteria 구조를 부분 삭제/축소하는 surgical edit이다. 따라서 "analog"는 동일 파일 내 보존되는 패턴(`ssc`/`dspm`/`analyze` 케이스, ssc/dspm/analyze sub-block, success_criteria #3/#5/#10/#11 등)이다. Planner는 패턴을 **새로 작성하지 말고** 기존 구조를 그대로 보존한 뒤 dropped 토큰(`4ls`/`sail`/`5why`)만 제거해야 한다.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `skills/sg-retro/SKILL.md` | skill-definition (Markdown + bash) | request-response (CLI args → lens routing → file append) | 자기 자신 (Step 2 ssc/dspm/analyze 케이스, Step 5 ssc/dspm/analyze sub-block) | exact (in-file) |
| `.agents/skills/sg-retro/SKILL.md` | skill-definition (Markdown + bash, AskUserQuestion-free variant) | request-response | 자기 자신 + `skills/sg-retro/SKILL.md` (pairwise mirror) | exact (in-file + cross-file) |

**Note on pairwise files:** 두 파일은 의미적으로 동등하지만 구조 차이가 있다 (요약):

| 측면 | `skills/sg-retro/SKILL.md` | `.agents/skills/sg-retro/SKILL.md` |
|------|-----------------------------|--------------------------------------|
| 라인 수 | 420 | 485 |
| Step 2 fallback UI | AskUserQuestion (6 options, multiSelect) | numbered-list text + `map_num_to_code()` helper |
| `<constraints>` 블록 | 없음 | 있음 (Codex/Gemini/Antigravity 제약 명시) |
| `<lens_templates>` 블록 | 없음 (sub-block 본문에 인라인) | 있음 (6개 lens 마크다운 템플릿 정리) |
| frontmatter | description 1줄 | description + argument-hint 2줄 |
| success_criteria 항목 수 | 11개 | 7개 |
| STATE.md parsing 주석 | `# --- BEGIN STATE.md Phase parsing block (macOS-compatible grep + sed + awk pipeline) ---` | `# --- BEGIN STATE.md Phase parsing block ---` |

→ Phase 42는 두 파일 **각각**에 동일한 의미적 변경(smart default 분기, 케이스 축소, sub-block 삭제, success_criteria 갱신)을 적용해야 한다. 단순 `cp` 미러링 금지.

---

## Pattern Assignments

### 1. `skills/sg-retro/SKILL.md` (skill-definition, request-response)

**Analog:** 자기 자신 (in-file pattern preservation + targeted removal)

#### A. Imports / frontmatter pattern (lines 1–11)

보존 대상 (Phase 42에서 `description`의 "six lenses" → "three lenses" 문구만 수정):

```markdown
---
name: sg-retro
description: Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of six lenses (ssc, 4ls, dspm, sail, 5why, analyze) and appends results to .planning/lessons/.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>
```

**변경 지시 (Planner용):**
- 3줄 `description` 본문에서 `six lenses (ssc, 4ls, dspm, sail, 5why, analyze)` → `three lenses (ssc, dspm, analyze)` 로 교체.
- `<language>` 블록은 손대지 않는다.

#### B. Step 1 STATE.md parsing block (lines 27–39) — **불변 (보존)**

CLAUDE.md "macOS 셸 이식성" 컨벤션 + 파일 내부 주석(line 25, 33)이 명시적으로 보존을 강제한다. Phase 42에서 **건드리지 말 것.**

```bash
if [ -z "$PHASE_RAW" ]; then
  # --- BEGIN STATE.md Phase parsing block (macOS-compatible grep + sed + awk pipeline) ---
  PHASE_RAW=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
              | sed -E 's/^Phase:[[:space:]]*//' \
              | sed -E 's/[[:space:]]+$//' \
              | awk '{print $1}')
  # --- END STATE.md Phase parsing block ---
fi
```

#### C. Step 2 — Lens 케이스 매핑 (현재 lines 80–94)

**현재 6-케이스 case-statement (이 패턴 구조를 유지, 3-케이스로 축소 + dropped 에러 분기 추가):**

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
    *)       LENS_CODE=""        ;;  # no match → AskUserQuestion fallback
  esac
fi
```

**Phase 42 변경 지시 (D-05, D-06, D-09):**
- 보존: `ssc)` / `dspm)` / `analyze)` 세 케이스 정확히 동일한 들여쓰기·주석 스타일 유지.
- 삭제: `4ls)` / `sail)` / `5why)` 세 줄 완전 제거 (주석으로 남기지 않음, D-05).
- 변경: `*)` fallback의 동작 — 기존 `LENS_CODE=""` (AskUserQuestion 진입)에서 **dropped/unknown 처리 분기**로 교체. D-06 에러 메시지를 stderr에 emit하고 `exit 1`. dropped 토큰(`4ls`/`sail`/`5why`) 처리는 Claude's Discretion으로 별도 case 분리 권장 (CONTEXT D-09 "별도 case로 분리해서 에러 메시지를 일관되게 emit").

**참고: D-06 에러 메시지 머신 토큰은 영문, 산문은 사용자 언어 (CLAUDE.md 컨벤션):**
```
Lens '{code}' is no longer supported (removed in v2.9).
Available lenses: ssc, dspm, analyze.
Run without lens argument to use smart default (dspm+ssc).
```

#### D. Step 2 — AskUserQuestion fallback 블록 (현재 lines 96–127)

**현재 보존되는 패턴 (이 블록은 D-08에 의해 통째로 삭제):**

```
AskUserQuestion(
  questions: [{
    question: "Which retrospective lens(es) do you want to run?",
    header: "Lens",
    multiSelect: true,
    options: [
      { label: "Start/Stop/Continue (ssc)", description: "Behavior change — what to begin, stop, and continue based on phase artifacts." },
      { label: "4Ls (4ls)", description: "..." },
      { label: "Decisions/Surprises/Patterns/Mistakes (dspm)", description: "..." },
      { label: "Sailboat (sail)", description: "..." },
      { label: "Five Whys (5why)", description: "..." },
      { label: "Conversation Analyzer (analyze)", description: "..." }
    ]
  }]
)
```

그리고 그 직후의 multiSelect parsing block:

```bash
LENS_CODES_ARRAY=$(printf '%s' "$ASKUSERQUESTION_RESPONSE" \
  | grep -oE '\((ssc|4ls|dspm|sail|5why|analyze)\)' \
  | tr -d '()')
if [ -z "$LENS_CODES_ARRAY" ]; then
  echo "No lens selected or response not recognized. Exiting." >&2
  exit 1
fi
```

**Phase 42 변경 지시 (D-08):** 위 두 블록(AskUserQuestion call + parsing) **전체 삭제**. 도달 가능한 진입 경로가 사라짐 (인자 없음 → smart default; 잘못된 인자 → C단계의 dropped 에러).

#### E. Step 2 — Smart default 신규 진입 분기 (신규 — 패턴 자체 없음)

**Analog:** 동일 파일 line 129–148의 D-19 단일/멀티 lens 인자 경로의 if-elif 구조와 동일한 스타일을 따른다:

```bash
# D-19: argument path — build array if LENS_CODE set, append EXTRA_LENS_CODES if present
VALID_EXTRAS=""
if [ -n "$EXTRA_LENS_CODES" ]; then
  for EC in $EXTRA_LENS_CODES; do
    EC_LC=$(printf '%s' "$EC" | tr '[:upper:]' '[:lower:]')
    case "$EC_LC" in
      ssc|4ls|dspm|sail|5why|analyze) VALID_EXTRAS="${VALID_EXTRAS} ${EC_LC}" ;;
    esac
  done
fi
if [ -n "$LENS_CODE" ]; then
  LENS_CODES_ARRAY="${LENS_CODE}${VALID_EXTRAS}"
elif [ -n "$VALID_EXTRAS" ]; then
  LENS_CODES_ARRAY="$VALID_EXTRAS"
fi
```

**Phase 42 변경 지시 (D-02):**
- 위 D-19 블록의 inner `case` `ssc|4ls|dspm|sail|5why|analyze)` 패턴을 `ssc|dspm|analyze)` 로 축소 (3개만 valid extra).
- 위 블록 **이후**(또는 적절한 위치)에 smart default 분기 신규 추가:

```bash
# Phase 42 (D-02): smart default — no args → dspm+ssc, dspm first (technical core)
if [ -z "$LENS_CODES_ARRAY" ] && [ -z "$LENS_RAW" ] && [ -z "$EXTRA_LENS_CODES" ]; then
  LENS_CODES_ARRAY="dspm ssc"
  # Claude's Discretion (CONTEXT line 77): planner may emit a stderr hint, e.g.:
  # echo "[sg-retro] No lens specified — using smart default: dspm + ssc" >&2
fi
```

- 진입 조건: `LENS_RAW` empty AND `EXTRA_LENS_CODES` empty (D-02).
- 실행 순서 `dspm ssc` — dspm을 앞에 배치 (D-02 + specifics line 147: "기술 회고 → 행동 권고" 흐름).

#### F. Step 5 — Sub-block 정의 (현재 lines 234–283)

**보존하는 sub-block (정확한 본문·들여쓰기 유지):**

`skills/sg-retro/SKILL.md` 234–245 (ssc), 242–246 (dspm 그리고 explicit guard 포함), 263–283 (analyze + `ANALYZE_LENS_RAN=true` flag).

특히 dspm의 explicit guard는 그대로 보존:
```markdown
- **Explicit guard:** DSPM derives all four categories strictly from collected phase artifacts + `git log`/`git diff`. **Do NOT read or analyze session transcript, even if it appears relevant.** Phase 10 ANALYZER will add transcript-based merging additively (D-11).
```

그리고 analyze 끝의 flag-setter는 그대로:
```bash
ANALYZE_LENS_RAN=true
```

**삭제하는 sub-block (D-05, 완전 제거 — 주석/deprecated 금지):**

- **`4ls`** sub-block (현재 lines 238–240) — 4개 subheading + facilitation 본문 전체.
- **`sail`** sub-block (현재 lines 247–249) — Wind/Anchor/Sun/Rock + facilitation 본문 전체.
- **`5why`** sub-block (현재 lines 251–261) — Problem Statement + Why 1~5 + Root Cause + 7-step AskUserQuestion 절차 전체.

#### G. Step 5 — LENS_NAME 케이스 매핑 (현재 lines 299–306)

```bash
case "$LENS_CODE" in
  ssc)     LENS_NAME="Start/Stop/Continue" ;;
  4ls)     LENS_NAME="4Ls" ;;
  dspm)    LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
  sail)    LENS_NAME="Sailboat" ;;
  5why)    LENS_NAME="Five Whys" ;;
  analyze) LENS_NAME="Conversation Analyzer" ;;
esac
```

**Phase 42 변경 지시 (D-05):** `4ls)` / `sail)` / `5why)` 세 줄 제거. 결과는 3개 케이스만 남는다.

#### H. `<success_criteria>` 블록 (현재 lines 408–420)

**현재 11개 항목 중 dropped lens 참조가 있는 항목 (CONTEXT line 131):**

| # | 현재 본문 (요지) | Phase 42 처리 |
|---|------------------|---------------|
| #2 | "second argument is `ssc`/`4ls`/`dspm`/`sail`/`5why`/`analyze` (case-insensitive)... six options" | 본문 축소: 3개 lens만 명시 + AskUserQuestion 언급 삭제. smart default 동작 명시 추가. |
| #5 | "DSPM lens derives strictly from phase artifacts... Session-transcript scanning is never performed for ssc/4ls/dspm/sail lenses (D-11)" | "ssc/4ls/dspm/sail" → "ssc/dspm" 으로 축소. |
| #7 | "args=\"10 sail\" / \"10 5why\" / \"10 analyze\" trigger direct execution" | dropped 케이스(sail/5why) 언급 삭제 → `analyze`만 남거나, **reject 동작 검증으로 재작성**: "args=\"10 sail\" / \"10 5why\" / \"10 4ls\" 는 stderr 에러 + exit 1로 거부된다 (D-06)". |
| #8 | "args=\"10 4ls dspm\" builds LENS_CODES_ARRAY=[\"4ls\", \"dspm\"]..." | dropped 토큰 사용 금지 → "args=\"10 ssc dspm\" builds LENS_CODES_ARRAY=[\"ssc\", \"dspm\"]..."로 토큰만 교체 (멀티 경로 검증 의도 보존). 또는 D-07 검증으로 재작성: "args=\"10 dspm sail\" 은 첫 dropped 발견 즉시 거부, dspm 실행도 안 됨." |

**추가 success_criteria 신설 (D-02, D-06, D-07 검증 요구):**
- 신규 항목: smart default 진입 — 인자 없이 `Skill(skill="sg-retro", args="42")` 호출 시 AskUserQuestion 없이 `LENS_CODES_ARRAY="dspm ssc"`로 즉시 진행.
- 신규 항목: dropped lens reject — `4ls`/`sail`/`5why` 인자 시 stderr 에러 메시지 + `exit 1`, lessons 파일 미생성.

**손대지 말 것 (보존):** #1 (phase 인자 파싱), #3 (lens 출력 형식), #4 (lessons 파일 경로 + run suffix), #6 (LENS_CODES_ARRAY 순차 실행), #9 (analyze TRANSCRIPT 없을 때), #10 (analyze 5-column table), #11 (sg-rule auto-suggest once).

---

### 2. `.agents/skills/sg-retro/SKILL.md` (skill-definition, request-response)

**Analog:** `skills/sg-retro/SKILL.md` (pairwise mirror, 동일한 의미적 변경) + 자기 자신의 numbered-list fallback 구조 (보존되지 않고 삭제 대상).

#### A. frontmatter (lines 1–5)

```markdown
---
name: sg-retro
description: Run a structured retrospective on a GSD phase with one of six lenses — select multiple lenses in one call — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md. AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.
argument-hint: "[phase] [lens] - e.g. '14 ssc' or '14 ssc dspm'. lens: ssc|4ls|dspm|sail|5why|analyze"
---
```

**Phase 42 변경 지시:**
- `description`의 "six lenses" → "three lenses"; lens 인자 예시는 `ssc|dspm|analyze`로 축소.
- `argument-hint`의 `lens: ssc|4ls|dspm|sail|5why|analyze` → `lens: ssc|dspm|analyze`.

#### B. `<objective>` (line 15) + `<constraints>` (lines 18–24)

`<objective>` 본문의 "six lenses" / dropped lens 나열 부분만 축소. `<constraints>` 블록은 손대지 않음.

#### C. Step 1 STATE.md parsing (lines 33–48)

**주의 — 주석 텍스트가 미러 파일과 다름:**
```bash
  # --- BEGIN STATE.md Phase parsing block ---
```
(여기는 "(macOS-compatible grep + sed + awk pipeline)" 추가 텍스트 없음)

CLAUDE.md "macOS 셸 이식성" + CONTEXT `<code_context>` 128줄에 의해 보존된다. **Phase 42에서 손대지 않는다.** (스킬 본 phase가 주석 텍스트 통일을 요구하지 않음 — surgical only.)

#### D. Step 2 — 케이스 매핑 (lines 86–98)

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
    *)       LENS_CODE=""        ;;
  esac
fi
```

**Phase 42 변경 지시:** `skills/sg-retro/SKILL.md` 1.C와 동일 — 3개 케이스만 유지, `4ls`/`sail`/`5why` 제거, `*)` 분기를 dropped 에러로 재작성 (메시지·exit 1 동일).

#### E. Step 2 — Numbered-list fallback (lines 101–131)

**현재 패턴 (이 블록은 전체 삭제):**

```
Select a lens:
1) ssc     — Start/Stop/Continue
2) 4ls     — 4Ls (Like/Learned/Lacked/Longed for)
3) dspm    — Decisions/Surprises/Patterns/Mistakes
4) sail    — Sailboat
5) 5why    — Five Whys
6) analyze — Conversation Analyzer
```

그리고 `map_num_to_code()` 헬퍼:
```bash
map_num_to_code() {
  case "$1" in
    1) echo "ssc"     ;;
    2) echo "4ls"     ;;
    3) echo "dspm"    ;;
    4) echo "sail"    ;;
    5) echo "5why"    ;;
    6) echo "analyze" ;;
    ssc|4ls|dspm|sail|5why|analyze) echo "$1" ;;
    *) echo "" ;;
  esac
}
```

**Phase 42 변경 지시 (D-08):** Numbered-list 출력 블록 + `map_num_to_code()` 헬퍼 + 그 사이의 안내 산문 **전부 삭제**. `skills/` 미러의 AskUserQuestion 삭제와 동등한 surgical 제거.

#### F. Step 2 — 단일 lens 인자 경로 (lines 136–149)

```bash
VALID_EXTRAS=""
if [ -n "$EXTRA_LENS_CODES" ]; then
  for EC in $EXTRA_LENS_CODES; do
    EC_LC=$(printf '%s' "$EC" | tr '[:upper:]' '[:lower:]')
    case "$EC_LC" in
      ssc|4ls|dspm|sail|5why|analyze) VALID_EXTRAS="${VALID_EXTRAS} ${EC_LC}" ;;
    esac
  done
fi
if [ -n "$LENS_CODE" ]; then
  LENS_CODES_ARRAY="${LENS_CODE}${VALID_EXTRAS}"
elif [ -n "$VALID_EXTRAS" ]; then
  LENS_CODES_ARRAY="$VALID_EXTRAS"
fi
```

**Phase 42 변경 지시:** Inner case의 `ssc|4ls|dspm|sail|5why|analyze)` → `ssc|dspm|analyze)`. 그 직후 smart default 신규 분기 추가 (1.E와 동일 본문, D-02).

#### G. Step 5 — Sub-block (lines 223–259)

**보존:** ssc (lines 223–225), dspm + explicit guard (lines 231–233), analyze + `ANALYZE_LENS_RAN=true` (lines 250–259).

**삭제 (D-05):** `4ls` sub-block (lines 227–229), `sail` sub-block (lines 235–237), `5why` sub-block (lines 239–248) — 본문·facilitation 절차 전체.

#### H. Step 6 — LENS_NAME 케이스 매핑 (lines 271–278)

```bash
case "$LENS_CODE" in
  ssc)     LENS_NAME="Start/Stop/Continue" ;;
  4ls)     LENS_NAME="4Ls" ;;
  dspm)    LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
  sail)    LENS_NAME="Sailboat" ;;
  5why)    LENS_NAME="Five Whys" ;;
  analyze) LENS_NAME="Conversation Analyzer" ;;
esac
```

**Phase 42 변경 지시:** `4ls)` / `sail)` / `5why)` 세 줄 제거. 3개 케이스만 남는다.

#### I. `<lens_templates>` 블록 (lines 331–475) — **`.agents` 버전만 존재**

`skills/sg-retro/SKILL.md`에는 없는 추가 섹션. 6개 lens 각각의 마크다운 템플릿 (ssc/4ls/dspm/sail/5why/analyze)이 정의되어 있다.

**Phase 42 변경 지시 (D-05):**
- 보존: `Start/Stop/Continue (ssc)`, `Decisions/Surprises/Patterns/Mistakes (dspm)`, `Conversation Analyzer (analyze)` 템플릿 블록.
- 삭제: `4Ls (4ls)` (lines 353–374), `Sailboat (sail)` (lines 399–420), `Five Whys (5why)` (lines 422–452) 템플릿 블록 전체 — 빈 자리는 한 줄 공백 유지하여 인접 보존 블록과 시각적으로 자연스럽게 연결.

#### J. `<success_criteria>` (lines 477–485)

`.agents` 버전은 7개 항목으로 정리되어 있다. dropped lens 참조 항목:

| # | 현재 본문 (요지) | Phase 42 처리 |
|---|------------------|---------------|
| #2 | "second argument is `ssc`/`4ls`/`dspm`/`sail`/`5why`/`analyze`, skip the numbered list" | 본문 축소: 3개 lens만 + "numbered list" → "smart default (dspm+ssc)". |
| #3 | "If no argument or unrecognized input, output the numbered list..." | 본문 교체: "If no argument, apply smart default (dspm+ssc) without prompting. Unrecognized or removed lens codes (`4ls`/`sail`/`5why`/etc.) trigger an error message to stderr and exit 1 (D-06)." |
| #6 | "DSPM lens references only phase artifacts... No transcript scan." | 손대지 않음 (dropped lens 미참조). |

**손대지 말 것 (보존):** #1 (phase 인자 검증), #4 (lens 출력 형식), #5 (lessons 파일 경로), #7 (analyze TRANSCRIPT 없을 때).

**추가 success_criteria 신설 (대칭 — pairwise 미러 일관성 위해 `skills/` 본 success_criteria 신설과 동일):**
- smart default 진입 검증.
- dropped lens reject 검증.

---

## Shared Patterns

### Lens 코드 case-statement 스타일
**Source:** `skills/sg-retro/SKILL.md` lines 84–93, `.agents/skills/sg-retro/SKILL.md` lines 89–98, 각 파일 LENS_NAME 매핑 case.
**Apply to:** 두 SKILL.md의 모든 3개 case-statement (Step 2 매핑, Step 2 VALID_EXTRAS inner case, Step 5/6 LENS_NAME 매핑).

들여쓰기·정렬·`;;` 위치를 동일하게 유지:
```bash
case "$LENS_LC" in
  ssc)     LENS_CODE="ssc"     ;;
  dspm)    LENS_CODE="dspm"    ;;
  analyze) LENS_CODE="analyze" ;;
  *)       [dropped/unknown 처리] ;;
esac
```
→ `4ls`/`sail`/`5why` 행만 정확히 제거. 컬럼 정렬(공백 패딩)은 그대로 유지하되 가장 긴 토큰 길이는 `analyze`이므로 기존 정렬이 유효하다.

### Dropped lens 에러 메시지 패턴 (D-06, D-07)
**Source:** CONTEXT.md 44–50줄에 lock-in된 메시지 본문.
**Apply to:** 두 SKILL.md의 Step 2 `*)` (또는 별도 분리된) dropped case.

머신 토큰(`'4ls'`, `'sail'`, `'5why'`, `ssc`, `dspm`, `analyze`, `v2.9`, `dspm+ssc`)은 영문 그대로, 산문은 사용자 언어 자동 감지. 스크립트는 영문 fallback을 emit하고 Claude가 출력 시점에 언어 매칭 (CLAUDE.md "사용자 언어 메시지" + CONTEXT line 75).

D-07 멀티-인자 부분 dropped 시: 첫 dropped 토큰 발견 즉시 동일 에러로 거부, 후속 lens 실행 금지.

### macOS-compatible 셸 보존
**Source:** `skills/sg-retro/SKILL.md` lines 25, 33; `.agents/skills/sg-retro/SKILL.md` line 41; CLAUDE.md "macOS 셸 이식성"; CONTEXT.md `<code_context>` 128줄.
**Apply to:** 두 SKILL.md의 STATE.md Phase parsing block.

`grep -E` (ERE only, `-P` 금지), `sed -E`, `awk '{print $1}'` 3-단 파이프라인을 단일 토큰 정규식으로 단축하지 않는다. `# --- BEGIN STATE.md Phase parsing block ... ---` 주석 블록 자체가 보존 마커이므로 Phase 42 변경 영역 **밖**에 있다 — 절대 건드리지 않는다.

### Pairwise sync (D-10, CLAUDE.md "skills/ + .agents/ 쌍 커버")
**Source:** CLAUDE.md "skills/ + .agents/ 쌍 커버" (Phase 32 Medium-1) + CONTEXT.md D-10.
**Apply to:** 두 SKILL.md 모두.

동일 commit 내에 두 파일을 함께 staging. 한 파일만 수정한 PR은 Phase 32 컨벤션 위반으로 리뷰 차단된다. `diff` 비교 시 의미적 동등(파일 헤더·`<constraints>`·`<lens_templates>`·success_criteria 항목 수만 차이) — D-12 검증 항목 #6.

### `<process>` Step 번호 보존
**Source:** 두 SKILL.md의 `**Step N — ...**` 헤더 구조.
**Apply to:** Step 1~6 번호와 제목은 그대로 유지. Phase 42는 Step 신규 추가/삭제 없이 **각 Step 내부의 블록**만 surgical 수정 (특히 Step 2와 Step 5).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | 본 phase는 신규 파일 생성 없음. 두 modified 파일 모두 자기 자신을 analog로 사용 (in-file pattern preservation + surgical removal). |

**RESEARCH.md not present** — Phase 42는 research_enabled=false로 진행되었다. 모든 패턴 결정은 CONTEXT.md decisions와 두 SKILL.md의 기존 구조에서 도출된다.

---

## Metadata

**Analog search scope:**
- `/Users/gyuha/workspace/super-gsd/skills/sg-retro/SKILL.md` (전체, 420줄)
- `/Users/gyuha/workspace/super-gsd/.agents/skills/sg-retro/SKILL.md` (전체, 485줄)
- `/Users/gyuha/workspace/super-gsd/CLAUDE.md` (컨벤션 참조)
- `/Users/gyuha/workspace/super-gsd/.planning/phases/42-smart-default-lens/42-CONTEXT.md`

**Files scanned:** 2 SKILL.md (대상) + 2 reference (CONTEXT.md, CLAUDE.md)
**Pattern extraction date:** 2026-05-30
