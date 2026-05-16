# Phase 2: Manual Handoff & Status - Discussion Log

> **감사 추적 전용.** planning/research/execute 에이전트 입력으로 쓰지 말 것.
> 결정은 CONTEXT.md에 캡처되어 있다 — 이 로그는 검토된 대안을 보존한다.

**Date:** 2026-05-15
**Phase:** 2-Manual Handoff & Status
**Areas discussed:** 명령 디렉토리 구조 & 등록 방식, `to-superpowers` 동작 형태, HANDOFF.md 스키마 & 멱등성 키, `status` stage detection & 다음 명령 매핑

---

## 명령 디렉토리 구조 & 등록 방식

### Q1 — 명령 경로

| Option | Description | Selected |
|--------|-------------|----------|
| Flat: `commands/{name}.md` + plugin.json name prefix | 단순, Claude Code 기본 패턴 | ✓ |
| Nested: `commands/super-gsd/{name}.md` | 이중 prefix 위험 | |
| plugin.json `commands` 배열 명시 등록 | drift 위험 | |

**User's choice:** Flat 구조

### Q2 — Frontmatter 메타

| Option | Description | Selected |
|--------|-------------|----------|
| name + description + argument-hint | 표준 세트 | ✓ |
| + allowed-tools 명시 | 두 명령 모두 모든 도구 필요해 차이 적음 | |
| 최소: name + description | argument-hint 손실 | |

**User's choice:** 표준 세트

### Q3 — 본문 스타일

| Option | Description | Selected |
|--------|-------------|----------|
| GSD 구조 모방 (XML 섹션) | GSD/Superpowers/Hookify 일관 | ✓ |
| 자체 단순 markdown | 본문 짧아짐, 관례 깨짐 | |
| 하이브리드 (objective+process만 XML) | 일관성 약함 | |

**User's choice:** GSD XML 섹션

---

## `to-superpowers` 동작 형태

### Q1 — 결과 형태

| Option | Description | Selected |
|--------|-------------|----------|
| 프롬프트 출력 + Skill 자동 invoke (하이브리드) | 디버깅·자동화 둘 다 | ✓ |
| Skill 자동 invoke만 | 출력 깔끔, 프롬프트 비가시 | |
| 프롬프트만 출력 (수동 붙여넣기) | auto-orchestrator 정체성 약함 | |

**User's choice:** 하이브리드

### Q2 — 호출 Skill

| Option | Description | Selected |
|--------|-------------|----------|
| `superpowers:executing-plans` 고정 | review checkpoint 일치 | ✓ |
| `superpowers:subagent-driven-development` 고정 | GSD execute와 중복 | |
| 인자 선택, 기본 executing-plans | YAGNI 위험 | |

**User's choice:** executing-plans 고정

### Q3 — 프롬프트 내용

| Option | Description | Selected |
|--------|-------------|----------|
| 표준: phase meta + goal + SC + REQ + PLAN.md 전문 인라인 | single prompt, 외부 의존 0 | ✓ |
| 압축: 파일 경로만, Superpowers가 읽음 | single prompt 정체성 약함 | |
| 표준 + CONTEXT.md decisions | 중복 가능성 | |

**User's choice:** 표준 (PLAN.md 인라인 포함)

---

## HANDOFF.md 스키마 & 멱등성 키

### Q1 — 파일 포맷

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown table | 시각·파싱 모두 단순 | ✓ |
| Markdown list (시간순 섹션) | 파싱 약간 복잡 | |
| Frontmatter + table 하이브리드 | v1엔 과존 | |

**User's choice:** Markdown table

### Q2 — 열·멱등성

| Option | Description | Selected |
|--------|-------------|----------|
| 5열 (Timestamp/Phase/From/To/Plan Hash), 멱등성 (phase, to) | 완전 추적성 + plan 변경 시 재인계 | ✓ |
| 4열 (Plan Hash 없음), 멱등성 (phase, to) | 재인계 수단 없음 | |
| 4열, 멱등성 = phase 단독 | 정보 손실 | |

**User's choice:** 5열, (phase, to) 멱등성

### Q3 — Stage enum

| Option | Description | Selected |
|--------|-------------|----------|
| ROADMAP 명시 + 도구 이름: init/gsd-plan/superpowers/review/hookify | 명령 추론에 명확 | ✓ |
| ROADMAP 어휘 그대로: plan/execute/review/hookify | "execute"가 GSD execute와 충돌 가능 | |
| 세분화: gsd-discuss/gsd-plan/gsd-execute/superpowers/review/hookify | GSD 내부 세분 과잉 | |

**User's choice:** init/gsd-plan/superpowers/review/hookify

### Q4 — Timestamp · 초기화

| Option | Description | Selected |
|--------|-------------|----------|
| ISO 8601 UTC, 초기 파일은 헤더 + 빈 table | 단순·정렬 가능 | ✓ |
| ISO + init row 포함 초기화 | 멱등성 처리 복잡 | |
| Human + ISO 두 열 | 열 6개로 늘어남 | |

**User's choice:** ISO UTC, 빈 table 초기화

---

## `status` stage detection & 다음 명령 매핑

### Q1 — Stage 판정

| Option | Description | Selected |
|--------|-------------|----------|
| HANDOFF.md 마지막 row의 `to` | super-gsd가 절대 권한 | ✓ |
| STATE.md + HANDOFF.md 교차 검증 | 과존 | |
| STATE.md 단독 | 어휘 매핑 레이어 필요 | |

**User's choice:** HANDOFF.md 마지막 row

### Q2 — Stage → 명령 매핑

| Option | Description | Selected |
|--------|-------------|----------|
| init→/gsd:plan-phase, gsd-plan→/super-gsd:to-superpowers, superpowers→/hookify, review→/hookify, hookify→/gsd:discuss-phase {next} | CLAUDE.md §회고 일치 | ✓ |
| review stage 제거 (superpowers→hookify, hookify→next) | review가 SC4에 명시되어 있어 보존 | |
| YAML 외부 추출 | YAGNI | |

**User's choice:** 5-stage 선형 매핑

### Q3 — 출력 양식

| Option | Description | Selected |
|--------|-------------|----------|
| 3줄 요약 + 1줄 다음 명령 | 명령 자주 쓰이는 surface, 압축 우선 | ✓ |
| 마크다운 표 | 5필드 세로 — 장원 | |
| JSON + human 둘 다 (--json) | v1에 과잉 | |

**User's choice:** 3줄 + 1줄

---

## Claude's Discretion

- 슬래시 명령 본문 안의 정확한 Bash 명령 시퀀스 (PLAN.md 발견 패턴, sha256 계산 방식)
- D-21 프롬프트의 인라인 PLAN.md 구분자 스타일
- 명령이 출력하는 사용자 메시지 톤(D-30 영문 유지)
- 초기 HANDOFF.md 헤더 위 짧은 설명 줄 여부

## Deferred Ideas

- `subagent-driven-development` 옵션 — v2
- `/super-gsd:status --json` — v2
- HANDOFF.md frontmatter (schema_version) — 현재는 본문 주석 1줄로 대체
- `/super-gsd:status --watch` — v2+
- 외부 Linear/Jira 핸드오프 — Out of Scope (PROJECT.md)
