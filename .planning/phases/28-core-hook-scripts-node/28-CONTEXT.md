# Phase 28: Core hook scripts Node 포팅 - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

`hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.py` 4개 파일(총 716 lines)을 **순수 JavaScript CommonJS(`.cjs`)** 형태로 1:1 재작성한다. 외부 의존성 0, Node 18+ 내장 모듈만 사용, Python 버전과 stdin/stdout JSON · regex 매칭 결과 · exit code가 모두 동등해야 한다.

**범위 안:**
- 4개 `hooks/*.cjs` 파일 신규 작성 (NODE-01~04)
- Python 버전과 동일한 입출력 스키마 보존
- `transcript_matcher.cjs`의 export 인터페이스 정의 (stop_hook이 require)
- `.planning/config.json`의 `super_gsd.auto_advance: false` 비활성화 동작 보존

**범위 밖 (다음 phase 또는 out of scope):**
- `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` 명령 교체 → **Phase 29**
- Skill/Agent 내부 `python3` 호출 교체 → **Phase 30**
- `hooks/*.py` 4개 삭제, CLAUDE.md/README/CHANGELOG 갱신 → **Phase 31**
- TypeScript 도입, package.json 추가, 자동 테스트 프레임워크 — **마일스톤 out of scope**

</domain>

<decisions>
## Implementation Decisions

### 언어·런타임 (마일스톤 단계에서 확정 — 재논의 불필요)
- **D-01 (locked):** 순수 JavaScript + CommonJS(`.cjs`). TypeScript, ESM, package.json 모두 사용하지 않음. (REQUIREMENTS.md "언어/모듈 결정")
- **D-02 (locked):** 외부 의존성 0. Node 내장 모듈(`fs`, `path`, `process`, `child_process`, `util`)만 사용. (REQUIREMENTS.md "동기" + Success Criterion #1: `grep -l "require('[^./]" hooks/*.cjs | grep -v "require('fs\|path\|process\|child_process')"` 0건)
- **D-03 (locked):** Node 18+ 기준. Claude Code 자체가 Node 18+를 요구하므로 사실상 보장. (REQUIREMENTS.md "제약")
- **D-04 (locked):** 동작 1:1 매핑. 입출력 JSON 스키마, regex 매칭 결과, exit code 모두 동일. (REQUIREMENTS.md "동등성 원칙")
- **D-05 (locked):** 파일명은 Python 원본을 그대로 미러링 — `stop_hook.cjs`, `transcript_matcher.cjs`, `rule_runner.cjs`, `lessons_ranker.cjs`. (REQUIREMENTS.md NODE-01~04 "Files")
- **D-06 (locked):** Python 파일(`hooks/*.py`)은 Phase 28 동안 **삭제하지 않음**. CLEAN-01은 Phase 31에서 모든 `.cjs` 검증 후 일괄 수행. (REQUIREMENTS.md CLEAN-01 + ROADMAP.md Phase 31 Success Criterion #1)
- **D-07 (locked):** 자동 테스트 프레임워크 도입 없음. 검증은 manual smoke test로만 수행. (REQUIREMENTS.md "Out of Scope" + Success Criteria #6~7 "manual")

### stdin 처리 (Python `json.load(sys.stdin)` → Node)

- **D-08:** stdin은 `fs.readFileSync(0, 'utf-8')`로 동기 읽기 후 `JSON.parse`. 이유:
  - Python 원본이 blocking sync read (`json.load(sys.stdin)`)이므로 의미 동등성을 위해 동기식이 자연스럽다.
  - hook 스크립트는 짧은 JSON payload를 받고 즉시 응답·종료해야 하며, async event loop가 종료 타이밍을 흐리는 것을 막는다.
  - macOS/Linux에서 `0` (stdin fd)에 대한 `readFileSync`는 Node 12+부터 안정적이며 외부 의존성이 필요 없다.
  - 대안 `process.stdin.on('data')` async 패턴은 `process.exit(0)` 시점 제어가 까다롭고 hook 응답 누락 위험이 있어 채택 제외.

### Glob 확장 (Python `glob.glob()` → Node)

- **D-09:** Node 내장 glob 대신 **목적 한정 미니 매처**를 hand-roll. `fs.readdirSync` + 패턴 일치 함수(~15 lines). 이유:
  - 실제 사용 패턴은 3종으로 매우 제한적: `~/.claude/.../hookify.*.local.md`, `.../sg-rule.*.local.md`, `.planning/lessons/*.md`. 모두 `prefix.*.suffix` 또는 `dir/*.ext` 형태.
  - Node 18+ 내장에는 stable glob이 없음 (`fs.glob`은 Node 22 experimental). Node 22+ 요구는 D-03을 깬다.
  - 외부 dep 추가 불가 (D-02).
  - CLI 인자(`lessons_ranker.cjs`)의 사용자 제공 glob도 동일한 좁은 형식만 받는다(`.planning/lessons/*.md` 등).
- **D-10:** glob 헬퍼는 4개 파일에서 공유하지 않고 **각 파일 내에 인라인 복제**한다. 이유:
  - 공유 모듈을 만들면 `hooks/_lib.cjs` 같은 5번째 파일이 생겨 NODE-01~04 4개 REQ 매핑이 깨진다.
  - 함수가 작아(15 lines) 복제 비용보다 의존성 분리 가치가 크다.
  - `transcript_matcher.cjs`는 stop_hook에서만 require되는 자연스러운 분리이지만, glob은 stop_hook에서는 사용되지 않음.

### CLI 인자 파싱 (lessons_ranker.py `argparse` → Node)

- **D-11:** `util.parseArgs` (Node 18.3+ stable) 사용. 이유:
  - Node 18 baseline 안에서 외부 dep 없이 사용 가능.
  - `--top N`, `--archive`, `--milestone VERSION`, 위치 인자 `paths...` 모두 native 지원.
  - hand-roll보다 코드량이 적고 의도가 명확.
  - 만약 Node 18.0~18.2 환경에서 실패 보고가 나오면 Phase 28 retro에서 hand-roll fallback으로 전환 검토 (지금은 도입하지 않음).

### 정규식 호환성 (Python `re` → JS `RegExp`)

- **D-12:** 코드 내부에 하드코딩된 정규식은 Python → JS 1:1 수동 변환. 모든 패턴이 단순 syntax(`^`, `$`, `(...)`, `\d`, `\.`, `[a-z]`)만 사용해 JS와 호환됨을 사전 검증 완료:
  - `stop_hook.py:55,58` — `^Phase:\s*(.+)`, `^([0-9]+)` (MULTILINE) → JS `m` flag
  - `lessons_ranker.py:20,22,24,27,37,74` — `\(high\)`, `\(medium\)`, `\(low\)`, `severity\s*:\s*(high|medium|low)`, `(\d{4}-\d{2}-\d{2})`, `^(## .+)$` (MULTILINE)
  - `rule_runner.py:187` — `re.search(pattern, value, re.IGNORECASE)`에서 `pattern`은 **사용자 제공**(rule .md frontmatter)이므로 변환 책임 없음.
- **D-13:** 사용자 제공 패턴(`rule_runner.cjs` 내부 `_match_condition`의 `cond.pattern`)은 **JS `RegExp(pattern, 'i')` 그대로 전달**. Python 전용 syntax(`(?P<name>...)`, `\A`, `\Z`)는 변환하지 않음. 이유:
  - 현재 `.claude/*.local.md` 파일 0개 — 실제 사용자 패턴 예시가 없음. (확인됨)
  - 향후 사용자 패턴이 호환 불가 syntax를 쓸 경우 `try { new RegExp(...) } catch` 블록이 Python `re.error` 분기와 동일하게 false를 반환하므로 안전(rule_runner.py:188~189과 동일 fallback).
  - Python regex 호환성을 약속하는 순간 PCRE 에뮬레이터를 직접 짜야 하며 zero-dep 원칙과 충돌.
- **D-14:** `re.split(r'^(## .+)$', content, flags=re.MULTILINE)`의 capture-group 분할 동작은 JS `split`로는 정확히 재현되지 않으므로 **수동 분할 헬퍼**를 작성:
  - `content.matchAll(/^(## .+)$/gm)`로 헤더 위치와 매치를 수집
  - 헤더 사이 영역을 body로 잘라 `[preamble, header1, body1, header2, body2, ...]` 배열을 직접 구성
  - Python의 `re.split` 결과와 길이·내용이 동일함을 단위 fixture(`.planning/phases/28-.../fixtures/`)로 검증

### YAML frontmatter 파서 (rule_runner.py:35-101)

- **D-15:** Python의 hand-rolled 파서를 **알고리즘 그대로** 라인 단위 포팅. 이유:
  - 모든 quirk(빈 value → list 모드 진입, indent>2 → dict item nesting, `.strip('"').strip("'")` 단일/이중 따옴표 양쪽 벗기기, `true`/`false` boolean 변환)을 보존해야 기존 `.local.md` 파일의 동등성 보장.
  - 표준 YAML 라이브러리를 도입할 수 없음(D-02 zero-dep).
  - "더 strict한 파서"로 재설계하면 D-04(1:1 동등성)를 위배.

### `transcript_matcher.cjs` export 인터페이스

- **D-16:** `module.exports = { detectSignal }` 형태로 export. 함수명은 **camelCase**(`detectSignal`)로 통일. 이유:
  - 신규 JS 파일이므로 JS 관용을 따른다 (Python `detect_signal` snake_case는 호출 측 stop_hook에서만 1회 변경).
  - 객체 export로 통일하면 향후 helper 추가 시 export 형태가 깨지지 않음 (호환성).
  - 단일 callsite(`stop_hook.cjs` 내부)이므로 변경 비용 최소.

### 에러·exit code 정책

- **D-17:** Python 원본의 swallow-all 정책을 그대로 미러링:
  - `stop_hook.cjs` — 모든 예외 catch → `{"systemMessage": "super-gsd hook error: ${e.message}"}` 출력 → `process.exit(0)`. **절대 non-zero exit 금지** (Claude Code가 hook 실패로 처리).
  - `rule_runner.cjs` — 동일.
  - `lessons_ranker.cjs` CLI 모드 — `--archive`인데 `--milestone` 없으면 `process.exit(1)` (Python line 157과 일치). 그 외 모든 경로는 success로 종료. unexpected 예외는 stderr 출력 후 `process.exit(1)` (Python line 213~215와 일치).
- **D-18:** stdout JSON은 한 줄로 출력 (`JSON.stringify(obj)` — no indent). `lessons_ranker.cjs`의 JSON-lines 출력도 한 줄당 한 record. Python `json.dumps({})` → `"{}"`, JS `JSON.stringify({})` → `"{}"` 동일. `ensure_ascii=False` 동작은 JS 기본값이므로 별도 처리 불필요(`lessons_ranker.py:150`).

### 날짜·시간 계산 (lessons_ranker.py)

- **D-19:** 날짜 계산은 **로컬 타임존 기준**으로 처리하여 Python `date.today()` / `datetime.fromtimestamp(mtime).date()` 와 동일한 결과 보장:
  - 파일명 `YYYY-MM-DD` 파싱: `new Date(YYYY, MM-1, DD)` (로컬 타임존). `new Date("YYYY-MM-DD")`는 UTC 자정으로 해석되어 타임존이 음수일 때 하루 어긋남 — 사용 금지.
  - 오늘 날짜: `const today = new Date(); today.setHours(0,0,0,0)`.
  - days_ago: `Math.floor((today - fileDate) / 86400000)`.
  - mtime fallback: `fs.statSync(path).mtime` (Date 객체) → `setHours(0,0,0,0)`로 자정 정규화.

### PLUGIN_ROOT 해석

- **D-20:** Python 원본과 동일한 우선순위:
  1. `process.env.CLAUDE_PLUGIN_ROOT` (있으면 사용)
  2. fallback: `path.dirname(path.dirname(__filename))` — CJS `__filename` 글로벌로 hooks/ 부모 디렉토리 도출
- **D-21:** `transcript_matcher.cjs`는 PLUGIN_ROOT가 필요하지 않으므로 해당 로직을 갖지 않음 (Python 원본도 동일 — 신호 매칭만 담당).

### 검증·증거 보관

- **D-22:** 각 `.cjs` 파일별로 **input/output fixture 쌍**(JSON)을 `.planning/phases/28-core-hook-scripts-node/fixtures/`에 1~3개씩 보관:
  - `stop_hook/` — gsd-plan-complete, superpowers-review-complete, empty signal 시나리오 1개씩
  - `rule_runner/` — bash rule match (warn), file rule match (block), no match 시나리오 1개씩
  - `lessons_ranker/` — `--top 5` 단일 호출과 `--archive` 단일 호출 결과 (실제 `.planning/lessons/` 사용)
  - `transcript_matcher/` — 각 신호 패턴별 transcript fragment 1개씩 (4개 신호 × 1)
- **D-23:** fixture는 manual diff 비교 결과(Python vs Node)를 같은 디렉토리 `VERIFY.md`에 기록. 자동 비교 스크립트 없음(D-07). 28-VERIFY.md는 PLAN.md verification block에서 산출물로 표기.

### Claude's Discretion

다음 항목은 명시적 사용자 결정이 없어 위 결정을 잠정 채택했다. **plan-phase 또는 execute 단계에서 사용자가 명시적으로 다른 선택을 하면 즉시 교체 가능**:

- **D-8 (stdin 처리 방식)** — `readFileSync(0)` vs async 패턴. 동기식 채택 근거는 종료 타이밍/Python 동등성. 사용자가 async 선호 시 변경 가능하나 race condition 방지 패턴(`stdin.on('end')`에서만 exit)을 추가해야 함.
- **D-11 (CLI 파서)** — `util.parseArgs` vs hand-roll. parseArgs 채택 근거는 Node 18.3+ baseline. 18.0~18.2 호환이 명시 요구되면 hand-roll로 전환.
- **D-16 (export 명명)** — `detectSignal` camelCase. snake_case 유지(`detect_signal`)로도 동작상 차이 없음. 프로젝트가 신규 JS 코드 스타일 가이드를 별도로 정한다면 그것을 우선.
- **D-22 (fixture 수)** — 시나리오 개수는 보수적으로 잡았다. plan-phase에서 cost-vs-coverage 판단해 조정 가능.

### Folded Todos

해당 사항 없음 — `cross_reference_todos`에서 phase 28 매칭 0건.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase·마일스톤 명세
- `.planning/REQUIREMENTS.md` — v2.4 마일스톤 전체 REQ(NODE/CFG/SKILL/AGENT/CLEAN/DOC) 및 Success Criteria 정의. Phase 28은 NODE-01~04를 담당.
- `.planning/ROADMAP.md` §"v2.4 Hooks Node Migration" + §"Phase 28: Core hook scripts Node 포팅" — phase별 Goal, Depends on, Requirements, Success Criteria 5건 명시.
- `.planning/PROJECT.md` §"Current Milestone: v2.4 Hooks Node Migration" — milestone goal, target features, key context.
- `.planning/STATE.md` — current milestone status, deferred items.

### 포팅 대상 원본 (필수 reference)
- `hooks/stop_hook.py` (163 lines) — Stop/SubagentStop entry point. 신호별 systemMessage 분기, hookify-complete 시 `.planning/lessons/` 저장.
- `hooks/transcript_matcher.py` (60 lines) — `detect_signal()` 함수 단일 export. 4개 신호 패턴 배열 정의.
- `hooks/rule_runner.py` (278 lines) — PreToolUse entry point. hookify 미설치 환경 가드, frontmatter 파서, condition matcher, warn/block decision.
- `hooks/lessons_ranker.py` (215 lines) — CLI(`--top N`, `--archive --milestone`). 가중치 공식 `0.4×freq + 0.4×recency + 0.2×severity`.

### Hook 호출 컨텍스트 (변경하지 않지만 이해 필요)
- `hooks/hooks.json` — 현재 `python3 ...py` 명령. **Phase 28에서는 수정하지 않음** (Phase 29 CFG-01 대상).
- `.planning/config.json` — `super_gsd.auto_advance` 키. stop_hook과 rule_runner 양쪽에서 읽는다.

### 프로젝트 코딩 규칙
- `CLAUDE.md` §"Conventions" — macOS 셸 이식성 규칙 (BSD/GNU 도구 차이). `.cjs` 코드 자체에는 직접 영향 없으나, fixture 검증용 셸 명령에 적용.
- `CLAUDE.md` §"버전 관리" — 이 phase는 마일스톤 일부이므로 phase 단독 버전 bump는 하지 않음. CHANGELOG는 Phase 31 DOC-03에서 일괄 기록.

### 선행 phase 결정 (참고용)
- `.planning/phases/27-gsd-repo-migration/27-CONTEXT.md` — 직전 phase. 단순 문자열 교체와 달리 Phase 28은 로직 포팅이므로 동등성 검증 절차가 추가됨을 인지.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`hooks/transcript_matcher.py` 4개 신호 배열** — `GSD_PLAN_SIGNALS`, `IMPLEMENTATION_SIGNALS`, `REVIEW_SIGNALS`, `HOOKIFY_SIGNALS`는 상수 문자열 리스트라 1:1 옮기면 끝. 의미 변경 위험 0.
- **`hooks/lessons_ranker.py` 가중치 공식** — `0.4 * freq + 0.4 * recency + 0.2 * severity`은 부동소수 산술이므로 JS `Number` 연산으로 동일 결과(IEEE 754 동일 표현).
- **Python `__file__` → JS `__filename`** — CJS에서 글로벌로 사용 가능. PLUGIN_ROOT 해석 로직이 그대로 매핑됨.
- **stdout JSON 응답 스키마** — `{}`, `{"systemMessage": "..."}`, `{"hookSpecificOutput": {"hookEventName": ..., "permissionDecision": "deny"}, "systemMessage": "..."}` 세 종류. JS `JSON.stringify`로 동일 출력 가능.

### Established Patterns
- **swallow-all error policy** — Python의 `try: ... except Exception: ...; finally: sys.exit(0)` 패턴. JS에서는 `try { main() } catch (e) { console.log(JSON.stringify({systemMessage: ...})) } finally { process.exit(0) }` 로 매핑.
- **`.planning/config.json` `super_gsd.auto_advance: false` 가드** — `stop_hook.py`와 `rule_runner.py`가 동일한 가드 로직을 갖는다. 두 `.cjs`에 인라인 복제(D-10 원칙과 일치).
- **frontmatter `---` 구분 markdown** — `_parse_frontmatter`가 `--- ... ---` 사이를 파싱. 동일 포맷의 `.claude/*.local.md` 파일을 읽는다.
- **glob pattern 좁은 사용** — `.claude/hookify.*.local.md`, `.claude/sg-rule.*.local.md`, `.planning/lessons/*.md` 3종이 전부. 임의 glob 미사용.

### Integration Points
- `stop_hook.cjs` → `transcript_matcher.cjs` (`require('./transcript_matcher.cjs').detectSignal`). 단일 호출 지점.
- 모든 hook은 **Claude Code → stdin JSON → stdout JSON** 단방향 파이프. 파일시스템 부수효과는 `stop_hook.cjs`의 `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 저장과 `lessons_ranker.cjs --archive`의 `.planning/milestones/vX.Y-LESSONS.md` 저장 두 곳뿐.
- 호출자 변경은 **Phase 29 범위** — `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`. Phase 28에서 `.cjs` 파일은 만들어지지만 아직 호출되지 않는다 (Python 버전이 여전히 동작 중).

### 발견한 위험·landmine
- **JS `Date("YYYY-MM-DD")` UTC 해석** — D-19에서 명시. `new Date(year, month-1, day)` 로컬 생성자를 반드시 사용.
- **JS `String.split(regex_with_group)`** — Python `re.split` 결과 배열과 길이가 다를 수 있어 D-14에서 수동 매처 채택.
- **Node 18 stable feature 경계** — `util.parseArgs`는 18.3부터. 18.0~18.2 환경은 D-11 fallback 필요 (현재는 미구현).
- **stdin EOF 처리** — sync `readFileSync(0)`는 stdin이 TTY일 때 영원히 블록될 수 있음. Claude Code hook은 항상 파이프로 호출하므로 실 환경에서는 문제 없지만, manual 테스트 시 `echo '...' | node hooks/X.cjs` 형태 강제.

</code_context>

<specifics>
## Specific Ideas

- **Fixture 디렉토리 구조** (D-22 구체화):
  ```
  .planning/phases/28-core-hook-scripts-node/fixtures/
  ├── stop_hook/
  │   ├── gsd-plan-complete.in.json
  │   ├── gsd-plan-complete.out.json
  │   ├── review-complete.in.json
  │   ├── review-complete.out.json
  │   ├── empty-signal.in.json
  │   └── empty-signal.out.json
  ├── transcript_matcher/
  │   ├── gsd-signal.txt + expected.txt (4개 signal × 1)
  ├── rule_runner/
  │   ├── bash-warn.in.json / .out.json
  │   ├── file-block.in.json / .out.json
  │   └── no-match.in.json / .out.json
  └── lessons_ranker/
      ├── top5.cmd / .out.jsonl
      └── archive.cmd / .out.md
  ```
- **PLAN.md 권장 구조** — 4개 plan(`28-01`~`28-04`)로 분리하여 각 plan이 NODE-01~04에 1:1 매핑. files_modified가 4개 파일로 disjoint하므로 의존성은 `28-02-transcript_matcher` → `28-01-stop_hook` (require 관계)만 존재. wave 1: 28-02, 28-03, 28-04 병렬. wave 2: 28-01 (단독, 28-02 export 의존).
- **smoke test 명령 권장** (PHASE-VERIFY 단계에서 사용):
  ```bash
  # diff 비교 예시
  diff <(cat fixtures/stop_hook/gsd-plan-complete.in.json | python3 hooks/stop_hook.py) \
       <(cat fixtures/stop_hook/gsd-plan-complete.in.json | node hooks/stop_hook.cjs)
  ```

</specifics>

<deferred>
## Deferred Ideas

- **TypeScript 도입** — 향후 마일스톤에서 재검토. (REQUIREMENTS.md Out of Scope 명시)
- **자동 테스트 프레임워크 (Jest/Vitest/node:test)** — Node 내장 `node:test`는 Node 18+에서 사용 가능하나 v2.4는 manual smoke test로 한정. 후속 마일스톤 후보.
- **공유 utility 모듈 `hooks/_lib.cjs`** — glob, frontmatter 파서, JSON I/O가 4개 파일에 분산된다. 5번째 파일 도입 시 REQ 매핑(NODE-01~04)이 깨지므로 v2.4 이후 리팩토링 phase에서 검토.
- **Python 패턴 지원 PCRE 에뮬레이터** — 사용자가 `(?P<name>)` 등을 사용한 rule을 작성한다면 필요. 현재 사용자 패턴 0건이므로 도입 보류.
- **CLI 인자 hand-roll fallback** — Node 18.0~18.2 환경 호환 요청이 들어오면 추가 (현재 deferred).
- **Reviewed Todos** — 해당 사항 없음 (todo 매칭 0건).

</deferred>

---

*Phase: 28-core-hook-scripts-node*
*Context gathered: 2026-05-25*
