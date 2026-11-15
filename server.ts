import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import app from './api/index.ts';

// Prevent unhandled promise rejections or exceptions from terminating the process
process.on('unhandledRejection', (reason) => {
  console.warn('Process caught unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Process caught uncaughtException:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portArgIdx = process.argv.indexOf('--port');
const portArg = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? parseInt(process.argv[portArgIdx + 1], 10) : null;
const port = portArg || (process.env.NODE_ENV === 'production'
  ? parseInt(process.env.PORT || '8080', 10)
  : 3000);

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (hasDist && process.env.npm_lifecycle_event !== 'dev');

  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`THIRAN server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
