# Phase 8: Session Restore - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

`sg-start`이 `gsd-new-project` Skill을 invoke하기 전에 `.planning/STATE.md`와 `.planning/HANDOFF.md`를 읽어 기존 세션을 감지한다. 세션이 감지되면 milestone, phase 라인 전체, stage(display enum), last activity(절대시각), next 권장 명령을 출력한 뒤 AskUserQuestion으로 3-옵션을 제시한다: "Resume current session" / "Start new milestone" / "Cancel". Resume이면 출력만 emit하고 종료(사용자가 Next 명령 직접 실행). Start new milestone이면 `sg-new` Skill로 위임. Cancel이면 no-op 종료. 어떤 분기에서도 `.planning/HANDOFF.md`는 삭제되거나 수정되지 않는다 (SESS-04 append-only 감사 로그).

이번 phase는 `commands/sg-start.md` 한 파일 안의 본문 갱신으로 완결한다 — 별도 헬퍼 스크립트, Python 모듈, 자동화 테스트 자산은 추가하지 않는다 (Phase 6 D-04 + Phase 7 D-08 일관성). STATE.md `Phase:` 파싱과 HANDOFF.md `To` 컬럼 추출/매핑은 Phase 7 D-04~D-06의 bash 블록을 **인라인 복제** 한다 (Phase 7 D-07 사전 lock — drift 시 양쪽 동시 수정).

세션 감지 트리거는 STATE.md 존재 + `Phase:` 라인 캡처 가능을 단일 기준으로 한다. HANDOFF.md 데이터 행이 0개라도 (init stage라도) 기존 세션으로 본다. PROJECT.md만 있는 부분 초기화 상태는 감지 트리거가 아니다 (gsd-new-project 미완료 보호).

</domain>

<decisions>
## Implementation Decisions

### 세션 감지 임계값 (영역 1)

- **D-01:** 기존 세션 감지의 단일 트리거는 `.planning/STATE.md` 존재 + 그 안에서 `^Phase:` 라인 캡처 가능이다. PROJECT.md만 단독으로 존재할 경우 감지하지 않는다 (gsd-new-project 중단 보호).
- **D-02:** HANDOFF.md 데이터 행이 0개여도 (Stage가 `init`이어도) STATE.md 조건이 충족되면 "기존 세션 있음"으로 분류한다. 사용자가 PROJECT.md/REQUIREMENTS.md/ROADMAP.md를 만든 시점부터 세션이 시작된 것으로 본다.
- **D-03:** STATE.md `Phase:` 라인 파싱은 Phase 7 D-04~D-06 규칙을 **bash 인라인으로 복제**한다 (Phase 7 D-07 lock). `^Phase:[[:space:]]*` 제거 + 끝 공백 trim. `\S+` 단일 토큰 캡처 절대 금지.

### 표시 정보의 깊이와 형식 (영역 2)

- **D-04:** Resume 안내 표시 정보는 5개 라인이다 (요건 SESS-02 + 선택 정보):
  1. `Milestone: {STATE.md frontmatter milestone + milestone_name}`
  2. `Phase: {STATE.md Phase 라인 콜론 뒤 전체}` — Phase 7 D-05 동일 형식
  3. `Stage: {display enum}` — Phase 7 D-01/D-02 매핑(`init`/`gsd`/`superpowers`/`hookify`/`ship`/`complete`) 재사용
  4. `Last activity: {ISO 8601 절대시각}` — bash 이식성을 위해 상대시각 환산 금지
  5. `Next: {권장 명령}` — sg-status와 동일한 D-28 매핑 사용
- **D-05:** sg-status의 D-29 lock(정확히 3 header lines + blank + Next)은 sg-status 전용이다. sg-start는 별도 명령이므로 자체 포맷을 가진다 — 위 5개 라인 + 상단 인지 헤더("Existing session detected.") + AskUserQuestion 호출.
- **D-06:** Last activity 시각은 **HANDOFF.md 마지막 데이터 행의 Timestamp**(ISO 8601 UTC)를 우선 사용하고, HANDOFF.md 데이터 행이 0개이면 **STATE.md frontmatter `last_updated` 또는 `last_activity`**로 fallback한다. 둘 다 없으면 `(unknown)`로 표시.
- **D-07:** Milestone 표시: STATE.md frontmatter의 `milestone`(예: `v1.1`)과 `milestone_name`(예: `Reliability`)을 결합(`v1.1 Reliability`). frontmatter 파싱 실패 시 `(unknown)`.

### Resume 시 분기 동작 (영역 3)

- **D-08:** Resume 선택 시 sg-start는 위 5개 라인을 그대로 emit하고 즉시 종료한다. 자동 Skill invoke 없음. 사용자가 출력 Next 라인의 명령을 직접 실행한다.
- **D-09:** sg-execute의 hybrid handoff 패턴(02-02 D-19/D-20: 구조화 prompt + 동일 턴 Skill invoke)은 sg-start에서 차용하지 않는다. sg-execute는 phase plan 완성 → execute 진행의 인과가 강하지만, sg-start의 resume은 사용자가 plan을 다시 읽고 싶을 수도 있어 인과가 약하다. 사용자 의사결정 권한 보존이 우선.

### 사용자 질의 UI (영역 4)

- **D-10:** Resume vs Start new milestone vs Cancel 선택은 **AskUserQuestion** 인터랙티브 단독으로 받는다. Argument 분기(`--resume`/`--fresh`) 미도입.
- **D-11:** 비-Claude 런타임(Codex, Gemini CLI 등)에서는 워크플로우 표준대로 텍스트 모드 numbered list로 자동 fallback한다 (별도 구현 필요 없음 — discuss-phase workflow와 동일 패턴).
- **D-12:** AskUserQuestion 호출 시 header는 `"Session"`, question은 영문(`"Existing session detected. What do you want to do?"`), options는 3개:
  - `"Resume"` — Show next command and exit
  - `"Start new milestone"` — Delegate to /super-gsd:sg-new
  - `"Cancel"` — Exit without changes

### Fresh 분기 재정의 (영역 5)

- **D-13:** "Fresh" 라벨은 사용하지 않는다. 모호성(새 milestone? 프로젝트 폐기?) 제거. 3-옵션 명시: Resume / Start new milestone / Cancel.
- **D-14:** "Start new milestone" 선택 시 `Skill(skill="gsd-new-milestone")`로 위임한다 (sg-new 명령의 매핑과 동일). args는 빈 문자열 — sg-new 자체가 milestone 정보를 내부에서 처리.
- **D-15:** "Cancel" 선택 시 sg-start는 단일 라인 `Cancelled. No changes made.`를 emit하고 종료. 어떤 파일도 read/write 하지 않는다.
- **D-16:** **세 옵션 모두 `.planning/HANDOFF.md`를 read-only로만 접근한다** — SESS-04(append-only 감사 로그) 자연 충족. Resume도 emit만, Start new milestone도 sg-new에 위임, Cancel도 no-op.

### 기존 세션 미감지 시 동작

- **D-17:** STATE.md가 없거나 `^Phase:` 라인을 캡처할 수 없는 경우(= D-01 트리거 미충족), sg-start는 기존 동작을 그대로 유지한다 — `Skill(skill="gsd-new-project", args="$ARGUMENTS")` 호출. `$ARGUMENTS`의 project-name 패스스루도 변경 없음.

### Claude's Discretion

- 안내 헤더 문자열(`"Existing session detected."` vs 한글 `"기존 세션이 감지되었습니다."` 등) — `.planning/PROJECT.md`/CHANGELOG가 한영 혼용 정책(영문 OSS surface + 한글 내부 문서)을 따르고 있다. sg-start 출력은 사용자 인터페이스이므로 PROJECT.md 영문 정책에 맞춰 영문이 기본 권장이지만, Claude가 PLAN.md에서 정확한 문자열을 최종 결정.
- 5개 표시 라인의 정렬(좌측 정렬 vs 라벨 너비 통일) — sg-health(D-05) 패턴 참고하되 한 줄 길이 통일 도트 채움(`...`)은 강제하지 않음.
- "Last activity" fallback 표기(`(unknown)` vs `(none)` vs 빈 문자열) — sg-status의 `(none)` 어휘와 일관성 유지 권장이지만, Claude 재량.
- AskUserQuestion option description 문구 세부 표현.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / Spec
- `.planning/REQUIREMENTS.md` §SESSION — SESS-01/02/03/04 요건 원문 (4개 요건)
- `.planning/ROADMAP.md` §"Phase 8: Session Restore" — Success Criteria 4개
- `.planning/PROJECT.md` §"Current Milestone: v1.1 Reliability" — 세션 복원 milestone 목표 및 비침투적 orchestrator 원칙

### Existing Code (must read before touching)
- `commands/sg-start.md` — Phase 8 수정 대상 단일 파일. 현재는 `Skill(gsd-new-project)`만 invoke. D-01~D-17 로직을 process 블록에 삽입.
- `commands/sg-status.md` lines 14-49 — STATE.md `Phase:` 파싱 블록(D-03 복제 원본) + HANDOFF.md 마지막 행 파싱 + storage→display enum 매핑(D-04 Stage 라인의 원본).
- `commands/sg-status.md` lines 76-100 — Stage별 Next 명령 매핑(D-04 Next 라인의 원본 = D-28 lock 구현).
- `.planning/STATE.md` — frontmatter 구조(milestone, milestone_name, last_updated, last_activity) 및 Current Position 섹션의 `Phase:` 라인 형식 확인.
- `.planning/HANDOFF.md` — 5컬럼 TSV 스키마 및 마지막 데이터 행 Timestamp/To 컬럼 확인.

### Prior Phase Decisions (lock — do not re-litigate)
- `.planning/phases/02-manual-handoff-status/02-CONTEXT.md` §D-22, D-26, D-28, D-29 — HANDOFF.md 스키마/append-only/Next 매핑/sg-status 출력 형식 lock. sg-start는 HANDOFF.md를 read-only로만 접근 — append-only 정책 위반 없음.
- `.planning/phases/06-sg-health/06-CONTEXT.md` §D-04 — `commands/*.md` 파일만, 별도 Python/셸 헬퍼 미도입. Phase 8 동일 노선.
- `.planning/phases/07-status-accuracy/07-CONTEXT.md` §D-01~D-07 — Stage display enum 매핑, STATE.md `Phase:` 파싱 규칙. **D-07이 명시적으로 Phase 8 sg-start의 인라인 복제를 사전 lock**.
- `.planning/phases/07-status-accuracy/07-CONTEXT.md` §D-08 — 자동화 테스트 자산 미도입. Phase 8 동일 노선.

### Skill Reference
- `$HOME/.claude/skills/gsd-new-project/SKILL.md` 및 `$HOME/.claude/get-shit-done/workflows/new-project.md` line 118 — `project_exists=true`일 때 에러로 멈추는 동작 확인(D-17 분기 정당화의 근거).
- `$HOME/.claude/skills/gsd-new-milestone/` (sg-new 매핑) — D-14에서 위임 대상.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/sg-status.md` lines 14-49 + 76-100: STATE.md `Phase:` 파싱 + HANDOFF.md 마지막 행 추출 + storage→display 매핑 + Stage→Next 명령 매핑 — D-03/D-04/D-05의 4개 라인(Phase/Stage/Last activity/Next) 모두 이 블록의 인라인 복제로 충족된다. Phase 7 D-07이 사전 lock한 복제 패턴.
- `commands/sg-start.md` 현재 구조: frontmatter + `<objective>`/`<execution_context>`/`<process>`/`<success_criteria>` 4섹션. 본 phase에서 `<process>`만 확장한다 — argument-hint도 변경하지 않음(D-17).

### Established Patterns
- 명령 파일은 bash 블록 인라인 + 마지막에 Skill invoke (sg-execute, sg-quick 패턴). 별도 Python/외부 셸 의존 없음 (Phase 6 D-04 lock).
- STATE.md frontmatter는 YAML — bash에서 `grep -E '^milestone:' | sed -E 's/^milestone:[[:space:]]*//'` 같은 라인 단위 파싱으로 충분. yq 등 외부 도구 의존 금지.
- AskUserQuestion 후 옵션 분기는 if/case 블록으로 처리 (discuss-phase 자체가 같은 패턴).
- 모든 사용자 출력은 D-29와 호환되어야 한다는 제약은 sg-status에만 적용. sg-start는 자체 포맷(D-05).

### Integration Points
- sg-start ↔ sg-status: STATE.md/HANDOFF.md 파싱 블록을 양쪽에서 인라인 복제한다. 한쪽이 바뀌면 다른 쪽도 동시 수정(Phase 7 D-07).
- sg-start ↔ sg-new (gsd-new-milestone Skill): "Start new milestone" 분기에서 위임. args는 빈 문자열.
- sg-start ↔ gsd-new-project Skill: STATE.md 미감지 시(D-17) 기존 호출 그대로 유지 — 후방 호환.

### Known Risk Sites
- `gsd-new-project` 워크플로우 line 118: `project_exists=true`면 Error로 종료. 본 phase의 D-17 분기(STATE.md 미감지 시 gsd-new-project 호출)가 실제 동작하려면 `project_exists`의 정의가 STATE.md/PROJECT.md/REQUIREMENTS.md 중 하나라도 있으면 true가 되어야 한다(추정). 만약 `project_exists`가 STATE.md만 본다면 D-01 트리거와 동등하므로 문제 없음. 만약 PROJECT.md만 본다면 "PROJECT.md만 있고 STATE.md 없음" 케이스에서 D-17 분기 → gsd-new-project 에러 발생 가능. PLAN.md에서 `project_exists` 정의를 확인하고 D-17 분기를 보강할지 결정.
- STATE.md frontmatter 파싱은 YAML 손상 시 silent fail 가능 — Phase 6 D-04(sg-health)가 STATE.md frontmatter 파싱 검증을 담당하므로, sg-start는 파싱 실패 시 `(unknown)` fallback으로 끝내고 별도 진단 메시지 미출력 (책임 분리).

</code_context>

<specifics>
## Specific Ideas

### sg-start 출력 예시 (D-04 라인 구성 검증용)

현재 프로젝트 상태(`v1.1 Reliability`, Phase 7 status-accuracy 진행 중, HANDOFF.md 마지막 행 `2026-05-19T15:13:29Z | 07-status-accuracy | hookify | complete | -`)에서 sg-start 실행 시 기대 출력:

```
Existing session detected.

Milestone: v1.1 Reliability
Phase: 6 (sg-health) — Not started
Stage: complete
Last activity: 2026-05-19T15:13:29Z
Next: /super-gsd:sg-new

[AskUserQuestion: Session — Resume / Start new milestone / Cancel]
```

`Phase:` 라인은 STATE.md `Phase: 6 (sg-health) — Not started`를 콜론 뒤 전체 그대로(Phase 7 D-05).
`Stage:` 라인은 storage `complete` → display `complete` 매핑(Phase 7 D-02).
`Next:` 라인은 sg-status의 Stage=complete 분기와 동일(`/super-gsd:sg-new`).

### 수동 검증 시나리오 체크리스트 (Phase 7 D-09 일관성)

자동 테스트 자산(D-08) 미도입을 유지하므로, PLAN.md에 다음 수동 시나리오 체크리스트를 포함한다:

| # | STATE.md 상태 | HANDOFF.md 상태 | AskUserQuestion 선택 | 기대 동작 |
|---|---|---|---|---|
| 1 | 없음 | 없음 | (질의 없음) | `gsd-new-project` Skill invoke (D-17 — 기존 동작) |
| 2 | 있음 (`Phase: 1 (...)`) | 데이터 행 0개 | Resume | 5개 라인 emit, Stage=`init`, Next=`/super-gsd:sg-plan 1`, 종료 |
| 3 | 있음 (`Phase: 6 ...`) | 마지막 To=`hookify` | Resume | 5개 라인 emit, Stage=`hookify`, Next=`/super-gsd:sg-ship`, 종료 |
| 4 | 있음 (`Phase: 6 ...`) | 마지막 To=`complete` | Start new milestone | 5개 라인 emit 후 `Skill(gsd-new-milestone)` invoke |
| 5 | 있음 (`Phase: 7 ...`) | 마지막 To=`review` | Cancel | `Cancelled. No changes made.` 한 줄 emit, 종료 |
| 6 | 있음 (`Phase: Not started`) | 없음 | Resume | 5개 라인 emit, `Phase: Not started`(D-03 토큰 자르기 회귀 없음), Stage=`init` |
| 7 | 있음 | 손상된 마지막 행(스키마 위반) | (선택 불문) | sg-status와 동일하게 stderr 메시지 + exit (sg-health 책임 영역과 일관) |

검증 절차:
1. `.planning/STATE.md`, `.planning/HANDOFF.md` 백업.
2. 시나리오별 두 파일 수동 편집.
3. `/super-gsd:sg-start` 실행 후 출력/분기 확인.
4. **`.planning/HANDOFF.md`의 행 개수가 실행 전/후 동일한지 확인** (SESS-04 검증).
5. 모든 시나리오 종료 후 백업 복원.

### Argument 패스스루 (D-17)

`$ARGUMENTS`(project-name)는 STATE.md 미감지 시 `gsd-new-project`에 그대로 전달한다 — 현재 sg-start의 동작 완전 보존. STATE.md 감지 시에는 `$ARGUMENTS`를 무시한다 (resume/new-milestone/cancel 어디서도 의미 없음).

</specifics>

<deferred>
## Deferred Ideas

- **상대시각 표시**("3일 전") — D-06에서 절대시각으로 결정. v1.2에서 bash 이식성 보장 패턴이 검증되면 재검토.
- **Argument 기반 비대화형 모드**(`sg-start --resume`/`--cancel`) — D-10에서 인터랙티브 단독 결정. CI/스크립팅 수요가 실제로 발생하면 v1.2에서 추가 검토.
- **7일 초과 stale 세션 경고** — REQUIREMENTS.md Future Requirements (v1.2)에 이미 명시. Phase 8 스코프 아님.
- **서브디렉토리에서 실행 시 `.planning/` 자동 탐색**(cwd walk-up) — REQUIREMENTS.md Future Requirements (v1.2).
- **`sg-status --json` 플래그** — Future Requirements (v1.2), Phase 7 deferred에도 명시.
- **자동화 테스트 자산**(`tests/sg-start/` fixtures + runner) — D-08(Phase 7) 노선 유지로 미도입. v1.2 이후 변경 빈도 증가 시 재검토.
- **세션 폐기/리셋 기능**(현재 milestone 강제 종료 + 새 시작) — 의도적으로 스코프 밖. SESS-04(append-only)와 충돌 위험 큼.

</deferred>

---

*Phase: 8-session-restore*
*Context gathered: 2026-05-20*
