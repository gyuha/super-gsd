# Requirements: super-gsd v2.1

**Milestone:** v2.1 Skills 품질 검토 및 개선  
**Goal:** skill-creator 기준으로 17개 SKILL.md 파일의 구조·완성도·정확성을 검토하고 발견된 문제를 수정한다.

---

## Active Requirements

### Skills 품질 검토

- [x] **QUAL-01**: 17개 SKILL.md 파일 각각의 YAML frontmatter에 필수 필드(`name`, `description`)가 존재한다
- [x] **QUAL-02**: 각 `description` 필드가 "언제 사용해야 하는지"와 "무엇을 하는지"를 명확히 기술한다 (skill-creator 트리거링 기준)
- [x] **QUAL-03**: 모든 스킬에 `<objective>`, `<process>`, `<success_criteria>` 블록이 존재하고 내용이 완전하다
- [x] **QUAL-04**: `<process>` 단계가 실행 가능하고 명확하며, Bash 스니펫이 macOS/Linux 호환성을 준수한다
- [x] **QUAL-05**: 스킬 간 cross-reference(`Skill()` 호출, `Agent()` 호출)가 유효한 skill 이름을 가리킨다
- [x] **QUAL-06**: 발견된 모든 문제점이 수정되고 재검증된다

---

## Future Requirements

- skill-creator 평가 루프(테스트 케이스 + eval viewer) 적용 — 이번 마일스톤에서는 구조 검토에 집중
- description 최적화 스크립트(`run_loop.py`) 실행 — 충분한 테스트 환경 구축 후 적용

---

## Out of Scope

- 새 스킬 추가 — 기존 17개 검토·개선에 집중
- gsd-sdk, Superpowers, GSD 내부 파일 수정 — non-invasive 원칙
- skill-creator의 완전한 eval 루프(서브에이전트 병렬 실행, 브라우저 뷰어) — 검토·수정 범위만

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| QUAL-01 | 24 | — |
| QUAL-02 | 24 | — |
| QUAL-03 | 24 | — |
| QUAL-04 | 24 | — |
| QUAL-05 | 24 | — |
| QUAL-06 | 25 | — |
