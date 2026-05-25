# Phase 30: Skill/Agent 내부 호출 교체 - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 8 (SKILL.md 파일 / 13 occurrence)
**Analogs found:** 8 / 8 (Phase 29 surgical-swap 패턴이 모든 대상 파일에 직접 적용됨)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `skills/sg-plan/SKILL.md` | skill (bash snippet) | transform (JSON lines → formatted text) | `skills/sg-execute/SKILL.md` (동일 Pattern C 구조) | exact |
| `skills/sg-execute/SKILL.md` | skill (bash snippet) | transform (JSON lines → formatted text, source 없음) | `skills/sg-plan/SKILL.md` (Pattern C 변형) | exact |
| `skills/sg-complete/SKILL.md` | skill (bash snippet) | request-response (CLI 호출 → archive) | `hooks/hooks.json` (Phase 29 two-token swap 패턴) | role-match |
| `skills/sg-quick/SKILL.md` | skill (bash snippet) | transform (stdin JSON → key extract) | `.agents/skills/sg-plan/SKILL.md` L63 (동일 Pattern B 구조) | exact |
| `skills/sg-ui-plan/SKILL.md` | skill (bash snippet) | transform (JSON string unescape) | `.agents/skills/sg-plan/SKILL.md` L63 (완전 동일) | exact |
| `.agents/skills/sg-plan/SKILL.md` | skill (bash snippet) | transform (JSON lines + JSON unescape) | `skills/sg-plan/SKILL.md` (미러) | exact |
| `.agents/skills/sg-execute/SKILL.md` | skill (bash snippet) | transform (JSON lines → formatted text) | `skills/sg-execute/SKILL.md` (미러) | exact |
| `.agents/skills/sg-ship/SKILL.md` | skill (bash snippet) | request-response (test runner 감지) | N/A (pytest 직접 호출로 교체, 패턴 단순) | no-analog |

---

## Pattern Assignments

### `skills/sg-plan/SKILL.md` (SKILL-01 — lessons ranker 호출 + Pattern C 포매팅)

**Analog:** Phase 29 two-token swap 결정 (D-05) + `skills/sg-execute/SKILL.md` (동일 구조)

**현재 코드 (L20~L30):**
```bash
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   lines = [l for l in sys.stdin if l.strip()]
   for i, line in enumerate(lines, 1):
       try:
           d = json.loads(line)
           print(f\"{i}. [score {d['score']:.2f}] {d['pattern']} ({d['source']})\")
       except Exception:
           pass
   " || echo "(weighted ranking unavailable)"
```

**교체 후 (Pattern C with source — D-08 표준):**
```bash
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}
     });
   })' || echo "(weighted ranking unavailable)"
```

**변경 토큰:** `python3` → `node` (L20), `.py` → `.cjs` (L20), `python3 -c "..."` 블록 → `node -e '...'` 블록 (L21~L30)

---

### `skills/sg-execute/SKILL.md` (SKILL-01 — lessons ranker 호출 + Pattern C source 없음 변형)

**Analog:** `skills/sg-plan/SKILL.md` (동일 구조, source 필드 출력 없음이 차이점)

**현재 코드 (L20~L29):**
```bash
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
       try:
           d = json.loads(line)
           print(f\"{i}. [score {d['score']:.2f}] {d['pattern']}\")
       except Exception:
           pass
   " || true
```

**교체 후 (Pattern C without source — sg-execute 전용 변형):**
```bash
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
```

**주의:** `|| echo "(weighted ranking unavailable)"` 대신 `|| true` — 원본 보존 필수. `d.source` 출력 없음 — sg-plan과 다름.

---

### `skills/sg-complete/SKILL.md` (SKILL-01 — lessons_ranker --archive 호출)

**Analog:** Phase 29 `hooks/hooks.json` two-token swap (가장 단순한 케이스)

**현재 코드 (L36):**
```bash
     python3 hooks/lessons_ranker.py --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
```

**교체 후:**
```bash
     node hooks/lessons_ranker.cjs --archive --milestone "$MILESTONE_VER" .planning/lessons/*.md 2>&1 || \
```

**변경 토큰:** `python3` → `node`, `.py` → `.cjs`. 인자, redirection, fallback echo 전부 byte-exact 보존.

---

### `skills/sg-quick/SKILL.md` (SKILL-02 — stdin JSON key 추출 × 2)

**Analog:** `.agents/skills/sg-plan/SKILL.md` L63 (동일 Pattern B 구조)

**현재 코드 (L62~L63):**
```bash
   QUICK_ID=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('quick_id') or d.get('id',''))")
   TASK_DIR=$(echo "$INIT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('task_dir') or d.get('dir',''))")
```

**교체 후 (Pattern A — stdin JSON → single key extract):**
```bash
   QUICK_ID=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.quick_id||j.id||"")}catch(e){}})')
   TASK_DIR=$(echo "$INIT_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.task_dir||j.dir||"")}catch(e){}})')
```

**동등성 검증:** Python `d.get('quick_id') or d.get('id','')` → JS `j.quick_id||j.id||""`. 빈 문자열은 양쪽 모두 falsy. `process.stdout.write` 사용(줄바꿈 없음) — Python `print` 대신.

---

### `skills/sg-ui-plan/SKILL.md` (SKILL-02 — JSON string unescape)

**Analog:** `.agents/skills/sg-plan/SKILL.md` L63 (완전 동일 패턴)

**현재 코드 (L32):**
```bash
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | python3 -c 'import json,sys; v=sys.stdin.read().strip(); print(json.loads(v))' 2>/dev/null || echo "$PHASE_SECTION_RAW")
```

**교체 후 (Pattern B — escaped JSON string → unwrap):**
```bash
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
```

**동등성 검증:** `json.loads(v)` → `JSON.parse(s.trim())`. 실패 시 양쪽 모두 빈 출력 + `|| echo "$PHASE_SECTION_RAW"` fallback 동일.

---

### `.agents/skills/sg-plan/SKILL.md` (AGENT-01 — 3 occurrence)

**Analog:** `skills/sg-plan/SKILL.md` (미러 파일) + `skills/sg-ui-plan/SKILL.md` (L63 케이스)

**현재 코드 (L27~L28) — SKILL-01 미러:**
```bash
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
       try:
           d = json.loads(line)
           print(f'{i}. [score {d["score"]:.2f}] {d["pattern"]}')
       except Exception:
           pass
   " || true
```

**교체 후 (Pattern C without source — .agents/skills/sg-execute 변형과 동일):**
```bash
     node hooks/lessons_ranker.cjs --top 5 .planning/lessons/*.md 2>/dev/null \
       | node -e '
   let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
     const lines=buf.split("\n").filter(l=>l.trim());
     lines.forEach((line,i)=>{
       try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
     });
   })' || true
```

**현재 코드 (L63) — Pattern B (sg-ui-plan L32와 동일):**
```bash
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | python3 -c 'import json,sys; v=sys.stdin.read().strip(); print(json.loads(v))' 2>/dev/null || echo "$PHASE_SECTION_RAW")
```

**교체 후:**
```bash
   PHASE_SECTION=$(echo "$PHASE_SECTION_RAW" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$PHASE_SECTION_RAW")
```

---

### `.agents/skills/sg-execute/SKILL.md` (AGENT-01 — 2 occurrence)

**Analog:** `skills/sg-execute/SKILL.md` (완전 동일 미러)

**현재 코드 (L27~L28) — `skills/sg-execute/SKILL.md` L20~L29와 동일 구조:**
```bash
     python3 hooks/lessons_ranker.py --top 5 .planning/lessons/*.md 2>/dev/null \
       | python3 -c "
   import sys, json
   for i, line in enumerate((l for l in sys.stdin if l.strip()), 1):
       try:
           d = json.loads(line)
           print(f'{i}. [score {d["score"]:.2f}] {d["pattern"]}')
       except Exception:
           pass
   " || true
```

**교체 후:** `skills/sg-execute/SKILL.md` 교체 결과와 동일 (Pattern C without source).

---

### `.agents/skills/sg-ship/SKILL.md` (AGENT-01 D-10 — pytest 직접 호출)

**Analog:** 없음. Python test runner 교체는 코드 패턴이 아니라 단순 command 교체.

**현재 코드 (L106):**
```bash
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python3 -m pytest 2>&1 || TEST_FAILED=1
```

**교체 후 (D-10 결정):**
```bash
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  pytest 2>&1 || TEST_FAILED=1
```

**변경:** `python3 -m pytest` → `pytest`. `|| TEST_FAILED=1`, 가드 조건, 앞뒤 블록 전부 byte-exact 보존.

---

## Shared Patterns

### Pattern A — stdin JSON → 단일 key 추출 (single-line)

**적용 대상:** `skills/sg-quick/SKILL.md` L62, L63

```bash
$(echo "$JSON_VAR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.KEY1||j.KEY2||"")}catch(e){}})')
```

- `process.stdout.write` — 줄바꿈 없음 (Python `print` 대신)
- `try/catch` 빈 블록 — invalid JSON 시 빈 문자열 반환 (Python `2>/dev/null` 대응)
- Single-line (D-09 정책)

### Pattern B — escaped JSON string unescape (single-line)

**적용 대상:** `skills/sg-ui-plan/SKILL.md` L32, `.agents/skills/sg-plan/SKILL.md` L63

```bash
$(echo "$RAW_VAR" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s.trim()))}catch(e){}})' 2>/dev/null || echo "$RAW_VAR")
```

- `JSON.parse(s.trim())` — Python `json.loads(v)` 동등
- `2>/dev/null || echo "$RAW_VAR"` — 원본 fallback 보존

### Pattern C — JSON lines → formatted lesson list (multi-line)

**적용 대상:** `skills/sg-plan/SKILL.md` L21, `skills/sg-execute/SKILL.md` L21, `.agents/skills/sg-plan/SKILL.md` L28, `.agents/skills/sg-execute/SKILL.md` L28

**with source 변형** (sg-plan, .agents/sg-plan):
```bash
| node -e '
let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
  const lines=buf.split("\n").filter(l=>l.trim());
  lines.forEach((line,i)=>{
    try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern} (${d.source})`)}catch(e){}
  });
})'
```

**without source 변형** (sg-execute, .agents/sg-execute, .agents/sg-plan Step 0):
```bash
| node -e '
let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
  const lines=buf.split("\n").filter(l=>l.trim());
  lines.forEach((line,i)=>{
    try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
  });
})'
```

- Multi-line + outer single-quote (D-09)
- Template literal `${...}` — single-quote 안이므로 셸 해석 없음 (안전)
- `console.log` — 줄바꿈 포함 출력 (Python `print` 동등)

### Surgical Two-Token Swap (shared across all 8 files)

**Source:** Phase 29 D-05 결정 (`29-CONTEXT.md`)

모든 변경의 기본 원칙:
1. `python3` → `node`
2. `*.py` → `*.cjs`
3. 그 외 모든 토큰(인자, redirection, pipe 구조, fallback) byte-exact 보존

인라인 `python3 -c "..."` / `python3 -c '...'` 블록은 의미적으로 동등한 `node -e '...'` 블록으로 교체 (Pattern A/B/C 중 해당 케이스 적용).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.agents/skills/sg-ship/SKILL.md` L106 | skill (bash snippet) | request-response | `python3 -m pytest` → `pytest` 교체는 단순 command 변경, 코드 패턴 참조 불필요 |

---

## Occurrence → Pattern 매핑 요약

| # | 파일 | Line | 현재 토큰 | 교체 패턴 |
|---|------|------|----------|----------|
| 1 | `skills/sg-plan/SKILL.md` | L20 | `python3 hooks/lessons_ranker.py` | two-token swap |
| 2 | `skills/sg-plan/SKILL.md` | L21~L30 | `\| python3 -c "..."` | Pattern C with source |
| 3 | `skills/sg-execute/SKILL.md` | L20 | `python3 hooks/lessons_ranker.py` | two-token swap |
| 4 | `skills/sg-execute/SKILL.md` | L21~L29 | `\| python3 -c "..."` | Pattern C without source |
| 5 | `skills/sg-complete/SKILL.md` | L36 | `python3 hooks/lessons_ranker.py` | two-token swap |
| 6 | `skills/sg-quick/SKILL.md` | L62 | `python3 -c "...quick_id..."` | Pattern A |
| 7 | `skills/sg-quick/SKILL.md` | L63 | `python3 -c "...task_dir..."` | Pattern A |
| 8 | `skills/sg-ui-plan/SKILL.md` | L32 | `python3 -c '...json.loads...'` | Pattern B |
| 9 | `.agents/skills/sg-plan/SKILL.md` | L27 | `python3 hooks/lessons_ranker.py` | two-token swap |
| 10 | `.agents/skills/sg-plan/SKILL.md` | L28~L37 | `\| python3 -c "..."` | Pattern C without source |
| 11 | `.agents/skills/sg-plan/SKILL.md` | L63 | `python3 -c '...json.loads...'` | Pattern B |
| 12 | `.agents/skills/sg-execute/SKILL.md` | L27 | `python3 hooks/lessons_ranker.py` | two-token swap |
| 13 | `.agents/skills/sg-execute/SKILL.md` | L28~L37 | `\| python3 -c "..."` | Pattern C without source |
| 14 | `.agents/skills/sg-ship/SKILL.md` | L106 | `python3 -m pytest` | D-10: `pytest` 직접 호출 |

> 참고: CONTEXT.md 도입부는 13 occurrence라고 하지만 `<specifics>` 테이블은 14행. `.agents/skills/sg-ship/SKILL.md` L106이 별도 카운트로 포함되어 있음.

---

## Pre-flight Verify (PLAN에서 그대로 사용)

```bash
# .cjs 파일 4개 모두 존재 확인 (D-15)
test -f /Users/gyuha/workspace/super-gsd/hooks/lessons_ranker.cjs && \
test -f /Users/gyuha/workspace/super-gsd/hooks/stop_hook.cjs && \
test -f /Users/gyuha/workspace/super-gsd/hooks/rule_runner.cjs && \
test -f /Users/gyuha/workspace/super-gsd/hooks/transcript_matcher.cjs
```

현재 상태: 4개 파일 모두 존재 확인됨 (`hooks/lessons_ranker.cjs`, `hooks/rule_runner.cjs`, `hooks/stop_hook.cjs`, `hooks/transcript_matcher.cjs`).

## Metadata

**Analog search scope:** `skills/`, `.agents/skills/`, `.planning/phases/29-hook/`
**Files scanned:** 8 SKILL.md 대상 파일 + Phase 29 PLAN.md (패턴 참조)
**Pattern extraction date:** 2026-05-25
