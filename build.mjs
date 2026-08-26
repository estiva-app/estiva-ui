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
 * clsx and tailwind-merge are dependencies npm installs. Bundling any of them
 * would ship a second React into somebody's app.
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
  external: ['react', 'react-dom', 'react/jsx-runtime', '@tabler/icons-react', 'clsx', 'tailwind-merge'],
  logLevel: 'warning',
})

console.log('built dist/index.js')
