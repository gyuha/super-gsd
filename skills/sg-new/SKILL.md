---
name: sg-new
description: Use this when a milestone is complete and a new one should begin — invokes gsd-new-milestone, then recommends sg-plan for the next phase.
argument-hint: "[milestone-name] - optional. Passed through to gsd-new-milestone."
---

<objective>
Invoke gsd-new-milestone Skill to start a new milestone, then display the super-gsd next-command recommendation (sg-plan) so the user continues in the super-gsd pipeline instead of falling back to raw GSD commands.
</objective>

<execution_context>
Self-contained. Forwards $ARGUMENTS unchanged to gsd-new-milestone Skill, then appends a super-gsd recommendation block.
</execution_context>

<process>
1. Invoke gsd-new-milestone (runs the full milestone setup workflow):
   ```
   Skill(skill="gsd-new-milestone", args="$ARGUMENTS")
   ```

2. After gsd-new-milestone completes, detect the first not-started phase under the new milestone section in ROADMAP.md and recommend sg-plan:
   ```bash
   MILESTONE=$(awk -F': ' '/^milestone:/ {gsub(/[[:space:]"]/,"",$2); print $2; exit}' .planning/STATE.md 2>/dev/null)
   NEXT_PHASE=$(awk -v ms="$MILESTONE" '
     index($0,"### " ms " ")==1 { in_section=1; next }
     in_section && /^### / { exit }
     in_section && /^- \[ \] \*\*Phase / {
       if (match($0,/Phase [0-9]+/)) {
         print substr($0,RSTART+6,RLENGTH-6); exit
       }
     }
   ' .planning/ROADMAP.md 2>/dev/null)
   ```

   If `NEXT_PHASE` is empty (no STATE.md, no ROADMAP.md, or no not-started phase under the current milestone section), skip the recommendation block silently — no error output.

   Otherwise display exactly:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    super-gsd ▶ NEXT (recommended)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   /clear

   /super-gsd:sg-plan ${NEXT_PHASE}   ← lessons 주입 + discuss + plan 자동 체인 (권장)

   또는:
     /super-gsd:sg-next                 자동 진행 (HANDOFF/STATE 기반 라우팅)
     /gsd-discuss-phase ${NEXT_PHASE}   raw GSD discuss만
     /gsd-plan-phase ${NEXT_PHASE}      raw GSD plan만
   ```
</process>

<success_criteria>
1. gsd-new-milestone Skill is invoked exactly once with $ARGUMENTS passed through unchanged.
2. After gsd-new-milestone completes and ROADMAP.md exists with at least one not-started Phase under the current milestone section (`### vX.Y ...`), the super-gsd ▶ NEXT block is displayed with the correct phase number.
3. If STATE.md/ROADMAP.md is missing or no not-started phase exists under the current milestone, no recommendation is displayed (no error output).
</success_criteria>
