# Requirements: super-gsd v2.0 Commands → Skills 마이그레이션

**Milestone:** v2.0 Commands → Skills 마이그레이션
**Defined:** 2026-05-22
**Core Value:** commands/*.md 14개를 skills/sg-*/SKILL.md 형식으로 전환하고 commands/ 디렉토리를 제거한다. Claude Code가 commands와 skills를 통합하는 장기 로드맵에 선제적으로 대응한다.

## v2.0 Requirements

### Skills 파일 생성 (SC)

- [ ] **SC-01**: `skills/sg-plan/SKILL.md` + `skills/sg-execute/SKILL.md` 생성 — commands/sg-plan.md, commands/sg-execute.md 로직 이전 (HANDOFF 로직, lessons 주입 등 복잡한 구성 포함)
- [ ] **SC-02**: `skills/sg-start/SKILL.md` + `skills/sg-status/SKILL.md` + `skills/sg-health/SKILL.md` 생성 — 세션/상태/진단 계열 전환
- [ ] **SC-03**: `skills/sg-explore/SKILL.md` + `skills/sg-review/SKILL.md` + `skills/sg-learn/SKILL.md` + `skills/sg-ship/SKILL.md` 생성 — 워크플로우 계열 전환
- [ ] **SC-04**: `skills/sg-quick/SKILL.md` + `skills/sg-update/SKILL.md` + `skills/sg-complete/SKILL.md` + `skills/sg-new/SKILL.md` + `skills/sg-lessons/SKILL.md` 생성 — 유틸리티 계열 전환
- [ ] **SC-05**: 각 SKILL.md는 YAML frontmatter `name`, `description`, `argument-hint` 포함
- [ ] **SC-06**: 각 SKILL.md는 `<objective>`, `<process>`, `<success_criteria>` 블록 포함

### Plugin 연결 및 정리 (PC)

- [ ] **PC-01**: `plugin.json` "commands" 배열을 `./skills/sg-*/SKILL.md` 경로 14개로 교체
- [ ] **PC-02**: `commands/` 디렉토리 삭제 (14개 파일 전체 제거)

### 문서 업데이트 (DOC)

- [ ] **DOC-01**: `CLAUDE.md` Technology Stack + Architecture 섹션에서 commands/ → skills/ 반영
- [ ] **DOC-02**: `README.md` 명령어 설명에서 commands/ 경로 → skills/ 경로 업데이트

## Future Requirements (Deferred)

- docs/COMMANDS.md 상세 업데이트 — 각 skill의 process 블록 요약 추가
- `.agents/skills/` 와 `skills/` 중복 제거 — sg-plan은 현재 두 위치에 존재
- v1.5 Phase 21 (sg-ui-plan) — Visual Companion 완성 (commands→skills 이후 재검토)

## Out of Scope

- GSD/Superpowers 내부 파일 수정 — non-invasive 원칙 유지
- .agents/skills/ 파일 제거 — Codex/Gemini 접근성 유지 목적으로 보존
- 플러그인 동작 변경 — 동일한 로직, 위치만 변경

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SC-01 | 22 | Not started |
| SC-02 | 22 | Not started |
| SC-03 | 22 | Not started |
| SC-04 | 22 | Not started |
| SC-05 | 22 | Not started |
| SC-06 | 22 | Not started |
| PC-01 | 23 | Not started |
| PC-02 | 23 | Not started |
| DOC-01 | 23 | Not started |
| DOC-02 | 23 | Not started |
