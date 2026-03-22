# 06_多agent长记忆IM底座_记忆结构_v1.5.1

## 目录
1. 文档定位
2. 设计目标
3. 总体分层
4. 术语表
5. Layer A：角色核（Role Core）
6. Layer B：结构化长期记忆（Structured Long-Term Memory）
7. Memory Scope & Validity Contract
   - 7.11 回答策略层当前原则
8. Layer C：知识层（Knowledge Layer）兼容设计
   - 8.6 当前阶段知识层边界
9. Layer D：线程状态层（Thread State / Thread Compaction）兼容设计
10. Layer E：最近几轮原文（Recent Raw Turns）
11. 世界层 / 自演化 Agent 兼容设计
   - 11.5 当前阶段世界层边界
12. 当前实现映射表
   - 12.1 当前阶段实现状态总览
13. 当前符合度评估
   - 13.3 Layer D Observation Gate（长链路观察门槛）
14. 后续演进路线
15. 当前不建议做的事
16. 后续 issue 拆解建议
17. 一句话总结

---

# 1. 文档定位

本文档用于统一当前项目在“长记忆”上的内部设计语言，明确：

* 当前角色层长期记忆系统的分层方式
* 每类记忆属于哪一层、对谁生效、有效多久、在什么场景下用
* 知识库如何兼容接入，而不污染 Memory Contract
* 世界层 / 自演化 Agent 将来如何兼容接入，而不推翻当前角色层
* 当前实现与目标设计的符合度
* 后续是否需要按这些层次逐步补位，而不是一次性重构

本文档当前优先服务的产品北极星：

## 记得住 + 有人味

也就是先把**角色层**做深，再为未来的知识层、线程状态层、世界层做兼容预留。

---

# 2. 设计目标

当前长记忆系统的目标不是“尽可能多地存信息”，而是让系统在长期使用中做到：

## 2.1 记得住

* 能稳定保留用户事实、偏好、关系约定
* 同 agent 新 thread 仍能延续
* 换 agent 不乱串

## 2.2 有人味

* 角色身份稳定
* 关系风格稳定
* 多轮里语气、称呼、语言不轻易漂掉

## 2.3 可解释

* 用户能理解“为什么这轮这样回答”
* 用户能理解“这条记忆为什么生效 / 不生效”

## 2.4 可纠错

* incorrect / hidden / restore / superseded 语义清楚
* 错了能改，改了后能稳定生效

## 2.5 可扩展

* 后续可兼容 IM、多 agent、thread compaction、知识库、甚至世界层
* 但当前不为未来过度设计

---

# 3. 总体分层

建议把未来系统统一理解成 5 层：

## Layer A：角色核（Role Core）

回答：

> 这个角色是谁，它怎么说话，它和用户默认是什么关系姿态？

## Layer B：结构化长期记忆（Structured Long-Term Memory）

回答：

> 这个角色长期记得关于用户、关于双方关系、关于用户目标的什么内容？

## Layer C：知识层（Knowledge Layer）

回答：

> 这个角色知道什么事实、文档、资料、专业内容？

## Layer D：线程状态层（Thread State / Thread Compaction）

回答：

> 当前这条 thread 现在处在什么状态，哪些局部上下文需要被压缩保留？

## Layer E：最近几轮原文（Recent Raw Turns）

回答：

> 刚刚几轮具体说了什么？

---

# 4. 术语表

## Role Core

角色核。每轮都应稳定存在的短角色包，负责维持身份、风格、基本关系姿态。

## Structured Memory

结构化长期记忆。可明确命名、可稳定更新、可确定性召回的长期信息。

## Scope

作用域。记忆对谁生效。

## Validity

有效时长。记忆预期维持多久。

## Status

状态。记忆当前是否可用、为什么不可用。

## Structured Recall

高确定性召回。适用于称呼、职业、偏好等明确问法。

## Semantic Recall

语义召回。适用于开放式建议、总结、长目标、note 型信息。

## Thread State

线程状态包。用于在长链路中替代过老原文的 thread 压缩态。

## Recent Raw Turns

最近几轮原始消息，用于保持局部自然连续性。

---

# 5. Layer A：角色核（Role Core）

## 5.1 定义

角色核是每轮都应稳定注入的“短而固定的角色包”，用于维持：

* 角色身份
* 角色说话风格
* 角色基本立场
* 角色与用户默认关系姿态

## 5.2 当前建议字段

首版建议至少包括：

* `agent_id`
* `name`
* `avatar`
* `role_label`
* `persona_summary`
* `background_summary`
* `tone_style`
* `relationship_stance`
* `model_profile`
* `language_behavior`

## 5.3 特点

* 短
* 稳
* 每轮都应存在
* 不依赖 thread 长度
* 不依赖 memory 检索命中

## 5.4 作用

* 维持角色身份连续性
* 维持说话风格连续性
* 为“有人味”提供人格底座

## 5.5 当前状态

当前系统已具备基础版：

* agent identity
* persona summary
* style / profile
* relationship style continuity

当前已经完成最小 `role_core_packet` contract 定形：

* identity
* persona_summary
* style_guidance
* relationship_stance
* language_behavior

这意味着 Layer A 已经不再只是隐式 runtime 资产，而是有了最小显式结构。

但当前阶段只做到：

* packet contract 定形
* 注入边界稳定
* 与 agent profile / relationship memory / runtime instruction 的优先级关系可解释

当前仍然**不**做：

* 更重的 packet lifecycle system
* packet 自动合成系统
* packet UI 暴露
* 更细的应用层表层体验打磨

一句话说：

**Layer A 当前已完成“定形”，但还没有也不应该在这一阶段长成更重系统。**

---

# 6. Layer B：结构化长期记忆（Structured Long-Term Memory）

这一层是当前最成熟、最核心的能力。

## 6.1 Memory Ontology

当前建议长期记忆只围绕四类：

* `profile`
* `preference`
* `relationship`
* `goal`

### profile

用户稳定事实。

适合：

* 职业
* 城市
* 身份背景
* 长期稳定属性

例子：

* `profile.profession = 产品经理`

### preference

用户长期偏好。

适合：

* 回复语言偏好
* 表达长度偏好
* 规划方式偏好

例子：

* `preference.reply_language = zh`
* `preference.reply_style = concise`

### relationship

用户与某个 agent 之间的互动约定。

适合：

* 用户给 agent 的昵称
* 用户希望 agent 如何称呼自己
* 用户希望该 agent 用何种关系风格对话

例子：

* `relationship.agent_nickname = 小芳`
* `relationship.user_preferred_name = 阿强`
* `relationship.user_address_style = 轻松一点`

### goal

用户当前中长期目标。

适合：

* 当前重点项目
* 中期目标
* 一段时间内持续关注的方向

例子：

* `goal.current_goal = 做好多agent长记忆产品`

---

# 7. Memory Scope & Validity Contract

这一节是整份文档的核心。
以后讨论任何新记忆类型，都应先经过这套 contract。

---

## 7.1 四个“有效范围”维度

每条记忆都必须至少回答下面四个问题：

### A. 对谁生效（Ownership Scope）

* `user_global`
* `user_agent`
* `thread_local`

### B. 有效多久（Temporal Validity）

* `stable`
* `medium`
* `ephemeral`

### C. 在什么场景下用（Applicability）

例如：

* `direct_fact_question`
* `relationship_confirmation`
* `open_ended_advice`
* `open_ended_summary`
* `fuzzy_follow_up`
* `supportive_answer`
* `explanatory_answer`

### D. 生效强度（Influence Strength）

* `deterministic`
* `semi_constrained`
* `soft_influence`

---

## 7.2 Scope System（作用域系统）

### `user_global`

对当前用户全局成立，跨 agent、跨 thread 可用。

适合：

* 用户职业
* 偏好语言
* 长期回复风格偏好

例子：

* `profile.profession`
* `preference.reply_language`

---

### `user_agent`

只对“当前用户 × 某个 agent”成立。

适合：

* 用户给该 agent 的昵称
* 该 agent 如何称呼用户
* 该 agent 与用户之间的互动风格约定

例子：

* `relationship.agent_nickname`
* `relationship.user_preferred_name`
* `relationship.user_address_style`

重要规则：

* 必须绑定 `target_agent_id`
* 不是按 agent name 绑定
* 同 agent 新 thread 生效
* 换 agent 不串

---

### `thread_local`

只对当前 thread 成立。

适合：

* 临时回答格式
* 当前 thread 的局部约定
* 当前 thread 的局部语气

例子：

* “这条 thread 里先用 bullet 回答”
* “这一段先更正式一点”

重要规则：

* 默认不升为长期记忆
* 除非后续被明确确认、提炼并提升到长期层

---

## 7.3 Validity（有效时长）

### `stable`

长期稳定。
适合：

* 职业
* 昵称
* 用户偏好语言

### `medium`

阶段性稳定。
适合：

* 当前项目
* 一段时间内的互动风格偏好

### `ephemeral`

短时有效。
适合：

* 当前 thread 内局部约定
* 当前 thread 的临时语言或格式倾向

---

## 7.4 Applicability（适用场景）

当前建议按下面几类回答场景管理：

* `direct_fact_question`
* `relationship_confirmation`
* `open_ended_advice`
* `open_ended_summary`
* `fuzzy_follow_up`
* `supportive_answer`
* `explanatory_answer`

### 例子

#### `relationship.agent_nickname`

适用：

* `relationship_confirmation`
* `direct_fact_question`

#### `preference.reply_style`

适用：

* `open_ended_advice`
* `open_ended_summary`
* `supportive_answer`
* `explanatory_answer`

#### `thread_local.answer_format`

适用：

* 当前 thread 中大多数回答
  不应自动扩成 `user_global`

---

## 7.5 Influence Strength（生效强度）

### `deterministic`

强约束。

适合：

* 用户语言
* 昵称直问
* 职业直问
* 明确偏好直问

例子：
用户问“你叫什么”
命中 `relationship.agent_nickname`
应优先按昵称回答。

### `semi_constrained`

中强约束。

适合：

* relationship 风格
* 回答风格偏好
* 某些 advice / summary 中的语气约束

### `soft_influence`

弱参考。

适合：

* 背景方向
* 中期目标
* narrative note

---

## 7.6 Status Contract（状态契约）

### `active`

当前有效，可参与 recall。

### `hidden`

用户暂时不想展示/使用，但不代表错误。

### `incorrect`

用户明确说它是错的，不应继续参与 recall。

### `superseded`

不是错的，而是被同槽位新值替代了。

---

## 7.7 Update Contract（更新规则）

### Single-slot

同一个：

`category + key + scope (+ target_agent_id / target_thread_id)`

在同一上下文下只应有一个 `active` 值。

适合：

* `profile.profession`
* `preference.reply_language`
* `relationship.agent_nickname`
* `relationship.user_preferred_name`
* `relationship.user_address_style`

规则：

* 命中同槽位旧值
* 新值更明确 / 更新鲜 / 更高置信
* 旧值转 `superseded`
* 新值转 `active`

### Multi-valued

当前阶段谨慎使用，后续再扩。

适合未来：

* 多个兴趣标签
* 多个长期主题

### 首版 normalization

* trim
* 英文大小写统一
* 基础全半角统一
* 明显标点剥离

### 当前不做自动 merge

原因：

* 容易引入事实错误
* 降低记忆可信度
* 混淆 `superseded` 与“新内容生成”的边界

---

## 7.8 Recall Contract（召回契约）

### Structured Recall

用于：

* 名称直问
* 称呼直问
* 职业直问
* 偏好直问

特点：

* 优先级高
* 规则明确
* 不依赖模糊语义检索

### Semantic Recall

用于：

* 开放式建议
* 开放式总结
* 长目标背景补充

特点：

* 更自然
* 适合补充
* 不应覆盖 structured recall 的主路径

---

## 7.9 当前回答优先级原则

### 原则 1

当前 thread 已形成的局部约定，优先于远处历史。

### 原则 2

Structured recall 优先于开放式生成。

### 原则 3

关系型记忆优先于默认 persona 回答。

### 原则 4

当前轮最后一条用户消息的主语言优先级最高。

---

## 7.10 判断新记忆类型的统一问题清单

以后新增任何记忆类型，先回答这 8 个问题：

1. 属于 `profile / preference / relationship / goal` 哪一类？
2. 是结构化槽位，还是更适合 narrative note？
3. 对谁生效？
4. 有效多久？
5. 在哪些回答场景里用？
6. 是强约束还是弱参考？
7. 属于 single-slot 还是 multi-valued？
8. 错了以后应该 `hidden / incorrect / superseded` 哪一种？

答不出来，就不要先加字段。

---

## 7.11 回答策略层当前原则

当前系统的主战场已经不只是 memory schema，而是“记忆如何在回答中被稳定兑现”。

因此，在 Memory Contract 之外，需要额外明确回答策略层的当前原则。

### 原则 A：direct question 优先 structured recall
对于这类问题：
- 你叫什么
- 我该怎么叫你
- 我做什么工作
- 我喜欢什么回复方式

应优先使用 structured recall，并减少自由生成带来的偏移。

### 原则 B：open-ended advice / summary 采用“受记忆约束的自然生成”
对于开放式建议、总结、规划类问题：
- 不做机械 fact dump
- 但仍需受 profile / preference / relationship 的约束
- 保证回答自然，同时不丢核心记忆边界

### 原则 C：fuzzy follow-up 优先 same-thread continuation
对于模糊追问、短继续、轻承接类问法：
- 优先延续当前 thread 已形成的局部上下文
- 优先级应高于 distant memory fallback
- 只有在当前线程信号不足时，才回退到更远处的长期记忆

### 原则 D：relationship 不只要“被记住”，还要“被演出来”
当命中 relationship memory 时：
- 不只是内部知道昵称、称呼或互动风格
- 而应在回答中更自然地体现到：
  - 开场
  - 称呼
  - 解释型回答
  - 支持/鼓励型回答
  - 收尾方式

### 原则 E：当前轮主语言优先
在 mixed-language 场景下：
- 当前轮最后一条用户消息的主语言优先级最高
- thread 历史只作为辅助，不应压过当前轮输入
- 命中 memory 后也不应更容易漂到另一种语言

# 8. Layer C：知识层（Knowledge Layer）兼容设计

## 8.1 为什么知识层必须独立设计

知识库解决的是：

> 这个角色知道什么

记忆层解决的是：

> 这个角色记得你什么、你们之间有什么约定

两者不能混。

否则会出现：

* 用户偏好和文档事实混在一起
* correction 语义混乱
* 知识更新与关系记忆更新互相污染

所以：

## 知识层必须独立于 Memory Contract 设计

---

## 8.2 知识层推荐抽象

建议未来把知识层抽象为：

* `knowledge_source`
* `knowledge_binding`
* `knowledge_retrieval_result`

### knowledge_source

知识源本身：

* 文档集
* 网站
* 文件夹
* FAQ
* 结构化数据库

### knowledge_binding

哪个 agent 绑定了哪些知识源。

### knowledge_retrieval_result

某一轮回答时实际检索到的内容。

---

## 8.3 建议的知识绑定范围

### `workspace_knowledge`

全局知识源
适合：

* 产品文档
* 团队知识库
* FAQ

### `agent_knowledge`

特定 agent 绑定的知识源
适合：

* 专业角色资料
* 某个顾问角色的专业资料
* 某个专家角色的领域文档

### `user_private_knowledge`（后续可选）

用户私有资料
适合：

* 用户上传的个人资料包
* 某用户专属材料

---

## 8.4 知识层与记忆层的边界

### Memory

* 关于用户
* 关于用户与 agent 的关系
* 关于用户长期目标和偏好

### Knowledge

* 文档事实
* 领域知识
* 角色外部可检索资料

### 判断标准

如果一条内容回答的是：

* “你是谁 / 你喜欢什么 / 我们怎么互动” → Memory
* “这个世界里某个事实是什么 / 某份文档里写了什么” → Knowledge

---

## 8.5 当前阶段建议

### 现在

* 只做兼容预留，不正式拉进主线
* 可以在 agent profile 里预留：

  * `knowledge_binding_ids`

### 不做

* 上传页
* 索引页
* 知识后台
* 引用来源系统

### 未来再做

当你明确出现这些需求时：

* 某个 agent 需要稳定回答专业知识
* 用户明确希望“基于资料对话”
* 试用反馈里不断出现“它应该知道这个，但现在不知道”

---

## 8.6 当前阶段知识层边界

当前阶段，知识层虽然需要统一设计，但不应拉进主线。

### 当前明确不做
- 不做知识上传页
- 不做知识索引页
- 不做知识后台
- 不做知识引用来源系统
- 不把知识内容混入 `profile / preference / relationship / goal`

### 当前只做兼容预留
- 允许在 agent profile 层预留 `knowledge_binding_ids`
- 允许未来把 `knowledge_source / knowledge_binding / knowledge_retrieval_result` 作为独立能力层接入
- 但在当前阶段，知识层不应抢占“记得住 + 有人味”的主线资源

### 当前阶段的判断
知识层是未来可能的重要增强层，但**不是当前阶段的主战场**。

# 9. Layer D：线程状态层（Thread State / Thread Compaction）兼容设计

## 9.1 为什么这一层必要

当 thread 很长时：

* 原始历史不可能一直完整塞进上下文
* 只靠长期记忆也接不上当前 thread 的局部状态
* 角色语气、语言和局部关系风格会衰减

所以必须有一层回答：

> 当前这条 thread 正在发生什么，哪些局部状态必须被压缩保留？

---

## 9.2 推荐字段（未来）

建议未来的 thread state 至少考虑：

* `thread_id`
* `current_topic`
* `current_language`
* `current_relationship_tone`
* `pending_questions`
* `recent_commitments`
* `current_answer_shape_bias`
* `last_address_style`
* `last_profile_used`
* `last_memory_mode`

---

## 9.3 thread state 和长期记忆的区别

### 长期记忆

回答：

* 长期记得什么
* 跨 thread 是否成立

### thread state

回答：

* 当前 thread 处在什么状态
* 该如何压缩旧历史
* 当前局部语气/语言/关系连续性怎么延续

---

## 9.4 当前阶段建议

当前仍然：

* 不立刻正式实现 thread compaction
* 继续观察长链路衰减是否开始明显集中在 thread continuity

### 现在已有的弱替代物

* same-thread continuation
* fuzzy follow-up 优先当前线程
* relationship continuity
* mixed-language continuity
* 多轮回归与 drift 记录

这些以后都应逐步归拢到正式 thread state 层。

---

# 10. Layer E：最近几轮原文（Recent Raw Turns）

## 10.1 含义

最近几轮原文是当前模型输入中保留的短期上下文，回答：

> 刚刚几轮具体说了什么？

## 10.2 作用

* 保持局部自然性
* 保持代词、省略、承接自然
* 为 same-thread continuation 提供最短链路连续性

## 10.3 特点

* 天然存在
* 最接近真实对话
* 但不能无限增长
* 最容易被上下文窗口限制影响

## 10.4 当前状态

已具备，一直在使用。
但不能单独承担长期连续性。

---

# 11. 世界层 / 自演化 Agent 接入兼容设计

## 11.1 先给结论

**世界层不是当前角色层的小升级，而是更高一层的新引擎。**

但当前角色层的很多设计：

* ontology
* scope
* relationship
* fidelity 评测方法
  都可以作为世界层里的**角色心智层**继续复用。

---

## 11.2 世界层真正关心的内容

它关心的不是：

* 玩家问一句，角色回一句

而是：

* 世界状态
* 事件传播
* 时间推进
* 群体行为
* 资源/组织/阵营
* 非玩家输入下也持续运行

所以世界层需要新增至少三类系统：

### A. World State

* 地点
* 时间
* 阵营
* 资源
* 生态状态
* 实体位置与拥有关系

### B. Event Layer

* 谁做了什么
* 发生了什么事件
* 事件如何影响角色记忆、关系、状态

### C. Simulation Loop

* tick / scheduler
* 没有玩家输入时世界也会运行
* 多实体异步决策

---

## 11.3 当前角色层如何兼容世界层

### 兼容方式 1：把“用户/agent”抽象提升为“entity”

未来可以泛化：

* `subject_user_id` → `subject_entity_id`
* `target_agent_id` → `target_entity_id`
* `user_agent` → `entity_entity`

### 兼容方式 2：把 relationship memory 泛化为 entity relationship

例如：

* 玩家 ↔ NPC
* NPC ↔ NPC
* NPC ↔ 阵营

### 兼容方式 3：把当前 thread 未来泛化为 scene / local interaction context

当前：

* thread continuation

未来：

* scene continuity
* encounter continuity
* conversation segment continuity

---

## 11.4 当前阶段是否要为了世界层重构？

不建议。

当前更合理的是：

* 把世界层当未来上层
* 当前先把角色层做深
* 只在命名和数据抽象上留少量兼容口

例如：

* `subject_entity_id` 作为未来兼容方向
* `relationship` 未来可泛化为 `entity_entity`

---

## 11.5 当前阶段世界层边界

当前项目虽然已经在设计层为世界层 / 自演化层做了兼容预留，但世界层不应进入当前主线。

### 当前明确不做
- 不做 world state 功能化
- 不做 event system 功能化
- 不做 simulation loop
- 不做大世界生态模拟能力
- 不为了未来世界层而提前把当前角色层做重

### 当前阶段的最佳策略
- 把当前系统继续当作“角色层 / 角色心智层”来打磨
- 把 ontology / scope / relationship / fidelity 这些角色层资产继续做深
- 未来若进入世界层，再在其上新增：
  - world state
  - event layer
  - simulation loop

### 当前阶段的判断
世界层是远期方向，但当前不应参与阶段性功能决策。

# 12. 当前实现映射表

| 目标层           | 目标能力                               | 当前状态      | 备注             |
| ------------- | ---------------------------------- | --------- | -------------- |
| Layer A 角色核   | agent identity / style / profile   | 基础版已具备    | 尚未固化为显式 packet |
| Layer B 长期记忆  | Memory v2 contract                 | 已成型       | 当前最成熟主干        |
| Layer B 长期记忆  | relationship continuity / fidelity | 持续打磨中     | 已进入多轮质量期       |
| Layer C 知识层   | knowledge binding / retrieval      | 仅概念预留     | 不进当前主线         |
| Layer D 线程状态层 | thread_state / compaction          | 未正式实现     | 仅有弱替代物         |
| Layer E 最近原文  | same-thread continuation           | 已天然存在并在使用 | 不能单独承担长链路稳定性   |
| 世界层           | world state / event / sim          | 未开始       | 当前只做兼容抽象预留     |

---
## 12.1 当前阶段实现状态总览

如果用本文档的五层结构来判断当前项目进度，可以更明确地归纳为：

### Layer A：角色核（Role Core）
- 基础版已具备，并已完成最小 `role_core_packet` contract 定形
- 已有 identity / persona summary / style guidance / relationship stance / language behavior
- 当前已从“纯隐式 runtime 规则”推进到“最小显式 packet”
- 但当前阶段仍只做 contract，不做更重 packet system

### Layer B：结构化长期记忆（Structured Long-Term Memory）
- 当前最成熟、最核心的主干
- Memory v2 contract 已基本成型
- category / scope / status / relationship / single-slot / structured recall / correction / eval matrix 已具备
- single-slot restore / superseded semantics 已补强
- `user_agent` recall scope consistency 已补强
- 当前阶段最关键的“状态机 + 作用域”第一批 contract 已落下
- 当前项目最主要的“记得住”能力来自这一层
- 当前继续往下最容易滑向 `thread_local` 新使用面设计，因此这一小批适合先阶段性收口

### Layer C：知识层（Knowledge Layer）
- 仅做兼容预留
- 暂未进入正式实现期
- 当前不应拉进主线，不应与 Memory Contract 混用

### Layer D：线程状态层（Thread State / Thread Compaction）
- 当前未进入实现期
- 仅存在“弱替代物”和 observation 框架
- 包括：
  - same-thread continuation
  - fuzzy follow-up 优先当前线程
  - long-chain watch signals
  - scenario packs / failure condition / attribution record
  - 已统一的 observation record 模板
- 当前阶段的重点不是实现 Layer D，而是判断是否真的到了需要进入 Layer D 设计期的时候

### Layer E：最近几轮原文（Recent Raw Turns）
- 天然存在并一直在使用
- 当前 same-thread continuity 的主要局部支撑层
- 但不能单独承担长链路稳定性

# 13. 当前符合度评估

## 13.1 已经符合的部分

### 角色层长期记忆主干

已具备：

* Memory v2 record shape
* category / scope / status
* relationship
* user_agent
* single-slot update
* structured recall
* correction contract
* eval matrix
* fidelity / language / continuity / runtime strategy 收敛
* Layer A 最小 `role_core_packet` contract
* Layer B 第一批关键状态机与作用域 contract
* Layer D observation record 统一模板

### 多轮质量验证体系

已具备：

* scenario packs
* failure condition
* reason code
* verification gap audit
* focused smoke
* real-chat regression 验收思路

这说明：

## Layer B 已成型，Layer A 已完成最小 contract 定形，Layer D 也已有稳定 observation 记录语言。

---

## 13.2 还没正式具备的部分

### 知识层

目前仍是空白或概念预留。

### thread state / compaction

还未正式实现。

### 世界层

仅有兼容抽象方向，未进入实现期。

---

## 13.3 Layer D Observation Gate（长链路观察门槛）

当前项目已经进入“可以观察 long-chain state pressure，但还不应直接实现 thread compaction”的阶段。

### 当前已具备的观察基础设施
- `long-chain watch signals`
  - `recent_raw_turn_count`
  - `approx_context_pressure`
  - `same_thread_continuation_applicable`
  - `long_chain_pressure_candidate`
- 固定的长链路验收窗口：
 - observation record template
 - verdict / first failing turn / drift dimension 的统一记录语言
  - `8~12 turn`
- 冻结的 `profile × scenario pack` 组合
- 固定的 failure attribution 记录格式：
  - `first_detected_drift_turn`
  - `drift_dimension`
  - `main_developer_reason`
  - `recent_raw_turn_count`
  - `approx_context_pressure`
  - `long_chain_pressure_candidate`
- 固定的验收结论类型：
  - `rule-layer issue`
  - `state-pressure candidate`
  - `no obvious drift`

### 当前阶段的判断原则
当前不因为“某一轮有点漂”就进入 Layer D。
必须满足更严格的观察门槛：

1. 连续两轮 real-chat regression  
2. 在相同或相近 scenario pack 中  
3. 出现相近 `drift_dimension`  
4. 且 `long_chain_pressure_candidate = true`  
5. 并先排除明显的规则层 bug

### 当前阶段的结论
Layer D 已进入“观察期”，但**尚未进入实现期**。

也就是说：
- 当前可以继续补 observation signal / attribution / acceptance gate
- 但不应该直接做：
  - `thread_state`
  - `thread_compaction`
  - `thread_summary` 功能化

### formal gate 后的当前阶段结论

截至当前这轮正式验收，第一轮 formal `8~12 turn` long-chain gate 已经在**当前 frozen baseline、当前 scenario-pack 集合、当前 profile-by-pack matrix** 上通过。

因此当前阶段的执行判断应明确为：

- 当前阶段仍应继续 `keep_role_layer`
- 还没有进入 Layer D 设计评审触发条件
- 也还不应转向 `thread_compaction` / `thread_summary` / `thread_state` 的正式实现

这里的关键原因是：

- 最近这轮 formal gate 与 lightweight confirmation rerun 都没有再确认新的 long-chain drift
- 前面暴露出的掉点都更像 rule-layer gap，并且已经被逐条收口
- 到目前为止，还没有形成“连续两轮、相近 pack、相近 drift dimension、且 `long_chain_pressure_candidate = true`”这组 Layer D 触发信号

关于环境噪音，当前也已有明确处理口径：

- 类似 Supabase connect timeout 这类 infra 异常，如果 same-baseline rerun 通过，应记为 `environment noise`
- 不应直接把这类事件记成 `product drift`

# 14. 后续演进路线

## 阶段 1：继续打磨角色层

优先继续：

* fidelity
* language consistency
* relationship continuity
* long-chat stability
* answer strategy coverage

## 阶段 2：观察是否需要正式补 Layer D

当出现这些信号时，就该认真考虑：

* thread 很长后 continuity 明显衰减
* 结构化长期记忆也接不上局部 thread 状态
* 多轮 regression 的漂移开始集中在 thread continuity

建议再补一条更显式的进入条件：

* 连续两轮 real-chat regression
* 在相同或相近 scenario pack 中
* 出现相近 drift dimension
* 且 `long_chain_pressure_candidate = true`
* 并先排除明显规则层 bug

满足这组条件时，再进入正式 Layer D 设计期，而不是提前进入实现期。

## 阶段 3：引入知识层

当明确需要：

* 某个 agent 稳定回答外部资料
* agent 需要专业资料支撑
* 用户开始要求“基于我的资料”回答

## 阶段 4：评估世界层

当真的决定往：

* 小世界模拟
* 群体互动
* 事件传播
* 自演化生态
  推进时，再新增世界引擎，而不是提前把当前角色层做重。

---

# 15. 当前不建议做的事

* 不扩新 memory 类型优先于先把已有 memory 用稳
* 不做 thread compaction，直到长链路问题真正集中暴露
* 不把知识库混进 memory contract
* 不把用户默认解释层做成开发调试台
* 不为了未来世界层过早把当前角色层做重
* 不做重型 memory center
* 不做复杂知识库后台
* 不做图谱记忆主线
* 不做世界模拟引擎主线

---

# 16. 后续 issue 拆解建议

当前最值得继续拆 issue 的方向应继续围绕：

## A. 角色层回答表现

* fidelity
* mixed-language consistency
* relationship continuity
* long-chat stability

## B. 线程状态观察

* 更长链路 regression
* thread continuity 漂移点定位
* 判断是否开始需要 thread compaction

## C. 兼容预留，不立即实现

* agent profile 中预留 `knowledge_binding_ids`
* 设计层保留 `subject_entity_id / target_entity_id` 演进方向
* 不进入正式功能开发

---

# 17. 一句话总结

## 当前最优策略不是“继续扩很多层”，而是：

### **把角色层做深，把知识层和世界层做成兼容预留。**

这样：

* 现在不会失焦
* 未来不会完全推翻
* 不会为了可能很远的终局过早付出过重的架构成本
