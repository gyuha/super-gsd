# Roadmap: super-gsd

## Milestones

- [x] **v1.0 MVP** (2026-05-16) — Plugin scaffold + 9 sg- commands + Stop/SubagentStop hooks + lessons feedback loop → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Reliability** (2026-05-20) — sg-health 자기진단 + sg-status 정확도 + sg-start 세션 복원 → [Archive](.planning/milestones/v1.1-ROADMAP.md)
- [x] **v1.2 Self-Contained Retrospection** (2026-05-21) — 내장 sg-retro Skill(6 lens) + 자체 rule runner + weighted lessons 랭킹 + hookify 의존성 제거 → [Archive](.planning/milestones/v1.2-ROADMAP.md)
- [ ] **v1.3 Multi-Platform Support** — AGENTS.md 재작성 + .agents/skills/ 6개 + 플랫폼별 hooks + README Multi-Platform 섹션

## Phases

<details>
<summary>✅ v1.2 Self-Contained Retrospection (Phases 9-13) — SHIPPED 2026-05-21</summary>

- [x] Phase 9: sg-retro Skill scaffold (1/1 plan) — completed 2026-05-20
- [x] Phase 10: 내장 conversation analyzer + 추가 lens (1/1 plan) — completed 2026-05-20
- [x] Phase 11: 자체 rule runner (1/1 plan) — completed 2026-05-20
- [x] Phase 12: lessons aggregation + 재발 방지 가드 (1/1 plan) — completed 2026-05-21
- [x] Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거 (1/1 plan) — completed 2026-05-21

</details>

### v1.3 Multi-Platform Support (In Progress)

- [ ] **Phase 14: Codex 진입점 + .agents/skills/** — AGENTS.md 재작성(Codex 어휘) + .agents/skills/ 스킬 6개 신규 생성
- [ ] **Phase 15: 플랫폼별 훅 설정 + Python 픽스** — .codex/hooks.json + .gemini/settings.json 신규 생성 + hooks/*.py 경로 폴백 수정
- [ ] **Phase 16: README Multi-Platform 섹션** — 플랫폼별 설치 가이드 + 기능 델타 테이블 추가

## Phase Details

### Phase 14: Codex 진입점 + .agents/skills/
**Goal**: Codex, Gemini CLI, Antigravity CLI 사용자가 워크플로우를 이해하고 핵심 스킬을 실행할 수 있다
**Depends on**: Phase 13 (v1.3 신규 시작)
**Requirements**: CODEX-01, CODEX-02, CODEX-03
**Success Criteria** (what must be TRUE):
  1. Codex 세션 시작 시 AGENTS.md가 자동 주입되고, `/sg-*` 슬래시 명령 대신 `$sg-*` 문법으로 워크플로우 단계가 안내된다
  2. AGENTS.md에 SubagentStop 미지원 사실이 명시되어 있고, sg-retro를 수동으로 호출해야 함을 명확히 안내한다
  3. `.agents/skills/sg-retro/SKILL.md`가 AskUserQuestion 없이 실행되고 회고 결과를 .planning/lessons/에 저장한다
  4. `.agents/skills/sg-{start,plan,execute,review,status}/SKILL.md` 5개가 각각 platform-agnostic 지침을 제공하고 Superpowers 연동 불가를 명시한다
**Plans**: TBD

### Phase 15: 플랫폼별 훅 설정 + Python 픽스
**Goal**: Codex와 Gemini/Antigravity CLI 환경에서 Stop 훅과 PreToolUse/BeforeTool 훅이 동작하고 Python 훅이 CLAUDE_PLUGIN_ROOT 없이도 실행된다
**Depends on**: Phase 14
**Requirements**: CODEX-04, MULTI-01
**Success Criteria** (what must be TRUE):
  1. `.codex/hooks.json`이 존재하고 Stop + PreToolUse 훅을 포함하며 SubagentStop은 포함하지 않는다
  2. `.gemini/settings.json`이 존재하고 SessionEnd + BeforeTool 훅을 포함한다
  3. `hooks/stop_hook.py`와 `hooks/rule_runner.py`가 `CLAUDE_PLUGIN_ROOT` 환경변수 없이 Codex/Gemini 환경에서 실행된다
  4. `hooks/rule_runner.py`가 BeforeTool 이벤트 이름을 인식하고 PreToolUse와 동일하게 처리한다
**Plans**: TBD

### Phase 16: README Multi-Platform 섹션
**Goal**: README를 보는 사용자가 각 플랫폼에서 super-gsd를 설치하고 기능 제한을 정확히 파악할 수 있다
**Depends on**: Phase 15
**Requirements**: MULTI-02
**Success Criteria** (what must be TRUE):
  1. README에 Codex, Gemini CLI, Antigravity CLI별 설치 절차가 각각 명시되어 있다
  2. 기능 델타 테이블(동작 가능 / 제한 있음 / 불가 3분류)이 플랫폼별로 정직하게 기술되어 있다
  3. SubagentStop 미지원, Superpowers 연동 불가 등 핵심 제약이 표에 명시되어 있다
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. sg-retro Skill scaffold | v1.2 | 1/1 | Complete | 2026-05-20 |
| 10. analyzer + 추가 lens | v1.2 | 1/1 | Complete | 2026-05-20 |
| 11. 자체 rule runner | v1.2 | 1/1 | Complete | 2026-05-20 |
| 12. lessons aggregation + 재발 방지 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 13. sg-learn 라우팅 전환 + hookify 제거 | v1.2 | 1/1 | Complete | 2026-05-21 |
| 14. Codex 진입점 + .agents/skills/ | v1.3 | 0/TBD | Not started | - |
| 15. 플랫폼별 훅 설정 + Python 픽스 | v1.3 | 0/TBD | Not started | - |
| 16. README Multi-Platform 섹션 | v1.3 | 0/TBD | Not started | - |
