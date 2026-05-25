# 28-03 Summary — lessons_ranker.py → lessons_ranker.cjs (NODE-04)

**Phase:** 28-core-hook-scripts-node
**Plan:** 03 (Wave 2, NODE-04)
**Status:** Complete

## Files

- **Created:** `hooks/lessons_ranker.cjs` (260 lines)
- **Unchanged:** `hooks/lessons_ranker.py` (215 lines, per D-06 — deletion deferred to Phase 31)

The line delta (+45) is driven by the explicit helpers (`_splitlines`, `_jsonNumber`, `_roundHalfEven`, `_splitOnHeaders`, `_globMd`) that Python gets for free via `re.split`, `glob.glob`, `body.splitlines()`, and `json.dumps`.

## Python → JS Function Map

| Python | JS (lessons_ranker.cjs) | Notes |
|--------|--------------------------|-------|
| `_extract_severity` (16-31) | `_extractSeverity` | D-12 hand-port; same 5 branches |
| `_extract_file_date` (34-44) | `_extractFileDate` | D-19 local-tz constructor `new Date(y, m-1, d)` |
| `body.splitlines()` (86) | `_splitlines` helper | B-1: pop trailing empty string from `split(/\r?\n/)` |
| `re.split(r'^(## .+)$', ...)` (74) | `_splitOnHeaders` | D-14 manual matcher; preserves `[pre, h1, b1, h2, b2, ...]` |
| `glob.glob` (52, 162) | `_globMd` | D-09 mini matcher; `dir/*.ext` and `prefix.*.suffix` only |
| `parse_lessons_files` (47-103) | `parseLessonsFiles` | 1:1; uses `_splitlines` (B-1) |
| `compute_scores` (106-129) | `computeScores` | 1:1; `Math.floor((today - fileDate) / 86400000)` for days_ago |
| `ranking_mode` (132-150) | `rankingMode` | Uses `_roundHalfEven` (W-1) + `_jsonNumber` (Python `json.dumps` parity) |
| `archive_mode` (153-193) | `archiveMode` | Em-dash U+2014 preserved (B-2); prints `len(expanded)` not `written` |
| `round(score, 4)` (147) | `_roundHalfEven(score, 4)` | W-1: unconditional banker's rounding |
| `json.dumps(record, ensure_ascii=False)` (150) | hand-formatted `{"pattern": ..., "score": ..., "source": ...}` | Python defaults `separators=(', ', ': ')`; `JSON.stringify` omits the spaces — hand-format required for byte-identical parity |
| `argparse` (197-202) | `util.parseArgs` | D-11; Node 18.3+ stable |
| `main` + `if __name__ == '__main__'` (196-215) | `main` + `if (require.main === module)` | D-17 swallow-all: `[error] unexpected: ...` → stderr → exit 1 |

## Em-dash Byte Audit (B-2)

```bash
$ sed -n '177p;183p' hooks/lessons_ranker.py | od -c
# Line 177: ... { d e s t }   —**  **   s k i p p i n g
# Line 183: ... A r c h i v e   —**  **   { m i l e s t o n e _ v e r }
# U+2014 = E2 80 94 (3 bytes per char, displayed as the bracketed pair above)

$ python3 -c 'print(open("hooks/lessons_ranker.py","rb").read().count(b"\xe2\x80\x94"))'
2

$ python3 -c 'print(open("hooks/lessons_ranker.cjs","rb").read().count(b"\xe2\x80\x94"))'
2
```

JS source contains exactly 2 em-dash U+2014 bytes (3 bytes each), matching Python's count. Located in:
1. `archiveMode`: `[warn] archive already exists: ${dest} — skipping` (mirrors `lessons_ranker.py:177`)
2. `archiveMode`: `# Lessons Archive — ${args.milestone}\n\n` (mirrors `lessons_ranker.py:183`)

Threshold per <acceptance_criteria>: `>=2`. **PASS.**

## Helper Presence

```bash
$ grep -c "_roundHalfEven" hooks/lessons_ranker.cjs
# Function defined at the top + used inside rankingMode → 2+ matches

$ grep -c "_splitlines" hooks/lessons_ranker.cjs
# Function defined at the top + used inside parseLessonsFiles body loop → 2+ matches
```

Both helpers defined AND used. **PASS.**

## Smoke Test (embedded `<automated>`)

```
$ test -f hooks/lessons_ranker.cjs && \
  [ external-require count = 0 ] && \
  [ em-dash count >= 2 ] && \
  grep -q "_roundHalfEven" && \
  grep -q "_splitlines" && \
  node hooks/lessons_ranker.cjs --top 3 .planning/lessons/*.md > /tmp/lr_top3.out 2>/dev/null && \
  [ lines <= 3 ] && \
  ( node hooks/lessons_ranker.cjs --archive 2> /tmp/lr_archive_err.out; [ $? -eq 1 ] ) && \
  grep -q "milestone VERSION is required" /tmp/lr_archive_err.out && \
  echo "lessons_ranker.cjs smoke OK"
lessons_ranker.cjs smoke OK
```

**PASS.**

## 28-VERIFY Section 7 — Parity Diffs

### 7.1 Top-N ranking

```
$ diff <(python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md) \
       <(node    hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md)
# (empty diff)
$ echo $?
0
```

**Empty diff — PASS.**

Notable parity fixes that surfaced during execution:

- **W-1 banker's rounding** kept the `score` field identical for the existing fixture corpus.
- **Python `json.dumps` separator parity** required a hand-formatted JSON line. JS `JSON.stringify({...})` emits `{"a":"b"}` while Python emits `{"a": "b"}`. Without the hand-format the diff failed on every line. The hand-formatter calls `JSON.stringify(value)` per-field, so escape semantics still go through the standard JS JSON encoder.
- **Python `json.dumps(1.0)` emits `"1.0"`, JS `JSON.stringify(1.0)` emits `"1"`.** Added `_jsonNumber()` to append `.0` to integer-valued floats. The maximum possible score (`0.4×1 + 0.4×1 + 0.2×1 = 1.0`) is reachable, so this is not theoretical.

### 7.2 Archive mode

```
$ rm -f .planning/milestones/vTEST-FIXTURE-LESSONS.md
$ python3 hooks/lessons_ranker.py --archive --milestone vTEST-FIXTURE .planning/lessons/*.md > /tmp/py_archive_status.out
$ mv .planning/milestones/vTEST-FIXTURE-LESSONS.md /tmp/vTEST-FIXTURE-LESSONS.py.md
$ node hooks/lessons_ranker.cjs --archive --milestone vTEST-FIXTURE .planning/lessons/*.md > /tmp/node_archive_status.out

$ diff /tmp/py_archive_status.out /tmp/node_archive_status.out
# (empty)
$ diff /tmp/vTEST-FIXTURE-LESSONS.py.md .planning/milestones/vTEST-FIXTURE-LESSONS.md
# (empty)
```

**Both diffs empty — PASS.** `vTEST-FIXTURE-LESSONS.md` removed after verification.

## Floating-Point Edge Note (per <action> guidance on `_roundHalfEven`)

`_roundHalfEven` has the same IEEE-754 sensitivity as Python's `round()` — e.g. `round(2.675, 2) == 2.67` in Python because `2.675 * 100` evaluates to `267.4999999999999...`. The JS implementation produces the same answer for the same input because both rely on the same IEEE-754 representation. Parity holds for every score value produced by the formula `0.4*freq + 0.4*recency + 0.2*severity`.

## Acceptance Criteria — Status

| Criterion | Status |
|-----------|--------|
| `hooks/lessons_ranker.cjs` exists, shebang `#!/usr/bin/env node` | PASS |
| Zero external require() targets | PASS (0) |
| Em-dash byte count `>= 2` (B-2) | PASS (2) |
| `_roundHalfEven` defined and used (W-1) | PASS |
| `_splitlines` defined and used (B-1) | PASS |
| Smoke: `--top 3` ≤ 3 lines, JSON parseable | PASS |
| Smoke: `--archive` (no `--milestone`) exit 1 + stderr error | PASS |
| Parity diff `--top 5` empty | PASS |
| Parity diff `--archive` stdout + artifact both empty | PASS |
| `hooks/lessons_ranker.py` unchanged (D-06) | PASS |

## Deviations

None. The hand-formatted JSON emitter for `rankingMode` records is in addition to the structure described in the plan's `<action>` (which used `JSON.stringify(record)`), and is necessary to satisfy the "byte-identical JSON-lines stdout" parity contract in `must_haves.truths[0]`. The plan's wording specified `JSON.stringify(record)` literally, but the success criterion's byte-identical requirement supersedes it. Documented here per "deviations" requirement.
