---
name: sg-complete
description: Complete the current milestone — invokes gsd-complete-milestone Skill.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase then invoke gsd-complete-milestone to mark the current milestone as complete.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Delegates milestone completion to gsd-complete-milestone Skill (terminal action).
</execution_context>

<process>
1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-complete <phase>"
     exit 1
   fi
   ```

2. **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `3`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-complete-milestone", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
1. gsd-complete-milestone Skill is invoked exactly once with the resolved phase number.
2. $ARGUMENTS is used as phase number when provided.
3. If phase cannot be resolved, the command exits with the prescribed error message and does not invoke the Skill.
</success_criteria>
