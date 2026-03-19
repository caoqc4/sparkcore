# SparkCore 真实对话质量回归样例集

当 runtime 指令、回答忠实度、语言处理或 relationship 风格行为发生变化时，使用这组固定样例来回归，而不是只靠临场聊天感觉判断。

这份样例集刻意保持轻量。它不是重型评测平台，而是针对当前 `/chat` 工作台的一组可重复执行的真实对话质量基线；每个 case 都尽量写成 5 到 8 轮的更长链路，并要求记录明确的“衰减点”，而不是一次性的单点检查。

## 如何使用

1. 从一个已知稳定的本地或试用环境开始。
2. 每次发生重要 runtime、prompt 或 profile 变更后，重复跑同一组样例。
3. 记录：
   - 当前 agent
   - 当前 model profile
   - 最终回答
   - runtime summary 结果
   - runtime summary 默认看起来是否仍像简短用户解释，而不是开发排障面板
   - 如果开始变差，是第几轮开始出现风格衰减、语言漂移或 structured recall 减弱
   - 如果 case 失败，再额外记录 scenario pack、失败 turn、漂移维度，以及一条主要 developer-diagnostics reason
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

## 失败归因记录

当一条 real-chat case 失败时，不要只写“这条掉了”，而是记录第一条出问题的 turn，并附一条轻量归因。

必填字段：

- `scenario_pack`
- `case_id`
- `failed_turn`
- `drift_dimension`
- `main_developer_reason`

支持的漂移维度：

- `fidelity`
- `language`
- `relationship-continuity`
- `correction-consistency`

可优先参考的 developer reason clue：

- `answer_strategy_reason_code`
- `continuation_reason_code`
- `reply_language_source`
- `memory_used / recalled_memories`

记录原则：

- 记录第一次出现漂移的 turn，不要只记最后已经完全坏掉的那一轮
- 漂移维度尽量只选最小、最能解释问题的那一个
- developer reason 保持轻量，只抓最能解释失败 turn 的那一条 clue，不要整段贴完整 metadata

## 场景包

这组回归样例现在按轻量 `scenario pack` 分组，方便把更长链路的回归执行、记录和后续扩展拆成几个稳定场景，而不是继续维护一张平铺清单。

- `关系维持包`：检查同一个 agent 下的新 thread 连续性、昵称/用户称呼延续，以及 relationship 风格在更长链路里的稳定性。
- `记忆确认包`：检查已记住的事实在多轮直接确认型追问里是否还能继续被明确说出来，而不是慢慢变模糊。
- `混合语言包`：检查短而模糊的跟进是否仍优先服从用户当前最后一条消息的语言，而不是漂回更早上下文。
- `纠错后续包`：检查 `Incorrect` / `Restore` 是否会稳定影响后续多轮回答，而不只是 memory panel 里的状态变了。

## 真实对话样例

## 关系维持包

### 1. 同一个 agent 的昵称 / 称呼偏好在新 thread 和更后面的短跟进中仍然连续

- 场景包：`关系维持包`

- 优先级：`P0`
- 类别：`thread`
- 目标：确认 relationship 连续性可以跨同一个 agent 的新 thread，并且在短跟进里继续保留，而不是只成功一次

步骤：

1. 发送：`以后我叫你小芳可以吗？`
2. 再发送：`以后你叫我阿强可以吗？`
3. 用同一个 agent 新建 thread
4. 第 1 轮提问：`请简单介绍一下你自己。`
5. 第 2 轮发送：`那接下来呢？`
6. 第 3 轮提问：`那你接下来会怎么称呼我？`
7. 第 4 轮发送：`好，继续。`
8. 第 5 轮提问：`最后再简单介绍一下你自己。`

成功标准：

- 新 thread 里仍会使用昵称和用户称呼偏好
- 后面的短跟进里仍会保留相同的 relationship 线索
- runtime summary 仍显示 relationship memory 命中
- 如果昵称或称呼连续性开始减弱，能明确记下是第几轮开始掉

失败条件：

- 只要在同一个 agent 且 relationship memory 仍应生效的前提下，昵称有一轮丢失，就算从这一轮开始掉了
- 只要在同一个 agent 且 relationship memory 仍应生效的前提下，用户称呼偏好有一轮丢失，就算从这一轮开始掉了
- 如果 relationship memory 按理应继续生效，但 runtime summary 不再显示 relationship memory 命中，也算掉

### 2. relationship 风格在更长链路里从开场到收尾型问题都保持可感知连续

- 场景包：`关系维持包`
- 优先级：`P0`
- 类别：`fidelity`
- 目标：确认 relationship 风格不只是“被记住”，而是在同一线程内从开场到中段再到收尾型问题里持续“被演出来”

步骤：

1. 先写入：`以后和我说话轻松一点，可以吗？`
2. 第 1 轮提问：`请简单介绍一下你自己。`
3. 第 2 轮再问：`接下来你会怎么帮助我？`
4. 第 3 轮再问：`如果我今天状态不太好，你会怎么和我说？`
5. 第 4 轮再问：`最后你会怎么陪我把事情推进下去？`
6. 第 5 轮再问：`那你再简单鼓励我一句。`

成功标准：

- 多轮回复都保持较轻松、一致的语气
- 同线程连续性优先于远处默认值
- 如果 relationship 风格开始变平，能明确记下是第几轮开始掉

失败条件：

- 只要某一轮明显掉回默认中性语气，而不是继续保持已形成的 relationship 风格，就算从这一轮开始掉了
- 如果开场、解释型或收尾型回答不再体现同线程 relationship 风格，而 relationship memory 仍应继续生效，也算掉
- 如果回答内容本身还算正确，但 relationship 表现层已经明显消失，也算掉

### 3. 默认 explanation UI 在 diagnostics 变多后仍保持简短

- 场景包：`关系维持包`
- 优先级：`P1`
- 类别：`explanation`
- 目标：确认普通用户看到的 explanation surface 仍聚焦于一条主要依据和简短结果提示，而不是随着 runtime metadata 增长慢慢变成工程诊断面板

步骤：

1. 展开最新 assistant 回复下方的 runtime summary。
2. 检查 summary headline 和第一条解释语句。
3. 扫描默认可见的 summary 内容，确认没有出现 `answer strategy`、`same-thread continuation`、原始语言检测标签之类仅面向开发排障的表述。

成功标准：

- toggle 和 headline 仍然像面向用户的简短说明
- 展开后的第一层只保留一条主要依据，而不是堆多条主解释
- 默认可见的 summary surface 不出现开发排障字段

失败条件：

- 只要默认 explanation 长回成多条顶层 reason 段落，而不是一条主要依据，就算掉
- 只要默认可见 summary 出现 `answer strategy`、`same-thread continuation` 或原始语言检测字段，也算掉
- 只要 explanation 文案明显变长、变技术化，不再像简短用户说明，也算掉

## 记忆确认包

### 4. 用户职业在更长一串直接追问里仍然忠实体现

- 场景包：`记忆确认包`

- 优先级：`P0`
- 类别：`fidelity`
- 目标：确认命中的 profession 记忆会在多于一轮的直接追问中被直接说出来，而不是第一轮正确、第二轮又变模糊

步骤：

1. 发送：`I am a product designer.`
2. 新建一个 thread
3. 第 1 轮提问：`What profession do you remember that I work in? If you do not know, say you do not know.`
4. 第 2 轮追问：`So what kind of work do I do?`
5. 第 3 轮追问：`Say it again in one short sentence.`
6. 第 4 轮追问：`What do you remember about my work?`

成功标准：

- 后面的直接追问都明确说出 `product designer`
- 不再把“没有对话历史”和“没有长期记忆”混为一谈
- 如果 structured recall 开始减弱，能明确记下是第几轮开始掉

失败条件：

- 只要后续某一轮不再明确说出 `product designer` 或等价职业表达，就算从这一轮开始掉了
- 如果 runtime summary 仍显示相关 memory 命中，但回答没有体现职业记忆，也算掉
- 如果 profession memory 仍应可用，但回答退回成 “不知道” 或泛泛帮助语气，也算掉

## 混合语言包

### 5. 回复在更长多轮里优先跟随当前用户最后一条消息语言，而不是漂移

- 场景包：`混合语言包`

- 优先级：`P0`
- 类别：`language`
- 目标：确认当前轮用户消息的主语言在多轮短对话里仍拥有最高优先级

步骤：

1. 第 1 轮先发送一条英文消息，例如：`Please introduce yourself briefly.`
2. 第 2 轮再发送一条中文消息，例如：`你记得我做什么工作吗？`
3. 第 3 轮再发送：`那接下来呢？`
4. 第 4 轮再发送：`再用一句话说一遍。`
5. 第 5 轮再发送：`ok, now continue in Chinese.`
6. 展开后面回复的 runtime summary

成功标准：

- 后面的中文轮次都收到中文回复
- 后面的短中文跟进也继续保持中文
- 前面的英文上下文或英文记忆不会把这条回复重新拉回英文
- 如果语言开始漂移，能明确记下是第几轮开始漂

失败条件：

- 只要某一轮中文输入在没有明确切语言指令的前提下收到主要英文回复，就算从这一轮开始漂了
- 如果同线程短中文跟进被更早的英文上下文或英文记忆拉回英文，也算掉
- 如果回复语言更听远处历史而不是当前用户最后一条消息，也算掉

## 纠错后续包

### 6. incorrect / restore 会在多轮后续对话里稳定改变 recall 资格

- 场景包：`纠错后续包`

- 优先级：`P0`
- 类别：`correction`
- 目标：确认纠错会在多于一轮的后续真实对话里持续生效，而不只是 memory 行本身状态变了

步骤：

1. 把一条昵称或职业 memory 标记为 `Incorrect`
2. 新建 thread，再问同一个直问问题
3. 第 2 轮再追问：`那你现在还记得吗？`
4. 第 3 轮再追问：`再确认一次？`
5. Restore 这条 memory
6. 再新建一个 thread，重复同样问题
7. 第 5 轮再追问：`那你现在还记得吗？`
8. 第 6 轮再追问：`再确认一次？`

成功标准：

- `Incorrect` 后，这条 memory 不再参与后续 recall
- `Restore` 后，它会重新参与后续 recall
- 这个纠错结果在连续多轮里保持稳定
- 如果纠错行为开始不一致，能明确记下是第几轮开始出现问题

失败条件：

- 如果已经标成 `Incorrect`，但后续任一轮仍像 active 一样继续使用这条 memory，就算掉
- 如果已经 `Restore`，但后续任一轮仍像没恢复一样不使用这条 memory，也算掉
- 如果短跟进里纠错效果开始来回摇摆、不再稳定，也算从那一轮开始掉了
