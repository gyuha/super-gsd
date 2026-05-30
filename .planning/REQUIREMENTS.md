# Requirements: super-gsd v2.9 Retro UX Simplification

**Milestone:** v2.9 — Retro UX Simplification
**Created:** 2026-05-30
**Goal:** sg-retro/sg-learn의 lens 선택 마찰을 제거하고 회고 결과를 한눈에 이해할 수 있게 만든다.

---

## v1 Requirements

### LENS — Lens 선택 마찰 제거

- [ ] **LENS-01**: 사용자는 sg-learn 실행 시 lens 선택 질문 없이 smart default(예: dspm+ssc)로 즉시 회고가 시작된다
- [ ] **LENS-02**: lens 6개가 3개 핵심 lens로 통합되어 의도 중복이 제거된다
- [ ] **LENS-03**: 사용자가 명시적으로 다른 lens를 원할 때(예: `sg-learn --pick`)만 한 번의 AskUserQuestion으로 선택할 수 있다

### DISPLAY — 결과 표시 개선

- [ ] **DISPLAY-01**: Action Items의 P1 우선순위가 시각적으로 강조(이모지/색상/순서)되어 한눈에 보인다
- [ ] **DISPLAY-02**: 각 lens 출력 상단에 lens 의도 1-2줄 설명이 표시된다

### DOC — 문서 동기화

- [ ] **DOC-01**: README/README.ko.md의 sg-learn·sg-retro 설명이 새 동작(smart default + 3 lens)을 반영하고, TEAM.md에 회고 워크플로우 가이드가 추가된다

---

## Future Requirements (deferred)

- Phase 종류 기반 적응형 default — 단순 phase는 ssc만, 복잡 phase는 dspm+ssc 자동 결정
- Lens 결과 시각적 diff — 이전 phase lessons와의 변화 추적

---

## Out of Scope

- 새 lens 추가 — 단순화가 목적, lens 종류 확장 금지
- sg-retro skill rewrite — 기존 구조 유지, surgical 변경만
- lessons_ranker.cjs 알고리즘 변경 — weighted scoring 로직 동일 유지

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| LENS-01 | 42 | Not started |
| LENS-02 | 42 | Not started |
| LENS-03 | 43 | Not started |
| DISPLAY-01 | 43 | Not started |
| DISPLAY-02 | 43 | Not started |
| DOC-01 | 44 | Not started |
