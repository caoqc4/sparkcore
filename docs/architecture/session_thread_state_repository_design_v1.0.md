# Session Thread State Repository 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- `ThreadStateRepository`

这一层的最小边界。

本文档重点回答：

- `loadThreadState(...)` 之后，为什么需要 repository 这一层
- repository 应该先负责什么，不该先负责什么
- 它与 `loadThreadState(...)`、`prepareRuntimeSession(...)`、持久化实现的关系是什么

本文档不是 migration 设计，也不是 thread state 写回设计，而是：

**thread state 从“读取边界”推进到“repository 边界”前的最小设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state next step
> 相关文档：
> - `docs/architecture/session_thread_state_loading_boundary_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/architecture/session_layer_design_v1.0.md`
> - `docs/engineering/session_next_phase_decision_note_v1.0.md`

---

## 2. 一句话结论

**当前 `session` 主线更合理的下一步，不是直接进入 `thread_state` 持久化，而是先把 `ThreadStateRepository` 定义成一个只承接读取语义的最小 repository 边界，让 `loadThreadState(...)` 后续能从默认 loader 平滑过渡到真实读取后端。**

---

## 3. 当前为什么要补这层

现在 `session` 这条线已经有：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `prepareRuntimeSession(...)`

并且 `prepareRuntimeSession(...)` 已开始通过 `loadThreadState(...)` 进入主流程。

但如果下一步继续推进，最自然会碰到一个问题：

- `loadThreadState(...)` 现在只是一个默认 `not_found` 的 loader
- 真正的后端读取逻辑将来总要有地方放

如果不先定义 repository，后面很容易直接把：

- Supabase 查询
- fallback 逻辑
- 后续可能的写回接口

都一股脑塞回 `loadThreadState(...)` 或 `prepareRuntimeSession(...)`。

所以更稳的动作是：

**先让 repository 成为“读取后端”的正式落点。**

---

## 4. 当前最重要的边界判断

当前建议把这四层分开：

### 4.1 `ThreadStateRecord`

回答：

> thread state 长什么样

### 4.2 `loadThreadState(...)`

回答：

> runtime 侧读取入口长什么样

### 4.3 `ThreadStateRepository`

回答：

> 真正的状态读取后端长什么样

### 4.4 persistence implementation

回答：

> 具体是 Supabase、别的数据库，还是别的存储实现

当前阶段应先把前 3 层定清，不急着直接进入第 4 层。

---

## 5. 当前建议的最小接口

当前建议最小 repository 接口是：

```ts
type ThreadStateRepository = {
  loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult>;
};
```

这里故意保持很克制：

- 不先加 `upsertThreadState(...)`
- 不先加 `patchThreadState(...)`
- 不先加 claim / lock / version conflict

因为当前这一步最需要稳定的是：

**“读状态的后端接口长什么样”。**

---

## 6. 为什么当前不建议一开始就加写接口

直觉上很容易想把 repository 设计成：

```ts
type ThreadStateRepository = {
  loadThreadState(...)
  saveThreadState(...)
  patchThreadState(...)
}
```

但当前不建议这么做，原因有三点：

### 6.1 读取边界才刚刚稳定

现在我们刚把：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `prepareRuntimeSession(...)`

这三层收顺。

如果立刻加写接口，很快又会把：

- 读
- 写
- fallback

重新混在一起。

### 6.2 当前还没有清楚的写回时机

现在还没有稳定答案的包括：

- 哪一轮结束时更新 `continuity_status`
- 何时回写 `current_language_hint`
- `last_assistant_message_id` 到底在哪个时点写

这些问题不该在 repository 第一版里提前拍板。

### 6.3 写接口会把系统立刻推向 persistence 设计

一旦有写接口，马上就会碰到：

- version bump
- conflict overwrite
- partial update vs full replace
- migration 字段一致性

这比当前这一步要重得多。

---

## 7. 当前建议的数据流

当前更稳的关系应是：

```ts
prepareRuntimeSession(...)
  -> loadThreadState(...)
  -> ThreadStateRepository.loadThreadState(...)
  -> found / not_found
  -> buildDefaultThreadState(...) fallback
  -> SessionContext
```

也就是说：

- `prepareRuntimeSession(...)`
  仍是 runtime consumption 层
- `loadThreadState(...)`
  是更靠近 runtime 的读取入口
- `ThreadStateRepository`
  是后端读取抽象

当前不建议让 `prepareRuntimeSession(...)` 直接依赖具体存储实现。

---

## 8. 当前建议的推进顺序

### Step 1

先固定：

- `ThreadStateRepository` 最小接口

### Step 2

再落第一版代码壳，例如：

- `InMemoryThreadStateRepository`

### Step 3

再决定：

- 是否需要 `SupabaseThreadStateRepository`
- 是否需要 migration 草案

### Step 4

最后才讨论：

- 写回接口
- version / patch 语义
- compaction / summarization

---

## 9. 当前不建议塞进 repository 的内容

下面这些当前不建议塞进第一版 `ThreadStateRepository`：

### 9.1 fallback 逻辑

不建议 repository 自己决定：

- 读不到时是否 default
- default 怎么构造

这些应该继续留在 `prepareRuntimeSession(...)` 或 loader 层。

### 9.2 compaction 逻辑

不建议 repository 承担：

- state summarization
- long-chain compression
- turn window compaction

### 9.3 策略判断

不建议 repository 承担：

- continuity 推断
- 语言偏好推断
- focus mode 选择

repository 应先只读，不先做策略。

---

## 10. 当前最合理的 DoD

当前这一步如果算完成，应该至少满足：

1. `ThreadStateRepository` 最小接口被定义清楚
2. repository 与 loader / preparation 的边界被定义清楚
3. 不把写回、migration、compaction 提前拖进这层
4. 下一个实现动作可以自然落到 `InMemoryThreadStateRepository`

---

## 11. 一句话总结

**当前 `session` 主线最合理的下一步，不是直接进入 `thread_state` persistence，而是先把 `ThreadStateRepository` 定义成只承接读取语义的最小 repository 边界，为后续真实后端读取留出清楚落点。**
