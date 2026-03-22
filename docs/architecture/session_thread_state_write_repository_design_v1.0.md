# Session Thread State 写接口设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- `ThreadStateRepository` 最小写接口

这一层的边界。

本文档重点回答：

- 在 thread state 写回边界已经明确后，repository 最小写接口该长什么样
- 第一版接口应该先承接什么语义
- 它与 `loadThreadState(...)`、runtime 回合结束逻辑、compaction 的关系是什么

本文档不是 runtime 触发实现，也不是 compaction 设计，而是：

**thread state 从“写回边界已明确”推进到“repository 最小写接口已明确”前的设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state next step
> 相关文档：
> - `docs/architecture/session_thread_state_writeback_boundary_v1.0.md`
> - `docs/architecture/session_thread_state_repository_design_v1.0.md`
> - `docs/architecture/session_thread_state_supabase_repository_design_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `apps/web/lib/chat/thread-state-repository.ts`

---

## 2. 一句话结论

**当前 `ThreadStateRepository` 如果继续推进，最稳的下一步不是直接加复杂 patch / merge 接口，而是先补一个最小 `saveThreadState(...)` 写接口，让 repository 正式同时承接“读状态”和“最小状态刷新写回”。**

这里的关键不是一次性做完整状态系统，而是先把：

- 读取
- 最小写回

收进同一层 repository contract。

当前状态前移到：

- `ThreadStateRepository.saveThreadState(...)` 第一版代码壳已存在
- `InMemoryThreadStateRepository.saveThreadState(...)` 已存在
- `SupabaseThreadStateRepository.saveThreadState(...)` 已存在
- `thread-state-writeback.ts` 第一版 trigger helper 已存在
- `runPreparedRuntimeTurn(...)` 已开始以 soft-fail side effect 触发最小 thread state 写回

---

## 3. 当前为什么值得补这层

现在 `session` 这条线已经具备：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `ThreadStateRepository`
- `SupabaseThreadStateRepository`
- 默认真实读取
- 写回边界说明

这意味着读取侧已经足够完整。下一步如果继续，很自然就会碰到：

- repository 是否也该承接最小写回
- runtime 回合结束后写回到底调谁
- 写回语义是 full save 还是 patch

如果不先把 repository 写接口说明白，后面很容易出现两种坏结果：

1. runtime 层直接写 Supabase
2. 过早长出复杂 patch / merge 接口

所以更稳的动作是：

**先补最小 repository 写接口。**

---

## 4. 当前最重要的边界判断

当前建议把这几层继续分开：

### 4.1 runtime 回合结束逻辑

负责：

> 何时触发 thread state 刷新

### 4.2 `ThreadStateRepository`

负责：

> 承接最小状态读取与写回

### 4.3 `SupabaseThreadStateRepository`

负责：

> 写接口的真实后端实现

### 4.4 compaction / summary

负责：

> 更重的状态压缩与沉淀

一句话说：

**repository 写接口是“状态刷新存储面”，不是“状态演化策略层”。**

---

## 5. 当前推荐的两种接口路线

### 方案 A：最小 `saveThreadState(...)`

```ts
type ThreadStateRepository = {
  loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult>;
  saveThreadState(
    record: ThreadStateRecord
  ): Promise<void>;
};
```

优点：

- 最简单
- 与当前 `ThreadStateRecord` 代码壳自然对齐
- 最不容易过早卷入 patch 语义

缺点：

- 上层需要先构造完整 record

### 方案 B：最小 `saveThreadStatePatch(...)`

```ts
type SaveThreadStatePatchInput = {
  threadId: string;
  agentId: string;
  current_language_hint?: ...;
  continuity_status?: ...;
  last_user_message_id?: ...;
  last_assistant_message_id?: ...;
};
```

优点：

- 更贴近“刷新少数字段”

缺点：

- 太早进入 patch 语义
- 容易继续长出 merge / version 规则

### 当前推荐

**先选方案 A。**

原因是：

- 当前 `ThreadStateRecord` 已经是正式状态对象
- 写回边界也已经说明“先只做最小状态刷新”
- 用简单 `save` 比 patch 更容易收住范围

---

## 6. 当前建议的最小接口

当前建议把 repository 收成：

```ts
type ThreadStateRepository = {
  loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult>;
  saveThreadState(
    record: ThreadStateRecord
  ): Promise<void>;
};
```

这里有两个关键点：

### 6.1 仍然不引入复杂结果对象

第一版 `saveThreadState(...)` 先只返回 `Promise<void>` 即可。

当前还不需要：

- `saved`
- `skipped`
- `conflicted`

这些结果类型。

### 6.2 仍然不引入 compare-and-swap

第一版先不做：

- optimistic locking
- state_version 冲突保护
- expected_version

因为这些一旦进来，第一版 repository 就会变重很多。

当前这层也已经有了明确代码落点：

- [thread-state-repository.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state-repository.ts)
- [thread-state-supabase-repository.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state-supabase-repository.ts)

---

## 7. 当前第一版 `saveThreadState(...)` 应承接什么语义

当前第一版建议只承接：

- 保存一份“已构造好的最小 thread state record”

也就是说：

- repository 不负责决定哪些字段该刷新
- repository 不负责决定什么时候刷新
- repository 只负责把给定 record 落到后端

这样可以把“状态策略”和“存储接口”继续分开。

---

## 8. 当前不建议第一版 repository 写接口承接什么

即便下一步开始做 `saveThreadState(...)`，当前也不建议一起加：

- `patchThreadState(...)`
- `upsertThreadStatePartial(...)`
- `deleteThreadState(...)`
- `compareAndSwapThreadState(...)`
- `bumpThreadStateVersion(...)`

原因是这些都不属于“最小写接口”，而是下一层状态系统能力。

---

## 9. 当前建议的数据流

当前更稳的关系应是：

```ts
runPreparedRuntimeTurn(...)
  -> build next ThreadStateRecord
  -> ThreadStateRepository.saveThreadState(record)
```

而不是：

```ts
runtime 逻辑
  -> 直接写 Supabase
```

这里最关键的是：

- runtime 决定何时刷
- repository 负责怎么存

这样当前分层才不会再次塌回去。

---

## 10. 当前建议的推进顺序

### Step 1

先固定：

- `ThreadStateRepository.saveThreadState(...)`

### Step 2

再落：

- `InMemoryThreadStateRepository.saveThreadState(...)`
- `SupabaseThreadStateRepository.saveThreadState(...)`

### Step 3

再决定：

- runtime 哪一层触发写回

### Step 4

最后才讨论：

- patch
- version
- compaction 耦合

---

## 11. 当前最合理的 DoD

当前这一步如果算完成，应该满足：

- repository 最小写接口已明确
- 已明确推荐先用 `saveThreadState(...)`
- 已明确第一版不做 patch / version / CAS
- 已明确 repository 只承接存储，不承接状态策略
- 已明确下一步应先落代码壳，再决定 runtime 触发位置

---

## 12. 当前结论

**当前 `session` 主线如果继续推进，最稳的下一步是先给 `ThreadStateRepository` 补一个最小 `saveThreadState(...)` 接口，让真实读取链之后的“最小状态刷新写回”也有正式落点。**

也就是说，更合理的顺序应是：

1. 先补 repository 最小写接口
2. 再落 in-memory / Supabase 写接口壳
3. 再决定 runtime 回合结束后的触发位置
4. 最后才讨论 patch、version、compaction
