# Phase 13: sg-learn 라우팅 전환 + hookify 의존성 제거 - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

`sg-learn`이 `hookify:hookify` 대신 내장 `super-gsd:sg-retro`를 호출하도록 라우팅을 전환하고, README/docs/sg-update에서 hookify를 필수 의존성에서 제거하여 super-gsd가 hookify 없이 단독으로 완전 동작하도록 한다.

이 phase의 책임:
1. `commands/sg-learn.md` — Skill 호출을 `hookify:hookify` → `super-gsd:sg-retro`로 교체
2. `commands/sg-update.md` — hookify를 필수 설치 대상에서 제거 (optional 모드로 분리)
3. `README.md` / `README.ko.md` — hookify dependency를 optional/historical로 demote
4. `docs/COMMANDS.md` — sg-learn 항목에서 hookify 참조 제거
5. Manual e2e checklist (MIGRATION-02) — hookify 미설치 환경에서 sg-learn 정상 동작 검증 문서화

Phase 14는 없다 — 이것이 v1.2의 마지막 phase다.
</domain>

<decisions>
## Implementation Decisions

### A. sg-learn.md Skill 교체

- **D-01:** `commands/sg-learn.md`의 `Skill(skill="hookify:hookify", args="$ARGUMENTS")`를 `Skill(skill="super-gsd:sg-retro", args="$ARGUMENTS")`로 교체한다.
  frontmatter description도 hookify 언급을 제거하고 sg-retro를 명시한다.

- **D-02:** HANDOFF.md에 기록하는 stage 값은 `hookify`를 유지한다.
  이유: `commands/sg-status.md`가 `hookify` stage를 → `sg-ship` 라우팅으로 매핑하고 있으며,
  HANDOFF schema 변경은 별도 phase 스코프다. sg-learn 동작 자체는 변하지 않으므로 호환성 유지.

### B. sg-update.md hookify 처리

- **D-03:** hookify를 기본 설치 대상에서 제거하고 "optional" 주석과 함께 별도 블록으로 분리한다.
  사용자가 `--with-hookify` 플래그를 전달하거나, 또는 그냥 삭제.
  가장 단순한 구현: hookify 설치 블록 전체를 제거하고 success_criteria에서도 제거.
  hookify가 이미 설치된 경우를 위해 "optional: run `claude plugin install hookify@claude-plugins-official` manually" 안내 주석 추가.

- **D-04:** `commands/sg-update.md`의 description과 echo 출력에서 hookify 언급 제거.
  `Tools:` 요약에서 "GSD, superpowers, super-gsd" 세 항목만 남긴다.

### C. README/docs hookify demote

- **D-05:** `README.md`와 `README.ko.md`에서 hookify를 "Required"에서 제거하고
  "Optional: hookify (for enhanced rule authoring workflow)" 형태로 demote한다.
  Prerequisites 섹션에서 hookify 설치 명령을 삭제하거나 Optional 서브섹션으로 이동.

- **D-06:** `docs/COMMANDS.md`의 sg-learn 항목에서 `hookify:hookify` 참조를 `super-gsd:sg-retro`로 교체한다.
  상세 설명도 sg-retro를 primary로, hookify를 미언급으로 처리.

- **D-07:** `.claude-plugin/plugin.json`의 `"hookify"` keyword는 제거한다.
  description에서 "-> Hookify" 체인 표현을 "-> sg-retro" 또는 단순화된 표현으로 교체.

### D. MIGRATION-02 e2e 체크리스트

- **D-08:** Phase 13 SUMMARY.md에 manual e2e 체크리스트를 포함한다:
  - hookify 미설치 환경에서 `/super-gsd:sg-learn` 호출 시 sg-retro가 실행됨을 확인
  - 기존 hookify 설치 환경에서도 sg-learn이 sg-retro를 호출함을 확인 (hookify는 더 이상 sg-learn에서 직접 사용되지 않음)
  이 체크리스트는 implementation 후 수동으로 검증하며, PLAN.md의 Task 2로 checkpoint를 추가한다.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 기존 구현 파일
- `commands/sg-learn.md` — Skill 교체 대상, 현재 `hookify:hookify` 호출
- `commands/sg-update.md` — hookify 설치 블록 제거 대상
- `README.md` / `README.ko.md` — hookify prerequisite demote 대상
- `docs/COMMANDS.md` — sg-learn 항목 업데이트 대상
- `.claude-plugin/plugin.json` — hookify keyword 제거 대상

### sg-retro Skill 위치
- `skills/sg-retro/SKILL.md` — Phase 9/10 구현체, sg-learn이 호출할 대상

### sg-status HANDOFF stage 매핑
- `commands/sg-status.md` — `hookify` stage → sg-ship 라우팅 (D-02: 이 매핑을 유지)

</canonical_refs>

<code_context>
## Existing Code Insights

### sg-learn.md 현재 Skill 호출 (교체 대상)
```
Skill(skill="hookify:hookify", args="$ARGUMENTS")
```
교체 후:
```
Skill(skill="super-gsd:sg-retro", args="$ARGUMENTS")
```

### sg-update.md hookify 블록 (제거 대상)
```bash
# hookify
if claude plugin list 2>&1 | grep -qiF 'hookify'; then
  claude plugin install hookify@claude-plugins-official 2>&1
  ...
else
  claude plugin install hookify@claude-plugins-official 2>&1
  ...
fi
```

### README.md hookify 참조 위치
- Prerequisites 섹션: hookify 설치 명령 포함
- 워크플로우 설명: "GSD → Superpowers → Hookify" 체인 언급

### plugin.json 현재 description
"Orchestrator plugin that auto-chains GSD -> Superpowers -> Hookify ..."
교체 후: "Orchestrator plugin that auto-chains GSD -> Superpowers -> sg-retro ..."
</code_context>

<deferred>
## Deferred Items

- **HANDOFF stage 이름 변경** (`hookify` → `retro`) — sg-status HANDOFF schema 변경은 별도 phase
- **sg-status routing 업데이트** — v1.2 이후, HANDOFF stage enum 정리 시 함께 처리
- **hookify 완전 제거** (plugin.json keywords에서도) — v1.3+, 호환성 유지 기간 후
</deferred>

---

*Phase: 13-sg-learn-routing*
*Context gathered: 2026-05-21*
