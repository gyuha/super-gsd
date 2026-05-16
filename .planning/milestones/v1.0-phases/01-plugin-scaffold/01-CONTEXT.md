# Phase 1: Plugin Scaffold - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

설치 가능한 Claude Code 플러그인 셸을 만든다. 이 repo 자체가 단일 플러그인이며 `.claude-plugin/` 매니페스트와 함께 self-hosted marketplace를 호스팅한다. 명령(`commands/`)·훅(`hooks/`)은 Phase 2~4에서 추가하며, Phase 1은 매니페스트와 문서, 검증 체크리스트만 산출한다.

**In scope (PLUGIN-01/02/03):**
- `.claude-plugin/plugin.json` 매니페스트
- `.claude-plugin/marketplace.json` (self-hosted marketplace, 동일 repo source)
- `README.md` (영문 주, 한국어 요약, ASCII 다이어그램, install + verify 체크리스트, Roadmap)
- `LICENSE`, `.gitignore`, `CHANGELOG.md`

**Out of scope (Phase 1):**
- `/super-gsd:*` 명령 (Phase 2)
- `Stop` / `SubagentStop` 훅 (Phase 3)
- `.planning/lessons/` 자동화 (Phase 4)
- v2 항목 전체 (ORCH, RT)

</domain>

<decisions>
## Implementation Decisions

### Repo 구조 & 매니페스트
- **D-01:** 이 repo는 **single plugin** 형태. `.claude-plugin/plugin.json`이 root의 `.claude-plugin/` 디렉토리에 위치하며, commands/hooks/skills 디렉토리는 **Phase 1에서 생성하지 않는다** — 해당 Phase가 도착할 때 생성한다.
- **D-02:** plugin.json 식별자: `name: "super-gsd"`, `version: "0.0.1"`. 이후 Phase마다 patch bump(0.0.2, 0.0.3, …), v1 완성 시 0.1.0으로 승격.
- **D-03:** plugin.json 메타데이터 필드 표준 세트: `description`, `author`, `repository`, `license`, `keywords`.
  - `description`: PROJECT.md "What This Is" 영문 요약
  - `author`: GitHub username만 (`gyuha`) — 이메일 비공개
  - `license`: `MIT`
  - `keywords`: `["gsd", "superpowers", "hookify", "orchestration", "claude-code", "plugin"]`
  - `repository`: 실행 단계에서 `git remote get-url origin` 기반으로 채움

### Marketplace 메커니즘
- **D-04:** 이 repo에 `.claude-plugin/marketplace.json`을 **함께 포함**한다(self-hosted marketplace). 외부 aggregator 의존 없이 단독 설치 경로 확보.
- **D-05:** marketplace.json: `name: "super-gsd"` (마켓플레이스 이름과 플러그인 이름 동일), 플러그인 항목의 `source: "."` (동일 repo 상대 경로).
- **D-06:** marketplace.json `owner` 필드: GitHub username만 (`gyuha`) — 이메일 제외, plugin.json author와 일관.
- **D-07:** README 설치 명령 시퀀스는 **정확히 2단계로** 명시:
  ```
  /plugin marketplace add gyuha/super-gsd
  /plugin install super-gsd@super-gsd
  ```

### Phase 1 stub 표면
- **D-08:** Phase 1의 "discoverable surface"는 `/plugin list` 출력과 README 가시성으로 충족. **stub 명령 0개** — `commands/` 디렉토리 자체가 Phase 1엔 없음.
- **D-09:** 미래 명령/훅은 README의 **Roadmap 섹션**에 Phase별로 나열한다(Phase 2: `/super-gsd:to-superpowers`, `/super-gsd:status` / Phase 3: Stop·SubagentStop hook 자동 등록 / Phase 4: `.planning/lessons/` 자동 적재).

### README 내용 & 언어
- **D-10:** 주 언어는 **영문**. README 하단에 "한국어 요약" 섹션 1개. PROJECT.md/REQUIREMENTS.md의 한국어 톤은 그대로 유지하되 README 본문은 영문.
- **D-11:** 워크플로우 다이어그램은 **ASCII art**로. (Mermaid가 더 풍부하지만 사용자 선택: 가장 포터블, 어디서나 동일 표시.)
- **D-12:** README 9개 섹션 표준 구성: Title → ASCII diagram → What this is → Prerequisites → Installation → Verify install → Roadmap → 한국어 요약 → License.
- **D-13:** "Verify install" 체크리스트 4개 항목 — success criterion 4 ("로딩해도 GSD/Superpowers/Hookify가 깨지지 않음")의 구체적 검증:
  1. `/plugin list`에 `super-gsd` 표시
  2. `/gsd-progress` 등 GSD 명령 정상 동작
  3. `Skill` 트리에서 `superpowers:*` 접근 가능
  4. `/hookify:help` 정상 동작

### Carrying Forward from PROJECT.md
- **D-14:** 비침투적 외부 orchestrator — GSD/Superpowers/Hookify를 fork하지 않는다. Phase 1 산출물엔 외부 도구 변경 일체 없음.
- **D-15:** 상태 추적 파일은 `.planning/HANDOFF.md`(Phase 2 영역). Phase 1은 이 파일을 생성하지 않는다.

### Claude's Discretion
- plugin.json의 정확한 JSON 키 순서 및 들여쓰기 스타일
- ASCII art 다이어그램의 시각적 디테일 (박스 모양, 화살표 스타일)
- README 영문의 톤(공식 OSS 톤 vs 친근한 톤) — 단 PROJECT.md의 핵심 메시지("학습 루프", "역할 분리")는 영문에서도 유지
- LICENSE 파일 내용(MIT 표준 본문)
- `.gitignore`의 항목 선택 — macOS `.DS_Store`, Claude 임시 파일, 일반 OS/IDE 노이즈만 가볍게

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level
- `.planning/PROJECT.md` — 프로젝트 정체성, Core Value, Constraints
- `.planning/REQUIREMENTS.md` §"Plugin Scaffold (PLUGIN)" — PLUGIN-01/02/03 정의
- `.planning/ROADMAP.md` §"Phase 1: Plugin Scaffold" — 4가지 success criteria
- `.planning/STATE.md` — 최초 진입점, decisions 히스토리

### Claude Code Plugin System (external)
- Claude Code plugin marketplace 메커니즘 — `.claude-plugin/plugin.json` 및 `.claude-plugin/marketplace.json` 스키마. Researcher가 공식 문서 확인 필요(Context7 또는 공식 docs).
- `/plugin marketplace add` 및 `/plugin install` 명령 동작 — Researcher가 현재 Claude Code 버전 기준 정확한 인자 형태 확인.

### Dependencies (external — Phase 1 산출물엔 영향 없지만 Verify에 사용)
- `claude-plugins-official/superpowers` — `Skill` 트리 접근 검증용
- `claude-plugins-official/hookify` — `/hookify:help` 검증용
- `get-shit-done-cc` (또는 등가 GSD 설치) — `/gsd-progress` 검증용

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 현재 repo에는 source code가 없음(그린필드). `README.md`(미정 stub)와 `CLAUDE.md`만 존재. 둘 다 Phase 1에서 새로 작성/덮어쓰기.

### Established Patterns
- `.planning/` 디렉토리 컨벤션은 이미 사용 중 — GSD 표준 따름. Phase 1 결과물은 `.planning/` 밖(root와 `.claude-plugin/`)에 위치하며 GSD 디렉토리를 건드리지 않는다.
- 프로젝트 문서(PROJECT.md, REQUIREMENTS.md)는 한국어로 작성됨 — README의 영문화는 의도적 분기(OSS marketplace 사용자 대상).

### Integration Points
- `.claude-plugin/plugin.json`: Claude Code 플러그인 로더가 읽음
- `.claude-plugin/marketplace.json`: `/plugin marketplace add` 명령이 이 파일을 통해 플러그인 목록을 fetch
- README: GitHub marketplace 리스팅과 사용자 onboarding의 단일 진입점

</code_context>

<specifics>
## Specific Ideas

- `plugin.json` `description` 영문 초안 예시: "Orchestrator plugin that auto-chains GSD → Superpowers → Hookify so planning, implementation, and retrospection stay connected." (planner가 다듬을 수 있음.)
- ASCII 다이어그램은 단순 3-박스 + 화살표 형태로 충분 ("GSD planning" → "Superpowers building" → "Hookify learning" → loop back).
- `keywords`에 `claude-code`, `plugin`을 포함하여 marketplace 검색 노출도 고려.
- 한국어 요약 섹션은 PROJECT.md "What This Is" + "Core Value" 두 단락을 압축해 재사용해도 무방.

</specifics>

<deferred>
## Deferred Ideas

- **명령 stub 사전 노출**: Phase 1에 `/super-gsd:about` 같은 stub 명령 노출 옵션은 검토 후 미채택. Phase 2에서 본 명령과 함께 첫 등장.
- **Mermaid 다이어그램 / 이미지 자산**: ASCII로 시작, Phase 4 이후 OSS 가시성 강화 시 재고 가능.
- **CONTRIBUTING.md / FAQ.md**: v1 완성 후, 외부 컨트리뷰터가 늘면 추가.
- **자동화된 inert 검증 스크립트**: 수동 체크리스트로 시작, v2에서 CI 검증으로 승격 가능.
- **GitHub Actions / CI**: Phase 1 범위 밖. v1 완성 후 별도 phase에서 검토.
- **이메일을 author/owner에 포함**: 의도적으로 제외(privacy). 향후 필요 시 재고.

### Reviewed Todos (not folded)
없음 — `cross_reference_todos`에서 매칭된 pending todo 없음(todo_count = 0).

</deferred>

---

*Phase: 1-Plugin Scaffold*
*Context gathered: 2026-05-15*
