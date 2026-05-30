---
name: sg-retro
description: Run a structured retrospective on a GSD phase with one of three lenses (ssc, dspm, analyze) — select multiple lenses in one call or omit lens argument for smart default (dspm+ssc) — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md. AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.
argument-hint: "[phase] [lens] - e.g. '14 ssc' or '14 ssc dspm'. lens: ssc|dspm|analyze. Omit lens for smart default (dspm+ssc)."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Run a structured retrospective on a GSD phase. Auto-collect phase artifacts and git context. Let the user pick one or more of three lenses — Start/Stop/Continue (ssc), Decisions/Surprises/Patterns/Mistakes (dspm), Conversation Analyzer (analyze) — or omit the lens argument to apply the smart default (dspm+ssc). Facilitate each lens (artifact-grounded for ssc/dspm; transcript-native for analyze), then append all results sequentially to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- AskUserQuestion not supported: lens selection is handled via numbered list text output + free input
- SubagentStop not supported: no automatic trigger on stage completion
- Superpowers integration unavailable: this skill is fully self-contained
</constraints>

<execution_context>
Self-contained. Reads `.planning/STATE.md`, `.planning/phases/{NN}-*/{NN}-CONTEXT.md`, all `{NN}-*-PLAN.md`, all `{NN}-*-SUMMARY.md`, and `git log`/`git diff`. Writes only `.planning/lessons/{NN}-{YYYY-MM-DD}.md` (and creates `.planning/lessons/` if missing).
</execution_context>

<process>

**Step 1 — Argument parsing + phase resolve.**

Parse `$ARGUMENTS` into `PHASE_RAW` and `LENS_RAW`. If `PHASE_RAW` is empty, fall back to `.planning/STATE.md` `^Phase:` line using the multi-line `sed` pattern below. **Do not introduce a single-token regex shortcut** — preserve the full grep + sed + awk pipeline as-is.

```bash
set -- $ARGUMENTS
PHASE_RAW="${1:-}"
LENS_RAW="${2:-}"

if [ -z "$PHASE_RAW" ]; then
  # --- BEGIN STATE.md Phase parsing block ---
  PHASE_RAW=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
              | sed -E 's/^Phase:[[:space:]]*//' \
              | sed -E 's/[[:space:]]+$//' \
              | awk '{print $1}')
  # --- END STATE.md Phase parsing block ---
fi

if ! printf '%s' "$PHASE_RAW" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
  echo "Phase token must be a number (integer or decimal like 7.1). Got: '${PHASE_RAW}'." >&2
  if [ -d .planning/phases ]; then
    echo "Available phases:" >&2
    ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  fi
  exit 1
fi

if echo "$PHASE_RAW" | grep -qE '\.'; then
  PHASE_PAD="$PHASE_RAW"
else
  PHASE_PAD=$(printf "%02d" "$PHASE_RAW")
fi
PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-*/ 2>/dev/null | head -1)

if [ -z "$PHASE_DIR" ]; then
  echo "Phase ${PHASE_RAW} not found. Available phases:" >&2
  ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  exit 1
fi
PHASE_DIR="${PHASE_DIR%/}"

EXTRA_LENS_CODES=""
if [ -n "${3:-}" ]; then
  shift 2
  EXTRA_LENS_CODES="$@"
fi

LENS_CODES_ARRAY=""
```

**Step 2 — Lens code mapping with smart default.**

Map `LENS_RAW` to one of `ssc`/`dspm`/`analyze` (case-insensitive). Removed lens codes (`4ls`/`sail`/`5why`) or any unknown code emit a stderr error message and exit 1 without creating or appending to a lessons file. When `LENS_RAW` and `EXTRA_LENS_CODES` are both empty, the smart default applies automatically (no AskUserQuestion, no numbered list).

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

Single-lens argument path:

```bash
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
  LENS_CODES_ARRAY="$VALID_EXTRAS"
fi

# Phase 42 (D-02): smart default — no args → dspm+ssc, dspm first (technical core → behavior recommendation)
if [ -z "$LENS_CODES_ARRAY" ] && [ -z "$LENS_RAW" ] && [ -z "$EXTRA_LENS_CODES" ]; then
  LENS_CODES_ARRAY="dspm ssc"
fi
```

**Step 3 — Collect target artifacts.**

```bash
CONTEXT_FILE="${PHASE_DIR}/${PHASE_PAD}-CONTEXT.md"
PLAN_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-PLAN.md 2>/dev/null)
SUMMARY_FILES=$(ls -1 ${PHASE_DIR}/${PHASE_PAD}-*-SUMMARY.md 2>/dev/null)

echo "Collected artifacts:" >&2
[ -f "$CONTEXT_FILE" ] && echo "  $CONTEXT_FILE" >&2
[ -n "$PLAN_FILES" ] && printf '  %s\n' $PLAN_FILES >&2
[ -n "$SUMMARY_FILES" ] && printf '  %s\n' $SUMMARY_FILES >&2
```

**Step 3b — Collect session transcript (for analyze lens).**

```bash
PROJECT_SLUG=$(pwd | tr '/' '-')
TRANSCRIPT_DIR="$HOME/.claude/projects/${PROJECT_SLUG}"
TRANSCRIPT_FILE=$(ls -t "${TRANSCRIPT_DIR}"/*.jsonl 2>/dev/null | head -1)
if [ -z "$TRANSCRIPT_FILE" ]; then
  echo "[Conversation Analyzer] No transcript found at ${TRANSCRIPT_DIR}." >&2
  TRANSCRIPT_FILE=""
fi
```

**Step 4 — Collect git context.**

```bash
BASE=$(git log -1 --format=%H -- .planning/phases/${PHASE_PAD}-*/ 2>/dev/null)
if [ -z "$BASE" ]; then
  RANGE="HEAD~10..HEAD"
else
  RANGE="${BASE}..HEAD"
fi

GIT_LOG=$(git log ${RANGE} --oneline 2>/dev/null)

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
ANALYZE_LENS_RAN=false
```

Execute each lens in LENS_CODES_ARRAY sequentially. For each iteration, set LENS_CODE to the current code and run the matching sub-block. After the sub-block completes, run Step 6 append for that lens.

```
for LENS_CODE in $LENS_CODES_ARRAY; do
  [run sub-block for LENS_CODE]
  [run Step 6 append for this LENS_CODE]
done
```

Common flow for ssc/4ls/dspm/sail lenses:

1. Read all three artifact types (CONTEXT, PLAN(s), SUMMARY(s)) and capture key signals from `${GIT_LOG}` and `${GIT_DIFF}`.
2. For each lens-specific subheading, propose 2–5 draft bullet items grounded in the artifacts above. Each bullet must cite the source (file path or commit hash). Present the full draft as a single markdown block.
3. Ask the user to confirm/edit/add/delete each subheading's items. Output the draft as text and wait for user input. Single round-trip preferred — present all subheadings at once.
4. After items are finalized, propose 2–4 Action Items rows: priority (`P1`/`P2`/`P3`) | one-sentence item | concrete next step or `deferred to Phase N` label. No owner column. User confirms/edits.
5. Assemble the final lens section and append to `${LESSONS_FILE}` using the bash block in Step 6.

**Sub-block `ssc` (Start/Stop/Continue):**
- Fixed subheadings: `### Start` / `### Stop` / `### Continue`.
- Facilitation: For **Start**, propose practices/tools/conventions to begin. For **Stop**, propose anti-patterns visible in `git diff` or CONTEXT. For **Continue**, propose practices that delivered observed value.

**Sub-block `dspm` (Decisions/Surprises/Patterns/Mistakes):**
- Fixed subheadings: `### Decisions` / `### Surprises` / `### Patterns` / `### Mistakes`.
- **Explicit guard:** Derives strictly from collected phase artifacts + `git log`/`git diff`. Do NOT read or analyze session transcript.

**Sub-block `analyze` (Conversation Analyzer):**
- Fixed subheadings: `### Analysis Findings` (table) / `### Draft sg-rules` / `### Action Items`.
- Facilitation:
  1. If TRANSCRIPT_FILE is empty: `echo "No transcript found — skipping Conversation Analyzer."` and skip this lens.
  2. Read TRANSCRIPT_FILE using the Read tool (not bash grep).
  3. Scan recent 20-30 messages for 4 categories: `frustration`, `correction`, `repeated`, `validated-success`.
  4. Output 5-column findings table: `| category | tool/event | pattern | context | severity |`
  5. Generate Draft sg-rules for high/medium severity items.
  6. Confirm Action Items (text output) then append.
  7. Set `ANALYZE_LENS_RAN=true`.

**Step 6 — Append to lessons file (per lens iteration).**

```bash
TODAY=$(date -u +%Y-%m-%d)
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LESSONS_DIR=".planning/lessons"
LESSONS_FILE="${LESSONS_DIR}/${PHASE_PAD}-${TODAY}.md"

mkdir -p "$LESSONS_DIR"

case "$LENS_CODE" in
  ssc)     LENS_NAME="Start/Stop/Continue" ;;
  dspm)    LENS_NAME="Decisions/Surprises/Patterns/Mistakes" ;;
  analyze) LENS_NAME="Conversation Analyzer" ;;
esac

RUN_SUFFIX=""
if [ -f "$LESSONS_FILE" ]; then
  COUNT=$(grep -cE "^## Lens: ${LENS_NAME}( \(run [0-9]+\))?\$" "$LESSONS_FILE" 2>/dev/null)
  COUNT=${COUNT:-0}
  if [ "$COUNT" -gt 0 ]; then
    RUN_SUFFIX=" (run $((COUNT + 1)))"
  fi
fi

LENS_HEADER="## Lens: ${LENS_NAME}${RUN_SUFFIX}"

if [ -f "$LESSONS_FILE" ]; then
  BEFORE=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
else
  BEFORE=0
fi

if [ ! -f "$LESSONS_FILE" ]; then
  {
    printf '# Lessons: Phase %s (%s)\n\n' "$PHASE_RAW" "$TODAY"
  } > "$LESSONS_FILE"
fi

{
  printf '%s\n' "$LENS_HEADER"
  printf '_Captured: %s_\n\n' "$NOW_ISO"
  # BODY_PRINTF — insert subheading + bullet printf lines here (confirmed content)
  printf '\n### Action Items\n'
  printf '| priority | item | next step |\n'
  printf '|----------|------|-----------|\n'
  # ACTION_ITEMS_PRINTF — insert row printf lines here
  printf '\n'
} >> "$LESSONS_FILE"

AFTER=$(wc -l < "$LESSONS_FILE" | tr -d ' ')
DELTA=$((AFTER - BEFORE))
echo "lessons file: ${LESSONS_FILE} +${DELTA} lines" >&2
```

After the multi-lens loop completes, auto-suggest sg-rule drafts once:

```bash
if [ "${ANALYZE_LENS_RAN:-false}" = "true" ]; then
  echo "sg-rule drafts were included in the Conversation Analyzer output above." >&2
else
  echo "[Auto-suggest] Review the Action Items above and consider creating sg-rules for repeated patterns." >&2
fi
```

</process>

<lens_templates>

**Start/Stop/Continue (ssc):**
```markdown
## Lens: Start/Stop/Continue
_Captured: {ISO-8601 UTC}_

### Start
- [item]

### Stop
- [item]

### Continue
- [item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [summary] | [concrete step] |
```

**Decisions/Surprises/Patterns/Mistakes (dspm):**
```markdown
## Lens: Decisions/Surprises/Patterns/Mistakes
_Captured: {ISO-8601 UTC}_

### Decisions
- [item]

### Surprises
- [item]

### Patterns
- [item]

### Mistakes
- [item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [summary] | [concrete step] |
```

**Conversation Analyzer (analyze):**
```markdown
## Lens: Conversation Analyzer
_Captured: {ISO-8601 UTC}_

### Analysis Findings

| category | tool/event | pattern | context | severity |
|----------|------------|---------|---------|----------|
| frustration | Bash | `rm -rf` | User said "why delete" | high |

### Draft sg-rules

- `warn-dangerous-rm` — Event: bash, Pattern: `rm\s+-rf`, Severity: high

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [summary] | [concrete step] |
```

</lens_templates>

<success_criteria>
1. The Phase argument must be a number, and the corresponding `.planning/phases/{NN}-*/` directory must exist.
2. Second argument (if provided) is one of `ssc`/`dspm`/`analyze` (case-insensitive). When omitted along with extra-lens arguments, smart default `LENS_CODES_ARRAY="dspm ssc"` applies automatically (dspm first, then ssc) without prompting.
3. No argument → smart default (dspm+ssc) applies without prompting. Removed lens codes (`4ls`/`sail`/`5why`) or any unknown code emit a stderr error message containing "no longer supported (removed in v2.9)" and exit 1 without creating or appending to a lessons file. Multi-lens invocations reject on the first dropped code encountered — no partial execution (D-07).
4. Each lens output: `## Lens: {name}` header + `_Captured: {ISO}_` + lens-specific fixed subheadings + `### Action Items` 3-column table.
5. Results are appended to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`.
6. DSPM lens references only phase artifacts + `git log`/`git diff`. No transcript scan.
7. The analyze lens gracefully skips if TRANSCRIPT_FILE is not found.
</success_criteria>
