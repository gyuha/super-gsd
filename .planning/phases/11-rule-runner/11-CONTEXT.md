# Phase 11: 자체 rule runner - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

super-gsd가 **자체 PreToolUse hook**을 등록해 `.claude/sg-rule.*.local.md` (신규 네임스페이스) 및 `.claude/hookify.*.local.md` (기존 호환) 파일을 Python으로 직접 실행한다. hookify 플러그인 미설치 환경에서도 가드가 동작하며, hookify가 설치된 환경에서는 충돌 없이 skip한다.

이 phase의 책임:
1. `hooks/rule_runner.py` — Python으로 독립 구현된 rule 파싱 + PreToolUse 응답 생성기
2. `hooks/hooks.json` — 기존 Stop/SubagentStop 항목 유지 + PreToolUse 항목 추가
3. hookify 설치 감지 로직 — 설치 시 rule_runner 비활성화 (skip)
4. 두 글로브 경로 스캔 — `.claude/hookify.*.local.md` + `.claude/sg-rule.*.local.md`
5. rule action `warn`/`block` → PreToolUse hook 응답 매핑

Phase 12(lessons aggregation), Phase 13(sg-learn 라우팅 전환)은 이 phase 스코프 밖이다.

</domain>

<decisions>
## Implementation Decisions

### Rule Runner 구현 방식 (회의 영역 A)

- **D-01:** rule runner는 **독립 Python 구현**이다. hookify 코드를 재활용하지 않으며 hookify dependency도 없다. `hooks/rule_runner.py` 단일 파일로 작성한다. hookify가 설치된 환경에서도 super-gsd가 독립적으로 동작해야 하므로 hookify import/호출 일체 금지.

### Rule 파일 글로브 경로 (회의 영역 B)

- **D-02:** rule 파일 스캔은 **양쪽 경로를 모두** 지원한다.
  - `.claude/hookify.*.local.md` — 기존 호환 (현재 23개 rule 파일 마이그레이션 없이 동작)
  - `.claude/sg-rule.*.local.md` — 신규 super-gsd 네임스페이스
  - 두 경로를 합쳐 단일 rule 목록으로 처리한다 (중복 name 시 sg-rule이 우선).

### hooks.json 등록 방식 (회의 영역 C)

- **D-03:** 기존 `hooks/hooks.json`에 **PreToolUse 항목을 추가**한다. Stop/SubagentStop 기존 항목은 그대로 유지한다. UserPromptSubmit은 이번 phase 범위 밖 — PreToolUse만 추가.
  ```json
  "PreToolUse": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "python3 \"${CLAUDE_PLUGIN_ROOT}/hooks/rule_runner.py\"",
          "timeout": 5
        }
      ]
    }
  ]
  ```

### hookify 충돌 회피 (회의 영역 D)

- **D-04:** hookify **설치 감지 시 rule_runner가 즉시 exit 0**한다. 미설치 환경에서만 super-gsd rule runner가 활성화된다. 감지 방법: `~/.claude/plugins/hookify/` 디렉터리 존재 여부 확인 (또는 동등한 hookify 플러그인 경로). 감지 실패 시 안전하게 skip (exit 0, stderr 경고 없음).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 기존 hooks 구현
- `hooks/hooks.json` — 현재 Stop/SubagentStop 구조. PreToolUse를 여기에 추가해야 함
- `hooks/stop_hook.py` — 기존 Python hook 구현 패턴 참조 (sys.path 처리, load_config, exit 코드 관례)
- `hooks/transcript_matcher.py` — 기존 Python 유틸리티 모듈 패턴 참조

### Rule 파일 포맷 (실제 예시)
- `.claude/hookify.warn-grep-q-bre-special.local.md` — frontmatter(name/enabled/event/action/conditions) + 본문 warn 메시지 예시
- `.claude/hookify.warn-human-gate-bypass.local.md` — `event: bash` + `pattern:` shorthand 포맷 예시
- (23개 전체 목록: `ls /Users/gyuha/workspace/super-gsd/.claude/hookify.*.local.md`)

### Phase 요건
- `.planning/REQUIREMENTS.md` §RULES-01~RULES-04 — 이 phase의 4개 요건
- `.planning/ROADMAP.md` §Phase 11 — Goal, Success Criteria, Depends on

### 선행 phase context
- `.planning/phases/10-conversation-analyzer-lens/10-CONTEXT.md` — D-01/D-05 bash-only/Python 원칙, analyzer가 rule draft를 텍스트로 제안하는 것까지가 Phase 10 책임임을 명시

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/stop_hook.py`: `load_config()` 함수 — `.planning/config.json`에서 `super_gsd` 설정 읽기 패턴. `rule_runner.py`도 동일 방식으로 `auto_advance: false` 같은 전역 비활성화 옵션을 읽을 수 있다.
- `hooks/stop_hook.py`: `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` 패턴 — 플러그인 루트 외 cwd에서 실행될 때 import 경로 보정. `rule_runner.py`에서 동일 패턴 사용 필수.

### Established Patterns
- **Python 파일명 밑줄**: `stop_hook.py`, `transcript_matcher.py` — 하이픈 없이 밑줄 사용 (Python import 호환). 새 파일도 `rule_runner.py`.
- **exit 코드**: stop_hook.py는 정상 시 exit 0, 오류 시 sys.exit(1). PreToolUse hook은 stdout JSON `{"decision": "block", "reason": "..."}` 또는 `{"decision": "warn", "message": "..."}` 형식이 필요 (Claude Code PreToolUse 응답 스펙 확인 필수).
- **hooks.json 구조**: `"hooks"` 객체 안에 hook event 이름을 key로 사용. 기존 Stop/SubagentStop 패턴과 동일하게 PreToolUse 추가.
- **`${CLAUDE_PLUGIN_ROOT}`**: hooks.json command에서 플러그인 루트 경로 참조 변수. 기존 사용 방식 유지.

### Integration Points
- `hooks/hooks.json` — PreToolUse 항목 추가 지점
- `.planning/config.json` — `auto_advance: false`로 전체 hook 비활성화 경로 확인 (rule_runner도 동일 config 존중 여부 결정 필요)
- `~/.claude/` 디렉터리 — rule 파일 위치. cwd-relative `.claude/` 경로로 스캔 (프로젝트 로컬 rules)

</code_context>

<specifics>
## Specific Ideas

### hookify 설치 감지 경로 후보
hookify 플러그인 설치 위치를 확인해 정확한 감지 경로를 결정해야 한다. 후보:
- `~/.claude/plugins/hookify/`
- `gsd-sdk query plugin-installed hookify` 같은 SDK 쿼리 (존재하면 활용)
- hookify가 설치하는 특정 파일/디렉터리 존재 여부

플래너가 실제 hookify 설치 경로를 코드베이스에서 확인해 감지 방법을 결정한다.

### PreToolUse hook 응답 포맷
Claude Code PreToolUse hook의 stdout JSON 포맷을 공식 문서/소스에서 확인해야 한다:
- `block`: 도구 실행 자체를 차단
- `warn`: 경고만 표시하고 실행은 허용

RULES-03 요건 "단순 메시지 출력이 아닌 도구 실행 자체에 영향"이므로 `block` action이 실제로 도구 실행을 막아야 한다. 포맷 미확인 시 RULES-03 달성 불가.

### Rule 파일 frontmatter 포맷 (기존 호환)
```yaml
---
name: warn-example
enabled: true
event: file        # file | bash | tool
action: warn       # warn | block
conditions:        # 상세 조건 배열
  - field: file_path
    operator: regex_match
    pattern: PLAN\.md$
  - field: new_text
    operator: regex_match
    pattern: dangerous_pattern
---
본문: 경고/차단 메시지 (markdown)
```

또는 단순 shorthand:
```yaml
---
name: warn-example
enabled: true
event: bash
pattern: dangerous_pattern   # shorthand — conditions 없이 단일 패턴
action: warn
---
```

두 포맷 모두 파싱해야 함 (기존 23개 rule 파일에서 혼용).

</specifics>

<deferred>
## Deferred Ideas

- **UserPromptSubmit hook 등록** — 이번 phase 범위 밖. D-03에서 명시적으로 제외. 향후 Phase 필요 시 추가.
- **sg-rule.*.local.md 자동 생성** (Phase 10 analyzer가 draft → 자동 파일 생성) — Phase 10은 텍스트 제안까지만. 실제 파일 자동 생성은 별도 phase 또는 Phase 12 확장에서 검토.
- **multi-project rule 공유** (프로젝트 간 공통 rule 중앙 관리) — 현재 `.claude/` 프로젝트 로컬 방식 유지. 글로벌 rule 경로(`~/.claude/sg-rule.*.md`)는 v1.3 이후 검토.
- **rule 우선순위/충돌 해소 정책** — 같은 event에 여러 rule이 매칭될 때 모두 실행 vs. 첫 번째만 등 정책. 이번 phase는 "모두 실행, block이 있으면 block 우선" 단순 정책으로 시작. 복잡한 우선순위는 deferred.

</deferred>

---

*Phase: 11-rule-runner*
*Context gathered: 2026-05-20*
