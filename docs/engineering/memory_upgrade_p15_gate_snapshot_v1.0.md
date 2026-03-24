# SparkCore Memory Upgrade P15 Gate Snapshot v1.0

## 1. 文档定位

本文档用于在 `P15-5 Regression / acceptance continuation` 已进入三层 gate 结构之后，把当前 gate 的结构、覆盖面与当前状态收成一份轻量快照。

本文档不等于：

- `P15 close readiness`
- `P15 close note`
- 完整 `P15` execution plan

本文档只回答三件事：

1. 当前 `P15` gate 已经按什么结构输出
2. 当前 gate 已经锁住哪些 acceptance 面
3. 当前 gate 下一步最适合往哪三条主线扩

---

## 2. 当前 Gate 结构

当前 [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已提供：

- `p15_regression_gate`
- `p15_gate_snapshot`

其中：

- `p15_regression_gate` 用于保留完整检查面与逐项结果
- `p15_gate_snapshot` 用于更轻量地消费阶段级状态

当前 `p15_regression_gate` 先从一层输出开始：

- `positive_contracts`

当前 `p15_gate_snapshot` 的结果为：

- `blocking_items = []`
- `next_expansion_focus = close_readiness_consumption / acceptance_gap_classification / remaining_acceptance_gaps`
- `positive_contracts = 4 / 4`
- `metadata_consistency = 2 / 2`
- `drift_guards = 2 / 2`
- `overall = 8 / 8`
- `failed_checks = []`
- `all_green = true`
- `close_candidate = true`

---

## 3. 当前已锁住的 Gate 面

### 3.1 Positive Contracts

当前已经锁住：

- `namespace_governance_plane_contract_unification_v1_ok`
- `retention_governance_plane_consumption_unification_v1_ok`
- `knowledge_governance_plane_consumption_unification_v1_ok`
- `scenario_governance_plane_consumption_unification_v1_ok`

这意味着 `P15` 当前已经不只是“写了 execution plan”，而是已经把 namespace / retention / knowledge / scenario 四条主线都开始收成更稳定的 phase snapshot / contract surface，并且这些 surface 已经开始跨以下输出面对齐：

- namespace helper contract
- runtime debug `memory_namespace`
- runtime write preview
- retention helper contract
- runtime debug `thread_compaction`
- compacted thread summary / prompt surface
- knowledge helper contract
- runtime debug `knowledge`
- knowledge summary / system prompt surface
- scenario helper contract
- runtime debug `memory.pack`
- scenario prompt surface

### 3.2 Metadata Consistency

当前已经进一步锁住：

- `phase_snapshot_metadata_consistency_v1_ok`
- `phase_snapshot_prompt_surface_v1_ok`

这意味着 phase snapshot 不只是各自成立，还已经开始跨以下输出面对齐：

- runtime debug
- runtime write preview
- assistant metadata / preview consumption
- scenario prompt surface
- knowledge system prompt surface
- thread compaction prompt surface

### 3.3 当前还没开始锁的面

当前已经进一步锁住：

- `phase_snapshot_drift_guard_v1_ok`
- `scenario_phase_snapshot_drift_guard_v1_ok`

这意味着 phase snapshot 不只是跨 surface 对齐，也已经开始对以下反漂移事实建立守卫：

- thread namespace phase snapshot 仍然严格禁 timeline fallback
- retention 在 `closed / paused` 退化场景下仍然不会误保留
- reference-only knowledge phase snapshot 不会把 authoritative 内容误抬成主内容
- companion / knowledge-guided companion / project_ops 三套 scenario phase snapshot 仍然保持分流

### 3.4 当前还没开始锁的面

当前这份 gate 还没有正式锁住：

- close-readiness consumption
- acceptance gap classification
- remaining acceptance gaps

因此它当前更像是：

**`P15` gate 的三层结构已经成立，但还不是 close-readiness 级 gate。**

---

## 4. 当前判断

我当前对这份 gate snapshot 的判断是：

**`P15-5` 已经从“第一版 gate 雏形”推进到“三层 gate 已开始成形”，但当前价值仍主要在于继续把 phase snapshot contract 收成稳定 acceptance 面，而不是立即提供 close-readiness 级判断。**

当前已经成立的是：

- `P15` 不再停留在纯文档规划
- namespace / retention / knowledge / scenario 四条主线都已有第一刀成立证明
- `positive_contracts` 之后的 `metadata_consistency` 已开始成形
- `drift_guards` 也已经开始成形

当前还不适合直接把它理解成：

- `P15` 已有完整阶段 gate
- `P15 close-readiness` 已有讨论基础

---

## 5. 下一步建议

当前更合理的下一步是：

- **继续扩 `P15-1` 与 `P15-5` 的连接面，而不是立刻写 `P15 close-readiness`**

更具体地说，下一步更适合继续补：

- close-readiness consumption
- acceptance gap classification
- remaining acceptance gaps

---

## 6. 当前结论

一句话结论：

**`P15` 当前已经拥有一版全绿、并进入三层结构化扩张的 gate；它已经足够支撑后续 readiness consumption / gap classification 按同一结构继续生长，但还不适合提前进入收官判断。**
