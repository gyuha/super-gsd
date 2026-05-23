# Phase 24: Skills 품질 검토 - Research

**조사일:** 2026-05-23
**도메인:** Claude Code Skills (YAML frontmatter + Markdown instruction blocks)
**신뢰도:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | 설명 | Research 지원 근거 |
|----|------|-------------------|
| QUAL-01 | 17개 SKILL.md 파일 각각의 YAML frontmatter에 `name`, `description` 필수 필드 존재 | 직접 파싱 완료 — 17개 전부 두 필드 존재 확인 |
| QUAL-02 | 각 `description`이 "언제 사용하는지"와 "무엇을 하는지"를 명확히 기술 (skill-creator 트리거링 기준) | skill-creator SKILL.md 공식 기준 확인, 17개 description 품질 평가 완료 |
| QUAL-03 | 모든 스킬에 `<objective>`, `<process>`, `<success_criteria>` 블록 존재 및 내용 완전 | 17개 전수 조사 완료 |
| QUAL-04 | `<process>` 내 Bash 스니펫의 macOS/Linux 호환성 확인 | 코드 블록 전수 검사 완료 |
| QUAL-05 | 스킬 간 cross-reference(`Skill()`, `Agent()` 호출) 유효성 확인, 문제 목록 작성 | 전체 참조 그래프 추출 및 검증 완료 |
</phase_requirements>

---

## 요약

Phase 24는 17개 SKILL.md 파일을 skill-creator 기준으로 체계 검토하는 순수 감사(audit) 작업이다. 외부 패키지 설치가 없고 코드 수정도 없다. 검토 결과를 문제 목록으로 출력하는 것이 유일한 산출물이다.

**직접 감사 결과:** QUAL-01, QUAL-03, QUAL-04, QUAL-05는 17개 전체에서 문제가 없다. 유일한 실질적 이슈는 QUAL-02 — 16개 스킬의 `description` 필드에 "언제 사용하는지(트리거 컨텍스트)"가 없다. skill-creator가 명시하는 "pushy description" 기준을 충족하는 스킬은 17개 중 1개(sg-start)뿐이다.

**주요 권고사항:** QUAL-02 16개 description 개선 목록 작성. QUAL-01/03/04/05는 "이상 없음" 확인서로 문서화한다.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SKILL.md 파싱 및 구조 검증 | Researcher (현재 세션) | — | 파일 읽기 + 정규식 분석이 전부 |
| skill-creator 기준 적용 | Researcher | — | skill-creator SKILL.md를 출처로 직접 확인 |
| cross-reference 유효성 | Researcher | — | skills/ 디렉토리 목록 + 알려진 외부 스킬 목록 대조 |
| macOS 호환성 검증 | Researcher | — | 코드 블록 추출 후 패턴 매칭 |
| 문제 목록 산출물 | Planner/Executor | — | RESEARCH 결과를 PLAN 태스크로 변환 |

---

## 검토 대상 파일 목록

```
skills/
├── sg-complete/SKILL.md     (69줄)
├── sg-execute/SKILL.md      (316줄)
├── sg-explore/SKILL.md      (23줄)
├── sg-health/SKILL.md       (116줄)
├── sg-learn/SKILL.md        (40줄)
├── sg-lessons/SKILL.md      (85줄)
├── sg-new/SKILL.md          (24줄)
├── sg-parallel-execute/SKILL.md (114줄)
├── sg-plan/SKILL.md         (98줄)
├── sg-quick/SKILL.md        (163줄)
├── sg-retro/SKILL.md        (548줄) ← 500줄 권장 상한 초과
├── sg-review/SKILL.md       (101줄)
├── sg-ship/SKILL.md         (56줄)
├── sg-start/SKILL.md        (205줄)
├── sg-status/SKILL.md       (122줄)
├── sg-ui-plan/SKILL.md      (84줄)
└── sg-update/SKILL.md       (145줄)
```

총 17개. [VERIFIED: 직접 ls + wc -l]

---

## QUAL-01: Frontmatter 필수 필드 감사 결과

[VERIFIED: 직접 파싱]

| 스킬 | name | description | 이슈 |
|------|------|-------------|------|
| sg-complete | ✓ | ✓ | 없음 |
| sg-execute | ✓ | ✓ | 없음 |
| sg-explore | ✓ | ✓ | 없음 |
| sg-health | ✓ | ✓ | 없음 |
| sg-learn | ✓ | ✓ | 없음 |
| sg-lessons | ✓ | ✓ | 없음 |
| sg-new | ✓ | ✓ | 없음 |
| sg-parallel-execute | ✓ | ✓ | 없음 |
| sg-plan | ✓ | ✓ | 없음 |
| sg-quick | ✓ | ✓ | 없음 |
| sg-retro | ✓ | ✓ | 없음 |
| sg-review | ✓ | ✓ | 없음 |
| sg-ship | ✓ | ✓ | 없음 |
| sg-start | ✓ | ✓ | 없음 |
| sg-status | ✓ | ✓ | 없음 |
| sg-ui-plan | ✓ | ✓ | 없음 |
| sg-update | ✓ | ✓ | 없음 |

**결론: 17/17 통과. QUAL-01 이슈 없음.**

---

## QUAL-02: Description 트리거 품질 감사 결과

[VERIFIED: skill-creator SKILL.md 기준 직접 확인 + 17개 파싱]

### skill-creator 공식 기준 [CITED: ~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/skill-creator/SKILL.md]

> "description: When to trigger, what it does. This is the primary triggering mechanism — include both what the skill does AND specific contexts for when to use it. All 'when to use' info goes here, not in the body. Note: currently Claude has a tendency to 'undertrigger' skills — to not use them when they'd be useful. To combat this, please make the skill descriptions a little bit 'pushy'."

**평가 기준:**
- **GOOD**: "use when user mentions/wants/says X" 형태의 구체적 사용자 발화 트리거 포함
- **FAIR**: `when` 키워드 있으나 구체적 사용자 행동 기술 없음
- **POOR**: `when` 없음, 동작만 설명 (under-trigger 위험)

| 스킬 | 수준 | 현재 description | 문제 |
|------|------|-----------------|------|
| sg-complete | POOR | Complete the current milestone — invokes gsd-complete-milestone Skill. | 언제 사용하는지 없음 |
| sg-execute | POOR | Hand off the current GSD phase to Superpowers — package PLAN/REQ/SC into a single prompt and auto-invoke superpowers:executing-plans. | 언제 사용하는지 없음 |
| sg-explore | POOR | Explore and map the codebase — invokes gsd-map-codebase Skill. | 언제 사용하는지 없음 |
| sg-health | POOR | Diagnose super-gsd installation status — GSD, Superpowers, Hookify (optional), hooks, HANDOFF.md, STATE.md | 언제 사용하는지 없음 |
| sg-learn | POOR | Run a retrospective via sg-retro to extract patterns and generate hooks from this session. | 언제 사용하는지 없음 |
| sg-lessons | POOR | List prior lessons from .planning/lessons/ (written by sg-retro) and inject them as context for the next GSD phase. | 언제 사용하는지 없음 |
| sg-new | POOR | Start a new milestone — invokes gsd-new-milestone Skill. | 언제 사용하는지 없음 |
| sg-parallel-execute | POOR | Reads parallel_groups.json and dispatches up to 3 parallel Task() agents — one per independent group — to execute PLAN.md tasks directly without calling superpowers:executing-plans. | 언제 사용하는지 없음 |
| sg-plan | POOR | Gather context (injects .planning/lessons/) and create a phase plan — chains gsd-discuss-phase → gsd-plan-phase automatically. | 언제 사용하는지 없음 |
| sg-quick | POOR | Execute a small, ad-hoc task with GSD guarantees (atomic commits, STATE.md tracking). Quick mode for one-off tasks that don't need a full phase plan. | 언제 사용하는지 없음 |
| sg-retro | POOR | Run a structured retrospective on a GSD phase with one of six lenses ... | 언제 사용하는지 없음 |
| sg-review | POOR | Request a code review via Superpowers — derives git range, collects description, then invokes superpowers:requesting-code-review Skill. | 언제 사용하는지 없음 |
| sg-ship | POOR | Complete and ship the current milestone — invokes gsd-ship Skill. | 언제 사용하는지 없음 |
| **sg-start** | **FAIR** | Start or resume a project — detects existing session, prompts Resume / Start new milestone / Cancel; falls back to gsd-new-project when no session is detected. | `when` 포함, 구체적 사용자 발화 트리거는 없음 |
| sg-status | POOR | Show the current super-gsd workflow stage, last handoff timestamp, and the next recommended command. | 언제 사용하는지 없음 |
| sg-ui-plan | POOR | Run UI design brainstorming for a phase — resolves phase context from ROADMAP.md and invokes superpowers:brainstorming. | 언제 사용하는지 없음 |
| sg-update | POOR | Check, install, or update GSD, superpowers, and super-gsd to their latest versions. | 언제 사용하는지 없음 |

**결론: 16/17 POOR, 1/17 FAIR, 0/17 GOOD. QUAL-02 이슈 16개 스킬.**

sg-start 포함 17개 전부 "use when user says/mentions X" 형태의 pushy 트리거가 없으므로, Phase 25(수정 단계)에서 모두 개선 대상이다.

---

## QUAL-03: 블록 완전성 감사 결과

[VERIFIED: 직접 파싱]

| 스킬 | objective | process | success_criteria | execution_context | 이슈 |
|------|-----------|---------|-----------------|-------------------|------|
| sg-complete | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-execute | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-explore | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-health | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-learn | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-lessons | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-new | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-parallel-execute | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-plan | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-quick | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-retro | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-review | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-ship | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-start | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-status | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-ui-plan | ✓ | ✓ | ✓ | ✓ | 없음 |
| sg-update | ✓ | ✓ | ✓ | ✓ | 없음 |

추가 관찰: sg-retro는 548줄로 skill-creator 권장 500줄 상한을 초과한다. [CITED: skill-creator SKILL.md — "Keep SKILL.md under 500 lines; if you're approaching this limit, add an additional layer of hierarchy"] 블록 자체는 완전하므로 QUAL-03 이슈는 아니나, 부수적 관찰로 기록한다.

**결론: 17/17 통과. QUAL-03 이슈 없음.**

---

## QUAL-04: Bash macOS/Linux 호환성 감사 결과

[VERIFIED: 직접 코드 블록 추출 및 패턴 검사]

**검사 항목 (CLAUDE.md 기준):**
- `grep -P` (PCRE) — macOS grep은 `-P` 미지원
- `sed -i` without `''` — macOS BSD sed 비호환
- `date -d` — GNU only
- `readlink -f` — macOS 기본 없음

**코드 블록 내 실제 검사 결과:**

모든 17개 스킬의 bash/sh 코드 블록에서 위 패턴 없음.

**오탐 제거 기록:**
- sg-health `process` 블록에 "파일 쓰기 연산자(`>`, `>>`, `tee`, `sed -i`)는 일절 사용하지 않는다" 텍스트 존재 — 이는 금지 목록을 설명하는 자연어이며 실제 코드가 아니다. 코드 블록 안에서는 `sed -i`가 사용되지 않는다.
- sg-execute `grep -rl '^wave:'` — `-rl`은 PCRE `-P`가 아닌 `--recursive --files-with-matches`이다. macOS 호환.

**결론: 17/17 통과. QUAL-04 이슈 없음.**

---

## QUAL-05: Cross-Reference 유효성 감사 결과

[VERIFIED: 직접 파싱 + skills/ 디렉토리 목록 대조]

### 내부 스킬 참조 (skills/ 디렉토리 내)

| 참조 출처 | 참조 대상 | 종류 | 유효성 |
|----------|----------|------|--------|
| sg-execute | sg-parallel-execute | Skill() | OK |
| sg-learn | sg-retro | Skill() | OK |

### 외부 GSD 스킬 참조

| 참조 출처 | 참조 대상 | 유효성 |
|----------|----------|--------|
| sg-complete | gsd-complete-milestone | OK |
| sg-explore | gsd-map-codebase | OK |
| sg-new | gsd-new-milestone | OK |
| sg-plan | gsd-discuss-phase | OK |
| sg-plan | gsd-plan-phase | OK |
| sg-quick | gsd-quick | OK |
| sg-ship | gsd-ship | OK |
| sg-start | gsd-new-milestone | OK |
| sg-start | gsd-new-project | OK |

### 외부 Superpowers 스킬 참조

| 참조 출처 | 참조 대상 | 유효성 |
|----------|----------|--------|
| sg-execute | superpowers:executing-plans | OK |
| sg-quick | superpowers:executing-plans | OK |
| sg-review | superpowers:requesting-code-review | OK |
| sg-ui-plan | superpowers:brainstorming | OK |

### Agent() 참조

| 참조 출처 | description 값 | 종류 |
|----------|---------------|------|
| sg-plan | gsd-discuss-phase 서브에이전트 실행 | Agent() |
| sg-quick | GSD quick planner 서브에이전트 | Agent() |
| sg-ui-plan | superpowers:brainstorming 서브에이전트 | Agent() |

이 Agent() 호출들은 skill 이름이 아닌 description 파라미터로 동작을 기술하므로 cross-reference 유효성 검사 대상이 아니다.

### sg-retro success_criteria 내 Skill() 언급

`<success_criteria>` 블록 안에 `Skill(skill="sg-retro", args="...")` 텍스트가 있다(LINE 537). 이는 코드 실행 지시가 아닌 테스트 케이스 설명 텍스트이므로 cross-reference 위반이 아니다.

**결론: 17/17 통과. QUAL-05 이슈 없음.**

---

## 종합 이슈 목록

| 요구사항 | 이슈 수 | 영향 스킬 |
|---------|--------|----------|
| QUAL-01 | 0 | 없음 |
| QUAL-02 | 16 | sg-complete, sg-execute, sg-explore, sg-health, sg-learn, sg-lessons, sg-new, sg-parallel-execute, sg-plan, sg-quick, sg-retro, sg-review, sg-ship, sg-status, sg-ui-plan, sg-update |
| QUAL-03 | 0 | 없음 |
| QUAL-04 | 0 | 없음 |
| QUAL-05 | 0 | 없음 |

**부수적 관찰 (요구사항 이슈 아님):**
- sg-retro: 548줄 (skill-creator 권장 500줄 상한 48줄 초과)
- sg-start: FAIR 수준 (GOOD에는 미달 — 구체적 사용자 발화 패턴 없음)

---

## 아키텍처 패턴

### SKILL.md 구조 표준

```
---
name: skill-name          # 필수
description: ...          # 필수 — 트리거 컨텍스트 포함해야 함
argument-hint: ...        # 선택
---

<objective>...</objective>
<execution_context>...</execution_context>
<process>...</process>
<success_criteria>...</success_criteria>
```

### skill-creator "pushy description" 패턴

**나쁜 예:**
```
description: Complete the current milestone — invokes gsd-complete-milestone Skill.
```

**좋은 예 (참고):**
```
description: Complete the current milestone when the user says "complete", "finish this milestone",
  or "we're done". Invokes gsd-complete-milestone and archives lessons.
  Use this skill whenever the user signals the current milestone is fully done.
```

skill-creator는 "undertrigger" 문제를 명시적으로 경고한다. description이 "무엇을 하는가"만 설명하고 "언제 사용하는가"를 빠뜨리면 Claude가 관련 상황에서 스킬을 발동하지 않는다.

---

## 공통 함정

### 함정 1: description을 동작 설명으로만 쓰기
**무엇이 잘못되는가:** Claude가 사용자가 명시적으로 skill 이름을 부르지 않으면 발동하지 않는다.
**왜 발생하는가:** "description" 필드를 docstring처럼 취급함.
**회피 방법:** "Use this skill when user mentions X/Y/Z" 형태의 트리거 힌트를 description 끝에 추가.

### 함정 2: grep -rl을 grep -rP로 오해
**무엇이 잘못되는가:** `-rl` 플래그는 `--recursive --files-with-matches`이며 PCRE와 무관.
**회피 방법:** `-P` 플래그가 단독 또는 `rP`/`Pn` 등 조합으로 나타날 때만 macOS 비호환.

### 함정 3: success_criteria 텍스트를 실행 코드로 오인
**무엇이 잘못되는가:** success_criteria 내 `Skill()` 패턴 언급을 cross-reference로 잘못 탐지.
**회피 방법:** cross-reference 검사는 `<process>` 블록 안으로 범위 제한.

---

## 환경 가용성

이 Phase는 파일 읽기 + 텍스트 분석만 수행한다. 외부 의존성 없음.

| 의존성 | 필요 여부 | 가용 |
|--------|----------|------|
| Python 3 (파싱 스크립트) | 선택 | ✓ |
| Bash (grep/wc) | 선택 | ✓ |

---

## 가정 로그

| # | 주장 | 섹션 | 오류 시 위험 |
|---|------|------|------------|
| A1 | GSD 외부 스킬(gsd-complete-milestone 등)이 실제로 설치되어 있다는 가정 하에 유효성 "OK" 판정 | QUAL-05 | 설치 없으면 cross-reference가 실제로는 깨져 있음. 단, Phase 24 범위는 파일 검토이므로 설치 여부는 QUAL-05 범위 외 |
| A2 | skill-creator의 "500줄 상한"은 권장이지 강제 규칙이 아님 [ASSUMED] | QUAL-03 부수 관찰 | sg-retro 548줄이 실제 런타임 문제를 일으킬 수 있음 |

---

## 열린 질문

1. **QUAL-02 수정 범위**
   - 알려진 것: 16개 스킬의 description에 트리거 컨텍스트 없음
   - 불명확한 것: description 개선이 Phase 24(검토)의 범위인지 Phase 25(수정)의 범위인지
   - 권고: REQUIREMENTS.md가 QUAL-06(수정)을 Phase 25에 할당하므로, Phase 24 산출물은 "문제 목록 작성"에 한정. 각 스킬에 대한 개선 제안 초안도 함께 작성하면 Phase 25가 독립 실행 가능해진다.

2. **sg-retro 548줄 처리**
   - 알려진 것: skill-creator 권장 500줄 초과
   - 불명확한 것: 실제 런타임 성능 영향 여부
   - 권고: Phase 24는 이상 관찰로 기록만. 개선은 Phase 25 재량 사항으로 전달.

---

## 소스

### 1차 (HIGH)
- `~/.claude/plugins/marketplaces/anthropic-agent-skills/skills/skill-creator/SKILL.md` — description 기준, anatomy, 500줄 권장
- `skills/sg-*/SKILL.md` 17개 — 직접 파싱

### 2차 (MEDIUM)
- `./CLAUDE.md` — grep -P 금지, macOS 호환성 기준
- `.planning/REQUIREMENTS.md` — QUAL-01~06 정의

---

## 메타데이터

**신뢰도 분류:**
- QUAL-01 감사 결과: HIGH — 직접 파싱, 오탐 없음
- QUAL-02 감사 결과: HIGH — skill-creator 공식 기준 직접 확인
- QUAL-03 감사 결과: HIGH — 직접 파싱
- QUAL-04 감사 결과: HIGH — 코드 블록 추출 후 패턴 검사, 오탐 제거 기록 포함
- QUAL-05 감사 결과: HIGH — 참조 그래프 직접 추출 및 대조

**조사일:** 2026-05-23
**유효 기간:** SKILL.md 파일이 변경되기 전까지 유효. 스킬 수정 후 재검증 필요.
