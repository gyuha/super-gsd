# Phase 44: Documentation Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 44-documentation-sync
**Areas discussed:** Plan granularity, README sg-retro row scope, TEAM.md section shape, SC#3 frontmatter delta, Phase 42/43 carry-forward action items

**Mode:** Auto (per session-level `Auto Mode Active`). Discussion was conducted analytically against ROADMAP + REQUIREMENTS + Phase 42/43 CONTEXT/lessons + actual file states; no AskUserQuestion turns were invoked because the agent had sufficient direct evidence to lock all decisions.

---

## Plan granularity

| Option | Description | Selected |
|--------|-------------|----------|
| 1 plan (single) | Bundle all 3 file edits + 2 frontmatter verifications into one PLAN.md | |
| 2 plans (wave:1 parallel) | Split by concern: 44-01 = README sync + SKILL.md verification; 44-02 = TEAM.md section. Mirror Phase 42/43 pattern | ✓ |
| N plans (per file) | One plan per file (4-5 plans) | |

**Selected rationale:** Phase 42/43 already validated wave:1 + non-overlapping files_modified pattern (2 Task() agents, ~5-6min each, 0 conflicts). README en/ko belong in same plan to lock prose drift across the language pair. TEAM.md section creation is a different verification model (prose completeness) from README row token grep — separation simplifies acceptance blocks.
**Notes:** D-03/D-04/D-05 in CONTEXT.md.

---

## README sg-retro row scope (SC#1 literal vs spirit)

| Option | Description | Selected |
|--------|-------------|----------|
| sg-learn row only (strict SC#1 literal) | Update only the sg-learn row per SC#1 wording | |
| sg-learn + sg-retro rows | Also update sg-retro row which currently says "6 lenses (Sailboat, Five Whys, and more)" — stale post-Phase 42 | ✓ |
| Full table audit | Re-verify every command row for staleness | |

**Selected rationale:** README.md line 50 currently advertises 6 lens names that were deleted in Phase 42. Leaving this row stale while updating the adjacent sg-learn row in the same Commands table directly contradicts the milestone goal ("README reflects new sg-learn/sg-retro behavior"). Not scope creep — milestone goal completion. Full table audit is out of scope (no other rows have known staleness).
**Notes:** D-02 in CONTEXT.md.

---

## TEAM.md section shape and language

| Option | Description | Selected |
|--------|-------------|----------|
| English header + English prose (match dominant pattern) | TEAM.md is currently English headers + English prose + 1 Korean sample table | ✓ |
| Korean header + Korean prose (CLAUDE.md "GSD 문서 작성 지침" strict) | All .planning/ docs in Korean | |
| Mixed: English header + Korean prose | Hybrid | |

**Selected rationale:** TEAM.md is already English-dominant. Switching to Korean would create drift within the file. CLAUDE.md "GSD 문서 작성 지침" rule applies to GSD skill-generated docs; TEAM.md was authored as a team-facing English doc. Deferred: TEAM.md full Korean migration as separate milestone-level decision.
**Notes:** D-08 in CONTEXT.md. Section positioned between "File ownership" and "Merge order" (D-09). 4 sub-blocks: When to run, What sg-learn does, When to use --pick, Where results live (D-10).

---

## SC#3 SKILL.md frontmatter delta

| Option | Description | Selected |
|--------|-------------|----------|
| No-op verification only | Phase 42/43 already updated frontmatters; grep verification suffices | ✓ (skills/) and ✓ (.agents/) |
| Add `--pick` mention to skills/ description | Marginal tightening to match Phase 43 addition | optional — planner discretion |
| Rewrite both frontmatters | Full rewrite | |

**Selected rationale:** Direct read of both SKILL.md files showed all required tokens present (`three lenses`, `(ssc, dspm, analyze)`, `Smart default`, `dspm+ssc`). `.agents/` description correctly notes Codex environment constraint with `--pick` graceful-exit. SC#3 ("3 lens 반영") is grep-met. `--pick` mention in skills/ description is optional improvement — planner judgment, low risk either way.
**Notes:** D-12, D-13, D-16 in CONTEXT.md.

---

## Phase 42/43 retro P1 carry-forward (scope decisions)

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle Phase 42/43 P1 #2, #3 into Phase 44 | Add commit automation + STATE.md sync to this phase | |
| Defer again to future phase | Continue deferring | |
| Surface as recommended pre-phase quick tasks | Phase 43 P1 #2 explicitly says "should NOT be deferred again" — flag, don't bundle | ✓ |
| Apply P1 #1 (prose drift sub-class) within this phase's plan | Closure within plan template enumerate categories | ✓ |

**Selected rationale:**
- P1 #1 (prose drift "구조 묘사 보존 블록" sub-class): applied via D-14/D-15 in this phase's plan enumerate categories — closure within Phase 44. Permanent sg-plan template addition is separate quick task.
- P1 #2 (sg-parallel-execute → sg-review commit): bundling into Phase 44 violates DOC-01 scope. But Phase 44 uses 2 plans wave:1 parallel → 100% chance same manual commit step re-occurs. Recommendation: pre-phase quick task to fix `skills/sg-review/SKILL.md` Step 1.
- P1 #3 (STATE.md `Phase:` auto-sync): same — scope-out, recommend separate quick task. Workaround: pass phase number explicitly to sg-execute (`args="44"`).

**Notes:** D-17, D-18, D-19 in CONTEXT.md. Open ambiguity flagged for human confirmation: whether to interrupt Phase 44 for the commit-automation quick task before sg-execute, or accept one more manual commit and process after Phase 44 ship.

---

## Claude's Discretion

- README description exact phrasing — D-06/D-07 lock token sets, planner chooses prose composition.
- TEAM.md sub-block structure within 30-line cap — prose paragraph vs bullet vs mini-table free.
- skills/sg-retro/SKILL.md `--pick` token addition — D-12 recommends add, D-13 recommends hold; independent decisions per file.
- Quick task split timing for Phase 42/43 P1 #2 — before vs after Phase 44 (recommended before, dependent on user/schedule).

## Deferred Ideas

- `docs/COMMANDS.md` sg-learn/sg-retro entries update (separate quick task or v2.9.1 patch).
- CHANGELOG.md v2.9 entry (auto-generated by deploy trigger).
- sg-plan SKILL.md template permanent enumerate category addition (closure of Phase 43 P1 #1 lesson).
- sg-parallel-execute → sg-review BASE==HEAD auto-commit prompt (Phase 42/43 P1 #2 — explicitly "no more deferral" per Phase 43 lesson).
- STATE.md `Phase:` field auto-sync (Phase 43 P1 #3 — P1 priority after 3 milestone-internal recurrences).
- TEAM.md full Korean migration (milestone-level decision).
- README "How super-gsd handles retrospectives" standalone section (beyond Commands table).
- AGENTS.md sg-retro section staleness check.
- lessons_ranker.cjs `🔴 P1` compatibility (already validated in Phase 43 — informational deferred).
