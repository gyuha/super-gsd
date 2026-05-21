# Feature Landscape — v1.4 병렬 에이전트 실행 (sg-execute)

**Domain:** Claude Code 플러그인 — PLAN.md 병렬 실행 오케스트레이터
**Researched:** 2026-05-21
**Confidence:** HIGH — 실제 PLAN.md 파일, sg-execute.md, HANDOFF.md 직접 분석 기반

---

## 컨텍스트: 현재 sg-execute가 하는 일

현재 `sg-execute`는 단계(Phase)의 모든 `*-PLAN.md` 파일을 순차적으로 하나의 blob으로 합쳐서
`superpowers:executing-plans` Skill에 한 번에 넘긴다. Superpowers는 이를 내부적으로 순차 처리한다.

**문제:** Wave 1과 Wave 2 PLAN.md가 섞여 있어도 Superpowers는 순서를 모른다.
이미 PLAN.md 프론트매터에 `wave`와 `depends_on` 필드가 있지만 sg-execute는 이를 완전히 무시한다.

**목표:** PLAN.md의 `wave` + `depends_on` 구조를 읽어 독립 태스크 그룹을 감지하고,
각 wave를 별도 에이전트로 병렬 실행한 뒤 결과를 통합한다.

---

## PLAN.md 포맷 — 실제 구조 (직접 분석)

PLAN.md 프론트매터는 이미 의존성 정보를 포함한다:

```yaml
---
phase: 03-sg-command-set-readme
plan: 04
type: execute
wave: 2                # 실행 순서 그룹 (1 = 최초, 2 = wave 1 완료 후)
depends_on:
  - 03-01              # 같은 phase 내 plan 번호 참조
  - 03-02
  - 03-03
files_modified:
  - README.md
autonomous: true
---
```

**실제 관찰된 패턴 (v1.0 milestones 분석):**
- `wave: 1` + `depends_on: []` — 독립 태스크, 병렬 실행 가능
- `wave: 2` + `depends_on: [NN-NN, NN-NN]` — wave 1 완료 후에만 실행 가능
- 모든 PLAN.md 15개 중 wave 1이 11개, wave 2가 4개

**핵심 발견:** `wave` 필드가 그룹핑의 기본 단위다.
같은 wave 내 PLAN.md들은 서로 독립이며 병렬 실행 대상이다.

---

## Table Stakes (없으면 기능 자체가 없는 것)

| Feature | 없을 때 결과 | 복잡도 | 구현 위치 |
|---------|------------|--------|----------|
| **TE-01: wave 기반 태스크 그룹 분석** | 병렬 실행 불가 — 현재와 동일 | 중간 | sg-execute.md process 확장 |
| **TE-02: 독립 그룹 병렬 에이전트 실행** | 핵심 기능 미제공 | 높음 | sg-execute.md + Task tool 활용 |
| **TE-03: 에이전트 수 자동 결정** | 사용자가 수동 지정해야 함 | 낮음 | wave별 PLAN.md 수 카운트 |
| **TE-04: 실행 결과 통합 + HANDOFF.md 기록** | 상태 추적 불가 | 중간 | HANDOFF.md 스키마 확장 |

---

## Feature 상세: Table Stakes

### TE-01: PLAN.md 태스크 의존성 분석

**분석 방법:**

PLAN.md 프론트매터에서 `wave`와 `depends_on`을 파싱한다.
두 필드가 없는 PLAN.md는 wave 1 독립 태스크로 취급한다 (하위 호환성).

```bash
# wave별 PLAN.md 그룹핑
for plan in "$PHASE_DIR"/*-PLAN.md; do
  wave=$(grep -E '^wave:' "$plan" | head -1 | awk '{print $2}')
  wave=${wave:-1}   # 기본값 1
  echo "$wave $plan"
done | sort -n
```

**그룹핑 규칙:**
1. `wave: 1` + `depends_on: []` → Group A (첫 번째 병렬 배치)
2. `wave: 2` + `depends_on: [...]` → Group B (Group A 완료 후 실행)
3. `wave` 없음 → wave 1로 간주

**독립성 판단 기준:**
- 같은 wave 내 PLAN.md들이 `files_modified` 목록이 겹치지 않으면 진정한 독립 (추가 검증 가능)
- `files_modified` 충돌 시 경고 출력 후 순차 처리

**신뢰도:** HIGH — 실제 PLAN.md 15개를 분석한 결과, 이 패턴이 일관적으로 사용됨

---

### TE-02: 병렬 에이전트 실행

**Claude Code Task tool 활용:**

Claude Code는 서브에이전트를 `Task` tool로 생성한다. sg-execute는 이미 Skill을 invoke하므로,
wave별로 별도 Task를 spawn하거나 각 PLAN.md를 개별 Skill 호출로 분리하는 방식이 현실적이다.

**실행 모델:**

```
Wave 1: [PLAN-01, PLAN-02, PLAN-03] → 각각 독립 에이전트로 동시 실행
                      ↓ 모두 완료 대기
Wave 2: [PLAN-04] → 단일 에이전트 실행
```

**Superpowers:executing-plans와의 관계:**
- 현재 sg-execute는 모든 PLAN.md를 하나의 blob으로 합쳐 Skill에 넘긴다
- 병렬화는 wave별로 분리된 blob을 각각 개별 Task/Skill 호출로 넘기는 방식으로 구현
- Superpowers Skill 자체는 수정하지 않는다 (non-invasive 원칙)

**에이전트당 입력:**
- 해당 wave의 PLAN.md 1개 (또는 같은 wave 내 묶음)
- Phase Goal + Success Criteria + REQ-IDs (공통 컨텍스트)
- "이 태스크는 Wave N의 병렬 배치입니다" 명시

---

### TE-03: 에이전트 수 자동 결정

**결정 기준: 독립 그룹(wave) 수가 아니라 wave 내 PLAN.md 수 기반**

```
Wave 1에 PLAN.md 3개 → 에이전트 3개 (또는 설정된 max_agents 한도 내)
Wave 2에 PLAN.md 1개 → 에이전트 1개
```

**상한선 필요:**
- 기본 상한: 5개 (설정 오버라이드 가능)
- `.planning/config.json`의 `super_gsd.max_parallel_agents` 필드로 조정 가능
- PLAN.md가 1개만 있는 phase → 자동으로 순차 모드

**결정 로직:**
```
wave별 plan 수 = 에이전트 수 (max_agents 초과 시 순차 배치)
wave가 1개뿐이고 plan이 1개 → 기존 sg-execute와 동일 동작
```

**신뢰도:** MEDIUM — 이 접근 방식은 합리적이지만 Claude Code Task tool의 동시 실행 제한에 대한 공식 문서 확인 필요

---

### TE-04: 실행 결과 통합 + HANDOFF.md 기록

**현재 HANDOFF.md 스키마:**
```
| Timestamp | Phase | From | To | Plan Hash |
```

**병렬 실행 이벤트를 위한 새 레코드 형식:**

Wave별로 행을 추가한다. Plan Hash 컬럼에 wave 정보를 인코딩하는 방식이 가장 단순하다:

```
| 2026-05-21T12:00:00Z | 14-codex-agents-skills | gsd-plan | superpowers-w1 | abc1234 |
| 2026-05-21T12:05:00Z | 14-codex-agents-skills | superpowers-w1 | superpowers-w2 | def5678 |
| 2026-05-21T12:08:00Z | 14-codex-agents-skills | superpowers-w2 | review | - |
```

**대안: To 컬럼에 wave 태그 추가**
- `superpowers-w1` → Wave 1 완료
- `superpowers-w2` → Wave 2 완료
- 기존 stage enum 확장 (하위 호환성 주의)

**더 단순한 대안: 기존 스키마 유지 + Plan Hash에 wave 정보 인코딩**
```
| 2026-05-21T12:00:00Z | 14-codex-agents-skills | gsd-plan | superpowers | abc1234[w1:3/3] |
```

**권장:** To 컬럼에 `superpowers-parallel-N` 태그 추가. sg-status가 이를 파싱해서
"N개 wave 중 M번째 완료" 상태를 표시할 수 있다. 기존 `superpowers` stage도 그대로 인식.

---

## Differentiators (있으면 더 좋은 것)

| Feature | 가치 | 복잡도 | 비고 |
|---------|------|--------|------|
| **files_modified 충돌 감지** | wave가 같아도 파일 충돌 시 자동 순차 전환 | 중간 | 안전망 |
| **병렬 실행 시각화** | Wave 진행 상황을 ASCII 프로그레스로 표시 | 낮음 | UX 개선 |
| **--sequential 폴백 플래그** | 병렬 실행이 실패할 때 순차 재시도 옵션 | 낮음 | 디버깅용 |
| **config.json max_parallel_agents 설정** | 프로젝트별 병렬도 조정 | 낮음 | 기존 config.json 확장 |
| **Wave 완료 체크포인트** | Wave 1 완료 후 wave 2 시작 전 사용자 확인 | 낮음 | 안전 모드 |

---

## Anti-Features (만들지 말아야 할 것)

| 만들지 말 것 | 이유 | 대안 |
|-------------|------|------|
| **--parallel 플래그** | 자동 감지가 가능한데 플래그를 요구하는 것은 UX 퇴보. 사용자가 wave 구조를 알아야 한다는 뜻이 된다. | wave 필드 존재 시 자동 병렬화. 단일 wave이거나 wave 없으면 기존 동작 |
| **PLAN.md 포맷 변경** | 기존 PLAN.md들이 wave/depends_on을 이미 가지고 있다. 새 필드를 추가하면 기존 계획들을 전부 수정해야 한다. | 현재 wave/depends_on 필드를 그대로 활용 |
| **Superpowers Skill 내부 수정** | non-invasive 원칙 위반 | sg-execute 레벨에서 wave별 분리 실행 |
| **분산 실행 상태 DB** | 과도한 복잡성. Python/JSON DB가 아니라 HANDOFF.md append-only로 충분 | HANDOFF.md에 wave 행 추가 |
| **실패한 에이전트 자동 재시도** | 재시도 로직은 복잡도를 크게 올리고, Superpowers가 이미 실패 태스크를 처리한다. | 실패 시 명확한 에러 메시지 + 수동 재실행 안내 |
| **wave 필드 없는 PLAN.md 자동 분석** | LLM이 태스크 독립성을 추론하는 것은 불결정적이고 위험하다. | wave 필드 없으면 순차 처리 (안전 기본값) |

---

## UX 패턴: --parallel 플래그 vs 자동 감지

**결론: 자동 감지가 옳다. 플래그 불필요.**

**근거:**
1. PLAN.md에 `wave` 필드가 이미 있다 — 이 정보를 버리고 플래그를 요구하는 것은 역행
2. wave 1 PLAN.md가 1개뿐이면 "병렬화"는 의미 없음 → 자동으로 기존 동작 유지
3. wave가 여러 개면 항상 병렬화 이득이 있음 → 자동 활성화가 맞음
4. 플래그를 추가하면 "wave가 있는데 --parallel을 안 붙였다" 버그 패턴이 생긴다

**자동 감지 규칙:**
```
phase 내 PLAN.md wave 수 <= 1 → 기존 sg-execute 동작 (단일 Skill 호출)
phase 내 PLAN.md wave 수 >= 2 → 자동 병렬 모드 활성화
```

**사용자에게 보여줄 것:**
```
[Phase 14] Wave 분석:
  Wave 1: 3개 태스크 (병렬 실행)
  Wave 2: 1개 태스크 (Wave 1 완료 후)

Wave 1 에이전트 3개 시작...
```

---

## 실패 처리: 에이전트 실패 시 나머지 어떻게?

**원칙: fail-fast per wave, 다음 wave 차단**

**Wave 내 에이전트 실패 시나리오:**
- Wave 1의 에이전트 A가 실패 → Wave 2는 시작하지 않음
- Wave 1의 다른 에이전트 B, C는 이미 실행 중 → 완료까지 기다림 (중단하지 않음)
- 실패 후: 에러 메시지 + 어떤 PLAN.md가 실패했는지 명시 + 수동 재실행 안내

**실패 메시지 형식:**
```
[Wave 1] 완료: 2/3 성공
  실패: 14-02-PLAN.md (Superpowers 실행 실패)
  
Wave 2 시작 차단됨. 실패한 태스크를 수동으로 확인하세요:
  /super-gsd:sg-execute 14 --wave 2  (Wave 2만 재실행)
```

**HANDOFF.md 기록:**
```
| 2026-05-21T12:00:00Z | 14-codex | gsd-plan | superpowers-w1-partial | abc1234 |
```

**신뢰도:** MEDIUM — Claude Code Task tool의 실패 전파 동작은 구현 시 실제 확인 필요

---

## HANDOFF.md: 병렬 실행 이벤트 기록 방식

**권장 스키마 확장:**

기존 5컬럼 스키마를 유지하면서 `To` 컬럼과 `Plan Hash` 컬럼만 확장한다.

| 시나리오 | To 값 | Plan Hash 값 |
|---------|-------|-------------|
| Wave 1 시작 | `superpowers` | `abc1234` (기존과 동일) |
| Wave 1 완료, Wave 2 시작 | `superpowers-w2` | `def5678` |
| Wave 전체 완료 | `review` | `-` |
| Wave 1 부분 실패 | `superpowers-w1-partial` | `abc1234` |

**sg-status 파싱 규칙 추가:**
- `superpowers-w*` prefix를 `superpowers` stage로 표시 매핑 (하위 호환)
- `*-partial` suffix가 있으면 경고 표시

**대안으로 더 단순한 방식:** Plan Hash에 `[wave:N]` suffix 붙이기
```
| 2026-05-21T12:00:00Z | 14-codex | gsd-plan | superpowers | abc1234[w:1/2] |
```

Plan Hash 컬럼이 이미 자유 형식이라 이 방식이 기존 stage enum을 건드리지 않아 더 안전하다.

**최종 권장:** Plan Hash에 `[w:완료wave/전체wave]` 인코딩. sg-status는 이를 파싱해 진행 상황 표시.
To 컬럼은 `superpowers` 그대로 유지 → stage enum 변경 없음, 하위 호환 완전 유지.

---

## Feature 의존성 다이어그램

```
TE-01 PLAN.md wave 분석 (기반)
    ↓
TE-03 에이전트 수 결정 (wave별 plan 수)
    ↓
TE-02 병렬 에이전트 실행
    ↓
TE-04 결과 통합 + HANDOFF.md 기록
```

---

## MVP 권장 범위

**Phase에 포함:**
1. TE-01: wave 파싱 + 그룹 분석 (bash 스크립트 확장)
2. TE-03: 에이전트 수 자동 결정 (wave별 plan 수)
3. TE-02: 병렬 실행 (Task tool 또는 개별 Skill 호출)
4. TE-04: HANDOFF.md Plan Hash에 `[w:N/M]` 인코딩

**미룰 것:**
- files_modified 충돌 감지 (복잡도 대비 실제 발생 빈도 낮음)
- Wave 완료 체크포인트 (사용자가 원하면 --interactive 플래그로 나중에 추가)
- config.json max_parallel_agents (기본 5로 충분, 나중에 추가)

---

## 구현 제약 (Claude Code 플러그인 아키텍처)

1. **commands/*.md는 Claude Code가 직접 실행하는 지시문** — Python이나 외부 프로세스를 spawn하는 게 아니라 Claude가 읽고 수행
2. **Task tool 가용 여부** — Claude Code 세션 내에서 Task를 spawn할 수 있는지 확인 필요. 현재 sg-execute는 Skill invoke를 사용
3. **병렬 Task는 Claude Code의 서브에이전트 기능** — `/super-gsd:sg-execute`가 Claude에게 "여러 개의 서브에이전트를 spawn하라"고 지시하는 형태
4. **non-invasive 원칙** — superpowers:executing-plans Skill은 수정하지 않음. sg-execute.md에서 wave별 분리 후 각각 Skill 호출

**신뢰도:** MEDIUM — Task tool의 동시 실행 의미론은 실제 구현에서 확인 필요

---

## 소스

- `/Users/gyuha/workspace/super-gsd/commands/sg-execute.md` — 현재 구현 직접 분석 [HIGH]
- `/Users/gyuha/workspace/super-gsd/.planning/milestones/v1.0-phases/` — 실제 wave/depends_on 패턴 분석 [HIGH]
- `/Users/gyuha/workspace/super-gsd/.planning/HANDOFF.md` — 현재 스키마 직접 분석 [HIGH]
- `/Users/gyuha/workspace/super-gsd/.planning/PROJECT.md` — v1.4 목표 요건 [HIGH]
