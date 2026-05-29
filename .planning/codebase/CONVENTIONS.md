# Coding Conventions

**Analysis Date:** 2026-05-29

## Naming Patterns

**Files:**
- Hook scripts: `{verb}_{noun}.cjs` — e.g., `stop_hook.cjs`, `rule_runner.cjs`, `transcript_matcher.cjs`, `lessons_ranker.cjs`
- Rule files: `sg-rule.{slug}.local.md` — e.g., `sg-rule.warn-handoff-single-condition.local.md`
- SKILL.md files: always named `SKILL.md`, inside a directory named `sg-{command-name}/`
- Lesson files: `{NN}-{YYYY-MM-DD}.md` — phase number zero-padded prefix, then date

**Directories:**
- Skills: `skills/sg-{command-name}/` under repo root
- Mirror skills (Codex/Gemini): `.agents/skills/sg-{command-name}/` — must match `skills/` pairwise
- Hooks: `hooks/` under repo root (all `.cjs`)
- Rules: `.claude/` directory with `sg-rule.*.local.md` pattern
- Lessons: `.planning/lessons/`

**SKILL.md command names:**
- All slash commands use `sg-` prefix: `/super-gsd:sg-plan`, `/super-gsd:sg-execute`, etc.
- The directory name and the `name:` frontmatter field must match exactly

**JavaScript functions:**
- Private/internal helpers: `_camelCase` with leading underscore (e.g., `_pyJsonDumps`, `_parseFrontmatter`, `_loadRules`, `_matchCondition`)
- Public/exported functions: `camelCase` without underscore (e.g., `detectSignal`, `parseLessonsFiles`, `computeScores`)
- Entry point: always named `main()`

**Rule frontmatter `name` field:**
- Pattern: `warn-{slug}` or `block-{slug}` matching the action type
- Examples: `warn-state-phase-awk-token`, `warn-handoff-single-condition`, `warn-plugin-json-skills-field`

## Code Style

**Formatting:**
- No dedicated formatter config (no `.eslintrc`, `.prettierrc`, `biome.json` present)
- Indentation: 2 spaces (consistent across all `.cjs` files)
- Semicolons: present at end of statements
- String quotes: single quotes for simple strings, backticks for template literals

**Linting:**
- No ESLint or other linter configured
- Manual compatibility enforcement via conventions (see Shell Compatibility section)

## Module System

**Node.js hooks:**
- CommonJS (`.cjs` extension) — all hooks use `require()` / `module.exports`
- Node.js built-ins only: `fs`, `path`, `util` — no external npm dependencies in hooks
- Each hook is self-contained: `_pyJsonDumps` and `_pyEncodeString` are duplicated inline in both `stop_hook.cjs` and `rule_runner.cjs` rather than shared (D-10 pattern: "inline helper, no shared module")
- Only `transcript_matcher.cjs` exports a function: `module.exports = { detectSignal }`
- `stop_hook.cjs` and `rule_runner.cjs` are CLI-only (no exports)

**Requiring modules:**
```js
// Standard pattern for all hooks
const fs = require('fs');
const path = require('path');
// Optional — only in lessons_ranker.cjs
const { parseArgs } = require('util');
```

## Shell Compatibility Rules (CRITICAL)

All Bash snippets in SKILL.md files must run on both macOS (BSD tools) and Linux (GNU tools):

**Forbidden patterns:**
- `grep -P` — macOS grep has no PCRE (`-P`) flag. Use `grep -E` (ERE) instead
- `awk` for pipe-delimited Markdown table parsing at the top level — BSD awk mishandles `|` separators. Use `awk -F'|'` explicitly when splitting on pipes
- `awk '{print $1}'` on raw STATE.md `Phase:` lines — this returns `"Phase"`, not the number

**Required STATE.md Phase parsing pipeline (macOS-compatible):**
```bash
# --- BEGIN STATE.md Phase parsing block ---
PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
# --- END STATE.md Phase parsing block ---
```

**Cross-platform hash computation:**
```bash
PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md 2>/dev/null | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
```

**HANDOFF.md pipe-table field extraction:**
```bash
# Use awk -F'|' with gsub for field extraction
STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
```

**Table parsing in skill scripts:**
- Never use `grep -P` or `awk -F'|'` for Read-then-interpret workflows
- For ROADMAP.md progress tables: use the Read tool + Edit tool, not bash parsing (`sg-phase`, `sg-status`)

## JSON Output in Hooks

Hooks must emit Python-compatible JSON (`json.dumps` defaults), not standard `JSON.stringify` output. Both `stop_hook.cjs` and `rule_runner.cjs` implement a hand-rolled `_pyJsonDumps` for byte-identical parity with the Python reference implementation:

```js
// Key differences from JSON.stringify:
// - separators: (', ', ': ') not (',', ':')
// - ensure_ascii: true — non-ASCII chars escaped as \uXXXX
// - Array: '[' + items.join(', ') + ']'
// - Object: '{' + pairs.join(', ') + '}'
```

## SKILL.md Document Structure

Every SKILL.md must follow this exact YAML frontmatter + XML block structure:

```markdown
---
name: sg-{command}
description: Use this when [trigger condition] — [what it does]
argument-hint: "[args] - [description]"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
[One paragraph describing what the skill accomplishes]
</objective>

<execution_context>
[What files it reads/writes; whether it's self-contained or delegates]
</execution_context>

<process>
[Numbered steps with bash code blocks]
</process>

<success_criteria>
[Numbered list of verifiable outcomes]
</success_criteria>
```

**`argument-hint` field:** Optional — include only when the skill accepts arguments.

## SKILL.md Language Output Rules

- Prose messages, progress labels, and table headers visible to the user must be rendered in the user's input language (Korean or English, auto-detected)
- Machine tokens must NOT be translated: `/super-gsd:sg-*` command names, stage enum values (`gsd-plan`, `superpowers`, `review`, `ship`, `complete`), file paths, timestamps, phase slugs, version IDs (`vX.Y`)
- Hard-coded English `echo` strings in bash snippets are internal signals — render them in user language when surfacing to the user

## HANDOFF.md Conventions

`.planning/HANDOFF.md` is an append-only pipe-delimited table. Schema is fixed at 6 columns:

```
| Timestamp | Phase | From | To | Plan Hash | User |
| --- | --- | --- | --- | --- | --- |
| 2026-05-29T12:00:00Z | 41-new-phase | gsd-plan | superpowers | abc1234 | gyuha |
```

**Stage enum values (To column):** `init`, `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `ship`, `complete`, `sg-next`

**Initialization guard (required in every sg-* skill that writes HANDOFF.md):**
```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
```

**Never modify existing rows — only append.**

## Shared Code Block Replication (D-07 Pattern)

Several SKILL.md files replicate identical bash blocks verbatim, marked with comment guards:

```bash
# --- BEGIN STATE.md Phase parsing block (D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift) ---
...
# --- END STATE.md Phase parsing block ---
```

Files using D-07 replicated blocks:
- `skills/sg-status/SKILL.md` — canonical source
- `skills/sg-start/SKILL.md` — replicates STATE.md parsing, HANDOFF.md detection, next-command routing
- `skills/sg-next/SKILL.md` — replicates HANDOFF.md detection + next-command routing
- `.agents/skills/` equivalents of each

**Rule:** When modifying a block in one file, update all files that replicate it simultaneously.

## Version Management

When bumping version, update ALL three files atomically:

1. `.claude-plugin/plugin.json` — `"version"` field
2. `package.json` — `"version"` field
3. `CHANGELOG.md` — new `## [X.Y.Z] - YYYY-MM-DD` section with `### Added/Fixed/Changed` subsections

**Commit message format:** `chore(release): bump version to X.Y.Z`

CHANGELOG format follows [Keep a Changelog](https://keepachangelog.com/). Subsections used: `### Added`, `### Fixed`, `### Changed`.

## Skills + Agents Parity Rule

When adding or modifying any skill under `skills/sg-{name}/SKILL.md`, check whether `.agents/skills/sg-{name}/SKILL.md` exists and apply the same changes there. This is a blocker in code review (Phase 32 Medium-1).

Currently paired skills (both `skills/` and `.agents/skills/` exist):
- `sg-execute`, `sg-learn`, `sg-next`, `sg-parallel-execute`, `sg-plan`, `sg-retro`, `sg-review`, `sg-setup`, `sg-ship`, `sg-start`, `sg-status`

Skills only in `skills/` (no `.agents/` counterpart required yet):
- `sg-cleanup`, `sg-complete`, `sg-explore`, `sg-health`, `sg-lessons`, `sg-new`, `sg-phase`, `sg-quick`, `sg-ui-plan`, `sg-update`

## sg-rule File Conventions

Rule files live in `.claude/sg-rule.{slug}.local.md`. Frontmatter schema:

```yaml
---
name: warn-{slug}          # unique identifier; prefix matches action
enabled: true
event: bash                # bash | file | all (no 'prompt' support)
pattern: "regex-here"      # simple single-condition shorthand
# OR use conditions for compound logic:
# conditions:
#   - field: command        # bash: command / file: new_string|new_text|file_path|old_string
#     operator: regex_match # regex_match | contains | equals | not_contains | starts_with | ends_with
#     pattern: "regex"
action: warn               # warn | block
---

경고 메시지 본문 (Markdown)
```

**Supported fields for `field`:** `command` (bash event), `new_string`/`new_text`/`content`/`file_path`/`old_string` (file event).

**`prompt` event is NOT supported** by `rule_runner.cjs`.

## Error Messages

Hooks write errors to `stdout` as `systemMessage` JSON (never `stderr`):
```js
console.log(_pyJsonDumps({ systemMessage: 'super-gsd rule_runner error: ' + e.message }));
```

CLI tools (`lessons_ranker.cjs`) write warnings/errors to `stderr`:
```js
process.stderr.write(`[warn] file not found: ${filepath}\n`);
process.stderr.write('[error] --milestone VERSION is required for --archive\n');
```

## Plugin Root Detection

All hooks use the same environment-variable-with-fallback pattern:
```js
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  || path.dirname(path.dirname(path.resolve(__filename)));
```

## Comments

**Hook files:** Line comments explain Python-parity decisions (e.g., `// Mirror rule_runner.py:35-101 LINE-BY-LINE per D-15.`). Reference tags follow the pattern `D-{N}` (design decisions), `HOOK-{N}` (hook behavior), `NODE-{N}` (Node.js port IDs), `W-{N}` (known deviation/warning).

**SKILL.md files:** Comments appear as `<!-- comment -->` inside XML blocks or as `# --- BEGIN/END {block name} ---` guards in bash code blocks.

---

*Convention analysis: 2026-05-29*
