# Phase 31: 정리 + 문서 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 31-cleanup-docs
**Areas discussed:** CLAUDE.md 갱신 범위, README Python 언급 처리, CHANGELOG v2.4 항목 구조

**Mode:** Delegated Auto Mode — 사용자가 3개 gray area 전체를 토론 대상으로 명시 지정. AskUserQuestion 도구 활성 여부 불명 — 텍스트 기반 옵션 분석 후 확정 결정으로 잠금. plan-phase 진입 전 사용자 확인 권장 항목 별도 표시.

---

## 사전 분석: Phase 31 실제 잔여 작업 범위

`hooks/*.py` 4개는 quick task 260525-vp6(commit 877a666)에서 **이미 삭제됨**. CLEAN-01(파일 삭제)은 Phase 31 이전에 완료된 상태다. Phase 31의 실질 범위는 **문서 갱신만** 남아 있다:

| 파일 | 상태 | Phase 31 작업 |
|------|------|----------------|
| `hooks/*.py` | 삭제 완료 | 없음 (완료) |
| `CLAUDE.md` | Python 참조 다수 잔존 | **갱신 필요** |
| `README.md` | "Python scripts" 2건 + Roadmap 1건 잔존 | **갱신 필요** |
| `README.ko.md` | 동일 패턴 잔존 가능성 | **확인 후 갱신** |
| `CHANGELOG.md` | v2.4 마일스톤 요약 항목 미작성 | **추가 필요** |

---

## Area 1: CLAUDE.md 갱신 범위

### 배경

현재 CLAUDE.md에는 Python 관련 참조가 7개 위치에 분산되어 있다:

| 위치 | 내용 | 타입 |
|------|------|------|
| L16 (Constraints) | `Bash/Python/Markdown 위주` | Tech stack 서술 |
| L28 (Technology Stack) | `hooks/*.py — Python 3.` | Hooks 항목 전체 |
| L29 | `rule_runner.py` 언급 | |
| L30 | `lessons_ranker.py` 언급 | |
| L106 (Architecture) | `Python 스크립트를 호출해` | Skills 레이어 서술 |
| L110–112 (Architecture) | `stop_hook.py`, `rule_runner.py`, `lessons_ranker.py` 3개 항목 | Hooks 레이어 서술 |
| L118–124 (Architecture 데이터 흐름) | `lessons_ranker.py`, `stop_hook.py`, `rule_runner.py` | 데이터 흐름 다이어그램 |
| L135 (HANDOFF.md 설명) | `stop_hook.py` | |
| L139 (환경 변수) | `__file__` 기반 경로 폴백 | Python-specific 설명 |
| L166–175 (Development Commands) | `python3 hooks/*.py` 4개 커맨드 | Dev 명령 예시 |

### 옵션 분석

| Option | Description | Selected |
|--------|-------------|----------|
| (A) 최소 교체: python3/`.py` 언급만 `.cjs`/`node`로 교체 | grep gate 통과 목표. 문장 흐름 보존. 변경 범위 최소 | |
| (B) 전체 재서술: 관련 섹션을 Node 기반으로 완전히 다시 씀 | 정확도 최대. 변경 라인 수 증가. Phase 31 scope 비대화 위험 | |
| (C) 섹션별 차별 적용: Dev Commands + Technology Stack은 완전 교체, Architecture는 최소 교체 | 실제 독자 임팩트 기준 분류. Dev Commands는 매일 쓰는 참조라 완전 갱신 필수. Architecture는 구조 설명이라 파일명만 교체해도 의미 보존 | ✓ |

**확정 결정 (D-01):** Option C — 섹션별 차별 적용

**세부 규칙:**

1. **Constraints (L16):** `Bash/Python/Markdown` → `Bash/Node.js/Markdown`
2. **Technology Stack — Hooks 항목 (L28–30):** `hooks/*.py — Python 3.` → `hooks/*.cjs — Node.js 18+.` + `rule_runner.py` → `rule_runner.cjs`, `lessons_ranker.py` → `lessons_ranker.cjs`
3. **Architecture — Skills 레이어 (L106):** `Python 스크립트를 호출해` → `Node.js 스크립트(.cjs)를 호출해`
4. **Architecture — Hooks 레이어 (L110–112):** `.py` → `.cjs` 파일명 교체, `Python` → 삭제 또는 `Node.js`로 교체. `__file__` 폴백 설명(L139) → `__dirname` (CommonJS) 기반 경로로 교체
5. **Architecture — 데이터 흐름 (L118–124):** `lessons_ranker.py` → `lessons_ranker.cjs`, `stop_hook.py` → `stop_hook.cjs`, `rule_runner.py` → `rule_runner.cjs`
6. **Development Commands (L166–175):** 4개 `python3 hooks/*.py` 명령을 모두 `node hooks/*.cjs` 기반으로 완전 교체

**HANDOFF.md 설명 내 `stop_hook.py` (L135):** `.cjs`로 교체.

**보존 항목:** `<!-- GSD:*-start/end -->` HTML 주석 태그는 건드리지 않는다.

---

## Area 2: README Python 언급 처리

### 배경

README.md에 Python 언급이 3개 위치에 존재한다:

| 위치 | 내용 | 타입 |
|------|------|------|
| L201 (Codex 설치 섹션) | `The hooks/ directory contains the Python scripts that the hooks invoke` | 설치 안내 |
| L216 (Gemini 설치 섹션) | `The hooks/ directory contains the Python scripts that the hooks invoke` | 설치 안내 |
| L255 (Roadmap — Phase 15 항목) | `fixes hooks/*.py path fallback so hooks run without CLAUDE_PLUGIN_ROOT` | 과거 Roadmap 기술 |

### 옵션 분석

**L201 / L216 — 설치 안내 문장:**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) "Python scripts" → "Node.js scripts" 교체 | 정확. 1:1 대치. | ✓ |
| (b) 문장 전체 삭제 | 설치 경고(누락 시 silent fail)가 사라짐 — 독자에게 불리 | |
| (c) 문장 유지 | 사실 오류 방치 | |

**L255 — Roadmap 과거 항목 "Phase 15 — Python Fix":**

| Option | Description | Selected |
|--------|-------------|----------|
| (a) 텍스트 그대로 보존 | CHANGELOG의 "CHANGELOG 과거 항목은 보존" 방침과 일관. Roadmap 과거 기록은 역사 기록이므로 수정 불필요 | ✓ |
| (b) 기술 내용 교체 ("Python Fix" → 삭제) | shipped 항목 소급 변경. 이력 훼손 | |
| (c) 항목 전체 삭제 | Phase 15 존재 자체를 지우는 것 — 의도 외 소급 변경 | |

**확정 결정 (D-02):**
- L201, L216: `Python scripts` → `Node.js scripts (CommonJS .cjs)` 교체
- L255 (Roadmap 과거 항목): **수정 없음 — 역사 기록 보존**

**README.ko.md 처리:**
README.ko.md에 동일 패턴이 존재할 경우 같은 규칙을 적용한다. execute 시작 전 `grep -n "Python" README.ko.md`로 확인 후 처리.

---

## Area 3: CHANGELOG v2.4 항목 구조

### 배경

ROADMAP.md Phase 31 Success Criterion #5:
> "CHANGELOG.md에 v2.4 마일스톤 항목이 추가되어 4개 `.cjs` 신규 작성, 3개 hook config 교체, Skill/Agent 일괄 교체, Python 파일 삭제를 요약한다"

그러나 v2.4 작업 일부는 이미 개별 버전 항목에 기록되어 있다:
- `[0.0.37]`: `hooks/*.py` 삭제 (CLEAN-01 실제 완료)
- `[0.0.36]`: hookify 제거 및 `.cjs` 정리
- 이전 버전들에 Phase 28–30 개별 커밋 기록들 산재

### 옵션 분석

| Option | Description | Selected |
|--------|-------------|----------|
| (A) 각 Phase별 신규 버전 항목(0.0.38, 0.0.39…) | Phase 31 완료 = 0.0.38로 배포. 개별 커밋 이력과 완전 일치 | |
| (B) v2.4 마일스톤 요약을 별도 섹션으로 추가 (버전 번호 없이) | 번호 충돌 없음. 마일스톤 단위 집계 가독성 | |
| (C) Phase 31 완료 버전(0.0.38)에 v2.4 마일스톤 요약 포함 | CHANGELOG 관행과 일치(단일 버전 entry에 변경 집약). 배포 트리거와 자연스럽게 연결 | ✓ |
| (D) Phase 31 DOC 항목만 0.0.38에 추가, v2.4 요약 없음 | Success Criterion #5 미충족 | |

**확정 결정 (D-03):** Option C — Phase 31 완료 버전(다음 배포 버전)에 v2.4 마일스톤 요약 항목 포함

**항목 구조 결정 (D-04):**

```markdown
## [0.0.38] - 2026-05-26

### Changed (v2.4 Hooks Node Migration — milestone complete)

- CLAUDE.md: Hooks 레이어 서술을 `hooks/*.cjs` / Node.js 18+ 기준으로 전면 갱신, Development Commands 예시 4개를 `node hooks/*.cjs` 기반으로 교체
- README.md / README.ko.md: Codex·Gemini 설치 섹션의 "Python scripts" → "Node.js scripts (CommonJS .cjs)" 교체, Prerequisites에서 Python 요구사항 제거 (해당하는 경우)

### Summary: v2.4 Hooks Node Migration (Phases 28–31)

- Phase 28: `hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 신규 작성 (Node 18+, 외부 의존성 0)
- Phase 29: `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` — `python3` → `node` 호출 전환
- Phase 30: `skills/sg-{plan,execute,complete,quick,ui-plan}/SKILL.md` + `.agents/skills/sg-{ship,plan,execute}/SKILL.md` 8개 파일의 `python3` → `node` 일괄 교체
- Phase 31 / 260525-vp6: `hooks/{stop_hook,rule_runner,transcript_matcher,lessons_ranker}.py` 삭제 + CLAUDE.md / README 문서 Node 기반 갱신
```

**포함 여부 결정 (D-05):**

| 항목 | 포함 | 이유 |
|------|------|------|
| 4 .cjs 신규 작성 요약 | ✓ | SC#5 명시 |
| 3 hook config 교체 요약 | ✓ | SC#5 명시 |
| Skill/Agent 일괄 교체 요약 | ✓ | SC#5 명시 |
| Python 파일 삭제 요약 | ✓ | SC#5 명시 (0.0.37에 세부 기록 있으나 요약 재언급 허용) |
| 각 Phase별 상세 커밋 내역 | ✗ | 기존 개별 항목에 이미 존재 — 중복 제거 |

**v2.4 Summary 위치:** `### Changed` 항목 바로 아래 `### Summary:` 소섹션으로 배치. Keep a Changelog 공식 헤더(Added/Changed/Removed 등)가 아닌 서술형 소섹션이므로 버전 파싱에 충돌 없음.

---

## 최종 결정 요약

| ID | Area | 결정 | Override 시나리오 |
|----|------|------|-------------------|
| D-01 | CLAUDE.md 갱신 범위 | 섹션별 차별 적용: Dev Commands + Technology Stack 완전 교체, Architecture는 파일명/런타임만 교체 | 사용자가 Architecture 전체 재서술을 원하면 Option B로 전환 |
| D-02 | README Python 언급 | L201/L216 `Python scripts` → `Node.js scripts (CommonJS .cjs)`, L255 Roadmap 과거 항목 보존 | 사용자가 Roadmap 과거 항목도 수정 원하면 교체 가능 |
| D-03 | CHANGELOG 항목 위치 | Phase 31 배포 버전(0.0.38)에 포함 | 마일스톤 요약을 별도 섹션으로 원하면 Option B |
| D-04 | CHANGELOG 항목 구조 | v2.4 Summary 소섹션 포함, Phase 28–31 요약 4줄 | 상세 항목 원하면 Phase별 개별 bullet 확장 |
| D-05 | CHANGELOG 중복 처리 | 0.0.37 세부 기록 보존, 0.0.38에 요약만 재언급 | |

---

## Claude's Discretion

다음 항목은 명시적 사용자 결정 없이 잠정 채택. plan-phase 또는 execute에서 사용자가 다른 선택을 하면 즉시 교체:

| Decision | 잠정 채택 | 사용자 override 시나리오 |
|----------|----------|------------------------|
| D-01 Architecture 교체 수준 | 파일명/런타임만 교체 (최소) | 전체 재서술 원하면 Option B로 전환 |
| D-02 Roadmap 과거 항목 | 보존 | "모든 Python 언급 제거" 원하면 교체 가능 |
| D-04 CHANGELOG Summary 형식 | 소섹션 (`### Summary:`) 형식 | 불릿 포인트만으로도 충분하다면 단순화 가능 |

---

## Deferred Ideas

- **`README.ko.md` 전체 동기화** — Python 관련 교체 이상의 내용(영문 README와 내용 불일치 섹션)은 Phase 31 범위 외. 마일스톤 이후 별도 task 권장.
- **Prerequisites 섹션 Node.js 18+ 명시** — README에 `node --version` 확인 단계 추가는 현재 SC에 없음. v2.5 DOC phase 후보.
- **ROADMAP.md Phase 31 체크박스 완료 처리** — ROADMAP.md `[ ] Phase 31` → `[x]` 및 진행 테이블 갱신은 gsd-complete 절차에 위임. Phase 31 plan에 포함하지 않음.

---

## Discussion Flow Summary

1. **load_prior_context**: ROADMAP.md Phase 31 SC, STATE.md, HANDOFF.md, 30-DISCUSSION-LOG.md, CHANGELOG.md, CLAUDE.md, README.md 로드.
2. **scout_state**: `hooks/*.py` 가 260525-vp6에서 이미 삭제됨 확인. Phase 31 실질 범위 = 문서 갱신만.
3. **analyze_gray_areas**: 3개 area 전체 옵션 트리 분석. CHANGELOG 과거 항목 보존 방침(0.0.36 항목에 명시) 확인. Roadmap 역사 기록 보존 원칙 적용.
4. **decide**: D-01~D-05 확정. README.ko.md 동일 규칙 적용 조건부 결정.
5. **write_log**: 31-DISCUSSION-LOG.md 생성.
