---
name: sg-ui-plan
description: Use this when UI design brainstorming is needed before planning a phase — reads phase context from ROADMAP.md and runs superpowers:brainstorming.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Read the target phase section from ROADMAP.md and run the superpowers:brainstorming Agent to conduct a UI design session. After completion, record a To: ui-plan row in .planning/HANDOFF.md. This is the Visual Companion branch of sg-plan extracted as a standalone command; it terminates after brainstorming completes without invoking a separate plan-phase.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Reads .planning/ROADMAP.md for phase context. Appends to .planning/HANDOFF.md.
</execution_context>

<process>
1. **Phase resolve.** If $ARGUMENTS is provided, use it; otherwise extract from STATE.md:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "[sg-ui-plan] Error: Cannot determine PHASE_NUM. Pass it explicitly: /super-gsd:sg-ui-plan <phase>"
     exit 1
   fi
   ```

2. **Extract PHASE_SECTION.** Extract the phase section via gsd-sdk:
   ```bash
   PHASE_SECTION_RAW=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
   if [ -z "$PHASE_SECTION" ]; then
     echo "[sg-ui-plan] WARN: Phase $PHASE_NUM section not found in ROADMAP. Running brainstorming with empty context."
   fi
   ```

3. **Run brainstorming Agent.**
   ```
   echo "[sg-ui-plan] Starting UI design brainstorming for Phase $PHASE_NUM..."
   ```
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual resolved values. `$PHASE_SECTION` contains multi-line text — insert it as literal text in the prompt string:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
     prompt="Do NOT invoke writing-plans Skill after brainstorming completes. Your task is to run the superpowers brainstorming skill for Phase $PHASE_NUM UI design. The project root is the current working directory. Phase context:\n\n$PHASE_SECTION\n\nInvoke Skill(skill='superpowers:brainstorming', args='Proceeding with Phase $PHASE_NUM UI design. Refer to the above context. Important: do not invoke the writing-plans Skill after brainstorming completes. Only conduct the brainstorming conversation and then exit.') and follow its instructions to completion. Do NOT invoke writing-plans after brainstorming finishes.",
     subagent_type="general-purpose"
   )
   ```
   If the Agent exits with an error:
   ```
   echo "[sg-ui-plan] Brainstorming failed."
   exit 1
   ```
   Brainstorming is the core of this UI design command — abort on failure.

4. **HANDOFF.md append.** Run after brainstorming Agent completes:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
   if ! grep -q "| ${PHASE_SLUG} |.*| ui-plan |" "$HANDOFF_FILE" 2>/dev/null; then
     TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
     Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row that starts with "| " followed by a 4-digit year. Set FROM_STAGE to the extracted value.
     [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
     echo "| $TS | $PHASE_SLUG | $FROM_STAGE | ui-plan | - |" >> "$HANDOFF_FILE"
     echo "[sg-ui-plan] ui-plan recorded in HANDOFF.md."
   fi
   echo "[sg-ui-plan] UI design brainstorming complete. Next step: /super-gsd:sg-execute"
   ```
</process>

<success_criteria>
1. If PHASE_NUM is empty, print an explicit error message and exit.
2. On PHASE_SECTION extraction failure, print a warning and proceed with brainstorming using empty context.
3. The brainstorming Agent is executed and control moves to Step 4 after it completes.
4. On brainstorming Agent error, print an error message and abort (no HANDOFF recorded).
5. After brainstorming completes, a To=ui-plan row is recorded in HANDOFF.md (skip if the same phase+ui-plan combination already exists).
</success_criteria>
