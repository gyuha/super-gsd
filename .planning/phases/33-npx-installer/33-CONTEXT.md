# Phase 33: npx Installer - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`package.json` + `bin/setup.js` 신규 작성. `npx @gyuha/super-gsd install` 단일 명령으로 Codex/Gemini 설치에 필요한 파일을 현재 프로젝트 디렉토리에 복사한다.

복사 대상 파일:
- Codex 기본: `.codex/hooks.json`, `hooks/` (5개 .cjs), `.agents/` (skills/)
- Gemini 추가(`--gemini`): `.gemini/settings.json`

이 Phase는 npm 패키지 구조와 CLI 스크립트 구현에 집중한다. 인세션 스킬($sg-setup)과 문서 개선은 Phase 34-35에서 다룬다.

</domain>

<decisions>
## Implementation Decisions

### A. 패키지 구조

- **D-01:** `package.json`을 리포지토리 루트에 신규 생성한다. `.claude-plugin/plugin.json`은 Claude Code 플러그인 전용이므로 수정하지 않는다.
- **D-02:** `package.json` 핵심 필드:
  - `name`: `"@gyuha/super-gsd"`
  - `version`: `"0.0.39"` — `.claude-plugin/plugin.json`의 현재 버전과 동기화
  - `bin`: `{ "super-gsd": "bin/setup.js" }` — npx 진입점
  - `files`: `["bin/", "hooks/", ".agents/", ".codex/", ".gemini/"]` — npm publish 시 포함되는 파일 목록
  - `engines`: `{ "node": ">=18" }` — hooks/*.cjs가 Node 18+ 기준으로 작성됨
  - `license`: `"MIT"`
  - `main` 필드: 불필요 (라이브러리가 아닌 CLI 전용)
- **D-03:** `bin/setup.js` 단일 파일로 구현. 파일 상단에 `#!/usr/bin/env node` shebang 필수.
- **D-04:** `bin/setup.js`는 CommonJS(`.cjs` 대신 `.js`) — package.json에 `"type"` 필드 미설정 시 기본값(CommonJS)을 그대로 사용. hooks/*.cjs와 동일 스타일.
- **D-05:** 버전 관리 동기화 — `배포` 트리거 실행 시 `package.json`의 `version`도 함께 업데이트한다 (기존 CLAUDE.md 배포 절차에 추가).

### B. 설치 소스 전략

- **D-06:** **npm 배포 방식** — `npm publish`로 패키지를 npm registry에 게시하고, `npx @gyuha/super-gsd install` 실행 시 npm 캐시에서 파일을 가져온다.
- **D-07:** `bin/setup.js`는 `__dirname`으로 자신의 위치(패키지 루트)를 결정하고, `path.join(__dirname, '..', 'hooks')` 등 상대 경로로 소스 파일에 접근한다.
- **D-08** `[informational]`: GitHub 직접 방식(`npx github:gyuha/super-gsd`)은 채택하지 않는다 — 브랜치 변경에 취약하고 버전 고정이 불가하다.
- **D-09** `[informational]`: 번들(파일 내장) 방식은 채택하지 않는다 — hooks/*.cjs가 독립 파일로 작동해야 하고 유지보수 비용이 높다.

### C. 파일 충돌 처리

- **D-10:** **기본 동작: 스킵 + 경고** — 대상 경로에 파일이 이미 존재하면 덮어쓰지 않고 노란색(ANSI yellow) 경고를 출력하며 스킵한다.
  ```
  ⚠ .codex/hooks.json already exists — skipping (use --force to overwrite)
  ```
- **D-11:** `--force` 플래그 시 덮어쓰기 — 기존 파일을 덮어쓰고 초록색 메시지를 출력한다.
  ```
  ✓ .codex/hooks.json (overwritten)
  ```
- **D-12** `[informational]`: 대화형 readline 프롬프트는 사용하지 않는다 — npx 비대화형 파이프 환경에서 깨질 수 있다.
- **D-13:** 복사 완료 후 summary를 출력한다:
  ```
  Installation complete.
    Copied: 3 files
    Skipped: 2 files (already exist)
  ```

### Claude's Discretion

- `bin/setup.js` 내부 구현 세부사항 (파일 복사 로직, 재귀 디렉토리 복사 구현) — Node.js `fs` 표준 모듈만 사용, 외부 의존성 없음.
- 출력 색상 ANSI 코드 직접 삽입 vs chalk 라이브러리 — 외부 의존성 최소화 원칙에 따라 ANSI 코드 직접 사용.
- `.agents/skills/` 복사 시 하위 디렉토리 구조를 그대로 유지.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — INSTALL-01, INSTALL-02, INSTALL-03 요구사항 (3개)
- `.planning/ROADMAP.md` §Phase 33 — Goal, Success Criteria (SC 1-4)

### 복사 대상 소스 파일
- `.codex/hooks.json` — Codex PreToolUse + Stop hooks 정의
- `.gemini/settings.json` — Gemini SessionEnd + BeforeTool hooks 정의
- `hooks/` — `stop_hook.cjs`, `rule_runner.cjs`, `transcript_matcher.cjs`, `lessons_ranker.cjs`, `hooks.json` (5개 파일)
- `.agents/skills/` — `sg-execute/`, `sg-plan/`, `sg-retro/`, `sg-review/`, `sg-ship/`, `sg-start/`, `sg-status/` (7개 서브디렉토리, 각각 SKILL.md 포함)

### 버전 관리 컨벤션
- `.claude-plugin/plugin.json` — 현재 버전 `0.0.39` — `package.json` 버전과 동기화 기준
- `CLAUDE.md` §버전 관리, §배포 트리거 — 버전 업 시 함께 업데이트해야 하는 파일 목록에 `package.json` 추가 필요

### 기존 Hook 구조 참고
- `hooks/hooks.json` — Claude Code 플러그인용 hooks 형식 (참고용)
- `CHANGELOG.md` — 배포 시 업데이트 대상

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/*.cjs` (5개): 복사 대상. Node 18+ CommonJS. 외부 의존성 없음 — `bin/setup.js`도 동일 제약 적용.
- `.codex/hooks.json`: 복사 대상 JSON 파일. 상대 경로(`hooks/rule_runner.cjs`)로 작성됨 — 복사 후 프로젝트 루트 기준으로 동작.
- `.gemini/settings.json`: 복사 대상. `$GEMINI_PROJECT_DIR` 환경변수 사용 — 복사 후 Gemini 환경에서 동작.

### Established Patterns
- 외부 의존성 없음 원칙: `hooks/*.cjs` 전체가 Node.js 표준 모듈만 사용. `bin/setup.js`도 동일하게 `fs`, `path`, `process`만 사용.
- CommonJS 스타일: `hooks/*.cjs` 파일들이 `require()`/`module.exports` 패턴. `bin/setup.js`도 동일 스타일.
- macOS/Linux 이식성: hooks가 BSD/GNU 호환으로 작성됨. `bin/setup.js`는 Node.js이므로 플랫폼 중립.

### Integration Points
- `package.json` ↔ `.claude-plugin/plugin.json`: 버전 필드를 동기화해야 함. 배포 트리거(CLAUDE.md)에 `package.json` 업데이트 추가 필요.
- `bin/setup.js` ↔ `hooks/` 경로: `__dirname`으로 패키지 루트 결정, 상대 경로로 소스 파일 접근.
- `package.json` `files` 배열: npm publish 시 `.codex/`, `.gemini/`, `hooks/`, `.agents/`, `bin/` 5개 디렉토리 포함.

</code_context>

<specifics>
## Specific Ideas

- 패키지명 `@gyuha/super-gsd` — npm scoped package (사용자 확인됨)
- 진입 명령 `npx @gyuha/super-gsd install` — Codex 기본
- `--gemini` 플래그 — Gemini 추가 설치
- Node.js 18+ 요구사항 — hooks/*.cjs와 동일 환경
- `--force` 플래그 패턴 — 충돌 처리 표준 관행

</specifics>

<deferred>
## Deferred Ideas

- `npx @gyuha/super-gsd update` 자동 업데이트 명령 — Phase 35 이후 Future Requirements
- Windows(PowerShell) 지원 — REQUIREMENTS.md Out of Scope
- Codex 공식 plugin marketplace 등록 — REQUIREMENTS.md Out of Scope
- `--dry-run` 플래그 (복사 미리보기) — 명시된 요구사항 아님, 향후 고려
- npm publish 자동화 (배포 트리거에 통합) — Phase 35 이후 검토

None from phase discussion — discussion stayed within phase scope.

</deferred>

---

*Phase: 33-npx-installer*
*Context gathered: 2026-05-26*
