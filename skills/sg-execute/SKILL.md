---
name: sg-execute
description: Use this when the phase plan is ready and implementation should begin — packages PLAN/REQ/SC and hands off to Superpowers via superpowers:executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Package the current phase's PLAN.md bodies, REQUIREMENTS.md REQ-ID mapping, and ROADMAP.md success criteria into a single Superpowers-ready prompt and auto-invoke the `superpowers:executing-plans` Skill with it. When PLAN.md files contain `wave:` fields forming 2+ independent groups, routes to `sg-parallel-execute` instead and records `To: parallel` in HANDOFF.md. Append a timestamped row to `.planning/HANDOFF.md` describing the handoff. The append is skipped when `(phase, to=superpowers or parallel)` was already handed off and the plan hash is unchanged, so re-running on an unchanged plan is idempotent.
</objective>

<execution_context>
This command is self-contained — no external workflow files imported. Reads .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, .planning/phases/<phase>/*-PLAN.md, .planning/HANDOFF.md.
</execution_context>

<process>
0. **Lessons reminder.** If files exist in .planning/lessons/, print a weighted top-N one-line summary:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Top Recurring Patterns (reminder) ==="
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
     echo "============================================"
   fi
   ```
   If no files exist, skip silently.

1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md` by grepping the `## Current Position` section for `Phase: <N>`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   ```
   If extraction fails (empty PHASE_NUM), print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>` and exit.
   Validate that PHASE_NUM is non-empty and a positive integer before proceeding:
   ```bash
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>"
     exit 1
   fi
   if ! echo "$PHASE_NUM" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
     echo "Invalid phase number: '$PHASE_NUM'. Must be a positive integer or decimal (e.g. 7 or 7.1)."
     exit 1
   fi
   ```

2. **Locate phase directory.** Glob `.planning/phases/<phase>-*` (with zero-padded two-digit prefix support). Example:
   ```bash
   if echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
     PHASE_PAD=$(printf "%02d" "$PHASE_NUM")
   else
     PHASE_PAD="$PHASE_NUM"
   fi
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     # Try unpadded match for decimal phases
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   ```
   If no directory matches, print: `No phase directory matches '<phase>' under .planning/phases/. Run /super-gsd:sg-plan first.` and exit.

3. **Extract phase meta.** From `.planning/ROADMAP.md`, grep:
   - `### Phase <N>: <Name>` header to get `PHASE_NAME`.
   - The `**Goal**:` line immediately following the header to get `GOAL`.
   - The numbered list under `**Success Criteria**` to get the SC items.
   - The `**Requirements**:` line to get the REQ-ID list.
   ```
   Read .planning/ROADMAP.md, then:
   - Find the `### Phase <PHASE_NUM>:` section header (try both unpadded `<PHASE_NUM>` and zero-padded two-digit `<PHASE_PAD>` forms); extract PHASE_NAME (text after "Phase N: " on that line).
   - Extract the **Goal**: line value immediately following the header. Set GOAL.
   - Extract the requirement IDs from the **Requirements**: line (comma-separated, strip parenthetical labels). Set REQ_IDS_CLEAN as a space-separated list.
   - Extract numbered items under **Success Criteria** until the next `**` section. Set SC_TEXT.
   If no matching header is found, print: `No '### Phase <PHASE_NUM>:' header found in .planning/ROADMAP.md. Aborting.` and exit.
   ```

4. **Map REQ-IDs to one-line definitions.** For each REQ-ID, grep `.planning/REQUIREMENTS.md` for the bullet starting with `**<REQ-ID>**:` and extract the one-line description:
   ```bash
   for REQ in $REQ_IDS_CLEAN; do
     grep -E "\*\*${REQ}\*\*:" .planning/REQUIREMENTS.md | head -1
   done
   ```

5. **Collect PLAN.md bodies.** Read every `*-PLAN.md` file in `$PHASE_DIR` (sorted numerically). Wrap each file body inside a fenced code block tagged ` ```markdown ` and prefix it with a `### <filename>` header.

6. **Compute Plan Hash.** Concatenate all `*-PLAN.md` bodies and compute the first 7 characters of the sha256 digest. Use `shasum -a 256` on macOS with a `sha256sum` fallback:
   ```bash
   PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
   if [ -z "$PLAN_HASH" ]; then
     PLAN_HASH="nodata"
   fi
   ```

7. **Idempotency check.** Inspect `.planning/HANDOFF.md` for the latest row whose `Phase` cell matches `$PHASE_NUM` and whose `To` cell equals `superpowers` or `parallel`. Extract the recorded Plan Hash and compare it to `$PLAN_HASH`:
   ```bash
   EXISTING_HASH=$(grep -E "^\| [^|]+ \| (${PHASE_PAD}|${PHASE_NUM})-[^|]* \| [^|]+ \|[[:space:]]*(superpowers|parallel)[[:space:]]*\|" .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$6); print $6}')
   if [ -n "$EXISTING_HASH" ] && [ "$EXISTING_HASH" = "$PLAN_HASH" ]; then
     echo "Already handed off Phase $PHASE_NUM to superpowers or parallel (plan hash matches: $PLAN_HASH). Skipping append. Use /super-gsd:sg-status to inspect, or modify a PLAN.md to re-handoff."
     exit 0
   fi
   ```
   If the Plan Hash differs from the recorded one, a new row is permitted (PLAN.md changed since the last handoff).

7.5. **HANDOFF.md auto-initialization.** Create the file if it is missing or has no header row:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

8. **Append HANDOFF.md row (variable computation).** HANDOFF_TO is determined after Step 8.5 completes, so only meta variables are computed in this step.
   Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE (default "init" if empty).
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_SLUG=$(basename "$PHASE_DIR")
   ```

8.5. **PLAN.md dependency analysis.** Parse wave/depends_on/files_modified from all PLAN.md files, compute independent parallel groups (PARALLEL_GROUPS), and save to a JSON file.

   ```bash
   PARALLEL_GROUPS=""
   GROUP_COUNT=0
   GROUPS_JSON_FILE="$PHASE_DIR/parallel_groups.json"

   # Check if wave field exists (proceed if at least one is found)
   HAS_WAVE=$(grep -rl '^wave:' "$PHASE_DIR"/*-PLAN.md 2>/dev/null | head -1)

   if [ -z "$HAS_WAVE" ]; then
     echo "[TE-05a] No wave field — keeping existing sequential execution path. Preserving v1.3 behavior."
   else
     # Extract wave number and files_modified from each PLAN.md
     # Result: "wave|planfile|file1,file2,..."
     PLAN_WAVE_FILES=""
     for PLAN_FILE in "$PHASE_DIR"/*-PLAN.md; do
       PLAN_BASE=$(basename "$PLAN_FILE")
       WAVE_NUM=$(grep -E '^wave:' "$PLAN_FILE" | head -1 | sed 's/wave:[[:space:]]*//')
       if [ -z "$WAVE_NUM" ]; then
         WAVE_NUM="99"
       fi
       # Parse files_modified block: "  - path/to/file" format (YAML list, frontmatter boundary guard)
       FILES_IN_PLAN=$(awk '/^---$/{if(front++>0) exit} /^files_modified:/{found=1; next} found && /^[[:space:]]*-[[:space:]]/{gsub(/^[[:space:]]*-[[:space:]]*/,""); printf "%s,", $0} found && /^[^[:space:]-]/{found=0}' "$PLAN_FILE" | sed 's/,$//')
       PLAN_WAVE_FILES="$PLAN_WAVE_FILES
   ${WAVE_NUM}|${PLAN_BASE}|${FILES_IN_PLAN}"
     done
     PLAN_WAVE_FILES=$(echo "$PLAN_WAVE_FILES" | grep -v '^$')

     # Wave value list (deduplicated, sorted)
     WAVE_NUMS=$(echo "$PLAN_WAVE_FILES" | awk -F'|' '{print $1}' | sort -n | uniq)

     # Collect plan list and files per wave
     # Plans with overlapping files_modified are force-merged into the same group
     GROUP_COUNT=0
     GROUPS_JSON="["
     FIRST_GROUP=1

     for W in $WAVE_NUMS; do
       # Plans in this wave
       WAVE_PLANS=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v w="$W" '$1==w {print $2}')
       WAVE_FILES=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v w="$W" '$1==w {print $3}')

       PLAN_COUNT=$(echo "$WAVE_PLANS" | grep -c '[^[:space:]]')

       ALL_FILES_RAW=$(echo "$WAVE_FILES" | tr ',' '\n' | grep -v '^$')
       DUP_FILES=$(echo "$ALL_FILES_RAW" | sort | uniq -d)

       if [ -n "$DUP_FILES" ] && [ "$PLAN_COUNT" -gt 1 ]; then
         MERGED_PLANS=""
         SOLO_PLANS=""
         while IFS= read -r pline; do
           FILES_OF=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v p="$pline" '$2==p {print $3}' | tr ',' '\n')
           HAS_DUP=""
           while IFS= read -r df; do
             if echo "$FILES_OF" | grep -qxF "$df"; then
               HAS_DUP=1
               break
             fi
           done <<DUPEOF
   $(echo "$DUP_FILES")
   DUPEOF
           if [ -n "$HAS_DUP" ]; then
             MERGED_PLANS="$MERGED_PLANS $pline"
           else
             SOLO_PLANS="$SOLO_PLANS $pline"
           fi
         done <<WAVEEOF
   $(echo "$WAVE_PLANS")
   WAVEEOF

         if [ -n "$MERGED_PLANS" ]; then
           PLANS_JSON=$(echo "$MERGED_PLANS" | tr ' ' '\n' | grep -v '^$' | awk '{printf "\"%s\",", $0}' | sed 's/,$//')
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[${PLANS_JSON}],\"merged\":true}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         fi
         for SP in $SOLO_PLANS; do
           [ -z "$SP" ] && continue
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[\"${SP}\"],\"merged\":false}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         done
       else
         while IFS= read -r pline; do
           [ -z "$pline" ] && continue
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[\"${pline}\"],\"merged\":false}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         done <<WAVEEOF
   $(echo "$WAVE_PLANS")
   WAVEEOF
       fi
     done

     GROUPS_JSON="$GROUPS_JSON]"

     if [ "$GROUP_COUNT" -lt 2 ]; then
       echo "No parallel groups detected — using existing sequential execution"
       rm -f "$GROUPS_JSON_FILE"
     else
       PARALLEL_GROUPS="$GROUPS_JSON"
       printf '%s\n' "$GROUPS_JSON" > "$GROUPS_JSON_FILE"
       echo "${GROUP_COUNT} parallel group(s) detected — parallel_groups.json saved"
     fi
   fi

   # Determine HANDOFF_TO and record HANDOFF.md
   if [ -n "$PARALLEL_GROUPS" ]; then
     HANDOFF_TO="parallel"
   else
     HANDOFF_TO="superpowers"
   fi
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | $HANDOFF_TO | $PLAN_HASH |" >> .planning/HANDOFF.md
   ```

9. **Build prompt and invoke Skill.**

   **Routing branch.** Check the `PARALLEL_GROUPS` variable computed in Step 8.5:
   - If `PARALLEL_GROUPS` is non-empty (2 or more independent groups): route to the `sg-parallel-execute` skill (implemented in Phase 18).
   - If `PARALLEL_GROUPS` is empty: use the existing sequential execution path (`superpowers:executing-plans`) unchanged.

   ```bash
   if [ -n "$PARALLEL_GROUPS" ]; then
     echo "=== Parallel execution path selected: ${GROUP_COUNT} group(s) detected ==="
     Skill(skill="sg-parallel-execute", args="$GROUPS_JSON_FILE")
     return
   fi
   ```

   Assemble a single markdown blob in this exact order (English labels only):
   ```
   # Superpowers Execution Handoff — Phase <N> (<PHASE_NAME>)

   ## Goal
   <GOAL>

   ## Success Criteria
   1. ...
   2. ...

   ## Requirements
   - <REQ-ID>: <one-line definition>
   ...

   ## Plans

   ### <plan-filename-1>
   ```markdown
   <full PLAN.md body>
   ```

   ### <plan-filename-2>
   ```markdown
   <full PLAN.md body>
   ```

   ## Instruction to Superpowers
   Execute the plans above using the superpowers:executing-plans skill. Treat each PLAN.md as the authoritative source of tasks and acceptance criteria.
   ```
   Display the prompt blob to the user. Then print exactly:
   `Handoff complete. HANDOFF.md updated; superpowers:executing-plans invoked. Use /super-gsd:sg-status to inspect workflow state.`
   Then invoke the Skill tool — no confirmation prompt. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="superpowers:executing-plans", args="<the prompt blob above>")
   ```
</process>

<success_criteria>
0. If files exist in .planning/lessons/, the Step 0 reminder is printed before Step 1 (phase resolve). If no files exist, Step 0 is skipped silently.
1. The prompt blob shown to the user contains the Phase number, Goal, Success Criteria list, all REQ-IDs with their one-line definitions, and the full body of every `*-PLAN.md` in the phase directory.
2. The `superpowers:executing-plans` Skill is invoked exactly once per run when PARALLEL_GROUPS is empty, zero times when the idempotency check short-circuits, or `sg-parallel-execute` is invoked instead when PARALLEL_GROUPS is non-empty (parallel path).
3. `.planning/HANDOFF.md` gains at most one new row per run, and that row matches the 5-column schema `| Timestamp | Phase | From | To | Plan Hash |`.
4. Re-running the command with an unchanged plan hash produces the `Already handed off ...` message and appends no row.
5. If sg-execute is re-run after a `complete` or `ship` stage has been recorded, the idempotency check (which only matches `superpowers` or `parallel` in the To column) will not short-circuit — a new handoff row will be appended. This is intentional: re-executing after milestone completion starts a new handoff cycle for that phase.
</success_criteria>
