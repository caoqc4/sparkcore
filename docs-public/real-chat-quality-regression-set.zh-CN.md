# SparkCore 真实对话质量回归样例集

当 runtime 指令、回答忠实度、语言处理或 relationship 风格行为发生变化时，使用这组固定样例来回归，而不是只靠临场聊天感觉判断。

这份样例集刻意保持轻量。它不是重型评测平台，而是针对当前 `/chat` 工作台的一组可重复执行的真实对话质量基线；每个 case 都尽量写成 3 到 5 轮的短链路，而不是一次性的单点检查。

## 如何使用

1. 从一个已知稳定的本地或试用环境开始。
2. 每次发生重要 runtime、prompt 或 profile 变更后，重复跑同一组样例。
3. 记录：
   - 当前 agent
   - 当前 model profile
   - 最终回答
   - runtime summary 结果
4. 与同一基线对比，再判断这次改动到底是变好还是变差。

打印最新回归样例：

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat
```

输出 JSON：

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat --format=json
```

## 真实对话样例

### 1. 同一个 agent 的昵称 / 称呼偏好在新 thread 和后续短跟进中仍然连续

- 优先级：`P0`
- 类别：`thread`
- 目标：确认 relationship 连续性可以跨同一个 agent 的新 thread，并且在短跟进里继续保留，而不是只成功一次

步骤：

1. 发送：`以后我叫你小芳可以吗？`
2. 再发送：`以后你叫我阿强可以吗？`
3. 用同一个 agent 新建 thread
4. 提问：`请简单介绍一下你自己。`
5. 再发送：`那接下来呢？`

成功标准：

- 新 thread 里仍会使用昵称和用户称呼偏好
- 短跟进里仍会保留相同的 relationship 线索
- runtime summary 仍显示 relationship memory 命中

### 2. 用户职业在一小串直接追问里仍然忠实体现

- 优先级：`P0`
- 类别：`fidelity`
- 目标：确认命中的 profession 记忆会在多于一轮的直接追问中被直接说出来，而不是第一轮正确、第二轮又变模糊

步骤：

1. 发送：`I am a product designer.`
2. 新建一个 thread
3. 提问：`What profession do you remember that I work in? If you do not know, say you do not know.`
4. 再追问：`So what kind of work do I do?`

成功标准：

- 两轮直接追问都明确说出 `product designer`
- 不再把“没有对话历史”和“没有长期记忆”混为一谈

### 3. 回复在多轮里优先跟随当前用户最后一条消息语言，而不是漂移

- 优先级：`P0`
- 类别：`language`
- 目标：确认当前轮用户消息的主语言在多轮短对话里仍拥有最高优先级

步骤：

1. 先发送一条英文消息，例如：`Please introduce yourself briefly.`
2. 再发送一条中文消息，例如：`你记得我做什么工作吗？`
3. 再发送一条较短的中文跟进，例如：`那接下来呢？`
4. 展开后面回复的 runtime summary

成功标准：

- 后一个中文问题收到中文回复
- 后面的短中文跟进也继续保持中文
- 前面的英文上下文或英文记忆不会把这条回复重新拉回英文

### 4. relationship 风格从开场到收尾型问题都保持可感知连续

- 优先级：`P0`
- 类别：`fidelity`
- 目标：确认 relationship 风格不只是“被记住”，而是在同一线程内从开场到中段再到收尾型问题里持续“被演出来”

步骤：

1. 先写入：`以后和我说话轻松一点，可以吗？`
2. 提问：`请简单介绍一下你自己。`
3. 再问：`接下来你会怎么帮助我？`
4. 再问：`最后你会怎么陪我把事情推进下去？`

成功标准：

- 多轮回复都保持较轻松、一致的语气
- 同线程连续性优先于远处默认值

### 5. incorrect / restore 会在多轮后续对话里稳定改变 recall 资格

- 优先级：`P0`
- 类别：`correction`
- 目标：确认纠错会在多于一轮的后续真实对话里持续生效，而不只是 memory 行本身状态变了

步骤：

1. 把一条昵称或职业 memory 标记为 `Incorrect`
2. 新建 thread，再问同一个直问问题
3. 再追问：`那你现在还记得吗？`
4. Restore 这条 memory
5. 再新建一个 thread，重复同样问题
6. 再追问：`那你现在还记得吗？`

成功标准：

- `Incorrect` 后，这条 memory 不再参与后续 recall
- `Restore` 后，它会重新参与后续 recall
- 这个纠错结果在连续多轮里保持稳定
