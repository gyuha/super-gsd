# 프로젝트 리서치 요약

**프로젝트:** super-gsd v1.3 Codex Platform Support
**도메인:** 멀티 플랫폼 AI 코딩 에이전트 워크플로우 플러그인
**리서치 완료:** 2026-05-21
**신뢰도:** HIGH (공식 Codex 문서 기반)

---

## 핵심 요약

super-gsd v1.3의 목표는 OpenAI Codex 사용자에게 기존 GSD → Superpowers → sg-retro 3단계 워크플로우를 제공하는 것이다. 이는 전체 포팅이 아니다. 13개 commands/*.md 파일을 복제하거나 Python 훅을 재작성할 필요 없다. 올바른 접근은 3개 레이어다: (1) AGENTS.md 교체 — Codex가 세션 시작 시 읽는 워크플로우 안내문, (2) `.agents/skills/` 신규 생성 — Codex의 스킬 디스커버리 경로, (3) `.codex/hooks.json` 신규 생성 — SubagentStop 없이 Stop + PreToolUse만 포함. 총 범위: 신규 파일 약 9개, 기존 파일 수정 2개 (Python hook 경로 1줄 픽스), README 섹션 추가.

가장 중요한 아키텍처 결정은 무엇을 하지 않을지다. SubagentStop은 Codex에 존재하지 않으며 대안이 없다. Superpowers:executing-plans 스킬은 Codex에서 실행 불가다. 이 두 가지 제약을 숨기려 하면 사용자가 작동한다고 믿는 기능이 실제로는 침묵 속에 실패하는 상황이 된다. v1.3은 Codex에서 가능한 것(sg-retro, 워크플로우 안내, Stop 훅, 상태 파일 공유)을 명확하게 제공하고, 불가능한 것(SubagentStop 자동 핸드오프, Superpowers 연동)을 문서에서 명시적으로 인정해야 한다.

리스크는 기술적이기보다 범위적이다. 13개 명령어를 Codex 스킬로 완전 동등하게 포팅하려는 충동이 가장 큰 위험이다. 그 결과는 즉시 stale해지고, 유지보수 부담이 2배가 되며, 실제로는 핵심 동작(SubagentStop, Superpowers)이 빠진 채 완전한 것처럼 보이는 코드다. 올바른 scope는 "prompt-helper 스킬 + 상태 파일 공유 + 정직한 기능 테이블"이다.

---

## 주요 발견

### 스택 추가 항목 (STACK.md)

Codex 지원에 npm 패키지나 새 언어가 필요하지 않다. 기존 Python 3 stdlib 훅은 Codex에서 그대로 실행된다.

| 항목 | 액션 | 설명 |
|------|------|------|
| `AGENTS.md` (repo root) | 교체 | stale GSD 템플릿 → 실제 sg- 워크플로우 지침 |
| `.agents/skills/sg-retro/SKILL.md` | 신규 | skills/sg-retro/SKILL.md 어댑터 (경로 수정) |
| `.agents/skills/sg-start/SKILL.md` | 신규 | 경량 래퍼 스킬 |
| `.agents/skills/sg-plan/SKILL.md` | 신규 | 경량 래퍼 스킬 |
| `.agents/skills/sg-execute/SKILL.md` | 신규 | 경량 래퍼 스킬 ("manual prompt assistant" 명시) |
| `.agents/skills/sg-review/SKILL.md` | 신규 | 경량 래퍼 스킬 |
| `.agents/skills/sg-status/SKILL.md` | 신규 | 경량 래퍼 스킬 |
| `.codex/hooks.json` | 신규 | Stop + PreToolUse만, SubagentStop 제외 |
| `hooks/rule_runner.py` | 1줄 수정 | CLAUDE_PLUGIN_ROOT 폴백 처리 |
| `hooks/stop_hook.py` | 1줄 수정 | CLAUDE_PLUGIN_ROOT 폴백 처리 |
| `README.md` | 섹션 추가 | Codex 설치 + 기능 차이 테이블 |

**수정하지 않는 파일:** `commands/*.md` (13개), `skills/sg-retro/SKILL.md`, `hooks/hooks.json`, `hooks/lessons_ranker.py`, `.claude-plugin/plugin.json`, `.planning/**`

**버전 요건:** `@openai/codex` CLI는 Node 22+ 필요 (사용자 책임, super-gsd 의존성 아님)

### 기능 구분 (FEATURES.md)

**테이블 스테이크 (없으면 Codex 지원이라 할 수 없음):**
- `AGENTS.md` 교체 — Codex가 워크플로우를 이해하는 유일한 진입점 (복잡도: 낮음)
- `.agents/skills/` sg-retro 어댑터 — AskUserQuestion 제거 필요 (복잡도: 중간)
- `.codex/hooks.json` — Stop 훅 활성화, SubagentStop 제외 (복잡도: 낮음)
- README Codex 섹션 — 설치 경로, 기능 제한 명시 (복잡도: 낮음)

**차별화 기능 (v1.3 이후):**
- 13개 sg-* 전체 `.agents/skills/` SKILL.md
- `agents/openai.yaml` UI 메타데이터
- Codex용 sg-health 변형
- `~/.codex/AGENTS.md` 글로벌 템플릿

**명시적 비목표 (v1.3에서 구현하지 않음):**
- SubagentStop 대체 훅 — Codex GitHub 이슈 #21753 미해결, 대안 없음
- Superpowers:executing-plans 에뮬레이션 — Superpowers 미포팅
- 13개 명령 bash-동등 full-parity 포팅 — 즉시 stale, 유지보수 불가
- lessons_ranker.py Codex 훅 포팅 — plugin_hooks 기본 off, scope 초과
- 플러그인 마켓플레이스 자동 게시 — 외부 요인

### 아키텍처 결정 (ARCHITECTURE.md)

3개 영역 분리:

**Claude Code 전용 (무수정):** `commands/*.md`, `skills/sg-retro/`, `hooks/hooks.json`, `.claude-plugin/`

**공유 영역 (무수정):** `.planning/` (STATE.md, HANDOFF.md, lessons/, config.json), `hooks/*.py` (Python 로직 자체는 플랫폼 독립)

**Codex 신규:** `AGENTS.md` (교체), `.agents/skills/sg-*/SKILL.md` (신규), `.codex/hooks.json` (신규)

핵심 패턴: SKILL.md 형식은 두 플랫폼 모두 동일 (YAML frontmatter + instructions). `.planning/` 공유로 양 플랫폼이 동일한 상태를 읽는다.

Codex 데이터 플로우: `AGENTS.md 주입 → $sg-* 스킬 호출 → .planning/ 읽기/쓰기 → Stop 이벤트 → stop_hook.py → systemMessage`

### 핵심 함정 (PITFALLS.md)

**CRITICAL (구현 전 반드시 확인):**

1. **SubagentStop 부재** — 리뷰 완료 후 sg-retro 자동 안내가 Codex에서 절대 발생하지 않는다. AGENTS.md에 "수동으로 $sg-retro 호출" 명시. 자동 핸드오프 암시 금지.

2. **`${CLAUDE_PLUGIN_ROOT}` 미정의** — Codex에서 이 환경변수가 없다. `.codex/hooks.json`의 모든 hook command를 상대경로로 작성. Python 파일에 1줄 폴백 픽스: `PLUGIN_ROOT = os.environ.get('CLAUDE_PLUGIN_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))`

3. **`.codex/skills/` 잘못된 디렉토리** — Codex 스킬 디스커버리는 `.agents/skills/`만 스캔. `.codex/`는 config/hooks 전용. 모든 스킬 파일을 `.agents/skills/sg-*/SKILL.md`에 생성.

4. **AGENTS.md에서 슬래시 명령 문법** — `/sg-execute`는 Codex에서 "command not found". AGENTS.md 전체에서 `$sg-execute` 또는 `@sg-execute` 사용.

5. **sg-execute가 Superpowers 호출 암시** — Superpowers는 Codex 미포팅. sg-execute Codex 스킬은 "manual prompt assistant"로 명시.

**MODERATE (구현 중 주의):**
- AGENTS.md 32 KiB 제한 — 8 KiB 이하 유지, 상세는 `.agents/skills/`에 위임
- 상대 경로 `.planning/` 실패 — 모든 bash 블록에서 `git rev-parse --show-toplevel` 사용
- Full-parity 포팅 충동 — prompt-helper 스킬만, bash 로직 복제 금지
- Codex Stop 훅 `decision: "block"` — 세션 루프 계속 유발. 안내 메시지엔 `"pass"` 또는 decision 필드 생략

---

## 로드맵 시사점

연구 기반 권장 페이즈 구조 (4개 페이즈):

### 페이즈 1: AGENTS.md 교체
**근거:** 의존성 없음. 현재 파일이 stale 템플릿. Codex 사용자의 첫 번째 진입점.
**산출물:** `AGENTS.md` 교체 (Codex 어휘, 8 KiB 이하, SubagentStop 부재 명시)
**대응 기능:** TS-01 (AGENTS.md)
**피해야 할 함정:** Pitfall 3 (슬래시 명령), Pitfall 4 (32 KiB 초과)

### 페이즈 2: `.codex/hooks.json` + Python hook 픽스
**근거:** Python 재사용으로 최소 작업. 페이즈 3과 독립적이므로 병행 가능.
**산출물:** `.codex/hooks.json` (신규), `hooks/rule_runner.py` + `hooks/stop_hook.py` (각 1줄 수정)
**대응 기능:** TS-04 (Codex hooks)
**피해야 할 함정:** Pitfall 2 (CLAUDE_PLUGIN_ROOT), Pitfall 12 (block 오용)

### 페이즈 3: `.agents/skills/` 스킬 파일 생성
**근거:** AGENTS.md가 참조하는 스킬 구현. sg-retro만 실질적 수정 필요, 나머지 5개는 기계적.
**산출물:** `.agents/skills/sg-{retro,start,plan,execute,review,status}/SKILL.md` (6개)
**대응 기능:** TS-03 (.agents/skills/ adapted skills)
**피해야 할 함정:** Pitfall 5 (Superpowers 암시), Pitfall 6 (잘못된 디렉토리), Pitfall 9 (상대경로), Pitfall 10 (full-parity 충동)

### 페이즈 4: README Codex 섹션
**근거:** 모든 구현 완료 후 문서화. 기능 델타 테이블로 정직한 기능 범위 명시.
**산출물:** `README.md` 수정 (설치 절차, trust 설정, 기능 delta 테이블)
**대응 기능:** TS-02 (README Codex section)
**피해야 할 함정:** Pitfall 11 (AGENTS.md 자동 발견 오해)

### 페이즈 순서 근거

페이즈 1 (AGENTS.md) → 의존성 없음, 진입점 먼저 확립
페이즈 2 (hooks.json) → 페이즈 1과 독립, 최소 작업으로 Stop 훅 활성화
페이즈 3 (.agents/skills/) → 페이즈 1이 참조하는 스킬 구현
페이즈 4 (README) → 전체 구현 후 문서화

FEATURES.md 빌드 순서(TS-01 → TS-03 → TS-04 → TS-02) 및 ARCHITECTURE.md 빌드 순서와 일치.

### 연구 플래그

**추가 연구 불필요한 페이즈 (전체):** 공식 Codex 문서에서 직접 검증된 패턴.

**구현 중 확인 필요한 불확실성:**
- GSD/Superpowers가 `.agents/skills/`에 설치된 Codex 환경에서 `$gsd-plan-phase` 호출 가능 여부 [낮음 신뢰도] — sg-execute Codex 스킬을 "manual prompt assistant"로 명시해 대응
- Codex hooks 실행 환경의 cwd 기준 — git rev-parse 사용으로 대응

---

## 신뢰도 평가

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| Stack | HIGH | 공식 Codex 개발자 문서에서 직접 확인 (AGENTS.md 형식, `.agents/skills/` 경로, hooks.json 스키마) |
| Features | HIGH | 공식 Codex 문서 + SubagentStop GitHub 이슈(#21753)로 기능 제한 확인 |
| Architecture | HIGH | 기존 코드베이스 직접 분석 + Codex docs 교차 검증 |
| Pitfalls | HIGH | 공식 docs에서 직접 확인된 pitfall. practitioner 출처는 MEDIUM |

**전체 신뢰도: HIGH**

### 해소되지 않은 갭

- **GSD/Superpowers Codex 지원 여부 [낮음]:** 실제 환경에서 `$gsd-plan-phase` 작동 여부 미확인. 완화: sg-execute를 "manual prompt assistant"로 명시.
- **Codex hooks.json 신뢰 설정 UX [중간]:** 버전별로 절차가 달라질 수 있음. README에 최신 절차 기술.
- **`.codex-plugin/plugin.json` 필요 여부 [낮음]:** 마켓플레이스 등록은 v1.3 비목표이므로 연기.

---

## 출처

### Primary (HIGH 신뢰도)
- Codex AGENTS.md Guide: https://developers.openai.com/codex/guides/agents-md
- Codex Skills docs: https://developers.openai.com/codex/skills
- Codex Hooks docs: https://developers.openai.com/codex/hooks
- Codex CLI Slash Commands: https://developers.openai.com/codex/cli/slash-commands
- SubagentStop 미지원 이슈: https://github.com/openai/codex/issues/21753
- Codex Custom Prompts (deprecated): https://developers.openai.com/codex/custom-prompts
- Codex Plugin Build: https://developers.openai.com/codex/plugins/build
- Codex Config Reference: https://developers.openai.com/codex/config-reference

### Secondary (MEDIUM 신뢰도)
- Codex vs Claude Code 비교: https://www.builder.io/blog/codex-vs-claude-code
- Superpowers Codex 설치 가이드: https://restato.github.io/blog/installing-codex-superpowers-guide/
- Skill 경로 참고: https://www.agensi.io/learn/where-are-codex-cli-skills-stored

---

*리서치 완료: 2026-05-21*
*로드맵 준비 완료: yes*
