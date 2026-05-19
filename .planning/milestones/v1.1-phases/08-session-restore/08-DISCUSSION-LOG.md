# Phase 8: Session Restore - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 8-session-restore
**Areas discussed:** 세션 감지 임계값, 표시 정보의 깊이와 형식, Resume 시 분기 동작, 사용자 질의 UI, Fresh 선택 시 동작 정의

---

## 세션 감지 임계값 (영역 1)

| Option | Description | Selected |
|--------|-------------|----------|
| A | STATE.md 존재 + Phase 라인 캡처 가능 (권장 — Phase 7 파싱 블록 재사용, init 상태도 "세션 있음") | ✓ |
| B | HANDOFF.md 데이터 행 ≥ 1 (엄격 — 실제 인계가 한 번이라도 일어났을 때만) | |
| C | PROJECT.md 존재만으로 (관대 — gsd-new-project 시작 직후도 감지) | |
| D | A AND HANDOFF.md 존재 (보수) | |

**User's choice:** A
**Notes:** PROJECT.md만 트리거로 쓰면 gsd-new-project 중단 시 거짓 양성. HANDOFF.md 행 0개도 "init stage의 정상 세션"이라 트리거에서 제외하면 plan 전 사용자가 항상 fresh로 분류되어 의도와 불일치. STATE.md는 GSD가 초기화 후 항상 생성하므로 단일 트리거로 가장 신뢰 가능.

---

## 표시 정보의 깊이와 형식 (영역 2)

| Option | Description | Selected |
|--------|-------------|----------|
| A | 최소 — 요건 그대로 (Milestone + Stage + Last activity) | |
| B | 요건 + Phase 라인 (4개 라인) | |
| C | 요건 + Phase + Next 권장 명령 (5개 라인, 권장) | ✓ |
| D | 다른 포맷 | |

**User's choice:** C
**Notes:** Next 라인을 미리 보여주면 Resume 선택 시 어떤 명령을 칠지 사용자가 즉시 파악 → 의사결정 비용 감소. 절대시각 사용은 bash 이식성(macOS/Linux GNU date vs BSD date 호환) 때문에 채택. sg-status D-29 5라인 lock은 sg-status 전용으로 격리 — sg-start는 별도 포맷.

---

## Resume 시 분기 동작 (영역 3)

| Option | Description | Selected |
|--------|-------------|----------|
| A | emit + 안내 종료 (사용자가 Next 명령 직접 실행) | ✓ |
| B | emit + 다음 sg-* 래퍼 명령 auto-invoke (sg-execute hybrid handoff 차용) | |
| C | emit + sg-status를 invoke | |

**User's choice:** A
**Notes:** sg-execute의 hybrid handoff(02-02 D-19/D-20)는 phase plan 완성 → execute 진행이라는 강한 인과가 정당화. sg-start의 resume은 사용자가 plan을 다시 읽거나, 코드를 확인하거나, 휴식 후 컨텍스트 회복 등 다양한 의도가 가능 → 자동 invoke 시 의사결정 권한 침해. sg-status 재invoke는 영역 2의 출력과 중복.

---

## 사용자 질의 UI (영역 4)

| Option | Description | Selected |
|--------|-------------|----------|
| A | AskUserQuestion 인터랙티브 단독 (권장 — GSD 표준 패턴) | ✓ |
| B | Argument 기반 단독 (`--resume`/`--fresh`, 인터랙티브 없음) | |
| C | 이중 모드 (argument 있으면 비대화형, 없으면 인터랙티브) | |

**User's choice:** A
**Notes:** 이중 모드는 단일 사용 시나리오 대비 과설계. Argument 단독은 새 사용자가 default 동작을 모름. AskUserQuestion 단독이 GSD 표준 패턴이며, 비-Claude 런타임은 텍스트 모드로 자동 fallback. 본 토론 자체가 텍스트 모드로 진행됨 — 패턴 검증됨.

---

## Fresh 선택 시 동작 정의 (영역 5)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Fresh = sg-new로 위임 (단순 2-옵션) | |
| B | Fresh = no-op + 안내 메시지 | |
| C | 3-옵션 구조: Resume / Start new milestone / Cancel (권장) | ✓ |
| D | 다른 의견 | |

**User's choice:** C
**Notes:** "Fresh" 라벨이 의미 다층(새 milestone? 프로젝트 폐기? 안내 무시?). 3-옵션으로 명시 분리하면 모호성 제거. Start new milestone → sg-new 위임은 의도 명확. Cancel은 안전 종료 — "안내가 잘못 떴다"는 사용자 의도를 흡수. SESS-04(HANDOFF.md 보존)는 세 옵션 모두 HANDOFF.md를 read-only로만 접근하므로 자연 충족.

---

## Claude's Discretion

- 안내 헤더 문자열 (영문 vs 한글) — PROJECT.md 영문 OSS surface 정책 권장이지만 PLAN.md에서 최종 결정.
- 5개 표시 라인의 정렬(좌측 정렬 vs 라벨 너비 통일, dot-leader 사용 여부) — sg-health D-05 dot-leader 패턴 참고 가능하지만 강제 아님.
- "Last activity" fallback 표기(`(unknown)` vs `(none)`) — sg-status의 `(none)` 어휘 일관성 권장이지만 Claude 재량.
- AskUserQuestion option description 문구의 세부 표현.

## Deferred Ideas

- 상대시각 표시("3일 전") — bash 이식성 확보 후 v1.2 재검토.
- Argument 기반 비대화형 모드(`sg-start --resume`/`--cancel`) — CI/스크립팅 수요 발생 시 v1.2.
- 7일 초과 stale 세션 경고 — REQUIREMENTS.md Future Requirements (v1.2).
- 서브디렉토리 cwd walk-up — REQUIREMENTS.md Future Requirements (v1.2).
- `sg-status --json` — Future Requirements (v1.2).
- 자동화 테스트 자산 — Phase 7 D-08 노선 유지, 변경 빈도 증가 시 v1.2 재검토.
- 세션 폐기/리셋 기능 — SESS-04(append-only)와 충돌 위험으로 스코프 밖.
