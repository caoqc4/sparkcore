# 形象图生成 Prompts v1.0

## 说明

本文档为 SparkCore Portrait Pool 扩充图库用。目标：四个风格分类各维持 **4–6 张**可选库存（含已有三个专属角色形象）。

### 当前库存盘点

| 分类 | slug | 当前数量（含专属角色） |
|------|------|----------------------|
| 写实·女 `realistic + female` | Caria*, Aurora, Luna, Sage, Ember | 5 |
| 写实·男 `realistic + male` | Teven*, Atlas, River, Orion | 4 |
| 动漫 `anime` | Hana, Yuki, Akari (F) · Kaito, Ren (M) | 5 |
| 插画 `illustrated` | Velia*, Nova, Echo | 3 ← 最需补充 |

> `*` 为角色专属形象，在通用 Portrait Pool 中仍对外开放，但选中后会以该角色身份初始化。

### 补充目标

- 写实·女：已达标，可酌情 +1  
- 写实·男：酌情 +1–2  
- 动漫：整体平衡（女 +1，男 +1）  
- 插画：**重点补充 +3**，把男性和中性变体都补进来  

---

## 通用生图设置

所有图片最终需要：
- **输出尺寸**：512×768 或 768×1024（竖版半身）
- **格式**：webp（前端展示）
- **构图**：**半身像（bust/upper body）**，画面中心偏上留给脸部，下方可见衣领/肩膀
- **工具**：Midjourney v6 / SDXL / Flux.1 均适用；Midjourney 在写实类效果最佳，NovelAI/NAI3 在动漫类最佳

---

## 一、写实·女（Realistic Female）

**风格基调**：亚洲女性/欧亚混合面孔，自然或轻妆，温柔/知性/清爽气质，半身像，背景简洁暖色或柔光室内

### 现有参考基调（来自 Caria 设定）
> 东亚女性，25岁，温柔清淡五官，自然妆感，眼神柔和，嘴角带浅笑，背景暖色（咖啡馆或窗边）

---

### F-01 · Mira（已有：Aurora 风格参考）
**预期 style_tags**：`realistic`, `warm`  
**路径**：`character-assets/presets/mira.webp`

```
portrait of a young East Asian woman, 24 years old, soft natural makeup, gentle brown eyes, 
warm smile, black straight hair falling past shoulders, wearing a light beige knit sweater, 
seated near a warm-lit window, afternoon sunlight, shallow depth of field, photorealistic, 
cinematic lighting, upper body shot, neutral bokeh background
--ar 2:3 --style raw --v 6
```

> **中文备注**：温柔知性感，适合「温暖陪伴」风格；可与 Caria 的 warm 标签共用展示位

---

### F-02 · Lena
**预期 style_tags**：`realistic`, `cool`  
**路径**：`character-assets/presets/lena.webp`

```
portrait of a young woman with mixed East-West features, 26 years old, minimal makeup, 
sharp and confident eyes, dark brown hair in a relaxed low bun, wearing a structured white 
shirt, soft studio lighting, clean off-white background, photorealistic, half-body shot, 
professional yet approachable, editorial photography style
--ar 2:3 --style raw --v 6
```

> **中文备注**：都市感/职场感，气质偏冷静知性，适合用户想创建「助理型」女性角色时选择；可与插画分类共用中性标签

---

### F-03 · Sora（可跨分类：anime 改绘版同名）
**预期 style_tags**：`realistic`, `playful`  
**路径**：`character-assets/presets/sora.webp`

```
portrait of a young East Asian woman, 23 years old, bright cheerful expression, natural light 
makeup with subtle lip tint, ponytail hairstyle, wearing a casual pastel blue jacket, 
outdoors in soft daylight, greenery background slightly blurred, photorealistic, vibrant yet 
natural color grading, upper body shot
--ar 2:3 --style raw --v 6
```

> **中文备注**：活泼清新感，与 Ember 的温暖感形成差异；名字 Sora 可在动漫分类也出现一个动漫版本

---

## 二、写实·男（Realistic Male）

**风格基调**：亚洲/欧亚男性，25–32岁，表情沉稳或带轻微微笑，气质可靠，半身像，背景简洁（室内/户外自然光）

### 现有参考基调（来自 Teven 设定）
> 东亚男性，28岁，五官清正，眼神沉稳，表情平静中带暖意，背景书架或户外自然光

---

### M-01 · Kai
**预期 style_tags**：`realistic`, `warm`  
**路径**：`character-assets/presets/kai.webp`

```
portrait of a young East Asian man, 27 years old, calm and warm expression, natural neat 
black hair, slight stubble, wearing a dark navy crew-neck sweater, indoor soft lighting, 
bookshelf or wooden wall background, photorealistic, upper body shot, cinematic color grading, 
trustworthy and gentle presence
--ar 2:3 --style raw --v 6
```

> **中文备注**：气质接近 Teven 但更年轻随性，适合「陪伴型男友」用户第二选择

---

### M-02 · Leon
**预期 style_tags**：`realistic`, `cool`  
**路径**：`character-assets/presets/leon.webp`

```
portrait of a young man with East-West mixed features, 29 years old, composed expression, 
slightly wavy dark hair, clean-shaven, wearing a light grey structured jacket over a white 
tee, outdoor natural daylight, urban architecture background softly blurred, photorealistic, 
upper body shot, editorial tone
--ar 2:3 --style raw --v 6
```

> **中文备注**：偏都市感/国际感，与 Atlas 的户外气质有所区分，提供更多元的男性选择

---

### M-03 · Fen
**预期 style_tags**：`realistic`, `steady`  
**路径**：`character-assets/presets/fen.webp`

```
portrait of an East Asian man, 31 years old, serious yet kind eyes, short neat dark hair, 
slight smile, wearing a casual linen shirt, seated at a minimalist desk, warm afternoon 
window light, photorealistic, upper body shot, calm and grounded atmosphere
--ar 2:3 --style raw --v 6
```

> **中文备注**：成熟稳健感，steady 标签与 Teven 同类，作为 Teven 的替代方案让用户有更多外形选择

---

## 三、动漫（Anime）

**风格基调**：日式动漫/二次元风格，线条干净，色彩鲜明，表情生动，半身像，背景可为渐变色或简单场景

### 当前库存：女 × 3（Hana/Yuki/Akari），男 × 2（Kaito/Ren）  
### 补充目标：女 +1，男 +1

---

### A-01 · Sora-Anime（女）
**预期 style_tags**：`anime`, `playful`  
**路径**：`character-assets/presets/sora-anime.webp`

```
anime style portrait of a cheerful young woman, 20s, bright golden-brown eyes, twin tails 
hairstyle with light auburn hair, wearing a casual school-inspired white blouse with ribbon, 
soft pastel background with cherry blossom petals, vibrant colors, clean line art, 
high quality 2D anime illustration, upper body shot
```

> **中文备注**：活泼少女气质，与现有三个女角色（清冷/温柔/可爱）形成第四种感觉——元气感；与写实分类的 Sora 同名，形成角色跨风格延伸的趣味

---

### A-02 · Ryuu（男）
**预期 style_tags**：`anime`, `steady`  
**路径**：`character-assets/presets/ryuu.webp`

```
anime style portrait of a composed young man, mid 20s, dark navy short hair, calm silver-grey 
eyes, slight confident smile, wearing a dark school uniform or casual button-up shirt, 
clean gradient background in cool blue tones, detailed 2D anime illustration, 
upper body shot, cool and dependable atmosphere
```

> **中文备注**：稳重型男性动漫形象，与 Kaito（明亮少年感）和 Ren（青春感）不同，提供更成熟的二次元男性选项

---

## 四、插画（Illustrated）

**风格基调**：介于写实与插画之间，带有设计感/轻扁平化，颜色饱和度适中，线条有质感，可男可女可中性

### 当前库存：Velia（女）+ Nova（中性）+ Echo（中性）= 3  
### 补充目标：+3（建议包含：插画男、插画女·不同风格、插画中性）

---

### I-01 · Iris（女）
**预期 style_tags**：`illustrated`, `warm`  
**路径**：`character-assets/presets/iris.webp`

```
illustrated portrait of a young woman, soft editorial illustration style, warm terracotta 
and cream color palette, East Asian features, neat short bob haircut, kind expressive eyes, 
wearing a warm-toned blouse, simple geometric background with subtle texture, semi-flat 
design with soft shading, upper body composition, elegant and approachable
```

> **中文备注**：与 Velia 的知性欧美感不同，走温暖东方感；warm 标签可与写实女性分类共用筛选

---

### I-02 · Cole（男）
**预期 style_tags**：`illustrated`, `cool`  
**路径**：`character-assets/presets/cole.webp`

```
illustrated portrait of a young man, modern editorial illustration style, cool blue and 
off-white color palette, mixed features, short tousled hair, calm observant eyes, 
wearing a structured jacket, abstract geometric background with minimal line elements, 
semi-flat shading with subtle depth, upper body composition, composed and thoughtful mood
```

> **中文备注**：插画分类目前无男性形象，Cole 填补这个空缺；cool 标签与写实男性的 Leon 形成跨风格呼应

---

### I-03 · Zhen（中性）
**预期 style_tags**：`illustrated`, `neutral`, `playful`  
**路径**：`character-assets/presets/zhen.webp`

```
illustrated portrait of a gender-neutral young person, vibrant pop-art inspired illustration 
style, teal and warm yellow color palette, soft androgynous features, expressive bright eyes, 
short playful haircut with a slight undercut, wearing a colorful layered outfit, 
dynamic abstract background with soft geometric shapes, bold yet clean illustration, 
upper body shot, energetic and friendly
```

> **中文备注**：playful 标签可与 Velia（也是 playful）并列显示，提供更多中性选项；适合不想绑定性别的用户

---

### I-04 · Elio（中性·偏男）
**预期 style_tags**：`illustrated`, `neutral`, `steady`  
**路径**：`character-assets/presets/elio.webp`

```
illustrated portrait of an androgynous young person with slightly masculine features, 
minimalist illustration style, muted sage green and warm beige color palette, neat medium 
length dark hair, calm thoughtful expression, wearing a simple turtleneck, soft vignette 
background with subtle paper texture, refined flat shading with gentle highlights, 
upper body shot, serene and intelligent presence
```

> **中文备注**：steady 标签跨写实男和插画分类，气质与 Teven 接近但风格完全不同；为偏好插画但想要「男友型」感觉的用户提供选项

---

## 五、跨分类复用索引

| slug | 主分类 | 可共用分类 | 说明 |
|------|--------|-----------|------|
| `sora` (写实) | realistic + female | — | 活泼感，与同名动漫版形成联动 |
| `sora-anime` | anime + female | — | 与写实 Sora 同名，暗示同一角色的不同风格 |
| `lena` | realistic + female + cool | illustrated | cool 标签在插画筛选中也会出现 |
| `iris` | illustrated + female + warm | realistic (warm筛选) | warm 标签会在写实女性筛选结果中出现 |
| `cole` | illustrated + male + cool | realistic (cool筛选) | cool 标签会在写实男性筛选结果中出现 |
| `elio` | illustrated + neutral + steady | realistic (steady筛选) | steady 标签共用 |

---

## 六、落地建议

### 优先级排序

1. **插画·男 `cole`** — 现在插画分类完全没有男性，用户自定义男性角色时无可选图  
2. **插画·中性 `zhen` / `elio`** — 补充非二元选项  
3. **插画·女 `iris`** — 丰富插画女性风格多样性  
4. **写实·男 `kai` / `leon`** — 现有 3 张偏少  
5. **动漫 `ryuu` / `sora-anime`** — 动漫类已相对丰富，最后补

### 生图工具推荐

| 分类 | 推荐工具 |
|------|---------|
| 写实 | Midjourney v6 `--style raw` / Flux.1 Pro |
| 动漫 | NovelAI v3 / Stable Diffusion with AnythingXL |
| 插画 | Midjourney v6 (无 `--style raw`) / Adobe Firefly |

### 存储路径约定

```
character-assets/presets/
  mira.webp
  lena.webp
  sora.webp
  kai.webp
  leon.webp
  fen.webp
  sora-anime.webp
  ryuu.webp
  iris.webp
  cole.webp
  zhen.webp
  elio.webp
```

生成完成后需在 `supabase/migrations/` 添加新的 seed migration，参考：
`20260331152000_seed_shared_product_portrait_assets.sql`
