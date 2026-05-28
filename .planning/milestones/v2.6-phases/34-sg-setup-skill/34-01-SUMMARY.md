---
phase: 34-sg-setup-skill
plan: "01"
subsystem: skills
tags: [sg-setup, skill, codex, gemini, installer]
dependency_graph:
  requires: [npx-installer]
  provides: [sg-setup-skill]
  affects: [plugin.json, .agents/skills, skills/]
tech_stack:
  added: []
  patterns: [AI-Read-Write, require.resolve, bash-cp, platform-detection]
key_files:
  created:
    - .agents/skills/sg-setup/SKILL.md
    - skills/sg-setup/SKILL.md
  modified: []
decisions:
  - "AI Read/Write 도구로 파일 복사 — Codex/Gemini 환경에서 bash cp 대신 AI 도구 사용 (D-13~D-16)"
  - "require.resolve('@gyuha/super-gsd/package.json') + npm root -g fallback으로 PKG_ROOT 결정 (D-01~D-04)"
  - "GEMINI_API_KEY, GEMINI_PROJECT_DIR, CODEX_SHELL, CODEX, .codex/ 환경 감지 (D-05~D-08)"
  - "plugin.json 수정 불필요 — ./skills/ 디렉토리 스캔으로 자동 등록 (D-18)"
  - "skills/ + .agents/ 쌍 커버 컨벤션 충족 (CLAUDE.md, D-17)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 34 Plan 01: sg-setup 인세션 스킬 Summary

**One-liner:** Codex/Gemini 세션 내부에서 `$sg-setup` 단일 명령으로 super-gsd 파일을 현재 프로젝트에 복사하는 스킬 2개 생성.

## Tasks Completed

| Task | Name | Files |
|------|------|-------|
| 1 | .agents/skills/sg-setup/SKILL.md 생성 (Codex/Gemini 플랫폼) | .agents/skills/sg-setup/SKILL.md |
| 2 | skills/sg-setup/SKILL.md 생성 (Claude Code 플랫폼) | skills/sg-setup/SKILL.md |

## What Was Built

### .agents/skills/sg-setup/SKILL.md

Codex/Gemini 전용 sg-setup 스킬. `$sg-setup` 명령으로 호출. AI Read/Write 도구로 파일을 복사한다 (bash cp 금지 — D-13~D-16).

주요 동작:
- `node -e "require.resolve('@gyuha/super-gsd/package.json')"` → PKG_ROOT 결정, `npm root -g` fallback 포함
- `GEMINI_API_KEY`, `GEMINI_PROJECT_DIR` 감지 시 `.gemini/settings.json` 추가 복사
- `CODEX_SHELL`, `CODEX`, `.codex/` 존재 시 Codex 플랫폼으로 감지
- 기본 파일 13개: hooks/ 5개 + .agents/skills/ 7개 SKILL.md + .codex/hooks.json
- 충돌: 기존 파일 스킵+경고 (기본) / --force 시 덮어쓰기
- Platform Constraints 블록 포함 (Codex/Gemini 3개 제약사항)

### skills/sg-setup/SKILL.md

Claude Code 전용 sg-setup 스킬. `/super-gsd:sg-setup` 명령으로 자동 등록 (plugin.json이 `./skills/` 디렉토리를 스캔하므로 별도 등록 불필요). Bash `cp`로 파일 복사.

주요 동작:
- .agents/ 버전과 동일한 PKG_ROOT 결정 로직
- `copy_file()` 함수 — 소스 존재 여부 확인, 충돌 처리, mkdir -p, cp
- 13개 파일 + GEMINI=true 시 .gemini/settings.json 추가
- `Installation complete. Copied: N / Skipped: N` summary 출력

## Verification Results

모든 자동화 검증 통과:

```
Task 1:
FILE EXISTS OK
name: sg-setup (1)
require.resolve (3)
Platform Constraints (1)
GEMINI_PROJECT_DIR (2)
already exists (1)
success_criteria (2)

Task 2:
FILE EXISTS OK
name: sg-setup (1)
require.resolve (3)
copy_file (15)
GEMINI_PROJECT_DIR (2)
already exists (1)
success_criteria (2)

D-18: plugin.json uses ./skills/ dir scan — no explicit entry needed
Both SKILL.md files validated OK
```

## Deviations from Plan

없음 — 계획대로 정확히 실행되었다.

## Known Stubs

없음.

## Threat Flags

없음 — 신규 네트워크 엔드포인트 없음. 모든 파일 쓰기는 CWD에 한정. 하드코딩된 상대 경로만 사용.

## Self-Check: PASSED

- .agents/skills/sg-setup/SKILL.md: FOUND
- skills/sg-setup/SKILL.md: FOUND
- 두 파일 모두 name: sg-setup 포함
- 두 파일 모두 require.resolve PKG_ROOT 로직 포함
- 두 파일 모두 GEMINI_PROJECT_DIR 감지 로직 포함
- 두 파일 모두 already exists 충돌 처리 로직 포함
- .agents/ 파일에 Platform Constraints 블록 포함
- D-18: plugin.json 수정 없이 자동 등록 확인
- skills/ + .agents/ 쌍 커버 컨벤션 충족
