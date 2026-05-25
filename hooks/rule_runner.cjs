#!/usr/bin/env node
// rule_runner.cjs -- port of hooks/rule_runner.py for super-gsd v2.4 (NODE-03).
// PreToolUse hook: evaluates .claude/*.local.md rules without hookify.
//
// hookify 미설치 환경에서 .claude/hookify.*.local.md 및
// .claude/sg-rule.*.local.md 규칙을 직접 평가한다.
// hookify가 설치된 환경에서는 즉시 exit 0 (skip).
//
// 지원 이벤트: bash (Bash 도구), file (Edit/Write/MultiEdit 도구).
// prompt 이벤트 규칙은 PreToolUse에서 평가 불가.

const fs = require('fs');
const path = require('path');
const os = require('os');

// Platform-agnostic plugin root detection (mirrors rule_runner.py:22-25 / D-20)
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  || path.dirname(path.dirname(path.resolve(__filename)));


// Python json.dumps(obj) default emission:
//   - separators=(', ', ': ') when indent is None
//   - ensure_ascii=True → non-ASCII chars escaped as \uXXXX (surrogate pairs for >U+FFFF)
//   - insertion-order key preservation (CPython 3.7+ dicts)
// JS JSON.stringify defaults differ on BOTH counts. Hand-roll to preserve
// byte-identical stdout parity required by 28-VERIFY.md Section 6.
function _pyJsonDumps(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') {
    // Python json.dumps emits Infinity / NaN as bare tokens by default
    // (non-strict). Hook outputs never produce these, but be safe.
    if (!Number.isFinite(value)) {
      if (Number.isNaN(value)) return 'NaN';
      return value > 0 ? 'Infinity' : '-Infinity';
    }
    // Integers vs floats: Python prints `1` not `1.0` for ints.
    // JS Number has no int/float distinction; for integer-valued numbers
    // emit without decimal. Hook outputs use only strings/objects so this
    // path rarely fires; keep it simple.
    return String(value);
  }
  if (typeof value === 'string') return _pyEncodeString(value);
  if (Array.isArray(value)) {
    return '[' + value.map(_pyJsonDumps).join(', ') + ']';
  }
  if (typeof value === 'object') {
    const parts = [];
    for (const k of Object.keys(value)) {
      parts.push(_pyEncodeString(k) + ': ' + _pyJsonDumps(value[k]));
    }
    return '{' + parts.join(', ') + '}';
  }
  // Unsupported types (undefined, function, symbol) — emit 'null' to mirror
  // Python which would raise TypeError; here we degrade gracefully.
  return 'null';
}


function _pyEncodeString(s) {
  // Mirror Python json.encoder.py_encode_basestring_ascii behaviour:
  // escape control chars, ", \, /, and any code point > 0x7E as \uXXXX
  // (surrogate pairs preserved for >U+FFFF).
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const cu = s.charCodeAt(i);
    const ch = s[i];
    if (ch === '\\') { out += '\\\\'; continue; }
    if (ch === '"') { out += '\\"'; continue; }
    if (ch === '\b') { out += '\\b'; continue; }
    if (ch === '\f') { out += '\\f'; continue; }
    if (ch === '\n') { out += '\\n'; continue; }
    if (ch === '\r') { out += '\\r'; continue; }
    if (ch === '\t') { out += '\\t'; continue; }
    if (cu < 0x20 || cu > 0x7e) {
      out += '\\u' + cu.toString(16).padStart(4, '0');
      continue;
    }
    out += ch;
  }
  out += '"';
  return out;
}


function _hookifyInstalled() {
  // Mirrors rule_runner.py:28-32
  const cache = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'claude-plugins-official', 'hookify');
  try {
    return fs.statSync(cache).isDirectory();
  } catch (e) {
    return false;
  }
}


function _stripQuotes(s) {
  // Mirrors Python s.strip('"').strip("'") — strips ALL leading/trailing chars in the set.
  return s.replace(/^["]+|["]+$/g, '').replace(/^[']+|[']+$/g, '');
}


function _parseFrontmatter(content) {
  // Mirror rule_runner.py:35-101 LINE-BY-LINE per D-15.
  // Returns {fm, body}.
  if (!content.startsWith('---')) {
    return { fm: {}, body: content };
  }
  // Python content.split("---", 2) with maxsplit=2 produces up to 3 parts.
  // JS String.prototype.split has different semantics — implement manually.
  const first = content.indexOf('---');
  // first === 0 here.
  const second = content.indexOf('---', first + 3);
  if (second === -1) {
    return { fm: {}, body: content };
  }
  // Python split produces 3 parts: [before_first, between_first_and_second, rest].
  // first === 0, so before_first === ''. between = content.slice(first+3, second). rest = content.slice(second+3).
  const parts = [
    content.slice(0, first),
    content.slice(first + 3, second),
    content.slice(second + 3),
  ];
  // parts.length === 3 guaranteed.

  const fm = {};
  let currentKey = null;
  let currentList = [];
  let currentDict = {};
  let inList = false;
  let inDictItem = false;

  const lines = parts[1].split('\n');
  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('#')) {
      continue;
    }
    // Python: indent = len(line) - len(line.lstrip())
    const indent = line.length - line.replace(/^\s+/, '').length;

    if (indent === 0 && line.includes(':') && !stripped.startsWith('-')) {
      // Branch A: top-level key
      if (inList && currentKey !== null) {
        if (inDictItem && Object.keys(currentDict).length > 0) {
          currentList.push(currentDict);
          currentDict = {};
        }
        fm[currentKey] = currentList;
        inList = false;
        inDictItem = false;
        currentList = [];
      }
      // Python str.partition(":") — split on FIRST colon only.
      const idx = line.indexOf(':');
      let key = line.slice(0, idx);
      let val = line.slice(idx + 1);
      key = key.trim();
      val = _stripQuotes(val.trim());
      if (!val) {
        currentKey = key;
        inList = true;
        currentList = [];
      } else {
        let parsed = val;
        if (val.toLowerCase() === 'true') {
          parsed = true;
        } else if (val.toLowerCase() === 'false') {
          parsed = false;
        }
        fm[key] = parsed;
      }
    } else if (stripped.startsWith('-') && inList) {
      // Branch B: list item
      if (inDictItem && Object.keys(currentDict).length > 0) {
        currentList.push(currentDict);
        currentDict = {};
      }
      const item = stripped.slice(1).trim();
      if (item.includes(':')) {
        const idx2 = item.indexOf(':');
        const k2 = item.slice(0, idx2).trim();
        const v2 = _stripQuotes(item.slice(idx2 + 1).trim());
        currentDict = { [k2]: v2 };
        inDictItem = true;
      } else {
        currentList.push(_stripQuotes(item));
        inDictItem = false;
      }
    } else if (indent > 2 && inDictItem && line.includes(':')) {
      // Branch C: dict-item continuation
      const idx2 = stripped.indexOf(':');
      const k2 = stripped.slice(0, idx2).trim();
      const v2 = _stripQuotes(stripped.slice(idx2 + 1).trim());
      currentDict[k2] = v2;
    }
  }

  if (inList && currentKey !== null) {
    if (inDictItem && Object.keys(currentDict).length > 0) {
      currentList.push(currentDict);
    }
    fm[currentKey] = currentList;
  }

  return { fm, body: parts[2].trim() };
}


function _globLocalMd(dir, prefix) {
  // Inline mini-glob per D-09, D-10.
  // Mirrors glob.glob(os.path.join(dir, prefix + ".*.local.md")).
  try {
    return fs.readdirSync(dir)
      .filter(name => name.startsWith(prefix + '.') && name.endsWith('.local.md'))
      .map(name => path.join(dir, name));
  } catch (e) {
    return [];
  }
}


function _loadRules(eventFilter) {
  // Mirror rule_runner.py:104-157.
  const seenNames = new Map();

  function loadGlob(paths, priority) {
    for (const p of paths) {
      let content;
      try {
        content = fs.readFileSync(p, 'utf-8');
      } catch (e) {
        continue;
      }
      const { fm, body: message } = _parseFrontmatter(content);
      if (Object.keys(fm).length === 0) continue;

      const name = (fm.name !== undefined ? fm.name : p);
      const enabled = (fm.enabled !== undefined ? fm.enabled : true);
      if (!enabled) continue;

      const event = (fm.event !== undefined ? fm.event : 'all');
      if (eventFilter && event !== 'all' && event !== eventFilter) continue;

      let conditions = [];
      if (fm.conditions !== undefined) {
        if (Array.isArray(fm.conditions)) {
          conditions = fm.conditions.filter(c => c !== null && typeof c === 'object' && !Array.isArray(c));
        }
      }
      const simplePattern = fm.pattern;
      if (simplePattern && conditions.length === 0) {
        const field = (event === 'bash') ? 'command' : 'new_text';
        conditions = [{ field, operator: 'regex_match', pattern: simplePattern }];
      }
      if (conditions.length === 0) continue;

      const rule = {
        name,
        action: (fm.action !== undefined ? fm.action : 'warn'),
        conditions,
        message,
        priority,
      };
      const existing = seenNames.get(name);
      if (existing === undefined || priority > existing.priority) {
        seenNames.set(name, rule);
      }
    }
  }

  loadGlob(_globLocalMd(path.join(PLUGIN_ROOT, '.claude'), 'hookify'), 1);
  loadGlob(_globLocalMd(path.join(PLUGIN_ROOT, '.claude'), 'sg-rule'), 2);
  return Array.from(seenNames.values());
}


function _matchCondition(cond, toolName, toolInput) {
  // Mirror rule_runner.py:160-200.
  const field = cond.field !== undefined ? cond.field : '';
  const operator = cond.operator !== undefined ? cond.operator : 'regex_match';
  const pattern = cond.pattern !== undefined ? cond.pattern : '';

  // Extract field value.
  // Note on divergence: Python `field in tool_input` matches dict keys whose
  // value is None. JS port mirrors via `field in toolInput`. Python coerces
  // None via str(raw) -> 'None'. JS String(null) returns 'null' (not 'None').
  // This is a documented edge-case divergence that the rule_runner fixtures
  // do not exercise.
  let value = null;
  if (field in toolInput) {
    const raw = toolInput[field];
    value = (typeof raw === 'string') ? raw : String(raw);
  } else if (toolName === 'Bash' && field === 'command') {
    value = toolInput.command || '';
  } else if (toolName === 'Edit' || toolName === 'Write' || toolName === 'MultiEdit') {
    if (field === 'new_text' || field === 'new_string') {
      value = toolInput.new_string || toolInput.content || '';
    } else if (field === 'content') {
      value = toolInput.content || toolInput.new_string || '';
    } else if (field === 'file_path') {
      value = toolInput.file_path || '';
    } else if (field === 'old_text' || field === 'old_string') {
      value = toolInput.old_string || '';
    }
  }

  if (value === null) {
    return false;
  }

  if (operator === 'regex_match') {
    // W-3 bad-regex swallow: mirror Python re.error catch at rule_runner.py:188-189.
    try {
      return new RegExp(pattern, 'i').test(value);
    } catch (e) {
      return false;
    }
  }
  if (operator === 'contains') return value.includes(pattern);
  if (operator === 'equals') return value === pattern;
  if (operator === 'not_contains') return !value.includes(pattern);
  if (operator === 'starts_with') return value.startsWith(pattern);
  if (operator === 'ends_with') return value.endsWith(pattern);
  return false;
}


function _evaluate(rules, inputData, eventName) {
  // Mirror rule_runner.py:203-232.
  const toolName = inputData.tool_name || '';
  const toolInput = inputData.tool_input || {};

  const blocking = [];
  const warnings = [];

  for (const rule of rules) {
    if (rule.conditions.every(c => _matchCondition(c, toolName, toolInput))) {
      const label = `**[${rule.name}]**\n${rule.message}`;
      if (rule.action === 'block') {
        blocking.push(label);
      } else {
        warnings.push(label);
      }
    }
  }

  if (blocking.length > 0) {
    return {
      hookSpecificOutput: {
        hookEventName: eventName,
        permissionDecision: 'deny',
      },
      systemMessage: blocking.join('\n\n'),
    };
  }

  if (warnings.length > 0) {
    return { systemMessage: warnings.join('\n\n') };
  }

  return {};
}


function main() {
  // Mirror rule_runner.py:235-274.
  try {
    if (_hookifyInstalled()) {
      console.log(_pyJsonDumps({}));
      process.exit(0);
    }

    // Load super_gsd config — respect auto_advance: false
    try {
      const cfgRaw = fs.readFileSync(path.join(PLUGIN_ROOT, '.planning', 'config.json'), 'utf-8');
      const cfg = (JSON.parse(cfgRaw).super_gsd) || {};
      const autoAdvance = cfg.auto_advance !== undefined ? cfg.auto_advance : true;
      if (!autoAdvance) {
        console.log(_pyJsonDumps({}));
        process.exit(0);
      }
    } catch (e) {
      // File missing or bad JSON — continue.
    }

    const stdinRaw = fs.readFileSync(0, 'utf-8');
    const inputData = JSON.parse(stdinRaw);
    const eventName = inputData.hook_event_name
      || inputData.hookEventName
      || 'PreToolUse';
    const toolName = inputData.tool_name || '';

    let eventFilter;
    if (toolName === 'Bash') {
      eventFilter = 'bash';
    } else if (toolName === 'Edit' || toolName === 'Write' || toolName === 'MultiEdit') {
      eventFilter = 'file';
    } else {
      console.log(_pyJsonDumps({}));
      process.exit(0);
    }

    const rules = _loadRules(eventFilter);
    const result = _evaluate(rules, inputData, eventName);
    console.log(_pyJsonDumps(result));
  } catch (e) {
    console.log(_pyJsonDumps({ systemMessage: 'super-gsd rule_runner error: ' + e.message }));
  } finally {
    process.exit(0);
  }
}


if (require.main === module) {
  main();
}
