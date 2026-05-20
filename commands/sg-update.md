---
name: sg-update
description: Check, install, or update GSD, superpowers, and super-gsd to their latest versions.
argument-hint: "No arguments needed."
---

<objective>
Check whether each tool in the super-gsd workflow is installed, install it if missing, or update it if present:
- GSD (get-shit-done-cc) — npm package
- superpowers — Claude Code plugin
- super-gsd — Claude Code plugin
</objective>

<execution_context>
Self-contained. Uses Bash to run detection and install/update commands.
</execution_context>

<process>
Run the following single bash block. All steps run in one shell process so variables persist through the summary.

```bash
echo "Updating workflow tools..."

# Preflight: check for claude CLI
if ! command -v claude >/dev/null 2>&1; then
  echo "Warning: 'claude' CLI not found on PATH. Plugin steps (superpowers, super-gsd) will be skipped."
  CLAUDE_AVAILABLE=false
else
  CLAUDE_AVAILABLE=true
fi

# GSD (get-shit-done-cc)
if command -v gsd-sdk >/dev/null 2>&1 || npm list -g --depth=0 get-shit-done-cc >/dev/null 2>&1; then
  echo "Updating GSD..."
  GSD_BEFORE=$(gsd-sdk --version 2>/dev/null || npm list -g --depth=0 get-shit-done-cc 2>/dev/null | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo 'unknown')
  NPM_OUT=$(npm install -g get-shit-done-cc@latest 2>&1)
  NPM_EC=$?
  echo "$NPM_OUT" | tail -3
  if [ "$NPM_EC" -ne 0 ]; then
    GSD_STATUS="failed (exit ${NPM_EC})"
  else
    GSD_AFTER=$(gsd-sdk --version 2>/dev/null || npm list -g --depth=0 get-shit-done-cc 2>/dev/null | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo 'unknown')
    GSD_STATUS="updated (${GSD_BEFORE} → ${GSD_AFTER})"
  fi
else
  echo "Installing GSD..."
  NPM_OUT=$(npm install -g get-shit-done-cc@latest 2>&1)
  NPM_EC=$?
  echo "$NPM_OUT" | tail -3
  if [ "$NPM_EC" -eq 0 ]; then
    GSD_STATUS="installed"
  else
    GSD_STATUS="failed (exit ${NPM_EC})"
  fi
fi

# superpowers
if [ "$CLAUDE_AVAILABLE" = "true" ]; then
  if claude plugin list 2>&1 | grep -qiF 'superpowers'; then
    echo "Updating superpowers..."
    claude plugin install superpowers@claude-plugins-official 2>&1
    PLUGIN_EC=$?
    if [ "$PLUGIN_EC" -eq 0 ]; then
      SUPERPOWERS_STATUS="updated"
    else
      SUPERPOWERS_STATUS="failed (exit ${PLUGIN_EC})"
    fi
  else
    echo "Installing superpowers..."
    claude plugin install superpowers@claude-plugins-official 2>&1
    PLUGIN_EC=$?
    if [ "$PLUGIN_EC" -eq 0 ]; then
      SUPERPOWERS_STATUS="installed"
    else
      SUPERPOWERS_STATUS="failed (exit ${PLUGIN_EC})"
    fi
  fi
else
  SUPERPOWERS_STATUS="skipped (claude not found)"
fi

# super-gsd
if [ "$CLAUDE_AVAILABLE" = "true" ]; then
  if claude plugin list 2>&1 | grep -qiF 'super-gsd'; then
    echo "Updating super-gsd..."
    claude plugin install super-gsd@super-gsd 2>&1
    PLUGIN_EC=$?
    if [ "$PLUGIN_EC" -eq 0 ]; then
      SUPERGSD_STATUS="updated"
    else
      SUPERGSD_STATUS="failed (exit ${PLUGIN_EC})"
    fi
  else
    echo "Installing super-gsd..."
    claude plugin install super-gsd@super-gsd 2>&1
    PLUGIN_EC=$?
    if [ "$PLUGIN_EC" -eq 0 ]; then
      SUPERGSD_STATUS="installed"
    else
      SUPERGSD_STATUS="failed (exit ${PLUGIN_EC})"
    fi
  fi
else
  SUPERGSD_STATUS="skipped (claude not found)"
fi

echo ""
echo "Done."
echo ""
echo "Tools:"
echo "- GSD (get-shit-done-cc): ${GSD_STATUS}"
echo "- superpowers: ${SUPERPOWERS_STATUS}"
echo "- super-gsd: ${SUPERGSD_STATUS}"
echo ""
echo "Restart Claude Code to activate updated plugins."
```

After the bash block completes, relay its output to the user verbatim.
</process>

<success_criteria>
1. GSD npm package installed or updated to latest, with actual status shown.
2. superpowers, super-gsd plugins installed or updated (or skipped if claude not on PATH).
3. Summary shows actual installed/updated/failed/skipped state for each tool — no literal placeholder text.
</success_criteria>
