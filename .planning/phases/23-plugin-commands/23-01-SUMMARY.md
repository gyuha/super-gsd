---
phase: 23-plugin-commands
plan: 01
subsystem: plugin
tags: [plugin.json, commands, cleanup, PC-01, PC-02]

requires: []
provides:
  - .claude-plugin/plugin.json — commands 키 없는 plugin manifest
affects: [super-gsd plugin manifest, commands/ directory]

tech-stack:
  added: []
  patterns:
    - "jq 'del(.commands)' 원자적 키 제거 패턴"

key-files:
  created: []
  modified:
    - .claude-plugin/plugin.json
  deleted:
    - commands/sg-start.md
    - commands/sg-explore.md
    - commands/sg-plan.md
    - commands/sg-execute.md
    - commands/sg-review.md
    - commands/sg-learn.md
    - commands/sg-ship.md
    - commands/sg-status.md
    - commands/sg-lessons.md
    - commands/sg-update.md
    - commands/sg-quick.md
    - commands/sg-complete.md
    - commands/sg-new.md
    - commands/sg-health.md

key-decisions:
  - "D-01: plugin.json commands 키 완전 제거 — 14개 경로 나열 불필요, skills/ 자동 스캔"
  - "D-02: git rm -r commands/ — git history 보존하며 추적 해제"

patterns-established:
  - "commands/ → skills/ 마이그레이션 완료 패턴"

requirements-completed:
  - PC-01
  - PC-02

duration: ~5min (commit b41971f)
completed: 2026-05-22
---

# Phase 23-01: Plugin 정리 — plugin.json commands 키 제거 + commands/ 삭제

**plugin.json에서 commands 배열을 완전히 제거하고 commands/ 디렉토리(14개 파일)를 git rm으로 삭제 — skills/sg-*/SKILL.md 14개가 슬래시 명령의 단일 소스가 됐다.**

## What Was Built

- `.claude-plugin/plugin.json`: `commands` 키 완전 제거. `skills: "./skills/"` 키만 유지.
- `commands/` 디렉토리 14개 파일 전체 git rm으로 삭제. git history에 보존.

## Verification

```
jq '.commands // "null"' .claude-plugin/plugin.json → "null" ✓
ls commands/ → No such file or directory ✓
jq '.skills' .claude-plugin/plugin.json → "./skills/" ✓
```

## Self-Check: PASSED

- plugin.json commands 키 없음 ✓
- plugin.json JSON 유효 ✓
- commands/ 파일 시스템에 없음 ✓
- skills/ 16개 서브디렉토리 유지 ✓
