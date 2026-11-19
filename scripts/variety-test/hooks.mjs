// Lets plain Node import the app's TypeScript modules (src/site/*.ts), so the test
// builds documents with the same code the editor uses. Node strips the types itself;
// this only teaches it the "@/" alias and imports written without a file extension.
//
// Use with:  node --import ./scripts/variety-test/hooks.mjs <script>

import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

registerHooks({
  resolve(specifier, context, nextResolve) {
    const spec = specifier.startsWith('@/') ? pathToFileURL(path.join(root, 'src', specifier.slice(2))).href : specifier;
    try {
      return nextResolve(spec, context);
    } catch (err) {
      if (spec.startsWith('.') || spec.startsWith('file:')) {
        for (const ext of ['.ts', '.tsx']) {
          try {
            return nextResolve(spec + ext, context);
          } catch {}
        }
      }
      throw err;
    }
  },
});
