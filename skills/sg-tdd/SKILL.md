---
name: sg-tdd
description: Use this when execute is complete and TDD verification is required — invokes superpowers:test-driven-development and appends a tdd stage row to HANDOFF.md.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase"
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
tdd_mode가 활성화된 경우 현재 phase의 구현 결과를 Superpowers test-driven-development 스킬로 TDD 준수 여부를 검증하고, HANDOFF.md에 tdd stage 행을 기록한다. Non-invasive 제약(D-07)에 따라 Superpowers 또는 GSD 내부 파일을 수정하지 않는다.
</objective>

<execution_context>
This command is self-contained — no external workflow files imported. Reads .planning/config.json, .planning/STATE.md, .planning/ROADMAP.md, .planning/HANDOFF.md.
</execution_context>

<process>
1. **tdd_mode 플래그 확인 (D-02, per D-03).**
   config.json에서 tdd_mode를 읽는다. macOS 호환, jq/python3 미사용:
   ```bash
   TDD_MODE=$(node -e "try{const c=require('./.planning/config.json');console.log(c.super_gsd&&c.super_gsd.tdd_mode?'true':'false')}catch(e){console.log('false')}" 2>/dev/null || echo "false")
   if [ "$TDD_MODE" != "true" ]; then
     echo "tdd_mode is not enabled. To activate: set super_gsd.tdd_mode: true in .planning/config.json. Recommended: re-run sg-execute first."
   fi
   ```
   tdd_mode가 "true"가 아니어도 계속 진행한다 (블록 없음, per D-02).

2. **Phase resolve.**
   ARGUMENTS가 비어있지 않으면 PHASE_NUM=$ARGUMENTS. 아니면 Read .planning/STATE.md에서 YAML frontmatter의 Phase: 값을 추출하여 PHASE_NUM으로 설정한다.
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter. Set PHASE_NUM to the extracted value.
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-tdd <phase>"
     exit 1
   fi
   ```

3. **Phase directory 확인.**
   ```bash
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_DIR=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1)
   if [ -z "$PHASE_DIR" ]; then
     PHASE_DIR=$(ls -d .planning/phases/${PHASE_NUM}-* 2>/dev/null | head -1)
   fi
   if [ -z "$PHASE_DIR" ]; then
     echo "No phase directory matches '${PHASE_NUM}' under .planning/phases/. Run /super-gsd:sg-plan first."
     exit 1
   fi
   ```

4. **Phase meta 읽기.**
   Read .planning/ROADMAP.md에서 `### Phase PHASE_NUM:` 섹션의 PHASE_NAME, GOAL, SC_TEXT를 추출한다.
   ```
   Read .planning/ROADMAP.md, then:
   - Find the ### Phase <PHASE_NUM>: section header (try both unpadded and zero-padded two-digit PHASE_PAD forms); extract PHASE_NAME (text after "Phase N: " on that line).
   - Extract the **Goal**: line value immediately following the header. Set GOAL.
   - Extract numbered items under **Success Criteria** until the next ** section. Set SC_TEXT.
   If no matching header is found, print: "No '### Phase <PHASE_NUM>:' header found in .planning/ROADMAP.md. Aborting." and exit.
   ```

5. **HANDOFF.md 자동 초기화.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash | User |\n| --- | --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   ```

6. **HANDOFF.md에 tdd 행 append (Skill() 호출 전).**
   From 컬럼은 항상 "execute"를 사용한다 (sg-tdd는 항상 execute 뒤에 온다).
   ```bash
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   PHASE_SLUG=$(basename "$PHASE_DIR")
   GIT_USER=$(git config user.name 2>/dev/null || echo "-")
   [ -z "$GIT_USER" ] && GIT_USER="-"
   echo "| $TS | $PHASE_SLUG | execute | tdd | - | $GIT_USER |" >> .planning/HANDOFF.md
   ```

7. **프롬프트 빌드 + TDD 검증 완료 신호 출력 + Skill() 호출 (D-06, D-07).**
   Superpowers에 전달할 컨텍스트 blob을 아래 형식으로 조립한다:
   ```
   # TDD Verification — Phase <N> (<PHASE_NAME>)

   ## Goal
   <GOAL>

   ## Success Criteria
   <SC_TEXT>

   ## Instruction
   Verify TDD compliance for the implementation above using superpowers:test-driven-development.
   Check that: (1) tests were written before or alongside implementation, (2) all tests pass, (3) no production code exists without a corresponding test.
   If TDD verification finds issues, surface them and ask the user: proceed to sg-review or retry.
   ```

   컨텍스트 blob 출력 후 반드시 아래 정확한 문자열을 출력한다 (D-06 transcript 신호):
   ```bash
   echo "TDD verification complete"
   ```

   그 다음 Skill() 호출 — 이후 어떤 코드도 실행하지 않는다 (Terminal Skill pattern):
   ```
   Skill(skill="superpowers:test-driven-development", args="<the context blob above>")
   ```

   TDD 검증 실패 처리 (D-01) — Superpowers 스킬이 실패를 보고할 때 sg-tdd 스킬 내부에서 처리:
   Superpowers 스킬 완료 후 실패 신호가 감지되면 AskUserQuestion으로 소프트 경고를 제공한다:
   ```
   AskUserQuestion(
     questions: [{
       question: "TDD verification found issues. How do you want to proceed?",
       header: "sg-tdd",
       multiSelect: false,
       options: [
         { label: "Proceed to sg-review", description: "Continues to /super-gsd:sg-review." },
         { label: "Retry TDD verification", description: "Re-runs superpowers:test-driven-development." }
       ]
     }]
   )
   ```
</process>

<success_criteria>
1. tdd_mode: false 또는 미설정 상태에서 호출하면 경고 메시지를 출력하고 계속 진행한다 (블록 없음).
2. tdd_mode: true 상태에서 호출하면 Superpowers test-driven-development 스킬을 정확히 한 번 호출한다.
3. Skill() 호출 전에 HANDOFF.md에 tdd stage 행이 기록된다 (From=execute, To=tdd, Plan Hash=-).
4. Skill() 호출 직전에 "TDD verification complete" 문자열이 출력된다.
5. TDD 검증 실패 시 AskUserQuestion으로 소프트 경고 + proceed/retry 선택지를 제공한다.
</success_criteria>
