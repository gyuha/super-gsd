# Phase 14: Codex 진입점 + .agents/skills/ - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Codex, Gemini CLI, Antigravity CLI 사용자가 super-gsd 워크플로우를 이해하고 핵심 스킬을 실행할 수 있도록 두 가지 산출물을 생성한다:

1. **AGENTS.md 완전 재작성** — GSD 자동생성 마커 섹션 제거, Codex 어휘(`$sg-*` 문법) 기준으로 재작성. SubagentStop 미지원 및 Superpowers 연동 불가 명시. 8 KiB 이하 유지.

2. **`.agents/skills/` 6개 SKILL.md 신규 생성** — sg-retro(AskUserQuestion 제거), sg-start, sg-plan, sg-execute, sg-review, sg-status. 각 스킬은 platform-agnostic prose 지침 제공.

이 phase의 책임:
- `AGENTS.md` — Codex 어휘로 완전 재작성
- `.agents/skills/sg-retro/SKILL.md` — AskUserQuestion 제거 버전
- `.agents/skills/sg-{start,plan,execute,review,status}/SKILL.md` — 5개 래퍼 스킬
- 위 파일들 외의 코드 변경 없음 (비침투적 원칙 유지)

Phase 15 범위: `.codex/hooks.json`, `.gemini/settings.json`, Python 훅 경로 폴백 수정.

</domain>

<decisions>
## Implementation Decisions

### A. AGENTS.md 콘텐츠 구조

- **D-A1:** `AGENTS.md`를 GSD 마커(`<!-- GSD:*-start/end -->`) 없이 완전 재작성한다. Codex 어휘 기준(`$sg-*` 달러 문법)으로 작성하며 8 KiB 이하를 유지한다.
  이유: 하이브리드 방식은 Codex 사용자에게 Claude Code 전용 내용을 노출해 혼란 초래. GSD 마커는 사용자가 명시 실행해야 재생성되므로 덮어쓰기 위험 낮음.

- **D-A2:** AGENTS.md 섹션 구조:
  1. Project 설명 (Codex 어휘)
  2. Quick Start (설치 → `$sg-start` → `$sg-plan` 3단계)
  3. 플랫폼 제약 명시 블록 (SubagentStop 미지원, Superpowers 연동 불가, AskUserQuestion 미지원)
  4. 스킬 목록 (`.agents/skills/` 위치 안내)
  5. 워크플로우 단계 개요 (sg-start → sg-plan → sg-execute → sg-review → sg-retro → sg-ship)

- **D-A3:** 각 스킬 설명은 이름 + 한 줄 설명만 포함한다. 상세 옵션/argument는 각 SKILL.md에서 self-documenting. AGENTS.md는 진입점 안내 역할에 집중한다.

### B. sg-retro 폴백 전략

- **D-B1:** `.agents/skills/sg-retro/SKILL.md`는 `skills/sg-retro/SKILL.md`를 기반으로 하되, 모든 `AskUserQuestion` 호출을 plain-text numbered list + 자유 입력 대기 패턴으로 교체한다.
  변경 대상: Step 2 AskUserQuestion fallback 경로만. 파싱 로직(case 문)과 multi-lens loop는 그대로 유지.

- **D-B2:** 렌즈 미지정 시 동작:
  ```
  렌즈를 선택하세요:
  1) ssc  — Start/Stop/Continue
  2) 4ls  — 4Ls (Like/Learned/Lacked/Longed for)
  3) dspm — Decisions/Surprises/Patterns/Mistakes
  4) sail — Sailboat
  5) 5why — Five Whys
  6) analyze — Conversation Analyzer

  번호 또는 코드로 입력하세요. 복수 선택: "1 3" 또는 "ssc dspm"
  ```
  응답을 파싱해 기존 LENS_CODE 로직으로 진행.

- **D-B3:** multiSelect 지원 — 스페이스 구분 입력("1 3", "ssc dspm")을 파싱해 복수 렌즈 순차 실행. Claude Code sg-retro와 동일한 multi-lens loop 동작.

- **D-B4:** `skills/sg-retro/SKILL.md`(기존 Claude Code 버전)는 수정하지 않는다. `.agents/skills/sg-retro/SKILL.md`는 별도 파일로 신규 생성한다.

### C. 5개 래퍼 스킬 구현 깊이

- **D-C1:** 5개 스킬(sg-start, sg-plan, sg-execute, sg-review, sg-status) 모두 `<constraints>` 블록에 다음을 명시한다:
  - Superpowers 연동 불가 (Claude Code 전용)
  - SubagentStop 미지원
  - AskUserQuestion 미지원

- **D-C2:** GSD 위임 우선(주 경로) + prose 폴백(부 경로) 구조:
  1. GSD 설치 여부 확인
  2. GSD 있으면: `$gsd-[command]` 위임
  3. GSD 없으면: 동등한 prose 지침 직접 실행
  이유: REQUIREMENTS.md에서 GSD는 필수 의존성으로 분류됨.

- **D-C3:** `sg-execute` — Superpowers 위임 불가이므로 "직접 구현 모드"만 제공. PLAN.md를 읽고 task를 순차 실행하는 prose 지침. `superpowers:feature-dev` 등은 미지원 명시.

- **D-C4:** `sg-review` — Superpowers `code-review:code-review` 불가 → 동등한 코드 리뷰 prose 직접 수행 (변경 파일 목록 → 각 파일 리뷰 → SUMMARY.md 작성).

- **D-C5:** `sg-status` — HANDOFF.md + STATE.md 직접 파싱으로 GSD 위임 없이 독립 실행 가능하도록 작성. sg-execute/sg-review와 달리 완전 독립 구현.

### D. 디렉토리 Layout

- **D-D1:** Phase 14에서 생성할 디렉토리:
  ```
  .agents/skills/
    sg-retro/SKILL.md
    sg-start/SKILL.md
    sg-plan/SKILL.md
    sg-execute/SKILL.md
    sg-review/SKILL.md
    sg-status/SKILL.md
  ```

- **D-D2:** 각 디렉토리에는 `SKILL.md` 파일 하나만 생성한다. helper scripts 등 추가 파일은 Phase 14 스코프 밖.

- **D-D3:** `.codex/skills/` 경로 필요성은 Phase 15 리서치 시 확인한다. 필요하다면 Phase 15에서 `.agents/skills/`의 내용을 복사 또는 참조하도록 처리. Phase 14에서는 생성하지 않는다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항 정의
- `.planning/REQUIREMENTS.md` — CODEX-01, CODEX-02, CODEX-03 요건 전체 (MUST read)
- `.planning/ROADMAP.md` — Phase 14 Goal, Success Criteria, Plans 항목

### 기존 구현 파일 (참조 기반)
- `skills/sg-retro/SKILL.md` — `.agents/skills/sg-retro/SKILL.md`의 원본. Step 1~N 구조와 파싱 로직 복제 시 이 파일을 기준으로 한다.
- `commands/sg-start.md` — `.agents/skills/sg-start/SKILL.md` 작성 시 참조할 원본 동작 정의
- `commands/sg-plan.md` — `.agents/skills/sg-plan/SKILL.md` 참조 원본
- `commands/sg-execute.md` — `.agents/skills/sg-execute/SKILL.md` 참조 원본
- `commands/sg-review.md` — `.agents/skills/sg-review/SKILL.md` 참조 원본
- `commands/sg-status.md` — `.agents/skills/sg-status/SKILL.md` 참조 원본 (HANDOFF.md 파싱 블록 포함)

### 현재 AGENTS.md (교체 대상)
- `AGENTS.md` — 현재 GSD 마커 기반 버전. 재작성 전 비교 참조용.

### 플랫폼 제약 근거
- `.planning/STATE.md` — "Blockers/Concerns: SubagentStop 미지원" 기재 위치
- `hooks/hooks.json` — SubagentStop 항목이 존재하지만 Codex 미지원 확인 가능

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/sg-retro/SKILL.md` Step 1 Phase 파싱 블록 — `grep -E '^Phase:'` + `sed` + `awk` 파이프라인. `.agents/skills/sg-retro/SKILL.md`에 그대로 복제 가능.
- `commands/sg-status.md` HANDOFF.md 파싱 로직 — `.agents/skills/sg-status/SKILL.md`에서 재사용. STATE.md Phase parsing block (D-07 inline-replication lock 패턴).
- `skills/sg-retro/SKILL.md` multi-lens loop 구조 — D-B3 복수 렌즈 지원 구현 시 기준.

### Established Patterns
- 모든 commands/*.md는 frontmatter (`name`, `description`, `argument-hint`) + `<objective>` + `<execution_context>` + `<process>` 구조를 따름.
- SKILL.md도 동일한 frontmatter + XML 섹션 구조 사용 (skills/sg-retro/SKILL.md 확인).
- `.planning/HANDOFF.md` — append-only 5컬럼 스키마 (Timestamp | Phase | To | Plan Hash | Stage).
- STATE.md Phase parsing: `grep -E '^Phase:'` → `sed` → `awk '{print $1}'` 파이프라인 (전 Phase에서 확립된 lock 패턴, 절대 shortcut 금지).

### Integration Points
- `.agents/skills/`는 신규 디렉토리 — 기존 코드와 연결 지점 없음. AGENTS.md에서 경로 안내로 연결.
- `AGENTS.md`는 Codex 세션 시작 시 자동 주입되므로 CODEX-01 success criteria 충족의 핵심.
- `.planning/lessons/` — `.agents/skills/sg-retro/SKILL.md`가 lessons 저장 대상으로 기존 경로 그대로 사용.

</code_context>

<specifics>
## Specific Ideas

- AGENTS.md에서 `$sg-*` 달러 문법 안내를 Quick Start 섹션에서 가장 먼저 보여줄 것. Codex 사용자는 슬래시 명령 없이 `$sg-start` 형태로 호출.
- SubagentStop 미지원 사실은 AGENTS.md에서 별도 "Platform Limitations" 블록으로 강조. 사용자가 sg-retro를 수동으로 호출해야 함을 명확히.
- `.agents/skills/sg-retro/SKILL.md`의 numbered list fallback은 AskUserQuestion과 동일한 옵션 텍스트를 사용해 일관성 유지.

</specifics>

<deferred>
## Deferred Ideas

- `.codex/skills/` 별도 경로 생성 여부 — Phase 15 리서치 시 Codex 공식 스킬 경로 확인 후 판단
- 13개 sg-* 전체 `.agents/skills/` 포팅 — REQUIREMENTS.md Future Requirements(v1.4+)에 기재됨. Phase 14는 핵심 6개만.
- `.agents/skills/sg-health/SKILL.md` — Codex 변형 sg-health. Phase 14 스코프 밖 (REQUIREMENTS.md v1.4+).
- `AGENTS.md`의 GSD 재생성 충돌 방지 메커니즘 — GSD가 AGENTS.md를 덮어쓰는 경우 복원 방법 문서화. Phase 16 README 작업 시 함께 처리 가능.

</deferred>

---

*Phase: 14-codex-agents-skills*
*Context gathered: 2026-05-21*
