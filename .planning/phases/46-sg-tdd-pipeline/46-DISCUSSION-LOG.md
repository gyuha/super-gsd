# Phase 46: sg-tdd 구현 + 파이프라인 통합 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 46-sg-tdd 구현 + 파이프라인 통합
**Areas discussed:** TDD 검증 실패 처리, tdd_mode off 직접 호출, sg-next 동적 라우팅, HANDOFF stage enum, transcript_matcher 신호, sg-tdd 구현 방식, 파일 쌍 필수, D-07 동기화

---

> **Note:** 이 Discussion Log는 사용자와의 사전 협의(grilling)를 통해 8개 결정이 전부 확정된 상태에서 작성되었습니다. 각 결정은 논의 전에 이미 locked context로 제공되었습니다.

## TDD 검증 실패 처리 (TDD-01)

| Option | Description | Selected |
|--------|-------------|----------|
| 소프트 경고 + AskUserQuestion | sg-review 진행 또는 재시도 선택지 제공 | ✓ |
| 하드 블록 | 실패 시 sg-review 진행 불가 강제 | |
| 무시 | 실패해도 자동으로 다음 단계 진행 | |

**User's choice:** 소프트 경고 + AskUserQuestion (sg-review 진행 / 재시도 선택지 제공)
**Notes:** 강제 블록 없음. 사용자가 판단하여 진행 여부 결정.

---

## tdd_mode off 직접 호출 (TDD-02)

| Option | Description | Selected |
|--------|-------------|----------|
| 경고 출력 + 안내 + 권고 | tdd_mode 활성화 방법 안내 + sg-execute 재실행 권고 | ✓ |
| 명령 블록 | tdd_mode가 off이면 실행 자체를 거부 | |
| 조용히 실행 | tdd_mode 무관하게 실행 | |

**User's choice:** 경고 출력 + tdd_mode 활성화 방법 안내 + sg-execute 재실행 권고
**Notes:** 명령 자체를 블록하지는 않음. 사용자 인식 목적의 경고.

---

## sg-next 동적 라우팅 (PIPE-02)

| Option | Description | Selected |
|--------|-------------|----------|
| config 읽기 기반 분기 | tdd_mode: true → sg-tdd, false/부재 → sg-review | ✓ |
| 항상 sg-tdd | tdd_mode 무관하게 execute 다음은 항상 sg-tdd | |
| 항상 sg-review | 기존 동작 그대로 유지 | |

**User's choice:** config.json의 `super_gsd.tdd_mode` 값 기반 동적 분기
**Notes:** false 또는 부재 시 기존 동작(sg-review) 유지.

---

## HANDOFF.md stage enum (PIPE-01)

| Option | Description | Selected |
|--------|-------------|----------|
| `tdd` 단일어 | execute, review와 일관된 패턴 | ✓ |
| `sg-tdd` | 스킬 이름과 동일 | |
| `tdd-verify` | 의미 명확성 우선 | |

**User's choice:** `tdd` 단일어
**Notes:** 기존 stage enum 패턴(단일어)과 일관성 유지.

---

## transcript_matcher 완료 신호 (PIPE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| `"TDD verification complete"` | sg-tdd 스킬 종료 시 출력하는 문자열 | ✓ |
| `"TDD complete"` | 더 짧은 문자열 | |
| `"sg-tdd complete"` | 스킬 이름 포함 | |

**User's choice:** `"TDD verification complete"`
**Notes:** REVIEW_SIGNALS의 `"review complete"` 패턴과 일관성 있는 형식.

---

## sg-tdd 구현 방식 (TDD-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Superpowers 스킬만 호출 | `Skill("superpowers:test-driven-development")` 단일 호출 | ✓ |
| 자체 TDD 로직 구현 | SKILL.md 내부에 red-green-refactor 절차 직접 구현 | |
| 다중 외부 스킬 조합 | Superpowers + 기타 스킬 조합 | |

**User's choice:** `superpowers:test-driven-development` 스킬만 호출
**Notes:** Non-invasive 제약 준수. Superpowers/GSD 내부 파일 미수정.

---

## 파일 쌍 필수 (MIRROR-01)

| Option | Description | Selected |
|--------|-------------|----------|
| 두 파일 동시 생성 | skills/ + .agents/skills/ 쌍 | ✓ |
| skills/만 생성 | Claude Code 전용 | |
| 나중에 .agents/ 추가 | Phase 47에서 처리 | |

**User's choice:** `skills/sg-tdd/SKILL.md` + `.agents/skills/sg-tdd/SKILL.md` 동시 생성 (MIRROR-01)
**Notes:** 기존 pairwise convention 준수. 어느 한 파일만 생성하면 코드 리뷰 블로커.

---

## D-07 동기화 (PIPE-02)

| Option | Description | Selected |
|--------|-------------|----------|
| sg-next + sg-status 동시 갱신 | 두 파일 항상 동시 수정 | ✓ |
| sg-next만 갱신 | sg-status는 별도 PR | |

**User's choice:** sg-next와 sg-status 라우팅 테이블 동시 갱신 필수
**Notes:** D-07 inline-replication 패턴. 어느 한 쪽만 수정하면 코드 리뷰 블로커.

---

## Claude's Discretion

없음 — 8개 결정 전부 사용자가 명시적으로 확정.

## Deferred Ideas

- README.md / README.ko.md Commands 표 갱신 → Phase 47
- CLAUDE.md 아키텍처 섹션 sg-tdd 추가 → Phase 47
- 진짜 TDD 우선(테스트 먼저 작성) 모드 → Out of scope
- sg-parallel-execute와 TDD 통합 → 미래 마일스톤
