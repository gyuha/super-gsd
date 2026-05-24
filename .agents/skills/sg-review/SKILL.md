---
name: sg-review
description: 변경 파일 코드 리뷰를 직접 수행 — Superpowers 없이 prose 리뷰 모드
argument-hint: "[구현 내용 설명] - optional. 없으면 최근 커밋 메시지 사용."
---

<objective>
Perform a code review directly by reading changed files, checking against plan requirements and success criteria, then writing findings to a SUMMARY.md file. Superpowers:requesting-code-review is not available on this platform.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 불가: superpowers:requesting-code-review 스킬을 사용할 수 없습니다. Prose 리뷰 모드로 실행됩니다.
- SubagentStop 미지원: 완료 후 $sg-retro를 수동 실행하세요.
- AskUserQuestion 미지원
</constraints>

<execution_context>
Self-contained. Reads git history to derive BASE_SHA and HEAD_SHA, reads changed files, reads PLAN.md for requirements, writes SUMMARY.md.
</execution_context>

<process>
1. **Derive git range.**
   ```bash
   HEAD_SHA=$(git rev-parse HEAD)
   BASE_OVERRIDE=""
   # ARGUMENTS가 SHA 또는 sha..sha 범위인 경우 base override로 사용
   if printf '%s' "${ARGUMENTS:-}" | grep -qE '^[0-9a-f]{7,40}\.\.[0-9a-f]{7,40}$'; then
     BASE_SHA=$(printf '%s' "$ARGUMENTS" | cut -d. -f1)
     HEAD_SHA=$(printf '%s' "$ARGUMENTS" | sed 's/.*\.\.//')
     BASE_OVERRIDE="$ARGUMENTS"
   elif printf '%s' "${ARGUMENTS:-}" | grep -qE '^[0-9a-f]{7,40}$'; then
     BASE_SHA=$(git rev-parse "$ARGUMENTS" 2>/dev/null)
     if [ -z "$BASE_SHA" ]; then
       echo "Error: '$ARGUMENTS' is not a valid SHA."
       exit 1
     fi
     BASE_OVERRIDE="$ARGUMENTS"
   else
     BASE_SHA=$(git merge-base HEAD main 2>/dev/null \
       || git merge-base HEAD master 2>/dev/null \
       || git rev-parse HEAD~1 2>/dev/null \
       || git rev-parse HEAD)
   fi
   if [ "$BASE_SHA" = "$HEAD_SHA" ]; then
     echo "Error: BASE_SHA == HEAD_SHA — no commits to review."
     echo "Options:"
     echo "  1. Pass an explicit base SHA: sg-review <base-sha>"
     echo "  2. Pass a range: sg-review <base-sha>..<head-sha>"
     echo "  3. Run from a feature branch after committing your changes."
     exit 1
   fi
   echo "Reviewing: $BASE_SHA..$HEAD_SHA"
   ```

2. **Determine description.**
   ```bash
   # BASE_OVERRIDE가 설정된 경우 ARGUMENTS는 SHA이므로 설명으로 사용하지 않음
   if [ -n "$ARGUMENTS" ] && [ -z "$BASE_OVERRIDE" ]; then
     DESCRIPTION="$ARGUMENTS"
   else
     DESCRIPTION=$(git log --format=%s -1)
     DESCRIPTION="${DESCRIPTION:-(no commit message found)}"
   fi
   ```

3. **Read plan/requirements (best-effort).**
   ```bash
   PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
               | sed -E 's/^Phase:[[:space:]]*//' \
               | sed -E 's/[[:space:]]+$//' \
               | awk '{print $1}' \
               | grep -oE '^[0-9]+')
   if [ -n "$PHASE_NUM" ]; then
     PHASE_PAD=$(printf "%02d" "$PHASE_NUM")
     PLAN_FILE=$(ls .planning/phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)
   else
     PLAN_FILE=""
   fi
   if [ -n "$PLAN_FILE" ]; then
     PLAN_REQUIREMENTS=$(sed -n '/<objective>/,/<\/objective>/p' "$PLAN_FILE" 2>/dev/null | grep -v 'objective>')
   else
     PLAN_REQUIREMENTS="(no plan file found — review current HEAD changes)"
   fi
   ```

3.9. **HANDOFF.md에 review 행 기록.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_PAD_R=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG_R=$(ls -d .planning/phases/${PHASE_PAD_R}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG_R" ] && PHASE_SLUG_R="${PHASE_NUM:-unknown}"
   FROM_STAGE_R=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
   [ -z "$FROM_STAGE_R" ] && FROM_STAGE_R="init"
   echo "| $TS | $PHASE_SLUG_R | $FROM_STAGE_R | review | - |" >> "$HANDOFF_FILE"
   ```

4. **Prose 리뷰 직접 수행.**

   ```
   ## 코드 리뷰 실행

   리뷰 범위: $BASE_SHA..$HEAD_SHA
   구현 내용: $DESCRIPTION

   --- 리뷰 절차 ---
   ```

   아래 절차를 순서대로 실행한다:

   a. `git diff $BASE_SHA $HEAD_SHA --name-only`로 변경 파일 목록 확인
   b. 각 변경 파일을 Read 도구로 열어 내용 확인
   c. 다음 기준으로 리뷰 수행:
      - 명시된 requirements / success criteria 충족 여부
      - 로직 오류, 엣지케이스 누락
      - 기존 코드와의 일관성 (명명 규칙, 스타일)
      - 보안 취약점 (있는 경우)
   d. 리뷰 결과를 `.planning/phases/NN-*/NN-01-SUMMARY.md`에 기록:
      ```markdown
      # Phase N Review Summary

      ## What Was Implemented
      <DESCRIPTION>

      ## Git Range
      Base: <BASE_SHA>
      Head: <HEAD_SHA>

      ## Review Findings

      | severity | file | finding |
      |----------|------|---------|
      | high | path/to/file | description |
      | medium | path/to/file | description |
      | low | path/to/file | description |

      ## Verdict
      approved | approved-with-comments | revision-required

      ## Follow-up Actions
      - [ ] item
      ```
   e. 완료 후 출력:
      ```
      리뷰 완료. 결과: <VERDICT>
      다음 단계: /super-gsd:sg-learn
      ```
</process>

<success_criteria>
1. superpowers:requesting-code-review Skill 호출 없음 — 모든 리뷰를 직접 수행한다.
2. HANDOFF.md에 `review` 행이 기록된다.
3. 변경 파일을 Read 도구로 직접 읽어 리뷰를 수행한다.
4. 리뷰 결과가 SUMMARY.md에 기록된다.
5. 완료 후 /super-gsd:sg-learn 수동 실행을 안내한다.
6. Platform Constraints 블록에 Superpowers 연동 불가가 명시된다.
</success_criteria>
