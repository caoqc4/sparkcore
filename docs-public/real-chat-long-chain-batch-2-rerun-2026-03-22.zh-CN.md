# SparkCore 第二批长链路组合效应复验记录 — 2026-03-22

## Run Metadata

- `run_id`: `long-chain-composition-2026-03-22-004`
- `run_purpose`: `rerun after #236 anti-advice chain fix and #237 shared-push closing fix`
- `base_run_ref`: `docs-public/real-chat-long-chain-batch-2-run-2026-03-22.zh-CN.md`
- `code_ref`:
  - `ec8ae7c: fix: keep guided next-step grounded after anti-advice openings`
  - `715c2e4: fix: keep light closing grounded after shared-push chains`
- `scenario_scope`:
  - `real-chat-long-chain-same-side-shared-push-closing`
  - `real-chat-long-chain-anti-advice-step-guidance`
- `execution_principle`:
  - 第二批复验仍只测组合效应
  - 不混入新 phrasing 探索
  - 优先看 scenario-level verdict 是否从 drift 回到 hold

## 结论摘要

- `overall_conclusion`: `both second-batch cases now hold as one continuing role after targeted chain-level fixes`
- `next_action`: `do not reopen phrase expansion for these chains; move to a new failure theme if the next batch is started`

这轮最重要的变化是：

- `real-chat-long-chain-same-side-shared-push-closing`
  - 已经从 `soft drift toward detached recap`
  - 转成 `holds as one continuing role`
- `real-chat-long-chain-anti-advice-step-guidance`
  - 已经从 `soft drift toward detached task mode`
  - 转成 `holds as one continuing role`

这说明第二批暴露出来的问题也确实是：

- later-turn answer-shape precedence
- chain-level continuity guardrail

而不是继续 phrase-by-phrase 扩张。

## Commands Used

```bash
cd apps/web
npm run typecheck
npm run quality:eval -- --suite=real-chat
```

## Per-Scenario Verdict

### `real-chat-long-chain-same-side-shared-push-closing`

- `status`: `PASS`
- `scenario_verdict`: `holds as one continuing role`
- `delta_vs_previous_run`: `fixed previous detached closing drift`

关键观测：

1. `你先站我这边。`
   - reply 仍然保持 same-side
   - metadata:
     - `answer_strategy=same-thread-continuation`
2. `那我们先一起把这一点弄过去。`
   - reply 仍然保持 light shared-push
   - metadata:
     - `answer_strategy=same-thread-continuation`
3. `你最后帮我把这段收一下。`
   - closing 不再掉回 generic continuation
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-summary-carryover`

判断：

- closing turn 已经重新接回 same-thread continuity path
- 不再出现 detached recap / generic continuation
- 这条链现在可以视为阶段性收束

### `real-chat-long-chain-anti-advice-step-guidance`

- `status`: `PASS`
- `scenario_verdict`: `holds as one continuing role`
- `delta_vs_previous_run`: `fixed previous detached task-mode drift`

关键观测：

1. `你先别急着给我建议。`
   - reply 继续保持 anti-advice continuity
   - metadata:
     - `answer_strategy=same-thread-continuation`
2. `你先帮我缓一下，再说。`
   - steadying turn 已不再塌成 generic continuation
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`
3. `好，你再陪我理一步。`
   - guidance turn 不再进入 detached advice / task mode
   - metadata:
     - `answer_strategy=same-thread-continuation`
     - `continuation_reason_code=brief-supportive-carryover`

判断：

- steadying 和 guided next-step 现在已经都保持在同一条关系线上
- 这次修口解决的是 same-thread continuation 被 advice fallback 抢走的问题
- 这条链现在也可以视为阶段性收束

## 当前阶段判断

这轮复验证明：

1. 第二批长链路暴露出来的 failure theme 已经各自被 very small 的 chain-level fix 收住
2. 复验结果支持“先判 chain distortion，再决定 guardrail”的推进方式
3. 当前更值钱的下一步不是回去扩 phrase，而是挑下一条不同失败主题的长链路

## 建议后续动作

1. 关闭 `#238`
2. 不再继续给这两条第二批长链路补近义句
3. 如果继续下一阶段，优先选新的长链路失败主题，而不是回到单句扩张
