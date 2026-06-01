#!/usr/bin/env node
// stop_hook.cjs -- port of hooks/stop_hook.py for super-gsd v2.4 (NODE-01).
// Stop/SubagentStop hook: detects workflow completion signals and emits systemMessage.

const fs = require('fs');
const path = require('path');
const { detectSignal } = require('./transcript_matcher.cjs');

// Note: previous versions resolved PLUGIN_ROOT here for config.json lookup.
// That was wrong — .planning/config.json lives in the USER's project, not the
// plugin cache. _projectRoot(inputData) below replaces that resolution chain.


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


function _projectRoot(inputData) {
  // Project root resolution priority:
  //   1. inputData.cwd (Claude Code passes session cwd in stdin payload)
  //   2. process.cwd() (Codex/Gemini run from project root via relative path)
  // PLUGIN_ROOT (plugin cache dir) is NOT a fallback — config/HANDOFF live in user project.
  if (inputData && typeof inputData.cwd === 'string' && inputData.cwd) {
    return inputData.cwd;
  }
  return process.cwd();
}


function loadConfig(inputData) {
  // Mirror stop_hook.py:29-36. Reads .planning/config.json from user project (not plugin cache).
  try {
    const root = _projectRoot(inputData);
    const raw = fs.readFileSync(path.join(root, '.planning', 'config.json'), 'utf-8');
    const cfg = JSON.parse(raw);
    return cfg.super_gsd || {};
  } catch (e) {
    return {};
  }
}


function detectStageFromHandoff(inputData) {
  // HANDOFF.md = authoritative workflow state (append-only audit log written by sg-* skills).
  // Returns the current stage (last data row's To column, skipping sg-next meta rows).
  // Returns null when HANDOFF.md is absent (new project) so caller can fall back.
  try {
    const root = _projectRoot(inputData);
    const content = fs.readFileSync(path.join(root, '.planning', 'HANDOFF.md'), 'utf-8');
    const lines = content.split(/\r?\n/);
    // Data row pattern: starts with "| YYYY-..." (timestamp)
    const dataRows = lines.filter(l => /^\| \d{4}-/.test(l));
    if (dataRows.length === 0) return null;

    // Walk from the last row backward; skip rows where To=sg-next (meta transition).
    for (let i = dataRows.length - 1; i >= 0; i--) {
      const cols = dataRows[i].split('|').map(c => c.trim());
      // cols[0]='', cols[1]=ts, cols[2]=phase, cols[3]=from, cols[4]=to, cols[5]=hash, cols[6]='' (or +user)
      const to = cols[4];
      if (to && to !== 'sg-next') return to;
    }
    return null;
  } catch (e) {
    return null;
  }
}


function stageToSignal(stage) {
  // Map HANDOFF.md stage → stop_hook signal (which selects the systemMessage branch).
  // Stages with no next-step suggestion (ship/complete/init) return null → no message emitted.
  switch (stage) {
    case 'gsd-plan':
    case 'ui-plan':
      return 'gsd-plan-complete';                       // → "Run sg-execute"
    case 'superpowers':
    case 'parallel':
    case 'execute':
      return 'superpowers-implementation-complete';     // → "Run sg-review"
    case 'tdd':
      return 'tdd-complete';                            // → "Run sg-review"
    case 'review':
      return 'superpowers-review-complete';             // → "Run sg-learn"
    case 'sg-retro':
      return 'sg-retro-complete';                       // → "Run sg-ship"
    default:
      return null;  // ship / complete / init — workflow waiting on user choice
  }
}


function _detectPlatform() {
  // Mirror stop_hook.py:39-47.
  return process.env.CLAUDE_PLUGIN_ROOT ? 'claude-code' : 'other';
}


function main() {
  // Mirror stop_hook.py:108-159.
  try {
    const stdinRaw = fs.readFileSync(0, 'utf-8');
    const inputData = JSON.parse(stdinRaw);

    // HOOK-03: config guard — exit immediately if auto_advance: false
    const cfg = loadConfig(inputData);
    const autoAdvance = (cfg.auto_advance !== undefined) ? cfg.auto_advance : true;
    if (!autoAdvance) {
      process.stdout.write(_pyJsonDumps({}) + '\n');
      process.exit(0);
    }

    // HOOK-04: stage detection — HANDOFF.md (authoritative) → transcript fallback.
    //
    // Why HANDOFF.md first: sg-* skills append to HANDOFF.md on every stage transition.
    // transcript_matcher.cjs scans the last 200 transcript lines and returns the first-
    // workflow-order match, which means OLD signals (e.g. "plan-phase complete" from
    // sg-plan earlier in the session) keep winning over recent signals once the workflow
    // has moved past them. HANDOFF.md is the audit log written by the workflow itself, so
    // it's never stale relative to actual stage. Transcript matching is kept as a fallback
    // for projects that don't yet have HANDOFF.md (fresh super-gsd setup before sg-plan).
    let signal;
    const handoffStage = detectStageFromHandoff(inputData);
    if (handoffStage !== null) {
      signal = stageToSignal(handoffStage);
    } else {
      const transcriptPath = inputData.transcript_path || '';
      signal = detectSignal(transcriptPath);
    }

    const platform = _detectPlatform();
    let cmdExecute, cmdReview, cmdLearn, cmdShip;
    if (platform === 'claude-code') {
      cmdExecute = '/super-gsd:sg-execute';
      cmdReview  = '/super-gsd:sg-review';
      cmdLearn   = '/super-gsd:sg-learn';
      cmdShip    = '/super-gsd:sg-ship';
    } else {
      cmdExecute = '$sg-execute';
      cmdReview  = '$sg-review';
      cmdLearn   = '$sg-retro';
      cmdShip    = '$sg-ship';
    }

    let response;
    if (signal === 'gsd-plan-complete') {
      response = { systemMessage: `GSD plan-phase complete. Run ${cmdExecute} to hand off to implementation.` };
    } else if (signal === 'superpowers-implementation-complete') {
      response = { systemMessage: `Implementation complete. Run ${cmdReview} to request a code review.` };
    } else if (signal === 'tdd-complete') {
      response = { systemMessage: `TDD verification complete. Run ${cmdReview} to request a code review.` };
    } else if (signal === 'superpowers-review-complete') {
      response = { systemMessage: `Review complete. Run ${cmdLearn} to capture lessons via sg-retro.` };
    } else if (signal === 'sg-retro-complete') {
      response = { systemMessage: `Retrospective complete. Run ${cmdShip} to ship the phase.` };
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
