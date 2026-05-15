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

import json

from transcript_matcher import detect_signal


def load_config():
    """Return super_gsd config dict from .planning/config.json, or {}."""
    try:
        with open('.planning/config.json', 'r') as f:
            cfg = json.load(f)
        return cfg.get('super_gsd', {})
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return {}


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
        elif signal == 'superpowers-review-complete':
            msg = "Superpowers review complete. Run /super-gsd:sg-learn to capture lessons with Hookify."
            print(json.dumps({"systemMessage": msg}), file=sys.stdout)
        else:
            print(json.dumps({}), file=sys.stdout)

    except Exception as e:
        print(json.dumps({"systemMessage": f"super-gsd hook error: {e}"}), file=sys.stdout)
    finally:
        sys.exit(0)


if __name__ == '__main__':
    main()
