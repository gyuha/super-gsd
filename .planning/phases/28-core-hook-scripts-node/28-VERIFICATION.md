---
phase: 28-core-hook-scripts-node
status: pass
verified_at: 2026-05-25
verifier: phase-execution + sg-review
---

# Phase 28 Verification

**Goal (per ROADMAP.md):** `hooks/*.py` 4개 파일이 외부 의존성 0인 순수 JS CommonJS(`.cjs`)로 재작성되어, 각 스크립트가 Python 버전과 동일한 stdin/stdout/exit code를 생성한다.

**Status:** pass — 모든 5개 Success Criteria 충족, sg-review verdict "With fixes" → Issue #1 commit `955a578`로 수정 완료.

## Requirement Coverage

| REQ-ID | Artifact | Parity proof |
|--------|----------|--------------|
| NODE-01 | `hooks/stop_hook.cjs` (225 lines) | 28-VERIFY.md §5 5개 fixture diff empty + B-4 temp-dir isolation (stdout + lessons file) byte-identical |
| NODE-02 | `hooks/transcript_matcher.cjs` (53 lines) | 28-VERIFY.md §4 6개 fixture parity loop `transcript_matcher parity OK`. B-1 (`long-with-trailing-newline.txt`) negative-test 재현 확인 |
| NODE-03 | `hooks/rule_runner.cjs` (419 lines) | 28-VERIFY.md §6 5개 fixture diff empty. W-3 bad-regex swallow Python `re.error` ≡ JS `SyntaxError` |
| NODE-04 | `hooks/lessons_ranker.cjs` (260 lines) | 28-VERIFY.md §7 `--top 5` + `--archive` 양쪽 diff empty. W-1 banker's rounding (commit `955a578` 이후 IEEE-754 half-boundary parity 확보) |

## Success Criteria Verification (per ROADMAP.md Phase 28)

1. **`hooks/{stop_hook,transcript_matcher,rule_runner,lessons_ranker}.cjs` 4개 파일 존재, Node 내장 모듈만 require** — pass.
   ```
   $ grep -E "require\('[^./]" hooks/*.cjs | grep -vE "require\('(fs|path|process|child_process|util|os)'\)"
   (no matches — 0건)
   ```

2. **`node hooks/stop_hook.cjs < test_input.json`이 Python 동일 systemMessage JSON + exit 0 반환 (transcript 신호 매칭 동등성 포함)** — pass.
   28-VERIFY.md §5 5개 fixture(`gsd-plan-complete`, `review-complete`, `empty-signal`, `auto-advance-off`, `hookify-complete`) 모두 empty diff. B-4 temp-dir isolation으로 hookify-complete side-effect 파일까지 byte-identical 확인.

3. **`node hooks/rule_runner.cjs < test_input.json`이 PreToolUse stdin JSON에 대해 동일한 warn/block decision과 hookify-skip 동작 재현** — pass.
   28-VERIFY.md §6 B-5 pre-flight gate(hookify cache absent) 후 5개 fixture diff 모두 empty. `bash-warn`, `file-block`, `no-match`, `non-target-tool`, `bad-regex` (W-3) 포함.

4. **`node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md` + `--archive --milestone vX.Y ...` 가 Python CLI와 동일한 JSON-lines 출력 및 가중치 점수(0.4×freq + 0.4×recency + 0.2×severity) 생성** — pass.
   28-VERIFY.md §7 두 모드 diff 모두 empty. `_jsonNumber`로 Python `json.dumps(1.0)` → `"1.0"` 매칭, `_roundHalfEven` (commit `955a578`)으로 IEEE-754 half-boundary 정합성 확보.

5. **`.planning/config.json`의 `super_gsd.auto_advance: false`로 `stop_hook.cjs`가 비활성화되는 동작이 보존** — pass.
   `auto-advance-off` fixture diff empty. `loadConfig()` (28-04-SUMMARY.md §2) + main()의 config guard 분기가 Python `stop_hook.py:113-116`과 1:1 mapping.

## Code Review

**Verdict:** With fixes (sg-review subagent, 2026-05-25)
- Critical: 0건
- Important: 4건
  - #1 `_roundHalfEven` IEEE-754 half-boundary divergence → **fixed in commit `955a578`** (`(0.55675,4)→0.5567`, `(0.55325,4)→0.5533`, `(0.00005,4)→0.0001` 모두 Python 일치)
  - #2 `--top` invalid value → deferred (현재 caller 없음, lessons file P1)
  - #3 `_globMd` directory-glob → deferred (현재 caller 없음, lessons file P2)
  - #4 `_globMd` dotfile semantics → deferred (현재 caller 없음, lessons file P2)
- Minor: 6건 (모두 code comment 보강 / dead branch 정리 / non-issue)

## Manual Checks

- [x] All 4 `.cjs` files committed (`hooks/*.cjs`)
- [x] All `.py` files unchanged (D-06, Phase 31 CLEAN-01 deferred)
- [x] 28-VERIFY.md parity recipes documented (8 sections including B-5 pre-flight gate)
- [x] 5개 X-SUMMARY.md (28-00..04) 작성, Python→JS function mapping + deviations 명시
- [x] sg-review 완료, Issue #1 fix 적용 + retest 통과
- [x] sg-learn retrospective 완료 (`.planning/lessons/28-2026-05-25.md`, 4 lenses, 13 P1/P2 action items)

## Out of Scope (Phase 28)

- `hooks/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json` 명령 교체 → **Phase 29 (CFG-01)**
- Skill/Agent 내부 `python3` 호출 교체 → **Phase 30 (SKILL-01)**
- `hooks/*.py` 4개 삭제, CLAUDE.md/README/CHANGELOG 갱신 → **Phase 31 (CLEAN-01 + DOC)**
