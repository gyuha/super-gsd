---
phase: "04"
plan: "01"
subsystem: hooks
tags: [hooks, stop-hook, transcript-matcher, config-guard, auto-advance]
dependency_graph:
  requires: []
  provides: [Stop 훅, SubagentStop 훅, 신호 감지, config guard]
  affects: [hooks/hooks.json, hooks/stop_hook.py, hooks/transcript_matcher.py, .planning/config.json]
tech_stack:
  added: []
  patterns: [Stop 훅 표준 입출력 계약 (hookify), Config Guard 패턴, transcript 기반 신호 감지]
key_files:
  created:
    - hooks/hooks.json
    - hooks/stop_hook.py
    - hooks/transcript_matcher.py
  modified:
    - .planning/config.json
decisions:
  - "파일명 stop_hook.py / transcript_matcher.py — Python 하이픈 포함 파일은 import 불가, 밑줄 사용"
  - "detect_signal GSD 신호 우선 — 두 신호 동시 존재 시 gsd-plan-complete 먼저 반환"
  - "systemMessage만 사용 — decision: block 없음, 훅이 Claude Code 동작을 절대 차단하지 않는다"
  - "load_config fail-open — config.json 없거나 파싱 실패 시 auto_advance=true 기본 적용"
metrics:
  duration: "2m 8s"
  completed_date: "2026-05-15"
  tasks_completed: 3
  files_changed: 4
---

# Phase 04 Plan 01: Auto-Advance Hooks Summary

Stop/SubagentStop 훅 구현 — GSD plan-phase 완료 시 sg-execute, Superpowers review 완료 시 sg-learn을 안내하는 systemMessage를 자동 출력한다.

## 구현 내용

### hooks/hooks.json (Task 1)

Stop과 SubagentStop 두 이벤트를 `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py"` 명령으로 등록했다. timeout 10초 설정으로 훅 행 방지. matcher 없음 — 필터링은 스크립트 내부에서 수행한다.

```
Stop / SubagentStop 이벤트 발생 → python3 ${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py 실행
```

### hooks/transcript_matcher.py (Task 2)

`detect_signal(transcript_path) -> str` 함수. 최근 200줄만 검사해 spurious firing을 방지한다. GSD 신호(`gsd-plan-phase`, `plan-phase complete`, `PLAN.md`)와 Review 신호(`code-reviewer`, `requesting-code-review`, `review complete`)를 감지한다. 모든 파일 오류는 `''` 반환으로 안전 처리.

### hooks/stop_hook.py (Task 3)

표준 Stop 훅 입출력 계약 구현:
- stdin: JSON (transcript_path 포함)
- stdout: JSON (systemMessage 키 또는 빈 {})
- exit: 항상 0 (finally: sys.exit(0))

config guard: `super_gsd.auto_advance: false` 이면 즉시 `{}` 반환. `__file__` 기반 sys.path 주입으로 cwd 무관하게 transcript_matcher import.

흐름:

```
stdin JSON 읽기 → config guard (auto_advance?) → transcript_path 추출 → detect_signal()
    ↓ gsd-plan-complete              ↓ superpowers-review-complete     ↓ ''
sg-execute 안내                   sg-learn 안내                     {} 출력
```

### .planning/config.json (Task 3)

기존 키 보존하면서 `super_gsd.auto_advance: true` 최상위 키 추가. `workflow.auto_advance`(GSD 자체 설정)와 네임스페이스 분리.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 파일명 transcript-matcher.py → transcript_matcher.py**
- **발견 시점:** Task 2 verify 단계
- **문제:** Python은 하이픈을 포함한 파일명을 `import` 할 수 없다. PLAN.md verify 코드가 `from transcript_matcher import detect_signal`을 사용하므로 파일명에 밑줄이 필요.
- **수정:** 파일명을 `transcript_matcher.py`로 생성.
- **파일:** hooks/transcript_matcher.py

**2. [Rule 1 - Bug] 파일명 stop-hook.py → stop_hook.py**
- **발견 시점:** Task 3 verify 단계
- **문제:** 동일 원인 — PLAN.md verify 코드가 `import stop_hook`을 사용.
- **수정:** 파일명을 `stop_hook.py`로 생성. hooks.json command 경로도 `stop_hook.py`로 업데이트.
- **파일:** hooks/stop_hook.py, hooks/hooks.json

## 커밋 이력

| Task | Hash | 내용 |
|------|------|------|
| 1 | 341cebf | feat(04-01): register Stop + SubagentStop hooks in hooks.json |
| 2 | 8f3dc42 | feat(04-01): add transcript_matcher.py signal detection utility |
| 3 | 610cf27 | feat(04-01): add stop_hook.py + patch config.json with super_gsd key |

## Self-Check: PASSED

- hooks/hooks.json: FOUND
- hooks/stop_hook.py: FOUND
- hooks/transcript_matcher.py: FOUND
- .planning/config.json: FOUND
- 커밋 341cebf: FOUND
- 커밋 8f3dc42: FOUND
- 커밋 610cf27: FOUND
