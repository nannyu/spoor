<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/932383b2-6259-4dd6-b8af-27215f3c575d

## 桌面版安装（Windows，推荐给普通用户）

**一键下载安装包，无需 Node.js：**

1. 打开 **[GitHub Releases](https://github.com/iimorning/scribe-ai-canvas/releases/latest)**
2. 下载 **`Spoor_*_x64-setup.exe`**
3. 运行安装向导，从开始菜单打开 **Spoor / 雪泥**

详细说明与维护者发版步骤见 **[docs/DESKTOP_INSTALL.md](docs/DESKTOP_INSTALL.md)**。

> 首次发布：维护者需执行 `git tag v0.1.0 && git push origin v0.1.0`，由 GitHub Actions 自动构建并上传安装包。

---

## Run Locally（开发者）

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

**桌面开发模式（Tauri）：**

```bash
npm run tauri:dev
```

**本地打 Windows 安装包：**

```bash
npm run tauri:build
# 或 scripts\tauri-build-release.cmd
```

## Deploy to Netlify (web)

The SPA is built with `npm run build` (output in `dist`). Canvas data stays in the visitor’s browser (**IndexedDB**); Netlify only hosts static assets and redirect rules.

1. Push this repo (including root [`netlify.toml`](netlify.toml)) to Git and import the site in [Netlify](https://app.netlify.com): build command and publish directory are read from `netlify.toml` (`npm run build` / `dist`).
2. **`netlify.toml` adds edge rewrites** so `/api/mimo/*` and `/api/metaso/*` match local Vite proxies (Metaso search and MiMo in the browser). Without those rules, search / MiMo from the web app will fail on a plain static host.
3. **Do not rely on “drag and drop only `dist`”** for full features: manual deploys from a folder do not pick up `netlify.toml`, so API rewrites won’t apply. Use Git-based deploys (or paste equivalent redirects in the Netlify UI).

Optional: to bake a default **Gemini** key at build time (see [`vite.config.ts`](vite.config.ts) `loadEnv`), set `GEMINI_API_KEY` under **Site settings → Environment variables** in Netlify. User API keys configured inside the app are still stored locally in the browser, not on Netlify.

## 桌面端本地 GGUF（llama.cpp）

编译、环境变量、脚本与排障见 **[docs/LOCAL_LLM.md](docs/LOCAL_LLM.md)**。

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

- **Allowed:** personal, educational, and other noncommercial use.
- **Not allowed without permission:** commercial use, commercial deployment, commercial integration, or commercial redistribution.

For commercial licensing, contact the author via [GitHub](https://github.com/iimorning).

## 许可证

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。

- **允许：** 个人学习、研究、测试、爱好项目及其他非商业用途。
- **未经书面授权不得：** 商业使用、商业部署、商业集成或商业再分发。

商业授权请联系作者：[GitHub @iimorning](https://github.com/iimorning)。
