# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- JavaScript (CommonJS / ES5+) — all hook scripts (`hooks/*.cjs`), installer (`bin/setup.js`)
- Markdown with YAML frontmatter — all skill definitions (`skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`)
- JSON — hook configuration (`hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`), project config (`.planning/config.json`)

**Secondary:**
- Bash — embedded shell snippets inside SKILL.md `<process>` blocks; executed by Claude Code at skill invocation time, not compiled

**Legacy / Inactive:**
- Python — `hooks/__pycache__/` contains CPython 3.14 `.pyc` bytecache for `stop_hook`, `rule_runner`, `transcript_matcher`, `lessons_ranker`. Python source files are NOT present; these are remnant cache files from a prior Python implementation that was ported to Node.js (super-gsd v2.4 NODE-01 through NODE-04).

## Runtime

**Environment:**
- Node.js >=18 (declared in `package.json` `engines.node`). Tested against v24.13.0 on development machine.
- CommonJS module system throughout (`.cjs` extension enforced). No ESM.

**Package Manager:**
- npm v11.15.0 (development machine)
- No `package-lock.json` present in repo (no `node_modules` — zero npm dependencies)

## Frameworks

**Core:**
- None. All hooks use Node.js built-ins exclusively (`fs`, `path`, `util`).

**Testing:**
- Not detected. No test runner, no `jest.config.*`, no `vitest.config.*`, no `*.test.*` or `*.spec.*` files.

**Build/Dev:**
- None. No transpilation, bundling, or build step. Scripts run directly with `node`.

## Key Dependencies

**Critical:**
- **Node.js stdlib only**: `fs`, `path`, `util` (specifically `util.parseArgs` — requires Node.js >=18.3 for stable `parseArgs` API)
- Zero third-party npm packages. `package.json` has no `dependencies` or `devDependencies` fields.

**Infrastructure:**
- **Claude Code plugin system** — hooks registered via `hooks/hooks.json` (Claude Code), `.codex/hooks.json` (OpenAI Codex), `.gemini/settings.json` (Gemini CLI). Claude Code uses `CLAUDE_PLUGIN_ROOT` env var for path resolution.
- **GSD (`@opengsd/get-shit-done-redux` or equivalent)** — external dependency, not bundled. Skills delegate to `gsd-*` skill names (e.g., `gsd-plan-phase`, `gsd-ship`, `gsd-phase`). Must be installed separately in the target project.
- **Superpowers (`claude-plugins-official/superpowers`)** — external dependency, not bundled. Skills delegate to `superpowers:executing-plans`, `superpowers:requesting-code-review`, `superpowers:brainstorming`. Must be installed separately.

## Configuration

**Environment:**
- `CLAUDE_PLUGIN_ROOT` — optional env var. When set, hooks use it as the plugin root. When absent, hooks fall back to `path.dirname(path.dirname(__filename))` (i.e., the directory two levels above `hooks/*.cjs`).
- No `.env` files present in the repository.

**Runtime config file:**
- `.planning/config.json` — read at runtime by `stop_hook.cjs` and `rule_runner.cjs`. Key field: `super_gsd.auto_advance` (bool, default `true`). When `false`, both hooks short-circuit and emit `{}` (no-op).

**Build:**
- None. No build config files.

**Hook registration:**
- `hooks/hooks.json` — Claude Code hook registration (PreToolUse, Stop, SubagentStop)
- `.codex/hooks.json` — OpenAI Codex hook registration (PreToolUse, Stop)
- `.gemini/settings.json` — Gemini CLI hook registration (BeforeTool, SessionEnd)

## Platform Requirements

**Development:**
- Node.js >=18 (for `util.parseArgs`)
- macOS or Linux. All Bash snippets in skills must be BSD awk / POSIX compatible (no `grep -P`, no GNU-specific flags). See `CLAUDE.md` macOS Shell Portability section.
- Git — required by several skills that read `git log`, `git merge-base`, `git rev-parse`

**Production (target project install):**
- Node.js >=18 in the target project's environment
- Claude Code, OpenAI Codex, or Gemini CLI as the host AI coding assistant
- GSD and Superpowers installed in the target project (external, not bundled)

---

*Stack analysis: 2026-05-29*
