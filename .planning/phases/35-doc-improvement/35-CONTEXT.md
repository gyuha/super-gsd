# Phase 35: 문서 개선 - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`README.md`, `AGENTS.md`, `README.ko.md` 3개 파일의 설치 섹션 업데이트. Codex/Gemini 설치 방법을 기존 `git clone + cp 4단계`에서 `npx @gyuha/super-gsd install` 단일 명령으로 교체하고, Verify install 섹션에 Codex/Gemini 전용 검증 단계를 추가한다.

변경 파일:
- `README.md` — Codex/Gemini 설치 섹션 교체 + Verify install 보강
- `AGENTS.md` — Quick Start에 설치 Step 0 추가
- `README.ko.md` — README.md 설치 섹션 동기화

이 Phase는 코드 변경 없이 문서만 수정한다. Phase 33(npx installer)과 Phase 34($sg-setup 스킬)에서 구현된 기능을 문서에 반영하는 것이 전부다.

</domain>

<decisions>
## Implementation Decisions

### A. 설치 섹션 재작성 범위

- **D-01:** **복사 명령 블록만 교체** — 기존 설명 텍스트(hooks.json/agents/ 역할 안내, Note 블록)는 내용을 간략화하되 완전히 제거하지 않는다. 사용자가 npx로 무엇이 설치되는지 이해할 수 있도록 1-2줄 요약 유지.
- **D-02:** Feature Delta 테이블은 변경 없음 — 플랫폼별 기능 차이는 변화가 없다.
- **D-03:** Codex 섹션과 Gemini 섹션 모두 npx 명령으로 교체. Codex는 기본 명령, Gemini는 `--gemini` 플래그 추가.
  ```bash
  # Codex
  npx @gyuha/super-gsd install

  # Gemini
  npx @gyuha/super-gsd install --gemini
  ```
- **D-04:** 기존 `git clone ~/super-gsd` 방식은 제거. `$sg-setup` 인세션 대안 언급은 Note 블록으로 간략히 추가.

### B. Verify install 섹션 구조

- **D-05:** **기존 섹션에 Codex/Gemini 검증 단계 통합** — 플랫폼별 분리 대신 기존 `## Verify install` 섹션에 Claude Code / Codex / Gemini 서브섹션 추가. 유지보수가 쉽고 원래 섹션 위치를 보존.
- **D-06:** Codex Verify 체크리스트:
  1. `cat .codex/hooks.json` — hooks.json 존재 확인
  2. `ls hooks/*.cjs` — hook 스크립트 존재 확인
  3. `ls .agents/skills/` — 스킬 디렉토리 확인
  4. `$sg-status` 실행하여 응답 확인
- **D-07:** Gemini Verify 체크리스트: .gemini/settings.json + hooks/ + .agents/ 동일 패턴.

### C. AGENTS.md 업데이트 범위

- **D-08:** **Step 0: 설치** 추가 — 현재 Quick Start가 Step 1(사전 조건)로 시작하지만 설치 방법이 없다. Step 0을 Quick Start 맨 앞에 추가.
- **D-09:** **npx가 주요 방법**, $sg-setup이 세션 내 대안:
  ```
  Step 0: 설치

  # 터미널에서 (세션 외부):
  npx @gyuha/super-gsd install          # Codex 기본
  npx @gyuha/super-gsd install --gemini # Gemini 추가

  # 또는 세션 내부에서:
  $sg-setup         # Codex 기본
  $sg-setup --gemini  # Gemini 추가
  ```
- **D-10:** AGENTS.md의 나머지 내용(Step 1~3, Platform Limitations)은 변경 없음.

### D. README.ko.md 동기화 수준

- **D-11:** **설치 섹션만 동기화** — Codex/Gemini 설치 블록과 Verify install 섹션만 한글화. 전체 1:1 동기화는 Phase 35 범위 외.
- **D-12:** 한글 번역은 영문과 의미 동일하게 유지. 기술 명령어(npx, --gemini 플래그)는 그대로 유지.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — DOC-01, DOC-02, DOC-03, DOC-04 요구사항 (4개)
- `.planning/ROADMAP.md` §Phase 35 — Goal, Success Criteria (SC 1-4)

### 선례 코드 (반드시 참조)
- `bin/setup.js` — npx 명령의 정확한 문법, `--gemini`, `--force` 플래그 확인
- `README.md` §Codex / §Gemini — 현재 설치 섹션 (교체 대상)
- `AGENTS.md` §Quick Start — 현재 Step 구조 (Step 0 추가 위치)

### 대상 파일
- `README.md` — Codex/Gemini 설치 섹션, Verify install 섹션
- `AGENTS.md` — Quick Start Step 0 추가
- `README.ko.md` — 설치 섹션 동기화

</canonical_refs>

<code_context>
## Existing Code Insights

### 현재 README.md 상태
- Codex 섹션 (약 line 193-205): `git clone + 4개 cp` 명령 블록
- Gemini 섹션 (약 line 211-225): 동일 패턴
- Verify install (약 line 233-241): Claude Code 기준 3단계만 존재
- Feature Delta 테이블 (line 180-188): 변경 불필요

### 현재 AGENTS.md 상태
- Quick Start Step 1: GSD 설치 여부 확인 (설치 방법 없음)
- Quick Start Step 2: `$sg-start` 실행
- 설치 방법 자체가 없는 상태

### 현재 README.ko.md 상태
- 설치 섹션이 README.md의 기존(git clone 방식)을 한글화한 상태
- Phase 33/34 변경 사항 미반영

### 확립된 패턴
- `npx @gyuha/super-gsd install` — Phase 33 확립
- `--gemini` 플래그 — Phase 33 확립
- `$sg-setup [--gemini] [--force]` — Phase 34 확립

</code_context>

<specifics>
## Specific Ideas

- Codex 섹션: 기존 4줄 cp 블록 → `npx @gyuha/super-gsd install` 단일 줄
- Gemini 섹션: `npx @gyuha/super-gsd install --gemini` 단일 줄
- Note 블록: "$sg-setup으로 세션 내 설치도 가능" 1줄 추가
- Verify install: Codex/Gemini 서브섹션 추가 (ls 체크 3단계 + $sg-status 1단계)
- AGENTS.md: Step 0 블록 추가 (npx 명령 + $sg-setup 대안)

</specifics>

<deferred>
## Deferred Ideas

- README.ko.md 전체 1:1 동기화 — Phase 35 범위 외
- Verify install 자동화 스크립트 — Phase 35 범위 외
- `$sg-setup --update` 자동 업데이트 — Future Requirements

</deferred>

---

*Phase: 35-doc-improvement*
*Context gathered: 2026-05-26*
