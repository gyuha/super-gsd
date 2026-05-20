---
name: sg-retro
description: Run a structured retrospective on a GSD phase with one of three lenses (SSC, 4Ls, DSPM) and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md.
---

<objective>
Run a structured retrospective on a GSD phase. Auto-collect phase artifacts (`{NN}-CONTEXT.md`, all `{NN}-*-PLAN.md`, all `{NN}-*-SUMMARY.md`) and `git log`/`git diff` since the phase directory's last commit. Let the user pick one of three lenses — Start/Stop/Continue, 4Ls, Decisions/Surprises/Patterns/Mistakes — via AskUserQuestion (or directly via the second argument). Facilitate an artifact-grounded draft-then-confirm flow, then append the result to `.planning/lessons/{NN}-{YYYY-MM-DD}.md` (append-only; same-lens repeats use a `(run N)` suffix).

Forward-compat note: Sailboat and Five Whys lenses, multi-lens selection, and session-transcript analyzer are Phase 10 responsibilities and intentionally out of scope here.
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
```

**Step 2 — Lens code mapping or AskUserQuestion fallback.**

Map `LENS_RAW` to one of `ssc`/`4ls`/`dspm` (case-insensitive). If empty or unmapped, invoke AskUserQuestion with header `Lens` and the three options below. No default option is preselected (D-15).

```bash
LENS_CODE=""
if [ -n "$LENS_RAW" ]; then
  LENS_LC=$(printf '%s' "$LENS_RAW" | tr '[:upper:]' '[:lower:]')
  case "$LENS_LC" in
    ssc)  LENS_CODE="ssc"  ;;
    4ls)  LENS_CODE="4ls"  ;;
    dspm) LENS_CODE="dspm" ;;
    *)    LENS_CODE=""     ;;  # 매핑 실패 → AskUserQuestion fallback
  esac
fi
```

If `LENS_CODE` is empty, call AskUserQuestion as follows (header `Lens`, 3 options, no default — D-13/D-14/D-15):

```
AskUserQuestion(
  questions: [{
    question: "Which retrospective lens do you want to run?",
    header: "Lens",
    multiSelect: false,
    options: [
      { label: "Start/Stop/Continue (ssc)", description: "Behavior change — what to begin, stop, and continue based on phase artifacts." },
      { label: "4Ls (4ls)", description: "Liked / Learned / Lacked / Longed For — emotion + knowledge balance." },
      { label: "Decisions/Surprises/Patterns/Mistakes (dspm)", description: "Technical retrospective — locked decisions, pivots, recurring techniques, and verification failures." }
    ]
  }]
)
```

Extract the lens code from the response label:
```bash
# 예: 사용자가 "Start/Stop/Continue (ssc)" 응답 → LENS_CODE="ssc"
LENS_CODE=$(printf '%s' "$ASKUSERQUESTION_RESPONSE" | grep -oE '\((ssc|4ls|dspm)\)' | head -1 | tr -d '()')
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

**Step 5 — Lens facilitation (artifact-grounded draft-then-confirm).**

Common flow for all three lenses (D-09 hybrid + D-10 artifact-grounded draft-then-confirm + D-11 transcript ban + D-16 body language auto-detect):

1. Read all three artifact types (CONTEXT, PLAN(s), SUMMARY(s)) and capture key signals from `${GIT_LOG}` and `${GIT_DIFF}` (range: `${RANGE}`). **Do NOT scan session transcript — that's Phase 10 ANALYZER scope (D-11).**
2. For each lens-specific subheading, propose 2–5 draft bullet items grounded in the artifacts above. Each bullet must cite the source (file path or commit hash). Present the full draft as a single markdown block.
3. Ask the user to confirm/edit/add/delete each subheading's items. Use the user's input language (D-16 — auto-detect; this is the body content language, not the markdown structure markers). Single round-trip preferred — present all subheadings at once, not one-by-one.
4. After items are finalized, propose 2–4 Action Items rows: priority (`P1`/`P2`/`P3`) | one-sentence item | concrete next step or `deferred to Phase N` label. **No owner column (D-12).** User confirms/edits the table.
5. Assemble the final lens section (header + `_Captured: {NOW_ISO}_` + subheadings + Action Items) and append to `${LESSONS_FILE}` using the bash block in Step 6 — **replace the `BODY_PRINTF` and `ACTION_ITEMS_PRINTF` placeholder comments with explicit `printf` lines** that emit each fixed subheading (`### Start` / `### Liked` / `### Decisions` / etc.) plus the user-confirmed bullet items and action item rows. Empty body or empty action items violates RETRO-04. Emit `Lessons saved to ${LESSONS_FILE}.` to stdout. No other output.

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
- **Explicit guard:** DSPM in Phase 9 derives all four categories strictly from collected phase artifacts + `git log`/`git diff`. **Do NOT read or analyze session transcript, even if it appears relevant.** Phase 10 ANALYZER will add transcript-based merging additively (D-11).

**Step 6 — Append to lessons file.**

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
  ssc)  LENS_NAME="Start/Stop/Continue" ;;
  4ls)  LENS_NAME="4Ls" ;;
  dspm) LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
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
#      4 for 4ls, 4 for dspm).
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

</process>

<lens_templates>

The following three markdown skeletons are the canonical output shape per lens. Claude uses them as reference during Step 5 facilitation. The structural markers (`## Lens:`, `### ...`, table column headers) are deterministic English (D-16 — Phase 12 parser keys). The bracketed `[user-language item]` placeholders are filled in the user's input language (D-16 auto-detect; the user's confirmed/edited body content).

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

</lens_templates>

<success_criteria>
1. Calling `Skill(skill="sg-retro", args="...")` resolves the phase argument via zero-pad to exactly one `.planning/phases/{NN}-*/` directory. If no directory matches, the Skill emits an error to stderr and exits 1 (D-04).
2. When the second argument is `ssc`/`4ls`/`dspm` (case-insensitive), AskUserQuestion is skipped. Otherwise the Skill invokes AskUserQuestion with header `Lens` and three options carrying the `(ssc)`/`(4ls)`/`(dspm)` codes (D-03, D-13).
3. Each lens output follows exactly: `## Lens: {name}` header + `_Captured: {ISO}_` italic line + lens-specific fixed subheadings + a `### Action Items` 3-column table (`priority | item | next step`) (D-09, D-12). No owner column.
4. The lessons file is written to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. If the file does not exist, the top-level header and the first lens section are written; if it exists, only the new lens section is appended at the end (D-17, D-18, D-19, D-21). A same-day same-lens repeat uses a `(run 2)`/`(run 3)`/... disambiguating suffix (D-20).
5. The DSPM lens derives its content strictly from phase artifacts + `git log`/`git diff`. Session-transcript scanning is never performed in Phase 9 (D-11 — that's Phase 10 ANALYZER scope).
</success_criteria>
