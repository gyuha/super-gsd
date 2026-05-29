# Codebase Structure

**Analysis Date:** 2026-05-29

## Directory Layout

```
super-gsd/
├── skills/                      # 21 Claude Code slash command definitions
│   ├── sg-cleanup/SKILL.md      # Archive completed phase directories
│   ├── sg-complete/SKILL.md     # Complete a phase or close a milestone
│   ├── sg-execute/SKILL.md      # Hand off plan to Superpowers for implementation
│   ├── sg-explore/SKILL.md      # Invoke gsd-map-codebase for codebase mapping
│   ├── sg-health/SKILL.md       # Diagnose GSD/Superpowers/hooks installation
│   ├── sg-learn/SKILL.md        # Delegate to sg-retro for retrospective
│   ├── sg-lessons/SKILL.md      # Review prior lessons before planning
│   ├── sg-new/SKILL.md          # Start a new milestone
│   ├── sg-next/SKILL.md         # Auto-advance to next workflow stage
│   ├── sg-parallel-execute/     # Dispatch parallel Task() agents per wave
│   ├── sg-phase/SKILL.md        # Edit/remove/complete a phase
│   ├── sg-plan/SKILL.md         # Plan a phase with lessons injection
│   ├── sg-quick/SKILL.md        # Ad-hoc task via gsd-planner + Superpowers
│   ├── sg-retro/SKILL.md        # Structured retrospective (6 lenses)
│   ├── sg-review/SKILL.md       # Code review via superpowers:requesting-code-review
│   ├── sg-setup/SKILL.md        # In-session installer for target projects
│   ├── sg-ship/SKILL.md         # Ship a phase via gsd-ship
│   ├── sg-start/SKILL.md        # Start or resume a project session
│   ├── sg-status/SKILL.md       # Show current workflow state + next command
│   ├── sg-ui-plan/SKILL.md      # UI design brainstorming via superpowers
│   └── sg-update/SKILL.md       # Update GSD/Superpowers/super-gsd tools
│
├── hooks/                       # Node.js hook handlers (CommonJS)
│   ├── hooks.json               # Claude Code event → command mapping
│   ├── stop_hook.cjs            # Stop/SubagentStop: detect signal, emit next step
│   ├── rule_runner.cjs          # PreToolUse: evaluate sg-rule files
│   ├── transcript_matcher.cjs   # Library: scan transcript for workflow signals
│   └── lessons_ranker.cjs       # CLI: rank .planning/lessons/*.md by score
│
├── .agents/                     # Codex / multi-agent runtime mirror
│   └── skills/                  # 11 skills mirrored from skills/ (subset)
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
│
├── bin/
│   └── setup.js                 # `npx @gyuha/super-gsd install` entry point
│
├── .claude-plugin/
│   ├── plugin.json              # Claude Code plugin manifest (name, version, skills path)
│   └── marketplace.json         # Marketplace metadata
│
├── .claude/                     # Project-level Claude Code configuration
│   ├── sg-rule.*.local.md       # Rule files consumed by rule_runner.cjs
│   └── worktrees/               # Git worktree support
│
├── .codex/
│   └── hooks.json               # Codex event → command mapping (PreToolUse, Stop)
│
├── .gemini/
│   └── settings.json            # Gemini CLI event → command mapping
│
├── .antigravitycli/             # Antigravity CLI integration (presence only)
│
├── .planning/                   # GSD planning artifacts (runtime data)
│   ├── HANDOFF.md               # Append-only stage audit log (schema-locked)
│   ├── STATE.md                 # Current phase/milestone YAML frontmatter + prose
│   ├── ROADMAP.md               # Phase definitions, success criteria, progress
│   ├── config.json              # Runtime toggles (auto_advance, mode, etc.)
│   ├── MILESTONES.md            # Milestone checklist
│   ├── RETROSPECTIVE.md         # Project-level retrospective notes
│   ├── TEAM.md                  # Team collaboration notes
│   ├── PROJECT.md               # Project reference document
│   ├── codebase/                # Codebase analysis documents (this directory)
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   ├── STACK.md
│   │   └── INTEGRATIONS.md
│   ├── lessons/                 # Per-phase retrospective outputs
│   │   └── NN-YYYY-MM-DD.md     # e.g. 36-2026-05-27.md
│   ├── milestones/              # Archived phases and lesson archives
│   │   └── vX.Y-phases/         # Archived phase directories per milestone
│   ├── phases/                  # Active per-phase planning directories
│   │   └── NN-<slug>/           # e.g. 39-handoff-user-tracking/
│   │       ├── NN-CONTEXT.md    # Phase context from gsd-discuss-phase
│   │       ├── NN-NN-PLAN.md    # Implementation plan(s)
│   │       └── NN-NN-SUMMARY.md # Post-execution summary
│   ├── quick/                   # Quick task planning directories
│   │   └── YYMMDD-XXX-<slug>/
│   ├── reports/                 # Ad-hoc reports
│   └── research/                # Ad-hoc research notes
│
├── docs/                        # Additional documentation
├── images/                      # README images/screenshots
├── CLAUDE.md                    # Project-level Claude Code instructions
├── AGENTS.md                    # Agent-runtime instructions
├── README.md                    # English documentation
├── README.ko.md                 # Korean documentation
├── CHANGELOG.md                 # Version history
├── package.json                 # npm package manifest (@gyuha/super-gsd)
└── LICENSE
```

## Directory Purposes

**`skills/`:**
- Purpose: The 21 `/super-gsd:sg-*` slash command definitions. Each subdirectory contains exactly one `SKILL.md`.
- Contains: Markdown files with YAML frontmatter + XML-tagged instruction blocks
- Key files: `skills/sg-plan/SKILL.md`, `skills/sg-execute/SKILL.md`, `skills/sg-status/SKILL.md`, `skills/sg-next/SKILL.md`

**`.agents/skills/`:**
- Purpose: Mirror of the 11 most-used skills for Codex and multi-agent runtimes that read `.agents/` instead of `skills/`
- Contains: Identical SKILL.md content to their `skills/` counterparts (must stay in sync)
- Key constraint: When modifying `skills/sg-X/SKILL.md`, also update `.agents/skills/sg-X/SKILL.md` if it exists

**`hooks/`:**
- Purpose: Node.js CommonJS modules that handle Claude Code lifecycle events
- Contains: `.cjs` files (no build step; run directly via `node`)
- Key files: `stop_hook.cjs` (auto-advance), `rule_runner.cjs` (rule enforcement), `transcript_matcher.cjs` (signal library), `lessons_ranker.cjs` (lessons CLI)

**`.claude/`:**
- Purpose: Project-level rule files loaded by `rule_runner.cjs`
- Contains: `sg-rule.*.local.md` files — each defines one PreToolUse warn/block rule

**`.planning/`:**
- Purpose: All GSD runtime data; written by skills, read by both skills and hooks
- Key constraint: `HANDOFF.md` is append-only — never edit existing rows

**`bin/`:**
- Purpose: npm package CLI entry point
- Contains: `setup.js` — the `npx @gyuha/super-gsd install` command that copies `hooks/`, `.agents/`, `.codex/` into a target project

## Key File Locations

**Entry Points:**
- `skills/sg-start/SKILL.md`: Start or resume a project
- `skills/sg-status/SKILL.md`: Check current workflow state
- `skills/sg-next/SKILL.md`: Auto-advance to next stage
- `bin/setup.js`: npx installer

**Plugin Registration:**
- `.claude-plugin/plugin.json`: Declares `"skills": "./skills/"` — Claude Code reads this to register all slash commands

**Hook Registration:**
- `hooks/hooks.json`: Claude Code reads this for PreToolUse/Stop/SubagentStop bindings
- `.codex/hooks.json`: Codex reads this for hook bindings
- `.gemini/settings.json`: Gemini CLI reads this for hook bindings

**Stage Routing (shared logic — must be updated in both):**
- `skills/sg-status/SKILL.md`: Stage display + next-command routing table
- `skills/sg-next/SKILL.md`: Auto-invoke version of the same routing table

**Data:**
- `.planning/HANDOFF.md`: Append-only stage audit log
- `.planning/STATE.md`: Current phase (YAML `Phase:` field)
- `.planning/config.json`: `super_gsd.auto_advance` toggle

## Naming Conventions

**Skills directories:**
- Pattern: `sg-<verb>` or `sg-<noun>` (always lowercase, hyphenated)
- Examples: `sg-plan`, `sg-execute`, `sg-parallel-execute`, `sg-ui-plan`

**Hook files:**
- Pattern: `<role>_hook.cjs` for hooks; `<role>_matcher.cjs` / `<role>_ranker.cjs` for utilities
- All hooks use `.cjs` extension (CommonJS, Node.js 18+)

**Rule files:**
- Pattern: `sg-rule.<slug>.local.md` — always in `.claude/`
- Slug describes what the rule guards: `warn-handoff-single-condition`, `warn-sg-next-self-reference`

**Phase directories:**
- Pattern: `.planning/phases/NN-<slug>/` — zero-padded two-digit number + hyphen + kebab-case description
- Example: `39-handoff-user-tracking/`, `40-sg-execute-branch-workflow/`

**Phase artifacts:**
- Pattern: `NN-CONTEXT.md`, `NN-NN-PLAN.md`, `NN-NN-SUMMARY.md`
- Example: `41-CONTEXT.md`, `41-01-PLAN.md`, `41-01-SUMMARY.md`

**Lessons files:**
- Pattern: `NN-YYYY-MM-DD.md` — phase number prefix + ISO date
- Example: `36-2026-05-27.md`

**Quick task directories:**
- Pattern: `.planning/quick/YYMMDD-XXX-<slug>/` — 6-digit date + 3-char random ID + slug
- Example: `260528-dv4-create-sg-phase-skill-wrapping-gsd-phase/`

## Where to Add New Code

**New skill (slash command):**
- Create `skills/sg-<name>/SKILL.md` following the YAML frontmatter + XML-block structure
- If the skill should also work in Codex/multi-agent contexts, create identical `.agents/skills/sg-<name>/SKILL.md`
- No changes needed to `plugin.json` — the `"skills": "./skills/"` declaration auto-discovers all subdirectories

**New hook rule:**
- Create `.claude/sg-rule.<slug>.local.md` with YAML frontmatter
- No registration needed — `rule_runner.cjs` globs all `sg-rule.*.local.md` files in `.claude/` at runtime

**New hook (new lifecycle event):**
- Add handler file to `hooks/` as a `.cjs` file
- Register the event in `hooks/hooks.json` (Claude Code), `.codex/hooks.json` (Codex), and `.gemini/settings.json` (Gemini CLI)

**New planning artifact type:**
- Add to `.planning/` with a clear naming convention
- Document the schema in the file header (see HANDOFF.md for example)

**New signal string (for stop_hook auto-advance):**
- Add the substring to the appropriate array in `hooks/transcript_matcher.cjs` (lines 5–25)
- No other changes needed — `stop_hook.cjs` calls `detectSignal()` which checks all arrays

**Updated stage enum (new workflow stage):**
- Add to the `case` blocks in BOTH `skills/sg-status/SKILL.md` and `skills/sg-next/SKILL.md` simultaneously (D-03 lock)
- Update HANDOFF.md schema comment in `.planning/HANDOFF.md`

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents written by `/gsd:map-codebase`
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes

**`.planning/milestones/`:**
- Purpose: Archived phase directories and consolidated lesson files per milestone
- Generated: Yes (by `sg-complete` and `lessons_ranker.cjs --archive`)
- Committed: Yes

**`.planning/quick/`:**
- Purpose: Ephemeral planning directories for ad-hoc tasks via `sg-quick`
- Generated: Yes (by `sg-quick` via gsd-sdk)
- Committed: Yes (serves as audit trail)

**`hooks/__pycache__/`:**
- Purpose: Python bytecode cache (legacy — from when hooks were Python before v2.4 port)
- Generated: Yes
- Committed: No (should be in .gitignore; present but unused)

---

*Structure analysis: 2026-05-29*
