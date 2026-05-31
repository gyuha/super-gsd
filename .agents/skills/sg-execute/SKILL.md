---
name: sg-execute
description: Read PLAN.md and execute phase tasks sequentially — direct implementation mode without Superpowers
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Package the current phase's PLAN.md, extract goal and success criteria, then directly execute each task in order. Superpowers:executing-plans is not available on this platform — all implementation is done inline.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration unavailable: superpowers:executing-plans skill cannot be used. Runs in direct implementation mode.
- SubagentStop not supported: no automatic trigger on stage completion. Run $sg-review manually after completion.
- AskUserQuestion not supported
</constraints>

<execution_context>
Reads .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, .planning/phases/<phase>/*-PLAN.md, .planning/HANDOFF.md. Executes plan tasks directly.
</execution_context>

<process>
0. **Lessons reminder.** If files exist in .planning/lessons/, output a weighted top-N one-line summary:
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
     echo "========================================"
   fi
   ```

1. **Resolve phase.**
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>"
     exit 1
   fi
   ```

1.5. **Branch detection (TEAM-03) — BLOCKING on main/master.** Check if current git branch is main or master; if so, STOP and require the user to opt in explicitly. (AskUserQuestion not supported on this platform — the platform fallback is to halt and require a re-run, not advisory pass-through.)

   First, compute PHASE_PAD:
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   ```

   Read `.planning/ROADMAP.md` using the Read tool, then find the `### Phase <PHASE_NUM>:` header (try both unpadded and zero-padded forms). Extract the phase name text after "Phase N: " on that line. Normalize it to lowercase with hyphens (replace spaces with `-`, remove non-alphanumeric except hyphens, collapse consecutive hyphens). Set `BRANCH_SLUG` to the result.
   Set `BRANCH_NAME="phase/${PHASE_PAD}-${BRANCH_SLUG}"`.

   ```bash
   CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
   ```

   If `CURRENT_BRANCH` is `main` or `master` AND `$SG_ALLOW_MAIN` is not set:
   - Print a clear blocking message (prose in user's language; commands verbatim in English):
     ```
     ⚠️  BLOCKED: sg-execute refuses to run Phase $PHASE_NUM on `$CURRENT_BRANCH`.

     Phase work must run on a feature branch to protect the integration branch.

     Choose one:
     (1) Create a phase branch and re-run:
         git checkout -b $BRANCH_NAME
         $sg-execute $PHASE_NUM
     (2) Continue on $CURRENT_BRANCH anyway (override):
         SG_ALLOW_MAIN=1 $sg-execute $PHASE_NUM
     ```
   - Exit immediately (do not continue to Step 2). Do not write a HANDOFF row.

   If `CURRENT_BRANCH` is `main`/`master` AND `$SG_ALLOW_MAIN` is set: print a one-line acknowledgement `[sg-execute] SG_ALLOW_MAIN=1 — continuing on $CURRENT_BRANCH (override)` and proceed to Step 2.

   If `CURRENT_BRANCH` is anything other than `main`/`master` (including `"unknown"`): skip this step entirely and proceed to Step 2.

2. **Locate phase directory.**
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

3. **Extract phase meta from ROADMAP.md.**
   Read .planning/ROADMAP.md, then find the ### Phase {PHASE_NUM}: section (try both unpadded and zero-padded two-digit PHASE_PAD forms). Extract: PHASE_NAME (text after "Phase N: " on the header line), GOAL (value of the **Goal**: line), REQ_IDS (value of the **Requirements**: line as space-separated list after stripping commas and spaces), SC_TEXT (numbered items under the **Success Criteria** section until the next ** section).

4. **Map REQ-IDs to definitions.**
   ```bash
   for REQ in $REQ_IDS; do
     grep -E "\*\*${REQ}\*\*:" .planning/REQUIREMENTS.md | head -1
   done
   ```

5. **Collect PLAN.md bodies.**
   Read every `*-PLAN.md` file in `$PHASE_DIR` (sorted numerically) using the Read tool.

6. **Compute Plan Hash.**
   ```bash
   PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
   [ -z "$PLAN_HASH" ] && PLAN_HASH="nodata"
   ```

7. **Idempotency check.**
   ```bash
   EXISTING_HASH=$(grep -E "^\| [^|]+ \| (${PHASE_PAD}|${PHASE_NUM})-[^|]* \| [^|]+ \|[[:space:]]*execute[[:space:]]*\|" .planning/HANDOFF.md 2>/dev/null | tail -1 | awk -F'|' '{gsub(/ /,"",$6); print $6}')
   # TDD retry-bypass (Phase 47, D-02): when a sg-review failure loop wrote
   # .planning/USE-TDD-RETRY, re-execution of the SAME plan hash is the intent —
   # so the same-hash short-circuit below must NOT fire. Absent the retry file,
   # this guard is a no-op and the idempotency behavior is byte-identical.
   RETRY_BYPASS=""
   if [ -f .planning/USE-TDD-RETRY ]; then
     RETRY_BYPASS=1
   fi
   if [ -z "$RETRY_BYPASS" ] && [ -n "$EXISTING_HASH" ] && [ "$EXISTING_HASH" = "$PLAN_HASH" ]; then
     echo "Already executed Phase $PHASE_NUM (plan hash matches: $PLAN_HASH). Skipping. Modify a PLAN.md to re-execute."
     exit 0
   fi
   ```

7.5. **HANDOFF.md auto-initialization.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

9. **Direct implementation mode execution.**

   **TDD marker detection (Phase 47, D-03 adapted — inline path; no Skill handoff exists here).** Detect the two markers before assembling the Direct Implementation Instructions (presence-only; paths hardcoded, never derived from `$ARGUMENTS`):
   ```bash
   if [ -f .planning/USE-TDD ]; then TDD_ON=true; else TDD_ON=false; fi
   # USE-TDD-RETRY carries prior FAIL feedback (line 1 = retry count, lines 2+ = feedback body).
   if [ -f .planning/USE-TDD-RETRY ]; then
     RETRY_FEEDBACK=$(tail -n +2 .planning/USE-TDD-RETRY 2>/dev/null)
   else
     RETRY_FEEDBACK=""
   fi
   ```

   Display the collected PLAN.md content, then execute each task sequentially according to the instructions below:

   ```
   ## Direct Implementation Instructions

   Starting execution of Phase <PHASE_NUM> (<PHASE_NAME>).
   Goal: <GOAL>

   Success Criteria:
   <SC_TEXT>

   --- Execution order ---
   Execute each task from PLAN.md sequentially in wave order:

   1. Create or modify the files specified in each task's <files>
   2. Implement following the instructions in <action>
   3. Run the automated commands in <verify> to validate
   4. Confirm the completion conditions in <done> are satisfied
   5. Re-verify success criteria after all tasks complete

   checkpoint:human-verify tasks stop and request user confirmation.
   checkpoint:decision tasks output the choices as text and wait for input.
   ```

   **TDD-gated injection (D-03/D-02 adapted for the inline path; both additions are strictly conditional so the marker-absent instructions are unchanged, EXEC-02).** Since `superpowers:test-driven-development` is unavailable on this platform, reference the TDD discipline in prose rather than invoking the skill:

   - When the retry file is present — i.e. `[ -f .planning/USE-TDD-RETRY ]` — PREPEND a `## Previous Test Failures — Fix First` section (before the execution order) whose body is `$RETRY_FEEDBACK` (lines 2+ of `.planning/USE-TDD-RETRY`); the inline implementer must address these failures first. This renders ONLY inside the `[ -f .planning/USE-TDD-RETRY ]` branch:
     ```
     ## Previous Test Failures — Fix First
     <RETRY_FEEDBACK — the prior review's FAIL feedback, read from lines 2+ of .planning/USE-TDD-RETRY>
     ```

   - When TDD mode is on — i.e. `[ -f .planning/USE-TDD ]` — APPEND the following Red-first directive to the Direct Implementation Instructions. It renders ONLY inside the `[ -f .planning/USE-TDD ]` branch — never when the marker is absent:
     ```
     TDD mode (Red-first): for each behavior, write a failing (red) test BEFORE implementing it, then make the test pass. Do not write implementation code before its failing test exists.
     ```

   When `.planning/USE-TDD` is absent AND `.planning/USE-TDD-RETRY` is absent, neither addition is emitted and the instructions are unchanged (EXEC-02 / D-03b).

   After all tasks complete:
   ```
   Phase <PHASE_NUM> execution complete. Next step: /super-gsd:sg-review
   ```

9.5. **HANDOFF.md row append — record only after all tasks are complete.**
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE (default "init" if empty).
   [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
   PHASE_SLUG=$(basename "$PHASE_DIR")
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | execute | $PLAN_HASH | $GIT_USER |" >> .planning/HANDOFF.md
   ```
</process>

<success_criteria>
1. No superpowers:executing-plans Skill invocation — all tasks are executed directly.
2. An `execute` row is recorded in HANDOFF.md.
3. On re-execution with the same plan hash, outputs an idempotency message and exits.
4. The Platform Constraints block explicitly states Superpowers integration is unavailable.
5. After all tasks complete, guides user to run `$sg-review` manually.
6. On `main`/`master` branch, Step 1.5 BLOCKS execution (no HANDOFF write, no Step 2) and prints both (1) the `git checkout -b <BRANCH_NAME>` + re-run command and (2) the `SG_ALLOW_MAIN=1 $sg-execute <N>` override. Continues only when `SG_ALLOW_MAIN` is set or current branch is not main/master.
</success_criteria>
