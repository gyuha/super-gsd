# Architecture Research — v1.1 Reliability

**Researched:** 2026-05-16
**Source files analyzed:** commands/sg-start.md, commands/sg-status.md, .planning/HANDOFF.md, hooks/stop_hook.py, hooks/hooks.json, .planning/PROJECT.md, .planning/STATE.md, .planning/config.json

---

## New Components

### `commands/sg-health.md`

신규 skill 파일. 기존 명령에 붙이지 않는다.

**책임:** GSD/Superpowers/Hookify 설치 여부 + hooks.json 등록 상태 + HANDOFF.md 스키마 무결성을 한 번에 진단하고 통과/실패 리포트를 출력한다.

**이유:** sg-status는 상태 표시, sg-start는 시작 진입점이다. 진단 로직을 둘 중 하나에 끼워넣으면 단일 책임을 깨뜨린다. Claude Code skill 시스템에서 명령 하나 = 파일 하나가 표준 패턴이다 (기존 9개 commands/ 파일 모두 동일).

**검사 항목 (인라인 bash):**
```
1. GSD: which gsd 또는 ~/.claude/commands/gsd-plan-phase.md 존재 여부
2. Superpowers: ~/.claude/commands/superpowers:executing-plans.md 존재 여부
3. Hookify: ~/.claude/commands/hookify.md 존재 여부
4. hooks.json 등록: hooks.json의 Stop 훅에 stop_hook.py 경로 포함 여부
5. HANDOFF.md 스키마: 헤더 행 5컬럼(Timestamp|Phase|From|To|Plan Hash) 존재 여부
6. HANDOFF.md 데이터 무결성: 데이터 행이 있다면 To 컬럼이 허용 enum 값인지 확인
```

**출력 형식:**
```
[PASS] GSD installed
[PASS] Superpowers installed
[FAIL] Hookify not found — expected at ~/.claude/commands/hookify.md
[PASS] Stop hook registered
[PASS] HANDOFF.md schema valid (0 data rows)
[WARN] HANDOFF.md missing — will be created on first sg-execute

Overall: 1 failure, 1 warning — run sg-update to reinstall missing dependencies
```

---

## Modified Components

### `commands/sg-start.md` — 세션 복원 분기 추가

**현재 구조 (2-step):**
```
Step 1: Skill(skill="gsd-new-project", args="$ARGUMENTS")
Step 2: print 안내 메시지
```

**변경 후 구조 (3-step):**
```
Step 1: [신규] 세션 복원 감지
Step 2: 분기 — 복원 or 신규
Step 3: (신규 경로만) Skill(skill="gsd-new-project", args="$ARGUMENTS")
```

**Step 1 배치 근거:** gsd-new-project Skill을 호출하기 **전**에 배치해야 한다. 이미 진행 중인 세션에 gsd-new-project를 호출하면 GSD가 새 스캐폴딩을 덮어쓸 가능성이 있다. gsd-new-project는 신규 시작 경로에서만 호출되어야 한다.

**세션 복원 감지 로직 (인라인 bash):**
```bash
# 1. HANDOFF.md에 데이터 행이 있는지 확인
LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)

# 2. STATE.md frontmatter에서 milestone과 status 읽기
MILESTONE=$(grep '^milestone:' .planning/STATE.md 2>/dev/null | awk '{print $2}' | tr -d '"')
STATUS=$(grep '^status:' .planning/STATE.md 2>/dev/null | awk '{print $2}' | tr -d '"')
```

**분기 조건:**
- `LAST_ROW` 비어있고 `STATUS`가 "planning" 또는 STATE.md 없음 → 신규 프로젝트 경로 (기존 동작 유지)
- `LAST_ROW` 있거나 `STATUS`가 "in_progress" → 복원 프롬프트 출력 후 사용자 선택 대기

**복원 프롬프트 출력 형식:**
```
Existing session detected.
  Milestone: <MILESTONE>
  Stage: <STAGE from LAST_ROW To column>
  Last handoff: <TIMESTAMP from LAST_ROW>

Resume this session? (yes to resume, no to start fresh)
```

**주의:** "사용자 선택 대기"는 Claude Code skill에서 직접 interactive input을 받을 수 없다. 따라서 복원 감지 후 **프롬프트를 출력하고 skill을 종료**하는 방식으로 구현한다. 사용자가 "yes" 또는 "no"를 입력하면 Claude가 맥락에서 판단하여 이어지는 명령(`/sg-status`, `/sg-execute` 등)을 안내한다. gsd-new-project 호출은 복원 경로에서 건너뛴다.

### `commands/sg-status.md` — STATUS-01 검증 및 갭 수정

**현재 상태:** sg-status.md는 이미 Step 2에서 HANDOFF.md 인라인 bash 파싱을 완전히 명세하고 있다 (D-27 스키마 준수). STATUS-01의 실제 작업은 이 명세가 v1.0 구현에서 누락되었거나 부정확한 부분을 찾아 수정하는 것이다.

**확인해야 할 갭:**

1. **STATE.md Phase 파싱 패턴:** 현재 `grep -E '^Phase: [0-9]' .planning/STATE.md`로 읽는데, STATE.md 실제 내용이 `Phase: Not started (defining requirements)` 형태라 숫자가 없을 때 `PHASE_NUM`이 비어버린다. 이 케이스를 명세가 커버하고 있는지 확인 필요.

2. **HANDOFF.md AWK 컬럼 인덱스:** 5컬럼 TSV `| Timestamp | Phase | From | To | Plan Hash |`에서 `$5`가 To 컬럼인지 확인. Markdown 테이블에서 `|`로 split 시 `$1`이 빈 문자열이므로: `$2=Timestamp, $3=Phase, $4=From, $5=To, $6=Plan Hash`. 현재 명세의 `$5`는 정확하다.

3. **init 판정:** 데이터 행 0개 → STAGE="init" 판정은 명세에 있고 HANDOFF.md 현재 상태(데이터 행 없음)와 일치한다.

**결론:** 새 Python helper는 불필요하다. 읽기 전용 단순 파싱에 별도 모듈을 만들면 과설계다. 인라인 bash가 충분하다. 실제 STATUS-01 작업은 위 갭 3개를 실행해보고 엣지케이스를 명세에 반영하는 것이다.

---

## Data Flow Changes

### 현재 데이터 플로우

```
sg-execute (write) → .planning/HANDOFF.md (append-only)
                           ↓ read
                       sg-status (read-only)

stop_hook.py (read) → .planning/STATE.md (read)
                     → transcript (read)
                     → .planning/lessons/ (write)
```

### v1.1 추가 데이터 플로우

```
sg-start (read) → .planning/HANDOFF.md (read-only, Step 1)
                → .planning/STATE.md (read-only, Step 1)
                     ↓ 복원 감지 결과
                → Skill(gsd-new-project) 호출 or 복원 프롬프트 출력

sg-health (read) → .planning/HANDOFF.md (schema check)
                 → hooks/hooks.json (registration check)
                 → ~/.claude/commands/ (install check)
                 → stdout (진단 리포트)
```

### 경합 위험 분석

**HANDOFF.md 동시 읽기/쓰기:**
- 쓰기: sg-execute만 (append 1행)
- 읽기: sg-status, sg-start(v1.1), sg-health(v1.1)
- Claude Code 내에서 명령이 동시 실행되지 않으므로 실질적 경합 없다.
- 이론적으로 sg-execute append 중간에 sg-status가 `tail -1`을 실행하면 절반짜리 행을 읽을 수 있으나, 파일시스템 레벨 행 원자성이 보장되지 않는다. **Low risk** — 현실에서 재현 불가능.
- 완화책이 필요하다면: sg-status Step 2에서 `grep -E '^\| [0-9]{4}-'`로 완전한 행(Timestamp로 시작)만 필터링하면 절반짜리 행을 자동 배제한다. 이미 명세에 이 패턴이 있다.

**STATE.md 동시 접근:**
- GSD가 STATE.md를 쓴다. sg-start와 stop_hook.py가 읽는다.
- GSD 쓰기 중 sg-start 읽기는 이론적으로 가능하나 실질적으로 같은 Claude 세션에서 동시 발생 불가.

---

## Build Order

### Phase 1: `commands/sg-health.md` 신규 생성

**근거:** 독립 컴포넌트다. 기존 파일을 변경하지 않고 신규 파일 하나만 추가한다. 다른 두 기능과 의존성 없다. 가장 낮은 위험으로 가장 빠르게 deliverable을 만들 수 있다.

**산출물:** `commands/sg-health.md`

**검증:** `/super-gsd:sg-health` 실행 → PASS/FAIL/WARN 라인 출력 확인

### Phase 2: `commands/sg-status.md` 갭 수정 및 검증

**근거:** sg-start 복원 로직이 Stage 파싱 결과에 의존한다. sg-start를 구현하기 전에 HANDOFF.md 파싱이 정확한지 검증해야 한다. sg-status의 Stage 판정이 틀리면 sg-start 복원 감지도 틀린다.

**작업:** 
1. 실제 `sg-status` 실행하여 현재 출력 확인
2. STATE.md "Phase: Not started" 케이스 처리 갭 확인
3. 명세와 실제 구현 간 차이 수정

**산출물:** `commands/sg-status.md` (수정, 또는 이미 정확하면 무변경)

**검증:** `/super-gsd:sg-status` 실행 → 4라인 포맷 출력, HANDOFF.md 없을 때 init 판정 확인

### Phase 3: `commands/sg-start.md` 세션 복원 분기 추가

**근거:** sg-health(설치 확인)와 sg-status(Stage 파싱 패턴) 양쪽이 확립된 후 구현한다. sg-start 복원은 HANDOFF.md 파싱 패턴을 sg-status에서 복제하므로, sg-status가 먼저 검증되어 있어야 복붙 시 버그를 물려받지 않는다.

**산출물:** `commands/sg-start.md` (수정)

**검증:** HANDOFF.md에 데이터 행이 있을 때 `/super-gsd:sg-start` 실행 → 복원 프롬프트 출력 확인. 데이터 행 없을 때 → 기존 gsd-new-project 호출 동작 유지 확인.

---

## Risks

### Risk 1: sg-start의 "interactive" 복원 프롬프트 한계

**현상:** Claude Code skill은 사용자 입력을 직접 받을 수 없다. 복원 여부 확인을 위해 "yes/no" 입력 대기 루프를 만들 수 없다.

**완화:** 복원 감지 후 프롬프트를 출력하고 skill 종료. Claude 모델이 이어지는 사용자 응답("yes", "계속해줘" 등)을 맥락으로 해석하여 적절한 다음 명령을 안내한다. 자동화는 불완전하지만 사용자 경험은 허용 수준이다.

**허용 조건:** hooks API가 `systemMessage` 이상의 interaction을 지원하기 전까지 이 방식이 기술적 최대치다 (PROJECT.md Key Decisions의 HOOK-02 결정과 동일 맥락).

### Risk 2: STATE.md Phase 파싱 — "Not started" 케이스

**현상:** STATE.md의 `Phase: Not started (defining requirements)` 형태에서 `grep -E '^Phase: [0-9]'`가 아무것도 매칭하지 않아 `PHASE_NUM`이 빈 문자열이 된다.

**완화:** sg-status 명세는 이미 "If `PHASE_NUM` is empty, default `PHASE_NAME` to empty string and keep `PHASE_NUM` as `?`"를 명시하고 있다. 구현이 이 폴백을 실제로 처리하는지 Phase 2에서 검증 필요.

### Risk 3: sg-health의 설치 경로 가정

**현상:** GSD/Superpowers/Hookify가 설치되는 경로가 사용자마다 다를 수 있다. `~/.claude/commands/`가 기본이지만 커스텀 경로 설치도 가능하다.

**완화:** `which gsd`, `claude mcp list`, 또는 `~/.claude/commands/` + `~/.claude/plugins/` 양쪽을 모두 확인하는 다중 경로 탐색 전략. 실패 시 WARN으로 처리하여 false-positive FAIL을 줄인다. sg-health는 진단 도구지 설치 도구가 아니므로 보수적으로 WARN 레벨을 넓게 쓴다.

### Risk 4: HANDOFF.md 없을 때 sg-start 복원 감지

**현상:** 신규 프로젝트에서 HANDOFF.md 자체가 없다. `grep ... 2>/dev/null`이 실패해도 `LAST_ROW`가 빈 문자열이 되는지, 아니면 오류 코드가 전파되는지 확인 필요.

**완화:** bash의 `2>/dev/null`과 `|| true` 패턴으로 파일 부재를 명시적으로 처리. sg-status 명세는 이미 "If the file is missing or has zero data rows, set STAGE=init"을 처리하고 있으므로 동일 패턴 적용.
