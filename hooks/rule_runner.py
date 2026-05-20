#!/usr/bin/env python3
"""super-gsd PreToolUse rule runner.

hookify 미설치 환경에서 .claude/hookify.*.local.md 및
.claude/sg-rule.*.local.md 규칙을 직접 평가한다.
hookify가 설치된 환경에서는 즉시 exit 0 (skip).
"""

import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _hookify_installed() -> bool:
    hookify_cache = os.path.expanduser(
        "~/.claude/plugins/cache/claude-plugins-official/hookify"
    )
    return os.path.isdir(hookify_cache)


def _parse_frontmatter(content: str):
    """Return (frontmatter_dict, message_body) from markdown with --- delimiters."""
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content

    fm: dict = {}
    current_key = None
    current_list: list = []
    current_dict: dict = {}
    in_list = False
    in_dict_item = False

    for line in parts[1].split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())

        if indent == 0 and ":" in line and not stripped.startswith("-"):
            if in_list and current_key is not None:
                if in_dict_item and current_dict:
                    current_list.append(current_dict)
                    current_dict = {}
                fm[current_key] = current_list
                in_list = False
                in_dict_item = False
                current_list = []
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if not val:
                current_key = key
                in_list = True
                current_list = []
            else:
                if val.lower() == "true":
                    val = True  # type: ignore[assignment]
                elif val.lower() == "false":
                    val = False  # type: ignore[assignment]
                fm[key] = val

        elif stripped.startswith("-") and in_list:
            if in_dict_item and current_dict:
                current_list.append(current_dict)
                current_dict = {}
            item = stripped[1:].strip()
            if ":" in item:
                k2, _, v2 = item.partition(":")
                current_dict = {k2.strip(): v2.strip().strip('"').strip("'")}
                in_dict_item = True
            else:
                current_list.append(item.strip('"').strip("'"))
                in_dict_item = False

        elif indent > 2 and in_dict_item and ":" in line:
            k2, _, v2 = stripped.partition(":")
            current_dict[k2.strip()] = v2.strip().strip('"').strip("'")

    if in_list and current_key is not None:
        if in_dict_item and current_dict:
            current_list.append(current_dict)
        fm[current_key] = current_list

    return fm, parts[2].strip()


def _load_rules(event_filter: str) -> list:
    """Load and filter rules from both glob paths. sg-rule takes priority on name clash."""
    seen_names: dict = {}  # name -> rule dict

    def _load_glob(pattern: str, priority: int) -> None:
        for path in glob.glob(pattern):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
            except OSError:
                continue

            fm, message = _parse_frontmatter(content)
            if not fm:
                continue

            name = fm.get("name", path)
            enabled = fm.get("enabled", True)
            if not enabled:
                continue

            event = fm.get("event", "all")
            if event_filter and event not in ("all", event_filter):
                continue

            # Build conditions
            conditions = []
            if "conditions" in fm:
                cond_list = fm["conditions"]
                if isinstance(cond_list, list):
                    conditions = [c for c in cond_list if isinstance(c, dict)]

            simple_pattern = fm.get("pattern")
            if simple_pattern and not conditions:
                field = "command" if event == "bash" else "new_text"
                conditions = [{"field": field, "operator": "regex_match", "pattern": simple_pattern}]

            if not conditions:
                continue

            rule = {
                "name": name,
                "action": fm.get("action", "warn"),
                "conditions": conditions,
                "message": message,
                "priority": priority,
            }
            existing = seen_names.get(name)
            if existing is None or priority > existing["priority"]:
                seen_names[name] = rule

    _load_glob(os.path.join(".claude", "hookify.*.local.md"), priority=1)
    _load_glob(os.path.join(".claude", "sg-rule.*.local.md"), priority=2)
    return list(seen_names.values())


def _match_condition(cond: dict, tool_name: str, tool_input: dict) -> bool:
    field = cond.get("field", "")
    operator = cond.get("operator", "regex_match")
    pattern = cond.get("pattern", "")

    # Extract field value
    value = None
    if field in tool_input:
        raw = tool_input[field]
        value = raw if isinstance(raw, str) else str(raw)
    elif tool_name == "Bash" and field == "command":
        value = tool_input.get("command", "")
    elif tool_name in ("Edit", "Write", "MultiEdit"):
        if field in ("new_text", "new_string"):
            value = tool_input.get("new_string", "")
        elif field == "content":
            value = tool_input.get("content") or tool_input.get("new_string", "")
        elif field == "file_path":
            value = tool_input.get("file_path", "")
        elif field in ("old_text", "old_string"):
            value = tool_input.get("old_string", "")

    if value is None:
        return False

    if operator == "regex_match":
        try:
            return bool(re.search(pattern, value, re.IGNORECASE))
        except re.error:
            return False
    elif operator == "contains":
        return pattern in value
    elif operator == "equals":
        return pattern == value
    elif operator == "not_contains":
        return pattern not in value
    elif operator == "starts_with":
        return value.startswith(pattern)
    elif operator == "ends_with":
        return value.endswith(pattern)
    return False


def _evaluate(rules: list, input_data: dict) -> dict:
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    blocking = []
    warnings = []

    for rule in rules:
        conditions = rule["conditions"]
        if all(_match_condition(c, tool_name, tool_input) for c in conditions):
            label = f"**[{rule['name']}]**\n{rule['message']}"
            if rule["action"] == "block":
                blocking.append(label)
            else:
                warnings.append(label)

    if blocking:
        msg = "\n\n".join(blocking)
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
            },
            "systemMessage": msg,
        }

    if warnings:
        return {"systemMessage": "\n\n".join(warnings)}

    return {}


def main() -> None:
    try:
        if _hookify_installed():
            print(json.dumps({}))
            sys.exit(0)

        # Load super_gsd config — respect auto_advance: false
        try:
            with open(".planning/config.json") as f:
                cfg = json.load(f).get("super_gsd", {})
            if not cfg.get("auto_advance", True):
                print(json.dumps({}))
                sys.exit(0)
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            pass

        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")

        if tool_name == "Bash":
            event_filter = "bash"
        elif tool_name in ("Edit", "Write", "MultiEdit"):
            event_filter = "file"
        else:
            print(json.dumps({}))
            sys.exit(0)

        rules = _load_rules(event_filter)
        result = _evaluate(rules, input_data)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"systemMessage": f"super-gsd rule_runner error: {e}"}))
    finally:
        sys.exit(0)


if __name__ == "__main__":
    main()
