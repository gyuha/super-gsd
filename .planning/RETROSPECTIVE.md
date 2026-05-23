# Project Retrospective: super-gsd

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-16  
**Phases:** 5 | **Plans:** 11 | **Timeline:** 2일 (2026-05-15 → 2026-05-16)

### What Was Built

- `plugin.json` + `marketplace.json` 포함 설치 가능한 Claude Code 플러그인 구조
- `sg-execute` / `sg-status` 수동 인계 명령 + `HANDOFF.md` 5컬럼 스키마
- 9개 sg- 명령 세트 (start→explore→plan→execute→status→review→learn→ship→lessons)
- Stop/SubagentStop 훅 기반 단계 전환 자동 안내 (transcript 신호 감지)
- Hookify 회고 출력 자동 저장 → 다음 plan-phase 재주입 (lessons 피드백 루프)

### What Worked

- **수직 슬라이스 방식**: 각 Phase가 사용자에게 즉시 유용한 완결된 행동을 제공 — 중간 단계에서도 동작하는 플러그인 유지
- **비침투적 구현**: GSD/Superpowers/Hookify를 fork하지 않아 upstream 변경에 무관
- **append-only HANDOFF.md**: 상태 추적이 단순하고 idempotent — 중복 실행 안전
- **transcript 기반 신호 감지**: `transcript_matcher.py`의 정규식 체인이 세 도구 구분을 정확히 처리

### What Was Inefficient

- **HOOK-02 기술 제약 발견이 늦었음**: hooks가 slash command를 직접 invoke할 수 없다는 사실을 Phase 4 실행 중에야 확인 → 초기 ROADMAP 요구사항이 과도하게 낙관적이었음
- **Quick task SUMMARY.md 누락**: 3개 quick task가 SUMMARY.md 없이 완료 처리 → audit에서 missing으로 표시됨
- **stopped_at 자동 갱신 미구현**: STATE.md stopped_at이 마지막 plan 완료를 자동으로 반영하지 않음

### Patterns Established

- **sg- prefix 명명 규칙**: 이 플러그인의 모든 명령은 `sg-` prefix 사용 (타 플러그인 충돌 방지)
- **XML 4-section command 구조**: `objective / execution_context / process / success_criteria`
- **Skill 위임 단일 패턴**: 명령이 직접 구현하지 않고 GSD/Superpowers Skill을 위임
- **Phase 번호 기반 lessons 파일명**: `{NN}-{YYYY-MM-DD}.md` — 정렬 가능, idempotent

### Key Lessons

1. **hooks API 제약은 설계 전에 확인**: `systemMessage`만 가능, slash command invoke 불가 → ROADMAP 작성 전에 Claude Code hooks 공식 문서 확인 필요
2. **Quick task는 SUMMARY.md까지 완성해야 "완료"**: STATE.md 기록만으로는 gsd-sdk audit-open에서 missing으로 집계됨
3. **비침투적 orchestrator는 장기적으로 옳다**: upstream 4개 플러그인이 업데이트되어도 super-gsd는 영향 없음

### Cost Observations

- 전체 91 커밋, 74 파일, 10,102 lines 추가
- Sessions: 2일 집중 작업
- Notable: Phase 1-2는 scaffold 위주로 빠름 (~5-10min/plan); Phase 3는 명령 4개 + 문서로 가장 큰 단위

---

## Milestone: v2.0 — Commands → Skills 마이그레이션

**Shipped:** 2026-05-23
**Phases:** 2 (22-23) | **Plans:** 6 | **Timeline:** 2일 (2026-05-22 → 2026-05-23)

### What Was Built

- 14개 sg-* SKILL.md — commands/*.md를 skills/sg-*/SKILL.md 형식으로 완전 이전
- plugin.json commands 키 제거 + commands/ 디렉토리 git rm 삭제 — skills/가 단일 소스
- CLAUDE.md + README.md/ko.md skills/ 기준 재서술
- Phase 22 코드 리뷰 → auto-fix: Critical 3개, Warning 7개 버그 사전 차단

### What Worked

- **완전 복사(exact copy) 전략**: content 변경 없이 frontmatter + 블록 전체 복사 — 14개 파일 모두 로직 손실 없이 검증 통과
- **gsd-code-review --fix 자동화**: Phase 22 완료 후 코드 리뷰 + auto-fix 사이클이 7개 버그를 자동 수정 — 수동 검토 없이 실용적 품질 보증
- **구조적 분리 (Phase 22/23)**: "파일 생성"과 "플러그인 전환"을 분리해 Phase 22가 완전 reversible — 23이 실패해도 22는 온전

### What Was Inefficient

- **"이미 완료된 작업" 패턴 반복**: Phase 22, 23 모두 실제 코드 작업이 플랜보다 먼저 완료되어 SUMMARY.md 수동 작성 필요 — plan-first 원칙이 아직 체화 안 됨
- **플랜 체커 3개 BLOCKER**: 이미 완료된 작업에 맞게 플랜이 업데이트되지 않아 plan checker가 BLOCKER를 발견 — 작업 완료 후 플랜 갱신 필요
- **RESEARCH.md RESOLVED 마커 누락**: plan checker가 감지했으나 실제 기능에는 영향 없었음 — 관리 오버헤드

### Patterns Established

- **SKILL.md 구조**: YAML frontmatter(name, description, argument-hint) + `<objective>` / `<process>` / `<success_criteria>` 블록 — 표준 슬래시 명령 구조로 확정
- **코드 리뷰 → auto-fix 사이클**: Phase 실행 후 gsd-code-review 22 --fix 패턴 — 다음 마일스톤부터 표준 절차로 통합

### Key Lessons

1. **플랜 완료 후 즉시 SUMMARY.md 작성**: 세션이 끊기기 전에 작성해야 다음 세션에서 "이미 완료" 재확인이 불필요
2. **gsd-code-review --fix는 Phase 실행 직후 실행**: 버그가 신선할 때 수정이 빠름, 다음 Phase 진입 전에 완료
3. **plan-first 원칙**: 코드 작업이 먼저 되더라도 PLAN.md는 그 작업을 반영한 "검증" 플랜으로 즉시 업데이트해야 함

### Cost Observations

- 6 plans, 17 commits, 26 files modified, +1098 lines
- Sessions: 2일 (v1.5 직후 연속 작업)
- Notable: Phase 22 코드 리뷰가 가장 높은 ROI — 7개 버그를 7개 원자적 커밋으로 자동 수정

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP | 5 | 11 | 최초 릴리스 — 기준선 확립 |
| v1.1 Reliability | 3 | 3 | sg-health 진단 + 상태 정확도 개선 |
| v1.2 Self-Contained | 5 | 5 | sg-retro 내장 + rule runner + hookify 의존성 제거 |
| v1.5 Visual Companion | 2 | 3 | sg-ui-plan + sg-plan Visual Companion 분기 |
| v2.0 Commands→Skills | 2 | 6 | commands/ → skills/ 마이그레이션 완료 |

### Top Lessons (Verified Across Milestones)

1. `hooks API 제약 선행 확인` — Claude Code hooks는 systemMessage만 지원, skill invoke 불가
2. `sg- prefix 명명 일관성` — 모든 명령에 sg- prefix 유지로 타 플러그인과 충돌 없음
3. `plan-first 원칙` — 코드 작업 먼저 하더라도 PLAN.md는 즉시 현재 상태 반영하여 갱신
4. `Phase 완료 후 코드 리뷰 표준화` — gsd-code-review --fix 사이클을 Phase 표준 절차로 통합
