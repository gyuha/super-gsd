---
name: sg-start
description: Start a new project — invokes gsd-new-project to scaffold planning artifacts.
argument-hint: "[project-name] - optional. Passed through to gsd-new-project."
---

<objective>
Invoke the gsd-new-project Skill to scaffold a new project. Pass $ARGUMENTS as-is; gsd-new-project handles new vs. existing project detection internally.
</objective>

<execution_context>
Self-contained. Delegates all project detection and scaffolding to gsd-new-project Skill (terminal action).
</execution_context>

<process>
1. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```
</process>

<success_criteria>
1. gsd-new-project Skill is invoked exactly once with $ARGUMENTS passed through unchanged.
</success_criteria>
