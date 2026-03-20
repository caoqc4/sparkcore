# SparkCore Long-Chain Acceptance Gate Continued Run — 2026-03-20 (Attempt 5)

## Run Metadata

- `run_id`: `long-chain-gate-2026-03-20-007`
- `run_status`: `completed-with-no-new-drift`
- `pack_version_or_ref`: `2220bb7:docs-public/real-chat-quality-regression-set.md`
- `profile_matrix`:
  - `Relationship Maintenance Pack` -> `Spark Default`
  - `Mixed-Language Pack` -> `Spark Default`
  - `Memory Confirmation Pack` -> `Spark Memory Sensitive`
  - `Correction Aftermath Pack` -> `Spark Memory Sensitive`
- `execution_env_fingerprint`:
  - app mode: `next start`
  - smoke mode: `PLAYWRIGHT_SMOKE_MODE=1`
  - smoke identity: `smoke@example.com`
  - `Spark Default`: `replicate / replicate-gpt-4o-mini`
  - `Spark Memory Sensitive`: `replicate / replicate-claude-4-sonnet`
  - base URL: `http://localhost:3001`

## Gate Result

- `severity`: `Pass`
- `conclusion`: `no obvious drift`
- `next_action`: `keep_role_layer`

Why this continued run can stop here:

- `#134` fixed the explicit Chinese continuation drift from `#133`
- on the same frozen baseline, the remaining `Correction Aftermath Pack` focused regression passed
- this run did not confirm any new `P0` breach
- that lets the first formal `8 to 12 turn` long-chain gate be recorded as currently green on the current frozen baseline, current scenario-pack set, and current profile matrix

## Commands Used

```bash
cd apps/web
npx playwright test tests/smoke/core-chat.spec.ts -g "keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

Additional note:

- the first attempt hit a webServer-to-Supabase connect timeout during `smoke-create-thread`
- the same focused smoke passed on rerun, so the earlier failure is treated as environment noise rather than product drift

## Per-Case Observation

### Correction Aftermath Pack

#### `real-chat-incorrect-restore-cycle`

- `profile`: `Spark Memory Sensitive`
- `status`: `PASS`

Verification summary:

- focused smoke: `keeps correction-aftermath metadata stable for relationship nickname recall`
- rerun result: `1 passed (1.7m)`
- nickname recall stayed excluded after `Incorrect`
- nickname recall returned after `Restore`
- this run did not confirm a new fidelity / language / relationship-continuity / correction-consistency drift

## Overall Interpretation

- this continued gate run did not expose a new earliest breach
- combined with the previous continued runs and narrow fixes, the first formal long-chain gate is now provisionally passing on the current frozen baseline, current scenario-pack set, and current profile matrix
- this conclusion should not be read as automatically extending to future baseline changes, pack expansion, or profile-by-pack remapping
- there is still not enough evidence to treat the recent failures as `state-pressure candidate`
- so far, the surfaced failures all looked like rule-layer gaps, and they have now been tightened one by one
