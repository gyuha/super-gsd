# Phase 33: npx Installer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 33-npx-installer
**Areas discussed:** 패키지 구조, 설치 소스 전략, 파일 충돌 처리

---

## A. 패키지 구조

| Option | Description | Selected |
|--------|-------------|----------|
| `.claude-plugin/plugin.json` 재사용 | 기존 플러그인 메타데이터에 bin/files 필드 추가 | |
| `package.json` 신규 생성 | npm 전용 `package.json`을 리포지토리 루트에 신규 작성 | ✓ |

**User's choice:** 사용자가 "D - 전부 논의" 선택 → 모든 영역을 논의. 패키지 구조는 `package.json` 신규 생성으로 결정.

**Notes:**
- `.claude-plugin/plugin.json`은 Claude Code 플러그인 전용 메타데이터이므로 수정하지 않음
- `bin/setup.js` 단일 파일, CommonJS, `#!/usr/bin/env node` shebang
- `files` 배열: `["bin/", "hooks/", ".agents/", ".codex/", ".gemini/"]`
- `engines.node >= 18` — hooks/*.cjs와 동일 환경 요구사항
- 버전을 `.claude-plugin/plugin.json`과 동기화 (`0.0.39`), 배포 트리거에 `package.json` 업데이트 추가 필요

---

## B. 설치 소스 전략

| Option | Description | Selected |
|--------|-------------|----------|
| npm 배포 | npm registry에 publish, npx가 npm 캐시에서 파일 참조 | ✓ |
| GitHub 직접 | `npx github:gyuha/super-gsd` 방식으로 GitHub 소스 직접 사용 | |
| 번들 내장 | 파일을 base64/embedded string으로 bin/setup.js에 내장 | |

**User's choice:** npm 배포 방식 채택.

**Notes:**
- `__dirname` 기반 상대 경로로 소스 파일 접근 (`path.join(__dirname, '..', 'hooks')`)
- GitHub 직접 방식 거부: 브랜치 변경에 취약, 버전 고정 불가
- 번들 방식 거부: hooks/*.cjs가 독립 파일로 동작해야 하므로 내장 불가, 유지보수 비용 과다

---

## C. 파일 충돌 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 대화형 프롬프트 | readline으로 개별 파일마다 y/N 질문 | |
| --force 플래그 | 기본 스킵, `--force`로 덮어쓰기 | ✓ |
| 항상 덮어쓰기 | 경고 출력 후 무조건 덮어쓰기 | |

**User's choice:** `--force` 플래그 방식 채택.

**Notes:**
- 기본 동작: 이미 존재하면 ANSI yellow 경고 출력 후 스킵
- `--force`: 덮어쓰기 + ANSI green 메시지 출력
- readline 대화형 프롬프트 거부: npx 비대화형 파이프 환경 호환성 문제
- 설치 완료 후 summary 출력 (`Copied: N / Skipped: M`)

---

## Claude's Discretion

- `bin/setup.js` 파일 복사 로직 구현 세부사항 (`fs` 표준 모듈만 사용)
- 출력 색상 구현 방식 (chalk 라이브러리 대신 ANSI 코드 직접 삽입 — 외부 의존성 없음 원칙)
- `.agents/skills/` 재귀 복사 시 디렉토리 구조 유지 방법

## Deferred Ideas

- `npx @gyuha/super-gsd update` 자동 업데이트 명령 — Future Requirements (REQUIREMENTS.md)
- `--dry-run` 플래그 (복사 미리보기) — 명시된 요구사항 없음
- npm publish 자동화 배포 트리거 통합 — Phase 35 이후 검토
