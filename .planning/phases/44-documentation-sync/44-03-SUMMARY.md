# Phase 44 — Plan 03 SUMMARY

## Goal

`.planning/TEAM.md`에 새 섹션 `## Retrospective workflow`를 추가하여 팀원이 Phase 42·43의 새 sg-learn/sg-retro 동작(smart default `dspm`+`ssc`, `--pick` graceful exit, `🔴 P1` DISPLAY-01)을 워크플로우 가이드로 학습할 수 있도록 한다 (DOC-01 / SC#2 충족).

## Decisions Applied

- **D-08 (영문 유지)** — 신규 섹션을 영문 헤더(`## Retrospective workflow`) + 영문 산문으로 작성. TEAM.md의 기존 영문 dominant 패턴 유지. CLAUDE.md "GSD 문서 작성 지침"의 한글 작성 규칙은 `.planning/` 내 일반 산문에 적용되지만, TEAM.md는 이미 영문 dominant 표면이므로 drift 방지를 우선. TEAM.md 전체 한글화는 deferred (CONTEXT "Deferred Ideas").
- **D-09 (위치)** — 신규 섹션을 `## File ownership`(line 60) 끝의 `---` 구분자(line 85) 직후, `## Merge order`(원본 line 87) 직전에 삽입. 검증: `awk` 위치 체크 → File ownership=60, Retrospective workflow=87, Merge order=114. (워크플로우 conventions → workflow steps → shipping 흐름 유지.)
- **D-10 (4 sub-block)** — SC#2 본문이 3가지 정보(언제 실행 / 결과 저장 / `--pick` 시점)만 명시했으나 CONTEXT D-10이 권장한 4번째 sub-block(`What sg-learn does`)도 함께 적용. 4 sub-block: When to run sg-learn / What sg-learn does / When to use `--pick` / Where results live.
- **D-11 (~30줄 상한)** — 신규 섹션은 28줄 (`## Retrospective workflow` 헤더부터 다음 `## Merge order` 직전 라인까지 awk 측정). 30줄 상한 내, File ownership 섹션과 시각적 균형 확보.

## Changes Made

`.planning/TEAM.md` 단일 파일, 27 insertions (`git diff --stat`: `27 +++++++++++++++++++++++++++`).

신규 섹션 (line 87-113):

1. **헤더**: `## Retrospective workflow` + 1줄 영문 인트로 산문 ("After implementation review, capture lessons before shipping...").
2. **Sub-block 1 — When to run sg-learn**: `/super-gsd:sg-learn`을 `sg-review` 직후·`sg-ship` 진입 전 실행하라는 시점 가이드. "Skipping this step is the most common cause of lessons drift between phases." 경고 포함.
3. **Sub-block 2 — What sg-learn does**: `sg-learn` → `sg-retro` thin pass-through, smart default `dspm` + `ssc` 자동 실행, "no prompt, no AskUserQuestion", 결과 append to `.planning/lessons/{NN}-{YYYY-MM-DD}.md` 명시. (Phase 42 D-01 smart default 사실 광고.)
4. **Sub-block 3 — When to use `--pick`**: 비-default 조합 (예: `analyze` 단독, `ssc` 단독, 3 lens 전체) 필요 시 사용, "single AskUserQuestion multiSelect with the three available lenses (`ssc`, `dspm`, `analyze`)", positional lens + `--pick` 결합은 "rejected with a graceful error — pick one form" 명시. (Phase 43 D-01~D-04 `--pick` 동작 광고.)
5. **Sub-block 4 — Where results live**: mini-table (3-column: Artifact / Path / Mode) — Lessons file + Handoff row, 둘 다 append-only. (File ownership 섹션 mini-table 패턴 답습.) 산문 추가: "Action Items rated P1 are emphasized with a `🔴 P1` prefix in the priority cell so the next phase's `sg-plan` surfaces them first." (Phase 43 D-08 DISPLAY-01 광고.)
6. **섹션 끝 `---` 구분자**.

## Verification

Task 1 검증 결과 (전부 PASS):

- 신규 섹션 헤더 `## Retrospective workflow` 1회 존재.
- 4 sub-block 헤더 모두 존재 (`**When to run sg-learn:**`, `**What sg-learn does:**`, `**When to use \`--pick\`:**`, `**Where results live:**`).
- 핵심 정보 토큰 모두 존재: `immediately after \`sg-review\` completes and before \`sg-ship\``, `smart default of two lenses (\`dspm\` + \`ssc\`)`, `no prompt, no AskUserQuestion`, `single AskUserQuestion multiSelect`, `Combining \`--pick\` with a positional lens argument is rejected`, `\`.planning/lessons/{NN}-{YYYY-MM-DD}.md\``, `\`🔴 P1\` prefix in the priority cell`.
- 머신 토큰(`` `dspm` ``, `` `ssc` ``, `` `analyze` ``, `` `--pick` ``) 모두 백틱 감싼 영문 그대로.
- **위치**: `awk` 검증 → File ownership=line 60, Retrospective workflow=line 87, Merge order=line 114. 순서 OK.
- **섹션 길이**: `awk '/^## Retrospective workflow/,/^## Merge order/' | wc -l` = 28 (≤ 32 cap).
- **H2 개수**: `grep -c '^## '` = 6 (5 기존 + 1 신규).
- **`---` 구분자 개수**: `grep -c '^---$'` = 5 (기존 4 + 신규 섹션 끝 1).
- **기존 섹션 보존**: `# Team Workflow Guide`, `## Quick Start`, `## Branch strategy`, `## File ownership`, `## Merge order` 헤더 + 핵심 본문 토큰(`git config user.name`, `phase/{PHASE_PAD}-{slug}`, HANDOFF.md schema, `gh pr create --base main --title`, append-only 경고) 모두 grep 매치.
- **한국어 sample table 보존**: `## 팀 현황` + `| 팀원 | 최근 Phase | 최근 Stage | 마지막 활동 |` grep 매치 (Quick Start 섹션 line 27-33).
- **AskUserQuestion 토큰 총 출현**: 3회 (기존 2회 Branch strategy 섹션 + 신규 1회 retrospective 섹션). `≥ 3` range 충족.
- **TEAM.md만 본 plan에서 변경**: `git diff --stat HEAD -- .planning/TEAM.md` = `1 file changed, 27 insertions(+)`.

## Plan-spec Deviations (Surfaced)

본 plan 본문은 spec과 byte-identical로 적용됐다 (Phase 42·43 retro 패턴 답습). 단, plan의 Task 2 acceptance 중 다음 항목은 작성된 그대로의 의미로는 충족되지 않으나 **본 plan의 통제 범위 밖** 사유:

- **`test "$(git diff --stat HEAD -- README.md 2>/dev/null | wc -l)" = "0"`** (Task 2 verify line) — 실제 `wc -l` 결과 `2` (출력 라인이 stat 헤더 + 파일 라인). 사유: Plans 44-01/44-02가 동일 working tree에서 parallel wave:1로 함께 실행되어 README.md, README.ko.md, skills/sg-retro/SKILL.md, .agents/skills/sg-retro/SKILL.md를 이미 변경했다. 본 plan(44-03)은 그 4개 파일에 **터치하지 않았다**. plan acceptance의 `wc -l = 0` 가정은 단일-plan 실행을 전제했지만 sg-parallel-execute 3-way dispatch에서는 불가피하게 깨진다. **본 plan의 변경 = `.planning/TEAM.md` 단 한 파일**임은 `git diff --stat HEAD -- .planning/TEAM.md` = `27 insertions(+)`로 직접 검증됨. 다른 4개 파일은 다른 plan의 워크셋이며 본 plan에서 미터치.
- 권장 후속 개선: 향후 parallel wave plan template의 "out-of-scope 파일 변경 없음" acceptance를 `git diff --stat HEAD` 절대값 대신 `git log --name-only` 또는 plan-scope manifest 비교로 작성하여 parallel-execution 가정 충돌을 plan-time에 명시.

기타 산문 토큰·구조·길이 spec은 deviation 없이 적용됨.

## D-10/D-16 Staging Note

- 본 plan은 `.planning/TEAM.md` 단독 변경, 단일 commit 단위 (Plan 44-01/44-02와 non-overlapping `files_modified`).
- Phase 44는 wave:1에 3 plans (44-01 README 쌍 + 44-02 SKILL.md 쌍 + 44-03 TEAM.md) — sg-parallel-execute 3-way Task() dispatch.
- D-10 pairwise sync(`skills/` ↔ `.agents/skills/`)는 본 plan에 직접 적용되지 않음 (TEAM.md는 pair 없음). 44-02 plan이 SKILL.md pair sync를 담당.

## Out-of-Scope Trace

- **TEAM.md 전체 한글화** — CONTEXT.md "Deferred Ideas"에 명시. D-08 영문 dominant 패턴 유지 결정. milestone 단위 결정 후보로 backlog.
- **별도 `docs/RETROSPECTIVE.md` 신설** — scope creep. 본 plan은 TEAM.md inline section만 신설. 30줄 상한을 넘기는 경우의 fallback이나 본 plan은 28줄로 cap 내 → 별도 doc 불요.
- **TEAM.md 기존 섹션 본문 개선** — byte-identical 보존. `## 팀 현황` 섹션 한글 라인 등 TEAM.md의 기존 inconsistency(영문 dominant + 한국어 sample table)는 본 plan과 무관 — 손대지 않음 (surgical 원칙, CLAUDE.md §"Surgical Changes").
- **README.md / README.ko.md 갱신** — 44-01-PLAN 담당.
- **`skills/sg-retro/SKILL.md` / `.agents/skills/sg-retro/SKILL.md` 갱신·검증** — 44-02-PLAN 담당.

## Next Steps

- **Phase-level commit** (사용자 또는 sg-review 단계) — wave:1 3 plans 종료 후 BASE_SHA==HEAD_SHA 방지 위해 phase-level commit 필요 (Phase 42·43 retro P1 #2 미해결 — 본 phase가 다시 노출할 가능성 100%).
- **사용자가 sg-review 시 재실행 가능한 정적 검증 명령**:

```bash
# A) 신규 섹션 존재 + 위치
grep -F '## Retrospective workflow' .planning/TEAM.md
awk '/^## File ownership/{fo=NR} /^## Retrospective workflow/{rw=NR} /^## Merge order/{mo=NR} END {exit !(fo < rw && rw < mo)}' .planning/TEAM.md

# B) 4 sub-block + 핵심 토큰
grep -F '**When to run sg-learn:**' .planning/TEAM.md
grep -F '**What sg-learn does:**' .planning/TEAM.md
grep -F '**When to use `--pick`:**' .planning/TEAM.md
grep -F '**Where results live:**' .planning/TEAM.md
grep -F 'smart default of two lenses (`dspm` + `ssc`)' .planning/TEAM.md
grep -F '`🔴 P1` prefix in the priority cell' .planning/TEAM.md

# C) 길이 상한 (D-11 ≤ 30줄 ± 여유)
test "$(awk '/^## Retrospective workflow/,/^## Merge order/' .planning/TEAM.md | wc -l)" -le "32"

# D) H2 개수 = 6
test "$(grep -c '^## ' .planning/TEAM.md)" = "6"

# E) 기존 한국어 sample 보존
grep -F '## 팀 현황' .planning/TEAM.md
```

## Task Results

- **Task 1** (TEAM.md에 ## Retrospective workflow 섹션 삽입): **PASS** (27 insertions, 28-line section, position OK).
- **Task 2** (SC#2 verification + plan-spec deviation 사전 점검): **PASS** (TEAM.md 본문 acceptance 전부 충족; 1건 plan-spec deviation surfaced 위 참조 — parallel-execution 가정 충돌, 본 plan 통제 범위 밖).

## Affected Prose Tokens (Phase 43 retro P1 #1 카테고리 enumerate)

**A. 본 plan이 신규 추가한 산문 토큰 (TEAM.md에 부재했던 토큰들):**

- `## Retrospective workflow` (신규 H2 — TEAM.md에 unique)
- `sg-learn`, `sg-retro`, `sg-review`, `sg-ship`, `sg-plan` (모두 TEAM.md 기존에 부재)
- `smart default`, `dspm`, `ssc`, `analyze`, `--pick` (모두 TEAM.md 기존에 부재)
- `🔴 P1` (Phase 43 DISPLAY-01 토큰 — TEAM.md 기존에 부재)
- `.planning/lessons/` (TEAM.md 기존에 부재)
- `multiSelect` (TEAM.md 기존에 부재)
- `lessons drift`, `non-default lens combination`, `graceful error`, `Action Items` (보조 산문 토큰)

**B. 기존 출현 토큰 — 신규 섹션에서 추가 출현 (TEAM.md 다른 영역에 이미 존재):**

- `AskUserQuestion` — 기존 2회 (Branch strategy 섹션 line 39, 51) + 신규 1회 = 총 3회.
- `HANDOFF.md` / `.planning/HANDOFF.md` — 기존 출현 (Quick Start, File ownership 섹션) + 신규 mini-table 1회 추가.

**C. 변경되는 구조를 묘사하는 보존 블록 (Phase 43 retro P1 #1 카테고리 2):**

- `## File ownership` 섹션 끝의 `---` 구분자(line 85) — 신규 섹션 직전에 보존됨. 검증 OK.
- `## Merge order` 섹션 시작 — 신규 섹션 끝의 새 `---` 구분자(line 113) 직후에 위치. 검증 OK.
- File ownership 섹션의 mini-table 패턴(`| File | Owner | When modified |` 3-column) — 신규 `Where results live` mini-table이 같은 3-column 패턴 답습 (시각 일관성).
- `## 팀 현황` Quick Start 한국어 sample table — byte-identical 보존 (`grep` 검증).
- TEAM.md 전체 헤더 구조 — `# Team Workflow Guide` (line 1) + 6개 `##` 섹션 헤더 (이전 5개 + 신규 1개).

---

*Phase: 44-documentation-sync*
*Plan: 03*
*Completed: 2026-05-31*
