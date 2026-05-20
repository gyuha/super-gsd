#!/usr/bin/env python3
"""super-gsd lessons_ranker: weighted top-N pattern ranking + milestone archive."""

import sys
import os
import json
import re
import argparse
import glob
import shutil
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _extract_severity(text: str) -> float:
    """Return severity score from section text."""
    text_lower = text.lower()
    # Check for (High)/(Medium)/(Low) markers
    if re.search(r'\(high\)', text_lower):
        return 1.0
    if re.search(r'\(medium\)', text_lower):
        return 0.5
    if re.search(r'\(low\)', text_lower):
        return 0.2
    # Check for severity: high/medium/low in frontmatter or text
    m = re.search(r'severity\s*:\s*(high|medium|low)', text_lower)
    if m:
        mapping = {'high': 1.0, 'medium': 0.5, 'low': 0.2}
        return mapping[m.group(1)]
    return 0.3  # absent default


def _extract_file_date(filepath: str) -> date:
    """Extract date from filename YYYY-MM-DD or fall back to mtime."""
    basename = os.path.basename(filepath)
    m = re.search(r'(\d{4}-\d{2}-\d{2})', basename)
    if m:
        try:
            return datetime.strptime(m.group(1), '%Y-%m-%d').date()
        except ValueError:
            pass
    mtime = os.path.getmtime(filepath)
    return datetime.fromtimestamp(mtime).date()


def parse_lessons_files(paths):
    """Returns list of dicts: {category, pattern, severity, file_date, filepath}"""
    entries = []
    expanded = []
    for p in paths:
        matched = glob.glob(p)
        if matched:
            expanded.extend(matched)
        else:
            # treat as literal path
            expanded.append(p)

    for filepath in expanded:
        if not os.path.isfile(filepath):
            print(f'[warn] file not found: {filepath}', file=sys.stderr)
            continue

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except OSError as e:
            print(f'[warn] cannot read {filepath}: {e}', file=sys.stderr)
            continue

        file_date = _extract_file_date(filepath)

        # Split on ## headers
        sections = re.split(r'^(## .+)$', content, flags=re.MULTILINE)
        # sections: [preamble, header1, body1, header2, body2, ...]
        i = 1
        while i + 1 < len(sections):
            header = sections[i].strip()
            body = sections[i + 1]
            category = header[3:].strip()  # remove "## "

            severity = _extract_severity(header + '\n' + body)

            # pattern = first non-empty line of body
            pattern = ''
            for line in body.splitlines():
                line = line.strip()
                if line:
                    pattern = line
                    break

            if category:
                entries.append({
                    'category': category,
                    'pattern': pattern,
                    'severity': severity,
                    'file_date': file_date,
                    'filepath': filepath,
                    'header': header,
                })
            i += 2

    return entries


def compute_scores(entries, today=None):
    """Adds 'score' key to each entry dict in-place. Returns sorted list."""
    if today is None:
        today = date.today()

    if not entries:
        return entries

    # Count freq per category
    freq_counts = {}
    for e in entries:
        cat = e['category']
        freq_counts[cat] = freq_counts.get(cat, 0) + 1

    max_count = max(freq_counts.values()) if freq_counts else 1

    for e in entries:
        freq_normalized = freq_counts[e['category']] / max_count
        days_ago = (today - e['file_date']).days
        recency = 1.0 / (1 + days_ago)
        severity = e['severity']
        e['score'] = 0.4 * freq_normalized + 0.4 * recency + 0.2 * severity

    return sorted(entries, key=lambda x: x['score'], reverse=True)


def ranking_mode(args):
    """Print top-N JSON lines to stdout."""
    paths = args.paths if args.paths else []
    entries = parse_lessons_files(paths)

    if not entries:
        return

    sorted_entries = compute_scores(entries)
    top_n = sorted_entries[:args.top]

    for e in top_n:
        source = f"{os.path.basename(e['filepath'])}:{e['header']}"
        record = {
            'pattern': e['pattern'],
            'score': round(e['score'], 4),
            'source': source,
        }
        print(json.dumps(record, ensure_ascii=False))


def archive_mode(args):
    """Copy lessons/*.md to milestones/vX.Y-LESSONS.md (keep originals)."""
    if not args.milestone:
        print('[error] --milestone VERSION is required for --archive', file=sys.stderr)
        sys.exit(1)

    paths = args.paths if args.paths else ['.planning/lessons/*.md']
    expanded = []
    for p in paths:
        matched = glob.glob(p)
        if matched:
            expanded.extend(sorted(matched))
        elif os.path.isfile(p):
            expanded.append(p)

    if not expanded:
        print('[warn] no lessons files found', file=sys.stderr)
        sys.exit(0)

    milestone_ver = args.milestone
    milestones_dir = '.planning/milestones'
    dest = os.path.join(milestones_dir, f'{milestone_ver}-LESSONS.md')

    if os.path.exists(dest):
        print(f'[warn] archive already exists: {dest} — skipping')
        sys.exit(0)

    os.makedirs(milestones_dir, exist_ok=True)

    with open(dest, 'w', encoding='utf-8') as out:
        out.write(f'# Lessons Archive — {milestone_ver}\n\n')
        for i, filepath in enumerate(expanded):
            if not os.path.isfile(filepath):
                print(f'[warn] file not found: {filepath}', file=sys.stderr)
                continue
            out.write(f'---\n\n## Source: {os.path.basename(filepath)}\n\n')
            with open(filepath, 'r', encoding='utf-8') as f:
                out.write(f.read())
            out.write('\n\n')

    print(f'[sg-complete] archived {len(expanded)} lesson files to {dest}')


def main():
    parser = argparse.ArgumentParser(description='super-gsd lessons ranker')
    parser.add_argument('paths', nargs='*', help='lesson .md file paths or glob')
    parser.add_argument('--top', type=int, default=5, metavar='N')
    parser.add_argument('--archive', action='store_true')
    parser.add_argument('--milestone', type=str, metavar='VERSION')
    args = parser.parse_args()

    if args.archive:
        archive_mode(args)
    else:
        ranking_mode(args)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'[error] unexpected: {e}', file=sys.stderr)
        sys.exit(1)
