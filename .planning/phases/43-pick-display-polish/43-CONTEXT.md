# Phase 43: One-shot Interaction + Display Polish - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

이 phase는 Phase 42에서 lens 선택 마찰을 제거한 sg-retro 위에 **세 가지 surgical UX 폴리시**를 더한다:

1. **LENS-03 — `--pick` 명시적 lens 선택 UI.** 사용자가 smart default(`dspm ssc`) 대신 본인이 직접 lens 조합을 고르고 싶을 때 사용하는 opt-in 플래그. 정확히 1회의 AskUserQuestion(multiSelect)로 종료하고 결과를 그대로 `LENS_CODES_ARRAY`에 주입한다. 인자 형식: `sg-retro 43 --pick` 또는 `sg-learn 43 --pick`.
2. **DISPLAY-01 — Action Items 테이블의 P1 행 시각 강조.** lessons 파일을 열었을 때 P1이 한눈에 보이도록 priority 셀에 이모지 prefix를 붙인다. 기존 3-컬럼 스키마(`priority | item | next step`)는 보존.
3. **DISPLAY-02 — lens 의도 설명 줄.** 각 lens 섹션의 `## Lens: {name}` 헤더 + `_Captured: {ISO}_` 줄 바로 다음에 1줄짜리 italic intent line을 추가한다. 사용자가 어떤 lens 출력인지 즉시 인지하도록.

scope 명시:
- **In scope:** `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md` pairwise 수정 (D-10 carry-forward). `--pick` 분기 + AskUserQuestion 호출 블록 + DISPLAY-01 priority cell 변환 + DISPLAY-02 intent line 삽입 + argument-hint frontmatter 갱신 + success_criteria 항목 추가.
- **Out of scope (Phase 44):** README/README.ko.md/TEAM.md 동기화는 Phase 44가 담당.
- **Out of scope (milestone 전체):** 새 lens 추가, sg-retro 구조 rewrite, lessons_ranker.cjs 알고리즘 변경, 기존 `.planning/lessons/*.md` 파일의 P1 강조 일괄 마이그레이션.
- **Out of scope (D-11 carry-forward):** `skills/sg-learn/SKILL.md` + `.agents/skills/sg-learn/SKILL.md`는 변경 없음. `--pick`는 `$ARGUMENTS` 안에서 sg-retro가 직접 파싱한다.

</domain>

<decisions>
## Implementation Decisions

### --pick Entry Point & Parsing

- **D-01:** `--pick`는 **sg-retro Step 1(`$ARGUMENTS` 파싱) 안에서 직접 처리**한다. sg-learn은 변경 없이 `Skill(skill="sg-retro", args="$ARGUMENTS")`로 그대로 forward한다. 근거: Phase 42 D-11("sg-learn은 thin pass-through 유지") 보존. sg-learn에 `--pick` 파싱을 넣으면 sg-learn/SKILL.md + `.agents/skills/sg-learn/SKILL.md` 두 파일이 추가 수정 대상이 되어 pairwise 비용 증가 + D-11 위반.
- **D-02:** `--pick` 토큰 위치는 자유. `sg-retro --pick 43`, `sg-retro 43 --pick`, `sg-retro 43 ssc --pick` 모두 동일하게 인식한다. Step 1 시작 부분에서 `$@`를 한 번 훑어 `--pick`를 발견하면 `PICK_MODE=true`로 set하고 해당 토큰만 제거한 뒤 나머지 토큰으로 기존 PHASE/LENS 파싱을 계속한다.
- **D-03:** `--pick`와 positional lens 인자가 **함께** 들어오면(`sg-retro 43 ssc --pick`) **stderr 에러 + exit 1**로 거부한다. silent override 금지(Phase 42 D-06 일관성). 메시지:
  ```
  Cannot combine --pick with positional lens argument.
  Use either: sg-retro {phase} {lens...}  (explicit args)
  Or:         sg-retro {phase} --pick     (interactive picker)
  ```
- **D-04:** `--pick`가 없고 positional lens도 없으면 **Phase 42 smart default(`dspm ssc`)가 그대로 작동**한다. `--pick`는 순수하게 opt-in 분기이며 smart default 진입 조건에는 영향을 주지 않는다(no behavior change).

### --pick AskUserQuestion Shape

- **D-05:** AskUserQuestion **multiSelect**로 1회만 호출한다. 옵션 3개: `ssc (Start/Stop/Continue)`, `dspm (Decisions/Surprises/Patterns/Mistakes)`, `analyze (Conversation Analyzer)`. 사용자가 ≥1개 선택 → `LENS_CODES_ARRAY`에 그대로 join → Step 5 loop 진입. SC#1 "정확히 1회 AskUserQuestion으로 종료"를 multiSelect 한 번으로 충족한다(이전 numbered-list 방식과 달리 lens 개수 follow-up 없이 종료).
- **D-06:** 사용자가 0개 선택(취소·빈 응답) 시 **silent exit(0)**. lessons 파일 미생성, HANDOFF.md 미기록. 메시지는 stderr에 `--pick cancelled — no lens selected, no retrospective recorded.` 한 줄. silent fallback to smart default는 명시적 의도를 무시하므로 금지.
- **D-07:** AskUserQuestion question header는 "Pick Lens" (≤12 chars), question body는 "Which lens(es) do you want to run for Phase {N}?". 각 옵션의 description은 D-12의 intent line과 **동일 문구를 재사용**(중복 정의 방지).

### DISPLAY-01 — P1 Visual Emphasis

- **D-08:** **이모지 prefix 방식** 채택. priority 셀 출력 시 P1만 `🔴 P1`로 prefix를 붙인다(`| 🔴 P1 | item | step |`). P2/P3는 변경 없음. 근거:
  - "분리된 섹션" 방식은 Action Items 테이블이 2개로 쪼개져 sg-retro Step 6 BODY_PRINTF 블록의 복잡도가 2배가 되고 lessons 파일 파싱(향후 P1-only 추출 도구)도 깨지기 쉽다.
  - "재정렬"은 시각 신호가 약하다 — `한눈에` 목표 미달.
  - "bold P1" 마크다운은 렌더링 환경에 따라 효과가 다르다. 이모지는 모든 텍스트 뷰어에서 동일하게 보인다.
  - SC#2가 "이모지 또는 분리된 섹션" 둘 다 acceptable로 명시했으므로 단순함을 택한다.
- **D-09:** 이모지 글리프 `🔴`(red circle). 다른 후보(`⚠️`/`❗`/`🚨`)는 의미 모호하거나 표시 폭이 일정하지 않다. red circle은 P1 = critical/urgent와 의미 정합.
- **D-10:** P1 강조는 **새로 append되는 lens section부터만 적용**. 기존 `.planning/lessons/*.md` 파일의 P1 행은 변경하지 않는다(out of scope). 마이그레이션이 필요해지면 별도 quick task로 처리.
- **D-11:** Step 6의 `ACTION_ITEMS_PRINTF` 주석 placeholder 가이드에 "P1 행은 priority 셀에 `🔴 P1`로 emit, P2/P3는 변경 없음" 명시. Claude가 execute 시점에 이 가이드를 따라 `printf` 라인을 생성한다.

### DISPLAY-02 — Lens Intent Line

- **D-12:** **Static intent line** 채택(lens당 1줄 고정). 동적(phase-tailored) 생성은 사용자가 헤더만 보고 lens 의도를 즉시 파악한다는 목표와 어긋난다(매번 다른 문구 = 인지 부담). 3개 lens의 고정 문구:
  - `ssc`: `_Intent: surface behavior changes — what to start, stop, or continue doing next phase._`
  - `dspm`: `_Intent: capture technical decisions, unexpected outcomes, recurring techniques, and verification failures from this phase._`
  - `analyze`: `_Intent: scan session transcript for frustration, correction, repetition, and validated-success signals; propose sg-rule drafts._`
- **D-13:** **삽입 위치는 `_Captured: {ISO}_` 줄 바로 다음, 빈 줄 + 첫 subheading 앞**. 형식은 italic single-line. 근거: `_Captured:_`가 이미 italic single-line 형식이므로 같은 패턴으로 이어지면 시각적 일관성이 유지됨. blockquote(`> ...`)는 본문 강조에 가까워 메타데이터 영역에는 과함. plain paragraph는 헤더 영역의 메타 정보임이 약해진다.
- **D-14:** intent line 문구는 Step 6의 새 분기 `INTENT_LINE` 변수에 case 매핑으로 정의한다(이미 있는 `LENS_NAME` case 매핑 바로 아래에 배치). Step 6 본문 printf 블록에서 `printf '%s\n\n' "$INTENT_LINE"`를 `_Captured:` printf 다음에 emit. RUN_SUFFIX(`(run N)`)와 무관하게 매 lens 섹션마다 항상 출력.
- **D-15:** intent line은 **본문(영문) 그대로 출력**한다. CLAUDE.md "사용자 언어 메시지" 컨벤션은 산문 프롬프트·경고에 적용되며, lessons 파일에 append되는 콘텐츠는 영문 source가 canonical(Phase 42 lessons 파일도 한글 본문 + 영문 키워드 혼재 패턴). intent line은 lessons 파일에 written 되는 콘텐츠이므로 lessons 본문 언어 정책을 따른다.

### Pairwise Sync (D-10 from Phase 42 carry-forward)

- **D-16:** 본 phase의 모든 sg-retro 변경(D-01~D-15)은 `skills/sg-retro/SKILL.md`와 `.agents/skills/sg-retro/SKILL.md` 두 파일에 동일하게 적용한다. 두 파일은 동일 commit에 함께 staged 되어야 한다(Phase 42 D-10 lock-in + Phase 32 Medium-1 컨벤션 + Phase 42 retro에서 prose drift 3건이 review에서 잡힌 사례 반복).
- **D-17:** `.agents/skills/sg-retro/SKILL.md`의 `<constraints>` 블록 "AskUserQuestion not supported" 줄은 `--pick` 추가로 인해 **자가모순**이 된다. 두 가지 대응 중 택일을 planner 재량으로 남긴다:
  - (a) `<constraints>` "AskUserQuestion not supported"는 그대로 두되 `--pick` 분기에 `[ -n "$ASKUSERQUESTION_AVAILABLE" ]` 같은 guard를 두지 않고 단순히 "이 플래그는 AskUserQuestion 지원 환경에서만 동작"이라고 sub-block 주석에 명시.
  - (b) `<constraints>` 문구를 "AskUserQuestion only used in --pick mode; smart default + positional args work without it" 식으로 정확히 갱신.
  - 권장은 (b) — Phase 42 retro의 "prose drift" 교훈에 따라 산문 일치를 lock-in.

### Tests & Verification

- **D-18:** 검증 시나리오(planner가 PLAN.md `<verification_steps>`에 포함):
  1. `Skill(skill="sg-retro", args="43 --pick")` → AskUserQuestion 1회 호출 + 옵션 3개 + multiSelect. 사용자가 `ssc dspm` 선택 → 두 lens 순차 실행 → lessons 파일에 2개 lens section append.
  2. `Skill(skill="sg-retro", args="43 --pick ssc")` → 충돌 에러 stderr + exit 1, lessons 파일 미생성, AskUserQuestion 미호출.
  3. `Skill(skill="sg-retro", args="43 ssc --pick")` → 위와 동일(`--pick` 위치 무관).
  4. `Skill(skill="sg-retro", args="43")` → smart default(`dspm ssc`) 그대로 작동(behavior preserved, no regression).
  5. `Skill(skill="sg-learn", args="43 --pick")` → sg-learn이 변경 없이 forward → sg-retro에서 `--pick` 처리.
  6. `Skill(skill="sg-retro", args="43 --pick")` + 사용자 0개 선택 → silent exit, stderr 메시지, lessons 미생성.
  7. lessons 파일의 모든 P1 행이 `| 🔴 P1 |`로 시작하는지 grep 확인. P2/P3는 prefix 없음.
  8. 모든 lens section에 `_Intent: ..._` italic 줄이 `_Captured:_` 바로 다음 줄에 존재하는지 grep 확인.
  9. `diff skills/sg-retro/SKILL.md .agents/skills/sg-retro/SKILL.md` 비교 시 의미적 동등(파일 헤더·`<constraints>` 블록만 차이).

### Claude's Discretion

- **success_criteria 항목 갱신:** 기존 sg-retro `<success_criteria>` 11개 항목에 `--pick` 동작 명시 항목, DISPLAY-01 P1 prefix 명시 항목, DISPLAY-02 intent line 명시 항목을 추가하거나 기존 #2를 확장. 총 항목 수와 번호는 planner 재량.
- **argument-hint frontmatter 갱신:** `skills/sg-retro/SKILL.md` 본 파일은 frontmatter에 `argument-hint`가 없음. `.agents/skills/sg-retro/SKILL.md`는 있음. 추가/갱신 여부와 정확한 문구는 planner 재량(권장 문구: `"[phase] [lens...|--pick] - e.g. '14 ssc' or '14 --pick'. lens: ssc|dspm|analyze. Omit lens for smart default (dspm+ssc)."`).
- **--pick 입력 후 lens 검증:** AskUserQuestion의 multiSelect 결과는 코드(`ssc`/`dspm`/`analyze`) enum이 보장되므로 dropped-lens reject 분기(Phase 42 D-06)에 도달하지 않음. 추가 검증 코드는 불필요하나 안전망으로 동일 case 검증을 통과시키는 것은 planner 재량.
- **P1 이모지 글리프 변경 가능성:** `🔴` 외에 `🅰️`, `⚡`, `‼️` 등 사용자 피드백에 따라 향후 변경 가능. 본 phase는 `🔴` 고정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 본 phase의 직접 대상 파일 (pairwise 수정)

- `skills/sg-retro/SKILL.md` — `--pick` 분기, DISPLAY-01 priority prefix, DISPLAY-02 intent line의 1차 수정 대상. Step 1(인자 파싱 시작부), Step 2(case 매핑 직후 `--pick` 충돌 검증), Step 5(AskUserQuestion 호출 블록 신설), Step 6(`INTENT_LINE` case + body printf 갱신 + ACTION_ITEMS_PRINTF 가이드 갱신), `<success_criteria>` 항목 추가.
- `.agents/skills/sg-retro/SKILL.md` — 위 파일의 pairwise 미러. 동일 변경 + `<constraints>` 블록 "AskUserQuestion not supported" 문구 갱신(D-17 권장 (b)).

### 본 phase 영향 없음 (변경 금지 확인용)

- `skills/sg-learn/SKILL.md` — `$ARGUMENTS` pass-through 그대로 유지(D-01, D-11 carry-forward). 변경 없음.
- `.agents/skills/sg-learn/SKILL.md` — 동일.

### 요구사항·로드맵·프로젝트 컨텍스트

- `.planning/REQUIREMENTS.md` §LENS — LENS-03 정의 + Future Requirements / Out of Scope.
- `.planning/REQUIREMENTS.md` §DISPLAY — DISPLAY-01, DISPLAY-02 정의.
- `.planning/ROADMAP.md` §"Phase 43: One-shot Interaction + Display Polish" — Goal + 3개 Success Criteria + Requirements 매핑.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone target features.
- `.planning/STATE.md` — milestone v2.9 진행 상태.

### Phase 42 carry-forward (직전 phase decisions)

- `.planning/phases/42-smart-default-lens/42-CONTEXT.md` — D-01~D-12 (특히 D-06 silent fallback 금지, D-07 부분 실행 금지, D-10 pairwise sync, D-11 sg-learn thin pass-through).
- `.planning/lessons/42-2026-05-30.md` — Phase 42 retro Action Items P1 #1(plan lint preserve vs grep acceptance — plan-phase 단계에서 적용해야 할 교훈), P1 #2(sg-parallel-execute → sg-review BASE==HEAD — 본 phase scope 외).

### 컨벤션·아키텍처 참조

- `CLAUDE.md` §"macOS 셸 이식성" — `--pick` 토큰 탐색용 bash 스니펫 작성 시 BSD/GNU 양립 규칙. `grep -P` 금지, `-E` 사용.
- `CLAUDE.md` §"사용자 언어 메시지" — `--pick` 에러 메시지(`Cannot combine --pick with positional lens argument.`) 산문은 사용자 언어 자동 감지, 머신 토큰(`--pick`, `ssc`, `dspm`, `analyze`)은 영문 그대로.
- `CLAUDE.md` §"skills/ + .agents/ 쌍 커버" — Phase 32 Medium-1 컨벤션. 본 phase의 D-16이 직접 이 컨벤션을 강제.
- `.planning/codebase/ARCHITECTURE.md` §"Architectural Constraints" — D-07 replication lock, append-only invariant(HANDOFF.md), macOS/BSD 호환성 룰.
- `.planning/codebase/ARCHITECTURE.md` §"Anti-Patterns" — "Updating only `skills/` without updating `.agents/skills/`" 명시.

### Phase 42 lessons 시각 참조(DISPLAY-01/02 디자인 검증용)

- `.planning/lessons/42-2026-05-30.md` — DISPLAY-01 적용 전 상태. P1 행이 평문 `P1`로만 표기되어 P2와 시각 차이 없음 → 본 phase의 변환 효과 확인 baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Step 1 argument parsing (`set -- $ARGUMENTS`)** — `skills/sg-retro/SKILL.md` 28-30줄에 이미 `set -- $ARGUMENTS` 기반 positional 파싱이 있다. `--pick` 탐지는 이 블록 직후에 `for ARG in "$@"; do case "$ARG" in --pick) ... ;; esac done` 패턴으로 단일 통과 스캔 추가 가능. 기존 PHASE_RAW/LENS_RAW 파싱 로직은 토큰 제거 후 그대로 재사용.
- **Step 2 case 매핑 (`ssc|dspm|analyze`)** — 87-93줄. `--pick` AskUserQuestion 결과를 그대로 enum으로 받으면 동일 case 매핑을 통과(추가 검증 불필요).
- **Step 6 BODY_PRINTF + ACTION_ITEMS_PRINTF placeholder 가이드** — 297-327줄. ACTION_ITEMS_PRINTF placeholder 주석에 "P1 행은 `🔴 P1` prefix로 emit" 가이드를 추가하면 implementer가 Claude가 execute 시점에 자동 적용. BODY_PRINTF 직전에 `printf '%s\n\n' "$INTENT_LINE"`만 추가하면 DISPLAY-02 완성.
- **Step 6 `LENS_NAME` case 매핑 (263-267줄)** — `INTENT_LINE` case를 바로 아래에 동일 패턴으로 추가하면 의미적 결합도 유지.
- **Smart default 진입 분기 (`if [ -z "$LENS_CODES_ARRAY" ] && ...`)** — 128-131줄. `--pick`이 set되면 이 분기를 건너뛰어야 함(또는 `--pick`이 PICK_MODE 처리 후 AskUserQuestion 결과로 `LENS_CODES_ARRAY`를 채우면 자연스럽게 이 분기 조건이 false). PICK_MODE 분기는 smart default 분기 **이전**에 위치해야 race 방지.

### Established Patterns

- **D-19 단일 lens 인자 경로 → multi-lens array build** (Phase 42 D-19) — `LENS_CODES_ARRAY`에 공백 구분으로 join하는 패턴이 이미 있음(`VALID_EXTRAS` 누적). `--pick` 결과도 동일 형태로 join하면 Step 5 loop가 변경 없이 동작.
- **stderr 에러 + exit 1 + silent fallback 금지** (Phase 42 D-06) — `--pick` 충돌(D-03) 에러도 동일 패턴 따른다. 메시지 format: 첫 줄 violation, 둘째 줄 valid usage, 셋째 줄 alternative.
- **macOS-compatible bash 스니펫** (sg-retro 전반) — `grep -P` 금지, `-E` 사용. `for ARG in "$@"`는 BSD/GNU 양립.
- **D-21 single `>>` redirect block** (Step 6) — `INTENT_LINE` printf는 기존 single redirect block 내부에 추가해야 함(append 원자성 유지). 별도 redirect block 신설 금지.
- **Phase 42 lessons의 P1 prefix 부재** — `.planning/lessons/42-2026-05-30.md`의 Action Items 두 테이블에서 P1 행이 평문 `P1`로만 표기됨. 본 phase 적용 후 새 lessons 파일은 `🔴 P1`로 바뀐다(baseline → after 비교 가능).

### Integration Points

- **sg-learn → sg-retro Skill 호출** — `skills/sg-learn/SKILL.md` line 25 `Skill(skill="sg-retro", args="$ARGUMENTS")` 변경 없음. `--pick` 토큰이 ARGUMENTS에 그대로 들어와 sg-retro Step 1에서 처리됨.
- **HANDOFF.md append (sg-retro Step 6 마지막)** — `--pick` 분기와 무관. 회고 성공 시 한 행 추가. `--pick` 취소(D-06)로 lens 0개 실행 시에는 HANDOFF append도 건너뛴다(success-based 원칙 유지).
- **lessons 파일 (`.planning/lessons/{NN}-{YYYY-MM-DD}.md`)** — 포맷 변경: (1) 각 lens section에 `_Intent:_` 줄 추가, (2) P1 행에 `🔴` prefix. 파일 명명 규칙은 변경 없음.
- **lessons_ranker.cjs** — P1 prefix 추가가 ranker 입력 파싱에 영향 없음 확인 필요(planner 검증). ranker가 `| P1 |` 정확 매칭으로 priority를 추출한다면 `| 🔴 P1 |`로 인해 매칭 실패할 수 있음. lessons_ranker.cjs의 priority 추출 regex가 `P[123]`만 매칭하는지(이모지·공백 허용) 확인이 검증 시나리오의 일부가 되어야 함.
- **stop_hook.cjs / transcript_matcher.cjs** — 본 phase는 hook 변경 없음.

</code_context>

<specifics>
## Specific Ideas

- **이모지 글리프 `🔴` 선택 사유:** red circle은 P1=critical 의미 정합 + 모든 텍스트 뷰어에서 일정한 폭으로 렌더링 + 다른 우선순위(P2/P3)에 시각 부담을 주지 않음. `⚠️`/`❗`은 의미가 warning(중요·주의)이므로 critical과 미묘하게 다름. `🚨`는 emergency 톤이 너무 강함.
- **intent line `_Intent: ..._` 접두어:** 단순 italic이 아닌 `Intent:` prefix를 둠으로써 `_Captured:_`와 시각적 시리즈를 이룸(둘 다 메타데이터 italic single-line).
- **AskUserQuestion question 본문에 phase 번호 인터폴레이션:** "Which lens(es) do you want to run for Phase {N}?" — 사용자가 어떤 phase의 회고인지 즉시 확인 가능.
- **lessons_ranker.cjs regex 점검:** DISPLAY-01의 가장 큰 hidden risk. plan-phase에서 lessons_ranker가 P1을 어떻게 추출하는지 먼저 확인하고 필요 시 regex 갱신을 같은 phase에 포함할지 결정해야 함(현재 milestone Out of Scope "lessons_ranker.cjs 알고리즘 변경"과 충돌 가능 — 알고리즘이 아닌 input format 변경에 대한 regex 호환성은 본 phase 책임).

</specifics>

<deferred>
## Deferred Ideas

- **기존 `.planning/lessons/*.md` P1 강조 일괄 마이그레이션** — 본 phase는 새 append만 다룬다. 마이그레이션 필요해지면 별도 quick task로 처리. 본 milestone Out of Scope 명시.
- **AskUserQuestion 미지원 환경(Codex/Gemini)에서 `--pick` 동작** — 현재는 `.agents/skills/sg-retro/SKILL.md`도 동일 분기를 갖되 AskUserQuestion 호출이 fail하는 환경에서는 자연스럽게 에러 메시지가 나오게 둔다. 더 우아한 fallback(예: numbered list)이 필요하면 v3.x 이후.
- **`--pick deep`처럼 analyze lens deep-scan과 결합한 인자 조합** — 본 phase는 multiSelect 단일 round-trip만 다룬다. analyze 옵션(`deep`)과의 결합은 사용자 피드백 누적 후 재검토.
- **lens 의도 설명을 사용자 언어로 자동 번역** — 본 phase는 영문 고정(D-15). 사용자 언어 자동 번역은 lessons 파일 본문 언어 정책 전반의 결정이 필요하며 별도 milestone 후보.
- **이모지 외 추가 강조(색·굵기·정렬)** — 본 phase는 단일 이모지 prefix만. 향후 markdown renderer가 색을 지원하는 환경 한정 강조는 별도 검토.
- **Action Items에 owner 컬럼 부활** — Phase 42 D-12에서 owner 컬럼 제거. 팀 협업 phase(v2.8) 이후 owner 필요성 재대두 가능성 있으나 별도 phase로 다룬다.
- **P1 이모지 변경(`🔴` → 다른 글리프)** — 사용자 피드백 누적 후 backlog 후보.

</deferred>

---

*Phase: 43-pick-display-polish*
*Context gathered: 2026-05-30*
