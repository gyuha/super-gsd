# Phase 7: Status Accuracy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 7-status-accuracy
**Areas discussed:** Stage 표시 enum 정렬, STATUS-03 "전체 값 표시"의 정확한 의미, 회귀 방지 테스트 자산
**Areas skipped:** HANDOFF.md 파싱 헬퍼 위치 — bash vs Python (사용자 명시 스킵, Phase 6 D-04 정책 유지)

---

## Stage 표시 enum 정렬

| Option | Description | Selected |
|--------|-------------|----------|
| 1. 5개 그대로 표시 | 현재 동작 유지. `gsd-plan`/`review` 등 storage 값을 그대로 사용자에게 노출. 변경 최소이지만 STATUS-01의 3-stage 문구와 불일치. | |
| 2. 3개로 축약 표시, 분기 로직은 5개 유지 | 표시 매핑(`gsd-plan→gsd`, `review→superpowers` 등) 신설. Next 명령 case는 storage 5개 기준 유지. STATUS-01 문구 정합, review/superpowers 표시 통합. | ✓ |
| 3. 3개 + 서브상태 표시 | `Stage: superpowers (review)` 형태로 양쪽 정보 보존. D-29 출력 형식 유지 가능하나 시각적 복잡. | |

**User's choice:** 2 (3개로 축약 표시, 분기 로직은 5개 유지)
**Notes:** 매핑 — `init→init`, `gsd-plan→gsd`, `superpowers→superpowers`, `review→superpowers`, `hookify→hookify`. Next 명령은 storage 5-state 기준 그대로(D-03 → CONTEXT.md). `review` 표시 통합으로 인한 정보 손실은 Next 명령이 어차피 review/superpowers 모두 `/super-gsd:sg-learn`이라 행동 차이 없음.

---

## STATUS-03 "전체 값 표시"의 정확한 의미

| Option | Description | Selected |
|--------|-------------|----------|
| 1. `Phase: ? (unknown)` 출력 | 현재 동작 유지(빈괄호 버그만 수정). 변경 최소이나 STATE.md 원문 손실. | |
| 2. `Phase: Not started` 출력 | 콜론 뒤 전체 문자열 그대로 표시. STATE.md를 single source of truth로 채택. ROADMAP.md 이름 룩업 폐기. | ✓ |
| 3. 하이브리드 | 숫자 추출 가능하면 `N (name)`, 아니면 콜론 뒤 전체. 출력 형태 두 가지로 갈림. | |
| 4. 항상 콜론 뒤 전체 + ROADMAP 룩업 폐기 | 옵션 2와 동일 효과를 더 단순 코드로. | |

**User's choice:** 2 (콜론 뒤 전체 문자열 그대로 + ROADMAP.md 룩업 폐기)
**Notes:** Claude의 추천은 3번(하이브리드)였으나 사용자는 단순성과 STATE.md 단일 진실 원칙을 우선해 2번 선택. STATE.md 비어 있을 때 fallback은 `Phase: (none)`으로 Claude 재량 결정(D-29 출력 형식 유지). 정규식 `\S+` 단일 토큰 캡처는 금지(D-06).

---

## 회귀 방지 테스트 자산

| Option | Description | Selected |
|--------|-------------|----------|
| 1. 수동 검증만 | 별도 테스트 자산 없음. CONTEXT.md에 수동 시나리오 체크리스트만 명시. Phase 6 D-04 노선 일관. | ✓ |
| 2. `tests/sg-status/` 픽스처 + 셸 러너 추가 | 자동 회귀 방지. 단, bash 로직이 commands/와 tests/ 두 곳에 중복 → drift 위험. | |
| 3. `hooks/parse_handoff.sh` 헬퍼로 추출 + fixture 테스트 | drift 없음. 단, Phase 6 D-04 "별도 스크립트 미도입" 정책 위반. | |
| 4. fixture만 추가, 자동 비교 없음 | 자산만 남기고 비교는 사람 눈. 사실상 1번과 차이 거의 없음. | |

**User's choice:** 1 (수동 검증만, 별도 테스트 자산 추가 안 함)
**Notes:** Phase 6 D-04 노선(별도 스크립트/파일 추가 회피) 일관성 우선. sg-status 변경 빈도가 v1.1 이후 낮아 자동화 가치 < drift/스코프 확장 리스크. 수동 검증 시나리오 7개를 CONTEXT.md `<specifics>` 표로 명시(시나리오 6번 `Phase: Not started` + HANDOFF.md 없음의 Next 명령 처리는 PLAN.md에서 정의).

---

## Skipped: HANDOFF.md 파싱 헬퍼 위치 — bash vs Python

사용자가 명시적으로 스킵. Phase 6 D-04 정책(`commands/*.md` bash 블록만, 별도 Python/셸 헬퍼 미도입)을 Phase 7에서도 유지. STATE.md v1.1 research 메모의 `parse_handoff.py` 헬퍼 제안은 채택하지 않으며, Phase 8 sg-start도 동일 파싱을 bash 인라인으로 복제한다(CONTEXT.md D-07).

대신 향후 sg-start 작업 후 bash 인라인 복제가 두 번 이상 발생하거나 drift가 실제 관측되면 v1.2 milestone에서 재검토(CONTEXT.md `<deferred>` 명시).

## Claude's Discretion

- `Phase: (none)` fallback의 정확한 표기 문자열은 D-29 출력 형식을 깨지 않는 한 Claude 결정. 권장은 `(none)` — `Last handoff: (none)`과 어휘 일관성.
- 매핑 D-02의 구현 위치(별도 변수 vs 출력 직전 in-line 변환) — 가독성 기준 Claude 결정.

## Deferred Ideas

- `parse_handoff.py`/`parse_handoff.sh` 헬퍼 중앙화 — v1.2 재검토.
- 자동화 테스트 자산(`tests/sg-status/`) — v1.2 재검토.
- `sg-status --json` 플래그 — REQUIREMENTS.md Future Requirements v1.2 (스코프 외).
- 7일 초과 stale 세션 경고 — REQUIREMENTS.md Future Requirements v1.2 (스코프 외).
