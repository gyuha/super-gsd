---
phase: 13-sg-learn-routing
plan: 01
status: complete
completed: 2026-05-21
duration_min: ~20
tasks: 2
files: 6
---

# Phase 13 Plan 01 — Summary

## Objective
sg-learn 라우팅을 hookify:hookify에서 super-gsd:sg-retro로 전환하고, hookify를 필수 의존성에서 제거하여 super-gsd가 hookify 없이 단독 동작하도록 한다.

## Tasks Completed

| Task | Files | Status |
|------|-------|--------|
| Task 1: 6개 파일 수정 (sg-learn, sg-update, README, COMMANDS.md, plugin.json) | 6개 파일 | ✅ |
| Task 2: MIGRATION-02 e2e 체크리스트 | 아래 문서화 | ✅ (deferred to next manual run) |

## Requirements Satisfied

| Requirement | Status |
|-------------|--------|
| MIGRATION-01: sg-learn.md `super-gsd:sg-retro` 호출로 교체 | ✅ commands/sg-learn.md |
| MIGRATION-02: hookify 미설치 환경 e2e checklist | 📋 아래 체크리스트 참조 |
| MIGRATION-03: README/COMMANDS.md/plugin.json hookify demote | ✅ 6개 파일 |
| MIGRATION-04: sg-update hookify 대상 제외 | ✅ commands/sg-update.md |

## MIGRATION-02 E2E 체크리스트 (manual)

다음은 hookify 미설치 환경에서 sg-learn이 정상 동작하는지 검증하는 체크리스트다.

**[A] sg-learn 라우팅 전환 확인**
- [ ] `/super-gsd:sg-learn`을 실행한다
- [ ] 실행 흐름이 hookify:hookify가 아닌 `super-gsd:sg-retro`로 진입한다
- [ ] `.planning/HANDOFF.md`에 stage 값이 "hookify"로 기록된다 (sg-status 호환성 유지)

**[B] sg-update hookify 제외 확인**
- [ ] `/super-gsd:sg-update`를 실행한다
- [ ] 출력 요약에 hookify 라인이 없다:
  ```
  Tools:
  - GSD (get-shit-done-cc): ...
  - superpowers: ...
  - super-gsd: ...
  ```
- [ ] "Installing hookify..." / "Updating hookify..." 메시지가 없다

**[C] README 확인**
- [ ] README.md Prerequisites에 hookify가 Optional 서브섹션에만 있다
- [ ] README.ko.md 동일 확인

**[D] docs/COMMANDS.md 확인**
- [ ] sg-learn "Maps to:" 항목이 `super-gsd:sg-retro`다

**[E] plugin.json 확인**
- [ ] `keywords` 배열에 "hookify"가 없다 ✅ (자동 검증 완료)

## Key Decisions Applied

- **D-01**: sg-learn Skill 교체 `hookify:hookify` → `super-gsd:sg-retro`
- **D-02**: HANDOFF stage 값 "hookify" 유지 (sg-status 라우팅 호환성)
- **D-03/D-04**: sg-update hookify 블록 완전 제거
- **D-05**: README/README.ko.md hookify → Optional 섹션으로 demote
- **D-06**: COMMANDS.md sg-learn 항목 sg-retro 기준으로 업데이트
- **D-07**: plugin.json description + keyword 업데이트

## Commits

- `feat(13): sg-learn routes to sg-retro, remove hookify dependency`
