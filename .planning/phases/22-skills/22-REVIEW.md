---
phase: 22-skills
reviewed: 2026-05-22T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - skills/sg-complete/SKILL.md
  - skills/sg-execute/SKILL.md
  - skills/sg-explore/SKILL.md
  - skills/sg-health/SKILL.md
  - skills/sg-learn/SKILL.md
  - skills/sg-lessons/SKILL.md
  - skills/sg-new/SKILL.md
  - skills/sg-plan/SKILL.md
  - skills/sg-quick/SKILL.md
  - skills/sg-review/SKILL.md
  - skills/sg-ship/SKILL.md
  - skills/sg-start/SKILL.md
  - skills/sg-status/SKILL.md
  - skills/sg-update/SKILL.md
findings:
  critical: 3
  warning: 7
  info: 4
  total: 14
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-05-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

14개 SKILL.md 파일을 전수 검토했다. 파일들은 대체로 일관된 구조(YAML frontmatter + objective + process + success_criteria)를 따르고 있으나, 여러 곳에서 셸 코드 로직 오류, 보안 결함, 스키마 불일치가 발견됐다. 특히 `sg-quick`의 `node` 의존성 하드코딩, `sg-start`의 unknown stage에서 exit 1 호출로 인한 의도치 않은 crash, `sg-execute`의 parallel_groups.json 경쟁 조건이 블로커 수준 문제다.

---

## Critical Issues

### CR-01: sg-quick — `node` 하드코딩으로 Node.js 미설치 환경에서 즉시 실패

**File:** `skills/sg-quick/SKILL.md:62-63`
**Issue:** `gsd-sdk query init.quick`의 JSON 파싱을 `node -e ...`로 수행한다. 프로젝트 CLAUDE.md는 "Bash/Python/Markdown 위주" 스택을 명시하고 있으며, `sg-update`의 GSD 설치 감지 로직조차 `npm list -g` fallback을 사용한다. Python이 기본 도구인 환경에서 Node.js가 없으면 QUICK_ID / TASK_DIR이 무조건 빈 문자열이 돼 Step 2 에러로 즉시 중단된다. 또한 `node`가 없을 경우 에러 메시지가 `gsd-sdk init.quick failed — check gsd-sdk installation`으로 나와 실제 원인(node 없음)을 숨긴다.
**Fix:**
```bash
QUICK_ID=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('quick_id') or d.get('id',''))")
TASK_DIR=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('task_dir') or d.get('dir',''))")
```
또는 node가 없을 때를 별도로 감지해 에러 메시지를 명확히 구분해야 한다.

---

### CR-02: sg-start — unknown stage에서 `exit 1` 실행으로 세션 감지에 성공해도 강제 crash

**File:** `skills/sg-start/SKILL.md:72`
**Issue:** HANDOFF.md 마지막 행의 `To` 컬럼이 알려지지 않은 값이면 `exit 1`로 종료된다. 이 코드는 `sg-status`에서 복제됐는데, `sg-status`에서 exit 1은 상태 조회 실패로 납득할 수 있지만, `sg-start`에서 exit 1은 세션 재개 자체를 차단한다. HANDOFF.md에 `parallel` 값이 기록돼 있는데 sg-start의 case 문에도 `parallel`이 포함돼 있어 현재는 통과하지만, 미래에 새 stage 값이 추가되면 sg-start가 즉시 broken 상태가 된다. 더 심각한 문제는 sg-status와 sg-start의 허용 stage 목록이 동일 파일(sg-status 기준)을 "복제"했다고 명시하고 있어, 한쪽이 변경되면 다른 쪽이 stale하게 되는 구조적 결함이다.
**Fix:**
```bash
# sg-start에서는 exit 1 대신 warn으로 처리:
*) echo "[warn] Unknown stage '${STAGE_RAW}' in HANDOFF.md — treating as init" >&2
   STAGE_RAW="init" ;;
```
또는 unknown stage를 `init`으로 fallback해 사용자가 적어도 Resume/Start new milestone 중 선택할 수 있게 해야 한다.

---

### CR-03: sg-execute — parallel_groups.json을 위험한 경로에 기록

**File:** `skills/sg-execute/SKILL.md:232`
**Issue:** `parallel_groups.json`을 `$PHASE_DIR/parallel_groups.json`에 직접 기록한다. `$PHASE_DIR`은 사용자가 제어하는 `$PHASE_NUM` 인자에서 파생된다. `$ARGUMENTS`에 `../`가 포함되면 path traversal이 가능하다. 예: `/super-gsd:sg-execute ../../etc`를 호출하면 `PHASE_PAD`가 비정상적인 값이 돼 `ls -d .planning/phases/../../etc-*`를 시도한다. 실패해도 이후 `$GROUPS_JSON_FILE`이 예상치 못한 위치를 가리킬 수 있다.
**Fix:**
```bash
# PHASE_NUM을 숫자만 허용하도록 검증:
if ! echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
  echo "Invalid phase number: '$PHASE_NUM'. Must be a positive integer."
  exit 1
fi
```
이 검증은 sg-complete, sg-ship, sg-plan에서도 동일하게 필요하지만 sg-execute에서 특히 심각하다 — 파일 쓰기가 발생하기 때문이다.

---

## Warnings

### WR-01: sg-health — 8번 항목이 두 개 (번호 중복)

**File:** `skills/sg-health/SKILL.md:90,104`
**Issue:** process 섹션에 `8. **STATE.md frontmatter**`와 `8. **요약 출력**`이 연속으로 존재한다. 번호가 중복돼 9번이 없다. success_criteria에서는 "7개 진단 항목"이라고 쓰여 있는데 실제로는 8개(GSD, Superpowers, Hookify, Hook scripts, Stop hook, SubagentStop hook, HANDOFF.md, STATE.md)다. 명세 불일치로 Claude가 요약 출력 단계를 실행하지 않거나 잘못 해석할 수 있다.
**Fix:** 요약 출력을 `9. **요약 출력**`으로 번호를 수정하고, success_criteria 1번을 "8개 진단 항목"으로 수정한다.

---

### WR-02: sg-execute — idempotency 체크가 `sg-complete` stage를 기록한 이후 재실행 시 항상 통과

**File:** `skills/sg-execute/SKILL.md:98-105`
**Issue:** idempotency 체크는 `To = superpowers | parallel`인 행만 찾는다. `sg-complete`나 `sg-ship` 이후에 같은 phase에서 sg-execute를 재실행하면 idempotency 체크가 무조건 통과돼 중복 handoff가 발생한다. 의도한 동작인지 명확하지 않으며 success_criteria에도 이 케이스가 언급되지 않는다.
**Fix:** success_criteria에 "milestone이 complete/ship 상태인 경우 sg-execute 재실행 동작" 명세를 추가하거나, complete/ship 단계 이후에는 경고 메시지를 출력하도록 한다.

---

### WR-03: sg-lessons — `cat` 명령으로 악의적 milestone 파일 내용이 무필터 출력

**File:** `skills/sg-lessons/SKILL.md:27`
**Issue:** `MILESTONE_FILE` 경로 검증 없이 `cat "$MILESTONE_FILE"`을 실행한다. `$MILESTONE_ARG`는 `$ARGUMENTS`에서 grep으로 추출하며, `.planning/milestones/${MILESTONE_ARG}-LESSONS.md`를 직접 참조한다. `MILESTONE_ARG`에 `../` 포함 시 path traversal이 가능하다. 예: `--milestone=../../etc/passwd`는 `.planning/milestones/../../etc/passwd-LESSONS.md`를 참조한다. `-LESSONS.md` suffix가 붙어 실제 파일 존재는 어렵지만, 향후 suffix 제거 시 즉시 취약점이 된다.
**Fix:**
```bash
# milestone 값을 alphanumeric + . - 만 허용:
if ! echo "$MILESTONE_ARG" | grep -qE '^[a-zA-Z0-9._-]+$'; then
  echo "Invalid milestone argument."
  exit 1
fi
```

---

### WR-04: sg-plan — `gsd-sdk query roadmap.get-phase`는 존재하지 않는 SDK 명령

**File:** `skills/sg-plan/SKILL.md:54`
**Issue:** Step 1.5에서 `gsd-sdk query roadmap.get-phase "$PHASE_NUM" --pick section`을 실행한다. CLAUDE.md의 Development Commands 섹션에 나열된 `gsd-sdk` 사용 예시는 `init.quick`뿐이며, `roadmap.get-phase`가 실제로 존재하는지 확인되지 않는다. 실패 시 `PHASE_SECTION`이 비어 UI 감지가 건너뛰어지는 건 괜찮지만, 명령이 없는 경우 stderr에 에러 메시지가 출력돼 사용자 혼란을 야기한다. `2>/dev/null`이 있지만 실제 결과물인 `PHASE_SECTION_RAW`가 항상 비어 있으면 UI 감지 기능 자체가 dead code가 된다.
**Fix:** gsd-sdk에 해당 명령이 실제로 존재하는지 확인하거나, 존재하지 않으면 Step 1.5 전체를 제거해 dead code 상태를 해소해야 한다.

---

### WR-05: sg-quick — STATE.md `### Quick Tasks Completed` 섹션 없을 때 awk가 무한 오류

**File:** `skills/sg-quick/SKILL.md:120-136`
**Issue:** awk 스크립트는 `insert_after == 0`이면 stderr에 에러를 출력하고 `exit 1`로 종료한다. 그런데 `STATE.md.tmp`가 생성된 상태에서 `mv`가 실행되지 않으므로 `.planning/STATE.md.tmp` 임시 파일이 남는다. 이후 재실행 시 임시 파일이 충돌하지는 않지만, STATE.md 업데이트가 자동으로 skip되고 git commit에서 STATE.md가 변경 없이 커밋돼 pending 상태가 유실된다. 에러 메시지가 "exit 1"로 끝나는데 이후 Step 8의 git commit도 실행되지 않으므로 PLAN.md만 생성되고 커밋되지 않은 채 남는다.
**Fix:** awk 실패 시 명시적인 에러 메시지를 출력하고 전체 sg-quick을 중단해야 한다:
```bash
} || { echo "ERROR: Failed to update STATE.md — ### Quick Tasks Completed section may be missing"; exit 1; }
```

---

### WR-06: sg-start와 sg-status의 stage case 문 불일치

**File:** `skills/sg-start/SKILL.md:70-88`, `skills/sg-status/SKILL.md:33-51`
**Issue:** sg-start의 stage case 문(Step 2)은 sg-status를 "글자 그대로 복제"한다고 명시하지만, Next 명령 매핑 case 문(Step 4)에서 sg-status는 `parallel` 케이스를 별도로 처리(`NEXT_CMD="/super-gsd:sg-review"`)하는 반면 sg-start에서는 `parallel` 케이스가 없다. sg-start Step 4의 case 문에서 `parallel` stage는 `*)` 브랜치로 떨어져 `NEXT_CMD="(unknown stage: parallel)"`가 된다.
**Fix:**
```bash
# sg-start Step 4의 case 문에 parallel 케이스 추가:
parallel)    NEXT_CMD="/super-gsd:sg-review" ;;
```

---

### WR-07: sg-review — `$BASE_SHA == $HEAD_SHA`일 때 `--argument`로 base를 전달하라는 안내가 잘못됨

**File:** `skills/sg-review/SKILL.md:25-27`
**Issue:** 에러 메시지에서 "1. Pass an explicit base: `/super-gsd:sg-review <base-sha>`"를 제안하지만, sg-review의 argument-hint와 process Step 2를 보면 `$ARGUMENTS`는 DESCRIPTION(구현 설명 문자열)으로 사용된다. base SHA를 전달하는 공식 메커니즘이 없으므로 이 안내는 실제로 작동하지 않는다. 사용자가 SHA를 인자로 넘기면 DESCRIPTION으로 해석돼 의도와 다른 동작을 한다.
**Fix:** 에러 메시지를 실제 지원하는 해결 방법으로 수정한다:
```
Error: BASE_SHA == HEAD_SHA — no commits to review.
Options:
  1. Commit your changes first, then run /super-gsd:sg-review.
  2. Run from a feature branch that has diverged from main.
```

---

## Info

### IN-01: sg-explore — `<success_criteria>` 클로징 태그 후 `</output>` 태그가 오타

**File:** `skills/sg-explore/SKILL.md:23`
**Issue:** `</output>` 태그가 있는데 다른 SKILL.md 파일들과 달리 `<output>` 여는 태그가 없다. 사실 모든 파일에 `</output>` 닫는 태그가 있지만 여는 `<output>` 태그가 없다. 이는 전체 파일군에서 공통적인 패턴이므로 의도된 것일 수 있으나, XML 관점에서는 불일치다.

---

### IN-02: sg-complete — 단계 번호가 `1`, `1.3`, `1.5`, `2`로 비정형

**File:** `skills/sg-complete/SKILL.md:16,29,41,56`
**Issue:** process 스텝 번호가 `1 → 1.3 → 1.5 → 2`로 소수점 표기가 혼재한다. 다른 파일들도 `1.5`, `2.5` 등을 사용하지만 sg-complete는 1.3이 유일하다. Claude가 순서를 잘못 해석할 가능성은 낮지만, 일관성이 없다.

---

### IN-03: sg-update — superpowers와 super-gsd의 install/update 브랜치가 동일한 명령을 실행

**File:** `skills/sg-update/SKILL.md:61,75` 및 `skills/sg-update/SKILL.md:96,110`
**Issue:** `claude plugin install superpowers@claude-plugins-official`이 install 브랜치와 update 브랜치 모두에서 동일하게 실행된다. 현재는 동작상 문제없지만, 향후 `claude plugin update` 명령이 별도로 존재하면 버전 downgrade 위험이 있다. 또한 install/update 분기가 다른 echo 메시지만 다를 뿐 실제로는 동일한 코드 블록이라 중복이 심하다.

---

### IN-04: sg-health — `${CLAUDE_PLUGIN_ROOT}` 미설정 시 hooks.json 점검 실패 메시지 불명확

**File:** `skills/sg-health/SKILL.md:56,65`
**Issue:** `CLAUDE_PLUGIN_ROOT`가 설정되지 않으면 `grep -q '"Stop"' "/hooks/hooks.json"`을 실행해 루트 경로인 `/hooks/hooks.json`을 찾으려 한다. 파일이 없으면 FAIL로 기록되지만 실제 원인이 환경 변수 미설정인지 hooks.json 자체 문제인지 구분할 수 없다. CLAUDE.md Architecture 섹션에서 `CLAUDE_PLUGIN_ROOT` 부재 시 `__file__` 기반 경로로 폴백한다고 명시하지만 sg-health에서는 이 폴백이 없다.
**Fix:** 진단 전에 `CLAUDE_PLUGIN_ROOT` 설정 여부를 확인하고, 미설정 시 `[WARN] CLAUDE_PLUGIN_ROOT not set — hook check may be inaccurate`를 출력한다.

---

_Reviewed: 2026-05-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
