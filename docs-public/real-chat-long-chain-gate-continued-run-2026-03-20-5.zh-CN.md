# SparkCore 长链路 Gate 继续运行记录 — 2026-03-20（第 5 次）

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

这轮继续跑为什么可以收在这里：

- `#134` 已经修掉了 `#133` 里 explicit Chinese continuation request 被拉回英文的掉点
- 在同一 frozen baseline 上，剩余的 `纠错后续包` focused regression 通过
- 这轮没有确认到新的 `P0` breach
- 因此第一轮 formal `8~12 turn` long-chain gate 可以先记成“在当前 frozen baseline 上已跑通”

## Commands Used

```bash
cd apps/web
npx playwright test tests/smoke/core-chat.spec.ts -g "keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

补充说明：

- 在第一次尝试里，webServer 到 Supabase 出现了一次连接超时，失败点在 `smoke-create-thread`
- 重跑后同一条 focused smoke 通过，因此这次不把第一次失败记为产品漂移

## Per-Case Observation

### Correction Aftermath Pack

#### `real-chat-incorrect-restore-cycle`

- `profile`: `Spark Memory Sensitive`
- `status`: `PASS`

验证摘要：

- focused smoke：`keeps correction-aftermath metadata stable for relationship nickname recall`
- 重跑结果：`1 passed (1.7m)`
- `Incorrect` 后，nickname recall 被稳定排除
- `Restore` 后，nickname recall 重新恢复
- 这轮没有确认到新的 fidelity / language / relationship-continuity / correction-consistency 漂移

## Overall Interpretation

- 这一轮 continued gate 没有再暴露新的 earliest breach
- 结合前几次 continued run 的逐条修口，这说明当前 frozen baseline 下的第一轮 formal long-chain gate 已经暂时跑通
- 目前仍然没有足够证据把问题归到 `state-pressure candidate`
- 到目前为止，掉出来的问题都更像 rule-layer gaps，而且都已经被逐条收掉
