---
phase: 22-skills
plan: 04
subsystem: skills
tags: [skills, sg-quick, sg-update, sg-complete, sg-new, sg-lessons, SKILL.md, plugin]

requires: []
provides:
  - skills/sg-quick/SKILL.md — commands/sg-quick.md 완전 복사본
  - skills/sg-update/SKILL.md — commands/sg-update.md 완전 복사본
  - skills/sg-complete/SKILL.md — commands/sg-complete.md 완전 복사본
  - skills/sg-new/SKILL.md — commands/sg-new.md 완전 복사본
  - skills/sg-lessons/SKILL.md — commands/sg-lessons.md 완전 복사본
affects: [super-gsd plugin, sg-quick, sg-update, sg-complete, sg-new, sg-lessons commands]

tech-stack:
  added: []
  patterns:
    - "commands/ → skills/sg-{name}/ 디렉토리 구조 마이그레이션 패턴"

key-files:
  created:
    - skills/sg-quick/SKILL.md
    - skills/sg-update/SKILL.md
    - skills/sg-complete/SKILL.md
    - skills/sg-new/SKILL.md
    - skills/sg-lessons/SKILL.md
  modified: []

key-decisions:
  - "완전 복사(exact copy) 전략 — content 변경 없이 frontmatter + 블록 전체 복사"

patterns-established:
  - "유틸리티 계열 sg-* 명령 skills/ 구조"

requirements-completed:
  - SC-04
  - SC-05
  - SC-06

duration: included in single commit (41119aa)
completed: 2026-05-22
---

# Phase 22-04: Skills 파일 생성 — 유틸리티 계열 (sg-quick, sg-update, sg-complete, sg-new, sg-lessons)

**sg-quick/sg-update/sg-complete/sg-new/sg-lessons의 SKILL.md를 commands/ 원본에서 완전 복사하여 생성 — 5개 유틸리티 명령 워크플로우 보존.**

## What Was Built

- `skills/sg-quick/SKILL.md`: commands/sg-quick.md의 완전 복사본.
- `skills/sg-update/SKILL.md`: commands/sg-update.md의 완전 복사본.
- `skills/sg-complete/SKILL.md`: commands/sg-complete.md의 완전 복사본.
- `skills/sg-new/SKILL.md`: commands/sg-new.md의 완전 복사본.
- `skills/sg-lessons/SKILL.md`: commands/sg-lessons.md의 완전 복사본.

## Self-Check: PASSED

- 5개 파일 모두 존재 ✓
- name, description frontmatter 포함 ✓
- objective, process, success_criteria 블록 포함 ✓
