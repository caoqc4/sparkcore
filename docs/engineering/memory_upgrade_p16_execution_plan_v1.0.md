# SparkCore Memory Upgrade P16 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P15 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P15` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P16` 的第一批实施基线
- 从 `P15` 已成立的 phase snapshot / readiness handoff 事实，继续推进到“更稳定的 role-core memory handoff packet、更明确的 close-note handoff packet surface、以及更接近统一 runtime packet consumption”的执行文档

上层输入：

- [memory_upgrade_p15_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_close_note_v1.0.md)
- [memory_upgrade_p15_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_close_readiness_v1.0.md)
- [memory_upgrade_p15_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_execution_plan_v1.0.md)
- [memory_upgrade_p15_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- [layer-a-role-core-packet-contract-2026-03-22.zh-CN.md](/Users/caoq/git/sparkcore/docs-public/layer-a-role-core-packet-contract-2026-03-22.zh-CN.md)
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P16 的一句话目标

**在 `P15` 已建立的 namespace / retention / knowledge / scenario phase snapshot 与 readiness handoff 基础上，把 SparkCore 记忆系统继续推进到“更稳定的 role-core memory handoff packet、更明确的 close-note handoff packet surface、以及更接近统一 runtime packet consumption”的阶段。**

---

## 3. P16 与 P15 的分界

P15 已经解决的，是：

- namespace / retention / knowledge / scenario 四条主线都已进入 phase snapshot / consumption surface
- `p15_regression_gate` / `p15_gate_snapshot` / `close-readiness` / `close note` 已成立
- phase snapshot 已开始形成 readiness consumption / gap bucket
- `P15` 非阻塞尾项已统一并入 tail cleanup backlog

P16 不再重复做这些 “phase snapshot 最小成立证明”。

P16 重点解决的是：

1. 把四条主线从“各自已有 phase snapshot”继续推进到更稳定的 `role_core_packet` handoff
2. 把 gate snapshot 从“阶段判断输入”继续推进到更接近 close-note handoff packet 的消费面
3. 把 runtime / assistant metadata / diagnostics 中分散的 handoff 继续收束成更统一的 packet contract
4. 为后续阶段减少“每一轮 close note 都要重复解释一次 phase snapshot handoff”的文档与 runtime 成本

---

## 4. P16 首批目标

### 4.1 Role core namespace memory handoff packet v2

P16 首批要把 namespace 从“已有 phase snapshot / readiness consumption”继续推进到：

- 更稳定的 `role_core_packet.memory_handoff.namespace`
- 更明确的 namespace handoff packet summary
- 更适合 close-note handoff 引用的 namespace packet surface

### 4.2 Role core retention memory handoff packet v2

P16 首批要把 retention 从“已有 phase snapshot / prompt surface”继续推进到：

- 更稳定的 `role_core_packet.memory_handoff.retention`
- 更明确的 keep / drop handoff packet summary
- 更适合 close-note handoff 引用的 retention packet surface

### 4.3 Role core knowledge memory handoff packet v2

P16 首批要把 knowledge 从“已有 phase snapshot / summary”继续推进到：

- 更稳定的 `role_core_packet.memory_handoff.knowledge`
- 更明确的 source / budget handoff packet summary
- 更适合 close-note handoff 引用的 knowledge packet surface

### 4.4 Role core scenario memory handoff packet v2

P16 首批要把 scenario 从“已有 phase snapshot / prompt surface”继续推进到：

- 更稳定的 `role_core_packet.memory_handoff.scenario`
- 更明确的 strategy / orchestration handoff packet summary
- 更适合 close-note handoff 引用的 scenario packet surface

### 4.5 Regression / acceptance packetization

P16 首批必须让阶段 gate 跟着 packet 主线生长，而不是等 handoff 事实散落到 runtime / metadata 之后再回头补。

最小要求：

- `P16` 形成第一版阶段 gate
- gate 至少锁：
  - role core memory handoff packet v2
  - runtime / assistant metadata packet consistency
  - close-note handoff packet最小消费面

---

## 5. P16 施工顺序建议

建议顺序：

1. `P16-1 Role core namespace memory handoff packet v2`
2. `P16-2 Role core retention memory handoff packet v2`
3. `P16-3 Role core knowledge memory handoff packet v2`
4. `P16-4 Role core scenario memory handoff packet v2`
5. `P16-5 Regression / acceptance packetization`

原因：

- `role_core_packet` 已经是稳定 runtime packet，最适合作为下一阶段的 handoff 承载面
- namespace / retention / knowledge / scenario 在 `P15` 已具备 handoff 原料，当前更高价值的是统一 packet，而不是继续新增散点字段
- gate 继续保持“跟着主线长”，避免 `P16` 再次出现 packet 事实已经成立但阶段判断滞后的情况

当前阶段判断：

- `P16-1`
  - 已开始
  - role core memory handoff packet 第一刀已成立
- `P16-2`
  - 已开始
  - retention handoff 已进入同一 packet 第一刀
- `P16-3`
  - 已开始
  - knowledge handoff 已进入同一 packet 第一刀
- `P16-4`
  - 已开始
  - scenario handoff 已进入同一 packet 第一刀
- `P16-5`
  - 已开始
  - 第一版 gate scaffold 已建立

整体 `P16` 当前大约：

- **`15% - 20%`**

当前更推荐的下一步：

- **继续把 `P16-5 Regression / acceptance packetization` 从第一刀 scaffold 扩到 metadata consistency，而不是立刻写 `P16 close-readiness`**

---

## 6. 当前结论

`P15` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P15` 可以正式视为已收官阶段
- `P16` 应作为新的执行起点
- `P16` 当前更合适的第一步不是继续横向扩散新 summary，而是把 `P15` 已成立的 phase snapshot / readiness handoff 收束成更统一的 `role_core_packet` memory handoff surface
