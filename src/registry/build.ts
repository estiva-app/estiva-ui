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
  /** The name this registry's entries are recorded under. One repo per registry until UIG-13. */
  repo?: string
}

/** One name as `index.ts` exports it. */
interface RawExport {
  name: string
  /** The sibling it comes from, without `./`. */
  module: string
  isType: boolean
}

/** What the parser found above and about one exported declaration. */
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

const PACKAGE_IMPORT = '@estiva-app/ui'

/**
 * Storybook's own `sanitize`, which is what turns a title and a story's export
 * name into the id in the URL. Copied rather than imported: `storybook` is a
 * dev dependency of this repo and must not become a runtime dependency of the
 * builder, which apps run. A test holds this to the ids a real Storybook build
 * produces.
 */
function sanitize(name: string): string {
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

const toId = (title: string, name: string) => `${sanitize(title)}--${sanitize(storyNameFromExport(name))}`

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
  // with a blank line or another statement between them is about something else.
  const between = source.slice(jsdoc.end, node.getStart())
  if (between.trim() !== '') return ''
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
function firstSentence(prose: string): string {
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
function pageOpening(mdx: string): string {
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

/** Everything one sibling file says about the names it exports. */
function readModule(source: string) {
  const file = ts.createSourceFile('module.tsx', source, ts.ScriptTarget.Latest, true)
  const declarations = new Map<string, Declared>()
  const aliases = new Map<string, ts.TypeNode>()
  const shapes = new Map<string, ts.TypeElement[]>()

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

  // The file's header comment: the first `/**` above the first thing that is
  // not an import. It belongs to the file, whatever export happens to follow it.
  const opening = file.statements.find((statement) => !ts.isImportDeclaration(statement))
  const headerPos = opening ? ((ts.getLeadingCommentRanges(source, opening.getFullStart()) ?? []).find((range) => source.slice(range.pos, range.pos + 3) === '/**')?.pos ?? null) : null

  for (const statement of file.statements) {
    if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement.type)
    if (ts.isInterfaceDeclaration(statement)) shapes.set(statement.name.text, [...statement.members])
    if (ts.isTypeAliasDeclaration(statement) && ts.isTypeLiteralNode(statement.type)) shapes.set(statement.name.text, [...statement.type.members])

    const exported = ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!exported) continue
    const doc = docAbove(source, statement, headerPos)
    const deprecated = /(^|\n)@deprecated\b/.test(doc) || /\*\s*@deprecated\b/.test(source.slice(Math.max(0, statement.getFullStart()), statement.getStart()))

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, { doc, deprecated, propsType: propsTypeOf(statement.parameters) })
      continue
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        declarations.set(declaration.name.text, { doc, deprecated, propsType: propsOfInitializer(declaration.initializer) })
      }
    }
  }

  /**
   * The properties a parameter's type has, however it was written: an interface
   * by name, `Omit<…>` of one, an intersection of both, or — `SectionLabel`,
   * `SkeletonRow` and others — the shape written out at the parameter itself.
   * Reading only named types missed `SectionLabel`'s `tone`, found in the
   * ten-entry spot check.
   */
  const membersOf = (type: ts.TypeNode, depth = 0): ts.TypeElement[] | undefined => {
    if (depth > 4) return undefined
    if (ts.isTypeLiteralNode(type)) return [...type.members]
    if (ts.isIntersectionTypeNode(type)) {
      const sides = type.types.flatMap((side) => membersOf(side, depth + 1) ?? [])
      return sides.length ? sides : undefined
    }
    if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
      const named = type.typeName.text
      // `Omit<ButtonProps, 'x'>` and `Pick<…>`: the shape is the first argument.
      if (named === 'Omit' || named === 'Pick') {
        const first = type.typeArguments?.[0]
        return first ? membersOf(first, depth + 1) : undefined
      }
      return shapes.get(named)
    }
    return undefined
  }

  /**
   * What a prop takes, in a word a person reads. The type as written is the
   * fallback, not the answer: `(next: string) => void` tells a reader nothing
   * they cannot guess, and "a handler" tells them what to pass.
   */
  const takes = (type: ts.TypeNode | undefined): string => {
    if (!type) return 'anything'
    const values = literalUnion(type, aliases)
    if (values) return values.join(' | ')
    const written = type.getText(file).replace(/\s+/g, ' ').trim()
    if (written === 'boolean') return 'true/false'
    if (written === 'number') return 'number'
    if (written === 'string') return 'text'
    if (/^React(Node|Element)\b/.test(written) || written === 'ReactNode') return 'anything'
    if (written.includes('=>')) return 'a handler'
    return written.length > 60 ? `${written.slice(0, 57)}…` : written
  }

  const propsOf = (propsType: ts.TypeNode | undefined): EntryProp[] => {
    const members = propsType ? membersOf(propsType) : undefined
    if (!members) return []
    const props: EntryProp[] = []
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) continue
      const note = firstSentence(docAbove(source, member))
      props.push({ name: member.name.text, takes: takes(member.type), required: !member.questionToken, note: note || null })
    }
    return props
  }

  /** The word-choice props, structured — a view of `propsOf`, never a second reading. */
  const variantsOf = (propsType: ts.TypeNode | undefined): EntryVariant[] => {
    const members = propsType ? membersOf(propsType) : undefined
    if (!members) return []
    const variants: EntryVariant[] = []
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) continue
      const values = literalUnion(member.type, aliases)
      if (values) variants.push({ prop: member.name.text, values })
    }
    return variants
  }

  return { declarations, propsOf, variantsOf }
}

/** The `title` a stories file gives Storybook, and the stories it exports. */
function readStories(source: string): { title: string | null; stories: string[] } {
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

  const modules = new Map<string, ReturnType<typeof readModule> & { file: string }>()
  const moduleOf = (name: string) => {
    const held = modules.get(name)
    if (held) return held
    const file = ['.tsx', '.ts'].map((extension) => `${name}${extension}`).find((candidate) => files.has(candidate))
    if (!file) throw new Error(`src/index.ts exports from './${name}', which is not a file in src/`)
    const read = { ...readModule(readFileSync(join(src, file), 'utf8')), file: `src/${file}` }
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

    entries.push({
      name: value.name,
      repo,
      kind: kindOf(value.name),
      importPath: PACKAGE_IMPORT,
      sourceFile: module.file,
      purpose,
      purposeFrom: fromPage ? 'page' : 'comment',
      props: module.propsOf(declared.propsType),
      variants: module.variantsOf(declared.propsType),
      ownsBehaviours: behavioursOf(value.name),
      status: declared.deprecated ? 'deprecated' : 'stable',
      migrationStage: null,
      docsId: title ? `${sanitize(title)}--docs` : null,
      storyId: title && story ? toId(title, story) : null,
      docPage: pageFile,
    })
  }

  if (problems.length) throw new Error(`the registry cannot be built:\n  ${problems.join('\n  ')}`)

  entries.sort((a, b) => a.name.localeCompare(b.name))

  return {
    schemaVersion: SCHEMA_VERSION,
    builtFrom: {
      repo,
      package: manifest.name,
      packageVersion: manifest.version,
      exports: values.length,
      typeExports: exported.length - values.length,
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
  }
}

/** The committed file's text, so a check and a write produce the same bytes. */
export function serializeRegistry(registry: Registry): string {
  return `${JSON.stringify(registry, null, 2)}\n`
}
