# Phase 47: 문서 갱신 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 47-문서 갱신
**Areas discussed:** Pre-locked by user prior to discussion session

---

## Context

Phase 47의 모든 구현 결정은 사용자가 discuss-phase 세션 시작 전 명시적으로 제공했다. 회색 영역이 없어 별도 질문 없이 바로 CONTEXT.md를 작성했다.

## Pre-locked Decisions (사용자 제공)

| 결정 | 내용 |
|------|------|
| README.md + README.ko.md sg-tdd 행 위치 | sg-execute 뒤, sg-review 앞 |
| 파이프라인 서술 갱신 형식 | `sg-execute → sg-tdd → sg-review` (tdd_mode=true 주석 포함) |
| CLAUDE.md 데이터 흐름 블록 | `sg-tdd → Superpowers:test-driven-development` 행 추가 |
| CLAUDE.md 아키텍처 섹션 | `super_gsd.tdd_mode` 플래그 설명 추가 (기본 off, config.json 제어) |
| CLAUDE.md Skills 레이어 | SKILL.md 파일 수 21→22 업데이트 |

---

## Claude's Discretion

- sg-tdd Commands 표 설명 문구의 정확한 표현 (사용자가 방향만 잡고 구체적 문구는 위임)
- `docs/COMMANDS.md` 갱신 여부 → 범위 밖으로 판단해 Deferred로 기록

## Deferred Ideas

- `docs/COMMANDS.md`에 sg-tdd 전체 설명 추가 — 현재 Phase 범위 밖
- sg-tdd "진짜 TDD 우선" 모드 (테스트 작성자 기능) — Out of scope
- 병렬 TDD 실행 (sg-parallel-execute 통합) — 미래 마일스톤
