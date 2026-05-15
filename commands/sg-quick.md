---
name: sg-quick
description: Execute a small, ad-hoc task with GSD guarantees (atomic commits, STATE.md tracking). Quick mode for one-off tasks that don't need a full phase plan.
argument-hint: "<task description> [--discuss] [--research] [--validate] [--full]"
---

<objective>
Invoke gsd-quick to execute a small, ad-hoc task with GSD guarantees. Supports the same flags as gsd-quick:
- (no flags) — Plan + execute immediately. Use when you know exactly what to do.
- --discuss — Lightweight discussion phase to clarify gray areas before planning.
- --research — Spawn a research agent to investigate approaches before planning.
- --validate — Enable plan-checking and post-execution verification.
- --full — All of the above.
</objective>

<execution_context>
Self-contained. Delegates entirely to gsd-quick Skill.
</execution_context>

<process>
1. Invoke Skill: `Skill(skill="gsd-quick", args="$ARGUMENTS")`
</process>

<success_criteria>
1. gsd-quick Skill is invoked exactly once with all arguments forwarded unchanged.
</success_criteria>
