# External Integrations

**Analysis Date:** 2026-05-29

## APIs & External Services

This project has **zero direct API calls** to external HTTP services. There are no HTTP clients, no API keys used at runtime, and no outbound network requests made by any hook or script.

## Data Storage

**Databases:**
- None. No database client or ORM present.

**File Storage:**
- Local filesystem only. All runtime state is stored as plain files under `.planning/` in the target project:
  - `.planning/STATE.md` — current phase, stage, workflow state
  - `.planning/HANDOFF.md` — append-only audit log (pipe-delimited table)
  - `.planning/config.json` — runtime configuration (including `super_gsd.auto_advance`)
  - `.planning/lessons/*.md` — retrospective lessons (consumed by `lessons_ranker.cjs`)
  - `.planning/milestones/` — milestone lesson archives (written by `lessons_ranker.cjs --archive`)

**Caching:**
- None. No in-memory cache or external cache service.

## Authentication & Identity

**Auth Provider:**
- None. No authentication layer. The plugin operates entirely within the local filesystem and Claude Code hook event system. No user identity is involved.

## Monitoring & Observability

**Error Tracking:**
- None. Errors are emitted to `stderr` within hook scripts and surface as `systemMessage` in Claude Code responses.

**Logs:**
- No structured logging framework. Hook scripts write warning/error lines to `process.stderr`. Example: `[warn] file not found: ...`, `[error] ...`.

## CI/CD & Deployment

**Hosting:**
- npm registry: `@gyuha/super-gsd` — the package is published and installed via `npx @gyuha/super-gsd install`.

**CI Pipeline:**
- Not detected. No `.github/workflows/`, `.circleci/`, or equivalent CI config found.

## Host Platform Integrations

The plugin integrates with three AI coding assistant platforms via their hook event systems. Integration is purely configuration-based (JSON files). No SDK or library is imported.

**Claude Code (Anthropic):**
- Config: `hooks/hooks.json`
- Hook events consumed: `PreToolUse`, `Stop`, `SubagentStop`
- Path resolution: `CLAUDE_PLUGIN_ROOT` env var → `__dirname`-relative fallback
- Skill manifest: `.agents/skills/*/SKILL.md` (Claude Code reads these as slash commands `/super-gsd:sg-*`)
- Plugin metadata (if applicable): `.claude-plugin/plugin.json` (referenced in CLAUDE.md but not found in file scan — may be gitignored or removed)

**OpenAI Codex:**
- Config: `.codex/hooks.json`
- Hook events consumed: `PreToolUse`, `Stop`
- Path resolution: scripts referenced relative to project root (`node hooks/rule_runner.cjs`)
- Skill manifest: `.codex/` hooks only; Codex uses `$sg-*` command prefix

**Gemini CLI:**
- Config: `.gemini/settings.json`
- Hook events consumed: `BeforeTool`, `SessionEnd`
- Path resolution: `$GEMINI_PROJECT_DIR` env var
- Compatibility note: Schema noted as "not confirmed" in config file comment — may not be fully validated

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

## External Skill Dependencies (Runtime)

These are not npm packages but external Claude Code / AI assistant skill namespaces that must be installed separately in the target project. They are invoked via `Skill(skill="...")` calls inside SKILL.md `<process>` blocks.

**GSD (`@opengsd/get-shit-done-redux` or equivalent):**
- `gsd-plan-phase` — invoked by `sg-plan` skill
- `gsd-discuss-phase` — invoked by `sg-plan` via subagent
- `gsd-ship` — invoked by `sg-ship` skill
- `gsd-phase` — invoked by `sg-phase` skill (edit/remove routes)
- `gsd-new-project` — invoked by `sg-start` skill
- `gsd-new-milestone` — invoked by `sg-new` skill
- `gsd-complete-milestone` — invoked by `sg-complete` skill
- `gsd-cleanup` — invoked by `sg-cleanup` skill
- `gsd-quick` — invoked by `sg-quick` skill
- `gsd-map-codebase` — invoked by `sg-explore` / `sg-update` skills
- Source: `skills/*/SKILL.md` and `.agents/skills/*/SKILL.md` `Skill(skill="gsd-*")` calls

**Superpowers (`claude-plugins-official/superpowers`):**
- `superpowers:executing-plans` — invoked by `sg-execute`, `sg-quick` skills
- `superpowers:requesting-code-review` — invoked by `sg-review` skill (claude-code variant)
- `superpowers:brainstorming` — invoked by `sg-ui-plan` skill
- `superpowers:finishing-a-development-branch` — signal string detected by `transcript_matcher.cjs` (not a direct invocation)

**sg-retro (self-referential):**
- `sg-retro` — invoked by `sg-learn` skill via `Skill(skill="sg-retro", args="$ARGUMENTS")`
- This is a skill within the same super-gsd plugin namespace

## Environment Configuration

**Required env vars:**
- `CLAUDE_PLUGIN_ROOT` — optional but recommended. Hooks use it to locate their own directory. If absent, `__dirname`-relative path is used (works when installed in `hooks/` subdirectory).
- `GEMINI_PROJECT_DIR` — required for Gemini CLI hook path resolution (set by Gemini CLI automatically).

**Secrets location:**
- None. No secrets required. No API keys, tokens, or credentials of any kind.

---

*Integration audit: 2026-05-29*
