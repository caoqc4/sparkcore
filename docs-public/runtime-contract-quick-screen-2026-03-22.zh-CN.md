# Runtime Contract 快速筛查清单（2026-03-22）

## 1. 这份清单的目的

这份清单只服务一个很小的动作：

**在不重新滑回大范围探索的前提下，快速判断当前是否存在一个高置信的 runtime contract 漏口，值得进入下一条实现任务。**

它不是新的长期主线，也不是新的大而泛稳定性整理。

如果筛不出高置信下一刀，这份清单的价值同样成立：

* 及时止损
* 不为了继续推进而硬找问题
* 直接切回已有长链路 failure theme

---

## 2. 这一轮筛查到底在找什么

只有同时满足下面几条的 runtime 问题，才算候选：

1. **代码里已经真实在跑**
2. **用户路径里已经真实存在**
3. **一旦出问题，会直接破坏回答路径一致性 / continuity / contract 语义**
4. **补的是 contract 漏口，不是新功能面**

如果某个问题只是：

* 代码不够优雅
* 命名不够顺
* 表层体验还可以更漂亮
* 想继续推进但还没有真实入口

那它不应进入这一轮。

---

## 3. 当前筛查范围

这一轮只看：

* 已存在真实运行入口的 runtime 路径
* 与回答路径一致性直接相关的 contract

优先关注：

* answer-shape precedence
* same-thread continuation 边界
* memory recall / relationship recall 与 runtime 决策的接缝
* runtime metadata 与实际回答路径是否出现 contract 漂移

明确不看：

* phrase-level 体验微调
* 应用层文案优化
* 新 surface 发明
* `thread_local` 这类当前还没有真实使用面的方向

---

## 4. 快速筛查的执行步骤

### Step 1：只看真实入口

先问一句：

> 这个 runtime 点，当前是否已经真的在用户路径中发生？

如果答案不是明确的“是”，直接排除。

### Step 2：只看 contract 级风险

再问一句：

> 这个点一旦出错，会不会直接导致回答路径一致性、continuity、或者 contract 语义被破坏？

如果只是一般性代码整理，不进入候选。

### Step 3：只收高置信漏口

只有当问题已经满足：

* 现象明确
* 归因明确
* 最小修口也明确

才允许进入下一条实现任务。

如果还停留在：

* 也许有问题
* 可能还能更稳
* 似乎值得再看看

则不继续深挖。

---

## 5. 止损条件

这一轮筛查必须带止损。

如果出现下面任一情况，就停止继续筛：

1. 没有找到高置信 contract 漏口
2. 候选问题开始依赖新 surface 才能成立
3. 候选问题已经开始偏向表层体验优化
4. 为了继续推进，开始把各种 runtime 细节都往“runtime contract”这个口袋里装

一旦触发止损，结论应明确写成：

**当前 runtime contract 快速筛查没有产出足够高置信的下一刀，不继续硬找。**

---

## 6. 筛不出下一刀之后怎么办

如果这轮筛查没有找到高置信漏口，下一步不要继续留在 runtime contract 筛查里打转。

应直接切回：

* 现有长链路场景集
* 已经暴露过的 failure theme
* 按 chain-level 问题继续推进

换句话说：

**runtime contract 筛查失败时，默认回到长链路 failure theme，而不是继续扩大筛查范围。**

---

## 7. evaluation / observability 的位置

evaluation / observability 不是这一轮的主线。

它只在下面这种情况下进入：

* runtime contract 筛查或长链路 rerun 里
* 明确出现 attribution 语言不一致
* verdict 表达不稳
* observation record 实际使用时又开始碎片化

否则不主动把它抬成第一主线。

---

## 8. 一句话结论

**runtime contract 快速筛查的目标不是“必须找出下一刀”，而是用最小成本判断：当前是否存在一个高置信、已在真实入口中暴露、且会直接破坏回答路径一致性的 contract 漏口；如果没有，就立刻止损并切回已有长链路 failure theme。**
