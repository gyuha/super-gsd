---
name: sg-update
description: Update super-gsd, superpowers, hookify plugins and GSD (get-shit-done-cc) to their latest versions.
argument-hint: "No arguments needed."
---

<objective>
Update the four tools in the super-gsd workflow to their latest versions:
- GSD (get-shit-done-cc) — npm package
- superpowers — Claude Code plugin
- hookify — Claude Code plugin
- super-gsd — Claude Code plugin
</objective>

<execution_context>
Self-contained. Uses Bash to run update commands.
</execution_context>

<process>
1. Print: "Updating workflow tools..."

2. **GSD (get-shit-done-cc):**

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

3. **superpowers:**

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

4. **hookify:**

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

5. **Update super-gsd**:
   ```bash
   claude plugin install super-gsd@super-gsd 2>&1
   ```

6. Print a summary using the statuses recorded above:

   ```
   Done.

   Tools:
   - GSD (get-shit-done-cc): <status>        ← e.g. "installed" or "updated (1.2.3 → 1.3.0)"
   - superpowers: <status>                   ← "installed" or "updated"
   - hookify: <status>                       ← "installed" or "updated"
   - super-gsd: updated

   Restart Claude Code to activate updated plugins.
   ```
</process>

<success_criteria>
1. GSD npm package updated to latest.
2. superpowers, hookify, super-gsd plugins reinstalled.
3. Summary shows installed/updated state for each tool.
</success_criteria>
