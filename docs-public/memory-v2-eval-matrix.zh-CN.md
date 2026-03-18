# SparkCore Memory v2 测试矩阵

当 Memory v2 的 schema、scope、update、recall 或 correction 规则变动时，用这套矩阵做重复验证，而不是继续凭感觉判断。

这份矩阵仍然保持轻量。它不是完整评测平台，而是当前 `/chat` 工作台下，Memory v2 的最小可重复验证基线。

## 使用方式

1. 从一个已知正常的本地或试用环境开始。
2. 每次修改 Memory v2 的 schema、召回规则、更新规则或纠错流程后，都重跑同一组 case。
3. 记录：
   - 当前 agent
   - 当前 model profile
   - 最终回复
   - runtime summary 结果
   - Memory panel 中对应记录的可见状态
4. 与前一次结果对比，再决定这次改动是变好还是退化。

打印最新矩阵：

```bash
cd apps/web
npm run quality:eval -- --suite=memory-v2
```

输出 JSON：

```bash
cd apps/web
npm run quality:eval -- --suite=memory-v2 --format=json
```

## Memory v2 Case

### 1. 写入是否落到正确的 category、key、scope

- 优先级：`P0`
- 类别：`memory`
- 目标：确认新的 Memory v2 写入走的是明确的结构化字段，而不是模糊 fallback

准备：

- 工作区里至少有一个可用 agent
- 写入前后都打开 Memory panel

步骤：

1. 发送：`I am a product designer.`
2. 发送：`以后我叫你小芳可以吗？`
3. 检查生成出来的记忆记录

通过标准：

- 职业信息以全局 `profile` 记忆写入
- 昵称信息以 `relationship.agent_nickname` 且 scope=`当前 agent` 写入

### 2. 同 agent 新线程仍记得，换 agent 不串

- 优先级：`P0`
- 类别：`scope`
- 目标：确认 `user_agent` scope 绑定的是 agent id，并能跨新线程稳定生效

准备：

- 同一工作区里至少有两个活跃 agent
- 只给其中一个 agent 写昵称

步骤：

1. 在 agent A 下发送：`以后我叫你小芳可以吗？`
2. 用 agent A 新开线程，问：`你叫什么？`
3. 用 agent B 新开线程，问：`你叫什么？`

通过标准：

- agent A 能召回 `小芳`
- agent B 回退到它自己的 canonical name

### 3. single-slot 更新会替换 active 值，而不是自动 merge

- 优先级：`P0`
- 类别：`update`
- 目标：确认 `relationship.agent_nickname` 这类 single-slot 只保留一个 active 值

准备：

- 使用一个昵称槽位干净的 agent

步骤：

1. 发送：`以后我叫你小芳可以吗？`
2. 再发送：`我改一下，以后叫你阿芳吧。`
3. 用同一个 agent 新开线程，问：`你叫什么？`

通过标准：

- 只有新的昵称保持 active
- 系统不会把多个昵称自动 merge 成一个新答案

### 4. 名称相关直接问法优先走 structured recall

- 优先级：`P0`
- 类别：`recall`
- 目标：确认名字相关直接问法优先走确定性 recall，而不是落回泛化自我介绍

准备：

- 使用一个已经存有 nickname 的 agent

步骤：

1. 问：`你叫什么？`
2. 问：`我以后怎么叫你？`
3. 问：`你不是叫小芳吗？`

通过标准：

- 有昵称时优先返回昵称
- runtime summary 中能看到 relationship memory 命中

### 5. structured memory 命中后，最终回答要保持忠实

- 优先级：`P0`
- 类别：`fidelity`
- 目标：确认 structured recall 命中后，最终回答不会跑偏或自相矛盾

准备：

- 使用 memory-sensitive 的 profile 做对比

步骤：

1. 发送：`I am a product designer.`
2. 新开线程后问：`What profession do you remember that I work in? If you do not know, say you do not know.`
3. 展开 runtime summary

通过标准：

- summary 显示有 memory hit
- 最终回答直接说出 profession
- 不再把“没有对话历史”和“没有长期记忆”混为一谈

### 6. Incorrect / Restore 对昵称召回的影响可预测

- 优先级：`P0`
- 类别：`correction`
- 目标：确认 relationship memory 也遵循相同的纠错闭环

准备：

- 使用一个已经存有昵称的 agent

步骤：

1. 把昵称记忆标记为 `Incorrect`
2. 用同一个 agent 新开线程，问：`你叫什么？`
3. 恢复这条记忆
4. 再用同一个 agent 新开线程，问：`你叫什么？`

通过标准：

- `Incorrect` 后，该 agent 不再召回昵称
- `Restore` 后，该 agent 再次能召回昵称
