# Codebase Structure

**Analysis Date:** 2026-05-29

## Directory Layout

```
super-gsd/
├── .claude-plugin/             # Claude Code plugin manifest
│   ├── plugin.json             # Plugin metadata, skills path, version
│   └── marketplace.json        # Marketplace listing metadata
├── skills/                     # Primary skill definitions (21 skills)
│   ├── sg-cleanup/SKILL.md
│   ├── sg-complete/SKILL.md
│   ├── sg-execute/SKILL.md
│   ├── sg-explore/SKILL.md
│   ├── sg-health/SKILL.md
│   ├── sg-learn/SKILL.md
│   ├── sg-lessons/SKILL.md
│   ├── sg-new/SKILL.md
│   ├── sg-next/SKILL.md
│   ├── sg-parallel-execute/SKILL.md
│   ├── sg-phase/SKILL.md
│   ├── sg-plan/SKILL.md
│   ├── sg-quick/SKILL.md
│   ├── sg-retro/SKILL.md
│   ├── sg-review/SKILL.md
│   ├── sg-setup/SKILL.md
│   ├── sg-ship/SKILL.md
│   ├── sg-start/SKILL.md
│   ├── sg-status/SKILL.md
│   ├── sg-ui-plan/SKILL.md
│   └── sg-update/SKILL.md
├── hooks/                      # Node.js hook scripts (Claude Code lifecycle)
│   ├── hooks.json              # Hook event registration (Claude Code)
│   ├── stop_hook.cjs           # Stop/SubagentStop handler
│   ├── rule_runner.cjs         # PreToolUse rule evaluator
│   ├── transcript_matcher.cjs  # Signal detection utility (required by stop_hook)
│   └── lessons_ranker.cjs      # CLI: weighted lesson scoring + archive
├── .agents/                    # Mirror layer for non-Claude-Code platforms
│   └── skills/                 # 11 mirrored skills (Codex/Gemini/agent platforms)
│       ├── sg-execute/SKILL.md
│       ├── sg-learn/SKILL.md
│       ├── sg-next/SKILL.md
│       ├── sg-parallel-execute/SKILL.md
│       ├── sg-plan/SKILL.md
│       ├── sg-retro/SKILL.md
│       ├── sg-review/SKILL.md
│       ├── sg-setup/SKILL.md
│       ├── sg-ship/SKILL.md
│       ├── sg-start/SKILL.md
│       └── sg-status/SKILL.md
├── .claude/                    # Claude Code project-level config
│   ├── sg-rule.*.local.md      # PreToolUse guard rules (4 active rules)
│   └── worktrees/              # Git worktree tracking (internal)
├── .codex/
│   └── hooks.json              # Hook registration for Codex platform
├── .gemini/
│   └── settings.json           # Hook registration for Gemini platform
├── .antigravitycli/            # Antigravity CLI platform support
├── bin/
│   └── setup.js                # npx installer — copies hooks + .agents + .codex
├── docs/
│   └── COMMANDS.md             # Command reference documentation
├── .planning/                  # GSD workflow state (git-ignored except codebase/)
│   ├── STATE.md                # Current phase/milestone (YAML frontmatter + prose)
│   ├── HANDOFF.md              # Append-only stage transition audit log
│   ├── ROADMAP.md              # Milestone/phase plan
│   ├── MILESTONES.md           # Milestone history
│   ├── PROJECT.md              # Project reference
│   ├── TEAM.md                 # Team context
│   ├── RETROSPECTIVE.md        # High-level retrospective notes
│   ├── config.json             # Runtime config (auto_advance toggle)
│   ├── lessons/                # Phase retrospective outputs ({NN}-{YYYY-MM-DD}.md)
│   ├── phases/                 # Phase work directories
│   │   └── <NN>-<slug>/        # Per-phase artifacts
│   │       ├── <NN>-CONTEXT.md     # Phase context (gsd-discuss-phase output)
│   │       ├── <NN>-01-PLAN.md     # Plan files (numbered)
│   │       ├── <NN>-01-SUMMARY.md  # Post-execution summaries
│   │       └── parallel_groups.json # Wave groups (when parallel execution used)
│   ├── milestones/             # Completed milestone archives
│   │   └── vX.Y-LESSONS.md     # Archived lessons per milestone
│   ├── quick/                  # Quick-task planning directories
│   ├── reports/                # Generated reports
│   ├── research/               # Research notes
│   └── codebase/               # Codebase analysis docs (tracked in git)
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       └── (other GSD map docs)
├── images/                     # Documentation images
├── package.json                # npm package config (@gyuha/super-gsd v0.0.47)
├── CLAUDE.md                   # Project conventions and architecture guide
├── CHANGELOG.md                # Version history
├── README.md                   # English documentation
├── README.ko.md                # Korean documentation
└── AGENTS.md                   # Agent platform documentation
```

## Directory Purposes

**`skills/`:**
- Purpose: Primary skill definitions, one subdirectory per `/super-gsd:sg-*` slash command
- Contains: Single `SKILL.md` per subdirectory — YAML frontmatter + Markdown instruction blocks
- Key files: `skills/sg-status/SKILL.md` (contains the D-07 canonical parsing blocks), `skills/sg-execute/SKILL.md` (parallel routing logic)

**`hooks/`:**
- Purpose: Node.js CommonJS scripts executed by Claude Code/Codex/Gemini on lifecycle events
- Contains: 4 `.cjs` files + 1 `hooks.json` registration manifest
- Key files: `hooks/stop_hook.cjs` (auto-advance guidance), `hooks/rule_runner.cjs` (guardrails), `hooks/lessons_ranker.cjs` (scoring CLI)

**`.agents/skills/`:**
- Purpose: Mirror of 11 core skills for agent platforms (Codex, Gemini, raw agent APIs)
- Contains: Subset of `skills/` with identical content — must be kept in sync
- Key constraint: Any change to a mirrored skill in `skills/` requires the same change in `.agents/skills/`

**`.claude/`:**
- Purpose: Claude Code project-level configuration and guard rules
- Contains: `sg-rule.*.local.md` files evaluated by `rule_runner.cjs` on every PreToolUse
- Key files: `sg-rule.state-phase-awk.local.md`, `sg-rule.plugin-json-skills.local.md`, `sg-rule.warn-handoff-single-condition.local.md`, `sg-rule.warn-sg-next-self-reference.local.md`

**`.planning/`:**
- Purpose: All GSD workflow state — git-ignored (except `.planning/codebase/`) to avoid committing planning noise
- Contains: STATE.md, HANDOFF.md, ROADMAP.md, per-phase directories, lessons, milestones archive
- Key constraint: `.planning/codebase/` is explicitly un-ignored (`!.planning/codebase/` in `.gitignore`)

**`bin/`:**
- Purpose: npm package binary — `npx @gyuha/super-gsd install` entry point
- Contains: `setup.js` — copies `hooks/`, `.agents/`, `.codex/`, optionally `.gemini/settings.json`

## Key File Locations

**Entry Points:**
- `skills/sg-start/SKILL.md`: Session detection and resume/new-milestone branching
- `skills/sg-plan/SKILL.md`: Phase planning entry with lessons injection
- `hooks/stop_hook.cjs`: Auto-advance guidance after Claude sessions complete
- `bin/setup.js`: npm installer entry point

**Configuration:**
- `.claude-plugin/plugin.json`: Plugin version, skill path, marketplace metadata
- `hooks/hooks.json`: Claude Code hook event registration
- `.codex/hooks.json`: Codex hook registration
- `.planning/config.json`: Runtime `super_gsd.auto_advance` toggle
- `.claude/sg-rule.*.local.md`: Active PreToolUse guard rules

**Core Logic:**
- `hooks/transcript_matcher.cjs`: Signal detection constants and `detectSignal()` function
- `hooks/lessons_ranker.cjs`: `computeScores()` with `0.4*freq + 0.4*recency + 0.2*severity` formula
- `hooks/rule_runner.cjs`: `_parseFrontmatter()`, `_loadRules()`, `_matchCondition()`, `_evaluate()`

**Planning Artifacts (runtime):**
- `.planning/HANDOFF.md`: Append-only stage transition log (source of truth for current stage)
- `.planning/STATE.md`: Current phase/milestone (source of truth for current phase number)
- `.planning/ROADMAP.md`: Milestone and phase definitions (read by sg-status, sg-execute, sg-next)
- `.planning/lessons/`: Phase retrospective outputs — input to `lessons_ranker.cjs`

**Testing:**
- `.pytest_cache/`: Python test cache (legacy — Python hooks have been deleted as of phase 31)

## Naming Conventions

**Skills directories:**
- Pattern: `sg-<kebab-name>/` — all lowercase, hyphen-separated, `sg-` prefix mandatory
- Examples: `sg-execute/`, `sg-parallel-execute/`, `sg-ui-plan/`

**Hook files:**
- Pattern: `<name>_<type>.cjs` — underscore-separated, `.cjs` extension (CommonJS)
- Examples: `stop_hook.cjs`, `rule_runner.cjs`, `transcript_matcher.cjs`

**Rule files:**
- Pattern: `sg-rule.<slug>.local.md` — fixed prefix `sg-rule.`, fixed suffix `.local.md`
- Examples: `sg-rule.state-phase-awk.local.md`, `sg-rule.plugin-json-skills.local.md`

**Phase directories:**
- Pattern: `.planning/phases/<NN>-<kebab-slug>/` — zero-padded two-digit number + hyphen + slug
- Examples: `.planning/phases/39-handoff-user-tracking/`, `.planning/phases/40-sg-execute-branch-workflow/`

**Phase artifacts:**
- Pattern: `<NN>-CONTEXT.md`, `<NN>-<WW>-PLAN.md`, `<NN>-<WW>-SUMMARY.md` — phase number prefix
- Examples: `39-CONTEXT.md`, `39-01-PLAN.md`, `39-01-SUMMARY.md`

**Lessons files:**
- Pattern: `.planning/lessons/<NN>-<YYYY-MM-DD>.md` — phase number + date
- Examples: `39-2026-05-28.md`, `00-2026-05-21.md`

**SKILL.md structure:**
- All skill files are named exactly `SKILL.md` (uppercase)
- YAML frontmatter fields: `name`, `description`, `argument-hint` (optional)
- Required sections: `<language>`, `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>`

## Where to Add New Code

**New skill:**
- Implementation: `skills/sg-<name>/SKILL.md` (create directory + SKILL.md)
- If the skill needs agent platform support: also create `.agents/skills/sg-<name>/SKILL.md` with identical content
- No changes needed to `plugin.json` — `"skills": "./skills/"` auto-registers all subdirectories

**New hook rule:**
- Implementation: `.claude/sg-rule.<slug>.local.md`
- Format: YAML frontmatter with `name`, `enabled`, `event` (bash|file|all), `pattern` or `conditions`, `action` (warn|block)
- No registration needed — `rule_runner.cjs` globs `.claude/sg-rule.*.local.md` automatically

**New hook script:**
- Implementation: `hooks/<name>.cjs`
- Must be registered manually in `hooks/hooks.json` under the appropriate event key

**Modifying shared parsing logic:**
- The STATE.md Phase parsing block (D-07) and HANDOFF.md stage detection block appear verbatim in multiple SKILL.md files
- Files containing D-07 blocks: `skills/sg-status/SKILL.md`, `skills/sg-next/SKILL.md`, `skills/sg-start/SKILL.md`, `skills/sg-retro/SKILL.md`
- All copies must be updated simultaneously when the block changes

**New planning artifact type:**
- Place under `.planning/` (git-ignored by default)
- If it should be tracked in git, add `!.planning/<filename>` to `.gitignore` (see the `.planning/codebase/` pattern)

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes — explicitly un-ignored in `.gitignore` via `!.planning/codebase/`

**`.planning/phases/<NN>-*/`:**
- Purpose: Per-phase work artifacts (context, plans, summaries, parallel groups)
- Generated: Yes (by gsd-discuss-phase, gsd-plan-phase, sg-execute)
- Committed: No (`.planning/` is git-ignored)

**`.planning/lessons/`:**
- Purpose: Retrospective outputs fed back into future sg-plan runs
- Generated: Yes (by sg-retro)
- Committed: No (`.planning/` is git-ignored)

**`.agents/`:**
- Purpose: Mirror for agent/Codex/Gemini platforms
- Generated: No (maintained manually, must stay in sync with `skills/`)
- Committed: Yes — included in npm package `"files"` field

**`hooks/__pycache__/`:**
- Purpose: Python bytecode cache (legacy — Python hooks deleted in phase 31)
- Generated: Yes (auto)
- Committed: No (`.gitignore`)

---

*Structure analysis: 2026-05-29*
