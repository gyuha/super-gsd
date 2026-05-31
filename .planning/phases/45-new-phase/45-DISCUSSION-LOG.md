# Phase 45: sg-plan Grilling Step - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 45-new-phase
**Areas discussed:** Insertion point, Question surfacing, Codebase-first resolution, Design-tree branching, Termination gate, Agreement hand-off, Pairwise sync

---

> **수집 방식 주의:** 이 discuss-phase는 `sg-plan`이 spawn한 비대화형 subagent 안에서 실행되었다. subagent에는 AskUserQuestion 채널이 없어 대화형 토론을 진행할 수 없었다. workflow의 `--auto` 모드 동작(모든 gray area 자동 선택 + 권장안 채택, 단일 pass)을 따라 에이전트가 직접 결정했으며, 근거는 ROADMAP/REQUIREMENTS/STATE 락 컨텍스트와 코드베이스 직접 탐색이다. 아래 표의 "Selected"는 에이전트의 권장안 선택을 의미한다.

## Insertion point (삽입 위치)

| Option | Description | Selected |
|--------|-------------|----------|
| Step 1 직후 / discuss Agent 직전 | phase 해소 후 곧바로 grill, 그 다음 discuss | ✓ |
| Step 0(lessons) 이전 | 가장 앞단에서 grill | |
| discuss Agent 내부로 위임 | gsd-discuss-phase 수정 | |

**선택:** Step 1 직후 / discuss Agent 직전. **근거:** GRILL-01 "discuss 호출 전 메인 컨텍스트" + PHASE_NUM 확정 후 ROADMAP을 읽어야 질문 생성 가능. discuss 내부 위임은 Non-invasive 제약 위반이라 배제.

---

## Question surfacing (질문 표면화 메커니즘)

| Option | Description | Selected |
|--------|-------------|----------|
| .claude=AskUserQuestion / .agents=프로즈 폴백 | 플랫폼별 분기 (Step 1.5 패턴 답습) | ✓ |
| 양쪽 다 프로즈 폴백 | 일관성 우선 | |
| 양쪽 다 자유 텍스트만 | 도구 미사용 | |

**선택:** 플랫폼별 분기. **근거:** 두 파일이 이미 같은 분기 패턴 사용. 한 번에 하나씩(GRILL-01) + 권장안 동반(GRILL-02) + 사용자 언어(CLAUDE.md 컨벤션) 보존.

---

## Codebase-first resolution (코드베이스 우선 해소)

| Option | Description | Selected |
|--------|-------------|----------|
| 탐색 우선 → 불가 시에만 질문 | Read/Bash로 먼저 답 찾고, 코드에 없는 정보만 질문 | ✓ |
| 항상 사용자에게 질문 | 탐색 생략 | |

**선택:** 탐색 우선 2단계 판정. **근거:** GRILL-03 직접 요구사항.

---

## Design-tree branching (설계 트리 분기)

| Option | Description | Selected |
|--------|-------------|----------|
| 이전 답이 다음 질문 결정 | 가장 불확실·후속 영향 큰 항목을 다음 질문으로 | ✓ |
| 고정 질문 목록 순차 | 분기 없음 | |

**선택:** 동적 의존성 순차 해소. **근거:** GRILL-04 직접 요구사항.

---

## Termination gate (종료 게이트)

| Option | Description | Selected |
|--------|-------------|----------|
| 합의 요약 → 사용자 확정/추가질문 게이트 | Claude 단독 종료 불가 | ✓ |
| Claude 자율 종료 | 사용자 확인 없음 | |

**선택:** 사용자 확인 게이트. **근거:** GRILL-05 + REQUIREMENTS.md Out-of-Scope "Claude 자율 종료 금지".

---

## Agreement hand-off (합의 결과 전달)

| Option | Description | Selected |
|--------|-------------|----------|
| inline 프롬프트 주입 | discuss Agent prompt에 합의 요약 문단 추가 | ✓ |
| 별도 파일(NN-GRILL.md) | 파일로 영속화 후 전달 | |

**선택:** inline 프롬프트 주입. **근거:** STATE.md 락 결정 "no separate file, passed inline" + Non-invasive(discuss-phase 미수정 → 프롬프트 주입이 유일 통로).

---

## Pairwise sync (쌍 파일 동기화)

| Option | Description | Selected |
|--------|-------------|----------|
| 두 SKILL.md 같은 commit | skills/ + .agents/skills/ 동시 변경 | ✓ |
| skills/만 변경 | .agents 미러 누락 | |

**선택:** 두 파일 동시 변경. **근거:** CLAUDE.md "skills/ + .agents/ 쌍 커버" + ARCHITECTURE.md anti-pattern(drift는 review에서 플래그).

---

## Claude's Discretion

- grill 지시문의 정확한 산문·단계 번호 부여
- 합의 요약·질문 프롬프트의 정확한 문장(필수 동작만 고정)
- 두 SKILL.md `<success_criteria>` 블록에 grill 항목 추가 여부·문구
- `.agents` 버전에서 grill vs Step 1.5(Visual Companion) 순서(권장: grill 먼저, 플래너 1회 검토)

## Deferred Ideas

- 두 sg-plan SKILL.md의 전반적 구조 divergence 정합(`.claude`에 Visual Companion 부재 등)
- 독립 `sg-grill` 재사용 명령 분리(REQUIREMENTS Out-of-Scope)
- grill 합의를 별도 파일로 영속화
- README/문서에 grill 단계 설명 추가
