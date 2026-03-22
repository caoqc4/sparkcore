# Role Repository / Service 设计文档 v1.0

## 1. 文档定位

本文档用于定义 SparkCore 当前阶段 `role layer` 下一层边界：

- `RoleRepository`
- `RoleResolver` / `RoleService`
- runtime preparation

本文档重点回答：

- 当前 `loadRoleProfile(...)` 为什么不适合继续同时承担读取与选择
- `RoleProfile` 应由哪一层提供
- 角色选择 fallback 规则应由哪一层负责
- `prepareRuntimeRole(...)` 与 repository / service 的边界在哪里

> 状态：当前有效
> 对应阶段：Phase 1
> 相关文档：
> - `docs/architecture/role_layer_design_v1.0.md`
> - `docs/architecture/single_agent_runtime_design_v1.0.md`
> - `docs/architecture/runtime_prepared_turn_design_v1.0.md`

---

## 2. 一句话结论

**当前阶段应把 `role` 读取面拆成三层：repository 负责取数据，resolver/service 负责决定“本轮用哪个 role”，runtime preparation 只负责把已解析的 `RoleProfile` 转成 runtime 可消费的 role packet。**

---

## 3. 当前问题

当前代码里的 `loadRoleProfile(...)` 同时承担了两类职责：

1. 读 `agents` 表
2. 决定本轮 role 的 fallback

当前已有的 fallback 行为包括：

- 有 `agentId` 时按 id 读取
- 无 `agentId` 时回退到最近更新的 active agent

这在 Phase 1 能工作，但会带来三个问题：

### 3.1 读取语义和选择语义耦合

runtime、IM port、未来别的入口都在直接依赖：

- 读表字段
- active 过滤规则
- fallback 选择规则

这会让后面 role 主线继续正式化时，调用面越来越散。

### 3.2 runtime preparation 边界不够干净

`prepareRuntimeRole(...)` 的职责应是：

- 消费已解析的 `RoleProfile`
- 产出 `RoleCorePacket`

而不是继续关心：

- role 从哪张表来
- 是否需要 fallback
- 是否取最近更新的 active role

### 3.3 后续扩展空间受限

只要还把“读取 + fallback”绑成一个函数，后面这些变化都会更难做：

- 显式 default role
- 用户指定 role 与 thread 绑定 role 的优先级
- 管理态 role 状态判断
- repository 替换成别的后端

---

## 4. 当前阶段目标

当前阶段的目标不是做一个复杂 role domain service，而是先把最小边界稳定下来：

1. `RoleProfile` 的读取来源清楚
2. “本轮到底选哪个 role” 的规则清楚
3. runtime preparation 不再直接背读取/选择逻辑
4. 后续可平滑推进到 repository shell 与 service shell

当前状态前移到：

- `RoleRepository` 第一版代码壳已存在
- `role-loader.ts` 已开始复用 repository 的纯读取能力
- `RoleResolver` / `RoleService` 第一版代码壳已存在
- runtime / IM 主路径已开始直接迁到 resolver

---

## 5. 当前阶段非目标

当前阶段不做：

- 复杂角色版本管理
- 角色继承体系
- 多 role 编排与协同
- 产品化角色选择 UI 流程
- 重型权限/审批模型

---

## 6. 建议分层

## 6.1 `RoleRepository`

`RoleRepository` 负责：

- 从存储层读取 `RoleProfile`
- 不负责业务 fallback
- 不负责 runtime packet 组装

当前建议最小接口：

```ts
type RoleRepository = {
  getRoleProfileById(input: {
    workspaceId: string;
    userId: string;
    agentId: string;
  }): Promise<RoleProfile | null>;

  getLatestActiveRoleProfile(input: {
    workspaceId: string;
    userId: string;
  }): Promise<RoleProfile | null>;
};
```

repository 的典型特征是：

- 知道表结构
- 知道 select 字段
- 知道 active 过滤条件
- 不知道“本轮为何要这样选”

---

## 6.2 `RoleResolver` / `RoleService`

`RoleResolver` 负责：

- 决定本轮 role 选择规则
- 协调 repository
- 对 runtime 暴露更稳定的“解析结果”

当前建议最小接口：

```ts
type ResolveRoleProfileInput = {
  workspaceId: string;
  userId: string;
  requestedAgentId?: string | null;
};

type ResolveRoleProfileResult =
  | {
      status: "resolved";
      role: RoleProfile;
      resolution: "requested-agent" | "latest-active-fallback";
    }
  | {
      status: "not_found";
      resolution: "requested-agent-missing" | "no-active-role";
    };
```

当前阶段 resolver 只需要负责最小 fallback：

1. 有 `requestedAgentId`
   - 优先按 id 查
   - 查不到返回 `requested-agent-missing`
2. 没有 `requestedAgentId`
   - 回退到最近更新的 active role
   - 查不到返回 `no-active-role`

这一步的重点是：

**把“选哪个 role”的语义从原始数据读取里拿出来。**

---

## 6.3 runtime preparation

runtime preparation 负责：

- 消费已解析的 `RoleProfile`
- 结合 language / relationship recall / session continuity
- 产出 `RoleCorePacket`

当前建议边界：

- `prepareRuntimeRole(...)` 不直接读表
- `prepareRuntimeRole(...)` 不直接决定 fallback
- `prepareRuntimeRole(...)` 只面向 role packet 装配

也就是说：

```ts
resolvedRole -> prepareRuntimeRole(...) -> RoleCorePacket
```

而不是：

```ts
runtime -> read role table -> decide fallback -> build role packet
```

---

## 7. 当前建议的数据流

## 7.1 Web / IM 入口

当前建议的数据流应逐步收敛成：

1. 入口拿到：
   - `workspaceId`
   - `userId`
   - `requestedAgentId?`
2. 调 `RoleResolver`
3. 得到 `RoleProfile`
4. 调 `prepareRuntimeRole(...)`
5. 产出 `RoleCorePacket`

---

## 7.2 与 `PreparedRuntimeTurn` 的关系

在 runtime 主线里，role 的理想位置应是：

- `RuntimeTurnInput`
  不直接携带完整 `RoleProfile`
- `prepareRuntimeRole(...)`
  消费已解析 role
- `PreparedRuntimeTurn`
  持有 `role_core`

当前阶段不建议让 `PreparedRuntimeTurn` 反向承担 role 选择。

---

## 8. 与现有代码的映射

当前代码现实大致是：

- `role-repository.ts`
  已开始承担纯读取层职责
- `role-service.ts`
  已开始承担最小 role 选择语义
- `role-loader.ts`
  仍承担兼容包装职责，但其读取与选择部分已开始复用 repository + resolver
- `role-core.ts`
  承担 role packet 组装职责
- `runtime.ts`
  仍直接参与 role 读取
- `im-runtime-port.ts`
  仍直接参与 role 读取

更稳的下一步不是一次性重写，而是按下面顺序推进：

1. 先把 repository / resolver 边界在文档里固定
2. 再把纯读取层先抽成：
   - `role-repository.ts`
3. 再引入：
   - `role-service.ts` 或 `role-resolver.ts`
4. 再把 runtime / IM port 改成依赖 resolver，而不是继续依赖兼容包装

状态：

- 已开始

---

## 9. 当前建议的最小代码推进顺序

### 第一步

引入最小 `RoleRepository` 类型与 `SupabaseRoleRepository` shell。

状态：

- 已完成

### 第二步

引入最小 `resolveRoleProfile(...)`。

状态：

- 已完成

### 第三步

把 `runtime.ts` 和 `im-runtime-port.ts` 从直接调用 `loadRoleProfile(...)`，改成调用 resolver。

### 第四步

保留 `role-core.ts` 作为 runtime-facing packet builder，不急着再拆。

---

## 10. 当前最重要的边界判断

### 属于 repository

- `agents` 表字段选择
- workspace/user/status 过滤
- id 查询
- 最近更新时间排序

### 属于 resolver / service

- requested role 优先级
- fallback 到 latest active role
- not found 分类

### 属于 runtime preparation

- 把 `RoleProfile` 变成 `RoleCorePacket`
- 结合 relationship recall 和 reply language 形成 role packet

---

## 11. 当前阶段 DoD

当前阶段 role 下一层边界收口完成，应至少满足：

1. `RoleRepository` 边界被明确
2. `RoleResolver` / `RoleService` 边界被明确
3. `prepareRuntimeRole(...)` 不再被视为读取 role 的地方
4. runtime / IM port 后续迁移路径清楚

---

## 12. 一句话总结

**role 当前最值得推进的，不是继续补产品化角色系统，而是把“读 role”和“选 role”从 runtime 邻近实现里拆出来，让 repository / service / runtime preparation 三层边界正式成立。**
