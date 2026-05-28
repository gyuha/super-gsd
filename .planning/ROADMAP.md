# Roadmap: super-gsd

## Milestones

- [x] **v1.0 MVP** (2026-05-16) — Plugin scaffold + 9 sg- commands + Stop/SubagentStop hooks + lessons feedback loop → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Reliability** (2026-05-20) — sg-health 자기진단 + sg-status 정확도 + sg-start 세션 복원 → [Archive](.planning/milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Self-Contained Retrospection** (2026-05-21) — 내장 sg-retro Skill(6 lens) + 자체 rule runner + weighted lessons 랭킹 + hookify 의존성 제거 → [Archive](.planning/milestones/v1.2-ROADMAP.md)
- [x] **v1.5 Visual Companion UI Integration** (2026-05-22) — sg-plan Visual Companion 분기 + sg-ui-plan 독립 명령 → [Archive](.planning/milestones/v1.5-ROADMAP.md)
- [x] **v1.3 Multi-Platform Support** (2026-05-28) — AGENTS.md 재작성 + .agents/skills/ 6개 + 플랫폼별 hooks + README Multi-Platform 섹션 → [Archive](.planning/milestones/v1.3-ROADMAP.md) *(retroactively closed; work shipped 2026-05-21)*
- [x] **v1.4 Team Agent Parallel Execution** (2026-05-28) — PLAN.md 의존성 분석 + 병렬 Agent 실행 + 결과 통합 → [Archive](.planning/milestones/v1.4-ROADMAP.md) *(retroactively closed; work shipped 2026-05-21)*
- [x] **v2.0 Commands → Skills 마이그레이션** (2026-05-23) — commands/*.md 14개를 skills/sg-*/SKILL.md 형식으로 전환 + commands/ 제거 + 문서 업데이트 → [Archive](.planning/milestones/v2.0-ROADMAP.md)
- [x] **v2.1 Skills 품질 검토 및 개선** (2026-05-23) — skill-creator 기준으로 17개 SKILL.md 파일 검토 + 문제점 수정 → [Archive](.planning/milestones/v2.1-LESSONS.md)
- [x] **v2.2 sg-next Auto-Advance** (2026-05-24) — sg-next 명령으로 현재 단계 자동 감지 + 다음 sg-* 명령 즉시 invoke → [Archive](.planning/milestones/v2.2-ROADMAP.md)
- [x] **v2.3 GSD Repository Migration Update** (2026-05-25) — GSD 저장소 이전(`get-shit-done-cc` → `@opengsd/get-shit-done-redux`) 참조 업데이트 → [Archive](.planning/milestones/v2.3-ROADMAP.md)
- [x] **v2.4 Hooks Node Migration** (2026-05-26) — Python 의존성 제거, `hooks/*.py` 4개를 순수 JS(`.cjs`)로 재작성 + 설정/스킬/문서 일괄 교체 → [Archive](.planning/milestones/v2.4-ROADMAP.md)
- [x] **v2.5 Superpowers-Native File Parsing** (2026-05-26) — super-gsd skills의 bash 파이프라인(grep/sed/awk) 파일 파싱을 Read 도구 + Claude 해석 방식으로 전환 + CLAUDE.md 컨벤션 업데이트 → [Archive](.planning/milestones/v2.5-ROADMAP.md)
- [x] **v2.6 Codex/Gemini 설치 UX 개선** (2026-05-26) — npx 단일 명령 설치 + $sg-setup 인세션 스킬 + 문서 개선 → [Archive](.planning/milestones/v2.6-ROADMAP.md)
- [x] **v2.7 Skills & Hooks Internationalization** (2026-05-28) — skills/ + .agents/skills/ + hooks/ 한글→영문 전환 + 27개 SKILL.md 언어 자동 감지 지침 추가 → [Archive](.planning/milestones/v2.7-ROADMAP.md)
- [ ] **v2.8 Team Collaboration Support** — HANDOFF user 추적 + sg-status --team + sg-execute 브랜치 워크플로우 + TEAM.md

## Phases

<details>
<summary>✅ v1.2 Self-Contained Retrospection (Phases 9-13) — SHIPPED 2026-05-21</summary>

- [x] Phase 9: sg-retro Skill scaffold (1/1 plan) — completed 2026-05-20
- [x] Phase 10: 내장 conversation analyzer + 추가 lens (1/1 plan) — completed 2026-05-20
- [x] Phase 11: 자체 rule runner (1/1 plan) — completed 2026-05-20
- [x] Phase 12: lessons aggregation + 재발 방지 가드 (1/1 plan) — completed 2026-05-21
- [x] Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거 (1/1 plan) — completed 2026-05-21

</details>

<details>
<summary>✅ v1.3 Multi-Platform Support (Phases 14-16) — SHIPPED 2026-05-21 / formally closed 2026-05-28</summary>

- [x] Phase 14: Codex 진입점 + .agents/skills/ — completed 2026-05-21
- [x] Phase 15: 플랫폼별 훅 설정 + Python 픽스 — completed 2026-05-21
- [x] Phase 16: README Multi-Platform 섹션 — completed 2026-05-21

</details>

<details>
<summary>✅ v1.4 Team Agent Parallel Execution (Phases 17-19) — SHIPPED 2026-05-21 / formally closed 2026-05-28</summary>

- [x] Phase 17: PLAN.md 의존성 분석 — completed 2026-05-21
- [x] Phase 18: sg-parallel-execute 스킬 + 라우팅 — completed 2026-05-21
- [x] Phase 19: 결과 통합 + 호환성 회귀 테스트 — completed 2026-05-21

</details>

<details>
<summary>✅ v2.0 Commands → Skills 마이그레이션 (Phases 22-23) — SHIPPED 2026-05-23</summary>

- [x] Phase 22: Skills 파일 생성 (4/4 plans) — completed 2026-05-22
- [x] Phase 23: Plugin 연결 + commands/ 제거 + 문서 (2/2 plans) — completed 2026-05-23

</details>

### v2.4 Hooks Node Migration

- [ ] **Phase 28: Core hook scripts Node 포팅** — `hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 신규 작성 (Python 동등성 1:1)
- [ ] **Phase 29: Hook 설정 명령 교체** — `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`의 `python3` → `node` 교체
- [ ] **Phase 30: Skill/Agent 내부 호출 교체** — `skills/sg-{plan,execute,complete,quick,ui-plan}/SKILL.md`와 `.agents/skills/sg-{ship,plan,execute}/SKILL.md`의 python3 호출 일괄 교체
- [ ] **Phase 31: 정리 + 문서** — `hooks/*.py` 4개 일괄 삭제 + CLAUDE.md/README/CHANGELOG 갱신

<details>
<summary>✅ v2.6 Codex/Gemini 설치 UX 개선 (Phases 33-35) — SHIPPED 2026-05-26 / formally closed 2026-05-28</summary>

- [x] Phase 33: npx Installer (1/1 plan) — completed 2026-05-26
- [x] Phase 34: $sg-setup 인세션 스킬 (1/1 plan) — completed 2026-05-26
- [x] Phase 35: 문서 개선 (1/1 plan) — completed 2026-05-26

</details>

<details>
<summary>✅ v2.7 Skills & Hooks Internationalization (Phases 36-38) — SHIPPED 2026-05-28</summary>

- [x] Phase 36: skills/ 영문화 + 언어 자동 감지 (skills/) (3/3 plans) — completed 2026-05-27
- [x] Phase 37: .agents/skills/ 영문화 + 언어 자동 감지 (.agents/) — completed 2026-05-27 *(ad-hoc: 36-fix 커밋에 흡수, 별도 plan 없음)*
- [x] Phase 38: hooks/ 영문화 — completed 2026-05-28 *(ad-hoc: 커밋 391326c 직접 수행, 별도 plan 없음)*

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

---

## v2.1 Skills 품질 검토 및 개선

### Phase 24: Skills 품질 검토

**Goal**: skill-creator 기준으로 17개 SKILL.md 파일 전체를 검토하고 문제점 목록을 작성한다
**Depends on**: Phase 23 (v2.1 신규 시작)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05
**Success Criteria** (what must be TRUE):

  1. 17개 SKILL.md 파일 모두에서 frontmatter 필수 필드(name, description) 존재 여부가 확인된다
  2. 각 description 필드의 트리거링 품질(언제/무엇)이 평가된다
  3. objective/process/success_criteria 블록 완전성이 확인된다
  4. process 내 Bash 스니펫이 macOS/Linux 호환성 기준을 충족하는지 확인된다
  5. cross-reference(Skill(), Agent()) 유효성이 확인되고 문제 발견 시 목록이 작성된다

**Plans**: 1 plan
Plans:

- [x] 24-01-PLAN.md — QUAL 감사 결과를 24-SUMMARY.md로 문서화 (QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05)

### Phase 25: 문제점 수정 및 검증

**Goal**: Phase 24에서 발견된 모든 문제점을 수정하고 재검증한다
**Depends on**: Phase 24
**Requirements**: QUAL-06
**Success Criteria** (what must be TRUE):

  1. 17개 SKILL.md의 description이 모두 "Use this when [상황] — [동작]." 패턴으로 교체된다
  2. sg-retro SKILL.md의 <lens_templates> 블록(157줄)이 삭제되어 391줄 이하가 된다
  3. 25-VERIFICATION.md에 수정 전/후 비교 테이블(17행)이 생성된다

**Plans**: 1 plan
Plans:

- [x] 25-01-PLAN.md — 17개 description rewrite + sg-retro 리팩토링 + 25-VERIFICATION.md 생성 (QUAL-06)

---

<details>
<summary>✅ v2.2 sg-next Auto-Advance (Phase 26) — SHIPPED 2026-05-24</summary>

- [x] Phase 26: sg-next 스킬 구현 (1/1 plan) — completed 2026-05-24

</details>

---

<details>
<summary>✅ v2.3 GSD Repository Migration Update (Phase 27) — SHIPPED 2026-05-25</summary>

- [x] Phase 27: GSD 참조 업데이트 (1/1 plan) — completed 2026-05-25

</details>

<details>
<summary>✅ v2.4 Hooks Node Migration (Phases 28–31) — SHIPPED 2026-05-26</summary>

- [x] Phase 28: Core hook scripts Node 포팅 (5/5 plans) — completed 2026-05-25
- [x] Phase 29: Hook 설정 명령 교체 (1/1 plan) — completed 2026-05-25
- [x] Phase 30: Skill/Agent 내부 호출 교체 (1/1 plan) — completed 2026-05-25
- [x] Phase 31: 정리 + 문서 (1/1 plan) — completed 2026-05-26

</details>

---

---

<details>
<summary>✅ v2.5 Superpowers-Native File Parsing (Phase 32) — SHIPPED 2026-05-26</summary>

- [x] Phase 32: 파일 파싱 방식 전환 (2/2 plans) — completed 2026-05-26

</details>

---

## v2.6 Codex/Gemini 설치 UX 개선

### Phase 33: npx Installer

**Goal**: 사용자가 `npx @gyuha/super-gsd install` 한 명령으로 Codex/Gemini 설치에 필요한 파일을 현재 프로젝트에 복사할 수 있다
**Depends on**: Phase 32 (v2.6 신규 시작)
**Requirements**: INSTALL-01, INSTALL-02, INSTALL-03
**Success Criteria** (what must be TRUE):

  1. `npx @gyuha/super-gsd install` 실행 시 `.codex/hooks.json`, `hooks/`, `.agents/` 파일이 현재 프로젝트 디렉토리에 복사된다
  2. `npx @gyuha/super-gsd install --gemini` 실행 시 `.gemini/settings.json`도 함께 복사된다
  3. 리포지토리 루트에 `package.json`과 `bin/setup.js`가 존재하여 사전 설치 없이 `npx`가 즉시 실행된다
  4. 이미 파일이 존재하는 경우 덮어쓸지 확인하거나 명확한 결과를 출력한다

**Plans**: 1 planPlans:

- [x] 33-01-PLAN.md — package.json + bin/setup.js 구현 + CLAUDE.md 배포 트리거 업데이트 (INSTALL-01, INSTALL-02, INSTALL-03)

### Phase 34: $sg-setup 인세션 스킬

**Goal**: Codex/Gemini 세션 내부에서 `$sg-setup` 스킬 하나로 프로젝트에 필요한 파일이 자동으로 복사된다
**Depends on**: Phase 33
**Requirements**: SKILL-01, SKILL-02
**Success Criteria** (what must be TRUE):

  1. `.agents/skills/sg-setup/SKILL.md`가 존재하고 `$sg-setup` 명령으로 호출 가능하다
  2. `$sg-setup` 실행 시 `hooks/`, `.agents/`, 플랫폼별 설정 파일이 프로젝트 루트에 자동으로 복사된다
  3. 스킬 실행 결과로 복사된 파일 목록과 완료 메시지가 출력된다

**Plans**: TBD

### Phase 35: 문서 개선

**Goal**: README.md와 AGENTS.md를 보는 사용자가 npx 단일 명령으로 설치하고 설치 결과를 직접 검증할 수 있다
**Depends on**: Phase 34
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):

  1. `README.md` Codex/Gemini 설치 섹션이 `npx @gyuha/super-gsd install` 단일 명령으로 재작성되고 기존 4단계 cp 명령이 제거된다
  2. `README.md`에 Verify install 섹션이 추가되어 hooks 동작 확인 방법과 스킬 실행 확인 방법이 명시된다
  3. `AGENTS.md`에 설치 방법과 Verify 체크리스트가 업데이트된다
  4. `README.ko.md`가 README.md의 변경 사항과 동기화된다

**Plans**: TBD

---

## v2.7 Skills & Hooks Internationalization

### Phase 36: skills/ 영문화 + 언어 자동 감지 (skills/)

**Goal**: `skills/sg-*/SKILL.md` 14개의 한글 콘텐츠가 영문으로 전환되고, `skills/` 내 19개 SKILL.md 전체에 언어 자동 감지 지침이 추가된다
**Depends on**: Phase 35 (v2.7 신규 시작)
**Requirements**: I18N-01, I18N-04 (partial — skills/ 19개)
**Success Criteria** (what must be TRUE):

  1. `skills/sg-*/SKILL.md` 14개에서 한글 문자(process, objective, success_criteria, bash 출력 메시지)가 모두 영문으로 대체된다
  2. `skills/` 내 19개 SKILL.md 전체에 `<language>` 자동 감지 블록이 삽입되어 있다
  3. 사용자가 한국어로 입력하면 한국어로, 영어로 입력하면 영어로 응답한다는 지침이 명시된다
  4. bash 코드 블록 내 명령어·flag·변수명은 변경되지 않는다 (text-only rule 준수)
  5. 19개 파일 각각의 YAML frontmatter 구조가 변경 전과 동일하게 유지된다

**Plans**: 3 plans
Plans:
**Wave 1** (병렬 실행 가능)

- [x] 36-01-PLAN.md — Translate top 5 Korean-volume files: sg-retro, sg-next, sg-parallel-execute, sg-start, sg-health (I18N-01)
- [x] 36-02-PLAN.md — Translate remaining 9 Korean files: sg-setup, sg-execute, sg-ui-plan, sg-plan, sg-lessons, sg-new, sg-complete, sg-status, sg-review (I18N-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 36-03-PLAN.md — Insert <language> auto-detection directive into all 19 SKILL.md files in skills/ (I18N-04)

### Phase 37: .agents/skills/ 영문화 + 언어 자동 감지 (.agents/)

**Goal**: `.agents/skills/sg-*/SKILL.md` 8개의 한글 콘텐츠가 영문으로 전환되고, `.agents/skills/` 내 8개 SKILL.md 전체에 언어 자동 감지 지침이 추가된다 (pairwise convention 완료)
**Depends on**: Phase 36
**Requirements**: I18N-02, I18N-04 (complete — .agents/skills/ 8개)
**Success Criteria** (what must be TRUE):

  1. `.agents/skills/sg-*/SKILL.md` 8개에서 한글 문자(process, objective, success_criteria, 인라인 메시지)가 모두 영문으로 대체된다
  2. `.agents/skills/` 내 8개 SKILL.md 전체에 `<language>` 자동 감지 블록이 삽입되어 있다
  3. I18N-04 요건이 완전히 충족된다 — `skills/` 19개(Phase 36) + `.agents/skills/` 8개(Phase 37) = 27개 전체 커버
  4. bash 코드 블록 내 명령어·flag·변수명은 변경되지 않는다 (text-only rule 준수)
  5. pairwise convention이 충족된다 — Phase 36과 Phase 37이 동일 milestone(v2.7) 내 완료

**Plans**: TBD

### Phase 38: hooks/ 영문화

**Goal**: `hooks/stop_hook.cjs`와 `hooks/rule_runner.cjs`의 한글 주석·인라인 메시지가 영문으로 전환된다
**Depends on**: Phase 37
**Requirements**: I18N-03
**Success Criteria** (what must be TRUE):

  1. `hooks/stop_hook.cjs`에서 한글 문자열을 포함하는 주석과 인라인 메시지가 모두 영문으로 대체된다
  2. `hooks/rule_runner.cjs`에서 한글 문자열을 포함하는 주석과 인라인 메시지가 모두 영문으로 대체된다
  3. 두 파일의 코드 로직(분기, 조건, 함수 구조)은 변경되지 않는다
  4. `grep -r '[가-힣]' hooks/stop_hook.cjs hooks/rule_runner.cjs` 실행 결과가 빈 출력이다

**Plans**: TBD

---

## v2.8 Team Collaboration Support

### Phase 39: HANDOFF 사용자 추적 + sg-status --team
**Plans:** 2 plans

**Wave 1**
- [x] 39-01-PLAN.md — HANDOFF User 컬럼 추가 (skills/ 8개 + .agents/ 5개 = 13개 SKILL.md) (TEAM-01)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 39-02-PLAN.md — sg-status --team 플래그 처리 (TEAM-02)



**Goal**: 팀원의 작업 이력이 HANDOFF.md에 자동 기록되고, `sg-status --team`으로 현재 팀 상태를 확인할 수 있다
**Depends on**: Phase 38 (v2.8 신규 시작)
**Requirements**: TEAM-01, TEAM-02
**Success Criteria** (what must be TRUE):

  1. 모든 `sg-*` 명령의 HANDOFF.md append 시 `git config user.name` 값이 pipe-delimited 6번째 컬럼으로 기록된다
  2. `sg-status --team` 실행 시 `phase/*` 브랜치 목록을 `git branch -r` 또는 `git branch`로 조회하고, 브랜치별 마지막 커밋 시각과 커밋 작성자를 표로 출력한다
  3. 팀원이 없거나 `phase/*` 브랜치가 없으면 "No active phase branches found" 메시지를 출력하고 정상 종료한다
  4. `--team` 플래그 없는 기존 `sg-status` 동작은 변경되지 않는다

**Plans**: 2 plans

Plans:
- [x] 39-01-PLAN.md — HANDOFF User 컬럼 추가 (sg-plan/execute/review/ship/complete/next × skills/ + .agents/)
- [x] 39-02-PLAN.md — sg-status --team 플래그 처리

### Phase 40: sg-execute 브랜치 워크플로우 + PR 안내

**Goal**: main 브랜치에서 phase 작업 시작을 감지하고 브랜치 생성을 제안하며, phase 완료 시 PR 생성을 안내한다
**Depends on**: Phase 39
**Requirements**: TEAM-03, TEAM-04
**Success Criteria** (what must be TRUE):

  1. `sg-execute`가 main 또는 master 브랜치에서 실행되면 `phase/{N}-{slug}` 브랜치 생성을 AskUserQuestion으로 제안한다
  2. 사용자가 브랜치 생성에 동의하면 `git checkout -b phase/{N}-{slug}` 명령이 실행된다
  3. `sg-complete [N]` (phase 완료) 직후 gh CLI 존재 여부를 확인하고, 있으면 `gh pr create --base main` 명령을 출력, 없으면 git push 방법을 안내한다
  4. 기존 feature 브랜치에서 실행 중이면 브랜치 제안 없이 기존 흐름을 그대로 실행한다

**Plans:** 2 plans

**Wave 1**
- [ ] 40-01-PLAN.md — sg-execute Step 1.5 브랜치 감지 + AskUserQuestion 제안 (skills/ + .agents/ pairwise) (TEAM-03)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 40-02-PLAN.md — sg-phase complete Step 4i PR 안내 (TEAM-04)

### Phase 41: 팀 문서화

**Goal**: TEAM.md와 README 팀 섹션으로 팀원이 super-gsd 팀 워크플로우를 독립적으로 온보딩할 수 있다
**Depends on**: Phase 40
**Requirements**: DOC-01, DOC-02
**Success Criteria** (what must be TRUE):

  1. `.planning/TEAM.md`가 생성되어 브랜치 전략(phase/* 명명 규칙), 파일 소유권 규칙(STATE.md는 누가 수정하는지), merge 순서 컨벤션을 명시한다
  2. `README.md`에 "Team Usage" 섹션이 추가되어 git user.name 설정 확인 방법과 `sg-status --team` 사용법이 기술된다
  3. README.ko.md에도 동일 내용이 동기화된다

**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. sg-retro Skill scaffold | v1.2 | 1/1 | Complete | 2026-05-20 |
| 10. analyzer + 추가 lens | v1.2 | 1/1 | Complete | 2026-05-20 |
| 11. 자체 rule runner | v1.2 | 1/1 | Complete | 2026-05-20 |
| 12. lessons aggregation + 재발 방지 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 13. sg-learn 라우팅 전환 + hookify 제거 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 14. Codex 진입점 + .agents/skills/ | v1.3 | — (ad-hoc) | Complete | 2026-05-28 |
| 15. 플랫폼별 훅 설정 + Python 픽스 | v1.3 | — (ad-hoc) | Complete | 2026-05-28 |
| 16. README Multi-Platform 섹션 | v1.3 | — (ad-hoc) | Complete | 2026-05-28 |
| 17. PLAN.md 의존성 분석 | v1.4 | — (ad-hoc) | Complete | 2026-05-28 |
| 18. sg-parallel-execute 스킬 + 라우팅 | v1.4 | — (ad-hoc) | Complete | 2026-05-28 |
| 19. 결과 통합 + 호환성 회귀 테스트 | v1.4 | — (ad-hoc) | Complete | 2026-05-28 |
| 20. sg-plan Visual Companion 통합 | v1.5 | 0/1 | Not started | - |
| 21. sg-ui-plan 명령 + 등록 + 문서화 | v1.5 | 0/2 | Not started | - |
| 22. Skills 파일 생성 | v2.0 | 4/4 | Complete   | 2026-05-22 |
| 23. Plugin 연결 + commands/ 제거 + 문서 | v2.0 | 2/2 | Complete | 2026-05-23 |
| 24. Skills 품질 검토 | v2.1 | 2/1 | Complete    | 2026-05-23 |
| 25. 문제점 수정 및 검증 | v2.1 | 1/1 | Complete   | 2026-05-23 |
| 26. sg-next 스킬 구현 | v2.2 | 1/1 | Complete | 2026-05-24 |
| 27. GSD 참조 업데이트 | v2.3 | 1/1 | Complete | 2026-05-25 |
| 28. Core hook scripts Node 포팅 | v2.4 | 5/5 | Complete | 2026-05-25 |
| 29. Hook 설정 명령 교체 | v2.4 | 1/1 | Complete | 2026-05-25 |
| 30. Skill/Agent 내부 호출 교체 | v2.4 | 1/1 | Complete | 2026-05-25 |
| 31. 정리 + 문서 | v2.4 | 1/1 | Complete | 2026-05-26 |
| 32. 파일 파싱 방식 전환 | v2.5 | 2/2 | Complete | 2026-05-26 |
| 33. npx Installer | v2.6 | 1/1 | Complete    | 2026-05-26 |
| 34. $sg-setup 인세션 스킬 | v2.6 | 1/1 | Complete | 2026-05-26 |
| 35. 문서 개선 | v2.6 | 1/1 | Complete | 2026-05-26 |
| 36. skills/ 영문화 + 언어 자동 감지 (skills/) | v2.7 | 3/3 | Complete | 2026-05-27 |
| 37. .agents/skills/ 영문화 + 언어 자동 감지 (.agents/) | v2.7 | — (ad-hoc) | Complete | 2026-05-27 |
| 38. hooks/ 영문화 | v2.7 | — (ad-hoc) | Complete | 2026-05-28 |
| 39. HANDOFF 사용자 추적 + sg-status --team | v2.8 | 2/2 | Complete | 2026-05-28 |
| 40. sg-execute 브랜치 워크플로우 + PR 안내 | v2.8 | 2/2 | Complete | 2026-05-29 |
| 41. 팀 문서화 | v2.8 | 0/TBD | Not started | - |
