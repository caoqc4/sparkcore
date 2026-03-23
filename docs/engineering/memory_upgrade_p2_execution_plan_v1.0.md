# SparkCore Memory Upgrade P2 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P1 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0` / `P1` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P2` 的第一批实施基线
- 从 `P1` 已成立事实，推进到多场景、多 Agent、压缩与知识分层准备态的执行文档

上层输入：

- [memory_upgrade_p1_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p1_close_note_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P2 的一句话目标

**在 P1 已建立的 `episode / timeline / dynamic_profile / layered context assembly / legacy tightening` 基础上，把 SparkCore 记忆系统推进成“可按场景扩展、可为多 Agent 与模拟世界预留、可开始做线程压缩与知识分层”的长期状态内核。**

---

## 3. P2 与 P1 的分界

P1 已经解决的，是：

- `episode / timeline` 从 contract 变成真实 retrieval route
- `DynamicProfile` 从语义保留位变成最小真实对象
- `context assembly` 已形成最小分层顺序
- legacy `memory_items` 读路径开始系统性收紧
- 第一版 `P1` regression gate 已成立

P2 不再重复做这些基础工作。

P2 重点解决的是：

1. `Scenario Memory Pack` 从概念变成正式 seam
2. `Knowledge Layer` 从边界说明变成最小真实层
3. `Thread Compaction / Retention` 从设计想法变成第一批真实路径
4. `Scope / Namespace` 从单 Agent 优先变成多 Agent / project / world-ready
5. 后端适配位与更高阶回归 gate 开始立住

---

## 4. P2 首批目标

P2 首批不追求把 v0.2 一次做满，而是先完成以下五件事。

### 4.1 Scenario Memory Pack seam

P2 首批要做的，不是完整插件系统，而是正式引入一层场景扩展 seam。

最小要求：

- 定义 `Scenario Memory Pack` 的最小 contract
- 支持声明：
  - schema extension
  - extraction hint
  - retrieval weight / preference
  - eval hook
- 至少有一个内建 pack 走通 seam

建议首批内建 pack：

- `companion`

原因：

- 与当前单 Agent / IM / 长记忆主线最贴近
- 不会过早引入 workflow/simulation 的额外复杂度

当前代码事实：

- `packages/core/memory/packs.ts` 当前已新增首版：
  - `ScenarioMemoryPack`
  - `ScenarioMemoryLayer`
  - `ScenarioMemoryRoute`
  - `COMPANION_SCENARIO_MEMORY_PACK`
- `apps/web/lib/chat/memory-packs.ts` 当前已新增：
  - `resolveActiveScenarioMemoryPack()`
  - `buildScenarioMemoryPackPromptSection(...)`
- runtime `buildAgentSystemPrompt(...)` 当前也已开始显式注入：
  - `Active Scenario Memory Pack: companion`
- assistant metadata / debug metadata 当前也已开始写入最小 pack 摘要：
  - `pack_id`
  - `preferred_routes`
  - `assembly_order`
  - `selection_reason`
- `memory-upgrade-harness.ts` 当前也已开始显式校验 companion pack seam

### 4.2 Knowledge Layer minimal separation

P2 首批要做的，是把 `Knowledge` 从“可能属于 memory_record 的某类事实”中正式分出来。

最小要求：

- 定义最小 `KnowledgeRecord` contract 或对等结构
- 明确与以下层的边界：
  - `StaticProfile`
  - `DynamicProfile`
  - `MemoryRecord`
  - `ThreadState`
- 先建立最小 read / injection seam，不要求首批做复杂写入治理

首批目标不是做知识库产品，而是避免：

- 稳定知识
- 关系事件
- 线程进行态

继续混在一层语义里。

### 4.3 Thread Compaction / Retention v1

P2 首批要把 `Thread Compaction` 从设计词汇推进成最小真实路径。

最小要求：

- 定义 `CompactedThreadSummary` 或等价对象
- 明确与 `ThreadState` 的边界：
  - `ThreadState` 负责当前进行态
  - `Compaction` 负责历史线程压缩结果
- 至少有一条最小 compaction 生成路径
- 至少有一条最小注入 / 展示 / metadata 可见路径

首批不做：

- 复杂 retention policy 引擎
- 大规模自动过期治理

### 4.4 Scope / Namespace expansion

P2 首批要把当前更偏单 Agent 的 scope 语义，推进到更明确的多 Agent / project / world 预留态。

最小要求：

- 明确 `user / agent / thread / project / world` 这几层 scope / namespace 的目标语义
- 在 contract / helper 层立住统一解析位
- 至少让 retrieval / injection 能看见更高一层 namespace 概念

首批不做：

- 完整多 Agent 共享记忆仲裁
- 完整世界状态同步引擎

### 4.5 P2 regression / acceptance expansion

P2 首批要把 gate 从：

- semantic target
- retrieval routes
- dynamic profile
- layered context assembly

继续扩大到：

- pack seam
- knowledge seam
- compaction seam
- namespace seam

目标不是把所有逻辑都测试满，而是确保 P2 新引入的高阶结构不会悄悄回退成：

- 继续塞回 memory_record
- 继续塞回 thread_state
- 继续只停在文档层

---

## 5. P2 明确不做的事项

P2 首批明确不做：

- 不做完整 multi-pack 插件平台
- 不做复杂知识治理后台
- 不做重图数据库基础设施绑定
- 不做完整多 Agent 共享记忆仲裁系统
- 不做 simulation world state 全栈
- 不做正式对外 API / SDK 产品化
- 不做第三方 memory backend 的真实生产接入

P2 仍然保持：

- 核心语义先行
- seam 先立住
- 真正大规模扩展后置

---

## 6. P2 第一批实施顺序

建议顺序：

1. `P2-1 Scenario Memory Pack seam`
2. `P2-2 Knowledge Layer minimal separation`
3. `P2-3 Thread Compaction / Retention v1`
4. `P2-4 Scope / Namespace expansion`
5. `P2-5 regression / acceptance expansion`

原因：

- pack seam 是后面多场景扩展的入口，越早立住越不容易把场景规则继续写散
- knowledge separation 会直接影响后续 schema 与 context assembly 边界
- compaction 应建立在前两者之后，否则容易把压缩结果和 memory/thread_state 混层
- namespace expansion 需要站在前述结构之上做，而不应提前发散
- gate 最后补强，锁住 P2 新事实

---

## 7. 模块改动映射

P2 首批高概率会触达这些区域：

- `packages/core/memory/`
  - 新增 pack / knowledge / compaction / namespace contract
- `apps/web/lib/chat/`
  - `memory-records.ts`
  - `memory-recall.ts`
  - `memory-write.ts`
  - `runtime.ts`
  - `thread-state*.ts`
  - 新增 compaction / knowledge / pack helper
- `apps/web/scripts/`
  - `memory-upgrade-harness.ts`
- `docs/engineering/`
  - `memory_upgrade_p2_execution_plan_v1.0.md`
  - 后续 `P2 close readiness / close note`

---

## 8. P2 验收标准

P2 首批验收标准分三类。

### 8.1 功能 gate

- 至少一个内建 `Scenario Memory Pack` 进入真实 seam
- `Knowledge Layer` 有最小真实读/注入路径
- `Thread Compaction` 有最小生成与可见路径
- `Scope / Namespace` 在 retrieval 或 injection 至少一条主路径上成为真实输入

### 8.2 结构 gate

- `Knowledge` 不再继续隐式混在 `memory_record` 中
- `Compaction` 不再继续隐式混在 `ThreadState` 中
- pack 扩展位不是只存在文档，而是有代码 contract 与消费点
- namespace 扩展不是只写在注释，而是有统一 helper / contract

### 8.3 回归 gate

- `pnpm --filter @sparkcore/web memory:upgrade:harness` 持续通过
- `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json` 持续通过
- P0 / P1 已成立主路径不回退：
  - `profile`
  - `thread_state`
  - `episode`
  - `timeline`
  - `dynamic_profile`
  - layered context assembly

---

## 9. P2 当前起点判断

P2 不是从零开始。

当前可直接依赖的代码事实包括：

- `profile / thread_state / episode / timeline` 已有真实 retrieval 路由
- `DynamicProfile` 已有最小真实对象与 recall 路径
- system prompt 已有最小 layered context assembly
- legacy read path 已有一轮 canonical tightening
- memory upgrade harness 已能锁住 `P0 + P1` 的主结合面

因此，P2 的正确起点不是继续补 P1 尾项，而是：

**在现有 retrieval / assembly / semantic-layer 事实之上，开始立住 P2 的高阶 seam。**

---

## 10. 当前推荐的第一刀

P2 最推荐的第一刀是：

**`P2-1 Scenario Memory Pack seam`**

理由：

- 它最能决定后续 P2 是不是继续把场景规则写散
- 它不要求立即做重型实现
- 它能为 `Knowledge / Compaction / Namespace` 的后续落地提供统一扩展位置

一句话说：

**P2 的首要任务不是继续细修 P1，而是先把“场景化扩展的正式入口”立住。**
