---
name: sg-learn
description: Run a Hookify retrospective to extract patterns and generate hooks from this session.
---

<objective>
Invoke the hookify:hookify Skill to run a retrospective and extract learnable patterns from the current session.
</objective>

<execution_context>
Self-contained. Delegates entirely to hookify:hookify Skill (terminal action).
</execution_context>

<process>
1. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="hookify:hookify", args="$ARGUMENTS")
   ```
</process>

<success_criteria>
1. hookify:hookify Skill is invoked exactly once.
</success_criteria>
