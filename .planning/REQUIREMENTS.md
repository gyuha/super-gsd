# Requirements: v2.6 Codex/Gemini 설치 UX 개선

## Milestone Goal

Codex/Gemini CLI에서 super-gsd 설치를 GSD(npm) · Superpowers(marketplace) 수준으로 단순화한다.
현재 `git clone + cp×3` 4단계를 `npx @gyuha/super-gsd install` 1단계로 줄인다.

---

## v1 Requirements

### INSTALL — npx 설치 자동화

- [ ] **INSTALL-01**: 사용자가 `npx @gyuha/super-gsd install` 한 명령으로 Codex 설치에 필요한 파일(`.codex/hooks.json`, `hooks/`, `.agents/`)을 현재 프로젝트 디렉토리에 복사할 수 있다
- [ ] **INSTALL-02**: 사용자가 `npx @gyuha/super-gsd install --gemini` 플래그로 Gemini 설치(`.gemini/settings.json`)도 동일하게 수행할 수 있다
- [ ] **INSTALL-03**: 리포지토리 루트에 `package.json`(또는 기존 업데이트)과 `bin/setup.js` 스크립트가 있어 `npx`가 별도 사전 설치 없이 즉시 실행된다

### SKILL — 인세션 부트스트랩

- [ ] **SKILL-01**: Codex/Gemini 세션 내에서 `$sg-setup` 스킬을 실행하면 프로젝트 루트에 `hooks/`, `.agents/`, 플랫폼별 설정 파일이 자동으로 복사된다
- [ ] **SKILL-02**: `.agents/skills/sg-setup/SKILL.md`가 생성되어 `$sg-setup` 명령으로 호출 가능하다

### DOC — 문서 개선

- [ ] **DOC-01**: `README.md`의 Codex/Gemini 설치 섹션이 `npx @gyuha/super-gsd install` 단일 명령으로 재작성된다 (기존 4단계 cp 명령 대체)
- [ ] **DOC-02**: `README.md`에 Codex/Gemini 전용 Verify install 섹션이 추가되어 설치 후 hooks 동작 및 스킬 확인 방법이 명시된다
- [ ] **DOC-03**: `AGENTS.md`에 설치 방법과 Verify 체크리스트가 업데이트된다
- [ ] **DOC-04**: `README.ko.md`가 README.md 변경 사항과 동기화된다

---

## Future Requirements (이번 마일스톤 외)

- Codex 공식 plugin marketplace 등록 — 제3자 플랫폼 의존, 별도 검토 필요
- Windows(PowerShell) 지원 — setup.js에서 경로 처리 추가 필요
- super-gsd 자동 업데이트 — `npx @gyuha/super-gsd update` 명령

---

## Out of Scope

- npm registry 패키지 퍼블리싱 이외의 CDN/curl 설치 방식 — npx로 충분히 단순화됨
- Claude Code 플러그인 설치 방식 변경 — 이미 `/plugin install` 1단계로 충분
- GSD/Superpowers 내부 수정 — 비침투적 원칙 유지

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| INSTALL-01 | TBD | Pending |
| INSTALL-02 | TBD | Pending |
| INSTALL-03 | TBD | Pending |
| SKILL-01 | TBD | Pending |
| SKILL-02 | TBD | Pending |
| DOC-01 | TBD | Pending |
| DOC-02 | TBD | Pending |
| DOC-03 | TBD | Pending |
| DOC-04 | TBD | Pending |
