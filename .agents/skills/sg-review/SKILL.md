---
name: sg-review
description: Directly perform code review on changed files — prose review mode without Superpowers
argument-hint: "[implementation description] - optional. Falls back to most recent commit message."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Perform a code review directly by reading changed files, checking against plan requirements and success criteria, then writing findings to a SUMMARY.md file. Superpowers:requesting-code-review is not available on this platform.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration unavailable: superpowers:requesting-code-review skill cannot be used. Runs in prose review mode.
- SubagentStop not supported: run $sg-retro manually after completion.
- AskUserQuestion not supported
</constraints>

<execution_context>
Self-contained. Reads git history to derive BASE_SHA and HEAD_SHA, reads changed files, reads PLAN.md for requirements, writes SUMMARY.md.
</execution_context>

<process>
1. **Derive git range.**
   ```bash
   HEAD_SHA=$(git rev-parse HEAD)
   BASE_OVERRIDE=""
   # If ARGUMENTS is a SHA or sha..sha range, use as base override
   if printf '%s' "${ARGUMENTS:-}" | grep -qE '^[0-9a-f]{7,40}\.\.[0-9a-f]{7,40}$'; then
     BASE_SHA=$(printf '%s' "$ARGUMENTS" | cut -d. -f1)
     HEAD_SHA=$(printf '%s' "$ARGUMENTS" | sed 's/.*\.\.//')
     BASE_OVERRIDE="$ARGUMENTS"
   elif printf '%s' "${ARGUMENTS:-}" | grep -qE '^[0-9a-f]{7,40}$'; then
     BASE_SHA=$(git rev-parse "$ARGUMENTS" 2>/dev/null)
     if [ -z "$BASE_SHA" ]; then
       echo "Error: '$ARGUMENTS' is not a valid SHA."
       exit 1
     fi
     BASE_OVERRIDE="$ARGUMENTS"
   else
     BASE_SHA=$(git merge-base HEAD main 2>/dev/null \
       || git merge-base HEAD master 2>/dev/null \
       || git rev-parse HEAD~1 2>/dev/null \
       || git rev-parse HEAD)
   fi
   if [ "$BASE_SHA" = "$HEAD_SHA" ]; then
     echo "Error: BASE_SHA == HEAD_SHA — no commits to review."
     echo "Options:"
     echo "  1. Pass an explicit base SHA: sg-review <base-sha>"
     echo "  2. Pass a range: sg-review <base-sha>..<head-sha>"
     echo "  3. Run from a feature branch after committing your changes."
     exit 1
   fi
   echo "Reviewing: $BASE_SHA..$HEAD_SHA"
   ```

2. **Determine description.**
   ```bash
   # If BASE_OVERRIDE is set, ARGUMENTS is a SHA so don't use as description
   if [ -n "$ARGUMENTS" ] && [ -z "$BASE_OVERRIDE" ]; then
     DESCRIPTION="$ARGUMENTS"
   else
     DESCRIPTION=$(git log --format=%s -1)
     DESCRIPTION="${DESCRIPTION:-(no commit message found)}"
   fi
   ```

3. **Read plan/requirements (best-effort).**
   ```bash
   Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   if [ -n "$PHASE_NUM" ]; then
     PHASE_PAD=$(printf "%02d" "$PHASE_NUM")
     PLAN_FILE=$(ls .planning/phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)
   else
     PLAN_FILE=""
   fi
   if [ -n "$PLAN_FILE" ]; then
     # Read the PLAN_FILE path, then extract the text content between <objective> and </objective> tags. Set PLAN_REQUIREMENTS.
   else
     PLAN_REQUIREMENTS="(no plan file found — review current HEAD changes)"
   fi
   ```

3.9. **Record review row in HANDOFF.md.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_PAD_R=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG_R=$(ls -d .planning/phases/${PHASE_PAD_R}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_R" ] && PHASE_SLUG_R="${PHASE_NUM:-unknown}"
   Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE_R (default "init" if empty).
   [ -z "$FROM_STAGE_R" ] && FROM_STAGE_R="init"
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   echo "| $TS | $PHASE_SLUG_R | $FROM_STAGE_R | review | - | $GIT_USER |" >> "$HANDOFF_FILE"
   ```

4. **Perform prose review directly.**

   ```
   ## Code Review Execution

   Review range: $BASE_SHA..$HEAD_SHA
   Implementation: $DESCRIPTION

   --- Review procedure ---
   ```

   Execute the following steps in order:

   a. Check changed file list with `git diff $BASE_SHA $HEAD_SHA --name-only`
   b. Open each changed file with the Read tool to inspect contents
   c. Perform review against the following criteria:
      - Whether specified requirements / success criteria are satisfied
      - Logic errors, missing edge cases
      - Consistency with existing code (naming conventions, style)
      - Security vulnerabilities (if any)
   d. Record review results in `.planning/phases/NN-*/NN-01-SUMMARY.md`:
      ```markdown
      # Phase N Review Summary

      ## What Was Implemented
      <DESCRIPTION>

      ## Git Range
      Base: <BASE_SHA>
      Head: <HEAD_SHA>

      ## Review Findings

      | severity | file | finding |
      |----------|------|---------|
      | high | path/to/file | description |
      | medium | path/to/file | description |
      | low | path/to/file | description |

      ## Verdict
      approved | approved-with-comments | revision-required

      ## Follow-up Actions
      - [ ] item
      ```
   e. After completion, output:
      ```
      Review complete. Result: <VERDICT>
      Next step: /super-gsd:sg-learn
      ```
</process>

<success_criteria>
1. No superpowers:requesting-code-review Skill invocation — all reviews are performed directly.
2. A `review` row is recorded in HANDOFF.md.
3. Changed files are read directly with the Read tool to perform the review.
4. Review results are recorded in SUMMARY.md.
5. After completion, guides user to run /super-gsd:sg-learn manually.
6. The Platform Constraints block explicitly states Superpowers integration is unavailable.
</success_criteria>
