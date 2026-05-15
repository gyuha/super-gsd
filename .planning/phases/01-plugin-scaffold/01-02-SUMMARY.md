---
phase: 01-plugin-scaffold
plan: 02
subsystem: documentation
tags:
  - claude-code-plugin
  - documentation
  - readme
requires:
  - 01-01
provides:
  - PLUGIN-02
  - user-facing-docs
  - install-instructions
  - verify-checklist
affects:
  - README.md
tech-stack:
  added:
    - english-primary-readme
  patterns:
    - "9-section README structure locked per D-12 (1 H1 + 8 H2)"
    - "ASCII art workflow diagram per D-11 (no Mermaid, no images)"
    - "Install command pair literal-locked per D-07 (mirrors manifest identity)"
    - "한국어 요약 single-section pattern per D-10 (English-primary, one Korean summary)"
key-files:
  created:
    - README.md
  modified: []
decisions:
  - "README install commands derived from manifest identity strings written in Plan 01-01 (gyuha/super-gsd, super-gsd@super-gsd) — no improvisation"
  - "ASCII diagram depicts 3-node loop (GSD planning → Superpowers building → Hookify learning → back to GSD) with a labeled feedback arrow"
  - "Phase 1 'What this is' explicitly states no commands ship yet — readers redirected to Roadmap (anti-overselling, T-02-03 mitigation)"
  - "Korean summary distilled from PROJECT.md What This Is + Core Value into 3 short paragraphs, preserving 학습 루프 / 역할 분리 / 비침투적 orchestrator themes"
metrics:
  duration: ~10min
  completed: 2026-05-15
---

# Phase 1 Plan 2: README Summary

Replaces the 12-byte stub at the repo root with a 9-section English-primary README that doubles as the single Phase 1 surface a human reads directly. The README satisfies PLUGIN-02 (install method, dependencies, workflow diagram) and the human side of Phase 1 success criterion 4 (verify GSD/Superpowers/Hookify still work after install).

## Final Artifact

| Metric | Value |
|--------|-------|
| File | `README.md` |
| Byte count | 6410 |
| H1 headings | 1 (`# super-gsd`) |
| H2 headings | 8 (Workflow, What this is, Prerequisites, Installation, Verify install, Roadmap, 한국어 요약, License) |
| Numbered items in Verify install | 4 |
| Mermaid blocks | 0 |
| Image syntax (`![`) occurrences | 0 |
| Trailing newline | present |

## Locked Strings Verbatim (for the record)

The two install commands written to README, byte-for-byte:

```
/plugin marketplace add gyuha/super-gsd
/plugin install super-gsd@super-gsd
```

Both strings cross-checked against `.claude-plugin/plugin.json.name`, `.claude-plugin/marketplace.json.name`, and `.claude-plugin/marketplace.json.owner` written by Plan 01-01. No drift.

The four `## Verify install` items map verbatim to D-13:

1. `/plugin list` shows `super-gsd`
2. `/gsd-progress` works (GSD intact)
3. `Skill` tree exposes `superpowers:*` (Superpowers intact)
4. `/hookify:help` works (Hookify intact)

All four required literal strings (`/plugin list`, `/gsd-progress`, `superpowers:*`, `/hookify:help`) are present in the file.

## Tasks & Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write README.md (9-section, ASCII diagram, install + verify + Korean summary) | `4a6c1dd` | `README.md` |

## Verification Evidence

The plan's automated verification block ran clean:

```
test -s README.md                                       # OK (6410 bytes)
grep -Fq "/plugin marketplace add gyuha/super-gsd"      # OK
grep -Fq "/plugin install super-gsd@super-gsd"          # OK
grep -Fq "한국어 요약"                                   # OK
grep -Fq "GSD" && "Superpowers" && "Hookify"            # OK
8 level-2 headings in exact D-12 order                  # OK
4 numbered items in Verify install section              # OK
```

ASCII-only check: `! grep -q '```mermaid' && ! grep -q '!\['` → PASS.

Cross-file identity sanity (using `node -p` against both manifests):

```
PNAME=super-gsd (from plugin.json.name)
MOWNER=gyuha    (from marketplace.json.owner)
=> "/plugin install ${PNAME}@${PNAME}" found in README
=> "/plugin marketplace add ${MOWNER}/${PNAME}" found in README
```

Cross-file identity: PASS.

## Deviations from Plan

None — plan executed exactly as written.

All six referenced decisions honored:

- **D-07:** Install command pair appears verbatim, byte-for-byte, in a fenced code block under the Installation section.
- **D-09:** Roadmap section lists Phase 2 (`/super-gsd:to-superpowers`, `/super-gsd:status`), Phase 3 (Stop / SubagentStop hooks), Phase 4 (`.planning/lessons/` persistence).
- **D-10:** English-primary content with exactly one `## 한국어 요약` section near the end (between Roadmap and License).
- **D-11:** Workflow diagram is ASCII art inside a plain fenced code block — no Mermaid, no image syntax.
- **D-12:** Exact 9-section structure with 1 H1 (`# super-gsd`) + 8 H2 in the locked order: Workflow → What this is → Prerequisites → Installation → Verify install → Roadmap → 한국어 요약 → License.
- **D-13:** Verify install section has exactly 4 numbered items covering `/plugin list`, `/gsd-progress`, `superpowers:*`, `/hookify:help`.

Carried-forward decisions also honored:

- **D-14 (non-invasive):** README states explicitly that `super-gsd` does not modify GSD/Superpowers/Hookify; the 4-item Verify checklist gives the reader the means to confirm this themselves.
- Authors honored anti-overselling guidance (T-02-03): the "What this is" section calls out plainly that Phase 1 ships no `/super-gsd:*` commands yet and points readers at Roadmap.

## Threat Mitigation Confirmed

| Threat ID | Mitigation Evidence |
|-----------|---------------------|
| T-02-01 (install command drift) | Cross-file identity check passes: `/plugin install ${plugin.json.name}@${marketplace.json.name}` and `/plugin marketplace add ${marketplace.json.owner}/${plugin.json.name}` both resolve to the literal strings in README. |
| T-02-02 (unverifiable compatibility claim) | 4-item Verify install checklist (D-13) ships in the same release as the compatibility claim. |
| T-02-03 (overpromising Phase 1) | "What this is" section says Phase 1 ships no commands yet; Roadmap places commands in Phase 2. |
| T-02-04 (email leak) | README contains no email addresses and no author/owner contact field (`grep -c "@" README.md` = 0 outside the install command `@`). |
| T-02-05 (Mermaid/image rendering portability) | Automated check: `! grep -q '```mermaid'` and `! grep -q '!\['` both pass. |
| T-02-06 (RCE via README) | n/a — Markdown is not executable. |

## Combined Phase 1 Output

Plan 01-01 + Plan 01-02 together satisfy:

- **PLUGIN-01** (installable plugin manifest) — `.claude-plugin/plugin.json` from 01-01
- **PLUGIN-02** (README explains install + dependencies + workflow) — this plan
- **PLUGIN-03** (self-hosted marketplace) — `.claude-plugin/marketplace.json` from 01-01

And the 4 Phase 1 ROADMAP success criteria:

1. Install via marketplace mechanism without errors — manifests from 01-01 + install commands documented here
2. `/plugin list` shows super-gsd with name/description/version — manifests from 01-01, verified by checklist item 1 here
3. README explains prerequisites and 3-stage workflow — this plan
4. Loading does not break GSD/Superpowers/Hookify (non-invasive verified) — D-14 enforced in 01-01 (no external files touched), confirmable via the 4-item Verify checklist here

## Self-Check: PASSED

- File `README.md`: FOUND (6410 bytes)
- Commit `4a6c1dd`: FOUND
- Install command literal `/plugin marketplace add gyuha/super-gsd`: present
- Install command literal `/plugin install super-gsd@super-gsd`: present
- Korean section header `한국어 요약`: present
- Mandatory checklist literals (`/plugin list`, `/gsd-progress`, `superpowers:*`, `/hookify:help`): all present
- 8 H2 headings in exact D-12 order: verified
