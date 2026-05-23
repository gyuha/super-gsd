# Phase 24: Skills 품질 검토 - Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 1 (신규 생성)
**Analogs found:** 0 / 1 (직접 일치 없음 — 아래 No Analog Found 섹션 참조)

---

## File Classification

| 신규/수정 파일 | 역할 | 데이터 흐름 | 가장 가까운 아날로그 | 일치 품질 |
|----------------|------|------------|---------------------|----------|
| `.planning/phases/24-skills/24-SUMMARY.md` | document (audit report) | transform | `.planning/phases/22-skills/22-01-SUMMARY.md` | partial (역할 불일치 — 실행 보고서 vs 감사 이슈 목록) |

---

## Pattern Assignments

### `.planning/phases/24-skills/24-SUMMARY.md` (document, transform)

**산출물 목적:** QUAL-01~05 감사 결과 + QUAL-02 이슈 상세 테이블 + sg-retro 리팩토링 범위를 하나의 문서로 통합. Phase 25 실행자가 이 파일만 읽고 독립적으로 작업 가능해야 한다.

**아날로그:** `.planning/phases/22-skills/22-01-SUMMARY.md`
(이유: 동일 subsystem `skills`를 다루는 가장 최근 산출물. 단, 22는 "실행 완료 보고서"이고 24는 "감사 이슈 목록"이므로 구조는 달라야 함.)

---

**[참조 1] YAML frontmatter 패턴**
출처: `.planning/phases/22-skills/22-01-SUMMARY.md` 라인 1-38

```yaml
---
phase: 22-skills
plan: 01
subsystem: skills
tags: [skills, sg-plan, sg-execute, SKILL.md, plugin]

requires: []
provides:
  - skills/sg-plan/SKILL.md — ...
affects: [super-gsd plugin, sg-plan command, sg-execute command]

tech-stack:
  added: []
  patterns:
    - "..."

key-files:
  created:
    - ...
  modified: []

key-decisions:
  - "..."

patterns-established:
  - "..."

requirements-completed:
  - SC-01

duration: ...
completed: 2026-05-22
---
```

Phase 24 SUMMARY는 실행 산출물이 아니므로 `key-files.created`, `key-decisions`, `duration` 필드는 생략한다.
대신 다음 필드를 사용:

```yaml
---
phase: 24-skills
subsystem: skills
tags: [skills, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, audit]

requirements-verified:
  - QUAL-01
  - QUAL-02
  - QUAL-03
  - QUAL-04
  - QUAL-05

issues-found: 16
phase-25-scope:
  - QUAL-02 description rewrite (17개 스킬)
  - sg-retro 500줄 축소 리팩토링

completed: 2026-05-23
---
```

---

**[참조 2] 감사 결과 요약 테이블 패턴**
출처: `.planning/phases/24-skills/24-RESEARCH.md` 라인 244-251

아날로그 코드베이스에 동일 형식 없음. RESEARCH.md의 종합 이슈 목록 테이블을 직접 확장한다:

```markdown
## QUAL 감사 결과 요약

| 요구사항 | 결과 | 이슈 수 | 영향 스킬 수 |
|---------|------|--------|------------|
| QUAL-01 (frontmatter 필수 필드) | PASS | 0 | 0 |
| QUAL-02 (description 트리거 품질) | FAIL | 16 | 17 |
| QUAL-03 (블록 완전성) | PASS | 0 | 0 |
| QUAL-04 (macOS/Linux Bash 호환성) | PASS | 0 | 0 |
| QUAL-05 (cross-reference 유효성) | PASS | 0 | 0 |
```

---

**[참조 3] QUAL-02 이슈 상세 테이블 패턴**
출처: `.planning/phases/24-skills/24-CONTEXT.md` 라인 110-117 (D-06 결정)

```markdown
## QUAL-02 이슈 상세 — description 트리거 품질

평가 기준: GOOD = "Use this when user mentions/wants X" 패턴. FAIR = `when` 포함, 구체성 부족. POOR = 트리거 없음.

| 스킬 슬럿 | 등급 | 현재 description |
|-----------|------|-----------------|
| sg-complete | POOR | "Complete the current milestone — invokes gsd-complete-milestone Skill." |
| sg-execute | POOR | "Hand off the current GSD phase to Superpowers ..." |
| ... | ... | ... |
```

D-06 결정: 스킬 슬럿 + 현재 description 두 컬럼. 등급 컬럼을 추가해 Phase 25가 우선순위를 파악할 수 있도록 한다.

---

**[참조 4] sg-retro 리팩토링 범위 섹션 패턴**
출처: `.planning/phases/24-skills/24-CONTEXT.md` 라인 119-125 (D-13 결정)

```markdown
## sg-retro 리팩토링 범위 (Phase 25 대상)

현재 548줄 → 목표 500줄 이하 (skill-creator 권장 상한)
삭제 후보: `<lens_templates>` 블록 (라인 378-534, 157줄)

전략: `<lens_templates>` 블록 전체 삭제.
근거: 각 렌즈의 출력 형식은 `<process>` Step 5 서브블록(라인 221-267)에
      이미 "Fixed subheadings" 목록으로 명시되어 있음.
      `<lens_templates>` 블록은 동일 정보의 마크다운 스켈레톤 버전으로 중복.
삭제 후 예상 줄 수: 548 - 157 = 391줄 (목표 달성)

삭제 대상 라인 범위:
- 378: `<lens_templates>`
- 379-533: 6개 렌즈 마크다운 스켈레톤 전체
- 534: `</lens_templates>`
총 157줄
```

---

## Shared Patterns

### 문서 헤더 패턴
**출처:** `.planning/phases/22-skills/22-01-SUMMARY.md` 라인 40-42
**적용 대상:** 24-SUMMARY.md 문서 제목

```markdown
# Phase 24-01: [태스크 제목]

**[한 문장 요약 — 핵심 발견 또는 완료 사항을 명확하게 기술]**
```

### 검증 체크리스트 패턴 (Self-Check)
**출처:** `.planning/phases/22-skills/22-01-SUMMARY.md` 라인 49-55

```markdown
## Self-Check: PASSED / FAILED

- 항목 1 ✓
- 항목 2 ✓
- ...
```

Phase 24 SUMMARY에서는 "Self-Check" 대신 "완료 기준 확인"으로 대체:

```markdown
## 완료 기준 확인 (D-12)

- QUAL-01~05 전체 결과 테이블 포함 ✓
- QUAL-02 이슈 상세 테이블 (17개 스킬 슬럿 + 현재 description) 포함 ✓
- sg-retro 리팩토링 범위 섹션 포함 ✓
```

---

## No Analog Found

| 파일 | 역할 | 데이터 흐름 | 이유 |
|------|------|------------|------|
| `.planning/phases/24-skills/24-SUMMARY.md` | document (audit report) | transform | 코드베이스에 "감사 이슈 목록" 형식의 SUMMARY.md 선례 없음. 기존 SUMMARY.md는 모두 실행 완료 보고서. RESEARCH.md의 테이블 구조를 확장하여 사용. |

---

## 전체 문서 구조 (Planner용 참조)

아날로그가 없으므로 플래너가 직접 구조를 설계할 수 있도록 권장 섹션 순서를 제공:

```
# Phase 24-01: Skills 품질 감사 결과
[한 문장 요약]

## QUAL 감사 결과 요약
[QUAL-01~05 결과 테이블 — RESEARCH.md 참조 3 패턴]

## QUAL-02 이슈 상세 — description 트리거 품질
[17개 스킬 테이블 — RESEARCH.md 참조 4 패턴, 등급 컬럼 추가]

## sg-retro 리팩토링 범위 (Phase 25 대상)
[삭제 대상 라인 목록 — 위 참조 4 패턴]

## 완료 기준 확인 (D-12)
[Self-Check 체크리스트]
```

---

## Metadata

**아날로그 검색 범위:** `.planning/phases/` 전체 (22-skills, 23-plugin-commands, 21-sg-ui-plan, 18-sg-parallel-execute, 20-sg-plan-visual-companion)
**검색된 파일 수:** 11개 SUMMARY.md
**Pattern extraction date:** 2026-05-23

**핵심 관찰:**
- Phase 24 SUMMARY.md는 이 프로젝트에서 처음 생성되는 "감사 이슈 목록" 형식 문서임
- 기존 SUMMARY.md 패턴(YAML frontmatter + 실행 결과 + Self-Check)에서 frontmatter와 Self-Check 패턴만 재사용 가능
- 나머지 구조는 24-RESEARCH.md와 24-CONTEXT.md의 D-12 결정을 직접 참조해야 함
- sg-retro `<lens_templates>` 블록(라인 378-534, 157줄)이 유일한 삭제 후보이며 삭제 시 391줄로 목표 달성
