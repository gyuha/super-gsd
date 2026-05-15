---
name: sg-start
description: Start a new project or milestone — invokes gsd-new-project to scaffold planning artifacts.
argument-hint: "[project-name] - optional. Passed through to gsd-new-project."
---

<objective>
Invoke the gsd-new-project Skill to scaffold a new project or milestone. Pass $ARGUMENTS as-is; gsd-new-project handles new vs. existing project detection internally.
</objective>

<execution_context>
Self-contained. Delegates all project detection and scaffolding to gsd-new-project Skill.
</execution_context>

<process>
1. Invoke Skill: Skill(skill="gsd-new-project", args="$ARGUMENTS")
2. Print: "Project initialized. Run /super-gsd:sg-explore to map the codebase, then /super-gsd:sg-plan to create a phase plan."
</process>

<success_criteria>
1. gsd-new-project Skill is invoked exactly once.
2. $ARGUMENTS is forwarded unchanged.
</success_criteria>
