---
phase: quick-260516-dsz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/sg-update.md
autonomous: true
requirements: [quick-260516-dsz]
must_haves:
  truths:
    - "GSD가 미설치 상태이면 'Installing GSD...' 출력 후 설치"
    - "GSD가 기설치 상태이면 'Updating GSD...' 출력 후 업데이트 (버전 before→after 포함)"
    - "superpowers가 미설치이면 'Installing superpowers...' 출력 후 설치"
    - "superpowers가 기설치이면 'Updating superpowers...' 출력 후 업데이트"
    - "hookify가 미설치이면 'Installing hookify...' 출력 후 설치"
    - "hookify가 기설치이면 'Updating hookify...' 출력 후 업데이트"
    - "summary에 각 도구의 installed/updated 상태가 반영됨"
    - "super-gsd Step 5 업데이트 로직은 변경 없음"
  artifacts:
    - path: commands/sg-update.md
      provides: install/update detection logic for GSD, superpowers, hookify
  key_links: []
---

<objective>
Modify `commands/sg-update.md` so that Steps 2–4 detect whether each tool
(GSD, superpowers, hookify) is already installed before deciding whether to
print "Installing..." or "Updating...".  The actual install command is the
same in both cases; only the user-facing message differs.  The summary block
is updated to reflect each tool's installed vs updated state.

Purpose: Give the user clear feedback on whether a fresh install or an
upgrade is happening, without changing behavior.

Output: Updated `commands/sg-update.md`.
</objective>

<execution_context>
Self-contained edit to a single markdown command file.
</execution_context>

<context>
@commands/sg-update.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add install-detection logic to sg-update process</name>
  <files>commands/sg-update.md</files>
  <action>
Rewrite the `<process>` section of `commands/sg-update.md` as follows.
Keep the surrounding frontmatter, `<objective>`, `<execution_context>`,
`<success_criteria>`, and Step 5 (super-gsd update) exactly as-is.

Replace Steps 2, 3, 4, and 6 with the content below.

---

**Step 2 — GSD (get-shit-done-cc):**

Check whether GSD is installed:

```bash
command -v gsd-sdk >/dev/null 2>&1 || npm list -g get-shit-done-cc >/dev/null 2>&1
```

- If NOT installed: print `Installing GSD...` then run:
  ```bash
  npm install -g get-shit-done-cc@latest 2>&1 | tail -3
  ```
  Record status as `installed`.

- If already installed: print `Updating GSD...`, capture before-version, run
  install, capture after-version:
  ```bash
  GSD_BEFORE=$(gsd-sdk --version 2>/dev/null || echo 'unknown')
  npm install -g get-shit-done-cc@latest 2>&1 | tail -3
  GSD_AFTER=$(gsd-sdk --version 2>/dev/null || echo 'unknown')
  ```
  Record status as `updated (${GSD_BEFORE} → ${GSD_AFTER})`.

**Step 3 — superpowers:**

Check whether superpowers is installed:

```bash
claude plugin list 2>/dev/null | grep -qi superpowers
```

- If NOT installed: print `Installing superpowers...` then run:
  ```bash
  claude plugin install superpowers@claude-plugins-official 2>&1
  ```
  Record status as `installed`.

- If already installed: print `Updating superpowers...` then run the same
  install command. Record status as `updated`.

**Step 4 — hookify:**

Check whether hookify is installed:

```bash
claude plugin list 2>/dev/null | grep -qi hookify
```

- If NOT installed: print `Installing hookify...` then run:
  ```bash
  claude plugin install hookify@claude-plugins-official 2>&1
  ```
  Record status as `installed`.

- If already installed: print `Updating hookify...` then run the same install
  command. Record status as `updated`.

**Step 6 — Summary** (replace old Step 6):

Print a summary using the statuses recorded above:

```
Done.

Tools:
- GSD (get-shit-done-cc): <status>        ← e.g. "installed" or "updated (1.2.3 → 1.3.0)"
- superpowers: <status>                   ← "installed" or "updated"
- hookify: <status>                       ← "installed" or "updated"
- super-gsd: updated

Restart Claude Code to activate updated plugins.
```

---

Do NOT change Step 1 ("Print: 'Updating workflow tools...'") or Step 5
(super-gsd plugin install). Also update `<success_criteria>` point 3 from
"Summary shows what was updated" to "Summary shows installed/updated state
for each tool."
  </action>
  <verify>
    <automated>grep -c "Installing\|Updating" /Users/gyuha/workspace/super-gsd/commands/sg-update.md</automated>
  </verify>
  <done>
- `commands/sg-update.md` process section contains install-detection logic
  for GSD, superpowers, and hookify (grep finds at least 6 occurrences of
  "Installing" or "Updating" — one pair per tool).
- Step 5 (super-gsd) is unchanged.
- Summary block references `&lt;status&gt;` for each of the three tools.
  </done>
</task>

</tasks>

<verification>
grep -c "Installing\|Updating" commands/sg-update.md   # expect ≥ 6
grep -c "super-gsd" commands/sg-update.md              # Step 5 still present
</verification>

<success_criteria>
1. Each of GSD, superpowers, hookify has a detection check before its install command.
2. "Installing..." printed when tool is absent; "Updating..." printed when tool is present.
3. GSD update path captures before/after version; plugin paths record installed vs updated.
4. Summary block reflects per-tool status.
5. Step 5 (super-gsd) is byte-for-byte identical to the original.
</success_criteria>

<output>
No SUMMARY.md required for quick tasks.
</output>
