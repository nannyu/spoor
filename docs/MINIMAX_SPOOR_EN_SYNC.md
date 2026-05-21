# Spoor 英文旁白 · MiniMax 对齐说明（58s 视频为基准）

**不要改视频时长。** 旁白必须落在 `spoor-promo.json` 的 `timestampSegments` 起止时间上。

当前仓库里的 `en.wav` 长约 **66s**，与 58s 字幕错位。根因：

1. 上一版脚本里 **forms 段后用了过长停顿**（例如 `<#7.0#>`），MiniMax 会把停顿算进总时长，且 forms 那句（五种版式名）本身会读 **6–7 秒**，叠在一起就把后面整段往后推。
2. 停顿应写在 **每一句字幕念完之后**，用来填满「本句字幕窗口」的剩余时间，而不是随意估一个长数字。
3. MiniMax 实际语速与估算会有 ±1s 漂移，生成后要用播放器量总长，在 **1–2 处** 微调停顿（不要一次改很多处）。

## 字幕时间轴（与 Studio 一致）

| 起止 | 英文字幕（念稿需一致，可去掉 `\n`） |
|------|-------------------------------------|
| 0–4 | Spoor is a quiet canvas for thinking in space. |
| 4–10 | Notes connect by hand — the thought becomes visible. |
| 10–16 | Each note finds its form — standard, glass, minimal, neo-brut, receipt. |
| 16–24 | Select what matters. The canvas becomes a draft. |
| 24–28 | The article stays linked to the canvas it came from. |
| 28–32 | Local-first. Private by default. |
| 32–36 | Enter a topic — the agent decomposes it into a research plan you can edit. |
| 36–40 | Optional web sources inform the synthesis. The report is saved in your library. |
| 40–52 | Four personas read your notes — and the images linked to them. |
| 52–58 | A trace of thought, left on quiet ground. |

## MiniMax 设置

- **语速：1.05**（若导出仍 >60s，改为 **1.08** 重生成；若 <55s，改为 **1.02**）
- **音色**：与上一版相同即可，避免混用不同音色导致节奏变样
- **规则**：每句连读、句末短停顿；forms 五种版式名 **略快、等节奏**，不要拖长尾音

## V2 一键粘贴稿（目标总长约 58s）

下面整段复制到 MiniMax。`<#秒数#>` 表示 **上一句说完后的静音**。

```
Spoor is a quiet canvas for thinking in space.<#0.8#>Notes connect by hand — the thought becomes visible.<#2.2#>Each note finds its form — standard, glass, minimal, neo-brut, receipt.<#0.5#>Select what matters. The canvas becomes a draft.<#4.0#>The article stays linked to the canvas it came from.<#0.4#>Local-first. Private by default.<#2.0#>Enter a topic — the agent decomposes it into a research plan you can edit.<#0.2#>Optional web sources inform the synthesis. The report is saved in your library.<#0.2#>Four personas read your notes — and the images linked to them.<#4.8#>A trace of thought, left on quiet ground.
```

### 各句后的停顿含义（窗口 − 预估念稿时长，语速 1.05）

| 句序 | 字幕窗口 | 建议停顿 | 注意 |
|------|----------|----------|------|
| 1 | 4s | 0.8s | 开场句略短，留一点气口 |
| 2 | 6s | 2.2s | |
| 3 | 6s | **0.5s** | 五种版式名要念快；**禁止** 7s 级停顿 |
| 4 | 8s | 4.0s | synth 画面较长 |
| 5 | 4s | 0.4s | 与下句 privacy 紧接 |
| 6 | 4s | 2.0s | |
| 7–8 | 各 4s | 0.2s | 研究两句信息密，句间只留极短停顿 |
| 9 | 12s | **4.8s** | agent 画面最长；**不要** 再用 7s+ 停顿 |
| 10 | 6s | （句末无停顿） | 收束句占满 52–58s |

## 生成后验收（必做）

1. 导出 WAV，在系统播放器看时长：**55–60s 合格**；仍 >62s → 语速 +0.03 或把 agent 后 `<#4.8#>` 改为 `<#4.2#>` 重试。
2. 听感对齐：在 0s、4s、10s、16s、24s、28s、32s、36s、40s、52s 附近，**下一句应刚开始念**（允许 ±0.5s）。
3. 覆盖到 Remotion（两处都要换）：

```powershell
Copy-Item -Force ".\en.wav" ".\remotion-kit\remotion\assets\audio\en.wav"
Copy-Item -Force ".\en.wav" ".\remotion-kit\public\audio\en.wav"
```

4. 重启 Studio：`npm run remotion:studio --prefix remotion-kit`，选 **SpoorPromo**（不是 ZH），时间轴 0:00 应能听到旁白。

## 若仍差 1–2 秒

只改 **一处** 停顿重生成，优先顺序：

1. agent 句后（40–52 窗口）的 `<#4.8#>`
2. forms 句后的 `<#0.5#>`（若 forms 仍拖长到 7s，把语速提到 1.08）
3. 开场 / graph 句后（0–10 段）

**不要** 为迁就音频去改 `timestampSegments` 或视频 `SCENES`，除非你明确要求改片长。
