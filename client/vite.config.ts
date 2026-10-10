import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from root directory and client directory
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const clientEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...clientEnv, ...process.env };

  const backendPort = env.VITE_BACKEND_PORT || env.BACKEND_PORT || env.PORT || '5000';
  const backendHost = env.VITE_BACKEND_HOST || env.BACKEND_HOST || 'localhost';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});

