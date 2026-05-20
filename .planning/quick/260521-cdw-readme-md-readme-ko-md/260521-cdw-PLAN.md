---
quick_id: 260521-cdw
task: README.md와 README.ko.md 의 마일스톤을 업데이트 해 줘
created: 2026-05-21
---

# Quick Task Plan

## Objective

README.md(영문)와 README.ko.md(한국어) 양쪽의 `## Roadmap` / `## 로드맵` 섹션이 Phase 5까지만 반영된 채 멈춰 있다. ROADMAP.md 기준으로 v1.0~v1.2에서 완료된 Phase 1-13 전부를 "shipped" 상태로 표기하고, 현재 진행 중인 v1.3(Phase 14-16)의 실제 설명을 추가하여 로드맵을 최신 상태로 맞춘다.

**현재 상태 (README.md Roadmap):**

- Phase 1-5만 shipped로 표기되어 있음
- v1.1(Phase 6-8), v1.2(Phase 9-13) 전혀 언급 없음
- v1.3(Phase 14-16) 없음

**목표 상태:**

- Phase 1-5: 기존 설명 유지 (shipped)
- Phase 6-8: v1.1 Reliability 완료 phase 추가 (shipped)
- Phase 9-13: v1.2 Self-Contained Retrospection 완료 phase 추가 (shipped)
- Phase 14-16: v1.3 Multi-Platform Support 진행 중 phase 추가 (planned)

## Tasks

### Task 1: README.md Roadmap 섹션 업데이트

**Action:**

`README.md`의 `## Roadmap` 섹션 전체를 다음 내용으로 교체한다. 섹션 제목과 첫 문장("super-gsd ships in MVP vertical slices...")은 유지하고, phase 목록만 아래와 같이 교체한다.

교체할 phase 목록:

```
- **Phase 1 — Plugin Scaffold (shipped):** installable plugin shell with manifest, marketplace metadata, README, and verify checklist. No commands or hooks yet.
- **Phase 2 — Manual Handoff & Status (shipped):** introduces `/super-gsd:sg-execute` (package a finished GSD phase as a Superpowers-ready prompt) and `/super-gsd:sg-status` (inspect current stage, last handoff, next recommended command).
- **Phase 3 — sg- Command Set & README (shipped):** delivers the full 9-command `sg-` interface and updated documentation so the entire GSD → Superpowers → Hookify cycle has discoverable slash commands.
- **Phase 4 — Auto-Advance Hooks (shipped):** registers `Stop` hooks so stage transitions are auto-detected — completed `plan-phase` surfaces a handoff prompt, completed `code-reviewer` suggests Hookify via `systemMessage`.
- **Phase 5 — Lessons Feedback Loop (shipped):** persists Hookify findings into `.planning/lessons/` and surfaces them automatically when the next GSD phase begins, closing the learning loop.
- **Phase 6 — sg-health (shipped):** introduces `sg-health` self-diagnosis command — checks GSD/Superpowers installation, hook registration, and HANDOFF.md schema integrity with `[OK]`/`[WARN]`/`[FAIL]` output.
- **Phase 7 — Status Accuracy (shipped):** fixes `sg-status` STATE.md Phase line parsing and storage/display enum separation so the current workflow stage is always correctly shown.
- **Phase 8 — Session Restore (shipped):** `sg-start` detects an existing session and presents Resume / Start new milestone / Cancel so users can safely return after a break.
- **Phase 9 — sg-retro Skill Scaffold (shipped):** introduces the built-in `sg-retro` skill with 3 retrospection lenses; results are saved to `.planning/lessons/` without requiring Hookify.
- **Phase 10 — Conversation Analyzer + Lens Expansion (shipped):** adds a self-contained transcript analyzer that extracts frustration/correction/repeated/validated-success patterns, and expands to 6 total lenses (Sailboat, Five Whys, and more).
- **Phase 11 — Self-Contained Rule Runner (shipped):** registers a `PreToolUse` hook that runs `.claude/sg-rule.*.local.md` rules directly — Hookify is no longer required for guard execution.
- **Phase 12 — Lessons Aggregation & Recurrence Guard (shipped):** groups lessons by phase and milestone, surfaces weighted top-N patterns in `sg-plan`/`sg-execute` to prevent repeated mistakes.
- **Phase 13 — sg-learn Routing Switch + Hookify Removal (shipped):** reroutes `sg-learn` to the built-in `sg-retro` skill and removes all Hookify dependencies from commands and documentation.
- **Phase 14 — Codex Entry Point + .agents/skills/ (v1.3 — in progress):** rewrites `AGENTS.md` with Codex vocabulary and creates 6 `.agents/skills/` skill files so Codex, Gemini CLI, and Antigravity CLI users can follow the workflow without Claude Code slash commands.
- **Phase 15 — Platform Hooks + Python Fix (v1.3 — planned):** creates `.codex/hooks.json` and `.gemini/settings.json` hook configs, and fixes `hooks/*.py` path fallback so hooks run without `CLAUDE_PLUGIN_ROOT` in Codex/Gemini environments.
- **Phase 16 — README Multi-Platform Section (v1.3 — planned):** adds per-platform install guides and a feature delta table (works / limited / not available) to the README.
```

**Verify:** `grep -c "shipped" README.md` が 13 以上を返す。かつ `grep "Phase 14" README.md` がヒットする。

(코드 블록 없이 grep으로 확인):
- `grep -c "shipped" README.md` → 13 이상
- `grep "Phase 14" README.md` → 출력 있음
- `grep "Phase 16" README.md` → 출력 있음

**Done when:** README.md Roadmap 섹션에 Phase 1-16이 모두 나열되고, Phase 1-13은 "(shipped)", Phase 14는 "(v1.3 — in progress)", Phase 15-16은 "(v1.3 — planned)"로 표기된다.

---

### Task 2: README.ko.md 로드맵 섹션 업데이트

**Action:**

`README.ko.md`의 `## 로드맵` 섹션 전체를 Task 1과 동일한 phase 구조로, 한국어로 교체한다. 섹션 제목과 첫 문장("`super-gsd`는 MVP 수직 슬라이스 방식으로...")은 유지하고, phase 목록만 아래 내용으로 교체한다.

교체할 phase 목록 (한국어):

```
- **Phase 1 — 플러그인 스캐폴드 (완료):** 설치 가능한 플러그인 셸(매니페스트, 마켓플레이스 메타데이터, README, 검증 체크리스트). 아직 명령이나 훅 없음.
- **Phase 2 — 수동 인계 및 상태 (완료):** `/super-gsd:sg-execute`(완성된 GSD 단계를 Superpowers 준비 프롬프트로 패키징)와 `/super-gsd:sg-status`(현재 단계, 마지막 인계, 다음 권장 명령 확인) 도입.
- **Phase 3 — sg- 명령 세트 및 README (완료):** 전체 GSD → Superpowers → Hookify 사이클을 커버하는 9개 명령 인터페이스와 업데이트된 문서 제공.
- **Phase 4 — 자동 진행 훅 (완료):** `Stop` 훅을 등록하여 단계 전환을 자동 감지 — `plan-phase` 완료 시 인계 프롬프트 표시, 코드 리뷰어 완료 시 Hookify 제안.
- **Phase 5 — 학습 루프 (완료):** Hookify 교훈을 `.planning/lessons/`에 저장하고 다음 GSD 단계 시작 시 자동 표시하여 학습 루프 완성.
- **Phase 6 — sg-health (완료):** `sg-health` 자기진단 명령 도입 — GSD/Superpowers 설치 여부, 훅 등록, HANDOFF.md 스키마 무결성을 `[OK]`/`[WARN]`/`[FAIL]`로 출력.
- **Phase 7 — 상태 정확도 (완료):** `sg-status`의 STATE.md Phase 라인 파싱 및 저장/표시 enum 분리 수정으로 현재 워크플로우 단계를 항상 정확하게 표시.
- **Phase 8 — 세션 복원 (완료):** `sg-start`가 기존 세션을 감지하여 재개 / 새 마일스톤 시작 / 취소 3가지 옵션을 제시해 중단 후 안전하게 복귀 가능.
- **Phase 9 — sg-retro Skill 스캐폴드 (완료):** 3가지 회고 렌즈를 지원하는 내장 `sg-retro` 스킬 도입. Hookify 없이 `.planning/lessons/`에 결과 저장.
- **Phase 10 — 대화 분석기 + 렌즈 확장 (완료):** frustration/correction/repeated/validated-success 4가지 패턴을 추출하는 자체 transcript 분석기 추가, Sailboat·Five Whys 포함 총 6개 렌즈로 확장.
- **Phase 11 — 자체 rule runner (완료):** `PreToolUse` 훅을 직접 등록해 `.claude/sg-rule.*.local.md` 규칙을 실행 — Hookify 없이도 가드 동작.
- **Phase 12 — lessons 집계 + 재발 방지 가드 (완료):** lessons를 phase·milestone별로 묶고, `sg-plan`/`sg-execute`에서 weighted top-N 패턴을 우선 노출하여 같은 실수 반복 방지.
- **Phase 13 — sg-learn 라우팅 전환 + Hookify 제거 (완료):** `sg-learn`을 내장 `sg-retro` 스킬로 재라우팅하고 명령·문서에서 Hookify 의존성 전부 제거.
- **Phase 14 — Codex 진입점 + .agents/skills/ (v1.3 — 진행 중):** `AGENTS.md`를 Codex 어휘로 재작성하고 `.agents/skills/` 스킬 6개를 신규 생성하여 Codex, Gemini CLI, Antigravity CLI 사용자가 Claude Code 슬래시 명령 없이 워크플로우를 진행 가능.
- **Phase 15 — 플랫폼별 훅 설정 + Python 픽스 (v1.3 — 계획):** `.codex/hooks.json`과 `.gemini/settings.json` 훅 설정 파일 신규 생성, `CLAUDE_PLUGIN_ROOT` 없이도 `hooks/*.py`가 실행되도록 경로 폴백 수정.
- **Phase 16 — README Multi-Platform 섹션 (v1.3 — 계획):** 플랫폼별 설치 가이드와 기능 델타 테이블(동작 가능 / 제한 있음 / 불가)을 README에 추가.
```

**Verify:**
- `grep -c "완료" README.ko.md` → 13 이상
- `grep "Phase 14" README.ko.md` → 출력 있음
- `grep "Phase 16" README.ko.md` → 출력 있음

**Done when:** README.ko.md 로드맵 섹션에 Phase 1-16이 모두 한국어로 나열되고, Phase 1-13은 "(완료)", Phase 14는 "(v1.3 — 진행 중)", Phase 15-16은 "(v1.3 — 계획)"으로 표기된다.

## Success Criteria

- [ ] README.md Roadmap 섹션에 Phase 1-16이 나열되어 있다
- [ ] README.md에서 Phase 1-13은 모두 "(shipped)"로 표기된다
- [ ] README.md에서 Phase 14는 "(v1.3 — in progress)", Phase 15-16은 "(v1.3 — planned)"로 표기된다
- [ ] README.ko.md 로드맵 섹션에 Phase 1-16이 한국어로 나열되어 있다
- [ ] README.ko.md에서 Phase 1-13은 모두 "(완료)"로 표기된다
- [ ] README.ko.md에서 Phase 14는 "(v1.3 — 진행 중)", Phase 15-16은 "(v1.3 — 계획)"으로 표기된다
- [ ] 두 파일 모두 Roadmap 섹션 외의 내용은 변경되지 않는다
