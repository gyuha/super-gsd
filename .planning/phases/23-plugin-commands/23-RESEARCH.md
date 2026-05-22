# Phase 23: Plugin 연결 + commands/ 제거 + 문서 - Research

**Researched:** 2026-05-22
**Domain:** Claude Code plugin.json 스키마, commands/ → skills/ 마이그레이션, 문서 동기화
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** plugin.json "commands" 키 완전 제거. `"skills": "./skills/"` 키만 유지한다.
- **D-02:** `commands/` 디렉토리 전체 삭제 (14개 파일 포함).
- **D-03:** CLAUDE.md "1. Commands 레이어 (`commands/*.md`)"를 "1. Skills 레이어 (`skills/sg-*/SKILL.md`)"로 통합 재서술한다. `<!-- GSD:architecture-start -->...<!-- GSD:architecture-end -->` 블록 내부만 수정.
- **D-04:** README.md에서 commands/를 암묵적으로 가정하는 문구를 skills/로 교체한다.
- **D-05:** README.ko.md에도 README.md와 동일한 변경을 적용한다.

### Claude's Discretion

- 데이터 흐름(Data Flow) 다이어그램의 `sg-*` 명령 표기 방식 (commands 라인 참조가 있으면 제거)
- CLAUDE.md Technology Stack 섹션 (`commands/*.md` 언급 여부 — 최소 변경 원칙 적용)
- plugin.json 나머지 필드(version, description, author, homepage 등) — 변경 없음

### Deferred Ideas (OUT OF SCOPE)

- v1.3 ~ v1.5 마일스톤 (Multi-Platform, Team Agent, Visual Companion) — 이 phase 범위 외
- sg-parallel-execute, sg-retro를 plugin.json에 명시적으로 등록하는 방안 — Phase 23 이후 검토

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PC-01 | `plugin.json` "commands" 배열을 `./skills/sg-*/SKILL.md` 경로 14개로 교체 | **모순 해소 필요** — 공식 문서 확인 결과, skills/ 디렉토리는 manifest 없이도 자동 발견됨. "14개 경로 나열"이 아닌 "commands 키 제거 + skills 기본 디렉토리 의존"이 올바른 구현임. D-01 결정이 PC-01 원문보다 정확함 |
| PC-02 | `commands/` 디렉토리 삭제 (14개 파일 전체 제거) | `git rm -r commands/` 패턴으로 구현. D-02와 일치 |
| DOC-01 | `CLAUDE.md` Technology Stack + Architecture 섹션에서 commands/ → skills/ 반영 | D-03 + GSD 마커 보존 원칙으로 구현 |
| DOC-02 | `README.md` 명령어 설명에서 commands/ 경로 → skills/ 경로 업데이트 | README.md와 README.ko.md 동시 적용 (D-04, D-05) |

</phase_requirements>

---

## Summary

Phase 23의 핵심 기술적 질문은 "plugin.json에서 `commands` 배열을 제거하면 슬래시 명령이 깨지는가?"였다. 공식 Claude Code Plugin 문서([code.claude.com/docs/en/plugins-reference](https://code.claude.com/docs/en/plugins-reference))를 통해 이를 완전히 해소할 수 있었다.

**결론:** `commands` 키를 제거해도 `/super-gsd:sg-*` 슬래시 명령은 계속 동작한다. 이유는 두 가지다. 첫째, `skills/` 디렉토리는 plugin.json의 manifest가 없어도 플러그인 루트에서 **자동 발견(auto-discovered)**된다. 둘째, `skills` 키는 기본 `skills/` 디렉토리 스캔을 **추가(adds to)**하는 방식으로 동작하므로, 현재 `"skills": "./skills/"` 한 줄만으로 충분하다. 기존 `commands` 배열은 이미 `commands/` 디렉토리의 파일 경로들을 나열했는데, Phase 22에서 해당 파일들이 `skills/sg-*/SKILL.md`로 전환 완료됐으므로 `commands` 키는 이제 dead reference다.

REQUIREMENTS.md PC-01("commands 배열을 ./skills/sg-*/SKILL.md 경로 14개로 교체")과 D-01("commands 키 완전 제거") 사이의 모순은 해소됐다. 공식 문서에 따르면 `skills` 필드에 개별 파일 경로를 나열할 필요가 없다 — `skills/` 디렉토리는 항상 자동 스캔되고, `skills` 키는 "추가 경로"를 위한 것이다. 따라서 D-01(키 완전 제거)이 올바른 구현이다.

문서 변경(DOC-01, DOC-02)은 기계적인 텍스트 교체다. README.md와 README.ko.md에는 `commands/` 경로를 직접 참조하는 문구가 없고, Roadmap 섹션의 "Phase 3 — sg- Command Set" 표현과 CLAUDE.md Technology Stack/Architecture 섹션이 주요 수정 대상이다.

**Primary recommendation:** D-01 그대로 실행 — plugin.json `commands` 키 제거, `"skills": "./skills/"` 유지. skills/ 디렉토리 자동 발견에 의존.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 슬래시 명령 등록 | Plugin Manifest | skills/ 자동 발견 | plugin.json이 Claude Code 플러그인 로더에게 컴포넌트 경로를 선언함 |
| skills/ 자동 발견 | Claude Code 런타임 | plugin.json skills 키 | 플러그인 루트의 skills/ 디렉토리는 manifest 없이도 스캔됨 |
| commands/ 파일 제거 | Git working tree | — | git rm -r로 삭제, git history에는 보존 |
| 문서 동기화 | CLAUDE.md/README | — | GSD 마커 블록 내부만 수정, 마커 자체 보존 |

---

## Standard Stack

이 Phase는 새 라이브러리를 설치하지 않는다. 사용하는 도구는 이미 설치된 것들이다.

### 사용 도구 (설치 불필요)

| 도구 | 용도 | 비고 |
|------|------|------|
| `jq` | plugin.json에서 `commands` 키 제거 | CONTEXT.md Specifics에서 `jq 'del(.commands)'` 패턴 명시 |
| `git rm -r` | commands/ 디렉토리 삭제 | working tree + staging 동시 처리 |
| `ls` / `jq` | 삭제 후 검증 | 단순 확인 명령 |

**jq 가용성:** `jq-1.8.1` 확인됨 [VERIFIED: Bash]

### 패키지 설치 없음

이 Phase는 외부 패키지를 설치하지 않는다.

---

## Package Legitimacy Audit

> 이 Phase는 외부 패키지를 설치하지 않는다. 해당 없음.

---

## Architecture Patterns

### System Architecture Diagram

plugin.json 변경 후 슬래시 명령 발견 경로:

```
Claude Code 세션 시작
    ↓
플러그인 로더: .claude-plugin/plugin.json 읽기
    ↓
"skills": "./skills/" 키 발견
    ↓
skills/ 디렉토리 자동 스캔 (항상 포함)
    ↓
skills/sg-*/SKILL.md 16개 발견
    ↓
각 SKILL.md의 frontmatter name 필드로 슬래시 명령 등록
    ↓
/super-gsd:sg-plan, /super-gsd:sg-execute, ... (14개 + sg-retro + sg-parallel-execute)
```

commands/ 디렉토리 부재는 이 경로에 영향을 주지 않는다.

### plugin.json 변경 패턴

**현재 (변경 전):**
```json
{
  "commands": [
    "./commands/sg-start.md",
    "./commands/sg-explore.md",
    "...14개..."
  ],
  "skills": "./skills/"
}
```

**목표 (변경 후):**
```json
{
  "skills": "./skills/"
}
```

`jq 'del(.commands)'` 명령으로 원자적으로 처리 가능.

### CLAUDE.md GSD 마커 보존 패턴

수정 범위는 마커 블록 내부로 한정된다:

```
<!-- GSD:architecture-start source:ARCHITECTURE.md -->   ← 보존
...이 내부만 수정...
<!-- GSD:architecture-end -->                            ← 보존
```

Technology Stack 섹션도 GSD 마커 블록 내부다:

```
<!-- GSD:stack-start source:STACK.md -->   ← 보존
...이 내부만 수정 (commands/*.md 라인)...
<!-- GSD:stack-end -->                      ← 보존
```

### Anti-Patterns to Avoid

- **plugin.json에 skills/sg-*/SKILL.md 경로를 14개 나열하지 말 것:** `skills` 키는 "추가 경로" 용도이며, 기본 `skills/` 디렉토리는 자동 스캔된다. 경로 나열은 중복이며 유지보수 부담만 늘린다.
- **GSD 마커 외부 수정:** 마커 블록 바깥의 CLAUDE.md 섹션은 GSD가 자동으로 덮어쓸 수 있다. 항상 마커 내부만 수정한다.
- **README Roadmap 문단 텍스트 대폭 재작성:** "Phase 3 — sg- Command Set & README" 같은 역사적 기록은 있는 그대로 두거나 최소 수정한다. 과거 Phase 설명은 변경 사실 기록이지 현재 상태 설명이 아니다.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| plugin.json 키 삭제 | Python/sed 스크립트 | `jq 'del(.commands)'` | jq가 JSON 구조 보존하며 원자적 처리 |
| 디렉토리 삭제 + git 반영 | `rm -rf` + 별도 `git add` | `git rm -r commands/` | 한 명령으로 working tree + index 동시 처리 |

---

## Runtime State Inventory

이 Phase는 파일 삭제 + 설정 변경이므로 런타임 상태 인벤토리 확인이 필요하다.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | 없음 — commands/ 파일 경로를 key/collection으로 저장하는 DB 없음 | 없음 |
| Live service config | 없음 — commands/ 경로를 참조하는 외부 서비스 설정 없음 | 없음 |
| OS-registered state | 없음 — commands/ 경로를 레지스트리에 등록한 시스템 없음 | 없음 |
| Secrets/env vars | 없음 — `CLAUDE_PLUGIN_ROOT`는 플러그인 루트 경로이고 commands/ 하위 경로 아님 | 없음 |
| Build artifacts | 없음 — commands/*.md는 빌드 아티팩트가 아닌 소스 파일 | 없음 |

**결론:** 삭제 후 런타임에서 commands/ 경로를 참조하는 외부 상태는 없다. git history에서는 파일이 보존된다.

---

## Common Pitfalls

### Pitfall 1: plugin.json에 skills 경로 14개 나열 (PC-01 오해)
**What goes wrong:** REQUIREMENTS.md PC-01 원문("commands 배열을 ./skills/sg-*/SKILL.md 경로 14개로 교체")을 문자 그대로 해석하면, skills 키에 14개 경로를 나열하게 된다. 이는 작동하지만 불필요한 중복이다.
**Why it happens:** PC-01이 작성 시점에는 skills 자동 발견 동작을 고려하지 않았다.
**How to avoid:** 공식 문서의 Path behavior rules에 따르면 `skills` 키는 "Adds to the default" 방식이다. 기본 `skills/` 디렉토리는 항상 스캔된다. D-01(commands 키 완전 제거)이 올바른 구현이다.
**Warning signs:** plugin.json에 skills/sg-plan, skills/sg-execute 등 경로가 나열되어 있다면 과잉 명세다.

### Pitfall 2: `jq` 없이 plugin.json 수동 편집
**What goes wrong:** 텍스트 에디터로 commands 배열을 삭제할 때 trailing comma나 JSON 파싱 오류가 발생할 수 있다.
**Why it happens:** JSON은 trailing comma를 허용하지 않는다. commands 배열 뒤에 skills 필드가 있을 때 배열만 삭제하면 쉼표 처리가 복잡해진다.
**How to avoid:** `jq 'del(.commands)' .claude-plugin/plugin.json > /tmp/tmp.json && mv /tmp/tmp.json .claude-plugin/plugin.json` 패턴 사용. 또는 Write 도구로 완성된 JSON을 직접 작성.
**Warning signs:** `jq . .claude-plugin/plugin.json` 실행 시 파싱 오류 발생.

### Pitfall 3: CLAUDE.md GSD 마커 훼손
**What goes wrong:** Architecture 섹션 수정 중 `<!-- GSD:architecture-start source:ARCHITECTURE.md -->` 마커 줄을 삭제하거나 변경한다.
**Why it happens:** 마커가 HTML 주석 형태라 편집 시 "불필요한 주석"으로 오인하기 쉽다.
**How to avoid:** 수정 전에 마커 보존을 명시적으로 확인한다. 마커 라인 자체는 변경하지 않고 내부 텍스트만 변경한다.
**Warning signs:** 변경 후 `grep "GSD:architecture-start" CLAUDE.md`가 결과를 반환하지 않음.

### Pitfall 4: sg-retro/sg-parallel-execute를 commands/에서 누락됐다고 판단해 처리
**What goes wrong:** skills/ 디렉토리에 sg-retro와 sg-parallel-execute가 있지만 commands/에는 대응 파일이 없었다. 이를 "누락"으로 보고 plugin.json에 명시적으로 추가하려 할 수 있다.
**Why it happens:** 기존 commands/ 배열이 14개였고 skills/가 16개인 차이에서 혼동 발생.
**How to avoid:** CONTEXT.md Specifics에 명시됐듯 이 두 파일은 commands/에 대응 항목이 없는 것이 원래 설계다. skills/ 디렉토리 자동 스캔으로 함께 발견된다. Phase 23 범위 외다.

---

## PC-01 모순 해소

**REQUIREMENTS.md PC-01 원문:** "plugin.json 'commands' 배열을 ./skills/sg-*/SKILL.md 경로 14개로 교체"

**D-01 결정:** "commands 키 완전 제거"

**공식 문서 근거 [CITED: code.claude.com/docs/en/plugins-reference]:**

> "skills: string|array — Custom skill directories containing `<name>/SKILL.md` (in addition to default `skills/`)"
> "Adds to the default: skills. The default `skills/` directory is always scanned, and directories listed in skills are loaded alongside it"

**결론:** `skills/` 디렉토리는 plugin.json에 명시하지 않아도 자동 스캔된다. 현재 `"skills": "./skills/"`는 기본 동작을 명시적으로 선언하는 것이지, 이것 없이도 동작한다. `commands` 키를 제거하고 `skills` 키만 남기면 16개 SKILL.md가 모두 슬래시 명령으로 등록된다. PC-01 "교체"의 올바른 해석은 D-01("commands 키 제거")이다.

---

## Code Examples

### plugin.json 최종 상태 (목표)
```json
{
  "name": "super-gsd",
  "version": "0.0.28",
  "description": "Orchestrator plugin that auto-chains GSD -> Superpowers -> sg-retro so planning, implementation, and retrospection stay connected as a single learning loop.",
  "author": {
    "name": "gyuha",
    "url": "https://github.com/gyuha"
  },
  "skills": "./skills/",
  "homepage": "https://github.com/gyuha/super-gsd",
  "repository": "https://github.com/gyuha/super-gsd",
  "license": "MIT",
  "keywords": [
    "gsd",
    "superpowers",
    "orchestration",
    "workflow",
    "claude-code"
  ]
}
```

### jq로 commands 키 제거
```bash
# Source: CONTEXT.md Specifics
jq 'del(.commands)' .claude-plugin/plugin.json > /tmp/plugin_tmp.json && mv /tmp/plugin_tmp.json .claude-plugin/plugin.json
```

### commands/ 디렉토리 삭제
```bash
git rm -r commands/
```

### 삭제 검증
```bash
ls commands/ 2>&1   # "No such file or directory" 확인
jq '.commands' .claude-plugin/plugin.json   # "null" 출력 확인
```

### CLAUDE.md Technology Stack 변경 내용 (GSD:stack 마커 내부)

변경 전 (`commands/*.md` + `skills/sg-retro/SKILL.md` 두 줄):
```
- **Commands**: `commands/*.md` — YAML frontmatter + `<process>` 블록으로 구성된 Markdown. Claude Code가 슬래시 명령 실행 시 이 파일의 내용을 지시문으로 해석한다
- **Skills**: `skills/sg-retro/SKILL.md` — `<objective>` / `<process>` 블록 구조의 Markdown 스킬
```

변경 후 (Skills 한 줄로 통합):
```
- **Skills**: `skills/sg-*/SKILL.md` — YAML frontmatter + `<objective>` / `<process>` / `<success_criteria>` 블록 구조. Claude Code 슬래시 명령(`/super-gsd:sg-*`)으로 직접 호출되거나 Claude가 자동 발동한다
```

### CLAUDE.md Architecture 섹션 변경 내용 (GSD:architecture 마커 내부)

"1. Commands 레이어" 항목 전체를 아래로 교체:
```
**1. Skills 레이어** (`skills/sg-*/SKILL.md`)

16개의 SKILL.md 파일이 각각 하나의 `/super-gsd:sg-*` 슬래시 명령을 정의한다. 14개는 GSD → Superpowers → sg-retro 워크플로우 명령이고, sg-retro(회고)와 sg-parallel-execute(병렬 실행)가 추가로 포함된다. Claude Code가 SKILL.md를 실행 지시문으로 해석하며, GSD skill, Superpowers skill, 또는 Python 스크립트를 호출해 단계 간 인계를 수행한다.
```

기존 "3. Skills 레이어" 항목은 삭제 (1번으로 통합).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `commands/*.md` — flat Markdown 파일 | `skills/sg-*/SKILL.md` — 디렉토리 구조 SKILL.md | Claude Code skills 표준 도입 | frontmatter 제어, 지원 파일 추가, 자동 발동 가능 |
| plugin.json `commands` 배열에 경로 나열 | `skills/` 디렉토리 자동 발견 | Plugin 시스템 성숙 | manifest 없이도 skills/ 스캔, 유지보수 부담 감소 |

**Deprecated/outdated:**
- `commands/*.md` 패턴: 여전히 동작하지만 공식 문서에서 "Use `skills/` for new plugins" 권고 [CITED: code.claude.com/docs/en/plugins]
- plugin.json `commands` 배열에 개별 파일 경로 나열: `skills/` 디렉토리 자동 발견으로 대체

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | skills/ 디렉토리 자동 발견은 `"skills": "./skills/"` 키 유무와 무관하게 항상 동작한다 | PC-01 모순 해소 | 만약 `"skills"` 키가 필수라면, commands 키 제거 후 skills/ 키를 반드시 보존해야 하지만 현재도 보존되므로 실질 영향 없음 |

**A1 검증 결과:** "Skills and commands are automatically discovered when the plugin is installed" [CITED: code.claude.com/docs/en/plugins-reference] 공식 문서 확인. 현재 plugin.json에 이미 `"skills": "./skills/"` 가 있으므로 A1이 틀려도 실질 영향 없음.

---

## Open Questions

1. **plugin.json version 필드 처리**
   - What we know: CONTEXT.md Claude's Discretion에서 "plugin.json 나머지 필드(version, description, author, homepage 등) — 변경 없음" 명시
   - What's unclear: commands 제거와 함께 버전을 올려야 하는지 (이것이 배포 트리거인가)
   - Recommendation: 이 Phase는 plugin.json 구조 변경이지 기능 변경이 아니므로, 버전 업은 별도 배포 트리거로 처리. Phase 23 범위에서는 version 변경 없음.

2. **README Roadmap에 Phase 22-23 추가 여부**
   - What we know: 현재 README.md Roadmap은 Phase 16까지만 기록되어 있다
   - What's unclear: Phase 22(Skills 생성), Phase 23(commands 제거)를 Roadmap에 추가해야 하는가
   - Recommendation: DOC-02 범위는 "commands/ 참조 정리"이며, Roadmap 확장은 별도 요청이 없는 한 포함하지 않는다. Claude's Discretion 영역으로 판단해 플래너가 결정.

---

## Environment Availability

이 Phase는 `jq`와 `git`만 사용한다.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| jq | plugin.json commands 키 제거 | ✓ | jq-1.8.1 | Write 도구로 JSON 직접 작성 |
| git | commands/ 디렉토리 삭제 | ✓ | (이미 사용 중) | — |

**Missing dependencies with no fallback:** 없음

---

## Validation Architecture

### Test Framework

이 Phase는 코드 실행이 없고 파일/설정 변경만 있으므로 자동화 테스트 프레임워크가 아닌 수동 검증으로 충분하다.

| Property | Value |
|----------|-------|
| Framework | 없음 (bash 검증 명령) |
| Quick run command | `jq '.commands' .claude-plugin/plugin.json` |
| Full suite command | `ls commands/ 2>&1 && jq . .claude-plugin/plugin.json && grep "GSD:architecture-start" CLAUDE.md` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PC-01 | plugin.json에 commands 키 없음 | smoke | `jq '.commands // "null"' .claude-plugin/plugin.json` — "null" 출력 확인 | N/A |
| PC-02 | commands/ 디렉토리 없음 | smoke | `ls commands/ 2>&1 \| grep "No such file"` | N/A |
| DOC-01 | CLAUDE.md에 "Commands 레이어" 문구 없음 | smoke | `grep -c "Commands 레이어" CLAUDE.md` — 0 확인 | N/A |
| DOC-01 | CLAUDE.md GSD 마커 보존 | smoke | `grep "GSD:architecture-start" CLAUDE.md` — 결과 존재 확인 | N/A |
| DOC-02 | README.md "Phase 3 — sg- Command Set" 표현 업데이트 | smoke | 수동 확인 | N/A |

---

## Security Domain

이 Phase는 파일 삭제와 문서 수정이다. 보안 관련 변경이 없으므로 Security Domain 해당 없음.

---

## Sources

### Primary (HIGH confidence)
- [code.claude.com/docs/en/plugins-reference](https://code.claude.com/docs/en/plugins-reference) — Plugin manifest schema, "commands" vs "skills" path behavior rules, 자동 발견 동작 확인
- [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) — Plugin 구조 개요, `commands/` deprecated 명시
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) — Skills 동작 방식, 슬래시 명령 등록 메커니즘

### Secondary (MEDIUM confidence)
- WebSearch 결과: "Commands are legacy: 'Use skills/ for new plugins'" — 공식 문서에서 재확인됨

---

## Metadata

**Confidence breakdown:**
- PC-01 모순 해소: HIGH — 공식 문서에서 path behavior rules 직접 확인
- plugin.json 변경 방법: HIGH — jq 가용성 확인 (v1.8.1), 패턴 명확
- 문서 변경 범위: HIGH — 실제 파일 grep으로 commands/ 직접 참조 없음 확인
- GSD 마커 동작: HIGH — CLAUDE.md에서 마커 구조 직접 확인

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (Claude Code plugin 스키마는 안정적 — 30일 유효)
