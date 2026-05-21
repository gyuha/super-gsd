# Phase 15: 플랫폼별 훅 설정 + Python 픽스 — Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Codex와 Antigravity/Gemini CLI 환경에서 Stop 훅과 PreToolUse/BeforeTool 훅이 동작하도록 플랫폼별 훅 설정 파일을 신규 생성하고, Python 훅이 `CLAUDE_PLUGIN_ROOT` 없이도 실행되도록 경로 폴백을 수정한다.

이 phase의 책임:
- `.codex/hooks.json` — Codex 전용 훅 설정 (Stop + PreToolUse, SubagentStop 제외)
- `.gemini/settings.json` — Antigravity/Gemini CLI 전용 훅 설정 (SessionEnd + BeforeTool)
- `hooks/stop_hook.py` — `CLAUDE_PLUGIN_ROOT` 폴백 1줄 추가
- `hooks/rule_runner.py` — `CLAUDE_PLUGIN_ROOT` 폴백 1줄 추가 + `BeforeTool` 이벤트 이름 정규화

Phase 14 범위: AGENTS.md 재작성 + `.agents/skills/` 6개 스킬 생성.
Phase 16 범위: README Multi-Platform 섹션.

</domain>

<decisions>
## Implementation Decisions

### A. 훅 경로: 동적 루트 탐지 방법

**결정: `__file__` 기반 동적 탐지를 Python 훅에 적용. hooks.json은 상대경로 사용.**

두 가지 옵션을 검토했다:

| 옵션 | 방법 | 채택 |
|------|------|------|
| A-1: 환경변수 우선 + `__file__` 폴백 | `CLAUDE_PLUGIN_ROOT or dirname(dirname(abspath(__file__)))` | ✓ |
| A-2: hooks.json 상대경로 | `hooks/stop_hook.py` (Codex PWD=프로젝트 루트 보장) | ✓ (Codex 전용) |

#### Python 훅 (stop_hook.py, rule_runner.py)

`stop_hook.py`는 이미 `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` 패턴을 사용하고 있다. 문제는 `load_config()`와 `_read_current_phase()` 내부에서 `.planning/config.json`, `.planning/STATE.md` 등을 **상대경로**로 열고 있다는 것이다. Codex/Antigravity 환경에서는 `cwd`가 훅 스크립트 위치가 아닐 수 있다.

**수정 방법** — 두 파일 상단에 PLUGIN_ROOT 계산 1줄 추가:

```python
# 기존 (Claude Code 전용)
# CLAUDE_PLUGIN_ROOT 환경변수에만 의존 → 타 플랫폼에서 None

# 신규 (플랫폼 무관)
PLUGIN_ROOT = (
    os.environ.get("CLAUDE_PLUGIN_ROOT")
    or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
```

이후 `.planning/config.json` 등 상대경로를 `os.path.join(PLUGIN_ROOT, ".planning/config.json")`으로 교체한다.

**이유:**
- `__file__`은 Python 인터프리터가 실행하는 스크립트 경로이므로, cwd와 무관하게 항상 정확한 플러그인 루트를 계산할 수 있다.
- `CLAUDE_PLUGIN_ROOT`가 있으면 기존 Claude Code 동작을 유지한다 (non-invasive).
- Codex는 PWD=프로젝트 루트로 실행되므로 hooks.json에서 상대경로 `hooks/stop_hook.py`가 동작한다. Python 내부 경로는 별도로 `PLUGIN_ROOT`로 보정한다.

#### .codex/hooks.json — 상대경로 사용

Codex는 PWD=프로젝트 루트를 보장하므로 `command` 필드에 `hooks/stop_hook.py` 형태의 상대경로를 사용한다.

```json
{
  "hooks": {
    "PreToolUse": [{ "hooks": [{ "type": "command", "command": "python3 hooks/rule_runner.py", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "python3 hooks/stop_hook.py", "timeout": 10 }] }]
  }
}
```

절대경로(`${CLAUDE_PLUGIN_ROOT}/...`)를 사용하면 Codex 환경에서 환경변수가 없을 때 실패하므로 상대경로가 안전하다.

#### .gemini/settings.json — GEMINI_PROJECT_DIR 사용

Antigravity/Gemini CLI는 `$GEMINI_PROJECT_DIR` 환경변수를 주입한다. 이것을 command에 사용한다.

```json
{
  "hooks": {
    "SessionEnd": [{ "hooks": [{ "name": "stop-hook", "type": "command", "command": "python3 $GEMINI_PROJECT_DIR/hooks/stop_hook.py", "timeout": 10000 }] }],
    "BeforeTool": [{ "hooks": [{ "name": "rule-runner", "type": "command", "command": "python3 $GEMINI_PROJECT_DIR/hooks/rule_runner.py", "timeout": 5000 }] }]
  }
}
```

---

### B. BeforeTool 이벤트 이름 정규화 (rule_runner.py)

**결정: `hook_event_name` 필드로 플랫폼을 감지해 `BeforeTool`과 `PreToolUse` 모두 처리.**

현재 `rule_runner.py`의 두 가지 플랫폼 관련 문제:

1. **이벤트 라우팅**: 현재 `main()`은 `tool_name`으로 `bash`/`file` 이벤트를 구분하는데, 이 로직은 그대로 유지된다. `BeforeTool` 이벤트를 받았을 때도 `tool_name` 필드가 동일하게 존재하므로 기존 필터링 로직은 수정 없이 작동한다.

2. **출력 스키마**: 현재 block 응답이 `hookSpecificOutput.hookEventName: "PreToolUse"`를 하드코딩한다. Antigravity CLI의 `BeforeTool` 이벤트에서 이 값이 검증되면 오동작할 수 있다.

**수정 방법**:

```python
# stdin에서 이벤트 이름을 읽어 응답 스키마를 결정
event_name = input_data.get("hook_event_name") or input_data.get("hookEventName", "PreToolUse")
is_before_tool = event_name in ("BeforeTool", "PreToolUse")
```

block 응답 생성 시:

```python
# 플랫폼에 따라 hookEventName 정규화
resolved_event = "PreToolUse" if event_name == "PreToolUse" else "BeforeTool"
return {
    "hookSpecificOutput": {
        "hookEventName": resolved_event,
        "permissionDecision": "deny",
    },
    "systemMessage": msg,
}
```

**이유:**
- `tool_name` 필드는 두 플랫폼 모두 동일한 이름을 사용하므로 기존 필터링 로직 변경 불필요.
- Antigravity CLI의 `hookSpecificOutput.permissionDecision: "deny"` verbose 형태는 이미 현재 출력과 호환된다.
- `hookEventName` 필드가 Antigravity에서 검증되는지 여부가 불확실하므로, 수신한 이벤트 이름으로 응답하는 것이 가장 안전하다.
- 수정은 `_evaluate()` 함수 내 block 응답 생성 1곳에만 적용한다 (surgical change).

**stdin 필드 이름 차이**: Antigravity/Gemini CLI는 `hook_event_name` (snake_case), Claude Code는 `hookEventName` (camelCase)을 사용할 수 있다. 두 키 모두 시도하는 방어 코드를 추가한다.

---

### C. .gemini/settings.json 스키마 불확실성 처리

**결정: best-effort 구현 + 주석으로 불확실성 명시 + VERIFICATION.md에 human-verify 항목 기록.**

**현재 알려진 정보 (신뢰도 MEDIUM):**

| 항목 | 값 | 근거 |
|------|-----|------|
| 파일 경로 | `.gemini/settings.json` | Gemini CLI 공식 문서. Antigravity 경로 변경 미확인. |
| 훅 이벤트: Stop 대응 | `SessionEnd` | Gemini CLI 문서 확인 |
| 훅 이벤트: PreToolUse 대응 | `BeforeTool` | Gemini CLI 문서 확인 |
| 환경변수 | `$GEMINI_PROJECT_DIR` | Gemini CLI 문서 확인 |
| timeout 단위 | 밀리초 (ms) | Gemini CLI 문서 확인 (Claude Code의 seconds와 다름!) |
| block 응답 필드 | `decision: "deny"` 또는 `hookSpecificOutput.permissionDecision: "deny"` | Gemini CLI 문서 — 두 형태 모두 문서화됨 |
| SubagentStop 대응 | 없음 (AfterAgent가 최근접이나 의미가 다름) | 포함하지 않음 |

**구현 방침:**

1. 알려진 정보로 `.gemini/settings.json`을 작성한다. 불확실한 항목은 JSON 주석 불가 이슈 우회를 위해 `_comment` 키로 명시한다.

2. 공식 문서에서 확인되지 않은 사항은 `VERIFICATION.md`에 human-verify 항목으로 기록한다.

**`VERIFICATION.md`에 기록할 항목:**

| 항목 | 불확실 이유 | 검증 방법 |
|------|-----------|---------|
| `.gemini/settings.json` 경로가 Antigravity에서도 동일한지 | antigravity.google/docs 미확인 | `agy` CLI로 직접 테스트 |
| `hookEventName: "BeforeTool"` 필드가 응답에서 검증되는지 | 문서에서 validation 여부 미명시 | block 훅 등록 후 응답 검사 |
| timeout 단위 (ms vs seconds) | Gemini CLI는 ms, 확인 필요 | CLI 타임아웃 로그 관찰 |
| `$GEMINI_PROJECT_DIR` 환경변수가 Antigravity에서도 주입되는지 | 마이그레이션 가이드 묵시적 언급만 | `printenv`를 SessionStart 훅으로 실행 |

**파일에서 불확실성 표현 방법:**

```json
{
  "_schema_note": "Based on Gemini CLI docs (geminicli.com/docs/hooks/reference/). Antigravity CLI compatibility not confirmed via official antigravity.google/docs — see .planning/phases/15-platform-hooks-python-fix/VERIFICATION.md",
  "hooks": {
    "SessionEnd": [...],
    "BeforeTool": [...]
  }
}
```

`_comment` / `_schema_note` 키는 JSON에서 무해하다(CLI가 알 수 없는 키를 무시하는 경우에 한함). Antigravity CLI가 이를 거부한다면 키 제거로 해결 가능하다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요구사항 정의
- `.planning/REQUIREMENTS.md` — CODEX-04, MULTI-01 요건 전체 (MUST read)
- `.planning/ROADMAP.md` — Phase 15 Goal, Success Criteria

### 연구 자료
- `.planning/research/GEMINI.md` — Gemini CLI / Antigravity CLI 훅 이벤트, settings.json 스키마, 불확실성 목록 (MUST read)
- `.planning/research/ANTIGRAVITY.md` — Antigravity CLI 훅 스키마, stop_hook.py / rule_runner.py 호환성 분석 (MUST read)

### 수정 대상 파일
- `hooks/stop_hook.py` — CLAUDE_PLUGIN_ROOT 폴백 추가 대상. `load_config()`와 `_read_current_phase()` 내 상대경로 교체 필요.
- `hooks/rule_runner.py` — CLAUDE_PLUGIN_ROOT 폴백 + BeforeTool 이벤트 정규화 대상. `_evaluate()` 함수 block 응답 부분만 수정.
- `hooks/hooks.json` — 참조용 (Claude Code 전용, 수정 대상 아님)

### 신규 생성 파일
- `.codex/hooks.json` — 신규. Codex 전용 훅 설정. Claude Code hooks.json 구조 참조.
- `.gemini/settings.json` — 신규. Antigravity/Gemini CLI 전용 훅 설정.
- `.planning/phases/15-platform-hooks-python-fix/VERIFICATION.md` — 신규. human-verify 항목 기록.

</canonical_refs>

<code_context>
## Existing Code Insights

### stop_hook.py 현재 상태

`sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` 패턴은 이미 사용 중이다.
`CLAUDE_PLUGIN_ROOT` 환경변수는 현재 코드 어디에도 사용되지 않는다.
상대경로로 열리는 파일: `.planning/config.json`, `.planning/STATE.md`, `.planning/lessons/`, `.planning/HANDOFF.md`.
이 경로들을 `os.path.join(PLUGIN_ROOT, ...)` 형태로 교체해야 한다.

### rule_runner.py 현재 상태

`_evaluate()` 내 block 응답:
```python
return {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",   # ← 하드코딩. 수정 필요.
        "permissionDecision": "deny",
    },
    "systemMessage": msg,
}
```

`_load_rules()` 내 glob 경로:
```python
_load_glob(os.path.join(".claude", "hookify.*.local.md"), priority=1)
_load_glob(os.path.join(".claude", "sg-rule.*.local.md"), priority=2)
```
이 경로도 `os.path.join(PLUGIN_ROOT, ".claude", ...)` 형태로 교체해야 한다.

### hooks/hooks.json 구조 참조

```json
{
  "hooks": {
    "PreToolUse": [{ "hooks": [{ "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.py\"", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\"", "timeout": 10 }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\"", "timeout": 10 }] }]
  }
}
```

`.codex/hooks.json`은 이 구조를 기반으로 하되:
- `SubagentStop` 제외 (Codex 미지원)
- 경로를 상대경로로 변경 (`hooks/stop_hook.py`)
- timeout은 seconds 단위 유지 (Claude Code 동일)

`.gemini/settings.json`은:
- `SessionEnd` + `BeforeTool` 이벤트 사용
- timeout은 ms 단위 (Gemini CLI 스펙)
- `$GEMINI_PROJECT_DIR` 환경변수 사용

### 변경 크기 예측

| 파일 | 변경 크기 |
|------|---------|
| `hooks/stop_hook.py` | ~5줄 (PLUGIN_ROOT 정의 + 상대경로 4~5곳 교체) |
| `hooks/rule_runner.py` | ~6줄 (PLUGIN_ROOT + glob 경로 2곳 + hookEventName 정규화) |
| `.codex/hooks.json` | 신규 ~20줄 |
| `.gemini/settings.json` | 신규 ~25줄 |
| `VERIFICATION.md` | 신규 ~30줄 |

</code_context>

<specifics>
## Specific Implementation Notes

### PLUGIN_ROOT 계산 위치

`stop_hook.py`와 `rule_runner.py` 각각의 **모듈 최상단**(import 블록 직후, 함수 정의 전)에 삽입한다:

```python
# Platform-agnostic plugin root detection
PLUGIN_ROOT = (
    os.environ.get("CLAUDE_PLUGIN_ROOT")
    or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
```

`hooks/` 디렉토리 기준으로 `dirname(dirname(...))` = 플러그인 루트.

### BeforeTool 정규화 위치

`rule_runner.py`의 `main()` 함수 내, `input_data = json.load(sys.stdin)` 직후:

```python
# 이벤트 이름 정규화 (Claude Code: hookEventName, Antigravity: hook_event_name)
event_name = (
    input_data.get("hook_event_name")
    or input_data.get("hookEventName")
    or "PreToolUse"
)
```

이후 `event_name`을 `_evaluate()` 호출에 전달한다.

### .gemini/settings.json 주석 처리

JSON은 주석을 지원하지 않으므로 `_schema_note` 키를 최상위에 추가한다. 만약 Antigravity CLI가 알 수 없는 키를 거부하면 이 키를 제거한다 (VERIFICATION.md에 확인 항목으로 기재).

### timeout 단위

- Claude Code (`hooks/hooks.json`, `.codex/hooks.json`): **seconds** (`"timeout": 5`)
- Gemini CLI / Antigravity (`.gemini/settings.json`): **milliseconds** (`"timeout": 5000`)

혼동 방지를 위해 각 파일에 주석 키로 명시한다.

</specifics>

<deferred>
## Deferred Ideas

- `AfterAgent` 이벤트를 SubagentStop 대응으로 추가 — AfterAgent 의미가 다르고 REQUIREMENTS.md Out of Scope에 명시됨. v1.4+ 고려.
- Antigravity 공식 문서 확정 후 `.gemini/settings.json` 스키마 재검증 — Phase 15 이후 VERIFICATION.md에 follow-up 기재.
- `.gemini/settings.json` 경로가 Antigravity에서 `.antigravity/settings.json`으로 변경됐을 경우 대응 — VERIFICATION.md human-verify 항목.
- `_hookify_installed()` 검사를 Antigravity 환경에서도 동작하게 수정 — 현재 `~/.claude/plugins/cache/` 경로만 검사. Phase 15 스코프 밖.

</deferred>

---

*Phase: 15-platform-hooks-python-fix*
*Context gathered: 2026-05-21*
