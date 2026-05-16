---
phase: 01-plugin-scaffold
plan: 01
subsystem: plugin-manifest
tags:
  - claude-code-plugin
  - manifest
  - marketplace
requires: []
provides:
  - PLUGIN-01
  - PLUGIN-03
  - plugin-identity
  - marketplace-registry
affects:
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
  - LICENSE
  - .gitignore
  - CHANGELOG.md
tech-stack:
  added:
    - claude-code-plugin-manifest
    - self-hosted-marketplace
  patterns:
    - "Identity strings (name, version, author, owner) literal-locked per D-02/D-03/D-06"
    - "marketplace.json source=\".\" — self-hosted, same-repo plugin registration"
key-files:
  created:
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
    - LICENSE
    - .gitignore
    - CHANGELOG.md
  modified: []
decisions:
  - "Author/owner are bare string \"gyuha\" (GitHub username only, no email) per D-03 and D-06"
  - "repository URL resolved from `git remote get-url origin` at execute time (https://github.com/gyuha/super-gsd.git) — not hardcoded blindly"
  - "Keywords order locked to: gsd, superpowers, hookify, orchestration, claude-code, plugin (D-03)"
  - "Marketplace plugin entry source=\".\" — same-repo relative (D-05); marketplace name matches plugin name"
metrics:
  duration: ~5min
  completed: 2026-05-15
---

# Phase 1 Plan 1: Plugin Scaffold Manifest Summary

Wires the structural manifest set (`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`) plus repo housekeeping (LICENSE, .gitignore, CHANGELOG.md) so that `/plugin marketplace add gyuha/super-gsd` followed by `/plugin install super-gsd@super-gsd` resolves a valid installable plugin shell.

## Locked Identity (for README plan 01-02 to mirror exactly)

| Field | Value | Source |
|-------|-------|--------|
| `plugin.json` name | `super-gsd` | D-02 |
| `plugin.json` version | `0.0.1` | D-02 |
| `plugin.json` author | `gyuha` (bare string) | D-03 |
| `plugin.json` license | `MIT` | D-03 |
| `plugin.json` repository | `https://github.com/gyuha/super-gsd.git` | `git remote get-url origin` |
| `plugin.json` keywords | `["gsd","superpowers","hookify","orchestration","claude-code","plugin"]` | D-03 |
| `marketplace.json` name | `super-gsd` | D-05 |
| `marketplace.json` owner | `gyuha` (bare string) | D-06 |
| `marketplace.json` plugins[0].source | `"."` | D-05 |

### Description string (canonical — README must mirror)

> Orchestrator plugin that auto-chains GSD -> Superpowers -> Hookify so planning, implementation, and retrospection stay connected as a single learning loop.

Used identically in `plugin.json` and in `marketplace.json` plugins[0].description.

### Marketplace-level description

> Self-hosted marketplace for the super-gsd orchestrator plugin.

## Tasks & Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create .claude-plugin/plugin.json | `8c56721` | `.claude-plugin/plugin.json` |
| 2 | Create .claude-plugin/marketplace.json | `a7e6bfa` | `.claude-plugin/marketplace.json` |
| 3 | Create LICENSE, .gitignore, CHANGELOG.md | `2190b13` | `LICENSE`, `.gitignore`, `CHANGELOG.md` |

## Verification Evidence

- `node -e 'require("./.claude-plugin/plugin.json")'` exits 0 (parse OK).
- `node -e 'require("./.claude-plugin/marketplace.json")'` exits 0 (parse OK).
- Cross-file identity check: `plugin.json.name === marketplace.json.plugins[0].name === "super-gsd"`.
- `grep -L "@" .claude-plugin/*.json` shows both manifests have **no `@`** anywhere — D-06 email guard holds.
- `LICENSE` first line is `MIT License`; contains year `2026` and holder `gyuha`.
- `.gitignore` contains `.DS_Store` and does NOT ignore any of `.planning`, `.claude-plugin`, `CLAUDE.md`, `README.md`, `LICENSE`, `CHANGELOG.md`.
- `CHANGELOG.md` starts with `# Changelog` and contains `[0.0.1]` with three Added bullets covering plugin.json, marketplace.json, and README.
- Version match: `plugin.json.version` (0.0.1) is present in `CHANGELOG.md`.

## Deviations from Plan

None — plan executed exactly as written. All decisions D-01..D-15 honored:

- D-01: Only `.claude-plugin/` created at repo root; no `commands/`, `hooks/`, `skills/` directories added.
- D-02..D-06: All identity strings locked verbatim.
- D-08: Zero stub commands ship — `commands/` deliberately absent.
- D-14: No GSD/Superpowers/Hookify files touched (non-invasive).
- D-15: `.planning/HANDOFF.md` NOT created (Phase 2 territory).

## Threat Mitigation Confirmed

| Threat ID | Mitigation Evidence |
|-----------|---------------------|
| T-01-01 (Spoofing) | `repository` resolved from `git remote get-url origin`; `author` literal-locked to `"gyuha"`. |
| T-01-02 (Identity drift) | Task-2 verify script cross-checks `marketplace.json.plugins[0].name === plugin.json.name`. |
| T-01-03 (Email disclosure) | `grep -q "@" .claude-plugin/*.json` returns no match in either manifest. |
| T-01-04 (Repudiation) | LICENSE + CHANGELOG present with required markers. |

## Self-Check: PASSED

- File `.claude-plugin/plugin.json`: FOUND
- File `.claude-plugin/marketplace.json`: FOUND
- File `LICENSE`: FOUND
- File `.gitignore`: FOUND
- File `CHANGELOG.md`: FOUND
- Commit `8c56721`: FOUND
- Commit `a7e6bfa`: FOUND
- Commit `2190b13`: FOUND
