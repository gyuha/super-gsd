---
name: sg-ship
description: Use this when the milestone is ready to be shipped — resolves the current phase and invokes gsd-ship to complete delivery.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase then invoke gsd-ship to complete and ship the milestone.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Delegates shipment to gsd-ship Skill (terminal action).
</execution_context>

<process>
1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-ship <phase>"
     exit 1
   fi
   ```

1.5. **Record HANDOFF.md row (`ship` stage) — before invoking the Skill.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   FROM_STAGE=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
   [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "${PHASE_PAD}")
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | ship | - |" >> "$HANDOFF_FILE"
   ```

2. **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `3`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-ship", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
1. gsd-ship Skill is invoked exactly once with the resolved phase number.
2. $ARGUMENTS is used as phase number when provided.
3. `.planning/HANDOFF.md` gains a `ship` row immediately before the Skill is invoked.
4. If phase cannot be resolved, the command exits with the prescribed error message and does not invoke the Skill.
</success_criteria>
