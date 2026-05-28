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
   if [ "$BASE_SHA" = "$HEAD_SHA" ]; then
     echo "Error: BASE_SHA == HEAD_SHA — no commits to review."
     echo "Options:"
     echo "  1. Commit your changes first, then run /super-gsd:sg-review."
     echo "  2. Run from a feature branch that has diverged from main."
     exit 1
   fi
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

3.9. **Record review row in HANDOFF.md.** superpowers:requesting-code-review is a terminal Skill so the moment immediately before invocation is the last possible point to record:
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
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="superpowers:requesting-code-review", args="## What Was Implemented
$DESCRIPTION

## Requirements / Plan
$PLAN_REQUIREMENTS

## Git Range
Base: $BASE_SHA
Head: $HEAD_SHA")
   ```
</process>

<success_criteria>
1. superpowers:requesting-code-review Skill is invoked exactly once with a non-empty DESCRIPTION, a non-empty BASE_SHA, and a non-empty HEAD_SHA.
2. The git range reflects the current branch's changes since diverging from main.
3. When $ARGUMENTS is empty, DESCRIPTION falls back to the most recent git commit subject (no SHA prefix) rather than an empty string.
</success_criteria>
