---
name: sg-new
description: Start a new milestone — invokes gsd-new-milestone Skill.
argument-hint: "[milestone-name] - optional. Passed through to gsd-new-milestone."
---

<objective>
Invoke gsd-new-milestone Skill to start a new milestone.
</objective>

<execution_context>
Self-contained. Forwards $ARGUMENTS unchanged to gsd-new-milestone Skill. gsd-new-milestone handles context scaffolding internally.
</execution_context>

<process>
1. Invoke Skill: `Skill(skill="gsd-new-milestone", args="$ARGUMENTS")`

2. Print: `New milestone started. Run /super-gsd:sg-explore to map the codebase next.`
</process>

<success_criteria>
1. gsd-new-milestone Skill is invoked exactly once with $ARGUMENTS passed through unchanged.
</success_criteria>
