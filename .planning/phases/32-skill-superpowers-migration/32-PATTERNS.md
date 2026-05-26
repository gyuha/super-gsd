# Phase 32: Skills 파일 파싱 방식 Superpowers 전환 — Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 11 (9 skills + 1 CLAUDE.md + .agents/skills mirror)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `skills/sg-complete/SKILL.md` | skill | request-response | `skills/sg-new/SKILL.md` (node -e 패턴) | role-match |
| `skills/sg-execute/SKILL.md` | skill | request-response | `.agents/skills/sg-execute/SKILL.md` | exact mirror |
| `skills/sg-health/SKILL.md` | skill | request-response | (self — bash grep만 유지, 전환 없음) | self-reference |
| `skills/sg-lessons/SKILL.md` | skill | request-response | `skills/sg-new/SKILL.md` (node -e 패턴) | role-match |
| `skills/sg-plan/SKILL.md` | skill | request-response | `.agents/skills/sg-plan/SKILL.md` | exact mirror |
| `skills/sg-quick/SKILL.md` | skill | request-response | `skills/sg-new/SKILL.md` (node -e 패턴) | role-match |
| `skills/sg-review/SKILL.md` | skill | request-response | `.agents/skills/sg-review/SKILL.md` | exact mirror |
| `skills/sg-ship/SKILL.md` | skill | request-response | `.agents/skills/sg-ship/SKILL.md` | exact mirror |
| `skills/sg-ui-plan/SKILL.md` | skill | request-response | `.agents/skills/sg-plan/SKILL.md` | role-match |
| `skills/sg-retro/SKILL.md` | skill | event-driven | `.agents/skills/sg-retro/SKILL.md` | exact mirror |
| `CLAUDE.md` | config | — | (self — convention 섹션 교체) | self-reference |

---

## Pattern Assignments

### 패턴 A: STATE.md Phase 파싱 → Read 도구 전환

이것이 Phase 32의 핵심 패턴이다. 아래 9개 파일 모두 동일한 Before/After 구조를 따른다.

**Before (bash 방식) — sg-complete, sg-execute, sg-plan, sg-review, sg-ship, sg-ui-plan에서 공통:**

```bash
PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')
```

또는 (`.agents/skills/` 변형):

```bash
PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 \
            | sed -E 's/^Phase:[[:space:]]*//' \
            | sed -E 's/[[:space:]]+$//' \
            | awk '{print $1}')
```

**After (Superpowers 방식):**

```
Read .planning/STATE.md, then extract the Phase: value from the YAML frontmatter.
```

설명: Claude가 Read 도구로 STATE.md를 열고, `Phase: <N>` 줄에서 숫자를 직접 읽는다. 정규식·파이프라인 불필요.

---

### 패턴 B: HANDOFF.md 마지막 행 파싱 → Read 도구 전환

**Before (bash 방식) — sg-complete, sg-execute, sg-plan, sg-review, sg-ship, sg-ui-plan에서 공통:**

```bash
FROM_STAGE=$(grep -E '^\| [0-9]{4}-' .planning/HANDOFF.md | tail -1 | awk -F'|' '{gsub(/ /,"",$5); print $5}')
```

**After (Superpowers 방식):**

```
Read .planning/HANDOFF.md, then extract the To column value from the last data row (rows starting with | followed by a 4-digit year).
```

---

### 패턴 C: ROADMAP.md Phase 섹션 파싱 → Read 도구 전환

해당 파일: `skills/sg-execute/SKILL.md` (Step 3), `.agents/skills/sg-execute/SKILL.md` (Step 3).

**Before (bash 방식) — sg-execute Step 3:**

```bash
PHASE_HEADER=$(grep -n "^### Phase ${PHASE_NUM}:" .planning/ROADMAP.md | head -1)
PHASE_NAME=$(echo "$PHASE_HEADER" | sed 's/.*Phase [0-9.]*: //')
HEADER_LINE=$(echo "$PHASE_HEADER" | cut -d: -f1)

GOAL=$(awk "NR>${HEADER_LINE} && /^\*\*Goal\*\*:/{sub(/^\*\*Goal\*\*:[[:space:]]*/,\"\"); print; exit}" .planning/ROADMAP.md)
REQ_IDS=$(awk "NR>${HEADER_LINE} && /^\*\*Requirements\*\*:/{match(\$0,/: (.*)/,a); print a[1]; exit}" .planning/ROADMAP.md)
REQ_IDS_CLEAN=$(echo "$REQ_IDS" | sed 's/([^)]*)//g' | tr -d ' ' | tr ',' ' ')

SC_TEXT=$(awk "NR>${HEADER_LINE}" .planning/ROADMAP.md | awk '/^\*\*Success Criteria\*\*/{found=1; next} found && /^\*\*/{exit} found && /^[[:space:]]*[0-9]+\./{print}')
```

**After (Superpowers 방식):**

```
Read .planning/ROADMAP.md, then:
- Find the ### Phase <PHASE_NUM>: section header
- Extract PHASE_NAME from that header line
- Extract the **Goal**: value from the next line
- Extract **Requirements**: REQ-ID list
- Extract numbered items under **Success Criteria** until the next ** section
```

---

### 패턴 D: PLAN.md objective 섹션 파싱 → Read 도구 전환

해당 파일: `skills/sg-review/SKILL.md` (Step 3), `.agents/skills/sg-review/SKILL.md` (Step 3).

**Before (bash 방식) — sg-review Step 3:**

```bash
PHASE_NUM=$(grep -E '^Phase:' .planning/STATE.md 2>/dev/null | head -1 | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}')
...
PLAN_FILE=$(ls .planning/phases/${PHASE_PAD}-*/*-PLAN.md 2>/dev/null | tail -1)
...
PLAN_REQUIREMENTS=$(sed -n '/<objective>/,/<\/objective>/p' "$PLAN_FILE" 2>/dev/null | grep -v 'objective>')
```

**After (Superpowers 방식):**

```
Read .planning/STATE.md to get PHASE_NUM.
Read .planning/phases/<PHASE_PAD>-*/*-PLAN.md (last match), then extract the content between <objective> and </objective> tags.
```

---

### 패턴 E: sg-lessons argument 파싱 → node -e 유지

해당 파일: `skills/sg-lessons/SKILL.md` (Step 0).

**Before (bash 방식) — sg-lessons Step 0:**

```bash
MILESTONE_ARG=$(echo "$ARGUMENTS" | grep -oE 'milestone=[^ ]+' | head -1 | sed 's/milestone=//')
```

**After (node -e 방식):**

```bash
MILESTONE_ARG=$(node -e "
  const args = process.env.ARGUMENTS || '';
  const m = args.match(/milestone=([^ ]+)/);
  process.stdout.write(m ? m[1] : '');
" 2>/dev/null)
```

참고 analog: `skills/sg-new/SKILL.md` Step 2의 node -e 패턴 (lines 23-40):

```bash
NEXT_PHASE=$(node -e "
try{
  const fs=require('fs');
  const state=fs.readFileSync('.planning/STATE.md','utf8');
  const ms=(state.match(/^milestone:\s*[\"']?([^\"'\s\n]+)[\"']?/m)||[])[1]||'';
  ...
}catch(e){}
" 2>/dev/null)
```

---

### 패턴 F: sg-quick flags/DESCRIPTION 파싱 → node -e 유지

해당 파일: `skills/sg-quick/SKILL.md` (Step 1).

**Before (bash 방식) — sg-quick Step 1:**

```bash
DESCRIPTION=$(echo "$ARGS" | sed 's/--discuss//g; s/--research//g; s/--validate//g; s/--full//g' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
```

**After (node -e 방식):**

```bash
DESCRIPTION=$(node -e "
  const a = process.env.ARGUMENTS || '';
  process.stdout.write(a.replace(/--discuss|--research|--validate|--full/g,'').trim());
" 2>/dev/null)
```

---

### 패턴 G: sg-quick STATE.md Quick Tasks 테이블 업데이트 → Read 도구 + Write

해당 파일: `skills/sg-quick/SKILL.md` (Step 7).

**Before (bash awk 방식) — sg-quick Step 7:**

```bash
awk -v row="$NEW_ROW" '
  /### Quick Tasks Completed/ { in_section=1; section_hdr=NR }
  in_section && /^##/ && !/### Quick Tasks Completed/ { in_section=0 }
  in_section && /^\|/ { last_row=NR }
  { lines[NR]=$0 }
  END {
    insert_after = (last_row > 0) ? last_row : section_hdr
    ...
    for(i=1;i<=NR;i++) {
      print lines[i]
      if(i==insert_after) print row
    }
  }
' .planning/STATE.md > .planning/STATE.md.tmp && mv .planning/STATE.md.tmp .planning/STATE.md
```

**After (Superpowers 방식):**

```
Read .planning/STATE.md.
Find the ### Quick Tasks Completed table section.
Append a new row after the last existing row in that table.
Write the updated content back with the Edit tool.
```

---

### 패턴 H: sg-retro lock 주석 제거 (코드 유지)

해당 파일: `skills/sg-retro/SKILL.md` (Step 1, lines 18 and 26).

**Before — sg-retro Step 1 주석:**

```bash
# 변경 전 (line 18):
Parse `$ARGUMENTS` into `PHASE_RAW` and `LENS_RAW`. If `PHASE_RAW` is empty, fall back to `.planning/STATE.md` `^Phase:` line using the multi-line `sed` pattern below (Phase 7 D-04~D-06 lock). **Do not introduce a single-token regex shortcut** — preserve the full grep + sed + awk pipeline as-is.

# 변경 전 (line 26):
  # --- BEGIN STATE.md Phase parsing block (D-08: Phase 7 D-04~D-06 multi-line 패턴 인라인 복제) ---
```

**After — 코드는 그대로, 주석만 교체:**

```bash
# 변경 후 (line 18):
Parse `$ARGUMENTS` into `PHASE_RAW` and `LENS_RAW`. If `PHASE_RAW` is empty, fall back to `.planning/STATE.md` `^Phase:` line using the multi-line `grep + sed + awk` pattern below (macOS 호환 파이프라인). **Do not replace with a single-token regex** — preserve the full pipeline for macOS/BSD compatibility.

# 변경 후 (line 26):
  # --- BEGIN STATE.md Phase parsing block (macOS 호환 grep + sed + awk 파이프라인) ---
```

참고: `.agents/skills/sg-retro/SKILL.md`의 동일 블록(line 26)은 이미 lock 참조 없이 `# --- BEGIN STATE.md Phase parsing block ---`으로 작성되어 있다. 이 형식이 목표 상태다.

---

### 패턴 I: CLAUDE.md D-04~D-06 lock 컨벤션 교체

해당 파일: `CLAUDE.md` (line 96).

**Before:**

```
- **STATE.md Phase 파싱** — 단일 토큰 정규식 대신 `grep -E '^Phase:' | sed -E 's/^Phase:[[:space:]]*//' | awk '{print $1}'` 파이프라인을 사용한다 (Phase 7 D-04~D-06 lock).
```

**After:**

```
- **STATE.md Phase 파싱 (skills/SKILL.md)** — SKILL.md에서 `$ARGUMENTS`가 없을 때는 Read 도구로 `.planning/STATE.md`를 열어 `Phase:` 필드를 직접 읽는다 (Superpowers 방식). bash 파이프라인(`grep | sed | awk`)은 `hooks/*.cjs`와 `skills/sg-retro/SKILL.md`처럼 macOS 호환성 이유로 명시된 경우에만 유지한다.
```

---

## Shared Patterns

### HANDOFF.md 초기화 블록

모든 skills에서 동일하게 반복되며, Phase 32 이후에도 bash로 유지한다 (파일 쓰기 연산, Read 도구 대상 아님).

**Source:** `skills/sg-complete/SKILL.md` Step 1.5 (대표 — 동일 코드가 6개 파일에 존재)

```bash
HANDOFF_FILE=".planning/HANDOFF.md"
if [ ! -f "$HANDOFF_FILE" ] || ! grep -q "Timestamp.*Phase.*From.*To.*Plan Hash" "$HANDOFF_FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$HANDOFF_FILE")"
  printf '| Timestamp | Phase | From | To | Plan Hash |\n| --- | --- | --- | --- | --- |\n' > "$HANDOFF_FILE"
fi
```

**Apply to:** Phase 32에서 이 블록은 변경하지 않는다. 파일 존재 확인 + 초기화는 bash가 유일한 선택지다.

### node -e JSON 파이프 패턴

**Source:** `skills/sg-execute/SKILL.md` Step 0 (lines 20-27), `skills/sg-plan/SKILL.md` Step 0 (lines 21-28)

```bash
node -e '
let buf="";process.stdin.on("data",d=>buf+=d).on("end",()=>{
  const lines=buf.split("\n").filter(l=>l.trim());
  lines.forEach((line,i)=>{
    try{const d=JSON.parse(line);console.log(`${i+1}. [score ${d.score.toFixed(2)}] ${d.pattern}`)}catch(e){}
  });
})'
```

**Apply to:** lessons_ranker 출력 파이프 처리가 필요한 모든 곳 — 이 패턴은 Phase 32 이후에도 유지한다 (bash 파싱이 아니라 node JSON 처리이므로 전환 대상 아님).

---

## .agents/skills/ 미러링 현황

D-01 결정에 따라 `skills/`와 `.agents/skills/` 양쪽을 동일하게 변경해야 한다. 현재 .agents/skills/에 존재하는 파일:

| .agents/skills/ 파일 | skills/ 원본 | 파싱 방식 차이 |
|---------------------|--------------|----------------|
| `sg-execute/SKILL.md` | `skills/sg-execute/SKILL.md` | .agents 버전이 이미 더 깔끔한 sed 2-줄 패턴 사용. 둘 다 같은 방향으로 전환 |
| `sg-plan/SKILL.md` | `skills/sg-plan/SKILL.md` | .agents 버전에 Visual Companion + GSD 미설치 폴백 포함. 둘 다 전환 |
| `sg-review/SKILL.md` | `skills/sg-review/SKILL.md` | .agents 버전이 더 긴 sed 파이프라인 사용. 둘 다 전환 |
| `sg-retro/SKILL.md` | `skills/sg-retro/SKILL.md` | .agents 버전은 이미 lock 주석 없음 — 확인 후 동기화 |
| `sg-ship/SKILL.md` | `skills/sg-ship/SKILL.md` | .agents 버전에 직접 git 병합 모드 추가. Phase: 파싱 부분만 전환 |

**sg-health, sg-lessons, sg-quick, sg-ui-plan** — .agents/skills/에 해당 디렉토리 없음. skills/ 만 변경.

---

## No Analog Found (전환 불가 항목)

| 파일 | 유지 이유 |
|------|-----------|
| `skills/sg-health/SKILL.md` — `grep -q '"Stop"'` (Step 4) | hooks.json 존재 확인용. Read 도구로 JSON 키 탐색보다 bash grep이 더 정확하고 SKILL.md 내부에서도 bash 실행 컨텍스트 유지 필요 |
| `skills/sg-health/SKILL.md` — `grep -c '^---$'` (Step 7) | frontmatter 구분자 카운트. 개수 계산은 bash wc/grep이 적합 |
| `skills/sg-retro/SKILL.md` — grep+sed+awk 파이프라인 전체 | D-02 결정: 코드 자체는 유지. 주석만 교체. macOS 호환성 검증됨 |
| `hooks/*.cjs` 전체 | D-04 결정: Node.js 런타임, Read 도구 없음 |
| `skills/sg-execute/SKILL.md` — `grep -rl '^wave:'` (Step 8.5) | PLAN.md 병렬 분석. 다수 파일을 재귀 검색하는 grep은 Read 도구 대체 불가 |
| `skills/sg-execute/SKILL.md` — PLAN.md wave/files_modified awk 파싱 전체 (Step 8.5) | 복잡한 다중 파일 YAML 파싱 + 교집합 계산. node -e 또는 bash 유지. Superpowers 전환 대상 아님 (Read 도구는 단일 파일) |

---

## 변경 범위 요약 (파일별 Before → After)

### `skills/sg-complete/SKILL.md`
- Step 1: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 1.3: `grep -E '^milestone:'...awk '{print $2}'` → Read STATE.md + Claude 추출
- Step 1.5: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출 (마지막 데이터 행)

### `skills/sg-execute/SKILL.md`
- Step 1: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 3: `grep -n "^### Phase"...sed...awk` (ROADMAP 파싱) → Read ROADMAP.md + Claude 추출
- Step 8: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출
- Step 8.5: wave/files_modified awk 파싱 — **유지** (다중 파일 교집합 분석)

### `skills/sg-health/SKILL.md`
- Step 6: `grep -E '^\| [0-9]{4}-'...awk -F'|' '{print NF}'` → **유지** (진단 도구, 파일 쓰기 없음, bash가 적합)
- 전체적으로 bash 진단 패턴 유지. 전환 대상 없음.

### `skills/sg-lessons/SKILL.md`
- Step 0: `grep -oE 'milestone=[^ ]+'...sed 's/milestone=//'` → node -e 방식

### `skills/sg-plan/SKILL.md`
- Step 1: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 2.5: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출

### `skills/sg-quick/SKILL.md`
- Step 1: `sed 's/--discuss//g...'` flags strip → node -e
- Step 7: awk 기반 STATE.md 테이블 업데이트 → Read STATE.md + Edit 도구

### `skills/sg-review/SKILL.md`
- Step 3: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 3: `sed -n '/<objective>/,/<\/objective>/p'` → Read PLAN.md + Claude 추출
- Step 3.9: `grep -E '^Phase:'...` (두 번째 Phase 파싱) → Read STATE.md + Claude 추출
- Step 3.9: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출

### `skills/sg-ship/SKILL.md`
- Step 1: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 1.5: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출

### `skills/sg-ui-plan/SKILL.md`
- Step 1: `grep -E '^Phase:'...sed...awk` → Read STATE.md + Claude 추출
- Step 4: `grep -E '^\| [0-9]{4}-'...awk -F'|'` → Read HANDOFF.md + Claude 추출

### `skills/sg-retro/SKILL.md`
- Step 1 설명 텍스트: `(Phase 7 D-04~D-06 lock)` 참조 제거 → macOS 호환성 주석으로 교체
- Step 1 bash 주석 (line 26): `(D-08: Phase 7 D-04~D-06 multi-line 패턴 인라인 복제)` → `(macOS 호환 grep + sed + awk 파이프라인)`
- bash 코드 자체: **유지**

### `CLAUDE.md`
- line 96: `(Phase 7 D-04~D-06 lock)` 참조 제거 → Superpowers 방식 권장 설명으로 교체

### `.agents/skills/` 미러
- 위와 동일한 변경을 각 대응 파일에 적용 (sg-execute, sg-plan, sg-review, sg-ship, sg-retro)

---

## Metadata

**Analog search scope:** `skills/`, `.agents/skills/`
**Files scanned:** 17 SKILL.md 파일 (skills 12 + .agents/skills 5 + CLAUDE.md)
**Pattern extraction date:** 2026-05-26
