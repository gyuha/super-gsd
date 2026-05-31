# Phase 46: sg-use-tdd 토글 + 마커 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 46-sg-use-tdd 토글 + 마커
**Areas discussed:** 인자 의미론, 마커 파일 내용, 감사 로그 정책, 멀티플랫폼 미러

> 이 단계의 모든 그레이 에어리어는 discuss-phase 호출 **이전에** 사용자와 사전 그릴링으로 해소되어 LOCKED 상태로 전달되었다. 따라서 AskUserQuestion을 추가로 띄우지 않았고, 아래는 그릴링에서 확정된 대안과 선택을 기록한 것이다.

---

## 인자 의미론 (무인자 동작)

| Option | Description | Selected |
|--------|-------------|----------|
| 무인자 = 토글만 (상태 미출력) | 인자 없으면 조용히 토글 | |
| 무인자 = 현재 상태 출력 후 토글 | 현재 ON/OFF를 보여준 뒤 토글 | ✓ |
| 무인자 = 상태만 출력 (토글 안 함) | 읽기 전용처럼 동작 | |

**User's choice:** 현재 상태 출력 후 토글 (`on`/`off`는 무조건 set, 무인자만 toggle)
**Notes:** `on`/`off` 명시 인자는 현재 상태와 무관하게 생성/삭제(set). 무인자만 출력+토글. (LOCKED 2)

---

## 마커 파일 내용

| Option | Description | Selected |
|--------|-------------|----------|
| 빈 파일 (touch) | 존재 여부만 의미, 내용 없음 | |
| 최소 사람-가독 메타데이터 | 설명 한 줄 + 활성화 타임스탬프 | ✓ |
| 구조화 데이터 (JSON/YAML) | 향후 확장 대비 구조화 | |

**User's choice:** 최소 사람-가독 메타데이터 (설명 + 타임스탬프)
**Notes:** Phase 47 감지는 존재-여부만 본다 — 내용은 감지에 영향 없음. 사람이 열어볼 때를 위한 주석. (GRILLED 10)

---

## 감사 로그 정책 (HANDOFF.md 행)

| Option | Description | Selected |
|--------|-------------|----------|
| HANDOFF.md에 행 추가 | 토글도 전이로 기록 | |
| HANDOFF.md에 행 추가 안 함 | 설정 토글이므로 sg-status/sg-health 패턴 | ✓ |

**User's choice:** 행 추가 안 함
**Notes:** 워크플로우 단계 전이가 아니라 config 토글 → sg-status/sg-health 패턴 준수. (RESOLVED 6)

---

## 멀티플랫폼 미러 (.agents/ 처리)

| Option | Description | Selected |
|--------|-------------|----------|
| 미러에 프로즈-폴백 특수 처리 | AskUserQuestion 분기를 프로즈로 대체 | |
| 미러는 거의 동일 (특수 처리 없음) | 토글에 모호한 분기 없음 → 두 파일 near-identical | ✓ |

**User's choice:** 미러 near-identical, 특수 처리 없음
**Notes:** 토글은 분기가 없어 폴백이 불필요. 같은 커밋에서 pairwise 생성. 산문은 사용자-언어, 머신 토큰은 영문. (RESOLVED 7, LOCKED 4)

---

## Claude's Discretion

- 스킬 `<process>` 단계 분할, bash vs Read-도구 사용, 출력 메시지 정확한 문구.
- 마커 메타데이터의 정확한 형식(설명 문구, 타임스탬프 포맷) — "최소 사람-가독" 원칙만 충족.

## Deferred Ideas

- 마커 감지 후 동작 주입(sg-execute/sg-review) → Phase 47.
- README/README.ko TDD 문서화 → Phase 48.
- TDD 모드 시 PLAN.md 테스트 시나리오 자동 생성 → TDD-F1 (Future).
- 프로젝트별 테스트 러너 자동 감지 → REVIEW-F1 (Future).
