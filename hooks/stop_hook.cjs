#!/usr/bin/env node
// stop_hook.cjs -- port of hooks/stop_hook.py for super-gsd v2.4 (NODE-01).
// Stop/SubagentStop hook: detects workflow completion signals and emits systemMessage.

const fs = require('fs');
const path = require('path');
const { detectSignal } = require('./transcript_matcher.cjs');

// Platform-agnostic plugin root detection (mirrors stop_hook.py:22-26 / D-20).
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  || path.dirname(path.dirname(path.resolve(__filename)));


// Python json.dumps(obj) default emission:
//   - separators=(', ', ': ') when indent is None
//   - ensure_ascii=True → non-ASCII chars escaped as \uXXXX (surrogate pairs for >U+FFFF)
//   - insertion-order key preservation (CPython 3.7+ dicts)
// JS JSON.stringify defaults differ on BOTH counts. Hand-roll to preserve
// byte-identical stdout parity required by 28-VERIFY.md Section 5.
// D-10: inline helper (no shared module); mirrors 28-02/28-03 pattern.
function _pyJsonDumps(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      if (Number.isNaN(value)) return 'NaN';
      return value > 0 ? 'Infinity' : '-Infinity';
    }
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
  return 'null';
}


function _pyEncodeString(s) {
  // Mirror Python json.encoder.py_encode_basestring_ascii behaviour:
  // escape control chars, ", \, and any code point > 0x7E as \uXXXX
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


function loadConfig() {
  // Mirror stop_hook.py:29-36.
  try {
    const raw = fs.readFileSync(path.join(PLUGIN_ROOT, '.planning', 'config.json'), 'utf-8');
    const cfg = JSON.parse(raw);
    return cfg.super_gsd || {};
  } catch (e) {
    return {};
  }
}


function _detectPlatform() {
  // Mirror stop_hook.py:39-47.
  return process.env.CLAUDE_PLUGIN_ROOT ? 'claude-code' : 'other';
}


function _readCurrentPhase() {
  // Mirror stop_hook.py:50-62 per D-12 regex translation.
  try {
    const content = fs.readFileSync(path.join(PLUGIN_ROOT, '.planning', 'STATE.md'), 'utf-8');
    const m = content.match(/^Phase:\s*(.+)/m);
    if (m) {
      const raw = m[1].trim();
      const numM = raw.match(/^([0-9]+)/);
      return numM ? numM[1] : raw;
    }
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}


function _extractHookifyOutput(transcriptPath) {
  // Mirror stop_hook.py:65-77.
  try {
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    return _joinLastNLinesWithTerminators(content, 200, ['## Lessons', '## Patterns', '## Hooks Generated', 'hookify complete']);
  } catch (e) {
    return '';
  }
}


function _joinLastNLinesWithTerminators(content, n, markers) {
  // Replicate Python: lines = f.readlines(); recent_text = ''.join(lines[-n:]); then rfind each marker.
  // readlines() returns lines INCLUDING trailing \n (Python preserves terminators per element).
  // JS lookbehind split (?<=\n) yields elements each ENDING with \n, matching readlines.
  const parts = content.split(/(?<=\n)/);
  const recent = parts.slice(-n).join('');
  for (const marker of markers) {
    const idx = recent.lastIndexOf(marker);
    if (idx !== -1) return recent.slice(idx);
  }
  return recent;
}


function saveHookifyLessons(transcriptPath) {
  // Mirror stop_hook.py:80-105 (W-2: simplified phase padding).
  try {
    const phase = _readCurrentPhase();
    const content = _extractHookifyOutput(transcriptPath);
    if (!content) return '';
    const today = _todayYmd();
    // W-2: parseInt + isNaN is sufficient. _readCurrentPhase already extracts leading digits.
    const parsed = parseInt(phase, 10);
    const padded = isNaN(parsed) ? phase : String(parsed).padStart(2, '0');
    const filename = `${padded}-${today}.md`;
    const filepath = path.join(PLUGIN_ROOT, '.planning', 'lessons', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    if (fs.existsSync(filepath)) return filepath;
    fs.writeFileSync(filepath, `# Lessons: Phase ${phase} (${today})\n\n${content}`, 'utf-8');
    return filepath;
  } catch (e) {
    return '';
  }
}


function _todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


function main() {
  // Mirror stop_hook.py:108-159.
  try {
    const stdinRaw = fs.readFileSync(0, 'utf-8');
    const inputData = JSON.parse(stdinRaw);

    // HOOK-03: config guard — auto_advance: false 이면 즉시 종료
    const cfg = loadConfig();
    const autoAdvance = (cfg.auto_advance !== undefined) ? cfg.auto_advance : true;
    if (!autoAdvance) {
      process.stdout.write(_pyJsonDumps({}) + '\n');
      process.exit(0);
    }

    // HOOK-04: transcript 기반 신호 감지
    const transcriptPath = inputData.transcript_path || '';
    const signal = detectSignal(transcriptPath);

    const platform = _detectPlatform();
    let cmdExecute, cmdReview, cmdLearn, cmdPlan;
    if (platform === 'claude-code') {
      cmdExecute = '/super-gsd:sg-execute';
      cmdReview  = '/super-gsd:sg-review';
      cmdLearn   = '/super-gsd:sg-learn';
      cmdPlan    = '/super-gsd:sg-plan';
    } else {
      cmdExecute = '$sg-execute';
      cmdReview  = '$sg-review';
      cmdLearn   = '$sg-retro';
      cmdPlan    = '$sg-plan';
    }

    let response;
    if (signal === 'gsd-plan-complete') {
      response = { systemMessage: `GSD plan-phase complete. Run ${cmdExecute} to hand off to implementation.` };
    } else if (signal === 'superpowers-implementation-complete') {
      response = { systemMessage: `Implementation complete. Run ${cmdReview} to request a code review.` };
    } else if (signal === 'superpowers-review-complete') {
      response = { systemMessage: `Review complete. Run ${cmdLearn} to capture lessons via sg-retro.` };
    } else if (signal === 'hookify-complete') {
      const lessonFile = saveHookifyLessons(transcriptPath);
      if (lessonFile) {
        // EM-DASH HERE — U+2014, NOT ASCII --
        response = { systemMessage: `Retrospective complete. Lessons saved to ${lessonFile}. Run ${cmdPlan} to start the next phase — prior lessons will be included as context.` };
      } else {
        response = { systemMessage: `Retrospective complete. Run ${cmdPlan} to start the next phase.` };
      }
    } else {
      response = {};
    }
    process.stdout.write(_pyJsonDumps(response) + '\n');
  } catch (e) {
    process.stdout.write(_pyJsonDumps({ systemMessage: `super-gsd hook error: ${e.message}` }) + '\n');
  } finally {
    process.exit(0);
  }
}


if (require.main === module) {
  main();
}
