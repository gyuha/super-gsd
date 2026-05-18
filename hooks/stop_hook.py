#!/usr/bin/env python3
"""super-gsd Stop/SubagentStop hook.

GSD plan-phase 완료 또는 Superpowers code-reviewer 완료를 감지해
다음 단계 안내 메시지를 systemMessage로 출력한다.
"""

import os
import sys

# transcript_matcher를 이 파일과 같은 디렉토리에서 찾는다.
# Claude Code가 ${CLAUDE_PLUGIN_ROOT}/hooks/stop-hook.py로 실행할 때
# cwd가 플러그인 루트가 아닐 수 있으므로 __file__ 기반 경로를 사용한다.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import datetime
import json
import re

from transcript_matcher import detect_signal


def load_config():
    """Return super_gsd config dict from .planning/config.json, or {}."""
    try:
        with open('.planning/config.json', 'r') as f:
            cfg = json.load(f)
        return cfg.get('super_gsd', {})
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return {}


def _read_current_phase():
    """STATE.md에서 현재 phase 번호를 읽어 반환한다. 실패 시 'unknown' 반환."""
    try:
        with open('.planning/STATE.md', 'r') as f:
            content = f.read()
        m = re.search(r'^Phase:\s*(.+)', content, re.MULTILINE)
        if m:
            raw = m.group(1).strip()
            num_m = re.match(r'^([0-9]+)', raw)
            return num_m.group(1) if num_m else raw
        return 'unknown'
    except Exception:
        return 'unknown'


def _extract_hookify_output(transcript_path):
    """transcript에서 hookify 출력 부분을 추출한다. 실패 시 '' 반환."""
    try:
        with open(transcript_path, 'r') as f:
            lines = f.readlines()
        recent_text = ''.join(lines[-200:])
        for marker in ('## Lessons', '## Patterns', '## Hooks Generated', 'hookify complete'):
            idx = recent_text.rfind(marker)
            if idx != -1:
                return recent_text[idx:]
        return recent_text
    except Exception:
        return ''


def save_hookify_lessons(transcript_path):
    """hookify 출력을 .planning/lessons/{NN}-{YYYY-MM-DD}.md 로 저장한다.

    Returns: 저장된 파일 경로 또는 '' (실패/내용 없음)
    """
    try:
        phase = _read_current_phase()
        content = _extract_hookify_output(transcript_path)
        if not content:
            return ''
        today = datetime.date.today().strftime('%Y-%m-%d')
        try:
            padded = f"{int(phase):02d}"
        except (ValueError, TypeError):
            padded = phase
        filename = f"{padded}-{today}.md"
        filepath = os.path.join('.planning', 'lessons', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        if os.path.exists(filepath):
            return filepath
        with open(filepath, 'w') as f:
            f.write(f"# Lessons: Phase {phase} ({today})\n\n")
            f.write(content)
        return filepath
    except Exception:
        return ''


def main():
    try:
        input_data = json.load(sys.stdin)

        # HOOK-03: config guard — auto_advance: false 이면 즉시 종료
        cfg = load_config()
        if not cfg.get('auto_advance', True):
            print(json.dumps({}), file=sys.stdout)
            sys.exit(0)

        # HOOK-04: transcript 기반 신호 감지
        transcript_path = input_data.get('transcript_path', '')
        signal = detect_signal(transcript_path)

        if signal == 'gsd-plan-complete':
            msg = "GSD plan-phase complete. Run /super-gsd:sg-execute to hand off to Superpowers."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        elif signal == 'superpowers-implementation-complete':
            msg = "Superpowers implementation complete. Run /super-gsd:sg-review to request a code review."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        elif signal == 'superpowers-review-complete':
            msg = "Superpowers review complete. Run /super-gsd:sg-learn to capture lessons with Hookify."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        elif signal == 'hookify-complete':
            lesson_file = save_hookify_lessons(transcript_path)
            if lesson_file:
                msg = (
                    f"Hookify complete. Lessons saved to {lesson_file}. "
                    "Run /super-gsd:sg-plan to start the next phase — prior lessons will be included as context."
                )
            else:
                msg = "Hookify complete. Run /super-gsd:sg-plan to start the next phase."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        else:
            print(json.dumps({}), file=sys.stdout)

    except Exception as e:
        print(json.dumps({"systemMessage": f"super-gsd hook error: {e}"}), file=sys.stdout)
    finally:
        sys.exit(0)


if __name__ == '__main__':
    main()
