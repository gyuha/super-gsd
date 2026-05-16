# Phase 3: sg- Command Set & README - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3는 `sg-` prefix 명령어 세트와 문서 두 파일을 만든다.

**산출물:**
1. `commands/sg-start.md` — `/super-gsd:sg-start`
2. `commands/sg-explore.md` — `/super-gsd:sg-explore`
3. `commands/sg-plan.md` — `/super-gsd:sg-plan`
4. `commands/sg-execute.md` — `/super-gsd:sg-execute` (**to-superpowers.md 교체**)
5. `commands/sg-review.md` — `/super-gsd:sg-review`
6. `commands/sg-learn.md` — `/super-gsd:sg-learn`
7. `commands/sg-ship.md` — `/super-gsd:sg-ship`
8. `commands/sg-status.md` — `/super-gsd:sg-status` (**status.md 교체**)
9. `README.md` — 전면 개정 (설치 방법 + sg- 명령어 레퍼런스 + 흐름도)
10. `docs/COMMANDS.md` — sg- 명령어 전체 레퍼런스 (Quick-reference table + 매핑 테이블 + 예시)

**In scope:**
- 8개 명령어 파일 작성 (frontmatter + XML 4-section 본문)
- `commands/to-superpowers.md` → `commands/sg-execute.md` 교체 (로직 유지, frontmatter name 변경)
- `commands/status.md` → `commands/sg-status.md` 교체 (로직 유지, frontmatter name 변경)
- README.md 전면 재작성
- `docs/COMMANDS.md` 신규 생성
- ROADMAP.md Phase 3 항목 업데이트 (범위 변경 반영)

**Out of scope (Phase 3):**
- Stop/SubagentStop 자동 hook 등록 — Phase 4로 이동
- Hookify 결과 `.planning/lessons/` 자동 적재 — Phase 5로 이동
- sg- 명령어 자동 테스트 인프라 — v2 이후

**ROADMAP 번호 변경:**
- 구 Phase 3 (Auto-Advance Hooks) → 신 Phase 4
- 구 Phase 4 (Lessons Feedback Loop) → 신 Phase 5

</domain>

<decisions>
## Implementation Decisions

### Phase 3 범위 재정의
- **D-31:** Phase 3 범위를 "Auto-Advance Hooks"에서 "sg- Command Set & README"로 교체. 자동 훅은 신 Phase 4로 번호 이동, Lessons Feedback Loop은 신 Phase 5로. ROADMAP.md 업데이트 필요.

### 명령어 이름 체계
- **D-32:** plugin name은 `super-gsd` 유지. 명령어 파일 이름에 `sg-` prefix 적용. 결과적으로 slash command 형식은 `/super-gsd:sg-{name}`. 예: `/super-gsd:sg-plan`.
- **D-33:** 명명 철학은 **액션 동사** 기반. 기억하기 쉽고 Superpowers 워크플로우 흐름과 자연스럽게 대응.

### 명령어 세트 (8개) 및 매핑
- **D-34:** 전체 명령어 → 도구 매핑:

  | sg- 명령어 | slash command | 내부 도구 | 설명 |
  |-----------|--------------|-----------|------|
  | sg-start | `/super-gsd:sg-start` | `gsd-new-project` | 새 프로젝트 또는 마일스톤 시작 |
  | sg-explore | `/super-gsd:sg-explore` | `gsd-explore` | 코드베이스 탐색·파악 |
  | sg-plan | `/super-gsd:sg-plan` | `gsd-discuss-phase` → `gsd-plan-phase` | 컨텍스트 수집 + 플랜 생성 (2단계 체인) |
  | sg-execute | `/super-gsd:sg-execute` | `sg-executing-plans` skill | GSD phase → Superpowers 핸드오프 (to-superpowers 교체) |
  | sg-review | `/super-gsd:sg-review` | `superpowers:requesting-code-review` | 코드리뷰 요청 |
  | sg-learn | `/super-gsd:sg-learn` | `hookify:hookify` | Hookify 회고·패턴 추출 |
  | sg-ship | `/super-gsd:sg-ship` | `gsd-ship` | 마일스톤 완료·배포 |
  | sg-status | `/super-gsd:sg-status` | (HANDOFF.md 읽기) | 현재 워크플로우 위치 확인 (status.md 교체) |

### sg-plan 동작 방식
- **D-35:** sg-plan = 2단계 자동 체인. `gsd-discuss-phase {phase}` Skill 호출 → 완료 후 `gsd-plan-phase {phase}` Skill 호출. 사용자는 sg-plan만 실행하면 컨텍스트 수집부터 플랜까지 자동 진행.

### sg-execute — to-superpowers 교체
- **D-36:** `commands/to-superpowers.md`를 `commands/sg-execute.md`로 교체. 파일 내용(로직, 9단계 process)은 그대로 유지하되 frontmatter `name: to-superpowers` → `name: sg-execute`로만 변경. 기존 `sg-executing-plans` Skill invoke 로직 유지.

### sg-status — status 교체
- **D-37:** `commands/status.md`를 `commands/sg-status.md`로 교체. 로직 유지, frontmatter `name: status` → `name: sg-status`.

### 문서 파일 구조
- **D-38:** README.md 전면 재작성 — 설치 방법 + sg- 명령어 Quick-reference table + GSD→Superpowers→Hookify 흐름도 (ASCII). 기존 Phase 1에서 만든 README.md를 대체.
- **D-39:** `docs/COMMANDS.md` 신규 생성 — 명령어별 상세 레퍼런스. 컬럼: `명령어 | 하는 일 | 매핑 도구 | 인자 | 예시`. 상세 설명 + 사용 패턴.

### 명령어 본문 형식 (Phase 2 D-17/D-18 carry forward)
- **D-40 (carry D-18):** 명령어 본문은 `<objective>` / `<execution_context>` / `<process>` / `<success_criteria>` XML 4-section 구조 유지.
- **D-41 (carry D-30):** 명령어 본문 내 사용자 노출 문자열은 영문 유지 (OSS surface).

### Claude's Discretion
- sg-plan 체인에서 gsd-discuss-phase와 gsd-plan-phase 간 인자 전달 방식 (phase 번호 명시 vs STATE.md 자동 추출)
- sg-start가 신규 프로젝트와 기존 프로젝트 신규 마일스톤을 구분하는 방식 (gsd-new-project가 이미 탐지하는 경우 그대로 위임)
- README.md ASCII 흐름도 상세 레이아웃 (박스 스타일, 화살표 방향 등)
- docs/COMMANDS.md 내 예시 출력 형태

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 프로젝트 기반
- `.planning/PROJECT.md` — 비침투적 원칙, Constraints
- `.planning/REQUIREMENTS.md` — HOOK-01~04 (신 Phase 4 영역이지만 sg- 명령어 설계 시 참조)
- `.planning/ROADMAP.md` §Phase 3 — 업데이트 전 원본 + 이번 phase 종료 후 수정 대상
- `.planning/STATE.md` — 현재 phase 자동 추출 원천

### Phase 1/2 산출물 (이번 phase가 위에 쌓는 베이스)
- `.planning/phases/01-plugin-scaffold/01-CONTEXT.md` — D-01..D-15
- `.planning/phases/02-manual-handoff-status/02-CONTEXT.md` — D-16..D-30 (특히 D-16~D-18 명령어 구조, D-36/D-37의 교체 대상)
- `commands/to-superpowers.md` — sg-execute로 교체할 원본 파일 (로직 재사용)
- `commands/status.md` — sg-status로 교체할 원본 파일 (로직 재사용)
- `.claude-plugin/plugin.json` — `name: "super-gsd"` namespace prefix 소스
- `README.md` — Phase 1에서 작성한 원본 (이번 phase에서 전면 교체)

### Claude Code 명령어 시스템
- Claude Code slash command 파일 자동 발견 규칙 — `commands/{name}.md`, frontmatter `name` 필드가 slash command 식별자
- Skill tool 시그니처 — `Skill(skill="...", args="...")`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/to-superpowers.md` — sg-execute의 전체 로직(9단계) 재사용. frontmatter name만 변경.
- `commands/status.md` — sg-status의 전체 로직 재사용. frontmatter name만 변경.
- `.planning/HANDOFF.md` — sg-status와 sg-execute 모두 이 파일을 read/append

### Established Patterns
- Phase 2 D-18 XML 4-section 명령어 구조 — 모든 sg- 명령어에 동일하게 적용
- Phase 2 D-30 영문 사용자 메시지 — sg- 명령어 본문에도 동일 적용
- Phase 1 README.md 9-section 구조 — 이번에 전면 교체하므로 참조만

### Integration Points
- sg-plan: `gsd-discuss-phase` + `gsd-plan-phase` Skill 순차 invoke
- sg-execute: `sg-executing-plans` Skill invoke (기존 to-superpowers 로직 그대로)
- sg-review: `superpowers:requesting-code-review` Skill invoke
- sg-learn: `hookify:hookify` Skill invoke
- sg-ship: `gsd-ship` Skill invoke
- sg-start: `gsd-new-project` Skill invoke
- sg-explore: `gsd-explore` Skill invoke

</code_context>

<specifics>
## Specific Ideas

- 워크플로우 흐름도 (README.md + docs/COMMANDS.md 공통):
  ```
  sg-start → sg-explore → sg-plan → sg-execute → sg-review → sg-learn → sg-ship
    (GSD)       (GSD)      (GSD)    (Superpowers)  (Superpowers) (Hookify)  (GSD)
  ```
- README.md Quick Reference 테이블 컬럼: `Command | What it does | When to use`
- docs/COMMANDS.md 테이블 컬럼: `Command | Maps to | Args | Description`
- sg-plan 2단계 체인 사용자 메시지 예시:
  ```
  [sg-plan] Step 1/2: Gathering context via gsd-discuss-phase...
  [sg-plan] Step 2/2: Creating plan via gsd-plan-phase...
  ```

</specifics>

<deferred>
## Deferred Ideas

- Stop/SubagentStop 자동 hook 등록 — **신 Phase 4** (구 Phase 3 Auto-Advance Hooks)
- Hookify 결과 `.planning/lessons/` 자동 적재 — **신 Phase 5** (구 Phase 4 Lessons Feedback Loop)
- sg-plan `--skip-discuss` 옵션 (discuss 없이 plan만) — v2 이후
- sg-execute `--skill` 인자로 실행할 Superpowers skill 선택 — v2 이후 (D-20 carry)
- plugin name을 `sg`로 변경해 `/sg:execute` 형태로 단축 — v2 검토

</deferred>

---

*Phase: 3-sg-command-set-readme*
*Context gathered: 2026-05-15*
