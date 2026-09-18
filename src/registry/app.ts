/// <reference types="node" />
/**
 * An app's catalogue (UIG-13): every part in an app's own code, what it is for,
 * where it is used, and which of four kinds it is.
 *
 * **Built fresh, never committed** (Katerina, 18 September 2026). The package is
 * public and Peek and Ship are private, so an app's catalogue lives nowhere but
 * in its own code: `estiva-ui find` and `estiva-ui check` build it each time,
 * which takes about a second, and `estiva-ui build` writes it to a file only
 * when asked. A file that is never kept can never drift.
 *
 * **A file is not a part, and a folder says nothing.** Peek's `components/ui`
 * holds one-line pass-ons beside 187-line components, one file can hold six
 * parts, and a part can draw nothing at all (a provider, a listener). So the
 * target set is every name an app's `.tsx` files export that is a part: a
 * function that draws, or a name drawn as a tag somewhere in the app. The kind
 * is read from the code, and only from the code:
 *
 * - **re-export** — its file only hands a package part on.
 * - **one-off** — one file of the app uses it.
 * - **reusable** — two or more do.
 * - **promote-candidate** — two or more do, and everything it uses is already in
 *   the package, so it could move there as it is. Katerina rules on each.
 * - **unused** — no file of the app uses it; its stories or tests may.
 *
 * Where the count is wrong — a general part only one screen uses yet — a person
 * writes the kind beside the part, with the reason, and the catalogue shows it:
 *
 *     /**
 *      * A timeline of what happened to a thing.
 *      * @registry reusable: general; one screen uses it so far
 *      *\/
 *
 * TypeScript is the app's own install, as it is for the package's builder.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'
import { firstSentence, pageOpening, readModule, sanitize, toId, PACKAGE_IMPORT, type Resolved } from './build'
import { SCHEMA_VERSION, type AppFacts, type EntryClass, type FileWithoutPart, type Registry, type RegistryEntry } from './schema'

export interface AppBuildOptions {
  /** The app's folder: where its `package.json` and `src/` are. Ship's is `web`. */
  root?: string
  /** The name its entries are recorded under — `peek`, `ship`. Defaults to the app's package name. */
  repo?: string
  /** The package's own catalogue, for the parts an app part shares a name with. Defaults to the one this builder ships beside. */
  packageRegistry?: Registry | null
  /** The packages the package itself depends on. An import of one never ties a part to its app. Defaults to the package's own. */
  packageDependencies?: string[]
}

/** The kinds a person may write beside a part. A pass-on is a fact about its file; so is being used nowhere. */
const WRITABLE: EntryClass[] = ['reusable', 'one-off', 'promote-candidate']
const WRITTEN = /^@registry\s+([a-z-]+)\s*:\s*(.+)$/m

const isStory = (file: string) => /\.stories\.[cm]?[jt]sx?$/.test(file)
const isTest = (file: string) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || /(^|\/)__(tests|mocks)__\//.test(file)
const isPascal = (name: string) => /^[A-Z][A-Za-z0-9]*$/.test(name) && !/^[A-Z0-9_]+$/.test(name)
/**
 * `export default memo(TopicRow)`: the default is TopicRow, wrapped. A call on
 * a name, with no function written into it, hands that name out, so the export
 * is read as if it named it — one part, whose comment and props are its own.
 */
function unwrapDefault<T extends { isDefault: boolean; local: string | null; node: ts.Node | null }>(ex: T): T {
  if (!ex.isDefault || ex.local || !ex.node || !ts.isCallExpression(ex.node)) return ex
  const [first] = ex.node.arguments
  return first && ts.isIdentifier(first) ? { ...ex, local: first.text, node: null } : ex
}

/** `memo-page` → `MemoPage`, `topic_view` → `TopicView`. */
const pascalOf = (stem: string) => stem.split(/[^A-Za-z0-9]+/).filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join('')
const CODE = ['.tsx', '.ts', '.jsx', '.js', '.mts', '.cts']

/** `@scope/name/sub` → `@scope/name`; `name/sub` → `name`. */
function packageOf(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

/** What the package this builder belongs to depends on, and its catalogue. Read from beside the builder. */
function packageSelf(): { dependencies: string[]; registry: Registry | null } {
  const at = (rel: string) => new URL(rel, import.meta.url)
  const manifest = JSON.parse(readFileSync(at('../../package.json'), 'utf8')) as { name: string; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }
  const registryUrl = at('../../registry.json')
  const registry = existsSync(registryUrl) ? (JSON.parse(readFileSync(registryUrl, 'utf8')) as Registry) : null
  return { dependencies: [manifest.name, ...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})], registry }
}

/** The import aliases an app's `tsconfig*.json` files declare: `@/*` → `<root>/src/*`. */
function readAliases(root: string): { prefix: string; target: string }[] {
  const aliases: { prefix: string; target: string }[] = []
  for (const name of readdirSync(root).filter((file) => /^tsconfig.*\.json$/.test(file)).sort()) {
    const read = ts.readConfigFile(join(root, name), ts.sys.readFile)
    const options = (read.config?.compilerOptions ?? {}) as { paths?: Record<string, string[]>; baseUrl?: string }
    const base = resolve(root, options.baseUrl ?? '.')
    for (const [pattern, targets] of Object.entries(options.paths ?? {})) {
      if (!pattern.endsWith('/*') || !targets[0]?.endsWith('/*')) continue
      const prefix = pattern.slice(0, -1)
      if (!aliases.some((alias) => alias.prefix === prefix)) aliases.push({ prefix, target: resolve(base, targets[0].slice(0, -2)) })
    }
  }
  return aliases
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name.startsWith('.')) return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/** One import, re-export or dynamic import of a file, resolved. */
interface Link {
  specifier: string
  /** An app code file, relative to the app; `null` for a package; `'?'` for anything else. */
  target: string | null
  /** `imported` name → local name; `*` for a namespace or a dynamic import. Type-only names are left out. */
  names: { imported: string; local: string }[]
  typeOnly: boolean
  kind: 'import' | 're-export' | 'dynamic'
}

/** A part a file exports, before anything is known about its use. */
interface Found {
  file: string
  /** The name it is exported as; a default export takes its own name, or the file's. */
  name: string
  /** The name it has inside its file, where it has one. */
  local: string | null
  defaultExport: boolean
  /** A pass-on: the package and the name it hands on. */
  from: { specifier: string; name: string } | null
}

/** Everything one file says, read once. */
interface FileFacts {
  file: string
  source: string
  sf: ts.SourceFile
  links: Link[]
  /** `exported name` → local name, and whether it is the default. */
  exports: { name: string; local: string | null; isDefault: boolean; node: ts.Node | null }[]
  /** Pass-ons and barrel entries: `export { A } from '…'`. */
  reexports: { name: string; source: string; specifier: string; target: string | null }[]
  starFrom: { specifier: string; target: string | null }[]
  /** Every name drawn as a JSX tag in this file. */
  tags: Set<string>
  /** Each imported value name → where it came from, for `import { X } from '…'` then `export { X }`. */
  bindings: Map<string, { specifier: string; imported: string; target: string | null }>
}

/** Whether a node draws: JSX, or `createElement` / `createPortal`. */
function draws(node: ts.Node): boolean {
  let found = false
  const visit = (n: ts.Node) => {
    if (found) return
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      found = true
      return
    }
    if (ts.isCallExpression(n)) {
      const callee = ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : ts.isIdentifier(n.expression) ? n.expression.text : ''
      if (callee === 'createElement' || callee === 'createPortal') {
        found = true
        return
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/**
 * Whether a file names `local` anywhere but in `home` (its own declaration), its
 * imports and its export lines — as a tag, a value, or passed along. A property
 * name, an attribute name and a type are not uses of the part.
 */
function mentions(sf: ts.SourceFile, local: string, home: ts.Node | null): boolean {
  let named = false
  const visit = (n: ts.Node) => {
    if (named) return
    if (ts.isIdentifier(n) && n.text === local) {
      const parent = n.parent
      // The name of something else that happens to be spelled the same — a
      // property of a type or a class, a member, another declaration — is not the part.
      const declares = (ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent) || ts.isMethodDeclaration(parent) || ts.isMethodSignature(parent) || ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent) || ts.isEnumMember(parent) || ts.isVariableDeclaration(parent) || ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) && (parent as { name?: ts.Node }).name === n
      const bindingKey = ts.isBindingElement(parent) && parent.propertyName === n
      const isName = declares || bindingKey || (ts.isPropertyAccessExpression(parent) && parent.name === n) || (ts.isPropertyAssignment(parent) && parent.name === n) || ts.isJsxAttribute(parent) || ts.isExportSpecifier(parent) || ts.isImportSpecifier(parent) || ts.isJsxClosingElement(parent)
      // `SlashMenu.displayName = 'SlashMenu'` sets something on the part; it does not use it.
      const configures = ts.isPropertyAccessExpression(parent) && parent.expression === n && ts.isBinaryExpression(parent.parent) && parent.parent.left === parent && parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      if (configures) {
        ts.forEachChild(n, visit)
        return
      }
      let inType = false
      for (let a: ts.Node | undefined = parent; a && a !== sf; a = a.parent) if (ts.isTypeNode(a)) inType = true
      if (!isName && !inType) named = true
    }
    ts.forEachChild(n, visit)
  }
  for (const s of sf.statements) {
    if (s === home || ts.isExportDeclaration(s) || ts.isExportAssignment(s) || ts.isImportDeclaration(s)) continue
    visit(s)
  }
  return named
}

/**
 * The thing a declaration holds, if it is a function, a class, or a call that
 * wraps one (`forwardRef`, `memo`) — as a constant, or written straight into
 * `export default …`.
 */
function drawingBody(node: ts.Node): ts.Node | null {
  if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) return node
  const init = ts.isVariableDeclaration(node) ? node.initializer : ts.isExpression(node) ? node : undefined
  if (!init) return null
  if (ts.isArrowFunction(init) || ts.isFunctionExpression(init) || ts.isClassExpression(init)) return init
  if (ts.isCallExpression(init)) {
    const callee = init.expression.getText()
    if (/(^|\.)createContext$/.test(callee)) return null
    if (init.arguments.some((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a))) return init
  }
  return null
}

/**
 * Read one app and return its catalogue.
 *
 * Throws on anything it cannot explain, with every problem at once: a part with
 * no purpose, a written kind it does not know. A catalogue that quietly drops
 * what it could not read would answer "we have nothing for that" when the
 * truth is "the builder gave up".
 */
export function buildAppRegistry({ root = process.cwd(), repo, packageRegistry, packageDependencies }: AppBuildOptions = {}): Registry {
  const app = resolve(root)
  const src = join(app, 'src')
  if (!existsSync(src)) throw new Error(`${app} has no src/ folder: estiva-ui reads an app's parts from src/`)
  const manifest = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { name?: string; version?: string; scripts?: Record<string, string> }
  const self = packageRegistry === undefined || packageDependencies === undefined ? packageSelf() : null
  const theRegistry = packageRegistry === undefined ? (self?.registry ?? null) : packageRegistry
  const allowed = new Set(packageDependencies ?? self?.dependencies ?? [])
  const repoName = repo ?? manifest.name ?? basename(app)
  const aliases = readAliases(app)
  const rel = (abs: string) => relative(app, abs).split(sep).join('/')

  const files = walk(src)
    .filter((path) => CODE.includes(extname(path)) && !path.endsWith('.d.ts'))
    .map(rel)
    .sort()
  const known = new Set(files)

  /** Where an import points: an app code file, a package (`null`), or something else (`'?'`). */
  const resolveSpecifier = (from: string, specifier: string): string | null => {
    let base: string | null = null
    if (specifier.startsWith('.')) base = resolve(app, dirname(from), specifier)
    else {
      const alias = aliases.find((a) => specifier.startsWith(a.prefix))
      if (alias) base = join(alias.target, specifier.slice(alias.prefix.length))
    }
    if (base === null) return null
    const stem = base.replace(/\.(js|jsx)$/, '')
    for (const candidate of [base, ...CODE.map((e) => stem + e), ...CODE.map((e) => join(base, `index${e}`))]) {
      const r = rel(candidate)
      if (known.has(r)) return r
    }
    return '?'
  }

  // ── Read every file once ────────────────────────────────────────────────
  const facts = new Map<string, FileFacts>()
  for (const file of files) {
    const source = readFileSync(join(app, file), 'utf8')
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const links: Link[] = []
    const exports: FileFacts['exports'] = []
    const reexports: FileFacts['reexports'] = []
    const starFrom: FileFacts['starFrom'] = []
    for (const statement of sf.statements) {
      if (ts.isImportDeclaration(statement)) {
        if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
        const specifier = statement.moduleSpecifier.text
        const clause = statement.importClause
        const names: Link['names'] = []
        if (clause && !clause.isTypeOnly) {
          if (clause.name) names.push({ imported: 'default', local: clause.name.text })
          const bindings = clause.namedBindings
          if (bindings && ts.isNamedImports(bindings)) for (const e of bindings.elements) if (!e.isTypeOnly) names.push({ imported: (e.propertyName ?? e.name).text, local: e.name.text })
          if (bindings && ts.isNamespaceImport(bindings)) names.push({ imported: '*', local: bindings.name.text })
        }
        links.push({ specifier, target: resolveSpecifier(file, specifier), names, typeOnly: !!clause?.isTypeOnly || (clause !== undefined && names.length === 0 && !!clause.namedBindings), kind: 'import' })
        continue
      }
      if (ts.isExportDeclaration(statement)) {
        const specifier = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : null
        if (specifier === null) {
          if (!statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
            // `export { Page as default }` is the file's default, named Page.
            for (const e of statement.exportClause.elements) if (!e.isTypeOnly) exports.push({ name: e.name.text, local: (e.propertyName ?? e.name).text, isDefault: e.name.text === 'default', node: null })
          }
          continue
        }
        const target = resolveSpecifier(file, specifier)
        links.push({ specifier, target, names: [], typeOnly: statement.isTypeOnly, kind: 're-export' })
        if (statement.isTypeOnly) continue
        if (!statement.exportClause) starFrom.push({ specifier, target })
        else if (ts.isNamedExports(statement.exportClause)) {
          for (const e of statement.exportClause.elements) if (!e.isTypeOnly) reexports.push({ name: e.name.text, source: (e.propertyName ?? e.name).text, specifier, target })
        }
        continue
      }
      if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
        const e = statement.expression
        exports.push({ name: 'default', local: ts.isIdentifier(e) ? e.text : null, isDefault: true, node: ts.isIdentifier(e) ? null : e })
        continue
      }
      const mods = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : []
      if (!mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
      const isDefault = mods.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
      if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
        exports.push({ name: isDefault ? 'default' : (statement.name?.text ?? 'default'), local: statement.name?.text ?? null, isDefault, node: statement })
      } else if (ts.isVariableStatement(statement)) {
        for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name)) exports.push({ name: d.name.text, local: d.name.text, isDefault: false, node: d })
      }
    }
    const tags = new Set<string>()
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
        const specifier = n.arguments[0].text
        links.push({ specifier, target: resolveSpecifier(file, specifier), names: [{ imported: '*', local: '(dynamic)' }], typeOnly: false, kind: 'dynamic' })
      }
      if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && ts.isIdentifier(n.tagName)) tags.add(n.tagName.text)
      ts.forEachChild(n, visit)
    }
    visit(sf)
    const bindings: FileFacts['bindings'] = new Map()
    for (const link of links) if (link.kind === 'import') for (const n of link.names) if (n.imported !== '*') bindings.set(n.local, { specifier: link.specifier, imported: n.imported, target: link.target })
    facts.set(file, { file, source, sf, links, exports, reexports, starFrom, tags, bindings })
  }

  const drawnAnywhere = new Set<string>()
  for (const f of facts.values()) for (const tag of f.tags) drawnAnywhere.add(tag)

  /** A top-level declaration of a file, by its local name. */
  const declarationOf = (f: FileFacts, local: string): ts.Node | null => {
    for (const s of f.sf.statements) {
      if ((ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) && s.name?.text === local) return s
      if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === local) return d
    }
    return null
  }

  // ── The parts ───────────────────────────────────────────────────────────
  const problems: string[] = []
  const found: Found[] = []
  const targets = files.filter((file) => file.endsWith('.tsx') && !isStory(file) && !isTest(file))
  for (const file of targets) {
    const f = facts.get(file)!
    for (const written of f.exports) {
      const ex = unwrapDefault(written)
      // `export function App` and `export default App` — or `export default memo(App)`: one part, not two.
      if (ex.isDefault && ex.local && f.exports.some((other) => !other.isDefault && other.local === ex.local)) continue
      const node = ex.node ?? (ex.local ? declarationOf(f, ex.local) : null)
      // A default with no name of its own takes its file's, as a name: `memo-page.tsx` → MemoPage.
      const own = ex.local ?? (ex.isDefault ? pascalOf(basename(file, extname(file))) : ex.name)
      const name = ex.isDefault ? own : ex.name
      if (!isPascal(name)) continue
      // `import { SkeletonBar } from '@estiva-app/ui'` and later `export { SkeletonBar }`:
      // handed on, exactly as `export { SkeletonBar } from '@estiva-app/ui'` is.
      // From another file of the app it is a barrel, and the part is listed there.
      const bound = node === null && ex.local ? f.bindings.get(ex.local) : undefined
      if (bound) {
        if (bound.target === null) found.push({ file, name, local: null, defaultExport: ex.isDefault, from: { specifier: bound.specifier, name: bound.imported } })
        continue
      }
      const body = node ? drawingBody(node) : null
      const isPart = (body !== null && draws(body)) || drawnAnywhere.has(ex.local ?? name)
      if (isPart) found.push({ file, name, local: ex.local, defaultExport: ex.isDefault, from: null })
    }
    for (const re of f.reexports) {
      // Handing on another file of the app is a barrel: the part is listed where it is written.
      if (re.target !== null || !isPascal(re.name)) continue
      found.push({ file, name: re.name, local: null, defaultExport: false, from: { specifier: re.specifier, name: re.source } })
    }
    for (const star of f.starFrom) {
      if (star.target === null) problems.push(`${file} hands on everything from '${star.specifier}' with export *: name the parts it hands on, so the catalogue can list them`)
    }
  }

  // ── Where each is used ──────────────────────────────────────────────────
  const key = (file: string, name: string) => `${file}#${name}`
  const byKey = new Map(found.map((p) => [key(p.file, p.name), p]))
  const partsIn = (file: string) => found.filter((p) => p.file === file)
  /** The part a file's default export is, however it was written. */
  const defaultPartOf = (file: string): Found | null => {
    const written = facts.get(file)?.exports.find((e) => e.isDefault)
    if (!written) return null
    const d = unwrapDefault(written)
    return partsIn(file).find((p) => p.defaultExport || (d.local !== null && p.local === d.local)) ?? null
  }

  /** What `name`, imported from `file`, really is: follows barrels to the file that writes it. */
  const origin = (file: string, name: string, seen = new Set<string>()): Found | null => {
    if (seen.has(key(file, name))) return null
    seen.add(key(file, name))
    const direct = byKey.get(key(file, name))
    if (direct) return direct
    const f = facts.get(file)
    if (!f) return null
    // `export default Foo` elsewhere in the file: the default is Foo's part.
    if (name === 'default') {
      const d = defaultPartOf(file)
      if (d) return d
    }
    const re = f.reexports.find((r) => r.name === name)
    if (re && re.target && re.target !== '?') return origin(re.target, re.source, seen)
    // `import { X } from './X'` and `export { X }`: a barrel written in two lines.
    const ex = f.exports.find((e) => (name === 'default' ? e.isDefault : e.name === name && !e.isDefault))
    const bound = ex?.local && !ex.node && !declarationOf(f, ex.local) ? f.bindings.get(ex.local) : undefined
    if (bound?.target && bound.target !== '?') return origin(bound.target, bound.imported, seen)
    for (const star of f.starFrom) if (star.target && star.target !== '?') {
      const hit = origin(star.target, name, seen)
      if (hit) return hit
    }
    return null
  }
  /** Every part a file hands out, through its barrels too. */
  const everyPartOf = (file: string, seen = new Set<string>()): Found[] => {
    if (seen.has(file)) return []
    seen.add(file)
    const f = facts.get(file)
    if (!f) return []
    const out = [...partsIn(file)]
    for (const re of f.reexports) if (re.target && re.target !== '?') { const o = origin(re.target, re.source); if (o) out.push(o) }
    for (const star of f.starFrom) if (star.target && star.target !== '?') out.push(...everyPartOf(star.target, seen))
    return out
  }

  const users = new Map<string, { app: Set<string>; stories: Set<string>; tests: Set<string> }>()
  for (const p of found) users.set(key(p.file, p.name), { app: new Set(), stories: new Set(), tests: new Set() })
  for (const f of facts.values()) {
    const bucket = (p: Found) => {
      const u = users.get(key(p.file, p.name))!
      return isStory(f.file) ? u.stories : isTest(f.file) ? u.tests : u.app
    }
    for (const link of f.links) {
      if (link.kind === 're-export' || link.typeOnly || !link.target || link.target === '?') continue
      for (const n of link.names) {
        if (n.imported === '*') {
          // `lazy(() => import('./Page'))` loads the default; a namespace may use any.
          const theDefault = link.kind === 'dynamic' ? defaultPartOf(link.target) : null
          const chosen = theDefault ? [theDefault] : everyPartOf(link.target)
          for (const p of chosen) if (p.file !== f.file) bucket(p).add(f.file)
          continue
        }
        const p = origin(link.target, n.imported)
        // A file that imports a part only to export it again hands it on; it does not use it.
        const handsOn = f.exports.some((e) => e.local === n.local && e.node === null) && !mentions(f.sf, n.local, null)
        if (p && p.file !== f.file && !handsOn) bucket(p).add(f.file)
      }
    }
  }
  // Its own file uses it when something there, other than its own declaration and
  // the export line, names it — a card drawn by the list beside it.
  for (const p of found) {
    if (p.from || !p.local) continue
    const f = facts.get(p.file)!
    const decl = declarationOf(f, p.local)
    const home = decl ? (ts.isVariableDeclaration(decl) ? decl.parent.parent : decl) : null
    if (mentions(f.sf, p.local, home)) users.get(key(p.file, p.name))!.app.add(p.file)
  }

  // ── What ties each file to the app ─────────────────────────────────────
  // A file is tied when it imports a package the package does not itself depend
  // on, something that is not code, or an app file that is tied. Types count: a
  // part typed by Peek's data is Peek's.
  const directTies = new Map<string, string[]>()
  const appDeps = new Map<string, string[]>()
  for (const f of facts.values()) {
    const ties: string[] = []
    const deps: string[] = []
    for (const link of f.links) {
      if (link.target === null) {
        const tie = link.specifier.startsWith('node:') ? link.specifier : allowed.has(packageOf(link.specifier)) ? null : packageOf(link.specifier)
        if (tie && !ties.includes(tie)) ties.push(tie)
      } else if (link.target === '?') {
        if (!ties.includes(link.specifier)) ties.push(link.specifier)
      } else if (link.target !== f.file && !deps.includes(link.target)) deps.push(link.target)
    }
    directTies.set(f.file, ties)
    appDeps.set(f.file, deps)
  }
  const tied = new Set([...directTies].filter(([, t]) => t.length > 0).map(([file]) => file))
  for (let changed = true; changed; ) {
    changed = false
    for (const [file, deps] of appDeps) if (!tied.has(file) && deps.some((d) => tied.has(d))) (tied.add(file), (changed = true))
  }
  const tiesOf = (file: string) => [...directTies.get(file)!, ...appDeps.get(file)!.filter((d) => tied.has(d))].sort()

  // ── Stories: which one shows a part ─────────────────────────────────────
  const stories = files.filter(isStory).map((file) => {
    const f = facts.get(file)!
    let title: string | null = null
    let component: string | null = null
    let noDocs = false
    const names: string[] = []
    for (const s of f.sf.statements) {
      if (!ts.isVariableStatement(s)) continue
      const exported = (ts.getModifiers(s) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      for (const d of s.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue
        if (d.name.text === 'meta') {
          let init = d.initializer
          while (init && (ts.isSatisfiesExpression(init) || ts.isAsExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression
          if (init && ts.isObjectLiteralExpression(init)) {
            for (const prop of init.properties) {
              if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue
              if (prop.name.text === 'title' && ts.isStringLiteralLike(prop.initializer)) title = prop.initializer.text
              if (prop.name.text === 'component' && ts.isIdentifier(prop.initializer)) component = prop.initializer.text
              if (prop.name.text === 'tags' && ts.isArrayLiteralExpression(prop.initializer)) noDocs = prop.initializer.elements.some((e) => ts.isStringLiteralLike(e) && e.text === '!autodocs')
            }
          }
        } else if (exported) names.push(d.name.text)
      }
    }
    // Which part each local name is, through the imports.
    const imported = new Map<string, Found>()
    for (const link of f.links) {
      if (!link.target || link.target === '?') continue
      for (const n of link.names) {
        if (n.imported === '*') continue
        const p = origin(link.target, n.imported)
        if (p) imported.set(n.local, p)
      }
    }
    return { file, title, component: component ? (imported.get(component) ?? null) : null, noDocs, names, imports: [...imported.values()] }
  })
  const storyOf = (p: Found) => {
    const stem = (file: string) => basename(file).replace(/\.stories\.[cm]?[jt]sx?$/, '')
    const own = basename(p.file, extname(p.file))
    const candidates = stories.filter((s) => s.title && s.names.length && (s.component === p || (s.imports.includes(p) && (stem(s.file) === p.name || stem(s.file) === own))))
    candidates.sort((a, b) => Number(b.component === p) - Number(a.component === p) || a.file.localeCompare(b.file))
    const s = candidates[0]
    if (!s || !s.title) return { docsId: null, storyId: null }
    return { docsId: s.noDocs ? null : `${sanitize(s.title)}--docs`, storyId: toId(s.title, s.names.includes(p.name) ? p.name : s.names[0]) }
  }

  // ── Props, read the way the package's are ──────────────────────────────
  type Module = ReturnType<typeof readModule>
  const modules = new Map<string, Module>()
  const moduleAt = (file: string): Module => {
    const held = modules.get(file)
    if (held) return held
    const read = readModule(facts.get(file)!.source, (specifier, typeName): Resolved | undefined => {
      // A wrapper typed by the package's own props takes what the package's part
      // takes. The package names every part's props type after the part —
      // `SearchInputProps` is `SearchInput`'s, all 65 of them — so its entry answers.
      if (specifier === PACKAGE_IMPORT) {
        const part = typeName.endsWith('Props') ? theRegistry?.entries.find((entry) => entry.name === typeName.slice(0, -'Props'.length)) : undefined
        return part ? { props: part.props, variants: part.variants } : undefined
      }
      const target = resolveSpecifier(file, specifier)
      return target && target !== '?' ? moduleAt(target).resolveName(typeName) : undefined
      // A comment directly above a part is that part's, first in its file or not.
    }, { lendFirstComment: false })
    modules.set(file, read)
    return read
  }

  // ── The entries ────────────────────────────────────────────────────────
  const namesakes = new Set((theRegistry?.entries ?? []).map((e) => e.name))
  const importPathOf = (file: string) => {
    const abs = join(app, file)
    const alias = aliases.find((a) => abs.startsWith(a.target + sep))
    const stem = file.replace(/\.[cm]?[jt]sx?$/, '').replace(/\/index$/, '')
    return alias ? `${alias.prefix}${relative(alias.target, join(app, stem)).split(sep).join('/')}` : stem
  }
  const port = /(?:-p|--port)[\s=]+(\d+)/.exec(manifest.scripts?.storybook ?? '')?.[1] ?? '6006'

  const entries: RegistryEntry[] = []
  for (const p of found) {
    const u = users.get(key(p.file, p.name))!
    const usedIn = [...u.app].sort()
    const pass = p.from
    const onePart = partsIn(p.file).filter((q) => !q.from).length === 1
    const module = pass ? null : moduleAt(p.file)
    // A default written as an expression has no name in its file: the builder keeps it as `default`.
    const declared = pass ? undefined : module!.declarations.get(p.local ?? 'default')
    const header = module?.headerDoc ?? ''
    // The file's default may carry its comment on `export default memo(Row)` rather than on Row.
    const doc = declared?.doc || (defaultPartOf(p.file) === p ? (module?.declarations.get('default')?.doc ?? '') : '')

    // Purpose: its page, else its own comment, else — for a file of one part —
    // the file's. A pass-on says whose it is.
    const page = pass ? null : join(dirname(p.file), `${p.name}.mdx`).split(sep).join('/')
    const pageText = page && existsSync(join(app, page)) ? pageOpening(readFileSync(join(app, page), 'utf8')) : ''
    let purpose = ''
    let purposeFrom: RegistryEntry['purposeFrom'] = 'comment'
    if (pass) {
      purpose = pass.specifier === PACKAGE_IMPORT ? `The package's ${pass.name}, handed on so the app can import it from ${importPathOf(p.file)}.` : `${pass.name} from ${pass.specifier}, handed on so the app can import it from ${importPathOf(p.file)}.`
      purposeFrom = 'package'
    } else if (firstSentence(pageText)) {
      purpose = firstSentence(pageText)
      purposeFrom = 'page'
    } else if (firstSentence(doc)) {
      purpose = firstSentence(doc)
    } else if (onePart && firstSentence(header)) {
      purpose = firstSentence(header)
      purposeFrom = 'file'
    }
    if (!purpose) {
      problems.push(`${p.name} in ${p.file} has no one-line description. Write one as a /** … */ comment directly above it${onePart ? ', or at the top of the file' : ''}.`)
      continue
    }

    // Its kind: written beside it, or read from the evidence.
    const writtenLine = WRITTEN.exec(doc) ?? (onePart ? WRITTEN.exec(header) : null)
    const ties = pass ? [] : tiesOf(p.file)
    let cls: EntryClass
    let reason: string
    let written = false
    if (pass) {
      cls = 're-export'
      reason = `Its file only hands on ${pass.specifier === PACKAGE_IMPORT ? `the package's ${pass.name}` : `${pass.name} from ${pass.specifier}`}.`
      if (writtenLine) problems.push(`${p.name} in ${p.file} is a pass-on, so its kind is read from the file: remove "@registry ${writtenLine[1]}"`)
    } else if (writtenLine) {
      const said = writtenLine[1] as EntryClass
      if (!WRITABLE.includes(said)) {
        problems.push(`${p.name} in ${p.file} says "@registry ${writtenLine[1]}": the kinds a person may write are ${WRITABLE.join(', ')}`)
        continue
      }
      cls = said
      reason = writtenLine[2].trim()
      written = true
    } else if (usedIn.length === 0) {
      cls = 'unused'
      reason = u.stories.size ? 'No file of the app uses it; only its stories do.' : u.tests.size ? 'No file of the app uses it; only its tests do.' : 'Nothing uses it.'
    } else if (usedIn.length === 1) {
      cls = 'one-off'
      reason = `Used in one place: ${usedIn[0]}.`
    } else if (ties.length) {
      cls = 'reusable'
      reason = `Used in ${usedIn.length} places, and tied to the app by ${ties[0]}${ties.length > 1 ? ` and ${ties.length - 1} more` : ''}.`
    } else {
      cls = 'promote-candidate'
      reason = `Used in ${usedIn.length} places, and everything it uses is already in the package.`
    }

    const shape: Resolved = declared ? module!.resolve(declared.propsType) : { props: [], variants: [] }
    const facts_: AppFacts = {
      class: cls,
      reason,
      written,
      handsOn: pass ? (pass.specifier === PACKAGE_IMPORT ? pass.name : `${pass.name} from ${pass.specifier}`) : null,
      usedIn,
      tiedTo: ties,
      packageNamesake: namesakes.has(p.name) && !(pass && pass.specifier === PACKAGE_IMPORT && pass.name === p.name) ? p.name : null,
      defaultExport: p.defaultExport,
    }
    const { docsId, storyId } = pass ? { docsId: null, storyId: null } : storyOf(p)
    entries.push({
      name: p.name,
      repo: repoName,
      kind: 'component',
      importPath: importPathOf(p.file),
      sourceFile: p.file,
      purpose,
      purposeFrom,
      props: shape.props,
      variants: shape.variants,
      ownsBehaviours: [],
      status: declared?.deprecated ? 'deprecated' : 'stable',
      migrationStage: null,
      docsId,
      storyId,
      docPage: pageText ? page : null,
      app: facts_,
    })
  }

  if (problems.length) throw new Error(`the catalogue of ${repoName} cannot be built:\n  ${problems.join('\n  ')}`)

  entries.sort((a, b) => a.name.localeCompare(b.name) || a.sourceFile.localeCompare(b.sourceFile))
  const withParts = new Set(found.map((p) => p.file))
  const filesWithoutParts: FileWithoutPart[] = targets
    .filter((file) => !withParts.has(file))
    .map((file) => {
      const f = facts.get(file)!
      const names = [...f.exports.map((e) => (e.isDefault ? (e.local ?? 'a default') : e.name)), ...f.reexports.map((r) => r.name)]
      return { file, reason: names.length ? `It exports no part, only ${names.join(', ')}.` : 'It exports nothing.' }
    })

  return {
    schemaVersion: SCHEMA_VERSION,
    builtFrom: {
      kind: 'app',
      repo: repoName,
      package: manifest.name ?? repoName,
      packageVersion: manifest.version ?? '0.0.0',
      exports: found.length,
      typeExports: 0,
      files: targets.length,
    },
    storybook: {
      docsPath: '/?path=/docs/{docsId}',
      storyPath: '/?path=/story/{storyId}',
      devUrl: `http://localhost:${port}`,
    },
    entries,
    excluded: [],
    filesWithoutParts,
  }
}
