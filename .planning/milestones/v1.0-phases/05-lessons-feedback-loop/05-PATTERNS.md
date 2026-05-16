# Phase 5: Lessons Feedback Loop - 패턴 맵

**작성일:** 2026-05-16
**분석 대상 파일:** 4개 (신규 생성 파일 기준)
**아날로그 발견:** 4 / 4

---

## 파일 분류

| 신규/수정 파일 | 역할 | 데이터 흐름 | 가장 가까운 아날로그 | 매칭 품질 |
|---|---|---|---|---|
| `commands/sg-lessons.md` | command | request-response | `commands/sg-status.md` | role-match |
| `hooks/stop_hook.py` | hook / detector | event-driven | `hooks/stop_hook.py` (기존 파일 수정) | exact (patch) |
| `hooks/transcript_matcher.py` | utility | transform | `hooks/transcript_matcher.py` (기존 파일 수정) | exact (patch) |
| `.planning/lessons/{phase}-{date}.md` | artifact | file-I/O | `.planning/HANDOFF.md` | structural-match |

---

## 패턴 할당

### `commands/sg-lessons.md` (command, request-response)

**아날로그:** `commands/sg-status.md`

sg-status.md는 Phase 5 sg-lessons.md가 따라야 할 핵심 패턴 두 가지를 보여준다.
1. `.planning/` 디렉토리를 읽어 사용자에게 컨텍스트를 제공한다.
2. 외부 Skill을 호출하지 않고 파일 읽기 + 출력만 수행하는 자기 완결형 명령이다.

**frontmatter 패턴** (`commands/sg-status.md` lines 1-4):
```markdown
---
name: sg-status
description: Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command.
---
```

**Phase 해석 패턴** (`commands/sg-status.md` lines 15-19):
```bash
PHASE_NUM=$(grep -E '^Phase: [0-9]' .planning/STATE.md | head -1 | awk '{print $2}')
PHASE_NAME=$(grep -E "^### Phase ${PHASE_NUM}:" .planning/ROADMAP.md | head -1 | sed -E 's/^### Phase [^:]+: //' | sed -E 's/[[:space:]]*$//')
```

**파일 없을 때 graceful fallback 패턴** (`commands/sg-status.md` lines 22-29):
```bash
LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | tail -1)
if [ -z "$LAST_ROW" ]; then
  STAGE="init"
  TS=""
fi
```

**sg-lessons.md가 구현해야 할 구조:**
```markdown
---
name: sg-lessons
description: List prior lessons from .planning/lessons/ and inject them as context for the next GSD phase.
argument-hint: "[phase] - optional. If provided, show only lessons for that phase."
---

<objective>
Read all Markdown files under .planning/lessons/, format them as a context block, and print to the user so they can be referenced before running /super-gsd:sg-plan.
</objective>

<execution_context>
Self-contained. Reads .planning/lessons/ directory. Writes nothing.
</execution_context>

<process>
1. **Glob 패턴으로 lessons 파일 목록 수집.**
   ```bash
   FILES=$(ls .planning/lessons/*.md 2>/dev/null | sort)
   ```
   파일이 없으면: `No lessons recorded yet. Run /super-gsd:sg-learn after a review to capture lessons.` 출력 후 종료.

2. **ARGUMENTS로 phase 필터 적용.** $ARGUMENTS가 비어 있지 않으면 해당 phase 번호로 시작하는 파일만 필터링:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PADDED=$(printf "%02d" "$ARGUMENTS" 2>/dev/null || echo "$ARGUMENTS")
     FILES=$(echo "$FILES" | grep "/${PADDED}-" 2>/dev/null)
   fi
   ```

3. **각 파일 내용 출력.** 파일명을 헤더로, 내용을 본문으로 출력.

4. **컨텍스트 안내 메시지 출력:**
   `Lessons loaded. Copy the above into your next /super-gsd:sg-plan session or run that command now — lessons are auto-injected when sg-plan detects .planning/lessons/ content.`
</process>
```

---

### `hooks/stop_hook.py` 수정 (hook, event-driven)

**아날로그:** `hooks/stop_hook.py` (기존 파일 — Phase 4가 작성)

Phase 5는 Hookify 완료 신호를 감지한 직후 lessons 파일을 자동 저장하는 후처리 단계를 추가해야 한다. stop_hook.py의 기존 구조에 세 번째 신호 분기(`hookify-complete`)를 추가하는 방식으로 확장한다.

**기존 신호 분기 패턴** (`hooks/stop_hook.py` lines 45-51):
```python
if signal == 'gsd-plan-complete':
    msg = "GSD plan-phase complete. Run /super-gsd:sg-execute to hand off to Superpowers."
    print(json.dumps({"systemMessage": msg}), file=sys.stdout)
elif signal == 'superpowers-review-complete':
    msg = "Superpowers review complete. Run /super-gsd:sg-learn to capture lessons with Hookify."
    print(json.dumps({"systemMessage": msg}), file=sys.stdout)
else:
    print(json.dumps({}), file=sys.stdout)
```

**추가할 hookify-complete 분기 패턴:**
```python
elif signal == 'hookify-complete':
    # lessons 저장 후처리를 Python에서 직접 수행
    lesson_file = save_hookify_lessons(transcript_path)
    if lesson_file:
        msg = (
            f"Hookify complete. Lessons saved to {lesson_file}. "
            "Run /super-gsd:sg-plan to start the next phase — prior lessons will be included as context."
        )
    else:
        msg = "Hookify complete. Run /super-gsd:sg-plan to start the next phase."
    print(json.dumps({"systemMessage": msg}), file=sys.stdout)
```

**save_hookify_lessons() 구현 패턴 (신규 함수):**
```python
import datetime
import re

def save_hookify_lessons(transcript_path: str) -> str:
    """Hookify transcript에서 lessons를 추출해 .planning/lessons/{phase}-{date}.md에 저장.

    Returns: 저장된 파일 경로, 또는 실패 시 빈 문자열.
    """
    try:
        # phase 번호 추출 — STATE.md에서 읽기
        phase = _read_current_phase()

        # transcript에서 hookify 출력 섹션 추출
        lessons_content = _extract_hookify_output(transcript_path)
        if not lessons_content:
            return ''

        # 파일명 결정: {padded-phase}-{YYYY-MM-DD}.md
        today = datetime.date.today().strftime('%Y-%m-%d')
        padded = f"{int(phase):02d}" if phase.isdigit() else phase
        filename = f"{padded}-{today}.md"
        filepath = os.path.join('.planning', 'lessons', filename)

        # 디렉토리 보장
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # 이미 존재하면 덮어쓰지 않고 -2, -3 suffix 추가 (idempotency)
        if os.path.exists(filepath):
            return filepath  # 같은 날 같은 phase → 이미 저장됨

        with open(filepath, 'w') as f:
            f.write(f"# Lessons: Phase {phase} ({today})\n\n")
            f.write(lessons_content)

        return filepath
    except Exception:
        return ''


def _read_current_phase() -> str:
    """STATE.md에서 현재 phase 번호를 반환. 실패 시 'unknown'."""
    try:
        with open('.planning/STATE.md', 'r') as f:
            for line in f:
                m = re.match(r'^Phase:\s*(\S+)', line)
                if m:
                    return m.group(1)
    except Exception:
        pass
    return 'unknown'


def _extract_hookify_output(transcript_path: str) -> str:
    """transcript의 마지막 200줄에서 hookify 출력 블록을 추출."""
    try:
        with open(transcript_path, 'r') as f:
            lines = f.read().splitlines()
        recent = lines[-200:]
        # hookify 출력은 '## ' 또는 '# ' 헤딩이 있는 마크다운 블록으로 시작
        # 가장 단순한 추출: 마지막 hookify 섹션 이후 텍스트 전체
        text = '\n'.join(recent)
        # hookify 완료 마커 이후 내용 추출
        for marker in ['## Lessons', '## Patterns', '## Hooks Generated', 'hookify complete']:
            idx = text.rfind(marker)
            if idx != -1:
                return text[idx:]
        return text  # 마커 없으면 전체 최근 내용
    except Exception:
        return ''
```

**절대 원칙 (Phase 4로부터 상속):**
- `finally: sys.exit(0)` — 모든 경로에서 exit 0 보장
- lessons 저장 실패가 Claude Code 동작을 차단해선 안 됨
- 파일 저장 실패 시 메시지에서만 차이 — 훅 자체는 계속 진행

---

### `hooks/transcript_matcher.py` 수정 (utility, transform)

**아날로그:** `hooks/transcript_matcher.py` (기존 파일 — Phase 4가 작성)

Phase 5는 세 번째 신호 `hookify-complete`를 추가한다. 기존 패턴을 그대로 따른다.

**기존 신호 감지 구조** (`hooks/transcript_matcher.py` lines 24-43):
```python
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

# 마지막 200줄만 검사 (spurious firing 방지, HOOK-04)
recent = '\n'.join(content.splitlines()[-200:])

if any(sig in recent for sig in GSD_PLAN_SIGNALS):
    return 'gsd-plan-complete'
if any(sig in recent for sig in REVIEW_SIGNALS):
    return 'superpowers-review-complete'
return ''
```

**추가할 hookify-complete 신호 패턴:**
```python
# Hookify 완료 신호 패턴 (LESS-01)
HOOKIFY_SIGNALS = [
    'hookify',
    'Retrospective complete',
    'hooks generated',
    'patterns extracted',
]

# 순서: GSD → Review → Hookify (우선순위 내림차순)
if any(sig in recent for sig in GSD_PLAN_SIGNALS):
    return 'gsd-plan-complete'
if any(sig in recent for sig in REVIEW_SIGNALS):
    return 'superpowers-review-complete'
if any(sig in recent for sig in HOOKIFY_SIGNALS):
    return 'hookify-complete'
return ''
```

**반환 타입 확장:**
```python
def detect_signal(transcript_path: str) -> str:
    """transcript에서 단계 완료 신호를 감지한다.

    Returns: 'gsd-plan-complete' | 'superpowers-review-complete' | 'hookify-complete' | ''
    """
```

---

### `.planning/lessons/{phase}-{date}.md` (artifact, file-I/O)

**아날로그:** `.planning/HANDOFF.md`

HANDOFF.md는 `.planning/` 디렉토리의 파일 명명/구조 컨벤션을 보여주는 가장 직접적인 예시다.

**HANDOFF.md 파일 명명 컨벤션** (`.planning/HANDOFF.md` lines 1-6):
```markdown
<!-- Append-only handoff log. Schema locked by ... -->

# 핸드오프 로그

이 파일은 ...
```

**lessons 파일 구조 템플릿:**
```markdown
# Lessons: Phase {N} ({YYYY-MM-DD})

<!-- 자동 생성 — sg-learn + hookify 완료 후 stop_hook.py가 작성. 직접 수정 가능. -->

## 추출된 패턴

{hookify가 출력한 패턴/학습 내용}

## 적용 제안

{다음 phase에서 적용할 액션 아이템}
```

**파일 명명 규칙:**
```
.planning/lessons/{padded-phase}-{YYYY-MM-DD}.md
예시: .planning/lessons/05-2026-05-16.md
     .planning/lessons/06-2026-05-17.md
```

**규칙:**
- Phase 번호는 두 자리 zero-padding (`printf "%02d"`)
- 날짜는 ISO 8601 (`YYYY-MM-DD`)
- 같은 날, 같은 phase에 두 번 실행해도 덮어쓰지 않음 (첫 파일 유지)
- `.planning/lessons/` 디렉토리는 파일 저장 시 `os.makedirs(..., exist_ok=True)`로 자동 생성

---

## 공유 패턴

### Config Guard 패턴 (Phase 4로부터 상속)

**출처:** `hooks/stop_hook.py` lines 21-28 + `.planning/config.json`
**적용 대상:** `hooks/stop_hook.py` (수정 후에도 동일하게 적용)

```python
def load_config():
    """Return super_gsd config dict from .planning/config.json, or {}."""
    try:
        with open('.planning/config.json', 'r') as f:
            cfg = json.load(f)
        return cfg.get('super_gsd', {})
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return {}

# 훅 진입 직후 체크
cfg = load_config()
if not cfg.get('auto_advance', True):
    print(json.dumps({}), file=sys.stdout)
    sys.exit(0)
```

Phase 5에서 `lessons_capture` 비활성화를 별도로 제어하려면 `super_gsd.lessons_capture` 키를 추가할 수 있다. 단, MVP에서는 `auto_advance`와 동일하게 처리해도 충분하다.

---

### Stop 훅 표준 종료 패턴 (Phase 4로부터 상속)

**출처:** `hooks/stop_hook.py` lines 31-57
**적용 대상:** `hooks/stop_hook.py` hookify-complete 분기 포함 전체

```python
def main():
    try:
        input_data = json.load(sys.stdin)
        # ... 로직
        print(json.dumps(result), file=sys.stdout)
    except Exception as e:
        print(json.dumps({"systemMessage": f"super-gsd hook error: {e}"}), file=sys.stdout)
    finally:
        sys.exit(0)  # 모든 경로에서 exit 0
```

---

### 명령어 frontmatter 패턴

**출처:** `commands/sg-learn.md` lines 1-4, `commands/sg-status.md` lines 1-4
**적용 대상:** `commands/sg-lessons.md`

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

---

### STATE.md Phase 해석 패턴

**출처:** `commands/sg-plan.md` lines 17-23, `commands/sg-execute.md` lines 16-24
**적용 대상:** `commands/sg-lessons.md` 및 `hooks/stop_hook.py`의 `_read_current_phase()`

```bash
if [ -n "$ARGUMENTS" ]; then
  PHASE_NUM="$ARGUMENTS"
else
  PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
fi
```

Python 버전 (`_read_current_phase()` 함수에서):
```python
import re
with open('.planning/STATE.md', 'r') as f:
    for line in f:
        m = re.match(r'^Phase:\s*(\S+)', line)
        if m:
            return m.group(1)
```

---

### 체이닝 완료 메시지 패턴

**출처:** `commands/sg-plan.md` line 33, `commands/sg-review.md` line 16
**적용 대상:** `commands/sg-lessons.md` 마지막 Print 단계

```markdown
# sg-plan 패턴
Print: `Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers.`

# sg-review 패턴
Print: `Code review initiated. Run /super-gsd:sg-learn after the review completes.`

# sg-lessons 목표 패턴
Print: `Lessons loaded. Run /super-gsd:sg-plan to start the next phase.`
```

---

### .planning/ 파일 네이밍 컨벤션

**출처:** `.planning/HANDOFF.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`
**적용 대상:** `.planning/lessons/{phase}-{date}.md` 신규 파일

| 파일 | 패턴 | 예시 |
|------|------|------|
| 핸드오프 로그 | `HANDOFF.md` (단일 파일, append-only) | `.planning/HANDOFF.md` |
| 상태 추적 | `STATE.md` (단일 파일) | `.planning/STATE.md` |
| Phase 계획 | `{NN}-{slug}/{NN}-{kind}.md` | `.planning/phases/05-lessons-feedback-loop/05-01-PLAN.md` |
| **Lessons (신규)** | `lessons/{NN}-{YYYY-MM-DD}.md` | `.planning/lessons/05-2026-05-16.md` |

---

## sg-plan과 lessons 컨텍스트 통합 (LESS-02)

`sg-plan.md`는 현재 `gsd-discuss-phase` → `gsd-plan-phase`를 순서대로 호출한다. LESS-02를 구현하는 가장 비침투적인 방법은 두 가지다.

### 옵션 A: sg-lessons를 sg-plan 앞에 인쇄 (채택 권장)

sg-plan.md의 Step 1 전에 lessons 파일 내용을 출력하고, 사용자가 참고할 수 있게 한다. 별도 Skill 호출 없이 bash 파일 읽기로 처리 가능.

**sg-plan.md 수정 패턴 (Step 0 추가):**
```markdown
0. **Prior lessons 주입.** .planning/lessons/ 아래 파일이 있으면 내용을 먼저 출력한다:
   ```bash
   if ls .planning/lessons/*.md 2>/dev/null | head -1 | grep -q .; then
     echo "=== Prior Lessons (auto-injected) ==="
     cat .planning/lessons/*.md
     echo "=== End of Prior Lessons ==="
   fi
   ```
   파일이 없으면 이 단계를 조용히 건너뜀.
```

**기존 sg-plan.md 구조** (`commands/sg-plan.md` lines 16-33):
```markdown
<process>
1. Resolve phase.
2. Print: `[sg-plan] Step 1/2: ...` → Skill(skill="gsd-discuss-phase", ...)
3. Print: `[sg-plan] Step 2/2: ...` → Skill(skill="gsd-plan-phase", ...)
4. Print: `Plan complete. Run /super-gsd:sg-execute to hand off to Superpowers.`
</process>
```

### 옵션 B: 독립 sg-lessons 명령으로 분리

사용자가 sg-plan 전에 수동으로 `/super-gsd:sg-lessons`를 실행해 컨텍스트를 확인. sg-plan은 변경하지 않음.

**결정 기준:**

- LESS-02 요건 "자동 포함"을 만족하려면 옵션 A 필요.
- 비침투적 원칙(기존 파일 수정 최소화)을 엄격히 따르면 옵션 B가 더 안전.
- MVP는 옵션 A (sg-plan 수정 + 0번 단계 추가)를 채택한다 — LESS-02의 "자동 포함" 요건을 직접 만족하는 유일한 방법이기 때문.

---

## 아날로그 없는 파일

해당 없음. Phase 5의 모든 파일은 기존 아날로그를 충분히 확보했다.

---

## 메타데이터

**아날로그 탐색 범위:**
- `/Users/gyuha/workspace/super-gsd/commands/` — 8개 명령어 파일
- `/Users/gyuha/workspace/super-gsd/hooks/` — Phase 4가 작성한 훅 파일 3개
- `/Users/gyuha/workspace/super-gsd/.planning/` — HANDOFF.md, STATE.md, config.json
- `/Users/gyuha/workspace/super-gsd/.planning/phases/04-auto-advance-hooks/04-PATTERNS.md` — Phase 4 패턴 참조

**스캔 파일 수:** 약 18개
**패턴 추출일:** 2026-05-16
