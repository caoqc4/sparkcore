# SparkCore Memory Upgrade P15 Execution Plan v1.0

## 1. 文档定位

本文档用于在 `P14 close-ready / close note` 之后，把 `Memory Upgrade` 的下一阶段施工重点压成一份可执行基线。

本文档不是：

- `P0 ~ P14` 收官说明
- 完整长期架构总纲
- 对外公开产品路线文档

本文档是：

- `P15` 的第一批实施基线
- 从 `P14` 已成立的 governance fabric plane 事实，继续推进到“更统一的 phase-level memory governance plane contract、更稳定的 cross-surface plane consumption、以及更明确的 close-readiness consumption surface”的执行文档

上层输入：

- [memory_upgrade_p14_close_note_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_close_note_v1.0.md)
- [memory_upgrade_p14_close_readiness_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_close_readiness_v1.0.md)
- [memory_upgrade_p14_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_execution_plan_v1.0.md)
- [memory_upgrade_p14_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p14_gate_snapshot_v1.0.md)
- [memory_upgrade_tail_cleanup_backlog_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_tail_cleanup_backlog_v1.0.md)
- `doc_private/SparkCore_记忆层升级方案_v0.2.md`
- [memory_upgrade_execution_plan_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_execution_plan_v1.0.md)

---

## 2. P15 的一句话目标

**在 `P14` 已建立的 namespace / retention / knowledge / scenario governance fabric plane 基础上，把 SparkCore 记忆系统继续推进到“更统一的 phase-level memory governance plane contract、更稳定的 cross-surface plane consumption、以及更接近 close-readiness 直接消费的 phase snapshot / contract surface”的阶段。**

---

## 3. P15 与 P14 的分界

P14 已经解决的，是：

- namespace / retention / knowledge / scenario 四条主线都已进入 governance fabric plane
- prompt / assistant metadata / runtime debug / write preview / harness 已出现 plane-level contract reuse
- 第一版 `P14` 正式 gate、gate snapshot、close-readiness、close note 已成立
- `P14` 非阻塞尾项已统一并入 tail cleanup backlog

P15 不再重复做这些 “v12 governance fabric plane 最小成立证明”。

P15 重点解决的是：

1. 把四条主线从“各自已有 plane 事实”继续推进到更统一的 phase-level governance plane contract
2. 把 gate snapshot 从“可读阶段快照”继续推进到更稳定的 close-readiness / close-note 消费面
3. 把 cross-surface plane output 从“事实已暴露”继续推进到更明确的对称性与统一命名
4. 把当前还分散在 harness / metadata / summary 的 plane 判断，进一步收束成更稳定的 phase snapshot surface
5. 为后续阶段减少“每一轮 close-readiness 都要重复解释一次 plane 事实”的文档和 gate 成本

---

## 4. P15 首批目标

### 4.1 Namespace governance plane contract unification

P15 首批要把 namespace 从“已有 governance fabric plane digest / summary / alignment / reuse”继续推进到：

- 更稳定的 namespace governance plane contract surface
- 更明确的 retrieval / write / preview 命名对称性
- 更适合 phase snapshot 消费的 namespace governance plane 摘要

最小要求：

- 至少一条 namespace plane 输出开始显式服务于 phase snapshot / close-readiness 消费
- 至少一组 retrieval / write / preview 输出面在命名和摘要上更对称

### 4.2 Retention governance plane consumption unification

P15 首批要把 retention 从“已有 lifecycle governance fabric plane digest / summary / alignment / reuse”继续推进到：

- 更稳定的 keep / drop / compaction phase snapshot surface
- 更明确的 retention governance plane consumption contract
- 更适合 close-readiness 直接引用的 retention plane 摘要

最小要求：

- 至少一条 retention plane 输出开始显式服务于 phase snapshot / close-readiness 消费
- 至少一组 keep / drop / compaction 摘要面在命名和结构上更稳定

### 4.3 Knowledge governance plane consumption unification

P15 首批要把 knowledge 从“已有 governance fabric plane digest / summary / mode / reuse”继续推进到：

- 更稳定的 source / budget phase snapshot surface
- 更明确的 prompt / metadata / budget 对称消费
- 更适合 phase-level contract 引用的 knowledge plane 摘要

最小要求：

- 至少一条 knowledge plane 输出开始显式服务于 phase snapshot / close-readiness 消费
- 至少一组 prompt / metadata / budget 输出面在命名和摘要上更对称

### 4.4 Scenario governance plane contract consolidation

P15 首批要把 scenario 从“已有 governance fabric plane digest / summary / mode / reuse”继续推进到：

- 更稳定的 scenario governance plane contract surface
- 更明确的 pack strategy / orchestration / debug 对称消费
- 更适合 phase snapshot / close-note 引用的 scenario plane 摘要

最小要求：

- 至少一条 scenario plane 输出开始显式服务于 phase snapshot / close-readiness 消费
- 至少一组 prompt / metadata / debug 输出面在命名和摘要上更稳定

### 4.5 Regression / acceptance continuation

P15 首批必须继续让阶段 gate 跟着主线生长，而不是等 phase-level contract 成型之后再回头补。

最小要求：

- `P15` 形成第一版阶段 gate
- gate 至少开始锁：
  - phase-level governance plane contract consistency
  - phase snapshot consumption consistency
  - close-readiness consumption symmetry
- gate 至少开始暴露：
  - phase snapshot
  - blocking / non-blocking gap classification
  - close-note 可复用摘要

---

## 5. P15 施工顺序建议

建议顺序：

1. `P15-1 Namespace governance plane contract unification`
2. `P15-2 Retention governance plane consumption unification`
3. `P15-3 Knowledge governance plane consumption unification`
4. `P15-4 Scenario governance plane contract consolidation`
5. `P15-5 Regression / acceptance continuation`

原因：

- namespace 仍然是最上游的治理边界，先把它收成更稳定的 plane contract surface，后面的 retention / knowledge / scenario 更容易共享 phase snapshot 与 close-readiness consumption 口径
- retention / knowledge / scenario 在 `P14` 已经具备 plane 事实，当前更高价值的不是重复加字段，而是收束消费面与命名对称性
- `P15-5` 继续保持“跟着主线长”，避免 phase-level contract 已经开始形成，但 gate / snapshot / close-readiness 还停留在上一阶段口径

当前阶段判断：

- `P15-1`
  - 已开始
  - namespace governance plane contract unification 第一刀已成立
- `P15-2`
  - 已开始
  - retention governance plane consumption unification 第一刀已成立
- `P15-3`
  - 已开始
  - knowledge governance plane consumption unification 第一刀已成立
- `P15-4`
  - 待开始
- `P15-5`
  - 已开始
  - 第一版 gate 雏形已建立

整体 `P15` 当前大约：

- **`30% - 35%`**

当前更推荐的下一步：

- **继续把 `P15-1 Namespace governance plane contract unification` 从 namespace 扩到 phase snapshot / gate 雏形，而不是立刻横向铺开 `P15-2 ~ P15-4`**

---

## 6. 当前结论

`P14` 当前已经具备明确的收官结论与下一阶段施工起点。

因此：

- `P14` 可以正式视为已收官阶段
- `P15` 应作为新的执行起点
- `P15` 当前更合适的第一步不是继续横向扩张新字段，而是把 `P14` 已成立的 plane 事实继续收束成更统一的 phase-level contract / snapshot / close-readiness consumption surface
- `P15-1 Namespace governance plane contract unification` 的第一刀当前已经成立：
  - [memory-namespace.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-namespace.ts) 已新增 `resolveNamespaceGovernanceFabricPlanePhaseSnapshot(...)`，把 namespace governance fabric plane 收成更直接可消费的 phase snapshot / contract surface
  - [runtime-debug-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-debug-metadata.ts) 已把 namespace phase snapshot 接入 `memory_namespace` debug surface
  - [runtime-preview-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-preview-metadata.ts) 与 [memory-write-targets.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-write-targets.ts) 已把这组 phase snapshot 字段接入 write preview / target routing
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已新增 `p15_namespace_governance_plane_contract.namespace_governance_plane_contract_unification_v1_ok`
- `P15-5 Regression / acceptance continuation` 的第一刀当前也已经成立：
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已新增 `p15_regression_gate`
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 当前也已新增 `p15_gate_snapshot`
  - 当前 gate 轻量快照请以 [memory_upgrade_p15_gate_snapshot_v1.0.md](/Users/caoq/git/sparkcore/docs/engineering/memory_upgrade_p15_gate_snapshot_v1.0.md) 为准
- `P15-2 Retention governance plane consumption unification` 的第一刀当前也已经成立：
  - [thread-compaction.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/thread-compaction.ts) 已新增 `resolveThreadGovernanceFabricPlanePhaseSnapshot(...)`，把 retention governance fabric plane 收成更直接可消费的 phase snapshot surface
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已新增 `p15_retention_governance_plane_consumption.retention_governance_plane_consumption_unification_v1_ok`
  - 当前 `p15_regression_gate` 已从 `1 / 1` 推进到 `2 / 2`
- `P15-3 Knowledge governance plane consumption unification` 的第一刀当前也已经成立：
  - [memory-knowledge.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/memory-knowledge.ts) 已新增 `resolveKnowledgeGovernanceFabricPlanePhaseSnapshot(...)`，把 knowledge governance fabric plane 收成更直接可消费的 phase snapshot surface
  - [memory-upgrade-harness.ts](/Users/caoq/git/sparkcore/apps/web/scripts/memory-upgrade-harness.ts) 已新增 `p15_knowledge_governance_plane_consumption.knowledge_governance_plane_consumption_unification_v1_ok`
  - 当前 `p15_regression_gate` 已从 `2 / 2` 推进到 `3 / 3`
  - 当前基础验证已通过：
    - `pnpm --filter @sparkcore/web memory:upgrade:harness`
    - `./apps/web/node_modules/.bin/tsc --pretty false --noEmit -p apps/web/tsconfig.json`
