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
| 2026-05-19T16:04:54Z | 08-session-restore | review | hookify | - |
| 2026-05-19T16:22:19Z | 08-session-restore | hookify | ship | - |
| 2026-05-19T16:31:46Z | 08-session-restore | ship | complete | - |
| 2026-05-20T12:22:22Z | 09-sg-retro-skill-scaffold | complete | gsd-plan | - |
| 2026-05-20T12:38:18Z | 09-sg-retro-skill-scaffold | gsd-plan | superpowers | dba1ed4 |
| 2026-05-20T12:49:43Z | 09-sg-retro-skill-scaffold | superpowers | review | - |
| 2026-05-20T13:15:38Z | 09-sg-retro-skill-scaffold | review | hookify | - |
| 2026-05-20T13:39:37Z | 09-sg-retro-skill-scaffold | hookify | ship | - |
| 2026-05-20T13:39:37Z | 09-sg-retro-skill-scaffold | ship | complete | - |
| 2026-05-20T13:47:16Z | 10-conversation-analyzer-lens | complete | gsd-plan | - |
| 2026-05-20T13:55:41Z | 10-conversation-analyzer-lens | complete | superpowers | 132a52e |
| 2026-05-20T14:06:54Z | 10-conversation-analyzer-lens | superpowers | review | - |
| 2026-05-20T14:11:17Z | 10-conversation-analyzer-lens | review | hookify | - |
| 2026-05-20T14:25:39Z | 10-conversation-analyzer-lens | hookify | ship | - |
| 2026-05-20T14:25:39Z | 10-conversation-analyzer-lens | ship | complete | - |
| 2026-05-20T14:31:22Z | 11-rule-runner | complete | gsd-plan | - |
| 2026-05-20T14:36:32Z | 11-rule-runner | superpowers | review | - |
| 2026-05-20T14:42:14Z | 11-rule-runner | review | hookify | - |
| 2026-05-20T14:48:56Z | 12-lessons-aggregation | hookify | gsd-plan | - |
| 2026-05-20T14:58:56Z | 12-lessons-aggregation | gsd-plan | review | - |
| 2026-05-20T15:01:23Z | 12-lessons-aggregation | review | hookify | - |
| 2026-05-20T15:03:57Z | 13-sg-learn-routing | hookify | gsd-plan | - |
| 2026-05-20T15:13:53Z | 13-sg-learn-routing | gsd-plan | review | - |
| 2026-05-20T15:13:53Z | 13-sg-learn-routing | review | hookify | - |
| 2026-05-20T15:14:27Z | 13-sg-learn-routing | hookify | ship | - |
| 2026-05-20T15:14:27Z | 13-sg-learn-routing | ship | complete | - |
| 2026-05-20T15:15:27Z | 13-sg-learn-routing | init | complete | - |
| 2026-05-20T22:34:44Z | post-v1.2 | superpowers | review | - |
| 2026-05-21T00:04:59Z | unknown | review | sg-retro | - |
| 2026-05-21T00:24:25Z | 14-codex-agents-skills | sg-retro | gsd-plan | - |
| 2026-05-21T10:13:24Z | 14-codex-agents-skills | sg-retro | superpowers | 42d6e99 |
| 2026-05-21T10:46:45Z | 14-codex-agents-skills | superpowers | review | - |
| 2026-05-21T10:49:37Z | 14-codex-agents-skills | review | hookify | - |
| 2026-05-21T11:11:49Z | 14-codex-agents-skills | hookify | ship | - |
| 2026-05-21T11:30:00Z | 15-platform-hooks-python-fix | sg-discuss | context-done | - |
| 2026-05-21T11:28:47Z | 15-platform-hooks-python-fix | context-done | gsd-plan | - |
| 2026-05-21T11:35:00Z | 15-platform-hooks-python-fix | gsd-plan | execute | 3137f2f |
| 2026-05-21T11:37:15Z | 15-platform-hooks-python-fix | execute | review | - |
| 2026-05-21T11:39:58Z | 15-platform-hooks-python-fix | review | hookify | - |
| 2026-05-21T11:41:37Z | 15-platform-hooks-python-fix | hookify | ship | - |
| 2026-05-21T11:47:11Z | 16-readme-multi-platform | ship | gsd-plan | - |
| 2026-05-21T11:51:14Z | 16-readme-multi-platform | superpowers | review | - |
| 2026-05-21T11:53:44Z | 16-readme-multi-platform | review | hookify | - |
| 2026-05-21T11:57:04Z | 16-readme-multi-platform | init | ship | - |
| 2026-05-21T13:45:37Z | 17-plan-md-dependency-analysis | init | gsd-plan | - |
| 2026-05-21T13:54:22Z | 17-plan-md-dependency-analysis | init | superpowers | a25e9a5 |
| 2026-05-21T13:58:35Z | 17-plan-md-dependency-analysis | superpowers | review | - |
| 2026-05-21T14:01:39Z | 17-plan-md-dependency-analysis | review | hookify | - |
| 2026-05-21T14:03:14Z | 17-plan-md-dependency-analysis | hookify | ship | - |
| 2026-05-21T14:09:48Z | 18-sg-parallel-execute | ship | gsd-plan | - |
| 2026-05-21T14:20:43Z | 18-sg-parallel-execute | gsd-plan | superpowers | d1f36fe |
| 2026-05-21T14:26:37Z | 18-sg-parallel-execute | superpowers | review | - |
| 2026-05-21T14:29:34Z | 17-plan-md-dependency-analysis | review | hookify | - |
| 2026-05-21T14:32:09Z | 18-sg-parallel-execute | init | ship | - |
| 2026-05-21T14:38:21Z | 19-result-integration-regression | init | gsd-plan | - |
| 2026-05-21T14:43:57Z | 19-result-integration-regression | gsd-plan | superpowers | 992a8d7 |
| 2026-05-21T14:46:50Z | 19-result-integration-regression | superpowers | review | - |
| 2026-05-21T14:49:37Z | 19-result-integration-regression | review | hookify | - |
| 2026-05-21T14:52:05Z | 19-result-integration-regression | hookify | ship | - |
| 2026-05-21T14:53:03Z | 19-result-integration-regression | ship | complete | - |
| 2026-05-21T15:15:33Z | 19-result-integration-regression | superpowers | review | - |
| 2026-05-21T21:48:37Z | 20 | init | gsd-plan | - |
| 2026-05-22T01:26:34Z | 20-sg-plan-visual-companion | gsd-plan | execute-done | 8786955 |
| 2026-05-22T05:25:58Z | 20-sg-plan-visual-companion | execute-done | complete | - |
| 2026-05-22T07:07:58Z | 22-skills | complete | gsd-plan | - |
| 2026-05-22T07:11:16Z | 22-skills | gsd-plan | superpowers | 2932276 |
| 2026-05-22T10:13:43Z | 22-skills | superpowers | review | - |
| 2026-05-22T10:25:39Z | 22-skills | review | sg-retro | - |
| 2026-05-22T11:10:42Z | 23 | review | gsd-plan | - |
| 2026-05-22T11:37:06Z | 23-plugin-commands | review | superpowers | 04f8c4c |
| 2026-05-22T12:09:58Z | 23-plugin-commands | superpowers | review | - |
| 2026-05-22T13:47:13Z | 21 | review | gsd-plan | - |
| 2026-05-22T13:59:49Z | 21-sg-ui-plan | review | superpowers | 7244bd2 |
| 2026-05-22T14:08:10Z | 21-sg-ui-plan | superpowers | review | - |
| 2026-05-22T14:11:27Z | 21-sg-ui-plan | review | sg-retro | - |
| 2026-05-22T14:30:29Z | 21-sg-ui-plan | sg-retro | ship | - |
| 2026-05-22T14:34:28Z | 22-skills | ship | complete | - |
| 2026-05-22T23:46:17Z | 23-plugin-commands | ship | complete | - |
| 2026-05-22T23:53:44Z | 23-plugin-commands | ship | gsd-plan | - |
| 2026-05-23T00:02:51Z | 23-plugin-commands | ship | complete | - |
| 2026-05-23T00:08:30Z | 23-plugin-commands | ship | review | - |
| 2026-05-23T00:16:19Z | 23-plugin-commands | ship | sg-retro | - |
| 2026-05-23T00:53:06Z | 24 | ship | gsd-plan | - |
| 2026-05-23T02:27:38Z | 24-skills | ship | gsd-plan | - |
| 2026-05-23T11:23:41Z | 25-fix-and-verify | init | gsd-plan | - |
| 2026-05-23T11:50:12Z | 25-fix-and-verify | init | superpowers | c08aef3 |
| 2026-05-23T11:53:25Z | 25-fix-and-verify | init | sg-retro | - |
| 2026-05-23T13:31:39Z | 26-sg-next | sg-retro | gsd-plan | - |
| 2026-05-23T13:42:59Z | 26-sg-next | gsd-plan | superpowers | fa08575 |
| 2026-05-23T14:19:21Z | 26-sg-next | superpowers | review | - |
| 2026-05-23T14:32:46Z | 26-sg-next | superpowers | review | - |
| 2026-05-23T15:00:48Z | 26-sg-next | superpowers | sg-retro | - |
| 2026-05-23T15:22:06Z | 26-sg-next | superpowers | ship | - |
| 2026-05-23T15:24:29Z | 26-sg-next | superpowers | complete | - |
| 2026-05-23T23:25:43Z | 27-gsd-repo-migration | complete | ship | - |
| 2026-05-25T01:43:40Z | 28-core-hook-scripts-node | ship | gsd-plan | - |
| 2026-05-25T02:40:11Z | 28-core-hook-scripts-node | gsd-plan | parallel | 8ff383d |
| 2026-05-25T04:15:06Z | 28-core-hook-scripts-node | parallel | review | - |
| 2026-05-25T09:33:39Z | 28-core-hook-scripts-node | review | sg-next | - |
| 2026-05-25T09:40:06Z | 28-core-hook-scripts-node | sg-next | sg-retro | - |
| 2026-05-25T10:07:00Z | 28-core-hook-scripts-node | sg-retro | sg-next | - |
| 2026-05-25T10:07:17Z | 28-core-hook-scripts-node | sg-next | ship | - |
| 2026-05-25T11:24:40Z | 29-hook | ship | gsd-plan | - |
| 2026-05-25T11:44:31Z | 29-hook | gsd-plan | superpowers | b75ed21 |
| 2026-05-25T11:56:08Z | 29-hook | superpowers | review | - |
| 2026-05-25T12:21:18Z | 29-hook | review | sg-retro | - |
| 2026-05-25T13:35:14Z | 30-skill-agent | sg-retro | gsd-plan | - |
| 2026-05-25T14:26:00Z | 30-skill-agent | sg-retro | superpowers | 4c1e3fe |
| 2026-05-25T15:02:08Z | 31-cleanup-docs | sg-retro | gsd-plan | - |
