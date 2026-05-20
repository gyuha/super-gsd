---
quick_id: 260521-0kt
description: hookify 종속성 제거 — sg-retro SKILL.md + sg-health.md
date: 2026-05-21
commit: 70df4d3
status: complete
---

## What Was Done

- `skills/sg-retro/SKILL.md`: "hookify rule drafts" → "sg-rule drafts" 10곳 교체
- `commands/sg-health.md`: Hookify 체크 FAIL++ → OPTIONAL (선택적 의존성) 변경

## Files Changed

- `skills/sg-retro/SKILL.md` — lines 7, 253, 266, 363, 366, 369, 372, 523, 546, 547
- `commands/sg-health.md` — lines 35-42 (Hookify 섹션)

## Not Changed (intentional)

- `commands/sg-start.md` — "hookify" stage enum 값 유지 (HANDOFF.md 하위 호환)
- `commands/sg-status.md` — 동일 이유
- `commands/sg-update.md` — Phase 13에서 이미 수정됨
