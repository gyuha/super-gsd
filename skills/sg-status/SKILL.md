---
name: sg-status
description: Use this when you want to know where you are in the workflow — reads HANDOFF.md and STATE.md to show the current stage and the next recommended command.
---

<objective>
Inspect the current super-gsd workflow state. Read .planning/HANDOFF.md to determine the current stage, .planning/STATE.md for the current phase line (single source of truth), and .planning/ROADMAP.md only to detect whether a following phase exists for the ship branch. Output exactly three header lines, a blank line, and one "Next:" line.
</objective>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Writes nothing.
</execution_context>

<process>
1. **Read `Phase:` line verbatim from STATE.md.** Capture the full string after the colon (trimmed). STATE.md is the single source of truth for the displayed phase value — no ROADMAP name lookup, no token splitting (D-04, D-05, D-06):
   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start replicates this same block) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

2. **Determine stage from HANDOFF.md (D-27).** If the file is missing or has zero data rows, set `STAGE_RAW=init`. Otherwise, extract the `To` column from the last data row, then map storage enum → display enum (D-01, D-02):
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
     case "$STAGE_RAW" in
       gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete) ;;
       *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
     esac
   fi

   # Storage → Display enum mapping (D-01, D-02)
   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     ui-plan)      STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     parallel)     STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="superpowers" ;;
     review)       STAGE_DISPLAY="superpowers" ;;
     sg-retro)     STAGE_DISPLAY="sg-retro" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
   esac
   ```

3. **Compute last handoff timestamp.**
   ```bash
   if [ -z "$TS" ]; then
     LAST_TS="(none)"
   else
     LAST_TS="$TS"
   fi
   ```

4. **Compute next-phase number for the sg-retro branch (D-28).** Only required when `STAGE_RAW == sg-retro`. Increment the integer phase by 1 and check whether `.planning/ROADMAP.md` contains a heading for that phase:
   ```bash
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
   ```

5. **Map stage to next command (D-28).** Routing branches on storage 5-state (D-03 lock). `init` branch falls back to `/super-gsd:sg-plan` (no arg) when `PHASE_NUM` is non-integer (CONTEXT specifics scenario 6 fallback (b)):
   ```bash
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
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
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
   ```

6. **Print output (D-29).** Emit exactly the following five lines (three header lines, one blank line, and the `Next:` line) and a single trailing newline. No additional output is permitted:
   ```
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last handoff: <LAST_TS>

   Next: <NEXT_CMD>
   ```
</process>

<success_criteria>
1. The output is exactly five lines (D-29 lock): three non-empty header lines, one blank line, and one non-empty `Next:` line — no extra lines or trailing output.
2. When `.planning/HANDOFF.md` contains only the header and separator rows (no data rows), `Stage` is `init` and `Last handoff:` is `(none)` (STATUS-02).
3. The `Stage:` value uses the display enum (`init|gsd|superpowers|sg-retro|ship|complete`) per D-01/D-02, and the `Next:` command branches on the storage 7-state enum per D-03 — so `superpowers` routes to `/super-gsd:sg-review`, `review` displays as `superpowers` but routes to `/super-gsd:sg-learn`, `sg-retro` routes to `/super-gsd:sg-ship`, `ship` routes to the next phase or `/super-gsd:sg-complete`, and `complete` routes to `/super-gsd:sg-new`.
</success_criteria>
