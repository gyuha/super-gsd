# Phase 30: Skill/Agent 내부 호출 교체 - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

`skills/sg-*/SKILL.md` 5개 + `.agents/skills/sg-*/SKILL.md` 3개 안에 산재한 **13개 `python3` 호출 지점**을 Node 기반 등가물로 일괄 교체한다. Phase 28의 `.cjs` 산출물(`hooks/lessons_ranker.cjs` 등)과 Node 18+ 보장(Claude Code 런타임)을 전제로, 사용자가 Python 없이도 모든 `sg-*` 명령을 실행할 수 있게 한다.

**변경 대상 (8 파일 / 13 occurrence):**

| 파일 | Line | 호출 형태 | REQ |
|------|------|----------|-----|
| `skills/sg-plan/SKILL.md` | L20 | `python3 hooks/lessons_ranker.py --top 5 ...` | SKILL-01 |
| `skills/sg-plan/SKILL.md` | L21 | `| python3 -c "import sys,json; ..."` (스코어 포매팅) | SKILL-01 |
| `skills/sg-execute/SKILL.md` | L20 | `python3 hooks/lessons_ranker.py --top 5 ...` | SKILL-01 |
| `skills/sg-execute/SKILL.md` | L21 | `| python3 -c "..."` (스코어 포매팅) | SKILL-01 |
| `skills/sg-complete/SKILL.md` | L36 | `python3 hooks/lessons_ranker.py --archive --milestone ...` | SKILL-01 |
| `skills/sg-quick/SKILL.md` | L62 | `python3 -c "import sys,json; ... print(d.get('quick_id') ...)"` | SKILL-02 |
| `skills/sg-quick/SKILL.md` | L63 | `python3 -c "import sys,json; ... print(d.get('task_dir') ...)"` | SKILL-02 |
| `skills/sg-ui-plan/SKILL.md` | L32 | `python3 -c 'import json,sys; ... print(json.loads(v))'` (JSON unescape) | SKILL-02 |
| `.agents/skills/sg-plan/SKILL.md` | L27 | `python3 hooks/lessons_ranker.py --top 5 ...` | AGENT-01 |
| `.agents/skills/sg-plan/SKILL.md` | L28 | `| python3 -c "..."` (스코어 포매팅) | AGENT-01 |
| `.agents/skills/sg-plan/SKILL.md` | L63 | `python3 -c 'import json,sys; ... print(json.loads(v))'` | AGENT-01 |
| `.agents/skills/sg-execute/SKILL.md` | L27 | `python3 hooks/lessons_ranker.py --top 5 ...` | AGENT-01 |
| `.agents/skills/sg-execute/SKILL.md` | L28 | `| python3 -c "..."` | AGENT-01 |
| `.agents/skills/sg-ship/SKILL.md` | L106 | `python3 -m pytest 2>&1 || TEST_FAILED=1` (테스트 러너 감지) | AGENT-01 |

**범위 안:**
- 위 8 파일 내 `python3` 토큰 0건이 되도록 Node 기반(`node hooks/*.cjs`, `node -e`)으로 교체
- macOS/Linux 양쪽 셸 호환성 보존
- 인용·기존 들여쓰기·바깥 셸 변수 캡처 동작 동일성 보존
- `python3 -m pytest` 라인(AGENT-01 sg-ship)의 처리 결정 (아래 D-09)

**범위 밖 (다음 phase 또는 out of scope):**
- `hooks/*.py` 4개 삭제 → **Phase 31 CLEAN-01**
- `CLAUDE.md`, `README.md`, `README.ko.md`, `CHANGELOG.md` 갱신 → **Phase 31 DOC-01~03**
- `hooks/*.cjs` 자체 수정 (Phase 28 산출물, Phase 29에서 호출 완료)
- `hooks/hooks.json` / `.codex/hooks.json` / `.gemini/settings.json` (Phase 29 완료)
- `.planning/research/{GEMINI,ANTIGRAVITY}.md`의 `python3` 언급 (REQUIREMENTS.md Out of Scope 명시)
- `.planning/` 아카이브 파일의 historical `python3` 언급 (REQUIREMENTS.md Out of Scope)
- 새 helper module 도입 (REQUIREMENTS.md "package.json 추가" out of scope와 일관)
- TypeScript, 자동 테스트 프레임워크 도입

</domain>

<decisions>
## Implementation Decisions

### 마일스톤 단계에서 잠금된 결정 (Phase 28/29 CONTEXT.md에서 carry-forward — 재논의 불필요)

- **D-01 (locked, from Phase 28):** `.cjs` 파일명은 Python 원본 미러링 — `hooks/lessons_ranker.cjs` 등. Phase 30 호출 문자열은 이 파일명을 그대로 사용한다.
- **D-02 (locked, from Phase 28):** `.cjs` 내부에서 `CLAUDE_PLUGIN_ROOT` env + `__filename` fallback이 이미 처리됨 → 호출자 측에서 환경변수를 새로 set할 필요 없음. 호출 행 자체는 변경 없음.
- **D-03 (locked, from Phase 28):** `.py` 파일은 Phase 30 동안 **삭제하지 않음**. Phase 31 CLEAN-01의 책임. Phase 30 commit 이후 `.py`와 `.cjs`가 공존하지만 모든 caller는 `.cjs`만 가리킨다.
- **D-04 (locked, from Phase 28):** 자동 테스트 프레임워크 도입 없음. 검증은 manual smoke test로만.
- **D-05 (locked, from Phase 29):** **Surgical two-token swap** 원칙 — `python3` → `node`, `*.py` → `*.cjs`. 그 외 모든 토큰(인자, 환경변수, redirection, pipe 구조)은 byte-exact 보존. SKILL-01의 `lessons_ranker` 호출 5건은 이 규칙으로 완결.
- **D-06 (locked, from Phase 29):** **Single PLAN + Single atomic commit** 패턴 채택. 이유: 8 파일이 동일 마이그레이션 step(Python→Node 호출자 일괄 reroute)에 속하며, 분할하면 부분 적용 상태(예: skills/sg-plan만 .cjs, .agents/skills/sg-plan은 .py)에서 동일 명령이 두 사본 사이 inconsistency를 일으킨다. 파일별 의존성 없음(공유 코드 0). Rollback은 `git revert` 1회로 충분.

### 인라인 `python3 -c` 교체 전략 (REQUIREMENTS SKILL-02 의 `node -e` vs `jq` 선택)

- **D-07:** **`node -e` 단일 채택** — `jq` 미사용. 이유:
  - REQUIREMENTS.md "동기" 절: "Node는 Claude Code Node 18+ 요구로 사실상 보장. Python은 사용자 환경 가변" — `jq` 또한 환경 가변(macOS 14+ 기본 설치 아님, Linux 배포판별 차이). 의존성 보장 원칙 위배.
  - Phase 28 D-02 zero-dep 원칙과 일관: 호출자(skill) 측도 ".cjs와 동일한 의존성 contract"를 따라야 일관된다.
  - `jq` 사용 시 syntax는 짧지만, macOS에서 `jq` 없으면 silent 실패 → 사용자 환경 확인 cost 증가.
  - `node -e`는 셸 quoting이 깐깐하지만, 기존 `python3 -c` 스니펫이 이미 multi-line shell quoting 사용 중이라 동일 패턴.

- **D-08:** `node -e` 패턴 표준화:

  **Pattern A — stdin JSON → 단일 key 추출 (sg-quick L62~63 케이스):**
  ```bash
  # Before
  QUICK_ID=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('quick_id') or d.get('id',''))")
  # After
  QUICK_ID=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.quick_id||j.id||"")}catch(e){}})')
  ```
  - `process.stdin.on('data')` 이벤트 패턴 — sync `readFileSync(0)`는 짧은 echo 입력에선 잘 동작하지만 일부 셸에서 EPIPE 위험. 이벤트 패턴이 더 안전하고 짧다.
  - `try/catch`는 invalid JSON 시 빈 문자열 반환 — Python 원본의 `python3 -c "..." 2>/dev/null` 대응.

  **Pattern B — escaped JSON string → unwrap (sg-ui-plan L32 케이스, gsd-sdk 출력이 `"..."` 형태로 escape된 경우):**
  ```bash
  # Before
  PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | python3 -c 'import json,sys; v=sys.stdin.read().strip(); print(json.loads(v))' 2>/dev/null || echo "$PHASE_SECTION_RAW")
  # After
  PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
  ```

  **Pattern C — SKILL-01의 score 포매팅 파이프 (sg-plan/execute L21):**
  ```bash
  # Before
  | python3 -c "
  import sys, json
  for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
      try:
          d = json.loads(line)
          print(f\"{i}. [score {d['score']:.2f}] {d['pattern']} ({d['source']})\")
      except Exception:
          pass
  "
  # After
  | node -e '
  let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
    const lines=buf.split("\n").filter(l=>l.trim());
    lines.forEach((line,i)=>{
      try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}${d.source?" ("+d.source+")":""}`)}catch(e){}
    });
  })'
  ```
  - sg-execute의 변형은 `${d.source}` 부분이 다름(reminder 모드는 source 출력 안 함) → 패턴 분기 보존.

- **D-09:** **Single-line vs multi-line node -e 정책** — short forms(Pattern A/B)은 single-line; long forms(Pattern C — score 포매팅)는 multi-line + 외부 single-quote. 이유:
  - YAML/Markdown indent 영향이 적음.
  - Bash heredoc 회피로 cross-shell(zsh/bash/dash) 호환성 확보.
  - 모든 Pattern은 macOS bash 3.2, zsh 5.x, Ubuntu bash 5.x에서 검증 대상 (manual smoke).

### `.agents/skills/sg-ship/SKILL.md` L106 `python3 -m pytest` 처리 (가장 큰 gray area)

- **D-10:** **`pytest` 직접 호출로 교체** — `python3 -m pytest` → `pytest`. 이유:
  - 마일스톤 success criterion #1(`grep -rn 'python3' .agents/skills/` 0건) 충족.
  - 사용자 프로젝트에 `pyproject.toml` 또는 `setup.py`가 있으면 `pytest`는 거의 항상 PATH에 있다(`pip install pytest` 또는 `poetry install`로 진입). `python3 -m pytest`보다 호환성이 떨어지지는 않는다 — 대부분의 Python 프로젝트는 양쪽 다 동작.
  - 기존 분기 의도("이 프로젝트가 Python 프로젝트면 테스트를 돌려라")는 보존. 단 super-gsd 자체는 Python 프로젝트가 아니므로 sg-ship에서 이 분기를 타지 않음 → super-gsd 사용 시 실질적 변경 없음.
  - 대안 (a) 분기 자체 삭제: 사용자 프로젝트에서 sg-ship의 test 차단 가드가 사라짐 → 동작 회귀.
  - 대안 (b) `node -e` wrapper: 의미 없음, pytest는 Python임.
  - 대안 (c) `python3` 그대로 두고 success criterion 예외 처리: ROADMAP을 깬다 + Phase 31에서 grep gate 통과 불가.

- **D-11:** **sg-ship의 분기 자체는 보존** — `if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then` 가드는 변경 없음. Python 프로젝트 감지 로직은 Python 의존성이 아니라 파일 존재 검사이므로 super-gsd v2.4 의존성 제거 원칙과 무관.

- **D-12:** **fallback 처리 추가하지 않음** — `pytest` 명령이 PATH에 없을 때 `python3 -m pytest`로 retry하는 fallback은 도입하지 않는다. 이유:
  - retry fallback은 grep success criterion #1 통과 불가 (`python3` 토큰이 다시 등장).
  - 사용자가 Python 프로젝트를 ship하면서 `pytest`가 PATH에 없다면 그건 환경 문제이지 sg-ship의 책임이 아님.

### Plan 분할 / Verify 전략

- **D-13:** **PLAN.md 1개** (`30-01-PLAN.md`)로 8 파일 동시 surgical edit. depends_on: none (Phase 29 완료, `hooks/*.cjs`도 Phase 28 완료). wave: 1.

- **D-14:** **4-tier 검증 절차** (Phase 29 D-10에서 확립한 패턴 재사용):
  1. **Static (자동)**: `grep -rn 'python3' skills/ .agents/skills/` 결과 0건 (ROADMAP Success Criterion #4 매핑).
  2. **Syntax (자동)**: 변경된 8 파일 모두 markdown으로 valid (셸 코드 블록 syntax는 형식만 — 실행 검증 X).
  3. **Dry-run (자동)**: `node -e` 패턴 3종을 독립 실행해 expected output 확인:
     ```bash
     # Pattern A
     echo '{"quick_id":"abc","id":"fallback"}' | node -e '...' # → "abc"
     # Pattern B
     printf '"hello"' | node -e '...' # → hello
     # Pattern C
     printf '{"score":0.42,"pattern":"P1","source":"f.md"}\n{"score":0.31,"pattern":"P2","source":"g.md"}\n' \
       | node -e '...' # → "1. [score 0.42] P1 (f.md)\n2. [score 0.31] P2 (g.md)\n"
     # lessons_ranker direct call
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md | head -3
     ```
  4. **Manual (사용자 환경)**: `/super-gsd:sg-plan` `/super-gsd:sg-execute` `/super-gsd:sg-quick` `/super-gsd:sg-ui-plan` `/super-gsd:sg-complete`를 한 번씩 실행해 Step 0(lessons 주입) 또는 stdin 파싱이 깨지지 않는지 확인. Codex CLI 환경의 `.agents/skills/` 사본은 사용자 환경 한정 → D-11 Phase 29 syntax-only fallback 동일 적용.

- **D-15:** **Pre-flight 가드** — Phase 30 commit 직전에 다음 4 파일이 모두 존재함을 확인:
  ```bash
  test -f hooks/lessons_ranker.cjs && \
  test -f hooks/stop_hook.cjs && \
  test -f hooks/rule_runner.cjs && \
  test -f hooks/transcript_matcher.cjs
  ```
  하나라도 missing이면 Phase 28을 재확인. (Phase 29 D-12와 동일 패턴.)

- **D-16:** **Single atomic commit** — `feat(30): swap python3 → node in skill callers`. 8 파일 동시 staging. Rollback은 `git revert` 1회.

### 검증 명령 (PHASE-VERIFY 단계에서 그대로 사용)

```bash
# Tier 1 — static grep (must be 0)
grep -rn 'python3' skills/ .agents/skills/

# Tier 2 — markdown syntax (best-effort: 8 파일이 git-add 가능)
git ls-files skills/sg-{plan,execute,complete,quick,ui-plan}/SKILL.md \
              .agents/skills/sg-{plan,execute,ship}/SKILL.md

# Tier 3 — node -e dry-run (Pattern A/B/C + lessons_ranker)
# (위 D-14 코드 블록 그대로 실행)

# Tier 4 — Claude Code manual
# /super-gsd:sg-plan, sg-execute, sg-quick, sg-ui-plan, sg-complete 실행
```

### Claude's Discretion (사용자 override 가능)

다음 항목은 명시적 사용자 결정 없이 잠정 채택했다. **plan-phase 또는 execute 단계에서 사용자가 명시적으로 다른 선택을 하면 즉시 교체 가능**:

- **D-07 (`node -e` vs `jq`)** — `node -e` 채택. 사용자가 모든 환경에서 `jq`를 보장한다고 명시하면 `jq` 채택 가능 (코드 짧아짐).
- **D-08 Pattern C multi-line** — single-line 압축 형태로 변환 가능 (가독성 trade-off).
- **D-09 Single PLAN** — 사용자가 SKILL-01 / SKILL-02 / AGENT-01 단위 git revert를 원하면 3 commits로 분할 가능.
- **D-10 (`pytest` 직접 호출)** — 대안: (a) 분기 자체 삭제 → sg-ship Python 프로젝트 테스트 차단 가드 제거; (b) ROADMAP success criterion #4 예외 명시 후 `python3 -m pytest` 유지 → Phase 31 grep gate 다시 풀어야 함. **이 결정은 가장 사용자 영향이 큰 항목이므로 plan-phase 진입 직후 명시 확인 권장**.
- **D-12 (fallback 미도입)** — 사용자가 pytest 명령 부재 시 fallback이 필요하다고 판단하면 try/catch wrapper 도입 가능 (예: `command -v pytest >/dev/null && pytest || python3 -m pytest`). 단, 후자 분기는 grep gate를 깨므로 `python3` 토큰을 셸 escape로 우회해야 함 — 권장하지 않음.

### Folded Todos

해당 사항 없음 — `cross_reference_todos`에서 phase 30 매칭 0건.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase·마일스톤 명세
- `.planning/REQUIREMENTS.md` §"SKILL-01", §"SKILL-02", §"AGENT-01" — Phase 30의 3개 REQ 정의 + Success Criteria (특히 #1, #7).
- `.planning/REQUIREMENTS.md` §"Out of Scope" — `.planning/research/{GEMINI,ANTIGRAVITY}.md`와 `.planning/` 아카이브 파일은 grep gate 예외임을 명시.
- `.planning/ROADMAP.md` §"Phase 30: Skill/Agent 내부 호출 교체" — Goal, Depends on, Requirements, Success Criteria 4건.
- `.planning/PROJECT.md` §"Current Milestone: v2.4 Hooks Node Migration" — 마일스톤 goal + target features (특히 line 34: "Skill 내 인라인 `python3 -c` 호출 및 `python3 hooks/lessons_ranker.py` 호출을 `node -e` / `jq` / `node hooks/*.cjs`로 교체").
- `.planning/STATE.md` — Phase 29 complete, Phase 30 ready 상태.

### 직접 변경 대상 (8 파일)
- `skills/sg-plan/SKILL.md` (Step 0, L20~L34) — lessons 주입 블록, `lessons_ranker.py` + 후속 `python3 -c` 포매팅.
- `skills/sg-execute/SKILL.md` (Step 0, L20~L32) — lessons reminder 블록, 동일 구조.
- `skills/sg-complete/SKILL.md` (Step 1.3, L29~L39) — `lessons_ranker.py --archive`.
- `skills/sg-quick/SKILL.md` (Step 2, L60~L67) — gsd-sdk init.quick JSON 파싱 (quick_id, task_dir).
- `skills/sg-ui-plan/SKILL.md` (Step 2, L29~L36) — gsd-sdk roadmap.get-phase JSON unescape.
- `.agents/skills/sg-plan/SKILL.md` (Step 0/1, L23~L67) — sg-plan 미러링 + gsd-sdk JSON unescape (Phase L63).
- `.agents/skills/sg-execute/SKILL.md` (Step 0, L23~L40) — sg-execute 미러링.
- `.agents/skills/sg-ship/SKILL.md` (L99~L111) — `python3 -m pytest` 테스트 러너 감지 분기.

### 호출 대상 `.cjs` 파일 (Phase 28 산출물 — 수정 없음, 참조만)
- `hooks/lessons_ranker.cjs` — `--top N`, `--archive --milestone vX.Y` CLI 인자 그대로 받음. Phase 28 D-11 `util.parseArgs` 기반.
- (`stop_hook.cjs`, `rule_runner.cjs`, `transcript_matcher.cjs` — Phase 30에서 호출되지 않음. Pre-flight 확인 대상.)

### 선행 phase 결정 (carry-forward)
- `.planning/phases/28-core-hook-scripts-node/28-CONTEXT.md` — D-01~D-23 잠금 결정. 특히 D-02 (zero-dep), D-05 (.cjs 미러링), D-11 (`util.parseArgs`).
- `.planning/phases/29-hook/29-CONTEXT.md` — D-01~D-12. 특히 D-05 (surgical two-token swap), D-08~D-09 (single PLAN + single commit), D-10 (4-tier verification), D-12 (pre-flight guard).
- `.planning/lessons/28-2026-05-25.md` + `.planning/lessons/29-2026-05-25.md` — Phase 28/29 retrospective lessons. **특히 Phase 29 P1 action items: JSON-escape rule + verify-gate head-assumption rule** — Phase 30 PLAN.md `<verify><automated>` 블록 작성 시 적용 필수.

### 프로젝트 코딩 규칙
- `CLAUDE.md` §"Conventions" §"macOS 셸 이식성" — `node -e` 패턴이 BSD/GNU 셸 양쪽에서 동작해야 함. `grep -P` 금지, `-E` 사용. STATE.md Phase 파싱 패턴 보존.
- `CLAUDE.md` §"버전 관리" — Phase 30은 마일스톤 일부, 단독 버전 bump 없음. CHANGELOG는 Phase 31 DOC-03에서 일괄 기록.

### 우회 대상 (변경하지 않음)
- `CLAUDE.md` L166, L169 (`python3 hooks/*.py`) — **Phase 31 DOC-01** 책임. Phase 30에서 손대지 않음.
- `CHANGELOG.md` L75 (historical `python3` 언급) — Out of Scope.
- `.planning/research/GEMINI.md`, `.planning/research/ANTIGRAVITY.md` — Out of Scope (REQUIREMENTS.md 명시).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 29 surgical-edit 매핑 테이블** — 29-CONTEXT.md §"Specifics"의 before/after diff 형식이 Phase 30에 직접 재사용 가능. 8 파일 / 13 occurrence를 동일 형식으로 30-PLAN.md에 나열.
- **Phase 28 fixtures** (`.planning/phases/28-core-hook-scripts-node/fixtures/`) — `lessons_ranker.cjs`의 `--top 5` / `--archive` 출력 fixture가 이미 존재. Phase 30의 Tier 3 dry-run에서 동일 fixture를 사용해 caller 측 파이프가 깨지지 않음을 확인 가능.
- **`node -e` stdin event 패턴** — REQUIREMENTS.md PROJECT.md L34에서 명시적으로 `node -e` 채택 옵션 제시 → 표준 패턴.
- **`grep -rn 'python3' ...`** — ROADMAP success criterion #4의 canonical 명령. exit code 1(0 match)이 성공. Phase 29에서 이미 사용·검증.

### Established Patterns
- **CommonJS `__filename` PLUGIN_ROOT fallback (Phase 28)** — 호출자(skill) 측은 환경변수를 set하지 않아도 `.cjs`가 자체적으로 plugin root를 도출함. Skill 측에 `CLAUDE_PLUGIN_ROOT` 관련 코드 추가 불필요.
- **lessons 주입 3-block 패턴** — sg-plan/sg-execute/.agents 사본 3곳에서 동일한 `python3 hooks/lessons_ranker.py --top 5 ... | python3 -c "..."` 파이프. Phase 30은 이 패턴을 4번(.agents까지 포함) 동일 변환한다.
- **swallow-error 파이프 (`2>/dev/null || true`)** — 기존 셸 스니펫이 lessons_ranker 실패 시 silent fallback. `node -e` 변환 시에도 동일한 `2>/dev/null` redirection 보존.
- **gsd-sdk JSON unescape 패턴** — `skills/sg-ui-plan/SKILL.md:32`와 `.agents/skills/sg-plan/SKILL.md:63`가 동일한 `python3 -c 'import json,sys; v=...read().strip(); print(json.loads(v))'` 사용. Phase 30은 동일 변환을 두 곳에 적용.

### Integration Points
- **`hooks/lessons_ranker.cjs` ↔ skill caller** — CLI 계약(`--top N`, `--archive --milestone vX.Y`, glob 인자, JSON-lines stdout). Phase 28 D-11에서 `util.parseArgs`로 동등성 보장. Phase 30은 계약 측 변경 없음(`python3` → `node`만).
- **gsd-sdk → skill caller** — `init.quick`, `roadmap.get-phase` 출력이 stdin으로 흐름. JSON 형식·필드 이름 동일. Phase 30은 파싱 측만 교체.
- **`pyproject.toml` / `setup.py` 감지 → pytest 실행 (sg-ship)** — 사용자 프로젝트에서만 실행되는 분기. super-gsd 자체에는 영향 없으나 사용자 환경에서 D-10 변경 효과 검증 필요.

### 발견한 위험·landmine
- **`node -e` 셸 quoting 위험** — multi-line `node -e '...'`은 single-quote 안에 backtick template literal 사용 시 escape 충돌 가능. Pattern C 검증 시 `${i+1}` 같은 template literal이 셸에 의해 해석되지 않는지 확인 필수 (single-quote 안이면 안전).
- **`node -e` stdin EOF 처리** — `process.stdin.on('end')` 이벤트가 발화되지 않는 환경(특정 셸의 파이프 버그)이 있을 수 있음. 검증 명령에서 `echo`/`printf` 기반 입력이 명확히 EOF를 보낸다.
- **`.agents/skills/sg-plan/SKILL.md` L63과 `skills/sg-ui-plan/SKILL.md` L32 동일 패턴** — 두 곳 모두 `gsd-sdk roadmap.get-phase --pick section`의 JSON-string output을 unescape. 한 곳 수정 후 다른 곳 누락 위험 → PLAN.md에 양쪽 매핑 명시.
- **`sg-quick`의 `d.get('quick_id') or d.get('id', '')`** — Python의 `or` short-circuit. JS 등가물 `j.quick_id || j.id || ""`. `j.quick_id`가 빈 문자열일 때 두 언어 모두 falsy로 처리 → 동등성 OK.
- **`pytest` PATH 부재 시** — D-12에서 명시: fallback 도입하지 않음. 사용자 환경 문제로 처리.
- **JSON-escape verify gate landmine (Phase 29 lesson)** — PLAN.md `<verify><automated>` 블록에서 markdown 셸 코드를 grep할 때, double-quote가 markdown source에서는 `"` 그대로지만 JSON-stored fixture에서는 `\"`로 escape됨. Phase 30 PLAN의 grep 패턴은 **markdown source의 raw 형태**를 기준으로 작성한다.
- **git log -1 HEAD assumption landmine (Phase 29 lesson)** — verify gate가 `git log -1`로 commit subject 검사하면 SUMMARY 또는 HANDOFF docs commit이 추가된 후 false-negative. Phase 30 verify gate는 commit hash 또는 `git rev-list --grep` 사용.

</code_context>

<specifics>
## Specific Ideas

### 정확한 교체 매핑 (PLAN에서 그대로 사용 가능)

**SKILL-01 (`skills/sg-plan/SKILL.md` L20):**
```diff
-     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
+     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
```

**SKILL-01 (`skills/sg-plan/SKILL.md` L21~L30) — Pattern C:**
```diff
-       | python3 -c "
- import sys, json
- lines = [l for l in sys.stdin if l.strip()]
- for i, line in enumerate(lines, 1):
-     try:
-         d = json.loads(line)
-         print(f\"{i}. [score {d['score']:.2f}] {d['pattern']} ({d['source']})\")
-     except Exception:
-         pass
- " || echo "(weighted ranking unavailable)"
+       | node -e '
+ let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
+   const lines=buf.split("\n").filter(l=>l.trim());
+   lines.forEach((line,i)=>{
+     try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}
+   });
+ })' || echo "(weighted ranking unavailable)"
```

**SKILL-01 (`skills/sg-execute/SKILL.md` L21~L29) — Pattern C (source 없음 변형):**
```diff
-       | python3 -c "
- import sys, json
- for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
-     try:
-         d = json.loads(line)
-         print(f\"{i}. [score {d['score']:.2f}] {d['pattern']}\")
-     except Exception:
-         pass
- " || true
+       | node -e '
+ let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
+   const lines=buf.split("\n").filter(l=>l.trim());
+   lines.forEach((line,i)=>{
+     try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
+   });
+ })' || true
```

**SKILL-01 (`skills/sg-complete/SKILL.md` L36):**
```diff
-     python3 hooks/lessons_ranker.py --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
+     node hooks/lessons_ranker.cjs --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
```

**SKILL-02 (`skills/sg-quick/SKILL.md` L62~L63) — Pattern A:**
```diff
-   QUICK_ID=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('quick_id') or d.get('id',''))")
-   TASK_DIR=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('task_dir') or d.get('dir',''))")
+   QUICK_ID=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.quick_id||j.id||"")}catch(e){}})')
+   TASK_DIR=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.task_dir||j.dir||"")}catch(e){}})')
```

**SKILL-02 (`skills/sg-ui-plan/SKILL.md` L32) — Pattern B:**
```diff
-   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | python3 -c 'import json,sys; v=sys.stdin.read().strip(); print(json.loads(v))' 2>/dev/null || echo "$PHASE_SECTION_RAW")
+   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
```

**AGENT-01 (`.agents/skills/sg-plan/SKILL.md` L27, L28, L63):** SKILL-01의 sg-plan 매핑 + Pattern B (`.agents/skills/sg-plan/SKILL.md` L63은 skills/sg-ui-plan L32 매핑과 동일).

**AGENT-01 (`.agents/skills/sg-execute/SKILL.md` L27, L28):** SKILL-01의 sg-execute 매핑 동일.

**AGENT-01 (`.agents/skills/sg-ship/SKILL.md` L106) — D-10 pytest:**
```diff
- elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
-   python3 -m pytest 2>&1 || TEST_FAILED=1
+ elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
+   pytest 2>&1 || TEST_FAILED=1
```

### 검증 명령 (PHASE-VERIFY 단계에서 사용)

```bash
# Tier 1 — static grep
grep -rn 'python3' skills/ .agents/skills/   # must be 0 matches

# Tier 2 — file existence (variants of files touched)
ls skills/sg-{plan,execute,complete,quick,ui-plan}/SKILL.md \
   .agents/skills/sg-{plan,execute,ship}/SKILL.md  # 8 files exist

# Tier 3a — node -e Pattern A dry-run
echo '{"quick_id":"abc","id":"fallback"}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.quick_id||j.id||"")}catch(e){}})'
# expected: abc

# Tier 3b — node -e Pattern B dry-run
printf '"hello world"' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})'
# expected: hello world

# Tier 3c — node -e Pattern C dry-run (with source)
printf '{"score":0.42,"pattern":"P1","source":"f.md"}\n{"score":0.31,"pattern":"P2","source":"g.md"}\n' | node -e 'let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{const lines=buf.split("\n").filter(l=>l.trim());lines.forEach((line,i)=>{try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}});})'
# expected:
# 1. [score 0.42] P1 (f.md)
# 2. [score 0.31] P2 (g.md)

# Tier 3d — lessons_ranker.cjs direct
node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md | head -3
# expected: 3 JSON lines

# Tier 4 — Claude Code manual
# /super-gsd:sg-plan, sg-execute, sg-quick, sg-ui-plan, sg-complete 한 번씩 실행
```

### Plan 권장 구조 (단일 plan)

- **30-01-PLAN.md** — 8 파일 surgical edit. wave: 1. depends_on: none. files_modified: 위 8개 SKILL.md. 4-tier verification gate. Single atomic commit.

</specifics>

<deferred>
## Deferred Ideas

- **공유 helper `.sh` 스크립트** — Pattern A/B/C `node -e` 스니펫이 여러 파일에 반복된다. `hooks/_skill_helpers.sh` 같은 wrapper로 추출하면 DRY해지지만 (a) 의존성 contract가 새 파일 도입으로 깨지고 (b) skill의 YAML/Markdown source가 의존하는 외부 셸 파일이 늘어 가독성 저해. v2.4 이후 리팩토링 phase 후보.
- **`jq` 채택** — D-07에서 `node -e` 선택. 만약 v2.5+에서 모든 사용자 환경에 `jq` 보장한다고 결정되면 (예: `claude-code` 자체가 `jq`를 번들) 더 짧은 호출 형태로 전환 가능.
- **sg-ship pytest fallback (`command -v pytest`)** — D-12에서 미도입. 사용자 보고가 들어오면 추가 검토.
- **PLAN.md verify gate 자동 dry-run (Phase 29 lessons P1)** — gsd-plan-checker 측 개선 사항. Phase 30 외부 작업.
- **STATE.md `Phase:` headline roll-forward 자동화 (Phase 29 lessons P2)** — Phase 30 외부 작업.
- **자동 테스트 프레임워크 (Vitest, node:test)** — 마일스톤 out of scope. v2.5+ 후보.

### Reviewed Todos (not folded)
해당 사항 없음 — todo 매칭 0건.

</deferred>

---

*Phase: 30-skill-agent*
*Context gathered: 2026-05-25*
