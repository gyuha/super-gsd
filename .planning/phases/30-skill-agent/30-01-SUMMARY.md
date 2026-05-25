# Phase 30 Summary: Skill/Agent 내부 호출 교체

**Completed:** 2026-05-25
**Status:** Complete

## One-liner

8개 SKILL.md 파일(skills/ + .agents/skills/)의 모든 `python3` 호출을 `node`/`node -e`/`node hooks/*.cjs` 기반으로 교체하여 Python 의존성 완전 제거.

## What Was Done

### Task 1: skills/ — 5개 SKILL.md 교체

- `skills/sg-plan/SKILL.md`: `python3 hooks/lessons_ranker.py` → `node hooks/lessons_ranker.cjs` + Pattern C (with source) node -e 포매터
- `skills/sg-execute/SKILL.md`: 동일 두 교체 (source 없음 변형)
- `skills/sg-complete/SKILL.md`: `python3 hooks/lessons_ranker.py --archive` → `node hooks/lessons_ranker.cjs --archive`
- `skills/sg-quick/SKILL.md`: 인라인 `python3 -c` JSON 파싱 2건 → Pattern A node -e (quick_id, task_dir 추출)
- `skills/sg-ui-plan/SKILL.md`: 인라인 `python3 -c` JSON unescape → Pattern B node -e

### Task 2: .agents/skills/ — 3개 SKILL.md 교체

- `.agents/skills/sg-plan/SKILL.md`: lessons_ranker.cjs + Pattern C + Pattern B (3 교체)
- `.agents/skills/sg-execute/SKILL.md`: lessons_ranker.cjs + Pattern C (2 교체)
- `.agents/skills/sg-ship/SKILL.md`: `python3 -m pytest` → `pytest` (D-10)

## Verification

```bash
grep -rn 'python3' skills/ .agents/skills/
# 결과: 0건 ✓
```

All 14 `python3` occurrences replaced across 8 SKILL.md files. Byte-exact preservation outside replaced tokens confirmed.
