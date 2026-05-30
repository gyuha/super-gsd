# Phase 44: Documentation Sync - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

이 phase는 v2.9 milestone의 마무리 — **사용자 문서(README + TEAM.md)가 새 sg-learn/sg-retro 동작과 일치하도록 동기화**한다. Phase 42(smart default + 3 lens consolidation)와 Phase 43(`--pick` + DISPLAY-01/02)에서 코드는 이미 변경 완료. 본 phase는 그 변경을 사용자가 발견·이해할 수 있는 문서 표면(`README.md`, `README.ko.md`, `.planning/TEAM.md`)에 반영하고, sg-retro SKILL.md frontmatter가 새 동작을 정확히 광고하는지 검증한다.

scope 명시:

- **In scope:**
  - `README.md` Commands 테이블 `sg-learn` 행 description 갱신(SC#1) + 같은 테이블 `sg-retro` 행 description 갱신(현재 "6 lenses (Sailboat, Five Whys, and more)" 명백한 stale 문구 — D-02 참조).
  - `README.ko.md` 동일 두 행의 한글 description 갱신(en/ko parity).
  - `.planning/TEAM.md`에 회고 워크플로우 가이드 섹션 추가(SC#2) — sg-learn 실행 시점, lessons 저장 위치, `--pick` 사용 시점, smart default 설명.
  - `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md` frontmatter description 검증(SC#3) — Phase 42·43이 이미 갱신했으므로 read-only grep 검증이 기본, 토큰 누락 발견 시에만 surgical 수정.
- **Out of scope (D-XX 명시):**
  - 새 코드·로직 변경(skills/, hooks/, .agents/skills/sg-retro 본문 등 frontmatter 외).
  - `docs/COMMANDS.md` 갱신 — 별도 추적, 본 phase 미포함(deferred).
  - `CHANGELOG.md` — 배포 트리거(CLAUDE.md "배포") 시점에 자동 처리.
  - Phase 42/43 retro Action Items P1 #2(sg-parallel-execute → sg-review commit 자동화), P1 #3(STATE.md `Phase:` auto-sync) — 본 phase는 DOC-01 한정. 별도 quick task 후속 권장(D-08 참조).
- **Out of scope (milestone 전체):** lens 추가, sg-retro skill rewrite, lessons_ranker.cjs 알고리즘 변경.

</domain>

<decisions>
## Implementation Decisions

### 파일 범위 — 4 target 파일 + 2 verification 파일

- **D-01:** 본 phase의 **변경(write) 대상은 3 파일**: `README.md`, `README.ko.md`, `.planning/TEAM.md`. **검증(read-only grep) 대상은 2 파일**: `skills/sg-retro/SKILL.md`, `.agents/skills/sg-retro/SKILL.md`. 검증 파일은 Phase 42·43에서 이미 frontmatter description이 새 동작을 반영하도록 갱신됨 — grep으로 핵심 토큰(`three lenses`/`dspm+ssc`/`--pick`)이 모두 존재함을 확인하고 누락 시에만 surgical 추가. **불필요한 frontmatter rewrite 금지**(Phase 42 D-10/Phase 43 D-16 prose drift 교훈).

- **D-02:** **`README.md` / `README.ko.md`의 sg-retro 행도 함께 갱신**한다. SC#1 본문은 "sg-learn 행 description"만 명시하지만, 같은 Commands 테이블의 sg-retro 행은 현재 `"6 lenses (Sailboat, Five Whys, and more)"`로 **Phase 42에서 폐기된 lens 명을 그대로 표기 중 — 명백한 stale 문서 버그**. milestone goal("README가 새 sg-learn/sg-retro 동작을 반영하도록 동기화")와 직접 충돌하는 행을 남겨두고 다음 milestone으로 넘기는 것은 본 milestone의 본질 자체를 부정한다. 이는 scope creep이 아니라 **SC#1 spirit + milestone goal의 정합 충족**.

### Plan 단위 분할 — 2 plans, wave:1 parallel

- **D-03:** **2 plans, 둘 다 wave:1 + non-overlapping files_modified → parallel dispatch**. Phase 42·43에서 검증된 패턴 답습(2 Task() agent 동시, ~5-6분/agent, conflict 0건):
  - **`44-01-PLAN.md`** — **README 동기화 + SKILL.md frontmatter 검증.** 변경 파일: `README.md`, `README.ko.md`. 검증 파일: `skills/sg-retro/SKILL.md`, `.agents/skills/sg-retro/SKILL.md`(grep만). 단일 작업 의미 단위 = "Commands 테이블이 새 동작과 일치".
  - **`44-02-PLAN.md`** — **TEAM.md 회고 워크플로우 섹션 추가.** 변경 파일: `.planning/TEAM.md`. 단일 작업 의미 단위 = "팀원이 sg-learn 워크플로우를 가이드로 학습".
- **D-04:** 1 plan 단일 통합 거부 사유: README table-row 갱신과 TEAM.md 가이드 섹션 신설은 **인지·검증 모델이 다르다**(전자: 토큰 정확성 grep, 후자: 산문 완결성·정확성). 같은 plan에 넣으면 verification block이 두 종류 acceptance를 섞어 복잡도가 증가. 분리하면 두 implementer가 각자 단순한 acceptance set으로 작업 가능.
- **D-05:** N plans(파일별 분리) 거부 사유: `README.md`/`README.ko.md`는 같은 의미적 변경의 영문/한글 mirror이므로 같은 plan 안에 두는 게 prose drift 차단에 유리(plan-time enumerate가 두 파일 동시 적용). 분리하면 한 파일만 갱신되고 다른 파일이 stale로 남을 risk 증가.

### README 행 갱신 본문 — token spec

- **D-06:** **sg-learn 행 새 description**(영문 source):
  > `Run a structured retrospective on the just-completed phase via sg-retro — smart default runs three lenses (ssc, dspm) without prompting; pass --pick to choose lenses interactively`
  필수 포함 토큰: `smart default`, `three lenses` 또는 `3 lenses`, `ssc`, `dspm`, `--pick`. 한글(`README.ko.md`)도 동일 의미 토큰 보존: `smart default`/`스마트 기본값`, `세 가지 렌즈`/`3 lens`, `ssc`/`dspm`/`--pick`(머신 토큰 영문 그대로). 정확한 phrasing은 planner 재량이나 핵심 토큰은 필수.
- **D-07:** **sg-retro 행 새 description**(영문 source):
  > `Run a standalone retrospective with three lenses (ssc, dspm, analyze) — smart default applies dspm+ssc when no lens argument is given, or use --pick for interactive selection; results saved to .planning/lessons/`
  **제거 대상 토큰**: `6 lenses`, `Sailboat`, `Five Whys`, `and more`. 한글 mirror 동일.

### TEAM.md 섹션 신설 — 위치·언어·내용

- **D-08:** **새 섹션 헤더**: `## Retrospective workflow`(영문). TEAM.md 본문은 영문 헤더 + 영문 산문 + 한국어 sample block의 혼합 패턴이므로 신규 섹션도 영문 헤더를 따른다. CLAUDE.md "GSD 문서 작성 지침"의 "한글 작성" 규칙은 `.planning/` 내 산문에 적용되지만 TEAM.md는 이미 영문 dominant — drift 방지 우선. (필요 시 별도 quick task로 TEAM.md 전체 한글화 검토.)
- **D-09:** **섹션 위치**: `## File ownership`과 `## Merge order` 사이. 워크플로우 conventions(file ownership) → workflow steps(retrospective) → shipping(merge order) 흐름이 자연스러움.
- **D-10:** **섹션 내용** — 4개 sub-block 권장(planner가 최종 구조 결정):
  1. **When to run sg-learn**: After `sg-review` (즉 `sg-review`가 끝난 직후, `sg-ship` 전).
  2. **What sg-learn does**: `sg-retro` skill 호출 → smart default `dspm+ssc` 두 lens 자동 실행 → 결과 append to `.planning/lessons/{NN}-{YYYY-MM-DD}.md`.
  3. **When to use `--pick`**: Smart default 외의 특정 lens 조합이 필요할 때(예: `analyze` lens 단독 실행, `ssc`만 단독 실행). `sg-retro {phase} --pick`로 호출하면 1회 multiSelect로 lens 선택.
  4. **Where results live**: `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 형식, append-only. `.planning/HANDOFF.md`에 한 행 추가.
- **D-11:** 섹션 길이 상한: ~30줄(`File ownership` 섹션과 시각적 균형). 길어지면 docs/RETROSPECTIVE.md 분리 후 link만 두는 방식 — 본 phase는 inline section만 (별도 doc 신설은 scope creep).

### SKILL.md frontmatter 검증 — grep-based no-op 기본

- **D-12:** **`skills/sg-retro/SKILL.md` description 검증**(현재 line 3):
  > `Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of three lenses (ssc, dspm, analyze) and appends results to .planning/lessons/. Smart default (dspm+ssc) runs when no lens argument is provided.`
  필수 토큰 grep: `three lenses`, `(ssc, dspm, analyze)`, `Smart default`, `dspm+ssc`. **현재 모두 존재 — 변경 불요(verification only).** 단, `--pick` 토큰이 description에 부재. SC#3은 "3 lens 반영"만 요구하나 Phase 43이 추가한 `--pick`도 동일 frontmatter에 반영하는 것이 일관적. **권장: 한 줄 추가 또는 기존 문장 끝에 ` Use --pick for interactive lens selection.` 추가.** 실 변경 여부는 planner 재량.
- **D-13:** **`.agents/skills/sg-retro/SKILL.md` description 검증**(현재 line 3):
  > `Run a structured retrospective on a GSD phase with one of three lenses (ssc, dspm, analyze) — select multiple lenses in one call or omit lens argument for smart default (dspm+ssc) — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md. AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.`
  필수 토큰 grep: `three lenses`, `(ssc, dspm, analyze)`, `smart default`, `(dspm+ssc)`. **현재 모두 존재 — 변경 불요.** `--pick` 동작은 `argument-hint`에 명시되어 있고(graceful-exit 안내), description은 환경 한정 안내가 우선이므로 추가 변경 불요. **권장: read-only 검증으로 종료.**

### Plan-time prose drift 차단 — Phase 43 P1 #1 적용

- **D-14:** **Plan 작성 시 enumerate 카테고리 2개 명시**(Phase 43 P1 #1 lesson 직접 적용 — 다음 phase 전 도입 필수):
  1. **변경되는 산문 토큰**: README 행에서 제거되는 토큰(`6 lenses`, `Sailboat`, `Five Whys`, `and more`, `extract patterns and generate hooks` 등) + 추가되는 토큰(`smart default`, `three lenses`, `ssc`, `dspm`, `analyze`, `--pick`).
  2. **변경되는 구조를 묘사하는 보존 블록**: Commands 테이블 헤더 행(`| 명령어 | 하는 일 | 사용 시점 |`), 행 형식(`| /super-gsd:sg-xxx | ... | ... |`), SKILL.md frontmatter YAML 구조(`---`/`name:`/`description:`/`argument-hint:`) — 이들은 보존 대상이면서 동시에 변경되는 내용을 감싸므로 grep acceptance와 충돌 가능성을 plan-time에 명시.
- **D-15:** Plan `<verification_steps>`에 위 양 카테고리의 cross-check 단계 명시 — "추가 토큰 N개가 정확히 N번 grep match", "제거 토큰 N개가 grep 0 match", "보존 블록(테이블 헤더/frontmatter delimiters)이 변경 전후 byte-identical".

### Pairwise Sync (D-10/D-16 carry-forward, 본 phase 한정 적용)

- **D-16:** Phase 42·43에서 lock-in된 pairwise convention(`skills/` + `.agents/skills/` 동일 commit)은 본 phase에서 **frontmatter 검증 차원에서 적용**된다. 만약 D-12 권장에 따라 `skills/sg-retro/SKILL.md` description에 `--pick` 토큰을 추가한다면 `.agents/skills/sg-retro/SKILL.md` description에도 동등한 의미 토큰을 추가해야 한다(D-13의 환경 한정 문구 보존하면서). 변경하지 않기로 결정 시 양쪽 다 변경 없음.

### Phase 42·43 retro P1 Action Items 처리

- **D-17:** Phase 43 retro P1 #1(plan template "구조 묘사 보존 블록" 카테고리 추가)은 **D-14를 통해 본 phase plan 작성 시점에 적용**된다 — closure within this phase. 단, sg-plan SKILL.md 자체에 enumerate 카테고리를 영구 추가하는 작업은 별도 quick task(`hooks/plan_lint.cjs` 신설과 함께)로 분리. 본 phase는 DOC-01만 다룬다.
- **D-18:** Phase 42 P1 #2 + Phase 43 P1 #2(sg-parallel-execute → sg-review BASE==HEAD commit 자동화)는 **본 phase scope 외**. 본 phase는 2 plans wave:1 parallel이므로 sg-parallel-execute 사용 후 sg-review 진입 시 또 같은 manual commit 단계가 재발할 가능성 100%. **권장**: 본 phase 시작 전 quick task로 `skills/sg-review/SKILL.md` Step 1에 BASE==HEAD 감지 + auto-commit 안내 추가 (P1을 2번 연속 deferred한 lesson 즉시 closure). 사용자 확인 후 진행.
- **D-19:** Phase 43 P1 #3(STATE.md `Phase:` 필드 auto-sync, milestone 내 3번 재발)도 **본 phase scope 외**. 별도 quick task. 본 phase 진입 시 STATE.md `Phase: Not started (defining requirements)`로 stale 상태일 가능성 — sg-execute 진입 시 phase number를 인자로 명시 전달(`Skill(skill="sg-execute", args="44")`)로 우회.

### Claude's Discretion

- **README description 정확 phrasing**: D-06/D-07은 필수 토큰만 명시. 정확한 한 문장 구성·어순·관계는 planner 재량. 한글 번역도 자연스러운 한국어 우선.
- **TEAM.md 섹션 sub-block 순서/구조**: D-10은 4개 sub-block 권장하나 단일 prose 단락, bullet list, mini-table 등 형식 자유. 30줄 상한만 준수.
- **SKILL.md frontmatter `--pick` 토큰 추가 여부**: D-12 권장은 추가, D-13 권장은 보류. 두 결정은 독립적이며 planner가 코드리뷰 risk(prose drift 잠재) 대 일관성 trade-off를 판단해 결정 가능. 양쪽 다 변경 없음으로 가도 SC#3은 grep 검증으로 충족.
- **Quick task 분리 시점(D-18)**: 본 phase 시작 전 vs 본 phase 종료 후. 본 phase 시작 전 권장(deferred 누적 차단)이지만 일정 압박 있을 시 종료 후 +1 quick task.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 본 phase의 직접 변경 대상 파일

- `README.md` — Commands 테이블 sg-learn 행(line 37) + sg-retro 행(line 50) 갱신.
- `README.ko.md` — Commands 테이블 sg-learn 행(line 37) + sg-retro 행(line 50) 갱신(영문 mirror).
- `.planning/TEAM.md` — `## File ownership` 섹션과 `## Merge order` 섹션 사이에 `## Retrospective workflow` 신설(약 30줄 이내).

### 본 phase의 read-only 검증 대상

- `skills/sg-retro/SKILL.md` — frontmatter `description` line 3 grep 검증(필수 토큰: `three lenses`, `(ssc, dspm, analyze)`, `Smart default`, `dspm+ssc`). 변경은 D-12 권장 한정 옵셔널.
- `.agents/skills/sg-retro/SKILL.md` — frontmatter `description` line 3 grep 검증(필수 토큰 동일). 변경 권장 없음.

### 요구사항·로드맵·프로젝트 컨텍스트

- `.planning/REQUIREMENTS.md` §DOC — DOC-01 정의.
- `.planning/ROADMAP.md` Phase 44 entry(line ~499-510) — Goal + 3개 Success Criteria + Requirements 매핑.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone target features(본 phase는 milestone 마무리).
- `.planning/STATE.md` — milestone v2.9 진행 상태(현재 stale `Phase: Not started`).

### Phase 42·43 carry-forward (직전 phase decisions)

- `.planning/phases/42-smart-default-lens/42-CONTEXT.md` — D-01~D-12 (특히 D-01 smart default = `dspm ssc` 고정, D-03 유지 3개 lens, D-04 제거 3개 lens, D-10 pairwise sync).
- `.planning/phases/43-pick-display-polish/43-CONTEXT.md` — D-01~D-18 (특히 D-01~D-04 `--pick` 동작, D-08~D-11 DISPLAY-01 P1 emoji prefix, D-12~D-15 DISPLAY-02 intent line).
- `.planning/lessons/42-2026-05-30.md` — DSPM lens P1 #1(plan lint preserve vs grep acceptance), P1 #2(sg-parallel-execute → sg-review BASE==HEAD), P2(STATE.md auto-sync). 본 phase D-14, D-18, D-19가 직접 인용.
- `.planning/lessons/43-2026-05-30.md` — DSPM lens P1 #1(구조 묘사 보존 블록 enumerate 카테고리 추가), P1 #2(commit 자동화 deferred 금지), P1 #3(STATE.md Phase: 자동 sync P1 격상). 본 phase D-14, D-18, D-19가 직접 인용.

### 컨벤션·아키텍처 참조

- `CLAUDE.md` §"버전 관리" — CHANGELOG.md 갱신 의무(본 phase 종료 후 배포 트리거 시점에 처리, 본 phase 미포함).
- `CLAUDE.md` §"배포 트리거" — "배포" 입력 시 자동 절차(본 phase ship 후 별도 트리거).
- `CLAUDE.md` §"macOS 셸 이식성" — grep 검증 스니펫 작성 시 BSD/GNU 양립(`-P` 금지, `-E` 사용).
- `CLAUDE.md` §"사용자 언어 메시지" — README.md 영문 source, README.ko.md 한국어 mirror, 머신 토큰(`/super-gsd:sg-*`, `--pick`, `ssc`, `dspm`, `analyze`)은 영문 그대로.
- `CLAUDE.md` §"GSD 문서 작성 지침" — GSD 스킬 생성/수정 문서 한글. TEAM.md는 기존 영문 dominant 패턴 유지(D-08 근거).
- `CLAUDE.md` §"skills/ + .agents/ 쌍 커버" — Phase 32 Medium-1 convention. 본 phase D-16이 적용.
- `.planning/codebase/ARCHITECTURE.md` §"Anti-Patterns" — "Updating only `skills/` without updating `.agents/skills/`" 명시.

### Phase 42·43 SUMMARY(plan-spec deviation 패턴 참조)

- `.planning/phases/42-smart-default-lens/42-01-SUMMARY.md` §"Plan-spec Deviations" — surface 패턴 모범. 본 phase plan도 deviation 발생 시 같은 형식으로 SUMMARY에 명시.
- `.planning/phases/43-pick-display-polish/43-01-SUMMARY.md` — 동일 패턴 답습 확인.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **README.md Commands 테이블 구조(line 29-52)** — 21 행, 3 컬럼(`Command | What it does | When to use`). sg-learn(row 37), sg-retro(row 50)만 description 컬럼 갱신. 다른 행·헤더·셀 구분자는 byte-identical 보존. 같은 구조가 `README.ko.md` line 29-52에 한글 헤더(`| 명령어 | 하는 일 | 사용 시점 |`)로 mirror됨.
- **TEAM.md 기존 섹션 구조(line 1-104)** — `# Team Workflow Guide` → `## Quick Start` → `## Branch strategy` → `## File ownership` → `## Merge order` 흐름. 신규 `## Retrospective workflow`는 `File ownership` 직후·`Merge order` 직전 삽입. 각 섹션은 `---` 구분자로 분리 — 신규 섹션도 동일 패턴.
- **sg-retro SKILL.md frontmatter 구조(line 1-4)** — `---` / `name:` / `description:` / `---` YAML block. 검증·수정 모두 line 3의 description 단일 줄만 대상. argument-hint는 변경 없음.
- **`.agents/skills/sg-retro/SKILL.md` frontmatter 구조(line 1-5)** — `---` / `name:` / `description:` / `argument-hint:` / `---`. line 3 description + line 4 argument-hint 모두 이미 Phase 43에서 graceful-exit 안내 추가됨. 본 phase는 description만 grep 검증 대상.

### Established Patterns

- **README.md ↔ README.ko.md mirror lock-step** — 두 파일은 행 단위로 1:1 대응. 한쪽 행을 변경하면 다른 쪽도 같은 의미·같은 행 인덱스에 변경. plan에서 두 파일을 한 plan에 묶어 prose drift 차단(D-05).
- **TEAM.md 영문 dominant + 한국어 sample table** — Quick Start 섹션 line 27-33이 한국어 sample(`## 팀 현황 | 팀원 | 최근 Phase`). 본문 산문은 영문. 신규 retrospective 섹션은 같은 패턴(영문 헤더·산문, 필요 시 한국어 sample) 유지.
- **2-plan parallel execute(wave:1 + non-overlapping files)** — Phase 42·43에서 검증된 패턴. `parallel_groups.json` 자동 생성(sg-parallel-execute가 PLAN.md `wave:` 필드에서 빌드). 본 phase도 같은 형태(`44-01-PLAN.md` files: README.md + README.ko.md + skills/.agents grep만; `44-02-PLAN.md` files: .planning/TEAM.md).
- **macOS-compatible grep 검증** — `-E` ERE 사용, `-P` PCRE 금지. 토큰 부재/존재 검증은 `grep -c "pattern"`로 count 비교.

### Integration Points

- **`/super-gsd:sg-learn` slash command** — `skills/sg-learn/SKILL.md`이 `Skill(skill="sg-retro", args="$ARGUMENTS")` thin pass-through(Phase 42 D-11). README의 sg-learn 행 description은 사용자에게 보이는 1차 표면 — Phase 42·43에서 변경된 sg-retro 동작이 사용자에게 정확히 광고되는 유일한 통로.
- **`/super-gsd:sg-retro` slash command** — `skills/sg-retro/SKILL.md` 직접. README의 sg-retro 행 description도 동일한 광고 통로. 현재 "6 lenses (Sailboat, Five Whys, and more)" 표기로 Phase 42 deletion 사실을 광고에서 누락 — 본 phase D-02가 해결.
- **`.planning/lessons/{NN}-{YYYY-MM-DD}.md`** — 회고 결과 저장 위치. TEAM.md retrospective 섹션이 사용자에게 이 경로를 정확히 알린다(D-10 sub-block "Where results live").
- **`.planning/HANDOFF.md`** — sg-retro 성공 종료 시 append-only 한 행 추가. TEAM.md 신규 섹션이 언급할지 여부는 planner 재량(이미 File ownership 섹션이 HANDOFF.md를 다룸 — 중복 회피).
- **lessons_ranker.cjs** — 본 phase는 ranker 변경 없음. TEAM.md 섹션에서 ranker 동작 언급 여부도 planner 재량(milestone v2.9 scope는 retrospective UX, ranker는 v1.2 fixture).

</code_context>

<specifics>
## Specific Ideas

- **D-02 정당화 강조**: SC#1 본문이 "sg-learn 행 description"만 명시하더라도, 같은 Commands 테이블의 sg-retro 행에 stale `6 lenses (Sailboat, Five Whys, and more)`를 남기는 것은 milestone goal과 직접 충돌. 본 phase가 milestone v2.9 마무리이므로 stale 광고를 남기고 milestone close하면 사용자가 한 release 동안 잘못된 lens 정보를 보게 됨. 이는 surgical 원칙 위배가 아니라 milestone goal 완수.
- **TEAM.md 새 섹션 톤**: `## Branch strategy`, `## File ownership` 섹션은 "rule + table + bash example" 패턴. retrospective 섹션도 같은 톤 유지하면 시각·인지 일관성 확보.
- **README 행 한글 번역 주의**: `smart default`, `interactive selection` 같은 표현은 한국어로 자연스럽게(`스마트 기본값`/`자동 적용`, `대화형 선택`). 단, `--pick`/`ssc`/`dspm`/`analyze`는 영문 머신 토큰 보존.
- **Phase 43 P1 #1 lesson 직접 적용 시연**: D-14/D-15가 plan template에 정식 enumerate 카테고리를 영구 추가하기 전 임시 적용 사례 — 본 phase가 lesson 직접 closure를 시연하는 "live test"가 됨. 효과 검증되면 sg-plan SKILL.md 영구 추가 quick task 권고.

</specifics>

<deferred>
## Deferred Ideas

- **`docs/COMMANDS.md` 갱신** — README Commands 테이블은 quick reference, 전체 명령 레퍼런스는 docs/COMMANDS.md. 본 phase는 README 한정. docs/COMMANDS.md sg-learn/sg-retro 항목 갱신은 별도 quick task 또는 v2.9.1 patch 후보.
- **CHANGELOG.md v2.9 entry** — 배포 트리거(`배포` 입력) 시점에 자동 생성. 본 phase 종료 → sg-ship → 배포 트리거 흐름.
- **sg-plan SKILL.md template에 enumerate 카테고리 영구 추가** — D-14/D-15가 본 phase에서 임시 적용. Phase 43 P1 #1 lesson의 영구 closure는 별도 quick task(`hooks/plan_lint.cjs` 신설과 함께).
- **sg-parallel-execute → sg-review BASE==HEAD 자동 commit 안내** — Phase 42 P1 #2 + Phase 43 P1 #2. 본 phase 시작 전 quick task로 처리 권장(D-18). 더 이상 deferred 금지 lesson.
- **STATE.md `Phase:` 필드 auto-sync** — Phase 43 P1 #3 (milestone 내 3번 재발 → P1 격상). 별도 quick task(`hooks/state_sync.cjs` 신설 또는 sg-plan/sg-execute 종료 단계 보강).
- **TEAM.md 전체 한글화** — 본 phase는 영문 dominant 유지(D-08). milestone 단위 결정 후보로 backlog.
- **README "How super-gsd handles retrospectives" 별도 섹션 신설** — Commands 테이블 행 description만으로 부족할 수 있으나 본 phase는 surgical(테이블 행만). 별도 phase 후보.
- **AGENTS.md sg-retro 섹션 검토** — line 233 등에서 sg-retro 언급. lens 수 명시 없으므로 검증 후 stale 시 추가 quick task.
- **lessons_ranker.cjs P1 emoji prefix(`🔴 P1`) 호환성** — Phase 43에서 regex 검증 완료(P1 추출에 emoji 영향 없음). 본 phase 영향 없음 — 참고용 deferred.

</deferred>

---

*Phase: 44-documentation-sync*
*Context gathered: 2026-05-31*
