# Requirements: super-gsd v2.2

**Milestone:** v2.2 sg-next Auto-Advance  
**Goal:** sg-next 명령 하나로 현재 워크플로우 단계를 감지하고 다음 sg-* 명령을 자동 실행한다.

---

## Active Requirements

### sg-next 자동 진행

- [ ] **NEXT-01**: sg-next가 HANDOFF.md의 마지막 행과 STATE.md의 `Phase:` 라인을 읽어 현재 단계를 감지한다
- [ ] **NEXT-02**: 감지된 단계에 따라 sg-status와 동일한 라우팅 테이블을 사용하여 다음 sg-* 명령을 결정한다
- [ ] **NEXT-03**: 다음 명령을 결정한 뒤 1줄 상태 출력(`→ [next-command]`) 후 확인 없이 즉시 invoke한다
- [ ] **NEXT-04**: 단계가 `complete` 또는 `init`(감지 불가)인 경우 AskUserQuestion으로 사용자에게 선택지를 제시한다
- [ ] **NEXT-05**: HANDOFF.md에 `To: sg-next` 행을 append하여 invoke 이력을 기록한다

---

## Out of Scope

- sg-status 자체의 라우팅 테이블 변경 — NEXT-02는 읽기만 한다
- sg-next에 별도 플래그(--force 등) 추가 — 이번 마일스톤은 zero-flag 단순 invoke
- GSD/Superpowers 내부 파일 수정 — non-invasive 원칙 유지

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| NEXT-01 | 26 | — |
| NEXT-02 | 26 | — |
| NEXT-03 | 26 | — |
| NEXT-04 | 26 | — |
| NEXT-05 | 26 | — |
