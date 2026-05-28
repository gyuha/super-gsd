---
name: sg-phase
description: Use this to edit, remove, or complete a phase — edit/remove delegate to GSD's gsd-phase, while complete reconciles a finished phase's ROADMAP/STATE metadata (an operation gsd-phase does not provide).
argument-hint: "edit <N> [changes] | remove <N> | complete [N]"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Perform one of three phase operations, routed by the leading subcommand in `$ARGUMENTS`:
- **edit** — delegate to GSD's `gsd-phase` Skill in `--edit` mode (modify an existing phase's fields).
- **remove** — delegate to `gsd-phase` in `--remove` mode (delete a future phase, renumber the rest).
- **complete** — NEW inline reconcile logic (gsd-phase has no complete mode): mark a finished phase as done by recomputing its Plans-complete count, setting the ROADMAP `## Progress` row to `Complete` with today's date, flipping the `## Phases` checkbox to `[x]`, updating STATE.md, and optionally appending a HANDOFF.md `complete` row.

edit/remove reuse the GSD CRUD that already exists; complete fills the gap where planning metadata drifts out of sync with finished work (e.g. phases completed ad-hoc).
</objective>

<execution_context>
Self-contained. Reads `.planning/STATE.md`, `.planning/ROADMAP.md`, and the target phase directory. For edit/remove it delegates to the `gsd-phase` Skill (terminal handoff — session control transfers). For complete it mutates `.planning/ROADMAP.md` / `.planning/STATE.md` / `.planning/HANDOFF.md` inline via the Read and Edit tools, then returns a summary.
</execution_context>

<process>
1. **Parse the leading subcommand.** Take the first whitespace-delimited token of `$ARGUMENTS` as the subcommand; the remainder is its arguments:
   ```bash
   SUBCMD=$(printf '%s' "$ARGUMENTS" | awk '{print $1}')
   REMAINDER=$(printf '%s' "$ARGUMENTS" | sed -E 's/^[[:space:]]*[^[:space:]]+[[:space:]]*//')
   ```
   If `SUBCMD` is empty or not one of `edit` / `remove` / `complete`, print exactly one usage line and exit (do NOT delegate, do NOT mutate any file). Surface the surrounding prose in the user's language; keep the command token verbatim:
   `Usage: /super-gsd:sg-phase <edit|remove|complete> <N> [changes]`

2. **`edit` route.** Delegate to gsd-phase in --edit mode. `REMAINDER` is `<N> [changes/--force]`. Before invoking, substitute the literal resolved remainder. Session control transfers to the skill; no steps run after this point:
   ```
   Skill(skill="gsd-phase", args="--edit $REMAINDER")
   ```

3. **`remove` route.** Delegate to gsd-phase in --remove mode. `REMAINDER` is the phase number. Terminal handoff — no steps after:
   ```
   Skill(skill="gsd-phase", args="--remove $REMAINDER")
   ```

4. **`complete` route (inline reconcile — do NOT delegate; gsd-phase has no complete mode).**

   4a. **Resolve the phase number.** If `REMAINDER` contains a number, use it. Otherwise Read `.planning/STATE.md` and extract the `Phase:` value from the `## Current Position` section / YAML frontmatter (mirror sg-ship Step 1 resolution). If still unresolved, print and exit:
   `Could not resolve phase. Pass it explicitly: /super-gsd:sg-phase complete <N>`
   ```bash
   PHASE_NUM=$(printf '%s' "$REMAINDER" | grep -oE '[0-9]+(\.[0-9]+)?' | head -1)
   # If empty, fall back to STATE.md (Read tool) — extract the leading integer of the Phase: line.
   ```

   4b. **Locate the phase directory** (zero-padded two-digit support):
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   [ -z "$PHASE_DIR" ] && PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   PHASE_SLUG=$(printf '%s' "$PHASE_DIR" | xargs basename 2>/dev/null || echo "${PHASE_PAD}")
   ```

   4c. **Recompute Plans-complete.** If the directory exists, count SUMMARY vs PLAN files; otherwise use the ad-hoc sentinel:
   ```bash
   if [ -n "$PHASE_DIR" ] && [ -d "$PHASE_DIR" ]; then
     SUMS=$(ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null | wc -l | tr -d ' ')
     PLANS=$(ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
     PLANS_COMPLETE="${SUMS}/${PLANS}"
   else
     PLANS_COMPLETE="— (ad-hoc)"
   fi
   TODAY=$(date +%Y-%m-%d)
   echo "phase=$PHASE_NUM slug=${PHASE_SLUG} plans_complete=$PLANS_COMPLETE date=$TODAY"
   ```

   4d. **Update the ROADMAP `## Progress` table row.** Use the **Read tool** to load `.planning/ROADMAP.md` and find the `## Progress` table (columns `| Phase | Milestone | Plans Complete | Status | Completed |`). Table rows are NOT zero-padded — match the row whose Phase cell begins with `<PHASE_NUM>.` (e.g. `| 36. ...`). Use the **Edit tool** to set that row's Plans-complete = `$PLANS_COMPLETE`, Status = `Complete`, Completed = `$TODAY`. Do NOT parse the pipe table with `awk -F'|'` field-splitting or `grep -P` (CLAUDE.md macOS portability) — Read + interpret + Edit only.

   4e. **Flip the `## Phases` checkbox.** In the same file's `## Phases` section, find the line for the target phase (e.g. `- [ ] **Phase 36: ...**` or `- [ ] Phase 36: ...`, matched on the phase number) and use the Edit tool to change `- [ ]` → `- [x]`.

   4f. **Update STATE.md.** Use the Read tool on `.planning/STATE.md`, then Edit surgically to reflect the phase as complete (e.g. `## Current Position` Phase/Status lines, and if `progress.completed_phases`/`percent` are present and the flip changed the count, update them). Touch only position/progress lines.

   4g. **Optionally append a HANDOFF.md `complete` row** (append-only — never modify existing rows). Reuse the sg-ship Step 1.5 header guard + FROM_STAGE extraction (read the To column of the last data row, default `review`), then:
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | complete | - | $GIT_USER |" >> .planning/HANDOFF.md
   ```

   4h. **Print a confirmation** summarizing what changed (phase number, plans-complete, status → Complete, completed date, files touched). Surface the prose in the user's language; keep machine tokens (phase slug, `vX.Y`, dates, `Complete`) verbatim.
</process>

<success_criteria>
1. `/super-gsd:sg-phase edit <N> [changes]` delegates exactly once to `Skill(skill="gsd-phase", args="--edit ...")` and runs no complete logic.
2. `/super-gsd:sg-phase remove <N>` delegates exactly once to `Skill(skill="gsd-phase", args="--remove <N>")`.
3. `/super-gsd:sg-phase complete [N]` resolves the phase (arg or STATE.md), locates the zero-padded phase dir, recomputes Plans-complete (or `— (ad-hoc)`), sets the ROADMAP Progress row to Status=Complete with today's date, flips the Phases checkbox to `[x]`, updates STATE.md, and optionally appends a HANDOFF.md `complete` row — all via Read + Edit (no awk pipe-splitting, no grep -P).
4. An empty or unknown subcommand prints a single usage line and exits without delegating or mutating any file.
5. A `<language>` auto-detect directive is present; surfaced prose follows the user's language while machine tokens stay verbatim.
6. The complete route does NOT delegate to gsd-phase (gsd-phase has no complete mode).
</success_criteria>
