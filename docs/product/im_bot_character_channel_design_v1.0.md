# IM Bot 角色渠道设计文档 v1.0

## 1. 文档定位

本文档定义 SparkCore 在 IM 平台上的多角色 bot 设计方案，重点覆盖：

- 三角色渠道策略
- 多平台可行性评估
- 平台无关的渠道抽象
- Telegram 3-bot 的 v1 实现方案

本文档的目标不是讨论所有 IM 平台的最终接入细节，而是为当前最值得落地的 `Telegram 3-bot` 方案提供可执行设计。

> 状态：当前有效
> 对应阶段：Phase 1（Telegram 3-bot）
> 相关文档：
> - `docs/product/role_preset_and_creation_design_v1.0.md`
> - `apps/web/app/connect-im/page.tsx`
> - `apps/web/app/api/integrations/telegram/webhook/route.ts`

---

## 2. 背景与问题

Telegram 等 IM 平台中，bot 的头像、用户名、昵称在用户侧是固定可见的。

如果 SparkCore 的三个预设角色：

- 女朋友 `Caria`
- 男朋友 `Teven`
- 女助理 `Velia`

都共用同一个 Telegram bot，那么用户在 Telegram 中始终看到的是同一个头像和 bot 名称，这会和当前对话角色的人设产生错位，带来明显跳出感。

这个问题在 Web 内相对不明显，因为 Web 可以直接展示角色头像和名字；但在 IM 中，bot 本体就是用户感知到的入口，因此需要让“渠道形象”和“角色类型”尽量一致。

---

## 3. 设计目标

本方案的目标是：

1. 让 Telegram 中的 bot 形象和角色类型尽量一致，降低跳出感。
2. 让用户在绑定 IM 时获得明确推荐，而不是自己猜该连哪个 bot。
3. 保持现有下游聊天 runtime 尽量不动，把多 bot 差异收敛在 adapter / env / binding 层。
4. 为未来扩 Discord 等“可多 bot”的平台预留通用抽象。
5. 不把 Telegram 的物理 bot 概念直接泄露到产品主模型中。

---

## 4. 核心方案

### 4.1 方案摘要

在 Telegram 上为三类角色分别准备三个独立 bot：

| 角色渠道 | 对应 bot 昵称 | 适用角色类型 |
|---|---|---|
| `caria` | Caria | `companion + female`，以及默认伴侣渠道 |
| `teven` | Teven | `companion + male` |
| `velia` | Velia | `assistant` |

用户在完成角色创建后，系统根据角色属性推荐其中一个 bot 进行绑定。

这里记录在业务数据中的不是“绑定了哪个 Telegram token”，而是“绑定了哪条角色渠道”。

### 4.2 采用策略

采用策略：

`角色名 + 说明文案`

即：

- Caria bot
- Teven bot
- Velia bot

这比统一品牌 bot 更有角色辨识度，更适合当前 3 个预设角色的沉浸体验。

### 4.3 未采用策略

未采用：

`emoji + 品牌名`

例如：

- `💕 SparkCore`
- `🌿 SparkCore`
- `✦ SparkCore`

原因：

- 对预设角色的沉浸感较弱
- 用户需要自己把“bot 形象”和“角色类型”做二次映射
- 在 Telegram 中的第一感知不如直接看到角色名强

---

## 5. 自定义角色的错位处理

### 5.1 问题描述

用户可能创建自定义角色，例如：

- 名字：`Luna`
- 模式：`companion`
- avatar gender：`female`

系统会推荐该角色走 `caria` 渠道。

此时 Telegram 里的 bot 名称是 `Caria`，而用户自己创建的角色叫 `Luna`。这会存在一定轻微错位。

### 5.2 v1 处理方式

绑定页提供一句说明文案：

> 你的角色 Luna 将通过 Caria 与你互动

这句话明确区分：

- `Luna` 是角色
- `Caria` 是 Telegram 渠道载体

### 5.3 为什么这个处理足够

当前阶段这是一个可以接受的低成本解法，因为：

- 预设角色用户会获得几乎完全匹配的 IM 体验
- 自定义角色用户虽然存在轻微错位，但不会影响功能可用性
- 说明文案足以解释“bot 是渠道，不是角色本体”

未来如果产品验证通过，可将“专属 bot”作为更高成本的高级功能，而不是在 v1 中追求。

---

## 6. 推荐逻辑

### 6.1 推荐输入

推荐只依赖当前稳定、简单、可解释的角色属性：

- `mode`
- `avatarGender`

不依赖：

- `role.name`
- `persona_summary`
- 更复杂的语义推断

这样推荐逻辑简单、稳定、易于向用户解释。

### 6.2 推荐规则

```typescript
function recommendCharacterChannel(
  mode: ProductRoleMode,
  avatarGender: ProductRoleAvatarGender | null
): CharacterChannelSlug {
  if (mode === "assistant") return "velia";
  if (avatarGender === "male") return "teven";
  return "caria";
}
```

解释：

- `assistant` 一律推荐 `velia`
- `companion + male` 推荐 `teven`
- 其余情况默认推荐 `caria`

其中“其余情况”包括：

- `companion + female`
- `companion + neutral`
- `companion + null`

### 6.3 是否允许用户改选

允许。

系统给出推荐，但不做强制绑定。

这是因为：

- 有些用户可能更喜欢某个 bot 的头像或名字
- 推荐是为了降低选择成本，不是为了限制使用

---

## 7. 多平台可行性评估

### 7.1 各平台分析

| 平台 | 3-bot 可行性 | 复杂度 | 结论 |
|---|---|---|---|
| Telegram | ✅ 完全可行 | 低 | 当前最适合先落地 |
| Discord | ✅ 完全可行 | 低 | 后续最值得扩的第二平台 |
| 微信公众号 | ⚠️ 成本很高 | 极高 | 不适合复制 3 账号方案 |
| 企业微信 | ⚠️ 有限可行 | 高 | 企业场景复杂，不适合作为下一步 |
| WhatsApp | ❌ 基本不行 | 极高 | 账号与手机号绑定，运营成本高 |
| Line | ⚠️ 可行但繁 | 中 | 可做，但不应早于 Telegram / Discord |

### 7.2 核心判断

`3-bot` 方案是 Telegram / Discord 这类“开发者 bot 平台”的专属优势。

这些平台允许开发者低成本创建多个独立 bot，因此适合用“多渠道形象”提升角色沉浸感。

而微信、WhatsApp 等平台，本质上更接近真实账号体系，创建和维护多个账号的成本太高，不适合强行套用同一方案。

### 7.3 对后续平台的启示

因此，当前架构设计不能把 `3 个 Telegram bot` 硬编码成产品真相，而应该抽象成：

`character_channel_slug`

平台 adapter 自己决定：

- Telegram: 3 个物理 bot
- Discord: 3 个物理 application / bot
- 微信公众号: 1 个账号 + 文案区分
- WhatsApp: 1 个账号 + 文案区分

---

## 8. 架构抽象原则

### 8.1 核心抽象：character_channel_slug

产品层不直接感知物理 bot，而是只认角色渠道：

```text
character_channel_slug: "caria" | "teven" | "velia"
```

这一层表达的是：

“这个用户在当前 IM 平台上绑定的是哪条角色渠道”

而不是：

“这个用户绑定了哪个 Telegram token”

### 8.2 映射关系

```text
character_channel_slug
        ↓
 platform adapter 决定具体载体
        ↓
Telegram  ->  3 个独立 bot
Discord   ->  3 个独立 bot
WeChat    ->  1 个公众号 + 文案区分
WhatsApp  ->  1 个账号 + 文案区分
```

### 8.3 为什么不用 bot_slug

`bot_slug` 的问题是它会把“Telegram 的物理 bot”暴露到更上层的产品模型里。

而当前我们真正想表达的是角色渠道，不是物理 bot 本体。

所以字段命名用：

`character_channel_slug`

更准确，也更兼容未来平台差异。

---

## 9. 数据模型与约束

### 9.1 channel_bindings 新字段

```sql
ALTER TABLE channel_bindings
ADD COLUMN character_channel_slug text;
```

建议取值：

- `caria`
- `teven`
- `velia`

### 9.2 v1 兼容策略

为避免影响已有 Telegram 单 bot 数据，v1 先采用兼容迁移：

- 字段先允许 `NULL`
- 老 binding 不立即强制回填
- 新的 Telegram binding 必须写入 `character_channel_slug`

后续当旧数据全部迁移完后，再考虑是否补：

- `NOT NULL`
- check constraint
- 唯一约束/索引

### 9.3 绑定查找语义

收到 Telegram 消息时，binding 查找条件应升级为：

- `platform`
- `channel_id`
- `peer_id`
- `character_channel_slug`

如果现有逻辑还依赖 `platform_user_id`，实现时应保持兼容，不要无意中改变 lookup 语义。

### 9.4 唯一性目标

目标语义是：

同一用户、同一平台、同一会话对象下，可以绑定不同角色渠道，但不能因为多个渠道共用相同 `channel_id + peer_id` 而发生串线。

换句话说，`character_channel_slug` 是区分同平台多 bot binding 的关键维度。

---

## 10. Telegram v1 具体实现方案

### 10.1 Bot 注册

通过 BotFather 手动注册 3 个 bot：

| 渠道 | Bot 昵称 | 建议用户名 | 环境变量 |
|---|---|---|---|
| `caria` | Caria | `@CariaSpark` | `TELEGRAM_BOT_TOKEN_CARIA`, `TELEGRAM_WEBHOOK_SECRET_CARIA`, `TELEGRAM_BOT_USERNAME_CARIA` |
| `teven` | Teven | `@TevenSpark` | `TELEGRAM_BOT_TOKEN_TEVEN`, `TELEGRAM_WEBHOOK_SECRET_TEVEN`, `TELEGRAM_BOT_USERNAME_TEVEN` |
| `velia` | Velia | `@VeliaSpark` | `TELEGRAM_BOT_TOKEN_VELIA`, `TELEGRAM_WEBHOOK_SECRET_VELIA`, `TELEGRAM_BOT_USERNAME_VELIA` |

头像建议从 `character-assets` bucket 取各角色对应的 `portrait-chat.webp`。

### 10.2 Webhook 路由

现有单 bot 路由：

```text
/api/integrations/telegram/webhook
```

改为角色渠道路由：

```text
/api/integrations/telegram/webhook/caria
/api/integrations/telegram/webhook/teven
/api/integrations/telegram/webhook/velia
```

建议实现方式：

```text
apps/web/app/api/integrations/telegram/webhook/[character_channel_slug]/route.ts
```

Route 的职责：

1. 从 URL 读取 `character_channel_slug`
2. 读取对应 bot 的 token / secret / username
3. 校验 webhook secret
4. 把 `character_channel_slug` 传入后续 binding lookup / runtime input
5. 下游消息处理逻辑尽量保持不动

### 10.3 env 抽象

当前已有：

```ts
getTelegramBotEnv()
```

v1 建议改成：

```ts
type TelegramCharacterChannelSlug = "caria" | "teven" | "velia";

function getTelegramBotConfig(slug: TelegramCharacterChannelSlug) {
  // 返回 botToken / webhookSecret / botUsername
}
```

这里要特别包含：

- `botToken`
- `webhookSecret`
- `botUsername`

因为 `connect-im` 页面需要用 `botUsername` 生成 `t.me/...` 深链，不能把用户名散落硬编码在页面层。

### 10.4 Binding 查找更新

binding lookup 增加 `character_channel_slug` 条件。

目标是做到：

- `caria` bot 的消息只能命中 `caria` 渠道 binding
- `teven` bot 的消息只能命中 `teven` 渠道 binding
- 避免同一用户在多个 bot 下发生 thread / agent 混绑

### 10.5 connect-im 页面

绑定页需要从“单 bot 引导”升级为“推荐一个角色渠道”。

页面应展示：

- 当前角色名
- 系统推荐的角色渠道
- 一句说明文案
- 跳到对应 Telegram bot 的深链

推荐文案示例：

> 你的角色 Luna 将通过 Caria 与你互动

操作示例：

> 在 Telegram 中打开 Caria

### 10.6 Webhook 配置动作

部署后，必须分别为 3 个 bot 设置 webhook，而不是只执行一次：

- Caria bot -> `/api/integrations/telegram/webhook/caria`
- Teven bot -> `/api/integrations/telegram/webhook/teven`
- Velia bot -> `/api/integrations/telegram/webhook/velia`

因此运维动作需要从“单 webhook”变成“3 次独立 webhook set”。

---

## 11. 建议的实现拆分

### 11.1 P0：最小可用闭环

1. BotFather 注册 3 个 bot
2. 上传 3 个 bot 头像
3. 新增 `channel_bindings.character_channel_slug`
4. `env.ts` 支持按渠道读取 Telegram bot config
5. Telegram webhook 改为角色渠道动态路由
6. binding lookup 加入 `character_channel_slug`

### 11.2 P1：绑定体验

1. 新增 `recommendCharacterChannel()`
2. `connect-im` 页面显示推荐渠道
3. `connect-im` 页面显示说明文案
4. `connect-im` 页面跳转到对应 bot 深链

### 11.3 P2：实现收尾

1. 评估老 binding 的回填方案
2. 评估索引/唯一约束
3. 清理旧单 bot 相关 env / webhook 文档

---

## 12. 非目标

以下内容不属于本次 v1 实现范围：

- 不做 BotFather 自动注册
- 不做 bot 头像自动同步脚本
- 不做用户级专属 bot
- 不同步实现 Discord / 微信 / WhatsApp
- 不在 v1 中引入复杂角色语义推荐
- 不在本次改动中重构聊天 runtime 主逻辑

v1 的目标很明确：

只把 Telegram 3-bot 方案跑通，并把产品抽象收敛到 `character_channel_slug`。

---

## 13. 风险与取舍

### 13.1 自定义角色命名错位

风险：

用户角色名和 bot 名字不一致。

处理：

绑定页用说明文案解释。

### 13.2 老 binding 兼容

风险：

历史数据没有 `character_channel_slug`，切换后 lookup 可能出现兼容问题。

处理：

v1 先允许字段为空，新 binding 强制写入，老 binding 后续再迁移。

### 13.3 Telegram 配置成本上升

风险：

bot 数量从 1 变 3，token、secret、webhook 配置动作变多。

处理：

把复杂度收敛在 env / route / adapter，不让业务层承担多 bot 细节。

### 13.4 平台间能力不一致

风险：

未来不是所有 IM 平台都能 3-bot。

处理：

上层只存 `character_channel_slug`，不存物理 bot 标识；平台 adapter 自己决定如何映射。

---

## 14. 决策记录

| 决策项 | 结论 | 理由 |
|---|---|---|
| 当前优先实现的平台 | Telegram | 现有链路已打通，增量最小，收益最高 |
| 物理实现方式 | 3 个独立 Telegram bot | 降低角色跳出感，BotFather 成本低 |
| 上层抽象名 | `character_channel_slug` | 表达角色渠道，而不是物理 bot |
| 推荐逻辑 | `assistant -> velia`, `male companion -> teven`, else `caria` | 简单、稳定、可解释 |
| bot 命名策略 | 角色名 | 对预设角色沉浸感最佳 |
| 自定义角色错位处理 | 绑定页说明文案 | 低成本且足够可用 |
| 用户是否可改选 | 可以 | 推荐是降低成本，不是强制约束 |
| 微信等平台策略 | 单账号 + 文案区分 | 多账号成本不现实 |

---

## 15. v1 最终结论

对于 SparkCore 当前阶段，最合理的路径是：

1. 先把 Telegram 从单 bot 升级到 3 条角色渠道
2. 用 `character_channel_slug` 做统一产品抽象
3. 把“多物理 bot”的差异压在 Telegram adapter 层
4. 在绑定页通过推荐和说明文案补足自定义角色体验

这个方案兼顾了：

- 当前可落地性
- 预设角色体验
- 后续多平台扩展的兼容性

它不是最终形态，但足够作为 Telegram 多 bot 支持的 v1 实现方案。
