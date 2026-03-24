# SparkCore Memory Upgrade P20 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P19 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P19` 收官说明
- 更长期的 close-note persistence 总纲
- 完整归档/落库子系统设计提案

本文档是：

- `P20` 的第一批实施基线
- 从 `P19` 已成立的 `close-note output contract` 继续推进到“更稳定的 close-note record contract、更明确的 runtime close-note record surface、以及更接近真实记录/归档准备态”的执行文档

上层输入：

- [memory_upgrade_p19_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_close_note_v1.0.md)
- [memory_upgrade_p19_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_close_readiness_v1.0.md)
- [memory_upgrade_p19_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_execution_plan_v1.0.md)
- [memory_upgrade_p19_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P20 的一句话目标

**在 `P19` 已建立的 `close-note output contract` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note record contract、可消费的 runtime close-note record surface、以及更接近真实记录 / 归档准备态”的下一阶段。**

---

## 3. P20 与 P19 的分界

`P19` 已经完成的是：

- `role_core_memory_close_note_output`
- output-aware runtime / assistant metadata / developer diagnostics / system prompt / harness 复用
- `p19_regression_gate / p19_gate_snapshot / close-readiness / close note` 闭环
- `P19` 非阻塞尾项已统一并入 tail cleanup backlog

`P20` 不再重复做这些 “close-note output 最小成立证明”。

`P20` 重点解决的是：

1. 把 `P19` 的 close-note output 收成更像最终记录载荷的 close-note record contract
2. 让 close-note record 不只停在 output prompt / metadata / debug surface，而开始形成 runtime 主路径可复用的 record surface
3. 让阶段 gate 开始直接锁 output-to-record 的 carry-through，而不是只锁 output 自身存在
4. 为后续真正的 close-note record / archive / persistence 减少重复拼接成本

---

## 4. P20 首批目标

### 4.1 Namespace close-note record contract v1

`P20` 首批要把 namespace 从：

- `P19` 的 close-note output namespace section

继续推进到：

- close-note record 内的独立 namespace record section
- 更明确的 namespace record summary / record surface

### 4.2 Retention close-note record contract v1

`P20` 后续要把 retention 从：

- `P19` 的 close-note output retention section

继续推进到：

- close-note record 内的独立 retention record section
- 更明确的 retention record carry-through / record surface

### 4.3 Knowledge close-note record contract v1

`P20` 后续要把 knowledge 从：

- `P19` 的 close-note output knowledge section

继续推进到：

- close-note record 内的独立 knowledge record section
- 更明确的 knowledge record carry-through / record surface

### 4.4 Scenario close-note record contract v1

`P20` 后续要把 scenario 从：

- `P19` 的 close-note output scenario section

继续推进到：

- close-note record 内的独立 scenario record section
- 更明确的 scenario record carry-through / record surface

### 4.5 Regression / acceptance close-note recordization

`P20` 首批必须让阶段 gate 跟着 close-note record 主线生长，而不是等 record 事实散落到 runtime / docs 之后再回头补。

最小要求：

- `P20` 形成第一版阶段 gate
- gate 至少锁：
  - namespace close-note record contract v1
  - record metadata / runtime consistency
  - output-to-record carry-through consistency

---

## 5. P20 施工顺序建议

建议顺序：

1. `P20-1 Namespace close-note record contract v1`
2. `P20-2 Retention close-note record contract v1`
3. `P20-3 Knowledge close-note record contract v1`
4. `P20-4 Scenario close-note record contract v1`
5. `P20-5 Regression / acceptance close-note recordization`

原因：

- `P19 close-note output` 已经是稳定上游，最自然的下一步是把它收成更接近真实 close-note 记录的 contract
- close-note record 一旦成立，后续 record / archive / persistence 才会有统一消费面
- gate 继续保持“跟着主线长”，避免 `P20` 再次出现 record 事实已成立但阶段判断仍依赖文档拼接的情况

当前阶段判断：

- `P20-1`
  - 已开始
  - namespace close-note record contract 第一刀已成立
- `P20-2`
  - 已开始
  - retention close-note record contract 第一刀已成立
- `P20-3`
  - 已开始
  - knowledge close-note record contract 第一刀已成立
- `P20-4`
  - 已开始
  - scenario close-note record contract 第一刀已成立
- `P20-5`
  - 已开始
  - 已开始进入 close-readiness consumption / acceptance gap structuring

当前 gate 轻量快照请以
[memory_upgrade_p20_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_gate_snapshot_v1.0.md)
为准。

当前 `close-readiness` 判断请以
[memory_upgrade_p20_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_close_readiness_v1.0.md)
为准。

当前 `P20` 收官结论请以
[memory_upgrade_p20_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p20_close_note_v1.0.md)
为准。

整体 `P20` 当前大约：

- **`80% - 85%`**

当前更推荐的下一步：

- **开始下一阶段执行文档 / 第一批任务拆解**

---

## 6. 当前结论

`P19` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P19` 可以正式视为已收官阶段
- `P20` 应作为新的执行起点
- `P20` 当前更合适的第一步不是回头补 `P19` 说明，而是把 `P19` 已成立的 close-note output 收束成更接近真实记录的 close-note record contract
