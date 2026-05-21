# Requirements: super-gsd v1.5 Visual Companion UI Integration

**Milestone:** v1.5 Visual Companion UI Integration
**Defined:** 2026-05-22
**Core Value:** sg-plan 실행 중 UI 설계가 필요한 단계에서 superpowers visual companion 사용을 제안하고, 독립형 sg-ui-plan 명령으로 언제든 UI를 시각적으로 설계할 수 있게 한다

## v1.5 Requirements

### sg-plan Visual Companion 통합

- [ ] **VC-01**: sg-plan은 phase를 resolve한 뒤 gsd-discuss-phase 이전에 "이 단계에 UI 설계가 포함되어 있나요?" 를 AskUserQuestion으로 사용자에게 질문한다
- [ ] **VC-02**: 사용자가 UI 단계임을 확인하면 `superpowers:brainstorming` 스킬을 gsd-discuss-phase 이전에 호출한다. brainstorming 완료 후 기존 gsd-discuss-phase → gsd-plan-phase 흐름을 그대로 진행한다

### sg-ui-plan 신규 명령

- [ ] **VC-03**: `commands/sg-ui-plan.md` 파일을 생성한다. 현재 phase를 `$ARGUMENTS` 또는 STATE.md에서 파악하고, ROADMAP.md에서 해당 phase의 목표와 요구사항을 읽어 컨텍스트를 구성한 뒤 `superpowers:brainstorming`을 호출한다
- [ ] **VC-04**: sg-ui-plan은 HANDOFF.md에 `To: ui-plan` 행을 기록한다 (append-only 스키마 준수)

### 등록 및 문서화

- [ ] **VC-05**: `plugin.json` commands 배열에 `./commands/sg-ui-plan.md` 추가
- [ ] **VC-06**: `README.md` 명령표에 sg-ui-plan 항목 추가 (설명: "phase 컨텍스트를 로드해 visual companion 기반 UI 설계 실행")
- [ ] **VC-07**: `docs/COMMANDS.md`에 sg-ui-plan 상세 설명 추가

## Future Requirements (Deferred)

- sg-ui-plan 결과를 `.planning/phases/{N}/UI-SPEC.md`에 자동 저장 — brainstorming 결과 아티팩트 보존
- visual companion 서버 자동 시작/종료 — hooks와 연동하여 세션 관리

## Out of Scope

- visual companion 자체 수정 — superpowers 플러그인 비침투적 사용만
- UI 설계 결과를 PLAN.md에 자동 반영 — 사용자가 수동으로 참조
- sg-explore나 sg-execute에도 visual companion 통합 — sg-plan과 sg-ui-plan 범위로 한정

## Traceability

| REQ-ID | Phase |
|--------|-------|
| VC-01  | 20    |
| VC-02  | 20    |
| VC-03  | 21    |
| VC-04  | 21    |
| VC-05  | 21    |
| VC-06  | 21    |
| VC-07  | 21    |
