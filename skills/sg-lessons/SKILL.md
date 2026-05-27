---
name: sg-lessons
description: Use this when starting a new phase and you want to review prior lessons before planning — lists weighted lessons from .planning/lessons/ as context.
argument-hint: "[phase] - optional. If provided, show only lessons for that phase number."
---

<objective>
Read all Markdown files in the .planning/lessons/ directory and print them in order. Allows the user to review prior lessons or use them as context before running /super-gsd:sg-plan.
</objective>

<execution_context>
Self-contained. Reads .planning/lessons/ directory. Writes nothing.
</execution_context>

<process>
0. **Milestone filter check.** If $ARGUMENTS matches the `--milestone=vX.Y` or `milestone=vX.Y` format, read the milestone archive file directly:
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
   If no milestone filter, continue with the existing Step 1–4 flow.

1. **Collect file list via glob:**
   ```bash
   FILES=$(ls .planning/lessons/*.md 2>/dev/null | sort)
   if [ -z "$FILES" ]; then
     echo "No lessons recorded yet. Run /super-gsd:sg-learn after a review to capture lessons."
     exit 0
   fi
   ```

2. **Apply phase filter from ARGUMENTS.** If $ARGUMENTS is non-empty, keep only files starting with that phase number. Normalize various formats like `phase-03`, `03`, `3` to a number:
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

3. **Print each file's content.** Display filename as header then print content:
   ```bash
   while IFS= read -r FILE; do
     echo "--- $FILE ---"
     cat "$FILE"
     echo ""
   done <<< "$FILES"
   ```

4. **Print guidance message:**
   `Lessons loaded. Run /super-gsd:sg-plan to start the next phase — prior lessons are auto-injected.`
</process>

<success_criteria>
1. If files exist in .planning/lessons/, their content is printed.
2. If no files exist, only a guidance message is printed and execution exits without error.
3. If a phase filter is provided, only files for that phase are printed.
4. If no results remain after filtering, a "No lessons found for phase..." message is printed and execution exits without error.
5. If --milestone=vX.Y argument is provided, .planning/milestones/vX.Y-LESSONS.md is read and printed.
6. If the milestone archive file does not exist, a guidance message is printed and execution exits without error.
</success_criteria>
