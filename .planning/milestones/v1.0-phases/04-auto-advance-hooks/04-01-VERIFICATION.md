---
phase: 04-auto-advance-hooks
verified: 2026-05-16T04:00:00Z
status: human_needed
score: 5/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "ROADMAP SC2 — SubagentStop 훅이 /hookify를 자동 호출하는지, 또는 sg-learn 안내 메시지로 대체하는 것이 허용 범위인지 사람이 판단"
    expected: "ROADMAP에는 'invokes Hookify /hookify automatically'로 명시되어 있으나 PLAN must_have는 systemMessage 안내로 대체를 기술적 제약으로 인정"
    why_human: "자동 호출(slash command 실행)과 안내 메시지 출력은 동작이 다르다. hooks 시스템이 skill을 직접 invoke할 수 없다는 기술적 제약의 타당성은 Claude Code 런타임 동작을 알아야 판단 가능"
---

# Phase 04: Auto-Advance Hooks Verification Report

**Phase Goal:** Stage transitions are detected automatically — the user no longer has to remember which command comes next.
**Verified:** 2026-05-16T04:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GSD plan-phase 완료 직후 Stop 훅이 /super-gsd:sg-execute 안내 메시지를 출력한다 | ✓ VERIFIED | stop_hook.py L45-47: signal=='gsd-plan-complete' → systemMessage "Run /super-gsd:sg-execute"; 실행 검증 PASS |
| 2 | Superpowers code-reviewer 완료 직후 SubagentStop 훅이 다음 단계를 안내하는 systemMessage를 출력한다 | ? UNCERTAIN | 구현됨 (sg-learn 안내). ROADMAP SC2는 "/hookify 자동 호출"을 명시하나 PLAN은 기술적 제약으로 메시지 안내 대체를 인정. 자동 호출 vs 메시지 안내의 수용 여부는 사람이 결정 필요 |
| 3 | .planning/config.json에 super_gsd.auto_advance: false를 설정하면 두 훅 모두 아무것도 출력하지 않는다 | ✓ VERIFIED | 임시 config.json(auto_advance:false) 환경에서 실행 시 {} 출력, exit 0 확인 |
| 4 | 관련 없는 명령 종료 시 훅이 발화하지 않는다 | ✓ VERIFIED | 무관 transcript(docker/npm/git 내용) 입력 시 {} 출력 확인 |
| 5 | hooks/hooks.json이 Stop + SubagentStop 두 이벤트를 등록한다 | ✓ VERIFIED | hooks.json L4-26: Stop, SubagentStop 각각 command 등록, timeout:10, JSON 파싱 성공 |
| 6 | detect_signal()이 GSD/Review/빈 케이스를 정확히 반환한다 | ✓ VERIFIED | 7가지 케이스 모두 통과 (빈 경로, 존재하지 않는 경로, GSD 신호 3종, Review 신호, 무관 내용, GSD+Review 동시 GSD 우선) |

**Score:** 5/6 truths verified (1 uncertain — human decision required)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/hooks.json` | Stop + SubagentStop 훅 이벤트 등록 | ✓ VERIFIED | Stop/SubagentStop 모두 등록, command: python3 "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py", timeout:10 |
| `hooks/stop_hook.py` | 훅 공통 진입점 — config guard + 신호 감지 + systemMessage 출력 | ✓ VERIFIED | 61줄, main() 구현 완전, import 가능 |
| `hooks/transcript_matcher.py` | detect_signal() 유틸리티 | ✓ VERIFIED | 44줄, detect_signal() 함수 export, import 가능 |
| `.planning/config.json` | super_gsd.auto_advance 설정 키 | ✓ VERIFIED | super_gsd.auto_advance:true 추가, 기존 37개 키 보존 |

**파일명 변경 (의도적 deviation):** PLAN은 `stop-hook.py`, `transcript-matcher.py`로 명시했으나 Python import 불가로 `stop_hook.py`, `transcript_matcher.py`로 변경. hooks.json command도 일치하게 수정됨. SUMMARY.md에 명시적으로 기록.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/hooks.json` | `hooks/stop_hook.py` | command: python3 "${CLAUDE_PLUGIN_ROOT}/hooks/stop_hook.py" | ✓ WIRED | hooks.json L9, L21: command 경로 일치 |
| `hooks/stop_hook.py` | `hooks/transcript_matcher.py` | from transcript_matcher import detect_signal | ✓ WIRED | stop_hook.py L18: import 확인, sys.path 주입(L14)으로 cwd 무관 동작 |
| `hooks/stop_hook.py` | `.planning/config.json` | load_config() reads super_gsd.auto_advance | ✓ WIRED | stop_hook.py L21-28: load_config() 구현, auto_advance:false 시 {} 반환 검증 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `hooks/stop_hook.py` | signal (str) | transcript_matcher.detect_signal(transcript_path) | transcript_path는 Claude Code가 stdin으로 주입 | ✓ FLOWING |
| `hooks/stop_hook.py` | auto_advance (bool) | .planning/config.json super_gsd.auto_advance | 파일에서 실제 읽음, 파싱 실패 시 True 기본값 | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 빈 transcript_path → {} 출력 | `echo '{"transcript_path": ""}' \| python3 hooks/stop_hook.py` | `{}` | ✓ PASS |
| auto_advance:false → {} 출력 | 임시 디렉토리 + config.json 환경에서 실행 | `{}`, exit 0 | ✓ PASS |
| 무관 transcript → {} 출력 | HOOK-04 subprocess 검증 | `{}`, exit 0 | ✓ PASS |
| GSD 신호 → sg-execute systemMessage | gsd-plan-phase 포함 transcript | systemMessage with "sg-execute" | ✓ PASS |
| Review 신호 → sg-learn systemMessage | code-reviewer 포함 transcript | systemMessage with "sg-learn" | ✓ PASS |
| detect_signal 7가지 케이스 | python3 인라인 테스트 | 전체 PASS | ✓ PASS |

---

### Probe Execution

해당 없음 — 이 Phase는 probe-*.sh를 선언하지 않음.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HOOK-01 | 04-01-PLAN.md | Stop 훅이 GSD plan-phase 완료를 감지해 sg-execute 안내 | ✓ SATISFIED | stop_hook.py L45-47, transcript_matcher.py GSD_PLAN_SIGNALS |
| HOOK-02 | 04-01-PLAN.md | SubagentStop 훅이 review 완료를 감지해 다음 단계 안내 | ? UNCERTAIN | sg-learn 안내 메시지 구현됨. ROADMAP은 /hookify 자동 호출 명시 — 인간 판단 필요 |
| HOOK-03 | 04-01-PLAN.md | auto_advance:false 시 두 훅 모두 비활성화 | ✓ SATISFIED | config guard 구현, 실행 검증 PASS |
| HOOK-04 | 04-01-PLAN.md | 관련 없는 명령 종료 시 spurious firing 없음 | ✓ SATISFIED | 최근 200줄 검사, 무관 transcript → {} 확인 |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `hooks/stop_hook.py` | 28 | `return {}` | ℹ️ Info | load_config()의 예외 처리 반환값. 데이터 흐름 아님 — fail-open 정책의 정상 동작. STUB 아님 |

채무 마커(TBD/FIXME/XXX) 없음. Placeholder 없음. 스텁 없음.

---

### Human Verification Required

#### 1. ROADMAP SC2 — SubagentStop 자동 호출 vs 안내 메시지 수용 여부

**Test:** ROADMAP.md Phase 4 Success Criteria 2를 읽고 현재 구현이 허용 범위인지 판단
- ROADMAP SC2 원문: "When Superpowers code-reviewer completes, a SubagentStop hook **invokes** Hookify /hookify **automatically**"
- 실제 구현: SubagentStop 훅이 "Run /super-gsd:sg-learn to capture lessons with Hookify." 메시지를 출력 (자동 실행 아님)
- PLAN must_have 2: "hooks는 skill 직접 호출 불가 — 메시지 안내가 최대 자동화 수준"이라고 명시

**Expected:** 두 가지 결과 중 하나:
  - (A) 수용: Claude Code hooks 시스템은 slash command를 직접 invoke할 수 없으므로 안내 메시지가 기술적 최대치이며 ROADMAP SC2를 충족한다고 판단
  - (B) 불수용: ROADMAP SC2는 자동 호출을 명시하므로 Phase 5 또는 별도 구현이 필요

**Why human:** Claude Code hooks 런타임이 slash command를 실행할 수 있는지 여부는 Claude Code 내부 동작에 대한 지식이 필요. 문서만으로는 판단 불가.

---

### Gaps Summary

SC2 관련 UNCERTAIN 항목 외 구조적 갭 없음. 모든 아티팩트 존재, 실질적 구현, 와이어링 완료. 동작 검증 전 항목 PASS.

핵심 불일치: ROADMAP SC2의 "자동 호출"과 실제 "안내 메시지 출력"의 간극. PLAN 단계에서 기술적 제약으로 조정된 것이 명시되어 있으나, 최종 ROADMAP 계약과의 정합성은 사람이 확인해야 한다.

---

_Verified: 2026-05-16T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
