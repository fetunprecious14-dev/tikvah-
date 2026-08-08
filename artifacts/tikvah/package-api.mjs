// Copies @workspace/api-server's build output into this artifact so that a
// single Vercel Project can serve both the static frontend and the Express API
// (see api/[...slug].js and vercel.json).
//
// Why copy instead of importing `../api-server/dist/app.mjs` directly: Vercel
// bundles a Function from the files it can trace under the Project's Root
// Directory, which here is `artifacts/tikvah`. Keeping every file the Function
// needs inside that directory means the bundle doesn't depend on how Vercel
// resolves traced paths that escape the Root Directory.
//
// Run this *after* `pnpm --filter @workspace/api-server run build`.
import { access, cp, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(artifactDir, "..", "api-server", "dist");
const targetDir = path.resolve(artifactDir, "dist", "server");

// The entry point api/[...slug].js re-exports. Everything else in the source
// directory is a pino worker file, loaded at runtime by path rather than by a
// static import, which is why the whole directory is copied rather than just
// this one file.
const entryPoint = "app.mjs";

async function packageApi() {
  try {
    await access(path.join(sourceDir, entryPoint));
  } catch {
    throw new Error(
      `${path.join(sourceDir, entryPoint)} not found. Build the API server first: ` +
        `pnpm --filter @workspace/api-server run build`,
    );
  }

  await rm(targetDir, { recursive: true, force: true });
  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(sourceDir, source);
      if (relative === "") return true;
      // index.mjs is the standalone `node dist/index.mjs` server entry (used on
      // a long-running host); Vercel imports app.mjs instead. Sourcemaps are
      // skipped because they point back at src/*.ts — a .ts file merely
      // *referenced* by a sourcemap is enough for Vercel to try compiling it
      // itself, which is the failure api-server/build.mjs documents at length.
      return relative !== "index.mjs" && !relative.endsWith(".map");
    },
  });

  const copied = await readdir(targetDir);
  console.log(
    `Packaged the API server into ${path.relative(artifactDir, targetDir)}/ (${copied.length} files)`,
  );
}

packageApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
