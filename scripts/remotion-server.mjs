/**
 * Remotion 渲染 API（SSE）+ 静态目录。
 * projectRoot 指向 remotion-kit，以便使用其中的 remotion/ 与独立 node_modules。
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import remotionRoutes from '../remotion-kit/routes/remotion.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const projectRoot = path.join(repoRoot, 'remotion-kit');

const app = express();
app.use(express.json({ limit: '512kb' }));
app.use(express.static(projectRoot));

const outputDir = path.join(projectRoot, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
app.use('/output', express.static(outputDir));

remotionRoutes(app, { projectRoot });

const port = Number(process.env.PORT) || 3999;
app.listen(port, () => {
  console.log(`Remotion API: http://127.0.0.1:${port}/api/remotion/render`);
  console.log(`Static + output: projectRoot=${projectRoot}`);
});
