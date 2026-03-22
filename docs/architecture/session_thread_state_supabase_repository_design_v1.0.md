# Session Thread State Supabase Repository 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `session` 主线里：

- `SupabaseThreadStateRepository`

这一层的最小边界。

本文档重点回答：

- 在已有 `ThreadStateRepository` 的前提下，为什么下一步最自然是 `Supabase` shell
- 第一版 `SupabaseThreadStateRepository` 应该先负责什么
- 它与 `loadThreadState(...)`、`ThreadStateRepository`、migration 的边界在哪里

本文档不是 migration 草案，也不是 thread state 写回设计，而是：

**thread state 从 repository 边界推进到真实读取后端前的最小设计稿。**

> 状态：当前有效
> 对应阶段：Phase 1 / session state next step
> 相关文档：
> - `docs/architecture/session_thread_state_repository_design_v1.0.md`
> - `docs/architecture/session_thread_state_loading_boundary_v1.0.md`
> - `docs/architecture/session_state_contract_v1.0.md`
> - `docs/engineering/session_next_phase_decision_note_v1.0.md`
> - `apps/web/lib/chat/thread-state-supabase-repository.ts`

---

## 2. 一句话结论

**当前 `session` 主线如果继续推进，最自然的下一步不是立刻做 migration 或写回，而是先给 `ThreadStateRepository` 补一个只承接读取语义的 `SupabaseThreadStateRepository` shell，让 thread state 真实后端读取有明确落点。**

当前状态前移到：

- `SupabaseThreadStateRepository` 第一版代码壳已存在
- `mapThreadStateRowToRecord(...)` 已存在
- `createAdminThreadStateRepository()` 已存在
- `thread_states` migration 草案已存在并已落远端库
- `SupabaseThreadStateRepository` 真实读取已验证通过
- 默认 `loadThreadState(...)` 已优先走 Supabase

---

## 3. 当前为什么值得做这一步

现在 `session` 这条线已经有：

- `ThreadStateRecord`
- `loadThreadState(...)`
- `ThreadStateRepository`
- `InMemoryThreadStateRepository`
- `SupabaseThreadStateRepository`

这意味着当前已经完成了：

1. 状态对象定义
2. runtime 侧读取入口
3. repository 抽象
4. 默认后端壳
5. 真实后端读取壳

所以下一步如果还继续，最自然的就是：

**给 repository 补一个真实后端读取样本。**

相比直接跳到 migration / persistence，这一步更稳，因为它只解决：

- repository 如何对接真实后端读取

而不提前决定：

- 表结构最终版
- 何时写回
- 如何 patch 状态
- 如何做 compaction

---

## 4. 当前最重要的边界判断

当前建议把这几层继续分开：

### 4.1 `loadThreadState(...)`

是 runtime-facing loader。

### 4.2 `ThreadStateRepository`

是抽象读取接口。

### 4.3 `SupabaseThreadStateRepository`

是第一种真实后端读取实现。

### 4.4 migration / persistence model

是再下一层。

当前阶段不建议把 4.3 和 4.4 一起推进。

也就是说：

**可以先有 `SupabaseThreadStateRepository`，再补最小 migration，并在默认主路径切换前完成一次受控真实读取验证。**

---

## 5. 当前建议的最小职责

第一版 `SupabaseThreadStateRepository` 当前建议只负责：

- 按 `thread_id + agent_id` 读取一条状态记录
- 返回：
  - `found`
  - `not_found`
- 把数据库 row 映射成 `ThreadStateRecord`

当前不建议第一版就负责：

- insert / upsert
- patch
- version bump
- stale write protection
- compaction 相关字段

---

## 6. 当前建议的最小接口

当前建议保持和 `ThreadStateRepository` 一致：

```ts
class SupabaseThreadStateRepository implements ThreadStateRepository {
  loadThreadState(
    input: LoadThreadStateInput
  ): Promise<LoadThreadStateResult>;
}
```

这一步最重要的是：

- 不扩接口
- 不引入第二套读取语义
- 让 runtime 不需要感知“后端换了”

当前第一版代码壳已落在：

- [thread-state-supabase-repository.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state-supabase-repository.ts)
- [thread-state-admin-repository.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-state-admin-repository.ts)

---

## 7. 当前建议的最小 row 形状

当前最小 row 形状已经进入 migration 草案，且 repository shell 所需字段面已被真实读取验证覆盖：

```ts
type ThreadStateRow = {
  thread_id: string;
  agent_id: string;
  state_version: number;
  lifecycle_status: "active" | "paused" | "closed";
  focus_mode: string | null;
  current_language_hint: "zh-Hans" | "en" | "unknown" | null;
  recent_turn_window_size: number | null;
  continuity_status: "cold" | "warm" | "engaged" | null;
  last_user_message_id: string | null;
  last_assistant_message_id: string | null;
  updated_at: string;
};
```

这里的意图不是提前定死 migration，而是：

- 确认 repository shell 需要的最小字段面
- 避免后面写实现时再倒推 row 结构

---

## 8. 当前建议的数据流

当前更稳的数据流应是：

```ts
prepareRuntimeSession(...)
  -> loadThreadState(...)
  -> ThreadStateRepository.loadThreadState(...)
  -> SupabaseThreadStateRepository.loadThreadState(...)
  -> found / not_found
  -> buildDefaultThreadState(...) fallback
  -> SessionContext
```

这里有个关键点：

- fallback 仍然留在 `prepareRuntimeSession(...)`
- `SupabaseThreadStateRepository` 只负责“查不查得到”

这样真实后端读取不会重新把 fallback 逻辑卷回后端层。

当前这层已经有明确代码落点：

- `SupabaseThreadStateRepository`
- `mapThreadStateRowToRecord(...)`
- `createAdminThreadStateRepository()`
- `supabase/migrations/20260323113000_create_thread_states.sql`

同时当前也已经完成两步关键推进：

- `thread_states` 已落远端库
- 默认 `loadThreadState(...)` 已开始优先走 Supabase，初始化失败时回退 `InMemoryThreadStateRepository`

---

## 9. 当前不建议立刻做的事

即便当前已经有 `SupabaseThreadStateRepository` 和 migration，仍不建议立刻同时做：

- `pending` / `claimed` 一样的状态机字段
- state 写回接口
- migration 执行
- repository 与 compaction 耦合
- 把 `prepareRuntimeSession(...)` 直接绑死到 Supabase client

原因很简单：

- 当前目标只是让真实后端读取有落点
- 不是一次性建完整 session state system

---

## 10. 当前建议的推进顺序

### Step 1

先补：

- `SupabaseThreadStateRepository`
- `mapThreadStateRowToRecord(...)`

### Step 2

再补：

- `createAdminThreadStateRepository()`
- `thread_states` migration 草案

### Step 3

再做一次受控真实读取验证

### Step 4

再把默认 `loadThreadState(...)` 优先切到 Supabase

### Step 5

最后才讨论：

- 写接口
- 状态写回时机
- compaction / summarization

---

## 11. 当前最合理的 DoD

当前这一步如果算完成，应该至少满足：

1. `SupabaseThreadStateRepository` 的职责被定义清楚
2. row -> `ThreadStateRecord` 的最小映射被定义清楚
3. fallback 仍然明确留在 `prepareRuntimeSession(...)`
4. migration / write-back 被明确后置

---

## 12. 一句话总结

**当前 `session` 主线如果继续推进，最稳的下一步是先补一个只承接读取语义的 `SupabaseThreadStateRepository` shell，而不是立刻进入 migration、写回或 compaction。**
