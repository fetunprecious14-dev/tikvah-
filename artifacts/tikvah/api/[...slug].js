// Vercel serverless Function entry point for the whole API — a catch-all, so
// every request under /api/* lands here and is handled by Express's own
// internal routing. This is what lets the frontend and the backend live in a
// single Vercel Project on a single domain: /api/* is this Function, and
// everything else is the static Vite build (see ../vercel.json).
//
// Deliberately plain JS, re-exporting an already-bundled file: this avoids
// Vercel's own TypeScript compilation pass, which doesn't reliably apply this
// workspace's tsconfig (its `extends` chain / esModuleInterop-equivalent
// settings) and otherwise fails on CJS default imports like pino-http/cors
// with "not callable" errors.
//
// `../dist/server/app.mjs` is not checked in: `pnpm run package:api` copies it
// (and pino's worker files) out of @workspace/api-server's own build output.
// The Build Command in ../vercel.json runs both steps before Vercel bundles
// this file, so the import is resolvable by then.
export { default } from "../dist/server/app.mjs";
