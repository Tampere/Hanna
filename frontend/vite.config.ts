import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({ jsxImportSource: '@emotion/react', babel: { plugins: ['@emotion/babel-plugin'] } }),
    tsconfigPaths(),
    process.env.NODE_ENV === 'development' &&
      checker({
        typescript: {
          buildMode: true,
        },
        overlay: true,
      }),
  ],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/, /node_modules/],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/logout': 'http://backend:3003',
      '/api': 'http://backend:3003',
      '/trpc': 'http://backend:3003',
    },
  },
});
