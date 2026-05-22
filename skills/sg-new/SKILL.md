---
name: sg-new
description: Start a new milestone — invokes gsd-new-milestone Skill.
argument-hint: "[milestone-name] - optional. Passed through to gsd-new-milestone."
---

<objective>
Invoke gsd-new-milestone Skill to start a new milestone. Pass $ARGUMENTS as-is; gsd-new-milestone handles milestone setup internally.
</objective>

<execution_context>
Self-contained. Forwards $ARGUMENTS unchanged to gsd-new-milestone Skill (terminal action).
</execution_context>

<process>
1. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-new-milestone", args="$ARGUMENTS")
   ```
</process>

<success_criteria>
1. gsd-new-milestone Skill is invoked exactly once with $ARGUMENTS passed through unchanged.
</success_criteria>
