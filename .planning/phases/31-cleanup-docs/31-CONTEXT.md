# Phase 31: 정리 + 문서 - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Source:** gsd-discuss-phase (Discussion Log D-01~D-05)

<domain>
## Phase Boundary

Phase 31의 실질 범위는 **문서 갱신만**이다. `hooks/*.py` 4개는 quick task 260525-vp6 (commit 877a666)에서 이미 삭제 완료되어 CLEAN-01은 Phase 31 이전에 처리됨.

변경 대상 파일:
- `CLAUDE.md` — Python/`.py` 참조 7개 위치 갱신
- `README.md` — L201, L216 Python scripts 표현 교체 (L255 Roadmap 과거 항목은 보존)
- `README.ko.md` — 동일 패턴 존재 시 동일 규칙 적용 (execute 전 `grep -n "Python"` 확인 후 처리)
- `CHANGELOG.md` — v2.4 마일스톤 요약 항목 추가 (버전 0.0.38)
- `plugin.json` — 0.0.38로 버전 bump (CLAUDE.md 배포 트리거 규칙)

</domain>

<decisions>
## Implementation Decisions

### D-01: CLAUDE.md 갱신 범위 — 섹션별 차별 적용 (Option C)

- **Constraints (L16):** `Bash/Python/Markdown` → `Bash/Node.js/Markdown`
- **Technology Stack — Hooks 항목 (L28–30):**
  - `hooks/*.py — Python 3.` → `hooks/*.cjs — Node.js 18+.`
  - `rule_runner.py` → `rule_runner.cjs`
  - `lessons_ranker.py` → `lessons_ranker.cjs`
- **Architecture — Skills 레이어 (L106):** `Python 스크립트를 호출해` → `Node.js 스크립트(.cjs)를 호출해`
- **Architecture — Hooks 레이어 (L110–112):** `.py` → `.cjs` 파일명 교체, `Python` 언급 제거 또는 `Node.js`로 교체
- **Architecture — 환경 변수 (L139):** `__file__` 기반 경로 폴백 설명 → `__dirname` (CommonJS) 기반으로 교체
- **Architecture — 데이터 흐름 (L118–124):** `lessons_ranker.py` → `lessons_ranker.cjs`, `stop_hook.py` → `stop_hook.cjs`, `rule_runner.py` → `rule_runner.cjs`
- **HANDOFF.md 설명 내 stop_hook.py (L135):** `stop_hook.cjs`로 교체
- **Development Commands (L166–175):** 4개 `python3 hooks/*.py` 명령 전부 `node hooks/*.cjs` 기반으로 완전 교체
- **보존:** `<!-- GSD:*-start/end -->` HTML 주석 태그는 수정하지 않음

### D-02: README Python 언급 처리

- **L201 (Codex 설치 섹션):** `Python scripts` → `Node.js scripts (CommonJS .cjs)`
- **L216 (Gemini 설치 섹션):** `Python scripts` → `Node.js scripts (CommonJS .cjs)`
- **L255 (Roadmap — Phase 15 과거 항목):** 수정 없음 — 역사 기록 보존
- **README.ko.md:** 동일 패턴 존재 시 동일 규칙 적용

### D-03, D-04, D-05: CHANGELOG v2.4 항목 구조

버전 0.0.38에 다음 구조로 추가:

```
## [0.0.38] - 2026-05-26

### Changed (v2.4 Hooks Node Migration — milestone complete)

- CLAUDE.md: Hooks 레이어 서술을 `hooks/*.cjs` / Node.js 18+ 기준으로 전면 갱신,
  Development Commands 예시 4개를 `node hooks/*.cjs` 기반으로 교체
- README.md / README.ko.md: Codex·Gemini 설치 섹션의 "Python scripts" →
  "Node.js scripts (CommonJS .cjs)" 교체

### Summary: v2.4 Hooks Node Migration (Phases 28–31)

- Phase 28: `hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 신규 작성
- Phase 29: `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` — python3 → node 전환
- Phase 30: 8개 SKILL.md python3 → node 일괄 교체
- Phase 31 / 260525-vp6: `.py` 삭제 + CLAUDE.md / README 문서 Node 기반 갱신
```

0.0.37의 세부 기록은 보존하고, 0.0.38에는 요약만 재언급.

### Claude's Discretion

- Architecture 섹션 교체 수준: 파일명/런타임만 교체 (전체 재서술 없음)
- README.ko.md 범위: Python 관련 교체 외 영문 불일치 섹션은 Phase 31 범위 외

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 변경 대상 파일
- `CLAUDE.md` — Technology Stack/Architecture/Development Commands 섹션 (Python 참조 7개 위치)
- `README.md` — L201, L216 (Codex/Gemini 설치 안내), L255 보존
- `README.ko.md` — 동일 패턴 조건부 처리
- `CHANGELOG.md` — 0.0.38 새 버전 섹션 추가 위치 (최상단)
- `.claude-plugin/plugin.json` — 버전 필드 0.0.38 bump

### Phase 컨텍스트
- `.planning/ROADMAP.md` — Phase 31 SC #1–5
- `.planning/REQUIREMENTS.md` — CLEAN-01, DOC-01, DOC-02, DOC-03

</canonical_refs>

<specifics>
## Specific Ideas

**CLAUDE.md 검증 명령 (갱신 후):**
```bash
grep -n 'python3\|\.py' CLAUDE.md
# 결과 0건이어야 함 (단, 코드 예시나 .claude-plugin/*.py 같은 비hook 참조 제외)
```

**최종 통합 검증 (Phase 31 SC #2):**
```bash
grep -rn 'python3' hooks/ skills/ .agents/skills/ .codex/ .gemini/ CLAUDE.md README.md README.ko.md
# 결과 0건
```

**CHANGELOG 버전 파싱 호환성:** `### Summary:` 소섹션은 Keep a Changelog 공식 헤더가 아니므로 버전 파싱에 충돌 없음.

</specifics>

<deferred>
## Deferred Ideas

- `README.ko.md` 전체 동기화 (영문 README와 내용 불일치 섹션) — v2.5 DOC phase 후보
- Prerequisites 섹션 `node --version` 확인 단계 추가 — SC에 없음, 추후 task
- ROADMAP.md Phase 31 체크박스 완료 처리 → gsd-complete 절차에 위임

</deferred>

---

*Phase: 31-cleanup-docs*
*Context gathered: 2026-05-26 via gsd-discuss-phase*
