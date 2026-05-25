---
phase: 29-hook
plan: 01
status: complete
commit: 3ffffde
completed: 2026-05-25
---

# Phase 29-01 Summary: Hook 설정 명령 교체

## What changed

3개 hook 설정 파일에서 7개 command 문자열을 `python3 ... .py` → `node ... .cjs`로 surgical 교체했다. 두 토큰(`python3` → `node`, `.py` → `.cjs`)만 바꾸고 그 외 모든 바이트(quoting, env-var 전개, path prefix, key 순서, `_note`/`_schema_note`, timeout, 들여쓰기, trailing newline)는 byte-exact 보존했다.

### Before / After (canonical)

| File | Hook | Before | After |
|---|---|---|---|
| `hooks/hooks.json` | PreToolUse | `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.py"` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.cjs"` |
| `hooks/hooks.json` | Stop | `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py"` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.cjs"` |
| `hooks/hooks.json` | SubagentStop | `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py"` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.cjs"` |
| `.codex/hooks.json` | PreToolUse | `python3 hooks/rule_runner.py` | `node hooks/rule_runner.cjs` |
| `.codex/hooks.json` | Stop | `python3 hooks/stop_hook.py` | `node hooks/stop_hook.cjs` |
| `.gemini/settings.json` | SessionEnd | `python3 $GEMINI_PROJECT_DIR/hooks/stop_hook.py` | `node $GEMINI_PROJECT_DIR/hooks/stop_hook.cjs` |
| `.gemini/settings.json` | BeforeTool | `python3 $GEMINI_PROJECT_DIR/hooks/rule_runner.py` | `node $GEMINI_PROJECT_DIR/hooks/rule_runner.cjs` |

총 7 lines changed (7 insertions, 7 deletions) — `git log -1 --stat` 기준.

## 4-tier verification results

### Tier 1 — Static grep (Success Criterion #4)

```
$ grep -rn 'python3' hooks/hooks.json .codex/hooks.json .gemini/settings.json
(no output, exit 1 — 0 matches)
```

PASS.

### Tier 2 — JSON syntax

```
$ for f in hooks/hooks.json .codex/hooks.json .gemini/settings.json; do
    node -e "JSON.parse(require('fs').readFileSync('$f','utf-8'))"
  done
hooks/hooks.json valid
.codex/hooks.json valid
.gemini/settings.json valid
```

PASS — all 3 files parse cleanly.

### Tier 3 — `.cjs` dry-run

```
$ echo '{}' | node hooks/stop_hook.cjs >/dev/null   ; echo $?
0
$ echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | node hooks/rule_runner.cjs >/dev/null ; echo $?
0
```

PASS — both invocation targets respond to fixture input without error.

### Tier 4 — Manual

- **Claude Code (this environment):** Deferred to next session restart. The active session uses the pre-Phase-29 (`python3 ... .py`) hooks until restart. The hooks.json file on disk is correct — the runtime will pick up the new config on the next Stop/SubagentStop/PreToolUse trigger after a Claude Code session restart.
- **Codex CLI:** Environment not available. Satisfied via Tiers 1-3 per D-11 syntax-only fallback. ROADMAP Success Criterion #2's "manual" leg is covered by static grep + JSON parse + `.cjs` dry-run evidence.
- **Gemini CLI:** Environment not available. Satisfied via Tiers 1-3 per D-11 syntax-only fallback. ROADMAP Success Criterion #3's "manual" leg is covered by the same evidence.

### Pre-commit guard (D-12)

```
$ test -f hooks/stop_hook.cjs && test -f hooks/transcript_matcher.cjs && test -f hooks/rule_runner.cjs && test -f hooks/lessons_ranker.cjs
(exit 0)
```

PASS — all 4 `.cjs` files exist immediately before staging.

### Semantic value-level verification

Beyond byte-level grep, a `node -e` JSON-parse harness asserted each of the 7 command values is exactly the expected target string and all 7 timeouts are byte-exact (Claude 5/10/10, Codex 5/10, Gemini 10000/5000). All 14 assertions PASS (`ALL_GREEN`).

## Commit shape

| Property | Value |
|---|---|
| Hash | `3ffffde` |
| Subject | `feat(29): swap python3 → node in hook configs` |
| Files changed | 3 (`hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`) |
| Stat | 7 insertions(+), 7 deletions(-) |
| Co-author trailer | `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` |

## Deviations from plan

**One material finding, no scope deviation.**

The PLAN.md `<verify><automated>` block for Task 2 (the `SWAP_OK` gate) contains a defect that survived both plan-checker iterations: it greps the file with patterns like `'node "${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.cjs"'` (unescaped JSON value form), but the actual file bytes contain `'node \"${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.cjs\"'` (JSON-escaped form, with backslash-quotes). The gate returns false-negative against a *correct* implementation.

I detected this at task-end verification (the gate exited 1 against a correct edit), confirmed the implementation was right via `od -c` byte inspection + JSON `JSON.parse` value comparison, and proceeded. Task 3's verify gate does NOT have this defect (it only greps for `python3` absence and JSON validity, not for new strings on file bytes), so the commit gate executed cleanly.

**Implication:** This is a lesson for future plans that touch JSON files. Verify gates that check post-edit content must either (a) match the JSON-encoded file bytes (escape the quotes), or (b) parse JSON and compare values. Naive `grep -F` against the human-readable string form will false-negative on any JSON value containing double quotes.

**No PLAN.md retroactive edit** — the plan is committed to git history and the defect is documented here for the retrospective.

## Carry-forward state

- `.py` files in `hooks/` remain in place per **D-03**. Phase 31 CLEAN-01 will delete them after Phase 30 (Skill/Agent caller migration) completes.
- The current Claude Code session continues to use the old `.py` hooks until next restart (per macOS plugin runtime behavior). Restart triggers re-read of `hooks/hooks.json`.
- All 7 timeout values verified byte-exact per **D-07** — no follow-up timeout tuning required unless manual smoke test surfaces latency issues.

## Requirements traceability

| REQ-ID | File | Verification |
|---|---|---|
| CFG-01 | `hooks/hooks.json` | 3 commands swapped, JSON valid, dry-runs OK |
| CFG-02 | `.codex/hooks.json` | 2 commands swapped, JSON valid, dry-runs OK |
| CFG-03 | `.gemini/settings.json` | 2 commands swapped, JSON valid, dry-runs OK |

## ROADMAP Success Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | `hooks/hooks.json` commands in `node "${CLAUDE_PLUGIN_ROOT}/hooks/*.cjs"` form, no `python3` | PASS — verified via JSON value parse + Tier 1 grep |
| 2 | `.codex/hooks.json` commands in `node hooks/*.cjs` form (manual) | PASS — Tiers 1-3 satisfy "manual" leg per D-11 |
| 3 | `.gemini/settings.json` commands in `node $GEMINI_PROJECT_DIR/hooks/*.cjs` form (manual) | PASS — Tiers 1-3 satisfy "manual" leg per D-11 |
| 4 | `grep -rn 'python3' ...` returns 0 matches | PASS — Tier 1 |

## Next phase

Phase 30 (SKILL-01, SKILL-02, AGENT-01) — Skill/Agent 내부 `python3` 호출 교체. Phase 31 (CLEAN-01 + DOC-01..03) — `.py` 파일 삭제 + 문서 갱신. Both unblocked.
