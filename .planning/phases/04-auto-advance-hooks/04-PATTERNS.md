# Phase 4: Auto-Advance Hooks - 패턴 맵

**작성일:** 2026-05-16
**분석 대상 파일:** 5개 (신규 생성 파일 기준)
**아날로그 발견:** 5 / 5

---

## 파일 분류

| 신규/수정 파일 | 역할 | 데이터 흐름 | 가장 가까운 아날로그 | 매칭 품질 |
|---|---|---|---|---|
| `hooks/stop-hook.py` | hook / detector | event-driven | `~/.claude/plugins/cache/claude-plugins-official/hookify/unknown/hooks/stop.py` | exact |
| `hooks/hooks.json` | config | request-response | `~/.claude/plugins/marketplaces/anthropics-claude-plugins-official/plugins/ralph-loop/hooks/hooks.json` | exact |
| `hooks/transcript-matcher.py` | utility | transform | `~/.claude/plugins/cache/claude-plugins-official/hookify/unknown/core/rule_engine.py` | role-match |
| `.planning/config.json` | config | — | `.planning/config.json` (기존 파일 수정) | exact (patch) |
| `commands/sg-advance.md` | command | request-response | `commands/sg-learn.md` | role-match |

---

## 패턴 할당

### `hooks/hooks.json` (config, event-driven)

**아날로그:** `~/.claude/plugins/cache/claude-plugins-official/ralph-loop/1.0.0/hooks/hooks.json`

Phase 4가 등록해야 할 훅 이벤트는 `Stop`과 `SubagentStop` 두 가지다. ralph-loop의 `hooks.json`은 `Stop` 훅 단독 등록의 최소 구조를 보여준다.

**Stop 단독 훅 구조** (ralph-loop/hooks/hooks.json 전체):
```json
{
  "description": "Ralph Loop plugin stop hook for self-referential loops",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.sh\""
          }
        ]
      }
    ]
  }
}
```

**복수 이벤트 + matcher 구조** (ouroboros/hooks/hooks.json 전체):
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/session-start.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/drift-monitor.py\"",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

**Phase 4용 hooks.json 목표 구조:**
```json
{
  "description": "super-gsd auto-advance hooks — GSD plan-phase 완료 및 Superpowers review 완료를 감지해 다음 단계를 안내한다",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.py\"",
            "timeout": 10
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.py\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**핵심 규칙:**
- `${CLAUDE_PLUGIN_ROOT}` 환경변수로 플러그인 루트를 참조한다 — 절대경로 하드코딩 금지
- `timeout` 필드는 선택적이지만 훅이 행 걸릴 경우를 방지하기 위해 10초 이하 설정 권장
- `matcher` 없이 등록하면 해당 이벤트의 모든 발화에 훅이 실행된다 — transcript 기반 필터링은 스크립트 내부에서 수행

---

### `hooks/stop-hook.py` (hook, event-driven)

**아날로그:** `~/.claude/plugins/cache/claude-plugins-official/hookify/unknown/hooks/stop.py`

hookify의 stop.py는 Claude Code Stop 훅의 표준 입출력 계약을 보여준다. stdin에서 JSON을 읽고, stdout에 JSON을 출력하고, 항상 exit 0으로 종료한다.

**Stop 훅 입출력 계약** (hookify/hooks/stop.py, lines 26-51):
```python
def main():
    """Main entry point for Stop hook."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)

        # Load stop rules
        rules = load_rules(event='stop')

        # Evaluate rules
        engine = RuleEngine()
        result = engine.evaluate_rules(rules, input_data)

        # Always output JSON (even if empty)
        print(json.dumps(result), file=sys.stdout)

    except Exception as e:
        # On any error, allow the operation
        error_output = {
            "systemMessage": f"Hookify error: {str(e)}"
        }
        print(json.dumps(error_output), file=sys.stdout)

    finally:
        # ALWAYS exit 0
        sys.exit(0)
```

**Stop 훅 응답 스키마** (hookify/core/rule_engine.py, lines 66-84):
```python
# 안내 메시지만 출력 (진행 허용)
return {
    "systemMessage": "\n\n".join(messages)
}

# 차단 (다음 프롬프트로 재주입)
return {
    "decision": "block",
    "reason": combined_message,
    "systemMessage": combined_message
}
```

**Phase 4 stop-hook.py 골격:**
```python
#!/usr/bin/env python3
"""super-gsd Stop/SubagentStop hook.

GSD plan-phase 완료 또는 Superpowers code-reviewer 완료를 감지해
다음 단계 안내 메시지를 systemMessage로 출력한다.
"""

import json
import os
import sys


def load_config():
    """Return super_gsd config dict from .planning/config.json, or {}."""
    try:
        with open('.planning/config.json', 'r') as f:
            cfg = json.load(f)
        return cfg.get('super_gsd', {})
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return {}


def main():
    try:
        input_data = json.load(sys.stdin)

        # HOOK-03: config guard
        cfg = load_config()
        if not cfg.get('auto_advance', True):
            print(json.dumps({}), file=sys.stdout)
            sys.exit(0)

        # HOOK-04: transcript-based matcher
        transcript_path = input_data.get('transcript_path', '')
        signal = detect_signal(transcript_path)

        if signal == 'gsd-plan-complete':
            msg = "GSD plan-phase 완료 감지 — /super-gsd:sg-execute 를 실행해 Superpowers에 인계하세요."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        elif signal == 'superpowers-review-complete':
            msg = "Superpowers code-reviewer 완료 감지 — /super-gsd:sg-learn 을 실행해 Hookify 회고를 시작하세요."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        else:
            print(json.dumps({}), file=sys.stdout)

    except Exception as e:
        print(json.dumps({"systemMessage": f"super-gsd hook error: {e}"}), file=sys.stdout)
    finally:
        sys.exit(0)
```

**절대 원칙:**
- `finally: sys.exit(0)` — 어떤 예외에도 exit 0 보장
- 훅 오류가 Claude Code 동작을 차단해선 안 된다
- `systemMessage`만 사용 — `decision: block`은 ralph-loop처럼 반복 루프를 의도할 때만

---

### `hooks/transcript-matcher.py` (utility, transform)

**아날로그:** `~/.claude/plugins/cache/claude-plugins-official/hookify/unknown/core/rule_engine.py` + `ralph-loop/hooks/stop-hook.sh`

transcript 파일 경로는 Stop 훅 입력 JSON의 `transcript_path` 필드로 전달된다. ralph-loop의 stop-hook.sh에서 실제 파싱 방법을 확인할 수 있다.

**transcript_path 접근 패턴** (ralph-loop/stop-hook.sh, lines 68-113):
```bash
# Hook input JSON에서 transcript_path 추출
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

# JSONL 파일에서 마지막 assistant 메시지 추출
LAST_LINES=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -n 100)

LAST_OUTPUT=$(echo "$LAST_LINES" | jq -rs '
  map(.message.content[]? | select(.type == "text") | .text) | last // ""
')
```

**Python 버전 (hookify/core/rule_engine.py, lines 207-226):**
```python
elif field == 'transcript':
    # Read transcript file if path provided
    transcript_path = input_data.get('transcript_path')
    if transcript_path:
        try:
            with open(transcript_path, 'r') as f:
                return f.read()
        except FileNotFoundError:
            return ''
        except (IOError, OSError) as e:
            return ''
```

**Phase 4 detect_signal() 구현 패턴:**
```python
def detect_signal(transcript_path: str) -> str:
    """transcript에서 단계 완료 신호를 감지한다.

    Returns: 'gsd-plan-complete' | 'superpowers-review-complete' | ''
    """
    if not transcript_path:
        return ''
    try:
        with open(transcript_path, 'r') as f:
            content = f.read()
    except (FileNotFoundError, IOError, PermissionError, UnicodeDecodeError):
        return ''

    # GSD plan-phase 완료 신호 패턴 (HOOK-01, HOOK-04)
    GSD_PLAN_SIGNALS = [
        'gsd-plan-phase',
        'plan-phase complete',
        'PLAN.md',
    ]
    # Superpowers review 완료 신호 패턴 (HOOK-02, HOOK-04)
    REVIEW_SIGNALS = [
        'code-reviewer',
        'requesting-code-review',
        'review complete',
    ]

    # 마지막 200줄만 검사 (성능)
    recent = '\n'.join(content.splitlines()[-200:])

    if any(sig in recent for sig in GSD_PLAN_SIGNALS):
        return 'gsd-plan-complete'
    if any(sig in recent for sig in REVIEW_SIGNALS):
        return 'superpowers-review-complete'
    return ''
```

**spurious firing 방지 원칙 (HOOK-04):**
- 트랜스크립트 전체가 아닌 최근 200줄만 검사
- 신호 문자열은 최대한 구체적으로 — 일반 단어 사용 금지
- 복수 신호가 동시에 존재하면 마지막으로 발생한 것을 우선 (순서 보장)

---

### `.planning/config.json` (config, patch)

**아날로그:** `.planning/config.json` (기존 파일 직접 수정)

현재 `config.json`에는 GSD 자체 워크플로우 설정(`workflow.auto_advance` 등)이 존재한다. Phase 4는 `super_gsd` 최상위 키를 **추가**한다 — 기존 키를 건드리지 않는다.

**기존 config.json 구조 (관련 부분):**
```json
{
  "workflow": {
    "auto_advance": true,
    "_auto_chain_active": false
  },
  "hooks": {
    "context_warnings": true
  }
}
```

**추가할 super_gsd 블록 (HOOK-03):**
```json
{
  "super_gsd": {
    "auto_advance": true
  }
}
```

**적용 규칙:**
- 키 이름은 `super_gsd` — GSD 자체 `workflow.auto_advance`와 네임스페이스 충돌 없음
- 기본값은 `true` — 설치 후 별도 설정 없이 동작
- 사용자가 `false`로 설정하면 stop-hook.py가 무조건 `{}` 반환
- `jq` 패치로 추가: `jq '. + {"super_gsd": {"auto_advance": true}}' config.json`

---

### `commands/sg-advance.md` (command, request-response) — 선택적

**아날로그:** `commands/sg-learn.md`

Phase 4의 핵심은 훅이 자동으로 동작하는 것이지만, 훅이 비활성화됐을 때 수동으로 같은 동작을 할 수 있는 경량 명령어가 필요할 수 있다. sg-learn.md는 단순 Skill 위임 패턴의 최소 예시다.

**sg-learn.md 구조 전체** (commands/sg-learn.md):
```markdown
---
name: sg-learn
description: Run a Hookify retrospective to extract patterns and generate hooks from this session.
---

<objective>
Invoke the hookify:hookify Skill to run a retrospective and extract learnable patterns from the current session.
</objective>

<execution_context>
Self-contained. Delegates entirely to hookify:hookify Skill.
</execution_context>

<process>
1. Invoke Skill: `Skill(skill="hookify:hookify", args="$ARGUMENTS")`
2. Print: `Retrospective complete. Run /super-gsd:sg-ship when ready to close the milestone.`
</process>

<success_criteria>
1. hookify:hookify Skill is invoked exactly once.
</success_criteria>
```

**sg-plan.md 2단계 체이닝 패턴** (commands/sg-plan.md, lines 26-32):
```markdown
2. Print: `[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...`
   Then invoke Skill: `Skill(skill="gsd-discuss-phase", args="$PHASE_NUM")`

3. Print: `[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...`
   Then invoke Skill: `Skill(skill="gsd-plan-phase", args="$PHASE_NUM")`

4. Print: `Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers.`
```

---

## 공유 패턴

### Config Guard 패턴 (HOOK-03)

**출처:** `.planning/config.json` `super_gsd.auto_advance` 키
**적용 대상:** `hooks/stop-hook.py`

```python
def load_config():
    try:
        with open('.planning/config.json', 'r') as f:
            cfg = json.load(f)
        return cfg.get('super_gsd', {})
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return {}  # 파일 없으면 기본값(활성) 적용

# 훅 진입 직후 체크
cfg = load_config()
if not cfg.get('auto_advance', True):
    print(json.dumps({}), file=sys.stdout)
    sys.exit(0)
```

### Stop 훅 표준 종료 패턴

**출처:** `hookify/hooks/stop.py`
**적용 대상:** `hooks/stop-hook.py` 모든 코드 경로

```python
try:
    # ... 실제 로직
    print(json.dumps(result), file=sys.stdout)
except Exception as e:
    print(json.dumps({"systemMessage": f"error: {e}"}), file=sys.stdout)
finally:
    sys.exit(0)  # 모든 경로에서 exit 0
```

### systemMessage 출력 패턴

**출처:** `hookify/core/rule_engine.py` lines 86-93
**적용 대상:** `hooks/stop-hook.py`

```python
# 안내만 출력 (진행 허용) — Phase 4의 표준 출력
return {"systemMessage": "안내 메시지"}

# 빈 딕셔너리 — 아무 신호도 없을 때
return {}
```

### 명령어 frontmatter 패턴

**출처:** `commands/sg-learn.md`, `commands/sg-review.md`
**적용 대상:** 새 명령어 파일이 필요할 경우

```markdown
---
name: sg-{name}
description: {동작을 한 문장으로}
argument-hint: "[optional-arg] - 설명"   # 인자가 있을 때만
---

<objective>…</objective>
<execution_context>…</execution_context>
<process>…</process>
<success_criteria>…</success_criteria>
```

### 체이닝 완료 메시지 패턴

**출처:** `commands/sg-plan.md` line 33, `commands/sg-review.md` line 16
**적용 대상:** 새 명령어의 마지막 Print 단계

```markdown
# sg-plan 패턴
Print: `Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers.`

# sg-review 패턴
Print: `Code review initiated. Run /super-gsd:sg-learn after the review completes.`
```

---

## 아날로그 없는 파일

해당 없음. Phase 4의 모든 파일은 기존 아날로그를 충분히 확보했다.

---

## 신규 파일 구조

Phase 4가 생성해야 할 파일 목록:

```
hooks/
  hooks.json           # Stop + SubagentStop 훅 등록 (ralph-loop 패턴)
  stop-hook.py         # 공통 진입점 (hookify/stop.py 패턴)
  transcript-matcher.py  # 신호 감지 유틸리티 (rule_engine.py 패턴)
.planning/
  config.json          # super_gsd.auto_advance 키 추가 (patch)
```

선택적:
```
commands/
  sg-advance.md        # 수동 실행 대안 (sg-learn.md 패턴) — 훅이 비활성화됐을 때
```

---

## 메타데이터

**아날로그 탐색 범위:**
- `/Users/gyuha/workspace/super-gsd/commands/` — 8개 명령어 파일
- `/Users/gyuha/.claude/plugins/cache/claude-plugins-official/hookify/unknown/` — hookify 훅 시스템
- `/Users/gyuha/.claude/plugins/cache/claude-plugins-official/ralph-loop/1.0.0/` — Stop 훅 bash 예시
- `/Users/gyuha/.claude/plugins/marketplaces/ouroboros/` — 복수 이벤트 hooks.json 예시
- `/Users/gyuha/.claude/settings.json` — 전역 훅 등록 구조 참조
- `/Users/gyuha/workspace/super-gsd/.planning/config.json` — 수정 대상 파일

**스캔 파일 수:** 약 25개
**패턴 추출일:** 2026-05-16
