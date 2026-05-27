---
quick_id: 260527-w6z
type: quick
subsystem: skills
tags: [sg-status, i18n, milestones, roadmap, conventions]
key_files:
  created: []
  modified:
    - skills/sg-status/SKILL.md
    - .agents/skills/sg-status/SKILL.md
    - CLAUDE.md
decisions:
  - "Table scope: 마일스톤 요약 전체 + 현재 마일스톤(STATE.md milestone:) phase만 진행 테이블로 렌더 (전체 30행 미출력)"
  - "L10n scope: 산문/표 헤더만 사용자 언어, 머신 토큰(명령명·enum·슬러그·날짜·타임스탬프·버전 ID)·5줄 블록 라벨은 영문 유지"
  - "D-29 '정확히 5줄' 락은 완화 — 마일스톤/단계 섹션이 앞에 오고 5줄 상태 블록은 맨 마지막에 바이트 보존"
  - "Read 도구 + Claude 해석으로 ROADMAP/STATE 파싱 (깨지기 쉬운 bash 파이프라인 회피, macOS 이식성 규약)"
commits:
  - "a0392db: plan + STATE.md (quick task 등록)"
  - "015fca8: Task 1 — 두 sg-status SKILL.md 마일스톤+단계 테이블 단계"
  - "c4ae830: Task 2 — CLAUDE.md 사용자 언어 메시지 컨벤션"
metrics:
  completed: "2026-05-27"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260527-w6z Summary

sg-status가 워크플로우 5줄 상태에 더해, **먼저** 마일스톤 요약과 현재 마일스톤(v2.7) 단계 진행 테이블을 출력하도록 변경했다. 산문/표 헤더는 사용자 언어로, 5줄 상태 블록과 머신 토큰은 영문 그대로 유지한다. 동시에 CLAUDE.md에 "skill 스크립트의 사용자 노출 메시지는 사용자 언어로 표면화한다" 컨벤션을 명문화했다.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | 두 sg-status SKILL.md에 마일스톤+현재 마일스톤 단계 테이블 Step 6 추가, 기존 출력 Step 7로 재번호, D-29 락 완화 | 015fca8 | skills/sg-status/SKILL.md, .agents/skills/sg-status/SKILL.md |
| 2 | CLAUDE.md Conventions에 `### 사용자 언어 메시지` 규약 추가 | c4ae830 | CLAUDE.md |

## Deviations from Plan

### Auto-fixed Issues

**1. Task 1 verify gate `<language>` 카운트 == 1 실패**
- **발견 시점:** Task 1 편집 직후 verify 실행
- **원인:** 신규 Step 6 산문에 `` `<language>` block `` 이라는 리터럴 토큰을 넣어 `grep -c '<language>'`가 2를 반환 (여는 태그 1 + 산문 1)
- **수정:** 두 파일의 산문을 "per this skill's language-detection directive"로 변경해 리터럴 `<language>` 토큰 중복 제거. 게이트의 본래 의도(블록 1회 보존) 충족
- **재실행:** PASS

## Verification

- 두 SKILL.md: ROADMAP.md 참조, `milestone:` 참조, Milestones/마일스톤 헤딩, `<language>` 블록 1회 보존, Step 7 재번호 모두 확인
- 5줄 상태 블록 라벨(`Phase:`/`Stage:`/`Last handoff:`/`Next:`) 영문 보존 확인
- CLAUDE.md conventions 마커 사이에 `### 사용자 언어 메시지` 존재 확인
- 두 task verify 게이트 모두 PASS

## Known Stubs

None.

## Threat Flags

None — Markdown 지시 문서(SKILL.md + CLAUDE.md) 편집만, 런타임 코드·네트워크·인증·스키마 변경 없음.

## Notes

- 버전 범프는 범위에서 제외(지시대로).
- `.agents/` 미러는 자체 enum 매핑(`execute`/`review`/`hookify` display, `hookify` 라우팅)과 플랫폼 도구 어휘를 보존한 채 로직만 미러링.
- 세션 시작 시점부터 존재하던 pre-existing dirty 트리(삭제된 phase 파일, REVIEW.md 등)는 이 작업 범위가 아니므로 건드리지 않음.
