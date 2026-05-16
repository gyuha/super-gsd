# Phase 6: sg-health - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 6-sg-health
**Areas discussed:** 설치 감지 경로, sg-health 구현 형태, HEALTH-06 패치 범위

---

## 설치 감지 경로

### GSD 설치 여부

| Option | Description | Selected |
|--------|-------------|----------|
| `~/.claude/get-shit-done/` 디렉토리만 | GSD 표준 설치 경로 — 간단하고 신뢰성 높음 | ✓ |
| gsd-sdk 명령 실행 가능 여부 | 더 정확하지만 다른 에러나 실패 요인을 숨길 수 있음 | |
| `~/.claude/get-shit-done/workflows/` 하위 파일도 확인 | 디렉토리 + 핵심 파일 동시 요구 — 엄격하지만 오탐 가능성 있음 | |

**User's choice:** `~/.claude/get-shit-done/` 디렉토리만
**Notes:** 가장 단순한 방법 선택

### Superpowers/Hookify 설치 여부

| Option | Description | Selected |
|--------|-------------|----------|
| plugins/data/ 디렉토리 | `~/.claude/plugins/data/{name}-claude-plugins-official` — 플러그인 설치된 모습 확인 | ✓ |
| plugins/cache/ 디렉토리 | 다운로드된 코드 확인 — 설치 안 해도 존재 가능 | |
| 둘 다 확인 | data + cache 둘 다 요구 — 엄격하지만 오탐 가능성 있음 | |

**User's choice:** plugins/data/ 디렉토리
**Notes:** 실제 설치 여부를 정확히 반영하는 경로 선택

---

## sg-health 구현 형태

### 구현 방식

| Option | Description | Selected |
|--------|-------------|----------|
| Claude 명령 파일만 (.md) | sg-status.md처럼 Claude가 직접 파일을 읽고 분석하여 출력 — 새 파일 추가 없음 | ✓ |
| Python 스크립트 + .md | health_checker.py를 생성하고 .md에서 Bash로 호출 — exit code 실제 리턴 가능 | |

**User's choice:** Claude 명령 파일만 (.md)
**Notes:** 기존 패턴 유지, 복잡도 최소화

### 출력 형식

| Option | Description | Selected |
|--------|-------------|----------|
| 라인별 [OK]/[WARN]/[FAIL] + 요약 줄 | 각 검사 항목을 한 줄씩 표시, 마지막에 [FAIL] N개 요약 | ✓ |
| 섹션별 그룹 출력 | ## 설치 상태 / ## 훅 같은 섹션 구조 | |

**User's choice:** 라인별 [OK]/[WARN]/[FAIL] + 요약 줄
**Notes:** 빠르게 스캔 가능한 형식 선택

---

## HEALTH-06 패치 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 'hookify' 문자열만 제거 | HOOKIFY_SIGNALS에서 'hookify'만 제거, 나머지 3개 패턴 유지 | ✓ |
| HOOKIFY_SIGNALS 리스트 전체 재검토 | 4개 패턴 모두 새로 검토하여 오발동 위험 있는 것 전부 정리 | |

**User's choice:** 'hookify' 문자열만 제거
**Notes:** 최소 변경 원칙. 'Retrospective complete', 'hooks generated', 'patterns extracted'는 유지

---

## Claude's Discretion

- WARN vs FAIL 경계: 파일 없음 → WARN, 스키마 손상 → FAIL (신규 사용자가 HANDOFF.md 없는 것은 정상)
- hooks.json에 Stop 또는 SubagentStop 중 하나라도 없으면 [FAIL]
- STATE.md 없으면 [WARN], frontmatter 파싱 실패면 [FAIL]

## Deferred Ideas

- sg-health `--json` 플래그: 스크립팅 용도 (v1.2 Future Requirements)
- exit code 실제 리턴: Python 스크립트 도입 시 가능 (v1.2 검토)
