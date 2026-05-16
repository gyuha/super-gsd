# Features Research — v1.1 Reliability

**Domain:** CLI workflow orchestrator session management and diagnostics
**Researched:** 2026-05-16
**Confidence:** MEDIUM — patterns verified across multiple real tools (Claude Code, Gemini CLI, npm doctor, brew doctor, cc-health-check)

---

## Session Restoration

### Table Stakes

These are behaviors users expect from any tool that claims session continuity. Missing any of them means the feature feels broken.

**Detect existing state on startup.** Read HANDOFF.md + STATE.md on every `sg-start` invocation. If no data rows exist, proceed silently to new project flow. If data rows exist, branch to the resume path. This is identical to what Claude Code's `--continue` does: auto-detect the most recent session in the current directory. [HIGH — verified in Claude Code docs, Gemini CLI, claude-code-handoff tool]

**Surface the minimum context needed to decide.** Users need to answer one question: "Is this where I was?" Show them: current phase name, current stage (which of: gsd-plan / superpowers / review / hookify), timestamp of last handoff, and the next recommended command. Claude Code's session picker shows: session title/prompt, relative timestamp ("2 days ago"), message count, git branch. Gemini CLI shows: 1-line summary, message count, session ID, relative timestamp. The pattern is consistent — four data points, no more. [HIGH — verified Gemini CLI blog post, Claude Code session management article]

**Ask before resuming, not after.** Display state summary first, then a binary prompt: resume vs. start fresh. Never silently resume. Claude Code's `--continue` silently resumes (friction-free), but `--resume` always prompts (intentional friction). For `sg-start` inside an existing project, prompting is correct because starting fresh could lose planned work. [MEDIUM — inferred from Claude Code `--continue` vs `--resume` distinction]

**"Start fresh" must be safe and explicit.** Resuming to the wrong state is worse than not resuming. If user chooses "start fresh," that means invoking `sg-start` as if no prior state existed. It should not wipe HANDOFF.md — that's the append-only audit trail. [HIGH — append-only requirement is an existing project constraint documented in HANDOFF.md]

**The resume path ends with the correct next command.** After surfacing state and getting confirmation, print the same `Next: <command>` that `sg-status` would show. The user should be able to immediately run it. This closes the loop that `sg-status` already handles. [HIGH — direct dependency on existing STATUS-01 work]

### Differentiators

Features that meaningfully improve the experience beyond baseline, but users won't notice their absence immediately.

**Stale state warning with age threshold.** If the last HANDOFF.md row is older than N days (suggest: 7 days), flag it: "Last session was 12 days ago. Context may be stale — consider running sg-explore before continuing." Claude Code and Gemini CLI both show relative timestamps precisely so users can make this judgment. Automate the judgment for them. [MEDIUM — derived from the pattern of surfacing timestamps in all reviewed tools]

**In-progress plan signal.** STATE.md contains `Stopped at:` in the Session Continuity section. If this is non-empty, surface it: "Last work: Phase 03 complete — all 4 plans done." This is a one-line addition that directly answers "what was I doing?" — the most useful single piece of context. The claude-code-handoff tool does exactly this with its `current-task.md` file. [HIGH — STATE.md already has this field; it just needs to be read]

**Lessons count hint.** If `.planning/lessons/` has files, mention it: "3 lessons from prior sessions will be replayed in sg-plan." This signals continuity and reminds users of the system's value without requiring action. [MEDIUM — lessons directory and replay are existing features; surfacing the count costs nothing]

### Anti-features (avoid)

**Interactive session picker.** Gemini CLI and Claude Code offer multi-session pickers with arrow-key navigation. Do not implement this. super-gsd is single-project, single-session by design (Out of Scope: multi-project orchestration). There is only one session state per working directory. A picker would add complexity for a choice that doesn't exist. [HIGH — Out of Scope constraint in PROJECT.md is explicit]

**Session ID / UUID tracking.** Claude Code stores sessions in `~/.claude/projects/` keyed by UUID. This is a multi-session model. super-gsd's state is entirely in `.planning/` and is already the only state. No UUIDs needed. [HIGH — architecture uses files, not session store]

**Automatic silent resume.** Claude Code's `--continue` silently resumes without asking. For a workflow orchestrator where "starting fresh" means losing a phase plan, silent resume is too dangerous. Always prompt. [HIGH — the stakes of silently resuming the wrong state are higher than in a general chat session]

**State editing prompts.** Some handoff tools (claude-code-handoff) prompt you to annotate what you finished and what's next before saving. This is workflow overhead that belongs in `sg-review` / `sg-learn`, not `sg-start`. Keep `sg-start` read-only regarding state. [MEDIUM — idempotency constraint; sg-start should not write state]

---

## sg-status Accuracy

### Table Stakes

**Parse HANDOFF.md last data row for stage.** The current sg-status spec (D-27) already defines this correctly: grep for rows matching `^\| [0-9]{4}-`, take `tail -1`, extract the `To` column. The table-stakes task is simply implementing this exactly as specced rather than relying on any heuristic. [HIGH — spec exists in sg-status.md]

**Handle missing/empty HANDOFF.md gracefully.** When no data rows exist → stage is `init`, last handoff is `(none)`. This is the new project state. It must not error. [HIGH — defined in success criteria of sg-status.md]

**Three-line + next command output format.** The D-29 format is: `Phase: X (Name)`, `Stage: Y`, `Last handoff: Z`, blank line, `Next: <command>`. This matches the pattern used by Terraform (`terraform workspace show` outputs exactly the workspace name, nothing else) and git's branch reporting: minimal, parseable, no decoration. [HIGH — established in sg-status.md spec]

**Map stage to next command without ambiguity.** The D-28 mapping table is already fully specified. The key correctness requirement is the `hookify` branch: check whether ROADMAP.md has a next phase before deciding between `/gsd:discuss-phase N+1` and `/gsd:complete-milestone`. [HIGH — spec exists]

**Exit clearly on schema corruption.** If `To` column value is not in the enum (`init`, `gsd-plan`, `superpowers`, `review`, `hookify`), print the corruption message and exit. Don't guess. npm doctor and brew doctor both use this approach: surface the problem, don't paper over it. [MEDIUM — best practice from diagnostic tool research]

### Differentiators

**Machine-readable flag (`--json` or `--raw`).** The cc-health-check tool supports `--json` for CI pipelines. A `--json` flag on `sg-status` would allow scripting: `sg-status --json | jq '.stage'`. Low implementation cost, high scripting utility. [MEDIUM — pattern verified in cc-health-check; not yet scoped for v1.1]

**Relative timestamp alongside absolute.** Current spec uses raw timestamp string from HANDOFF.md. Showing "3 days ago" alongside the ISO timestamp (like Gemini CLI does) adds at-a-glance staleness detection without requiring users to do date math. [LOW — useful but not essential for v1.1]

### Anti-features

**Verbose output with explanations.** git status is valuable partly because it gives hints ("use git restore --staged..."). But sg-status's value is surgical — one glance, one action. Adding explanation text per line (like brew doctor --verbose) would dilute the signal. Keep the 3-line + Next format strict. [HIGH — D-29 establishes strict format as a design decision]

**Stage inference from file timestamps or content.** Some tools try to infer state from file modification times or content patterns. HANDOFF.md is the single source of truth. If it says `superpowers`, the stage is `superpowers`. Never infer stage from other signals. [HIGH — append-only HANDOFF.md is an established architectural decision]

**Auto-advance from sg-status output.** sg-status is read-only. It should not invoke anything. A user who wants to run the recommended next command can copy-paste it. Auto-advance is `super_gsd.auto_advance`'s job via hooks, not status's job. [HIGH — clear separation of concerns; sg-status is a diagnostic]

---

## sg-health Diagnostic

### Table Stakes

**Grouped checks with PASS/FAIL/WARN per line.** npm doctor uses three columns: Check name, Value, Recommendation. cc-health-check uses `[PASS]` / `[FAIL]` prefix per line, grouped into dimensions. The pattern is consistent across all real diagnostic tools. sg-health should use the same: one line per check, `[OK]` / `[WARN]` / `[FAIL]` prefix, grouped by category. [HIGH — verified across npm doctor, cc-health-check, brew doctor]

**Installation checks (three tools).** Verify GSD, Superpowers, and Hookify are each discoverable. The minimum check is: does the expected command file/skill exist at the known path? This is the single most common support issue for any plugin orchestrator — "why isn't X working?" → "X isn't installed." [HIGH — core dependency check, obvious table stakes]

**Hook registration check.** Verify `hooks/hooks.json` exists and contains Stop + SubagentStop entries. Verify the Python files referenced in hooks.json exist at the specified paths. This is the second most likely failure mode: hooks configured but pointing to wrong paths. [HIGH — hooks are the core automation mechanism; a misconfigured hook silently does nothing]

**HANDOFF.md schema check.** Verify: file exists, has the 5-column header, column order is correct, all data rows have valid `To` enum values. This is the HEALTH-01 requirement verbatim. [HIGH — explicitly scoped in PROJECT.md HEALTH-01]

**Overall verdict.** Print a summary line: "All checks passed" or "N issues found — see above." Exit code 0 on all OK/WARN, exit code 1 on any FAIL. This follows npm doctor and cc-health-check conventions and enables use in CI or shell conditionals. [HIGH — standard diagnostic tool pattern]

**Actionable fix hints on failure.** Each FAIL line should include a one-line remediation. Example: `[FAIL] hooks/hooks.json missing → run: cp hooks/hooks.json.example hooks/hooks.json`. brew doctor's criticism is that its warnings are "just for diagnostics, not actionable." sg-health should be the opposite. [MEDIUM — verified as differentiator in cc-health-check which explicitly provides one-click install commands]

### Differentiators

**config.json validation.** Check that `.planning/config.json` contains `super_gsd.auto_advance` key with a boolean value. A corrupted or missing config falls back silently at runtime — health check should surface it explicitly. [MEDIUM — straightforward check, catches a real failure mode]

**Lessons directory status.** Report how many lesson files exist in `.planning/lessons/`. This is informational (always WARN or OK, never FAIL) but gives users visibility into accumulated learning. [LOW — nice to have; purely informational]

**STATE.md parsing check.** Verify STATE.md exists, has required YAML frontmatter fields (`gsd_state_version`, `milestone`, `status`), and current phase is parseable. Correlation: sg-status depends on this. If STATE.md is malformed, sg-status will silently fail. [MEDIUM — depends on whether sg-status uses STATE.md; currently the spec reads it]

**Score / grade.** cc-health-check computes a 0-100 score and prints a grade label. For sg-health, this is probably overkill given the small check count (~8-10 checks). A simple pass/warn/fail count is sufficient. [LOW — adds complexity without proportional value at this scale]

### Anti-features

**Attempting to auto-fix issues.** brew doctor explicitly does not fix things — it tells you what's wrong and what to do. sg-health should follow this pattern. Auto-fixing hooks or config files risks overwriting intentional customizations. Read-only, always. [HIGH — diagnostic tools should not mutate state]

**Checking GSD/Superpowers/Hookify internal state.** sg-health should verify presence, not correctness of the other tools' internals. Testing whether GSD's planning phase logic works correctly is out of scope — that's GSD's own concern. Non-invasive principle applies here too. [HIGH — Non-invasive constraint in PROJECT.md]

**Network checks.** npm doctor checks registry connectivity. sg-health has no network dependencies — everything is local files and Claude Code hooks. Network checks would add latency and irrelevant failure modes. [HIGH — no network dependencies in this tool]

**Verbose mode by default.** brew doctor is silent when everything passes. sg-health should follow this: if all checks pass, print the OK lines briefly and end with "All checks passed." Don't force users to read a wall of green text. [MEDIUM — this is the brew doctor UX decision that works]

---

## UX Patterns to Follow

### Pattern: "Status before action" (git model)

git always shows state before suggesting action. `git status` tells you where you are; it never moves you anywhere. `git commit` then acts. sg-start should show the restored state summary (what `sg-status` would show) before asking "resume?" This separates understanding from decision.

Implementation: `sg-start` runs the same logic as `sg-status` internally, displays the 3-line summary, then prompts. It does not duplicate code — it calls the same parsing logic.

### Pattern: "Minimal, parseable output" (Terraform workspace show)

Terraform's `terraform workspace show` returns exactly the workspace name, one word, no decoration. sg-status's D-29 format follows this principle. The output is human-readable in terminal and trivially parseable in scripts. Resist the urge to add borders, colors, or padding. This is a text protocol.

### Pattern: "Grouped checks, per-line verdict" (npm doctor / cc-health-check)

```
[OK]   GSD installed at ~/.claude/skills/
[OK]   Superpowers installed at ~/.claude/skills/
[FAIL] Hookify not found — expected at ~/.claude/skills/hookify/
[OK]   hooks/hooks.json present (Stop + SubagentStop)
[FAIL] hooks/stop_hook.py: file not found at path referenced in hooks.json
[OK]   .planning/HANDOFF.md schema valid (0 data rows)
[OK]   .planning/STATE.md frontmatter parseable
[WARN] .planning/config.json missing — using defaults

2 issues found. Fix FAIL items above before running sg-execute.
```

Each line: prefix + check name + value or note. Grouped by category (installation, hooks, state files). Summary count at end. Exit code 1 when any FAIL present.

### Pattern: "Relative timestamp for staleness" (Gemini CLI)

Gemini CLI shows "2 days ago" in the session browser. For `sg-start` resume path, show both the ISO timestamp (from HANDOFF.md) and a human relative form: "Last handoff: 2026-05-10T09:14:22Z (6 days ago)." This allows instant staleness judgment without date arithmetic.

### Pattern: "Ask binary question, default to safe" (interactive CLIs)

When `sg-start` detects an existing session and prompts the user, the default (Enter key) should be the safer choice. Resuming is safer than discarding. Present as: "Resume from Stage: superpowers? [Y/n]" — uppercase Y means default. This is the convention used by apt, npm init, and brew installation prompts universally.

### Pattern: "Diagnostic only, fix manually" (brew doctor)

brew doctor reports issues and stops. It does not patch Homebrew. sg-health follows this: describe the problem, give the one-line fix command, let the user execute it. This avoids the category of bugs where the doctor corrupts the patient.

---

## Dependency Map

The three features have a strict dependency order:

```
STATUS-01 (HANDOFF.md parsing logic)
    ↓ reused by
SESS-01 (session restoration — reads same parsed state)
    ↓ informs
HEALTH-01 (validates the files that STATUS-01 and SESS-01 depend on)
```

Build STATUS-01 first. Its parsing logic (read HANDOFF.md last row, extract To column, map to next command) is the shared core. SESS-01 calls this same logic and wraps it in a resume prompt. HEALTH-01 validates that the files this logic depends on are structurally sound.

---

## Complexity Estimates

| Feature | Complexity | Reason |
|---------|-----------|--------|
| Session restoration (SESS-01) | Medium | New prompt flow in sg-start, but logic reuses sg-status parsing |
| sg-status accuracy (STATUS-01) | Low | Spec is fully defined (D-27/D-28/D-29), pure implementation task |
| sg-health (HEALTH-01) | Low-Medium | ~8 file existence checks + HANDOFF.md schema validation; new command but simple logic |

None of these features require network access, external APIs, or changes to GSD/Superpowers/Hookify files. All complexity is local file I/O and string parsing.

---

**Sources consulted:**
- [Gemini CLI Session Management](https://developers.googleblog.com/pick-up-exactly-where-you-left-off-with-session-management-in-gemini-cli/)
- [Claude Code --continue and --resume guide](https://pasqualepillitteri.it/en/news/366/claude-code-continue-resume-guide)
- [claude-code-handoff tool](https://github.com/Sonovore/claude-code-handoff)
- [npm doctor official docs](https://docs.npmjs.com/cli/v11/commands/npm-doctor/)
- [cc-health-check for Claude Code](https://github.com/yurukusa/cc-health-check)
- [Homebrew doctor discussion](https://github.com/orgs/Homebrew/discussions/5673)
- [Claude Code session context issue](https://github.com/anthropics/claude-code/issues/43696)
