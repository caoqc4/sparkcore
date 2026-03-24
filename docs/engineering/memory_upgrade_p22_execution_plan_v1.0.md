# SparkCore Memory Upgrade P22 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P21 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P21` 收官说明
- 更长期的 persistence / storage 子系统总纲
- 完整 close-note persistence 方案提案

本文档是：

- `P22` 的第一批实施基线
- 从 `P21` 已成立的 `close-note archive contract` 继续推进到“独立的 close-note persistence payload、更明确的 runtime persistence payload surface、以及更接近真实 persistence-ready contract”的执行文档

上层输入：

- [memory_upgrade_p21_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_close_note_v1.0.md)
- [memory_upgrade_p21_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_close_readiness_v1.0.md)
- [memory_upgrade_p21_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_execution_plan_v1.0.md)
- [memory_upgrade_p21_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p21_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P22 的一句话目标

**在 `P21` 已建立的 `close-note archive contract` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note persistence payload、可消费的 runtime persistence payload surface、以及更接近真实 persistence-ready contract”的下一阶段。**

---

## 3. P22 与 P21 的分界

`P21` 已经完成的是：

- `role_core_memory_close_note_archive`
- archive-aware runtime / assistant metadata / developer diagnostics / system prompt / harness 复用
- `p21_regression_gate / p21_gate_snapshot / close-readiness / close note` 闭环
- `P21` 非阻塞尾项已统一并入 tail cleanup backlog

`P22` 不再重复做这些 “close-note archive 最小成立证明”。

`P22` 重点解决的是：

1. 把 `P21` 的 close-note archive 收成更像最终持久化载荷的 close-note persistence payload
2. 让 persistence payload 不只停在 archive prompt / metadata / debug surface，而开始形成 runtime 主路径可复用的 persistence surface
3. 让阶段 gate 开始直接锁 archive-to-persistence 的 carry-through，而不是只锁 archive 自身存在
4. 为后续真正的 close-note persistence / storage integration 减少重复拼接成本

---

## 4. P22 首批目标

### 4.1 Namespace close-note persistence payload v1

`P22` 首批要把 namespace 从：

- `P21` 的 close-note archive namespace section

继续推进到：

- close-note persistence payload 内的独立 namespace persistence section
- 更明确的 namespace persistence summary / persistence surface

### 4.2 Retention close-note persistence payload v1

`P22` 后续要把 retention 从：

- `P21` 的 close-note archive retention section

继续推进到：

- close-note persistence payload 内的独立 retention persistence section
- 更明确的 retention persistence carry-through / persistence surface

### 4.3 Knowledge close-note persistence payload v1

`P22` 后续要把 knowledge 从：

- `P21` 的 close-note archive knowledge section

继续推进到：

- close-note persistence payload 内的独立 knowledge persistence section
- 更明确的 knowledge persistence carry-through / persistence surface

### 4.4 Scenario close-note persistence payload v1

`P22` 后续要把 scenario 从：

- `P21` 的 close-note archive scenario section

继续推进到：

- close-note persistence payload 内的独立 scenario persistence section
- 更明确的 scenario persistence carry-through / persistence surface

### 4.5 Regression / acceptance close-note persistence payloadization

`P22` 首批必须让阶段 gate 跟着 close-note persistence payload 主线生长，而不是等 persistence 事实散落到 runtime / docs 之后再回头补。

最小要求：

- `P22` 形成第一版阶段 gate
- gate 至少锁：
  - namespace close-note persistence payload v1
  - persistence metadata / runtime consistency
  - archive-to-persistence carry-through consistency

---

## 5. P22 施工顺序建议

建议顺序：

1. `P22-1 Namespace close-note persistence payload v1`
2. `P22-2 Retention close-note persistence payload v1`
3. `P22-3 Knowledge close-note persistence payload v1`
4. `P22-4 Scenario close-note persistence payload v1`
5. `P22-5 Regression / acceptance close-note persistence payloadization`

原因：

- `P21 close-note archive` 已经是稳定上游，最自然的下一步是把它收成更接近真实 close-note persistence 的 contract
- close-note persistence payload 一旦成立，后续 persistence / storage integration 才会有统一消费面
- gate 继续保持“跟着主线长”，避免 `P22` 再次出现 persistence 事实已成立但阶段判断仍依赖文档拼接的情况

当前阶段判断：

- `P22-1`
  - 已开始
  - namespace close-note persistence payload 第一刀已成立
- `P22-2`
  - 已开始
  - retention close-note persistence payload 第一刀已成立
- `P22-3`
  - 待开始
- `P22-4`
  - 待开始
- `P22-5`
  - 已开始
  - 第一版正式 gate 已建立

当前 gate 轻量快照请以
[memory_upgrade_p22_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p22_gate_snapshot_v1.0.md)
为准。

整体 `P22` 当前大约：

- **`20% - 25%`**

当前更推荐的下一步：

- **继续做 `P22-3 Knowledge close-note persistence payload v1`，而不是先写 `P22 close-readiness`**

---

## 6. 当前结论

`P21` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P21` 可以正式视为已收官阶段
- `P22` 应作为新的执行起点
- `P22` 当前更合适的第一步不是回头补 `P21` 说明，而是把 `P21` 已成立的 close-note archive 收束成更接近真实 persistence-ready contract 的 close-note persistence payload
