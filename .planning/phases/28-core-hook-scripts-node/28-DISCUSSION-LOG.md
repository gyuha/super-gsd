# Phase 28: Core hook scripts Node 포팅 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 28-core-hook-scripts-node
**Areas discussed:** stdin 처리, glob 확장, CLI 인자 파싱, 정규식 호환성, YAML 파서 전략, export 명명, 에러 정책, 날짜 계산, 검증 fixture 전략, plan 분할 권장

**Mode note:** 본 discussion은 subagent 컨텍스트에서 진행되어 AskUserQuestion 인터랙티브 UI를 사용할 수 없었다. 각 gray area에 대해 Python 소스 4개 파일을 정독 후 최선 결정을 잠정 채택하고 CONTEXT.md의 "Claude's Discretion" 섹션에 사용자 override가 필요한 항목을 명시했다.

---

## stdin 처리 방식

| Option | Description | Selected |
|--------|-------------|----------|
| `fs.readFileSync(0, 'utf-8')` 동기 읽기 | Python `json.load(sys.stdin)` 동등. macOS/Linux/Windows Node 12+ 호환. hook 응답 후 즉시 exit. | ✓ |
| `process.stdin.on('data')` async | event-driven. stream-friendly. exit 타이밍 제어 복잡. | |
| `await fs.promises.readFile(0)` async sync-style | async/await 문법. top-level await 필요(CJS 비호환). | |

**선택:** 동기 readFileSync(0).
**Notes:** hook 스크립트는 finite payload 받고 즉시 응답해야 함. Python 원본이 sync이므로 의미 동등성 측면에서도 자연스러움. CJS는 top-level await 불가.

---

## Glob 확장 구현

| Option | Description | Selected |
|--------|-------------|----------|
| `fs.glob` (Node 22+ experimental) | 내장. 안정성 미보장. Node 18 baseline 위반. | |
| 외부 패키지(`glob`, `fast-glob`) | 기능 풍부. **zero-dep 원칙 위반**. | |
| Hand-rolled 미니 매처(`fs.readdirSync` + prefix/suffix 매칭) | 사용 패턴이 좁아 15 lines로 충분. 외부 dep 0. | ✓ |
| Node 22+ 요구 | `fs.glob` 사용 가능. Node 18+ baseline(D-03) 위반. | |

**선택:** Hand-rolled 미니 매처, 각 파일에 인라인 복제(공유 모듈 만들지 않음).
**Notes:** 실제 사용 패턴 3종(`hookify.*.local.md`, `sg-rule.*.local.md`, `.planning/lessons/*.md`) 모두 `prefix.*.suffix` 또는 `dir/*.ext`. 5번째 helper 파일을 만들면 NODE-01~04 REQ 1:1 매핑이 깨지므로 인라인 복제 선택.

---

## CLI 인자 파싱 (lessons_ranker)

| Option | Description | Selected |
|--------|-------------|----------|
| `util.parseArgs` (Node 18.3+ stable) | 내장. `--top N`, `--archive`, `--milestone V`, positional 모두 지원. | ✓ |
| Hand-rolled `process.argv` scanner | 30 lines로 작성 가능. Node 18.0+ 호환. | |
| 외부 패키지(`commander`, `yargs`) | 기능 풍부. **zero-dep 원칙 위반**. | |

**선택:** `util.parseArgs`.
**Notes:** Node 18.3+ baseline. 18.0~18.2 환경 호환 요구가 명시되면 hand-roll로 전환 (현재는 미구현). Claude Code가 보통 최신 Node를 동반하므로 18.3+ 가정 합리적.

---

## 정규식 호환성 — 사용자 제공 패턴

| Option | Description | Selected |
|--------|-------------|----------|
| 사용자 패턴 그대로 `new RegExp()` 전달 | Python regex syntax 호환 약속 없음. `try/catch`로 invalid 패턴 false 반환(Python `re.error`와 동일). | ✓ |
| Python → JS regex 변환기 작성 | `(?P<name>)`, `\A`, `\Z` 등 PCRE 기능 일부 에뮬레이션. 작성 복잡, 완전성 보장 어려움. | |
| 사용자 패턴 검증 후 reject | invalid Python syntax 사용 시 에러 반환. 사용자 경험 저하. | |

**선택:** 그대로 전달 + try/catch fallback.
**Notes:** 현재 `.claude/*.local.md` 파일 0개 — 실제 사용자 패턴 미존재. Python 호환 약속은 PCRE 에뮬레이터를 요구해 zero-dep과 충돌. 코드 내부 정규식(stop_hook, lessons_ranker)은 모두 JS 호환 syntax임을 사전 검증함.

---

## `re.split` capture-group 분할 재현 (lessons_ranker)

| Option | Description | Selected |
|--------|-------------|----------|
| JS `String.split(regex)` 그대로 | 결과 배열 길이/구조가 Python과 다름. 파서 깨짐 위험. | |
| `content.matchAll` + 수동 분할 | `[preamble, header1, body1, header2, body2, ...]` 배열 직접 구성. Python 결과와 1:1 매칭. | ✓ |
| `replace` 콜백으로 인덱스 추적 | 가능하지만 직관성 낮음. | |

**선택:** `matchAll` + 수동 분할 헬퍼.
**Notes:** Python 원본 line 74의 `re.split(r'^(## .+)$', content, flags=re.MULTILINE)` 동작을 그대로 재현하는 가장 안전한 방법.

---

## YAML frontmatter 파서 전략

| Option | Description | Selected |
|--------|-------------|----------|
| Python 알고리즘 그대로 라인 단위 포팅 | quirk 포함 완전 동등. 67 lines. | ✓ |
| 더 strict한 재설계 | YAML spec 준수. 기존 `.local.md` 호환성 깨질 위험. | |
| 외부 YAML 라이브러리 | `js-yaml` 등. **zero-dep 원칙 위반**. | |

**선택:** 알고리즘 그대로 포팅.
**Notes:** 빈 value → list 모드 진입, indent>2 → dict item nesting, `.strip('"').strip("'")` 단일/이중 따옴표 양쪽 벗기기, `true`/`false` boolean 변환 등 모든 quirk 보존.

---

## transcript_matcher export 명명

| Option | Description | Selected |
|--------|-------------|----------|
| `module.exports = { detectSignal }` camelCase | JS 관용. 객체 export로 향후 확장 안전. | ✓ |
| `module.exports = { detect_signal }` snake_case 유지 | Python과 동일. 호출 측 변경 0. | |
| `module.exports = detectSignal` 단일 함수 | 가장 간결. 향후 helper 추가 시 export 형태 변경 필요. | |

**선택:** 객체 export + camelCase.
**Notes:** 단일 callsite(`stop_hook.cjs`)이므로 변경 비용 최소. 프로젝트가 JS 스타일 가이드를 별도로 정한다면 그것을 우선.

---

## 에러·exit code 정책

| Option | Description | Selected |
|--------|-------------|----------|
| Python swallow-all 정책 1:1 미러링 | hook은 항상 exit 0. lessons_ranker CLI만 `--milestone` 누락 시 exit 1. | ✓ |
| 더 엄격한 에러 처리 | 예상 못한 입력에 non-zero 종료. **Claude Code가 hook 실패로 처리 — 동작 동등성 깨짐**. | |

**선택:** Python 원본 정책 1:1 미러링.
**Notes:** D-04(1:1 동등성) 직접 적용. stop_hook과 rule_runner는 절대 non-zero exit 금지.

---

## 날짜·시간 계산 (lessons_ranker)

| Option | Description | Selected |
|--------|-------------|----------|
| `new Date(year, month-1, day)` 로컬 + `setHours(0,0,0,0)` | Python `date.today()` / `datetime.fromtimestamp(mtime).date()`와 동일 결과 (로컬 타임존). | ✓ |
| `new Date("YYYY-MM-DD")` ISO 문자열 | UTC 자정 해석. 음수 타임존에서 하루 어긋남. **버그 유발**. | |
| `Date.now()` + 수동 day delta | 가능하나 가독성 낮음. | |

**선택:** 로컬 생성자 + 자정 정규화.
**Notes:** JS `Date` 함정 회피. days_ago는 `Math.floor((today - fileDate) / 86400000)`. 가중치 공식 결과가 Python과 동일하게 나와야 함.

---

## 검증 fixture 전략

| Option | Description | Selected |
|--------|-------------|----------|
| 각 `.cjs` 파일당 1~3개 input/output JSON fixture + 28-VERIFY.md | manual diff 비교 가능. 향후 회귀 검증 자산. | ✓ |
| smoke test 1회만 수행, fixture 미보관 | 가장 가벼움. 회귀 발생 시 재현 어려움. | |
| 자동 비교 스크립트 작성 | Phase 28 범위 초과 — REQUIREMENTS.md "manual smoke testing only" 위반. | |

**선택:** fixture 보관 + VERIFY.md 기록.
**Notes:** D-22, D-23 참조. fixture 디렉토리 구조는 CONTEXT.md `<specifics>`에 명시.

---

## Plan 분할 권장

| Option | Description | Selected |
|--------|-------------|----------|
| 4개 plan(`28-01`~`28-04`)로 NODE-01~04에 1:1 매핑 | wave 분석 가능. files_modified disjoint. | ✓ |
| 1개 plan에 4개 파일 일괄 작성 | 단순. 병렬 실행 불가. | |
| 2개 plan(simple/complex 분리) | 작위적 분할. REQ 매핑 모호. | |

**선택:** 4개 plan, wave 1: 28-02/28-03/28-04 병렬, wave 2: 28-01.
**Notes:** `stop_hook.cjs`가 `transcript_matcher.cjs`를 require하므로 의존성 1건만 존재.

---

## Claude's Discretion

다음 항목은 명시적 사용자 응답이 없어 잠정 결정. **plan-phase 또는 execute에서 사용자가 override 가능**:

- stdin 처리 방식 (D-08): async 패턴 선호 시 변경 가능
- CLI 파서 선택 (D-11): Node 18.0~18.2 호환 요구 시 hand-roll로 전환
- export 명명 (D-16): snake_case 유지 옵션
- fixture 시나리오 수 (D-22): cost-vs-coverage 조정 가능

## Deferred Ideas

- TypeScript 도입 (마일스톤 out of scope)
- 자동 테스트 프레임워크 (`node:test`, Jest, Vitest)
- 공유 utility 모듈 `hooks/_lib.cjs` (5번째 파일 도입 시 REQ 매핑 불편)
- PCRE 에뮬레이터 (Python regex 호환 약속 시 필요)
- CLI 파서 hand-roll fallback (Node 18.0~18.2 호환)
