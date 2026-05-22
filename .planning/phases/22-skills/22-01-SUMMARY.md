---
phase: 22-skills
plan: 01
subsystem: skills
tags: [skills, sg-plan, sg-execute, SKILL.md, plugin]

requires: []
provides:
  - skills/sg-plan/SKILL.md — commands/sg-plan.md 완전 복사본. HANDOFF 로직, lessons 주입, PARALLEL_GROUPS 라우팅 보존
  - skills/sg-execute/SKILL.md — commands/sg-execute.md 완전 복사본. wave 실행, checkpoint 처리 보존
affects: [super-gsd plugin, sg-plan command, sg-execute command]

tech-stack:
  added: []
  patterns:
    - "commands/ → skills/sg-{name}/ 디렉토리 구조 마이그레이션 패턴"

key-files:
  created:
    - skills/sg-plan/SKILL.md
    - skills/sg-execute/SKILL.md
  modified: []

key-decisions:
  - "완전 복사(exact copy) 전략 — content 변경 없이 frontmatter + 블록 전체 복사"
  - "PARALLEL_GROUPS 라우팅 등 복잡한 구성을 그대로 보존"

patterns-established:
  - "skills/sg-{name}/SKILL.md 서브디렉토리 구조"

requirements-completed:
  - SC-01
  - SC-05
  - SC-06

duration: included in single commit (41119aa)
completed: 2026-05-22
---

# Phase 22-01: Skills 파일 생성 — sg-plan, sg-execute

**sg-plan/SKILL.md와 sg-execute/SKILL.md를 commands/ 원본에서 완전 복사하여 생성 — HANDOFF 로직, lessons 주입, PARALLEL_GROUPS 라우팅 등 복잡한 구성 100% 보존.**

## What Was Built

- `skills/sg-plan/SKILL.md`: commands/sg-plan.md의 완전 복사본. lessons 주입(Step 0), Phase resolve(Step 1), gsd-discuss-phase Agent 호출(Step 2), HANDOFF.md 기록(Step 2.5), gsd-plan-phase Skill 호출(Step 3)의 5단계 구성 보존.
- `skills/sg-execute/SKILL.md`: commands/sg-execute.md의 완전 복사본. PARALLEL_GROUPS 라우팅, wave 실행, checkpoint 처리 로직 보존.

## Self-Check: PASSED

- skills/sg-plan/SKILL.md 존재 ✓
- skills/sg-execute/SKILL.md 존재 ✓
- name, description frontmatter 포함 ✓
- objective, process, success_criteria 블록 포함 ✓
- PARALLEL_GROUPS 라우팅 보존 ✓
