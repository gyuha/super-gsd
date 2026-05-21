# Phase 18: sg-parallel-execute 스킬 + 라우팅 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 18-sg-parallel-execute
**Areas discussed:** SKILL.md 입력 인터페이스, 병렬 Task() 디스패치 구조, 에이전트 내부 실행, Step 9 활성화, SKILL.md 위치

---

## SKILL.md 입력 인터페이스

| Option | Description | Selected |
|--------|-------------|----------|
| 파일 경로 전달 | `$ARGUMENTS`로 `parallel_groups.json` 경로를 받음 | ✓ |
| 인라인 JSON | JSON 문자열을 직접 args로 전달 | |
| 환경변수 | 별도 env var 설정 | |

**Decision:** 파일 경로 전달
**Notes:** Phase 17 CONTEXT.md의 설계 결정과 일치. sg-execute.md Step 9 TODO 주석(`args="$GROUPS_JSON_FILE"`)과 자연스럽게 연결됨.

---

## 병렬 Task() 디스패치 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 동시 Task() 병렬 | min(GROUP_COUNT, 3)개의 Task()를 동시 실행 | ✓ |
| 순차 Task() | Task()를 하나씩 순서대로 실행 | |
| Python subprocess | Python으로 병렬 프로세스 관리 | |

**Decision:** 동시 Task() 병렬, 상한 3개
**Notes:** TE-03a 요건. GROUP_COUNT > 3이면 wave 오름차순 앞 3개 그룹만 병렬, 나머지는 순차.

---

## 에이전트 내부 실행

| Option | Description | Selected |
|--------|-------------|----------|
| bare Task() 직접 구현 | PLAN.md 읽어 직접 태스크 실행, superpowers 미호출 | ✓ |
| superpowers:executing-plans 위임 | 기존 스킬 재사용 | |

**Decision:** bare Task() 직접 구현
**Notes:** TE-02b 요건 명시. superpowers:executing-plans는 STATE.md/HANDOFF.md 쓰기 + finishing-a-development-branch 포함 → N번 실행 시 race condition.

---

## sg-execute.md Step 9 활성화

| Option | Description | Selected |
|--------|-------------|----------|
| TODO 주석 → 실제 Skill() 호출 교체 | 임시 echo 제거 + 실제 호출 추가 | ✓ |
| 새 Step 추가 | Step 9를 건드리지 않고 Step 9.1 추가 | |

**Decision:** TODO 주석 라인을 실제 Skill() 호출로 교체, 임시 echo 4줄 제거
**Notes:** Phase 17이 삽입한 블록의 정확한 위치를 파악하고 외과적으로 수정.

---

## Claude's Discretion

- Task() 프롬프트의 정확한 언어(한글/영문 혼용 비율)
- parallel_groups.json JSON 파싱 방법 (Read tool 권장)
- PLAN.md 파일 경로 resolve 방법

## Deferred Ideas

- worktree 격리 (v1.4 이후)
- 자동 재시도 (Phase 19 이후)
- GROUP_COUNT > 3 처리 전략 고도화
- HANDOFF.md 기록 병렬 완료 후 처리 (Phase 19 범위)
