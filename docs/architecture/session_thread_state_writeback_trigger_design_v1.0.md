# Session Thread State Writeback Trigger 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- thread state writeback trigger

这一层的最小边界。

本文档重点回答：

- 在 `saveThreadState(...)` 已有代码壳后，runtime 哪一层最适合触发写回
- 这层应吃什么输入、吐什么结果
- 它与 `runPreparedRuntimeTurn(...)`、`ThreadStateRepository`、compaction 的边界是什么

本文档不是 thread state 写接口设计，也不是 compaction 设计，而是：

**thread state 从“repository 最小写接口已存在”推进到“runtime 触发边界已明确”前的设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state next step
> 相关文档：
> - `docs/architecture/session_thread_state_writeback_boundary_v1.0.md`
> - `docs/architecture/session_thread_state_write_repository_design_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `apps/web/lib/chat/runtime.ts`

---

## 2. 一句话结论

**当前 thread state 写回如果继续推进，最稳的下一步不是把 `saveThreadState(...)` 直接塞进 `runPreparedRuntimeTurn(...)` 主体，而是先定义一个单独的 writeback trigger seam，让 runtime execution 只在回合结束后调用它。**

一句话说：

**先显式 trigger，再接主流程。**

---

## 3. 当前为什么值得补这层

现在 `session` 这条线已经具备：

- 默认真实读取
- `ThreadStateRepository.saveThreadState(...)`
- `SupabaseThreadStateRepository.saveThreadState(...)`

但当前还没有明确：

- 到底在哪一层触发写回
- 这一层需要哪些输入
- 失败时应不应该影响主 reply 流程

如果不先定义 trigger seam，后面很容易出现两种问题：

1. 直接把写回塞进 `runPreparedRuntimeTurn(...)` 主体，execution 再次变厚
2. 各条入口自己顺手写状态，绕开统一 runtime execution

所以更稳的动作是：

**先把 thread state writeback trigger 独立成一个很小的 execution 邻近层。**

---

## 4. 当前最重要的边界判断

当前建议把这几层继续分开：

### 4.1 `runPreparedRuntimeTurn(...)`

负责：

> 执行本轮 runtime 主逻辑，产出 `RuntimeTurnResult`

### 4.2 writeback trigger

负责：

> 在主逻辑执行完成后，决定是否触发 thread state 最小写回

### 4.3 `ThreadStateRepository`

负责：

> 承接写回存储接口

### 4.4 compaction / summary

负责：

> 更重的状态压缩与长链沉淀

一句话说：

**trigger seam 负责“是否现在写”，repository 负责“怎么写”。**

---

## 5. 当前推荐的两种落点

### 方案 A：直接写进 `runPreparedRuntimeTurn(...)`

形式类似：

```ts
const result = ...
await saveThreadState(...)
return result
```

优点：

- 最直接
- 改动路径短

缺点：

- 会让 execution 主体再次变厚
- 后面更难区分“主 reply 执行”和“附带状态刷新”

### 方案 B：先抽一个 writeback trigger seam

形式类似：

```ts
const result = ...
await maybeWriteThreadStateAfterTurn(...)
return result
```

优点：

- 边界更清楚
- 失败处理更容易单独收口
- 后面更容易决定是否要写入 metadata / debug

缺点：

- 多一层薄壳

### 当前推荐

**先选方案 B。**

因为当前 runtime 主线已经好不容易收成：

- `RuntimeTurnInput`
- `prepareRuntimeTurn(...)`
- `PreparedRuntimeTurn`
- `runPreparedRuntimeTurn(...)`

这时候更值得保持 execution 主体继续薄，而不是又把状态刷新揉回去。

---

## 6. 当前建议的最小接口

当前建议先定义一个很小的 trigger seam，例如：

```ts
type WriteThreadStateAfterTurnInput = {
  prepared: PreparedRuntimeTurn;
  result: RuntimeTurnResult;
  repository: ThreadStateRepository;
};

type WriteThreadStateAfterTurnResult =
  | { status: "written" }
  | { status: "skipped" }
  | { status: "failed"; reason: string };
```

当前这里最重要的不是字段一次到位，而是：

- trigger 层有独立输入输出
- 它不直接等于 repository
- 它也不直接等于 runtime 主结果

---

## 7. 当前第一版 trigger 应该怎么决定是否写

当前第一版建议非常克制：

### 写回前提

- 本轮成功产出了 assistant message
- `prepared.session.thread_state` 可用
- `prepared.role.agent.id` 可用
- `prepared.resources.thread.id` 可用

### 当前允许的最小刷新内容

- `current_language_hint`
- `continuity_status`
- `last_user_message_id`
- `last_assistant_message_id`
- `updated_at`

### 当前可接受的 skip

- 缺少 assistant message id
- 缺少 thread / agent 标识
- 当前 result 不适合形成新的 thread state 锚点

也就是说，第一版 trigger 不追求“每轮都写”，而是：

**只在可以稳定构造最小刷新 record 时才写。**

---

## 8. 当前失败处理建议

当前推荐：

- thread state 写回失败 **不打断** 主 reply 结果返回
- 但应返回独立 trigger result
- 后续可以考虑把 trigger result 写进 debug metadata

原因很简单：

- 当前主目标仍是保证单轮 reply 稳定
- thread state 写回属于 session 状态刷新，不应先成为主链硬阻塞点

一句话说：

**第一版 writeback trigger 更适合 soft-fail，而不是 fail-fast。**

---

## 9. 当前建议的数据流

当前更稳的关系应是：

```ts
runPreparedRuntimeTurn(prepared)
  -> RuntimeTurnResult
  -> maybeWriteThreadStateAfterTurn(...)
  -> writeback result
  -> return RuntimeTurnResult
```

如果后面需要，也可以演进成：

```ts
runPreparedRuntimeTurn(prepared)
  -> RuntimeTurnResult + side-effect metadata
```

但当前第一版不必急着扩结果对象。

---

## 10. 当前不建议立刻做的事

即便下一步开始做 trigger seam，当前也不建议立刻一起做：

- runtime result schema 扩大
- writeback retry
- background requeue
- writeback event bus
- compaction 联动
- thread state writeback metrics system

因为这些都会让当前这一步从：

**最小 trigger seam**

膨胀成：

**完整 session state execution subsystem**

---

## 11. 当前建议的推进顺序

### Step 1

先固定：

- writeback trigger seam

### Step 2

再落：

- `maybeWriteThreadStateAfterTurn(...)` 第一版代码壳

### Step 3

再决定：

- 是否把 trigger result 写进 `debug_metadata`

### Step 4

最后才真正把 trigger 接进 `runPreparedRuntimeTurn(...)`

---

## 12. 当前最合理的 DoD

当前这一步如果算完成，应该满足：

- 已明确 thread state 写回由独立 trigger seam 决定
- 已明确 trigger 与 repository 的边界
- 已明确 trigger 的最小输入输出
- 已明确第一版 soft-fail
- 已明确当前不直接把写回揉回 execution 主体

---

## 13. 当前结论

**当前 `session` 主线如果继续推进，最稳的下一步是先补一个独立的 thread state writeback trigger seam，而不是直接把 `saveThreadState(...)` 硬塞进 `runPreparedRuntimeTurn(...)`。**

也就是说，更合理的顺序应是：

1. 先定义 trigger seam
2. 再落 trigger 代码壳
3. 再决定是否把 trigger 接入 runtime 主流程
4. 最后才讨论 retry、compaction、metrics
