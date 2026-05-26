# Phase 32: Skills 파일 파싱 방식 Superpowers 전환 — Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

`skills/sg-*/SKILL.md` + `.agents/skills/sg-*/SKILL.md` 에 산재한 **bash 파이프라인(grep|sed|awk) 기반 파일 파싱**을 **Superpowers 방식(Read 도구 + Claude 해석)**으로 전환한다. 동시에 `CLAUDE.md`의 D-04~D-06 lock 컨벤션을 제거하고 Superpowers 방식 권장 설명으로 교체한다.

**배경:** GSD는 `gsd-tools.cjs` SDK를 통해 Node.js로 파싱하고, Superpowers는 bash 없이 Read 도구로 파일을 읽어 Claude가 직접 해석한다. super-gsd는 현재 `grep|sed|awk` 파이프라인을 사용하는데, 이는 bash-only라 Windows 등에서 동작하지 않는다.

**변경 대상 파일:**

| 파일 | 현재 bash 패턴 | 전환 대상 |
|------|---------------|----------|
| `skills/sg-complete/SKILL.md` | `grep -E '^Phase:' \| sed \| awk` | Read 도구 + Claude 해석 |
| `skills/sg-execute/SKILL.md` | `grep -E '^Phase:' \| sed \| awk`, `sed`, `awk` (ROADMAP 파싱) | Read 도구 + Claude 해석 |
| `skills/sg-health/SKILL.md` | `grep -E` (HANDOFF 파싱) | Read 도구 + Claude 해석 |
| `skills/sg-lessons/SKILL.md` | `grep -oE \| sed` (argument 파싱) | node -e |
| `skills/sg-plan/SKILL.md` | `grep -E '^Phase:' \| sed \| awk` | Read 도구 + Claude 해석 |
| `skills/sg-quick/SKILL.md` | `sed` (argument 처리), `awk` (HANDOFF 업데이트) | node -e / Read 도구 |
| `skills/sg-review/SKILL.md` | `grep -E '^Phase:' \| sed \| awk`, `sed -n` | Read 도구 + Claude 해석 |
| `skills/sg-ship/SKILL.md` | `grep -E '^Phase:' \| sed \| awk` | Read 도구 + Claude 해석 |
| `skills/sg-ui-plan/SKILL.md` | `grep -E '^Phase:' \| sed \| awk` | Read 도구 + Claude 해석 |
| `skills/sg-retro/SKILL.md` | D-04~D-06 lock 주석 제거 (셸 코드 자체는 유지) | 주석만 교체 |
| `CLAUDE.md` | D-04~D-06 lock 컨벤션 → Superpowers 방식 권장 설명 | 컨벤션 업데이트 |

**명시적 제외:**
- `skills/sg-status/SKILL.md` — D-07 lock (sg-next와 동시 수정 계약)
- `skills/sg-next/SKILL.md` — D-07 lock (sg-status와 동시 수정 계약)
- `skills/sg-start/SKILL.md` — Phase 6 D-04 lock
- `hooks/*.cjs` — Node.js 런타임에서 실행; Read 도구 없음, bash 유지 필수

</domain>

<decisions>
## Confirmed Decisions

| ID | 결정 | 근거 |
|----|------|------|
| D-01 | **전환 범위**: `skills/` + `.agents/skills/` 양쪽 모두 | 일관성 — 한쪽만 바꾸면 drift 발생 |
| D-02 | **sg-retro 락 주석**: L18/L26 D-04~D-06 lock 주석 제거, 셸 코드 자체는 유지 | Phase 32의 목적이 락 해제. 단, macOS 호환성 주석은 남김 |
| D-03 | **CLAUDE.md 컨벤션**: `(Phase 7 D-04~D-06 lock)` 참조 제거 + Superpowers 방식(Read 도구) 권장 설명 추가 | 락 컨벤션 교체 |
| D-04 | **hooks 스코프**: `hooks/*.cjs` 명시적 제외 | hooks는 Node.js 런타임에서 실행, Read 도구 없음 |
| D-05 | **sg-status/sg-next/sg-start**: 명시적 제외 (락 유지) | 기존 락 계약 위반 시 더 큰 리스크 |
| D-06 | **전환 패턴**: 복잡한 YAML/Markdown 파싱은 Read 도구 + Claude 해석; 단순 argument 파싱은 node -e 유지 | Superpowers 철학 — AI가 파일 내용 해석 |

</decisions>

<superpowers_approach>
## Superpowers 방식이란?

Superpowers skills는 파일 파싱에 bash를 전혀 사용하지 않는다. 파일 읽기가 필요하면:

```markdown
# 현재 (bash 방식)
PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')

# Superpowers 방식
Read .planning/STATE.md, extract the Phase: field from the YAML frontmatter
```

Claude가 Read 도구로 직접 파일을 읽고, AI 지능으로 내용을 해석한다. 정규식/파이프라인 불필요.

**적용 패턴:**

| 현재 패턴 | Superpowers 전환 방식 |
|-----------|----------------------|
| `grep -E '^Phase:'...` | `Read .planning/STATE.md` → frontmatter에서 Phase: 값 추출 |
| `grep -E '^\| [0-9]{4}-'...awk -F'\|'` | `Read .planning/HANDOFF.md` → 마지막 데이터 행에서 To 컬럼 추출 |
| `grep -E '^### Phase ${N}:'` | `Read .planning/ROADMAP.md` → 해당 섹션 찾기 |
| `sed -n '/<objective>/,/<\/objective>/p'` | `Read $PLAN_FILE` → objective 섹션 추출 |

</superpowers_approach>

<requirements_map>
## Requirements Mapping

| REQ | 설명 | 파일 |
|-----|------|------|
| BASH-01 | `skills/sg-*/SKILL.md` bash 파이프라인 → Read 도구 전환 | 9개 skills |
| BASH-02 | `.agents/skills/sg-*/SKILL.md` 동일 전환 | 해당 파일들 |
| CONV-01 | `CLAUDE.md` D-04~D-06 lock 컨벤션 제거 + Superpowers 방식 설명 추가 | CLAUDE.md |
| LOCK-01 | `skills/sg-retro/SKILL.md` lock 주석 제거 (코드 유지) | sg-retro |

</requirements_map>

<success_criteria>
## Success Criteria

1. `grep -rn 'grep -E.*Phase\|sed -E.*Phase\|awk.*print.*Phase' skills/sg-{complete,execute,plan,review,ship,ui-plan}/SKILL.md .agents/skills/*/SKILL.md` 결과 0건
2. `skills/sg-retro/SKILL.md`에 `D-04~D-06 lock` 문자열이 없고 macOS 호환성 주석은 유지됨
3. `CLAUDE.md`에 `Phase 7 D-04~D-06 lock` 문자열이 없고 Superpowers 방식 권장 설명이 추가됨
4. `skills/sg-status/SKILL.md`, `skills/sg-next/SKILL.md`, `skills/sg-start/SKILL.md`는 변경 없음
5. `hooks/*.cjs`는 변경 없음

</success_criteria>
