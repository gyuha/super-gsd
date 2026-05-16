# Stack Research — v1.1 Reliability

**Project:** super-gsd v1.1
**Researched:** 2026-05-16
**Scope:** Stack additions for session restoration (sg-start), stage detection accuracy (sg-status), and diagnostic (sg-health)

---

## Additions Needed

### 1. `csv` stdlib module — HANDOFF.md TSV parsing (Python)

**Where:** New Python utility or inline in stop_hook.py for sg-status / sg-start parsing.

**Rationale:** HANDOFF.md is a Markdown table, not a raw TSV file. The current sg-status.md uses inline `grep | awk` shell commands to extract the last data row. This is fragile — any trailing space variation in column widths breaks the `awk -F'|'` field split. For the v1.1 STATUS-01 and SESS-01 requirements, parsing must be reliable across empty-table, single-row, and multi-row states.

Python's `csv` module (stdlib, zero-install) handles delimiter splitting cleanly. The parsing logic: strip the `|`-delimited Markdown rows, split on `|`, strip whitespace from each field. Three lines of code, no regex edge-case risk. Confidence: HIGH (stdlib, no external dependency).

**Pattern (the only code that matters):**
```python
import csv, io

def parse_handoff_rows(content: str) -> list[dict]:
    rows = []
    for line in content.splitlines():
        if not line.startswith('| ') or line.startswith('| ---') or line.startswith('| Timestamp'):
            continue
        fields = [f.strip() for f in line.strip('|').split('|')]
        if len(fields) == 5:
            rows.append(dict(zip(
                ['timestamp', 'phase', 'from_stage', 'to_stage', 'plan_hash'],
                fields
            )))
    return rows
```

The `csv` import is available but not strictly required here — `str.split('|')` is sufficient given the fixed 5-column schema. Either approach works; the key point is centralizing this parse logic in one place rather than duplicating awk across every command file.

---

### 2. `subprocess` stdlib module — sg-health plugin/hook checks

**Where:** New `commands/sg-health.md` command (Markdown skill file). The heavy-lifting check commands run via bash, not a new Python script.

**Rationale:** sg-health needs to verify:
- GSD installed: `which gsd-sdk` or `gsd-sdk version`
- Superpowers installed: check `~/.claude/plugins/` or `claude plugin list`
- Hookify installed: same mechanism
- Hook registered: verify `hooks/hooks.json` is linked — check `~/.claude/settings.json` or the project `.claude/settings.json` for the hook entry
- HANDOFF.md schema: parse header row, count columns, verify enum values in `From`/`To`

The sg-health command file (Markdown) instructs Claude to run these shell checks inline — no new Python script is needed. The existing `stop_hook.py` pattern (read files, output JSON) is the right model for anything that must run non-interactively; sg-health is interactive output, so a Markdown command is the correct vehicle.

The `subprocess` module note: if a Python health-check helper is added later, `subprocess.run(['which', 'gsd-sdk'], capture_output=True)` is the right call. But for v1.1, **bash inline in the Markdown command is sufficient**.

---

### 3. `re` stdlib module — STATE.md phase extraction (already used, needs hardening)

**Where:** `stop_hook.py` already imports `re` and uses `_read_current_phase()`. No new import needed.

**What changes:** The regex `r'^Phase:\s*(\S+)'` in `_read_current_phase()` fails when STATE.md contains `Phase: Not started (defining requirements)` — which is exactly the current state of `STATE.md`. `\S+` matches only `Not`, not the full phase identifier.

For SESS-01 (session restoration), `sg-start` needs to detect "not yet started vs. mid-flight vs. complete." The fix is hardening the existing regex to handle both numeric phases (`Phase: 3`) and text states (`Phase: Not started`). This is a modification to existing code, not a new module.

---

## No Changes Needed

### Python version
Python 3 is already the runtime (`#!/usr/bin/env python3`). All modules listed above (`csv`, `re`, `subprocess`, `json`, `os`, `sys`, `datetime`) are stdlib. No pip installs, no virtual environments, no version pinning required.

### File formats
No new file formats needed. Session restoration (SESS-01) reads existing `STATE.md` (YAML frontmatter + Markdown body) and `HANDOFF.md` (Markdown table). Both formats are already in use. Creating a new format would add parsing complexity for no benefit.

### Hook mechanism
`hooks/hooks.json` + `stop_hook.py` covers all automated detection. sg-health is a user-invoked diagnostic — it does not need a new hook type. The existing `Stop` hook is sufficient.

### Plugin manifest
`plugin.json` does not need structural changes. Adding `sg-health` as a new command entry follows the existing pattern (`"./commands/sg-health.md"`).

### STATE.md structure
The existing YAML frontmatter fields (`milestone`, `status`, `last_updated`, `last_activity`) plus the `## Current Position` and `## Session Continuity` sections contain all data needed for SESS-01. No new fields required — session restoration reads `Stopped at:` from `## Session Continuity` and the last HANDOFF.md row.

### gsd-sdk CLI
Already in the validated stack. sg-health can call `gsd-sdk` to check state but does not need to extend or wrap it.

---

## Integration Points

### SESS-01 (sg-start session restoration)

Data flow:
```
sg-start invoked
  → read .planning/STATE.md (Session Continuity section: "Stopped at:" line)
  → read .planning/HANDOFF.md (last data row → current stage)
  → if stage != 'init': print resume prompt with stage + stopped_at + next command
  → else: delegate to gsd-new-project Skill as before
```

The `sg-start.md` command file gains a new Step 0 that runs these reads before delegating to `gsd-new-project`. No Python changes required — Claude reads the files inline. If the check needs to be scripted (e.g., for the hook), add a `parse_handoff_rows()` function to `transcript_matcher.py` as a shared utility (it already imports into `stop_hook.py`).

### STATUS-01 (sg-status accuracy)

The existing `sg-status.md` already specifies `grep -E '^\| [0-9]{4}-'` to match timestamp rows. This works correctly for ISO 8601 timestamps. The robustness issue is in awk field extraction. Hardening: replace the awk with a Python one-liner or a dedicated `parse_handoff.py` helper that centralizes TSV/Markdown-table parsing.

The simplest integration: add `parse_handoff.py` alongside `stop_hook.py` in `hooks/`, callable from both `sg-status.md` (via `python3 hooks/parse_handoff.py`) and `stop_hook.py` (via import). This eliminates duplicated parsing logic.

### HEALTH-01 (sg-health command)

Integration chain:
```
sg-health.md (new command)
  → bash: which gsd-sdk / gsd-sdk version
  → bash: ls ~/.claude/plugins/ | grep superpowers
  → bash: ls ~/.claude/plugins/ | grep hookify
  → bash: grep -r "stop_hook.py" ~/.claude/ (hook registration check)
  → python3 hooks/parse_handoff.py --validate (schema check)
  → print colored diagnostic table
```

The hook registration check is the hardest part. Claude Code stores hook config in `~/.claude/settings.json` (global) or `.claude/settings.json` (project). The sg-health command should check both locations for the `Stop` hook entry pointing to `stop_hook.py`.

**Claude Code hook config location** [MEDIUM confidence — based on Claude Code docs as of training cutoff, verify against current docs]: hooks are registered in `.claude/settings.json` under a `hooks` key. sg-health should check `.claude/settings.json` in the project root, then `~/.claude/settings.json` as fallback.

---

## Do NOT Add

### PyYAML or any third-party YAML parser
STATE.md's frontmatter is simple enough to parse with `re` (key: value lines between `---` delimiters). PyYAML is not in the existing stack, requires pip install, and is overkill for 8 fields. Read the frontmatter with line splitting.

### SQLite or any structured state DB
The append-only TSV/Markdown-table in HANDOFF.md is the intentional design. Do not introduce a database for what is at most ~100 rows of state.

### New hook types (PreToolUse, PostToolUse, etc.)
sg-health and sg-start are user-invoked commands, not automated hooks. Adding new hook types increases the blast radius of the hook system and contradicts the existing `auto_advance: false` guard design. Stick with Stop/SubagentStop.

### `click`, `argparse`, or any CLI framework for Python scripts
The Python scripts in this project are simple, single-purpose stdin/stdout processors. `sys.argv` is sufficient if arguments are ever needed. No CLI framework.

### `pathlib`
`os.path` is already used throughout `stop_hook.py`. Introducing `pathlib.Path` in new code creates inconsistency with existing style. Use `os.path` to match.

### A new file format for session state
Do not introduce `.planning/session.json` or similar. SESS-01 reads `STATE.md` + `HANDOFF.md` — both files already exist and contain the needed data (`Session Continuity` section and last HANDOFF row). A third state file creates sync problems.
