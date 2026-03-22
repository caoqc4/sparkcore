# Session Thread State 读取边界说明 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- `loadThreadState(...)`

这层最小读取边界应该长什么样。

本文档重点回答：

- `ThreadStateRecord` 既然已经存在，下一步最自然的读取入口是什么
- `loadThreadState(...)` 应该只负责什么，不该提前负责什么
- 它与 `prepareRuntimeSession(...)`、持久化、compaction 的边界在哪里

本文档不是 migration 设计，也不是 repository 设计，而是：

**thread state 进入主流程前的最小读取边界说明。**

> 状态：当前有效
> 对应阶段：Phase 1 / session next step
> 相关文档：
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/engineering/session_next_phase_decision_note_v1.0.md`
> - `docs/engineering/session_mainline_capability_summary_v1.0.md`
> - `apps/web/lib/chat/thread-state.ts`

---

## 2. 一句话结论

**当前最稳的下一步不是立刻做 `thread_state` 持久化，而是先定义一个最小 `loadThreadState(...)` 读取边界，让 `prepareRuntimeSession(...)` 后续能从“默认构造 thread state”平滑过渡到“读取 thread state”。**

当前状态前移到：

- `loadThreadState(...)` 第一版代码壳已存在
- `prepareRuntimeSession(...)` 已开始通过这层 loader 读取 thread state
- 当前默认实现仍只返回 `not_found`

---

## 3. 当前为什么要补这层

当前 `session` 主线已经有：

- `ThreadStateRecord`
- `buildDefaultThreadState(...)`
- `prepareRuntimeSession(...)`
- `loadThreadState(...)`

并且 `prepareRuntimeSession(...)` 已开始通过 `loadThreadState(...)` 最小消费 `thread_state`。

但现在最明显的空档是：

- 已经有状态对象
- 已经有主流程接线
- 但还没有“状态从哪里读出来”的正式边界

这会导致一个问题：

- 下一步如果直接做表和 migration
- 很容易把读取边界、存储模型、写回策略一次性揉在一起

所以更稳的动作是：

**先把读取入口单独定义出来。**

---

## 4. 当前最重要的边界判断

当前建议把这几层明确分开：

### 4.1 `ThreadStateRecord`

回答：

> thread state 长什么样

### 4.2 `loadThreadState(...)`

回答：

> 如果现在要取这条 thread 的状态，读取入口长什么样

### 4.3 `prepareRuntimeSession(...)`

回答：

> runtime 本轮如何消费 thread state

### 4.4 repository / persistence

回答：

> 这个读取入口未来具体从哪里取

当前阶段应先把前 3 层定清，不急着进第 4 层。

---

## 5. 当前建议的最小接口

当前建议的最小读取接口是：

```ts
type LoadThreadStateInput = {
  threadId: string;
  agentId: string;
};

type LoadThreadStateResult =
  | {
      status: "found";
      thread_state: ThreadStateRecord;
    }
  | {
      status: "not_found";
    };
```

这里故意保持很克制：

- 不引入 repository 名字
- 不引入 Supabase 细节
- 不引入 load policy 之外的元信息

因为当前最需要稳定的是：

**读取入口形状**

而不是后端实现细节。

---

## 6. 为什么建议返回 `found / not_found`

当前不建议直接让 `loadThreadState(...)` 返回：

```ts
Promise<ThreadStateRecord | null>
```

更推荐先用显式结果对象，因为它有两个好处：

### 6.1 与后续 `role` / `binding` 风格一致

现在系统里已经越来越多地采用：

- `resolved / not_found`
- `found / not_found`

这比 `null` 更适合后续补 metadata、source、fallback reason。

### 6.2 能更自然表达“默认构造”仍在外层

当前阶段如果没找到 thread state：

- `loadThreadState(...)` 只返回 `not_found`
- 是否 fallback 到 `buildDefaultThreadState(...)`
  由 `prepareRuntimeSession(...)` 决定

这样读取层和 fallback 层就不会再次混在一起。

当前第一版代码壳已落在：

- [thread-state.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state.ts)

当前默认实现仍然保持为：

- `status: "not_found"`

这样主流程已经开始经过读取边界，但还没有越界到 persistence。

---

## 7. 当前建议的数据流

当前更稳的数据流应是：

1. runtime 进入 `prepareRuntimeSession(...)`
2. `prepareRuntimeSession(...)` 调 `loadThreadState(...)`
3. 如果 `found`
   - 使用 `thread_state`
4. 如果 `not_found`
   - fallback 到 `buildDefaultThreadState(...)`
5. 最终构造 `SessionContext`

也就是说，建议关系应逐步收敛成：

```ts
loadThreadState(...) -> ThreadStateRecord? -> prepareRuntimeSession(...) -> SessionContext
```

而不是：

```ts
prepareRuntimeSession(...) 直接自己决定如何读表 / 如何查状态 / 如何 fallback
```

当前这条数据流已经开始成为代码事实：

- [runtime-prepared-turn.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-prepared-turn.ts)
  当前已先调 `loadThreadState(...)`
- 在 `not_found` 时，再 fallback 到 `buildDefaultThreadState(...)`

---

## 8. 当前阶段不建议塞进这层的内容

下面这些当前不建议塞进 `loadThreadState(...)`：

### 8.1 写回逻辑

不做：

- upsert
- patch
- write-through

因为这会让“读取边界”立刻变成“状态系统”。

### 8.2 compaction / summarization

不做：

- 摘要回写
- 窗口裁剪
- 长链压缩

因为这属于下一阶段更重的状态策略。

### 8.3 推断逻辑

不做：

- continuity status 自动推断
- language hint 自动回写
- focus mode 自动判定

当前阶段 `loadThreadState(...)` 应该只回答：

> 读得到，还是读不到

---

## 9. 与未来 repository / persistence 的关系

当前建议的推进顺序应是：

### Step 1

先固定：

- `LoadThreadStateInput`
- `LoadThreadStateResult`

### Step 2

再引入：

- `ThreadStateRepository`

例如后续可能会出现：

```ts
type ThreadStateRepository = {
  loadThreadState(input: LoadThreadStateInput): Promise<LoadThreadStateResult>;
};
```

### Step 3

再决定：

- 是否需要 Supabase shell
- 是否需要 migration 草案
- 是否要引入默认写回

也就是说：

**repository / persistence 是下一层，不是这一层。**

---

## 10. 当前最合理的 DoD

当前这一步如果算完成，应该至少满足：

1. `loadThreadState(...)` 的输入对象被定义清楚
2. `loadThreadState(...)` 的结果对象被定义清楚
3. `prepareRuntimeSession(...)` 与 fallback 的边界被定义清楚
4. repository / migration 被明确后置

---

## 11. 一句话总结

**当前 `session` 主线最合理的下一步，不是立刻做 `thread_state` 持久化，而是先把 `loadThreadState(...)` 定义成一个清楚、克制的读取边界，让状态层后续能平滑进入主流程。**
