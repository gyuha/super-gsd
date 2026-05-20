# Antigravity CLI Hook Schema Research

**Researched:** 2026-05-21
**Domain:** Antigravity CLI (Google's successor to Gemini CLI, launched 2026-05-19)
**Overall Confidence:** MEDIUM — official antigravity.google/docs pages returned empty content; findings derived from the Gemini CLI hooks reference (geminicli.com/docs/hooks/reference/), the migration guide, and the GitHub issue tracker.

---

## Summary

Google replaced Gemini CLI with Antigravity CLI at Google I/O 2026 (May 19). The migration guide explicitly states: "JSON hooks (same format)" and "JSON hooks fire. If you authored JSON hooks against Antigravity 2.0 or Gemini CLI, they apply in Antigravity CLI on the same lifecycle moments." The hook schema is therefore the Gemini CLI schema carried forward intact.

The five questions below are answered in order, followed by a compatibility analysis for `stop_hook.py` and `rule_runner.py`.

---

## 1. Hook Events Supported

**Confidence: MEDIUM** [CITED: geminicli.com/docs/hooks/reference/]

Antigravity CLI (via the Gemini CLI lineage) supports 11 named hook events:

| Category | Event Name | When it fires |
|---|---|---|
| Tool | `BeforeTool` | Before any tool execution (intercept/validate/modify) |
| Tool | `AfterTool` | After tool execution (process results, logging) |
| Agent | `BeforeAgent` | Before agent loop starts |
| Agent | `AfterAgent` | After agent loop completes |
| Model | `BeforeModel` | Before LLM request sent |
| Model | `BeforeToolSelection` | Before tool selection step |
| Model | `AfterModel` | After LLM response received |
| Lifecycle | `SessionStart` | When session starts (`source`: "startup" / "resume" / "clear") |
| Lifecycle | `SessionEnd` | When session ends (`reason`: "exit" / "clear" / "logout" / "prompt_input_exit" / "other") |
| Lifecycle | `Notification` | On error/warning/info notification events |
| Lifecycle | `PreCompress` | Before chat history compression (`trigger`: "auto" / "manual") |

### SubagentStop equivalent

There is **no `SubagentStop` event** in Antigravity CLI's schema. The closest equivalent is `AfterAgent`, which fires when an agent loop completes. For subagent orchestration, the `AfterAgent` event receives `stop_hook_active` in its payload, indicating when a Stop hook is already active.

Claude Code's `SubagentStop` has no direct counterpart here. If this project needs to detect subagent completion in Antigravity CLI, `AfterAgent` is the mapping — but it is not scoped to "subagent" specifically.

---

## 2. Configuration File Format and Location

**Confidence: MEDIUM** [CITED: geminicli.com/docs/hooks/reference/, geminicli.com/docs/reference/configuration/]

### File locations

Hooks are defined in `settings.json`:

- **User-level:** `~/.gemini/settings.json`
- **Project-level:** `.gemini/settings.json` (project root)

The directory name is `.gemini`, not `.antigravity` or `.agents`. The migration guide does not indicate this path changed. [ASSUMED: path remains `.gemini/` in Antigravity CLI — not confirmed by official antigravity.google docs directly.]

### Format

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "command": "python3 /path/to/hook.py"
      }
    ],
    "AfterTool": [],
    "BeforeAgent": [],
    "AfterAgent": [],
    "SessionStart": [],
    "SessionEnd": [],
    "Notification": [],
    "PreCompress": [],
    "BeforeModel": [],
    "AfterModel": [],
    "BeforeToolSelection": []
  }
}
```

Each event key maps to an array of hook command objects.

---

## 3. Decision Field for Blocking Tool Use

**Confidence: MEDIUM** [CITED: geminicli.com/docs/hooks/reference/]

### Two mechanisms exist:

**Option A — Exit code (simpler):**
- Exit with code `2` → System Block. `stderr` content is used as the rejection reason.
- Exit with code `0` → Success; stdout parsed as JSON.
- Any other exit code → Warning (non-fatal, CLI continues).

**Option B — JSON response field:**
- Field name: `decision`
- Blocking values: `"deny"` or `"block"` (documented as aliases)
- Paired with: `"reason"` field (explanation string)

```json
{
  "decision": "deny",
  "reason": "Tool execution not permitted by security policy"
}
```

Alternatively, using `hookSpecificOutput`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by security policy"
  }
}
```

Both forms are documented. The `decision` field at the top level is the simpler form; `hookSpecificOutput.permissionDecision` is the verbose form.

---

## 4. Stop Hook (Session End) Equivalent

**Confidence: MEDIUM** [CITED: geminicli.com/docs/hooks/reference/]

Yes. The `SessionEnd` event is the session-end equivalent. It fires on:
- Normal exit (`"exit"`)
- Session clear (`"clear"`)
- Logout (`"logout"`)
- Prompt input exit (`"prompt_input_exit"`)
- Other reasons (`"other"`)

The stdin payload for `SessionEnd` includes the base fields plus `reason`.

There is no separate "Stop" event named as such. `AfterAgent` is the agent-loop-end event; `SessionEnd` is the process/session-end event.

---

## 5. Hook Invocation Format — stdin/stdout Compatibility

**Confidence: MEDIUM** [CITED: geminicli.com/docs/hooks/reference/]

### stdin (input to hook process)

Base payload (all events):

```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "string",
  "timestamp": "string"
}
```

Event-specific additional fields:

| Event | Additional stdin fields |
|---|---|
| `BeforeTool` | `tool_name`, `tool_input`, `mcp_context`, `original_request_name` |
| `AfterTool` | `tool_name`, `tool_input`, `tool_response`, `mcp_context`, `original_request_name` |
| `BeforeAgent` | `prompt` |
| `AfterAgent` | `prompt`, `prompt_response`, `stop_hook_active` |
| `SessionEnd` | `reason` |
| `SessionStart` | `source` |
| `Notification` | `notification_type`, `message`, `details` |
| `PreCompress` | `trigger` |

### stdout (output from hook process)

```json
{
  "systemMessage": "string",
  "suppressOutput": "boolean",
  "continue": "boolean",
  "stopReason": "string",
  "decision": "string",
  "reason": "string",
  "hookSpecificOutput": {}
}
```

`hookSpecificOutput` per event:

| Event | Field | Purpose |
|---|---|---|
| `BeforeTool` | `hookSpecificOutput.tool_input` | Override/merge tool arguments |
| `AfterTool` | `hookSpecificOutput.additionalContext` | Append to tool result |
| `AfterTool` | `hookSpecificOutput.tailToolCallRequest` | Chain another tool call `{name, args}` |

---

## Compatibility Analysis: stop_hook.py and rule_runner.py

### stop_hook.py

Currently registered as Claude Code's `Stop`/`SubagentStop` hook. The script:
- Reads `transcript_path` from stdin — **compatible**: Antigravity's `SessionEnd` stdin contains `transcript_path`.
- Reads `session_id` — **compatible**: present in base payload.
- Outputs `{"systemMessage": "..."}` — **compatible**: `systemMessage` is a valid stdout field.
- Outputs `{}` for no-op — **compatible**: empty object is valid.

**Gap:** The script is registered for `Stop`/`SubagentStop` events (Claude Code terminology). To work in Antigravity CLI it must be re-registered under `SessionEnd` (and optionally `AfterAgent` for subagent detection). No code changes needed, only `settings.json` registration changes.

### rule_runner.py

Currently registered as Claude Code's `PreToolUse` hook. The script:
- Reads `tool_name` and `tool_input` from stdin — **compatible**: `BeforeTool` payload includes exactly these fields.
- Outputs `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny"}, "systemMessage": "..."}` — **partially compatible**: Antigravity uses `decision: "deny"` at the top level or `hookSpecificOutput.permissionDecision`. The current output uses `hookSpecificOutput.permissionDecision: "deny"` which matches the verbose form.

**Note on `hookEventName`:** The current output hardcodes `"hookEventName": "PreToolUse"` inside `hookSpecificOutput`. Antigravity's event name for the equivalent hook is `"BeforeTool"`. This field may need updating if Antigravity validates it. [ASSUMED: whether this field is validated or ignored is not confirmed by official docs.]

**Net assessment:** Both scripts require re-registration under Antigravity event names (`SessionEnd`, `BeforeTool`) rather than Claude Code names (`Stop`/`SubagentStop`, `PreToolUse`). The Python logic itself is compatible with the Antigravity stdin schema. The `hookEventName: "PreToolUse"` string inside `rule_runner.py`'s output block may need to change to `"BeforeTool"` if that field is validated.

---

## Confidence Summary

| Question | Confidence | Source |
|---|---|---|
| Hook event list | MEDIUM | geminicli.com/docs/hooks/reference/ (Gemini CLI docs, confirmed carried over) |
| SubagentStop equivalent | MEDIUM | No SubagentStop found in any Antigravity doc; AfterAgent is the closest mapping |
| Config file location `.gemini/settings.json` | MEDIUM | Gemini CLI docs; assumed unchanged, not confirmed by antigravity.google directly |
| `decision: "deny"` for block | MEDIUM | geminicli.com/docs/hooks/reference/ |
| SessionEnd as Stop equivalent | MEDIUM | geminicli.com/docs/hooks/reference/ |
| stdin/stdout format compatibility | MEDIUM | Gemini CLI docs + migration guide "same format" statement |

**What would elevate these to HIGH:**
1. Direct access to `antigravity.google/docs/cli-hooks` (the page returned empty content during research — likely requires login or is not yet indexed).
2. A GitHub release diff between `google-gemini/gemini-cli` and `google-antigravity/antigravity-cli` showing the hook handler code.
3. Manual test: register a minimal `SessionEnd` hook against `agy` CLI and observe it firing.

---

## Open Questions Requiring Manual Verification

1. **Config directory name:** Is it still `.gemini/settings.json` or renamed to `.antigravity/settings.json`? The migration guide says "same format" but does not confirm the path.
2. **`hookEventName` field validation:** Does Antigravity CLI reject or ignore `"hookEventName": "PreToolUse"` when the actual event is `BeforeTool`? If validated, `rule_runner.py` needs a one-line fix.
3. **`AfterAgent` scope:** Does `AfterAgent` fire for every sub-agent in a multi-agent tree, or only the root agent? This determines whether it can substitute for Claude Code's `SubagentStop`.
4. **`transcript_path` in `SessionEnd`:** Confirmed in base payload schema, but manual verification that the file is flushed/complete before `SessionEnd` fires is needed for `stop_hook.py` reliability.

---

## Sources

- [Transitioning Gemini CLI to Antigravity CLI — Google Developers Blog](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
- [Hooks reference — Gemini CLI docs](https://geminicli.com/docs/hooks/reference/)
- [Gemini CLI configuration reference](https://geminicli.com/docs/reference/configuration/)
- [Gemini CLI → Antigravity migration guide](https://agentpedia.codes/blog/gemini-cli-to-antigravity-cli-migration)
- [Antigravity CLI Deep Dive (May 2026)](https://agentpedia.codes/blog/antigravity-cli-deep-dive)
- [Google I/O 2026 Developer Highlights](https://blog.google/innovation-and-ai/technology/developers-tools/google-io-2026-developer-highlights/)
- [feat: add block-no-verify BeforeTool hook — gemini-cli#23123](https://github.com/google-gemini/gemini-cli/issues/23123)
- [TechCrunch: Google launches Antigravity 2.0](https://techcrunch.com/2026/05/19/google-launches-antigravity-2-0-with-an-updated-desktop-app-and-cli-tool-at-io-2026/)
