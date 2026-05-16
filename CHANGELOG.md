# Changelog

All notable changes to `super-gsd` are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.0.6] - 2026-05-16

### Added

- `README.ko.md` — full Korean translation of README

### Changed

- `README.md` is now English-only with a link to `README.ko.md`
- Installation flow simplified: install super-gsd first, then run `sg-update` to auto-install GSD/Superpowers/Hookify
- `CLAUDE.md` versioning convention: `plugin.json` and `CHANGELOG.md` must always be updated together when bumping the version

## [0.0.2] - 2026-05-15

### Added

- Manual handoff command: /super-gsd:to-superpowers (packages a GSD phase into a Superpowers-ready prompt and auto-invokes superpowers:executing-plans)
- Workflow status command: /super-gsd:status (shows current stage, last handoff timestamp, and next recommended command)
- Append-only handoff log scaffold: .planning/HANDOFF.md (5-column markdown table — Timestamp | Phase | From | To | Plan Hash)

## [0.0.1] - 2026-05-15

### Added

- Initial plugin manifest (`.claude-plugin/plugin.json`)
- Self-hosted marketplace registry (`.claude-plugin/marketplace.json`)
- README with installation and verification checklist
