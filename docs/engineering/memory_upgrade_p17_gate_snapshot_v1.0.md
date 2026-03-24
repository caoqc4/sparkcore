# SparkCore Memory Upgrade P17 Gate Snapshot v1.0

## 1. 文档定位

本文档用于在 `P17-5 Regression / acceptance close-note packetization` 建立第一刀之后，把当前 gate 的结构、覆盖面与当前状态收成一份轻量快照。

本文档不等于：

- `P17 close-readiness`
- `P17 close note`
- 完整 `P17` execution plan

本文档只回答三件事：

1. 当前 `P17` gate 已经按什么结构输出
2. 当前 gate 已经锁住哪些 acceptance 面
3. 当前 gate 下一步最适合往哪三条主线扩

---

## 2. 当前 Gate 结构

当前 [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已提供：

- `p17_regression_gate`
- `p17_gate_snapshot`

其中：

- `p17_regression_gate` 用于保留完整检查面与逐项结果
- `p17_gate_snapshot` 用于更轻量地消费阶段级状态

当前 `p17_gate_snapshot` 的结果为：

- `readiness_judgment = close_ready`
- `progress_range = 30% - 35%`
- `close_note_recommended = true`
- `blocking_items = []`
- `non_blocking_items = runtime_close_note_packet_consumption / packet_prompt_surface_alignment / close_note_acceptance_structuring`
- `tail_candidate_items = packet_output_symmetry_cleanup / non_blocking_packet_negative_coverage / close_note_tail_cleanup_alignment`
- `positive_contracts = 1 / 1`
- `metadata_consistency = 1 / 1`
- `packet_consumption = 1 / 1`
- `overall = 3 / 3`
- `failed_checks = []`
- `all_green = true`
- `close_candidate = true`

---

## 3. 当前已锁住的 Gate 面

### 3.1 Positive Contracts

当前已经锁住：

- `role_core_memory_close_note_handoff_packet_v1_ok`

### 3.2 Metadata Consistency

当前已经进一步锁住：

- `role_core_memory_close_note_handoff_metadata_consistency_v1_ok`

这意味着 close-note handoff packet 当前不只存在于 harness 的主 packet，还已经开始跨以下输出面对齐：

- assistant metadata `role_core_packet`
- developer diagnostics `role_core_packet`

这意味着 `P17` 当前已经不只是“把 P16 close note 文案搬到文档里”，而是已经把 namespace / retention / knowledge / scenario 四条主线连同 close-note readiness 一起收进了独立的 close-note handoff packet，并开始验证它可跨面复用。

### 3.3 Packet Consumption

当前已经进一步锁住：

- `role_core_memory_close_note_handoff_prompt_surface_v1_ok`

这意味着 close-note handoff packet 当前不只可在 builder 内部重建，还已经开始有一版标准化 prompt surface，可用于后续 runtime close-note consumption 接入。

### 3.4 当前还没开始锁的面

当前这份 gate 还没有正式锁住：

- close-note handoff packet 的 metadata consistency
- close-note handoff packet 的 runtime prompt / diagnostics consumption
- close-note packet 的 drift guard / negative coverage

因此它当前更像是：

**`P17` gate 已经从零推进到“close-note handoff packet contract + metadata consistency + packet consumption 已成立”，并且开始把 `P16` 的 close-note 判断输入从文档自述推进成独立 packet；它是 `P17` 的正式起点，但还远不是收官级 gate。**

---

## 4. 当前判断

我当前对这份 gate snapshot 的判断是：

**`P17-5` 已经从“待开始”推进到“第一版 close-note packet gate 已建立，并开始出现 metadata consistency + packet consumption”，当前价值主要在于继续把 close-note handoff packet 推到更明确的 runtime consumption，而不是立刻进入 close-readiness 判断。**

当前已经成立的是：

- `P17` 不再停留在 execution plan
- `P16` 的 `role_core_packet.memory_handoff` 已被收成独立 `close_note_handoff_packet`
- close-note packet 当前已开始跨 assistant metadata / developer diagnostics 复用同一套 builder
- close-note packet 当前也已开始拥有一版标准 prompt surface builder
- close-note packet 当前已开始显式暴露：
  - `readiness_judgment`
  - `progress_range`
  - `close_candidate`
  - `close_note_recommended`
  - `blocking_items / non_blocking_items / tail_candidate_items`
- close-note packet 当前也已带上：
  - namespace phase snapshot
  - retention decision group / retained fields
  - knowledge scope layers / governance classes
  - scenario strategy bundle / orchestration mode

当前还不适合直接把它理解成：

- `P17` 已进入 `close-readiness`
- `P17 close note` 已有直接编写基础

---

## 5. 下一步建议

当前更合理的下一步是：

- **继续完成 `P17` 的更明确 runtime close-note consumption，而不是立刻写 `P17 close-readiness`**

---

## 6. 当前结论

一句话结论：

**`P17` 当前已经拥有一版全绿、并以 close-note handoff packet 为中心且带 metadata consistency / packet consumption 的第一版 gate；它已经不再只是文档判断，而是开始形成可复用 packet contract。**
