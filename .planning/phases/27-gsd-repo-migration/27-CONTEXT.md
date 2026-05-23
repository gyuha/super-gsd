# Phase 27 Context: GSD 참조 업데이트

## Goal

super-gsd 코드베이스 내 `get-shit-done-cc` npm 패키지 참조를 `@opengsd/get-shit-done-redux`로 전면 교체한다.

## Background

GSD(Get Shit Done)가 새 저장소(`open-gsd/get-shit-done-redux`)와 새 npm 패키지(`@opengsd/get-shit-done-redux`)로 이전됐다. super-gsd는 GSD를 의존성으로 명시하고 있으며 sg-update가 GSD를 설치·업데이트한다.

## Requirements

- REF-01~06: 6개 파일에서 `get-shit-done-cc` → `@opengsd/get-shit-done-redux` 교체

## Change Map

| File | Lines | Change |
|------|-------|--------|
| `README.md` | 221 | `get-shit-done-cc` → `@opengsd/get-shit-done-redux` |
| `README.ko.md` | 220 | 동일 |
| `CLAUDE.md` | 17 | 의존성 섹션 패키지명 교체 |
| `AGENTS.md` | 12 | 의존성 섹션 패키지명 교체 |
| `skills/sg-update/SKILL.md` | 9,32,33,35,36,42,47,131 | 패키지명·설치 명령·감지 로직 교체 |
| `.planning/PROJECT.md` | 116 | Constraints Dependencies 교체 |

## Known Invariants

- `skills/sg-health/SKILL.md`: `~/.claude/get-shit-done` 경로 체크 — 변경 불필요
- `.agents/skills/`: `gsd-sdk` 바이너리 체크 — 변경 불필요
- `.planning/` 아카이브 파일들: 과거 이력 — 변경 불필요

## Key Decisions

- D-01: sg-update의 설치 명령을 `npm install -g @opengsd/get-shit-done-redux@latest`로 통일 (npx 대신). 이유: sg-update는 비대화형 자동 업데이트가 목적이므로 인터랙티브 installer보다 직접 npm 설치가 적합.
