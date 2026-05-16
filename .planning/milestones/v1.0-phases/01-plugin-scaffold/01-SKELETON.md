---
phase: 01-plugin-scaffold
type: walking-skeleton
adapted_for: claude-code-plugin-distribution
---

# Walking Skeleton: super-gsd Plugin Distribution Slice

The standard Walking Skeleton template assumes a webapp (project + routing + DB read/write + UI interaction + dev deployment). super-gsd Phase 1 is a Claude Code plugin distribution scaffold — no DB, no UI, no server. This document records the adapted thin end-to-end slice for the plugin domain, and the architectural decisions Phase 2/3/4 will build on without renegotiating.

## Thin End-to-End Slice (Plugin Domain Mapping)

| Standard Walking Skeleton element | Adapted to super-gsd Phase 1 |
|----------------------------------|------------------------------|
| Project scaffold | Repo layout with `.claude-plugin/` directory at root |
| Routing / wiring | `marketplace.json` source resolution to `plugin.json` (entry source `"."`) |
| One real read/write | `/plugin marketplace add gyuha/super-gsd` successfully reads `.claude-plugin/marketplace.json` from the remote repo |
| One real user interaction | `/plugin install super-gsd@super-gsd` succeeds and the plugin appears in `/plugin list` |
| Dev deployment | The 4-item README "Verify install" checklist executes end-to-end on a fresh Claude Code session without breaking GSD / Superpowers / Hookify |

## Acceptance (End-to-End)

A real user (not the developer), starting from a Claude Code session that already has GSD, Superpowers, and Hookify installed, can:

1. Run `/plugin marketplace add gyuha/super-gsd` and see the marketplace registered without error.
2. Run `/plugin install super-gsd@super-gsd` and see install succeed.
3. Run `/plugin list` and see `super-gsd` listed with description and version from `plugin.json`.
4. Run `/gsd-progress`, access `superpowers:*` skills, and run `/hookify:help` — all three keep working (non-invasive verified).
5. Open `README.md` on GitHub and understand what the plugin is, what it requires, and the 3-stage workflow.

When all five conditions hold, the thin slice is alive.

## Architectural Decisions (Carried Forward to Phase 2/3/4)

These are extracted from `01-CONTEXT.md` and locked. Subsequent phases must respect them.

| Decision | Locked Value | Phases Affected |
|----------|--------------|-----------------|
| Distribution model | Single plugin, self-hosted marketplace in same repo | All |
| Manifest directory | `.claude-plugin/` at repo root | All |
| Plugin name | `super-gsd` | All |
| Marketplace name | `super-gsd` (matches plugin name) | All |
| Marketplace plugin source | `"."` (same repo, relative path) | All |
| Install command shape | `/plugin marketplace add gyuha/super-gsd` then `/plugin install super-gsd@super-gsd` | All |
| Author identifier | `gyuha` (GitHub username, no email) | All |
| Owner identifier | `gyuha` (matches author, no email) | All |
| License | MIT | All |
| Versioning rhythm | `0.0.1` for Phase 1, patch bump per phase (`0.0.2`, `0.0.3`), promote to `0.1.0` at v1 completion | All |
| Commands directory | NOT created in Phase 1 — created when Phase 2 needs `/super-gsd:to-superpowers`, `/super-gsd:status` | Phase 2 |
| Hooks directory | NOT created in Phase 1 — created when Phase 3 needs `Stop` / `SubagentStop` hooks | Phase 3 |
| Skills directory | Not planned in current roadmap | n/a |
| State file | `.planning/HANDOFF.md` introduced in Phase 2 only | Phase 2 |
| Lessons directory | `.planning/lessons/` introduced in Phase 4 only | Phase 4 |
| Documentation language | English primary, Korean summary section | All |
| Workflow diagram format | ASCII art (not Mermaid, not image) | All |
| Non-invasive constraint | Never modify GSD / Superpowers / Hookify files | All |

## Directory Layout (After Phase 1)

```
super-gsd/
├── .claude-plugin/
│   ├── plugin.json          # Phase 1 — D-02, D-03
│   └── marketplace.json     # Phase 1 — D-04, D-05, D-06
├── .planning/               # GSD planning artifacts (not part of plugin)
├── README.md                # Phase 1 — D-10, D-11, D-12, D-13
├── LICENSE                  # Phase 1 — MIT
├── CHANGELOG.md             # Phase 1 — 0.0.1 entry
├── .gitignore               # Phase 1
└── CLAUDE.md                # Pre-existing, unchanged
```

Phase 2 will add: `commands/super-gsd/to-superpowers.md`, `commands/super-gsd/status.md`, `.planning/HANDOFF.md`.
Phase 3 will add: `hooks/stop.json`, `hooks/subagent-stop.json` (or equivalent).
Phase 4 will add: `.planning/lessons/` directory and supporting helper command.

## What This Skeleton Deliberately Excludes

- No commands (D-08): zero `/super-gsd:*` commands ship in Phase 1. The "discoverable surface" is satisfied entirely by `/plugin list` output + README visibility.
- No hooks: `Stop` / `SubagentStop` arrive in Phase 3.
- No state file: `.planning/HANDOFF.md` is Phase 2 territory (D-15).
- No CI/CD, no GitHub Actions: deferred per CONTEXT.md.
- No executable code: Phase 1 ships only static JSON and Markdown. The threat surface is correspondingly minimal.

## Why ASCII (Not Mermaid)

Per D-11: ASCII renders identically in every environment that displays the README — GitHub web, terminal, Claude Code transcript, plain text editor. Mermaid requires a renderer and is not universally available in plugin marketplace previews. Phase 1 optimizes for portability; if visual polish becomes a goal in Phase 4 or beyond, the diagram can be upgraded then.

## Why Self-Hosted Marketplace (Not External Aggregator)

Per D-04: A single repo that contains both `plugin.json` (the plugin) and `marketplace.json` (the marketplace registry) gives the project independence from any external aggregator. Users install with `/plugin marketplace add gyuha/super-gsd` pointing at this repo directly. No additional infrastructure required.
