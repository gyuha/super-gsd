## Project

**super-gsd**

GSD → sg-retro 2단계 AI 개발 워크플로우를 Codex, Gemini CLI, Antigravity CLI에서 실행하는 플러그인이다. GSD가 전략과 계획을, sg-retro가 회고와 학습을 담당하며, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 스킬과 훅을 제공한다.

**Core Value:** 각 도구의 단계 종료 시점에 다음 단계로 컨텍스트와 함께 자동 인계되어, 사용자가 도구 간 전환을 직접 기억하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

### Constraints

- **Tech stack**: Bash/Python/Markdown 위주. `.agents/skills/` 스킬 파일로 동작.
- **Dependencies**: `@opengsd/get-shit-done-redux` (GSD) 설치 권장. GSD 없이도 prose 폴백으로 실행 가능.
- **Non-invasive**: 기존 GSD 파일을 수정하지 않고 외부에서 orchestrate한다.

## Quick Start

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
$sg-plan N → $sg-execute → $sg-review → $sg-retro → $sg-ship
```

각 단계는 `.agents/skills/` 아래 SKILL.md를 직접 읽어 실행한다.

## Platform Limitations

> **Codex / Gemini CLI / Antigravity CLI 사용자는 반드시 읽을 것**

### SubagentStop 미지원

Codex, Gemini CLI, Antigravity CLI에서는 `SubagentStop` 훅이 동작하지 않는다. Claude Code에서는 단계 종료 시 다음 단계가 자동 안내되지만, 이 플랫폼에서는 **각 단계 완료 후 다음 스킬을 수동으로 호출해야 한다**.

- `$sg-execute` 완료 후 → `$sg-review` 수동 실행
- `$sg-review` 완료 후 → `$sg-retro` 수동 실행

### Superpowers 연동 불가

`superpowers:executing-plans`, `superpowers:requesting-code-review` 등 Superpowers 스킬은 Claude Code 전용이다. 이 플랫폼에서:

- `$sg-execute` → PLAN.md를 직접 읽고 태스크를 순차 실행하는 **직접 구현 모드**로 동작
- `$sg-review` → 변경 파일을 직접 읽고 코드 리뷰를 prose로 수행하는 **직접 리뷰 모드**로 동작

### AskUserQuestion 미지원

대화형 선택지는 numbered list 텍스트로 출력된다. 응답은 번호 또는 텍스트로 자유 입력한다.

## Skills

스킬 파일 위치: `.agents/skills/`

| 스킬 | 설명 |
|------|------|
| `sg-start` | 기존 세션 감지 또는 신규 프로젝트 시작 |
| `sg-plan N` | 컨텍스트 수집 후 GSD phase 계획 생성 |
| `sg-execute` | PLAN.md를 읽고 태스크를 순차 실행 |
| `sg-review` | 변경 파일 코드 리뷰를 직접 수행 |
| `sg-status` | 현재 워크플로우 단계 및 다음 권장 명령 표시 |
| `sg-retro` | phase 회고 (6개 렌즈, numbered list fallback) |

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

## Workflow Overview

```
$sg-start → $sg-plan N → $sg-execute → $sg-review → $sg-retro → $sg-ship
                ↑                                         |
                └──── lessons 자동 주입 ←─────────────────┘
                      (.planning/lessons/)
```

| 단계 | 스킬 | 설명 |
|------|------|------|
| 시작 | `$sg-start` | 세션 감지 또는 신규 프로젝트 |
| 계획 | `$sg-plan N` | phase N 계획 생성 (GSD 위임 또는 prose 폴백) |
| 실행 | `$sg-execute` | PLAN.md 태스크 순차 실행 (직접 구현 모드) |
| 리뷰 | `$sg-review` | 코드 리뷰 prose 수행 → SUMMARY.md 작성 |
| 회고 | `$sg-retro` | 6개 렌즈 회고 → .planning/lessons/ 저장 (**수동 호출 필수**) |
| 배포 | `$sg-ship` | GSD ship 또는 git merge |

`$sg-status`는 언제든지 실행해 현재 단계와 다음 권장 명령을 확인할 수 있다.

**sg-retro는 SubagentStop 미지원으로 자동 실행되지 않는다.** `$sg-review` 완료 후 반드시 `$sg-retro`를 수동으로 호출해 회고를 실행하라.
