import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

/** 与 tp- Token 套餐控制台一致；开发代理转发到此前缀 */
const MIMO_PROXY_TARGET = 'https://token-plan-cn.xiaomimimo.com/v1';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/mimo': {
          target: MIMO_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/mimo/, ''),
        },
      },
    },
    preview: {
      proxy: {
        '/api/mimo': {
          target: MIMO_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/mimo/, ''),
        },
      },
    },
  };
});
