---
name: sg-status
description: 현재 워크플로우 단계, 마지막 handoff 시각, 다음 권장 명령 표시
---

<objective>
Inspect the current super-gsd workflow state. Read .planning/HANDOFF.md to determine the current stage, .planning/STATE.md for the current phase line (single source of truth), and .planning/ROADMAP.md only to detect whether a following phase exists. Output exactly three header lines, a blank line, and one "Next:" line. Fully independent — no GSD delegation needed.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 없음: 이 스킬은 완전 독립 실행 가능합니다
- SubagentStop 미지원: 워크플로우 상태만 표시하므로 영향 없음
- AskUserQuestion 미지원: 출력만 수행하므로 영향 없음
</constraints>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Writes nothing.
</execution_context>

<process>
1. **Read `Phase:` line verbatim from STATE.md.**

   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start이 동일 블록을 복제) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

2. **Determine stage from HANDOFF.md.**
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
   fi

   # Storage → Display enum mapping
   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="execute" ;;
     review)       STAGE_DISPLAY="review" ;;
     hookify)      STAGE_DISPLAY="hookify" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
     *)            STAGE_DISPLAY="$STAGE_RAW" ;;
   esac
   ```

3. **Compute last handoff timestamp.**
   ```bash
   if [ -z "$TS" ]; then
     LAST_TS="(none)"
   else
     LAST_TS="$TS"
   fi
   ```

4. **Compute next-phase number (for hookify/ship branches).**
   ```bash
   if [ "$STAGE_RAW" = "hookify" ] || [ "$STAGE_RAW" = "ship" ]; then
     if echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
       NEXT_PHASE=$((PHASE_NUM + 1))
       if grep -qE "^### Phase ${NEXT_PHASE}:" .planning/ROADMAP.md 2>/dev/null; then
         NEXT_PHASE_EXISTS=1
       else
         NEXT_PHASE_EXISTS=0
       fi
     else
       NEXT_PHASE_EXISTS=0
     fi
   fi
   ```

5. **Map stage to next command (`/super-gsd:sg-*` 슬래시 명령).**
   ```bash
   case "$STAGE_RAW" in
     init)
       if [ -n "$PHASE_NUM" ]; then
         NEXT_CMD="/super-gsd:sg-plan $PHASE_NUM"
       else
         NEXT_CMD="/super-gsd:sg-plan"
       fi
       ;;
     gsd-plan)    NEXT_CMD="/super-gsd:sg-execute" ;;
     superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
     review)      NEXT_CMD="/super-gsd:sg-learn" ;;
     hookify)     NEXT_CMD="/super-gsd:sg-ship" ;;
     ship)
       if [ "${NEXT_PHASE_EXISTS:-0}" = "1" ]; then
         NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="/super-gsd:sg-complete"
       fi
       ;;
     complete) NEXT_CMD="/super-gsd:sg-new" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

   주의: `execute` stage (Codex 직접 실행 모드)는 `/super-gsd:sg-review`로 라우팅한다.

6. **Print output.**

   아래 정확히 5개 라인을 출력하고 종료한다. 추가 출력 없음:
   ```
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last handoff: <LAST_TS>

   Next: <NEXT_CMD>
   ```
</process>

<success_criteria>
1. 출력은 정확히 5개 라인: 3개 헤더 라인 + 1개 빈 줄 + 1개 Next 라인.
2. HANDOFF.md에 데이터 행이 없으면 Stage=init, Last handoff=(none).
3. `/super-gsd:sg-*` 슬래시 명령이 NEXT_CMD 매핑에 사용된다.
4. `execute` stage가 `/super-gsd:sg-review`로 라우팅된다.
5. STATE.md Phase parsing block이 보존되어 있다 (grep-sed-awk 파이프라인).
6. GSD 설치 여부에 관계없이 완전 독립 실행 가능하다.
</success_criteria>
