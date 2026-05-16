---
phase: 03-sg-command-set-readme
plan: "02"
subsystem: commands
tags: [sg-start, sg-explore, command, skill-delegation]
dependency_graph:
  requires: []
  provides: [commands/sg-start.md, commands/sg-explore.md]
  affects: []
tech_stack:
  added: []
  patterns: [XML 4-section command structure, Skill delegation]
key_files:
  created:
    - commands/sg-start.md
    - commands/sg-explore.md
  modified: []
decisions:
  - "sg-start에 argument-hint 포함 (project-name 전달용), sg-explore는 인자 없음"
  - "두 명령 모두 XML 4-section 구조 + Skill 위임 단일 패턴 적용"
metrics:
  duration: ~3min
  completed_date: "2026-05-15"
  tasks_completed: 2
  files_changed: 2
---

# Phase 03 Plan 02: sg-start & sg-explore Commands Summary

## One-liner

`gsd-new-project`와 `gsd-explore` Skill을 각각 위임하는 얇은 래퍼 명령 두 개 생성.

## What Was Built

`commands/sg-start.md` — `/super-gsd:sg-start` 슬래시 명령. `$ARGUMENTS`를 그대로 `gsd-new-project` Skill에 전달하고, 완료 후 sg-explore → sg-plan 다음 단계 안내 메시지 출력.

`commands/sg-explore.md` — `/super-gsd:sg-explore` 슬래시 명령. 인자 없이 `gsd-explore` Skill을 호출하고, 완료 후 sg-plan 다음 단계 안내 메시지 출력.

두 파일 모두 Phase 2에서 확립된 XML 4-section 구조(objective / execution_context / process / success_criteria)와 frontmatter 표준(name, description, argument-hint)을 따른다.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create commands/sg-start.md | 9b49576 | commands/sg-start.md |
| 2 | Create commands/sg-explore.md | 2518cad | commands/sg-explore.md |

## Decisions Made

- **sg-start argument-hint 포함:** `[project-name] - optional. Passed through to gsd-new-project.` — gsd-new-project가 내부에서 프로젝트 감지를 처리하므로 sg-start는 $ARGUMENTS를 파싱 없이 그대로 전달.
- **sg-explore argument-hint 생략:** gsd-explore는 인자를 받지 않음. 플랜 명세(must_haves) 및 PATTERNS.md 정의 그대로 반영.

## Deviations from Plan

None — plan executed exactly as written.

`commands/to-superpowers.md`가 이미 `commands/sg-execute.md`로 이름 변경되어 있어 `commands/sg-execute.md`를 XML 구조 참조로 사용함 (03-01 완료 결과, 기능 동일).

## Known Stubs

None.

## Threat Flags

None — T-03-02-02 (Skill name mismatch) 위협 완화됨: Skill 이름 `gsd-new-project`와 `gsd-explore`가 PATTERNS.md canonical 정의와 일치 확인.

## Self-Check: PASSED

- commands/sg-start.md: FOUND
- commands/sg-explore.md: FOUND
- commit 9b49576: FOUND
- commit 2518cad: FOUND
- 전체 검증 8/8 항목 통과
