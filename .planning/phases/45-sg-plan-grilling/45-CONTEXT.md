# Phase 45: sg-plan Grilling Step - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

> **수집 방식 주의 (MANDATORY READ):** 이 CONTEXT.md는 `sg-plan`이 spawn한 비대화형 subagent(`Agent()`) 안에서 `gsd-discuss-phase`가 실행되어 생성되었다. subagent 컨텍스트에는 사용자에게 질문할 채널(AskUserQuestion)이 없으므로, 대화형 gray-area 토론은 수행되지 못했다. 대신 workflow의 `--auto` 모드 동작(모든 gray area 자동 선택 + 권장안 채택, 단일 pass)을 따라 **에이전트가 직접 결정**했다. 결정 근거는 ROADMAP/REQUIREMENTS/STATE에 이미 락된 컨텍스트와 코드베이스 직접 탐색(GRILL-03 정신)이다. 각 D-항목 중 `[CONFIRM]` 태그가 붙은 것은 plan 진입 전 사용자/플래너가 한 번 확인할 것을 권장한다. 나머지는 상위 락 결정에서 직접 도출되어 재확인 불필요.

<domain>
## Phase Boundary

이 phase는 **`sg-plan` 스킬에 "grilling(집요한 사전 인터뷰)" 선행 단계를 추가**한다 — `gsd-discuss-phase` subagent를 호출하기 직전, `sg-plan`의 **메인 컨텍스트**에서 Claude가 사용자에게 한 번에 하나씩 질문하여 계획 입력의 모호함을 해소하는 단계다. 참고 모델은 mattpocock의 grill-me skill("합의에 도달할 때까지 인터뷰, 설계 트리 분기를 따라 의존성을 하나씩 해소, 질문마다 권장 답변 제시, 코드베이스로 답할 수 있으면 묻지 말고 탐색").

이 phase가 다루는 단일 capability는 **6개 GRILL 요구사항(GRILL-01~06)을 충족하는 sg-plan 선행 grill 단계의 구현**이다.

scope 명시:

- **In scope:**
  - `skills/sg-plan/SKILL.md` (Claude Code 버전) — phase 해소(Step 1) 직후, `gsd-discuss-phase` Agent 호출(Step 2) **직전**에 grill 단계 삽입.
  - `.agents/skills/sg-plan/SKILL.md` (Codex/Gemini/Antigravity 미러) — 동일 grill 단계를, 해당 플랫폼의 **AskUserQuestion-unavailable 프로즈 폴백 패턴**(이미 Step 1.5 Visual Companion이 사용 중인 번호 선택 프롬프트 패턴)으로 삽입.
  - grill 단계의 6개 동작 정의: ① 한 번에 하나씩 질문(무제한) ② 질문마다 권장 답변 동반 ③ 코드베이스로 답 가능한 항목은 직접 Read/Bash 탐색 ④ 설계 트리 분기 순차 해소 ⑤ Claude의 "모호함 해소" 판단 후 합의 요약 제시 → 사용자 확정/추가질문 게이트 ⑥ 합의 결과를 `gsd-discuss-phase`로 전달.
- **Out of scope (REQUIREMENTS.md §Out of Scope 명시):**
  - `gsd-discuss-phase` 자체 수정 — Non-invasive 제약. grill은 sg-plan 메인 컨텍스트의 선행 단계로만 산다.
  - 독립 `sg-grill` 명령 신설 — 이번 마일스톤은 sg-plan 내부 단계로 한정.
  - Claude 자율 종료(사용자 확인 없음) — 종료는 항상 사용자 확인 게이트.
- **Out of scope (파생):**
  - hooks/*.cjs 변경, 새 .cjs 신설, lessons/HANDOFF 스키마 변경 — grill은 순수 SKILL.md 산문 지시문이다.
  - README/문서 갱신 — 별도 phase 또는 배포 트리거 시점 처리(이번 마일스톤은 단일 phase, 문서 동기화 요구사항 없음).

</domain>

<decisions>
## Implementation Decisions

> 표기: `[LOCKED]` = ROADMAP/REQUIREMENTS/STATE에서 이미 확정된 결정의 재진술. `[AUTO]` = 비대화형 subagent에서 에이전트가 권장안으로 결정. `[CONFIRM]` = plan 진입 전 사용자/플래너 1회 확인 권장.

### 삽입 위치 (Insertion Point)

- **D-01 [AUTO][CONFIRM]:** grill 단계는 **phase 해소(Step 1) 완료 직후, `gsd-discuss-phase` Agent 호출(`.claude` Step 2 / `.agents` Step 2a) 직전**에 삽입한다. 근거: GRILL-01이 "discuss 호출 전 메인 컨텍스트"를 명시. PHASE_NUM이 확정돼야 ROADMAP phase 섹션을 읽어 grill 질문을 생성할 수 있으므로 Step 1 뒤가 최소 의존 위치다.
- **D-02 [AUTO]:** `.agents` 버전의 경우 grill 단계는 **Step 1.5(Visual Companion UI 감지) 와의 순서**를 정해야 한다. 권장: grill을 **Step 1.5 이전**(phase 해소 직후)에 둔다 — grill에서 해소된 합의가 UI 여부 판단에도 입력될 수 있고, Visual Companion brainstorming은 grill이 만든 합의를 전제로 동작하는 게 자연스럽다. `[CONFIRM]` 플래너가 반대 순서(UI 감지 먼저)의 타당성을 1회 검토.
- **D-03 [AUTO][CONFIRM]:** `.claude` 버전에는 현재 Step 1.5(Visual Companion)가 **없다** — 두 파일의 구조가 이미 divergent. 본 phase는 grill 삽입만 다루며 `.claude`에 Visual Companion을 추가하지 **않는다**(scope 외). grill 삽입 위치만 두 파일에서 의미적으로 동일("phase 해소 후, discuss Agent 전")하게 맞춘다. 구조 divergence 자체의 정합은 별도 과제로 deferred.

### 질문 제시 메커니즘 (Question Surfacing)

- **D-04 [LOCKED]:** **한 번에 하나씩** 질문한다(GRILL-01). 배치 질문 금지. 질문 수 상한 없음.
- **D-05 [LOCKED]:** **각 질문마다 Claude가 권장 답변을 함께 제시**한다(GRILL-02). 사용자는 권장안을 수락하거나 다른 답을 줄 수 있다.
- **D-06 [AUTO][CONFIRM]:** **`.claude` 버전은 AskUserQuestion 도구로** 질문(권장안을 options 중 하나로 표기 또는 description에 명시). **`.agents` 버전은 AskUserQuestion 미지원**이므로 Step 1.5가 이미 쓰는 프로즈 번호 선택 패턴(`1. ... / 2. ... / Enter your choice:`)을 답습하되, 자유 입력도 허용해야 하므로 "권장: X. 다른 답이 있으면 입력하세요" 형태의 개방형 프롬프트로 표면화한다. `[CONFIRM]` 플래너가 `.agents` 개방형 프롬프트 문구를 확정.
- **D-07 [LOCKED]:** 사용자에게 보이는 질문·권장안·요약 산문은 **사용자 입력 언어**로 표면화하고, 머신 토큰(명령명 `/super-gsd:sg-*`, 파일 경로, enum, phase 슬러그)은 영문 그대로 둔다(CLAUDE.md "사용자 언어 메시지" 컨벤션 + STATE.md 락 결정).

### 코드베이스 우선 해소 (GRILL-03)

- **D-08 [LOCKED]:** **코드베이스 탐색으로 답할 수 있는 질문(파일 존재 여부, 현재 구현 방식, 함수 시그니처 등)은 사용자에게 묻지 않고 Claude가 직접 Read/Bash로 탐색해 해소**한다(GRILL-03). SKILL.md 지시문에 "묻기 전에 먼저 코드베이스에서 답을 찾을 수 있는지 자문하라"는 규칙을 명시한다.
- **D-09 [AUTO]:** grill 지시문은 "탐색 우선 → 탐색 불가(설계 의도·우선순위·UX 선호 등 코드에 없는 정보)일 때만 사용자에게 질문"이라는 2단계 판정을 명시한다. 이는 GRILL-03 + GRILL-01의 결합 동작.

### 설계 트리 분기 (GRILL-04)

- **D-10 [LOCKED]:** **이전 답변이 다음 질문의 분기를 결정**하도록, grill은 고정 질문 목록이 아니라 **설계 트리를 순차적으로 따라가며 의존성을 하나씩 해소**한다(GRILL-04). SKILL.md 지시문에 "각 답변 후 다음으로 가장 불확실하고 후속 결정을 가장 많이 좌우하는 항목을 다음 질문으로 선택하라"는 우선순위 규칙을 명시한다.

### 종료 게이트 (GRILL-05)

- **D-11 [LOCKED]:** Claude는 **단독으로 grill을 종료할 수 없다**. 모든 모호함이 해소됐다고 판단하면 **합의 요약(결정·제약 목록)을 제시**하고, 사용자가 **"확정"(종료) 또는 "추가 질문"(계속)**으로 최종 결정한다(GRILL-05 + REQUIREMENTS.md Out-of-Scope "Claude 자율 종료 금지").
- **D-12 [AUTO][CONFIRM]:** 합의 요약의 형식은 **번호 매긴 결정·제약 목록 + 종료 확인 프롬프트**. `.claude`는 AskUserQuestion(확정/추가질문 2지선다), `.agents`는 프로즈 번호 선택. `[CONFIRM]` 플래너가 요약 템플릿 구조를 확정.

### 합의 결과 전달 (GRILL-06)

- **D-13 [LOCKED]:** grill 합의 결과(결정·제약)는 **별도 파일 없이 inline으로** `gsd-discuss-phase` Agent의 프롬프트에 전달된다(STATE.md 락 결정: "Grilling output feeds gsd-discuss-phase CONTEXT input — no separate file, passed inline").
- **D-14 [AUTO][CONFIRM]:** 전달 메커니즘 권장안 — 기존 `gsd-discuss-phase` Agent 호출 프롬프트(`.claude` Step 2 / `.agents` Step 2a)의 prompt 문자열에 grill 합의 요약 텍스트를 **추가 문단으로 주입**한다(예: "Pre-grilled agreement to incorporate as locked context:\n\n{합의 요약}"). gsd-discuss-phase는 이를 `<prior_decisions>` 또는 사용자 컨텍스트로 흡수한다 — gsd-discuss-phase 자체는 수정하지 않으므로(Non-invasive) 프롬프트 주입이 유일한 전달 통로. `[CONFIRM]` 플래너가 정확한 주입 문구·위치를 확정.

### 쌍 파일 동기화 (Pairwise Sync)

- **D-15 [LOCKED]:** `skills/sg-plan/SKILL.md`와 `.agents/skills/sg-plan/SKILL.md`를 **같은 commit에서 함께** 변경한다(CLAUDE.md "skills/ + .agents/ 쌍 커버" + ARCHITECTURE.md anti-pattern: "Updating only skills/ without .agents/ → flagged at review"). 두 파일은 grill **동작 의미는 동일**하되 질문 표면화 메커니즘만 플랫폼에 맞게 다르다(D-06).

### Claude's Discretion

- **grill 지시문의 정확한 산문·단계 번호**: D-01~D-14의 동작을 만족하는 한, SKILL.md 내 step 번호 부여·문단 구성·예시 질문 문구는 플래너 재량.
- **합의 요약·질문 프롬프트의 정확한 문장**: 필수 동작(권장안 동반, 사용자 언어, 확정 게이트)만 고정. 자연스러운 한국어/영어 phrasing은 재량.
- **`<success_criteria>` 갱신 범위**: grill 단계 추가에 맞춰 두 SKILL.md의 `<success_criteria>` 블록에 grill 관련 항목을 추가할지(권장) 여부와 문구는 재량.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 본 phase의 직접 변경 대상 파일

- `skills/sg-plan/SKILL.md` — Claude Code 버전. 현재 구조: Step 0(lessons) → Step 1(phase 해소) → Step 2(progress) → Step 2.1(dir pre-create + discuss Agent) → Step 2.2(위치 검증) → Step 2.5(HANDOFF row) → Step 3(plan Skill). grill 삽입 위치 = Step 1 직후·Step 2 직전.
- `.agents/skills/sg-plan/SKILL.md` — Codex/Gemini/Antigravity 미러. 현재 구조: Step 0 → Step 1(phase 해소) → Step 1.5(Visual Companion UI 감지, AskUserQuestion 미지원 프로즈 폴백) → Step 2(GSD 분기: 2a discuss Agent / 2b HANDOFF / 2c plan Skill, 또는 prose fallback). grill 삽입 위치 = Step 1 직후(D-02: Step 1.5 이전 권장).

### 요구사항·로드맵·프로젝트 컨텍스트

- `.planning/REQUIREMENTS.md` — GRILL-01~06 정의 + Out of Scope 3항목(gsd-discuss-phase 미수정 / sg-grill 명령 금지 / Claude 자율 종료 금지) + mattpocock grill-me skill 참고 문구.
- `.planning/ROADMAP.md` Phase 45 entry (line 485-499) — Goal + 5개 Success Criteria + Scope note(Non-invasive, 쌍 파일 규칙).
- `.planning/PROJECT.md` §"Current Milestone: v2.10 Plan-Phase Ambiguity Grilling" — milestone goal + target features + key context.
- `.planning/STATE.md` §"Accumulated Context > Decisions" — 6개 락 결정(1 phase 입자도, Non-invasive, 쌍 파일, inline 전달, 사용자 언어 표면화, 사용자 확인 게이트).

### 컨벤션·아키텍처 참조

- `CLAUDE.md` §"사용자 언어 메시지" — 산문은 사용자 언어, 머신 토큰은 영문. D-07 근거.
- `CLAUDE.md` §"skills/ + .agents/ 쌍 커버" — Phase 32 Medium-1. 두 파일 동시 변경 필수. D-15 근거.
- `CLAUDE.md` §"macOS 셸 이식성" — grill 지시문에 bash 스니펫 추가 시 `grep -E`(PCRE `-P` 금지), `cut -d'|'`/`awk -F'|'` (BSD awk 파이프 파싱 금지).
- `.planning/codebase/ARCHITECTURE.md` §"Mirror Layer (.agents/skills/)" (line 97-101) — sg-plan은 미러 11개 중 하나. drift는 code review에서 플래그.

### 참고 모델 (외부)

- mattpocock grill-me skill — REQUIREMENTS.md/PROJECT.md가 인용하는 동작 모델. 로컬 파일 없음(외부 참조). 핵심 5원칙: 합의까지 인터뷰 / 설계 트리 의존성 순차 해소 / 질문마다 권장 답변 / 한 번에 하나씩 / 코드베이스로 답 가능하면 묻지 말고 탐색.

### 직전 phase carry-forward (패턴 참조)

- `.planning/phases/44-documentation-sync/44-CONTEXT.md` — CONTEXT.md 작성 형식·D-항목 스타일·pairwise sync(D-16) 모범.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`.agents/skills/sg-plan/SKILL.md` Step 1.5 프로즈 폴백 패턴 (line 73-95)** — AskUserQuestion 미지원 플랫폼에서 번호 선택 프롬프트(`1. ... / 2. ... / Enter your choice (1 or 2):`)로 사용자 입력을 받는 검증된 패턴. grill의 `.agents` 버전 질문·종료 게이트가 이 패턴을 직접 답습한다(D-06, D-12).
- **두 SKILL.md의 `<language>` 블록 (양쪽 line 7-12)** — 입력 언어 자동 감지 지침이 이미 존재. grill 질문은 이 블록의 적용 범위 안에서 사용자 언어로 표면화된다(D-07).
- **`gsd-discuss-phase` Agent 호출 프롬프트 (`.claude` line 70-75 / `.agents` line 112-117)** — grill 합의를 inline 주입할 정확한 지점(D-13, D-14). 프롬프트 문자열에 합의 요약 문단을 추가하는 방식.

### Established Patterns

- **단계 번호 + bash 스니펫 + Agent/Skill 호출 블록** — 두 SKILL.md 모두 `N. **제목.** 설명 + ```bash``` + Agent()/Skill() 호출` 구조. grill 단계도 같은 골격으로 작성.
- **AskUserQuestion 분기 (.claude) vs 프로즈 폴백 (.agents)** — 동일 동작을 두 플랫폼 메커니즘으로 표현하는 확립된 분기. grill도 이 분기를 따른다(D-06).
- **Non-invasive orchestration** — sg-plan은 GSD/Superpowers 파일을 수정하지 않고 외부에서 프롬프트로 orchestrate. grill 합의 전달도 gsd-discuss-phase 프롬프트 주입(수정 아님)으로 구현(D-14).

### Integration Points

- **grill → gsd-discuss-phase**: grill 합의 요약이 discuss Agent 프롬프트에 inline 주입 → discuss-phase가 사용자 컨텍스트/prior_decisions로 흡수 → CONTEXT.md에 반영(GRILL-06 체인).
- **sg-plan 메인 컨텍스트**: grill은 subagent가 아니라 sg-plan 메인 컨텍스트에서 직접 실행(GRILL-01) — 별도 Agent() dispatch 아님. 이는 discuss-phase(Agent dispatch)와 대조된다.
- **두 파일 구조 divergence**: `.agents`에는 Step 1.5(Visual Companion)가 있고 `.claude`에는 없음 — grill 삽입 시 양쪽 step 번호 재배치가 달라질 수 있음(D-03). 의미적 위치만 동일하게 맞춘다.

</code_context>

<specifics>
## Specific Ideas

- **mattpocock grill-me 5원칙을 SKILL.md에 명시적 규칙으로 옮긴다** — 추상 참조가 아니라 grill 단계 지시문 안에 ① 한 번에 하나씩 ② 권장 답변 동반 ③ 코드베이스 우선 탐색 ④ 설계 트리 의존성 순차 ⑤ 합의까지 인터뷰를 실행 가능한 규칙으로 작성. 플래너가 이 5원칙을 grill step 본문의 체크리스트/지시문으로 변환.
- **합의 요약 → discuss 주입 문구 예시**: `gsd-discuss-phase` 프롬프트에 "The user and I have already grilled the ambiguities. Treat the following as locked context (do not re-ask): {요약}" 같은 문단을 추가. 정확 문구는 플래너 재량이나 "이미 확정 — 재질문 금지" 의미가 보존돼야 GRILL-06이 효과를 낸다.
- **종료 게이트 오판 방지**: GRILL-05의 핵심은 Claude가 "모호함 없음"을 잘못 판단해 조기 종료하는 것을 사용자 확인으로 막는 것. 요약 제시 시 "이게 전부인가요? 더 다룰 게 있으면 알려주세요"를 명시적으로 묻는다.

</specifics>

<deferred>
## Deferred Ideas

- **두 sg-plan SKILL.md의 구조 divergence 정합(`.claude`에 Visual Companion 부재 등)** — 본 phase는 grill 삽입만 다룬다. 전반적 구조 통일은 별도 과제.
- **독립 `sg-grill` 재사용 명령 분리** — REQUIREMENTS.md Out-of-Scope 명시. "재사용 분리는 차후 검토".
- **grill 합의를 별도 파일(예: `NN-GRILL.md`)로 영속화** — 현재는 inline 전달만(D-13). 감사·재현이 필요해지면 별도 phase 후보.
- **README/문서에 grill 단계 설명 추가** — 본 마일스톤(v2.10)은 단일 phase, 문서 동기화 요구사항 없음. grill 출시 후 별도 문서 quick task 후보.

</deferred>

---

*Phase: 45-new-phase*
*Context gathered: 2026-05-31*
