---
name: sg-plan
description: Use this when a new phase needs to be planned — injects prior lessons, then chains gsd-discuss-phase and gsd-plan-phase automatically.
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
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}
     });
   })' || echo "(weighted ranking unavailable)"
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
2. gsd-discuss-phase는 Agent()로 서브에이전트에서 실행되고, 완료 후 제어가 반환된다.
3. gsd-discuss-phase Agent가 에러로 종료되면 오류 메시지를 출력하고 Step 3(gsd-plan-phase)을 실행하지 않는다.
4. gsd-plan-phase Skill 호출 직전에 HANDOFF.md에 To=gsd-plan 행이 기록된다 (이미 동일 phase+gsd-plan 조합이 있으면 skip).
5. gsd-plan-phase Skill is invoked exactly once with the resolved phase number as the terminal action.
6. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective invocation.
</success_criteria>
