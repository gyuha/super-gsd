---
name: sg-next
description: Use this when you want to advance to the next workflow stage automatically — reads HANDOFF.md and STATE.md to determine the current stage and immediately invokes the next sg-* command.
---

<objective>
Detect the current workflow stage from HANDOFF.md and STATE.md, determine the next sg-* command using the same routing table as sg-status, then immediately invoke it without asking for confirmation. Appends a HANDOFF.md row before invoking. For ambiguous states (complete or init), presents choices via AskUserQuestion instead of auto-invoking.
</objective>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Appends .planning/HANDOFF.md.
</execution_context>

<process>

**Step 1 — STATE.md Phase 파싱:**

```bash
# --- BEGIN STATE.md Phase parsing block (D-07: skills/sg-status/SKILL.md 복제 — drift 시 양쪽 동시 수정) ---
PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
[ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
# --- END STATE.md Phase parsing block ---
```

**Step 2 — HANDOFF.md stage 감지 + enum 매핑:**

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

**Step 3 — NEXT_PHASE 계산 + stage→next-command 라우팅:**

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

**Step 4 — HANDOFF.md append (D-04: invoke 전 기록):**

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

**Step 5 — complete/init 분기 (D-02, D-03):**

`STAGE_RAW`가 `complete`이면:

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

- "sg-new 실행" 선택 시: `Skill(skill="super-gsd:sg-new", args="")`
- "취소" 선택 시: `Cancelled. No changes made.` emit 후 종료

`STAGE_RAW`가 `init`이면 — PHASE_NUM이 있을 때:

```
AskUserQuestion(
  questions: [{
    question: "현재 단계를 감지할 수 없습니다 (init). 다음 단계를 선택하세요.",
    header: "sg-next",
    multiSelect: false,
    options: [
      { label: "sg-plan {PHASE_NUM} 실행", description: "/super-gsd:sg-plan {PHASE_NUM}을 호출합니다." },
      { label: "취소", description: "변경 없이 종료합니다." }
    ]
  }]
)
```

PHASE_NUM이 없을 때는 label=`"sg-plan 실행"`, description=`"/super-gsd:sg-plan 을 호출합니다."` 로 대체한다.

- "sg-plan" 선택 시: PHASE_NUM이 있으면 `Skill(skill="super-gsd:sg-plan", args="PHASE_NUM")`, 없으면 `Skill(skill="super-gsd:sg-plan", args="")`
- "취소" 선택 시: `Cancelled. No changes made.` emit 후 종료

**Step 6 — 1줄 출력 후 즉시 invoke (complete/init 이외 모든 stage):**

```bash
echo "→ $NEXT_CMD"
# Before calling Skill, substitute the actual resolved command name.
# Session control transfers to the skill; no steps execute after this point.
```

`NEXT_CMD` 기준 Skill() 매핑:

- `/super-gsd:sg-execute` → `Skill(skill="super-gsd:sg-execute", args="")`
- `/super-gsd:sg-review` → `Skill(skill="super-gsd:sg-review", args="")`
- `/super-gsd:sg-learn` → `Skill(skill="super-gsd:sg-learn", args="")`
- `/super-gsd:sg-ship` → `Skill(skill="super-gsd:sg-ship", args="")`
- `/super-gsd:sg-complete` → `Skill(skill="super-gsd:sg-complete", args="")`
- `/super-gsd:sg-plan N` → `Skill(skill="super-gsd:sg-plan", args="N")`
- `/super-gsd:sg-plan` (인자 없음) → `Skill(skill="super-gsd:sg-plan", args="")`

</process>

<success_criteria>
1. HANDOFF.md가 없거나 데이터 행이 0개이면 STAGE_RAW=init으로 처리한다 (NEXT-01).
2. stage→next-command 매핑이 sg-status와 동일한 11개 분기를 사용한다 (NEXT-02).
3. complete/init 이외 모든 stage에서 `→ /super-gsd:sg-[cmd]` 1줄을 출력한 뒤 즉시 Skill()로 invoke한다 — 확인 프롬프트 없음 (NEXT-03).
4. STAGE_RAW가 complete 또는 init이면 AskUserQuestion을 호출하고, 취소 선택 시 `Cancelled. No changes made.`를 emit 후 종료한다 (NEXT-04).
5. Skill() invoke 전에 HANDOFF.md에 `| TS | PHASE_SLUG | FROM_STAGE | sg-next | - |` 행이 append된다 (NEXT-05, D-04).
</success_criteria>
