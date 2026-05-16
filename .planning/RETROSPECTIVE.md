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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP | 5 | 11 | 최초 릴리스 — 기준선 확립 |

### Top Lessons (Verified Across Milestones)

1. `hooks API 제약 선행 확인` — Claude Code hooks는 systemMessage만 지원, skill invoke 불가
2. `sg- prefix 명명 일관성` — 모든 명령에 sg- prefix 유지로 타 플러그인과 충돌 없음
