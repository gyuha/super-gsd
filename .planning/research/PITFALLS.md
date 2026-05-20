# Pitfalls Research — v1.3 Codex Platform Support

**Domain:** Claude Code plugin — cross-platform adaptation to OpenAI Codex
**Researched:** 2026-05-21
**Scope:** Adding Codex environment support (AGENTS.md, .codex/skills/, README section) to existing super-gsd plugin
**Confidence:** HIGH (official Codex docs), MEDIUM (migration patterns from practitioner sources)

---

## Critical Pitfalls

### Pitfall 1: SubagentStop has no Codex equivalent — the core hook is a dead letter

**What goes wrong:** `stop_hook.py` fires on both `Stop` and `SubagentStop` in Claude Code. `SubagentStop` is the hook that detects Superpowers' review completion and nudges the user toward sg-retro. Codex has a `Stop` event, but **no `SubagentStop`**. The entire review-complete → retro transition signal disappears silently in Codex.

**Why it happens:** Claude Code's subagent model is interactive — a parent agent observes reasoning in real-time and `SubagentStop` fires when the child finishes. Codex subagents return summaries to a main thread; there is no lifecycle callback for "subagent finished." Codex docs confirm: only `SessionStart`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `UserPromptSubmit`, `Stop` exist.

**Consequences:**
- Super-gsd's review-complete → retro nudge does not fire in Codex
- User gets zero guidance to run sg-retro after Superpowers review
- The core value proposition (automatic stage handoff) loses its most important trigger

**Prevention:** Do not claim AGENTS.md-only or `.codex/skills/`-only approaches preserve the hook behavior. They don't. The Codex-targeted docs must explicitly state: "In Codex, there is no automatic post-review nudge. After Superpowers review, manually invoke sg-retro." Do not paper over this gap with vague language. This is a hard architectural limitation, not a configuration issue.

**Detection:** User runs Superpowers review in Codex, no sg-retro prompt appears. Assumed working because no error was thrown.

**Phase:** Phase 1 (AGENTS.md) — must document clearly. Phase 2 (.codex/skills/) — do not attempt to replicate hook behavior with a skill workaround; it will be misleading.

---

### Pitfall 2: `${CLAUDE_PLUGIN_ROOT}` is undefined in Codex — all hook paths silently fail

**What goes wrong:** `hooks.json` uses `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.py"`. The env variable `CLAUDE_PLUGIN_ROOT` is injected by Claude Code's plugin loader. In Codex, this variable does not exist. If a user tries to register the hooks manually in `.codex/config.toml`, every hook command expands to `python3 "/hooks/rule_runner.py"` and fails with file-not-found.

**Why it happens:** Plugin root injection is a Claude Code-specific mechanism. Codex's hook configuration in `~/.codex/config.toml` or `.codex/config.toml` (TOML format) requires absolute paths or paths relative to a known anchor. No equivalent of `CLAUDE_PLUGIN_ROOT` is provided.

**Consequences:**
- Any attempt to transplant `hooks.json` to Codex produces silent failures
- `rule_runner.py` (PreToolUse hook for lesson rules) does not fire
- If a user copies hooks.json verbatim to `.codex/hooks.json`, all three hooks fail without error messages visible to the user

**Prevention:** AGENTS.md and `.codex/` artifacts must never reference `${CLAUDE_PLUGIN_ROOT}`. For any Codex-targeted hook configuration: use `$HOME`-relative paths or document that the user must substitute the absolute path at install time. More practically: do not provide a Codex hooks.json at all in v1.3. Hook transplantation is out of scope without a proper install script.

**Phase:** Phase 2 (.codex/skills/) — if any hook files are provided for Codex, they must be clearly labeled "requires path substitution." Phase 1 (AGENTS.md) — AGENTS.md should not reference hook files.

---

### Pitfall 3: Codex has no native custom slash commands — sg- commands do not exist as typed commands

**What goes wrong:** In Claude Code, `sg-execute`, `sg-plan`, `sg-retro` etc. are slash commands registered via `plugin.json` → command files. In Codex, the equivalent is custom prompts (now **deprecated**) or skills. Codex's built-in slash commands are fixed: `/model`, `/review`, `/skills`, `/hooks` etc. A user typing `/sg-execute` in Codex gets "command not found."

**Why it happens:** Codex has no mechanism for registering custom Markdown-based slash commands via a plugin manifest. The `plugin.json` `commands:` array is a Claude Code construct. Codex's `/prompts:` system existed but was deprecated in favor of skills.

**Consequences:**
- Every AGENTS.md instruction that says "run `/sg-execute`" produces user confusion
- Users attempting to follow Claude Code workflow steps in Codex hit dead ends immediately
- If AGENTS.md is written from Claude Code vocabulary (slash commands) it is actively misleading in Codex

**Prevention:** AGENTS.md must use Codex vocabulary exclusively — reference skill names (`$sg-execute` style or `@sg-execute`) or plain English ("ask Codex to execute the current phase"). Do not copy-paste Claude Code slash command instructions into AGENTS.md. The command vocabulary section must be Codex-native.

**Phase:** Phase 1 (AGENTS.md) — highest risk area. All command references need Codex-native reformulation.

---

### Pitfall 4: AGENTS.md byte limit silently truncates instructions at 32 KiB

**What goes wrong:** AGENTS.md has a hard cap of **32 KiB** by default (`project_doc_max_bytes`). super-gsd's full workflow includes sg-retro (6 lenses), state machine logic, lessons ranking rationale, hook behavior explanations, and 13+ command descriptions. If the AGENTS.md for Codex naively mirrors CLAUDE.md or the full project context, it will exceed 32 KiB and be silently truncated mid-instruction.

**Why it happens:** Codex reads AGENTS.md "once per session" and caps total instruction bytes. The cap is configurable but most users won't override it. Truncation happens without warning to the user or author — the instruction chain is simply cut off.

**Consequences:**
- Instructions after the truncation point are never seen by Codex
- If the truncation cuts mid-way through a command list, some sg-* skills appear undefined
- Critical constraints (non-invasive, append-only HANDOFF) silently absent from context

**Prevention:** AGENTS.md for Codex must be written as a *summary reference*, not a full specification. Target ≤ 8 KiB. Key information: what the workflow is, which skills exist and when to invoke them, where state files live, and what not to modify. Link to `.codex/skills/` for full per-command instructions. Never paste PLAN.md bodies or lesson rule text into AGENTS.md.

**Phase:** Phase 1 (AGENTS.md) — structure decision. AGENTS.md must be intentionally minimal.

---

### Pitfall 5: sg-execute invokes `superpowers:executing-plans` Skill — undefined in Codex

**What goes wrong:** `sg-execute.md` step 9 ends with `Skill(skill="superpowers:executing-plans", args=...)`. Superpowers is a Claude Code plugin. In Codex, there is no Superpowers plugin, no `executing-plans` skill, and no `Skill()` invocation syntax. The entire execution handoff mechanism is Claude Code-specific.

**Why it happens:** Superpowers is not ported to Codex. The tool call `Skill(skill=...)` is a Claude Code API construct. Codex has its own skill invocation via `$skill-name` in prompts or implicit matching, but these are different mechanisms.

**Consequences:**
- `.codex/skills/sg-execute` cannot replicate the actual behavior of `sg-execute.md`
- A Codex-adapted sg-execute would be a degraded stub: it can prepare the plan prompt but cannot invoke Superpowers
- If the Codex skill pretends to do the full handoff, users will assume Superpowers ran when it didn't

**Prevention:** Codex-adapted sg-execute in `.codex/skills/` must be explicitly a *manual prompt helper* — it assembles the plan context and tells the user "paste this into Codex to execute." It must not claim to be a full replacement. Name it clearly: "sg-execute-codex" or label it "(Codex — manual prompt variant)."

**Phase:** Phase 2 (.codex/skills/) — each adapted skill must document its degradation vs. the Claude Code original.

---

## Moderate Pitfalls

### Pitfall 6: Codex skills live in `.agents/skills/`, not `.codex/skills/`

**What goes wrong:** The milestone target document specifies `.codex/skills/` as the skill directory. Codex's actual skill discovery order is: `.agents/skills/` (cwd), parent directories' `.agents/skills/`, `$REPO_ROOT/.agents/skills/`, `$HOME/.agents/skills/`. The `.codex/` directory is for configuration (config.toml, hooks.json), not skills.

**Why it happens:** The directory name intuition `.codex/skills/` sounds correct but is not an official Codex path. Official docs confirm only `.agents/skills/` hierarchy for skill discovery.

**Consequences:**
- Skills placed in `.codex/skills/` are invisible to Codex's auto-discovery
- User sees no sg-* skills in `/skills` list despite files existing
- Time lost debugging why skills "don't appear" when the location is simply wrong

**Prevention:** Use `.agents/skills/` for all Codex skills. The `.codex/` directory is for `config.toml` and `hooks.json` only. Update the milestone target before implementation begins.

**Phase:** Phase 2 planning — catch before any files are created.

---

### Pitfall 7: AGENTS.md instruction chain rebuilds every session — no persistent HANDOFF.md awareness

**What goes wrong:** AGENTS.md is read "once per run." Codex has no mechanism to inject dynamic content (current HANDOFF.md state, current phase) into the AGENTS.md context automatically. Claude Code's stop_hook.py reads `.planning/HANDOFF.md` at runtime and generates context-specific guidance. In Codex, AGENTS.md is static.

**Why it happens:** AGENTS.md is a static file. Codex's `Stop` hook can inject a `systemMessage`, but it receives no equivalent of Claude Code's `${CLAUDE_PLUGIN_ROOT}` context. Writing a Codex hook that reads HANDOFF.md is possible but requires a functioning hooks setup (see Pitfall 2).

**Consequences:**
- AGENTS.md can describe the workflow but cannot tell the user "you are on Phase 3, Stage superpowers"
- Users must know their current state from `.planning/HANDOFF.md` themselves
- The session continuity that sg-start/sg-status provides in Claude Code is absent in Codex

**Prevention:** AGENTS.md must instruct the user to manually check `.planning/HANDOFF.md` and `.planning/STATE.md` for current state. Include a one-line bash command in AGENTS.md for quick state check. Do not promise dynamic context injection — it requires a working Codex hooks setup.

**Phase:** Phase 1 (AGENTS.md) — state-check instructions must be explicit and manual.

---

### Pitfall 8: Two-platform divergence accelerates as sg-* commands evolve

**What goes wrong:** sg-execute.md is updated in Claude Code (e.g., new idempotency logic, new HANDOFF column). The `.agents/skills/sg-execute/SKILL.md` for Codex is a static copy from the day it was authored. Now they describe different behavior. Users with both environments get inconsistent results.

**Why it happens:** There is no shared source-of-truth mechanism. GSD handles this by maintaining a canonical codebase and running a convert-at-install translation pipeline. super-gsd v1.3 has no such pipeline — it will author Codex files by hand.

**Consequences:**
- Every Claude Code change requires a manual matching update to the Codex skills
- Divergence is invisible until a user files a bug: "this doesn't work in Codex"
- At 13 commands + sg-retro skill + 6 lenses, the delta surface is large

**Prevention:**
- Minimize Codex skill content. Each `.agents/skills/sg-*/SKILL.md` should describe *what the command achieves* (goal, inputs, outputs) not *how to implement it* (no inline bash, no regex). This way, the implementation diverges but the contract stays in sync.
- Add a comment block at the top of each Codex skill: `<!-- Codex adaptation of commands/sg-<name>.md — update this file when the Claude Code command changes -->` so drift is at least flagged.
- Explicitly mark v1.3 as "documentation-first Codex support." Do not promise behavior parity.

**Phase:** Cross-cutting — maintenance strategy must be decided before Phase 2 authoring.

---

### Pitfall 9: `.planning/` relative path assumptions break when Codex cwd differs

**What goes wrong:** Every sg-* command uses relative paths: `.planning/HANDOFF.md`, `.planning/STATE.md`, `.planning/config.json`. In Claude Code, the plugin executes with cwd at project root (same issue documented in v1.1 CC-3). In Codex, `codex exec` or a subagent may run from a subdirectory or a temp working directory. Relative paths fail silently.

**Why it happens:** Codex's `codex exec` subcommand and subagent model have independent working directories. The Codex skill invocation inherits whatever cwd Codex was launched from — not necessarily the git root.

**Consequences:**
- `.agents/skills/sg-*/SKILL.md` bash blocks fail with "No such file or directory" when run from non-root
- HANDOFF.md is not found; skill falls back to `init` state silently
- Errors look like missing files rather than wrong cwd, making debugging harder

**Prevention:** All Codex skill bash blocks should resolve project root via `git rev-parse --show-toplevel` before any `.planning/` access:
```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || PROJECT_ROOT="."
HANDOFF="$PROJECT_ROOT/.planning/HANDOFF.md"
```
This is the same fix as CC-3 in v1.1. Apply it systematically to all Codex skills.

**Phase:** Phase 2 (.codex/skills/) — apply to all bash blocks in Codex skills.

---

### Pitfall 10: Over-engineering Codex skills as full Claude Code behavior replicas

**What goes wrong:** The impulse is to port all 13 sg-* commands as full `.agents/skills/` with complete bash blocks, idempotency logic, HANDOFF.md writes, phase resolution, lessons ranking, etc. The result is 13 × 100-200 lines of Codex-specific bash that is immediately stale, partially broken (no SubagentStop, no Superpowers skill), and maintenance-heavy.

**Why it happens:** The natural instinct when adding platform support is to achieve parity. But parity is impossible here — hooks are missing, Superpowers is missing, the command system is different. Full-parity attempts hide the gaps behind complexity instead of surfacing them honestly.

**Consequences:**
- Users believe they have full super-gsd in Codex but are silently missing the most important behaviors
- Maintenance burden is 2× immediately, heading toward abandonment of Codex files
- Bug reports for "Codex version" are impossible to triage because the bash logic is duplicated

**Prevention:** The correct Codex support scope for v1.3 is:
1. **AGENTS.md** — workflow overview, state file locations, skill reference list, manual state check command
2. **`.agents/skills/`** — light-wrapper skills that generate the right *prompts* but delegate execution to Codex's native agent loop, not replicate Claude Code's bash
3. **README Codex section** — explicit capability table: what works, what is degraded, what is absent

Do not port lessons_ranker.py, rule_runner.py, stop_hook.py to Codex in v1.3.

**Phase:** Planning decision — scope must be fixed before authoring begins.

---

## Minor Pitfalls

### Pitfall 11: AGENTS.md placed in repo root conflicts with project-level AGENTS.md

**What goes wrong:** super-gsd ships an AGENTS.md file in the repo root. When a user clones super-gsd itself as a project to develop, Codex reads this AGENTS.md and applies super-gsd's own workflow guidance to super-gsd development. This is correct. But when super-gsd is *installed as a plugin* into another project, the AGENTS.md in the super-gsd plugin directory is not at that project's root — Codex won't discover it automatically.

**Why it happens:** AGENTS.md discovery is cwd-upward from the user's current directory. A plugin installed at `~/.claude/plugins/super-gsd/` is not on the cwd-upward path.

**Consequences:**
- AGENTS.md in the plugin directory is never read by Codex in normal usage
- Users must manually copy or symlink AGENTS.md to their project root

**Prevention:** README must explain: "To use super-gsd guidance in Codex, copy `.agents/AGENTS.md` to your project root or add a `[project_doc_fallback_filenames]` entry in your Codex config." Do not assume AGENTS.md auto-discovery for installed plugins.

**Phase:** Phase 3 (README) — documentation clarity.

---

### Pitfall 12: Codex `Stop` hook can auto-continue — different semantics from Claude Code `Stop`

**What goes wrong:** Claude Code's `Stop` hook outputs a `systemMessage` to display guidance and the session stops. Codex's `Stop` hook can return `decision: "block"` to *automatically continue* the session with the stop reason as a new prompt. A naive port of stop_hook.py that returns the `systemMessage` guidance text in a `block` decision would cause Codex to treat the guidance as a user prompt and start a new agent turn — executing workflow steps the user didn't request.

**Why it happens:** The semantics of `Stop` differ: Claude Code's stop hook is purely advisory (display a message), Codex's stop hook can be loop-continuing. Same JSON field names, different behavior on specific output patterns.

**Consequences:**
- If anyone ports stop_hook.py to Codex and uses `decision: "block"`, it may trigger unintended automatic task execution
- Silent behavior divergence that looks correct (guidance shown) but acts wrong (session continues)

**Prevention:** For any Codex stop hook, always use `decision: "pass"` or no decision field. Never use `decision: "block"` for guidance-only messages. Document this difference prominently if providing a Codex hooks template.

**Phase:** If hooks are provided — Phase 2 or later. For v1.3 scope (no hooks), note in README.

---

### Pitfall 13: Codex `UserPromptSubmit` hook has no Claude Code equivalent — rule_runner scope gap

**What goes wrong:** The migration research note in `PROJECT.md` confirms: "rule_runner.py prompt 이벤트 미지원 — PreToolUse hook 아키텍처 제약 — prompt submit 이벤트는 Claude Code PreToolUse로 캐치 불가." Ironically, Codex *does* have `UserPromptSubmit`. This creates a gap in the other direction: if super-gsd eventually adds prompt-level rule checks in Claude Code, the Codex hook could fire them — but the current Claude Code version cannot. Authors may mistakenly add Codex-only functionality and not notice the asymmetry.

**Prevention:** Keep rule_runner.py out of Codex scope entirely in v1.3. Flag in README: "Prompt-level rule hooks are not implemented in this release."

**Phase:** Future — not v1.3 scope.

---

## Phase-Specific Warning Table

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| AGENTS.md authoring | Uses Claude Code slash command syntax (`/sg-execute`) | CRITICAL | Rewrite all command references in Codex vocabulary |
| AGENTS.md size | Exceeds 32 KiB from full workflow documentation | HIGH | Target ≤ 8 KiB; link to `.agents/skills/` for detail |
| AGENTS.md discovery | Plugin AGENTS.md not auto-discovered when installed | MEDIUM | Explain manual copy/symlink in README |
| `.codex/skills/` location | Skills placed in `.codex/skills/` instead of `.agents/skills/` | HIGH | Use `.agents/skills/` — Codex discovery only scans `.agents/skills/` |
| Codex skill — sg-execute | Claims to invoke Superpowers, which does not exist in Codex | CRITICAL | Explicit "manual prompt assistant" framing, not a Superpowers replacement |
| Codex skill — review→retro | Implies SubagentStop hook fires after review, which it cannot | CRITICAL | Remove any implication of automatic post-review nudge |
| Codex skill — hooks | References `${CLAUDE_PLUGIN_ROOT}` which is undefined | HIGH | No hook file in v1.3; document separately |
| Codex skill — paths | Relative `.planning/` paths fail in non-root cwd | HIGH | Use `git rev-parse --show-toplevel` as path anchor |
| README Codex section | Presents Codex and Claude Code as feature-equivalent | HIGH | Explicit capability delta table: works / degraded / absent |
| Scope creep | Full bash-parity skills for all 13 commands | HIGH | Scope = prompt-helper skills only, not behavior replicas |
| Codex Stop hook | `decision: "block"` causes unintended loop-continue | MEDIUM | Always use `decision: "pass"` for advisory messages |
| Maintenance drift | Codex skills diverge silently as Claude Code commands evolve | MEDIUM | Canonical source comment in each Codex skill file |

---

## Cross-Cutting: Honest Capability Statement

The most dangerous pitfall is not technical — it is documentation that implies feature equivalence when none exists. The honest capability delta for Codex vs. Claude Code:

| Feature | Claude Code | Codex |
|---------|------------|-------|
| sg-* commands as slash commands | Native (plugin.json) | Not available; skills only |
| Automatic post-plan nudge (Stop hook) | Yes | Possible with hooks setup |
| Automatic post-review nudge (SubagentStop) | Yes | **Not possible — no SubagentStop** |
| Superpowers:executing-plans invocation | Native | Not possible — Superpowers not ported |
| Rule enforcement (rule_runner.py PreToolUse) | Yes | Possible with hooks setup |
| Lessons ranking reminder at sg-plan/sg-execute | Yes (automatic) | Manual (user must ask) |
| sg-retro 6-lens retrospective | Full skill | Portable as `.agents/skills/sg-retro` |
| .planning/STATE.md + HANDOFF.md state tracking | Full | Manual inspection only |
| sg-health diagnostics | Full Claude Code plugin check | Codex-specific version needed |

Producing documentation that covers up the "Not possible" cells is the highest-severity pitfall in this entire milestone.

---

## Sources

- [Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md) — official, HIGH confidence
- [Codex Hooks Documentation](https://developers.openai.com/codex/hooks) — official, HIGH confidence
- [Codex Agent Skills](https://developers.openai.com/codex/skills) — official, HIGH confidence
- [Codex CLI Slash Commands](https://developers.openai.com/codex/cli/slash-commands) — official, HIGH confidence
- [Codex Custom Prompts (deprecated)](https://developers.openai.com/codex/custom-prompts) — official, HIGH confidence
- [Codex Config Reference](https://developers.openai.com/codex/config-reference) — official, HIGH confidence
- [Codex Subagents](https://developers.openai.com/codex/concepts/subagents) — official, HIGH confidence
- [Migration: Claude Code → Codex CLI](https://codex.danielvaughan.com/2026/03/26/migrating-claude-code-to-codex-cli/) — practitioner, MEDIUM confidence
- [Codex vs Claude Code Comparison](https://www.builder.io/blog/codex-vs-claude-code) — MEDIUM confidence
