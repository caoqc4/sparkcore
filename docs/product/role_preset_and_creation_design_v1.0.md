# 角色预设与创建逻辑设计文档 v1.0

## 1. 文档定位

本文档定义 SparkCore 第一阶段三个默认角色（Caria / Teven / Velia）的设定方案、素材资源管理逻辑、角色创建流程设计，以及预设角色与用户自定义角色的交互规则。

> 状态：当前有效  
> 对应阶段：Phase 1  
> 相关文档：
> - `docs/product/companion_mvp_flow_v1.0.md`
> - `apps/web/lib/characters/manifest.ts`（代码层注册表）

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
| `avatar_style` | `illustrated` |
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
插画/动漫风格，女性形象，短发干练，眼神灵动聪慧，表情带轻快的专注感。可搭配科技/信息流元素（光点、数据纹理）作为视觉标识。与 Caria/Teven 的写实风格形成差异化。

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
       Audio Pool 筛选 → 自动推荐一个 → 用户预听确认
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
                          携带所有字段作为 URL params
                          进入统一三步 wizard（数据已预填）
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
    ├── 从 persona_pack 读取 source template（source_persona_pack_id）
    ├── 用用户填写的字段覆盖（name, tone, boundaries 等）
    ├── 从 Portrait Pool 写入选定的 portrait_asset_id → role_media_profiles
    ├── portrait_locked_at = now()（形象锁定）
    ├── 从 Audio Pool 分配推荐音色 → role_media_profiles.audio_voice_option_id
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

| 优先级 | 任务 | 涉及文件 |
|--------|------|---------|
| P0 | `product_audio_voice_options` 加 `tier` 字段 migration | `supabase/migrations/` |
| P0 | `role_media_profiles` 加 `portrait_locked_at` 字段 migration | `supabase/migrations/` |
| P0 | `pickRecommendedAudioVoiceOption` 支持 tier 参数过滤 | `lib/product/role-media.ts` |
| P0 | 角色创建时写入 `portrait_locked_at` | `app/create/actions.ts` |
| P1 | 三个 persona_packs 的 seed migration（Caria/Teven/Velia） | `supabase/migrations/` |
| P1 | Wizard 加入预设卡选择器（PC 左侧栏 + 移动端顶部滚动） | `components/role-create-wizard.tsx` |
| P1 | 首页角色卡点击 → 预填 + 滚动交互 | `components/home-hero-interactive.tsx` |
| P1 | 音频预听 UI | `components/role-create-wizard.tsx` |
| P2 | role 页显示"Based on preset · Restore defaults" | `app/app/role/page.tsx` |
| P2 | 付费后音色升级提示 banner | `app/app/role/page.tsx` |
| P2 | Advanced 折叠区 + background_summary 输入 | `components/role-create-wizard.tsx` |

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
