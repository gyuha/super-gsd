---
name: sg-retro
description: Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of three lenses (ssc, dspm, analyze) and appends results to .planning/lessons/. Smart default (dspm+ssc) runs when no lens argument is provided; pass --pick for interactive lens selection.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Run a structured retrospective on a GSD phase. Auto-collect phase artifacts and git context. Let the user pick one or more of three lenses — Start/Stop/Continue (ssc), Decisions/Surprises/Patterns/Mistakes (dspm), Conversation Analyzer (analyze) — via direct arguments, the `--pick` flag (interactive multiSelect), or omit the lens argument to apply the smart default (dspm+ssc). Facilitate each lens (artifact-grounded for ssc/dspm; transcript-native for analyze), then append all results sequentially to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. After all lenses complete, auto-suggest sg-rule drafts once.
</objective>

<execution_context>
Self-contained. Reads `.planning/STATE.md`, `.planning/phases/{NN}-*/{NN}-CONTEXT.md`, all `{NN}-*-PLAN.md`, all `{NN}-*-SUMMARY.md`, and `git log`/`git diff`. Writes `.planning/lessons/{NN}-{YYYY-MM-DD}.md` (creates `.planning/lessons/` if missing) and appends one row to `.planning/HANDOFF.md` after all lenses complete successfully. The Skill bypasses `hooks/stop_hook.cjs` entirely — no helper invocation, no Node.js lessons writer.
</execution_context>

<process>

**Step 1 — Argument parsing + phase resolve.**

Parse `$ARGUMENTS` into `PHASE_RAW` and `LENS_RAW`. Detect `--pick` token anywhere in the argument list and strip it before positional parsing (D-01, D-02). If `PHASE_RAW` is empty, fall back to `.planning/STATE.md` `^Phase:` line using the multi-line `grep + sed + awk` pattern below (macOS-compatible pipeline). **Do not replace with a single-token regex** — preserve the full pipeline for macOS/BSD compatibility.

```bash
set -- $ARGUMENTS

# D-01, D-02: --pick 토큰을 어느 위치에서든 탐지하고 제거 (positional 파싱 보존)
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

if [ -z "$PHASE_RAW" ]; then
  # --- BEGIN STATE.md Phase parsing block (macOS-compatible grep + sed + awk pipeline) ---
  PHASE_RAW=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
              | sed -E 's/^Phase:[[:space:]]*//' \
              | sed -E 's/[[:space:]]+$//' \
              | awk '{print $1}')
  # --- END STATE.md Phase parsing block ---
fi

# D-02: integer or decimal phase allowed (e.g. 7 or 7.1)
if ! printf '%s' "$PHASE_RAW" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
  echo "Phase token must be a number or decimal (e.g. 7 or 7.1). Got: '${PHASE_RAW}'." >&2
  if [ -d .planning/phases ]; then
    echo "Available phases:" >&2
    ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  fi
  exit 1
fi

if printf '%s' "$PHASE_RAW" | grep -qE '^[0-9]+$'; then
  PHASE_PAD=$(printf "%02d" "$PHASE_RAW")
else
  PHASE_PAD="$PHASE_RAW"
fi
PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-*/ 2>/dev/null | head -1)

# D-04: directory not found error
if [ -z "$PHASE_DIR" ]; then
  echo "Phase ${PHASE_RAW} not found. Available phases:" >&2
  ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  exit 1
fi
PHASE_DIR="${PHASE_DIR%/}"  # strip trailing slash

# D-21: parse tokens from the 3rd onward as additional lens codes
EXTRA_LENS_CODES=""
if [ -n "${3:-}" ]; then
  shift 2
  EXTRA_LENS_CODES="$@"
fi

LENS_CODES_ARRAY=""
```

**Step 2 — Lens code mapping.**

Map `LENS_RAW` to one of `ssc`/`dspm`/`analyze` (case-insensitive). Removed lens codes (`4ls`/`sail`/`5why`) or any unknown code emit a stderr error message and exit 1.

```bash
LENS_CODE=""
if [ -n "$LENS_RAW" ]; then
  LENS_LC=$(printf '%s' "$LENS_RAW" | tr '[:upper:]' '[:lower:]')
  case "$LENS_LC" in
    ssc)     LENS_CODE="ssc"     ;;
    dspm)    LENS_CODE="dspm"    ;;
    analyze) LENS_CODE="analyze" ;;
    4ls|sail|5why)
      printf "Lens '%s' is no longer supported (removed in v2.9).\nAvailable lenses: ssc, dspm, analyze.\nRun without lens argument to use smart default (dspm+ssc).\n" "$LENS_LC" >&2
      exit 1
      ;;
    *)
      printf "Lens '%s' is no longer supported (removed in v2.9).\nAvailable lenses: ssc, dspm, analyze.\nRun without lens argument to use smart default (dspm+ssc).\n" "$LENS_LC" >&2
      exit 1
      ;;
  esac
fi
```

Single-lens argument path (D-19):

```bash
# D-19: argument path — build array if LENS_CODE set, append EXTRA_LENS_CODES if present
VALID_EXTRAS=""
if [ -n "$EXTRA_LENS_CODES" ]; then
  for EC in $EXTRA_LENS_CODES; do
    EC_LC=$(printf '%s' "$EC" | tr '[:upper:]' '[:lower:]')
    case "$EC_LC" in
      ssc|dspm|analyze) VALID_EXTRAS="${VALID_EXTRAS} ${EC_LC}" ;;
      4ls|sail|5why)
        printf "Lens '%s' is no longer supported (removed in v2.9).\nAvailable lenses: ssc, dspm, analyze.\nRun without lens argument to use smart default (dspm+ssc).\n" "$EC_LC" >&2
        exit 1
        ;;
      *)
        printf "Lens '%s' is no longer supported (removed in v2.9).\nAvailable lenses: ssc, dspm, analyze.\nRun without lens argument to use smart default (dspm+ssc).\n" "$EC_LC" >&2
        exit 1
        ;;
    esac
  done
fi
if [ -n "$LENS_CODE" ]; then
  LENS_CODES_ARRAY="${LENS_CODE}${VALID_EXTRAS}"
elif [ -n "$VALID_EXTRAS" ]; then
  # F-01 fix: build array from extras even when LENS_CODE is empty
  LENS_CODES_ARRAY="$VALID_EXTRAS"
fi

# D-03: --pick + positional lens 충돌 reject (silent override 금지)
if [ "$PICK_MODE" = "true" ] && { [ -n "$LENS_RAW" ] || [ -n "$EXTRA_LENS_CODES" ]; }; then
  printf 'Cannot combine --pick with positional lens argument.\nUse either: sg-retro {phase} {lens...}  (explicit args)\nOr:         sg-retro {phase} --pick     (interactive picker)\n' >&2
  exit 1
fi

# Phase 42 (D-02): smart default — no args → dspm+ssc, dspm first (technical core → behavior recommendation)
if [ -z "$LENS_CODES_ARRAY" ] && [ -z "$LENS_RAW" ] && [ -z "$EXTRA_LENS_CODES" ]; then
  LENS_CODES_ARRAY="dspm ssc"
fi
```

**Step 3 — Collect target artifacts.**

Collect exactly three artifact types (`{NN}-CONTEXT.md` + all `{NN}-*-PLAN.md` + all `{NN}-*-SUMMARY.md`). Do NOT auto-include `{NN}-PATTERNS.md`, `{NN}-VERIFICATION.md`, `{NN}-RESEARCH.md`, or `{NN}-DISCUSSION-LOG.md` (D-05). Use the Read tool inline on each path in the lens facilitation step.

```bash
CONTEXT_FILE="${PHASE_DIR}/${PHASE_PAD}-CONTEXT.md"
PLAN_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-PLAN.md 2>/dev/null)
SUMMARY_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-SUMMARY.md 2>/dev/null)

# display (for stderr diagnostics; lens facilitation reads directly with Read tool inline)
echo "Collected artifacts:" >&2
[ -f "$CONTEXT_FILE" ] && echo "  $CONTEXT_FILE" >&2
[ -n "$PLAN_FILES" ] && printf '  %s\n' $PLAN_FILES >&2
[ -n "$SUMMARY_FILES" ] && printf '  %s\n' $SUMMARY_FILES >&2
```

**Step 3b — Collect session transcript (for analyze lens).**

```bash
# D-06: collect session transcript (for analyze lens)
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

# git log: uncapped, full oneline output
GIT_LOG=$(git log ${RANGE} --oneline 2>/dev/null)

# git diff: adaptive 1000-line cap
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

```bash
# F-02 fix: initialize before loop (set to true inside analyze sub-block)
ANALYZE_LENS_RAN=false

# D-05, D-06: --pick 모드 → AskUserQuestion multiSelect 1회 호출
if [ "$PICK_MODE" = "true" ]; then
  # Claude execute-time: invoke AskUserQuestion with the spec below.
  #   header: "Pick Lens"
  #   question: "Which lens(es) do you want to run for Phase ${PHASE_RAW}?"
  #   multiSelect: true
  #   options:
  #     - label "ssc",     description "surface behavior changes — what to start, stop, or continue doing next phase."
  #     - label "dspm",    description "capture technical decisions, unexpected outcomes, recurring techniques, and verification failures from this phase."
  #     - label "analyze", description "scan session transcript for frustration, correction, repetition, and validated-success signals; propose sg-rule drafts."
  # Selected labels → LENS_CODES_ARRAY (space-separated, in user-selected order).
  # 0-selection (cancel / empty) → emit stderr message and silent exit(0):
  #   "--pick cancelled — no lens selected, no retrospective recorded."
  # The exit(0) MUST occur before the lens loop, lessons file creation, and HANDOFF append.
  :  # placeholder — Claude inserts the AskUserQuestion tool call here at execute time
fi
```

Execute each lens in LENS_CODES_ARRAY sequentially. For each iteration, set LENS_CODE to the current code and run the matching sub-block. After the sub-block completes, run Step 6 append for that lens.

```
for LENS_CODE in $LENS_CODES_ARRAY; do
  [run sub-block for LENS_CODE]
  [run Step 6 append for this LENS_CODE]
done
```

There is no "proceed to next?" confirmation between lenses — fully automatic sequential execution.

Common flow for ssc/dspm lenses (D-09 hybrid + D-10 artifact-grounded draft-then-confirm):

1. Read all three artifact types (CONTEXT, PLAN(s), SUMMARY(s)) and capture key signals from `${GIT_LOG}` and `${GIT_DIFF}` (range: `${RANGE}`).
2. For each lens-specific subheading, propose 2–5 draft bullet items grounded in the artifacts above. Each bullet must cite the source (file path or commit hash). Present the full draft as a single markdown block.
3. Ask the user to confirm/edit/add/delete each subheading's items. Use the user's input language (D-16 — auto-detect; this is the body content language, not the markdown structure markers). Single round-trip preferred — present all subheadings at once, not one-by-one.
4. After items are finalized, propose 2–4 Action Items rows: priority (`P1`/`P2`/`P3`) | one-sentence item | concrete next step or `deferred to Phase N` label. **No owner column (D-12).** User confirms/edits the table.
5. Assemble the final lens section (header + `_Captured: {NOW_ISO}_` + `_Intent: ..._` + subheadings + Action Items) and append to `${LESSONS_FILE}` using the bash block in Step 6. Empty body or empty action items violates RETRO-04. Emit `Lessons saved to ${LESSONS_FILE}.` to stdout. No other output.

Lens-specific sub-blocks:

**Sub-block `ssc` (Start/Stop/Continue):**
- Fixed subheadings: `### Start` / `### Stop` / `### Continue`.
- Facilitation: For **Start**, propose practices/tools/conventions the team should begin adopting based on PLAN.md gaps and SUMMARY follow-ups. For **Stop**, propose anti-patterns visible in `git diff` or CONTEXT decisions reversed mid-phase. For **Continue**, propose practices visible in SUMMARY that delivered observed value.

**Sub-block `dspm` (Decisions/Surprises/Patterns/Mistakes):**
- Fixed subheadings: `### Decisions` / `### Surprises` / `### Patterns` / `### Mistakes`.
- Facilitation: **Decisions** = D-XX locks from CONTEXT and SUMMARY lock-in. **Surprises** = `git log` commit messages that pivoted phase direction. **Patterns** = recurring techniques across multiple PLAN tasks. **Mistakes** = verification failures + known risks not mitigated (CONTEXT "Known Risk Sites" that surfaced).
- **Explicit guard:** DSPM derives all four categories strictly from collected phase artifacts + `git log`/`git diff`. **Do NOT read or analyze session transcript, even if it appears relevant.** Phase 10 ANALYZER will add transcript-based merging additively (D-11).

**Sub-block `analyze` (Conversation Analyzer):**
- Fixed subheadings: `### Analysis Findings` (table) / `### Draft sg-rules` / `### Action Items`
- Facilitation (D-05, D-07, D-08):
  1. If TRANSCRIPT_FILE is empty, exit immediately: `echo "No transcript found — skipping Conversation Analyzer." >&2`, then proceed to next lens or finish without appending a result for this lens. ANALYZE_LENS_RAN is not set.
  2. If TRANSCRIPT_FILE exists, Claude reads it directly with the Read tool (bash grep is forbidden — D-05).
  3. Default scan range: most recent 20-30 messages (D-07). If user specifies "deep" or `analyze deep` token, expand to full transcript or most recent 100 messages.
  4. Scan for D-08 signals and classify into 4 categories:
     - `frustration`: user dissatisfaction expressions such as "why", "doesn't work", "again", "wrong", "I didn't ask", "That's wrong"
     - `correction`: patterns where user reverts or re-directs the assistant's prior action
     - `repeated`: same type of mistake or instruction occurring 2 or more times
     - `validated-success`: non-obvious assistant choices explicitly accepted or confirmed by the user
  5. Output results as a D-03 schema table:
     `| category | tool/event | pattern | context | severity |`
     severity: high (requires immediate fix) / medium (caution) / low (informational)
  6. Generate Draft sg-rules section based on high/medium severity items. Each rule format: `warn-{slug}` or `block-{slug}` — Event: {tool}, Pattern: `{regex}`, Severity: {level}.
  7. Confirm Action Items and append.
  8. D-02 auto-suggest: when `analyze` lens is explicitly selected, rule drafts are included inside this sub-block; set the `ANALYZE_LENS_RAN=true` flag to avoid duplicating Step 6's separate auto-suggest.

```bash
ANALYZE_LENS_RAN=true
```

**Step 6 — Append to lessons file (per lens iteration).**

Write the assembled lens section (header `## Lens: {name}{run-suffix}` + `_Captured: ${NOW_ISO}_` italic line + `_Intent: ..._` italic line + lens-specific subheadings + Action Items table) to `.planning/lessons/${PHASE_PAD}-${TODAY}.md` using a single `>>` redirect block (D-21). Create the directory if missing. Emit `lessons file: {path} +N lines` to stderr for verification.

```bash
# UTC ISO date (D-17)
TODAY=$(date -u +%Y-%m-%d)
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LESSONS_DIR=".planning/lessons"
LESSONS_FILE="${LESSONS_DIR}/${PHASE_PAD}-${TODAY}.md"

mkdir -p "$LESSONS_DIR"

# Determine Lens English name (matches D-13 labels)
case "$LENS_CODE" in
  ssc)     LENS_NAME="Start/Stop/Continue" ;;
  dspm)    LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
  analyze) LENS_NAME="Conversation Analyzer" ;;
esac

# D-12, D-14: lens intent line (static, English, italic single-line — emitted after _Captured: line)
case "$LENS_CODE" in
  ssc)     INTENT_LINE='_Intent: surface behavior changes — what to start, stop, or continue doing next phase._' ;;
  dspm)    INTENT_LINE='_Intent: capture technical decisions, unexpected outcomes, recurring techniques, and verification failures from this phase._' ;;
  analyze) INTENT_LINE='_Intent: scan session transcript for frustration, correction, repetition, and validated-success signals; propose sg-rule drafts._' ;;
esac

# D-20: same-lens duplicate-run disambiguation
# if file exists, count same lens headers to determine (run N) suffix
RUN_SUFFIX=""
if [ -f "$LESSONS_FILE" ]; then
  COUNT=$(grep -cE "^## Lens: ${LENS_NAME}( \(run [0-9]+\))?\$" "$LESSONS_FILE" 2>/dev/null)
  COUNT=${COUNT:-0}
  if [ "$COUNT" -gt 0 ]; then
    RUN_SUFFIX=" (run $((COUNT + 1)))"
  fi
fi

LENS_HEADER="## Lens: ${LENS_NAME}${RUN_SUFFIX}"

# D-21: line count before append
if [ -f "$LESSONS_FILE" ]; then
  BEFORE=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
else
  BEFORE=0
fi

# D-21: if new file, write top-level header + one blank line first
if [ ! -f "$LESSONS_FILE" ]; then
  {
    printf '# Lessons: Phase %s (%s)\n\n' "$PHASE_RAW" "$TODAY"
  } > "$LESSONS_FILE"
fi

# D-19/D-21: >> append entire lens section in one shot (avoid partial-write)
#
# IMPORTANT — Claude execution contract:
# Before running this block, Claude MUST replace the BODY_PRINTF placeholder
# below with explicit `printf` lines that emit:
#   1. Each lens-specific fixed subheading (`### Start`/`### Decisions`/etc.) per
#      `LENS_CODE` (Step 5 sub-blocks list the exact subheadings — 3 for ssc,
#      4 for dspm, 2+ for analyze).
#   2. The user-confirmed bullet items under each subheading as `- {item}`
#      lines (user input language, D-16).
# AND replace the ACTION_ITEMS_PRINTF placeholder with explicit `printf` lines
# emitting the confirmed 2–4 action item rows in the exact 3-column format.
#
# Do NOT leave the body or action item rows empty — that violates RETRO-04
# (consistent output structure) and breaks Phase 12 LESSONS-02 parsing.
{
  printf '%s\n' "$LENS_HEADER"
  printf '_Captured: %s_\n' "$NOW_ISO"
  printf '%s\n\n' "$INTENT_LINE"
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
  # ACTION_ITEMS_PRINTF — Claude inserts row `printf` lines here.
  # DISPLAY-01 (D-08, D-09): P1 행은 priority 셀에 `🔴 P1` prefix로 emit. P2/P3는 prefix 없음.
  #   printf '| 🔴 P1 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"   # P1 only
  #   printf '| P2 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P2 unchanged
  #   printf '| P3 | %s | %s |\n' "$ITEM_TEXT" "$NEXT_STEP_TEXT"      # P3 unchanged
  printf '\n'
} >> "$LESSONS_FILE"

AFTER=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
DELTA=$((AFTER - BEFORE))
echo "lessons file: ${LESSONS_FILE} +${DELTA} lines" >&2
```

After the multi-lens loop completes, auto-suggest sg-rule drafts once:

```bash
# D-02: sg-rule draft auto-suggest after all lenses complete (once only)
# if analyze lens already generated rule drafts, emit only a reminder with no separate output.
if [ "${ANALYZE_LENS_RAN:-false}" = "true" ]; then
  echo "sg-rule drafts were included in the Conversation Analyzer output above." >&2
else
  # Claude: suggest rule drafts based on high/medium severity findings or Action Items
  echo "[Auto-suggest] Review the Action Items above and consider creating sg-rules for repeated patterns." >&2
fi
```

After the auto-suggest block completes, record the successful retrospective in HANDOFF.md (success-based — only runs when at least one lens has been written):

```bash
# HANDOFF.md record — after all lenses complete + lessons saved confirmed (success-based, D-04)
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
TS_H=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PHASE_SLUG_H=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG_H" ] && PHASE_SLUG_H="${PHASE_RAW:-unknown}"
FROM_STAGE_H=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
[ -z "$FROM_STAGE_H" ] && FROM_STAGE_H="init"
GIT_USER=$(git config user.name 2>/dev/null || echo "-")
[ -z "$GIT_USER" ] && GIT_USER="-"
echo "| $TS_H | $PHASE_SLUG_H | $FROM_STAGE_H | sg-retro | - | $GIT_USER |" >> "$HANDOFF_FILE"
```

</process>

<success_criteria>
1. Calling `Skill(skill="sg-retro", args="...")` resolves the phase argument (integer or decimal, e.g. `7` or `7.1`) to exactly one `.planning/phases/{NN}-*/` directory; integers are zero-padded, decimals are used as-is. If no directory matches, the Skill emits an error to stderr and exits 1 (D-04).
2. Second argument (if provided) is one of `ssc`/`dspm`/`analyze` (case-insensitive). Removed codes (`4ls`/`sail`/`5why`) or any unknown code emit a stderr error message containing "no longer supported (removed in v2.9)" and exit 1 without creating a lessons file. When no second argument is provided AND no extra-lens arguments are provided, smart default applies: `LENS_CODES_ARRAY="dspm ssc"` is set automatically (dspm first, then ssc) without invoking AskUserQuestion.
3. Each lens output follows: `## Lens: {name}` header + `_Captured: {ISO}_` italic line + `_Intent: ..._` italic line + lens-specific fixed subheadings + a `### Action Items` 3-column table (`priority | item | next step`) (D-09, D-12). No owner column.
4. The lessons file is written to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. If the file does not exist, the top-level header and the first lens section are written; if it exists, only the new lens section is appended at the end (D-17, D-18, D-19, D-21). A same-day same-lens repeat uses a `(run 2)`/`(run 3)`/... disambiguating suffix (D-20).
5. DSPM lens derives strictly from collected phase artifacts + `git log`/`git diff`. Session-transcript scanning is never performed for ssc/dspm lenses (D-11). The analyze lens is the only path that reads the session transcript.
6. When LENS_CODES_ARRAY contains multiple codes (smart default `dspm ssc` or multi-arg invocation), each lens is executed sequentially with its result appended to the same lessons file (D-18, D-20, RETRO-05).
7. Invocation with a removed lens code, e.g. `args="10 sail"` / `args="10 4ls"` / `args="10 5why"`, exits with code 1, emits the dropped-lens error message to stderr, and does not create or append to any lessons file. `args="10 analyze"` continues to trigger direct analyze-only execution.
8. Multi-lens invocation `args="10 ssc dspm"` builds `LENS_CODES_ARRAY="ssc dspm"` and executes both lenses sequentially with a single combined run suffix. Mixed invocation where one of the extra codes is removed (e.g. `args="10 dspm sail"`) rejects on first dropped code encountered: stderr error, exit 1, dspm is NOT executed (D-07 — no partial execution).
9. When TRANSCRIPT_FILE is empty, the analyze lens emits "No transcript found" to stderr and exits the lens gracefully without appending to lessons (D-06).
10. The Conversation Analyzer reads the JSONL file using Claude's Read tool (not bash grep) and outputs a 5-column findings table (category/tool-event/pattern/context/severity) + Draft sg-rules section (ANALYZER-01, ANALYZER-02).
11. sg-rule draft auto-suggest occurs exactly once per sg-retro invocation — after all lenses complete (D-02). If analyze lens ran, its Draft sg-rules section serves as the auto-suggest output; no duplicate suggestion is made.
12. The `--pick` flag (long form, lowercase, hyphenated) is detected anywhere in the argument list and triggers an interactive lens selection via AskUserQuestion multiSelect with exactly three options (ssc/dspm/analyze) — called exactly once per invocation (LENS-03, D-01, D-02, D-05). Combining `--pick` with a positional lens argument (e.g. `43 ssc --pick`) emits a stderr conflict error and exits 1 without invoking AskUserQuestion or creating a lessons file (D-03). 0-selection silently exits 0 with a `--pick cancelled` stderr message and creates no lessons file and no HANDOFF row (D-06).
13. Lessons file `### Action Items` rows whose priority is P1 are emitted with a `🔴 P1` prefix in the priority cell; P2 and P3 rows have no prefix (DISPLAY-01, D-08, D-09). The single 3-column table schema (`priority | item | next step`) is preserved.
14. Each lens section emits an italic single-line lens intent statement directly after the `_Captured: {ISO}_` line, sourced from the static `INTENT_LINE` case mapping in Step 6 (one fixed English sentence per lens — ssc/dspm/analyze) (DISPLAY-02, D-12, D-13, D-14, D-15).
</success_criteria>
