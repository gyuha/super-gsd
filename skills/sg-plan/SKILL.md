---
name: sg-plan
description: Use this when a new phase needs to be planned — injects prior lessons, then chains gsd-discuss-phase and gsd-plan-phase automatically.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Resolve the target phase, then execute a 2-step chain: spawn a subagent to run gsd-discuss-phase and wait for it to complete, then invoke gsd-plan-phase via Skill as the terminal action. Print progress messages before each step.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Runs gsd-discuss-phase in a subagent (Agent), then delegates to gsd-plan-phase via Skill (terminal).
</execution_context>

<process>
0. **Prior lessons injection.** If Markdown files exist under .planning/lessons/, display the weighted top-N first then print all lessons (lessons cover the entire project scope and are not limited to a specific phase):
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Weighted Top-N Patterns ==="
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}
     });
   })' || echo "(weighted ranking unavailable)"
     echo "=== All Lessons (below) ==="
     cat .planning/lessons/*.md
     echo "=== End of Lessons ==="
   fi
   ```
   If no files exist, skip this step silently.

1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>"
     exit 1
   fi
   ```
   If `PHASE_NUM` is empty after running this block, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>` and stop execution. Do not proceed to Step 2.

2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`

2.1. **Phase directory pre-create.** Before running discuss-phase, pre-create the Phase directory with a temporary slug if it does not exist. Skip if already present:
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   if ! ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | grep -q .; then
     mkdir -p ".planning/phases/${PHASE_PAD}-new-phase"
     echo "[sg-plan] Pre-created .planning/phases/${PHASE_PAD}-new-phase for discuss-phase output"
   fi
   ```

   Spawn a subagent to run gsd-discuss-phase and wait for it to complete.
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` in the block below with the actual resolved value** (e.g. `6`):
   ```
   Agent(
     description="gsd-discuss-phase for Phase $PHASE_NUM",  # replace $PHASE_NUM
     prompt="Your task is to run the GSD discuss-phase workflow for phase $PHASE_NUM. The project root is the current working directory; planning artifacts are under .planning/ relative to it. The exact skill name is 'gsd-discuss-phase' (no namespace prefix). Invoke Skill(skill='gsd-discuss-phase', args='$PHASE_NUM') and follow all its instructions to completion.",  # replace $PHASE_NUM twice
     subagent_type="general-purpose"
   )
   ```
   Wait for the agent to complete before proceeding. If the agent exits with an error, print: `[sg-plan] gsd-discuss-phase failed. Aborting.` and stop execution. Do not proceed to Step 2.2.

2.2. **Validate discuss-phase output location.** Confirm that discuss-phase wrote CONTEXT.md to the correct Phase directory. The `-new-phase` placeholder is not accepted as a "correct" location:
   ```bash
   # Exclude -new-phase placeholder, check only real directories
   CONTEXT_OK=$(ls .planning/phases/${PHASE_PAD}-*/${PHASE_PAD}-CONTEXT.md 2>/dev/null \
     | grep -v "\-new-phase/" | head -1)
   if [ -z "$CONTEXT_OK" ]; then
     MISPLACED=$(ls .planning/phases/*/${PHASE_PAD}-CONTEXT.md 2>/dev/null | grep -v "/${PHASE_PAD}-" | head -1)
     if [ -n "$MISPLACED" ]; then
       WRONG_DIR=$(dirname "$MISPLACED")
       # Prefer real slug directory over -new-phase placeholder
       CORRECT_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null \
         | grep -v "\-new-phase$" | head -1)
       [ -z "$CORRECT_DIR" ] && CORRECT_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
       echo "[sg-plan] WARNING: discuss-phase wrote CONTEXT.md to wrong directory: $WRONG_DIR"
       echo "[sg-plan] Moving to $CORRECT_DIR ..."
       mv "$MISPLACED" "$CORRECT_DIR/"
       # Delete -new-phase placeholder if empty
       rmdir ".planning/phases/${PHASE_PAD}-new-phase" 2>/dev/null || true
       echo "[sg-plan] Move complete."
     else
       echo "[sg-plan] WARNING: ${PHASE_PAD}-CONTEXT.md not found in any phase directory."
       echo "[sg-plan] discuss-phase may have written to an unexpected location. Check .planning/phases/."
     fi
   fi
   ```

2.5. **Idempotent gsd-plan row recording in HANDOFF.md.** gsd-plan-phase is a terminal Skill so control does not return. The moment immediately before invocation is the last possible point to record. Skip if a gsd-plan row for the same phase already exists:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   PHASE_PAD_P=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG_P=$(ls -d .planning/phases/${PHASE_PAD_P}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_P" ] && PHASE_SLUG_P="${PHASE_NUM:-unknown}"
   if [ -n "$PHASE_SLUG_P" ] && ! grep -q "| ${PHASE_SLUG_P} |.*| gsd-plan |" "$HANDOFF_FILE" 2>/dev/null; then
     TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
     Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row that starts with "| " followed by a 4-digit year. Set PREV_STAGE to the extracted value (empty string if no data rows exist).
     [ -z "$PREV_STAGE" ] && PREV_STAGE="init"
     echo "| $TS | $PHASE_SLUG_P | $PREV_STAGE | gsd-plan | - |" >> "$HANDOFF_FILE"
   fi
   ```

3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
   **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `6`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-plan-phase", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
0. If files exist in .planning/lessons/, Step 0 displays the weighted top-N first and prints all lessons in the order "=== Weighted Top-N Patterns ===" → ranked list → "=== All Lessons (below) ===" → cat content → "=== End of Lessons ===". If no files exist, Step 0 is skipped silently.
1. If PHASE_NUM is empty, print an explicit error message and exit.
2. Step 2.1 creates the `${PHASE_PAD}-new-phase` placeholder when no Phase ${PHASE_PAD}-* directory exists. Skip if already present.
3. gsd-discuss-phase is executed in a subagent via Agent(), and control returns after completion.
4. Step 2.2 validates the location of `${PHASE_PAD}-CONTEXT.md`. If found in the `-new-phase` placeholder or a wrong directory, it is automatically moved to the real `${PHASE_PAD}-*` directory and the empty placeholder is deleted.
5. If the gsd-discuss-phase Agent exits with an error, print an error message and do not execute Step 2.2 or gsd-plan-phase.
6. Immediately before the gsd-plan-phase Skill is invoked, a To=gsd-plan row is recorded in HANDOFF.md (skip if the same phase+gsd-plan combination already exists).
7. gsd-plan-phase Skill is invoked exactly once with the resolved phase number as the terminal action.
8. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective invocation.
</success_criteria>
