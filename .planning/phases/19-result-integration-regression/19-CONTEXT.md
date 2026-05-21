# Phase 19: 결과 통합 + 호환성 회귀 테스트 - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 19는 두 가지를 구현한다:

1. **HANDOFF.md `To` 셀 정확성** — 병렬 경로에서 `To: superpowers` 대신 `To: parallel`로 기록하도록 sg-execute Step 8을 분기. 오케스트레이터 단독 기록 원칙(TE-04a)은 Phase 18에서 이미 충족됨.
2. **호환성 회귀 검증** — sg-execute Step 8.5 로그에 `[TE-05a]` 태그를 추가하고, wave 없는 픽스처로 smoke test를 실행하여 v1.3 이전 동작 보존을 확인(TE-04b, TE-05a, TE-05b).

Phase 19 범위 밖:
- sg-parallel-execute SKILL.md 수정 (Phase 18 완료)
- HANDOFF.md 스키마 변경
- parallel_groups.json 정리 로직 (유지하기로 결정)
- idempotency 검사, lessons 주입 로직 변경 (TE-05b — 변경 없음)

</domain>

<decisions>
## Implementation Decisions

### A. HANDOFF.md 기록 타이밍

- **D-01:** TE-04a "오케스트레이터가 완료 후 기록"은 **"에이전트가 직접 기록하지 않는다"** 로 해석한다. 타이밍(실행 전/후)은 요건이 아니라 의도 설명이다. race condition 방지가 핵심 목적이며, Phase 18에서 에이전트 측 금지(`Do NOT write to .planning/HANDOFF.md`)가 이미 구현되어 TE-04a가 충족된 것으로 간주한다.
- **D-02:** Step 8을 이동하거나 병렬 완료 후 별도 append 로직을 추가하지 않는다. 코드 변경 최소화.
- **D-03:** `To` 셀 값만 분기한다. sg-execute Step 8에서 `PARALLEL_GROUPS` 유무에 따라:
  - `PARALLEL_GROUPS` 비어 있음 → `To: superpowers` (기존과 동일)
  - `PARALLEL_GROUPS` 있음 → `To: parallel`
  - 분기는 Step 8.5 실행 후 Step 9 직전에 삽입한다 (Step 8.5에서 `PARALLEL_GROUPS`가 계산되므로).

  구현 방식: Step 8을 Step 8.5 이후로 이동하거나, `HANDOFF_TO` 변수를 계산한 뒤 Step 8에서 사용. 후자가 코드 변경 범위가 더 작으므로 권장.

  ```bash
  # Step 8.5 이후, Step 9 이전에 삽입:
  if [ -n "$PARALLEL_GROUPS" ]; then
    HANDOFF_TO="parallel"
  else
    HANDOFF_TO="superpowers"
  fi
  ```

  Step 8의 `echo` 라인을 수정:
  ```bash
  echo "| $TS | $PHASE_SLUG | $FROM_STAGE | $HANDOFF_TO | $PLAN_HASH |" >> .planning/HANDOFF.md
  ```

### B. 호환성 회귀 테스트

- **D-04:** sg-execute.md Step 8.5의 "wave 없음" 분기 로그에 `[TE-05a]` 태그를 추가한다:
  ```bash
  echo "[TE-05a] wave 필드 없음 — 기존 순차 실행 경로 유지. v1.3 이전 동작 보존."
  ```
- **D-05:** Phase 19 PLAN.md에 smoke test 태스크를 포함한다. 테스트 절차:
  1. wave 필드 없는 임시 픽스처 PLAN.md 생성 (`.planning/phases/19-result-integration-regression/test-fixture-PLAN.md`)
  2. sg-execute 로직을 픽스처로 추적 실행 (실제 `Skill()` 호출 없이 Step 0~8.5까지만)
  3. `[TE-05a]` 로그가 출력되고 `PARALLEL_GROUPS`가 비어 있는지 확인
  4. 픽스처 삭제
- **D-06:** TE-05b (idempotency 검사, HANDOFF 기록, lessons 주입 로직 변경 없음)는 코드 diff로 검증한다. Phase 17~18에서 수정된 파일 목록을 확인하여 Step 0~7, Step 8(To 셀 제외), Step 0 lessons 블록이 변경되지 않았음을 확인.

### C. parallel_groups.json 정리

- **D-07:** 병렬 실행 완료 후 `parallel_groups.json`을 삭제하지 않는다. 디버깅 및 감사 목적으로 유지. sg-parallel-execute SKILL.md와 sg-execute Step 8.5 모두 정리 로직을 추가하지 않는다.

### Claude's Discretion

- Step 8을 Step 8.5 이후로 물리적으로 이동할지, `HANDOFF_TO` 변수만 추가할지는 구현 시 판단 (D-03에서 후자 권장).
- smoke test 시 실제 `Skill()` 호출을 막는 방법 (드라이런 플래그 vs. 코드 추적 vs. bash 조건 단락) — 구현 시 가장 단순한 방법 선택.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 19 설계 기반
- `.planning/ROADMAP.md` §Phase 19 — Goal, Success Criteria, Requirements (TE-04a, TE-04b, TE-05a, TE-05b)
- `.planning/REQUIREMENTS.md` — TE-04a, TE-04b, TE-05a, TE-05b 원문 요건

### 이전 단계 결정사항
- `.planning/phases/18-sg-parallel-execute/18-CONTEXT.md` — D-03 에이전트 프롬프트 구조 (HANDOFF.md 쓰기 금지 명시)
- `.planning/phases/17-plan-md-dependency-analysis/17-CONTEXT.md` — PARALLEL_GROUPS 전달 방식, parallel_groups.json 스키마

### 수정 대상 파일
- `commands/sg-execute.md` — Step 8 (`To` 셀 분기), Step 8.5 (TE-05a 로그 태그). 그 외 모든 Step은 변경 없음.

### 변경 없음 확인 대상
- `commands/sg-execute.md` Step 0 (lessons reminder), Step 7 (idempotency 검사), Step 7.5 (HANDOFF 초기화) — 변경 금지
- `skills/sg-parallel-execute/SKILL.md` — Phase 18 완료, Phase 19에서 수정하지 않음

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/sg-execute.md` Step 8: `echo "| $TS | $PHASE_SLUG | $FROM_STAGE | superpowers | $PLAN_HASH |"` — `superpowers`를 `$HANDOFF_TO`로 교체하면 됨. 1줄 변경.
- `commands/sg-execute.md` Step 8.5: `echo "wave 필드 없음 — 기존 순차 실행 경로 유지"` — `[TE-05a]` 태그와 v1.3 보존 문구 추가. 1줄 변경.

### Established Patterns
- **HANDOFF.md 5컬럼 스키마:** `| Timestamp | Phase | From | To | Plan Hash |` — `To` 셀에 `parallel` 값 추가는 스키마 변경이 아니라 값 확장이므로 하위 호환.
- **sg-status 파싱:** `sg-status.md`가 `To` 셀을 파싱하는 방식 확인 필요. `parallel` 값이 알 수 없는 상태로 표시될 수 있음 — sg-status display enum 확인.

### Integration Points
- **sg-execute Step 8 → HANDOFF.md:** `To` 셀 값 분기가 유일한 변경 지점.
- **sg-execute Step 8.5 → 로그:** `[TE-05a]` 태그 추가.
- **sg-status → HANDOFF.md `To` 셀:** `parallel` 값을 인식하는지 확인. 미인식 시 sg-status에 `parallel` → display 매핑 추가 필요 (minor, Phase 19 범위 내).

</code_context>

<specifics>
## Specific Ideas

- **sg-status `parallel` 값 처리:** sg-status.md가 HANDOFF.md의 `To` 셀을 읽어 상태를 표시한다면, `parallel` 값에 대한 매핑이 없을 수 있다. "병렬 실행 중" 또는 "parallel" 그대로 표시하도록 최소한의 처리 추가 권장.
- **smoke test 픽스처 내용:** wave 필드 없는 최소 PLAN.md:
  ```markdown
  ---
  name: test-fixture
  ---
  # Test Fixture Plan
  ## Tasks
  - [ ] dummy task
  ```
  실제 실행 없이 Step 8.5 분기 확인용으로 충분.

</specifics>

<deferred>
## Deferred Ideas

- **worktree 격리:** 병렬 에이전트별 git worktree 격리 — REQUIREMENTS.md에서 v1.4 이후 명시 연기
- **자동 재시도 로직:** 실패 에이전트 자동 재시도 — v1.4 이후 고려
- **GROUP_COUNT > 3 고도화:** wave 오름차순 앞 3개 외 그룹 처리 전략 고도화 — v1.5 이후
- **HANDOFF.md `To: parallel` 완료 행 추가:** 병렬 실행 완료 후 별도 "complete" 행 기록 — 현재는 단일 행으로 충분, 필요 시 v1.5에서 검토

</deferred>

---

*Phase: 19-result-integration-regression*
*Context gathered: 2026-05-21*
