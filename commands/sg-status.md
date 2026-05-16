---
name: sg-status
description: Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command.
---

<objective>
Inspect the current super-gsd workflow state. Read .planning/HANDOFF.md to determine the current stage, .planning/STATE.md for the current phase number and name, and .planning/ROADMAP.md for next-phase lookup. Output exactly three header lines, a blank line, and one "Next:" line.
</objective>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Writes nothing.
</execution_context>

<process>
1. **Read current phase from STATE.md.** Extract the phase number from the `## Current Position` section, then look up the human-readable phase name from `.planning/ROADMAP.md`:
   ```bash
   PHASE_NUM=$(grep -E '^Phase: [0-9]' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
   if [ -z "$PHASE_NUM" ]; then
     PHASE_NUM="?"
     PHASE_NAME=""
   else
     PHASE_NAME=$(grep -E "^### Phase ${PHASE_NUM}:" .planning/ROADMAP.md 2>/dev/null | head -1 | sed -E 's/^### Phase [^:]+: //' | sed -E 's/[[:space:]]*$//')
     [ -z "$PHASE_NAME" ] && PHASE_NAME="unknown"
   fi
   ```

2. **Determine stage from HANDOFF.md (D-27).** If the file is missing or has zero data rows, set `STAGE=init`. Otherwise, extract the `To` column from the last data row:
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE="init"
     TS=""
   else
     STAGE=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
     case "$STAGE" in
       gsd-plan|superpowers|review|hookify) ;;
       *) echo "Unknown stage '${STAGE}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
     esac
   fi
   ```

3. **Compute last handoff timestamp.**
   ```bash
   if [ -z "$TS" ]; then
     LAST_TS="(none)"
   else
     LAST_TS="$TS"
   fi
   ```

4. **Compute next-phase number for the hookify branch (D-28).** Only required when `STAGE == hookify`. Increment the integer phase by 1 and check whether `.planning/ROADMAP.md` contains a heading for that phase:
   ```bash
   if [ "$STAGE" = "hookify" ]; then
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

5. **Map stage to next command (D-28).** Apply the mapping table:
   ```bash
   case "$STAGE" in
     init)        NEXT_CMD="/super-gsd:sg-plan $PHASE_NUM" ;;
     gsd-plan)    NEXT_CMD="/super-gsd:sg-execute" ;;
     superpowers) NEXT_CMD="/super-gsd:sg-learn" ;;
     review)      NEXT_CMD="/super-gsd:sg-learn" ;;
     hookify)
       if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
         NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="/super-gsd:sg-complete"
       fi
       ;;
     *) NEXT_CMD="(unknown stage: $STAGE)" ;;
   esac
   ```

6. **Print output (D-29).** Emit exactly the following five lines (three header lines, one blank line, and the `Next:` line) and a single trailing newline. No additional output is permitted:
   ```
   Phase: <PHASE_NUM> (<PHASE_NAME>)
   Stage: <STAGE>
   Last handoff: <LAST_TS>

   Next: <NEXT_CMD>
   ```
</process>

<success_criteria>
1. The output is exactly five lines: three non-empty header lines, one blank line, and one non-empty `Next:` line — no extra lines or trailing output.
2. When `.planning/HANDOFF.md` contains only the header and separator rows (no data rows), `Stage` is `init` and `Last handoff:` is `(none)`.
3. The `Next:` command matches the D-28 mapping for the detected stage, including the `hookify` branch that picks `/gsd:discuss-phase <next>` when a following phase exists in `.planning/ROADMAP.md`, or `/gsd:complete-milestone` otherwise.
</success_criteria>
