---
phase: "05-lessons-feedback-loop"
plan: "02"
subsystem: "commands"
tags: ["sg-lessons", "sg-plan", "lessons-injection", "feedback-loop", "LESS-02"]
dependency_graph:
  requires: ["05-01 — .planning/lessons/ 자동 저장"]
  provides: ["sg-lessons 명령", "sg-plan Step 0 prior lessons 자동 주입", "LESS-02"]
  affects: ["commands/sg-lessons.md", "commands/sg-plan.md"]
tech_stack:
  added: []
  patterns: ["자기완결형 명령 (reads only)", "Step 0 선제 컨텍스트 주입"]
key_files:
  created:
    - path: "commands/sg-lessons.md"
      change: "sg-lessons 명령 신규 생성 — .planning/lessons/*.md 읽기 + phase 필터 + 안내 메시지"
  modified:
    - path: "commands/sg-plan.md"
      change: "Step 0 추가 — prior lessons 자동 주입 (파일 없으면 조용히 건너뜀)"
decisions:
  - "sg-lessons는 쓰기 없는 reads-only 명령 — 위협 모델 T-05-04/T-05-05 accept 결정과 일치"
  - "sg-plan Step 0은 파일 없을 때 조용히 건너뜀 — 기존 워크플로우 방해 최소화"
  - "success_criteria 항목 0번을 기존 1/2/3번 앞에 추가하여 번호 체계 유지"
metrics:
  duration: "~5min"
  completed_date: "2026-05-16"
  tasks_completed: 2
  files_modified: 2
---

# Phase 05 Plan 02: sg-lessons 명령 + sg-plan Step 0 prior lessons 자동 주입 Summary

sg-lessons 신규 명령으로 `.planning/lessons/*.md` 출력 + phase 필터 제공, sg-plan Step 0으로 다음 GSD 계획 시 이전 lessons를 자동 컨텍스트로 주입 — LESS-02 완료.

## 구현 내용

### Task 1: commands/sg-lessons.md 신규 생성 (커밋: d7101dd)

`/super-gsd:sg-lessons` 명령을 새로 만들었다. sg-status.md frontmatter 패턴을 따라 4개 섹션(objective, execution_context, process, success_criteria)으로 구성했다.

- `ls .planning/lessons/*.md 2>/dev/null | sort`로 파일 목록 수집
- 파일 없으면 `No lessons recorded yet.` 안내 메시지 출력 후 종료
- `$ARGUMENTS`로 phase 번호 필터 지원 (`printf "%02d"` zero-padding)
- 필터 후 빈 목록이면 `No lessons found for phase $ARGUMENTS.` 출력 후 종료
- 각 파일을 `--- $FILE ---` 헤더와 함께 순서대로 출력
- 마지막에 `Lessons loaded. Run /super-gsd:sg-plan...` 안내 메시지 출력

### Task 2: commands/sg-plan.md Step 0 추가 (커밋: 116e386)

기존 `1. **Resolve phase.**` 앞에 Step 0을 삽입했다. 기존 Step 1/2/3/4는 번호와 내용 모두 변경 없음.

```
0. **Prior lessons 주입.** .planning/lessons/ 아래 Markdown 파일이 있으면 내용을 먼저 출력한다:
   if ls .planning/lessons/*.md 2>/dev/null | head -1 | grep -q .; then
     echo "=== Prior Lessons (auto-injected) ==="
     cat .planning/lessons/*.md
     echo "=== End of Prior Lessons ==="
   fi
   파일이 없으면 이 단계를 조용히 건너뛴다.
```

success_criteria에 항목 0을 추가하여 Step 0 동작을 명시했다. 기존 1/2/3 번호는 변경하지 않았다.

## 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| `commands/sg-lessons.md` 존재 | PASS |
| `grep -c 'sg-lessons' commands/sg-lessons.md` | 1 |
| `grep -c '.planning/lessons' commands/sg-lessons.md` | 5 |
| `argument-hint`에 phase 언급 | PASS |
| `grep 'Prior lessons' commands/sg-plan.md` | PASS |
| `grep -c 'Step 1/2' commands/sg-plan.md` | 2 (기존 유지) |
| 학습 루프 smoke test | PASS |

## 성공 기준 달성 여부

1. /super-gsd:sg-lessons 명령이 .planning/lessons/ 파일 내용을 출력한다. 파일 없으면 안내 메시지를 출력한다 — **달성**
2. /super-gsd:sg-plan 실행 시 .planning/lessons/ 에 파일이 있으면 Step 0에서 자동으로 내용을 출력하고, 없으면 조용히 건너뛴다 — **달성**
3. GSD → Superpowers → Hookify → next GSD 사이클에서 lessons 파일이 자동 생성(05-01)되고 sg-plan에서 자동 주입(05-02)되어 수동 컨텍스트 전달이 불필요하다 — **달성**

## Deviations from Plan

없음 — 플랜대로 정확히 실행됨.

## Known Stubs

없음.

## Threat Flags

없음 — 새로 도입된 네트워크 엔드포인트, 외부 인증 경로 없음. T-05-04(sg-lessons 출력: accept)와 T-05-05(sg-plan Step 0 cat: accept, 읽기 전용) 모두 계획대로 accept 처리.

## Self-Check: PASSED

- `commands/sg-lessons.md` — 존재 확인
- `commands/sg-plan.md` — Step 0 삽입 확인
- 커밋 d7101dd — 존재 확인
- 커밋 116e386 — 존재 확인
