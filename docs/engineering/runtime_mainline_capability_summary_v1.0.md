# Runtime Mainline 能力总结 v1.0

## 1. 文档定位

本文档用于总结 SparkCore 当前 `single-agent runtime` 主线已经推进到什么程度，重点回答：

- 当前 runtime 主线已经形成了哪些稳定层次
- 哪些能力已经是代码事实
- 哪些链路已经接到真实主入口
- 哪些函数当前仍然只是过渡期兼容层
- 下一步更适合继续推进什么，而不适合继续推进什么

本文档不是新的总设计，而是当前 runtime 主线的阶段性能力盘点。

> 状态：阶段总结
> 对应阶段：Phase 1 / runtime mainline 收口
> 相关文档：
> - `docs/architecture/runtime_input_contract_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`
> - `docs/architecture/runtime_execution_boundary_note_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md`
> - `docs/architecture/runtime_event_catalog_v1.0.md`
> - `docs/architecture/runtime_debug_metadata_naming_v1.0.md`
> - `docs/architecture/runtime_answer_strategy_debug_metadata_grouping_v1.0.md`

---

## 2. 一句话总结

**SparkCore 当前 runtime 主线已经从“Web chat 背后的整理版实现”推进成了一个开始具备显式 input、显式 preparation、显式 prepared execution 的 single-agent runtime 主干，但 execution 内部仍保留过渡期兼容函数。**

---

## 3. 当前已经形成的主线结构

当前 runtime 主线已经能比较清楚地描述成：

1. `RuntimeTurnInput`
2. `runAgentTurn(input)`
3. `prepareRuntimeSession(...)`
4. `prepareRuntimeRole(...)`
5. `prepareRuntimeMemory(...)`
6. `prepareRuntimeTurn(...)`
7. `PreparedRuntimeTurn`
8. `runPreparedRuntimeTurn(prepared)`
9. `RuntimeTurnResult`

这意味着当前已经不再只是：

- 一个大 `runtime.ts`
- 一些散落 helper
- 若干 Web 邻近层调用点

而是开始有一条真正可描述、可继续收敛的 runtime 主线。

---

## 4. 当前已成为代码事实的部分

### 4.1 统一输入层已成立

当前已经有：

- [runtime-input.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-input.ts)

其中已具备：

- `RuntimeTurnInput`
- `buildRuntimeTurnInput(...)`
- `buildRuntimeTurnInputFromAdapterInput(...)`

这意味着 runtime 输入已经不再只是文档约定，而是有真实代码壳。

### 4.2 统一入口已成立

当前已经有：

- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts)

其中已具备：

- `runAgentTurn(input)`

它当前仍是薄壳，但已经成为：

- IM 主入口
- Web chat 主入口

共享的统一 runtime 外部入口。

### 4.3 preparation 层已成立

当前已经有：

- [runtime-prepared-turn.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime-prepared-turn.ts)

其中已具备：

- `PreparedRuntimeTurn`
- `prepareRuntimeSession(...)`
- `prepareRuntimeRole(...)`
- `prepareRuntimeMemory(...)`
- `prepareRuntimeTurn(...)`

这意味着 runtime 装配层现在已经不只是“隐含在 runtime.ts 里的内部过程”，而是开始有了单独命名和单独文件。

### 4.4 prepared execution 层已成立

当前已经有：

- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts)

其中已具备：

- `runPreparedRuntimeTurn(prepared)`

虽然它当前还是第一版执行薄壳，但已经让：

- “装配前入口”
- “装配对象”
- “装配后执行”

三层开始显式分开。

---

## 5. 当前已接入真实主路径的部分

当前不只是“代码上存在这些对象”，而是已经接上了两条主入口：

### 5.1 IM 主入口

- [im-runtime-port.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/im-runtime-port.ts)

当前已做到：

- adapter input
- `RuntimeTurnInput`
- `runAgentTurn(input)`
- runtime result

### 5.2 Web chat 主入口

- [actions.ts](/Users/caoq/git/sparkcore/apps/web/app/chat/actions.ts)

当前已做到：

- 正常发送路径走 `RuntimeTurnInput`
- 重试路径也走 `RuntimeTurnInput`
- 两条路径都已接入 `runAgentTurn(input)`

这意味着当前 runtime 主线已经不是“只有 adapter 样本在用”，而是：

**Web + IM 两条真实主入口都已经开始共用它。**

另外，runtime 输出治理也已经开始进入文档收口阶段：

- [runtime_event_vs_debug_metadata_boundary_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_event_vs_debug_metadata_boundary_v1.0.md)
- [runtime_event_catalog_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_event_catalog_v1.0.md)
- [runtime_debug_metadata_naming_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_debug_metadata_naming_v1.0.md)
- [runtime_answer_strategy_debug_metadata_grouping_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_answer_strategy_debug_metadata_grouping_v1.0.md)
- [runtime_memory_debug_metadata_grouping_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_memory_debug_metadata_grouping_v1.0.md)
- [runtime_followup_debug_metadata_grouping_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_followup_debug_metadata_grouping_v1.0.md)
- [runtime_session_continuity_debug_metadata_grouping_v1.0.md](/Users/caoq/git/sparkcore/docs/architecture/runtime_session_continuity_debug_metadata_grouping_v1.0.md)

也就是说，当前 runtime 不只是“主路径已经形成”，连输出层的下一步治理方向也已经开始明确，而且 `answer_strategy*`、`memory*`、`follow_up*` 与 `session / continuity` 都已经开始进入最小 metadata 分组。

另外，`assistant_message.metadata` 这块历史调试面也已经开始进入统一收口：

- [assistant-message-metadata.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/assistant-message-metadata.ts)

当前已经开始通过统一 builder 生成 assistant metadata，并逐步形成：

- `model_profile`
- `language`
- `answer_strategy`
- `session`
- `memory`

这类 grouped shape。

但当前仍保留关键平铺字段，原因不是边界没想清楚，而是为了兼容：

- smoke tests
- quality eval
- session continuity 邻近读取逻辑

同时，assistant metadata 这条线已经不再只是“builder 开始写 grouped shape”，而是开始出现真实消费面迁移：

- [session-context.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/session-context.ts) 已开始优先读 `metadata.language.detected`
- [smoke.ts](/Users/caoq/git/sparkcore/apps/web/lib/testing/smoke.ts) 的 continuity helper 已开始优先读 `metadata.language.detected`
- [chat-thread-view.tsx](/Users/caoq/git/sparkcore/apps/web/app/chat/chat-thread-view.tsx) 的 runtime summary 已开始优先读：
  - `model_profile`
  - `memory`

另外，smoke 生成的 assistant metadata 当前也已开始补出兼容式 grouped shape，而不再只产出纯旧平铺结构。

同时，这条 assistant metadata / runtime metadata 线也已经进一步前移成：

- assistant metadata 当前已有：
  - 统一 builder
  - 统一 grouped/fallback read helper
- Web / IM 两侧 runtime preview metadata 当前也已有：
  - 统一 builder
  - 统一 updater
- 因而当前 runtime 输出治理的状态已经不再只是“字段开始收组”，而是：
  - 写出面开始统一
  - 读取面开始统一
  - preview metadata 也开始统一
- 同时 runtime 邻近的小型 helper 清扫也在继续前移：
  - `thread message` 的单跳 shell 已被裁掉
  - `runtime user message metadata` 小壳已被裁掉
  - `thread title` 已并回 `thread activity patch`
  - `follow_up claim` 单跳 shell 已被裁掉

另外，作为 runtime 邻近验证 harness 的 `smoke` 线，当前也已完成一轮较大规模拆薄：

- turn execution / analysis / context / memory update / assistant persistence 已明显分层
- reply / prompt / continuation / boundary routing 已明显分层
- 当前这一轮又持续裁掉了一批 type shell / wrapper / facade

这意味着当前 `smoke` 已更接近：

- 一套模块化的 runtime 行为模拟 harness

而不再是少数大文件里堆叠的测试逻辑实现。

---

## 6. 当前仍属于过渡期兼容层的部分

### 6.1 `generateAgentReply(...)`

当前它仍然存在于：

- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts)

它现在更适合被理解成：

- 过渡期兼容底层执行函数

而不是未来长期主入口。

也就是说，当前 runtime 主线的关系应该理解成：

- `runAgentTurn(input)` 是统一外部入口
- `prepareRuntimeTurn(...)` 是装配入口
- `runPreparedRuntimeTurn(prepared)` 是 execution 边界
- `generateAgentReply(...)` 是兼容底层函数

### 6.2 execution 内部仍未继续细拆

当前还没有进一步拆成独立层的包括：

- prompt builder
- model invoke wrapper
- assistant persistence helper
- runtime event builder
- memory write planning bridge
- follow-up planning bridge

这不是缺陷，而是当前阶段有意保守。

---

## 7. 当前最准确的成熟度判断

如果只看 runtime 主线，我认为当前最准确的判断是：

### 已经完成的

- input 显式化
- 外部入口显式化
- session / role / memory recall preparation 显式化
- prepared turn 对象显式化
- prepared execution 显式化
- Web / IM 双主入口接入

### 还没有完成的

- execution 进一步抽纯
- `generateAgentReply(...)` 彻底退薄
- 更细粒度的 execution 子模块拆分
- 真正跨 package 的 runtime core API

此外，runtime 邻近的 smoke harness 也已进入尾段清扫阶段：

- 继续清扫仍然有收益
- 但收益已经明显低于前半段大结构拆分
- 剩余更多是稳定公共原语，而不是必须继续裁掉的 facade

所以现在的状态不是：

- “runtime 还只是旧实现”

也不是：

- “runtime 已经完全底座化”

而是：

**runtime 主干已经形成，统一入口和装配边界已经成立，execution 层仍处在受控过渡期。**

---

## 8. 当前最适合的下一步

当前更适合的下一步不是立刻继续细拆 execution。

更稳的顺序是：

1. 先接受当前新边界已经成立  
   `RuntimeTurnInput -> prepareRuntimeTurn(...) -> PreparedRuntimeTurn -> runPreparedRuntimeTurn(...)`

2. 先治理 runtime 输出层  
   例如：
   - `runtime_events vs debug_metadata` 准入边界
   - `runtime event catalog`
   - `debug_metadata` 命名收口
   - `answer_strategy*` 的最小 metadata 分组
   - `assistant_message.metadata` 的统一 builder 与兼容式分组收口

3. 再决定是否继续缩薄 `generateAgentReply(...)`

4. 只有在这个判断明确后，再考虑 execution 内部更细颗粒度的拆分

也就是说，当前更重要的是：

**守住新主线，并先治理输出层，不要因为“已经能继续拆”就立刻掉进 execution 细碎重构。**

---

## 9. 结论

当前 runtime 主线已经到了一个健康停点：

- 主线结构已形成
- 主入口已接真实路径
- preparation 已进入代码事实
- prepared execution 已进入代码事实
- 旧执行函数的过渡期角色也已经明确

因此当前最合理的判断不是“继续猛拆”，而是：

**先把这条主线当作当前有效 runtime 架构接受下来，再决定下一步是否继续缩薄旧函数。**
