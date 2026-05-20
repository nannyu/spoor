<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/932383b2-6259-4dd6-b8af-27215f3c575d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Netlify (web)

The SPA is built with `npm run build` (output in `dist`). Canvas data stays in the visitor’s browser (**IndexedDB**); Netlify only hosts static assets and redirect rules.

1. Push this repo (including root [`netlify.toml`](netlify.toml)) to Git and import the site in [Netlify](https://app.netlify.com): build command and publish directory are read from `netlify.toml` (`npm run build` / `dist`).
2. **`netlify.toml` adds edge rewrites** so `/api/mimo/*` and `/api/metaso/*` match local Vite proxies (Metaso search and MiMo in the browser). Without those rules, search / MiMo from the web app will fail on a plain static host.
3. **Do not rely on “drag and drop only `dist`”** for full features: manual deploys from a folder do not pick up `netlify.toml`, so API rewrites won’t apply. Use Git-based deploys (or paste equivalent redirects in the Netlify UI).

Optional: to bake a default **Gemini** key at build time (see [`vite.config.ts`](vite.config.ts) `loadEnv`), set `GEMINI_API_KEY` under **Site settings → Environment variables** in Netlify. User API keys configured inside the app are still stored locally in the browser, not on Netlify.

## 桌面端本地 GGUF（llama.cpp）

编译、环境变量、脚本与排障见 **[docs/LOCAL_LLM.md](docs/LOCAL_LLM.md)**。
