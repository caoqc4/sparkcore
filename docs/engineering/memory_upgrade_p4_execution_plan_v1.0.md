# SparkCore Memory Upgrade P4 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P3 close-ready` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0` / `P1` / `P2` / `P3` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P4` 的第一批实施基线
- 从 `P3` 已成立事实，推进到“更完整的 namespace 边界、更实的 retention budget、更深的 knowledge route 作用与更可扩的 scenario pack 消费差异”的执行文档

上层输入：

- [memory_upgrade_p3_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_close_note_v1.0.md)
- [memory_upgrade_p3_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_close_readiness_v1.0.md)
- [memory_upgrade_p3_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p3_execution_plan_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P4 的一句话目标

**在 `P3` 已建立的 namespace / retention / knowledge / scenario pack 主骨架基础上，把 SparkCore 记忆系统推进到“更完整的边界治理、更明确的预算与路由差异、以及更接近真实多场景记忆操作系统”的阶段。**

---

## 3. P4 与 P3 的分界

P3 已经解决的，是：

- namespace 已进入 recall / write / target resolution / scope routing
- retention 已进入 mode / reason / keep-drop / retained section selection
- knowledge 已进入 scope layer / prompt priority / namespace-aware ordering
- scenario pack 已从单默认 seam 进入 `namespace + knowledge` 的真实选择
- 第一版 `P3` regression gate 已成立

P4 不再重复做这些“最小成立证明”。

P4 重点解决的是：

1. namespace 从单次 recall/write 决策推进到更完整的 retrieval / write boundary 治理
2. retention 从最小保留策略推进到更明确的 budget / pruning 组合
3. knowledge scope 从 prompt priority 推进到更真实的 route / assembly 作用
4. scenario pack 从选择与 prompt guidance 推进到更明确的消费差异与扩展约束
5. `P4` 的 close gate 与回归面立住

---

## 4. P4 首批目标

P4 首批不追求把多 Agent 世界模型或完整 pack 插件系统一次做满，而是先完成以下五件事。

### 4.1 Namespace retrieval / write boundary v2

P4 首批要做的，是把 namespace 从：

- recall applicability
- write dedupe / refresh
- routed scope preview

继续推进到：

- 更明确的 retrieval boundary
- 更明确的 write boundary
- 更明确的 project / world / thread 路由治理

最小要求：

- 至少再补一条 retrieval 决策显式受 namespace 影响
- 至少再补一条 write target / route 决策显式受 namespace 影响
- namespace boundary 不再只停在单次 helper 判断，而要形成更稳定的主路径事实

当前已成立的第一刀代码事实：

- `apps/web/lib/chat/memory-namespace.ts` 当前已开始提供统一的 `resolveRuntimeMemoryBoundary(...)`
- 这层 boundary 当前已开始把 namespace 显式收成：
  - `retrieval_boundary`
  - `write_boundary`
  - `allow_timeline_fallback`
- `apps/web/lib/chat/memory-recall.ts` 当前已开始复用这层 boundary：
  - thread-primary namespace 下，会主动关闭 `timeline` fallback
  - recall route 当前会从
    - `thread_state,profile,episode,timeline`
    收紧成
    - `thread_state,profile,episode`
- `apps/web/lib/chat/memory-write-targets.ts` 当前也已开始复用同一层 boundary helper，使 write boundary 与 retrieval boundary 不再各自手写
- `memory-upgrade-harness.ts` 当前也已开始显式校验：
  - thread-primary namespace 会解析出 `thread` retrieval/write boundary
  - thread-primary namespace 会关闭 `timeline` fallback

当前已成立的第二刀代码事实：

- `apps/web/lib/chat/memory-write-targets.ts` 当前已开始在 namespace-aware target resolution 中显式产出：
  - `routed_project_id`
  - `routed_world_id`
- 也就是说，write routing 当前不只知道自己落在哪一层 boundary，也开始知道自己落到哪组 project/world namespace 实体
- `apps/web/lib/chat/runtime-preview-metadata.ts` 当前也已开始把这层 routed project/world ids 暴露到 memory write preview
- `memory-upgrade-harness.ts` 当前也已开始显式校验：
  - project boundary 下会解析出 `project-1 / world-1`
  - runtime memory write preview 会暴露这层 routed project/world ids

### 4.2 Retention budget / pruning v2

P4 首批要把 `Thread retention` 从：

- mode
- reason
- keep-drop
- retained section selection

继续推进到：

- 更明确的 retention budget
- 更明确的 pruning 组合
- 更明确的 compacted section 取舍依据

最小要求：

- 至少一条 budget helper 成为真实主路径输入
- 至少一条 pruning 决策开始显式区分不同 retention mode

### 4.3 Knowledge route influence v2

P4 首批要把 `Knowledge` 从：

- scope summary
- prompt labeling
- prompt priority

继续推进到：

- 更真实的 retrieval / route influence
- 更真实的 context assembly order 作用

最小要求：

- 至少一条 knowledge route/assembly 决策开始显式受 `project / world / general` 影响
- 不再只靠 prompt 中的排序体现差异

### 4.4 Scenario pack consumption expansion v2

P4 首批要把 `Scenario pack` 从：

- pack selection
- preferred routes
- assembly order
- pack-specific knowledge budget

继续推进到：

- 更明确的 pack-specific consumption 差异
- 更清晰的扩展约束与扩展边界

最小要求：

- 至少再补一条真实消费差异
- 至少再补一条 pack-level route / budget / assembly 约束

### 4.5 P4 regression / acceptance expansion

P4 首批要把 gate 继续扩大到：

- namespace boundary v2
- retention budget / pruning v2
- knowledge route influence v2
- scenario pack consumption expansion v2

目标不是把所有行为都锁死，而是确保 `P4` 的新增事实不会退回：

- 只存在于 prompt 文本
- 只存在于 metadata
- 只存在于文档

---

## 5. P4 明确不做的事项

P4 首批明确不做：

- 完整多 Agent 共享记忆仲裁系统
- 完整世界状态同步引擎
- 可插拔第三方 pack marketplace
- 大规模自动 retention/cleanup 后台任务系统
- 独立 knowledge product / CMS / ingestion platform

这些方向不是不做，而是不纳入 `P4` 首批闭环。

---

## 6. P4 当前建议推进顺序

建议顺序：

1. `P4-1 Namespace retrieval / write boundary v2`
2. `P4-2 Retention budget / pruning v2`
3. `P4-3 Knowledge route influence v2`
4. `P4-4 Scenario pack consumption expansion v2`
5. `P4-5 regression / acceptance expansion`

原因：

- namespace 仍是最容易牵动主路径边界的线
- retention 继续深化后，compaction 才不会停在“摘要说明”层
- knowledge 与 pack 的更深差异，应建立在边界与预算进一步稳定之后
- gate 继续放在阶段中后段建立，避免代码事实先长、阶段判断后补

---

## 7. 当前执行建议

如果继续沿 `Memory Upgrade` 主线推进，`P4` 最自然的第一刀是：

- **Namespace retrieval / write boundary v2**

原因：

- `P3` 已把 namespace 推到 recall / write / routed scope
- 再往前一刀，最容易形成 `P4` 的第一条真实主路径事实
- 这也最能决定后续 retention / knowledge / pack 差异能否站在稳定边界上继续做深
