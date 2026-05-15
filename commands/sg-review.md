---
name: sg-review
description: Request a code review via Superpowers — invokes superpowers:requesting-code-review Skill.
---

<objective>
Invoke the superpowers:requesting-code-review Skill to initiate a code review. Passes $ARGUMENTS through to the Skill.
</objective>

<execution_context>
Self-contained. Delegates entirely to superpowers:requesting-code-review Skill.
</execution_context>

<process>
1. Invoke Skill: `Skill(skill="superpowers:requesting-code-review", args="$ARGUMENTS")`
2. Print: `Code review initiated. Run /super-gsd:sg-learn after the review completes.`
</process>

<success_criteria>
1. superpowers:requesting-code-review Skill is invoked exactly once.
</success_criteria>
