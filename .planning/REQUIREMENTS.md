# Requirements: super-gsd v1.2 Self-Contained Retrospection

**Milestone:** v1.2 Self-Contained Retrospection
**Goal:** super-gsd가 hookify 플러그인 없이 단독으로 회고·패턴 추출·실수 재발 방지 가드를 수행. 다관점 분석으로 같은 실수를 반복하지 않도록 한다.

---

## v1.2 Requirements

### RETRO — 내장 회고 Skill

- [ ] **RETRO-01**: `skills/sg-retro/` 디렉터리에 자체 Skill 정의(`SKILL.md`)가 존재하고 Claude Code Skill 시스템에 등록된다
- [ ] **RETRO-02**: `sg-retro` Skill은 phase argument를 받아 해당 phase의 CONTEXT/PLAN/SUMMARY와 git diff·log를 자동으로 컨텍스트로 수집한다
- [ ] **RETRO-03**: `sg-retro`는 최소 다섯 가지 lens를 제공한다: Start/Stop/Continue, 4Ls, Sailboat, Five Whys, Decisions/Surprises/Patterns/Mistakes — 사용자가 명령 인자 또는 AskUserQuestion으로 lens를 선택한다
- [ ] **RETRO-04**: 각 lens는 일관된 출력 구조(헤더 + 항목 리스트 + 우선순위 액션 아이템)를 가지며, lens 결과가 동일 시점에 `.planning/lessons/{NN}-{YYYY-MM-DD}.md`에 저장된다
- [ ] **RETRO-05**: 한 번의 `sg-retro` 호출에서 여러 lens를 다중 선택할 수 있으며, 결과는 단일 lessons 파일에 lens별 섹션으로 묶인다

### ANALYZER — 내장 conversation analyzer

- [ ] **ANALYZER-01**: `sg-retro`는 hookify 의존 없이 session transcript에서 frustration signals(예: "왜 그렇게 했어", "안 돼", "다시"), correction patterns(user fixing assistant's actions), repeated issues, validated successes(non-obvious assistant choices that the user accepted) 네 카테고리를 자체 추출한다
- [ ] **ANALYZER-02**: analyzer는 각 발견에 대해 tool/event, regex pattern, context, severity(high/medium/low)를 구조화 출력한다 (현 hookify analyzer 출력 스키마와 호환)
- [ ] **ANALYZER-03**: analyzer는 최근 20-30 메시지를 기본 범위로 하되 사용자가 명시 시 더 깊이 스캔할 수 있다

### RULES — 자체 rule runner

- [ ] **RULES-01**: super-gsd가 자체 PreToolUse hook을 등록해 `.claude/sg-rule.*.local.md` 파일(또는 기존 `.claude/hookify.*.local.md` 호환 위치)을 직접 실행한다 — hookify 플러그인 미설치 환경에서도 가드가 동작한다
- [ ] **RULES-02**: rule format(frontmatter + 본문)은 기존 hookify rule과 호환되어 .claude/ 디렉토리의 기존 15개 rule 파일이 마이그레이션 없이 동작한다
- [ ] **RULES-03**: rule action(`warn` / `block`)이 PreToolUse hook 응답으로 매핑돼 차단/경고가 실제로 발생한다 (단순 메시지 출력이 아닌 도구 실행 자체에 영향)
- [ ] **RULES-04**: rule runner의 사용자 가시 동작이 hookify와 동등하다 — 새 rule 파일 생성 시 즉시 적용, restart 불필요

### LESSONS — lessons 영속화 확장

- [ ] **LESSONS-01**: `sg-retro` 종료 시 결과를 `.planning/lessons/{phase}-{YYYY-MM-DD}.md`로 저장한다. 같은 phase에 두 번 retro 시 lesson 파일이 append되거나 새 lens 섹션이 추가된다 (덮어쓰기 금지)
- [ ] **LESSONS-02**: `sg-plan` Step 0의 lessons 자동 주입 흐름이 v1.0 동작을 그대로 유지하면서 v1.2의 다관점 lens 구조를 인식해 lens별 섹션을 정렬 표시한다
- [ ] **LESSONS-03**: lessons는 milestone별로 그룹화 조회 가능 (`/super-gsd:sg-lessons milestone=v1.2`)하며 milestone close 시 자동으로 `.planning/milestones/v{X}-LESSONS.md`로 묶여 archive된다

### RECURRENCE — 재발 방지 가드

- [ ] **RECURRENCE-01**: 과거 lessons + 활성 rule files에서 top-N(default N=5) 패턴을 weighted ranking(빈도 + 최근성 + severity)으로 산출하는 함수가 존재한다
- [ ] **RECURRENCE-02**: `sg-plan` Step 0에서 lessons 단순 dump 대신 RECURRENCE-01의 weighted top-N을 우선 표시한다 (기존 lessons 전체 dump는 fold/expand로 보존)
- [ ] **RECURRENCE-03**: `sg-execute` 진입 시점에서도 동일 weighted top-N을 한 줄 요약으로 노출 (사용자가 plan을 받았으나 실행 직전에 한 번 더 reminder)

### MIGRATION — sg-learn 라우팅 전환 + hookify 의존성 제거

- [ ] **MIGRATION-01**: `commands/sg-learn.md`가 `Skill(skill="hookify:hookify", ...)` 호출을 `Skill(skill="sg-retro", ...)` 호출로 교체한다
- [ ] **MIGRATION-02**: hookify 플러그인이 설치되지 않은 환경에서 `sg-learn`이 정상 동작하는 e2e 시나리오가 manual checklist로 존재하고 검증된다
- [ ] **MIGRATION-03**: README.md / README.ko.md / `.claude-plugin/plugin.json` / docs/COMMANDS.md에서 hookify 의존성·언급을 제거하거나 "optional historical reference"로 demote한다
- [ ] **MIGRATION-04**: `sg-update`가 더 이상 hookify를 install/update 대상으로 처리하지 않는다 (또는 optional 모드로 분리)

---

## Future Requirements (deferred to v1.3+)

- 한 retro에서 다중 lens 자동 멀티 실행 (현재는 사용자 선택 1개 또는 다중 선택)
- 외부 PR/리뷰 도구 연동 (GitHub PR comments, Slack notifications)
- LLM 기반 lens 자동 추천 (phase 성격을 보고 적합 lens 제안)
- sg-learn hookify HANDOFF 자동 행 추가 (v1.1 deferred — v1.2 MIGRATION-01로 흡수)
- sg-status 7일 초과 stale 세션 경고 — v1.2 RECURRENCE 가드 일부로 흡수 검토, 미흡수 시 v1.3
- sg-health `--json` 플래그 (v1.1 deferred 유지)
- 서브디렉토리 cwd walk-up `.planning/` 탐색 (v1.1 deferred 유지)
- sg-start argument 기반 비대화형 모드 (v1.1 deferred 유지)

---

## Out of Scope

- hookify 플러그인 자체 수정 — 비침투적 orchestrator 원칙 유지 (의존성만 제거)
- 멀티 프로젝트 동시 오케스트레이션 — v1.0 이래 일관 정책
- 비-Claude 런타임(Codex, Gemini CLI) 지원 — Claude Code 전용
- 자동 retro 트리거 (예: 매 commit마다) — 사용자가 명시적으로 `sg-learn` 호출하는 모델 유지

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| RETRO-01 | Phase 9 | Pending |
| RETRO-02 | Phase 9 | Pending |
| RETRO-03 | Phase 9, 10 | Pending |
| RETRO-04 | Phase 9, 10 | Pending |
| RETRO-05 | Phase 10 | Pending |
| ANALYZER-01 | Phase 10 | Pending |
| ANALYZER-02 | Phase 10 | Pending |
| ANALYZER-03 | Phase 10 | Pending |
| RULES-01 | Phase 11 | Pending |
| RULES-02 | Phase 11 | Pending |
| RULES-03 | Phase 11 | Pending |
| RULES-04 | Phase 11 | Pending |
| LESSONS-01 | Phase 12 | Pending |
| LESSONS-02 | Phase 12 | Pending |
| LESSONS-03 | Phase 12 | Pending |
| RECURRENCE-01 | Phase 12 | Pending |
| RECURRENCE-02 | Phase 12 | Pending |
| RECURRENCE-03 | Phase 12 | Pending |
| MIGRATION-01 | Phase 13 | Pending |
| MIGRATION-02 | Phase 13 | Pending |
| MIGRATION-03 | Phase 13 | Pending |
| MIGRATION-04 | Phase 13 | Pending |
