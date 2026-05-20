---
phase: 12-lessons-aggregation
plan: 01
status: complete
completed: 2026-05-20
duration_min: ~15
tasks: 3
files: 5
---

# Phase 12 Plan 01 — Summary

## Objective
lessons 집계 + 재발 방지 가드 구현 — sg-retro가 축적한 lessons를 weighted ranking으로 우선순위화하여 sg-plan/sg-execute 진입 시 자동 노출하고, milestone close 시 자동 아카이브한다.

## Tasks Completed

| Task | Files | Status |
|------|-------|--------|
| Task 1: hooks/lessons_ranker.py 생성 | hooks/lessons_ranker.py | ✅ |
| Task 2: sg-plan Step 0 교체 + sg-execute reminder | commands/sg-plan.md, commands/sg-execute.md | ✅ |
| Task 3: sg-lessons milestone 필터 + sg-complete Step 0.5 | commands/sg-lessons.md, commands/sg-complete.md | ✅ |

## Requirements Satisfied

| Requirement | Status |
|-------------|--------|
| RECURRENCE-01: weighted ranking 함수 (freq+recency+severity) | ✅ hooks/lessons_ranker.py |
| RECURRENCE-02: sg-plan Step 0 weighted top-N 우선 표시 | ✅ commands/sg-plan.md |
| RECURRENCE-03: sg-execute 진입 시 top-N reminder | ✅ commands/sg-execute.md |
| LESSONS-01: sg-retro append (Phase 9/10 기구현) | deferred (out of scope) |
| LESSONS-02: sg-plan Step 0 기존 동작 유지 + weighted top-N | ✅ commands/sg-plan.md |
| LESSONS-03: milestone 그룹화 조회 + archive | ✅ commands/sg-lessons.md + commands/sg-complete.md |

## Key Decisions Applied

- **D-01/D-02**: `hooks/lessons_ranker.py` Python 헬퍼, score = 0.4*freq + 0.4*recency + 0.2*severity
- **D-03**: sg-plan Step 0 — "=== Weighted Top-N ===" → ranked list → "=== All Lessons ===" 구조
- **D-04/D-05**: sg-complete Step 0.5 — STATE.md milestone 버전 읽기, warn-only 실패 처리
- **D-06**: sg-lessons --milestone=vX.Y → .planning/milestones/vX.Y-LESSONS.md 직접 라우팅

## Commits

- `feat(12): add hooks/lessons_ranker.py — weighted top-N ranking + archive mode`
- `feat(12): sg-plan weighted top-N Step 0 + sg-execute lessons reminder`
- `feat(12): sg-lessons milestone filter + sg-complete Step 0.5 lessons archive`
