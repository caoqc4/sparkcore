# SparkCore Stage 1 质量评测样例集

当 prompt、model profile 或 runtime 指令发生变化时，使用这组固定样例来对比质量变化，而不是只靠主观感觉判断。

这份样例集刻意保持轻量。它不是完整评测平台，而是针对当前 `/chat` 工作台的一组可重复执行的基线。

## 如何使用

1. 从一个已知稳定的本地或试用环境开始。
2. 每次发生重要 prompt、模型或 profile 变更后，重复跑同一组案例。
3. 记录：
   - 当前 agent
   - 当前 model profile
   - 最终回答
   - runtime summary 结果
4. 与前一次结果对比，再判断这次改动到底是变好还是变差。

打印最新样例集：

```bash
cd apps/web
npm run quality:eval
```

输出 JSON：

```bash
cd apps/web
npm run quality:eval -- --format=json
```

## Stage 1 样例

### 1. 命中 memory 后的追问仍然忠实使用记忆

- 优先级：`P0`
- 类别：`memory`
- 目标：确认命中的 `profile / preference` 记忆会真正体现在最终回答里，而不是被忽略或说歪

步骤：

1. 发送：`I am a product designer and I prefer concise weekly planning.`
2. 再问：`What profession do you remember that I work in? If you do not know, say you do not know.`
3. 展开 assistant 回复下方的 runtime summary

成功标准：

- runtime summary 显示相关 memory 命中
- 最终回答体现出 profession 这条记忆
- 不再把“没有对话历史”和“没有长期记忆”混为一谈

### 2. 中文输入默认收到中文回复

- 优先级：`P0`
- 类别：`language`
- 目标：确认不需要语言设置页，也能自然跟随中文输入回复

步骤：

1. 发送：`请用两句话介绍你自己，并说明你能如何帮助我。`

成功标准：

- 回复主体为中文
- 不会无故漂到英文

### 3. 英文输入默认收到英文回复

- 优先级：`P0`
- 类别：`language`
- 目标：确认不需要语言设置页，也能自然跟随英文输入回复

步骤：

1. 发送：`Please introduce yourself in two short sentences and explain how you can help me.`

成功标准：

- 回复主体为英文
- 不会无故漂到中文

### 4. thread 切换保持 URL 与上下文一致

- 优先级：`P0`
- 类别：`thread`
- 目标：确认每个 thread 的上下文独立，切换和刷新不会串历史

步骤：

1. 创建两个不同 thread，并分别发不同内容
2. 打开 thread A，确认其最新 preview
3. 切到 thread B，确认内容不同
4. 在 thread B 下刷新页面
5. 再通过 sidebar 回到 thread A

成功标准：

- 刷新后仍停留在当前 thread
- 消息和 runtime summary 不会跨 thread 串线

### 5. incorrect / restore 会稳定改变 recall 资格

- 优先级：`P0`
- 类别：`correction`
- 目标：确认纠错操作会影响后续 recall，且 restore 能稳定恢复

步骤：

1. 选一条明显可测试的 memory，标记为 `Incorrect`
2. 新建 thread，提一个本应命中这条 memory 的问题
3. 恢复这条 memory
4. 再新建 thread，重复同样的问题

成功标准：

- `Incorrect` 后这条 memory 不再参与 recall
- `Restore` 后重新参与 recall

### 6. model profile 切换可在同一组样例上比较

- 优先级：`P0`
- 类别：`model-profile`
- 目标：用同一批样例稳定比较不同 model profile 的质量差异

步骤：

1. 用 profile A 跑 memory-hit follow-up 样例
2. 切到 profile B
3. 在新 thread 中跑同一组问题
4. 对比最终回答和 runtime summary

成功标准：

- runtime summary 能反映当前 profile
- profile 间差异可在同一基线上比较，而不是凭感觉判断
