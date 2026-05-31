# Phase 47: sg-execute TDD 주입 + sg-review 실패 루프 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 47-tdd-inject-fail-loop
**Areas discussed:** 마커/카운터 파일 분리, sg-execute 재시도 경로, TDD 주입 범위, sg-review 검증, 실패 루프, 카운터 리셋, .agents 미러, 플랜 분할

> **참고:** 이 단계의 모호성은 discuss-phase 진입 전 사용자/팀의 사전 그릴링으로 모두 해소되었다. 8개 영역 모두 LOCKED 상태로 전달되어 인터랙티브 질문(AskUserQuestion) 없이 CONTEXT.md에 직접 반영했다. 아래는 각 영역에서 고려된 대안과 확정 선택의 감사 기록이다.

---

## 마커/카운터 파일 분리

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 파일 | `USE-TDD` 마커에 카운터·피드백도 함께 저장 | |
| 파일 분리 | `USE-TDD`(presence-only) + `USE-TDD-RETRY`(카운터+피드백) | ✓ |

**User's choice:** 파일 분리 (D-01)
**Notes:** presence-only 마커의 의미론을 오염시키지 않기 위해 카운터/피드백을 별도 `.planning/USE-TDD-RETRY`로 분리.

---

## sg-execute 재시도 경로

| Option | Description | Selected |
|--------|-------------|----------|
| 멱등 체크 유지 | 같은 plan hash면 재실행 차단 (기존 Step 7) | |
| 재시도 시 우회 | `USE-TDD-RETRY` 존재 시 Step 7 SKIP + 이전 FAIL 피드백 주입 | ✓ |

**User's choice:** 재시도 시 우회 (D-02)
**Notes:** 파일 부재 = 정상/신규 실행 = 기존 동작 완전 불변(비침투).

---

## TDD 주입 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 순차만 | `executing-plans` 순차 핸드오프에만 주입 | ✓ |
| 순차+병렬 | sg-parallel-execute 경로에도 주입 | |

**User's choice:** 순차만 (D-03)
**Notes:** 요건은 순차 핸드오프만 명시. 병렬 TDD는 Future로 분류.

---

## sg-review TDD 검증

| Option | Description | Selected |
|--------|-------------|----------|
| 테스트 러너 자동 감지 | jest/pytest/go test 등 자동 실행·판정 | |
| 리뷰 subagent 위임 | PASS/FAIL 판정을 코드 리뷰 subagent에 위임 | ✓ |

**User's choice:** 리뷰 subagent 위임 (D-04)
**Notes:** REVIEW-F1 — 자동 감지는 비침투 원칙상 별도 검토. v2.11은 리뷰 신호에 위임.

---

## 실패 루프

| Option | Description | Selected |
|--------|-------------|----------|
| 무제한 재시도 | FAIL이면 계속 재실행 | |
| 제한 루프(2회) | count < 2면 확인 후 재실행, count == 2면 보고 후 중단 | ✓ |

**User's choice:** 제한 루프 2회 (D-05)
**Notes:** requesting-code-review는 non-terminal — 결과 반환 후 sg-review가 FAIL 감지·분기. 승인 시 count+1·피드백 기록 후 재호출. 거절/한도초과 시 중단.

---

## 카운터 리셋

| Option | Description | Selected |
|--------|-------------|----------|
| PASS만 삭제 | PASS 시에만 `USE-TDD-RETRY` 삭제 | |
| PASS+한도초과 삭제 | PASS 및 한도 초과 중단 시 모두 삭제 | ✓ |

**User's choice:** PASS+한도초과 삭제 (D-06)
**Notes:** 한도 초과 중단 후 사용자가 PLAN을 고쳐 깨끗하게 재시작 가능.

---

## .agents 미러

| Option | Description | Selected |
|--------|-------------|----------|
| 본체만 | Claude Code 스킬만 수정 | |
| pairwise 미러 + 프로즈 폴백 | 양쪽 .agents 미러도 같은 커밋, AskUserQuestion → 프로즈 안내 | ✓ |

**User's choice:** pairwise 미러 + 프로즈 폴백 (D-07)
**Notes:** AskUserQuestion 미지원 플랫폼은 자동 재호출 대신 수동 안내 보고.

---

## 플랜 분할

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 플랜 | 한 PLAN에 sg-execute + sg-review | |
| 2개 플랜 | Plan 01 = sg-execute, Plan 02 = sg-review | ✓ |

**User's choice:** 2개 플랜 권고 (D-08)
**Notes:** 최종 분할은 plan-phase 재량.

---

## Claude's Discretion

- 핸드오프 주입 섹션 마크다운 문구, `USE-TDD-RETRY` 직렬화 포맷, bash vs Read-도구 비율, AskUserQuestion 옵션 라벨 — 구현자 재량.
- macOS/Linux 셸 이식성 + 사용자-언어 산문 출력은 필수 준수.

## Deferred Ideas

- 병렬 경로 TDD 주입 (Future)
- README/README.ko TDD 문서화 (Phase 48, DOC-01/02)
- 프로젝트별 테스트 러너 자동 감지 (REVIEW-F1, Future)
- TDD 모드 시 sg-plan 테스트 시나리오 자동 생성 (TDD-F1, Future)
