---
name: sg-toggle-tdd
description: Toggle the sg-tdd stage on or off in the super-gsd workflow. Flips super_gsd.tdd_mode in .planning/config.json so sg-next / sg-status / the stop hook include or skip TDD verification after execute. Accepts on|off, or no argument to flip.
argument-hint: "[on|off] - 'on' enables TDD, 'off' disables it, empty flips the current state."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<objective>
Enable or disable the sg-tdd stage in the super-gsd workflow by writing the super_gsd.tdd_mode boolean in .planning/config.json. ON means TDD runs after execute (tdd_mode=true); OFF means TDD is skipped (tdd_mode=false, the default). With no argument, flip the current value. All other config keys and 2-space formatting are preserved.
</objective>

<execution_context>
Self-contained. Reads and writes .planning/config.json only. Does not touch HANDOFF.md or any other workflow file.
</execution_context>

<process>
1. **Parse the desired state from $ARGUMENTS.**
   ```bash
   ARG=$(printf '%s' "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
   case "$ARG" in
     on|enable|true)   DESIRED="on" ;;
     off|disable|false) DESIRED="off" ;;
     "")               DESIRED="toggle" ;;
     *) echo "Unknown argument '$ARGUMENTS'. Use: on | off | (empty to toggle)."; exit 1 ;;
   esac
   ```

2. **Read-modify-write config.json (macOS compatible — node only, no jq).**
   The underlying flag is `tdd_mode` (non-inverted: TDD ON ⇒ tdd_mode=true). The effective post-implementation sequence is printed for confirmation.
   ```bash
   RESULT=$(DESIRED="$DESIRED" node -e '
   const fs=require("fs"), path=require("path");
   const p=path.join(process.cwd(),".planning","config.json");
   let cfg={};
   try{cfg=JSON.parse(fs.readFileSync(p,"utf-8"));}catch(e){cfg={};}
   cfg.super_gsd=cfg.super_gsd||{};
   const cur=!!cfg.super_gsd.tdd_mode;
   const d=process.env.DESIRED;
   let val; if(d==="on")val=true; else if(d==="off")val=false; else val=!cur;
   cfg.super_gsd.tdd_mode=val;
   fs.mkdirSync(path.dirname(p),{recursive:true});
   fs.writeFileSync(p, JSON.stringify(cfg,null,2)+"\n");
   const tdd=val, sr=!!cfg.super_gsd.skip_review, sl=!!cfg.super_gsd.skip_learn;
   const seq=["execute"]; if(tdd)seq.push("tdd"); if(!sr)seq.push("review"); if(!sl)seq.push("learn"); seq.push("ship");
   process.stdout.write((val?"on":"off")+"\t"+seq.join(" → "));
   ' 2>/dev/null)
   if [ -z "$RESULT" ]; then echo "Failed to update .planning/config.json"; exit 1; fi
   STATE=$(printf '%s' "$RESULT" | cut -f1)
   PATHSEQ=$(printf '%s' "$RESULT" | cut -f2)
   echo "tdd:$STATE"
   echo "path:$PATHSEQ"
   ```

3. **Report the new state in the user's language.**
   Surface the result as prose in the user's input language. Keep the command token `sg-tdd`, the flag name `tdd_mode`, and the stage sequence tokens (`execute → … → ship`) verbatim in English.
   - When `STATE=on`: tell the user the `sg-tdd` stage is now **enabled** (runs after execute).
   - When `STATE=off`: tell the user the `sg-tdd` stage is now **skipped** (the default).
   - Always show the resulting workflow sequence from `path:` so the user can confirm.
</process>

<success_criteria>
1. With no argument, `super_gsd.tdd_mode` is flipped relative to its current value (absent treated as false).
2. With `on`/`off`, `tdd_mode` is set to true/false respectively, regardless of prior value (idempotent).
3. Existing config.json keys and 2-space indentation are preserved; `.planning/config.json` is created if absent.
4. The new stage state and the resulting `execute → … → ship` sequence are reported in the user's language, with command/flag/stage tokens verbatim.
5. HANDOFF.md and all other workflow files are untouched.
</success_criteria>
</content>
</invoke>
