# Phase 3: Discussion Log

**Date:** 2026-05-15
**Phase:** 3 — sg- Command Set & README

## Areas Discussed

### 1. Phase 3 범위 재정의

**Question:** ROADMAP의 Phase 3는 'Auto-Advance Hooks'인데, 요청 내용은 sg- 명령어 세트 + README. Phase 3를 어떻게 정의할까요?

**Options presented:**
- sg- 명령어 세트 + README로 교체 ✓
- 둘 다 포함 (sg- 명령어 + 훅)
- 훅은 유지, sg- 명령어는 Phase 2 확장으로

**Selected:** sg- 명령어 세트 + README로 교체

**Decision (D-31):** Phase 3 범위를 "Auto-Advance Hooks"에서 "sg- Command Set & README"로 교체. 자동 훅은 신 Phase 4, Lessons Feedback Loop은 신 Phase 5로 번호 이동.

---

### 2. 명령어 이름 체계

**Question:** sg- 명령어 이름 체계를 어떤 기준으로 잡을까요?

**Options presented:**
- 액션 기반 (sg-start, sg-plan, sg-build, sg-review, sg-ship) ✓
- 라이프사이클 명사 (sg-idea, sg-map, sg-design, sg-code, sg-reflect)
- 숫자 흐름

**Selected:** 액션 기반. 단, `sg-build` → `sg-execute`로 변경 (user note)

**Decision (D-32, D-33):** plugin name `super-gsd` 유지. 명령어 파일명에 `sg-` prefix. 액션 동사 기반 명명.

---

### 3. sg-plan 동작 방식

**Question:** sg-plan은 단일 단계 또는 커플링 중 어떤 방식으로 동작할까요?

**Options presented:**
- discuss 포함 2단계 (gsd-discuss-phase → gsd-plan-phase) ✓
- plan만 (단일)

**Selected:** discuss 포함 2단계

**Decision (D-35):** sg-plan = 2단계 자동 체인.

---

### 4. sg-execute vs to-superpowers 관계

**Question:** sg-execute는 기존 to-superpowers 명령어와 어떤 관계를 가질까요?

**Options presented:**
- to-superpowers를 sg-execute로 대체 ✓
- 병립 유지 (to-superpowers + sg-execute 별도)

**Selected:** to-superpowers를 sg-execute로 대체

**Decision (D-36):** frontmatter name만 변경, 로직 유지.

---

### 5. README 형태

**Question:** README.md는 어떤 형태로 작성할까요?

**Selected:** 명령어 레퍼런스 테이블 + 흐름도

**Question:** README.md는 어떤 파일을 교체할까요?

**User note:** 기존 README.md도 새로 만들고 docs/COMMANDS.md도 작성해 줘.

**Decision (D-38, D-39):** README.md 전면 재작성 + docs/COMMANDS.md 신규 생성.

---

### 6. plugin 이름 / slash command 형식

**Question:** sg- 명령어를 Claude Code에서 어떻게 호출할까요?

**Options presented:**
- plugin 이름을 sg로 변경 → /sg:start
- super-gsd 유지 + 명령어에 sg- prefix → /super-gsd:sg-start ✓

**Selected:** super-gsd 유지 + 명령어에 sg- prefix

**Decision (D-32):** `/super-gsd:sg-{name}` 형식.

---

## Deferred Ideas

- plugin name을 `sg`로 변경해 `/sg:execute` 형태로 단축 — v2 검토
- sg-plan `--skip-discuss` 옵션 — v2
- sg-execute `--skill` 인자 — v2

---

*Logged: 2026-05-15*
