# Requirements: super-gsd v2.3

## Goal

GSD가 `gsd-build/get-shit-done`(npm: `get-shit-done-cc`)에서 `open-gsd/get-shit-done-redux`(npm: `@opengsd/get-shit-done-redux`)으로 이전됨에 따라 super-gsd 내 모든 GSD 참조를 새 저장소·패키지로 업데이트한다.

## Background

- **구 저장소**: `gsd-build/get-shit-done` / npm: `get-shit-done-cc`
- **신 저장소**: `open-gsd/get-shit-done-redux` / npm: `@opengsd/get-shit-done-redux`
- **설치 명령 변경**: `npm install -g get-shit-done-cc` → `npx @opengsd/get-shit-done-redux@latest`
- **이유**: 원 유지관리자(TÂCHES) 2026-04-01 이후 연락 두절, 포크 유지관리자 trek-e가 새 저장소 관리 중

## Requirements

### REF-01: README.md GSD 참조 업데이트
사용자 문서(영문)에서 `get-shit-done-cc`를 `@opengsd/get-shit-done-redux`로 교체하고 GitHub URL을 새 저장소 URL로 업데이트한다.
**Files**: `README.md`

### REF-02: README.ko.md GSD 참조 업데이트
사용자 문서(한국어)에서 동일한 참조를 업데이트한다.
**Files**: `README.ko.md`

### REF-03: CLAUDE.md Dependencies 업데이트
프로젝트 의존성 섹션에서 `get-shit-done-cc` → `@opengsd/get-shit-done-redux`로 업데이트한다.
**Files**: `CLAUDE.md`

### REF-04: AGENTS.md Dependencies 업데이트
Codex/다중 런타임 의존성 섹션 업데이트.
**Files**: `AGENTS.md`

### REF-05: skills/sg-update/SKILL.md 패키지 참조 전면 업데이트
- 패키지명: `get-shit-done-cc` → `@opengsd/get-shit-done-redux`
- 설치 명령: `npm install -g get-shit-done-cc@latest` → `npm install -g @opengsd/get-shit-done-redux@latest`
- 감지 로직: `npm list -g --depth=0 get-shit-done-cc` → `npm list -g --depth=0 @opengsd/get-shit-done-redux`
**Files**: `skills/sg-update/SKILL.md`

### REF-06: .planning/PROJECT.md Constraints 업데이트
프로젝트 내부 문서의 의존성 참조 업데이트.
**Files**: `.planning/PROJECT.md`

## Out of Scope

- `.agents/skills/` 내 GSD 감지 로직 — `gsd-sdk` 바이너리명·`~/.claude/get-shit-done` 경로는 변경 없음
- `skills/sg-health/SKILL.md` — `~/.claude/get-shit-done` 경로 체크는 여전히 유효
- `.planning/` 아카이브 파일들 — 과거 이력은 수정하지 않음
- GSD 자체의 동작 변경 — 비침투적 원칙 유지

## Success Criteria

1. `grep -r "get-shit-done-cc" README.md README.ko.md CLAUDE.md AGENTS.md skills/ .planning/PROJECT.md` 결과가 0건
2. 교체된 모든 파일에서 `@opengsd/get-shit-done-redux` 참조가 정상적으로 등장
3. `sg-update` 실행 시 새 패키지명으로 감지·설치 시도

## Traceability

| REQ-ID | Phase | Status | Notes |
|--------|-------|--------|-------|
| REF-01 | 27 | ✅ Validated | README.md 1줄 |
| REF-02 | 27 | ✅ Validated | README.ko.md 1줄 |
| REF-03 | 27 | ✅ Validated | CLAUDE.md 1줄 |
| REF-04 | 27 | ✅ Validated | AGENTS.md 1줄 |
| REF-05 | 27 | ✅ Validated | sg-update/SKILL.md 8줄 |
| REF-06 | 27 | ✅ Validated | PROJECT.md 1줄 |
