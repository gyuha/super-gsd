# Phase 22: Skills 파일 생성 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 22-skills
**Areas discussed:** Migration 전략, Plan 분할 방식, 검증 범위, success_criteria 블록 처리

---

## Migration 전략

| Option | Description | Selected |
|--------|-------------|----------|
| 완전 복사 | commands/*.md 내용 그대로 복사, frontmatter만 교체 | ✓ |
| 부분 재작성 | skills 형식에 맞게 일부 content 조정 | |
| execution_context 통일 | 모든 SKILL.md에 execution_context 블록 강제 포함 | |

**User's choice:** 완전 복사 (content 미변경)
**Notes:** `<execution_context>` 블록 유무는 원본 commands/ 파일을 따름. 통일 강제 없음.

---

## Plan 분할 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 4개 Plan (SC-01~04 그룹별) | REQUIREMENTS.md 기존 그룹 그대로 사용 | ✓ |
| 1개 Plan (일괄 처리) | 14개 파일 생성을 단일 Plan으로 처리 | |
| 2개 Plan (복잡도 기준) | sg-plan/sg-execute 분리 + 나머지 통합 | |

**User's choice:** 4개 Plan (SC-01~04 그룹별)
**Notes:** SC-01(복잡한 2개) / SC-02(세션·상태·진단 3개) / SC-03(워크플로우 4개) / SC-04(유틸리티 5개) 분할.

---

## 검증 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 파일 존재 + frontmatter 확인 | 14개 파일 존재 + name/description 키 + 필수 블록 체크 | ✓ |
| 동작 동일성 테스트 포함 | commands/와 SKILL.md 실행 결과 비교 | |
| Phase 23까지 검증 유예 | 파일 존재 확인만, 검증은 연결 후 | |

**User's choice:** 파일 존재 + frontmatter 확인만
**Notes:** commands/가 Phase 22 동안 여전히 존재하므로 실제 전환 검증은 Phase 23에서 수행.

---

## success_criteria 블록 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 있는 것 복사 + 없는 것 추론 작성 | 기존 블록 그대로 복사, 없으면 objective 기반으로 간결하게 작성 | ✓ |
| ROADMAP.md Phase 22 success criteria 삽입 | 모든 SKILL.md에 동일한 Phase 22 기준 적용 | |
| 전부 새로 작성 | commands/ content 기반으로 일관된 형식으로 재작성 | |

**User's choice:** 기존 것 복사, 없는 파일은 간단히 추론 작성
**Notes:** 각 명령의 `<objective>` 기준으로 1~3개 항목으로 간결하게.

---

## Claude's Discretion

- `argument-hint` 없는 명령 파일: 해당 SKILL.md에서도 생략 가능 (sg-retro 선례)
- `<success_criteria>` 추론 작성 시 분량 기준: 1~3개 항목, objective 기반

## Deferred Ideas

- plugin.json commands 배열 교체 → Phase 23 (PC-01)
- commands/ 디렉토리 삭제 → Phase 23 (PC-02)
- CLAUDE.md / README 업데이트 → Phase 23 (DOC-01~02)
- .agents/skills/ 파일은 scope 외 (Codex/Gemini 접근성 보존)
