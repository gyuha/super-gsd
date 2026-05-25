---
name: sg-lessons
description: Use this when starting a new phase and you want to review prior lessons before planning — lists weighted lessons from .planning/lessons/ as context.
argument-hint: "[phase] - optional. If provided, show only lessons for that phase number."
---

<objective>
.planning/lessons/ 디렉토리의 모든 Markdown 파일을 읽어 순서대로 출력한다. 사용자가 /super-gsd:sg-plan을 실행하기 전에 이전 lessons를 확인하거나 컨텍스트로 활용할 수 있도록 한다.
</objective>

<execution_context>
Self-contained. Reads .planning/lessons/ directory. Writes nothing.
</execution_context>

<process>
0. **milestone 필터 확인.** $ARGUMENTS가 `--milestone=vX.Y` 또는 `milestone=vX.Y` 형식이면 milestone 아카이브 파일을 직접 읽는다:
   ```bash
   MILESTONE_ARG=$(node -e "
     const args = process.argv[2] || '';
     const m = args.match(/milestone=([^ ]+)/);
     process.stdout.write(m ? m[1] : '');
   " -- "$ARGUMENTS" 2>/dev/null)
   if [ -n "$MILESTONE_ARG" ]; then
     if ! echo "$MILESTONE_ARG" | grep -qE '^[a-zA-Z0-9._-]+$'; then
       echo "Invalid milestone argument."
       exit 1
     fi
     MILESTONE_FILE=".planning/milestones/${MILESTONE_ARG}-LESSONS.md"
     if [ ! -f "$MILESTONE_FILE" ]; then
       echo "No milestone archive found: $MILESTONE_FILE"
       echo "Run /super-gsd:sg-complete to create the archive when closing a milestone."
       exit 0
     fi
     echo "--- $MILESTONE_FILE ---"
     cat "$MILESTONE_FILE"
     echo ""
     echo "Milestone lessons loaded: $MILESTONE_ARG"
     exit 0
   fi
   ```
   milestone 필터가 없으면 기존 Step 1~4 흐름을 그대로 실행한다.

1. **Glob으로 파일 목록 수집:**
   ```bash
   FILES=$(ls .planning/lessons/*.md 2>/dev/null | sort)
   if [ -z "$FILES" ]; then
     echo "No lessons recorded yet. Run /super-gsd:sg-learn after a review to capture lessons."
     exit 0
   fi
   ```

2. **ARGUMENTS로 phase 필터 적용.** $ARGUMENTS가 비어 있지 않으면 해당 phase 번호로 시작하는 파일만 남긴다. `phase-03`, `03`, `3` 등 다양한 형식을 숫자로 정규화한다:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     ARG_NUM=$(node -e "
       const args = process.argv[2] || '';
       const m = args.match(/([0-9]+)/);
       process.stdout.write(m ? m[1] : '');
     " -- "$ARGUMENTS" 2>/dev/null)
     if [ -z "$ARG_NUM" ]; then
       echo "Invalid phase argument: '$ARGUMENTS'. Use a number (e.g. 3 or 03 or phase-03)."
       exit 1
     fi
     PADDED=$(printf "%02d" "$ARG_NUM")
     FILES=$(echo "$FILES" | grep "/${PADDED}-")
     if [ -z "$FILES" ]; then
       echo "No lessons found for phase $ARGUMENTS."
       exit 0
     fi
   fi
   ```

3. **각 파일 내용 출력.** 파일명을 헤더로 표시하고 내용을 출력한다:
   ```bash
   while IFS= read -r FILE; do
     echo "--- $FILE ---"
     cat "$FILE"
     echo ""
   done <<< "$FILES"
   ```

4. **안내 메시지 출력:**
   `Lessons loaded. Run /super-gsd:sg-plan to start the next phase — prior lessons are auto-injected.`
</process>

<success_criteria>
1. .planning/lessons/ 에 파일이 있으면 내용이 출력된다.
2. 파일이 없으면 안내 메시지만 출력되고 오류 없이 종료된다.
3. phase 필터가 주어지면 해당 phase 파일만 출력된다.
4. 필터 후 결과가 없으면 "No lessons found for phase..." 메시지를 출력하고 오류 없이 종료된다.
5. --milestone=vX.Y 인수가 있으면 .planning/milestones/vX.Y-LESSONS.md를 읽어 출력한다.
6. milestone 아카이브 파일이 없으면 안내 메시지를 출력하고 오류 없이 종료된다.
</success_criteria>
