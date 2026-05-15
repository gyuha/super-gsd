---
phase: quick-260516-2qm
plan: "01"
subsystem: docs
tags: [readme, usage-examples, documentation]
dependency_graph:
  requires: []
  provides: [README.md Usage Examples section]
  affects: [README.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - README.md
decisions:
  - "영어 유지 — 기존 README 언어 스타일과 일치"
  - "shell 코드 블록 사용 — 실행 가능한 명령어임을 명확히 표현"
  - "sg-lessons에 phase 필터 예시 포함 — args 수용 가능성 보여줌"
metrics:
  duration: "2min"
  completed_date: "2026-05-16"
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-260516-2qm Plan 01: README Usage Examples Summary

README Commands 표 바로 아래에 `## Usage Examples` 섹션을 삽입하여, 신규 사용자가 처음 읽어도 sg- 명령어의 사용 순서와 맥락을 즉시 파악할 수 있도록 했다.

## What Was Built

`README.md`의 Commands 섹션 아래 (`See [docs/COMMANDS.md]...` 줄 직후, `## Prerequisites` 직전)에 `## Usage Examples` 섹션을 삽입했다. 65줄 추가.

**End-to-End Workflow:** `my-saas-app`에 결제 모듈을 추가하는 가상 시나리오로 `sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship` 전체 흐름을 인라인 주석과 함께 shell 코드 블록으로 서술했다.

**Individual Command Examples:** 메인 흐름에 없는 4개 명령어 각각의 단독 사용 예시를 추가했다.
- `sg-status` — 언제든 현재 위치 확인
- `sg-lessons` — phase 필터 옵션 포함
- `sg-update` — 도구 일괄 업데이트
- `sg-quick` — 메인 워크플로우 외 단발성 작업

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `c9bb22d` | docs(quick-260516-2qm-01): add Usage Examples section to README |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] `## Usage Examples` exists in README.md at line 45
- [x] `sg-start` through `sg-ship` all present in end-to-end block
- [x] `sg-status`, `sg-lessons`, `sg-update`, `sg-quick` individual examples present
- [x] Existing sections (`## Prerequisites` etc.) unchanged
- [x] Commit `c9bb22d` exists and staged only `README.md`

## Self-Check: PASSED
