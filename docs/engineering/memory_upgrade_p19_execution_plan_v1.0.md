# SparkCore Memory Upgrade P19 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P18 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P18` 收官说明
- 更长期的 memory persistence 总纲
- 完整 close-note lifecycle 设计提案

本文档是：

- `P19` 的第一批实施基线
- 从 `P18` 已成立的 `close-note artifact contract` 继续推进到“更稳定的 close-note output contract、更明确的 runtime close-note emission surface、以及更接近真实记录 / 落库准备态”的执行文档

上层输入：

- [memory_upgrade_p18_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_close_note_v1.0.md)
- [memory_upgrade_p18_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_close_readiness_v1.0.md)
- [memory_upgrade_p18_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_execution_plan_v1.0.md)
- [memory_upgrade_p18_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p18_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P19 的一句话目标

**在 `P18` 已建立的 `close-note artifact contract` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note output contract、可消费的 runtime close-note emission surface、以及更明确的 artifact-to-output regression gate”。**

---

## 3. P19 与 P18 的分界

`P18` 已经完成的是：

- `role_core_memory_close_note_artifact`
- artifact-aware runtime / assistant metadata / developer diagnostics / system prompt / harness 复用
- `p18_regression_gate / p18_gate_snapshot / close-readiness / close note` 闭环
- `P18` 非阻塞尾项已统一并入 tail cleanup backlog

`P19` 不再重复做这些 “close-note artifact 最小成立证明”。

`P19` 重点解决的是：

1. 把 `P18` 的 close-note artifact 收成更像最终输出载荷的 close-note output contract
2. 让 close-note output 不只停在 artifact prompt / metadata / debug surface，而开始形成 runtime 主路径可复用的 emission surface
3. 让阶段 gate 开始直接锁 artifact-to-output 的 carry-through，而不是只锁 artifact 自身存在
4. 为后续真正的 close-note 记录、归档或落库减少重复拼接成本

---

## 4. P19 首批目标

### 4.1 Namespace close-note output contract v1

`P19` 首批要把 namespace 从：

- `P18` 的 close-note artifact namespace section

继续推进到：

- close-note output 内的独立 namespace output section
- 更明确的 namespace output summary / emission surface

### 4.2 Retention close-note output contract v1

`P19` 首批要把 retention 从：

- `P18` 的 close-note artifact retention section

继续推进到：

- close-note output 内的独立 retention output section
- 更明确的 retention output carry-through / emission surface

### 4.3 Knowledge close-note output contract v1

`P19` 首批要把 knowledge 从：

- `P18` 的 close-note artifact knowledge section

继续推进到：

- close-note output 内的独立 knowledge output section
- 更明确的 knowledge output carry-through / emission surface

### 4.4 Scenario close-note output contract v1

`P19` 首批要把 scenario 从：

- `P18` 的 close-note artifact scenario section

继续推进到：

- close-note output 内的独立 scenario output section
- 更明确的 scenario output carry-through / emission surface

### 4.5 Regression / acceptance close-note outputization

`P19` 首批必须让阶段 gate 跟着 close-note output 主线生长，而不是等 output 事实散落到 runtime / docs 之后再回头补。

最小要求：

- `P19` 形成第一版阶段 gate
- gate 至少锁：
  - role core memory close-note output contract v1
  - output metadata / runtime consistency
  - artifact-to-output carry-through consistency

---

## 5. P19 施工顺序建议

建议顺序：

1. `P19-1 Namespace close-note output contract v1`
2. `P19-2 Retention close-note output contract v1`
3. `P19-3 Knowledge close-note output contract v1`
4. `P19-4 Scenario close-note output contract v1`
5. `P19-5 Regression / acceptance close-note outputization`

原因：

- `P18 close-note artifact` 已经是稳定上游，最自然的下一步是把它收成更接近真实 close-note 输出的 contract，而不是再新增一层平行文案
- close-note output 一旦成立，后续 runtime 记录 / 归档 / 落库才会有统一消费面
- gate 继续保持“跟着主线长”，避免 `P19` 再次出现 output 事实已成立但阶段判断仍依赖文档拼接的情况

当前阶段判断：

- `P19-1`
  - 已开始
  - namespace close-note output contract 第一刀已成立
- `P19-2`
  - 已开始
  - retention close-note output contract 第一刀已成立
- `P19-3`
  - 已开始
  - knowledge close-note output contract 第一刀已成立
- `P19-4`
  - 已开始
  - scenario close-note output contract 第一刀已成立
- `P19-5`
  - 已开始
  - 第一版正式 gate 已建立

当前 gate 轻量快照请以
[memory_upgrade_p19_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p19_gate_snapshot_v1.0.md)
为准。

整体 `P19` 当前大约：

- **`50% - 55%`**

当前更推荐的下一步：

- **开始把 `P19` 从第一版 output gate 推进到 close-readiness consumption，而不是先写 `P19 close-readiness`**

---

## 6. 当前结论

`P18` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P18` 可以正式视为已收官阶段
- `P19` 应作为新的执行起点
- `P19` 当前更合适的第一步不是回头补 `P18` 说明，而是把 `P18` 已成立的 close-note artifact 收束成更接近真实输出的 close-note output contract
