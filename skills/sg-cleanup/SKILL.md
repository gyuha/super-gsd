---
name: sg-cleanup
description: Use this to archive accumulated phase directories from completed milestones — delegates to gsd-cleanup, then displays a table of what was archived.
argument-hint: "(none)"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Delegate phase-directory cleanup to the gsd-cleanup Skill, then render a table summarizing what was archived — for each completed milestone, the phase directories moved and their destination path. This skill never moves or commits files itself; gsd-cleanup performs the archival and the commit. sg-cleanup only snapshots before/after and reports the result as a table.
</objective>

<execution_context>
Self-contained. Snapshots `.planning/phases/` before and after, delegates archival to the gsd-cleanup Skill, then diffs the two snapshots to build the summary table. Writes nothing to planning files itself.
</execution_context>

<process>
1. **Snapshot the BEFORE state.** Record the phase directories currently under `.planning/phases/` to a temp file so the list survives the gsd-cleanup invocation:
   ```bash
   SG_CLEANUP_BEFORE="${TMPDIR:-/tmp}/sg-cleanup-before.txt"
   ls -d .planning/phases/*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | sort > "$SG_CLEANUP_BEFORE"
   echo "Before: $(wc -l < "$SG_CLEANUP_BEFORE" | tr -d ' ') phase directories under .planning/phases/"
   ```

2. **Delegate archival to gsd-cleanup.** Invoke the gsd-cleanup Skill, which identifies completed milestones without a `-phases` archive, shows its own dry-run summary, asks for confirmation, moves the directories into `.planning/milestones/v{X.Y}-phases/`, and commits. Let it run to completion — control returns here afterward (this is NOT a terminal handoff; the table step below runs after gsd-cleanup finishes):
   ```
   Skill(skill="gsd-cleanup", args="")
   ```

3. **Snapshot the AFTER state and compute what was archived.** Once gsd-cleanup returns, diff the snapshots to find phase directories that were present BEFORE but are now gone from `.planning/phases/`, and locate which milestone `-phases` archive each one landed in:
   ```bash
   SG_CLEANUP_BEFORE="${TMPDIR:-/tmp}/sg-cleanup-before.txt"
   SG_CLEANUP_AFTER="${TMPDIR:-/tmp}/sg-cleanup-after.txt"
   ls -d .planning/phases/*/ 2>/dev/null | xargs -n1 basename 2>/dev/null | sort > "$SG_CLEANUP_AFTER"
   # Archived = present before, absent after
   comm -23 "$SG_CLEANUP_BEFORE" "$SG_CLEANUP_AFTER" > "${TMPDIR:-/tmp}/sg-cleanup-archived.txt"
   if [ ! -s "${TMPDIR:-/tmp}/sg-cleanup-archived.txt" ]; then
     echo "NOTHING_ARCHIVED"
   else
     # For each archived dir, find which milestone -phases archive now holds it: emit "version|slug|destination"
     while IFS= read -r d; do
       [ -z "$d" ] && continue
       dest=$(ls -d .planning/milestones/v*-phases/"$d" 2>/dev/null | head -1)
       ver=$(printf '%s' "$dest" | sed -E 's#.*/milestones/(v[0-9.]+)-phases/.*#\1#')
       echo "${ver:-unknown}|$d|${dest:-(destination not found)}"
     done < "${TMPDIR:-/tmp}/sg-cleanup-archived.txt"
   fi
   rm -f "$SG_CLEANUP_BEFORE" "$SG_CLEANUP_AFTER" "${TMPDIR:-/tmp}/sg-cleanup-archived.txt"
   ```

   **Render the result (final output):**
   - If the bash output is `NOTHING_ARCHIVED` — gsd-cleanup found nothing eligible, or the user cancelled its confirmation: print a single line stating nothing was archived. Do NOT fabricate a table.
   - Otherwise: render a table grouped by milestone version. Each `version|slug|destination` line is one archived phase directory; aggregate all slugs that share the same version into one row. Table headers and surrounding prose are written in the user's language (per the `<language>` directive); machine tokens — milestone version IDs (`vX.Y`), phase directory slugs, and destination paths — stay verbatim:

     | Milestone | Archived phases | Count | Destination |
     |-----------|-----------------|-------|-------------|
     | v2.6 | 33-npx-installer, 34-sg-setup-skill, 35-doc-improvement | 3 | .planning/milestones/v2.6-phases/ |
</process>

<success_criteria>
1. The gsd-cleanup Skill is invoked exactly once — archival of phase directories and the commit are delegated entirely to it.
2. After gsd-cleanup completes, a table is rendered from the actual before/after `.planning/phases/` diff, grouped by milestone version, listing the archived phase slugs, their count, and the destination path.
3. When gsd-cleanup archives nothing (nothing eligible, or the user cancelled), sg-cleanup reports that in one line and renders no fabricated table.
4. sg-cleanup never moves or commits planning files itself — every mutation is performed by gsd-cleanup.
</success_criteria>
