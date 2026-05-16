# Phase 3: sg- Command Set & README — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 11
**Analogs found:** 9 / 11

## File Classification

| 신규/수정 파일 | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|----------------|---------------|
| `commands/sg-execute.md` | command | request-response | `commands/to-superpowers.md` | exact |
| `commands/sg-status.md` | command | request-response | `commands/status.md` | exact |
| `commands/sg-start.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `commands/sg-explore.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `commands/sg-plan.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `commands/sg-review.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `commands/sg-learn.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `commands/sg-ship.md` | command | request-response | `commands/to-superpowers.md` | role-match |
| `README.md` | documentation | — | `README.md` (현재 버전) | partial |
| `docs/COMMANDS.md` | documentation | — | (없음) | no-analog |
| `.planning/ROADMAP.md` | planning-doc | — | `.planning/ROADMAP.md` (현재) | exact |

---

## Pattern Assignments

### `commands/sg-execute.md` (command, request-response)

**Analog:** `commands/to-superpowers.md`
**처리:** frontmatter `name` 필드만 변경. 본문 로직(9단계 process) 전체 유지.

**Frontmatter 패턴** (lines 1-5):
```yaml
---
name: to-superpowers
description: Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke sg-executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---
```
변경 사항: `name: to-superpowers` → `name: sg-execute`. description과 argument-hint는 유지.

**XML 4-section 구조** (lines 7-129):
```
<objective>...</objective>
<execution_context>...</execution_context>
<process>
  1. Resolve phase.
  2. Locate phase directory.
  3. Extract phase meta.
  4. Map REQ-IDs to one-line definitions.
  5. Collect PLAN.md bodies.
  6. Compute Plan Hash.
  7. Idempotency check.
  8. Append HANDOFF.md row.
  9. Build prompt and invoke Skill.
</process>
<success_criteria>...</success_criteria>
```

**Skill invoke 패턴** (line 117):
```
Skill(skill="sg-executing-plans", args="<the prompt blob above>")
```

**최종 사용자 메시지 패턴** (line 121):
```
Handoff complete. HANDOFF.md updated; sg-executing-plans invoked. Use /super-gsd:status to inspect workflow state.
```
`/super-gsd:status` → `/super-gsd:sg-status`로 변경 필요.

---

### `commands/sg-status.md` (command, request-response)

**Analog:** `commands/status.md`
**처리:** frontmatter `name` 필드만 변경. 본문 로직(5단계 process) 전체 유지.

**Frontmatter 패턴** (lines 1-4):
```yaml
---
name: status
description: Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command.
---
```
변경 사항: `name: status` → `name: sg-status`.

**Stage → 다음 명령 매핑 패턴** (lines 52-65):
```bash
case "$STAGE" in
  init)        NEXT_CMD="/gsd:plan-phase $PHASE_NUM" ;;
  gsd-plan)    NEXT_CMD="/super-gsd:to-superpowers" ;;
  superpowers) NEXT_CMD="/hookify" ;;
  review)      NEXT_CMD="/hookify" ;;
  hookify)
    if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
      NEXT_CMD="/gsd:discuss-phase $NEXT_PHASE"
    else
      NEXT_CMD="/gsd:complete-milestone"
    fi
    ;;
esac
```
`/super-gsd:to-superpowers` → `/super-gsd:sg-execute`로 변경 필요 (내부 참조 업데이트).

**출력 포맷 패턴** (lines 67-74):
```
Phase: <PHASE_NUM> (<PHASE_NAME>)
Stage: <STAGE>
Last handoff: <LAST_TS>

Next: <NEXT_CMD>
```

---

### `commands/sg-start.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-start
description: Start a new project or milestone — invokes gsd-new-project to scaffold planning artifacts.
argument-hint: "[project-name] - optional. Passed through to gsd-new-project."
---
```

**XML 4-section 구조 적용:**
```xml
<objective>
Invoke the gsd-new-project Skill to scaffold a new project or milestone. Pass $ARGUMENTS as-is; gsd-new-project handles new vs. existing project detection internally.
</objective>

<execution_context>
Self-contained. Delegates all project detection and scaffolding to gsd-new-project Skill.
</execution_context>

<process>
1. Invoke Skill: Skill(skill="gsd-new-project", args="$ARGUMENTS")
2. Print: "Project initialized. Run /super-gsd:sg-explore to map the codebase, then /super-gsd:sg-plan to create a phase plan."
</process>

<success_criteria>
1. gsd-new-project Skill is invoked exactly once.
2. $ARGUMENTS is forwarded unchanged.
</success_criteria>
```

---

### `commands/sg-explore.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-explore
description: Explore and map the codebase — invokes gsd-explore Skill.
---
```

**XML 4-section 구조 적용:**
```xml
<objective>
Invoke the gsd-explore Skill to analyse and map the current codebase. No arguments required.
</objective>

<execution_context>
Self-contained. Delegates entirely to gsd-explore Skill.
</execution_context>

<process>
1. Invoke Skill: Skill(skill="gsd-explore", args="")
2. Print: "Exploration complete. Run /super-gsd:sg-plan <phase> to create a phase plan."
</process>

<success_criteria>
1. gsd-explore Skill is invoked exactly once.
</success_criteria>
```

---

### `commands/sg-plan.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (2단계 체인 구조는 신규; XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-plan
description: Gather context and create a phase plan — chains gsd-discuss-phase then gsd-plan-phase automatically.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---
```

**2단계 체인 process 패턴** (D-35에서 정의):
```xml
<process>
1. Resolve phase. (to-superpowers.md lines 16-24와 동일 패턴)
2. Print: "[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase..."
   Invoke Skill: Skill(skill="gsd-discuss-phase", args="$PHASE_NUM")
3. Print: "[sg-plan] Step 2/2: Creating plan via gsd-plan-phase..."
   Invoke Skill: Skill(skill="gsd-plan-phase", args="$PHASE_NUM")
4. Print: "Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers."
</process>
```

**Phase 해석 패턴** (`commands/to-superpowers.md` lines 16-24에서 직접 복사):
```bash
if [ -n "$ARGUMENTS" ]; then
  PHASE_NUM="$ARGUMENTS"
else
  PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
fi
```
오류 시 메시지: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-plan <phase>`

---

### `commands/sg-review.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-review
description: Request a code review via Superpowers — invokes superpowers:requesting-code-review Skill.
---
```

**Skill invoke 패턴** (to-superpowers.md line 117 구조 참조):
```
Skill(skill="superpowers:requesting-code-review", args="$ARGUMENTS")
```

---

### `commands/sg-learn.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-learn
description: Run a Hookify retrospective to extract patterns and generate hooks from this session.
---
```

**Skill invoke 패턴:**
```
Skill(skill="hookify:hookify", args="$ARGUMENTS")
```

---

### `commands/sg-ship.md` (command, request-response)

**Analog:** `commands/to-superpowers.md` (XML 4-section 구조 참조)

**Frontmatter 패턴:**
```yaml
---
name: sg-ship
description: Complete and ship the current milestone — invokes gsd-ship Skill.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---
```

**Skill invoke 패턴:**
```
Skill(skill="gsd-ship", args="$PHASE_NUM")
```

---

### `README.md` (documentation)

**Analog:** 현재 `README.md` (전면 교체; 구조 참조만)

**현재 README.md 구조** (lines 1-83):
- H1: 프로젝트명
- `## Workflow` — ASCII 박스 다이어그램 (3-box with arrows)
- `## What this is` — 문제 설명
- `## Prerequisites` — 의존성 목록
- `## Installation` — 2줄 설치 명령
- `## Verify install` — 4단계 체크리스트
- `## Roadmap` — 4-phase 목록
- `## 한국어 요약` — 한국어 설명
- `## License` — MIT

**새 README.md 추가 섹션 (D-38 기준):**
1. 기존 ASCII 다이어그램 → sg- 명령어 흐름으로 교체:
   ```
   sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
     (GSD)       (GSD)      (GSD)    (Superpowers)  (Superpowers) (Hookify)  (GSD)
   ```
2. Quick-reference table 추가 (`Command | What it does | When to use` 컬럼):
   - 8개 sg- 명령어 행
3. Roadmap 섹션: Phase 3/4 번호 변경 반영 (D-31)

---

### `docs/COMMANDS.md` (documentation)

**Analog:** 없음. `commands/to-superpowers.md`와 `commands/status.md`에서 명령 상세를 추출해 표 형식으로 재구성.

**D-39 테이블 컬럼:** `명령어 | 하는 일 | 매핑 도구 | 인자 | 예시`

**D-34 매핑 테이블 소스:**
```
sg-start    → gsd-new-project
sg-explore  → gsd-explore
sg-plan     → gsd-discuss-phase + gsd-plan-phase (2단계 체인)
sg-execute  → sg-executing-plans Skill
sg-review   → superpowers:requesting-code-review
sg-learn    → hookify:hookify
sg-ship     → gsd-ship
sg-status   → (HANDOFF.md + STATE.md 읽기)
```

---

## Shared Patterns

### XML 4-Section 명령 구조
**Source:** `commands/to-superpowers.md` lines 7-129, `commands/status.md` lines 6-81
**적용 대상:** 모든 8개 sg- 명령어 파일
```xml
<objective>
한 문단으로 명령의 목적 기술.
</objective>

<execution_context>
자체 완결(self-contained) 여부, 읽는 파일 목록.
</execution_context>

<process>
1. 번호 매긴 단계별 절차. Bash 코드 블록 포함 가능.
...
</process>

<success_criteria>
1. 검증 가능한 성공 조건 목록.
...
</success_criteria>
```

### Frontmatter 표준 세트
**Source:** `commands/to-superpowers.md` lines 1-5 (D-17 기준)
**적용 대상:** 모든 8개 sg- 명령어 파일
```yaml
---
name: sg-{name}
description: <한 줄, /help 노출용>
argument-hint: "[arg] - optional/required. <설명>"  # 인자 없으면 생략
---
```
- `allowed-tools` 미명시 (to-superpowers.md 패턴 동일)
- Plugin namespace `super-gsd` (`.claude-plugin/plugin.json`)와 결합 → `/super-gsd:sg-{name}` 형태로 자동 노출

### Phase 해석 패턴 (인자 → STATE.md 폴백)
**Source:** `commands/to-superpowers.md` lines 16-24
**적용 대상:** `sg-execute`, `sg-plan`, `sg-ship` (인자로 phase를 받는 명령어)
```bash
if [ -n "$ARGUMENTS" ]; then
  PHASE_NUM="$ARGUMENTS"
else
  PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
fi
```
오류 메시지 패턴: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-{name} <phase>`

### Skill Invoke 패턴
**Source:** `commands/to-superpowers.md` line 117
**적용 대상:** Skill을 위임하는 모든 sg- 명령어 (sg-start, sg-explore, sg-plan, sg-execute, sg-review, sg-learn, sg-ship)
```
Skill(skill="<skill-name>", args="<args>")
```

### 사용자 메시지 언어 규칙
**Source:** Phase 2 D-30 (02-CONTEXT.md line 130)
**적용 대상:** 모든 `commands/*.md` 본문
- 에러/상태/안내 메시지: **영문 유지** (OSS surface)
- `.planning/` 내부 산출물만 한국어

---

## No Analog Found

| 파일 | Role | Data Flow | 이유 |
|------|------|-----------|------|
| `docs/COMMANDS.md` | documentation | — | `docs/` 디렉토리 자체가 신규. 유사한 명령 레퍼런스 문서가 코드베이스에 없음. D-39 테이블 구조와 D-34 매핑 테이블을 소스로 작성. |

---

## Metadata

**Analog 검색 범위:** `/Users/gyuha/workspace/super-gsd/commands/`, `.planning/phases/02-*/`
**스캔 파일:** `commands/to-superpowers.md`, `commands/status.md`, `.claude-plugin/plugin.json`, `README.md`, `.planning/ROADMAP.md`, `.planning/phases/02-manual-handoff-status/02-CONTEXT.md`, `.planning/phases/03-sg-command-set-readme/03-CONTEXT.md`
**Pattern extraction date:** 2026-05-15
