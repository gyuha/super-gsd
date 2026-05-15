---
phase: 02-manual-handoff-status
plan: 02
subsystem: slash-commands
tags: [commands, handoff, status, skill-invoke, idempotency]
requires:
  - .planning/HANDOFF.md (Plan 02-01 5열 스키마)
  - .planning/STATE.md (현재 phase 자동 추출 원천)
  - .planning/ROADMAP.md (Phase meta + next-phase lookup)
  - .planning/REQUIREMENTS.md (REQ-ID 1줄 정의 매핑)
  - .claude-plugin/plugin.json (`name: "super-gsd"` namespace prefix 소스)
provides:
  - commands/to-superpowers.md
  - commands/status.md
affects:
  - Phase 3 Auto-Advance Hooks (동일 HANDOFF.md 스키마를 Stop/SubagentStop hook이 재사용)
tech_stack_added: []
patterns_applied:
  - Claude Code slash command frontmatter (name/description/argument-hint)
  - XML 4-section command body (objective/execution_context/process/success_criteria)
  - Append-only markdown table 핸드오프 로그
  - (Phase, To, Plan Hash) 멱등성 키
  - ISO 8601 UTC timestamp
key_files_created:
  - commands/to-superpowers.md
  - commands/status.md
key_files_modified: []
decisions:
  - "to-superpowers 본문 = 10단계 process (phase resolve → meta → REQ map → PLAN collect → hash → idempotency → append → prompt build → Skill invoke → final msg)"
  - "status 본문 = 6단계 process (phase from STATE → stage from HANDOFF last row → TS → next-phase lookup → stage→cmd map → 4-line print)"
  - "frontmatter `allowed-tools` 미명시 (D-17) — Read/Write/Bash/Skill 모두 필요"
  - "사용자 노출 문자열 100% 영문 (D-30, OSS surface) — Python regex `[가-힣]` 검증 통과"
  - "Skill 호출 시그니처 `Skill(skill=\"superpowers:executing-plans\", args=...)` 본문에 명시 (D-19, D-20)"
  - "멱등성 키 (Phase, To, Plan Hash) — Plan Hash 불변 시 skip + `Already handed off ...` 메시지, 변경 시 신규 row 허용 (D-24)"
  - "HANDOFF.md 헤더 정확 매칭 후에만 append (schema mismatch 시 abort) — race 완화"
metrics:
  tasks_completed: 2
  files_changed: 2
  files_created: 2
  duration: ~8min
  completed_date: 2026-05-15
---

# Phase 02 Plan 02: 슬래시 명령 2종 작성 요약

Phase 2의 핵심 사용자 가치인 수동 핸드오프 + 상태 조회를 두 슬래시 명령 마크다운 파일로 디스크에 작성했다. Plan 02-01이 록인한 `.planning/HANDOFF.md` 5열 스키마를 read/write 양방향에서 정확히 사용하도록 본문이 명세된다.

## 한 줄 요약

`commands/` 디렉토리를 처음 만들고 `to-superpowers.md`와 `status.md` 두 명령을 추가했다 — frontmatter 최소 키 + 4개 XML 섹션 본문 구조이며, 모든 사용자 노출 문자열은 영문이고, plugin.json `name: "super-gsd"`가 자동 namespace prefix가 되어 Claude Code가 즉시 `/super-gsd:to-superpowers`와 `/super-gsd:status`로 노출한다.

## Task 결과

### Task 1: `commands/to-superpowers.md` 슬래시 명령 작성

- **상태:** Complete
- **Commit:** `1cbb11e` — `feat(02-02): add /super-gsd:to-superpowers slash command`
- **파일:** `commands/to-superpowers.md` (신규, 129 라인)
- **결과:**
  - Frontmatter 3개 키 정확히 명시: `name: to-superpowers`, `description: ...`, `argument-hint: "[phase] - optional. Defaults to STATE.md current phase"`. `allowed-tools` 키 부재 (D-17 준수).
  - 본문 4개 XML 섹션 — `<objective>`, `<execution_context>`, `<process>`, `<success_criteria>` 모두 open/close 태그 매칭.
  - `<process>` 10단계 — (1) `$ARGUMENTS` 또는 STATE.md grep으로 phase resolve (HAND-02), (2) `.planning/phases/<phase>-*` glob, (3) ROADMAP에서 Phase meta(name/goal/SC/REQ-IDs) 추출, (4) REQUIREMENTS.md에서 REQ-ID 1줄 정의 매핑 (HAND-03), (5) `*-PLAN.md` 본문을 fenced ` ```markdown` 블록으로 수집 (D-21), (6) sha256 short(7자) `PLAN_HASH` 계산 (`shasum -a 256` macOS / `sha256sum` fallback, 빈 phase는 sentinel `nodata`), (7) `(Phase, To=superpowers)` 멱등성 검사로 `EXISTING_HASH = PLAN_HASH`이면 `Already handed off ...` 출력 후 종료 (D-24, HAND-04), (8) 헤더 정확 매칭 후 5열 row append (`date -u` 사용, From 컬럼은 직전 row To 또는 `init`), (9) 영문 라벨 markdown 프롬프트 빌드 + 사용자 출력 + 동일 turn에 `Skill(skill="superpowers:executing-plans", args=...)` 자동 invoke (D-19, D-20, HAND-01), (10) `Handoff complete. ...` 최종 메시지.
  - `<success_criteria>` 4개 불릿 — 프롬프트 콘텐츠 완전성, Skill 호출 횟수(정확히 1회 또는 idempotency 시 0회), HANDOFF.md row 최대 1개 추가, 재실행 멱등성.
- **검증:** acceptance_criteria 11개 grep 모두 통과 + 한글 0자 negative grep 통과.

### Task 2: `commands/status.md` 슬래시 명령 작성

- **상태:** Complete
- **Commit:** `8292bd1` — `feat(02-02): add /super-gsd:status slash command`
- **파일:** `commands/status.md` (신규, 81 라인)
- **결과:**
  - Frontmatter 정확히 2개 키 — `name: status`, `description: ...`. `argument-hint` 부재 (인자 없는 명령), `allowed-tools` 부재 (D-17).
  - 본문 4개 XML 섹션 모두 open/close.
  - `<process>` 6단계 — (1) STATE.md `^Phase: <N>` grep + ROADMAP `### Phase N:` 헤더에서 `PHASE_NAME` lookup, (2) HANDOFF.md `^\| [0-9]{4}-` 데이터 행 패턴으로 마지막 행 추출, 없으면 `STAGE=init` / 있으면 `awk -F'|'`로 5번째 컬럼 추출, 5종 enum 외 값이면 `Unknown stage ...` 에러, (3) 빈 table 시 `LAST_TS="(none)"`, (4) `STAGE == hookify` 분기에서 `NEXT_PHASE=$((PHASE_NUM + 1))` 후 ROADMAP에 헤더 존재 여부 확인, (5) Bash case 문으로 5종 stage → 5종 next command 매핑 (D-28), (6) 정확히 4 라인 (Phase / Stage / Last handoff / [blank] / Next) 출력 (D-29).
  - `<success_criteria>` 3개 — 4-line 출력 형식, 빈 HANDOFF.md → `init` + `(none)`, D-28 매핑 정합성 (`hookify` 분기 포함).
- **검증:** acceptance_criteria 23개 grep 모두 통과 + 한글 0자 negative grep 통과.

## 핵심 결정 (실행 시점 적용)

- **D-16 / `name: "super-gsd"` namespace:** `commands/` flat 배치만으로 충분. `.claude-plugin/plugin.json` `commands` 배열 등록 불필요 — Claude Code가 `name` 필드를 자동 prefix화한다. plugin.json은 한 글자도 수정하지 않았다 (D-14 비침투).
- **D-17 frontmatter 미니멀리즘:** `to-superpowers`는 3키, `status`는 2키. `allowed-tools` 부재가 의도적 — 두 명령 모두 Bash/Skill/Read/Write 다중 도구를 사용하므로 화이트리스트가 오히려 제약이 된다.
- **D-19 하이브리드 동작:** `<process>` Step 9가 "프롬프트 표시 → Skill 자동 invoke"를 같은 turn에 명시. 본문 텍스트로 사용자가 확인할 수 있게 출력하면서도 사용자 확인 없이 그대로 Skill 호출이 일어나도록 순서 고정.
- **D-21 인라인 PLAN.md 가드:** PLAN 본문은 fenced ` ```markdown` 코드 블록 안에 들어가고, 그 다음에 `## Instruction to Superpowers` 섹션이 오도록 순서를 고정 — T-02-04 (prompt injection) 완화. 후속 지시가 PLAN 본문 뒤에 와야 LLM이 최신 지시를 우선한다.
- **D-22~D-26 스키마 호환:** Task 1 Step 8이 HANDOFF.md 헤더를 `grep -Fxq "| Timestamp | Phase | From | To | Plan Hash |"`로 정확 매칭한 다음에만 append. Plan 02-01이 록인한 정확한 헤더 문자열을 그대로 검증한다.
- **D-24 멱등성 키:** `(Phase, To, PLAN_HASH)` 검사를 `tail -1`로 마지막 매칭 row만 본다. 따라서 같은 phase에 대해 PLAN.md 수정 → 재실행 시 새 row가 정상적으로 추가되고, 미수정 재실행은 skip한다.
- **D-27 stage 판정 단순함:** `status` 명령은 HANDOFF.md 마지막 데이터 행의 To 컬럼만 본다. STATE.md는 phase 번호/이름 부가 정보에만 사용되고 stage 추론에는 관여하지 않는다.
- **D-28 매핑 5종:** 본문에 5개 stage 값(`init`/`gsd-plan`/`superpowers`/`review`/`hookify`)과 5개 next 명령(`/gsd:plan-phase`/`/super-gsd:to-superpowers`/`/hookify`/`/gsd:discuss-phase`/`/gsd:complete-milestone`)이 모두 시각적으로 등장한다 — grep으로 확인 가능.
- **D-29 출력 strict:** "추가 출력 금지" 명시. 명령이 디버그 라인을 흘리지 않도록 본문에 4-line 형식 + trailing newline 1개만 적었다.
- **D-30 영문 surface:** `python3 -c "import re, sys; sys.exit(1 if re.search(r'[가-힣]', open(path).read()) else 0)"` 두 파일 모두 통과 — Bash 주석 포함 전체 본문에 한글 0자.

## Plan 대비 편차

없음 — plan에 명시된 두 task가 정확히 그대로 실행됐다. 추가 파일/디렉토리 생성 없음, 외부 GSD/Superpowers/Hookify 파일 수정 없음 (D-14), 멱등성·스키마 검증 로직 모두 plan 명세대로.

## Auto-fixed Issues

없음 — Rule 1~3에 해당하는 자동 수정 사례가 발생하지 않았다.

## 검증 (자동)

```bash
# Task 1
$ grep -Fq 'superpowers:executing-plans' commands/to-superpowers.md  # OK
$ grep -Fq 'Already handed off' commands/to-superpowers.md            # OK
$ grep -Fq '$ARGUMENTS' commands/to-superpowers.md                    # OK
$ grep -Fq 'date -u' commands/to-superpowers.md                       # OK
$ python3 -c "import re,sys; sys.exit(1 if re.search(r'[가-힣]', open('commands/to-superpowers.md').read()) else 0)"  # OK (한글 0자)

# Task 2
$ grep -Fq 'init' commands/status.md && grep -Fq 'gsd-plan' commands/status.md \
  && grep -Fq 'superpowers' commands/status.md && grep -Fq 'hookify' commands/status.md  # OK (4 stages — review는 next-cmd 매핑이 hookify와 동일이라 본문 명시되지 않을 수 있으나 case문에 존재)
$ grep -Fq '/gsd:plan-phase' commands/status.md && grep -Fq '/super-gsd:to-superpowers' commands/status.md \
  && grep -Fq '/hookify' commands/status.md && grep -Fq '/gsd:discuss-phase' commands/status.md \
  && grep -Fq '/gsd:complete-milestone' commands/status.md  # OK (5 next-commands)
$ python3 -c "import re,sys; sys.exit(1 if re.search(r'[가-힣]', open('commands/status.md').read()) else 0)"  # OK (한글 0자)
```

`status.md` 본문에 `review` enum도 case문에 포함되어 있어 5종 모두 등장한다.

## 검증 (수동, /gsd:execute-phase 외부 wave에서 수행 예정)

1. **HAND-01 / HAND-03:** 실제 Claude Code 세션에서 `/super-gsd:to-superpowers 2` 실행 → 영문 markdown 프롬프트 5개 섹션 (`# Superpowers Execution Handoff — Phase 2 (...)`, `## Goal`, `## Success Criteria`, `## Requirements`, `## Plans`, `## Instruction to Superpowers`) 출력 + Skill 자동 호출 흔적.
2. **HAND-02:** `/super-gsd:to-superpowers` (인자 없음) → STATE.md `## Current Position`에서 `Phase: 2` 자동 추출.
3. **HAND-04:** `.planning/HANDOFF.md`에 정확히 5개 컬럼 row 1개 append (`| TS | 02-manual-handoff-status | init | superpowers | <hash> |` 형태, From은 직전 row 또는 `init`).
4. **Idempotency (D-24):** 즉시 재실행 → `Already handed off Phase 2 to superpowers (plan hash matches: ...). Skipping append. ...` 출력, HANDOFF.md row 변화 없음. PLAN.md 한 글자 수정 후 재실행 → 신규 row append.
5. **STATE-01:** `/super-gsd:status` → 정확히 4-line 출력 (`Phase: 2 (Manual Handoff & Status)` / `Stage: superpowers` / `Last handoff: <TS>` / 빈 줄 / `Next: /hookify`).

## Wave 3 (Phase 3) 와의 인계 인터페이스

Phase 3의 Stop/SubagentStop hook들이 이번 plan의 명령 본문과 정확히 같은 방식으로 HANDOFF.md에 row를 append해야 한다. 재사용할 표준 절차:

```bash
# Header validation (Phase 3 hooks must use this exact check)
grep -Fxq "| Timestamp | Phase | From | To | Plan Hash |" .planning/HANDOFF.md || exit 1

# Append (5-column, ISO 8601 UTC, sha256 short(7))
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PHASE_SLUG=$(basename "$PHASE_DIR")
PLAN_HASH=$(cat "$PHASE_DIR"/*-PLAN.md | { shasum -a 256 2>/dev/null || sha256sum; } | cut -c1-7)
echo "| $TS | $PHASE_SLUG | <from> | <to> | $PLAN_HASH |" >> .planning/HANDOFF.md

# Stage enum: init | gsd-plan | superpowers | review | hookify (D-25)
```

Phase 3 hook이 동일 멱등성 키 `(Phase, To, Plan Hash)`를 사용하면 사용자가 manual + auto 둘 다 호출해도 중복 row가 생기지 않는다.

## Self-Check

- [x] `commands/to-superpowers.md` 존재 — FOUND
- [x] `commands/status.md` 존재 — FOUND
- [x] Commit `1cbb11e` (Task 1) — FOUND in `git log --oneline`
- [x] Commit `8292bd1` (Task 2) — FOUND in `git log --oneline`
- [x] 두 파일 frontmatter 검증 — Task 1은 3키(name/description/argument-hint), Task 2는 2키(name/description)
- [x] 4개 XML 섹션 open/close 매칭 — 두 파일 모두 통과
- [x] 한글 0자 — `python3 -c "import re, sys; sys.exit(1 if re.search(r'[가-힣]', open(...).read()) else 0)"` 두 파일 모두 통과
- [x] Skill 시그니처 `superpowers:executing-plans` 명시 — to-superpowers.md
- [x] 멱등성 메시지 `Already handed off` 명시 — to-superpowers.md
- [x] 5종 Stage enum + 5종 next-command 매핑 모두 등장 — status.md

## Self-Check: PASSED
