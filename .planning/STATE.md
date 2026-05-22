---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Commands → Skills 마이그레이션
status: planning
stopped_at: Phase 22 context gathered
last_updated: "2026-05-22T07:07:37.331Z"
last_activity: 2026-05-22 — Milestone v2.0 roadmap created (Phase 22-23)
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 5
  completed_plans: 2
  percent: 17
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-21)

**Core value:** GSD → Superpowers → sg-retro 단계 전환을 자동화하여 학습 루프가 끊기지 않도록 한다
**Current focus:** v2.0 Commands → Skills 마이그레이션 — commands/*.md 14개를 skills/sg-*/SKILL.md 형식으로 전환

## Current Position

Phase: Phase 22 (Not started — roadmap defined)
Plan: —
Status: Roadmap created, ready for Phase 22 planning
Last activity: 2026-05-22 — Milestone v2.0 roadmap created (Phase 22-23)

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: ~6min
- Total execution time: ~18min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | ~15min | ~7.5min |
| 2 | 1 | ~3min | ~3min |

**Recent Trend:**

- Last 5 plans: 01-01 (~5min), 01-02 (~10min), 02-01 (~3min)
- Trend: Schema-only plans are fast (~3min); upcoming 02-02 will be longer (two slash command authoring)

*Updated after each plan completion*
| Phase 2 P02 | ~8min | 2 tasks | 2 files |
| Phase 03-sg-command-set-readme P01 | 3min | 2 tasks | 4 files |
| Phase 03-sg-command-set-readme P02 | 3min | 2 tasks | 2 files |
| Phase 03-sg-command-set-readme P03 | 57 | 3 tasks | 4 files |
| Phase 04 P01 | 128 | 3 tasks | 4 files |
| Phase 05 P01 | 8min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initialization: Non-invasive orchestrator — no fork of GSD/Superpowers/Hookify
- Initialization: Stop/SubagentStop hooks chosen as auto-handoff trigger
- Initialization: `.planning/HANDOFF.md` reused as state-tracking file (matches GSD convention)
- Initialization: Hookify auto-runs only after review (highest-signal moment)
- 01-01: author/owner are bare string `gyuha` (no email) per D-03/D-06
- 01-01: `repository` URL resolved from `git remote get-url origin` at execute time
- 01-01: marketplace.json `source: "."` — self-hosted same-repo registration
- 01-02: README install commands mirror manifest identity exactly — no improvisation, cross-file checked
- 01-02: Phase 1 README explicitly says no `/super-gsd:*` commands ship yet (anti-overselling, T-02-03)
- 01-02: ASCII workflow diagram chosen over Mermaid per D-11 (portable, identical render everywhere)
- 02-01: HANDOFF.md created with 5-column append-only schema, no data rows (D-26)
- 02-01: plugin.json patched via `jq` to change only `version` field (D-02, T-02-02 mitigation)
- 02-01: CHANGELOG [0.0.2] kept English (OSS surface, matches [0.0.1] tone) while SUMMARY in Korean per .planning/ policy
- [Phase ?]: 02-02: commands/ flat structure + frontmatter minimal keys (D-16/D-17) — namespace prefix automatic
- [Phase ?]: 02-02: hybrid handoff — print structured prompt + auto-invoke Skill in same turn (D-19, D-20)
- [Phase ?]: 02-02: idempotency key = (Phase, To, Plan Hash) with header-row schema validation before append (D-24)
- [Phase ?]: 02-02: status output strictly 3 header lines + blank + Next line (D-29); all user-facing strings English (D-30)
- 03-01: sg- prefix 적용 — to-superpowers→sg-execute (D-36), status→sg-status (D-37) 이름 변경 완료
- 03-01: 내부 교차 참조 일관성 — sg-execute Step 10 ↔ sg-status gsd-plan branch 양방향 참조 정합성 유지
- [Phase ?]: sg-start에 argument-hint 포함 — gsd-new-project가 내부 감지 처리하므로 $ARGUMENTS 파싱 없이 전달
- [Phase ?]: sg-explore argument-hint 생략 — gsd-explore는 인자를 받지 않음, XML 4-section Skill 위임 패턴 적용
- v1.1 research: transcript_matcher.py bare `'hookify'` 패치는 sg-health Phase와 묶어야 함 (오발동 방지)
- v1.1 research: HANDOFF.md 파싱은 parse_handoff.py 헬퍼로 중앙화 — sg-status와 sg-start 공유
- v1.1 research: STATE.md Phase 파싱 정규식 `r'^Phase:\s*(\S+)'` → 전체 라인 캡처로 수정 필요
- v1.3 roadmap: coarse 그래뉼래리티로 4→3 페이즈 압축 (CODEX-01/02/03 묶음) — AGENTS.md와 스킬들은 하나의 배포 단위
- v1.3 roadmap: CODEX-04 + MULTI-01은 Python 훅 폴백 픽스를 공유하므로 Phase 15에 묶음
- v1.3 roadmap: SubagentStop 미지원 사실을 AGENTS.md success criteria에 명시 — 사용자 혼란 방지
- v1.4 roadmap: coarse 그래뉼래리티 → 3 페이즈 (17-19). 의존성 분석 / 병렬 실행 / 결과 통합+호환성 자연 경계
- v1.4 roadmap: superpowers:executing-plans는 순차 폴백에서만 사용 — 병렬 에이전트에서 호출 금지 (non-invasive 원칙)
- v1.4 roadmap: HANDOFF.md는 오케스트레이터만 기록 — 동시 쓰기 race condition 방지
- v1.4 roadmap: wave 없는 PLAN.md는 v1.3 이전 동작 완전 보존 — Phase 19 회귀 테스트로 검증
- v2.0 roadmap: coarse 그래뉼래리티 → 2 페이즈 (22-23). SC 6개(파일 생성) / PC+DOC 4개(연결·제거·문서)로 자연 분리
- v2.0 roadmap: Phase 22에서 14개 SKILL.md 생성 완료 후 Phase 23에서 plugin.json 교체 + commands/ 삭제 — 원자적 전환 보장
- v2.0 roadmap: .agents/skills/ 파일은 scope 외 — Codex/Gemini 접근성 유지를 위해 보존

### Pending Todos

None yet.

### Blockers/Concerns

- MULTI-01 (.gemini/settings.json): Antigravity CLI 훅 스키마 공식 확정 전 — 리서치 신뢰도 MEDIUM. 구현 시 재확인 필요.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260516-2qm | README.md에 사용 예시 섹션 추가 | 2026-05-16 | c9bb22d | [260516-2qm-readme-md](./quick/260516-2qm-readme-md/) |
| 260516-2sw | README.md Prerequisites 섹션에 설치 명령어 추가 | 2026-05-16 | 46962be | [260516-2sw-readme-md-gsd-superpowers-hookify](./quick/260516-2sw-readme-md-gsd-superpowers-hookify/) |
| 260516-dsz | sg-update에 install/update 감지 로직 추가 | 2026-05-16 | 80fe4e0 | [260516-dsz-sg-update-gsd-superpowers-hookify](./quick/260516-dsz-sg-update-gsd-superpowers-hookify/) |
| 260516-edd | README.md 영문/한글 분리 (README.ko.md 신규 생성) | 2026-05-16 | c22d637 | [260516-edd-readme-md-readme-md-readme-ko-md](./quick/260516-edd-readme-md-readme-md-readme-ko-md/) |
| 260516-kqe | sg-complete, sg-new 명령 추가 + README/COMMANDS.md 문서화 | 2026-05-16 | 9050ffd | [260516-kqe-sg-complete-and-sg-new-command-mapping](./quick/260516-kqe-sg-complete-and-sg-new-command-mapping/) |
| 260516-kwk | sg-quick: gsd-executor → superpowers:executing-plans 파이프라인 재작성 | 2026-05-16 | 713c1b9 | [260516-kwk-sg-quick-superpowers-execution-mode](./quick/260516-kwk-sg-quick-superpowers-execution-mode/) |
| 260517-0ao | sg-execute.md 코드 리뷰 버그 수정 | 2026-05-17 | 628750c | [260517-0ao-sg-execute-md](./quick/260517-0ao-sg-execute-md/) |
| 260517-0lh | sg-quick.md 코드 리뷰 버그 수정 | 2026-05-17 | be57fb9 | [260517-0lh-sg-quick-md](./quick/260517-0lh-sg-quick-md/) |
| 260518-wvx | 코드 리뷰 지적사항 수정 (P1: HANDOFF 초기화, 상태 머신, SubagentStop; P2: transcript 패턴, lessons 정규화; Extra: plugin.json, COMMANDS.md) | 2026-05-18 | a57e214 | [260518-wvx-code-review-fixes](.planning/quick/260518-wvx-code-review-fixes/) |
| 260518-x6n | 상태 전이 타이밍 버그 5건 수정 (P1: sg-plan/sg-review/sg-learn 기록 시점; P2: sg-health 경로; P3: COMMANDS.md stale 이름) | 2026-05-18 | 4985921 | [260518-x6n-state-transition-timing-fixes](.planning/quick/260518-x6n-state-transition-timing-fixes/) |
| 260521-0kt | hookify의 종속성을 모두 제거 해 줘. update와 도움말도. | 2026-05-21 | 70df4d3 | [260521-0kt-hookify-update](./quick/260521-0kt-hookify-update/) |
| 260521-9bw | sg-update.md: 각 도구 버전 출력 추가 | 2026-05-21 | 6c18cb9 | [260521-9bw-sg-update-md](./quick/260521-9bw-sg-update-md/) |
| 260521-cdw | README.md와 README.ko.md 의 마일스톤을 업데이트 해 줘 | 2026-05-21 | (pending) | [260521-cdw-readme-md-readme-ko-md](./quick/260521-cdw-readme-md-readme-ko-md/) |

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-16:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| verification | Phase 03: stopped_at 필드 일관성 (기능 정상, 관리 메타 문제) | human_needed | 2026-05-16 |
| verification | Phase 04: SubagentStop 안내 메시지 방식 (hooks API 제약 인정) | human_needed | 2026-05-16 |
| quick_task | 260516-2qm-readme-md | missing | 2026-05-16 |
| quick_task | 260516-2sw-readme-md-gsd-superpowers-hookify | missing | 2026-05-16 |
| quick_task | 260516-dsz-sg-update-gsd-superpowers-hookify | missing | 2026-05-16 |

Items acknowledged and deferred at milestone close on 2026-05-20 (v1.1):

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| quick_task | 260516-2qm-readme-md | missing | 2026-05-20 |
| quick_task | 260516-2sw-readme-md-gsd-superpowers-hookify | missing | 2026-05-20 |
| quick_task | 260516-dsz-sg-update-gsd-superpowers-hookify | missing | 2026-05-20 |
| quick_task | 260516-kqe-sg-complete-and-sg-new-command-mapping | missing | 2026-05-20 |
| quick_task | 260516-kwk-sg-quick-superpowers-execution-mode | missing | 2026-05-20 |
| quick_task | 260517-0ao-sg-execute-md | missing | 2026-05-20 |
| quick_task | 260517-0lh-sg-quick-md | missing | 2026-05-20 |
| quick_task | 260518-wvx-code-review-fixes | missing | 2026-05-20 |
| quick_task | 260518-x6n-state-transition-timing-fixes | missing | 2026-05-20 |
| verification | Phase 08 Task 2: 7-scenario manual regression | deferred | 2026-05-20 |

note: 260516/260517 items overlap with v1.0 deferred list above — re-deferred at v1.1 since SUMMARY.md was still missing at close. v1.2 milestone start may include a cleanup phase to retroactively write summaries for these quick-tasks (work itself is in commit history).

## Session Continuity

Last session: 2026-05-22T07:07:37.327Z
Stopped at: Phase 22 context gathered
Resume file: .planning/phases/22-skills/22-CONTEXT.md
