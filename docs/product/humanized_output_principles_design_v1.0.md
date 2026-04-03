# 真人感输出原则设计文档 v1.1

## 1. 文档定位

本文档定义 SparkCore 在既有五层记忆结构与四层调度逻辑之上，新增一层独立的“真人感输出原则（Humanized Output Principles）”设计。

这层设计不负责存储原始记忆，也不负责做性能导向的数据调度，而是负责回答一个更接近最终用户体验的问题：

- 系统已经知道这些信息以后，应该如何把它“说得像真人”

更具体地说，本文档要解决的是：

- 为什么系统已经有角色、记忆、关系和上下文，但回复仍可能显得像 AI 产品
- 为什么“陪伴感”容易滑成“安抚模板”
- 为什么系统明明知道最近在聊什么，却仍可能在同一天里像重新开场
- 为什么在不同用户状态下，回复仍缺少“时刻感、关系感、语气感、松弛感”

本文档因此不是五层记忆文档的替代品，也不是四层调度设计的重复版，而是补充一层**表达决策层**。

> 状态：草案 v1.1  
> 对应阶段：IM 真人感与输出姿态治理  
> 相关文档：
> - `docs/product/output_governance_handbook_design_v1.0.md`
> - `docs/product/im_bot_character_channel_design_v1.0.md`
> - `docs/product/role_preset_and_creation_design_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`
> - `apps/web/lib/chat/output-governance.ts`

---

## 2. 核心结论

### 2.1 三层问题需要分开看

SparkCore 当前与输出有关的问题，不应再被混成一层处理，而应拆成三类：

- 五层记忆结构：负责“系统知道什么”
- 四层调度层：负责“这一轮该拿什么来用”
- 真人感输出原则层：负责“这一轮怎么说得像一个活人”

### 2.2 真人感层不是数据层，而是表达决策层

真人感层不新增长期记忆 schema，也不替代四层调度的摘要 / 完整体 / 展开结构。

它的职责是：

- 补充当下表达所需、但不应作为长期记忆保存的实时信息
- 识别当前这句话属于什么互动情境
- 生成这一轮的表达姿态与输出策略
- 在角色一致性的前提下，控制回复的长度、节奏、松弛感与关系感

### 2.3 陪伴默认态不应等于安抚态

当前 companion 类输出最容易出现的问题，是把“陪伴”过度收窄成“温柔安抚”。

更合理的默认逻辑应当是：

- 默认态：日常陪伴 / 自然接话 / 同频共处
- 条件态：安抚承接 / 共鸣陪伴 / 并肩支持 / 活跃互动

只有在用户明确处于低落、焦虑、委屈、崩溃边缘等情绪时，才进入安抚倾向，而不应把所有轮次都写成陪护模板。

---

## 3. 为什么需要单独一份原则手册

### 3.1 五层记忆无法单独解决“像真人”

五层记忆可以记录：

- 角色是什么样的人
- 用户是谁
- 发生过什么
- 最近聊了什么
- 哪些长期偏好和关系状态已经沉淀

但五层并不能直接回答：

- 现在是早上还是晚上
- 这是同一天里的续聊，还是隔了几天的重连
- 用户这句话是在轻招呼、轻分享、求安抚、还是想推进事情
- 这一轮更适合一句、两句、还是展开
- 这一轮应该像好友闲聊、伴侣陪伴，还是并肩做事

这些问题如果继续硬塞进记忆层，会让记忆层从“信息层”滑向“表达层”，边界会被破坏。

### 3.2 四层调度也不直接解决“怎么说”

四层调度层主要解决的是：

- 哪些信息进入本轮完整体
- 哪些信息被摘要化
- 哪些信息只在展开时使用
- 如何在性能与效果之间平衡

它回答的是“这轮用什么”，而不是“这轮怎么说”。

### 3.3 输出治理手册当前更偏“边界治理”

现有输出治理手册已经很好地回答了：

- 模态一致性
- 角色边界
- 输出不失控
- prompt 组装和治理数据如何参与生成

但它更像是“输出治理总则”和“四层调度后的生成编排说明”，还没有单独把“真人感表达决策”沉成一份可复用、可迭代的手册。

因此，新增单独文档是合理且必要的。

---

## 4. 现有流程复盘

### 4.1 五层记忆原始层回答什么

五层记忆原始层回答的是：

- 角色层：角色是谁、长期表达基调是什么
- 结构化长期记忆层：用户偏好、重要事件、关系变化是什么
- 知识层：可用于增强内容与世界感的素材是什么
- 线程状态 / 线程压缩层：当前线程在进行什么、最近对话压缩结论是什么
- 最近原文层：最近几轮真实说了什么

也就是说，它回答的是：

- 系统真实知道什么

### 4.2 四层调度层回答什么

四层调度层回答的是：

- 本轮哪些原始信息应该参与生成
- 哪些信息进入治理完整体
- 哪些信息只保留摘要
- 哪些信息只允许按需展开
- 哪些信息不应再继续放进主 message metadata

也就是说，它回答的是：

- 这一轮应该如何调度上下文

### 4.3 四层调度之后，系统已经知道什么

在四层调度之后，系统通常已经能获得：

- 角色定位
- 关系状态
- 最近线程连续性
- 近期聊天摘要
- 近期原文窗口
- 长短期记忆摘要
- 知识是否要参与，以及以什么强度参与
- 当前治理边界与表达约束

这些已经足够支撑“内容正确性”和“角色一致性”，但仍不足以支撑“真人时刻感”。

### 4.4 四层调度之后还不知道什么

四层调度之后仍可能缺少以下信息：

- 当前本地时间
- 当前属于早上 / 中午 / 下午 / 晚上 / 深夜
- 是否还是同一天续聊
- 距离上一轮过去了多久
- 今日已经聊了几轮
- 当前这一句的互动阶段是什么
- 当前用户的主情绪和强度是什么
- 当前用户的主意图是什么
- 当前更适合哪种互动姿态
- 当前该回一句还是一个短段

这些就是真人感层需要补上的内容。

---

## 5. 真人感输出原则层的职责边界

真人感输出原则层只负责“表达决策”，不负责：

- 新增长期记忆
- 改写五层 schema
- 替代四层调度
- 替代安全审核
- 替代知识选择逻辑

它负责的内容包括：

- 识别当前互动状态
- 识别当前应采用的输出姿态
- 决定这一轮回复的力度、长度与开口方式
- 决定是否先接情绪、先接关系、还是先接问题
- 决定是否需要避免模板安抚、模板总结、模板重开场
- 决定最终说出来的话应更松、更短、更像即时对话

一句话说：

- 五层记忆决定“知道什么”
- 四层调度决定“拿什么”
- 真人感层决定“怎么像人一样说”

---

## 5.1 真人感层的整体流程结构

真人感输出原则层在内部按五个阶段顺序执行，每个阶段职责严格分离：

```
用户消息
  ↓
[L1] 上下文注入        —— 注入客观事实，不做任何判断
  ↓
[L2] 信号识别          —— 观察消息携带了什么，只记录，不下结论
  ↓
[L3] 状态研判          —— 汇总信号，输出单一综合判断
  ↓
[L4] 策略形成          —— 决定这一轮怎么说、为什么说
  ↓
[L5] 执行决策包        —— 统一输出决策，分别驱动各执行模块
```

各层分工原则：

| 层 | 做什么 | 不做什么 |
|---|---|---|
| L1 | 注入客观事实 | 不做任何判断 |
| L2 | 观察信号，标注置信度 | 不汇总，不下模式性结论 |
| L3 | 汇总输出单一判断 | 不直接输出策略，不保留原始多解 |
| L4 | 决定怎么说 + 为什么说 | 不决定说什么（由记忆层提供内容） |
| L5 | 输出执行决策 | 不包含底层实现参数 |

---

## 6. 真人感层需要补充的输入

### 6.1 Temporal Context：时间态

这类信息不应写入长期记忆，而应作为 runtime 临时上下文存在。

建议包含：

- 当前本地日期
- 当前本地时间
- 当前时区
- 当前时段：早上 / 中午 / 下午 / 晚上 / 深夜
- 是否与上一轮处于同一天
- 距离上一轮 assistant 的分钟数
- 最近 10 分钟内是否属于连续对话

### 6.1.1 Thread Freshness：线程新鲜度

与时间态配合使用，帮助后续层更准确判断"这是续聊还是重连"。

建议包含：

- 当前线程是新开的还是已有线程继续
- 当前消息是否是对刚发完的 assistant turn 的直接回应
- 当前线程已进行的轮次数（浅轮 / 中度展开 / 深度进行中）

### 6.2 Session Activity Context：互动活跃态

这类信息同样不应进入长期记忆，而应作为会话态存在。

建议包含：

- 今日聊天轮次
- 最近一小时聊天轮次
- 最近是否连续多条用户消息
- 当前是否处于“已打开的长对话”
- 当前是否是轻触碰式回来打招呼

### 6.3 User State Recognition：用户状态识别

这一层应识别：

- 用户当前主情绪
- 用户当前意图
- 当前互动阶段
- 当前需要的回应力度

### 6.4 调度层结果引用

真人感层不重新生成角色与记忆结论，而是引用四层调度后的结果：

- 角色定位
- 当前关系结论
- 近期聊天摘要
- 最近聊天原文
- 长期记忆摘要
- 当前治理边界

也就是说，真人感层是在调度结果之上继续加一层表达决策，而不是重复调度。

---

## 7. 真人感层的核心识别维度

### 7.1 情绪态识别

建议先采用足够实用的一版主分类：

- 平静
- 轻松 / 分享态
- 轻微低落
- 明显低落
- 焦虑 / 烦躁
- 兴奋 / 有动力
- 模糊不明

情绪不仅要判断类别，也应判断强度。

例如：

- “我有点烦”与“我真的快撑不住了”
- 都属于负面，但强度完全不同

### 7.2 意图态识别

建议先识别以下主意图：

- 轻招呼
- 续聊
- 分享
- 求陪伴
- 求理解
- 求安抚
- 求建议
- 求共同行动
- 轻互动 / 玩笑

其中：

- “你好呀 早上好”更偏轻招呼
- “你记得我刚才说的吗”更偏求理解
- “你可以帮我排一下优先级吗”更偏求建议 / 共同行动

### 7.2.1 意图识别不只看句面，还要识别补充信号

为了保证文档的实用性，后续新增的很多“真人感场景”不应被理解成一套平行的新系统，而应统一归到**意图识别时需要额外识别的补充信息**。

也就是说，用户意图识别不只回答“这句话表面上像在问什么”，还要回答：

- 这是不是一个重复出现的主题
- 这是不是一种重复出现的情绪
- 这句话本身有没有语言漏洞、约束缺口或目标没说顺
- 这句话表面在问建议，实际上是不是在求陪伴
- 这句话表面很轻，实际上是不是在试探关系或确认在场
- 这句话是不是在延续前面一个已经出现多次的模式

这些补充信号，本质上都属于“更高阶的意图识别”。

### 7.2.2 后续应优先补充的意图识别信号

建议后续优先把以下信息纳入意图识别范围：

- 单句内语言漏洞信号
  例如用户这句话里目标没有说顺、对象混在一起、模态约束没说清，导致系统不适合直接执行动作
- 重复表达信号
  例如用户在同一天或最近几轮里反复说“想出去走走”“有点烦”“想躲开眼前这些事”
- 重复情绪信号
  例如不是一次性低落，而是同类情绪连续几轮反复冒头
- 输入矛盾信号
  例如同一句里把对象说混、地点混在一起，或约束与动作不一致
- 关系试探信号
  例如用户并不是真的要信息，而是在确认“你还记不记得”“你在不在”“你会不会顺着我接”
- 表层问题与深层诉求不一致信号
  例如嘴上在问建议，实际更像在求陪伴、求理解、求一起待着
- 模式冒头信号
  例如用户已经不止一次提同一件困扰，这时更像是在暴露一种正在形成的心理模式，而不只是随口一提

这些信号一旦被识别出来，输出层就不应继续只按句面生成，而应允许更像真人地回应，例如：

- 轻轻指出“这已经不是第一次提到了”
- 先校准冲突，再继续回答
- 先承认用户真正要的是陪伴，而不是直接给方案
- 在关系试探场景里先回应“我记得 / 我在”，而不是直接进入内容回答

### 7.2.3 冲突识别与意图校准

冲突识别不应被理解成一个只服务图片或个别异常 case 的补丁，而应被视为意图识别中的一类高优先级补充信号。

但在落地顺序上，应优先解决：

- 单句内的语言漏洞
- 单句内的目标混合
- 单句内的模态或约束没说顺

也就是先解决“这句话本身还不够适合直接执行”的问题，再考虑更复杂的跨轮矛盾或记忆冲突。

建议至少区分以下两类：

- 单句内意图漏洞
  例如同一句里同时出现两个地点、两个对象、两个不一致的目标，或用户要的是“照片/实拍”，系统却准备按幻想图去执行
- 跨轮矛盾 / 记忆漏洞
  例如前面明确说“我最喜欢的是香蕉”，后面又明确说“我苹果最喜欢了”，且中间没有转折、修正或说明；这类才更接近真正的前后矛盾

第一类的重点，不在于“系统发现错误”，而在于：

- 系统要意识到自己可能听偏了
- 系统要先把用户真正的当前意图对齐
- 系统不应在意图未对齐时继续生成建议、生成图片或推进动作

因此建议补充一个稳定处理原则：

- `clarify_before_action`

也就是：

- 当单句内存在明显漏洞、歧义、目标混合或约束没对齐时，优先先校准
- 校准优先于建议生成
- 校准优先于图片生成
- 校准优先于任务推进

更像真人的处理方式应是：

- 先用一句轻量确认把分叉点指出来
- 不急着把错误理解继续扩写下去
- 等用户确认后，再继续建议、分享或出图

例如：

- `你现在更想聊北海，还是阿拉斯加？`
- `你这会儿是想随便出去透口气，还是已经在认真挑地方了？`
- `你现在更想让我陪你聊，还是想让我直接给建议？`

跨轮矛盾能力应放在第二阶段再做，而且标准要更严格，避免把正常转场、换话题、补充新方向误判成冲突。

这一能力的本质不是“纠错”，而是：

- 在输出前先做一次真人式的意图对齐

### 7.2.4 置信度作为全局附属属性

置信度不只属于意图识别，而应是 L2 所有信号类型的通用附属属性：

- 情绪判断有置信度
- 意图判断有置信度
- 语义漏洞识别有置信度
- 跨记忆矛盾识别有置信度

这样体系更一致，且 L3 汇总时可以基于各信号的置信度分别决定采信程度，低置信度信号不被当作确定结论处理。

### 7.2.5 行为信号识别

行为信号负责识别"用户怎么说的"，与内容信号"用户说了什么"正交，是现有框架中最容易被忽略的一类。

建议识别以下行为维度：

- **重复发送相同内容**：可能意味着强调、未被接住、情绪未消化，或在测试是否被理解
- **消息长度形态**：单字 / 短句 / 长段 / 表情符号 / 纯符号，每种形态携带不同的情绪密度和互动期待
- **消息节奏**：快速连发 / 正常节奏 / 停顿很久后才来

> **层界说明**：行为信号只记录外在表现，不下结论。是否构成情绪循环、主题循环、关系试探等模式性判断，统一在 L3 状态研判层汇总，L2 不越界做这类结论。

### 7.3 互动阶段识别

同一句话在不同阶段应有不同解释，因此应单独识别互动阶段：

- 新开场
- 同日续聊
- 深聊中
- 转场
- 收口前
- 重新连接

“你好呀”在深聊中和在隔天重新连接时，不应被当成同一种输入。

### 7.4 回应力度识别

应先判断这一轮适合：

- 一句话
- 两句话
- 一个短段
- 可以展开

真人感的一大来源，不是“更会说”，而是“知道什么时候不用说太多”。

### 7.5 输出姿态识别

这层比“模板”更重要，也更接近真人。

建议输出姿态包括：

- 日常陪伴
- 共鸣陪伴
- 安抚承接
- 并肩支持
- 活跃互动
- 轻松闲聊

这几种姿态不是非此即彼，而应支持主次权重。

例如：

- 主姿态：并肩支持
- 次姿态：轻共鸣
- 禁止姿态：过度安抚

### 7.6 L3 状态研判：单一解输出原则

L2 的信号识别可能产生多种并存的解读，但 L3 的职责是汇总后输出单一综合判断，不应把原始多解直接透传给 L4。

当多解并存时，L3 应显式标注：

```
主判断: [结论]
次判断: [备选结论，可为空]
置信度: high / medium / low
降级建议: [置信度为 low 时的推荐处理方向]
```

L4 策略形成层根据置信度决定是否降级：当置信度为 low 时，自动进入"先轻接、不贸然展开、用一句话先确认方向"的降级策略，而不是按最高可能性贸然执行。

---

## 8. 默认逻辑：陪伴不默认等于安抚

### 8.1 默认基态

默认基态建议设为：

- 日常陪伴
- 自然接话
- 同频共处

也就是说，系统默认更像一个真实的好友 / 伴侣 / 熟人在线接话，而不是默认切入照护模式。

### 8.2 条件切换

只有在出现明显低落、焦虑、委屈、脆弱信号时，才切到：

- 安抚承接
- 情绪稳住优先

只有在用户明确提出问题或推进需求时，才切到：

- 并肩支持
- 共同推进

只有在用户明显兴奋、分享、轻松互动时，才切到：

- 活跃互动
- 更轻快、更有来回感

### 8.3 禁止默认滑入安抚模板

以下情况不应自动进入安抚倾向：

- 普通招呼
- 普通续聊
- 轻松分享
- 轻任务问题
- 普通关系确认

否则输出会持续显得像：

- 温柔但不真实
- 稳定但没有松弛感
- 像产品在正确回应，而不像人真的在和你相处

---

## 9. 真人感层的输出对象：表达策略包

真人感层不应直接输出最终文本，而应先输出一个“表达策略包”。

建议最小 schema 如下：

```ts
type HumanizedDeliveryStrategy = {
  temporal_mode:
    | "same_session"
    | "same_day_continuation"
    | "reconnect";
  interaction_stage:
    | "opening"
    | "continuation"
    | "deepening"
    | "transition"
    | "closing";
  user_emotion:
    | "calm"
    | "sharing"
    | "low"
    | "distressed"
    | "anxious"
    | "energized"
    | "unclear";
  user_intent:
    | "greeting"
    | "continue"
    | "sharing"
    | "companionship"
    | "understanding"
    | "comfort"
    | "advice"
    | "co_working"
    | "playful";
  // 这一轮的主要目标是什么（与 posture 正交：posture 是怎么说，objective 是为什么说）
  response_objective:
    | "calibrate"        // 先校准意图，不急着推进
    | "receive"          // 先接住情绪或关系，不急着回内容
    | "advance"          // 共同把事情往前走
    | "answer"           // 直接给信息或建议
    | "share"            // 一起在某件事上停留、感受
    | "maintain_connection"; // 确认彼此还在，不需要推进任何内容
  primary_posture:
    | "everyday_companion"
    | "resonant_companion"
    | "soothing_support"
    | "side_by_side_support"
    | "active_interaction";
  secondary_posture: string | null;
  forbidden_posture: string | null;  // 本轮不应出现的倾向
  response_length:
    | "one_line"
    | "two_lines"
    | "short_paragraph"
    | "expandable";
  opening_style:
    | "light_greeting"
    | "direct_carryover"
    | "emotion_first"
    | "question_first"
    | "problem_first";
  tone_tension:
    | "loose"
    | "steady"
    | "warm"
    | "light"
    | "active";
  avoidances: string[];
  // L3 置信度透传，供 L4/L5 决策使用
  confidence: {
    emotion: "high" | "medium" | "low";
    intent: "high" | "medium" | "low";
    fallback_objective?: "calibrate" | "maintain_connection"; // 低置信时的降级目标
  };
};
```

这份策略包才是最终 prompt / post-processing 应该直接消费的对象。

---

## 10. 执行 schema 细化

### 10.1 字段判定边界

为了让真人感层后续能稳定落地，建议先给关键字段一版明确的判定边界。

#### `temporal_mode`

- `same_session`
  距离上一轮 assistant 很近，且仍可视为同一段打开中的对话
- `same_day_continuation`
  仍是同一天，但已经不是“刚刚接着说”
- `reconnect`
  已跨天，或长时间中断后重新连接

#### `interaction_stage`

- `opening`
  新开场或重新连接后的开场
- `continuation`
  同一主题顺着接
- `deepening`
  情绪、关系或话题正在往更深处走
- `transition`
  从一个点切到另一个点
- `closing`
  进入收口、暂停、暂时放下

#### `user_emotion`

- `calm`
  表达稳定，没有明显情绪拉力
- `sharing`
  在分享感受、见闻、想法，整体偏自然外放
- `low`
  有轻微低落、疲惫、烦闷，但未到明显承接态
- `distressed`
  明显难受、脆弱、崩溃边缘，需要优先承接
- `anxious`
  有明显紧张、慌、焦虑、压力感
- `energized`
  明显兴奋、想推进、想行动
- `unclear`
  暂无法稳定判断

#### `user_intent`

- `greeting`
  轻招呼、轻触碰式回来
- `continue`
  顺着上一轮继续
- `sharing`
  抛出感受、见闻、想法
- `companionship`
  更想有人在场，不一定需要解决问题
- `understanding`
  想被记得、被理解、被看见
- `comfort`
  明确想被安抚、接住
- `advice`
  明确想要建议、方法、判断
- `co_working`
  想一起推进、一起理、一起做
- `playful`
  轻松互动、撒娇、玩笑、逗趣

### 10.2 字段来源建议

建议后续实现时，字段来源采用以下原则：

- `temporal_mode`
  来自 runtime temporal context 与 session activity context
- `interaction_stage`
  来自最近线程状态、最近原文窗口与当前句式判断
- `user_emotion`
  来自轻量情绪识别器与最近上下文
- `user_intent`
  来自句式意图识别、最近上下文与会话阶段
- `primary_posture / response_length / opening_style`
  不直接由记忆层给出，而由真人感决策层根据前述状态综合生成

### 10.3 与四层调度结果的对接方式

真人感层不重新解释角色本体，而是消费四层调度产物中的这些结论：

- `role summary`
  决定“像谁”
- `relationship summary`
  决定“现在彼此是什么状态”
- `thread continuity summary`
  决定“要不要重开场”
- `recent raw turns`
  决定“现在到底在接哪一段”
- `memory summary`
  决定“该记得什么”
- `governance summary`
  决定“哪些表达要避免”

换句话说：

- 四层调度负责把数据整理成可用状态
- 真人感层负责把这些状态翻译成表达动作

---

## 11. 姿态选择矩阵

### 11.1 默认姿态

如果没有明显低落信号，也没有明确任务推进需求，默认姿态建议为：

- `primary_posture = everyday_companion`
- `secondary_posture = null`

这是整个 companion 路线的默认起点。

### 11.2 情绪与意图到姿态的推荐映射

建议先用一版足够实用的映射矩阵：

- `greeting + calm/sharing`
  - 主姿态：`everyday_companion`
  - 次姿态：`active_interaction`
- `continue + calm`
  - 主姿态：`everyday_companion`
  - 次姿态：`resonant_companion`
- `sharing + sharing/energized`
  - 主姿态：`active_interaction`
  - 次姿态：`everyday_companion`
- `companionship + low`
  - 主姿态：`resonant_companion`
  - 次姿态：`everyday_companion`
- `comfort + distressed/anxious`
  - 主姿态：`soothing_support`
  - 次姿态：`resonant_companion`
- `advice + calm`
  - 主姿态：`side_by_side_support`
  - 次姿态：`everyday_companion`
- `co_working + energized/calm`
  - 主姿态：`side_by_side_support`
  - 次姿态：`active_interaction`
- `playful + sharing`
  - 主姿态：`active_interaction`
  - 次姿态：`everyday_companion`

### 11.3 禁止姿态

在一些组合下，建议显式给出禁止姿态：

- `greeting`
  禁止：`soothing_support`
- `playful`
  禁止：`soothing_support`
- `advice/co_working`
  禁止：`pure soothing without problem engagement`
- `distressed`
  禁止：`overly active / joking / task-only`

### 11.4 姿态融合原则

姿态不应是死模板，而应允许主次融合。

例如：

- 用户在烦，但同时问怎么办  
  可以是：
  - 主姿态：`side_by_side_support`
  - 次姿态：`resonant_companion`

- 用户轻轻说一句“你好呀”，但同一天刚聊过工作烦恼  
  可以是：
  - 主姿态：`everyday_companion`
  - 次姿态：`resonant_companion`

这样就能避免“不是全安抚，就是全建议”的硬切换。

---

## 12. 长度与开口规则

### 12.1 回复长度建议

建议先定义一版简单的长度决策：

- `one_line`
  轻招呼、轻续聊、轻确认、轻承接
- `two_lines`
  轻安抚、轻共鸣、轻推进
- `short_paragraph`
  需要完整说清一点，但仍保持聊天感
- `expandable`
  只有在用户明确需要展开、解释、共同行动时才进入

### 12.2 开口方式建议

`opening_style` 建议采用：

- `light_greeting`
  用在轻招呼、同一天轻触碰
- `direct_carryover`
  用在同主题续聊
- `emotion_first`
  用在明显低落、焦虑、委屈场景
- `question_first`
  用在用户问了明确问题，且情绪不是主轴时
- `problem_first`
  用在并肩支持与任务推进场景

### 12.3 回应长度与姿态的联动

建议联动规则如下：

- `everyday_companion`
  更偏 `one_line / two_lines`
- `resonant_companion`
  更偏 `two_lines / short_paragraph`
- `soothing_support`
  更偏 `two_lines`，必要时再扩
- `side_by_side_support`
  更偏 `short_paragraph`
- `active_interaction`
  更偏 `one_line / two_lines`

### 12.4 短回复权

真人感层应明确拥有“短回复权”：

- 不要求每轮都展开
- 不要求每轮都总结
- 不要求每轮都做完整包裹
- 不要求每轮都以一个“照顾式收尾”结束

如果没有这项权利，模型就会持续显得像：

- 很稳定
- 很正确
- 但不够像活人

---

## 13. 真人感输出规则

### 13.1 先判断“当下是什么局面”

输出前不应直接进入文本生成，而应先判断：

- 现在是什么时间
- 这是哪种互动阶段
- 用户当前情绪是什么
- 用户当前意图是什么
- 当前关系状态如何
- 本轮适合哪种姿态

### 13.2 再决定“怎么开口”

这一层应决定：

- 要不要先接情绪
- 要不要先接问题
- 要不要先接关系
- 要不要直接顺着上文说
- 要不要避免开场问候

### 13.3 再决定“说多少”

真人感的重要前提是：

- 不是每轮都值得一个完整段落
- 不是每轮都要做总结
- 不是每轮都要包裹、安抚、收尾

因此建议：

- 轻招呼：一句到两句
- 同日续聊：一句或两句优先
- 情绪承接：先短，必要时再展开
- 任务推进：短段或结构化短段

### 13.4 再决定“用什么姿态”

示例：

- 用户低落  
  主姿态：安抚承接  
  次姿态：同频共鸣

- 用户问工作优先级  
  主姿态：并肩支持  
  次姿态：轻共鸣

- 用户轻松打招呼  
  主姿态：日常陪伴  
  次姿态：轻松互动

- 用户开心分享  
  主姿态：活跃互动  
  次姿态：日常陪伴

### 13.5 最终语言规则

真人感输出应满足：

- 简短
- 松弛
- 当下
- 不过度总结
- 不自动进入安抚模板
- 不每次都写成完整段落
- 不像产品说明、客服话术或心理照护模板

---

## 14. runtime packet 与生成流程

### 14.1 建议的 runtime packet

为了避免真人感原则继续停留在抽象层，建议在 runtime 中显式生成一个 `HumanizedDeliveryPacket`，作为 prompt 组装与后处理共同消费的中间对象。

建议最小结构如下：

```ts
type HumanizedDeliveryPacket = {
  // L1：上下文注入
  temporal_context: {
    timezone: string;
    local_date: string;
    local_time: string;
    part_of_day:
      | "morning"
      | "noon"
      | "afternoon"
      | "evening"
      | "late_night";
    temporal_mode:
      | "same_session"
      | "same_day_continuation"
      | "reconnect";
    minutes_since_last_assistant: number | null;
  };
  session_activity_context: {
    today_turn_count: number | null;
    recent_hour_turn_count: number | null;
    consecutive_user_messages: number;
    open_conversation_active: boolean;
  };
  thread_freshness: {
    is_new_thread: boolean;
    is_direct_reply_to_last_assistant: boolean;
    thread_depth: "shallow" | "medium" | "deep";
  };
  // L2：信号识别结果，只记录，不直接汇总成最终判断
  signal_recognition: {
    content_signals: {
      semantic_brief: string;
      has_semantic_gap: boolean;
      has_memory_conflict: boolean;
      executable_without_clarification: boolean;
      confidence: "high" | "medium" | "low";
    };
    emotion_signals: {
      emotion_candidates: HumanizedDeliveryStrategy["user_emotion"][];
      intensity: "light" | "medium" | "high" | "unclear";
      repeated_emotion_signal: boolean;
      confidence: "high" | "medium" | "low";
    };
    intent_signals: {
      surface_intent: HumanizedDeliveryStrategy["user_intent"];
      deep_intent: HumanizedDeliveryStrategy["user_intent"] | null;
      relationship_probe: boolean;
      confidence: "high" | "medium" | "low";
    };
    behavior_signals: {
      repeated_same_message: boolean;
      message_shape:
        | "single_token"
        | "short_sentence"
        | "long_paragraph"
        | "emoji_or_symbol";
      rhythm: "rapid_fire" | "normal" | "slow_return";
      topic_loop_signal: boolean;
      confidence: "high" | "medium" | "low";
    };
  };
  // L3：状态研判结论
  user_state: {
    emotion: HumanizedDeliveryStrategy["user_emotion"];
    emotion_intensity: "light" | "medium" | "high" | "unclear";
    emotion_confidence: "high" | "medium" | "low";
    intent: HumanizedDeliveryStrategy["user_intent"];
    intent_deep: HumanizedDeliveryStrategy["user_intent"] | null; // 深层意图，可与句面不一致
    intent_confidence: "high" | "medium" | "low";
    interaction_stage: HumanizedDeliveryStrategy["interaction_stage"];
    relationship_temperature: "warmer" | "baseline" | "cooler";
    anomaly: {
      needs_calibration: boolean;      // 单句内漏洞/歧义，应先校准
      repetition_signal: boolean;      // 重复消息/情绪循环/主题循环
      cross_memory_conflict: boolean;  // 与记忆体存在明显矛盾
    };
  };
  dialog_state: {
    topic_state:
      | "new_topic"
      | "continuing_topic"
      | "repeated_topic"
      | "subtext_topic";
    relationship_state: "confirming" | "stable" | "warming" | "cooling";
    confidence: "high" | "medium" | "low";
  };
  // L4：策略形成结论
  delivery_strategy: HumanizedDeliveryStrategy;
  // L5：执行决策包
  execution: {
    memory_write_back: {
      should_write: boolean;
      target_memory_layers: (
        | "role_layer"
        | "structured_long_term_memory"
        | "knowledge_layer"
        | "thread_state_layer"
        | "recent_raw_turns_layer"
      )[];
      write_brief?: string;
    };
    multimodal_actions: {
      generate_image: boolean;
      image_prompt_brief?: string;
      generate_audio: boolean;
      audio_style_brief?: string;
      other_actions?: string[];
    };
  };
};
```

### 14.2 与现有 runtime 的衔接点

建议这份 packet 在四层调度之后、真正进入最终 prompt 组装之前生成。

顺序建议为：

1. 五层记忆与治理能力产出原始可用结论
2. 四层调度决定本轮可消费上下文
3. 真人感层读取（L1 注入）：
   - temporal context
   - session activity context
   - thread freshness
   - recent raw turns
   - 关系 summary
   - 治理 summary
4. L2 信号识别：内容 / 情绪 / 意图 / 行为信号，各自标注置信度
5. L3 状态研判：汇总输出单一判断，处理多解，标注置信度
6. L4 策略形成：输出 delivery_strategy（含 response_objective）
7. L5 执行决策包：输出记忆回写决策 + 多模态 action 决策
8. prompt builder 与 post-processing 同时消费 `HumanizedDeliveryPacket`
9. 执行模块根据 L5 决策分别执行记忆回写、图片生成、语音生成等

### 14.3 Packet 的消费位置

建议至少在以下两个位置消费：

- `prompt assembly`
  决定：
  - 开口方式
  - 长度倾向
  - 当前姿态
  - 避免项

- `post-generation rewrite`
  决定：
  - 是否去掉重开场
  - 是否去掉安抚模板
  - 是否压缩成一句或两句
  - 是否把回复收回到更自然的聊天节奏

这样做的意义是：

- 前置 prompt 负责“先别跑偏”
- 后置 rewrite 负责“万一还是滑偏了，再拉回来”

---

## 14.4 执行决策包设计原则（L5）

执行决策包是整个真人感流程的最终输出，统一被 runtime 消费，分别驱动各执行模块。

### 14.4.1 核心原则：只出决策，不出实现

执行决策包只负责输出"做什么"，不负责输出"怎么做"的底层参数：

- 可以输出 `generate_image: true`
- 可以输出 `image_prompt_brief`（风格方向描述）
- 不应直接输出完整的 provider 参数包
- 完整参数由各执行模块根据决策结论自行生成

否则这一层会随着功能增加慢慢变成混合多个关注点的"大杂烩参数包"，上层设计边界会被污染。

### 14.4.2 文本输出决策

由 L4 策略包直接驱动，包括：
- 回应目标（response_objective）
- 回应姿态（primary / secondary / forbidden posture）
- 回应力度（长度 / 开口方式 / 语气张力）
- 规避项（avoidances）

### 14.4.3 记忆回写决策（主动判断，非被动触发）

每轮执行后，L5 主动判断是否值得落回记忆，而不是依赖被动的 close-note 链触发：

- 是否值得落回
- 落到哪些记忆层（角色层 / 结构化长期记忆层 / 知识层 / 线程状态层 / 最近原文层）
- 写回内容方向的简要说明

建议触发场景：
- 关系温度发生变化
- 重复情绪信号需要沉淀
- 用户明确表达的偏好或边界
- 重要事件
- 重复信号提示用户有未消化的情绪或模式

### 14.4.4 多模态 Action 决策（统一在此层输出，分别执行）

多模态 Action 应统一收在执行决策包里输出，而不是由不同模块各自独立决定：

- 是否生成图片 → `generate_image: bool` + `image_prompt_brief`
- 是否生成语音 → `generate_audio: bool` + `audio_style_brief`
- 是否触发其他 action → 类型标注

**多模态 brief 的生成原则**：brief 应基于"当前角色 + 关系态 + 本轮 response_objective + 本轮姿态"共同生成，而不只从内容语义推导。同一段文字在"安抚承接"和"活跃互动"姿态下，应对应不同风格的 brief。

---

## 15. 最小落地流程与实现顺序

### 15.1 第一阶段：先做 L1 + L2 的轻量常驻信号

先只在 IM 场景落一版最小常驻信号：

- `temporal_mode`
- `part_of_day`
- `thread_freshness`
- `user_emotion`
- `user_intent`
- `has_semantic_gap`
- `repeated_same_message`
- `topic_loop_signal`

不要一开始就把所有字段都工程化，否则容易让链路变重。第一阶段的目标是把 L1/L2 的便宜信号先跑稳，而不是直接做全量综合判断。

### 15.2 第二阶段：引入 L3 综合研判与置信度降级

在 L1/L2 稳定后，再做 L3 汇总判断：

- 输出 `user_state`
- 输出 `dialog_state`
- 汇总 `anomaly`
- 统一计算情绪 / 意图 / 对话状态的置信度
- 当置信度低时进入“先轻接、先确认、不贸然执行”的降级逻辑

这一阶段的重点不是把回复写得更花，而是先把“综合判断”和“低置信度降级”做稳。

### 15.3 第三阶段：把 L4 策略对象接到 prompt 与 rewrite

L3 稳定后，再让 L4 策略对象直接消费：

- 不要重开场
- 同一天轻招呼轻接
- 普通轮次默认 everyday companion
- 只有低落时进入 soothing support
- 任务轮次优先 side-by-side support

这一步主要负责兜底：

- 去掉模板安抚
- 去掉过度总结
- 去掉“像产品一样正确”的收尾
- 给轻招呼保留短回复权
- 在重复主题场景里允许更自然地点出“这已经不是第一次提了”

### 15.4 第四阶段：接入 L5 执行决策包

在文本链路稳定后，再接 L5：

- 记忆回写决策
- 图片 / 语音 / 其他 action 决策
- `clarify_before_action` 对高成本动作的阻断

这一阶段要严格遵守：

- 只输出决策，不直接输出底层 provider 参数
- 低置信度场景不贸然写入长期记忆
- 约束没对齐时不直接触发高成本多模态动作

### 15.5 第五阶段：扩展到网站内聊天版

IM 验证稳定后，再扩展到网站内聊天版，但策略需要允许：

- 更完整的展开
- 更高的信息密度
- 更多 explainability

也就是说：

- IM 版强调“短、活、在场”
- Web 版强调“稳、清楚、可展开”

### 15.6 验收标准

这层落地后的验收，不应只看时延，还应看以下主观指标：

- 是否还会频繁重开场
- 是否还会默认安抚
- 是否像同一个人在同一天里自然续聊
- 是否能区分轻招呼、低落、分享、求建议
- 是否允许一句话就够
- 是否减少模板化两段式输出
- 是否能在低置信度时自动降级为“先确认、不贸然执行”
- 是否能在高成本动作前正确尊重 `clarify_before_action`

---

## 16. 时间与“今日聊天次数”的设计判断

### 16.1 当前时间应该存在，但不该进长期记忆

“现在是早上还是晚上”非常重要，但它不属于长期记忆。

更合理的方式是：

- 作为 runtime temporal context 注入

而不是：

- 写进五层记忆

### 16.2 今日聊天次数有用，但更适合作为会话态

“今天已经聊了几次”对真人感确实有帮助，因为它会影响：

- 该不该重开场
- 该不该重新寒暄
- 该不该写得像重新建立关系

但它仍更适合作为：

- session activity context

而不是长期记忆。

### 16.3 四层调度是否已覆盖这类信息

四层调度已覆盖：

- 最近关系结论
- 近期聊天内容
- 最近原文窗口
- 线程连续性

但通常并未显式覆盖：

- 当前本地时间
- 当前时段
- 今日聊天次数
- 最近 30 分钟互动密度

因此这部分仍应由真人感层补足。

---

## 17. 与现有输出治理手册的关系

建议分工如下：

- `output_governance_handbook_design_v1.0.md`
  负责：
  - 生成边界
  - 输出治理总则
  - 四层调度后数据如何参与生成
  - 多模态一致性与治理约束

- `humanized_output_principles_design_v1.0.md`
  负责：
  - 运行时需要额外补哪些“时刻信息”
  - 如何识别用户情绪 / 意图 / 互动阶段
  - 如何决定当前的表达姿态与输出力度
  - 如何让最终回复更像真人

前者更像：

- 不要跑偏

后者更像：

- 要像谁、在什么时刻、用什么状态来说

---

## 18. 对当前 IM 方向的直接启发

这份原则文档落地后，IM 场景应优先体现以下变化：

1. 同一天里的轻招呼不再重开场。
2. 时间感进入 runtime，不再靠模型自行猜测。
3. 普通陪伴默认走“日常陪伴”，而不是“安抚模板”。
4. 用户低落时才进入安抚承接。
5. 用户问问题时优先切换到“并肩支持”。
6. 用户轻松分享时可以更活一点，不总是稳重兜底。
7. 系统应获得“短回复权”，不再每轮都写成完整段落。

---

## 19. 场景补充库的维护原则

真人感原则文档后续一定还会持续补充场景，但这些补充不应越长越散，而应尽量回收到已有识别框架中，尤其是回收到：

- 情绪识别
- 意图识别
- 互动阶段识别
- 输出姿态识别

建议维护方式如下：

- 主框架保持稳定，不频繁改总结构
- 新发现的真实对话问题，优先判断它属于哪一种“识别遗漏”
- 如果是重复表达、输入矛盾、关系试探、深层诉求偏移等问题，默认先归入“意图识别需要补充的信号”
- 每补一个场景，都写清：
  - 典型输入是什么
  - 当前系统容易误判成什么
  - 更像真人的识别结果应是什么
  - 更像真人的响应动作应是什么

这样文档就不会变成一份杂乱的案例堆积，而会持续长成一份可复用的识别与表达手册。

---

## 20. 下一步建议

建议后续按以下顺序落地：

1. 先把这份原则手册定稿。
2. 在 runtime 中抽象出 `HumanizedDeliveryStrategy`。
3. 先在 IM 场景落第一版：
   - 时间态
   - 情绪态
   - 意图态
   - 输出姿态
4. 再把网站内聊天版接入同一套原则，但允许更长、更完整的表达。
5. 最后再评估是否要把部分策略沉为可配置治理 packet。

---

## 21. 最终结论

SparkCore 现在已经拥有：

- 五层记忆：决定“知道什么”
- 四层调度：决定“拿什么”

下一步真正缺的，不再是更多原始数据，也不是更重的 prompt，而是：

- 一层独立的真人感输出原则

它决定的是：

- 现在处在什么时刻
- 用户当前在什么状态
- 当前最适合哪种互动姿态
- 这一轮该短还是长
- 应该怎么说，才像一个真实的人在这个时刻说出来

因此，真人感输出原则层应被视为 SparkCore 输出系统中的独立执行层，而不是五层记忆或四层调度的附属注脚。
