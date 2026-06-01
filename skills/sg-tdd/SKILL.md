---
name: sg-tdd
description: Use this when execute is complete and TDD verification is required — invokes superpowers:test-driven-development and appends a tdd stage row to HANDOFF.md.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
When tdd_mode is enabled, verify that the current phase implementation complies with TDD discipline by invoking the Superpowers test-driven-development skill, then record a tdd stage row in HANDOFF.md. Per the Non-invasive constraint, no Superpowers or GSD internal files are modified.
</objective>

<execution_context>
This command is self-contained — no external workflow files imported. Reads .planning/config.json, .planning/STATE.md, .planning/ROADMAP.md, .planning/HANDOFF.md.
</execution_context>

<process>
1. **Check tdd_mode flag (D-02, per D-03).**
   Read tdd_mode from config.json. macOS compatible — no jq or python3:
   ```bash
   TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
   if [ "$TDD_MODE" != "true" ]; then
     echo "tdd_mode is not enabled. To activate: set super_gsd.tdd_mode: true in .planning/config.json. Recommended: re-run sg-execute first."
   fi
   ```
   Continue regardless — tdd_mode=false does not block execution (per D-02).

2. **Resolve phase.**
   If $ARGUMENTS is non-empty, set PHASE_NUM=$ARGUMENTS. Otherwise read .planning/STATE.md and extract the Phase: value from the YAML frontmatter.
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-tdd <phase>"
     exit 1
   fi
   ```

3. **Locate phase directory.**
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   if [ -z "$PHASE_DIR" ]; then
     echo "No phase directory matches '${PHASE_NUM}' under .planning/phases/. Run /super-gsd:sg-plan first."
     exit 1
   fi
   ```

4. **Read phase metadata.**
   Read .planning/ROADMAP.md and extract PHASE_NAME, GOAL, and SC_TEXT from the `### Phase PHASE_NUM:` section.
   ```
   Read .planning/ROADMAP.md, then:
   - Find the ### Phase <PHASE_NUM>: section header (try both unpadded and zero-padded two-digit PHASE_PAD forms); extract PHASE_NAME (text after "Phase N: " on that line).
   - Extract the **Goal**: line value immediately following the header. Set GOAL.
   - Extract numbered items under **Success Criteria** until the next ** section. Set SC_TEXT.
   If no matching header is found, print: "No '### Phase <PHASE_NUM>:' header found in .planning/ROADMAP.md. Aborting." and exit.
   ```

5. **Initialize HANDOFF.md if missing.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

6. **Append tdd row to HANDOFF.md (before Skill() call).**
   Read the To value from the last row of HANDOFF.md (the previous stage's destination becomes this row's From) to avoid hardcoding "execute" (prevents corrupt From=tdd on retry).
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_SLUG=$(basename "$PHASE_DIR")
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -n "$LAST_ROW" ]; then
     FROM_STAGE=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
   fi
   [ -z "$FROM_STAGE" ] && FROM_STAGE="execute"
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | tdd | - | $GIT_USER |" >> .planning/HANDOFF.md
   ```

7. **Build context blob, emit completion signal, invoke Skill() (D-06, D-07).**
   Assemble the context blob to pass to Superpowers:
   ```
   # TDD Verification — Phase <N> (<PHASE_NAME>)

   ## Goal
   <GOAL>

   ## Success Criteria
   <SC_TEXT>

   ## Instruction
   Verify TDD compliance for the implementation above using superpowers:test-driven-development.
   Check that: (1) tests were written before or alongside implementation, (2) all tests pass, (3) no production code exists without a corresponding test.
   If TDD verification finds issues, surface them and ask the user: proceed to sg-review or retry.
   ```

   After printing the context blob, emit the exact completion signal string (D-06):
   ```bash
   echo "TDD verification complete"
   ```

   Then invoke Skill() — no code runs after this point (Terminal Skill pattern):
   ```
   Skill(skill="superpowers:test-driven-development", args="<the context blob above>")
   ```

   Failure handling (D-01) — handled inside sg-tdd after Superpowers reports issues:
   If a failure signal is detected after the Superpowers skill completes, present a soft warning via AskUserQuestion:
   ```
   AskUserQuestion(
     questions: [{
       question: "TDD verification found issues. How do you want to proceed?",
       header: "sg-tdd",
       multiSelect: false,
       options: [
         { label: "Proceed to sg-review", description: "Continues to /super-gsd:sg-review." },
         { label: "Retry TDD verification", description: "Re-runs superpowers:test-driven-development." }
       ]
     }]
   )
   ```
</process>

<success_criteria>
1. When called with tdd_mode: false or unset, prints a warning and continues without blocking.
2. When called with tdd_mode: true, invokes the Superpowers test-driven-development skill exactly once.
3. A tdd stage row is appended to HANDOFF.md before Skill() is called (From=dynamic, To=tdd, Plan Hash=-).
4. The exact string "TDD verification complete" is printed immediately before the Skill() call.
5. On TDD verification failure, provides a soft warning via AskUserQuestion with proceed/retry options.
</success_criteria>
