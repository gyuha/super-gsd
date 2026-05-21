# Pitfalls Research — v1.4 Parallel Agent Execution

**Domain:** Claude Code plugin — adding parallel agent execution to sg-execute
**Researched:** 2026-05-21
**Scope:** 7 specific failure modes when parallelizing PLAN.md task execution via independent subagents
**Confidence:** HIGH (Claude Code official docs, worktree patterns), MEDIUM (multi-agent failure research)

---

## Critical Pitfalls

### Pitfall 1: Git conflicts — two agents modify the same file

**What goes wrong:** Two agents receive tasks that are classified as "independent" at the PLAN.md analysis level but both write to a shared file at runtime. Examples that happen constantly in practice:

- Agent A adds a function to `hooks/rule_runner.py`. Agent B adds a different function to the same file. Worktrees prevent filesystem collision, but the merge step produces an unresolvable conflict when both branches are integrated.
- Both agents update `CHANGELOG.md` or `plugin.json` version fields as part of their task completion.
- Two agents both write to `.planning/HANDOFF.md` (see Pitfall 2).
- Agent A creates a new command and adds its entry to `plugin.json`. Agent B does the same. Both edits are at different line numbers, but `git merge` cannot choose between two valid orderings.

**Why it happens:** Task dependency analysis from PLAN.md operates on task descriptions, not file-level write surfaces. A task described as "implement TE-01 dependency analyzer" and "implement TE-02 parallel runner" sounds independent, but if the implementor puts both in the same file, the conflict is invisible to the orchestrator.

**Consequences:** Integration merge requires human intervention. In the worst case, the orchestrator attempts automated merge and produces silently corrupt output (git merge succeeds syntactically but the resulting code is wrong). The phase is blocked until conflicts are resolved.

**Prevention:**

The only prevention that actually works is **file-level task partitioning enforced before agents start**, not detected after. Implementation strategy:

1. The dependency analyzer (TE-01) must output a file manifest per task group, not just task names.
2. Before launching agents, check file manifest intersection: if any two groups share a file in their write surface, either merge those groups or split one task so the shared file belongs exclusively to one group.
3. Shared files that cannot be assigned exclusively (e.g., `plugin.json`, `HANDOFF.md`, `CHANGELOG.md`) must be flagged as **integration-only files** — no agent writes them during parallel execution. The orchestrator writes them after all agents complete.

**Warning signs:**
- PLAN.md tasks that both touch "configuration files" or "registration files"
- Multiple tasks that each add a new entry to the same list/table
- Any task described as "update X to support Y" where X is a central registry

**Implementation phase:** TE-01 (dependency analyzer) — file manifest extraction must be part of the analyzer, not optional. This is a design constraint, not a nice-to-have.

---

### Pitfall 2: State corruption — HANDOFF.md concurrent writes

**What goes wrong:** `.planning/HANDOFF.md` is an append-only file read by `stop_hook.py` to determine current workflow stage. If two agents both complete and both attempt to append a row simultaneously, several bad outcomes are possible:

- **Interleaved bytes:** If both agents write via `echo >> file` (the current sg-execute implementation), the OS may interleave the two writes. The resulting file has a single row that is a byte-level mix of both, which is not valid pipe-delimited Markdown. `stop_hook.py` reads the last row and gets garbage.
- **Lost write:** One agent's append silently disappears because the other's write replaced the file offset both were targeting.
- **Row ordering violation:** Both agents write valid rows, but the last row seen by `stop_hook.py` reflects whichever agent finished last — not the orchestrator's intended final state.

The current `echo >> .planning/HANDOFF.md` pattern in sg-execute step 8 has zero locking. With a single agent this is safe. With two or more agents completing near-simultaneously, it is a race condition.

**Why it happens:** `echo >>` (append redirect) on most Unix filesystems is atomic only if the write is under the pipe buffer size (typically 4096 bytes for Linux, 512 bytes for macOS POSIX requirement). A single HANDOFF.md row is under this limit, so in practice the OS will usually keep writes atomic. However, "usually" is not "always," and more importantly: even with atomic writes, the **order of rows** is non-deterministic when two agents race.

**Consequences:** `stop_hook.py` reads the wrong last row and displays the wrong next-step guidance. The `sg-status` command shows an incorrect stage. In edge cases, the idempotency check in sg-execute reads a corrupted Plan Hash and either wrongly skips a re-handoff or incorrectly re-triggers one.

**Prevention:**

1. **Only the orchestrator writes to HANDOFF.md.** Parallel agents must not write to HANDOFF.md. Instead, agents write their results to a per-agent scratch file (e.g., `.planning/phases/<phase>/agent-<N>-result.md`). The orchestrator reads all scratch files after agents complete and writes a single consolidated HANDOFF.md row.
2. If agents must write to HANDOFF.md (simpler implementation), use a lock file: `flock .planning/HANDOFF.md.lock -c 'echo "| ..." >> .planning/HANDOFF.md'`. This requires the `flock` utility which is available on Linux and macOS with coreutils.
3. The integration step (TE-04) owns HANDOFF.md writes. No TE-02/TE-03 agent code should reference HANDOFF.md.

**Warning signs:**
- Any agent prompt that includes the phrase "append to HANDOFF.md"
- Parallel agent code that copies the step 8 pattern from sg-execute verbatim
- HANDOFF.md rows whose timestamps are identical or within 1 second of each other

**Implementation phase:** TE-04 (result integration) — HANDOFF.md write must happen only in the integration step, after all agents return.

---

### Pitfall 3: Task dependency violations — agent starts B before A completes

**What goes wrong:** The dependency analyzer classifies tasks into independent groups and dependent sequences. A group classified as "independent" launches all agents simultaneously. But the analysis is based on PLAN.md text, not execution semantics. Two categories of hidden dependencies that the analyzer will systematically miss:

**Category A — Output-input dependencies:** Task B requires a file, function, or module that Task A will create. If the analyzer sees no explicit "B depends on A" annotation in PLAN.md, it classifies them as independent. Agent B starts, finds the file missing, either fails or hallucinates a stub.

**Category B — Semantic ordering constraints:** Task A is "create the TaskGraph data structure." Task B is "implement task scheduling using TaskGraph." PLAN.md may describe both tasks with no dependency link if the author assumed sequential execution. The analyzer has no way to infer that `TaskGraph` is a new artifact created by A, not an existing module.

**Why it happens:** PLAN.md is written for sequential execution. Dependency annotations (if any) are added for human readers, not machine parsing. The analyzer must infer dependencies from textual descriptions, which is an imperfect, low-confidence classification task.

**Consequences:** Agent B fails mid-task when it discovers the precondition is missing. Or worse: Agent B succeeds by making incorrect assumptions about A's output format, producing code that is syntactically valid but semantically incompatible. Integration then produces a silent functional bug, not a merge conflict.

**Prevention:**

1. **Require explicit dependency markers in PLAN.md.** Define a convention: `depends: [task-id]` frontmatter or a `## Dependencies` section in each task block. The analyzer only classifies a task as independent if it has zero dependency markers AND a file-manifest check confirms no shared write surfaces. Without explicit markers, default to sequential.
2. **Strict conservative classification:** When uncertain, classify as dependent. The cost of false sequential classification is slower execution. The cost of false parallel classification is broken builds and debugging time. Always prefer the conservative error.
3. **Dry-run validation:** Before launching agents, simulate the dependency graph: for each task, enumerate what it reads and what it creates. If task B reads something that only task A creates, flag it. This requires the analyzer to have file-surface awareness, not just task-name awareness.

**Warning signs:**
- Tasks with verbs like "implement X using Y" where Y doesn't exist yet
- Tasks that reference data structures, modules, or APIs defined by a sibling task
- PLAN.md written before parallel execution existed (all v1.0–v1.3 plans) — these have zero dependency annotations

**Implementation phase:** TE-01 (dependency analyzer) — this is the core algorithmic problem. The analyzer must default to sequential and require affirmative evidence of independence, not assume independence and require evidence of dependency.

---

### Pitfall 4: Context bloat — each agent duplicates full project context

**What goes wrong:** Each parallel agent in Claude Code receives its own context window. To execute a task, an agent needs: the task description, success criteria, relevant files, and enough project context to understand conventions. If the orchestrator naively injects the entire sg-execute prompt (all PLAN.md bodies, all REQ-IDs, ROADMAP goals) into each agent, every agent carries O(N) context for N tasks — most of which is irrelevant to its specific assignment.

Concrete numbers: sg-execute's current prompt for a 3-task phase is roughly 2,000–4,000 tokens. With 3 parallel agents each receiving the full prompt, that is 6,000–12,000 tokens just for context injection before any work begins. As phase complexity grows, this becomes the dominant cost factor.

**Why it happens:** The simplest implementation of "spawn an agent" is to pass it the same prompt the orchestrator has. This requires zero additional engineering. The cost is invisible until bills arrive or context limits are hit.

**Consequences:** 3× to N× token cost with no proportional benefit. In extreme cases, an agent's context window fills up with cross-task information, leaving insufficient space for the actual implementation (file reads, edit operations, test output). The agent starts truncating tool output to fit, producing incomplete work.

**Prevention:**

1. **Per-agent minimal context:** Each agent receives only: (a) its own task block from PLAN.md, (b) the REQ-IDs relevant to that task, (c) the phase goal and success criteria, (d) a short conventions summary (≤200 tokens: non-invasive, append-only HANDOFF, macOS awk rules). Everything else is excluded.
2. **Reference, don't paste:** Instead of embedding file contents, instruct the agent to read specific files by path. The agent reads only what it actually needs.
3. **Registry mode for orchestrator:** The orchestrator maintains a lightweight summary of each agent's claimed task and status (≤100 tokens per agent). Full context lives inside each agent's own window.

**Warning signs:**
- Agent prompt construction that copies the full sg-execute blob and appends "you handle task 2"
- Agent prompts that include PLAN.md bodies for tasks other than the agent's own
- Token counts per agent that are >50% of the single-agent execution cost

**Implementation phase:** TE-02/TE-03 (agent spawning and count determination) — the prompt construction logic must be written with per-task scoping from day one.

---

### Pitfall 5: False independence — tasks that conflict at runtime, not at analysis time

**What goes wrong:** The dependency analyzer correctly identifies that tasks A, B, C have no declared dependencies on each other. They are classified as independent. Agents are launched in parallel. All three agents complete without errors. Integration fails because:

- Agent A added a test fixture to `tests/conftest.py`. Agent B added a different test fixture to the same file. Neither task description mentioned `conftest.py` — both said "add tests for X."
- Agent A created `hooks/new_runner.py` as a new file. Agent B also created `hooks/new_runner.py` for a completely different purpose. Same filename, different content, both valid in isolation.
- Agent A updated the README to document feature X in section 3. Agent B updated the README to document feature Y, also in section 3. Both edits target the same line range.
- Agent A created a git commit. Agent B also created a git commit. Now the branch has two commits with non-linear history from a single logical phase.

**Why it happens:** False independence has two sources: (1) tasks share implicit write surfaces that their descriptions don't mention, and (2) tasks share output naming conventions that produce collisions. The first is detectable with file-surface analysis. The second requires knowing the implementation choices agents will make, which is unknowable in advance.

**Consequences:** Integration step discovers conflicts that were invisible at planning time. The orchestrator must either resolve them manually or abort and restart sequentially. The wasted parallel execution cost is unrecoverable.

**Prevention:**

1. **Reserved file registry:** Before launching agents, establish a registry of files each agent is allowed to create or modify. Agents that attempt to create a file not in their registry either request permission from the orchestrator or abort their specific sub-task.
2. **Convention-based naming:** For files agents create (new modules, new test files), enforce a naming convention that includes the task identifier: `hooks/te01_analyzer.py`, not `hooks/analyzer.py`. This prevents two agents from independently picking the same filename.
3. **Integration-only files:** Identify files that aggregate contributions from multiple tasks (README, CHANGELOG, plugin.json, any `__init__.py` that imports new modules) and prohibit agents from writing them. These files are written by the orchestrator during TE-04 integration.
4. **Accept residual false-independence risk.** File-surface analysis catches ~80% of false independence cases. The remaining ~20% (shared implicit output naming, shared test infrastructure) will only be caught at integration. Design TE-04 to handle this gracefully rather than trying to eliminate it.

**Warning signs:**
- Tasks that say "add tests" without specifying test file locations
- Tasks that say "update documentation" without specifying which section
- Multiple tasks that create new Python modules in the same package directory
- Any task set where more than 2 tasks touch the same directory

**Implementation phase:** TE-01 and TE-04 — TE-01 must produce a file manifest, TE-04 must be designed to handle residual conflicts as a normal case, not an exceptional one.

---

## Moderate Pitfalls

### Pitfall 6: Recovery — one of N agents fails mid-task

**What goes wrong:** Three agents run in parallel. Agent 1 completes successfully. Agent 2 completes successfully. Agent 3 fails at 60% completion — it edited three files, ran into an error, and stopped. The question is: can Agents 1 and 2's work be preserved while replaying Agent 3?

The answer depends entirely on design choices made before execution:

- **If agents work in shared worktree with no isolation:** Agent 3's partial changes are intermixed with Agents 1 and 2's changes. There is no clean way to identify which uncommitted edits belong to Agent 3. The only safe recovery is `git restore .` (loses everything) or manual file-by-file triage.
- **If each agent works in its own branch or worktree:** Agent 3's branch contains only Agent 3's changes. The branch can be reset or deleted without touching Agents 1 and 2. Agent 3 restarts on a clean branch.
- **If the orchestrator has no checkpoint mechanism:** There is no record of which tasks completed. After any failure, the orchestrator must re-analyze from scratch, risking re-running completed tasks.

**Why it happens:** Parallel execution creates partial completion states that do not exist in sequential execution. Sequential execution either completes or fails cleanly. Parallel execution can complete 2/3 of a phase and fail 1/3 in a state that is difficult to inspect or recover.

**Consequences:** Without isolation and checkpointing, a single agent failure forces a full phase restart, wasting the work of successful agents. This eliminates any speed benefit from parallelism when failure rates are non-trivial. LLM agents fail more often than deterministic code — 10–30% per complex task is realistic.

**Prevention:**

1. **Branch-per-agent isolation (non-negotiable):** Each agent operates on its own branch (or git worktree). On failure, the agent's branch is reset. On success, the branch is merged by the orchestrator.
2. **Per-task completion checkpoints:** After each agent completes, the orchestrator writes a checkpoint: task ID, agent branch name, success/failure, commit SHA. This is written before integration. On restart, the orchestrator reads the checkpoint and skips completed tasks.
3. **Partial-success integration:** TE-04 must handle the case where 2 of 3 agents succeeded. It integrates the two successful branches and marks the failed task for sequential retry. The phase is not declared failed until at least one retry has been attempted.
4. **Idempotent agent prompts:** Agent prompts must produce the same output if re-run from scratch. If Agent 3 partially created a file and is re-run, it must be able to detect and overwrite the partial work, not append to it.

**Warning signs:**
- Agent spawning code that does not create a branch per agent
- No checkpoint file written after each agent completes
- Integration code that assumes all N agents either all succeed or all fail
- Agent prompts that append to shared files incrementally (cannot be replayed safely)

**Implementation phase:** TE-02 (agent spawning) — branch isolation must be built into spawning. TE-04 (integration) — partial-success handling must be explicitly designed.

---

### Pitfall 7: Cost/speed tradeoff — when parallelism actively hurts

**What goes wrong:** The assumption is that N parallel agents complete work N times faster. This is false in all but the most ideal conditions. The actual speedup is:

```
speedup = sequential_time / (slowest_parallel_agent_time + integration_overhead)
```

Where integration overhead includes: merge time, conflict resolution, code review across N branches, and coordination messages between orchestrator and agents.

Parallelism hurts (net negative) when:

- **Tasks are small:** If each task takes 2 minutes sequentially and integration takes 5 minutes, 3 parallel agents take 7 minutes total vs. 6 minutes sequential. You paid 3× the tokens for a 1-minute slowdown.
- **One agent is a bottleneck:** If Task A takes 10 minutes and Tasks B and C take 2 minutes each, the speedup is 10 minutes (limited by A) vs. 14 minutes sequential. Parallelism saves 4 minutes but cost 3× tokens. The token/minute tradeoff may not be worth it.
- **High false-independence rate:** If 30% of "independent" tasks turn out to conflict, the integration step repeatedly fails and restarts. Total time: parallel execution time + integration failures + sequential re-runs. Often worse than pure sequential.
- **The phase has 2 tasks:** With 2 tasks, the overhead of branch creation, agent context injection, coordination, and merge typically exceeds the sequential time saved. The breakeven for parallelism is approximately 3 tasks, each taking >5 minutes, with genuine independence.

Quantified cost from community observations: running 5 parallel agents consumes approximately 5× the tokens of a single agent over the same clock time. If the speedup is 2×, the cost-per-unit-of-work is 2.5× higher. This is often not a good trade.

**Why it happens:** Parallelism has visible speed benefits and invisible cost and complexity costs. The feature is built because "faster" is an obvious positive. The token cost, integration overhead, and failure recovery costs are discovered later.

**Consequences:** Phases that should run in 10 minutes sequentially now take 15 minutes with parallel execution due to coordination overhead, while costing 3× more. Users disable the parallel feature after experiencing this, which means the feature investment provides no value.

**Prevention:**

1. **Minimum parallelism threshold:** Only parallelize when: (a) there are ≥ 3 genuinely independent tasks, AND (b) each task is estimated to take > 5 minutes (proxied by PLAN.md task complexity), AND (c) the phase has ≥ 3 tasks that pass the file-manifest independence check.
2. **Default to sequential.** The user must explicitly opt into parallel execution (`--parallel` flag or config setting). Do not enable it by default. The failure modes are too costly for a default-on feature.
3. **Agent count cap at 3.** Community data shows coordination overhead dominates benefit beyond 3 parallel agents for typical development tasks. Hard cap TE-03's output at 3 agents regardless of independent group count.
4. **Cost visibility:** Before launching parallel agents, display the estimated token cost multiplier so users can make an informed choice.

**Warning signs:**
- TE-03 returning N > 3 agent groups from a phase with 4–5 small tasks
- No mechanism for users to override parallel execution back to sequential
- Parallel execution enabled for phases with tasks that take < 3 minutes each
- No cost estimate displayed before spawning agents

**Implementation phase:** TE-03 (agent count determination) — the decision algorithm must have conservative defaults and hard caps. The feature should be opt-in.

---

## Minor Pitfalls

### Pitfall 8: Orchestrator context growth during multi-agent coordination

**What goes wrong:** The orchestrator agent that manages parallel workers must receive status updates from each agent. With naive implementation, the orchestrator's context accumulates: the initial prompt, all agent results, all error messages, and all inter-agent coordination messages. For a 3-agent phase, the orchestrator context grows to 3× the size of a single-agent context by the time integration begins. If any agent produces verbose output (test results, error traces), the orchestrator may hit context limits before integration completes.

**Prevention:** Agent results should be written to scratch files and the orchestrator reads summaries only (task ID, success/fail, branch name, key outputs). Full output lives in the scratch file, not in the orchestrator's message history.

**Implementation phase:** TE-04 — define the agent result schema before any agent code is written. Agents must write structured results, not verbose prose.

---

### Pitfall 9: PLAN.md written for sequential execution — no task IDs, no file manifest

**What goes wrong:** All PLAN.md files written for phases 1–13 (and future phases written before parallel support exists) have no task IDs, no dependency annotations, and no file manifest. The TE-01 analyzer must parse free-form Markdown to extract tasks, which is inherently ambiguous. It may split a single logical task into two "independent" items or merge two independent tasks into one group.

**Prevention:** Define a PLAN.md convention extension for v1.4: tasks may optionally include `task-id:`, `depends:`, and `writes:` frontmatter fields. The analyzer uses these when present. When absent, it uses heuristic parsing with conservative (sequential) defaults. Do not require retrofitting existing PLAN.md files.

**Implementation phase:** TE-01 — the convention must be documented before any plans are written for v1.4 phases.

---

### Pitfall 10: Superpowers:executing-plans is not designed for parallel invocation

**What goes wrong:** sg-execute currently ends by invoking `superpowers:executing-plans` as a single skill call with the full phase prompt. Parallel execution changes this: multiple agents must each invoke Superpowers (or equivalent) for their individual task subsets. But Superpowers is a sequential skill — it processes one plan from start to finish and writes to `.planning/STATE.md`. Multiple simultaneous Superpowers invocations would produce conflicting STATE.md writes.

**Why it happens:** The current architecture is 1 phase → 1 Superpowers invocation → 1 STATE.md write. Parallel execution requires N simultaneous executions, which violates Superpowers' design assumptions.

**Consequences:** If parallel agents each attempt `Skill(skill="superpowers:executing-plans", args=...)`, the results are non-deterministic. STATE.md reflects whichever invocation wrote last.

**Prevention:** Parallel agents must NOT invoke `superpowers:executing-plans`. Instead, parallel agents implement their tasks directly using standard Claude Code tools (Read, Edit, Write, Bash). The orchestrator invokes Superpowers exactly once for the integration/review step after all agents complete. This is a fundamental architecture decision for TE-02.

**Implementation phase:** TE-02 — agent prompt design must explicitly exclude Superpowers invocation. This is a hard constraint, not a style preference.

---

## Phase-Specific Warning Table

| Implementation Step | Likely Pitfall | Severity | Mitigation |
|---------------------|----------------|----------|------------|
| TE-01: dependency analyzer | Classifies semantically dependent tasks as independent due to missing annotations | CRITICAL | Default to sequential; require affirmative evidence of independence |
| TE-01: dependency analyzer | File-manifest intersection not checked; only task names compared | HIGH | Analyzer must produce file manifest per group, check intersections |
| TE-01: PLAN.md parsing | Free-form text parsing produces wrong task splits | HIGH | Conservative heuristics; expose parsed groups for user confirmation before spawning |
| TE-02: agent spawning | No branch-per-agent isolation; partial failures contaminate shared workspace | CRITICAL | Each agent must operate on its own branch; non-negotiable |
| TE-02: agent spawning | Agent receives full phase prompt instead of per-task context | HIGH | Scope agent context to its own task block only |
| TE-02: agent spawning | Agent invokes superpowers:executing-plans | CRITICAL | Prohibit Superpowers invocation from parallel agents |
| TE-03: agent count | Count > 3 for typical phases; coordination overhead exceeds benefit | MEDIUM | Hard cap at 3; default-off; opt-in only |
| TE-03: agent count | Parallelism triggered for < 3 small tasks | MEDIUM | Minimum threshold: ≥ 3 tasks, each estimated complex |
| TE-04: integration | HANDOFF.md written by multiple agents simultaneously | HIGH | Only orchestrator writes HANDOFF.md, after all agents complete |
| TE-04: integration | Integration assumes all agents succeed; no partial-success path | HIGH | Handle 2-of-3 success explicitly; failed task → sequential retry |
| TE-04: integration | Agent results passed as in-context messages; orchestrator context bloat | MEDIUM | Agents write results to scratch files; orchestrator reads summaries |
| Cross-cutting | Feature enabled by default | HIGH | Parallel execution opt-in only (`--parallel` flag or config) |
| Cross-cutting | No cost estimate before spawning | MEDIUM | Display token multiplier estimate before user confirms parallel launch |

---

## Non-Technical Pitfall: The "Faster Is Better" Fallacy

The most dangerous pitfall is not technical — it is the assumption that parallelism is always beneficial. The evidence from multi-agent research and community practice consistently shows:

**Parallelism is net positive when:** tasks are genuinely independent (verified by file manifest), each task takes ≥ 5 minutes, there are 3–4 tasks in the group, and the team can afford N× token cost.

**Parallelism is net negative when:** tasks have hidden dependencies, integration failures require restarts, tasks are small, or the token cost cannot be justified by the time savings.

The honest recommendation for sg-execute v1.4: implement parallel execution as a well-designed opt-in feature with conservative defaults, clear capability documentation, and explicit cost visibility. Do not position it as a default improvement. The sequential path must remain the primary path.

---

## Sources

- [Claude Code Worktrees Guide — claudefa.st](https://claudefa.st/blog/guide/development/worktree-guide) — HIGH confidence, current
- [Claude Code Agent Teams: Shared Task List — MindStudio](https://www.mindstudio.ai/blog/claude-code-agent-teams-shared-task-list) — MEDIUM confidence
- [Multi-Agent Workflows Often Fail — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — HIGH confidence
- [Why Multi-Agent LLM Systems Fail — Augment Code](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them) — MEDIUM confidence
- [Error Handling in Agentic Systems — Agents Arcade](https://agentsarcade.com/blog/error-handling-agentic-systems-retries-rollbacks-graceful-failure) — MEDIUM confidence
- [Your AI Agent Didn't Fail — It Stopped Halfway — Medium](https://medium.com/data-science-collective/your-ai-agent-didnt-fail-it-stopped-halfway-cc5a6cc58b0c) — MEDIUM confidence
- [Parallel Agentic Development — MindStudio](https://www.mindstudio.ai/blog/parallel-agentic-development-claude-code-worktrees) — MEDIUM confidence
- [Context Engineering in LLM-Based Agents — Medium](https://jtanruan.medium.com/context-engineering-in-llm-based-agents-d670d6b439bc) — MEDIUM confidence
