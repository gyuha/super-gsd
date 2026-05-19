---
phase: 07-status-accuracy
plan: 01
subsystem: commands
tags: [status, parsing, display-enum, bash-block]

requires: []
provides:
  - commands/sg-status.md — display enum 매핑 + STATE.md Phase 라인 풀 캡처 + storage-state Next 라우팅
affects: [super-gsd workflow stage display]

tech-stack:
  added: []
  patterns: [storage-vs-display-enum-mapping, named-bash-parsing-block]

key-files:
  created: []
  modified: [commands/sg-status.md]

key-decisions:
  - "D-01/D-02: display enum 4-value (init/gsd/superpowers/hookify); review→superpowers 매핑"
  - "D-03: Next-command 라우팅은 storage 5-state 그대로 유지 — review stage는 표시 축약과 무관하게 /super-gsd:sg-learn"
  - "D-04/D-05/D-06: STATE.md `Phase:` 라인 콜론 뒤 전체 문자열 trim 캡처. ROADMAP.md phase-name 룩업 폐기. \\S+ 단일 토큰 정규식 금지"
  - "D-07: 파싱 블록을 BEGIN/END 주석으로 demarcate → Phase 8 sg-start 인라인 복제 가능"
  - "D-08: 자동화 테스트 자산 미추가 — commands/sg-status.md 단일 파일만 수정 (Phase 6 D-04 bash-only 노선 일관 유지)"
  - "Scenario 6 fallback (b) 채택: PHASE_NUM 비추출 시 Next는 `/super-gsd:sg-plan` (인자 생략)"

patterns-established:
  - "Storage enum(5) ↔ Display enum(3) 매핑 — 사용자 멘탈모델과 라우팅 정밀도 분리"
  - "명령 파일 안에 BEGIN/END 주석으로 demarcate된 재사용 가능 bash 블록 (forward-compat marker)"

requirements-completed: [STATUS-01, STATUS-02, STATUS-03]

duration: ~10min
completed: 2026-05-18
---

# Phase 7-01: sg-status display enum + Phase 라인 풀 캡처

## What changed

`commands/sg-status.md` 한 파일을 D-01~D-06 규칙에 맞춰 갱신했다. 네 영역:

1. **STATE.md `Phase:` 라인 파싱 교체** (D-04/D-05/D-06)
   - 기존: `PHASE_NUM=$(... | awk '{print $2}')` 단일 토큰 추출 + ROADMAP.md `### Phase ${PHASE_NUM}:` 룩업
   - 신규: `PHASE_LINE`이 콜론 뒤 전체 문자열을 trim해서 보관. ROADMAP 이름 룩업 폐기 — STATE.md가 단일 진실
   - `^Phase:` 라인 부재 시 `PHASE_LINE="(none)"` fallback (D-05)
   - 별도 `PHASE_NUM` 추출은 `grep -oE '^[0-9]+'` (정수 prefix만)
   - BEGIN/END 주석으로 블록 demarcate → Phase 8 sg-start 인라인 복제 (D-07)

2. **Stage 표시 enum 매핑 추가** (D-01/D-02; STATUS-01)
   - 기존 `STAGE` → `STAGE_RAW` 으로 rename. 기존 스키마 검증 case (`gsd-plan|superpowers|review|hookify`)는 `STAGE_RAW` 기준 유지
   - 신규 `STAGE_DISPLAY` 변환 case 블록: `gsd-plan → gsd`, `review → superpowers`, 나머지 동일

3. **Next 명령 분기 보정** (D-03 + scenario 6 fallback)
   - `case "$STAGE" in` → `case "$STAGE_RAW" in` rename. 분기와 매핑은 D-03 lock 그대로
   - `init` 분기에 PHASE_NUM-empty fallback 추가: 정수 추출 실패 시 `NEXT_CMD="/super-gsd:sg-plan"` (인자 생략, CONTEXT specifics 후보 (b))

4. **부속 갱신**
   - Step 1 헤더 텍스트를 STATE.md-only 설명으로 교체
   - Step 6 출력 템플릿: `<PHASE_NUM> (<PHASE_NAME>)` → `<PHASE_LINE>`, `<STAGE>` → `<STAGE_DISPLAY>`
   - `<objective>` 줄에서 ROADMAP 룩업 언급 정리 — hookify next-phase 존재 체크만 명시
   - `<success_criteria>` 3개 항목을 D-29 / STATUS-02 / display+Next 매핑 기준으로 재서술

## Verification

- **자동 (8개 acceptance criteria)**: 모두 PASS — `case "$STAGE_RAW" in` 존재, display 매핑 존재, `awk '{print $2}'` 부재, ROADMAP grep 부재 (hookify NEXT_PHASE 체크는 유지), sed 파이프라인이 `Phase: Not started` → `Not started` 와 `Phase: 6 (sg-health) — Not started` → `6 (sg-health) — Not started` 둘 다 통과.
- **수동 (D-09 체크리스트 7개 시나리오)**: bash 시뮬레이션으로 7개 시나리오 모두 통과 확인. 시뮬레이션 로직은 갱신된 `commands/sg-status.md` 와 동일한 결정론적 bash 코드 — 사용자가 명시적으로 시뮬레이션 결과를 manual 실행과 등가로 승인함.

## Manual-verify scenario results

| # | Fixture | 출력 | Pass |
|---|---|---|---|
| 1 | STATE Phase 7, HANDOFF data 0 | `Phase: 7 (status-accuracy) — Not started` / `Stage: init` / `Next: /super-gsd:sg-plan 7` | ✓ |
| 2 | STATE Phase 6, To=gsd-plan | `Stage: gsd` / `Next: /super-gsd:sg-execute` | ✓ |
| 3 | STATE Phase 6, To=superpowers | `Stage: superpowers` / `Next: /super-gsd:sg-learn` | ✓ |
| 4 | STATE Phase 6, To=review (D-02/D-03 분리 검증) | `Stage: superpowers` 표시 + `Next: /super-gsd:sg-learn` 라우팅 | ✓ |
| 5 | STATE Phase 6, To=hookify, Phase 7 존재 | `Stage: hookify` / `Next: /super-gsd:sg-plan 7` | ✓ |
| 6 | STATE `Phase: Not started` (STATUS-03 회귀) | `Phase: Not started` (잘림 없음) / `Next: /super-gsd:sg-plan` (인자 생략) | ✓ |
| 7 | STATE.md 부재 | `Phase: (none)` / `Next: /super-gsd:sg-plan` | ✓ |

## Notes / surprises

- 직전 sg-plan 워크플로우가 `state.planned-phase` 쿼리로 STATE.md의 `last_activity`만 업데이트하고 `Current Position` `Phase:` 라인은 갱신하지 않아, sg-execute의 phase 자동 감지가 직전에 plan한 phase(7)가 아닌 STATE.md `Current Position`의 phase(6)를 가리키는 부조화가 발생. v1.2에서 검토할 항목.
- 플랜의 자동 verify `<automated>` 블록 두 군데는 mechanical bug 있음 — `grep -q '...\s*...'` (basic grep에서 `\s`는 리터럴) 와 `grep -q "sed -E 's/\\^Phase:..."` (이중 escape) 패턴이 실제 코드와 일치하지 않음. acceptance criteria의 의도(매핑 존재 / sed 패턴 사용)를 충족하는 동등 grep 으로 대체해 verify. 차후 plan author 가이드라인에 "basic grep에서 `\s` 사용 금지, `[[:space:]]` 또는 `grep -E`" 추가 검토.
- D-09 수동 체크리스트는 bash 시뮬레이션으로 대체 실행. 사용자가 명시 승인. 시뮬레이션은 갱신된 bash 코드와 동일한 결정론적 로직이므로 fixture-based manual run과 functionally 등가.
