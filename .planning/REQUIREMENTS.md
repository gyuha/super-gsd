# Requirements — v2.10 Plan-Phase Ambiguity Grilling

**Milestone goal:** `sg-plan`이 discuss subagent를 호출하기 전, 메인 컨텍스트에서 grill-me 원칙으로 사용자를 모호함이 해소될 때까지 질문하여 계획 입력의 불확실성을 제거한다.

**참고:** mattpocock grill-me skill — "합의된 이해에 도달할 때까지 집요하게 인터뷰, 설계 트리 분기를 따라 의존성을 하나씩 해소, 질문마다 권장 답변 제시, 한 번에 하나씩, 코드베이스로 답할 수 있으면 묻지 말고 탐색."

## v2.10 Requirements

### Grilling (GRILL)

- [ ] **GRILL-01**: sg-plan이 discuss 호출 전 메인 컨텍스트에서 한 번에 하나씩 질문하는 grill 단계를 수행한다 (질문 수 무제한)
- [ ] **GRILL-02**: 각 질문마다 Claude가 권장 답변을 함께 제시한다
- [ ] **GRILL-03**: 코드베이스 탐색으로 답할 수 있는 질문은 사용자에게 묻지 않고 직접 탐색해 해소한다
- [ ] **GRILL-04**: 설계 트리 분기를 따라 의존성을 순차적으로 해소한다 (이전 답이 다음 질문을 좌우)
- [ ] **GRILL-05**: Claude가 모호함이 해소됐다고 판단하면 합의 요약을 제시하고, 사용자가 '확정' 또는 '추가 질문'으로 종료를 최종 결정한다
- [ ] **GRILL-06**: grill 합의 결과(결정·제약)가 gsd-discuss-phase / CONTEXT 입력으로 전달되어 후속 plan에 반영된다

## Future Requirements

(없음 — 단일 마일스톤 범위)

## Out of Scope

- **gsd-discuss-phase 자체 수정** — Non-invasive 제약. grilling은 sg-plan 메인 컨텍스트의 선행 단계로만 구현하고 GSD 스킬은 건드리지 않는다
- **독립 sg-grill 명령 신설** — 이번 마일스톤은 sg-plan 내부 단계로 한정 (재사용 분리는 차후 검토)
- **Claude 자율 종료(사용자 확인 없음)** — 종료는 항상 사용자 확인 게이트를 거친다 (오판 방지)

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| GRILL-01 | 45 | pending |
| GRILL-02 | 45 | pending |
| GRILL-03 | 45 | pending |
| GRILL-04 | 45 | pending |
| GRILL-05 | 45 | pending |
| GRILL-06 | 45 | pending |
