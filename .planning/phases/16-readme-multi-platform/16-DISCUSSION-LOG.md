# Phase 16: README Multi-Platform 섹션 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 16-readme-multi-platform
**Areas discussed:** 섹션 위치, 델타 테이블 구조, 설치 가이드 분량, README.ko.md 처리
**Mode:** 자율 실행 모드 (사용자가 모든 항목 일괄 결정)

---

## 섹션 위치

| 옵션 | 설명 | 선택 |
|------|------|------|
| A) Installation 바로 다음 | 설치 절차 읽은 직후 플랫폼별 안내로 자연스럽게 연결 | ✓ |
| B) Prerequisites 내부 서브섹션 | 기존 섹션과 통합 — Prerequisites가 비대해짐 | |
| C) 별도 문서 (docs/PLATFORMS.md) | README에 링크만 — 분산된 문서 구조 | |

**User's choice:** A — Installation 섹션 바로 다음
**Notes:** `## Installation` 과 `## Prerequisites` 사이에 `## Multi-Platform Support` 섹션 삽입.

---

## 델타 테이블 구조

| 옵션 | 설명 | 선택 |
|------|------|------|
| A) 행=기능, 열=플랫폼 | 기능별로 플랫폼 간 비교가 한눈에 보임 | ✓ |
| B) 행=플랫폼, 열=기능 카테고리 | 플랫폼별로 전체 기능 목록 확인 가능 | |
| C) 플랫폼별 각자 작은 테이블 | 비교가 어렵고 반복이 많아짐 | |

**User's choice:** A — 행=기능, 열=플랫폼 (Claude Code / Codex / Gemini+Antigravity CLI)
**Notes:** 3분류 기호 ✅/⚠️/❌ 사용. SubagentStop 미지원, Superpowers 연동 불가를 ❌로 명확히 표시.

---

## 설치 가이드 분량

| 옵션 | 설명 | 선택 |
|------|------|------|
| A) 미니멀 (1-3줄 + 파일 경로) | 빠른 참조. 상세 내용은 AGENTS.md로 위임 | ✓ |
| B) Step-by-step with code blocks | Claude Code 설치 섹션과 동일한 깊이 — README 비대화 | |

**User's choice:** A — 미니멀 (1-3줄 요약 + 파일 경로 나열)
**Notes:** 기존 Claude Code 설치 절차는 `## Installation`에 이미 존재. 비-Claude Code 플랫폼은 "저장소 클론 → 설정 파일 자동 인식" 패턴으로 안내.

---

## README.ko.md 처리

| 옵션 | 설명 | 선택 |
|------|------|------|
| A) README.md와 동시 업데이트 | 두 파일 일관성 유지, 같은 커밋에 포함 | ✓ |
| B) README.md만 먼저 | 한글판 별도 quick task — 일시적 불일치 발생 | |

**User's choice:** A — README.md와 README.ko.md 동시 업데이트
**Notes:** 두 파일 모두 220줄, 동일 구조. 병렬 작성이 어렵지 않고 불일치 기간 없앰.

---

## Claude's Discretion

- 델타 테이블 행 항목 선정 (어떤 기능을 포함할지) — 요구사항에 나열된 핵심 제약(SubagentStop, Superpowers, AskUserQuestion, sg-retro, 훅)을 기준으로 선택
- 영문 섹션 제목 문구 (`## Multi-Platform Support` 또는 유사 표현)
- 한글 섹션 제목 문구 (`## 멀티 플랫폼 지원` 또는 유사 표현)

## Deferred Ideas

- AGENTS.md GSD 재생성 충돌 방지 메커니즘 문서화 — Phase 14 deferred 항목. Phase 16 MULTI-02 요건 밖. v1.4 또는 quick task.
- Antigravity CLI 공식 문서 확정 후 델타 테이블 재검증 — Phase 15 VERIFICATION.md와 연동.
- `.codex/skills/` 별도 경로 안내 — Phase 14 deferred. 확정 시 Multi-Platform 섹션에 추가 가능.
