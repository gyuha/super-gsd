---
quick_id: 260521-9bw
description: sg-update.md 버전 표시 추가
date: 2026-05-21
commit: 6c18cb9
status: complete
---

## What Was Done

`commands/sg-update.md` bash 블록에서 superpowers와 super-gsd 성공 분기 4곳에 버전 추출 및 조건부 STATUS 포맷을 추가했다.

## Changes

- `commands/sg-update.md`: `SUPERPOWERS_VER` / `SUPERGSD_VER` 변수 추가 (updated + installed 케이스 각 1개씩, 총 4곳)

## Before / After

```
# Before
- superpowers: updated
- super-gsd: updated

# After
- superpowers: updated (5.1.0)
- super-gsd: updated (0.0.22)
```

버전을 가져오지 못하면 괄호 없이 `updated`/`installed`만 출력 (graceful fallback).
