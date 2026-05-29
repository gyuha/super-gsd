# Codebase Concerns

**Analysis Date:** 2026-05-29

## Tech Debt

**`_pyJsonDumps` duplicated across three hook files:**
- Issue: The same ~50-line hand-rolled JSON serializer is inlined identically in `hooks/stop_hook.cjs`, `hooks/rule_runner.cjs`, and `hooks/lessons_ranker.cjs`. D-10 decision (v2.4 Phase 28) explicitly rejected a shared module to preserve 1:1 Python port mapping. That rationale is now historical — the migration is complete.
- Files: `hooks/stop_hook.cjs:21-44`, `hooks/rule_runner.cjs:21-52`, `hooks/lessons_ranker.cjs:41-48`
- Impact: A bug fix or divergence in one copy must be replicated manually in all three. This already happened during Phase 28 where each port independently rediscovered the same helper.
- Fix approach: Extract a `hooks/_lib.cjs` with `_pyJsonDumps` and `_pyEncodeString`; require it from all three. The byte-identical Python parity constraint no longer justifies triplication.

**Hardcoded `sg-execute` Step 9 routing activation never landed:**
- Issue: ROADMAP.md item `18-02-PLAN.md — sg-execute.md Step 9 TODO 활성화 (Skill() 라우팅 삽입)` has been open since v1.4 and is listed as unchecked in every milestone ROADMAP snapshot through v2.8.
- Files: `.planning/ROADMAP.md:165`
- Impact: Unknown — the routing was apparently superseded by `sg-parallel-execute` organic adoption, but the dead ROADMAP item creates confusion about whether the feature gap still exists.
- Fix approach: Audit `skills/sg-execute/SKILL.md` to confirm Step 9 routing is implemented; close or remove the stale ROADMAP item.

**`_globMd` dotfile divergence undocumented:**
- Issue: `_globMd("*")` in `hooks/lessons_ranker.cjs` returns dotfiles (via Node `readdirSync`), but the Python equivalent `glob.glob("*")` does not. No code comment documents this divergence. Currently has zero callers that would trigger it, but future callers using `.planning/*/foo.md`-style globs would silently receive fewer results than expected.
- Files: `hooks/lessons_ranker.cjs:130-146`
- Impact: Silent wrong results for any future `_globMd` caller using a wildcard pattern on directories containing dotfiles.
- Fix approach: Add a 2-line inline comment at `lessons_ranker.cjs:130` documenting the deviation (flagged as P2 in Phase 28 lessons, never actioned).

**STATE.md `Phase:` field is not automatically updated on phase transitions:**
- Issue: `sg-execute`, `sg-retro`, and other skills fall back to reading `STATE.md`'s `Phase:` field for phase resolution. This field goes stale after transitions — during Phase 28, the stale string `Phase: Not started (roadmap created, awaiting Phase 28 planning)` caused both `sg-execute` and `sg-retro` to fail, requiring manual override.
- Files: `skills/sg-execute/SKILL.md:41-58`, `skills/sg-retro/SKILL.md:25-38`, `skills/sg-next/SKILL.md:23-30`, `.planning/STATE.md`
- Impact: Any time STATE.md is not updated after a phase transition, phase-detection silently reads the wrong phase. HANDOFF.md is the authoritative source but is only consulted as a fallback.
- Fix approach: `sg-execute` and `sg-retro` should read HANDOFF.md slug first and use STATE.md as a fallback only, not primary source. Long-term: add a HANDOFF.md write to STATE.md `Phase:` sync step in `sg-complete`/`sg-phase`.

**`sg-complete N` vs `sg-phase complete N` naming inconsistency:**
- Issue: Two syntaxes exist for the same operation. `sg-complete` accepts a bare number and delegates to `sg-phase complete`. README.ko.md documents both forms, and Phase 41 lessons note command name confusion. `.agents/skills/sg-next/SKILL.md:111` routes to `$sg-complete` while `skills/sg-next/SKILL.md:117` routes to `/super-gsd:sg-complete`.
- Files: `skills/sg-complete/SKILL.md`, `skills/sg-phase/SKILL.md`, `README.ko.md:182`, `.agents/skills/sg-next/SKILL.md:111`
- Impact: Users (and skills) must remember which invocation style is canonical. Teaches muscle memory for the wrong command.
- Fix approach: Pick one canonical form; update README, TEAM.md, and all skill cross-references. Phase 41 lessons flagged as P2 action item, not yet actioned.

## Known Bugs

**`HANDOFF.md` header re-initialization on 6-column schema:**
- Symptoms: After v2.8 added a 6th `User` column to HANDOFF.md, a `grep -q "Timestamp.*Phase.*From.*To.*Plan Hash"` guard (partial string match) would trigger re-initialization of HANDOFF.md when a new 6-column header is present.
- Files: Multiple skills in `skills/sg-*/SKILL.md` and `.agents/skills/sg-*/SKILL.md` that check for HANDOFF.md header validity.
- Trigger: Running any skill that initializes HANDOFF.md on a repo that already has a 6-column-header HANDOFF.md.
- Workaround: Fixed in Phase 39 (commit 7c2d8c1) by using exact 6-column header matching. Verify that all skill files received the fix.

**`_readCurrentPhase` permissive regex creates malformed lesson filenames:**
- Symptoms: If STATE.md contains a multi-word phase description (e.g. `Phase: Not started (roadmap created, awaiting Phase 28 planning)`), the phase-detection regex preserves the full stale string, producing filenames like `Not started (roadmap created, awaiting Phase 28 planning)-2026-05-25.md` in `.planning/lessons/`.
- Files: `skills/sg-retro/SKILL.md` phase-parsing block
- Trigger: Running `sg-retro` when STATE.md `Phase:` field is stale or non-numeric.
- Workaround: Pass the phase number explicitly as `$ARGUMENTS` to `sg-retro`.

## Security Considerations

**`CLAUDE_PLUGIN_ROOT` environment variable path injection:**
- Risk: Both `stop_hook.cjs` and `rule_runner.cjs` use `process.env.CLAUDE_PLUGIN_ROOT` without validation to construct file paths for `config.json` and rule files. A compromised environment variable could cause the hooks to read from arbitrary filesystem locations.
- Files: `hooks/stop_hook.cjs:10-11,76`, `hooks/rule_runner.cjs:11-12,256,354`
- Current mitigation: Errors are swallowed silently (file not found returns `{}`). No path traversal escalation is possible since the hook output is a JSON systemMessage only.
- Recommendations: Add a basic check that `PLUGIN_ROOT` does not contain `..` before constructing paths.

## Performance Bottlenecks

**`sg-plan` concatenates all lessons files into the prompt:**
- Problem: `skills/sg-plan/SKILL.md:23-38` runs `cat .planning/lessons/*.md` and dumps the full content of every lesson file into the planning context. As lesson files accumulate, this grows without bound.
- Files: `skills/sg-plan/SKILL.md:23-38`
- Cause: The top-N weighted ranking is printed first, then the entire lessons corpus is appended verbatim.
- Improvement path: Replace the full `cat` dump with the top-N weighted output only, or cap the injected lessons to the most recent N files.

**`stop_hook.cjs` scans only the last 200 lines of the transcript:**
- Problem: `hooks/transcript_matcher.cjs:44` slices to the last 200 lines. For very long conversations, all detection signals must appear within this window or the hook silently fires no guidance.
- Files: `hooks/transcript_matcher.cjs:44`
- Cause: Fixed window to avoid loading arbitrarily large transcripts.
- Improvement path: The 200-line window is a reasonable heuristic, but it is undocumented. Add a comment explaining the rationale and the trade-off.

## Fragile Areas

**Signal detection in `transcript_matcher.cjs` — overly broad strings:**
- Files: `hooks/transcript_matcher.cjs:5-25`
- Why fragile: Signal strings like `'review complete'`, `'Review Summary'`, and `'plan-phase complete'` are plain substrings matched case-insensitively against raw transcript text. Any assistant output or user message that incidentally contains these phrases (e.g. discussing what a review summary is, or mentioning a past plan-phase) will fire the wrong systemMessage guidance.
- Safe modification: Make signal strings more specific (e.g., prefix with a unique marker) or switch to anchored-line matching.
- Test coverage: No unit tests. Detection logic is only exercised by the full integration path.

**D-07 duplication between `sg-next` and `sg-status`:**
- Files: `skills/sg-next/SKILL.md:26-79`, `skills/sg-status/SKILL.md`
- Why fragile: The `STATE.md Phase parsing block` and `HANDOFF.md stage detection block` are copy-pasted between `sg-next` and `sg-status` under the comment `D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift`. Manual synchronization is required whenever either block changes.
- Safe modification: Changes to HANDOFF.md parsing logic must be applied in both files or the skills diverge silently.
- Test coverage: None.

**Platform detection in `stop_hook.cjs` is binary and fragile:**
- Files: `hooks/stop_hook.cjs:85-88`
- Why fragile: `_detectPlatform()` returns `'claude-code'` if `CLAUDE_PLUGIN_ROOT` is set, `'other'` otherwise. The `'other'` path emits `$sg-execute`/`$sg-review`/`$sg-retro`/`$sg-ship` (Codex/Gemini syntax), but Codex and Gemini may diverge in future syntax. Any third platform gets Codex-style commands by default.
- Safe modification: Platform detection should be extended rather than relying on the binary present/absent check.
- Test coverage: None.

**`skills/` and `.agents/skills/` parity enforced manually only:**
- Files: All `skills/sg-*/SKILL.md` and their `.agents/` counterparts
- Why fragile: 10 skills exist in `skills/` with no `.agents/` equivalent (`sg-cleanup`, `sg-complete`, `sg-explore`, `sg-health`, `sg-lessons`, `sg-new`, `sg-phase`, `sg-quick`, `sg-ui-plan`, `sg-update`). Codex/Gemini users cannot invoke these commands. When any `skills/` SKILL.md is modified, CLAUDE.md requires manually mirroring the change to `.agents/skills/` — this was missed in Phases 36 and 39 (discovered only via code review).
- Safe modification: The CLAUDE.md pair-cover convention must be checked on every `skills/sg-*/SKILL.md` edit. Three Phase 32-recommended sg-rules (`warn-agents-read-comment-in-bash`, `warn-node-process-env-arguments`, `warn-read-inside-bash-fence`) were drafted in lessons but never created as `.claude/sg-rule.*.local.md` files.
- Test coverage: None; rule_runner fires only when rules exist.

## Scaling Limits

**Lessons corpus grows unboundedly:**
- Current capacity: 13 lesson files present as of 2026-05-29 (`.planning/lessons/*.md`).
- Limit: `sg-plan` injects all of them verbatim into the context window. At sufficient scale this will exceed model context limits or degrade planning quality with low-signal noise.
- Scaling path: Use only the top-N weighted output from `lessons_ranker.cjs` rather than the full corpus dump; archive older lessons more aggressively.

**`parallel_groups.json` cap at 3 concurrent agents per wave:**
- Current capacity: `sg-parallel-execute` dispatches up to 3 `Task()` agents per wave.
- Limit: Wave groups exceeding 3 plans queue as `OVERFLOW_GROUPS` and are dispatched in subsequent batches. `.planning/config.json` has a `max_parallel_agents` field but `sg-parallel-execute` does not read it — the cap is hardcoded in the skill text.
- Scaling path: Read `super_gsd.max_parallel_agents` from `.planning/config.json` in `sg-parallel-execute`.

## Dependencies at Risk

**Orphaned Python build artifacts (`hooks/__pycache__/`):**
- Risk: `hooks/__pycache__/` contains `.pyc` files for the deleted Python hooks (`lessons_ranker.cpython-314.pyc`, `rule_runner.cpython-314.pyc`, `stop_hook.cpython-314.pyc`, `transcript_matcher.cpython-314.pyc`). The Python hooks were replaced by `.cjs` equivalents in v2.4 but the pycache was not removed. `.gitignore` includes `__pycache__` so these are untracked, but the directory remains on disk.
- Impact: Confusing to maintainers; implies Python is still required.
- Migration plan: `rm -rf hooks/__pycache__` and `.pytest_cache/`.

**`sg-explore` has no `.agents/` equivalent:**
- Risk: `skills/sg-explore/SKILL.md` delegates to `gsd-map-codebase`. No `.agents/skills/sg-explore/` exists, so Codex/Gemini users cannot invoke codebase mapping.
- Impact: Silent capability gap for non-Claude-Code users.
- Migration plan: Create `.agents/skills/sg-explore/SKILL.md` mirroring `skills/sg-explore/SKILL.md`.

## Missing Critical Features

**No unit tests for any hook logic:**
- Problem: `hooks/lessons_ranker.cjs` contains `_roundHalfEven` (banker's rounding with IEEE-754 boundary handling), `_pyJsonDumps` (custom JSON serializer), and `_globMd` (custom glob). These have no automated test coverage. Phase 28 code review found a latent `_roundHalfEven` IEEE-754 bug that fixture corpus data happened to avoid.
- Blocks: Confident refactoring of hooks; safe modification of `_roundHalfEven`, `_pyJsonDumps`.

**`AGENTS.md` team workflow section missing (deferred to v2.9):**
- Problem: v2.8 added team collaboration features (HANDOFF user tracking, `sg-status --team`, branch workflow). `AGENTS.md` was not updated to document these for Codex/Gemini users. README.md references `AGENTS.md` for the "full workflow" on those platforms.
- Files: `AGENTS.md`, `README.md:233,247`
- Blocks: Codex/Gemini users following team workflow docs.

**Phase 32 sg-rule recommendations never implemented:**
- Problem: Phase 32 retrospective (`lessons/32-2026-05-25.md`) drafted three sg-rule files as P1 action items: `warn-agents-read-comment-in-bash`, `warn-node-process-env-arguments`, `warn-read-inside-bash-fence`. None were created in `.claude/`.
- Files: `.planning/lessons/32-2026-05-25.md:21-57`, `.claude/` (missing files)
- Blocks: Automated prevention of recurrence of high-severity bugs (`.agents/` bash-comment Read directives, `process.env.ARGUMENTS` usage, Read inside bash fence).

## Test Coverage Gaps

**`hooks/transcript_matcher.cjs` — no signal boundary tests:**
- What's not tested: Whether short transcripts, empty files, or missing `transcript_path` silently return `''` without error; whether broad signal strings trigger false positives on benign assistant output.
- Files: `hooks/transcript_matcher.cjs`
- Risk: A signal phrase appearing in a non-workflow context (e.g. user typing "let me review the summary") could fire incorrect next-step guidance silently.
- Priority: Medium

**`hooks/rule_runner.cjs` — no rule evaluation tests:**
- What's not tested: End-to-end rule matching for all operator types (`contains`, `equals`, `not_contains`, `starts_with`, `ends_with`); multi-condition AND logic; block vs warn output format.
- Files: `hooks/rule_runner.cjs`
- Risk: A broken operator or frontmatter parse regression could silently stop all rules from firing.
- Priority: Medium

**`hooks/lessons_ranker.cjs` — `_roundHalfEven` regression:**
- What's not tested: IEEE-754 half-boundary inputs (e.g. values where multiplying by `10^n` creates false exact halves). A latent bug was found and fixed in Phase 28 (commit `955a578`) but no regression test was added.
- Files: `hooks/lessons_ranker.cjs:50-103`
- Risk: Any future modification to `_roundHalfEven` can silently reintroduce the boundary bug.
- Priority: High

---

*Concerns audit: 2026-05-29*
