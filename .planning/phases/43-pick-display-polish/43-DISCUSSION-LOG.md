# Phase 43: One-shot Interaction + Display Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 43-pick-display-polish
**Areas discussed:** --pick entry point, --pick AskUserQuestion shape, --pick + positional conflict, DISPLAY-01 emphasis style, DISPLAY-02 intent line static/dynamic, DISPLAY-02 intent line format

**Mode note:** This discussion was conducted in Auto Mode by a subagent without AskUserQuestion. Recommendations were locked based on Phase 42 precedent + SC wording + simplicity principle. The human user should review CONTEXT.md before plan-phase; any decision can be overridden by editing CONTEXT.md directly.

---

## --pick Entry Point (Where is the flag parsed?)

| Option | Description | Selected |
|--------|-------------|----------|
| sg-retro Step 1 (`$ARGUMENTS` parsing) | sg-retro detects `--pick` token, sg-learn unchanged. Preserves Phase 42 D-11 (thin pass-through). | ✓ |
| sg-learn intercepts `--pick` | sg-learn parses `--pick` and forwards a transformed token to sg-retro. Breaks D-11; pairwise cost rises (sg-learn + .agents/sg-learn). | |

**User's choice:** sg-retro Step 1 (D-01)
**Notes:** D-11 ("sg-learn is a thin pass-through") is a Phase 42 lock-in carried forward. The sg-learn change would require modifying 2 additional files (skills/sg-learn + .agents/skills/sg-learn) and would re-open the D-11 decision. Single-point parsing is simpler.

---

## --pick AskUserQuestion Shape

| Option | Description | Selected |
|--------|-------------|----------|
| multiSelect (3 checkboxes) | One AskUserQuestion call → user picks 1+ lenses → done. Satisfies SC#1 "exactly 1 AskUserQuestion" for multi-lens case. | ✓ |
| Single-select dropdown | User picks 1 lens; for multi-lens they must re-invoke with positional args. Two AskUserQuestion rounds if user wants multi. | |
| Numbered text list + multi-token reply | Like old Phase 41 era. Not an AskUserQuestion. | |

**User's choice:** multiSelect (D-05)
**Notes:** SC#1 explicit lock — "정확히 1회 AskUserQuestion으로 종료". Only multiSelect satisfies it for multi-lens picks. Cancellation / 0-selection routed to silent exit (D-06) per Phase 42 D-06 no-silent-fallback principle.

---

## --pick + Positional Lens Conflict

| Option | Description | Selected |
|--------|-------------|----------|
| Reject (stderr + exit 1) | `sg-retro 43 ssc --pick` → error message, no execution. Consistent with Phase 42 D-06. | ✓ |
| `--pick` overrides positional silently | Picker UI shows, positional `ssc` ignored. | |
| Positional overrides `--pick` silently | `ssc` executes, picker UI never shown. | |

**User's choice:** Reject (D-03)
**Notes:** Silent overrides hide user intent and surprise debugging later. Phase 42 D-06 set the precedent: dropped lens codes reject explicitly rather than fall back silently. Same principle applied here.

---

## DISPLAY-01 P1 Visual Emphasis Style

| Option | Description | Selected |
|--------|-------------|----------|
| Emoji prefix `🔴 P1` | Priority cell prefix only on P1 rows. Single table preserved. | ✓ |
| Separated sections (P1 table + P2/P3 table) | Two `### Action Items` tables. Step 6 BODY_PRINTF complexity doubles; downstream parsing (P1-only extract tools) breaks. | |
| Re-ordering only (P1 rows first) | No visual marker, just row order. Weakest signal — fails "한눈에" goal. | |
| Bold P1 `**P1**` | Markdown bold. Rendering varies per viewer (terminal vs IDE vs web). | |

**User's choice:** Emoji prefix `🔴 P1` (D-08, D-09)
**Notes:** SC#2 lists "이모지 또는 분리된 섹션" as both acceptable; emoji wins on simplicity (single table, single regex update if any, single printf line change). Red circle glyph chosen because (a) semantic match with P1=critical, (b) consistent width across all text viewers, (c) `⚠️`/`❗` semantic noise (warning ≠ critical), (d) `🚨` emergency tone too strong.

---

## DISPLAY-02 Intent Line Static vs Dynamic

| Option | Description | Selected |
|--------|-------------|----------|
| Static (fixed sentence per lens) | One canonical sentence per lens (ssc/dspm/analyze). Always same — instant recognition. | ✓ |
| Dynamic (Claude generates per phase) | Phase-tailored intent line at execute time. Variable wording each time. | |

**User's choice:** Static (D-12)
**Notes:** "한눈에 보인다" goal favors static — readers recognize the lens by its canonical intent line, not by parsing varied wording. Dynamic adds cognitive load and increases execute-time work for no clear gain. Three static sentences locked in D-12. Wording in English (D-15) per lessons-file content policy.

---

## DISPLAY-02 Intent Line Format

| Option | Description | Selected |
|--------|-------------|----------|
| Italic single-line `_Intent: ..._` below `_Captured:_` | Visual series with existing italic metadata line. Single source of truth for lens identity. | ✓ |
| Blockquote `> ...` | Quote format is for content emphasis, not metadata. Over-strong visual weight. | |
| Plain paragraph | Loses metadata signal; reads as body content. | |
| New subheading `#### Intent` | Adds heading depth, fights for attention with lens subheadings. | |

**User's choice:** Italic single-line below `_Captured:_` (D-13, D-14)
**Notes:** `_Captured:_` already establishes the italic-metadata pattern. Adding `_Intent:_` extends the same pattern, giving readers a predictable metadata block at the top of each lens section. Implementation: new `INTENT_LINE` case mapping next to `LENS_NAME` case (Step 6 line 263-267), single `printf '%s\n\n' "$INTENT_LINE"` after `_Captured:_` printf.

---

## Claude's Discretion

- **success_criteria item numbering** — exact split between extending existing items vs adding new ones is planner choice. Total count target: ~13-14 items (up from 11).
- **argument-hint frontmatter wording** — recommended phrasing provided, planner may shorten.
- **`--pick` post-validation safety net** — Phase 42 D-06 case still covers any path that produces invalid codes; AskUserQuestion enum is safe enough that an extra validation pass is optional.
- **P1 emoji glyph future change** — `🔴` is the v2.9 lock; future user feedback can change it without a structural rewrite.

## Deferred Ideas

- Existing `.planning/lessons/*.md` P1 migration — not in scope.
- AskUserQuestion-unsupported environments (Codex/Gemini) graceful fallback for `--pick`.
- `--pick deep` combined with analyze lens deep-scan modifier.
- Translating lens intent lines into user language at runtime.
- Owner column on Action Items (removed in Phase 42 D-12).
- Color/bold/alignment styling beyond the emoji prefix.
