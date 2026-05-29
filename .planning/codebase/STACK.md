# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- JavaScript (CommonJS) — All hook scripts (`hooks/*.cjs`), installer (`bin/setup.js`)
- Markdown — All skill definitions (`skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`)
- Bash — Inline shell snippets embedded in SKILL.md `<process>` blocks; executed by Claude Code's Bash tool at runtime

**Secondary:**
- JSON — Plugin manifests (`plugin.json`, `marketplace.json`), hook registration (`hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`), config (`.planning/config.json`)
- YAML — Frontmatter in SKILL.md files (name, description, argument-hint) and rule files (`.claude/sg-rule.*.local.md`)

## Runtime

**Environment:**
- Node.js >= 18 (declared in `package.json` `engines.node`)
- Required for `util.parseArgs` (used in `hooks/lessons_ranker.cjs` and `bin/setup.js`), which was introduced in Node.js 18

**Shell:**
- Bash/zsh (macOS + Linux dual-target). BSD awk and GNU awk both targeted — `grep -P` (PCRE) prohibited, `-E` (ERE) required

**Package Manager:**
- npm — used for global install of dependencies (`npm install -g @opengsd/get-shit-done-redux`)
- No lockfile (no `package-lock.json` — zero runtime dependencies declared in `package.json`)
- Published and installable via `npx @gyuha/super-gsd install`

## Frameworks

**Core:**
- None. All hook logic is pure Node.js built-in modules only (`fs`, `path`, `util`).

**Testing:**
- Not detected. No test runner config or test files present.

**Build/Dev:**
- None. No transpilation, bundling, or compilation step. CJS files run directly.

## Key Dependencies

**Zero runtime npm dependencies.** `package.json` declares no `dependencies` or `devDependencies`. All hooks use only Node.js built-in modules:
- `fs` — file read/write in all `.cjs` files
- `path` — path resolution in all `.cjs` files
- `util` (`parseArgs`) — CLI argument parsing in `hooks/lessons_ranker.cjs` and `bin/setup.js`

**External tools (not npm packages — system-level prerequisites):**
- `node` >= 18 — runtime for all `.cjs` hooks
- `npm` — used by `sg-update` skill to install/update GSD globally
- `git` — used by skill Bash snippets (e.g., `git config user.name`, `git log`)
- `claude` CLI — used by `sg-update` and `sg-health` for plugin management (`claude plugin install`, `claude plugin list`)

## Configuration

**Environment:**
- `CLAUDE_PLUGIN_ROOT` — env var injected by Claude Code plugin system; used in `hooks/stop_hook.cjs` and `hooks/rule_runner.cjs` to locate plugin root. Falls back to `path.dirname(path.dirname(path.resolve(__filename)))` when absent.
- `GEMINI_PROJECT_DIR` — used in `.gemini/settings.json` hook commands
- No `.env` file detected

**Plugin Manifest:**
- `.claude-plugin/plugin.json` — Claude Code marketplace plugin registration; `skills` field points to `./skills/`
- `.claude-plugin/marketplace.json` — self-hosted marketplace descriptor with `$schema` pointing to `https://anthropic.com/claude-code/marketplace.schema.json`

**Hook Registration:**
- `hooks/hooks.json` — Claude Code hook config (PreToolUse → `rule_runner.cjs`, Stop/SubagentStop → `stop_hook.cjs`)
- `.codex/hooks.json` — OpenAI Codex hook config (same hooks, relative paths)
- `.gemini/settings.json` — Gemini CLI hook config (SessionEnd → `stop_hook.cjs`, BeforeTool → `rule_runner.cjs`)

**Runtime Config:**
- `.planning/config.json` — GSD workflow settings; `super_gsd.auto_advance` controls whether `stop_hook.cjs` emits advancement prompts

## Platform Requirements

**Development:**
- macOS or Linux
- Node.js >= 18
- Claude Code CLI with plugin support (Stop, SubagentStop, PreToolUse hook events)
- GSD (`@opengsd/get-shit-done-redux`) installed globally
- Superpowers plugin installed (`claude plugin install superpowers@claude-plugins-official`)

**Production (target project install):**
- Same prerequisites as development
- Installed via `npx @gyuha/super-gsd install` which copies `hooks/`, `.agents/`, `.codex/hooks.json` into the target project
- Optional: `.gemini/settings.json` copied with `--gemini` flag

---

*Stack analysis: 2026-05-29*
