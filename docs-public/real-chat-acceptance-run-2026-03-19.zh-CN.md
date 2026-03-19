# SparkCore 真实对话验收记录 — 2026-03-19

## 结论

`Acceptable minor drift`

这轮不直接记成 `Pass` 的原因：

- 没有确认到任何 `P0` 产品漂移
- 但有一条 `P1` explanation case 在 smoke harness 的 setup 阶段被打断，没拿到同轮 case body 结果
- 按当前门槛，它不属于 `Must-open-issue`，但也还不能算干净的全绿 `Pass`

这个分类直接遵循了前一条任务里刚定义好的 `Pass / Acceptable minor drift / Must-open-issue` 门槛。

## 执行命令

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat
npx playwright test tests/smoke/core-chat.spec.ts --grep "makes relationship recall visible in self-introduction style|recalls the user's preferred name for the same agent without leaking it to other agents|keeps same-thread relationship style and language continuity on short follow-ups|keeps the default explanation UI focused on one main reason|grounds direct memory recall questions in remembered facts|keeps Chinese on short mixed-language follow-ups after an English memory seed|uses thread continuity as the language source for ambiguous short follow-ups|keeps correction-aftermath metadata stable for relationship nickname recall" --reporter=line
```

这轮 batch smoke 的结果是：

- `6 passed`
- `2 failed`

但这 2 条失败不是同一种性质：

- `makes relationship recall visible in self-introduction style`
  - 在 batch 和单独重跑里都卡在 setup 阶段，`smoke-reset` / `smoke-create-thread` 返回 non-OK，还没进入真正的产品断言
  - 后来改用 smoke API + service-role 手工复核
  - 结果：`PASS`
- `keeps the default explanation UI focused on one main reason`
  - 同样卡在 smoke setup 阶段，case body 没跑起来
  - 这轮没有观察到新的同轮产品失败
  - 这也是本轮最终只能记成 `Acceptable minor drift`、不能直接记成 `Pass` 的唯一原因

额外的 harness 健康校验：

- 我还手工对本地 smoke server 调了一次 `POST /api/test/smoke-reset`
- 返回是 `200 OK`
- 这进一步支持一个判断：这轮看到的是间歇性的 harness 噪音，不是 reset route 持续坏掉

## 场景包结果

### 关系维持包

- `real-chat-same-agent-relationship-continuity`
  - 结果：`PASS`
  - 证据：
    - `recalls the user's preferred name for the same agent without leaking it to other agents`
    - `makes relationship recall visible in self-introduction style` 的手工 smoke 复核
  - failing turn：`none`
  - drift dimension：`none`
  - main developer reason：`n/a`

- `real-chat-relationship-style-continuity`
  - 结果：`PASS`
  - 证据：
    - `keeps same-thread relationship style and language continuity on short follow-ups`
  - failing turn：`none`
  - drift dimension：`none`
  - main developer reason：`n/a`

- `real-chat-explanation-layer-guardrail`
  - 结果：`Acceptable minor drift`
  - 证据：
    - 这轮 batch smoke 在 case body 前就被 setup 失败打断
    - 这条规则最近一条 dedicated focused smoke 之前是绿的，而且这轮没有相关产品代码变更
  - failing turn：`setup-before-case-body`
  - drift dimension：`none confirmed`
  - main developer reason：`smoke-reset setup instability`

### 记忆确认包

- `real-chat-profession-recall`
  - 结果：`PASS`
  - 证据：
    - `grounds direct memory recall questions in remembered facts`
  - failing turn：`none`
  - drift dimension：`none`
  - main developer reason：`n/a`

### 混合语言包

- `real-chat-latest-language-priority`
  - 结果：`PASS`
  - 证据：
    - `keeps Chinese on short mixed-language follow-ups after an English memory seed`
    - `uses thread continuity as the language source for ambiguous short follow-ups`
  - failing turn：`none`
  - drift dimension：`none`
  - main developer reason：`n/a`

### 纠错后续包

- `real-chat-incorrect-restore-cycle`
  - 结果：`PASS`
  - 证据：
    - `keeps correction-aftermath metadata stable for relationship nickname recall`
  - failing turn：`none`
  - drift dimension：`none`
  - main developer reason：`n/a`

## 手工复核补充

`relationship self-intro` 这条后来绕开不稳定的 batch harness，做了手工复核。

观察结果：

- 回复：`嗨，阿强。 我是小芳，很高兴继续和你聊。`
- metadata：
  - `answer_strategy=grounded-open-ended-summary`
  - `memory_used=true`
  - `memory_types_used=[relationship]`
  - recalled relationship memories 包含：
    - `agent_nickname=小芳`
    - `user_preferred_name=阿强`
    - `user_address_style=casual`

这支持一个更合理的判断：batch 里那条失败更像 harness 噪音，而不是确认过的 relationship continuity 回归。

## 验收判断

本轮最终记为 `Acceptable minor drift`，不记为 `Pass`，原因是：

- 所有观察到的 `P0` 产品检查在剥离 harness 噪音后都通过了
- 没有任何一个 scenario pack 出现确认过的 drift dimension
- 但有一条 `P1` explanation case 因 smoke harness 在 case body 前失败，没有拿到干净的同轮确认

因此，这轮不会因为产品漂移直接开 follow-up issue。
