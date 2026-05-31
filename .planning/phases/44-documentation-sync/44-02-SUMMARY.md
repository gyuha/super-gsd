# Phase 44 — Plan 02 SUMMARY

## Goal

`skills/sg-retro/SKILL.md`와 `.agents/skills/sg-retro/SKILL.md` 양쪽의 frontmatter `description` 필드(line 3)에 D-12 human override에 따라 `--pick` 토큰을 명시적으로 추가했다. Phase 42에서 추가된 `three lenses (ssc, dspm, analyze)` + `Smart default (dspm+ssc)` 토큰과 Phase 43에서 추가된 `argument-hint` graceful-exit 안내는 byte-identical 보존했다.

본 plan은 D-12·D-13 원본 결정("권장 옵셔널" / "변경 권장 없음")을 사용자 명시 결정으로 override하여 read-only verification이 아닌 real edit로 수행한 사례이며, D-16 pairwise convention을 충족한다.

## Decisions Applied

- **D-12 human override** — 원본 D-12는 `skills/sg-retro/SKILL.md` description의 `--pick` 토큰 추가를 "권장 (옵셔널)"로 표기했으나, 사용자 명시 결정으로 **real edit**로 격상. 기존 마지막 문장 `Smart default (dspm+ssc) runs when no lens argument is provided.`의 마침표를 세미콜론(`;`)으로 교체하고 ` pass --pick for interactive lens selection.` 한 절을 추가했다.
- **D-13 override + D-16 pairwise convention** — 원본 D-13은 `.agents/skills/sg-retro/SKILL.md` description은 "변경 권장 없음"(argument-hint에 이미 `--pick` graceful-exit 안내가 있으므로)이었으나, 사용자 명시 결정 + D-16 pairwise convention 준수를 위해 description에도 한 문장(`` `--pick` flag is rejected with a graceful exit explaining positional alternative (no AskUserQuestion in this environment).``)을 두 기존 문장 사이에 삽입했다. 환경 한정 안내(`AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.`)는 끝부분에 byte-identical 보존.
- **톤 분기 의도성** — `skills/`는 positive(`pass --pick for interactive lens selection`), `.agents/`는 explicit-rejection + alternative(`--pick` flag is rejected with a graceful exit explaining positional alternative). 환경 차이를 description에 직접 표면화하여 silent override 거부 정책(Phase 42 D-06 / Phase 43 D-03 일관성) 노출.

## Changes Made

**`skills/sg-retro/SKILL.md` line 3** (1 line changed, +1/-1):

Before:
```
description: Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of three lenses (ssc, dspm, analyze) and appends results to .planning/lessons/. Smart default (dspm+ssc) runs when no lens argument is provided.
```

After:
```
description: Use this when a phase is complete and a structured retrospective is needed — collects phase artifacts and git context, then facilitates one or more of three lenses (ssc, dspm, analyze) and appends results to .planning/lessons/. Smart default (dspm+ssc) runs when no lens argument is provided; pass --pick for interactive lens selection.
```

Minimal diff: 마지막 `.` → `;`, ` pass --pick for interactive lens selection.` 추가 (44 글자).

**`.agents/skills/sg-retro/SKILL.md` line 3** (1 line changed, +1/-1):

Before:
```
description: Run a structured retrospective on a GSD phase with one of three lenses (ssc, dspm, analyze) — select multiple lenses in one call or omit lens argument for smart default (dspm+ssc) — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md. AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.
```

After:
```
description: Run a structured retrospective on a GSD phase with one of three lenses (ssc, dspm, analyze) — select multiple lenses in one call or omit lens argument for smart default (dspm+ssc) — and append results to .planning/lessons/{NN}-{YYYY-MM-DD}.md. `--pick` flag is rejected with a graceful exit explaining positional alternative (no AskUserQuestion in this environment). AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI.
```

Minimal diff: 두 기존 문장 사이 한 문장 삽입 (총 119 글자 추가, trailing space 1자 포함).

**Affected prose tokens (Phase 43 retro P1 #1 카테고리 1 — 변경된 산문 토큰):**

| 파일 | 위치 | 변경 토큰 |
|------|------|-----------|
| `skills/sg-retro/SKILL.md` | line 3 끝 | `is provided.` → `is provided; pass --pick for interactive lens selection.` |
| `.agents/skills/sg-retro/SKILL.md` | line 3 중간 | `{NN}-{YYYY-MM-DD}.md. AskUserQuestion-free` → `` {NN}-{YYYY-MM-DD}.md. `--pick` flag is rejected with a graceful exit explaining positional alternative (no AskUserQuestion in this environment). AskUserQuestion-free `` |

**Preserved structural blocks (Phase 43 retro P1 #1 카테고리 2 — 변경되는 구조를 묘사하는 보존 블록):**

| 파일 | line | 보존 블록 |
|------|------|-----------|
| `skills/sg-retro/SKILL.md` | 1 | `---` 구분자 |
| `skills/sg-retro/SKILL.md` | 2 | `name: sg-retro` |
| `skills/sg-retro/SKILL.md` | 4 | `---` 구분자 |
| `skills/sg-retro/SKILL.md` | 5~끝 | `<language>` 블록 + 전체 본문 (byte-identical) |
| `.agents/skills/sg-retro/SKILL.md` | 1 | `---` 구분자 |
| `.agents/skills/sg-retro/SKILL.md` | 2 | `name: sg-retro` |
| `.agents/skills/sg-retro/SKILL.md` | 4 | `argument-hint: "..."` (Phase 43 carry-forward — `--pick is not supported in this environment ... use positional args instead.`) |
| `.agents/skills/sg-retro/SKILL.md` | 5 | `---` 구분자 |
| `.agents/skills/sg-retro/SKILL.md` | 6~끝 | `<language>` 블록 + 전체 본문 (byte-identical) |

## Verification

모든 acceptance 명령 PASS 또는 의도된 deviation:

**Task 1 — `skills/sg-retro/SKILL.md`:**
- A) full description substring match: PASS
- B) `pass --pick for interactive lens selection` 신규 토큰: PASS
- C) Phase 42 carry-forward 토큰 (`three lenses (ssc, dspm, analyze)`, `Smart default (dspm+ssc) runs when no lens argument is provided`, `collects phase artifacts and git context`): PASS
- E) Frontmatter 구조 (`---` line 1, `name: sg-retro` line 2, `---` line 4): PASS
- F) line 3 description prefix: PASS
- H) 본문 핵심 토큰 (`LENS_CODES_ARRAY="dspm ssc"`, `PICK_MODE=false`, `🔴 P1`): PASS
- I) Diff size: 2 lines (+1/-1) ≤ 4: PASS

**Task 2 — `.agents/skills/sg-retro/SKILL.md`:**
- A) full description substring match: PASS
- B) 신규 토큰 (`` `--pick` flag is rejected with a graceful exit explaining positional alternative ``, `no AskUserQuestion in this environment`): PASS
- C) Phase 14·42 carry-forward 토큰 (`Run a structured retrospective on a GSD phase`, `smart default (dspm+ssc)` 소문자 s, `.planning/lessons/{NN}-{YYYY-MM-DD}.md`, `AskUserQuestion-free version for Codex/Gemini CLI/Antigravity CLI`): PASS
- D) argument-hint Phase 43 carry-forward (`--pick is not supported in this environment (AskUserQuestion required) — use positional args instead`): PASS
- E) Frontmatter 구조 (`---` line 1, `name: sg-retro` line 2, `argument-hint:` line 4, `---` line 5): PASS
- F1/F2) line 3 description prefix, line 4 argument-hint prefix: PASS
- H) Diff size: 2 lines (+1/-1) ≤ 4: PASS

**Task 3 — SC#3 + pairwise + out-of-scope:**
- 양쪽 description에 3 lens 토큰 (Phase 42 carry-forward): PASS
- 양쪽 description에 smart default (case 분기 — `skills/` 대문자 S, `.agents/` 소문자 s) 보존: PASS
- 양쪽 description에 `--pick` 토큰 (D-12 + D-16 신규): PASS
- `.agents/` argument-hint Phase 43 carry-forward 보존: PASS
- 본문 byte-identical (Phase 42·43 핵심 토큰 `LENS_CODES_ARRAY="dspm ssc"`, `PICK_MODE=false` 등): PASS
- Pairwise mirror 충족 (D-16): PASS
- 본 plan 변경은 `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md`로만 한정: PASS (`git diff --stat HEAD -- skills/sg-retro/SKILL.md .agents/skills/sg-retro/SKILL.md`)

## Plan-spec Deviations (Surfaced)

Phase 42/43 SUMMARY 패턴 답습하여 정직하게 surface.

**Deviation 1 — `awk 'NR==5'` / `awk 'NR==6'` `<language>` 위치 acceptance가 실제 파일 구조와 1줄 어긋남:**

- Plan acceptance(Task 1): `awk 'NR==5' skills/sg-retro/SKILL.md` returns `<language>` (본문 시작 위치 보존).
- 실제 파일: line 5는 **blank line**, line 6이 `<language>`.
- Plan acceptance(Task 2): `awk 'NR==6' .agents/skills/sg-retro/SKILL.md` returns `<language>`.
- 실제 파일: line 6은 **blank line**, line 7이 `<language>`.
- **원인:** Plan `<interfaces>`의 line 번호 추정은 frontmatter 끝과 `<language>` 사이 빈 줄을 누락. 양쪽 파일 모두 `---` 닫는 줄(skills/ line 4, .agents/ line 5) 직후에 의도적 빈 줄(파일 1행)을 두는 기존 패턴 — Phase 42·43 진입 시점부터 동일하게 존재. 본 plan은 line 3만 변경했으므로 line 5/6의 빈 줄과 `<language>` 위치는 **byte-identical 보존**됨. acceptance criterion의 line 번호가 잘못 잡힌 plan-time 추정 오류이지 실제 파일 손상 아님.
- **Severity:** Low. 실제 frontmatter 구조 보존은 Task 3에서 `---` 위치(line 1+4 / line 1+5) 검증으로 충족. `<language>` 블록 존재 자체는 본문 grep(`PICK_MODE=false`, `LENS_CODES_ARRAY` 등)으로 간접 검증됨.
- **Mitigation:** 향후 plan 작성 시 `<interfaces>` line 번호 추정은 실제 `awk` head 출력으로 검증 후 기재 권장.

**Deviation 2 — `.agents/` description의 backtick(`` `--pick` ``) YAML 호환성 trace (CONTEXT.md에서 명시한 risk):**

- 본 plan은 `.agents/skills/sg-retro/SKILL.md` description에 `` `--pick` `` (백틱 1쌍 감싼) 토큰을 도입. YAML unquoted scalar 내 백틱 사용은 첫 사례.
- **YAML 1.2 spec 검증:** Backtick(`` ` ``, U+0060)은 YAML indicator character가 아니므로 unquoted scalar에서 안전. 정규식 기반 frontmatter 추출(`/^---\n([\s\S]+?)\n---/`)로 description 길이·구조 파싱 성공 확인. js-yaml 같은 본격 parser 테스트는 로컬 미설치로 미수행. [Medium] Claude Code SKILL 로더는 통상 frontmatter parser로 js-yaml/yaml.js 계열 사용하며 백틱 안전 처리.
- **Severity:** Low. 위험 발견 시 대체안은 `the --pick flag is rejected ...`(plain text — 백틱 제거)로 surgical 교체 가능. 본 plan은 D-16 pairwise convention 유지를 위해 백틱 유지 선택. 사후 SKILL 발동 테스트(`Skill(skill="sg-retro", args="...")`)로 frontmatter 파싱 정상 확인 권장.

**Deviation 3 — Description tone divergence (skills/ positive vs .agents/ rejection) 의도적:**

- 두 파일 description의 톤이 다르다(`skills/`: "pass --pick for interactive lens selection" / `.agents/`: "`--pick` flag is rejected with a graceful exit"). D-16 pairwise convention은 "양쪽 description에 `--pick` 토큰 명시"를 요구하나 동일 문장 강제 아님.
- **정당화:** `skills/`는 Claude Code의 AskUserQuestion 환경 — `--pick` real interactive picker 동작. `.agents/`는 Codex/Gemini CLI/Antigravity 환경 — `--pick`은 graceful exit 1. 환경 차이를 description에 직접 표면화하여 사용자가 SKILL 발동 시 즉시 의도 파악 가능. silent override 거부 정책(Phase 42 D-06 / Phase 43 D-03 일관성)과 직접 정합.
- **Severity:** None (intentional). reviewer 질문("왜 두 description 톤이 다른가?") 발생 시 본 SUMMARY로 답변 가능.

## D-10/D-16 Staging Note

본 plan(44-02)은 `skills/sg-retro/SKILL.md` + `.agents/skills/sg-retro/SKILL.md` 양쪽 변경을 단일 wave(`wave:1`)에 staging한다. Plan 44-01(README 쌍)과 Plan 44-03(TEAM.md)도 wave:1로 sg-parallel-execute가 3-way Task() dispatch한다.

Phase 42·43에서 lock-in된 pairwise convention(`skills/` + `.agents/skills/` 같은 wave staged) 답습. 본 plan은 phase-level commit(44-02 작업 종료 후 별도 commit 또는 phase 통합 commit)에 두 SKILL.md를 함께 staging — single commit per pairwise pattern.

## Next Steps

사용자가 `/super-gsd:sg-review` 진입 시 다음 정적 검증을 재실행 권장:

```bash
# Pairwise --pick 토큰 양쪽 description 존재
grep -F 'pass --pick for interactive lens selection' skills/sg-retro/SKILL.md
grep -F '`--pick` flag is rejected with a graceful exit' .agents/skills/sg-retro/SKILL.md

# Phase 42 carry-forward 보존 (three lenses + smart default)
grep -F 'three lenses (ssc, dspm, analyze)' skills/sg-retro/SKILL.md .agents/skills/sg-retro/SKILL.md
grep -F 'Smart default (dspm+ssc)' skills/sg-retro/SKILL.md
grep -F 'smart default (dspm+ssc)' .agents/skills/sg-retro/SKILL.md

# Phase 43 carry-forward argument-hint 보존
grep -F -e '--pick is not supported in this environment (AskUserQuestion required) — use positional args instead' .agents/skills/sg-retro/SKILL.md
```

향후 phase에서 discuss-phase 결정이 plan/execute 시점에 사용자 override로 바뀌는 경우 본 SUMMARY 형식(Decisions Applied 섹션에 D-XX trace 명시)을 답습 권장. 본 plan은 D-12/D-13 override 사례로, "권장 옵셔널 → real edit" 격상의 표준 trace template 후보가 될 수 있다.
