# Layer A / B / D 阶段总结（2026-03-22）

## 1. 这份总结的目的

这份文档只回答三件事：

* 这一小批任务到底完成了什么
* 为什么 Layer B 先收在这里
* 下一批为什么不该继续硬挖同一条线

它不是新的五层设计文档，也不是新的实现 proposal。
它只是给当前阶段一个稳定结论，避免后续推进又回到“为了继续做而继续做”。

---

## 2. 当前阶段完成了什么

这一批的核心成果，可以收成三条：

### 2.1 Layer A：最小 `role_core_packet` contract 已定形

当前已经不再只是“runtime 里隐式有一团角色信息”。

现在已经明确收出了最小 `role_core_packet` contract，价值在于：

* 角色核不再只是隐式资产
* 角色身份、默认关系姿态、语言行为开始有显式 contract
* 当前先完成的是“定形”，不是“长系统”

这一点很重要，因为它把 Layer A 从“概念存在”推进到了“可验证存在”。

### 2.2 Layer B：第一批最关键 contract 已补齐

这一批 Layer B 不是继续做 phrasing，而是补了最值钱的 contract：

* single-slot update / override / restore semantics
* memory status semantics
* `user_agent` recall scope consistency

尤其是最后一条，已经明确补到了：

* valid memory 也不能脱离当前 agent / current thread 被误 recall
* smoke helper 与 runtime recall 已经对齐同一 applicability 规则

也就是说，Layer B 当前最关键的“状态机 + 作用域”第一刀，已经落下来了。

### 2.3 Layer D：observation record 已统一，但仍停在 observation 层

这一批没有推进 Layer D 实现。

当前只做了：

* observation record 的结构化模板
* attribution / drift language 的统一
* rerun 记录不再碎片化

这使得后续长链路 verdict、first failing turn、drift dimension 的记录更稳定，但没有进入新的自动推理复杂度。

---

## 3. 为什么 Layer B 先收在这里

当前 Layer B 最自然的“下一刀”，表面上看像是继续推进 `scope / validity consistency`。

但继续往下实际会遇到一个边界：

* `user_agent` 现在已经有代表性 contract
* `thread_local` 还没有真实回答路径在用

这意味着，如果现在继续硬做 Layer B 的下一刀，最可能发生的不是“继续 hardening contract”，而是：

* 为了继续做，去发明 `thread_local` 的新使用面
* 把 contract hardening 悄悄做成新功能设计

这会把当前很清楚的主线带偏。

所以，Layer B 此时先停，不是因为没东西可做，而是因为：

**当前继续推进的自然落点，已经开始从“补 contract”滑向“发明新使用面”。**

这不是这一阶段最该做的事。

---

## 4. 当前阶段的合理判断

按当前边界，这一批已经足够视为一个阶段成果：

* Layer A：完成最小 contract 定形
* Layer B：完成第一批关键 contract
* Layer D：完成 observation record 统一

而继续默认往下做，会越来越容易落到：

* 新 usage surface 设计
* phrasing / 表层体验打磨
* 为了找下一刀而强行找下一刀

所以当前最合理的判断是：

**这批可以阶段性收口。**

这里的“收口”不代表以后不再碰 Layer A / B / D。
它只表示：

* 这一小批的目标已经完成
* 当前不应继续机械式往下掘同一条线
* 下一批需要重新选择“真实使用面已经存在”的主线

---

## 5. 下一批任务建议

下一批不建议直接继续写 Layer B 的下一刀实现。

更合理的顺序是：

### 5.1 先把 Layer A contract 再写稳一点

下一批如果只选一个最稳方向，我建议优先考虑：

* 把 Layer A 的字段
* 注入边界
* 与 runtime instruction / memory 的优先级关系

写成更稳定的短设计说明。

原因很简单：

* Layer A 刚完成最小 contract
* 现在最适合做的是把这个 contract 说清楚
* 而不是立刻把它长成更重系统

### 5.2 再选“真实使用面已存在”的下一条主线

下一批应该优先选：

* 当前代码里已经有真实入口
* 已经有真实评估面
* 补的是 contract，不是在发明新 surface

而不是：

* 为了继续推进，去先发明新路径再补 contract

---

## 6. 一句话结论

这一批 Layer A / B / D 的工作已经构成了一个清晰的阶段成果：

**Layer A 已完成最小角色核 contract 定形，Layer B 已补上第一批最关键的状态机与作用域 contract，Layer D 已统一 observation record；当前最合理的动作不是继续硬掘同一条线，而是先收口，再把下一批切到“真实使用面已存在”的新主线。**
