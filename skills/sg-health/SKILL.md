---
name: sg-health
description: Use this when something feels broken or before onboarding — diagnoses GSD, Superpowers, hooks, HANDOFF.md, and STATE.md installation line by line.
---

<objective>
GSD/Superpowers 설치 여부, Hookify 설치 여부(선택), hooks.json 훅 등록, HANDOFF.md 스키마, STATE.md frontmatter를 라인별 [OK]/[WARN]/[FAIL]/[OPTIONAL]로 진단하고 요약 줄로 끝내는 읽기 전용 명령이다. 파일을 생성하거나 수정하지 않는다.
</objective>

<execution_context>
Self-contained — reads ~/.claude/*, ${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json, .planning/HANDOFF.md, .planning/STATE.md. Writes nothing.
</execution_context>

<process>
아래 7개 항목을 순서대로 점검한다. FAIL과 WARN 카운터를 누적하고 마지막에 요약 줄을 출력한다. 파일 쓰기 연산자(>, >>, tee, sed -i)는 일절 사용하지 않는다.

1. **GSD 설치**

   ```bash
   test -d "$HOME/.claude/get-shit-done" && echo OK || echo FAIL
   ```

   - OK → `GSD .............. [OK]`
   - FAIL → `GSD .............. [FAIL] ~/.claude/get-shit-done/ 디렉토리 없음`, FAIL++

2. **Superpowers 설치**

   ```bash
   test -d "$HOME/.claude/plugins/data/superpowers-claude-plugins-official" && echo OK || echo FAIL
   ```

   - OK → `Superpowers ...... [OK]`
   - FAIL → `Superpowers ...... [FAIL] 디렉토리 없음`, FAIL++

3. **Hook 스크립트 존재 여부** *(Codex/Gemini 설치 시 필수)*

   ```bash
   test -f "hooks/stop_hook.cjs" && test -f "hooks/rule_runner.cjs" && echo OK || echo WARN
   ```

   - OK → `Hook scripts .... [OK]`
   - WARN → `Hook scripts .... [WARN] hooks/stop_hook.cjs 또는 hooks/rule_runner.cjs 없음. Codex/Gemini 사용 시: cp -r ~/super-gsd/hooks .`, WARN++

4. **Stop hook 등록**

   ```bash
   grep -q '"Stop"[[:space:]]*:' "${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json" && echo OK || echo FAIL
   ```

   - OK → `Stop hook ........ [OK]`
   - FAIL → `Stop hook ........ [FAIL] hooks.json에 Stop 훅 없음`, FAIL++

5. **SubagentStop hook 등록**

   ```bash
   grep -q '"SubagentStop"' "${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json" && echo OK || echo FAIL
   ```

   - OK → `SubagentStop hook  [OK]`
   - FAIL → `SubagentStop hook  [FAIL] hooks.json에 SubagentStop 훅 없음`, FAIL++

6. **HANDOFF.md 스키마**

   ```bash
   test -f .planning/HANDOFF.md && echo EXISTS || echo MISSING
   ```

   - MISSING → `HANDOFF.md ....... [WARN] 파일 없음 (아직 인계 없음)`, WARN++
   - EXISTS → 데이터 행 확인:
     ```bash
     grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | head -1
     ```
     - 출력 없음 → `HANDOFF.md ....... [WARN] 데이터 행 없음 (아직 인계 없음)`, WARN++
     - 출력 있음 → 첫 번째 데이터 행의 컬럼 수 확인:
       ```bash
       grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | head -1 | awk -F'|' '{print NF}'
       ```
       - NF == 7 → `HANDOFF.md ....... [OK]`
       - NF != 7 → `HANDOFF.md ....... [FAIL] 스키마 손상 (5컬럼 TSV 아님)`, FAIL++

7. **STATE.md frontmatter**

   ```bash
   test -f .planning/STATE.md && echo EXISTS || echo MISSING
   ```

   - MISSING → `STATE.md ......... [WARN] 파일 없음`, WARN++
   - EXISTS → frontmatter 구분자 수 확인:
     ```bash
     grep -c '^---$' .planning/STATE.md
     ```
     - 결과 >= 2 → `STATE.md ......... [OK]`
     - 결과 < 2 → `STATE.md ......... [FAIL] frontmatter 파싱 불가 (--- 구분자 없음)`, FAIL++

8. **요약 출력**

   빈 줄을 출력한 뒤:
   - FAIL == 0 && WARN == 0 → `모든 항목 정상입니다.`
   - 그 외 → `[FAIL] ${FAIL}개, [WARN] ${WARN}개 — 위 항목을 확인하세요.`
</process>

<success_criteria>
1. 8개 진단 항목(GSD, Superpowers, Hookify, Hook scripts, Stop hook, SubagentStop hook, HANDOFF.md, STATE.md)이 모두 출력된다.
2. 각 항목은 D-05 형식(`GSD .............. [OK]` 등 점 패딩 + `[OK]`/`[WARN]`/`[FAIL]`/`[OPTIONAL]`)으로 출력된다.
3. 마지막에 빈 줄 + 요약 줄이 출력된다.
4. 파일을 생성하거나 수정하지 않는다 (HEALTH-05).
</success_criteria>
