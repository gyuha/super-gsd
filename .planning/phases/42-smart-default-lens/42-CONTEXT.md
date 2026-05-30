# Phase 42: Smart Default Lens + Lens Consolidation - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

이 phase가 전달하는 것은 **두 가지 surgical 변경**이다:

1. **Smart default lens 자동 선택** — `sg-learn` / `sg-retro <N>`를 인자 없이(또는 phase 번호만으로) 호출했을 때, lens 선택 AskUserQuestion을 거치지 않고 `dspm+ssc` 조합으로 즉시 회고가 시작된다.
2. **Lens consolidation (6개 → 3개)** — 기존 6개 lens(ssc/4ls/dspm/sail/5why/analyze)를 3개 핵심 lens(`ssc`/`dspm`/`analyze`)로 통합한다. 드롭되는 lens(`4ls`/`sail`/`5why`)는 SKILL.md `<process>` 블록에서 완전히 제거되며, argument로 들어와도 에러 메시지로 거부된다.

scope 명시:
- **In scope:** `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md` pairwise 수정, smart default 분기 로직, lens 케이스 매핑 축소, dropped lens 에러 메시지.
- **Out of scope (Phase 43 이후):** `--pick` flag(LENS-03), Action Items P1 시각 강조(DISPLAY-01), lens 의도 설명 줄(DISPLAY-02), README/TEAM.md 문서 업데이트(DOC-01).
- **Out of scope (milestone 전체):** 새 lens 추가, sg-retro 구조 rewrite, lessons_ranker.cjs 알고리즘 변경, sg-learn/SKILL.md 본문 변경(thin pass-through 유지).

</domain>

<decisions>
## Implementation Decisions

### Smart Default 구성

- **D-01:** Smart default는 `dspm+ssc` 고정 조합이다. ROADMAP Phase 42 SC#1 본문이 `smart default lens(dspm+ssc)`로 lock-in 했으므로 phase 종류·복잡도에 따른 분기 없음. 적응형 default는 REQUIREMENTS.md의 "Future Requirements (deferred)"에 명시되어 v3.x 이후로 미룬다.
- **D-02:** Smart default 진입 조건: `LENS_RAW`가 비어 있고(인자 없음) `EXTRA_LENS_CODES`도 비어 있을 때. 이 경우 `LENS_CODES_ARRAY="dspm ssc"`로 즉시 세팅하고 AskUserQuestion 호출 블록을 건너뛴다. 실행 순서는 `dspm` → `ssc` (dspm이 기술적 핵심이므로 먼저).

### Lens Consolidation 범위 — 유지 3개 / 제거 3개

- **D-03:** **유지하는 3개 lens:** `ssc`(Start/Stop/Continue), `dspm`(Decisions/Surprises/Patterns/Mistakes), `analyze`(Conversation Analyzer).
  - 선정 근거(빈도 + 의도 비중복):
    - `dspm`(11회 사용) — 기술 회고의 정수. Decisions/Mistakes 카테고리가 다른 lens로 대체 불가.
    - `ssc`(9회 사용) — 행동 변화 회고. dspm과 의도가 직교(기술 vs 행동).
    - `analyze`(6회 사용) — 유일하게 세션 transcript(JSONL)를 읽는 lens. 다른 lens로 대체 불가능한 데이터 소스.
- **D-04:** **제거하는 3개 lens:**
  - `sail`(Sailboat, 5회) — Wind/Anchor/Sun/Rock이 dspm(Surprises/Mistakes) + ssc(Continue/Stop)와 1:1 매핑되는 메타포 중복.
  - `4ls`(4Ls, 5회) — Liked/Learned/Lacked/Longed For가 ssc Continue + dspm Surprises + CONTEXT.md "Deferred Ideas"로 분산 흡수 가능.
  - `5why`(Five Whys, 3회) — 사용 빈도 최저 + 5번의 AskUserQuestion 흐름이 본 milestone의 "마찰 제거" 목표와 직접 충돌. dspm Mistakes 항목으로 root cause를 잡을 수 있어 기능 손실 미미.
- **D-05:** dropped lens(`sail`/`4ls`/`5why`)는 SKILL.md `<process>` Step 5의 sub-block 섹션과 Step 2의 `case` 매핑, Step 5의 `LENS_NAME` 매핑에서 **완전히 삭제**한다. 주석 처리·deprecated 표시 형태로 남기지 않는다 (surgical 변경 + 코드 명확성).

### Dropped Lens Argument 처리

- **D-06:** 사용자가 `sg-retro 42 sail` 또는 `sg-retro 42 4ls dspm` 같이 제거된 lens 코드를 인자로 넘기면, 가장 가까운 유지 lens로 silent fallback 하지 않고 **명시적 에러로 거부**한다. 메시지는 stderr에:
  ```
  Lens '{code}' is no longer supported (removed in v2.9). 
  Available lenses: ssc, dspm, analyze. 
  Run without lens argument to use smart default (dspm+ssc).
  ```
  뒤 `exit 1`. silent mapping은 행동 변화를 숨겨 향후 디버깅을 어렵게 만든다.
- **D-07:** 멀티 lens 인자(`sg-retro 42 sail dspm`)에서 일부만 dropped인 경우에도 첫 dropped 코드 발견 즉시 에러로 거부한다. 부분 실행 금지(혼란 방지).

### AskUserQuestion Fallback 제거

- **D-08:** Phase 42에서 Step 2의 AskUserQuestion 호출 블록(`LENS_CODE`가 비어있을 때의 6-옵션 multiSelect 분기)을 **완전히 삭제**한다. 도달 가능한 진입 경로가 사라지기 때문(인자 없음 → smart default, 잘못된 인자 → 에러). 명시적 lens 선택 UI는 Phase 43에서 `--pick` flag로 재도입된다.
- **D-09:** Step 2의 케이스 매핑은 3개로 축소: `ssc`/`dspm`/`analyze`만 매칭, 나머지는 D-06의 에러 경로로 떨어진다.

### Pairwise Sync (skills/ + .agents/skills/)

- **D-10:** `skills/sg-retro/SKILL.md`와 `.agents/skills/sg-retro/SKILL.md` 두 파일에 동일한 변경을 적용한다. ROADMAP Phase 42 SC#3에서 명시적으로 lock-in된 요구사항이며, CLAUDE.md "skills/ + .agents/ 쌍 커버" 컨벤션과 일치한다. 두 파일은 동일 commit에 함께 staged 되어야 한다.
- **D-11:** `skills/sg-learn/SKILL.md` 및 `.agents/skills/sg-learn/SKILL.md`는 **수정 대상 아님**. sg-learn은 `Skill(skill="sg-retro", args="$ARGUMENTS")` 한 줄의 thin pass-through이므로 sg-retro 변경이 자동으로 반영된다(Out of scope: "sg-retro skill rewrite — 기존 구조 유지").

### 테스트·검증 전략

- **D-12:** 검증 시나리오(planner가 PLAN.md `<verification_steps>`에 포함):
  1. `Skill(skill="sg-retro", args="42")` → AskUserQuestion 없이 dspm + ssc 두 lens가 순서대로 lessons 파일에 append 된다.
  2. `Skill(skill="sg-retro", args="42 ssc")` → ssc 단독 실행.
  3. `Skill(skill="sg-retro", args="42 sail")` → stderr 에러 메시지 + exit 1, lessons 파일 미생성.
  4. `Skill(skill="sg-retro", args="42 dspm sail")` → 첫 dropped 발견 시 즉시 에러, dspm도 실행 안 됨.
  5. `Skill(skill="sg-learn", args="42")` → sg-retro 호출 → smart default 적용 확인.
  6. `skills/sg-retro/SKILL.md`와 `.agents/skills/sg-retro/SKILL.md` `diff` 비교 시 의미적 동등(파일 헤더만 차이).

### Claude's Discretion

- **에러 메시지 영문/한글 양식:** 코드(`sail`, `ssc`, `dspm`) 같은 머신 토큰은 영문 그대로, 산문은 사용자 언어 자동 감지 후 그 언어로 렌더링한다(CLAUDE.md "사용자 언어 메시지" 컨벤션). 영문 문자열은 스크립트 내부의 fallback이며 Claude가 출력 시점에 언어를 맞춘다.
- **Step 2 케이스 매핑 코드 스타일:** case-statement vs if-elif는 planner 재량. 단, dropped lens 처리 분기는 별도 case로 분리해서 에러 메시지를 일관되게 emit 한다.
- **Smart default 진입 시 stderr 로그:** `Using smart default lens: dspm + ssc` 같은 안내 메시지 출력 여부는 planner 재량. 사용자가 인자를 안 넘긴 "암묵적 동작"을 명시적으로 알리는 것이 좋다고 판단하지만, 출력 잡음을 줄이려면 생략 가능.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 본 phase의 직접 대상 파일 (pairwise 수정)

- `skills/sg-retro/SKILL.md` — Smart default 분기·lens consolidation의 1차 수정 대상. Step 2(케이스 매핑), Step 5(sub-block 정의), Step 5 시작부(LENS_NAME 매핑), success_criteria 항목 #2 모두 수정 필요.
- `.agents/skills/sg-retro/SKILL.md` — 위 파일의 pairwise 미러. 동일 변경 적용.
- `skills/sg-learn/SKILL.md` — **읽기만** (변경 없음 확인용). thin pass-through 동작 검증.
- `.agents/skills/sg-learn/SKILL.md` — 위와 동일.

### 요구사항·로드맵·프로젝트 컨텍스트

- `.planning/REQUIREMENTS.md` §LENS — LENS-01, LENS-02 정의 + Future Requirements / Out of Scope 명시.
- `.planning/ROADMAP.md` §"Phase 42: Smart Default Lens + Lens Consolidation" — Goal + 3개 Success Criteria + Requirements 매핑.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone target features 목록.
- `.planning/STATE.md` — milestone v2.9 진행 상태.

### 컨벤션·아키텍처 참조

- `CLAUDE.md` §"새 규칙 파일 추가" — `.claude/sg-rule.*.local.md` 형식 (본 phase는 직접 사용 안 하지만 분석 lens가 생성하는 rule 형식이 여기 정의됨).
- `CLAUDE.md` §"macOS 셸 이식성" — bash 스니펫 작성 시 macOS/Linux 양립 규칙. sg-retro/SKILL.md는 macOS-compatible grep + sed + awk pipeline을 명시적으로 보존해야 함(파일 내부 주석 참조).
- `CLAUDE.md` §"사용자 언어 메시지" — 에러 메시지 산문은 사용자 언어, 머신 토큰은 영문.
- `CLAUDE.md` §"skills/ + .agents/ 쌍 커버" — Phase 32 retro에서 도출된 Medium-1 컨벤션. 본 phase의 SC#3이 직접 이 컨벤션을 강제.
- `.planning/codebase/ARCHITECTURE.md` §"sg-retro" — sg-retro가 STATE.md/HANDOFF.md/lessons 파일에 어떻게 연결되는지의 아키텍처 맥락.
- `.planning/codebase/CONVENTIONS.md` — 18개 sg-* skill 공통 컨벤션.

### Lens 사용 빈도 데이터 (consolidation 근거)

- `.planning/lessons/*.md` — 11개 lessons 파일의 `## Lens:` 헤더 빈도가 D-03/D-04 선정 근거. grep 명령: `grep -h "^## Lens:" .planning/lessons/*.md | sort | uniq -c | sort -rn`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Step 2의 case-statement 구조** — `skills/sg-retro/SKILL.md` 87-93줄에 이미 6개 lens를 case로 매핑한다. 3개로 줄이면서 동일 구조 재사용.
- **Step 3 artifact collection** — CONTEXT/PLAN/SUMMARY 수집 로직은 lens 종류와 무관하므로 변경 없음.
- **Step 6 append 로직** — `LENS_HEADER`, `RUN_SUFFIX`, append 블록은 lens 코드와 무관한 일반 로직. 변경 없음.
- **Step 5 ssc/dspm sub-block 본문** — 유지되는 두 lens의 facilitation 절차는 기존 문구 그대로 보존.
- **Step 5 analyze sub-block** — 유지. `ANALYZE_LENS_RAN=true` flag와 D-02 auto-suggest 분기 모두 변경 없음.

### Established Patterns

- **macOS-compatible grep + sed + awk pipeline** (sg-retro Step 1) — Phase 32 retro에서 lock-in된 보존 컨벤션. `# --- BEGIN STATE.md Phase parsing block ---` 주석 블록 내부는 절대 단축하지 말 것 (SKILL.md 31줄 주석에 명시).
- **D-21 single `>>` redirect block** (Step 6) — partial-write 방지를 위해 lens section 전체를 한 번에 append. 변경 없음.
- **D-19 단일 lens 인자 경로** (Step 2) — `LENS_CODE` set + `EXTRA_LENS_CODES` 조합 패턴. 유지하되 3개만 허용.
- **success_criteria 11개 항목 (sg-retro SKILL.md 408-420줄)** — 항목 #2, #5(DSPM 가드), #7(sail/5why/analyze 직접 실행), #8(`4ls dspm` 멀티)에서 sail/4ls/5why를 명시. 본 phase는 #2를 3-lens로 축소하고, #7·#8에서 dropped lens 언급을 제거(혹은 reject 동작으로 재작성)해야 함.

### Integration Points

- **sg-learn → sg-retro Skill 호출 (`skills/sg-learn/SKILL.md` line 23-25)** — 변경 없음. smart default는 sg-retro 내부에서 처리되므로 sg-learn은 그대로 args를 forward.
- **HANDOFF.md append (sg-retro Step 6 마지막)** — lens 변경과 무관. 회고가 성공적으로 끝나면 한 행 추가.
- **lessons 파일 (`.planning/lessons/{NN}-{YYYY-MM-DD}.md`)** — 파일 포맷 자체는 변경 없음. lens 헤더가 3종 중 하나로 좁혀지는 것뿐.
- **stop_hook.cjs / transcript_matcher.cjs** — 본 phase는 hook 변경 없음. 회고는 Skill 직접 호출로만 진입.

</code_context>

<specifics>
## Specific Ideas

- **에러 메시지 톤:** "removed in v2.9"처럼 버전 명시로 사용자가 changelog를 찾아갈 수 있게 함. silent fallback 금지 결정과 일관됨.
- **smart default 진입 로그(Claude 재량):** 출력하기로 결정한다면 stderr에 한 줄로 `[sg-retro] No lens specified — using smart default: dspm + ssc` 정도. lessons 파일에는 영향 없음.
- **lens 실행 순서 dspm → ssc:** dspm이 기술 회고의 핵심이고, ssc는 행동 변화 권고로 후행하는 게 자연스러움. 사용자가 lessons 파일을 읽을 때 "무엇이 일어났는가(dspm)" → "다음에 무엇을 할 것인가(ssc)" 흐름이 됨.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 종류 기반 적응형 default** — 단순 phase는 `ssc`만, 복잡 phase는 `dspm+ssc+analyze` 같은 분기. REQUIREMENTS.md "Future Requirements (deferred)"에 이미 등록됨. v3.x.
- **`--pick` flag 도입** — Phase 43이 직접 담당(LENS-03).
- **Action Items P1 시각 강조 + lens 의도 설명 줄** — Phase 43이 담당(DISPLAY-01, DISPLAY-02).
- **README/TEAM.md 문서 동기화** — Phase 44가 담당(DOC-01).
- **Five Whys lens 재도입 가능성** — 본 phase에서 제거하지만, 향후 root-cause 분석 도구가 필요해지면 `sg-rca` 같은 별도 skill로 분리하는 게 sg-retro의 "마찰 제거" 목표와 충돌하지 않는 방향. backlog 후보.
- **`sail` / `4ls` lens 사용자 정의 복원** — 일부 사용자가 metaphor / emotional 회고를 선호할 가능성. 현재로선 우선순위 낮음. 사용자 피드백 누적 후 재검토.
- **Lessons 파일 archival 정책** — 본 phase와 무관. milestone 종료 시 `lessons_ranker.cjs --archive`로 별도 처리.

</deferred>

---

*Phase: 42-smart-default-lens*
*Context gathered: 2026-05-30*
