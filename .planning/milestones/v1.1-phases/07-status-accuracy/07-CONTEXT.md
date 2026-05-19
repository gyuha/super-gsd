# Phase 7: Status Accuracy - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

`sg-status`가 `.planning/HANDOFF.md` 마지막 데이터 행을 파싱해 현재 workflow stage를 사용자 멘탈모델(3-stage: `gsd`/`superpowers`/`hookify`)로 표시하고, `.planning/STATE.md`의 `Phase:` 라인 콜론 뒤 전체 문자열을 그대로 출력해 `Not`만 잘려 나오는 식의 파싱 버그를 제거한다. HANDOFF.md가 없거나 데이터 행이 0개일 때는 오류 없이 `init` 상태로 표시한다. 이번 phase는 `commands/sg-status.md` 한 파일 안의 bash 블록만 수정한다 — 별도 헬퍼 스크립트나 테스트 자산은 추가하지 않는다.

Phase 8 `sg-start`의 세션 복원이 이 표시 규칙에 의존하므로, 여기서 정한 매핑·파싱 규칙은 Phase 8 bash 블록이 그대로 재사용한다 (drift 발생 시 양쪽 동시 수정).

</domain>

<decisions>
## Implementation Decisions

### Stage 표시 enum 정렬 (영역 1)

- **D-01:** 사용자에게 보이는 stage 라벨은 3개(`init`/`gsd`/`superpowers`/`hookify`)로 축약한다. HANDOFF.md storage enum 5개(`init`/`gsd-plan`/`superpowers`/`review`/`hookify`)는 스키마 그대로 유지(Phase 2 D-22 lock).
- **D-02:** Storage → display 매핑 테이블:
  - `init` → `init`
  - `gsd-plan` → `gsd`
  - `superpowers` → `superpowers`
  - `review` → `superpowers`
  - `hookify` → `hookify`
- **D-03:** Next 명령 분기 로직은 **storage 5개 값 기준 그대로** 유지(현재 `commands/sg-status.md` case 블록). 표시만 축약이고, 라우팅은 정확도를 위해 5-state 그대로 가져간다. 따라서 `review` 상태에서 표시는 `Stage: superpowers`이지만 Next는 D-28 규칙대로 `/super-gsd:sg-learn`을 유지한다.

### STATE.md Phase 파싱 (영역 2)

- **D-04:** `Phase:` 라인을 만나면 콜론 뒤 전체 문자열을 trim해서 그대로 출력한다. ROADMAP.md 이름 룩업 로직(현재 `commands/sg-status.md`의 `grep "### Phase ${PHASE_NUM}:"`)은 폐기한다. STATE.md를 phase 표시의 단일 진실(single source of truth)로 삼는다.
- **D-05:** 출력 예:
  - STATE.md `Phase: 6 (sg-health) — Not started` → `Phase: 6 (sg-health) — Not started`
  - STATE.md `Phase: Not started` → `Phase: Not started`
  - STATE.md 없음 또는 `^Phase:` 라인 없음 → `Phase: (none)` (D-29 출력 형식 유지를 위한 fallback)
- **D-06:** 정규식은 토큰 1개만 캡처하는 `\S+` 형태(`^Phase:\s*(\S+)`)를 절대 쓰지 않는다 — STATE.md 연구 메모(v1.1)에서 명시된 회귀 원인. 항상 라인 끝까지 캡처: `sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//'` 같은 패턴 사용.
- **D-07:** Phase 8 `sg-start`가 동일 파싱을 추가할 때는 이 D-04~D-06 규칙을 bash 인라인으로 복제한다 (Phase 6 D-04의 "별도 헬퍼 스크립트 미도입" 노선 유지).

### 회귀 방지 (영역 4)

- **D-08:** 자동화된 테스트 자산은 추가하지 않는다(`tests/sg-status/` 디렉토리 신설 안 함). Phase 6 D-04 노선(별도 스크립트 미도입) 일관성 우선. drift 위험과 스코프 확장 리스크가 phase 가치 대비 큼.
- **D-09:** 대신 CONTEXT.md(이 문서)와 PLAN.md에 **수동 검증 시나리오 체크리스트**를 명시한다. Phase 7 작업 종료 직전 사람이 한 번 수동 실행해 회귀 없음을 확인한다.

### Skipped Areas

- **영역 3 (HANDOFF.md 파싱 헬퍼 위치 — bash vs Python):** 사용자가 명시적으로 스킵. Phase 6 D-04 정책(`commands/*.md` bash 블록만, 별도 Python/셸 헬퍼 미도입) 그대로 유지. STATE.md v1.1 research 메모의 `parse_handoff.py` 헬퍼 제안은 채택하지 않는다.

### Claude's Discretion

- `Phase: (none)` fallback 문자열의 정확한 표기(`(none)` vs `(missing)` vs 빈 문자열)는 출력 형식 D-29(정확히 3 header lines + blank + Next)를 깨지 않는 한 Claude가 결정. 권장은 `(none)` — `Last handoff: (none)` fallback과 동일 어휘를 사용해 일관성.
- 매핑 D-02의 구현 위치(case문 별도 변수 vs 출력 직전 in-line 변환)는 가독성에 따라 Claude가 결정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / Spec
- `.planning/REQUIREMENTS.md` §STATUS — STATUS-01/02/03 요건 원문 (3개 요건)
- `.planning/ROADMAP.md` §"Phase 7: Status Accuracy" — Success Criteria 3개
- `.planning/PROJECT.md` §"Current Milestone: v1.1 Reliability" — sg-status 단계 감지 정확도 milestone 목표

### Existing Code (must read before touching)
- `commands/sg-status.md` — Phase 7 수정 대상 단일 파일. 현재 bash 블록(특히 line 17 `PHASE_NUM` 추출, lines 27-41 stage 파싱, lines 68-84 Next 명령 매핑)을 D-01~D-06에 맞춰 갱신.
- `.planning/HANDOFF.md` — 5컬럼 TSV 스키마 및 현재 데이터 행 확인용(파싱 검증의 입력).
- `.planning/STATE.md` §"Current Position" — `Phase:` 라인 현재 포맷 확인(`Phase: 6 (sg-health) — Not started`).

### Prior Phase Decisions (lock — do not re-litigate)
- `.planning/phases/02-manual-handoff-status/02-CONTEXT.md` §D-22~D-29 — HANDOFF.md 스키마와 sg-status 출력 형식 lock. 특히 D-22(stage enum), D-28(Next 명령 매핑), D-29(출력 정확히 3 header lines + blank + Next).
- `.planning/phases/06-sg-health/06-CONTEXT.md` §D-04 — "`commands/sg-health.md` 파일만 생성, 별도 Python 스크립트 미도입" 결정. 본 Phase 7도 동일 노선(헬퍼 미도입) 유지.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/sg-status.md` lines 27-41: HANDOFF.md 마지막 데이터 행에서 stage(`To` 컬럼)와 timestamp 추출 로직 — 이미 STATUS-01/02를 충족하고 있다. D-01/D-02 매핑만 추가하면 됨.
- `commands/sg-status.md` lines 68-84: storage 5-state 기준 case 블록 — D-03에 따라 표시는 축약해도 이 블록은 그대로 유지.

### Established Patterns
- 명령 파일은 `---` frontmatter + `<objective>`/`<execution_context>`/`<process>`/`<success_criteria>` 구조 + bash 블록 인라인. Python/외부 셸 의존 없음(Phase 6 D-04 정책).
- 출력 형식 D-29: "정확히 3 header lines + blank + Next" — 한 줄에 들어가는 한 라인 길이는 자유.

### Integration Points
- Phase 8 sg-start가 동일 파싱(D-04~D-06)을 복제할 것 — Phase 7 작업 시 파싱 블록을 "복사 가능한" 형태로 명확히 분리해 두면 Phase 8 비용 절감.
- transcript_matcher.py와는 무관 — Phase 6 D-06에서 처리.

### Known Bug Sites
- 현재 `commands/sg-status.md` line 17: `PHASE_NUM=$(grep -E '^Phase: [0-9]' ... | awk '{print $2}')` — `Phase: Not started` 같은 비-숫자 시작 라인을 매칭하지 않아 `PHASE_NUM=""` → 출력 `Phase: ? ()` 빈괄호 형식 깨짐. D-04~D-06 규칙으로 교체 대상.

</code_context>

<specifics>
## Specific Ideas

### 수동 검증 시나리오 체크리스트 (D-09)

Phase 7 작업 종료 직전 사람이 다음 시나리오를 직접 실행해 회귀 없음을 확인한다. (자동화 자산은 D-08에 따라 추가하지 않음.)

| # | Fixture (STATE.md `Phase:` 라인 + HANDOFF.md 마지막 행) | 기대 출력 (`Phase:` 라인) | 기대 출력 (`Stage:` 라인) | 기대 출력 (`Next:` 라인) |
|---|---|---|---|---|
| 1 | `Phase: 7 (status-accuracy) — Not started` + HANDOFF.md 데이터 행 없음 | `Phase: 7 (status-accuracy) — Not started` | `Stage: init` | `/super-gsd:sg-plan 7` |
| 2 | `Phase: 6 (sg-health) — Not started` + 마지막 To=`gsd-plan` | 동일 | `Stage: gsd` | `/super-gsd:sg-execute` |
| 3 | `Phase: 6 (sg-health) — Not started` + 마지막 To=`superpowers` | 동일 | `Stage: superpowers` | `/super-gsd:sg-learn` |
| 4 | `Phase: 6 (sg-health) — Not started` + 마지막 To=`review` | 동일 | `Stage: superpowers` (D-02) | `/super-gsd:sg-learn` (D-03) |
| 5 | `Phase: 6 (sg-health) — Not started` + 마지막 To=`hookify`, Phase 7 존재 | 동일 | `Stage: hookify` | `/super-gsd:sg-plan 7` |
| 6 | `Phase: Not started` (숫자 없음) + HANDOFF.md 없음 | `Phase: Not started` (D-05 — `Not`만 잘리지 않음) | `Stage: init` | `/super-gsd:sg-plan Not` ← 주의: PHASE_NUM 비추출 시 Next 분기 처리 PLAN에서 명시할 것 |
| 7 | STATE.md 없음 | `Phase: (none)` (D-05 fallback) | `Stage: init` | `/super-gsd:sg-plan ?` 또는 PLAN에서 정의된 fallback |

검증 절차:
1. 현재 `.planning/HANDOFF.md`, `.planning/STATE.md` 백업 (`cp ... .bak`).
2. 시나리오별로 두 파일을 수동 편집.
3. Claude 세션에서 `/super-gsd:sg-status` 실행.
4. 출력이 기대값과 정확히 일치하는지 확인 (3 header lines + blank + Next 형식, D-29 위반 없음).
5. 모든 시나리오 종료 후 백업 복원.

**주의:** 시나리오 6번은 `PHASE_NUM`이 추출되지 않을 때 Next 명령의 phase 번호 placeholder를 어떻게 처리할지 PLAN.md에서 명시해야 함(현재 `sg-status.md` line 71 `init` 분기는 `$PHASE_NUM`을 그대로 끼워 넣음 → 깨질 수 있음). 가능한 처리: (a) PHASE_NUM 비어 있으면 Next를 `/super-gsd:sg-status` 재실행 권유로 fallback, (b) 비어 있으면 `/super-gsd:sg-plan` (인자 생략)으로 emit.

</specifics>

<deferred>
## Deferred Ideas

- `parse_handoff.py` 또는 `parse_handoff.sh` 헬퍼로 중앙화 — STATE.md v1.1 research 메모 제안. Phase 7 영역 3에서 사용자가 명시 스킵. Phase 8 sg-start 작업 후 bash 인라인 복제가 두 번 이상 발생하거나, drift가 실제로 관측되면 v1.2 milestone에서 재검토.
- 자동화 테스트 자산(`tests/sg-status/` fixtures + runner) — 영역 4 D-08에서 스킵. v1.2 이후 sg-status 변경 빈도가 높아지면 재검토.
- `sg-status --json` 플래그 — REQUIREMENTS.md Future Requirements (v1.2)에 이미 명시. Phase 7 스코프 아님.
- 7일 초과 stale 세션 경고 — REQUIREMENTS.md Future Requirements (v1.2).

</deferred>

---

*Phase: 7-status-accuracy*
*Context gathered: 2026-05-18*
