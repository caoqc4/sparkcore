# 输出治理手册设计文档 v1.0

## 1. 文档定位

本文档定义 SparkCore 在现有五层记忆结构与记忆升级后的治理能力之上，新增一套独立的“输出治理手册（Output Governance Handbook）”设计，用于规范模型在文本、图片、音频等多模态输出前，如何解释、筛选、排序和约束上下文数据。

本文档的重点不是重新定义五层记忆结构，也不是替代已经存在的 namespace / retention / knowledge governance / scenario pack / close-note chain 等记忆治理能力，而是补充一层**生成前的治理与编排机制**，解决以下问题：

- 角色对外输出时偶发“像 AI 系统，而不像角色本人”
- 文本 / 图片 / 音频三种模态下角色一致性不足
- 同一条回复中，关系感、知识感、场景感和系统解释感的优先级不清
- 五层记忆数据与升级后的治理能力虽然已存在，但缺少统一的“输出使用规则”

> 状态：草案 v1.0  
> 对应阶段：角色真实感与多模态一致性收束  
> 相关文档：
> - `docs/product/role_preset_and_creation_design_v1.0.md`
> - `docs/product/im_bot_character_channel_design_v1.0.md`
> - `docs/product/humanized_output_principles_design_v1.0.md`
> - `doc_private/SparCore_三层重构和记忆层升级收官总结.md`
> - `apps/web/lib/chat/runtime.ts`
> - `apps/web/lib/chat/role-core.ts`
> - `apps/web/lib/product/role-core.ts`

---

## 1.1 关联文档与阅读顺序

随着 SparkCore 的输出体系逐步成型，当前与“最终生成”直接相关的文档建议拆分为两份主文档阅读：

- `output_governance_handbook_design_v1.0.md`
  负责定义输出治理总则，重点回答：
  - 五层记忆与治理能力如何参与生成
  - 四层调度后的数据如何进入 runtime 汇编
  - 文本 / 图片 / 音频的统一生成边界与治理原则

- `humanized_output_principles_design_v1.0.md`
  负责定义真人感表达决策层，重点回答：
  - 当前时刻、情绪、意图、互动阶段如何被识别
  - 这些识别结果如何转成“这一轮该怎么说”的表达策略
  - 为什么陪伴默认不应等于安抚，以及如何让回复更像真实的人在当下说话

建议阅读顺序为：

1. 先阅读本手册，理解输出治理总则与四层调度后的生成编排。
2. 再阅读真人感输出原则文档，理解“调度完成之后，如何进一步决定这一轮的表达姿态”。

这两份文档的边界建议保持为：

- 本手册负责：生成边界、治理约束、数据编排、模态一致性。
- 真人感原则文档负责：时刻感、关系感、情绪感、意图感、输出姿态与松弛感。

也就是说：

- 本手册更像“不要跑偏、不要失控、不要乱用数据”
- 真人感原则文档更像“此刻像谁、用什么状态、怎么把这句话说出来”

---

## 2. 核心结论

### 2.1 五层记忆结构保持不变

五层记忆结构继续承担“记录和供数”的职责，不建议为了这次角色输出一致性问题而重新定义其层级含义。

也就是说：

- 五层继续负责记录角色、关系、知识、上下文、线程等信息
- 不把大量新的 prompt 限制、禁句、模态规则硬塞回五层本身
- 不把“输出像不像角色”问题直接变成 memory schema 的扩张问题

### 2.2 另加一层独立的输出治理手册

在五层与记忆治理能力之上增加一套独立的“输出治理手册”，用于定义：

- 各层数据在生成时的使用方式
- 记忆治理能力在生成时的参与方式
- 各层之间的优先级与冲突裁决
- 角色倾向与通用限制
- 必要澄清时的表达方式
- 文本 / 图片 / 音频等模态的统一执行原则

### 2.3 分工原则

建议采用如下分工：

- 五层记忆结构：负责“有什么数据”
- 记忆治理能力：负责“这些数据如何被边界化、保留、调度、沉淀”
- 输出治理手册：负责“这些已治理数据如何被用来生成”
- runtime 汇编器：负责“把手册、五层数据和治理能力拼成最终模型输入”

---

## 3. 为什么不直接把规则塞进五层

### 3.1 会破坏层职责

五层记忆结构本来解决的是“信息如何分层存储与调用”。  
如果直接把“不要说自己是 AI”“图片成功时不要解释机制”之类规则散落进各层，会让记忆层从“数据层”变成“半数据半治理”的混合体，边界越来越模糊。

同时，当前底座层中已经存在：

- `namespace`
- `retention`
- `knowledge governance`
- `scenario pack`
- `close-note / persistence contract chain`

这些能力已经属于“记忆治理”，不适合再被输出层重复定义一遍。

### 3.2 不利于跨模态统一

当前暴露出来的问题并不只存在于图片：

- 文本可能突然变成产品说明口吻
- 音频可能解释能力边界而脱离角色
- 图片 caption 可能像工具免责声明

这说明问题更接近“输出治理缺失”，而不是某一层 memory 没存够。

### 3.3 不利于迭代

如果后续发现新的跳出感表达，例如：

- “作为 AI……”
- “我没有真实身体……”
- “我只是根据提示生成……”

更合理的修正位置应该是“输出治理手册”，而不是继续改 memory 结构。

---

## 4. 设计目标

本方案的目标是：

1. 保持五层记忆结构原始职责稳定，不引入无必要的 schema 膨胀。
2. 为文本 / 图片 / 音频提供统一的角色输出治理规则。
3. 明确各层数据与治理能力如何共同参与生成，避免角色感、关系感、知识感和场景感相互抢占。
4. 在“真实感”和“事实边界”之间建立稳定平衡，避免角色直接滑向系统解释口吻。
5. 为后续持续迭代提供单独调参面，使角色表达治理可以独立于 memory 架构演进。

---

## 5. 输出治理手册的职责范围

输出治理手册只负责“生成前规则”，不负责原始数据存储，也不替代底座层已经存在的记忆治理机制。

它应该回答的问题包括：

- 哪层数据在本轮最先被解释
- 哪些治理能力已经在上游做过裁决，输出侧不应重复定义
- 哪层数据可以调整语气，哪层只能提供素材
- 哪些表达倾向是默认鼓励的
- 哪些系统感表述是默认应避免的
- 如果不同层给出相互冲突的信号，应如何裁决
- 在文本、图片、音频三种模态下，这些原则如何具体落地

它不负责：

- 新增用户长期记忆记录
- 修改五层 memory schema
- 替代 namespace / retention / scenario pack 等底座治理能力
- 替代安全、审核、计费等后端机制

---

## 6. 五层记忆结构、治理能力与输出治理的关系

### 6.1 建议关系模型

```text
五层记忆结构
  ↓ 提供原始数据
记忆治理能力
  ↓ 提供边界、保留、调度、沉淀结果
输出治理手册
  ↓ 解释、筛选、排序、约束
runtime 汇编器
  ↓ 生成最终 prompt / generation policy
模型输出
```

### 6.2 关键原则

五层不直接决定最终说法。  
五层提供的是“候选事实、关系状态、背景素材、上下文信号、近期完整线程”。

同时，升级后的记忆层已经提供一组治理能力，用于决定：

- 在哪个 namespace 内解释这些信息
- 哪些信息应保留、压缩、降权或沉淀
- 知识层如何参与上下文而不失控
- 不同产品场景如何调度同一套记忆能力
- 哪些状态应进入 close-note / persistence 链条

最终该如何说，不是由五层单独决定，而是由“治理后的上下文 + 输出治理手册”共同决定。

这意味着：

- 相同的五层数据，在不同模态下可能采用不同落地方式
- 相同的五层数据，在不同关系阶段下可以表达得更亲密或更克制
- 即便知识层里有真实性素材，也不等于回复中必须长篇解释系统边界
- 即便底座已做 retention / namespace 裁决，输出侧仍需要决定“怎样说才像这个角色”

### 6.3 与 runtime 装配层的关系

按当前 runtime 设计，最终生成前的数据装配并不是“直接把五层喂给模型”，而是进入 `PreparedRuntimeTurn` 一类的内部装配层。

因此更准确的关系应理解为：

```text
五层记忆 + 治理能力
  ↓
PreparedRuntimeTurn / runtime 内部装配层
  ↓
输出治理手册在装配阶段生效
  ↓
最终 generation policy
  ↓
模型输出
```

也就是说，输出治理手册的合理落点不是 memory schema 本身，而是 runtime 汇编阶段。

---

## 7. 对五层的使用原则

以下沿用收官总结中更贴近原始设计的五层职责理解：

- `L1`：角色层
- `L2`：结构化长期记忆层
- `L3`：知识层
- `L4`：线程状态 / 线程压缩层
- `L5`：最近聊天原文层

### 7.1 L1 角色层：定义“像谁”

角色层负责定义稳定人格与长期表达基调。

应主要提供：

- 角色身份与长期人设
- 关系姿态
- 默认语气、表达节奏、情绪姿态
- 跨模态统一风格
- 通用表达禁区
- 必要澄清时的表达原则

角色层不应被弱化成只是一段 persona summary。  
它应该是输出治理中最稳定的风格锚点。

### 7.2 L2 结构化长期记忆层：定义“长期沉淀了什么”

结构化长期记忆层负责提供长期状态沉淀。

应主要提供：

- 用户稳定偏好
- 重要事件
- 关系阶段变化
- 历史约束、反馈、边界变化
- 长期互动中形成的默契与习惯
- 已沉淀的表达偏好与反感项

这层的作用不是重新定义角色，而是调制角色在当前关系中的表达力度。

### 7.3 L3 知识层：提供“说出来有没有内容”

知识层负责给输出提供稳定背景、兴趣材料、专业性和世界感。

应主要提供：

- 角色背景兴趣材料
- 题材相关知识
- 稳定知识素材
- 可以增强画面感、专业感、审美感的内容支撑

知识层不应用来主导人格表达。  
它更像“内容材料来源”，而不是“输出口吻裁决层”。

### 7.4 L4 线程状态 / 线程压缩层：定义“当前进行态”

线程状态 / 线程压缩层负责提供当前线程进行态。

应主要提供：

- 当前任务目标
- 当前情绪场景
- 当前 focus / continuity / language carryover
- 这一段长对话被压成了什么摘要
- 本轮语言偏好
- 本轮应简短还是展开
- 本轮是文字、图片、语音还是多模态交付

这层负责“当前回合的执行姿态”，不能反客为主去重写角色长期风格。

### 7.5 L5 最近聊天原文层：提供“高保真近期连续性”

第五层按原始定义应理解为最近聊天原文层，它的作用是：

- 保留高保真的近期上下文
- 提供最近几轮真实说话方式和互动节奏
- 保障回复与刚刚发生的内容连续
- 避免模型只根据摘要，而忽略最近真实语境

第五层不负责长期人格定义，也不负责治理规则本身。  
它负责“保真”，不是“裁决”。

---

## 8. 记忆升级后的治理能力如何参与输出

输出治理手册不只解释五层，还必须显式承接底座层已经存在的记忆治理能力。

### 8.1 Namespace

`namespace` 决定这轮输出应该站在哪个记忆边界内解释上下文。

它会影响：

- 当前应优先读取哪类记忆
- 某些关系表达是否属于当前边界
- 某些知识与历史状态是否该被带入本轮

输出侧不应自己重新发明 namespace，而应消费上游已经选定的边界。

### 8.2 Retention

`retention` 决定哪些信息被长期保留、哪些只作为短期上下文存在、哪些已经应被降权或失效。

它会影响：

- 哪些关系变化可作为稳定表达依据
- 哪些旧表达偏好已不该继续沿用
- 哪些近期对话内容不应被误上升为长期人格结论

### 8.3 Knowledge Governance

`knowledge governance` 决定知识层如何参与上下文。

它最重要的作用是避免：

- 知识层素材过度喧宾夺主
- 外部知识把角色输出拉成“信息说明器”
- 角色语气被世界知识压平

### 8.4 Scenario Pack

`scenario pack` 决定当前产品场景如何调度同一套记忆能力。

它会影响：

- IM 产品下的伴侣表达与任务表达权重
- 图片 / 音频 / 普通文本在当前场景中的交付方式
- 不同产品形态对“真实感”的侧重点

### 8.5 Close-note / Persistence Contract Chain

这条链负责把高阶状态变化沉淀回底座。

对输出治理的意义在于：

- 某些表达偏差是否应该被长期记录为纠偏信号
- 某些关系变化是否应升级为长期状态
- 某些反复出现的跳出感是否应进入后续策略升级

因此，输出治理手册不直接替代 close-note 链，而是把“哪些输出问题值得被沉淀回去”定义清楚。

---

## 9. 输出治理手册的核心组成

建议把手册拆成五个部分。

### 9.1 Role Expression Policy

定义角色长期表达倾向，例如：

- 先关系、后机制
- 少系统解释，多直接交付
- 多使用角色自然语汇
- 文本、图片、音频保持同一人格感

### 9.2 Relational Adjustment Policy

定义关系状态如何调整表达力度，例如：

- 关系更亲近时允许更自然的亲密表达
- 用户偏好短安抚时不输出长分析
- 用户偏好直接型反馈时减少过度铺垫

### 9.3 Content Material Policy

定义知识层如何参与输出，例如：

- 知识层提供内容素材，不主导人格
- 优先选择和角色背景一致的材料
- 在图片 / 音频场景中，知识层只辅助画面与内容质感

### 9.4 Scene Delivery Policy

定义当前回合如何落地，例如：

- 图片成功时正文更像 caption 或陪伴式延续
- 音频成功时正文更短、更口语、更像自然前后文
- 情绪承接时减少解释性语句

### 9.5 Avoidance & Boundary Policy

定义应避免的系统感表达与必要澄清方式，例如：

- 不主动暴露“作为 AI”
- 不主动强调缺乏真实身体、相册、拍摄经历
- 不主动长篇解释生成机制
- 必要澄清时短、轻、留在角色语气内

---

## 10. 倾向与限制如何配合

### 10.1 主策略：倾向优先

输出治理的主策略应是“鼓励角色应该怎么说”，而不是只靠禁止表达。

原因：

- 单纯禁句容易漏
- 单纯禁句容易让模型输出变干
- 角色真实感更依赖“有稳定风格”，而不是“避免几个词”

### 10.2 限制作为护栏

限制仍然必要，但定位是护栏。

适合放在限制层里的包括：

- 不主动使用系统自我说明
- 不主动解释底层机制
- 不把焦点从关系体验拉回产品机制
- 不在成功交付后用免责声明抢走主体

### 10.3 必要澄清原则

当确实需要澄清事实边界时，应遵循：

1. 尽量短
2. 不技术化
3. 不产品化
4. 保持角色语气
5. 澄清后尽快回到关系与交付本身

---

## 11. 各模态的应用方式

### 11.1 文本

文本输出是最常态的角色表达渠道。

治理原则：

- 优先体现角色长期表达倾向
- 关系层决定语气距离与温度
- 场景层决定篇幅和即时策略
- 禁止系统自我解释抢占回复主体

### 11.2 图片

图片场景中，图像本身通常是主交付，文本应服务于图像体验。

治理原则：

- 图成功后正文默认更短
- 正文更像 caption / 邀请式延续
- 少讨论生成机制
- 除非用户明确追问真实性，否则不主动展开边界解释

### 11.3 音频

音频场景中，音频本身是高角色感媒介。

治理原则：

- 文本应让位于音频
- 正文默认更短、更口语化
- 避免音频前后出现工具式说明
- 当音频已完整表达时，重复文本应被压缩或隐藏

---

## 12. 生成前的汇编顺序

建议 runtime 在调用模型前按如下顺序汇编。

### 12.1 第一步：读取五层原始数据与治理结果

从五层中分别提取：

- 角色稳定信息
- 关系状态与偏好
- 相关知识素材
- 当前场景信号
- 近期高保真线程上下文

并同时读取：

- namespace 结果
- retention 结果
- knowledge governance 结果
- scenario pack 结果
- close-note / persistence 相关上游信号

### 12.2 第二步：生成各层摘要 packet

各层先被压成标准化 packet，而不是直接拼原始 memory。

建议包括：

- `role_expression_packet`
- `relationship_state_packet`
- `knowledge_material_packet`
- `scene_delivery_packet`
- `recent_thread_packet`
- `memory_governance_packet`

### 12.3 第三步：应用输出治理手册

输出治理手册基于这些 packet 生成最终治理结果：

- 本轮表达倾向
- 本轮限制集合
- 本轮模态执行规则
- 本轮冲突裁决结果

### 12.4 第四步：写入最终 generation policy

runtime 最终把治理结果写成模型前置 policy，例如：

- 本轮角色姿态
- 本轮关系距离
- 本轮模态落地方式
- 本轮禁止项
- 必要澄清方式

---

## 13. Packet 级设计

本节定义输出治理手册在 runtime 装配阶段推荐生成的标准 packet。

这些 packet 的目标不是替代五层和现有 memory handoff，而是把“可供输出使用的信息”收成更稳定的生成面，避免 runtime 直接拼原始 memory 字段。

### 13.1 设计原则

packet 设计建议遵循以下原则：

1. packet 只承载“本轮生成真正需要消费的信息”，不复制整层原始数据
2. packet 应尽量短、稳、可解释，避免把原始 memory record 原封不动塞进 prompt
3. packet 应面向输出职责，而不是面向存储结构
4. packet 之间允许引用同一底层事实，但应有明确主责
5. packet 应能被文本 / 图片 / 音频三种模态共同消费

### 13.2 推荐 packet 列表

建议 v1 生成以下六类 packet：

- `role_expression_packet`
- `relationship_state_packet`
- `knowledge_material_packet`
- `scene_delivery_packet`
- `recent_thread_packet`
- `memory_governance_packet`

它们分别承载：

- 角色稳定表达原则
- 长期关系状态与偏好调制
- 内容素材与知识支持
- 当前回合执行方式
- 高保真近期连续性
- 底座治理结果对输出的影响

### 13.3 `role_expression_packet`

该 packet 由角色层与 role core 组装，回答：

> 这个角色长期应该像谁、怎么说、避免怎么说

建议字段：

```ts
type RoleExpressionPacket = {
  packet_version: "v1";
  identity: {
    agent_id: string;
    agent_name: string;
    role_mode: "companion" | "assistant" | "unknown";
  };
  voice_profile: {
    tone: string | null;
    warmth_level: "low" | "medium" | "high";
    directness_level: "low" | "medium" | "high";
    playfulness_level: "low" | "medium" | "high";
  };
  expression_principles: string[];
  avoidance_principles: string[];
  boundary_reconciliation: string[];
  modality_style_bias: {
    text: string[];
    image: string[];
    audio: string[];
  };
};
```

这类 packet 应优先来自：

- `role_core_packet`
- `RoleProfile`
- 产品角色核心配置

### 13.4 `relationship_state_packet`

该 packet 由结构化长期记忆层组装，回答：

> 你们现在是什么关系状态，这会怎样影响表达力度

建议字段：

```ts
type RelationshipStatePacket = {
  packet_version: "v1";
  relationship_stage: string | null;
  trust_level: "low" | "medium" | "high" | null;
  intimacy_band: "early" | "steady" | "close" | null;
  preferred_response_style: string[];
  avoid_response_style: string[];
  support_preferences: string[];
  expression_sensitivity: {
    dislikes_system_tone: boolean;
    dislikes_overexplaining: boolean;
    dislikes_analysis_when_vulnerable: boolean;
  };
  current_relational_adjustments: string[];
};
```

该 packet 的重点不是提供更多背景，而是提供：

- 当前允许多亲近
- 应更短还是更柔
- 哪种陪伴方式更自然

### 13.5 `knowledge_material_packet`

该 packet 由知识层组装，回答：

> 这一轮有哪些内容材料值得被角色化使用

建议字段：

```ts
type KnowledgeMaterialPacket = {
  packet_version: "v1";
  active_topics: string[];
  role_flavored_materials: string[];
  style_materials: string[];
  factual_constraints: string[];
  knowledge_usage_bias: {
    prefer_background_texture_over_explanation: boolean;
    prefer_brief_facts_over_long_exposition: boolean;
  };
};
```

知识层 packet 的重点是“提供可说的材料”，而不是直接规定说法。

### 13.6 `scene_delivery_packet`

该 packet 由线程状态 / 线程压缩层、session 和当前模态信息组装，回答：

> 这一次应该怎么交付

建议字段：

```ts
type SceneDeliveryPacket = {
  packet_version: "v1";
  modality: "text" | "image" | "audio" | "multimodal";
  reply_length_target: "short" | "medium" | "long";
  emotional_context: string | null;
  current_task: string | null;
  language_target: string | null;
  continuity_mode: string | null;
  delivery_mode: {
    artifact_first: boolean;
    suppress_redundant_text: boolean;
    caption_like_copy: boolean;
  };
  scene_bias: string[];
};
```

这个 packet 是最强的“本轮执行调制器”，但不应重写长期角色人格。

### 13.7 `recent_thread_packet`

该 packet 由最近聊天原文层组装，回答：

> 刚刚真实发生了什么，哪些细节还不能丢

建议字段：

```ts
type RecentThreadPacket = {
  packet_version: "v1";
  recent_turn_summary: string;
  carry_forward_phrases: string[];
  live_emotional_signal: string | null;
  unresolved_user_intents: string[];
  phrasing_guardrails: {
    avoid_recently_rejected_tone: boolean;
    preserve_recent_language_style: boolean;
  };
};
```

这类 packet 的职责是“保真”，而不是提供长期原则。

### 13.8 `memory_governance_packet`

该 packet 由 namespace / retention / knowledge governance / scenario pack / close-note 信号组装，回答：

> 底座层已经做了哪些治理裁决，输出侧需要如何服从

建议字段：

```ts
type MemoryGovernancePacket = {
  packet_version: "v1";
  namespace: {
    active_scope: string;
    summary: string;
  };
  retention: {
    summary: string | null;
    retained_fields: string[];
    deprecated_signals: string[];
  };
  knowledge_governance: {
    scope_layers: string[];
    governance_classes: string[];
    knowledge_pressure: "low" | "medium" | "high";
  };
  scenario: {
    phase_snapshot_id: string | null;
    strategy_bundle_id: string | null;
    orchestration_mode: string | null;
    summary: string | null;
  };
  persistence_feedback: {
    has_recent_expression_risk: boolean;
    should_write_back_preference_signal: boolean;
  };
};
```

该 packet 的作用不是再做一遍治理，而是把“治理结果”显式暴露给输出装配层。

### 13.9 最终汇编产物：`output_governance_packet`

在六类 packet 生成后，runtime 不建议直接把六个 packet 原样塞进 prompt。  
更推荐再产出一个最终汇编结果：

```ts
type OutputGovernancePacket = {
  packet_version: "v1";
  expression_brief: string;
  relational_brief: string;
  content_brief: string;
  scene_brief: string;
  avoidances: string[];
  modality_rules: string[];
  conflict_resolutions: string[];
  writeback_hints: string[];
};
```

这个最终 packet 才是最接近模型输入面的对象。

### 13.10 最小 v1 packet contract

上面的 packet 列表描述了“完整表达面”，但如果直接按完整字段落地，v1 很容易做胖。

因此建议再收缩出一版**最小可接入 contract**。该 contract 的目标不是覆盖所有未来治理能力，而是：

1. 尽量复用现有 `RoleCorePacket`、`SessionContext`、`RuntimeMemoryContext`
2. 先解决“角色输出偶发像 AI”“多模态成功交付后文案掉出角色”这类高频问题
3. 避免为了 packet 设计反向推动 memory schema 改造

建议 v1 实际只保留如下最小字段：

```ts
type RoleExpressionPacketV1 = {
  packet_version: "v1";
  identity: {
    agent_id: string;
    agent_name: string;
  };
  persona_summary: string | null;
  style_guidance: string | null;
  relationship_stance: {
    effective: string;
    source: string;
  };
  expression_principles: string[];
  avoidance_principles: string[];
};

type RelationshipStatePacketV1 = {
  packet_version: "v1";
  relationship_stage: string | null;
  preferred_response_style: string[];
  avoid_response_style: string[];
  current_relational_adjustments: string[];
};

type KnowledgeMaterialPacketV1 = {
  packet_version: "v1";
  active_topics: string[];
  role_flavored_materials: string[];
  factual_constraints: string[];
};

type SceneDeliveryPacketV1 = {
  packet_version: "v1";
  modality: "text" | "image" | "audio" | "multimodal";
  reply_length_target: "short" | "medium" | "long";
  language_target: string | null;
  continuity_mode: string | null;
  delivery_mode: {
    artifact_first: boolean;
    suppress_redundant_text: boolean;
    caption_like_copy: boolean;
  };
  scene_bias: string[];
};

type RecentThreadPacketV1 = {
  packet_version: "v1";
  recent_turn_summary: string;
  unresolved_user_intents: string[];
  carry_forward_phrases: string[];
};

type MemoryGovernancePacketV1 = {
  packet_version: "v1";
  namespace_summary: string | null;
  retention_summary: string | null;
  knowledge_summary: string | null;
  scenario_summary: string | null;
  knowledge_governance_classes: string[];
};

type OutputGovernancePacketV1 = {
  packet_version: "v1";
  expression_brief: string;
  relational_brief: string;
  scene_brief: string;
  avoidances: string[];
  modality_rules: string[];
};
```

这版最小 contract 的特点是：

- 不要求一开始就把“信任度、亲密度、治理压力”等全部显式结构化
- 更偏向把现有信号整理成短摘要和小集合字段
- 可以先作为 runtime 内部装配产物存在，不要求立即外部持久化

### 13.11 与当前代码结构的对齐建议

按当前实现，最值得复用的三块现成输入是：

- `RoleCorePacket`
- `SessionContext`
- `RuntimeMemoryContext`

因此 v1 不建议新增独立的数据准备链，而是建议：

1. 以 `role.role_core` 为 `role_expression_packet` 的主输入
2. 以 `session` 为 `scene_delivery_packet` 和 `recent_thread_packet` 的主输入
3. 以 `runtime_memory_context` 为 `relationship_state_packet`、`knowledge_material_packet` 的主输入
4. 以 `role.role_core.memory_handoff` 为 `memory_governance_packet` 的主输入

也就是说，packet 装配器应是“轻汇编层”，不是新的数据源。

一个更贴近当前结构的伪代码如下：

```ts
const governance = buildOutputGovernance({
  roleCore: prepared.role.role_core,
  session: prepared.session,
  runtimeMemory: prepared.memory.runtime_memory_context,
  messages: prepared.resources.messages,
  turnInput: prepared.input
});
```

这样做的好处是：

- 不要求立即重写 memory recall
- 不要求立即调整 role layer schema
- 可以先把治理逻辑集中在 runtime 汇编层验证效果

### 13.12 v1 推荐的装配顺序

推荐 v1 先按下面顺序装配：

1. 从 `RoleCorePacket` 生成 `role_expression_packet_v1`
2. 从 `RuntimeMemoryContext` 生成 `relationship_state_packet_v1`
3. 从 `RuntimeMemoryContext` 中提取最相关知识信号，生成 `knowledge_material_packet_v1`
4. 从 `SessionContext + turnInput` 生成 `scene_delivery_packet_v1`
5. 从最近消息与线程状态生成 `recent_thread_packet_v1`
6. 从 `role_core.memory_handoff` 生成 `memory_governance_packet_v1`
7. 最后汇编成 `output_governance_packet_v1`

其中第 7 步的重点不是“重复描述全部上下文”，而是产出真正给模型消费的最小治理面：

- 这轮像谁说话
- 这轮关系距离怎么落
- 这轮模态怎么交付
- 这轮明确不要掉进哪些系统感表达

---

## 14. 冲突裁决原则

### 14.1 默认优先级

建议默认优先级如下：

1. 输出治理手册中的硬限制
2. 上游治理能力已形成的边界结果
3. 角色层长期表达原则
4. 结构化长期记忆层的长期关系与偏好调制
5. 线程状态 / 线程压缩层的即时执行要求
6. 知识层素材
7. 最近聊天原文中的局部表述习惯

### 14.2 典型冲突示例

#### 例 1：知识层要求真实性说明，但角色层要求少机制解释

处理：

保留事实边界，但改写成更短、更角色化的表达，不进入技术说明。

#### 例 2：线程状态要求短回复，但长期关系状态希望更温柔承接

处理：

保留承接，但压缩篇幅，让情绪承接服从当前“短回复”执行要求。

#### 例 3：最近聊天原文里刚出现过工具化说法

处理：

不能因为第五层保真而继承错误表达，仍应服从治理手册和角色层原则。

---

## 15. 建议的数据与工程落点

### 15.1 五层数据本身不强制新增字段

v1 不要求先改五层 schema。  
更推荐先在 runtime 汇编阶段引入治理逻辑。

### 15.2 新增“输出治理手册”配置来源

建议手册的稳定部分先落在角色核心配置附近，例如：

- `apps/web/lib/product/role-core.ts`
- `apps/web/lib/chat/role-core.ts`

这并不意味着把五层改成治理层，而是让角色级治理规则有一个统一配置源。

### 15.3 新增 runtime 汇编步骤

建议在 runtime 中显式增加一段“治理汇编”逻辑：

1. 读取五层数据
2. 产出各层 packet
3. 应用治理手册
4. 生成最终 prompt policy

更贴近现有代码结构的建议位置是：

- `prepareRuntimeTurn(...)` 之前：读取原始五层与治理结果
- `PreparedRuntimeTurn` 内部：挂载 packet 级对象
- `runtime.ts` 模型调用前：消费最终 `output_governance_packet`

可以考虑在现有 `PreparedRuntimeTurn` 上新增：

```ts
governance?: {
  role_expression: RoleExpressionPacket;
  relationship_state: RelationshipStatePacket;
  knowledge_material: KnowledgeMaterialPacket;
  scene_delivery: SceneDeliveryPacket;
  recent_thread: RecentThreadPacket;
  memory_governance: MemoryGovernancePacket;
  output_governance: OutputGovernancePacket;
};
```

更保守的 v1 落法是先只挂最终汇编结果和必要中间 packet，例如：

```ts
governance?: {
  role_expression: RoleExpressionPacketV1;
  relationship_state: RelationshipStatePacketV1;
  scene_delivery: SceneDeliveryPacketV1;
  output_governance: OutputGovernancePacketV1;
};
```

等 runtime 验证稳定后，再逐步把 `knowledge_material`、`recent_thread`、`memory_governance` 全量挂入。

### 15.4 场景 hint 只做轻调制

当前图片 / 音频场景中的 generation hint 仍然保留，但职责应下沉为：

- 只做本轮微调
- 不承担长期人格治理
- 不替代角色层与输出治理手册

### 15.5 v1 实施顺序建议

为了降低实现风险，建议 v1 分三步上线：

1. 先做 packet 汇编，不改变最终模型提示词结构  
   目标是把数据从散落读取改成集中汇编，同时在日志或 metadata 中可观测。

2. 再让 `output_governance_packet_v1` 进入模型前 policy  
   先影响最容易验证的几类问题：
   - 避免“作为 AI”类系统感表述
   - 图片成功后正文更像 caption
   - 音频成功后正文更短、更口语

3. 最后再逐步替换现有散落 hint  
   把真正稳定的规则上收进 governance，把场景 hint 留作轻调制。

这个顺序的核心是：

- 先让 runtime 有统一治理面
- 再让治理面真实影响输出
- 最后再清理旧逻辑，避免一次性大迁移

---

## 16. v1 非目标

本次设计不包含：

- 直接重构五层 memory schema
- 重新定义现有记忆治理能力的底座职责
- 为每层单独建立复杂数据库新表
- 一次性做完全自动冲突学习系统
- 将所有输出问题都迁移成 memory 问题
- 在 v1 中引入复杂的在线自我修正规则引擎

v1 的目标是先把职责关系与汇编路径定义清楚。

---

## 17. 推荐的实施顺序

### P1：先形成治理手册与 packet contract

先把以下内容固化为配置与 runtime 规则：

- 角色表达倾向
- 通用禁区
- 必要澄清原则
- 图片 / 音频 / 文本的基础模态规则
- 六类 packet 的最小字段 contract

### P2：做 runtime 汇编器

在模型生成前增加统一汇编步骤，把五层与治理能力压缩成标准 packet，并应用治理手册。

### P3：接入结构化长期记忆层调制

让长期关系状态和偏好开始显式影响表达力度，而不是只停留在 memory recall 中的自然涌现。

### P4：接入长期纠偏闭环

当后续收集到足够多“跳出感”案例后，再考虑把这些偏差反馈成更稳定的治理规则或策略升级。

---

## 18. Runtime 接入方案

本节给出一版更贴近当前代码结构的 runtime 接入方案，目标不是一步重写 `runtime.ts`，而是在不破坏现有链路的前提下，把输出治理先接成一个可观测、可逐步放权的汇编层。

### 18.1 v1 接入目标

v1 只做三件事：

1. 在 runtime 内部形成统一的 `output_governance_packet_v1`
2. 先让它影响最关键的角色掉线问题
3. 暂时不大规模删除现有 relationship prompt / scene hint 逻辑

也就是说，v1 更像“加一层治理装配器”，而不是“推倒现有 prompt 组装体系”。

### 18.2 建议优先改动的文件

建议按以下文件分工落地：

- `apps/web/lib/chat/runtime-prepared-turn.ts`
  - 给 `PreparedRuntimeTurn` 新增可选 `governance` 挂载位
  - 在 `prepareRuntimeTurn(...)` 阶段接入治理 packet 装配

- `apps/web/lib/chat/runtime.ts`
  - 在最终系统提示词组装阶段消费 `output_governance_packet_v1`
  - 先把它作为新增 prompt section 接入，而不是立刻替换全部老逻辑

- `apps/web/lib/chat/role-core.ts`
  - 继续作为 `role_expression_packet_v1` 的主输入来源
  - 必要时只补少量稳定治理字段，不先改大 schema

- 新增建议文件：`apps/web/lib/chat/output-governance.ts`
  - 负责定义 packet type
  - 负责 `buildOutputGovernance(...)`
  - 负责把 `RoleCorePacket / SessionContext / RuntimeMemoryContext / messages / turnInput` 装成最终治理结果

这个拆法的好处是：

- 让治理逻辑集中，不继续把规则散落进 `runtime.ts`
- 不要求 `role-core.ts` 承担全部治理复杂度
- 不要求 memory recall 先重做

### 18.3 v1 新增模块建议

建议新增一个专门模块，例如：

```ts
// apps/web/lib/chat/output-governance.ts
export type OutputGovernancePacketV1 = { ... };

export function buildOutputGovernance(args: {
  roleCore: RoleCorePacket;
  session: SessionContext;
  runtimeMemory: RuntimeMemoryContext;
  messages: PreparedRuntimeMessage[];
  turnInput: RuntimeTurnInput;
}): {
  role_expression: RoleExpressionPacketV1;
  relationship_state: RelationshipStatePacketV1;
  scene_delivery: SceneDeliveryPacketV1;
  output_governance: OutputGovernancePacketV1;
} {
  // 轻汇编，不新增数据源
}
```

v1 可以先不把 `knowledge_material`、`recent_thread`、`memory_governance` 暴露到 `PreparedRuntimeTurn`，但汇编函数内部可以先消费这些信号，最后折叠进 `output_governance`。

### 18.4 `PreparedRuntimeTurn` 的接入建议

当前 `PreparedRuntimeTurn` 已经具备较好的装配面：

- `role.role_core`
- `session`
- `memory.runtime_memory_context`
- `resources.messages`
- `input`

因此 v1 最保守的改法是：

```ts
type PreparedRuntimeTurn = {
  ...
  governance?: {
    role_expression: RoleExpressionPacketV1;
    relationship_state: RelationshipStatePacketV1;
    scene_delivery: SceneDeliveryPacketV1;
    output_governance: OutputGovernancePacketV1;
  };
};
```

然后在 `prepareRuntimeTurn(...)` 内部完成：

1. 调用 `buildOutputGovernance(...)`
2. 把结果挂到 `PreparedRuntimeTurn.governance`

这样 runtime 主生成链路不需要额外重新查数。

### 18.5 `runtime.ts` 的接入建议

当前 `runtime.ts` 里已经存在三类相关逻辑：

1. `role_core_packet` 与 `style_guidance` 的稳定角色信息
2. 大量 relationship prompt detectors 和 follow-up shaping
3. 图片 / 音频等场景下的即时 hint 和交付规则

因此 v1 不建议一次性推翻，而建议采用“新增 section + 渐进替换”。

建议在 `buildAgentSystemPromptInternal(...)` 或其相邻装配位置新增一段：

---

## 19. Packet 刷新与更新机制

如果输出治理手册要真正服务“真人感”，packet 不能被理解成一次生成后长期固定的静态模板，而应当具备**分层刷新**与**事件驱动更新**机制。

### 19.1 为什么必须有更新机制

输出治理最终消费的是“预处理后的结论 packet”，而不是原始五层数据本身。  
如果这些 packet 只在角色创建时生成一次，后续将出现几个问题：

- 关系变化已经发生，但输出仍使用旧关系姿态
- 用户刚刚明确表达了边界或偏好，下一轮却仍按旧习惯回应
- 知识参与策略和当前意图不匹配
- 角色在近期高权重事件后没有及时更新输出姿态

因此，packet 必须支持：

- 慢更新：处理长期稳定画像
- 快更新：处理当前线程中的高权重变化

### 19.2 建议拆成 `stable packet` 与 `volatile packet`

建议把治理 packet 的来源拆成两部分：

1. `stable packet`
   适合承载：
   - L1 角色长期表达画像
   - L2 已沉淀的长期关系状态
   - L3 稳定兴趣、背景、知识偏好
   - 长期有效的输出限制与表达倾向

2. `volatile packet`
   适合承载：
   - 当前线程焦点和即时场景
   - 刚发生的关系变化
   - 用户刚表达的偏好 / 边界 / 反感项
   - 当前回合的模态执行要求
   - 临时性的场景偏置

最终输出前，由 runtime 将两者合并成最终治理结果。

### 19.3 慢更新策略

慢更新适合通过以下事件触发：

- 角色配置编辑
- 角色来源 persona pack 变更
- 结构化长期记忆新增高权重项
- close-note / persistence contract chain 完成一轮沉淀
- 人工审核或策略更新

慢更新的目标是重建较稳定的：

- `role_expression_packet`
- 长期 `relationship_state_packet`
- 稳定 `knowledge_material_packet`

这类刷新不应在每条消息前都重新做一遍。

### 19.4 快更新策略

快更新适合在 runtime 或 thread-state 写回后立即触发。

建议的高优先级触发信号包括：

- 用户明确说“别分析我 / 别给建议 / 别转移话题”
- 关系显著推进或收缩
- 用户刚表达受伤、脆弱、求陪伴、同侧支持
- 线程 focus mode 或 continuity 状态发生切换
- 模态从普通文本转为显式图片/音频交付

快更新的目标不是重建全部 packet，而是只刷新：

- 当前关系调制
- 当前场景执行方式
- 当前避免项与短期风格偏置

也就是说，快更新应是**局部覆盖**，不是全量重算。

### 19.5 建议的刷新优先级

建议 runtime 采用以下优先级：

1. 当前 turn 内即时信号
2. 当前线程状态与最近 raw turns
3. 已沉淀的关系状态
4. 稳定角色表达画像
5. 稳定知识偏好

这意味着：

- 新鲜边界优先于旧习惯
- 线程内刚发生的变化优先于长期弱信号
- 长期角色画像仍然是底座，但不应压过强即时变化

### 19.6 输出前的合并策略

建议输出前不要直接拼原始 packet，而是通过一个合并步骤生成：

- `stable_governance_view`
- `volatile_governance_view`
- `final_output_governance_view`

合并原则：

- `volatile` 只能覆盖当前回合需要变化的部分
- `stable` 提供持续的人格锚点
- 当前未命中的区域沿用 `stable`
- 明确冲突时，以当前高权重边界和线程执行需求为先

### 19.7 与五层记忆的职责关系

这里的更新机制并不改变五层职责。

- 五层仍然负责“记录”
- packet 负责“预处理后的输出可消费结论”
- 刷新机制负责“何时重算哪些结论”

因此这是一层**输出治理运行机制**，而不是 memory schema 变更。

---

## 20. 知识层参与策略与意图路由

知识层对真人感很重要，但不应每轮都全量参与。  
如果知识层在所有回复里都强介入，容易出现：

- 输出变得信息化、说明化
- 角色口吻被知识材料压平
- 检索与装配成本抬高
- 普通陪伴轮也被拉长时延

因此建议给知识层增加一套**意图路由（intent routing）**，决定这一轮是否让知识层参与，以及参与多少。

### 20.1 路由目标

知识路由回答的问题应是：

- 这轮是否需要 L3 参与
- 需要参与到什么程度
- 优先调用哪类知识
- 知识在本轮中是主支撑还是轻背景

这层的目标不是取代知识召回，而是控制知识召回的预算和角色化程度。

### 20.2 建议的参与档位

建议先定义四档知识参与度：

1. `no_knowledge`
   - 不主动加载知识层
   - 适用于寒暄、陪伴、轻情绪承接、短确认

2. `light_knowledge`
   - 只允许轻量角色背景与兴趣素材参与
   - 适用于角色化画面描述、轻审美表达、自然延续

3. `domain_knowledge`
   - 允许专业知识或事实支撑参与
   - 适用于明确问题求解、专业建议、事实解释

4. `artifact_knowledge`
   - 只为图片 / 音频等模态提供轻量题材与风格素材
   - 适用于图片生成 caption、风格建议、音频语境润色

### 20.3 与角色 mode 的关系

知识层是否参与，不只由意图决定，也应受 `role_mode` 调制。

- `companion`
  - 默认更偏 `no_knowledge` 或 `light_knowledge`
  - 即便加载知识，也更像背景纹理、审美材料、生活化表达素材

- `assistant`
  - 更容易进入 `domain_knowledge`
  - 但仍应保持“真人 + 辅助任务”的感觉，避免变成知识引擎或工作流机器人

这意味着同一个用户问题，在不同 mode 下的知识参与强度可以不同。

### 20.4 建议的轻量意图分类

v1 不建议为知识路由单独引入重型模型。  
更稳的做法是先用现有 runtime 信号与轻规则分类，必要时后续再升级。

建议先识别以下几类：

- `relational_only`
  - 只需要关系承接，不需要知识

- `role_flavoring`
  - 需要一点角色背景、审美或长期兴趣材料

- `task_support`
  - 需要辅助推进，但知识只做轻支撑

- `factual_or_domain`
  - 需要事实、专业、解释性内容

- `artifact_captioning`
  - 需要为图片 / 音频交付提供题材或风格背景

### 20.5 路由后的参与规则

建议将知识层参与规则写成显式 policy，例如：

- `relational_only` -> `no_knowledge`
- `role_flavoring` -> `light_knowledge`
- `task_support` -> `light_knowledge` 或 `domain_knowledge`
- `factual_or_domain` -> `domain_knowledge`
- `artifact_captioning` -> `artifact_knowledge`

并且进一步约束：

- `companion + artifact_captioning`
  优先提供画面 / 情绪 / 意象素材，不上来就解释知识

- `assistant + task_support`
  优先提供简洁可执行帮助，不要堆背景常识

### 20.6 与等待时长的关系

知识层最容易拉长时延的，不是“是否存在”，而是“是否每轮都全量参与”。

通过意图路由后：

- 大量普通陪伴轮可以完全不查知识
- 图片 / 音频轮只做轻量题材参与
- 真正需要专业支撑时才进入较强知识模式

因此这套机制的目标正是：

- 让五层尽可能真正参与输出
- 但不把所有层都无差别拉满

### 20.7 与 packet 更新机制的关系

知识路由和 packet 刷新应协同工作：

- 路由决定这轮 `L3` 是否参与
- 刷新机制决定这轮应更新哪些 packet

例如：

- 普通陪伴轮：
  - `L1/L2/L4/L5` 强参与
  - `L3` 不参与

- 图片请求轮：
  - `L1/L2/L4/L5` 强参与
  - `L3` 走 `artifact_knowledge`

- 专业问题轮：
  - `L1/L2/L4/L5` 参与
  - `L3` 走 `domain_knowledge`

### 20.8 v1 建议

v1 先不做复杂的多模型 intent router，建议：

1. 先把知识参与档位写进输出治理手册
2. 先在 runtime 用轻规则 / 现有意图信号做知识路由
3. 先验证：
   - 角色感是否更稳定
   - 平均等待时长是否可控
   - 哪些轮次真的需要知识层参与

等这版稳定后，再考虑更复杂的学习式路由。

---

## 21. 数据分层与读取策略

### 21.1 为什么需要单独设计这一层

随着输出治理、五层记忆、调试可观测性和运行时组装能力不断增强，`assistant message metadata` 已经开始同时承担多种职责：

- 对话 UI 的默认读取来源
- 输出治理调试的轻量视图
- 运行时排障的临时承载物
- memory / knowledge / session / compaction 等上下文快照

当这些职责不加区分地堆进同一份消息 metadata 时，会出现两个问题：

1. 性能问题  
   message payload 迅速膨胀，进而拖慢：
   - assistant message 持久化
   - thread message 列表读取
   - IM webhook 的总耗时

2. 结构问题  
   “消息默认消费需要的数据”和“深度运行时内脏数据”被混在一起，导致：
   - 哪些字段是产品核心、哪些只是调试辅助不清楚
   - 想保性能时容易误伤核心价值
   - 想扩展时容易继续把 message metadata 撑大

因此，输出治理手册除了定义“如何说”，还需要定义“这些数据如何分层存放和调用”。

### 21.2 四层结构

建议采用以下四层：

1. `原始层（Source Layer）`
2. `治理完整体层（Governed Full Body Layer）`
3. `摘要层（Message Summary Layer）`
4. `动态展开层（On-demand Expansion Layer）`

这四层不是四套平行数据，而是同一套 runtime 信息在不同职责下的分层投影。

### 21.3 第一层：原始层

原始层对应现有五层记忆结构本身，以及其底座治理结果前的原始供数面。

它回答的问题是：

- 系统真实掌握了哪些角色信息
- 系统真实掌握了哪些关系变化
- 系统真实召回了哪些知识片段
- 当前线程状态是什么
- 最近原始对话发生了什么

它的来源包括但不限于：

- `L1 Role Core`
- `L2 Structured Long-Term Memory`
- `L3 Knowledge Layer`
- `L4 Thread State / Thread Compaction`
- `L5 Recent Raw Turns`
- namespace / retention / scenario pack / knowledge governance / close-note chain

设计原则：

- 完整、真实、可追溯
- 不追求每条消息默认高频读取
- 不直接作为 message metadata 主读取面

### 21.4 第二层：治理完整体层

治理完整体层是基于原始层，经 runtime 汇编器、治理能力与输出治理手册共同裁决后形成的 turn-level full runtime body。

它回答的问题是：

- 这一轮到底用了哪些上下文
- 这些上下文分别以什么权重和角色参与
- 哪些输出准则在这轮被激活
- 哪些规则属于慢更新，哪些属于快更新

它应包含：

- 角色表达画像的完整组装结果
- 关系状态、volatile override、场景偏置
- 知识路由与知识参与档位
- memory recall 的完整体
- close-note / runtime assembly / scenario / namespace 等深度细节
- 深度 timing 与诊断数据

设计原则：

- 保留 turn snapshot
- 为排障、研究、调参提供完整依据
- 不与每条消息默认读取主路径同行

### 21.5 第三层：摘要层

摘要层是从治理完整体中压出来的 message-level summary。

它回答的问题是：

- 这条消息最值得默认读取和展示的结论是什么
- UI、轻调试、轻分析真正需要知道什么

它应该具备以下特征：

- 与消息同行落库
- 默认读取
- 体积小、结构稳
- 表达“结论”，不表达“运行时内脏”

推荐保留在摘要层中的内容：

- governance summary
  - `expression_brief`
  - `relational_brief`
  - `scene_brief`
  - `knowledge_route`
  - `knowledge_intent`
  - `role traits`
  - `volatile override`
- model / language 的轻摘要
- memory hit / memory types / semantic summary
- thread state / session 的轻摘要
- artifact summary
- explanation / diagnostics 的轻摘要

不建议默认放在摘要层中的内容：

- 全量 `runtime_input`
- 全量 `recalled_memories`
- 全量 `knowledge.snippets`
- `role_core_close_note_*` 全套对象
- 大型 persistence envelope / manifest / payload
- scenario / namespace 的完整结构体

### 21.6 第四层：动态展开层

动态展开层用于在摘要不足时，按 `message_id` 读取更细信息。

它回答的问题是：

- 如果默认摘要不够，还能展开看到什么
- 哪些信息只在开发调试、研究分析时才值得拉取

它不是另一份摘要，而是：

- detail payload
- 按需展开视图
- derived view

典型使用方式：

- 线程页默认读取 message summary
- 点击开发调试面板时，再按消息去拉 detail
- 如果某个新视角不是高频需求，则通过 detail 动态组装，而不是先塞回 summary

### 21.7 各层关系

```text
五层原始数据
  ↓
治理完整体（turn full body）
  ↓
摘要层（默认 message summary）
  ↓
动态展开层（按需 detail / derived view）
```

更具体地说：

- 原始层提供真实性
- 治理完整体提供本轮裁决后的完整依据
- 摘要层提供默认消费性能
- 动态展开层提供扩展性

### 21.8 默认读取策略

建议默认读取策略为：

1. 消息列表、线程页、IM 主链、普通排障  
   只读摘要层

2. 开发调试、性能排查、prompt/治理回放  
   在摘要层基础上按需拉动态展开层

3. 运行时治理分析、内部研究  
   读治理完整体层

4. 记忆系统自身回溯与治理能力研究  
   读原始层

这意味着：

- 不再默认让 message metadata 承担完整运行体
- 默认路径只读小而稳的摘要
- 重数据只在需要时加载

### 21.9 更新机制

这四层的更新频率不应相同。

#### A. 原始层

沿用五层记忆和底座治理能力自己的更新机制：

- memory write
- close-note
- namespace / retention / scenario pack / knowledge governance

#### B. 治理完整体层

建议以“每轮生成完成时的快照”为主，不应频繁改写。

允许的补充：

- artifact / delivery / retry / postprocess 等后续事件

不建议：

- 因全局状态变化而反复回写旧 turn 的完整体

#### C. 摘要层

建议以 message snapshot 为主，默认生成完成时写一次。

允许补写的字段应严格受限，例如：

- artifact delivery status
- outbound delivery summary
- retry summary

不建议把摘要层做成高频动态回写对象。

#### D. 动态展开层

可以随着调试需求和研究需求演进，但不应影响主链性能。

### 21.10 摘要不够时如何扩展

摘要不够，不意味着立刻往摘要层继续加字段。

建议按以下规则决策：

1. 如果某字段属于高频消费、跨多个 UI/逻辑都需要  
   升级进摘要层

2. 如果只是偶发排障或研究分析需要  
   留在动态展开层

3. 如果它本质是某种组合视角，而不是原始字段  
   做 derived view

这样可以避免：

- 摘要层重新膨胀
- 每次新需求都反射性把 message metadata 撑大

### 21.11 与 turn snapshot 的关系

必须强调：

- 摘要层是该消息的 turn snapshot 摘要
- 治理完整体层是该消息的 turn snapshot 完整体

也就是说，消息级数据默认要回答的是：

> “这条消息当时是如何生成出来的？”

而不是：

> “系统现在最新状态是什么？”

后者更适合：

- 当前 packet cache
- 当前 thread state
- 当前关系状态面板

而不适合回写旧消息。

### 21.12 与 packet/cache 的关系

还需要区分：

- `message snapshot`
- `runtime packet/cache`

前者是历史快照，后者是当前策略缓存。

例如：

- stable packet：慢更新
- volatile packet：快更新

它们用于“下一轮怎么说”，而不是用于回写“上一轮当时为什么这么说”。

因此：

- packet/cache 可以更新快
- message summary 不应跟着频繁变

### 21.13 推荐的实施顺序

建议按以下顺序落地：

1. 先定义摘要层 contract
   - 明确哪些字段留在 message metadata

2. 再定义动态展开层 contract
   - 明确哪些字段迁出 message metadata

3. 再把当前 assistant message metadata 按 contract 瘦身

4. 最后补开发态 / 调试态的 detail 展开入口

### 21.14 本节结论

这套数据分层设计的核心不是“删数据”，而是：

- 保住原始层与治理完整体层的完整价值
- 让摘要层只承载默认消费真正需要的结论
- 把重数据迁移到按需展开层

这样才能同时实现：

- 保持五层记忆与输出治理的核心价值
- 降低消息读写成本
- 避免 message metadata 再次膨胀
- 为后续扩展保留合理的升级路径

### 21.15 摘要层字段 contract（建议保留）

摘要层的目标不是“包含所有有价值的信息”，而是只保留：

- 默认 UI 读取需要的字段
- 轻量调试需要的字段
- 对消息本身解释最有价值的字段
- 后续统计和查询会高频使用的字段

建议保留在 `assistant message metadata` 中的字段应收敛到以下几组。

#### A. 输出治理摘要

保留：

- `governance.expression_brief`
- `governance.relational_brief`
- `governance.scene_brief`
- `governance.avoidances`
- `governance.modality_rules`
- `governance.source_signals`
- `governance.role_traits`
- `governance.knowledge_route`
- `governance.volatile_override`

原因：

- 这些字段已被当前 UI 和轻调试直接消费
- 它们天然属于“这条消息为什么这样说”的结论层
- 体积相对可控

#### B. 语言与模型轻摘要

保留：

- 最终输出语言
- 模型 profile 名称或 id 的轻摘要
- model route / mode 的轻摘要
- 是否命中 rewrite / postprocess 的轻摘要

不保留：

- model profile 解析过程的大对象
- provider 请求配置细节

#### C. memory / knowledge / session 的轻摘要

保留：

- `memory_hit_count`
- `memory_types`
- `memory_semantic_summary`
- `knowledge_route`
- `knowledge_intent`
- `knowledge_source_count`
- `session_mode` / `thread_state_summary`
- `artifact_summary`

不保留：

- 全量 recalled memories
- 全量 knowledge snippets
- 全量 session/runtime input

#### D. delivery / postprocess 摘要

保留：

- artifact 是否成功交付
- outbound 是否成功
- retry 是否发生
- preview/postprocess 是否发生

这些字段允许在 turn 完成后进行有限补写，因为它们属于消息最终交付状态的一部分。

### 21.16 动态展开层字段 contract（建议迁出）

动态展开层应承接那些：

- 对深度排障重要
- 但默认读取成本高
- 且不适合与每条消息主查询同行

建议迁出的典型字段包括：

#### A. runtime 内部完整体

- `runtime_input`
- runtime assembly 的中间对象
- 大块 prompt assembly context
- provider request/response 的深层上下文

#### B. recall / knowledge 全量对象

- `recalled_memories` 全量记录
- `knowledge.snippets` 全量片段
- recall ranking / selection trace
- knowledge governance 的完整细节对象

#### C. role core close-note 全套对象

- `role_core_close_note_handoff_packet`
- `role_core_close_note_artifact`
- `role_core_close_note_archive`
- `role_core_close_note_persistence_envelope`
- `role_core_close_note_persistence_manifest`
- `role_core_close_note_persistence_payload`
- `role_core_close_note_record`
- `role_core_close_note_output`

这些对象保留价值很高，但明显不应该跟随每条消息默认读取。

#### D. namespace / scenario / compaction 的重对象

- namespace governance 的完整边界结构
- scenario pack 的完整治理结构
- compaction summary 的全量 plane / fabric / reuse 细节

这些更适合作为：

- detail payload
- debug API 展开结果
- 内部分析导出对象

### 21.17 禁止继续进入 message metadata 的字段类别

为了防止后续再次膨胀，建议在设计上明确“禁止进入摘要层”的字段类别：

1. 单条字段值明显可能超过数 KB 的对象
2. 可通过 `message_id` 在别处按需拉回的完整体对象
3. 只对 prompt 回放或深度排障有价值的内部结构
4. 与“该消息生成结论”无直接关系的底座治理长对象
5. 重复表达同一事实、但粒度更细的冗余字段

一个实用判断标准是：

> 如果线程页默认读取它没有直接价值，就不应进入 message metadata 主体。

### 21.18 摘要层与动态展开层的升级规则

未来新字段出现时，建议按以下规则决策：

#### 升级进摘要层

满足以下条件中的大部分时，才进入摘要层：

- 高频读取
- 至少两处以上 UI 或逻辑消费
- 对解释消息有直接价值
- 体积稳定可控
- 可以用摘要形式表达，而不是必须保留完整体

#### 留在动态展开层

符合以下特征时，应默认留在动态展开层：

- 偶发排障才会看
- 研究/分析用途大于产品默认消费
- 对象规模大
- 需要完整结构而不是摘要

#### 生成 derived view

如果一个新需求只是“换个视角看已有 detail”，不要先加新字段，优先：

- 在 detail 上做派生视图
- 在调试页动态计算展示

### 21.19 当前代码映射清单（从现状到新分层）

当前最主要的 assistant metadata 装配入口是：

- [runtime-assistant-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-assistant-metadata.ts)

这一层目前把多类不同职责的数据一并压进了 `BuildAssistantMessageMetadataInput`。  
从新分层设计看，它们应重新归位如下。

#### A. 建议继续保留在摘要层的现有字段

1. agent / model / language 轻摘要
- `agent_id`
- `agent_name`
- `model`
- `model_provider`
- `model_requested`
- `model_profile_id`
- `model_profile_name`
- `model_profile_tier_label`
- `underlying_model_label`
- `reply_language_target`
- `reply_language_detected`
- `reply_language_source`

2. answer / session / thread 的轻摘要
- `question_type`
- `answer_strategy`
- `answer_strategy_reason_code`
- `answer_strategy_priority`
- `answer_strategy_priority_label`
- `continuation_reason_code`
- `thread_state_lifecycle_status`
- `thread_state_focus_mode`
- `thread_state_continuity_status`
- `thread_state_current_language_hint`
- `same_thread_continuation_applicable`
- `long_chain_pressure_candidate`
- `same_thread_continuation_preferred`
- `distant_memory_fallback_allowed`
- `follow_up_request_count`

3. memory 的轻摘要
- `memory_hit_count`
- `memory_used`
- `memory_types_used`
- `memory_semantic_layers`
- `profile_snapshot`
- `hidden_memory_exclusion_count`
- `incorrect_memory_exclusion_count`

4. governance / knowledge route 的轻摘要
- `output_governance`
- `knowledge_count`
- `knowledge_titles`
- `knowledge_source_kinds`
- `knowledge_scope_layers`
- `knowledge_governance_classes`

这些字段还可以进一步压缩，但原则上属于摘要层。

#### B. 建议降级为“摘要化保留”的现有字段

这些字段有价值，但不应继续保持当前粒度；更适合压成 summary 版本再留在 message metadata：

1. `scenario_memory_pack_*`
保留建议：
- `scenario_memory_pack_id`
- `scenario_memory_pack_label`
- `scenario_memory_pack_selection_reason`
- `scenario_memory_pack_strategy_bundle_id`
- `scenario_memory_pack_orchestration_mode`

迁出建议：
- 各类 governance digest / plane / fabric / reuse 明细
- 大量 strategy / orchestration coordination 明细

2. `active_memory_namespace_*`
保留建议：
- `active_memory_namespace_id`
- `active_memory_namespace_primary_layer`
- `active_memory_namespace_layers`
- `active_memory_namespace_selection_reason`

迁出建议：
- convergence / consolidation / plane / fabric 的全套 digest、summary、alignment、reuse 字段

3. `compacted_thread_*`
保留建议：
- `compacted_thread_summary_id`
- `compacted_thread_summary_text`
- `compacted_thread_summary_lifecycle_status`
- `compacted_thread_summary_continuity_status`
- `compacted_thread_retention_mode`
- `compacted_thread_retention_reason`

迁出建议：
- governance / convergence / unification / consolidation / plane / fabric 的完整细分字段

4. `knowledge_*`
保留建议：
- count / titles / source kinds / route / scope / governance classes 的摘要

迁出建议：
- budget / alignment / unification / consolidation / coordination / plane / fabric 的完整治理细节

#### C. 建议完全迁出到动态展开层的现有字段

这些字段不应该继续存在于每条消息的默认 metadata 主体中：

1. role core close-note 完整体
- `role_core_close_note_handoff_packet`
- `role_core_close_note_artifact`
- `role_core_close_note_archive`
- `role_core_close_note_persistence_envelope`
- `role_core_close_note_persistence_manifest`
- `role_core_close_note_persistence_payload`
- `role_core_close_note_record`
- `role_core_close_note_output`

2. runtime 内部完整输入
- `runtime_input`

3. recall / knowledge 全量对象
- `recalled_memories`
- `knowledge.snippets`（当前通过 summary 之外的路径承载时也应迁出）

这些对象应改为：
- detail payload
- debug expand API
- 或开发态专用 tracing

### 21.20 建议的落地顺序（字段迁移版）

从当前代码状态出发，建议按这个顺序落地 metadata 瘦身：

1. 第一步：只迁出最重的大对象
- `runtime_input`
- 全套 `role_core_close_note_*`
- `recalled_memories`

2. 第二步：把 namespace / scenario / compaction / knowledge 的重细节收成 summary

3. 第三步：保留 UI 和治理调试已消费的轻摘要字段

4. 第四步：补一个按 `message_id` 读取 detail 的展开入口

这样可以先拿到显著性能收益，同时不影响当前 governance debug 和线程页观测。

### 21.21 与 prompt section 的边界

```ts
buildOutputGovernancePromptSection(preparedTurn.governance?.output_governance)
```

这段 section 的职责是：

- 明确这轮表达应更像谁
- 明确这轮避免哪些系统感输出
- 明确图片 / 音频 / artifact-first 的最小模态规则

它不负责：

- 再次重复所有 memory 内容
- 替代 thread continuity prompt
- 替代 namespace / knowledge / thread compaction prompt section

### 21.22 v1 先上收、后上收、暂不动的逻辑

为了避免大迁移，建议按下面三类处理：

#### A. v1 先上收进 governance 的逻辑

这些逻辑已经明显属于“输出治理”，值得优先集中：

- 角色通用表达倾向
- 通用系统感禁区
- 图片成功后正文应短、像 caption
- 音频成功后正文应短、口语、避免重复文本
- 必要澄清时不要长篇技术解释

#### B. v1 保留原地，但逐步映射到 governance 的逻辑

这些逻辑已在 `runtime.ts` 中大量存在，但短期可以先保留：

- relationship prompt detectors
- softening / anti-lecturing / anti-analysis 等 follow-up prompt shaping
- 某些“当前这轮是否应该短回复”的 prompt type 分流

更合适的做法是：

- v1 先保留这些函数
- 在治理汇编时开始消费它们的结果
- 后续再把高度稳定的部分上收成通用 packet 规则

#### C. v1 暂不动的逻辑

以下逻辑短期不应与治理重构绑在一起：

- memory recall 查询策略
- close-note / persistence payload 生成
- namespace / knowledge / scenario pack 的底座 prompt 结构
- billing / artifact generation / IM adapter 等非治理主线

### 21.23 v1 验证点

接入后建议优先验证这几类可观察结果：

1. 普通文本回复中，“作为 AI”“我没有真实身体/相册”类表述频率显著下降
2. 图片成功交付时，正文更短，且更少出现生成机制解释
3. 音频成功交付时，正文更短、更口语，并与 artifact-first 规则不冲突
4. `PreparedRuntimeTurn.governance` 可进入 debug metadata，便于回溯这轮为何这样输出

### 21.24 v1 完成标准

可认为 v1 完成的标准是：

- runtime 内有统一治理汇编入口
- 存在最小 `output_governance_packet_v1`
- 该 packet 已真实影响模型前 policy
- 图片 / 音频 / 关系型文本三条主路径都能感知到治理结果
- 旧逻辑仍然可运行，没有因为治理接入而导致回复主链不稳定

---

## 24. 总结

当前最合适的方案不是重做五层记忆结构，而是在“五层记忆结构 + 记忆治理能力”之上新增一套独立的输出治理手册。

这样可以保持：

- 五层继续负责记录与供数
- 记忆治理能力继续负责边界、保留、调度与沉淀
- runtime 继续负责生成
- 输出治理手册专门负责解释这些已治理上下文该如何被用来输出

这套结构最重要的价值在于：

- 不破坏已有 memory 架构
- 可以跨文本 / 图片 / 音频统一治理角色一致性
- 可以把“像角色本人而不是像 AI 系统”从零散 prompt 经验，提升为一套正式的后端设计原则
