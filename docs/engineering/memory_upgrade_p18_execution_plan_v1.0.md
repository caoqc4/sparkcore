# SparkCore Memory Upgrade P18 Execution Plan v1.0

## 1. 文档定位

本文档用于为 `P18` 提供新的执行起点。

它不重复定义：

- `P17 close note`
- 长期 Memory Upgrade 总纲
- 更重的 packet lifecycle proposal

它只回答三件事：

1. `P18` 为什么现在开始
2. `P18` 的一句话目标是什么
3. `P18-1 ~ P18-5` 第一批最小施工顺序应该怎么排

---

## 2. P18 的一句话目标

**在 `P17` 已建立 `role_core_close_note_handoff_packet` 的基础上，把 SparkCore 记忆系统继续推进到“独立的 close-note artifact contract、可消费的 artifact prompt / metadata / debug surface、以及更明确的 artifact-level regression gate”。**

---

## 3. P18 与 P17 的分界

`P17` 已经完成的是：

- `role_core_close_note_handoff_packet`
- runtime main-path handoff packet consumption
- close-note packet gate / drift guard
- close-readiness / close note 文档闭环

`P18` 不再重复做这些 “close-note handoff packet 最小成立证明”。

`P18` 重点解决的是：

1. 把 `P17` 的 close-note handoff packet 收成更像最终产物的 close-note artifact
2. 让 artifact 不只存在于文档判断里，而成为独立可复用 contract
3. 让 prompt / assistant metadata / runtime debug 直接消费 artifact，而不是继续只消费 handoff packet
4. 为后续真正的 close-note 输出、记录或落库准备统一 payload

---

## 4. P18 首批目标

### 4.1 Namespace close-note artifact contract v1

把 namespace 从：

- close-note handoff packet 的 section carry-through

推进到：

- close-note artifact 内的独立 namespace section
- 更明确的 namespace artifact summary / prompt surface

### 4.2 Retention close-note artifact contract v1

把 retention 从：

- close-note handoff packet 的 decision-group / retained-fields carry-through

推进到：

- close-note artifact 内的独立 retention section
- 更明确的 retention artifact summary / prompt surface

### 4.3 Knowledge close-note artifact contract v1

把 knowledge 从：

- close-note handoff packet 的 scope layer / governance class carry-through

推进到：

- close-note artifact 内的独立 knowledge section
- 更明确的 knowledge artifact summary / prompt surface

### 4.4 Scenario close-note artifact contract v1

把 scenario 从：

- close-note handoff packet 的 strategy bundle / orchestration carry-through

推进到：

- close-note artifact 内的独立 scenario section
- 更明确的 scenario artifact summary / prompt surface

### 4.5 Regression / acceptance close-note artifactization

`P18` 首批必须让阶段 gate 跟着 artifact 主线生长，而不是等 artifact 事实散落到 runtime / docs 之后再回头补。

首批目标包括：

- `P18` 形成第一版阶段 gate
- 至少锁住：
  - role core close-note artifact v1
  - close-note artifact metadata consistency
  - close-note artifact prompt / runtime consumption

---

## 5. P18 施工顺序建议

建议顺序：

1. `P18-1 Namespace close-note artifact contract v1`
2. `P18-2 Retention close-note artifact contract v1`
3. `P18-3 Knowledge close-note artifact contract v1`
4. `P18-4 Scenario close-note artifact contract v1`
5. `P18-5 Regression / acceptance close-note artifactization`

当前阶段判断：

- `P18-1`
  - 已开始
  - namespace close-note artifact contract 第一刀已成立
- `P18-2`
  - 已开始
  - retention close-note artifact contract 第一刀已成立
- `P18-3`
  - 已开始
  - knowledge close-note artifact contract 第一刀已成立
- `P18-4`
  - 已开始
  - scenario close-note artifact contract 第一刀已成立
- `P18-5`
  - 已开始
  - gate 已推进到 `positive_contracts + metadata_consistency + artifact_consumption + drift_guards`

整体 `P18` 当前大约：

- **`40% - 45%`**

当前更推荐的下一步：

- **继续把 `P18` 从 drift guards，推进到更明确的 acceptance layering / close-readiness handoff**

---

## 6. 当前结论

`P17` 当前已经具备明确收官结论与下一阶段施工起点。

因此：

- `P17` 可以正式视为已收官阶段
- `P18` 应作为新的执行起点
- `P18` 当前更合适的第一步不是新增更重 lifecycle，而是先把 `P17` 已成立的 close-note handoff 收束成独立 artifact contract
