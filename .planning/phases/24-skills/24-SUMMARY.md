---
phase: 24-skills
subsystem: skills
tags: [skills, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, audit]

requirements-verified:
  - QUAL-01
  - QUAL-02
  - QUAL-03
  - QUAL-04
  - QUAL-05

issues-found: 16
phase-25-scope:
  - QUAL-02 description rewrite (17개 스킬)
  - sg-retro 500줄 축소 리팩토링

completed: 2026-05-23
---

# Phase 24-01: Skills 품질 감사 결과

**17개 SKILL.md 전수 감사 완료 — QUAL-02(description 트리거 품질) 16건 이슈 확인, 나머지 QUAL-01/03/04/05 전원 통과.**

---

## QUAL 감사 결과 요약

| 요구사항 | 결과 | 이슈 수 | 영향 스킬 수 |
|---------|------|--------|------------|
| QUAL-01 (frontmatter 필수 필드) | PASS | 0 | 0 |
| QUAL-02 (description 트리거 품질) | FAIL | 16 | 17 |
| QUAL-03 (블록 완전성) | PASS | 0 | 0 |
| QUAL-04 (macOS/Linux Bash 호환성) | PASS | 0 | 0 |
| QUAL-05 (cross-reference 유효성) | PASS | 0 | 0 |

QUAL-02 결과가 FAIL인 이유: 16개가 POOR, 1개(sg-start)가 FAIR — 17개 전부 pushy description 기준 미달이므로 모두 Phase 25 수정 대상이다.

QUAL-01/03/04/05 결과는 24-RESEARCH.md 직접 감사 결과를 PASS로 기록한다.

---

## QUAL-02 이슈 상세 — description 트리거 품질

### 평가 기준

Phase 25 실행자가 skill-creator 원문을 별도로 찾지 않아도 기준을 파악할 수 있도록 인라인 정의를 포함한다.

| 등급 | 정의 | 핵심 요소 |
|------|------|-----------|
| GOOD | "Use this when user mentions/wants X" 패턴 — 구체적 트리거 포함 | 특정 트리거 발화 + 도구가 하는 일 |
| FAIR | `when` 키워드는 있지만 구체적 사용자 행동 기술 없음 | when 있음, 구체성 부족 |
| POOR | 기능 설명만 있고 트리거 없음 — under-trigger 위험 | 동작만 설명, 언제 써야 하는지 없음 |

출처: skill-creator SKILL.md — "description: When to trigger, what it does. ... Claude has a tendency to 'undertrigger' skills — to not use them when they'd be useful. To combat this, please make the skill descriptions a little bit 'pushy'."

### 이슈 목록 (Phase 25 수정 참고용)

| 스킬 슬럿 | 등급 | 현재 description |
|-----------|------|-----------------|
| sg-complete | POOR | Complete the current milestone — invokes gsd-complete-milestone Skill. |
| sg-execute | POOR | Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans. |
| sg-explore | POOR | Explore and map the codebase — invokes gsd-map-codebase Skill. |
| sg-health | POOR | Diagnose super-gsd installation status — GSD, Superpowers, Hookify (optional), hooks, HANDOFF.md, STATE.md |
| sg-learn | POOR | Run a retrospective via sg-retro to extract patterns and generate hooks from this session. |
| sg-lessons | POOR | List prior lessons from .planning/lessons/ (written by sg-retro) and inject them as context for the next GSD phase. |
| sg-new | POOR | Start a new milestone — invokes gsd-new-milestone Skill. |
| sg-parallel-execute | POOR | Reads parallel_groups.json and dispatches up to 3 parallel Task() agents — one per independent group — to execute PLAN.md tasks directly without calling superpowers:executing-plans. |
| sg-plan | POOR | Gather context (injects .planning/lessons/) and create a phase plan — chains gsd-discuss-phase → gsd-plan-phase automatically. |
| sg-quick | POOR | Execute a small, ad-hoc task with GSD guarantees (atomic commits, STATE.md tracking). Quick mode for one-off tasks that don't need a full phase plan. |
| sg-retro | POOR | Run a structured retrospective on a GSD phase with one of six lenses ... |
| sg-review | POOR | Request a code review via Superpowers — derives git range, collects description, then invokes superpowers:requesting-code-review Skill. |
| sg-ship | POOR | Complete and ship the current milestone — invokes gsd-ship Skill. |
| sg-start | FAIR | Start or resume a project — detects existing session, prompts Resume / Start new milestone / Cancel; falls back to gsd-new-project when no session is detected. |
| sg-status | POOR | Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command. |
| sg-ui-plan | POOR | Run UI design brainstorming for a phase — resolves phase context from ROADMAP.md and invokes superpowers:brainstorming. |
| sg-update | POOR | Check, install, or update GSD, superpowers, and super-gsd to their latest versions. |

**결론:** 16/17 POOR, 1/17 FAIR, 0/17 GOOD. Phase 25에서 17개 전체를 GOOD 등급으로 rewrite 대상.

---

## sg-retro 리팩토링 범위 (Phase 25 대상)

현재 상태: 548줄 → 목표: 500줄 이하 (skill-creator 권장 상한)

**삭제 후보:** `<lens_templates>` 블록 (라인 378-534, 157줄)

**전략:** `<lens_templates>` 블록 전체 삭제 (라운드 트립 중복 제거)

**근거:** 각 렌즈의 출력 형식은 `<process>` Step 5 서브블록(라인 221-267)에 "Fixed subheadings" 목록으로 이미 명시되어 있다. `<lens_templates>` 블록은 동일 정보의 마크다운 스켈레톤 버전으로 중복이다.

**삭제 후 예상 줄 수:** 548 - 157 = 391줄 (목표 달성)

**삭제 대상 라인 범위:**
- 378: `<lens_templates>`
- 379-533: 6개 렌즈 마크다운 스켈레톤 전체
- 534: `</lens_templates>`
- 총 157줄

---

## 완료 기준 확인 (D-12)

- QUAL-01~05 전체 결과 테이블 포함 ✓
- QUAL-02 이슈 상세 테이블 (17개 스킬 슬럿 + 현재 description) 포함 ✓
- sg-retro 리팩토링 범위 섹션 포함 ✓
