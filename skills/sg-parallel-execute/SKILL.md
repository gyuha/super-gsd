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
Read the parallel_groups.json file path passed via $ARGUMENTS using the Read tool to identify the group list. Compute GROUP_COUNT (array length) and execute min(GROUP_COUNT, 3) Task()s concurrently (in parallel). Each Task() reads its group's PLAN.md directly and executes tasks without calling superpowers:executing-plans. When GROUP_COUNT > 3, execute the first 3 groups in parallel (wave-ascending order) and process the remainder sequentially.
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

**Step 2 — Read parallel_groups.json.**

Read the file at the `$ARGUMENTS` path using the Read tool. If the file does not exist or cannot be parsed as JSON, print an error message and exit. No automatic fallback (D-07):

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

EXEC_COUNT = min(GROUP_COUNT, 3).
Sort in wave-ascending order and select the first EXEC_COUNT groups for parallel execution (D-02).
If GROUP_COUNT > 3, separate the remaining groups (after EXEC_COUNT) for sequential processing.

Output:
```
[sg-parallel-execute] GROUP_COUNT=N, EXEC_COUNT=M (wave-ascending order)
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

**Step 6 — Sequential processing when GROUP_COUNT > 3.**

After the parallel batch (Step 5) completes, process the remaining groups (after EXEC_COUNT) sequentially in wave-ascending order.

For each group, repeat the following (unlike the parallel batch in Step 5, execute strictly one at a time, waiting for completion before advancing):
1. Read the group's PLAN.md file using the Read tool, same as Step 4.
2. Invoke a single Task(). Do not execute the next Task() until the previous one completes.

```
[sg-parallel-execute] Sequential group {N}: executing {plan_filename}
```

</process>

<success_criteria>
1. When a valid parallel_groups.json path is passed via $ARGUMENTS, read the file with the Read tool and output GROUP_COUNT.
2. EXEC_COUNT Task()s are invoked in parallel within the same response.
3. Each Task() prompt includes instructions prohibiting: calling superpowers:executing-plans, writing to HANDOFF.md, and updating STATE.md.
4. If $ARGUMENTS is empty or the file does not exist, print an error message and exit (no automatic fallback).
5. When GROUP_COUNT > 3, execute the first 3 groups in parallel then process the remainder sequentially.
</success_criteria>
