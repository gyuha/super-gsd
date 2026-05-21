# Phase 20: sg-plan Visual Companion 통합 - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** discuss-phase (gsd-discuss-phase + 사용자 직접 결정)

<domain>
## Phase Boundary

`commands/sg-plan.md` 한 파일만 수정한다. Phase resolve(Step 1) 이후, gsd-discuss-phase Agent 호출(Step 2) 이전에 UI 판단 로직과 brainstorming 분기를 삽입한다.

Phase 21 범위(sg-ui-plan 명령, HANDOFF.md VC-04)는 이 phase에서 건드리지 않는다.

</domain>

<decisions>
## Implementation Decisions

### D-01: UI 판단 방식 (조건부, 키워드 기반)
- phase goal 텍스트에 'UI', '화면', 'design', 'Visual', 'frontend', 'interface', 'component' 키워드가 포함될 때만 AskUserQuestion 제시
- 관련 없는 phase에서는 질문 없이 자동 skip

### D-02: brainstorming Agent 컨텍스트 범위
- ROADMAP.md의 §Phase N 섹션 전체를 Agent 프롬프트에 포함
- phase goal 단독이나 CONTEXT.md 전체는 사용하지 않음

### D-03: UI 거부 시 흐름
- "UI 없음" 선택 시 `[sg-plan] UI 설계 없이 진행합니다.` 한 줄 출력 후 기존 Step 2(gsd-discuss-phase)로 이동
- Visual Companion을 선택하지 않더라도, phase에 UI 관련 작업이 실제로 포함된다면 텍스트로 설계 방향을 제시하고 안내한다

### D-04: brainstorming Agent 패턴
- brainstorming은 터미널 Skill 불가 → gsd-discuss-phase와 동일한 Agent 패턴 사용
- `Agent(subagent_type="general-purpose", prompt="Skill(skill='superpowers:brainstorming', args=...)")`

### D-05: brainstorming 에러 처리
- Agent 에러 종료 시 `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 경고 출력 후 gsd-discuss-phase로 진행 (중단 없음)
- gsd-discuss-phase 에러 시 기존 동작(abort) 유지

### D-06: 삽입 위치
- REQUIREMENTS.md VC-01 기준: Step 1(phase resolve) 완료 직후, Step 2(gsd-discuss-phase Agent 호출) 이전
- HANDOFF.md 기록(Step 2.5)은 변경하지 않음

### Claude's Discretion
- 키워드 매칭 방식: `grep -iE` 사용, 대소문자 무시
- AskUserQuestion 레이블: "Visual Companion 포함" / "UI 없음"
- PHASE_SECTION 읽기: `gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section` 또는 grep

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상
- `commands/sg-plan.md` — 이 phase의 유일한 수정 대상 파일

### 요구사항
- `.planning/REQUIREMENTS.md §VC-01, VC-02` — phase 요구사항 정의

### 패턴 참조
- `commands/sg-learn.md` — Agent 패턴 및 Skill 호출 fallback 구조 참조
- `commands/sg-execute.md` — 조건부 분기 + 프로그레스 메시지 패턴

</canonical_refs>

<specifics>
## Specific Ideas

- PHASE_SECTION 추출: `gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null`로 phase 설명 섹션 추출
- UI 키워드 체크: `echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component"` 로 간단히 처리
- brainstorming Agent 프롬프트에 PHASE_SECTION 변수 직접 삽입

</specifics>

<deferred>
## Deferred Ideas

- sg-ui-plan 신규 명령 (VC-03) — Phase 21 범위
- HANDOFF.md `To: ui-plan` 기록 (VC-04) — Phase 21 범위
- plugin.json, README.md, docs/COMMANDS.md 업데이트 (VC-05~07) — Phase 21 범위

</deferred>

---

*Phase: 20-sg-plan-visual-companion*
*Context gathered: 2026-05-22 via discuss-phase*
