import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/apollo': {
          target: 'https://api.apollo.io/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/apollo/, ''),
          secure: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('[PROXY] Request:', req.method, req.url, '→', options.target + req.url.replace('/api/apollo', ''));
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('[PROXY] Response:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
