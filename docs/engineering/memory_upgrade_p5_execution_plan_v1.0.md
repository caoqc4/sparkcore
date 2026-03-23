# SparkCore Memory Upgrade P5 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P4 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P4` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P5` 的第一批实施基线
- 从 `P4` 已成立事实，推进到“更完整的多预算治理、更强的 route weighting、更接近真实场景操作系统”的执行文档

上层输入：

- [memory_upgrade_p4_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_note_v1.0.md)
- [memory_upgrade_p4_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_close_readiness_v1.0.md)
- [memory_upgrade_p4_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p4_execution_plan_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P5 的一句话目标

**在 `P4` 已建立的 boundary / pruning / knowledge influence / pack consumption 基础上，把 SparkCore 记忆系统推进到“更明确的多预算协同、更稳定的 route weighting、以及更可扩展的 pack 策略层”的阶段。**

---

## 3. P5 与 P4 的分界

P4 已经解决的，是：

- namespace 已进入 retrieval boundary / write boundary / recall budget
- retention 已进入 budget / pruning / keep-drop
- knowledge 已进入 route influence / assembly emphasis / rationale
- scenario pack 已进入跨 layer、跨 subtype 的真实 consumption 差异
- 第一版 `P4` regression gate 已成立

P5 不再重复做这些“v2 最小成立证明”。

P5 重点解决的是：

1. namespace boundary 从单预算推进到更完整的多预算协同
2. retention 从单 budget 推进到更明确的 layered pruning strategy
3. knowledge 从 route influence 推进到更真实的 route weighting / context budget 作用
4. scenario pack 从 pack-specific consumption 推进到更完整的 pack strategy layer
5. `P5` 的 regression / acceptance gate 立住

---

## 4. P5 首批目标

### 4.1 Namespace multi-budget routing

P5 首批要把 namespace 从：

- retrieval boundary
- write boundary
- 单层 recall budget

继续推进到：

- 多层 recall / write budget 协同
- 更明确的 project / world / thread route weighting

最小要求：

- 至少一条 namespace budget 不再只控制 recall count，而开始控制 layer-weighting 或 fallback order
- 至少一条 write route 决策开始体现更细的 namespace priority

### 4.2 Retention layering / pruning strategy v3

P5 首批要把 retention 从：

- 单个 retention budget
- retained_fields pruning
- summary keep-drop

继续推进到：

- layered budget
- layered pruning strategy
- 更明确的 compacted section weighting

最小要求：

- 至少一条 pruning decision 开始同时受 `retention_mode + retention_budget + section class` 影响
- retention 不再只决定保留字段，还开始决定哪类 compacted context 更优先存活

### 4.3 Knowledge route weighting v3

P5 首批要把 knowledge 从：

- scope priority
- route influence
- assembly emphasis / rationale

继续推进到：

- 更明确的 route weighting
- 更明确的 context budget weighting

最小要求：

- 至少一条 route 决策开始从“开/关或排序”推进到“显式 weighting”
- 至少一条 knowledge budget 决策开始受 scope + namespace + pack 联合影响

### 4.4 Scenario pack strategy layer v3

P5 首批要把 scenario pack 从：

- active pack selection
- pack-specific knowledge budget
- pack-specific layer consumption

继续推进到：

- 更明确的 pack strategy layer
- 更明确的 pack-specific budget bundle / weighting bundle

最小要求：

- 至少一条 pack strategy 不再只影响单个 layer slot，而开始影响一组 layer/budget 组合
- 至少一条 pack-specific strategy 开始进入更可复用的 contract/helper，而不只散落在 runtime 组装逻辑里

### 4.5 P5 regression / acceptance expansion

P5 首批要把 gate 扩大到：

- namespace multi-budget routing
- retention layering / pruning strategy
- knowledge route weighting
- scenario pack strategy layer

目标不是一次把所有策略锁死，而是确保 `P5` 的新增事实不会退回：

- 只存在于 prompt 文本
- 只存在于 metadata
- 只存在于文档

---

## 5. P5 明确不做的事项

P5 首批明确不做：

- 完整多 Agent 共享记忆仲裁系统
- 完整世界状态同步引擎
- 独立 knowledge CMS / ingestion 平台
- 可插拔 pack marketplace
- 大规模自动 retention / cleanup 后台任务系统

这些方向不是不做，而是不纳入 `P5` 首批闭环。

---

## 6. P5 建议推进顺序

建议顺序：

1. `P5-1 Namespace multi-budget routing`
2. `P5-2 Retention layering / pruning strategy v3`
3. `P5-3 Knowledge route weighting v3`
4. `P5-4 Scenario pack strategy layer v3`
5. `P5-5 regression / acceptance expansion`

原因：

- namespace 仍是最容易牵动主路径边界的线
- retention 继续深化后，compaction 才不会停在单 budget 规则
- knowledge 与 pack 的更深 weighting，应建立在 boundary 与 pruning 进一步稳定之后
- gate 应在前四条线已有真实事实后尽快跟上

---

## 7. 当前执行建议

如果继续沿 `Memory Upgrade` 主线推进，`P5` 最自然的第一刀是：

- **Namespace multi-budget routing**

原因：

- `P4` 已把 namespace 推到 boundary + routed target + recall budget
- 再往前一刀，最容易形成 `P5` 的第一条真实主路径事实
- 这也最能决定后续 retention / knowledge / pack strategy 是否能站在更稳定的预算边界上继续做深
