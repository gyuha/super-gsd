---
phase: 33-npx-installer
plan: "01"
subsystem: installer
tags: [npx, cli, npm-package, installer]
dependency_graph:
  requires: []
  provides: [npx-installer, package-json]
  affects: [CLAUDE.md, deploy-workflow]
tech_stack:
  added: []
  patterns: [CommonJS, fs.cpSync, util.parseArgs, ANSI-colors]
key_files:
  created:
    - package.json
    - bin/setup.js
  modified:
    - CLAUDE.md
decisions:
  - "@gyuha/super-gsd scoped npm package with bin entry pointing to bin/setup.js"
  - "CommonJS (no type field) matching hooks/*.cjs convention"
  - "No external dependencies — fs, path, util stdlib only"
  - "Directory-level copy counting (hooks=1, .agents=1, .codex/hooks.json=1)"
  - "배포 트리거 재번호: Steps 1-5 → 1-6 (package.json step 3 삽입)"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 33 Plan 01: npx Installer Summary

**One-liner:** `npx @gyuha/super-gsd install` CLI that copies hooks/, .agents/, .codex/ (and optionally .gemini/) into target project using stdlib only.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | package.json + bin/setup.js 구현 | f28b17e | package.json, bin/setup.js |
| 2 | CLAUDE.md 배포 트리거 package.json 추가 | bcaa0d7 | CLAUDE.md |

## What Was Built

### package.json

루트에 `@gyuha/super-gsd` scoped npm 패키지 매니페스트를 생성했다. `bin.super-gsd` 필드가 `bin/setup.js`를 가리키므로 `npx @gyuha/super-gsd install`로 직접 실행 가능하다. `files` 배열에 `bin/`, `hooks/`, `.agents/`, `.codex/`, `.gemini/`를 포함해 npm publish 시 필요한 모든 파일이 패키지에 포함된다. `"type"` 필드 없음 — CommonJS default 유지.

### bin/setup.js

`util.parseArgs`로 `--force`, `--gemini` 플래그와 `install` 서브커맨드를 파싱한다. `PKG_ROOT`는 `path.dirname(path.dirname(path.resolve(__filename)))`으로 결정 (bin/ → pkg root). 복사 항목:

- 항상: `.codex/hooks.json` (단일 파일), `hooks/` (디렉토리 재귀), `.agents/` (디렉토리 재귀)
- `--gemini` 시 추가: `.gemini/settings.json`

파일/디렉토리가 이미 존재하면 yellow ANSI 경고 출력 후 skip. `--force`이면 덮어쓰고 green `(overwritten)` 메시지 출력. 완료 후 `Copied/Skipped` summary 출력. 외부 의존성 없음.

### CLAUDE.md

`§버전 관리` 섹션 "두 파일" → "세 파일"로 변경, `package.json` 항목 추가. `§배포 트리거` 절차에 "3. package.json 업데이트" 단계 삽입, 기존 3→4(CHANGELOG), 4→5(git commit), 5→6(git push)으로 재번호. git commit 메시지 문구는 "변경된 두 파일" → "변경된 세 파일"로 업데이트.

## Verification Results

모든 자동화 검증 통과:

```
package.json OK
shebang OK
INSTALL OK  (.codex/hooks.json + hooks/ + .agents/ 복사 확인)
SKIP OK     (이미 존재 시 "already exists — skipping" 출력 확인)
GEMINI OK   (.gemini/settings.json 복사 확인)
FORCE OK    ("overwritten" 메시지 출력 확인)
CLAUDE.md update OK
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. All file writes bounded to `process.cwd()`.

## Self-Check: PASSED

- package.json: FOUND
- bin/setup.js: FOUND
- SUMMARY.md: FOUND
- Commit f28b17e: FOUND
- Commit bcaa0d7: FOUND
