# Architecture Research — v1.3 Codex Platform Support

**Researched:** 2026-05-21
**Source files analyzed:** commands/*.md, skills/sg-retro/SKILL.md, hooks/hooks.json, hooks/stop_hook.py, AGENTS.md, .claude-plugin/plugin.json, .planning/PROJECT.md

---

## 문제 정의

현재 super-gsd는 Claude Code 전용 플러그인이다. 모든 명령 파일(`commands/*.md`)은 Claude Code 고유 API인 `Skill()`, `AskUserQuestion()`, `Agent()`를 직접 호출한다. 훅 시스템(`hooks/hooks.json`, Python hook scripts)도 `${CLAUDE_PLUGIN_ROOT}` 환경 변수와 Claude Code의 Stop/SubagentStop 이벤트에 의존한다.

Codex는 호환 API 없이 동일 파일을 실행할 수 없다. 따라서 v1.3의 아키텍처 목표는:

1. 기존 Claude Code 경로를 전혀 손상시키지 않을 것
2. Codex 사용자에게 동등한 워크플로우 가이드를 제공할 것
3. 공유 가능한 상태 구조(.planning/)를 실제로 공유할 것

---

## Platform API 차이 분석

### Claude Code 고유 API (Codex에서 사용 불가)

| API | 현재 사용 위치 | Codex 동등물 |
|-----|--------------|-------------|
| `Skill(skill="...", args="...")` | sg-plan, sg-execute, sg-start, sg-learn | 없음. AGENTS.md에서 해당 skill 디렉토리를 직접 가리키는 지침으로 대체 |
| `AskUserQuestion(...)` | sg-start (3-option resume prompt) | 없음. AGENTS.md에 interactive selection 절차를 prose로 기술 |
| `Agent(description="...", prompt="...")` | sg-plan (subagent for gsd-discuss-phase) | 없음. AGENTS.md에 해당 단계의 지침을 인라인으로 포함 |
| `${CLAUDE_PLUGIN_ROOT}` 환경변수 | hooks/hooks.json의 command 경로 | `.codex/hooks.json`에서 `${CODEX_PLUGIN_ROOT}` 또는 상대경로 사용 |

### 훅 시스템 비교

Claude Code와 Codex는 훅 시스템 구조가 거의 동일하다.

| 항목 | Claude Code | Codex |
|------|------------|-------|
| 설정 파일 | `hooks/hooks.json` (플러그인 내부) | `.codex/hooks.json` (repo 루트) |
| 이벤트 종류 | PreToolUse, Stop, SubagentStop | PreToolUse, PostToolUse, Stop, SessionStart, UserPromptSubmit, PermissionRequest |
| 실행 방식 | JSON stdin → stdout | JSON stdin → stdout (동일) |
| Stop 출력 필드 | `{"systemMessage": "..."}` | `{"systemMessage": "..."}` (동일) |
| PreToolUse | tool_name, tool_input | tool_name, tool_input (동일) |
| 경로 환경변수 | `${CLAUDE_PLUGIN_ROOT}` | 없음 — 상대경로 또는 절대경로 |

**핵심:** Stop 훅의 JSON 입출력 스키마가 동일하다. `stop_hook.py`와 `rule_runner.py`는 로직 수정 없이 Codex에서도 실행된다. 차이는 경로 해석 방식뿐이다.

### 스킬 시스템 비교

| 항목 | Claude Code | Codex |
|------|------------|-------|
| 파일 형식 | `SKILL.md` (frontmatter + instructions) | `SKILL.md` (frontmatter + instructions, 동일 형식) |
| 스킬 위치 | `.claude/skills/` 또는 플러그인 `skills/` | `.agents/skills/` 또는 `~/.agents/skills/` |
| 호출 방식 | `Skill(skill="name", args="")` API | `/skills` 명령 또는 `$skill-name` 프롬프트 또는 implicit match |
| 서브에이전트 | `Agent(...)` API | 없음 — AGENTS.md로 지침 제공, 사용자가 직접 실행 |

**핵심:** SKILL.md 형식은 호환된다. `skills/sg-retro/SKILL.md`를 `.agents/skills/sg-retro/SKILL.md`로 심링크 또는 복사하면 Codex에서 `$sg-retro`로 호출 가능하다.

---

## 신규 컴포넌트

### 1. `AGENTS.md` — 현재 파일 업그레이드 (루트 레벨)

현재 `AGENTS.md`가 이미 존재하지만 내용이 stale하다. GSD 스캐폴드가 자동 생성한 템플릿이며 실제 sg- 워크플로우 지침이 없다.

**책임:** Codex 세션에서 sg- 워크플로우 전체를 안내하는 단일 진입점. Claude Code의 `commands/*.md` 13개 파일이 제공하는 지침을 Codex가 이해할 수 있는 prose 형태로 요약한다.

**포함해야 할 내용:**
- 워크플로우 개요 (GSD → Superpowers → sg-retro 3단계)
- 각 sg- 명령의 Codex 동등 절차 (Skill() 없이 수행하는 방법)
- `.planning/` 디렉토리 구조와 각 파일의 역할
- 단계 전환 조건 (STATE.md/HANDOFF.md에서 현재 위치를 판단하는 방법)
- 의존성 설치 경로 확인 방법

**크기 제약:** Codex의 `project_doc_max_bytes` 기본값 32 KiB. 현재 13개 commands/*.md 파일 전체 합산 시 이를 초과할 가능성이 높다. AGENTS.md는 요약 + 핵심 지침만 포함하고, 상세 절차는 `.codex/skills/` 파일에 위임한다.

**Non-invasive 원칙 충족:** Claude Code는 `AGENTS.md`를 읽지 않는다. 수정해도 Claude Code 동작에 영향 없음.

### 2. `.codex/skills/` — Codex 전용 Skill 파일들

**디렉토리 구조:**
```
.codex/
  skills/
    sg-workflow/
      SKILL.md          # sg- 워크플로우 전체 절차 (핵심 명령 포함)
    sg-retro/
      SKILL.md          # skills/sg-retro/SKILL.md 의 Codex 어댑터
  hooks.json            # Codex Stop/PreToolUse 훅 설정
```

**`.codex/skills/sg-workflow/SKILL.md` 책임:**

Claude Code에서 `commands/*.md` 13개 파일이 각각 처리하는 sg-plan, sg-execute, sg-review, sg-learn, sg-status, sg-start, sg-ship, sg-complete, sg-lessons 등의 동작을 Codex Skill 형태로 제공한다. `Skill()` API 호출 대신 "GSD skill을 직접 실행하는 방법"을 지침으로 기술한다.

예시 대응:
- `Skill(skill="gsd-plan-phase", args="N")` → `/gsd-plan-phase N` 또는 `$gsd-plan-phase` with args
- `AskUserQuestion(...)` → 같은 질문을 prose로 제시하고 사용자 응답 대기
- `Agent(prompt="...")` → 서브에이전트 없이 단일 세션에서 동일 절차 수행

**`.codex/skills/sg-retro/SKILL.md` 책임:**

기존 `skills/sg-retro/SKILL.md`는 Codex의 SKILL.md 형식과 이미 호환된다 (frontmatter + instructions). 그러나 인라인 bash에서 `python3 hooks/lessons_ranker.py` 경로가 Claude Code 플러그인 루트 상대 경로다. Codex에서는 repo 루트 상대로 실행된다. 이를 처리하는 어댑터 또는 경로 수정 버전을 `.codex/skills/sg-retro/SKILL.md`로 제공한다.

**`.codex/hooks.json` 책임:**

Claude Code의 `hooks/hooks.json`을 Codex 형식으로 재작성한 버전. Python 스크립트 로직 자체는 재사용하고, 경로만 `${CLAUDE_PLUGIN_ROOT}` 대신 repo 루트 상대경로로 수정한다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 hooks/rule_runner.py",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 hooks/stop_hook.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

`SubagentStop`은 Codex에 존재하지 않으므로 제거. Codex의 `SessionStart` 이벤트를 활용해 세션 시작 시 lessons reminder를 주입하는 것은 선택적 추가 기능.

### 3. README 업데이트 (기존 파일 수정)

`README.md`와 `README.ko.md`에 "Codex 설치" 섹션 추가. Claude Code 섹션과 분리하여 플랫폼별로 명확히 구분.

---

## 공유 컴포넌트 (수정 없음)

### `.planning/` 디렉토리 — 완전 공유 가능

Claude Code와 Codex 양쪽에서 동일한 `.planning/` 구조를 사용할 수 있다. 상태 파일들의 내용이 markdown/JSON이므로 플랫폼 독립적이다.

| 파일 | Claude Code | Codex |
|------|------------|-------|
| `STATE.md` | sg-plan/sg-execute가 읽음 | sg-workflow Skill이 읽음 |
| `HANDOFF.md` | sg-execute가 씀, sg-status가 읽음 | sg-workflow Skill이 씀/읽음 |
| `lessons/` | stop_hook.py가 씀, sg-plan이 읽음 | stop_hook.py가 씀 (Codex Stop hook), sg-workflow가 읽음 |
| `phases/` | sg-plan/sg-execute가 읽음 | sg-workflow Skill이 읽음 |
| `config.json` | stop_hook.py가 읽음 (`auto_advance`) | stop_hook.py가 읽음 (동일) |

**결론:** `.planning/` 를 위한 신규 파일 불필요. 기존 파일 수정도 불필요.

### `hooks/stop_hook.py`, `hooks/rule_runner.py`, `hooks/lessons_ranker.py` — 재사용

Python 로직 자체는 플랫폼 독립적이다. 파일을 복사하거나 링크할 필요 없음. `.codex/hooks.json`에서 `hooks/stop_hook.py`를 가리키면 된다.

Stop hook의 `systemMessage` 출력은 Codex Stop 이벤트에서도 동일하게 작동한다 (JSON 스키마 동일 확인).

### `skills/sg-retro/SKILL.md` — 거의 재사용 가능

SKILL.md 형식은 호환된다. 단, 인라인 bash의 `python3 hooks/lessons_ranker.py` 경로가 문제다. Claude Code는 플러그인 루트에서, Codex는 `.agents/skills/sg-retro/`에서 실행하므로 상대 경로가 달라진다.

해결 방법: `.codex/skills/sg-retro/SKILL.md`를 별도로 만들어 경로만 수정 (`python3 ../../hooks/lessons_ranker.py` 또는 절대경로). 원본 파일은 수정하지 않는다.

---

## 컴포넌트 경계

```
Claude Code 경로 (기존, 수정 없음)
├── commands/*.md          ← Skill/AskUserQuestion/Agent API 사용
├── skills/sg-retro/       ← Claude Code skills/ 디렉토리
├── hooks/hooks.json        ← ${CLAUDE_PLUGIN_ROOT} 경로
└── .claude-plugin/         ← Claude Code 플러그인 manifest

공유 영역 (양 플랫폼)
├── .planning/              ← 상태, 계획, lessons (플랫폼 독립)
├── hooks/stop_hook.py      ← Python 로직 (경로 독립)
├── hooks/rule_runner.py    ← Python 로직 (경로 독립)
└── hooks/lessons_ranker.py ← Python 로직 (경로 독립)

Codex 경로 (신규)
├── AGENTS.md               ← 업그레이드 (기존 템플릿 교체)
└── .codex/
    ├── hooks.json           ← 신규 (hooks/hooks.json의 Codex 버전)
    └── skills/
        ├── sg-workflow/
        │   └── SKILL.md     ← 신규 (13개 commands/*.md의 Codex 통합 버전)
        └── sg-retro/
            └── SKILL.md     ← 신규 (skills/sg-retro의 경로 수정 어댑터)
```

---

## 데이터 플로우 변화

### Claude Code 기존 데이터 플로우 (변경 없음)
```
sg-plan → Agent(gsd-discuss-phase) → Skill(gsd-plan-phase)
        ↓ 기록
        .planning/HANDOFF.md
        ↓
sg-execute → Skill(superpowers:executing-plans)
           ↓ 종료 감지
           hooks/stop_hook.py (Stop/SubagentStop)
           ↓ systemMessage
           다음 단계 안내
```

### Codex 신규 데이터 플로우
```
AGENTS.md (세션 시작 시 자동 주입)
   ↓
$sg-workflow (Codex Skill 호출)
   → 워크플로우 지침 기반으로 GSD/Superpowers를 텍스트 지침으로 안내
   → .planning/ 읽기/쓰기 (동일 파일 사용)
   ↓
.codex/hooks.json → hooks/stop_hook.py (Stop 이벤트)
   ↓ systemMessage
   다음 단계 안내 (Claude Code와 동일 메시지)
```

---

## 빌드 순서

### Phase 1: AGENTS.md 업그레이드

**근거:** 가장 높은 사용자 가시성. 의존성 없음. Codex 사용자의 첫 진입점이므로 먼저 확립한다. 현재 파일이 stale 템플릿이므로 즉각 교체 가치가 있다.

**산출물:** `AGENTS.md` (수정)

**검증:** Codex 세션에서 내용 확인. Claude Code는 AGENTS.md를 읽지 않으므로 기존 동작 영향 없음.

**Non-invasive 충족 여부:** 기존 commands/*.md, skills/, hooks/ 파일 모두 무수정.

### Phase 2: `.codex/hooks.json` 신규 생성

**근거:** Python hook 스크립트를 그대로 재사용하며 Codex 훅 설정만 추가한다. 신규 파일 하나. 기존 파일 변경 없음. Phase 3의 sg-workflow Skill과 독립적이므로 먼저 구현 가능.

**산출물:** `.codex/hooks.json`

**검증:** Codex 세션에서 `/hooks`로 등록 확인. Stop 이벤트 발생 시 `stop_hook.py`가 실행되고 `systemMessage`가 출력되는지 확인.

**주의:** Codex의 `.codex/` 디렉토리는 repo에 신뢰(trusted)되어야 훅이 실행된다. README Codex 섹션에 `codex trust` 또는 `/permissions` 명령 안내 포함 필요.

### Phase 3: `.codex/skills/sg-workflow/SKILL.md` 신규 생성

**근거:** Phase 1의 AGENTS.md가 참조하는 핵심 Skill. sg-workflow Skill이 있어야 AGENTS.md의 지침이 실제로 실행 가능해진다. 13개 commands/*.md의 핵심 절차를 단일 Codex Skill로 통합하는 가장 복잡한 컴포넌트.

**산출물:** `.codex/skills/sg-workflow/SKILL.md`

**검증:** Codex에서 `$sg-workflow`로 호출 → sg-plan/sg-execute에 해당하는 절차가 안내되고 .planning/ 파일이 올바르게 읽혀지는지 확인.

**설계 제약:**
- `Skill()` API 없이 GSD/Superpowers를 어떻게 안내할지가 핵심 문제
- Codex는 `$gsd-plan-phase` 형태로 GSD Skill을 직접 호출할 수 있음 (GSD가 `.agents/skills/`에 설치된 경우)
- GSD가 `.agents/skills/`에 없는 경우를 위한 fallback 지침 필요

### Phase 4: `.codex/skills/sg-retro/SKILL.md` 신규 생성

**근거:** sg-retro는 super-gsd의 핵심 차별점이므로 Codex에서도 제공해야 한다. 그러나 기존 `skills/sg-retro/SKILL.md`가 이미 잘 작동하므로, 이 Phase는 경로 어댑터 작성에 불과하다. Phase 3보다 단순하다.

**산출물:** `.codex/skills/sg-retro/SKILL.md`

**검증:** Codex에서 `$sg-retro`로 호출 → lens 선택, artifact 수집, lessons 저장까지 전체 플로우 확인.

### Phase 5: README Codex 섹션 추가

**근거:** 나머지 Phase들이 완성된 후 문서화. 설치 방법, trust 설정, 사용 방법을 Claude Code 섹션과 분리하여 기술.

**산출물:** `README.md`, `README.ko.md` (수정)

---

## 리스크

### Risk 1: GSD/Superpowers의 Codex 호환성 미확인

**현상:** sg-execute는 `Skill(skill="superpowers:executing-plans", ...)`을 호출한다. Codex에서 Superpowers가 `.agents/skills/`에 설치되어 있다면 `$superpowers:executing-plans`로 호출 가능하다. 그러나 Superpowers/GSD의 Codex 지원 여부가 확인되지 않았다.

**완화:** `.codex/skills/sg-workflow/SKILL.md`에서 GSD/Superpowers가 설치된 경우와 없는 경우 두 가지 경로를 모두 기술한다. 설치 없이도 "GSD 방식의 계획 수립"을 직접 수행하는 fallback 지침 포함.

**Confidence:** LOW — GSD/Superpowers의 Codex 지원 현황은 추가 조사 필요.

### Risk 2: `.codex/` 신뢰 설정 부담

**현상:** Codex는 project-scoped `.codex/hooks.json`이 로드되려면 프로젝트가 신뢰되어야 한다. 신규 사용자가 이 설정을 놓치면 훅이 무음으로 실패한다.

**완화:** README Codex 섹션에 신뢰 설정 단계를 설치 절차에 포함. `.codex/`가 없는 상태에서도 AGENTS.md와 sg-workflow Skill만으로 기본 워크플로우 안내는 가능하므로 훅은 선택적 기능으로 분류.

### Risk 3: AGENTS.md 32 KiB 제한

**현상:** sg-workflow의 모든 명령 절차를 AGENTS.md에 인라인하면 32 KiB를 초과한다. 13개 commands/*.md의 평균 크기가 3-5 KiB이므로 전체 합산 40-65 KiB.

**완화:** AGENTS.md는 워크플로우 개요와 핵심 규칙만 포함 (~5 KiB 목표). 상세 절차는 `.codex/skills/sg-workflow/SKILL.md`에 위임. Codex는 AGENTS.md 로드 후 `/skills`나 `$sg-workflow`로 상세 지침에 접근하는 2단계 구조.

### Risk 4: sg-workflow Skill의 단일 파일 복잡도

**현상:** 13개 commands/*.md를 하나의 Skill에 통합하면 파일이 매우 커진다. Codex의 context window 대비 skill 크기 제약이 있을 수 있다.

**완화:** Phase 4 이후 실제 사용에서 확인. 필요하면 `sg-workflow`를 `sg-workflow-plan`과 `sg-workflow-execute`로 분리. 이 결정은 Phase 3 구현 중에 내린다.

---

## 비침투적 원칙 준수 확인

| 기존 파일 | 수정 여부 | 근거 |
|----------|---------|-----|
| `commands/*.md` (13개) | 수정 없음 | Claude Code 전용. Codex는 이 파일을 실행하지 않음 |
| `skills/sg-retro/SKILL.md` | 수정 없음 | Codex 어댑터는 `.codex/skills/sg-retro/SKILL.md`에 별도 생성 |
| `hooks/hooks.json` | 수정 없음 | Codex 훅은 `.codex/hooks.json`에 별도 생성 |
| `hooks/*.py` (4개) | 수정 없음 | 경로 독립적 Python 로직. `.codex/hooks.json`에서 참조만 함 |
| `.claude-plugin/plugin.json` | 수정 없음 | Claude Code 플러그인 manifest |
| `.planning/**` | 수정 없음 | 공유 상태 파일. 양 플랫폼에서 읽기/쓰기 |
| `AGENTS.md` | 수정함 | 현재 파일이 stale 템플릿 (GSD 자동생성). 실제 sg- 지침으로 교체 필요 |
| `README.md`, `README.ko.md` | 수정함 | Codex 섹션 추가 — 기존 섹션 변경 없음 |
