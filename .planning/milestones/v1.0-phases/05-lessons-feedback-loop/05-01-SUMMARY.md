---
phase: "05-lessons-feedback-loop"
plan: "01"
subsystem: "hooks"
tags: ["hookify", "lessons", "stop-hook", "transcript-matcher", "feedback-loop"]
dependency_graph:
  requires: []
  provides: ["hookify-complete 신호 감지", ".planning/lessons/ 자동 저장", "LESS-01"]
  affects: ["hooks/transcript_matcher.py", "hooks/stop_hook.py"]
tech_stack:
  added: ["datetime (stdlib)", "re (stdlib)"]
  patterns: ["신호 감지 체인 확장 (GSD→Review→Hookify)", "lessons 파일 자동 영속화"]
key_files:
  modified:
    - path: "hooks/transcript_matcher.py"
      change: "HOOKIFY_SIGNALS 상수 추가 + hookify-complete 반환 분기 추가"
    - path: "hooks/stop_hook.py"
      change: "save_hookify_lessons() + _read_current_phase() + _extract_hookify_output() + hookify-complete 분기 추가"
decisions:
  - "hookify-complete 신호 우선순위를 GSD → Review → Hookify 순서로 고정 (기존 두 신호 회귀 방지)"
  - "같은 날 같은 phase 중복 실행 시 기존 파일 유지 (idempotency — 덮어쓰기 금지)"
  - "_extract_hookify_output()에서 마커 없으면 최근 200줄 전체 반환 (내용 손실 방지)"
  - "모든 헬퍼 함수에서 Exception catch → '' / 'unknown' 반환 (T-05-03 mitigate)"
metrics:
  duration: "~8min"
  completed_date: "2026-05-15"
  tasks_completed: 2
  files_modified: 2
---

# Phase 05 Plan 01: transcript_matcher + stop_hook Hookify 완료 감지 및 lessons 영속화 Summary

Hookify 완료 신호(`hookify-complete`)를 감지하고 `.planning/lessons/{NN}-{YYYY-MM-DD}.md`에 자동 저장하는 파이프라인 — stdlib만 사용, exit 0 항상 보장.

## 구현 내용

### Task 1: transcript_matcher.py 확장 (커밋: a0e232b)

`detect_signal()`이 세 번째 신호 `'hookify-complete'`를 반환하도록 확장했다.

- 모듈 docstring과 함수 docstring의 반환값 명세를 업데이트했다.
- `HOOKIFY_SIGNALS` 상수를 `REVIEW_SIGNALS` 아래에 추가했다 (`hookify`, `Retrospective complete`, `hooks generated`, `patterns extracted`).
- 신호 감지 우선순위: `GSD_PLAN → REVIEW → HOOKIFY` 순서를 유지했다.

### Task 2: stop_hook.py 확장 (커밋: 5de6f9e)

세 개의 헬퍼 함수와 `hookify-complete` 분기를 추가했다.

**헬퍼 함수:**
- `_read_current_phase()`: `.planning/STATE.md`에서 `^Phase:\s*(\S+)` 패턴으로 현재 phase를 읽는다. 실패 시 `'unknown'` 반환.
- `_extract_hookify_output(transcript_path)`: transcript 마지막 200줄에서 `## Lessons`, `## Patterns`, `## Hooks Generated`, `hookify complete` 마커를 역방향 탐색해 이후 텍스트를 반환한다. 마커 없으면 최근 200줄 전체 반환.
- `save_hookify_lessons(transcript_path)`: phase 번호와 날짜로 파일명을 결정하고 `.planning/lessons/` 에 저장한다. 이미 존재하면 경로만 반환(idempotency).

**hookify-complete 분기:**
- 기존 `else:` 앞에 `elif signal == 'hookify-complete':` 분기를 삽입했다.
- 레슨 파일 저장 성공 시 파일 경로를 포함한 안내 메시지, 실패 시 간단한 안내 메시지를 `systemMessage`로 출력한다.
- `finally: sys.exit(0)` 패턴은 변경하지 않아 모든 경로에서 exit 0을 보장한다.

## 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| `hookify-complete` 감지 테스트 | PASS |
| 기존 `gsd-plan-complete` 회귀 테스트 | PASS |
| `_read_current_phase()` 반환값 | `'05'` (STATE.md 정상 읽기) |
| `save_hookify_lessons()` 파일 생성 | PASS (`.planning/lessons/05-2026-05-16.md`) |
| docstring에 `hookify-complete` 포함 | 확인 |
| `grep -c 'hookify-complete' transcript_matcher.py` | 3 |
| `grep -c 'hookify-complete' stop_hook.py` | 1 |
| `grep -c 'save_hookify_lessons' stop_hook.py` | 2 (정의 + 호출) |
| 빈 stdin 전달 시 exit 0 | 확인 (`{}` 출력 후 exit 0) |

## 성공 기준 달성 여부

1. Hookify 완료 transcript가 주어지면 `.planning/lessons/{NN}-{YYYY-MM-DD}.md`를 생성한다 — **달성**
2. 같은 날 같은 phase에서 두 번 실행해도 파일이 한 개만 존재한다 — **달성** (기존 파일 존재 시 조기 반환)
3. lessons 저장 실패가 Claude Code 동작을 차단하지 않는다 — **달성** (`finally: sys.exit(0)` + Exception → `''` 반환)
4. `auto_advance: false` 설정 시 `hookify-complete` 분기도 실행되지 않는다 — **달성** (기존 config guard가 진입 전에 종료)

## Deviations from Plan

없음 — 플랜대로 정확히 실행됨.

## Known Stubs

없음.

## Threat Flags

없음 — 새로 도입된 네트워크 엔드포인트, 외부 인증 경로 없음. 위협 모델의 T-05-01(transcript 파일 읽기 실패 → `''` 반환)과 T-05-03(exit 0 보장)을 구현했다.

## Self-Check: PASSED

- `hooks/transcript_matcher.py` — 존재 확인
- `hooks/stop_hook.py` — 존재 확인
- 커밋 a0e232b — 존재 확인
- 커밋 5de6f9e — 존재 확인
