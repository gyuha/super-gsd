# Phase 23: Plugin 연결 + commands/ 제거 + 문서 - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Source:** discuss-phase auto-mode update (2026-05-23) — all decisions verified against codebase

<domain>
## Phase Boundary

plugin.json의 "commands" 배열을 제거하고 skills/ 경로 참조만 유지한다. commands/ 디렉토리(14개 파일)를 완전히 삭제한다. CLAUDE.md Architecture 섹션을 skills/ 기준으로 재서술하고, README.md와 README.ko.md를 동기화한다.

**포함 범위:**
- plugin.json "commands" 키 처리 (D-01)
- commands/ 디렉토리 삭제 (D-02)
- CLAUDE.md Architecture 섹션 재서술 (D-03)
- README.md commands/ 참조 정리 (D-04)
- README.ko.md 동기화 (D-05)

**제외 범위:**
- .agents/skills/ 파일 — Codex/Gemini 접근성 유지를 위해 보존
- skills/sg-retro/, skills/sg-parallel-execute/ — 기존 skills/ 파일 내용 변경 없음

</domain>

<decisions>
## Implementation Decisions

### D-01: plugin.json "commands" 키 처리
- **결정:** "commands" 키 완전 제거. `"skills": "./skills/"` 키만 유지한다.
- **근거:** Claude Code 플러그인 시스템에서 `"skills"` 키로 SKILL.md 자동 로딩이 가능하면 "commands" 키가 불필요하다. skills/ 디렉토리가 단일 소스가 된다.
- **주의:** 플래너는 Claude Code plugin.json에서 "commands" vs "skills" 키의 실제 동작을 확인해야 한다. "commands" 제거 후 `/super-gsd:sg-*` 슬래시 명령이 여전히 동작하는지 검증 계획 포함 필요.

### D-02: commands/ 디렉토리 삭제
- **결정:** `commands/` 디렉토리 전체를 삭제한다 (14개 파일 포함).
- **전제:** skills/sg-*/SKILL.md 14개가 Phase 22에서 이미 생성 완료됨.
- **검증:** 삭제 후 `ls commands/` 가 "No such file or directory" 반환 확인.

### D-03: CLAUDE.md Architecture 섹션 재서술
- **결정:** "1. Commands 레이어 (`commands/*.md`)" 항목을 "1. Skills 레이어 (`skills/sg-*/SKILL.md`)"로 통합 재서술한다.
- **범위:** "커맨드 레이어" → "스킬 레이어" 완전 교체. 설명 문구도 skills/ 기준으로 재작성.
- **마커:** `<!-- GSD:architecture-start source:ARCHITECTURE.md -->` ... `<!-- GSD:architecture-end -->` 블록 내부만 수정.

### D-04: README.md commands/ 참조 정리
- **결정:** README.md에서 commands/를 암묵적으로 가정하는 문구를 skills/로 교체한다.
- **대상:** Roadmap/Phase 설명 중 "sg- Command Set"처럼 commands/를 가리키는 표현.

### D-05: README.ko.md 동기화
- **결정:** README.md와 동일한 변경을 README.ko.md에도 적용한다.
- **근거:** 사용자 명시적 요청. DOC-02 원래 범위(README.md만)를 README.ko.md까지 확장.

### Claude's Discretion
- 데이터 흐름(Data Flow) 다이어그램의 `sg-*` 명령 표기 방식 (commands 라인 참조가 있으면 제거)
- CLAUDE.md Technology Stack 섹션 (`commands/*.md` 언급 여부 — 최소 변경 원칙 적용)
- plugin.json 나머지 필드(version, description, author, homepage 등) — 변경 없음

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plugin 정의
- `.claude-plugin/plugin.json` — 현재 "commands" 배열 구조 확인 (14개 commands/ 경로)
- `skills/` — 완전한 SKILL.md 목록 확인 (16개 중 14개가 commands/에 대응)

### 삭제 대상
- `commands/sg-start.md`, `commands/sg-explore.md`, `commands/sg-plan.md`, `commands/sg-execute.md`, `commands/sg-review.md`, `commands/sg-learn.md`, `commands/sg-ship.md`, `commands/sg-status.md`, `commands/sg-lessons.md`, `commands/sg-update.md`, `commands/sg-quick.md`, `commands/sg-complete.md`, `commands/sg-new.md`, `commands/sg-health.md`

### 문서
- `CLAUDE.md` — Architecture 섹션 (GSD 마커 블록 내부)
- `README.md` — Roadmap, Phase 설명
- `README.ko.md` — README.md와 동일 구조

### Requirements
- `.planning/REQUIREMENTS.md` — PC-01, PC-02, DOC-01, DOC-02 확인

</canonical_refs>

<specifics>
## Specific Ideas

- plugin.json에서 "commands" 키 제거 후 `jq 'del(.commands)'` 패턴 사용 가능
- skills/ 디렉토리에 sg-retro와 sg-parallel-execute가 포함되어 있으나, 이들은 commands/에 대응 항목이 없음 — plugin.json 에서도 명시하지 않아도 됨
- CLAUDE.md GSD 마커(`<!-- GSD:architecture-start -->...<!-- GSD:architecture-end -->`) 보존 필수

</specifics>

<code_context>
## Existing Code Insights

### 현재 구현 상태 (2026-05-23 검증)
- `.claude-plugin/plugin.json`: `"commands"` 키 없음, `"skills": "./skills/"` 만 존재 — D-01 이미 구현됨
- `commands/` 디렉토리: 존재하지 않음 — D-02 이미 구현됨
- `CLAUDE.md` Architecture 섹션: "두 개의 레이어", "1. Skills 레이어 (`skills/sg-*/SKILL.md`)" — D-03 이미 구현됨
- `README.md` Phase 3 설명: "sg-retro cycle" 표현 사용 — D-04 이미 구현됨
- `README.ko.md` Phase 3 설명: "sg-retro 사이클" 표현 사용 — D-05 이미 구현됨

### 발견된 스태일 참조 (Deferred)
- `skills/sg-start/SKILL.md` 18, 61, 108행: `commands/sg-status.md` 참조가 3곳 남아 있음
  - 기능 영향 없음 (주석성 drift 가이드 텍스트)
  - 올바른 참조: `skills/sg-status/SKILL.md`
  - Phase 23 범위 외 — 별도 quick task 또는 다음 phase에서 처리

</code_context>

<deferred>
## Deferred Ideas

- v1.3 ~ v1.5 마일스톤 (Multi-Platform, Team Agent, Visual Companion) — 이 phase 범위 외
- sg-parallel-execute, sg-retro를 plugin.json에 명시적으로 등록하는 방안 — Phase 23 이후 검토
- `skills/sg-start/SKILL.md`의 `commands/sg-status.md` 스태일 참조 3건 수정 → `skills/sg-status/SKILL.md`로 교체 — 기능 무관, 향후 quick task 처리

</deferred>

---

*Phase: 23-plugin-commands*
*Context gathered: 2026-05-23 (auto-mode update — decisions verified against codebase)*
