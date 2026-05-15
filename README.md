# super-gsd

Orchestrator plugin that auto-chains GSD → Superpowers → Hookify so planning, implementation, and retrospection stay connected as a single learning loop.

## Workflow

```
   +-------------------+        +------------------------+        +----------------------+
   |    GSD            |  --->  |   Superpowers          |  --->  |   Hookify            |
   |  (planning)       |        |   (building)           |        |   (learning)         |
   |                   |        |                        |        |                      |
   |  requirements ->  |        |  plan -> execute ->    |        |  retrospect ->       |
   |  roadmap ->       |        |  review -> commit      |        |  extract patterns -> |
   |  phase plan       |        |                        |        |  generate hooks      |
   +-------------------+        +------------------------+        +----------------------+
            ^                                                                  |
            |                                                                  |
            +-------------- lessons feed back into next plan ------------------+
```

Each tool keeps its own focus; `super-gsd` only handles the handoffs between them.

## What this is

`super-gsd` is a Claude Code plugin whose only job is to keep three other Claude Code plugins talking to each other. Strategy lives in GSD. Implementation lives in Superpowers. Retrospection lives in Hookify. When one of them finishes a stage, `super-gsd` is responsible for handing the context to the next one — so the user does not have to remember which command comes next, and so lessons learned in one cycle actually reach the next plan.

The problem this solves is that manual handoff between these three tools is fragile. People forget to run the review, skip the retro, lose context between sessions, or re-run a planning command that overwrites half-finished work. By separating roles and then orchestrating the seams between them, the same mistakes stop showing up.

**Phase 1 (this release) ships an installable plugin shell only.** There are no `/super-gsd:*` commands or hooks yet — those arrive in later phases. What you get today is a clean install path, a non-invasive footprint, and a documented roadmap so you can verify nothing of yours breaks before commands start appearing. See the **Roadmap** section for what is coming next.

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
- **Phase 2 — Manual Handoff & Status:** introduces `/super-gsd:to-superpowers` (package a finished GSD phase as a Superpowers-ready prompt) and `/super-gsd:status` (inspect current stage, last handoff, next recommended command).
- **Phase 3 — Auto-Advance Hooks:** registers `Stop` and `SubagentStop` hooks so stage transitions are auto-detected — completed `plan-phase` surfaces a handoff prompt, completed `code-reviewer` auto-invokes Hookify.
- **Phase 4 — Lessons Feedback Loop:** persists Hookify findings into `.planning/lessons/` and surfaces them automatically when the next GSD phase begins, closing the learning loop.

## 한국어 요약

`super-gsd`는 GSD → Superpowers → Hookify 세 단계 워크플로우를 자동으로 이어 주는 Claude Code 플러그인이다. 전략(GSD), 구현(Superpowers), 회고(Hookify)의 역할을 분리한 상태에서, 각 단계가 끝나는 시점에 다음 단계로 컨텍스트와 함께 자연스럽게 인계되도록 명령과 훅을 제공한다.

핵심 가치는 **학습 루프가 끊기지 않게 하는 것**이다. 사용자가 도구 간 전환을 직접 기억하지 않아도 단계 종료를 감지해 다음 단계 도구로 인계가 일어나며, 회고에서 추출한 패턴이 다음 계획에 다시 반영된다. 그래서 같은 실수가 반복되지 않는다.

설계 원칙은 **비침투적 orchestrator** — 기존 GSD/Superpowers/Hookify의 어떤 파일도 수정하지 않는다. 이 Phase 1은 설치 가능한 플러그인 셸까지만 제공하며, 실제 인계 명령과 훅은 Phase 2 이후 차례로 추가된다.

## License

Released under the MIT License. See [LICENSE](./LICENSE) for the full text.
