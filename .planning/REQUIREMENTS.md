# Requirements: super-gsd v1.3 Multi-Platform Support

**Milestone:** v1.3 Multi-Platform Support
**Defined:** 2026-05-21
**Core Value:** Codex, Gemini CLI, Antigravity CLI 사용자도 super-gsd 워크플로우를 사용할 수 있도록 설치 방법과 적응형 파일을 제공한다

## v1.3 Requirements

### Cross-Platform Foundation (CODEX)

- [ ] **CODEX-01**: Codex 및 Antigravity CLI 사용자가 AGENTS.md를 통해 super-gsd 워크플로우를 이해하고 시작할 수 있다
  - *Outcome: pending*
  - AGENTS.md를 Codex/Antigravity 어휘($sg-* 문법)로 재작성, 8 KiB 이하, SubagentStop 부재 명시

- [ ] **CODEX-02**: Codex, Gemini CLI, Antigravity CLI 사용자가 `.agents/skills/sg-retro`를 통해 sg-retro를 AskUserQuestion 없이 실행할 수 있다
  - *Outcome: pending*
  - skills/sg-retro/SKILL.md에서 AskUserQuestion 제거, .agents/skills/sg-retro/SKILL.md 신규 생성

- [ ] **CODEX-03**: Codex, Gemini CLI, Antigravity CLI 사용자가 `.agents/skills/sg-{start,plan,execute,review,status}` 래퍼 스킬 5개를 통해 핵심 워크플로우 단계를 실행할 수 있다
  - *Outcome: pending*
  - 각 스킬은 platform-agnostic prose 지침 제공, Superpowers 연동 불가 명시

- [ ] **CODEX-04**: Codex 사용자가 `.codex/hooks.json`을 통해 Stop과 PreToolUse 훅을 사용할 수 있고, hooks/*.py가 CLAUDE_PLUGIN_ROOT 없이도 동작한다
  - *Outcome: pending*
  - .codex/hooks.json 신규 생성 (Stop + PreToolUse, SubagentStop 제외)
  - hooks/stop_hook.py 및 hooks/rule_runner.py CLAUDE_PLUGIN_ROOT 폴백 1줄 추가

### Multi-Platform Completion (MULTI)

- [ ] **MULTI-01**: Antigravity CLI 및 Gemini CLI 사용자가 `.gemini/settings.json`을 통해 SessionEnd와 BeforeTool 훅을 사용할 수 있다
  - *Outcome: pending*
  - .gemini/settings.json 신규 생성 (SessionEnd + BeforeTool)
  - hooks/rule_runner.py hookEventName BeforeTool 호환 처리

- [ ] **MULTI-02**: README에 Codex, Gemini CLI, Antigravity CLI 플랫폼별 설치 방법과 기능 델타 테이블(동작/제한/불가 3분류)을 포함한 Multi-Platform 섹션이 존재한다
  - *Outcome: pending*

## Future Requirements (v1.4+)

- 13개 sg-* 전체 .agents/skills/ SKILL.md (v1.3 이후 — stale 위험, 유지보수 부담)
- Antigravity CLI 훅 스키마 확정 후 .gemini/settings.json 검증 및 보완
- sg-health Antigravity/Codex 변형 (설치 환경 자기진단)
- .codex-plugin/plugin.json 마켓플레이스 등록 (절차 미문서화)
- ~/.antigravity/AGENTS.md 글로벌 템플릿

## Out of Scope (v1.3)

- SubagentStop 대체 훅 — Codex, Antigravity CLI 모두 미지원. GitHub 이슈 #21753 미해결.
- Superpowers:executing-plans Codex/Antigravity 에뮬레이션 — Superpowers는 Claude Code 전용
- 13개 commands/*.md bash-동등 full-parity 포팅 — 즉시 stale, 유지보수 불가
- lessons_ranker.py Codex/Antigravity 훅 포팅 — scope 초과
- 플러그인 마켓플레이스 자동 게시 — 외부 요인

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CODEX-01 | Phase 14 | Pending |
| CODEX-02 | Phase 14 | Pending |
| CODEX-03 | Phase 14 | Pending |
| CODEX-04 | Phase 15 | Pending |
| MULTI-01 | Phase 15 | Pending |
| MULTI-02 | Phase 16 | Pending |
