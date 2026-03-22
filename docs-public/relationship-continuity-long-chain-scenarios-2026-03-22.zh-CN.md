# SparkCore Relationship Continuity 长链路拟真场景建议 — 2026-03-22

## 这份文档是做什么的

这不是新的 phrase 扩张清单。

它也不是应用层体验打磨清单。

它服务于下一阶段测试主线：

- 不再继续 phrase-by-phrase 补单句
- 改成验证 3 到 5 轮连续对话里，角色是否还能一直像同一个持续角色
- 并从长链路失败点里长出下一批最小 guardrail

也就是说，这份文档默认服务于：

- 底座层的 `role-layer continuity contract`

而不是：

- 继续优化“哪句话更像朋友、更温柔、更口语”

## 进入长链路阶段的原因

当前已经完成的微产品线足够多，单句切口的主要价值已经被吃到：

- brief emotional support
- presence / resume / same-side / shared-push
- supportive / advice / summary / planning 邻近变体
- 多条 `anti-* follow-up` 微产品线

现在更值得验证的是：

- 这些切口串起来以后，体感还能不能稳定
- 角色会不会在第 2 轮、第 3 轮突然掉回默认助手
- advice / explanation / summary 会不会在不该出现的时候冒出来

## 长链路测试原则

1. 每条链路控制在 3 到 5 轮
2. 每条链路只验证一个主风险，不要一条里塞太多目标
3. 每条链路要有清晰的“掉味信号”
4. 如果失败，优先长最小 guardrail，而不是立刻扩 phrase 包
5. 第一轮优先识别“组合后是否失真”，而不是继续扩大单句覆盖面
6. 第一轮长链路不要混入新的 phrasing 探索，先固定已收好的切口
7. 这类长链路默认属于底座层 contract 验证，不承担应用层体感精修任务

更完整的分层边界见：

- [relationship-continuity-test-layering-2026-03-22.zh-CN.md](/Users/caoq/git/sparkcore/docs-public/relationship-continuity-test-layering-2026-03-22.zh-CN.md)

## Observation Record Template

第一轮及后续 rerun 的长链路记录，统一优先使用下面这组字段。

### 必填字段

- `scenario_pack`
- `case_id`
- `scenario_verdict`
- `first_failing_turn`
- `drift_dimension`
- `attribution_note`

### 可选字段

- `main_developer_reason`
- `answer_strategy_reason_code`
- `continuation_reason_code`
- `reply_language_source`
- `memory_used_or_recalled_memories`
- `approx_context_pressure / long_chain_pressure_candidate`

### 记录约束

- 这套模板用于让 observation 更结构化，不用于引入新的自动判断复杂度
- 优先记录一个稳定的 `scenario_verdict`，不要把记录重新拆回碎片化的逐句感受
- 如果场景通过，仍然建议记录：
  - `scenario_verdict: holds as one continuing role`
  - `first_failing_turn: none`
  - `drift_dimension: none`
- 如果场景失败，先写最早失真轮次，再写最小 drift 维度，最后补一条轻量 `attribution_note`

## 建议优先顺序

1. `anti-analysis -> brief catch -> gentle carry-forward`
2. `anti-comforting -> presence confirmation -> resume-the-rhythm`
3. `same-side -> shared-push -> light closing`
4. `anti-advice -> brief steadying -> step-by-step guidance`
5. `anti-redirection -> companion-style explanation -> short summary`

---

## 场景 1：anti-analysis -> brief catch -> gentle carry-forward

### 用户链路

1. `我现在有点乱，你先别急着分析我。`
2. `你先接我一句就好。`
3. `你再陪我往下走一点。`

### 要验证的核心

- 第 1 轮不要立刻进入分析姿态
- 第 2 轮要能短短接住，而不是空泛 continuation
- 第 3 轮能轻轻往前带半步，但不要膨胀成 formal advice

### 主要掉味信号

- 第 1 轮就开始解释用户状态
- 第 2 轮变成模板安慰
- 第 3 轮变成“第一步你应该……”式建议

### 失败模式优先级

1. 重新开始分析
2. 过早给建议
3. generic continuation
4. 口吻从“接住”滑回中性助手

### 场景级 verdict 候选

- `holds as one continuing role`
- `soft drift toward analysis`
- `soft drift toward advice`
- `soft drift toward generic continuation`
- `needs targeted phrase fix`
- `needs chain-level guardrail`

### 为什么优先

这是当前已收微线之间最自然的串联，也是最能验证“从被动承接到轻推半步”的连续体感的一条链。

---

## 场景 2：anti-comforting -> presence confirmation -> resume-the-rhythm

### 用户链路

1. `你先别急着安慰我。`
2. `你还在这儿陪我，对吧。`
3. `好，那你慢慢继续和我说。`

### 要验证的核心

- 第 1 轮不要掉进 canned comfort
- 第 2 轮能确认“我还在”，但不要转 capability / identity explanation
- 第 3 轮能顺着刚才的关系线慢慢继续，不重新开场

### 主要掉味信号

- 第 1 轮还是忍不住安慰
- 第 2 轮开始解释“我会一直支持你”
- 第 3 轮突然切成总结或新一段正式说明

### 失败模式优先级

1. 先说不安慰，后面又滑回安慰模板
2. presence 做成空泛陪伴
3. `resume` 做成建议味推进
4. 后两轮不再像同一个人

### 场景级 verdict 候选

- `holds as one continuing role`
- `soft drift toward canned comfort`
- `soft drift toward generic continuation`
- `soft drift toward advice`
- `needs targeted phrase fix`
- `needs chain-level guardrail`

### 为什么优先

这条链专门测“不要安慰”之后，角色还能不能稳稳留在关系里，而不是因为不安慰就变得空或冷。

---

## 场景 3：same-side -> shared-push -> light closing

### 用户链路

1. `你先站我这边。`
2. `那我们先一起把这一点弄过去。`
3. `你最后帮我把这段收一下。`

### 要验证的核心

- 第 1 轮要有 same-side 感，但不能滑成立场系统
- 第 2 轮要有轻量共同行动感，但不能进入正式 planning
- 第 3 轮要能收尾，不掉成 detached recap

### 主要掉味信号

- 第 1 轮显得过度附和
- 第 2 轮变成步骤清单
- 第 3 轮像一个中性总结器，而不是同一个人在收尾

### 失败模式优先级

1. same-side 做成过度附和
2. shared-push 变成 formal planning / step list
3. light closing 变成 detached recap
4. 到最后不再像同一个持续角色

### 场景级 verdict 候选

- `holds as one continuing role`
- `soft drift toward over-alignment`
- `soft drift toward planning`
- `soft drift toward detached recap`
- `needs targeted phrase fix`
- `needs chain-level guardrail`

### 为什么优先

这条链最贴长期陪跑产品里的“陪住我、一起过一下、然后轻轻收住”。

---

## 场景 4：anti-advice -> brief steadying -> step-by-step guidance

### 用户链路

1. `你先别急着给我建议。`
2. `你先帮我缓一下，再说。`
3. `好，你再陪我理一步。`

### 要验证的核心

- 第 1 轮能压住 advice impulse
- 第 2 轮能先稳一下，不分析、不总结
- 第 3 轮能进入小步 guidance，但仍保留关系 continuity

### 主要掉味信号

- 第 1 轮直接给建议
- 第 2 轮变成 generic comfort
- 第 3 轮一进 guidance 就变成 detached task mode

### 失败模式优先级

1. 第 1 轮过早给建议
2. 第 2 轮稳一下没成形，变成 generic comfort / summary filler
3. 第 3 轮一进 guidance 就掉进 detached task mode
4. 从 steadying 过渡到 guidance 时失去同一角色体感

### 场景级 verdict 候选

- `holds as one continuing role`
- `soft drift toward advice`
- `soft drift toward generic comfort`
- `soft drift toward detached task mode`
- `needs targeted phrase fix`
- `needs chain-level guardrail`

### 为什么优先

这条链最能测“不要建议”不等于“不能带着往前走”，也是对当前 step-by-step 相关微线的更高层复验。

---

## 场景 5：anti-redirection -> companion-style explanation -> short summary

### 用户链路

1. `你先别岔开话题。`
2. `那你就简单陪我理一下。`
3. `最后你帮我收一句就行。`

### 要验证的核心

- 第 1 轮不要回避用户当前点
- 第 2 轮能进入 companion-style explanation，而不是 explanation taxonomy
- 第 3 轮能短收，不掉成硬总结

### 主要掉味信号

- 第 1 轮仍然漂开
- 第 2 轮进入中性说明文
- 第 3 轮像模板化 summary

### 为什么优先

这条链会直接暴露“解释模式”和“关系模式”之间是否能平顺切换。

## 建议执行方式

### 第一轮只挑 2 条

建议先跑：

1. `anti-analysis -> brief catch -> gentle carry-forward`
2. `anti-comforting -> presence confirmation -> resume-the-rhythm`

原因：

- 这两条最能代表当前阶段已打下的微线
- 风险清晰
- 一旦失败，也最容易长出最小 guardrail
- 而且都可以完全使用已经收好的 phrasing，不会把“组合失真”和“新 phrasing 漏洞”混在一起

### 失败后的处理顺序

如果长链路失败，建议按这个顺序处理：

1. 先判断是哪个节点掉味
2. 再判断是 `链路失真` 还是 `局部 phrase 漏洞`
3. 如果是链路失真，优先看 answer-shape precedence / continuity-preserving instruction / chain-level guardrail
4. 如果是局部 phrase 漏洞，再考虑回去补最小 phrasing issue
5. 不要一失败就自动退回 phrase-by-phrase 的旧路径

## 下一阶段的产出形式建议

下一阶段更适合产出：

- 1 份长链路场景运行记录
- 1 份失败点归因表
- 由失败点长出来的少量 guardrail issue

而不是：

- 更多 phrase-by-phrase 的连续 issue 扩张
