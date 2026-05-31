# Phase 47 — Plan 02 Summary: sg-review TDD 검증 + 실패 루프

**Completed:** 2026-06-01
**Requirements:** REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04

## What was changed

`skills/sg-review/SKILL.md` (primary) + `.agents/skills/sg-review/SKILL.md` (mirror), 한 커밋 (pairwise D-08).

### Primary `skills/sg-review/SKILL.md`
- **Terminal-notation 정정 (D-05):** line 158 "terminal Skill ... last possible point" → "dispatches a Task subagent and **returns control** ... a post-review step (Step 5) runs after it". line 178 "no steps execute after this point" → "**returns control** ... proceed to Step 5". HANDOFF 기록 동작은 보존.
- **TDD 검증 주입 (D-04):** Step 4에 `[ -f .planning/USE-TDD ]` 게이트 + `## TDD Verification` 섹션(리뷰 subagent가 `TESTS: PASS`/`TESTS: FAIL` 명시) args 블롭에 조건부 append. 마커 부재 시 블롭 불변. 테스트 러너 자동 감지 없음(REVIEW-F1 Future).
- **Step 5 post-review 실패 루프 (D-05/D-06):** USE-TDD 게이트. PASS → `rm -f USE-TDD-RETRY` 종료. FAIL → count 읽기(`head -1 | tr -dc '0-9'`, 부재 시 0):
  - count < 2 → AskUserQuestion(재실행?) → 승인 시 count+1·피드백 기록 후 `Skill(sg-execute, $PHASE_NUM)` 재호출 / 거절 시 중단(파일 보존)
  - count == 2 → "limit exceeded" 보고 + `rm -f USE-TDD-RETRY` + 질문 없이 중단

### Mirror `.agents/skills/sg-review/SKILL.md`
- TDD 검증(D-04 adapted): USE-TDD 게이트, FAIL → 기존 `revision-required` verdict에 매핑.
- **Prose-halt 폴백 (D-07/REVIEW-04):** verdict가 `revision-required` AND USE-TDD 있을 때 step f에서 "tests FAILED — re-run `$sg-execute` to fix ..." 산문 출력. **AskUserQuestion 없음, auto-recall 없음, USE-TDD-RETRY 카운팅 없음** (Platform Constraints 일관).

## 직렬화 일치 (47-01 규약 준수)

47-01-SUMMARY가 기록한 규약 그대로:
- writer(sg-review): `{ printf '%s\n' "$NEW_COUNT"; printf '%s\n' "$REVIEW_FAIL_FEEDBACK"; } > .planning/USE-TDD-RETRY` (line 1 = count, lines 2+ = feedback)
- reader(sg-review count): `head -1 | tr -dc '0-9'`
- reader(sg-execute feedback, 47-01): `tail -n +2`
- 스모크 테스트로 round-trip 확인: write→count=1 읽기 OK, feedback 본문 OK, 1→2 누적 후 limit 경로 진입 OK.

## Verification (PLAN `<verify>` + `<verification>` 전부 통과)

**primary:**
- Task1 PASS: terminal Skill 0건, "no steps execute" 0건, "returns control" 존재(2), pass/fail 지시 존재, USE-TDD 게이트 존재, 테스트러너 리터럴 0건, requesting-code-review 호출 무손상
- Task2 PASS: USE-TDD-RETRY + Skill(sg-execute) + AskUserQuestion + `rm -f USE-TDD-RETRY`(2건: PASS+limit) 존재, max-2 bound 존재, 루프 USE-TDD 게이트, grep -P 0건

**mirror:**
- PASS: USE-TDD + `$sg-execute` + FAILED 지시 존재, `AskUserQuestion(` 0건, grep -P 0건, Skill(sg-execute) auto-recall 0건, revision-required 매핑

## 비침투 보장

USE-TDD 부재 시: Step 4 args 블롭 불변, Step 5 루프는 `TDD_ON=false`로 즉시 종료(legacy 동작) → sg-review 기존 동작 유지. requesting-code-review 호출 자체는 변경 없음.

## Phase 47 완료

EXEC-01~03(47-01) + REVIEW-01~04(47-02) 모두 충족. 두 스킬이 `.planning/USE-TDD-RETRY` 파일로 상태를 주고받는 bounded(max 2) TDD 핸드셰이크 완성.
