# Phase 25 검증 보고서

날짜: 2026-05-23

## QUAL-02 수정 결과

17개 SKILL.md의 `description` 필드를 "Use this when [상황] — [동작]." 패턴으로 교체하여 skill-creator 트리거 기준에 맞게 정렬했다.

| 스킬 슬럿 | 수정 전 description | 수정 후 description | 등급 변화 |
|-----------|---------------------|---------------------|-----------|
| sg-complete | Complete the current milestone — invokes gsd-complete-milestone Skill. | Use this when the current milestone is done and needs to be closed — invokes gsd-complete-milestone to finalize and archive the milestone. | POOR → GOOD |
| sg-execute | Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans. | Use this when the phase plan is ready and implementation should begin — packages PLAN/REQ/SC and hands off to Superpowers via superpowers:executing-plans. | POOR → GOOD |
| sg-explore | Explore and map the codebase — invokes gsd-map-codebase Skill. | Use this when you need a map of the current codebase structure — invokes gsd-map-codebase to analyse and document the project layout. | POOR → GOOD |
| sg-health | Diagnose super-gsd installation status — GSD, Superpowers, Hookify (optional), hooks, HANDOFF.md, STATE.md | Use this when something feels broken or before onboarding — diagnoses GSD, Superpowers, hooks, HANDOFF.md, and STATE.md installation line by line. | POOR → GOOD |
| sg-learn | Run a retrospective via sg-retro to extract patterns and generate hooks from this session. | Use this when a phase is complete and you want to extract patterns and lessons from the session — delegates to sg-retro for structured retrospective. | POOR → GOOD |
| sg-lessons | List prior lessons from .planning/lessons/ (written by sg-retro) and inject them as context for the next GSD phase. | Use this when starting a new phase and you want to review prior lessons before planning — lists weighted lessons from .planning/lessons/ as context. | POOR → GOOD |
| sg-new | Start a new milestone — invokes gsd-new-milestone Skill. | Use this when a milestone is complete and a new one should begin — invokes gsd-new-milestone to set up the next milestone. | POOR → GOOD |
| sg-parallel-execute | Reads parallel_groups.json and dispatches up to 3 parallel Task() agents — one per independent group — to execute PLAN.md tasks directly without calling superpowers:executing-plans. | Use this when parallel_groups.json exists and independent plan groups should run concurrently — dispatches up to 3 Task() agents, one per group, without calling superpowers:executing-plans. | POOR → GOOD |
| sg-plan | Gather context (injects .planning/lessons/) and create a phase plan — chains gsd-discuss-phase → gsd-plan-phase automatically. | Use this when a new phase needs to be planned — injects prior lessons, then chains gsd-discuss-phase and gsd-plan-phase automatically. | POOR → GOOD |
| sg-quick | Execute a small, ad-hoc task with GSD guarantees (atomic commits, STATE.md tracking). Quick mode for one-off tasks that don't need a full phase plan. | Use this when a small ad-hoc task needs to be done without a full phase plan — runs gsd-planner then superpowers:executing-plans with atomic commits and STATE.md tracking. | POOR → GOOD |
| sg-retro | Run a structured retrospective on a GSD phase with one of six lenses ... | Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of six lenses (ssc, 4ls, dspm, sail, 5why, analyze) and appends results to .planning/lessons/. | POOR → GOOD |
| sg-review | Request a code review via Superpowers — derives git range, collects description, then invokes superpowers:requesting-code-review Skill. | Use this when implementation is complete and a code review is needed — derives the git range automatically and invokes superpowers:requesting-code-review. | POOR → GOOD |
| sg-ship | Complete and ship the current milestone — invokes gsd-ship Skill. | Use this when the milestone is ready to be shipped — resolves the current phase and invokes gsd-ship to complete delivery. | POOR → GOOD |
| sg-start | Start or resume a project — detects existing session, prompts Resume / Start new milestone / Cancel; falls back to gsd-new-project when no session is detected. | Use this when starting or resuming work on a project — detects an existing session via STATE.md and prompts Resume, Start new milestone, or Cancel; falls back to gsd-new-project if no session exists. | FAIR → GOOD |
| sg-status | Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command. | Use this when you want to know where you are in the workflow — reads HANDOFF.md and STATE.md to show the current stage and the next recommended command. | POOR → GOOD |
| sg-ui-plan | Run UI design brainstorming for a phase — resolves phase context from ROADMAP.md and invokes superpowers:brainstorming. | Use this when UI design brainstorming is needed before planning a phase — reads phase context from ROADMAP.md and runs superpowers:brainstorming. | POOR → GOOD |
| sg-update | Check, install, or update GSD, superpowers, and super-gsd to their latest versions. | Use this when GSD, Superpowers, or super-gsd may be outdated — checks each tool's installation status and installs or updates to the latest version. | POOR → GOOD |

## sg-retro 리팩토링 결과

`<lens_templates>` 블록(378~534행, 157줄)은 `<process>` Step 5 서브블록(221~267행)에 이미 정의된 6개 렌즈(ssc, 4ls, dspm, sail, 5why, analyze)의 마크다운 스켈레톤을 중복 수록한 것이었다. 삭제 전 Step 5의 고정 서브헤딩 목록과 lens_templates의 각 스켈레톤이 1:1 대응함을 확인 후 삭제를 진행했다.

| 구분 | 줄 수 |
|------|-------|
| 삭제 전 | 548줄 |
| 삭제 후 | 390줄 |
| 삭감량 | 158줄 |

## 결론

QUAL-06 충족 여부: **충족**

- QUAL-02 이슈 17건(POOR 16건 + FAIR 1건) 전건 GOOD 등급으로 수정 완료
- sg-retro `<lens_templates>` 중복 블록 삭제로 548줄 → 390줄(≤391줄 기준 충족)
- 모든 description이 단일 줄 "Use this when [상황] — [동작]." 패턴으로 표준화됨
