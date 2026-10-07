import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// Dynamic resolution via Vite's ssrLoadModule avoids tsconfig.node NodeNext module crawling

/**
 * Backend Voice & API Service Plugin for Vite Development Server
 * Exposes /api/* endpoints with ZERO frontend secrets.
 */
function nexdoBackendApiPlugin(): Plugin {
  return {
    name: 'nexdo-backend-api-service',
    configureServer(server) {
      // 1. /api/tts/health
      server.middlewares.use('/api/tts/health', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', provider: 'NEXDO Voice Gateway' }));
      });

      // 2. Comprehensive /api router
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        let bodyData: any = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          let bodyStr = '';
          for await (const chunk of req) {
            bodyStr += chunk;
          }
          try {
            bodyData = bodyStr ? JSON.parse(bodyStr) : undefined;
          } catch {
            bodyData = bodyStr;
          }
        }

        try {
          const { handleNexdoApiRequest } = await server.ssrLoadModule('./src/backend/router.ts');
          const apiRes = await handleNexdoApiRequest({
            method: req.method || 'GET',
            url: req.url,
            body: bodyData,
            headers: req.headers as Record<string, string>,
          });

          res.writeHead(apiRes.status, apiRes.headers);
          res.end(apiRes.body ? JSON.stringify(apiRes.body) : '');
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nexdoBackendApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
