# Phase 40: sg-execute 브랜치 워크플로우 + PR 안내 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 40-sg-execute-branch-workflow
**Areas discussed:** 브랜치 감지 위치, feature 브랜치 판정 기준, PR 안내 위치, PR 안내 방식

**Mode:** 사용자가 gsd-discuss-phase 호출 전 4개 회색지대를 모두 결정하여 전달. 인터랙티브 질의 없이 결정 사항을 CONTEXT.md에 문서화.

---

## 브랜치 감지 위치 (TEAM-03)

| Option | Description | Selected |
|--------|-------------|----------|
| phase resolve 직후 (Step 1 이후) | 빠른 피드백 — PLAN.md 파싱 등 불필요한 작업 없이 즉시 제안 가능 | ✓ |
| PLAN.md 파싱 이후 | PHASE_DIR, PLAN_HASH 등 충분한 정보 확보 후 — 더 늦은 단계 | |

**User's choice:** phase resolve 직후(Step 1 이후) — 빠른 피드백을 위해
**Notes:** Step 1에서 PHASE_NUM이 확정되면 브랜치명(`phase/{N}-{slug}`)을 바로 제안할 수 있으므로 이 지점이 가장 자연스럽다. Step 2 이전.

---

## feature 브랜치 판정 기준 (TEAM-03)

| Option | Description | Selected |
|--------|-------------|----------|
| main/master 이외면 전부 제안 없음 | 단순하고 일반적 — develop, hotfix/* 등 모두 포함 | ✓ |
| phase/* 브랜치만 제외 | 다른 feature 브랜치에서도 제안할 수 있음 | |
| 화이트리스트 방식 | 특정 브랜치명 패턴만 "안전" 간주 — 복잡도 높음 | |

**User's choice:** main/master 이외면 전부 제안 없음
**Notes:** 단순하고 일반적인 기준. git 미설치나 non-git 환경에서도 `unknown`으로 처리되어 안전하게 기존 흐름 유지.

---

## PR 안내 위치 (TEAM-04)

| Option | Description | Selected |
|--------|-------------|----------|
| sg-complete → sg-phase complete 위임 시 처리 | sg-phase complete Step 4h 이후 PR 안내 삽입 | ✓ |
| sg-complete 직접 처리 | sg-complete의 bare number 경로에 직접 삽입 | |
| sg-ship 이후 | ship 단계에 PR 안내 — phase complete와 분리 | |

**User's choice:** sg-phase complete 단계에 추가 (sg-complete → sg-phase complete 위임 시 처리)
**Notes:** sg-complete의 bare number 경로는 이미 sg-phase complete에 위임하므로, sg-phase complete의 Step 4h 확인 출력 직후에 삽입. milestone-close 경로(version / no-arg)에는 추가하지 않음.

---

## PR 안내 방식 (TEAM-04 / ROADMAP SC 3번)

| Option | Description | Selected |
|--------|-------------|----------|
| 명령어 텍스트 출력만 + 사용자가 직접 실행 | ROADMAP SC 3번 준수 — 안전하고 명확 | ✓ |
| gh pr create 자동 실행 | 편리하지만 사용자 동의 없이 PR 생성 — SC 3번 위배 | |
| AskUserQuestion으로 확인 후 자동 실행 | SC 3번 허용 범위이나 과도한 상호작용 | |

**User's choice:** 명령어 텍스트 출력만 + 사용자가 직접 실행 (ROADMAP SC 3번 준수)
**Notes:** gh CLI 존재 여부에 따라 `gh pr create --base main` 또는 `git push -u origin HEAD` 명령을 출력. 자동 실행 없음. 사용자 언어로 표면화.

---

## Claude's Discretion

- 브랜치명 slug 생성 방식: ROADMAP.md phase 이름에서 소문자+하이픈 정규화 — Read 도구 + Claude 해석 (bash tr/sed 대신)
- PR 안내 출력 조건: 현재 브랜치 체크 없이 항상 출력 (단순성 우선)
- .agents/ 쌍 커버: sg-execute, sg-phase 각각 .agents/ 파일 존재 확인 후 동일 변경

## Deferred Ideas

- PR 자동 생성 (gh pr create 직접 실행) — ROADMAP SC 3번으로 명시적 제외. 향후 phase 후보
- 브랜치 중복 시 자동 전환 (`git checkout` without `-b`) — 복잡도 대비 실용성 낮음
- STATE.md current branch 필드 추가 — v2.9 후보
