# Phase 10: 내장 conversation analyzer + 추가 lens - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9에서 작성한 `skills/sg-retro/SKILL.md`를 **가산적으로 확장**한다. 세 가지 변경만 이 phase의 책임이다:

1. **Sailboat + Five Whys lens 추가** — 기존 3개(SSC, 4Ls, DSPM)에 2개를 더해 총 5개 lens 완성 (RETRO-03 완료)
2. **Multi-lens 다중 선택** — 한 번의 `sg-retro` 호출에서 여러 lens를 선택하고 결과를 단일 lessons 파일에 append (RETRO-05)
3. **내장 conversation analyzer** — hookify `conversation-analyzer` agent 의존 없이 session transcript에서 4 카테고리(frustration signals, correction patterns, repeated issues, validated successes)를 Claude-native 방식으로 추출 (ANALYZER-01/02/03)

Phase 9의 argument 파싱, context 수집, lessons append 스키마, git diff/log 수집, AskUserQuestion 규칙은 모두 그대로 유지한다. SKILL.md 이외의 파일(hooks/stop_hook.py, commands/sg-learn.md 등)은 건드리지 않는다.

Phase 11(자체 rule runner), Phase 12(lessons aggregation + 재발 방지 가드), Phase 13(sg-learn 라우팅 전환)은 본 Phase 스코프 밖이다.

</domain>

<decisions>
## Implementation Decisions

### Analyzer 위치와 활성화 방식 (영역 A)

- **D-01:** analyzer는 **`sg-retro` SKILL.md 내부에 통합**한다. 별도 파일(Python helper, 별도 SKILL.md 등) 없음 — Phase 6 D-04 + Phase 7 D-08 bash-only 원칙 유지. Claude가 Skill 실행 중 Read 도구로 transcript를 직접 읽고 분석한다.
- **D-02:** analyzer는 **`analyze` lens 코드**로 명시 호출할 수 있다 (`args="10 analyze"`). 그러나 어떤 lens 실행 후든 항상 hookify rule draft를 **auto-suggest**하는 단계를 추가한다 — 사용자가 `analyze`를 명시하지 않아도 rule 제안을 받을 수 있다.
- **D-03:** analyzer의 **출력 스키마**는 4-카테고리 표:
  ```
  | category | tool/event | pattern | context | severity |
  ```
  카테고리: `frustration` / `correction` / `repeated` / `validated-success`
  severity: `high` / `medium` / `low`
  (현 hookify conversation-analyzer 출력 스키마와 호환 — ANALYZER-02 요건)
- **D-04:** analyzer 단독 실행 시 (`analyze` lens) 출력 구조는 Phase 9 D-09 lens 구조를 따른다:
  ```
  ## Lens: Conversation Analyzer
  _Captured: {ISO}_

  ### Analysis Findings
  | category | tool/event | pattern | context | severity |
  ...

  ### Draft Hookify Rules
  - [rule suggestion per high/medium finding]

  ### Action Items
  | priority | item | next step |
  ```
  `analyze`는 SKILL.md의 5번째 lens로 취급하며 lens 매핑 표와 AskUserQuestion 옵션 목록에 포함된다.

### Transcript 읽기 방식 (영역 B)

- **D-05:** transcript는 **Claude가 Read 도구로 직접 읽는다** — bash regex 파싱 없음. Claude LLM이 Skill을 실행하고 있으므로 bash grep이 아닌 Claude-native 분석(Read + LLM 이해)을 사용한다.
- **D-06:** transcript 경로는 `~/.claude/projects/{project-slug}/` 디렉터리의 **가장 최신 `.jsonl` 파일**. project-slug는 현재 working directory 절대 경로를 `-`로 join한 형태 (예: `/Users/gyuha/workspace/super-gsd` → `-Users-gyuha-workspace-super-gsd`). bash 블록에서:
  ```bash
  PROJECT_SLUG=$(pwd | tr '/' '-' | sed 's/^-//')
  TRANSCRIPT_DIR="$HOME/.claude/projects/${PROJECT_SLUG}"
  TRANSCRIPT_FILE=$(ls -t "${TRANSCRIPT_DIR}"/*.jsonl 2>/dev/null | head -1)
  ```
- **D-07:** **기본 스캔 범위는 최근 20-30 메시지**. 사용자가 명시(`args="10 analyze deep"` 또는 AskUserQuestion에서 선택)하면 더 깊이 스캔 — ANALYZER-03 요건. 구체적 deep 범위: 사용자가 요청 시 전체 transcript 또는 last 100 messages.
- **D-08:** transcript JSONL을 읽을 때 Claude는 `role: "user"` 메시지에서 다음 신호를 탐색한다:
  - **frustration**: "왜", "안 돼", "다시", "왜 그렇게", "틀렸", "I didn't ask", "That's wrong" 등
  - **correction**: 사용자가 assistant의 이전 행동을 되돌리거나 재지시하는 패턴
  - **repeated**: 같은 종류의 실수 또는 지시가 2회 이상 반복
  - **validated-success**: 사용자가 명시적으로 수용·확인한 non-obvious assistant 선택

### Sailboat lens (영역 C)

- **D-09:** Sailboat lens의 **4개 fixed subheadings**: `### Wind` / `### Anchor` / `### Sun` / `### Rock`
  - `Wind`: 팀/작업을 추진한 힘 (what propelled progress)
  - `Anchor`: 속도를 늦춘 것 (what slowed down)
  - `Sun`: 밝은 순간·에너지 (bright spot / energy source)
  - `Rock`: 위험·장애물 (risk / obstacle encountered or ahead)
- **D-10:** Sailboat lens code: `sail` (argument 토큰 + AskUserQuestion 라벨 parenthetical)
  AskUserQuestion 라벨: `"Sailboat (sail)"`
- **D-11:** Sailboat lens facilitation은 Phase 9 D-10 **artifact-grounded draft-then-confirm** 방식을 따른다 — CONTEXT/PLAN/SUMMARY + git log/diff 기반 초안 제시 후 사용자 수정.
- **D-12:** lens template:
  ```
  ## Lens: Sailboat
  _Captured: {ISO}_

  ### Wind
  - [item]

  ### Anchor
  - [item]

  ### Sun
  - [item]

  ### Rock
  - [item]

  ### Action Items
  | priority | item | next step |
  ```

### Five Whys lens (영역 D)

- **D-13:** Five Whys lens code: `5why` (argument 토큰 + AskUserQuestion 라벨 parenthetical)
  AskUserQuestion 라벨: `"Five Whys (5why)"`
- **D-14:** Five Whys **facilitation 모델**: 사용자가 problem statement를 하나 입력 → Claude가 5번 iterative "Why?" 질문 → root cause statement 도출. 사용자가 직접 답하는 방식 (Claude가 대신 추측하지 않음).
- **D-15:** Five Whys fixed subheadings:
  - `### Problem Statement`
  - `### Why 1` / `### Why 2` / `### Why 3` / `### Why 4` / `### Why 5`
  - `### Root Cause`
  Phase 12 파서가 `^## Lens: ` 기준으로 섹션을 인식하므로 Five Whys도 동일 헤더 구조를 따른다.
- **D-16:** Five Whys는 **artifact-grounded draft가 아니라 사용자 주도 대화형**. Claude는 problem statement를 AskUserQuestion으로 먼저 받고, 이후 각 Why 단계를 순차 질문한다. git artifacts는 참고용으로만 사용 (문맥 보강).
- **D-17:** lens template:
  ```
  ## Lens: Five Whys
  _Captured: {ISO}_

  ### Problem Statement
  - [user-provided problem]

  ### Why 1
  - [user answer]

  ### Why 2
  - [user answer]

  ### Why 3
  - [user answer]

  ### Why 4
  - [user answer]

  ### Why 5
  - [user answer]

  ### Root Cause
  - [derived root cause statement]

  ### Action Items
  | priority | item | next step |
  ```

### Multi-lens 선택 + argument 경로 (영역 E)

- **D-18:** AskUserQuestion의 `multiSelect`를 **`true`로 변경**. 사용자가 5개(SSC, 4Ls, DSPM, Sailboat, Five Whys) + analyze 중 여러 개를 선택 가능.
  - `analyze`는 lens 목록에 포함 — `"Conversation Analyzer (analyze)"` 라벨
  - AskUserQuestion header는 Phase 9 D-14 `"Lens"` 그대로 유지 (≤12 chars)
- **D-19:** **single-lens argument 경로는 그대로 유지** — `args="10 4ls"`처럼 두 번째 토큰이 단일 코드(`ssc`/`4ls`/`dspm`/`sail`/`5why`/`analyze`)이면 AskUserQuestion 없이 직접 실행. Phase 9 D-03 확장.
- **D-20:** multi-lens 실행 시 **선택된 lens를 순차 실행**하고 각 lens 결과를 **같은 lessons 파일에 순서대로 append**한다. Phase 9 D-18/D-19의 flat lens 섹션 구조 그대로 확장 — RETRO-05 요건 충족. 구현: 선택된 lens 배열을 순회하며 각 lens의 Step 5(facilitation) → Step 6(append)를 반복.
- **D-21:** multi-lens 인수 경로(`args="10 4ls dspm"`)도 지원 — 세 번째 이후 토큰들을 추가 lens 코드로 파싱. 단, AskUserQuestion 우선: 인수 없으면 항상 multiSelect AskUserQuestion.
- **D-22:** **No (Recommended) chip / no default lens selection** — REQUIREMENTS.md 명시 사항. multiSelect 옵션 모두 동등 표시.

### Claude's Discretion

- `analyze` lens의 정확한 AskUserQuestion `question` 텍스트 — 권장: `"Which retrospective lens(es) do you want to run?"`. PLAN.md에서 확정.
- Five Whys에서 사용자가 "모르겠다"고 할 때 Claude가 artifact 기반 추측을 제시할지 여부 — D-16 정신에 따라 제시하되 사용자 확인을 받는 방향이 합리적. PLAN.md에서 확정.
- Sailboat lens의 artifact 연결 방식 — Wind/Sun은 SUMMARY의 긍정 신호, Anchor/Rock은 CONTEXT "Known Risk Sites" + 지연된 태스크에서 추출. PLAN.md에서 확정.
- `analyze` lens 실행 후 auto-suggest되는 hookify rule draft 포맷 — D-04에서 "### Draft Hookify Rules" 섹션 명시, 정확한 rule 포맷은 기존 hookify `.local.md` 포맷(frontmatter + body)을 따름. PLAN.md에서 확정.
- multi-lens 실행 시 개별 lens 사이에 "다음 lens로 진행?" 확인 prompt를 넣을지 여부 — D-20 "순차 실행"이지만 Five Whys처럼 대화형 lens 중간에 전환이 어색할 수 있음. 권장: lens 사이에 brief separator 출력 + 자동 진행. PLAN.md에서 확정.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / Spec

- `.planning/REQUIREMENTS.md` §RETRO — RETRO-03(완료), RETRO-05 요건 원문
- `.planning/REQUIREMENTS.md` §ANALYZER — ANALYZER-01/02/03 요건 원문 (Phase 10 전체 책임)
- `.planning/ROADMAP.md` §"Phase 10: 내장 conversation analyzer + 추가 lens" — Success Criteria 4개
- `.planning/PROJECT.md` §"Current Milestone: v1.2 Self-Contained Retrospection" — hookify 의존성 단계적 제거 흐름, 비침투적 orchestrator 원칙

### Existing Code (must read before touching)

- `skills/sg-retro/SKILL.md` — **Phase 9에서 작성한 현재 구현체**. Phase 10은 이 파일만 수정한다. Steps 1-6 전체 구조를 먼저 읽고 확장 지점을 파악할 것.
- `.claude-plugin/plugin.json` — Phase 9에서 `"skills": "./skills/"` 등록 완료. Phase 10에서 수정 불필요.
- `commands/sg-plan.md` lines 16-33 — STATE.md `Phase:` fallback 패턴 (Phase 9 D-01 인라인 복제 기준).
- `commands/sg-status.md` lines 14-49 — Phase 7 D-04~D-06 multi-line `Phase:` 파싱 원본.

### Hookify Reference (analyzer 스키마 호환용)

- `$HOME/.claude/plugins/cache/claude-plugins-official/hookify/unknown/agents/conversation-analyzer.md` — hookify conversation-analyzer 출력 스키마. ANALYZER-02 "현 hookify analyzer 출력 스키마와 호환" 요건의 기준. **호출하지 않고 스키마만 참조**.

### Prior Phase Decisions (lock — do not re-litigate)

- `.planning/phases/09-sg-retro-skill-scaffold/09-CONTEXT.md` — Phase 9 전체 결정 (D-01~D-21). Phase 10이 확장하는 모든 기반 결정이 여기에 있음.
- `.planning/milestones/v1.1-phases/06-sg-health/06-CONTEXT.md` §D-04 — bash-only, 별도 Python/셸 helper 미도입 원칙.
- `.planning/milestones/v1.1-phases/07-status-accuracy/07-CONTEXT.md` §D-04~D-08 — STATE.md `Phase:` multi-line 파싱 규칙 lock.
- `.planning/milestones/v1.1-phases/08-session-restore/08-CONTEXT.md` §D-12 — AskUserQuestion header 영문/brevity 컨벤션.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `skills/sg-retro/SKILL.md` Step 2 (lens code mapping + AskUserQuestion): Phase 10에서 `multiSelect: false` → `true`로 변경하고 옵션 2개(Sailboat, Five Whys) + analyze를 추가하면 됨. 기존 `ssc`/`4ls`/`dspm` case 분기는 유지.
- `skills/sg-retro/SKILL.md` Step 6 (append to lessons): 단일 lens append 로직. multi-lens는 이 Step을 lens 배열 순회 안에서 반복 호출하는 구조로 확장 가능.
- `skills/sg-retro/SKILL.md` Step 3/4 (artifact 수집 + git context): Sailboat/Five Whys도 동일 수집 로직 재사용. transcript 수집(D-06)은 Step 3 뒤에 추가 bash 블록으로 삽입.

### Established Patterns

- **bash-only SKILL.md**: Python/셸 helper 미도입. 모든 로직은 SKILL.md의 bash 블록 + Claude LLM 실행. transcript 분석은 bash grep이 아닌 Claude가 Read 도구로 읽고 LLM이 직접 파악.
- **lens 출력 구조**: `## Lens: {name}` + `_Captured: {ISO}_` + fixed subheadings + `### Action Items` 3-col 표. Phase 12 파서 키.
- **AskUserQuestion 라벨**: `"{FriendlyName} ({code})"` 형식. `header: "Lens"` (≤12 chars). 기본 선택 없음.
- **lessons append**: Phase 9 D-17~D-21 스키마. `>>` redirect 단일 블록. 같은 lens 중복 시 `(run N)` suffix.

### Integration Points

- **Phase 10 ↔ `skills/sg-retro/SKILL.md`**: 이 파일 하나만 수정. 확장 지점:
  1. Step 2: `multiSelect: true` + 5개 → 6개 옵션(analyze 포함) + `sail`/`5why`/`analyze` case 추가
  2. Step 5: Sailboat + Five Whys + Conversation Analyzer sub-block 추가
  3. Step 6: multi-lens 순회 wrapper 추가 (lens 배열 loop)
  4. Step 3 뒤: transcript 수집 bash 블록 추가
- **Phase 10 ↔ Phase 12**: D-09/D-12/D-17의 lens 섹션 출력 구조 + Action Items 표가 Phase 12 RECURRENCE-01 파서의 입력. Sailboat/Five Whys도 동일 구조 사용 필수.
- **Phase 10 ↔ `.planning/lessons/`**: multi-lens 실행 시 같은 파일에 순차 append — Phase 9 D-18 메커니즘이 그대로 확장됨.

### Known Risk Sites

- **Five Whys 대화형 흐름 + multi-lens 조합**: Five Whys는 순차 대화 5턴이 필요하다. multi-lens 선택에서 Five Whys + 다른 lens를 함께 선택하면 Five Whys를 먼저 실행할지 마지막에 할지 순서 문제가 생길 수 있음. 권장: AskUserQuestion 선택 순서대로 실행 (사용자가 선택한 순서가 의도).
- **transcript JSONL 미존재**: `~/.claude/projects/{slug}/*.jsonl`가 없는 경우(초기 설치, CI 환경 등) graceful fallback 필요. D-07 분석 없이 "No transcript found — skipping analyzer." 메시지 후 rule draft 단계 생략.
- **multi-lens 중 AskUserQuestion 연속**: 각 lens마다 AskUserQuestion이 있을 경우 사용자 입력이 n번 필요. Five Whys는 추가로 6턴(problem + 5 whys). UX 부담 고려 — PLAN.md에서 Five Whys를 multi-lens에서 선택했을 때의 흐름 명세.
- **`analyze` lens와 다른 lens 동시 선택 시 auto-suggest 중복**: analyze를 명시 선택하고 다른 lens도 선택했을 때, auto-suggest(D-02)가 lens 종료마다 돌면 중복 제안이 발생. 해결: auto-suggest는 마지막 lens 이후 1회만 실행, analyze lens 명시 선택 시에는 analyze 단계에서 통합.
- **`LENS_CODE` 배열 파싱 (multi-lens argument path)**: `args="10 4ls dspm"` 처리 시 `set -- $ARGUMENTS` 후 `$3` 이상을 토큰으로 파싱해야 함. Phase 9 D-03은 두 번째 토큰만 처리했으므로 D-21 확장이 필요.

</code_context>

<specifics>
## Specific Ideas

### Lens 코드 완전 매핑표 (D-03 확장)

| code | lens name | AskUserQuestion label |
|------|-----------|-----------------------|
| `ssc` | Start/Stop/Continue | `"Start/Stop/Continue (ssc)"` |
| `4ls` | 4Ls | `"4Ls (4ls)"` |
| `dspm` | Decisions/Surprises/Patterns/Mistakes | `"Decisions/Surprises/Patterns/Mistakes (dspm)"` |
| `sail` | Sailboat | `"Sailboat (sail)"` |
| `5why` | Five Whys | `"Five Whys (5why)"` |
| `analyze` | Conversation Analyzer | `"Conversation Analyzer (analyze)"` |

### Transcript 경로 bash 블록 (D-06)

```bash
PROJECT_SLUG=$(pwd | tr '/' '-' | sed 's/^-//')
TRANSCRIPT_DIR="$HOME/.claude/projects/${PROJECT_SLUG}"
TRANSCRIPT_FILE=$(ls -t "${TRANSCRIPT_DIR}"/*.jsonl 2>/dev/null | head -1)
if [ -z "$TRANSCRIPT_FILE" ]; then
  echo "[Conversation Analyzer] No transcript found at ${TRANSCRIPT_DIR}. Skipping analyzer." >&2
  TRANSCRIPT_FILE=""
fi
```

### Analyzer 출력 마크다운 골격 (D-04)

```markdown
## Lens: Conversation Analyzer
_Captured: {ISO}_

### Analysis Findings

| category | tool/event | pattern | context | severity |
|----------|------------|---------|---------|----------|
| frustration | Bash | `rm -rf` | User said "왜 삭제해" after cleanup | high |
| correction | Edit | `.env` write | User reverted env file change | high |
| repeated | Bash | `cat` instead of Read | Same correction 3 times | medium |
| validated-success | Edit | Surgical Edit over Write | User accepted minimal-change approach | low |

### Draft Hookify Rules

- `warn-dangerous-rm` — Event: bash, Pattern: `rm\s+-rf`, Severity: high
- `block-env-write` — Event: file, Pattern: `\.env$`, Severity: high

### Action Items
| priority | item | next step |
|----------|------|-----------|
| P1 | Block rm -rf usage | Create `.claude/sg-rule.warn-dangerous-rm.local.md` |
| P2 | Guard .env writes | Create `.claude/sg-rule.block-env-write.local.md` |
```

### Five Whys AskUserQuestion 흐름 (D-14/D-16)

1. AskUserQuestion header `"Five Whys"`, question: `"What problem do you want to analyze?"` (free text — no options, just a text input prompt)
2. Claude가 첫 번째 "Why?" 질문 (plain text 출력)
3. 사용자가 답변 → Claude가 두 번째 "Why?" 질문
4. 5번 반복 → root cause 도출 + 요약
5. Action Items 확정 → lessons append

### Multi-lens 수동 시나리오 추가 (Phase 9 specifics §수동 검증 시나리오 확장)

| # | $ARGUMENTS | 기대 동작 |
|---|---|---|
| 12 | `"10"` | multiSelect AskUserQuestion — 여러 lens 선택 가능 |
| 13 | `"10 sail"` | AskUserQuestion 없이 Sailboat lens 직접 실행 |
| 14 | `"10 5why"` | AskUserQuestion 없이 Five Whys 직접 실행 |
| 15 | `"10 analyze"` | AskUserQuestion 없이 Conversation Analyzer 직접 실행 |
| 16 | `"10 4ls dspm"` | 4Ls 먼저, DSPM 다음, 같은 lessons 파일에 순차 append |
| 17 | `"10 analyze"`, TRANSCRIPT_FILE 없음 | "No transcript found" 후 graceful exit |
| 18 | 여러 lens 선택 (analyze 포함) | analyze는 마지막에 실행, auto-suggest 1회만 |

</specifics>

<deferred>
## Deferred Ideas

- **자체 rule runner (hookify 없이 guard 실행)** — Phase 11 RULES-01~04 책임. Phase 10은 analyzer가 rule draft를 **텍스트로 제안**하는 것까지만 — 실제 `.claude/sg-rule.*.local.md` 자동 생성과 PreToolUse hook 실행은 Phase 11.
- **lessons YAML frontmatter (machine-readable metadata)** — Phase 12 RECURRENCE-01이 실제로 필요로 할 때 도입. Phase 10 출력은 plain markdown 유지.
- **weighted top-N RECURRENCE 가드 (sg-plan Step 0 / sg-execute 진입 노출)** — Phase 12 RECURRENCE-01/02/03 책임.
- **`sg-learn` → `sg-retro` 라우팅 전환** — Phase 13 MIGRATION-01. Phase 10은 `commands/sg-learn.md` 수정 금지.
- **analyzer auto-run at sg-retro session end** (사용자가 lens 선택 없이 analyzer만 자동 실행) — 현재는 명시 선택 또는 auto-suggest 방식으로 제한. v1.3 이후 LLM 기반 lens 추천과 함께 재검토.
- **Five Whys 문제 자동 추출** (DSPM "Mistakes" 섹션에서 Five Whys 입력 자동 제안) — Phase 10에서는 사용자가 직접 problem statement를 입력하는 방식으로 한정. 자동 추출은 RECURRENCE 가드와 함께 Phase 12 재검토.
- **`sg-retro` argument-driven 비대화형 다중 lens (`args="10 4ls dspm sail"`)** — D-21에서 세 번째 이후 토큰 파싱 지원하므로 이미 경로 확보됨. 단, Five Whys는 대화형 필수이므로 argument-driven multi에서 Five Whys 포함 시 자동으로 대화형 모드 전환.

</deferred>

---

*Phase: 10-conversation-analyzer-lens*
*Context gathered: 2026-05-20*
