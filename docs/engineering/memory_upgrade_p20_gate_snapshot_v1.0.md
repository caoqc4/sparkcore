# SparkCore Memory Upgrade P20 Gate Snapshot v1.0

## 1. 文档定位

本文档用于在 `P20-5 Regression / acceptance close-note recordization` 建立第一刀之后，把当前 gate 的结构、覆盖面与当前状态收成一份轻量快照。

本文档不等于：

- `P20 close-readiness`
- `P20 close note`
- 完整 `P20 execution plan`

本文档只回答三件事：

1. 当前 `P20` gate 已经按什么结构输出
2. 当前 gate 已经锁住哪些 record acceptance 面
3. 当前 gate 下一步最适合往哪条主线扩

---

## 2. 当前 Gate 结构

当前 [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已提供：

- `p20_close_note_record`
- `p20_regression_gate`
- `p20_gate_snapshot`

当前 `p20_gate_snapshot` 的结果为：

- `record_contract_readiness = retention_record_started_not_close_ready`
- `progress_range = 20% - 25%`
- `close_note_recommended = false`
- `positive_contracts = 2 / 2`
- `metadata_consistency = 2 / 2`
- `prompt_surface = 2 / 2`
- `overall = 6 / 6`
- `failed_checks = []`
- `all_green = true`
- `close_candidate = true`

---

## 3. 当前已锁住的 Gate 面

### 3.1 Positive Contracts

当前已经锁住：

- `namespace_close_note_record_contract_v1_ok`

### 3.2 Metadata Consistency

当前已经进一步锁住：

- `namespace_close_note_record_metadata_consistency_v1_ok`

这意味着 namespace close-note record 当前不只存在于 harness 主路径，还已经开始跨以下输出面对齐：

- assistant metadata
- developer diagnostics
- runtime debug metadata

### 3.3 Prompt Surface

当前已经进一步锁住：

- `namespace_close_note_record_prompt_surface_v1_ok`

这意味着 namespace close-note record 当前已经开始进入：

- `buildAgentSystemPrompt(...)`
- 独立 record prompt surface

因此它当前更像是：

**`P20` gate 已经从零推进到“namespace / retention 两条 close-note record contract + metadata consistency + prompt surface 已成立”的第一版正式 gate；它已不再只是 `P19 output` 的旁路拼接，而开始形成独立 record acceptance 面。**

---

## 4. 当前判断

我当前对这份 gate snapshot 的判断是：

**`P20-5` 已经从“待开始”推进到“namespace / retention close-note record gate 已建立”，并且当前价值主要在于继续推进 knowledge / scenario 两条 record 主线，而不是回头继续补 namespace / retention 单点。**

---

## 5. 下一步建议

当前更合理的下一步是：

- **继续做 `P20-3 Knowledge close-note record contract v1`，而不是先写 `P20 close-readiness`**

---

## 6. 当前结论

一句话结论：

**`P20` 当前已经拥有一版全绿、并以 namespace / retention close-note record 为中心且带 positive contracts / metadata consistency / prompt surface 的正式 gate；它已经从 `P19 close-note output` 继续推进成更接近真实记录面的 contract。**
