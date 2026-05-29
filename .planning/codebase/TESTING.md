# Testing Patterns

**Analysis Date:** 2026-05-29

## Test Framework

**Runner:** None — no automated test framework installed or configured

- No `jest.config.*`, `vitest.config.*`, or `mocha.opts` detected
- No `test` script in `package.json`
- `.pytest_cache/` directory exists with empty `nodeids` (likely from an earlier Python prototype that was ported to Node.js — the Python source files no longer exist in the repo)
- No test files (`*.test.*`, `*.spec.*`) found anywhere in the codebase

**Run Commands:**
```bash
# Manual integration test — hook scripts accept JSON via stdin
echo '{"tool_name":"Bash","tool_input":{"command":"awk \"{print $1}\""}}' | node hooks/rule_runner.cjs

# stop_hook Stop event simulation
echo '{"session_id":"test","stop_hook_active":true}' | node hooks/stop_hook.cjs

# lessons weighted ranking
node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md

# milestone archive
node hooks/lessons_ranker.cjs --archive --milestone v1.2 .planning/lessons/*.md
```

These are the only documented test invocations, found in `CLAUDE.md`.

## Test File Organization

**Location:** No test files exist — not co-located and no separate test directory

**Naming:** Not applicable

**Structure:** Not applicable

## Test Strategy (Actual)

Testing in this codebase is exclusively manual and stdin-based. The hook scripts are designed for direct invocation with crafted JSON inputs piped to stdin. This is the project's de-facto test approach.

**Manual stdin testing:**
```bash
# Test rule_runner with a bash event
echo '{"tool_name":"Bash","tool_input":{"command":"grep -P pattern file"}}' \
  | node hooks/rule_runner.cjs

# Test rule_runner with a file event
echo '{"tool_name":"Edit","tool_input":{"file_path":"plugin.json","new_string":"{\"name\":\"test\"}"}}' \
  | node hooks/rule_runner.cjs

# Test stop_hook with a transcript path
echo '{"transcript_path":"/path/to/transcript.jsonl"}' \
  | node hooks/stop_hook.cjs
```

## `require.main === module` Guard

All four hook files implement the CLI guard pattern enabling future testability:

```javascript
// hooks/rule_runner.cjs
if (require.main === module) {
  main();
}

// hooks/transcript_matcher.cjs
module.exports = { detectSignal };
// (no main — library module only)
```

This pattern means any hook can be `require()`'d in a future test suite without triggering `main()`. Only `transcript_matcher.cjs` currently exports a public API (`{ detectSignal }`).

## Mocking

**Framework:** None — no mocking library used

**Current approach:** When manual testing, real files are used. For `transcript_matcher.cjs`, a real `.jsonl` transcript path is required. For `lessons_ranker.cjs`, real `.md` lesson files are required.

## Fixtures and Factories

**Test Data:** No fixture files or factory functions exist

**Lesson files in `.planning/lessons/`** serve as real-world corpus for `lessons_ranker.cjs` manual testing:
- `hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md` uses actual lesson content
- Files follow naming convention `{NN}-{YYYY-MM-DD}.md`

**sg-rule files in `.claude/`** serve as real-world test fixtures for `rule_runner.cjs`:
- `.claude/sg-rule.plugin-json-skills.local.md`
- `.claude/sg-rule.state-phase-awk.local.md`
- `.claude/sg-rule.warn-handoff-single-condition.local.md`
- `.claude/sg-rule.warn-sg-next-self-reference.local.md`

## Coverage

**Requirements:** None enforced — no coverage tool configured

**Untested paths (known gaps):**
- `_pyJsonDumps` / `_pyEncodeString` edge cases (non-ASCII, surrogate pairs, Infinity/NaN)
- `_parseFrontmatter` multi-line YAML conditions
- `_matchCondition` operator variants (`contains`, `equals`, `not_contains`, `starts_with`, `ends_with`)
- `computeScores` banker's rounding via `_roundHalfEven`
- `detectSignal` with each of the four signal arrays
- `archiveMode` happy path and `--milestone` missing error path

## Test Types

**Unit Tests:** Not present

**Integration Tests:** Not present

**E2E / Manual Tests:**
- All testing is manual stdin-pipe invocation (documented in `CLAUDE.md` Development Commands section)
- SKILL.md workflows are validated by running them via Claude Code sessions and inspecting HANDOFF.md + lessons output

## Adding Tests (Guidance for Future Work)

If a test framework is introduced, the `require.main === module` guard in all hook files already supports it. Recommended approach:

1. Choose a Node.js test runner (e.g., `node:test` built-in — requires no install, available in Node 18+)
2. Create `hooks/__tests__/` directory
3. Import hook functions via `require('../rule_runner.cjs')` — currently only internal helpers are not exported; either export them or restructure to separate logic from CLI glue
4. `transcript_matcher.cjs` is the only file already structured for import: `const { detectSignal } = require('./transcript_matcher.cjs')`

**Example structure for node:test:**
```javascript
// hooks/__tests__/transcript_matcher.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { detectSignal } = require('../transcript_matcher.cjs');

test('returns empty string for missing file', () => {
  assert.strictEqual(detectSignal('/nonexistent/path.jsonl'), '');
});
```

---

*Testing analysis: 2026-05-29*
