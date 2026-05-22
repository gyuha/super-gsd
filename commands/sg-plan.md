---
name: sg-plan
description: Gather context (injects .planning/lessons/) and create a phase plan — chains gsd-discuss-phase → gsd-plan-phase automatically.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase, then execute a 2-step chain: spawn a subagent to run gsd-discuss-phase and wait for it to complete, then invoke gsd-plan-phase via Skill as the terminal action. Print progress messages before each step.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Runs gsd-discuss-phase in a subagent (Agent), then delegates to gsd-plan-phase via Skill (terminal).
</execution_context>

<process>
0. **Prior lessons 주입.** .planning/lessons/ 아래 Markdown 파일이 있으면 weighted top-N을 먼저 표시한 뒤 전체 lessons를 출력한다 (lessons는 프로젝트 전체 범위이며 특정 phase에 한정되지 않는다):
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Weighted Top-N Patterns ==="
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   lines = [l for l in sys.stdin if l.strip()]
   for i, line in enumerate(lines, 1):
       try:
           d = json.loads(line)
           print(f\"{i}. [score {d['score']:.2f}] {d['pattern']} ({d['source']})\")
       except Exception:
           pass
   " || echo "(weighted ranking unavailable)"
     echo "=== All Lessons (below) ==="
     cat .planning/lessons/*.md
     echo "=== End of Lessons ==="
   fi
   ```
   파일이 없으면 이 단계를 조용히 건너뛴다.

1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>"
     exit 1
   fi
   ```
   If `PHASE_NUM` is empty after running this block, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>` and stop execution. Do not proceed to Step 2.

1.5. **Visual Companion 판단 (D-01~D-06).** Phase goal에 UI 관련 키워드가 있을 때만 실행한다:
   ```bash
   PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   UI_DETECTED=""
   if [ -n "$PHASE_SECTION" ] && echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
     UI_DETECTED="1"
   fi
   ```
   **UI 키워드가 없거나 PHASE_SECTION이 비어 있으면** 이 단계를 조용히 건너뛰고 Step 2로 이동한다.

   **UI 키워드가 감지되면** AskUserQuestion을 표시한다:
   ```
   AskUserQuestion(
     questions: [{
       question: "이 phase에 UI 설계가 포함되어 있나요?",
       header: "Visual Companion",
       multiSelect: false,
       options: [
         { label: "Visual Companion 포함", description: "superpowers:brainstorming을 실행하여 UI를 먼저 설계합니다." },
         { label: "UI 없음", description: "UI 설계 없이 기존 흐름을 진행합니다." }
       ]
     }]
   )
   ```

   **"UI 없음" 선택 시:** `[sg-plan] UI 설계 없이 진행합니다.` 출력 후 Step 2로 이동한다.

   **"Visual Companion 포함" 선택 시:** brainstorming Agent를 실행하고 완료를 기다린다.
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual resolved values. `$PHASE_SECTION` contains multi-line text — insert it as literal text in the prompt string:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
     prompt="Do NOT invoke writing-plans Skill after brainstorming completes. Your task is to run the superpowers brainstorming skill for Phase $PHASE_NUM UI design. The project root is the current working directory. Phase context:\n\n$PHASE_SECTION\n\nInvoke Skill(skill='superpowers:brainstorming', args='Phase $PHASE_NUM UI 설계를 진행합니다. 위 컨텍스트를 참고하십시오. 중요: brainstorming 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료하십시오.') and follow its instructions to completion.
Do NOT invoke writing-plans after brainstorming finishes.",
     subagent_type="general-purpose"
   )
   ```
   Agent가 에러로 종료되면: `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 Step 2로 이동한다 (중단 없음).

2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
   Spawn a subagent to run gsd-discuss-phase and wait for it to complete.
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` in the block below with the actual resolved value** (e.g. `6`):
   ```
   Agent(
     description="gsd-discuss-phase for Phase $PHASE_NUM",  # replace $PHASE_NUM
     prompt="Your task is to run the GSD discuss-phase workflow for phase $PHASE_NUM. The project root is the current working directory; planning artifacts are under .planning/ relative to it. The exact skill name is 'gsd-discuss-phase' (no namespace prefix). Invoke Skill(skill='gsd-discuss-phase', args='$PHASE_NUM') and follow all its instructions to completion.",  # replace $PHASE_NUM twice
     subagent_type="general-purpose"
   )
   ```
   Wait for the agent to complete before proceeding. If the agent exits with an error, print: `[sg-plan] gsd-discuss-phase failed. Aborting.` and stop execution. Do not proceed to Step 3.

2.5. **HANDOFF.md에 gsd-plan 행 idempotent 기록.** gsd-plan-phase가 terminal Skill이므로 제어가 반환되지 않는다. 호출 직전이 기록 가능한 최후 시점이다. 동일 phase의 gsd-plan 행이 이미 있으면 skip한다:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   PHASE_PAD_P=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG_P=$(ls -d .planning/phases/${PHASE_PAD_P}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_P" ] && PHASE_SLUG_P="${PHASE_NUM:-unknown}"
   if [ -n "$PHASE_SLUG_P" ] && ! grep -q "| ${PHASE_SLUG_P} |.*| gsd-plan |" "$HANDOFF_FILE" 2>/dev/null; then
     TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
     PREV_STAGE=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     [ -z "$PREV_STAGE" ] && PREV_STAGE="init"
     echo "| $TS | $PHASE_SLUG_P | $PREV_STAGE | gsd-plan | - |" >> "$HANDOFF_FILE"
   fi
   ```

3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
   **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `6`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-plan-phase", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
0. .planning/lessons/ 에 파일이 있으면 Step 0이 weighted top-N을 먼저 표시하고 전체 lessons를 "=== Weighted Top-N Patterns ===" → ranked list → "=== All Lessons (below) ===" → cat 내용 → "=== End of Lessons ===" 순서로 출력한다. 파일이 없으면 Step 0이 조용히 건너뛰어진다.
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
1.5. Phase goal에 UI 키워드(UI|화면|design|Visual|frontend|interface|component)가 없거나 PHASE_SECTION이 비어 있으면 Step 1.5를 조용히 건너뛰고 Step 2로 진행한다. UI 키워드가 감지되면 AskUserQuestion("Visual Companion 포함" / "UI 없음")이 표시된다. "Visual Companion 포함" 선택 시 superpowers:brainstorming Agent가 실행되고 완료 후 Step 2로 이동한다. "UI 없음" 선택 시 `[sg-plan] UI 설계 없이 진행합니다.` 출력 후 Step 2로 이동한다. brainstorming Agent 에러 시 `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 Step 2로 이동한다 (abort 없음). brainstorming Agent 프롬프트에는 writing-plans 미호출 억제 지시가 포함된다.
2. gsd-discuss-phase는 Agent()로 서브에이전트에서 실행되고, 완료 후 제어가 반환된다.
3. gsd-discuss-phase Agent가 에러로 종료되면 오류 메시지를 출력하고 Step 3(gsd-plan-phase)을 실행하지 않는다.
4. gsd-plan-phase Skill 호출 직전에 HANDOFF.md에 To=gsd-plan 행이 기록된다 (이미 동일 phase+gsd-plan 조합이 있으면 skip).
5. gsd-plan-phase Skill is invoked exactly once with the resolved phase number as the terminal action.
6. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective invocation.
</success_criteria>
