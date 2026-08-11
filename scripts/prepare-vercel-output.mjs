import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const viteOutput = path.join(repositoryRoot, "artifacts", "tikvah", "dist", "public");
const vercelOutput = path.join(repositoryRoot, "public");

await rm(vercelOutput, { recursive: true, force: true });
await mkdir(vercelOutput, { recursive: true });
await cp(viteOutput, vercelOutput, { recursive: true });

console.log(`Prepared Vercel output at ${vercelOutput}`);
