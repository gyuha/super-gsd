# super-gsd

## What This Is

GSD → Superpowers → Hookify 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, Hookify가 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 명령과 훅을 제공한다.

## Core Value

각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] GSD `plan-phase`가 끝났을 때 Superpowers `execute-plan`/`subagent-driven-development`로 인계하는 명령(`/super-gsd:handoff-to-superpowers` 또는 동등 명칭) 제공
- [ ] 인계 명령은 현재 phase의 PLAN.md, REQUIREMENTS.md 일부, success criteria를 추출해 Superpowers가 즉시 실행 가능한 컨텍스트로 변환
- [ ] GSD `plan-phase` 완료 시 사용자에게 다음 단계로 인계할 수 있다는 안내 메시지를 자동 노출 (Stop hook 또는 SubagentStop 활용)
- [ ] Superpowers `code-reviewer` 또는 `executing-plans` 완료 후 Hookify `/hookify`가 자동으로 실행되어 회고/학습을 캡처
- [ ] Hookify가 추출한 패턴을 다음 GSD phase 계획에 반영할 수 있도록 `.planning/lessons/` 디렉토리에 정리해 둠
- [ ] 워크플로우 상태(현재 단계, 다음 단계)를 추적하는 `.planning/HANDOFF.md` 또는 동등 상태 파일 유지
- [ ] 플러그인 설치 시 필요한 hooks (`Stop`, `SubagentStop`)이 Claude Code `settings.json` 또는 플러그인 `hooks.json`으로 자동 등록
- [ ] 사용자가 자동 인계를 끄거나 수동 확인 모드로 전환할 수 있는 설정 옵션

### Out of Scope

- GSD/Superpowers/Hookify 자체의 내부 동작 수정 — 우리는 오케스트레이터이지 fork가 아니다
- 다른 플랜닝 도구(Linear, Jira 등)와의 직접 통합 — v1은 Claude Code 생태계만
- 비-Claude 런타임(Codex, Gemini CLI) 지원 — v1은 Claude Code 전용
- 멀티 프로젝트 동시 오케스트레이션 — 한 번에 한 프로젝트
- 자체 LLM 호출 — 모든 처리는 호스트 Claude Code 세션을 통해

## Context

- **블로그 기반 워크플로우**: https://gyuha.com/post/2026/05/2026-05-14-gsd-superpowers-hookify-workflow/ 에서 정의한 "역할 분리" 패턴을 자동화한다.
- **세 도구의 역할**:
  - GSD: requirements → roadmap → phase plan (전략)
  - Superpowers: plan → execute → review → commit (구현)
  - Hookify: retrospection → pattern extraction → hook generation (학습)
- **핵심 통찰**: "하나의 AI에게 모든 역할을 맡기는 순간 품질이 흔들린다" — 단계 분리 자체가 가치를 만든다.
- **선행 작업**: 세 플러그인 모두 이미 설치되어 있어야 한다 (사용자 환경 기준).
- **인계 트리거**: GSD 측은 `gsd-plan-phase` 완료 시점, Superpowers 측은 `code-reviewer`/`executing-plans` 완료 시점이 가장 자연스러운 hand-off 포인트.

## Constraints

- **Tech stack**: Claude Code 플러그인 시스템 (skills + commands + hooks). Bash/Python/Markdown 위주.
- **Dependencies**: `claude-plugins-official/superpowers`, `claude-plugins-official/hookify`, `get-shit-done-cc` (또는 동등 GSD 설치).
- **Compatibility**: Claude Code 최신 버전 — `Stop`/`SubagentStop` hook 및 플러그인 marketplace 메커니즘 사용.
- **Idempotency**: 인계 명령은 같은 phase에서 여러 번 호출해도 중복 컨텍스트를 생성하지 않아야 한다.
- **Non-invasive**: 기존 GSD/Superpowers/Hookify의 파일을 수정하지 않고 외부에서 orchestrate한다.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 세 도구 자체를 fork하지 않고 외부 orchestrator로 구현 | 업스트림 업데이트와 충돌하지 않게, 비침투적으로 통합 | — Pending |
| Stop/SubagentStop hook으로 자동 인계 트리거 | 명시적 명령 없이도 단계 종료가 감지되어 다음 단계가 권유됨 | — Pending |
| `.planning/HANDOFF.md`로 상태 추적 | GSD의 `.planning/` 컨벤션을 따라 동일 디렉토리 사용 | — Pending |
| Hookify 자동 실행은 review 완료 후로 한정 | 모든 실행 후 회고는 노이즈 — review 시점이 학습 신호가 가장 강함 | — Pending |

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
*Last updated: 2026-05-15 after initialization*
