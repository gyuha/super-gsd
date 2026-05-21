# Phase 20: sg-plan Visual Companion 통합 - Research

**Researched:** 2026-05-22
**Domain:** Claude Code command authoring (Markdown process file 수정)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01**: UI 판단 — phase goal 텍스트에 `UI|화면|design|Visual|frontend|interface|component` 키워드가 있을 때만 AskUserQuestion 제시
- **D-02**: brainstorming Agent 컨텍스트 — ROADMAP.md §Phase N 섹션 전체 (`gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section`)
- **D-03**: UI 거부 시 — `[sg-plan] UI 설계 없이 진행합니다.` 한 줄 출력 후 기존 Step 2로 이동
- **D-04**: brainstorming Agent 패턴 — `Agent(subagent_type="general-purpose", prompt="Skill(skill='superpowers:brainstorming', args=...)")`
- **D-05**: brainstorming 에러 처리 — `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 gsd-discuss-phase로 계속
- **D-06**: 삽입 위치 — Step 1(phase resolve) 완료 직후, Step 2(gsd-discuss-phase) 이전
- **Claude's Discretion**:
  - 키워드 매칭: `grep -iE` 사용
  - AskUserQuestion 레이블: "Visual Companion 포함" / "UI 없음"
  - PHASE_SECTION 읽기: `gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section`

### Deferred Ideas (OUT OF SCOPE)

- sg-ui-plan 신규 명령 (VC-03) — Phase 21 범위
- HANDOFF.md `To: ui-plan` 기록 (VC-04) — Phase 21 범위
- plugin.json, README.md, docs/COMMANDS.md 업데이트 (VC-05~07) — Phase 21 범위
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VC-01 | sg-plan은 phase를 resolve한 뒤 gsd-discuss-phase 이전에 "이 단계에 UI 설계가 포함되어 있나요?"를 AskUserQuestion으로 묻는다 | AskUserQuestion 문법은 sg-start.md에서 [VERIFIED]. 키워드 기반 조건 분기는 grep -iE 패턴으로 구현 [VERIFIED] |
| VC-02 | 사용자가 UI 단계임을 확인하면 `superpowers:brainstorming`을 gsd-discuss-phase 이전에 호출한다. 완료 후 기존 흐름 계속 | brainstorming SKILL.md [VERIFIED], Agent() 패턴은 sg-plan.md Step 2에서 동일 구조 확인 [VERIFIED] |
</phase_requirements>

---

## Summary

Phase 20은 `commands/sg-plan.md` **한 파일만** 수정한다. 변경 범위는 명확하다: Step 1(phase resolve) 완료 직후에 새 Step 1.5 블록을 삽입하는 것이다. 이 블록은 (a) phase goal에서 UI 키워드를 감지하고, (b) 감지 시 AskUserQuestion으로 사용자 의도를 확인하며, (c) 확인 시 brainstorming Agent를 실행하고, (d) 어느 경로든 Step 2(gsd-discuss-phase)로 합류한다.

기술적 복잡도가 낮다. 사용할 세 가지 메커니즘(AskUserQuestion, Agent(), `gsd-sdk query roadmap.get-phase`)이 이미 이 프로젝트 codebase에서 사용 중이거나 검증된 도구다. 위험 요소는 brainstorming Skill이 `writing-plans`를 자동 호출하는 HARD-GATE를 갖고 있다는 점인데, Agent 프롬프트로 이를 억제해야 한다.

**Primary recommendation:** Step 1.5를 단일 코드 블록으로 삽입하되, brainstorming Agent 프롬프트에 "brainstorming 완료 후 writing-plans를 호출하지 말 것"을 명시하여 HARD-GATE를 재정의한다.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| UI 키워드 감지 | Command (sg-plan.md) | — | phase goal 텍스트를 bash grep으로 검사 — 외부 의존 없음 |
| AskUserQuestion 제시 | Command (sg-plan.md) | — | Claude Code runtime이 처리, command가 호출만 함 |
| brainstorming 실행 | Agent (general-purpose) | superpowers:brainstorming Skill | terminal Skill 불가이므로 Agent wrapper 필요 |
| gsd-discuss-phase 실행 | Agent (general-purpose) | gsd-discuss-phase Skill | 기존 Step 2 패턴 그대로 유지 |
| ROADMAP 섹션 읽기 | gsd-sdk CLI | — | `gsd-sdk query roadmap.get-phase` 검증 완료 |

---

## Standard Stack

이 phase는 외부 패키지를 설치하지 않는다. 의존 도구:

| 도구 | 버전/위치 | 목적 | 상태 |
|------|-----------|------|------|
| `gsd-sdk` | `/Users/gyuha/.local/share/mise/installs/node/24.13.0/bin/gsd-sdk` | roadmap.get-phase 쿼리 | [VERIFIED: 직접 실행 확인] |
| `superpowers:brainstorming` | `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/SKILL.md` | UI 설계 brainstorming | [VERIFIED: SKILL.md 직접 읽음] |
| `AskUserQuestion` | Claude Code runtime built-in | 사용자 선택 UI | [VERIFIED: sg-start.md 실사용 확인] |
| `Agent()` | Claude Code runtime built-in | subagent 실행 | [VERIFIED: sg-plan.md Step 2 실사용 확인] |

### Package Legitimacy Audit

신규 패키지 없음 — 이 phase는 파일 수정만 수행한다.

---

## Architecture Patterns

### 삽입 위치 다이어그램

현재 sg-plan.md 흐름에 Step 1.5가 어떻게 삽입되는지:

```
Step 0: Prior lessons 주입
    ↓
Step 1: Phase resolve (PHASE_NUM 결정)
    ↓
[Step 1.5: Visual Companion 분기 — 신규 삽입]
    ↓ UI 키워드 없음        ↓ 키워드 있음
    |                       AskUserQuestion
    |                       ↓ "UI 없음"        ↓ "Visual Companion 포함"
    |                       한 줄 출력          Agent(brainstorming)
    |                           |               ↓ 성공        ↓ 에러
    |                           |               계속           경고 출력
    ↓ ←——————————————————————————←——————————————←
Step 2: gsd-discuss-phase Agent
    ↓
Step 2.5: HANDOFF.md 기록
    ↓
Step 3: gsd-plan-phase Skill (terminal)
```

### Pattern 1: AskUserQuestion 문법 [VERIFIED: sg-start.md]

```markdown
AskUserQuestion(
  questions: [{
    question: "이 phase에 UI 설계가 포함되어 있나요?",
    header: "Visual Companion",
    multiSelect: false,
    options: [
      { label: "Visual Companion 포함", description: "superpowers:brainstorming을 실행하여 UI를 설계합니다." },
      { label: "UI 없음", description: "UI 설계 없이 기존 흐름을 진행합니다." }
    ]
  }]
)
```

### Pattern 2: Agent() brainstorming 호출 [VERIFIED: sg-plan.md Step 2 패턴 기반, D-04]

```markdown
Agent(
  description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
  prompt="Your task is to run the superpowers brainstorming workflow for Phase $PHASE_NUM UI design. The project root is the current working directory. Context:\n\n$PHASE_SECTION\n\nInvoke Skill(skill='superpowers:brainstorming', args='Phase $PHASE_NUM UI 설계: 위 컨텍스트를 참고하여 brainstorming을 진행하되, 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료합니다.') and follow its instructions.",
  subagent_type="general-purpose"
)
```

**중요:** brainstorming SKILL.md는 "The terminal state is invoking writing-plans" 라고 명시한다. Agent 프롬프트에서 이를 재정의하지 않으면 brainstorming 완료 후 writing-plans가 호출된다. [VERIFIED: SKILL.md 직접 확인]

### Pattern 3: gsd-sdk roadmap.get-phase [VERIFIED: 직접 실행]

```bash
PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
```

실제 출력 확인 (Phase 20):
- `--pick section` → 해당 phase의 전체 마크다운 섹션 텍스트 반환
- JSON 래퍼 없이 raw 텍스트로 반환됨

### Pattern 4: 키워드 감지

```bash
if echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
  # AskUserQuestion 블록 실행
else
  : # 조용히 skip
fi
```

**주의:** `grep -q` 대신 `> /dev/null 2>&1`을 써야 macOS BSD grep 호환성이 보장된다. [ASSUMED — BSD grep의 -q 동작은 대부분 같지만 이중 안전]

### Anti-Patterns to Avoid

- **brainstorming에서 writing-plans 자동 호출:** SKILL.md의 HARD-GATE는 writing-plans를 terminal action으로 지정한다. Agent 프롬프트로 명시적 억제 필요.
- **PHASE_SECTION 변수 삽입 시 따옴표 문제:** `$PHASE_SECTION`에 줄바꿈과 따옴표가 포함될 수 있다. Agent prompt 조립 시 heredoc 또는 적절한 이스케이핑 필요.
- **Step 번호 충돌:** 기존 Step 2, 2.5, 3 번호를 건드리지 말고 "Step 1.5"로 삽입한다.
- **brainstorming Agent 에러 처리 누락:** 기존 Step 2(gsd-discuss-phase) 에러는 abort이지만, Step 1.5 brainstorming 에러는 D-05에 따라 warn-and-continue여야 한다. 두 에러 처리를 혼동하면 안 된다.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 사용자 선택 UI | 자체 입력 파싱 | `AskUserQuestion()` | Claude Code 내장 — 옵션 레이블, 멀티셀렉트 지원 |
| phase 섹션 읽기 | grep+awk ROADMAP.md 직접 파싱 | `gsd-sdk query roadmap.get-phase --pick section` | 이미 검증된 쿼리 핸들러, 파싱 오류 없음 |
| brainstorming 구현 | 커스텀 UI 설계 대화 | `superpowers:brainstorming` Skill | 기존 visual companion 인프라 활용 |

---

## Common Pitfalls

### Pitfall 1: brainstorming HARD-GATE — writing-plans 자동 호출
**What goes wrong:** brainstorming Skill이 완료되면 `Invoke writing-plans skill`을 terminal action으로 자동 실행한다. sg-plan 흐름에서는 이것이 불필요하고, gsd-discuss-phase/gsd-plan-phase와 충돌한다.
**Why it happens:** SKILL.md가 "The terminal state is invoking writing-plans"라고 명시. Skill은 자신의 문서를 따른다.
**How to avoid:** Agent 프롬프트에 "brainstorming 완료 후 writing-plans를 호출하지 마십시오. 대화만 진행하고 종료합니다"를 명시한다.
**Warning signs:** brainstorming Agent 종료 후 PLAN.md가 생성되거나 writing-plans가 호출되면 이 pitfall에 빠진 것.

### Pitfall 2: PHASE_SECTION 빈 값
**What goes wrong:** `gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section`이 빈 문자열을 반환하면 키워드 grep이 항상 false → AskUserQuestion이 표시되지 않는다.
**Why it happens:** PHASE_NUM이 잘못 resolve되었거나 ROADMAP.md에 해당 phase가 없을 때.
**How to avoid:** PHASE_SECTION이 비어 있으면 키워드 grep을 건너뛰고 조용히 Step 2로 진행. 별도 오류 처리 불필요 (Step 1에서 PHASE_NUM 검증이 이미 완료됨).
**Warning signs:** UI 키워드가 있는 phase에서 AskUserQuestion이 표시되지 않는 경우.

### Pitfall 3: Step 번호 삽입 시 success_criteria 불일치
**What goes wrong:** `<process>` 블록에 Step 1.5를 삽입했지만 `<success_criteria>` 블록을 업데이트하지 않으면 검증이 불가능해진다.
**Why it happens:** 두 섹션이 분리되어 있어 편집 시 누락하기 쉬움.
**How to avoid:** PLAN 태스크에 process + success_criteria 두 섹션 모두 편집을 명시한다.

### Pitfall 4: 조건부 분기에서 Step 2 진행 경로 누락
**What goes wrong:** AskUserQuestion "UI 없음" 분기에서 Step 2로 명시적으로 "fall through"하지 않으면, 구현자가 early exit을 추가할 수 있다.
**Why it happens:** 분기 후 "아무것도 안 하면 다음으로" 패턴이 Markdown process 문서에서 불명확하다.
**How to avoid:** "UI 없음" 분기에서 `[sg-plan] UI 설계 없이 진행합니다.` 출력 후 "Step 2로 계속"을 명시적으로 기술한다.

---

## Code Examples

### Step 1.5 전체 구조 (참조용 초안)

```markdown
1.5. **Visual Companion 판단 (D-01~D-06).** Phase goal에 UI 관련 키워드가 있을 때만 실행한다:
   ```bash
   PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
   UI_DETECTED=""
   if [ -n "$PHASE_SECTION" ] && echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
     UI_DETECTED="1"
   fi
   ```
   **UI 키워드가 없으면** 이 단계를 조용히 건너뛰고 Step 2로 이동한다.

   **UI 키워드가 있으면** AskUserQuestion을 표시한다:
   ```
   AskUserQuestion(
     questions: [{
       question: "이 phase에 UI 설계가 포함되어 있나요?",
       header: "Visual Companion",
       multiSelect: false,
       options: [
         { label: "Visual Companion 포함", description: "superpowers:brainstorming을 실행하여 UI를 먼저 설계합니다." },
         { label: "UI 없음", description: "UI 설계 없이 기존 흐름을 진행합니다." }
       ]
     }]
   )
   ```

   **"UI 없음" 선택 시:** `[sg-plan] UI 설계 없이 진행합니다.` 출력 후 Step 2로 이동한다.

   **"Visual Companion 포함" 선택 시:** brainstorming Agent를 실행하고 완료를 기다린다.
   **Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual values:**
   ```
   Agent(
     description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
     prompt="Your task is to run the superpowers brainstorming skill for Phase $PHASE_NUM UI design. The project root is the current working directory. Phase context:\n\n$PHASE_SECTION\n\nInvoke Skill(skill='superpowers:brainstorming', args='Phase $PHASE_NUM UI 설계를 진행합니다. 위 컨텍스트를 참고하십시오. 중요: brainstorming 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료하십시오.') and follow its instructions to completion.",
     subagent_type="general-purpose"
   )
   ```
   Agent가 에러로 종료되면: `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 Step 2로 이동한다 (중단 없음).
```

---

## State of the Art

이 phase는 신기술 도입 없음. 기존 패턴의 조합이다.

| 기존 패턴 | 이번 적용 | 출처 |
|-----------|-----------|------|
| AskUserQuestion 3-옵션 분기 | 2-옵션으로 동일 구조 적용 | sg-start.md Step 5 |
| Agent(subagent_type="general-purpose") | brainstorming wrapper로 동일 패턴 | sg-plan.md Step 2 |
| gsd-sdk query roadmap | 기존 gsd-execute.md의 roadmap grep 대신 공식 SDK 사용 | gsd-sdk 직접 확인 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | brainstorming Agent 프롬프트에서 writing-plans 억제가 Skill의 HARD-GATE를 재정의한다 | Pitfall 1 / Code Examples | 억제 안 될 경우 brainstorming 완료 후 writing-plans가 실행되어 sg-plan 흐름 중단 |
| A2 | `grep -iE` 가 macOS(BSD) grep에서 정상 동작한다 | Architecture Patterns Pattern 4 | BSD grep에서 `-E` 플래그는 정상 지원됨 — 낮은 위험 |
| A3 | PHASE_SECTION 변수에 줄바꿈 포함 시 Agent() prompt 조립에서 이스케이핑 문제가 없다 | Code Examples | 구현 시 실제 Markdown process 문서에서 변수 치환 방식에 따라 다름; 플래너가 명시해야 함 |

---

## Open Questions

1. **brainstorming 완료 후 writing-plans 억제 보장**
   - What we know: SKILL.md가 "The terminal state is invoking writing-plans"라고 명시. Agent 프롬프트로 억제 가능하다고 [ASSUMED].
   - What's unclear: Claude가 Skill 문서의 terminal action을 Agent 프롬프트로 얼마나 신뢰성 있게 재정의하는가.
   - Recommendation: 억제 지시를 Agent prompt의 첫 줄과 마지막 줄 양쪽에 넣어 강조도를 높인다. 검증 기준(success criteria)에 "brainstorming 완료 후 writing-plans가 호출되지 않음" 명시.

2. **PHASE_SECTION 변수 치환 방식**
   - What we know: sg-plan.md는 `$PHASE_NUM` 치환을 "Before calling Agent, replace every occurrence of `$PHASE_NUM` with the actual resolved value"로 명시한다.
   - What's unclear: `$PHASE_SECTION` (여러 줄, 특수문자 포함)을 Agent prompt에 주입할 때 어떤 형식이 안전한가.
   - Recommendation: 플래너가 "PHASE_SECTION을 Agent prompt 내에 직접 텍스트로 치환(triple-backtick 구분)"을 task action에 명시.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| gsd-sdk | PHASE_SECTION 읽기 | ✓ | mise 관리 node 24 환경 | grep ROADMAP.md 직접 파싱 (ASSUMED 방식, 오류 가능) |
| superpowers:brainstorming | VC-02 | ✓ | superpowers 5.1.0 캐시 확인 | — (Phase 20 핵심 기능, 대체 없음) |
| AskUserQuestion | VC-01 | ✓ | Claude Code runtime 내장 | — |
| Agent() | D-04 | ✓ | Claude Code runtime 내장 | — |

**Missing dependencies with no fallback:** 없음.

---

## Validation Architecture

> nyquist_validation: false (config.json 확인) — 이 섹션 스킵.

---

## Security Domain

> 이 phase는 파일 1개 수정 (commands/sg-plan.md). 외부 입력 처리, 인증, 암호화 없음. ASVS 적용 없음.

---

## Sources

### Primary (HIGH confidence)
- `commands/sg-plan.md` — 수정 대상 파일 전체 읽음. AskUserQuestion, Agent() 패턴 확인.
- `commands/sg-start.md:161-175` — AskUserQuestion 정확한 문법 확인.
- `~/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/SKILL.md` — brainstorming Skill 전체 확인. HARD-GATE 및 writing-plans terminal action 확인.
- `gsd-sdk query roadmap.get-phase 20` — 직접 실행, `--pick section` 동작 확인.

### Secondary (MEDIUM confidence)
- `commands/sg-learn.md` — Agent 패턴 참조
- `.planning/REQUIREMENTS.md` — VC-01, VC-02 정의 확인
- `.planning/phases/20-sg-plan-visual-companion/20-CONTEXT.md` — locked decisions 전체

---

## Metadata

**Confidence breakdown:**
- 삽입 위치 및 구조: HIGH — CONTEXT.md에 명확히 정의, 기존 코드에서 패턴 확인
- AskUserQuestion 문법: HIGH — sg-start.md 실사용 코드 직접 확인
- brainstorming writing-plans 억제: MEDIUM — Agent 프롬프트 재정의 가능성을 가정, 실행 전 검증 필요
- gsd-sdk roadmap 쿼리: HIGH — 직접 실행으로 동작 확인

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (안정적 도메인)
