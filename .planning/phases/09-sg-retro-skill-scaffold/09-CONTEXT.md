# Phase 9: sg-retro Skill scaffold - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

super-gsd 플러그인에 첫 자체 Skill인 `sg-retro`를 추가한다. `skills/sg-retro/SKILL.md` 한 파일과 `.claude-plugin/plugin.json`의 `"skills": "./skills/"` 등록 한 줄로 완결한다. 별도 helper 스크립트(Python/bash), 자동화 테스트 자산, hooks 변경은 **도입하지 않는다** (Phase 6 D-04 + Phase 7 D-08 일관성). 기존 `hooks/stop_hook.py`의 `_read_current_phase()` 및 `save_hookify_lessons()`는 건드리지 않으며, 이 Skill은 그 helper를 거치지 않고 lessons 파일을 직접 작성한다.

Skill의 동작:
1. `Skill(skill="sg-retro", args="{phase} {lens?}")` 형태로 호출. `args` 미지정 시 `.planning/STATE.md`의 `Phase:` 라인에서 phase 번호를 추출(Phase 7 D-04~D-06 multi-line 패턴 인라인 복제).
2. 해당 phase의 타겟 아티팩트(`{NN}-CONTEXT.md` + 모든 `{NN}-*-PLAN.md` + 모든 `{NN}-*-SUMMARY.md`)와 phase 디렉터리에 마지막으로 영향을 준 commit 이후의 git log + 적응형 cap(1000줄) 처리된 git diff를 수집.
3. lens 선택: `args`의 두 번째 토큰(`ssc`/`4ls`/`dspm`, case-insensitive)이 있으면 그것으로, 없으면 AskUserQuestion(header `"Lens"`, 옵션 라벨에 `(코드)` 병기) 인터랙티브 선택.
4. lens facilitation: SKILL.md의 lens별 prompt 블록 → Claude가 수집한 컨텍스트 근거로 lens 항목 초안을 제시 → 사용자 수정/확정 → priority/item/next step 3컬럼 Action Items 표 생성.
5. 결과 저장: `.planning/lessons/{NN}-{YYYY-MM-DD}.md`. 파일이 없으면 새로 생성, 있으면 새 lens 섹션을 그 뒤에 append (덮어쓰기 금지, LESSONS-01 직접 충족).

Phase 10에서 추가되는 Sailboat / Five Whys / 다중 lens 선택 / 자체 transcript analyzer는 본 Phase의 SKILL.md를 **가산적으로** 확장하는 형태로 들어올 수 있게 경계를 유지한다 — Phase 9에서는 transcript에 의존하지 않고 phase 아티팩트 + git 산출물에만 근거한다.

세션 transcript 스캔, hookify rule 호환 runner, lessons milestone aggregation, weighted top-N RECURRENCE 가드는 모두 Phase 10~12의 책임이며 본 Phase 9 스코프 밖이다.

</domain>

<decisions>
## Implementation Decisions

### Phase argument resolution (영역 A)

- **D-01:** `Skill(skill="sg-retro", args="...")`의 `args`가 비어 있으면 `.planning/STATE.md`의 `Phase:` 라인에서 phase 번호를 추출해 fallback한다. `sg-plan`/`sg-execute`의 기존 패턴과 일치(commands/sg-plan.md lines 17-23, 05-PATTERNS.md "STATE.md Phase 해석 패턴"). STATE.md 파싱은 Phase 7 D-04~D-06 multi-line 규칙(`sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//'`)을 **Skill 본문 bash 블록으로 인라인 복제**. 단일 토큰 캡처 정규식(`\S+`) 절대 금지.
- **D-02:** Phase 토큰은 **숫자만** 허용한다. 내부에서 `printf "%02d"`로 zero-pad 후 `.planning/phases/{NN}-*/` 디렉터리를 glob으로 찾는다. 슬러그 전체(`09-sg-retro-skill-scaffold`)는 받지 않음 — 간결성 우선.
- **D-03:** Lens는 `args`의 **선택적 두 번째 토큰**으로 받을 수 있다. 허용 코드: `ssc` / `4ls` / `dspm` (case-insensitive). 매핑:
  - `ssc` → Start/Stop/Continue
  - `4ls` → 4Ls
  - `dspm` → Decisions/Surprises/Patterns/Mistakes
  두 번째 토큰이 없거나 매핑되지 않는 값이면 AskUserQuestion 인터랙티브 선택으로 fallback (D-09 참조).
- **D-04:** 지정한 phase 디렉터리가 존재하지 않으면 (`.planning/phases/{NN}-*/` glob 결과 없음) **에러로 종료**한다. stderr에 `Phase {N} not found. Available phases:` + `ls .planning/phases/`의 결과를 출력. sg-status/sg-health의 graceful-fallback UX와 일관.

### Context-collection scope (영역 B)

- **D-05:** Phase 아티팩트 자동 수집은 **타겟 세트** — 정확히 세 종류:
  - `.planning/phases/{NN}-*/{NN}-CONTEXT.md` (단일 파일)
  - `.planning/phases/{NN}-*/{NN}-*-PLAN.md` (glob, 다중 가능)
  - `.planning/phases/{NN}-*/{NN}-*-SUMMARY.md` (glob, 다중 가능)
  `{NN}-PATTERNS.md`, `{NN}-VERIFICATION.md`, `{NN}-RESEARCH.md` 등 mapper/audit 산출물은 **회고 입력에서 제외**한다 — 회고의 의사결정 신호가 약하고 context window 부담만 큼.
- **D-06:** Git 컨텍스트 수집 범위는 **phase 디렉터리의 마지막 commit 이후**.
  ```bash
  BASE=$(git log -1 --format=%H -- .planning/phases/{NN}-*/ 2>/dev/null)
  # log + diff: ${BASE}..HEAD
  ```
  `BASE`가 비면(phase 디렉터리에 아직 commit이 없음) fallback으로 `HEAD~10..HEAD` 사용. 회고 시점에 phase 작업이 시작되었을 가능성 보장.
- **D-07:** Diff 크기 제어는 **적응형 1000줄 cap + `--stat` fallback**.
  ```bash
  DIFF=$(git diff ${BASE}..HEAD)
  LINES=$(printf '%s\n' "$DIFF" | wc -l)
  if [ "$LINES" -gt 1000 ]; then
    echo "[diff truncated — $LINES lines exceeded 1000-line cap; showing --stat summary]"
    git diff --stat ${BASE}..HEAD
  else
    printf '%s\n' "$DIFF"
  fi
  ```
  `git log ${BASE}..HEAD --oneline`는 cap 없이 전체 표시 — log는 라인당 정보 밀도가 높고 분량이 작음.
- **D-08:** STATE.md `Phase:` 파싱은 Phase 7 D-04~D-06 multi-line 패턴을 **Skill 본문 bash로만** 인라인 복제. `hooks/stop_hook.py:_read_current_phase()`의 기존 단일 토큰 정규식(`r'^Phase:\s*(\S+)'`)은 본 phase에서 **수정하지 않는다** — 해당 helper는 phase 번호만 필요하므로 버그가 실제로 발현되지 않으며, surgical scope 원칙(Phase 6 D-04, Phase 7 D-08)을 유지한다. Phase 7 D-07 lock은 `commands/` 인라인 복제 규약이고 `hooks/`의 Python helper는 별도 책임 경계이므로 lock 위반 아님.

### Lens execution model (영역 C)

- **D-09:** SKILL.md 구조는 **하이브리드**:
  - Lens별 **facilitation prompt 블록**(Claude에게 회고 진행을 지시하는 자연어 instructions) — pm-execution `retro` 스킬과 유사한 자유도.
  - **출력 마크다운 구조는 SKILL.md가 강제** — 모든 lens는 다음을 따라야 함:
    ```
    ## Lens: {English name}
    _Captured: {ISO-8601 UTC timestamp}_

    ### {lens별 fixed subheading 1}
    - ...

    ### {lens별 fixed subheading N}
    - ...

    ### Action Items
    | priority | item | next step |
    |----------|------|-----------|
    | P1 | ... | ... |
    ```
  - lens별 fixed subheading:
    - `ssc` → `### Start` / `### Stop` / `### Continue`
    - `4ls` → `### Liked` / `### Learned` / `### Lacked` / `### Longed For`
    - `dspm` → `### Decisions` / `### Surprises` / `### Patterns` / `### Mistakes`
  - Phase 12 LESSONS-02 / sg-plan Step 0 파서가 `^## Lens: ` 정규식으로 lens 섹션을 안정적으로 인식할 수 있는 결정적 키 보장.
- **D-10:** 사용자 인터랙션은 **artifact-grounded draft-then-confirm**. Claude는 D-05의 아티팩트 + D-06의 git log/diff를 근거로 lens별 항목 초안을 먼저 제시하고, 사용자가 수정/추가/삭제한다. 단순 개방형 질문(`"Liked는 뭐였나요?"`)은 사용하지 않음 — D-05/D-06에서 컨텍스트를 수집한 의미가 사라짐. 항목 확정 후 Action Items 단계로 진행.
- **D-11:** **DSPM lens는 phase 아티팩트 + git diff/log만 근거**로 한다. 현 세션 transcript 스캔은 도입하지 않음. Phase 10 ANALYZER-01/02/03이 추가될 때 transcript-기반 frustration/correction/repeated/validated-success 카테고리를 DSPM draft에 머지하는 layer로 가산 가능하도록 경계 유지.
- **D-12:** 각 lens는 **Action Items 섹션을 필수**로 생성한다. 마크다운 표 3컬럼: `priority` (P1/P2/P3) | `item` (한 문장 요약) | `next step` (구체 실행 명령, 파일 경로, 또는 deferred-to-Phase-N 라벨). `owner` 컬럼 없음 — 단일 개발자 프로젝트 컨텍스트. Phase 12 RECURRENCE-01의 weighted top-N 산출 입력이 됨.

### Lens selection UX (영역 D)

- **D-13:** AskUserQuestion option 라벨은 **친근한 이름 + 코드 괄호** 형식:
  - `"Start/Stop/Continue (ssc)"`
  - `"4Ls (4ls)"`
  - `"Decisions/Surprises/Patterns/Mistakes (dspm)"`
  코드 표기는 D-03의 argument 토큰과 일치 → 사용자가 인터랙티브에서 본 코드를 다음 호출의 argument로 바로 사용 가능 (학습 가능성 ↑).
- **D-14:** AskUserQuestion header는 정확히 `"Lens"` (Phase 8 D-12 `"Session"` brevity convention 일관, ≤12 chars 제약 충족).
- **D-15:** **기본/추천 옵션 없음**. 세 옵션 모두 동등하게 표시, 사용자가 매번 명시 선택. Phase 12 또는 v1.3에서 사용 데이터가 누적되면 default 도입 재검토.
- **D-16:** 사용자 인터페이스 텍스트는 다음과 같이 분리한다:
  - **SKILL.md frontmatter `description`**, **AskUserQuestion `header`/`options`**, **상태/에러 메시지**(`Phase {N} not found.`, `Lessons saved to {path}.` 등) → **영문 고정** (OSS surface, plugin.json/README/commands frontmatter 일관).
  - **Lens facilitation prompt 내부의 사용자 대화 (Claude의 질문 텍스트)**, **lens 산출물의 본문 항목 내용 (Liked/Decisions/Action Items의 item·next step 문장)** → **사용자 입력 언어 auto-detect** (CLAUDE.md "Language Auto-Detection" 정책). 한국어 입력 → 한국어, 영어 입력 → 영어.
  - **마크다운 구조 마커 (`## Lens: {name}`, `### Start`/`### Liked` 등 fixed subheadings, Action Items 표의 `priority | item | next step` 컬럼 헤더)** → **영문 결정적** (Phase 12 LESSONS-02 파서 키).

### Lessons file append schema (영역 E)

- **D-17:** Lessons 파일 경로는 **`.planning/lessons/{NN}-{YYYY-MM-DD}.md`** — Phase 5에서 lock된 기존 컨벤션 그대로(05-PATTERNS.md ".planning/ 파일 네이밍 컨벤션"). `NN`은 zero-padded phase, `YYYY-MM-DD`는 UTC 기준 ISO 날짜. Skill이 직접 작성하며 `hooks/stop_hook.py:save_hookify_lessons()`를 거치지 않는다 (D-08 보강).
- **D-18:** **같은 phase + 같은 날짜에 재호출** 시: 파일이 이미 존재하면 **새 lens 섹션을 그 파일 뒤에 append**한다. 같은 날 multi-lens 누적 → 하나의 lessons 파일에 모든 lens 섹션 누적. LESSONS-01의 "덮어쓰기 금지" 요건을 직접 충족하고, Phase 10 RETRO-05의 "한 호출 다중 lens 선택"이 자연스럽게 같은 메커니즘으로 확장됨.
- **D-19:** 파일 구조는 **flat lens 섹션**. 최상위 헤더 1회 + lens별 `## Lens: {name}` 섹션 N개:
  ```
  # Lessons: Phase {N} ({YYYY-MM-DD})

  ## Lens: 4Ls
  _Captured: 2026-05-20T10:00:00Z_

  ### Liked
  - ...
  ### Learned
  - ...
  ### Lacked
  - ...
  ### Longed For
  - ...

  ### Action Items
  | priority | item | next step |
  |----------|------|-----------|
  | P1 | ... | ... |

  ## Lens: Decisions/Surprises/Patterns/Mistakes
  _Captured: 2026-05-20T14:00:00Z_
  ...
  ```
  YAML frontmatter는 Phase 9에서 도입하지 않음 — Phase 12 LESSONS-02/RECURRENCE-01이 실제로 필요로 할 때 frontmatter를 가산적으로 추가할 수 있다 (기존 마크다운 본문 파싱은 깨지지 않음).
- **D-20:** **같은 lens 중복 실행** 시(예: 같은 날 `4ls` 두 번): 두 번째 섹션은 `## Lens: 4Ls (run 2)` disambiguating 접미사로 append한다. 세 번째는 `(run 3)`, ... — header 충돌 회피 + Phase 12 RECURRENCE-01의 recency weighting이 모든 run을 입력으로 받을 수 있게 보존. 단순 덮어쓰기·refuse 모두 LESSONS-01 정신과 충돌하므로 회피.
- **D-21:** Append 작업의 안전성:
  - 파일이 없으면 `# Lessons: Phase {N} ({date})` 최상위 헤더를 작성한 뒤 첫 lens 섹션 추가.
  - 파일이 있으면 최상위 헤더는 재작성 금지(기존 헤더 보존). lens 섹션만 파일 끝에 append.
  - 작성은 **새 lens 섹션 전체를 한 번에 `>>` redirect로 append** (partial-write 시 파일 손상 회피). 작성 전후 `wc -l` 차이를 stderr에 로그하면 verification에 도움.

### Claude's Discretion

- SKILL.md frontmatter `description` 문자열의 정확한 영문 표현 — 다음 가이드를 따른다: ① 한 문장, ② "Run a structured retrospective on a GSD phase with one of three lenses (SSC, 4Ls, DSPM) and append results to `.planning/lessons/`." 같은 형태의 lens 코드를 description 안에 노출. PLAN.md에서 최종 확정.
- AskUserQuestion `question` 텍스트 — 권장: `"Which retrospective lens do you want to run?"`. PLAN.md에서 최종 확정.
- Lens별 facilitation prompt의 정확한 문구 (한·영 가산 대비, draft-then-confirm 흐름의 turn 횟수 등) — D-10/D-16 정책 범위 안에서 Claude가 PLAN.md에서 확정.
- `BASE` commit이 비었을 때 fallback의 깊이 — D-06에서 `HEAD~10`을 권장했으나 phase 진행 정도에 따라 `HEAD~5`/`HEAD~15`로 조정 가능. PLAN.md에서 확정.
- 인라인 timestamp 표기(`_Captured: ...`) vs HTML comment 형태(`<!-- captured: ... -->`) — 둘 다 마크다운 파서 안전. 권장: D-19처럼 보이는 italic line으로 사용자 가독성 우선.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / Spec
- `.planning/REQUIREMENTS.md` §RETRO — RETRO-01/02/03(부분)/04 요건 원문 (Phase 9 책임 범위)
- `.planning/REQUIREMENTS.md` §LESSONS — LESSONS-01의 "append 금지 덮어쓰기" 요건 (D-18/D-19/D-21 직접 충족)
- `.planning/ROADMAP.md` §"Phase 9: sg-retro Skill scaffold" — Success Criteria 4개
- `.planning/PROJECT.md` §"Current Milestone: v1.2 Self-Contained Retrospection" — 비침투적 orchestrator 원칙 + hookify 의존성 단계적 제거 흐름 (Phase 9는 Skill 도입만; sg-learn 라우팅 전환은 Phase 13)

### Existing Code (must read before touching)
- `.claude-plugin/plugin.json` — Phase 9에서 `"skills": "./skills/"` 라인을 추가한다 (현재 commands 배열만 있음). 기존 키 순서/포맷 보존.
- `commands/sg-plan.md` lines 16-33 + `commands/sg-execute.md` lines 16-24 — STATE.md `Phase:` fallback 패턴 (D-01의 기준).
- `commands/sg-status.md` lines 14-49 — Phase 7 D-04~D-06 multi-line `Phase:` 파싱 원본 (D-01/D-08 인라인 복제 대상).
- `commands/sg-learn.md` — 현재 `Skill(skill="hookify:hookify", ...)` 호출. Phase 9가 도입한 `sg-retro` Skill을 **참조하지 않는다** — sg-learn → sg-retro 라우팅 전환은 Phase 13 MIGRATION-01의 책임. Phase 9 스코프 안에서 sg-learn은 수정 금지.
- `hooks/stop_hook.py` — Phase 5의 `save_hookify_lessons()` / `_read_current_phase()`는 Phase 9가 **건드리지 않는다** (D-08). Skill은 자체적으로 lessons 파일을 직접 작성.

### Prior Phase Decisions (lock — do not re-litigate)
- `.planning/milestones/v1.0-phases/05-lessons-feedback-loop/05-PATTERNS.md` §".planning/ 파일 네이밍 컨벤션" — `.planning/lessons/{NN}-{YYYY-MM-DD}.md` lock (D-17).
- `.planning/milestones/v1.1-phases/06-sg-health/06-CONTEXT.md` §D-04 — "`commands/*.md` 파일만, 별도 Python/셸 헬퍼 미도입" 원칙. Phase 9는 Skill 도입(별 종류의 파일)이므로 helper 미도입 노선만 계승, Skill 자체는 신규 자산이므로 D-04와 충돌하지 않음.
- `.planning/milestones/v1.1-phases/07-status-accuracy/07-CONTEXT.md` §D-04~D-08 — STATE.md `Phase:` multi-line 파싱 규칙, 단일 토큰 정규식 금지, 자동화 테스트 자산 미도입 (D-01/D-08에 그대로 인계).
- `.planning/milestones/v1.1-phases/08-session-restore/08-CONTEXT.md` §D-12, D-16 — AskUserQuestion header 영문/brevity 컨벤션 (D-14/D-16), `.planning/HANDOFF.md` 비-수정 원칙 (Phase 9 Skill도 HANDOFF.md를 읽지도/쓰지도 않음).

### Plugin / Skill Reference
- Anthropic SKILL.md frontmatter 표준 — `name:` + `description:` (template at `$HOME/.claude/plugins/marketplaces/anthropic-agent-skills/template/SKILL.md`).
- Plugin manifest skills 필드 — `"skills": "./skills/"` 형태 디렉터리 path (예: ouroboros plugin.json).
- 참고 lens 패턴 — pm-execution `retro` 스킬의 Start/Stop/Continue, 4Ls 포맷 정의 (`$HOME/.claude/plugins/cache/pm-skills/pm-execution/1.0.1/skills/retro/SKILL.md`). 본 Phase 9 SKILL.md는 이 정의에서 lens 이름과 카테고리만 차용하고 facilitation prompt + 출력 구조는 D-09/D-10/D-12 규칙으로 자체 정의.
- DSPM lens의 카테고리 frame은 hookify `conversation-analyzer` agent의 frustration/correction/repeated/validated-success 카테고리를 **개념적으로 차용**(`$HOME/.claude/plugins/cache/claude-plugins-official/hookify/unknown/agents/conversation-analyzer.md`). Phase 9에서는 hookify agent를 호출하지 않으며 transcript 분석도 도입하지 않음 — frame만 참조.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/sg-status.md` lines 14-49: STATE.md `Phase:` multi-line 파싱 블록 — D-01/D-08의 인라인 복제 원본. Phase 7 D-04~D-06으로 lock된 정확한 sed/awk 패턴 그대로 사용.
- `commands/sg-plan.md` lines 17-23: `$ARGUMENTS` 비면 STATE.md fallback 패턴 — D-01의 기준 패턴.
- `commands/sg-execute.md` lines 16-24: 같은 fallback 패턴의 두 번째 인스턴스 — Phase 9 SKILL.md가 셋 중 어느 하나를 인라인 복제하면 됨 (drift 시 동시 수정 책임).
- `.planning/milestones/v1.0-phases/05-lessons-feedback-loop/05-PATTERNS.md`: `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 컨벤션과 명령어 frontmatter 패턴 (D-17 보강).
- `pm-execution/retro/SKILL.md`: Start/Stop/Continue / 4Ls lens 정의의 분명한 prior art — 카테고리명만 차용.

### Established Patterns
- 명령·Skill은 본문 bash 블록 인라인 + 마지막에 Skill invoke (또는 본 Skill처럼 자체 완결). Python/외부 셸 helper 미도입 (Phase 6 D-04, Phase 7 D-08).
- STATE.md frontmatter는 YAML — bash `grep -E '^milestone:' | sed -E 's/^milestone:[[:space:]]*//'` 라인 단위 파싱으로 충분. `yq` 등 외부 도구 의존 금지.
- AskUserQuestion 후 옵션 분기는 if/case 블록 + 영문 라벨 (Phase 8 D-12).
- 사용자 인터페이스(SKILL.md description, AskUserQuestion 라벨, 상태/에러 메시지)는 영문. 산출물 본문은 사용자 언어 auto-detect (D-16).

### Integration Points
- **Phase 9 ↔ `.claude-plugin/plugin.json`:** `"skills": "./skills/"` 한 줄 추가 (현재 키 순서 보존). Phase 9 단독으로 plugin manifest 수정 책임.
- **Phase 9 ↔ `.planning/lessons/`:** Skill이 직접 lessons 파일을 작성/append. `hooks/stop_hook.py:save_hookify_lessons()`는 본 phase에서 호출되지 않으며 수정되지도 않음 (D-08, D-17).
- **Phase 9 ↔ `commands/sg-learn.md`:** **연결 없음**. Phase 9는 sg-learn을 건드리지 않음. sg-learn → sg-retro 라우팅 전환은 Phase 13 MIGRATION-01.
- **Phase 9 ↔ Phase 10:** Phase 10이 추가하는 Sailboat / Five Whys / 다중 lens / transcript analyzer는 본 SKILL.md를 가산적으로 확장. 본 phase의 D-19 flat lens 섹션 구조와 D-09 fixed subheading 규칙이 Phase 10에서 깨지지 않도록 의식적으로 작성한다.
- **Phase 9 ↔ Phase 12:** D-09(lens 섹션 결정적 헤더), D-12(Action Items 표 3컬럼), D-19(flat 구조) 모두 Phase 12 LESSONS-02 / RECURRENCE-01의 파서 입력. Phase 9 출력 스키마가 Phase 12 파서의 사전 계약.

### Known Risk Sites
- **plugin.json 키 순서/포맷 보존:** `jq`를 쓰면 키 순서가 변할 수 있음 — Phase 2 D-02의 "version 필드만 jq로" 정책처럼 신중. 본 Phase에서는 `"skills"` 한 줄을 commands 배열 뒤에 텍스트 편집으로 추가하는 것이 안전. PLAN.md에서 정확한 위치 결정.
- **STATE.md `Phase:` 파싱 회귀:** D-01/D-08에서 multi-line 패턴을 인라인 복제하므로 `\S+` 같은 단일 토큰 패턴을 PLAN.md/실행 단계에서 실수로 도입하지 않도록 명시적 lock 필요. 가급적 `commands/sg-status.md` lines 14-49의 sed 블록 텍스트를 그대로 복사.
- **AskUserQuestion 비가용 환경:** 비-Claude 런타임(Codex, Gemini CLI 등)에서는 워크플로우 표준대로 numbered list 텍스트 모드로 자동 fallback (discuss-phase workflow와 동일). PLAN.md에서 fallback 출력 형식 명세.
- **Lessons append 원자성:** D-21처럼 새 lens 섹션 전체를 한 번에 `>>` redirect — 중간 인터럽트 시 부분 작성 위험 최소화. 그래도 partial write 가능성이 0은 아니므로 작성 전후 라인 수 검증 권장 (verification step).
- **`hooks/stop_hook.py` 단일 토큰 regex 잔존:** D-08에서 의도적으로 건드리지 않기로 결정. 본 Phase 종료 후 PROJECT.md/STATE.md의 "Pending Todos" 또는 deferred 섹션에 "stop_hook.py `_read_current_phase()` Phase 7 D-06 정렬 — 별 phase에서 처리"를 기록 권장 (deferred 섹션 참조).

</code_context>

<specifics>
## Specific Ideas

### Lens별 출력 마크다운 골격 (D-09 형식 정확한 예시)

**`ssc` (Start/Stop/Continue):**
```markdown
## Lens: Start/Stop/Continue
_Captured: 2026-05-20T10:30:00Z_

### Start
- [user-language item]
- [user-language item]

### Stop
- [user-language item]

### Continue
- [user-language item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | [user-language summary] | [user-language concrete step] |
| P2 | [user-language summary] | [user-language concrete step] |
```

**`4ls` (4Ls):**
```markdown
## Lens: 4Ls
_Captured: 2026-05-20T10:30:00Z_

### Liked
- [user-language item]

### Learned
- [user-language item]

### Lacked
- [user-language item]

### Longed For
- [user-language item]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | ... | ... |
```

**`dspm` (Decisions/Surprises/Patterns/Mistakes):**
```markdown
## Lens: Decisions/Surprises/Patterns/Mistakes
_Captured: 2026-05-20T10:30:00Z_

### Decisions
- [user-language item drawn from CONTEXT/PLAN/SUMMARY decisions]

### Surprises
- [user-language item drawn from git diff/log unexpected outcomes]

### Patterns
- [user-language item drawn from cross-artifact recurring themes]

### Mistakes
- [user-language item drawn from verification failures / known risks not mitigated]

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | ... | ... |
```

### `args` 파싱 정확한 규칙 (D-01 ~ D-03 결합)

```bash
# $ARGUMENTS = "9 4ls"  → PHASE_RAW="9", LENS_RAW="4ls"
# $ARGUMENTS = "9"      → PHASE_RAW="9", LENS_RAW=""
# $ARGUMENTS = "9 sailboat"  → PHASE_RAW="9", LENS_RAW="sailboat" (매핑 실패 → AskUserQuestion fallback, D-03)
# $ARGUMENTS = ""       → PHASE_RAW="" → STATE.md fallback (D-01)

set -- $ARGUMENTS
PHASE_RAW="${1:-}"
LENS_RAW="${2:-}"

if [ -z "$PHASE_RAW" ]; then
  # STATE.md fallback (Phase 7 D-04~D-06 multi-line 인라인 복제)
  PHASE_RAW=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
              | sed -E 's/^Phase:[[:space:]]*//' \
              | sed -E 's/[[:space:]]+$//' \
              | awk '{print $1}')
fi

# 숫자 검증 (D-02)
if ! printf '%s' "$PHASE_RAW" | grep -qE '^[0-9]+$'; then
  echo "Phase token must be a number. Got: '${PHASE_RAW}'." >&2
  exit 1
fi

PHASE_PAD=$(printf "%02d" "$PHASE_RAW")
PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-*/ 2>/dev/null | head -1)

if [ -z "$PHASE_DIR" ]; then
  echo "Phase ${PHASE_RAW} not found. Available phases:" >&2
  ls .planning/phases/ 2>/dev/null >&2 || echo "  (no phases yet)" >&2
  exit 1
fi
```

(LENS_RAW 매핑은 lowercase 변환 후 `ssc`/`4ls`/`dspm` case 분기. 매칭 안 되면 AskUserQuestion fallback.)

### 수동 검증 시나리오 체크리스트 (Phase 7 D-09 / Phase 8 specifics 일관)

자동화 테스트 자산 미도입 노선이므로 PLAN.md에 다음 수동 시나리오를 포함:

| # | $ARGUMENTS | STATE.md `Phase:` | phases dir | 기대 동작 |
|---|---|---|---|---|
| 1 | `"9"` | (참조 안 함) | `09-*/` 존재 | AskUserQuestion lens 선택 → lens 진행 |
| 2 | `"9 4ls"` | (참조 안 함) | `09-*/` 존재 | AskUserQuestion 생략, 4Ls lens 진행 |
| 3 | `"9 4LS"` | (참조 안 함) | `09-*/` 존재 | case-insensitive 매핑, 4Ls lens 진행 |
| 4 | `"9 sailboat"` | (참조 안 함) | `09-*/` 존재 | LENS_RAW 매칭 실패 → AskUserQuestion fallback (D-03) |
| 5 | `""` | `Phase: 9 (sg-retro Skill scaffold)` | `09-*/` 존재 | STATE.md fallback으로 phase=9 추출, lens AskUserQuestion |
| 6 | `""` | (파일 없음) | — | 에러 + 사용 가능 phase 목록 출력 후 종료 (D-04) |
| 7 | `"9 dspm"` | (참조 안 함) | `09-*/` 존재 | DSPM lens 진행, artifact-grounded draft (D-11), transcript 무관 |
| 8 | `"9 ssc"` 두 번 같은 날 | — | `09-*/` 존재 | 첫 번째 → `## Lens: Start/Stop/Continue`; 두 번째 → `## Lens: Start/Stop/Continue (run 2)` (D-20) |
| 9 | `"9 4ls"` 후 같은 날 `"9 dspm"` | — | `09-*/` 존재 | 같은 파일에 `## Lens: 4Ls` → `## Lens: Decisions/...` 순서 append (D-18) |
| 10 | `"9 4ls"`, phase 디렉터리에 commit 0건 | — | `09-*/` 존재 | `BASE` 비어 → `HEAD~10..HEAD` fallback diff/log 수집 (D-06) |
| 11 | `"99"` | (관계없음) | `99-*/` 없음 | 에러 + 사용 가능 phase 목록 (D-04) |

검증 절차:
1. `.planning/STATE.md`, `.planning/lessons/`, phase 디렉터리 백업.
2. 시나리오별 입력 셋업.
3. `Skill(skill="sg-retro", args="...")` 실행.
4. 출력/lens 진행/lessons 파일 변화 확인.
5. 모든 시나리오 종료 후 백업 복원.

### plugin.json 수정 정확한 형태 (D-08 인접 위험 회피)

`commands` 배열 직후, `homepage` 앞에 `"skills"` 키를 텍스트 편집으로 추가:

```json
  "commands": [
    "./commands/sg-start.md",
    ...
    "./commands/sg-health.md"
  ],
  "skills": "./skills/",
  "homepage": "https://github.com/gyuha/super-gsd",
```

`jq` 미사용 — 기존 키 순서 보존을 위해 직접 Edit 도구 사용. PLAN.md에서 정확한 anchor 라인 명시.

</specifics>

<deferred>
## Deferred Ideas

- **Sailboat / Five Whys lens** — Phase 10 RETRO-03 (완료 단계) 책임. SKILL.md의 lens 매핑 표가 확장될 수 있게 facilitation prompt 구조를 plug-in 가능하게 작성.
- **한 호출에서 다중 lens 선택** — Phase 10 RETRO-05. AskUserQuestion `multiSelect` 도입 + 같은 파일에 여러 lens 섹션 순차 append. D-18/D-19/D-20이 이 경로를 깨지 않게 설계됨.
- **세션 transcript scanning (frustration/correction/repeated/validated-success 자체 추출)** — Phase 10 ANALYZER-01/02/03. DSPM lens의 draft에 transcript 분석 결과를 머지하는 가산 layer. D-11이 이 확장 경로를 보존.
- **lessons YAML frontmatter (machine-readable metadata)** — Phase 12 LESSONS-02 / RECURRENCE-01이 실제로 weighted top-N 산출에서 필요로 할 때 도입. 기존 마크다운 본문 파싱은 깨지지 않음.
- **lessons milestone aggregation (`.planning/milestones/v{X}-LESSONS.md`)** — Phase 12 LESSONS-03 책임.
- **weighted top-N RECURRENCE 가드 (sg-plan Step 0 / sg-execute 진입 노출)** — Phase 12 RECURRENCE-01/02/03 책임. Phase 9 SKILL.md는 Action Items를 표 형태로 출력하기만 하면 됨 — 가중치 계산은 별 phase.
- **`sg-learn` → `sg-retro` 라우팅 전환** — Phase 13 MIGRATION-01. Phase 9는 `commands/sg-learn.md` 수정 금지.
- **hookify 의존성 제거 (README/prerequisites/sg-update)** — Phase 13 MIGRATION-03/04. Phase 9 스코프 밖.
- **`hooks/stop_hook.py:_read_current_phase()` 단일 토큰 정규식 정렬** — D-08에서 의도적으로 미수정. v1.2 또는 v1.3의 별 phase (혹은 sg-health 정밀화 후속 quick-task)로 처리. 본 Skill의 multi-line 파싱이 기준점이 됨.
- **`sg-retro` argument-driven 비대화형 다중 lens (`args="9 4ls dspm"`)** — Phase 10 RETRO-05에서 다중 토큰 파싱 도입 시 자연스럽게 가능. Phase 9에서는 두 번째 토큰까지만 파싱.
- **자동화 테스트 자산 (`tests/sg-retro/` fixtures + runner)** — Phase 6/7/8과 일관되게 미도입. v1.3 이후 변경 빈도 증가 시 재검토.

</deferred>

---

*Phase: 9-sg-retro-skill-scaffold*
*Context gathered: 2026-05-20*
