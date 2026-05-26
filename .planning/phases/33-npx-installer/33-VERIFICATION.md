---
phase: 33-npx-installer
verified: 2026-05-26T11:30:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 33: npx Installer Verification Report

**Phase Goal:** 사용자가 `npx @gyuha/super-gsd install` 한 명령으로 Codex/Gemini 설치에 필요한 파일을 현재 프로젝트에 복사할 수 있다
**Verified:** 2026-05-26T11:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npx @gyuha/super-gsd install` 실행 시 `.codex/hooks.json`, `hooks/`, `.agents/` 파일이 cwd에 복사된다 | ✓ VERIFIED | `/tmp/sg-verify-phase33`에서 직접 실행 — `.codex/hooks.json`, `hooks/`(4 .cjs + hooks.json + __pycache__), `.agents/skills/`(7개 서브디렉토리) 복사 확인. exit 0. |
| 2 | `npx @gyuha/super-gsd install --gemini` 실행 시 `.gemini/settings.json`도 추가로 복사된다 | ✓ VERIFIED | `/tmp/sg-verify-gemini`에서 `--gemini` 플래그로 실행 — `.gemini/settings.json` 복사 확인. |
| 3 | 대상 경로에 파일이 이미 존재하면 덮어쓰지 않고 ANSI yellow 경고를 출력하며 스킵한다 | ✓ VERIFIED | 재실행 시 `⚠ .codex/hooks.json already exists — skipping (use --force to overwrite)` 출력 확인. `skipped: 3` 카운트. |
| 4 | `--force` 플래그 사용 시 기존 파일을 덮어쓰고 ANSI green `(overwritten)` 메시지를 출력한다 | ✓ VERIFIED | `--force` 실행 시 `✓ .codex/hooks.json (overwritten)` 등 green 메시지 출력 확인. |
| 5 | 복사 완료 후 Copied/Skipped 카운트 summary가 stdout에 출력된다 | ✓ VERIFIED | `Installation complete.\n  Copied: 3 items\n  Skipped: 0 items (already exist)` 출력 확인. |
| 6 | CLAUDE.md 배포 트리거 절차에 `package.json` 버전 업데이트 단계가 명시된다 | ✓ VERIFIED | CLAUDE.md line 38: "세 파일을 함께 업데이트한다", line 52: "3. **package.json 업데이트** — `version` 필드를 새 버전으로 교체한다." |

**Score:** 6/6 truths verified

**Note on "5개 .cjs" wording:** PLAN must_have에서 "hooks/ 5개 .cjs"라고 명시했지만 실제 hooks/에는 4개 .cjs + hooks.json이 있다. CONTEXT.md line 82는 이를 "5개 파일"로 정확히 기술한다. 구현은 hooks/ 디렉토리를 재귀 복사하므로 모든 파일이 복사되며 — 핵심 기능에 영향 없음. PLAN의 wording 오류일 뿐이다.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | npm 패키지 매니페스트 — npx 실행 진입점 | ✓ VERIFIED | `name: "@gyuha/super-gsd"`, `version: "0.0.39"`, `bin.super-gsd: "bin/setup.js"`, `type` 필드 없음, `files: [bin/, hooks/, .agents/, .codex/, .gemini/]`, `engines.node: ">=18"`. |
| `bin/setup.js` | npx CLI 엔트리포인트 — 파일 복사 로직 | ✓ VERIFIED | 97줄, shebang 첫 줄 확인, `util.parseArgs`, `fs.cpSync`, `process.cwd()`, ANSI colors, 외부 의존성 없음. |
| `CLAUDE.md` | 배포 트리거 절차에 `package.json` 포함 | ✓ VERIFIED | "package.json 업데이트" 섹션 포함. "세 파일" 변경 확인. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `bin/setup.js` | `hooks/` | `__dirname` 기반 상대 경로 | ✓ WIRED | `path.dirname(path.dirname(path.resolve(__filename)))` 패턴으로 PKG_ROOT 결정. `path.join(PKG_ROOT, 'hooks')` 복사 소스 경로에 사용됨. |
| `bin/setup.js` | `.agents/` | `fs.cpSync recursive: true` | ✓ WIRED | `fs.cpSync(srcPath, destPath, { recursive: true })` — line 68. `.agents/skills/` 7개 서브디렉토리 복사 동작 확인. |
| `package.json` | `bin/setup.js` | `"bin"` 필드 | ✓ WIRED | `"bin": { "super-gsd": "bin/setup.js" }` — npx가 이 진입점을 실행. |

---

### Data-Flow Trace (Level 4)

해당 없음 — 이 Phase는 CLI 파일 복사 도구이며 동적 데이터 렌더링 컴포넌트가 없다.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 기본 install — .codex/.agents/hooks/ 복사 | `node bin/setup.js install` in /tmp | `.codex/hooks.json`, `hooks/`, `.agents/` 생성 확인 | ✓ PASS |
| --gemini 플래그 — .gemini/settings.json 추가 복사 | `node bin/setup.js install --gemini` in /tmp | `.gemini/settings.json` 생성 확인 | ✓ PASS |
| 재실행 skip 동작 | `node bin/setup.js install` (재실행) | `already exists — skipping` 경고 3건 출력 | ✓ PASS |
| --force 덮어쓰기 | `node bin/setup.js install --force` | `(overwritten)` 메시지 3건 출력 | ✓ PASS |
| 잘못된 서브커맨드 → exit 1 | `node bin/setup.js wrongcmd` | exit code 1, Usage 출력 | ✓ PASS |
| package.json 파싱 | `node -e "require('./package.json')"` | 오류 없음, 모든 필드 검증 통과 | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INSTALL-01 | 33-01-PLAN.md | `npx @gyuha/super-gsd install`로 `.codex/hooks.json`, `hooks/`, `.agents/` 복사 | ✓ SATISFIED | 직접 실행 결과로 확인. 모든 3개 항목 복사됨. |
| INSTALL-02 | 33-01-PLAN.md | `--gemini` 플래그로 `.gemini/settings.json` 복사 | ✓ SATISFIED | `--gemini` 플래그 실행으로 확인. |
| INSTALL-03 | 33-01-PLAN.md | `package.json`과 `bin/setup.js`가 루트에 존재하여 npx 즉시 실행 가능 | ✓ SATISFIED | 두 파일 모두 존재, 의존성 없음. |

**REQUIREMENTS.md 추적성:**
- SKILL-01, SKILL-02 → Phase 34 (이 Phase 범위 외)
- DOC-01~DOC-04 → Phase 35 (이 Phase 범위 외)
- 고아 요구사항 없음 — Phase 33 담당 3개 모두 플랜에 포함됨.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `hooks/` | — | `__pycache__` 디렉토리가 `hooks/` 재귀 복사에 포함됨 | ℹ Info | 불필요한 파이썬 캐시 디렉토리가 대상 프로젝트에 복사됨. 기능적 영향 없으나 npm publish 전 `.npmignore`나 `files` 필터링 고려 가능. |

채무 마커(`TBD`, `FIXME`, `XXX`) 없음. `TODO`, `HACK`, `PLACEHOLDER` 없음.

---

### Code Review Findings Assessment

REVIEW.md에서 발견된 이슈들이 phase goal을 차단하는지 평가:

**CR-01 (Critical): exit code 0 on copy errors**
- `bin/setup.js` line 82-87: `errors > 0`일 때 `process.exit(1)` 없음. 오류가 발생해도 exit code 0.
- Phase goal("사용자가 파일을 복사할 수 있다") 달성 여부와 별개 — 정상 경로에서 복사가 작동하므로 goal은 달성됨.
- 그러나 PLAN must_have에는 "오류 시 stderr에 출력하며 errors++" 항목만 있고 exit code 요건이 명시되지 않음. ROADMAP SC-4도 exit code를 요구하지 않음.
- 판정: **WARNING** — CI/CD 파이프라인 신뢰성에 영향. Phase goal은 달성되었으나 품질 결함. 다음 Phase 또는 별도 bugfix에서 수정 권장.

**WR-02 (Warning): --force on directories merges rather than replaces**
- `fs.cpSync` merge 동작으로 구버전 hook 파일이 대상 프로젝트에 남을 수 있음.
- Phase goal 범위 외 — D-11은 "overwrite" 명시하나 stale file 제거 요건 없음.
- 판정: **WARNING** — 업그레이드 시나리오에서 stale hook 누적 위험. 현재 Phase goal은 초기 설치 UX 개선이므로 비차단.

두 이슈 모두 next-phase 또는 별도 fix로 처리 권장.

---

### Human Verification Required

없음 — 모든 핵심 동작을 CLI 실행으로 프로그래밍적으로 검증했다.

---

## Gaps Summary

없음. 6/6 must-haves 모두 검증됨. Phase 33 goal 달성.

**품질 이슈 (goal 비차단):**

1. **CR-01** — `errors > 0` 시 `process.exit(1)` 누락. CI/CD 파이프라인에서 오류를 숨길 수 있음. 코드 1줄 수정으로 해결 가능.
2. **WR-02** — `--force` 디렉토리 복사가 merge 방식 — 구버전 파일 잔존 가능. 해결책: `fs.rmSync(destPath, { recursive: true })` 후 `cpSync`.
3. **Info** — `hooks/__pycache__`가 복사 대상에 포함됨. npm publish 전 `.npmignore` 추가 권장.

---

_Verified: 2026-05-26T11:30:00Z_
_Verifier: Claude (gsd-verifier)_
