# SparkCore Memory Upgrade P23 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P22 close-note persistence payload` 已收官之后，把下一阶段的施工起点明确成一份可直接执行的计划。

本文档不等于：

- 长期 persistence / storage 总纲
- 完整 API / SDK 方案
- `P23 close note`

它只回答一件事：

- `P23` 接下来具体先做什么

---

## 2. P23 一句话目标

**在 `P22` 已建立的 `close-note persistence payload` 基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note persistence envelope、更接近真实 storage integration 的 envelope surface、以及更明确的 persistence-ready handoff contract”。**

---

## 3. 为什么现在进入 P23

`P22` 已经把 `close-note persistence payload` 建成了稳定阶段事实：

- namespace / retention / knowledge / scenario 四条 payload 主线已成立
- runtime main path / assistant metadata / developer diagnostics / system prompt / harness 已形成稳定复用
- `P22-5` 已形成结构化 gate，并已支撑 `close-ready` 判断

因此下一步最自然的不是继续横向扩 `P22`，而是：

- 把 payload 再推进一层
- 开始形成更像真实 persistence integration 输入的 envelope

---

## 4. P23 拆解

### 4.1 Namespace close-note persistence envelope v1

目标：

- 在 `close-note persistence payload` 之上建立独立 namespace persistence envelope section
- 明确 namespace persistence key / persistence scope / envelope summary

### 4.2 Retention close-note persistence envelope v1

目标：

- 在 `close-note persistence payload` 之上建立独立 retention persistence envelope section
- 明确 retention persistence key / persistence scope / envelope carry-through

### 4.3 Knowledge close-note persistence envelope v1

目标：

- 把 knowledge 也推进成 envelope-aware section
- 明确 knowledge envelope carry-through / envelope surface

### 4.4 Scenario close-note persistence envelope v1

目标：

- 把 scenario 也推进成 envelope-aware section
- 明确 scenario envelope carry-through / envelope surface

### 4.5 Regression / acceptance close-note persistence envelopeization

`P23` 首批必须让阶段 gate 跟着 persistence envelope 主线生长，而不是等 envelope 事实散落到 runtime / docs 之后再回头补。

第一版至少要锁住：

- namespace close-note persistence envelope v1
- retention close-note persistence envelope v1
- persistence envelope metadata consistency
- persistence envelope prompt surface

---

## 5. 当前阶段判断

当前默认按以下口径推进：

- `P23-1` 已开始，namespace close-note persistence envelope 第一刀已成立
- `P23-2` 已开始，retention close-note persistence envelope 第一刀已成立
- `P23-3`
  - 已开始
  - knowledge close-note persistence envelope 第一刀已成立
- `P23-4`
  - 已开始
  - scenario close-note persistence envelope 第一刀已成立
- `P23-5`
  - 已开始
  - 第二版正式 gate 已建立，并已开始显式服务 close-readiness consumption

当前 gate 轻量快照请以
[memory_upgrade_p23_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p23_gate_snapshot_v1.0.md)
为准。

当前正式 `close-readiness` 判断请以
[memory_upgrade_p23_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p23_close_readiness_v1.0.md)
为准。

当前正式收官结论请以
[memory_upgrade_p23_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p23_close_note_v1.0.md)
为准。

整体 `P23` 当前大约：

- **`80% - 85%`**

当前更推荐的下一步：

- **开始下一阶段执行文档 / 第一批任务拆解，而不是继续扩张 `P23` 范围**

---

## 6. 当前结论

`P22` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P22` 可以正式视为已收官阶段
- `P23` 应作为新的执行起点
- `P23` 当前更合适的第一步不是回头补 `P22` 说明，而是把 `P22` 已成立的 close-note persistence payload 收束成更接近真实 storage integration 的 close-note persistence envelope
