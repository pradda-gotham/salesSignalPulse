import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';

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
              console.log('[PROXY] Apollo Request:', req.method, req.url);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      {
        name: 'gemini-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/gemini', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const { model, contents, config } = JSON.parse(body);
                
                if (!env.GEMINI_API_KEY) {
                  throw new Error("GEMINI_API_KEY is not set in environment");
                }

                const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
                
                const response = await ai.models.generateContent({
                  model,
                  contents,
                  config
                });

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  text: response.text,
                  candidates: response.candidates,
                  usageMetadata: response.usageMetadata
                }));
              } catch (error: any) {
                console.error('[GEMINI PROXY ERROR]', error);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = error.status || 500;
                res.end(JSON.stringify({ 
                  error: 'Failed to generate content',
                  details: error.message 
                }));
              }
            });
          });
        }
      }
    ],
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
