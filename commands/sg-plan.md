---
name: sg-plan
description: Gather context and create a phase plan — chains gsd-discuss-phase then gsd-plan-phase automatically.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase, then execute a 2-step chain: first invoke gsd-discuss-phase to gather phase context, then invoke gsd-plan-phase to create the execution plan. Print progress messages before each step so the user sees which step is running.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Delegates planning work to gsd-discuss-phase and gsd-plan-phase Skills in sequence.
</execution_context>

<process>
0. **Prior lessons 주입.** .planning/lessons/ 아래 Markdown 파일이 있으면 내용을 먼저 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | head -1 | grep -q .; then
     echo "=== Prior Lessons (auto-injected) ==="
     cat .planning/lessons/*.md
     echo "=== End of Prior Lessons ==="
   fi
   ```
   파일이 없으면 이 단계를 조용히 건너뛴다.

1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
   fi
   ```
   If extraction fails, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>` and exit.

2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
   Then invoke Skill: `Skill(skill="gsd-discuss-phase", args="$PHASE_NUM")`

3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
   Then invoke Skill: `Skill(skill="gsd-plan-phase", args="$PHASE_NUM")`

4. Print: `Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers.`
</process>

<success_criteria>
0. .planning/lessons/ 에 파일이 있으면 Step 1 전에 내용이 출력된다. 파일이 없으면 Step 0이 조용히 건너뛰어진다.
1. gsd-discuss-phase Skill is invoked exactly once with the resolved phase number.
2. gsd-plan-phase Skill is invoked exactly once with the same phase number, after gsd-discuss-phase completes.
3. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective Skill invocation.
</success_criteria>
