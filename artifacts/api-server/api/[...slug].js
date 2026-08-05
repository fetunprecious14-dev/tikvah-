// Vercel serverless Function entry point (catch-all — every request under
// /api/* lands here and is handled by Express's own internal routing).
//
// Deliberately plain JS, re-exporting an already-bundled file: this avoids
// Vercel's own TypeScript compilation pass, which doesn't reliably apply this
// workspace's tsconfig (its `extends` chain / esModuleInterop-equivalent
// settings) and otherwise fails on CJS default imports like pino-http/cors
// with "not callable" errors. `../dist/app.mjs` is produced by `pnpm run
// build` (see ../build.mjs) — make sure that runs before this is bundled;
// it's the project's Build Command, so Vercel does this automatically.
export { default } from "../dist/app.mjs";
