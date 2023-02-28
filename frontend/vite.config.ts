import react from '@vitejs/plugin-react';
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import { CommonServerOptions, defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mdPlugin, { Mode } from 'vite-plugin-markdown';
import tsconfigPaths from 'vite-tsconfig-paths';

// Use customized instance of MarkdownIt to enable anchor links
const markdownIt = MarkdownIt().use(MarkdownItAnchor, {});

const serverOptions: CommonServerOptions = {
  host: '0.0.0.0',
  port: 8080,
  proxy: {
    '/logout': 'http://backend:3003',
    '/api': 'http://backend:3003',
    '/trpc': 'http://backend:3003',
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
