# Phase 26: sg-next Auto-Advance - Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 2 (1 new, 1 append-only)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `skills/sg-next/SKILL.md` | skill (router) | request-response | `skills/sg-status/SKILL.md` | exact (same HANDOFF+STATE parsing, same routing table) |
| `.planning/HANDOFF.md` | audit log | append-only | `skills/sg-review/SKILL.md` step 3.9, `skills/sg-ship/SKILL.md` step 1.5 | exact (same 5-column append pattern) |

---

## Pattern Assignments

### `skills/sg-next/SKILL.md` (skill, request-response)

**Primary analog:** `skills/sg-status/SKILL.md`
**Secondary analog (D-07 inline-replication precedent):** `skills/sg-start/SKILL.md`

---

#### YAML frontmatter pattern

**Source:** All recent SKILL.md files (sg-review, sg-ship, sg-execute, sg-start)
**Rule:** `"Use this when [상황] — [동작]."` 단일 줄 description (25-CONTEXT.md D-03, D-04)

```yaml
---
name: sg-next
description: Use this when you want to advance to the next workflow stage automatically — reads HANDOFF.md and STATE.md to determine the current stage and immediately invokes the next sg-* command.
---
```

---

#### `<objective>` / `<execution_context>` block pattern

**Source:** `skills/sg-status/SKILL.md` lines 6-12

```markdown
<objective>
[1-2 문장: 이 스킬이 하는 일의 핵심 동작]
</objective>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md[, .planning/ROADMAP.md]. [Writes/Appends] .planning/HANDOFF.md.
</execution_context>
```

---

#### STATE.md Phase 파싱 블록 (D-07 inline-replication — 글자 그대로 복제)

**Source:** `skills/sg-status/SKILL.md` lines 17-21 (= `skills/sg-start/SKILL.md` lines 20-24)
**D-05 결정:** 복제 블록 상단에 "skills/sg-status/SKILL.md 복제" 주석 필수

```bash
# --- BEGIN STATE.md Phase parsing block (D-07: skills/sg-status/SKILL.md 복제 — drift 시 양쪽 동시 수정) ---
PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
[ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
# --- END STATE.md Phase parsing block ---
```

---

#### HANDOFF.md 파싱 블록 (D-07 inline-replication — 글자 그대로 복제)

**Source:** `skills/sg-status/SKILL.md` lines 26-52
**D-05 결정:** 동일 패턴을 복제. sg-start의 lines 63-90도 동일 블록.

```bash
# --- BEGIN HANDOFF.md stage detection block (D-07: skills/sg-status/SKILL.md 복제 — drift 시 양쪽 동시 수정) ---
LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
if [ -z "$LAST_ROW" ]; then
  STAGE_RAW="init"
  TS=""
else
  STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
  TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
  case "$STAGE_RAW" in
    gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|hookify|ship|complete) ;;
    *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
  esac
fi

# Storage → Display enum mapping (D-01, D-02)
case "$STAGE_RAW" in
  init)         STAGE_DISPLAY="init" ;;
  gsd-plan)     STAGE_DISPLAY="gsd" ;;
  ui-plan)      STAGE_DISPLAY="gsd" ;;
  superpowers)  STAGE_DISPLAY="superpowers" ;;
  parallel)     STAGE_DISPLAY="superpowers" ;;
  execute)      STAGE_DISPLAY="superpowers" ;;
  review)       STAGE_DISPLAY="superpowers" ;;
  sg-retro)     STAGE_DISPLAY="hookify" ;;
  hookify)      STAGE_DISPLAY="hookify" ;;
  ship)         STAGE_DISPLAY="ship" ;;
  complete)     STAGE_DISPLAY="complete" ;;
esac
# --- END HANDOFF.md stage detection block ---
```

---

#### NEXT_PHASE 계산 + stage→next-command case 블록 (D-07 inline-replication — 글자 그대로 복제)

**Source:** `skills/sg-status/SKILL.md` lines 62-107 (= `skills/sg-start/SKILL.md` lines 110-150)

```bash
# --- BEGIN next-command routing block (D-07: skills/sg-status/SKILL.md 복제 — drift 시 양쪽 동시 수정) ---
if [ "$STAGE_RAW" = "hookify" ] || [ "$STAGE_RAW" = "ship" ]; then
  if echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
    NEXT_PHASE=$((PHASE_NUM + 1))
    if grep -qE "^### Phase ${NEXT_PHASE}:" .planning/ROADMAP.md 2>/dev/null; then
      NEXT_PHASE_EXISTS=1
    else
      NEXT_PHASE_EXISTS=0
    fi
  else
    NEXT_PHASE_EXISTS=0
  fi
fi

case "$STAGE_RAW" in
  init)
    if [ -n "$PHASE_NUM" ]; then
      NEXT_CMD="/super-gsd:sg-plan $PHASE_NUM"
    else
      NEXT_CMD="/super-gsd:sg-plan"
    fi
    ;;
  gsd-plan)    NEXT_CMD="/super-gsd:sg-execute" ;;
  ui-plan)     NEXT_CMD="/super-gsd:sg-execute" ;;
  superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
  parallel)    NEXT_CMD="/super-gsd:sg-review" ;;
  execute)     NEXT_CMD="/super-gsd:sg-review" ;;
  review)      NEXT_CMD="/super-gsd:sg-learn" ;;
  sg-retro)    NEXT_CMD="/super-gsd:sg-ship" ;;
  hookify)     NEXT_CMD="/super-gsd:sg-ship" ;;
  ship)
    if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
      NEXT_CMD="/super-gsd:sg-plan $NEXT_PHASE"
    else
      NEXT_CMD="/super-gsd:sg-complete"
    fi
    ;;
  complete) NEXT_CMD="/super-gsd:sg-new" ;;
  *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
esac
# --- END next-command routing block ---
```

---

#### HANDOFF.md append 패턴

**Source:** `skills/sg-ship/SKILL.md` lines 30-41, `skills/sg-review/SKILL.md` lines 64-78
**D-04 결정:** Skill() invoke **전**에 기록. Plan Hash 컬럼은 `-` (sg-next는 plan 실행 아님)

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
FROM_STAGE=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
[ -z "$FROM_STAGE" ] && FROM_STAGE="init"
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | sg-next | - |" >> "$HANDOFF_FILE"
```

> 주의: `To` 컬럼 값은 `sg-next` (고정). CONTEXT.md specifics 참조.

---

#### 1줄 출력 후 Skill() invoke 패턴

**Source:** `skills/sg-review/SKILL.md` lines 81-94, `skills/sg-ship/SKILL.md` lines 44-48

```bash
# 1줄 출력 (CONTEXT.md specifics 형식)
echo "→ $NEXT_CMD"

# 즉시 invoke — 확인 프롬프트 없음
# NEXT_CMD 예: "/super-gsd:sg-execute"
# Skill 이름: NEXT_CMD의 "/super-gsd:" 프리픽스를 제거한 값
Skill(skill="super-gsd:sg-[cmd]", args="")
```

---

#### AskUserQuestion 패턴 (complete/init 분기)

**Source:** `skills/sg-start/SKILL.md` lines 165-179
**D-02 결정:** `complete`와 `init` 모두 동일 AskUserQuestion 구조
**D-03 결정:** 실행 가능한 다음 명령 자체를 선택지로 구성

`complete` 상태 예시:
```
AskUserQuestion(
  questions: [{
    question: "현재 Phase가 완료 상태입니다. 다음 단계를 선택하세요.",
    header: "sg-next",
    multiSelect: false,
    options: [
      { label: "sg-new 실행 (새 마일스톤 시작)", description: "gsd-new-milestone Skill을 호출합니다." },
      { label: "취소", description: "변경 없이 종료합니다." }
    ]
  }]
)
```

`init` 상태 (PHASE_NUM 있음) 예시:
```
AskUserQuestion(
  questions: [{
    question: "현재 단계를 감지할 수 없습니다 (init). 다음 단계를 선택하세요.",
    header: "sg-next",
    multiSelect: false,
    options: [
      { label: "sg-plan [N] 실행", description: "/super-gsd:sg-plan $PHASE_NUM 을 호출합니다." },
      { label: "취소", description: "변경 없이 종료합니다." }
    ]
  }]
)
```

**AskUserQuestion 규칙:**
- `header` 값: `"sg-next"` (12자 이하 — CONTEXT.md code_context 참조)
- `multiSelect: false`
- "취소" 선택 시: 단일 라인 `Cancelled. No changes made.` emit 후 종료 (sg-start Cancel 분기와 동일)

---

### `.planning/HANDOFF.md` (audit log, append-only)

HANDOFF.md 자체는 수정이 아닌 append만 발생하므로 별도 패턴 섹션은 위 "HANDOFF.md append 패턴" 항목으로 충분하다.

**스키마 확인** (`.planning/HANDOFF.md` lines 20-21):
```
| Timestamp | Phase | From | To | Plan Hash |
| --------- | ----- | ---- | -- | --------- |
```

sg-next 행 형식 (CONTEXT.md specifics):
```
| 2026-05-23T00:00:00Z | 26-sg-next | [STAGE_RAW] | sg-next | - |
```

---

## Shared Patterns

### HANDOFF.md 자동 초기화
**Source:** `skills/sg-execute/SKILL.md` lines 123-129, `skills/sg-review/SKILL.md` lines 65-70, `skills/sg-ship/SKILL.md` lines 31-35
**Apply to:** sg-next HANDOFF append 블록 전
```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
```

### macOS 이식성 규칙
**Source:** `CLAUDE.md` Conventions 섹션
**Apply to:** 모든 bash 블록
- `grep -P` 금지 → `-E` 사용
- `awk -F'|'` 사용 (파이프 구분 마크다운 테이블 파싱)
- STATE.md Phase 파싱: `grep -E '^Phase:' | sed -E | awk '{print $1}'` 파이프라인

### Skill() invoke 직전 출력 패턴
**Source:** `skills/sg-ship/SKILL.md` step 2 주석, `skills/sg-review/SKILL.md` step 4 주석
**Apply to:** sg-next의 모든 Skill() 호출 직전
```
# Before calling Skill, substitute the actual resolved command name.
# Session control transfers to the skill; no steps execute after this point.
```

---

## No Analog Found

없음 — 모든 파일에 대해 직접 복제 가능한 analog가 존재한다.

---

## Metadata

**Analog search scope:** `skills/sg-status/`, `skills/sg-start/`, `skills/sg-execute/`, `skills/sg-review/`, `skills/sg-ship/`, `skills/sg-new/`, `skills/sg-plan/`, `.planning/HANDOFF.md`
**Files scanned:** 8
**Pattern extraction date:** 2026-05-23
