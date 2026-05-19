<!-- Append-only handoff log. Schema locked by .planning/phases/02-manual-handoff-status/02-CONTEXT.md (D-22..D-26). -->

# 핸드오프 로그

이 파일은 `/super-gsd:to-superpowers` 명령이 한 행씩 append-only 방식으로 추가하는 단계 인계 로그이다. `/super-gsd:status` 명령은 마지막 데이터 행의 `To` 컬럼을 읽어 현재 워크플로우 stage를 판정하고 다음 권장 명령을 제시한다. 사람이 직접 수정하지 않는다 — 모든 변경은 위 두 명령을 통해서만 일어난다.

## 스키마

- 5개 열 의미
  - `Timestamp` — 핸드오프 시각, `ISO 8601 UTC` 형식 (예: `2026-05-15T11:23:45Z`).
  - `Phase` — 인계 대상 GSD phase 번호와 이름 (예: `2-manual-handoff-status`).
  - `From` — 직전 stage. 처음 진입 시 `init`.
  - `To` — 인계 후 도착 stage. 마지막 행의 이 값이 현재 stage가 된다.
  - `Plan Hash` — 해당 phase의 모든 `*-PLAN.md` 본문을 합쳐 산출한 sha256 short hash (7자). plan 본문이 변경되면 같은 phase라도 재인계 가능.
- Stage enum (From / To 컬럼 허용 값): `init`, `gsd-plan`, `superpowers`, `review`, `hookify`, `ship`, `complete`.
- 초기 상태 (= 데이터 행 0개)에서는 stage가 자동으로 `init`으로 판정된다 — `init` 행을 사전 작성하지 않는다.

## 로그

| Timestamp | Phase | From | To | Plan Hash |
| --------- | ----- | ---- | -- | --------- |
| 2026-05-16T13:01:11Z | 06-sg-health | init | superpowers | 415be74 |
| 2026-05-18T06:07:20Z | 07-status-accuracy | superpowers | superpowers | e0dfa4b |
| 2026-05-18T15:48:55Z | 06-sg-health | superpowers | review | - |
| 2026-05-18T16:01:27Z | 06-sg-health | review | hookify | - |
| 2026-05-18T16:08:59Z | 06-sg-health | hookify | complete | - |
| 2026-05-18T14:50:50Z | 07-status-accuracy | superpowers | review | - |
| 2026-05-18T15:27:34Z | 07-status-accuracy | review | hookify | - |
| 2026-05-19T15:13:29Z | 07-status-accuracy | hookify | complete | - |
| 2026-05-19T15:44:46Z | 08-session-restore | complete | gsd-plan | - |
| 2026-05-19T15:55:40Z | 08-session-restore | gsd-plan | superpowers | b0ec14e |
