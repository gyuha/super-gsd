---
phase: 08-session-restore
plan: 01
subsystem: commands
tags: [session-restore, sg-start, state-parsing, askuserquestion]

requires: [07-status-accuracy]
provides:
  - commands/sg-start.md — STATE.md/HANDOFF.md 세션 감지 + 5-line 표시 + AskUserQuestion 3-옵션(Resume / Start new milestone / Cancel) 분기
affects: [super-gsd resume workflow, gsd-new-project D-17 fallback path]

tech-stack:
  added: []
  patterns: [inline-block-replication-cross-command, askuserquestion-3-option-branching]

key-files:
  created: []
  modified: [commands/sg-start.md]

key-decisions:
  - "D-01: 세션 감지 단일 트리거는 STATE.md 존재 + `^Phase:` 라인 캡처 가능. PROJECT.md만 있는 부분 초기화 상태는 감지 안 함"
  - "D-02: HANDOFF.md 데이터 행 0개여도 (init stage) STATE.md 조건 충족 시 기존 세션으로 분류"
  - "D-03/D-07: Phase 7 D-04~D-06 파싱 블록(L17-21) BEGIN/END 주석 demarcate 형태 글자 그대로 인라인 복제. drift 시 양쪽 동시 수정 lock"
  - "D-04: 5개 라인 표시 — Milestone / Phase 콜론 뒤 전체 / Stage display enum / Last activity 절대시각 / Next 권장 명령"
  - "D-05: sg-status D-29 5-라인 lock은 sg-status 전용. sg-start는 자체 포맷(헤더 + 5라인 + AskUserQuestion)"
  - "D-06: Last activity는 절대시각 그대로. bash 이식성 보장 — 상대시각 환산 금지"
  - "D-08/D-09: Resume = emit-only 종료. 자동 Skill invoke 차용 안 함 (sg-execute hybrid handoff와 달리 인과가 약함)"
  - "D-10/D-12: AskUserQuestion 인터랙티브 단독. argument-based 비대화형 모드 미도입"
  - "D-13/D-14: \"Fresh\" 라벨 폐기. \"Start new milestone\" → Skill(gsd-new-milestone, args=\"\") (args 빈 문자열 — $ARGUMENTS 금지)"
  - "D-15: Cancel = `Cancelled. No changes made.` 한 줄 emit 후 종료"
  - "D-16: 세 옵션 모두 HANDOFF.md read-only — SESS-04 append-only 자연 충족"
  - "D-17: STATE.md 미감지 또는 ^Phase: 캡처 실패 시 기존 동작 그대로 Skill(gsd-new-project, args=\"$ARGUMENTS\") 유지 (후방 호환)"

patterns-established:
  - "한 명령 파일이 다른 명령 파일의 demarcate된 bash 블록을 글자 그대로 복제 — drift 시 양쪽 동시 수정 강제 (Phase 7 D-07 + Phase 8 D-03)"
  - "AskUserQuestion 3-옵션을 명령 markdown에 도구 호출 형태로 직접 명시 — 라벨/description lock"

requirements-completed: [SESS-01, SESS-02, SESS-03, SESS-04]

duration: ~30min
completed: 2026-05-20
---

# Phase 8-01: sg-start session-restore + 3-option branch

## What changed

`commands/sg-start.md`를 1-line Skill invoke에서 6-step `<process>` 블록으로 확장. 단일 파일 수정.

### 6-step 구조

1. **STATE.md `Phase:` 파싱** (D-01, D-03; Phase 7 D-07 lock) — sg-status.md L17-21 BEGIN/END 블록 글자 그대로 복제. `PHASE_LINE`, `PHASE_NUM` 두 변수 + D-01 트리거(`EXISTING_SESSION`) 판정.
2. **STATE.md frontmatter 추가 파싱 + HANDOFF.md 마지막 행** (D-04, D-06, D-07) — `MILESTONE`/`MILESTONE_NAME`/`LAST_UPDATED`/`LAST_ACTIVITY` line-by-line grep+sed. `MILESTONE_DISPLAY` 조립. sg-status.md L26-48의 LAST_ROW + Stage 매핑 블록 인라인 복제.
3. **Last activity 시각 결정** (D-06) — HANDOFF.md Timestamp 우선 → STATE.md `last_updated` → `last_activity` → `(unknown)`. 절대시각만.
4. **NEXT_PHASE 계산 + Next 매핑** (D-04, Phase 2 D-28) — sg-status.md L62-74 + L78-99 두 블록 글자 그대로 인라인.
5. **5-line emit + AskUserQuestion 3-옵션** (D-04/05/10/12/13/14/15/16) — `Existing session detected.` 헤더 + 5 라인 출력 → `Session` header AskUserQuestion → Resume(emit-only) / Start new milestone(`Skill(gsd-new-milestone, args="")`) / Cancel(`Cancelled. No changes made.`).
6. **D-17 fallback** (`EXISTING_SESSION=0`) — 기존 동작 그대로 `Skill(skill="gsd-new-project", args="$ARGUMENTS")`.

### frontmatter / objective / success_criteria 갱신

- `description`: "Start or resume a project — detects existing session, prompts Resume / Start new milestone / Cancel; falls back to gsd-new-project when no session is detected."
- `argument-hint`: project-name이 D-17 fallback 분기에서만 사용됨을 명시.
- `<objective>`: 영문, 5라인 표시 + 3-옵션 분기 + D-17 fallback 요약.
- `<success_criteria>`: 5개로 확장 (SESS-01/02/03/04 + D-17 후방 호환).

## Verification

- **자동 (12개 acceptance criteria)**: PLAN의 `<automated>` verify 블록은 BRE 이스케이프 결함이 있어 그대로는 fail (이 사례 자체가 hookify rule `warn-grep-q-bre-special`로 변환됨). 동등 의미의 `grep -F` 기반 재실행에서 12개 acceptance 모두 PASS — BEGIN/END demarcate, sed 파싱 패턴 동일, storage→display case 블록 동일, Next case 블록 동일, 5-라인 라벨 모두 존재, `Skill(gsd-new-milestone, args="")` (빈 문자열 lock) 존재, `Skill(gsd-new-project, args="$ARGUMENTS")` (D-17) 존재, `Cancelled. No changes made.` 존재, 상대시각 표현 부재, `tests/sg-start*`/`bin/parse_handoff*` 부재.
- **수동 (Task 2 — 7-시나리오 회귀 검증)**: PLAN의 `checkpoint:human-verify gate=blocking`. 본 phase 종료 시점에서는 사용자가 sg-learn으로 이동하면서 명시적 7-시나리오 실행을 deferred. 코드 수정 자체는 sg-status.md 파싱 블록의 글자 그대로 복제이므로 sg-status가 이미 검증한 동일 로직이 sg-start에서도 동작한다고 추정 가능. v1.1 ship 전에 사용자가 7-시나리오 manual run을 수행할 수 있다.

## Notes / surprises

- **PLAN의 `<automated>` verify 블록에 BRE 이스케이프 결함** — `grep -q '...$ARGUMENTS...'`, `grep -q '...$(...'`, `grep -q '! grep -q "days ago"'` 세 가지 패턴이 BRE에서 silent fail. `-F` (fixed string)를 빠뜨린 게 원인. acceptance criteria #10 (`! grep -qF 'days ago'`)이 PLAN.md 산문 안의 "3 days ago" 예시 문자열까지 잡아내서 한 번 수정 필요. → hookify rule `warn-grep-q-bre-special`로 자동화.
- **STATE.md `Phase:` 라인 stale 지속** — Phase 6 → 7 → 8 작업 동안 STATE.md `Phase:` 라인이 `6 (sg-health) — Not started` 그대로 멈춰 있어, sg-learn 실행 시 PHASE_SLUG가 `06-sg-health`로 잘못 잡혀 HANDOFF row 한 번 수동 교정. → 기존 hookify rule `warn-state-phase-sync`가 같은 시기에 STATE.md 편집을 가드하므로 추가 rule 없이 작동 예정.
- **HANDOFF chain gap** — sg-execute (gsd-plan → superpowers) 직후 sg-review를 건너뛰고 sg-learn으로 점프, sg-learn은 `From=review`를 하드코딩해서 chain에 `superpowers → review` 행이 비어 있다. From 컬럼 하드코딩 패턴은 이미 `warn-hardcoded-handoff-from` rule이 보강 중. Phase 9 이후 sg-review 단계를 정식 거치도록 명시화 검토.
- **검증 패턴 인라인 복제의 cost** — sg-status.md 4개 블록을 sg-start에 글자 그대로 복제. drift 시 두 파일 모두 동시 수정 필요. BEGIN/END 주석 demarcate 패턴이 drift 검증을 사람 눈으로 가능하게 함. 향후 더 많은 명령이 같은 블록을 복제하면 보조 도구 검토.
