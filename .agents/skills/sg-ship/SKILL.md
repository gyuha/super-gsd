---
name: sg-ship
description: Phase 작업을 main 브랜치에 병합하고 원격에 push한다 — GSD ship 폴백 또는 직접 git 병합 모드
argument-hint: "[phase] - optional. STATE.md 현재 phase 사용."
---

<objective>
Merge the completed phase branch into main and push. If GSD is installed, delegate to gsd-ship. Otherwise guide the user through a manual git merge + push + optional PR creation flow.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers 연동 불가: Claude Code 전용 도구
- SubagentStop 미지원: 단계 종료 시 자동 트리거 없음
- AskUserQuestion 미지원: 선택지를 텍스트로 출력하고 자유 입력을 받음
</constraints>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Writes a ship row to .planning/HANDOFF.md. Runs git commands to merge and push.
</execution_context>

<process>

**Step 1 — Resolve phase.**

```bash
if [ -n "$ARGUMENTS" ]; then
  PHASE_NUM="$ARGUMENTS"
else
  # Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
fi
if [ -z "$PHASE_NUM" ]; then
  echo "Could not resolve current phase. Pass phase number explicitly: $sg-ship <phase>"
  exit 1
fi
```

**Step 2 — Check for uncommitted changes.**

```bash
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "[sg-ship] Uncommitted changes detected. Commit or stash before shipping."
  git status --short
  exit 1
fi
```

**Step 3 — Detect current branch and base branch.**

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
[ -z "$BASE_BRANCH" ] && BASE_BRANCH="main"
echo "[sg-ship] Current branch: $CURRENT_BRANCH"
echo "[sg-ship] Target base: $BASE_BRANCH"
```

**Step 4 — Check GSD availability and branch.**

```bash
if command -v gsd-sdk >/dev/null 2>&1 || [ -d "$HOME/.claude/get-shit-done" ]; then
  GSD_AVAILABLE=1
else
  GSD_AVAILABLE=0
fi
```

**Step 5 — Ship.**

**GSD 있는 경우 (주 경로):**

Skill(skill="gsd-ship", args="$PHASE_NUM")을 호출하고 세션 제어를 이전한다.

**GSD 없는 경우 (직접 git 병합 모드):**

현재 작업 유형을 선택지로 출력하고 사용자 입력을 기다린다:

```
[sg-ship] 직접 git 병합 모드 (GSD 미설치)

Phase ${PHASE_NUM} 배포 방법을 선택하세요:
1) ${BASE_BRANCH}에 로컬 병합
2) Push 후 Pull Request 생성 (gh CLI 필요)
3) 현재 상태 유지 (나중에 수동 처리)

번호를 입력하세요:
```

**Option 1 — 로컬 병합:**

```bash
git checkout "$BASE_BRANCH" && git pull origin "$BASE_BRANCH" && git merge "$CURRENT_BRANCH" || {
  echo "[sg-ship] merge 실패 — push 취소."
  exit 1
}
# 테스트 실행 (있는 경우) — 실패 시 push 차단
TEST_FAILED=0
if [ -f "package.json" ] && grep -q '"test"' package.json 2>/dev/null; then
  npm test || TEST_FAILED=1
elif [ -f "Makefile" ] && grep -q '^test' Makefile 2>/dev/null; then
  make test || TEST_FAILED=1
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  pytest 2>&1 || TEST_FAILED=1
fi
if [ "$TEST_FAILED" -eq 1 ]; then
  echo "[sg-ship] 테스트 실패 — push 취소. 실패를 수정한 뒤 다시 실행하세요."
  exit 1
fi
git push origin "$BASE_BRANCH"
echo "[sg-ship] Phase ${PHASE_NUM} 병합 완료. 브랜치 정리: git branch -d ${CURRENT_BRANCH}"
```

**Option 2 — PR 생성:**

```bash
git push -u origin "$CURRENT_BRANCH"
gh pr create \
  --title "Phase ${PHASE_NUM} implementation" \
  --body "## Summary
Phase ${PHASE_NUM} implementation complete.

## Test Plan
- [ ] Verify acceptance criteria from PLAN.md
- [ ] Confirm success_criteria pass"
```

**Option 3 — 유지:**

```
[sg-ship] 브랜치 ${CURRENT_BRANCH} 유지. 준비되면 수동으로 병합하세요.
```

**Step 6 — HANDOFF.md 기록.**

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if echo "$PHASE_NUM" | grep -qE '\.'; then
  PHASE_PAD="$PHASE_NUM"
else
  PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
fi
PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM}"
# Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE (default "review" if empty).
[ -z "$FROM_STAGE" ] && FROM_STAGE="review"
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | ship | - |" >> "$HANDOFF_FILE"
```

**Step 7 — 완료 안내.**

```
Phase ${PHASE_NUM} 배포 완료. 다음 단계: $sg-plan <next-phase>
또는 마지막 phase이면: $sg-status 로 현재 상태 확인
```

</process>

<success_criteria>
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
2. 커밋되지 않은 변경 사항이 있으면 병합을 거부한다.
3. GSD 있으면 gsd-ship Skill로 위임한다.
4. GSD 없으면 3가지 선택지를 텍스트로 출력하고 사용자 입력에 따라 처리한다.
5. HANDOFF.md에 `ship` 행이 기록된다.
6. decimal phase (7.1 형태)를 올바르게 처리한다.
</success_criteria>
