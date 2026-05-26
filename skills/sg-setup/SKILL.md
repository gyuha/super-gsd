---
name: sg-setup
description: super-gsd 훅·스킬 파일을 현재 프로젝트에 복사 — Claude Code 인세션 인스톨러
argument-hint: "[--gemini] [--force] - --gemini: .gemini/settings.json 추가 복사, --force: 기존 파일 덮어쓰기"
---

<objective>
npm 패키지 경로에서 super-gsd 운영에 필요한 파일(hooks/, .agents/skills/, .codex/hooks.json)을 현재 프로젝트 루트에 복사한다. Claude Code 세션 내부에서 Bash 도구로 node를 직접 실행하여 설치를 완료한다.
</objective>

<execution_context>
Self-contained. require.resolve로 @gyuha/super-gsd 패키지 루트를 결정한 뒤 Bash 도구로 파일을 현재 프로젝트에 복사한다.
</execution_context>

<process>
0. **인수 파싱.**

   ARGUMENTS를 공백으로 분리하여 플래그를 추출한다:
   - `--force` 포함 여부 → FORCE=true (기본 false)
   - `--gemini` 포함 여부 → GEMINI=true (기본 false)

1. **PKG_ROOT 결정 (per D-01~D-04).**

   Bash 도구로 아래 명령을 실행한다 (D-02: require.resolve 실패 시 npm root -g fallback):
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

   항상 복사하는 파일:
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

4. **파일 복사 실행 (per D-09~D-12, Bash 도구 사용).**

   Bash 도구로 아래 스크립트를 실행한다. FORCE, GEMINI, PKG_ROOT 변수는 앞 단계에서 결정된 값으로 대체하여 실행한다:

   ```bash
   DEST_ROOT=$(pwd)
   COPIED=0
   SKIPPED=0
   ERRORS=0

   copy_file() {
     local REL_PATH="$1"
     local SRC="$PKG_ROOT/$REL_PATH"
     local DEST="$DEST_ROOT/$REL_PATH"

     if [ ! -f "$SRC" ]; then
       echo "✗ $REL_PATH: source not found in $PKG_ROOT"
       ERRORS=$((ERRORS + 1))
       return
     fi

     if [ -f "$DEST" ] && [ "$FORCE" != "true" ]; then
       echo "⚠ $REL_PATH already exists — skipping (use --force to overwrite)"
       SKIPPED=$((SKIPPED + 1))
       return
     fi

     mkdir -p "$(dirname "$DEST")"
     if cp "$SRC" "$DEST"; then
       if [ -f "$DEST" ] && [ "$FORCE" = "true" ]; then
         echo "✓ $REL_PATH (overwritten)"
       else
         echo "✓ $REL_PATH"
       fi
       COPIED=$((COPIED + 1))
     else
       echo "✗ $REL_PATH: copy failed"
       ERRORS=$((ERRORS + 1))
     fi
   }

   copy_file "hooks/stop_hook.cjs"
   copy_file "hooks/rule_runner.cjs"
   copy_file "hooks/transcript_matcher.cjs"
   copy_file "hooks/lessons_ranker.cjs"
   copy_file "hooks/hooks.json"
   copy_file ".agents/skills/sg-execute/SKILL.md"
   copy_file ".agents/skills/sg-plan/SKILL.md"
   copy_file ".agents/skills/sg-retro/SKILL.md"
   copy_file ".agents/skills/sg-review/SKILL.md"
   copy_file ".agents/skills/sg-ship/SKILL.md"
   copy_file ".agents/skills/sg-start/SKILL.md"
   copy_file ".agents/skills/sg-status/SKILL.md"
   copy_file ".codex/hooks.json"

   if [ "$GEMINI" = "true" ]; then
     copy_file ".gemini/settings.json"
   fi

   echo ""
   echo "Installation complete."
   echo "  Copied:  $COPIED files"
   echo "  Skipped: $SKIPPED files (already exist)"
   if [ "$ERRORS" -gt 0 ]; then
     echo "  Errors:  $ERRORS (see above)"
   fi
   ```

5. **완료 안내.**

   ```
   [sg-setup] 설치 완료. 다음 단계: /super-gsd:sg-execute 를 실행하여 현재 phase를 진행하세요.
   ```
</process>

<success_criteria>
1. @gyuha/super-gsd 패키지가 없으면 명확한 오류 메시지와 설치 방법을 안내하고 종료한다.
2. --gemini 플래그 또는 환경변수(GEMINI_PROJECT_DIR, GEMINI_API_KEY) 감지 시 .gemini/settings.json도 복사된다.
3. 모든 기본 파일(hooks/ 5개, .agents/skills/ 7개 SKILL.md, .codex/hooks.json)이 Bash 도구로 복사된다.
4. 대상 파일 존재 + --force 없음 → 스킵 + 경고. --force 있음 → 덮어쓰기.
5. 완료 후 Copied/Skipped summary와 다음 단계 안내가 출력된다.
6. plugin.json 수정 없이 skills/ 디렉토리 스캔으로 /super-gsd:sg-setup 명령이 자동 등록된다 (per D-18).
</success_criteria>
