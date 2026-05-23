---
phase: 23-plugin-commands
plan: 02
subsystem: docs
tags: [CLAUDE.md, README.md, README.ko.md, DOC-01, DOC-02]

requires: []
provides:
  - CLAUDE.md — skills/ 기준으로 재서술된 Technology Stack + Architecture 섹션
  - README.md — commands/ 참조 없는 Roadmap (Phase 3 sg-retro 표현)
  - README.ko.md — README.md와 동기화된 한국어 문서
affects: [CLAUDE.md, README.md, README.ko.md]

tech-stack:
  added: []
  patterns:
    - "GSD 마커 블록 내부 최소 수정 패턴 (마커 라인 불변)"

key-files:
  created: []
  modified:
    - CLAUDE.md
    - README.md
    - README.ko.md

key-decisions:
  - "D-03: CLAUDE.md Technology Stack에서 Commands 항목 제거, Skills 항목을 sg-*/SKILL.md 기준으로 통합"
  - "D-03: CLAUDE.md Architecture를 두 개의 레이어(Skills + Hooks)로 재서술"
  - "D-04/D-05: README/ko.md Phase 3 설명에서 Hookify → sg-retro 교체, 역사적 기록 최소 수정"

patterns-established:
  - "GSD 마커 블록 내부 수정 시 마커 라인 자체 불변 원칙"

requirements-completed:
  - DOC-01
  - DOC-02

duration: ~10min (commits b41971f + 9727f41)
completed: 2026-05-23
---

# Phase 23-02: 문서 정리 — CLAUDE.md + README Skills 기준 재서술

**CLAUDE.md Technology Stack과 Architecture 섹션을 skills/ 기준으로 재서술하고, README.md와 README.ko.md의 Phase 3 설명에서 구식 Hookify 참조를 sg-retro로 교체 — GSD 마커 보존.**

## What Was Built

- `CLAUDE.md`: Technology Stack에서 Commands 항목 제거, Skills 항목을 `skills/sg-*/SKILL.md` 기준으로 통합. Architecture를 "두 개의 레이어"(Skills + Hooks)로 재서술. GSD:stack-start, GSD:architecture-start 마커 보존.
- `README.md`: Phase 3 설명에서 "Hookify cycle" → "sg-retro cycle" 교체.
- `README.ko.md`: Phase 3 설명에서 동일 변경 적용.

## Verification

```
grep -c "Commands 레이어" CLAUDE.md → 0 ✓
grep "Skills 레이어" CLAUDE.md → 1. Skills 레이어 ✓
grep "GSD:architecture-start" CLAUDE.md → 존재 ✓
grep "Hookify cycle" README.md → 결과 없음 ✓
```

## Self-Check: PASSED

- CLAUDE.md Technology Stack: Commands 항목 없음, Skills 항목 통합 ✓
- CLAUDE.md Architecture: "1. Skills 레이어"가 Commands 레이어 대체 ✓
- CLAUDE.md GSD 마커 전부 보존 ✓
- README.md Phase 3: "sg-retro cycle" ✓
- README.ko.md Phase 3: "sg-retro 사이클" ✓
