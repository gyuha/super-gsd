---
name: sg-quick
description: Use this when a small ad-hoc task needs to be done without a full phase plan — runs gsd-planner then superpowers:executing-plans with atomic commits and STATE.md tracking.
argument-hint: "<task description> [--discuss] [--research] [--validate] [--full]"
---

<objective>
Execute a small, ad-hoc task using a gsd-planner → Superpowers automatic execution pipeline. Unlike the simple Skill delegation of previous versions, this command runs the full pipeline:

1. Parse flags from $ARGUMENTS
2. Initialize a quick task via gsd-sdk (quick_id, slug, task_dir)
3. Spawn a gsd-planner Agent to write PLAN.md into task_dir
4. Hand off the PLAN.md content to superpowers:executing-plans for implementation
5. Update STATE.md Quick Tasks Completed and commit artifacts

Flags:
- (no flags) — Plan + execute immediately. Use when you know exactly what to do.
- --discuss — Lightweight discussion phase to clarify gray areas before planning.
- --research — Spawn a research agent to investigate approaches before planning.
- --validate — Enable plan-checking and post-execution verification.
- --full — All of the above.
</objective>

<execution_context>
Self-contained. Combines gsd-sdk initialization, gsd-planner Agent, and superpowers:executing-plans Skill directly — no external workflow files imported.
</execution_context>

<process>
1. **Parse arguments.** Extract DESCRIPTION and flags from `$ARGUMENTS`:
   ```bash
   ARGS="$ARGUMENTS"
   DISCUSS_FLAG=""
   RESEARCH_FLAG=""
   VALIDATE_FLAG=""
   FULL_FLAG=""
   IFS=' ' read -ra ARGS_ARRAY <<< "$ARGS"
   for arg in "${ARGS_ARRAY[@]}"; do
     case "$arg" in
       --discuss)  DISCUSS_FLAG="--discuss" ;;
       --research) RESEARCH_FLAG="--research" ;;
       --validate) VALIDATE_FLAG="--validate" ;;
       --full)     FULL_FLAG="--full" ;;
     esac
   done
   # Strip flags — remaining text is the task description
   DESCRIPTION=$(node -e "
     const a = process.env.ARGUMENTS || '';
     process.stdout.write(a.replace(/--discuss|--research|--validate|--full/g,'').trim());
   " 2>/dev/null)
   ```
   If DESCRIPTION is empty, print exactly:
   `Usage: /super-gsd:sg-quick <task description> [--discuss] [--research] [--validate] [--full]`
   and exit.

   If any flag is set, delegate to the full gsd-quick Skill — session control transfers to the skill; no further steps execute:
   ```
   if [ -n "$DISCUSS_FLAG" ] || [ -n "$RESEARCH_FLAG" ] || [ -n "$VALIDATE_FLAG" ] || [ -n "$FULL_FLAG" ]; then
     Skill(skill="gsd-quick", args="$ARGUMENTS")
   fi
   ```

2. **Initialize quick task.** Obtain quick_id, slug, and task_dir from gsd-sdk:
   ```bash
   INIT_JSON=$(gsd-sdk query init.quick "$DESCRIPTION")
   QUICK_ID=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.quick_id||j.id||"")}catch(e){}})')
   TASK_DIR=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.task_dir||j.dir||"")}catch(e){}})')
   ```
   If QUICK_ID or TASK_DIR is empty, print exactly:
   `gsd-sdk init.quick failed — check gsd-sdk installation`
   and exit.

3. **Create task directory.**
   ```bash
   mkdir -p "$TASK_DIR"
   ```

4. **Spawn gsd-planner Agent.** Use `Agent()` to spawn a planning agent that writes PLAN.md into task_dir:
   ```
   Agent(
     description="You are a GSD quick planner. Write a PLAN.md for the following quick task.

   Task description: <DESCRIPTION>
   Flags: <list any of --discuss --research --validate --full that are set; omit line if none>
   Output path: <TASK_DIR>/<QUICK_ID>-PLAN.md

   Create a single focused PLAN.md with 1-2 tasks. Target ~30% context usage. Follow the GSD PLAN.md format (frontmatter + objective + tasks with action/verify/done + success_criteria). Write the file to the exact output path above.",
     subagent_type="gsd-planner"
   )
   ```
   Substitute `<DESCRIPTION>`, `<TASK_DIR>`, and `<QUICK_ID>` with actual variable values before invoking the Agent.
   Wait for the agent to complete before proceeding.

5. **Read PLAN.md.** Load the file the agent created:
   ```bash
   PLAN_PATH="$TASK_DIR/${QUICK_ID}-PLAN.md"
   PLAN_CONTENT=$(cat "$PLAN_PATH" 2>/dev/null)
   ```
   If PLAN_CONTENT is empty, print exactly:
   `Planner agent did not create PLAN.md at $PLAN_PATH`
   and exit.

6. **Build Superpowers handoff prompt.** Assemble the prompt by substituting actual variable values and store it in `HANDOFF_PROMPT`:
   ```
   HANDOFF_PROMPT="# Quick Task Execution Handoff — $QUICK_ID

   ## Goal
   $DESCRIPTION

   ## Plan

   $PLAN_CONTENT

   ## Instruction to Superpowers
   Execute the plan above using the superpowers:executing-plans skill. Treat the PLAN.md as the authoritative source of tasks and acceptance criteria. Complete all tasks and verify success criteria before finishing."
   ```
   Display `$HANDOFF_PROMPT` to the user.

7. **Update STATE.md Quick Tasks Completed.** Append a new row after the last existing row in the `### Quick Tasks Completed` table:
   ```bash
   DIR_NAME=$(basename "$TASK_DIR")
   SAFE_DESCRIPTION=$(echo "$DESCRIPTION" | tr -d '\n' | tr '|\&' '---')
   NEW_ROW="| $QUICK_ID | $SAFE_DESCRIPTION | $(date +%Y-%m-%d) | (pending) | [$DIR_NAME](./quick/$DIR_NAME/) |"
   Read .planning/STATE.md.
   Find the ### Quick Tasks Completed table section.
   Append NEW_ROW after the last existing table row in that section (insert after the last line starting with "|" within the section).
   Write the updated content back using the Edit tool.
   If the section is not found, print exactly: `ERROR: ### Quick Tasks Completed section not found in STATE.md` and exit.
   ```

8. **Commit PLAN.md and STATE.md together.**
   ```bash
   # Commit PLAN.md and STATE.md (with (pending) SHA) before handing off to Superpowers.
   # STATE.md keeps (pending) because implementation happens inside Superpowers — the real
   # implementation commit SHA is not yet known. Superpowers is responsible for the final commit.
   git add "$PLAN_PATH" .planning/STATE.md
   git commit -m "quick($QUICK_ID): $DESCRIPTION" || { echo "git commit failed"; exit 1; }
   ```

9. **Invoke Superpowers.** Before invoking, verify `HANDOFF_PROMPT` is non-empty (it must contain the full plan assembled in step 6). If it is empty, print exactly:
   `HANDOFF_PROMPT assembly failed — PLAN_CONTENT may have been empty`
   and exit.

   Otherwise invoke in the same turn — no confirmation prompt. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="superpowers:executing-plans", args="$HANDOFF_PROMPT")
   ```
</process>

<success_criteria>
1. The full pipeline runs end-to-end: gsd-sdk initialization → gsd-planner Agent writes PLAN.md → superpowers:executing-plans is invoked with the full PLAN.md content.
2. superpowers:executing-plans Skill is invoked exactly once per run.
3. PLAN.md and STATE.md (with (pending) SHA) are committed in a single commit before Superpowers is invoked. STATE.md is not patched with a plan commit SHA that misrepresents the implementation state.
</success_criteria>
