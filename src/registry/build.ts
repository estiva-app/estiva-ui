/// <reference types="node" />
/**
 * The catalogue's builder (UIG-12): it reads the code and writes
 * `registry.json`. Nothing here is kept by hand, and CI rebuilds it and fails
 * on a difference, so the file cannot drift from what it describes.
 *
 * **Why a parser and not a regex.** This package's components are flat in
 * `src/`, with `.tsx`, `.mdx`, `.stories.tsx` and sometimes `.test.tsx` side by
 * side, and **a file is not a component**: eleven files export more than one
 * name — `Menu.tsx` alone exports seven — and `Skeleton.tsx` exports no
 * `Skeleton` at all. Pairing by filename gets `FieldLine`, `MenuItem` and every
 * one of those wrong. The target set is what `src/index.ts` exports, read with
 * TypeScript's own parser, and everything else is looked up from there.
 *
 * TypeScript is the app's own install, as it is for the gate pieces
 * (`build.mjs`): every package this names stays external.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { OWNED_BEHAVIOURS } from '../eslint/index'
import { SCHEMA_VERSION, type EntryBehaviour, type EntryKind, type EntryProp, type EntryVariant, type Registry, type RegistryEntry } from './schema'

export interface BuildOptions {
  /** The repository's top folder. */
  root?: string
  /** The name this registry's entries are recorded under. */
  repo?: string
}

/** One name as `index.ts` exports it. */
interface RawExport {
  name: string
  /** The sibling it comes from, without `./`. */
  module: string
  isType: boolean
}

/** What the parser found above and about one top-level declaration. */
interface Declared {
  /** The doc comment, cleaned, or `''`. */
  doc: string
  deprecated: boolean
  /**
   * Its first parameter's type, as written. Kept as the node and resolved after
   * the whole file is walked: a props interface is often declared *below* the
   * component that takes it.
   */
  propsType?: ts.TypeNode
}

export const PACKAGE_IMPORT = '@estiva-app/ui'

/**
 * Storybook's own `sanitize`, which is what turns a title and a story's export
 * name into the id in the URL. Copied rather than imported: `storybook` is a
 * dev dependency of this repo and must not become a runtime dependency of the
 * builder, which apps run. A test holds this to the ids a real Storybook build
 * produces.
 */
export function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Storybook's `storyNameFromExport`, which is lodash's `startCase`: an export
 * called `WithCounts` is the story "With Counts", and its id is
 * `navigation-tabs--with-counts`, not `--withcounts`.
 *
 * Measured against a real `storybook build` (2026-09-18): without this, 11 of
 * the 81 ids resolved nowhere — every export whose name is more than one word.
 * Written out rather than pulled from lodash or `@storybook/csf`, neither of
 * which may become a runtime dependency of a builder that apps run.
 */
function storyNameFromExport(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export const toId = (title: string, name: string) => `${sanitize(title)}--${sanitize(storyNameFromExport(name))}`

/** Read `src/index.ts`. Its `export { … } from './Sibling'` statements are the target set. */
export function readIndexExports(source: string): RawExport[] {
  const file = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true)
  const found: RawExport[] = []
  for (const statement of file.statements) {
    if (!ts.isExportDeclaration(statement)) continue
    const from = statement.moduleSpecifier
    const clause = statement.exportClause
    if (!from || !ts.isStringLiteral(from) || !clause || !ts.isNamedExports(clause)) continue
    for (const element of clause.elements) {
      found.push({ name: element.name.text, module: from.text.replace(/^\.\//, ''), isType: statement.isTypeOnly || element.isTypeOnly })
    }
  }
  return found
}

/**
 * The doc comment immediately above a declaration, cleaned of its markers.
 * `''` when there is none.
 *
 * `headerPos` is where the **file's** own header comment starts, and a
 * declaration never gets to claim it. Measured: `Skeleton.tsx` opens with a
 * paragraph about the whole family and `export function SkeletonBar` follows it
 * directly, so the bar was given the family's description — right-looking, and
 * wrong. Refusing it turns that into a build failure with the export's name in
 * it, which is a line somebody then writes.
 */
function docAbove(source: string, node: ts.Node, headerPos: number | null = null): string {
  const ranges = ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []
  const jsdoc = ranges.filter((range) => source.slice(range.pos, range.pos + 3) === '/**').pop()
  if (!jsdoc) return ''
  if (headerPos !== null && jsdoc.pos === headerPos) return ''
  // Only a comment that sits against the declaration describes it: anything
  // with another statement between them is about something else. A `//` line
  // between is still its own — the written note an escape needs sits there, and
  // TypeScript attaches the doc comment through it too.
  const between = source.slice(jsdoc.end, node.getStart())
  if (between.replace(/\/\/[^\n]*/g, '').trim() !== '') return ''
  return source
    .slice(jsdoc.pos, jsdoc.end)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\/\*\*/, '').replace(/\*\/$/, '').replace(/^\*/, '').trim())
    .join('\n')
    .trim()
}

/**
 * The first sentence of a block of prose, which is the purpose.
 *
 * A sentence ends at `.`, `!` or `?` followed by a space and something that
 * starts a new one. A very short first sentence takes the next as well —
 * "A list of actions from a trigger." is a purpose; "One row, two parts." is
 * not, on its own.
 */
export function firstSentence(prose: string): string {
  const flat = prose
    .split(/\n\s*\n/)[0]
    .split('\n')
    .filter((line) => !line.trim().startsWith('@'))
    .join(' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = flat.split(/(?<=[.!?])\s+(?=[A-Z`'"‘“])/)
  let line = parts[0] ?? ''
  if (line.length < 40 && parts[1]) line = `${line} ${parts[1]}`
  return line.trim()
}

/** A page's opening paragraph: everything between its `# Heading` and the first blank line. */
export function pageOpening(mdx: string): string {
  const lines = mdx.split(/\r?\n/)
  const heading = lines.findIndex((line) => /^#\s+\S/.test(line))
  if (heading < 0) return ''
  const paragraph: string[] = []
  for (const line of lines.slice(heading + 1)) {
    const text = line.trim()
    if (text === '') {
      if (paragraph.length) break
      continue
    }
    // A canvas, an import or the next heading: the opening paragraph is over,
    // or there never was one.
    if (text.startsWith('<') || text.startsWith('#')) break
    paragraph.push(text)
  }
  return paragraph.join(' ')
}

/**
 * A property's name, however it is written.
 *
 * **A quoted name is a name.** `'aria-label'?: string` cannot be written as an
 * identifier, so a reader that takes identifiers only drops it — and with it
 * every accessible name this package declares. Found by comparing against
 * `react-docgen`, a parser with none of this one's assumptions: 13 props over
 * 10 files, two of them required (`Reaction`, `Toolbar`).
 */
function propName(member: ts.TypeElement): string | null {
  if (!member.name) return null
  if (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) return member.name.text
  return null
}

/** A union of string literals, following one local type alias if the property points at one. */
function literalUnion(type: ts.TypeNode | undefined, aliases: Map<string, ts.TypeNode>, seen = new Set<string>()): string[] | null {
  if (!type) return null
  if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
    const name = type.typeName.text
    if (seen.has(name)) return null
    seen.add(name)
    const alias = aliases.get(name)
    return alias ? literalUnion(alias, aliases, seen) : null
  }
  if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) return [type.literal.text]
  if (!ts.isUnionTypeNode(type)) return null
  const values: string[] = []
  for (const member of type.types) {
    // `'small' | 'default' | undefined` is still a set of two words.
    if (member.kind === ts.SyntaxKind.UndefinedKeyword || member.kind === ts.SyntaxKind.NullKeyword) continue
    const inner = literalUnion(member, aliases, seen)
    if (!inner) return null
    values.push(...inner)
  }
  return values.length > 1 ? values : null
}

/** A type’s finished props and word-choices, read by the module that declares them. */
export interface Resolved {
  props: EntryProp[]
  variants: EntryVariant[]
}

/**
 * Ask another file for a type it declares, already resolved. `specifier` is the
 * import as written (`./IconButton`, `@/lib/types`); the caller decides what it
 * points at, and answers `undefined` for anything outside the library it reads.
 */
export type Sibling = (specifier: string, typeName: string) => Resolved | undefined

export interface ReadOptions {
  /**
   * Whether a file with no comment of its own at the top lends the comment on
   * its first declaration to the file. The package: yes — `Skeleton.tsx`'s
   * family paragraph sits there, and taking it as `SkeletonBar`'s was wrong. An
   * app: no — a comment directly above a part is that part's, which is what a
   * person writing one expects; a file's own goes at the very top.
   */
  lendFirstComment?: boolean
}

export function readModule(source: string, sibling: Sibling = () => undefined, { lendFirstComment = true }: ReadOptions = {}) {
  const file = ts.createSourceFile('module.tsx', source, ts.ScriptTarget.Latest, true)
  const declarations = new Map<string, Declared>()
  const aliases = new Map<string, ts.TypeNode>()
  const shapes = new Map<string, ts.TypeElement[]>()
  /** What each interface extends, as written — `Omit<IdentityMenuProps, 'compact'>` and all. */
  const bases = new Map<string, ts.ExpressionWithTypeArguments[]>()
  /** Which module each imported name came from. */
  const importedFrom = new Map<string, { specifier: string; imported: string }>()

  const propsTypeOf = (parameters: readonly ts.ParameterDeclaration[]): ts.TypeNode | undefined => parameters[0]?.type

  /**
   * The props type of `const X = …`.
   *
   * A plain function expression carries it on its first parameter. `forwardRef`
   * carries it as its **second type argument** and leaves the inner function's
   * parameter bare — `TextInput`, whose `size` was missed until this read it.
   */
  const propsOfInitializer = (initializer: ts.Expression | undefined): ts.TypeNode | undefined => {
    if (!initializer) return undefined
    if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) return propsTypeOf(initializer.parameters)
    if (ts.isCallExpression(initializer)) {
      const callee = ts.isPropertyAccessExpression(initializer.expression) ? initializer.expression.name.text : ts.isIdentifier(initializer.expression) ? initializer.expression.text : ''
      if (callee === 'forwardRef' && initializer.typeArguments?.[1]) return initializer.typeArguments[1]
      // `memo(function X({ … }: Props) { … })` and anything else that wraps a
      // function written out at the call.
      const wrapped = initializer.arguments.find((argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))
      if (wrapped) return propsTypeOf((wrapped as ts.ArrowFunction | ts.FunctionExpression).parameters)
    }
    return undefined
  }

  /**
   * `const Row: FC<RowProps> = ({ … }) => …` leaves the parameter bare: the
   * props are the annotation's type argument — `FC`, `FunctionComponent`,
   * `React.FC`, `React.FunctionComponent`.
   */
  const propsOfAnnotation = (type: ts.TypeNode | undefined): ts.TypeNode | undefined => {
    if (!type || !ts.isTypeReferenceNode(type)) return undefined
    const named = ts.isIdentifier(type.typeName) ? type.typeName.text : type.typeName.right.text
    return named === 'FC' || named === 'FunctionComponent' ? type.typeArguments?.[0] : undefined
  }

  // The file's header comment: the first `/**` above the first thing that is
  // not an import. It belongs to the file, whatever export happens to follow it.
  const opening = file.statements.find((statement) => !ts.isImportDeclaration(statement))
  const headerPos = opening ? ((ts.getLeadingCommentRanges(source, opening.getFullStart()) ?? []).find((range) => source.slice(range.pos, range.pos + 3) === '/**')?.pos ?? null) : null
  // A file that opens with its own comment, above its imports — Peek's and Ship's
  // way — has its header there, so the comment on its first declaration is that
  // declaration's own. Only a file with no such comment lends the first one it has.
  const topPos = file.statements[0] ? ((ts.getLeadingCommentRanges(source, file.statements[0].getFullStart()) ?? []).find((range) => source.slice(range.pos, range.pos + 3) === '/**')?.pos ?? null) : null
  // An app lends no comment to the file but one above its imports: in a file
  // with no imports the first comment sits on the first part, and is the part's.
  const aboveImports = !!file.statements[0] && ts.isImportDeclaration(file.statements[0])
  const refused = lendFirstComment ? (topPos ?? headerPos) : aboveImports ? topPos : null

  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) importedFrom.set(element.name.text, { specifier: statement.moduleSpecifier.text, imported: (element.propertyName ?? element.name).text })
      }
    }
    // `export type { TopicRowProps } from './TopicRow'` hands a type on without
    // declaring it: a file that asks this one for it is sent on to the next.
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) importedFrom.set(element.name.text, { specifier: statement.moduleSpecifier.text, imported: (element.propertyName ?? element.name).text })
    }
    if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement.type)
    if (ts.isInterfaceDeclaration(statement)) {
      shapes.set(statement.name.text, [...statement.members])
      // The whole clause, not its name: `extends Omit<IdentityMenuProps,
      // 'compact'>` reads as the name `Omit` and loses both the type it wraps
      // and the key it drops.
      const extended = (statement.heritageClauses ?? []).flatMap((clause) => [...clause.types])
      if (extended.length) bases.set(statement.name.text, extended)
    }
    if (ts.isTypeAliasDeclaration(statement) && ts.isTypeLiteralNode(statement.type)) shapes.set(statement.name.text, [...statement.type.members])

    // Every top-level function, class and constant, exported or not. The package
    // exports at the declaration, so for it the two are the same; an app also
    // writes `function Row() {…}` and `export { Row }` or `export default Row`
    // further down, and the name is still read here, with its comment and props.
    if (ts.isClassDeclaration(statement)) {
      // `class ErrorBoundary extends Component<Props, State>`: its props are the
      // first type argument of what it extends. `export default class extends …`
      // has no name of its own, and is kept under `default`.
      const base = (statement.heritageClauses ?? []).find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]
      const name = statement.name?.text ?? (ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ? 'default' : null)
      if (name) declarations.set(name, { doc: docAbove(source, statement, refused), deprecated: false, propsType: base?.typeArguments?.[0] })
      continue
    }
    // `export default memo(() => …)` and `export default function () {…}`: a part
    // an app writes as its file's default, with no name of its own. Kept under
    // `default`, with its comment and its props.
    if (ts.isExportAssignment(statement) && !statement.isExportEquals && !ts.isIdentifier(statement.expression)) {
      declarations.set('default', { doc: docAbove(source, statement, refused), deprecated: false, propsType: propsOfInitializer(statement.expression) })
      continue
    }
    if (ts.isFunctionDeclaration(statement) && !statement.name && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
      declarations.set('default', { doc: docAbove(source, statement, refused), deprecated: false, propsType: propsTypeOf(statement.parameters) })
      continue
    }
    if (!ts.isFunctionDeclaration(statement) && !ts.isVariableStatement(statement)) continue
    const doc = docAbove(source, statement, refused)
    const deprecated = /(^|\n)@deprecated\b/.test(doc) || /\*\s*@deprecated\b/.test(source.slice(Math.max(0, statement.getFullStart()), statement.getStart()))

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      // Overloads: the first signature carries the comment and the props a caller
      // sees; a later one, or the body, only fills in a comment the first lacks.
      const held = declarations.get(statement.name.text)
      if (held) {
        if (!held.doc && doc) held.doc = doc
        continue
      }
      declarations.set(statement.name.text, { doc, deprecated, propsType: propsTypeOf(statement.parameters) })
      continue
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        declarations.set(declaration.name.text, { doc, deprecated, propsType: propsOfInitializer(declaration.initializer) ?? propsOfAnnotation(declaration.type) })
      }
    }
  }
  /**
   * A type's props and its word-choices, **resolved in the file that declares
   * them**.
   *
   * This is the whole shape of the thing, and the reason for it is a bug that
   * looked like nothing: a `ts.TypeElement` carries positions into *its own*
   * source text, so handing a sibling's node to this file's `getText`, `aliases`
   * and `docAbove` reads the wrong file at those offsets. `ToolbarButton` came
   * out with `variant: "ats over what it a"` and `children: "omeAndEndK"` —
   * real prop names, and slices of another file for their types. Nothing caught
   * it: the names were right, and the cross-check against `react-docgen`
   * compared names.
   *
   * So a sibling never returns nodes. It returns finished props, read by the
   * module that owns them, and this file only merges them.
   */
  const EMPTY: Resolved = { props: [], variants: [] }

  /** The keys named by an `Omit`/`Pick` argument: `'a'` or `'a' | 'b'`. */
  const keysOf = (type: ts.TypeNode | undefined): string[] | null => {
    if (!type) return null
    if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) return [type.literal.text]
    if (!ts.isUnionTypeNode(type)) return null
    const keys: string[] = []
    for (const member of type.types) {
      if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) return null
      keys.push(member.literal.text)
    }
    return keys
  }

  /** `Omit` drops the keys it names, `Pick` keeps only them. Unreadable keys change nothing. */
  const narrow = (resolved: Resolved, how: 'Omit' | 'Pick', keys: string[] | null): Resolved => {
    if (!keys) return resolved
    const named = new Set(keys)
    const keep = (name: string) => (how === 'Omit' ? !named.has(name) : named.has(name))
    return { props: resolved.props.filter((prop) => keep(prop.name)), variants: resolved.variants.filter((variant) => keep(variant.prop)) }
  }

  /** The first of each name wins, so what a type declares itself beats what it inherits. */
  const merge = (parts: Resolved[]): Resolved => {
    const props: EntryProp[] = []
    const variants: EntryVariant[] = []
    const seenProp = new Set<string>()
    const seenVariant = new Set<string>()
    for (const part of parts) {
      for (const prop of part.props) if (!seenProp.has(prop.name)) (seenProp.add(prop.name), props.push(prop))
      for (const variant of part.variants) if (!seenVariant.has(variant.prop)) (seenVariant.add(variant.prop), variants.push(variant))
    }
    return { props, variants }
  }

  /**
   * What a prop takes, in a word a person reads. The type as written is the
   * fallback, not the answer: `(next: string) => void` tells a reader nothing
   * they cannot guess, and "a handler" tells them what to pass.
   */
  const takes = (type: ts.TypeNode | undefined, values: string[] | null): string => {
    if (values) return values.join(' | ')
    if (!type) return 'anything'
    const written = type.getText(file).replace(/\s+/g, ' ').trim()
    if (written === 'boolean') return 'true/false'
    if (written === 'number') return 'number'
    if (written === 'string') return 'text'
    if (/^React(Node|Element)\b/.test(written)) return 'anything'
    if (written.includes('=>')) return 'a handler'
    return written.length > 60 ? `${written.slice(0, 57)}…` : written
  }

  /** Members of this file, read with this file's text and aliases. */
  const fromMembers = (members: readonly ts.TypeElement[]): Resolved => {
    const props: EntryProp[] = []
    const variants: EntryVariant[] = []
    for (const member of members) {
      const name = propName(member)
      if (name === null || !ts.isPropertySignature(member)) continue
      const values = literalUnion(member.type, aliases)
      const note = firstSentence(docAbove(source, member))
      props.push({ name, takes: takes(member.type, values), required: !member.questionToken, note: note || null })
      if (values) variants.push({ prop: name, values })
    }
    return { props, variants }
  }

  const resolveNode = (type: ts.TypeNode | undefined, seen: Set<string>): Resolved => {
    if (!type || seen.size > 12) return EMPTY
    // `{ tone?: 'primary' | 'secondary' }` written out at the parameter.
    if (ts.isTypeLiteralNode(type)) return fromMembers(type.members)
    if (ts.isIntersectionTypeNode(type)) return merge(type.types.map((side) => resolveNode(side, seen)))
    if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
      const named = type.typeName.text
      if (named === 'Omit' || named === 'Pick') {
        return narrow(resolveNode(type.typeArguments?.[0], seen), named, keysOf(type.typeArguments?.[1]))
      }
      return resolveName(named, seen)
    }
    return EMPTY
  }

  /** A heritage clause is not a `TypeNode`, and carries the same `Omit<…>` shapes. */
  const resolveBase = (base: ts.ExpressionWithTypeArguments, seen: Set<string>): Resolved => {
    if (!ts.isIdentifier(base.expression)) return EMPTY
    const named = base.expression.text
    if (named === 'Omit' || named === 'Pick') {
      return narrow(resolveNode(base.typeArguments?.[0], seen), named, keysOf(base.typeArguments?.[1]))
    }
    return resolveName(named, seen)
  }

  /**
   * A named type: its own props, plus everything it extends **within this
   * package**.
   *
   * It stops at React and Base UI on purpose. `ToolbarButtonProps extends
   * IconButtonProps` is ours, and `variant`, `pressed` and `tooltip` are things
   * `ToolbarButton` genuinely takes; `ButtonProps extends
   * ComponentPropsWithRef<'button'>` is the DOM, and listing `onCopy` and
   * `spellCheck` would bury the answer. The rule is where the type is declared,
   * not what it is called.
   */
  function resolveName(name: string, seen: Set<string>): Resolved {
    if (seen.has(name) || seen.size > 12) return EMPTY
    seen.add(name)
    const own = shapes.get(name)
    if (own) {
      const inherited = (bases.get(name) ?? []).map((base) => resolveBase(base, seen))
      return merge([fromMembers(own), ...inherited])
    }
    // `type ToolbarInputProps = TextInputProps` — an alias, not an interface.
    const alias = aliases.get(name)
    if (alias) return resolveNode(alias, seen)
    // Not declared here at all. Follow the import; the caller says where it may go.
    const from = importedFrom.get(name)
    return (from ? sibling(from.specifier, from.imported) : undefined) ?? EMPTY
  }

  /** What one declaration's first parameter takes. */
  const resolve = (propsType: ts.TypeNode | undefined): Resolved => resolveNode(propsType, new Set())

  // The file's own description, for an app's file of one part: the first `/**`
  // at the very top, above the imports — where Peek and Ship write it — or else
  // the one directly above the first thing that is not an import.
  const jsdocAt = (node: ts.Node | undefined) => (node ? (ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []).find((range) => source.slice(range.pos, range.pos + 3) === '/**') : undefined)
  const headerRange = jsdocAt(file.statements[0]) ?? jsdocAt(opening)
  return { declarations, headerDoc: headerRange ? headerComment(source, headerRange) : '', resolve, resolveName: (name: string) => resolveName(name, new Set()) }
}

/** The file's own header comment, cleaned the way `docAbove` cleans a declaration's. */
function headerComment(source: string, range: ts.CommentRange): string {
  return source
    .slice(range.pos, range.end)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\/\*\*/, '').replace(/\*\/$/, '').replace(/^\*/, '').trim())
    .join('\n')
    .trim()
}

/** The `title` a stories file gives Storybook, and the stories it exports. */
export function readStories(source: string): { title: string | null; stories: string[] } {
  const file = ts.createSourceFile('x.stories.tsx', source, ts.ScriptTarget.Latest, true)
  let title: string | null = null
  const stories: string[] = []
  for (const statement of file.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        const initializer = declaration.initializer
        const object = initializer && ts.isSatisfiesExpression(initializer) ? initializer.expression : initializer
        if (declaration.name.text === 'meta' && object && ts.isObjectLiteralExpression(object)) {
          for (const property of object.properties) {
            if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === 'title' && ts.isStringLiteral(property.initializer)) {
              title = property.initializer.text
            }
          }
        }
        const exported = ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        if (exported && declaration.name.text !== 'meta') stories.push(declaration.name.text)
      }
    }
  }
  return { title, stories }
}

const isAllCaps = (name: string) => /^[A-Z0-9_]+$/.test(name)

/** What a name is. A constant and a function are both helpers; only a `use…` is a hook. */
function kindOf(name: string): EntryKind {
  if (/^use[A-Z]/.test(name)) return 'hook'
  return /^[A-Z]/.test(name) && !isAllCaps(name) ? 'component' : 'helper'
}

/** What UIG-8's enumeration says this component owns. */
function behavioursOf(name: string): EntryBehaviour[] {
  return OWNED_BEHAVIOURS.filter((owned) => owned.owners.includes(name)).map((owned) => ({ id: owned.id, behaviour: owned.behaviour }))
}

/**
 * Read the repository and return the catalogue.
 *
 * Throws on anything it cannot explain — a missing sibling, a name with no
 * purpose anywhere. A registry that quietly drops what it could not read is
 * worse than no registry, because a reader cannot tell the difference between
 * "we have nothing for that" and "the builder gave up".
 */
export function buildRegistry({ root = process.cwd(), repo = 'estiva-ui' }: BuildOptions = {}): Registry {
  const src = join(root, 'src')
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string; version: string }
  const files = new Set(readdirSync(src))
  const exported = readIndexExports(readFileSync(join(src, 'index.ts'), 'utf8'))
  const values = exported.filter((entry) => !entry.isType)

  type Module = ReturnType<typeof readModule> & { file: string }
  const modules = new Map<string, Module>()
  const moduleOf = (name: string): Module => {
    const held = modules.get(name)
    if (held) return held
    const file = ['.tsx', '.ts'].map((extension) => `${name}${extension}`).find((candidate) => files.has(candidate))
    if (!file) throw new Error(`src/index.ts exports from './${name}', which is not a file in src/`)
    // The callback lets one file's props type reach a type declared in another
    // — `ToolbarButtonProps extends IconButtonProps`. It is only called later,
    // by which time this module is in the cache, so the recursion terminates.
    const read = { ...readModule(readFileSync(join(src, file), 'utf8'), (specifier, typeName) => (specifier.startsWith('./') ? moduleOf(specifier.slice(2)).resolveName(typeName) : undefined)), file: `src/${file}` }
    modules.set(name, read)
    return read
  }

  const problems: string[] = []
  const entries: RegistryEntry[] = []

  for (const value of values) {
    const module = moduleOf(value.module)
    const declared = module.declarations.get(value.name)
    if (!declared) {
      problems.push(`${value.name} is exported from './${value.module}' but is not declared there`)
      continue
    }

    // A name with a page of its own takes its purpose from the page; the rest
    // are documented on a sibling's page, and take it from the comment above
    // the export. Every one of them has one — the build fails below if not.
    const pageFile = files.has(`${value.name}.mdx`) ? `src/${value.name}.mdx` : null
    const fromPage = pageFile ? firstSentence(pageOpening(readFileSync(join(root, pageFile), 'utf8'))) : ''
    const fromComment = firstSentence(declared.doc)
    const purpose = fromPage || fromComment
    if (!purpose) {
      problems.push(`${value.name} has no purpose: no opening paragraph on its page, and no doc comment above it in ${module.file}`)
      continue
    }

    // A name with stories of its own uses them; otherwise the sibling's, which
    // is the page that documents it.
    const storiesFile = files.has(`${value.name}.stories.tsx`) ? `${value.name}.stories.tsx` : files.has(`${value.module}.stories.tsx`) ? `${value.module}.stories.tsx` : null
    const stories = storiesFile ? readStories(readFileSync(join(src, storiesFile), 'utf8')) : { title: null, stories: [] }
    const title = stories.title
    const story = stories.stories.includes(value.name) ? value.name : stories.stories[0]

    const shape = module.resolve(declared.propsType)

    entries.push({
      name: value.name,
      repo,
      kind: kindOf(value.name),
      importPath: PACKAGE_IMPORT,
      sourceFile: module.file,
      purpose,
      purposeFrom: fromPage ? 'page' : 'comment',
      props: shape.props,
      variants: shape.variants,
      ownsBehaviours: behavioursOf(value.name),
      status: declared.deprecated ? 'deprecated' : 'stable',
      migrationStage: null,
      docsId: title ? `${sanitize(title)}--docs` : null,
      storyId: title && story ? toId(title, story) : null,
      docPage: pageFile,
      app: null,
    })
  }

  if (problems.length) throw new Error(`the registry cannot be built:\n  ${problems.join('\n  ')}`)

  entries.sort((a, b) => a.name.localeCompare(b.name))

  return {
    schemaVersion: SCHEMA_VERSION,
    builtFrom: {
      kind: 'package',
      repo,
      package: manifest.name,
      packageVersion: manifest.version,
      exports: values.length,
      typeExports: exported.length - values.length,
      files: null,
    },
    storybook: {
      docsPath: '/?path=/docs/{docsId}',
      storyPath: '/?path=/story/{storyId}',
      devUrl: 'http://localhost:6008',
    },
    entries,
    // Nothing is excluded: every value export is an entry, helpers and the one
    // hook included, each marked by `kind`. The field stays because the count
    // has to reconcile out loud — see validateRegistry.
    excluded: [],
    filesWithoutParts: [],
  }
}

/** The committed file's text, so a check and a write produce the same bytes. */
export function serializeRegistry(registry: Registry): string {
  return `${JSON.stringify(registry, null, 2)}\n`
}
