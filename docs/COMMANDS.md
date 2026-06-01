# sg- Command Reference

Full reference for all `/super-gsd:sg-*` slash commands.

See [README.md](../README.md) for installation and quick-start.

## Workflow

```
sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
  (GSD)       (GSD)      (GSD)    (Superpowers) (Superpowers) (sg-retro) (GSD)
                              ↓                                       |
                         sg-ui-plan (optional: UI brainstorming)      |
                                                                       |
                         lessons feed back into next sg-plan cycle ←
```

`sg-status` can be run at any point to check current position.

`sg-ui-plan` is an optional step between `sg-plan` and `sg-execute` — run it when UI design brainstorming is needed after planning.

## Quick Reference

| Command | Maps to | Args | Description |
|---------|---------|------|-------------|
| `/super-gsd:sg-start` | `gsd-new-project` | `[project-name]` | Scaffold a new project or milestone |
| `/super-gsd:sg-explore` | `gsd-map-codebase` | (none) | Map and analyse the codebase |
| `/super-gsd:sg-plan` | `gsd-discuss-phase` → `gsd-plan-phase` | `[phase]` | Gather context and create a phase plan (2-step chain) |
| `/super-gsd:sg-ui-plan` | `superpowers:brainstorming` Skill | `[phase]` | UI 설계 전용 brainstorming 실행 |
| `/super-gsd:sg-execute` | `superpowers:executing-plans` Skill | `[phase]` | Package phase plan and hand off to Superpowers |
| `/super-gsd:sg-parallel-execute` | N Task() agents 병렬 dispatch | `[phase\|json path]` | wave 단위 병렬 plan 실행 (v1.4) |
| `/super-gsd:sg-review` | `superpowers:requesting-code-review` | (none) | Request a code review via Superpowers |
| `/super-gsd:sg-learn` | `super-gsd:sg-retro` | (none) | Run retrospective via sg-retro to capture patterns |
| `/super-gsd:sg-retro` | internal sg-retro Skill | `[phase] [lens...\|--pick]` | 회고 직접 실행 — smart default `dspm+ssc` (v2.9) |
| `/super-gsd:sg-lessons` | reads `.planning/lessons/*.md` | `[phase-filter]` | weighted top-N + 전체 lessons 표시 |
| `/super-gsd:sg-ship` | `gsd-ship` | `[phase]` | Complete and ship the current milestone |
| `/super-gsd:sg-complete` | `gsd-complete-milestone` | `[phase]` | 현재 마일스톤 완료 처리 |
| `/super-gsd:sg-new` | `gsd-new-milestone` | `[milestone-name]` | 새 마일스톤 시작 |
| `/super-gsd:sg-next` | routing-only meta command | (none) | HANDOFF/STATE 기반 다음 sg-* 즉시 invoke |
| `/super-gsd:sg-phase` | `gsd-phase` 위임 + `complete` 인라인 | `<edit\|remove\|complete> <N>` | phase 편집·제거·완료 처리 |
| `/super-gsd:sg-quick` | `gsd-planner` + `superpowers:executing-plans` | `<자연어 task>` | 일회성 task plan→execute→commit 사이클 |
| `/super-gsd:sg-health` | reads plugin manifest + `hooks/hooks.json` | (none) | 설치 상태 및 의존성 검증 |
| `/super-gsd:sg-status` | reads `HANDOFF.md` + `STATE.md` | `[--team]` | 현재 단계 + 다음 권장 명령 (팀 옵션) |
| `/super-gsd:sg-toggle-tdd` | writes `.planning/config.json` `super_gsd.tdd_mode` | `[on\|off]` | sg-tdd 단계 ON/OFF (인자 없으면 토글) |
| `/super-gsd:sg-toggle-review` | writes `.planning/config.json` `super_gsd.skip_review` | `[on\|off]` | sg-review 단계 ON/OFF (인자 없으면 토글) |
| `/super-gsd:sg-toggle-learn` | writes `.planning/config.json` `super_gsd.skip_learn` | `[on\|off]` | sg-learn 단계 ON/OFF (인자 없으면 토글) |
| `/super-gsd:sg-setup` | in-session installer | `[--gemini]` | Codex/Gemini 인세션 설치 |
| `/super-gsd:sg-update` | GSD + Superpowers + super-gsd 업데이터 | (none) | 세 도구 일괄 설치/업데이트 |
| `/super-gsd:sg-cleanup` | `gsd-cleanup` 위임 | (none) | 완료 마일스톤 phase 디렉토리 아카이브 |

---

## sg-start

**Slash command:** `/super-gsd:sg-start`

**Maps to:** `gsd-new-project`

**Arguments:** `[project-name]` — optional. Passed through to `gsd-new-project`.

**What it does:** Invokes the `gsd-new-project` Skill to scaffold a new project or milestone. `gsd-new-project` handles new vs. existing project detection internally, so `sg-start` simply forwards `$ARGUMENTS` unchanged.

**Example:**
```
/super-gsd:sg-start my-new-app
/super-gsd:sg-start
```

After completion, the command prints a message guiding you to run `sg-explore` next.

---

## sg-explore

**Slash command:** `/super-gsd:sg-explore`

**Maps to:** `gsd-map-codebase`

**Arguments:** (none)

**What it does:** Invokes the `gsd-map-codebase` Skill to analyse and map the current codebase. No arguments required — `gsd-map-codebase` uses the current working directory.

**Example:**
```
/super-gsd:sg-explore
```

After completion, the command prints a message guiding you to run `sg-plan` next.

---

## sg-plan

**Slash command:** `/super-gsd:sg-plan`

**Maps to:** `gsd-discuss-phase` → `gsd-plan-phase` (2-step chain)

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Executes a 2-step chain automatically: first invokes `gsd-discuss-phase` to gather phase context, then invokes `gsd-plan-phase` to create the execution plan. Progress messages are printed before each step so you can see which step is running.

**Example:**
```
/super-gsd:sg-plan
/super-gsd:sg-plan 03
```

Progress output:
```
[sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...
[sg-plan] Step 2/2: Creating plan via gsd-plan-phase...
```

After completion, the command prints a message guiding you to run `sg-execute` next.

---

## sg-ui-plan

**Slash command:** `/super-gsd:sg-ui-plan`

**Maps to:** `superpowers:brainstorming` Skill

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** ROADMAP.md에서 대상 phase 섹션을 읽고, `superpowers:brainstorming` Agent를 실행하여 UI 설계 세션을 진행한다. 완료 후 `.planning/HANDOFF.md`에 `To: ui-plan` 행을 기록한다. `sg-plan`의 Visual Companion 분기를 독립 명령으로 분리한 것이며, brainstorming 완료 후 별도 plan-phase 호출 없이 종료된다.

**Example:**
```
/super-gsd:sg-ui-plan
/super-gsd:sg-ui-plan 21
```

---

## sg-execute

**Slash command:** `/super-gsd:sg-execute`

**Maps to:** `superpowers:executing-plans` Skill

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Packages the current phase's `PLAN.md` bodies, `REQUIREMENTS.md` REQ-ID mapping, and `ROADMAP.md` success criteria into a single Superpowers-ready prompt, then auto-invokes the `superpowers:executing-plans` Skill. Appends a timestamped row to `.planning/HANDOFF.md`. Re-running on an unchanged plan is idempotent (skips append when plan hash matches).

**Example:**
```
/super-gsd:sg-execute
/super-gsd:sg-execute 03
```

After completion, the command prints a message guiding you to run `sg-status` to inspect workflow state.

---

## sg-review

**Slash command:** `/super-gsd:sg-review`

**Maps to:** `superpowers:requesting-code-review`

**Arguments:** (none) — `$ARGUMENTS` is passed through to the Skill if provided.

**What it does:** Invokes the `superpowers:requesting-code-review` Skill to initiate a code review. Delegates entirely to Superpowers.

**Example:**
```
/super-gsd:sg-review
```

After completion, the command prints a message guiding you to run `sg-learn` next.

---

## sg-learn

**Slash command:** `/super-gsd:sg-learn`

**Maps to:** `super-gsd:sg-retro`

**Arguments:** (none) — `$ARGUMENTS` is passed through to the Skill if provided.

**What it does:** Invokes the `super-gsd:sg-retro` Skill to run a retrospective and extract learnable patterns from the current session. Captures lessons that feed back into the next `sg-plan` cycle.

**Example:**
```
/super-gsd:sg-learn
```

After completion, the command prints a message guiding you to run `sg-ship` next.

---

## sg-ship

**Slash command:** `/super-gsd:sg-ship`

**Maps to:** `gsd-ship`

**Arguments:** `[phase]` — optional. Defaults to the current phase from `.planning/STATE.md`.

**What it does:** Resolves the target phase then invokes the `gsd-ship` Skill to complete and ship the milestone.

**Example:**
```
/super-gsd:sg-ship
/super-gsd:sg-ship 03
```

After completion, the command prints a message guiding you to run `sg-start` to begin the next project or milestone.

---

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

## sg-health

**Slash command:** `/super-gsd:sg-health`

**Maps to:** plugin manifest + `hooks.json` 검증 (no Skill)

**Arguments:** (none)

**What it does:** super-gsd 설치 상태를 검증한다. `skills/` 디렉토리 존재 여부, `hooks/hooks.json`의 PreToolUse/Stop/SubagentStop 등록 여부, GSD/Superpowers 의존성 설치 여부, `.planning/HANDOFF.md` 스키마 정합성을 확인하고 `[OK]`/`[WARN]`/`[FAIL]` 라인별 리포트를 출력한다. (Hookify 의존성은 v1.2 Phase 13에서 제거되어 더 이상 검증하지 않는다. 명령 파일은 v2.0 Phase 22-23에서 `commands/` → `skills/` 마이그레이션 완료.)

**Example:**
```
/super-gsd:sg-health
```

---

## sg-status

**Slash command:** `/super-gsd:sg-status`

**Maps to:** reads `.planning/HANDOFF.md` + `.planning/STATE.md` (no Skill)

**Arguments:** (none)

**What it does:** Reads `.planning/HANDOFF.md` to determine the current stage, `.planning/STATE.md` for the current phase number and name, and `.planning/ROADMAP.md` for next-phase lookup. Outputs exactly three header lines, a blank line, and one `Next:` line.

**Example:**
```
/super-gsd:sg-status
```

Example output:
```
Phase: 3 (sg- Command Set & README)
Stage: superpowers
Last handoff: 2026-05-15T14:30:00Z

Next: /super-gsd:sg-review
```

---

## sg-toggle-tdd / sg-toggle-review / sg-toggle-learn

**Slash commands:** `/super-gsd:sg-toggle-tdd`, `/super-gsd:sg-toggle-review`, `/super-gsd:sg-toggle-learn`

**Maps to:** read-modify-write of `.planning/config.json` `super_gsd` block (no Skill)

**Arguments:** `[on|off]` — `on` includes/enables the stage, `off` skips/disables it, no argument flips the current value.

**What they do:** Each command turns one optional workflow stage on or off and persists the choice so `sg-next` / `sg-status` / the stop hook route accordingly. The user-facing semantic is uniform ("stage ON/OFF"); the underlying flags differ in polarity:

| Command | Flag | ON means | OFF means | Default |
|---------|------|----------|-----------|---------|
| `sg-toggle-tdd` | `tdd_mode` | run `sg-tdd` after execute | skip TDD | OFF |
| `sg-toggle-review` | `skip_review` (inverted) | run `sg-review` | skip review | ON |
| `sg-toggle-learn` | `skip_learn` (inverted) | run `sg-learn` | skip retrospective | ON |

When a stage is OFF, routing chain-skips to the next non-skipped stage (`execute → … → sg-ship`). Other config keys and 2-space indentation are preserved; HANDOFF.md is never touched.

**Examples:**
```
/super-gsd:sg-toggle-review off    # skip code review
/super-gsd:sg-toggle-tdd on        # enable the TDD gate
/super-gsd:sg-toggle-learn         # flip the retrospective on/off
```

After each call the resulting `execute → … → ship` sequence is printed for confirmation.

---

## Workflow Guide

Run the commands in sequence to complete a full GSD → Superpowers → sg-retro cycle:

1. **`sg-start`** — begin a new project or milestone. GSD scaffolds the `.planning/` directory.
2. **`sg-explore`** — map the codebase. GSD produces an exploration report.
3. **`sg-plan`** — gather context and create a phase plan. The 2-step chain handles `discuss-phase` and `plan-phase` automatically.
4. **`sg-execute`** — hand the plan to Superpowers. The packaged prompt is passed to `superpowers:executing-plans` automatically.
5. **`sg-review`** — request a code review via Superpowers when implementation is complete.
6. **`sg-learn`** — run a retrospective via `sg-retro` after the review. Extracted patterns feed back into the next planning cycle.
7. **`sg-ship`** — close out the milestone via GSD.

At any point, run **`sg-status`** to see where you are in the cycle and what command to run next.

Each command prints a completion message that names the next command, so you never have to memorize the sequence.

---

## sg-retro

**Slash command:** `/super-gsd:sg-retro`

**Maps to:** internal sg-retro Skill (no external delegation)

**Arguments:** `[phase] [lens...|--pick]` — phase 번호(없으면 STATE.md `^Phase:` 자동 감지) + 옵션 lens 목록 또는 `--pick` 플래그.

**What it does:** phase 회고를 수행하고 결과를 `.planning/lessons/{NN}-{YYYY-MM-DD}.md`에 append한다. v2.9에서 3 lens(`ssc`/`dspm`/`analyze`)로 통합되었으며, 인자 없이 호출 시 smart default(`dspm` + `ssc`)가 자동 실행된다. 제거된 lens(`4ls`/`sail`/`5why`) 또는 미지 코드는 stderr 에러 + `exit 1`로 거부된다. `--pick`은 Claude Code 한정 AskUserQuestion multiSelect를 띄우고, Codex/Gemini 환경에서는 graceful exit + 위치 인자 사용 안내로 폴백한다.

**Examples:**
```
/super-gsd:sg-retro                    # smart default: dspm + ssc
/super-gsd:sg-retro 42 ssc              # 단일 lens
/super-gsd:sg-retro 42 ssc dspm analyze # 멀티 lens
/super-gsd:sg-retro 42 --pick           # Claude Code only — AskUserQuestion picker
```

각 lens 출력은 `## Lens: {name}` 헤더 + `_Captured: {ISO}_` italic + `_Intent: ..._` italic + 고유 subheading + Action Items 3-column 테이블(P1 행은 `🔴` 강조)로 구성된다.

---

## sg-lessons

**Slash command:** `/super-gsd:sg-lessons`

**Maps to:** `hooks/lessons_ranker.cjs` 호출 + 출력 포맷팅

**Arguments:** `[phase-filter]` — 선택. 특정 phase의 lessons만 필터링하려면 phase 번호 또는 슬러그(예: `phase-03`).

**What it does:** `.planning/lessons/*.md`의 weighted top-N 패턴과 전체 lesson 목록을 표시한다. `sg-plan`이 자동으로 같은 출력을 phase context로 주입하므로, 사용자가 plan 전 학습 내용을 별도 검토할 때 명시적으로 호출한다.

**Example:**
```
/super-gsd:sg-lessons               # 전체 lessons
/super-gsd:sg-lessons 42            # phase 42 만
```

---

## sg-next

**Slash command:** `/super-gsd:sg-next`

**Maps to:** routing-only meta command (no external Skill delegation; invokes the next sg-* Skill itself)

**Arguments:** (none)

**What it does:** `.planning/HANDOFF.md`의 마지막 행과 `.planning/STATE.md`의 `^Phase:` 라인을 읽어 현재 워크플로우 stage를 감지하고, `sg-status`와 동일한 routing 테이블로 다음 sg-* Skill을 즉시 invoke한다. 모호한 상태(`complete` 또는 `init`)에서는 AskUserQuestion으로 사용자에게 선택을 요청한다 (Codex/Gemini는 numbered list 폴백).

**Routing table:**
- `init` → `sg-plan {PHASE_NUM}`
- `gsd-plan` / `ui-plan` → `sg-execute`
- `superpowers` / `parallel` / `execute` → `sg-review`
- `review` → `sg-learn`
- `sg-retro` → `sg-ship`
- `ship` → `sg-plan {NEXT_PHASE}` (다음 phase 존재 시) 또는 `sg-complete`
- `complete` → AskUserQuestion `sg-new` 또는 Cancel

**Example:**
```
/super-gsd:sg-next   # 현재 단계 감지 + 다음 명령 자동 실행
```

invoke 전에 `.planning/HANDOFF.md`에 `| ts | phase | from | sg-next | - |` 메타 transition 행을 append한다.

---

## sg-parallel-execute

**Slash command:** `/super-gsd:sg-parallel-execute`

**Maps to:** N개 Task() agent 병렬 dispatch (no Skill delegation)

**Arguments:** `[phase|parallel_groups.json path]` — phase 번호 또는 명시적 JSON 경로. 인자 없이 호출하면 STATE.md에서 phase 자동 감지.

**What it does:** `parallel_groups.json`을 읽어 wave-ascending 순서로 최대 3개 Task() agent를 같은 응답에서 병렬 dispatch한다. 각 agent는 자기 group의 PLAN.md를 직접 읽고 `superpowers:executing-plans` 호출 없이 task를 수행한다. group이 3개를 초과하면 첫 3개를 병렬로 처리한 뒤 나머지를 sequential 처리한다. `parallel_groups.json`이 없으면 `sg-execute`가 PLAN.md `wave:` 필드에서 자동 생성한 후 본 명령으로 라우팅한다.

**Constraint:** 각 Task() agent는 `superpowers:executing-plans` 호출 금지, `.planning/HANDOFF.md`/`.planning/STATE.md` 쓰기 금지, GSD/Superpowers 내부 파일 수정 금지 (D-10/D-16 staging 제약 — phase-level commit은 워크플로우 끝에서 일괄 수행).

**Example:**
```
/super-gsd:sg-parallel-execute 42                                                # phase 42
/super-gsd:sg-parallel-execute .planning/phases/42-smart-default-lens/parallel_groups.json
```

---

## sg-phase

**Slash command:** `/super-gsd:sg-phase`

**Maps to:** `edit`/`remove`는 `gsd-phase`에 위임, `complete`는 인라인 구현

**Arguments:** `<edit|remove|complete> <N> [추가 인자]`

**What it does:** 기존 phase를 편집·제거·완료 처리한다. `edit <N>`와 `remove <N>`는 GSD의 `gsd-phase --edit` / `--remove`로 위임한다. `complete [N]`은 GSD가 제공하지 않는 super-gsd 고유 동작 — ROADMAP.md Progress 행 status를 `Complete`로, Phases 체크박스를 `[x]`로, STATE.md 진행률을 phase 완료 반영하도록 정합화한다. `N` 생략 시 현재 phase 자동 감지.

**Examples:**
```
/super-gsd:sg-phase edit 7              # phase 7 메타데이터 편집
/super-gsd:sg-phase remove 9            # 미시작 phase 9 제거 + 후속 번호 재정렬
/super-gsd:sg-phase complete 7          # phase 7을 완료 처리 (ROADMAP + STATE 동기화)
/super-gsd:sg-phase complete            # 현재 phase 완료 처리
```

---

## sg-quick

**Slash command:** `/super-gsd:sg-quick`

**Maps to:** `gsd-planner` + `superpowers:executing-plans` 직접 chain (subagent 생략)

**Arguments:** `<자연어 task 설명>` — 일회성 작업을 한 문장으로 기술.

**What it does:** 메인 phase 워크플로우 바깥의 ad-hoc task를 plan → execute → commit 한 사이클로 처리한다. phase 디렉토리를 생성하지 않고 STATE.md의 Quick Tasks Completed 테이블에만 1행 추가한다. 작은 버그 수정, 문서 업데이트, config 변경 등 phase 단위로 분리하기 무리한 작업에 사용한다.

**Example:**
```
/super-gsd:sg-quick fix null pointer in payment webhook handler
/super-gsd:sg-quick update README.md installation section to mention npx alternative
```

---

## sg-setup

**Slash command:** `/super-gsd:sg-setup`

**Maps to:** in-session installer (no external Skill)

**Arguments:** `[--gemini]` — 옵션. Gemini/Antigravity CLI 환경에 추가 설치 시 사용.

**What it does:** 현재 프로젝트 루트에 super-gsd의 hook 설정과 skill 파일을 복사한다. Claude Code 세션 안에서 실행 가능한 인세션 설치 도구로, npx 명령 없이 즉시 설치할 수 있다. 기본 설치는 `.codex/hooks.json` + `hooks/*.cjs` + `.agents/skills/`를 배치하고, `--gemini` 플래그는 추가로 `.gemini/settings.json`을 배치한다.

**Example:**
```
/super-gsd:sg-setup              # Codex 환경 설치
/super-gsd:sg-setup --gemini     # Codex + Gemini 환경 설치
```

---

## sg-update

**Slash command:** `/super-gsd:sg-update`

**Maps to:** GSD + Superpowers + super-gsd 설치/업데이트 도구 호출

**Arguments:** (none)

**What it does:** `@opengsd/get-shit-done-redux` (GSD), `claude-plugins-official/superpowers` (Superpowers), 그리고 super-gsd 자체의 설치 상태를 확인하고, 누락된 것은 설치, 설치된 것은 최신 버전으로 업데이트한다. 첫 설치 시 한 명령으로 전체 의존성을 정리할 수 있고, 정기적으로 호출해 세 도구를 동시에 최신 상태로 유지한다.

**Example:**
```
/super-gsd:sg-update
```

---

## sg-cleanup

**Slash command:** `/super-gsd:sg-cleanup`

**Maps to:** `gsd-cleanup` 위임 + 요약 테이블 출력

**Arguments:** (none)

**What it does:** 완료된 마일스톤의 `.planning/phases/{NN}-*/` 디렉토리를 `.planning/milestones/{vX.Y}-phases/`로 아카이브한다. 일반적으로 milestone close(`sg-complete`) 후 호출해 `.planning/phases/`를 정돈한다. 아카이브 완료 후 어떤 phase가 어디로 이동했는지 요약 테이블을 표시한다.

**Example:**
```
/super-gsd:sg-cleanup
```

---
