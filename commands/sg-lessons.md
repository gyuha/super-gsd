---
name: sg-lessons
description: List prior Hookify lessons from .planning/lessons/ and inject them as context for the next GSD phase.
argument-hint: "[phase] - optional. If provided, show only lessons for that phase number."
---

<objective>
.planning/lessons/ 디렉토리의 모든 Markdown 파일을 읽어 순서대로 출력한다. 사용자가 /super-gsd:sg-plan을 실행하기 전에 이전 lessons를 확인하거나 컨텍스트로 활용할 수 있도록 한다.
</objective>

<execution_context>
Self-contained. Reads .planning/lessons/ directory. Writes nothing.
</execution_context>

<process>
1. **Glob으로 파일 목록 수집:**
   ```bash
   FILES=$(ls .planning/lessons/*.md 2>/dev/null | sort)
   ```
   비어 있으면 `No lessons recorded yet. Run /super-gsd:sg-learn after a review to capture lessons.` 출력 후 종료.

2. **ARGUMENTS로 phase 필터 적용.** $ARGUMENTS가 비어 있지 않으면 해당 phase 번호로 시작하는 파일만 남긴다:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PADDED=$(printf "%02d" "$ARGUMENTS" 2>/dev/null || echo "$ARGUMENTS")
     FILES=$(echo "$FILES" | grep "/${PADDED}-" 2>/dev/null)
   fi
   ```
   필터 후 빈 목록이면 `No lessons found for phase $ARGUMENTS.` 출력 후 종료.

3. **각 파일 내용 출력.** 파일명을 헤더로 표시하고 내용을 출력한다:
   ```bash
   for FILE in $FILES; do
     echo "--- $FILE ---"
     cat "$FILE"
     echo ""
   done
   ```

4. **안내 메시지 출력:**
   `Lessons loaded. Run /super-gsd:sg-plan to start the next phase — prior lessons are auto-injected.`
</process>

<success_criteria>
1. .planning/lessons/ 에 파일이 있으면 내용이 출력된다.
2. 파일이 없으면 안내 메시지만 출력되고 오류 없이 종료된다.
3. phase 필터가 주어지면 해당 phase 파일만 출력된다.
</success_criteria>
