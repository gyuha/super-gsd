# Phase 46: sg-use-tdd 토글 + 마커 - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

이 단계는 **TDD 모드 토글 명령 하나**를 제공한다. 새 스킬 `sg-use-tdd`(+`.agents/` 미러)를 만들고, `.planning/USE-TDD` 마커 파일을 생성/삭제하여 TDD 모드 상태를 표현한다. 마커의 **존재 = TDD 모드 ON**, **부재 = OFF**(기존 워크플로우 변경 없음).

이 단계가 다루는 것은 **토글과 마커 관리뿐이다.** 마커를 읽어 실제 동작을 바꾸는 일(sg-execute의 핸드오프 프롬프트 주입, sg-review의 실패 루프)은 Phase 47의 책임이다. Superpowers `test-driven-development` 스킬은 이 단계에서 **재사용 대상조차 아니다** — 마커 파일만 다룬다.

흐름:
```
sg-use-tdd [on|off|무인자] → 인자 해석 → .planning/ 보장(mkdir -p)
  ├─ on    → 마커 생성(있으면 그대로) → "TDD ON" 출력
  ├─ off   → 마커 삭제(없으면 그대로) → "TDD OFF" 출력
  └─ 무인자 → 현재 상태 출력 → 토글(있으면 삭제, 없으면 생성)
```

</domain>

<decisions>
## Implementation Decisions

### 명령 인터페이스 (TDD-01, TDD-02)
- **D-01:** 명령은 `/super-gsd:sg-use-tdd`. 마커 파일 경로는 `.planning/USE-TDD`. 마커의 **존재 여부만**으로 모드를 판정한다(presence-only). 부재 시 기존 동작은 일절 변경되지 않는다.
- **D-02:** 인자 의미론 — `on` → 현재 상태와 무관하게 마커 **생성**, `off` → 현재 상태와 무관하게 마커 **삭제**, **무인자** → 현재 상태(ON/OFF)를 먼저 출력한 뒤 토글한다.
- **D-03:** Idempotent — 같은 목표 상태로 여러 번 호출해도 오류 없이 완료된다. `on`을 두 번 호출 = 두 번째는 이미 존재하므로 무변경 성공, `off`를 두 번 호출 = 두 번째는 이미 부재하므로 무변경 성공.

### 마커 파일 (TDD-01, 그릴링 결정)
- **D-04:** 마커 파일 내용 = **최소 사람-가독 메타데이터** — 짧은 설명 한 줄 + 활성화 타임스탬프. Phase 47의 감지는 **존재 여부만** 보므로 내용은 감지에 영향을 주지 않는다(내용은 사람을 위한 주석일 뿐).
- **D-05:** `.planning/` 디렉토리가 없을 수 있는 신규 프로젝트 엣지를 대비해, 마커 쓰기 전에 `mkdir -p .planning`로 디렉토리 존재를 보장한다.
- **D-06 [informational]:** 마커는 **프로젝트 전역**이며 마일스톤을 가로질러 유지된다. 이 리포에서 `.planning/`은 **gitignore되지 않으므로**(확인됨), 마커를 커밋하면 TDD 모드가 팀과 공유된다. (이 단계는 마커 자체의 커밋 정책을 강제하지 않는다 — 사용자/팀이 커밋 여부를 결정.)

### 감사 로그 / 핸드오프 (코드베이스 패턴)
- **D-07:** `sg-use-tdd`는 **HANDOFF.md에 행을 추가하지 않는다.** 이것은 워크플로우 단계 전이가 아니라 **설정 토글**이므로, `sg-status`/`sg-health`와 동일한 패턴(감사-로그 행 없음)을 따른다.

### 멀티플랫폼 미러 (TDD-03)
- **D-08:** Pairwise 미러 — `skills/sg-use-tdd/SKILL.md`와 `.agents/skills/sg-use-tdd/SKILL.md`는 **같은 커밋에서** 함께 생성/변경된다. 둘 다 신규 디렉토리·신규 파일이다.
- **D-09:** `.agents/` 미러는 **AskUserQuestion이 필요 없다** — 토글에는 모호한 분기가 없으므로 두 미러 파일은 거의 동일하다(프로즈-폴백 특수 처리 불필요). 출력 산문은 CLAUDE.md의 사용자-언어 컨벤션을 따른다(머신 토큰 `on`/`off`/`USE-TDD`/경로는 영문 그대로).

### Claude's Discretion
- 스킬 파일의 정확한 `<process>` 단계 분할, bash vs Read-도구 사용 비율, 출력 메시지 정확한 문구는 플래너/구현자 재량. 단, macOS/Linux 셸 이식성(CLAUDE.md: `grep -P` 금지, BSD awk 주의)과 사용자-언어 산문 출력은 준수해야 한다.
- 마커 파일의 정확한 메타데이터 형식(한 줄 설명 문구, 타임스탬프 포맷)은 구현자 재량 — D-04의 "최소 사람-가독" 원칙만 충족하면 된다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요건 정의
- `.planning/REQUIREMENTS.md` — TDD-01, TDD-02, TDD-03 (이 단계의 요건). EXEC/REVIEW/DOC는 Phase 47~48 소관이므로 읽되 구현하지 않는다.
- `.planning/ROADMAP.md` §"Phase 46: sg-use-tdd 토글 + 마커" — Goal + 4개 Success Criteria.

### 패턴 참조 (재사용/스타일 기준)
- `skills/sg-health/SKILL.md` — **가장 가까운 패턴 레퍼런스**: 자기완결 + 파일을 안 만드는 진단 스킬. frontmatter(`name`, `description`) + `<language>` + `<objective>` + `<execution_context>` + `<process>` + `<success_criteria>` 구조. HANDOFF 행 없음을 확인하는 근거.
- `skills/sg-status/SKILL.md` + `.agents/skills/sg-status/SKILL.md` — config-toggle/상태-읽기 계열의 pairwise 미러 한 쌍(8개 SKILL.md 중 둘 다 존재하는 미러의 실제 예시).

### 컨벤션
- `CLAUDE.md` §"macOS 셸 이식성" — `grep -P` 금지, BSD awk 주의, `skills/` + `.agents/` 쌍 커버 규칙(Phase 32 Medium-1).
- `CLAUDE.md` §"사용자 언어 메시지" — 산문은 사용자 언어, 머신 토큰(`on`/`off`/경로/`USE-TDD`)은 영문 그대로.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`skills/sg-health/SKILL.md` 구조**: 신규 `sg-use-tdd/SKILL.md`의 골격(frontmatter + `<language>` + `<objective>` + `<process>` + `<success_criteria>`)을 그대로 본뜬다.
- **`.agents/skills/sg-status/SKILL.md`**: `.agents/` 미러의 형식·톤 레퍼런스. 단 sg-status는 프로즈-폴백 분기가 있을 수 있으므로 그대로 복사하지 말고, 토글에 맞춰 단순화한다.

### Established Patterns
- **HANDOFF 행 패턴**: 워크플로우 전이 명령(sg-plan/sg-execute/sg-review 등)만 HANDOFF.md에 행을 추가한다. 진단/상태/설정 계열(sg-health/sg-status)은 추가하지 않는다 → sg-use-tdd도 추가하지 않음(D-07).
- **Pairwise 미러 규칙**: `skills/sg-*/SKILL.md`를 만들면 동일 이름의 `.agents/skills/sg-*/SKILL.md`를 같은 커밋에 포함(CLAUDE.md 컨벤션). 미포함 시 코드 리뷰 블로커.
- **현재 `.agents/skills/`에는 11개만 미러됨** (sg-use-tdd 없음) — 이 단계가 12번째 미러를 **신규 추가**한다.

### Integration Points
- **새 스킬은 `plugin.json`의 `"skills": "./skills/"` 경로 아래 서브디렉토리로 자동 인식된다** (sg-ui-plan Phase 21 선례 — 별도 commands 등록 불필요). 플래너는 plugin.json 명시 등록이 필요한지 확인하되, 기존 선례상 디렉토리만 추가하면 된다.
- **마커 소비 지점은 Phase 47** (sg-execute/sg-review). 이 단계는 마커를 **쓰기만** 하고 읽는 쪽은 만들지 않는다.

</code_context>

<specifics>
## Specific Ideas

- 사용자/팀이 사전에 그릴링으로 확정한 10개 결정(LOCKED 1~5, RESOLVED 6~9, GRILLED 10)이 D-01~D-09 + Discretion에 모두 반영됨. 재질문 금지.
- 마커 내용은 "사람이 열어보면 무엇인지 알 수 있는" 수준의 최소 메타데이터(설명 + 타임스탬프). 기계 감지는 존재-여부만(Phase 47).

</specifics>

<deferred>
## Deferred Ideas

- **마커 감지 후 동작 주입**(sg-execute 핸드오프 TDD 지시, sg-review 실패 루프) — Phase 47 (EXEC-01~03, REVIEW-01~04).
- **README/README.ko TDD 문서화** — Phase 48 (DOC-01, DOC-02).
- **TDD 모드 시 sg-plan이 PLAN.md에 테스트 시나리오 자동 생성** — TDD-F1 (Future Requirements, 미래 릴리스).
- **프로젝트별 테스트 러너 자동 감지** — REVIEW-F1 (Future Requirements).

*이 단계에서 새로 발생한 스코프 크리프 없음 — 논의는 phase 범위 내 유지됨.*

</deferred>

---

*Phase: 46-sg-use-tdd 토글 + 마커*
*Context gathered: 2026-05-31*
