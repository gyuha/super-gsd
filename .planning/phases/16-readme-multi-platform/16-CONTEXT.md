# Phase 16: README Multi-Platform 섹션 - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

README.md(영문)와 README.ko.md(한글)에 Codex, Gemini CLI, Antigravity CLI 사용자를 위한 Multi-Platform 섹션을 추가한다.

이 phase의 책임:
- `README.md` — Installation 섹션 바로 다음에 "Multi-Platform Support" 섹션 삽입
- `README.ko.md` — 동일 위치에 한글 버전 섹션 삽입 (README.md와 동시 작업)
- 섹션 내용: (1) 플랫폼별 설치 요약, (2) 기능 델타 테이블

새 파일 생성 없음. Phase 14·15에서 생성한 파일들(`.agents/skills/`, `.codex/hooks.json`, `.gemini/settings.json`)을 문서화하는 순수 문서 작업이다.

Phase 14 범위: AGENTS.md 재작성 + `.agents/skills/` 6개 스킬.
Phase 15 범위: `.codex/hooks.json`, `.gemini/settings.json`, Python 훅 경로 폴백.

</domain>

<decisions>
## Implementation Decisions

### A. 섹션 위치

**결정: Installation 섹션 바로 다음에 삽입.**

현재 README.md 구조:
```
## What this is
## Workflow
## Commands
## Phase management
## Usage Examples
## Installation     ← 현재 위치 (line ~145)
## Prerequisites
## Verify install
## Roadmap
## License
```

"Multi-Platform Support" 섹션을 `## Installation` 바로 다음(`## Prerequisites` 바로 앞)에 삽입한다. 설치 절차를 읽은 직후 "내 플랫폼은?"을 자연스럽게 찾을 수 있는 위치다.

### B. 델타 테이블 구조

**결정: 행=기능, 열=플랫폼 (Claude Code / Codex / Gemini+Antigravity CLI).**

테이블 구조:

| 기능 | Claude Code | Codex | Gemini/Antigravity CLI |
|------|-------------|-------|------------------------|
| sg-* 슬래시 명령 | ✅ | ❌ (`$sg-*` 사용) | ❌ (`$sg-*` 사용) |
| Stop 훅 자동 인계 | ✅ | ✅ (`.codex/hooks.json`) | ✅ (`.gemini/settings.json`) |
| SubagentStop 훅 | ✅ | ❌ (미지원) | ❌ (미지원) |
| Superpowers 연동 | ✅ | ❌ | ❌ |
| AskUserQuestion UI | ✅ | ❌ (numbered list fallback) | ❌ (numbered list fallback) |
| sg-retro | ✅ | ✅ (`.agents/skills/sg-retro`) | ✅ (`.agents/skills/sg-retro`) |
| PreToolUse/BeforeTool 훅 | ✅ | ✅ | ✅ |

영문 README는 영문 표현 사용. 한글 README.ko.md는 동일 내용을 한글로.

3분류 표시 기호:
- ✅ = 완전 동작
- ⚠️ = 동작하나 제한 있음 (fallback/대안 존재)
- ❌ = 미지원

### C. 설치 가이드 분량

**결정: 미니멀 — 1-3줄 요약 + 파일 경로 나열.**

각 플랫폼별로:
1. 전제 조건 1줄 (해당 CLI 설치 필요)
2. 설정 파일 경로 나열 (어떤 파일이 어디에 있는지)
3. 훅 동작 방식 1줄 요약

Claude Code 설치는 기존 `## Installation` 섹션에 이미 존재하므로 중복하지 않는다. Non-Claude Code 플랫폼은 "Claude Code plugin marketplace 명령 없음 — 수동으로 저장소를 클론한다" 형태로 안내.

**Codex 설치 요약 형태:**
```
1. 저장소를 클론한다
2. `.codex/hooks.json`이 자동으로 훅을 등록한다
3. `.agents/skills/`의 스킬을 `$sg-*` 문법으로 호출한다
```

**Gemini/Antigravity CLI 설치 요약 형태:**
```
1. 저장소를 클론한다
2. `.gemini/settings.json`이 훅을 등록한다
3. `.agents/skills/`의 스킬을 사용한다
```

### D. README.ko.md 처리

**결정: README.md와 동시에 업데이트. 한글 버전도 같은 커밋에 포함.**

이유: 두 파일은 현재 220줄로 동일한 구조이고, Phase 16은 섹션 삽입만이므로 병렬 작성이 어렵지 않다. "영문 먼저 → 별도 quick task" 방식은 두 파일이 일시적으로 불일치 상태가 되는 기간을 만들어 불필요한 혼란 초래.

### E. Phase 14 deferred 처리

Phase 14에서 "AGENTS.md의 GSD 재생성 충돌 방지 메커니즘 — Phase 16 README 작업 시 함께 처리 가능"으로 deferred됐다.

**결정: Phase 16 스코프에 포함하지 않는다.**

이유: MULTI-02 요건(README Multi-Platform 섹션)에 AGENTS.md 재생성 충돌 방지는 포함되지 않는다. 해당 항목은 AGENTS.md 유지보수 문제이며 별도 quick task 또는 v1.4 범위다. Phase 16은 README 문서 작업에 집중한다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항 정의
- `.planning/REQUIREMENTS.md` — MULTI-02 요건 전체 (MUST read)
- `.planning/ROADMAP.md` — Phase 16 Goal, Success Criteria

### 수정 대상 파일
- `README.md` — 현재 220줄. Installation 섹션(line ~145) 이후에 새 섹션 삽입.
- `README.ko.md` — 현재 220줄. README.md와 동일 위치에 한글 버전 삽입.

### Phase 14·15 산출물 (문서화 대상)
- `AGENTS.md` — Phase 14에서 Codex 어휘로 재작성된 버전. 섹션 내용 참조용.
- `.agents/skills/` — Phase 14에서 생성된 6개 스킬 디렉토리. 경로 안내에 사용.
- `.codex/hooks.json` — Phase 15에서 생성. Codex 훅 설정 파일 경로 안내에 사용.
- `.gemini/settings.json` — Phase 15에서 생성. Gemini/Antigravity CLI 훅 설정 파일 경로 안내에 사용.

### 플랫폼 제약 근거 (Phase 15 CONTEXT.md)
- `.planning/phases/15-platform-hooks-python-fix/15-CONTEXT.md` — 플랫폼별 훅 이벤트명, timeout 단위, 환경변수 등 기술 세부사항

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` `## Installation` 섹션 — 새 섹션 삽입 앵커. 현재 Claude Code 전용 설치 절차. 새 섹션은 이 바로 다음에 위치.
- `README.ko.md` — README.md와 동일한 줄 수(220줄)와 섹션 구조. 두 파일을 병행 편집.

### Established Patterns
- README.md의 기존 테이블 스타일: `| 헤더 | 헤더 |` 형태의 GitHub Markdown 파이프 테이블.
- 영문 README primary, 한글 README.ko.md secondary — 기존 관행 유지.
- README 섹션 제목: `## [단어 대문자]` (예: `## Installation`, `## Prerequisites`).

### Integration Points
- 새 섹션은 기존 `## Installation`과 `## Prerequisites` 사이에 삽입된다.
- 기존 Installation 섹션(`/plugin marketplace add` 등) 내용 수정 없음.

</code_context>

<specifics>
## Specific Ideas

- 델타 테이블 3분류 기호: ✅ (완전 동작) / ⚠️ (제한 있음) / ❌ (미지원).
- Codex와 Gemini/Antigravity CLI를 별도 열로 구분 (합치지 않음) — 훅 파일 경로가 다르고, 제약 내용도 미묘하게 다를 수 있다.
- 설치 가이드는 미니멀 (1-3줄 + 파일 경로) — step-by-step 깊이는 AGENTS.md에서 담당.
- SubagentStop 미지원, Superpowers 연동 불가는 테이블에서 ❌로 명확히 표시 — 사용자가 실망을 설치 후가 아닌 README 읽을 때 발견하도록.
- 섹션 제목 후보: `## Multi-Platform Support` (영문) / `## 멀티 플랫폼 지원` (한글).

</specifics>

<deferred>
## Deferred Ideas

- AGENTS.md GSD 재생성 충돌 방지 메커니즘 문서화 — Phase 14에서 이월된 항목. MULTI-02 요건에 포함되지 않으므로 Phase 16 스코프 밖. v1.4 또는 별도 quick task로 처리.
- Antigravity CLI 공식 문서 확정 후 델타 테이블 재검증 — Phase 15 VERIFICATION.md human-verify 항목과 연동. Phase 16 완료 후 필요 시 문서 패치.
- `.codex/skills/` 별도 경로 안내 — Phase 14에서 "Phase 15 리서치 시 확인"으로 deferred. 확정 시 Multi-Platform 섹션에 추가 가능.
- sg-health Antigravity/Codex 변형 언급 — REQUIREMENTS.md v1.4+ 항목. Phase 16 델타 테이블에 "미구현" 주석 추가 가능하나 scope 판단은 플래너에게 위임.

</deferred>

---

*Phase: 16-readme-multi-platform*
*Context gathered: 2026-05-21*
