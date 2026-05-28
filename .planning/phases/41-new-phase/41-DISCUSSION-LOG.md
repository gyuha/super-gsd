# Phase 41: 팀 문서화 — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 41-team-documentation
**Areas discussed:** TEAM.md location, TEAM.md content, README section, README.ko.md sync, AGENTS.md

---

## A. TEAM.md Location

| Option | Description | Selected |
|--------|-------------|----------|
| `.planning/TEAM.md` | Per ROADMAP success criteria 1 and REQUIREMENTS DOC-01 | ✓ |
| Project root `TEAM.md` | Agent task prompt suggested this | |

**User's choice:** Pre-decided by agent task prompt ("TEAM.md 위치: 프로젝트 루트"), but locked requirements (ROADMAP + REQUIREMENTS.md) take precedence — `.planning/TEAM.md`.
**Notes:** ROADMAP.md Phase 41 Success Criteria and REQUIREMENTS.md DOC-01 both explicitly state `.planning/TEAM.md`. Requirements are locked; project root suggestion was overridden.

---

## B. TEAM.md Content Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (branch naming + 1-pager) | Just conventions list, no examples | |
| Full onboarding guide | Quick Start + 3 sections + examples | ✓ |

**User's choice:** Auto-decided — Full onboarding guide (4 sections: Quick Start, Branch strategy, File ownership, Merge order).
**Notes:** Target reader is a new team member encountering sg-execute branch workflow and sg-status --team for the first time. Examples improve usability without exceeding scope.

---

## C. README.md Section Title and Placement

| Option | Description | Selected |
|--------|-------------|----------|
| `## Team Usage` | Per ROADMAP success criteria 2 wording | |
| `## Team Workflow` | Per agent task prompt specification | ✓ |

**User's choice:** Pre-decided — `## Team Workflow` (agent task prompt).
**Notes:** Placed after `## Usage Examples`, before `## Installation` — natural discovery position in the existing section order.

---

## D. README.ko.md Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Sync with Korean translation | ROADMAP success criteria 3 requires it | ✓ |
| Skip | | |

**User's choice:** Sync required — `## 팀 워크플로우` section in Korean.

---

## E. AGENTS.md Update

| Option | Description | Selected |
|--------|-------------|----------|
| Add brief team workflow section | Agent task prompt: "필요시 간략한 팀 워크플로우 섹션 추가" | |
| Do not update | REQUIREMENTS.md does not mention AGENTS.md | ✓ |

**User's choice:** Auto-decided — do not update AGENTS.md. REQUIREMENTS scope does not include it.

---

## Claude's Discretion

- TEAM.md section order and exact prose — standard onboarding guide format
- README.md Team Workflow section length — concise (fits within existing README style)
- Whether to include `sg-status --team` output example in README — included for discoverability

## Deferred Ideas

- AGENTS.md 팀 워크플로우 섹션 추가 — not in v2.8 requirements, deferred to v2.9
- STATE.md per-user 분리 — REQUIREMENTS Future Requirements, v2.9 candidate
- 팀원별 phase 할당 기능 — post-v2.9
