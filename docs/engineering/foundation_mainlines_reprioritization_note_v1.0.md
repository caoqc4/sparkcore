# 底座主线重新排优先级说明 v1.0

## 1. 文档定位

本文档用于在当前阶段重新评估 SparkCore 几条底座主线：

- `runtime`
- `session`
- `role`
- `follow_up`

的成熟度与下一轮优先级。

本文档不重复各自主线的能力总结，而是重点回答：

- 现在全局最值得继续推进的是哪一条
- 哪几条已经适合先停
- 哪些事情当前明确不建议立刻做
- 如果下一轮只开一条主线，最值钱的一刀应该是什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / foundation mainlines reprioritization
> 相关文档：
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `docs/engineering/role_mainline_capability_summary_v1.0.md`
> - `docs/engineering/followup_proactive_capability_summary_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话结论

**当前四条底座主线都已经到达可暂停的健康节点；如果下一轮只继续一条，全局最值得优先推进的已经不是 `session` 本身，而是回到更高一层的 `runtime` 输出治理，具体优先级应是：`runtime > session > role > follow_up`。**

---

## 3. 当前四条主线的共同状态

现在这四条线都已经不再是“边想边做”的状态，而是都具备：

- 主文档
- capability summary / decision note
- 至少一层真实代码壳
- 已进入主路径的最小接线

这意味着当前不是缺“更多局部实现”，而是更缺：

- 全局下一轮到底该推哪条
- 哪些线现在已经足够成熟，可以先冻结

也就是说，当前更像一次：

**底座主线重新排优先级**

而不是继续在某一条已经成形的线上顺手往下挖。

---

## 4. 为什么当前不建议优先继续 `follow_up`

`follow_up` 这条线已经完成了很值钱的一轮：

- pending 持久化
- claim / result marking
- proactive sender contract
- default worker shell
- internal route
- 真实 Telegram proactive send 验证

这说明它已经从“概念 PoC”进入了：

- 受控可运行
- 真实已验证
- 默认仍保守

如果现在继续推进，下一步很快就会碰到：

- 默认真实 sender 开启策略
- 更长期的调度与恢复
- 更重的运行系统复杂度

这些都明显不是当前最值得优先继续的一刀。

所以 `follow_up` 当前应排在最后，先停。

---

## 5. 为什么当前不建议优先继续 `role`

`role` 这条线已经完成了：

- `RoleRepository`
- `RoleResolver`
- runtime / IM 主路径迁移

它当前最像的是：

- 分层已经成立
- 主路径已经接上
- 下一步一旦继续，就会更像 metadata / policy 深化

这不是不重要，而是：

- 当前短期系统收益不会比别的线更高
- 复杂度会上升更快

所以 `role` 当前也适合先停，排在 `session` 之后。

---

## 6. 为什么 `session` 仍然值得保持第二优先级

`session` 这条线这轮推进很深，而且推进得非常完整：

- state contract
- loader boundary
- repository boundary
- Supabase 读取壳
- 默认真实读取
- save 接口
- writeback trigger
- debug metadata
- runtime event
- counter design

这意味着：

- `session` 当前已经不再缺最小闭环
- 继续往前就会明显进入：
  - counter 落代码
  - retry
  - compaction

也就是说，`session` 仍然很重要，但现在更像：

- 已形成健康状态治理主线
- 但不该继续成为全局第一优先级

所以我会把它排在第二，而不是第一。

---

## 7. 为什么当前更值得回到 `runtime`

现在最有杠杆的位置，其实重新回到了 `runtime`。

原因不是 runtime 还不够清楚，而恰恰是因为它已经清楚到：

- input 有了
- preparation 有了
- prepared execution 有了
- `RuntimeTurnResult` 有了
- session state side effect 也已经开始进入 output 面

这时候最值得继续推进的，不再是继续拆 execution，而是：

**runtime 输出治理**

更具体地说，当前最可能有全局收益的一刀是：

- 重新评估 `RuntimeTurnResult / runtime_events / debug_metadata` 三层边界

因为现在：

- memory
- follow_up
- session state

都已经在往 runtime 输出层挂更多信息。

如果不先治理这层，后面很容易出现：

- 顶层输出越来越宽
- debug metadata 越来越杂
- event 与 metadata 职责反复重叠

这比继续局部扩一条支线，更值得先做。

---

## 8. 当前建议的全局优先级

当前我建议的优先级如下：

### Priority 1

`runtime`

- 做一份 runtime 输出治理的最小决策说明  
  重点回答：
  - `RuntimeTurnResult`
  - `runtime_events`
  - `debug_metadata`
  三层接下来怎么继续收口

### Priority 2

`session`

- 保持当前已形成的读取/写回/观测边界
- 暂不继续落 counter / retry / compaction 代码

### Priority 3

`role`

- 保持当前 repository / resolver / preparation 状态
- 暂不继续深推 metadata / policy

### Priority 4

`follow_up`

- 继续停在“受控可运行、真实已验证、默认仍保守”的节点

---

## 9. 当前明确不建议立刻做的事

当前不建议马上做：

- `session` counter 代码壳
- `session` retry
- `session` compaction
- `role` metadata 深化
- `follow_up` 自动化调度深化
- `runtime` execution 再细拆

这些事情都不一定错，但现在都不是全局最有杠杆的一刀。

---

## 10. 结论

当前底座几条主线都已经到了可暂停的健康节点。

如果下一轮只继续一条，我建议：

**优先回到 `runtime`，做 runtime 输出治理的最小阶段决策，而不是继续深挖 `session`、`role` 或 `follow_up`。**

也就是说，当前更好的全局顺序是：

**先治理 runtime 输出层，再决定哪条支线继续扩张。**
