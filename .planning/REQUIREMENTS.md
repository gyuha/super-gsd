# Requirements: super-gsd v2.4

## Goal

`hooks/*.py` 4개 파일과 Skill 내부의 모든 `python3` 호출을 순수 Node.js(`*.cjs`, 외부 의존성 0)로 교체하여 사용자가 Node만 설치된 환경에서도 super-gsd 플러그인을 즉시 사용할 수 있게 한다.

## Background

- **현재 상태**: `hooks/{stop_hook,rule_runner,lessons_ranker,transcript_matcher}.py` (716 lines) + Skill 내 8개 `python3` 호출 지점
- **동기**: 사용자가 Node만 있으면 플러그인이 동작하길 원함 → 의존성 축소
- **제약**: Claude Code 자체가 Node 18+ 요구 → Node는 사실상 보장. Python은 사용자 환경 가변 (특히 Windows/macOS 14+에서 깨질 수 있음)
- **언어/모듈 결정**: 순수 JavaScript + CommonJS(`.cjs`) — 의존성 0, package.json 불필요, 컴파일/빌드 단계 없음
- **동등성 원칙**: 동작 1:1 매핑. 입출력 JSON 스키마, regex 매칭 결과, exit code 모두 동일해야 함

## Requirements

### Core hooks 재작성

#### NODE-01: stop_hook.cjs 재작성
`hooks/stop_hook.py` (163 lines)를 `hooks/stop_hook.cjs`로 재작성한다. Stop/SubagentStop 이벤트의 stdin JSON을 읽어 transcript에서 신호를 매칭하고 `systemMessage`로 다음 단계를 안내한다. `.planning/config.json`의 `super_gsd.auto_advance: false`로 비활성화 가능 동작 유지.
**Files**: `hooks/stop_hook.cjs`

#### NODE-02: transcript_matcher.cjs 재작성
`hooks/transcript_matcher.py` (60 lines)를 `hooks/transcript_matcher.cjs`로 재작성한다. `stop_hook.cjs`에서 require로 로드되며 신호 패턴(GSD_PLAN_COMPLETE, REVIEW_SIGNALS, HOOKIFY_SIGNALS 등) 매칭 함수를 export한다.
**Files**: `hooks/transcript_matcher.cjs`

#### NODE-03: rule_runner.cjs 재작성
`hooks/rule_runner.py` (278 lines)를 `hooks/rule_runner.cjs`로 재작성한다. PreToolUse 이벤트에서 `.claude/hookify.*.local.md` + `.claude/sg-rule.*.local.md` 규칙을 읽어 frontmatter 평가, regex/conditions 매칭, warn/block 응답. hookify 플러그인 감지 시 자동 skip.
**Files**: `hooks/rule_runner.cjs`

#### NODE-04: lessons_ranker.cjs 재작성
`hooks/lessons_ranker.py` (215 lines)를 `hooks/lessons_ranker.cjs`로 재작성한다. CLI 인터페이스 (`--top N`, `--archive --milestone vX.Y`, glob 인자) 보존. 가중치 공식 (0.4×freq + 0.4×recency + 0.2×severity) 동일.
**Files**: `hooks/lessons_ranker.cjs`

### Hook 설정 갱신

#### CFG-01: hooks/hooks.json 명령 교체
Claude Code hooks 매니페스트의 `python3 "${CLAUDE_PLUGIN_ROOT}/hooks/*.py"` 명령을 `node "${CLAUDE_PLUGIN_ROOT}/hooks/*.cjs"`로 교체한다.
**Files**: `hooks/hooks.json`

#### CFG-02: .codex/hooks.json 명령 교체
Codex CLI용 hooks 설정의 `python3 hooks/*.py`를 `node hooks/*.cjs`로 교체한다.
**Files**: `.codex/hooks.json`

#### CFG-03: .gemini/settings.json 명령 교체
Gemini CLI용 settings의 `python3 $GEMINI_PROJECT_DIR/hooks/*.py`를 `node $GEMINI_PROJECT_DIR/hooks/*.cjs`로 교체한다.
**Files**: `.gemini/settings.json`

### Skill 내부 호출 교체

#### SKILL-01: lessons_ranker 호출 (skills/)
`skills/sg-plan/SKILL.md`, `skills/sg-execute/SKILL.md`, `skills/sg-complete/SKILL.md`에서 `python3 hooks/lessons_ranker.py ...` 호출을 `node hooks/lessons_ranker.cjs ...`로 교체한다.
**Files**: `skills/sg-plan/SKILL.md`, `skills/sg-execute/SKILL.md`, `skills/sg-complete/SKILL.md`

#### SKILL-02: 인라인 python3 -c 교체 (skills/)
`skills/sg-quick/SKILL.md` (2건), `skills/sg-ui-plan/SKILL.md` (1건)의 인라인 `python3 -c "import json,sys; ..."` JSON 파싱을 `node -e "..."` 또는 `jq`로 교체한다. macOS/Linux 양쪽에서 동작 확인.
**Files**: `skills/sg-quick/SKILL.md`, `skills/sg-ui-plan/SKILL.md`

### Agents 사본 동기화

#### AGENT-01: .agents/skills/ 사본 동기화
`.agents/skills/sg-{ship,plan,execute}/SKILL.md`의 `python3` 호출을 동일한 규칙으로 교체한다 (Codex CLI 호환 사본).
**Files**: `.agents/skills/sg-ship/SKILL.md`, `.agents/skills/sg-plan/SKILL.md`, `.agents/skills/sg-execute/SKILL.md`

### 정리

#### CLEAN-01: hooks/*.py 일괄 삭제
모든 `.cjs` 교체 및 검증이 완료된 후 4개 `.py` 파일을 `git rm`으로 일괄 삭제한다. **모든 다른 REQ가 validated 상태일 때만 수행**.
**Files**: `hooks/stop_hook.py`, `hooks/rule_runner.py`, `hooks/lessons_ranker.py`, `hooks/transcript_matcher.py`

### 문서

#### DOC-01: CLAUDE.md 갱신
프로젝트 CLAUDE.md의 Tech stack, Architecture(`hooks/*.py` → `hooks/*.cjs`), Development Commands(직접 호출 예시), 파일명 결정 키 (`Python 파일명 하이픈 대신 밑줄 사용`)를 갱신한다.
**Files**: `CLAUDE.md`

#### DOC-02: README.md / README.ko.md 갱신
설치 안내 및 시스템 요구사항 섹션에서 Python 요구사항을 제거하고 Node 18+ 요구사항으로 교체한다.
**Files**: `README.md`, `README.ko.md`

#### DOC-03: CHANGELOG.md 마일스톤 항목 추가
v2.4 마일스톤 변경 내역을 CHANGELOG.md에 기록 (각 phase 종료 시점 또는 마일스톤 완료 시점에 종합 기록).
**Files**: `CHANGELOG.md`

## Out of Scope

- **`.planning/` 아카이브 파일** — 과거 milestone 문서, phase 기록의 python3 언급은 역사 기록으로 보존
- **`.planning/research/GEMINI.md`, `ANTIGRAVITY.md`** — 외부 도구 연구 노트는 수정하지 않음
- **테스트 인프라 신규 도입** — 동작 동등성은 manual smoke test로 검증, 자동 테스트 프레임워크 추가 없음
- **TypeScript 도입** — 순수 JS 원칙 유지, 향후 milestone에서 재검토
- **package.json 추가** — 외부 의존성 0이 결정사항, package.json 불필요
- **GSD/Superpowers 자체의 Python 의존성** — 비침투적 원칙 유지, 외부 도구는 수정하지 않음

## Success Criteria

1. `grep -rn 'python3' hooks/ skills/ .agents/skills/ .codex/ .gemini/ CLAUDE.md README.md README.ko.md` 결과 0건
2. `ls hooks/*.py` 결과 0건 (CLEAN-01 후)
3. `node hooks/stop_hook.cjs < test_input.json` 가 Python 버전과 동일한 stdout/exit code 반환
4. `node hooks/rule_runner.cjs < test_input.json` 가 동일한 규칙 평가 결과 반환
5. `node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md` 가 동일한 weighted ranking 반환
6. Claude Code 세션에서 PreToolUse / Stop / SubagentStop 훅이 모두 정상 트리거됨 (manual)
7. Skill 명령(`/super-gsd:sg-plan`, `sg-execute`, `sg-complete`, `sg-quick`, `sg-ui-plan`)이 python3 없이 정상 동작 (manual)

## Traceability

| REQ-ID | Phase | Status | Notes |
|--------|-------|--------|-------|
| NODE-01 | TBD | ⬜ Pending | stop_hook.cjs |
| NODE-02 | TBD | ⬜ Pending | transcript_matcher.cjs |
| NODE-03 | TBD | ⬜ Pending | rule_runner.cjs |
| NODE-04 | TBD | ⬜ Pending | lessons_ranker.cjs |
| CFG-01 | TBD | ⬜ Pending | hooks/hooks.json |
| CFG-02 | TBD | ⬜ Pending | .codex/hooks.json |
| CFG-03 | TBD | ⬜ Pending | .gemini/settings.json |
| SKILL-01 | TBD | ⬜ Pending | skills/sg-{plan,execute,complete}/SKILL.md |
| SKILL-02 | TBD | ⬜ Pending | skills/sg-{quick,ui-plan}/SKILL.md |
| AGENT-01 | TBD | ⬜ Pending | .agents/skills/sg-{ship,plan,execute}/SKILL.md |
| CLEAN-01 | TBD | ⬜ Pending | hooks/*.py 일괄 삭제 (마지막 phase) |
| DOC-01 | TBD | ⬜ Pending | CLAUDE.md |
| DOC-02 | TBD | ⬜ Pending | README.md, README.ko.md |
| DOC-03 | TBD | ⬜ Pending | CHANGELOG.md |
