# Phase 18: sg-parallel-execute 스킬 + 라우팅 - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 18은 두 가지를 구현한다:
1. `skills/sg-parallel-execute/SKILL.md` 신규 생성 — `parallel_groups.json`을 읽어 각 그룹을 Task()로 병렬 디스패치하는 스킬
2. `commands/sg-execute.md` Step 9 활성화 — Phase 17이 삽입한 TODO 플레이스홀더를 실제 `Skill()` 호출로 교체

Phase 19(결과 통합 + 회귀 테스트)는 범위 밖이다.
HANDOFF.md 기록, idempotency 검사, lessons 주입 로직은 건드리지 않는다.

</domain>

<decisions>
## Implementation Decisions

### D-01: SKILL.md 입력 인터페이스
- **결정:** `$ARGUMENTS`로 `parallel_groups.json`의 **파일 경로**를 받는다
- **이유:** Phase 17 CONTEXT.md의 "PARALLEL_GROUPS 전달 방식" 결정과 일치. sg-execute.md Step 9의 TODO 주석이 `args="$GROUPS_JSON_FILE"` 형태로 이미 설계되어 있음. 파일 경로 전달이 환경변수나 인라인 JSON보다 디버깅 용이.

### D-02: 병렬 Task() 디스패치 구조
- **결정:** SKILL.md가 `parallel_groups.json`을 읽어 그룹 목록을 파악한 후, **에이전트 수 = min(GROUP_COUNT, 3)** 개의 Task()를 동시(병렬)로 호출한다
- **이유:** TE-03a 요건 (에이전트 수 자동 결정, 상한 3개). Claude Code 병렬 에이전트는 동일 응답 내에서 여러 TaskCreate 호출로 구현.
- **상한 3 적용 방식:** GROUP_COUNT > 3이면 wave 번호 오름차순으로 앞 3개 그룹만 병렬 실행하고, 나머지는 그 후 순차적으로 처리한다 (v1.4 범위 내에서 가장 단순한 전략).

### D-03: 병렬 에이전트 내부 실행 내용
- **결정:** 각 에이전트는 `superpowers:executing-plans` **호출 금지**. 대신 해당 그룹의 PLAN.md 파일들을 직접 읽어 태스크를 실행하는 **bare Task() 프롬프트**를 구성한다
- **이유:** TE-02b 요건. `superpowers:executing-plans`는 STATE.md 쓰기 + `finishing-a-development-branch` 실행을 포함하므로 N개 에이전트가 동시 호출하면 race condition + N번 마무리 실행 발생.
- **에이전트 프롬프트 구조:**
  ```
  Execute the following plan(s) for Phase {PHASE_NUM}.
  Non-invasive rule: do NOT modify GSD/Superpowers files.
  Do NOT call superpowers:executing-plans.
  Do NOT write to .planning/HANDOFF.md.
  Do NOT update .planning/STATE.md.

  Plans to execute:
  {PLAN_MD_BODY for each plan in group}
  ```

### D-04: sg-execute.md Step 9 TODO 활성화
- **결정:** Phase 17이 삽입한 블록을 수정한다:
  - `# TODO Phase 18: Skill(skill="sg-parallel-execute", args="$GROUPS_JSON_FILE")` 주석 라인을 실제 `Skill()` 호출로 교체
  - 임시 폴백 echo 메시지 4줄(`echo "현재 Phase 17..."` 등)을 제거
  - `echo "임시로 기존 순차 실행 경로로 폴백합니다."` 제거
  - 병렬 경로가 활성화되면 `if [ -n "$PARALLEL_GROUPS" ]` 블록 안에서 Skill 호출 후 **return** (기존 순차 경로로 흘러가지 않아야 함)
- **이유:** Phase 18의 핵심 목표 — 플레이스홀더 → 실제 실행.

### D-05: SKILL.md 파일 위치
- **결정:** `skills/sg-parallel-execute/SKILL.md`
- **이유:** 기존 `skills/sg-retro/SKILL.md` 패턴과 동일 구조. plugin.json `skills_dir: "skills"` 기준.

### D-06: GROUP_COUNT 결정 시점
- **결정:** SKILL.md가 `parallel_groups.json`을 읽어 배열 길이로 GROUP_COUNT를 직접 계산한다. sg-execute에서 SKILL args로 GROUP_COUNT를 별도로 전달하지 않는다
- **이유:** 단일 진실 원칙 — JSON 파일 자체가 권위 있는 소스. 중복 전달은 불일치 위험.

### D-07: SKILL.md의 에러 처리
- **결정:** `parallel_groups.json`이 없거나 파싱 실패 시 명확한 오류 메시지 출력 후 종료. 자동 폴백 없음 (오케스트레이터 sg-execute가 폴백 결정권 보유)
- **이유:** 스킬은 폴백 로직 없이 단순하게 유지. sg-execute Step 9가 PARALLEL_GROUPS 비어있을 때 폴백을 이미 처리함.

### Claude's Discretion
- Task() 프롬프트의 정확한 언어(한글/영문 혼용 비율)는 구현 시 판단
- `parallel_groups.json` JSON 파싱 방법 (Python 인라인 vs jq vs Read tool) — Read tool 사용이 가장 self-contained하므로 권장
- SKILL.md 내에서 PLAN.md 파일 경로를 어떻게 resolve할지 (PHASE_DIR는 JSON 내 plan 파일명에서 추론 가능)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 18 설계 기반
- `.planning/ROADMAP.md` §Phase 18 — Goal, Success Criteria, Requirements (TE-02a, TE-02b, TE-03a)
- `.planning/REQUIREMENTS.md` — TE-02a, TE-02b, TE-03a 원문 요건
- `.planning/phases/17-plan-md-dependency-analysis/17-CONTEXT.md` — Phase 17 결정사항 (PARALLEL_GROUPS 전달 방식, parallel_groups.json 스키마, Step 9 TODO 위치)

### 수정 대상 파일
- `commands/sg-execute.md` — Step 9 TODO 블록 위치 및 현재 구조 파악 필수 (특히 `if [ -n "$PARALLEL_GROUPS" ]` 블록)
- `skills/sg-retro/SKILL.md` — SKILL.md 구조 패턴 참조 (frontmatter + `<objective>` + `<process>`)

### 신규 생성 대상
- `skills/sg-parallel-execute/SKILL.md` — 이 Phase에서 신규 생성

### 아키텍처 제약
- `.claude-plugin/plugin.json` — skills_dir 확인 (현재 `"skills"`)
- `CLAUDE.md` §Architecture — Non-invasive 원칙, GSD/Superpowers 파일 수정 금지

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/sg-retro/SKILL.md`: SKILL.md frontmatter 구조 (`name`, `description`), `<objective>` + `<process>` 블록 패턴. Phase 18 SKILL.md도 동일 구조를 따른다.
- `commands/sg-execute.md` Step 8.5: `parallel_groups.json` 생성 로직. Phase 18 스킬이 소비하는 JSON 스키마: `[{"wave": N, "plans": ["NN-01-PLAN.md"], "merged": false}, ...]`

### Established Patterns
- **SKILL.md 자체완결성:** sg-retro처럼 `<execution_context>` 섹션에 읽어야 할 파일 목록 명시. 외부 workflow 파일 import 없이 self-contained.
- **bash-heavy 구현:** sg-execute.md처럼 bash 스니펫으로 파일 접근. SKILL.md도 동일 패턴 사용 가능.
- **Read tool 우선:** sg-retro는 실제 파일 내용이 필요할 때 Read tool 사용. parallel_groups.json 읽기도 동일 방식.

### Integration Points
- **sg-execute.md Step 9 → SKILL:** `if [ -n "$PARALLEL_GROUPS" ]` 블록 내 TODO 위치가 Skill() 호출 지점. `GROUPS_JSON_FILE` 변수에 파일 경로가 저장되어 있음.
- **parallel_groups.json → SKILL.md:** SKILL은 `$ARGUMENTS`로 받은 파일 경로를 Read tool로 읽어 그룹 목록 파악.
- **SKILL.md → Task() 호출:** Claude Code의 병렬 에이전트 디스패치. 동일 응답 내 복수 Task() 호출.

### parallel_groups.json 스키마 예시
```json
[
  {"wave": 1, "plans": ["18-01-PLAN.md"], "merged": false},
  {"wave": 1, "plans": ["18-02-PLAN.md"], "merged": false}
]
```
각 그룹의 `plans` 배열 내 파일명은 `$PHASE_DIR/` 기준 상대 경로이다.

</code_context>

<specifics>
## Specific Ideas

- **병렬 에이전트 격리 원칙:** 각 에이전트는 HANDOFF.md, STATE.md를 건드리지 않는다. 오케스트레이터(sg-execute → Phase 19)가 사후 정리. 이 격리가 TE-04a의 전제조건.
- **SKILL.md 내 Task() 구조:** Claude Code는 동일 메시지 내에서 병렬 Task() 실행을 지원. SKILL.md의 `<process>` 섹션에서 "N개 Task를 동시 실행" 지시로 충분 (Python TaskCreate API 불필요, Skill 지시문으로 동작).
- **Step 9 if 블록 종료:** 병렬 경로 진입 시 `Skill()` 호출 직후 Step 9 이후 로직이 실행되면 안 된다. Skill() 호출이 세션 제어를 스킬로 이전하므로 자연히 종료됨. 별도 exit 불필요.

</specifics>

<deferred>
## Deferred Ideas

- **worktree 격리:** 병렬 에이전트별 git worktree 격리 — REQUIREMENTS.md에서 v1.4 이후로 명시 연기
- **자동 재시도 로직:** 실패 에이전트 자동 재시도 — Phase 19 이후 고려
- **GROUP_COUNT > 3 처리:** wave 오름차순 앞 3개 외의 그룹 처리 전략 고도화 — Phase 19에서 결과 통합 시 검토
- **HANDOFF.md 기록 (병렬 완료 후):** Phase 19 범위. Phase 18은 에이전트 디스패치까지만.

</deferred>

---

*Phase: 18-sg-parallel-execute*
*Context gathered: 2026-05-21*
