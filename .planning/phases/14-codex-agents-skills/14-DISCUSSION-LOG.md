# Phase 14: Codex 진입점 + .agents/skills/ - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 14-codex-agents-skills
**Areas discussed:** A. AGENTS.md 콘텐츠 구조, B. sg-retro 폴백 전략, C. 5개 래퍼 스킬 구현 깊이, D. 디렉토리 Layout

---

## A. AGENTS.md 콘텐츠 구조

| 옵션 | 설명 | 선택 |
|------|------|------|
| GSD 마커 섹션 전부 교체 (완전 재작성) | GSD 마커 제거, Codex 전용 최적화, 8 KiB 이하 유지 | ✓ |
| 상단에 Codex 섹션만 추가 (하이브리드) | GSD 마커 유지, 재생성 충격 최소화 | |
| 기존 파일 구조 유지 + 수정 | 변경 최소화 | |

**User's choice:** 권고안 수용 — 완전 재작성
**Notes:** 사용자가 A~D 전체 논의를 요청하며 각 권고안을 수용. GSD 마커 제거 및 Codex 어휘 기준 재작성 결정. 섹션 구조(Project → Quick Start → 제약 → 스킬 목록 → 워크플로우 단계)도 확정.

---

## B. sg-retro 폴백 전략 (AskUserQuestion 제거 후)

| 옵션 | 설명 | 선택 |
|------|------|------|
| numbered list + 자유 입력 대기 | AskUserQuestion과 유사한 UX, 복수 렌즈 지원 | ✓ |
| 기본 렌즈(SSC) 하드코딩 | 가장 단순, 사용자 선택 불가 | |
| argument 필수화 (없으면 에러) | 명확한 계약, 진입장벽 높음 | |

**User's choice:** 권고안 수용 — numbered list + argument 우선
**Notes:** multiSelect(복수 렌즈: "1 3" 또는 "ssc dspm") 지원 포함. 기존 `skills/sg-retro/SKILL.md`는 수정하지 않고 `.agents/skills/sg-retro/SKILL.md`를 별도 신규 생성.

---

## C. 5개 래퍼 스킬 구현 깊이

| 옵션 | 설명 | 선택 |
|------|------|------|
| GSD 위임 우선 + prose 폴백 + 플랫폼 경고 | 유연, GSD 필수 의존성과 일관성 | ✓ |
| platform-agnostic prose만 (GSD 위임 없음) | GSD 독립, drift 위험 | |
| thin wrapper (GSD 위임만) | 단순, GSD 미설치 시 동작 안 함 | |

**User's choice:** 권고안 수용 — GSD 위임 우선 + prose 폴백
**Notes:**
- sg-execute: Superpowers 불가 → PLAN.md 읽고 prose 직접 실행
- sg-review: Superpowers 불가 → 코드 리뷰 prose 직접 수행
- sg-status: 완전 독립 구현 (HANDOFF.md + STATE.md 파싱)
- 5개 스킬 모두 constraints 블록 포함 (SubagentStop/Superpowers/AskUserQuestion 미지원)

---

## D. 디렉토리 Layout

| 옵션 | 설명 | 선택 |
|------|------|------|
| `.agents/skills/`만 생성 | REQUIREMENTS.md 스펙 준수, 최소 변경 | ✓ |
| `.agents/skills/` + `.codex/skills/` 심볼릭 링크 | 두 경로 동시 지원, 환경 호환성 이슈 | |
| `.agents/skills/` + `.codex/skills/` 별도 생성 | 완전 지원, 관리 부담 증가 | |

**User's choice:** 권고안 수용 — `.agents/skills/`만 생성
**Notes:** `.codex/skills/` 필요성은 Phase 15 리서치 시 확인 후 결정. Phase 14는 6개 SKILL.md만 생성(sg-retro, sg-start, sg-plan, sg-execute, sg-review, sg-status).

---

## Claude's Discretion

- AGENTS.md 내 각 스킬 설명 텍스트 (이름 + 한 줄 설명 수준에서 세부 워딩)
- 5개 래퍼 스킬의 prose 폴백 지침 상세 내용
- numbered list 렌즈 선택 프롬프트 한국어/영어 비율

## Deferred Ideas

- `.codex/skills/` 별도 경로 — Phase 15 리서치 후 판단
- 13개 sg-* 전체 `.agents/skills/` 포팅 — REQUIREMENTS.md v1.4+ Future Requirements
- `.agents/skills/sg-health/SKILL.md` Codex 변형 — v1.4+
- AGENTS.md GSD 재생성 충돌 방지 메커니즘 문서화 — Phase 16 README 작업 시 처리 가능
