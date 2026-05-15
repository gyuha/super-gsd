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

2. **Update GSD** (npm package):
   ```bash
   npm install -g get-shit-done-cc@latest 2>&1 | tail -3
   ```
   Print current version before and after:
   ```bash
   echo "GSD before: $(gsd-sdk --version 2>/dev/null || echo 'unknown')"
   npm install -g get-shit-done-cc@latest
   echo "GSD after: $(gsd-sdk --version 2>/dev/null || echo 'unknown')"
   ```

3. **Update superpowers**:
   ```bash
   claude plugin install superpowers@claude-plugins-official 2>&1
   ```

4. **Update hookify**:
   ```bash
   claude plugin install hookify@claude-plugins-official 2>&1
   ```

5. **Update super-gsd**:
   ```bash
   claude plugin install super-gsd@super-gsd 2>&1
   ```

6. Print a summary:
   ```
   Update complete.

   Tools updated:
   - GSD (get-shit-done-cc): <before> → <after>
   - superpowers: reinstalled from claude-plugins-official
   - hookify: reinstalled from claude-plugins-official
   - super-gsd: reinstalled from super-gsd marketplace

   Restart Claude Code to activate updated plugins.
   ```
</process>

<success_criteria>
1. GSD npm package updated to latest.
2. superpowers, hookify, super-gsd plugins reinstalled.
3. Summary shows what was updated.
</success_criteria>
