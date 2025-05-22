import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.mjs",
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["node:*", "fs", "path", "hono", "child_process"],
  minify: true,
  banner: {
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
    `,
  },
}).catch(() => process.exit(1));
