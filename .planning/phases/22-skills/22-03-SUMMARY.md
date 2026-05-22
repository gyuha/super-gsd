---
phase: 22-skills
plan: 03
subsystem: skills
tags: [skills, sg-explore, sg-review, sg-learn, sg-ship, SKILL.md, plugin]

requires: []
provides:
  - skills/sg-explore/SKILL.md — commands/sg-explore.md 완전 복사본
  - skills/sg-review/SKILL.md — commands/sg-review.md 완전 복사본
  - skills/sg-learn/SKILL.md — commands/sg-learn.md 완전 복사본
  - skills/sg-ship/SKILL.md — commands/sg-ship.md 완전 복사본
affects: [super-gsd plugin, sg-explore command, sg-review command, sg-learn command, sg-ship command]

tech-stack:
  added: []
  patterns:
    - "commands/ → skills/sg-{name}/ 디렉토리 구조 마이그레이션 패턴"

key-files:
  created:
    - skills/sg-explore/SKILL.md
    - skills/sg-review/SKILL.md
    - skills/sg-learn/SKILL.md
    - skills/sg-ship/SKILL.md
  modified: []

key-decisions:
  - "완전 복사(exact copy) 전략 — content 변경 없이 frontmatter + 블록 전체 복사"

patterns-established:
  - "워크플로우 계열 sg-* 명령 skills/ 구조"

requirements-completed:
  - SC-03
  - SC-05
  - SC-06

duration: included in single commit (41119aa)
completed: 2026-05-22
---

# Phase 22-03: Skills 파일 생성 — 워크플로우 계열 (sg-explore, sg-review, sg-learn, sg-ship)

**sg-explore/sg-review/sg-learn/sg-ship의 SKILL.md를 commands/ 원본에서 완전 복사하여 생성 — 탐색, 리뷰, 학습, 배포 워크플로우 보존.**

## What Was Built

- `skills/sg-explore/SKILL.md`: commands/sg-explore.md의 완전 복사본.
- `skills/sg-review/SKILL.md`: commands/sg-review.md의 완전 복사본.
- `skills/sg-learn/SKILL.md`: commands/sg-learn.md의 완전 복사본.
- `skills/sg-ship/SKILL.md`: commands/sg-ship.md의 완전 복사본.

## Self-Check: PASSED

- 4개 파일 모두 존재 ✓
- name, description frontmatter 포함 ✓
- objective, process, success_criteria 블록 포함 ✓
