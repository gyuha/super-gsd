# Changelog

All notable changes to `super-gsd` are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.0.10] - 2026-05-17

### Added

- `CLAUDE.md` — `배포` 트리거 절차 추가: 프롬프트에 "배포" 입력 시 버전 bump → CHANGELOG 업데이트 → commit → push 자동 실행

### Changed

- `commands/sg-plan.md` — lessons injection 범위를 "프로젝트 전체(phase 한정 아님)"으로 명확화; `gsd-discuss-phase` 에러 시 중단 처리 추가; `subagent_type` → `general-purpose`; Agent prompt에 `.planning/` 경로 힌트 추가
- `commands/sg-update.md` — process 전체를 단일 bash 블록으로 통합; `claude` CLI 미설치 시 플러그인 단계 자동 skip; 각 단계 실패 exit code 캡처 및 status 표시 (`failed (exit N)`)

### Fixed

- `.planning/HANDOFF.md` — Phase 06-sg-health 핸드오프 로그 항목 누락 보완

## [0.0.9] - 2026-05-17

### Fixed

**전체 14개 커맨드 코드 리뷰 — Skill() 종료 의미론 일관 적용:**

- `sg-start`, `sg-explore`, `sg-new`, `sg-learn` — `Skill()` 이후 도달 불가한 print Step 제거 (dead code); `execution_context`에 "terminal action" 명시
- `sg-review` — `Skill()` 이후 도달 불가한 Step 5 제거; `$DESCRIPTION`/`$PLAN_REQUIREMENTS`/`$BASE_SHA`/`$HEAD_SHA` 대입 지시 추가
- `sg-complete`, `sg-ship` — `Skill()` 이후 dead code 제거; `PHASE_NUM` 빈값 bash 가드 명시화; `$PHASE_NUM` 대입 지시 추가; `success_criteria`에 phase 해석 실패 케이스 추가
- `sg-lessons` — Step 1/2 빈값 가드를 prose → 코드 블록 내부로 이동; `for FILE in $FILES` → `while IFS= read -r FILE` (파일명 word-splitting 방지); `grep` stdin 파이프의 불필요한 `2>/dev/null` 제거
- `sg-plan` — `gsd-discuss-phase`를 `Skill()` → `Agent()` 로 변경(서브에이전트, 반환됨), `gsd-plan-phase`만 `Skill()` 종료 액션으로 유지; `PHASE_NUM` 빈값 bash 가드 추가; 두 곳 모두 `$PHASE_NUM` 대입 지시 추가; `Agent()` 프롬프트에 실패 핸들링 추가
- `sg-quick` — 조건부 `Skill()` 분기에 "session control transfers" 주석 추가; 혼동을 주는 `exit 0` bash 메타포 제거
- `sg-status` — `NEXT_CMD` 매핑 전체를 `/gsd:*`·`/hookify` → `/super-gsd:sg-*` 래퍼로 교체 (`init→sg-plan`, `superpowers/review→sg-learn`, `hookify→sg-plan|sg-complete`); `success_criteria` item 3도 동기화
- `sg-execute` — 9개 버그 수정: idempotency grep 공백 허용(`[[:space:]]*superpowers`), `PHASE_PAD|PHASE_NUM` 양쪽 매칭, ROADMAP Phase 헤더 zero-pad 폴백, `FROM_STAGE` 컬럼 `$4→$5`, SC_TEXT 들여쓰기 고정값 제거(`[[:space:]]*`), `REQ_IDS` 괄호 접미사 제거, HANDOFF.md 헤더 검사 `-Fxq → 부분문자열 grep`

### Changed

- `README.md` — `sg-explore` 설명의 스킬 이름 `gsd-explore` → `gsd-map-codebase` (커맨드 구현과 일치)

## [0.0.8] - 2026-05-16

### Changed

- v1.0 마일스톤 아카이브 완료 — `MILESTONES.md`, `RETROSPECTIVE.md` 생성, phase 디렉토리 `milestones/v1.0-phases/`로 이전
- STATE.md 상태 정리 — v1.1 Planning 단계로 전환

## [0.0.7] - 2026-05-16

### Added

- `sg-complete` — `gsd-complete-milestone` 매핑 명령 추가 (마일스톤 완료 처리)
- `sg-new` — `gsd-new-milestone` 매핑 명령 추가 (새 마일스톤 시작)

### Changed

- `sg-quick` — `gsd-executor` 대신 `superpowers:executing-plans` 사용하도록 파이프라인 재작성 (gsd-planner → Superpowers 핸드오프)
- `plugin.json` — `sg-complete`, `sg-new` 명령 등록
- `docs/COMMANDS.md` — `sg-complete`, `sg-new` Quick Reference 표 및 상세 섹션 추가
- `README.md` / `README.ko.md` — Commands 표에 `sg-complete`, `sg-new` 추가

## [0.0.6] - 2026-05-16

### Added

- `README.ko.md` — full Korean translation of README

### Changed

- `README.md` is now English-only with a link to `README.ko.md`
- Installation flow simplified: install super-gsd first, then run `sg-update` to auto-install GSD/Superpowers/Hookify
- `CLAUDE.md` versioning convention: `plugin.json` and `CHANGELOG.md` must always be updated together when bumping the version

## [0.0.2] - 2026-05-15

### Added

- Manual handoff command: /super-gsd:to-superpowers (packages a GSD phase into a Superpowers-ready prompt and auto-invokes superpowers:executing-plans)
- Workflow status command: /super-gsd:status (shows current stage, last handoff timestamp, and next recommended command)
- Append-only handoff log scaffold: .planning/HANDOFF.md (5-column markdown table — Timestamp | Phase | From | To | Plan Hash)

## [0.0.1] - 2026-05-15

### Added

- Initial plugin manifest (`.claude-plugin/plugin.json`)
- Self-hosted marketplace registry (`.claude-plugin/marketplace.json`)
- README with installation and verification checklist
