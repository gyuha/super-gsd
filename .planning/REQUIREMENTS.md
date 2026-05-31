# Requirements: super-gsd

**Defined:** 2026-05-31
**Core Value:** GSD → Superpowers → sg-retro 단계 전환을 자동화하여 학습 루프가 끊기지 않도록 한다
**Milestone:** v2.11 use-tdd Workflow Mode

## v2.11 Requirements

`.planning/USE-TDD` 마커로 켜지는 opt-in TDD 워크플로우. 마커가 없으면 모든 기존 동작은 변하지 않는다(비침투).

### TDD Toggle (TDD)

- [ ] **TDD-01**: 사용자가 `/super-gsd:sg-use-tdd`를 실행해 TDD 모드를 토글할 수 있다 — `.planning/USE-TDD` 마커 파일을 생성/삭제하며, 같은 상태로 여러 번 호출해도 안전하다(idempotent)
- [ ] **TDD-02**: 사용자가 `sg-use-tdd on` / `sg-use-tdd off`로 상태를 명시 지정할 수 있고, 인자 없이 호출하면 현재 상태(on/off)를 표시한 뒤 토글한다
- [ ] **TDD-03**: Codex/Gemini 사용자가 `$sg-use-tdd`로 동일 토글을 실행할 수 있다 — `.agents/skills/sg-use-tdd/SKILL.md` 미러 제공

### Execute Integration (EXEC)

- [ ] **EXEC-01**: `.planning/USE-TDD` 마커가 존재하면 `sg-execute`가 Superpowers 핸드오프 프롬프트에 `superpowers:test-driven-development` 스킬 사용 + 구현 전 실패 테스트(Red) 우선 작성 지시를 주입한다
- [ ] **EXEC-02**: 마커가 없으면 `sg-execute`는 기존과 완전히 동일하게 동작한다(TDD 주입 없음) — opt-in, 비침투
- [ ] **EXEC-03**: `.agents/skills/sg-execute/SKILL.md` 미러도 동일한 TDD 주입 동작을 반영한다(pairwise sync)

### Review Loop (REVIEW)

- [ ] **REVIEW-01**: TDD 모드일 때 `sg-review`가 코드 리뷰에 테스트 통과 여부를 검증하도록 지시하고, 명확한 PASS/FAIL 신호를 표면화한다
- [ ] **REVIEW-02**: 테스트가 FAIL이면 `sg-review`가 사용자에게 "`sg-execute`로 수정·재작성할까요?"를 확인(AskUserQuestion)하고, 승인 시 `sg-execute`를 재호출한다
- [ ] **REVIEW-03**: `sg-review`는 자동 재실행을 제한된 횟수(예: 2회)로 묶고, 한도 초과 시 무한 루프 대신 사용자에게 보고하고 중단한다
- [ ] **REVIEW-04**: `.agents/skills/sg-review/SKILL.md` 미러도 동일한 실패 루프 동작을 반영한다(AskUserQuestion 미지원 플랫폼은 프로즈 폴백)

### Documentation (DOC)

- [ ] **DOC-01**: README.md의 Workflow 섹션과 Commands 표에 TDD 모드와 `sg-use-tdd` 명령을 문서화한다
- [ ] **DOC-02**: README.ko.md가 README.md의 TDD 문서를 동일하게 반영한다

## Future Requirements

향후 릴리스로 이연. 추적하되 현재 로드맵에는 미포함.

| ID | Requirement | Reason deferred |
|----|-------------|-----------------|
| TDD-F1 | TDD 모드일 때 sg-plan이 PLAN.md에 테스트 시나리오 섹션을 자동 생성 | v2.11은 execute/review 통합에 집중 — plan 단계 확장은 후속 |
| REVIEW-F1 | 프로젝트별 테스트 러너 자동 감지(jest/pytest/go test 등) | 비침투 원칙상 v2.11은 코드 리뷰 신호에 위임 — 자동 감지는 별도 검토 |

## Out of Scope

명시적 제외. 스코프 크리프 방지를 위해 문서화.

| Feature | Reason |
|---------|--------|
| Superpowers `test-driven-development` 스킬 내부 수정 | 비침투 orchestrator 원칙 — 기존 스킬을 재사용만 한다 |
| super-gsd가 직접 테스트를 실행하는 러너 내장 | 호스트 Superpowers/Claude 세션이 테스트 실행을 담당, super-gsd는 지시·신호 해석만 |
| TDD 모드 기본 ON | opt-in 원칙 — 마커가 없으면 기존 워크플로우를 강제 변경하지 않는다 |
| 마커를 git에 커밋 | `.planning/`은 `.gitignore` 대상 — USE-TDD는 로컬 작업자 상태 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TDD-01 | Phase 46 | Pending |
| TDD-02 | Phase 46 | Pending |
| TDD-03 | Phase 46 | Pending |
| EXEC-01 | Phase 47 | Pending |
| EXEC-02 | Phase 47 | Pending |
| EXEC-03 | Phase 47 | Pending |
| REVIEW-01 | Phase 47 | Pending |
| REVIEW-02 | Phase 47 | Pending |
| REVIEW-03 | Phase 47 | Pending |
| REVIEW-04 | Phase 47 | Pending |
| DOC-01 | Phase 48 | Pending |
| DOC-02 | Phase 48 | Pending |
