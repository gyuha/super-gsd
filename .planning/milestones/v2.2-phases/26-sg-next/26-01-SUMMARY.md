---
phase: 26-sg-next
plan: 01
status: complete
completed: 2026-05-23
---

# Summary: Task 1 — skills/sg-next/SKILL.md 신규 생성

## Outcome

`skills/sg-next/SKILL.md` 생성 완료. 모든 automated checks PASS.

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `skills/sg-next/SKILL.md` | created | 188 |

## Verification Results

| Check | Result |
|-------|--------|
| `test -f skills/sg-next/SKILL.md` | PASS |
| `name: sg-next` frontmatter | PASS |
| `Use this when` description | PASS |
| `BEGIN STATE.md Phase parsing block` | PASS |
| `BEGIN HANDOFF.md stage detection block` | PASS |
| `BEGIN next-command routing block` | PASS |
| `sg-next \| -` HANDOFF append 행 | PASS |
| `AskUserQuestion` 존재 | PASS |
| `Cancelled. No changes made.` Cancel 분기 | PASS |
| D-07 복제 주석 3개 (`drift 시 양쪽 동시 수정`) | PASS |
| `grep -P` 미사용 (macOS 이식성) | PASS |
| 4개 블록 (`<objective>`, `<execution_context>`, `<process>`, `<success_criteria>`) | PASS |
| BEGIN/END 주석 쌍 3개 | PASS |

## Requirements Coverage

| REQ-ID | Covered by | Evidence |
|--------|-----------|----------|
| NEXT-01 | Step 1+2 | STATE.md Phase 파싱 + HANDOFF.md last row 파싱 |
| NEXT-02 | Step 3 | sg-status 동일 11분기 case 블록 복제 |
| NEXT-03 | Step 6 | `echo "→ $NEXT_CMD"` + 즉시 Skill() invoke |
| NEXT-04 | Step 5 | complete/init → AskUserQuestion + 취소 분기 |
| NEXT-05 | Step 4 | HANDOFF append (Skill() invoke 전) |

## Key Decisions Applied

- **D-01**: 중복 방지 없음 — 매번 invoke
- **D-02**: complete/init 모두 동일 AskUserQuestion 구조
- **D-03**: 실행 가능한 다음 명령 자체를 선택지로 제시
- **D-04**: HANDOFF append가 Skill() invoke 전에 위치 (Step 4 → Step 5/6 순서)
- **D-05**: sg-status SKILL.md에서 3개 블록 D-07 inline-replication으로 복제
- **D-06**: sg-status 출력 파싱 방식 불채택
