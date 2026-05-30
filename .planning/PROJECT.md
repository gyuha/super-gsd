# super-gsd

## What This Is

GSD → Superpowers → sg-retro 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, 내장 `sg-retro` Skill이 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 18개의 `sg-` 명령, Stop/SubagentStop 훅, lessons 자동 저장·재표시 루프를 제공한다. `sg-next` 명령으로 현재 단계를 자동 감지하고 다음 단계로 즉시 진행할 수 있다. 모든 명령은 `skills/sg-*/SKILL.md` 형식으로 관리되며 Hookify는 더 이상 필수 의존성이 아니다.

## Core Value

각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

## Current Milestone: v2.9 Retro UX Simplification

**Goal:** sg-retro/sg-learn의 lens 선택 마찰을 제거하고 회고 결과를 한눈에 이해할 수 있게 만든다.

**Target features:**
- Smart default lens — phase 종류/상황 기반 기본 lens(예: dspm+ssc) 자동 선택. 사용자가 명시적으로 다른 lens 원할 때만 AskUserQuestion 표시
- Lens consolidation — 6개 lens → 3개 핵심 lens로 단순화 (중복 의도 lens 통합·제거)
- One-shot interaction — lens 선택 + Action Items 확인 등 여러 단계의 상호작용을 한 번에 통합
- 결과 표시 개선 — Action Items 우선순위 시각적 강조, 각 lens 의도 설명, lessons 파일 포맷 정리

## Completed Milestone: v2.8 Team Collaboration Support (2026-05-29)

**Goal:** 팀원이 동일 GSD 프로젝트에서 phase 단위로 병렬 작업할 때 파일 충돌 없이 협업할 수 있도록 git-native 워크플로우를 super-gsd에 통합한다.

**Delivered:**
- Phase 39: HANDOFF.md User 컬럼 (TEAM-01) + sg-status --team (TEAM-02)
- Phase 40: sg-execute 브랜치 감지/제안 (TEAM-03) + sg-phase complete PR 안내 (TEAM-04)
- Phase 41: .planning/TEAM.md 온보딩 가이드 + README/README.ko.md Team Workflow 섹션 (DOC-01, DOC-02)

## Completed Milestone: v2.7 Skills & Hooks Internationalization (2026-05-28)

**Goal:** `skills/` 및 `hooks/` 내 한글 콘텐츠를 영문으로 전환하고, 모든 SKILL.md에 사용자 언어 자동 감지 지침을 추가한다.

**Delivered:**
- Phase 36: `skills/sg-*/SKILL.md` 14개 한글→영문 + 19개 전체 `<language>` 지침 (I18N-01, I18N-04 partial)
- Phase 37 (ad-hoc): `.agents/skills/sg-*/SKILL.md` 8개 한글→영문 + `<language>` 지침 — 36-fix 커밋에 흡수 (I18N-02, I18N-04 complete)
- Phase 38 (ad-hoc): `hooks/stop_hook.cjs` + `hooks/rule_runner.cjs` 한글 주석 영문화 — 커밋 391326c (I18N-03)

## Completed Milestone: v2.6 Codex/Gemini 설치 UX 개선 (2026-05-26)

**Goal:** Codex/Gemini CLI에서 super-gsd 설치를 GSD(npm) · Superpowers(marketplace) 수준으로 단순화한다.

**Delivered:**
- Phase 33: `npx @gyuha/super-gsd install` npx 인스톨러
- Phase 34: `$sg-setup` 인세션 스킬 (.agents/ + skills/ 쌍)
- Phase 35: README.md / AGENTS.md / README.ko.md 설치 문서 업데이트

## Current State (v2.6 Phase 33 complete 2026-05-26)

- **Skills**: `skills/sg-*/SKILL.md` 18개 — 파일 파싱 전면 Read 도구 방식으로 전환 (bash grep/sed/awk 제거)
- **Hooks**: `hooks/*.cjs` 4개 (Node.js 18+, 외부 의존성 0) — `stop_hook.cjs`, `transcript_matcher.cjs`, `rule_runner.cjs`, `lessons_ranker.cjs`
- **Hook configs**: `hooks/hooks.json` + `.codex/hooks.json` + `.gemini/settings.json` — 모두 `node hooks/*.cjs` 기반
- **File parsing**: `skills/sg-*/SKILL.md` + `.agents/skills/sg-*/SKILL.md` — STATE.md/HANDOFF.md 파싱을 Read 도구 + Claude 해석으로 전환 완료
- **sg-rule 가드**: `.claude/sg-rule.warn-*.local.md` 3개 — `# Read` 주석 패턴, `process.env.ARGUMENTS`, bash 펜스 혼재 자동 경고
- **sg-plan 안정성**: discuss-phase 디렉토리 오작동 방지 (pre-create + CONTEXT.md 위치 자동 검증·이동)
- **npx Installer**: `package.json`(@gyuha/super-gsd) + `bin/setup.js` — `npx @gyuha/super-gsd install` 단일 명령으로 .codex/hooks.json, hooks/, .agents/ 복사. `--gemini` 플래그로 .gemini/settings.json 추가. `--force`로 덮어쓰기.
- **Dependencies**: GSD + Superpowers 필수. Node.js 18+ 필수. Hookify Optional.
- **Version**: 0.0.42

## Completed Milestone: v2.5 Superpowers-Native File Parsing (2026-05-26)

**Delivered:** `skills/sg-*/SKILL.md` 8개 + `.agents/skills/sg-*/SKILL.md` 4개에서 bash grep/sed/awk 파싱 → Read 도구 전환. CLAUDE.md Superpowers 방식 권장 명시. Phase 32 retro → 3개 sg-rule 신규 생성 + sg-plan 디렉토리 버그 패치.

**Next milestone candidates:** v1.3 Multi-Platform Support (Phases 14-16), README.ko.md 동기화, 누적 quick tasks 정리

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

### Validated (v2.1 — Phase 24)

- ✓ QUAL-01: 17/17 SKILL.md frontmatter 필수 필드(name, description) 존재 확인 — v2.1 Phase 24
- ✓ QUAL-02 감사 완료: 16/17 POOR + 1/17 FAIR — 17개 전체 Phase 25 수정 대상으로 식별 — v2.1 Phase 24
- ✓ QUAL-03: 17/17 objective/process/success_criteria 블록 완전 — v2.1 Phase 24
- ✓ QUAL-04: 17/17 macOS/Linux 호환 Bash 스니펫 준수 확인 — v2.1 Phase 24
- ✓ QUAL-05: 17/17 cross-reference(Skill(), Agent()) 유효한 skill 이름 확인 — v2.1 Phase 24

### Validated (v2.1 — Phase 25)

- ✓ QUAL-06: 17개 description GOOD 등급 교체 + sg-retro 390줄 축소 완료, 25-VERIFICATION.md 생성 — v2.1 Phase 25

### Validated (v2.2)

- ✓ NEXT-01: sg-next가 HANDOFF.md 마지막 행 + STATE.md Phase 라인으로 현재 단계 감지 — v2.2 Phase 26
- ✓ NEXT-02: sg-status와 동일한 11개 분기 라우팅 테이블 사용 (D-07 inline-replication) — v2.2 Phase 26
- ✓ NEXT-03: `→ /super-gsd:sg-[cmd]` 1줄 출력 후 확인 없이 즉시 Skill() invoke — v2.2 Phase 26
- ✓ NEXT-04: complete/init 상태에서 AskUserQuestion으로 선택지 제시 — v2.2 Phase 26
- ✓ NEXT-05: HANDOFF.md에 `To: sg-next` 행 append (invoke 전) — v2.2 Phase 26

### Validated (v2.4)

- ✓ NODE-01~04: `hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 신규 작성 — 외부 의존성 0, Python 동등성 — v2.4 Phase 28
- ✓ CFG-01~03: `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` `python3 → node` 전환 완료 — v2.4 Phase 29
- ✓ SKILL-01~02, AGENT-01: 8개 SKILL.md python3 호출 → node -e/node hooks/*.cjs 교체, grep 0건 — v2.4 Phase 30
- ✓ CLEAN-01: `hooks/*.py` 4개 일괄 삭제 (commit 877a666) — v2.4 quick task 260525-vp6
- ✓ DOC-01~03: CLAUDE.md/README.md/README.ko.md/CHANGELOG.md Node 기반 갱신, plugin.json 0.0.38 — v2.4 Phase 31

### Validated (v2.5)

- ✓ PARSE-01: `skills/sg-*/SKILL.md` 8개 STATE.md/HANDOFF.md bash 파싱 → Read 도구 전환 — v2.5 Phase 32
- ✓ PARSE-02: `.agents/skills/sg-*/SKILL.md` 4개 Read 도구 전환, `sg-retro` lock 주석 → macOS 호환 주석 교체 — v2.5 Phase 32
- ✓ PARSE-03: `CLAUDE.md` macOS 셸 이식성 섹션 Phase lock 제거, Superpowers Read 방식 권장 명시 — v2.5 Phase 32

### Validated (v1.3)

- ✓ MULTI-01: Codex 진입점 — AGENTS.md(Codex 어휘) + `.agents/skills/` 스킬 6개 — v1.3 Phase 14 (shipped 2026-05-21, formally closed 2026-05-28)
- ✓ MULTI-02: 플랫폼별 훅 설정 — `.codex/hooks.json` + `.gemini/settings.json` + `hooks/*.py` 경로 폴백 — v1.3 Phase 15
- ✓ MULTI-03: README Multi-Platform 섹션 + 기능 델타 테이블 — v1.3 Phase 16

### Validated (v1.4)

- ✓ PARALLEL-01: PLAN.md 의존성 분석 (wave/depends_on/files_modified 파싱, 독립 그룹 계산) — v1.4 Phase 17 (shipped 2026-05-21, formally closed 2026-05-28)
- ✓ PARALLEL-02: sg-parallel-execute 스킬 + sg-execute Step 8.5 [TE-05a] 병렬 라우팅 — v1.4 Phase 18
- ✓ PARALLEL-03: 결과 통합 + 오케스트레이터 HANDOFF 기록 + wave 없는 경로 보존 — v1.4 Phase 19

### Validated (v2.6)

- ✓ SETUP-01: npx Installer — `npx @gyuha/super-gsd install` 단일 명령으로 Codex/Gemini 설치 파일 복사 — v2.6 Phase 33 (`package.json` + `bin/setup.js`)
- ✓ SETUP-02: `$sg-setup` 인세션 스킬 — Codex/Gemini 세션 내부에서 파일 복사 자동화 — v2.6 Phase 34 (`.agents/skills/sg-setup/SKILL.md`)
- ✓ SETUP-03: 설치 문서 개선 — README.md Codex/Gemini 섹션 재작성 + Verify install + AGENTS.md + README.ko.md 동기화 — v2.6 Phase 35

### Validated (v2.7)

- ✓ I18N-01: `skills/sg-*/SKILL.md` 14개 한글→영문 — v2.7 Phase 36
- ✓ I18N-02: `.agents/skills/sg-*/SKILL.md` 8개 한글→영문 — v2.7 Phase 37 (ad-hoc)
- ✓ I18N-03: `hooks/{stop_hook,rule_runner}.cjs` 한글 주석 영문화 — v2.7 Phase 38 (ad-hoc, commit 391326c)
- ✓ I18N-04: 27개 SKILL.md 언어 자동 감지 `<language>` 지침 — v2.7 Phase 36+37

### Active (v2.1)

(완료 — v2.1 마일스톤 목표 달성)

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

- **Tech stack**: Claude Code 플러그인 시스템 (skills + commands + hooks). Node.js(`.cjs`)/Markdown/JSON 위주. v2.4부터 Python 의존성 제거 (Node 18+, 외부 의존성 0).
- **Dependencies**: `claude-plugins-official/superpowers`, `@opengsd/get-shit-done-redux` (또는 동등 GSD 설치). `claude-plugins-official/hookify` 는 Optional.
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

## Key Decisions (v2.2 추가)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| sg-next는 중복 방지 없음 (D-01) | 상태 라우터이므로 idempotency 불필요 — plan hash 기반 방지는 실행 단위에만 적용 | ✓ Good — 단순성 유지, 사용자가 실수로 재실행해도 같은 곳으로 이동 |
| HANDOFF append는 invoke 전 기록 (D-04) | invoke 실패해도 감사 로그 남음 — 기존 패턴과 일관성 | ✓ Good — HANDOFF 완결성 보장 |
| sg-status 코드 D-07 inline-replication (D-05) | 파싱 후처리 방식보다 복제가 drift 경고 포함 — 변경 시 양쪽 동시 수정 강제 | ✓ Good — 3개 블록 BEGIN/END 주석으로 유지보수 가이드 제공 |
| sg-next → sg-next 재진입 whitelist 처리 | HANDOFF 마지막 행이 sg-next일 때 FROM 컬럼으로 transparent-pass | ✓ Good — sg-review Critical 이슈 → 즉각 수정, 루프 방지 |

## Key Decisions (v2.4 추가)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `.cjs` (CommonJS) 선택, ESM 아님 | `require()` 호환성 — Node 내장 모듈만 사용, zero external deps | ✓ Good — `require('fs/path/process')` 전용, 추가 빌드 단계 없음 |
| CLEAN-01은 반드시 마지막 phase | 모든 `.cjs` 검증 완료 후 원자적 삭제 — 중간 삭제 시 hook 무력화 위험 | ✓ Good — Phase 31에서 0건 grep 달성 후 안전하게 삭제 완료 |
| Code review → 즉각 수정 사이클 (sg-health Critical) | sg-health SKILL.md의 `.py` 존재 체크가 항상 WARN — review 없었으면 영구 버그 | ✓ Good — sg-review Phase 31이 Critical 버그 1개 + Important 2개 발견, 즉각 수정 |
| "Python 파일명 하이픈 대신 밑줄 사용" 결정 보존 | `.cjs`로 전환 후 파일명 패턴(`stop_hook.cjs` 등)은 기존 유지 — breaking change 없음 | ✓ Accepted — hooks.json 참조와 일치, 변경 불필요 |

## Key Decisions (v2.5 추가)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Read 도구 지시문을 bash 코드 블록 주석으로 삽입 | `.agents/` 환경에서 `else` 분기 구조 유지 필요 — 주석 삽입이 가장 비침투적 | ✓ Good — 12개 파일 전환 완료, 기존 로직 무손실 |
| sg-retro bash 파이프라인 유지 (주석만 교체) | macOS 호환성 이유로 grep+sed+awk 파이프라인이 의도적으로 유지됨 — 전환 대상 아님 | ✓ Good — 명확한 예외 처리, 향후 혼란 방지 |
| sg-plan pre-create + auto-move 패치 | discuss-phase가 기존 phase 디렉토리에 CONTEXT.md를 덮어쓰는 버그 방지 | ✓ Good — Phase 32 retro Medium severity → 즉각 수정 |
| 3개 sg-rule 생성 (retro High severity 기반) | `# Read` 주석 패턴, `process.env.ARGUMENTS`, bash 펜스 혼재 — 반복 방지 자동화 | ✓ Good — .claude/sg-rule.warn-*.local.md 3개, rule_runner.cjs가 자동 경고 |

---
*Last updated: 2026-05-26 after v2.6 milestone start — Codex/Gemini 설치 UX 개선 목표 설정. Version 0.0.39.*
