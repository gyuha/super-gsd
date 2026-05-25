---
name: sg-execute
description: PLAN.md를 읽고 phase 태스크를 순차 실행 — Superpowers 없이 직접 구현 모드
argument-hint: "[phase] - optional. STATE.md 현재 phase 사용."
---

<objective>
Package the current phase's PLAN.md, extract goal and success criteria, then directly execute each task in order. Superpowers:executing-plans is not available on this platform — all implementation is done inline.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 불가: superpowers:executing-plans 스킬을 사용할 수 없습니다. 직접 구현 모드로 실행됩니다.
- SubagentStop 미지원: 단계 종료 시 자동 트리거 없음. 완료 후 $sg-review를 수동 실행하세요.
- AskUserQuestion 미지원
</constraints>

<execution_context>
Reads .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, .planning/phases/<phase>/*-PLAN.md, .planning/HANDOFF.md. Executes plan tasks directly.
</execution_context>

<process>
0. **Lessons 리마인더.** .planning/lessons/ 에 파일이 있으면 weighted top-N 한 줄 요약을 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Top Recurring Patterns (reminder) ==="
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
     echo "========================================"
   fi
   ```

1. **Resolve phase.**
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     # Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>"
     exit 1
   fi
   ```

2. **Locate phase directory.**
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   if [ -z "$PHASE_DIR" ]; then
     echo "No phase directory matches '${PHASE_NUM}' under .planning/phases/. Run /super-gsd:sg-plan first."
     exit 1
   fi
   ```

3. **Extract phase meta from ROADMAP.md.**
   Read .planning/ROADMAP.md, then find the ### Phase {PHASE_NUM}: section. Extract: PHASE_NAME (text after "Phase N: " on the header line), GOAL (value of the **Goal**: line), REQ_IDS (value of the **Requirements**: line as space-separated list after stripping commas and spaces), SC_TEXT (numbered items under the **Success Criteria** section until the next ** section).

4. **Map REQ-IDs to definitions.**
   ```bash
   for REQ in $REQ_IDS; do
     grep -E "\*\*${REQ}\*\*:" .planning/REQUIREMENTS.md | head -1
   done
   ```

5. **Collect PLAN.md bodies.**
   Read every `*-PLAN.md` file in `$PHASE_DIR` (sorted numerically) using the Read tool.

6. **Compute Plan Hash.**
   ```bash
   PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
   [ -z "$PLAN_HASH" ] && PLAN_HASH="nodata"
   ```

7. **Idempotency check.**
   ```bash
   EXISTING_HASH=$(grep -E "^\| [^|]+ \| (${PHASE_PAD}|${PHASE_NUM})-[^|]* \| [^|]+ \|[[:space:]]*execute[[:space:]]*\|" .planning/HANDOFF.md 2>/dev/null | tail -1 | awk -F'|' '{gsub(/ /,"",$6); print $6}')
   if [ -n "$EXISTING_HASH" ] && [ "$EXISTING_HASH" = "$PLAN_HASH" ]; then
     echo "Already executed Phase $PHASE_NUM (plan hash matches: $PLAN_HASH). Skipping. Modify a PLAN.md to re-execute."
     exit 0
   fi
   ```

7.5. **HANDOFF.md 자동 초기화.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

9. **직접 구현 모드 실행.**

   수집한 PLAN.md 내용을 표시한 뒤, 아래 지침에 따라 각 task를 순차적으로 직접 실행한다:

   ```
   ## 직접 구현 지침

   Phase <PHASE_NUM> (<PHASE_NAME>) 실행을 시작합니다.
   Goal: <GOAL>

   Success Criteria:
   <SC_TEXT>

   --- 실행 순서 ---
   각 PLAN.md의 task를 wave 순서대로 순차 실행합니다:

   1. 각 task의 <files>에 명시된 파일을 생성하거나 수정합니다
   2. <action>의 지침을 따라 구현합니다
   3. <verify>의 자동화 명령을 실행해 검증합니다
   4. <done>의 완료 조건이 충족됐는지 확인합니다
   5. 모든 task 완료 후 성공 기준을 재확인합니다

   checkpoint:human-verify 태스크는 멈추고 사용자 확인을 요청합니다.
   checkpoint:decision 태스크는 선택지를 텍스트로 출력하고 입력을 기다립니다.
   ```

   모든 task 완료 후:
   ```
   Phase <PHASE_NUM> 실행 완료. 다음 단계: /super-gsd:sg-review
   ```

9.5. **HANDOFF.md 행 append — 모든 task 완료 후에만 기록.**
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   # Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE (default "init" if empty).
   [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
   PHASE_SLUG=$(basename "$PHASE_DIR")
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | execute | $PLAN_HASH |" >> .planning/HANDOFF.md
   ```
</process>

<success_criteria>
1. superpowers:executing-plans Skill 호출 없음 — 모든 task를 직접 실행한다.
2. HANDOFF.md에 `execute` 행이 기록된다.
3. 동일 plan hash로 재실행 시 idempotency 메시지를 출력하고 종료한다.
4. Platform Constraints 블록에 Superpowers 연동 불가가 명시된다.
5. 모든 task 완료 후 /super-gsd:sg-review 수동 실행을 안내한다.
</success_criteria>
