# super-gsd
![ICON](./images/super-gsd-icon.png)

GSD → Superpowers → sg-retro를 자동으로 연결하여 계획, 구현, 회고가 하나의 학습 루프로 이어지는 Claude Code 플러그인.

## 이 플러그인이 하는 일

`super-gsd`는 GSD, Superpowers, 내장 `sg-retro` 스킬이 서로 대화하도록 연결하는 역할만 한다. 전략은 GSD가, 구현은 Superpowers가, 회고는 `sg-retro`가 담당한다. 각 단계가 끝나면 `super-gsd`가 컨텍스트와 함께 다음 단계로 자동 인계한다. 사용자는 다음에 어떤 명령을 실행해야 하는지 기억할 필요가 없고, 한 사이클에서 배운 교훈이 다음 계획에 자동으로 반영된다.

이 플러그인이 해결하는 문제는 도구 간 수동 전환의 취약성이다. 리뷰를 잊거나, 회고를 건너뛰거나, 세션 간 컨텍스트를 잃거나, 진행 중인 작업을 덮어쓰는 계획 명령을 다시 실행하는 실수가 반복된다. 역할을 분리하고 경계면을 자동화함으로써 동일한 실수가 반복되지 않는다.

새 마일스톤 시작부터 완료 및 다음 마일스톤 시작까지 전체 GSD → Superpowers → sg-retro 사이클을 커버하는 22개 슬래시 명령이 제공된다. `sg-next`를 언제든 실행하면 현재 단계를 자동 감지하여 다음 명령을 기억할 필요 없이 바로 실행한다. 명령 빠른 참조는 **명령어** 섹션을, 전체 명령 레퍼런스는 `docs/COMMANDS.md`를 참고한다.

## 워크플로우

```
[ 수동 진입 ]                          [ sg-plan 완료 후 sg-next 자동 체인 ]

sg-new/sg-start → sg-explore → sg-plan → sg-execute → sg-tdd (tdd_mode=true) → sg-review → sg-learn → sg-ship → sg-complete
                                  ↑                                                          |                      ↓
                                  └──── 교훈 자동 주입 ←───────────────────────────────────┘               → sg-new
                                  (다음 sg-plan이 .planning/lessons/ 읽음)        (다음 마일스톤)
```

`sg-next`는 HANDOFF.md/STATE.md를 읽어 현재 단계를 감지하고 체인의 다음 명령을 자동 실행한다 (`gsd-plan → sg-execute`, `parallel/execute → sg-tdd (tdd_mode=true) → sg-review`, `review → sg-learn`, `sg-retro → sg-ship`, `ship → sg-plan {다음 phase}` 또는 `sg-complete`, `complete → sg-new` via AskUserQuestion). 진입 명령(`sg-start`, `sg-explore`, 첫 `sg-plan`)은 자동 체인 시작 전 **수동**으로 호출한다.

`sg-status`는 언제든 현재 위치를 확인하는 데 사용할 수 있다. `sg-quick`은 메인 플로우 외 일회성 작업을 처리한다.

## 명령어

모든 `/super-gsd:sg-*` 슬래시 명령 빠른 참조.

| 명령어 | 하는 일 | 사용 시점 |
|--------|---------|-----------|
| `/super-gsd:sg-start` | STATE.md로 기존 세션을 감지해 Resume / Start new milestone / Cancel을 제시 — 세션이 없으면 `gsd-new-project`로 폴백. 또한 `.planning/`을 `.gitignore`에 멱등 추가 | 프로젝트 시작 시, 또는 기존 세션을 재개할 때 |
| `/super-gsd:sg-explore` | `gsd-explore`를 통해 코드베이스 분석. 또한 `.planning/`을 `.gitignore`에 멱등 추가 | `sg-start` 이후, 계획 전 |
| `/super-gsd:sg-plan` | 단계 컨텍스트를 수집하고 실행 계획 생성 (`gsd-discuss-phase` → `gsd-plan-phase` 2단계 체인) | `sg-explore` 이후, 계획할 준비가 됐을 때 |
| `/super-gsd:sg-ui-plan` | UI 설계 전용 brainstorming — `superpowers:brainstorming`을 직접 실행 | `sg-plan`에서 Visual Companion 없이 진행했지만 UI 설계가 필요할 때 |
| `/super-gsd:sg-execute` | 현재 단계 계획을 패키징하여 Superpowers에 인계 (`superpowers:executing-plans`) | `sg-plan` 완료 후 |
| `/super-gsd:sg-tdd` | `superpowers:test-driven-development`를 통해 red-green-refactor TDD 검증 게이트 실행 — `.planning/config.json`의 `super_gsd.tdd_mode: true`일 때만 활성화 | `tdd_mode`가 활성화된 상태에서 `sg-execute` 완료 후 |
| `/super-gsd:sg-review` | `superpowers:requesting-code-review`를 통해 코드 리뷰 요청 | 구현 완료 후 |
| `/super-gsd:sg-learn` | `sg-retro`를 통한 구조화된 회고 실행 — 스마트 기본값으로 세 가지 렌즈 중 두 개(ssc, dspm)를 질문 없이 실행; lens를 직접 고르려면 `--pick` 사용 (Claude Code 전용 — Codex/Gemini CLI에서는 `--pick`가 에러로 종료되므로 `$sg-retro <phase> ssc dspm analyze`처럼 위치 인자로 선택) | 리뷰 완료 후 |
| `/super-gsd:sg-lessons` | `.planning/lessons/`에서 이전 교훈 목록 표시 (옵션: 단계 필터) | `sg-plan` 전 학습 내용 검토 시 |
| `/super-gsd:sg-ship` | `gsd-ship`을 통해 현재 단계 병합 및 배포 | 학습 캡처 후 |
| `/super-gsd:sg-complete` | `<N>`은 단계 완료(`sg-phase` 경유), `<vX.Y>`는 해당 마일스톤 종료, 비우면 현재 마일스톤 종료(`gsd-complete-milestone` 경유) | 모든 단계가 배포된 후, 또는 단일 단계를 완료 처리할 때 |
| `/super-gsd:sg-new` | `gsd-new-milestone`을 통해 새 마일스톤 시작 | `sg-complete` 이후, 다음 마일스톤을 시작할 때 |
| `/super-gsd:sg-next` | HANDOFF.md와 STATE.md에서 현재 워크플로우 단계를 감지하여 다음 sg-* 명령을 즉시 실행 — 확인 없음 | 다음 단계로 자동 진행하고 싶을 때 |
| `/super-gsd:sg-status` | 현재 단계, 마지막 인계 시각, 다음 권장 명령 표시 | 언제든 현재 위치 확인 시 |
| `/super-gsd:sg-update` | GSD, superpowers, super-gsd 설치 여부 확인 후 설치 또는 업데이트 | 모든 워크플로우 도구를 설치/업데이트할 때 |
| `/super-gsd:sg-quick` | GSD 보장이 있는 소규모 애드혹 작업 실행 (계획 + 실행 + 커밋) | 메인 단계 워크플로우 외 일회성 작업 |
| `/super-gsd:sg-health` | 설치 자기진단: GSD/Superpowers 존재 여부, 훅 등록, HANDOFF.md 스키마 확인 | 문제가 발생했거나 새 설치 후 |
| `/super-gsd:sg-cleanup` | `gsd-cleanup`을 통해 완료된 마일스톤의 phase 디렉토리를 아카이브하고 요약 테이블 출력 | 마일스톤 완료 후 `.planning/phases/` 정리가 필요할 때 |
| `/super-gsd:sg-parallel-execute` | 독립 플랜 그룹을 병렬 실행 — phase 번호 또는 파일 경로 전달 가능; `parallel_groups.json`이 없으면 PLAN.md `wave:` 필드로 자동 생성; wave 단위로 순차 처리 | 독립 플랜 그룹이 여러 개일 때 `sg-execute` 대신 사용 |
| `/super-gsd:sg-phase` | 기존 phase를 편집·제거·완료 처리 — `edit`/`remove`는 `gsd-phase`에 위임, `complete`는 ROADMAP Progress 행·Phases 체크박스·STATE.md를 정합화 | phase 범위 수정, 계획된 phase 취소, 완료 처리 시 |
| `/super-gsd:sg-retro` | 세 가지 렌즈(ssc, dspm, analyze)로 독립 회고 실행 — lens 인자를 생략하면 스마트 기본값으로 dspm+ssc 자동 적용; lens를 직접 고르려면 `--pick` 사용 (Claude Code 전용 — Codex/Gemini CLI에서는 `$sg-retro <phase> ssc dspm analyze`처럼 위치 인자로 선택). 결과는 `.planning/lessons/`에 저장 | 작업 세션 후 교훈을 캡처할 때; `sg-learn`이 자동으로 호출하기도 함 |
| `/super-gsd:sg-setup` | 현재 프로젝트에 super-gsd hook/skill 파일을 복사 — Claude Code in-session 설치 도구 | 기존 프로젝트에 super-gsd를 수동으로 설치할 때 |

전체 명령 레퍼런스(인수 및 상세 설명 포함)는 [docs/COMMANDS.md](./docs/COMMANDS.md)를 참고한다.

## Phase 관리 (추가 / 삽입 / 제거 / 편집)

GSD의 `/gsd:phase` 명령은 네 가지 phase CRUD 모드(추가 / 삽입 / 제거 / 편집)를 플래그로 라우팅한다. `super-gsd`는 여기에 `/super-gsd:sg-phase`를 추가로 제공한다 — **edit**·**remove** 모드는 `gsd-phase`에 위임하고, `gsd-phase`에 없는 **complete** 동작을 더한다(완료된 phase의 ROADMAP Progress 행·Phases 체크박스·STATE.md를 정합화). 추가(add)·삽입(insert)은 `gsd-phase`로 직접 사용한다.

| 플래그 | 동작 | 사용 시점 |
|--------|------|-----------|
| (없음) | 현재 milestone 끝에 새 정수 phase 추가 | 다음 계획된 phase를 정상 추가할 때 |
| `--insert <N> <설명>` | Phase N 뒤에 십진 phase(예: `7.1`) 삽입 — 기존 정수 phase 번호는 변하지 않음 | milestone 진행 중 발견된 긴급 작업이 다음 milestone까지 미룰 수 없을 때 |
| `--remove <N>` | 미래 phase(미착수)를 제거하고 이후 phase 번호를 재정렬 | 작업이 시작되기 전 계획된 phase를 취소할 때 |
| `--edit <N>` | 기존 phase의 필드(Goal / Requirements / Plans 등)를 in-place 수정 | scope나 메타데이터를 renumbering 없이 정정할 때 |

### `/super-gsd:sg-phase` 서브커맨드

| 서브커맨드 | 동작 | 위임 대상 |
|------------|------|-----------|
| `sg-phase edit <N> [changes]` | 기존 phase 필드 편집 | `gsd-phase --edit` |
| `sg-phase remove <N>` | 미래 phase 제거 + 이후 번호 재정렬 | `gsd-phase --remove` |
| `sg-phase complete [N]` | 완료된 phase 마감 — ROADMAP Progress 행을 `Complete`+오늘 날짜로, Phases 체크박스를 `[x]`로 flip, STATE.md 동기화 (`N` 생략 시 현재 phase) | (인라인 — `gsd-phase`에 complete 모드 없음) |

**milestone 진행 중 phase 끼워넣기:**

```shell
/gsd:phase --insert 7 critical auth bypass fix
# → ROADMAP.md에 Phase 7.1 (INSERTED) 마커와 함께 항목 추가
# → .planning/phases/7.1-critical-auth-bypass-fix/ 디렉터리 생성
# → STATE.md의 다음 단계 포인터가 7.1로 이동
```

같은 기준 phase 뒤에 또 삽입하면 `7.2`, `7.3`... 순으로 자동 부여된다. 정수 phase 번호가 보존되므로 기존 의존성과 참조가 그대로 유지된다. 삽입 후에는 일반 phase와 동일하게 `sg-plan` → `sg-execute` → `sg-review` → `sg-learn` → `sg-ship` 체인으로 진행한다.

**Anti-patterns (GSD가 거부함):**

- milestone 끝에 계획된 작업을 추가할 때는 `--insert` 대신 플래그 없는 형태를 사용한다.
- Phase 1 앞에 삽입(`Phase 0.1`)은 허용되지 않는다.
- 기존 정수 phase 번호를 재정렬하지 않는다 — 십진 방식이 존재하는 이유가 정확히 이것이다.

## 사용 예시

### End-to-End 워크플로우

기존 프로젝트에 새 기능 마일스톤을 추가하는 전형적인 흐름 (예: `my-saas-app`에 결제 모듈 추가):

```shell
# 1. 새 마일스톤 시작 — "결제 모듈"을 위한 .planning/ 컨텍스트 스캐폴딩
#    (`.planning/STATE.md`가 없는 신규 프로젝트는 `sg-start`,
#     기존 super-gsd 프로젝트에 새 마일스톤 추가는 `sg-new`를 사용)
/super-gsd:sg-new add payment module

# 2. 코드베이스 탐색 — 계획이 현실에 기반하도록 기존 코드 분석
/super-gsd:sg-explore

# 3. 단계 계획 — 이전 교훈을 검토하고 gsd-discuss-phase → gsd-plan-phase 실행
/super-gsd:sg-plan

# 4. 실행 — 완성된 계획을 Superpowers에 인계하여 구현
/super-gsd:sg-execute

# ... Superpowers가 하나 이상의 세션에 걸쳐 결제 모듈 구현 ...

# 5. 리뷰 — 구현 완료 후 Superpowers 코드 리뷰 요청
/super-gsd:sg-review

# 6. 학습 — sg-retro 회고 실행; 교훈이 .planning/lessons/에 저장됨
/super-gsd:sg-learn

# 7. 배포 — gsd-ship을 통해 단계 병합 (단계마다 3~7번 반복)
/super-gsd:sg-ship

# 8. 완료 — 모든 단계가 완료되면 마일스톤을 아카이브하고 닫음
/super-gsd:sg-complete

# 9. 새 마일스톤 — 다음 마일스톤 시작
/super-gsd:sg-new
```

각 명령이 자동으로 컨텍스트를 다음 단계로 전달한다. 단계 간 상태를 복사-붙여넣기할 필요가 없다.

### 개별 명령 예시

**언제든 현재 위치 확인:**

```shell
/super-gsd:sg-status
```

**계획 전 이전 사이클 교훈 검토:**

```shell
# 모든 교훈 목록
/super-gsd:sg-lessons

# 특정 단계로 필터링
/super-gsd:sg-lessons phase-03
```

**모든 워크플로우 도구 한 번에 업데이트:**

```shell
/super-gsd:sg-update
```

**메인 워크플로우 외 소규모 일회성 작업 실행** (버그 수정, 문서 업데이트, 설정 변경):

```shell
/super-gsd:sg-quick fix null pointer in payment webhook handler
```

`sg-quick`은 전체 마일스톤을 시작하지 않고 경량 GSD 계획-실행-커밋 사이클로 작업을 처리한다.

## 팀 워크플로우

super-gsd는 `.planning/HANDOFF.md`의 `User` 컬럼을 통해 팀원별 작업 이력을 자동으로 기록한다. 시작 전 git 사용자 정보를 설정한다:

```shell
# git 사용자 확인
git config user.name
# 비어 있으면: git config --global user.name "이름"
```

**팀 현황 확인:**

```shell
/super-gsd:sg-status --team
```

팀원별 최근 phase, stage, 마지막 활동 시각을 테이블로 출력한다.

**브랜치 워크플로우:**

`main` 또는 `master` 브랜치에서 `sg-execute`를 실행하면, super-gsd가 이를 감지하고 `AskUserQuestion`으로 `phase/{N}-{slug}` 브랜치(예: `phase/41-team-documentation`) 생성을 제안한다. phase 완료 후 `sg-complete N` (또는 `sg-phase complete N`)을 실행하면 PR 생성 명령이 자동으로 출력된다.

브랜치 명명 규칙, 파일 소유권 규칙, merge 순서는 [`.planning/TEAM.md`](.planning/TEAM.md)를 참고한다.

## 설치

**Step 1 — super-gsd 설치:**

Claude Code 세션에서 다음 두 명령을 실행한다:

```
/plugin marketplace add gyuha/super-gsd
/plugin install super-gsd@super-gsd
```

첫 번째 명령은 이 저장소를 셀프호스팅 플러그인 마켓플레이스로 등록한다. 두 번째 명령은 해당 마켓플레이스에서 `super-gsd` 플러그인을 설치한다.

**Step 2 — `sg-update`로 필수 도구 설치:**

super-gsd가 로드되면 다음을 실행한다:

```
/super-gsd:sg-update
```

`sg-update`는 GSD, Superpowers의 설치 여부를 감지하고 없는 것을 자동으로 설치한다. 새 머신에서 실행하면 두 가지를 모두 자동으로 설치한다. 기존 설치 환경에서는 최신 버전으로 업데이트한다.

`sg-update` 완료 후 **설치 확인** 단계로 넘어간다.

## 멀티 플랫폼 지원

super-gsd 훅은 Claude Code 플러그인 마켓플레이스 없이 Codex, Gemini/Antigravity CLI에서도 동작한다. 아래 `npx @gyuha/super-gsd install` 명령으로 플랫폼별 훅 설정 파일과 스킬을 자동 설치한다.

### 기능 델타

| 기능 | Claude Code | Codex | Gemini / Antigravity CLI |
|------|:-----------:|:-----:|:------------------------:|
| `/sg-*` 슬래시 명령 | ✅ | ❌ `$sg-*` 스킬 사용 | ❌ `$sg-*` 스킬 사용 |
| Stop / SessionEnd 훅 다음 단계 안내¹ | ✅ in-context | ⚠️ 사용자에게 텍스트 안내 | ⚠️ 사용자에게 텍스트 안내 |
| SubagentStop 훅 | ✅ | ❌ 미지원 | ❌ 미지원 |
| PreToolUse / BeforeTool 훅 | ✅ | ✅ | ✅ |
| Superpowers 연동 | ✅ | ❌ | ❌ |
| AskUserQuestion UI | ✅ | ❌ numbered list 대체 | ❌ numbered list 대체 |
| 스킬 커버리지 | ✅ `skills/`에 21/21 | ⚠️ `.agents/skills/`에 11/21 | ⚠️ `.agents/skills/`에 11/21 |

¹ 세 플랫폼 모두 동일한 `hooks/stop_hook.cjs`를 실행하여 `systemMessage` 텍스트 안내(예: "Run /super-gsd:sg-execute to hand off to implementation")를 출력한다. Claude Code에서는 이 텍스트가 Claude의 컨텍스트 윈도우에 들어가 Claude가 안내에 soft-act하거나(사용자가 `sg-next`로 다음 스킬을 자동 invoke), Codex/Gemini에서는 같은 텍스트가 사용자에게 직접 표시되어 사용자가 다음 명령을 수동 실행한다. Gemini의 `SessionEnd` / `BeforeTool` 훅 이름은 Claude Code의 `Stop` / `PreToolUse`와 의미적으로 동일하다.

### Codex

```bash
npx @gyuha/super-gsd install
```

`.codex/hooks.json` (Stop 및 PreToolUse 훅), `hooks/` (Node.js .cjs 스크립트), `.agents/skills/` (`$sg-*` 스킬)을 설치한다. 사용 가능한 스킬: `$sg-start`, `$sg-plan`, `$sg-execute`, `$sg-parallel-execute`, `$sg-review`, `$sg-learn`, `$sg-retro`, `$sg-ship`, `$sg-status`, `$sg-next`, `$sg-setup`. 전체 워크플로우는 `AGENTS.md`를 참조한다.

> **참고:** Stop 훅은 `Run $sg-*` 안내 메시지를 출력할 뿐이며, 다음 스킬을 자동으로 invoke하지 않는다. 각 단계 후 `$sg-*` 명령을 직접 실행해야 한다.

> **팁:** Codex 세션 내부에서 `$sg-setup`을 실행하면 세션을 종료하지 않고 설치할 수 있다.

### Gemini / Antigravity CLI

Gemini CLI는 지원된다. Antigravity CLI 호환성은 v1.3 platform-hooks phase에서 독립적으로 검증되지 않았다 — 해당 환경에서 검증이 필요하면 이슈를 열어주세요.

```bash
npx @gyuha/super-gsd install --gemini
```

`.gemini/settings.json` (SessionEnd 및 BeforeTool 훅), `hooks/` (Node.js .cjs 스크립트), `.agents/skills/` (`$sg-*` 스킬)을 설치한다. `.agents/skills/` 스킬을 사용한다. 전체 워크플로우는 `AGENTS.md`를 참조한다.

> **참고:** SessionEnd 훅은 `Run $sg-*` 안내 메시지를 출력할 뿐이며, 다음 스킬을 자동으로 invoke하지 않는다. 각 단계 후 `$sg-*` 명령을 직접 실행해야 한다.

> **팁:** Gemini 세션 내부에서 `$sg-setup --gemini`를 실행하면 세션을 종료하지 않고 설치할 수 있다.

## 필수 도구

`super-gsd`는 세 가지 도구를 오케스트레이션한다. `sg-update`(위)가 자동으로 설치하며, 이 섹션은 각 도구가 무엇을 하는지에 대한 참고 자료다.

- **GSD** (`@opengsd/get-shit-done-redux`) — 이 플러그인이 읽는 `/gsd-*` 계획 명령과 `.planning/` 디렉터리 컨벤션을 제공한다.
- **Superpowers** (`claude-plugins-official/superpowers`) — 빌드/리뷰 단계에서 사용하는 `superpowers:*` 스킬 트리를 제공한다.

`super-gsd`는 비침투적이다: 이 도구들의 어떤 파일도 수정, 포크, 교체하지 않는다.

## 설치 확인

설치 후 `super-gsd`가 올바르게 로드됐는지, 기존 도구들이 정상 작동하는지 확인한다.

### Claude Code

1. `/plugin list`를 실행하여 `super-gsd`가 `.claude-plugin/plugin.json`의 이름, 버전, 설명과 일치하는지 확인한다.
2. `/gsd-progress`(또는 다른 GSD 명령)를 실행하여 GSD가 정상 응답하는지 확인한다 — GSD가 수정되지 않았음을 증명한다.
3. Skill 트리를 열어 `superpowers:*` 스킬이 발견 가능하고 호출 가능한지 확인한다 — Superpowers가 수정되지 않았음을 증명한다.

### Codex

1. `cat .codex/hooks.json` — hooks.json 존재 확인
2. `ls hooks/*.cjs` — 훅 스크립트 존재 확인
3. `ls .agents/skills/` — 스킬 디렉터리 존재 확인
4. `$sg-status` 실행 — 스킬 응답 확인

### Gemini

1. `cat .gemini/settings.json` — settings.json 존재 확인
2. `ls hooks/*.cjs` — 훅 스크립트 존재 확인
3. `ls .agents/skills/` — 스킬 디렉터리 존재 확인
4. `$sg-status` 실행 — 스킬 응답 확인

플랫폼별 확인이 모두 통과하면 `super-gsd`가 올바르게 설치된 것이다.

## 로드맵

`super-gsd`는 MVP 수직 슬라이스 방식으로 배포된다. 각 단계는 일관되고 테스트 가능한 사용자 동작을 제공한다.

- **Phase 1 — 플러그인 스캐폴드 (완료):** 설치 가능한 플러그인 셸(매니페스트, 마켓플레이스 메타데이터, README, 검증 체크리스트). 아직 명령이나 훅 없음.
- **Phase 2 — 수동 인계 및 상태 (완료):** `/super-gsd:sg-execute`(완성된 GSD 단계를 Superpowers 준비 프롬프트로 패키징)와 `/super-gsd:sg-status`(현재 단계, 마지막 인계, 다음 권장 명령 확인) 도입.
- **Phase 3 — sg- 명령 세트 및 README (완료):** 전체 GSD → Superpowers → sg-retro 사이클을 커버하는 14개 명령 인터페이스와 업데이트된 문서 제공. *(이후 phase에서 21개 명령으로 확장 — 현재 목록은 Commands 테이블 참조.)*
- **Phase 4 — 자동 진행 훅 (완료):** `Stop` 훅을 등록하여 단계 전환을 자동 감지 — `plan-phase` 완료 시 인계 프롬프트 표시, 코드 리뷰어 완료 시 Hookify 제안. *(Hookify 의존성은 Phase 13에서 제거됨, 알림 텍스트는 `sg-retro`로 라우팅 전환.)*
- **Phase 5 — 학습 루프 (완료):** Hookify 교훈을 `.planning/lessons/`에 저장하고 다음 GSD 단계 시작 시 자동 표시하여 학습 루프 완성. *(Lessons 작성은 Phase 13에서 내장 `sg-retro` Skill로 이관됨; Hookify 불필요.)*
- **Phase 6 — sg-health (완료):** `sg-health` 자기진단 명령 도입 — GSD/Superpowers 설치 여부, 훅 등록, HANDOFF.md 스키마 무결성을 `[OK]`/`[WARN]`/`[FAIL]`로 출력.
- **Phase 7 — 상태 정확도 (완료):** `sg-status`의 STATE.md Phase 라인 파싱 및 저장/표시 enum 분리 수정으로 현재 워크플로우 단계를 항상 정확하게 표시.
- **Phase 8 — 세션 복원 (완료):** `sg-start`가 기존 세션을 감지하여 재개 / 새 마일스톤 시작 / 취소 3가지 옵션을 제시해 중단 후 안전하게 복귀 가능.
- **Phase 9 — sg-retro Skill 스캐폴드 (완료):** 3가지 회고 렌즈를 지원하는 내장 `sg-retro` 스킬 도입. Hookify 없이 `.planning/lessons/`에 결과 저장.
- **Phase 10 — 대화 분석기 + 렌즈 확장 (완료):** frustration/correction/repeated/validated-success 4가지 패턴을 추출하는 자체 transcript 분석기 추가, Sailboat·Five Whys 포함 총 6개 렌즈로 확장. *(Phase 42 / v2.9에서 3개 렌즈(`ssc`/`dspm`/`analyze`)로 통합; `4ls`/`sail`/`5why` 제거.)*
- **Phase 11 — 자체 rule runner (완료):** `PreToolUse` 훅을 직접 등록해 `.claude/sg-rule.*.local.md` 규칙을 실행 — Hookify 없이도 가드 동작.
- **Phase 12 — lessons 집계 + 재발 방지 가드 (완료):** lessons를 phase·milestone별로 묶고, `sg-plan`/`sg-execute`에서 weighted top-N 패턴을 우선 노출하여 같은 실수 반복 방지.
- **Phase 13 — sg-learn 라우팅 전환 + Hookify 제거 (완료):** `sg-learn`을 내장 `sg-retro` 스킬로 재라우팅하고 명령·문서에서 Hookify 의존성 전부 제거.
- **Phase 14 — Codex 진입점 + .agents/skills/ (v1.3 — 완료):** `AGENTS.md`를 Codex 어휘로 재작성하고 `.agents/skills/` 스킬 6개를 신규 생성하여 Codex, Gemini CLI, Antigravity CLI 사용자가 Claude Code 슬래시 명령 없이 워크플로우를 진행 가능. *(v1.4-v2.6 동안 11개로 확장 — 현재 목록은 Multi-Platform Support 섹션 참조.)*
- **Phase 15 — 플랫폼별 훅 설정 + Python 픽스 (v1.3 — 완료):** `.codex/hooks.json`과 `.gemini/settings.json` 훅 설정 파일 신규 생성, `CLAUDE_PLUGIN_ROOT` 없이도 `hooks/*.py`가 실행되도록 경로 폴백 수정.
- **Phase 16 — README Multi-Platform 섹션 (v1.3 — 완료):** 플랫폼별 설치 가이드와 기능 델타 테이블(동작 가능 / 제한 있음 / 불가)을 README에 추가.
- **Phase 26 — sg-next 자동 진행 (v2.2 — 완료):** `sg-next`가 HANDOFF.md와 STATE.md를 읽어 현재 워크플로우 단계를 감지하고, `sg-status`와 동일한 라우팅 테이블로 다음 sg-* 명령을 즉시 실행한다. 모호한 상태(`complete` 또는 `init`)에서는 자동 실행 대신 `AskUserQuestion`을 표시한다.
- **Phase 27 — GSD 저장소 마이그레이션 업데이트 (v2.3 — 완료):** 모든 내부 GSD 패키지 참조를 `@opengsd/get-shit-done-redux`로 업데이트하여 `sg-update`와 `sg-health`가 올바르게 동작하도록 수정.
- **Phase 28–31 — Hooks Node 마이그레이션 (v2.4 — 완료):** 훅 스크립트 4개(`stop_hook`, `transcript_matcher`, `rule_runner`, `lessons_ranker`)를 Python에서 Node.js `.cjs`로 재작성, 훅 설정 파일의 호출을 `node`로 교체, 레거시 `.py` 파일 삭제.
- **Phase 32 — Superpowers 네이티브 파일 파싱 (v2.5 — 완료):** 스킬 내부 파일 파싱을 bash 파이프라인에서 Superpowers Read 도구 패턴으로 전환하여 모든 플랫폼에서 올바르게 동작.
- **Phase 33–35 — Codex/Gemini 설치 UX 개선 (v2.6 — 완료):** `npx @gyuha/super-gsd install` 단일 명령 설치 도구 추가, `$sg-setup` 인세션 스킬 도입, README/AGENTS.md에 검증 가능한 플랫폼별 설치 안내 추가.
- **Phase 36–38 — Skills & Hooks 국제화 (v2.7 — 완료):** `skills/`와 `.agents/skills/`의 모든 SKILL.md를 한글 소스에서 영문 + 언어 자동 감지 방식으로 전환, `hooks/`의 한글 주석을 영문으로 포팅.
- **Phase 39–41 — 팀 협업 지원 (v2.8 — 완료):** HANDOFF.md 행에 `User` 컬럼을 추가해 각 핸드오프를 팀원에게 귀속, `sg-status --team`으로 팀원별 현재 위치 테이블 출력, `sg-execute`가 `main`/`master` 감지 시 `phase/{N}-{slug}` 브랜치 생성을 `AskUserQuestion`으로 제안, `sg-complete N` 후 `gh pr create` 안내 출력, `.planning/TEAM.md` 온보딩 가이드 + README/README.ko.md Team Workflow 섹션 신설.
- **Phase 42–44 — 회고 UX 단순화 (v2.9 — 완료):** 스마트 기본값으로 `dspm + ssc` 두 렌즈 자동 실행, 6개 렌즈를 3개(`ssc`/`dspm`/`analyze`)로 통합 (`4ls`/`sail`/`5why`는 stderr + exit 1로 거부), `--pick` 플래그로 토큰 위치 무관 인터랙티브 multiSelect 도입 (Claude Code 전용 — Codex/Gemini는 graceful exit + positional alternative 안내), Action Items P1 행에 `🔴` 이모지 강조, `_Intent: ..._` 이탤릭 줄로 각 렌즈 의도 표시, README/README.ko.md/`.planning/TEAM.md`/sg-retro frontmatter 동기화. Phase 42/43 retro P1을 quick task로 closure — `sg-review`가 작업 트리에 미커밋 phase 구현 감지 시 자동 commit gate 작동.

## 라이선스

MIT 라이선스로 배포된다. 전문은 [LICENSE](./LICENSE)를 참고한다.

---

English documentation: [README.md](./README.md)
