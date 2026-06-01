# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**super-gsd**

GSD → Superpowers → sg-retro 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, sg-retro가 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 명령과 훅을 제공한다.

**Core Value:** 각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

### Constraints

- **Tech stack**: Claude Code 플러그인 시스템 (skills + hooks). Bash/Node.js/Markdown 위주.
- **Dependencies**: `claude-plugins-official/superpowers`, `@opengsd/get-shit-done-redux` (또는 동등 GSD 설치).
- **Compatibility**: Claude Code 최신 버전 — `Stop`/`SubagentStop` hook 및 플러그인 marketplace 메커니즘 사용.
- **Idempotency**: 인계 명령은 같은 phase에서 여러 번 호출해도 중복 컨텍스트를 생성하지 않아야 한다.
- **Non-invasive**: 기존 GSD/Superpowers의 파일을 수정하지 않고 외부에서 orchestrate한다.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Plugin manifest**: `.claude-plugin/plugin.json` — skills 디렉토리, marketplace 메타데이터 정의
- **Skills**: `skills/sg-*/SKILL.md` — YAML frontmatter + `<objective>` / `<process>` / `<success_criteria>` 블록 구조. Claude Code 슬래시 명령(`/super-gsd:sg-*`)으로 직접 호출되거나 Claude가 자동 발동한다
- **Hooks**: `hooks/*.cjs` — Node.js 18+. Claude Code의 PreToolUse/Stop/SubagentStop 이벤트에서 실행되며 JSON으로 응답
- **Rules**: `.claude/sg-rule.*.local.md` — YAML frontmatter(name, enabled, event, pattern/conditions, action)가 있는 Markdown. `rule_runner.cjs`가 평가
- **Lessons**: `.planning/lessons/*.md` — phase 회고 결과. `lessons_ranker.cjs`가 frequency·recency·severity 기반 weighted score로 순위를 매겨 `sg-plan`에 주입
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### 버전 관리

버전을 올릴 때는 반드시 다음 **네 파일**을 함께 업데이트한다:

1. `.claude-plugin/plugin.json` — `version` 필드 변경
2. `.claude-plugin/marketplace.json` — `plugins[0].version` 필드 변경 (Claude Code plugin marketplace가 이 값을 보고 update trigger를 결정 — 누락 시 기존 설치는 새 버전을 fetch하지 않음)
3. `package.json` — `version` 필드 변경 (npm 패키지 버전 동기화)
4. `CHANGELOG.md` — 새 버전 섹션 추가 (변경 내용 요약 포함)

CHANGELOG.md 업데이트 없이 버전만 올리는 커밋은 허용하지 않는다. marketplace.json 누락은 plugin marketplace 신호 stale을 초래하므로 plugin.json과 항상 동시 갱신한다.

### 배포 트리거

프롬프트에 **"배포"** 라고 입력하면 다음 절차를 순서대로 실행한다:

1. **버전 결정** — `.claude-plugin/plugin.json`의 현재 `version`을 읽고 patch를 1 올린다 (예: `0.0.9` → `0.0.10`).
2. **plugin.json 업데이트** — `version` 필드를 새 버전으로 교체한다.
3. **marketplace.json 업데이트** — `plugins[0].version` 필드를 새 버전으로 교체한다 (plugin.json과 동일 값 강제).
4. **package.json 업데이트** — `version` 필드를 새 버전으로 교체한다.
5. **CHANGELOG.md 업데이트** — 파일 상단(첫 번째 `## [x.x.x]` 블록 바로 위)에 새 버전 섹션을 삽입한다. 형식:
   ```
   ## [NEW_VERSION] - YYYY-MM-DD

   ### Changed

   - (git log에서 마지막 버전 태그 이후 커밋 메시지를 요약하여 기재)
   ```
6. **git commit** — 변경된 네 파일을 스테이징하고 커밋한다. 메시지: `chore(release): bump version to NEW_VERSION`
7. **git push** — 현재 브랜치를 원격에 push한다.

**주의 사항:**
- push 전에 사용자에게 확인을 구하지 않고 바로 실행한다 (배포 트리거는 명시적 의도가 있는 명령이다).
- 커밋·push 외의 파일(테스트, 문서 등)은 건드리지 않는다.
- git push가 실패하면(예: 원격에 앞선 커밋이 있는 경우) 강제 push 없이 오류를 그대로 보고한다.
- **사용자 update 의무**: 기존 super-gsd 설치는 `git push` 후에도 자동으로 새 버전을 fetch하지 않는다. Claude Code는 사용자가 명시적으로 `/plugin update super-gsd@super-gsd`를 호출해야 marketplace re-fetch + cache 갱신 + 새 hook/skill 활성화가 일어난다. Codex/Gemini는 `npx @gyuha/super-gsd install`을 다시 실행해야 한다. 배포 보고 시 "마켓플레이스에 새 버전 등록 완료. 사용자가 update 명령 실행 필요"로 표현하고 "자동 활성화"라고 말하지 않는다.

### 새 규칙 파일 추가

`.claude/sg-rule.{name}.local.md`를 생성한다. frontmatter 형식:

```yaml
---
name: warn-{slug}          # 고유 식별자
enabled: true
event: bash                # bash | file | all
pattern: "regex-here"      # 단순 단일 조건일 때 사용
# 복합 조건은 pattern 대신 conditions 사용:
# conditions:
#   - field: command       # bash: command / file: new_string|file_path
#     operator: regex_match
#     pattern: "regex"
action: warn               # warn | block
---

경고 메시지 본문 (Markdown)
```

`rule_runner.cjs`는 `prompt` 이벤트는 지원하지 않는다.

### macOS 셸 이식성

hooks와 skills의 Bash 스니펫은 macOS(BSD 도구)와 Linux(GNU 도구) 모두에서 실행된다.

- **awk로 파이프 구분 마크다운 테이블 파싱 금지** — BSD awk는 `|` 구분자를 잘못 처리한다. `cut -d'|' -fN` 또는 `awk -F'|'`를 사용한다.
- **grep -P (PCRE) 금지** — macOS grep에는 `-P` 플래그가 없다. `-E` (ERE)를 사용한다.
- **STATE.md Phase 파싱 (skills/SKILL.md)** — SKILL.md에서 `$ARGUMENTS`가 없을 때는 Read 도구로 `.planning/STATE.md`를 열어 `Phase:` 필드를 직접 읽는다 (Superpowers 방식). bash 파이프라인(`grep | sed | awk`)은 `hooks/*.cjs`와 `skills/sg-retro/SKILL.md`처럼 macOS 호환성 이유로 명시된 경우에만 유지한다.
- **`skills/` + `.agents/` 쌍 커버** — `skills/*/SKILL.md`를 수정·변환하는 플랜을 작성할 때, 동일 이름의 `.agents/skills/*/SKILL.md`가 존재하는지 확인하고 해당 파일도 플랜에 명시적으로 포함한다. 같은 패턴 변환이라도 `.agents/` 파일은 별도 task 항목 또는 `files` 목록에 열거해야 한다. 누락 시 코드 리뷰에서 블로커로 플래그된다 (Phase 32 Medium-1).

### 스킬 파일 작성 언어

모든 SKILL.md 파일(`skills/`, `.agents/skills/`)의 내용은 **영문**으로 작성한다.
`<objective>`, `<process>`, `<success_criteria>`, `<constraints>` 블록의 설명·지시문·주석이 모두 해당된다.
한글로 작성된 기존 스킬을 수정할 때도 새로 추가하는 내용은 영문으로 작성한다.

### 사용자 언어 메시지

skill 스크립트를 작성할 때, 사용자에게 보이는 최종 메시지는 하드코딩된 영문 `echo`/`printf` 문자열을 그대로 출력하지 말고, 각 SKILL.md의 `<language>` 지침에 따라 **사용자의 입력 언어로 표면화**한다.

- **산문은 사용자 언어로** — 설명·안내·경고 등 산문 메시지와 표 헤더는 사용자 언어로 렌더링한다.
- **머신 토큰은 영문 그대로** — 명령명(`/super-gsd:sg-*`), enum 값(stage·status), phase 슬러그, 파일 경로, 타임스탬프, 버전 ID(`vX.Y`)는 번역하지 않고 원문 그대로 출력한다.
- 스크립트의 영문 문자열은 내부 신호로 취급하고, 사용자에게 보여줄 때 언어를 맞춘다. 이는 v2.7 Internationalization 마일스톤(영문 소스 + 응답 시 언어 자동 감지)과 일관된다.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

플러그인은 두 개의 레이어로 구성된다.

**1. Skills 레이어** (`skills/sg-*/SKILL.md`)

25개의 SKILL.md 파일이 각각 하나의 `/super-gsd:sg-*` 슬래시 명령을 정의한다. 대부분은 GSD → Superpowers → sg-retro 워크플로우 명령이고, sg-retro(회고), sg-parallel-execute(병렬 실행), sg-ui-plan(UI 설계), sg-next(자동 진행), sg-toggle-tdd·sg-toggle-review·sg-toggle-learn(워크플로우 단계 토글), sg-quick·sg-phase·sg-cleanup·sg-health·sg-update·sg-setup 등 보조 명령이 포함된다(전체 목록은 README Commands 표 참고). 이 중 15개는 `.agents/skills/`에도 미러로 존재해 Codex/Gemini에서 `$sg-*`로 호출된다. Claude Code가 SKILL.md를 실행 지시문으로 해석하며, GSD skill, Superpowers skill, 또는 Node.js 스크립트(.cjs)를 호출해 단계 간 인계를 수행한다.

**2. Hooks 레이어** (`hooks/`)

- `stop_hook.cjs` — Stop/SubagentStop 이벤트에서 `transcript_matcher.cjs`로 신호를 감지해 `systemMessage`로 다음 단계를 안내한다. `.planning/config.json`의 `super_gsd.auto_advance: false`로 비활성화 가능.
- `rule_runner.cjs` — PreToolUse 이벤트에서 `.claude/sg-rule.*.local.md` 규칙을 평가한다.
- `lessons_ranker.cjs` — CLI 도구. `--top N`으로 weighted top-N 패턴을 JSON lines로 출력하거나 `--archive`로 마일스톤 아카이브를 생성한다.

**워크플로우 단계 토글 플래그 (`super_gsd.tdd_mode` / `skip_review` / `skip_learn`)**

`.planning/config.json`의 `super_gsd` 블록에 있는 세 boolean이 implementation→ship 구간의 라우팅을 제어한다. sg-next/sg-status/sg-start의 라우팅과 stop_hook의 다음-단계 안내가 모두 이 값을 읽는다.

- `tdd_mode` (기본 `false`) — `true`이면 execute 완료 후 sg-tdd를 실행한 뒤 sg-review로 이어진다. 부재/`false`이면 execute → sg-review. (opt-in)
- `skip_review` (기본 `false`) — `true`이면 sg-review 단계를 건너뛰고 다음 비-생략 단계(sg-learn, 또는 learn도 생략 시 sg-ship)로 직행한다.
- `skip_learn` (기본 `false`) — `true`이면 sg-learn(sg-retro) 단계를 건너뛰고 sg-ship으로 직행한다.

chain-skip 규칙: 생략된 단계는 다음 비-생략 단계로 직행한다. 세 플래그가 모두 false/부재이면 기존 동작과 byte-identical하다.

이 플래그들은 `/super-gsd:sg-toggle-tdd`, `/super-gsd:sg-toggle-review`, `/super-gsd:sg-toggle-learn` 명령(인자 없으면 토글, `on`/`off`로 명시 설정)으로 변경하거나, sg-start의 새 프로젝트/마일스톤 시작 시 멀티셀렉트로 일괄 설정한다. 토글 명령은 read-merge-write로 다른 config 키와 2-space 들여쓰기를 보존하며 HANDOFF.md는 건드리지 않는다.

토글 명령의 사용자 표면 의미는 "단계 ON/OFF"로 통일돼 있다(`tdd_mode`만 polarity가 반대 — ON=실행이라 내부 flag는 true). 내부 flag polarity는 사용자에게 노출하지 않는다.

**데이터 흐름**

```
sg-next → HANDOFF.md + STATE.md 읽기 → 현재 stage 감지 → 다음 sg-* 자동 invoke
sg-plan → lessons_ranker.cjs → 이전 교훈 주입
sg-execute → Superpowers:executing-plans
sg-tdd → Superpowers:test-driven-development  # active when tdd_mode=true
sg-review → Superpowers:requesting-code-review  # skipped when skip_review=true
sg-learn → sg-retro skill → .planning/lessons/  # skipped when skip_learn=true
sg-toggle-{tdd,review,learn} → .planning/config.json (super_gsd flags 토글)
sg-ship → gsd-ship
stop_hook.cjs → transcript_matcher.cjs → systemMessage (다음 단계 안내)
rule_runner.cjs → .claude/*.local.md 규칙 평가 → warn/block
```

**HANDOFF.md 감사 로그**

`.planning/HANDOFF.md`는 append-only 파이프 구분 테이블이다. 모든 `sg-*` 명령이 단계 전이 시 새 행을 추가한다:

```
| timestamp | phase-slug | from_stage | to_stage | plan_hash | user |
```

`user` 컬럼은 v2.8 팀 협업 마일스톤에서 추가됐다(`git config user.name`). `stop_hook.cjs`는 이 파일의 마지막 행을 읽어 `to_stage`(파이프 분할 후 4번째 필드)로 현재 단계를 파악하며, 5컬럼(구) 행과 6컬럼(신) 행 모두에서 동일 인덱스로 동작한다. **행을 수정하지 말고 항상 끝에 추가만 한다.**

**환경 변수**

- `CLAUDE_PLUGIN_ROOT` — hooks에서 플러그인 루트 경로를 찾는 데 사용. 부재 시 `__dirname` (CommonJS) 기반 경로로 폴백.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

## Development Commands

```bash
# hooks 직접 테스트 (stdin에 JSON 입력)
echo '{"tool_name":"Bash","tool_input":{"command":"awk \"{print $1}\""}}' | node hooks/rule_runner.cjs

# stop_hook 직접 테스트 (Stop 이벤트 시뮬레이션)
echo '{"session_id":"test","stop_hook_active":true}' | node hooks/stop_hook.cjs

# lessons weighted ranking
node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md

# 마일스톤 lessons 아카이브
node hooks/lessons_ranker.cjs --archive --milestone v1.2 .planning/lessons/*.md
```

