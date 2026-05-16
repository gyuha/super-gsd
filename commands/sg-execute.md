---
name: sg-execute
description: Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---

<objective>
Package the current phase's PLAN.md bodies, REQUIREMENTS.md REQ-ID mapping, and ROADMAP.md success criteria into a single Superpowers-ready prompt and auto-invoke the `superpowers:executing-plans` Skill with it. Append a timestamped row to `.planning/HANDOFF.md` describing the handoff. The append is skipped when `(phase, to=superpowers)` was already handed off and the plan hash is unchanged, so re-running on an unchanged plan is idempotent.
</objective>

<execution_context>
This command is self-contained — no external workflow files imported. Reads .planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md, .planning/phases/<phase>/*-PLAN.md, .planning/HANDOFF.md.
</execution_context>

<process>
1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md` by grepping the `## Current Position` section for `Phase: <N>`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
   fi
   ```
   If extraction fails, print exactly: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-execute <phase>` and exit.

2. **Locate phase directory.** Glob `.planning/phases/<phase>-*` (with zero-padded two-digit prefix support). Example:
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     # Try unpadded match for decimal phases
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   ```
   If no directory matches, print: `No phase directory matches '<phase>' under .planning/phases/. Run /gsd:discuss-phase first.` and exit.

3. **Extract phase meta.** From `.planning/ROADMAP.md`, grep:
   - `### Phase <N>: <Name>` header to get `PHASE_NAME`.
   - The `**Goal**:` line immediately following the header to get `GOAL`.
   - The numbered list under `**Success Criteria**` to get the SC items.
   - The `**Requirements**:` line to get the REQ-ID list.
   ```bash
   PHASE_HEADER=$(grep -n "^### Phase ${PHASE_NUM}:" .planning/ROADMAP.md | head -1)
   if [ -z "$PHASE_HEADER" ]; then
     echo "No '### Phase ${PHASE_NUM}:' header found in .planning/ROADMAP.md. Aborting."
     exit 1
   fi
   PHASE_NAME=$(echo "$PHASE_HEADER" | sed 's/.*Phase [0-9]*: //')
   HEADER_LINE=$(echo "$PHASE_HEADER" | cut -d: -f1)

   GOAL=$(awk "NR>${HEADER_LINE} && /^\*\*Goal\*\*:/{sub(/^\*\*Goal\*\*:[[:space:]]*/,\"\"); print; exit}" .planning/ROADMAP.md)
   REQ_IDS=$(awk "NR>${HEADER_LINE} && /^\*\*Requirements\*\*:/{match(\$0,/: (.*)/,a); print a[1]; exit}" .planning/ROADMAP.md)
   REQ_IDS_CLEAN=$(echo "$REQ_IDS" | tr -d ' ' | tr ',' ' ')

   # Success Criteria: collect numbered items after **Success Criteria** until next ** section
   SC_TEXT=$(awk "NR>${HEADER_LINE}" .planning/ROADMAP.md | awk '/^\*\*Success Criteria\*\*/{found=1; next} found && /^\*\*/{exit} found && /^  [0-9]+\./{print}')
   ```

4. **Map REQ-IDs to one-line definitions.** For each REQ-ID, grep `.planning/REQUIREMENTS.md` for the bullet starting with `**<REQ-ID>**:` and extract the one-line description:
   ```bash
   for REQ in $REQ_IDS_CLEAN; do
     grep -E "\*\*${REQ}\*\*:" .planning/REQUIREMENTS.md | head -1
   done
   ```

5. **Collect PLAN.md bodies.** Read every `*-PLAN.md` file in `$PHASE_DIR` (sorted numerically). Wrap each file body inside a fenced code block tagged ` ```markdown ` and prefix it with a `### <filename>` header.

6. **Compute Plan Hash.** Concatenate all `*-PLAN.md` bodies and compute the first 7 characters of the sha256 digest. Use `shasum -a 256` on macOS with a `sha256sum` fallback:
   ```bash
   PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
   if [ -z "$PLAN_HASH" ]; then
     PLAN_HASH="nodata"
   fi
   ```

7. **Idempotency check.** Inspect `.planning/HANDOFF.md` for the latest row whose `Phase` cell matches `$PHASE_NUM` and whose `To` cell equals `superpowers`. Extract the recorded Plan Hash and compare it to `$PLAN_HASH`:
   ```bash
   EXISTING_HASH=$(grep -E "^\| [^|]+ \| ${PHASE_PAD}-[^|]* \| [^|]+ \| superpowers \|" .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$6); print $6}')
   if [ -n "$EXISTING_HASH" ] && [ "$EXISTING_HASH" = "$PLAN_HASH" ]; then
     echo "Already handed off Phase $PHASE_NUM to superpowers (plan hash matches: $PLAN_HASH). Skipping append. Use /super-gsd:sg-status to inspect, or modify a PLAN.md to re-handoff."
     exit 0
   fi
   ```
   If the Plan Hash differs from the recorded one, a new row is permitted (PLAN.md changed since the last handoff).

8. **Append HANDOFF.md row.** Validate the header row exists, then append a new 5-column line:
   ```bash
   if ! grep -Fxq "| Timestamp | Phase | From | To | Plan Hash |" .planning/HANDOFF.md; then
     echo ".planning/HANDOFF.md schema mismatch — header row not found. Aborting append."
     exit 1
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   FROM_STAGE=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$4); print $4}')
   if [ -z "$FROM_STAGE" ]; then
     FROM_STAGE="init"
   fi
   PHASE_SLUG=$(basename "$PHASE_DIR")
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | superpowers | $PLAN_HASH |" >> .planning/HANDOFF.md
   ```

9. **Build prompt and invoke Skill.** Assemble a single markdown blob in this exact order (English labels only):
   ```
   # Superpowers Execution Handoff — Phase <N> (<PHASE_NAME>)

   ## Goal
   <GOAL>

   ## Success Criteria
   1. ...
   2. ...

   ## Requirements
   - <REQ-ID>: <one-line definition>
   ...

   ## Plans

   ### <plan-filename-1>
   ```markdown
   <full PLAN.md body>
   ```

   ### <plan-filename-2>
   ```markdown
   <full PLAN.md body>
   ```

   ## Instruction to Superpowers
   Execute the plans above using the superpowers:executing-plans skill. Treat each PLAN.md as the authoritative source of tasks and acceptance criteria.
   ```
   Display the prompt blob to the user. Then print exactly:
   `Handoff complete. HANDOFF.md updated; superpowers:executing-plans invoked. Use /super-gsd:sg-status to inspect workflow state.`
   Then invoke the Skill tool — no confirmation prompt. Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="superpowers:executing-plans", args="<the prompt blob above>")
   ```
</process>

<success_criteria>
1. The prompt blob shown to the user contains the Phase number, Goal, Success Criteria list, all REQ-IDs with their one-line definitions, and the full body of every `*-PLAN.md` in the phase directory.
2. The `superpowers:executing-plans` Skill is invoked exactly once per run, or zero times when the idempotency check short-circuits.
3. `.planning/HANDOFF.md` gains at most one new row per run, and that row matches the 5-column schema `| Timestamp | Phase | From | To | Plan Hash |`.
4. Re-running the command with an unchanged plan hash produces the `Already handed off ...` message and appends no row.
</success_criteria>
