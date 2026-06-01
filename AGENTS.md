## Project

**super-gsd**

GSD → sg-retro 2단계 AI 개발 워크플로우를 Codex, Gemini CLI, Antigravity CLI에서 실행하는 플러그인이다. GSD가 전략과 계획을, sg-retro가 회고와 학습을 담당하며, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 스킬과 훅을 제공한다.

**Core Value:** 각 도구의 단계 종료 시점에 다음 단계로 컨텍스트와 함께 자동 인계되어, 사용자가 도구 간 전환을 직접 기억하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

### Constraints

- **Tech stack**: Bash/Node.js (`.cjs`)/Markdown 위주. `.agents/skills/` 스킬 파일로 동작. (v2.4 Phases 28-31에서 Python을 Node.js로 마이그레이션 완료)
- **Dependencies**: `@opengsd/get-shit-done-redux` (GSD) 설치 권장. GSD 없이도 prose 폴백으로 실행 가능.
- **Non-invasive**: 기존 GSD 파일을 수정하지 않고 외부에서 orchestrate한다.

## Quick Start

**Step 0: 설치**

```bash
# 터미널에서 (세션 외부):
npx @gyuha/super-gsd install          # Codex 기본
npx @gyuha/super-gsd install --gemini # Gemini 추가
```

> **또는 세션 내부에서:** `$sg-setup` (Codex) / `$sg-setup --gemini` (Gemini)

**Step 1: 사전 조건 확인**

```bash
# GSD 설치 여부 확인 (권장)
which gsd-sdk 2>/dev/null && echo "GSD installed" || echo "GSD not found — prose fallback mode"
```

**Step 2: 새 프로젝트 또는 기존 세션 시작**

```
$sg-start
```

기존 `.planning/STATE.md`가 감지되면 Resume / Start new milestone / Cancel 옵션을 텍스트로 출력한다. 세션이 없으면 GSD `new-project`에 위임하거나 prose 폴백으로 `.planning/` 구조를 생성한다.

**Step 3: 워크플로우 순서**

```
$sg-plan N → $sg-execute → $sg-review → $sg-learn → $sg-ship
```

각 단계는 `.agents/skills/` 아래 SKILL.md를 직접 읽어 실행한다. `$sg-learn`은 `$sg-retro`로 위임되어 회고를 수행한다 (D-11 thin pass-through). `$sg-next`로 현재 단계를 감지하고 다음 명령을 출력시킬 수도 있다 — Codex/Gemini에서는 자동 호출이 아닌 "다음 명령 실행하세요" reminder만 제공한다.

## Platform Limitations

> **Codex / Gemini CLI / Antigravity CLI 사용자는 반드시 읽을 것**

### SubagentStop 미지원

Codex, Gemini CLI, Antigravity CLI에서는 `SubagentStop` 훅이 동작하지 않는다. Claude Code에서는 단계 종료 시 다음 단계가 자동 안내되지만, 이 플랫폼에서는 **각 단계 완료 후 다음 스킬을 수동으로 호출해야 한다**.

- `$sg-execute` 완료 후 → `$sg-review` 수동 실행
- `$sg-review` 완료 후 → `$sg-learn` (또는 `$sg-retro`) 수동 실행
- `$sg-learn` 완료 후 → `$sg-ship` 수동 실행

`$sg-next`를 호출하면 HANDOFF.md/STATE.md를 읽어 "다음에 실행할 명령"을 stderr로 안내한다. Claude Code의 auto-invoke와 달리 자동 호출은 하지 않으므로 사용자가 직접 실행한다.

### Superpowers 연동 불가

`superpowers:executing-plans`, `superpowers:requesting-code-review` 등 Superpowers 스킬은 Claude Code 전용이다. 이 플랫폼에서:

- `$sg-execute` → PLAN.md를 직접 읽고 태스크를 순차 실행하는 **직접 구현 모드**로 동작
- `$sg-review` → 변경 파일을 직접 읽고 코드 리뷰를 prose로 수행하는 **직접 리뷰 모드**로 동작

### AskUserQuestion 미지원

대화형 선택지는 numbered list 텍스트로 출력된다. 응답은 번호 또는 텍스트로 자유 입력한다.

**예외 — `$sg-retro --pick` (v2.9):** Claude Code의 `--pick` 플래그(인터랙티브 lens 선택)는 AskUserQuestion이 필요하므로 Codex/Gemini에서는 stderr 에러 메시지 + `exit 1`로 graceful 종료한다. **대안:** lens 인자를 생략해 smart default(`dspm` + `ssc`)를 자동 실행하거나, 위치 인자로 직접 지정한다 — 예: `$sg-retro 14 ssc dspm analyze`.

## Skills

스킬 파일 위치: `.agents/skills/` (15개 스킬)

| 스킬 | 설명 |
|------|------|
| `sg-start` | 기존 세션 감지 또는 신규 프로젝트 시작. 새 프로젝트/마일스톤 시작 시 생략 단계 설정 prompt |
| `sg-plan N` | 컨텍스트 수집 후 GSD phase 계획 생성 |
| `sg-execute` | PLAN.md를 읽고 태스크를 순차 실행. `wave:` 필드가 있으면 `sg-parallel-execute`로 라우팅 |
| `sg-parallel-execute` | 독립 plan 그룹을 wave 단위로 병렬 실행 (`parallel_groups.json` 자동 생성) |
| `sg-tdd` | `tdd_mode=true`일 때 execute 후 TDD 검증 게이트 실행 |
| `sg-review` | 변경 파일 코드 리뷰를 직접 수행. BASE==HEAD + dirty tree 감지 시 commit 안내 (v2.9 quick task) |
| `sg-learn` | `sg-retro`로 thin pass-through (D-11 invariant 유지) |
| `sg-retro` | phase 회고 — **3 lens**(`ssc`/`dspm`/`analyze`), smart default `dspm+ssc` 자동 실행. `--pick`는 graceful exit (v2.9) |
| `sg-ship` | GSD ship 또는 git merge |
| `sg-status` | 현재 워크플로우 단계 및 다음 권장 명령 표시. `--team` 옵션으로 팀원별 위치 표시 (v2.8) |
| `sg-next` | HANDOFF.md/STATE.md 기반 다음 명령 routing — Codex/Gemini는 reminder 출력만 (auto-invoke 미지원) |
| `sg-toggle-tdd` | `super_gsd.tdd_mode` ON/OFF 토글 (`on`/`off` 또는 인자 없이 플립) |
| `sg-toggle-review` | `super_gsd.skip_review` 토글 — sg-review 단계 포함/생략 |
| `sg-toggle-learn` | `super_gsd.skip_learn` 토글 — sg-learn 단계 포함/생략 |
| `sg-setup` | 인세션 설치 — `.codex/hooks.json`, `.gemini/settings.json`, `hooks/`, `.agents/skills/` 자동 배치 |

**스킬 호출 방법:**

```
# 달러 문법 (Codex / Gemini CLI 표준)
$sg-plan 14

# 또는 Skill 도구 직접 사용
Skill(skill="sg-plan", args="14")
```

> **Claude Code 사용자:** `$sg-*` = `/super-gsd:sg-*` 슬래시 명령과 동일하다.
> 예: `$sg-plan 15` → `/super-gsd:sg-plan 15`

각 스킬의 상세 동작, argument, 완료 조건은 해당 `.agents/skills/{name}/SKILL.md`를 참조한다.

## Retrospective workflow (v2.9 — smart default + 3 lens consolidation)

v2.9에서 회고 진입 마찰을 제거하기 위해 6개 lens를 3개로 통합하고 smart default를 도입했다.

### When to run `$sg-learn`

- `$sg-review`가 끝나고 `$sg-ship` 전에 호출해 phase 회고를 캡처
- 또는 어떤 작업이든 회고가 필요할 때 `$sg-retro <phase>` 직접 호출

### What `$sg-learn` does

`$sg-learn`은 `$sg-retro`로 thin pass-through한다. `$sg-retro`는:

- **인자 없음** → smart default: `dspm` + `ssc` 두 lens 순차 실행 (AskUserQuestion 없이)
- **`$sg-retro N ssc`** → ssc 단독 실행 (위치 인자)
- **`$sg-retro N ssc dspm`** → multi-lens 순차 실행
- **`$sg-retro N 4ls` / `sail` / `5why`** → stderr error + `exit 1` (v2.9에서 제거된 lens)
- **`$sg-retro N --pick`** → Codex/Gemini에서 graceful exit (AskUserQuestion 미지원). 위치 인자로 대체

각 lens 출력 상단에 `_Captured: {ISO}_` 다음 줄에 `_Intent: ..._`로 lens 의도가 표시되며, Action Items 테이블의 P1 행은 `🔴 P1`로 강조된다.

### Where results live

`.planning/lessons/{NN}-{YYYY-MM-DD}.md`로 저장된다. 다음 `$sg-plan` 호출 시 weighted top-N + 누적 lessons가 자동 주입되어 같은 mistake 재발을 방지한다.

## Team Collaboration (v2.8)

`.planning/HANDOFF.md`에 `User` 컬럼이 추가되어 각 stage handoff가 git user.name에 귀속된다. 팀 작업 시:

```
$sg-status --team   # 팀원별 현재 phase·stage·last activity 테이블
```

자세한 브랜치 컨벤션, 파일 ownership 규칙, merge 순서는 `.planning/TEAM.md`를 참조한다.

## Workflow Overview

```
$sg-start → $sg-plan N → $sg-execute → $sg-review → $sg-learn → $sg-ship
              ↑                                          |
              └──── lessons 자동 주입 ←──────────────────┘
                    (.planning/lessons/)
```

| 단계 | 스킬 | 설명 |
|------|------|------|
| 시작 | `$sg-start` | 세션 감지 또는 신규 프로젝트 |
| 계획 | `$sg-plan N` | phase N 계획 생성 (GSD 위임 또는 prose 폴백) |
| 실행 | `$sg-execute` | PLAN.md 태스크 순차 실행 (직접 구현 모드). `wave:` 다중 그룹 시 `$sg-parallel-execute`로 라우팅 |
| 리뷰 | `$sg-review` | 코드 리뷰 prose 수행 → SUMMARY.md 작성 (v2.9 commit gate 포함) |
| 학습 | `$sg-learn` | `$sg-retro`로 위임 — smart default `dspm + ssc` 회고 → `.planning/lessons/` 저장 (**수동 호출 필수**) |
| 배포 | `$sg-ship` | GSD ship 또는 git merge |

`$sg-status`는 언제든지 실행해 현재 단계와 다음 권장 명령을 확인할 수 있다 (`--team` 옵션 가능).

**`$sg-learn` / `$sg-retro`는 SubagentStop 미지원으로 자동 실행되지 않는다.** `$sg-review` 완료 후 반드시 `$sg-learn`(또는 `$sg-retro <phase>`)을 수동으로 호출해 회고를 실행하라.
