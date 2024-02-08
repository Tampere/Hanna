import react from '@vitejs/plugin-react';
import 'dotenv/config';
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import { CommonServerOptions, defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import faviconsInject from 'vite-plugin-favicons-inject';
import { Mode, plugin as mdPlugin } from 'vite-plugin-markdown';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// Use customized instance of MarkdownIt to enable anchor links
const markdownIt = MarkdownIt({ html: true }).use(MarkdownItAnchor, {});

const appVersion = process.env.APP_VERSION ?? 'local-dev';
const backendHost = process.env.BACKEND_HOST ?? '127.0.0.1';
const proxyAddress = `http://${backendHost}:3003`;

const serverOptions: CommonServerOptions = {
  host: '0.0.0.0',
  port: 8080,
  proxy: {
    '/logout': proxyAddress,
    '/api': proxyAddress,
    '/trpc': proxyAddress,
    '/proxy': proxyAddress,
    '/redirect-to-elomake': proxyAddress,
  },
};

export default defineConfig({
  plugins: [
    svgr(),
    process.env.NODE_ENV !== 'development' && (faviconsInject('./src/assets/logo.svg') as any),
    mdPlugin({
      mode: [Mode.REACT],
      markdownIt,
    }),
    react({ jsxImportSource: '@emotion/react', babel: { plugins: ['@emotion/babel-plugin'] } }),
    tsconfigPaths(),
    process.env.NODE_ENV === 'development' &&
      checker({
        typescript: true,
        overlay: {
          initialIsOpen: false,
        },
      }),
  ],
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/, /node_modules/],
    },
  },
  server: {
    ...serverOptions,
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
    hmr: {
      clientPort: process.env.HMR_PORT ? Number(process.env.HMR_PORT) : 443,
    },
  },
  preview: serverOptions,
  define: {
    APP_VERSION: JSON.stringify(appVersion),
  },
});
