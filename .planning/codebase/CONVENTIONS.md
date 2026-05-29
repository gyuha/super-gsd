# Coding Conventions

**Analysis Date:** 2026-05-29

## Naming Patterns

**Files:**
- Hook scripts: lowercase with underscores, `.cjs` extension — `rule_runner.cjs`, `stop_hook.cjs`, `transcript_matcher.cjs`, `lessons_ranker.cjs`
- Installer script: lowercase with underscores, `.js` extension — `bin/setup.js`
- Skill definitions: `SKILL.md` (uppercase) inside `skills/{sg-name}/` directories
- Rule files: `sg-rule.{slug}.local.md` — e.g., `.claude/sg-rule.warn-handoff-single-condition.local.md`
- Config files: lowercase — `hooks.json`, `plugin.json`, `package.json`

**Functions:**
- Private/internal helpers: `_camelCase` with leading underscore — `_pyJsonDumps`, `_parseFrontmatter`, `_globLocalMd`, `_matchCondition`
- Public/exported functions: `camelCase` without underscore — `parseLessonsFiles`, `computeScores`, `detectSignal`
- Entry point: always named `main()` — present in all four `.cjs` hook files
- CLI mode guard: `if (require.main === module) { main(); }` at the bottom of every file

**Variables:**
- Local bash variables in SKILL.md scripts: `UPPER_SNAKE_CASE` — `PHASE_NUM`, `HANDOFF_FILE`, `PLAN_HASH`, `GIT_USER`
- JavaScript variables: `camelCase` — `toolName`, `toolInput`, `eventFilter`, `seenNames`
- Constants at module scope: `UPPER_SNAKE_CASE` — `PLUGIN_ROOT`, `GSD_PLAN_SIGNALS`, `YELLOW`, `GREEN`, `RESET`
- Loop iteration variables: single-word lowercase — `rule`, `entry`, `line`, `filepath`

**Skill identifiers:**
- All skills use `sg-` prefix — `sg-plan`, `sg-execute`, `sg-review`, `sg-retro`, `sg-status`, `sg-next`, etc.
- HANDOFF.md stage storage enum: `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `ship`, `complete`, `sg-next`
- HANDOFF.md stage display enum: `init`, `gsd`, `superpowers`, `sg-retro`, `ship`, `complete`

## Code Style

**Formatting:**
- No Prettier or ESLint config detected — no automated formatter enforced
- Indentation: 2 spaces (consistent across all `.cjs` files)
- Trailing semicolons: yes
- Single quotes for strings in JS unless template literals required
- Template literals (`\`...\``) used for multi-word string interpolation

**Linting:**
- No `.eslintrc` or `eslint.config.*` found — linting is not automated
- Style is enforced through code review and `sg-rule.*.local.md` hook rules

## Import Organization

**Order (Node.js CJS files):**
1. Node built-ins: `fs`, `path`, `util` — `const fs = require('fs')`
2. Local relative imports: `require('./transcript_matcher.cjs')`
3. No third-party npm dependencies in hook scripts

**Pattern:**
```javascript
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');
const { detectSignal } = require('./transcript_matcher.cjs');
```

## Error Handling

**Patterns:**
- Hook scripts wrap `main()` body in `try/catch/finally` — `finally` always calls `process.exit(0)` to prevent hangs
- Errors surfaced via `systemMessage` JSON output, not thrown: `{ systemMessage: 'super-gsd hook error: ' + e.message }`
- File read failures are silently swallowed with a `continue` or `return ''` — missing files are a normal operating condition
- CLI tools (`lessons_ranker.cjs`) write errors to `process.stderr` with `[error]` prefix and exit non-zero

**stdout vs stderr rule:**
- JSON hook output → `process.stdout.write(...)` (never `console.log` in stop_hook)
- Diagnostic/warning output → `process.stderr.write('[warn] ...')` or `process.stderr.write('[error] ...')`
- `console.log()` used in `rule_runner.cjs` only (predates `process.stdout.write` standardization)

**Bash error handling in SKILL.md:**
- Use `2>/dev/null` on commands expected to sometimes fail
- Use `|| echo "fallback"` for graceful defaults
- Explicit `exit 1` on fatal validation failures with a human-readable message to stderr
- `|| true` to suppress non-zero exit codes from optional cleanup operations

## Logging

**Framework:** None — direct `process.stderr.write` and `process.stdout.write`

**Patterns:**
- Warnings from CLI: `[warn] message` prefix to stderr
- Errors from CLI: `[error] message` prefix to stderr
- Completion signals from CLI: `[sg-complete] message` prefix to stdout
- Hook errors embedded in JSON: `{ systemMessage: 'super-gsd hook error: ...' }`
- Skill progress messages use bracket-prefixed labels: `[sg-plan] Step 1/2: ...`

## Comments

**When to Comment:**
- Design decision references: `// D-XX: explanation` (e.g., `// D-10: inline helper (no shared module)`)
- Port origin lines: `// Mirror rule_runner.py:35-101 LINE-BY-LINE per D-15`
- Block identity markers for synchronized code: `// --- BEGIN STATE.md Phase parsing block ---` / `// --- END ... ---`
- Divergence docs: note where JS behavior differs from the Python original (e.g., `String(null)` vs Python `str(None)`)

**JSDoc/TSDoc:** Not used — no TypeScript, no JSDoc annotations in any hook file

## Function Design

**Size:** Functions are moderate in length. Internal helpers (`_parseFrontmatter`) can be 100+ lines when directly porting Python logic line-by-line.

**Parameters:** Prefer plain objects or primitive arguments; no class instances

**Return Values:**
- Internal helpers return plain objects or primitives — e.g., `{ fm, body }` from `_parseFrontmatter`
- `main()` functions have no return value; results written to stdout
- Exported functions return values directly: `detectSignal()` returns a string; `parseLessonsFiles()` returns an array

## Module Design

**Exports:**
- Only one file exports anything: `transcript_matcher.cjs` exports `{ detectSignal }` via `module.exports`
- All other hooks are self-contained CLI scripts — no exports
- `require.main === module` guard present in all four hook files to allow future testability

**Inline duplication over shared modules:**
- `_pyJsonDumps` and `_pyEncodeString` are duplicated between `rule_runner.cjs` and `stop_hook.cjs` intentionally — design decision D-10 ("inline helper, no shared module") to avoid import-order fragility in hook execution
- `STATE.md Phase parsing block` and `HANDOFF.md stage detection block` are duplicated across `sg-status/SKILL.md`, `sg-next/SKILL.md`, and `sg-start/SKILL.md` with explicit `D-07` drift-lock comments requiring both to be updated simultaneously

## SKILL.md Conventions

**Frontmatter (YAML):**
```yaml
---
name: sg-{command}
description: Use this when {trigger condition} — {action taken}.
argument-hint: "[arg] - optional. Defaults to STATE.md current phase."
---
```

**Sections (in order):**
1. `<language>` — auto-detect user input language directive (Korean/English/mixed)
2. `<objective>` — single-paragraph description of what the skill does
3. `<execution_context>` — what files it reads/writes; whether it delegates
4. `<constraints>` — platform-specific constraints (present in `.agents/` variants only)
5. `<process>` — numbered steps with inline bash blocks
6. `<success_criteria>` — numbered verifiable outcomes

**Bash blocks within SKILL.md:**
- Embedded in fenced ` ```bash ` blocks
- Variable substitution instructions use `$ARGUMENTS` token
- Comments explain macOS/BSD compatibility rationale inline
- `Read tool` instructions for file reads that should NOT be bash grep

## HANDOFF.md Append Protocol

All `sg-*` skills that modify HANDOFF.md follow this 3-step pattern:

1. **Initialize if missing:**
```bash
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
```

2. **Compute GIT_USER:**
```bash
GIT_USER=$(git config user.name 2>/dev/null || echo "-")
[ -z "$GIT_USER" ] && GIT_USER="-"
```

3. **Append row (never modify existing rows):**
```bash
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | $TO_STAGE | $PLAN_HASH | $GIT_USER |" >> "$HANDOFF_FILE"
```

The single-condition `if [ ! -f "$HANDOFF_FILE" ]` guard is banned — rule `warn-handoff-single-condition` in `.claude/sg-rule.warn-handoff-single-condition.local.md` will fire.

## macOS/BSD Portability Rules

- **No `grep -P`** (PCRE) — use `grep -E` (ERE) instead
- **No `awk` to parse pipe-delimited markdown tables via `|` operator** — use `awk -F'|'` explicit field separator
- **STATE.md Phase parsing** must use the multi-step pipeline: `grep -E '^Phase:' | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//' | awk '{print $1}'` — not a single-token regex

---

*Convention analysis: 2026-05-29*
