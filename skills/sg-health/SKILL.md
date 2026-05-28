---
name: sg-health
description: Use this when something feels broken or before onboarding — diagnoses GSD, Superpowers, hooks, HANDOFF.md, and STATE.md installation line by line.
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
A read-only diagnostic command that checks GSD/Superpowers installation, Hookify installation (optional), hooks.json hook registration, HANDOFF.md schema, and STATE.md frontmatter line by line — each item reported as [OK]/[WARN]/[FAIL]/[OPTIONAL] — ending with a summary line. Creates or modifies no files.
</objective>

<execution_context>
Self-contained — reads ~/.claude/*, ${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json, .planning/HANDOFF.md, .planning/STATE.md. Writes nothing.
</execution_context>

<process>
Check the following 7 items in order. Accumulate FAIL and WARN counters and print a summary line at the end. File write operators (>, >>, tee, sed -i) are never used.

1. **GSD installation**

   ```bash
   test -d "$HOME/.claude/get-shit-done" && echo OK || echo FAIL
   ```

   - OK → `GSD .............. [OK]`
   - FAIL → `GSD .............. [FAIL] ~/.claude/get-shit-done/ directory not found`, FAIL++

2. **Superpowers installation**

   ```bash
   test -d "$HOME/.claude/plugins/data/superpowers-claude-plugins-official" && echo OK || echo FAIL
   ```

   - OK → `Superpowers ...... [OK]`
   - FAIL → `Superpowers ...... [FAIL] directory not found`, FAIL++

3. **Hook script existence** *(required for Codex/Gemini install)*

   ```bash
   test -f "hooks/stop_hook.cjs" && test -f "hooks/rule_runner.cjs" && echo OK || echo WARN
   ```

   - OK → `Hook scripts .... [OK]`
   - WARN → `Hook scripts .... [WARN] hooks/stop_hook.cjs or hooks/rule_runner.cjs not found. For Codex/Gemini use: cp -r ~/super-gsd/hooks .`, WARN++

4. **Stop hook registration**

   ```bash
   grep -q '"Stop"[[:space:]]*:' "${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json" && echo OK || echo FAIL
   ```

   - OK → `Stop hook ........ [OK]`
   - FAIL → `Stop hook ........ [FAIL] Stop hook not found in hooks.json`, FAIL++

5. **SubagentStop hook registration**

   ```bash
   grep -q '"SubagentStop"' "${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json" && echo OK || echo FAIL
   ```

   - OK → `SubagentStop hook  [OK]`
   - FAIL → `SubagentStop hook  [FAIL] SubagentStop hook not found in hooks.json`, FAIL++

6. **HANDOFF.md schema**

   ```bash
   test -f .planning/HANDOFF.md && echo EXISTS || echo MISSING
   ```

   - MISSING → `HANDOFF.md ....... [WARN] file not found (no handoffs yet)`, WARN++
   - EXISTS → check data rows:
     ```bash
     grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | head -1
     ```
     - no output → `HANDOFF.md ....... [WARN] no data rows (no handoffs yet)`, WARN++
     - output found → check column count of first data row:
       ```bash
       grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | head -1 | awk -F'|' '{print NF}'
       ```
       - NF == 8 → `HANDOFF.md ....... [OK]`
       - NF != 8 → `HANDOFF.md ....... [FAIL] schema corrupted (not a 6-column TSV)`, FAIL++

7. **STATE.md frontmatter**

   ```bash
   test -f .planning/STATE.md && echo EXISTS || echo MISSING
   ```

   - MISSING → `STATE.md ......... [WARN] file not found`, WARN++
   - EXISTS → check frontmatter delimiter count:
     ```bash
     grep -c '^---$' .planning/STATE.md
     ```
     - result >= 2 → `STATE.md ......... [OK]`
     - result < 2 → `STATE.md ......... [FAIL] frontmatter cannot be parsed (missing --- delimiter)`, FAIL++

8. **Summary output**

   Print a blank line, then:
   - FAIL == 0 && WARN == 0 → `All checks passed.`
   - otherwise → `[FAIL] ${FAIL} item(s), [WARN] ${WARN} item(s) — check the items above.`
</process>

<success_criteria>
1. All 8 diagnostic items (GSD, Superpowers, Hookify, Hook scripts, Stop hook, SubagentStop hook, HANDOFF.md, STATE.md) are printed.
2. Each item is printed in D-05 format (e.g. `GSD .............. [OK]` — dot padding + `[OK]`/`[WARN]`/`[FAIL]`/`[OPTIONAL]`).
3. A blank line followed by the summary line is printed at the end.
4. No files are created or modified (HEALTH-05).
</success_criteria>
