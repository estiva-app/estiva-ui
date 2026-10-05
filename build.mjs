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
 * The editor corner, `@estiva-app/ui/editor` (UIG-31): its own bundle, because
 * it imports Tiptap, which only an app with an editor installs. At `dist/editor.js`,
 * beside `index.js`, so the apps' Tailwind finds its classes through the
 * `dist/*.js` that `estivaContent` already lists.
 *
 * **It must not carry a second copy of the package.** The parts it draws —
 * `Popover`, `Toolbar`, `MenuItem`, `SuggestionMenu` — are imported from the
 * main entry as `@estiva-app/ui`, so an app has one of each: a copy would be a
 * second set of components, drifting the day one of them changes. The source
 * imports its siblings relatively, as the rest of `src` does; the plugin below
 * turns every relative import that is not one of the editor's own files into
 * `@estiva-app/ui`, which every one of them is exported from.
 */
// The block nodes (MAN-9) are the editor's own too: they import Tiptap, so the main entry cannot carry them.
// So is EditorBlockHandle (RIC-18); the BlockHandle it wraps is the main entry's, and imported from there.
const EDITOR_OWN = new Set(['./SelectionToolbar', './suggestionPopup', './BlockNodes', './ComposerTriggers', './EditorBlockHandle'])
await build({
  entryPoints: ['src/editor.ts'],
  outfile: 'dist/editor.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  sourcemap: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@tabler/icons-react', '@tiptap/core', '@tiptap/extension-mention', '@tiptap/react', '@tiptap/pm', '@tiptap/suggestion', '@estiva-app/ui'],
  plugins: [
    {
      name: 'main-entry-is-external',
      setup(on) {
        on.onResolve({ filter: /^\.\// }, (args) => {
          if (args.kind === 'entry-point' || EDITOR_OWN.has(args.path)) return undefined
          return { path: '@estiva-app/ui', external: true }
        })
      },
    },
  ],
  logLevel: 'warning',
})

/*
  Every name the editor corner takes from the main entry must be one it exports.
  A file left out of EDITOR_OWN is turned into an import from `@estiva-app/ui`
  that no test here can see — they run on `src` — and an app's first import of
  the editor then fails (RIC-18: EditorBlockHandle, before it was listed).
*/
{
  const { readFileSync } = await import('node:fs')
  const names = (list) => list.split(',').map((s) => s.trim()).filter(Boolean)
  const main = new Set([...readFileSync('dist/index.js', 'utf8').matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) => names(m[1]).map((s) => s.split(/\s+as\s+/).pop())))
  const taken = [...readFileSync('dist/editor.js', 'utf8').matchAll(/import\s*\{([^}]*)\}\s*from\s*"@estiva-app\/ui"/g)].flatMap((m) => names(m[1]).map((s) => s.split(/\s+as\s+/)[0]))
  const missing = taken.filter((name) => !main.has(name))
  if (missing.length) throw new Error(`dist/editor.js imports ${missing.join(', ')} from @estiva-app/ui, which does not export them: add the file to EDITOR_OWN in build.mjs`)
}

/**
 * The lint plugin, `@estiva-app/ui/eslint` (UIG-3): its own bundle, for Node,
 * so nothing of it reaches the components' browser bundle. At run time it
 * imports Node's own `module` and, since `no-copied-look` (UIG-25),
 * `typescript`, which stays the app's own install; `eslint` appears in its
 * types only.
 */
await build({
  entryPoints: ['src/eslint/index.ts'],
  outfile: 'dist/eslint/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  external: ['eslint', 'typescript'],
  logLevel: 'warning',
})

/**
 * The gate pieces, `@estiva-app/ui/gates`, and the two commands on them
 * (UIG-10; docs/GATES.md §23): everything an app needs to run a gate, shipped
 * once, here, instead of pasted into every repo. For Node, like the plugin.
 *
 * Every package they name stays external (`packages: 'external'`): ESLint, its
 * plugins, Tailwind and TypeScript are the app's own installs, resolved from
 * the app's `node_modules`. The plugin itself is imported from
 * `../eslint/index.js`, never bundled a second time, so a config that registers
 * both holds one plugin object and ESLint sees one `estiva`.
 *
 * `create-estiva-app` is the exception: it runs from `npx` before any app
 * exists, so it may load only this package's own dependencies. It reads the
 * rule names from `../eslint/rule-ids`, which has no imports and is bundled in;
 * `create-app.test.ts` walks the built command and fails on anything else.
 */
const thePluginOnce = {
  name: 'the-plugin-once',
  setup(b) {
    b.onResolve({ filter: /^\.\.\/eslint\/index(\.ts)?$/ }, () => ({ path: '../eslint/index.js', external: true }))
    // The catalogue too (UIG-13): a gate check builds an app's catalogue with the
    // registry bundle's own builder, loaded only when that check runs.
    b.onResolve({ filter: /^\.\.\/registry\/index(\.ts)?$/ }, () => ({ path: '../registry/index.js', external: true }))
  },
}
await build({
  entryPoints: { index: 'src/gates/index.ts', cli: 'src/gates/cli.ts', 'create-app': 'src/gates/create-app-cli.ts' },
  outdir: 'dist/gates',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
  plugins: [thePluginOnce],
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'warning',
})

/**
 * The catalogue and the command on it, `@estiva-app/ui/registry` (UIG-12).
 *
 * The builder reads TypeScript with TypeScript's own parser — a file is not a
 * component here, so nothing else is accurate — and `typescript` stays external
 * like every other tool the gate pieces name: it is the app's own install. The
 * data it produces, `registry.json`, is committed at the package's root and
 * shipped, so `estiva-ui find` answers inside an app that never checks this out.
 */
await build({
  entryPoints: { index: 'src/registry/index.ts', cli: 'src/registry/cli.ts' },
  outdir: 'dist/registry',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
  plugins: [thePluginOnce],
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'warning',
})

console.log('built dist/index.js, dist/editor.js, dist/eslint/index.js, dist/gates/, dist/registry/')
