# Phase 12: lessons aggregation + 재발 방지 가드 - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

`sg-retro`가 축적한 lessons를 집계하고, `sg-plan`/`sg-execute`에서 weighted top-N 패턴을 우선 노출하여 같은 실수가 반복되지 않는 가드를 구현한다.

이 phase의 책임:
1. `hooks/lessons_ranker.py` — weighted top-N 산출 Python 헬퍼
2. `commands/sg-plan.md` Step 0 교체 — cat dump → weighted top-N 우선 + fold
3. `commands/sg-execute.md` — 진입 시 top-N 한 줄 요약 reminder 추가
4. `commands/sg-lessons.md` — milestone 필터 argument 파싱 추가
5. `commands/sg-complete.md` — milestone close 시 lessons archive 블록 추가

Phase 13(sg-learn 라우팅 전환)은 이 phase 스코프 밖이다.

</domain>

<decisions>
## Implementation Decisions

### A. Weighted Ranking 함수 구현 방식

- **D-01:** weighted ranking은 **Python 헬퍼 `hooks/lessons_ranker.py`**로 구현한다.
  bash 인라인으로는 빈도 집계 + 최근성 계산 + severity 가중치를 조합하기 어렵다.
  Phase 11 D-01(Python hooks 패턴)과 일관성 유지.

- **D-02:** score 공식 `score = 0.4 * freq + 0.4 * recency + 0.2 * severity`
  - `freq`: 해당 lessons 파일 내 동일 카테고리(Rule name 또는 섹션 헤더) 등장 횟수
  - `recency`: 파일 생성 날짜 기준 `1 / (1 + days_ago)` (오늘에 가까울수록 1에 수렴)
  - `severity`: high=1.0, medium=0.5, low=0.2, 없음=0.3 (default)
  - 기본 N=5, `--top N` argument로 조정 가능
  - stdout: JSON lines `{"pattern": "...", "score": 0.xx, "source": "file:section"}`

### B. sg-plan Step 0 UI

- **D-03:** top-N 우선 표시 + `---` 구분선 + 전체 lessons fold.
  HTML `<details>` 태그는 Claude 렌더링이 불확실하므로 사용 금지.
  구현:
  ```
  === Weighted Top-N Patterns ===
  1. [score 0.92] pattern text (source)
  ...
  === All Lessons (below) ===
  (전체 cat *.md 결과)
  === End of Lessons ===
  ```
  lessons 파일이 없으면 Step 0을 조용히 건너뛴다 (기존 동작 유지).

### C. milestone archive 트리거

- **D-04:** `commands/sg-complete.md`에 **Step 0.5** 블록을 추가한다.
  gsd-complete-milestone Skill 호출 직전에 `lessons_ranker.py --archive` 모드로
  `.planning/lessons/*.md`를 `.planning/milestones/v{X}-LESSONS.md`로 묶는다.
  archive 후 `.planning/lessons/`를 비우지 않는다 (원본 유지, 복사 방식).

- **D-05:** milestone 버전 번호는 STATE.md `milestone: v1.2` 필드에서 읽는다.
  읽기 실패 시 archive 단계를 warn-only로 skip한다 (sg-complete 차단 금지).

### D. sg-lessons milestone 필터

- **D-06:** `commands/sg-lessons.md`에 `--milestone=vX.Y` argument 파싱 추가.
  milestone 필터가 있으면 `.planning/milestones/vX.Y-LESSONS.md`를 읽고,
  없으면 기존 `.planning/lessons/*.md` + phase 필터 동작 유지.
  ROADMAP.md phase↔milestone 매핑은 불필요 — milestone 아카이브 파일 경로를 직접 사용.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 기존 명령 구현
- `commands/sg-plan.md` — Step 0 교체 대상, 현재 `cat .planning/lessons/*.md` 방식
- `commands/sg-execute.md` — reminder 추가 대상
- `commands/sg-lessons.md` — milestone 필터 추가 대상
- `commands/sg-complete.md` — lessons archive 블록 추가 대상

### 기존 Python hooks 패턴
- `hooks/stop_hook.py` — load_config() + sys.path 패턴 참조
- `hooks/rule_runner.py` — Phase 11 Python hooks 구현 패턴

### Phase 요건
- `.planning/REQUIREMENTS.md` §LESSONS-01~03, §RECURRENCE-01~03

### lessons 파일 구조
- `.planning/lessons/{NN}-{YYYY-MM-DD}.md` — `## Lens: {name}` 섹션 구조 (Phase 9/10 lock)
- severity 표기: hookify rule draft의 `severity:` 필드 또는 lens 본문 내 `(High)/(Medium)/(Low)` 표기

</canonical_refs>

<code_context>
## Existing Code Insights

### sg-plan.md Step 0 현재 구현
```bash
if ls .planning/lessons/*.md 2>/dev/null | grep -q .; then
  echo "=== Prior Lessons (auto-injected) ==="
  cat .planning/lessons/*.md
  echo "=== End of Prior Lessons ==="
fi
```
이 블록을 `lessons_ranker.py` 호출 + weighted top-N 출력으로 교체한다.

### sg-lessons.md 현재 구현
현재 phase 번호 필터만 지원 (`/super-gsd:sg-lessons 11`). milestone 필터 없음.

### sg-complete.md 현재 구현
Step 1.5에서 HANDOFF.md `complete` row 기록 후 `gsd-complete-milestone` Skill 호출.
Step 0.5 추가 위치: Step 1.5 이전 (HANDOFF 기록 이전).

</code_context>

<deferred>
## Deferred Items

- **lessons_ranker.py `--rebuild` 모드** (전체 re-score) — 이번 phase 범위 밖, 증분 방식으로 시작
- **global lessons (~/.claude/lessons/)** — 프로젝트 간 공유 — v1.3 이후 검토
- **sg-retro lessons append 검증** (LESSONS-01) — Phase 9/10에서 이미 구현, 이번 phase에서 재구현 불필요
- **severity 자동 추출** (lessons 본문 NLP) — 수동 표기 규칙으로 시작

</deferred>

---

*Phase: 12-lessons-aggregation*
*Context gathered: 2026-05-20*
