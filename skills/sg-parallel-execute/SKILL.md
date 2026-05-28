---
name: sg-parallel-execute
description: Use this when parallel_groups.json exists and independent plan groups should run concurrently — dispatches up to 3 Task() agents, one per group, without calling superpowers:executing-plans.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Read the parallel_groups.json file path passed via $ARGUMENTS using the Read tool to identify the group list. Execute one wave at a time: for each wave (lowest wave number first), dispatch up to 3 groups from that wave as concurrent Task()s, wait for all to complete successfully, then advance to the next wave. Never dispatch groups from different waves in the same parallel batch — wave numbers are dependency barriers, not sort keys. Each Task() reads its group's PLAN.md directly and executes tasks without calling superpowers:executing-plans.
</objective>

<execution_context>
Self-contained. Reads $ARGUMENTS (parallel_groups.json path), then reads each group's PLAN.md files. Writes nothing to .planning/HANDOFF.md, .planning/STATE.md, or any GSD/Superpowers files. Parallel Task() agents are dispatched in the same response.
</execution_context>

<process>

**Step 1 — Input validation.**

If `$ARGUMENTS` is empty, print an error message and exit:

```
[sg-parallel-execute] Error: $ARGUMENTS must be the path to parallel_groups.json. Got empty.
```

```bash
GROUPS_JSON_FILE="$ARGUMENTS"
if [ -z "$GROUPS_JSON_FILE" ]; then
  echo "[sg-parallel-execute] Error: \$ARGUMENTS must be the path to parallel_groups.json. Got empty."
  exit 1
fi
```

**Step 1.5 — Phase 번호 → 파일 경로 변환 (선택적).**

`$ARGUMENTS`가 숫자 패턴(`^[0-9]+(\.[0-9]+)?$`)에 매칭되면 phase 번호로 해석하고, `parallel_groups.json` 파일 경로를 자동 탐색한다. 파일 경로가 직접 전달된 경우에는 이 스텝을 건너뛴다.

```bash
GROUPS_JSON_FILE="$ARGUMENTS"
if echo "$GROUPS_JSON_FILE" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
  # phase 번호를 2자리 zero-padding (소수점 있으면 정수 부분만)
  INT_PART=$(echo "$GROUPS_JSON_FILE" | cut -d. -f1)
  DEC_PART=$(echo "$GROUPS_JSON_FILE" | grep -oE '\.[0-9]+$' || true)
  PHASE_PAD=$(printf "%02d" "$INT_PART")${DEC_PART}
  FOUND=$(ls .planning/phases/${PHASE_PAD}-*/parallel_groups.json 2>/dev/null | head -2)
  FOUND_COUNT=$(echo "$FOUND" | grep -c . 2>/dev/null || echo 0)
  if [ -z "$FOUND" ] || [ "$FOUND_COUNT" -eq 0 ]; then
    echo "[sg-parallel-execute] Error: No parallel_groups.json found for phase ${PHASE_PAD} under .planning/phases/"
    exit 1
  fi
  if [ "$FOUND_COUNT" -gt 1 ]; then
    GROUPS_JSON_FILE=$(echo "$FOUND" | head -1)
    echo "[sg-parallel-execute] Warning: Multiple matches found for phase ${PHASE_PAD}; using $GROUPS_JSON_FILE"
  else
    GROUPS_JSON_FILE="$FOUND"
  fi
fi
```

**Step 1.6 — parallel_groups.json 자동 생성 (파일 없을 때).**

`$GROUPS_JSON_FILE` 경로에 파일이 존재하지 않으면 PHASE_DIR의 PLAN.md 파일들을 읽어 자동으로 생성한다.

```bash
if [ ! -f "$GROUPS_JSON_FILE" ]; then
  PHASE_DIR=$(dirname "$GROUPS_JSON_FILE")
  PLAN_FILES=$(ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null | sort)
  if [ -z "$PLAN_FILES" ]; then
    echo "[sg-parallel-execute] Error: No PLAN.md files found in $PHASE_DIR — cannot auto-generate parallel_groups.json"
    exit 1
  fi
  echo "[sg-parallel-execute] parallel_groups.json not found — auto-generating from PLAN.md files in $PHASE_DIR"
fi
```

파일이 없으면 각 PLAN.md를 Read tool로 읽어 frontmatter의 `wave:` 값을 추출한다 (없으면 기본값 1). wave 번호별로 플랜을 그룹화해 아래 형식의 JSON 배열을 구성한다:

```json
[
  {"wave": 1, "plans": ["NN-01-PLAN.md", "NN-02-PLAN.md"], "merged": false},
  {"wave": 2, "plans": ["NN-03-PLAN.md"], "merged": false}
]
```

구성된 JSON을 `$GROUPS_JSON_FILE` 경로에 Write tool로 저장한 뒤 아래 메시지를 출력한다:

```
[sg-parallel-execute] Auto-generated parallel_groups.json with <N> group(s) across <W> wave(s)
```

파일이 이미 존재하면 이 스텝 전체를 건너뛴다.

**Step 2 — Read parallel_groups.json.**

Read the file at the `$GROUPS_JSON_FILE` path using the Read tool. If the file does not exist or cannot be parsed as JSON, print an error message and exit. No automatic fallback (D-07):

```
[sg-parallel-execute] Error: Cannot read parallel_groups.json at <path>. Ensure sg-execute Step 8.5 ran successfully.
```

Parse the content read by the Read tool as a JSON array. Each parsed item has the shape `{"wave": N, "plans": ["NN-01-PLAN.md", ...], "merged": false}`.

**Step 3 — Compute GROUP_COUNT and determine execution groups.**

Length of parsed array = GROUP_COUNT.
If GROUP_COUNT is 0, print an error message and exit (D-07, no automatic fallback):
```
[sg-parallel-execute] Error: parallel_groups.json contains zero groups. Nothing to execute.
```

CURRENT_WAVE = lowest wave number among all groups.
WAVE_GROUPS = groups where wave == CURRENT_WAVE.
EXEC_COUNT = min(len(WAVE_GROUPS), 3).
OVERFLOW_GROUPS = WAVE_GROUPS[3:] if len(WAVE_GROUPS) > 3 else [].
REMAINING_WAVES = groups where wave > CURRENT_WAVE, sorted by wave ascending.

Output:
```
[sg-parallel-execute] GROUP_COUNT=N, CURRENT_WAVE=W, EXEC_COUNT=M
```

**Step 4 — Read PLAN.md for each parallel group.**

Determine PHASE_DIR from the directory portion of the `$ARGUMENTS` path (e.g. if `$ARGUMENTS` is `.planning/phases/18-sg-parallel-execute/parallel_groups.json`, then PHASE_DIR = `.planning/phases/18-sg-parallel-execute`).

Extract PHASE_NUM from the first number before `-` in the PHASE_DIR directory name:
```bash
PHASE_NUM=$(basename "$PHASE_DIR" | sed -E 's/^([0-9]+)-.*/\1/')
```
(e.g. `18-sg-parallel-execute` → `18`, `9-foo` → `9`, `100-bar` → `100`)

Iterate over the filenames in each group's `plans` array and read each PLAN.md body using the Read tool:
- PLAN.md path = `{PHASE_DIR}/{plan_filename}`

**Step 5 — Parallel Task() dispatch.**

Execute EXEC_COUNT Task()s in parallel within the same response (D-02, TE-02a). Prompt structure for each Task() (D-03):

```
Execute the following plan(s) for Phase {PHASE_NUM}.

CRITICAL constraints — do NOT violate these:
- Do NOT call superpowers:executing-plans (bare task execution only)
- Do NOT write to .planning/HANDOFF.md
- Do NOT update .planning/STATE.md
- Do NOT modify any GSD or Superpowers internal files (non-invasive rule)

Plans to execute:
=== {plan_filename} ===
{full PLAN.md body}

Execute all tasks in the plan(s) above. Follow each task's <action>, <verify>, and <done> fields. Report completion status for each task.
```

When a group contains multiple plan files, include them all in the same Task() prompt.

After the parallel batch completes: if any Task() reports failure, stop and surface the error — do not proceed. If OVERFLOW_GROUPS is non-empty, execute each group sequentially (one Task() at a time) before advancing to Step 6.

**Step 6 — Advance through remaining waves.**

After the parallel batch (Step 5) and any OVERFLOW_GROUPS complete successfully, process REMAINING_WAVES one wave at a time in ascending order. Do not start a wave until all Task()s from the previous wave have completed successfully. If any Task() reports failure, stop and surface the error instead of advancing.

For each subsequent wave:
1. CURRENT_WAVE = next wave number from REMAINING_WAVES.
2. WAVE_GROUPS = groups for this wave. EXEC_COUNT = min(len(WAVE_GROUPS), 3). OVERFLOW_GROUPS = WAVE_GROUPS[3:] if len(WAVE_GROUPS) > 3 else [].
3. Read PLAN.md for each group in WAVE_GROUPS using the Read tool (PLAN.md path = `{PHASE_DIR}/{plan_filename}`).
4. Dispatch EXEC_COUNT Task()s in parallel. Wait for all to complete before advancing.
5. If OVERFLOW_GROUPS is non-empty, execute each group sequentially (one Task() at a time) before advancing to the next wave.

```
[sg-parallel-execute] Wave {W}: dispatching {EXEC_COUNT} group(s) in parallel
```

</process>

<success_criteria>
1. When a valid parallel_groups.json path is passed via $ARGUMENTS, read the file with the Read tool and output GROUP_COUNT.
2. Groups are processed one wave at a time (lowest wave first). Groups from different waves are never dispatched in the same parallel batch.
3. Within each wave, up to 3 groups are dispatched as concurrent Task()s. No subsequent wave starts until all Task()s in the current wave complete successfully.
4. Each Task() prompt includes instructions prohibiting: calling superpowers:executing-plans, writing to HANDOFF.md, and updating STATE.md.
5. If $ARGUMENTS is empty or the file does not exist, print an error message and exit (no automatic fallback).
6. If any Task() reports failure, execution stops and the error is surfaced rather than advancing to the next wave.
</success_criteria>
