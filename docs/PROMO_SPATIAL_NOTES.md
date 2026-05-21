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

可选旁白：将 MP3 放在项目根目录，在 JSON 中增加 `"audioPath": "path/to/voiceover.mp3"`，或通过渲染 API 传入 `audioUrl`。

## 录音提示

- 语速：约 130–140 英文词/分钟；中文可略慢，保证与字幕段对齐。
- 语气：冷静、清晰，像「思维伙伴」而非推销主播。
- 每段英文见下表「旁白 EN」列；可与字幕轴逐段录制后拼接为一条 60s 音轨。

## 分镜与旁白（8 段）

| 时间 | 旁白 EN | 旁白 ZH | 画面 |
|------|---------|---------|------|
| 0:00–0:08 | Spatial Notes is a quiet canvas for thinking in space. | Spatial Notes 是一个安静的空间化思考画布。 | 极简标题、浅色空间、慢速镜头 |
| 0:08–0:17 | Ideas keep their position, shape, and relationship. | 想法保留位置、形态，以及彼此之间的关系。 | 浮层 App 窗口 + 画布卡片轻入 |
| 0:17–0:27 | AI works inside the room, close to the material. | AI 留在工作现场，贴近材料本身。 | AI 卡片低调高亮 |
| 0:27–0:37 | Different modes of thought can share the same memory. | 不同的思考方式，可以共享同一份记忆。 | Personas 小胶囊依次亮起 |
| 0:37–0:43 | Research becomes a path, not a pile. | 研究变成路径，而不是材料堆。 | Research 面板安静覆盖 |
| 0:43–0:48 | Writing remains linked to its source canvas. | 写作始终连接回来源画布。 | Long-form 关联标签出现 |
| 0:48–0:55 | Local-first. Private by default. | 本地优先，默认私密。 | 本地优先角标 |
| 0:55–1:00 | Build your spatial memory. | 开始搭建你的空间记忆。 | 中央 CTA，克制收尾 |

## 品牌与视觉

- 主色：`#C2410C`（强调、连线、高亮）
- 背景：浅色纸感空间 + 柔和径向渐变，避免广告感
- 字幕：底部小字号双语字幕，保持产品界面为主角
- 字体：Georgia + Noto Serif SC；辅助 UI 使用系统 sans
- 动效：慢淡入、轻微上移、缓慢推镜、低频高亮

## 修改字幕

编辑 `remotion-kit/remotion/spatial-notes-promo.json` 中的 `timestampSegments`，保存后在 Studio 刷新或重新 render 即可。
