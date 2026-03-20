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

## 第一轮 8 到 12 Turn 验收固定使用的 Profile × Scenario Pack 组合

第一轮长链路验收先固定成下面这个小矩阵，这样不同人执行和后续重跑时都更容易横向比较：

- `关系维持包` -> `Spark Default`
- `混合语言包` -> `Spark Default`
- `记忆确认包` -> `Spark Memory Sensitive`
- `纠错后续包` -> `Spark Memory Sensitive`

说明：

- 第一轮长链路验收先不把 `Spark Low-Cost Testing` 拉进来
- 当主要比较目标是自然风格、same-thread carryover、语言连续性时，用 `Spark Default`
- 当主要比较目标是直接 recall 忠实度或 correction-aftermath 一致性时，用 `Spark Memory Sensitive`
- 如果后续某轮刻意改了这个矩阵，要显式记录，不要把 profile 变化悄悄混进验收结论里

## 第一轮 8 到 12 Turn 验收固定执行环境

第一轮 gate 还要固定成一套小而明确的环境基线，这样后续重跑时更容易区分到底是产品漂移，还是执行环境漂移。

- 整轮都固定同一套 provider 和 LiteLLM alias 映射
- 显式记录当前 profile 基线：
  - `Spark Default` -> `replicate` / `replicate-gpt-4o-mini`
  - `Spark Memory Sensitive` -> `replicate` / `replicate-claude-4-sonnet`
- 整轮都固定同一套运行环境：
  - 使用同一个 repo revision 和同一个 app build
  - 使用同一个 `LITELLM_BASE_URL` 和 `LITELLM_API_KEY`
  - 不要在跑到一半时改 profile seeds、provider routing 或 model-profile 映射
- 整轮都固定实验开关和 smoke-mode 开关：
  - 如果这轮使用本地 smoke mode，就固定 `PLAYWRIGHT_SMOKE_MODE=1`
  - 整轮都使用同一套 smoke secret 和 smoke credentials
  - 不要在中途切换额外 runtime experiments
- 整轮都固定语言起始条件：
- 每个 scenario pack 都按样例脚本里原本写好的起始语言开始
- 不要在脚本外临时追加语言切换指令
- 这只是第一轮 gate 的基线约束，不是永久产品约束

## 第一轮 8 到 12 Turn 验收固定 Scope

第一轮 gate 要按一轮收口明确的基线验收来跑，而不是边跑边扩的清单。

- 只跑这份文档里已经冻结的 scenario pack
- 不要在中途临时新增 scenario pack 或额外 case
- 不要在中途修改当前验收门槛、结论分类或 `next_action` 映射
- 不要在中途改动已经冻结的 profile 矩阵或执行环境基线
- 如果跑到一半发现新的 runtime bug，不要边修边继续把剩余结果算进同一轮 gate

如果中途必须做有意义的 runtime 修复、prompt 修复或验收规则调整：

- 先停止当前这轮
- 把这轮记录为 incomplete 或 superseded
- 再在更新后的基线上重新开始一轮新 run，不要把修复前后的结果混成同一条 gate 记录

这条 scope freeze 的目的，是保护基线可比性，不是阻止后续补修复。

## 环境噪音处理约定

如果一轮 gate 里出现失败，但失败看起来更像环境或基础设施噪音，而不是产品行为本身，先不要直接把它记成产品漂移。

可先视为环境噪音候选的典型例子：

- 临时网络抖动
- Supabase connect timeout
- smoke harness 在真正执行到产品行为前就失败

处理约定：

- 只有当失败已经提供了明确的产品行为证据时，才把它写进正式 gate 漂移记录
- 如果怀疑是环境噪音，必须先在同一个 frozen baseline、同一个 scenario-pack / profile matrix、同一个 execution environment 下重跑一次
- 只有当 same-baseline rerun 通过时，才可以把前一次事件记为环境噪音而不是产品问题
- 如果 same-baseline rerun 仍然失败，或者同一种失败模式在重跑中复现，就不能再按环境噪音处理

## 第一轮 8 到 12 Turn 验收作为 Milestone Gate

第一轮 `8 到 12 turn` 长链路验收要按 milestone gate 来看，而不是普通回归轮。

它之所以更重要，是因为：

- 如果结果多数落在 `rule-layer issue`，说明项目仍应继续收角色层 runtime 规则
- 如果结果开始逼近 `state-pressure candidate`，说明项目应准备进入 Layer D 设计评审

所以这轮的意义其实是：在真正进入 thread-state 工作之前，先判断当前角色层路线是否还处在舒适边界内。

## Baseline Confirmation Pack

在第一轮 formal long-chain gate 已通过之后，后续轻量复验默认优先引用一组更小的 baseline confirmation pack，而不是每次都临时重新挑 smoke。

这个 pack 当前固定服务于：

- 当前 frozen baseline
- 当前 scenario-pack 集合
- 当前 profile-by-pack matrix

它的作用是：

- 作为 post-change 的轻量确认包
- 帮助后续复验更机械、更低判断成本
- 不替代正式的 formal long-chain gate

当前 baseline confirmation pack 包含 4 条 smoke：

- `Relationship Maintenance Pack`
  - `keeps short continuation after direct preferred-name confirmation on the same agent`
- `Mixed-Language Pack`
  - `keeps explicit Chinese continuation requests in Chinese after the thread already switched`
- `Memory Confirmation Pack`
  - `keeps profession recall follow-ups on the direct-recall path`
- `Correction Aftermath Pack`
  - `keeps correction-aftermath metadata stable for relationship nickname recall`

当前 canonical command：

```bash
cd apps/web
npm run smoke:baseline-confirmation
```

边界说明：

- 这个 pack 不自动随着新 scenario pack 或新 profile matrix 变化而扩展
- 如果 formal gate 的 frozen baseline 发生变化，应显式更新它，而不是默认沿用旧集合
- 后续 rerun 可以直接写“运行 baseline confirmation pack”，不必每次重新展开同一组 smoke 名称

## 什么时候跑 formal gate，什么时候跑 baseline confirmation pack

这两者都保留，但用途不同：

- `formal gate` = 阶段 / 边界判断
- `baseline confirmation pack` = 当前 frozen baseline 上的轻量回归复验

优先跑 baseline confirmation pack 的情况：

- role-layer routing 改动
- answer-shape 或 language-priority 修口
- continuity 相关 runtime 修口
- 其他可能影响当前已通过 frozen baseline 的小型维护改动

这些情况下，默认先跑轻量 pack，不要自动重开 formal gate。

需要重新打开 formal gate 的情况：

- frozen baseline 定义变化
- scenario-pack 集合变化
- profile-by-pack matrix 变化
- thresholds / conclusion taxonomy / gate rule 变化
- 其他可能让“当前 scoped pass 仍然成立”这件事本身失效的改动

如果拿不准：

- 优先先跑 baseline confirmation pack
- 只有当 scoped pass claim 本身可能不再成立时，才重开 formal gate

环境噪音处理继续沿用当前规则：

- 单次 infra 异常默认不直接记为 product drift
- 必须先做 same-baseline rerun
- 只有 same-baseline rerun 通过，才把前一次事件归为 `environment noise`

## Maintainer Checklist：baseline confirmation rerun record

改动后可按下面的短清单执行：

1. 先判断这次改动是否影响当前已通过 frozen baseline
   - 如果是 role-layer routing、answer-shape、language-priority、continuity 相关修口，先跑 baseline confirmation pack
2. 再判断这次改动是否已经触及 scoped pass claim 本身
   - 如果 baseline 定义、scenario-pack 集合、profile-by-pack matrix、thresholds 或 gate rule 变了，改为重开 formal gate
3. 如果复验失败，先判断是否像环境噪音
   - 如果像 infra 异常，先做 same-baseline rerun
   - 只有 rerun 通过，才记为 `environment noise`
   - 如果 rerun 仍失败，再按 `product drift` 处理

这份 checklist 只服务于当前 long-chain / role-layer 维护路径，不替代 formal gate 规则本身。

## 默认记录位置与标题格式

baseline confirmation rerun record 默认按下面的规则落地：

- 默认记到对应改动 issue 的 comment
- 只有当这次 rerun 不对应单一改动 issue 时，才回退到一份轻量 running log

默认标题格式固定为：

- `Baseline confirmation rerun record`

默认字段顺序固定为：

- `command`
- `result`
- `baseline_ref`
- `anomaly_classification`（optional）

术语统一使用：

- `formal gate`
- `baseline confirmation pack`
- `baseline confirmation rerun record`

## Minimal Template：baseline confirmation rerun record

baseline confirmation rerun record 只使用一份很小的结果模板，不复制 formal gate 的完整记录格式。

最小字段：

- `command`
- `result`
- `baseline_ref`

可选字段：

- `anomaly_classification`

只有在确实出现异常时，才填写 `anomaly_classification`。当前建议值：

- `product_drift`
- `environment_noise`
- `none`

记录原则：

- 保持轻量，不补 formal gate 才需要的 conclusion taxonomy
- 只记录这次 baseline confirmation rerun 最小必要的执行结果
- 如果没有异常，`anomaly_classification` 可以省略，或显式记成 `none`

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

## 验收通过标准

下一轮验收先按这套轻量门槛判断：

通过：

- 所有 `P0` case 都没有记录 failing turn
- 没有任何 case 需要补 drift-dimension note，因为没有出现实质性漂移
- 默认 explanation layer 仍保持轻量、面向普通用户

可接受轻微漂移：

- 只有一条 `P1` case 出现轻微漂移，且本轮没有任何 `P0` 失败
- 漂移只出现在单一 turn，并且在同一 case 内可恢复，没有破坏这条 case 的主合同
- 本轮仍然记录了 first failing turn、drift dimension 和一条 main developer reason，方便后续继续观察

必须开 issue：

- 任意一条 `P0` case 记录了 failing turn
- 某条漂移已经明确打破该 case 的主合同：`fidelity`、`language`、`relationship-continuity` 或 `correction-consistency`
- 同一种 drift dimension 在同一轮里跨多个 case 或多个 scenario pack 重复出现
- 之前只算轻微漂移的问题，在后续 run 里重复出现，不再是孤立现象

判断备注：

- 不要把纯措辞偏好差异直接当成失败，除非它已经明显破坏 case 主合同
- 先根据 first failing turn 和 drift dimension 定严重度，再讨论可能根因
- 如果一轮只落在“可接受轻微漂移”，先把整轮跑完并记录清楚，再决定是否要补 follow-up issue

## 固定的长链路验收结论格式

当前这层门槛判断（`Pass`、`Acceptable minor drift`、`Must-open-issue`）继续保留，作为严重度层。

如果某一轮正式 gate 被记为 `Pass`，默认只表示它在当轮冻结下来的 baseline、scenario-pack 集合、以及 profile-by-pack matrix 上通过；这个结论不自动外推到后续 baseline 变化、pack 扩展或 profile 映射调整后的结果。

在它之外，再补一层固定结论，让下一轮长链路验收更容易一眼看懂：

- `rule-layer issue`
- `state-pressure candidate`
- `no obvious drift`

使用规则：

- `rule-layer issue`
  - 这轮有可见漂移，但仍然最像 routing、recall、language、relationship-continuity 或 correction 规则层问题
- `state-pressure candidate`
  - 这轮出现了反复的长链路漂移，而且开始更像 thread-state 压力，而不是普通规则层 bug
- `no obvious drift`
  - 这轮在固定观察窗口内没有出现明显漂移

要把这层和严重度层分开理解：

- 严重度层回答：这轮有多严重
- 结论层回答：这轮最像哪一类问题

在整轮验收记录最后，再补一个轻量派生字段：

- `next_action`

固定映射如下：

- `rule-layer issue`
  - `next_action = open_small_fix_issue`
- `state-pressure candidate`
  - `next_action = prepare_layer_d_review`
- `no obvious drift`
  - `next_action = keep_role_layer`

`next_action` 只作为验收记录里的决策辅助，不进入 runtime 字段、不进用户可见 UI，也不做成流程自动化。

第一轮长链路验收的最小决策门槛：

- `no obvious drift`
  - 只有在固定 `8 到 12 turn` 观察窗口里，没有出现有意义的漂移时，才用这档
- `rule-layer issue`
  - 只要可见漂移仍然最像规则层问题，就默认先归到这档
  - 单点漂移、孤立漂移、单包失败，都应先留在这档，除非后面出现更强的状态层证据
- `state-pressure candidate`
  - 单次孤立漂移不能直接用这档
  - 只有当相同或相近 scenario pack、相同或相近 drift dimension 开始重复出现，而且对应 turn 同时带有 `long_chain_pressure_candidate = true` 时，才进入这档

## 长链路状态压力观察窗口

这不是让我们现在就去做 `thread compaction`、`thread summary` 或 `state packet`。

只有在当前 runtime 规则已经大体稳定、但你想判断后续漂移更像“状态层承压”还是“规则层还有缺口”时，才启用这组观察。

在默认 `8 到 12 turn` 的验收观察窗口里，如果需要解释漂移，可以额外记录这些 developer-only 信号：

- `recent_raw_turn_count`
- `approx_context_pressure`
- `same_thread_continuation_applicable`
- `long_chain_pressure_candidate`

具体的升级门槛和记录模板，统一看这份观察指引：

- `docs-public/long-chain-state-pressure-observation.zh-CN.md`

这里固定窗口只是为了验收结果更可横向比较，不代表更短或更长 thread 不值得关注。

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
