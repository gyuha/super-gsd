# Phase 29: Hook 설정 명령 교체 - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Claude Code / Codex CLI / Gemini CLI **3개 플랫폼의 hook 설정 파일**에서 `python3 ... .py` 호출을 `node ... .cjs` 호출로 교체한다. 총 **3개 파일 / 7개 command 문자열** 변경.

**변경 대상:**
- `hooks/hooks.json` — Claude Code (PreToolUse, Stop, SubagentStop — 3 commands)
- `.codex/hooks.json` — Codex CLI (PreToolUse, Stop — 2 commands)
- `.gemini/settings.json` — Gemini CLI (SessionEnd, BeforeTool — 2 commands)

**범위 안:**
- 위 3개 파일의 `command` 필드에서 `python3` → `node`, `.py` → `.cjs` 토큰 두 개만 교체
- 각 플랫폼의 기존 quoting/path expansion 관습(`"${CLAUDE_PLUGIN_ROOT}/..."` vs `hooks/...` vs `$GEMINI_PROJECT_DIR/...`)은 그대로 보존
- timeout 값 보존 (5/10초 또는 5000/10000ms — 단위는 플랫폼별로 다름)
- JSON 구조·키 순서·코멘트 보존 (surgical edit)

**범위 밖 (다음 phase 또는 out of scope):**
- Skill/Agent 내부 `python3` 호출 교체 → **Phase 30** (SKILL-01, SKILL-02, AGENT-01)
- `hooks/*.py` 4개 파일 삭제 + 문서 갱신 → **Phase 31** (CLEAN-01, DOC-01~03)
- `.cjs` 파일 자체 수정 (이미 Phase 28에서 작성·검증 완료, byte-identical parity 확인됨)
- 새 hook 이벤트 추가, timeout 튜닝, 신규 플랫폼 지원 — 마일스톤 out of scope

</domain>

<decisions>
## Implementation Decisions

### 마일스톤 단계에서 잠금된 결정 (Phase 28 CONTEXT.md에서 carry-forward — 재논의 불필요)

- **D-01 (locked, from Phase 28):** `.cjs` 파일명은 Python 원본 미러링 — `stop_hook.cjs`, `rule_runner.cjs`, `lessons_ranker.cjs`, `transcript_matcher.cjs`. Phase 29 command 문자열은 이 정확한 파일명을 사용한다.
- **D-02 (locked, from Phase 28):** PLUGIN_ROOT 해석은 `process.env.CLAUDE_PLUGIN_ROOT` 우선, fallback은 `__filename` 기반. `hooks/hooks.json`의 `"${CLAUDE_PLUGIN_ROOT}/..."` 인용은 그대로 보존한다 (`.cjs`도 동일하게 환경변수 읽음).
- **D-03 (locked, from Phase 28):** `.py` 파일은 Phase 29 동안 **삭제하지 않음**. Phase 31 CLEAN-01에서 일괄 삭제 예정. Phase 29 적용 후에는 `.py`와 `.cjs`가 공존하지만 호출자는 `.cjs`만 가리킨다.
- **D-04 (locked, from Phase 28):** 검증은 manual smoke test로만. 자동 테스트 프레임워크 도입 없음.

### Command 문자열 교체 규칙

- **D-05:** **두 토큰만** 교체한다. `python3` → `node`, `*.py` → `*.cjs`. 그 외 모든 토큰(quoting, 환경변수, path prefix, 인자 순서, timeout 값)은 byte-exact 보존.

  | 파일 | Before | After |
  |---|---|---|
  | `hooks/hooks.json` (×3) | `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/X.py"` | `node "${CLAUDE_PLUGIN_ROOT}/hooks/X.cjs"` |
  | `.codex/hooks.json` (×2) | `python3 hooks/X.py` | `node hooks/X.cjs` |
  | `.gemini/settings.json` (×2) | `python3 $GEMINI_PROJECT_DIR/hooks/X.py` | `node $GEMINI_PROJECT_DIR/hooks/X.cjs` |

- **D-06:** Quoting 관습은 플랫폼별로 차이가 있고 그대로 보존한다. Claude Code는 큰따옴표로 감싸 path에 공백이 들어가도 안전; Codex/Gemini는 인용 없음(상대 경로 또는 변수 전개). Phase 29는 quoting 정책을 변경하지 않는다 — 단일 변수만 변화시킨다는 surgical principle.

### Timeout 정책

- **D-07:** Timeout 값은 **그대로 유지**. Claude Code: 5초(PreToolUse), 10초(Stop), 10초(SubagentStop). Codex: 5초/10초. Gemini: 5000ms/10000ms. 이유:
  - Node.js startup overhead는 Python3와 유사한 ~50ms 범위; 7개 명령 모두 stdin JSON 파싱 + 짧은 동기 작업 → 기존 timeout 안에서 여유 있음.
  - timeout 조정은 별도 결정이며 manual smoke test로 실제 측정 후 retro에서 다루는 게 적절.
  - Phase 28 fixture run에서 모든 `.cjs`가 0.1초 내 응답 확인됨.

### Plan 분할 / Commit 단위

- **D-08:** **PLAN.md 1개**로 3 파일 동시 수정. 이유:
  - 3 파일이 동일한 마이그레이션 step에 속함 (Python→Node 호출자 일괄 reroute).
  - 분할하면 부분 적용 상태(예: Claude만 .cjs, Codex는 .py)가 발생해 사용자 환경에서 일관성이 깨짐.
  - 파일별 의존성 없음; 충돌 없이 동시 편집 가능.
- **D-09:** **단일 atomic commit** — `feat(29): swap python3 → node in hook configs`. Rollback은 git revert 1회로 충분. `.py`가 여전히 존재하므로 hook 실패 시 commit revert 후 즉시 동작 복원 가능.

### Manual 검증 정책

- **D-10:** **3-tier 검증 절차** 정의:
  1. **Static (자동)**: `grep -rn 'python3' hooks/hooks.json .codex/hooks.json .gemini/settings.json` 결과 0건 (ROADMAP Success Criterion #4 매핑).
  2. **Syntax (자동)**: 3개 파일이 valid JSON (`node -e "JSON.parse(require('fs').readFileSync('FILE'))"`).
  3. **Dry-run (자동)**: 각 `.cjs` 명령을 직접 실행해 require/parse 성공 확인 — `echo '{}' | node hooks/stop_hook.cjs`, `echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | node hooks/rule_runner.cjs` 등이 exit 0.
  4. **Manual (사용자 환경 한정)**: Claude Code 세션 재시작 후 Stop/SubagentStop/PreToolUse 이벤트가 실제 트리거되는지 확인. Codex/Gemini는 사용자가 해당 CLI를 가지고 있을 때만 검증; syntax-only로 한정해도 ROADMAP Success Criteria 4건 중 #1, #4를 충족한다.
- **D-11:** Codex/Gemini 환경이 없는 경우 ROADMAP success criteria #2, #3의 "manual" 절은 "syntax + dry-run 통과"로 충족 처리. VERIFY.md에 명시적으로 기록.

### 안전 / Rollback 가드

- **D-12:** Phase 29 commit 이후 Phase 31까지의 기간 동안 `.py`와 `.cjs`가 공존한다. 안전 가드:
  - Phase 29 commit 직전에 `hooks/*.cjs` 4개 파일이 모두 존재하고 실행 가능함을 확인 (`test -f hooks/stop_hook.cjs && test -f hooks/transcript_matcher.cjs && test -f hooks/rule_runner.cjs && test -f hooks/lessons_ranker.cjs`).
  - 만약 어느 `.cjs`가 누락이면 Phase 29 적용 시 hook 실패 → revert + Phase 28 재확인.
  - Phase 31 CLEAN-01은 Phase 30이 끝나고 `grep -rn 'python3' skills/ .agents/skills/` 0건일 때만 진행 (Phase 28 lessons P1 action item과 일치).

### Claude's Discretion

다음 항목은 명시적 사용자 결정이 없어 위 결정을 잠정 채택했다. **plan-phase 또는 execute 단계에서 사용자가 명시적으로 다른 선택을 하면 즉시 교체 가능**:

- **D-07 (timeout 보존)** — manual smoke test에서 hooks가 timeout으로 잘리는 증상이 보고되면 5초 → 10초 일률 상향 검토 가능.
- **D-09 (single commit)** — 사용자가 파일별 git revert 단위를 작게 원하면 3 commits로 분할 가능 (`feat(29-01)`, `feat(29-02)`, `feat(29-03)`). 현재는 atomic을 채택.
- **D-11 (syntax-only fallback)** — 사용자가 실제 Codex/Gemini CLI를 갖고 있다면 그 환경에서 hook 트리거를 시도하고 결과를 VERIFY.md에 기록할 수 있음.

### Folded Todos

해당 사항 없음 — `cross_reference_todos`에서 phase 29 매칭 0건.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase·마일스톤 명세
- `.planning/REQUIREMENTS.md` §"CFG-01", §"CFG-02", §"CFG-03" — Phase 29의 3개 REQ 정의 + Success Criteria.
- `.planning/REQUIREMENTS.md` §"Success Criteria" #1, #6 — `grep -rn 'python3' ...` 0건과 manual hook trigger 검증.
- `.planning/ROADMAP.md` §"Phase 29: Hook 설정 명령 교체" — Goal, Depends on, Requirements, Success Criteria 4건 명시.
- `.planning/PROJECT.md` §"Current Milestone: v2.4 Hooks Node Migration" — 마일스톤 goal, target features.
- `.planning/STATE.md` — 현재 마일스톤 상태(Phase 28 complete; 29/30/31 pending).

### 직접 변경 대상 (3 파일)
- `hooks/hooks.json` — Claude Code hooks 매니페스트. 현재 3개 command가 `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/*.py"` 형태.
- `.codex/hooks.json` — Codex CLI hooks. 현재 2개 command가 `python3 hooks/*.py` 형태.
- `.gemini/settings.json` — Gemini CLI settings. 현재 2개 command가 `python3 $GEMINI_PROJECT_DIR/hooks/*.py` 형태.

### 호출 대상 `.cjs` 파일 (Phase 28 산출물 — 수정 없음, 참조만)
- `hooks/stop_hook.cjs` — Stop/SubagentStop/SessionEnd entry point. PLUGIN_ROOT 환경변수 처리 확인됨 (line 10, 87).
- `hooks/rule_runner.cjs` — PreToolUse/BeforeTool entry point. PLUGIN_ROOT 환경변수 처리 확인됨 (line 17).
- `hooks/transcript_matcher.cjs` — `stop_hook.cjs`에서 require. 직접 호출되지 않음 (config에 등장하지 않음).
- `hooks/lessons_ranker.cjs` — CLI 도구. Hook config에는 등장하지 않음 (Skill 내부 호출 — Phase 30 대상).

### 선행 phase 결정 (carry-forward)
- `.planning/phases/28-core-hook-scripts-node/28-CONTEXT.md` — Phase 28 D-01~D-23 결정 전체. 특히:
  - D-05 (`.cjs` 파일명 미러링)
  - D-20 (PLUGIN_ROOT 처리 우선순위)
  - D-22 (fixture 디렉토리 위치, Phase 29 검증에 재사용 가능)
- `.planning/phases/28-core-hook-scripts-node/28-VERIFY.md` — Python↔Node parity 검증 recipe. Phase 29 dry-run에서도 동일 recipe 적용.
- `.planning/lessons/28-2026-05-25.md` — Phase 28 lessons. **P1 action item: "Phase 29가 Phase 31 .py 삭제 전 hooks.json + skill caller reroute 완료"** — Phase 29의 직접적 acceptance criterion.

### 프로젝트 코딩 규칙
- `CLAUDE.md` §"Conventions" §"버전 관리" — Phase 29는 마일스톤 일부, 단독 버전 bump 없음. CHANGELOG는 Phase 31 DOC-03에서 일괄 기록.
- `CLAUDE.md` §"Conventions" §"macOS 셸 이식성" — `grep -rn` 사용 시 BSD/GNU 호환성 (`grep -P` 금지, `-E` 사용). 본 phase의 verification 셸 명령에 적용.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 28 fixture corpus** — `.planning/phases/28-core-hook-scripts-node/fixtures/`에 stop_hook/rule_runner/lessons_ranker 입출력 fixture가 보관됨. Phase 29의 dry-run smoke test에서 동일 fixture로 `.cjs` 호출 검증 가능 (그 자체를 변경하지는 않음).
- **JSON parse 검증 recipe** — `node -e "JSON.parse(require('fs').readFileSync('FILE'))"`. 3개 config 파일이 valid JSON임을 확인하는 표준 셸 명령. Phase 28 28-VERIFY.md에서 검증된 패턴.
- **`grep -rn 'python3' ...` 검색** — ROADMAP Success Criterion #4의 canonical 명령. exit code 1(0 match)이 성공. BSD/GNU 호환.

### Established Patterns
- **CommonJS `__filename` PLUGIN_ROOT fallback** — Phase 28에서 채택. 환경변수 없을 때 자동으로 hooks/ 부모 디렉토리 도출. `.codex`, `.gemini` 환경처럼 `CLAUDE_PLUGIN_ROOT`가 set되지 않는 환경에서도 동작 (이미 Phase 28에서 검증).
- **하나의 hook 스크립트가 다중 이벤트 처리** — `stop_hook.cjs`가 Stop, SubagentStop, (Gemini) SessionEnd 모두 처리하고; `rule_runner.cjs`가 PreToolUse와 BeforeTool 모두 처리. Phase 28 코드가 이미 이를 인식하므로 Phase 29는 config 측에서 다른 이벤트명 → 같은 스크립트 매핑만 유지하면 됨.
- **3-platform 동시 지원 패턴 (v1.3 Phase 15에서 정립)** — 3 config 파일이 각자 다른 schema(키 이름, timeout 단위, path prefix)를 갖지만 동일한 underlying hook script를 호출. Phase 29는 이 패턴을 보존한 채 script만 교체.

### Integration Points
- **`hooks/hooks.json` → Claude Code plugin loader** — `${CLAUDE_PLUGIN_ROOT}` 변수가 plugin install 위치로 expansion. plugin.json의 `"hooks": "./hooks/hooks.json"` 참조.
- **`.codex/hooks.json` → Codex CLI** — relative path `hooks/...`이 Codex 실행 시 project root 기준. 사용자가 project root에서 Codex 실행해야 정상.
- **`.gemini/settings.json` → Gemini CLI** — `$GEMINI_PROJECT_DIR` 환경변수가 Gemini가 set. SessionEnd/BeforeTool은 Gemini 고유 이벤트명.
- **호출자 변경 없음** — plugin.json, AGENTS.md, README 등에서 `hooks/hooks.json` 경로 참조는 변경 없음 (파일 내용만 수정).

### 발견한 위험·landmine
- **Node startup timeout 위험 (D-07 미해결 시)** — Node.js 첫 require가 cold disk에서는 100~200ms까지 늘 수 있음. PreToolUse hook의 5초 timeout 안에서 여유 있지만 사용자가 매우 느린 디스크 환경(NFS, 암호화 볼륨)에서 사용 시 risk. manual smoke test에서 확인.
- **Codex/Gemini 환경에서 manual 검증 불가** — 사용자가 두 CLI를 갖고 있을 가능성이 낮음. ROADMAP은 (manual)로 명시했지만 실제 검증 비용이 비대칭적. D-11에서 syntax-only fallback 채택.
- **`.cjs` 파일 누락 시 silent failure** — Phase 29 commit 후 어느 `.cjs`가 누락이면 hook이 "command not found"로 실패하지만 Claude Code는 이를 silent하게 처리할 가능성. D-12 pre-commit guard로 방지.
- **JSON 코멘트 잠재 충돌** — `.codex/hooks.json`과 `.gemini/settings.json`이 `_note` / `_schema_note` 키로 코멘트를 emulate. JSON strict parser는 이를 허용하지만 일부 도구가 reject할 가능성. 기존 동작 유지가 안전 (보존).
- **단위 차이 (초 vs ms)** — Claude/Codex는 timeout이 초 단위, Gemini는 ms 단위. 사용자가 보고 헷갈릴 수 있으나 기존 값을 그대로 유지하므로 Phase 29에서는 noise가 아님.

</code_context>

<specifics>
## Specific Ideas

### 정확한 교체 매핑 (PLAN에서 그대로 사용 가능)

**`hooks/hooks.json`:**
```diff
-"command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.py\""
+"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.cjs\""

-"command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\""    (Stop)
+"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.cjs\""

-"command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\""    (SubagentStop)
+"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.cjs\""
```

**`.codex/hooks.json`:**
```diff
-"command": "python3 hooks/rule_runner.py"
+"command": "node hooks/rule_runner.cjs"

-"command": "python3 hooks/stop_hook.py"
+"command": "node hooks/stop_hook.cjs"
```

**`.gemini/settings.json`:**
```diff
-"command": "python3 $GEMINI_PROJECT_DIR/hooks/stop_hook.py"
+"command": "node $GEMINI_PROJECT_DIR/hooks/stop_hook.cjs"

-"command": "python3 $GEMINI_PROJECT_DIR/hooks/rule_runner.py"
+"command": "node $GEMINI_PROJECT_DIR/hooks/rule_runner.cjs"
```

### 검증 명령 (PHASE-VERIFY 단계에서 사용)

```bash
# Tier 1 — static grep (must be 0)
grep -rn 'python3' hooks/hooks.json .codex/hooks.json .gemini/settings.json

# Tier 2 — JSON syntax
for f in hooks/hooks.json .codex/hooks.json .gemini/settings.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf-8'))" && echo "$f: valid JSON"
done

# Tier 3 — dry-run hook scripts
echo '{}' | node hooks/stop_hook.cjs    # exit 0, valid JSON stdout
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | node hooks/rule_runner.cjs   # exit 0

# Tier 4 — Claude Code manual (this session)
# 다음 Stop/SubagentStop/PreToolUse 트리거 시 systemMessage 출력 확인
```

### Plan 권장 구조 (단일 plan)

- **29-01-PLAN.md** — 3 파일 동시 surgical edit + 4-tier verification + atomic commit. files_modified: `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`. depends_on: none (Phase 28 complete은 이미 git에 land). wave: 1 (single).

</specifics>

<deferred>
## Deferred Ideas

- **Timeout 튜닝** — Phase 29 manual smoke test에서 hook timeout이 부족하다는 증거가 보고되면 후속 hotfix phase에서 조정. 현재는 기존 값 보존.
- **JSON schema 표준화** — 3개 config가 각자 다른 schema(키 순서, 코멘트 키 이름). 통합 schema 도입은 v2.5+ 후보 (지금 도입 시 surgical principle 위배).
- **Manual rollback runbook 문서화** — `.py` 공존 기간 동안 hook 실패 시 어떻게 revert하는지의 절차서. 현재 `git revert <commit>` 한 줄로 충분하므로 별도 문서 불필요. 만약 Phase 30/31에서 더 복잡한 rollback 시나리오가 등장하면 그때 작성.
- **Codex/Gemini 환경에서 실제 hook 트리거 테스트** — 사용자가 두 CLI 환경을 갖춘다면 후속 spike에서 진행. v2.4 마일스톤에서는 D-11 syntax-only fallback 채택.
- **공유 `node` shebang shell wrapper** — `#!/usr/bin/env node` 추가하면 chmod +x 후 직접 실행 가능. Phase 28에서는 도입하지 않았고 Phase 29 범위 밖. v2.5+ 후보.

### Reviewed Todos (not folded)
해당 사항 없음 — todo 매칭 0건.

</deferred>

---

*Phase: 29-hook*
*Context gathered: 2026-05-25*
