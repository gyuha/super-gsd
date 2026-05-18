---
name: sg-review
description: Request a code review via Superpowers — derives git range, collects description, then invokes superpowers:requesting-code-review Skill.
argument-hint: "[description of what was implemented]"
---

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
     echo "Warning: BASE_SHA == HEAD_SHA — only one commit exists or there is no divergence from main. The diff will be empty."
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
   PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
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
     PLAN_REQUIREMENTS=$(sed -n '/<objective>/,/<\/objective>/p' "$PLAN_FILE" 2>/dev/null | grep -v 'objective>')
   else
     PLAN_REQUIREMENTS="(no plan file found — review current HEAD changes)"
   fi
   ```

3.5. **HANDOFF.md에 review 행 기록.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_NUM_R=$(grep -E '^Phase: [0-9]+' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
   PHASE_PAD_R=$(printf "%02d" "${PHASE_NUM_R:-0}" 2>/dev/null || echo "${PHASE_NUM_R:-0}")
   PHASE_SLUG_R=$(ls -d .planning/phases/${PHASE_PAD_R}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_R" ] && PHASE_SLUG_R="${PHASE_NUM_R:-unknown}"
   echo "| $TS | $PHASE_SLUG_R | superpowers | review | - |" >> "$HANDOFF_FILE"
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
