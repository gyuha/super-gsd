# Phase 10: 내장 conversation analyzer + 추가 lens - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 10-conversation-analyzer-lens
**Areas discussed:** Analyzer 위치와 활성화 방식, Transcript 읽기 방식, Sailboat lens, Five Whys lens, Multi-lens 선택 + argument 경로

---

## Analyzer 위치와 활성화 방식

| Option | Description | Selected |
|--------|-------------|----------|
| sg-retro SKILL.md 내부 통합 | 별도 파일 없음, Phase 6 D-04 bash-only 원칙 유지 | ✓ |
| 별도 SKILL.md (sg-analyzer) | 독립 Skill로 분리, sg-retro에서 호출 | |
| Python helper | 별도 스크립트 파일로 분석 로직 분리 | |

**User's choice:** sg-retro SKILL.md 내부 통합. `analyze` lens 코드로 명시 호출 가능 + 어떤 lens 후든 hookify rule draft auto-suggest.
**Notes:** analyzer가 독립 Skill이 되면 Phase 6 D-04 위반 + 설치 복잡성 증가. SKILL.md bash + Claude-native 분석이 적합.

---

## Transcript 읽기 방식

| Option | Description | Selected |
|--------|-------------|----------|
| Claude-native Read 도구 | Claude LLM이 JSONL 파일을 Read 도구로 직접 읽고 분석 | ✓ |
| bash grep/awk 파싱 | bash 정규식으로 메시지 추출 | |
| hookify conversation-analyzer 호출 | 기존 hookify agent에 위임 | |

**User's choice:** Claude-native Read 도구. project-slug 경로 계산 → 최신 `.jsonl` 파일 → Claude가 LLM으로 분석.
**Notes:** bash regex는 JSONL 구조 파싱에 취약하고 LLM이 실행 중이므로 Claude-native가 자연스러운 선택. hookify 의존 제거가 Phase 10 핵심 목표이므로 hookify agent 호출은 명시적으로 배제.

---

## Sailboat lens

| Option | Description | Selected |
|--------|-------------|----------|
| Wind / Anchor / Sun / Rock (4 subheadings) | 추진력 / 방해 / 밝은 순간 / 위험·장애물 | ✓ |
| Wind / Anchor / Rocks / Sun (4 subheadings) | 순서 변형 | |
| Island / Wind / Anchor / Sun / Rocks (5 subheadings) | 목표 추가 버전 | |

**User's choice:** `### Wind` / `### Anchor` / `### Sun` / `### Rock`. lens code: `sail`.
**Notes:** 4개 subheading이 간결하고 artifact-grounded draft와 잘 맞음. Island(목표) 추가는 Five Whys가 목표/문제를 다루므로 중복.

---

## Five Whys lens

| Option | Description | Selected |
|--------|-------------|----------|
| 사용자 주도 대화형 (problem input → 5 why 순차 질문) | Claude가 iterative "Why?" 질문, 사용자 답변 | ✓ |
| Claude가 artifact 기반 체인 자동 생성 | git/CONTEXT artifacts에서 문제 추출 후 자동 5why 생성 | |
| 하이브리드 (artifact 추천 + 사용자 수정) | | |

**User's choice:** 사용자 주도 대화형. problem statement 사용자 입력 → 5번 iterative why 질문 → root cause.
**Notes:** Five Whys의 핵심 가치는 사용자의 도메인 지식 + 솔직한 답변에 있음. Claude가 자동 생성하면 표면적 분석에 그칠 가능성 높음.

---

## Multi-lens 선택 + argument 경로

| Option | Description | Selected |
|--------|-------------|----------|
| multiSelect: true + 기존 single-lens args 유지 | AskUserQuestion을 multiSelect로 변경, 단일 코드 인수는 직접 실행 | ✓ |
| multiSelect만 (args 경로 제거) | 항상 AskUserQuestion | |
| args 배열 경로만 (AskUserQuestion 제거) | `args="10 4ls dspm"` 형태로만 | |

**User's choice:** multiSelect: true로 변경 + single-lens args 경로 유지 + multi-lens args 경로(`args="10 4ls dspm"`) 추가 지원.
**Notes:** 기존 `args="9 4ls"` 사용 패턴을 깨지 않는 것이 중요. multiSelect는 대화형 사용성을 위해. No (Recommended) chip, no default selection 명시 요건.

---

## Claude's Discretion

- `analyze` lens AskUserQuestion `question` 텍스트
- Five Whys에서 사용자가 막힐 때 artifact 기반 힌트 제공 여부와 방식
- Sailboat artifact 연결 방식 (Wind/Sun ↔ SUMMARY 긍정, Anchor/Rock ↔ Known Risk Sites)
- `analyze` + 다른 lens 동시 선택 시 실행 순서 (analyze는 마지막 권장)
- multi-lens 개별 lens 사이 transition 방식 (brief separator 출력 + 자동 진행)

## Deferred Ideas

- 자체 rule runner (`.claude/sg-rule.*.local.md` 자동 생성 + PreToolUse hook 실행) — Phase 11
- lessons YAML frontmatter — Phase 12
- weighted top-N RECURRENCE 가드 — Phase 12
- sg-learn → sg-retro 라우팅 전환 — Phase 13
- analyzer auto-run at session end — v1.3
- Five Whys 문제 자동 추출 (DSPM Mistakes 섹션 연동) — Phase 12
