# 28-VERIFY: Python ↔ Node Hook Parity Recipe

## 1. Purpose

This file is the canonical recipe used by plans **28-01 ~ 28-04** to prove 1:1 parity between the Python originals (`hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.py`) and their Node.js ports (`hooks/*.cjs`). All `.cjs` ports MUST produce identical stdout (and identical file-system side-effects, where applicable) to their Python counterparts when invoked against the fixture corpus in `.planning/phases/28-core-hook-scripts-node/fixtures/`. Plan `28-00` (this Wave 1 plan) captured the fixture inputs and Python baselines used here.

Run every section of this document in order. Sections 2 and 3 are gates that MUST pass before sections 4–7 are meaningful. Section 8 is the composite gate that block Wave 3 from proceeding.

---

## 2. Pre-flight Gate (BLOCKING) — hookify cache check

Both `hooks/rule_runner.py` and any Node port short-circuit to `{}` when `~/.claude/plugins/cache/claude-plugins-official/hookify` exists. If the cache is present, every `diff` in Section 6 produces empty `{} == {}` output that masks divergent rule logic. This is the worst-possible silent false-pass. Run this gate FIRST.

```bash
# BLOCKING gate: rule_runner verification cannot exercise rule logic if hookify cache exists,
# because both Python and Node short-circuit to {} before reading any rule files.
# This produces a silent {} == {} false-pass that masks divergent implementations.
if [ -d ~/.claude/plugins/cache/claude-plugins-official/hookify ]; then
  echo "BLOCKER: hookify cache present — rule_runner verification cannot exercise rule logic."
  echo "Either uninstall hookify temporarily or rename:"
  echo "  mv ~/.claude/plugins/cache/claude-plugins-official/hookify{,.bak}"
  echo "  (run rule_runner verification, then: mv ~/.claude/plugins/cache/claude-plugins-official/hookify{.bak,})"
  exit 1
fi
```

After completing Section 6, restore the rename:

```bash
mv ~/.claude/plugins/cache/claude-plugins-official/hookify{.bak,}
```

---

## 3. Prerequisites

Set the working directory to the repo root and export `CLAUDE_PLUGIN_ROOT` for the entire verification session. The Python originals fall back to `__file__`-relative resolution when this env var is unset (D-20), and the Node ports do the same with `__filename`, but explicit `CLAUDE_PLUGIN_ROOT` matches production Claude Code semantics.

```bash
cd /path/to/super-gsd                       # adjust to your checkout
export CLAUDE_PLUGIN_ROOT="$PWD"
```

**Absolute-path convention for `.in.json` fixtures.** The `stop_hook/*.in.json` fixtures each contain a `transcript_path` that is an absolute path to a file in `fixtures/transcript_matcher/`. They were generated against `/Users/gyuha/workspace/super-gsd`. If you cloned this repo to a different absolute path, regenerate the fixtures with:

```bash
REPO=$PWD
TX=$REPO/.planning/phases/28-core-hook-scripts-node/fixtures/transcript_matcher
FIX=$REPO/.planning/phases/28-core-hook-scripts-node/fixtures/stop_hook
for name in gsd-plan-complete:gsd-plan auto-advance-off:gsd-plan review-complete:review empty-signal:empty hookify-complete:hookify; do
  out="${name%%:*}"
  src="${name##*:}"
  cat > "$FIX/$out.in.json" <<EOF
{"transcript_path": "$TX/$src.txt", "session_id": "fixture", "stop_hook_active": true}
EOF
done
```

---

## 4. transcript_matcher.cjs verification

Loop every transcript fixture through both implementations and compare return values. The loop MUST include `long-with-trailing-newline.txt`, which is the B-1 regression test: Python `splitlines()` returns `'gsd-plan-complete'`, but a naive JS port using `split(/\r?\n/).slice(-200)` (without popping the trailing empty element) returns `''` because the signal at line 2 is shifted out of the 200-element window by the phantom empty-string element introduced by the trailing newline.

```bash
FIXTURES=.planning/phases/28-core-hook-scripts-node/fixtures/transcript_matcher
for f in "$FIXTURES"/*.txt; do
  node_out=$(node -e 'const m=require("./hooks/transcript_matcher.cjs"); process.stdout.write(m.detectSignal(process.argv[1]))' "$f")
  python_out=$(python3 -c 'import sys; sys.path.insert(0,"hooks"); from transcript_matcher import detect_signal; sys.stdout.write(detect_signal(sys.argv[1]))' "$f")
  [ "$node_out" = "$python_out" ] || { echo "MISMATCH: $f (node=$node_out python=$python_out)"; exit 1; }
done
echo "transcript_matcher parity OK"
```

The final line of stdout MUST be `transcript_matcher parity OK`. Any `MISMATCH` indicates the Node port diverges from Python — most commonly the splitlines/split-trailing-empty bug.

Cross-check against `fixtures/transcript_matcher/expected.json`: every key in that file maps the fixture basename to the Python return value. The loop above effectively re-derives those values, so a passing loop AND a matching `expected.json` together confirm parity.

---

## 5. stop_hook.cjs verification

For each of the five `stop_hook/*.in.json` fixtures, diff stdout between Python and Node:

```bash
FIX=.planning/phases/28-core-hook-scripts-node/fixtures/stop_hook
for name in gsd-plan-complete review-complete empty-signal; do
  diff <(python3 hooks/stop_hook.py  < "$FIX/$name.in.json") \
       <(node    hooks/stop_hook.cjs < "$FIX/$name.in.json") \
    || { echo "MISMATCH: $name"; exit 1; }
done
echo "stop_hook simple-signal parity OK"
```

### 5.1 auto-advance-off

This fixture exercises the `super_gsd.auto_advance: false` config guard. The current `.planning/config.json` has `super_gsd.auto_advance: true`, so the guard does not fire by default. Temporarily inject `false` using the idempotent `jq` merge below (works whether the key exists or not), run the diff, then restore:

```bash
# Backup
cp .planning/config.json .planning/config.json.bak

# Inject super_gsd.auto_advance=false (idempotent — works whether super_gsd key already exists)
jq '.super_gsd = (.super_gsd // {}) + {"auto_advance": false}' \
  .planning/config.json.bak > .planning/config.json

# Diff
diff <(python3 hooks/stop_hook.py  < $FIX/auto-advance-off.in.json) \
     <(node    hooks/stop_hook.cjs < $FIX/auto-advance-off.in.json)

# Restore
mv .planning/config.json.bak .planning/config.json

# Verify restoration: super_gsd.auto_advance must NOT be false after restoration
python3 -c 'import json; c=json.load(open(".planning/config.json")); assert c.get("super_gsd",{}).get("auto_advance",True) is True, "BLOCKER: config.json not restored"; print("config.json restored OK")'
```

If `jq` is unavailable, use this Python one-liner in place of the jq line:

```bash
python3 -c 'import json,sys; c=json.load(open(".planning/config.json.bak")); c.setdefault("super_gsd",{})["auto_advance"]=False; json.dump(c,open(".planning/config.json","w"),indent=2)'
```

### 5.2 hookify-complete

This fixture drives `save_hookify_lessons()` / `saveHookifyLessons()` end-to-end. Two parity checks: (a) stdout shape, (b) generated lessons-file content.

**Important note on `hookify-complete.out.json`:** the stored baseline contains an absolute `/var/folders/.../tmp.XXXX/.planning/lessons/...` path that was specific to the capture-time `mktemp -d` directory. It is NOT byte-comparable against a fresh Node run. Use the side-effect parity check below as the canonical diff. The stored `.out.json` documents the shape of the message only.

**Important note on em-dash JSON encoding (28-04 implementor MUST read):** Python `json.dumps(obj)` defaults to `ensure_ascii=True`, which escapes the U+2014 em-dash in `systemMessage` as the literal six-byte sequence `—`. JS `JSON.stringify(obj)` preserves the em-dash as the three raw UTF-8 bytes `\xe2\x80\x94`. The two outputs WILL NOT diff to empty unless `stop_hook.cjs` normalizes its output to match Python's ASCII escape. Confirm:

```bash
python3 -c 'import json; print(repr(json.dumps({"x":"a — b"})))'   # '{"x": "a \\u2014 b"}'
node -e 'console.log(JSON.stringify({x:"a — b"}))'                  # {"x":"a — b"}
```

Options for the Node port: (a) replace non-ASCII chars with `\uXXXX` escapes in a post-processing step before `process.stdout.write`, (b) document this as a known cross-encoding divergence and adjust the diff command to normalize both sides through `python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)))'`. The fixture baseline `hookify-complete.out.json` contains `—`, so option (a) is the simpler path to byte-identical parity.

Note that `lessons_ranker.py` line 150 explicitly uses `ensure_ascii=False`, so `lessons_ranker.cjs` does NOT have this issue — only `stop_hook.cjs` and `rule_runner.cjs` are affected.

```bash
# Same-second isolation: run Python and Node back-to-back in fresh temp .planning copies
PYDIR=$(mktemp -d); NODIR=$(mktemp -d)
cp -r .planning "$PYDIR/.planning"
cp -r .planning "$NODIR/.planning"
rm -f "$PYDIR/.planning/lessons/"*.md "$NODIR/.planning/lessons/"*.md

REPO=$PWD
(cd "$PYDIR" && CLAUDE_PLUGIN_ROOT="$PYDIR" python3 "$REPO/hooks/stop_hook.py"  \
    < "$REPO/.planning/phases/28-core-hook-scripts-node/fixtures/stop_hook/hookify-complete.in.json" \
    > "$PYDIR/stdout.json")
(cd "$NODIR" && CLAUDE_PLUGIN_ROOT="$NODIR" node          "$REPO/hooks/stop_hook.cjs" \
    < "$REPO/.planning/phases/28-core-hook-scripts-node/fixtures/stop_hook/hookify-complete.in.json" \
    > "$NODIR/stdout.json")

# Normalize TMPDIR-leaked paths in stdout before diffing.
sed -i.bak "s|$PYDIR|__TMPDIR__|g" "$PYDIR/stdout.json" && rm "$PYDIR/stdout.json.bak"
sed -i.bak "s|$NODIR|__TMPDIR__|g" "$NODIR/stdout.json" && rm "$NODIR/stdout.json.bak"
diff "$PYDIR/stdout.json" "$NODIR/stdout.json" || { echo "MISMATCH: hookify-complete stdout"; exit 1; }

# The two .planning/lessons/*.md files must be byte-identical (filenames AND content)
diff -q "$PYDIR/.planning/lessons/" "$NODIR/.planning/lessons/" || { echo "MISMATCH: hookify-complete lessons-dir"; exit 1; }
# Cross-check generated file content matches the captured fixture (TMPDIR-independent)
diff "$PYDIR/.planning/lessons/"*.md .planning/phases/28-core-hook-scripts-node/fixtures/stop_hook/hookify-complete.lessons.md \
  || { echo "MISMATCH: hookify-complete lessons content drifted from fixture baseline"; exit 1; }

rm -rf "$PYDIR" "$NODIR"
echo "stop_hook hookify-complete parity OK"
```

Both runs use the same date (same shell second) so the filename matches. The `sed` normalization replaces the per-run TMPDIR prefix with `__TMPDIR__` so the diff focuses on the message structure, not the directory path.

---

## 6. rule_runner.cjs verification

Section 2 (hookify-cache pre-flight gate) is MANDATORY before this section. If skipped and hookify is installed, all five diffs will silently produce empty `{}` outputs that match but prove nothing about rule logic.

Stage the fixture rule files into `.claude/` (backing up existing rules first), run all five diffs, then restore:

```bash
# Back up existing .claude rules
mkdir -p .claude.bak && mv .claude/*.local.md .claude.bak/ 2>/dev/null || true
cp .planning/phases/28-core-hook-scripts-node/fixtures/rule_runner/rules/*.md .claude/

FIX=.planning/phases/28-core-hook-scripts-node/fixtures/rule_runner
for name in bash-warn file-block no-match non-target-tool bad-regex; do
  diff <(python3 hooks/rule_runner.py  < "$FIX/$name.in.json") \
       <(node    hooks/rule_runner.cjs < "$FIX/$name.in.json") \
    || { echo "MISMATCH: rule_runner $name"; exit 1; }
done
echo "rule_runner parity OK (5 fixtures)"

# Restore .claude
rm -f .claude/sg-rule.bash-test-warn.local.md .claude/sg-rule.file-test-block.local.md .claude/sg-rule.bad-regex-test.local.md
mv .claude.bak/*.local.md .claude/ 2>/dev/null || true
rmdir .claude.bak 2>/dev/null || true
```

Each diff MUST be empty. The `bad-regex` fixture exercises the regex-error swallow path — Python `re.error` and JS `SyntaxError` from `new RegExp("[unclosed", "i")` must both fall back to `false`, producing `{}`.

---

## 7. lessons_ranker.cjs verification

### 7.1 Top-N ranking

```bash
diff <(python3 hooks/lessons_ranker.py  --top 5 .planning/lessons/*.md) \
     <(node    hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md) \
  || { echo "MISMATCH: lessons_ranker --top 5"; exit 1; }
echo "lessons_ranker --top 5 parity OK"
```

Both runs MUST execute in the same shell session within seconds of each other — `recency` is computed against `date.today()`, so day-boundary crossings cause spurious mismatches. Output is JSON-lines on stdout.

### 7.2 Archive mode

```bash
# Delete pre-existing archive so neither run hits the "archive already exists — skipping" branch
rm -f .planning/milestones/vTEST-FIXTURE-LESSONS.md

# Capture Python archive output + artifact
python3 hooks/lessons_ranker.py --archive --milestone vTEST-FIXTURE .planning/lessons/*.md > /tmp/py_archive_status.out
mv .planning/milestones/vTEST-FIXTURE-LESSONS.md /tmp/vTEST-FIXTURE-LESSONS.py.md

# Capture Node archive output + artifact
node hooks/lessons_ranker.cjs --archive --milestone vTEST-FIXTURE .planning/lessons/*.md > /tmp/node_archive_status.out

# Compare
diff /tmp/py_archive_status.out /tmp/node_archive_status.out \
  || { echo "MISMATCH: lessons_ranker --archive stdout"; exit 1; }
diff /tmp/vTEST-FIXTURE-LESSONS.py.md .planning/milestones/vTEST-FIXTURE-LESSONS.md \
  || { echo "MISMATCH: lessons_ranker --archive artifact"; exit 1; }

# Cleanup
rm -f .planning/milestones/vTEST-FIXTURE-LESSONS.md /tmp/vTEST-FIXTURE-LESSONS.py.md \
      /tmp/py_archive_status.out /tmp/node_archive_status.out
echo "lessons_ranker --archive parity OK"
```

The status line printed to stdout (`[sg-complete] archived N lesson files to ...`) and the written archive file MUST both be byte-identical between Python and Node runs.

### 7.3 Em-dash byte audit (B-2)

`lessons_ranker.py` line 177 (`"... already exists: {dest} — skipping"`) and line 183 (`"# Lessons Archive — {milestone}"`) contain U+2014 EM DASH bytes (`\xe2\x80\x94`). `stop_hook.py` line 148 (`"Run {cmd_plan} to start the next phase — prior lessons will be included as context."`) contains one. A naive port might type ASCII `--` instead, which would make the diff above fail loudly — but the audit below catches the regression even before any diff runs, and prints a clearer failure message.

The audit asserts MINIMUM counts only. Python and JS sources may have different em-dash usage in comments; we only care that the user-visible strings preserve the bytes. The CANONICAL parity proof remains the diffs in 7.1 and 7.2 (and the side-effect diff in 5.2).

```bash
# lessons_ranker.cjs MUST contain at least 2 em-dash bytes in user-visible strings
NODE_LR_EMDASH=$(python3 -c 'print(open("hooks/lessons_ranker.cjs","rb").read().count(b"\xe2\x80\x94"))')
[ "$NODE_LR_EMDASH" -ge 2 ] || { echo "BLOCKER: lessons_ranker.cjs missing em-dash literals (count=$NODE_LR_EMDASH, expected >=2)"; exit 1; }

# stop_hook.cjs MUST contain at least 1 em-dash byte in user-visible strings
NODE_SH_EMDASH=$(python3 -c 'print(open("hooks/stop_hook.cjs","rb").read().count(b"\xe2\x80\x94"))')
[ "$NODE_SH_EMDASH" -ge 1 ] || { echo "BLOCKER: stop_hook.cjs missing em-dash literal (count=$NODE_SH_EMDASH, expected >=1)"; exit 1; }

echo "em-dash byte audit OK (lessons_ranker.cjs=$NODE_LR_EMDASH, stop_hook.cjs=$NODE_SH_EMDASH)"
```

Equivalent grep-only form (BSD/GNU portable, U+2014 — literal in the regex):

```bash
[ $(grep -c -- '—' hooks/lessons_ranker.cjs) -ge 2 ] && [ $(grep -c -- '—' hooks/stop_hook.cjs) -ge 1 ] && echo "em-dash audit OK"
```

---

## 8. Overall parity gate

A run of this document is "PASS" if and only if every section below reports OK. Plans 28-01 / 28-02 / 28-03 each verify Sections 2–4 and one of 5/6/7 corresponding to their target file. Plan 28-04 must additionally pass Section 5.2 (hookify-complete side-effect diff). Wave 3 cannot proceed until every line below is true.

| Section | Check | Expected output |
|---------|-------|------------------|
| 2 | hookify cache absent | `BLOCKER` NOT printed; script proceeds |
| 4 | transcript_matcher loop | `transcript_matcher parity OK` |
| 5 simple | gsd-plan-complete, review-complete, empty-signal diffs | empty diffs, then `stop_hook simple-signal parity OK` |
| 5.1 | auto-advance-off diff with config toggle | empty diff; `config.json restored OK` |
| 5.2 | hookify-complete stdout + lessons-dir + content diffs | empty diffs; `stop_hook hookify-complete parity OK` |
| 6 | 5 rule_runner diffs (bash-warn, file-block, no-match, non-target-tool, bad-regex) | `rule_runner parity OK (5 fixtures)` |
| 7.1 | lessons_ranker --top 5 diff | empty diff; `lessons_ranker --top 5 parity OK` |
| 7.2 | lessons_ranker --archive stdout + artifact diffs | empty diffs; `lessons_ranker --archive parity OK` |
| 7.3 | em-dash byte audit | `em-dash byte audit OK (lessons_ranker.cjs=N, stop_hook.cjs=M)` with N>=2 and M>=1 |

Any non-OK line is a BLOCKING failure. Do not promote any `.cjs` file to use until this gate passes end-to-end.
