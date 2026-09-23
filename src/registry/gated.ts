/**
 * What a part draws only when a prop is passed, and no story passes it (UIG-19,
 * Katerina's ruling 5).
 *
 * `{onReply && <IconButton … />}` works in the app, because the app passes
 * `onReply`. In Storybook nothing does, so the button is simply not there. It
 * reads as a broken behaviour rather than a missing fixture, and it hides the
 * very state a reviewer came to see. UIG-17 found five in Peek by hand: Reply on
 * ConversationCard, Edit and Delete on ReplyCard, Rename and Copy link on
 * TopicMoreMenu, Open original on ThreadPanel.
 *
 * Read with TypeScript, part by part. The gate is looked for only inside the
 * part's own function (and its `…View` half, when the stories draw that),
 * because a file is not a component: UIG-17's first scan blamed ReplyCard for
 * two props that belong to a menu declared beside it. A story passes a prop by
 * naming it in an `args` object or as an attribute on the part's tag, anywhere
 * in a story file that imports the part's file.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import ts from 'typescript'
import type { Registry } from './schema'

export interface GatedFinding {
  part: string
  file: string
  prop: string
  /** The part or view whose body holds the gate. */
  in: string
}

const parse = (file: string, text: string) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

/** The function a name is declared as: `function X`, `const X = (…) =>`, `memo(…)`, `forwardRef(…)`. */
function declared(sf: ts.SourceFile, name: string): ts.FunctionLikeDeclaration | null {
  let found: ts.FunctionLikeDeclaration | null = null
  const unwrap = (e: ts.Expression | undefined): ts.FunctionLikeDeclaration | null => {
    if (!e) return null
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return e
    if (ts.isCallExpression(e)) return unwrap(e.arguments[0])
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) return unwrap(e.expression)
    return null
  }
  for (const s of sf.statements) {
    if (ts.isFunctionDeclaration(s) && s.name?.text === name) found = s
    if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) found = unwrap(d.initializer)
  }
  return found
}

/** The props a function takes, by the name its body uses: `{ onReply, owner: who }` → onReply→onReply, who→owner. */
function propsOf(fn: ts.FunctionLikeDeclaration): { locals: Map<string, string>; object: string | null } {
  const locals = new Map<string, string>()
  const first = fn.parameters[0]
  if (!first) return { locals, object: null }
  if (ts.isObjectBindingPattern(first.name)) {
    for (const el of first.name.elements) {
      if (el.dotDotDotToken || !ts.isIdentifier(el.name)) continue
      const prop = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : el.name.text
      locals.set(el.name.text, prop)
    }
    return { locals, object: null }
  }
  return { locals, object: ts.isIdentifier(first.name) ? first.name.text : null }
}

const drawsJsx = (node: ts.Node): boolean => {
  let yes = false
  const walk = (n: ts.Node) => {
    if (yes) return
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) yes = true
    else ts.forEachChild(n, walk)
  }
  walk(node)
  return yes
}

/** Every prop that gates something drawn: `{p && <X/>}`, `{p ? <X/> : null}`, `{!!p && …}`, `{p != null && …}`. */
function gates(fn: ts.FunctionLikeDeclaration): Set<string> {
  const { locals, object } = propsOf(fn)
  const out = new Set<string>()
  const propIn = (e: ts.Expression): string | null => {
    while (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e)) e = e.expression
    if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken && ts.isPrefixUnaryExpression(e.operand)) return propIn(e.operand.operand)
    if (ts.isBinaryExpression(e) && [ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(e.operatorToken.kind)) return propIn(e.left)
    if (ts.isIdentifier(e)) return locals.get(e.text) ?? null
    if (object && ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === object) return e.name.text
    return null
  }
  const walk = (n: ts.Node) => {
    // A function declared inside is its own component or handler: not this part's markup.
    if (n !== fn && ts.isFunctionDeclaration(n)) return
    if (ts.isJsxExpression(n) && n.expression) {
      const e = n.expression
      if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && drawsJsx(e.right)) {
        const p = propIn(e.left)
        if (p) out.add(p)
      }
      if (ts.isConditionalExpression(e) && drawsJsx(e.whenTrue) && !drawsJsx(e.whenFalse)) {
        const p = propIn(e.condition)
        if (p) out.add(p)
      }
    }
    ts.forEachChild(n, walk)
  }
  if (fn.body) walk(fn.body)
  return out
}

/** Stands for "every prop": a spread the reader cannot open might pass any of them. */
const ANY = '*'

/**
 * Every prop name a story file passes: keys of any `args` object, and
 * attributes on the named tags. A spread of an object declared in the same
 * file is opened (`args: { replyCount: 3, ...replyRow }`); one it cannot open
 * — an import, a call — counts as passing everything, so the check stays quiet
 * rather than wrong.
 */
function passed(sf: ts.SourceFile, tags: string[]): Set<string> {
  const out = new Set<string>()
  const consts = new Map<string, ts.ObjectLiteralExpression>()
  for (const s of sf.statements) {
    if (!ts.isVariableStatement(s)) continue
    for (const d of s.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer && ts.isObjectLiteralExpression(d.initializer)) consts.set(d.name.text, d.initializer)
  }
  const keysOf = (o: ts.ObjectLiteralExpression, seen: Set<string>) => {
    for (const p of o.properties) {
      if (ts.isSpreadAssignment(p)) {
        // `...replyRow`, or another story's args: `...Topic.args`.
        const e = p.expression
        const name = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.name.text === 'args' ? `${e.expression.text}.args` : null
        let target: ts.ObjectLiteralExpression | undefined
        if (name && !seen.has(name)) {
          if (!name.endsWith('.args')) target = consts.get(name)
          else {
            const story = consts.get(name.slice(0, -'.args'.length))
            const args = story?.properties.find((q) => ts.isPropertyAssignment(q) && ts.isIdentifier(q.name) && q.name.text === 'args')
            if (args && ts.isPropertyAssignment(args) && ts.isObjectLiteralExpression(args.initializer)) target = args.initializer
          }
        }
        if (target) keysOf(target, new Set([...seen, name!]))
        else out.add(ANY)
      } else if (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) out.add(p.name.text)
    }
  }
  const walk = (n: ts.Node) => {
    if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name) && n.name.text === 'args') {
      if (ts.isObjectLiteralExpression(n.initializer)) keysOf(n.initializer, new Set())
      else out.add(ANY)
    }
    if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && tags.includes(n.tagName.getText(sf))) {
      for (const a of n.attributes.properties) {
        if (ts.isJsxAttribute(a)) out.add(a.name.getText(sf))
        else if (ts.isJsxSpreadAttribute(a)) {
          const target = ts.isIdentifier(a.expression) ? consts.get(a.expression.text) : undefined
          if (target) keysOf(target, new Set())
          // `{...args}` hands on what `args` holds, and those are read where they are written.
          else if (!(ts.isIdentifier(a.expression) && a.expression.text === 'args')) out.add(ANY)
        }
      }
    }
    ts.forEachChild(n, walk)
  }
  walk(sf)
  return out
}

function storyFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (/\.stories\.tsx?$/.test(name)) out.push(path)
    }
  }
  if (existsSync(join(root, 'src'))) walk(join(root, 'src'))
  return out
}

/** The props a part hands straight on to another tag: `<QuickActions onReply={onReply} />` → QuickActions, onReply, onReply. */
function handsOn(fn: ts.FunctionLikeDeclaration, sf: ts.SourceFile): { tag: string; attr: string; prop: string }[] {
  const { locals, object } = propsOf(fn)
  const out: { tag: string; attr: string; prop: string }[] = []
  const walk = (n: ts.Node) => {
    if (n !== fn && ts.isFunctionDeclaration(n)) return
    if (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) {
      const tag = n.tagName.getText(sf)
      if (/^[A-Z]/.test(tag)) {
        for (const a of n.attributes.properties) {
          if (!ts.isJsxAttribute(a) || !a.initializer || !ts.isJsxExpression(a.initializer) || !a.initializer.expression) continue
          const e = a.initializer.expression
          const prop = ts.isIdentifier(e) ? locals.get(e.text) : object && ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === object ? e.name.text : undefined
          if (prop) out.push({ tag, attr: a.name.getText(sf), prop })
        }
      }
    }
    ts.forEachChild(n, walk)
  }
  if (fn.body) walk(fn.body)
  return out
}

/** Where a module specifier points, without its extension: `./X`, or Vite's `@/` for `src/`. */
function target(from: string, spec: string, root: string): string | null {
  if (spec.startsWith('.')) return join(dirname(from), spec).replace(/\.[jt]sx?$/, '')
  if (spec.startsWith('@/')) return join(root, 'src', spec.slice(2)).replace(/\.[jt]sx?$/, '')
  return null
}

/**
 * Every prop that gates something a part draws, where some story draws the
 * part and none of those stories passes the prop.
 *
 * "Draws the part" means a story file imports the part's own file — its own
 * stories, or an umbrella sheet such as Peek's Overlays/Menus, which is how
 * TopicMoreMenu lost Rename and Copy link. A gate a part only hands on counts
 * as its own: ConversationCard hands `onReply` to the strip that draws Reply,
 * so a ConversationCard story that never passes it shows no Reply. Followed
 * three parts deep at most.
 */
export interface GatedOptions {
  /** The classes checked. The contract's by default. */
  kinds?: readonly string[]
  /**
   * `own`: a part's own stories show everything it can draw — ConversationCard's
   * stories must show Reply. `anywhere`: a handed-on gate counts as shown when
   * the part it is handed to has a story that shows it. Katerina rules which.
   */
  pictured?: 'own' | 'anywhere'
}

export function gatedFindings(registry: Registry, root: string, { kinds = ['reusable', 'promote-candidate'], pictured = 'own' }: GatedOptions = {}): GatedFinding[] {
  const findings: GatedFinding[] = []
  const stories = storyFiles(root).map((file) => ({ file, sf: parse(file, readFileSync(file, 'utf8')) }))
  const sources = new Map<string, ts.SourceFile>()
  const sourceOf = (rel: string): ts.SourceFile | null => {
    const path = join(root, rel)
    if (!sources.has(path)) {
      if (!existsSync(path)) return null
      sources.set(path, parse(path, readFileSync(path, 'utf8')))
    }
    return sources.get(path)!
  }
  const fileOf = new Map(registry.entries.filter((e) => e.kind === 'component').map((e) => [e.name, e.sourceFile]))

  /** The story files that import a file, and every prop they pass to the part or its view. */
  const givenTo = new Map<string, { drawn: boolean; given: Set<string> }>()
  const storiesOf = (name: string, rel: string) => {
    const key = `${rel}#${name}`
    if (!givenTo.has(key)) {
      const own = join(root, rel).replace(/\.[jt]sx?$/, '')
      const drawing = stories.filter(({ file, sf: s }) =>
        s.statements.some((st) => ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && target(file, st.moduleSpecifier.text, root) === own),
      )
      givenTo.set(key, { drawn: drawing.length > 0, given: new Set(drawing.flatMap(({ sf: s }) => [...passed(s, [name, `${name}View`])])) })
    }
    return givenTo.get(key)!
  }

  const memo = new Map<string, Set<string>>()
  /** The props a named part gates on, its own and those it hands to a part that gates. */
  const gatesOf = (name: string, sf: ts.SourceFile, depth: number): Set<string> => {
    const key = `${sf.fileName}#${name}`
    if (memo.has(key)) return memo.get(key)!
    memo.set(key, new Set())
    const fn = declared(sf, name)
    const out = fn ? gates(fn) : new Set<string>()
    if (fn && depth < 3) {
      for (const { tag, attr, prop } of handsOn(fn, sf)) {
        // A dialog is shut in a story until someone opens it, so nothing it draws
        // is missing from the picture (Katerina, 23 September).
        if (out.has(prop) || /Dialog$/.test(tag)) continue
        const here = declared(sf, tag) ? sf : fileOf.has(tag) ? sourceOf(fileOf.get(tag)!) : null
        if (!here || !gatesOf(tag, here, depth + 1).has(attr)) continue
        // Already pictured one level down: CollapsibleSection hands `trailing` to
        // SectionHeader, and SectionHeader's own story shows the slot.
        const theirs = fileOf.get(tag)
        if (pictured === 'anywhere' && theirs && here !== sf) {
          const { given } = storiesOf(tag, theirs)
          if (given.has(attr) || given.has(ANY)) continue
        }
        out.add(prop)
      }
    }
    memo.set(key, out)
    return out
  }

  for (const entry of registry.entries) {
    // The package's entries carry no app class: every one of its components is one.
    const cls = entry.app?.class ?? 'component'
    if (!kinds.includes(cls) || entry.kind !== 'component') continue
    const sf = sourceOf(entry.sourceFile)
    if (!sf) continue
    const { drawn, given } = storiesOf(entry.name, entry.sourceFile)
    // No story draws it at all: the contract's "drawn nowhere" says so, not this.
    if (!drawn || given.has(ANY)) continue
    for (const name of [entry.name, `${entry.name}View`]) {
      for (const prop of gatesOf(name, sf, 0)) {
        if (!given.has(prop)) findings.push({ part: entry.name, file: entry.sourceFile.split('\\').join('/'), prop, in: name })
      }
    }
  }
  return findings
}
