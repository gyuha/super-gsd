---
phase: quick-260518-wvx
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/sg-execute.md
  - commands/sg-status.md
  - commands/sg-review.md
  - commands/sg-learn.md
  - hooks/hooks.json
  - hooks/transcript_matcher.py
  - commands/sg-lessons.md
  - .claude-plugin/plugin.json
  - docs/COMMANDS.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "sg-execute가 HANDOFF.md 없이도 정상 실행된다"
    - "sg-status가 superpowers → review → hookify 순서로 올바르게 라우팅한다"
    - "sg-review와 sg-learn이 HANDOFF.md에 단계 행을 기록한다"
    - "SubagentStop 훅이 hooks.json에 등록되어 sg-health PASS를 반환한다"
    - "transcript_matcher.py가 엄격한 완료 마커로 false positive를 줄인다"
    - "sg-lessons가 'phase-03' 형식 인자를 올바르게 처리한다"
    - "sg-health가 plugin.json commands 배열에 등록된다"
    - "docs/COMMANDS.md가 현행 명령 목록 및 워크플로우와 일치한다"
  artifacts:
    - path: "commands/sg-execute.md"
      provides: "HANDOFF.md idempotent 생성 로직"
    - path: "commands/sg-status.md"
      provides: "5-state 라우팅: superpowers → review, review → hookify"
    - path: "commands/sg-review.md"
      provides: "HANDOFF.md review 행 기록"
    - path: "commands/sg-learn.md"
      provides: "HANDOFF.md hookify 행 기록"
    - path: "hooks/hooks.json"
      provides: "Stop + SubagentStop 양쪽 훅 등록"
    - path: "hooks/transcript_matcher.py"
      provides: "엄격한 완료 마커 패턴"
    - path: ".claude-plugin/plugin.json"
      provides: "sg-health 명령 등록"
    - path: "docs/COMMANDS.md"
      provides: "최신 명령 참조 문서"
  key_links:
    - from: "commands/sg-execute.md"
      to: ".planning/HANDOFF.md"
      via: "idempotent 생성 + 행 append"
    - from: "commands/sg-status.md"
      to: "HANDOFF.md last row To 컬럼"
      via: "5-state enum 라우팅"
    - from: "hooks/hooks.json"
      to: "hooks/stop_hook.py"
      via: "Stop + SubagentStop 양쪽 등록"
---

<objective>
코드 리뷰에서 발견된 P1/P2/Extra 지적사항 8건을 수정한다.

Purpose: 상태 머신 버그(누락된 review 단계), HANDOFF.md 초기화 누락, SubagentStop 미등록, 과도한 transcript 시그널 등 실사용 시 실패를 유발하는 결함을 제거한다.
Output: 수정된 commands 5개, hooks 2개, plugin.json 1개, docs 1개.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/quick/260518-wvx-code-review-fixes/260518-wvx-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: [P1] sg-execute HANDOFF.md 자동 생성 + sg-status 상태 머신 수정 + sg-review/sg-learn HANDOFF.md 기록</name>
  <files>
    commands/sg-execute.md
    commands/sg-status.md
    commands/sg-review.md
    commands/sg-learn.md
  </files>
  <action>
아래 네 파일을 순서대로 수정한다.

**1. commands/sg-execute.md — Step 8 앞에 HANDOFF.md idempotent 생성 삽입 (line 89-93 대체)**

Step 7(idempotency check) 직전, 즉 Step 6(Plan Hash 계산) 직후에 다음 블록을 추가한다. 기존 Step 8의 "Validate the header row exists" 검사(line 91-94)는 제거하고, 아래 블록으로 대체한다:

```
7.5. **HANDOFF.md 자동 초기화.** 파일이 없거나 헤더 행이 없으면 파일을 생성한다:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```
```

Step 8의 헤더 검증 실패 시 `exit 1` 분기는 삭제한다(위 초기화 블록이 그 역할을 대체함).

**2. commands/sg-status.md — Step 5 라우팅 테이블 수정 (line 84-86)**

`superpowers` 케이스를 `sg-review`로, `review` 케이스를 `sg-learn`으로 수정한다:

```bash
superpowers) NEXT_CMD="/super-gsd:sg-review" ;;
review)      NEXT_CMD="/super-gsd:sg-learn" ;;
```

기존 코드에서 두 케이스 모두 `sg-learn`을 가리키던 것을 위와 같이 분리한다. 나머지 케이스(init, gsd-plan, hookify)는 변경하지 않는다.

**3. commands/sg-review.md — Step 4 Skill 호출 전 HANDOFF.md 행 기록 삽입**

Step 3(plan/requirements 읽기) 직후, Step 4(Skill 호출) 직전에 다음 스텝을 추가한다:

```
3.5. **HANDOFF.md에 review 행 기록.** sg-execute와 동일한 idempotent 초기화 후 행 append:
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_SLUG=""
   if [ -n "$PHASE_PAD" ]; then
     PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   fi
   [ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
   echo "| $TS | $PHASE_SLUG | superpowers | review | - |" >> "$HANDOFF_FILE"
   ```
```

**4. commands/sg-learn.md — Step 1 앞에 HANDOFF.md 행 기록 삽입**

Skill 호출 전에 다음 스텝을 추가한다:

```
0.5. **HANDOFF.md에 hookify 행 기록.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md 2>/dev/null | head -1 | awk '{print $2}')
   PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
   PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
   [ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
   echo "| $TS | $PHASE_SLUG | review | hookify | - |" >> "$HANDOFF_FILE"
   ```
```
  </action>
  <verify>
    <automated>
# sg-execute: HANDOFF.md 없는 상태에서 헤더 삽입 로직 확인
grep -n "자동 초기화\|HANDOFF_FILE\|printf.*Timestamp" commands/sg-execute.md | head -10
# sg-status: superpowers → sg-review, review → sg-learn 라우팅 확인
grep -A1 "superpowers)" commands/sg-status.md | grep -q "sg-review" && echo "OK: superpowers->sg-review" || echo "FAIL"
grep -A1 "^    review)" commands/sg-status.md | grep -q "sg-learn" && echo "OK: review->sg-learn" || echo "FAIL"
# sg-review: review 행 기록 확인
grep -q "review.*HANDOFF\|HANDOFF.*review" commands/sg-review.md && echo "OK: sg-review records HANDOFF" || echo "FAIL"
# sg-learn: hookify 행 기록 확인
grep -q "hookify.*HANDOFF\|HANDOFF.*hookify" commands/sg-learn.md && echo "OK: sg-learn records HANDOFF" || echo "FAIL"
    </automated>
  </verify>
  <done>
- sg-execute Step 7.5에 HANDOFF.md 자동 생성 블록 존재, 기존 헤더 검증 exit 1 제거됨
- sg-status: superpowers 케이스 → sg-review, review 케이스 → sg-learn으로 분리됨
- sg-review Step 3.5에 review 행 append 블록 존재
- sg-learn Step 0.5에 hookify 행 append 블록 존재
  </done>
</task>

<task type="auto">
  <name>Task 2: [P1] SubagentStop 훅 등록 + [P2] transcript_matcher.py 엄격한 마커 + [P2] sg-lessons phase 인자 정규화</name>
  <files>
    hooks/hooks.json
    hooks/transcript_matcher.py
    commands/sg-lessons.md
  </files>
  <action>
아래 세 파일을 수정한다.

**1. hooks/hooks.json — SubagentStop 추가**

현재 `"Stop"` 키만 있는 `"hooks"` 객체에 `"SubagentStop"` 키를 추가한다. Stop과 동일한 command/timeout 설정을 사용한다:

```json
{
  "description": "super-gsd auto-advance hooks — GSD plan-phase 완료 및 Superpowers review 완료를 감지해 다음 단계를 안내한다",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\"",
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
            "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**2. hooks/transcript_matcher.py — 엄격한 완료 마커로 교체**

line 24-49의 시그널 패턴을 아래와 같이 교체한다. `PLAN.md` 단독 언급, `requesting-code-review` 스킬 이름 단독 언급처럼 광범위한 패턴을 제거하고 실제 완료 출력 마커로 교체한다:

```python
# GSD plan-phase 완료 신호 패턴 (HOOK-01, HOOK-04)
# 광범위한 'PLAN.md' 단독 매칭 제거 — gsd-plan-phase 완료 출력 마커만 허용
GSD_PLAN_SIGNALS = [
    'PLANNING COMPLETE',
    'Plans Created',
    '/gsd:execute-phase',
]
# Superpowers review 완료 신호 패턴 (HOOK-02, HOOK-04)
# 'requesting-code-review' 스킬명·'code-reviewer' 단독 매칭 제거
REVIEW_SIGNALS = [
    'review complete',
    'Code Review Complete',
    'Review Summary',
]
# Hookify 완료 신호 패턴 (LESS-01) — 기존 유지
HOOKIFY_SIGNALS = [
    'Retrospective complete',
    'hooks generated',
    'patterns extracted',
]
```

**3. commands/sg-lessons.md — phase 인자 정규화 (line 27-29)**

ARGUMENTS에서 `phase-03` 형식의 접두어를 제거한 뒤 숫자만 추출해 printf로 패딩한다. 기존 단순 `printf "%02d" "$ARGUMENTS"` 라인을 아래로 교체한다:

```bash
if [ -n "$ARGUMENTS" ]; then
  # 'phase-03', '03', '3' 등 다양한 형식을 숫자로 정규화
  ARG_NUM=$(echo "$ARGUMENTS" | grep -oE '[0-9]+' | head -1)
  if [ -z "$ARG_NUM" ]; then
    echo "Invalid phase argument: '$ARGUMENTS'. Use a number (e.g. 3 or 03 or phase-03)."
    exit 1
  fi
  PADDED=$(printf "%02d" "$ARG_NUM")
  FILES=$(echo "$FILES" | grep "/${PADDED}-")
  if [ -z "$FILES" ]; then
    echo "No lessons found for phase $ARGUMENTS."
    exit 0
  fi
fi
```
  </action>
  <verify>
    <automated>
# hooks.json: SubagentStop 존재 확인
grep -q "SubagentStop" hooks/hooks.json && echo "OK: SubagentStop registered" || echo "FAIL"
# transcript_matcher.py: 광범위 패턴 제거 확인
grep -q "'PLAN.md'" hooks/transcript_matcher.py && echo "FAIL: PLAN.md still present" || echo "OK: PLAN.md removed"
grep -q "'requesting-code-review'" hooks/transcript_matcher.py && echo "FAIL: requesting-code-review still present" || echo "OK: removed"
grep -q "'PLANNING COMPLETE'" hooks/transcript_matcher.py && echo "OK: strict marker present" || echo "FAIL"
# sg-lessons: phase-03 정규화 확인
grep -q "grep -oE '\[0-9\]+'" commands/sg-lessons.md && echo "OK: numeric extraction present" || echo "FAIL"
    </automated>
  </verify>
  <done>
- hooks/hooks.json에 SubagentStop 키 존재, Stop과 동일한 stop_hook.py 참조
- transcript_matcher.py GSD_PLAN_SIGNALS에 'PLAN.md' 없음, 'PLANNING COMPLETE' 있음
- transcript_matcher.py REVIEW_SIGNALS에 'requesting-code-review' 없음, 'Review Summary' 있음
- sg-lessons ARGUMENTS 처리 블록이 grep -oE '[0-9]+' 로 숫자 추출
  </done>
</task>

<task type="auto">
  <name>Task 3: [Extra] plugin.json에 sg-health 추가 + docs/COMMANDS.md 최신화</name>
  <files>
    .claude-plugin/plugin.json
    docs/COMMANDS.md
  </files>
  <action>
아래 두 파일을 수정한다.

**1. .claude-plugin/plugin.json — sg-health 추가**

`"commands"` 배열의 마지막 항목(`"./commands/sg-new.md"`) 뒤에 `"./commands/sg-health.md"`를 추가한다. 배열 순서: sg-start, sg-explore, sg-plan, sg-execute, sg-review, sg-learn, sg-ship, sg-status, sg-lessons, sg-update, sg-quick, sg-complete, sg-new, **sg-health**.

**2. docs/COMMANDS.md — 현행 명령 목록과 워크플로우 반영**

다음 항목을 수정한다:

a. **워크플로우 다이어그램** — `sg-execute → sg-review → sg-learn → sg-ship` 순서로 review 단계 명시. 현재 `(Superpowers)` 레이블이 sg-execute만 커버하는 것을 `sg-review`까지 확장:

```
sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
  (GSD)       (GSD)      (GSD)    (Superpowers) (Superpowers) (Hookify)  (GSD)
```

(이미 올바른 형태이면 변경 불필요)

b. **Quick Reference 테이블** — `sg-health`, `sg-update`, `sg-quick`, `sg-complete`, `sg-new` 행이 누락되어 있으면 추가한다. 현재 테이블에 있는 10개 명령에 sg-health를 추가:

| Command | Maps to | Args | Description |
에 다음 행 추가:
```
| `/super-gsd:sg-health` | reads plugin manifest + hooks.json | (none) | 설치 상태 및 의존성 검증 |
```

c. **sg-health 섹션** — 문서 하단 sg-complete/sg-new 이후에 sg-health 섹션 추가:

```markdown
## sg-health

**Slash command:** `/super-gsd:sg-health`

**Maps to:** plugin manifest + hooks.json 검증 (no Skill)

**Arguments:** (none)

**What it does:** super-gsd 설치 상태를 검증한다. plugin.json commands 배열의 모든 파일 존재 여부, hooks.json의 Stop/SubagentStop 등록 여부, GSD/Superpowers/Hookify 의존성을 확인하고 PASS/FAIL 리포트를 출력한다.

**Example:**
```
/super-gsd:sg-health
```
```
  </action>
  <verify>
    <automated>
# plugin.json: sg-health 등록 확인
grep -q "sg-health" .claude-plugin/plugin.json && echo "OK: sg-health in plugin.json" || echo "FAIL"
# docs/COMMANDS.md: sg-health 섹션 확인
grep -q "sg-health" docs/COMMANDS.md && echo "OK: sg-health in COMMANDS.md" || echo "FAIL"
# docs/COMMANDS.md: review 단계 언급 확인
grep -q "sg-review" docs/COMMANDS.md && echo "OK: sg-review documented" || echo "FAIL"
    </automated>
  </verify>
  <done>
- .claude-plugin/plugin.json commands 배열에 "./commands/sg-health.md" 존재
- docs/COMMANDS.md Quick Reference 테이블에 sg-health 행 존재
- docs/COMMANDS.md에 ## sg-health 섹션 존재
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| HANDOFF.md 쓰기 | Claude가 로컬 파일에 행을 append — 악의적 Phase 슬러그가 markdown 구조를 깨뜨릴 수 있음 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-wvx-01 | Tampering | HANDOFF.md append | accept | Phase 슬러그는 ls 출력에서 파생 — 공격자 통제 불가인 로컬 파일명 |
| T-wvx-02 | Spoofing | transcript_matcher.py | mitigate | 엄격한 완료 마커(PLANNING COMPLETE 등)로 false positive 감소 |
</threat_model>

<verification>
1. `grep -q "SubagentStop" hooks/hooks.json` → exit 0
2. sg-status superpowers 케이스가 sg-review를 가리킴
3. sg-status review 케이스가 sg-learn을 가리킴
4. sg-execute에 HANDOFF.md 헤더 자동 생성 블록 존재
5. transcript_matcher.py에 'PLAN.md' 단독 패턴 없음
6. sg-lessons에 grep -oE '[0-9]+' 정규화 로직 존재
7. plugin.json commands 배열에 sg-health 존재
</verification>

<success_criteria>
1. HANDOFF.md가 없는 fresh 프로젝트에서 sg-execute가 파일을 자동 생성하고 행을 append한다.
2. sg-status 라우팅: HANDOFF.md last To=superpowers → Next: sg-review, last To=review → Next: sg-learn.
3. sg-review 실행 시 HANDOFF.md에 `review` 행이 기록된다.
4. sg-learn 실행 시 HANDOFF.md에 `hookify` 행이 기록된다.
5. hooks.json에 Stop과 SubagentStop이 모두 등록된다.
6. `transcript_matcher.py`가 단순 PLAN.md 언급이나 skill 이름 언급에 반응하지 않는다.
7. `sg-lessons phase-03`이 오류 없이 03번 파일을 찾는다.
8. `sg-health`가 plugin.json과 docs/COMMANDS.md에 등록된다.
</success_criteria>

<output>
완료 후 `.planning/quick/260518-wvx-code-review-fixes/260518-wvx-SUMMARY.md` 를 생성한다.
</output>
