# Roadmap: super-gsd

## Overview

`super-gsd` ships in four MVP vertical slices. Each slice is an installable Claude Code plugin build that delivers a coherent, testable user behavior. Phase 1 produces the plugin shell (installable but inert). Phase 2 makes manual stage handoff work end-to-end. Phase 3 adds automatic triggering via Stop/SubagentStop hooks. Phase 4 closes the loop by persisting Hookify lessons back into the next GSD phase. Granularity is `coarse`; mode is `mvp`.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Plugin Scaffold** - Installable Claude Code plugin shell with manifest and marketplace metadata
- [ ] **Phase 2: Manual Handoff & Status** - User can hand off from GSD to Superpowers via slash command and inspect workflow state
- [ ] **Phase 3: Auto-Advance Hooks** - Stage transitions are auto-detected and announced via Stop/SubagentStop hooks
- [ ] **Phase 4: Lessons Feedback Loop** - Hookify findings persist into `.planning/lessons/` and feed into next GSD phase

## Phase Details

### Phase 1: Plugin Scaffold
**Goal**: Deliver an installable Claude Code plugin that registers under the marketplace and exposes a discoverable surface, even if commands are stubs.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLUGIN-01, PLUGIN-02, PLUGIN-03
**Success Criteria** (what must be TRUE):
  1. User can install `super-gsd` through the Claude Code plugin marketplace mechanism without errors
  2. After installation, `super-gsd` appears in the plugin list with name, description, and version pulled from `plugin.json`
  3. User can read the README and understand prerequisites (GSD/Superpowers/Hookify) and the 3-stage workflow
  4. Loading the plugin in a Claude Code session does not break GSD, Superpowers, or Hookify (non-invasive verified)
**Plans:** 2/2 plans complete
- [x] 01-01-PLAN.md — Manifest set: plugin.json, marketplace.json, LICENSE, .gitignore, CHANGELOG.md
- [x] 01-02-PLAN.md — README.md with 9 sections, ASCII workflow diagram, install commands, verify checklist, Korean summary

### Phase 2: Manual Handoff & Status
**Goal**: User can manually hand off a completed GSD phase to Superpowers with structured context, and at any time inspect where the workflow is.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: HAND-01, HAND-02, HAND-03, HAND-04, STATE-01, STATE-02
**Success Criteria** (what must be TRUE):
  1. User can run `/super-gsd:to-superpowers [phase]` after `plan-phase` and the current phase's PLAN.md, REQ-ID mapping, and success criteria are packaged into a single Superpowers-ready prompt
  2. Running the handoff command without a phase argument resolves the current phase from `.planning/STATE.md` automatically
  3. Each handoff appends a timestamped entry (from-stage, to-stage, phase) to `.planning/HANDOFF.md` and re-running on the same phase does not duplicate context
  4. User can run `/super-gsd:status` and see current stage (plan/execute/review/hookify), last handoff timestamp, and the next recommended command
**Plans:** 1/2 plans complete
- [x] 02-01-PLAN.md — Lock HANDOFF.md 5-column schema, patch-bump plugin.json to 0.0.2, add CHANGELOG [0.0.2] entry
- [ ] 02-02-PLAN.md — Author commands/to-superpowers.md (handoff + Skill auto-invoke + idempotency) and commands/status.md (stage detection + next-command mapping)

### Phase 3: Auto-Advance Hooks
**Goal**: Stage transitions are detected automatically — the user no longer has to remember which command comes next.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04
**Success Criteria** (what must be TRUE):
  1. When GSD `plan-phase` completes, a Stop hook surfaces a message guiding the user to `/super-gsd:to-superpowers`
  2. When Superpowers `code-reviewer` (or equivalent review skill) completes, a SubagentStop hook invokes Hookify `/hookify` automatically
  3. Setting `super_gsd.auto_advance: false` in `.planning/config.json` disables both auto-advance hooks while keeping manual commands functional
  4. Hooks only fire on the intended transcript signals — running unrelated commands does not trigger spurious handoff messages
**Plans**: TBD

### Phase 4: Lessons Feedback Loop
**Goal**: Hookify's retrospection output is captured per-phase and automatically resurfaced when the next GSD phase begins, closing the learning loop.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: LESS-01, LESS-02
**Success Criteria** (what must be TRUE):
  1. After Hookify runs, its extracted patterns are saved to `.planning/lessons/{phase}-{date}.md` automatically
  2. When the user runs the next GSD `discuss-phase` or `plan-phase`, prior lessons from `.planning/lessons/` are included as context (via a helper command or auto-injection guidance)
  3. A full GSD → Superpowers → Hookify → next GSD cycle can be observed end-to-end on a sample project without any manual context shuttling
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Scaffold | 2/2 | Complete   | 2026-05-15 |
| 2. Manual Handoff & Status | 1/2 | In Progress | - |
| 3. Auto-Advance Hooks | 0/TBD | Not started | - |
| 4. Lessons Feedback Loop | 0/TBD | Not started | - |
