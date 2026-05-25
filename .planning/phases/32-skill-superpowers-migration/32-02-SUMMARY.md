---
phase: 32-skill-superpowers-migration
plan: "02"
subsystem: skills/agents
tags: [bash-parsing, read-tool, macOS-compat, superpowers-migration]
dependency_graph:
  requires: []
  provides: [bash-pipe-to-read-migration]
  affects: [.agents/skills/sg-execute, .agents/skills/sg-plan, .agents/skills/sg-review, .agents/skills/sg-ship, skills/sg-retro, CLAUDE.md]
tech_stack:
  added: []
  patterns: [Read-tool-over-bash-pipe, macOS-compat-comment]
key_files:
  created: []
  modified:
    - .agents/skills/sg-execute/SKILL.md
    - .agents/skills/sg-plan/SKILL.md
    - .agents/skills/sg-review/SKILL.md
    - .agents/skills/sg-ship/SKILL.md
    - skills/sg-retro/SKILL.md
    - CLAUDE.md
decisions:
  - Read 도구 지시문은 bash 코드 블록 안에 주석으로 삽입하여 `else` 분기 구조를 유지
  - sg-retro bash 파이프라인은 macOS 호환성 이유로 유지하고 주석만 교체
  - CLAUDE.md 컨벤션 항목은 기존 phase lock 언급을 제거하고 Superpowers Read 방식 설명으로 전환
metrics:
  duration: ~10m
  completed: "2026-05-26"
  tasks_completed: 3
  files_changed: 6
---

# Phase 32 Plan 02: Bash Pipe → Read Tool Migration Summary

bash 파이프라인(`grep | sed | awk`)으로 파일을 파싱하던 `.agents/skills/` 4개 파일을 Read 도구 지시문으로 전환하고, `skills/sg-retro/SKILL.md`의 Phase 7 lock 주석을 macOS 호환성 주석으로 교체하며, `CLAUDE.md` 컨벤션 항목을 Superpowers 방식으로 업데이트했다.

## 변경 내용

### .agents/skills/sg-execute/SKILL.md

- **Step 1** (Phase 파싱): `grep -E '^Phase:' | sed | awk` 3-line 블록 → `Read .planning/STATE.md` 지시문 (주석)
- **Step 3+4** (ROADMAP.md 파싱): `PHASE_HEADER=`, `HEADER_LINE=`, `GOAL=$(awk...)`, `SC_TEXT=$(awk...)`, `REQ_IDS=$(awk...)` 5개 bash 변수 블록 → `Read .planning/ROADMAP.md` 단일 지시문으로 통합
- **Step 9.5** (FROM_STAGE): `grep -E ... | awk -F'|' {gsub...}` → `Read .planning/HANDOFF.md` 지시문 (주석)
- 보존: EXISTING_HASH grep 라인, HANDOFF 초기화 블록, `for REQ in $REQ_IDS` 루프

### .agents/skills/sg-plan/SKILL.md

- **Step 1** (Phase 파싱): `grep -E '^Phase:' | sed | awk` 3-line 블록 → `Read .planning/STATE.md` 지시문 (주석)
- **Step 2b** (PREV_STAGE): `grep -E ... | awk -F'|' {gsub...}` → `Read .planning/HANDOFF.md` 지시문 (주석)
- 보존: HANDOFF 초기화 블록(`if [ ! -f "$HANDOFF_FILE" ]`), idempotency grep 라인

### .agents/skills/sg-ship/SKILL.md

- **Step 1** (Phase 파싱): `grep -E '^Phase:' | sed | awk` 3-line 블록 → `Read .planning/STATE.md` 지시문 (주석)
- **Step 6** (FROM_STAGE): `grep -E ... | awk -F'|' {gsub...}` → `Read .planning/HANDOFF.md` 지시문 (주석)
- 보존: HANDOFF 초기화 블록, 기타 Step 6 로직

### .agents/skills/sg-review/SKILL.md

- **Step 3** (PHASE_NUM): `grep -E '^Phase:' | sed | awk | grep -oE` 4-line 블록 → `Read .planning/STATE.md` 지시문 (주석)
- **Step 3** (PLAN_REQUIREMENTS): `sed -n '/<objective>/,/<\/objective>/p' | grep -v` → `Read PLAN_FILE` 지시문 (주석)
- **Step 3.9** (FROM_STAGE_R): `grep -E ... | awk -F'|' {gsub...}` → `Read .planning/HANDOFF.md` 지시문 (주석)
- 보존: HANDOFF append echo 라인, HANDOFF 초기화 블록

### skills/sg-retro/SKILL.md

- **설명 텍스트**: `"Phase 7 D-04~D-06 lock"` 언급 → `"macOS 호환 파이프라인"` 으로 교체
- **bash 주석**: `D-08: Phase 7 D-04~D-06 multi-line 패턴 인라인 복제` → `macOS 호환 grep + sed + awk 파이프라인`
- bash 코드 변경 없음 (파이프라인 자체는 macOS 호환성 이유로 유지)

### CLAUDE.md

- **macOS 셸 이식성 섹션** 중 `STATE.md Phase 파싱` bullet: Phase 7 D-04~D-06 lock 언급 제거, Superpowers Read 도구 방식 설명으로 교체 (`hooks/*.cjs`와 `sg-retro`는 macOS 호환성 이유로 파이프라인 유지)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- .agents/skills/sg-execute/SKILL.md: exists, bash awk assignments removed, Read instructions added
- .agents/skills/sg-plan/SKILL.md: exists, Phase parsing updated, HANDOFF init preserved
- .agents/skills/sg-ship/SKILL.md: exists, Phase parsing updated, FROM_STAGE updated
- .agents/skills/sg-review/SKILL.md: exists, all 3 patterns replaced
- skills/sg-retro/SKILL.md: exists, comments updated, bash code unchanged
- CLAUDE.md: exists, STATE.md Phase 파싱 bullet updated
- Commits: 2973e03 (Task 1), 860f3ee (Task 2), 44fd3ed (Task 3)
- hooks/ and sg-status/sg-next/sg-start SKILL.md: unchanged (verified via git diff = 0 bytes)
