/// <reference types="node" />
/**
 * The code under every page's `## How` compiles against the package (UIG-14:
 * "Every How compiles — checked, not assumed"; Katerina's ruling R18, 25
 * September). It was compiled once, by hand, on 19 September, and never again.
 *
 * Each ```tsx block under `## How` becomes a module of its own:
 *
 * 1. Its own `import` lines, verbatim; `'@estiva-app/ui'` is this package's
 *    `src/index.ts`, so a wrong name in an import fails.
 * 2. Every part it did not import, imported (a page shows a part's companions
 *    without their import line).
 * 3. The rest as the body of a component: all JSX, or statements then JSX, or
 *    statements alone, whichever parses.
 * 4. What the page leaves to the reader is a placeholder: a lower-case name or
 *    an ALL_CAPS one is `any`, a React hook comes from React, an `Icon…` from
 *    Tabler. A capitalised name the package does not have is an error — that is
 *    what a wrong part name looks like — except the reader's own stand-ins
 *    below, which the pages name on purpose.
 *
 * Then it is type-checked with the package's own settings. A part name, a prop
 * name and a prop's literal value are checked; a prop given a placeholder is not
 * (a placeholder is `any`).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const REPO = process.cwd()
const norm = (p: string) => p.replace(/\\/g, '/').toLowerCase()

/** The reader's own components a page draws around a part (Katerina's ruling R18: an allow-list). */
const STAND_INS = ['App', 'Conversation', 'ItemDetail', 'ItemRow', 'ListRow', 'Row', 'YourList']
/** Browser globals a page may mean for real; any other lower-case lib.dom name is a placeholder (`name`, `open`). */
const REAL_GLOBALS = new Set(['window', 'document', 'console', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'navigator', 'localStorage', 'sessionStorage', 'globalThis', 'queueMicrotask', 'structuredClone'])

interface Block {
  page: string
  /** The .mdx line of the block's first line of code. */
  start: number
  lines: string[]
}

function howBlocks(page: string, text: string): Block[] {
  const lines = text.split(/\r?\n/)
  const blocks: Block[] = []
  let inHow = false
  let fence: string | null = null
  let start = 0
  let buf: string[] = []
  lines.forEach((line, i) => {
    if (fence !== null) {
      if (/^\s*```\s*$/.test(line)) {
        if (inHow && fence === 'tsx') blocks.push({ page, start, lines: buf })
        fence = null
        buf = []
      } else buf.push(line)
      return
    }
    const open = /^\s*```(\S*)/.exec(line)
    if (open) {
      fence = open[1] || '(none)'
      start = i + 2
      return
    }
    if (/^## /.test(line)) inHow = /^## How\b/.test(line)
  })
  return blocks
}

function indexValueExports(): string[] {
  const sf = ts.createSourceFile('index.ts', readFileSync(join(REPO, 'src/index.ts'), 'utf8'), ts.ScriptTarget.Latest, true)
  const names: string[] = []
  for (const s of sf.statements) {
    if (ts.isExportDeclaration(s) && !s.isTypeOnly && s.exportClause && ts.isNamedExports(s.exportClause)) for (const e of s.exportClause.elements) if (!e.isTypeOnly) names.push(e.name.text)
  }
  return names
}

const require = createRequire(join(REPO, 'package.json'))
const REACT = new Set(Object.keys(require('react') as object))
const TABLER = new Set(Object.keys(require('@tabler/icons-react') as object))
const INDEX = indexValueExports()

function splitImports(lines: string[]) {
  const imports: { text: string; line: number }[] = []
  const body = lines.slice()
  for (let i = 0; i < lines.length; i++) {
    if (!/^import\b/.test(lines[i])) continue
    let j = i
    while (j < lines.length && !/from\s+['"][^'"]+['"]\s*;?\s*$/.test(lines[j]) && !/^import\s+['"]/.test(lines[j])) j++
    imports.push({ text: lines.slice(i, j + 1).join('\n'), line: i })
    for (let k = i; k <= j; k++) body[k] = ''
    i = j
  }
  return { imports, body }
}

function importedNames(imports: { text: string }[]): Set<string> {
  const names = new Set<string>()
  const sf = ts.createSourceFile('i.ts', imports.map((x) => x.text).join('\n'), ts.ScriptTarget.Latest, true)
  for (const s of sf.statements) {
    const c = ts.isImportDeclaration(s) ? s.importClause : undefined
    if (!c) continue
    if (c.name) names.add(c.name.text)
    if (c.namedBindings && ts.isNamedImports(c.namedBindings)) for (const e of c.namedBindings.elements) names.add(e.name.text)
    if (c.namedBindings && ts.isNamespaceImport(c.namedBindings)) names.add(c.namedBindings.name.text)
  }
  return names
}

const jsxComments = (lines: string[]) => lines.map((l) => l.replace(/^\/\/(.*)$/, '{/*$1*/}'))
const parses = (text: string) => (ts.transpileModule(text, { fileName: 'x.tsx', reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX } }).diagnostics ?? []).length === 0

/** All JSX; statements then JSX; statements alone. The first that parses wins. */
function wrappings(body: string[]) {
  const out: { pre: string[]; jsx: string[] | null }[] = [{ pre: [], jsx: body }]
  body.forEach((l, k) => {
    if (k > 0 && /^[<{]/.test(l) && body.slice(0, k).some((x) => x.trim() && !/^\s*\/\//.test(x))) out.push({ pre: body.slice(0, k), jsx: body.slice(k) })
  })
  out.push({ pre: body, jsx: null })
  return out
}

interface Extra {
  react: Set<string>
  tabler: Set<string>
  declared: Set<string>
}

function build(block: Block, extra: Extra): { text: string; map: (number | null)[] } {
  const { imports, body } = splitImports(block.lines)
  const have = importedNames(imports)
  const lines: string[] = []
  const map: (number | null)[] = []
  const push = (text: string, mdx: number | null) => {
    for (const t of text.split('\n')) {
      lines.push(t)
      map.push(mdx)
    }
  }
  for (const imp of imports) imp.text.split('\n').forEach((t, k) => push(t, block.start + imp.line + k))
  const auto = INDEX.filter((n) => !have.has(n))
  if (auto.length) push(`import { ${auto.join(', ')} } from '@estiva-app/ui'`, null)
  const react = [...extra.react].filter((n) => !have.has(n))
  if (react.length) push(`import { ${react.join(', ')} } from 'react'`, null)
  const tabler = [...extra.tabler].filter((n) => !have.has(n))
  if (tabler.length) push(`import { ${tabler.join(', ')} } from '@tabler/icons-react'`, null)
  for (const d of extra.declared) push(`declare const ${d}: any`, null)
  for (const s of STAND_INS) if (!have.has(s)) push(`declare const ${s}: (props: any) => React.JSX.Element`, null)

  for (const w of wrappings(body)) {
    const L = lines.slice()
    const M = map.slice()
    const add = (t: string, mdx: number | null) => {
      L.push(t)
      M.push(mdx)
    }
    add('export function __How() {', null)
    w.pre.forEach((t, k) => add(t, block.start + k))
    if (w.jsx) {
      add('return (<>', null)
      jsxComments(w.jsx).forEach((t, k) => add(t, block.start + w.pre.length + k))
      add('</>)', null)
    }
    add('}', null)
    const text = L.join('\n')
    if (parses(text)) return { text, map: M }
  }
  return { text: `${lines.join('\n')}\nexport function __How() {\n${body.join('\n')}\n}`, map: [...map, null, ...body.map((_, k) => block.start + k), null] }
}

function compilerOptions(): ts.CompilerOptions {
  const raw = ts.parseConfigFileTextToJson('tsconfig.json', readFileSync(join(REPO, 'tsconfig.json'), 'utf8')).config
  const parsed = ts.convertCompilerOptionsFromJson(raw.compilerOptions, REPO)
  // A placeholder is `any`: `people.map((p) => …)` would fail noImplicitAny on `p`,
  // the placeholder's fault, not the page's. A callback prop's parameter keeps the part's type.
  return { ...parsed.options, noEmit: true, noImplicitAny: false, baseUrl: REPO, paths: { '@estiva-app/ui': ['./src/index.ts'] }, types: [] }
}

function makeHost(options: ts.CompilerOptions, virtual: Map<string, string>): ts.CompilerHost {
  const host = ts.createCompilerHost(options, true)
  const read = host.readFile.bind(host)
  const exists = host.fileExists.bind(host)
  host.readFile = (f) => virtual.get(norm(f)) ?? read(f)
  host.fileExists = (f) => virtual.has(norm(f)) || exists(f)
  host.getSourceFile = (f, lang) => {
    const t = host.readFile(f)
    return t === undefined ? undefined : ts.createSourceFile(f, t, lang, true)
  }
  host.getCurrentDirectory = () => REPO
  return host
}

interface Result {
  page: string
  start: number
  errors: { line: number | null; code: number; text: string }[]
}

/** Compile every block, adding placeholders until nothing new is found. */
function compileAll(blocks: Block[]): Result[] {
  const options = compilerOptions()
  const state: Extra[] = blocks.map(() => ({ react: new Set(), tabler: new Set(), declared: new Set() }))
  const fileOf = blocks.map((b) => `${REPO}/src/__how__${b.page.replace(/\W+/g, '_')}_${b.start}.tsx`)
  let program: ts.Program | undefined
  let built: ReturnType<typeof build>[] = []
  for (let round = 0; round < 8; round++) {
    built = blocks.map((b, i) => build(b, state[i]))
    const virtual = new Map(fileOf.map((f, i) => [norm(f), built[i].text]))
    program = ts.createProgram(fileOf, options, makeHost(options, virtual), program)
    const checker = program.getTypeChecker()
    let added = 0
    fileOf.forEach((f, i) => {
      const s = state[i]
      const sf = program!.getSourceFile(f)!
      for (const d of ts.getPreEmitDiagnostics(program!, sf)) {
        if (d.code !== 2304 && d.code !== 2552) continue
        const x = /Cannot find name '([^']+)'/.exec(ts.flattenDiagnosticMessageText(d.messageText, ' '))?.[1]
        if (!x || s.react.has(x) || s.tabler.has(x) || s.declared.has(x)) continue
        if (REACT.has(x)) s.react.add(x)
        else if (/^Icon[A-Z]/.test(x) && TABLER.has(x)) s.tabler.add(x)
        else if (/^[a-z_$]/.test(x) || /^[A-Z][A-Z0-9_]+$/.test(x)) s.declared.add(x)
        else continue
        added++
      }
      // A placeholder that is also a browser global (`name`, `open`) never reports
      // "Cannot find name": it silently takes the global's type. Shadow those too.
      const walk = (node: ts.Node) => {
        if (ts.isIdentifier(node) && built[i].map[sf.getLineAndCharacterOfPosition(node.getStart(sf)).line] != null) {
          const p = node.parent
          const member = (ts.isPropertyAccessExpression(p) && p.name === node) || (ts.isPropertyAssignment(p) && p.name === node) || ts.isJsxAttribute(p)
          const x = node.text
          if (!member && /^[a-z]/.test(x) && !REAL_GLOBALS.has(x) && !s.declared.has(x)) {
            const sym = checker.getSymbolAtLocation(node)
            const decls = sym?.declarations ?? []
            if (sym && decls.length && decls.every((d) => program!.isSourceFileDefaultLibrary(d.getSourceFile())) && sym.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Function)) {
              s.declared.add(x)
              added++
            }
          }
        }
        ts.forEachChild(node, walk)
      }
      walk(sf)
    })
    if (!added) break
  }
  return blocks.map((b, i) => {
    const sf = program!.getSourceFile(fileOf[i])!
    const errors = ts.getPreEmitDiagnostics(program!, sf).filter((d) => d.file === sf).map((d) => ({
      line: built[i].map[sf.getLineAndCharacterOfPosition(d.start ?? 0).line] ?? null,
      code: d.code,
      text: ts.flattenDiagnosticMessageText(d.messageText, ' '),
    }))
    return { page: b.page, start: b.start, errors }
  })
}

const pages = readdirSync(join(REPO, 'src')).filter((f) => f.endsWith('.mdx')).sort()
const blocks = pages.flatMap((f) => howBlocks(`src/${f}`, readFileSync(join(REPO, 'src', f), 'utf8')))

describe('the code under How', () => {
  it('compiles on every page, and goes red on a wrong part, prop, value or import', { timeout: 120_000 }, () => {
    expect(blocks.length).toBeGreaterThan(50)
    const button = blocks.find((b) => b.page === 'src/Button.mdx')!
    const broken = (name: string, change: (line: string) => string) => ({ ...button, page: `src/BROKEN-${name}.mdx`, lines: button.lines.map(change) })
    const probes = [
      broken('part', (l) => l.replace('<Button ', '<Buton ').replace('</Button>', '</Buton>')),
      broken('prop', (l) => l.replace('variant="primary"', 'varient="primary"')),
      broken('value', (l) => l.replace('variant="primary"', 'variant="big"')),
      broken('import', (l) => l.replace('import { Button }', 'import { Buton }')),
    ]
    const results = compileAll([...blocks, ...probes])
    const shown = (r: Result) => r.errors.map((e) => `${r.page}:${e.line ?? '?'} TS${e.code} ${e.text}`)
    expect(results.slice(0, blocks.length).flatMap(shown)).toEqual([])
    // Each broken copy must fail, or the check proves nothing.
    for (const r of results.slice(blocks.length)) expect(r.errors.length, r.page).toBeGreaterThan(0)
  })
})
