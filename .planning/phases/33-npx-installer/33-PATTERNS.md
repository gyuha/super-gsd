# Phase 33: npx Installer - Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 3 (2 new, 1 modified)
**Analogs found:** 2 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `package.json` | config | N/A | `.claude-plugin/plugin.json` | partial (same repo metadata structure) |
| `bin/setup.js` | utility (CLI) | file-I/O | `hooks/lessons_ranker.cjs` | role-match (CLI entry, fs + path + process.argv) |
| `CLAUDE.md` | config (docs) | N/A | existing `CLAUDE.md` §배포 트리거 | exact (additive modification only) |

## Pattern Assignments

### `package.json` (config, npm manifest)

**Analog:** `.claude-plugin/plugin.json`

No direct analog for npm `package.json` exists in the codebase — `.claude-plugin/plugin.json` is the closest structural reference (shared metadata fields: `name`, `version`, `description`, `author`, `license`, `homepage`, `repository`, `keywords`).

**Version reference** (`.claude-plugin/plugin.json` lines 1-20):
```json
{
  "name": "super-gsd",
  "version": "0.0.39",
  "description": "...",
  "author": { "name": "gyuha", "url": "https://github.com/gyuha" },
  "license": "MIT",
  "homepage": "https://github.com/gyuha/super-gsd",
  "repository": "https://github.com/gyuha/super-gsd",
  "keywords": ["gsd", "superpowers", "orchestration", "workflow", "claude-code"]
}
```

**Target `package.json` shape** (per D-01 through D-05 in CONTEXT.md):
```json
{
  "name": "@gyuha/super-gsd",
  "version": "0.0.39",
  "description": "...",
  "bin": { "super-gsd": "bin/setup.js" },
  "files": ["bin/", "hooks/", ".agents/", ".codex/", ".gemini/"],
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

Key decision: no `"type": "module"` field — CommonJS default (mirrors hooks/*.cjs).

---

### `bin/setup.js` (utility, file-I/O CLI)

**Analog:** `hooks/lessons_ranker.cjs`

`lessons_ranker.cjs` is the best analog: it is the only CLI-mode hook that uses `process.argv`, `fs` (read + write + stat + mkdir), `path`, and a `main()` guard pattern. It handles file existence checks (`fs.existsSync`) and emits styled output.

`stop_hook.cjs` and `rule_runner.cjs` are secondary analogs for the shebang, PLUGIN_ROOT detection, and `require.main === module` guard.

**Shebang + require pattern** (`hooks/stop_hook.cjs` lines 1-7, `hooks/lessons_ranker.cjs` lines 1-7):
```js
#!/usr/bin/env node
// description comment

const fs = require('fs');
const path = require('path');
```

**PLUGIN_ROOT / __dirname path resolution** (`hooks/stop_hook.cjs` lines 10-11, `hooks/rule_runner.cjs` lines 11-12):
```js
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  || path.dirname(path.dirname(path.resolve(__filename)));
```

For `bin/setup.js`, the equivalent is:
```js
const PKG_ROOT = path.dirname(path.dirname(path.resolve(__filename)));
// __dirname resolves to <pkg>/bin/, so .. gives package root
```

**process.argv / CLI args pattern** (`hooks/lessons_ranker.cjs` lines 277-295):
```js
const { parseArgs } = require('util');

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    force: { type: 'boolean', default: false },
    gemini: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});
```

**File existence check before copy** (`hooks/lessons_ranker.cjs` lines 231-256):
```js
if (fs.existsSync(dest)) {
  process.stdout.write(`[warn] already exists: ${dest} — skipping\n`);
  process.exit(0);
}
fs.mkdirSync(milestonesDir, { recursive: true });
```

Apply same pattern in `bin/setup.js` for each destination file, replacing `process.exit(0)` with continue-and-count logic.

**stderr for warnings, stdout for progress** (`hooks/lessons_ranker.cjs` lines 159-161):
```js
process.stderr.write(`[warn] file not found: ${filepath}\n`);
```
For `bin/setup.js`, ANSI color is used instead of `[warn]` prefix (per D-10/D-11). ANSI codes inline, no chalk dependency:
```js
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const RESET  = '\x1b[0m';
```

**`require.main === module` guard** (`hooks/stop_hook.cjs` lines 144-146, `hooks/lessons_ranker.cjs` lines 297-303):
```js
if (require.main === module) {
  main();
}
```

**Recursive directory copy pattern** — no existing analog in codebase. Use `fs.cpSync(src, dest, { recursive: true })` (Node 16.7+, safe for Node 18+). For individual files, use `fs.copyFileSync(src, dest)` with `fs.mkdirSync(path.dirname(dest), { recursive: true })` before.

**`main()` function structure** (`hooks/lessons_ranker.cjs` lines 277-294):
```js
function main() {
  // parse args
  // validate command (show usage if unknown)
  // dispatch to handler function
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`[error] unexpected: ${e.message}\n`);
    process.exit(1);
  }
}
```

**Summary output pattern** (adapted from `lessons_ranker.cjs` stdout writes):
```js
process.stdout.write(`\nInstallation complete.\n`);
process.stdout.write(`  Copied:  ${copied} files\n`);
process.stdout.write(`  Skipped: ${skipped} files (already exist)\n`);
```

---

### `CLAUDE.md` (config/docs, additive modification)

**Analog:** existing `/Users/gyuha/workspace/super-gsd/CLAUDE.md` §배포 트리거

This is an additive change only. The `배포 트리거` section currently lists `.claude-plugin/plugin.json` and `CHANGELOG.md` as files to update on deploy. The modification adds `package.json` to this list.

**Target section to modify** (`CLAUDE.md` §배포 트리거, step 2):
```markdown
2. **plugin.json 업데이트** — `version` 필드를 새 버전으로 교체한다.
```
Add after step 2:
```markdown
2-b. **package.json 업데이트** — `version` 필드를 새 버전으로 교체한다.
```

And in §버전 관리, add `package.json` to the file list alongside `.claude-plugin/plugin.json` and `CHANGELOG.md`.

---

## Shared Patterns

### No External Dependencies
**Source:** All `hooks/*.cjs` files
**Apply to:** `bin/setup.js`

Every hook uses only Node.js built-in modules (`fs`, `path`, `util`). `bin/setup.js` must follow the same constraint — no `npm install` dependency on chalk, glob, or any other package. ANSI escape codes inline; `fs.cpSync`/`fs.copyFileSync` for file operations; `util.parseArgs` for CLI args.

### CommonJS Module Style
**Source:** `hooks/stop_hook.cjs` lines 1-7, `hooks/rule_runner.cjs` lines 1-7
**Apply to:** `bin/setup.js`

```js
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
// No `import`/`export` syntax. No `"type": "module"` in package.json.
```

### Node 18+ Compatibility
**Source:** `hooks/lessons_ranker.cjs` line 7 (`require('util').parseArgs` — available Node 18.3+)
**Apply to:** `bin/setup.js`, `package.json`

`fs.cpSync` requires Node 16.7+; `util.parseArgs` requires Node 18.3+. Both safe under `"engines": { "node": ">=18" }`.

### File Operation Safety Pattern
**Source:** `hooks/lessons_ranker.cjs` lines 156-165
**Apply to:** `bin/setup.js` copy logic

```js
try {
  // fs operation
} catch (e) {
  process.stderr.write(`[warn] cannot read ${filepath}: ${e.message}\n`);
  continue;
}
```

Wrap each `fs.copyFileSync` / `fs.cpSync` call in try/catch. On error: print to stderr, increment an `errors` counter, continue to next file.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `package.json` | config | N/A | No npm package manifest exists in repo; `.claude-plugin/plugin.json` is a partial structural reference only |

The recursive directory copy sub-logic in `bin/setup.js` also has no existing analog — use `fs.cpSync(src, dest, { recursive: true })` directly (Node 18+ stdlib).

---

## Metadata

**Analog search scope:** `hooks/`, `.claude-plugin/`, root-level config files
**Files scanned:** 5 (stop_hook.cjs, rule_runner.cjs, lessons_ranker.cjs, transcript_matcher.cjs, plugin.json)
**Pattern extraction date:** 2026-05-26
