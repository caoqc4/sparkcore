# Memory Layer 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `memory layer` 的模块边界、内部设计语言、核心 contract 与当前实现范围。

本文档重点回答：

- 当前阶段的 memory layer 到底负责什么
- 它与 role、session、runtime 分别如何协作
- 当前 Memory v2 的 ontology、scope、status、update、recall contract 是什么
- 为什么当前要强调 `role-memory-session` 的最小协作面
- 哪些能力当前应该先做稳，哪些应后置

本文档吸收了两类上游材料：

- `06_多agent长记忆IM底座_记忆结构_v1.5.1.md` 中关于 Layer A / B / D、角色连续性、知识层边界、Observation Gate 的设计语言
- `docs/plans/2026-03-17-memory-v2-design.md` 中关于 Memory v2 ontology、scope、status、update、recall 的可执行 contract

但本文档以当前新主线为准，不直接复用旧文档中的整体叙事。

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/strategy/sparkcore_repositioning_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/engineering/phase1_adjustment_execution_plan_v1.0.md`
> - `docs/product/companion_mvp_flow_v1.0.md`

---

## 2. 一句话定义

**memory layer 是 SparkCore 当前阶段用于承载“长期记得住 + 关系连续性 + 可解释纠错”的核心能力层，负责结构化长期记忆的写入、更新、存储、查询与召回，并与 role、session 一起支撑 single-agent runtime 的持续会话体验。**

---

## 3. 当前阶段设计目标

当前阶段的 memory layer 目标不是“尽可能多地存信息”，而是让系统在长期使用中做到：

1. 记得住用户事实、偏好、关系约定与阶段性目标
2. 记忆不乱串，尤其是不同 agent 间的关系记忆不泄漏
3. 回答时能把记忆稳定兑现出来，而不是“明明记住了但回答没用上”
4. 用户能理解某条记忆为什么生效、为什么失效
5. 错误记忆能被纠正、隐藏、恢复，而不是只会越积越乱
6. 后续可兼容 IM、scheduler、thread state、knowledge layer，但当前不过度设计

---

## 4. 当前阶段非目标

当前阶段 memory layer **不负责**：

- 多 Agent 编排记忆系统
- 知识库本体与知识检索系统
- 重型 narrative memory center
- 自动 merge / 自动重写记忆句子
- 大规模 note-style memory
- 正式的 thread compaction 系统
- 世界层 / event layer / simulation memory
- 复杂用户可视化后台

这些内容要么属于未来层，要么会显著拉宽当前 Phase 1 范围。

---

## 5. 当前阶段最重要的判断

当前要优先做稳的，不只是 memory 模块本身，而是：

**role、memory、session 三者之间的最小协作面。**

原因很简单：

- 只有 role，没有 memory，角色像同一个模板而不像持续存在的人
- 只有 memory，没有 role，系统会“记得东西”但没有稳定人设
- 只有 role 和 memory，没有 session，系统会丢当前 thread 的局部连续性

因此，当前阶段最重要的不是把 memory 做成一个孤立数据库能力，而是让：

- `role` 负责“它是谁、怎么说话、默认关系姿态是什么”
- `memory` 负责“它长期记得关于用户和双方关系的什么”
- `session` 负责“这条 thread 当前正在发生什么”

三者能在 `single-agent runtime` 中稳定协同。

---

## 6. memory layer 在整体架构中的位置

当前推荐分层如下：

- Core Layer
  - role
  - memory
  - session
  - scheduler
  - single-agent runtime

- Integration Layer
  - IM adapter
  - message normalization
  - binding
  - routing

- Product Layer
  - 角色配置与领取
  - onboarding
  - 网站产品壳
  - 付费与运营逻辑

其中：

- memory layer 属于 **Core Layer**
- 它不理解具体 IM 平台
- 它不直接理解页面流程
- 它通过 runtime 被调用，而不是直接变成产品壳逻辑

---

## 7. 当前推荐的记忆相关分层语言

为了统一设计语言，当前建议把与“记忆连续性”相关的能力理解为以下几层：

### 7.1 Layer A：Role Core

回答：

> 这个角色是谁，它怎么说话，它和用户默认是什么关系姿态？

这层不是 memory 本身，但和 memory 强相关。

它负责：

- 角色身份
- persona 摘要
- 风格 guidance
- relationship stance
- language behavior

当前判断：

- Layer A 已经需要最小 contract
- 但当前不做重型 packet system

---

### 7.2 Layer B：Structured Long-Term Memory

回答：

> 这个角色长期记得关于用户、关于双方关系、关于用户目标的什么内容？

这是当前阶段 memory layer 的真正主战场。

它负责：

- structured memory ontology
- scope rules
- status lifecycle
- single-slot update
- structured recall
- correction / restore / superseded semantics

---

### 7.3 Layer D：Thread State / Thread Compaction

回答：

> 当前这条 thread 现在处在什么状态，哪些局部上下文需要被压缩保留？

当前判断：

- 这是未来必要层
- 但当前尚未进入正式实现期
- 当前只保留 observation 与弱替代物

---

### 7.4 Layer E：Recent Raw Turns

回答：

> 刚刚几轮具体说了什么？

这一层天然存在，不属于 long-term memory，但与当前记忆体验强相关。

它负责：

- same-thread continuation
- 代词、省略、承接
- 局部语气和语言延续

---

## 8. 当前阶段模块边界

## 8.1 memory layer 应负责的

- 定义长期结构化记忆的 ontology
- 定义 scope、status、stability 等 contract
- 提供写入、更新、查询、召回接口
- 处理 single-slot replacement 与 correction semantics
- 返回可解释、可追踪的 recall 结果
- 为 runtime 提供可消费的标准对象

---

## 8.2 memory layer 不应负责的

- 角色配置页面
- 用户套餐逻辑
- 具体 IM 平台消息收发
- 页面 UI 状态
- runtime 主流程编排
- knowledge retrieval 本体
- 重型 thread compaction 实现
- 世界层记忆系统

---

## 9. 与 role、session、runtime 的边界

## 9.1 role 负责什么

role 负责提供相对稳定、每轮都应存在的角色核信息，例如：

- `agent_id`
- `name`
- `persona_summary`
- `style_guidance`
- `relationship_stance`
- `language_behavior`
- `model_profile`

role 回答的是：

> 它是谁
> 它默认怎么说话
> 它和用户默认是什么关系姿态

memory 不应取代 role 的这部分职责。

---

## 9.2 memory 负责什么

memory 负责提供关于用户和双方关系的长期结构化信息，例如：

- `profile.profession`
- `preference.reply_language`
- `relationship.agent_nickname`
- `relationship.user_address_style`
- `goal.current_focus`

memory 回答的是：

> 它长期记得你什么
> 它长期记得你们之间的约定是什么

---

## 9.3 session 负责什么

session 负责提供当前 thread / 当前轮的局部上下文，例如：

- `thread_id`
- recent turns
- current message
- current thread state placeholder
- local temporary agreements

session 回答的是：

> 这条 thread 当前正在发生什么

---

## 9.4 runtime 如何组织三者

当前 runtime 应按以下顺序组织三者：

1. 读取 role core
2. 读取 session / recent turns
3. 对当前输入发起 memory recall
4. 组装推理上下文
5. 生成 `assistant_message`
6. 产出 `memory_write_requests`
7. 产出 `follow_up_requests / runtime_events`

因此，memory layer 不应自己做 runtime orchestration，但必须提供足够稳定的调用面。

---

## 10. Memory v2 当前核心 ontology

当前阶段长期记忆只围绕四类：

- `profile`
- `preference`
- `relationship`
- `goal`

---

### 10.1 `profile`

用于用户稳定事实。

适合：

- 职业
- 城市
- 身份背景
- 长期稳定属性

不适合：

- 临时情绪
- 一次性计划
- 推测性内容

示例：

- `profile.profession = 产品经理`
- `profile.location = shanghai`

---

### 10.2 `preference`

用于用户稳定或重复出现的偏好。

适合：

- 回复语言偏好
- 规划方式偏好
- 回复风格偏好
- 工作流偏好

不适合：

- 当前 thread 临时格式要求
- 只出现一次的瞬时偏好

示例：

- `preference.reply_language = zh`
- `preference.reply_style = concise`

---

### 10.3 `relationship`

用于用户和某个 agent 之间的互动约定。

适合：

- 用户给当前 agent 的昵称
- 当前 agent 如何称呼用户
- 当前 agent 的互动风格约定

不适合：

- 泛化到所有 agent 的用户事实
- 与关系无关的普通偏好

示例：

- `relationship.agent_nickname = 小芳`
- `relationship.user_preferred_name = 阿强`
- `relationship.user_address_style = 轻松一点`

---

### 10.4 `goal`

用于用户中期仍会持续存在的目标。

适合：

- 当前重点项目
- 阶段性推进目标
- 中期持续关注方向

不适合：

- 单次 thread 内的临时请求
- 当天随口提到的一次性念头

示例：

- `goal.current_focus = improve answer quality`

当前判断：

- `goal` 保留在 ontology 中
- 但当前 P0 不做过重扩展

---

## 11. Scope Contract

每条结构化长期记忆都必须回答“对谁生效”。

当前推荐三类 scope：

- `user_global`
- `user_agent`
- `thread_local`

---

### 11.1 `user_global`

跨当前用户的 workspace 生效。

适合：

- 用户职业
- 城市
- 全局语言偏好
- 稳定回复风格偏好

示例：

- `profile.profession`
- `preference.reply_language`

---

### 11.2 `user_agent`

只对“当前用户 × 当前 agent”生效。

适合：

- `relationship.agent_nickname`
- `relationship.user_preferred_name`
- `relationship.user_address_style`

规则：

- 必须绑定 `target_agent_id`
- 同 agent 新 thread 仍生效
- 换 agent 不串
- 必须按 `agent_id` 绑定，不能按展示名绑定

---

### 11.3 `thread_local`

只对当前 thread 生效。

适合：

- 临时回答格式
- 当前 thread 的局部语气
- 当前 thread 的局部工作上下文

规则：

- 默认不升为长期记忆
- 不应与长期记忆共用主展示面
- 只作为当前 session / thread state 的补充

---

## 12. 结构化数据 contract

## 12.1 `MemoryRecord`

当前建议的长期结构化记忆记录至少包括：

- `id`
- `category`
- `key`
- `value`
- `scope`
- `subject_user_id`
- `target_agent_id`
- `target_thread_id`
- `confidence`
- `stability`
- `status`
- `source_refs`
- `created_at`
- `updated_at`
- `last_used_at`
- `last_confirmed_at`

字段含义：

- `category`：ontology bucket
- `key`：结构化槽位名
- `value`：槽位值
- `scope`：生效范围
- `subject_user_id`：记忆归属用户
- `target_agent_id`：`user_agent` 必填
- `target_thread_id`：`thread_local` 必填
- `confidence`：抽取或确认置信度
- `stability`：预期持久度
- `status`：生命周期状态
- `source_refs`：可追踪来源

---

## 12.2 `MemoryWriteRequest`

runtime 不应直接裸写数据库，而应产出标准化写入请求。

当前建议字段：

- `category`
- `key`
- `value`
- `scope`
- `subject_user_id`
- `target_agent_id?`
- `target_thread_id?`
- `confidence`
- `stability`
- `source_refs`
- `reason`
- `idempotency_key?`

它回答的是：

> 本轮为什么要写这条记忆
> 它应该写到哪个槽位

---

## 12.3 `MemoryRecallQuery`

当前建议 recall 查询对象至少包括：

- `subject_user_id`
- `agent_id`
- `thread_id`
- `current_message`
- `message_type`
- `current_language`
- `intent_hint?`
- `direct_question_hint?`
- `session_context?`

它回答的是：

> 当前这一轮需要回忆什么

---

## 12.4 `MemoryRecallResult`

当前 recall 结果至少应区分：

- `structured_hits`
- `semantic_hits`
- `excluded_hidden`
- `excluded_incorrect`
- `applied_scope_summary`
- `debug_notes?`

原因：

- recall 命中不等于回答就一定正确
- runtime 需要知道命中了什么
- UI / eval 也需要可解释信息

---

## 13. Status Contract

当前推荐四种状态：

- `active`
- `hidden`
- `incorrect`
- `superseded`

---

### 13.1 `active`

当前有效，可参与 recall。

---

### 13.2 `hidden`

用户暂时不想展示或使用，但不代表错误。

---

### 13.3 `incorrect`

用户明确说它是错的，不应继续参与 recall。

---

### 13.4 `superseded`

旧值并非“错误”，而是被同槽位新值替代。

---

## 13.5 状态转换规则

当前阶段至少支持：

- `active -> hidden`
- `active -> incorrect`
- `active -> superseded`
- `hidden -> active`
- `incorrect -> active`

当前建议：

- `superseded` 一般不手工 restore
- 它属于替换链条的一部分

---

## 14. Update Contract

## 14.1 Single-slot 优先

当前阶段优先聚焦 single-slot memory。

定义：

对于同一个：

- `subject_user_id`
- `scope`
- `category`
- `key`
- 以及必要的 target binding

只应存在一个 `active` 值。

适合：

- `profile.profession`
- `preference.reply_language`
- `relationship.agent_nickname`
- `relationship.user_preferred_name`
- `relationship.user_address_style`

---

## 14.2 替换规则

当新值命中同槽位时：

- 只有在新值更明确、更高置信或更新鲜时才替换
- 旧值转 `superseded`
- 不删除历史记录

---

## 14.3 Normalization 规则

当前阶段只做轻量 normalization：

- trim whitespace
- 英文小写统一
- 基础全半角统一
- 剥离明显标点噪音

这足以避免明显重复，不需要在 P0 引入重型 NLP。

---

## 14.4 当前不做 automatic merge

当前阶段不自动把多条记忆“重写合并成一句新内容”。

原因：

- 事实风险高
- 降低记忆可信度
- 混淆 `incorrect` 与 `superseded` 语义

当前只做：

- duplicate skip
- single active value
- 必要时轻量 replacement

---

## 15. Recall Contract

当前建议区分两条 recall 路径：

- Structured Recall
- Semantic Recall

---

### 15.1 Structured Recall

用于：

- 名称直问
- 称呼直问
- 职业直问
- 偏好直问

规则：

- `category / key / scope` 优先查找
- 是最高优先级路径
- 一旦命中有效 slot，不应被 semantic path 覆盖

---

### 15.2 Semantic Recall

用于：

- 开放式建议
- 开放式总结
- 长目标背景补充
- 未来 note-style memory

规则：

- 仅在 structured recall 不能直接回答时补充
- 不覆盖有效 structured hit

---

## 15.3 Recall 优先级示例

问题：`你叫什么`

优先级：

1. `relationship.agent_nickname @ user_agent`
2. agent canonical name
3. fallback self-introduction

问题：`我做什么工作`

优先级：

1. `profile.profession @ user_global`
2. semantic notes
3. explicit unknown

---

## 16. 回答兑现与 Fidelity 原则

记忆命中不等于回答自然正确，因此需要额外定义回答兑现原则。

### 原则 1：direct question 优先 structured recall

对于这类问题：

- 你叫什么
- 我该怎么叫你
- 我做什么工作
- 我喜欢什么样的回复方式

应优先按 structured slot 回答。

---

### 原则 2：relationship 不只要“被记住”，还要“被演出来”

当命中 relationship memory 时，不只是内部知道，而应更自然地体现在：

- 开场
- 称呼
- 解释型回答
- 支持型回答
- 收尾方式

---

### 原则 3：open-ended answer 采用受记忆约束的自然生成

开放式建议、总结、规划类问题：

- 不做机械 fact dump
- 但仍要受 `profile / preference / relationship` 约束
- 既自然，也不丢边界

---

### 原则 4：same-thread continuation 优先当前线程

对于模糊追问、短继续、轻承接类输入：

- 优先延续当前 thread 局部上下文
- 优先级应高于 distant memory fallback

---

### 原则 5：当前轮主语言优先

在 mixed-language 场景下：

- 当前轮最后一条用户消息的主语言优先级最高
- 命中 memory 后也不能因此漂到另一种语言

---

## 17. 与知识层的边界

当前必须明确：

- Memory 回答“关于你 / 关于你们关系 / 关于你的长期目标”
- Knowledge 回答“文档事实 / 外部资料 / 专业知识”

判断标准：

- “你是谁 / 你喜欢什么 / 我们怎么互动” -> Memory
- “某份资料里写了什么 / 某个事实是什么” -> Knowledge

当前阶段：

- 知识层只做兼容预留
- 不做上传页、索引页、知识后台、知识引用系统
- 不把知识内容混入 `profile / preference / relationship / goal`

---

## 18. 与 thread state 的边界

thread state 回答的是：

> 当前这条 thread 处在什么状态

而长期记忆回答的是：

> 跨 thread 长期记得什么

因此：

- `thread_local` 不是长期记忆主干
- 正式 thread compaction 当前不进入实现期
- 当前只保留弱替代物与 observation

弱替代物包括：

- same-thread continuation
- fuzzy follow-up 优先当前线程
- recent raw turns
- drift observation

当前判断：

- Layer D 已进入观察期
- 但尚未进入正式实现期

---

## 19. 当前阶段建议支持的最小键集合

当前建议优先固化以下 single-slot：

- `profile.profession`
- `preference.reply_language`
- `relationship.agent_nickname`
- `relationship.user_preferred_name`
- `relationship.user_address_style`

后续可再逐步增加，但不建议一开始拉太宽。

---

## 20. 当前阶段不建议做的事

- 提前重做 narrative memory
- 提前做大而全 knowledge layer
- 提前实现正式 thread compaction
- 为世界层提前重构 memory data model
- 引入 automatic merge / rewrite
- 把 thread-local agreement 混成长记忆主面板
- 为未来多 Agent 提前把 contract 做得过重

---

## 21. 当前实现映射与差距

当前记忆层并不是从零开始，已经有一部分 contract 和数据形态落在现有实现中。

---

### 21.1 当前已具备的部分

#### A. Memory v2 基础类型已落在代码中

当前代码中已经存在以下基础类型与 helper：

- `MemoryCategory`
- `MemoryScope`
- `MemoryStability`
- `MemoryStatus`
- `SupportedSingleSlotKey`
- `normalizeSingleSlotValue`
- `canTransitionMemoryStatus`
- `isMemoryScopeValid`

这说明：

- `category / scope / stability / status` 四组核心 contract 已经进入可执行代码
- single-slot 的最小键集合也已经开始收口

---

#### B. 当前已支持的最小 single-slot 集合

当前代码已明确支持：

- `profile.profession`
- `preference.reply_language`
- `relationship.agent_nickname`
- `relationship.user_preferred_name`
- `relationship.user_address_style`

这与本文档建议的当前阶段最小键集合是一致的。

---

#### C. 数据表已具备 Memory v2 record shape 的主体字段

当前 `memory_items` 已从早期 shape 逐步扩展到接近 Memory v2：

已具备：

- `category`
- `key`
- `value`
- `scope`
- `subject_user_id`
- `target_agent_id`
- `target_thread_id`
- `stability`
- `status`
- `source_refs`
- `last_used_at`
- `last_confirmed_at`

这说明：

- 数据层已经有了承接 Memory v2 的基础形状
- 当前主要差距不在“有没有字段”，而在“模块边界与调用面是否清晰”

---

#### D. role 与 session 也已有现实落点

当前实现中，role 与 session 的基础承载并不是空白：

- `agents` 表已经承载基础 `role profile` 信息
- `threads / messages` 表已经承载 session 与 recent turns

这意味着本文档提出的 `role-memory-session` 协作面，当前已经有底层存储抓手，而不是纸面概念。

---

### 21.2 当前仍然存在的差距

#### A. contract 已有，但模块边界仍混在 `apps/web/lib/chat`

当前 memory contract 的主要问题不是“没定义”，而是：

- 虽然已开始拆分，但核心实现仍暂时挂在 `apps/web/lib/chat`
- recall / write / shared / compatibility 现在已有分层，但还没有全部沉成独立 package
- 只有纯 contract 部分已开始进入 `packages/core/memory`

因此当前最需要补的不是再发明 schema，而是：

- 清晰接口
- 清晰依赖方向
- 清晰 runtime 调用面

---

#### B. `RoleProfile` 还没有独立 contract 文档化

虽然 `agents` 表已经承载了 persona / style / prompt 信息，但当前仍缺：

- 独立的 `RoleProfile` 最小结构文档
- `role_core_packet` 与 agent profile 的关系说明
- role 与 relationship memory 的优先级定义

这会直接影响 runtime 如何稳定组装上下文。

---

#### C. `MemoryRecallResult` 仍偏隐式

当前代码里 recall 已经在发生，而且 runtime 已开始通过统一入口消费它，但 recall 结果仍更多表现为：

- runtime 内部上下文对象的一部分
- recall helper 的组合结果
- 仍未完全上升为独立 package 级 contract

也就是说，问题已经不再是“完全隐式”，而是“已开始收口，但尚未彻底独立化”。

这会影响：

- runtime 输出的稳定性
- 后续 IM adapter 对 debug / fidelity 的消费
- eval 和可解释性的统一表达

---

#### D. thread-local 与正式 thread state 还没有清晰分层

当前已经有：

- same-thread continuation
- recent raw turns
- fuzzy follow-up 优先当前线程

但还没有：

- 正式 `thread_state` contract
- 正式 thread compaction 层

当前判断仍然是：

- 继续观察
- 不抢先实现
- 但在文档里明确它和长期记忆的分工

---

### 21.3 当前代码与本文档的对齐结论

如果从“是否已有基础”来看：

- Layer A：已有基础 profile / persona 承载，但 contract 仍需独立化
- Layer B：是当前最成熟主干，Memory v2 已基本落形
- Layer D：只在弱替代物阶段，尚未进入实现期

因此，当前最合理的工程动作不是重写记忆层，而是：

1. 固化文档中的最小 contract
2. 把现有实现映射到这些 contract
3. 逐步把稳定部分从 `apps/web/lib/chat` 抽到 core 落点

---

### 21.4 当前代码文件映射

为了避免后续拆分时继续凭感觉判断，当前建议对现有几个关键文件做如下映射：

#### A. `apps/web/lib/chat/memory-v2.ts`

当前角色：

- Memory v2 contract helper
- 结构化字段归一与状态规则 helper
- 最适合最先迁入 `packages/core/memory`

当前主要承载：

- `MemoryCategory / MemoryScope / MemoryStability / MemoryStatus`
- single-slot key 集合
- status transition 规则
- scope validity 校验
- normalization
- `buildMemoryV2Fields`

建议后续归属：

- `packages/core/memory/types`
- `packages/core/memory/contracts`
- `packages/core/memory/normalization`

当前判断：

- 这是现有实现里最接近“纯 core contract”的文件
- 应优先从 `apps/web` 抽离

---

#### B. `apps/web/lib/chat/memory.ts`

当前角色：

- memory layer 的兼容入口
- 当前主要承担 re-export，而不再承载完整混合实现

当前主要承载：

- 对现有调用方保持稳定 import 路径
- 把 recall 能力继续暴露给 runtime
- 把 write 能力继续暴露给 action / caller

建议后续拆分方向：

- 保持为兼容入口，直到调用方全面改完
- 后续逐步退化为更薄的 facade 或删除

当前判断：

- 它原本最混，但当前第一轮拆分已经完成
- 现在已经不适合作为“核心实现文件”理解，而更适合作为“兼容门面”理解

---

#### C. `apps/web/lib/chat/memory-shared.ts`

当前角色：

- memory 的共享纯 helper / 类型层
- 承载 recall 与 write-path 共用的去重、归一化、评分和基础类型

当前主要承载：

- `StoredMemory / MemoryWriteOutcome / MemoryUsageType`
- `normalizeMemoryContent`
- `isNearDuplicateMemory`
- `shouldPreferIncomingMemory`
- `coalesceCandidates`
- `scoreMemoryRelevance`

当前判断：

- 这是从原 `memory.ts` 中切出来的第一层“纯 shared” 落点
- 为 recall / write-path 解耦提供了明显收益

---

#### D. `apps/web/lib/chat/memory-recall.ts`

当前角色：

- recall 查询与 runtime memory context 组装层
- runtime 当前消费记忆能力的主要统一入口

当前主要承载：

- `recallRelevantMemories`
- relationship recall helper
- `loadRuntimeMemoryContext(...)`

当前判断：

- runtime 已不再自行分散调用多处 recall helper
- 这使 memory 对 runtime 的消费边界开始稳定下来

---

#### E. `apps/web/lib/chat/memory-write.ts`

当前角色：

- memory write-path 与 planner / executor 过渡层

当前主要承载：

- `planMemoryWriteRequests(...)`
- `executeMemoryWriteRequests(...)`
- `storeRelationshipMemories(...)`
- `upsertSingleSlotMemory(...)`

当前判断：

- `profile / preference` 已形成 planner -> executor 的最小闭环
- relationship memory 仍单独保留，不强行混入通用 planner
- 这是当前阶段非常合理的过渡结构

---

#### F. `apps/web/lib/chat/runtime.ts`

当前角色：

- runtime 主流程候选
- 同时混入了 answer strategy、relationship style、thread continuity、role core 组装等逻辑

与 memory layer 相关的部分主要包括：

- role core packet 组装
- recall prompt 组装
- thread continuity 与 memory priority 协调
- recall 命中后的回答策略兑现
- `memory_write_requests / follow_up_requests / runtime_events` 的最小输出组装

建议后续边界：

- runtime 保留：
  - orchestration
  - role / memory / session 协作
  - output 组装
- memory 迁出：
  - recall contract
  - write contract
  - memory-specific normalization / slot logic

当前判断：

- 这不是 memory 文件
- 但它仍是记忆兑现逻辑当前最重要的消费方
- 当前它已开始消费统一 `runtimeMemoryContext`，并显式产出 `memory_write_requests`
- 因此 memory layer 文档必须继续反向指导 runtime 怎么收口

---

#### D. 当前最推荐的迁移优先级

如果按“低风险、高收益”排序，建议：

1. 先迁 `memory-v2.ts` 的纯 contract 部分
2. 再拆 `memory.ts` 中的 `shared / recall / write` 主干
3. 让 `runtime.ts` 改为消费统一 `runtimeMemoryContext` 与显式输出对象
4. 再逐步把 `memory-recall / memory-write / memory-shared` 向 core 落点推进

这会比先动 runtime 主文件更稳。

---

## 22. 当前推荐的实现顺序

### Step 1：固化 Role Core 最小 contract

明确：

- `RoleProfile`
- `role_core_packet` 最小字段集合
- role 与 relationship memory 的优先级边界

### Step 2：固化 Memory v2 record shape

明确：

- ontology
- scope
- status
- single-slot replacement
- normalization
- correction / restore / superseded

### Step 3：固化 Recall Contract

明确：

- structured recall path
- semantic recall path
- recall priority
- answer fidelity constraints

### Step 4：明确 session / thread 的协作边界

明确：

- thread_local 只作为局部层
- recent raw turns 与 long-term memory 的分工
- 当前不进入正式 Layer D 实现

### Step 5：对齐 runtime 调用面

确保 runtime 能稳定消费：

- `RoleProfile`
- `MemoryRecallQuery`
- `MemoryRecallResult`
- `MemoryWriteRequest`

---

## 23. 当前阶段 DoD

memory layer 在当前阶段可视为“基本定形”，至少应满足：

- `RoleProfile`、`MemoryRecord`、`MemoryWriteRequest`、`MemoryRecallQuery`、`MemoryRecallResult` 的最小结构已明确
- `profile / preference / relationship / goal` ontology 已固定
- `user_global / user_agent / thread_local` scope 规则已固定
- `active / hidden / incorrect / superseded` 状态语义已固定
- `relationship.agent_nickname` 的写入、替换、召回、纠错路径已跑通
- runtime 能通过标准接口消费 recall result，而不是直接耦合散乱 helper
- 知识层与 thread state 的当前阶段边界已明确

---

## 24. 当前结论

当前阶段的 memory layer 不应被理解成一个“单独的记忆数据库模块”，而应被理解为：

**single-agent runtime 中负责长期连续性、关系一致性与可解释纠错的核心能力层。**

它真正要做稳的不是“存更多”，而是：

- 记忆 contract 稳
- 与 role 的关系稳
- 与 session 的边界稳
- 在回答中的兑现稳

先把这一层做稳，SparkCore 的“记得住 + 有人味”才会真正成立。
