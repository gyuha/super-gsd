# Phase 25: 문제점 수정 및 검증 - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 24에서 발견된 모든 문제점을 수정하고 재검증한다.

구체적으로:
1. **QUAL-02 수정** — 17개 SKILL.md의 description을 GOOD 등급 "Use this when X — does Y." 패턴으로 일괄 rewrite
2. **sg-retro 리팩토링** — `<lens_templates>` 블록(378-534줄, 157줄) 삭제로 548줄 → 391줄 축소
3. **검증** — 수정 전/후 description 비교 테이블(25-VERIFICATION.md) 생성

수정 실행과 재검증이 이 Phase의 전부다. 새로운 스킬 추가, 기능 변경, 구조 변경은 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 수정 단위

- **D-01:** 17개 SKILL.md를 단일 플랜 태스크에서 원자적으로 일괄 수정한다. 그룹별 분리 없음.

### Description 포맷

- **D-02:** description은 단일 줄로 유지한다. 멀티라인 YAML 사용 안 함.
- **D-03:** 포맷: `"Use this when [상황/조건] — [도구가 하는 일]."`
- **D-04:** 트리거 표현은 **상황 기반(situation-driven)**으로 작성한다. 사용자 발화 예시("execute", "실행해" 등) 삽입 금지. 언어 독립적으로 "언제 이 스킬이 필요한 상황인지"를 기술한다.

  **올바른 예:**
  ```
  description: Use this when the phase plan is ready and implementation should begin — hands off phase plan to Superpowers.
  ```
  **잘못된 예 (발화 기반 — 사용 금지):**
  ```
  description: Use this when user says "execute" or "run the plan" — hands off phase plan to Superpowers.
  ```

### 검증 방식

- **D-05:** 수정 완료 후 `25-VERIFICATION.md`를 생성한다. 형식: 17개 스킬별 수정 전/후 description 2컬럼 테이블 + 등급 변화(POOR/FAIR → GOOD) 기록.
- **D-06:** Phase 24 SUMMARY.md의 QUAL-02 이슈 테이블과 대응되는 구조로 작성한다.

### sg-retro 리팩토링 (Phase 24 D-09/D-10 인계)

- **D-07:** `skills/sg-retro/SKILL.md`의 `<lens_templates>` 블록(378행 `<lens_templates>` ~ 534행 `</lens_templates>`, 총 157줄)을 삭제한다.
- **D-08:** 삭제 근거: `<process>` Step 5 서브블록(라인 221-267)에 "Fixed subheadings" 목록으로 동일 정보가 이미 명시되어 있다. `<lens_templates>`는 마크다운 스켈레톤 중복이다.
- **D-09:** 삭제 전 `<process>` Step 5에서 누락된 세부 형식이 없는지 사전 비교 확인 후 삭제한다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 24 감사 결과 (수정 입력)

- `.planning/phases/24-skills/24-SUMMARY.md` — QUAL-02 이슈 목록 (17개 스킬 슬럿 + 현재 description + 등급). 이 파일이 수정 작업의 직접 입력이다
- `.planning/phases/24-skills/24-RESEARCH.md` — QUAL-01~05 전체 감사 결과. description 평가 기준(GOOD/FAIR/POOR) 정의 포함
- `.planning/phases/24-skills/24-CONTEXT.md` — Phase 24 구현 결정 (D-11: 평가 기준 인라인 정의 포함)

### 수정 대상

- `skills/sg-*/SKILL.md` — 17개 스킬 파일 전체. description 필드만 수정

### 평가 기준 원문

- `~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/skill-creator/SKILL.md` — "pushy description" 기준 원문. 특히 "undertrigger" 경고 섹션

### 프로젝트 맥락

- `.planning/REQUIREMENTS.md` — QUAL-06 요구사항: "발견된 모든 문제점이 수정되고 재검증된다"
- `.planning/PROJECT.md` — v2.1 마일스톤 목표

</canonical_refs>

<code_context>
## Existing Code Insights

### 수정 대상 파일 현황 (Phase 24 감사 기준)

| 스킬 | 줄 수 | 현재 등급 | 수정 필요 |
|------|-------|----------|----------|
| sg-complete | 69 | POOR | description rewrite |
| sg-execute | 316 | POOR | description rewrite |
| sg-explore | 23 | POOR | description rewrite |
| sg-health | 116 | POOR | description rewrite |
| sg-learn | 40 | POOR | description rewrite |
| sg-lessons | 85 | POOR | description rewrite |
| sg-new | 24 | POOR | description rewrite |
| sg-parallel-execute | 114 | POOR | description rewrite |
| sg-plan | 98 | POOR | description rewrite |
| sg-quick | 163 | POOR | description rewrite |
| sg-retro | 548 | POOR | description rewrite + 157줄 삭제 |
| sg-review | 101 | POOR | description rewrite |
| sg-ship | 56 | POOR | description rewrite |
| sg-start | 205 | FAIR | description rewrite |
| sg-status | 122 | POOR | description rewrite |
| sg-ui-plan | 84 | POOR | description rewrite |
| sg-update | 145 | POOR | description rewrite |

### sg-retro 삭제 대상

- 삭제 범위: `skills/sg-retro/SKILL.md` 378행(`<lens_templates>`) ~ 534행(`</lens_templates>`), 157줄
- 삭제 후 예상 줄 수: 548 - 157 = 391줄 (skill-creator 권장 500줄 이하 달성)
- 삭제 전 확인 사항: `<process>` Step 5 서브블록(221-267행)과 내용 중복 여부 최종 비교

### SKILL.md 수정 범위

- 수정 필드: `description` (YAML frontmatter 내)
- 수정하지 않는 부분: `name`, `argument-hint`, `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` 블록 전체

</code_context>

<specifics>
## Specific Ideas

### 25-VERIFICATION.md 형식

Phase 24 SUMMARY.md의 QUAL-02 테이블과 대응:

```markdown
## QUAL-02 수정 결과

| 스킬 슬럿 | 수정 전 description | 수정 후 description | 등급 변화 |
|-----------|-------------------|-------------------|----------|
| sg-plan   | "Gather context..." | "Use this when..." | POOR → GOOD |
...
```

### description 작성 가이드 (인라인)

각 스킬의 description을 작성할 때 아래 질문에 답하는 형태로 작성한다:
- "어떤 상황에서 이 스킬이 필요한가?" → `Use this when [상황]`
- "이 스킬이 무엇을 하는가?" → `— [동작 요약]`

예시 (sg-execute):
- 상황: "phase plan이 완성되어 구현을 시작해야 할 때"
- 동작: "PLAN/REQ/SC를 패키징해 Superpowers에 인계"
- 결과: `"Use this when the phase plan is ready and implementation should begin — packages PLAN/REQ/SC and hands off to Superpowers."`

</specifics>

<deferred>
## Deferred Ideas

- **멀티라인 description** — 트리거 커버리지를 더 높이려면 멀티라인 YAML이 효과적이지만, 단일 줄 유지로 결정. 향후 undertrigger 문제가 실제로 발생하면 재검토.
- **발화 기반 트리거(한국어 병기)** — 상황 기반으로 결정했으므로 보류. 한국어 발화 매칭 문제가 실제 발생 시 재검토.

</deferred>

---

*Phase: 25-fix-and-verify*
*Context gathered: 2026-05-23*
