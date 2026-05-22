<div align="center">

<img src="./LOGO.png" alt="雪泥 · Spoor" width="120" />

# 雪泥 · Spoor

**本地优先的空间化便签画布** — AI 人格协思、深度研究实验室，数据留在你的设备上。

*Local-first spatial notes canvas with AI personas and a research lab.*

[![在线试用](https://img.shields.io/badge/在线试用-Netlify-00C7B7?style=for-the-badge)](https://scribe-ai-canvas.netlify.app/)
[![Windows 下载](https://img.shields.io/badge/Windows-Releases-C2410C?style=for-the-badge)](https://github.com/iimorning/spoor/releases/latest)
[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue?style=flat-square)](LICENSE)

[在线试用](https://scribe-ai-canvas.netlify.app/) · [下载桌面版](https://github.com/iimorning/spoor/releases/latest) · [报告问题](https://github.com/iimorning/spoor/issues)

</div>

---

## 能做什么

- **无限画布便签** — 拖拽、缩放、手绘连线，把想法铺在空间里而不是塞进文件夹
- **多种便签形态** — 文本、清单、资料片段等，按你的思考方式组织
- **四个人格 Agent** — 真知镜（反诘）、编织者（联结）、熨烫师（语言实验）、占星术（情景推演）；在画布上选中便签即可触发分析
- **深度研究实验室** — 可选联网检索，把资料沉淀进画布与资料库
- **长文与资料库** — 导入、整理、与便签联动
- **本地优先** — 画布数据存在本机 **IndexedDB**（浏览器或桌面 WebView），API Key 仅在设置里本地保存
- **Windows 桌面版** — 独立安装包，无需 Node.js；可选本机 **GGUF** 推理（见 [LOCAL_LLM.md](docs/LOCAL_LLM.md)）

## 快速开始

| 方式 | 适合谁 | 怎么做 |
|------|--------|--------|
| **网页版** | 想马上体验 | 打开 **[scribe-ai-canvas.netlify.app](https://scribe-ai-canvas.netlify.app/)** |
| **Windows 桌面** | 日常主力、本机数据 | 从 **[Releases](https://github.com/iimorning/spoor/releases/latest)** 下载 `Spoor_*_x64-setup.exe` 并安装 |
| **本地开发** | 贡献者 / 二次开发 | 见下方 [开发者](#开发者) |

**首次使用：** 打开应用 → **设置** → 选择 AI 服务商并填入 API Key（Gemini、OpenAI、MiMo 等）。密钥不会上传到我们的服务器。

### 网页版 vs 桌面版

| | 网页版 | Windows 桌面 |
|---|--------|----------------|
| 安装 | 打开链接即可 | NSIS 安装包 |
| 数据位置 | 当前浏览器的 IndexedDB | `%LOCALAPPDATA%\com.spoor.app\` |
| 本地 GGUF 模型 | 不支持 | 可选，见 [LOCAL_LLM.md](docs/LOCAL_LLM.md) |
| 下载入口 | 设置 → 下载 Windows 安装包 | 设置 → 打开 Releases |

> 从旧版 **Spatial Notes**（标识 `com.spatialnodes.app`）升级？数据目录不同，迁移见 [DATA_RECOVERY.md](docs/DATA_RECOVERY.md)。

---

## 开发者

**环境：** Node.js 20+（桌面构建另需 Rust stable、Windows 上 Visual Studio「使用 C++ 的桌面开发」）

```bash
git clone https://github.com/iimorning/spoor.git
cd spoor
npm install
```

**网页开发：**

```bash
# 可选：在 .env.local 中设置 GEMINI_API_KEY
npm run dev
# → http://localhost:3000
```

**桌面开发（Tauri）：**

```bash
npm run tauri:dev
```

**打包 Windows 安装包：**

```bash
npm run tauri:build
# 产物：src-tauri/target/release/bundle/nsis/Spoor_*_x64-setup.exe
```

维护者发版与手动上传说明见 [docs/DESKTOP_INSTALL.md](docs/DESKTOP_INSTALL.md)、[scripts/upload-release-manual.md](scripts/upload-release-manual.md)。

**托管 MiMo（用户免填 Key）：** 见 [docs/BUILTIN_MIMO.md](docs/BUILTIN_MIMO.md)，或 `npm run setup:mimo-key -- tp-你的密钥` 后执行 `npm run build`。

### 部署到 Netlify（网页）

`npm run build` 输出到 `dist`。画布数据仍在访客浏览器（IndexedDB）；Netlify 只托管静态资源。

1. 将本仓库（含根目录 [`netlify.toml`](netlify.toml)）接入 [Netlify](https://app.netlify.com) — 构建命令与发布目录由 `netlify.toml` 指定。
2. **`netlify.toml` 中的边缘重写** 使 `/api/mimo/*`、`/api/metaso/*` 与本地 Vite 代理一致；仅拖拽 `dist` 文件夹部署**不会**带上这些规则，MiMo / Metaso 在网页端会失败。
3. 可选：在 Netlify 环境变量中设置 `GEMINI_API_KEY` 作为构建时默认值；用户在应用内配置的 Key 仍只存于本地。

### 推广片（Remotion，可选）

```bash
npm run remotion:studio --prefix remotion-kit
npm run remotion:render:spoor --prefix remotion-kit      # 英文
npm run remotion:render:spoor-zh --prefix remotion-kit   # 中文
```

说明见 [docs/PROMO_SPOOR.md](docs/PROMO_SPOOR.md)。

---

## 文档

| 文档 | 说明 |
|------|------|
| [DESKTOP_INSTALL.md](docs/DESKTOP_INSTALL.md) | 桌面安装与发版 |
| [LOCAL_LLM.md](docs/LOCAL_LLM.md) | 本机 llama.cpp / GGUF |
| [DATA_RECOVERY.md](docs/DATA_RECOVERY.md) | 旧版数据迁移 |
| [PROMO_SPOOR.md](docs/PROMO_SPOOR.md) | 产品宣传片工作流 |
| [AI-PROMPTS.md](docs/AI-PROMPTS.md) | Agent 与提示词说明 |

---

## 技术栈

React · Vite · Dexie (IndexedDB) · Tauri 2 · Tailwind · i18next

---

## License / 许可证

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。

- **允许：** 个人学习、研究、测试、爱好项目及其他**非商业**用途。
- **未经书面授权不得：** 商业使用、商业部署、商业集成或商业再分发。

Commercial licensing: contact via [GitHub @iimorning](https://github.com/iimorning).

商业授权请联系：[GitHub @iimorning](https://github.com/iimorning).
