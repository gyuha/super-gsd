# Phase 42: Smart Default Lens + Lens Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 42-smart-default-lens
**Areas discussed:** Smart Default 구성, Lens Consolidation 범위, Dropped Lens Argument 처리, AskUserQuestion Fallback, Pairwise Sync

**Mode:** Auto mode (대화형 AskUserQuestion 미사용) — ROADMAP/REQUIREMENTS의 명시적 success criteria가 대부분의 gray area를 lock-in 했으므로, 남은 결정은 codebase 데이터(lens 사용 빈도)와 컨벤션(skills/.agents/ pairwise, surgical 변경)으로부터 도출.

---

## Smart Default 구성 (D-01, D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| `dspm+ssc` 고정 | ROADMAP SC#1이 명시한 조합 | ✓ |
| `ssc` 단독 | 가장 가벼운 default; 행동 변화에만 집중 | |
| Phase 종류 기반 적응형 | 단순/복잡 phase 자동 분기 | |

**User's choice:** `dspm+ssc` 고정 — ROADMAP Phase 42 Success Criteria #1이 본문에서 `smart default lens(dspm+ssc)`로 명시했으므로 다른 선택지가 없음.
**Notes:** 적응형 default는 REQUIREMENTS.md "Future Requirements (deferred)"에 이미 등록됨 → v3.x 이후 후보. 실행 순서는 dspm → ssc (기술 회고 → 행동 권고 자연 흐름).

---

## Lens Consolidation 범위 — 어떤 3개를 유지할 것인가 (D-03, D-04, D-05)

| Option | Description | Selected |
|--------|-------------|----------|
| 유지: ssc + dspm + analyze / 제거: 4ls + sail + 5why | 사용 빈도 상위 3개 + 데이터 소스 직교 | ✓ |
| 유지: ssc + dspm + 5why / 제거: 4ls + sail + analyze | root-cause 분석 보존 | |
| 유지: ssc + dspm + sail / 제거: 4ls + 5why + analyze | metaphor lens 보존 | |
| 유지: 4ls + dspm + analyze / 제거: ssc + sail + 5why | emotional + technical 균형 | |

**User's choice:** ssc + dspm + analyze 유지.
**Notes:**
- 빈도 데이터(`grep -h "^## Lens:" .planning/lessons/*.md | sort | uniq -c | sort -rn`): dspm=11, ssc=9, analyze=6, sail=5, 4ls=5, 5why=3.
- analyze는 빈도 외에도 **유일하게 세션 transcript(JSONL)를 데이터 소스로 쓰는 lens** — 다른 lens로 대체 불가능.
- 4ls/sail은 dspm/ssc 카테고리와 1:1 매핑 가능(중복 의도). 사용자 정의 복원은 deferred로 기록.
- 5why는 사용 빈도 최저 + 5번의 AskUserQuestion 흐름이 본 milestone의 "마찰 제거" 목표와 직접 충돌. 향후 `sg-rca` 같은 별도 skill로 분리하는 옵션을 deferred에 기록.

---

## Dropped Lens Argument 처리 (D-06, D-07)

| Option | Description | Selected |
|--------|-------------|----------|
| 명시적 에러로 거부 (`exit 1`) | 행동 변화를 숨기지 않음; 향후 디버깅 용이 | ✓ |
| 가장 가까운 lens로 silent mapping | sail→dspm, 4ls→ssc, 5why→dspm | |
| Deprecated 경고 + 실행 | 점진적 마이그레이션 | |
| AskUserQuestion으로 fallback | 사용자가 다시 고르도록 | |

**User's choice:** 명시적 에러로 거부.
**Notes:** 멀티 lens 인자(`sail dspm`)에서도 첫 dropped 발견 즉시 거부 — 부분 실행 금지. 에러 메시지에 `removed in v2.9` 버전을 명시해서 사용자가 CHANGELOG로 찾아갈 수 있게 함.

---

## AskUserQuestion Fallback 제거 vs 유지 (D-08, D-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Step 2의 AskUserQuestion 블록 완전 삭제 | 도달 불가능 코드 제거; Phase 43에서 `--pick`으로 재도입 | ✓ |
| 유지하되 fallback 안전장치로 보존 | 미래 분기 안전성 | |
| Smart default 실패 시에만 fallback | hybrid | |

**User's choice:** 완전 삭제.
**Notes:** 인자 없음 → smart default, 잘못된 인자 → 에러 경로 → AskUserQuestion 진입 경로가 없어짐. 죽은 코드 유지는 surgical 컨벤션과 충돌. Phase 43의 `--pick` flag(LENS-03)가 명시적 lens 선택 UI를 담당.

---

## Pairwise Sync 범위 (D-10, D-11)

| Option | Description | Selected |
|--------|-------------|----------|
| `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md` 두 파일만 | ROADMAP SC#3 직접 명시 | ✓ |
| 위 + `skills/sg-learn/SKILL.md` + `.agents/skills/sg-learn/SKILL.md` 도 함께 | 4개 파일 sync | |

**User's choice:** sg-retro 2개 파일만.
**Notes:** sg-learn은 `Skill(skill="sg-retro", args="$ARGUMENTS")` 한 줄의 thin pass-through. Out of scope 명시("sg-retro skill rewrite — 기존 구조 유지, surgical 변경만")와 일치. sg-retro 변경이 자동으로 sg-learn에 반영됨.

---

## Claude's Discretion

- 에러 메시지 영문/한글 양식: 머신 토큰(`sail`, `ssc`, `dspm`)은 영문 그대로, 산문은 사용자 언어 자동 감지(CLAUDE.md 컨벤션).
- Step 2 케이스 매핑 코드 스타일: case-statement vs if-elif는 planner 재량.
- Smart default 진입 시 stderr 로그(`Using smart default lens: dspm + ssc`) 출력 여부: planner 재량. 암묵적 동작 명시 vs 출력 잡음 축소의 trade-off.

## Deferred Ideas

- Phase 종류 기반 적응형 default (v3.x).
- `--pick` flag → Phase 43.
- Action Items P1 시각 강조 + lens 의도 설명 줄 → Phase 43.
- README/TEAM.md 문서 동기화 → Phase 44.
- Five Whys lens 별도 `sg-rca` skill 분리 가능성 (backlog).
- `sail` / `4ls` lens 사용자 정의 복원 — 사용자 피드백 누적 후 재검토.
- Lessons 파일 archival 정책 — milestone 종료 시 별도 처리.
