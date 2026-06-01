# Phase 46: sg-tdd 구현 + 파이프라인 통합 - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 8 (2 new, 6 modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `skills/sg-tdd/SKILL.md` | skill | request-response | `skills/sg-execute/SKILL.md` | role-match |
| `.agents/skills/sg-tdd/SKILL.md` | skill (mirror) | request-response | `.agents/skills/sg-execute/SKILL.md` | role-match |
| `hooks/transcript_matcher.cjs` | hook/utility | event-driven | self (extend existing arrays) | exact |
| `hooks/stop_hook.cjs` | hook | event-driven | self (extend existing switch/if-chain) | exact |
| `skills/sg-next/SKILL.md` | skill | request-response | self (extend routing block) | exact |
| `skills/sg-status/SKILL.md` | skill | request-response | self (extend routing block) | exact |
| `.agents/skills/sg-next/SKILL.md` | skill (mirror) | request-response | self (mirror of skills/sg-next) | exact |
| `.agents/skills/sg-status/SKILL.md` | skill (mirror) | request-response | self (mirror of skills/sg-status) | exact |

---

## Pattern Assignments

### `skills/sg-tdd/SKILL.md` (skill, request-response)

**Analog:** `skills/sg-execute/SKILL.md`

**YAML frontmatter pattern** (sg-execute lines 1-5):
```markdown
---
name: sg-execute
description: Use this when the phase plan is ready and implementation should begin — packages PLAN/REQ/SC and hands off to Superpowers via superpowers:executing-plans.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---
```
Copy pattern for sg-tdd:
```markdown
---
name: sg-tdd
description: Use this when execute is complete and TDD verification is required — invokes superpowers:test-driven-development and appends a tdd stage row to HANDOFF.md.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---
```

**Language block** (sg-execute lines 7-12): copy verbatim — all skills share the same 4-line language detection block.

**tdd_mode guard pattern** — new pattern, no direct analog. Follows `loadConfig()` from `stop_hook.cjs` lines 85-95. Bash equivalent (macOS-compatible, no `jq` dependency required):
```bash
TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
if [ "$TDD_MODE" != "true" ]; then
  # D-02: soft warning, do not block
  echo "tdd_mode is not enabled. To activate: set super_gsd.tdd_mode: true in .planning/config.json. Recommended: re-run sg-execute first."
fi
```

**HANDOFF.md append pattern** (sg-execute lines 157-159, 277-279):
```bash
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_USER=$(git config user.name 2>/dev/null || echo "-")
[ -z "$GIT_USER" ] && GIT_USER="-"
echo "| $TS | $PHASE_SLUG | execute | tdd | - | $GIT_USER |" >> .planning/HANDOFF.md
```
Note: `From` column is `execute` (not `$FROM_STAGE`) because sg-tdd always follows execute. `Plan Hash` column is `-` (no plan hash — TDD doesn't modify plans).

**HANDOFF.md auto-initialization pattern** (sg-execute lines 145-152):
```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
```

**Terminal Skill invocation pattern** (sg-execute lines 329-331): session control transfers to Skill, no code after this point:
```
Skill(skill="superpowers:test-driven-development", args="<prompt blob>")
```

**TDD verification complete signal** — sg-tdd must print this exact string before the Skill() call so transcript_matcher can detect it:
```bash
echo "TDD verification complete"
Skill(skill="superpowers:test-driven-development", args="...")
```

**AskUserQuestion failure-soft-warning pattern** (D-01) — modelled after sg-next Step 5:
```
AskUserQuestion(
  questions: [{
    question: "TDD verification found issues. How do you want to proceed?",
    header: "sg-tdd",
    multiSelect: false,
    options: [
      { label: "Proceed to sg-review", description: "Continues to /super-gsd:sg-review." },
      { label: "Retry TDD verification", description: "Re-runs superpowers:test-driven-development." }
    ]
  }]
)
```

---

### `.agents/skills/sg-tdd/SKILL.md` (skill mirror, request-response)

**Analog:** `.agents/skills/sg-execute/SKILL.md`

**Structural difference from `skills/` version** (`.agents/skills/sg-execute/SKILL.md` lines 18-23):
```markdown
<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration unavailable: superpowers:executing-plans skill cannot be used. Runs in direct implementation mode.
- SubagentStop not supported: no automatic trigger on stage completion. Run $sg-review manually after completion.
- AskUserQuestion not supported
</constraints>
```
For sg-tdd mirror: add equivalent constraints block. Replace `AskUserQuestion` failure path with a plain text warning + exit.

**Command prefix difference:** `skills/` uses `/super-gsd:sg-*`; `.agents/skills/` uses `$sg-*`. All NEXT_CMD references must use `$sg-tdd`, `$sg-review` form.

**Content parity rule (MIRROR-01, D-08):** `.agents/skills/sg-tdd/SKILL.md` must have the same process steps and success criteria as `skills/sg-tdd/SKILL.md`, with only:
1. The `<constraints>` block added
2. All `/super-gsd:sg-*` command names replaced with `$sg-*`
3. `AskUserQuestion(...)` replaced with numbered-list prompt + read reply

---

### `hooks/transcript_matcher.cjs` (hook/utility, event-driven)

**Analog:** self — extend existing 4-signal-array + detectSignal() pattern (lines 1-53)

**Existing signal array pattern** (lines 21-25) — add 5th array immediately after `SG_RETRO_SIGNALS`:
```javascript
const SG_RETRO_SIGNALS = [
  'lessons file:',
  '## Lens:',
  'Retrospective complete',
];
```
New array to add after line 25:
```javascript
const TDD_SIGNALS = [
  'TDD verification complete',
];
```

**detectSignal() extension** (lines 46-50) — add new branch at the end, before `return ''`:
```javascript
// Current last branch (line 49):
if (SG_RETRO_SIGNALS.some(sig => recent.includes(sig))) return 'sg-retro-complete';
// Add after line 49:
if (TDD_SIGNALS.some(sig => recent.includes(sig))) return 'tdd-complete';
return '';
```

**Priority note:** `TDD_SIGNALS` check must come AFTER `SG_RETRO_SIGNALS` and BEFORE the final `return ''`. Signal detection is first-match in workflow order; tdd occurs between execute and review, which is after implementation and before review signals.

---

### `hooks/stop_hook.cjs` (hook, event-driven)

**Analog:** self — two insertion points in existing file

**Insertion point 1: `stageToSignal()` switch** (lines 124-142) — add `case 'tdd'` between `execute` and `review`:
```javascript
// Current (lines 131-136):
case 'superpowers':
case 'parallel':
case 'execute':
  return 'superpowers-implementation-complete';     // → "Run sg-review"
case 'review':
  return 'superpowers-review-complete';             // → "Run sg-learn"
```
After modification:
```javascript
case 'superpowers':
case 'parallel':
case 'execute':
  return 'superpowers-implementation-complete';     // → "Run sg-review"
case 'tdd':
  return 'tdd-complete';                            // → "Run sg-review"
case 'review':
  return 'superpowers-review-complete';             // → "Run sg-learn"
```

**Insertion point 2: `main()` command variables + if/else-if chain** (lines 184-208)

Add `cmdTdd` variable alongside existing command vars (lines 184-195):
```javascript
let cmdExecute, cmdReview, cmdLearn, cmdShip, cmdTdd;
if (platform === 'claude-code') {
  cmdExecute = '/super-gsd:sg-execute';
  cmdReview  = '/super-gsd:sg-review';
  cmdLearn   = '/super-gsd:sg-learn';
  cmdShip    = '/super-gsd:sg-ship';
  cmdTdd     = '/super-gsd:sg-tdd';
} else {
  cmdExecute = '$sg-execute';
  cmdReview  = '$sg-review';
  cmdLearn   = '$sg-retro';
  cmdShip    = '$sg-ship';
  cmdTdd     = '$sg-tdd';
}
```

Add `tdd-complete` branch in if/else-if chain (lines 197-208), after `superpowers-implementation-complete` and before `superpowers-review-complete`:
```javascript
// Current (lines 200-201):
} else if (signal === 'superpowers-implementation-complete') {
  response = { systemMessage: `Implementation complete. Run ${cmdReview} to request a code review.` };
} else if (signal === 'superpowers-review-complete') {
```
After modification:
```javascript
} else if (signal === 'superpowers-implementation-complete') {
  response = { systemMessage: `Implementation complete. Run ${cmdReview} to request a code review.` };
} else if (signal === 'tdd-complete') {
  response = { systemMessage: `TDD verification complete. Run ${cmdReview} to request a code review.` };
} else if (signal === 'superpowers-review-complete') {
```

**Message pattern reference:** modelled after `sg-retro-complete` pattern (line 205): `Retrospective complete. Run ${cmdShip} to ship the phase.`

---

### `skills/sg-next/SKILL.md` (skill, request-response)

**Analog:** self — modify D-07 blocks in Step 2 and Step 3

**D-07 block boundary markers** (lines 26, 31, 36, 79, 85, 123) — all edits must stay inside the `--- BEGIN ---` / `--- END ---` comment fences. The block comment text also must be updated to note that sg-tdd was added.

**Insertion point 1: Step 2 HANDOFF.md stage detection block — case enum** (lines 44-45):
```bash
# Current (line 45):
    gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete|sg-next) ;;
```
After modification (add `tdd` between `execute` and `review`):
```bash
    gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete|sg-next) ;;
```
Same change applies to the scan-back re-validate case on lines 59-62:
```bash
# Current (line 60):
      init|gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete) ;;
# After:
      init|gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete) ;;
```

**Insertion point 2: Step 3 next-command routing block** (lines 98-122) — replace the `execute)` branch with a config-reading conditional:
```bash
# Current (line 110):
  execute)     NEXT_CMD="/super-gsd:sg-review" ;;
```
After modification:
```bash
  execute)
    TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
    if [ "$TDD_MODE" = "true" ]; then
      NEXT_CMD="/super-gsd:sg-tdd"
    else
      NEXT_CMD="/super-gsd:sg-review"
    fi
    ;;
  tdd)         NEXT_CMD="/super-gsd:sg-review" ;;
```

**Insertion point 3: Step 6 Skill() mapping** (lines 200-207) — add `sg-tdd` entry:
```
- `/super-gsd:sg-tdd` → `Skill(skill="super-gsd:sg-tdd", args="")`
```

**Insertion point 4: `success_criteria`** — add: "When STAGE_RAW is tdd, routes to /super-gsd:sg-review."

---

### `skills/sg-status/SKILL.md` (skill, request-response)

**Analog:** self — D-07 inline-replication of sg-next changes (must be committed in the same PR/change)

**Insertion point 1: Step 2 stage detection case enum** (line 101):
```bash
# Current:
      gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete|sg-next) ;;
# After:
      gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete|sg-next) ;;
```
Same change to scan-back re-validate case (line 115-117):
```bash
# Current:
        init|gsd-plan|ui-plan|superpowers|parallel|execute|review|sg-retro|ship|complete) ;;
# After:
        init|gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete) ;;
```

**Insertion point 2: Step 2 display enum mapping** (lines 122-135) — add `tdd` mapping after `execute`:
```bash
# Current (lines 128-130):
     execute)      STAGE_DISPLAY="superpowers" ;;
     review)       STAGE_DISPLAY="superpowers" ;;
# After:
     execute)      STAGE_DISPLAY="superpowers" ;;
     tdd)          STAGE_DISPLAY="superpowers" ;;
     review)       STAGE_DISPLAY="superpowers" ;;
```

**Insertion point 3: Step 5 next-command routing** (lines 165-189) — replace `execute)` branch with config-reading conditional (identical logic to sg-next), and add `tdd)` branch:
```bash
# Current (line 177):
     execute)     NEXT_CMD="/super-gsd:sg-review" ;;
# After:
     execute)
       TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
       if [ "$TDD_MODE" = "true" ]; then
         NEXT_CMD="/super-gsd:sg-tdd"
       else
         NEXT_CMD="/super-gsd:sg-review"
       fi
       ;;
     tdd)         NEXT_CMD="/super-gsd:sg-review" ;;
```

---

### `.agents/skills/sg-next/SKILL.md` and `.agents/skills/sg-status/SKILL.md` (skill mirrors)

**Analog:** self — same changes as `skills/` counterparts with `$sg-*` command prefix substitution

**Case enum changes:** identical to `skills/` versions — add `tdd` between `execute` and `review` in both case blocks.

**Routing block changes for `.agents/skills/sg-next/SKILL.md`** (lines 92-117) — `execute)` branch currently:
```bash
  execute)     NEXT_CMD="\$sg-review" ;;
```
After modification:
```bash
  execute)
    TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
    if [ "$TDD_MODE" = "true" ]; then
      NEXT_CMD="\$sg-tdd"
    else
      NEXT_CMD="\$sg-review"
    fi
    ;;
  tdd)         NEXT_CMD="\$sg-review" ;;
```

**Routing block changes for `.agents/skills/sg-status/SKILL.md`** (lines 173-178): same substitution, `$sg-*` prefix.

---

## Shared Patterns

### HANDOFF.md append-only row format
**Source:** `skills/sg-execute/SKILL.md` (lines 277-279) and `skills/sg-next/SKILL.md` (lines 141-144)
**Apply to:** `skills/sg-tdd/SKILL.md`, `.agents/skills/sg-tdd/SKILL.md`
```bash
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_USER=$(git config user.name 2>/dev/null || echo "-")
[ -z "$GIT_USER" ] && GIT_USER="-"
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | $TO_STAGE | $PLAN_HASH | $GIT_USER |" >> .planning/HANDOFF.md
```
6-column schema: `| Timestamp | Phase | From | To | Plan Hash | User |`

### config.json tdd_mode read pattern
**Source:** `hooks/stop_hook.cjs` (lines 85-95, `loadConfig()`) — bash equivalent
**Apply to:** `skills/sg-tdd/SKILL.md`, `skills/sg-next/SKILL.md`, `skills/sg-status/SKILL.md`, and their `.agents/` mirrors
```bash
TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
```
Default is `false` when the file is absent, key is absent, or the value is `false`. Must not use `jq` (not guaranteed on macOS). Must not use `python3` (not guaranteed in all environments).

### D-07 block boundary convention
**Source:** `skills/sg-next/SKILL.md` (lines 26-31, 36-79, 85-123) and `skills/sg-status/SKILL.md` (lines 84-89, 92-135)
**Apply to:** all edits inside `sg-next/SKILL.md` and `sg-status/SKILL.md`

Every D-07-controlled block is fenced with these exact comment markers:
```bash
# --- BEGIN <block-name> (D-07: replicated from skills/sg-status/SKILL.md — update both simultaneously on drift) ---
# ... block contents ...
# --- END <block-name> ---
```
Edits to `execute)` branch and new `tdd)` branch must remain inside the `--- BEGIN next-command routing block ---` / `--- END next-command routing block ---` fence. Similarly for `--- BEGIN HANDOFF.md stage detection block ---`.

### Stage enum ordering convention
**Source:** `skills/sg-next/SKILL.md` line 45, `skills/sg-status/SKILL.md` line 101
**Apply to:** all 4 modified routing files + 2 hooks
Canonical order: `gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete`
`tdd` is always inserted between `execute` and `review`. Never place it elsewhere.

### Terminal Skill invocation — no code after Skill()
**Source:** `skills/sg-execute/SKILL.md` (lines 329-331)
**Apply to:** `skills/sg-tdd/SKILL.md`
```
# Session control transfers to the skill; no steps execute after this point:
Skill(skill="superpowers:test-driven-development", args="<prompt blob>")
```

---

## No Analog Found

None. All 8 files have a close codebase match (exact self-extension or role-match).

---

## Metadata

**Analog search scope:** `skills/`, `.agents/skills/`, `hooks/`
**Files scanned:** 7 (transcript_matcher.cjs, stop_hook.cjs, sg-execute/SKILL.md x2, sg-next/SKILL.md x2, sg-status/SKILL.md x2)
**Pattern extraction date:** 2026-06-01
