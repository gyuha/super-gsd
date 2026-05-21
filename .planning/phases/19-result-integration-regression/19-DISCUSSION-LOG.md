# Phase 19: 결과 통합 + 호환성 회귀 테스트 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 19-result-integration-regression
**Areas discussed:** A. HANDOFF.md 기록 타이밍, B. 호환성 회귀 테스트 방법

---

## A. HANDOFF.md 기록 타이밍

| Option | Description | Selected |
|--------|-------------|----------|
| 옵션 1 | Step 8을 순차 경로 전용으로 이동 + 병렬 완료 후 별도 append | |
| 옵션 2 | Step 8 유지 + `To` 셀에 `parallel` 표기 | ✓ |
| 옵션 3 | 현재 Step 8 그대로 유지 + TE-04a 해석 변경 (변경 없음) | |

**User's choice:** 옵션 2 — `To` 셀 분기만 적용 (옵션 2 + TE-04a의 핵심 해석은 옵션 3과 동일)
**Notes:**
- TE-04a의 실질적 목적은 race condition 방지. "완료 후 기록"은 구현 디테일이 아니라 의도 설명으로 해석.
- Phase 18에서 에이전트 측 HANDOFF.md 쓰기 금지가 이미 구현되어 TE-04a 충족.
- `To: superpowers`가 병렬 경로에서 부정확하므로 `To: parallel`로 분기하는 1줄 수정만 적용.
- Step 8을 이동하거나 완료 후 별도 append 로직 추가는 하지 않음 (코드 변경 최소화).

---

## B. 호환성 회귀 테스트 방법

| Option | Description | Selected |
|--------|-------------|----------|
| 옵션 1 | 수동 테스트 시나리오 문서화 (PLAN.md 체크리스트) | |
| 옵션 2 | 픽스처 PLAN.md + 로직 추적 (정적 코드 리뷰 방식) | |
| 옵션 3 | Step 8.5 로그 강화(`[TE-05a]` 태그) + 임시 픽스처 smoke test | ✓ |

**User's choice:** 옵션 3
**Notes:**
- TE-05a 로그에 태그 추가는 1줄 변경으로 요건 추적 가능.
- smoke test는 픽스처를 임시 생성/확인/삭제하는 시퀀스로 처리 (프로젝트에 체크인 불필요).
- TE-05b는 코드 diff로 검증 — Phase 17~18에서 수정된 파일 목록을 확인하여 Step 0~7이 변경되지 않았음 확인.

---

## C. parallel_groups.json 정리 (사전 결정)

사용자가 논의 시작 전 결정:
- `parallel_groups.json` 정리 없음 — 디버깅/감사 목적으로 유지.

---

## Claude's Discretion

- Step 8을 물리적으로 이동할지, `HANDOFF_TO` 변수만 추가할지 — `HANDOFF_TO` 변수 방식 권장 (변경 범위 최소).
- smoke test에서 실제 `Skill()` 호출을 막는 방법 — 구현 시 가장 단순한 방법 선택.

## Deferred Ideas

- `To: parallel` 완료 행 별도 추가 — 현재 단일 행으로 충분, v1.5 이후 검토.
- worktree 격리, 자동 재시도, GROUP_COUNT > 3 고도화 — REQUIREMENTS.md에 v1.4 이후 명시 연기.
