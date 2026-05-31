# Phase 47: sg-execute TDD 주입 + sg-review 실패 루프 - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

이 단계는 Phase 46이 만든 `.planning/USE-TDD` 마커를 **소비**하여 워크플로우 동작을 바꾼다. 두 스킬을 수정한다:

- **sg-execute** — 마커가 있으면 `superpowers:executing-plans` 핸드오프 프롬프트에 test-first 지시(Red 테스트 우선 + `superpowers:test-driven-development` 스킬 사용)를 주입한다. 마커가 없으면 기존과 완전히 동일하게 동작한다(비침투, opt-in).
- **sg-review** — 마커가 있으면 코드 리뷰 컨텍스트에 테스트 통과 검증 지시를 주입하고, 리뷰 결과가 FAIL이면 사용자 확인 후 sg-execute를 재호출하는 제한된 실패 루프(최대 2회)를 구성한다.

양쪽 변경은 `.agents/skills/sg-execute/SKILL.md`와 `.agents/skills/sg-review/SKILL.md` 미러에도 동일하게 반영한다(pairwise sync).

이 단계가 다루지 않는 것: 마커 생성/삭제(Phase 46 완료), 병렬 실행 경로(sg-parallel-execute)의 TDD 주입, README 문서화(Phase 48), 프로젝트별 테스트 러너 자동 감지(REVIEW-F1, Future).

흐름:
```
sg-execute → USE-TDD 존재? ─ 예 → 핸드오프에 test-first 지시 주입
                          └ 아니오 → 기존 동작 (변경 없음)
              + USE-TDD-RETRY 존재? ─ 예 → Step 7 멱등 체크 SKIP + 이전 FAIL 피드백 주입
                                    └ 아니오 → 정상 신규 실행

sg-review → requesting-code-review 호출(Task subagent 디스패치, 제어 반환)
          → 결과 PASS ─ USE-TDD-RETRY 삭제 → 종료
          → 결과 FAIL → USE-TDD-RETRY 카운트 읽기
                       ├ count < 2 → AskUserQuestion("재실행?") ─ 승인 → count+1·피드백 기록 → Skill(sg-execute)
                       │                                        └ 거절 → 중단
                       └ count == 2 → "한도 초과" 보고 + USE-TDD-RETRY 삭제 → 중단
```

</domain>

<decisions>
## Implementation Decisions

> 아래 D-01~D-08은 사용자/팀이 사전 그릴링으로 확정한 LOCKED 결정이다. 재질문 금지.

### 마커/카운터 파일 분리 (EXEC-01, REVIEW-02/03)
- **D-01:** TDD 모드 판정은 `.planning/USE-TDD`(Phase 46, presence-only, 변경 없음)로만 한다. 재시도 카운터 + 마지막 리뷰 FAIL 피드백은 **별도 파일** `.planning/USE-TDD-RETRY`에 저장한다. presence-only 마커의 의미론을 오염시키지 않기 위해 분리한다.

### sg-execute 재시도 경로 (REVIEW-02)
- **D-02:** `.planning/USE-TDD-RETRY`가 존재하면 sg-execute는 (a) **Step 7 멱등성 체크를 SKIP**하고(같은 plan hash라도 재실행 허용), (b) 파일에 기록된 이전 리뷰 FAIL 피드백을 핸드오프에 `## Previous Test Failures — Fix First` 섹션으로 주입한다. 파일이 **부재 = 정상/신규 실행 = 기존 동작 완전 불변**(비침투).

### TDD 주입 — 순차 경로 한정 (EXEC-01, EXEC-02)
- **D-03:** `.planning/USE-TDD`가 있을 때 sg-execute는 **순차(sequential) 핸드오프**(`superpowers:executing-plans`, 현 Step 9)에만 주입한다: `superpowers:test-driven-development` 스킬 사용 + 구현 전 실패(Red) 테스트 우선 작성 지시. **병렬 경로(sg-parallel-execute)는 이 단계 범위 밖**이다 — 요건은 순차 핸드오프만 명시한다. 병렬 TDD는 Future로 분류한다.
- **D-03b [informational]:** 마커가 없으면 주입 0줄 — 프롬프트 블롭은 현 Step 9와 바이트 단위로 동일해야 한다(EXEC-02 회귀 방지 기준).

### sg-review TDD 검증 (REVIEW-01, REVIEW-F1)
- **D-04:** `.planning/USE-TDD`가 있을 때 sg-review는 `requesting-code-review` 컨텍스트에 테스트 통과/실패 검증 지시 + 명확한 PASS/FAIL 신호 표면화 지시를 주입한다. PASS/FAIL 판정은 **코드 리뷰 subagent에 위임**한다 — 테스트 러너 자동 감지 없음(REVIEW-F1, 비침투 원칙).

### 실패 루프 (REVIEW-02, REVIEW-03)
- **D-05:** `superpowers:requesting-code-review`는 **terminal이 아니다** — Task subagent를 디스패치하고 결과와 함께 호출자에게 제어를 반환한다. 리뷰 결과 반환 후 sg-review가: FAIL 감지 → `.planning/USE-TDD-RETRY`에서 현재 카운트 읽기 → count < 2면 `AskUserQuestion("sg-execute로 수정·재실행?")` → 승인 시 count+1·피드백을 파일에 기록 후 `Skill(sg-execute)` 재호출 → count == 2면 "한도 초과" 보고 후 **중단(질문 안 함)**. 거절 시 중단.

### 카운터 리셋 (REVIEW-03)
- **D-06:** PASS 시, 그리고 한도 초과 중단 시 모두 `.planning/USE-TDD-RETRY` 파일을 **삭제**한다. 한도 초과 중단 후 사용자가 PLAN을 고쳐 깨끗하게 재시작할 수 있게 한다.

### .agents 미러 (EXEC-03, REVIEW-04, D-08)
- **D-07:** `.agents/skills/sg-execute/SKILL.md`와 `.agents/skills/sg-review/SKILL.md` 미러에 동일 동작을 반영한다. AskUserQuestion 미지원 플랫폼이므로 **프로즈 폴백**: 자동 재호출 대신 "tests FAILED — `$sg-execute` 재실행으로 수정하세요"를 수동 안내로 보고한다. 두 미러는 본체와 **같은 커밋**에서 변경한다(pairwise sync, CLAUDE.md 컨벤션 / Phase 32 Medium-1).

### 플랜 분할 권고 (D-08)
- **D-08:** 2개 플랜 권고 — **Plan 01 = sg-execute**(TDD 주입 + 재시도 경로 + 미러), **Plan 02 = sg-review**(검증 + 실패 루프 + 미러). 최종 분할은 plan-phase 재량.

### Claude's Discretion
- 핸드오프 주입 섹션의 정확한 마크다운 문구, `USE-TDD-RETRY` 파일 포맷(카운트·피드백 직렬화 방식 — 예: 첫 줄 카운트 + 이후 피드백 본문), bash vs Read-도구 사용 비율, AskUserQuestion 옵션 라벨 문구는 구현자 재량.
- 단, macOS/Linux 셸 이식성(CLAUDE.md: `grep -P` 금지, BSD awk `|` 구분자 금지 → `cut -d'|'` 또는 `awk -F'|'`)과 사용자-언어 산문 출력(머신 토큰 `USE-TDD`/`USE-TDD-RETRY`/경로/`$sg-*`/`/super-gsd:sg-*`는 영문 그대로)은 준수.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요건 정의
- `.planning/REQUIREMENTS.md` — EXEC-01, EXEC-02, EXEC-03(line 19-21), REVIEW-01~04(line 25-28), REVIEW-F1(line 42, Future). 이 단계의 요건 원문.
- `.planning/ROADMAP.md` §"Phase 47: sg-execute TDD 주입 + sg-review 실패 루프"(line 514-527) — Goal + 5개 Success Criteria. ROADMAP에 명시된 별도 canonical ref 라인 없음.

### 수정 대상 파일 (4개, pairwise 미러)
- `skills/sg-execute/SKILL.md` — 본체. **Step 7**(line 135-143)이 멱등성 체크(재시도 경로에서 SKIP 대상). **Step 9**(line 282-331)가 순차 프롬프트 블롭 조립 지점(TDD 주입 대상) + 병렬 라우팅 분기.
- `.agents/skills/sg-execute/SKILL.md` — 미러 (프로즈 폴백).
- `skills/sg-review/SKILL.md` — 본체. **Step 4**(line 176-189)가 `requesting-code-review` 호출 지점. 현재 line 158/178이 이 호출을 "terminal"·"no steps execute after this point"로 표기 — D-05와 충돌하므로 **post-review 실패 루프 단계 추가 시 이 표기 정정 필요**.
- `.agents/skills/sg-review/SKILL.md` — 미러 (프로즈 폴백).

### 재사용 대상 스킬
- `superpowers:test-driven-development` — sg-execute 핸드오프 프롬프트에서 사용을 지시할 스킬(EXEC-01). Red-우선 사이클 기준.
- `superpowers:executing-plans` — sg-execute 순차 핸드오프 대상(주입 지점).
- `superpowers:requesting-code-review` — sg-review가 호출하는 스킬. Task subagent 디스패치 후 제어 반환(non-terminal) — D-05의 근거.

### 직전 단계 컨텍스트
- `.planning/phases/46-sg-use-tdd/46-CONTEXT.md` — 마커 의미론(D-01 presence-only, D-04 최소 메타데이터), 마커 소비 지점이 Phase 47임을 명시(D-06/code_context). pairwise 미러 규칙(D-08).

### 컨벤션
- `CLAUDE.md` §"macOS 셸 이식성" — `grep -P` 금지, BSD awk `|` 주의, `skills/` + `.agents/` 쌍 커버 규칙.
- `CLAUDE.md` §"사용자 언어 메시지" — 산문은 사용자 언어, 머신 토큰은 영문 그대로.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **sg-execute Step 9 프롬프트 블롭**: 마커 부재 시 현 블롭과 동일 출력이 EXEC-02 회귀 기준. 마커 존재 시 `## Instruction to Superpowers` 섹션 앞/뒤에 TDD 지시 + (재시도 시) `## Previous Test Failures — Fix First` 섹션을 추가하는 방식이 최소 침투.
- **HANDOFF.md 6컬럼 스키마** (`| Timestamp | Phase | From | To | Plan Hash | User |`): sg-execute 재호출 시에도 기존 append-only 패턴 유지. 재시도 행 추가 정책은 plan-phase가 정함.
- **AskUserQuestion 패턴**: sg-review Step 1.5(line 76-90)에 이미 auto-commit 게이트용 AskUserQuestion 선례 존재 — 실패 루프 확인 다이얼로그의 형식·톤 레퍼런스.

### Established Patterns
- **멱등성 게이트**(sg-execute Step 7): 같은 (phase, to, plan_hash) 재핸드오프 방지. 재시도 경로는 이 게이트를 의도적으로 우회해야 함(D-02) — plan_hash가 같아도 재실행이 목적이므로.
- **비침투 분기 패턴**: Phase 46 마커는 presence-only. sg-execute/sg-review 모두 "파일 존재 체크 → 분기" 구조로 기존 경로를 건드리지 않고 새 경로만 추가.
- **Pairwise 미러**: `skills/sg-*/SKILL.md` 변경 시 `.agents/skills/sg-*/SKILL.md` 동일 커밋 포함. 미포함 시 코드 리뷰 블로커(Phase 32 Medium-1).

### Integration Points
- **마커 읽기 지점은 이 단계가 신규 추가** — Phase 46은 마커를 쓰기만 했고 읽는 쪽이 없었다. sg-execute/sg-review가 첫 소비자.
- **sg-review → sg-execute 재호출**: `Skill(sg-execute)` 재진입. 재진입 시 `USE-TDD-RETRY`가 존재하므로 sg-execute가 멱등 체크 SKIP + 피드백 주입 경로를 탄다(D-02). 두 스킬이 `USE-TDD-RETRY` 파일을 통해 상태를 주고받는 핸드셰이크.

</code_context>

<specifics>
## Specific Ideas

- 사용자/팀이 사전 그릴링으로 확정한 8개 결정(D-01~D-08) + Discretion 전부 반영. 재질문 금지.
- **주의(plan-phase가 해결할 충돌):** 현 `skills/sg-review/SKILL.md`는 `requesting-code-review` 호출을 line 158에서 "terminal Skill", line 178에서 "no steps execute after this point"로 명시한다. D-05의 post-review 실패 루프는 이 호출 **이후** 단계를 요구하므로, 플랜은 이 표기를 정정하고 호출 후 결과 수신·분기 단계를 추가해야 한다. `.agents/` 미러도 동일.
- `USE-TDD-RETRY` 직렬화 포맷은 구현자 재량이나, "카운트 + 마지막 FAIL 피드백" 두 정보를 모두 담아야 한다(D-01/D-02/D-05가 둘 다 읽음).

</specifics>

<deferred>
## Deferred Ideas

- **병렬 경로(sg-parallel-execute) TDD 주입** — 이 단계 범위 밖. 요건은 순차 핸드오프만 명시. Future로 분류(D-03).
- **README/README.ko TDD 문서화** — Phase 48 (DOC-01, DOC-02).
- **프로젝트별 테스트 러너 자동 감지(jest/pytest/go test 등)** — REVIEW-F1, Future. 비침투 원칙상 v2.11은 리뷰 신호에 위임.
- **TDD 모드 시 sg-plan이 PLAN.md에 테스트 시나리오 자동 생성** — TDD-F1, Future.

None beyond the above — 논의는 phase 범위 내 유지됨. 새 스코프 크리프 없음.

</deferred>

---

*Phase: 47-tdd-inject-fail-loop*
*Context gathered: 2026-06-01*
