---
name: sg-start
description: Start or resume a project — detects existing session, prompts Resume / Start new milestone / Cancel; falls back to gsd-new-project when no session is detected.
argument-hint: "[project-name] - optional. Used only when no existing .planning/STATE.md is detected; passed through to gsd-new-project."
---

<objective>
Detect existing session via STATE.md + HANDOFF.md. If detected, show 5-line summary (Milestone / Phase / Stage / Last activity / Next) and ask user (Resume / Start new milestone / Cancel) via AskUserQuestion. If no STATE.md, delegate to gsd-new-project Skill as before (D-17 fallback). All branches access HANDOFF.md as read-only — append-only audit log invariant preserved (SESS-04).
</objective>

<execution_context>
Reads .planning/STATE.md, .planning/HANDOFF.md, .planning/ROADMAP.md (next-phase existence check). Writes nothing. Delegates to gsd-new-milestone or gsd-new-project Skill depending on user choice / detection result.
</execution_context>

<process>
1. **STATE.md Phase 파싱 (D-01, D-03; Phase 7 D-07 inline-replication lock).**

   `skills/sg-status/SKILL.md` lines 17-21 블록을 글자 그대로 복제한다 (drift 시 양쪽 동시 수정):
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

   `EXISTING_SESSION=0`이면 Step 6의 D-17 fallback으로 점프 (Step 2~5 건너뜀).

2. **STATE.md frontmatter 추가 파싱 + HANDOFF.md 마지막 행 파싱 (D-04, D-06, D-07).**

   `EXISTING_SESSION=1`일 때만 실행.

   STATE.md frontmatter 4개 필드 (line-by-line grep + sed; yq 등 외부 도구 미사용 — Phase 6 D-04 lock):
   ```bash
   MILESTONE=$(grep -E '^milestone:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   MILESTONE_NAME=$(grep -E '^milestone_name:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone_name:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_UPDATED=$(grep -E '^last_updated:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_updated:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_ACTIVITY=$(grep -E '^last_activity:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_activity:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   ```

   Milestone 표시 조립 (D-07):
   ```bash
   if [ -n "$MILESTONE" ] && [ -n "$MILESTONE_NAME" ]; then
     MILESTONE_DISPLAY="${MILESTONE} ${MILESTONE_NAME}"
   elif [ -n "$MILESTONE" ]; then
     MILESTONE_DISPLAY="$MILESTONE"
   else
     MILESTONE_DISPLAY="(unknown)"
   fi
   ```

   HANDOFF.md 마지막 데이터 행 + Stage 매핑 — `skills/sg-status/SKILL.md` lines 26-48 블록을 글자 그대로 복제 (drift 시 양쪽 동시 수정):
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
     case "$STAGE_RAW" in
       gsd-plan|superpowers|parallel|execute|review|sg-retro|hookify|ship|complete) ;;
       *) echo "[warn] Unknown stage '${STAGE_RAW}' in HANDOFF.md — treating as init" >&2
          STAGE_RAW="init" ;;
     esac
   fi

   # Storage → Display enum mapping (D-01, D-02)
   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     parallel)     STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="superpowers" ;;
     review)       STAGE_DISPLAY="superpowers" ;;
     sg-retro)     STAGE_DISPLAY="hookify" ;;
     hookify)      STAGE_DISPLAY="hookify" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
   esac
   ```

3. **Last activity 시각 결정 (D-06; absolute timestamp only).**
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
   상대시각 환산 (예: `N 일 전`/`N hr 전` 형식) 절대 금지 — D-06 lock. 절대시각 그대로 사용.

4. **NEXT_PHASE 계산 + Next 명령 매핑 (D-04 Next 라인; Phase 2 D-28 lock).**

   `skills/sg-status/SKILL.md` lines 62-74 + lines 78-99 두 블록을 글자 그대로 복제 (drift 시 양쪽 동시 수정):
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
         NEXT_CMD="/super-gsd:sg-plan $PHASE_NUM"
       else
         NEXT_CMD="/super-gsd:sg-plan"
       fi
       ;;
     gsd-plan)    NEXT_CMD="/super-gsd:sg-execute" ;;
     superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
     parallel)    NEXT_CMD="/super-gsd:sg-review" ;;
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
     review)      NEXT_CMD="/super-gsd:sg-learn" ;;
     sg-retro)    NEXT_CMD="/super-gsd:sg-ship" ;;
     hookify)     NEXT_CMD="/super-gsd:sg-ship" ;;
     ship)
       if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
         NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="/super-gsd:sg-complete"
       fi
       ;;
     complete) NEXT_CMD="/super-gsd:sg-new" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

5. **5개 라인 emit + AskUserQuestion 3-옵션 분기 (D-04, D-05, D-10, D-12, D-13, D-14, D-15, D-16; SESS-02/03/04).**

   안내 헤더 + 5개 라인 출력 (헤더와 5개 라인 사이 빈 줄 1개, 5개 라인 사이 빈 줄 없음):
   ```
   Existing session detected.

   Milestone: <MILESTONE_DISPLAY>
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last activity: <LAST_ACTIVITY_DISPLAY>
   Next: <NEXT_CMD>
   ```

   AskUserQuestion 호출 (header `Session`, 3 옵션 — D-12 라벨 lock):
   ```
   AskUserQuestion(
     questions: [{
       question: "Existing session detected. What do you want to do?",
       header: "Session",
       multiSelect: false,
       options: [
         { label: "Resume", description: "Show next command and exit. You will run the next command yourself." },
         { label: "Start new milestone", description: "Delegate to gsd-new-milestone Skill." },
         { label: "Cancel", description: "Exit without changes." }
       ]
     }]
   )
   ```

   응답 분기:
   - **Resume** (D-08, D-16): 추가 출력 없음, 종료. 자동 Skill invoke 절대 금지 (D-09 hybrid handoff 차용 안 함 — 사용자가 위 Next 라인을 보고 직접 실행).
   - **Start new milestone** (D-14):
     ```
     Skill(skill="gsd-new-milestone", args="")
     ```
     args는 **빈 문자열** — `$ARGUMENTS` 사용 금지 (D-14 lock).
   - **Cancel** (D-15): 단일 라인 `Cancelled. No changes made.` emit 후 종료. 어떤 파일도 read/write 하지 않는다.

   세 분기 모두 `.planning/HANDOFF.md`를 read-only로만 접근 (D-16; SESS-04 자연 충족). HANDOFF.md 삭제/수정/append 절대 금지.

6. **D-17 fallback 분기 (`EXISTING_SESSION=0`).**

   STATE.md 미감지 또는 `^Phase:` 라인 캡처 실패 시 기존 동작 그대로 호출:
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```
   `$ARGUMENTS` 패스스루 유지 (후방 호환). 추가 출력 없음.
</process>

<success_criteria>
1. STATE.md/HANDOFF.md를 읽어 기존 세션을 감지하고 5개 라인(Milestone / Phase / Stage / Last activity / Next)을 emit 후 AskUserQuestion 3-옵션을 표시한다 (SESS-01, SESS-02).
2. Resume 선택 시 추가 Skill invoke 없이 emit-only로 종료하며, 사용자가 Next 라인의 명령을 직접 실행한다 (SESS-03; D-08, D-09).
3. Start new milestone 선택 시 `Skill(skill="gsd-new-milestone", args="")` (args 빈 문자열)을 호출하고, Cancel 선택 시 `Cancelled. No changes made.` 단일 라인 emit 후 종료한다 (D-14, D-15).
4. 세 옵션 모두 `.planning/HANDOFF.md`를 read-only로만 접근 — 삭제/수정/append 없음 (SESS-04; D-16).
5. STATE.md 미감지 또는 `^Phase:` 라인 캡처 실패 시 기존 동작 그대로 `Skill(skill="gsd-new-project", args="$ARGUMENTS")`를 호출한다 (D-17 후방 호환).
</success_criteria>
