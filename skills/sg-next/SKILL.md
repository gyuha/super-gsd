---
name: sg-next
description: Use this when you want to advance to the next workflow stage automatically — reads HANDOFF.md and STATE.md to determine the current stage and immediately invokes the next sg-* command.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Detect the current workflow stage from HANDOFF.md and STATE.md, determine the next sg-* command using the same routing table as sg-status, then immediately invoke it without asking for confirmation. Appends a HANDOFF.md row before invoking. For ambiguous states (complete or init), presents choices via AskUserQuestion instead of auto-invoking.
</objective>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Appends .planning/HANDOFF.md.
</execution_context>

<process>

**Step 1 — STATE.md Phase parsing:**

```bash
# --- BEGIN STATE.md Phase parsing block (D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift) ---
PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
[ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
# --- END STATE.md Phase parsing block ---
```

**Step 2 — HANDOFF.md stage detection + enum mapping:**

```bash
# --- BEGIN HANDOFF.md stage detection block (D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift) ---
LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
if [ -z "$LAST_ROW" ]; then
  STAGE_RAW="init"
  TS=""
else
  STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
  TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
  case "$STAGE_RAW" in
    gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete|sg-next) ;;
    *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
  esac
  # sg-next is a meta-transition row, so use the preceding FROM column ($4) as the actual current stage
  if [ "$STAGE_RAW" = "sg-next" ]; then
    STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
    # If FROM is also sg-next (corrupted chain), scan back for the last real stage
    if [ "$STAGE_RAW" = "sg-next" ] || [ -z "$STAGE_RAW" ]; then
      STAGE_RAW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
        | awk -F'|' '{gsub(/ /,"",$5); print $5}' \
        | grep -vE '^sg-next$' | tail -1)
      [ -z "$STAGE_RAW" ] && STAGE_RAW="init"
    fi
    # Re-validate after scan-back — corrupt HANDOFF.md data must not propagate to FROM_STAGE
    case "$STAGE_RAW" in
      init|gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete) ;;
      *) echo "Scan-back recovered unknown stage '${STAGE_RAW}' — defaulting to init." >&2; STAGE_RAW="init" ;;
    esac
  fi
fi
case "$STAGE_RAW" in
  init)         STAGE_DISPLAY="init" ;;
  gsd-plan)     STAGE_DISPLAY="gsd" ;;
  ui-plan)      STAGE_DISPLAY="gsd" ;;
  superpowers)  STAGE_DISPLAY="superpowers" ;;
  parallel)     STAGE_DISPLAY="superpowers" ;;
  execute)      STAGE_DISPLAY="superpowers" ;;
  tdd)          STAGE_DISPLAY="superpowers" ;;
  review)       STAGE_DISPLAY="superpowers" ;;
  sg-retro)     STAGE_DISPLAY="sg-retro" ;;
  ship)         STAGE_DISPLAY="ship" ;;
  complete)     STAGE_DISPLAY="complete" ;;
  *)            STAGE_DISPLAY="$STAGE_RAW" ;;
esac
# STAGE_DISPLAY is not printed in sg-next — preserved to maintain D-07 block identity
# --- END HANDOFF.md stage detection block ---
```

**Step 3 — NEXT_PHASE computation + stage→next-command routing:**

```bash
# --- BEGIN next-command routing block (D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift) ---
if [ "$STAGE_RAW" = "sg-retro" ] || [ "$STAGE_RAW" = "ship" ]; then
  if echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
    NEXT_PHASE=$((PHASE_NUM + 1))
    if grep -qE "^### Phase ${NEXT_PHASE}:" .planning/ROADMAP.md 2>/dev/null; then
      NEXT_PHASE_EXISTS=1
    else
      NEXT_PHASE_EXISTS=0
    fi
  else
    NEXT_PHASE_EXISTS=0
  fi
fi
case "$STAGE_RAW" in
  init)
    if [ -n "$PHASE_NUM" ]; then
      NEXT_CMD="/super-gsd:sg-plan $PHASE_NUM"
    else
      NEXT_CMD="/super-gsd:sg-plan"
    fi
    ;;
  gsd-plan)    NEXT_CMD="/super-gsd:sg-execute" ;;
  ui-plan)     NEXT_CMD="/super-gsd:sg-execute" ;;
  superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
  parallel)    NEXT_CMD="/super-gsd:sg-review" ;;
  execute)
    TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
    if [ "$TDD_MODE" = "true" ]; then
      NEXT_CMD="/super-gsd:sg-tdd"
    else
      NEXT_CMD="/super-gsd:sg-review"
    fi
    ;;
  tdd)         NEXT_CMD="/super-gsd:sg-review" ;;
  review)      NEXT_CMD="/super-gsd:sg-learn" ;;
  sg-retro)    NEXT_CMD="/super-gsd:sg-ship" ;;
  ship)
    if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
      NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
    else
      NEXT_CMD="/super-gsd:sg-complete"
    fi
    ;;
  complete) NEXT_CMD="/super-gsd:sg-new" ;;
  *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
esac
# --- END next-command routing block ---
```

**Step 4 — HANDOFF.md initialization + non-ambiguous stage append (D-04):**

For complete/init, defer the append until after Step 5 confirmation. This prevents audit log contamination on cancel.

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
FROM_STAGE="$STAGE_RAW"
if [ "$STAGE_RAW" != "complete" ] && [ "$STAGE_RAW" != "init" ]; then
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  GIT_USER=$(git config user.name 2>/dev/null || echo "-")
  [ -z "$GIT_USER" ] && GIT_USER="-"
  echo "| $TS | $PHASE_SLUG | $FROM_STAGE | sg-next | - | $GIT_USER |" >> "$HANDOFF_FILE"
fi
```

**Step 5 — complete/init branch (D-02, D-03):**

When `STAGE_RAW` is `complete`:

```
AskUserQuestion(
  questions: [{
    question: "The current Phase is in complete state. Select the next step.",
    header: "sg-next",
    multiSelect: false,
    options: [
      { label: "Run sg-new (start new milestone)", description: "Invokes the gsd-new-milestone Skill." },
      { label: "Cancel", description: "Exit without changes." }
    ]
  }]
)
```

- If "Run sg-new" selected: append `| TS | PHASE_SLUG | $FROM_STAGE | sg-next | - |` row to HANDOFF.md, then `Skill(skill="super-gsd:sg-new", args="")`
- If "Cancel" selected: emit `Cancelled. No changes made.` and exit (no append)

When `STAGE_RAW` is `init` — with PHASE_NUM present:

```
AskUserQuestion(
  questions: [{
    question: "Cannot detect current stage (init). Select the next step.",
    header: "sg-next",
    multiSelect: false,
    options: [
      { label: "Run sg-plan {PHASE_NUM}", description: "Invokes /super-gsd:sg-plan {PHASE_NUM}." },
      { label: "Cancel", description: "Exit without changes." }
    ]
  }]
)
```

When PHASE_NUM is absent, replace with label=`"Run sg-plan"`, description=`"Invokes /super-gsd:sg-plan."`.

- If "sg-plan" selected: append `| TS | PHASE_SLUG | $FROM_STAGE | sg-next | - |` row to HANDOFF.md, then `Skill(skill="super-gsd:sg-plan", args="PHASE_NUM")` if PHASE_NUM exists, otherwise `Skill(skill="super-gsd:sg-plan", args="")`
- If "Cancel" selected: emit `Cancelled. No changes made.` and exit (no append)

**Step 6 — emit 1-line then immediately invoke (all stages except complete/init):**

```bash
echo "→ $NEXT_CMD"
# Before calling Skill, substitute the actual resolved command name.
# Session control transfers to the skill; no steps execute after this point.
```

Skill() mapping by `NEXT_CMD`:

- `/super-gsd:sg-execute` → `Skill(skill="super-gsd:sg-execute", args="")`
- `/super-gsd:sg-tdd` → `Skill(skill="super-gsd:sg-tdd", args="")`
- `/super-gsd:sg-review` → `Skill(skill="super-gsd:sg-review", args="")`
- `/super-gsd:sg-learn` → `Skill(skill="super-gsd:sg-learn", args="")`
- `/super-gsd:sg-ship` → `Skill(skill="super-gsd:sg-ship", args="")`
- `/super-gsd:sg-complete` → `Skill(skill="super-gsd:sg-complete", args="")`
- `/super-gsd:sg-new` → `Skill(skill="super-gsd:sg-new", args="")`
- `/super-gsd:sg-plan N` → `Skill(skill="super-gsd:sg-plan", args="N")`
- `/super-gsd:sg-plan` (no argument) → `Skill(skill="super-gsd:sg-plan", args="")`

</process>

<success_criteria>
1. When HANDOFF.md is missing or has zero data rows, treat as STAGE_RAW=init (NEXT-01).
2. stage→next-command mapping uses the same 11 branches as sg-status (NEXT-02).
3. For all stages except complete/init, emit one `→ /super-gsd:sg-[cmd]` line and immediately invoke via Skill() — no confirmation prompt (NEXT-03).
4. When STAGE_RAW is complete or init, call AskUserQuestion; emit `Cancelled. No changes made.` and exit when cancel is selected (NEXT-04).
5. Before Skill() invoke, append `| TS | PHASE_SLUG | FROM_STAGE | sg-next | - |` row to HANDOFF.md (NEXT-05, D-04).
6. When STAGE_RAW is tdd, routes to /super-gsd:sg-review.
</success_criteria>
