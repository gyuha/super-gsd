# Phase 11: 자체 rule runner - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 11-rule-runner
**Areas discussed:** Rule Runner 구현 방식 (A), Rule 파일 글로브 경로 (B), hooks.json 등록 방식 (C), hookify 충돌 회피 (D)

---

## A. Rule Runner 구현 방식

| Option | Description | Selected |
|--------|-------------|----------|
| hookify 코드 재활용 | hookify의 rule parsing 코드를 import/fork해서 사용 | |
| 독립 Python 구현 | super-gsd 내부에 Python으로 독립 구현, hookify dependency 없음 | ✓ |

**User's choice:** 독립 구현 — hookify가 설치된 환경에서도 super-gsd가 독립적으로 동작해야 함
**Notes:** hookify dependency 없음. `hooks/rule_runner.py` 단일 파일.

---

## B. Rule 파일 글로브 경로

| Option | Description | Selected |
|--------|-------------|----------|
| sg-rule 전용 | `.claude/sg-rule.*.local.md`만 스캔, 기존 hookify rule 마이그레이션 필요 | |
| hookify 경로만 | `.claude/hookify.*.local.md`만 스캔, 신규 네임스페이스 없음 | |
| 양쪽 모두 지원 | 두 글로브 경로 모두 스캔, 기존 23개 파일 마이그레이션 없이 동작 | ✓ |

**User's choice:** 양쪽 지원 — 기존 23개 rule 파일이 마이그레이션 없이 동작해야 함
**Notes:** sg-rule이 hookify 동명 rule보다 우선순위를 가짐 (동일 name 충돌 시).

---

## C. hooks.json 등록 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 별도 hooks 파일 | 신규 `hooks/pretooluse-hooks.json` 분리 | |
| 기존 hooks.json에 추가 | 기존 `hooks/hooks.json`에 PreToolUse 항목 추가 | ✓ |
| UserPromptSubmit도 포함 | PreToolUse + UserPromptSubmit 동시 등록 | |

**User's choice:** 기존 hooks.json에 PreToolUse 추가
**Notes:** UserPromptSubmit은 이번 Phase 범위 밖 — 명시적 제외.

---

## D. hookify 충돌 회피

| Option | Description | Selected |
|--------|-------------|----------|
| 항상 실행 | hookify 설치 여부 무관하게 rule_runner 항상 실행 (중복 실행 가능) | |
| hookify 설치 감지 시 skip | hookify 설치 시 rule_runner exit 0, 미설치 시에만 활성화 | ✓ |
| 사용자 config 플래그 | config.json에 `rule_runner.enabled` 플래그로 수동 제어 | |

**User's choice:** hookify 감지 시 skip
**Notes:** hookify가 설치된 환경에서 이중 rule 실행 및 메시지 중복 방지. 감지 실패 시 안전하게 skip.

---

## Claude's Discretion

- hookify 설치 감지의 구체적 경로 (`~/.claude/plugins/hookify/` 등) — 플래너가 실제 hookify 설치 구조 확인 후 결정
- PreToolUse hook stdout JSON 응답 포맷 — Claude Code 공식 스펙 확인 후 결정
- rule 파일 내 conditions 배열 vs. shorthand pattern 두 포맷 파싱 구현 방식

## Deferred Ideas

- UserPromptSubmit hook 등록 — 이번 phase 범위 밖, 향후 검토
- sg-rule 파일 자동 생성 (analyzer draft → 파일 생성) — Phase 10은 텍스트 제안까지, 실제 생성은 별도
- 글로벌 rule 경로(`~/.claude/sg-rule.*.md`) — v1.3 이후 검토
- rule 우선순위/충돌 해소 복잡 정책 — 이번 phase는 "모두 실행, block 우선" 단순 정책
