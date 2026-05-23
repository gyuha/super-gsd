# Phase 26: sg-next 스킬 구현 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 26-sg-next
**Areas discussed:** Idempotency 처리, complete/init 분기 선택지, HANDOFF append 타이밍, sg-status 라우팅 코드 재사용 방식

---

## 영역 1: Idempotency 처리

| Option | Description | Selected |
|--------|-------------|----------|
| A. 매번 invoke | 중복 방지 없음 — sg-next를 두 번 부르면 두 번 invoke된다 | ✓ |
| B. HANDOFF 기반 중복 방지 | 직전 HANDOFF 마지막 행의 To가 이미 같은 목적지면 skip | |
| C. 중복 방지 없음 + HANDOFF 기록 생략 | sg-next 행 자체를 남기지 않음 | |

**User's choice:** A. 매번 invoke
**Notes:** sg-next는 상태 라우터이지 실행 단위가 아니므로 중복 방지가 불필요. REQUIREMENTS.md에도 중복 방지 요건 없음.

---

## 영역 2: complete/init 분기 선택지

### 2-1: 같은 선택지 vs 각각 다른 선택지

| Option | Description | Selected |
|--------|-------------|----------|
| A. 같은 선택지 | complete와 init 모두 동일한 AskUserQuestion 제시 — 구현 단순화 | ✓ |
| B. 각각 다른 선택지 | complete는 "다음 Phase 시작" 맥락, init는 "프로젝트 시작/재개" 맥락으로 분리 | |

**User's choice:** A. 같은 선택지
**Notes:** 구현 단순화 우선. 실제 사용 후 혼란 발생 시 재검토 여지 있음.

### 2-2: 선택지 내용

| Option | Description | Selected |
|--------|-------------|----------|
| A. sg-start 스타일 | Resume / Start new milestone / Cancel | |
| B. 안내만 출력 | 추천 명령 출력만 하고 AskUserQuestion 없이 종료 | |
| C. 다음 명령 선택지 직접 제시 | 상황별 추천 명령(sg-plan [N], sg-new 등)을 선택지로 구성 | ✓ |

**User's choice:** C. 다음 명령 선택지 직접 제시
**Notes:** sg-next의 목적이 "다음 명령을 invoke하는 것"이므로 선택지도 실행 가능한 명령으로 구성하는 것이 일관됨.

---

## 영역 3: HANDOFF append 타이밍

| Option | Description | Selected |
|--------|-------------|----------|
| A. invoke 전 기록 | 선언 후 실행 — 기존 sg-execute/sg-review/sg-learn 패턴과 일치 | ✓ |
| B. invoke 후 기록 | 성공한 실행만 기록 — 기술적으로 Skill() invoke 후 제어권 복귀 불가 | |

**User's choice:** A. invoke 전 기록
**Notes:** 기존 모든 스킬의 패턴과 일치. invoke 실패 시에도 감사 로그에 기록이 남는 것이 올바른 동작. invoke 후 기록은 Skill() 특성상 사실상 불가능.

---

## 영역 4: sg-status 라우팅 코드 재사용 방식

| Option | Description | Selected |
|--------|-------------|----------|
| A. 전체 복제 (D-07 패턴) | sg-status의 파싱 + enum 매핑 + 라우팅 case 블록 전체 복사, 주석 명시 | ✓ |
| B. sg-status invoke 후 출력 파싱 | sg-status 실행 → "Next: ..." 라인 파싱 → invoke | |
| C. 라우팅 테이블만 복제 | HANDOFF/STATE 파싱은 독립 구현, case 블록만 복제 | |

**User's choice:** A. 전체 복제 (D-07 inline-replication 패턴)
**Notes:** B안은 sg-status 출력 포맷 변경 시 파싱이 깨지는 취약한 의존성. C안은 부분 복제로 일관성 없음. A안이 기존 D-07 패턴과 완전히 일치하고 drift 주석이 동시 수정 위치를 명확히 안내.

---

## Claude's Discretion

없음 — 모든 4개 영역에서 사용자가 명시적으로 선택지를 결정.

## Deferred Ideas

- **플래그 추가 (`--dry-run`, `--force`)** — zero-flag 원칙으로 이번 마일스톤 범위 밖. v2.3 이후 검토.
- **complete/init 각각 다른 선택지** — 같은 선택지로 결정했으나 실제 사용 후 혼란 시 재검토 여지 있음.
