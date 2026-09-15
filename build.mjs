/**
 * Two outputs, two tools, for one reason each.
 *
 * **esbuild bundles the JavaScript into a single `dist/index.js`.** The source
 * imports its siblings extensionlessly (`from './Avatar'`), which `tsc` would
 * copy through verbatim into an import Node cannot resolve. Bundling removes
 * every relative specifier instead of rewriting fifteen files that somebody is
 * working in right now.
 *
 * **`tsc` emits the declarations.** Those keep the extensionless relative
 * imports between them, which resolves under `moduleResolution: "bundler"` —
 * what Peek, Ship and the agent all set. A consumer on `node16` resolution
 * would need the extensions; none exists today, and the fix then is to add them
 * to the source rather than to work around it here.
 *
 * Everything a consumer already has is external: React and the icons are peers,
 * clsx, tailwind-merge and @base-ui/react are dependencies npm installs. Bundling
 * any of them would ship a second React into somebody's app. One external entry
 * covers a package's subpaths too: measured with esbuild 0.28, '@base-ui/react'
 * leaves '@base-ui/react/button' external, so no wildcard is needed.
 */
import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  sourcemap: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@tabler/icons-react', 'clsx', 'tailwind-merge', '@base-ui/react'],
  logLevel: 'warning',
})

/**
 * The lint plugin, `@estiva-app/ui/eslint` (UIG-3): its own bundle, for Node,
 * so nothing of it reaches the components' browser bundle. It imports nothing
 * at run time but Node's own `module`; `eslint` appears in its types only.
 */
await build({
  entryPoints: ['src/eslint/index.ts'],
  outfile: 'dist/eslint/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  external: ['eslint'],
  logLevel: 'warning',
})

console.log('built dist/index.js, dist/eslint/index.js')
