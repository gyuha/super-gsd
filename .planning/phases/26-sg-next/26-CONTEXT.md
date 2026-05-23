# Phase 26: sg-next 스킬 구현 - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

`skills/sg-next/SKILL.md` 신규 생성 — HANDOFF.md + STATE.md를 읽어 현재 단계를 감지하고, sg-status의 라우팅 테이블로 다음 sg-* 명령을 결정한 뒤, 1줄 출력 후 확인 없이 즉시 Skill()로 invoke한다.

구체적으로:
1. **단계 감지** — HANDOFF.md 마지막 행의 `To` 컬럼 + STATE.md `Phase:` 라인으로 현재 stage와 phase 파악
2. **라우팅** — sg-status와 동일한 stage → next-command 매핑으로 다음 명령 결정
3. **즉시 invoke** — `→ /super-gsd:sg-[cmd]` 1줄 출력 후 Skill() 호출
4. **모호한 분기** — `complete` 또는 `init` 상태에서만 AskUserQuestion으로 선택지 제시
5. **HANDOFF 기록** — invoke 전에 `To: sg-next` 행 append

새로운 플래그 추가, sg-status 라우팅 테이블 변경, GSD/Superpowers 내부 파일 수정은 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### Idempotency

- **D-01:** sg-next는 중복 방지 없이 매번 invoke한다. sg-next는 상태 라우터이지 실행 단위가 아니므로, 같은 단계에서 두 번 호출하면 두 번 invoke된다. plan hash 기반 중복 방지(sg-execute 패턴)는 적용하지 않는다.

### complete/init 분기 선택지

- **D-02:** `complete`와 `init` 상태 모두 동일한 AskUserQuestion을 제시한다. 상태별로 다른 선택지를 만들지 않는다.
- **D-03:** 선택지 내용은 상황별 추천 명령을 직접 제시한다. sg-start 스타일(Resume/Start new milestone)이 아니라, 실행 가능한 다음 명령 자체를 선택지로 구성한다. 예시:
  - `complete` 상태: "sg-new 실행 (새 마일스톤 시작)" / "취소"
  - `init` 상태 (phase 번호 있음): "sg-plan [N] 실행" / "취소"
  - `init` 상태 (phase 번호 없음): "sg-plan 실행" / "취소"

### HANDOFF append 타이밍

- **D-04:** HANDOFF.md `To: sg-next` 행은 Skill() invoke **전**에 기록한다. 기존 sg-execute, sg-review, sg-learn의 패턴과 일치한다. invoke 실패 시에도 감사 로그에 기록이 남는 것이 올바른 동작이다.

### sg-status 라우팅 코드 재사용

- **D-05:** sg-status SKILL.md의 HANDOFF 파싱 블록 + storage→display enum 매핑 + stage→next-command case 블록 **전체를 그대로 복제**한다. D-07 inline-replication 패턴을 따른다. 복제 블록 상단에 "skills/sg-status/SKILL.md 복제 — drift 시 양쪽 동시 수정" 주석을 명시한다.
- **D-06:** sg-status의 출력을 파싱하는 방식(B안)은 사용하지 않는다. 텍스트 파싱은 포맷 변경에 취약하다.

### SKILL.md 구조 (이전 Phase에서 이어받음)

- YAML frontmatter + `<objective>` / `<execution_context>` / `<process>` / `<success_criteria>` 블록 구조 (v2.0 Phase 22 확립)
- description 포맷: `"Use this when [상황] — [동작]."` 단일 줄, 상황 기반 (v2.1 Phase 25 D-03/D-04)
- plugin.json에 별도 등록 불필요 — skills/ 자동 스캔으로 인식

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 라우팅 로직 원본 (복제 기준)

- `skills/sg-status/SKILL.md` — HANDOFF 파싱 블록(lines 17-21), storage→display enum 매핑, stage→next-command case 블록 전체. D-05에 따라 이 파일의 코드를 그대로 복제한다. **반드시 읽고 복제 범위를 확인할 것.**

### 요구사항

- `.planning/REQUIREMENTS.md` — NEXT-01~05 요구사항 정의. 5개 요건 모두 이 Phase에서 충족해야 한다.
- `.planning/ROADMAP.md` §Phase 26 — Success Criteria 5개 (SKILL.md 존재, 라우팅 동일, 1줄 출력 후 invoke, complete/init AskUserQuestion, HANDOFF append)

### 패턴 참조

- `skills/sg-start/SKILL.md` — D-07 inline-replication 적용 예시. STATE.md Phase 파싱 블록을 sg-status에서 복제한 실제 사례.
- `skills/sg-execute/SKILL.md` — HANDOFF append 패턴 (invoke 전 기록, Plan Hash 컬럼 처리) 참조.
- `.planning/HANDOFF.md` — append-only 스키마. 5컬럼 파이프 테이블. sg-next 행의 `Plan Hash` 컬럼은 `-` (해당 없음)로 기록.

### SKILL.md 작성 기준

- `.planning/phases/25-fix-and-verify/25-CONTEXT.md` — description 포맷 결정 (D-02~D-04). `"Use this when [상황] — [동작]."` 패턴.
- `.planning/phases/24-skills/24-RESEARCH.md` — GOOD 등급 기준 정의.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `skills/sg-status/SKILL.md` HANDOFF 파싱 블록 — `grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | tail -1` + `awk -F'|'` 패턴. sg-next에 그대로 복제.
- `skills/sg-status/SKILL.md` STATE.md Phase 파싱 블록 (lines 17-21) — D-07 locked inline-replication 블록. `grep -E '^Phase:'` + `sed` + `awk '{print $1}'` 파이프라인.
- `skills/sg-status/SKILL.md` stage→next-command case 블록 — 11개 stage 분기 (`init`, `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `hookify`, `ship`, `complete`). 그대로 복제.

### Established Patterns

- **D-07 inline-replication**: 코드 블록 복제 시 상단/하단에 `# --- BEGIN {name} block ---` / `# --- END {name} block ---` 주석 + "drift 시 양쪽 동시 수정" 명시.
- **HANDOFF append**: `echo "| $(date -u +%Y-%m-%dT%H:%M:%SZ) | ... |" >> .planning/HANDOFF.md` — 파이프 구분 5컬럼. sg-next의 Plan Hash 컬럼은 `-`.
- **Skill() invoke**: `Skill(skill='super-gsd:sg-[cmd]', args='...')` 형식.
- **AskUserQuestion**: header 12자 이하. `complete`/`init` 분기 모두 동일 AskUserQuestion 사용 (D-02).

### Integration Points

- `skills/sg-next/SKILL.md` 신규 생성 → plugin.json 수정 불필요 (skills/ 자동 스캔)
- HANDOFF.md append → append-only 원칙 유지. 기존 행 수정 금지.
- stage enum 허용값: `init`, `gsd-plan`, `ui-plan`, `superpowers`, `parallel`, `execute`, `review`, `sg-retro`, `hookify`, `ship`, `complete` — sg-status SKILL.md의 case 블록에 정의된 그대로.

</code_context>

<specifics>
## Specific Ideas

### HANDOFF append 형식 (sg-next 행)

```
| 2026-05-23T00:00:00Z | 26-sg-next | [STAGE_RAW] | sg-next | - |
```

- `From` 컬럼: invoke 시점의 `STAGE_RAW` 값
- `To` 컬럼: `sg-next` (고정)
- `Plan Hash` 컬럼: `-` (sg-next는 plan을 실행하는 명령이 아님)

### complete/init AskUserQuestion 예시

`complete` 상태:
```
header: "sg-next"
question: "현재 Phase가 완료 상태입니다. 다음 단계를 선택하세요."
options: ["sg-new 실행 (새 마일스톤 시작)", "취소"]
```

`init` 상태 (PHASE_NUM 있음):
```
header: "sg-next"
question: "현재 단계를 감지할 수 없습니다 (init). 다음 단계를 선택하세요."
options: ["sg-plan [N] 실행", "취소"]
```

### 1줄 출력 형식

invoke 전 출력:
```
→ /super-gsd:sg-execute
```

</specifics>

<deferred>
## Deferred Ideas

- **플래그 추가 (`--dry-run`, `--force`)** — "어떤 명령이 실행될지만 보여주는 dry-run 모드" 아이디어가 있으나, REQUIREMENTS.md에 "zero-flag 단순 invoke"로 명시됨. v2.3 이후 검토.
- **complete/init 각각 다른 선택지** — 맥락별로 더 자연스러운 선택지를 줄 수 있으나, 구현 단순화를 위해 같은 선택지로 결정. 실제 사용 후 혼란이 발생하면 재검토.

</deferred>

---

*Phase: 26-sg-next*
*Context gathered: 2026-05-23*
