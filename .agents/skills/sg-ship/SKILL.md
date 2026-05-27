---
name: sg-ship
description: Merge phase work into main branch and push to remote — GSD ship fallback or direct git merge mode
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Merge the completed phase branch into main and push. If GSD is installed, delegate to gsd-ship. Otherwise guide the user through a manual git merge + push + optional PR creation flow.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Superpowers integration not available: Claude Code exclusive tool
- SubagentStop not supported: no automatic trigger on stage completion
- AskUserQuestion not supported: output choices as text and accept free-form input
</constraints>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Writes a ship row to .planning/HANDOFF.md. Runs git commands to merge and push.
</execution_context>

<process>

**Step 1 — Resolve phase.**

```bash
if [ -n "$ARGUMENTS" ]; then
  PHASE_NUM="$ARGUMENTS"
else
  Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
fi
if [ -z "$PHASE_NUM" ]; then
  echo "Could not resolve current phase. Pass phase number explicitly: $sg-ship <phase>"
  exit 1
fi
```

**Step 2 — Check for uncommitted changes.**

```bash
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "[sg-ship] Uncommitted changes detected. Commit or stash before shipping."
  git status --short
  exit 1
fi
```

**Step 3 — Detect current branch and base branch.**

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
BASE_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
[ -z "$BASE_BRANCH" ] && BASE_BRANCH="main"
echo "[sg-ship] Current branch: $CURRENT_BRANCH"
echo "[sg-ship] Target base: $BASE_BRANCH"
```

**Step 4 — Check GSD availability and branch.**

```bash
if command -v gsd-sdk >/dev/null 2>&1 || [ -d "$HOME/.claude/get-shit-done" ]; then
  GSD_AVAILABLE=1
else
  GSD_AVAILABLE=0
fi
```

**Step 5 — Ship.**

**With GSD (main path):**

Call Skill(skill="gsd-ship", args="$PHASE_NUM") and transfer session control.

**Without GSD (direct git merge mode):**

Output the available options as text and wait for user input:

```
[sg-ship] Direct git merge mode (GSD not installed)

Select deployment method for Phase ${PHASE_NUM}:
1) Local merge into ${BASE_BRANCH}
2) Create Pull Request after push (requires gh CLI)
3) Keep current state (manual handling later)

Enter a number:
```

**Option 1 — Local merge:**

```bash
git checkout "$BASE_BRANCH" && git pull origin "$BASE_BRANCH" && git merge "$CURRENT_BRANCH" || {
  echo "[sg-ship] merge failed — push cancelled."
  exit 1
}
# Run tests if present — block push on failure
TEST_FAILED=0
if [ -f "package.json" ] && grep -q '"test"' package.json 2>/dev/null; then
  npm test || TEST_FAILED=1
elif [ -f "Makefile" ] && grep -q '^test' Makefile 2>/dev/null; then
  make test || TEST_FAILED=1
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  pytest 2>&1 || TEST_FAILED=1
fi
if [ "$TEST_FAILED" -eq 1 ]; then
  echo "[sg-ship] tests failed — push cancelled. Fix the failures and run again."
  exit 1
fi
git push origin "$BASE_BRANCH"
echo "[sg-ship] Phase ${PHASE_NUM} merge complete. Clean up branch: git branch -d ${CURRENT_BRANCH}"
```

**Option 2 — Create PR:**

```bash
git push -u origin "$CURRENT_BRANCH"
gh pr create \
  --title "Phase ${PHASE_NUM} implementation" \
  --body "## Summary
Phase ${PHASE_NUM} implementation complete.

## Test Plan
- [ ] Verify acceptance criteria from PLAN.md
- [ ] Confirm success_criteria pass"
```

**Option 3 — Keep:**

```
[sg-ship] Branch ${CURRENT_BRANCH} kept. Merge manually when ready.
```

**Step 6 — Record HANDOFF.md.**

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if echo "$PHASE_NUM" | grep -qE '\.'; then
  PHASE_PAD="$PHASE_NUM"
else
  PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
fi
PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null)
[ -z "$PHASE_SLUG" ] && PHASE_SLUG="${PHASE_NUM}"
Read .planning/HANDOFF.md, then extract the To column (5th pipe-delimited field) from the last row starting with "| " followed by a 4-digit year. Set FROM_STAGE (default "review" if empty).
[ -z "$FROM_STAGE" ] && FROM_STAGE="review"
echo "| $TS | $PHASE_SLUG | $FROM_STAGE | ship | - |" >> "$HANDOFF_FILE"
```

**Step 7 — Completion guidance.**

```
Phase ${PHASE_NUM} deployment complete. Next step: $sg-plan <next-phase>
Or if this is the last phase: check current state with $sg-status
```

</process>

<success_criteria>
1. If PHASE_NUM is empty, output an explicit error message and exit.
2. Refuse to merge if there are uncommitted changes.
3. If GSD is present, delegate to the gsd-ship Skill.
4. If GSD is absent, output 3 options as text and handle based on user input.
5. A `ship` row is recorded in HANDOFF.md.
6. Decimal phase numbers (e.g. 7.1) are handled correctly.
</success_criteria>
