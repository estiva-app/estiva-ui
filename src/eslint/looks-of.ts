import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import ts from 'typescript'

/**
 * What a component looks like, read from its source: every class list it
 * writes (UIG-25). Shared by the catalogue, which records each part's looks in
 * `registry.json`, and by `estiva/no-copied-look`, which compares a class list
 * typed by hand against them — so the two always mean the same thing by "look".
 *
 * A class list is read wherever it is written: a `className` (or any
 * `…ClassName`), through `cn()`/`clsx()`, a ternary, a `&&`, a template, a
 * `const` in the file, or a class map indexed by a key; and every string that
 * is a class list on its own. A constant imported from another file is not
 * followed: a look written once and imported is not a copy.
 *
 * Only the **look words** count — colour, text, border, corner, shadow.
 * Placement (where it sits, how much room it takes) is everyone's and says
 * nothing about which part a list is copied from.
 */

/** Where a thing sits and how much room it takes: never part of a look (the same list as `no-restyled-part`'s PLACEMENT). */
const PLACEMENT = [
  /^m[xytrblse]?-/,
  /^p[xytrblse]?-/,
  /^(?:w|h|size|min-w|min-h|max-w|max-h)-/,
  /^(?:hidden|block|inline|inline-block|inline-flex|inline-grid|flex|grid|contents|flow-root)$/,
  /^(?:grow|shrink)$|^(?:flex|basis|grow|shrink|order|gap|gap-x|gap-y|space-x|space-y|col|row|grid-cols|grid-rows|grid-flow|auto-cols|auto-rows)-/,
  /^(?:self|justify|justify-items|justify-self|items|place-content|place-items|place-self)-|^content-(?!\[)/,
  /^(?:static|relative|absolute|fixed|sticky)$|^(?:inset|inset-x|inset-y|top|right|bottom|left|start|end|z)-/,
  /^(?:group|peer)(?:\/[\w-]+)?$/,
]
const bare = (token: string) => token.replace(/^(?:[^:\s[\]]+:)+/, '')
export const isPlacementWord = (token: string) => PLACEMENT.some((pattern) => pattern.test(bare(token)))

/** A word that could be a Tailwind class: lower case, dashes, variants, arbitrary values. */
const CLASSY = /^!?(?:[a-z0-9-]+:|\[[^\]\s]+\]:)*-?[a-z@][a-z0-9-]*(?:-\[[^\]\s]+\]|\/[\w.[\]-]+|-[\w.]+)*$|^\[[^\]\s]+\]$/
const words = (text: string) => text.split(/\s+/).filter(Boolean)
const CLASS_FUNCTIONS = new Set(['cn', 'clsx', 'cx', 'twMerge', 'classNames'])
const CLASS_PROP = /^(?:className|[a-z][A-Za-z]*ClassName)$/

/** A string is a class list on its own when every word could be a class, and two at least have a dash or a variant. */
function isClassList(text: string): boolean {
  const list = words(text)
  return list.length >= 3 && list.every((w) => CLASSY.test(w)) && list.filter((w) => /[-:[]/.test(w)).length >= 2
}

export interface ClassUnit {
  /** Every class of the list, placement included, as written. */
  tokens: string[]
  /** Its look words only. */
  look: string[]
  /** Offsets in the file, for a report. */
  start: number
  end: number
  /** A `className` (resolved through the file), or a string that is a class list on its own. */
  via: 'attribute' | 'literal'
  /** Where an escape for it is read: the element a `className` is on, or the string itself. */
  anchor: number
  /** The value of an exported `…_CLASSES` constant: a shared look, where it is written once. */
  shared: boolean
}

const CAP = 24

/**
 * Every class list a file writes. `follow` resolves a name the file imports,
 * for a part's own look: what it draws includes a look it takes from a shared
 * file. A list being checked is never followed — using a shared look is not
 * copying it.
 */
export function classUnits(source: ts.SourceFile, follow?: (name: string) => ts.Expression | undefined): ClassUnit[] {
  const consts = new Map<string, ts.Expression>()
  const collect = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isVariableDeclarationList(node.parent) && node.parent.flags & ts.NodeFlags.Const) {
      consts.set(node.name.text, node.initializer)
    }
    ts.forEachChild(node, collect)
  }
  collect(source)

  const product = (lists: string[][][]): string[][] => {
    let out: string[][] = [[]]
    for (const alternatives of lists) {
      const next: string[][] = []
      for (const a of out) for (const b of alternatives) if (next.length < CAP) next.push([...a, ...b])
      out = next
    }
    return out
  }
  const resolve = (node: ts.Node | undefined, depth = 0): string[][] => {
    if (!node || depth > 8) return [[]]
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [words(node.text)]
    if (ts.isTemplateExpression(node)) return product([[words(node.head.text)], ...node.templateSpans.flatMap((span) => [resolve(span.expression, depth + 1), [words(span.literal.text)]])])
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node)) return resolve(node.expression, depth + 1)
    if (ts.isJsxExpression(node)) return resolve(node.expression, depth + 1)
    if (ts.isCallExpression(node)) return ts.isIdentifier(node.expression) && CLASS_FUNCTIONS.has(node.expression.text) ? product(node.arguments.map((a) => resolve(a, depth + 1))) : [[]]
    if (ts.isConditionalExpression(node)) return [...resolve(node.whenTrue, depth + 1), ...resolve(node.whenFalse, depth + 1)].slice(0, CAP)
    if (ts.isBinaryExpression(node)) {
      // Off first: a look is the part at rest, with each option taken one at a time, never all at once.
      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return [[], ...resolve(node.right, depth + 1)]
      if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken || node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) return [...resolve(node.left, depth + 1), ...resolve(node.right, depth + 1)].slice(0, CAP)
      return [[]]
    }
    if (ts.isArrayLiteralExpression(node)) return product(node.elements.map((e) => resolve(e, depth + 1)))
    if (ts.isObjectLiteralExpression(node)) return [[], node.properties.flatMap((p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? words(p.name.text) : []))]
    if (ts.isIdentifier(node)) {
      const init = consts.get(node.text) ?? follow?.(node.text)
      return init ? resolve(init, depth + 1) : [[]]
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      let target: ts.Expression | undefined = node.expression
      if (ts.isIdentifier(target)) target = consts.get(target.text) ?? follow?.(target.text)
      while (target && (ts.isAsExpression(target) || ts.isSatisfiesExpression(target) || ts.isParenthesizedExpression(target))) target = target.expression
      if (!target || !ts.isObjectLiteralExpression(target)) return [[]]
      const key = ts.isPropertyAccessExpression(node) ? node.name.text : ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : null
      return target.properties
        .filter((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && (key === null || (!!p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === key)))
        .flatMap((p) => resolve(p.initializer, depth + 1))
        .slice(0, CAP)
    }
    return [[]]
  }

  const units: ClassUnit[] = []
  const seen = new Set<string>()
  const sharedAt = (node: ts.Node) => {
    for (let at: ts.Node | undefined = node; at; at = at.parent) {
      if (ts.isVariableDeclaration(at)) return ts.isIdentifier(at.name) && /_CLASSES$/.test(at.name.text) && !!at.parent?.parent && ts.isVariableStatement(at.parent.parent) && !!at.parent.parent.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    }
    return false
  }
  // A string's escape is read above the line it starts: the widest thing that starts on that line.
  const lineStart = (node: ts.Node) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line
    let at = node
    while (at.parent && !ts.isSourceFile(at.parent) && source.getLineAndCharacterOfPosition(at.parent.getStart(source)).line === line) at = at.parent
    return at.getStart(source)
  }
  const add = (tokens: string[], node: ts.Node, via: ClassUnit['via'], anchor = via === 'literal' ? lineStart(node) : node.getStart(source)) => {
    const list = [...new Set(tokens.filter((t) => CLASSY.test(t)))]
    const look = list.filter((t) => !isPlacementWord(t))
    if (look.length === 0) return
    const key = `${via}:${node.getStart(source)}:${[...list].sort().join(' ')}`
    if (seen.has(key)) return
    seen.add(key)
    units.push({ tokens: list, look, start: node.getStart(source), end: node.getEnd(), via, anchor, shared: via === 'literal' && sharedAt(node) })
  }
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && CLASS_PROP.test(node.name.text) && node.initializer) {
      // An escape goes on the line above the element, as it does for every rule of the plugin.
      const element = node.parent.parent
      for (const alternative of resolve(node.initializer)) add(alternative, node, 'attribute', element.getStart(source))
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isClassList(node.text)) add(words(node.text), node, 'literal')
    ts.forEachChild(node, visit)
  }
  visit(source)
  return units
}

/** The function components a file declares, by name, with where each one's body is. */
export function componentsOf(source: ts.SourceFile): Map<string, { start: number; end: number }> {
  const found = new Map<string, { start: number; end: number }>()
  const fn = (node: ts.Expression | undefined): ts.Node | undefined => {
    let current = node
    while (current && ts.isCallExpression(current) && current.arguments.length) current = current.arguments[0]
    return current && (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) ? current : undefined
  }
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && /^[A-Z]/.test(statement.name.text)) found.set(statement.name.text, { start: statement.getStart(source), end: statement.getEnd() })
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const body = fn(declaration.initializer)
        if (ts.isIdentifier(declaration.name) && /^[A-Z]/.test(declaration.name.text) && body) found.set(declaration.name.text, { start: body.getStart(source), end: body.getEnd() })
      }
    }
  }
  return found
}

/** A look is worth comparing when it has this many look words at least: fewer is a text style, not a part. */
export const MIN_LOOK_WORDS = 4

/**
 * Each named component's looks: its class lists' look words, one space-joined
 * string per list, those with `MIN_LOOK_WORDS` or more. A list written outside
 * every component of the file (a top-level constant, a class map) belongs to
 * every component in it.
 */
export function looksOf(source: ts.SourceFile, names?: Iterable<string>): Map<string, string[]> {
  const components = componentsOf(source)
  const units = classUnits(source, importedConstants(source)).filter((u) => u.look.length >= MIN_LOOK_WORDS)
  const inside = (u: ClassUnit, r: { start: number; end: number }) => u.start >= r.start && u.start < r.end
  const out = new Map<string, string[]>()
  for (const name of names ?? components.keys()) {
    const range = components.get(name)
    const mine = units.filter((u) => (range ? inside(u, range) : false) || ![...components.values()].some((r) => inside(u, r)))
    out.set(name, [...new Set(mine.map((u) => u.look.join(' ')))])
  }
  return out
}

/** Read and parse a file for looks. */
export function parseForLooks(fileName: string, text: string): ts.SourceFile {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}

/** How much of a look a class list must share to be a copy of it (UIG-25, Katerina 24 September). */
export const MIN_SHARED = 4
export const MIN_COVER = 0.8

/** The look words a list shares with a look, when it is a copy of it; otherwise null. */
export function copies(list: string[], look: string[]): string[] | null {
  const mine = new Set(list)
  const shared = look.filter((word) => mine.has(word))
  if (shared.length < MIN_SHARED) return null
  return shared.length / Math.min(list.length, look.length) >= MIN_COVER ? shared : null
}

/** The file a relative or `@/` import names, from the file that imports it. */
function importTarget(fromFile: string, specifier: string): string | null {
  let base: string
  if (specifier.startsWith('.')) base = resolvePath(dirname(fromFile), specifier)
  else if (specifier.startsWith('@/')) {
    let dir = dirname(resolvePath(fromFile))
    while (!existsSync(join(dir, 'package.json')) && dirname(dir) !== dir) dir = dirname(dir)
    base = join(dir, 'src', specifier.slice(2))
  } else return null
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) if (existsSync(candidate)) return candidate
  return null
}

const constantsCache = new Map<string, Map<string, ts.Expression>>()
/** A file's top-level `const`s, by name. */
function constantsOf(file: string): Map<string, ts.Expression> {
  const cached = constantsCache.get(file)
  if (cached) return cached
  const found = new Map<string, ts.Expression>()
  const source = parseForLooks(file, readFileSync(file, 'utf8'))
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) found.set(d.name.text, d.initializer)
  }
  constantsCache.set(file, found)
  return found
}

/** A resolver for the class constants a file imports from its own repo: `FIELD_BOX_CLASSES` from `./looks`. */
export function importedConstants(source: ts.SourceFile): (name: string) => ts.Expression | undefined {
  const imported = new Map<string, { file: string; name: string }>()
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    const target = importTarget(source.fileName, statement.moduleSpecifier.text)
    if (!target) continue
    for (const element of bindings.elements) {
      const local = element.name.text
      if (/_CLASSES$/.test(element.propertyName?.text ?? local)) imported.set(local, { file: target, name: element.propertyName?.text ?? local })
    }
  }
  return (name) => {
    const from = imported.get(name)
    if (!from) return undefined
    try {
      return constantsOf(from.file).get(from.name)
    } catch {
      return undefined
    }
  }
}

/**
 * The shared looks a file declares: each exported `…_CLASSES` constant, a string
 * or a map of strings, by name (`FIELD_SIZE_CLASSES.small`). A hand-typed copy of
 * one is told to use it.
 */
export function sharedLooksOf(source: ts.SourceFile): Map<string, string[]> {
  const out = new Map<string, string[]>()
  const lookWords = (text: string) => words(text).filter((w) => CLASSY.test(w) && !isPlacementWord(w))
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const d of statement.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !/_CLASSES$/.test(d.name.text) || !d.initializer) continue
      let init: ts.Expression = d.initializer
      while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression
      if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
        const look = lookWords(init.text)
        if (look.length >= MIN_LOOK_WORDS) out.set(d.name.text, [look.join(' ')])
      } else if (ts.isObjectLiteralExpression(init)) {
        for (const p of init.properties) {
          if (!ts.isPropertyAssignment(p) || !p.name || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) continue
          if (!(ts.isStringLiteral(p.initializer) || ts.isNoSubstitutionTemplateLiteral(p.initializer))) continue
          const look = lookWords(p.initializer.text)
          if (look.length >= MIN_LOOK_WORDS) out.set(`${d.name.text}.${p.name.text}`, [look.join(' ')])
        }
      }
    }
  }
  return out
}
