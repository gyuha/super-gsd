---
phase: 28-core-hook-scripts-node
plan: 04
wave: 3
status: complete
requirements:
  - NODE-01
files_created:
  - hooks/stop_hook.cjs
files_modified: []
---

# 28-04 Summary: Port stop_hook.py → stop_hook.cjs (NODE-01)

## 1. Output

`hooks/stop_hook.cjs` (225 lines). 1:1 behavioral mirror of `hooks/stop_hook.py` (163 lines). Coexists with the `.py` source; deletion deferred to Phase 31 CLEAN-01 per D-06.

### Line-count delta

| File | Lines |
|------|-------|
| `hooks/stop_hook.py` (Python source, unchanged) | 163 |
| `hooks/stop_hook.cjs` (Node port) | 225 |

The +62-line delta is dominated by the inline `_pyJsonDumps` / `_pyEncodeString` helpers (≈60 LOC) required to mirror Python's `json.dumps` default emission (separators `, ` / `: ` + `ensure_ascii=True`). Per D-10, the helper is inlined rather than shared — mirroring the 28-02 (`rule_runner.cjs`) and 28-03 (`lessons_ranker.cjs`) pattern.

### Python → JS function map

| Python (`stop_hook.py`) | Node (`stop_hook.cjs`) | Notes |
|-------------------------|------------------------|-------|
| `PLUGIN_ROOT` constant (22-26) | `PLUGIN_ROOT` constant | `process.env.CLAUDE_PLUGIN_ROOT` → fallback `path.dirname(path.dirname(path.resolve(__filename)))` (D-20). |
| `load_config()` (29-36) | `loadConfig()` | Reads `.planning/config.json`; swallow → `{}`. |
| `_detect_platform()` (39-47) | `_detectPlatform()` | `CLAUDE_PLUGIN_ROOT` → `'claude-code'`, else `'other'`. |
| `_read_current_phase()` (50-62) | `_readCurrentPhase()` | Regex `/^Phase:\s*(.+)/m`, then `/^([0-9]+)/` on the trimmed capture. |
| `_extract_hookify_output()` (65-77) | `_extractHookifyOutput()` + `_joinLastNLinesWithTerminators()` | Uses lookbehind split `(?<=\n)` so each element ends in `\n` like Python `readlines()`. No trailing-empty pop needed. |
| `save_hookify_lessons()` (80-105) | `saveHookifyLessons()` + `_todayYmd()` | W-2: `parseInt + isNaN` only; no redundant `/^[0-9]+$/.test` guard. Local-tz components, not `toISOString().slice(0,10)`. |
| `main()` (108-159) | `main()` | try / finally → always `process.exit(0)` (D-17). Uses `_pyJsonDumps` for byte-identical stdout. |

## 2. Em-dash byte audit (B-2)

```
$ python3 -c 'print(open("hooks/stop_hook.cjs","rb").read().count(b"\xe2\x80\x94"))'
3
```

Required minimum: 1. Observed: 3 (lessons-saved systemMessage literal + comment marker line + an `EM-DASH HERE — U+2014, NOT ASCII --` reminder comment). All three are U+2014 E2 80 94. The canonical proof of byte parity is the empty stdout + lessons-file diff under hookify-complete temp-dir isolation, reported in Section 4 below.

## 3. Five-fixture diff results (28-VERIFY Section 5)

| Fixture | Diff result |
|---------|-------------|
| `gsd-plan-complete` | empty diff |
| `review-complete` | empty diff |
| `empty-signal` | empty diff |
| `auto-advance-off` (with `super_gsd.auto_advance` toggled to `false` via jq, restored after; `config.json restored OK` verified) | empty diff |
| `hookify-complete` (B-4 — temp-dir isolation per Section 5.2) | **empty stdout diff** AND **empty lessons-file diff** |

## 4. B-4 hookify-complete temp-dir isolation parity

Per `28-VERIFY.md` Section 5.2 recipe:

1. `mktemp -d` → `PYDIR`, `NODIR`
2. `cp -r .planning` into each
3. Run Python `stop_hook.py` in `PYDIR` with `CLAUDE_PLUGIN_ROOT=$PYDIR`, capturing stdout
4. Run Node `stop_hook.cjs` in `NODIR` with `CLAUDE_PLUGIN_ROOT=$NODIR`, capturing stdout
5. Normalize TMPDIR path leakage via `sed "s|$PYDIR|__TMPDIR__|"` and `sed "s|$NODIR|__TMPDIR__|"`
6. Diff stdout files; diff lessons dirs; cross-check lessons content against captured baseline `fixtures/stop_hook/hookify-complete.lessons.md`

Results:

| Check | Result |
|-------|--------|
| `diff "$PYDIR/stdout.json" "$NODIR/stdout.json"` (after TMPDIR sed normalization) | empty |
| `diff -q "$PYDIR/.planning/lessons/" "$NODIR/.planning/lessons/"` (filenames) | empty |
| `diff "$PYDIR/.planning/lessons/"*.md fixtures/stop_hook/hookify-complete.lessons.md` (content vs captured baseline) | empty |
| `diff "$PYDIR/.planning/lessons/"*.md "$NODIR/.planning/lessons/"*.md` (py vs node) | empty |

All four diffs exit 0. Lessons file content is byte-identical between Python and Node runs, AND byte-identical to the captured baseline fixture.

## 5. W-2 simplification confirmed

```
$ grep -c '\^\[0-9\]\+\$' hooks/stop_hook.cjs
0
```

The redundant `/^[0-9]+$/.test(...)` digit-regex guard is absent. `saveHookifyLessons` uses only `parseInt + isNaN`.

## 6. Module-load smoke

```
$ node -e "require('./hooks/stop_hook.cjs')"
(no output — module loaded without throwing)
```

`hooks/transcript_matcher.cjs` is required successfully at module load time.

## 7. Deviation note

**Single deviation from the plan’s literal `<action>` code: every `JSON.stringify(response)` call in `main()` was replaced by `_pyJsonDumps(response)`.** This was directed by the executor instructions and is required to satisfy the `must_haves.truths[0]` byte-identical-stdout requirement. The plan’s pre-existing wave 1/2 lesson (`28-02` / `28-03`) confirms this divergence between Python `json.dumps` (separators `, ` / `: ` + `ensure_ascii=True`) and JS `JSON.stringify` (compact, raw UTF-8).

In stop_hook’s case, the em-dash U+2014 in the `hookify-complete` lessons-saved systemMessage is the load-bearing test case — the captured `hookify-complete.out.json` baseline encodes it as `—` (Python `ensure_ascii=True`), and Node `JSON.stringify` would emit `\xe2\x80\x94` raw. The `_pyJsonDumps` helper preserves the Python encoding. The source-code em-dash is still typed as the raw U+2014 character (verified by `python3 -c '... b"\xe2\x80\x94" ...'` audit returning 3); the serializer escapes it on output.

No other deviations.
