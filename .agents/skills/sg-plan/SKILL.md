---
name: sg-plan
description: 컨텍스트 수집 후 GSD phase 계획 생성 — gsd-discuss-phase → gsd-plan-phase 체인 실행 (GSD 없으면 prose 폴백)
argument-hint: "[phase] - optional. STATE.md 현재 phase 사용."
---

<objective>
Resolve the target phase, inject prior lessons, then execute a 2-step chain: gsd-discuss-phase (context gathering) → gsd-plan-phase (plan creation). When GSD is not installed, run manual planning prose fallback.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 불가: Claude Code 전용 도구
- SubagentStop 미지원: 단계 종료 시 자동 트리거 없음
- AskUserQuestion 미지원: 필요한 입력은 arguments로 전달
</constraints>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Checks GSD installation. Runs gsd-discuss-phase → gsd-plan-phase chain (GSD path) or manual planning (prose path).
</execution_context>

<process>
0. **Prior lessons 주입.** .planning/lessons/ 아래 Markdown 파일이 있으면 내용을 먼저 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Prior Lessons (auto-injected) ==="
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
     echo "=== All Lessons ==="
     cat .planning/lessons/*.md
     echo "=== End of Lessons ==="
   fi
   ```
   파일이 없으면 조용히 건너뛴다.

1. **Resolve phase.**
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>"
     exit 1
   fi
   ```

1.5. **Visual Companion 판단.** Phase goal에 UI 관련 키워드가 있을 때만 실행한다:
   ```bash
   PHASE_SECTION_RAW=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
   UI_DETECTED=""
   if [ -n "$PHASE_SECTION" ] && echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
     UI_DETECTED="1"
   fi
   ```
   **UI 키워드가 없거나 PHASE_SECTION이 비어 있으면** 이 단계를 조용히 건너뛰고 Step 2로 이동한다.

   **UI 키워드가 감지되면** 아래 질문을 출력하고 사용자 응답을 기다린다 (AskUserQuestion 미지원 플랫폼 폴백):
   ```
   [sg-plan] UI 관련 phase가 감지됩니다. Visual Companion 설계를 진행하겠습니까?

   1. Visual Companion 포함 — superpowers:brainstorming을 먼저 실행합니다.
   2. UI 없음 — 기존 흐름을 진행합니다.

   답변을 입력하세요 (1 또는 2):
   ```

   사용자가 **"1" 또는 "Visual Companion 포함"** 을 선택하면 brainstorming Agent를 실행하고 완료를 기다린다.
   **Before calling Agent, replace `<PHASE_NUM>` and `<PHASE_SECTION>` with actual resolved values:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase <PHASE_NUM> UI design",
     prompt="Do NOT invoke writing-plans Skill after brainstorming completes. Your task is to run the superpowers brainstorming skill for Phase <PHASE_NUM> UI design. The project root is the current working directory. Phase context:\n\n<PHASE_SECTION>\n\nInvoke Skill(skill='superpowers:brainstorming', args='Phase <PHASE_NUM> UI 설계를 진행합니다. 위 컨텍스트를 참고하십시오. 중요: brainstorming 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료하십시오.') and follow its instructions to completion.
Do NOT invoke writing-plans after brainstorming finishes.",
     subagent_type="general-purpose"
   )
   ```
   Agent가 에러로 종료되면: `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 Step 2로 이동한다 (중단 없음).

   사용자가 **"2" 또는 "UI 없음"** 을 선택하면: `[sg-plan] UI 설계 없이 진행합니다.` 출력 후 Step 2로 이동한다.

2. **GSD 설치 여부 확인 및 경로 분기.**

   ```bash
   if command -v gsd-sdk >/dev/null 2>&1 || [ -d "$HOME/.claude/get-shit-done" ]; then
     GSD_AVAILABLE=1
   else
     GSD_AVAILABLE=0
   fi
   ```

   **GSD 있는 경우 (주 경로):**

   2a. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
       gsd-discuss-phase Agent 실행 (서브에이전트):
       ```
       Agent(
         description="gsd-discuss-phase for Phase <PHASE_NUM>",
         prompt="Your task is to run the GSD discuss-phase workflow for phase <PHASE_NUM>. The project root is the current working directory; planning artifacts are under .planning/ relative to it. Invoke Skill(skill='gsd-discuss-phase', args='<PHASE_NUM>') and follow all its instructions to completion.",
         subagent_type="general-purpose"
       )
       ```

   2b. HANDOFF.md에 gsd-plan 행 idempotent 기록:
       ```bash
       HANDOFF_FILE=".planning/HANDOFF.md"
       if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
         mkdir -p "$(dirname "$HANDOFF_FILE")"
         printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
       fi
       PHASE_PAD_P=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
       PHASE_SLUG_P=$(ls -d .planning/phases/${PHASE_PAD_P}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
       [ -z "$PHASE_SLUG_P" ] && PHASE_SLUG_P="${PHASE_NUM:-unknown}"
       if ! grep -q "| ${PHASE_SLUG_P} |.*| gsd-plan |" "$HANDOFF_FILE" 2>/dev/null; then
         TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
         Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set PREV_STAGE to the extracted value (empty string if no data rows exist).
         [ -z "$PREV_STAGE" ] && PREV_STAGE="init"
         echo "| $TS | $PHASE_SLUG_P | $PREV_STAGE | gsd-plan | - |" >> "$HANDOFF_FILE"
       fi
       ```

   2c. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
       Session control transfers to the skill:
       ```
       Skill(skill="gsd-plan-phase", args="<PHASE_NUM>")
       ```

   **GSD 없는 경우 (prose 폴백):**

   ```
   [sg-plan] GSD not found. Running manual planning mode.

   Phase <PHASE_NUM> planning steps:
   1. Read .planning/phases/NN-*/NN-CONTEXT.md if it exists
   2. Read .planning/ROADMAP.md Phase <PHASE_NUM> section (Goal, Success Criteria, Requirements)
   3. Read .planning/REQUIREMENTS.md for relevant requirement IDs
   4. Create .planning/phases/NN-{slug}/NN-01-PLAN.md with:
      - YAML frontmatter (phase, plan, type, wave, depends_on, files_modified)
      - <objective> block (goal + output artifacts)
      - <tasks> block (each task: <name>, <files>, <action>, <verify>, <done>)
      - <success_criteria> (maps to ROADMAP.md success criteria)
   5. Confirm the plan with the user before proceeding to /super-gsd:sg-execute
   ```

   Proceed to execute the above steps manually for phase `<PHASE_NUM>`.
</process>

<success_criteria>
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
2. GSD 있으면 gsd-discuss-phase Agent → gsd-plan-phase Skill 체인을 실행한다.
3. GSD 없으면 prose 폴백으로 PLAN.md 생성 절차를 안내하고 직접 실행한다.
4. Prior lessons가 있으면 Step 0에서 먼저 출력된다.
5. HANDOFF.md에 gsd-plan 행이 기록된다 (GSD 경로 시).
</success_criteria>
