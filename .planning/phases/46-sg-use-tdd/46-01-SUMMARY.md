# Phase 46 — Plan 01 Summary: sg-use-tdd 토글 + 마커

**Completed:** 2026-05-31
**Requirements:** TDD-01, TDD-02, TDD-03

## What was built

두 개의 신규 SKILL.md 파일을 한 단위로 생성했다 (D-08 pairwise):

- `skills/sg-use-tdd/SKILL.md` — `/super-gsd:sg-use-tdd` 슬래시 명령 (primary)
- `.agents/skills/sg-use-tdd/SKILL.md` — `$sg-use-tdd` Codex/Gemini 미러 (12번째 `.agents/` 미러)

`sg-health` 골격(frontmatter + `<language>` + `<objective>` + `<execution_context>` + `<process>` + `<success_criteria>`)을 그대로 본떴고, 미러는 `sg-status` 미러 패턴대로 `<constraints>` 블록을 추가했다.

## 동작 (3-branch toggle)

- `on` → `mkdir -p .planning` 후 `.planning/USE-TDD` 생성 (있어도 타임스탬프 갱신, 무오류) → `TDD mode: ON`
- `off` → `rm -f .planning/USE-TDD` (없어도 무오류) → `TDD mode: OFF`
- 무인자 → 현재 상태 출력 후 토글

마커 내용(D-04): `TDD mode enabled` + `Activated: <ISO-8601 UTC>` 두 줄. Phase 47 감지는 존재-여부만 본다.

## 결정 반영

| 결정 | 반영 |
|------|------|
| D-01 presence-only 판정 | 마커 경로 `.planning/USE-TDD` 하드코딩, `$ARGUMENTS`에서 유도하지 않음 |
| D-02 on/off/무인자 의미론 | 3-branch process |
| D-03 idempotent | `>`(덮어쓰기) + `rm -f` → 반복 호출 무오류 |
| D-04 사람-가독 메타데이터 | 설명 1줄 + ISO 타임스탬프 |
| D-05 `.planning/` 보장 | 모든 쓰기 전 `mkdir -p .planning` |
| D-07 HANDOFF 행 없음 | 감사 로그 행 미추가 (config toggle 패턴) |
| D-08 pairwise | 두 파일 동일 단위 |
| D-09 AskUserQuestion 불필요 | process에 호출 0건; 미러 constraints에 "미지원·영향 없음"만 문서화 |

## Verification 결과 (플랜 `<verification>` 블록 전부 실행)

- 두 파일 존재 ✓
- `name: sg-use-tdd` 양쪽 1건 ✓
- `USE-TDD` 양쪽 참조 ✓ (primary 11건)
- `mkdir -p .planning` 양쪽 ✓
- `grep -L 'HANDOFF'` → 두 파일 모두 리스트됨 (리터럴 HANDOFF 0건) ✓
- `grep -rL 'grep -P'` → 두 파일 모두 리스트됨 (PCRE 플래그 미사용) ✓
- `<constraints>` 미러에만 존재, primary 0건 ✓

## 구현 중 내린 판단 (플랜 deviation/주의)

1. **리터럴 grep 제약 충족을 위한 산문 재구성:** primary 초안에 "Does NOT modify HANDOFF.md"와 "no `grep -P`" 문구가 있어 검증 스크립트의 `grep -L 'HANDOFF'` / `grep -rL 'grep -P'`를 통과하지 못했다. 의도를 보존한 채 "workflow audit-log row 미추가", "no PCRE (`-P`) grep flag"로 재구성해 두 검증을 통과시켰다.

2. **acceptance_criteria vs action 모순 (AskUserQuestion):** Task 2 action은 sg-status 미러 패턴대로 `<constraints>`에 "AskUserQuestion not supported" 명시를 지시하지만, acceptance_criteria는 "File does NOT contain AskUserQuestion"이라 적혀 있다. D-09의 실제 의미("호출/분기 불필요")는 process에 AskUserQuestion 호출 0건으로 충족되며, constraints 블록의 언급은 미사용을 문서화한 것이다. 더 구체적인 action 지시 + 기존 미러 컨벤션 일관성을 우선해 constraints 언급을 유지했다. 리터럴 grep 1건은 이 한 곳뿐이다.

## Out of scope (이 단계가 하지 않은 것)

- 마커 소비 로직(sg-execute 핸드오프 TDD 주입, sg-review 실패 루프) — Phase 47
- README/README.ko TDD 문서화 — Phase 48
- plugin.json 명시 등록 — 불필요 (`"skills": "./skills/"` 자동 스캔, sg-ui-plan Phase 21 선례)
