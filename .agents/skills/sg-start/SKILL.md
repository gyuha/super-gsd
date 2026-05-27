---
name: sg-start
description: Detect existing session or start new project — super-gsd workflow entry point
argument-hint: "[project-name] - Only used when starting a new project. Passed to gsd-new-project when no existing session is found."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Detect existing session via STATE.md + HANDOFF.md. If detected, show 5-line summary (Milestone / Phase / Stage / Last activity / Next) and ask user (Resume / Start new milestone / Cancel) via numbered text list. If no STATE.md, delegate to gsd-new-project Skill or run prose fallback.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration not available: Claude Code exclusive tool
- SubagentStop not supported: no automatic trigger on stage completion
- AskUserQuestion not supported: output choices as text and accept free-form input
</constraints>

<execution_context>
Reads .planning/STATE.md, .planning/HANDOFF.md, .planning/ROADMAP.md. Writes nothing. Delegates to gsd-new-milestone or gsd-new-project depending on user choice / detection result.
</execution_context>

<process>
1. **STATE.md Phase parsing.**

   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start replicates this block) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

   D-01 trigger determination:
   ```bash
   if [ ! -f .planning/STATE.md ] || [ "$PHASE_LINE" = "(none)" ]; then
     EXISTING_SESSION=0
   else
     EXISTING_SESSION=1
   fi
   ```

   If `EXISTING_SESSION=0`, jump to Step 6 fallback.

2. **Parse additional STATE.md frontmatter + parse last HANDOFF.md row.**

   Execute only when `EXISTING_SESSION=1`.

   ```bash
   MILESTONE=$(grep -E '^milestone:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   MILESTONE_NAME=$(grep -E '^milestone_name:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone_name:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_UPDATED=$(grep -E '^last_updated:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_updated:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_ACTIVITY=$(grep -E '^last_activity:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_activity:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   ```

   Milestone display assembly:
   ```bash
   if [ -n "$MILESTONE" ] && [ -n "$MILESTONE_NAME" ]; then
     MILESTONE_DISPLAY="${MILESTONE} ${MILESTONE_NAME}"
   elif [ -n "$MILESTONE" ]; then
     MILESTONE_DISPLAY="$MILESTONE"
   else
     MILESTONE_DISPLAY="(unknown)"
   fi
   ```

   Last HANDOFF.md data row + Stage mapping:
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
   fi

   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="execute" ;;
     review)       STAGE_DISPLAY="review" ;;
     hookify)      STAGE_DISPLAY="hookify" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
     *)            STAGE_DISPLAY="$STAGE_RAW" ;;
   esac
   ```

3. **Determine last activity timestamp (absolute time only — relative time prohibited).**
   ```bash
   if [ -n "$TS" ]; then
     LAST_ACTIVITY_DISPLAY="$TS"
   elif [ -n "$LAST_UPDATED" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_UPDATED"
   elif [ -n "$LAST_ACTIVITY" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_ACTIVITY"
   else
     LAST_ACTIVITY_DISPLAY="(unknown)"
   fi
   ```

4. **Compute NEXT_PHASE + Next command mapping.**

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
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
     review)      NEXT_CMD="/super-gsd:sg-learn" ;;
     hookify)     NEXT_CMD="/super-gsd:sg-ship" ;;
     ship)
       if [ "${NEXT_PHASE_EXISTS:-0}" = "1" ]; then
         NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="/super-gsd:sg-complete"
       fi
       ;;
     complete) NEXT_CMD="/super-gsd:sg-plan" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

5. **Emit 5 lines + text selection branch.**

   Output guidance header + 5 lines:
   ```
   Existing session detected.

   Milestone: <MILESTONE_DISPLAY>
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last activity: <LAST_ACTIVITY_DISPLAY>
   Next: <NEXT_CMD>
   ```

   Output text selection list (AskUserQuestion not supported):
   ```
   Select one of the following:
   1) Resume — Run the Next command directly
   2) Start new milestone — Start a new milestone
   3) Cancel — Exit without changes

   Enter a number or text.
   ```

   Response branch:
   - **"1" or "Resume"**: No additional output, exit. User runs the Next line command directly.
   - **"2" or "Start new milestone"**:
     ```
     Skill(skill="gsd-new-milestone", args="")
     ```
   - **"3" or "Cancel"**: Emit `Cancelled. No changes made.` and exit.

   All three branches access `.planning/HANDOFF.md` as read-only only.

6. **Fallback branch (`EXISTING_SESSION=0`).**

   Check GSD installation:
   ```bash
   if command -v gsd-sdk >/dev/null 2>&1 || ls ~/.claude/get-shit-done 2>/dev/null | grep -q .; then
     GSD_AVAILABLE=1
   else
     GSD_AVAILABLE=0
   fi
   ```

   With GSD:
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```

   Without GSD (prose fallback):
   ```
   [sg-start] GSD not found. Running manual project setup.

   New project initialization procedure:
   1. mkdir -p .planning/phases .planning/lessons
   2. Create .planning/STATE.md (Phase: 1, milestone: v1.0)
   3. Create .planning/ROADMAP.md (add Phase 1 section)
   4. Create .planning/REQUIREMENTS.md (requirements list)
   5. Run /super-gsd:sg-plan 1 to start planning the first phase
   ```
</process>

<success_criteria>
1. Read STATE.md/HANDOFF.md to detect existing session and emit 5 lines.
2. Output text selection list (1/2/3) and wait for user input. No AskUserQuestion call.
3. Resume → emit-only exit, Start new milestone → gsd-new-milestone Skill, Cancel → emit `Cancelled.`.
4. HANDOFF.md is accessed as read-only only.
5. When STATE.md is not detected, delegate to GSD or use prose fallback.
6. `/super-gsd:sg-*` slash commands are used in NEXT_CMD mapping.
</success_criteria>
