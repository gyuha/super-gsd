"""transcript-matcher.py

transcript 파일에서 단계 완료 신호를 감지하는 유틸리티.

detect_signal(transcript_path) -> 'gsd-plan-complete' | 'superpowers-review-complete' | ''
"""


def detect_signal(transcript_path: str) -> str:
    """transcript에서 단계 완료 신호를 감지한다.

    Returns: 'gsd-plan-complete' | 'superpowers-review-complete' | ''
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
        'PLAN.md',
    ]
    # Superpowers review 완료 신호 패턴 (HOOK-02, HOOK-04)
    REVIEW_SIGNALS = [
        'code-reviewer',
        'requesting-code-review',
        'review complete',
    ]

    # 마지막 200줄만 검사 (spurious firing 방지, HOOK-04)
    recent = '\n'.join(content.splitlines()[-200:])

    if any(sig in recent for sig in GSD_PLAN_SIGNALS):
        return 'gsd-plan-complete'
    if any(sig in recent for sig in REVIEW_SIGNALS):
        return 'superpowers-review-complete'
    return ''
