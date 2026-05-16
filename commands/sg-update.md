---
name: sg-update
description: Check, install, or update GSD, superpowers, hookify, and super-gsd to their latest versions.
argument-hint: "No arguments needed."
---

<objective>
Check whether each tool in the super-gsd workflow is installed, install it if missing, or update it if present:
- GSD (get-shit-done-cc) — npm package
- superpowers — Claude Code plugin
- hookify — Claude Code plugin
- super-gsd — Claude Code plugin
</objective>

<execution_context>
Self-contained. Uses Bash to run detection and install/update commands.
</execution_context>

<process>
1. Print: "Updating workflow tools..."

   Preflight: check whether the `claude` CLI is available (required for plugin detection and install):
   ```bash
   if ! command -v claude >/dev/null 2>&1; then
     echo "Warning: 'claude' CLI not found on PATH. Plugin detection for superpowers, hookify, and super-gsd will fall back to install."
   fi
   ```

2. **GSD (get-shit-done-cc):**

   Run detection, messaging, install/update, and status capture in a single bash block so shell variables are preserved:

   ```bash
   if command -v gsd-sdk >/dev/null 2>&1 || npm list -g --depth=0 get-shit-done-cc >/dev/null 2>&1; then
     echo "Updating GSD..."
     GSD_BEFORE=$(gsd-sdk --version 2>/dev/null || echo 'unknown')
     npm install -g get-shit-done-cc@latest 2>&1 | tail -3
     GSD_AFTER=$(gsd-sdk --version 2>/dev/null || echo 'unknown')
     GSD_STATUS="updated (${GSD_BEFORE} → ${GSD_AFTER})"
   else
     echo "Installing GSD..."
     npm install -g get-shit-done-cc@latest 2>&1 | tail -3
     GSD_STATUS="installed"
   fi
   ```

3. **superpowers:**

   Run detection, messaging, install/update, and status capture in a single bash block:

   ```bash
   if claude plugin list 2>&1 | grep -qi superpowers; then
     echo "Updating superpowers..."
     claude plugin install superpowers@claude-plugins-official 2>&1
     SUPERPOWERS_STATUS="updated"
   else
     echo "Installing superpowers..."
     claude plugin install superpowers@claude-plugins-official 2>&1
     SUPERPOWERS_STATUS="installed"
   fi
   ```

4. **hookify:**

   Run detection, messaging, install/update, and status capture in a single bash block:

   ```bash
   if claude plugin list 2>&1 | grep -qi hookify; then
     echo "Updating hookify..."
     claude plugin install hookify@claude-plugins-official 2>&1
     HOOKIFY_STATUS="updated"
   else
     echo "Installing hookify..."
     claude plugin install hookify@claude-plugins-official 2>&1
     HOOKIFY_STATUS="installed"
   fi
   ```

5. **super-gsd:**

   ```bash
   if claude plugin list 2>&1 | grep -qi super-gsd; then
     echo "Updating super-gsd..."
     claude plugin install super-gsd@super-gsd 2>&1
     SUPERGSD_STATUS="updated"
   else
     echo "Installing super-gsd..."
     claude plugin install super-gsd@super-gsd 2>&1
     SUPERGSD_STATUS="installed"
   fi
   ```

6. Print a summary using the status values you recorded in steps 2–5.
   Do not execute any bash here — use the in-context values directly.
   Replace each bracketed item with the actual status string:

   Done.

   Tools:
   - GSD (get-shit-done-cc): [status recorded in step 2, e.g. "installed" or "updated (1.2.3 → 1.3.0)"]
   - superpowers: [status recorded in step 3, either "installed" or "updated"]
   - hookify: [status recorded in step 4, either "installed" or "updated"]
   - super-gsd: [status recorded in step 5, either "installed" or "updated"]

   Restart Claude Code to activate updated plugins.
</process>

<success_criteria>
1. GSD npm package installed or updated to latest.
2. superpowers, hookify, super-gsd plugins installed or updated.
3. Summary shows the actual installed/updated state for each tool, with no literal placeholder text.
</success_criteria>
