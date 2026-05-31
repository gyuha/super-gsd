# Phase 47 — Plan 01 Summary: sg-execute TDD 주입 + 재시도 경로

**Completed:** 2026-06-01
**Requirements:** EXEC-01, EXEC-02, EXEC-03

## What was changed

`skills/sg-execute/SKILL.md` (primary) + `.agents/skills/sg-execute/SKILL.md` (mirror), 한 커밋 (pairwise D-08).

### Primary `skills/sg-execute/SKILL.md`
- **Step 7 retry-bypass (D-02):** 기존 same-hash `exit 0` short-circuit을 `RETRY_BYPASS` 가드로 감쌌다. `.planning/USE-TDD-RETRY`가 존재하면 `RETRY_BYPASS=1` → short-circuit 미발동(같은 plan hash 재실행 허용). 파일 부재 시 no-op — 기존 동작 byte-identical. 기존 grep -E/awk -F'|' 추출 라인은 변경하지 않음.
- **Step 9 sequential 주입 (D-03/D-02):** parallel routing `return` **이후**에만 실행(병렬 경로 무손상). 마커 감지 bash(`[ -f .planning/USE-TDD ]`, `tail -n +2 .planning/USE-TDD-RETRY`) 추가 후, 블롭에 2개 조건부 섹션:
  - `[ -f .planning/USE-TDD-RETRY ]` → `## Previous Test Failures — Fix First` 섹션(피드백 본문) 을 `## Plans` 앞에 prepend
  - `[ -f .planning/USE-TDD ]` → `## Instruction to Superpowers`에 `superpowers:test-driven-development` Red-first 지시 2줄 append
  - 두 마커 모두 부재 시 블롭 byte-identical (EXEC-02)

### Mirror `.agents/skills/sg-execute/SKILL.md`
- Step 7 retry-bypass 동일 가드 추가 (단, mirror는 `execute` To-stage grep 유지 — 변경 없음).
- Step 9 Direct Implementation Instructions에 동일 마커 게이트 prose 주입. `superpowers:test-driven-development` Skill 호출은 사용 불가 플랫폼이므로 **prose로 Red-first 규율만 참조**(Skill handoff 없음, Platform Constraints 일관).

## USE-TDD-RETRY 직렬화 규약 (47-02가 반드시 일치시킬 것)

```
line 1     : 정수 retry count (예: "1")
lines 2..N : 마지막 리뷰 FAIL 피드백 본문 (자유 텍스트, 여러 줄 허용)
```

- **count 읽기:** `head -1 .planning/USE-TDD-RETRY`
- **feedback 본문 읽기:** `tail -n +2 .planning/USE-TDD-RETRY` (47-01 sg-execute가 fix-first 섹션에 주입할 때 이 방식 사용)
- 플레인 텍스트, human-readable, **NOT JSON**. 포터블 셸로 파싱 가능(no grep -P).
- 47-02 sg-review는 이 규약대로 써야 한다: line 1에 count+1, lines 2+에 FAIL 피드백.

## Verification (PLAN `<verify>` 게이트 전부 통과)

**primary:**
- PASS: test-driven-development + USE-TDD-RETRY + "Previous Test Failures" + USE-TDD 존재, grep -P 0건
- GATED-PASS: `[ -f .planning/USE-TDD ]` gate(line 306) < td-dev directive(line 357) — 마커 부재 시 미렌더
- RETRY-GATED-PASS: `[ -f .planning/USE-TDD-RETRY ]` gate(line 143) < "Previous Test Failures"(line 349)
- td-dev directive at line 357 (> parallel return), parallel block 무손상, 기존 executing-plans 라인 무손상

**mirror:**
- PASS: USE-TDD-RETRY + USE-TDD + red-first phrase + "Previous Test Failures" 존재, grep -P 0건
- GATED-PASS: USE-TDD gate(155) < Red directive(196)
- no `superpowers:test-driven-development` Skill() 호출(Platform Constraints 일관), execute-stage grep 무손상

## 비침투 보장 (EXEC-02)

두 마커 모두 부재 시: Step 7 가드는 no-op, Step 9 주입 0줄 → sg-execute 출력이 기존과 동일. 병렬 경로(sg-parallel-execute)는 일절 변경되지 않음(주입은 sequential `return` 이후에만).

## Out of scope
- sg-review 검증/실패 루프 — Plan 47-02
- 병렬 경로 TDD 주입 — Future (D-03)
