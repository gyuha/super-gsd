#!/usr/bin/env node
// lessons_ranker.cjs -- port of hooks/lessons_ranker.py for super-gsd v2.4 (NODE-04).
// CLI: --top N (default 5) ranking, --archive --milestone VERSION consolidation.

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

function _splitlines(s) {
  const lines = s.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function _extractSeverity(text) {
  const t = text.toLowerCase();
  if (/\(high\)/.test(t)) return 1.0;
  if (/\(medium\)/.test(t)) return 0.5;
  if (/\(low\)/.test(t)) return 0.2;
  const m = t.match(/severity\s*:\s*(high|medium|low)/);
  if (m) return ({ high: 1.0, medium: 0.5, low: 0.2 })[m[1]];
  return 0.3;
}

function _extractFileDate(filepath) {
  const base = path.basename(filepath);
  const m = base.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  const stat = fs.statSync(filepath);
  const d = new Date(stat.mtime);
  d.setHours(0, 0, 0, 0);
  return d;
}

function _jsonNumber(x) {
  // Mirror Python json.dumps float formatting: whole-valued floats render as "N.0".
  const s = String(x);
  if (Number.isFinite(x) && !s.includes('.') && !s.includes('e') && !s.includes('E') && !s.includes('n') && !s.includes('N')) {
    return s + '.0';
  }
  return s;
}

function _roundHalfEven(x, digits) {
  // Python round(x, n) compatible. Inspects the actual IEEE-754 decimal
  // value via toPrecision(21); never multiplies by 10^n. Multiplication
  // can introduce false exact halves at boundaries (e.g. 0.55675 * 10000
  // === 5567.5 exact in IEEE-754, but the underlying double of 0.55675
  // is 0.5567499..., so Python rounds DOWN to 0.5567, not at-half-even
  // UP to 0.5568).
  if (!isFinite(x)) return x;
  const sign = x < 0 ? '-' : '';
  const prec = Math.abs(x).toPrecision(21);
  // toPrecision can yield scientific notation for very small magnitudes
  // (e.g. 5e-5). Convert to plain fixed-point for digit-by-digit parsing.
  let fixedStr;
  const eIdx = prec.indexOf('e');
  if (eIdx === -1) {
    fixedStr = prec;
  } else {
    const mant = prec.slice(0, eIdx);
    const exp = parseInt(prec.slice(eIdx + 1), 10);
    const dot = mant.indexOf('.');
    const intM = dot === -1 ? mant : mant.slice(0, dot);
    const fracM = dot === -1 ? '' : mant.slice(dot + 1);
    const all = intM + fracM;
    if (exp < 0) {
      const shift = -exp;
      fixedStr = '0.' + '0'.repeat(Math.max(0, shift - intM.length)) + all;
    } else if (exp >= fracM.length) {
      fixedStr = all + '0'.repeat(exp - fracM.length);
    } else {
      fixedStr = all.slice(0, intM.length + exp) + '.' + all.slice(intM.length + exp);
    }
  }
  const dot2 = fixedStr.indexOf('.');
  const intStr = dot2 === -1 ? fixedStr : fixedStr.slice(0, dot2);
  const fracStr = dot2 === -1 ? '' : fixedStr.slice(dot2 + 1);
  const fracPadded = fracStr.padEnd(digits + 1, '0');
  const keep = fracPadded.slice(0, digits);
  const rest = fracPadded.slice(digits);
  let increment;
  const firstRest = rest.charAt(0);
  if (firstRest < '5') increment = false;
  else if (firstRest > '5') increment = true;
  else if (/[1-9]/.test(rest.slice(1))) increment = true;
  else {
    // Exact half -- banker's rule (round to even).
    const lastDigit = keep.length > 0
      ? parseInt(keep.charAt(keep.length - 1), 10)
      : parseInt(intStr.charAt(intStr.length - 1) || '0', 10);
    increment = (lastDigit % 2 === 1);
  }
  let result = parseFloat(sign + intStr + '.' + keep);
  if (increment) result += (x < 0 ? -1 : 1) * Math.pow(10, -digits);
  return parseFloat(result.toFixed(digits));
}

function _splitOnHeaders(content) {
  const re = /^## .+$/gm;
  const sections = [];
  let lastIdx = 0;
  let match;
  let firstHeader = true;
  while ((match = re.exec(content)) !== null) {
    const headerStart = match.index;
    const headerEnd = headerStart + match[0].length;
    if (firstHeader) {
      sections.push(content.slice(0, headerStart));
      firstHeader = false;
    } else {
      sections.push(content.slice(lastIdx, headerStart));
    }
    sections.push(match[0]);
    lastIdx = headerEnd;
  }
  if (firstHeader) {
    return [content];
  }
  sections.push(content.slice(lastIdx));
  return sections;
}

function _globMd(pattern) {
  const star = pattern.indexOf('*');
  if (star === -1) {
    return fs.existsSync(pattern) ? [pattern] : [];
  }
  const dir = path.dirname(pattern);
  const filenamePattern = path.basename(pattern);
  const reStr = '^' + filenamePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  const re = new RegExp(reStr);
  try {
    return fs.readdirSync(dir)
      .filter(name => re.test(name))
      .map(name => path.join(dir, name));
  } catch (e) {
    return [];
  }
}

function parseLessonsFiles(paths) {
  const entries = [];
  const expanded = [];
  for (const p of paths) {
    const matched = _globMd(p);
    if (matched.length > 0) expanded.push(...matched);
    else expanded.push(p);
  }
  for (const filepath of expanded) {
    let stat;
    try { stat = fs.statSync(filepath); } catch (e) { stat = null; }
    if (!stat || !stat.isFile()) {
      process.stderr.write(`[warn] file not found: ${filepath}\n`);
      continue;
    }
    let content;
    try { content = fs.readFileSync(filepath, 'utf-8'); } catch (e) {
      process.stderr.write(`[warn] cannot read ${filepath}: ${e.message}\n`);
      continue;
    }
    const fileDate = _extractFileDate(filepath);
    const sections = _splitOnHeaders(content);
    let i = 1;
    while (i + 1 < sections.length) {
      const header = sections[i].trim();
      const body = sections[i + 1];
      const category = header.slice(3).trim();
      const severity = _extractSeverity(header + '\n' + body);
      let pattern = '';
      // B-1: use _splitlines for full parity with Python body.splitlines()
      for (const line of _splitlines(body)) {
        const t = line.trim();
        if (t) { pattern = t; break; }
      }
      if (category) {
        entries.push({ category, pattern, severity, fileDate, filepath, header });
      }
      i += 2;
    }
  }
  return entries;
}

function computeScores(entries, today) {
  if (!today) {
    today = new Date();
    today.setHours(0, 0, 0, 0);
  }
  if (entries.length === 0) return entries;
  const freqCounts = new Map();
  for (const e of entries) freqCounts.set(e.category, (freqCounts.get(e.category) || 0) + 1);
  const maxCount = Math.max(...freqCounts.values());
  for (const e of entries) {
    const freqNorm = freqCounts.get(e.category) / maxCount;
    const daysAgo = Math.floor((today - e.fileDate) / 86400000);
    const recency = 1.0 / (1 + daysAgo);
    e.score = 0.4 * freqNorm + 0.4 * recency + 0.2 * e.severity;
  }
  return entries.slice().sort((a, b) => b.score - a.score);
}

function rankingMode(args) {
  const paths = args.positionals || [];
  const entries = parseLessonsFiles(paths);
  if (entries.length === 0) return;
  const sorted = computeScores(entries);
  const topN = sorted.slice(0, args.top);
  for (const e of topN) {
    const source = `${path.basename(e.filepath)}:${e.header}`;
    const score = _roundHalfEven(e.score, 4); // W-1: banker's rounding UNCONDITIONAL
    // Match Python json.dumps default separators (', ', ': ') for byte-identical parity.
    const line = '{'
      + '"pattern": ' + JSON.stringify(e.pattern) + ', '
      + '"score": ' + _jsonNumber(score) + ', '
      + '"source": ' + JSON.stringify(source)
      + '}';
    process.stdout.write(line + '\n');
  }
}

function archiveMode(args) {
  if (!args.milestone) {
    process.stderr.write('[error] --milestone VERSION is required for --archive\n');
    process.exit(1);
  }
  const paths = (args.positionals && args.positionals.length > 0)
    ? args.positionals
    : ['.planning/lessons/*.md'];
  const expanded = [];
  for (const p of paths) {
    const matched = _globMd(p);
    if (matched.length > 0) {
      matched.sort();
      expanded.push(...matched);
    } else {
      try { if (fs.statSync(p).isFile()) expanded.push(p); } catch (e) { /* skip */ }
    }
  }
  if (expanded.length === 0) {
    process.stderr.write('[warn] no lessons files found\n');
    process.exit(0);
  }
  const milestonesDir = '.planning/milestones';
  const dest = path.join(milestonesDir, `${args.milestone}-LESSONS.md`);
  if (fs.existsSync(dest)) {
    // EM-DASH HERE -- U+2014, NOT ASCII --
    process.stdout.write(`[warn] archive already exists: ${dest} — skipping\n`);
    process.exit(0);
  }
  fs.mkdirSync(milestonesDir, { recursive: true });
  // EM-DASH HERE -- U+2014, NOT ASCII --
  let out = `# Lessons Archive — ${args.milestone}\n\n`;
  let written = 0;
  for (const filepath of expanded) {
    let stat;
    try { stat = fs.statSync(filepath); } catch (e) { stat = null; }
    if (!stat || !stat.isFile()) {
      process.stderr.write(`[warn] file not found: ${filepath}\n`);
      continue;
    }
    out += `---\n\n## Source: ${path.basename(filepath)}\n\n`;
    out += fs.readFileSync(filepath, 'utf-8');
    out += '\n\n';
    written++;
  }
  fs.writeFileSync(dest, out, 'utf-8');
  process.stdout.write(`[sg-complete] archived ${expanded.length} lesson files to ${dest}\n`);
}

function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      top: { type: 'string', default: '5' },
      archive: { type: 'boolean', default: false },
      milestone: { type: 'string' },
    },
    allowPositionals: true,
  });
  const args = {
    top: parseInt(values.top, 10),
    archive: values.archive,
    milestone: values.milestone || null,
    positionals,
  };
  if (args.archive) archiveMode(args);
  else rankingMode(args);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`[error] unexpected: ${e.message}\n`);
    process.exit(1);
  }
}
