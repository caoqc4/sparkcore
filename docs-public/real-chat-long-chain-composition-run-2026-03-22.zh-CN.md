# SparkCore 长链路组合效应验证记录 — 2026-03-22

## Run Metadata

- `run_id`: `long-chain-composition-2026-03-22-001`
- `run_status`: `completed-with-targeted-chain-drift`
- `pack_version_or_ref`: `5a0e592:apps/web/lib/testing/quality-eval.ts`
- `scenario_scope`:
  - `real-chat-long-chain-anti-analysis-carry-forward`
  - `real-chat-long-chain-anti-comforting-resume`
- `execution_principle`:
  - 第一轮只测组合效应
  - 不混入新 phrasing 探索
  - 先判断 `链路失真` 还是 `局部 phrase 漏洞`
- `execution_env_fingerprint`:
  - app mode: `next start`
  - smoke mode: `PLAYWRIGHT_SMOKE_MODE=1`
  - smoke identity: `smoke@example.com`
  - profile: `Spark Default`
  - base URL: `http://localhost:3001`

## 结论摘要

- `overall_conclusion`: `one case holds, one case shows chain-level drift`
- `next_action`: `open_small_chain_guardrail_issue`

这轮最重要的结论不是“还有哪句没补”，而是：

- 第一条链路确实暴露了组合后失真
- 失真点不是开场完全没接住
- 而是链路进入第 2 轮后，brief catch 和 carry-forward 一起塌回了 `default-grounded / generic continuation`

因此这轮更像：

- `chain interaction` 问题

而不是：

- 新 phrasing 未覆盖

## Commands Used

```bash
cd apps/web
npm run build
PLAYWRIGHT_SMOKE_MODE=1 \
PLAYWRIGHT_SMOKE_SECRET=sparkcore-smoke-local \
PLAYWRIGHT_SMOKE_EMAIL=smoke@example.com \
PLAYWRIGHT_SMOKE_PASSWORD='SparkcoreSmoke123!' \
npm run start -- --hostname localhost --port 3001
```

执行路径：

- `POST /api/test/smoke-reset`
- `POST /api/test/smoke-create-thread`
- `POST /api/test/smoke-send-turn`
- 直接从 `messages` 读取 assistant reply metadata

## Per-Scenario Observation

### `real-chat-long-chain-anti-analysis-carry-forward`

- `status`: `FAIL`
- `failed_turn`: `2`
- `drift_dimension`: `relationship-continuity`
- `main_developer_reason`: `brief catch turn and later carry-forward both fell back to default-grounded instead of preserving the chain's continuity shape`
- `scenario_verdict`: `soft drift toward generic continuation`
- `failure_classification`: `chain distortion`

观测到的 turn 序列：

1. `我现在有点乱，你先别急着分析我。`
   - reply: `好，我先不急着分析你，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `answer_strategy_reason_code=default-grounded-fallback`
   - 判断：
     - 内容本身是对路的
     - 这一步还不构成真正 breach
     - 更像 opening 仍落在默认 grounded lane，但没有明显掉味
2. `你先接我一句就好。`
   - reply: `好的，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
   - 判断：
     - 这里开始出现真正失真
     - 本应是 brief emotional catch
     - 结果塌成 generic continuation
3. `你再陪我往下走一点。`
   - reply: `好的，我们继续。`
   - metadata:
     - `answer_strategy=default-grounded`
     - `continuation_reason_code=null`
   - 判断：
     - carry-forward 没有成形
     - 同样被拖回 generic continuation

same-scenario rerun 结果：

- 复现了同样结构：
  - Turn 1 内容仍可接受
  - Turn 2 / Turn 3 继续落在 `default-grounded`
- 因此这次不按 `environment_noise` 处理

结论：

- 这不是新的单句没补到
- 因为链路里的三个 phrasing 都是已收好的切口
- 真正的问题是：
  - 开场 anti-analysis 之后
  - brief catch 和 gentle carry-forward 的 answer-shape precedence 没能保持

### `real-chat-long-chain-anti-comforting-resume`

- `status`: `PASS`
- `scenario_verdict`: `holds as one continuing role`

观测到的 turn 序列：

1. `你先别急着安慰我。`
   - reply: `好，我先不急着安慰你，就在这儿陪着你。`
   - metadata:
     - `answer_strategy=default-grounded`
   - 判断：
     - 开场虽然没有显式落到 same-thread continuation
     - 但内容保持了 anti-comforting + companionship 体感
2. `你还在这儿陪我，对吧。`
   - reply: `我还在这儿陪着你。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
3. `好，那你慢慢继续和我说。`
   - reply: `好，我们就慢慢接着说。`
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`

same-scenario rerun 结果：

- 结构稳定复现
- Turn 2 / Turn 3 持续保持在 `same-thread-continuation`
- 没有新的 drift signal

结论：

- 这条链路是成立的
- 说明“anti-comforting -> presence confirmation -> gentle resume”这组已收微线，在组合上已经比较稳定

## 这轮为什么不直接回到 phrase issue

因为最有价值的失败不是：

- 某一句完全没人管

而是：

- 第一条链路在第 2 轮开始，逐步塌回 generic continuation

这类问题更像：

- answer-shape precedence 不稳
- chain-level continuity preserving instruction 不足

而不是：

- 再补一个近义句就能解决

## 建议后续动作

1. 先为 `real-chat-long-chain-anti-analysis-carry-forward` 开一条 very small 的 chain-level guardrail issue
2. guardrail 目标不要扩 phrasing 包
3. 只守：
   - anti-analysis opening 之后
   - brief catch 不能塌成 generic continuation
   - gentle carry-forward 不能继续沿 generic continuation 滑下去
4. 修完后再 rerun 这两条长链路

## 当前阶段判断

这轮已经证明下一阶段方向是对的：

- 长链路验证确实能暴露单句 smoke 看不到的组合失真
- 而且失败点已经足够具体，可以直接长出最小 guardrail
