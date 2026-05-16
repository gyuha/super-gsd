---
phase: 03-sg-command-set-readme
plan: 01
subsystem: commands
tags: [rename, sg-prefix, slash-commands, naming-convention]
dependency_graph:
  requires: []
  provides: [commands/sg-execute.md, commands/sg-status.md]
  affects: [commands/]
tech_stack:
  added: []
  patterns: [frontmatter-name-field, cross-reference-consistency]
key_files:
  created:
    - commands/sg-execute.md
    - commands/sg-status.md
  modified: []
  deleted:
    - commands/to-superpowers.md
    - commands/status.md
decisions:
  - "sg- prefix 적용: D-36(sg-execute), D-37(sg-status) 결정에 따라 명령어 이름 변경"
  - "내부 교차 참조 일관성: sg-execute ↔ sg-status 양방향 참조 정합성 유지"
metrics:
  duration: ~3min
  completed: "2026-05-15"
  tasks_completed: 2
  files_changed: 4
---

# Phase 03 Plan 01: sg-execute/sg-status 명령 이름 변경 Summary

sg- 네이밍 컨벤션에 따라 `to-superpowers.md` → `sg-execute.md`, `status.md` → `sg-status.md`로 이름 변경하고, 두 파일 간 교차 참조를 `sg-execute ↔ sg-status` 패턴으로 일치시켰다.

## 완료된 태스크

| 태스크 | 설명 | 커밋 | 파일 |
|--------|------|------|------|
| Task 1 | to-superpowers.md → sg-execute.md 생성 및 삭제 | 39ff396 | commands/sg-execute.md (+), commands/to-superpowers.md (D) |
| Task 2 | status.md → sg-status.md 생성 및 삭제 | 3cfd74e | commands/sg-status.md (+), commands/status.md (D) |

## 적용된 변경 사항

### sg-execute.md (이전: to-superpowers.md)
- frontmatter `name: to-superpowers` → `name: sg-execute`
- description `sg-executing-plans` 참조 업데이트
- Step 7 idempotency 메시지 `/super-gsd:status` → `/super-gsd:sg-status`
- Step 10 최종 메시지 `/super-gsd:status` → `/super-gsd:sg-status`

### sg-status.md (이전: status.md)
- frontmatter `name: status` → `name: sg-status`
- Step 5 gsd-plan 브랜치 `NEXT_CMD="/super-gsd:to-superpowers"` → `NEXT_CMD="/super-gsd:sg-execute"`

## 검증 결과

모든 8개 검증 항목 통과:
1. sg-execute.md 존재 — PASS
2. sg-status.md 존재 — PASS
3. to-superpowers.md 삭제됨 — PASS
4. status.md 삭제됨 — PASS
5. sg-execute name 필드 정확 — PASS
6. sg-status name 필드 정확 — PASS
7. sg-status → sg-execute 교차 참조 — PASS
8. sg-execute → sg-status 교차 참조 — PASS

## Deviations from Plan

없음 — 계획된 대로 정확히 실행됨.

## Known Stubs

없음.

## Threat Flags

없음. 이 플랜은 명령 파일 이름 변경만 수행하며 새로운 네트워크 엔드포인트, 인증 경로, 파일 접근 패턴, 또는 스키마 변경을 도입하지 않는다.

## Self-Check: PASSED

- commands/sg-execute.md: FOUND
- commands/sg-status.md: FOUND
- commands/to-superpowers.md: 삭제 확인됨
- commands/status.md: 삭제 확인됨
- 커밋 39ff396: FOUND
- 커밋 3cfd74e: FOUND
