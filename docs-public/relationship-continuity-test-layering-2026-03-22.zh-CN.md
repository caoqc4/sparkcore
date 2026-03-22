# SparkCore Relationship Continuity 测试分层建议 — 2026-03-22

## 这份文档是做什么的

这份文档只回答一件事：

- 当前这批 `relationship continuity / reply-quality` 测试，哪些应继续留在能力底座层
- 哪些不该再继续在底座层深挖，而应后移到具体应用层

它不是新的 phrase 扩张计划，也不是新的测试清单。

## 当前阶段判断

当前我们首先在做的是：

- 一套 `role-layer capability base`

而不是：

- 某个具体应用形态里的最终回复体验

前一阶段大量围绕：

- phrasing
- relationship continuity
- supportive / closing / explanation
- anti-* restraint

的测试，并不是没有价值。它们的主要价值在于帮助我们把一批 `role-layer continuity contract` 基本收出来，例如：

- same-thread continuation 是否成立
- relationship line 是否保住
- 自然 follow-up 是否会掉回默认路径
- supportive / advice / summary / closing 是否会塌成 generic continuation
- anti-analysis / anti-advice / anti-generic-continuation 这些底层约束是否守得住
- 更长一点的链路里，角色是否会慢慢滑回中性助手

这些是底座层应该关心的内容。

但继续 phrase-by-phrase 无限往下补，边际收益已经明显下降，而且开始接近：

- 把应用层的回复体验打磨，提前压到能力底座层来做

## 一、应继续保留在底座层的测试

### 1. Role-layer continuity contract

这一层建议继续保留：

- `same-thread continuation`
- `relationship line preservation`
- `language continuity`
- `naming continuity`
- `stance continuity`
- natural follow-up 不应轻易掉到默认路径
- `anti-analysis / anti-advice / anti-generic-continuation` 的基础守护

这类测试关注的是：

- 底座是否还能保持同一个持续角色

而不是：

- 某一句到底有多口语、多温柔、多像朋友

### 2. 少量代表性的 answer-shape 覆盖

底座层仍然需要 answer-shape coverage，但只需要每类保留少量代表点，不再继续扩 phrasing 包。

建议保留的代表类目：

- self-intro
- explanatory follow-up
- supportive catch
- light advice / next-step
- summary / closing
- presence / resume
- same-side / shared-push
- anti-* restraint

这一层的目的不是穷举说法，而是确认：

- 每类基本 answer shape 都仍然能留在 continuity contract 里

### 3. 长链路组合失真

这应成为下一阶段底座层最重要的测试主线。

要验证的问题是：

- supportive 之后会不会滑成 advice
- anti-analysis 后面几轮会不会又回分析味
- brief catch / gentle carry-forward / presence / resume 串起来后，是否仍像同一个持续角色
- later-turn answer-shape precedence 是否还能守住

这里最关键的不是新 phrasing，而是：

- 组合后是否失真
- drift toward 什么
- 是 `chain distortion` 还是 `local phrase gap`

## 二、不应继续在底座层深挖的测试

### 1. phrase-by-phrase 无限扩张

不建议继续在底座层往下做：

- 再补一个更口语一点的 phrasing
- 再补一个 very-nearby natural variant
- 继续扩越来越细的中文近义句

这类工作在前一阶段已经足够说明问题，继续下去的主要风险是：

- 维护成本上升
- 产品信息增量变小
- 测试目标重新滑回“扩词”，而不是验证 contract

### 2. 具体角色体感的精细打磨

这些不适合继续在底座层深挖：

- 到底多温柔、多像朋友、多轻
- 一句话回 8 个字还是 18 个字更好
- closing 到底多口语才舒服
- supportive 到底多松弛、多短才最顺

这些已经更接近：

- 具体产品形态里的体验优化

而不是：

- 底座 contract 是否成立

### 3. 表层体验文案的持续优化

这些应后移到应用层：

- explanation copy
- helper copy
- surface 文案微调

除非它们直接破坏底座 contract，否则不建议继续作为底座层主线。

## 三、下一阶段底座层最合理的测试主线

下一阶段底座层不该再继续 phrase 扩张，而应转向：

- 更长链路的组合 contract 验证

核心问题应从：

- 还有哪些说法没补

转成：

- 这些已收好的微能力串起来后，是否仍像同一个持续角色

建议主线：

1. 用 3 到 5 轮长链路拟真场景继续验证组合效应
2. 每条链路只盯一个主风险
3. 失败后先判：
   - `chain distortion`
   - 还是 `local phrase gap`
4. 只从长链路失败里长出最小 guardrail
5. 不再默认把失败转成新的 phrasing issue

## 四、哪些测试更适合后移到应用层

这些更适合在具体应用形态里再验证：

- 不同 persona 的朋友感强弱
- supportive 文案到底多短、多柔和、多松弛
- closing 的口语度与舒适度
- explanation / helper / UI 表层 copy 的持续微调
- 同一 contract 之上的“回复美学”
- 在具体端形态里，用户是否觉得回答“更顺”“更舒服”“更贴”

这些不是不重要，而是：

- 更适合在应用层里围绕具体产品体验再优化

## 五、按当前标准是否可以阶段性收停

结论：

- 当前这一轮底座层 `relationship continuity / reply-quality` 测试，可以阶段性收停

这里的“收停”不是指以后都不再测，而是指：

- 不再默认继续往下扩张这一轮的 phrasing / variant / 微体感优化
- 只在出现新的 failure theme 时，再重启增量测试

### 为什么现在可以收停

因为底座层当前已经具备：

1. continuity contract 的代表性覆盖
   - `same-thread continuation`
   - `relationship line preservation`
   - `language / naming / stance continuity`
   - `anti-analysis / anti-advice / anti-generic-continuation`

2. 少量代表性的 answer-shape coverage
   - self-intro
   - explanatory follow-up
   - supportive catch
   - light advice / next-step
   - summary / closing
   - presence / resume / same-side / shared-push
   - anti-* restraint

3. 长链路组合验证已经不是点状
   - 第一批长链路已完成：验证、修口、rerun
   - 第二批长链路已完成：验证、修口、rerun
   - rerun verdict 已经回到 `holds as one continuing role`

### 为什么现在不该默认继续扩张

因为再往下继续新增的内容，大概率会落到：

- very-nearby phrasing
- 朋友感 / 温柔度 / 松弛度 的细体感优化
- surface copy / helper copy / explanation copy 的微调

这些按当前分层标准，都不应再作为底座层默认主线继续推进。

### 收停后的默认动作

1. 保留现有 contract tests、代表性 smoke、long-chain scenarios
2. 不再默认新增 phrase issue
3. 下一次重启增量测试的触发条件应是：
   - 新的 long-chain failure theme
   - 新的 answer-shape precedence drift
   - 新的 contract break，而不是新的近义说法

## 一句话结论

当前这批测试已经完成了它在底座层最有价值的工作：

- 把一组 `relationship continuity / answer-shape continuity` contract 基本收出来了

接下来底座层应继续保留：

- continuity contract
- 少量代表性的 answer-shape coverage
- 长链路组合失真验证

而 phrase 近义扩张、角色体感精修、表层文案优化，则应逐步后移到具体应用层。
