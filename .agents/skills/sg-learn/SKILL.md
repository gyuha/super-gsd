---
name: sg-learn
description: Delegates to sg-retro skill to run a structured retrospective and extract learnable patterns.
argument-hint: "[phase] [lens] - passed through to sg-retro. e.g. '14 ssc'"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Invoke sg-retro to run a retrospective and extract learnable patterns from the current phase.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- AskUserQuestion not supported: lens selection is handled by sg-retro via numbered list.
- Superpowers integration unavailable: this skill is fully self-contained.
</constraints>

<execution_context>
Self-contained. Delegates entirely to sg-retro (terminal action).
</execution_context>

<process>
1. Check that `.agents/skills/sg-retro/SKILL.md` exists before proceeding:
   ```bash
   if [ ! -f ".agents/skills/sg-retro/SKILL.md" ]; then
     echo "[sg-learn] Error: .agents/skills/sg-retro/SKILL.md not found. Run \$sg-setup to install missing skill files."
     exit 1
   fi
   ```

2. Read and follow the instructions in `.agents/skills/sg-retro/SKILL.md`, passing any ARGUMENTS through as-is.
   Output: `→ $sg-retro`
   Then execute the sg-retro skill process directly.
</process>

<success_criteria>
1. sg-retro skill instructions are followed exactly once.
2. Any ARGUMENTS passed to sg-learn are forwarded to sg-retro unchanged.
</success_criteria>
