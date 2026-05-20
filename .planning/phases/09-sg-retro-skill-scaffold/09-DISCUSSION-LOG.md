# Phase 9: sg-retro Skill scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 9-sg-retro-skill-scaffold
**Areas discussed:** A. Phase-argument resolution semantics, B. Context-collection scope, C. Lens execution model, D. Lens selection UX, E. Lessons file append schema

---

## A. Phase-argument resolution semantics

### A1. Phase argument empty fallback

| Option | Description | Selected |
|--------|-------------|----------|
| STATE.md fallback | Read `.planning/STATE.md` `Phase:` line as fallback (sg-plan/sg-execute pattern) | ✓ |
| Error out | Require explicit phase argument; fail otherwise | |
| Other | User-defined | |

**User's choice:** STATE.md fallback
**Notes:** Aligns with existing sg-plan / sg-execute / `_read_current_phase()` pattern; consistent ergonomics across the plugin.

### A2. Phase format accepted

| Option | Description | Selected |
|--------|-------------|----------|
| Number only | Bare number (`9` or `09`), zero-pad internally to find `.planning/phases/{NN}-*/` | ✓ |
| Number or slug-full | Accept `9` or `09-sg-retro-skill-scaffold` | |
| Other | User-defined | |

**User's choice:** Number only
**Notes:** Simplest; matches sg-plan / sg-execute argument handling.

### A3. Lens-via-argument support

| Option | Description | Selected |
|--------|-------------|----------|
| No (always interactive) | Skill always shows AskUserQuestion for lens | |
| Yes (ssc/4ls/dspm) | Accept optional second token; codes case-insensitive; AskUserQuestion fallback if absent | ✓ |
| Reserve to Phase 10 | Parse but no-op second token | |
| Other | User-defined | |

**User's choice:** Yes (ssc/4ls/dspm)
**Notes:** Enables Phase 13 sg-learn auto-handoff path to bypass AskUserQuestion; muscle-memory codes shared with D1 labels.

### A4. Invalid-phase behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Error + phase list | Print available phases from `ls .planning/phases/` to stderr; exit | ✓ |
| Proceed empty | Collect git diff/log only, no phase artifacts | |
| STATE.md fallback w/ warning | Silently fall back to STATE.md current phase | |
| Other | User-defined | |

**User's choice:** Error + phase list
**Notes:** Consistent with sg-status / sg-health UX (explicit failure with guidance).

---

## B. Context-collection scope

### B1. Which phase artifacts to read

| Option | Description | Selected |
|--------|-------------|----------|
| Read all .md | Every markdown file in phase dir (CONTEXT/PLAN/SUMMARY/PATTERNS/VERIFICATION) | |
| Targeted set | CONTEXT + all PLAN-* + all SUMMARY-* (skip PATTERNS / VERIFICATION) | ✓ |
| CONTEXT + latest PLAN + latest SUMMARY | Minimum viable set | |
| Other | User-defined | |

**User's choice:** Targeted set
**Notes:** PATTERNS/VERIFICATION are mapper/audit artifacts with weak retro signal; targeted set keeps context window predictable across multi-plan phases.

### B2. Git diff/log range

| Option | Description | Selected |
|--------|-------------|----------|
| Since last phase-dir commit | `git log -1 --format=%H -- .planning/phases/{NN}-*/` as base; range base..HEAD | ✓ |
| Since phase first commit | Find earliest commit touching phase dir | |
| HEAD~20 unconditional | Last 20 commits regardless of phase | |
| Hybrid log+diff | `git log --oneline -30` + `git diff HEAD~5` | |
| Other | User-defined | |

**User's choice:** Since last phase-dir commit
**Notes:** Tightly scopes git context to work after phase planning landed. Fallback to `HEAD~10..HEAD` documented for empty-base case (D-06).

### B3. Diff size cap

| Option | Description | Selected |
|--------|-------------|----------|
| No cap | Pass entire diff regardless of size | |
| Cap 500 lines | Hard truncate at 500 | |
| --stat only | Always use diff summary, not content | |
| Cap 1000 + --stat fallback | Adaptive: full diff up to 1000 lines, `--stat` summary when exceeded; log always full | ✓ |
| Other | User-defined | |

**User's choice:** Cap 1000 + --stat fallback
**Notes:** Adaptive — small phases get full diff fidelity, large phases get structural summary without blowing context window.

### B4. STATE.md Phase regex reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Skill-only fix | Replicate Phase 7 D-04 multi-line pattern in Skill only; leave hooks/stop_hook.py alone | ✓ |
| Fix both | Propagate the fix into stop_hook.py in this phase | |
| Skill + quick-task for hook | Track the hook fix separately as a backlog item | |
| Other | User-defined | |

**User's choice:** Skill-only fix
**Notes:** hooks/stop_hook.py bug does not manifest (only needs the phase number token); surgical scope per Phase 6 D-04 / Phase 7 D-08. The hook fix is captured as a deferred idea in CONTEXT.md (not promoted to backlog).

---

## C. Lens execution model

### C1. SKILL.md structure: prompt-driven vs structured generator

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt-driven | SKILL.md gives Claude per-lens free-form facilitation prompts | |
| Structured generator | Strict slot-filling templates per lens | |
| Hybrid | Facilitation prompt blocks + mandatory output structure (## Lens: {name} + fixed subheadings + Action Items table) | ✓ |
| Other | User-defined | |

**User's choice:** Hybrid
**Notes:** Phase 12 LESSONS-02 needs deterministic parse keys (lens headers + Action Items columns); facilitation flow can stay flexible.

### C2. User interaction during the lens

| Option | Description | Selected |
|--------|-------------|----------|
| Single bulk prompt | One open-ended question per lens | |
| Per-category prompts | Sequential question per category (4 turns for 4Ls) | |
| Claude proposes from context first | Artifact-grounded draft-then-confirm | ✓ |
| Other | User-defined | |

**User's choice:** Claude proposes from context first
**Notes:** Whole point of collecting CONTEXT/PLAN/SUMMARY/git diff (B1/B2) is to enable artifact-grounded draft. Lowest user effort.

### C3. DSPM lens without analyzer

| Option | Description | Selected |
|--------|-------------|----------|
| Pure user dialogue | Ask user to enumerate D/S/P/M from memory | |
| Heuristic transcript glance | Claude opportunistically scans recent messages | |
| Artifact-grounded only | DSPM draft derives only from phase artifacts + git diff/log; no transcript | ✓ |
| Other | User-defined | |

**User's choice:** Artifact-grounded only
**Notes:** Keeps Phase 10 ANALYZER additive — Phase 10 layers transcript analysis on top without refactoring Phase 9.

### C4. Action-items section requirement

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory per lens | Each lens must produce priority/item/next step table; no owner column | ✓ |
| Defer to Phase 12 | Lens output only; no action items in Phase 9 | |
| Optional | Action items if relevant, else omit | |
| Other | User-defined | |

**User's choice:** Mandatory per lens
**Notes:** Phase 12 RECURRENCE-01 weighted top-N needs structured action-item input. If Phase 9 doesn't capture them, Phase 12 has nothing to weight.

---

## D. Lens selection UX

### D1. AskUserQuestion option labels

| Option | Description | Selected |
|--------|-------------|----------|
| Full names | `Start/Stop/Continue`, `4Ls (Liked/Learned/Lacked/Longed)`, `Decisions/Surprises/Patterns/Mistakes` | |
| Short codes + description | `ssc`, `4ls`, `dspm` with meaning in description | |
| Friendly + code parenthetical | `Start/Stop/Continue (ssc)`, `4Ls (4ls)`, `Decisions/Surprises/Patterns/Mistakes (dspm)` | ✓ |
| Other | User-defined | |

**User's choice:** Friendly + code parenthetical
**Notes:** Codes match A3 argument tokens; users learn argument codes through the interactive UI.

### D2. AskUserQuestion header text

| Option | Description | Selected |
|--------|-------------|----------|
| Lens | Minimal, ≤12 chars | ✓ |
| Retro | Names the operation | |
| sg-retro | Namespaced | |
| Other | User-defined | |

**User's choice:** Lens
**Notes:** Matches Phase 8 D-12 `"Session"` brevity convention.

### D3. Default selection

| Option | Description | Selected |
|--------|-------------|----------|
| No default | All three options equal; user always picks | ✓ |
| Default 4Ls | Pre-select 4Ls | |
| Default SSC | Pre-select Start/Stop/Continue | |
| Context-dependent | Skill chooses default from phase outcome | |
| Other | User-defined | |

**User's choice:** No default
**Notes:** Phase 9 is the first time these lenses exist; biasing before usage data is premature. Revisit Phase 12 / v1.3.

### D4. Language for user-facing strings (REVISED)

| Option | Description | Selected |
|--------|-------------|----------|
| English (uniform) | All UI + body in English | |
| Korean (uniform) | All UI + body in Korean | |
| Mixed (initial) | SKILL.md frontmatter English; facilitation prompt + AskUserQuestion in Korean | |
| User auto-detect (revised) | SKILL.md frontmatter + AskUserQuestion labels English (OSS surface); lens facilitation prompt + lens output body auto-detect user input language per CLAUDE.md | ✓ |
| Other | User-defined | |

**User's choice:** User auto-detect (revised)
**Notes:** Decision was revised mid-discussion — initial answer was "English" for all UI, but the user clarified that facilitation prompts and body content should follow CLAUDE.md auto-detect policy. This revision is consistent with E4 (Mixed: section headers English, body content user's language).

---

## E. Lessons file append schema

### E1. Same-day same-phase repeat call

| Option | Description | Selected |
|--------|-------------|----------|
| Append section | Existing per-day file gains new lens section | ✓ |
| Refuse | Error if lesson already exists today | |
| New file with suffix | Create `09-2026-05-20-2.md` | |
| Other | User-defined | |

**User's choice:** Append section
**Notes:** Honors LESSONS-01 directly. Phase 10 multi-lens (RETRO-05) naturally extends the same mechanism (multiple lens selections in one call → all append to same file).

### E2. File structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat lens sections | Top-level header + `## Lens: {name}` sections with inline `_Captured:_` line | ✓ |
| Per-call subsection | `## Retro Run N (timestamp)` wrapping each call's lenses | |
| YAML frontmatter + flat | Machine-readable run metadata in frontmatter | |
| Other | User-defined | |

**User's choice:** Flat lens sections
**Notes:** YAML frontmatter deferred to Phase 12 where parser actually needs it; backward-compatible add later.

### E3. Same-lens repeat in same day

| Option | Description | Selected |
|--------|-------------|----------|
| Duplicate header | Two `## Lens: 4Ls` sections; parser dedupes by recency | |
| Replace | Overwrite earlier section | |
| (run N) suffix | Append as `## Lens: 4Ls (run 2)` | ✓ |
| Refuse | Block re-run of same lens same day | |
| Other | User-defined | |

**User's choice:** (run N) suffix
**Notes:** Avoids duplicate-header ambiguity; preserves history; Phase 12 RECURRENCE recency weighting can consume all runs.

### E4. Lens output content language

| Option | Description | Selected |
|--------|-------------|----------|
| English (uniform body) | All body content in English | |
| Korean (uniform body) | All body content in Korean | |
| User language (all body) | Auto-detect for entire body including headers | |
| Mixed (header EN, body user-lang) | Section headers + table column headers English; body items in user's input language (CLAUDE.md auto-detect) | ✓ |
| Other | User-defined | |

**User's choice:** Mixed (header EN, body user-lang)
**Notes:** User's answer numbered "E4=1" was reinterpreted as E4=4 — the user's accompanying text ("section header 영문 결정적, 본문 사용자 언어 auto-detect") matches option 4's definition precisely; the number was a typo. Consistent with D4 revision and ensures Phase 12 LESSONS-02 parser has stable section keys.

---

## Claude's Discretion

The user delegated final wording to Claude in the following areas (captured in CONTEXT.md `### Claude's Discretion`):
- SKILL.md frontmatter `description` exact English wording (guide provided: one sentence, mention lens codes).
- AskUserQuestion `question` text (recommended: `"Which retrospective lens do you want to run?"`).
- Lens facilitation prompt exact wording within D-10/D-16 policy.
- Empty-base fallback depth in D-06 (recommended: `HEAD~10`, adjustable).
- Inline timestamp form (`_Captured: ..._` italic vs HTML comment).

## Deferred Ideas

The discussion noted these items as out-of-scope for Phase 9, captured in CONTEXT.md `<deferred>`:
- Sailboat / Five Whys lens (Phase 10 RETRO-03 completion).
- Multi-lens selection in one call (Phase 10 RETRO-05).
- Session transcript scanning / DSPM analyzer (Phase 10 ANALYZER-01/02/03).
- YAML frontmatter on lessons files (Phase 12 LESSONS-02 / RECURRENCE-01 when needed).
- Lessons milestone aggregation (Phase 12 LESSONS-03).
- Weighted top-N recurrence guard (Phase 12 RECURRENCE-01/02/03).
- `sg-learn` → `sg-retro` routing migration (Phase 13 MIGRATION-01).
- Hookify dependency removal (Phase 13 MIGRATION-03/04).
- `hooks/stop_hook.py:_read_current_phase()` regex alignment (deferred — separate phase or quick-task; this Skill's multi-line parser becomes the reference).
- Argument-driven non-interactive multi-lens (`args="9 4ls dspm"`) — natural extension when Phase 10 RETRO-05 lands.
- Automated test fixtures for sg-retro — deferred per Phase 6/7/8 precedent.
