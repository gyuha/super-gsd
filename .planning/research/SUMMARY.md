# Research Summary — v1.1 Reliability

**프로젝트:** super-gsd v1.1  
**리서치 일자:** 2026-05-16  
**신뢰도:** HIGH

---

## Stack 추가사항

기존 스택(Python 3 stdlib, Markdown 기반 skill 파일, Bash 인라인)으로 충분. 추가 패키지 없음.

| 추가 항목 | 용도 | 이유 |
|----------|------|------|
| `re` stdlib 하드닝 | STATE.md Phase 파싱 정확도 | `r'^Phase:\s*(\S+)'`이 `Phase: Not started`에서 `Not`만 추출하는 버그 |
| `parse_handoff.py` 헬퍼 | HANDOFF.md 파싱 중앙화 | sg-status와 sg-start에서 동일 awk 로직 중복 → Python 함수로 단일화 |

추가하지 말아야 할 것: PyYAML, SQLite, 새 hook 타입, pathlib, `session.json`.

---

## 기능 우선순위

### Table Stakes (v1.1 필수)

- **STATUS-01:** HANDOFF.md 마지막 데이터 행으로 stage 판정 / 파일 없으면 `init` 기본값 / D-29 포맷 엄격 준수
- **SESS-01:** sg-start 호출 시 기존 세션 감지 → milestone + stage + 마지막 시각 표시 → 재개 여부 질의 / 재개 경로에서 gsd-new-project 건너뜀
- **HEALTH-01:** GSD/Superpowers/Hookify 설치 확인 + hooks.json 등록 + HANDOFF.md 스키마 검증 / `[OK]`/`[WARN]`/`[FAIL]` 라인별 출력 / FAIL 시 exit code 1 / 읽기 전용

### Differentiators (v1.1 포함 권장)

- stale 세션 경고 (7일 초과 시) — SESS-01
- 상대 시각 표시 ("6일 전") — SESS-01
- 설치 체크 시 복수 경로 탐색 + 탐색 경로 표시 — HEALTH-01

### v2+ 연기

- `--json` 플래그, sg-repair, sg-learn → HANDOFF.md hookify 행 자동 추가

---

## 빌드 순서

```
Phase 1: sg-health.md 신규 생성 (독립, 기존 파일 무변경)
    + transcript_matcher.py 'hookify' 패턴 수정 (sg-health 배포와 묶어야 함)
         ↓
Phase 2: sg-status.md 갭 수정 (HANDOFF.md 파싱 + STATE.md Phase 파싱 정확도)
         ↓
Phase 3: sg-start.md 세션 복원 분기 추가 (Phase 2 파싱 패턴 재사용)
```

**Phase 1 이유:** sg-health는 독립적, 기존 파일 건드리지 않음. transcript_matcher.py 패치는 sg-health와 같은 Phase여야 한다 — sg-health 배포 직후 첫 실행에서 오발동 발생하기 때문.

**Phase 2 이유:** sg-start 복원이 Stage 파싱 로직을 sg-status와 공유함. sg-status 파싱 검증 전에 sg-start 구현하면 버그가 복사된다.

---

## 주요 함정 및 예방

| 우선순위 | 함정 | 예방 | 해당 Phase |
|---------|------|------|----------|
| HIGH | transcript_matcher.py bare `'hookify'`가 sg-health 출력에 오발동 | `'hookify'` → `'Retrospective complete'`로 교체 | Phase 1 |
| HIGH | STATE.md `Phase: Not started` 파싱 시 `Not` 반환 | frontmatter YAML `---` 구분자로 별도 파싱 | Phase 2 |
| HIGH | HANDOFF.md에 hookify 완료 행 없어 SESS-01이 잘못된 다음 명령 권장 | 복원 로직에서 lessons 디렉토리 교차 검증 (sg-learn 수정은 v2) | Phase 3 |
| HIGH | sg-health 비표준 경로에서 false positive | 복수 경로 탐색, FAIL 아닌 WARN 처리 | Phase 1 |
| MEDIUM | 서브디렉토리에서 `.planning/` 상대 경로 실패 | cwd에서 상위로 walk하며 `.planning/` 탐색 | Phase 2–3 |

---

## 핵심 통찰 (3개)

**1. 의존성 순서가 빌드 순서다 — STATUS-01 먼저, SESS-01 나중.**  
sg-start 복원은 HANDOFF.md 파싱 로직을 sg-status와 공유한다. sg-status 파싱 검증 전에 sg-start 구현하면 버그를 복사한다. 로드맵은 이 순서를 강제해야 한다.

**2. transcript_matcher.py 패치는 sg-health와 같은 Phase에 묶어야 한다.**  
sg-health 배포 직후 첫 실행에서 오발동 발생. 두 작업을 분리하면 사용자에게 broken 상태를 배포하게 된다.

**3. sg-health는 완전 read-only여야 한다 — 완료 기준에 명시할 것.**  
진단 도구가 상태를 변경하면 스페큘레이티브 실행 시 부작용이 생긴다. Phase 완료 기준에 "어떤 파일도 생성/수정하지 않음"을 포함해야 한다.
