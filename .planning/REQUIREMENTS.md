# Requirements: super-gsd v2.8 Team Collaboration Support

## Milestone v2.8 Requirements

### TEAM (팀 협업 기능)

- [ ] **TEAM-01**: 모든 `sg-*` 명령의 HANDOFF.md append 시 `git config user.name` 값이 `user` 컬럼에 자동 기록된다
- [ ] **TEAM-02**: `sg-status --team` 실행 시 `phase/*` 브랜치 목록을 분석하여 팀원별 현재 작업 phase와 마지막 커밋 시각을 표로 출력한다
- [ ] **TEAM-03**: `sg-execute` phase 시작 시 main/master 브랜치 여부를 감지하고, phase 작업 전용 브랜치(`phase/{N}-{slug}`) 생성을 제안한다
- [ ] **TEAM-04**: `sg-complete [N]` (phase 완료) 시 PR 생성 명령을 안내한다 — gh CLI 있으면 `gh pr create` 명령 출력, 없으면 git push URL 패턴 안내

### DOC (문서화)

- [ ] **DOC-01**: `.planning/TEAM.md` 생성 — 브랜치 전략, 파일 소유권 규칙, merge 순서 컨벤션 문서화
- [ ] **DOC-02**: `README.md` 팀 사용 섹션 추가 — git 설정 확인 방법 + `sg-status --team` 사용법

## Future Requirements

- STATE.md per-user 분리 (`STATE-{username}.md`) — v2.9 후보
- 팀원별 phase 할당 기능 — 규모 커질 때
- GitHub Actions 연동 — CI 결과를 sg-status에 표시

## Out of Scope (v2.8)

- STATE.md per-user 분리 — 범위 초과, 옵션 B 전체 구현
- GitHub/GitLab API 직접 통합 — gh CLI 폴백으로 대체
- 팀원 관리 UI (roster 추가/제거 명령) — 오버엔지니어링

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| TEAM-01 | 39 | Not started |
| TEAM-02 | 39 | Not started |
| TEAM-03 | 40 | Not started |
| TEAM-04 | 40 | Not started |
| DOC-01 | 41 | Not started |
| DOC-02 | 41 | Not started |
