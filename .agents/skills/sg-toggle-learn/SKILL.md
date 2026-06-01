---
name: sg-toggle-learn
description: Toggle the sg-learn stage on or off in the super-gsd workflow by flipping super_gsd.skip_learn in .planning/config.json. Accepts on|off, or no argument to flip.
argument-hint: "[on|off] - 'on' includes learn, 'off' skips it, empty flips the current state."
---

<language>
Detect the user's input language and respond in that language throughout this skill's output.
- Korean input → respond in Korean
- English input → respond in English
- Mixed input → match the dominant language
</language>

<constraints>
## Platform Constraints (Codex / Gemini CLI / Antigravity CLI)
- Self-contained: reads and writes only .planning/config.json. No Superpowers/GSD integration needed.
- Refer to sibling skills with the `$sg-*` invocation syntax (Codex/Gemini do not support `/super-gsd:` slash commands).
</constraints>

<execution_context>
Self-contained. Reads and writes .planning/config.json only. Does not touch HANDOFF.md or any other workflow file.
</execution_context>

<process>
1. **Parse the desired state from $ARGUMENTS.**
   ```bash
   ARG=$(printf '%s' "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
   case "$ARG" in
     on|enable|true|include)  DESIRED="on" ;;
     off|disable|false|skip)  DESIRED="off" ;;
     "")                      DESIRED="toggle" ;;
     *) echo "Unknown argument '$ARGUMENTS'. Use: on | off | (empty to toggle)."; exit 1 ;;
   esac
   ```

2. **Read-modify-write config.json (macOS compatible — node only, no jq).**
   The underlying flag is `skip_learn` (inverted: learn ON ⇒ skip_learn=false).
   ```bash
   RESULT=$(DESIRED="$DESIRED" node -e '
   const fs=require("fs"), path=require("path");
   const p=path.join(process.cwd(),".planning","config.json");
   let cfg={};
   try{cfg=JSON.parse(fs.readFileSync(p,"utf-8"));}catch(e){cfg={};}
   cfg.super_gsd=cfg.super_gsd||{};
   const cur=!!cfg.super_gsd.skip_learn;
   const d=process.env.DESIRED;
   let skip; if(d==="on")skip=false; else if(d==="off")skip=true; else skip=!cur;
   cfg.super_gsd.skip_learn=skip;
   fs.mkdirSync(path.dirname(p),{recursive:true});
   fs.writeFileSync(p, JSON.stringify(cfg,null,2)+"\n");
   const tdd=!!cfg.super_gsd.tdd_mode, sr=!!cfg.super_gsd.skip_review, sl=skip;
   const seq=["execute"]; if(tdd)seq.push("tdd"); if(!sr)seq.push("review"); if(!sl)seq.push("learn"); seq.push("ship");
   process.stdout.write((skip?"off":"on")+"\t"+seq.join(" → "));
   ' 2>/dev/null)
   if [ -z "$RESULT" ]; then echo "Failed to update .planning/config.json"; exit 1; fi
   STATE=$(printf '%s' "$RESULT" | cut -f1)
   PATHSEQ=$(printf '%s' "$RESULT" | cut -f2)
   echo "learn:$STATE"
   echo "path:$PATHSEQ"
   ```

3. **Report the new state in the user's language.**
   Surface the result as prose in the user's input language. Keep the command token `$sg-learn`, the flag name `skip_learn`, and the stage sequence tokens (`execute → … → ship`) verbatim.
   - When `STATE=on`: tell the user the `$sg-learn` stage is now **included** in the workflow.
   - When `STATE=off`: tell the user the `$sg-learn` stage is now **skipped**.
   - Always show the resulting workflow sequence from `path:` so the user can confirm.
</process>

<success_criteria>
1. With no argument, `super_gsd.skip_learn` is flipped relative to its current value (absent treated as false).
2. With `on`/`off`, the stage is set to included/skipped respectively (skip_learn=false/true), regardless of prior value (idempotent).
3. Existing config.json keys and 2-space indentation are preserved; `.planning/config.json` is created if absent.
4. The new stage state and the resulting `execute → … → ship` sequence are reported in the user's language, with command/flag/stage tokens verbatim.
5. HANDOFF.md and all other workflow files are untouched.
</success_criteria>
</content>
