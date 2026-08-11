import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// The shared local .env lives at the repository root, while this Vite project
// lives under artifacts/tikvah. Load it explicitly so API_PORT enables the dev
// proxy without making the frontend inherit the API's PORT.
const localEnv = loadEnv(process.env.NODE_ENV ?? 'development', path.resolve(import.meta.dirname, '..', '..'), '');

// Vercel does not set PORT for static Vite builds. Keep the deployment build
// independent of host-specific environment variables while allowing local
// development platforms to override the port as usual.
const rawPort = process.env.PORT ?? localEnv.VITE_PORT ?? '5173';

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// The application is served from the domain root on Vercel. BASE_PATH remains
// available for hosts that mount it beneath a subpath.
const basePath = process.env.BASE_PATH ?? localEnv.BASE_PATH ?? '/';
const apiPort = process.env.API_PORT ?? localEnv.API_PORT;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // In dev, the API server runs on its own port. Proxying /api keeps the
    // browser on a single origin so session cookies work without any
    // cross-origin cookie configuration. Set API_PORT to enable it.
    proxy: apiPort
      ? {
          '/api': {
            target: `http://localhost:${apiPort}`,
            changeOrigin: true,
          },
        }
      : undefined,
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
