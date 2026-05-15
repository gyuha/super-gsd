# Requirements: super-gsd

**Defined:** 2026-05-15
**Core Value:** GSD → Superpowers → Hookify 단계 전환을 자동화하여 학습 루프가 끊기지 않도록 한다

## v1 Requirements

### Plugin Scaffold (PLUGIN)

- [x] **PLUGIN-01**: `.claude-plugin/plugin.json` 매니페스트를 포함한 Claude Code 플러그인 구조를 만든다
- [x] **PLUGIN-02**: 플러그인 README가 설치 방법, 의존성(GSD/Superpowers/Hookify), 워크플로우 다이어그램을 설명한다
- [x] **PLUGIN-03**: 플러그인이 marketplace를 통해 설치 가능하도록 marketplace 메타데이터를 작성한다

### Handoff Commands (HAND)

- [x] **HAND-01**: `/super-gsd:to-superpowers [phase]` 명령이 현재 phase의 PLAN.md를 읽어 Superpowers `executing-plans` 또는 `subagent-driven-development` skill로 인계한다
- [x] **HAND-02**: 인계 명령이 phase 번호 없이 호출되면 STATE.md에서 현재 진행 중 phase를 자동 추출한다
- [x] **HAND-03**: 인계 명령은 success criteria, REQ-ID 매핑, 관련 컨텍스트를 단일 프롬프트로 구조화하여 전달한다
- [x] **HAND-04**: 인계 후 `.planning/HANDOFF.md`에 (timestamp, from-stage, to-stage, phase) 항목을 append한다

### Auto-Advance Hooks (HOOK)

- [ ] **HOOK-01**: GSD `plan-phase` 완료를 감지하는 Stop hook을 플러그인에 포함시켜 다음 단계 안내 메시지를 자동 표시한다
- [ ] **HOOK-02**: Superpowers `code-reviewer` (또는 동등 review skill) 완료를 감지하는 SubagentStop hook이 Hookify `/hookify`를 자동 호출하도록 한다
- [ ] **HOOK-03**: Hook 동작은 `.planning/config.json`의 `super_gsd.auto_advance: false` 설정으로 비활성화할 수 있다
- [ ] **HOOK-04**: Hook이 잘못된 컨텍스트(다른 명령 종료 등)에서 발화하지 않도록 transcript 기반 매처를 구현한다

### Lessons Persistence (LESS)

- [ ] **LESS-01**: Hookify가 추출한 학습/패턴을 `.planning/lessons/{phase}-{date}.md`로 저장하는 후처리 스텝을 제공한다
- [ ] **LESS-02**: 다음 GSD `discuss-phase`/`plan-phase` 실행 시 `.planning/lessons/` 내용을 컨텍스트로 자동 포함시키는 보조 명령 또는 지침을 제공한다

### State & Status (STATE)

- [x] **STATE-01**: `/super-gsd:status` 명령이 현재 워크플로우 단계(plan/execute/review/hookify), 마지막 인계 시각, 다음 권장 명령을 출력한다
- [x] **STATE-02**: 상태 추적은 `.planning/HANDOFF.md` 한 파일에 append-only로 기록되며 사람이 읽을 수 있는 마크다운 형식이다

## v2 Requirements

### Multi-Phase Orchestration

- **ORCH-01**: 여러 phase를 연속으로 자동 진행하는 `super-gsd:run-roadmap` 명령
- **ORCH-02**: phase 사이에서 Hookify lessons를 다음 phase plan에 반영하는 자동 피드백 루프

### Other Runtimes

- **RT-01**: Codex (`AGENTS.md`) 런타임 지원
- **RT-02**: Gemini CLI 지원

## Out of Scope

| Feature | Reason |
|---------|--------|
| GSD/Superpowers/Hookify 내부 fork | 비침투적 외부 orchestrator를 유지하기 위해 — 업스트림 변화에 휘말리지 않아야 함 |
| Linear/Jira 등 외부 PM 도구 연동 | v1 범위 폭증 위험 — 일단 Claude Code 생태계 안에서만 동작 |
| 자체 LLM 호출 또는 API 사용 | 모든 처리는 호스트 Claude Code 세션을 통해서만 — 별도 비용/키 관리 회피 |
| 멀티 프로젝트 동시 오케스트레이션 | 한 번에 한 프로젝트 — 상태 충돌 회피 |
| UI 대시보드 | CLI 워크플로우에 집중 — 시각화는 후순위 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUGIN-01 | Phase 1 | Complete (01-01) |
| PLUGIN-02 | Phase 3 | Complete (Phase 3) |
| PLUGIN-03 | Phase 1 | Complete (01-01) |
| HAND-01 | Phase 2 | Complete |
| HAND-02 | Phase 2 | Complete |
| HAND-03 | Phase 2 | Complete |
| HAND-04 | Phase 2 | Complete |
| STATE-01 | Phase 2 | Complete |
| STATE-02 | Phase 2 | Complete (02-01) |
| HOOK-01 | Phase 4 | Pending |
| HOOK-02 | Phase 4 | Pending |
| HOOK-03 | Phase 4 | Pending |
| HOOK-04 | Phase 4 | Pending |
| LESS-01 | Phase 5 | Pending |
| LESS-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases 1-5: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after initial definition*
