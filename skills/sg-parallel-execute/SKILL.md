---
name: sg-parallel-execute
description: Reads parallel_groups.json and dispatches up to 3 parallel Task() agents — one per independent group — to execute PLAN.md tasks directly without calling superpowers:executing-plans.
---

<objective>
$ARGUMENTS로 전달된 parallel_groups.json 파일 경로를 Read tool로 읽어 그룹 목록을 파악한다. GROUP_COUNT(배열 길이)를 계산하고, min(GROUP_COUNT, 3)개의 Task()를 동시(병렬)로 실행한다. 각 Task()는 해당 그룹의 PLAN.md를 직접 읽어 태스크를 실행하며 superpowers:executing-plans를 호출하지 않는다. GROUP_COUNT > 3이면 wave 번호 오름차순 앞 3개 그룹을 병렬 실행한 뒤 나머지를 순차 처리한다.
</objective>

<execution_context>
Self-contained. Reads $ARGUMENTS (parallel_groups.json path), then reads each group's PLAN.md files. Writes nothing to .planning/HANDOFF.md, .planning/STATE.md, or any GSD/Superpowers files. Parallel Task() agents are dispatched in the same response.
</execution_context>

<process>

**Step 1 — 입력 검증.**

`$ARGUMENTS`가 비어 있으면 에러 메시지를 출력하고 종료한다:

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

**Step 2 — parallel_groups.json 읽기.**

Read tool로 `$ARGUMENTS` 경로의 파일을 읽는다. 파일이 없거나 JSON 파싱이 불가능한 경우 에러 메시지를 출력하고 종료한다. 자동 폴백 없음 (D-07):

```
[sg-parallel-execute] Error: Cannot read parallel_groups.json at <path>. Ensure sg-execute Step 8.5 ran successfully.
```

Read tool로 읽은 내용을 JSON 배열로 파싱한다. 파싱된 각 항목은 `{"wave": N, "plans": ["NN-01-PLAN.md", ...], "merged": false}` 형태이다.

**Step 3 — GROUP_COUNT 계산 및 실행 그룹 결정.**

파싱된 배열의 길이 = GROUP_COUNT.
GROUP_COUNT가 0이면 에러 메시지를 출력하고 종료한다 (D-07, 자동 폴백 없음):
```
[sg-parallel-execute] Error: parallel_groups.json contains zero groups. Nothing to execute.
```

EXEC_COUNT = min(GROUP_COUNT, 3).
wave 번호 오름차순으로 정렬한 뒤 앞 EXEC_COUNT개를 병렬 실행 대상으로 선택 (D-02).
GROUP_COUNT > 3이면 나머지 (EXEC_COUNT 이후) 그룹은 순차 처리 대상으로 분리한다.

출력:
```
[sg-parallel-execute] GROUP_COUNT=N, EXEC_COUNT=M (wave-ascending order)
```

**Step 4 — 각 병렬 그룹의 PLAN.md 읽기.**

PHASE_DIR는 `$ARGUMENTS` 경로의 디렉토리 부분으로 결정한다 (예: `$ARGUMENTS`가 `.planning/phases/18-sg-parallel-execute/parallel_groups.json`이면 PHASE_DIR = `.planning/phases/18-sg-parallel-execute`).

PHASE_NUM은 PHASE_DIR의 디렉토리명에서 첫 번째 `-` 이전의 숫자를 추출한다:
```bash
PHASE_NUM=$(basename "$PHASE_DIR" | sed -E 's/^([0-9]+)-.*/\1/')
```
(예: `18-sg-parallel-execute` → `18`, `9-foo` → `9`, `100-bar` → `100`)

각 그룹의 `plans` 배열 내 파일명을 순회하여 Read tool로 해당 PLAN.md 본문을 읽는다:
- PLAN.md 경로 = `{PHASE_DIR}/{plan_filename}`

**Step 5 — 병렬 Task() 디스패치.**

EXEC_COUNT개의 Task()를 동일 응답 내에서 병렬로 실행한다 (D-02, TE-02a). 각 Task()의 프롬프트 구조 (D-03):

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

한 그룹에 여러 plan 파일이 있는 경우 동일 Task() 프롬프트 안에 모두 포함한다.

**Step 6 — GROUP_COUNT > 3일 경우 순차 처리.**

병렬 배치(Step 5)가 완료된 후, 나머지 그룹(EXEC_COUNT 이후)을 wave 오름차순으로 순차 처리한다.

각 그룹에 대해 다음을 반복한다 (Step 5의 병렬 배치와 달리, 반드시 1개씩 순서대로 실행하고 완료를 기다린 후 다음으로 진행한다):
1. Step 4와 동일하게 해당 그룹의 PLAN.md 파일을 Read tool로 읽는다.
2. 단일 Task()를 호출한다. 이전 Task()가 완료될 때까지 다음 Task()를 실행하지 않는다.

```
[sg-parallel-execute] Sequential group {N}: executing {plan_filename}
```

</process>

<success_criteria>
1. $ARGUMENTS로 유효한 parallel_groups.json 경로가 전달되면 Read tool로 파일을 읽고 GROUP_COUNT를 출력한다.
2. EXEC_COUNT개의 Task()가 동일 응답 내에서 병렬로 호출된다.
3. 각 Task() 프롬프트에 superpowers:executing-plans 호출 금지, HANDOFF.md 쓰기 금지, STATE.md 업데이트 금지 지시가 포함된다.
4. $ARGUMENTS가 빈 문자열이거나 파일이 없으면 오류 메시지를 출력하고 종료한다 (자동 폴백 없음).
5. GROUP_COUNT > 3이면 앞 3개 그룹 병렬 실행 후 나머지를 순차 처리한다.
</success_criteria>
