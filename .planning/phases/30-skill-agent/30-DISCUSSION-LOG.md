# Phase 30: Skill/Agent 내부 호출 교체 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 30-skill-agent
**Areas discussed:** 인라인 python3 -c 교체 전략, sg-ship pytest 라인 처리, Plan 분할 / Commit 단위, Verify gate 작성 규칙

**Mode:** Auto Mode (사용자 비대면) — 사용자가 사전 컨텍스트로 4개 gray area를 명시했고, AskUserQuestion 도구가 비활성 상태였다. 각 gray area에 대해 "권장 옵션 + 근거 + 사용자 override 시나리오"를 명시하여 plan-phase 또는 execute에서 사용자가 즉시 교체 가능한 형태로 잠정 결정을 잠갔다.

---

## Area 1: 인라인 `python3 -c` 교체 전략 (`node -e` vs `jq`)

| Option | Description | Selected |
|--------|-------------|----------|
| `node -e` 단일 채택 | Node 18+ Claude Code 런타임 보장과 일관. `python3 -c`의 셸 quoting 패턴 그대로 이식 가능 | ✓ |
| `jq` 단일 채택 | 더 짧은 syntax. 단 macOS/Linux 환경 변동성(미설치 가능). 의존성 추가 = REQUIREMENTS.md "동기" 위배 | |
| 하이브리드 (간단=jq, 복잡=node) | 분기 복잡도 증가. 사용자가 두 의존성 모두 확인 필요 | |

**Selected option (D-07):** `node -e` 단일 채택
**Notes:** REQUIREMENTS.md PROJECT.md L34에서 `node -e` / `jq` / `node hooks/*.cjs` 셋 다 옵션으로 제시되었지만, 의존성 보장 원칙(Phase 28 D-02 zero-dep, 사용자 환경 가변성)에 비춰 Node 단일이 일관성 우위. 사용자가 모든 환경에서 `jq` 보장 시 override 가능 (Claude's Discretion).

---

## Area 2: `.agents/skills/sg-ship/SKILL.md` L106 `python3 -m pytest` 처리

| Option | Description | Selected |
|--------|-------------|----------|
| (a) `pytest` 직접 호출 | grep gate 통과 + 분기 의도 보존 + pyproject 환경에서 거의 항상 동작 | ✓ |
| (b) 분기 자체 삭제 | grep gate 통과 + 사용자 Python 프로젝트 ship 시 test 차단 가드 제거 = 회귀 | |
| (c) `python3 -m pytest` 유지 + grep gate 예외 | ROADMAP Success Criterion #4 위배 + Phase 31 grep gate 다시 풀어야 함 | |
| (d) `node -e` wrapper | pytest가 Python이므로 의미 없음 | |

**Selected option (D-10):** `pytest` 직접 호출
**Notes:** 이 결정은 사용자 영향이 가장 큰 항목. 사용자가 `pytest` PATH 부재 시 fallback이 필요하다고 판단하면 `command -v pytest && pytest || python3 -m pytest` 추가 가능하지만 후자는 grep gate를 다시 깬다. plan-phase 진입 직후 명시 확인 권장.

---

## Area 3: Plan 분할 / Commit 단위

| Option | Description | Selected |
|--------|-------------|----------|
| Single PLAN + Single atomic commit | Phase 29 D-08/D-09 carry-forward. 8 파일이 동일 step에 속함. revert 1회 | ✓ |
| 3 PLANs (SKILL-01 / SKILL-02 / AGENT-01) | REQ 단위 분리. 부분 적용 상태 위험(`.agents` 사본만 변경 후 멈춤) | |
| 8 PLANs (파일별) | 너무 과도. 각 파일이 독립적이지만 의미 단위가 너무 작음 | |

**Selected option (D-06, D-13, D-16):** Single PLAN + Single atomic commit
**Notes:** Phase 29 retrospective(`29-2026-05-25.md` Decisions 절)에서 동일 패턴이 "3-file change cohesive and revertible in one git revert"로 검증됨. 사용자가 REQ별 git revert 단위를 원하면 3 commits로 분할 가능.

---

## Area 4: Verify gate 작성 규칙

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 29 4-tier ladder 그대로 재사용 + Phase 29 lessons P1 규칙 적용 | static grep / markdown syntax / `node -e` dry-run / Claude Code manual. JSON-escape verify, git-log-HEAD assumption 회피 | ✓ |
| 더 간단한 단일-tier (grep만) | Phase 29 lessons에서 JSON-escape false-negative + git-log-1 fragile gate가 명시적으로 보고됨. 답습 시 같은 landmine | |
| 자동 테스트 프레임워크 도입 | REQUIREMENTS.md Out of Scope | |

**Selected option (D-14, D-15):** Phase 29 4-tier ladder + Phase 29 lessons P1 적용
**Notes:** Phase 29 lessons P1 액션 아이템(`.claude/sg-rule.warn-json-escape-verify.local.md`, `.claude/sg-rule.warn-verify-gate-head-assumption.local.md`)이 아직 install되지 않았으면, Phase 30 plan-phase 작성 시 PLAN.md `<verify><automated>` 블록에서 (a) markdown source 기준 grep 패턴 사용, (b) commit hash 또는 `git rev-list --grep` 사용 — 두 규칙을 수동 적용한다.

---

## Claude's Discretion

다음 항목은 명시적 사용자 결정 없이 잠정 채택. plan-phase 또는 execute에서 사용자가 다른 선택을 하면 즉시 교체:

| Decision | 잠정 채택 | 사용자 override 시나리오 |
|----------|----------|------------------------|
| D-07 (`node -e` vs `jq`) | `node -e` | 모든 환경에서 `jq` 보장 시 `jq` 채택 |
| D-08 Pattern C multi-line | multi-line | 가독성 trade-off 받아들이면 single-line 압축 가능 |
| D-09 Single PLAN | 단일 PLAN | REQ 단위 git revert 원하면 3 commits로 분할 |
| D-10 (`pytest` 직접 호출) | `pytest` 단독 | 분기 삭제(가드 제거 회귀), 또는 grep gate 예외 명시(Phase 31 grep gate 다시 풀어야 함) — 권장 안 함 |
| D-12 (pytest fallback 미도입) | fallback 없음 | `command -v pytest && pytest || python3 -m pytest` 추가 가능 (단, 후자 grep gate 위배) |

---

## Deferred Ideas

- **공유 helper `.sh` 스크립트** — Pattern A/B/C 반복 추출. v2.4 이후 리팩토링 phase 후보.
- **`jq` 채택** — v2.5+ 후보 (Claude Code가 `jq` 번들 시 재검토).
- **sg-ship pytest fallback** — 사용자 보고 시 검토.
- **PLAN.md verify gate 자동 dry-run** — Phase 29 lessons P1, gsd-plan-checker 측 개선 외부 작업.
- **STATE.md `Phase:` roll-forward 자동화** — Phase 29 lessons P2 외부 작업.
- **자동 테스트 프레임워크** — 마일스톤 out of scope.

---

## Discussion Flow Summary

1. **load_prior_context**: PROJECT.md, REQUIREMENTS.md, STATE.md, Phase 28+29 CONTEXT.md, Phase 28+29 lessons 로드. Spike/sketch findings 없음.
2. **cross_reference_todos**: 0 matches.
3. **scout_codebase**: `.planning/codebase/` 맵 없음. `grep -rn 'python3' skills/ .agents/skills/`로 13 occurrence 확정. 추가 inventory: `CHANGELOG.md L75`, `CLAUDE.md L166/169`(Phase 31 DOC 책임), `.planning/research/{GEMINI,ANTIGRAVITY}.md`(Out of Scope) 확인.
4. **analyze_phase**: domain boundary + 4 gray area 식별. Phase 28/29 carry-forward 6개 결정 잠금.
5. **discuss_areas (Auto Mode)**: AskUserQuestion 도구 부재로 텍스트 기반 옵션 분석 후 권장 옵션 잠정 채택. 각 결정은 Claude's Discretion으로 명시.
6. **write_context**: 30-CONTEXT.md + 30-DISCUSSION-LOG.md 생성.
