---
name: sg-start
description: Use this when starting or resuming work on a project — detects an existing session via STATE.md and prompts Resume, Start new milestone, or Cancel; falls back to gsd-new-project if no session exists.
argument-hint: "[project-name] - optional. Used only when no existing .planning/STATE.md is detected; passed through to gsd-new-project."
---

<objective>
Detect existing session via STATE.md + HANDOFF.md. If detected, show 5-line summary (Milestone / Phase / Stage / Last activity / Next) and ask user (Resume / Start new milestone / Cancel) via AskUserQuestion. If no STATE.md, delegate to gsd-new-project Skill as before (D-17 fallback). All branches access HANDOFF.md as read-only — append-only audit log invariant preserved (SESS-04).
</objective>

<execution_context>
Reads .planning/STATE.md, .planning/HANDOFF.md, .planning/ROADMAP.md (next-phase existence check). Writes nothing. Delegates to gsd-new-milestone or gsd-new-project Skill depending on user choice / detection result.
</execution_context>

<process>
1. **STATE.md Phase parsing (D-01, D-03; Phase 7 D-07 inline-replication lock).**

   Replicate the `skills/sg-status/SKILL.md` lines 17-21 block verbatim (if drift occurs, update both simultaneously):
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

   If `EXISTING_SESSION=0`, jump to the D-17 fallback in Step 6 (skip Steps 2-5).

2. **Parse additional STATE.md frontmatter + HANDOFF.md last row (D-04, D-06, D-07).**

   Execute only when `EXISTING_SESSION=1`.

   4 STATE.md frontmatter fields (line-by-line grep + sed; no external tools like yq — Phase 6 D-04 lock):
   ```bash
   MILESTONE=$(grep -E '^milestone:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   MILESTONE_NAME=$(grep -E '^milestone_name:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone_name:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_UPDATED=$(grep -E '^last_updated:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_updated:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_ACTIVITY=$(grep -E '^last_activity:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_activity:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   ```

   Milestone display assembly (D-07):
   ```bash
   if [ -n "$MILESTONE" ] && [ -n "$MILESTONE_NAME" ]; then
     MILESTONE_DISPLAY="${MILESTONE} ${MILESTONE_NAME}"
   elif [ -n "$MILESTONE" ]; then
     MILESTONE_DISPLAY="$MILESTONE"
   else
     MILESTONE_DISPLAY="(unknown)"
   fi
   ```

   HANDOFF.md last data row + Stage mapping — replicate the `skills/sg-status/SKILL.md` lines 26-48 block verbatim (if drift occurs, update both simultaneously):
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
       *) echo "[warn] Unknown stage '${STAGE_RAW}' in HANDOFF.md — treating as init" >&2
          STAGE_RAW="init" ;;
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

3. **Last activity time determination (D-06; absolute timestamp only).**
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
   Relative time conversion (e.g. `N days ago`/`N hr ago` format) is strictly prohibited — D-06 lock. Use the absolute timestamp as-is.

4. **NEXT_PHASE computation + Next command mapping (D-04 Next line; Phase 2 D-28 lock).**

   Replicate the `skills/sg-status/SKILL.md` lines 62-74 + lines 78-99 two blocks verbatim (if drift occurs, update both simultaneously):
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

5. **Emit 5-line summary + AskUserQuestion 3-option branch (D-04, D-05, D-10, D-12, D-13, D-14, D-15, D-16; SESS-02/03/04).**

   Output guidance header + 5 lines (one blank line between header and lines, no blank lines between the 5 lines):
   ```
   Existing session detected.

   Milestone: <MILESTONE_DISPLAY>
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last activity: <LAST_ACTIVITY_DISPLAY>
   Next: <NEXT_CMD>
   ```

   AskUserQuestion call (header `Session`, 3 options — D-12 label lock):
   ```
   AskUserQuestion(
     questions: [{
       question: "Existing session detected. What do you want to do?",
       header: "Session",
       multiSelect: false,
       options: [
         { label: "Resume", description: "Show next command and exit. You will run the next command yourself." },
         { label: "Start new milestone", description: "Delegate to gsd-new-milestone Skill." },
         { label: "Cancel", description: "Exit without changes." }
       ]
     }]
   )
   ```

   Response branches:
   - **Resume** (D-08, D-16): no additional output, exit. Automatic Skill invoke is strictly forbidden (D-09 hybrid handoff not applied — user runs the Next line command directly).
   - **Start new milestone** (D-14):
     ```
     Skill(skill="gsd-new-milestone", args="")
     ```
     args must be an **empty string** — using `$ARGUMENTS` is forbidden (D-14 lock).
   - **Cancel** (D-15): emit single line `Cancelled. No changes made.` and exit. Do not read or write any files.

   All three branches access `.planning/HANDOFF.md` as read-only (D-16; naturally satisfies SESS-04). Deleting, modifying, or appending to HANDOFF.md is strictly forbidden.

6. **D-17 fallback branch (`EXISTING_SESSION=0`).**

   When STATE.md is not detected or `^Phase:` line capture fails, call as-is (unchanged behavior):
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```
   `$ARGUMENTS` passthrough preserved (backward compatible). No additional output.
</process>

<success_criteria>
1. Read STATE.md/HANDOFF.md to detect an existing session, emit the 5 lines (Milestone / Phase / Stage / Last activity / Next), and display AskUserQuestion with 3 options (SESS-01, SESS-02).
2. When Resume is selected, exit emit-only with no additional Skill invoke; the user runs the Next line command directly (SESS-03; D-08, D-09).
3. When Start new milestone is selected, call `Skill(skill="gsd-new-milestone", args="")` (args empty string); when Cancel is selected, emit `Cancelled. No changes made.` single line and exit (D-14, D-15).
4. All three options access `.planning/HANDOFF.md` as read-only — no deletion, modification, or append (SESS-04; D-16).
5. When STATE.md is not detected or `^Phase:` line capture fails, call `Skill(skill="gsd-new-project", args="$ARGUMENTS")` unchanged (D-17 backward compatible).
</success_criteria>
