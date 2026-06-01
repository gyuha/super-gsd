# Phase 46: sg-tdd 구현 + 파이프라인 통합 - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 46는 `sg-tdd` 슬래시 명령과 파이프라인 통합을 구현한다:

- `skills/sg-tdd/SKILL.md` 신규 생성 — `/super-gsd:sg-tdd [phase]` 호출 시 Superpowers `test-driven-development` 스킬을 Non-invasive하게 호출하고, 완료 후 HANDOFF.md에 `tdd` stage 행 append
- `.agents/skills/sg-tdd/SKILL.md` 동시 생성 — Codex/Gemini 환경의 `$sg-tdd` 접근 보장 (MIRROR-01)
- `.planning/config.json`의 `super_gsd.tdd_mode` 플래그 연동 — sg-next와 sg-status 라우팅 테이블 양쪽 갱신 (D-07 inline-replication)
- `hooks/transcript_matcher.cjs`에 TDD 신호 패턴 추가 — sg-tdd 진입·완료 감지
- `hooks/stop_hook.cjs`에 `tdd` stage → sg-review 안내 분기 추가
- HANDOFF.md stage enum에 `tdd` 추가 (execute, review와 일관된 단일어 패턴)

**Phase 47 (문서 갱신)**는 별도 단계로 분리되어 있으므로 README/README.ko.md/CLAUDE.md 문서 갱신은 이 Phase 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### TDD 검증 실패 처리 (TDD-01)
- **D-01:** 검증 실패 시 `AskUserQuestion`으로 소프트 경고를 출력한다. 선택지는 sg-review로 진행 / 재시도 두 가지를 제공한다. 하드 블록(강제 중단)은 없다.

### tdd_mode off 상태에서 직접 호출 (TDD-02)
- **D-02:** `tdd_mode: false` 또는 미설정 상태에서 `/super-gsd:sg-tdd`를 직접 호출하면 경고 메시지를 출력하고, `tdd_mode` 활성화 방법을 안내한 뒤 sg-execute 재실행을 권고한다. 명령 자체를 블록하지는 않는다.

### sg-next 동적 라우팅 (PIPE-02)
- **D-03:** sg-next가 `execute` 완료 단계에서 다음 명령을 결정할 때 `.planning/config.json`의 `super_gsd.tdd_mode` 값을 읽는다.
  - `tdd_mode: true` → execute 다음 단계는 `sg-tdd`
  - `tdd_mode: false` 또는 미설정 → execute 다음 단계는 `sg-review` (기존 동작 유지)
- **D-04 (D-07 inline-replication):** sg-next와 sg-status 라우팅 테이블을 동시에 갱신한다. 어느 한 쪽만 수정하는 커밋은 코드 리뷰 블로커다.

### HANDOFF.md stage enum (PIPE-01, PIPE-03)
- **D-05:** `tdd` 단일어를 HANDOFF.md stage enum에 추가한다. `execute`, `review`와 같은 단일어 패턴을 따른다. 기존 유효성 검사 분기(case 문)에 `tdd`를 추가해야 HANDOFF.md schema corruption 경고를 피할 수 있다.

### transcript_matcher 완료 신호 (PIPE-03)
- **D-06:** sg-tdd 스킬 종료 시 `"TDD verification complete"` 문자열을 출력한다. `transcript_matcher.cjs`는 이 문자열을 `tdd-complete` 신호로 분류한다.

### sg-tdd 구현 방식 (TDD-03, Non-invasive 제약)
- **D-07:** sg-tdd는 `Skill(skill="superpowers:test-driven-development", args="...")` 단일 호출로만 구현한다. Superpowers 또는 GSD 내부 파일을 수정하지 않는다 (Non-invasive 제약 준수).

### 파일 쌍 필수 (MIRROR-01)
- **D-08:** `skills/sg-tdd/SKILL.md`와 `.agents/skills/sg-tdd/SKILL.md`를 동시에 생성한다. 어느 한 파일만 생성하는 플랜은 완료로 인정하지 않는다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 파이프라인 통합 로직 (라우팅 변경 대상 파일)
- `skills/sg-next/SKILL.md` — D-07 next-command routing block (D-07 inline-replication). execute 분기에 tdd_mode 조건 분기 추가 필요. 현재 `execute) NEXT_CMD="/super-gsd:sg-review"` 단일 분기를 조건부로 분리.
- `skills/sg-status/SKILL.md` — D-07 next-command routing block과 HANDOFF stage enum 유효성 검사. sg-next와 동시 갱신 필수.
- `.agents/skills/sg-next/SKILL.md` — skills/ 미러. sg-next 수정 시 동시 갱신.
- `.agents/skills/sg-status/SKILL.md` — skills/ 미러. sg-status 수정 시 동시 갱신.

### 훅 수정 대상 파일
- `hooks/transcript_matcher.cjs` — `TDD_SIGNALS` 배열 추가 + `detectSignal()` 분기 추가. 현재 4개 신호 세트 패턴을 따라 5번째 세트로 추가.
- `hooks/stop_hook.cjs` — `stageToSignal()` 함수에 `'tdd'` → `'tdd-complete'` 매핑 추가 + `main()` 함수의 `if/else if` 체인에 `tdd-complete` 분기 추가 → sg-review 안내.

### 신규 생성 파일
- `skills/sg-tdd/SKILL.md` — 신규 생성. sg-tdd 슬래시 명령 정의.
- `.agents/skills/sg-tdd/SKILL.md` — 신규 생성. skills/ 원본과 동일 내용.

### 아키텍처 참조
- `CLAUDE.md` §Architecture — D-07 inline-replication 패턴, Non-invasive 제약, 파일 쌍 필수 컨벤션 (MIRROR-01)
- `.planning/codebase/ARCHITECTURE.md` — Stage Enum 목록, D-07 Block Replication 설명, Stop Hook Signal Detection Path
- `.planning/codebase/STRUCTURE.md` §"D-07 blocks" — sg-status, sg-next, sg-start, sg-retro 4개 파일 동시 갱신 대상 목록
- `.planning/ROADMAP.md` §Phase 46 — 요구사항 (TDD-01, TDD-02, TDD-03, PIPE-01, PIPE-02, PIPE-03, MIRROR-01) 및 Success Criteria

### config 스키마
- `.planning/config.json` — `super_gsd.tdd_mode` 신규 boolean 플래그. 파일이 없거나 키가 부재 시 기본값은 `false` (기존 동작 유지). `super_gsd.auto_advance`와 동일한 읽기 패턴 적용.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/transcript_matcher.cjs` — `GSD_PLAN_SIGNALS`, `IMPLEMENTATION_SIGNALS`, `REVIEW_SIGNALS`, `SG_RETRO_SIGNALS` 4개 배열 패턴. `TDD_SIGNALS = ["TDD verification complete"]`를 5번째 배열로 추가하고, `detectSignal()` 함수 끝에 분기 추가.
- `hooks/stop_hook.cjs` — `stageToSignal()` switch 문에 `case 'tdd': return 'tdd-complete'` 추가. `main()` 분기에 `cmdTdd = '/super-gsd:sg-tdd'` 변수 추가 + systemMessage 추가.
- `skills/sg-next/SKILL.md` — D-07 next-command routing block의 `execute)` 분기. config.json 읽기 로직은 현재 sg-next에 없으므로 새로 추가 필요. `loadConfig()` 방식은 stop_hook.cjs 참조.
- `skills/sg-execute/SKILL.md` — HANDOFF.md append 패턴 참조. `tdd` stage append 시 동일 패턴 적용.

### Established Patterns
- **Terminal Skill pattern:** sg-tdd의 마지막 단계는 `Skill(skill="superpowers:test-driven-development", args="...")` 단일 호출. 이 호출 이후 코드 실행 없음.
- **HANDOFF.md append-only:** sg-tdd가 Skill() 호출 전에 `| TS | PHASE_SLUG | execute | tdd | - | GIT_USER |` 행을 HANDOFF.md에 append.
- **D-07 inline-replication:** sg-status와 sg-next의 routing block은 주석 `--- BEGIN/END ---`으로 경계가 표시되어 있음. 동시 수정이 검증 게이트.
- **Non-invasive:** sg-tdd는 SKILL.md 파일만 추가하며 Superpowers/GSD의 기존 파일을 수정하지 않음.
- **config.json 읽기 패턴:** stop_hook.cjs의 `loadConfig()` 참조 — `cfg.super_gsd?.tdd_mode` 또는 SKILL.md 내 bash에서 `python3 -c` 대신 node 인라인 또는 `jq` 사용 고려. macOS 호환 방법: `node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}"`.

### Integration Points
- `skills/sg-next/SKILL.md` Step 3 routing block — `execute)` 분기에 config 읽기 + 조건 분기 삽입
- `skills/sg-status/SKILL.md` Step 5 routing block — 동일 패턴으로 동시 갱신
- `hooks/transcript_matcher.cjs` 하단 — 신호 배열 + detectSignal() 분기 추가
- `hooks/stop_hook.cjs` — `stageToSignal()` + `main()` 분기 추가
- HANDOFF.md stage enum 유효성 검사: `sg-status`와 `sg-next` 모두 `case` 문에 `tdd)` 추가 필요 (없으면 "Unknown stage" 오류 발생)

</code_context>

<specifics>
## Specific Ideas

- **sg-tdd 검증 실패 메시지:** 소프트 경고이므로 AskUserQuestion으로 선택지 제공. 예시: `"TDD verification found issues. How do you want to proceed?"` → options: `"Proceed to sg-review"` / `"Retry TDD verification"`
- **tdd_mode off 경고 메시지:** `"tdd_mode is not enabled. To activate: set super_gsd.tdd_mode: true in .planning/config.json. Recommended: re-run sg-execute first."` — sg-execute 재실행 권고 포함.
- **stop_hook 완료 메시지:** `"TDD verification complete. Run {cmdReview} to request a code review."` — sg-retro-complete 메시지 패턴 참조.
- **HANDOFF stage enum 추가 위치:** sg-status Step 2와 sg-next Step 2의 case 문에서 `gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete|sg-next)` 패턴에 `tdd)` 추가. execute와 review 사이에 배치.

</specifics>

<deferred>
## Deferred Ideas

- README.md / README.ko.md Commands 표 갱신 — Phase 47 범위
- CLAUDE.md 아키텍처 섹션 sg-tdd 추가 — Phase 47 범위
- sg-tdd가 자체적으로 테스트를 작성하는 "진짜 TDD 우선" 모드 — Out of scope (sg-tdd는 검증 게이트, 테스트 작성자가 아님)
- 병렬 TDD 실행 — sg-parallel-execute와의 통합 — 미래 마일스톤

</deferred>

---

*Phase: 46-sg-tdd 구현 + 파이프라인 통합*
*Context gathered: 2026-06-01*
