# SparkCore Relationship Continuity 阶段总结与覆盖地图 — 2026-03-22

## 这份文档是做什么的

这不是一份完整测试策略，也不是 changelog。

它默认服务于：

- `role-layer continuity contract` 的阶段总结

而不是：

- 具体应用层里的最终回复体验优化

它只回答 3 个问题：

1. 这一阶段我们到底已经收到了哪
2. 哪些微产品线已经可以判定为阶段性收束
3. 下一阶段更值得做什么，而不是继续 phrase-by-phrase 扩张

当前结论很明确：

- 这一阶段的主要成果，不再只是“通过 formal gate”
- 而是把 `relationship continuity` 拆成一组可重复验证的微产品线，并逐条跑成了：
  - direct case
  - natural variant
  - focused smoke
  - baseline confirmation
- 到 2026-03-22 为止，继续在线性补更多相邻 phrasing 的边际收益已经明显下降

## 阶段判断

### 当前阶段已经完成了什么

当前我们已经不是在验证“模型会不会完全掉线”，而是在验证：

- 用户换成更自然的说法时
- 角色还能不能继续像同一个持续角色
- 而不是掉回：
  - generic continuation
  - generic advice
  - canned comfort
  - detached recap
  - neutral explanation

这件事已经从“少数点状 case”推进成了“多条微产品线”。

### 为什么现在应该先收束

如果继续沿当前节奏往下补，风险不是测不出东西，而是：

- 新增 case 越来越接近近义重复
- 每条都要补 focused smoke / baseline confirmation / issue comment
- 维护成本已经开始高于新增的产品信息量

所以接下来的重点，不应该再是：

- “还有哪句别评判我 / 别分析我 / 别安慰我没补到”

而应该转成：

- “这些微线在更长链路里串起来时，角色还能不能一直不掉味”

## 覆盖地图

### A. 已收束：关系 continuity 基础入口

- self-intro continuity
- natural continuation phrasing
- helper 文案减重与 agent entry clarification

阶段判断：

- 这一层已经不是当前主要缺口
- 后续除非真实使用再暴露摩擦，否则不建议继续细抠 helper / entry copy

### B. 已收束：brief emotional support micro-line

这一条线已经形成了连续骨架：

- `轻轻接一下`
  - `你先轻轻接我一下。`
- `朋友式接住`
  - `你先接住我一下。`
- `一句就好`
  - `你就回我一句就好。`
- `先缓一下`
  - `你先帮我缓一下，再说。`
- `轻轻往前带半步`
  - `你先帮我缓一下，再陪我往下走一点。`
- `再陪一句`
  - `你就继续陪我说一句。`
- `恢复节奏`
  - `好，那你慢慢继续和我说。`

同时这一条线也已经补了收束性 guardrail：

- one-line soft catch 不要塌成 empty continuation
- gentle carry-forward 不要膨胀成 formal advice

阶段判断：

- 这条线已经可以视为阶段性完整
- 不建议继续在线上补更多 catch / steadying 同义句

### C. 已收束：supportive / advice / summary / planning 邻近自然变体

这一组主要收的是：

- light supportive follow-up
- light advice follow-up
- short summary follow-up
- carry-forward planning
- step-by-step guidance

还有更贴近真实口语的近邻变体：

- light reassurance
- companion-style explanation
- natural reassurance variant
- natural companion explanation variant

阶段判断：

- 这组已经足以支撑“角色在常见关系型短跟进里仍像同一个人”的判断
- 继续扩张 taxonomy 的收益已经不高

### D. 已收束：closing / resume / presence / same-side / shared-push

这一组已经覆盖了：

- light closing
- companion-style closing
- additional closing variant
- gentle resume-the-rhythm
- natural resume variant
- presence-confirming follow-up
- natural presence-confirmation variant
- same-side follow-up
- natural same-side variant
- light shared-push
- natural shared-push variant

这一层的重要性在于：

- 它把“陪着你”从情绪承接延伸到了：
  - 轻收尾
  - 轻恢复节奏
  - 轻确认同在
  - 轻同侧站位
  - 轻共同行动

阶段判断：

- 这一组已经覆盖到了产品体感上最值钱的一段
- 后续应优先看更长链路组合，而不是继续补单句变体

### E. 已基本收束：anti-* follow-up 微产品线

这一大组已经覆盖到了多个相互独立的关系时刻，不再只是一个泛化 bucket。

当前已收的主要子线：

- non-judging
- anti-lecturing
- anti-correction
- anti-conclusion
- anti-labeling
- anti-tagging
- anti-mischaracterization
- anti-overreading
- anti-analysis
- anti-probing
- anti-rushing
- anti-solutioning
- anti-comforting
- anti-advice
- anti-minimizing
- anti-normalizing
- anti-comparing
- anti-redirection
- anti-definition
- anti-categorizing

其中大部分已经具备：

- direct case
- natural variant

少数只有 direct case 的线，也已经至少有 focused smoke 和 baseline confirmation，因此作为“代表性切口”已足够说明问题。

阶段判断：

- `anti-*` 线已经接近一轮完整收束
- 继续往下补，很容易进入中文近义句穷举
- 这一轮的目标已经完成：把“不要立刻变成另一个姿态”收成了可复验微线

## 当前收束标准回顾

后续是否继续开新小任务，默认按这几个条件判断：

1. 一条微产品线至少已经形成连续骨架
2. 同一线内最好已经有 direct case + natural variant
3. 新增 case 必须带来明确体感增量
4. 如果连续 2 到 3 条都只是近义重复，就应判定该线接近收束
5. 当这条线已经足够支撑产品判断时，应切到下一条新关系时刻，而不是继续在线上打磨

按这套标准，到 2026-03-22 为止：

- `brief emotional support`：已收束
- `presence / resume / same-side / shared-push`：已收束
- `supportive / advice / summary / planning`：已阶段性收束
- `anti-* follow-up`：已接近一轮完整收束

## 下一阶段建议

### 第一优先级：阶段总结与覆盖地图

这一项就是当前文档本身。

价值：

- 停止无效扩张
- 建立“已经收到了哪”的全局认知
- 给后续长链路测试一个明确起点

### 第二优先级：3~5 条长链路拟真场景

下一阶段真正该测的，已经不是单句，而是更完整的连续体验。

更值得验证的问题是：

- 当用户先说“你先别急着分析我”
- 后面又说“你先接我一句”
- 再说“你陪我理一步”
- 角色还能不能一直不掉味

建议下一阶段优先挑 3 到 5 条长链路拟真场景，例如：

1. `anti-analysis -> brief catch -> gentle carry-forward`
2. `anti-comforting -> presence confirmation -> resume-the-rhythm`
3. `same-side -> shared-push -> light closing`
4. `anti-advice -> brief steadying -> step-by-step guidance`
5. `anti-redirection -> companion-style explanation -> short summary`

这些场景的核心不是 phrase 命中，而是：

- 同一角色体感是否持续
- 中间会不会突然切成默认助手
- advice / explanation / summary 是否在不该出现时冒出来

### 第三优先级：从长链路失败里长出来的收束性 guardrail

这类 guardrail 不建议先预设一堆。

更合理的方式是：

- 先跑长链路拟真场景
- 看失败点暴露在哪里
- 再按暴露点补最小 guardrail

也就是说，下一阶段 guardrail 的来源应该是：

- 长链路里真实暴露的掉味点

而不是：

- 继续凭感觉预设更多单句边界

## 一句话结论

这一阶段已经完成了它该完成的事：

- 把 `relationship continuity` 从少数规则，收成了一组可复验的微产品线
- 并且已经足够支持更高层的产品判断

## 测试分层校准

当前需要明确一个边界：

- 这批测试首先服务于能力底座层
- 不是继续把应用层的回复体感优化提前压到 runtime 底座上做

因此，从这一阶段往后：

- 底座层继续保留：
  - continuity contract
  - 少量代表性的 answer-shape coverage
  - 长链路组合失真验证
- 不再继续默认推进：
  - phrase-by-phrase 近义扩张
  - 朋友感 / 温柔度 / 松弛度 的持续微调
  - explanation / helper / surface 文案的持续优化

更完整的边界说明见：

- [relationship-continuity-test-layering-2026-03-22.zh-CN.md](/Users/caoq/git/sparkcore/docs-public/relationship-continuity-test-layering-2026-03-22.zh-CN.md)

按这套新标准回看，当前这一轮底座层测试已经满足阶段性收停条件：

- representative contract coverage 已足够
- 两批长链路都已完成验证、修口、rerun
- 继续默认扩张会明显滑向应用层体验打磨

下一阶段更值得做的，不是继续补单句，而是：

- 用 3 到 5 条长链路拟真场景，验证这些微线串起来之后，角色还能不能一直像同一个持续角色。
