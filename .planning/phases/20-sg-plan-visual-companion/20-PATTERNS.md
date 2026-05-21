# Phase 20: sg-plan Visual Companion 통합 - Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 1 (commands/sg-plan.md 수정)
**Analogs found:** 1 / 1

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `commands/sg-plan.md` | command (orchestrator) | request-response + conditional branch | `commands/sg-start.md` (AskUserQuestion 패턴), `commands/sg-plan.md` Step 2 (Agent 패턴) | exact (자기 자신 포함) |

---

## Pattern Assignments

### `commands/sg-plan.md` — Step 1.5 삽입 (Visual Companion 분기)

**Analog 1:** `commands/sg-start.md` — AskUserQuestion 2-옵션 이상 분기 패턴
**Analog 2:** `commands/sg-plan.md` Step 2 — Agent(subagent_type="general-purpose") 패턴
**Analog 3:** `commands/sg-execute.md` Step 1 — phase resolve 후 조건부 분기 패턴

---

#### 패턴 1: AskUserQuestion 문법

**출처:** `commands/sg-start.md` lines 161–175

```markdown
AskUserQuestion(
  questions: [{
    question: "Existing session detected. What do you want to do?",
    header: "Session",
    multiSelect: false,
    options: [
      { label: "Resume", description: "Show next command and exit. You will run the next command yourself." },
      { label: "Start new milestone", description: "Delegate to gsd-new-milestone Skill." },
      { label: "Cancel", description: "Exit without changes." }
    ]
  }]
)
```

**Phase 20 적용 형태** (2-옵션, header="Visual Companion"):
```markdown
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

**적용 파일:** `commands/sg-plan.md` Step 1.5 — UI 키워드 감지 후 AskUserQuestion 호출 블록

---

#### 패턴 2: Agent(subagent_type="general-purpose") — Skill 래핑 호출

**출처:** `commands/sg-plan.md` lines 54–61 (Step 2 기존 gsd-discuss-phase Agent 블록)

```markdown
Agent(
  description="gsd-discuss-phase for Phase $PHASE_NUM",  # replace $PHASE_NUM
  prompt="Your task is to run the GSD discuss-phase workflow for phase $PHASE_NUM. The project root is the current working directory; planning artifacts are under .planning/ relative to it. The exact skill name is 'gsd-discuss-phase' (no namespace prefix). Invoke Skill(skill='gsd-discuss-phase', args='$PHASE_NUM') and follow all its instructions to completion.",  # replace $PHASE_NUM twice
  subagent_type="general-purpose"
)
```

**주의사항 (sg-plan.md 원문 line 54):**
> Before calling Agent, replace every occurrence of `$PHASE_NUM` in the block below with the actual resolved value

**Phase 20 적용 형태** (brainstorming Skill 래핑):
```markdown
**Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual values:**
Agent(
  description="superpowers:brainstorming for Phase $PHASE_NUM UI design",
  prompt="Your task is to run the superpowers brainstorming skill for Phase $PHASE_NUM UI design. The project root is the current working directory. Phase context:\n\n$PHASE_SECTION\n\nDo NOT invoke writing-plans Skill after brainstorming completes. Invoke Skill(skill='superpowers:brainstorming', args='Phase $PHASE_NUM UI 설계를 진행합니다. 위 컨텍스트를 참고하십시오. 중요: brainstorming 완료 후 writing-plans Skill을 호출하지 마십시오. brainstorming 대화만 진행하고 종료하십시오.') and follow its instructions to completion. Do NOT invoke writing-plans after brainstorming finishes.",
  subagent_type="general-purpose"
)
```

**적용 파일:** `commands/sg-plan.md` Step 1.5 — "Visual Companion 포함" 선택 분기

---

#### 패턴 3: Agent 에러 처리 — abort vs warn-and-continue

**출처:** `commands/sg-plan.md` lines 62 (Step 2 에러 처리)

```markdown
Wait for the agent to complete before proceeding. If the agent exits with an error, print: `[sg-plan] gsd-discuss-phase failed. Aborting.` and stop execution. Do not proceed to Step 3.
```

**Phase 20 적용 형태** (D-05: brainstorming 에러는 abort가 아니라 warn-and-continue):
```markdown
Agent가 에러로 종료되면: `[sg-plan] brainstorming 실패, 기존 흐름으로 계속...` 출력 후 Step 2로 이동한다 (중단 없음).
```

**핵심 차이:** 기존 Step 2(gsd-discuss-phase) 에러 → abort. Step 1.5(brainstorming) 에러 → warn-and-continue. 두 에러 처리를 혼동하면 안 된다.

---

#### 패턴 4: gsd-sdk roadmap 쿼리 + 키워드 grep

**출처:** `commands/sg-execute.md` lines 62–78 (ROADMAP.md grep 패턴 — 공식 SDK 대신 직접 grep 사용한 구버전 예시)

**Phase 20 적용 형태** (gsd-sdk 공식 SDK 사용 — RESEARCH.md Pattern 3, 4):
```bash
PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section 2>/dev/null)
UI_DETECTED=""
if [ -n "$PHASE_SECTION" ] && echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1; then
  UI_DETECTED="1"
fi
```

**macOS 호환성 주의 (CLAUDE.md):** `grep -P` 대신 `grep -iE` 사용. `-q` 플래그 대신 `> /dev/null 2>&1` 사용 권장.

---

#### 패턴 5: 진행 메시지 형식

**출처:** `commands/sg-plan.md` lines 52, 82

```markdown
2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
```

**Phase 20 적용 형태** — 기존 Step 번호를 변경하지 않고 Step 1.5로 삽입:
```markdown
[sg-plan] UI 설계 없이 진행합니다.       # "UI 없음" 선택 시
[sg-plan] brainstorming 실패, 기존 흐름으로 계속...  # brainstorming Agent 에러 시
```

**주의:** `[sg-plan] Step 1/2:` 등 기존 Step 번호 메시지는 건드리지 않는다.

---

#### 패턴 6: success_criteria 블록 구조

**출처:** `commands/sg-plan.md` lines 90–98

```markdown
<success_criteria>
0. .planning/lessons/ 에 파일이 있으면 Step 0이 weighted top-N을 먼저 표시하고...
1. PHASE_NUM이 비어 있으면 명시적 오류 메시지를 출력하고 종료한다.
2. gsd-discuss-phase는 Agent()로 서브에이전트에서 실행되고, 완료 후 제어가 반환된다.
3. gsd-discuss-phase Agent가 에러로 종료되면 오류 메시지를 출력하고 Step 3(gsd-plan-phase)을 실행하지 않는다.
4. gsd-plan-phase Skill 호출 직전에 HANDOFF.md에 To=gsd-plan 행이 기록된다...
5. gsd-plan-phase Skill is invoked exactly once with the resolved phase number as the terminal action.
6. Progress messages "[sg-plan] Step 1/2:" and "[sg-plan] Step 2/2:" are printed before each respective invocation.
</success_criteria>
```

**Phase 20 적용:** `<success_criteria>` 블록에 Step 1.5 검증 항목을 추가해야 한다 (RESEARCH.md Pitfall 3). 기존 번호 0~6을 유지하면서 1.5 항목 삽입.

---

## Shared Patterns

### 진행 상태 메시지 접두어

**출처:** `commands/sg-plan.md` lines 52, 62, 82
**적용:** Step 1.5의 모든 출력 메시지

모든 진행 메시지는 `[sg-plan]` 접두어를 사용한다:
```
[sg-plan] UI 설계 없이 진행합니다.
[sg-plan] brainstorming 실패, 기존 흐름으로 계속...
[sg-plan] gsd-discuss-phase failed. Aborting.   ← 기존 (변경 없음)
[sg-plan] Step 1/2: ...                          ← 기존 (변경 없음)
[sg-plan] Step 2/2: ...                          ← 기존 (변경 없음)
```

### Agent 호출 전 변수 치환 명시

**출처:** `commands/sg-plan.md` line 54
**적용:** Step 1.5의 brainstorming Agent 블록

```markdown
**Before calling Agent, replace every occurrence of `$PHASE_NUM` and `$PHASE_SECTION` with actual values:**
```

`$PHASE_SECTION`은 여러 줄 텍스트를 포함하므로, 실제 값으로 치환할 때 `\n`으로 줄바꿈을 이스케이핑하거나 Agent prompt 내에서 literal 텍스트로 삽입한다.

### macOS grep 이식성

**출처:** `CLAUDE.md` — macOS 셸 이식성 섹션
**적용:** `PHASE_SECTION` 키워드 감지 bash 블록

```bash
# 올바른 패턴
echo "$PHASE_SECTION" | grep -iE "UI|화면|design|Visual|frontend|interface|component" > /dev/null 2>&1

# 금지 패턴
grep -q       # BSD grep -q 호환성 불확실 (프로젝트 규칙)
grep -P       # macOS에 없음
```

---

## No Analog Found

해당 없음. 이 phase에서 사용하는 세 가지 메커니즘(AskUserQuestion, Agent(), gsd-sdk query)은 모두 이미 codebase에서 사용 중이다.

---

## Metadata

**Analog search scope:** `commands/` 디렉토리 전체
**Files scanned:** 4 (sg-plan.md, sg-start.md, sg-learn.md, sg-execute.md)
**Pattern extraction date:** 2026-05-22
