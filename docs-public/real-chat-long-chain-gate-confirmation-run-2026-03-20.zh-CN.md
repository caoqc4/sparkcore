# SparkCore 长链路 Gate 轻量确认复验记录 — 2026-03-20

## Run Metadata

- `run_id`: `long-chain-gate-confirmation-2026-03-20-001`
- `baseline_ref`: `be69c9c`
- `scenario_pack_ref`: `当前 frozen scenario-pack set`
- `profile_matrix_ref`:
  - `Relationship Maintenance Pack` -> `Spark Default`
  - `Mixed-Language Pack` -> `Spark Default`
  - `Memory Confirmation Pack` -> `Spark Memory Sensitive`
  - `Correction Aftermath Pack` -> `Spark Memory Sensitive`
- `run_type`: `lightweight-confirmation-rerun`

## Result

- `severity`: `Pass`
- `conclusion`: `no obvious drift`
- `next_action`: `keep_role_layer`
- `new_drift_detected`: `false`

## Confirmation Scope

这轮只做轻量复验，不重开 earliest-breach 追踪：

- 沿用当前 frozen baseline
- 不改 scenario packs
- 不改 profile matrix
- 不改 execution environment contract
- 不改 thresholds / conclusion / next_action 语义
- 不新增 ad hoc case

## Verification

```bash
cd apps/web
npx playwright test tests/smoke/core-chat.spec.ts -g "keeps short continuation after direct preferred-name confirmation on the same agent|keeps explicit Chinese continuation requests in Chinese after the thread already switched|keeps profession recall follow-ups on the direct-recall path|keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

结果：

- `4 passed (4.6m)`

覆盖到的轻量确认点：

- `Relationship Maintenance Pack`
  - `keeps short continuation after direct preferred-name confirmation on the same agent`
- `Mixed-Language Pack`
  - `keeps explicit Chinese continuation requests in Chinese after the thread already switched`
- `Memory Confirmation Pack`
  - `keeps profession recall follow-ups on the direct-recall path`
- `Correction Aftermath Pack`
  - `keeps correction-aftermath metadata stable for relationship nickname recall`

## Anomaly Classification

- `anomaly_detected`: `false`
- `anomaly_classification`: `n/a`

这轮没有出现新的异常，也没有触发 product drift / environment noise 的二次判定。

## Interpretation

- 当前 formal gate 的 `Pass / no obvious drift / keep_role_layer` 在同一 frozen baseline 上具备基本可复现性
- 这仍然只是针对当前 frozen baseline、当前 scenario-pack 集合、当前 profile-by-pack matrix 的轻量确认
- 这轮结果继续支持：当前阶段仍应 `keep_role_layer`
