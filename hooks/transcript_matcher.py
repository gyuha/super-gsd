"""transcript-matcher.py

transcript 파일에서 단계 완료 신호를 감지하는 유틸리티.

detect_signal(transcript_path) -> 'gsd-plan-complete' | 'superpowers-implementation-complete' | 'superpowers-review-complete' | 'hookify-complete' | ''
"""


def detect_signal(transcript_path: str) -> str:
    """transcript에서 단계 완료 신호를 감지한다.

    Returns: 'gsd-plan-complete' | 'superpowers-implementation-complete' | 'superpowers-review-complete' | 'hookify-complete' | ''
    """
    if not transcript_path:
        return ''

    try:
        with open(transcript_path, 'r') as f:
            content = f.read()
    except (FileNotFoundError, IOError, PermissionError, UnicodeDecodeError):
        return ''

    # GSD plan-phase 완료 신호 패턴 (HOOK-01, HOOK-04)
    GSD_PLAN_SIGNALS = [
        'gsd-plan-phase',
        'plan-phase complete',
        'PLANNING COMPLETE',
        'Plans Created',
        '/gsd:execute-phase',
    ]
    # Superpowers executing-plans 완료 신호 패턴 (P1-2)
    IMPLEMENTATION_SIGNALS = [
        'Implementation complete',
        'implementation complete',
        'Branch ready for review',
        'All tasks complete',
        'finishing-a-development-branch',
    ]
    # Superpowers review 완료 신호 패턴 (HOOK-02, HOOK-04)
    REVIEW_SIGNALS = [
        'review complete',
        'Code Review Complete',
        'Review Summary',
    ]
    # Hookify 완료 신호 패턴 (LESS-01)
    HOOKIFY_SIGNALS = [
        'Retrospective complete',
        'hooks generated',
        'patterns extracted',
    ]

    # 마지막 200줄만 검사 (spurious firing 방지, HOOK-04)
    recent = '\n'.join(content.splitlines()[-200:])

    if any(sig in recent for sig in GSD_PLAN_SIGNALS):
        return 'gsd-plan-complete'
    if any(sig in recent for sig in IMPLEMENTATION_SIGNALS):
        return 'superpowers-implementation-complete'
    if any(sig in recent for sig in REVIEW_SIGNALS):
        return 'superpowers-review-complete'
    if any(sig in recent for sig in HOOKIFY_SIGNALS):
        return 'hookify-complete'
    return ''
