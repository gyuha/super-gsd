# super-gsd

Orchestrator plugin that auto-chains GSD → Superpowers → Hookify so planning, implementation, and retrospection stay connected as a single learning loop.

## What this is

`super-gsd` is a Claude Code plugin whose only job is to keep three other Claude Code plugins talking to each other. Strategy lives in GSD. Implementation lives in Superpowers. Retrospection lives in Hookify. When one of them finishes a stage, `super-gsd` is responsible for handing the context to the next one — so the user does not have to remember which command comes next, and so lessons learned in one cycle actually reach the next plan.

The problem this solves is that manual handoff between these three tools is fragile. People forget to run the review, skip the retro, lose context between sessions, or re-run a planning command that overwrites half-finished work. By separating roles and then orchestrating the seams between them, the same mistakes stop showing up.

**Phase 5 (this release) closes the learning loop.** Hookify retrospective output is now automatically captured to `.planning/lessons/` and injected into the next GSD plan phase — so lessons from one cycle feed the next without any manual steps. All nine slash commands covering the full GSD → Superpowers → Hookify cycle are available. See the **Commands** section below for the quick-reference table, and `docs/COMMANDS.md` for the full per-command reference.

## Workflow

```
sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
  (GSD)       (GSD)      (GSD)    (Superpowers) (Superpowers) (Hookify)  (GSD)
                ↑                                                  |
                └──── lessons auto-injected into next sg-plan ←───┘
                      (via .planning/lessons/ + sg-lessons)
```

`sg-status` can be run at any point to check current position.

## Commands

Quick reference for all `/super-gsd:sg-*` slash commands.

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/super-gsd:sg-start` | Scaffold a new project or milestone via `gsd-new-project` | At the very beginning of a new project or milestone |
| `/super-gsd:sg-explore` | Map and analyse the codebase via `gsd-explore` | After `sg-start`, before planning |
| `/super-gsd:sg-plan` | Gather phase context then create an execution plan (2-step chain: `gsd-discuss-phase` → `gsd-plan-phase`) | After `sg-explore`, when ready to plan |
| `/super-gsd:sg-execute` | Package the current phase plan and hand off to Superpowers (`sg-executing-plans`) | After `sg-plan` is complete |
| `/super-gsd:sg-review` | Request a code review via `superpowers:requesting-code-review` | After implementation is complete |
| `/super-gsd:sg-learn` | Run a Hookify retrospective to extract patterns and generate hooks (`hookify:hookify`) | After the review is done |
| `/super-gsd:sg-lessons` | List prior Hookify lessons from `.planning/lessons/` for review; accepts optional phase filter | Before `sg-plan` to review what was learned |
| `/super-gsd:sg-ship` | Complete and ship the current milestone via `gsd-ship` | After learning is captured |
| `/super-gsd:sg-status` | Show current stage, last handoff timestamp, and next recommended command | At any point to check where you are |

See [docs/COMMANDS.md](./docs/COMMANDS.md) for the full per-command reference including arguments and detailed descriptions.

## Prerequisites

`super-gsd` is non-invasive: it does not modify, fork, or replace any of the three plugins below. You install them independently first, and `super-gsd` simply chains their existing commands and hooks.

- **GSD** (`get-shit-done-cc` or an equivalent install) — provides the `/gsd-*` planning commands and the `.planning/` directory convention this plugin reads from.
- **Superpowers** (`claude-plugins-official/superpowers`) — provides the `superpowers:*` skill tree used during the build / review stage.
- **Hookify** (`claude-plugins-official/hookify`) — provides the `/hookify:*` commands used during the retrospection stage.

If any of the three is missing, `super-gsd` will still install cleanly, but the workflow it orchestrates will only be partial. Install all three first to get the full chain.

## Installation

After the prerequisites above are installed, run these two commands in your Claude Code session:

```
/plugin marketplace add gyuha/super-gsd
/plugin install super-gsd@super-gsd
```

The first command registers this repository as a self-hosted plugin marketplace. The second installs the `super-gsd` plugin from that marketplace. Once both succeed, move on to **Verify install** below.

## Verify install

After installation, confirm `super-gsd` loaded cleanly and your existing tools still work.

1. Run `/plugin list` and confirm that `super-gsd` appears in the listing with name, version, and description matching `.claude-plugin/plugin.json`.
2. Run `/gsd-progress` (or any other GSD command) and confirm GSD responds normally — this proves GSD remains intact and unmodified.
3. Open the `Skill` tree and confirm that `superpowers:*` skills are still discoverable and invokable — this proves Superpowers remains intact and unmodified.
4. Run `/hookify:help` and confirm Hookify responds with its usual help output — this proves Hookify remains intact and unmodified.

If all four checks pass, `super-gsd` is installed correctly and non-invasively.

## Roadmap

`super-gsd` ships in MVP vertical slices. Each phase delivers a coherent, testable user behavior.

- **Phase 1 — Plugin Scaffold (shipped):** installable plugin shell with manifest, marketplace metadata, README, and verify checklist. No commands or hooks yet.
- **Phase 2 — Manual Handoff & Status (shipped):** introduces `/super-gsd:sg-execute` (package a finished GSD phase as a Superpowers-ready prompt) and `/super-gsd:sg-status` (inspect current stage, last handoff, next recommended command).
- **Phase 3 — sg- Command Set & README (shipped):** delivers the full 8-command `sg-` interface and updated documentation so the entire GSD → Superpowers → Hookify cycle has discoverable slash commands.
- **Phase 4 — Auto-Advance Hooks (shipped):** registers `Stop` hooks so stage transitions are auto-detected — completed `plan-phase` surfaces a handoff prompt, completed `code-reviewer` auto-invokes Hookify.
- **Phase 5 — Lessons Feedback Loop (this release):** persists Hookify findings into `.planning/lessons/` and surfaces them automatically when the next GSD phase begins via `sg-plan` Step 0 injection and the new `sg-lessons` command, closing the learning loop.

## 한국어 요약

`super-gsd`는 GSD → Superpowers → Hookify 세 단계 워크플로우를 자동으로 이어 주는 Claude Code 플러그인이다. 전략(GSD), 구현(Superpowers), 회고(Hookify)의 역할을 분리한 상태에서, 각 단계가 끝나는 시점에 다음 단계로 컨텍스트와 함께 자연스럽게 인계되도록 명령과 훅을 제공한다.

Phase 5에서 학습 루프가 완성되었다. Hookify 회고 출력이 `.planning/lessons/{phase}-{date}.md`로 자동 저장되고, 다음 `sg-plan` 실행 시 Step 0에서 자동으로 주입된다. `sg-lessons` 명령으로 수동 확인도 가능하다. 전체 명령어는 9개: `sg-start`, `sg-explore`, `sg-plan`, `sg-execute`, `sg-review`, `sg-learn`, `sg-lessons`, `sg-ship`, `sg-status`.

핵심 가치는 **학습 루프가 끊기지 않게 하는 것**이다. 사용자가 도구 간 전환을 직접 기억하지 않아도 단계 종료를 감지해 다음 단계 도구로 인계가 일어나며, 회고에서 추출한 패턴이 다음 계획에 자동으로 반영된다. 그래서 같은 실수가 반복되지 않는다.

설계 원칙은 **비침투적 orchestrator** — 기존 GSD/Superpowers/Hookify의 어떤 파일도 수정하지 않는다.

## License

Released under the MIT License. See [LICENSE](./LICENSE) for the full text.
