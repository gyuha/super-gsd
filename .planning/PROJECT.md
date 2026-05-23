# super-gsd

## What This Is

GSD → Superpowers → sg-retro 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, 내장 `sg-retro` Skill이 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 16개의 `sg-` 명령, Stop/SubagentStop 훅, lessons 자동 저장·재표시 루프를 제공한다. 모든 명령은 `skills/sg-*/SKILL.md` 형식으로 관리되며 Hookify는 더 이상 필수 의존성이 아니다.

## Core Value

각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

## Current Milestone: v2.1 Skills 품질 검토 및 개선

**Goal:** skill-creator를 활용해 17개 SKILL.md 파일의 구조·완성도·정확성을 검토하고 발견된 문제를 수정한다.

**Target features:**
- skill-creator 기준으로 17개 SKILL.md 전체 검토
- frontmatter + objective/process/success_criteria 블록 구조 검증
- 발견된 문제 수정 및 재검증

---

## Current State (v2.0 shipped 2026-05-23)

- **Skills**: `skills/sg-*/SKILL.md` 17개 — 14개 워크플로우 명령 + sg-retro + sg-ui-plan + sg-parallel-execute
- **commands/ 제거**: commands/*.md 14개 삭제, plugin.json commands 키 제거 — skills/가 단일 소스
- **Visual Companion**: sg-plan에 UI 설계 분기(Step 1.5) 내장, sg-ui-plan 독립 명령
- **Retrospection**: `skills/sg-retro/SKILL.md` — 6개 lens, multiSelect, multi-lens loop, 자체 conversation analyzer
- **Rule runner**: `hooks/rule_runner.py` — hookify 미설치 환경에서도 `.claude/hookify.*.local.md` + `.claude/sg-rule.*.local.md` 규칙 실행
- **Lessons ranking**: `hooks/lessons_ranker.py` — weighted top-N (score = 0.4×freq + 0.4×recency + 0.2×severity), sg-plan 진입 시 자동 노출
- **Hooks**: `hooks/hooks.json` (Stop + SubagentStop + PreToolUse), `stop_hook.py`, `transcript_matcher.py`, `rule_runner.py`
- **State**: 7-state storage(`init|gsd-plan|superpowers|review|hookify|ship|complete`) ↔ 4-state display 매핑
- **Dependencies**: GSD + Superpowers 필수. Hookify Optional (sg-retro 내장으로 대체)
- **Version**: 0.0.29

## Next Milestone Goals

**v1.3 Multi-Platform Support** (planned)
- AGENTS.md 재작성 + .agents/skills/ 6개 플랫폼별 스킬
- .codex/hooks.json + .gemini/settings.json 훅 설정
- README Multi-Platform 섹션 (플랫폼별 설치 가이드 + 기능 델타 테이블)

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

### Validated (v1.1)

- ✓ HEALTH-01~06: sg-health 진단 (설치/훅/스키마/STATE frontmatter, read-only) — v1.1 Phase 6
- ✓ STATUS-01~03: HANDOFF.md 파싱 + display enum 매핑 + STATE.md `Phase:` 라인 풀 캡처 — v1.1 Phase 7
- ✓ SESS-01~04: sg-start 세션 감지 + 5-line 표시 + Resume/Start new milestone/Cancel 3-옵션, HANDOFF append-only 자연 충족 — v1.1 Phase 8

### Validated (v1.5)

- ✓ VC-01~02: sg-plan Visual Companion 분기 — UI 키워드 감지 → AskUserQuestion → superpowers:brainstorming — v1.5 Phase 20
- ✓ VC-03~05: sg-ui-plan 독립 명령 — SKILL.md 생성, HANDOFF append, plugin.json 자동 등록 — v1.5 Phase 21
- ✓ VC-06~07: README.md + docs/COMMANDS.md 문서화 — v1.5 Phase 21

### Validated (v2.0)

- ✓ SC-01~06: 14개 sg-* commands → skills/sg-*/SKILL.md 전환 완료. YAML frontmatter + objective/process/success_criteria 블록 — v2.0 Phase 22
- ✓ PC-01~02: plugin.json commands 키 제거 + commands/ 디렉토리 git rm 삭제 — v2.0 Phase 23
- ✓ DOC-01~02: CLAUDE.md skills/ 기준 재서술 + README Phase 3 sg-retro 교체 — v2.0 Phase 23

### Validated (v1.2)

- ✓ RETRO-01~04: sg-retro Skill — 3 lens(SSC/4Ls/DSPM), phase artifact 수집, lessons 저장 — v1.2 Phase 9
- ✓ RETRO-05, ANALYZER-01~03: 6 lens, multiSelect, 자체 conversation analyzer, transcript-based 4-카테고리 추출 — v1.2 Phase 10
- ✓ RULES-01~04: hooks/rule_runner.py PreToolUse hook, hookify rule 호환, warn/block 매핑 — v1.2 Phase 11
- ✓ RECURRENCE-01~03, LESSONS-02~03: lessons_ranker.py weighted top-N, sg-plan/sg-execute 자동 노출, milestone archive — v1.2 Phase 12
- ✓ MIGRATION-01~04: sg-learn → sg-retro 라우팅, sg-update hookify 제거, README/docs/plugin.json 업데이트 — v1.2 Phase 13

### Active (v2.1)

- [ ] QUAL-01: 17개 SKILL.md 파일 각각의 YAML frontmatter에 필수 필드(name, description)가 존재한다
- [ ] QUAL-02: 각 description 필드가 "언제 사용해야 하는지"와 "무엇을 하는지"를 명확히 기술한다
- [ ] QUAL-03: 모든 스킬에 objective, process, success_criteria 블록이 존재하고 내용이 완전하다
- [ ] QUAL-04: process 단계가 실행 가능하고 macOS/Linux 호환 Bash 스니펫을 준수한다
- [ ] QUAL-05: 스킬 간 cross-reference(Skill(), Agent())가 유효한 skill 이름을 가리킨다
- [ ] QUAL-06: 발견된 모든 문제점이 수정되고 재검증된다

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
- **Dependencies**: `claude-plugins-official/superpowers`, `get-shit-done-cc` (또는 동등 GSD 설치). `claude-plugins-official/hookify` 는 Optional.
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
| sg-retro 자체 구현 (hookify 외부 의존 제거) | hookify 없이도 회고 가능하게 — 진입 장벽 낮추고 install 요구사항 줄임 | ✓ Good — v1.2 전체 목표 달성 |
| HANDOFF "hookify" stage 값 보존 (sg-retro 전환 후에도) | sg-status 라우팅 하위 호환성 — stage enum 리네임 시 HANDOFF.md 기존 행 파싱 깨짐 | ✓ Accepted — tech debt, v1.3에서 rename 검토 |
| rule_runner.py prompt 이벤트 미지원 | PreToolUse hook 아키텍처 제약 — prompt submit 이벤트는 Claude Code PreToolUse로 캐치 불가 | ✓ Accepted — docstring에 명시, 20/23 rule 커버리지로 실용적 수준 |
| lessons_ranker.py score = 0.4×freq + 0.4×recency + 0.2×severity | recency 가중치를 frequency와 동등하게 설정 — 최신 패턴이 반복 패턴만큼 중요함 | ✓ Pending — 실제 사용 후 가중치 튜닝 필요 가능성 있음 |

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

## Key Decisions (v2.0 추가)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 완전 복사(exact copy) 전략으로 SKILL.md 생성 | content 변경 없이 frontmatter + 블록 전체 복사 — 검증이 쉽고 실수 없음 | ✓ Good — 14개 파일 생성 시 로직 손실 없음 확인 |
| plugin.json commands 키 완전 제거 (경로 나열 아님) | skills/ 자동 스캔으로 충분 — 14개 경로 나열은 유지 비용만 증가 | ✓ Good — plugin.json 단순화, 미래 skills 추가 시 자동 인식 |
| Code review → auto-fix 사이클 도입 | Phase 22 코드 리뷰에서 Critical 3개 발견 — node 의존성, path traversal, 데드 코드 | ✓ Good — 7개 버그 사전 차단, gsd-code-review --fix로 자동화 |

---
*Last updated: 2026-05-23 after v2.0 Commands → Skills 마이그레이션 milestone*
