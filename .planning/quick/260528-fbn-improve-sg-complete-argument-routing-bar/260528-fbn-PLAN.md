---
phase: quick-260528-fbn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/sg-complete/SKILL.md
  - README.md
  - README.ko.md
autonomous: true
requirements: [QUICK-260528-fbn]

must_haves:
  truths:
    - "`/super-gsd:sg-complete 36` completes phase 36 by delegating to sg-phase complete, and does NOT run milestone close."
    - "`/super-gsd:sg-complete v1.4` closes milestone v1.4: lessons archive + HANDOFF complete row + gsd-complete-milestone, all fed the version v1.4 (never a phase number)."
    - "`/super-gsd:sg-complete` with no argument reads STATE.md `milestone:` and closes THAT version (e.g. v2.7) — no phase number is ever passed to gsd-complete-milestone."
    - "An unknown/invalid argument prints exactly one usage line and exits without delegating or mutating any file."
    - "README.md and README.ko.md sg-complete rows describe the dual behavior (number → phase, vX.Y → milestone, empty → current milestone) and stay EN/KO in sync."
  artifacts:
    - path: "skills/sg-complete/SKILL.md"
      provides: "Argument-shape dispatch: bare-number → sg-phase complete; vX.Y → milestone close; empty → current-milestone close; unknown → usage line"
      contains: "v[0-9]+\\.[0-9]+"
    - path: "README.md"
      provides: "Updated sg-complete Commands-table row reflecting dual behavior"
    - path: "README.ko.md"
      provides: "Korean-parity sg-complete Commands-table row"
  key_links:
    - from: "skills/sg-complete/SKILL.md (number route)"
      to: "Skill(skill=\"super-gsd:sg-phase\", args=\"complete <N>\")"
      via: "delegation, no milestone close"
      pattern: "super-gsd:sg-phase.*complete"
    - from: "skills/sg-complete/SKILL.md (version/empty route)"
      to: "Skill(skill=\"gsd-complete-milestone\", args=\"<vX.Y>\")"
      via: "MILESTONE_VER resolved from arg or STATE.md milestone:"
      pattern: "gsd-complete-milestone"
---

<objective>
Rework `skills/sg-complete/SKILL.md` so it dispatches by ARGUMENT SHAPE instead of always resolving a phase and feeding it to `gsd-complete-milestone`. Three valid shapes: a bare number completes a phase (delegated to `sg-phase complete`), a `vX.Y` version closes that milestone, and no argument closes the CURRENT milestone (read from STATE.md `milestone:`). An unknown argument prints one usage line and exits. Then update both READMEs' sg-complete rows to describe the new dual behavior.

Purpose: The current skill resolves the STATE Phase and passes it to `gsd-complete-milestone` (which expects a version), nearly producing a broken `v36`-style tag/archive when closing milestone v2.7. Making the argument contract explicit (numbers = phases, vX.Y = milestones) fixes that bug.

Output: Reworked `skills/sg-complete/SKILL.md` with shape-based routing; surgically edited `README.md` and `README.ko.md` sg-complete rows.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/gyuha/workspace/super-gsd/CLAUDE.md
@/Users/gyuha/workspace/super-gsd/skills/sg-complete/SKILL.md
@/Users/gyuha/workspace/super-gsd/skills/sg-phase/SKILL.md
@/Users/gyuha/workspace/super-gsd/skills/sg-ship/SKILL.md
@/Users/gyuha/workspace/super-gsd/README.md
@/Users/gyuha/workspace/super-gsd/README.ko.md

# Pairwise convention note (CLAUDE.md, Phase 32 Medium-1): there is NO
# `.agents/skills/sg-complete/SKILL.md`. Verified the .agents/skills set is
# sg-execute / sg-learn / sg-next / sg-plan / sg-retro / sg-review / sg-setup /
# sg-ship / sg-start / sg-status. No pair to update — do NOT create one.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rework sg-complete argument routing by shape (preserve milestone-close steps)</name>
  <files>skills/sg-complete/SKILL.md</files>
  <action>
Rewrite the `<process>`, `<objective>`, and `<success_criteria>` of `skills/sg-complete/SKILL.md` to dispatch by argument shape. KEEP the existing `<language>` auto-detect directive at the top verbatim (lines 7-12) — do NOT remove it. KEEP the `argument-hint` frontmatter but update it to reflect the new contract (e.g. `"[<phase-number> | <vX.Y>] - empty → close current milestone"`). Update the frontmatter `description` to say it completes a phase (number) or closes a milestone (vX.Y / empty).

New `<process>` routing logic, in this order:

1. **Detect argument shape.** Use bash regex matching (CLAUDE.md allows `grep -qE` / `case` for arg-shape; the file/STATE reads must still use the Read tool, never awk pipe-splitting or grep -P). Trim `$ARGUMENTS`. Classify:
   - Empty → CURRENT-MILESTONE route.
   - Matches `^v[0-9]+\.[0-9]+$` → VERSION (milestone) route; the matched value IS the MILESTONE_VER.
   - Matches `^[0-9]+(\.[0-9]+)?$` → PHASE route. (A `vX.Y` like `v1.4` must NOT reach this branch — it carries a leading `v`. A bare decimal phase like `1.4` is still a number and routes here.)
   - Anything else → UNKNOWN route.
   Order matters: test the `^v...$` version pattern BEFORE the number pattern so `v1.4` is never misclassified.

2. **UNKNOWN route — print one usage line and exit, no delegation, no file mutation.** Surface surrounding prose in the user's language per `<language>`; keep the command token and shapes verbatim:
   `Usage: /super-gsd:sg-complete [<phase-number> | <vX.Y> ]  (number → complete phase; vX.Y → close milestone; empty → close current milestone)`

3. **PHASE route (bare number).** Substitute the resolved number and delegate to sg-phase complete; this is a terminal handoff — do NOT run any milestone-close step (no lessons archive, no HANDOFF row here, no gsd-complete-milestone). sg-phase complete owns the ROADMAP/STATE/HANDOFF reconcile for a phase:
   `Skill(skill="super-gsd:sg-phase", args="complete <N>")`  # replace <N> with the resolved number

4. **VERSION route (vX.Y) and CURRENT-MILESTONE route (empty) — shared milestone-close path.** Resolve MILESTONE_VER first:
   - VERSION route: MILESTONE_VER = the `vX.Y` argument as-is.
   - CURRENT-MILESTONE route: Read `.planning/STATE.md` (Read tool) and extract the `milestone:` value from the YAML frontmatter (e.g. `v2.7`). Set MILESTONE_VER to that. If `milestone:` is absent/empty, print and exit: `Could not resolve current milestone from STATE.md. Pass it explicitly: /super-gsd:sg-complete <vX.Y>` (no delegation, no mutation).
   Then run the PRESERVED milestone-close steps from the current skill, feeding them MILESTONE_VER (a vX.Y), NOT a phase number:
   - **(preserved Step 1.3) Lessons archive** — `node hooks/lessons_ranker.cjs --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md`. Failure emits a `[warn]` and does NOT block. (Keep the existing echo/guard prose; just ensure MILESTONE_VER is the vX.Y being closed.)
   - **(preserved Step 1.5) HANDOFF `complete` row** — reuse the existing header guard + FROM_STAGE extraction (Read tool on `.planning/HANDOFF.md`, To column of last data row, default `review`). Append `| $TS | $MILESTONE_VER | $FROM_STAGE | complete | - |`. Use MILESTONE_VER (the version) in the Phase column for a milestone close instead of a phase slug — the row marks the milestone, not a phase. (This is the one deliberate change to the preserved 1.5 step; everything else — header guard, append-only, FROM_STAGE default — is unchanged.)
   - **(preserved Step 2) Invoke gsd-complete-milestone with the VERSION** — terminal handoff, substitute the literal value: `Skill(skill="gsd-complete-milestone", args="<vX.Y>")`  # replace with MILESTONE_VER. NEVER pass a phase number here.

Rewrite `<objective>` to state the shape-based dispatch (number → phase via sg-phase; vX.Y → close that milestone; empty → close current milestone from STATE; unknown → usage line). Rewrite `<success_criteria>` to assert: (1) number route delegates once to sg-phase complete and runs NO milestone close; (2) vX.Y route closes that exact milestone (archive + HANDOFF + gsd-complete-milestone) fed the version; (3) empty route resolves STATE `milestone:` and closes THAT version, never a phase number; (4) unknown arg prints one usage line, no delegation/mutation; (5) `<language>` directive present, prose localized, machine tokens (command name, vX.Y, stage enums, phase slug) verbatim; (6) gsd-complete-milestone never receives a phase number.

Do NOT bump version (plugin.json / package.json / CHANGELOG) — only the 배포 deploy trigger bumps version.
  </action>
  <verify>
    <automated>cd /Users/gyuha/workspace/super-gsd && test -f skills/sg-complete/SKILL.md && grep -q '<language>' skills/sg-complete/SKILL.md && grep -qE 'v\[0-9\]\+\\?\.\[0-9\]\+' skills/sg-complete/SKILL.md && grep -q 'super-gsd:sg-phase' skills/sg-complete/SKILL.md && grep -q 'gsd-complete-milestone' skills/sg-complete/SKILL.md && grep -q 'Usage: /super-gsd:sg-complete' skills/sg-complete/SKILL.md && echo PASS</automated>
  </verify>
  <done>
sg-complete dispatches by argument shape: bare number delegates to `Skill(skill="super-gsd:sg-phase", args="complete <N>")` with no milestone close; `vX.Y` and empty run the preserved lessons-archive + HANDOFF-complete + gsd-complete-milestone path fed the VERSION (empty resolves STATE `milestone:`); unknown prints the exact usage line and exits. The `<language>` directive is retained. No phase number is ever passed to gsd-complete-milestone. Version files untouched.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update sg-complete Commands-table row in README.md and README.ko.md (EN/KO parity)</name>
  <files>README.md, README.ko.md</files>
  <action>
Surgically edit ONLY the `/super-gsd:sg-complete` row in each README's Commands table (do not touch any other row, column format, or surrounding prose).

- `README.md` (~line 40): the "What it does" cell currently reads `Archive and close the current milestone via gsd-complete-milestone`. Replace it with text describing the dual behavior, e.g.: `<N> completes a phase (via sg-phase); <vX.Y> closes that milestone; empty closes the current milestone (via gsd-complete-milestone)`. Keep the `When to use` cell and the table pipe format intact.
- `README.ko.md` (~line 39): mirror the same change in Korean for the sg-complete row, e.g.: `<N>은 단계를 완료(sg-phase 경유), <vX.Y>는 해당 마일스톤을 닫고, 비우면 현재 마일스톤을 닫음(gsd-complete-milestone 경유)`. Keep machine tokens (`/super-gsd:sg-complete`, `<N>`, `<vX.Y>`, `sg-phase`, `gsd-complete-milestone`) verbatim. Keep the `사용 시점` cell and table format intact.

Both edits target only the single sg-complete row. Verify EN/KO convey the same three behaviors.
  </action>
  <verify>
    <automated>cd /Users/gyuha/workspace/super-gsd && grep -E 'sg-complete' README.md | grep -qE 'sg-phase' && grep -E 'sg-complete' README.md | grep -q 'vX.Y' && grep -E 'sg-complete' README.ko.md | grep -qE 'sg-phase' && grep -E 'sg-complete' README.ko.md | grep -q 'vX.Y' && echo PASS</automated>
  </verify>
  <done>
Both READMEs' sg-complete rows describe the dual behavior (number → phase via sg-phase, vX.Y → close that milestone, empty → close current milestone) with machine tokens verbatim, table format preserved, and EN/KO in sync. No other rows touched.
  </done>
</task>

</tasks>

<verification>
- `skills/sg-complete/SKILL.md` routes by argument shape (version regex tested before number regex), preserves the `<language>` directive, preserves lessons-archive/HANDOFF/gsd-complete-milestone steps for the version+empty paths fed a vX.Y, delegates number to sg-phase complete with no milestone close, and prints the exact usage line for unknown input.
- README.md and README.ko.md sg-complete rows reflect the dual behavior and stay in sync.
- No version bump (plugin.json / package.json / CHANGELOG untouched).
- No `.agents/skills/sg-complete/` pair was created (none existed; verified).
</verification>

<success_criteria>
1. `/super-gsd:sg-complete <N>` completes a phase via `sg-phase complete` and never runs milestone close.
2. `/super-gsd:sg-complete <vX.Y>` closes that milestone (lessons archive + HANDOFF complete + gsd-complete-milestone), all fed the version.
3. `/super-gsd:sg-complete` (empty) reads STATE.md `milestone:` and closes THAT version; no phase number reaches gsd-complete-milestone.
4. Unknown argument prints exactly one usage line and exits with no delegation or mutation.
5. Both READMEs' sg-complete rows describe the dual behavior and are EN/KO consistent.
6. `<language>` directive preserved; version files untouched.
</success_criteria>

<output>
Create `.planning/quick/260528-fbn-improve-sg-complete-argument-routing-bar/260528-fbn-SUMMARY.md` when done.
</output>
