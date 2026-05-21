# Spatial Notes — 横屏产品介绍片脚本

**成片规格：** 1920×1080，30fps，约 60 秒
**Composition ID：** `SpatialNotesPromo`
**数据文件：** [`remotion-kit/remotion/spatial-notes-promo.json`](../remotion-kit/remotion/spatial-notes-promo.json)

## 预览与导出

```bash
# 在 Remotion Studio 中预览
npm run remotion:studio --prefix remotion-kit
# 选择 SpatialNotesPromo

# 导出 MP4（输出到仓库根目录 output/）
npm run remotion:render:spatial-notes
```

可选旁白：将 MP3 放在项目根目录，在渲染 API 中传入 `audioUrl`，或在 `spatial-notes-promo.json` 中加 `"audioUrl"` 字段。

## 设计原则（与 prompt 对齐）

- 风格参照：Anthropic / Claude demo —— 安静、克制、产品聚焦
- 大字版式驱动叙事，单一焦点，避免功能堆叠
- 慢淡入、轻微上移、缓慢推镜，无炫技动画
- 真实 App UI 浮层在右侧；不与文字争夺画面

## 版面分区（避免重叠）

```
┌─ Header  y=72  ────────────────────────────────────────────────┐
│ BRAND (left, accent)            Subtitle (right, muted)        │
├─ Main row  y=192..820  ────────────────────────────────────────┤
│ Copy 左列 (x=96, w=680)         App Window 右列 (x=856, w=968) │
│  eyebrow / title 78px / 23px caption   产品 UI                 │
├─ Bilingual caption  y=856..948  ───────────────────────────────┤
│ EN 22px + ZH 16px（浮层胶囊）                                  │
├─ Scene progress  y=996  ───────────────────────────────────────┤
│ 7 段 thin progress bar + 当前 eyebrow 标签                     │
└────────────────────────────────────────────────────────────────┘
```

- `opening` / `closing` 切换为 **hero** 单列居中（无 App 窗口、无字幕条），用整屏大字
- 其余场景使用 **split** 双列，App 窗口里同一时刻只显示一个焦点（连线 / 形态 / 人格 / 合成 / 隐私）

## 分镜与旁白（8 段字幕 ↔ 7 段场景）

| 时间 | Scene (英) | 旁白 EN | 旁白 ZH | 画面焦点 |
|------|------------|---------|---------|----------|
| 0:00–0:08 | opening | Spatial Notes is a quiet canvas for thinking in space. | Spatial Notes 是一个安静的空间化思考画布。 | 浅色空间 + 大字主标题，无 App 框 |
| 0:08–0:16 | graph | Notes connect by hand — the thought becomes visible. | 亲手把便签连起来，想法就显出形状。 | App 内：主题卡 + 多张便签 + 手绘连线一笔笔画出 |
| 0:16–0:24 | forms | Each note finds its form — standard, glass, minimal, neo-brut, receipt. | 每张便签都有自己的形态——标准、玻璃、极简、神经粗野、票据。 | 居中单张便签在 5 种版式间交叉淡变；底部胶囊指示当前形态 |
| 0:24–0:34 | agents | Four personas read your notes — and the images linked to them. | 四个人格阅读你的便签，以及与之相连的图像。 | Theme + Observation + “Linked image”；四条线连向底部 4 个人格胶囊，最下方弹出 AI 洞察卡 |
| 0:34–0:42 | synth (a) | Select what matters. The canvas becomes a draft. | 选出关键的几张。画布会写成草稿。 | 左列便签被选中描边；右侧 Reference 草稿面板淡入 |
| 0:42–0:50 | synth (b) | The article stays linked to the canvas it came from. | 成文之后，仍引用回它的来源画布。 | Reference 面板继续显示；`↗ Linked to source canvas` 小标签出现 |
| 0:50–0:55 | privacy | Local-first. Private by default. | 本地优先，默认私密。 | App 内右上角 `Local-first · IndexedDB` 角标淡入 |
| 0:55–1:00 | closing | Build your spatial memory. | 开始搭建你的空间记忆。 | 全屏纸面渐变 + 大字 CTA + 网址 + 单一按钮 |

## 调字幕 / 调时间

- 改文案：编辑 `remotion-kit/remotion/spatial-notes-promo.json` 中的 `timestampSegments`
- 改场景节奏：编辑 `remotion-kit/remotion/SpatialNotesPromo.jsx` 顶部 `SCENES` 数组的 `start` / `end`
- 改版面分区坐标：编辑 `SpatialNotesPromo.jsx` 顶部的 `STAGE` 常量

## 品牌与视觉

- 主色：`#C2410C`（强调线、人格、CTA、活动 timeline）
- 文字：`#1F1B18` 深色 / `#8B847C` 静音灰
- 背景：`#FFF6EA → #FBF6EC → #EFE6D9` 浅纸渐变 + 轻微径向高光
- 字体：标题 Georgia + Noto Serif SC（衬线驱动叙事）；UI 与字幕 Inter / Helvetica Neue / Noto Sans SC
