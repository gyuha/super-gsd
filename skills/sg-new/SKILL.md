---
name: sg-new
description: Use this when a milestone is complete and a new one should begin — invokes gsd-new-milestone, then recommends sg-plan for the next phase.
argument-hint: "[milestone-name] - optional. Passed through to gsd-new-milestone."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Invoke gsd-new-milestone Skill to start a new milestone, then display the super-gsd next-command recommendation (sg-plan) so the user continues in the super-gsd pipeline instead of falling back to raw GSD commands.
</objective>

<execution_context>
Self-contained. Forwards $ARGUMENTS unchanged to gsd-new-milestone Skill, then appends a super-gsd recommendation block.
</execution_context>

<process>
1. Invoke gsd-new-milestone (runs the full milestone setup workflow):
   ```
   Skill(skill="gsd-new-milestone", args="$ARGUMENTS")
   ```

2. After gsd-new-milestone completes, detect the first not-started phase under the new milestone section in ROADMAP.md and recommend sg-plan:
   ```bash
   NEXT_PHASE=$(node -e "
   try{
     const fs=require('fs');
     const state=fs.readFileSync('.planning/STATE.md','utf8');
     const ms=(state.match(/^milestone:\s*[\"']?([^\"'\s\n]+)[\"']?/m)||[])[1]||'';
     if(!ms)process.exit(0);
     const lines=fs.readFileSync('.planning/ROADMAP.md','utf8').split('\n');
     let found=false;
     for(const l of lines){
       if(l.startsWith('### '+ms+' ')){found=true;continue;}
       if(found&&l.startsWith('### '))break;
       if(found&&/^- \[ \] \*\*Phase /.test(l)){
         const m=l.match(/Phase (\d+)/);
         if(m){process.stdout.write(m[1]);break;}
       }
     }
   }catch(e){}
   " 2>/dev/null)
   ```

   If `NEXT_PHASE` is empty (no STATE.md, no ROADMAP.md, or no not-started phase under the current milestone section), skip the recommendation block silently — no error output.

   Otherwise display exactly:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    super-gsd ▶ NEXT (recommended)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   /clear

   /super-gsd:sg-plan ${NEXT_PHASE}   ← lessons injection + discuss + plan auto-chain (recommended)

   or:
     /super-gsd:sg-next                 auto-advance (HANDOFF/STATE-based routing)
     /gsd-discuss-phase ${NEXT_PHASE}   raw GSD discuss only
     /gsd-plan-phase ${NEXT_PHASE}      raw GSD plan only
   ```
</process>

<success_criteria>
1. gsd-new-milestone Skill is invoked exactly once with $ARGUMENTS passed through unchanged.
2. After gsd-new-milestone completes and ROADMAP.md exists with at least one not-started Phase under the current milestone section (`### vX.Y ...`), the super-gsd ▶ NEXT block is displayed with the correct phase number.
3. If STATE.md/ROADMAP.md is missing or no not-started phase exists under the current milestone, no recommendation is displayed (no error output).
</success_criteria>
