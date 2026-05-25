// transcript_matcher.cjs -- port of hooks/transcript_matcher.py for super-gsd v2.4 (NODE-02).

const fs = require('fs');

const GSD_PLAN_SIGNALS = [
  'gsd-plan-phase',
  'plan-phase complete',
  'PLANNING COMPLETE',
  'Plans Created',
  '/gsd:execute-phase',
];
const IMPLEMENTATION_SIGNALS = [
  'finishing-a-development-branch',
  'Branch is ready for review',
];
const REVIEW_SIGNALS = [
  'review complete',
  'Code Review Complete',
  'Review Summary',
];
const SG_RETRO_SIGNALS = [
  'lessons file:',
  '## Lens:',
  'Retrospective complete',
];

function _splitlines(s) {
  const lines = s.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function detectSignal(transcriptPath) {
  if (!transcriptPath) return '';

  let content;
  try {
    content = fs.readFileSync(transcriptPath, 'utf-8');
  } catch (e) {
    return '';
  }

  const lines = _splitlines(content);
  const recent = lines.slice(-200).join('\n');

  if (GSD_PLAN_SIGNALS.some(sig => recent.includes(sig))) return 'gsd-plan-complete';
  if (IMPLEMENTATION_SIGNALS.some(sig => recent.includes(sig))) return 'superpowers-implementation-complete';
  if (REVIEW_SIGNALS.some(sig => recent.includes(sig))) return 'superpowers-review-complete';
  if (SG_RETRO_SIGNALS.some(sig => recent.includes(sig))) return 'sg-retro-complete';
  return '';
}

module.exports = { detectSignal };
