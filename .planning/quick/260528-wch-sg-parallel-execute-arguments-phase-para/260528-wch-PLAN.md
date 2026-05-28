---
phase: quick-260528-wch
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/sg-parallel-execute/SKILL.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "$ARGUMENTS가 숫자(예: '2', '02', '2.1')이면 .planning/phases/*-*/parallel_groups.json 경로를 자동 탐색한다"
    - "파일 경로가 직접 전달되는 기존 방식은 그대로 동작한다"
    - "매칭되는 phase 디렉토리가 없으면 명확한 오류 메시지를 출력하고 종료한다"
  artifacts:
    - path: skills/sg-parallel-execute/SKILL.md
      provides: "Step 1.5 — phase 번호 → 파일 경로 변환 로직"
      contains: "PHASE_PAD"
  key_links:
    - from: "$ARGUMENTS (숫자)"
      to: "GROUPS_JSON_FILE (절대 경로)"
      via: "glob 탐색: .planning/phases/${PHASE_PAD}-*/parallel_groups.json"
      pattern: "PHASE_PAD"
---

<objective>
sg-parallel-execute SKILL.md의 Step 1(입력 검증)과 Step 2(파일 읽기) 사이에, $ARGUMENTS가 phase 번호인 경우 parallel_groups.json 파일 경로를 자동으로 탐색하는 스텝을 삽입한다.

Purpose: $ARGUMENTS로 파일 경로 대신 phase 번호(예: '2', '02', '2.1')를 전달했을 때 발생하는 "Cannot read parallel_groups.json at 2" 오류를 수정한다.
Output: skills/sg-parallel-execute/SKILL.md — Step 1.5 추가
</objective>

<execution_context>
@/Users/gyuha/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/Users/gyuha/workspace/super-gsd/skills/sg-parallel-execute/SKILL.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Step 1과 Step 2 사이에 phase 번호 → 파일 경로 변환 스텝 삽입</name>
  <files>skills/sg-parallel-execute/SKILL.md</files>
  <action>
Step 1 블록(`**Step 1 — Input validation.**` 전체)과 Step 2 블록(`**Step 2 — Read parallel_groups.json.**`) 사이에 `**Step 1.5 — phase 번호 → 파일 경로 변환.**` 스텝을 추가한다.

삽입 위치: Step 1 bash 코드블록(exit 1 포함) 직후, `**Step 2`  줄 직전.

삽입할 스텝의 내용:

- `$ARGUMENTS`가 정수 또는 소수점 숫자 패턴(`^[0-9]+(\.[0-9]+)?$`)에 매칭되면 phase 번호로 해석한다.
- PHASE_PAD: 정수 부분을 2자리 zero-padding한다. 소수점이 있으면 `02.1` 형식으로 붙인다.
  - 예: `2` → `02`, `02` → `02`, `2.1` → `02.1`, `10` → `10`
- glob 패턴 `.planning/phases/${PHASE_PAD}-*/parallel_groups.json`으로 파일을 탐색한다.
- 매칭 결과가 없으면 아래 오류를 출력하고 종료한다:
  `[sg-parallel-execute] Error: No parallel_groups.json found for phase ${PHASE_PAD} under .planning/phases/`
- 매칭 결과가 2개 이상이면 첫 번째 경로를 사용하고 아래 경고를 출력한다:
  `[sg-parallel-execute] Warning: Multiple matches found for phase ${PHASE_PAD}; using <첫번째 경로>`
- 매칭 성공 시 `GROUPS_JSON_FILE`을 탐색된 경로로 설정한다.
- `$ARGUMENTS`가 숫자 패턴에 매칭되지 않으면(파일 경로가 직접 전달된 경우) 이 스텝은 아무것도 하지 않고 `GROUPS_JSON_FILE="$ARGUMENTS"` 값을 그대로 유지한다.

Step 2의 첫 문장(`Read the file at the \`$ARGUMENTS\` path`)을 `Read the file at the \`$GROUPS_JSON_FILE\` path`로 수정하여 변환된 경로를 사용하도록 한다. Step 2 bash 코드 블록은 없으므로 텍스트만 수정한다.

코드 스니펫은 SKILL.md 내 기존 bash 코드블록 스타일(```bash)을 따른다. 로직은 프로세스 지시문(산문 + bash 예시)으로 작성하며, Claude가 직접 실행하는 형태로 기술한다.
  </action>
  <verify>
    <automated>grep -n "PHASE_PAD" /Users/gyuha/workspace/super-gsd/skills/sg-parallel-execute/SKILL.md | grep -c "PHASE_PAD"</automated>
  </verify>
  <done>
    - SKILL.md에 Step 1.5 블록이 존재한다
    - `PHASE_PAD` 변수를 사용하는 zero-padding 로직이 포함된다
    - `.planning/phases/${PHASE_PAD}-*/parallel_groups.json` glob 탐색 로직이 포함된다
    - Step 2 본문이 `$GROUPS_JSON_FILE`을 참조한다
    - 파일 경로를 직접 전달하는 기존 동작에 영향을 주지 않는다
  </done>
</task>

</tasks>

<verification>
grep -n "Step 1.5" /Users/gyuha/workspace/super-gsd/skills/sg-parallel-execute/SKILL.md
grep -n "PHASE_PAD" /Users/gyuha/workspace/super-gsd/skills/sg-parallel-execute/SKILL.md
grep -n "GROUPS_JSON_FILE" /Users/gyuha/workspace/super-gsd/skills/sg-parallel-execute/SKILL.md
</verification>

<success_criteria>
- SKILL.md의 Step 1.5에 phase 번호 → 파일 경로 변환 로직이 삽입된다
- `$ARGUMENTS`가 '2', '02', '2.1' 등 숫자 형식일 때 .planning/phases/ 하위에서 parallel_groups.json을 자동으로 찾는다
- `$ARGUMENTS`가 파일 경로인 기존 호출 방식은 영향받지 않는다
</success_criteria>

<output>
완료 후 `.planning/quick/260528-wch-sg-parallel-execute-arguments-phase-para/260528-wch-01-SUMMARY.md` 파일을 생성한다.
</output>
