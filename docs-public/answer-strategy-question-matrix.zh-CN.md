# SparkCore 回答策略问法类型矩阵

当你需要继续调回答忠实度时，优先参考这张矩阵，而不是继续靠零散 prompt 调整。它的目标是把 direct recall 和 open-ended generation 的边界收成一小组明确问法类型。

这份矩阵刻意保持轻量。它不是 planner、router，也不是重型规则引擎，只是当前 runtime 层用来指导“什么时候 structured recall 应该更强、什么时候回答可以更开放但仍受记忆约束”的基线。

## 优先级表

| 问法类型 | 确定性优先级 | 优先策略 | 简短规则 |
| --- | --- | --- | --- |
| 明确事实直问 | 高确定性 | `structured-recall-first` | 有对应槽位时，优先直接回答那个事实。 |
| 关系确认直问 | 高确定性 | `relationship-recall-first` | 先用 relationship memory，再回退 canonical identity。 |
| 模糊跟进 | 半约束 | `same-thread-continuation` | 先延续同线程语言和关系风格，再考虑远处默认值。 |
| 开放式建议 | 低确定性 | `grounded-open-ended-advice` | 回答保持自然，但仍受记忆约束，不要变成 rigid fact dump。 |
| 开放式总结 | 低确定性 | `grounded-open-ended-summary` | 回答保持总结/介绍形态，同时自然体现相关记忆与关系线索。 |
| 其他问法 | 半约束 | `default-grounded` | 保留记忆边界，但不要硬套直问事实的回答方式。 |

## 问法类型

### 1. 明确事实直问

例子：

- `What profession do you remember that I work in?`
- `你记得我做什么工作吗？`
- `我喜欢什么样的回复方式？`

优先策略：

- `structured-recall-first`

说明：

- 优先使用确定性的 structured recall。
- 直接回答被问到的事实。
- 不要把答案改写成泛泛建议。

### 2. 关系确认直问

例子：

- `你叫什么？`
- `我以后怎么叫你？`
- `你应该怎么称呼我？`

优先策略：

- `relationship-recall-first`

说明：

- 优先使用 relationship recall，再回退到 canonical identity。
- 有 nickname / preferred-name 时优先用它们。
- 只有关系槽位为空时，才回退到 canonical naming。

### 3. 开放式建议

例子：

- `你会怎么帮我规划这周？`
- `What should I do next given what you know about me?`

优先策略：

- `grounded-open-ended-advice`

说明：

- 回答要自然、偏行动建议。
- 召回的记忆作为背景约束使用。
- 不要把整条回答写成生硬的事实堆砌。

### 4. 开放式总结

例子：

- `请简单介绍一下你自己。`
- `简单总结一下你对我的了解。`

优先策略：

- `grounded-open-ended-summary`

说明：

- 回答仍然应该像总结或自我介绍，而不是 facts dump。
- 相关事实和 relationship 线索要自然体现在表达里。
- 不要忽略记忆，但也不要机械复述槽位。

### 5. 模糊跟进

例子：

- `那接下来呢？`
- `然后呢？`
- `再确认一次？`

优先策略：

- `same-thread-continuation`

说明：

- 优先延续当前线程已经形成的语言、关系风格和称呼。
- 不要突然切回默认中性语气。
- 当跟进很短、很模糊时，同线程连续性优先于远处默认值。

## 默认规则

如果某条消息不明显属于以上类型：

- 使用 `default-grounded`
- 让回答自然地受相关记忆约束
- 不要漂移到没有依据的事实
- 也不要在用户并没有直问事实时，过度套用 structured recall
