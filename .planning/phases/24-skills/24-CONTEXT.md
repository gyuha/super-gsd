# Phase 24: Skills 품질 검토 - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

17개의 SKILL.md 파일을 QUAL-01~05 기준으로 감사하고, 결과를 `24-SUMMARY.md` 하나에 기록한다.
개선 문안 작성 및 수정 실행은 Phase 25 범위이며, 이 Phase는 현황 확인과 이슈 목록화만 수행한다.

</domain>

<decisions>
## Implementation Decisions

### 산출물 형식

- **D-01:** RESEARCH.md가 이미 완성된 상태이므로 별도 FINDINGS.md 생성 불필요. RESEARCH.md를 직접 활용한다.
- **D-02:** Phase 24 산출물은 `24-SUMMARY.md` 하나만 생성한다.
- **D-03:** PLAN.md 태스크 구조는 단일 태스크로 구성한다 (QUAL-01~05 전체를 하나의 태스크).
- **D-04:** QUAL-01/03/04/05는 근거 없이 SUMMARY에 직접 결과(PASS)를 기록한다.

### 개선 제안 초안 범위

- **D-05:** Phase 24는 이슈 목록만 생성한다. 개선 문안(rewritten description) 작성은 Phase 25 범위.
- **D-06:** QUAL-02 이슈 형식: 스킬 슬럿 + 현재 description 두 컬럼 테이블.
- **D-07:** sg-start (FAIR 등급)도 Phase 25 수정 대상에 포함. 17개 전체를 통일 기준으로 수정한다.
- **D-08:** SUMMARY의 QUAL-02 레코드는 엄격한 실행 가능성 불필요. Phase 25가 참고용으로 사용.

### sg-retro 500줄 초과 처리

- **D-09:** sg-retro (548줄)는 Phase 25 리팩토링 대상에 포함한다.
- **D-10:** 전략: 불필요한 빈 줄·중복 텍스트(라운드 트립 중복) 삭제로 500줄 이하 목표.
- **D-13:** 24-SUMMARY.md에 sg-retro 리팩토링 범위 섹션을 포함한다 (500줄 축소 대상 라인 목록).

### description 평가 기준

- **D-11:** CONTEXT.md에 GOOD/FAIR/POOR 평가 기준 정의 + 스킬별 예시 1개를 포함한다.
  Phase 25 실행자가 skill-creator 원문을 찾지 않아도 기준을 파악할 수 있도록 인라인 기록.

  **평가 기준:**
  | 등급 | 정의 | 핵심 요소 |
  |------|------|-----------|
  | GOOD | "Use this when user mentions/wants X" 패턴 — 구체적 트리거 포함 | 특정 트리거 + 도구가 하는 일 |
  | FAIR | `when` 키워드는 있지만 트리거가 모호함 | when 있음, 구체성 부족 |
  | POOR | 기능 설명만 있고 트리거 없음 | 동작만 설명, 언제 써야 하는지 없음 |

  **예시:**
  - POOR (현재 sg-plan): `"Resolve the target phase, then execute a 2-step chain: spawn a subagent to run gsd-discuss-phase and wait for it to complete, then invoke gsd-plan-phase via Skill as the terminal action."`
  - GOOD (목표 패턴): `"Use this when starting a new phase — runs gsd-discuss-phase then gsd-plan-phase automatically so the user doesn't have to chain commands manually."`

### Phase 24 완료 기준

- **D-12:** 24-SUMMARY.md에 반드시 포함되어야 할 항목:
  1. QUAL-01~05 전체 결과 테이블 (각 QUAL 항목별 PASS/FAIL, 이슈 수)
  2. QUAL-02 이슈 상세 — 17개 스킬 슬럿 + 현재 description 테이블
  3. sg-retro 리팩토링 범위 섹션 (500줄 축소 대상 라인 목록)

  위 3개 섹션이 모두 존재하면 Phase 24 완료로 판단한다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 24 리서치 및 계획

- `.planning/phases/24-skills/24-RESEARCH.md` — gsd-phase-researcher가 생성한 17개 SKILL.md 전체 감사 결과. QUAL-01~05 세부 결과 및 sg-retro 라인 분석 포함
- `.planning/REQUIREMENTS.md` — QUAL-01~06 요구사항 정의. QUAL-06(수정)은 Phase 25 범위

### 평가 기준 원문

- `~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/skill-creator/SKILL.md` — "Pushy description" 기준 원문. GOOD/FAIR/POOR 등급 정의 참조 (위 D-11에 인라인 요약 포함)

### 감사 대상

- `skills/sg-*/SKILL.md` — 17개 스킬 파일 전체. QUAL-02 rewrite 작업 시 개별 파일 수정 필요

### 프로젝트 맥락

- `.planning/PROJECT.md` — v2.1 마일스톤 목표: Skills 품질 검토 및 개선
- `.planning/STATE.md` — 현재 Phase 24 미시작 상태

</canonical_refs>

<code_context>
## Existing Code Insights

### 감사 결과 요약 (RESEARCH.md 기반)

- **QUAL-01 (frontmatter):** 17/17 PASS — name, description 필드 모두 존재
- **QUAL-02 (description 트리거 품질):** 16/17 POOR, 1/17 FAIR (sg-start) — 전원 수정 대상
- **QUAL-03 (블록 완전성):** 17/17 PASS — objective/process/success_criteria 모두 존재
- **QUAL-04 (macOS/Linux Bash 호환성):** 17/17 PASS — grep -P, sed -i 등 이슈 없음
- **QUAL-05 (cross-reference 유효성):** 17/17 PASS — 참조 경로 모두 유효

### sg-retro 과부하 현황

- `skills/sg-retro/SKILL.md`: 548줄 (skill-creator 권장 500줄 초과, +48줄)
- 주요 후보: 반복적인 예시 블록, 빈 줄 클러스터, 중복 설명 단락

</code_context>

<specifics>
## Specific Ideas

- QUAL-02 테이블 예시 형식 (24-SUMMARY.md에 사용):
  ```
  | 스킬 슬럿 | 현재 description |
  |-----------|-----------------|
  | sg-plan   | "Resolve the target phase, then execute..." |
  | sg-execute | "Execute the current phase plan..." |
  ...
  ```

- sg-retro 리팩토링 섹션 예시:
  ```
  ## sg-retro 리팩토링 범위 (Phase 25 대상)
  현재 548줄 → 목표 500줄 이하
  삭제 후보 라인: [라인 번호 목록]
  전략: 불필요한 빈 줄·중복 단락 제거
  ```

</specifics>

<deferred>
## Deferred Ideas

- **description 개선 문안 작성** — Phase 24 범위 아님. Phase 25에서 17개 전체 GOOD 등급으로 rewrite.
- **sg-retro 리팩토링 실행** — Phase 25에서 수행. Phase 24는 범위 식별만.

</deferred>

---

*Phase: 24-skills*
*Context gathered: 2026-05-23*
