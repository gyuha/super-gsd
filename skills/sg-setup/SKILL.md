---
name: sg-setup
description: Copy super-gsd hook and skill files to the current project — Claude Code in-session installer
argument-hint: "[--gemini] [--force] - --gemini: also copy .gemini/settings.json, --force: overwrite existing files"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Copy the files required for super-gsd operation (hooks/, .agents/skills/, .codex/hooks.json) from the npm package path to the current project root. Complete installation by running node directly via the Bash tool inside the Claude Code session.
</objective>

<execution_context>
Self-contained. Determine the @gyuha/super-gsd package root via require.resolve, then copy files to the current project using the Bash tool.
</execution_context>

<process>
0. **Argument parsing.**

   Split ARGUMENTS by whitespace and extract flags:
   - Whether `--force` is present → FORCE=true (default false)
   - Whether `--gemini` is present → GEMINI=true (default false)

1. **Determine PKG_ROOT (per D-01~D-04).**

   Run the following command with the Bash tool (D-02: npm root -g fallback when require.resolve fails):
   ```bash
   PKG_ROOT=$(node -e "
     try {
       const pkg = require.resolve('@gyuha/super-gsd/package.json');
       const path = require('path');
       process.stdout.write(path.dirname(pkg));
     } catch(e) { process.exit(1); }
   " 2>/dev/null)
   if [ -z "$PKG_ROOT" ]; then
     PKG_ROOT=$(npm root -g 2>/dev/null)/@gyuha/super-gsd
     [ ! -d "$PKG_ROOT" ] && PKG_ROOT=""
   fi
   if [ -z "$PKG_ROOT" ]; then
     echo "[sg-setup] Cannot locate @gyuha/super-gsd package. Install it first:"
     echo "  npx @gyuha/super-gsd install"
     exit 1
   fi
   echo "[sg-setup] PKG_ROOT: $PKG_ROOT"
   ```

2. **Platform detection (per D-05~D-08).**

   When --gemini argument is absent, auto-detect via environment variables + directory (D-06):
   ```bash
   if [ "$GEMINI" != "true" ]; then
     if [ -n "$GEMINI_PROJECT_DIR" ] || [ -n "$GEMINI_API_KEY" ]; then
       GEMINI=true
       echo "[sg-setup] Gemini environment detected. Also copying .gemini/settings.json."
     elif [ -n "$CODEX_SHELL" ] || [ -n "$CODEX" ] || [ -d ".codex" ]; then
       echo "[sg-setup] Platform detected: codex (use --gemini to include Gemini settings)"
     else
       echo "[sg-setup] Platform not detected — copying default file set (hooks, .agents, .codex) only."
     fi
   fi
   ```

3. **Assemble copy target list.**

   Files always copied:
   - `hooks/stop_hook.cjs`
   - `hooks/rule_runner.cjs`
   - `hooks/transcript_matcher.cjs`
   - `hooks/lessons_ranker.cjs`
   - `hooks/hooks.json`
   - `.agents/skills/sg-execute/SKILL.md`
   - `.agents/skills/sg-learn/SKILL.md`
   - `.agents/skills/sg-next/SKILL.md`
   - `.agents/skills/sg-plan/SKILL.md`
   - `.agents/skills/sg-retro/SKILL.md`
   - `.agents/skills/sg-review/SKILL.md`
   - `.agents/skills/sg-ship/SKILL.md`
   - `.agents/skills/sg-start/SKILL.md`
   - `.agents/skills/sg-status/SKILL.md`
   - `.codex/hooks.json`

   Added when GEMINI=true:
   - `.gemini/settings.json`

4. **Execute file copy (per D-09~D-12, using Bash tool).**

   Run the following script with the Bash tool. Replace FORCE, GEMINI, and PKG_ROOT variables with the values determined in prior steps:

   ```bash
   DEST_ROOT=$(pwd)
   COPIED=0
   SKIPPED=0
   ERRORS=0

   copy_file() {
     local REL_PATH="$1"
     local SRC="$PKG_ROOT/$REL_PATH"
     local DEST="$DEST_ROOT/$REL_PATH"

     if [ ! -f "$SRC" ]; then
       echo "✗ $REL_PATH: source not found in $PKG_ROOT"
       ERRORS=$((ERRORS + 1))
       return
     fi

     if [ -f "$DEST" ] && [ "$FORCE" != "true" ]; then
       echo "⚠ $REL_PATH already exists — skipping (use --force to overwrite)"
       SKIPPED=$((SKIPPED + 1))
       return
     fi

     mkdir -p "$(dirname "$DEST")"
     if cp "$SRC" "$DEST"; then
       if [ -f "$DEST" ] && [ "$FORCE" = "true" ]; then
         echo "✓ $REL_PATH (overwritten)"
       else
         echo "✓ $REL_PATH"
       fi
       COPIED=$((COPIED + 1))
     else
       echo "✗ $REL_PATH: copy failed"
       ERRORS=$((ERRORS + 1))
     fi
   }

   copy_file "hooks/stop_hook.cjs"
   copy_file "hooks/rule_runner.cjs"
   copy_file "hooks/transcript_matcher.cjs"
   copy_file "hooks/lessons_ranker.cjs"
   copy_file "hooks/hooks.json"
   copy_file ".agents/skills/sg-execute/SKILL.md"
   copy_file ".agents/skills/sg-learn/SKILL.md"
   copy_file ".agents/skills/sg-next/SKILL.md"
   copy_file ".agents/skills/sg-plan/SKILL.md"
   copy_file ".agents/skills/sg-retro/SKILL.md"
   copy_file ".agents/skills/sg-review/SKILL.md"
   copy_file ".agents/skills/sg-ship/SKILL.md"
   copy_file ".agents/skills/sg-start/SKILL.md"
   copy_file ".agents/skills/sg-status/SKILL.md"
   copy_file ".codex/hooks.json"

   if [ "$GEMINI" = "true" ]; then
     copy_file ".gemini/settings.json"
   fi

   echo ""
   echo "Installation complete."
   echo "  Copied:  $COPIED files"
   echo "  Skipped: $SKIPPED files (already exist)"
   if [ "$ERRORS" -gt 0 ]; then
     echo "  Errors:  $ERRORS (see above)"
   fi
   ```

5. **Completion notice.**

   ```
   [sg-setup] Installation complete. Next step: run /super-gsd:sg-execute to proceed with the current phase.
   ```
</process>

<success_criteria>
1. If the @gyuha/super-gsd package is not found, a clear error message with installation instructions is printed and execution exits.
2. When --gemini flag or environment variables (GEMINI_PROJECT_DIR, GEMINI_API_KEY) are detected, .gemini/settings.json is also copied.
3. All default files (5 hooks/, 9 .agents/skills/ SKILL.md, .codex/hooks.json) are copied via the Bash tool.
4. Target file exists + no --force → skip + warning. --force present → overwrite.
5. After completion, a Copied/Skipped summary and next-step guidance are printed.
6. The /super-gsd:sg-setup command is auto-registered via skills/ directory scan without modifying plugin.json (per D-18).
</success_criteria>
