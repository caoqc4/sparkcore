# 角色预设与创建逻辑设计文档 v1.0

## 1. 文档定位

本文档定义 SparkCore 第一阶段三个默认角色（Caria / Teven / Velia）的设定方案、素材资源管理逻辑、角色创建流程设计，以及预设角色与用户自定义角色的交互规则。

> 状态：当前有效  
> 对应阶段：Phase 1  
> 相关文档：
> - `docs/product/companion_mvp_flow_v1.0.md`
> - `apps/web/lib/characters/manifest.ts`（代码层注册表）
> - `apps/web/lib/characters/preset-defaults.ts`（预设默认值）
> - `supabase/migrations/20260331150000_add_product_audio_tier_and_portrait_lock.sql`
> - `supabase/migrations/20260331151000_seed_product_character_persona_packs.sql`
> - `supabase/migrations/20260331152000_seed_shared_product_portrait_assets.sql`

---

## 2. 三个默认角色设定

### 2.1 模式（Mode）定义

| Mode | 说明 |
|------|------|
| `companion` | 陪伴关系角色，包括女友/男友人格 |
| `assistant` | 任务导向角色，擅长信息检索与分析 |

companion 模式下的关系风格由 `avatar_gender` 区分：
- `female` → 女友人格（girlfriend flavor）
- `male` → 男友人格（boyfriend flavor）
- `neutral` → 通用陪伴

### 2.2 Caria · 女朋友

| 字段 | 值 |
|------|----|
| `slug` | `caria` |
| `persona_pack_slug` | `product-girlfriend` |
| `mode` | `companion` |
| `avatar_gender` | `female` |
| `avatar_style` | `realistic` |
| `tone` | `warm` |
| `proactivity_level` | `active` |
| `avatar_emoji` | 🌸 |

**persona_summary**（≤280字）  
苏沁是个细腻温柔的女朋友，总记得你说过的每一句话。她喜欢在深夜陪你聊天，用温暖让你感到被真正理解。偶尔会小撒娇，却从不矫情——有自己的主见，也有柔软的内心。

**background_summary**（≤280字）  
热爱摄影和文学，下雨天习惯煮一杯热茶。喜欢记录生活里的小细节，也喜欢听你说今天遇见了什么。

**relationship_mode**  
`long-term girlfriend — intimate, caring, and emotionally attuned`

**boundaries**  
Maintain warmth and intimacy appropriate for a close romantic relationship. No explicit sexual content. Always emotionally supportive; never cold or dismissive.

**portrait_style_notes**（图片生成参考）  
东亚女性，25岁左右，温柔清淡的五官，自然妆感，眼神柔和有温度，嘴角带浅笑。写实风格半身像，背景暖色调（咖啡馆或窗边）。

**音色方向**  
女声·温柔型 → MiniMax "Warm Companion (F)" 或 ElevenLabs "Soft Companion (F)"（免费层级默认）

---

### 2.3 Teven · 男朋友

| 字段 | 值 |
|------|----|
| `slug` | `teven` |
| `persona_pack_slug` | `product-boyfriend` |
| `mode` | `companion` |
| `avatar_gender` | `male` |
| `avatar_style` | `realistic` |
| `tone` | `steady` |
| `proactivity_level` | `balanced` |
| `avatar_emoji` | 🌿 |

**persona_summary**（≤280字）  
Teven 是个沉稳可靠的男朋友。不擅长甜言蜜语，但会认真听你说话，在你需要的时候始终在。会给你诚实的看法，而不只是附和——因为他真的在乎你过得好不好。

**background_summary**（≤280字）  
喜欢徒步和读历史，对事情有自己的判断。话不多，但每句都是认真说的。相信长期的陪伴比一时的浪漫更有重量。

**relationship_mode**  
`long-term boyfriend — steady, grounding, and dependably honest`

**boundaries**  
Maintain warm but measured emotional tone appropriate for a trusted partner. No explicit content. Be direct and honest; never manipulative or artificially clingy.

**portrait_style_notes**（图片生成参考）  
东亚男性，28岁左右，五官清正，眼神沉稳有力，表情平静中带暖意，不刻意帅气但气质可靠。写实风格半身像，背景简洁（书架或户外自然光）。

**音色方向**  
男声·沉稳型 → MiniMax "Steady Guide (M)" 或 ElevenLabs "Calm Anchor (M)"（免费层级默认）

---

### 2.4 Velia · 女助理

| 字段 | 值 |
|------|----|
| `slug` | `velia` |
| `persona_pack_slug` | `product-assistant` |
| `mode` | `assistant` |
| `avatar_gender` | `female` |
| `avatar_style` | `realistic` |
| `tone` | `playful` |
| `proactivity_level` | `balanced` |
| `avatar_emoji` | ✦ |

**persona_summary**（≤280字）  
Velia 是你的智能伙伴，检索信息、分析数据、梳理思路——这些都是她的强项。但她不是冷冰冰的工具：有点小幽默，记得你的工作习惯，也知道什么时候该直接给答案、什么时候该一起把问题想清楚。

**background_summary**（≤280字）  
对知识保持好奇，擅长在庞杂的信息里找到关键。喜欢把复杂的事情说得清楚，不喜欢废话。

**relationship_mode**  
`intelligent assistant — efficient, knowledgeable, and subtly witty`

**boundaries**  
Stay focused on being genuinely helpful: search, analysis, synthesis. Show personality without distracting from the task. Never fabricate facts; always flag uncertainty.

**portrait_style_notes**（图片生成参考）  
欧美女性，25岁左右，长发直发、单马尾简单盘发，眼神灵动聪慧，表情带轻快的专注感。身份感：董秘/助理，给人聪明、细心、耐心、负责任的感觉。站立正面半身形象，工装偏休闲打扮，写实风格。

**音色方向**  
女声·明亮型 → Google Gemini "Bright Reply (F)" 或 ElevenLabs "Clear Guide (N)"（免费层级默认）

---

## 3. 素材资源管理

### 3.1 两个独立素材池

素材与角色**不强绑定**，以独立池子方式管理，通过用户选择字段动态筛选。

#### Portrait Pool（形象图池）

- 数据表：`product_portrait_assets`
- 存储：Supabase Storage `character-assets` bucket
- 路径约定：`character-assets/{slug}/{variant}.webp`
- 筛选字段：`avatar_gender`、`avatar_style`、`style_tags`
- 用户在步骤三选择一张，创建后锁定不可修改
- Phase 1 范围：仅启用 `preset` 类型的系统预置图；`upload` / `generated` 暂不在本期创建流程中开放

| source_type | 说明 |
|-------------|------|
| `preset` | 系统预置（含三个默认角色专属图） |
| `upload` | 用户上传 |
| `generated` | AI 生成（未来功能） |

#### Audio Pool（音色池）

- 数据表：`product_audio_voice_options`
- 筛选字段：`gender_presentation`、`style_tags`（含 tone 标签）、`tier`（`free` / `pro`）
- 创建时自动分配推荐音色，用户可预听确认
- 创建后可在 role 页修改

### 3.2 筛选逻辑

```
用户选择字段
  ├── identity / avatar_gender / avatar_style
  │         ↓
  │    Portrait Pool 筛选 → 展示可选图列表 → 用户选定一张
  │
  └── avatar_gender / tone / user_tier
            ↓
       Audio Pool 筛选 → 自动推荐一个 → 用户可在当前层级可用范围内预听 / 切换 / 确认
```

### 3.3 默认角色的素材索引

三个默认角色在 `manifest.ts` 中注册了默认素材路径，作为**初始选中状态**。用户在创建完成前可以从筛选后的池子里更换，创建完成后形象图锁定。

```
character-assets/
  caria/
    portrait-main.webp    # 完整形象照（角色卡、宣传用）
    portrait-chat.webp    # 裁切头像（对话界面）
    audio-sample.mp3      # 音色 demo
  teven/  ...
  velia/  ...
  presets/               # 通用预设头像（aurora, luna, atlas 等）
    aurora.webp
    luna.webp
    ...
```

---

## 4. 角色创建流程

### 4.1 整体原则

- 预设角色和自定义角色走**同一个三步 wizard**
- 预设角色以 persona_pack 为模板初始化数据，用户可全部修改
- 两条入口路径（首页 / 后台创建页）在 wizard 层统一，区别只在入口的预填方式
- 首页进入 `/app/create` 的目标是“表单已预填”，不限定必须通过 URL params 传递全部字段
- `identity` 仅是 UI 文案表达，不新增独立数据字段；底层仍由 `mode` + `avatar_gender` 表达
- Phase 1 保持 `mode` 与 `avatar_gender` 的自由组合，三个默认角色只是推荐模板，不构成组合限制

### 4.2 三步 Wizard 结构

```
Step 1 · Identity       Step 2 · Personality       Step 3 · Look
─────────────────       ─────────────────────       ─────────────
选择起点                选 tone / 关系描述          从筛选后的形象图池
（预设卡 or 空白）       填写 boundaries             选择一张（创建后锁定）
填 name                 Advanced（折叠）:            预听 / 确认音色
选 identity / gender      background_summary
                          （free-form，280字上限）
```

**用户可在三步之间自由前后切换，所有字段均可修改，直到点击"创建"。**

### 4.3 路径一：首页入口

```
首屏（双列布局）               第二屏（三角色卡）
────────────────────           ─────────────────────
Hero form（默认空白）           [Caria] [Teven] [Velia]
右列：通用预览                  点击角色卡 ↓
                                │
                                ├─ 预填表单所有字段
                                ├─ 右列切换为角色形象照
                                └─ 平滑滚动回首屏
                               （若表单已有内容，弹轻提示确认替换）
                                ↓
                               用户可修改任意字段
                                ↓
                             [创建角色] 按钮
                                ↓
                          跳转 /app/create
                          以预填状态进入统一三步 wizard
                          （实现方式不限，可用 URL / 本地状态 / 其他方案）
                          用户可再次前后确认
```

### 4.4 路径二：后台创建页（/app/create）

```
PC 布局                          Mobile 布局
────────────────────────         ─────────────────────────
左侧：预设选择栏                  顶部：横向滚动卡片条
┌─────┬──────────────────┐        [Caria][Teven][Velia][+]
│Caria│                  │        ─────────────────────────
│Teven│  三步 wizard     │        三步 wizard（同 PC）
│Velia│                  │
│ +   │                  │
└─────┴──────────────────┘
点击预设卡 → 预填 wizard 对应字段
点击 + 空白卡 → 清空所有字段（纯自定义）
```

### 4.5 从 persona_pack 到 agent 实例的数据流

```
用户确认创建
    ↓
createProductRole(formData)
    ├── 若来自预设角色：写入对应 source_persona_pack_id
    ├── 若为空白创建：source_persona_pack_id = null
    ├── 用用户填写的字段覆盖（name, tone, boundaries 等）
    ├── 从 Portrait Pool 写入选定的 portrait_asset_id → role_media_profiles
    ├── portrait_locked_at = now()（形象锁定）
    ├── 从 Audio Pool 先推荐默认音色，用户确认最终选择
    ├── 将用户最终确认的 audio_voice_option_id 写入 role_media_profiles
    └── 创建初始 thread
```

---

## 5. 预设角色 vs 自定义角色的规则

| 维度 | 预设角色（从 Caria/Teven/Velia 创建） | 自定义角色（空白创建） |
|------|--------------------------------------|----------------------|
| 初始数据 | 来自 persona_pack | 用户手动填写 |
| 字段可修改 | 全部可修改 | 全部可修改 |
| 恢复初始设置 | 支持（读取 source_persona_pack_id） | 不适用 |
| 形象图 | 创建后锁定 | 创建后锁定 |
| 音色 | 创建后可在 role 页修改 | 创建后可在 role 页修改 |
| role 页标记 | 显示 "Based on Caria · Restore defaults" | 无 |

补充规则：

- 只要角色最初来自某个 preset，就持续显示 `Based on Caria/Teven/Velia`；即使用户后续修改了名字、tone、关系描述等字段，该来源标记仍保留
- 空白创建的角色不记录 preset 来源，因此不显示 `Based on ...`，也不支持 `Restore defaults`
- `Restore defaults` 会恢复该 preset 的默认人格设定与媒体配置，包括 `name`、`tone`、`relationship_mode`、`boundaries`、`background_summary`、默认 portrait、默认音色

---

## 6. 音色升级路径

**策略：提示切换，不自动升级**

自动升级会在用户不知情的情况下改变角色的"声音"，破坏关系连续感。

```
用户升级付费后
    ↓
role 页显示 banner：
"解锁 Caria 的高品质音色 →"
    ↓
用户主动点击 → 进入音色选择（展示付费音色选项）
    ↓
用户确认切换 → 更新 audio_voice_option_id
```

免费层默认：`tier = "free"` 的音色选项  
付费层解锁：`tier = "pro"` 的音色选项

---

## 7. 角色数量限制

| 用户层级 | 可创建角色数 |
|---------|------------|
| 免费用户 | 1 个 |
| 付费用户 | 多个（具体上限待定） |

> 注：上线前应完成此限制的后端校验逻辑，当前版本暂未限制。

---

## 8. 待实现的技术变更清单

### 8.1 已实现

| 任务 | 落地点 |
|------|--------|
| `product_audio_voice_options` 增加 `tier` | `supabase/migrations/20260331150000_add_product_audio_tier_and_portrait_lock.sql` |
| `role_media_profiles` 增加 `portrait_locked_at` | `supabase/migrations/20260331150000_add_product_audio_tier_and_portrait_lock.sql` |
| 三个 persona pack seed（girlfriend / boyfriend / assistant） | `supabase/migrations/20260331151000_seed_product_character_persona_packs.sql` |
| shared preset portrait assets seed | `supabase/migrations/20260331152000_seed_shared_product_portrait_assets.sql` |
| 创建时按 preset / blank 写入 `source_persona_pack_id` | `apps/web/app/create/actions.ts` |
| 创建时写入 `portrait_asset_id`、`portrait_locked_at`、音色选择结果 | `apps/web/app/create/actions.ts` |
| Portrait Pool 从数据库读取系统预置图 | `apps/web/lib/product/role-media.ts`、`apps/web/app/create/page.tsx`、`apps/web/app/app/create/page.tsx` |
| Wizard 预设起点选择器（PC 左侧 / 移动端顶部） | `apps/web/app/create/page.tsx`、`apps/web/app/app/create/page.tsx`、`apps/web/components/role-create-wizard.tsx` |
| 创建时在当前层级可用范围内切换音色 | `apps/web/components/role-create-wizard.tsx`、`apps/web/app/create/actions.ts` |
| Advanced 折叠区 + `background_summary` 输入 | `apps/web/components/role-create-wizard.tsx` |
| role 页显示 `Based on ...` 与 `Restore defaults` | `apps/web/app/app/role/page.tsx` |
| role 页展示并编辑 `background_summary` | `apps/web/app/app/role/page.tsx`、`apps/web/app/app/profile/actions.ts` |
| 首页与 `/create`、`/app/create` 的 preset 入口统一 | `apps/web/components/home-hero-interactive.tsx`、`apps/web/app/create/page.tsx` |

### 8.2 部分实现

| 任务 | 当前状态 |
|------|----------|
| 首页角色卡点击后的“预填 + 平滑滚动回首屏”交互 | 已有 preset 入口与跳转；未保留首页内平滑滚动预填流程 |
| 音频预听 UI | 已有可选列表与推荐逻辑；预听体验仍可继续增强 |
| role 页付费后音色升级 banner | 音色分层能力已具备；专门的升级 banner 仍未补 |

### 8.3 暂不在本期范围

| 任务 | 说明 |
|------|------|
| 用户上传头像 | Phase 1 不开放 |
| AI 生成头像 | Phase 1 不开放 |
| 免费 / 付费角色数量限制 | 文档已定义方向，后端限制暂未落地 |

---

## 9. 决策记录

| 决策 | 结论 | 理由 |
|------|------|------|
| Mode 设计 | `companion \| assistant`（不再有 girlfriend/boyfriend mode） | girlfriend/boyfriend 是人格差异，不是功能模式差异 |
| 形象图能否修改 | 创建后永久锁定 | 保持关系连续性；创建时已明确提示"这将是 TA 永久的样子" |
| 音色升级方式 | 提示切换，不自动升级 | 避免用户不知情下改变角色声音，破坏连续感 |
| background_summary 交互 | Advanced 折叠区，free-form 文本，有 placeholder 引导 | 普通用户跳过，高级用户可深度设定 |
| 素材池绑定方式 | 图和音各自独立池，不强绑定角色 | 素材可复用，通过筛选字段动态匹配 |
| 两条创建路径 | 统一为同一三步 wizard | 降低维护成本，体验一致 |
| 预设卡布局 | PC 左侧纵向栏，移动端顶部横向滚动 | 响应式兼容，PC 空间利用率更高 |
| `identity` 字段设计 | 不新增独立字段，仅作为页面表述 | 避免数据结构重复，延续现有 `mode + avatar_gender` 模型 |
| `mode × avatar_gender` 组合 | Phase 1 保持自由组合 | 预设角色只是推荐模板，不限制用户创建范围 |
| 首页到 `/app/create` 的预填实现 | 只要求能预填，不强制 URL params | 优先保证统一 wizard 体验，避免过早锁死实现方式 |
| 形象图创建范围 | Phase 1 仅开放系统预置图 | 先完成主链路，控制实现范围 |
| 创建时音色选择 | 先推荐，再允许用户在当前层级可用范围内切换确认 | 保留推荐效率，同时给用户声音选择权 |
| `relationship_mode` 字段形态 | 先保持现状，继续使用自由文本 | 当前展示位置未最终收敛，暂不收紧为枚举 |

---

## 10. 当前实现备注

- `/create` 与 `/app/create` 目前都以页面级 preset 选择栏 + 统一 wizard 的形式工作，已经不再依赖旧的 `mode` / `gender` query 兼容入口
- 创建页 Step 3 已从 `product_portrait_assets` 读取系统预置图，并优先展示 storage 对应的 public URL；若 bucket 中缺图，前端会退回占位态
- `Restore defaults` 当前会恢复人格字段、`background_summary`、默认 portrait 与默认音色；空白创建角色没有该能力
- 底层仍保留少量 `avatar_preset_id` 兼容字段，用于历史数据兼容；新创建主链以 `portrait_asset_id` 为准

---

## 11. 本次实现结果

### 11.1 已交付范围

- 角色创建入口已统一到 preset / blank wizard：
  - `/create`
  - `/app/create`
- 预设创建会写入 `source_persona_pack_id`，空白创建写 `null`
- role 页已支持：
  - `Based on ...`
  - `Restore defaults`
  - `background_summary` 展示与编辑
- portrait 选择已接入数据库预置资产，并在创建后写入锁定状态
- 音色选择已支持：
  - 基于角色属性推荐默认项
  - 在当前用户层级可用范围内切换
- 首页 preset 入口、公开创建页、应用内创建页已对齐到同一套产品流
- 旧的 `mode/gender` 创建兼容入口和未使用旧组件已清理

### 11.2 Smoke 与验证结果

- 类型检查通过：
  - `npm exec tsc --noEmit`
- 产品主链 smoke 通过：
  - `npx playwright test tests/smoke/product-flow.spec.ts --reporter=line`
- 当前 smoke 所覆盖的真实链路为：
  - `/app/create`
  - `/app/role`
  - `/app/channels`
  - `/connect-im`
  - `/app/chat`

### 11.3 为了稳定 smoke 额外补充的能力

- smoke 登录在 password 登录被禁用时会 fallback 到 magic link
- smoke reset 与 smoke login 对瞬时 Supabase 网络失败增加了重试
- smoke seed 会自动 upsert 产品 preset persona packs，避免依赖外部手工 seed
- smoke 对 binding 的最终校验已收窄到当前 smoke 用户，避免被其他活跃绑定污染

### 11.4 当前已知边界

- smoke 仍依赖外部 Supabase 服务；虽然已加入重试，但无法完全消除外部网络波动
- `core-chat.spec.ts` 等更大范围 smoke 尚未在本次变更中一起验证
- role 页付费后音色升级 banner 仍未补
- 首页“预填后平滑滚动回首屏”的交互仍未恢复，当前实现为直接进入统一 wizard
