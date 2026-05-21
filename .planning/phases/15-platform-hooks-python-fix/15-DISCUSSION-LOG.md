# Phase 15: 플랫폼별 훅 설정 + Python 픽스 — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 15-platform-hooks-python-fix
**Areas discussed:** A. 훅 경로 동적 탐지, B. BeforeTool/PreToolUse 정규화, C. .gemini/settings.json 스키마 불확실성

---

## A. 훅 경로: 동적 루트 탐지 방법

| 옵션 | 설명 | 선택 |
|------|------|------|
| `CLAUDE_PLUGIN_ROOT or dirname(dirname(abspath(__file__)))` | 환경변수 우선, 없으면 __file__ 기반 계산 | ✓ |
| Shell 래퍼 `$(cd "$(dirname "$0")/.." && pwd)` | hooks.json command 필드에서 환경변수 계산 | — |
| hooks.json 상대경로만 | Codex PWD 보장 활용, Python 내부는 별도 처리 | ✓ (Codex 전용) |

**User's choice:** 권고안 수용 — Python 훅은 `PLUGIN_ROOT` 변수 방식, hooks.json은 상대경로.

**Notes:**
- Shell 래퍼 방식은 hooks.json `command` 필드에서 서브셸 확장이 보장되지 않아 탈락.
- Codex는 PWD=프로젝트 루트 보장 → `.codex/hooks.json`에서 `hooks/stop_hook.py` 상대경로 사용.
- Antigravity는 `$GEMINI_PROJECT_DIR` 환경변수 주입 → `.gemini/settings.json`에서 이 변수 사용.
- Python 훅 내부 상대경로(`.planning/config.json` 등)는 `PLUGIN_ROOT` 기준으로 교체.

---

## B. BeforeTool/PreToolUse 이벤트 이름 정규화

| 옵션 | 설명 | 선택 |
|------|------|------|
| 수신 이벤트 이름 그대로 응답 | `hook_event_name` 읽어 응답 `hookEventName` 동적 설정 | ✓ |
| "BeforeTool"로 통일 | Antigravity 기준으로 하드코딩 | — |
| "PreToolUse"로 유지 | Claude Code 기준 유지, Antigravity에서 검증 실패 위험 | — |

**User's choice:** 권고안 수용 — 수신 이벤트 이름 그대로 응답에 반영.

**Notes:**
- `tool_name` 필드는 두 플랫폼 동일 → 기존 bash/file 필터링 로직 변경 불필요.
- `hook_event_name` (snake_case, Antigravity) vs `hookEventName` (camelCase, Claude Code) 모두 시도하는 방어 코드 추가.
- `_evaluate()` 함수 내 block 응답의 `hookEventName` 하드코딩 1곳만 수정 (surgical).
- `hookSpecificOutput.permissionDecision: "deny"` verbose 형태는 이미 Antigravity와 호환 → 변경 불필요.

---

## C. .gemini/settings.json 스키마 불확실성 처리

| 옵션 | 설명 | 선택 |
|------|------|------|
| best-effort 구현 + 주석 + VERIFICATION.md | 알려진 정보로 구현, 불확실성은 문서화 | ✓ |
| 공식 문서 확정까지 구현 보류 | 안전하지만 Phase 15 deliverable 미달 | — |
| best-effort만, 문서화 생략 | 빠르지만 후임자에게 위험 전달 | — |

**User's choice:** 권고안 수용 — best-effort 구현 + 주석 + VERIFICATION.md.

**Notes:**
- Antigravity CLI는 2026-05-19 출시 4일째로 공식 docs 미완성. Gemini CLI 문서 기반으로 구현.
- 불확실 항목 4개: 설정 파일 경로(`.gemini/` vs `.antigravity/`), `hookEventName` 검증 여부, timeout 단위, `$GEMINI_PROJECT_DIR` 지속 여부.
- JSON 주석 불가 → `_schema_note` 키로 불확실성 명시. 키 거부 시 제거로 해결 가능.
- `.planning/phases/15-platform-hooks-python-fix/VERIFICATION.md` 신규 생성으로 human-verify 항목 추적.

---

## Claude's Discretion

- `_schema_note` 키 문자열 표현 (JSON 내 주석 대용)
- `PLUGIN_ROOT` 계산 코드의 정확한 삽입 위치 (import 블록 직후 vs 각 함수 내)
- VERIFICATION.md 섹션 구조

## Deferred Ideas

- `AfterAgent` → SubagentStop 대응 추가 — Out of Scope (REQUIREMENTS.md 명시)
- Antigravity 공식 문서 확정 후 재검증 — VERIFICATION.md follow-up 항목으로 기재
