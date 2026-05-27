# Requirements: v2.7 Skills & Hooks Internationalization

## Milestone Goal

`skills/` 및 `hooks/` 내 한글 콘텐츠를 영문으로 전환하고, 모든 SKILL.md에 사용자 언어 자동 감지 지침을 추가한다.
사용자가 한국어로 입력하면 한국어로, 영어로 입력하면 영어로 응답하도록 스킬 출력 언어가 자동 조정된다.

---

## v1 Requirements

### Ko→EN Migration (영문화)

- [x] **I18N-01**: `skills/sg-*/SKILL.md` 14개에서 한글 콘텐츠를 영문으로 변환한다
      - 대상: process, objective, success_criteria, bash 출력 메시지, 인라인 한글 텍스트 전체
      - 기술 명령어(bash 코드, flag 이름)는 변경하지 않음
      - 대상 파일: sg-complete, sg-execute, sg-health, sg-lessons, sg-new, sg-next, sg-parallel-execute, sg-plan, sg-retro, sg-review, sg-setup, sg-start, sg-status, sg-ui-plan

- [x] **I18N-02**: `.agents/skills/sg-*/SKILL.md` 8개에서 한글 콘텐츠를 영문으로 변환한다
      - 쌍 커버 컨벤션 준수 (skills/ 변경과 .agents/ 변경은 동일 milestone에서 완료)
      - 대상 파일: sg-execute, sg-plan, sg-retro, sg-review, sg-setup, sg-ship, sg-start, sg-status

- [x] **I18N-03**: `hooks/stop_hook.cjs` + `hooks/rule_runner.cjs` 내 한글 주석·인라인 메시지를 영문으로 변환한다
      - 코드 로직 변경 없음 — 한글 문자열/주석만 교체

### Language Auto-Detection (언어 자동 감지)

- [x] **I18N-04**: `skills/` 19개 + `.agents/skills/` 8개 = 총 27개 SKILL.md 모두에 언어 자동 감지 지침을 추가한다
      - 사용자 입력 언어를 감지하여 동일 언어로 응답하는 `<language>` 블록 삽입
      - 형식: SKILL.md frontmatter 바로 아래 또는 `<objective>` 앞에 위치
      - 내용: 한국어 입력 → 한국어, 영어 입력 → 영어, 혼용 → 주된 언어

---

## Future Requirements

- 다른 언어(일본어, 스페인어 등) 지원 — v2.7 범위 외
- hooks/lessons_ranker.cjs, hooks/transcript_matcher.cjs 검토 — 현재 한글 없음
- CLAUDE.md/AGENTS.md/README 추가 영문화 — v2.7 범위 외

---

## Out of Scope

- 기능 변경 없음 — 순수 언어·지침 교체만
- bash 코드 블록 내 명령어/flag/변수명 변경 금지
- 영문 전환 완료 파일에 불필요한 리팩토링 금지

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| I18N-01 | Phase 36 | Complete |
| I18N-02 | Phase 37 (ad-hoc: 36-fix 커밋에 흡수) | Complete |
| I18N-03 | Phase 38 (ad-hoc: 커밋 391326c 직접 수행) | Complete |
| I18N-04 | Phase 36 (partial: skills/ 19개) + Phase 37 (complete: .agents/ 8개) | Complete |
