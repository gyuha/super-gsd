# Phase 34: $sg-setup 인세션 스킬 - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`.agents/skills/sg-setup/SKILL.md` 신규 생성. Codex/Gemini 세션 내부에서 `$sg-setup` 스킬 하나로 프로젝트에 필요한 파일이 자동으로 복사된다.

복사 대상 파일:
- 기본: `hooks/` (5개 .cjs), `.agents/` (skills/), `.codex/hooks.json`
- `--gemini` 플래그: `.gemini/settings.json` 추가

이 Phase는 `.agents/skills/sg-setup/SKILL.md` 단일 파일 생성에 집중한다. npx 인스톨러(Phase 33)와 문서 개선(Phase 35)은 각각 별도 Phase에서 다룬다.

</domain>

<decisions>
## Implementation Decisions

### A. 소스 파일 획득 방법

- **D-01:** **npm 패키지 경로 기반** — `sg-setup` 스킬이 실행될 때 super-gsd 패키지가 npm으로 설치되어 있다고 가정한다. Node.js `require.resolve` 또는 `node -e "console.log(require.resolve('@gyuha/super-gsd/package.json'))"` 으로 패키지 루트를 찾는다.
- **D-02:** 패키지 루트 결정 방법:
  ```bash
  PKG_ROOT=$(node -e "console.log(require('path').dirname(require.resolve('@gyuha/super-gsd/package.json')))" 2>/dev/null)
  ```
  실패 시 fallback:
  ```bash
  [ -z "$PKG_ROOT" ] && PKG_ROOT=$(npm root -g 2>/dev/null)/$(node -e "process.stdout.write(require('@gyuha/super-gsd/package.json').name)" 2>/dev/null | tr '/' '_')
  ```
- **D-03:** 패키지 루트를 찾지 못하면 명확한 오류 메시지를 출력하고 종료한다:
  ```
  [sg-setup] Cannot locate @gyuha/super-gsd package. Install it first:
    npx @gyuha/super-gsd install
  ```
- **D-04:** SKILL.md 내부에서 **AI Read/Write 도구를 사용해 파일을 직접 복사**한다. 이것이 `.agents/skills/` SKILL.md의 표준 패턴이다 (`sg-review`의 "각 변경 파일을 Read 도구로 열어 내용 확인", `sg-review`의 SUMMARY.md 작성 패턴과 동일). bash `cp`/`fs.copyFileSync`가 아닌 AI Read → Write 방식으로 각 파일을 복사한다.

### B. 플랫폼 감지

- **D-05:** **인수(argument) 우선** — `$ARGUMENTS`에 `--gemini` 또는 `--codex` 플래그가 있으면 해당 플랫폼으로 처리한다.
- **D-06:** 인수가 없을 때 **자동 감지**:
  ```bash
  # Codex: CODEX_SHELL 또는 CODEX 환경변수, 또는 .codex/ 디렉토리 존재
  if [ -n "$CODEX_SHELL" ] || [ -n "$CODEX" ] || [ -d ".codex" ]; then
    PLATFORM="codex"
  # Gemini: GEMINI_PROJECT_DIR 또는 GEMINI_API_KEY 환경변수
  elif [ -n "$GEMINI_PROJECT_DIR" ] || [ -n "$GEMINI_API_KEY" ]; then
    PLATFORM="gemini"
  else
    PLATFORM="codex"  # 기본값: Codex (더 범용적)
  fi
  ```
- **D-07:** `--gemini` 플래그 명시 시 `.gemini/settings.json` 추가 복사 (Phase 33의 `bin/setup.js`와 동일 로직).
- **D-08** `[informational]`: 환경 변수 기반 감지는 추론이므로 감지 결과를 출력하여 사용자가 확인할 수 있게 한다:
  ```
  [sg-setup] Platform detected: codex (use --gemini to include Gemini settings)
  ```

### C. 충돌 처리

- **D-09:** **기본 동작: 스킵 + 경고** — Phase 33 `bin/setup.js`와 동일한 정책. 대상 경로에 파일이 이미 존재하면 덮어쓰지 않고 경고를 출력하며 스킵한다:
  ```
  ⚠ .codex/hooks.json already exists — skipping (use --force to overwrite)
  ```
- **D-10:** `--force` 인수 시 덮어쓰기 — 기존 파일을 덮어쓰고 완료 메시지를 출력한다:
  ```
  ✓ .codex/hooks.json (overwritten)
  ```
- **D-11:** 복사 완료 후 summary 출력:
  ```
  Setup complete.
    Copied:  N files
    Skipped: N files (already exist)
  ```
- **D-12** `[informational]`: 대화형 readline 프롬프트는 사용하지 않는다 — `bin/setup.js`가 정립한 선례와 동일.

### D. 복사 실행 방법

- **D-13:** **AI Read/Write 도구 직접 사용** — `.agents/skills/` SKILL.md 파일들의 표준 패턴. `sg-review`가 변경 파일을 Read 도구로 읽어 SUMMARY.md에 기록하는 것과 동일하게, `sg-setup`도 소스 파일을 Read 도구로 읽어 Write 도구로 대상 경로에 쓴다.
- **D-14:** 디렉토리 복사(`hooks/`, `.agents/`)는 하위 파일 목록을 bash로 나열한 뒤 각 파일을 개별 Read → Write로 처리한다:
  ```bash
  find "$PKG_ROOT/hooks" -type f -name "*.cjs" -o -name "*.json"
  ```
  각 파일에 대해 Read → Write 실행.
- **D-15:** 대상 디렉토리가 없으면 Write 도구가 자동으로 생성한다 (Write 도구의 `mkdir -p` 동등 동작 활용).
- **D-16** `[informational]`: bash `cp -r`이나 Node.js `fs.cpSync` 대신 AI 도구를 사용하는 이유 — Codex/Gemini 환경에서 bash 명령 실행 가능 여부가 환경에 따라 다르지만, Read/Write AI 도구는 모든 플랫폼에서 사용 가능하다.

### E. 스킬 파일 구조

- **D-17:** `skills/sg-setup/SKILL.md`도 동시에 생성한다 — CLAUDE.md 컨벤션에 따라 `skills/` + `.agents/` 쌍을 함께 다룬다:
  > `skills/` + `.agents/` 쌍 커버 — `skills/*/SKILL.md`를 수정·변환하는 플랜을 작성할 때, 동일 이름의 `.agents/skills/*/SKILL.md`가 존재하는지 확인하고 해당 파일도 플랜에 명시적으로 포함한다.
- **D-18:** `plugin.json`의 skills 경로 등록도 이 Phase에서 함께 처리한다 — `plugin.json`에 `sg-setup` 스킬 경로 추가.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — SKILL-01, SKILL-02 요구사항 (2개)
- `.planning/ROADMAP.md` §Phase 34 — Goal, Success Criteria (SC 1-3)

### 선례 코드 (반드시 참조)
- `bin/setup.js` — 충돌 처리(스킵+경고+--force), 복사 대상 목록, ANSI 색상 출력 패턴. sg-setup의 동작이 이 파일과 일관되어야 한다.
- `.agents/skills/sg-review/SKILL.md` — AI Read/Write 도구 직접 사용 패턴 (4b, 4d 단계)
- `.agents/skills/sg-plan/SKILL.md` — platform constraints 블록, bash/prose 폴백 패턴
- `.agents/skills/sg-execute/SKILL.md` — lessons 주입, phase 해석 패턴

### 복사 대상 소스 파일 (PKG_ROOT 기준)
- `hooks/stop_hook.cjs`
- `hooks/rule_runner.cjs`
- `hooks/transcript_matcher.cjs`
- `hooks/lessons_ranker.cjs`
- `hooks/hooks.json`
- `.agents/skills/sg-execute/SKILL.md`
- `.agents/skills/sg-plan/SKILL.md`
- `.agents/skills/sg-retro/SKILL.md`
- `.agents/skills/sg-review/SKILL.md`
- `.agents/skills/sg-ship/SKILL.md`
- `.agents/skills/sg-start/SKILL.md`
- `.agents/skills/sg-status/SKILL.md`
- `.codex/hooks.json`
- `.gemini/settings.json` (--gemini 플래그 시)

### 버전 관리 컨벤션
- `.claude-plugin/plugin.json` — `sg-setup` 스킬 경로 추가 필요
- `CLAUDE.md` §버전 관리 — `skills/` + `.agents/` 쌍 커버 컨벤션

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/setup.js`: Phase 33에서 구현된 npx 인스톨러. `sg-setup`의 동작 명세 기준이다. 충돌 처리 로직(D-09, D-10, D-11), 복사 대상 목록(D에 열거), ANSI 색상 출력을 이미 확립했다.
- `.agents/skills/` 6개 SKILL.md: 복사 대상이자 AI Read/Write 패턴의 원본. 모두 `<constraints>`, `<execution_context>`, `<process>`, `<success_criteria>` 4-블록 구조를 갖는다.

### Established Patterns
- **AI 도구 우선**: `.agents/` SKILL.md는 bash 명령보다 Read/Write AI 도구를 선호한다. bash는 패키지 루트 경로 결정 등 AI 도구로 대체 불가한 영역에만 사용한다.
- **platform constraints 블록**: 모든 `.agents/` SKILL.md에 동일한 3개 제약(Superpowers 연동 불가, SubagentStop 미지원, AskUserQuestion 미지원)이 명시된다.
- **스킵+경고 충돌 처리**: `bin/setup.js`가 정립. 모든 파일 복사 스킬이 동일 정책을 따른다.
- **$sg-* 명령 문법**: `.agents/` 환경에서는 `/super-gsd:sg-*` 대신 `$sg-*` 문법을 사용한다.

### Integration Points
- `sg-setup` → `bin/setup.js`: 동일한 복사 대상 목록과 충돌 처리 정책을 공유한다. bin/setup.js는 npx 진입점, sg-setup은 세션 내 AI 도구 진입점으로 상호 보완 관계다.
- `sg-setup` → `plugin.json`: `skills/sg-setup/SKILL.md` 경로를 plugin.json에 등록해야 한다.
- `sg-setup` → `skills/sg-setup/SKILL.md`: CLAUDE.md 컨벤션에 따라 skills/ 쌍도 동시 생성한다.

</code_context>

<specifics>
## Specific Ideas

- 명령 문법: `$sg-setup` (Codex/Gemini 인세션), `/super-gsd:sg-setup` (Claude Code)
- 인수: `--gemini` (Gemini 설정 파일 추가), `--force` (기존 파일 덮어쓰기)
- 패키지 루트 감지: `require.resolve('@gyuha/super-gsd/package.json')` → `path.dirname()`
- 출력 형식: `bin/setup.js`와 동일한 ✓/⚠ + ANSI 색상 + summary

</specifics>

<deferred>
## Deferred Ideas

- `$sg-setup --update` 자동 업데이트 — Phase 35 이후 Future Requirements
- Windows(PowerShell) 지원 — REQUIREMENTS.md Out of Scope
- 설치 후 자동 verification (hooks 동작 테스트) — Phase 35 문서 개선에서 다룸
- 대화형 플랫폼 선택 (numbered list) — 자동 감지로 충분, 불필요한 인터랙션 제거

</deferred>

---

*Phase: 34-sg-setup-skill*
*Context gathered: 2026-05-26*
