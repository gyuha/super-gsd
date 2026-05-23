# Roadmap: super-gsd

## Milestones

- [x] **v1.0 MVP** (2026-05-16) — Plugin scaffold + 9 sg- commands + Stop/SubagentStop hooks + lessons feedback loop → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Reliability** (2026-05-20) — sg-health 자기진단 + sg-status 정확도 + sg-start 세션 복원 → [Archive](.planning/milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Self-Contained Retrospection** (2026-05-21) — 내장 sg-retro Skill(6 lens) + 자체 rule runner + weighted lessons 랭킹 + hookify 의존성 제거 → [Archive](.planning/milestones/v1.2-ROADMAP.md)
- [x] **v1.5 Visual Companion UI Integration** (2026-05-22) — sg-plan Visual Companion 분기 + sg-ui-plan 독립 명령 → [Archive](.planning/milestones/v1.5-ROADMAP.md)
- [ ] **v1.3 Multi-Platform Support** — AGENTS.md 재작성 + .agents/skills/ 6개 + 플랫폼별 hooks + README Multi-Platform 섹션
- [ ] **v1.4 Team Agent Parallel Execution** — PLAN.md 의존성 분석 + 병렬 Agent 실행 + 결과 통합
- [x] **v2.0 Commands → Skills 마이그레이션** (2026-05-23) — commands/*.md 14개를 skills/sg-*/SKILL.md 형식으로 전환 + commands/ 제거 + 문서 업데이트 → [Archive](.planning/milestones/v2.0-ROADMAP.md)

## Phases

<details>
<summary>✅ v1.2 Self-Contained Retrospection (Phases 9-13) — SHIPPED 2026-05-21</summary>

- [x] Phase 9: sg-retro Skill scaffold (1/1 plan) — completed 2026-05-20
- [x] Phase 10: 내장 conversation analyzer + 추가 lens (1/1 plan) — completed 2026-05-20
- [x] Phase 11: 자체 rule runner (1/1 plan) — completed 2026-05-20
- [x] Phase 12: lessons aggregation + 재발 방지 가드 (1/1 plan) — completed 2026-05-21
- [x] Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거 (1/1 plan) — completed 2026-05-21

</details>

### v1.3 Multi-Platform Support (In Progress)

- [ ] **Phase 14: Codex 진입점 + .agents/skills/** — AGENTS.md 재작성(Codex 어휘) + .agents/skills/ 스킬 6개 신규 생성
- [ ] **Phase 15: 플랫폼별 훅 설정 + Python 픽스** — .codex/hooks.json + .gemini/settings.json 신규 생성 + hooks/*.py 경로 폴백 수정
- [ ] **Phase 16: README Multi-Platform 섹션** — 플랫폼별 설치 가이드 + 기능 델타 테이블 추가

### v1.4 Team Agent Parallel Execution (Planned)

- [ ] **Phase 17: PLAN.md 의존성 분석** — wave/depends_on/files_modified 파싱 + 독립 그룹(PARALLEL_GROUPS) 계산 + 폴백 분기
- [ ] **Phase 18: sg-parallel-execute 스킬 + 라우팅** — 신규 SKILL.md 생성 + sg-execute.md Step 9 병렬 라우팅 추가
- [ ] **Phase 19: 결과 통합 + 호환성 회귀 테스트** — 오케스트레이터 HANDOFF 기록 + wave 없는 경로 완전 보존 검증

<details>
<summary>✅ v2.0 Commands → Skills 마이그레이션 (Phases 22-23) — SHIPPED 2026-05-23</summary>

- [x] Phase 22: Skills 파일 생성 (4/4 plans) — completed 2026-05-22
- [x] Phase 23: Plugin 연결 + commands/ 제거 + 문서 (2/2 plans) — completed 2026-05-23

</details>

## Phase Details

### Phase 14: Codex 진입점 + .agents/skills/

**Goal**: Codex, Gemini CLI, Antigravity CLI 사용자가 워크플로우를 이해하고 핵심 스킬을 실행할 수 있다
**Depends on**: Phase 13 (v1.3 신규 시작)
**Requirements**: CODEX-01, CODEX-02, CODEX-03
**Success Criteria** (what must be TRUE):

  1. Codex 세션 시작 시 AGENTS.md가 자동 주입되고, `/sg-*` 슬래시 명령 대신 `$sg-*` 문법으로 워크플로우 단계가 안내된다
  2. AGENTS.md에 SubagentStop 미지원 사실이 명시되어 있고, sg-retro를 수동으로 호출해야 함을 명확히 안내한다
  3. `.agents/skills/sg-retro/SKILL.md`가 AskUserQuestion 없이 실행되고 회고 결과를 .planning/lessons/에 저장한다
  4. `.agents/skills/sg-{start,plan,execute,review,status}/SKILL.md` 5개가 각각 platform-agnostic 지침을 제공하고 Superpowers 연동 불가를 명시한다

**Plans**: TBD

### Phase 15: 플랫폼별 훅 설정 + Python 픽스

**Goal**: Codex와 Gemini/Antigravity CLI 환경에서 Stop 훅과 PreToolUse/BeforeTool 훅이 동작하고 Python 훅이 CLAUDE_PLUGIN_ROOT 없이도 실행된다
**Depends on**: Phase 14
**Requirements**: CODEX-04, MULTI-01
**Success Criteria** (what must be TRUE):

  1. `.codex/hooks.json`이 존재하고 Stop + PreToolUse 훅을 포함하며 SubagentStop은 포함하지 않는다
  2. `.gemini/settings.json`이 존재하고 SessionEnd + BeforeTool 훅을 포함한다
  3. `hooks/stop_hook.py`와 `hooks/rule_runner.py`가 `CLAUDE_PLUGIN_ROOT` 환경변수 없이 Codex/Gemini 환경에서 실행된다
  4. `hooks/rule_runner.py`가 BeforeTool 이벤트 이름을 인식하고 PreToolUse와 동일하게 처리한다

**Plans**: TBD

### Phase 16: README Multi-Platform 섹션

**Goal**: README를 보는 사용자가 각 플랫폼에서 super-gsd를 설치하고 기능 제한을 정확히 파악할 수 있다
**Depends on**: Phase 15
**Requirements**: MULTI-02
**Success Criteria** (what must be TRUE):

  1. README에 Codex, Gemini CLI, Antigravity CLI별 설치 절차가 각각 명시되어 있다
  2. 기능 델타 테이블(동작 가능 / 제한 있음 / 불가 3분류)이 플랫폼별로 정직하게 기술되어 있다
  3. SubagentStop 미지원, Superpowers 연동 불가 등 핵심 제약이 표에 명시되어 있다

**Plans**: TBD

### Phase 17: PLAN.md 의존성 분석

**Goal**: sg-execute가 PLAN.md의 wave/depends_on/files_modified 구조를 파싱하여 병렬 실행 가능 여부와 그룹을 자동 결정한다
**Depends on**: Phase 16 (v1.4 신규 시작)
**Requirements**: TE-01a, TE-01b, TE-01c
**Success Criteria** (what must be TRUE):

  1. wave/depends_on/files_modified 필드가 있는 PLAN.md에서 독립 그룹(PARALLEL_GROUPS)이 올바르게 계산된다
  2. files_modified 교집합이 있는 plan들은 같은 그룹으로 병합되어 파일 충돌 경로가 원천 차단된다
  3. 독립 그룹이 2개 미만이면 기존 `superpowers:executing-plans` 경로가 그대로 실행된다
  4. wave 필드가 없는 PLAN.md는 분석을 건너뛰고 기존 동작을 완전히 보존한다

**Plans**: 1 plan
Plans:

- [ ] 17-01-PLAN.md — sg-execute.md Step 8.5 (의존성 분석) + Step 9 라우팅 분기 추가

### Phase 18: sg-parallel-execute 스킬 + 라우팅

**Goal**: sg-execute가 PARALLEL_GROUPS를 감지하면 sg-parallel-execute 스킬로 라우팅되어 Task()로 병렬 실행된다
**Depends on**: Phase 17
**Requirements**: TE-02a, TE-02b, TE-03a
**Success Criteria** (what must be TRUE):

  1. `skills/sg-parallel-execute/SKILL.md`가 존재하고 PARALLEL_GROUPS를 입력받아 각 그룹을 Task()로 동시 실행한다
  2. 병렬 에이전트 내부에서 `superpowers:executing-plans`를 호출하지 않는다 (bare Task() 직접 구현)
  3. 에이전트 수가 wave별 독립 plan 수 기반으로 자동 결정되고 상한 3개가 적용된다
  4. sg-execute.md Step 9에 병렬/순차 분기 라우팅이 추가되어 PARALLEL_GROUPS 유무에 따라 경로가 선택된다

**Plans**: 2 plans
Plans:
**Wave 1**

- [ ] 18-01-PLAN.md — sg-parallel-execute SKILL.md 신규 생성 (TE-02a, TE-02b, TE-03a)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 18-02-PLAN.md — sg-execute.md Step 9 TODO 활성화 (Skill() 라우팅 삽입)

### Phase 19: 결과 통합 + 호환성 회귀 테스트

**Goal**: 오케스트레이터가 모든 에이전트 완료 후 단독으로 HANDOFF.md를 기록하고, wave 없는 기존 경로가 완전히 보존된다
**Depends on**: Phase 18
**Requirements**: TE-04a, TE-04b, TE-05a, TE-05b
**Success Criteria** (what must be TRUE):

  1. 병렬 실행 완료 후 HANDOFF.md 기록은 오케스트레이터만 수행하고 에이전트는 직접 기록하지 않는다
  2. wave가 1개(또는 없음)인 PLAN.md는 기존 `superpowers:executing-plans` 경로를 변경 없이 실행한다
  3. wave 정보가 없는 PLAN.md로 sg-execute를 실행했을 때 v1.3 이전과 동일한 동작이 보장된다
  4. sg-execute의 idempotency 검사, HANDOFF.md 기록, lessons 주입 로직이 변경되지 않았다

**Plans**: TBD

---

<details>
<summary>✅ v1.5 Visual Companion UI Integration (Phases 20-21) — SHIPPED 2026-05-22</summary>

- [x] Phase 20: sg-plan Visual Companion 통합 (1/1 plan) — completed 2026-05-22
- [x] Phase 21: sg-ui-plan 명령 + 등록 + 문서화 (2/2 plans) — completed 2026-05-22

</details>

### Phase 20: sg-plan Visual Companion 통합 (archived)

**Goal**: sg-plan 실행 시 UI 설계 여부를 사용자에게 질문하고, 수락하면 `superpowers:brainstorming`을 gsd-discuss-phase 이전에 호출한다
**Requirements**: VC-01, VC-02
**Success Criteria** (what must be TRUE):

  1. sg-plan 실행 시 phase resolve 직후 AskUserQuestion으로 "UI 설계 포함 여부"를 묻는다
  2. 사용자가 "UI 설계 포함"을 선택하면 `superpowers:brainstorming` 스킬이 호출된다
  3. brainstorming 완료 후 기존 gsd-discuss-phase → gsd-plan-phase 흐름이 정상 실행된다
  4. 사용자가 "UI 없음"을 선택하면 AskUserQuestion 없이 기존 흐름을 그대로 진행한다

**Plans**: 1 plan
Plans:

- [ ] 20-01-PLAN.md — commands/sg-plan.md Step 1.5 삽입 (Visual Companion 분기 + success_criteria 업데이트)

### Phase 21: sg-ui-plan 명령 + 등록 + 문서화

**Goal**: UI 전용 설계 명령 `sg-ui-plan`을 추가하고, plugin.json과 문서에 등록한다
**Depends on**: Phase 20
**Requirements**: VC-03, VC-04, VC-05, VC-06, VC-07
**Success Criteria** (what must be TRUE):

  1. `skills/sg-ui-plan/SKILL.md`가 존재하며 phase 컨텍스트를 ROADMAP.md에서 읽어 `superpowers:brainstorming`을 호출한다
  2. sg-ui-plan 실행 후 HANDOFF.md에 `To: ui-plan` 행이 append된다
  3. `plugin.json`의 `"skills": "./skills/"` 경로 아래에 `skills/sg-ui-plan/` 서브디렉토리가 존재한다 (별도 commands 등록 불필요)
  4. `README.md` 명령표에 sg-ui-plan이 설명과 함께 등재된다
  5. `docs/COMMANDS.md`에 sg-ui-plan 전체 설명이 추가된다

**Plans**: 2 plans
Plans:

- [ ] 21-01-PLAN.md — skills/sg-ui-plan/SKILL.md 생성 + HANDOFF append (VC-03, VC-04, VC-05)
- [ ] 21-02-PLAN.md — README.md + docs/COMMANDS.md 문서화 (VC-06, VC-07)

---

## v2.0 Commands → Skills 마이그레이션

### Phase 22: Skills 파일 생성

**Goal**: 14개 sg-* commands가 skills/sg-*/SKILL.md 형식으로 완전히 전환되어 동일한 워크플로우 동작을 제공한다
**Depends on**: Phase 21 (v2.0 신규 시작)
**Requirements**: SC-01, SC-02, SC-03, SC-04, SC-05, SC-06
**Success Criteria** (what must be TRUE):

  1. `skills/sg-*/SKILL.md` 14개 파일이 모두 존재하고 각 파일에 `name`, `description`, `argument-hint` YAML frontmatter가 있다
  2. 각 SKILL.md가 `<objective>`, `<process>`, `<success_criteria>` 블록을 포함한다
  3. sg-plan과 sg-execute의 SKILL.md에 HANDOFF 로직, lessons 주입, PARALLEL_GROUPS 라우팅 등 복잡한 구성이 보존된다
  4. sg-start/sg-status/sg-health 세션·상태·진단 계열 3개와 워크플로우 계열 4개(sg-explore/sg-review/sg-learn/sg-ship), 유틸리티 계열 5개(sg-quick/sg-update/sg-complete/sg-new/sg-lessons)가 각각 기존 commands/ 대비 동작 차이 없이 실행된다

**Plans**: TBD
**UI hint**: no

### Phase 23: Plugin 연결 + commands/ 제거 + 문서

**Goal**: plugin.json이 skills/ 경로를 참조하고, commands/ 디렉토리가 삭제되며, CLAUDE.md와 README가 변경 사항을 정확히 반영한다
**Depends on**: Phase 22
**Requirements**: PC-01, PC-02, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):

  1. `plugin.json` commands 배열의 모든 경로가 `./skills/sg-*/SKILL.md` 형식 14개로 교체된다
  2. `commands/` 디렉토리와 그 안의 파일 14개가 완전히 삭제되고 저장소에 더 이상 존재하지 않는다
  3. `CLAUDE.md` Technology Stack 섹션과 Architecture 섹션이 commands/ 대신 skills/ 경로를 기준으로 기술된다
  4. `README.md` 명령어 설명에서 commands/ 참조가 모두 skills/ 참조로 교체된다

**Plans**: 2 plans
Plans:
**Wave 1** (병렬 실행 가능)

- [ ] 23-01-PLAN.md — plugin.json commands 키 제거 + commands/ 디렉토리 git rm (PC-01, PC-02)
- [ ] 23-02-PLAN.md — CLAUDE.md Technology Stack/Architecture 재서술 + README.md/README.ko.md 동기화 (DOC-01, DOC-02)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. sg-retro Skill scaffold | v1.2 | 1/1 | Complete | 2026-05-20 |
| 10. analyzer + 추가 lens | v1.2 | 1/1 | Complete | 2026-05-20 |
| 11. 자체 rule runner | v1.2 | 1/1 | Complete | 2026-05-20 |
| 12. lessons aggregation + 재발 방지 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 13. sg-learn 라우팅 전환 + hookify 제거 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 14. Codex 진입점 + .agents/skills/ | v1.3 | 0/TBD | Not started | - |
| 15. 플랫폼별 훅 설정 + Python 픽스 | v1.3 | 0/TBD | Not started | - |
| 16. README Multi-Platform 섹션 | v1.3 | 0/TBD | Not started | - |
| 17. PLAN.md 의존성 분석 | v1.4 | 0/1 | Not started | - |
| 18. sg-parallel-execute 스킬 + 라우팅 | v1.4 | 0/TBD | Not started | - |
| 19. 결과 통합 + 호환성 회귀 테스트 | v1.4 | 0/TBD | Not started | - |
| 20. sg-plan Visual Companion 통합 | v1.5 | 0/1 | Not started | - |
| 21. sg-ui-plan 명령 + 등록 + 문서화 | v1.5 | 0/2 | Not started | - |
| 22. Skills 파일 생성 | v2.0 | 4/4 | Complete   | 2026-05-22 |
| 23. Plugin 연결 + commands/ 제거 + 문서 | v2.0 | 0/2 | Not started | - |
