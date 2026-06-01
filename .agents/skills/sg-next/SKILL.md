---
name: sg-next
description: Detect the current workflow stage from HANDOFF.md and STATE.md and report the next sg-* skill to activate.
argument-hint: "No arguments needed."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Detect the current workflow stage from HANDOFF.md and STATE.md, determine the next sg-* skill using the same routing table as sg-status, append a HANDOFF.md row, then report the next step clearly. For ambiguous states (complete or init), presents numbered choices instead of auto-advancing.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- AskUserQuestion not supported: complete/init choices are presented as a numbered list; read user reply and proceed accordingly.
- SubagentStop not supported: sg-next reports the next step but cannot auto-activate it. The user activates the reported skill manually.
- Superpowers integration unavailable: this skill is fully self-contained.
</constraints>

<execution_context>
Self-contained — reads .planning/HANDOFF.md, .planning/STATE.md, .planning/ROADMAP.md. Appends .planning/HANDOFF.md.
</execution_context>

<process>

**Step 1 — STATE.md Phase parsing:**

```bash
# --- BEGIN STATE.md Phase parsing block ---
PHASE_LINE=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | sed -E 's/[[:space:]]+$//')
[ -z "$PHASE_LINE" ] && PHASE_LINE="(none)"
PHASE_NUM=$(echo "$PHASE_LINE" | grep -oE '^[0-9]+' || echo "")
# --- END STATE.md Phase parsing block ---
```

**Step 2 — HANDOFF.md stage detection + enum mapping:**

```bash
# --- BEGIN HANDOFF.md stage detection block ---
LAST_ROW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null | tail -1)
if [ -z "$LAST_ROW" ]; then
  STAGE_RAW="init"
  TS=""
else
  STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$5); print $5}')
  TS=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$2); print $2}')
  case "$STAGE_RAW" in
    gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete|sg-next) ;;
    *) echo "Unknown stage '${STAGE_RAW}' in .planning/HANDOFF.md last row. Schema may be corrupted." >&2; exit 1 ;;
  esac
  # sg-next is a meta-transition row, so use the preceding FROM column ($4) as the actual current stage
  if [ "$STAGE_RAW" = "sg-next" ]; then
    STAGE_RAW=$(echo "$LAST_ROW" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
    # If FROM is also sg-next (corrupted chain), scan back for the last real stage
    if [ "$STAGE_RAW" = "sg-next" ] || [ -z "$STAGE_RAW" ]; then
      STAGE_RAW=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md 2>/dev/null \
        | awk -F'|' '{gsub(/ /,"",$5); print $5}' \
        | grep -vE '^sg-next$' | tail -1)
      [ -z "$STAGE_RAW" ] && STAGE_RAW="init"
    fi
    # Re-validate after scan-back — corrupt HANDOFF.md data must not propagate to FROM_STAGE
    case "$STAGE_RAW" in
      init|gsd-plan|ui-plan|superpowers|parallel|execute|tdd|review|sg-retro|ship|complete) ;;
      *) echo "Scan-back recovered unknown stage '${STAGE_RAW}' — defaulting to init." >&2; STAGE_RAW="init" ;;
    esac
  fi
fi
# --- END HANDOFF.md stage detection block ---
```

**Step 3 — NEXT_PHASE computation + stage→next-command routing:**

```bash
# --- BEGIN next-command routing block ---
if [ "$STAGE_RAW" = "sg-retro" ] || [ "$STAGE_RAW" = "ship" ]; then
  if echo "$PHASE_NUM" | grep -qE '^[0-9]+$'; then
    NEXT_PHASE=$((PHASE_NUM + 1))
    if grep -qE "^### Phase ${NEXT_PHASE}:" .planning/ROADMAP.md 2>/dev/null; then
      NEXT_PHASE_EXISTS=1
    else
      NEXT_PHASE_EXISTS=0
    fi
  else
    NEXT_PHASE_EXISTS=0
  fi
fi
case "$STAGE_RAW" in
  init)
    if [ -n "$PHASE_NUM" ]; then
      NEXT_CMD="\$sg-plan $PHASE_NUM"
    else
      NEXT_CMD="\$sg-plan"
    fi
    ;;
  gsd-plan)    NEXT_CMD="\$sg-execute" ;;
  ui-plan)     NEXT_CMD="\$sg-execute" ;;
  superpowers|parallel|execute|tdd|review)
    # Skip-aware routing for the implementation→ship segment. Reads super_gsd config:
    #   tdd_mode (execute only) → run $sg-tdd; skip_review → omit $sg-review; skip_learn → omit $sg-learn.
    # With all flags false/absent this reproduces the prior fixed routing exactly.
    NEXT_CMD=$(SG_STAGE="$STAGE_RAW" node -e 'let c={};try{c=(require("./.planning/config.json").super_gsd)||{}}catch(e){}var tdd=!!c.tdd_mode,sr=!!c.skip_review,sl=!!c.skip_learn,s=process.env.SG_STAGE,n;if(s==="execute"&&tdd){n="sg-tdd"}else if(s==="review"){n=sl?"sg-ship":"sg-learn"}else{n=sr?(sl?"sg-ship":"sg-learn"):"sg-review"}process.stdout.write("$"+n)' 2>/dev/null)
    [ -z "$NEXT_CMD" ] && NEXT_CMD="\$sg-review"
    ;;
  sg-retro)    NEXT_CMD="\$sg-ship" ;;
  ship)
    if [ "$NEXT_PHASE_EXISTS" = "1" ]; then
      NEXT_CMD="\$sg-plan $NEXT_PHASE"
    else
      NEXT_CMD="\$sg-complete"
    fi
    ;;
  complete) NEXT_CMD="\$sg-new" ;;
  *) NEXT_CMD="(unknown stage: $STAGE_RAW)" ;;
esac
# --- END next-command routing block ---
```

**Step 4 — HANDOFF.md initialization + non-ambiguous stage append:**

For complete/init, defer the append until after Step 5 confirmation. This prevents audit log contamination on cancel.

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
PHASE_PAD=$(printf "%02d" "${PHASE_NUM:-0}" 2>/dev/null || echo "${PHASE_NUM:-0}")
PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM:-unknown}"
FROM_STAGE="$STAGE_RAW"
if [ "$STAGE_RAW" != "complete" ] && [ "$STAGE_RAW" != "init" ]; then
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  GIT_USER=$(git config user.name 2>/dev/null || echo "-")
  [ -z "$GIT_USER" ] && GIT_USER="-"
  echo "| $TS | $PHASE_SLUG | $FROM_STAGE | sg-next | - | $GIT_USER |" >> "$HANDOFF_FILE"
fi
```

**Step 5 — complete/init branch (numbered list):**

When `STAGE_RAW` is `complete`, output the following and wait for user reply:

```
Current workflow stage: complete
Choose next step:
  1. Run $sg-new (start new milestone)
  2. Cancel
```

- If reply is "1" or contains "sg-new": append `| TS | PHASE_SLUG | complete | sg-next | - |` to HANDOFF.md, then output `→ $sg-new` and tell the user to activate $sg-new.
- If reply is "2" or "cancel": output `Cancelled. No changes made.` and exit (no append).

When `STAGE_RAW` is `init` — with PHASE_NUM present, output the following and wait for user reply:

```
Current workflow stage: init (no prior handoff detected)
Choose next step:
  1. Run $sg-plan {PHASE_NUM}
  2. Cancel
```

When PHASE_NUM is absent, replace with `1. Run $sg-plan`.

- If reply is "1" or contains "sg-plan": append `| TS | PHASE_SLUG | init | sg-next | - |` to HANDOFF.md, then output `→ $sg-plan [PHASE_NUM]` and tell the user to activate that skill.
- If reply is "2" or "cancel": output `Cancelled. No changes made.` and exit (no append).

**Step 6 — emit next-step message (all stages except complete/init):**

Output exactly:
```
→ {NEXT_CMD}
```

Then tell the user to activate that skill by running it as a Codex/Gemini skill command.

</process>

<success_criteria>
1. When HANDOFF.md is missing or has zero data rows, treat as STAGE_RAW=init (NEXT-01).
2. stage→next-command mapping uses the same routing branches as sg-status (NEXT-02).
3. For all stages except complete/init, emit `→ $sg-[cmd]` and instruct the user to activate it — no confirmation prompt (NEXT-03).
4. When STAGE_RAW is complete or init, present a numbered choice list; output `Cancelled. No changes made.` when cancel is chosen (NEXT-04).
5. Before reporting the next step, append `| TS | PHASE_SLUG | FROM_STAGE | sg-next | - |` to HANDOFF.md (NEXT-05).
6. FROM_STAGE is set to the resolved STAGE_RAW value (not re-read from HANDOFF.md).
7. If the last HANDOFF row has corrupted sg-next chain, scan backward for the last real stage (NEXT-06).
8. For the superpowers/parallel/execute/tdd/review stages, routing is skip-aware (super_gsd.tdd_mode / skip_review / skip_learn): a skipped stage chain-skips to the next non-skipped stage. With all flags false/absent the routing is unchanged.
</success_criteria>
