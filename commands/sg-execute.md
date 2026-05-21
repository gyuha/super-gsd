---
name: sg-execute
description: Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---

<objective>
Package the current phase's PLAN.md bodies, REQUIREMENTS.md REQ-ID mapping, and ROADMAP.md success criteria into a single Superpowers-ready prompt and auto-invoke the `superpowers:executing-plans` Skill with it. When PLAN.md files contain `wave:` fields forming 2+ independent groups, routes to `sg-parallel-execute` instead and records `To: parallel` in HANDOFF.md. Append a timestamped row to `.planning/HANDOFF.md` describing the handoff. The append is skipped when `(phase, to=superpowers or parallel)` was already handed off and the plan hash is unchanged, so re-running on an unchanged plan is idempotent.
</objective>

<execution_context>
This command is self-contained — no external workflow files imported. Reads .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, .planning/phases/<phase>/*-PLAN.md, .planning/HANDOFF.md.
</execution_context>

<process>
0. **Lessons reminder.** .planning/lessons/ 에 파일이 있으면 weighted top-N 한 줄 요약을 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
     echo "=== Top Recurring Patterns (reminder) ==="
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
       try:
           d = json.loads(line)
           print(f\"{i}. [score {d['score']:.2f}] {d['pattern']}\")
       except Exception:
           pass
   " || true
     echo "============================================"
   fi
   ```
   파일이 없으면 조용히 건너뛴다.

1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md` by grepping the `## Current Position` section for `Phase: <N>`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')
   fi
   ```
   If extraction fails, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>` and exit.

2. **Locate phase directory.** Glob `.planning/phases/<phase>-*` (with zero-padded two-digit prefix support). Example:
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     # Try unpadded match for decimal phases
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   ```
   If no directory matches, print: `No phase directory matches '<phase>' under .planning/phases/. Run /super-gsd:sg-plan first.` and exit.

3. **Extract phase meta.** From `.planning/ROADMAP.md`, grep:
   - `### Phase <N>: <Name>` header to get `PHASE_NAME`.
   - The `**Goal**:` line immediately following the header to get `GOAL`.
   - The numbered list under `**Success Criteria**` to get the SC items.
   - The `**Requirements**:` line to get the REQ-ID list.
   ```bash
   PHASE_HEADER=$(grep -n "^### Phase ${PHASE_NUM}:" .planning/ROADMAP.md | head -1)
   if [ -z "$PHASE_HEADER" ]; then
     PHASE_HEADER=$(grep -n "^### Phase ${PHASE_PAD}:" .planning/ROADMAP.md | head -1)
   fi
   if [ -z "$PHASE_HEADER" ]; then
     echo "No '### Phase ${PHASE_NUM}:' header found in .planning/ROADMAP.md. Aborting."
     exit 1
   fi
   PHASE_NAME=$(echo "$PHASE_HEADER" | sed 's/.*Phase [0-9]*: //')
   HEADER_LINE=$(echo "$PHASE_HEADER" | cut -d: -f1)

   GOAL=$(awk "NR>${HEADER_LINE} && /^\*\*Goal\*\*:/{sub(/^\*\*Goal\*\*:[[:space:]]*/,\"\"); print; exit}" .planning/ROADMAP.md)
   REQ_IDS=$(awk "NR>${HEADER_LINE} && /^\*\*Requirements\*\*:/{match(\$0,/: (.*)/,a); print a[1]; exit}" .planning/ROADMAP.md)
   REQ_IDS_CLEAN=$(echo "$REQ_IDS" | sed 's/([^)]*)//g' | tr -d ' ' | tr ',' ' ')

   # Success Criteria: collect numbered items after **Success Criteria** until next ** section
   SC_TEXT=$(awk "NR>${HEADER_LINE}" .planning/ROADMAP.md | awk '/^\*\*Success Criteria\*\*/{found=1; next} found && /^\*\*/{exit} found && /^[[:space:]]*[0-9]+\./{print}')
   ```

4. **Map REQ-IDs to one-line definitions.** For each REQ-ID, grep `.planning/REQUIREMENTS.md` for the bullet starting with `**<REQ-ID>**:` and extract the one-line description:
   ```bash
   for REQ in $REQ_IDS_CLEAN; do
     grep -E "\*\*${REQ}\*\*:" .planning/REQUIREMENTS.md | head -1
   done
   ```

5. **Collect PLAN.md bodies.** Read every `*-PLAN.md` file in `$PHASE_DIR` (sorted numerically). Wrap each file body inside a fenced code block tagged ` ```markdown ` and prefix it with a `### <filename>` header.

6. **Compute Plan Hash.** Concatenate all `*-PLAN.md` bodies and compute the first 7 characters of the sha256 digest. Use `shasum -a 256` on macOS with a `sha256sum` fallback:
   ```bash
   PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
   if [ -z "$PLAN_HASH" ]; then
     PLAN_HASH="nodata"
   fi
   ```

7. **Idempotency check.** Inspect `.planning/HANDOFF.md` for the latest row whose `Phase` cell matches `$PHASE_NUM` and whose `To` cell equals `superpowers` or `parallel`. Extract the recorded Plan Hash and compare it to `$PLAN_HASH`:
   ```bash
   EXISTING_HASH=$(grep -E "^\| [^|]+ \| (${PHASE_PAD}|${PHASE_NUM})-[^|]* \| [^|]+ \|[[:space:]]*(superpowers|parallel)[[:space:]]*\|" .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$6); print $6}')
   if [ -n "$EXISTING_HASH" ] && [ "$EXISTING_HASH" = "$PLAN_HASH" ]; then
     echo "Already handed off Phase $PHASE_NUM to superpowers or parallel (plan hash matches: $PLAN_HASH). Skipping append. Use /super-gsd:sg-status to inspect, or modify a PLAN.md to re-handoff."
     exit 0
   fi
   ```
   If the Plan Hash differs from the recorded one, a new row is permitted (PLAN.md changed since the last handoff).

7.5. **HANDOFF.md 자동 초기화.** 파일이 없거나 헤더 행이 없으면 파일을 생성한다:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

8. **Append HANDOFF.md row (변수 계산).** HANDOFF_TO는 Step 8.5 완료 후 결정되므로, 이 단계에서는 메타 변수만 계산한다:
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   FROM_STAGE=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
   if [ -z "$FROM_STAGE" ]; then
     FROM_STAGE="init"
   fi
   PHASE_SLUG=$(basename "$PHASE_DIR")
   ```

8.5. **PLAN.md 의존성 분석.** 모든 PLAN.md에서 wave/depends_on/files_modified를 파싱하여 독립 병렬 그룹(PARALLEL_GROUPS)을 계산하고 JSON 파일로 저장한다.

   ```bash
   PARALLEL_GROUPS=""
   GROUP_COUNT=0
   GROUPS_JSON_FILE="$PHASE_DIR/parallel_groups.json"

   # wave 필드 존재 여부 확인 (하나라도 있으면 분석 진행)
   HAS_WAVE=$(grep -rl '^wave:' "$PHASE_DIR"/*-PLAN.md 2>/dev/null | head -1)

   if [ -z "$HAS_WAVE" ]; then
     echo "[TE-05a] wave 필드 없음 — 기존 순차 실행 경로 유지. v1.3 이전 동작 보존."
   else
     # 각 PLAN.md에서 wave 번호와 files_modified 추출
     # 결과: "wave|planfile|file1,file2,..."
     PLAN_WAVE_FILES=""
     for PLAN_FILE in "$PHASE_DIR"/*-PLAN.md; do
       PLAN_BASE=$(basename "$PLAN_FILE")
       WAVE_NUM=$(grep -E '^wave:' "$PLAN_FILE" | head -1 | sed 's/wave:[[:space:]]*//')
       if [ -z "$WAVE_NUM" ]; then
         WAVE_NUM="99"
       fi
       # files_modified 블록: "  - path/to/file" 형식 파싱 (YAML 목록, frontmatter 경계 보호)
       FILES_IN_PLAN=$(awk '/^---$/{if(front++>0) exit} /^files_modified:/{found=1; next} found && /^[[:space:]]*-[[:space:]]/{gsub(/^[[:space:]]*-[[:space:]]*/,""); printf "%s,", $0} found && /^[^[:space:]-]/{found=0}' "$PLAN_FILE" | sed 's/,$//')
       PLAN_WAVE_FILES="$PLAN_WAVE_FILES
   ${WAVE_NUM}|${PLAN_BASE}|${FILES_IN_PLAN}"
     done
     PLAN_WAVE_FILES=$(echo "$PLAN_WAVE_FILES" | grep -v '^$')

     # wave 값 목록 (중복 제거, 정렬)
     WAVE_NUMS=$(echo "$PLAN_WAVE_FILES" | awk -F'|' '{print $1}' | sort -n | uniq)

     # 각 wave별로 plan 목록과 files 수집
     # files_modified 교집합이 있는 plan은 같은 그룹으로 강제 병합
     GROUP_COUNT=0
     GROUPS_JSON="["
     FIRST_GROUP=1

     for W in $WAVE_NUMS; do
       # 이 wave의 plan들
       WAVE_PLANS=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v w="$W" '$1==w {print $2}')
       WAVE_FILES=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v w="$W" '$1==w {print $3}')

       PLAN_COUNT=$(echo "$WAVE_PLANS" | grep -c '.')

       ALL_FILES_RAW=$(echo "$WAVE_FILES" | tr ',' '\n' | grep -v '^$')
       DUP_FILES=$(echo "$ALL_FILES_RAW" | sort | uniq -d)

       if [ -n "$DUP_FILES" ] && [ "$PLAN_COUNT" -gt 1 ]; then
         MERGED_PLANS=""
         SOLO_PLANS=""
         while IFS= read -r pline; do
           FILES_OF=$(echo "$PLAN_WAVE_FILES" | awk -F'|' -v p="$pline" '$2==p {print $3}' | tr ',' '\n')
           HAS_DUP=""
           while IFS= read -r df; do
             if echo "$FILES_OF" | grep -qxF "$df"; then
               HAS_DUP=1
               break
             fi
           done <<DUPEOF
   $(echo "$DUP_FILES")
   DUPEOF
           if [ -n "$HAS_DUP" ]; then
             MERGED_PLANS="$MERGED_PLANS $pline"
           else
             SOLO_PLANS="$SOLO_PLANS $pline"
           fi
         done <<WAVEEOF
   $(echo "$WAVE_PLANS")
   WAVEEOF

         if [ -n "$MERGED_PLANS" ]; then
           PLANS_JSON=$(echo "$MERGED_PLANS" | tr ' ' '\n' | grep -v '^$' | awk '{printf "\"%s\",", $0}' | sed 's/,$//')
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[${PLANS_JSON}],\"merged\":true}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         fi
         for SP in $SOLO_PLANS; do
           [ -z "$SP" ] && continue
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[\"${SP}\"],\"merged\":false}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         done
       else
         while IFS= read -r pline; do
           [ -z "$pline" ] && continue
           [ "$FIRST_GROUP" -eq 0 ] && GROUPS_JSON="$GROUPS_JSON,"
           GROUPS_JSON="$GROUPS_JSON{\"wave\":${W},\"plans\":[\"${pline}\"],\"merged\":false}"
           GROUP_COUNT=$((GROUP_COUNT + 1))
           FIRST_GROUP=0
         done <<WAVEEOF
   $(echo "$WAVE_PLANS")
   WAVEEOF
       fi
     done

     GROUPS_JSON="$GROUPS_JSON]"

     if [ "$GROUP_COUNT" -lt 2 ]; then
       echo "병렬 그룹 감지 안됨 — 기존 순차 실행"
       rm -f "$GROUPS_JSON_FILE"
     else
       PARALLEL_GROUPS="$GROUPS_JSON"
       printf '%s\n' "$GROUPS_JSON" > "$GROUPS_JSON_FILE"
       echo "병렬 그룹 ${GROUP_COUNT}개 감지 — parallel_groups.json 저장 완료"
     fi
   fi

   # HANDOFF_TO 결정 및 HANDOFF.md 기록
   if [ -n "$PARALLEL_GROUPS" ]; then
     HANDOFF_TO="parallel"
   else
     HANDOFF_TO="superpowers"
   fi
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | $HANDOFF_TO | $PLAN_HASH |" >> .planning/HANDOFF.md
   ```

9. **Build prompt and invoke Skill.**

   **라우팅 분기.** Step 8.5에서 계산된 `PARALLEL_GROUPS` 변수를 확인한다:
   - `PARALLEL_GROUPS`가 비어 있지 않으면 (독립 그룹 2개 이상): `sg-parallel-execute` 스킬로 라우팅한다 (Phase 18에서 구현).
   - `PARALLEL_GROUPS`가 비어 있으면: 기존 순차 실행 경로(`superpowers:executing-plans`)를 그대로 사용한다.

   ```bash
   if [ -n "$PARALLEL_GROUPS" ]; then
     echo "=== 병렬 실행 경로 선택: ${GROUP_COUNT}개 그룹 감지 ==="
     Skill(skill="sg-parallel-execute", args="$GROUPS_JSON_FILE")
     return
   fi
   ```

   Assemble a single markdown blob in this exact order (English labels only):
   ```
   # Superpowers Execution Handoff — Phase <N> (<PHASE_NAME>)

   ## Goal
   <GOAL>

   ## Success Criteria
   1. ...
   2. ...

   ## Requirements
   - <REQ-ID>: <one-line definition>
   ...

   ## Plans

   ### <plan-filename-1>
   ```markdown
   <full PLAN.md body>
   ```

   ### <plan-filename-2>
   ```markdown
   <full PLAN.md body>
   ```

   ## Instruction to Superpowers
   Execute the plans above using the superpowers:executing-plans skill. Treat each PLAN.md as the authoritative source of tasks and acceptance criteria.
   ```
   Display the prompt blob to the user. Then print exactly:
   `Handoff complete. HANDOFF.md updated; superpowers:executing-plans invoked. Use /super-gsd:sg-status to inspect workflow state.`
   Then invoke the Skill tool — no confirmation prompt. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="superpowers:executing-plans", args="<the prompt blob above>")
   ```
</process>

<success_criteria>
0. .planning/lessons/ 에 파일이 있으면 Step 0 reminder가 Step 1(phase resolve)보다 먼저 출력된다. 파일이 없으면 Step 0이 조용히 건너뛰어진다.
1. The prompt blob shown to the user contains the Phase number, Goal, Success Criteria list, all REQ-IDs with their one-line definitions, and the full body of every `*-PLAN.md` in the phase directory.
2. The `superpowers:executing-plans` Skill is invoked exactly once per run when PARALLEL_GROUPS is empty, zero times when the idempotency check short-circuits, or `sg-parallel-execute` is invoked instead when PARALLEL_GROUPS is non-empty (parallel path).
3. `.planning/HANDOFF.md` gains at most one new row per run, and that row matches the 5-column schema `| Timestamp | Phase | From | To | Plan Hash |`.
4. Re-running the command with an unchanged plan hash produces the `Already handed off ...` message and appends no row.
</success_criteria>
