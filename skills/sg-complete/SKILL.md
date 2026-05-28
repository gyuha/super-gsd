---
name: sg-complete
description: Complete a phase (bare number → delegates to sg-phase) or close a milestone (vX.Y, or the current milestone when no argument) via gsd-complete-milestone.
argument-hint: "[<phase-number> | <vX.Y>] - number → complete phase; vX.Y → close milestone; empty → close current milestone"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Dispatch by ARGUMENT SHAPE:
- **bare number** (e.g. `36`) → complete a phase by delegating to `sg-phase complete <N>` (no milestone close).
- **version** (e.g. `v1.4`) → close that milestone (lessons archive + HANDOFF `complete` row + gsd-complete-milestone).
- **no argument** → close the CURRENT milestone, resolved from STATE.md `milestone:`.
- **anything else** → print one usage line and exit.

This makes the argument contract explicit: numbers are phases, `vX.Y` are milestone versions. A phase number is NEVER passed to gsd-complete-milestone (which expects a version) — that previously produced a broken `vNN` tag/archive.
</objective>

<execution_context>
Self-contained. Reads `.planning/STATE.md` (`milestone:` field) and `.planning/HANDOFF.md`. The bare-number route delegates to the `sg-phase` Skill (terminal handoff). The version / no-argument routes archive lessons, append a HANDOFF `complete` row, and delegate to the `gsd-complete-milestone` Skill (terminal handoff). Reads use the Read tool; only argument-shape matching uses bash regex.
</execution_context>

<process>
1. **Detect the argument shape.** Trim `$ARGUMENTS` and classify. Test the version pattern BEFORE the number pattern so `v1.4` is never misclassified:
   ```bash
   ARG=$(printf '%s' "$ARGUMENTS" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
   if [ -z "$ARG" ]; then
     ROUTE="current-milestone"
   elif echo "$ARG" | grep -qE '^v[0-9]+\.[0-9]+$'; then
     ROUTE="version"
     MILESTONE_VER="$ARG"
   elif echo "$ARG" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then
     ROUTE="phase"
     PHASE_NUM="$ARG"
   else
     ROUTE="unknown"
   fi
   ```

2. **`unknown` route — print one usage line and exit.** No delegation, no file mutation. Surface the surrounding prose in the user's language; keep the command token and shapes verbatim:
   `Usage: /super-gsd:sg-complete [<phase-number> | <vX.Y>]  (number → complete phase; vX.Y → close milestone; empty → close current milestone)`

3. **`phase` route (bare number) — delegate to sg-phase, do NOT run any milestone-close step.** sg-phase complete owns the ROADMAP/STATE/HANDOFF reconcile for a single phase. Substitute the resolved number; terminal handoff — no steps run after:
   ```
   Skill(skill="super-gsd:sg-phase", args="complete $PHASE_NUM")  # replace $PHASE_NUM
   ```

4. **`version` and `current-milestone` routes — shared milestone-close path.**

   4a. **Resolve MILESTONE_VER.**
   - `version` route: `MILESTONE_VER` is the `vX.Y` argument (already set in Step 1).
   - `current-milestone` route: Read `.planning/STATE.md`, then extract the `milestone:` value from the YAML frontmatter (e.g. `v2.7`). Set `MILESTONE_VER` to it. If it is absent/empty, print and exit (no delegation, no mutation):
     `Could not resolve current milestone from STATE.md. Pass it explicitly: /super-gsd:sg-complete <vX.Y>`

   4b. **Lessons archive.** Run lessons_ranker against the resolved version. Failure does not block:
   ```bash
   if [ -z "$MILESTONE_VER" ]; then
     echo "[warn] sg-complete: milestone version not resolved — skipping lessons archive"
   else
     echo "[sg-complete] Archiving lessons to .planning/milestones/${MILESTONE_VER}-LESSONS.md ..."
     node hooks/lessons_ranker.cjs --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
       echo "[warn] lessons archive failed — continuing"
   fi
   ```

   4c. **Record HANDOFF.md row (`complete` stage) — before invoking the Skill.** A milestone close has no single phase, so the Phase column holds the version `$MILESTONE_VER` (not a phase slug):
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   # Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row
   # that starts with "| " followed by a 4-digit year. Set FROM_STAGE to that value (default "review" if empty).
   echo "| $TS | $MILESTONE_VER | $FROM_STAGE | complete | - |" >> "$HANDOFF_FILE"
   ```

   4d. **Invoke gsd-complete-milestone with the VERSION** — substitute the literal `vX.Y`. NEVER pass a phase number. Terminal handoff; no steps run after:
   ```
   Skill(skill="gsd-complete-milestone", args="$MILESTONE_VER")  # replace with the resolved vX.Y
   ```
</process>

<success_criteria>
1. `/super-gsd:sg-complete <N>` (bare number) delegates exactly once to `Skill(skill="super-gsd:sg-phase", args="complete <N>")` and runs NO milestone-close step.
2. `/super-gsd:sg-complete <vX.Y>` closes that milestone — lessons archive + HANDOFF `complete` row + `gsd-complete-milestone`, all fed the version.
3. `/super-gsd:sg-complete` (no argument) resolves STATE.md `milestone:` and closes THAT version; no phase number is ever passed to gsd-complete-milestone.
4. An unknown/invalid argument prints exactly one usage line and exits without delegating or mutating any file.
5. The version pattern `^v[0-9]+\.[0-9]+$` is tested before the number pattern so `v1.4` routes to milestone close, not phase complete.
6. The `<language>` directive is present; surfaced prose follows the user's language while machine tokens (command names, `vX.Y`, stage enums, phase numbers) stay verbatim. No version bump.
</success_criteria>
