import react from '@vitejs/plugin-react';
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import { CommonServerOptions, defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mdPlugin, { Mode } from 'vite-plugin-markdown';
import tsconfigPaths from 'vite-tsconfig-paths';

// Use customized instance of MarkdownIt to enable anchor links
const markdownIt = MarkdownIt({ html: true }).use(MarkdownItAnchor, {});

const backendHost = process.env.BACKEND_HOST ?? '127.0.0.1';
const proxyAddress = `http://${backendHost}:3003`;

const serverOptions: CommonServerOptions = {
  host: '0.0.0.0',
  port: 8080,
  proxy: {
    '/logout': proxyAddress,
    '/api': proxyAddress,
    '/trpc': proxyAddress,
  },
};

export default defineConfig({
  plugins: [
    mdPlugin({
      mode: [Mode.REACT],
      markdownIt,
    }),
    react({ jsxImportSource: '@emotion/react', babel: { plugins: ['@emotion/babel-plugin'] } }),
    tsconfigPaths(),
    process.env.NODE_ENV === 'development' &&
      checker({
        typescript: {
          buildMode: true,
        },
        overlay: {
          initialIsOpen: false,
        },
      }),
  ],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/, /node_modules/],
    },
  },
  server: {
    ...serverOptions,
    hmr: {
      clientPort: process.env.HMR_PORT ? Number(process.env.HMR_PORT) : 443,
    },
  },
  preview: serverOptions,
});
