# Pitfalls Research — v1.1 Reliability

**Domain:** Claude Code plugin — session state management, TSV parsing, diagnostic tooling
**Researched:** 2026-05-16
**Scope:** Adding session restoration to sg-start, HANDOFF.md-based stage detection for sg-status, and sg-health diagnostic command

---

## Session Restoration Pitfalls

### Pitfall 1: STATE.md frontmatter vs. body desync

**What goes wrong:** `Phase:` in the YAML frontmatter says `3` but the `## Current Position` body says `Phase: Not started`. `_read_current_phase()` in `stop_hook.py` searches `re.search(r'^Phase:\s*(\S+)', content, re.MULTILINE)` — this hits the body line before the frontmatter equivalent on some files (frontmatter `Phase:` does not exist in current STATE.md; body line is `Phase: Not started`). When sg-start restoration reads this, it surfaces the wrong human-readable state to the user.

**Why it happens:** STATE.md has two authoring paths — GSD's automated updater writes frontmatter, humans or the AI patch the body section. They can diverge between sessions with no enforcement.

**Consequence:** sg-start shows "you were on Phase 3" but the actual work was never started, or vice versa. User resumes from wrong context, wastes a prompt turn correcting it.

**Prevention:**
- Read HANDOFF.md last row as the authoritative stage source (it is append-only and machine-written). Use STATE.md only for phase number/name metadata, not for stage truth.
- When reading STATE.md body, extract phase number from the `^Phase: (\d[\w.-]*)` pattern rather than the `Phase: Not started` prose. Fall back to frontmatter `milestone:` if body is unparseable.
- Restoration should display both sources and flag a mismatch explicitly rather than silently picking one.

**Phase:** SESS-01

---

### Pitfall 2: HANDOFF.md missing or empty — no graceful default

**What goes wrong:** sg-start runs on a fresh clone or after someone manually deleted `.planning/HANDOFF.md`. The restoration logic attempts to read the file, gets FileNotFoundError, and either crashes silently or presents a misleading "no prior session" without distinguishing "truly fresh" from "file was deleted."

**Why it happens:** The file is created on first `sg-execute` call; it does not exist at project init time. `sg-start` currently does not touch HANDOFF.md at all.

**Consequence:** False "no prior session" message even though STATE.md shows work was done. User does not get the resume prompt that would have re-oriented them.

**Prevention:**
- Check for file existence before opening. If missing and STATE.md shows phase > 0, surface warning: "HANDOFF.md missing — cannot determine stage. Check .planning/STATE.md manually."
- If both are missing/empty, stage defaults to `init` (same as sg-status D-27 rule). This is the one case where "no prior session" is correct.

**Phase:** SESS-01

---

### Pitfall 3: Conflicting signals — HANDOFF.md says `superpowers`, STATE.md says `hookify`-era phase

**What goes wrong:** User ran hookify but did not run sg-execute for the next phase. HANDOFF.md last row `To` is `superpowers` (from the previous cycle), but STATE.md body says the phase is further along. sg-start restoration reads HANDOFF.md `To` and tells the user to go back to `/hookify`, skipping the phase that was already done.

**Why it happens:** HANDOFF.md tracks only explicit `sg-execute` handoffs. Hookify completion does not write a row. The gap between `superpowers` → `hookify` is not recorded unless sg-learn explicitly appended a row.

**Consequence:** Session restoration recommends wrong next command. User re-runs hookify unnecessarily.

**Prevention:**
- sg-learn should append a `hookify` row to HANDOFF.md on execution (if not already present for this phase + plan hash). This closes the tracking gap.
- Restoration logic should cross-check: if HANDOFF.md says `superpowers` but STATE.md phase is the same phase and lessons file exists for that phase, infer that hookify already ran and suggest next phase instead.
- Clearly document in HANDOFF.md schema that hookify completion must be recorded.

**Phase:** SESS-01 (detection); depends on sg-learn writing HANDOFF.md row — may require a sub-task in that command.

---

### Pitfall 4: Empty last row / trailing whitespace mistaken for data

**What goes wrong:** The table has a visual trailing blank line or a row of only `| | | | | |`. The `grep -E '^\| [0-9]{4}-'` pattern in sg-status correctly skips it (requires timestamp-shaped start), but a raw Python restoration that splits on `\n` and takes `lines[-1]` will get an empty string and crash on column extraction.

**Why it happens:** Markdown table editors often add trailing newlines. Append-only write code that uses `f.write(row + '\n')` is fine, but if a human edits the file or a tool reformats it, blank lines appear.

**Prevention:**
- In Python: strip lines and filter empty before taking `[-1]`.
- Prefer the same `grep -E '^\| [0-9]{4}-' | tail -1` idiom used in sg-status for all parsers — it is whitespace-immune.

**Phase:** SESS-01, STATUS-01

---

## HANDOFF.md Parsing Pitfalls

### Pitfall 1: TSV-ish Markdown table column misalignment from padding inconsistency

**What goes wrong:** The table uses `|`-delimited rows. Column extraction via `awk -F'|' '{print $5}'` assumes exactly 5 data columns plus leading/trailing pipes = 7 `|`-split fields. If a value in any column contains a `|` character (e.g., a plan hash that was manually patched with a note like `abc123|fix`), awk shifts all subsequent columns by one and extracts the wrong value for `To`.

**Why it happens:** Markdown table pipes are not escaped. Plan Hash column is 7-char hex (safe), but Phase column can contain arbitrary text if a human edits it.

**Consequence:** `To` column extracts garbage, sg-status prints "Unknown stage" error, the user sees a broken status line every time.

**Prevention:**
- Add schema validation in sg-health: assert each data row has exactly 7 pipe characters (`echo "$ROW" | tr -cd '|' | wc -c` should equal 6 — 5 fields + 2 border pipes).
- Lock Phase column to the `\d+-[\w-]+` pattern in sg-execute before appending.
- In Python parsers, split on `|` and assert `len(parts) == 7` before extracting by index.

**Phase:** HEALTH-01 (validation); STATUS-01 (parser hardening)

---

### Pitfall 2: `To` column extraction returns empty string on malformed row

**What goes wrong:** `awk -F'|' '{gsub(/ /,"",$5); print $5}'` — if $5 is just spaces (separator row `| --- | --- |...`) or the row matched by grep is actually the schema separator, the result is an empty string. sg-status then hits the "not one of init/gsd-plan/..." branch and prints a corruption error, which is a false positive.

**Why it happens:** The `grep -E '^\| [0-9]{4}-'` pattern anchors on a timestamp, so separator rows (`| ---- |`) are already excluded. The real risk is if a data row has a space-only `To` column (human forgot to fill it in).

**Prevention:**
- After awk extraction, check `[ -z "$STAGE" ]` before the enum validation — map empty string to `init` and log a warning rather than hard error.
- sg-execute must validate `To` is non-empty before appending. This prevents the malformed row from entering.

**Phase:** STATUS-01

---

### Pitfall 3: Concurrent write collision — sg-execute appending while sg-status reads

**What goes wrong:** On a fast machine, sg-execute runs in one Claude Code subagent while sg-status is invoked in the same session. The append (`>>`) to HANDOFF.md is not atomic on all filesystems. sg-status reads a partial row (truncated mid-write) and gets a column count mismatch.

**Why it happens:** Bash `>>` append is not atomic for writes > pipe buffer size. A 150-byte TSV row is well under the 4KB pipe buffer, so this is low probability — but not zero, especially over network filesystems (NFS, SMB) or Docker volumes.

**Consequence:** sg-status reads truncated row, extracts garbled stage, prints false corruption warning.

**Prevention:**
- Write to a `.tmp` file, then `mv` (atomic rename) to the final path. This is the standard POSIX write-then-rename pattern.
- Alternatively, use a Python writer with `fcntl.flock(f, fcntl.LOCK_EX)` before append and release after. This handles concurrent writes but not concurrent read-during-write scenarios.
- For this system's actual usage pattern (single user, sequential commands), the risk is low. Flag as LOW priority — document the known limitation in sg-health output.

**Phase:** Cross-cutting; LOW priority for v1.1. Document in HEALTH-01 output as known limitation.

---

### Pitfall 4: File encoding issues — UTF-8 BOM or non-UTF-8 phase names

**What goes wrong:** A phase name like `인계-테스트` appears in the Phase column. Bash `awk` with default locale on macOS and some Linux systems treats multi-byte characters correctly, but `wc -c` pipe counts bytes not characters — pipe count check for `|` characters passes, but column content is garbled in the extracted string.

**Why it happens:** Phase column is free-form text that GSD's Korean-language conventions can populate with Korean characters.

**Prevention:**
- `awk` column extraction is fine — it splits on `|` and prints raw bytes, which Python then decodes correctly.
- The real risk is if a phase name contains a literal `|` character — prevent that in sg-execute by validating the phase name pattern before writing.
- sg-health should open HANDOFF.md with `encoding='utf-8'` (not system default) in Python parsers.

**Phase:** HEALTH-01 (validation), STATUS-01 (parser)

---

## sg-health Pitfalls

### Pitfall 1: False negative — showing "healthy" when a dependency is not actually usable

**What goes wrong:** sg-health checks that `gsd-new-project` skill file exists on disk, but the Claude Code plugin registration is broken (plugin not in marketplace, or hooks.json path is wrong). The disk check passes, but the skill cannot actually be invoked.

**Why it happens:** File existence and plugin registration are two separate states. A plugin can be installed but not registered with Claude Code's active session.

**Consequence:** User runs sg-start expecting GSD to launch and gets "skill not found" error mid-session. They already passed the health check, so they trust the tool.

**Prevention:**
- Check the hooks registration separately from file existence: verify `${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json` exists AND is valid JSON AND contains at least one `Stop` hook with the correct command path.
- For dependency plugins (GSD, Superpowers, Hookify), check both the skill file AND whether the `.claude-plugin/plugin.json` for that plugin exists in the expected location. If the location is unknown, document that sg-health can only verify file presence, not live registration — and say so in the output.
- Never report "All systems go" without hedging: "Installation files found — live registration not verifiable without invoking the skill."

**Phase:** HEALTH-01

---

### Pitfall 2: False positive — reporting broken when the user has a non-standard install path

**What goes wrong:** sg-health hard-codes the expected location of GSD as `~/.claude/plugins/get-shit-done-cc/`. A user who installed GSD via a different method (e.g., from a fork, at a custom path, or via npm global) will get "GSD not found" even though GSD works fine.

**Why it happens:** Claude Code has no standardized plugin discovery API. The install paths vary by installation method.

**Consequence:** User runs sg-health on a working system and gets false "GSD missing" error. They lose trust in the diagnostic tool or waste time reinstalling a working dependency.

**Prevention:**
- Try multiple known paths in order: `~/.claude/plugins/`, `~/.config/claude/plugins/`, `${CLAUDE_PLUGIN_ROOT}/../`. Report which paths were checked.
- Clearly label the check as "looking for known install paths" — not "definitively confirming GSD is installed."
- Offer a manual override: if `SG_HEALTH_GSD_PATH` environment variable is set, use that path instead.
- Treat missing dependency as WARNING, not ERROR, and show the checked paths so the user can diagnose.

**Phase:** HEALTH-01

---

### Pitfall 3: Slow checks blocking the user — sequential file I/O and path traversal

**What goes wrong:** sg-health checks 10+ paths sequentially (hooks.json, plugin.json for 3 plugins, STATE.md, HANDOFF.md schema, config.json, lessons directory, etc.). On a network filesystem or a slow machine, this takes 3-5 seconds. The user sees nothing and assumes the command hung.

**Why it happens:** Shell `ls` and `cat` calls are sequential by default. Each takes a filesystem round-trip.

**Prevention:**
- Run all file existence checks in parallel using `&` + `wait`: group checks into: (a) local `.planning/` files, (b) hooks files, (c) dependency plugin paths. Launch all three groups simultaneously.
- Print a "Checking..." header immediately before checks start so the user knows the command is running.
- Set a hard timeout: if any single check takes > 2s, report "check timed out" for that item and continue. Never block the entire diagnostic on one slow path.
- Keep total expected runtime under 1 second on local filesystem.

**Phase:** HEALTH-01

---

### Pitfall 4: HANDOFF.md schema validation is too strict, breaking on valid future rows

**What goes wrong:** sg-health validates each HANDOFF.md data row against the v1.0 schema (exactly 5 columns, `To` must be one of 5 enum values). v1.1 adds a new stage (e.g., `session-restored`) to HANDOFF.md. sg-health, written in v1.1, then flags its own newly written rows as schema violations.

**Why it happens:** Enum validation and column count validation are written against the schema at time of coding, not against a versioned schema file. As the system evolves, the validator becomes stale.

**Prevention:**
- Read the allowed `To` enum from a single source of truth — either a constant in a shared Python module or from the schema comment at the top of HANDOFF.md itself.
- For v1.1, the enum is: `init`, `gsd-plan`, `superpowers`, `review`, `hookify`. Do not add new values without updating the validator simultaneously.
- Schema validation warnings should be WARNING severity, not ERROR — a schema mismatch does not break the workflow, it only signals drift.

**Phase:** HEALTH-01

---

### Pitfall 5: Stop hook fires on sg-health completion, triggering false workflow advance prompt

**What goes wrong:** sg-health outputs text containing the word `hookify` (e.g., "Hookify: installed"). The `stop_hook.py` transcript scanner finds `hookify` in the last 200 lines and emits "Hookify complete. Run sg-plan..." — a spurious workflow advance message.

**Why it happens:** `transcript_matcher.py` pattern `'hookify'` is a substring match. It triggers on any mention of the word, including diagnostic output. `HOOKIFY_SIGNALS = ['hookify', ...]` — the first pattern is the entire word in any case.

**Consequence:** User runs sg-health, finishes, and immediately gets a "Hookify complete" message telling them to run sg-plan. This is confusing and erodes trust.

**Prevention:**
- Make HOOKIFY_SIGNALS patterns more specific: use `'Retrospective complete'`, `'hooks generated'`, `'patterns extracted'` — drop the bare `'hookify'` string, or require `'hookify complete'` (lowercase, full phrase).
- Alternatively, sg-health output should avoid containing the signal phrases. Use "Hookify plugin" instead of bare "hookify" in output.
- Add a negative signal check: if the transcript also contains `sg-health` near the hookify mention, suppress the hookify signal. This is the more robust fix.

**Phase:** HEALTH-01 (output phrasing); cross-references stop hook behavior. Also affects transcript_matcher.py (independent fix).

---

## Cross-cutting Concerns

### CC-1: Single regex `^Phase:\s*(\S+)` is fragile across STATE.md evolutions

`_read_current_phase()` in `stop_hook.py` uses this regex. The current STATE.md has `Phase: Not started` in the body and no `Phase:` key in the frontmatter. The regex returns `Not` — silently wrong. Any code building on this for session restoration will inherit the bug.

**Fix:** Parse frontmatter YAML separately using Python's `yaml.safe_load()` between the `---` delimiters. Fall back to body section only if frontmatter has no phase info. Do not mix the two with a single regex scan.

**Affects:** stop_hook.py (existing), sg-start restoration (new SESS-01), sg-status (STATUS-01).

---

### CC-2: `auto_advance: false` guard exists only in stop_hook.py — not in commands

sg-start restoration and sg-status read HANDOFF.md regardless of `auto_advance` setting. This is correct — those are read-only status commands, not auto-advance actions. But sg-health should also check and display the `auto_advance` config value so the user understands why hooks are silent.

**Fix:** sg-health output should include a "Config" section showing `auto_advance` current value. No behavior change — just visibility.

**Affects:** HEALTH-01.

---

### CC-3: All three new features assume `.planning/` exists in cwd

sg-start, sg-status, and sg-health all open `.planning/HANDOFF.md`, `.planning/STATE.md` with relative paths. If the user invokes a command from a subdirectory of the project, all reads fail silently.

**Why this happens:** `load_config()` uses `open('.planning/config.json')` — relative to cwd, not script location. The existing hook uses `__file__`-based resolution for the hook script itself but not for data files.

**Fix:** All file opens for `.planning/` should resolve relative to the project root. Detect project root by walking up from cwd until `.planning/` is found (same pattern as git root detection). If not found, report error clearly.

**Affects:** All three v1.1 features.

---

### CC-4: No idempotency guard on session restoration prompt

sg-start is documented as idempotent — "same phase, called multiple times, no duplicate context." But a restoration prompt shown on second invocation would be confusing ("you were working on phase 3" when the user just completed phase 3 and is starting phase 4). There is no "last restoration timestamp" tracking.

**Fix:** Record restoration in HANDOFF.md as a `session-restored` row (or equivalent), or check if HANDOFF.md last row is already more recent than the session gap threshold (e.g., < 1 hour ago means no restoration needed). The simplest version: only show the restoration prompt if last HANDOFF.md timestamp is more than N minutes old.

**Affects:** SESS-01.

---

### CC-5: Diagnostic tool (sg-health) must not modify state

sg-health must be a pure read operation. If it creates missing directories, writes config defaults, or "fixes" the HANDOFF.md schema, it becomes dangerous to run speculatively. Users run health checks before understanding the system — a health check that mutates state violates the principle of least surprise.

**Fix:** sg-health outputs only. Any remediation must be a separate `sg-repair` command (out of scope for v1.1) or clear manual instructions shown in the output. No writes, no `mkdir`, no file creation.

**Affects:** HEALTH-01.

---

## Phase-Specific Summary

| Phase | Pitfall | Severity | Mitigation |
|-------|---------|----------|------------|
| SESS-01 | STATE.md phase extraction returns prose (`Not`) not number | HIGH | Parse frontmatter YAML, not body prose |
| SESS-01 | HANDOFF.md missing on fresh clone | MEDIUM | FileNotFoundError → `init` default + warning |
| SESS-01 | Conflicting stage signals (HANDOFF last = superpowers, but hookify already ran) | HIGH | sg-learn must append hookify row; restoration cross-checks lessons dir |
| SESS-01 | Restoration prompt shown when session is recent (false resume) | MEDIUM | Timestamp threshold or session marker row |
| STATUS-01 | Empty `To` column after awk extraction | MEDIUM | Map empty → `init` + warning instead of hard error |
| STATUS-01 | Column misalignment from `|` in Phase name | LOW | Validate pipe count in sg-health; lock Phase column pattern in sg-execute |
| HEALTH-01 | False negative: files present, plugin not live-registered | HIGH | Hedge output: "files found, live registration unverifiable" |
| HEALTH-01 | False positive: non-standard GSD install path | HIGH | Check multiple known paths; accept env var override; use WARNING not ERROR |
| HEALTH-01 | sg-health output triggers stop hook false positive | HIGH | Fix transcript_matcher.py bare `'hookify'` pattern; use `'hookify complete'` |
| HEALTH-01 | Slow sequential checks block user > 2s | MEDIUM | Parallel checks with `&` + `wait`; hard timeout per check |
| HEALTH-01 | Schema validation too strict for future rows | LOW | Read enum from single source of truth; use WARNING severity |
| HEALTH-01 | sg-health must not mutate state | HIGH | Read-only contract; no mkdir, no writes |
| Cross-cut | Relative `.planning/` path breaks in subdirectories | MEDIUM | Walk up to project root before opening files |
| Cross-cut | `auto_advance: false` invisible to user in health output | LOW | Show config value in HEALTH-01 output |
