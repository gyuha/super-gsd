---
name: sg-start
description: Use this when starting or resuming work on a project — detects an existing session via STATE.md and prompts Resume, Start new milestone, or Cancel; falls back to gsd-new-project if no session exists.
argument-hint: "[project-name] - optional. Used only when no existing .planning/STATE.md is detected; passed through to gsd-new-project."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Detect existing session via STATE.md + HANDOFF.md. If detected, show 5-line summary (Milestone / Phase / Stage / Last activity / Next) and ask user (Resume / Start new milestone / Cancel) via AskUserQuestion. If no STATE.md, delegate to gsd-new-project Skill as before (D-17 fallback). All branches access HANDOFF.md as read-only — append-only audit log invariant preserved (SESS-04).
</objective>

<execution_context>
Reads .planning/STATE.md, .planning/HANDOFF.md, .planning/ROADMAP.md (next-phase existence check). Writes nothing. Delegates to gsd-new-milestone or gsd-new-project Skill depending on user choice / detection result.
</execution_context>

<process>
0. **Add `.planning/` to `.gitignore` (idempotent).**

   Ensure the project's `.gitignore` excludes the `.planning/` directory while keeping `.planning/codebase/` tracked:

   ```bash
   if ! grep -qxF '.planning/' .gitignore 2>/dev/null; then
     printf '\n.planning/\n!.planning/codebase/\n' >> .gitignore
   fi
   ```

1. **STATE.md Phase parsing (D-01, D-03; Phase 7 D-07 inline-replication lock).**

   Replicate the `skills/sg-status/SKILL.md` lines 17-21 block verbatim (if drift occurs, update both simultaneously):
   ```bash
   # --- BEGIN STATE.md Phase parsing block (D-07: Phase 8 sg-start replicates this block) ---
   PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
   [ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
   PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
   # --- END STATE.md Phase parsing block ---
   ```

   D-01 trigger determination:
   ```bash
   if [ ! -f .planning/STATE.md ] || [ "$PHASE_LINE" = "(none)" ]; then
     EXISTING_SESSION=0
   else
     EXISTING_SESSION=1
   fi
   ```

   If `EXISTING_SESSION=0`, jump to the D-17 fallback in Step 6 (skip Steps 2-5).

2. **Parse additional STATE.md frontmatter + HANDOFF.md last row (D-04, D-06, D-07).**

   Execute only when `EXISTING_SESSION=1`.

   4 STATE.md frontmatter fields (line-by-line grep + sed; no external tools like yq — Phase 6 D-04 lock):
   ```bash
   MILESTONE=$(grep -E '^milestone:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   MILESTONE_NAME=$(grep -E '^milestone_name:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^milestone_name:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_UPDATED=$(grep -E '^last_updated:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_updated:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   LAST_ACTIVITY=$(grep -E '^last_activity:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^last_activity:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | sed -E 's/^"//;s/"$//')
   ```

   Milestone display assembly (D-07):
   ```bash
   if [ -n "$MILESTONE" ] && [ -n "$MILESTONE_NAME" ]; then
     MILESTONE_DISPLAY="${MILESTONE} ${MILESTONE_NAME}"
   elif [ -n "$MILESTONE" ]; then
     MILESTONE_DISPLAY="$MILESTONE"
   else
     MILESTONE_DISPLAY="(unknown)"
   fi
   ```

   HANDOFF.md last data row + Stage mapping — replicate the `skills/sg-status/SKILL.md` lines 26-48 block verbatim (if drift occurs, update both simultaneously):
   ```bash
   LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
   if [ -z "$LAST_ROW" ]; then
     STAGE_RAW="init"
     TS=""
   else
     STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
     TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
     case "$STAGE_RAW" in
       gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete) ;;
       *) echo "[warn] Unknown stage '${STAGE_RAW}' in HANDOFF.md — treating as init" >&2
          STAGE_RAW="init" ;;
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
     sg-retro)     STAGE_DISPLAY="sg-retro" ;;
     ship)         STAGE_DISPLAY="ship" ;;
     complete)     STAGE_DISPLAY="complete" ;;
   esac
   ```

3. **Last activity time determination (D-06; absolute timestamp only).**
   ```bash
   if [ -n "$TS" ]; then
     LAST_ACTIVITY_DISPLAY="$TS"
   elif [ -n "$LAST_UPDATED" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_UPDATED"
   elif [ -n "$LAST_ACTIVITY" ]; then
     LAST_ACTIVITY_DISPLAY="$LAST_ACTIVITY"
   else
     LAST_ACTIVITY_DISPLAY="(unknown)"
   fi
   ```
   Relative time conversion (e.g. `N days ago`/`N hr ago` format) is strictly prohibited — D-06 lock. Use the absolute timestamp as-is.

4. **NEXT_PHASE computation + Next command mapping (D-04 Next line; Phase 2 D-28 lock).**

   Replicate the `skills/sg-status/SKILL.md` lines 62-74 + lines 78-99 two blocks verbatim (if drift occurs, update both simultaneously):
   ```bash
   if [ "$STAGE_RAW" = "sg-retro" ] || [ "$STAGE_RAW" = "ship" ]; then
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
     superpowers|parallel|execute|tdd|review)
       # Skip-aware routing for the implementation→ship segment (mirrors skills/sg-next/SKILL.md).
       #   tdd_mode (execute only) → sg-tdd; skip_review → omit review; skip_learn → omit learn.
       NEXT_CMD=$(SG_STAGE="$STAGE_RAW" node -e 'let c={};try{c=(require("./.planning/config.json").super_gsd)||{}}catch(e){}var tdd=!!c.tdd_mode,sr=!!c.skip_review,sl=!!c.skip_learn,s=process.env.SG_STAGE,n;if(s==="execute"&&tdd){n="sg-tdd"}else if(s==="review"){n=sl?"sg-ship":"sg-learn"}else{n=sr?(sl?"sg-ship":"sg-learn"):"sg-review"}process.stdout.write("/super-gsd:"+n)' 2>/dev/null)
       [ -z "$NEXT_CMD" ] && NEXT_CMD="/super-gsd:sg-review"
       ;;
     sg-retro)    NEXT_CMD="/super-gsd:sg-ship" ;;
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
   ```

5. **Emit 5-line summary + AskUserQuestion 3-option branch (D-04, D-05, D-10, D-12, D-13, D-14, D-15, D-16; SESS-02/03/04).**

   Output guidance header + 5 lines (one blank line between header and lines, no blank lines between the 5 lines):
   ```
   Existing session detected.

   Milestone: <MILESTONE_DISPLAY>
   Phase: <PHASE_LINE>
   Stage: <STAGE_DISPLAY>
   Last activity: <LAST_ACTIVITY_DISPLAY>
   Next: <NEXT_CMD>
   ```

   AskUserQuestion call (header `Session`, 3 options — D-12 label lock):
   ```
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

   Response branches:
   - **Resume** (D-08, D-16): no additional output, exit. Automatic Skill invoke is strictly forbidden (D-09 hybrid handoff not applied — user runs the Next line command directly).
   - **Start new milestone** (D-14): first run the **Stage skip configuration** block (Step 7) to let the user choose which stages to skip, then:
     ```
     Skill(skill="gsd-new-milestone", args="")
     ```
     args must be an **empty string** — using `$ARGUMENTS` is forbidden (D-14 lock).
   - **Cancel** (D-15): emit single line `Cancelled. No changes made.` and exit. Do not read or write any files.

   All three branches access `.planning/HANDOFF.md` as read-only (D-16; naturally satisfies SESS-04). Deleting, modifying, or appending to HANDOFF.md is strictly forbidden.

6. **D-17 fallback branch (`EXISTING_SESSION=0`).**

   When STATE.md is not detected or `^Phase:` line capture fails: first run the **Stage skip configuration** block (Step 7) so the choice is persisted before delegation, then call as-is (backward compatible):
   ```
   Skill(skill="gsd-new-project", args="$ARGUMENTS")
   ```
   `$ARGUMENTS` passthrough preserved. No additional output beyond the Step 7 confirmation.

   Caveat: for a brand-new project, `.planning/config.json` may not exist yet, so Step 7 creates it with only the `super_gsd` block. If `gsd-new-project` later regenerates config.json from scratch it could overwrite these flags; in that case the user re-applies them with `/super-gsd:sg-toggle-*`.

7. **Stage skip configuration (SKIP-CFG; new milestone / new project only).**

   Run this block ONLY when the user chose "Start new milestone" (Step 5) or in the new-project fallback (Step 6). Never run it on Resume. It lets the user pick which workflow stages to skip and persists the choice to `.planning/config.json`.

   AskUserQuestion (multiSelect — selecting nothing keeps the defaults: Review + Learn included, TDD off):
   ```
   AskUserQuestion(
     questions: [{
       question: "Configure optional workflow stages. Selecting nothing keeps the defaults (Review and Learn run, TDD off).",
       header: "Stages",
       multiSelect: true,
       options: [
         { label: "Skip Review", description: "Skip the sg-review stage (skip_review=true)." },
         { label: "Skip Learn", description: "Skip the sg-learn / sg-retro stage (skip_learn=true)." },
         { label: "Enable TDD", description: "Run sg-tdd after execute (tdd_mode=true)." }
       ]
     }]
   )
   ```

   Derive three booleans from the selection, then persist (read-merge-write; macOS compatible — node only, no jq). `SR`=true if "Skip Review" selected, `SL`=true if "Skip Learn" selected, `TM`=true if "Enable TDD" selected:
   ```bash
   SR="$SKIP_REVIEW" SL="$SKIP_LEARN" TM="$ENABLE_TDD" node -e '
   const fs=require("fs"), path=require("path");
   const p=path.join(process.cwd(),".planning","config.json");
   let cfg={}; try{cfg=JSON.parse(fs.readFileSync(p,"utf-8"));}catch(e){cfg={};}
   cfg.super_gsd=cfg.super_gsd||{};
   cfg.super_gsd.skip_review=(process.env.SR==="true");
   cfg.super_gsd.skip_learn=(process.env.SL==="true");
   cfg.super_gsd.tdd_mode=(process.env.TM==="true");
   fs.mkdirSync(path.dirname(p),{recursive:true});
   fs.writeFileSync(p, JSON.stringify(cfg,null,2)+"\n");
   const seq=["execute"]; if(cfg.super_gsd.tdd_mode)seq.push("tdd"); if(!cfg.super_gsd.skip_review)seq.push("review"); if(!cfg.super_gsd.skip_learn)seq.push("learn"); seq.push("ship");
   process.stdout.write(seq.join(" → "));
   '
   ```

   Report the resulting workflow sequence in the user's language (the printed `execute → … → ship` sequence and the flag names stay verbatim), then continue with the branch's delegation.
</process>

<success_criteria>
1. Read STATE.md/HANDOFF.md to detect an existing session, emit the 5 lines (Milestone / Phase / Stage / Last activity / Next), and display AskUserQuestion with 3 options (SESS-01, SESS-02).
2. When Resume is selected, exit emit-only with no additional Skill invoke; the user runs the Next line command directly (SESS-03; D-08, D-09).
3. When Start new milestone is selected, call `Skill(skill="gsd-new-milestone", args="")` (args empty string); when Cancel is selected, emit `Cancelled. No changes made.` single line and exit (D-14, D-15).
4. All three options access `.planning/HANDOFF.md` as read-only — no deletion, modification, or append (SESS-04; D-16).
5. When STATE.md is not detected or `^Phase:` line capture fails, run the Step 7 Stage skip configuration block, then call `Skill(skill="gsd-new-project", args="$ARGUMENTS")` (D-17 backward compatible).
6. The Stage skip configuration block (Step 7) runs only for "Start new milestone" and the new-project fallback — never on Resume — and persists `skip_review` / `skip_learn` / `tdd_mode` to `.planning/config.json` (read-merge-write, other keys preserved).
</success_criteria>
