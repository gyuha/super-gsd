---
phase: 41
slug: team-documentation
title: "팀 문서화 — TEAM.md + README Team Workflow 섹션"
milestone: v2.8
requirements:
  - DOC-01
  - DOC-02
status: context-done
created: 2026-05-29
---

# Phase 41: 팀 문서화 — Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

`TEAM.md`와 `README.md` Team Workflow 섹션을 작성하여, 팀원이 super-gsd 팀 워크플로우(브랜치 전략, 파일 소유권, sg-status --team, sg-execute 브랜치 생성)를 독립적으로 온보딩할 수 있도록 한다.

- **DOC-01**: `.planning/TEAM.md` — 브랜치 전략, 파일 소유권 규칙, merge 순서 컨벤션 문서화
- **DOC-02**: `README.md` Team Workflow 섹션 — git user.name 설정 확인 + `sg-status --team` 사용법

이 phase는 신규 파일 2개(`TEAM.md`, `README.ko.md` 동기화 포함 실질적으로 3개)를 작성하는 **순수 문서화 phase**다. 코드 로직 변경 없음.

</domain>

<decisions>
## Implementation Decisions

### A. TEAM.md 위치

**결정: `.planning/TEAM.md` (project root 아님)**

ROADMAP.md Phase 41 Success Criteria 1번과 REQUIREMENTS.md DOC-01이 모두 `.planning/TEAM.md`로 명시하고 있다. 이는 locked requirement이므로 project root 배치 대신 `.planning/TEAM.md`로 생성한다.

근거: `.planning/` 디렉토리는 GSD 플래닝 아티팩트 컨벤션 공간이며, TEAM.md는 팀 워크플로우 컨벤션 문서로서 플래닝 아티팩트와 동일 위상이다.

---

### B. TEAM.md 문서 언어 및 대상 독자

**결정: 영문 작성, 기술 온보딩 가이드 수준**

README.md와 동일하게 영문으로 작성한다. 대상 독자는 super-gsd가 이미 설치된 팀원으로, git user.name 설정과 sg-execute 브랜치 워크플로우를 처음 접하는 사람이다.

---

### C. TEAM.md 콘텐츠 범위

**결정: 3개 섹션 (브랜치 전략, 파일 소유권, merge 순서) + Quick Start**

ROADMAP success criteria 1번을 그대로 이행하는 최소 구조:

1. **Quick Start** — git user.name 설정 1-liner + 동작 확인
2. **Branch strategy** — `phase/{N}-{slug}` 명명 규칙, sg-execute 브랜치 생성 흐름
3. **File ownership** — STATE.md, ROADMAP.md, HANDOFF.md 각 파일을 누가/언제 수정하는지
4. **Merge order** — phase branch → main, PR 생성 (`gh pr create --base main`) 패턴

sg-execute 브랜치 생성 워크플로우(Phase 40 구현)와 sg-status --team(Phase 39 구현) 사용법을 포함한다.

---

### D. README.md 섹션 제목 및 위치

**결정: `## Team Workflow` 섹션 제목, Installation 섹션 바로 앞에 삽입**

ROADMAP success criteria 2번 원문: "README.md에 'Team Usage' 섹션". 단, 사용자 제공 컨텍스트에서 `## Team Workflow`로 명시했으므로 이를 따른다.

현재 README.md 섹션 순서:
```
... Commands → Phase management → Usage Examples → Installation → Multi-Platform → Prerequisites → Verify install → Roadmap
```

`## Team Workflow` 섹션은 **Usage Examples 뒤, Installation 앞**에 삽입한다. "사용 방법" 흐름상 자연스러운 위치이며, 설치 섹션과 별도로 팀원이 쉽게 발견할 수 있다.

README.md Team Workflow 섹션 포함 내용:
- git user.name 설정 확인 방법 (1-liner)
- sg-status --team 사용법 및 출력 예시
- sg-execute 브랜치 생성 흐름 간략 설명 (TEAM.md 링크)

---

### E. README.ko.md 동기화

**결정: ROADMAP success criteria 3번 준수 — 동일 내용 한국어로 동기화**

README.md Team Workflow 섹션 추가와 동시에 README.ko.md에도 동일 섹션을 한국어로 추가한다. 섹션 제목은 `## 팀 워크플로우`.

---

### F. AGENTS.md 업데이트

**결정: 추가하지 않음**

REQUIREMENTS.md DOC-01/DOC-02 모두 AGENTS.md를 언급하지 않는다. 범위를 locked requirements로 제한한다. AGENTS.md는 Codex/Gemini 사용자 대상 파일로, 팀 워크플로우 문서화와 관계가 적다.

---

### G. pairwise 컨벤션 적용 여부

**결정: 해당 없음**

이 phase는 문서 파일(`TEAM.md`, `README.md`, `README.ko.md`) 작성이며, `skills/` + `.agents/skills/` 쌍 커버 컨벤션은 SKILL.md 수정 시에만 적용된다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 41 요구사항 원문
- `.planning/REQUIREMENTS.md` §DOC-01, §DOC-02 — TEAM.md 위치(`.planning/TEAM.md`) 및 README 팀 섹션 요구사항 전문
- `.planning/ROADMAP.md` §Phase 41 — Success Criteria 3개 전문 (`.planning/TEAM.md`, README 팀 섹션, README.ko.md 동기화)

### 선행 구현 (콘텐츠 소스)
- `.planning/phases/40-sg-execute-branch-workflow/40-CONTEXT.md` — 브랜치 전략 결정사항: `phase/{N}-{slug}` 명명, Step 1.5 AskUserQuestion 흐름, PR 안내 방식
- `.planning/phases/39-handoff-user-tracking/39-CONTEXT.md` — sg-status --team 출력 형식, HANDOFF.md User 컬럼 스키마, GIT_USER 추출 스니펫

### 수정 대상 파일
- `README.md` — `## Team Workflow` 섹션 삽입 대상. 현재 섹션 구조 확인 후 Usage Examples 뒤에 삽입
- `README.ko.md` — `## 팀 워크플로우` 섹션 동기화 대상
- `.planning/TEAM.md` — 신규 생성 대상

### 아키텍처 컨벤션
- `CLAUDE.md` §사용자 언어 메시지 — README/TEAM.md는 영문, 응답 시 한국어 입력이면 한국어 산문 출력

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `skills/sg-execute/SKILL.md` Step 1.5 — 브랜치 생성 AskUserQuestion 흐름과 `phase/{PHASE_PAD}-{BRANCH_SLUG}` 명명 패턴이 이미 구현됨. TEAM.md 브랜치 전략 섹션은 이 로직을 서술해야 한다.
- `skills/sg-phase/SKILL.md` Step 4i — PR 안내 로직 (`gh pr create --base main --title "phase/${PHASE_SLUG}"`). TEAM.md merge 순서 섹션의 근거.
- `skills/sg-status/SKILL.md` — `--team` 플래그 처리. TEAM.md와 README Team Workflow 섹션에서 사용법을 설명할 때 참조.

### Established Patterns

- **README 섹션 구조**: `## What this is` → `## Workflow` → `## Commands` → `## Usage Examples` → *(신규 Team Workflow)* → `## Installation` — 기존 순서 유지 후 삽입
- **HANDOFF.md 6열 스키마**: `| Timestamp | Phase | From | To | Plan Hash | User |` — TEAM.md 파일 소유권 섹션에서 HANDOFF.md를 언급할 때 스키마 명시

### Integration Points

- `README.md`의 `## Usage Examples` 뒤, `## Installation` 앞이 `## Team Workflow` 삽입 지점
- `.planning/TEAM.md`는 신규 파일이므로 `.planning/` 디렉토리 내 기존 파일과 충돌 없음

</code_context>

<specifics>
## Specific Ideas

- TEAM.md Quick Start 예시:
  ```bash
  # Verify your git identity is set
  git config user.name
  # Expected: your name. If empty: git config --global user.name "Your Name"
  ```

- README Team Workflow 섹션 예시 출력:
  ```
  ## 팀 현황

  | 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |
  | ---- | --------- | --------- | ---------- |
  | Alice | 41-team-docs | plan | 2026-05-29T10:00Z |
  ```

- 브랜치명 예시: `phase/41-team-documentation`

- TEAM.md 파일 소유권 테이블 형식 (3개 파일):
  | File | Owner | When modified |
  |------|-------|---------------|
  | `.planning/STATE.md` | GSD (auto) | After each sg-* command via gsd-sdk |
  | `.planning/ROADMAP.md` | Human | Phase planning decisions only |
  | `.planning/HANDOFF.md` | super-gsd (auto) | Append-only at each sg-* command |

</specifics>

<deferred>
## Deferred Ideas

- AGENTS.md 팀 워크플로우 섹션 — REQUIREMENTS에 없음, 향후 v2.9에서 필요 시 추가
- STATE.md per-user 분리 (`STATE-{username}.md`) — REQUIREMENTS.md Future Requirements 항목, v2.9 후보
- 팀원별 phase 할당 기능 — v2.9 이후

None — discussion stayed within phase scope

</deferred>

---

*Phase: 41-team-documentation*
*Context gathered: 2026-05-29*
