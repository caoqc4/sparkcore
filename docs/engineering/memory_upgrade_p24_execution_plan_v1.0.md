# SparkCore Memory Upgrade P24 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P23 close-note persistence envelope` 已收官之后，把下一阶段的施工起点明确成一份可直接执行的计划。

本文档不等于：

- 长期 persistence / storage 总纲
- 完整 persistence executor 方案
- `P24 close note`

它只回答一件事：

- `P24` 接下来具体先做什么

---

## 2. P24 一句话目标

**在 `P23` 已建立的 `close-note persistence envelope` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note persistence manifest、更接近真实 persistence write contract 的 manifest surface、以及更明确的 persistence-target handoff contract”。**

---

## 3. 为什么现在进入 P24

`P23` 已经把 `close-note persistence envelope` 建成了稳定阶段事实：

- namespace / retention / knowledge / scenario 四条 persistence envelope 主线已成立
- runtime main path / assistant metadata / developer diagnostics / system prompt / harness 已形成稳定复用
- `P23-5` 已形成结构化 gate，并已支撑 `close-ready` 判断

因此下一步最自然的不是继续横向扩 `P23`，而是：

- 把 envelope 再推进一层
- 开始形成更像真实 persistence write integration 输入的 manifest

---

## 4. P24 拆解

### 4.1 Namespace close-note persistence manifest v1

目标：

- 在 `close-note persistence envelope` 之上建立独立 namespace persistence manifest section
- 明确 namespace storage target / write mode / manifest summary

### 4.2 Retention close-note persistence manifest v1

目标：

- 在 `close-note persistence envelope` 之上建立独立 retention persistence manifest section
- 明确 retention storage target / write mode / manifest carry-through

### 4.3 Knowledge close-note persistence manifest v1

目标：

- 把 knowledge 也推进成 manifest-aware section
- 明确 knowledge manifest carry-through / manifest surface

### 4.4 Scenario close-note persistence manifest v1

目标：

- 把 scenario 也推进成 manifest-aware section
- 明确 scenario manifest carry-through / manifest surface

### 4.5 Regression / acceptance close-note persistence manifestization

`P24` 首批必须让阶段 gate 跟着 persistence manifest 主线生长，而不是等 manifest 事实散落到 runtime / docs 之后再回头补。

第一版至少要锁住：

- namespace close-note persistence manifest v1
- retention close-note persistence manifest v1
- persistence manifest metadata consistency
- persistence manifest prompt surface

---

## 5. 当前阶段判断

当前默认按以下口径推进：

- `P24-1` 已开始，namespace close-note persistence manifest 第一刀已成立
- `P24-2` 已开始，retention close-note persistence manifest 第一刀已成立
- `P24-3`
  - 已开始
  - knowledge close-note persistence manifest 第一刀已成立
- `P24-4`
  - 已开始
  - scenario close-note persistence manifest 第一刀已成立
- `P24-5`
  - 已开始
  - 第二版正式 gate 已建立，并已开始显式服务 close-readiness consumption

当前 gate 轻量快照请以
[memory_upgrade_p24_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p24_gate_snapshot_v1.0.md)
为准。

当前正式 `close-readiness` 判断请以
[memory_upgrade_p24_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p24_close_readiness_v1.0.md)
为准。

整体 `P24` 当前大约：

- **`70% - 75%`**

当前更推荐的下一步：

- **继续做 `P24` 的最后一轮收束，再决定是否进入 `P24 close note`**

---

## 6. 当前结论

`P23` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P23` 可以正式视为已收官阶段
- `P24` 应作为新的执行起点
- `P24` 当前更合适的第一步不是回头补 `P23` 说明，而是把 `P23` 已成立的 close-note persistence envelope 收束成更接近真实 persistence write integration 的 close-note persistence manifest
