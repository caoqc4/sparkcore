# 角色素材库目录说明

本地角色素材库默认路径：

`/Users/caoq/git/sparkcore/assets/character-assets`

当前目录按“两个池子”组织：

- `portrait-pool`
  形象图素材池
- `audio-pool`
  音频样例池

导入脚本会扫描这两个池子，把素材上传到 Supabase Storage bucket `character-assets`，并同步筛选所需的数据库字段。

## 目录结构

```text
assets/character-assets/
  portrait-pool/
    realistic/
      female/
        aurora.webp
        aurora.json
      male/
      neutral/
    anime/
      female/
      male/
      neutral/
    illustrated/
      female/
      male/
      neutral/
  audio-pool/
    audio-elevenlabs-v3/
      female/
        eleven-v3-warm-muse.mp3
        eleven-v3-warm-muse.json
      male/
      neutral/
    audio-minimax-speech/
      female/
      male/
      neutral/
```

规则是：

- 形象图路径：`portrait-pool/<style>/<gender>/<asset-file>`
- 音频路径：`audio-pool/<model_slug>/<gender>/<voice_key>.<ext>`
- 每个素材都可以有一个同名 `.json` sidecar 文件，用于补充标签和展示信息

## 为什么这样设计

网站创建角色时的筛选逻辑，当前主要依赖这些字段：

- 形象图
  - `gender_presentation`
  - `style_tags`
- 音频
  - `gender_presentation`
  - `style_tags`
  - `tier`
  - `model_slug`
  - `voice_key`

所以这里把规则拆成两层：

- 目录路径负责基础分类
  - 形象图的 `style`
  - 形象图的 `gender`
  - 音频的 `model_slug`
  - 音频的 `gender`
- 同名 `.json` 负责补充标签
  - 展示名
  - 额外 `style_tags`
  - 是否默认
  - 层级 `tier`
  - 角色默认绑定等

## 形象图 sidecar 示例

文件：

- `portrait-pool/realistic/female/aurora.webp`
- `portrait-pool/realistic/female/aurora.json`

示例内容：

```json
{
  "display_name": "Aurora",
  "style_tags": ["warm", "soft", "companion"],
  "default_for_character": "caria"
}
```

导入后会得到：

- `gender_presentation = female`
- `style_tags = ["realistic", "warm", "soft", "companion"]`
- `metadata.character_slug = "caria"`
- `metadata.variant = "main"`

说明：

- `style` 和 `gender` 默认从目录读取
- `style_tags` 里不需要再重复写 `realistic/anime/illustrated`
- 如果你给 `default_for_character` 赋值，当前会把这张图当成对应 preset 的默认主图

## 音频 sidecar 示例

文件：

- `audio-pool/audio-elevenlabs-v3/female/eleven-v3-warm-muse.mp3`
- `audio-pool/audio-elevenlabs-v3/female/eleven-v3-warm-muse.json`

示例内容：

```json
{
  "display_name": "Warm Muse",
  "style_tags": ["Warm", "Soft", "Calm"],
  "tier": "free",
  "sort_order": 10,
  "is_default": true,
  "default_for_character": "caria"
}
```

导入后会更新已有的 `product_audio_voice_options` 记录：

- 按 `model_slug + voice_key` 匹配
- 写入 `gender_presentation`
- 写入 `style_tags`
- 写入 `tier / sort_order / is_default`
- 支持 `default_for_character`
- 在 `metadata` 里写入
  - `sample_storage_path`
  - `sample_public_url`

说明：

- 目录里的 `model_slug` 和文件名里的 `voice_key` 必须和数据库中的 voice option 对得上
- 如果 voice option 不存在，脚本会跳过数据库同步，但文件仍会上传

## 当前推荐标签

### 形象图

建议把筛选标签写进 `style_tags`：

- 风格气质：`warm`、`steady`、`playful`
- 使用场景：`companion`、`assistant`
- 画面气质：`soft`、`clean`、`bright`

### 音频

当前创建页的 tone 推荐逻辑会优先匹配这些标签：

- `warm`
  推荐：`Warm`、`Soft`、`Calm`
- `steady`
  推荐：`Calm`、`Grounded`、`Clear`
- `playful`
  推荐：`Bright`、`Expressive`、`Soft`

所以音频 sidecar 里的 `style_tags` 建议优先使用这组首字母大写的标签。

## 预设角色素材怎么放

`Caria / Teven / Velia` 不再使用单独的角色目录。

现在的规则是：

- 主图放进 `portrait-pool`
- 默认音色放进 `audio-pool`
- 再用 `default_for_character` 把素材绑定给对应 preset

### Caria 示例

主图：

```text
assets/character-assets/portrait-pool/realistic/female/caria-main.webp
assets/character-assets/portrait-pool/realistic/female/caria-main.json
```

`caria-main.json`：

```json
{
  "display_name": "Caria",
  "style_tags": ["warm", "soft", "companion"],
  "default_for_character": "caria"
}
```

默认音色：

```text
assets/character-assets/audio-pool/audio-elevenlabs-v3/female/eleven-v3-caria.mp3
assets/character-assets/audio-pool/audio-elevenlabs-v3/female/eleven-v3-caria.json
```

`eleven-v3-caria.json`：

```json
{
  "display_name": "Caria Voice",
  "style_tags": ["Warm", "Soft", "Calm"],
  "tier": "free",
  "sort_order": 10,
  "is_default": true,
  "default_for_character": "caria"
}
```

### Teven 示例

主图放在：

```text
assets/character-assets/portrait-pool/realistic/male/teven-main.webp
assets/character-assets/portrait-pool/realistic/male/teven-main.json
```

音频放在：

```text
assets/character-assets/audio-pool/audio-elevenlabs-v3/male/eleven-v3-teven.mp3
assets/character-assets/audio-pool/audio-elevenlabs-v3/male/eleven-v3-teven.json
```

两个 sidecar 里都写：

```json
{
  "default_for_character": "teven"
}
```

### Velia 示例

主图放在：

```text
assets/character-assets/portrait-pool/realistic/female/velia-main.webp
assets/character-assets/portrait-pool/realistic/female/velia-main.json
```

音频放在：

```text
assets/character-assets/audio-pool/audio-elevenlabs-v3/female/eleven-v3-velia.mp3
assets/character-assets/audio-pool/audio-elevenlabs-v3/female/eleven-v3-velia.json
```

两个 sidecar 里都写：

```json
{
  "default_for_character": "velia"
}
```

## 日常维护流程

### 新增一张普通形象图

1. 放到正确的 `portrait-pool/<style>/<gender>/` 目录
2. 新建同名 `.json`
3. 写 `display_name` 和 `style_tags`
4. 跑导入脚本

### 新增一个普通音频样例

1. 放到正确的 `audio-pool/<model_slug>/<gender>/` 目录
2. 确认数据库里已有对应 `model_slug + voice_key`
3. 新建同名 `.json`
4. 写 `display_name`、`style_tags`、`tier`
5. 跑导入脚本

### 替换某个 preset 的默认主图或默认音色

1. 准备新的素材文件和 sidecar
2. 在 sidecar 中把 `default_for_character` 改成对应 preset
3. 跑导入脚本
4. 到创建页或 role 页验证是否已切换到新的默认素材

## 执行方式

先 dry run：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run character-assets:import -- --dry-run
```

正式导入：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run character-assets:import
```

指定自定义素材目录：

```bash
cd /Users/caoq/git/sparkcore/apps/web
npm run character-assets:import -- --dir /绝对路径/你的素材目录
```

## 当前限制

- 形象图是“新增或更新 `product_portrait_assets`”
- 音频是“更新已存在的 `product_audio_voice_options`”
- 音频脚本不会自动新建 voice option；数据库里必须先有对应的 `model_slug + voice_key`
- 当前 preset 默认主图支持通过 `default_for_character` 标记
- 当前 preset 默认音色支持通过音频 sidecar 里的 `default_for_character` 标记
- 如果没有显式默认音色，系统才会 fallback 到原有推荐逻辑
