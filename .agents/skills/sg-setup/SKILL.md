---
name: sg-setup
description: Copy super-gsd hook and skill files to the current project — Codex/Gemini in-session installer
argument-hint: "[--gemini] [--force] - --gemini: also copy .gemini/settings.json, --force: overwrite existing files"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Copy the files required to operate super-gsd (hooks/, .agents/skills/, .codex/hooks.json) from the npm package path to the current project root. Complete the installation without an external CLI by copying files directly inside a Codex/Gemini session using AI Read/Write tools.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI)
- No Node.js CLI: npx/node cannot be run directly. Copy files using AI Read/Write tools.
- SubagentStop not supported: after completion, run $sg-execute manually.
- AskUserQuestion not supported: output choices as text and accept free-form input.
</constraints>

<execution_context>
Self-contained. Determines the @gyuha/super-gsd package root via require.resolve, then copies files to the current project using AI Read/Write tools.
</execution_context>

<process>
0. **Argument parsing.**

   Split ARGUMENTS by whitespace to extract flags:
   - `--force` present → FORCE=true (default false)
   - `--gemini` present → GEMINI=true (default false)

1. **Determine PKG_ROOT (per D-01~D-04).**

   Run the following Node.js code via Bash to determine PKG_ROOT (D-02: npm root -g fallback if require.resolve fails):
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

   When --gemini is not present, auto-detect from env vars + directories (D-06):
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

3. **Build copy target list.**

   Always-copied files (Codex default set):
   - `hooks/stop_hook.cjs`
   - `hooks/rule_runner.cjs`
   - `hooks/transcript_matcher.cjs`
   - `hooks/lessons_ranker.cjs`
   - `hooks/hooks.json`
   - `.agents/skills/sg-execute/SKILL.md`
   - `.agents/skills/sg-plan/SKILL.md`
   - `.agents/skills/sg-retro/SKILL.md`
   - `.agents/skills/sg-review/SKILL.md`
   - `.agents/skills/sg-ship/SKILL.md`
   - `.agents/skills/sg-start/SKILL.md`
   - `.agents/skills/sg-status/SKILL.md`
   - `.codex/hooks.json`

   Additional when GEMINI=true:
   - `.gemini/settings.json`

4. **Execute file copy (per D-09~D-16, using AI Read/Write tools).**

   For each copy target:

   a. Source path: `$PKG_ROOT/<relative-path>`
   b. Destination path: `<cwd>/<relative-path>`

   **Conflict handling (per D-09~D-12):**
   - Target file already exists and FORCE=false → skip + output warning, skipped++ (per D-09~D-10)
   - Target file already exists and FORCE=true → overwrite, copied++ (per D-11)
   - Target file does not exist → copy, copied++ (per D-09)

   **Copy files with AI tools (per D-13~D-16):**
   - Read the source with Read tool at `$PKG_ROOT/<relative-path>`
   - Write to destination with Write tool at `<cwd>/<relative-path>`
   - If parent directory does not exist, Write tool creates it automatically — no separate mkdir needed

   Output result after processing each file:
   - Copy success: `✓ <relative-path>`
   - Skip: `⚠ <relative-path> already exists — skipping (use --force to overwrite)`
   - Error: `✗ <relative-path>: <error message>`

5. **Output summary (per D-13~D-16).**

   After all files are processed:
   ```
   Installation complete.
     Copied:  <copied> files
     Skipped: <skipped> files (already exist)
   ```
   If errors > 0, additionally:
   ```
     Errors:  <errors> (see above)
   ```

   Completion message:
   ```
   [sg-setup] Installation complete. Next step: run $sg-execute to proceed with the current phase.
   ```
</process>

<success_criteria>
1. If the @gyuha/super-gsd package is not found, output a clear error message with installation instructions and exit.
2. When --gemini flag or env vars (GEMINI_PROJECT_DIR, GEMINI_API_KEY) are detected, .gemini/settings.json is also copied.
3. All default files (hooks/ 4 .cjs + hooks.json, .agents/skills/ 7 SKILL.md, .codex/hooks.json) are copied using AI Read/Write tools.
4. Target file exists + no --force → skip + warning. --force present → overwrite.
5. After completion, a Copied/Skipped summary and next-step guidance are output.
6. File copy step uses only AI Read/Write tools — not bash cp or node fs.copyFileSync (node -e for PKG_ROOT determination is allowed).
</success_criteria>
