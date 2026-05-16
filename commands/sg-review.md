---
name: sg-review
description: Request a code review via Superpowers — derives git range, collects description, then invokes superpowers:requesting-code-review Skill.
argument-hint: "[description of what was implemented]"
---

<objective>
Invoke the superpowers:requesting-code-review Skill with structured context: DESCRIPTION (from $ARGUMENTS or recent commit), BASE_SHA (merge-base with main), and HEAD_SHA (current HEAD). Ensures the Skill has enough context to dispatch a useful review subagent.
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
     echo "Warning: BASE_SHA == HEAD_SHA — only one commit exists or no divergence from base. The diff will be empty."
   fi
   ```
   Print to orient the user:
   `Reviewing: $BASE_SHA..$HEAD_SHA`

2. **Determine description.** Use $ARGUMENTS as the description of what was implemented. If $ARGUMENTS is empty, fall back to the most recent commit subject:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     DESCRIPTION="$ARGUMENTS"
   else
     DESCRIPTION=$(git log --oneline -1)
   fi
   ```

3. **Read plan/requirements (best-effort).** If a PLAN.md for the current phase exists, read its `<objective>` section as requirements context. Otherwise use an empty string:
   ```bash
   PHASE_NUM=$(grep -E '^Phase: [0-9]' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PLAN_FILE=$(ls .planning/phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)
   PLAN_FILE=${PLAN_FILE:-$(ls .planning/milestones/v1.0-phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)}
   if [ -n "$PLAN_FILE" ]; then
     PLAN_REQUIREMENTS=$(sed -n '/<objective>/,/<\/objective>/p' "$PLAN_FILE" 2>/dev/null | grep -v 'objective>')
   else
     PLAN_REQUIREMENTS="(no plan file found — review current HEAD changes)"
   fi
   ```

4. **Invoke Skill** with the structured context:
   ```
   Skill(skill="superpowers:requesting-code-review", args="## What Was Implemented\n$DESCRIPTION\n\n## Requirements / Plan\n$PLAN_REQUIREMENTS\n\n## Git Range\nBase: $BASE_SHA\nHead: $HEAD_SHA")
   ```

5. Print: `Code review initiated. Run /super-gsd:sg-learn after the review completes.`
</process>

<success_criteria>
1. superpowers:requesting-code-review Skill is invoked exactly once with a non-empty DESCRIPTION, a non-empty BASE_SHA, and a non-empty HEAD_SHA.
2. The git range reflects the current branch's changes since diverging from main.
3. When $ARGUMENTS is empty, DESCRIPTION falls back to the most recent git commit subject rather than an empty string.
</success_criteria>
