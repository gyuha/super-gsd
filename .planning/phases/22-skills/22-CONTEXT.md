# Phase 22: Skills 파일 생성 - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** discuss-phase

<domain>
## Phase Boundary

`commands/*.md` 14개를 `skills/sg-*/SKILL.md` 형식으로 전환한다. **생성 전용** — commands/ 삭제와 plugin.json 교체는 Phase 23 범위.

- 생성 대상: `skills/sg-{name}/SKILL.md` 14개 (기존 `skills/sg-retro/`, `skills/sg-parallel-execute/` 제외)
- 대상 명령: sg-plan, sg-execute, sg-start, sg-status, sg-health, sg-explore, sg-review, sg-learn, sg-ship, sg-quick, sg-update, sg-complete, sg-new, sg-lessons

Phase 23 범위 (이 Phase에서 건드리지 않음): plugin.json commands 배열 교체, commands/ 디렉토리 삭제, CLAUDE.md/README 업데이트

</domain>

<decisions>
## Implementation Decisions

### D-01: Migration 전략 — 완전 복사
- `commands/*.md` 내용을 **그대로 복사**한다. content 미변경.
- YAML frontmatter만 skills 형식으로 교체: `name`, `description`, `argument-hint` 3키 유지.
- `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` 블록은 원본 그대로 복사.
- `<execution_context>` 블록 유무는 원본 commands/ 파일을 따른다 — 통일 강제 없음.

### D-02: 디렉토리 구조
- `skills/sg-{name}/SKILL.md` 서브디렉토리 구조 — 기존 `skills/sg-retro/`, `skills/sg-parallel-execute/` 선례 그대로 따름.
- 평탄 구조(`skills/sg-{name}.md`) 사용하지 않음.

### D-03: Plan 분할 — SC-01~04 그룹별 4개 Plan
REQUIREMENTS.md에 정의된 4개 그룹을 그대로 Plan 단위로 사용:

- **Plan 1 (SC-01)**: `skills/sg-plan/SKILL.md` + `skills/sg-execute/SKILL.md`
  — HANDOFF 로직, lessons 주입, PARALLEL_GROUPS 라우팅 포함 (가장 복잡)
- **Plan 2 (SC-02)**: `skills/sg-start/SKILL.md` + `skills/sg-status/SKILL.md` + `skills/sg-health/SKILL.md`
  — 세션·상태·진단 계열
- **Plan 3 (SC-03)**: `skills/sg-explore/SKILL.md` + `skills/sg-review/SKILL.md` + `skills/sg-learn/SKILL.md` + `skills/sg-ship/SKILL.md`
  — 워크플로우 계열
- **Plan 4 (SC-04)**: `skills/sg-quick/SKILL.md` + `skills/sg-update/SKILL.md` + `skills/sg-complete/SKILL.md` + `skills/sg-new/SKILL.md` + `skills/sg-lessons/SKILL.md`
  — 유틸리티 계열

### D-04: 검증 범위 — 파일 존재 + frontmatter 확인
- 14개 `skills/sg-*/SKILL.md` 파일 존재 여부 확인.
- 각 파일에 `name`, `description` frontmatter 키가 있는지 확인.
- `<objective>`, `<process>` 블록 존재 여부 확인.
- **동작 동일성 테스트 불필요** — commands/가 Phase 22 동안 여전히 존재하므로, 실제 전환 검증은 Phase 23에서 수행.

### D-05: `<success_criteria>` 블록 처리
- 기존 commands/에 `<success_criteria>`가 있는 파일: **그대로 복사**.
- 없는 파일: **원본 content에서 추론하여 간단히 작성** (ROADMAP.md Phase 22 success criteria 대입하지 않음 — 각 명령의 실제 동작 기반으로 간결하게).

### Claude's Discretion
- 각 SKILL.md 생성 시 `argument-hint` 가 commands/에 없는 파일은 생략해도 됨 (sg-retro 선례).
- `<success_criteria>` 추론 작성 시 해당 명령의 `<objective>` 를 기준으로 1~3개 항목으로 간결하게.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 소스 파일 (복사 원본)
- `commands/sg-plan.md` — Plan 1 소스
- `commands/sg-execute.md` — Plan 1 소스 (가장 복잡 — HANDOFF, lessons, PARALLEL_GROUPS 라우팅 포함)
- `commands/sg-start.md` — Plan 2 소스
- `commands/sg-status.md` — Plan 2 소스
- `commands/sg-health.md` — Plan 2 소스
- `commands/sg-explore.md` — Plan 3 소스
- `commands/sg-review.md` — Plan 3 소스
- `commands/sg-learn.md` — Plan 3 소스
- `commands/sg-ship.md` — Plan 3 소스
- `commands/sg-quick.md` — Plan 4 소스
- `commands/sg-update.md` — Plan 4 소스
- `commands/sg-complete.md` — Plan 4 소스
- `commands/sg-new.md` — Plan 4 소스
- `commands/sg-lessons.md` — Plan 4 소스

### 구조 선례
- `skills/sg-retro/SKILL.md` — frontmatter + `<objective>` + `<execution_context>` + `<process>` 블록 구조 선례
- `skills/sg-parallel-execute/SKILL.md` — `<execution_context>` 없는 간결한 SKILL.md 선례

### 요구사항
- `.planning/REQUIREMENTS.md §SC-01~SC-06` — 6개 요건 정의 (frontmatter 필수 키, 필수 블록, 그룹 정의)

### plugin.json (읽기 전용 참조)
- `.claude-plugin/plugin.json` — 현재 commands 배열 구조 참조 (Phase 22에서 수정 안 함)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/sg-retro/SKILL.md`: SKILL.md frontmatter + XML block 구조의 완성된 선례. `name`, `description` 2키 사용 (argument-hint 없음).
- `skills/sg-parallel-execute/SKILL.md`: `<execution_context>` 생략된 간결한 SKILL.md 선례.

### Established Patterns
- commands/ 파일들은 이미 `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` 블록 구조를 사용하고 있어 SKILL.md 형식과 실질적으로 호환됨. Migration = frontmatter 형식 교체 + 디렉토리 이동.
- commands/ YAML frontmatter에는 이미 `name`, `description`, `argument-hint` 3키가 모두 존재. 그대로 유지.

### Integration Points
- Phase 23에서 `plugin.json` "commands" 배열이 `./skills/sg-*/SKILL.md` 경로 14개로 교체될 예정. Phase 22 SKILL.md 경로가 이 형식과 일치해야 함.
- Phase 22 동안 commands/ 와 skills/ 이 공존 — 충돌 없음 (plugin.json은 Phase 23까지 commands/ 참조).

</code_context>

<specifics>
## Specific Ideas

- `skills/sg-{name}/` 디렉토리를 14개 생성하고 각각에 SKILL.md 배치.
- 각 Plan은 해당 그룹의 `mkdir -p` + 파일 작성을 일괄 처리.
- `<success_criteria>` 없는 파일 목록을 Plan 실행 전에 확인하여 추론 작성 범위 사전 파악.

</specifics>

<deferred>
## Deferred Ideas

- plugin.json commands 배열 교체 — Phase 23 범위 (PC-01)
- commands/ 디렉토리 삭제 — Phase 23 범위 (PC-02)
- CLAUDE.md Technology Stack / Architecture 업데이트 — Phase 23 범위 (DOC-01)
- README.md 명령어 경로 업데이트 — Phase 23 범위 (DOC-02)
- .agents/skills/ 파일 유지 — Scope 외 (Codex/Gemini 접근성 보존 결정 유지)

</deferred>

---

*Phase: 22-skills*
*Context gathered: 2026-05-22 via discuss-phase*
