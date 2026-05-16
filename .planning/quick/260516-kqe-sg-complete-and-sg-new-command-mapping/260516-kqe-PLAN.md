---
phase: quick-260516-kqe
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/sg-complete.md
  - commands/sg-new.md
  - docs/COMMANDS.md
  - README.md
autonomous: true
requirements: [QUICK-KQE]
must_haves:
  truths:
    - "commands/sg-complete.md 파일이 존재하고 gsd-complete-milestone을 호출한다"
    - "commands/sg-new.md 파일이 존재하고 gsd-new-milestone을 호출한다"
    - "README.md Commands 표에 sg-complete, sg-new 행이 추가되어 있다"
    - "docs/COMMANDS.md Quick Reference 표와 상세 섹션에 두 명령어가 추가되어 있다"
  artifacts:
    - path: "commands/sg-complete.md"
      provides: "sg-complete slash command"
    - path: "commands/sg-new.md"
      provides: "sg-new slash command"
  key_links:
    - from: "commands/sg-complete.md"
      to: "gsd-complete-milestone Skill"
      via: "Skill() invocation"
    - from: "commands/sg-new.md"
      to: "gsd-new-milestone Skill"
      via: "Skill() invocation"
---

<objective>
sg-complete와 sg-new 두 슬래시 커맨드를 추가하고, README.md와 docs/COMMANDS.md에 문서화한다.

Purpose: gsd-complete-milestone과 gsd-new-milestone을 sg- prefix 패턴에 맞게 노출해 사용자가 마일스톤 완료/신규 시작을 통일된 인터페이스로 사용할 수 있게 한다.
Output: commands/sg-complete.md, commands/sg-new.md, README.md 갱신, docs/COMMANDS.md 갱신
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@commands/sg-ship.md
@docs/COMMANDS.md
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: sg-complete.md 및 sg-new.md 커맨드 파일 생성</name>
  <files>commands/sg-complete.md, commands/sg-new.md</files>
  <action>
commands/sg-ship.md 구조를 기준 패턴으로 사용한다.

commands/sg-complete.md:
- frontmatter: name=sg-complete, description은 "Complete the current milestone — invokes gsd-complete-milestone Skill.", argument-hint는 "[phase] - optional. Defaults to STATE.md current phase."
- objective: 대상 phase 결정 후 gsd-complete-milestone 호출
- process:
  1. phase 결정: $ARGUMENTS 비어있으면 STATE.md에서 `grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}'`로 추출. 실패 시 정확히 다음을 출력: `Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-complete <phase>` 후 종료.
  2. Skill 호출: `Skill(skill="gsd-complete-milestone", args="$PHASE_NUM")`
  3. 완료 메시지: `Milestone marked complete. Run /super-gsd:sg-new to start a new milestone.`
- success_criteria: gsd-complete-milestone Skill이 정확히 한 번 호출됨

commands/sg-new.md:
- frontmatter: name=sg-new, description은 "Start a new milestone — invokes gsd-new-milestone Skill.", argument-hint는 "[milestone-name] - optional. Passed through to gsd-new-milestone."
- objective: gsd-new-milestone Skill 호출로 새 마일스톤 시작
- process:
  1. Skill 호출: `Skill(skill="gsd-new-milestone", args="$ARGUMENTS")`
  2. 완료 메시지: `New milestone started. Run /super-gsd:sg-explore to map the codebase next.`
- success_criteria: gsd-new-milestone Skill이 정확히 한 번 $ARGUMENTS와 함께 호출됨
  </action>
  <verify>
    <automated>ls /Users/gyuha/workspace/super-gsd/commands/sg-complete.md /Users/gyuha/workspace/super-gsd/commands/sg-new.md && grep -l "gsd-complete-milestone" /Users/gyuha/workspace/super-gsd/commands/sg-complete.md && grep -l "gsd-new-milestone" /Users/gyuha/workspace/super-gsd/commands/sg-new.md</automated>
  </verify>
  <done>두 파일이 존재하고 각각 올바른 Skill 이름을 참조한다.</done>
</task>

<task type="auto">
  <name>Task 2: README.md 및 docs/COMMANDS.md 문서 갱신</name>
  <files>README.md, docs/COMMANDS.md</files>
  <action>
README.md 갱신:
- "## Commands" 섹션의 Quick Reference 표에 두 행 추가. sg-ship 행 바로 아래에 삽입:
  - `| \`/super-gsd:sg-complete\` | 현재 마일스톤 완료 처리 — \`gsd-complete-milestone\` 호출 | 구현 완료 후 마일스톤을 닫을 때 |`
  - `| \`/super-gsd:sg-new\` | 새 마일스톤 시작 — \`gsd-new-milestone\` 호출 | sg-complete 후 다음 마일스톤을 시작할 때 |`
- README.ko.md도 동일하게 갱신한다 (파일이 존재하는 경우에만).

docs/COMMANDS.md 갱신:
1. "## Quick Reference" 표의 sg-ship 행 바로 아래에 두 행 추가:
   - `| \`/super-gsd:sg-complete\` | \`gsd-complete-milestone\` | \`[phase]\` | 현재 마일스톤 완료 처리 |`
   - `| \`/super-gsd:sg-new\` | \`gsd-new-milestone\` | \`[milestone-name]\` | 새 마일스톤 시작 |`
2. "## sg-ship" 섹션 바로 뒤에 두 개의 상세 섹션 추가 (기존 sg-ship 섹션 형식 그대로 따름):

## sg-complete

**Slash command:** `/super-gsd:sg-complete`

**Maps to:** `gsd-complete-milestone`

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Resolves the target phase then invokes the `gsd-complete-milestone` Skill to mark the current milestone as complete.

**Example:**
```
/super-gsd:sg-complete
/super-gsd:sg-complete 03
```

After completion, the command prints a message guiding you to run `sg-new` to start a new milestone.

---

## sg-new

**Slash command:** `/super-gsd:sg-new`

**Maps to:** `gsd-new-milestone`

**Arguments:** `[milestone-name]` — optional. Passed through to `gsd-new-milestone`.

**What it does:** Invokes the `gsd-new-milestone` Skill to start a new milestone. `gsd-new-milestone` handles context scaffolding internally, so `sg-new` simply forwards `$ARGUMENTS` unchanged.

**Example:**
```
/super-gsd:sg-new
/super-gsd:sg-new add payment module
```

After completion, the command prints a message guiding you to run `sg-explore` next.

---

README.md의 "## Workflow" 다이어그램 텍스트는 수정하지 않는다 (기존 sg-ship이 종료 지점이고 sg-complete/sg-new는 마일스톤 레벨 명령이므로 다이어그램 구조 변경 불필요).
  </action>
  <verify>
    <automated>grep -c "sg-complete" /Users/gyuha/workspace/super-gsd/README.md && grep -c "sg-new" /Users/gyuha/workspace/super-gsd/README.md && grep -c "sg-complete" /Users/gyuha/workspace/super-gsd/docs/COMMANDS.md && grep -c "sg-new" /Users/gyuha/workspace/super-gsd/docs/COMMANDS.md</automated>
  </verify>
  <done>README.md와 docs/COMMANDS.md 각각에 sg-complete, sg-new가 표와 상세 섹션에 포함되어 있다.</done>
</task>

</tasks>

<verification>
모든 파일 존재 여부 및 키워드 포함 확인:
```bash
ls commands/sg-complete.md commands/sg-new.md
grep "gsd-complete-milestone" commands/sg-complete.md
grep "gsd-new-milestone" commands/sg-new.md
grep "sg-complete" README.md docs/COMMANDS.md
grep "sg-new" README.md docs/COMMANDS.md
```
</verification>

<success_criteria>
- commands/sg-complete.md 존재, gsd-complete-milestone Skill 호출
- commands/sg-new.md 존재, gsd-new-milestone Skill 호출
- README.md Commands 표에 sg-complete, sg-new 행 추가됨
- docs/COMMANDS.md Quick Reference 표와 상세 섹션에 두 명령어 추가됨
- 버전 bump 없음, CHANGELOG.md 변경 없음
</success_criteria>

<output>
완료 후 `.planning/quick/260516-kqe-sg-complete-and-sg-new-command-mapping/260516-kqe-01-SUMMARY.md` 생성
</output>
