<!-- GSD:project-start source:PROJECT.md -->
## Project

**super-gsd**

GSD → Superpowers → Hookify 3단계 AI 개발 워크플로우를 자동으로 연결해 주는 Claude Code 플러그인이다. GSD가 전략과 계획을, Superpowers가 구현과 검증을, Hookify가 회고와 학습을 담당하도록 역할을 분리해 주면서, 각 단계가 끝나면 다음 단계로 자연스럽게 인계되도록 명령과 훅을 제공한다.

**Core Value:** 각 도구의 단계 종료 시점에 다음 단계 도구로 컨텍스트와 함께 자동으로 인계되어, 사용자가 도구 간 전환을 직접 기억하거나 명령을 다시 입력하지 않아도 같은 실수가 반복되지 않는 학습 루프를 유지한다.

### Constraints

- **Tech stack**: Claude Code 플러그인 시스템 (skills + commands + hooks). Bash/Python/Markdown 위주.
- **Dependencies**: `claude-plugins-official/superpowers`, `claude-plugins-official/hookify`, `get-shit-done-cc` (또는 동등 GSD 설치).
- **Compatibility**: Claude Code 최신 버전 — `Stop`/`SubagentStop` hook 및 플러그인 marketplace 메커니즘 사용.
- **Idempotency**: 인계 명령은 같은 phase에서 여러 번 호출해도 중복 컨텍스트를 생성하지 않아야 한다.
- **Non-invasive**: 기존 GSD/Superpowers/Hookify의 파일을 수정하지 않고 외부에서 orchestrate한다.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### 버전 관리

버전을 올릴 때는 반드시 다음 두 파일을 함께 업데이트한다:

1. `.claude-plugin/plugin.json` — `version` 필드 변경
2. `CHANGELOG.md` — 새 버전 섹션 추가 (변경 내용 요약 포함)

CHANGELOG.md 업데이트 없이 버전만 올리는 커밋은 허용하지 않는다.

### 배포 트리거

프롬프트에 **"배포"** 라고 입력하면 다음 절차를 순서대로 실행한다:

1. **버전 결정** — `.claude-plugin/plugin.json`의 현재 `version`을 읽고 patch를 1 올린다 (예: `0.0.9` → `0.0.10`).
2. **plugin.json 업데이트** — `version` 필드를 새 버전으로 교체한다.
3. **CHANGELOG.md 업데이트** — 파일 상단(첫 번째 `## [x.x.x]` 블록 바로 위)에 새 버전 섹션을 삽입한다. 형식:
   ```
   ## [NEW_VERSION] - YYYY-MM-DD

   ### Changed

   - (git log에서 마지막 버전 태그 이후 커밋 메시지를 요약하여 기재)
   ```
4. **git commit** — 변경된 두 파일을 스테이징하고 커밋한다. 메시지: `chore(release): bump version to NEW_VERSION`
5. **git push** — 현재 브랜치를 원격에 push한다.

**주의 사항:**
- push 전에 사용자에게 확인을 구하지 않고 바로 실행한다 (배포 트리거는 명시적 의도가 있는 명령이다).
- 커밋·push 외의 파일(테스트, 문서 등)은 건드리지 않는다.
- git push가 실패하면(예: 원격에 앞선 커밋이 있는 경우) 강제 push 없이 오류를 그대로 보고한다.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
