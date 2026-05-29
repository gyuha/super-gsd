# External Integrations

**Analysis Date:** 2026-05-29

## AI Development Workflow Tools

**GSD (Get Shit Done):**
- Package: `@opengsd/get-shit-done-redux` (npm global install)
- What it provides: Phase planning (`gsd-plan-phase`, `gsd-discuss-phase`), codebase mapping (`gsd-map-codebase`), shipping (`gsd-ship`), milestone completion (`gsd-complete-milestone`), quick tasks (`gsd-planner`, `gsd-sdk`)
- How integrated: Skills invoke GSD commands via `Skill(skill="gsd-*", args="...")` calls; `sg-plan` chains `gsd-discuss-phase` → `gsd-plan-phase`; `sg-ship` delegates to `gsd-ship`; `sg-explore` delegates to `gsd-map-codebase`
- Detection: `test -d "$HOME/.claude/get-shit-done"` (checked in `skills/sg-health/SKILL.md`)
- Install path: `$HOME/.claude/get-shit-done/`

**Superpowers:**
- Plugin: `superpowers@claude-plugins-official` (Claude Code plugin marketplace)
- What it provides: Plan execution (`superpowers:executing-plans`), code review (`superpowers:requesting-code-review`), UI brainstorming (`superpowers:brainstorming`)
- How integrated: `sg-execute` and `sg-quick` call `Skill(skill="superpowers:executing-plans", ...)` as terminal action; `sg-review` calls `superpowers:requesting-code-review`; `sg-ui-plan` calls `superpowers:brainstorming` in a subagent
- Detection: `test -d "$HOME/.claude/plugins/data/superpowers-claude-plugins-official"` (checked in `skills/sg-health/SKILL.md`)
- Install path: `$HOME/.claude/plugins/data/superpowers-claude-plugins-official/`

**sg-retro:**
- Skill: built into this plugin at `skills/sg-retro/SKILL.md`
- What it provides: Phase retrospective — extracts lessons from phase context and writes `.planning/lessons/*.md` files
- How integrated: `sg-learn` delegates entirely to `Skill(skill="sg-retro", args="$ARGUMENTS")`

## Claude Code Plugin System

**Plugin Marketplace:**
- Schema: `https://anthropic.com/claude-code/marketplace.schema.json` (referenced in `.claude-plugin/marketplace.json`)
- Self-hosted: `marketplace.json` in `.claude-plugin/` registers the plugin locally
- Plugin commands exposed: 21 `/super-gsd:sg-*` slash commands (one per subdirectory in `skills/`)

**Hook Events Consumed:**
- `PreToolUse` — `rule_runner.cjs` evaluates `.claude/sg-rule.*.local.md` rules before every tool call
- `Stop` — `stop_hook.cjs` detects workflow signals and emits `systemMessage` to guide next step
- `SubagentStop` — same `stop_hook.cjs` handler as Stop, for subagent completion events

**Environment Variable Provided by Claude Code:**
- `CLAUDE_PLUGIN_ROOT` — absolute path to installed plugin directory; consumed in `hooks/stop_hook.cjs` and `hooks/rule_runner.cjs`

## Alternative AI Runtimes (Optional)

**OpenAI Codex:**
- Config: `.codex/hooks.json`
- Hook mapping: PreToolUse → `rule_runner.cjs`, Stop → `stop_hook.cjs`
- Same hook scripts run; paths are relative to project root
- Note: `.codex/hooks.json` is copied to target projects on install

**Gemini CLI:**
- Config: `.gemini/settings.json`
- Hook mapping: BeforeTool → `rule_runner.cjs`, SessionEnd → `stop_hook.cjs`
- Variable: `$GEMINI_PROJECT_DIR` used for hook command paths
- Installed only when `--gemini` flag passed to `npx @gyuha/super-gsd install`
- Compatibility note: schema based on Gemini CLI docs; not fully verified (per `.planning/research/ANTIGRAVITY.md` reference in `.gemini/settings.json`)

## Version Control

**Git:**
- Used by: skill Bash snippets (e.g., `git config user.name` in HANDOFF.md row construction, `git log` in release tooling)
- No programmatic git library — raw `git` CLI calls only via Bash tool
- Required: `git` on PATH in any project where super-gsd skills run

## npm Registry

**Published package:**
- Name: `@gyuha/super-gsd`
- Version: `0.0.46` (as of analysis date)
- Registry: npmjs.com (standard npm registry)
- Install command for target projects: `npx @gyuha/super-gsd install`
- Global install for direct use: `npm install -g @gyuha/super-gsd`

## Data Storage

**Databases:** None

**File Storage:** Local filesystem only
- `.planning/HANDOFF.md` — append-only pipe-delimited audit log of stage transitions
- `.planning/STATE.md` — current workflow state (phase, stage); read by skills for context
- `.planning/lessons/*.md` — retrospective lesson files; ranked by `lessons_ranker.cjs`
- `.planning/config.json` — workflow feature flags and GSD/super-gsd config
- `.claude/sg-rule.*.local.md` — rule definitions for `rule_runner.cjs`

**Caching:** None

## Authentication & Identity

None. No API keys, auth tokens, or authentication flows. All integrations are:
- Local CLI tools (`gsd-sdk`, `claude`, `git`)
- Claude Code plugin system (no separate auth — runs within Claude Code session)
- npm public registry (no auth required for global installs of public packages)

## Monitoring & Observability

**Error Tracking:** None

**Logs:**
- Hook output goes to Claude Code's hook stderr/stdout capture
- `stop_hook.cjs` and `rule_runner.cjs` write JSON responses to stdout for Claude Code to parse
- `lessons_ranker.cjs` writes JSON lines to stdout (consumed by skill Bash pipelines)

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

---

*Integration audit: 2026-05-29*
