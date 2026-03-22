# 底座三主线下一阶段决策说明 v1.0

## 1. 文档定位

本文档用于对 SparkCore 当前三条底座主线：

- `runtime`
- `session`
- `role`

做一次并排阶段判断，并明确下一阶段的全局优先级。

本文档不重复各自的总设计，而是重点回答：

- 为什么当前三条主线都适合先停在现有节点
- 下一轮全局更应该优先推进哪一条
- 另外两条为什么先不动
- 当前明确不建议立刻做什么

> 状态：阶段决策说明
> 对应阶段：Phase 1 / foundation mainlines regroup
> 相关文档：
> - `docs/engineering/runtime_mainline_capability_summary_v1.0.md`
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `docs/engineering/role_mainline_capability_summary_v1.0.md`
> - `docs/engineering/session_next_phase_decision_note_v1.0.md`

---

## 2. 一句话结论

**当前三条底座主线都已经到达健康停点；下一轮如果继续推进底座，最值得优先推进的是 `session` 的 `loadThreadState(...)` 读取边界设计，而不是继续深拆 runtime execution，也不是继续深推 role policy。**

---

## 3. 当前三条主线的共同状态

当前 `runtime / session / role` 三条主线已经具备相似的成熟度特征：

### 3.1 都已有主文档与阶段总结

三条线都已经不是零散重构，而是都有：

- 主设计文档
- capability summary
- 当前边界判断

这意味着现在不是“边做边猜”的状态，而是已经有可以回看、可以判断下一步的稳定节点。

### 3.2 都已有代码事实

三条线都已经不只是文档：

- `runtime`
  已有 `RuntimeTurnInput / prepareRuntimeTurn(...) / runPreparedRuntimeTurn(...)`
- `session`
  已有 `SessionContext / ThreadStateRecord / prepareRuntimeSession(...)`
- `role`
  已有 `RoleRepository / RoleResolver / prepareRuntimeRole(...)`

### 3.3 都还处在受控过渡期，而不是生产式完成态

三条线虽然都已成形，但都还保留着“下一层还没开始”的边界：

- runtime 仍保留 `generateAgentReply(...)` 兼容层
- session 仍未进入 `loadThreadState(...) / persistence`
- role 仍只承接最小 fallback，metadata 还没正式收口

这意味着当前三条线都适合先停，不适合无节制顺手往下推。

---

## 4. 为什么现在不建议继续深推 `runtime`

当前 runtime 主线已经完成了最值钱的一轮收口：

- 统一 input
- 统一 runtime 外部入口
- preparation 显式化
- prepared execution 显式化
- Web / IM 两条主入口接入

继续往下拆的下一步，大概率会进入：

- `generateAgentReply(...)` 继续退薄
- execution 内部更细颗粒度拆分

这些不是不该做，而是**边际收益已经开始下降**。

如果现在继续推 runtime，更容易进入：

- 结构更漂亮
- 但短期系统能力没有明显新提升

所以 runtime 当前更适合作为：

**已形成主干、暂时接受当前边界的主线。**

---

## 5. 为什么现在不建议继续深推 `role`

当前 role 主线也已经完成了一轮很值钱的推进：

- repository 设计已落
- resolver 设计已落
- 代码壳已存在
- runtime / IM 主路径已开始直接消费新分层

如果继续往下，最自然就会碰到：

- 继续降低 `loadRoleProfile(...)` 存在感
- metadata 正式收口
- 更复杂 role selection policy

这同样不是不重要，而是：

- 当前最小分层已经成立
- 主路径也已经接上
- 再继续推，会很快从“边界收口”进入“策略系统深化”

而当前阶段更缺的，并不是 role policy 更复杂，而是另外一条状态主线再往前迈一步。

所以 role 当前更适合作为：

**主分层已成立、主路径已接线、可以先停的主线。**

---

## 6. 为什么当前更值得优先推进 `session`

当前三条主线里，`session` 最像下一轮更值得推进的一条，原因有三点：

### 6.1 `session` 的正式状态层刚刚出现

当前已经有：

- `thread`
- `ThreadStateRecord`
- `SessionContext`
- `prepareRuntimeSession(...)`

也就是说，session 已经从“只是 runtime consumption object”推进成了“开始具备正式状态层边界”的状态。

### 6.2 下一步更像“补读取边界”，不是“重系统深化”

如果下一轮继续 session，最自然的动作不是立刻做持久化，而是：

- `loadThreadState(...)` 的最小读取边界设计

这一步的收益比较高，因为它会回答：

- `ThreadStateRecord` 到底如何进入主流程
- 哪些字段现在真的值得读取
- 哪些字段仍只是默认构造态

而且这一步还没有直接掉进：

- migration
- 并发状态写回
- compaction

### 6.3 它比 runtime / role 更像“下一层自然未完成边界”

runtime 再往下就更像 execution 细拆。  
role 再往下就更像 policy / metadata 深化。  
session 再往下一步，则还是明显的：

**状态读取边界正式化。**

这更符合当前阶段“继续收底座边界，而不是继续长复杂系统”的方向。

---

## 7. 下一阶段全局优先级建议

当前建议优先级如下：

### Priority 1

`session`：

- `loadThreadState(...)` 最小读取边界设计

### Priority 2

`runtime`：

- 保持现状，不继续细拆 execution

### Priority 3

`role`：

- 保持现状，不继续深推 metadata / policy

也就是说，下一阶段最推荐的不是“继续当前最顺手的一条”，而是：

**先把 session 从“状态层刚进入主流程”推进到“状态读取边界被正式定义”。**

---

## 8. 当前明确不建议立刻做的事

当前不建议马上做：

- 继续深拆 `generateAgentReply(...)`
- 继续推进 role metadata 策略系统
- 继续推进 role 更复杂的选择规则
- 直接进入 `thread_state` 持久化
- 直接进入 session compaction / summarization

这些事情都重要，但都已经超出“下一轮最值得先收的边界”。

---

## 9. 当前最合理的暂停与切换方式

当前最合理的节奏不是：

- 在某一条已经健康停点的主线上顺手再推几步

而是：

1. 接受三条主线都已阶段收口
2. 重新选全局下一轮主线
3. 把下一轮明确定义成：
   - `session / loadThreadState(...) boundary`

这会让下一轮推进更聚焦，也能避免继续在 runtime 或 role 上进入收益递减区间。

---

## 10. 一句话结论

**当前底座三主线都已经到达可以暂停的健康节点；下一轮如果继续推进底座，全局最值得优先推进的是 `session` 的 `loadThreadState(...)` 读取边界设计，而不是继续拆 runtime execution 或继续深化 role policy。**
