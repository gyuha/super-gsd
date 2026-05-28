---
phase: 35-doc-improvement
plan: "01"
subsystem: documentation
tags: [readme, agents, install, codex, gemini, npx, verify]
dependency_graph:
  requires: [npx-installer, sg-setup-skill]
  provides: [updated-install-docs]
  affects: [README.md, AGENTS.md, README.ko.md]
tech_stack:
  added: []
  patterns: [npx-install, doc-sync]
key_files:
  modified:
    - README.md
    - AGENTS.md
    - README.ko.md
decisions:
  - "git clone 4단계 → npx @gyuha/super-gsd install 단일 명령 교체 (D-03, D-04)"
  - "Verify install에 Claude Code / Codex / Gemini 3개 서브섹션 통합 (D-05~D-07)"
  - "AGENTS.md Step 0 설치 블록 추가 — npx 주요 방법, $sg-setup 인세션 대안 (D-08~D-10)"
  - "README.ko.md 설치 섹션만 동기화 (D-11~D-12)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-26"
  tasks_completed: 4
  tasks_total: 4
  files_modified: 3
  files_created: 0
---

# Phase 35 Plan 01: 문서 개선 Summary

**One-liner:** README.md, AGENTS.md, README.ko.md에서 Codex/Gemini 설치 방법을 `git clone + 4 cp` → `npx @gyuha/super-gsd install` 단일 명령으로 교체하고 검증 단계를 추가했다.

## Tasks Completed

| Task | Name | Files |
|------|------|-------|
| 1 | README.md Codex/Gemini 설치 섹션 교체 (DOC-01) | README.md |
| 2 | README.md Verify install 서브섹션 추가 (DOC-02) | README.md |
| 3 | AGENTS.md Step 0 추가 (DOC-03) | AGENTS.md |
| 4 | README.ko.md 설치 섹션 한글 동기화 (DOC-04) | README.ko.md |

## What Changed

### README.md

Codex 섹션과 Gemini 섹션에서 `git clone + mkdir + cp` 4단계 블록 제거. 각각 단일 npx 명령으로 교체:
- Codex: `npx @gyuha/super-gsd install`
- Gemini: `npx @gyuha/super-gsd install --gemini`

각 섹션 하단에 `$sg-setup` 인세션 대안 Tip Note 추가.

`## Verify install` 섹션에 `### Claude Code` / `### Codex` / `### Gemini` 세 서브섹션 추가:
- Codex: `cat .codex/hooks.json` + `ls hooks/*.cjs` + `ls .agents/skills/` + `$sg-status`
- Gemini: `cat .gemini/settings.json` + 동일 패턴

### AGENTS.md

`## Quick Start` 맨 앞에 `**Step 0: 설치**` 블록 추가:
- 터미널 설치: `npx @gyuha/super-gsd install` (Codex), `npx @gyuha/super-gsd install --gemini` (Gemini)
- 세션 내 대안: `$sg-setup` / `$sg-setup --gemini`

Step 1~3, Platform Limitations 섹션은 변경 없음.

### README.ko.md

Codex/Gemini 설치 섹션 영문과 의미 동일하게 한글 동기화. 기술 명령어(npx, --gemini)는 그대로.

`## 설치 확인` 섹션에 `### Claude Code` / `### Codex` / `### Gemini` 한글 서브섹션 추가 (영문과 동일 체크리스트 4단계).

## Verification Results

모든 자동화 검증 통과:

```
README.md:
  git clone count: 0 ✓
  npx install count: 2 ✓
  --gemini present ✓
  sg-setup tip present ✓
  Claude Code subsection ✓
  Codex verify ✓
  Gemini verify ✓

AGENTS.md:
  Step 0 present ✓
  npx in AGENTS ✓
  Step 1 intact ✓

README.ko.md:
  git clone count: 0 ✓
  npx install count: 2 ✓
  tip notes present ✓
  Codex verify KO ✓
  Gemini verify KO ✓
```

## Deviations from Plan

없음 — 계획대로 정확히 실행되었다.

## Known Stubs

없음.

## Self-Check: PASSED

- git clone 블록: README.md 0개, README.ko.md 0개
- npx @gyuha/super-gsd install: README.md 2개, AGENTS.md 1개, README.ko.md 2개
- Verify install 서브섹션: README.md와 README.ko.md 모두 3개 (Claude Code/Codex/Gemini)
- AGENTS.md Step 0: Step 1 앞에 위치 확인
