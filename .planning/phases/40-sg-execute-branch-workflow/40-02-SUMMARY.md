---
plan: 40-02
phase: 40
slug: sg-execute-branch-workflow
requirement: TEAM-04
status: complete
completed: 2026-05-29
---

# 40-02 Summary: sg-phase complete — PR 안내 Step 4i 삽입

## 변경 파일

- `skills/sg-phase/SKILL.md` — Step 4i 삽입 (lines 92–106)

## .agents/ 쌍 처리

- `.agents/skills/sg-phase/` — NOT FOUND. pairwise 처리 불필요.

## 변경 내용

`skills/sg-phase/SKILL.md`의 `complete` route Step 4h (확인 출력) 바로 다음, `</process>` 태그 이전에 **Step 4i: PR creation guidance (TEAM-04)** 를 삽입했다.

### 삽입 로직

```bash
if command -v gh >/dev/null 2>&1; then
  # gh CLI 있음: gh pr create 명령 텍스트 출력
  echo "  gh pr create --base main --title \"phase/${PHASE_SLUG}\""
else
  # gh CLI 없음: git push 안내
  echo "  git push -u origin HEAD"
fi
```

### 설계 결정

| 항목 | 결정 |
|------|------|
| PR 자동 실행 | 없음 — 텍스트 출력만 |
| 출력 조건 | 조건 분기 없이 항상 출력 (단순성 우선) |
| gh CLI 판정 | `command -v gh >/dev/null 2>&1` |
| PR 타이틀 | `phase/${PHASE_SLUG}` (Step 4b에서 이미 계산된 값 재사용) |
| 출력 산문 | 사용자 언어 (`<language>` 지침 준수) |
| 명령어 토큰 | 영문 그대로 (`gh pr create`, `git push -u origin HEAD`) |

## Verification

```
grep -n "Step 4i|4i\."    → line 92  ✓
grep -n "command -v gh"   → line 94  ✓
grep -n "gh pr create"    → line 97  ✓
grep -n "git push -u origin HEAD" → line 101 ✓
순서: 4h(90) → 4i(92) → </process>(107)  ✓
```
