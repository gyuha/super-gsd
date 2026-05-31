---
name: sg-plan
description: Collect context then generate GSD phase plan — gsd-discuss-phase → gsd-plan-phase chain (falls back to prose if GSD not installed)
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Resolve the target phase, inject prior lessons, then execute a 2-step chain: gsd-discuss-phase (context gathering) → gsd-plan-phase (plan creation). When GSD is not installed, run manual planning prose fallback.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration unavailable: Claude Code-only tool
- SubagentStop not supported: no automatic trigger on stage completion
- AskUserQuestion not supported: required input must be passed via arguments
</constraints>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Checks GSD installation. Runs gsd-discuss-phase → gsd-plan-phase chain (GSD path) or manual planning (prose path).
</execution_context>

<process>
0. **Prior lessons injection.** If Markdown files exist under .planning/lessons/, output their contents first:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Prior Lessons (auto-injected) ==="
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
     echo "=== All Lessons ==="
     cat .planning/lessons/*.md
     echo "=== End of Lessons ==="
   fi
   ```
   If no files exist, skip silently.

1. **Resolve phase.**
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

1.2. **Ambiguity grilling (grill-me).** Before the Visual Companion check (Step 1.5) and gsd-discuss-phase, resolve planning ambiguities in the main context — one question at a time — until you and the user reach shared understanding. There is no cap on the number of questions. This runs in the main context, so the back-and-forth reaches the user directly.

   Apply these rules:

   1. **Codebase-first (GRILL-03).** Before asking the user anything, ask yourself whether the answer is discoverable in the codebase (file existence, current implementation, function signatures, config values, existing patterns). If so, resolve it yourself with Read/Bash/Grep — do NOT ask the user. Only ask the user about information that is NOT in the code: design intent, priorities, scope boundaries, UX preferences, trade-off calls.

   2. **One question at a time + recommended answer (GRILL-01, GRILL-02).** Ask exactly ONE question per turn, and always include your recommended answer. AskUserQuestion is unavailable on this platform, so use the prose number-choice fallback pattern (same mechanism as Step 1.5). Surface each question as:
      ```
      [sg-plan] Grilling question: <question>

      Recommended answer: <your recommended answer>
      Or type your own answer:
      ```
      Accept the user's typed answer and continue to the next question. Never batch multiple questions.

   3. **Design-tree traversal (GRILL-04).** Do not use a fixed question list. After each answer, choose as the next question the item that is most uncertain and most determines downstream decisions. Walk the design tree, resolving dependencies one branch at a time.

   4. **Termination gate — user-confirmed only (GRILL-05).** You may NOT end grilling on your own judgment alone. When you believe all ambiguities are resolved, print a numbered consensus summary (decisions + constraints) and ask whether anything remains, using the prose number-choice fallback:
      ```
      [sg-plan] Grilling complete — consensus summary:
      1. <decision 1>
      2. <decision 2>
      ...

      Is this everything? Let me know if there is anything else to cover.

      1. Confirm — proceed to gsd-discuss-phase
      2. More questions — keep grilling

      Enter your choice (1 or 2):
      ```
      Proceed to Step 1.5 only after the user enters "1" / "Confirm".

   5. **Language surfacing (D-07).** Surface questions, recommended answers, and the consensus summary in the user's input language. Keep machine tokens (command names like `/super-gsd:sg-plan`, file paths, enum values, phase slugs, version IDs) in English.

   Store the confirmed consensus summary as `GRILL_SUMMARY` (plain text) for inline injection into the gsd-discuss-phase Agent prompt in Step 2a.

1.5. **Visual Companion check.** Execute only when the Phase goal contains UI-related keywords:
   ```bash
   PHASE_SECTION_RAW=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
   UI_DETECTED=""
   if [ -n "$PHASE_SECTION" ] && echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
     UI_DETECTED="1"
   fi
   ```
   **If no UI keywords or PHASE_SECTION is empty**, skip this step silently and move to Step 2.

   **If UI keywords are detected**, output the following question and wait for user response (AskUserQuestion-unavailable platform fallback):
   ```
   [sg-plan] A UI-related phase has been detected. Would you like to proceed with Visual Companion design?

   1. Include Visual Companion — runs superpowers:brainstorming first.
   2. No UI — proceed with the existing flow.

   Enter your choice (1 or 2):
   ```

   If the user selects **"1" or "Include Visual Companion"**, run the brainstorming Agent and wait for completion.
   **Before calling Agent, replace `<PHASE_NUM>` and `<PHASE_SECTION>` with actual resolved values:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase <PHASE_NUM> UI design",
     prompt="Do NOT invoke writing-plans Skill after brainstorming completes. Your task is to run the superpowers brainstorming skill for Phase <PHASE_NUM> UI design. The project root is the current working directory. Phase context:\n\n<PHASE_SECTION>\n\nInvoke Skill(skill='superpowers:brainstorming', args='Proceed with UI design for Phase <PHASE_NUM>. Refer to the context above. Important: do not invoke the writing-plans Skill after brainstorming completes. Only conduct the brainstorming conversation and then exit.') and follow its instructions to completion.
Do NOT invoke writing-plans after brainstorming finishes.",
     subagent_type="general-purpose"
   )
   ```
   If Agent exits with error: output `[sg-plan] brainstorming failed, continuing with existing flow...` then move to Step 2 (no interruption).

   If the user selects **"2" or "No UI"**: output `[sg-plan] Proceeding without UI design.` then move to Step 2.

2. **Check GSD installation and branch path.**

   ```bash
   if command -v gsd-sdk >/dev/null 2>&1 || [ -d "$HOME/.claude/get-shit-done" ]; then
     GSD_AVAILABLE=1
   else
     GSD_AVAILABLE=0
   fi
   ```

   **With GSD (main path):**

   2a. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
       Run gsd-discuss-phase Agent (subagent):
       ```
       Agent(
         description="gsd-discuss-phase for Phase <PHASE_NUM>",
         prompt="Your task is to run the GSD discuss-phase workflow for phase <PHASE_NUM>. The project root is the current working directory; planning artifacts are under .planning/ relative to it. Invoke Skill(skill='gsd-discuss-phase', args='<PHASE_NUM>') and follow all its instructions to completion.",
         subagent_type="general-purpose"
       )
       ```
       **Inject the grilled consensus (GRILL-06).** When constructing the Agent prompt above, append the following paragraph to the end of the `prompt` string (replace `{GRILL_SUMMARY}` with the actual consensus text from Step 1.2): `The user and I have already grilled the ambiguities. Treat the following as locked context — do NOT re-ask: {GRILL_SUMMARY}`. If `GRILL_SUMMARY` is empty (no ambiguities surfaced), skip the injection. This passes the grill agreement inline; do NOT modify gsd-discuss-phase itself (Non-invasive).

   2b. Idempotent record of gsd-plan row in HANDOFF.md:
       ```bash
       HANDOFF_FILE=".planning/HANDOFF.md"
       if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
         mkdir -p "$(dirname "$HANDOFF_FILE")"
         printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
       fi
       PHASE_PAD_P=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
       PHASE_SLUG_P=$(ls -d .planning/phases/${PHASE_PAD_P}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
       [ -z "$PHASE_SLUG_P" ] && PHASE_SLUG_P="${PHASE_NUM:-unknown}"
       if ! grep -q "| ${PHASE_SLUG_P} |.*| gsd-plan |" "$HANDOFF_FILE" 2>/dev/null; then
         TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
         Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set PREV_STAGE to the extracted value (empty string if no data rows exist).
         [ -z "$PREV_STAGE" ] && PREV_STAGE="init"
         GIT_USER=$(git config user.name 2>/dev/null || echo "-")
         [ -z "$GIT_USER" ] && GIT_USER="-"
         echo "| $TS | $PHASE_SLUG_P | $PREV_STAGE | gsd-plan | - | $GIT_USER |" >> "$HANDOFF_FILE"
       fi
       ```

   2c. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
       Session control transfers to the skill:
       ```
       Skill(skill="gsd-plan-phase", args="<PHASE_NUM>")
       ```

   **Without GSD (prose fallback):**

   ```
   [sg-plan] GSD not found. Running manual planning mode.

   Phase <PHASE_NUM> planning steps:
   1. Read .planning/phases/NN-*/NN-CONTEXT.md if it exists
   2. Read .planning/ROADMAP.md Phase <PHASE_NUM> section (Goal, Success Criteria, Requirements)
   3. Read .planning/REQUIREMENTS.md for relevant requirement IDs
   4. Create .planning/phases/NN-{slug}/NN-01-PLAN.md with:
      - YAML frontmatter (phase, plan, type, wave, depends_on, files_modified)
      - <objective> block (goal + output artifacts)
      - <tasks> block (each task: <name>, <files>, <action>, <verify>, <done>)
      - <success_criteria> (maps to ROADMAP.md success criteria)
   5. Confirm the plan with the user before proceeding to /super-gsd:sg-execute
   ```

   Proceed to execute the above steps manually for phase `<PHASE_NUM>`.
</process>

<success_criteria>
1. If PHASE_NUM is empty, output an explicit error message and exit.
1.2a. Step 1.2 runs after phase resolution (Step 1) and before the Visual Companion check (Step 1.5): Claude grills the user in the main context, one question at a time with no cap, each question carrying a recommended answer, via the prose number-choice fallback.
1.2b. Codebase-answerable items are resolved by Claude via Read/Bash/Grep without asking the user; only non-code information is asked.
1.2c. Questions follow design-tree traversal (each answer determines the next question), not a fixed list.
1.2d. Claude does not end grilling unilaterally: it prints a numbered consensus summary plus an explicit "is this everything?" prompt and proceeds only after the user enters "1"/"Confirm".
1.2e. The confirmed consensus (GRILL_SUMMARY) is injected inline into the gsd-discuss-phase Agent prompt (Step 2a) as locked, do-not-re-ask context; gsd-discuss-phase itself is not modified.
2. With GSD, run the gsd-discuss-phase Agent → gsd-plan-phase Skill chain.
3. Without GSD, guide through the PLAN.md creation procedure via prose fallback and execute directly.
4. If prior lessons exist, they are output first in Step 0.
5. A gsd-plan row is recorded in HANDOFF.md (on the GSD path).
</success_criteria>
