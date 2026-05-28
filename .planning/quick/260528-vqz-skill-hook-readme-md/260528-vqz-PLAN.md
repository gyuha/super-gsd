---
phase: quick-260528-vqz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
autonomous: true
requirements:
  - QUICK-vqz-readme-accuracy
must_haves:
  truths:
    - "README의 Commands 테이블이 skills/ 디렉토리의 실제 21개 skill과 일치한다"
    - "커맨드 수 언급('sixteen')이 실제 개수와 일치한다"
    - "sg-start 설명이 실제 SKILL.md 동작(세션 감지 + Resume/Start/Cancel)을 반영한다"
    - "sg-cleanup, sg-parallel-execute, sg-setup이 Commands 테이블에 존재하거나 누락 이유가 명시된다"
    - "hooks 설명(auto_advance 설정 경로)이 stop_hook.cjs 실제 구현과 일치한다"
  artifacts:
    - path: "README.md"
      provides: "정확한 커맨드 테이블 및 hooks 설명"
  key_links:
    - from: "README.md Commands 테이블"
      to: "skills/*/SKILL.md"
      via: "커맨드 이름 및 설명 일치"
    - from: "README.md hooks 설명"
      to: "hooks/stop_hook.cjs"
      via: "auto_advance 설정 경로"
---

<objective>
README.md의 Commands 테이블과 hooks/아키텍처 설명이 실제 구현과 일치하는지 검증하고 불일치를 수정한다.

Purpose: skills/ 디렉토리에는 21개 skill이 있지만 README는 "sixteen slash commands"라고 기술하며 일부 커맨드가 테이블에서 누락되어 있다. 사용자가 잘못된 문서를 보고 혼란을 겪지 않도록 실제 코드와 문서를 동기화한다.

Output: 수정된 README.md — 커맨드 수, 테이블 항목, sg-start 설명, auto_advance 설정 경로가 모두 실제 구현과 일치
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
## 사전 감사 결과

감사 시점: 2026-05-28

### 1. 커맨드 수 불일치

README 본문 (line 12): "All **sixteen** slash commands"
실제 skills/ 디렉토리: 21개 (아래 목록)

```
sg-cleanup, sg-complete, sg-execute, sg-explore, sg-health,
sg-learn, sg-lessons, sg-new, sg-next, sg-parallel-execute,
sg-phase, sg-plan, sg-quick, sg-retro, sg-review,
sg-setup, sg-ship, sg-start, sg-status, sg-ui-plan, sg-update
```

### 2. Commands 테이블 누락 항목

README Commands 테이블(line 29–46)에 없는 skills:
- `sg-cleanup` — 완료된 마일스톤의 phase 디렉토리를 아카이브
- `sg-parallel-execute` — parallel_groups.json 기반 독립 플랜 병렬 실행
- `sg-setup` — 현재 프로젝트에 hook/skill 파일 복사 (in-session 설치)

### 3. sg-start 설명 불일치

README (line 31):
> "Scaffold a new project or milestone via `gsd-new-project`"

실제 skills/sg-start/SKILL.md:
> "detects an existing session via STATE.md and prompts Resume, Start new milestone, or Cancel; falls back to gsd-new-project if no session exists"

README는 세션 감지/Resume 로직을 완전히 누락하고 있다. Roadmap Phase 8(Session Restore)에서 추가된 기능이다.

### 4. hooks auto_advance 설정 경로 불일치

README (line에 명시 없음, CLAUDE.md):
> `.planning/config.json`의 `super_gsd.auto_advance: false`로 비활성화 가능

실제 hooks/stop_hook.cjs (line 99):
```js
const autoAdvance = (cfg.auto_advance !== undefined) ? cfg.auto_advance : true;
```
실제 구현은 `super_gsd.auto_advance`가 아닌 루트 레벨의 `auto_advance` 키를 읽는다.
README에는 이 설정이 명시되어 있지 않아 수정 필요 없음. CLAUDE.md의 Architecture 섹션 설명이 틀렸지만, 해당 파일은 이 플랜의 범위 밖이다.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commands 테이블 누락 항목 추가 및 커맨드 수 수정</name>
  <files>README.md</files>
  <action>
README.md의 두 가지 문제를 수정한다.

1. line 12의 "sixteen" → "twenty-one"으로 변경한다.

2. Commands 테이블(line 29–46)에 다음 세 항목을 추가한다.
   기존 테이블 끝(sg-health 행 이후)에 순서대로 삽입한다:

   - sg-cleanup: "완료된 마일스톤의 phase 디렉토리를 gsd-cleanup으로 아카이브한다" / "마일스톤 완료 후 .planning/phases/ 정리가 필요할 때"
   - sg-parallel-execute: "parallel_groups.json이 존재하는 경우 독립 플랜 그룹을 최대 3개 Task() 에이전트로 병렬 실행한다" / "독립 플랜이 여러 그룹으로 나뉠 때 sg-execute 대신"
   - sg-setup: "현재 프로젝트에 super-gsd hook/skill 파일을 복사한다 — Claude Code in-session 설치 도구" / "기존 프로젝트에 super-gsd를 수동으로 설치할 때"

   테이블 형식은 기존 행과 동일하게 맞춘다: `| \`/super-gsd:sg-*\` | ... | ... |`
  </action>
  <verify>
    grep -c "sg-cleanup\|sg-parallel-execute\|sg-setup" README.md
    # 최소 3 이상이어야 한다 (각 항목이 테이블에 존재)

    grep "twenty-one" README.md
    # 출력이 있어야 한다
  </verify>
  <done>
    Commands 테이블에 sg-cleanup, sg-parallel-execute, sg-setup 행이 추가되고,
    커맨드 수가 "twenty-one"으로 수정된다.
  </done>
</task>

<task type="auto">
  <name>Task 2: sg-start 설명 수정</name>
  <files>README.md</files>
  <action>
Commands 테이블의 sg-start 행 설명을 실제 SKILL.md 동작과 일치하도록 수정한다.

현재 (line 31):
```
| `/super-gsd:sg-start` | Scaffold a new project or milestone via `gsd-new-project` | At the very beginning of a new project or milestone |
```

수정 후:
```
| `/super-gsd:sg-start` | STATE.md로 기존 세션을 감지해 Resume / Start new milestone / Cancel을 제시한다 — 세션이 없으면 `gsd-new-project`로 폴백 | 프로젝트 시작 시 또는 세션 재개가 필요할 때 |
```

"When to use" 컬럼도 세션 재개 시나리오를 포함하도록 업데이트한다.

또한 Workflow 섹션(line 17)의 다이어그램 위에 있는 설명 문장이 있다면, sg-start의 역할이 단순 scaffold가 아닌 세션 감지 진입점임을 반영하도록 수정이 필요한지 확인한다. 다이어그램 자체(`sg-new/sg-start → ...`)는 정확하므로 수정하지 않는다.
  </action>
  <verify>
    grep -n "sg-start" README.md | grep -v "^Binary"
    # sg-start 행이 "STATE.md" 또는 "Resume"을 포함해야 한다
  </verify>
  <done>
    README의 sg-start 설명이 세션 감지 + Resume/Start/Cancel 흐름을 반영하고,
    gsd-new-project는 폴백으로 올바르게 기술된다.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| 없음 | README.md 수정만 — 외부 입력 경계 없음 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-vqz-01 | Tampering | README.md | accept | 문서 수정, 실행 코드 없음 — 낮은 위험 |
</threat_model>

<verification>
두 태스크 완료 후 다음을 확인한다:

1. `grep "twenty-one" README.md` → 출력 있음
2. `grep -c "sg-cleanup\|sg-parallel-execute\|sg-setup" README.md` → 3 이상
3. `grep "sg-start" README.md | grep "STATE.md\|Resume"` → 출력 있음
4. Commands 테이블 행 수 확인: `grep -c "^| \`/super-gsd:sg-" README.md` → 19 이상 (기존 16 + 신규 3)
</verification>

<success_criteria>
- README의 "sixteen" 언급이 "twenty-one"으로 수정됨
- sg-cleanup, sg-parallel-execute, sg-setup이 Commands 테이블에 정확한 설명과 함께 존재함
- sg-start 설명이 세션 감지 + Resume/Start/Cancel 로직을 반영함
- 수정 범위가 README.md의 Commands 테이블 및 관련 언급에 한정됨 (surgical change)
</success_criteria>

<output>
완료 시 `.planning/quick/260528-vqz-skill-hook-readme-md/260528-vqz-SUMMARY.md`를 생성한다.
</output>
