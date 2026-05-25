# Phase 29: Hook 설정 명령 교체 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 29-hook
**Areas discussed:** Auto-mode pre-decisions (사용자 직접 토론 없음, Phase 28 carry-forward + ROADMAP scope에서 도출)

---

## Discussion Mode

이 phase는 **auto-mode**에서 진행되었다. 작업 범위가 매우 좁고 (3 파일 / 7 command 문자열의 토큰 2개 교체), 결정 대부분이 Phase 28에서 잠긴 마일스톤 정책의 자연스러운 carry-forward이므로 사용자에게 별도 선택을 요구하지 않고 합리적 기본값을 채택했다.

원칙: Auto Mode 지시에 따라 "사용자에게 물어보는 대신 합리적 판단을 내리고 진행, 필요 시 사용자가 redirect한다." 결정 사항은 모두 CONTEXT.md `<decisions>`에 명시되어 있으며 사용자가 plan-phase 또는 execute 단계에서 명시적으로 다른 선택을 하면 즉시 교체 가능하다.

---

## Gray Area 1: Timeout 정책

| Option | Description | Selected |
|--------|-------------|----------|
| 기존 값 보존 (5/10초 또는 5000/10000ms) | Python과 Node startup overhead가 유사 (~50ms 범위). Phase 28 fixture run에서 모든 .cjs가 0.1초 내 응답 확인. | ✓ |
| 일률 상향 (모두 10초로) | 느린 디스크 환경 (NFS, 암호화) 대비 안전 마진. 단, 정당화 데이터 없음. | |
| 일률 하향 (Node가 빠르다는 가정) | 측정 근거 없이 감소 시 false-positive timeout 위험. | |

**Selected:** 기존 값 보존 (D-07)
**Notes:** Timeout 조정은 manual smoke test에서 timeout 발생 증거가 나오면 retro에서 다룬다. 현재는 변경 사유 없음.

---

## Gray Area 2: Command 문자열 quoting 정책

| Option | Description | Selected |
|--------|-------------|----------|
| 플랫폼별 quoting 보존 | Claude=`"${VAR}"`, Codex=`hooks/...`, Gemini=`$VAR/...` 각자 유지. Phase 29는 단일 변수(python3→node, .py→.cjs)만 변경. | ✓ |
| 모든 플랫폼에 큰따옴표 통일 | 공백 path 안전성 ↑, 그러나 Codex/Gemini의 기존 동작이 깨질 가능성. | |
| 모든 플랫폼에서 인용 제거 | Simpler, 하지만 Claude의 ${CLAUDE_PLUGIN_ROOT}에 공백 포함 시 깨짐. | |

**Selected:** 플랫폼별 quoting 보존 (D-06)
**Notes:** Surgical change principle. 한 phase에서 한 가지만 변경 — quoting 정책 변경은 별도 phase에 해당.

---

## Gray Area 3: Plan 분할 / Commit 단위

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 PLAN (3 파일) + 단일 commit | 의미 동일한 마이그레이션 step, 의존성 없음. Rollback git revert 1회. | ✓ |
| 3 PLAN (파일별) + 3 commits | 파일별 rollback 단위 ↓. 그러나 부분 적용 상태(Claude만 .cjs, Codex는 .py)가 발생 가능. | |
| 단일 PLAN + 3 commits | Plan은 묶고 commit만 분할. Git audit 세분화. | |

**Selected:** 단일 PLAN + 단일 atomic commit (D-08, D-09)
**Notes:** Phase 28의 4개 atomic-per-plan 패턴은 4개 독립 logic port에 적합했다. Phase 29는 동일 step의 7개 string replacement → 묶는 게 자연스럽다.

---

## Gray Area 4: Manual 검증 정책 (Codex/Gemini 환경)

| Option | Description | Selected |
|--------|-------------|----------|
| 4-tier 검증 (static/syntax/dry-run/manual), Codex·Gemini는 syntax-only fallback | 사용자가 두 CLI 환경을 갖췄을 가능성 낮음. Tier 1~3는 자동, Tier 4는 환경 한정. | ✓ |
| 모든 플랫폼에서 실제 hook trigger 강제 | ROADMAP의 (manual) 명시를 엄격히 해석. 그러나 검증 비용이 비대칭적. | |
| static grep만 (Tier 1) | ROADMAP Success Criterion #4만 충족. JSON 유효성·실행 가능성 가드 누락. | |

**Selected:** 4-tier (D-10, D-11)
**Notes:** ROADMAP Success Criteria #2, #3의 "manual" 절은 사용자 환경이 있을 때만 적용. 없을 때는 syntax + dry-run 통과로 충족 처리하고 VERIFY.md에 명시.

---

## Claude's Discretion

다음 항목은 사용자 입력 없이 잠정 채택. plan-phase 또는 execute에서 명시적 변경 시 즉시 적용 가능:

- D-07 (timeout 보존 vs 일률 상향)
- D-09 (단일 commit vs 파일별 분할)
- D-11 (syntax-only fallback vs 실제 CLI 검증 강제)

## Deferred Ideas

- **Timeout 튜닝** — manual smoke test 결과 후 hotfix phase에서 조정 가능.
- **JSON schema 표준화** — 3개 config의 schema가 서로 다름. 통합은 v2.5+ 후보.
- **Manual rollback runbook 문서화** — 현재 `git revert <commit>`로 충분. Phase 30/31에서 더 복잡한 rollback 시나리오 등장 시 작성.
- **Codex/Gemini 실제 hook trigger 검증** — 사용자가 환경 갖춘다면 후속 spike.
- **`#!/usr/bin/env node` shebang wrapper** — 직접 실행 편의성. Phase 28 범위 밖, v2.5+ 후보.

## Carry-forward from Phase 28

다음 결정은 Phase 28 CONTEXT.md에서 이미 잠긴 상태로 Phase 29에 carry-forward:

- D-01 (locked): `.cjs` 파일명 = Python 원본 미러링
- D-02 (locked): PLUGIN_ROOT 환경변수 처리
- D-03 (locked): `.py` 파일은 Phase 31까지 삭제 금지
- D-04 (locked): 자동 테스트 프레임워크 도입 없음, manual smoke test로 검증

Phase 29 추가 결정 (D-05~D-12)은 모두 위 잠긴 결정과 일관성을 유지한다.
