# Milestones: super-gsd

## v2.11 Add TDD workflow (sg-tdd) (Shipped: 2026-06-01)

**Phases completed:** 2 phases, 3 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v2.10 Plan-Phase Ambiguity Grilling (Shipped: 2026-05-31)

**Phases completed:** 1 phase (45), 1 plan
**Files:** 2 files changed, +67 / -1 lines (`skills/sg-plan/SKILL.md` +25, `.agents/skills/sg-plan/SKILL.md` +43)
**Timeline:** 2026-05-31 (single day)
**Commits:** 1eb8e2e (plan) → 3ed7221 (feat) → a39f18e (merge) → 207a569 (state)
**Known deferred items at close:** 20 stale/missing quick_tasks (see STATE.md Deferred Items)

### Delivered

`sg-plan`에 grill-me 원칙 기반 선행 모호함 해소 단계를 추가했다. gsd-discuss-phase subagent 호출 전, sg-plan 메인 컨텍스트에서 Claude가 한 번에 하나씩 질문해 계획 입력의 불확실성을 제거하고, 합의 결과를 discuss Agent 프롬프트에 locked context로 전달한다 (Non-invasive).

### Key Accomplishments

1. **Grill 선행 단계 (GRILL-01~06)** — 코드베이스 우선 탐색 → 코드에 없는 정보만 한-번-하나씩 질문, 질문마다 권장 답변 동반, 설계 트리 순차 해소
2. **사용자 확정 종료 게이트 (GRILL-05)** — Claude 단독 종료 금지, 합의 요약 + "이게 전부인가요?" 확인 후 사용자가 종료 결정
3. **플랫폼별 표면화 분기** — `.claude`는 AskUserQuestion(Step 1.5), `.agents`는 프로즈 번호 선택 폴백(Step 1.2)
4. **Non-invasive inline 주입** — grill 합의를 gsd-discuss-phase Agent 프롬프트에 "locked context — do NOT re-ask"로 전달, GSD 스킬 미수정
5. **Pairwise sync** — 두 sg-plan SKILL.md를 동일 커밋(3ed7221)에서 변경

### Archive

- `.planning/milestones/v2.10-ROADMAP.md`
- `.planning/milestones/v2.10-REQUIREMENTS.md`
- `.planning/milestones/v2.10-LESSONS.md`

---

## v2.8 Team Collaboration Support (Shipped: 2026-05-28)

**Phases completed:** 3 phases, 6 plans, 2 tasks

**Key accomplishments:**

- Task:

---

## v2.6 Codex/Gemini 설치 UX 개선 (Shipped: 2026-05-28)

**Phases completed:** 1 phases, 3 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.3 Multi-Platform Support (Shipped: 2026-05-28)

**Phases completed:** 1 phases, 3 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.4 Team Agent Parallel Execution (Shipped: 2026-05-28)

**Phases completed:** 1 phases, 3 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v2.7 Skills & Hooks Internationalization (Shipped: 2026-05-27)

**Phases completed:** 1 phases, 3 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v2.5 Superpowers-Native File Parsing

**Shipped:** 2026-05-26
**Phases:** 1 (Phase 32)
**Plans:** 2
**Commits:** 11 (5b7d8e7..dbbcef5)
**Files:** 16 changed, +285 / -101 lines
**Timeline:** 2026-05-25 → 2026-05-26 (1 day)

### Delivered

super-gsd skills의 bash 파이프라인(grep/sed/awk) 파일 파싱을 Superpowers 방식(Read 도구 + Claude 해석)으로 전환. `skills/sg-*/SKILL.md` 8개 + `.agents/skills/sg-*/SKILL.md` 4개에서 STATE.md/HANDOFF.md/ROADMAP.md 파싱 코드 제거. CLAUDE.md 컨벤션 업데이트. Phase 32 Conversation Analyzer 회고에서 3개 sg-rule 신규 생성 + sg-plan 디렉토리 버그 패치.

### Key Accomplishments

1. **12개 SKILL.md 파싱 전환** — `skills/sg-*/SKILL.md` 8개 + `.agents/skills/sg-*/SKILL.md` 4개에서 bash grep/sed/awk → Read 도구 + Claude 해석 방식으로 전환
2. **3개 sg-rule 신규 생성** — `warn-agents-read-comment-in-bash`, `warn-node-process-env-arguments`, `warn-read-inside-bash-fence` (Phase 32 retro 3개 High severity 기반)
3. **sg-plan discuss-phase 버그 패치** — 신규 phase 디렉토리 pre-create + CONTEXT.md 위치 자동 검증·이동 (retro Medium severity → 즉각 수정)
4. **CLAUDE.md `.agents/` 쌍 커버 규칙 추가** — `skills/` 패턴 변환 시 `.agents/` 변형 누락 방지
5. **Phase 32 코드 리뷰 → Critical 2건 + Important 3건 수정** — `-new-phase` 플레이스홀더 필터링, 정확한 파일 이동 로직
6. **sg-retro macOS 호환 주석 교체** — Phase lock 주석 → macOS 호환성 명시 주석으로 교체

### Archive

- `.planning/milestones/v2.5-ROADMAP.md`
- `.planning/milestones/v2.5-LESSONS.md`

---

*See [v2.5-ROADMAP.md](milestones/v2.5-ROADMAP.md) for full phase details.*

---

## v2.2 sg-next Auto-Advance

**Shipped:** 2026-05-24
**Phases:** 1 (Phase 26)
**Plans:** 1
**Commits:** 10 (a453dad..8dabfbf)
**Files:** 16 changed, +1,774 / -21 lines
**Timeline:** 2026-05-23 → 2026-05-24 (1 day)
**Known deferred items at close:** 13 quick-task 잔여물 (see STATE.md `## Deferred Items`)

### Delivered

sg-next 명령 하나로 HANDOFF.md + STATE.md를 읽어 현재 워크플로우 단계를 자동 감지하고, sg-status와 동일한 11개 분기 라우팅 테이블로 다음 sg-* 명령을 확인 없이 즉시 invoke한다. complete/init 모호 상태에서만 AskUserQuestion으로 선택지를 제시하며, invoke 전 HANDOFF.md 감사 로그를 기록한다.

### Key Accomplishments

1. **sg-next 스킬 신규 생성** — D-07 inline-replication 3개 블록(STATE.md 파싱, HANDOFF 파싱+enum, routing case) 포함, 188줄
2. **sg-next → sg-next 재진입 루프 방지** — whitelist에 `sg-next` 추가 + FROM 컬럼 transparent-pass로 자기참조 루프 차단
3. **conditional HANDOFF append** — complete/init 분기에서 취소 시 감사 로그 오염 방지
4. **sg-review 버그 수정 2건** — HANDOFF init 체크 2조건화, FROM_STAGE 동적 읽기 (코드 리뷰 → 즉각 수정 루프 입증)
5. **Phase 26 DSPM 회고** — 3개 Mistakes 식별, 2개 sg-rule 생성 (warn-handoff-single-condition, warn-sg-next-self-reference)

### Archive

- `.planning/milestones/v2.2-ROADMAP.md`
- `.planning/milestones/v2.2-REQUIREMENTS.md`
- `.planning/milestones/v2.2-LESSONS.md`

---

*See [v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md) for full phase details.*

---

## v1.1 Reliability

**Shipped:** 2026-05-20
**Phases:** 3 (06–08)
**Plans:** 4
**Commits:** 100 (since v1.0 tag)
**Files:** 105 changed, +7,724 / -202 lines
**Timeline:** 2026-05-16 → 2026-05-20 (5 days)
**Known deferred items at close:** 10 (9 quick-task summaries + Phase 08 Task 2 manual verify — see STATE.md `## Deferred Items` v1.1 block)

### Delivered

GSD → Superpowers → Hookify orchestration의 안정성·자기진단·세션 복원 강화. sg-health(자기진단), sg-status(정확도), sg-start(세션 복원) 세 축을 한 milestone에 묶어 사용자가 며칠 끊겼다 돌아와도 워크플로우가 자기 위치를 잃지 않도록 했다. 모든 phase는 `commands/sg-*.md` 단일 파일 수정 위주로 진행 (Phase 6 D-04 + Phase 7 D-08 lock — bash-only, no helper modules).

### Key Accomplishments

1. **sg-health 자기진단** — GSD/Superpowers/Hookify 설치 여부, hooks.json Stop/SubagentStop 등록, HANDOFF.md 5컬럼 스키마 무결성을 `[OK]`/`[WARN]`/`[FAIL]`로 한 번에 진단 (read-only)
2. **Storage vs Display enum 분리** — sg-status가 7-state storage routing과 4-state display를 분리해 review→sg-learn 분기를 정확히 표시
3. **STATE.md `Phase:` 라인 single source of truth** — `\S+` 토큰 단일 캡처 버그 폐기, BEGIN/END 주석 demarcate로 sg-start 인라인 복제 가능 (Phase 7 D-07 lock)
4. **sg-start 세션 복원** — STATE.md/HANDOFF.md 자동 감지 + Resume/Start new milestone/Cancel 3-옵션 분기, SESS-04 append-only HANDOFF 자연 충족
5. **7-state 워크플로우 라우팅** — sg-ship → next phase 또는 sg-complete, complete → sg-new 분기를 sg-status가 정확히 추천
6. **transcript_matcher 신호 정확도** — IMPLEMENTATION_SIGNALS 좁힘, HOOKIFY_SIGNALS의 `'hookify'` 제거로 false positive 차단

### Archive

- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-phases/` (06-sg-health, 07-status-accuracy, 08-session-restore)

---

*See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) for full phase details.*

---

## v1.0 MVP

**Shipped:** 2026-05-16  
**Phases:** 5 (01–05)  
**Plans:** 11  
**Commits:** 91  
**Files:** 74 files changed, +10,102 lines  
**Timeline:** 2026-05-15 → 2026-05-16 (2 days)  
**Known deferred items at close:** 5 (see STATE.md Deferred Items)

### Delivered

GSD → Superpowers → Hookify 3단계 AI 개발 워크플로우를 자동으로 연결하는 Claude Code 플러그인 v1.0. 9개 sg- 명령, Stop/SubagentStop 훅, lessons 자동 저장·재표시 루프를 포함한 MVP.

### Key Accomplishments

1. **Plugin scaffold** — `plugin.json` + `marketplace.json` + `LICENSE` 포함 설치 가능한 Claude Code 플러그인 구조 완성
2. **Manual handoff** — `sg-execute` 명령으로 GSD plan-phase → Superpowers 인계, `HANDOFF.md` append-only 5컬럼 스키마
3. **Full sg- command set** — 9개 명령(sg-start, sg-explore, sg-plan, sg-execute, sg-status, sg-review, sg-learn, sg-ship, sg-lessons) + README + docs/COMMANDS.md
4. **Auto-advance hooks** — Stop/SubagentStop 훅으로 gsd-plan-complete / superpowers-review-complete 신호 감지 → systemMessage 안내
5. **Lessons feedback loop** — Hookify 완료 시 `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 자동 저장, sg-plan Step 0에서 자동 재표시

### Archive

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`

---

*See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full phase details.*
