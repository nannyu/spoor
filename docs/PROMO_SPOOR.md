# 雪泥 · Spoor — 横屏产品介绍片脚本

**成片规格：** 1920×1080，30fps，约 56 秒
**Composition ID：** `SpoorPromo`
**数据文件：** [`remotion-kit/remotion/spoor-promo.json`](../remotion-kit/remotion/spoor-promo.json)

## 预览与导出

```bash
# 在 Remotion Studio 中预览
npm run remotion:studio --prefix remotion-kit
# 选择 SpoorPromo

# 导出 MP4（输出到仓库根目录 output/）
npm run remotion:render:spoor
```

可选旁白：将 MP3 放在项目根目录，在渲染 API 中传入 `audioUrl`，或在 `spoor-promo.json` 中加 `"audioUrl"` 字段。

## 设计原则

- 风格参照：Anthropic / Claude demo —— 安静、克制、产品聚焦
- 大字版式驱动叙事，单一焦点，避免功能堆叠
- 慢淡入、轻微上移、缓慢推镜，无炫技动画
- 真实 App UI 浮层在右侧；不与文字争夺画面

## 版面分区

```
┌─ Main row  y=192..820  ───────────────────────────────────────┐
│ Copy 左列 (x=96, w=680)         App Window 右列 (x=856, w=968) │
│  eyebrow / title 78px / 23px caption    产品 UI               │
├─ English caption  y=856  ─────────────────────────────────────┤
│ 24px 居中英文字幕（无组件框）                                  │
└────────────────────────────────────────────────────────────────┘
```

- `opening` / `closing` 切换为 **hero** 单列居中（无 App 窗口、无字幕条）
- 其余场景用 **split** 双列，App 窗口里同一时刻只显示一个焦点

## 分镜与旁白

| 时间 | 场景 | EN（字幕） | ZH（待用于中文版） | 画面焦点 |
|------|------|-----------|---------------------|----------|
| 0:00–0:08 | opening | Spoor is a quiet canvas for thinking in space. | 雪泥是一个安静的空间化思考画布。 | 浅色空间 + 大字主标题，无 App 框 |
| 0:08–0:16 | graph | Notes connect by hand — the thought becomes visible. | 亲手把便签连起来，想法就显出形状。 | App 内：主题卡 + 多张便签 + 灰色直线一笔笔画出 |
| 0:16–0:24 | forms | Each note finds its form — standard, glass, minimal, neo-brut, receipt. | 每张便签都有自己的形态——标准、玻璃、极简、神经粗野、票据。 | 居中单张便签在 5 种版式间交叉淡变 |
| 0:24–0:32 | synth (a) | Select what matters. The canvas becomes a draft. | 选出关键的几张。画布会写成草稿。 | 左列便签被选中描边；右侧 Reference 草稿淡入 |
| 0:32–0:36 | synth (b) | The article stays linked to the canvas it came from. | 成文之后，仍引用回它的来源画布。 | `↗ Linked to source canvas` 标签出现 |
| 0:36–0:40 | privacy | Local-first. Private by default. | 本地优先，默认私密。 | App 内右上角 `Local-first · IndexedDB` 角标 |
| 0:40–0:50 | agentChat | Four personas read your notes — and the images linked to them. | 四个人格读你的便签，也读与之相连的图像。 | 画布对话 + 人格轮播；Personas 面板 + Custom persona |
| 0:50–0:56 | closing | A trace of thought, left on quiet ground. | 念头如鸿，落处成迹。 | 大字 CTA + 网址 |

## 部署 URL（待换）

当前 CTA 仍为 `scribe-ai-canvas.netlify.app`（历史 Netlify 站点）。拿到新域名（如 `spoor.app`）或在 Netlify 改站点名后，改 `spoor-promo.json` 的 `ctaUrl` 与 `SpoorPromo.jsx` 默认 `ctaUrl` 即可。

## 调字幕 / 调时间

- 改文案：编辑 `remotion-kit/remotion/spoor-promo.json` 中的 `timestampSegments`
- 改场景节奏：编辑 `remotion-kit/remotion/SpoorPromo.jsx` 顶部 `SCENES` 数组的 `start` / `end`
- 改版面分区坐标：编辑 `SpoorPromo.jsx` 顶部的 `STAGE` 常量

## 品牌与视觉

- 中文名：**雪泥**（出自苏轼「人生到处知何似，应似飞鸿踏雪泥」）
- 英文名：**Spoor**（一个野兽走过留下的痕迹）
- 主色：`#C2410C`（强调线、人格、CTA、活动 progress）
- 文字：`#1F1B18` 深色 / `#8B847C` 静音灰
- 背景：`#FFF6EA → #FBF6EC → #EFE6D9` 浅纸渐变 + 轻微径向高光
- 字体：标题 Georgia + Noto Serif SC；UI 与字幕 Inter / Helvetica Neue / Noto Sans SC
