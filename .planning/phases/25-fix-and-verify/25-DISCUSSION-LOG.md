# Phase 25: 문제점 수정 및 검증 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 25-fix-and-verify
**Areas discussed:** Description 개선 전략 (A 영역만 — B 영역은 Phase 24 결정으로 충분)

---

## A. Description 개선 전략

### 질문 1 — 수정 단위

| Option | Description | Selected |
|--------|-------------|----------|
| 한 번에 17개 일괄 수정 | 단일 플랜 태스크, 원자적 커밋. 한 파일 실수가 전체 검증을 늦출 수 있음 | ✓ |
| 그룹별 수정 (3개 태스크) | 워크플로우/유틸리티/전문화 순서. 그룹별 커밋+검증 가능 | |
| 파일별 개별 수정 | 최대 세분화, 17개 커밋. 오버킬 가능성 | |

**User's choice:** 한 번에 17개 일괄 수정
**Notes:** 단순성 우선. 원자적 처리.

---

### 질문 2 — Description 길이 및 포맷

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 줄 유지 | 간결함 우선. "Use this when X — does Y." 한 줄 압축 | ✓ |
| 멀티라인 허용 (스킬별 재량) | 복잡한 스킬은 멀티라인, 단순한 스킬은 단일 줄 | |
| 모두 멀티라인 통일 | 일관성 우선, 포맷 기준 명확 | |

**User's choice:** 단일 줄 유지
**Notes:** "Use this when X — does Y." 형태로 한 줄에 압축.

---

### 질문 3 — 트리거 표현 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 발화 기반 (영어 예시만) | skill-creator 원문 패턴에 가장 충실. "Use this when user says X" | |
| 상황 기반 | 언어 독립적. 한국어/영어 혼용 환경에 안전 | ✓ |
| 발화 기반 (영어 + 한국어 병기) | 트리거 커버리지 최대화. 줄이 길어짐 | |

**User's choice:** 상황 기반
**Notes:** 언어 독립적으로 "어떤 상황에서 이 스킬이 필요한가"를 기술. 사용자 발화 예시 삽입 금지.

---

### 질문 4 — 검증 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 셀프 검증 | 수정한 Claude가 GOOD/FAIR/POOR 기준으로 직접 재평가. 별도 산출물 없음 | |
| 검증 체크리스트 산출 | 17개 스킬별 수정 전/후 description 테이블 문서 생성 | ✓ |
| 재감사 스크립트 | Phase 24 RESEARCH.md 기준 재적용, 17개 재스캔 | |

**User's choice:** 검증 체크리스트 산출
**Notes:** 25-VERIFICATION.md에 수정 전/후 2컬럼 테이블 + 등급 변화(POOR/FAIR → GOOD) 기록. Phase 24 SUMMARY.md QUAL-02 테이블과 대응 구조.

---

## B. sg-retro 리팩토링

Phase 24 결정(D-09/D-10)으로 충분하다고 판단 — 추가 논의 없이 이관.

- 삭제 대상: `<lens_templates>` 블록 (378-534줄, 157줄)
- 목표: 548줄 → 391줄

---

## Claude's Discretion

- sg-retro 삭제 전 `<process>` Step 5와의 내용 중복 여부 최종 비교는 Claude 재량으로 수행

## Deferred Ideas

- **멀티라인 description** — 트리거 커버리지 향상에 효과적이나 단순성 우선으로 보류. undertrigger 문제 실제 발생 시 재검토.
- **발화 기반 트리거(한국어 병기)** — 한국어 발화 매칭 문제 실제 발생 시 재검토.
