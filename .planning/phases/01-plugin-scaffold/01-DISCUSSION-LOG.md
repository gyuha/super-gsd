# Phase 1: Plugin Scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 1-Plugin Scaffold
**Areas discussed:** Plugin directory layout, Marketplace 설치 경로, Phase 1 stub 표면, README 내용·언어

---

## Plugin directory layout

### Q1 — Repo 역할

| Option | Description | Selected |
|--------|-------------|----------|
| Single plugin (repo 자체가 플러그인) | Root에 `.claude-plugin/plugin.json` 하나. commands/hooks/skills도 root. | ✓ |
| Self-hosted marketplace | Root에 marketplace.json + plugin.json. 자매 플러그인 추가 가능. | |
| Subdir plugin | 실제 플러그인 아티팩트를 `super-gsd/` 서브디렉토리에. | |

**User's choice:** Single plugin

### Q2 — Subdir 범위

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 1은 root 명세만 | `.claude-plugin/plugin.json` + `README.md`만. subdir는 해당 Phase에. | ✓ |
| 현 milestone(v1)에 쓸 subdir 미리 | `commands/.gitkeep`, `hooks/.gitkeep` Phase 1에 추가. | |

**User's choice:** Phase 1은 root 명세만

### Q3 — 식별자

| Option | Description | Selected |
|--------|-------------|----------|
| name: `super-gsd`, version: `0.0.1` | Pre-release scaffold, Phase마다 patch bump. | ✓ |
| name: `super-gsd`, version: `0.1.0` | unstable but usable. | |
| name: `super-gsd`, version: `0.0.1-pre` | Pre-release 태그 명시. | |

**User's choice:** `super-gsd` / `0.0.1`

### Q4 — 매니페스트 필드

| Option | Description | Selected |
|--------|-------------|----------|
| 표준 세트 (description+author+repository+license+keywords) | Marketplace 품질에 충분. | ✓ |
| 최소한 (name+version+description) | 가장 가벼움. author/license는 Phase 2 이후. | |
| 표준 + homepage/bugs URL | OSS 완전 표준. | |

**User's choice:** 표준 세트

### Q5 — 산출물

| Option | Description | Selected |
|--------|-------------|----------|
| 최소 세트 (plugin.json + README + LICENSE) | success criteria 1~4 모두 만족. | |
| 최소 + CHANGELOG.md | 0.0.1부터 변경 이력 누적. | |
| 최소 + .gitignore + CHANGELOG.md | 프로젝트 위생 완전 세트. | ✓ |

**User's choice:** 최소 + `.gitignore` + `CHANGELOG.md`

### Q6 — Inert 검증

| Option | Description | Selected |
|--------|-------------|----------|
| README 수동 체크리스트 | Phase 1 inert이므로 수동 체크 충분. | ✓ |
| 검증 불필요 (inert이므로) | 가장 빠르지만 success criterion 4를 '증명'하지 않음. | |
| VERIFICATION.md 별도 | GSD `/gsd:verify-work`와 결합. | |

**User's choice:** README 체크리스트

---

## Marketplace 설치 경로

### Q1 — 설치 경로

| Option | Description | Selected |
|--------|-------------|----------|
| 이 repo에 marketplace.json도 함께 두기 | Self-hosted. 외부 aggregator 의존 없음. | ✓ |
| 별도 marketplace repo | 두 repo로 분리. install 경로 복잡. | |
| Git URL 직접 설치 문서화만 | marketplace.json 없이 README 안내. | |

**User's choice:** Self-hosted marketplace (이 repo에 marketplace.json 동봉)
**Notes:** Layout 영역의 "Single plugin" 결정은 repo identity에 관한 것이며 marketplace.json 동봉을 금지하지 않음 — 두 선택은 양립 가능.

### Q2 — MP 형태

| Option | Description | Selected |
|--------|-------------|----------|
| name: `super-gsd`, source: `.` | 마켓플레이스와 플러그인 이름 동일. | ✓ |
| name: `super-gsd-mp`, source: `.` | 마켓플레이스/플러그인 이름 분리. | |
| source: 명시적 git URL | 특정 git 호스팅에 결합. | |

**User's choice:** name: `super-gsd`, source: `.`

### Q3 — Owner 메타

| Option | Description | Selected |
|--------|-------------|----------|
| git config user.name/email 사용 | author/owner 일관 적용. | |
| GitHub username만 (이메일 제외) | OSS privacy 고려. | ✓ |
| owner 필드 생략 | schema optional 시. | |

**User's choice:** GitHub username만 (`gyuha`)

### Q4 — 설치 명령 시퀀스

| Option | Description | Selected |
|--------|-------------|----------|
| 2단계: marketplace add → install | 최소 마찰. | ✓ |
| 3단계: + verify checklist 실행 | 사용자를 검증까지 이끔. | |
| Git URL/owner shortcut 둘 다 제공 | 모든 케이스 커버. | |

**User's choice:** 2단계 명시

---

## Phase 1 stub 표면

### Q1 — Discoverable surface 수준

| Option | Description | Selected |
|--------|-------------|----------|
| plugin.json + README만 | commands/는 Phase 2. | ✓ |
| stub 명령 1개 (`/super-gsd:about`) | commands/ Phase 1에 생성. | |
| v1 명령 전체 stub | Phase 2/3과 산출물 겹침. | |

**User's choice:** plugin.json + README만

### Q2 — README의 미래 표면 표시

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap 섹션에 Phase별 예정 명령 나열 | 사용자에게 "올 예정" 명확. | ✓ |
| "지금은 inert" 한 줄만 | 가장 짧지만 가시성 낮음. | |
| ROADMAP.md 파일로 링크만 | 설치 후 .planning/ 미노출 위험. | |

**User's choice:** Roadmap 섹션에 Phase별 나열

---

## README 내용·언어

### Q1 — 주 언어

| Option | Description | Selected |
|--------|-------------|----------|
| 한국어 주, 영문 Quick Start | PROJECT.md 톤 일치. | |
| 한국어 전용 | 최소 비용. discoverability 약함. | |
| 영문 주, 국문 요약 | OSS 표준. | ✓ |

**User's choice:** 영문 주, 국문 요약
**Notes:** PROJECT.md/REQUIREMENTS.md는 한국어 유지 — README만 영문화.

### Q2 — 다이어그램

| Option | Description | Selected |
|--------|-------------|----------|
| Mermaid flowchart | GitHub native 렌더링. | |
| ASCII art | 가장 포터블. | ✓ |
| PNG/SVG 이미지 | 가장 구체적, 호스팅 부담. | |
| 다이어그램 없이 글로만 | 시각 자산 0. | |

**User's choice:** ASCII art

### Q3 — 섹션 설계

| Option | Description | Selected |
|--------|-------------|----------|
| 9개 섹션 표준 구성 | Title→ASCII→What→Prereq→Install→Verify→Roadmap→한국어→License | ✓ |
| 6개 섹션 압축 | 한국어 요약 제거 + 일부 통합. | |
| 12개 섹션 상세 | FAQ/Contributing 등 포함. | |

**User's choice:** 9개 섹션 표준 구성

### Q4 — Verify install 체크 항목

| Option | Description | Selected |
|--------|-------------|----------|
| 4개 체크 (plugin list / gsd / superpowers Skill / hookify) | success criterion 4 구체화. | ✓ |
| 2개 체크 (최소) | 증거 약함. | |
| 5개 체크 (+ 버전 교차) | 과결볼 가능성. | |

**User's choice:** 4개 체크

---

## Claude's Discretion

- plugin.json JSON 키 순서·들여쓰기 스타일
- ASCII 다이어그램의 시각적 디테일 (박스/화살표 모양)
- README 영문 톤 (공식 OSS vs 친근한)
- LICENSE 본문 (MIT 표준)
- `.gitignore` 항목 선택 (macOS/IDE 노이즈 정도)

## Deferred Ideas

- 명령 stub 사전 노출 (`/super-gsd:about` 등) — Phase 2에서 본 명령과 함께
- Mermaid 다이어그램 / PNG 이미지 자산 — Phase 4 이후 가시성 강화 시
- CONTRIBUTING.md / FAQ.md — v1 완성 후
- 자동화된 inert 검증 스크립트 — v2에서 CI로
- GitHub Actions / CI — v1 완성 후 별도 phase
- 이메일을 author/owner에 포함 — 향후 필요 시 재고
