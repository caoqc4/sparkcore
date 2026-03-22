# Role 主线能力总结 v1.0

## 1. 文档定位

本文档用于总结 SparkCore 当前阶段 `role` 主线已经完成的收口、代码落点与当前成熟度判断，作为下一轮是否继续深化 `role` 的判断依据。

本文档重点回答：

- `role` 这条线当前已经做到什么程度
- 哪些边界已经从设计变成代码事实
- 哪些部分仍停留在最小壳或兼容阶段
- 下一轮更合适继续推什么，而不该急着推什么

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/architecture/role_layer_design_v1.0.md`
> - `docs/architecture/role_repository_service_design_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/engineering/current_phase_progress_summary_v1.0.md`

---

## 2. 一句话总结

**`role` 主线当前已经从“runtime 邻近层里的最小读取 helper”推进成了“repository / resolver / runtime preparation”三层边界开始成立的状态；主路径也已开始直接消费新分层，但更复杂的选择规则与 metadata 收口仍未开始。**

---

## 3. 当前已经形成的主线

当前 `role` 主线已经可以更清楚地描述成：

- `RoleProfile`
- `RoleRepository`
- `RoleResolver`
- `prepareRuntimeRole(...)`
- `RoleCorePacket`

也就是说，`role` 现在不再只是：

- 一个 `loadRoleProfile(...)`
- 一个 `buildRoleCorePacket(...)`

而是开始出现更清楚的三段结构：

1. 读取层
2. 选择层
3. runtime packet 装配层

---

## 4. 已经成为代码事实的部分

当前已经落代码的 `role` 相关文件包括：

- [role-core.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/role-core.ts)
- [role-repository.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/role-repository.ts)
- [role-service.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/role-service.ts)
- [role-loader.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/role-loader.ts)

其中已经成为代码事实的能力包括：

- `RoleProfile` 第一版 contract
- `RoleCorePacket` 第一版 contract
- `buildRoleCorePacket(...)`
- `RoleRepository`
- `InMemoryRoleRepository`
- `SupabaseRoleRepository`
- `resolveRoleProfile(...)`
- `loadRoleProfile(...)` 作为兼容包装继续存在

---

## 5. 已进入真实主路径的部分

当前不只是代码壳存在，而是已经有真实主路径开始消费新分层：

- [runtime.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/runtime.ts)
- [im-runtime-port.ts](/Users/caoq/git/sparkcore/apps/web/lib/chat/im-runtime-port.ts)

这两条主路径现在都已开始直接依赖：

- `SupabaseRoleRepository`
- `resolveRoleProfile(...)`

这意味着：

- `role` 的新分层已经不只是“未来准备”
- runtime / IM 路径已经开始真正切到新边界

---

## 6. 当前仍处于过渡期的部分

虽然 `role` 主线已经明显前进，但当前仍有几块停留在过渡期：

### 6.1 `loadRoleProfile(...)` 仍保留

它现在更适合被理解为：

- 兼容包装
- 过渡层 API

而不是长期主入口。

### 6.2 resolver 仍只承接最小 fallback

当前 `resolveRoleProfile(...)` 只支持：

- `requestedAgentId`
- `latest active fallback`

还没有进入更复杂的选择语义，例如：

- thread 绑定优先级扩展
- default role 显式配置
- 更复杂的 owner / visibility 规则

### 6.3 role metadata 还没正式收口

当前还没有继续推进：

- `metadata.language_behavior`
- `metadata.relationship_stance`
- default model profile 更清楚的边界

它们仍然是下一阶段才值得碰的内容。

---

## 7. 当前成熟度判断

如果用一句更准确的话来描述当前状态：

**`role` 主干已经形成，分层边界已经开始进入真实主流程，但仍处在“最小选择语义 + 兼容包装仍在”的受控过渡期。**

这意味着它已经不是：

- 纯文档设计
- 纯 helper 整理

但也还不是：

- 完整 role domain layer
- 复杂 role policy system

---

## 8. 当前不建议立刻做的事

当前不建议马上继续做：

- 重型 role 版本管理
- 产品化角色编辑流程
- 多 role 协同策略
- 复杂 metadata 策略系统
- role 持久化 schema 大改

原因是：

- 当前最值钱的收口已经完成
- 如果继续往深处推，复杂度会开始迅速上升
- 但短期系统收益未必明显

---

## 9. 下一轮如果继续，最自然的方向

如果下一轮继续沿 `role` 主线推进，更自然的下一步会是：

1. 进一步减少 `loadRoleProfile(...)` 的存在感
2. 明确 runtime / IM 之外的调用面是否也要迁到 resolver
3. 再决定是否要正式收口 role metadata 边界

但这已经不是必须立刻做的事。

---

## 10. 一句话结论

**`role` 主线现在已经到了一个很健康的阶段节点：设计、代码壳、主路径接线都已完成，足以暂停并重新选择下一条主线，而不必继续在 `role` 上顺手多推几步。**
