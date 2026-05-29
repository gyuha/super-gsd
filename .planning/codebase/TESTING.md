# Testing Patterns

**Analysis Date:** 2026-05-29

## Test Framework

**Runner:**
- None configured. No `jest.config.*`, `vitest.config.*`, or test runner present.
- `package.json` has no `scripts.test` entry and no test-framework dependencies.

**Assertion Library:**
- None installed.

**Run Commands:**
```bash
# No automated test runner. Manual hook invocation only:

# Test rule_runner with a synthetic PreToolUse event
echo '{"tool_name":"Bash","tool_input":{"command":"awk \"{print $1}\""}}' | node hooks/rule_runner.cjs

# Test stop_hook with a synthetic Stop event
echo '{"session_id":"test","stop_hook_active":true}' | node hooks/stop_hook.cjs

# Test lessons_ranker ranking mode
node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md

# Test lessons_ranker archive mode
node hooks/lessons_ranker.cjs --archive --milestone v1.2 .planning/lessons/*.md
```

## Test File Organization

**No dedicated test files exist.** The repository has no `*.test.*`, `*.spec.*`, `test_*`, `*_test.*` files or `__tests__`/`test/` directories.

## What is Tested

Testing is entirely manual via stdin injection into hooks. The testing approach relies on:

1. **Direct stdin injection** — pipe a JSON payload to the hook script and observe stdout
2. **Rule file evaluation** — create a `.claude/sg-rule.*.local.md` and trigger the matching event
3. **Lessons file parsing** — run `lessons_ranker.cjs` against real `.planning/lessons/*.md` files
4. **SKILL.md correctness** — verified during GSD phase reviews (sg-review → Superpowers code review)

## Manual Test Patterns

### Hook Input/Output Pattern

All four hooks read JSON from `stdin` and write JSON to `stdout`. Test template:

```bash
# Rule runner — bash event (expects warn/block output or {})
echo '{"tool_name":"Bash","tool_input":{"command":"COMMAND_TO_TEST"}}' \
  | node hooks/rule_runner.cjs

# Rule runner — file event
echo '{"tool_name":"Edit","tool_input":{"file_path":"plugin.json","new_string":"content without skills field"}}' \
  | node hooks/rule_runner.cjs

# Stop hook — no transcript (expects empty {})
echo '{"transcript_path":""}' | node hooks/stop_hook.cjs

# Stop hook — with real transcript path
echo "{\"transcript_path\":\"$HOME/.claude/projects/.../*.jsonl\"}" | node hooks/stop_hook.cjs
```

### Expected Output Format

Hooks always emit a single JSON line to stdout following Python `json.dumps` default formatting (space after colon and comma):

```json
{}
{"systemMessage": "warning text here"}
{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny"}, "systemMessage": "block message"}
```

Empty `{}` means no action. A `systemMessage` key means warn/inform. `permissionDecision: "deny"` blocks the tool call.

### lessons_ranker Output Pattern

`--top N` mode emits one JSON object per line (JSON Lines format):

```
{"pattern": "pattern text", "score": 0.8432, "source": "00-2026-05-21.md:## Lens: Conversation Analyzer"}
```

`--archive --milestone vX.Y` mode writes to `.planning/milestones/{VERSION}-LESSONS.md` and exits `0`.

## Verification Strategy

Since there is no automated test suite, correctness is verified via:

**1. Phase review (sg-review):**
- Each GSD phase ends with `sg-review`, which runs a Superpowers code review subagent
- The review agent checks hook behavior, SKILL.md step logic, and shell compatibility

**2. sg-rule files as regression guards:**
- `.claude/sg-rule.*.local.md` files encode known bugs as PreToolUse rules
- `rule_runner.cjs` evaluates these rules on every Bash/Edit/Write tool call
- This provides continuous runtime checking against previously observed failures:
  - `sg-rule.state-phase-awk.local.md` — catches `awk '{print $1}'` on STATE.md (returns "Phase" not number)
  - `sg-rule.warn-handoff-single-condition.local.md` — catches single-condition HANDOFF.md init check (misses missing-header case)
  - `sg-rule.warn-sg-next-self-reference.local.md` — catches missing `sg-next` transparent-pass in routing
  - `sg-rule.plugin-json-skills.local.md` — catches plugin.json writes missing `"skills"` field

**3. Lessons injection (lessons_ranker.cjs):**
- At the start of each `sg-plan`, prior lessons are ranked and injected into context
- This surfaces recurring failure patterns before new implementation begins

## Coverage

**Requirements:** No coverage tooling or targets enforced.

**Untested areas (structural gaps):**
- `_roundHalfEven` banker's rounding logic in `lessons_ranker.cjs` — complex float arithmetic with no unit test; verified by comparing output against Python reference
- `_parseFrontmatter` edge cases in `rule_runner.cjs` — nested dict items, mixed list/dict, multi-line values
- `transcript_matcher.cjs` signal detection — depends on real transcript file paths; no mock
- SKILL.md bash logic — no automated test; verified only during phase execution

## Integration Points Requiring Manual Verification

When modifying hooks, manually verify these integration points:

| Component | Verification Command | Expected Output |
|-----------|----------------------|-----------------|
| `rule_runner.cjs` rule load | `echo '{"tool_name":"Bash","tool_input":{"command":"grep -P foo"}}' \| node hooks/rule_runner.cjs` | `{}` (no rule matches grep -P) |
| `stop_hook.cjs` auto_advance guard | Set `.planning/config.json` `super_gsd.auto_advance: false`, run hook | `{}` emitted immediately |
| `lessons_ranker.cjs` top-N | `node hooks/lessons_ranker.cjs --top 3 .planning/lessons/*.md` | 3 JSON lines with pattern/score/source |
| `lessons_ranker.cjs` archive | `node hooks/lessons_ranker.cjs --archive --milestone vTEST .planning/lessons/*.md` | creates `.planning/milestones/vTEST-LESSONS.md` |

## Adding New Tests

There is no test framework to extend. To add regression coverage for a new bug:

1. Create a `.claude/sg-rule.{slug}.local.md` file with a `pattern` or `conditions` that matches the buggy command
2. Set `action: warn` (or `action: block` for critical bugs)
3. Write the warning message in Korean (user-visible prose) with a code example showing the correct pattern
4. Verify the rule fires: `echo '{"tool_name":"Bash","tool_input":{"command":"<buggy-pattern>"}}' | node hooks/rule_runner.cjs`

---

*Testing analysis: 2026-05-29*
