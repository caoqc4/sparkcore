# SparkCore Memory Upgrade P17 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P16 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P16` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P17` 的第一批实施基线
- 从 `P16` 已成立的 `role_core_packet.memory_handoff` 与 close-note 判断事实，继续推进到“更稳定的 close-note handoff packet、更明确的 close-note packet gate、以及更接近 runtime close-note consumption”的执行文档

上层输入：

- [memory_upgrade_p16_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_close_note_v1.0.md)
- [memory_upgrade_p16_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_close_readiness_v1.0.md)
- [memory_upgrade_p16_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_execution_plan_v1.0.md)
- [memory_upgrade_p16_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p16_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [layer-a-role-core-packet-contract-2026-03-22.zh-CN.md](/Users/caoq/git/sparkcore/docs-public/layer-a-role-core-packet-contract-2026-03-22.zh-CN.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P17 的一句话目标

**在 `P16` 已建立的 `role_core_packet.memory_handoff` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note handoff packet、可消费的 close-note acceptance gate、以及更明确的 runtime close-note packet 接入准备态”。**

---

## 3. P17 与 P16 的分界

P16 已经解决的，是：

- namespace / retention / knowledge / scenario 四条主线都已进入统一的 `role_core_packet.memory_handoff`
- `p16_regression_gate` / `p16_gate_snapshot` / `close-readiness` / `close note` 已成立
- packet-aware metadata / diagnostics / prompt consumption 已经出现第一版闭环
- `P16` 非阻塞尾项已统一并入 tail cleanup backlog

P17 不再重复做这些 “role-core memory handoff 最小成立证明”。

P17 重点解决的是：

1. 把 `P16` 的 close-note 判断输入收成独立的 close-note handoff packet
2. 把 close-note handoff 从 gate snapshot 自述推进到更稳定的 packet contract
3. 让阶段 gate 开始直接锁 close-note handoff packet，而不是只锁 readiness 文案
4. 为后续 runtime close-note consumption 减少重复拼接成本

---

## 4. P17 首批目标

### 4.1 Namespace close-note handoff packet v1

P17 首批要把 namespace 从：

- `P16` 的 role-core memory handoff

继续推进到：

- close-note handoff packet 内的独立 namespace section
- 更明确的 namespace close-note 引用面

### 4.2 Retention close-note handoff packet v1

P17 首批要把 retention 从：

- `P16` 的 decision-group-aware memory handoff

继续推进到：

- close-note handoff packet 内的独立 retention section
- 更明确的 retained-fields close-note 引用面

### 4.3 Knowledge close-note handoff packet v1

P17 首批要把 knowledge 从：

- `P16` 的 scope-layer-aware memory handoff

继续推进到：

- close-note handoff packet 内的独立 knowledge section
- 更明确的 governance-class close-note 引用面

### 4.4 Scenario close-note handoff packet v1

P17 首批要把 scenario 从：

- `P16` 的 strategy-bundle-aware memory handoff

继续推进到：

- close-note handoff packet 内的独立 scenario section
- 更明确的 orchestration-aware close-note 引用面

### 4.5 Regression / acceptance close-note packetization

P17 首批必须让阶段 gate 跟着 close-note packet 主线生长，而不是等 packet 事实散落到 runtime / docs 之后再回头补。

最小要求：

- `P17` 形成第一版阶段 gate
- gate 至少锁：
  - role core memory close-note handoff packet v1
  - close-note readiness summary 与 packet payload 的一致性
  - runtime close-note packet consumption 的下一步扩张焦点

---

## 5. P17 施工顺序建议

建议顺序：

1. `P17-1 Namespace close-note handoff packet v1`
2. `P17-2 Retention close-note handoff packet v1`
3. `P17-3 Knowledge close-note handoff packet v1`
4. `P17-4 Scenario close-note handoff packet v1`
5. `P17-5 Regression / acceptance close-note packetization`

原因：

- `role_core_packet.memory_handoff` 已经是稳定上游，最自然的下一步是把 close-note handoff 独立成 packet，而不是再新增一层散点字段
- close-note packet 一旦成立，后续 runtime / docs / acceptance 才有统一的消费面
- gate 继续保持“跟着主线长”，避免 `P17` 再次出现 close-note 事实已成立但阶段判断仍依赖文档拼接的情况

当前阶段判断：

- `P17-1`
  - 已开始
  - namespace close-note handoff packet 第一刀已成立
- `P17-2`
  - 已开始
  - retention close-note handoff packet 第一刀已成立
- `P17-3`
  - 已开始
  - knowledge close-note handoff packet 第一刀已成立
- `P17-4`
  - 已开始
  - scenario close-note handoff packet 第一刀已成立
- `P17-5`
  - 已开始
  - 已达到 `close-ready / 可收官`
  - gate 已推进到 `positive_contracts + metadata_consistency + packet_consumption + drift_guards`，并已开始显式暴露 `acceptance_gap_buckets / next_expansion_focus`

整体 `P17` 当前大约：

- **`80% - 85%`**

当前更推荐的下一步：

- **开始准备下一阶段执行文档 / 第一批任务拆解，而不是继续横向扩张 `P17`**

---

## 6. 当前结论

`P16` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P16` 可以正式视为已收官阶段
- `P17` 应作为新的执行起点
- `P17` 当前更合适的第一步不是回头补 `P16` 说明，而是把 `P16` 已成立的 handoff 与 close-note 判断收束成独立的 close-note handoff packet
