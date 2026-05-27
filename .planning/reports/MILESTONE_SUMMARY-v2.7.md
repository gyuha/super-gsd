# Milestone v2.7 — Project Summary (super-gsd)

**Generated:** 2026-05-28
**Purpose:** 팀 온보딩 및 프로젝트 리뷰
**Status:** ✅ Shipped — git tag `v2.7` (2026-05-28)

> 아카이브: `.planning/milestones/v2.7-{ROADMAP,REQUIREMENTS,LESSONS}.md`

---

## 1. Project Overview

**super-gsd**는 GSD → Superpowers → sg-retro 3단계 AI 개발 워크플로우를 자동으로 연결하는 Claude Code 플러그인이다. GSD가 전략·계획, Superpowers가 구현·검증, 내장 `sg-retro` Skill이 회고·학습을 맡고, 각 단계 종료 시 다음 단계로 컨텍스트와 함께 인계된다.

**v2.7 (Skills & Hooks Internationalization)** 은 국제화 milestone이다. 목표는 **영문 소스 + 응답 시 사용자 언어 자동 감지**:

- `skills/`, `.agents/skills/`, `hooks/` 내 한글 콘텐츠를 영문으로 전환
- 모든 SKILL.md에 사용자 입력 언어 자동 감지 `<language>` 지침 추가 (한국어 입력 → 한국어, 영어 입력 → 영어)

소규모 milestone(3 phases)이며, 기능 변경 없이 순수 언어·지침 교체만 수행했다.

## 2. Architecture & Technical Decisions

- **text-only translation** — bash 코드 블록 내 명령어/flag/변수명은 변경하지 않고 산문만 영문화한다.
  - **Why:** 기능 회귀 방지 (i18n은 의미 보존이 핵심).
  - **Phase:** 36 (36-01, 36-02)
- **language-directive-block** — SKILL.md frontmatter 직후에 `<language>` 블록을 삽입해 응답 언어를 입력 언어에 맞춘다.
  - **Why:** 소스가 영문이어도 사용자에겐 그의 언어로 응답해야 한다.
  - **Phase:** 36 (36-03)
- **머신 토큰 보존** — 명령명(`/super-gsd:sg-*`), enum, phase 슬러그, 경로, 버전 ID는 번역하지 않는다 (정규식 패턴 토큰 `화면`처럼 의도적으로 남는 한글 포함).
  - **Why:** 토큰을 번역하면 라우팅/감지가 깨진다.
  - **Phase:** 36~38
- **pairwise convention** — `skills/` 변경과 동등한 `.agents/skills/` 변경을 동일 milestone 인접 phase로 완료한다.
  - **Phase:** 36(skills/) ↔ 37(.agents/skills/)

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 36 | skills/ 영문화 + 언어 자동 감지 | ✅ Complete (3/3 plans) | `skills/sg-*/SKILL.md` 19개 한글→영문 + 전체 `<language>` 지침 삽입 (I18N-01, I18N-04) |
| 37 | .agents/skills/ 영문화 + 언어 자동 감지 | ✅ Complete *(ad-hoc)* | `.agents/skills/` 10개 영문화 + `<language>` 지침 — Phase 36의 `36-fix` 커밋에 흡수, 별도 plan/SUMMARY 없음 (I18N-02, I18N-04) |
| 38 | hooks/ 영문화 | ✅ Complete *(ad-hoc)* | `hooks/{stop_hook,rule_runner}.cjs` 한글 주석 4줄 영문화 — 커밋 `391326c`로 직접 수행, 별도 plan/SUMMARY 없음 (I18N-03) |

**Phase 36 plan 분할:**
- 36-01: 한글 비중 상위 5개(sg-retro, sg-next, sg-parallel-execute, sg-start, sg-health) 영문화
- 36-02: 나머지 9개(sg-setup, sg-execute, sg-ui-plan, sg-plan, sg-lessons, sg-new, sg-complete, sg-status, sg-review) 영문화
- 36-03: 19개 전체에 `<language>` 자동 감지 지침 삽입

## 4. Requirements Coverage

| REQ-ID | 설명 | 상태 |
|--------|------|------|
| I18N-01 | `skills/sg-*/SKILL.md` 14개 한글→영문 | ✅ Phase 36 |
| I18N-02 | `.agents/skills/sg-*/SKILL.md` 8개 한글→영문 | ✅ Phase 37 (ad-hoc) |
| I18N-03 | `hooks/{stop_hook,rule_runner}.cjs` 한글 주석 영문화 | ✅ Phase 38 (ad-hoc, commit 391326c) |
| I18N-04 | 27개 SKILL.md 전체에 언어 자동 감지 `<language>` 지침 | ✅ Phase 36 + 37 |

모든 v1 요건 충족. milestone audit(`/gsd-audit-milestone`)은 실행하지 않음 — 텍스트 번역 milestone 특성상 cross-phase E2E 감사가 불필요하다고 판단, 대신 요건별 코드 상태를 grep으로 직접 검증.

## 5. Key Decisions Log

| 결정 | 내용 |
|------|------|
| phase shape | v2.7 = 3 phases(coarse): 36(skills/), 37(.agents/), 38(hooks/) |
| Phase 36+37 분리 | pairwise convention — skills/ ↔ .agents/ 변경을 동일 milestone 인접 phase로 |
| I18N-04 분할 | skills/ 19개(36) + .agents/ 8개(37) = 27개 전체 커버 |
| text-only rule | bash 코드/flag/변수명 불변 |

## 6. Tech Debt & Deferred Items

이번 milestone에서 드러난 부채와 패턴 (상세는 `RETROSPECTIVE.md` v2.7 섹션):

- **메타데이터 드리프트 (반복 패턴)** — Phase 36은 실행·배포까지 끝났으나 ROADMAP/STATE는 `2/3 In Progress`로 정체했고, close 시 수동 정합화가 필요했다. 작업→main 커밋→CHANGELOG는 하지만 GSD close 의식을 건너뛰는 패턴.
- **ad-hoc phase의 percent 왜곡** — Phase 37/38이 정식 plan/SUMMARY 없이 완료되어, `milestone.complete` CLI가 SUMMARY 있는 Phase 36만 카운트 → STATE에 `completed_phases: 1`, `percent: 9`로 기록됨(코드상 실제는 100%).
- **v2.6 미종료** — `milestones/`에 v2.6 아카이브 없고 ROADMAP에서 34/35가 `Not started`. 별도 `gsd-complete-milestone v2.6` 필요.
- **워킹 트리 누적 삭제** — 옛 milestone phase 파일 120개가 미커밋 삭제 상태였음 (이번에 `8383461`로 정리).
- **deferred quick tasks 13개** — v2.2 close 때 deferred 처리된 항목들이 여전히 STATE.md `Deferred Items`에 잔존.
- **로컬 미push** — v2.7 종료 커밋 5개 + 태그 `v2.7`이 origin에 아직 안 올라감.

## 7. Getting Started

신규 기여자 진입점:

- **플러그인 구조:** `.claude-plugin/plugin.json` (skills 디렉토리·marketplace 메타)
- **Skills:** `skills/sg-*/SKILL.md` — 각 파일이 하나의 `/super-gsd:sg-*` 명령. YAML frontmatter + `<objective>`/`<process>`/`<success_criteria>` 블록.
- **Hooks:** `hooks/*.cjs` (Node.js 18+, 외부 의존성 0) — `stop_hook`, `transcript_matcher`, `rule_runner`, `lessons_ranker`
- **hooks 직접 테스트:**
  - `echo '{"tool_name":"Bash","tool_input":{"command":"..."}}' | node hooks/rule_runner.cjs`
  - `node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md`
- **먼저 볼 곳:** `CLAUDE.md`(컨벤션·아키텍처), `skills/sg-next`(워크플로우 자동 진행), `hooks/stop_hook.cjs`(단계 전환 안내)
- **버전 관리:** `plugin.json` + `package.json` + `CHANGELOG.md` 3파일 동기화 (현재 0.0.42)

---

## Stats

- **Timeline:** 2026-05-27 → 2026-05-28 (≈2일)
- **Phases:** 3 / 3 complete (Phase 36 정식 3 plans; 37·38 ad-hoc)
- **Commits:** v2.7 작업 윈도(2026-05-27~)에서 약 31개 — i18n 번역 + ad-hoc 완료 + milestone close 정리 포함
- **Contributors:** gyuha
- **Tag:** `v2.7` (local; origin 미push)

*주: ad-hoc phase와 누적 드리프트 때문에 정확한 milestone-범위 커밋 통계는 산정이 어렵다 — 위 수치는 날짜 윈도 기준 근사치다.*
