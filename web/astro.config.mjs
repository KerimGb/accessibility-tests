import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const webDir = dirname(fileURLToPath(import.meta.url));
if (!process.env.REPORTS_BASE?.trim()) {
  process.env.REPORTS_BASE = join(webDir, '..', 'reports');
}

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [svelte()],
  vite: {
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:3456', changeOrigin: true },
        '/report': { target: 'http://127.0.0.1:3456', changeOrigin: true },
        '/auth': { target: 'http://127.0.0.1:3456', changeOrigin: true },
        '/robots.txt': { target: 'http://127.0.0.1:3456', changeOrigin: true },
        '/design-system.css': { target: 'http://127.0.0.1:3456', changeOrigin: true },
      },
    },
  },
});
