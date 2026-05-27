# Changelog

All notable changes to `super-gsd` are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

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
