# SparkCore Memory Upgrade P21 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P20 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P20` 收官说明
- 更长期的 close-note persistence 总纲
- 完整 archive / persistence 子系统设计提案

本文档是：

- `P21` 的第一批实施基线
- 从 `P20` 已成立的 `close-note record contract` 继续推进到“独立的 close-note archive contract、更明确的 runtime close-note archive surface、以及更接近真实归档准备态”的执行文档

上层输入：

- [memory_upgrade_p20_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_close_note_v1.0.md)
- [memory_upgrade_p20_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_close_readiness_v1.0.md)
- [memory_upgrade_p20_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_execution_plan_v1.0.md)
- [memory_upgrade_p20_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P21 的一句话目标

**在 `P20` 已建立的 `close-note record contract` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note archive contract、可消费的 runtime close-note archive surface、以及更接近真实 archive / persistence 准备态”的下一阶段。**

---

## 3. P21 与 P20 的分界

`P20` 已经完成的是：

- `role_core_memory_close_note_record`
- record-aware runtime / assistant metadata / developer diagnostics / system prompt / harness 复用
- `p20_regression_gate / p20_gate_snapshot / close-readiness / close note` 闭环
- `P20` 非阻塞尾项已统一并入 tail cleanup backlog

`P21` 不再重复做这些 “close-note record 最小成立证明”。

`P21` 重点解决的是：

1. 把 `P20` 的 close-note record 收成更像最终归档载荷的 close-note archive contract
2. 让 close-note archive 不只停在 record prompt / metadata / debug surface，而开始形成 runtime 主路径可复用的 archive surface
3. 让阶段 gate 开始直接锁 record-to-archive 的 carry-through，而不是只锁 record 自身存在
4. 为后续真正的 close-note archive / persistence 减少重复拼接成本

---

## 4. P21 首批目标

### 4.1 Namespace close-note archive contract v1

`P21` 首批要把 namespace 从：

- `P20` 的 close-note record namespace section

继续推进到：

- close-note archive 内的独立 namespace archive section
- 更明确的 namespace archive summary / archive surface

### 4.2 Retention close-note archive contract v1

`P21` 后续要把 retention 从：

- `P20` 的 close-note record retention section

继续推进到：

- close-note archive 内的独立 retention archive section
- 更明确的 retention archive carry-through / archive surface

### 4.3 Knowledge close-note archive contract v1

`P21` 后续要把 knowledge 从：

- `P20` 的 close-note record knowledge section

继续推进到：

- close-note archive 内的独立 knowledge archive section
- 更明确的 knowledge archive carry-through / archive surface

### 4.4 Scenario close-note archive contract v1

`P21` 后续要把 scenario 从：

- `P20` 的 close-note record scenario section

继续推进到：

- close-note archive 内的独立 scenario archive section
- 更明确的 scenario archive carry-through / archive surface

### 4.5 Regression / acceptance close-note archiveization

`P21` 首批必须让阶段 gate 跟着 close-note archive 主线生长，而不是等 archive 事实散落到 runtime / docs 之后再回头补。

最小要求：

- `P21` 形成第一版阶段 gate
- gate 至少锁：
  - namespace close-note archive contract v1
  - archive metadata / runtime consistency
  - record-to-archive carry-through consistency

---

## 5. P21 施工顺序建议

建议顺序：

1. `P21-1 Namespace close-note archive contract v1`
2. `P21-2 Retention close-note archive contract v1`
3. `P21-3 Knowledge close-note archive contract v1`
4. `P21-4 Scenario close-note archive contract v1`
5. `P21-5 Regression / acceptance close-note archiveization`

原因：

- `P20 close-note record` 已经是稳定上游，最自然的下一步是把它收成更接近真实 close-note archive 的 contract
- close-note archive 一旦成立，后续 archive / persistence 才会有统一消费面
- gate 继续保持“跟着主线长”，避免 `P21` 再次出现 archive 事实已成立但阶段判断仍依赖文档拼接的情况

当前阶段判断：

- `P21-1`
  - 已开始
  - namespace close-note archive contract 第一刀已成立
- `P21-2`
  - 已开始
  - retention close-note archive contract 第一刀已成立
- `P21-3`
  - 已开始
  - knowledge close-note archive contract 第一刀已成立
- `P21-4`
  - 已开始
  - scenario close-note archive contract 第一刀已成立
- `P21-5`
  - 已开始
  - 第一版正式 gate 已建立

当前 gate 轻量快照请以
[memory_upgrade_p21_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_gate_snapshot_v1.0.md)
为准。

整体 `P21` 当前大约：

- **`75% - 80%`**

当前更推荐的下一步：

- **继续做 `P21` 的最后一轮 close-readiness 收束，而不是回头补 archive 主线单点 contract**

当前正式阶段判断请以
[memory_upgrade_p21_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_close_readiness_v1.0.md)
为准。

---

## 6. 当前结论

`P20` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P20` 可以正式视为已收官阶段
- `P21` 应作为新的执行起点
- `P21` 当前更合适的第一步不是回头补 `P20` 说明，而是把 `P20` 已成立的 close-note record 收束成更接近真实归档面的 close-note archive contract
