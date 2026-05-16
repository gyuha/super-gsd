# Changelog

All notable changes to `super-gsd` are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.0.7] - 2026-05-16

### Added

- `sg-complete` — `gsd-complete-milestone` 매핑 명령 추가 (마일스톤 완료 처리)
- `sg-new` — `gsd-new-milestone` 매핑 명령 추가 (새 마일스톤 시작)

### Changed

- `sg-quick` — `gsd-executor` 대신 `superpowers:executing-plans` 사용하도록 파이프라인 재작성 (gsd-planner → Superpowers 핸드오프)
- `plugin.json` — `sg-complete`, `sg-new` 명령 등록
- `docs/COMMANDS.md` — `sg-complete`, `sg-new` Quick Reference 표 및 상세 섹션 추가
- `README.md` / `README.ko.md` — Commands 표에 `sg-complete`, `sg-new` 추가

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
