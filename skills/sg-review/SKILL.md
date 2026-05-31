---
name: sg-review
description: Use this when implementation is complete and a code review is needed — derives the git range automatically and invokes superpowers:requesting-code-review.
argument-hint: "[description of what was implemented]"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Invoke the superpowers:requesting-code-review Skill with structured context: DESCRIPTION (from $ARGUMENTS or recent commit subject), BASE_SHA (merge-base with main), and HEAD_SHA (current HEAD). Ensures the Skill has enough context to dispatch a useful review subagent.
</objective>

<execution_context>
Self-contained. Reads git history to derive BASE_SHA and HEAD_SHA, then delegates to superpowers:requesting-code-review Skill.
</execution_context>

<process>
1. **Derive git range.**
   ```bash
   HEAD_SHA=$(git rev-parse HEAD)
   BASE_SHA=$(git merge-base HEAD main 2>/dev/null \
     || git merge-base HEAD master 2>/dev/null \
     || git rev-parse HEAD~1 2>/dev/null \
     || git rev-parse HEAD)
   echo "Initial range: $BASE_SHA..$HEAD_SHA"
   ```

1.5. **Auto-commit gate when BASE==HEAD + dirty working tree (Phase 42/43 retro P1 #2 closure).**

   When `BASE_SHA == HEAD_SHA` and the working tree has uncommitted phase implementation, offer to auto-commit before exiting with the original error. This closes the recurring manual-commit step that surfaced in Phase 42 and Phase 43 after sg-parallel-execute (which intentionally does not commit per D-10/D-16 staging).

   ```bash
   if [ "$BASE_SHA" = "$HEAD_SHA" ]; then
     WORKING_PORCELAIN=$(git status --porcelain 2>/dev/null)

     if [ -z "$WORKING_PORCELAIN" ]; then
       echo "Error: BASE_SHA == HEAD_SHA and working tree is clean — no commits to review."
       echo "Run from a feature branch that has diverged from main, or make new commits."
       exit 1
     fi

     # Identify current phase slug from HANDOFF.md last data row (Phase column)
     CURRENT_PHASE_SLUG=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
       | tail -1 | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/,"",$3); print $3}')
     PHASE_NUM_AUTO=$(printf '%s' "$CURRENT_PHASE_SLUG" | sed -E 's/^0*([0-9]+)-.*/\1/')
     PHASE_PAD_AUTO=$(printf "%02d" "$PHASE_NUM_AUTO" 2>/dev/null || echo "$PHASE_NUM_AUTO")

     # Candidate files: skills/, .agents/skills/, current phase SUMMARY + parallel_groups
     CANDIDATES=$(printf '%s\n' "$WORKING_PORCELAIN" \
       | awk '{sub(/^[^ ]+ +/, ""); print}' \
       | grep -E "^(skills/|\.agents/skills/|\.planning/phases/${PHASE_PAD_AUTO}-[^/]*/(.*SUMMARY|parallel_groups))" \
       || true)

     if [ -z "$CANDIDATES" ]; then
       echo "Error: BASE_SHA == HEAD_SHA — working tree has changes but none look like phase implementation."
       echo ""
       echo "Working tree state:"
       printf '%s\n' "$WORKING_PORCELAIN" | sed 's/^/  /'
       echo ""
       echo "Commit your changes manually before sg-review, or pass an explicit base SHA."
       exit 1
     fi

     echo ""
     echo "BASE_SHA == HEAD_SHA but working tree contains likely Phase ${PHASE_NUM_AUTO} implementation:"
     printf '%s\n' "$CANDIDATES" | sed 's/^/  /'
     echo ""
   fi
   ```

   If `CANDIDATES` is non-empty, invoke AskUserQuestion to confirm auto-commit:

   ```
   AskUserQuestion(
     questions: [{
       question: "Auto-commit these files with derived message before review? (Phase 42/43 retro P1 #2 closure)",
       header: "auto-commit",
       multiSelect: false,
       options: [
         { label: "Auto-commit and proceed (Recommended)", description: "Stage candidates and commit with derived feat(NN) message, then recompute BASE_SHA=HEAD~1 and proceed with review." },
         { label: "Cancel", description: "Exit with original BASE==HEAD error. Commit manually then re-run sg-review." }
       ]
     }]
   )
   ```

   If "Auto-commit and proceed" selected:

   ```bash
   # Stage candidates (one per line, preserve spaces in path)
   while IFS= read -r f; do
     [ -z "$f" ] && continue
     git add "$f"
   done <<EOF
   $CANDIDATES
   EOF

   # Derive commit subject from phase slug: "43-pick-display-polish" → "43" + "pick display polish"
   PHASE_SUBJECT_SLUG=$(printf '%s' "$CURRENT_PHASE_SLUG" | sed -E 's/^[0-9]+-//' | tr '-' ' ')
   COMMIT_MSG=$(printf 'feat(%s): %s\n\nAuto-committed by sg-review (Phase 42/43 retro P1 #2 closure).\nWorking tree contained uncommitted Phase %s implementation; sg-parallel-execute completed without commit per D-10/D-16 staging.\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>\n' "$PHASE_PAD_AUTO" "$PHASE_SUBJECT_SLUG" "$PHASE_NUM_AUTO")
   git commit -m "$COMMIT_MSG"

   # Recompute SHAs after auto-commit
   HEAD_SHA=$(git rev-parse HEAD)
   BASE_SHA=$(git rev-parse HEAD~1)
   echo "Auto-committed. New range: $BASE_SHA..$HEAD_SHA"
   ```

   If "Cancel" selected:

   ```bash
   echo "Cancelled. Commit your changes manually then re-run /super-gsd:sg-review."
   exit 1
   ```

   After this gate, control flow resumes with `BASE_SHA != HEAD_SHA` guaranteed.

   ```bash
   echo "Reviewing: $BASE_SHA..$HEAD_SHA"
   ```

2. **Determine description.** Use $ARGUMENTS as the description of what was implemented. If $ARGUMENTS is empty, fall back to the most recent commit subject (no SHA prefix):
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     DESCRIPTION="$ARGUMENTS"
   else
     DESCRIPTION=$(git log --format=%s -1)
     DESCRIPTION="${DESCRIPTION:-(no commit message found)}"
   fi
   ```

3. **Read plan/requirements (best-effort).** If a PLAN.md for the current phase exists, read its `<objective>` section as requirements context. Otherwise use a default string:
   ```bash
   Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM.
   if [ -n "$PHASE_NUM" ]; then
     PHASE_PAD=$(printf "%02d" "$PHASE_NUM")
   else
     PHASE_PAD=""
   fi
   if [ -n "$PHASE_PAD" ]; then
     PLAN_FILE=$(ls .planning/phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)
     PLAN_FILE=${PLAN_FILE:-$(ls .planning/milestones/v1.0-phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)}
   else
     PLAN_FILE=""
   fi
   if [ -n "$PLAN_FILE" ]; then
     Read the PLAN_FILE path, then extract the text content between <objective> and </objective> tags. Set PLAN_REQUIREMENTS.
   else
     PLAN_REQUIREMENTS="(no plan file found — review current HEAD changes)"
   fi
   ```

3.9. **Record review row in HANDOFF.md.** `superpowers:requesting-code-review` dispatches a Task subagent and then **returns control** to sg-review with the review result, so a post-review step (Step 5) runs after it. Record the review row here, immediately before invocation, so the audit log is written even if the post-review loop changes flow:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM_R.
   PHASE_PAD_R=$(printf "%02d" "${PHASE_NUM_R:-0}" 2>/dev/null || echo "${PHASE_NUM_R:-0}")
   PHASE_SLUG_R=$(ls -d .planning/phases/${PHASE_PAD_R}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_R" ] && PHASE_SLUG_R="${PHASE_NUM_R:-unknown}"
   Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE_R (default "init" if empty).
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   echo "| $TS | $PHASE_SLUG_R | $FROM_STAGE_R | review | - | $GIT_USER |" >> "$HANDOFF_FILE"
   ```

4. **Invoke Skill** with the structured context.
   **Before calling Skill, substitute the actual resolved values** for `$DESCRIPTION`, `$PLAN_REQUIREMENTS`, `$BASE_SHA`, and `$HEAD_SHA` captured in steps 1–3.

   **TDD verification injection (Phase 47, D-04).** Detect the marker (presence-only; path hardcoded, never from `$ARGUMENTS`):
   ```bash
   if [ -f .planning/USE-TDD ]; then TDD_ON=true; else TDD_ON=false; fi
   ```
   When `.planning/USE-TDD` is present, APPEND the following `## TDD Verification` section to the args blob below (rendered ONLY inside the `[ -f .planning/USE-TDD ]` branch — when the marker is absent the args blob is unchanged / non-invasive). PASS/FAIL judgment is delegated to the review subagent — no test-runner auto-detection (REVIEW-F1 is Future):
   ```
   ## TDD Verification
   TDD mode is ON. Verify whether the tests pass or fail and surface an explicit, unambiguous PASS/FAIL signal in your verdict (state "TESTS: PASS" or "TESTS: FAIL"). Judge from the diff and any test output available; do not assume.
   ```

   `superpowers:requesting-code-review` dispatches a Task subagent and **returns control** to sg-review with the review result — proceed to Step 5 after it:
   ```
   Skill(skill="superpowers:requesting-code-review", args="## What Was Implemented
$DESCRIPTION

## Requirements / Plan
$PLAN_REQUIREMENTS

## Git Range
Base: $BASE_SHA
Head: $HEAD_SHA")
   ```

5. **Post-review failure loop (Phase 47, D-05/D-06 — TDD-mode only).** This step runs ONLY when `.planning/USE-TDD` is present; when the marker is absent, sg-review ends after Step 4 exactly as before (non-invasive). After control returns from `superpowers:requesting-code-review` (Step 4), read its verdict and branch:

   ```bash
   if [ -f .planning/USE-TDD ]; then TDD_ON=true; else TDD_ON=false; fi
   ```

   When `TDD_ON` is false: stop here (legacy behavior, no loop).

   When `TDD_ON` is true, interpret the review subagent's PASS/FAIL signal (the `TESTS: PASS` / `TESTS: FAIL` directive injected in Step 4):

   - **Review PASS** (tests pass): reset the retry counter and finish.
     ```bash
     rm -f .planning/USE-TDD-RETRY
     ```

   - **Review FAIL** (tests fail): read the current retry count (line 1 of the retry file; default 0 when the file is absent — the serialization matches Plan 47-01: line 1 = count, lines 2+ = feedback body):
     ```bash
     if [ -f .planning/USE-TDD-RETRY ]; then
       RETRY_COUNT=$(head -1 .planning/USE-TDD-RETRY 2>/dev/null | tr -dc '0-9')
     fi
     [ -z "$RETRY_COUNT" ] && RETRY_COUNT=0
     ```

     - **If `RETRY_COUNT` < 2** — ask the user whether to re-run sg-execute to fix the failing tests (same form/tone as the Step 1.5 gate). Question/option prose in the user's input language; machine tokens (`sg-execute`, `USE-TDD-RETRY`, paths) verbatim English:
       ```
       AskUserQuestion(
         questions: [{
           question: "Tests FAILED in TDD mode (retry RETRY_COUNT/2). Re-run sg-execute to fix the failing tests?",
           header: "tdd-retry",
           multiSelect: false,
           options: [
             { label: "Re-run sg-execute (Recommended)", description: "Write the FAIL feedback to .planning/USE-TDD-RETRY (count+1) and re-invoke sg-execute, which injects the feedback as a fix-first section." },
             { label: "Stop", description: "Halt the loop. Fix manually, then re-run /super-gsd:sg-review when ready." }
           ]
         }]
       )
       ```
       - If **"Re-run sg-execute"** selected: write the incremented count on line 1 and the review's FAIL feedback as the body (lines 2+), then re-invoke sg-execute. The retry file is the handshake Plan 47-01's sg-execute reads (presence → idempotency bypass; lines 2+ → `## Previous Test Failures — Fix First`):
         ```bash
         NEW_COUNT=$((RETRY_COUNT + 1))
         { printf '%s\n' "$NEW_COUNT"; printf '%s\n' "$REVIEW_FAIL_FEEDBACK"; } > .planning/USE-TDD-RETRY
         ```
         `REVIEW_FAIL_FEEDBACK` is the failing-test summary from the review verdict. Then:
         ```
         Skill(skill="sg-execute", args="$PHASE_NUM")
         ```
       - If **"Stop"** selected: print a halt message (user's language) and exit without re-invoking. Leave `.planning/USE-TDD-RETRY` as-is so a later manual `/super-gsd:sg-review` can resume the count.

     - **If `RETRY_COUNT` == 2 (limit reached)** — do NOT ask. Report that the retry limit was exceeded (prose in user's language), reset the counter, and stop:
       ```bash
       echo "TDD retry limit (2) exceeded — stopping. Fix the failing tests manually, then re-run /super-gsd:sg-review."
       rm -f .planning/USE-TDD-RETRY
       ```

   Both the PASS path and the limit-exceeded path delete `.planning/USE-TDD-RETRY` (D-06) so a corrected restart begins with a clean counter.
</process>

<success_criteria>
1. superpowers:requesting-code-review Skill is invoked exactly once with a non-empty DESCRIPTION, a non-empty BASE_SHA, and a non-empty HEAD_SHA.
2. The git range reflects the current branch's changes since diverging from main.
3. When $ARGUMENTS is empty, DESCRIPTION falls back to the most recent git commit subject (no SHA prefix) rather than an empty string.
</success_criteria>
