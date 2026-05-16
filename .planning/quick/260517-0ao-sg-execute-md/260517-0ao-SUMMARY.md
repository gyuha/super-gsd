---
quick_task: 260517-0ao
files_modified:
  - commands/sg-execute.md
commit: 628750c
date: 2026-05-17
---

# Quick Task 260517-0ao: sg-execute.md 버그 4건 수정

commands/sg-execute.md의 런타임 오류 유발 버그 2건과 기능 누락 이슈 2건을 수정했다.

## 수정 내용

### Bug 1 — Step 8 FROM_STAGE awk 컬럼 오류 (Task 1)

HANDOFF.md 스키마 `| Timestamp | Phase | From | To | Plan Hash |` 기준으로 awk -F'|' 시 $4=From, $5=To 이다. 기존 코드가 $5(To 컬럼)를 읽어 이전 핸드오프의 출발지 대신 목적지를 기록하는 버그가 있었다. `$5` → `$4`로 수정.

### Bug 2 — Step 7 EXISTING_HASH grep false-positive (Task 2)

`[^|]*${PHASE_NUM}[^|]*` 패턴은 PHASE_NUM=1일 때 "01-scaffold", "11-whatever" 등 숫자 1을 포함하는 모든 Phase 셀에 매칭되는 false-positive 문제가 있었다. Step 2에서 이미 계산된 `${PHASE_PAD}-` 앵커 패턴으로 교체하여 패딩된 슬러그만 정확히 매칭하도록 수정.

### Issue 3 — Step 3 bash 스니펫 누락 (Task 3)

Step 3는 ROADMAP.md에서 추출할 변수(PHASE_NAME, GOAL, REQ_IDS, SC_TEXT)를 bullet 설명만 나열하고 구체적인 파싱 코드가 없었다. 실행 Claude가 임의로 구현할 여지를 없애기 위해 bash 스니펫을 Step 3 설명 바로 아래에 삽입.

### Issue 4 — frontmatter description 스킬 이름 오류 (Task 4)

description 필드가 존재하지 않는 `sg-executing-plans`를 참조하고 있었다. Step 9와 success_criteria에서 이미 올바르게 사용 중인 `superpowers:executing-plans`로 통일.

## 검증

```
Task 1: grep -n 'gsub.*\$4.*print.*\$4' commands/sg-execute.md | grep FROM_STAGE
→ 88: FROM_STAGE=$(... '{gsub(/ /,"",$4); print $4}')

Task 2: grep -n 'EXISTING_HASH' commands/sg-execute.md | grep 'PHASE_PAD-'
→ 73: EXISTING_HASH=$(grep -E "^\| [^|]+ \| ${PHASE_PAD}-[^|]* ...

Task 3: grep -n 'PHASE_NAME\|GOAL=\|REQ_IDS\|SC_TEXT' commands/sg-execute.md
→ 44, 47, 48, 51번 라인에 스니펫 존재

Task 4: grep -n 'description:' commands/sg-execute.md | head -1
→ superpowers:executing-plans 확인
```

## 이탈 없음

플랜대로 4건 수정, 단일 커밋(628750c). 추가 변경 없음.
