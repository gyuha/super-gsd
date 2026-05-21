# Phase 17 Context: PLAN.md 의존성 분석

## Phase Goal
sg-execute가 PLAN.md의 wave/depends_on/files_modified 구조를 파싱하여 병렬 실행 가능 여부와 PARALLEL_GROUPS를 자동 결정한다.

## Gray Area Decisions

### 1. 파싱 구현 위치
**결정:** 인라인 Bash (sg-execute.md Step 8.5)
**이유:** sg-execute.md는 이미 bash 스니펫 위주 구조. files_modified 교집합 계산도 `sort`+`comm` 패턴으로 충분. 별도 Python 파일 추가 시 의존성 + 호출 오버헤드 발생.

### 2. PARALLEL_GROUPS 전달 방식
**결정:** 임시 JSON 파일 (`.planning/phases/NN-*/parallel_groups.json`)
**이유:** 환경변수는 큰 데이터 부적합. 인라인 문자열은 복잡. JSON 파일은 디버깅 용이, Phase 18 스킬이 Read tool로 직접 읽기 가능.

### 3. 의존성 그래프 알고리즘
**결정:** `wave` 숫자 기반 단순 그룹화 (depends_on은 검증용만)
**이유:** 실제 PLAN.md들은 wave 1/2로 명확히 구분됨. 위상 정렬은 v1.4에서 과도한 복잡성. wave 동일 + files_modified 비교집합 = 같은 병렬 그룹.

### 4. 폴백 출력
**결정:** 한 줄 로그 "병렬 그룹 감지 안됨 — 기존 순차 실행" 후 폴백
**이유:** 완전히 조용한 폴백은 사용자가 병렬 실행이 왜 안 되는지 알 수 없음. 한 줄 로그로 투명성 확보.

## Implementation Scope

- `commands/sg-execute.md`: Step 8.5 추가 (frontmatter 파싱 + PARALLEL_GROUPS 계산 + JSON 저장)
- `commands/sg-execute.md`: Step 9 라우팅 수정 (PARALLEL_GROUPS 2개 이상이면 Phase 18 스킬로, 아니면 기존 경로)
- 기존 idempotency 검사, HANDOFF 기록, lessons 주입 로직: 변경 없음

## Constraints
- non-invasive: GSD/Superpowers 파일 수정 금지
- wave 없는 PLAN.md는 기존 동작 완전 보존 (TE-05a)
- macOS(BSD)/Linux(GNU) 셸 이식성 유지
