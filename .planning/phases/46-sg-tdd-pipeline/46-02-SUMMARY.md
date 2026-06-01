---
phase: 46-sg-tdd-pipeline
plan: "02"
subsystem: hooks+skills
tags: [tdd, pipeline-integration, transcript-matcher, stop-hook, sg-next, sg-status, d-07]
dependency_graph:
  requires:
    - 46-01 (skills/sg-tdd/SKILL.md + .agents/skills/sg-tdd/SKILL.md)
  provides:
    - hooks/transcript_matcher.cjs (TDD_SIGNALS + tdd-complete branch)
    - hooks/stop_hook.cjs (tdd stageToSignal + tdd-complete systemMessage)
    - skills/sg-next/SKILL.md (tdd enum + tdd_mode routing)
    - skills/sg-status/SKILL.md (tdd enum + tdd_mode routing + display enum)
    - .agents/skills/sg-next/SKILL.md (mirror)
    - .agents/skills/sg-status/SKILL.md (mirror)
  affects:
    - stop_hook.cjs systemMessage output (새 tdd-complete 분기)
    - HANDOFF.md stage validation (tdd enum 추가로 Unknown stage 오류 방지)
tech_stack:
  added: []
  patterns:
    - TDD_SIGNALS array (transcript_matcher.cjs 5번째 신호 세트)
    - tdd-complete signal string routing
    - node -e inline config.json read (macOS 호환, jq 없음)
    - D-07 inline-replication (sg-next + sg-status 4개 파일 동시 갱신)
key_files:
  created: []
  modified:
    - hooks/transcript_matcher.cjs
    - hooks/stop_hook.cjs
    - skills/sg-next/SKILL.md
    - skills/sg-status/SKILL.md
    - .agents/skills/sg-next/SKILL.md
    - .agents/skills/sg-status/SKILL.md
decisions:
  - "D-03: execute) 분기를 tdd_mode=true이면 sg-tdd, false/미설정이면 sg-review로 분기"
  - "D-05: tdd 단일어를 execute와 review 사이에 배치 (case enum 순서)"
  - "D-06: tdd-complete 신호를 transcript_matcher + stop_hook 양쪽에 등록"
  - "D-07 inline-replication: sg-next와 sg-status 4개 파일 동시 원자 커밋"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-01"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 6
---

# Phase 46 Plan 02: Pipeline Integration Summary

6개 파일 외과적 수정으로 tdd stage를 기존 파이프라인(transcript_matcher → stop_hook → sg-next/sg-status)에 통합 — TDD_SIGNALS 배열 추가, tdd-complete 신호 라우팅, tdd_mode 조건 분기, D-07 4파일 동시 갱신.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | hooks/transcript_matcher.cjs — TDD_SIGNALS + detectSignal() 분기 | f6b565a | hooks/transcript_matcher.cjs |
| 2 | hooks/stop_hook.cjs — stageToSignal() + main() tdd 분기 | ea434d2 | hooks/stop_hook.cjs |
| 3 | sg-next + sg-status + .agents/ 미러 tdd 라우팅 (D-07) | ec32deb | skills/sg-next/SKILL.md, skills/sg-status/SKILL.md, .agents/skills/sg-next/SKILL.md, .agents/skills/sg-status/SKILL.md |

## What Was Built

**hooks/transcript_matcher.cjs** — 5번째 신호 세트 추가:
- `const TDD_SIGNALS = ['TDD verification complete']` — SG_RETRO_SIGNALS 뒤에 배열 추가
- `detectSignal()` 함수 끝에 `if (TDD_SIGNALS.some(...)) return 'tdd-complete'` 분기 추가 (SG_RETRO 뒤, `return ''` 앞)

**hooks/stop_hook.cjs** — 세 곳 외과적 수정:
- `stageToSignal()` switch에 `case 'tdd': return 'tdd-complete'` 추가 (execute와 review 케이스 사이)
- `main()` 커맨드 변수에 `cmdTdd` 추가 (claude-code: `/super-gsd:sg-tdd`, other: `$sg-tdd`)
- `if/else-if` 체인에 `signal === 'tdd-complete'` 분기 추가 → "TDD verification complete. Run {cmdReview} to request a code review."

**skills/sg-next/SKILL.md** — 5곳 수정 (D-07 block 내부):
- Step 2 case 열거: `execute|tdd|review` 패턴 (2곳 — primary + scan-back re-validate)
- Step 3 execute) 분기: tdd_mode=true → sg-tdd, false → sg-review + tdd) → sg-review
- Step 6 Skill() 매핑: `/super-gsd:sg-tdd` 항목 추가
- success_criteria: tdd 라우팅 항목 추가

**skills/sg-status/SKILL.md** — 4곳 수정 (D-07 동시 갱신):
- Step 2 case 열거: `execute|tdd|review` 패턴 (2곳)
- Storage→Display enum: `tdd) STAGE_DISPLAY="superpowers"` 추가 (execute와 review 사이)
- Step 5 execute) 분기: tdd_mode 조건 분기 + tdd) → sg-review

**.agents/skills/sg-next/SKILL.md + .agents/skills/sg-status/SKILL.md** — skills/ 버전과 동일 변경, `$sg-*` prefix 사용.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

```
grep -c "tdd-complete" hooks/transcript_matcher.cjs → 1  PASS
grep -c "tdd-complete" hooks/stop_hook.cjs → 2  PASS
grep "execute|tdd|review" skills/sg-next/SKILL.md → 2 matches  PASS
grep "execute|tdd|review" skills/sg-status/SKILL.md → 2 matches  PASS
grep -c "tdd_mode" skills/sg-next/SKILL.md → 1  PASS
grep -c "tdd_mode" skills/sg-status/SKILL.md → 1  PASS
grep -c "tdd_mode" .agents/skills/sg-next/SKILL.md → 1  PASS
grep -c "tdd_mode" .agents/skills/sg-status/SKILL.md → 1  PASS
node -e "require('./hooks/transcript_matcher.cjs');" → OK  PASS
node -e "require('./hooks/stop_hook.cjs');" → OK  PASS
```

## Known Stubs

None — no data-flow stubs. All 6 files are complete executable implementations.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond plan's threat model (T-46-04 ~ T-46-06 all accepted with existing mitigations).

## Self-Check: PASSED

- hooks/transcript_matcher.cjs: FOUND
- hooks/stop_hook.cjs: FOUND
- skills/sg-next/SKILL.md: FOUND
- skills/sg-status/SKILL.md: FOUND
- .agents/skills/sg-next/SKILL.md: FOUND
- .agents/skills/sg-status/SKILL.md: FOUND
- Commit f6b565a: verified in git log
- Commit ea434d2: verified in git log
- Commit ec32deb: verified in git log
