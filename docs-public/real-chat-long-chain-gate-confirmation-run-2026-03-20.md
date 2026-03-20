# SparkCore Long-Chain Gate Lightweight Confirmation Rerun — 2026-03-20

## Run Metadata

- `run_id`: `long-chain-gate-confirmation-2026-03-20-001`
- `baseline_ref`: `be69c9c`
- `scenario_pack_ref`: `current frozen scenario-pack set`
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

This run stayed intentionally lightweight instead of reopening earliest-breach hunting:

- keep the current frozen baseline
- keep the current scenario-pack set
- keep the current profile matrix
- keep the current execution-environment contract
- keep the current thresholds, conclusion taxonomy, and next_action semantics
- add no ad-hoc cases

## Verification

```bash
cd apps/web
npx playwright test tests/smoke/core-chat.spec.ts -g "keeps short continuation after direct preferred-name confirmation on the same agent|keeps explicit Chinese continuation requests in Chinese after the thread already switched|keeps profession recall follow-ups on the direct-recall path|keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

Result:

- `4 passed (4.6m)`

Covered confirmation points:

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

No new anomaly appeared in this rerun, so no product-drift versus environment-noise split was needed.

## Interpretation

- the current formal gate conclusion of `Pass / no obvious drift / keep_role_layer` is basically reproducible on the same frozen baseline
- this remains a scoped confirmation tied to the current frozen baseline, current scenario-pack set, and current profile-by-pack matrix
- the result continues to support `keep_role_layer` for the current phase
