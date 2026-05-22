---
phase: 22-skills
plan: 02
subsystem: skills
tags: [skills, sg-start, sg-status, sg-health, SKILL.md, plugin]

requires: []
provides:
  - skills/sg-start/SKILL.md — commands/sg-start.md 완전 복사본
  - skills/sg-status/SKILL.md — commands/sg-status.md 완전 복사본
  - skills/sg-health/SKILL.md — commands/sg-health.md 완전 복사본
affects: [super-gsd plugin, sg-start command, sg-status command, sg-health command]

tech-stack:
  added: []
  patterns:
    - "commands/ → skills/sg-{name}/ 디렉토리 구조 마이그레이션 패턴"

key-files:
  created:
    - skills/sg-start/SKILL.md
    - skills/sg-status/SKILL.md
    - skills/sg-health/SKILL.md
  modified: []

key-decisions:
  - "완전 복사(exact copy) 전략 — content 변경 없이 frontmatter + 블록 전체 복사"

patterns-established:
  - "세션·상태·진단 계열 sg-* 명령 skills/ 구조"

requirements-completed:
  - SC-02
  - SC-05
  - SC-06

duration: included in single commit (41119aa)
completed: 2026-05-22
---

# Phase 22-02: Skills 파일 생성 — 세션·상태·진단 계열 (sg-start, sg-status, sg-health)

**sg-start/sg-status/sg-health의 SKILL.md를 commands/ 원본에서 완전 복사하여 생성 — 세션 시작, 상태 확인, 진단 워크플로우 보존.**

## What Was Built

- `skills/sg-start/SKILL.md`: commands/sg-start.md의 완전 복사본.
- `skills/sg-status/SKILL.md`: commands/sg-status.md의 완전 복사본.
- `skills/sg-health/SKILL.md`: commands/sg-health.md의 완전 복사본.

## Self-Check: PASSED

- 3개 파일 모두 존재 ✓
- name, description frontmatter 포함 ✓
- objective, process, success_criteria 블록 포함 ✓
