---
name: sg-start
description: 기존 세션 감지 또는 신규 프로젝트 시작 — super-gsd 워크플로우 진입점
argument-hint: "[project-name] - 신규 프로젝트 시작 시에만 사용. 기존 세션이 없을 때 gsd-new-project에 전달."
---

<objective>
Detect existing session via STATE.md + HANDOFF.md. If detected, show 5-line summary (Milestone / Phase / Stage / Last activity / Next) and ask user (Resume / Start new milestone / Cancel) via numbered text list. If no STATE.md, delegate to gsd-new-project Skill or run prose fallback.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 불가: Claude Code 전용 도구
- SubagentStop 미지원: 단계 종료 시 자동 트리거 없음
- AskUserQuestion 미지원: 선택지를 텍스트로 출력하고 자유 입력을 받음
</constraints>

<execution_context>
Reads .planning/STATE.md, .planning/HANDOFF.md, .planning/ROADMAP.md. Writes nothing. Delegates to gsd-new-milestone or gsd-new-project depending on user choice / detection result.
</execution_context>

<process>
1. **STATE.md Phase 파싱.**

   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start이 동일 블록을 복제) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

   D-01 트리거 판정:
   ```bash
   if [ ! -f .planning/STATE.md ] || [ "$PHASE_LINE" = "(none)" ]; then
     EXISTING_SESSION=0
   else
     EXISTING_SESSION=1
   fi
   ```

   `EXISTING_SESSION=0`이면 Step 6의 fallback으로 점프.

2. **STATE.md frontmatter 추가 파싱 + HANDOFF.md 마지막 행 파싱.**

   `EXISTING_SESSION=1`일 때만 실행.

   ```bash
   MILESTONE=$(grep -E '^milestone:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   MILESTONE_NAME=$(grep -E '^milestone_name:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone_name:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_UPDATED=$(grep -E '^last_updated:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_updated:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_ACTIVITY=$(grep -E '^last_activity:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_activity:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   ```

   Milestone 표시 조립:
   ```bash
   if [ -n "$MILESTONE" ] && [ -n "$MILESTONE_NAME" ]; then
     MILESTONE_DISPLAY="${MILESTONE} ${MILESTONE_NAME}"
   elif [ -n "$MILESTONE" ]; then
     MILESTONE_DISPLAY="$MILESTONE"
   else
     MILESTONE_DISPLAY="(unknown)"
   fi
   ```

   HANDOFF.md 마지막 데이터 행 + Stage 매핑:
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
   fi

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

3. **Last activity 시각 결정 (절대시각만 — 상대시각 금지).**
   ```bash
   if [ -n "$TS" ]; then
     LAST_ACTIVITY_DISPLAY="$TS"
   elif [ -n "$LAST_UPDATED" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_UPDATED"
   elif [ -n "$LAST_ACTIVITY" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_ACTIVITY"
   else
     LAST_ACTIVITY_DISPLAY="(unknown)"
   fi
   ```

4. **NEXT_PHASE 계산 + Next 명령 매핑.**

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

   case "$STAGE_RAW" in
     init)
       if [ -n "$PHASE_NUM" ]; then
         NEXT_CMD="\$sg-plan $PHASE_NUM"
       else
         NEXT_CMD="\$sg-plan"
       fi
       ;;
     gsd-plan)    NEXT_CMD="\$sg-execute" ;;
     superpowers) NEXT_CMD="\$sg-review" ;;
     execute)     NEXT_CMD="\$sg-review" ;;
     review)      NEXT_CMD="\$sg-retro" ;;
     hookify)     NEXT_CMD="\$sg-ship" ;;
     ship)
       if [ "${NEXT_PHASE_EXISTS:-0}" = "1" ]; then
         NEXT_CMD="\$sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="\$sg-complete"
       fi
       ;;
     complete) NEXT_CMD="\$sg-start" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

5. **5개 라인 emit + 텍스트 선택 분기.**

   안내 헤더 + 5개 라인 출력:
   ```
   Existing session detected.

   Milestone: <MILESTONE_DISPLAY>
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last activity: <LAST_ACTIVITY_DISPLAY>
   Next: <NEXT_CMD>
   ```

   텍스트 선택 목록 출력 (AskUserQuestion 미지원):
   ```
   다음 중 선택하세요:
   1) Resume — Next 명령을 직접 실행합니다
   2) Start new milestone — 새 마일스톤을 시작합니다
   3) Cancel — 변경 없이 종료합니다

   번호 또는 텍스트로 입력하세요.
   ```

   응답 분기:
   - **"1" 또는 "Resume"**: 추가 출력 없음, 종료. 사용자가 Next 라인의 명령을 직접 실행.
   - **"2" 또는 "Start new milestone"**:
     ```
     Skill(skill="gsd-new-milestone", args="")
     ```
   - **"3" 또는 "Cancel"**: `Cancelled. No changes made.` emit 후 종료.

   세 분기 모두 `.planning/HANDOFF.md`를 read-only로만 접근.

6. **Fallback 분기 (`EXISTING_SESSION=0`).**

   GSD 설치 여부 확인:
   ```bash
   if command -v gsd-sdk >/dev/null 2>&1 || ls ~/.claude/get-shit-done 2>/dev/null | grep -q .; then
     GSD_AVAILABLE=1
   else
     GSD_AVAILABLE=0
   fi
   ```

   GSD 있으면:
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```

   GSD 없으면 (prose 폴백):
   ```
   [sg-start] GSD not found. Running manual project setup.

   신규 프로젝트 초기화 절차:
   1. mkdir -p .planning/phases .planning/lessons
   2. .planning/STATE.md 생성 (Phase: 1, milestone: v1.0)
   3. .planning/ROADMAP.md 생성 (Phase 1 섹션 추가)
   4. .planning/REQUIREMENTS.md 생성 (요구사항 목록)
   5. $sg-plan 1을 실행하여 첫 phase 계획을 시작하세요
   ```
</process>

<success_criteria>
1. STATE.md/HANDOFF.md를 읽어 기존 세션을 감지하고 5개 라인을 emit한다.
2. 텍스트 선택 목록(1/2/3)을 출력하고 사용자 입력을 기다린다. AskUserQuestion 호출 없음.
3. Resume → emit-only 종료, Start new milestone → gsd-new-milestone Skill, Cancel → `Cancelled.` emit.
4. HANDOFF.md는 read-only 접근만.
5. STATE.md 미감지 시 GSD 위임 또는 prose 폴백.
6. NEXT_CMD 매핑에 `$sg-*` 달러 문법 사용.
</success_criteria>
