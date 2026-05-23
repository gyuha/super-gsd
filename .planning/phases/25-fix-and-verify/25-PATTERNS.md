# Phase 25: 문제점 수정 및 검증 - Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 19 (17개 SKILL.md description 수정 + sg-retro lens_templates 삭제 + 25-VERIFICATION.md 신규 생성)
**Analogs found:** 17 / 19 (25-VERIFICATION.md는 analogless 신규 파일)

---

## File Classification

| 수정/생성 파일 | Role | Data Flow | Closest Analog | Match Quality |
|--------------|------|-----------|----------------|---------------|
| `skills/sg-complete/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | exact |
| `skills/sg-execute/SKILL.md` | config | transform | `skills/sg-plan/SKILL.md` | exact |
| `skills/sg-explore/SKILL.md` | config | transform | `skills/sg-complete/SKILL.md` | exact |
| `skills/sg-health/SKILL.md` | config | transform | `skills/sg-status/SKILL.md` | exact |
| `skills/sg-learn/SKILL.md` | config | transform | `skills/sg-retro/SKILL.md` | exact |
| `skills/sg-lessons/SKILL.md` | config | transform | `skills/sg-plan/SKILL.md` | exact |
| `skills/sg-new/SKILL.md` | config | transform | `skills/sg-complete/SKILL.md` | exact |
| `skills/sg-parallel-execute/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | exact |
| `skills/sg-plan/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | exact |
| `skills/sg-quick/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | exact |
| `skills/sg-retro/SKILL.md` | config | transform | `skills/sg-learn/SKILL.md` | exact |
| `skills/sg-review/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | exact |
| `skills/sg-ship/SKILL.md` | config | transform | `skills/sg-complete/SKILL.md` | exact |
| `skills/sg-start/SKILL.md` | config | transform | `skills/sg-execute/SKILL.md` | role-match |
| `skills/sg-status/SKILL.md` | config | transform | `skills/sg-health/SKILL.md` | exact |
| `skills/sg-ui-plan/SKILL.md` | config | transform | `skills/sg-plan/SKILL.md` | exact |
| `skills/sg-update/SKILL.md` | config | transform | `skills/sg-health/SKILL.md` | role-match |
| `skills/sg-retro/SKILL.md` (삭제) | config | — | — | n/a |
| `.planning/phases/25-fix-and-verify/25-VERIFICATION.md` | — | — | `.planning/phases/24-skills/24-SUMMARY.md` | partial |

---

## Pattern Assignments

### 모든 `skills/sg-*/SKILL.md` — description 필드 수정

**수정 범위:** YAML frontmatter의 `description:` 줄 1개만 변경. 나머지 필드(`name`, `argument-hint`, `<objective>`, `<process>`, `<success_criteria>` 등) 일체 불변.

**포맷 규칙 (D-02, D-03, D-04):**
```yaml
description: "Use this when [상황/조건] — [도구가 하는 일]."
```
- 단일 줄. 멀티라인 YAML 금지.
- 트리거는 **상황 기반**: "언제 이 스킬이 필요한 상황인지"를 기술. 사용자 발화 예시("execute", "실행해") 삽입 금지.

**현재 frontmatter 구조** (`skills/sg-execute/SKILL.md` lines 1-5):
```yaml
---
name: sg-execute
description: Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---
```

**수정 후 구조 (변경 줄: line 3만):**
```yaml
---
name: sg-execute
description: "Use this when the phase plan is ready and implementation should begin — packages PLAN/REQ/SC and hands off to Superpowers."
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---
```

---

### 스킬별 description 초안 (objective 기반 도출)

각 스킬의 `<objective>` 내용에서 "상황"과 "동작"을 추출한 초안이다. 플래너는 이 초안을 기반으로 최종 description을 확정한다.

| 스킬 슬럿 | 현재 등급 | 상황 (Use this when...) | 동작 (— does...) |
|-----------|---------|------------------------|-----------------|
| sg-complete | POOR | 마일스톤 구현이 완료되고 종료 처리가 필요할 때 | gsd-complete-milestone을 호출해 마일스톤을 완료 상태로 기록 |
| sg-execute | POOR | phase plan이 완성되어 구현을 시작해야 할 때 | PLAN/REQ/SC를 패키징해 Superpowers에 인계 |
| sg-explore | POOR | 새 프로젝트 또는 낯선 코드베이스를 파악해야 할 때 | gsd-map-codebase를 호출해 코드베이스 구조 매핑 |
| sg-health | POOR | super-gsd 설치 상태나 훅 등록 여부를 진단해야 할 때 | GSD/Superpowers/hooks/HANDOFF.md/STATE.md를 라인별 [OK]/[WARN]/[FAIL]로 점검 |
| sg-learn | POOR | 작업 세션이 끝나고 패턴과 교훈을 추출해야 할 때 | sg-retro를 호출해 회고를 실행하고 lessons 파일에 기록 |
| sg-lessons | POOR | 다음 phase 계획 전에 이전 교훈을 컨텍스트로 주입해야 할 때 | .planning/lessons/ 파일들을 읽어 순서대로 출력 |
| sg-new | POOR | 현재 마일스톤이 완료되고 새 마일스톤을 시작해야 할 때 | gsd-new-milestone을 호출해 마일스톤 초기 구조 생성 |
| sg-parallel-execute | POOR | PLAN.md에 독립적인 병렬 그룹이 있고 동시 실행으로 속도를 높여야 할 때 | parallel_groups.json을 읽어 최대 3개 Task 에이전트를 동시 실행 |
| sg-plan | POOR | 새 phase를 시작하기 위한 계획 수립이 필요할 때 | lessons를 주입하고 gsd-discuss-phase → gsd-plan-phase 체인을 자동 실행 |
| sg-quick | POOR | 전체 phase 계획 없이 소규모 단발성 작업을 즉시 실행해야 할 때 | gsd-planner를 거쳐 Superpowers에 자동 인계하는 경량 파이프라인 실행 |
| sg-retro | POOR | phase가 끝나고 6가지 렌즈 중 하나 이상으로 구조화된 회고가 필요할 때 | SSC/4Ls/DSPM/Sailboat/FiveWhys/Analyzer 렌즈를 실행하고 lessons 파일에 append |
| sg-review | POOR | 코드 구현이 완료되어 리뷰가 필요할 때 | git range를 도출하고 superpowers:requesting-code-review에 인계 |
| sg-ship | POOR | 마일스톤 검증이 완료되고 릴리스·배포를 해야 할 때 | gsd-ship을 호출해 마일스톤 출하 처리 |
| sg-start | FAIR | 프로젝트를 처음 시작하거나 중단된 세션을 재개해야 할 때 | 기존 세션을 탐지해 Resume/새 마일스톤/취소를 선택하거나 gsd-new-project로 폴백 |
| sg-status | POOR | 현재 워크플로우 단계와 다음 추천 명령을 빠르게 확인해야 할 때 | HANDOFF.md/STATE.md를 읽어 현재 stage, 마지막 핸드오프 시각, 다음 명령을 출력 |
| sg-ui-plan | POOR | phase에 UI/시각 설계 브레인스토밍이 필요할 때 | ROADMAP.md에서 phase 컨텍스트를 읽고 superpowers:brainstorming을 실행 |
| sg-update | POOR | GSD/Superpowers/super-gsd 중 하나가 없거나 버전이 낮은 것 같을 때 | 각 도구의 설치 여부를 확인하고 없으면 설치, 있으면 최신 버전으로 업데이트 |

---

### `skills/sg-retro/SKILL.md` — lens_templates 블록 삭제

**삭제 범위 (D-07):**
- Line 378: `<lens_templates>`
- Lines 379–533: 6개 렌즈 마크다운 스켈레톤
- Line 534: `</lens_templates>`
- 총 157줄 삭제

**삭제 후 예상 줄 수:** 548 - 157 = 391줄

**삭제 전 확인 사항 (D-09):** `<process>` Step 5 서브블록(lines 221–267)에 각 렌즈의 Fixed subheadings가 이미 명시되어 있음을 확인 후 삭제.

현재 Step 5 서브블록에 정의된 내용 (`skills/sg-retro/SKILL.md` lines 221–267):
- **ssc:** `### Start` / `### Stop` / `### Continue`
- **4ls:** `### Liked` / `### Learned` / `### Lacked` / `### Longed For`
- **dspm:** `### Decisions` / `### Surprises` / `### Patterns` / `### Mistakes`
- **sail:** `### Wind` / `### Anchor` / `### Sun` / `### Rock`
- **5why:** `### Problem Statement` / `### Why 1~5` / `### Root Cause`
- **analyze:** `### Analysis Findings` (표) / `### Draft sg-rules` / `### Action Items`

lens_templates 블록의 스켈레톤과 100% 중복 — 삭제 안전.

**삭제 후 `</process>` 태그 직전 구조** (현재 line 376):
```
fi
```  (lines 370-374 — auto-suggest 조건문)

삭제 후 line 376의 `</process>` 다음 줄에 `<success_criteria>`가 이어지면 된다.

---

### `.planning/phases/25-fix-and-verify/25-VERIFICATION.md` — 신규 생성

**Analog:** `.planning/phases/24-skills/24-SUMMARY.md` (QUAL-02 이슈 테이블 구조)

**형식 (D-05, D-06):**

```markdown
## QUAL-02 수정 결과

| 스킬 슬럿 | 수정 전 description | 수정 후 description | 등급 변화 |
|-----------|-------------------|-------------------|----------|
| sg-complete | "Complete the current milestone..." | "Use this when..." | POOR → GOOD |
...

## sg-retro 리팩토링 결과

| 항목 | 수정 전 | 수정 후 |
|------|--------|--------|
| 줄 수 | 548 | 391 |
| 삭제 범위 | — | lines 378-534 (<lens_templates>) |
| 500줄 이하 달성 | ✗ | ✓ |
```

---

## Shared Patterns

### SKILL.md frontmatter 구조
**Source:** `skills/sg-execute/SKILL.md` lines 1-5  
**Apply to:** 17개 SKILL.md 수정 시 frontmatter 구조 유지

```yaml
---
name: {skill-slug}
description: "Use this when [상황] — [동작]."
argument-hint: "[...]"  # (있는 경우만)
---
```

`argument-hint` 없는 스킬(예: sg-retro, sg-learn, sg-explore)은 해당 줄 자체가 없으므로 추가하지 않는다.

### 단일 줄 description 수정 방법
**Apply to:** 17개 모든 SKILL.md

수정은 line 3의 `description:` 줄만 교체. Edit 도구 사용 시:
- `old_string`: 현재 `description: ...` 전체 줄
- `new_string`: 새 `description: "Use this when ..."` 줄

---

## No Analog Found

| 파일 | Role | Data Flow | 이유 |
|------|------|-----------|------|
| `25-VERIFICATION.md` | — | — | 수정 전/후 비교 검증 문서는 프로젝트 내 유사 파일 없음. 24-SUMMARY.md의 QUAL-02 테이블 구조를 참조해 생성 |

---

## Metadata

**Analog search scope:** `skills/sg-*/SKILL.md`, `.planning/phases/24-skills/`
**Files scanned:** 19
**Pattern extraction date:** 2026-05-23
