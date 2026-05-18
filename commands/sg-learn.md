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
0.9. **HANDOFF.md에 hookify 행 기록.** hookify:hookify는 terminal Skill이므로 호출 직전이 기록 가능한 최후 시점이다:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_NUM_L=$(grep -E '^Phase: [0-9]+' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
   PHASE_PAD_L=$(printf "%02d" "${PHASE_NUM_L:-0}" 2>/dev/null || echo "${PHASE_NUM_L:-0}")
   PHASE_SLUG_L=$(ls -d .planning/phases/${PHASE_PAD_L}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_L" ] && PHASE_SLUG_L="${PHASE_NUM_L:-unknown}"
   echo "| $TS | $PHASE_SLUG_L | review | hookify | - |" >> "$HANDOFF_FILE"
   ```

1. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="hookify:hookify", args="$ARGUMENTS")
   ```
</process>

<success_criteria>
1. hookify:hookify Skill is invoked exactly once.
</success_criteria>
