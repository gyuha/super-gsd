---
name: sg-complete
description: Complete the current milestone — invokes gsd-complete-milestone Skill.
argument-hint: "[phase] - optional. Defaults to STATE.md current phase."
---

<objective>
Resolve the target phase then invoke gsd-complete-milestone to mark the current milestone as complete.
</objective>

<execution_context>
Self-contained. Reads .planning/STATE.md for phase resolution when no argument provided. Delegates milestone completion to gsd-complete-milestone Skill (terminal action).
</execution_context>

<process>
1. **Resolve phase.** If `$ARGUMENTS` is non-empty, use it as the phase identifier. Otherwise, extract the current phase from `.planning/STATE.md`:
   ```bash
   if [ -n "$ARGUMENTS" ]; then
     PHASE_NUM="$ARGUMENTS"
   else
     PHASE_NUM=$(grep -E '^Phase: [0-9]+' .planning/STATE.md | head -1 | awk '{print $2}')
   fi
   if [ -z "$PHASE_NUM" ]; then
     echo "Could not resolve current phase. Pass phase number explicitly: /super-gsd:sg-complete <phase>"
     exit 1
   fi
   ```

0.5. **Lessons archive (milestone close).** STATE.md에서 milestone 버전을 읽고 lessons_ranker.py --archive를 실행한다. 실패해도 sg-complete를 차단하지 않는다:
   ```bash
   MILESTONE_VER=$(grep -E '^milestone:' .planning/STATE.md | head -1 | awk '{print $2}' | tr -d ' ')
   if [ -z "$MILESTONE_VER" ]; then
     echo "[warn] sg-complete: milestone version not found in STATE.md — skipping lessons archive"
   else
     echo "[sg-complete] Archiving lessons to .planning/milestones/${MILESTONE_VER}-LESSONS.md ..."
     python3 hooks/lessons_ranker.py --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
       echo "[warn] lessons archive failed — continuing"
   fi
   ```

1.5. **Record HANDOFF.md row (`complete` stage) — before invoking the Skill.**
   ```bash
   HANDOFF_FILE=".planning/HANDOFF.md"
   if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
     mkdir -p "$(dirname "$HANDOFF_FILE")"
     printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
   fi
   TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   FROM_STAGE=$(grep -E '^\| [0-9]{4}-' "$HANDOFF_FILE" | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
   [ -z "$FROM_STAGE" ] && FROM_STAGE="init"
   PHASE_PAD=$(printf "%02d" "$PHASE_NUM" 2>/dev/null || echo "$PHASE_NUM")
   PHASE_SLUG=$(ls -d .planning/phases/${PHASE_PAD}-* 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "${PHASE_PAD}")
   echo "| $TS | $PHASE_SLUG | $FROM_STAGE | complete | - |" >> "$HANDOFF_FILE"
   ```

2. **Before calling Skill, replace `$PHASE_NUM` with the actual resolved value** (e.g. `3`).
   Session control transfers to the skill; no steps execute after this point:
   ```
   Skill(skill="gsd-complete-milestone", args="$PHASE_NUM")  # replace $PHASE_NUM
   ```
</process>

<success_criteria>
1. gsd-complete-milestone Skill is invoked exactly once with the resolved phase number.
2. $ARGUMENTS is used as phase number when provided.
3. `.planning/HANDOFF.md` gains a `complete` row immediately before the Skill is invoked, enabling `/super-gsd:sg-status` to recommend `/super-gsd:sg-new` after milestone completion.
4. If phase cannot be resolved, the command exits with the prescribed error message and does not invoke the Skill.
5. Step 0.5가 STATE.md에서 milestone 버전을 읽어 lessons archive를 실행한다. 버전 읽기 실패 시 warn만 출력하고 Step 2(Skill 호출)로 진행한다.
</success_criteria>
