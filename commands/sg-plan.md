---
name: sg-plan
description: Gather context and create a phase plan — chains gsd-discuss-phase then gsd-plan-phase automatically.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase, then execute a 2-step chain: spawn a subagent to run gsd-discuss-phase and wait for it to complete, then invoke gsd-plan-phase via Skill as the terminal action. Print progress messages before each step.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Runs gsd-discuss-phase in a subagent (Agent), then delegates to gsd-plan-phase via Skill (terminal).
</execution_context>

<process>
0. **Prior lessons 주입.** .planning/lessons/ 아래 Markdown 파일이 있으면 내용을 먼저 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
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
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>"
     exit 1
   fi
   ```

2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
   Spawn a subagent to run gsd-discuss-phase and wait for it to complete.
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` in the block below with the actual resolved value** (e.g. `6`):
   ```
   Agent(
     description="gsd-discuss-phase for Phase $PHASE_NUM",  # replace $PHASE_NUM
     prompt="Your task is to run the GSD discuss-phase workflow for phase $PHASE_NUM. Invoke Skill(skill='gsd-discuss-phase', args='$PHASE_NUM') and follow all its instructions to completion.",  # replace $PHASE_NUM twice
     subagent_type="claude"
   )
   ```
   Wait for the agent to complete before proceeding.

3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
   **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `6`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-plan-phase", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
0. .planning/lessons/ 에 파일이 있으면 Step 1 전에 내용이 출력된다. 파일이 없으면 Step 0이 조용히 건너뛰어진다.
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
2. gsd-discuss-phase는 Agent()로 서브에이전트에서 실행되고, 완료 후 제어가 반환된다.
3. gsd-plan-phase Skill is invoked exactly once with the resolved phase number as the terminal action.
4. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective invocation.
</success_criteria>
