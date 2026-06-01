---
name: sg-status
description: Display current workflow stage, last handoff timestamp, and next recommended command
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Inspect the current super-gsd workflow state. Read .planning/HANDOFF.md to determine the current stage, .planning/STATE.md for the current phase line (single source of truth), and .planning/ROADMAP.md only to detect whether a following phase exists. Output exactly three header lines, a blank line, and one "Next:" line. Fully independent — no GSD delegation needed.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- No Superpowers integration: this skill runs fully standalone
- SubagentStop not supported: no impact since this skill only displays workflow state
- AskUserQuestion not supported: no impact since this skill only produces output
</constraints>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Writes nothing.
</execution_context>

<process>
0. **`--team` 플래그 감지.** `$ARGUMENTS`에 `--team`이 포함되어 있으면 팀 현황 테이블을 출력하고 종료한다. 포함되지 않으면 이 Step을 건너뛰고 Step 1로 진행한다:
   ```bash
   if echo "$ARGUMENTS" | grep -qE '(^| )--team( |$)'; then
     HANDOFF_FILE=".planning/HANDOFF.md"

     # --- HANDOFF.md User 컬럼 기반 집계 ---
     # $7 = User 컬럼 (7번째 pipe-delimited 필드)
     # 컬럼 인덱스: $1=empty, $2=ts, $3=phase, $4=from, $5=to, $6=plan_hash, $7=user
     # 조건: 행이 타임스탬프로 시작하고, $7가 존재하며 공백 제거 후 "-"가 아닌 것
     TEAM_DATA=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" 2>/dev/null \
       | awk -F'|' '{
           gsub(/ /, "", $7);
           if ($7 != "" && $7 != "-") print $0
         }')

     if [ -n "$TEAM_DATA" ]; then
       # 팀원별 최신 행 1개 집계 (파일은 append-only이므로 마지막 등장이 최신)
       # 컬럼: $2=Timestamp, $3=Phase, $5=To(Stage), $7=User
       echo "## 팀 현황"
       echo ""
       printf '| 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |\n'
       printf '| ---- | --------- | --------- | ---------- |\n'
       echo "$TEAM_DATA" \
         | awk -F'|' '{
             gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2);
             gsub(/^[[:space:]]+|[[:space:]]+$/, "", $3);
             gsub(/^[[:space:]]+|[[:space:]]+$/, "", $5);
             gsub(/^[[:space:]]+|[[:space:]]+$/, "", $7);
             users[$7] = $2 "|" $3 "|" $5
           }
           END {
             for (u in users) {
               n = split(users[u], parts, "|");
               printf "| %s | %s | %s | %s |\n", u, parts[2], parts[3], parts[1]
             }
           }'
     else
       # Fallback: git log 작성자 집계
       GIT_LOG=$(git log --format="%an|%ai|%s" -20 2>/dev/null)
       if [ -n "$GIT_LOG" ]; then
         echo "## 팀 현황 (git log 기반 — HANDOFF User 컬럼 데이터 없음)"
         echo ""
         printf '| 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |\n'
         printf '| ---- | --------- | --------- | ---------- |\n'
         echo "$GIT_LOG" \
           | awk -F'|' '{
               gsub(/^[[:space:]]+|[[:space:]]+$/, "", $1);
               gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2);
               if (!seen[$1]++) {
                 printf "| %s | - | - | %s |\n", $1, substr($2, 1, 19)
               }
             }'
       else
         echo "팀 이력이 없습니다. sg-plan, sg-execute 등 sg-* 명령을 실행하면 이력이 쌓입니다."
       fi
     fi
     exit 0
   fi
   ```

1. **Read `Phase:` line verbatim from STATE.md.**

   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start replicates this block) ---
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
     case "$STAGE_RAW" in
       gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete|sg-next) ;;
       *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
     esac
     # sg-next is a meta-transition row; recover actual stage from FROM column ($4)
     if [ "$STAGE_RAW" = "sg-next" ]; then
       STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
       if [ "$STAGE_RAW" = "sg-next" ] || [ -z "$STAGE_RAW" ]; then
         SCAN_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
           | awk -F'|' 'BEGIN{last=""} {gsub(/ /,"",$5); if ($5 != "sg-next") last=$0} END{print last}')
         STAGE_RAW=$(echo "$SCAN_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
         TS=$(echo "$SCAN_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
         [ -z "$STAGE_RAW" ] && STAGE_RAW="init"
       fi
       # Re-validate after scan-back — corrupt HANDOFF.md data must not propagate
       case "$STAGE_RAW" in
         init|gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete) ;;
         *) echo "Scan-back recovered unknown stage '${STAGE_RAW}' — defaulting to init." >&2; STAGE_RAW="init" ;;
       esac
     fi
   fi

   # Storage → Display enum mapping
   case "$STAGE_RAW" in
     init)         STAGE_DISPLAY="init" ;;
     gsd-plan)     STAGE_DISPLAY="gsd" ;;
     ui-plan)      STAGE_DISPLAY="gsd" ;;
     superpowers)  STAGE_DISPLAY="superpowers" ;;
     parallel)     STAGE_DISPLAY="superpowers" ;;
     execute)      STAGE_DISPLAY="superpowers" ;;
     tdd)          STAGE_DISPLAY="superpowers" ;;
     review)       STAGE_DISPLAY="superpowers" ;;
     sg-retro)     STAGE_DISPLAY="sg-retro" ;;
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

4. **Compute next-phase number (for sg-retro/ship branches).**
   ```bash
   if [ "$STAGE_RAW" = "sg-retro" ] || [ "$STAGE_RAW" = "ship" ]; then
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

5. **Map stage to next command (`$sg-*` skill syntax for Codex/Gemini platforms).**
   ```bash
   case "$STAGE_RAW" in
     init)
       if [ -n "$PHASE_NUM" ]; then
         NEXT_CMD="\$sg-plan $PHASE_NUM"
       else
         NEXT_CMD="\$sg-plan"
       fi
       ;;
     gsd-plan)    NEXT_CMD="\$sg-execute" ;;
     ui-plan)     NEXT_CMD="\$sg-execute" ;;
     superpowers|parallel|execute|tdd|review)
       # Skip-aware routing for the implementation→ship segment (mirrors .agents/skills/sg-next/SKILL.md).
       #   tdd_mode (execute only) → $sg-tdd; skip_review → omit review; skip_learn → omit learn.
       # With all flags false/absent this reproduces the prior fixed routing exactly.
       NEXT_CMD=$(SG_STAGE="$STAGE_RAW" node -e 'let c={};try{c=(require("./.planning/config.json").super_gsd)||{}}catch(e){}var tdd=!!c.tdd_mode,sr=!!c.skip_review,sl=!!c.skip_learn,s=process.env.SG_STAGE,n;if(s==="execute"&&tdd){n="sg-tdd"}else if(s==="review"){n=sl?"sg-ship":"sg-learn"}else{n=sr?(sl?"sg-ship":"sg-learn"):"sg-review"}process.stdout.write("$"+n)' 2>/dev/null)
       [ -z "$NEXT_CMD" ] && NEXT_CMD="\$sg-review"
       ;;
     sg-retro)    NEXT_CMD="\$sg-ship" ;;
     ship)
       if [ "${NEXT_PHASE_EXISTS:-0}" = "1" ]; then
         NEXT_CMD="\$sg-plan $NEXT_PHASE"
       else
         NEXT_CMD="\$sg-complete"
       fi
       ;;
     complete) NEXT_CMD="\$sg-new" ;;
     *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
   esac
   ```

   Note: `execute` stage (Codex direct execution mode) routes to `$sg-review`. The `.agents/` mirror uses `$sg-*` skill invocation syntax instead of `/super-gsd:sg-*` slash commands because Codex/Gemini do not support Claude Code slash command namespaces.

6. **Render milestone & phase progress context (before the status block).** Read `.planning/ROADMAP.md` and `.planning/STATE.md`, then render two sections ABOVE the workflow-status block. Do not use fragile bash table parsing (`grep -P`, awk pipe-splitting) — read the files and render the tables directly.

   (a) **Milestones summary.** From ROADMAP.md `## Milestones`, render the checkbox list preserving each milestone's `[x]`/`[ ]` completion state, version ID (`vX.Y`), and date. The section heading and any prose are written in the user's language (per this skill's language-detection directive); version IDs, dates, and milestone names stay verbatim.

   (b) **Current-milestone phase table.** Read STATE.md's `milestone:` field (e.g. `v2.7`) to identify the current milestone, then from ROADMAP.md `## Progress` (columns `| Phase | Milestone | Plans Complete | Status | Completed |`) select ONLY the rows whose Milestone column equals the current milestone, and render them as a compact table. The table headers are written in the user's language; cell values (phase slug text, plan counts like `2/3`, status text, dates) stay verbatim from ROADMAP.

   **Localization rule:** prose and table headers → user's language. Machine tokens (milestone version IDs, command names, stage/status enum values, phase slugs, dates, timestamps) → verbatim in their source form.

   Emit these two sections first, then a single blank line, then the Step 7 status block.

7. **Print output (status block — final section).**

   Emit the following five lines as the LAST section, immediately after one blank line below the Step 6 sections. Keep the labels `Phase:`/`Stage:`/`Last handoff:`/`Next:` and all machine tokens in English (verbatim); do not localize this block:
   ```
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last handoff: <LAST_TS>

   Next: <NEXT_CMD>
   ```
</process>

<success_criteria>
1. Output is ordered: (a) a Milestones summary + a current-milestone phase table (selected from ROADMAP.md `## Progress` by STATE.md `milestone:`) appear FIRST, with prose and table headers in the user's language and all machine tokens (version IDs, slugs, status text, dates) verbatim; then (b) the workflow-status block appears LAST as the 5-line block with English labels and English machine tokens. The former "exactly 5 lines" lock is relaxed to permit the preceding milestone/phase sections.
2. If HANDOFF.md has no data rows, Stage=init and Last handoff=(none).
3. `$sg-*` skill invocation syntax is used in the NEXT_CMD mapping (Codex/Gemini do not support `/super-gsd:sg-*` slash commands).
4. `execute` stage routes to `$sg-review`.
5. STATE.md Phase parsing block is preserved (grep-sed-awk pipeline).
6. Fully standalone regardless of whether GSD is installed.
7. `$ARGUMENTS`에 `--team`이 포함된 경우, Step 0에서 팀 현황 테이블을 출력하고 `exit 0`으로 종료한다. 기존 Step 1~7은 실행되지 않는다.
8. `--team` 없이 실행하면 Step 0은 건너뛰고 기존 동작이 완전히 유지된다.
</success_criteria>
