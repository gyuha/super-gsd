---
name: sg-learn
description: Run a Hookify retrospective to extract patterns and generate hooks from this session.
---

<objective>
Invoke the hookify:hookify Skill to run a retrospective and extract learnable patterns from the current session.
</objective>

<execution_context>
Self-contained. Delegates entirely to hookify:hookify Skill.
</execution_context>

<process>
1. Invoke Skill: `Skill(skill="hookify:hookify", args="$ARGUMENTS")`
2. Print: `Retrospective complete. Run /super-gsd:sg-ship when ready to close the milestone.`
</process>

<success_criteria>
1. hookify:hookify Skill is invoked exactly once.
</success_criteria>
