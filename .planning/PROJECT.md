# super-gsd

## What This Is

GSD → Superpowers → Hookify 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, Hookify가 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 9개의 `sg-` 명령, Stop/SubagentStop 훅, 그리고 lessons 자동 저장·재표시 루프를 제공한다.

## Core Value

각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

## Current State (v1.0 shipped 2026-05-16)

- **Commands**: 9개 sg- 명령 (`sg-start`, `sg-explore`, `sg-plan`, `sg-execute`, `sg-status`, `sg-review`, `sg-learn`, `sg-ship`, `sg-lessons`)
- **Hooks**: `hooks/hooks.json` (Stop + SubagentStop), `stop_hook.py`, `transcript_matcher.py`
- **Lessons loop**: `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 자동 생성, `sg-plan` Step 0 자동 재표시
- **Config**: `super_gsd.auto_advance` (bool) — 훅 전체 비활성화 스위치
- **Codebase**: ~1,057 lines (Python + Markdown + JSON), 60개 파일

## Current Milestone: v1.1 Reliability

**Goal:** 세션 복원, 단계 감지 정확도, 워크플로우 자기진단으로 사용자가 도구를 신뢰하고 끊김 없이 사용할 수 있도록 한다.

**Target features:**
- 세션 복원 강화 — sg-start에서 HANDOFF.md+STATE.md 기반 자동 재개 프롬프트
- sg-status 단계 감지 정확도 — HANDOFF.md 파싱으로 현재 단계 정확 표시
- sg-health 명령 — GSD/Superpowers/Hookify 설치 + 훅 등록 + HANDOFF.md 스키마 종합 진단

## Requirements

### Validated (v1.0)

- ✓ 플러그인 셸 — plugin.json, marketplace.json 포함 설치 가능 구조 — v1.0
- ✓ GSD plan-phase 완료 → sg-execute 안내 (Stop hook) — v1.0
- ✓ Superpowers review 완료 → sg-learn 안내 (SubagentStop hook) — v1.0 (메시지 안내; hooks는 skill 직접 호출 불가)
- ✓ sg-execute: PLAN.md + success criteria 패키징 → Superpowers 인계, HANDOFF.md 기록 — v1.0
- ✓ sg-status: 현재 단계, 마지막 인계 시각, 다음 권장 명령 표시 — v1.0
- ✓ 8개 sg- 명령 세트 (start→explore→plan→execute→review→learn→ship) + sg-lessons — v1.0
- ✓ auto_advance: false로 훅 전체 비활성화 — v1.0
- ✓ Hookify 학습 자동 저장 (.planning/lessons/) + 다음 plan-phase 재표시 — v1.0

### Active (v1.1)

- [ ] SESS-01: sg-start에서 HANDOFF.md+STATE.md 기반 세션 자동 복원 프롬프트
- [ ] STATUS-01: HANDOFF.md 파싱으로 현재 GSD/Superpowers/Hookify 단계 정확 감지 및 표시
- [ ] HEALTH-01: sg-health 명령 — 설치 상태 + 훅 등록 + HANDOFF.md 스키마 검증 종합 진단

### Out of Scope

- GSD/Superpowers/Hookify 자체의 내부 동작 수정 — 비침투적 orchestrator 원칙 유지
- 다른 플랜닝 도구(Linear, Jira 등)와의 직접 통합 — Claude Code 생태계만
- 비-Claude 런타임(Codex, Gemini CLI) 지원 — v1은 Claude Code 전용
- 멀티 프로젝트 동시 오케스트레이션 — 상태 충돌 회피
- 자체 LLM 호출 — 모든 처리는 호스트 Claude Code 세션을 통해

## Context

- **블로그 기반 워크플로우**: https://gyuha.com/post/2026/05/2026-05-14-gsd-superpowers-hookify-workflow/ 에서 정의한 "역할 분리" 패턴을 자동화한다.
- **세 도구의 역할**:
  - GSD: requirements → roadmap → phase plan (전략)
  - Superpowers: plan → execute → review → commit (구현)
  - Hookify: retrospection → pattern extraction → hook generation (학습)
- **핵심 통찰**: "하나의 AI에게 모든 역할을 맡기는 순간 품질이 흔들린다" — 단계 분리 자체가 가치를 만든다.
- **선행 작업**: 세 플러그인 모두 이미 설치되어 있어야 한다 (사용자 환경 기준).
- **hooks 제약 발견**: Claude Code hooks는 `systemMessage` 출력만 가능 — slash command/skill을 직접 invoke할 수 없다. HOOK-02는 안내 메시지가 기술적 최대치.

## Constraints

- **Tech stack**: Claude Code 플러그인 시스템 (skills + commands + hooks). Python/Markdown/JSON 위주.
- **Dependencies**: `claude-plugins-official/superpowers`, `claude-plugins-official/hookify`, `get-shit-done-cc` (또는 동등 GSD 설치).
- **Compatibility**: Claude Code 최신 버전 — `Stop`/`SubagentStop` hook 및 플러그인 marketplace 메커니즘 사용.
- **Idempotency**: 인계 명령은 같은 phase에서 여러 번 호출해도 중복 컨텍스트를 생성하지 않아야 한다.
- **Non-invasive**: 기존 GSD/Superpowers/Hookify의 파일을 수정하지 않고 외부에서 orchestrate한다.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 세 도구 fork 없이 외부 orchestrator로 구현 | 업스트림 업데이트와 충돌하지 않게, 비침투적으로 통합 | ✓ Good — Phase 1~5 전체를 upstream 변경 없이 구현 완료 |
| Stop/SubagentStop hook으로 자동 단계 전환 안내 | 명시적 명령 없이도 단계 종료가 감지되어 다음 단계가 권유됨 | ✓ Good — 4개 HOOK 요건 모두 충족 (단, skill 직접 호출은 불가) |
| `.planning/HANDOFF.md`로 상태 추적 | GSD의 `.planning/` 컨벤션을 따라 동일 디렉토리 사용 | ✓ Good — append-only 5컬럼 스키마로 안정적 동작 |
| Hookify 자동 실행은 review 완료 후로 한정 | 모든 실행 후 회고는 노이즈 — review 시점이 학습 신호가 가장 강함 | ✓ Good — SubagentStop + REVIEW_SIGNALS 패턴으로 구현 |
| HOOK-02: skill 직접 호출 대신 안내 메시지 | Claude Code hooks는 systemMessage만 지원, slash command invoke 불가 | ✓ Accepted — 기술적 최대치, 추후 hooks API 확장 시 업그레이드 가능 |
| Python 파일명 하이픈 대신 밑줄 사용 | Python import에서 하이픈 포함 파일명 불가 (stop-hook.py → stop_hook.py) | ✓ Good — hooks.json도 일치하게 업데이트 |
| .planning/lessons/ 이름 패턴: {NN}-{YYYY-MM-DD}.md | phase 번호 + 날짜로 정렬 가능, 중복 방지 (같은 날 idempotent) | ✓ Good — GSD .planning/ 컨벤션과 일관성 유지 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 — v1.1 Reliability milestone started*
