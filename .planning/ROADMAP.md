# Roadmap: super-gsd

## Milestones

- [x] **v1.0 MVP** (2026-05-16) — Plugin scaffold + 9 sg- commands + Stop/SubagentStop hooks + lessons feedback loop → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- [x] **v1.1 Reliability** (2026-05-20) — sg-health 자기진단 + sg-status 정확도 + sg-start 세션 복원 → [Archive](.planning/milestones/v1.1-ROADMAP.md)
- [ ] **v1.2 Self-Contained Retrospection** — 내장 retro skill + 다관점 lens + 자체 rule runner + 재발 방지 가드, hookify 의존성 제거

## Phases

- [ ] **Phase 9: sg-retro Skill scaffold** — `skills/sg-retro/` 디렉터리 + SKILL.md + Start/Stop/Continue · 4Ls · Decisions/Surprises/Patterns/Mistakes 3 lens 구현
- [ ] **Phase 10: 내장 conversation analyzer + 추가 lens** — frustration/correction/repeated/validated-success 자체 추출 + Sailboat · Five Whys lens 추가, 다중 lens 선택 지원
- [ ] **Phase 11: 자체 rule runner** — super-gsd PreToolUse hook + `.claude/sg-rule.*.local.md` 포맷 spec + 기존 hookify rule 호환 실행
- [ ] **Phase 12: lessons aggregation + 재발 방지 가드** — phase·milestone별 lessons 묶음 + weighted top-N 산출 + sg-plan/sg-execute 우선순위 노출
- [ ] **Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거** — sg-learn이 내장 sg-retro 호출로 교체, README/prerequisites/sg-update에서 hookify 제거

## Phase Details

### Phase 9: sg-retro Skill scaffold
**Goal**: 사용자가 `sg-retro` Skill을 호출하면 3가지 lens(Start/Stop/Continue, 4Ls, Decisions/Surprises/Patterns/Mistakes) 중 하나를 선택해 회고를 실행하고 결과가 `.planning/lessons/`에 저장된다
**Depends on**: Phase 8 (v1.1)
**Requirements**: RETRO-01, RETRO-02, RETRO-03 (부분), RETRO-04
**Success Criteria** (what must be TRUE):
  1. `skills/sg-retro/SKILL.md`가 존재하고 Claude Code Skill로 로드된다
  2. `sg-retro` 호출 시 phase argument로 해당 phase의 CONTEXT/PLAN/SUMMARY와 git diff/log를 자동 수집한다
  3. 3가지 lens 중 하나를 사용자가 AskUserQuestion으로 선택할 수 있다
  4. 회고 결과가 `.planning/lessons/{phase}-{YYYY-MM-DD}.md`에 lens별 섹션 구조로 저장된다
**Plans**: 1 plan
- [ ] 09-01-PLAN.md — skills/sg-retro/SKILL.md 작성(argument 파싱 + 컨텍스트 수집 + 3 lens facilitation + lessons append) + plugin.json skills 등록

### Phase 10: 내장 conversation analyzer + 추가 lens
**Goal**: hookify의 conversation-analyzer 의존을 제거하고 자체 analyzer를 통해 frustration/correction/repeated/validated-success 4 카테고리를 추출하며, Sailboat·Five Whys lens가 추가되어 총 5 lens가 다중 선택 가능하다
**Depends on**: Phase 9
**Requirements**: ANALYZER-01, ANALYZER-02, ANALYZER-03, RETRO-03 (완료), RETRO-05
**Success Criteria**:
  1. session transcript에서 4 카테고리 패턴을 hookify 의존 없이 자체 추출하고 tool/event, regex, context, severity를 구조화 출력한다
  2. analyzer 기본 스캔 범위가 최근 20-30 메시지이며, 명시 시 더 깊이 스캔 가능
  3. Sailboat, Five Whys lens가 추가되어 다섯 lens가 모두 제공된다
  4. 한 번의 `sg-retro` 호출에서 여러 lens를 다중 선택 가능하고 결과가 단일 lessons 파일에 lens별 섹션으로 묶인다
**Plans**: 1 plan
Plans:
- [ ] 10-01-PLAN.md — SKILL.md Phase 10 확장(6 lens, multiSelect, transcript analyzer, multi-lens loop) + 수동 검증

### Phase 11: 자체 rule runner
**Goal**: super-gsd가 자체 PreToolUse hook을 등록해 `.claude/sg-rule.*.local.md` (또는 `.claude/hookify.*.local.md` 호환 위치)의 rule을 직접 실행하며, hookify 플러그인 미설치 환경에서도 가드가 동작한다
**Depends on**: Phase 10
**Requirements**: RULES-01, RULES-02, RULES-03, RULES-04
**Success Criteria**:
  1. super-gsd가 PreToolUse hook을 자체 등록한다 (`hooks/hooks.json` 갱신 또는 별도 entry)
  2. 기존 hookify rule format을 그대로 실행 — 기존 15개 rule 파일이 마이그레이션 없이 동작한다
  3. rule action(`warn`/`block`)이 PreToolUse hook 응답으로 매핑돼 실제 차단/경고를 일으킨다
  4. 새 rule 파일 생성 시 즉시 적용 (restart 불필요)
**Plans**: TBD

### Phase 12: lessons aggregation + 재발 방지 가드
**Goal**: lessons가 phase·milestone별로 묶이고, sg-plan/sg-execute가 weighted top-N 패턴을 우선순위 노출하여 같은 실수가 반복되지 않는다
**Depends on**: Phase 11
**Requirements**: LESSONS-01, LESSONS-02, LESSONS-03, RECURRENCE-01, RECURRENCE-02, RECURRENCE-03
**Success Criteria**:
  1. `sg-retro` 종료 시 lessons append (덮어쓰기 금지), milestone close 시 `.planning/milestones/v{X}-LESSONS.md`로 자동 묶기
  2. `sg-plan` Step 0이 weighted top-N(빈도 + 최근성 + severity)을 우선 표시하고 전체 lessons dump는 fold로 보존
  3. `sg-execute` 진입 시 한 줄 요약 reminder로 weighted top-N 노출
  4. `/super-gsd:sg-lessons milestone=v1.2` 등 milestone 필터 조회 동작
**Plans**: TBD

### Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거
**Goal**: `sg-learn`이 `hookify:hookify` 대신 내장 `sg-retro`를 호출하고, README/prerequisites/sg-update에서 hookify 의존성을 완전히 제거하여 super-gsd가 단독 동작한다
**Depends on**: Phase 12
**Requirements**: MIGRATION-01, MIGRATION-02, MIGRATION-03, MIGRATION-04
**Success Criteria**:
  1. `commands/sg-learn.md`가 `Skill(skill="sg-retro", ...)` 호출로 교체된다
  2. hookify 미설치 환경에서 `sg-learn` end-to-end 정상 동작 (manual checklist 통과)
  3. README.md / README.ko.md / docs/COMMANDS.md / plugin.json에서 hookify 의존 표기 제거 또는 historical-only로 demote
  4. `sg-update`가 hookify install/update 대상에서 제외 (또는 explicit optional 모드)
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. sg-retro Skill scaffold | 0/1 | Planning | — |
| 10. analyzer + 추가 lens | 0/1 | Planning | — |
| 11. 자체 rule runner | 0/? | Not started | — |
| 12. lessons aggregation + 재발 방지 | 0/? | Not started | — |
| 13. sg-learn 라우팅 전환 + hookify 제거 | 0/? | Not started | — |
