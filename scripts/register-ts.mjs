// Lets plain `node` run the repo's TypeScript: Node strips the types itself,
// this hook only resolves what Node won't: the `@/` alias from tsconfig and
// extensionless relative imports. Used by `npm run schedule:sql`.
import { statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const isFile = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const base = specifier.startsWith('@/')
      ? new URL(specifier.slice(2), root)
      : specifier.startsWith('.') &&
          context.parentURL?.startsWith(root.href) &&
          !context.parentURL.includes('/node_modules/')
        ? new URL(specifier, context.parentURL)
        : null;
    if (base) {
      for (const suffix of ['', '.ts', '/index.ts']) {
        const url = new URL(base.href + suffix);
        if (isFile(url)) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
