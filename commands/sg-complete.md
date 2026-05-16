---
name: sg-complete
description: Complete the current milestone — invokes gsd-complete-milestone Skill.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase then invoke gsd-complete-milestone to mark the current milestone as complete.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Delegates milestone completion to gsd-complete-milestone Skill.
</execution_context>

<process>
1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
   fi
   ```
   If extraction fails, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-complete <phase>` and exit.

2. Invoke Skill: `Skill(skill="gsd-complete-milestone", args="$PHASE_NUM")`

3. Print: `Milestone marked complete. Run /super-gsd:sg-new to start a new milestone.`
</process>

<success_criteria>
1. gsd-complete-milestone Skill is invoked exactly once with the resolved phase number.
2. $ARGUMENTS is used as phase number when provided.
</success_criteria>
