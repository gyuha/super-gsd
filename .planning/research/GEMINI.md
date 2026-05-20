# Gemini CLI Platform Support Research

**Project:** super-gsd v1.3
**Researched:** 2026-05-21
**Scope:** What is additional or different for Gemini CLI support, relative to the already-planned Codex support (AGENTS.md rewrite, .agents/skills/, .codex/hooks.json).

---

## Critical Context: Gemini CLI Is Being Deprecated

**This is the most important finding and must drive the go/no-go decision.**

Google announced on approximately 2026-05-19 that Gemini CLI will stop serving requests for Google AI Pro, Ultra, and free Gemini Code Assist users on **June 18, 2026** — less than 4 weeks from today. The replacement is **Antigravity CLI**, a new Go-based tool announced at Google I/O 2026.

**Implications:**

- Building a Gemini CLI-specific integration has a sub-4-week useful lifetime for most users.
- However: enterprise Gemini Code Assist Standard/Enterprise license users retain Gemini CLI access unchanged. API key users also retain access.
- The migration path is partially compatible: `.agents/skills/` is the post-migration canonical path (Gemini CLI workspace `.gemini/skills/` must move there), GEMINI.md and AGENTS.md both continue to work unchanged, and hooks JSON fires on the same lifecycle events.

**Recommended decision:** Do NOT build Gemini CLI-specific files. Build for Antigravity CLI instead, which is the forward-compatible target. The `.agents/skills/` directory already planned for Codex is the correct path for Antigravity as well.

---

## Q1: Does Gemini CLI Use GEMINI.md? Format and Size Limit?

**Confidence: HIGH** (official docs)

### Yes, GEMINI.md is the native format

- Plain Markdown, no required frontmatter.
- Default filename is `GEMINI.md`, configurable via `settings.json` using `context.fileName` (string or array).
- Hierarchical loading: `~/.gemini/GEMINI.md` (global) → project root → CWD → subdirectories below CWD (respecting `.gitignore`/`.geminiignore`).
- All discovered files are concatenated and sent with every prompt.
- `/memory refresh` forces a re-scan. `/memory show` displays the concatenated result.
- Supports `@file.md` import syntax for modularization.

### Size limit

No per-file byte limit is documented (unlike Codex's 32 KiB `project_doc_max_bytes`). The practical bound is the model's 1M token context window, shared with conversation history.

### AGENTS.md compatibility

`AGENTS.md` is also readable, but **not by default**. It requires explicit configuration:

```json
// .gemini/settings.json
{
  "context": {
    "fileName": ["AGENTS.md", "GEMINI.md"]
  }
}
```

A GitHub issue requesting AGENTS.md be added to the default filename list was **closed as "not planned"** (issue #12345, closed 2025). So out-of-box, Gemini CLI ignores `AGENTS.md` unless the user adds that settings.json entry.

**For Antigravity CLI:** Both GEMINI.md and AGENTS.md continue to work unchanged (per migration guide).

### Verdict for super-gsd

The repo's existing `AGENTS.md` (being rewritten for Codex) is invisible to Gemini CLI by default. A separate `GEMINI.md` is needed, or users must configure `context.fileName` manually. Given the deprecation timeline, this is a low-priority problem.

---

## Q2: Skills Directory — .gemini/skills/ vs .agents/skills/?

**Confidence: HIGH** (official docs)

### Both paths work, .agents/skills/ takes precedence

Gemini CLI scans four tiers:
1. Built-in skills
2. Extension skills
3. User skills: `~/.gemini/skills/` or `~/.agents/skills/` alias
4. Workspace skills: `.gemini/skills/` or `.agents/skills/` alias

Within the same tier, `.agents/skills/` takes precedence over `.gemini/skills/`. This is explicitly documented.

### Post-migration (Antigravity CLI)

The migration guide explicitly instructs: workspace skills under `.gemini/skills/` **must move to** `.agents/skills/`. The `.agents/skills/` directory is the forward-compatible path.

### Verdict

**The `.agents/skills/` directory planned for Codex is fully shared with Gemini CLI and Antigravity CLI.** No separate `.gemini/skills/` directory is needed. The 6 skill files being created for Codex (`sg-start`, `sg-plan`, `sg-execute`, `sg-review`, `sg-retro`, `sg-status`) work identically in Gemini CLI/Antigravity without any additional files.

---

## Q3: Skill Invocation — activate_skill vs slash/dollar prefix?

**Confidence: HIGH** (official docs)

### Gemini CLI uses activate_skill (agent-internal, not user-typed)

The `activate_skill` tool is **agent-only** — it cannot be invoked manually. The official docs state: "The `activate_skill` tool is used exclusively by the Gemini agent. You cannot invoke this tool manually."

Activation flow:
1. At session start, Gemini CLI injects skill names + descriptions into the system prompt.
2. When the agent identifies a task matching a skill's `description` field, it calls `activate_skill` and asks user for confirmation.
3. The SKILL.md body and directory tree are injected into conversation history.
4. The model proceeds with skill expertise active.

Users can also trigger skills interactively via `/skills list` (then select) or `/skills enable <name>`.

### Comparison table

| Platform | User invocation syntax | Agent invocation |
|----------|----------------------|-----------------|
| Claude Code | `/sg-start` (slash command) | N/A |
| Codex | `$sg-start` (dollar prefix) | N/A |
| Gemini CLI / Antigravity | `/skills enable sg-start` or via agent auto-match | `activate_skill` (internal) |

### Implication for super-gsd

The SKILL.md `description` field is load-bearing for Gemini/Antigravity — it drives automatic activation. Descriptions should be written to match natural user phrases (e.g., "start a new development session" → activates sg-start). The `allow_implicit_invocation: false` policy used for Codex (to prevent accidental auto-triggering) should be evaluated carefully for Gemini: setting it prevents agent auto-match, requiring users to explicitly `/skills enable` the skill each time.

---

## Q4: Hook Events — Does Gemini CLI Have SubagentStop?

**Confidence: HIGH** (official docs)

### No SubagentStop equivalent exists

Gemini CLI supports 11 hook events, none of which are equivalent to SubagentStop:

| Gemini CLI Event | Claude Code Equivalent | Notes |
|-----------------|----------------------|-------|
| `BeforeTool` | `PreToolUse` | Closest analog. Different output schema. |
| `AfterTool` | `PostToolUse` | Same purpose. |
| `SessionStart` | `SessionStart` | Identical semantics. |
| `SessionEnd` | `Stop` | Closest to Stop, fires on exit. |
| `BeforeAgent` | — | No Claude Code equivalent |
| `AfterAgent` | — | No Claude Code equivalent |
| `BeforeModel` | — | No Claude Code equivalent |
| `AfterModel` | — | No Claude Code equivalent |
| `BeforeToolSelection` | — | No Claude Code equivalent |
| `PreCompress` | — | No Claude Code equivalent |
| `Notification` | — | No Claude Code equivalent |
| — | `SubagentStop` | **Not present in Gemini CLI** |

### Configuration file and format

Hooks live in `.gemini/settings.json` (not a standalone `hooks.json`). Schema:

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "regex_pattern",
        "sequential": true,
        "hooks": [
          {
            "name": "hook-name",
            "type": "command",
            "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/script.sh",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "name": "stop-hook",
            "type": "command",
            "command": "python3 $GEMINI_PROJECT_DIR/hooks/stop_hook.py",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### Output schema differences vs Claude Code

`BeforeTool` blocking output uses `"decision": "deny"` in Gemini CLI vs `"decision": "block"` in Claude Code's `PreToolUse`. The existing `rule_runner.py` outputs Claude Code format — it needs adaptation for Gemini CLI.

`SessionEnd` (the Stop analog) supports `systemMessage` output. The existing `stop_hook.py`'s `systemMessage` output field is compatible.

### The CLAUDE_PLUGIN_ROOT problem

The same env-var portability fix planned for Codex applies here:

```python
PLUGIN_ROOT = os.environ.get('CLAUDE_PLUGIN_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
```

`CLAUDE_PLUGIN_ROOT` will not be set in a Gemini CLI session. `GEMINI_PROJECT_DIR` is the Gemini equivalent.

---

## Q5: Minimal Viable Approach for Gemini CLI Support

**Given the June 18 deprecation, the correct answer is: target Antigravity CLI, not Gemini CLI.**

### What's already covered by the Codex work

| Component | Codex plan | Gemini CLI / Antigravity status |
|-----------|-----------|--------------------------------|
| `.agents/skills/` (6 files) | Creating | **Fully shared — no additional work** |
| `AGENTS.md` (repo root rewrite) | Creating | Requires `.gemini/settings.json` opt-in to be visible in Gemini CLI; invisible by default. In Antigravity: works unchanged. |
| `hooks/rule_runner.py` PLUGIN_ROOT fix | 1-line fix | **Same fix covers Gemini CLI** |
| `hooks/stop_hook.py` PLUGIN_ROOT fix | 1-line fix | **Same fix covers Gemini CLI** |

### What is additional for Gemini CLI (current, not Antigravity)

If targeting Gemini CLI specifically (enterprise users on the June-18 cutoff boundary):

1. **`GEMINI.md` at repo root** — A GEMINI.md parallel to AGENTS.md. Without it, Gemini CLI users see no context. Alternatively, document the settings.json one-liner to add AGENTS.md support.

2. **`.gemini/settings.json`** — Hook configuration for Gemini CLI. Contains `SessionEnd` (Stop analog) and `BeforeTool` (PreToolUse analog) entries. Uses different env var (`$GEMINI_PROJECT_DIR`).

3. **`rule_runner_gemini.py`** — The existing `rule_runner.py` outputs `"decision": "block"` for PreToolUse, but Gemini CLI's BeforeTool expects `"decision": "deny"`. Either a fork or a platform-detection branch is needed.

### What is additional for Antigravity CLI (recommended target)

Antigravity CLI launched 2026-05-19. Docs are still sparse. Based on migration guide findings:

1. **Nothing additional if targeting Codex + Antigravity** — `.agents/skills/` is the canonical path. AGENTS.md works. Hooks fire on same lifecycle events. The planned Codex work covers Antigravity compatibility.

2. **Risk:** Antigravity hook schema compatibility is stated but not yet independently verified against the new Go binary. Flag for validation once Antigravity CLI docs stabilize.

---

## Q6: Is .agents/skills/ Shared Between Codex and Gemini/Antigravity?

**Confidence: HIGH**

Yes, unambiguously. The `.agents/skills/` path is the Agent Skills open standard path, adopted by:
- Codex CLI (canonical project path per official docs)
- Gemini CLI (alias that takes precedence over `.gemini/skills/`)
- Antigravity CLI (mandatory migration target from `.gemini/skills/`)

The SKILL.md format (YAML frontmatter with `name` + `description`, markdown body) is identical across all three platforms. The 6 skill files created for Codex require zero modifications to work in Gemini CLI and Antigravity CLI.

**The only behavioral difference:** invocation model. Codex uses `$skill-name`. Gemini/Antigravity uses agent-internal `activate_skill` + user confirmation. This does not affect the SKILL.md files themselves — it affects user documentation only.

---

## Summary: Additional Work for Gemini CLI vs Codex Plan

| Item | Codex | Gemini CLI (current) | Antigravity (recommended) |
|------|-------|---------------------|--------------------------|
| `.agents/skills/` (6 files) | Creating | Shared, no extra work | Shared, no extra work |
| `AGENTS.md` rewrite | Creating | Requires settings.json opt-in | Works out-of-box |
| `GEMINI.md` | Not needed | NEW file needed | Not needed (AGENTS.md works) |
| `.codex/hooks.json` | Creating | Not applicable | Not applicable |
| `.gemini/settings.json` | Not needed | NEW file needed | Unclear (Antigravity may use different path) |
| `rule_runner.py` decision field | `"block"` (Claude Code) | Needs `"deny"` adaptation | Likely `"deny"` (same as Gemini CLI) |
| `stop_hook.py` PLUGIN_ROOT fix | 1-line, shared | Same fix | Same fix |
| README Gemini section | — | Add if targeting | Add, note Antigravity migration |

**Net additional scope for Gemini CLI specifically:** 1 new file (GEMINI.md), 1 new file (.gemini/settings.json), 1 adapted rule_runner variant or branch. Low effort but short useful lifetime.

**Net additional scope for Antigravity CLI:** ~0, pending doc verification. The Codex work already covers it structurally.

---

## Recommendation

**Do not add a Gemini CLI-specific phase to v1.3.**

Instead:
1. Note in README that the `.agents/skills/` files work in Gemini CLI and Antigravity CLI (no extra setup for skills).
2. Note that Gemini CLI users need a one-line `settings.json` change to enable AGENTS.md reading, or can create a GEMINI.md symlink.
3. Track Antigravity CLI docs (they launched 4 days ago) — if hook schema is confirmed compatible, add a README Antigravity section in v1.4 with zero new files.
4. If enterprise Gemini CLI support is explicitly requested, the total additional work is: 1 GEMINI.md, 1 .gemini/settings.json, 1 rule_runner adaptation — approximately 1 small phase.

---

## Sources

- GEMINI.md spec: https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html [HIGH]
- Skills directory and activate_skill: https://geminicli.com/docs/cli/skills/ [HIGH]
- activate_skill tool docs: https://geminicli.com/docs/tools/activate-skill/ [HIGH]
- Creating skills (SKILL.md format): https://geminicli.com/docs/cli/creating-skills/ [HIGH]
- Hooks reference: https://geminicli.com/docs/hooks/reference/ [HIGH]
- Hooks overview: https://geminicli.com/docs/hooks/ [HIGH]
- Writing hooks (output schema): https://geminicli.com/docs/hooks/writing-hooks/ [HIGH]
- AGENTS.md not in default fileName issue (closed): https://github.com/google-gemini/gemini-cli/issues/12345 [HIGH]
- Gemini CLI deprecation announcement: https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ [HIGH]
- Antigravity migration guide: https://agentpedia.codes/blog/gemini-cli-to-antigravity-cli-migration [MEDIUM]
- Antigravity launch (TechCrunch): https://techcrunch.com/2026/05/19/google-launches-antigravity-2-0-with-an-updated-desktop-app-and-cli-tool-at-io-2026/ [HIGH]
- AGENTS.md discussion in Gemini CLI: https://github.com/google-gemini/gemini-cli/discussions/1471 [MEDIUM]
- Skills storage paths: https://www.agensi.io/learn/where-are-gemini-cli-skills-stored [MEDIUM]
