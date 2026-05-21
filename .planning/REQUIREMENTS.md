# Requirements: super-gsd v1.4 Team Agent Parallel Execution

**Milestone:** v1.4 Team Agent Parallel Execution
**Defined:** 2026-05-21
**Core Value:** sg-execute에서 PLAN.md의 wave/depends_on 구조를 활용해 독립 태스크를 병렬 Agent로 동시 실행하여 구현 속도를 높인다

## v1.4 Requirements

### 의존성 분석 (Dependency Analysis)

- [ ] **TE-01a**: sg-execute가 PLAN.md frontmatter에서 `wave`, `depends_on`, `files_modified` 필드를 파싱하여 독립 그룹(PARALLEL_GROUPS)을 계산한다
- [ ] **TE-01b**: `files_modified` 교집합이 있는 plan은 무조건 동일 그룹으로 병합한다 (파일 충돌 방지)
- [ ] **TE-01c**: 독립 그룹이 2개 미만이면 기존 `superpowers:executing-plans` 경로로 폴백한다

### 병렬 실행 (Parallel Execution)

- [ ] **TE-02a**: sg-parallel-execute 스킬이 PARALLEL_GROUPS를 받아 각 그룹을 Task()로 동시 실행한다
- [ ] **TE-02b**: 병렬 에이전트는 bare Task() 직접 구현 — `superpowers:executing-plans` 호출 금지
- [ ] **TE-03a**: 에이전트 수는 wave별 독립 plan 수 기반으로 자동 결정, 상한 3개

### 결과 통합 (Result Integration)

- [ ] **TE-04a**: 오케스트레이터가 모든 에이전트 완료 후 HANDOFF.md에 단독으로 기록한다 (동시 쓰기 race condition 방지)
- [ ] **TE-04b**: wave가 1개(또는 없음)이면 기존 `superpowers:executing-plans` 경로를 그대로 사용한다

### 폴백 및 호환성 (Fallback & Compatibility)

- [ ] **TE-05a**: wave 정보가 없는 PLAN.md는 항상 순차 실행 — 기존 sg-execute 동작 완전 보존
- [ ] **TE-05b**: sg-execute의 idempotency 검사, HANDOFF.md 기록, lessons 주입 로직은 변경하지 않는다

## Future Requirements (Deferred)

- **isolation: worktree**: 병렬 에이전트별 git worktree 격리 — v1.4는 files_modified 교집합 검사로 충분, worktree merge 복잡성 회피
- **자동 재시도 로직**: 실패 에이전트 자동 재시도 — v1.4는 실패 시 수동 재실행 안내로 충분
- `--parallel` 플래그: wave 자동 감지가 UX 우월 — 플래그 불필요

## Out of Scope

- Agent Teams (TeamCreate 도구): 실험적, opt-in, 세션 재개 불가 등 제약 과다
- `superpowers:executing-plans` 내부 수정: non-invasive 원칙 유지
- HANDOFF.md 스키마 변경: 하위 호환성 위험 — Plan Hash에 `[w:N/M]` 인코딩만 추가

## Traceability

| REQ-ID | Phase |
|--------|-------|
| TE-01a, TE-01b, TE-01c | Phase 17 |
| TE-02a, TE-02b, TE-03a | Phase 18 |
| TE-04a, TE-04b, TE-05a, TE-05b | Phase 19 |
