# Changelog

All notable changes to `super-gsd` are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.0.52] - 2026-05-31

### Changed

- Cache-refresh bump — 0.0.51 이후 functional 변경 없음. 기존 installation이 marketplace re-fetch로 0.0.51의 stop_hook + loadConfig fix를 manual `/super-gsd:sg-update` 없이도 자동 pickup하도록 plugin version 신호 갱신.

## [0.0.51] - 2026-05-31

### Fixed

- **stop_hook.cjs 정확도 — HANDOFF.md 기반 stage detection 도입** (이전: transcript 패턴 매칭의 stale signal로 stage 진행 후에도 "Run sg-execute" 같은 시대착오 메시지가 emit됨). 새 로직: `.planning/HANDOFF.md`의 마지막 데이터 행 To 컬럼(sg-next 메타 행은 스킵)을 authoritative source로 사용. HANDOFF가 없는 신규 프로젝트는 기존 transcript_matcher로 fallback. complete/ship/init stage는 메시지 emit 안 함 (사용자 선택 대기). `_projectRoot(inputData)` helper로 `inputData.cwd` 우선 → `process.cwd()` fallback으로 프로젝트 루트 정확히 해석.
- **`loadConfig()` 잘못된 경로 수정** — 이전: `PLUGIN_ROOT/.planning/config.json` (Claude Code에서 플러그인 캐시 디렉토리를 가리켜 사용자 프로젝트의 `auto_advance: false` 설정이 무시됨). 새: `_projectRoot(inputData)/.planning/config.json`. 이제 `.planning/config.json`의 `super_gsd.auto_advance: false`가 실제로 작동.
- unused `PLUGIN_ROOT` 상수 제거 (정리).

### Notes

- 동작 변경 자체는 stop_hook.cjs 내부 로직만 영향. 4개 systemMessage 분기 자체는 동일 (gsd-plan-complete / superpowers-implementation-complete / superpowers-review-complete / sg-retro-complete). HANDOFF stage → signal 매핑 추가로 정확성 확보.
- transcript_matcher.cjs는 변경 없음 — HANDOFF.md가 없을 때만 fallback으로 사용됨.

## [0.0.50] - 2026-05-31

### Added

- **Milestone v2.9 Retro UX Simplification** (Phases 42-44) shipped — sg-retro/sg-learn lens 선택 마찰 완전 제거
- Phase 42: Smart default lens (`dspm+ssc`) — `sg-retro <N>` 인자 없이 호출 시 AskUserQuestion/numbered-list 없이 즉시 두 lens 실행. 6 lens → 3 lens(`ssc`/`dspm`/`analyze`) 통합 + dropped lens(`4ls`/`sail`/`5why`) reject (stderr 에러 + exit 1)
- Phase 43: `--pick` 플래그 — token-position-free 탐지 후 AskUserQuestion multiSelect로 정확히 1회 lens 선택. `--pick` + positional lens 충돌은 stderr error + exit 1로 거부. DISPLAY-01 `🔴 P1` emoji prefix in Action Items, DISPLAY-02 `_Intent: ..._` italic line directly after `_Captured:` (각 lens 의도 명시)
- Phase 44: README.md + README.ko.md Commands 테이블 sg-learn/sg-retro 행 갱신, `skills/sg-retro` + `.agents/skills/sg-retro` frontmatter description에 `--pick` 명시, `.planning/TEAM.md`에 `## Retrospective workflow` 섹션 신설 (4 sub-blocks)
- `skills/sg-review` + `.agents/skills/sg-review` Step 1.5 auto-commit gate — `BASE_SHA == HEAD_SHA` + dirty working tree 감지 시 skills/, .agents/skills/, 현재 phase SUMMARY.md를 자동 stage하고 derived `feat(NN)` commit으로 커밋. Phase 42/43 retro P1 #2 closure (sg-parallel-execute → sg-review manual commit 단계 자동화). `.agents/` 환경은 AskUserQuestion 불가하므로 ready-to-paste git add/commit 명령 출력 + exit 1

### Fixed

- Codex adversarial review 발견 — README.md/README.ko.md에서 `--pick`를 Claude Code 전용으로 명시, Codex/Gemini CLI에서는 `$sg-retro <phase> ssc dspm analyze` 위치 인자 대안 안내 (D-17 graceful exit 동작과 docs 정합)
- Phase 43 review fix — `skills/sg-retro/SKILL.md` Step 6 description + success_criteria #3 / `.agents/` success_criteria #4에 `_Intent: ..._` 토큰 누락 보완 (Phase 42 retro stale-prose-drift class 재발)
- Phase 44 review fix — `README.md:37` sg-learn description의 산술 모순 "three lenses (ssc, dspm)" → "two of the three lenses (ssc, dspm)" 정정 (Korean mirror가 이미 정확했음 — 우연한 영문/한글 비대칭으로 documentation arithmetic 검증 누락 발견. NEW retro sub-class: token spec internal consistency check)

### Changed

- ROADMAP.md v2.9 섹션을 `<details>` 한 줄 entry + Archive link로 collapse, Progress 테이블 Phase 42-44 Complete 표시
- PROJECT.md "Current Milestone: v2.9" → "Completed Milestone: v2.9" + Current State 섹션 신설
- STATE.md status `executing` → `complete`, percent 67 → 100
- `.planning/REQUIREMENTS.md` 삭제 (v2.9-REQUIREMENTS.md로 아카이브, 다음 milestone에서 새로 생성)
- 16개 lessons 파일을 `.planning/milestones/v2.9-LESSONS.md`로 weighted-rank archive (`lessons_ranker.cjs --archive`)
- git tag `v2.9` 생성

## [0.0.49] - 2026-05-30

### Fixed

- README/구현 정합성 audit 발견 6건 수정 — `.planning/HANDOFF.md` 스키마 문서의 stale `hookify` enum 제거 및 10개 enum 정확히 명시, `sg-health` NF==7|8 둘 다 허용 (legacy 행 WARN, Phase 39+ 행 OK), `.agents/skills/sg-status` 미러에서 `hookify` 제거 + `ui-plan` 디스플레이 매핑 추가, README "21 skills"를 정직한 "11 of 21" 표기로 수정, Codex 섹션 사용 가능 스킬 6개 → 실제 11개 명시, sg-start/sg-explore 행에 `.gitignore` 자동 추가 동작 명시
- Codex adversarial-review 발견 2건 수정 — `.agents/skills/sg-status` NEXT_CMD 매핑을 `/super-gsd:sg-*` → `$sg-*` 전환 (Codex/Gemini는 슬래시 명령 미지원), `.agents/skills/sg-execute` Step 1.5 main/master 감지 시 advisory-only → BLOCKING 변경 (`SG_ALLOW_MAIN=1` env override로 명시적 opt-in 가능)

### Changed

- Phase 41 leftover placeholder `.planning/phases/41-new-phase/` 정리 (canonical 위치는 `41-team-documentation/`)

## [0.0.48] - 2026-05-29

### Changed

- `.planning/codebase/` 전체 재매핑 — 7개 문서 최신화 (v2.8 완료 이후 기준)

## [0.0.47] - 2026-05-29

### Added

- `sg-start` / `sg-explore` Step 0 — 실행 시 프로젝트 `.gitignore`에 `.planning/` 자동 추가 (멱등). `.planning/codebase/` 는 `!.planning/codebase/` 예외로 git 추적 유지. `.agents/skills/sg-start/SKILL.md` pairwise 동기화.

## [0.0.46] - 2026-05-29

### Added

- `sg-execute` Step 1.5 — main/master 브랜치 감지 시 `phase/{N}-{slug}` 브랜치 생성을 AskUserQuestion으로 제안 (TEAM-03). `.agents/skills/sg-execute` pairwise 적용 (메시지 출력 후 자동 계속)
- `sg-phase complete` Step 4i — feature 브랜치에서만 PR 안내 출력: gh CLI 있으면 `gh pr create --base main`, 없으면 `git push -u origin HEAD` (TEAM-04)
- `.planning/TEAM.md` — 팀원 온보딩 가이드 (Quick Start / Branch strategy / File ownership / Merge order)
- `README.md` `## Team Workflow` 섹션 + `README.ko.md` `## 팀 워크플로우` 섹션 추가
- `.agents/skills/sg-parallel-execute/SKILL.md` 신규 생성 — Codex/Gemini 플랫폼 지원

### Fixed

- `sg-execute` `<success_criteria>` Step 1.5 브랜치 감지 동작 명시 추가
- `sg-phase` `<success_criteria>` Step 4i PR 안내 동작 명시 추가
- `sg-parallel-execute` Step 4i main 브랜치 가드 누락 수정 — feature 브랜치에서만 PR 안내 출력

### Changed

- v2.8 Team Collaboration Support 마일스톤 완료 — Phases 39-41 shipped, git tag v2.8

## [0.0.45] - 2026-05-28

### Fixed

- `sg-parallel-execute` Step 4가 `$ARGUMENTS` 대신 `$GROUPS_JSON_FILE`에서 PHASE_DIR를 파생하도록 수정 — phase 번호 인자(`sg-parallel-execute 2`) 사용 시 `dirname(2)="."` 로 잘못된 경로를 참조하던 버그 수정
- `sg-parallel-execute` Task() 실패 시 HANDOFF.md에 `parallel-failed` 행을 기록하고 재시도 안내를 출력 — 실패 후 sg-execute 재실행이 idempotency로 막히던 문제 해결
- `sg-parallel-execute` Step 2의 "No automatic fallback" 문구 제거 — Step 1.6 자동 생성 로직과의 모순 해소, success_criteria 정리

### Added

- `sg-parallel-execute` phase 번호 인자 지원 — `$ARGUMENTS`가 숫자이면 `.planning/phases/${PHASE_PAD}-*/parallel_groups.json`을 자동 탐색
- `sg-parallel-execute` `parallel_groups.json` 자동 생성 — 파일이 없을 때 PLAN.md의 `wave:` frontmatter를 읽어 자동으로 생성
- `.agents/skills/sg-parallel-execute/SKILL.md` 추가 — Codex/Gemini 플랫폼에서도 스킬 호출 가능

## [0.0.44] - 2026-05-28

### Fixed

- `sg-parallel-execute` wave barrier 버그 수정 — wave 번호를 단순 정렬 키가 아닌 dependency barrier로 처리. 이전 구현은 wave 1과 wave 2 그룹을 동시에 디스패치할 수 있었으나, 수정 후 한 번에 한 wave씩 처리하고 이전 wave가 모두 완료된 후에만 다음 wave를 시작한다
- `sg-parallel-execute` wave 내 4+ 그룹 처리 — `OVERFLOW_GROUPS` 정의 추가로 첫 번째 wave와 이후 wave의 overflow 처리 로직 대칭화. Step 6의 "same as Step 4" 모호한 참조를 자기완결적 Read tool 명시로 교체

### Changed

- README.md / README.ko.md Commands 테이블 동기화 — "sixteen" → "twenty-one" 커맨드 수 수정, `sg-cleanup` / `sg-parallel-execute` / `sg-setup` 3개 누락 항목 추가, `sg-start` 설명을 세션 감지 + Resume/Start/Cancel 로직으로 업데이트 (EN/KO 패리티 유지)

## [0.0.43] - 2026-05-28

### Added

- `sg-cleanup` 신규 스킬 — `gsd-cleanup`을 래핑하고 종료 후 아카이브 내역을 마일스톤별 표로 표시 (before/after 스냅샷 diff 기반)
- `sg-phase` 신규 스킬 — `/super-gsd:sg-phase edit|remove|complete`. edit/remove는 `gsd-phase --edit/--remove`에 위임, **complete**는 신규 인라인 정합 로직(ROADMAP Progress 행을 Complete + 날짜로, Phases 체크박스 `[x]`로, STATE 동기화, 선택적 HANDOFF complete 행) — GSD에 없던 phase-metadata 정합 기능

### Changed

- `sg-complete` 인자 형태 분기로 재작성 — 숫자 `<N>`은 phase 완료(`sg-phase complete <N>`에 위임), `<vX.Y>`는 해당 마일스톤 종료, 무인자는 STATE의 `milestone:`으로 현재 마일스톤 종료. 버전 regex를 숫자 regex보다 먼저 테스트해 `v1.4` 오분류 방지. phase 번호가 gsd-complete-milestone에 버전으로 넘어가던 버그 제거
- README.md / README.ko.md — sg-phase 서브커맨드 표 추가, sg-complete 행 갱신, 기존 "super-gsd는 gsd-phase를 wrapping하지 않는다" 서술 교체. EN/KO 패리티 유지
- v1.4 phase 메타데이터 정합 — phases 17/18/19를 새 `sg-phase complete`로 ROADMAP Progress/Phases 체크박스 정합 (검증 적용)

## [0.0.42] - 2026-05-27

### Changed

- sg-status/.agents/sg-status: 마일스톤 목록 + 현재 마일스톤의 단계(phase) 테이블 출력 단계 추가
- CLAUDE.md: 사용자 언어 메시지 컨벤션 섹션 추가 — skill 스크립트의 사용자 노출 메시지는 산문은 사용자 언어로, 머신 토큰은 영문 원문 그대로 표면화

## [0.0.41] - 2026-05-27

### Changed

- sg-next/sg-status: 스캔백 이후 enum 재검증 추가 — 손상된 HANDOFF.md 데이터가 FROM_STAGE로 전파되지 않고 init으로 폴백 (CR-01)
- sg-status/.agents/sg-status: sg-next 복구 블록을 else{} 내부로 이동하여 D-07 구조 일치 (WR-01)
- skills/sg-next: STAGE_DISPLAY case에 `*)` 폴백 arm 추가 — sg-status와 D-07 패리티 (WR-02)
- sg-status/.agents/sg-status: 스캔백 경로에서 TS를 복구된 실제 행에서 읽도록 수정 (WR-03)
- .agents/sg-learn: sg-retro/SKILL.md 부재 시 $sg-setup 안내 메시지 추가 (IN-01)
- .agents/skills/sg-next, sg-learn: Codex/Gemini 플랫폼 지원 — sg-next 및 sg-learn이 .agents/ 에 부재하여 sg-review 이후 워크플로우가 단절되던 문제 해결
- sg-next/sg-status: sg-next 체인 부패(sg-next→sg-next 순환) 감지 및 이전 실제 stage로 복구
- sg-next: FROM_STAGE가 To 컬럼($5)을 읽던 버그 수정 — 이제 이미 해석된 STAGE_RAW 사용
- 전체 19개 skills/ SKILL.md 한→영 번역 완료 + `<language>` 자동 감지 지시문 삽입

## [0.0.40] - 2026-05-26

### Changed (v2.6 Codex/Gemini 설치 UX 개선 — milestone complete)

- Phase 33: `npx @gyuha/super-gsd install` 단일 명령으로 Codex/Gemini 파일 설치 (`bin/setup.js` + `--gemini`, `--force` 플래그)
- Phase 34: `$sg-setup` 인세션 스킬 추가 — `.agents/skills/sg-setup/SKILL.md` (Codex/Gemini AI Read/Write 방식) + `skills/sg-setup/SKILL.md` (Claude Code Bash cp 방식)
- Phase 35: README.md / AGENTS.md / README.ko.md 설치 섹션을 `git clone + 4 cp` → npx 단일 명령으로 교체, Verify install에 Codex/Gemini 서브섹션 추가, AGENTS.md Quick Start Step 0 추가

## [0.0.39] - 2026-05-26

### Changed (v2.5 Superpowers-Native File Parsing — milestone complete)

- Phase 32: `skills/sg-*/SKILL.md` 8개 + `.agents/skills/sg-*/SKILL.md` 4개에서 bash `grep/sed/awk` 파일 파싱 → Read 도구 + Claude 해석 방식으로 전환
- `sg-plan`: discuss-phase 디렉토리 오작동 방지 — `${PHASE_PAD}-new-phase` pre-create + CONTEXT.md 위치 자동 검증·이동 로직 추가 (retro Medium severity 수정)
- `CLAUDE.md`: macOS 셸 이식성 섹션 Phase lock 제거, Superpowers Read 방식 권장 명시, `.agents/` 쌍 커버 규칙 추가
- sg-rule 3개 신규 생성: `warn-agents-read-comment-in-bash`, `warn-node-process-env-arguments`, `warn-read-inside-bash-fence` (Phase 32 retro High severity 기반)

## [0.0.38] - 2026-05-26

### Changed (v2.4 Hooks Node Migration — milestone complete)

- CLAUDE.md: Hooks 레이어 서술을 `hooks/*.cjs` / Node.js 18+ 기준으로 전면 갱신, Development Commands 예시 4개를 `node hooks/*.cjs` 기반으로 교체
- README.md / README.ko.md: Codex·Gemini 설치 섹션의 "Python scripts" → "Node.js scripts (CommonJS .cjs)" 교체

### Summary: v2.4 Hooks Node Migration (Phases 28–31)

- Phase 28: `hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 신규 작성
- Phase 29: `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` — python3 → node 전환
- Phase 30: 8개 SKILL.md python3 → node 일괄 교체
- Phase 31 / 260525-vp6: `.py` 삭제 + CLAUDE.md / README 문서 Node 기반 갱신

## [0.0.37] - 2026-05-25

### Removed

- `hooks/*.py` 4개 파일 일괄 삭제 — `stop_hook.py`, `rule_runner.py`, `transcript_matcher.py`, `lessons_ranker.py`. Phase 29에서 hooks.json/codex.json/gemini 설정이 모두 .cjs로 라우팅 완료되어 invocation-orphan 상태. Phase 31 CLEAN-01에서 처리 예정이었으나 본 quick task(260525-vp6)로 앞당김.

### Added

- `.cjs` 훅에 sg-retro 회고 완료 신호 감지 재도입 — `transcript_matcher.cjs`에 `SG_RETRO_SIGNALS` 상수와 'sg-retro-complete' 분기, `stop_hook.cjs`에 `cmdShip` 변수와 systemMessage 분기 추가. 회고 완료 시 "Retrospective complete. Run /super-gsd:sg-ship to ship the phase." 안내가 다시 emit된다 (commit e3ae6ea에서 hookify 명명으로 삭제되었던 동작을 sg-retro 시맨틱으로 복구).

## [0.0.36] - 2026-05-25

### Removed

- hookify 플러그인 통합 및 모든 활성 코드/문서 참조 제거 — `hooks/*.cjs`에서 `_hookifyInstalled()` 가드, hookify 규칙 globbing, `hookify-complete` 신호 분기, 고아 헬퍼(`HOOKIFY_SIGNALS`, `_extractHookifyOutput`, `_joinLastNLinesWithTerminators`, `saveHookifyLessons`, `_readCurrentPhase`, `_todayYmd`, `cmdPlan`) 모두 삭제. `CLAUDE.md`/`README*.md`/`skills/sg-{next,status,start,health}/SKILL.md`에서 hookify 언급 정리하고 stage 라우팅을 `sg-retro` 단일 명칭으로 통일. `.py` 파일은 Phase 31 CLEAN-01에서 일괄 삭제 예정. CHANGELOG 과거 항목은 보존.

## [0.0.35] - 2026-05-24

### Fixed

- `.agents/skills/sg-execute`: HANDOFF `execute` 행을 실행 완료 후에만 기록 — 실행 중단 시 재실행이 partial skip 없이 처음부터 다시 실행됨
- `.agents/skills/sg-ship`: 테스트 실패(`|| true` 제거)·merge 실패 시 `exit 1`로 push 차단 — 깨진 코드가 remote에 올라가는 경로 차단
- `.agents/skills/sg-review`: `$ARGUMENTS`를 SHA 또는 `sha..sha` 범위로 실제 파싱 — `BASE_SHA == HEAD_SHA` 오류 시 문서에 명시된 탈출구가 동작하지 않던 버그 수정

## [0.0.34] - 2026-05-24

### Changed

- GSD 저장소 이전에 따른 패키지 참조 전면 업데이트: `get-shit-done-cc` → `@opengsd/get-shit-done-redux` (GitHub: `open-gsd/get-shit-done-redux`)
- `skills/sg-update/SKILL.md`: GSD 감지·설치·버전 확인 로직을 새 패키지명으로 업데이트 (`npm install -g @opengsd/get-shit-done-redux@latest`)
- `README.md`, `README.ko.md`, `CLAUDE.md`, `AGENTS.md`, `.planning/PROJECT.md`: Dependencies 섹션 패키지명 교체

## [0.0.33] - 2026-05-24

### Fixed

- `sg-next` HANDOFF init 체크 두 번째 조건 누락 수정: 파일이 존재하지만 헤더가 없는 경우(빈 파일) 데이터 행이 헤더 없이 append되던 버그 수정 — 2조건 형식으로 변경
- `sg-next` complete/init 분기 FROM_STAGE 하드코딩 수정: 고정값 대신 HANDOFF.md 마지막 행에서 동적으로 읽도록 변경 — transparent-pass 시 감사 로그 정확성 개선

### Added

- Phase 26 DSPM 회고 기록 `.planning/lessons/26-2026-05-23.md`

## [0.0.32] - 2026-05-23

### Added

- `sg-next` 신규 스킬: HANDOFF.md + STATE.md를 읽어 현재 워크플로우 단계를 자동 감지하고 다음 sg-* 명령을 확인 없이 즉시 invoke. 모호한 상태(complete/init)에서만 AskUserQuestion 표시
- sg-status 라우팅 테이블과 동일한 11개 분기 복제(D-07 inline-replication), macOS 이식성 보장

### Fixed

- `sg-next` enum 화이트리스트 누락 수정: sg-next가 To 컬럼에 기록된 후 재실행 시 crash 발생하던 버그 수정 — 화이트리스트에 추가 후 FROM 컬럼으로 투명 통과
- `sg-next` HANDOFF append 순서 수정: complete/init 분기에서 cancel 전에 무조건 append되어 감사 로그가 오염되던 버그 수정 — 사용자 확인 후에만 append

### Changed

- README.md / README.ko.md: sg-next 명령 추가(Commands 테이블, 로드맵 Phase 26), 명령 수 14개 → 16개
- CLAUDE.md: SKILL.md 수 17 → 18 반영, sg-next 데이터 흐름 추가, Developer Profile 플레이스홀더 제거, stop_hook.py 테스트 명령 추가

## [0.0.31] - 2026-05-23

### Fixed

- `sg-status`, `sg-start`: `ui-plan` stage를 인식 못해 "Schema may be corrupted" 오류가 발생하던 버그 수정 — display enum에 `ui-plan` 추가, 다음 명령 `sg-execute`로 라우팅
- `sg-execute`: 소수점 phase (`7.1` 등) 검증 실패 버그 수정 — 정규식을 `^[0-9]+(\.[0-9]+)?$`로 변경, zero-pad 정수에만 적용
- `sg-retro`: 소수점 phase 거부 버그 수정 — `sg-execute`와 동일한 정규식 적용, 정수 전용 zero-pad 조건부 처리
- `sg-retro`, `sg-learn`: HANDOFF.md 기록 시점을 success-based로 변경 — retro 실패/취소 시 `sg-status`가 `sg-ship`으로 잘못 안내하던 문제 해결
- v2.1 Skills 품질 검토 완료: 17개 SKILL.md description GOOD 등급 전환 + `sg-retro` 중복 블록 390줄로 축소

## [0.0.30] - 2026-05-23

### Changed

- v2.0 Commands → Skills 마이그레이션 완료: 14개 SKILL.md 생성 + plugin.json commands 키 제거 + commands/ 디렉토리 삭제
- Phase 23: CLAUDE.md + README.md/ko.md skills/ 기준 재서술
- fix(sg-start): unknown stage → init fallback 추가, parallel case NEXT_CMD 누락 수정
- fix(sg-execute): PHASE_NUM 빈 값 empty-check 추가, complete/ship 재실행 동작 문서화
- fix(sg-review): BASE_SHA == HEAD_SHA 오류 메시지 개선
- fix(sg-plan): gsd-sdk roadmap.get-phase dead code 41줄 제거
- fix(sg-quick): node JSON 파싱 → python3 교체
- fix(sg-health): step 8 중복 번호 수정
- fix(sg-lessons): milestone 인수 검증 추가
- retro(23): Phase 23 회고 6-렌즈 (SSC/4Ls/DSPM/Sail/5why/Analyze) lessons 저장

## [0.0.29] - 2026-05-22

### Added

- sg-ui-plan: UI 설계 전용 brainstorming 명령 추가 — `superpowers:brainstorming`을 직접 실행하고 HANDOFF.md에 `To: ui-plan` 행을 기록한다
- docs/COMMANDS.md: sg-ui-plan Quick Reference 행 + 전체 설명 섹션 추가 (Workflow 다이어그램 optional 브랜치 표시 포함)
- README.md: Commands 테이블에 sg-ui-plan 행 추가

### Fixed

- sg-ui-plan SKILL.md: brainstorming 완료 후 next-step 안내 echo 추가 (`/super-gsd:sg-execute`)

### Other

- sg-rules (로컬): warn-plugin-json-skills-field, warn-state-phase-awk-token 규칙 생성

## [0.0.28] - 2026-05-22

### Fixed

- sg-learn: `Skill(skill="super-gsd:sg-retro")` → `Skill(skill="sg-retro")` — 동일 플러그인 내부 스킬은 prefix 없이 호출해야 하므로 수정 (런타임 실패 방지)
- sg-learn: Phase 파싱 패턴을 표준 파이프라인으로 통일 (`grep -E '^Phase: [0-9]+'` → `grep -E '^Phase:' | sed | awk`) — decimal phase 지원
- sg-start: 검증 case에 `parallel` stage 추가 — sg-execute 병렬 경로 실행 후 sg-start 재개 시 "Unknown stage" 오류로 exit하던 버그 수정
- sg-start: display 매핑에 `parallel) STAGE_DISPLAY="superpowers"` 추가
- sg-execute: PLAN_COUNT 계산 `grep -c '.'` → `grep -c '[^[:space:]]'` — 빈 줄 오계산으로 인한 단일 플랜 wave 오분류 방지
- .agents/skills/sg-status: STAGE_DISPLAY 매핑에 `parallel`, `sg-retro` 추가 — Codex/Gemini 환경에서 이상 출력 방지
- .agents/skills/sg-status: NEXT_CMD 매핑에 `parallel → sg-review`, `sg-retro → sg-ship` 라우팅 추가
- .agents/skills/sg-execute, sg-review: 안내 명령을 Claude Code 슬래시(`/super-gsd:sg-*`) → Codex 스킬(`$sg-*`) 문법으로 수정

## [0.0.27] - 2026-05-22

### Fixed

- stop_hook.py: add platform detection — Codex/Gemini now receive `$sg-*` skill syntax instead of `/super-gsd:sg-*` slash commands that those platforms cannot run
- README / README.ko.md: Codex and Gemini install instructions now include `cp -r ~/super-gsd/hooks .` so hook scripts are available alongside the hook config files
- .agents/skills/sg-retro: decimal phase support (e.g. `7.1`) — validation regex and PHASE_PAD logic updated
- .agents/skills/sg-plan, sg-execute: remove `grep -oE '^[0-9]+'` truncation from STATE.md parsing so decimal phases are preserved

### Added

- .agents/skills/sg-ship: new skill for Codex/Gemini environments to complete the ship step (GSD delegation or manual git merge/push/PR flow)
- commands/sg-health: Hook scripts check (item 4) — warns when `hooks/stop_hook.py` or `hooks/rule_runner.py` is missing from the project root

## [0.0.26] - 2026-05-21

### Added

- v1.4 Team Agent Parallel Execution 마일스톤 완료 (Phase 17-19)
- sg-execute: PLAN.md wave/depends_on/files_modified 파싱으로 독립 병렬 그룹(PARALLEL_GROUPS) 자동 계산 (Phase 17)
- sg-parallel-execute 스킬: parallel_groups.json을 읽어 최대 3개 Task()를 병렬 디스패치 (Phase 18)
- sg-execute Step 9: PARALLEL_GROUPS 감지 시 sg-parallel-execute 스킬로 자동 라우팅 (Phase 18)
- sg-execute Step 8: HANDOFF_TO 변수로 HANDOFF.md To 셀 분기 (parallel/superpowers) (Phase 19)
- sg-status: parallel stage 지원 추가 — 미지원 시 exit 1 crash 방지 (Phase 19)
- sg-execute Step 8.5: [TE-05a] 로그 태그로 wave 없는 경로 보존 명시 (Phase 19)

### Changed

- sg-execute idempotency 검사: (superpowers|parallel) OR 패턴으로 확장 (Phase 19)
- sg-execute objective 설명 업데이트 — parallel 경로 언급 추가

## [0.0.25] - 2026-05-21

### Added

- Milestone v1.3 Multi-Platform Support 시작: Codex, Antigravity CLI(Google), Gemini CLI 지원을 위한 planning artifacts (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, research/) 추가.

## [0.0.24] - 2026-05-21

### Fixed

- `commands/sg-learn.md`: 주석에 남아 있던 `hookify:hookify` 언급을 `super-gsd:sg-retro`로 수정.
- `commands/sg-lessons.md`: description의 "prior Hookify lessons"를 "prior lessons … (written by sg-retro)"로 수정.

## [0.0.23] - 2026-05-21

### Changed

- `commands/sg-update.md`: superpowers/super-gsd 업데이트 결과에 버전 번호 표시 추가 (`updated (5.1.0)` 형태). 버전 미추출 시 graceful fallback.

## [0.0.22] - 2026-05-21

### Changed

- `skills/sg-retro/SKILL.md`: "hookify rule drafts" → "sg-rule drafts" 전면 교체 (10곳). Conversation Analyzer 출력 섹션명 `### Draft Hookify Rules` → `### Draft sg-rules`.
- `commands/sg-health.md`: Hookify 설치 체크를 `[FAIL]++` → `[OPTIONAL]` 변경. hookify는 선택적 의존성이므로 FAIL 카운트에 포함되지 않음.

## [0.0.21] - 2026-05-21

### Changed

- v1.2 마일스톤 아카이브 완료: `.planning/milestones/v1.2-ROADMAP.md` + `v1.2-REQUIREMENTS.md` 생성, `REQUIREMENTS.md` 삭제, `ROADMAP.md` milestone grouping, `PROJECT.md` 업데이트
- Git tag `v1.2` 생성 및 push

## [0.0.20] - 2026-05-21

### Changed

- `commands/sg-learn.md`: Phase 13 — sg-learn now routes to `super-gsd:sg-retro` instead of `hookify:hookify`. HANDOFF stage value "hookify" preserved for sg-status routing compatibility.
- `commands/sg-update.md`: Removed hookify install/update block; sg-update now manages GSD, superpowers, and super-gsd only.
- `README.md` / `README.ko.md`: Hookify demoted to Optional prerequisite. All top-level descriptions updated from "GSD → Superpowers → Hookify" to "GSD → Superpowers → sg-retro".
- `docs/COMMANDS.md`: sg-learn entry updated to reflect `super-gsd:sg-retro` routing.
- `.claude-plugin/plugin.json`: description and keywords updated; "hookify" keyword removed.

## [0.0.19] - 2026-05-21

### Added

- `hooks/lessons_ranker.py`: Phase 12 — weighted top-N lesson ranking (score = 0.4×freq + 0.4×recency + 0.2×severity) and milestone archive mode. Outputs JSON lines sorted by score; `--archive --milestone vX.Y` copies `.planning/lessons/*.md` to `.planning/milestones/vX.Y-LESSONS.md` (originals preserved).
- `commands/sg-plan.md`: Step 0 updated — calls `lessons_ranker.py` to show weighted top-N patterns first, then displays all lessons in fold format (`=== Weighted Top-N Patterns ===` → `=== All Lessons (below) ===`).
- `commands/sg-execute.md`: Step 0 reminder added — shows top-N recurring patterns before phase execution begins.
- `commands/sg-lessons.md`: `--milestone=vX.Y` argument parsing — routes directly to `.planning/milestones/vX.Y-LESSONS.md` archive file.
- `commands/sg-complete.md`: Step 1.3 lessons archive block — reads `milestone:` from STATE.md and runs `lessons_ranker.py --archive` before milestone close (warn-only on failure, never blocks completion).
- 2개 hookify guard 규칙 추가: `warn-grep-pcre-macos` (BSD grep PCRE 비캡처 그룹 미지원), `warn-command-step-physical-order` (commands/ Step 번호 물리적 순서 불일치).

## [0.0.18] - 2026-05-20

### Added

- `hooks/rule_runner.py`: Phase 11 — hookify 미설치 환경에서 `.claude/hookify.*.local.md` + `.claude/sg-rule.*.local.md` 규칙을 독립 Python PreToolUse hook으로 직접 평가. hookify 설치 환경에서는 exit 0 skip. warn/block 두 action 지원. sg-rule이 hookify 동명 rule보다 우선.
- `hooks/hooks.json`: PreToolUse hook 항목 추가 (`rule_runner.py` 연결).
- 2개 hookify guard 규칙 추가: `warn-write-tool-content-key`, `warn-git-review-on-main-branch`.

### Fixed

- `hooks/rule_runner.py`: Write 도구에서 `new_text` 필드 규칙이 동작하지 않던 버그 수정 — `content` 키 fallback 추가.

## [0.0.17] - 2026-05-20

### Added

- `skills/sg-retro/SKILL.md`: Phase 10 — 6개 lens(SSC/4Ls/DSPM + Sailboat/Five Whys/Conversation Analyzer), multiSelect:true 다중 선택, LENS_CODES_ARRAY 기반 순차 실행, 내장 transcript analyzer(hookify 의존 없이 4 카테고리 추출), ANALYZE_LENS_RAN auto-suggest guard.
- 4개 hookify guard 규칙 추가: `warn-shell-empty-array-no-guard`, `warn-flag-init-inside-consumer-block`, `warn-plain-text-wait-for-answer`, `warn-awk-field-extraction-macos`.

### Fixed

- `skills/sg-retro/SKILL.md` review fixes (F-01/02/04/06): multiSelect 빈 응답 guard, ANALYZE_LENS_RAN 루프 전 초기화, LENS_CODE 빈 경우 EXTRA_LENS_CODES fallback, Five Whys 모든 Why 턴에 AskUserQuestion 사용.

## [0.0.16] - 2026-05-20

### Added

- `skills/sg-retro/SKILL.md`: Phase 9 — GSD phase 회고를 위한 내장 Skill. SSC(Start/Stop/Continue), 4Ls, DSPM(Decisions/Surprises/Patterns/Mistakes) 3가지 lens 지원. 결과를 `.planning/lessons/{NN}-{YYYY-MM-DD}.md`에 자동 append.
- `plugin.json`: `"skills": "./skills/"` 등록 — sg-retro Skill 자동 로드.
- 4개 hookify guard 규칙 추가: `warn-sg-ship-preconditions`, `warn-sg-execute-without-plan`, `warn-grep-c-echo-fallback`, `warn-plan-banned-literal-in-prose`.
- README.md / README.ko.md: 진행 중인 milestone Phase CRUD(`/gsd:phase --insert`) 사용법 추가.

## [0.0.15] - 2026-05-20

### Changed

- v1.1 Reliability milestone archived (`8f59177`): `.planning/milestones/v1.1-ROADMAP.md` + `v1.1-REQUIREMENTS.md` 생성, Phase 06/07/08 디렉터리를 `.planning/milestones/v1.1-phases/`로 이동. ROADMAP.md는 milestone 한 줄 entry로 축약, REQUIREMENTS.md 삭제(다음 milestone에서 fresh 생성), PROJECT.md `Current State`를 v1.1 shipped로 갱신, MILESTONES.md v1.1 섹션 추가, STATE.md `## Deferred Items`에 v1.1 close block(9 quick-task SUMMARY 누락 + Phase 8 Task 2 manual verify) 기록.
- `.planning/ROADMAP.md` (`083a6d6`): Phase 6/7/8 체크박스 + Progress 표를 완료 상태로 반영.
- `.planning/HANDOFF.md` (`2eee726`): Phase 8 sg-ship hookify→ship 전이 행 기록.

### Tagged

- `v1.1` git tag 생성: super-gsd v1.1 Reliability — sg-health 자기진단 + sg-status 정확도 + sg-start 세션 복원.

## [0.0.14] - 2026-05-20

### Added

- `commands/sg-start.md` — 세션 감지 + Resume/Start new milestone/Cancel 3-옵션 분기 추가. STATE.md `Phase:` 라인 + HANDOFF.md 마지막 행을 읽어 기존 세션 감지(D-01: STATE.md 존재 + `^Phase:` 캡처 단일 트리거); 감지 시 5-라인(Milestone / Phase / Stage / Last activity / Next) emit 후 AskUserQuestion으로 3-옵션 분기. Resume = emit-only 종료(자동 Skill invoke 없음), Start new milestone = `Skill(gsd-new-milestone, args="")`(빈 문자열 lock), Cancel = `Cancelled. No changes made.` 단일 라인. STATE.md 미감지 시 기존 `Skill(gsd-new-project, args="$ARGUMENTS")` 동작 그대로 유지(D-17 후방 호환). 세 옵션 모두 HANDOFF.md read-only — SESS-04 append-only 자연 충족.

### Changed

- `.planning/STATE.md` — Phase 8 (session-restore) 진행 반영, milestone v1.1 progress 3/8 phases (50%), `Phase:` 라인 stale 해소(Phase 6 → 8 갱신).
- `.planning/HANDOFF.md` — Phase 8 lifecycle 5행(complete→gsd-plan, gsd-plan→superpowers, review→hookify, hookify→ship) + Phase 7 누락된 review/hookify/complete 3행 보강.
- `.planning/phases/08-session-restore/` — CONTEXT.md(D-01~D-17 17개 lock), 08-01-PLAN.md(2 task, 12 acceptance, SESS-01~04 mapping), 08-01-SUMMARY.md 추가.

### Fixed

- `commands/sg-start.md` — Phase 7 D-07이 사전 lock한 인라인 복제 계약 이행: `commands/sg-status.md` L17-21(Phase 파싱) / L26-48(HANDOFF 마지막 행 + Stage 매핑) / L62-74(NEXT_PHASE) / L78-99(Next case) 4개 블록을 글자 그대로 인라인. drift 시 양쪽 동시 수정 lock.

## [0.0.13] - 2026-05-19

### Changed

- `.planning/HANDOFF.md` — sg-learn 완료 후 hookify stage 상태 기록 (Phase 6 sg-health 회고 완료)

## [0.0.12] - 2026-05-19

### Fixed

- `.planning/HANDOFF.md` — Stage enum 주석에 `ship`, `complete` 추가 (v0.0.11에서 7-state로 확장했으나 schema 문서 미갱신 상태였음)
- `hooks/stop_hook.py` — `_read_current_phase()`의 `\S+` 단일토큰 파싱 버그 수정: `Phase: Not started` 같은 비숫자 Phase 라인에서 `int()` 변환 실패로 hookify 완료 시 lessons 파일이 저장되지 않던 문제 해결
- `hooks/transcript_matcher.py` — `IMPLEMENTATION_SIGNALS` 패턴을 좁은 2개로 축소 (`finishing-a-development-branch`, `Branch is ready for review`): 일반 문자열(`All tasks complete` 등)로 인한 false positive 방지
- `commands/sg-review.md` — HANDOFF `From` 컬럼을 하드코딩 `superpowers` → HANDOFF.md 마지막 행 동적 읽기로 변경
- `commands/sg-learn.md` — HANDOFF `From` 컬럼을 하드코딩 `review` → HANDOFF.md 마지막 행 동적 읽기로 변경
- `commands/sg-plan.md` — idempotency grep 앞에 `PHASE_SLUG_P` 비어있음 가드 추가 (phase 디렉토리 없는 상황에서 중복 기록 방지)

## [0.0.11] - 2026-05-19

### Fixed

- `commands/sg-status.md` — `hookify` 단계에서 `sg-complete`로 직행하던 라우팅을 `sg-ship → sg-complete` 경로로 수정; `ship`, `complete` stage를 7-state enum에 추가; `ship` stage는 다음 phase 유무에 따라 `sg-plan <next>` 또는 `sg-complete`로 분기; `complete` stage는 `sg-new`로 라우팅
- `commands/sg-ship.md` — Step 1.5 추가: terminal Skill 호출 직전에 HANDOFF.md에 `ship` row 기록 (sg-status가 정확한 stage 추적 가능)
- `commands/sg-complete.md` — Step 1.5 추가: terminal Skill 호출 직전에 HANDOFF.md에 `complete` row 기록 (sg-status → `sg-new` 추천 활성화)
- `commands/sg-execute.md` — 사전 조건 오류 메시지의 `/gsd:discuss-phase` → `/super-gsd:sg-plan`으로 수정 (super-gsd 명령 체계 일관성)
- `hooks/transcript_matcher.py` — `IMPLEMENTATION_SIGNALS` 추가: Superpowers executing-plans 완료를 `superpowers-implementation-complete` 신호로 감지
- `hooks/stop_hook.py` — `superpowers-implementation-complete` 분기 추가: 구현 완료 후 `/super-gsd:sg-review` 실행 안내 systemMessage 출력
- `README.md` — Phase 4 설명에서 "auto-invokes Hookify" 표현 정정: hooks API는 slash command를 자동 실행하지 않고 systemMessage로 제안만 함

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
