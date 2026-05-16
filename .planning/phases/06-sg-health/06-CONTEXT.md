# Phase 6: sg-health - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 `/super-gsd:sg-health`를 실행하면 GSD/Superpowers/Hookify 설치 상태, hooks 등록, HANDOFF.md 스키마, STATE.md 파싱 가능 여부를 라인별 `[OK]`/`[WARN]`/`[FAIL]`로 출력하고 요약 줄을 제공한다. 읽기 전용 — 어떤 파일도 생성하거나 수정하지 않는다.

추가로 `transcript_matcher.py`의 bare `'hookify'` 패턴을 제거하여 sg-health 실행 중 stop hook 오발동을 방지한다.

</domain>

<decisions>
## Implementation Decisions

### 설치 감지 경로

- **D-01:** GSD 설치 여부는 `~/.claude/get-shit-done/` 디렉토리 존재로 판정한다.
- **D-02:** Superpowers 설치 여부는 `~/.claude/plugins/data/superpowers-claude-plugins-official` 디렉토리 존재로 판정한다.
- **D-03:** Hookify 설치 여부는 `~/.claude/plugins/data/hookify-claude-plugins-official` 디렉토리 존재로 판정한다.

### sg-health 구현 형태

- **D-04:** `commands/sg-health.md` 파일만 생성한다. 별도 Python 스크립트를 추가하지 않는다.
- **D-05:** 출력 형식은 라인별 `[OK]`/`[WARN]`/`[FAIL]` + 마지막에 요약 줄. 예:
  ```
  GSD .............. [OK]
  Superpowers ...... [OK]
  Hookify .......... [OK]
  Stop hook ........ [FAIL] hooks.json에 Stop 훅 없음
  SubagentStop hook  [FAIL] hooks.json에 SubagentStop 훅 없음
  HANDOFF.md ....... [WARN] 파일 없음 (아직 인계 없음)
  STATE.md ......... [OK]

  [FAIL] 2개, [WARN] 1개 — 훅을 재등록하세요.
  ```

### HEALTH-06 패치 범위

- **D-06:** `hooks/transcript_matcher.py`의 `HOOKIFY_SIGNALS` 리스트에서 `'hookify'` 문자열만 제거한다. 나머지 3개 패턴(`'Retrospective complete'`, `'hooks generated'`, `'patterns extracted'`)은 유지한다.

### Claude's Discretion

- WARN vs FAIL 경계: HANDOFF.md/STATE.md 파일이 **없으면** WARN(아직 사용 전 정상 상태), **스키마 손상**이면 FAIL. 설치 파일 없으면 FAIL.
- hooks.json에 Stop 또는 SubagentStop 중 하나라도 없으면 [FAIL].
- STATE.md가 없으면 [WARN], frontmatter 파싱 실패면 [FAIL].

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — HEALTH-01~06 전체 요건 정의 (6개 요건)
- `.planning/ROADMAP.md` §Phase 6 — Success Criteria 5개 (exit code 1 조건 포함)

### Existing Code (must read before touching)
- `hooks/transcript_matcher.py` — HEALTH-06 패치 대상 파일. HOOKIFY_SIGNALS 리스트에서 `'hookify'` 제거
- `hooks/hooks.json` — Stop/SubagentStop 훅 등록 여부 검증 기준
- `commands/sg-status.md` — sg-health 명령 파일의 구현 패턴 참조 (Bash 블록 기반)

### Schema Reference
- `.planning/HANDOFF.md` §스키마 — 5컬럼 TSV 구조 정의 (검증 기준)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `commands/sg-status.md`: Bash 블록 기반 Claude 명령 패턴 — sg-health도 동일 구조로 작성
- `hooks/transcript_matcher.py`: HOOKIFY_SIGNALS 리스트 — D-06 패치 대상

### Established Patterns
- 명령 파일 구조: `---\nname:\ndescription:\n---` frontmatter + `<objective>`, `<process>`, `<success_criteria>` 섹션
- 읽기 전용 명령: sg-status처럼 Bash `cat`/`grep`으로 파일 읽고, 파일 쓰기 없음

### Integration Points
- `transcript_matcher.py`: HOOKIFY_SIGNALS 리스트 수정 시 `HOOKIFY_COMPLETE` 신호가 여전히 정상 감지되는지 확인 필요
- `hooks.json`: SubagentStop 훅이 현재 등록되지 않은 것을 HEALTH-02가 감지할 것 (hooks.json 실제 내용: Stop만 있음)

</code_context>

<specifics>
## Specific Ideas

- hooks.json 현재 상태: Stop만 등록, SubagentStop 없음 → sg-health 실행 시 [FAIL] 노출됨 (이것이 의도된 동작)
- 설치 경로는 현재 환경 기준으로 검증됨:
  - `~/.claude/get-shit-done/` ✓ 존재
  - `~/.claude/plugins/data/superpowers-claude-plugins-official` ✓ 존재
  - `~/.claude/plugins/data/hookify-claude-plugins-official` ✓ 존재

</specifics>

<deferred>
## Deferred Ideas

- sg-health `--json` 플래그 — 스크립팅 용도 (v1.2 Future Requirements에 있음)
- exit code 실제 리턴 — Claude 명령 파일에서는 기술적 불가, Python 스크립트 도입 시 가능 (v1.2 검토)

</deferred>

---

*Phase: 6-sg-health*
*Context gathered: 2026-05-16*
