---
name: sg-ui-plan
description: Use this when UI design brainstorming is needed before planning a phase — reads phase context from ROADMAP.md and runs superpowers:brainstorming.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
ROADMAP.md에서 대상 phase 섹션을 읽고, superpowers:brainstorming Agent를 실행하여 UI 설계 세션을 진행한다. 완료 후 .planning/HANDOFF.md에 To: ui-plan 행을 기록한다. sg-plan의 Visual Companion 분기를 독립 명령으로 분리한 것이며, brainstorming 완료 후 별도 plan-phase 호출 없이 종료된다.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Reads .planning/ROADMAP.md for phase context. Appends to .planning/HANDOFF.md.
</execution_context>

<process>
1. **Phase resolve.** $ARGUMENTS가 있으면 사용, 없으면 STATE.md에서 추출한다:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "[sg-ui-plan] Error: PHASE_NUM을 결정할 수 없습니다. 명시적으로 전달하세요: /super-gsd:sg-ui-plan <phase>"
     exit 1
   fi
   ```

2. **PHASE_SECTION 추출.** gsd-sdk로 phase 섹션을 추출한다:
   ```bash
   PHASE_SECTION_RAW=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
   if [ -z "$PHASE_SECTION" ]; then
     echo "[sg-ui-plan] WARN: ROADMAP에서 Phase $PHASE_NUM 섹션을 찾을 수 없습니다. 빈 컨텍스트로 brainstorming을 실행합니다."
   fi
   ```

3. **brainstorming Agent 실행.**
   ```
   echo "[sg-ui-plan] Phase $PHASE_NUM UI 설계 brainstorming 시작..."
   ```
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual resolved values. `$PHASE_SECTION` contains multi-line text — insert it as literal text in the prompt string:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
     prompt="Do NOT invoke writing-plans Skill after brainstorming completes. Your task is to run the superpowers brainstorming skill for Phase $PHASE_NUM UI design. The project root is the current working directory. Phase context:\n\n$PHASE_SECTION\n\nInvoke Skill(skill='superpowers:brainstorming', args='Phase $PHASE_NUM UI 설계를 진행합니다. 위 컨텍스트를 참고하십시오. 중요: brainstorming 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료하십시오.') and follow its instructions to completion. Do NOT invoke writing-plans after brainstorming finishes.",
     subagent_type="general-purpose"
   )
   ```
   Agent가 에러로 종료되면:
   ```
   echo "[sg-ui-plan] brainstorming 실패."
   exit 1
   ```
   brainstorming이 UI 설계 전용 명령의 핵심이므로 실패 시 중단한다.

4. **HANDOFF.md append.** brainstorming Agent 완료 후 실행한다:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
   if ! grep -q "| ${PHASE_SLUG} |.*| ui-plan |" "$HANDOFF_FILE" 2>/dev/null; then
     TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
     Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row that starts with "| " followed by a 4-digit year. Set FROM_STAGE to the extracted value.
     [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
     echo "| $TS | $PHASE_SLUG | $FROM_STAGE | ui-plan | - |" >> "$HANDOFF_FILE"
     echo "[sg-ui-plan] HANDOFF.md에 ui-plan 기록 완료."
   fi
   echo "[sg-ui-plan] UI 설계 brainstorming 완료. 다음 단계: /super-gsd:sg-execute"
   ```
</process>

<success_criteria>
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
2. PHASE_SECTION 추출 실패 시 경고를 출력하고 빈 컨텍스트로 brainstorming을 진행한다.
3. brainstorming Agent가 실행되고 완료 후 Step 4로 이동한다.
4. brainstorming Agent 에러 시 오류 메시지를 출력하고 중단한다 (HANDOFF 기록 안 함).
5. brainstorming 완료 후 HANDOFF.md에 To=ui-plan 행이 기록된다 (동일 phase+ui-plan 조합이 있으면 skip).
</success_criteria>
