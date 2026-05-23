---
name: sg-explore
description: Use this when you need a map of the current codebase structure — invokes gsd-map-codebase to analyse and document the project layout.
---

<objective>
Invoke the gsd-map-codebase Skill to analyse and map the current codebase. No arguments required.
</objective>

<execution_context>
Self-contained. Delegates entirely to gsd-map-codebase Skill (terminal action).
</execution_context>

<process>
1. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-map-codebase", args="")
   ```
</process>

<success_criteria>
1. gsd-map-codebase Skill is invoked exactly once.
</success_criteria>
