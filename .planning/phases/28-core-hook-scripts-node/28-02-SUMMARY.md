# 28-02 Summary — rule_runner.py → rule_runner.cjs (NODE-03)

**Phase:** 28-core-hook-scripts-node
**Plan:** 02 (Wave 2)
**Requirement:** NODE-03
**Date:** 2026-05-25

---

## Artifact

- **File created:** `hooks/rule_runner.cjs` (419 lines)
- **File preserved (D-06):** `hooks/rule_runner.py` (278 lines, unchanged — verified via `git diff --stat hooks/rule_runner.py` → empty)
- **External dependencies:** 0 (`fs`, `path`, `os` only — all Node built-ins per D-02)

The Node port is longer (419 vs 278 lines) primarily because of (a) the hand-rolled Python-compatible JSON serializer required for byte-identical stdout (separators `, `/`: ` and ASCII-only `\uXXXX` escapes per `json.dumps` defaults), and (b) explicit branching for the JS `String.partition` workaround.

---

## Python → JS function map

| Python (rule_runner.py)        | Node (rule_runner.cjs)         | Notes                                                                 |
|--------------------------------|---------------------------------|-----------------------------------------------------------------------|
| `_hookify_installed` (28-32)   | `_hookifyInstalled`             | `fs.statSync(...).isDirectory()` mirrors `os.path.isdir`.            |
| `_parse_frontmatter` (35-101)  | `_parseFrontmatter` + `_stripQuotes` | Line-by-line algorithm port per D-15. Hand-rolled `_stripQuotes` mirrors Python `s.strip('"').strip("'")` (sets, not single chars). |
| (inline `glob.glob`)           | `_globLocalMd`                  | D-09/D-10 inline mini-matcher (`fs.readdirSync` + prefix/suffix filter). |
| `_load_rules` (104-157)        | `_loadRules`                    | Priority map (`Map<name, rule>`); sg-rule (priority 2) wins on clash. |
| `_match_condition` (160-200)   | `_matchCondition`               | Field extraction order preserved exactly. `new RegExp(p, 'i')` wrapped in `try/catch` to swallow `SyntaxError` (W-3 / D-13). |
| `_evaluate` (203-232)          | `_evaluate`                     | Blocking vs warning collation; key insertion order matches Python dict insertion order (CPython 3.7+ ≡ JS `Object.keys`). |
| `main` (235-274)               | `main`                          | Hookify → config-guard → stdin-parse → event-filter → loadRules → evaluate → print. Catch-all swallows to `systemMessage` + exit 0. |
| `json.dumps(obj)` (stdout)     | `_pyJsonDumps(obj)`             | **Critical addition** — JS `JSON.stringify` produces compact output (no separator spaces) and preserves non-ASCII bytes. Python `json.dumps` defaults to `separators=(', ', ': ')` and `ensure_ascii=True`. The hand-rolled serializer mirrors both defaults so all 5 diffs come back empty. |

`json.load`/`json.loads` (stdin + config.json) remain `JSON.parse` — input parsing is symmetric.

---

## B-5 Pre-flight Gate (hookify cache)

**Result:** Gate passed **naturally** — no rename required.

```
$ ls -la ~/.claude/plugins/cache/claude-plugins-official/ | grep -i hookify
(no output — hookify directory absent)
```

The host workstation does not have hookify installed in the Claude Code plugin cache, so the rule_runner short-circuit branch is never taken during verification. The B-5 false-pass scenario (where both Python and Node short-circuit to `{}` and the diff trivially passes) is therefore impossible here.

No `mv ~/.claude/plugins/cache/claude-plugins-official/hookify{,.bak}` was executed; no restore needed.

---

## Five-fixture parity diff results

Fixture rule files (`sg-rule.bash-test-warn.local.md`, `sg-rule.file-test-block.local.md`, `sg-rule.bad-regex-test.local.md`) were copied from
`.planning/phases/28-core-hook-scripts-node/fixtures/rule_runner/rules/` into a freshly-created `.claude/` directory at the repo root. No pre-existing
`.claude/*.local.md` files were present (the directory itself did not exist), so no backup-to-`.claude.bak/` was actually needed; the script ran the
no-op `mv .claude/*.local.md .claude.bak/ 2>/dev/null || true` guard. After all diffs ran, the three staged rule files were removed and the now-empty
`.claude/` directory was deleted to restore the original tree.

| # | Fixture           | Python stdout                          | Node stdout                            | `diff` result |
|---|-------------------|-----------------------------------------|-----------------------------------------|---------------|
| 1 | `bash-warn`       | `{"systemMessage": "**[warn-bash-test-fixture]**\nFixture warn message body for bash rm -rf detection."}` | identical | **empty diff** |
| 2 | `file-block`      | `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny"}, "systemMessage": "**[block-file-test-fixture]**\nFixture block message body for forbidden token detection."}` | identical | **empty diff** |
| 3 | `no-match`        | `{}`                                    | `{}`                                    | **empty diff** |
| 4 | `non-target-tool` | `{}`                                    | `{}`                                    | **empty diff** |
| 5 | `bad-regex` (W-3) | `{}`                                    | `{}`                                    | **empty diff** |

**Bad-regex (W-3) callout:** the staged rule `sg-rule.bad-regex-test.local.md` declares `pattern: "[unclosed"`. Python's `re.search("[unclosed", value, re.IGNORECASE)` raises `re.error`, which the existing `try/except re.error` at `rule_runner.py:188-189` swallows to `False`. The Node port calls `new RegExp("[unclosed", "i")` inside a `try/catch`; V8 throws `SyntaxError: Invalid regular expression: missing terminating ] for character class`, which the catch returns as `false`. Both implementations therefore report no rule match and emit `{}`. Without the `try/catch`, the Node port would have surfaced `{"systemMessage": "super-gsd rule_runner error: Invalid regular expression: ..."}` and the diff would have failed loudly. The catch is the W-3 fix.

---

## Additional acceptance-criteria checks

| Check                                                                 | Result |
|-----------------------------------------------------------------------|--------|
| Plan's automated smoke test (`require()` audit + non-target short-circuit + `try/catch new RegExp`) | **pass** (`rule_runner.cjs smoke OK`) |
| Malformed JSON stdin → `{"systemMessage": "super-gsd rule_runner error: ..."}`, exit 0 | **pass** |
| Hookify-cache directory present → `{}` short-circuit, exit 0 (verified by temporarily creating `~/.claude/plugins/cache/claude-plugins-official/hookify` then removing) | **pass** |
| `.planning/config.json` `super_gsd.auto_advance: false` → `{}` short-circuit, exit 0 | **pass** (config was backed up to `/tmp/config.bak.json`, toggled, tested, restored — restoration verified by `assert c["super_gsd"]["auto_advance"] is True`) |
| `hooks/rule_runner.py` unchanged on disk (D-06)                       | **pass** (`git diff --stat hooks/rule_runner.py` empty) |
| Zero external `require()` targets                                     | **pass** (only `fs`, `path`, `os`) |

---

## Deviations from plan

**1. `_pyJsonDumps` helper added (NOT in the plan's required structure).**

The plan instructs to use `console.log(JSON.stringify(...))` for stdout. Following that literally produces output like `{"a":1}` (no separator spaces), while Python `json.dumps({"a":1})` produces `{"a": 1}` (with spaces). Three of the five fixtures (`bash-warn`, `file-block`, plus any non-empty result) would fail the byte-identical-diff acceptance criterion under literal `JSON.stringify`.

28-VERIFY.md Section 5.2 anticipates the **em-dash ASCII-escape divergence** between Python's `ensure_ascii=True` default and JS's UTF-8 passthrough, and explicitly names `rule_runner.cjs` as affected. It does NOT anticipate the **separator-spacing divergence**, but the same class of fix (hand-roll a Python-compatible serializer) covers both. `_pyJsonDumps` is added to `hooks/rule_runner.cjs` as a small helper (~60 lines including string-escape sub-helper) that mirrors `json.dumps` defaults: `separators=(', ', ': ')` and `ensure_ascii=True` with `\uXXXX` escapes.

This is a deviation from the plan's *prescribed code structure* but a strict adherence to the plan's *acceptance criterion* (byte-identical stdout). Without it, the five-fixture parity diffs cannot be empty.

Sibling tasks 28-01 (`stop_hook.cjs`) and 28-03 (`lessons_ranker.cjs`) likely encounter the same issue independently; `lessons_ranker.py` explicitly uses `ensure_ascii=False` (per 28-VERIFY.md), so 28-03 escapes only the separator issue. 28-01 will hit both.

**2. `.claude/` directory did not exist pre-verification.**

The plan instructs "backing up existing `.claude/*.local.md` to `.claude.bak/`". The repo root has no `.claude/` directory, so the `mv .claude/*.local.md .claude.bak/ 2>/dev/null || true` line was a no-op. The directory was created fresh, populated with the three fixture rules, the diffs ran, the fixture rules were removed, and the now-empty `.claude/` was `rmdir`'d to restore the original tree state.

No other deviations.

---

## Commit

This summary file plus `hooks/rule_runner.cjs` are committed atomically as:

```
feat(28-02): port rule_runner to .cjs (NODE-03)
```
