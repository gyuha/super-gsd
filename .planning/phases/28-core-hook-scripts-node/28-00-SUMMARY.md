# 28-00-SUMMARY: Fixture Corpus + VERIFY Recipe

**Phase:** 28-core-hook-scripts-node
**Plan:** 28-00 (Wave 1)
**Status:** Complete
**Date:** 2026-05-25

## Files Created

### Top-level recipe

- `.planning/phases/28-core-hook-scripts-node/28-VERIFY.md` — 8-section parity recipe (Purpose, Pre-flight Gate, Prerequisites, transcript_matcher, stop_hook, rule_runner, lessons_ranker, Overall gate)

### stop_hook fixtures (10 JSON + 1 reference MD)

| File | Capture command |
|------|------------------|
| `fixtures/stop_hook/gsd-plan-complete.in.json` | hand-built (transcript_path -> fixtures/transcript_matcher/gsd-plan.txt) |
| `fixtures/stop_hook/gsd-plan-complete.out.json` | `CLAUDE_PLUGIN_ROOT=$PWD python3 hooks/stop_hook.py < gsd-plan-complete.in.json` |
| `fixtures/stop_hook/review-complete.in.json` | hand-built (-> review.txt) |
| `fixtures/stop_hook/review-complete.out.json` | `CLAUDE_PLUGIN_ROOT=$PWD python3 hooks/stop_hook.py < review-complete.in.json` |
| `fixtures/stop_hook/empty-signal.in.json` | hand-built (-> empty.txt) |
| `fixtures/stop_hook/empty-signal.out.json` | `CLAUDE_PLUGIN_ROOT=$PWD python3 hooks/stop_hook.py < empty-signal.in.json` |
| `fixtures/stop_hook/auto-advance-off.in.json` | hand-built (same payload as gsd-plan-complete) |
| `fixtures/stop_hook/auto-advance-off.out.json` | with `jq '.super_gsd = (.super_gsd // {}) + {"auto_advance": false}'` injected into config.json, then `python3 hooks/stop_hook.py < auto-advance-off.in.json`; config restored from `.bak` immediately after |
| `fixtures/stop_hook/hookify-complete.in.json` | hand-built (-> hookify.txt) |
| `fixtures/stop_hook/hookify-complete.out.json` | inside `mktemp -d` with `CLAUDE_PLUGIN_ROOT=$TMPDIR python3 hooks/stop_hook.py < hookify-complete.in.json`; real `.planning/lessons/` untouched |
| `fixtures/stop_hook/hookify-complete.lessons.md` | side-effect file generated during the same temp-dir run; copied out and renamed |

### transcript_matcher fixtures (6 .txt + 1 .json)

| File | Purpose | Signal expected |
|------|---------|-----------------|
| `fixtures/transcript_matcher/gsd-plan.txt` | 14 lines, `PLANNING COMPLETE` on line 13 | `gsd-plan-complete` |
| `fixtures/transcript_matcher/implementation.txt` | 5 lines, `Branch is ready for review` | `superpowers-implementation-complete` |
| `fixtures/transcript_matcher/review.txt` | 5 lines, `Code Review Complete` | `superpowers-review-complete` |
| `fixtures/transcript_matcher/hookify.txt` | `Retrospective complete` + `## Lessons` section + 3 body lines | `hookify-complete` |
| `fixtures/transcript_matcher/empty.txt` | single line, no signal | `''` |
| `fixtures/transcript_matcher/long-with-trailing-newline.txt` | **B-1 regression** — exactly 201 lines, trailing newline, signal on line 2 (0-idx 1). Python `splitlines()[-200:]` includes index 1; naive JS `split(/\r?\n/).slice(-200)` excludes it. | `gsd-plan-complete` |
| `fixtures/transcript_matcher/expected.json` | basename -> expected signal mapping for all 6 fixtures | — |

All 6 baselines confirmed via `python3 -c 'from transcript_matcher import detect_signal; ...'` (matches `expected.json`).

### rule_runner fixtures (5 .in.json + 3 rule .md)

| File | Purpose |
|------|---------|
| `fixtures/rule_runner/bash-warn.in.json` | Bash `rm -rf /tmp/test` matches warn rule |
| `fixtures/rule_runner/file-block.in.json` | Write with `FIXTURE_FORBIDDEN_TOKEN` matches block rule |
| `fixtures/rule_runner/no-match.in.json` | Bash `ls -la` matches nothing |
| `fixtures/rule_runner/non-target-tool.in.json` | tool_name=Read; rule_runner early-exits per `.py:264` |
| `fixtures/rule_runner/bad-regex.in.json` | with rule 3 staged, Python `re.error` and JS `SyntaxError` both swallow to `{}` |
| `fixtures/rule_runner/rules/sg-rule.bash-test-warn.local.md` | event=bash, pattern=`rm -rf /`, action=warn |
| `fixtures/rule_runner/rules/sg-rule.file-test-block.local.md` | event=file, conditions[new_string regex_match FIXTURE_FORBIDDEN_TOKEN], action=block |
| `fixtures/rule_runner/rules/sg-rule.bad-regex-test.local.md` | event=bash, pattern=`[unclosed` (deliberately invalid), action=warn |

No `.out.json` files captured for rule_runner — 28-VERIFY Section 6 uses direct `diff <(python3 ...) <(node ...)` rather than stored baselines.

### lessons_ranker fixtures (2 .cmd)

| File | Content (single line, no trailing newline) |
|------|---------|
| `fixtures/lessons_ranker/top5.cmd` | `python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md` |
| `fixtures/lessons_ranker/archive.cmd` | `python3 hooks/lessons_ranker.py --archive --milestone vTEST-FIXTURE .planning/lessons/*.md` |

No `.out.jsonl` / `.out.md` captured — outputs depend on `date.today()` recency, so 28-VERIFY Section 7 instructs the verifier to run both implementations within the same shell second and direct-diff the outputs.

## Em-dash byte audit (portable)

```bash
python3 -c 'p="hooks/stop_hook.py"; print(open(p,"rb").read().count(b"\xe2\x80\x94"))'         # -> 2
python3 -c 'p="hooks/lessons_ranker.py"; print(open(p,"rb").read().count(b"\xe2\x80\x94"))'   # -> 2
python3 -c 'p="hooks/rule_runner.py"; print(open(p,"rb").read().count(b"\xe2\x80\x94"))'      # -> 2
python3 -c 'p="hooks/transcript_matcher.py"; print(open(p,"rb").read().count(b"\xe2\x80\x94"))' # -> 0
```

Captured baseline files:

```bash
python3 -c 'p=".../stop_hook/hookify-complete.out.json"; d=open(p,"rb").read(); print("raw_utf8=",d.count(b"\xe2\x80\x94"),"json_esc=",d.decode().count(r"—"))'
# raw_utf8= 0   json_esc= 1   (Python json.dumps ensure_ascii=True escapes em-dash to —)

python3 -c 'p=".../stop_hook/hookify-complete.lessons.md"; print(open(p,"rb").read().count(b"\xe2\x80\x94"))'
# 0 (transcript content has no em-dash)
```

## Verifier setup notes

1. **hookify-cache rename:** 28-VERIFY Section 2 (BLOCKING gate) exits 1 if `~/.claude/plugins/cache/claude-plugins-official/hookify` exists. Rename to `.bak` before Section 6, restore after. Confirmed absent at fixture capture time (`HOOKIFY ABSENT`).
2. **`.planning/config.json` backup/restore:** Section 5.1 documents both `jq` and Python one-liner forms for idempotently injecting `super_gsd.auto_advance=false`, plus the mandatory post-restoration assertion that `auto_advance` is no longer false.
3. **Temp-dir isolation for hookify-complete:** Section 5.2 uses two separate `mktemp -d` directories for Python and Node, each with its own `CLAUDE_PLUGIN_ROOT`. Real `.planning/lessons/` is never written. TMPDIR paths in stdout are normalized via `sed` substitution before diff.
4. **`.claude/` rule staging:** Section 6 uses `mkdir .claude.bak && mv .claude/*.local.md .claude.bak/` to preserve existing user rules during fixture rule staging, then restores at the end.

## Deviations / surprises (must read before Wave 2/3)

### 1. `ensure_ascii` divergence — `stop_hook.cjs` parity at risk

Python `json.dumps()` defaults to `ensure_ascii=True`, escaping the U+2014 em-dash in `hookify-complete` output to the literal six-character sequence `—`. JS `JSON.stringify()` preserves em-dash as raw UTF-8 bytes (`\xe2\x80\x94`). The fixture baseline `hookify-complete.out.json` contains the `—` form (and the .lessons.md content path).

**Impact:** 28-04 stop_hook.cjs will fail the Section 5.2 stdout diff unless it normalizes output to match Python's ASCII escape. Plans 28-01..28-04 do NOT currently mention this. Suggested fix in 28-04: replace non-ASCII codepoints in the JSON string with `\uXXXX` escapes before `process.stdout.write`. `lessons_ranker.py` uses `ensure_ascii=False` explicitly (line 150), so `lessons_ranker.cjs` is unaffected. `rule_runner.cjs` may be affected if any user rule message body contains non-ASCII — currently the fixture rule messages are pure ASCII so the issue won't surface in Section 6 diffs but should still be addressed.

This divergence is now documented in 28-VERIFY Section 5.2 under the "Important note on em-dash JSON encoding" callout.

### 2. STATE.md `Phase:` is non-numeric — lessons filename contains spaces and parens

`hooks/stop_hook.py:55` parses `^Phase:\s*(.+)`, then tries `int()` on the captured group. Current STATE.md has `Phase: Not started (roadmap created, awaiting Phase 28 planning)` — `int()` fails, so the `padded` fallback uses the raw value. The generated lessons filename becomes literally `Not started (roadmap created, awaiting Phase 28 planning)-2026-05-25.md`. This is the captured baseline; both Python and Node ports will produce identical output as long as Node's `_readCurrentPhase()` mirrors the same regex semantics. The ugliness is a STATE.md content issue, not a port issue, and is out of scope for this plan (STATE.md is not modified by 28-00).

The Plan's `<read_first>` note "...the current `.planning/config.json` has no `super_gsd` key block" is also stale — current `config.json` already has `"super_gsd": {"auto_advance": true}`. The idempotent `jq` merge documented in the plan handles both cases correctly, so capture succeeded.

### 3. TMPDIR path leaks into `hookify-complete.out.json`

The baseline `hookify-complete.out.json` contains the literal absolute path `/var/folders/.../tmp.fpnYrFFTE6/.planning/lessons/Not started...-2026-05-25.md` from the capture-time `mktemp -d`. This is non-deterministic across machines/runs. Section 5.2 of 28-VERIFY uses `sed` to normalize both Python and Node TMPDIR prefixes to `__TMPDIR__` before diffing, and separately verifies the .lessons.md content against the deterministic `hookify-complete.lessons.md` fixture. The `.out.json` thus serves as a shape-reference only.

## Automated verify output (embedded `<verify>` block)

```
fixture corpus OK
```

All assertions pass: 4 subdirectories exist, `28-VERIFY.md` exists, file counts match (10 stop_hook json, 6 transcript txt, 5 rule_runner in.json, 3 rule md, 2 lessons_ranker cmd), `long-with-trailing-newline.txt` is 201 lines with trailing `\n`, 28-VERIFY contains the required grep markers (`transcript_matcher parity OK`, `diff <(python3 hooks/stop_hook.py`, `BLOCKER: hookify cache present`, em-dash).

## Additional verifier checks (PLAN `<verification>` block)

1. `transcript_matcher` baseline: all 6 fixtures resolve via `python3 -c 'from transcript_matcher import detect_signal; ...'` to values matching `expected.json`. **`long-with-trailing-newline.txt` -> `'gsd-plan-complete'` confirmed.** (B-1 regression catch armed.)
2. `.planning/config.json` post-baseline state: `super_gsd.auto_advance == True`. Restored OK.
3. 28-VERIFY Section 2 (Pre-flight Gate) is the FIRST gate, before Section 6 (rule_runner). Section header order: 1 Purpose, 2 Pre-flight Gate, 3 Prerequisites, 4 transcript_matcher, 5 stop_hook, 6 rule_runner, 7 lessons_ranker, 8 Overall.

## Wave 2/3 readiness

- Plans 28-01 (transcript_matcher.cjs), 28-02 (rule_runner.cjs), 28-03 (lessons_ranker.cjs) can begin in parallel.
- Plan 28-04 (stop_hook.cjs) must wait for 28-01 (require dependency) and MUST address the `ensure_ascii` divergence documented above.
