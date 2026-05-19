# Roadmap: super-gsd

## Milestones

- [x] **v1.0 MVP** (2026-05-16) — Plugin scaffold + 9 sg- commands + Stop/SubagentStop hooks + lessons feedback loop → [Archive](.planning/milestones/v1.0-ROADMAP.md)
- [ ] **v1.1 Reliability** — 세션 복원, 단계 감지 정확도, sg-health 자기진단

## Phases

- [x] **Phase 1: Plugin Scaffold** - 설치 가능한 플러그인 구조 (plugin.json, marketplace.json)
- [x] **Phase 2: Handoff Schema** - HANDOFF.md 5컬럼 스키마 + sg-execute 인계 명령
- [x] **Phase 3: sg- Command Set** - 9개 sg- 명령 전체 + README/COMMANDS.md
- [x] **Phase 4: Auto-Advance Hooks** - Stop/SubagentStop 훅 + transcript_matcher.py
- [x] **Phase 5: Lessons Loop** - Hookify 완료 시 lessons 자동 저장 + sg-plan Step 0 재표시
- [x] **Phase 6: sg-health** - GSD/Superpowers/Hookify 설치 + 훅 등록 + HANDOFF.md 스키마 종합 진단 + transcript_matcher.py 패치
- [x] **Phase 7: Status Accuracy** - HANDOFF.md 파싱으로 현재 단계 정확 감지 + STATE.md Phase 파싱 버그 수정
- [x] **Phase 8: Session Restore** - sg-start에서 기존 세션 감지 및 재개 프롬프트

## Phase Details

### Phase 1: Plugin Scaffold
**Goal**: 설치 가능한 Claude Code 플러그인 구조가 존재한다
**Depends on**: Nothing
**Requirements**: SETUP-01, SETUP-02 (v1.0)
**Success Criteria** (what must be TRUE):
  1. `claude plugin install` 로 설치 가능한 plugin.json + marketplace.json 구조 존재
  2. 플러그인 설치 후 sg- namespace 명령을 Claude Code에서 인식
**Plans**: Complete

### Phase 2: Handoff Schema
**Goal**: HANDOFF.md append-only 스키마로 GSD → Superpowers 인계가 추적된다
**Depends on**: Phase 1
**Requirements**: EXEC-01, EXEC-02 (v1.0)
**Success Criteria** (what must be TRUE):
  1. `sg-execute` 실행 시 HANDOFF.md에 5컬럼 행이 추가된다
  2. 같은 Phase에서 sg-execute를 두 번 호출해도 중복 행이 생기지 않는다
**Plans**: Complete

### Phase 3: sg- Command Set
**Goal**: 사용자가 GSD→Superpowers→Hookify 전체 워크플로우를 9개 sg- 명령으로 실행할 수 있다
**Depends on**: Phase 2
**Requirements**: CMD-01~09 (v1.0)
**Success Criteria** (what must be TRUE):
  1. 9개 sg- 명령(start/explore/plan/execute/status/review/learn/ship/lessons)이 모두 존재하고 호출 가능
  2. sg-status가 마지막 인계 시각과 다음 권장 명령을 출력한다
**Plans**: Complete

### Phase 4: Auto-Advance Hooks
**Goal**: GSD/Superpowers 단계 완료 시 hooks가 다음 단계를 자동 안내한다
**Depends on**: Phase 3
**Requirements**: HOOK-01~04 (v1.0)
**Success Criteria** (what must be TRUE):
  1. gsd-plan-complete 신호 감지 시 sg-execute 실행을 권유하는 systemMessage가 출력된다
  2. superpowers-review-complete 신호 감지 시 sg-learn 실행을 권유하는 systemMessage가 출력된다
**Plans**: Complete

### Phase 5: Lessons Loop
**Goal**: Hookify 완료 시 lessons가 자동 저장되고 다음 plan에서 재표시된다
**Depends on**: Phase 4
**Requirements**: LESSON-01~03 (v1.0)
**Success Criteria** (what must be TRUE):
  1. sg-learn 실행 후 `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 파일이 생성된다
  2. sg-plan Step 0에서 이전 lessons가 자동으로 표시된다
**Plans**: Complete

### Phase 6: sg-health
**Goal**: 사용자가 `sg-health`로 전체 설치 상태를 한 번에 진단할 수 있다
**Depends on**: Phase 5
**Requirements**: HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04, HEALTH-05, HEALTH-06
**Success Criteria** (what must be TRUE):
  1. `sg-health` 실행 시 GSD/Superpowers/Hookify 설치 여부가 `[OK]`/`[WARN]`/`[FAIL]` 라인별로 출력된다
  2. hooks.json에 Stop/SubagentStop이 등록되지 않은 경우 `[FAIL]`이 표시되고 exit code 1로 종료된다
  3. HANDOFF.md가 없거나 스키마(5컬럼 TSV)가 손상된 경우 `[WARN]` 또는 `[FAIL]`이 표시된다
  4. `sg-health` 실행 전후로 `.planning/` 안의 어떤 파일도 생성되거나 수정되지 않는다
  5. sg-health 출력 중 transcript_matcher.py가 오발동하지 않는다 (`'hookify'` 패턴 → `'Retrospective complete'` 교체)
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — sg-health 진단 명령 파일 생성 (commands/sg-health.md)
- [x] 06-02-PLAN.md — transcript_matcher.py HOOKIFY_SIGNALS 패치 ('hookify' 제거)

### Phase 7: Status Accuracy
**Goal**: `sg-status`가 HANDOFF.md를 파싱하여 현재 workflow 단계를 정확하게 표시한다
**Depends on**: Phase 6
**Requirements**: STATUS-01, STATUS-02, STATUS-03
**Success Criteria** (what must be TRUE):
  1. `sg-status` 실행 시 HANDOFF.md 마지막 데이터 행에서 stage(gsd/superpowers/hookify)를 정확히 읽어 표시한다
  2. HANDOFF.md가 없거나 데이터 행이 없을 때 `sg-status`가 오류 없이 `init` 상태를 표시한다
  3. STATE.md에 `Phase: Not started`처럼 프로즈 텍스트가 있어도 `sg-status`가 전체 값을 정확하게 표시한다 (`Not`만 반환하는 버그 제거)
**Plans**: 1 plan
Plans:
- [x] 07-01-PLAN.md — sg-status bash 블록 갱신: display enum 매핑(D-01/D-02) + STATE.md Phase 라인 풀 캡처(D-04/D-05/D-06) + scenario 6 fallback

### Phase 8: Session Restore
**Goal**: 사용자가 `sg-start` 실행 시 기존 세션을 감지하고 중단 지점에서 재개할 수 있다
**Depends on**: Phase 7
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04
**Success Criteria** (what must be TRUE):
  1. `sg-start` 실행 시 HANDOFF.md와 STATE.md를 읽어 기존 세션 여부를 자동으로 감지한다
  2. 기존 세션이 있으면 milestone, stage, 마지막 활동 시각을 표시하고 재개/새 시작을 질의한다
  3. 재개를 선택하면 gsd-new-project 호출을 건너뛰고 감지된 단계부터 계속 진행한다
  4. 새 시작을 선택해도 HANDOFF.md는 삭제되지 않고 유지된다 (append-only 감사 로그)
**Plans**: 1 plan
Plans:
- [x] 08-01-PLAN.md — sg-start.md `<process>` 확장: STATE.md/HANDOFF.md 세션 감지 + 5-line 표시 + AskUserQuestion 3-옵션 분기 (Resume/Start new milestone/Cancel)
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plugin Scaffold | — | Done | 2026-05-16 |
| 2. Handoff Schema | — | Done | 2026-05-16 |
| 3. sg- Command Set | — | Done | 2026-05-16 |
| 4. Auto-Advance Hooks | — | Done | 2026-05-16 |
| 5. Lessons Loop | — | Done | 2026-05-16 |
| 6. sg-health | 2/2 | Done | 2026-05-18 |
| 7. Status Accuracy | 1/1 | Done | 2026-05-19 |
| 8. Session Restore | 1/1 | Done | 2026-05-20 |
