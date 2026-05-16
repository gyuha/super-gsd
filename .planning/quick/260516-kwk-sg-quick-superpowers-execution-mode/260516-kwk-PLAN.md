---
phase: quick-260516-kwk
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/sg-quick.md
autonomous: true
requirements:
  - QUICK-260516-kwk
must_haves:
  truths:
    - "sg-quick는 gsd-sdk로 quick_id/slug/task_dir를 초기화한다"
    - "gsd-planner Agent가 PLAN.md를 task_dir에 작성한다"
    - "작성된 PLAN.md 전체 내용이 Superpowers 핸드오프 프롬프트에 포함된다"
    - "superpowers:executing-plans Skill이 정확히 한 번 호출된다"
    - "STATE.md Quick Tasks Completed 테이블에 신규 행이 추가된다"
    - "PLAN.md와 STATE.md가 커밋된다"
  artifacts:
    - path: "commands/sg-quick.md"
      provides: "새 sg-quick slash command 구현"
  key_links:
    - from: "commands/sg-quick.md"
      to: "superpowers:executing-plans"
      via: "Skill() 호출"
      pattern: "Skill.*superpowers:executing-plans"
---

<objective>
commands/sg-quick.md를 재작성하여 단순한 gsd-quick Skill 위임 대신, gsd-sdk 초기화 → gsd-planner Agent 스폰 → Superpowers 핸드오프의 완전한 파이프라인을 구현한다.

Purpose: sg-quick 실행 시 GSD quick 플래너가 PLAN.md를 생성하고, 그 내용이 superpowers:executing-plans에 직접 전달되어 구현까지 자동 완료되도록 한다.
Output: 재작성된 commands/sg-quick.md
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: commands/sg-quick.md 재작성 — Superpowers 핸드오프 파이프라인</name>
  <files>commands/sg-quick.md</files>
  <action>
commands/sg-quick.md 전체를 아래 설계대로 재작성한다. 기존 "gsd-quick Skill 위임 1줄" 구현을 완전히 교체한다.

프런트매터:
- name: sg-quick
- description: 기존과 동일 (변경 없음)
- argument-hint: 기존과 동일 (변경 없음)

objective 섹션:
- 기존 설명을 유지하되 "gsd-planner → Superpowers 자동 실행" 방식임을 명시

execution_context 섹션:
- Self-contained. gsd-sdk, gsd-planner Agent, superpowers:executing-plans Skill을 직접 조합한다.

process 섹션 (각 단계 번호 포함):

1. **인자 파싱.** $ARGUMENTS에서 DESCRIPTION과 플래그를 분리한다.
   ```bash
   ARGS="$ARGUMENTS"
   DISCUSS_FLAG=""
   RESEARCH_FLAG=""
   VALIDATE_FLAG=""
   FULL_FLAG=""
   for arg in $ARGS; do
     case "$arg" in
       --discuss)  DISCUSS_FLAG="--discuss" ;;
       --research) RESEARCH_FLAG="--research" ;;
       --validate) VALIDATE_FLAG="--validate" ;;
       --full)     FULL_FLAG="--full" ;;
     esac
   done
   # 플래그 제거 후 나머지가 DESCRIPTION
   DESCRIPTION=$(echo "$ARGS" | sed 's/--discuss//g; s/--research//g; s/--validate//g; s/--full//g' | xargs)
   ```
   DESCRIPTION이 비어 있으면 `Usage: /super-gsd:sg-quick <task description> [--discuss] [--research] [--validate] [--full]`를 출력하고 종료한다.

2. **초기화.** gsd-sdk로 quick 메타데이터를 얻는다.
   ```bash
   INIT_JSON=$(gsd-sdk query init.quick "$DESCRIPTION")
   QUICK_ID=$(echo "$INIT_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.quick_id||d.id||'')")
   SLUG=$(echo "$INIT_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.slug||'')")
   TASK_DIR=$(echo "$INIT_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.task_dir||d.dir||'')")
   ```
   QUICK_ID 또는 TASK_DIR이 비어 있으면 `gsd-sdk init.quick failed — check gsd-sdk installation`을 출력하고 종료한다.

3. **태스크 디렉터리 생성.**
   ```bash
   mkdir -p "$TASK_DIR"
   ```

4. **gsd-planner Agent 스폰 (quick mode).** Agent를 스폰하여 PLAN.md를 TASK_DIR에 작성시킨다. Agent에게 전달하는 프롬프트:
   ```
   You are a GSD quick planner. Write a PLAN.md for the following quick task.

   Task description: <DESCRIPTION>
   Flags: <flags list, omit if none>
   Output path: <TASK_DIR>/<QUICK_ID>-PLAN.md

   Create a single focused PLAN.md with 1-2 tasks. Target ~30% context usage. Follow the GSD PLAN.md format (frontmatter + objective + tasks with action/verify/done + success_criteria).
   ```
   Agent 스폰 방법: `Task(description="<위 프롬프트>", subagent_type="general-purpose")`

5. **PLAN.md 읽기.** Agent가 완료되면 생성된 PLAN.md를 읽는다.
   ```bash
   PLAN_PATH="$TASK_DIR/${QUICK_ID}-PLAN.md"
   PLAN_CONTENT=$(cat "$PLAN_PATH" 2>/dev/null)
   ```
   PLAN_CONTENT가 비어 있으면 `Planner agent did not create PLAN.md at $PLAN_PATH`를 출력하고 종료한다.

6. **Superpowers 핸드오프 프롬프트 구성.** 다음 형식의 마크다운 블록을 조합한다.
   ```
   # Quick Task Execution Handoff — <QUICK_ID>

   ## Goal
   <DESCRIPTION>

   ## Plan

   <PLAN_CONTENT>

   ## Instruction to Superpowers
   Execute the plan above using the superpowers:executing-plans skill. Treat the PLAN.md as the authoritative source of tasks and acceptance criteria. Complete all tasks and verify success criteria before finishing.
   ```
   이 프롬프트 블록을 사용자에게 출력한다.

7. **Superpowers 호출.**
   ```
   Skill(skill="superpowers:executing-plans", args="<6단계 프롬프트 블록>")
   ```
   동일 턴에서 호출한다 — 확인 프롬프트 없음.

8. **STATE.md Quick Tasks Completed 갱신.** `.planning/STATE.md`의 `### Quick Tasks Completed` 테이블에 신규 행을 추가한다.
   ```bash
   NEW_ROW="| $QUICK_ID | $DESCRIPTION | $(date +%Y-%m-%d) | (pending) | [$SLUG](.planning/quick/$SLUG/) |"
   ```
   `### Quick Tasks Completed` 테이블의 헤더 다음 줄에 삽입한다 (마지막 행 이후에 추가).

9. **아티팩트 커밋.**
   ```bash
   git add "$PLAN_PATH" .planning/STATE.md
   git commit -m "quick($QUICK_ID): $DESCRIPTION"
   ```

10. **완료 메시지 출력.**
    `Quick task $QUICK_ID complete. Plan executed via superpowers:executing-plans. STATE.md updated.`

---

구현 시 주의사항:
- gsd-sdk query init.quick의 반환 JSON 필드명은 버전에 따라 다를 수 있으므로 id/quick_id, dir/task_dir 둘 다 시도한다.
- 플래그(--discuss 등)는 현재 파이프라인에서 planner Agent 프롬프트에만 hint로 전달한다 (gsd-sdk나 Skill에 직접 전달하지 않음).
- process 섹션은 bash 코드 블록을 포함한 numbered step 형식으로 작성한다 (sg-execute.md 스타일 참조).
- success_criteria는 sg-execute.md처럼 numbered 리스트로 작성한다.
  </action>
  <verify>
    <automated>grep -c "superpowers:executing-plans" /Users/gyuha/workspace/super-gsd/commands/sg-quick.md</automated>
  </verify>
  <done>
- commands/sg-quick.md가 10단계 process를 갖춘 완성된 slash command로 재작성됨
- superpowers:executing-plans Skill 호출이 포함됨
- gsd-sdk query init.quick 초기화 단계가 포함됨
- gsd-planner Agent 스폰 단계가 포함됨
- STATE.md Quick Tasks Completed 갱신 단계가 포함됨
- 커밋 단계가 포함됨
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| $ARGUMENTS → bash | 사용자 입력이 bash 변수로 들어옴 — 플래그 파싱 시 word-splitting 주의 |
| planner Agent → PLAN.md | Agent가 잘못된 경로에 파일을 쓰거나 빈 파일을 생성할 수 있음 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-kwk-01 | Tampering | $ARGUMENTS bash 파싱 | accept | 단순 flag 파싱이므로 injection 위험 낮음; xargs로 공백 정리 |
| T-kwk-02 | Denial of Service | gsd-sdk 미설치 시 무한 대기 | mitigate | QUICK_ID 비어있을 때 즉시 exit |
| T-kwk-03 | Information Disclosure | PLAN.md 내용이 Skill args에 노출 | accept | 로컬 개발 환경, PII 없음 |
</threat_model>

<verification>
1. commands/sg-quick.md 파일이 존재하고 10단계 process를 포함한다
2. `grep -c "superpowers:executing-plans" commands/sg-quick.md` 결과가 1 이상
3. `grep -c "init.quick" commands/sg-quick.md` 결과가 1 이상
4. `grep -c "Quick Tasks Completed" commands/sg-quick.md` 결과가 1 이상
</verification>

<success_criteria>
1. commands/sg-quick.md는 단순 Skill 위임이 아닌 완전한 파이프라인(초기화 → 플래너 → Superpowers → STATE 갱신 → 커밋)을 구현한다
2. superpowers:executing-plans Skill이 PLAN.md 전체 내용을 포함한 프롬프트와 함께 호출된다
3. STATE.md Quick Tasks Completed 테이블 갱신과 git 커밋이 자동화된다
</success_criteria>

<output>
완료 후 `.planning/quick/260516-kwk-sg-quick-superpowers-execution-mode/260516-kwk-SUMMARY.md` 생성
</output>
