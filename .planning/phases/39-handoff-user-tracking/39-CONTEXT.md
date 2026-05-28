---
phase: 39
slug: handoff-user-tracking
title: "팀원 작업 이력 HANDOFF 자동 기록 + sg-status --team"
milestone: v2.8
requirements:
  - TEAM-01
  - TEAM-02
status: context-done
created: 2026-05-28
---

# Phase 39 컨텍스트: 팀원 작업 이력 HANDOFF 자동 기록 + sg-status --team

## 목표

팀원의 작업 이력이 HANDOFF.md에 자동 기록되고, `sg-status --team`으로 팀 현황을 조회할 수 있다.

---

## 결정 사항

### A. HANDOFF.md User 컬럼 추가 방식

**결정: 선택적 6번째 컬럼 추가 (스키마 버전 없음)**

기존 스키마:
```
| Timestamp | Phase | From | To | Plan Hash |
```

신규 스키마:
```
| Timestamp | Phase | From | To | Plan Hash | User |
```

- `User` = `git config user.name` 값 (sg-* 명령 실행 시 자동 주입)
- 기존 5열 행은 awk에서 `$6`이 빈 문자열로 자동 처리 → **완전 하위 호환**
- 스키마 버전 필드 도입 불필요. 파서가 열 수 차이를 이미 허용함
- `User` 값이 없거나 git user.name 미설정 시 `-`로 기록 (Plan Hash와 동일 관례)

근거: `awk -F'|' '{print $6}'`은 열이 5개뿐인 행에서도 에러 없이 빈 문자열을 반환한다. 혼합 스키마는 파서 수정 없이 허용된다.

---

### B. sg-status --team 데이터 소스와 표시 형식

**결정: primary = HANDOFF.md User 컬럼, secondary = git log 작성자**

**우선순위 로직:**

```
sg-status --team 실행
  ↓
HANDOFF.md에서 User 컬럼($6)이 있는 행 수집
  ↓
User 컬럼 있음 → 집계하여 팀 테이블 출력
User 컬럼 없음 (전부 5열 구행) → git log fallback
  ↓ (fallback)
git log --format="%an|%ai|%s" 최근 N개 커밋에서 작성자 집계
  ↓
둘 다 데이터 없음 → "팀 이력 없음" 안내 메시지
```

**출력 형식:**

```
## 팀 현황

| 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |
| ---- | --------- | --------- | ---------- |
| Alice | 39-handoff-user-tracking | superpowers | 2026-05-28T10:00Z |
| Bob   | 38-...     | review     | 2026-05-27T18:30Z |
```

- 팀원별로 가장 최근 행 1개씩 표시
- `phase/* 브랜치 분석`은 TEAM-02 요구사항 원문이나, 실제 구현에서는 브랜치 존재 여부가 불안정함. HANDOFF.md User 컬럼이 더 신뢰할 수 있는 단일 소스임
- git branch 기반 분석은 보조 참고용으로만 사용 (User 컬럼 없을 때 fallback)

---

### C. .gitignore 수정 필요성

**결정: .gitignore 수정 불필요**

이 phase에서 새로 생기는 파일:
- `HANDOFF.md` — 기존 계획 아티팩트, 이미 추적 중. `User` 컬럼 추가는 내용 변경이지 신규 파일이 아님
- 신규 임시 파일 없음. 중간 산출물(캐시, 락 파일 등) 없음

`HANDOFF.md`에 `git user.name`이 들어가는 것은 의도된 동작이며 커밋 대상이 맞다. 개인정보 민감도는 git log 작성자 정보와 동일 수준.

`.gitignore` 현재 상태로 충분함. 수정하지 않는다.

---

### D. 기존 HANDOFF.md 하위 호환성

**결정: 혼합 스키마 허용, 마이그레이션 없음**

- 기존 5열 행 + 신규 6열 행이 같은 파일에 공존
- `awk -F'|' '{gsub(/ /,"",$6); print $6}'`은 5열 행에서 빈 문자열 반환 → 파싱 에러 없음
- `sg-status`의 기존 `awk -F'|' '{gsub(/ /,"",$5); print $5}'`(Plan Hash 추출)은 6열 행에서도 동일하게 동작 → **sg-status 수정 불필요**
- 기존 행 소급 수정(마이그레이션) 없음

---

## 구현 범위

**TEAM-01: HANDOFF.md 자동 기록**

변경 대상 skills (sg-* 명령이 HANDOFF.md에 행을 append하는 모든 곳):
- `skills/sg-plan/SKILL.md` — gsd-plan 단계 진입 시 User 컬럼 추가
- `skills/sg-execute/SKILL.md` — superpowers 단계 진입 시
- `skills/sg-review/SKILL.md` — review 단계 진입 시
- `skills/sg-learn/SKILL.md` — sg-retro 단계 진입 시
- `skills/sg-ship/SKILL.md` — ship 단계 진입 시
- `skills/sg-complete/SKILL.md` — complete 단계 진입 시
- `skills/sg-next/SKILL.md` — sg-next 전이 시

User 컬럼 추출 공통 스니펫:
```bash
GIT_USER=$(git config user.name 2>/dev/null || echo "-")
[ -z "$GIT_USER" ] && GIT_USER="-"
```

**.agents/ 동일 파일 포함 (CLAUDE.md 컨벤션):** 위 목록의 각 SKILL.md에 대해 `.agents/skills/sg-*/SKILL.md`도 동일하게 수정한다.

**TEAM-02: sg-status --team**

- `skills/sg-status/SKILL.md`에 `--team` 플래그 처리 로직 추가
- `--team` 없을 때: 기존 동작 완전 유지 (sg-status 하위 호환)
- `--team` 있을 때: HANDOFF.md User 컬럼 기반 팀 테이블 출력

---

## 제외 범위

- HANDOFF.md 기존 행 소급 수정 없음
- `stop_hook.cjs` / `rule_runner.cjs` 수정 없음 (hooks는 User 컬럼 무관)
- TEAM.md 파일 신규 생성 없음 (요구사항에 없음)
- git branch 기반 분석은 구현하지 않음 (HANDOFF User 컬럼으로 대체)

---

## 데이터 흐름

```
sg-* 명령 실행
  → git config user.name 읽기
  → HANDOFF.md에 6열 행 append
         | timestamp | phase | from | to | plan_hash | user |

sg-status --team
  → HANDOFF.md 전체 읽기
  → $6 컬럼(User) 있는 행만 선별
  → 팀원별 최신 행 1개씩 집계
  → 팀 현황 테이블 출력
```

---

## 검증 기준

1. `sg-plan` 실행 후 HANDOFF.md 마지막 행에 `| git user.name |` 6번째 컬럼이 존재
2. 기존 5열 행과 신규 6열 행이 혼재해도 `sg-status`(--team 없이)가 오류 없이 동작
3. `sg-status --team` 실행 시 팀원별 최근 작업 테이블 출력
4. git user.name 미설정 환경에서는 `-`로 기록되고 --team 출력에서도 처리됨
5. `.agents/` 하위 동일 SKILL.md 파일도 동일하게 수정됨
