---
name: sg-explore
description: Explore and map the codebase — invokes gsd-explore Skill.
---

<objective>
Invoke the gsd-explore Skill to analyse and map the current codebase. No arguments required.
</objective>

<execution_context>
Self-contained. Delegates entirely to gsd-explore Skill.
</execution_context>

<process>
1. Invoke Skill: Skill(skill="gsd-explore", args="")
2. Print: "Exploration complete. Run /super-gsd:sg-plan <phase> to create a phase plan."
</process>

<success_criteria>
1. gsd-explore Skill is invoked exactly once.
</success_criteria>
