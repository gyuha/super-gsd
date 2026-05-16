# Requirements: super-gsd v1.1 Reliability

**Milestone:** v1.1 Reliability  
**Goal:** 세션 복원, 단계 감지 정확도, 워크플로우 자기진단으로 사용자가 도구를 신뢰하고 끊김 없이 사용할 수 있도록 한다.

---

## v1.1 Requirements

### HEALTH — 진단

- [ ] **HEALTH-01**: 사용자가 `sg-health`를 실행하면 GSD/Superpowers/Hookify 설치 여부를 확인하고 `[OK]`/`[WARN]`/`[FAIL]` 라인별 결과를 출력한다
- [ ] **HEALTH-02**: 사용자가 `sg-health`를 실행하면 `hooks/hooks.json`에 Stop과 SubagentStop 훅이 등록되어 있는지 확인한다
- [ ] **HEALTH-03**: 사용자가 `sg-health`를 실행하면 `.planning/HANDOFF.md`의 스키마(5컬럼 TSV 구조)를 검증한다
- [ ] **HEALTH-04**: 사용자가 `sg-health`를 실행하면 `.planning/STATE.md` frontmatter가 파싱 가능한지 확인한다
- [ ] **HEALTH-05**: `sg-health`는 어떤 파일도 생성하거나 수정하지 않는다 (완전 읽기 전용)
- [ ] **HEALTH-06**: `transcript_matcher.py`의 bare `'hookify'` 패턴을 `'Retrospective complete'`로 교체하여 `sg-health` 출력 시 stop hook 오발동을 방지한다

### STATUS — 상태 정확도

- [ ] **STATUS-01**: 사용자가 `sg-status`를 실행하면 HANDOFF.md 마지막 데이터 행을 파싱하여 현재 workflow stage(gsd/superpowers/hookify)를 정확히 표시한다
- [ ] **STATUS-02**: HANDOFF.md가 없거나 데이터 행이 없을 경우 `sg-status`는 `init` 상태를 기본값으로 표시하고 오류 없이 종료한다
- [ ] **STATUS-03**: STATE.md Phase 파싱이 `Phase: Not started` 같은 프로즈 텍스트를 올바르게 처리한다 (현재 `Not`만 반환하는 버그 수정)

### SESSION — 세션 복원

- [ ] **SESS-01**: 사용자가 `sg-start`를 실행할 때 HANDOFF.md와 STATE.md를 읽어 기존 세션 여부를 감지한다
- [ ] **SESS-02**: 기존 세션이 감지되면 milestone, stage, 마지막 활동 시각을 표시하고 재개 여부를 사용자에게 질의한다
- [ ] **SESS-03**: 사용자가 재개를 선택하면 gsd-new-project 호출을 건너뛰고 감지된 단계에서 계속한다
- [ ] **SESS-04**: 사용자가 fresh start를 선택해도 HANDOFF.md를 삭제하지 않고 유지한다 (append-only 감사 로그)

---

## Future Requirements

- sg-learn이 hookify 완료 시 HANDOFF.md에 hookify 행 자동 추가 — SESS-01의 정확도를 높임 (v1.2)
- sg-health에 `--json` 플래그 추가 — 스크립팅 용도 (v1.2)
- sg-status에 7일 초과 stale 세션 경고 — 사용자 신뢰도 향상 (v1.2)
- 서브디렉토리에서 실행 시 `.planning/` 자동 탐색 — cwd walk-up (v1.2)

---

## Out of Scope

- GSD/Superpowers/Hookify 내부 동작 수정 — 비침투적 원칙 유지
- HOOK-02: hooks에서 skill 직접 호출 — Claude Code API 제약으로 기술적 불가 (안내 메시지가 최대치)
- sg-repair: 자동 수정 — sg-health는 진단만, 수정은 사용자 책임
- 멀티 프로젝트 동시 오케스트레이션 — 상태 충돌 회피
- 비-Claude 런타임(Codex, Gemini CLI) 지원

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| HEALTH-01 | Phase 6 | Pending |
| HEALTH-02 | Phase 6 | Pending |
| HEALTH-03 | Phase 6 | Pending |
| HEALTH-04 | Phase 6 | Pending |
| HEALTH-05 | Phase 6 | Pending |
| HEALTH-06 | Phase 6 | Pending |
| STATUS-01 | Phase 7 | Pending |
| STATUS-02 | Phase 7 | Pending |
| STATUS-03 | Phase 7 | Pending |
| SESS-01 | Phase 8 | Pending |
| SESS-02 | Phase 8 | Pending |
| SESS-03 | Phase 8 | Pending |
| SESS-04 | Phase 8 | Pending |
