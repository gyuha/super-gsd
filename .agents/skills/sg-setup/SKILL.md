---
name: sg-setup
description: super-gsd 훅·스킬 파일을 현재 프로젝트에 복사 — Codex/Gemini 인세션 인스톨러
argument-hint: "[--gemini] [--force] - --gemini: .gemini/settings.json 추가 복사, --force: 기존 파일 덮어쓰기"
---

<objective>
npm 패키지 경로에서 super-gsd 운영에 필요한 파일(hooks/, .agents/skills/, .codex/hooks.json)을 현재 프로젝트 루트에 복사한다. Codex/Gemini 세션 내부에서 AI Read/Write 도구로 직접 파일을 복사하여 외부 CLI 없이 설치를 완료한다.
</objective>

<constraints>
## Platform Constraints (Codex / Gemini CLI)
- Node.js CLI 없음: npx/node 직접 실행 불가. AI Read/Write 도구로 파일을 복사한다.
- SubagentStop 미지원: 완료 후 $sg-execute를 수동 실행하세요.
- AskUserQuestion 미지원: 선택지를 텍스트로 출력하고 자유 입력을 받음.
</constraints>

<execution_context>
Self-contained. require.resolve로 @gyuha/super-gsd 패키지 루트를 결정한 뒤 AI Read/Write 도구로 파일을 현재 프로젝트에 복사한다.
</execution_context>

<process>
0. **인수 파싱.**

   ARGUMENTS를 공백으로 분리하여 플래그를 추출한다:
   - `--force` 포함 여부 → FORCE=true (기본 false)
   - `--gemini` 포함 여부 → GEMINI=true (기본 false)

1. **PKG_ROOT 결정 (per D-01~D-04).**

   아래 Node.js 코드를 Bash로 실행하여 PKG_ROOT를 결정한다 (D-02: require.resolve 실패 시 npm root -g fallback):
   ```bash
   PKG_ROOT=$(node -e "
     try {
       const pkg = require.resolve('@gyuha/super-gsd/package.json');
       const path = require('path');
       process.stdout.write(path.dirname(pkg));
     } catch(e) { process.exit(1); }
   " 2>/dev/null)
   if [ -z "$PKG_ROOT" ]; then
     PKG_ROOT=$(npm root -g 2>/dev/null)/@gyuha/super-gsd
     [ ! -d "$PKG_ROOT" ] && PKG_ROOT=""
   fi
   if [ -z "$PKG_ROOT" ]; then
     echo "[sg-setup] Cannot locate @gyuha/super-gsd package. Install it first:"
     echo "  npx @gyuha/super-gsd install"
     exit 1
   fi
   echo "[sg-setup] PKG_ROOT: $PKG_ROOT"
   ```

2. **플랫폼 감지 (per D-05~D-08).**

   --gemini 인수가 없을 때 환경변수 + 디렉토리로 자동 감지한다 (D-06):
   ```bash
   if [ "$GEMINI" != "true" ]; then
     if [ -n "$GEMINI_PROJECT_DIR" ] || [ -n "$GEMINI_API_KEY" ]; then
       GEMINI=true
       echo "[sg-setup] Gemini 환경 감지됨. .gemini/settings.json 도 복사합니다."
     elif [ -n "$CODEX_SHELL" ] || [ -n "$CODEX" ] || [ -d ".codex" ]; then
       echo "[sg-setup] Platform detected: codex (use --gemini to include Gemini settings)"
     else
       echo "[sg-setup] 플랫폼 감지 불가 — 기본 파일 세트(hooks, .agents, .codex)만 복사합니다."
     fi
   fi
   ```

3. **복사 대상 목록 구성.**

   항상 복사하는 파일 (Codex 기본 세트):
   - `hooks/stop_hook.cjs`
   - `hooks/rule_runner.cjs`
   - `hooks/transcript_matcher.cjs`
   - `hooks/lessons_ranker.cjs`
   - `hooks/hooks.json`
   - `.agents/skills/sg-execute/SKILL.md`
   - `.agents/skills/sg-plan/SKILL.md`
   - `.agents/skills/sg-retro/SKILL.md`
   - `.agents/skills/sg-review/SKILL.md`
   - `.agents/skills/sg-ship/SKILL.md`
   - `.agents/skills/sg-start/SKILL.md`
   - `.agents/skills/sg-status/SKILL.md`
   - `.codex/hooks.json`

   GEMINI=true 일 때 추가:
   - `.gemini/settings.json`

4. **파일 복사 실행 (per D-09~D-16, AI Read/Write 도구 사용).**

   각 복사 대상에 대해:

   a. 소스 경로: `$PKG_ROOT/<relative-path>`
   b. 대상 경로: `<cwd>/<relative-path>`

   **충돌 처리 (per D-09~D-12):**
   - 대상 파일이 이미 존재하고 FORCE=false → 스킵 + 경고 출력, skipped++ (per D-09~D-10)
   - 대상 파일이 이미 존재하고 FORCE=true → 덮어쓰기 실행, copied++ (per D-11)
   - 대상 파일 미존재 → 복사 실행, copied++ (per D-09)

   **AI 도구로 파일 복사 (per D-13~D-16):**
   - Read 도구로 `$PKG_ROOT/<relative-path>` 읽기
   - Write 도구로 `<cwd>/<relative-path>` 쓰기
   - 부모 디렉토리가 없으면 Write 도구가 자동으로 생성하므로 별도 mkdir 불필요

   각 파일 처리 후 결과 출력:
   - 복사 성공: `✓ <relative-path>`
   - 스킵: `⚠ <relative-path> already exists — skipping (use --force to overwrite)`
   - 오류: `✗ <relative-path>: <error message>`

5. **Summary 출력 (per D-13~D-16).**

   모든 파일 처리 완료 후:
   ```
   Installation complete.
     Copied:  <copied> files
     Skipped: <skipped> files (already exist)
   ```
   errors > 0이면 추가로:
   ```
     Errors:  <errors> (see above)
   ```

   완료 메시지:
   ```
   [sg-setup] 설치 완료. 다음 단계: $sg-execute 를 실행하여 현재 phase를 진행하세요.
   ```
</process>

<success_criteria>
1. @gyuha/super-gsd 패키지가 없으면 명확한 오류 메시지와 설치 방법을 안내하고 종료한다.
2. --gemini 플래그 또는 환경변수(GEMINI_PROJECT_DIR, GEMINI_API_KEY) 감지 시 .gemini/settings.json도 복사된다.
3. 모든 기본 파일(hooks/ 4개 .cjs + hooks.json, .agents/skills/ 7개 SKILL.md, .codex/hooks.json)이 AI Read/Write 도구로 복사된다.
4. 대상 파일 존재 + --force 없음 → 스킵 + 경고. --force 있음 → 덮어쓰기.
5. 완료 후 Copied/Skipped summary와 다음 단계 안내가 출력된다.
6. 파일 복사 단계에서 bash cp 또는 node fs.copyFileSync를 사용하지 않고 AI Read/Write 도구만 사용한다 (PKG_ROOT 결정 단계의 node -e 사용은 허용됨).
</success_criteria>
