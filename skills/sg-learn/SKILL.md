---
name: sg-learn
description: Use this when a phase is complete and you want to extract patterns and lessons from the session — delegates to sg-retro for structured retrospective.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Invoke the sg-retro Skill to run a retrospective and extract learnable patterns from the current session.
</objective>

<execution_context>
Self-contained. Delegates entirely to sg-retro Skill (terminal action).
</execution_context>

<process>
1. Session control transfers to the skill; no steps execute after this point:
   <!-- HANDOFF.md recording is handled by sg-retro after lessons are successfully written -->
   ```
   Skill(skill="sg-retro", args="$ARGUMENTS")
   ```
</process>

<success_criteria>
1. sg-retro Skill is invoked exactly once.
</success_criteria>
