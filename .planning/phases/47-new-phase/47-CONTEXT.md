# Phase 47: 문서 갱신 - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 47는 Phase 46에서 구현한 `sg-tdd` 단계를 사용자 문서에 반영한다:

- `README.md` Commands 표에 `sg-tdd` 행 추가 (sg-execute 뒤, sg-review 앞)
- `README.ko.md` Commands 표에 `sg-tdd` 행 추가 (동일 위치)
- 두 README의 파이프라인 서술을 `sg-execute → sg-tdd → sg-review`로 갱신 (tdd_mode=true일 때 활성화 주석 포함)
- `CLAUDE.md` 데이터 흐름 블록에 `sg-tdd → Superpowers:test-driven-development` 행 추가
- `CLAUDE.md` 아키텍처 섹션에 `super_gsd.tdd_mode` 플래그 설명 추가 (기본 off, config.json 제어)
- `CLAUDE.md` Skills 레이어 설명의 SKILL.md 파일 수 21→22 업데이트

코드 변경 없음. 순수 문서 갱신 phase다.

</domain>

<decisions>
## Implementation Decisions

### README.md + README.ko.md Commands 표 갱신 (DOC-01)
- **D-01:** `sg-tdd` 행을 sg-execute 행 바로 다음, sg-review 행 바로 앞에 삽입한다.
- **D-02:** sg-tdd 행 설명(영문): `Run a red-green-refactor TDD verification gate via \`superpowers:test-driven-development\` — only active when \`super_gsd.tdd_mode: true\` in \`.planning/config.json\``. 사용 시점: `After \`sg-execute\` completes, when \`tdd_mode\` is enabled`.
- **D-03:** sg-tdd 행 설명(한글): `` `superpowers:test-driven-development\`를 통해 red-green-refactor TDD 검증 게이트 실행 — `.planning/config.json`의 `super_gsd.tdd_mode: true`일 때만 활성화 ``. 사용 시점: `` `tdd_mode`가 활성화된 상태에서 `sg-execute` 완료 후 ``.
- **D-04:** 두 파일의 파이프라인 서술 줄(현재: `sg-execute → sg-review`)을 `sg-execute → sg-tdd (tdd_mode=true) → sg-review`로 갱신한다. 정확한 위치: README.md 19번째 줄 부근 `sg-new/sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship → sg-complete` 패턴.
- **D-05:** `sg-next` 행의 괄호 내 체인 서술(`parallel/execute → sg-review`)도 `parallel/execute → sg-tdd (tdd_mode=true) → sg-review`로 갱신한다 (두 README 동시).

### CLAUDE.md 데이터 흐름 블록 갱신 (DOC-02)
- **D-06:** 데이터 흐름 코드 블록에서 `sg-execute → Superpowers:executing-plans` 줄 다음에 `sg-tdd → Superpowers:test-driven-development  # active when tdd_mode=true` 행을 추가한다.

### CLAUDE.md 아키텍처 섹션 갱신 (DOC-02)
- **D-07:** Skills 레이어 설명 첫 문장의 `21개`를 `22개`로 교체한다.
- **D-08:** Hooks 레이어 `stop_hook.cjs` 항목 뒤(또는 `환경 변수` 섹션 앞)에 `super_gsd.tdd_mode` 플래그 설명 단락을 추가한다. 내용: `` `.planning/config.json`의 `super_gsd.tdd_mode` 플래그가 `true`일 때 sg-next/sg-status가 execute 완료 후 sg-review 대신 sg-tdd로 라우팅한다. 부재 또는 `false`이면 기존 동작 유지 (기본 off). ``.

### 파일 쌍 규칙
- **D-09:** README.md와 README.ko.md는 동시에 갱신한다. 어느 한 파일만 수정하는 플랜은 완료로 인정하지 않는다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 갱신 대상 파일 (현재 상태 확인 필수)
- `README.md` — Commands 표 (29번째 줄~57번째 줄), 파이프라인 서술 (19번째 줄), sg-next 체인 서술 (25번째 줄) 갱신 대상
- `README.ko.md` — 동일 위치. README.md와 구조 완전 일치
- `CLAUDE.md` §Architecture (119~161번째 줄) — 데이터 흐름 블록(`sg-execute` 행 뒤), Skills 레이어 설명 (`21개` → `22개`), `super_gsd.tdd_mode` 플래그 설명 추가

### Phase 46 구현 결과 (변경 내용 파악 필수)
- `.planning/phases/46-sg-tdd-pipeline/46-CONTEXT.md` — D-01~D-08 결정 사항 (sg-tdd 의미, HANDOFF stage enum, transcript_matcher 완료 신호 등)
- `.planning/phases/46-sg-tdd-pipeline/46-01-SUMMARY.md` — sg-tdd SKILL.md 신규 생성 결과
- `.planning/phases/46-sg-tdd-pipeline/46-02-SUMMARY.md` — 파이프라인 통합 결과 (sg-next/sg-status 라우팅, hooks 갱신)

### 아키텍처 참조
- `.planning/ROADMAP.md` §Phase 47 — 요구사항 (DOC-01, DOC-02) 및 Success Criteria
- `skills/sg-tdd/SKILL.md` — sg-tdd 슬래시 명령 정의 (description 필드 참조해 Commands 표 설명 작성)
- `CLAUDE.md` §Architecture — 데이터 흐름 블록 원문 위치 및 `super_gsd.auto_advance` 기존 플래그 설명 패턴 참조

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` Commands 표 — 기존 행 형식 `| \`/super-gsd:sg-X\` | [설명] | [사용 시점] |` 패턴 그대로 따름
- `README.ko.md` Commands 표 — 한글 행 형식 동일 패턴

### Established Patterns
- **Commands 표 순서:** sg-execute 뒤, sg-review 앞이 sg-tdd의 정확한 삽입 위치. 파이프라인 순서(`sg-plan → sg-execute → sg-tdd → sg-review`)와 일치.
- **tdd_mode 조건부 활성화 표기:** 파이프라인 서술에서 `(tdd_mode=true)` 괄호 주석으로 선택적 단계임을 명시.
- **CLAUDE.md 데이터 흐름 블록:** 코드 펜스 내 `sg-X → Target:skill-name` 형식. 기존 `sg-execute → Superpowers:executing-plans` 다음 줄에 삽입.
- **`super_gsd.auto_advance` 기존 패턴:** `stop_hook.cjs` 항목 설명에 이미 config.json 플래그 언급. `super_gsd.tdd_mode`도 동일 섹션에서 동일 패턴으로 설명.

### Integration Points
- README.md 19번째 줄: 파이프라인 서술 한 줄 수정
- README.md 25번째 줄: sg-next 체인 서술 수정
- README.md 39번째~40번째 줄: sg-execute와 sg-review 행 사이에 sg-tdd 행 삽입
- README.ko.md 동일 위치: 위와 대칭
- CLAUDE.md 126번째 줄: `21개` → `22개`
- CLAUDE.md 139번째 줄 다음: `sg-tdd → Superpowers:test-driven-development` 행 삽입
- CLAUDE.md 130번째 줄 `stop_hook.cjs` 항목 뒤 또는 `환경 변수` 섹션 앞: tdd_mode 플래그 설명 추가

</code_context>

<specifics>
## Specific Ideas

- **sg-tdd Commands 표 설명 (영문):** `Run a red-green-refactor TDD verification gate via \`superpowers:test-driven-development\` — only active when \`super_gsd.tdd_mode: true\` in \`.planning/config.json\``
- **sg-tdd Commands 표 사용 시점 (영문):** `After \`sg-execute\` completes, when \`tdd_mode\` is enabled`
- **sg-tdd Commands 표 설명 (한글):** `` `superpowers:test-driven-development\`를 통해 red-green-refactor TDD 검증 게이트 실행 — `.planning/config.json`의 `super_gsd.tdd_mode: true`일 때만 활성화 ``
- **sg-tdd Commands 표 사용 시점 (한글):** `` `tdd_mode`가 활성화된 상태에서 `sg-execute` 완료 후 ``
- **파이프라인 서술 갱신 패턴:** `sg-execute → sg-tdd (tdd_mode=true) → sg-review`
- **CLAUDE.md 데이터 흐름 삽입 행:** `sg-tdd → Superpowers:test-driven-development  # active when tdd_mode=true`
- **tdd_mode 플래그 설명 문구:** `.planning/config.json`의 `super_gsd.tdd_mode` 플래그가 `true`일 때 sg-next/sg-status가 execute 완료 후 sg-review 대신 sg-tdd로 라우팅한다. 부재 또는 `false`이면 기존 동작 유지 (기본 off).

</specifics>

<deferred>
## Deferred Ideas

- sg-tdd가 자체적으로 테스트를 작성하는 "진짜 TDD 우선" 모드 — Out of scope (sg-tdd는 검증 게이트, 테스트 작성자가 아님)
- `docs/COMMANDS.md`에 sg-tdd 전체 설명 추가 — 현재 Phase 범위 밖. 필요하다면 별도 quick task로.
- 병렬 TDD 실행 (sg-parallel-execute 통합) — 미래 마일스톤

</deferred>

---

*Phase: 47-문서 갱신*
*Context gathered: 2026-06-01*
