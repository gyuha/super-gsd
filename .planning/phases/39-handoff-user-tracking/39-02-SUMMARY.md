# 39-02 SUMMARY: sg-status --team 플래그 추가

## 변경 파일

- `skills/sg-status/SKILL.md`
- `.agents/skills/sg-status/SKILL.md`

## 변경 내용

두 파일의 `<process>` 블록 첫 번째 Step 앞에 **Step 0** 을 삽입했다. Step 0은 `$ARGUMENTS`에 `--team`이 포함된 경우에만 실행되며, 포함되지 않으면 즉시 Step 1로 건너뛴다.

**Step 0 동작:**

1. `.planning/HANDOFF.md`에서 타임스탬프로 시작하는 행 중 `$7`(User 컬럼) 값이 비어 있지 않고 `-`가 아닌 행을 추출한다.
2. 데이터가 있으면 팀원별 최신 행을 awk로 집계하여 마크다운 테이블(`팀원 | 최근 Phase | 최근 Stage | 마지막 활동`)을 출력하고 `exit 0`한다.
3. HANDOFF User 컬럼 데이터가 없으면 `git log` 기반 fallback 테이블을 출력한다.
4. git log도 없으면 안내 메시지를 출력한다.

`<success_criteria>` 블록에 항목 4, 5(skills 버전) 및 7, 8(.agents 버전)을 추가하여 --team 플래그 분기 동작을 명시했다.

## 검증 결과

| 검사 항목 | skills/ | .agents/ |
| --------- | ------- | -------- |
| `--team` 등장 횟수 | 4 | 4 |
| `exit 0` 존재 | 78, 216행 | 85, 231행 |
| `팀 현황` 출력 문자열 존재 | O | O |
| `$7` 사용 (User 컬럼) | O | O |
| `users[$6]` 오사용 없음 | 0건 | 0건 |
