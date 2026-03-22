# Layer A 最小 `role_core_packet` Contract（2026-03-22）

## 1. 目的

这份文档只固定当前已经成立的 Layer A 最小 contract。

它回答的是：

* 当前 `role_core_packet` 至少包含什么
* 它在运行时从哪里来
* 它和 `agent profile` / `relationship memory` / `runtime instruction` 的关系是什么
* 当前哪些事情已经是 contract，哪些还故意不做

这份文档**不是**新的系统设计，也**不是**更重的 packet lifecycle proposal。

一句话：

**先把 packet contract 写稳，不先把 packet system 做重。**

---

## 2. 当前最小字段集

按当前 runtime 与 smoke 实现，最小 `role_core_packet` 已经包含：

### 2.1 identity

* `agent_id`
* `agent_name`

作用：

* 维持当前角色是谁
* 为同一角色连续性提供最低限度身份锚点

### 2.2 persona_summary

* `persona_summary`

作用：

* 提供短角色概览
* 避免每轮都只靠 thread 局部上下文临时拼角色感

### 2.3 style_guidance

* `style_guidance`

当前来源是 agent 的 `style_prompt`。

作用：

* 提供稳定的说话风格约束
* 不承担 thread 局部临时格式控制

### 2.4 relationship_stance

当前最小结构：

* `effective`
* `source`

其中：

* `effective` 当前可落到：
  * `default-agent-profile`
  * `formal`
  * `friendly`
  * `casual`
  * `no_full_name`
* `source` 当前可落到：
  * `agent_profile_default`
  * `relationship_memory`

作用：

* 让“默认关系姿态”有显式位置
* 让 runtime 区分“来自 agent 默认值”还是“来自已生效的关系记忆”

### 2.5 language_behavior

当前最小结构：

* `reply_language_target`
* `reply_language_source`
* `same_thread_continuation_preferred`

作用：

* 固定当前轮的目标回复语言
* 说明语言决策来自哪里
* 显式记录是否处于“更偏 same-thread continuation”的回答姿态

---

## 3. 当前注入边界

当前 `role_core_packet` 的边界应理解成：

* 它是**每轮回答前稳定存在的短角色包**
* 它不依赖长 thread 历史是否还能完整保留
* 它不依赖某条 memory 是否刚好被 semantic recall 命中
* 它比局部回答策略更稳定，但比更重的世界层设定更轻

也就是说：

* 它不是 thread compaction 产物
* 不是长摘要
* 不是最近几轮原文替代物
* 也不是临时 answer-shape patch 集合

当前最合理的定位是：

**`role_core_packet` 是 Layer A 的稳定前置包，不是 Layer B recall 的副产品。**

---

## 4. 当前优先级关系

当前可以用下面这条顺序理解优先级：

### 4.1 identity / persona / style

这部分默认来自 `agent profile`。

它们是 Layer A 的基础值，不应由 thread 局部漂移来决定。

### 4.2 relationship_stance

这部分默认值来自 `agent profile`，但可以被已生效的 `relationship memory` 改写。

当前已经成立的优先级是：

* 若有有效的关系记忆命中，则 `relationship_memory` 可覆盖默认关系姿态
* 若没有，则保留 `agent_profile_default`

### 4.3 language_behavior

这部分是当前轮决策，不是长期 persona 本身。

它会综合：

* 最新用户消息
* same-thread continuity
* 已有 continuation 偏好

所以它属于：

* 被显式记录在 Layer A packet 中
* 但来源上更接近当前轮 runtime decision

### 4.4 runtime instruction

`runtime instruction` 不等于 `role_core_packet`。

更准确地说：

* `role_core_packet` 提供稳定角色核
* `runtime instruction` 在此基础上组织当前轮回答任务

因此，当前更合理的关系是：

**Layer A 先定“你是谁、默认怎么说、默认是什么关系姿态”；runtime instruction 再定“这轮具体怎么答”。**

---

## 5. 当前已经成立的 contract

以下几条现在已经可以视为当前 contract：

1. `role_core_packet` 已经不是纯隐式约定，而是显式结构
2. 最小字段集已经稳定到足以支撑 role continuity contract
3. `relationship_stance.source` 能区分默认来源和记忆来源
4. `language_behavior` 已经进入 packet，而不是散落在 metadata 角落里才可见
5. smoke 与 runtime 已经共享同一最小 packet 形状

这意味着：

当前 Layer A 已经完成的是：

* **最小 contract 定形**

但还没有进入：

* 更重的生命周期系统
* 更复杂的自动合成逻辑

---

## 6. 当前明确不做的事

这一阶段刻意不做：

* 更重的 packet schema 扩张
* packet lifecycle system
* packet UI 暴露
* packet 自动合成系统
* 把更多表层体验优化塞进 Layer A

也不把下面这些临时拉进 packet：

* phrase-level 体验微调
* 应用层 helper copy
* 更细的“多像朋友 / 多温柔 / 多松弛”风格微调

这些都不属于当前 Layer A 最小 contract 的边界。

---

## 7. 下一步最合理的动作

Layer A 下一步最合理的方向，不是继续扩字段，而是：

* 保持当前字段集稳定
* 在后续新 contract 进入时，判断它是否真的属于 Layer A
* 继续防止 Layer A 退回成“隐式 runtime 习惯”

换句话说：

**Layer A 当前最重要的不是继续长大，而是先保持边界稳定。**

---

## 8. 一句话结论

当前 `role_core_packet` 已经足以被视为 Layer A 的最小稳定 contract：

**它显式承载当前角色身份、简短 persona、风格指导、默认关系姿态来源，以及当前轮语言行为；它的价值在于稳定注入角色核，而不是承担更重的生命周期系统。**
