# Codebase Concerns

**Analysis Date:** 2026-05-29

## Tech Debt

**D-07 Replicated Code Blocks — Stage Routing & STATE.md Parsing:**
- Issue: Three bash blocks (STATE.md Phase parsing, HANDOFF.md stage detection, next-command routing) are copy-pasted verbatim across `skills/sg-status/SKILL.md`, `skills/sg-next/SKILL.md`, and `skills/sg-start/SKILL.md`. The comment marker `D-07: replicated ... update both simultaneously on drift` is the only synchronization mechanism.
- Files: `skills/sg-status/SKILL.md`, `skills/sg-next/SKILL.md`, `skills/sg-start/SKILL.md`
- Impact: A routing change (e.g., adding a new stage enum value) requires manually editing three files. A past lesson (32-2026-05-25.md) already flagged "D-07 drift-sync 인라인 복제 블록 정기 검증" as P2.
- Fix approach: Extract the routing table into a shared data file (e.g., a JSON enum map) that skills read at runtime. Until then, any stage enum change must touch all three files simultaneously.

**HANDOFF.md Header Guard Does Not Detect 5-Col → 6-Col Schema Migration:**
- Issue: All eight skills that initialize HANDOFF.md use the guard `grep -q "Timestamp.*Phase.*From.*To.*Plan Hash"`. The old 5-column header (`| Timestamp | Phase | From | To | Plan Hash |`) satisfies this regex, so a HANDOFF.md created before the 6-column User column was added (Phase 39) will never be re-initialized to include the `User` column header. The P1 action item from Phase 39 lessons (`39-2026-05-28.md`) states this bug was identified but the fix was not applied — all skills still use the same partial-match guard.
- Files: `skills/sg-execute/SKILL.md`, `skills/sg-plan/SKILL.md`, `skills/sg-review/SKILL.md`, `skills/sg-ship/SKILL.md`, `skills/sg-retro/SKILL.md`, `skills/sg-complete/SKILL.md`, `skills/sg-next/SKILL.md`, `skills/sg-ui-plan/SKILL.md`
- Impact: Existing installations that ran phases before Phase 39 have a HANDOFF.md without a `User` column header. `sg-status --team` reads `$7` (User column), which will return incorrect data on old files. The `awk -F'|' '{print NF}'` check in `sg-health` expects `NF == 8` but old rows have `NF == 7`, so `sg-health` flags old HANDOFF.md rows as `[FAIL]`.
- Fix approach: Change the guard to `grep -q "Timestamp.*Plan Hash.*User"` and update the condition in all eight skills.

**HANDOFF.md Schema Documentation Stale:**
- Issue: The inline schema doc in `.planning/HANDOFF.md` (line 16) lists the stage enum as `init, gsd-plan, superpowers, review, hookify, ship, complete`. The actual enum used in `sg-status` and `sg-next` is `gsd-plan, ui-plan, superpowers, parallel, execute, review, sg-retro, ship, complete, sg-next`. Values `hookify`, `execute-done`, `context-done`, and `sg-discuss` appear in actual HANDOFF.md data rows but are absent from both the documentation and the validation switch-case in the skills.
- Files: `.planning/HANDOFF.md` (schema comment, line 16), `skills/sg-status/SKILL.md` (validation case), `skills/sg-next/SKILL.md` (validation case)
- Impact: Future contributors or tools reading the schema doc will encounter undocumented stage values in the log. The validation `case` exits with error code 1 on unknown stages — historical rows with `hookify` would trigger that exit if re-parsed.
- Fix approach: Update the schema doc enum list to match the code. Add `hookify` (legacy) to the validation case as a pass-through.

**`marketplace.json` Version Out of Sync with `plugin.json` and `package.json`:**
- Issue: `plugin.json` and `package.json` both show `version: "0.0.47"`, but `.claude-plugin/marketplace.json` shows `version: "0.0.28"`. The deployment procedure in `CLAUDE.md` only updates `plugin.json` and `package.json` — `marketplace.json` is not in the checklist.
- Files: `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, `package.json`, `CLAUDE.md`
- Impact: The marketplace entry advertises a stale version (0.0.28 vs actual 0.0.47), which breaks version-based upgrade detection for users installing from the Claude Code marketplace.
- Fix approach: Add `marketplace.json` version update to the deployment checklist in `CLAUDE.md` and to the version-bump procedure.

**Undocumented `18-02-PLAN.md` TODO Persists Across Multiple ROADMAP Versions:**
- Issue: `.planning/ROADMAP.md` line 165 contains `- [ ] 18-02-PLAN.md — sg-execute.md Step 9 TODO 활성화 (Skill() 라우팅 삽입)`. This same uncompleted item appears identically in archived milestone ROADMAPs: `v1.3-ROADMAP.md`, `v1.4-ROADMAP.md`, `v2.4-ROADMAP.md`, `v2.5-ROADMAP.md`, `v2.6-ROADMAP.md`, `v2.7-ROADMAP.md`, `v2.8-ROADMAP.md`.
- Files: `.planning/ROADMAP.md` line 165
- Impact: The item has been silently carried forward through 7 milestone versions without being actioned or formally deferred. It is unclear whether the routing insertion is still needed or has been superseded.
- Fix approach: Determine current relevance. If resolved by later work, remove it. If still needed, create a proper phase entry. If deferred, add a `[v2.9]` label with an explicit decision.

## Known Bugs

**`sg-health` Success Criteria Lists "Hookify" as Item 3 but No Such Step Exists in Process:**
- Symptoms: `sg-health` success_criteria item 1 reads "All 8 diagnostic items (GSD, Superpowers, **Hookify**, Hook scripts, Stop hook, SubagentStop hook, HANDOFF.md, STATE.md) are printed." However, the process block contains only 7 numbered steps (GSD, Superpowers, Hook scripts, Stop hook, SubagentStop hook, HANDOFF.md, STATE.md) plus a Summary step. There is no Hookify check in the process.
- Files: `skills/sg-health/SKILL.md` (objective line 14, process steps 1-7, success_criteria item 1)
- Trigger: Run `/super-gsd:sg-health` — the output will have 7 items, not 8, but the skill claims 8.
- Workaround: None. The mismatch means the success criterion cannot be verified as written.

**HANDOFF.md Data Rows Before Phase 39 Are Missing the User Column:**
- Symptoms: Rows written before Phase 39 (first 185 entries in `.planning/HANDOFF.md`) have only 5 pipe-delimited fields. When `sg-status --team` runs `awk -F'|' '{... $7 ...}'` to extract the User column, it gets empty values. `sg-health` column check (`NF == 8`) will report FAIL on these rows since `NF == 7`.
- Files: `.planning/HANDOFF.md` (rows 23-185), `skills/sg-status/SKILL.md` (Step 0 --team aggregation), `skills/sg-health/SKILL.md` (Step 6 NF check)
- Trigger: Run `sg-status --team` on a repo with legacy rows; run `sg-health` on same repo.
- Workaround: `sg-status --team` fallback to `git log` activates when no User-column data is found — but the detection condition may not trigger correctly for mixed-schema files.

## Security Considerations

**`bin/setup.js` Copies `hooks/` Directory Including `__pycache__/`:**
- Risk: The `files` field in `package.json` includes `"hooks/"`. The `hooks/__pycache__/` directory contains compiled `.pyc` files (Python bytecode for the deleted Python implementation). The `.gitignore` excludes `__pycache__/` from git, but `npm pack` does not honor `.gitignore` unless a `.npmignore` is present. These bytecode files will be included in the published npm package and copied to target projects.
- Files: `package.json` (files field), `hooks/__pycache__/` (4 `.pyc` files), `bin/setup.js`
- Current mitigation: `.gitignore` prevents accidental commit; no `.npmignore` exists.
- Recommendations: Add a `.npmignore` (or `files` array exclusion) to exclude `hooks/__pycache__/` from the npm package. Alternatively, delete the `__pycache__/` directory entirely — the Python source files no longer exist.

**Gemini Hook Uses `$GEMINI_PROJECT_DIR` Without Validation:**
- Risk: `.gemini/settings.json` constructs hook paths as `node $GEMINI_PROJECT_DIR/hooks/stop_hook.cjs`. If `GEMINI_PROJECT_DIR` is unset or contains spaces/special characters, the command will fail or execute unintended paths.
- Files: `.gemini/settings.json`
- Current mitigation: The note in `settings.json` acknowledges "Antigravity CLI compatibility not confirmed."
- Recommendations: Quote the variable: `node "$GEMINI_PROJECT_DIR/hooks/stop_hook.cjs"`.

## Performance Bottlenecks

**`sg-execute` Step 8.5 Parallel Group Analysis — Pure Bash Complexity:**
- Problem: The parallel group detection in `skills/sg-execute/SKILL.md` Step 8.5 is ~100 lines of nested bash using `awk`, `grep`, here-docs, and string manipulation. It runs on every `sg-execute` invocation even when no `wave:` fields exist.
- Files: `skills/sg-execute/SKILL.md` (Step 8.5, lines ~166-279)
- Cause: No short-circuit for the common case (no `wave:` fields); the `HAS_WAVE` check exists but the surrounding loop still allocates variables.
- Improvement path: Move the parallel group computation to a Node.js helper script (similar to `lessons_ranker.cjs`) — faster, testable, and less fragile than bash string building.

**`sg-plan` Step 0 Lessons Injection — Reads All `.md` Files Every Run:**
- Problem: `sg-plan` and `sg-execute` both run `cat .planning/lessons/*.md` and pipe through `lessons_ranker.cjs` on every invocation. As lessons accumulate, this output can become very large.
- Files: `skills/sg-plan/SKILL.md` (Step 0), `skills/sg-execute/SKILL.md` (Step 0)
- Cause: No cap on the `cat` output — only the ranker top-N is capped, but the full dump via `=== All Lessons ===` section is uncapped in `sg-plan`.
- Improvement path: Add a line cap (e.g., last 500 lines) to the full lessons dump in `sg-plan`, or remove the full dump and keep only the weighted top-N.

## Fragile Areas

**`sg-retro` Transcript Path Construction:**
- Files: `skills/sg-retro/SKILL.md` (Step 3b, line 170)
- Why fragile: The transcript directory is constructed as `$HOME/.claude/projects/$(pwd | tr '/' '-' | sed 's/^-//')`. If the project path contains characters that survive `tr` but produce a different string than Claude Code uses internally to create the transcript directory, no transcript will be found. The conversion is not documented as the canonical form Claude Code uses.
- Safe modification: Do not change the `tr`/`sed` pipeline without verifying against actual Claude Code transcript directory names. The current pattern has been noted in lessons (`32-2026-05-25.md`) as needing explicit documentation in SKILL.md.
- Test coverage: No automated test; relies on manual `analyze` lens execution.

**`hooks/rule_runner.cjs` YAML Frontmatter Parser — Documented Edge-Case Divergence:**
- Files: `hooks/rule_runner.cjs` (lines 261-273, `_matchCondition`)
- Why fragile: The comment at line 269 explicitly documents a known Python/JS behavioral divergence: when a `tool_input` field value is `null`, Python coerces it to the string `'None'` while JS `String(null)` returns `'null'`. Any rule that patterns-matches against `None` in a null-valued field will silently behave differently in the Node.js port.
- Safe modification: When adding new rules that might match against null-valued tool input fields, verify behavior in both Python and JS semantics explicitly.
- Test coverage: "rule_runner fixtures do not exercise" this case per the inline comment.

**`sg-parallel-execute` — Hard 3-Group Concurrency Cap:**
- Files: `skills/sg-parallel-execute/SKILL.md` (Step 3, Step 5)
- Why fragile: The skill caps concurrent Task()s at 3 per wave (EXEC_COUNT = min(len(WAVE_GROUPS), 3)), then processes OVERFLOW_GROUPS sequentially. If a wave has 4+ independent groups, the 4th+ groups run sequentially, defeating the parallelism goal without any user-visible warning that overflow has occurred.
- Safe modification: The overflow path is correct but silent; add a log line when OVERFLOW_GROUPS is non-empty.
- Test coverage: No automated test for the overflow path.

**`sg-next` Scan-Back for `sg-next` Self-Reference:**
- Files: `skills/sg-next/SKILL.md` (Step 2, lines 52-63), `skills/sg-status/SKILL.md` (Step 2)
- Why fragile: When the last HANDOFF.md row has `To=sg-next`, the skill reads the `From` column of the same row. If that `From` is also `sg-next` (a "corrupted chain"), it scans back through all rows to find the last non-`sg-next` stage. This scan-back is present in sg-next but the sg-status implementation uses a different scan approach (different awk one-liner). The two implementations can diverge when the same edge case is encountered, producing inconsistent stage detection between `sg-status` and `sg-next`.
- Safe modification: The D-07 drift note says "update both simultaneously" but the implementations are not identical — any logic change must be verified in both files independently.

## Scaling Limits

**HANDOFF.md Append-Only Growth:**
- Current capacity: 208 rows as of 2026-05-29, covering 41 phases.
- Limit: No theoretical limit, but `grep` and `awk` parsing of the full file on every `sg-*` command invocation will slow as the file grows. At current rate (~5 rows/phase), a 100-phase project generates ~500 rows.
- Scaling path: No archival mechanism exists for HANDOFF.md (unlike lessons, which have `--archive`). A periodic compaction step (keep last N rows, archive the rest) would maintain performance.

## Dependencies at Risk

**No Runtime Dependencies — Zero Lock File:**
- Risk: `package.json` has no `dependencies` or `devDependencies` fields — all hook scripts use only Node.js built-ins (`fs`, `path`, `util`). This is a strength for stability but means no automated security scanning (Dependabot, `npm audit`) is configured.
- Impact: Low risk today; the only risk is if a Node.js built-in API is deprecated or removed in a future major version.
- Migration plan: Add a CI workflow to run `node --version` checks against hooks when the project adopts CI.

## Missing Critical Features

**No Automated Tests for Hook Scripts:**
- Problem: `hooks/stop_hook.cjs`, `hooks/rule_runner.cjs`, `hooks/transcript_matcher.cjs`, and `hooks/lessons_ranker.cjs` are production-critical code paths that run on every hook event. Zero automated tests exist (the `.pytest_cache/` directory is a leftover from the deleted Python implementation containing an empty `nodeids` file).
- Blocks: Without tests, any refactor of the D-07 replicated blocks or the HANDOFF.md guard fix must be verified manually by running the full workflow.
- Priority: High — the hooks are the only layer that can silently break the auto-advance loop.

**10 Skills Lack `.agents/skills/` Mirrors:**
- Problem: `skills/` contains 21 skills; `.agents/skills/` mirrors only 11. The 10 missing skills (`sg-cleanup`, `sg-complete`, `sg-explore`, `sg-health`, `sg-lessons`, `sg-new`, `sg-phase`, `sg-quick`, `sg-ui-plan`, `sg-update`) are unavailable on Codex, Gemini CLI, and Antigravity CLI platforms.
- Files: `skills/sg-cleanup/`, `skills/sg-complete/`, `skills/sg-explore/`, `skills/sg-health/`, `skills/sg-lessons/`, `skills/sg-new/`, `skills/sg-phase/`, `skills/sg-quick/`, `skills/sg-ui-plan/`, `skills/sg-update/`
- Blocks: Non-Claude-Code users cannot access milestone management (`sg-complete`), health diagnostics (`sg-health`), or phase editing (`sg-phase`).

**`AGENTS.md` Team Workflow Section Missing (Deferred to v2.9):**
- Problem: Phase 41 lesson (`41-2026-05-28.md`, item P3) explicitly deferred "AGENTS.md 팀 워크플로우 섹션 추가" to v2.9. The current `AGENTS.md` describes single-user Codex/Gemini usage but does not document the team collaboration workflow introduced in v2.8 (HANDOFF.md User column, `sg-status --team`, branch workflow).
- Files: `AGENTS.md`
- Priority: Medium — team features shipped in v2.8 are undocumented for non-Claude-Code users.

## Test Coverage Gaps

**Hook Scripts — Zero Test Coverage:**
- What's not tested: All four `.cjs` hook scripts, including critical paths like `_parseFrontmatter` in `rule_runner.cjs`, `detectSignal` in `transcript_matcher.cjs`, `computeScores`/`_roundHalfEven` in `lessons_ranker.cjs`, and the config-guard branch in `stop_hook.cjs`.
- Files: `hooks/rule_runner.cjs`, `hooks/stop_hook.cjs`, `hooks/transcript_matcher.cjs`, `hooks/lessons_ranker.cjs`
- Risk: The Python-to-Node.js migration (v2.4) documented multiple "byte-identical parity" requirements. The documented edge-case divergence in `rule_runner.cjs` line 269 (`None` vs `null`) is unexercised.
- Priority: High

**Skill SKILL.md Logic — No Integration Tests:**
- What's not tested: The bash blocks inside SKILL.md files are interpreted at runtime by Claude. No test harness verifies that the bash pipeline in `sg-execute` Step 8.5 correctly computes parallel groups, or that the stage routing in `sg-status`/`sg-next` produces consistent output.
- Files: All `skills/*/SKILL.md` files
- Risk: Drift between `sg-status` and `sg-next` stage detection is undetectable without a test.
- Priority: Medium

---

*Concerns audit: 2026-05-29*
