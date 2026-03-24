# SparkCore Memory Upgrade Tail Cleanup Backlog v1.0

## 1. 文档定位

本文档用于把 `Memory Upgrade P0 ~ P14` 当前已经明确识别出的**非阻塞尾项**统一收束成一份 backlog，明确：

- 这些尾项属于什么性质
- 为什么它们当前不阻塞阶段切换
- 后续应该如何处理
- 哪些阶段还留有哪些典型尾项

本文档不是新的执行方案，也不是新的 close note，而是：

- 对 `P0 ~ P4` 已收官阶段中遗留尾项的统一归档
- 对 `P5 ~ P14` 已收官阶段中遗留尾项的统一归档
- 对后续 tail cleanup batch 的最小执行入口

---

## 2. 当前总判断

`P0 ~ P14` 当前确实都还存在少量剩余尾项。  
但这些尾项的性质已经从：

- 主目标未成立
- 主路径未接通
- 阶段边界未钉死

下降为：

- 清洁度 / 对称性尾项
- 深化型尾项
- gate 增强型尾项

因此，它们当前的影响是：

- **不会阻塞项目进入下一阶段**
- **会影响后续维护成本、仓库平整度与回归强度**
- **适合以后按批次处理，而不应回头阻塞主线**

---

## 3. 尾项分类

### 3.1 清洁度 / 对称性尾项

这类项的特征是：

- 主路径已经成立
- 但仍有少量边角 helper、读写分流、显示层判断没有完全对齐

这类项的影响：

- 不影响阶段是否成立
- 影响代码一致性、认知负担与后续维护成本

### 3.2 深化型尾项

这类项的特征是：

- 当前阶段的 v1 / v2 行为已经成立
- 但仍可继续向更复杂的 budget、route、selection、scope rule 深化

这类项的影响：

- 不影响当前阶段 close-ready
- 影响后续能力上限与系统精细度

### 3.3 Gate 增强型尾项

这类项的特征是：

- harness / typecheck / metadata gate 已成立第一版
- 但还可以继续把更多细粒度行为锁进回归面

这类项的影响：

- 不影响当前阶段能否收官
- 影响后续改动时是否更容易悄悄回退

---

## 4. P0 ~ P14 当前典型尾项

### 4.1 P0 尾项

典型尾项包括：

- legacy `memory_items` 迁移语义还可继续往更多边角消费面铺开
- `P0-7` gate 还可继续补更细的 metadata / prompt 断言
- `profile / thread_state / memory_record` 的最小闭环虽已成立，但仍有深化空间

当前性质：

- 非阻塞
- 更偏 migration cleanup 与 gate 增强

### 4.2 P1 尾项

典型尾项包括：

- `legacy read-path tightening` 还可继续往更多展示 / 管理 / recall 侧统一
- `episode / timeline` 虽已成为真实 route，但还可继续往更深的 route budget / assembly 规则推进
- `P1-5` gate 还可继续扩成更正式的 close gate

当前性质：

- 非阻塞
- 更偏 canonicalization cleanup 与 route 深化

### 4.3 P2 尾项

典型尾项包括：

- namespace 还可继续向更复杂的 retrieval / filtering 规则深化
- knowledge / compaction / scenario pack 的 seam 还可继续往更真实消费边界推进
- `P2-5` gate 还可继续补更明确的 close gate 表达

当前性质：

- 非阻塞
- 更偏高阶 seam 深化

### 4.4 P3 尾项

典型尾项包括：

- namespace boundary 还可继续往更多 route / scope routing 深化
- retention strategy 还可继续往更细的 retained-fields / summary budget 深化
- knowledge scope 与 scenario pack 还可继续往更复杂的 route weighting 深化
- `P3-5` gate 还可继续扩成更强的 close gate

当前性质：

- 非阻塞
- 更偏高级边界深化

### 4.5 P4 尾项

典型尾项包括：

- namespace boundary v2 还可继续向更复杂的 route / budget / write routing 深化
- retention budget / pruning v2 还可继续向更复杂的 retained-fields 组合深化
- knowledge route influence v2 还可继续向更细的 route weighting / budget 深化
- scenario pack consumption v2 还可继续扩到更多 layer 或更复杂的 pack-specific consumption 规则
- `P4-5` gate 还可继续补更正式的 close gate 表达

当前性质：

- 非阻塞
- 更偏 v2 深化与回归增强

### 4.6 P5 尾项

典型尾项包括：

- namespace multi-budget routing 还可继续向更复杂的 multi-layer fallback / budget 组合深化
- retention layering / pruning v3 还可继续向更完整的 section weighting / aggregation rule 深化
- knowledge route weighting v3 还可继续向更细的 route / budget weighting 深化
- scenario pack strategy layer v3 还可继续向更复杂的 strategy bundle / assembly rule 深化
- `P5-5` gate 还可继续补更强的阶段级聚合判断与一致性校验

当前性质：

- 非阻塞
- 更偏 v3 深化与阶段 gate 增强

### 4.7 P6 尾项

典型尾项包括：

- namespace policy orchestration 还可继续向更完整的 policy bundle / escalation governance 深化
- retention lifecycle policy v4 还可继续向更细的 lifecycle grouping / survival rationale 深化
- knowledge governance weighting v4 还可继续向更完整的 governance orchestration / budget bias 深化
- scenario strategy orchestration v4 还可继续向更明确的 orchestration summary / governance digest 深化
- `P6-5` gate 还可继续补更强的阶段级聚合判断与跨 prompt / metadata / debug 一致性校验

当前性质：

- 非阻塞
- 更偏 policy / orchestration 深化与阶段 gate 增强

### 4.8 P7 尾项

典型尾项包括：

- namespace policy orchestration v2 还可继续向更完整的 policy digest routing / consistency 规则深化
- retention lifecycle governance v5 还可继续向更细的 lifecycle grouping / keep-drop coordination 深化
- knowledge governance coordination v5 还可继续向更完整的 source-governance orchestration / budget coordination 深化
- scenario orchestration digest v5 还可继续向更细的 orchestration summary / consistency contract 深化
- `P7-5` gate 还可继续补更强的阶段级聚合判断与跨 prompt / metadata / debug 一致性校验

当前性质：

- 非阻塞
- 更偏 digest / coordination 深化与阶段 gate 增强

### 4.9 P8 尾项

典型尾项包括：

- namespace governance convergence v3 还可继续向更完整的 retrieval / write convergence reuse 与 cross-surface alignment 深化
- retention lifecycle convergence v6 还可继续向更细的 keep/drop convergence grouping 与 lifecycle alignment rule 深化
- knowledge governance convergence v6 还可继续向更完整的 source / budget convergence orchestration 深化
- scenario governance convergence v6 还可继续向更细的 strategy convergence summary / alignment contract 深化
- `P8-5` gate 还可继续补更强的阶段级聚合判断与跨 convergence metadata consistency 校验

当前性质：

- 非阻塞
- 更偏 convergence 深化与阶段 gate 增强

### 4.10 P9 尾项

典型尾项包括：

- namespace unified governance runtime v4 还可继续向更完整的 runtime reuse / cross-surface alignment 深化
- retention lifecycle unification v7 还可继续向更细的 keep/drop unified runtime grouping 深化
- knowledge governance unification v7 还可继续向更完整的 source / budget unified orchestration 深化
- scenario governance unification v7 还可继续向更细的 strategy unification summary / orchestration contract 深化
- `P9-5` gate 还可继续补更强的阶段级聚合判断与 unified metadata consistency 校验

当前性质：

- 非阻塞
- 更偏 unified runtime 深化与阶段 gate 增强

### 4.11 P10 尾项

典型尾项包括：

- namespace governance consolidation v5 还可继续向更完整的 retrieval / write consolidation reuse 与 cross-surface alignment 深化
- retention lifecycle consolidation v8 还可继续向更细的 keep/drop consolidation grouping 与 lifecycle runtime rule 深化
- knowledge governance consolidation v8 还可继续向更完整的 source / budget consolidation orchestration 深化
- scenario governance consolidation v8 还可继续向更细的 strategy consolidation summary / orchestration contract 深化
- `P10-5` gate 还可继续补更强的阶段级聚合判断与 consolidation metadata consistency 校验

当前性质：

- 非阻塞
- 更偏 consolidation runtime 深化与阶段 gate 增强

### 4.12 P11 尾项

典型尾项包括：

- namespace unified governance consolidation v6 还可继续向更完整的 unified consolidation coordination / cross-surface alignment 深化
- retention lifecycle coordination v9 还可继续向更细的 keep/drop runtime coordination grouping 与 lifecycle reuse rule 深化
- knowledge governance coordination v9 还可继续向更完整的 source / budget coordination orchestration 深化
- scenario governance coordination v9 还可继续向更细的 strategy runtime coordination summary / reuse contract 深化
- `P11-5` gate 还可继续补更强的阶段级聚合判断与 coordination metadata consistency 校验

当前性质：

- 非阻塞
- 更偏 coordination 深化与阶段 gate 增强

### 4.13 P12 尾项

典型尾项包括：

- namespace governance plane runtime v7 还可继续向更完整的 retrieval / write governance plane reuse 与 cross-surface alignment 深化
- retention lifecycle governance plane v10 还可继续向更细的 keep/drop governance plane grouping 与 runtime lifecycle rule 深化
- knowledge governance plane v10 还可继续向更完整的 source / budget governance plane orchestration 深化
- scenario governance plane v10 还可继续向更细的 strategy governance plane summary / runtime alignment contract 深化
- `P12-5` gate 还可继续补更强的阶段级聚合判断与 governance plane metadata consistency 校验

当前性质：

- 非阻塞
- 更偏 governance plane 深化与阶段 gate 增强

### 4.14 P13 尾项

典型尾项包括：

- scenario negative coverage 还可继续向更细颗粒度的 pack 切换 / fabric 漂移防护深化
- `p13_gate_snapshot` 还可继续向更明确的 tail-cleanup 消费字段深化
- 结构化 gate 输出面还可继续向更高对称性、更低冗余的消费表达收敛
- 非阻塞的 coverage 补强与 close 文档之间的对齐还可继续细化

当前性质：

- 非阻塞
- 更偏阶段 gate 消费深化、drift guard 增强与 close 后清洁度补强

### 4.15 P14 尾项

典型尾项包括：

- plane negative coverage 还可继续向更细颗粒度的 prompt / metadata / debug / preview 反漂移防护深化
- `p14_gate_snapshot` 还可继续向更明确的 tail-cleanup 消费字段深化
- 结构化 gate 输出面还可继续向更高对称性、更低冗余的消费表达收敛
- 非阻塞的 coverage 补强与 close 文档之间的对齐还可继续细化

当前性质：

- 非阻塞
- 更偏阶段 gate 消费深化、prompt surface consistency 补强与 close 后清洁度补强

---

## 5. 处理原则

后续处理这些尾项时，建议遵守以下原则：

1. **不回头阻塞主线**
   - 只要阶段 close note 已成立，就不应因为尾项重新冻结下一阶段推进

2. **优先按批次处理，而不是零散回头**
   - 更适合形成：
     - tail cleanup batch
     - gate strengthening batch
     - route/budget deepening batch

3. **优先处理会影响后续维护成本的尾项**
   - 优先级通常高于纯 polish

4. **优先处理会影响回归稳定性的尾项**
   - 如果某条主线已经很深，但 gate 还偏弱，应优先补 gate

---

## 6. 建议的后续方式

后续如果要处理这些尾项，建议不要打散回到各阶段主文档里慢慢找，而是直接按下面三种方式之一推进：

### 6.1 Tail cleanup batch

适合：

- 收 helper / canonical getter / display normalization
- 收少量边角读写路径

### 6.2 Gate strengthening batch

适合：

- 扩 harness
- 扩 metadata / prompt 断言
- 把已有阶段事实锁得更稳

### 6.3 Deepening batch

适合：

- 对某一条已 close-ready 的主线继续深化
- 例如 route weighting、retention budget、scenario pack consumption

---

## 7. 最终结论

`P0 ~ P13` 当前确实都还存在少量尾项。  
但这些尾项已经被明确识别为：

- **非阻塞尾项**
- **后续增强项**
- **可批次处理的 backlog**

因此：

- 它们不会阻塞项目继续推进
- 但应被正式记录，而不是悬空遗忘

本文档即作为后续统一处理这些尾项的最小入口。 
