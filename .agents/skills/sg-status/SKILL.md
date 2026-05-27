---
name: sg-status
description: Display current workflow stage, last handoff timestamp, and next recommended command
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Inspect the current super-gsd workflow state. Read .planning/HANDOFF.md to determine the current stage, .planning/STATE.md for the current phase line (single source of truth), and .planning/ROADMAP.md only to detect whether a following phase exists. Output exactly three header lines, a blank line, and one "Next:" line. Fully independent — no GSD delegation needed.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- No Superpowers integration: this skill runs fully standalone
- SubagentStop not supported: no impact since this skill only displays workflow state
- AskUserQuestion not supported: no impact since this skill only produces output
</constraints>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Writes nothing.
</execution_context>

<process>
1. **Read `Phase:` line verbatim from STATE.md.**

   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start replicates this block) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

2. **Determine stage from HANDOFF.md.**
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
     case "$STAGE_RAW" in
       gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|hookify|ship|complete|sg-next) ;;
       *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
     esac
     # sg-next is a meta-transition row; recover actual stage from FROM column ($4)
     if [ "$STAGE_RAW" = "sg-next" ]; then
       STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
       if [ "$STAGE_RAW" = "sg-next" ] || [ -z "$STAGE_RAW" ]; then
         SCAN_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
           | awk -F'|' 'BEGIN{last=""} {gsub(/ /,"",$5); if ($5 != "sg-next") last=$0} END{print last}')
         STAGE_RAW=$(echo "$SCAN_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
         TS=$(echo "$SCAN_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
         [ -z "$STAGE_RAW" ] && STAGE_RAW="init"
       fi
       # Re-validate after scan-back — corrupt HANDOFF.md data must not propagate
       case "$STAGE_RAW" in
         init|gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|hookify|ship|complete) ;;
         *) echo "Scan-back recovered unknown stage '${STAGE_RAW}' — defaulting to init." >&2; STAGE_RAW="init" ;;
       esac
     fi
   fi

   # Storage → Display enum mapping
   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     parallel)     STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="execute" ;;
     review)       STAGE_DISPLAY="review" ;;
     sg-retro)     STAGE_DISPLAY="hookify" ;;
     hookify)      STAGE_DISPLAY="hookify" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
     *)            STAGE_DISPLAY="$STAGE_RAW" ;;
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

4. **Compute next-phase number (for hookify/ship branches).**
   ```bash
   if [ "$STAGE_RAW" = "hookify" ] || [ "$STAGE_RAW" = "ship" ]; then
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

5. **Map stage to next command (`/super-gsd:sg-*` slash commands).**
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
     superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
     parallel)    NEXT_CMD="/super-gsd:sg-review" ;;
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
     review)      NEXT_CMD="/super-gsd:sg-learn" ;;
     sg-retro)    NEXT_CMD="/super-gsd:sg-ship" ;;
     hookify)     NEXT_CMD="/super-gsd:sg-ship" ;;
     ship)
       if [ "${NEXT_PHASE_EXISTS:-0}" = "1" ]; then
         NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="/super-gsd:sg-complete"
       fi
       ;;
     complete) NEXT_CMD="/super-gsd:sg-new" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

   Note: `execute` stage (Codex direct execution mode) routes to `/super-gsd:sg-review`.

6. **Print output.**

   Output exactly 5 lines and exit. No additional output:
   ```
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last handoff: <LAST_TS>

   Next: <NEXT_CMD>
   ```
</process>

<success_criteria>
1. Output is exactly 5 lines: 3 header lines + 1 blank line + 1 Next line.
2. If HANDOFF.md has no data rows, Stage=init and Last handoff=(none).
3. `/super-gsd:sg-*` slash commands are used in the NEXT_CMD mapping.
4. `execute` stage routes to `/super-gsd:sg-review`.
5. STATE.md Phase parsing block is preserved (grep-sed-awk pipeline).
6. Fully standalone regardless of whether GSD is installed.
</success_criteria>
