---
name: sg-use-tdd
description: Use this when you want to enable or disable TDD mode — toggles .planning/USE-TDD marker on/off, or sets it explicitly with on/off argument.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
Machine tokens stay verbatim English regardless of language: `on`, `off`, `ON`, `OFF`, `USE-TDD`, and all file paths.
</language>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- No Superpowers integration: this skill runs fully standalone
- SubagentStop not supported: no impact for a config toggle skill
- AskUserQuestion not supported: no impact — a toggle has no ambiguous branch, so no prose-fallback is needed
</constraints>

<objective>
Toggle TDD mode by managing the `.planning/USE-TDD` marker file. Marker presence = TDD mode ON; marker absence = TDD mode OFF. With an explicit `on`/`off` argument the marker is created/deleted regardless of current state; with no argument the current state is shown and then toggled. Idempotent — repeating the same target state never errors. Does NOT append a workflow audit-log row (this is a config toggle, not a workflow stage transition — same pattern as sg-health / sg-status).
</objective>

<execution_context>
Self-contained — writes `.planning/USE-TDD` when enabling, deletes it when disabling. Reads nothing else. The marker is consumed downstream by Phase 47 (sg-execute / sg-review); this skill only writes the marker.
</execution_context>

<process>
The marker path is always the literal `.planning/USE-TDD` — never derived from `$ARGUMENTS`.

1. **Parse `$ARGUMENTS`.** Trim surrounding whitespace and lowercase it. Classify:
   - exactly `on` → BRANCH A
   - exactly `off` → BRANCH B
   - empty or anything else → BRANCH C (no-arg toggle)

   ```bash
   ARG=$(printf '%s' "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
   ```

2. **Resolve current state.**
   ```bash
   if [ -f .planning/USE-TDD ]; then TDD_ON=true; else TDD_ON=false; fi
   ```

3. **Execute branch.**

   **BRANCH A (`on`)** — create the marker regardless of current state (idempotent: if it already exists this just refreshes the timestamp, no error):
   ```bash
   mkdir -p .planning
   printf 'TDD mode enabled\nActivated: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .planning/USE-TDD
   ```
   Output (prose in user's language; `ON` verbatim): `TDD mode: ON`

   **BRANCH B (`off`)** — delete the marker if present; if absent do nothing (idempotent, no error):
   ```bash
   rm -f .planning/USE-TDD
   ```
   Output (prose in user's language; `OFF` verbatim): `TDD mode: OFF`

   **BRANCH C (no argument)** — show current state, then toggle:
   1. Print the current state first: `TDD mode is currently: ON` if `TDD_ON=true`, else `TDD mode is currently: OFF`.
   2. Toggle:
      - if `TDD_ON=true` → run BRANCH B logic (delete marker), then output `TDD mode: OFF`
      - if `TDD_ON=false` → run BRANCH A logic (create marker), then output `TDD mode: ON`

**Idempotency guarantee:** `on` when the marker already exists overwrites it with a fresh timestamp (no-op on presence, no error). `off` when the marker is absent is a `rm -f` no-op (no error). Running either branch twice leaves the filesystem in the same state as running it once.

**Shell portability (CLAUDE.md):** no PCRE (`-P`) grep flag; argument classification uses `case`/`sed -E`. `date -u +%Y-%m-%dT%H:%M:%SZ` is POSIX-compatible on both macOS (BSD) and Linux (GNU).
</process>

<success_criteria>
1. Running the skill with no argument when `.planning/USE-TDD` is absent creates the marker and outputs `TDD mode: ON`.
2. Running the skill with no argument when `.planning/USE-TDD` is present deletes the marker and outputs `TDD mode: OFF`.
3. Running `on` twice leaves exactly one `.planning/USE-TDD` file and produces no error (idempotent — the second call is a no-op on presence).
4. Running `off` twice when the marker is absent produces no error and outputs `TDD mode: OFF` (idempotent — `rm -f` skips a file that does not exist).
5. No workflow audit-log row is appended (config toggle, not a stage transition).
6. `.planning/` directory is created if it does not exist (`mkdir -p .planning` before any write).
7. Fully standalone regardless of whether GSD or Superpowers is installed.
</success_criteria>
