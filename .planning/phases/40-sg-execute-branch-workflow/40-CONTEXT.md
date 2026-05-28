---
phase: 40
slug: sg-execute-branch-workflow
title: "sg-execute 브랜치 워크플로우 + PR 안내"
milestone: v2.8
requirements:
  - TEAM-03
  - TEAM-04
status: context-done
created: 2026-05-28
---

# Phase 40: sg-execute 브랜치 워크플로우 + PR 안내 - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

`sg-execute`가 main/master 브랜치에서 phase 작업 시작을 감지하면 `phase/{N}-{slug}` 브랜치 생성을 제안하고, phase 완료 시(`sg-complete [N]`) PR 생성 명령을 안내한다.

- **TEAM-03**: sg-execute — 브랜치 감지 + 생성 제안
- **TEAM-04**: sg-complete (phase 완료 경로) — PR 생성 안내

이 phase는 기존 sg-execute와 sg-complete의 흐름 안에 브랜치/PR 관련 단계를 삽입하는 것이다. 새 명령 추가 없음.

</domain>

<decisions>
## Implementation Decisions

### A. 브랜치 감지 위치 (TEAM-03)

**결정: phase resolve 직후(Step 1 이후) — 빠른 피드백**

sg-execute의 Step 1 (phase resolve) 완료 직후, Step 2 (phase directory locate) 전에 브랜치 감지를 삽입한다.

```
Step 1: Resolve phase  ← 기존
Step 1.5: 브랜치 감지 + 제안  ← 신규 삽입
Step 2: Locate phase directory  ← 기존 (이후 그대로)
```

근거: 불필요한 작업(PLAN.md 파싱, 해시 계산 등) 없이 즉시 피드백. phase 번호를 알아야 브랜치명을 제안할 수 있으므로 Step 1 이후가 자연스러운 위치.

---

### B. feature 브랜치 판정 기준 (TEAM-03)

**결정: main/master 이외면 전부 제안 없음 — 단순하고 일반적**

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  # → 브랜치 생성 제안
else
  # → 제안 없이 기존 흐름 그대로 진행
fi
```

- `develop`, `release/*`, `hotfix/*`, `phase/*` 등 main/master 이외의 모든 브랜치에서는 이미 feature 브랜치 작업 중으로 간주
- git 미설치나 non-git 환경(`unknown`)에서도 제안 없이 기존 흐름 유지

---

### C. 브랜치 생성 제안 방식 (TEAM-03)

**결정: AskUserQuestion으로 제안 — 사용자 동의 시 `git checkout -b` 실행**

```
Step 1.5 로직:
  1. git rev-parse --abbrev-ref HEAD 로 현재 브랜치 확인
  2. main/master이면:
     a. BRANCH_NAME="phase/{PHASE_PAD}-{slug}" 계산
        (slug는 PHASE_DIR 탐색 전이면 ROADMAP.md에서 phase 이름으로 생성)
     b. AskUserQuestion:
          header: "Branch"
          question: "현재 main 브랜치입니다. phase/{N}-{slug} 브랜치를 생성하고 전환할까요?"
          options: ["Create branch (권장)", "Skip — main에서 계속"]
     c. "Create branch" 선택 시: git checkout -b {BRANCH_NAME} 실행 후 계속
     d. "Skip" 선택 시: 제안 없이 기존 흐름 그대로 진행
  3. main/master 이외이면: 이 step 전체 건너뜀
```

브랜치명 계산: `PHASE_PAD=$(printf "%02d" $PHASE_NUM)`, slug는 ROADMAP.md의 `### Phase N:` 헤더 뒤 이름을 소문자/하이픈으로 정규화. 단, PHASE_DIR이 아직 탐색 안 된 시점이므로 ROADMAP.md 기반으로 직접 추출.

---

### D. PR 안내 위치 (TEAM-04)

**결정: sg-complete → sg-phase complete 위임 경로 안에 PR 안내 추가**

`sg-complete [N]` (bare number) → `sg-phase complete` 경로에서 step 4h (확인 메시지 출력) 이후에 PR 안내를 삽입한다.

```
sg-phase complete Step 4h: 확인 출력  ← 기존
Step 4i: PR 생성 안내 (신규)           ← 신규 삽입
```

sg-complete의 milestone-close 경로(version / current-milestone)에는 PR 안내를 추가하지 않는다 — phase 완료와 milestone 종료는 다른 컨텍스트.

---

### E. PR 안내 방식 (TEAM-04 / ROADMAP SC 3번 준수)

**결정: 명령어 텍스트 출력만 — 자동 실행 없음, 사용자가 직접 실행**

PR 자동 생성 없음. gh CLI 존재 여부를 확인하고 실행할 명령만 텍스트로 출력.

```bash
# Step 4i (sg-phase complete 내부에 추가)
if command -v gh >/dev/null 2>&1; then
  echo "PR을 생성하려면:"
  echo "  gh pr create --base main --title \"phase/{PHASE_PAD}-{slug}\""
else
  echo "PR을 생성하려면 현재 브랜치를 push한 뒤 GitHub에서 PR을 여세요:"
  echo "  git push -u origin HEAD"
fi
```

- gh CLI 있음: `gh pr create --base main --title "phase/{N}-{slug}"` 출력
- gh CLI 없음: `git push -u origin HEAD` + GitHub URL 패턴 안내 출력
- 출력 메시지는 사용자 언어로 표면화 (`<language>` 지침 준수)
- PR 안내는 현재 브랜치가 phase/* 브랜치일 때만 의미 있으나, 조건 분기 없이 항상 출력 (단순성 우선)

---

### F. .agents/ 쌍 커버 (CLAUDE.md 컨벤션)

**결정: skills/sg-execute + .agents/skills/sg-execute 모두 동일하게 수정**
**결정: skills/sg-phase + .agents/skills/sg-phase (존재 시) 모두 동일하게 수정**

CLAUDE.md pairwise convention: `skills/` 수정 시 `.agents/skills/` 동일 파일도 반드시 수정.

```bash
ls .agents/skills/sg-execute/SKILL.md 2>/dev/null
ls .agents/skills/sg-phase/SKILL.md 2>/dev/null
```

두 파일 모두 존재하면 동일 변경 적용 (별도 plan item 또는 checklist로 명시).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 40 요구사항 원문
- `.planning/REQUIREMENTS.md` §TEAM-03, §TEAM-04 — TEAM-03 (sg-execute 브랜치 제안), TEAM-04 (sg-complete PR 안내) 요구사항 전문

### 수정 대상 Skills
- `skills/sg-execute/SKILL.md` — 브랜치 감지 Step 1.5 삽입 대상. Step 1 이후, Step 2 이전 위치에 삽입
- `skills/sg-phase/SKILL.md` — PR 안내 Step 4i 삽입 대상. Step 4h 이후 위치에 삽입
- `.agents/skills/sg-execute/SKILL.md` — pairwise 동기화 대상 (존재 여부 확인 후 동일 변경)
- `.agents/skills/sg-phase/SKILL.md` — pairwise 동기화 대상 (존재 여부 확인 후 동일 변경)

### Phase 39 선례 (User 컬럼 추가 패턴)
- `.planning/phases/39-handoff-user-tracking/39-CONTEXT.md` — GIT_USER 추출 스니펫, HANDOFF.md 6열 스키마, .agents/ 쌍 처리 패턴

### 아키텍처 컨벤션
- `CLAUDE.md` §macOS 셸 이식성 — grep -E만 (grep -P 금지), Read 도구 기반 파일 파싱
- `CLAUDE.md` §skills/ + .agents/ 쌍 커버 컨벤션 — 쌍 누락 시 코드 리뷰 블로커
- `CLAUDE.md` §사용자 언어 메시지 — 산문은 사용자 언어, 머신 토큰은 영문 그대로

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `skills/sg-execute/SKILL.md` Step 1 — PHASE_NUM resolve 완료 직후가 삽입 지점. `$PHASE_NUM`, `$PHASE_PAD` 변수가 이미 확정된 상태
- `skills/sg-phase/SKILL.md` Step 4h — 확인 출력 직후가 PR 안내 삽입 지점. `$PHASE_SLUG`, `$PHASE_PAD` 변수가 이미 존재
- Phase 39에서 구축된 `GIT_USER=$(git config user.name 2>/dev/null || echo "-")` 스니펫 — git 환경 가드 패턴을 동일하게 적용
- `HANDOFF.md` 6열 스키마 (`| Timestamp | Phase | From | To | Plan Hash | User |`) — Phase 39에서 완성됨, 이 phase에서 수정 없음

### Established Patterns

- **AskUserQuestion 패턴**: sg-start, sg-execute 기존 분기 로직에서 사용. header 12자 이하, options 2-3개
- **git 명령 가드**: `command -v git >/dev/null` 또는 `git rev-parse 2>/dev/null || echo "unknown"` — non-git 환경 폴백
- **pairwise convention**: `skills/` 수정 → `.agents/skills/` 동일 파일도 수정 (Phase 36+37 선례)
- **Read 도구 기반 파싱**: ROADMAP.md에서 phase 이름/slug 추출은 bash awk/grep 파이프라인이 아닌 Read 도구 + Claude 해석으로 처리 (v2.5 컨벤션)

### Integration Points

- **sg-execute Step 1 → Step 1.5 삽입**: `$PHASE_NUM`, `$PHASE_PAD` 확정 후, `$PHASE_DIR` 탐색 전 — ROADMAP.md에서 slug를 직접 읽어야 함
- **sg-phase complete Step 4h → Step 4i 삽입**: `$PHASE_SLUG` 이미 확정된 상태이므로 브랜치명 재계산 불필요
- **gh CLI 감지**: `command -v gh >/dev/null 2>&1` — macOS/Linux 이식성 OK

</code_context>

<specifics>
## Specific Ideas

- 브랜치명 패턴: `phase/{PHASE_PAD}-{slug}` (예: `phase/40-sg-execute-branch-workflow`)
- PHASE_PAD는 `printf "%02d" $PHASE_NUM` 으로 생성 (sg-execute 기존 패턴과 동일)
- slug 생성: ROADMAP.md `### Phase N:` 헤더에서 phase 이름 추출 후 소문자 + 하이픈 정규화
  - 예: `sg-execute 브랜치 워크플로우 + PR 안내` → `sg-execute-branch-workflow`
  - ROADMAP.md Read 도구로 읽어서 Claude가 직접 정규화 (bash tr/sed 파이프라인 대신)
- PR 안내 텍스트는 간결하게 — 사용자가 직접 복사해서 실행할 수 있는 형태

</specifics>

<deferred>
## Deferred Ideas

- PR 자동 생성 (gh pr create 직접 실행) — Phase 40 범위 밖. ROADMAP SC 3번("명령어 텍스트 출력만")으로 명시적 제외. 향후 phase 후보
- 브랜치 존재 시 자동 전환 — 동일 브랜치명이 이미 있을 때 checkout (without -b) 분기 — 구현 복잡도 대비 실용성 낮음, 향후 필요 시 추가
- STATE.md current branch 필드 추가 — 팀원별 브랜치 추적 — v2.9 후보 (Phase 41 이후)

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-sg-execute-branch-workflow*
*Context gathered: 2026-05-28*
