import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { Rule, Scope } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

/**
 * A part of the package is placed from outside, never restyled (UIG-9; Katerina's
 * ruling B8 of 13 September, "only position and spacing pass into our
 * components").
 *
 * Every part takes `className`, and some take a second class prop for an inner
 * box (`contentClassName`, `bodyClassName`…). Through either, an app could push
 * a colour, a text size or a border into a part and quietly undo it: the token
 * lint only asks whether a class is a real token, never whether the part should
 * take it. This rule reads every class passed into a part and lets through only
 * placement — where the part sits and how much room it takes.
 *
 * **Which elements are parts: by where they come from, never by name.** No list
 * of names is kept, so a part added to the package later is covered the day it
 * is added.
 *
 * - In an app: anything imported from `@estiva-app/ui`, and anything imported
 *   from the app's own files that is one of those — a re-export (Peek's
 *   `components/ui/Button.tsx`), a wrapper that hands its props on to a part
 *   (`{...rest}`), or a component that hands its own `className` on to a part
 *   (Peek's `ConversationCard` into `Card`). Relative imports and the apps' `@/`
 *   alias are followed; `@/` is the `src` folder beside the nearest
 *   `package.json`.
 * - Inside the package (Katerina, 17 September): a name `src/index.ts` exports,
 *   imported from a sibling file or declared in the same file.
 *
 * **What it reads:** a string, a template, `cn()`/`clsx()` and their arguments,
 * both sides of a condition, a `const` in the same file and the values of a
 * class map read from one. A class the code works out while it runs passes: the
 * rule cannot read it.
 *
 * `EmptyState` takes no padding either (Katerina's ruling 6 of 14 September):
 * its room comes from the box its rows live in.
 */

// ---------------------------------------------------------------- the classes

/** Where a part sits and how much room it takes. Read on the utility, after its variants. */
export const PLACEMENT: { what: string; pattern: RegExp }[] = [
  { what: 'space around', pattern: /^m[xytrblse]?-/ },
  { what: 'space inside', pattern: /^p[xytrblse]?-/ },
  { what: 'width and height', pattern: /^(?:w|h|size|min-w|min-h|max-w|max-h)-/ },
  { what: 'shown, and how it lays out', pattern: /^(?:hidden|block|inline|inline-block|inline-flex|inline-grid|flex|grid|contents|flow-root)$/ },
  { what: 'its place in a row or a grid', pattern: /^(?:grow|shrink)$|^(?:flex|basis|grow|shrink|order|gap|gap-x|gap-y|space-x|space-y|col|row|grid-cols|grid-rows|grid-flow|auto-cols|auto-rows)-/ },
  { what: 'alignment', pattern: /^(?:self|justify|justify-items|justify-self|items|place-content|place-items|place-self)-|^content-(?!\[)/ },
  { what: 'position', pattern: /^(?:static|relative|absolute|fixed|sticky)$|^(?:inset|inset-x|inset-y|top|right|bottom|left|start|end|z)-/ },
  // Draws nothing: it names the part, so what is inside can answer its hover (`group-hover:`).
  { what: 'a name for hover', pattern: /^(?:group|peer)(?:\/[\w-]+)?$/ },
]

/**
 * A variant that draws another box or reaches inside the part: `before:`,
 * `after:`, `[&>*]:`, `*:`… A placement class behind one of these is not the
 * part's placement.
 */
const REACHING_VARIANT = /^\[|^(?:before|after|placeholder|file|marker|selection|first-letter|first-line|backdrop|\*|\*\*)$/

/** A class list's variants and its utility: `sm:[&>*]:shrink-0` → `['sm', '[&>*]']`, `shrink-0`. */
export function splitClass(token: string): { variants: string[]; utility: string } {
  const variants: string[] = []
  let current = ''
  let depth = 0
  for (const character of token) {
    if (character === '[') depth += 1
    if (character === ']') depth -= 1
    if (character === ':' && depth === 0) {
      variants.push(current)
      current = ''
    } else current += character
  }
  return { variants, utility: current.replace(/^!/, '').replace(/!$/, '').replace(/^-/, '') }
}

/** Whether a class only places the part. */
export function isPlacement(token: string): boolean {
  const { variants, utility } = splitClass(token)
  if (variants.some((variant) => REACHING_VARIANT.test(variant))) return false
  return PLACEMENT.some(({ pattern }) => pattern.test(utility))
}

const isPadding = (token: string) => {
  const { variants, utility } = splitClass(token)
  return !variants.some((variant) => REACHING_VARIANT.test(variant)) && /^p[xytrblse]?-/.test(utility)
}

/**
 * The props a part has for how it looks, named in the message. Held to the
 * package's source by `no-restyled-part.test.ts`: every prop here exists, and
 * every look prop an exported part has is here. A part missing from this table
 * has none, and the message says to ask for one.
 */
export const PART_LOOK_PROPS: Record<string, string[]> = {
  AppShell: ['variant'],
  Avatar: ['size'],
  AvatarGroup: ['size'],
  Banner: ['tone'],
  Button: ['variant', 'size'],
  Card: ['fill', 'hover', 'attention', 'selected', 'active', 'hovered', 'quietUntilHover', 'unreadable', 'clip'],
  Checkbox: ['row'],
  Chip: ['type'],
  Divider: ['tone', 'orientation'],
  EmptyState: ['scope'],
  FieldLine: ['tone'],
  IconButton: ['variant', 'pressed', 'glow'],
  InputChip: ['truncate'],
  Link: ['variant', 'truncate'],
  MenuItem: ['size', 'selected', 'destructive'],
  MenuSub: ['selected'],
  NavItem: ['active'],
  Person: ['size'],
  ProgressBar: ['variant'],
  Property: ['layout'],
  RailItem: ['active'],
  Reaction: ['pressed'],
  ReactionPicker: ['surface'],
  SectionLabel: ['tone'],
  Select: ['size'],
  Tabs: ['size'],
  TextInput: ['size'],
  Toast: ['type'],
  Toolbar: ['surface'],
  ToolbarButton: ['variant', 'pressed', 'glow'],
  TopBar: ['variant'],
}

/** The class props of a part: `className`, and the ones for an inner box. */
const CLASS_PROP = /^(?:className|[a-z][A-Za-z]*ClassName)$/

// ---------------------------------------------------------------- the nodes

interface Node {
  type: string
  range: [number, number]
  loc?: NonNullable<Rule.Node['loc']>
  parent?: Node
  [key: string]: unknown
}

const child = (node: Node, key: string) => node[key] as Node | null | undefined
const children = (node: Node, key: string) => (node[key] as (Node | null)[] | undefined) ?? []
const nameOf = (node: Node | null | undefined): string | undefined =>
  node?.type === 'Identifier' || node?.type === 'JSXIdentifier' ? (node.name as string) : node?.type === 'Literal' && typeof node.value === 'string' ? node.value : undefined

/** Walk every node under `root`, skipping the parser's bookkeeping keys. */
function walk(root: Node, visit: (node: Node) => void): void {
  const stack: Node[] = [root]
  while (stack.length) {
    const node = stack.pop() as Node
    visit(node)
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'loc' || key === 'range' || key === 'tokens' || key === 'comments') continue
      const value = node[key]
      if (Array.isArray(value)) for (const item of value) { if (item && typeof (item as Node).type === 'string') stack.push(item as Node) }
      else if (value && typeof (value as Node).type === 'string') stack.push(value as Node)
    }
  }
}

// ---------------------------------------------------------------- the parts

/**
 * What a name is to this rule: the part it draws, and which of the caller's
 * class props reach which of the part's (`all` for a part, a re-export or a
 * wrapper; a map for a component that hands on its own `className`). `via` is
 * the app's own component in between, for the message.
 */
export interface PartBinding {
  part: string
  props: 'all' | Record<string, string>
  via?: string
}

interface Parser {
  parseForESLint?: (code: string, options: unknown) => { ast: Node }
  parse?: (code: string, options: unknown) => Node
}

interface ModuleFacts {
  mtime: number
  exports: Map<string, PartBinding>
}

const PACKAGE = '@estiva-app/ui'
const moduleCache = new Map<string, ModuleFacts>()
const packageDirCache = new Map<string, string | null>()
const packagePartsCache = new Map<string, { mtime: number; parts: Set<string> }>()

function parseFile(parser: Parser, filePath: string): Node | null {
  const code = readFileSync(filePath, 'utf8')
  const options = { filePath, ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: filePath.endsWith('x') }, range: true, loc: true }
  try {
    if (parser.parseForESLint) return parser.parseForESLint(code, options).ast
    if (parser.parse) return parser.parse(code, options)
  } catch {
    // A file that does not parse is its own lint's business; it hands on no parts.
  }
  return null
}

/** The nearest folder holding a `package.json`, from a file. */
function packageDirOf(file: string): string | null {
  const start = dirname(resolve(file))
  if (packageDirCache.has(start)) return packageDirCache.get(start) ?? null
  let dir = start
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) break
    const up = dirname(dir)
    if (up === dir) {
      dir = ''
      break
    }
    dir = up
  }
  packageDirCache.set(start, dir || null)
  return dir || null
}

function resolveModule(fromFile: string, specifier: string): string | null {
  let base: string
  if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier)
  else if (specifier.startsWith('@/')) {
    const dir = packageDirOf(fromFile)
    if (!dir) return null
    base = join(dir, 'src', specifier.slice(2))
  } else return null
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

/** The names this package's `src/index.ts` exports, when the file lives in `@estiva-app/ui` itself. */
function packagePartsFor(file: string, parser: Parser): Set<string> | null {
  const dir = packageDirOf(file)
  if (!dir) return null
  let name: string | undefined
  try {
    name = (JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string }).name
  } catch {
    return null
  }
  if (name !== PACKAGE) return null
  const index = join(dir, 'src', 'index.ts')
  if (!existsSync(index)) return null
  const mtime = statSync(index).mtimeMs
  const cached = packagePartsCache.get(index)
  if (cached && cached.mtime === mtime) return cached.parts
  const parts = new Set<string>()
  const ast = parseFile(parser, index)
  for (const statement of ast ? children(ast, 'body') : []) {
    if (statement?.type !== 'ExportNamedDeclaration' || statement.exportKind === 'type') continue
    for (const specifier of children(statement, 'specifiers')) {
      const exported = nameOf(child(specifier as Node, 'exported'))
      if (specifier?.exportKind !== 'type' && exported && /^[A-Z][a-z]/.test(exported)) parts.add(exported)
    }
  }
  packagePartsCache.set(index, { mtime, parts })
  return parts
}

/** A function component declared in a module: its name, and the function. */
function functionComponents(program: Node): Map<string, Node> {
  const found = new Map<string, Node>()
  const unwrap = (node: Node | null | undefined): Node | null => {
    let current = node
    while (current?.type === 'CallExpression' && children(current, 'arguments').length) {
      const callee = child(current, 'callee')
      const text = callee?.type === 'Identifier' ? nameOf(callee) : callee?.type === 'MemberExpression' ? nameOf(child(callee, 'property')) : undefined
      if (text !== 'forwardRef' && text !== 'memo') return null
      current = children(current, 'arguments')[0]
    }
    return current?.type === 'ArrowFunctionExpression' || current?.type === 'FunctionExpression' ? current : null
  }
  walk(program, (node) => {
    if (node.type === 'FunctionDeclaration') {
      const name = nameOf(child(node, 'id'))
      if (name && /^[A-Z]/.test(name)) found.set(name, node)
    } else if (node.type === 'VariableDeclarator') {
      const name = nameOf(child(node, 'id'))
      const fn = unwrap(child(node, 'init'))
      if (name && /^[A-Z]/.test(name) && fn) found.set(name, fn)
    }
  })
  return found
}

/**
 * The parts a module's names stand for. `ownFile` is the file being linted: its
 * imports are read the same way, so a wrapper declared beside its use counts.
 */
function moduleParts(file: string, program: Node, parser: Parser, stack: Set<string>): { locals: Map<string, PartBinding | 'namespace'>; exports: Map<string, PartBinding> } {
  const locals = new Map<string, PartBinding | 'namespace'>()
  const packageParts = packagePartsFor(file, parser)
  const body = children(program, 'body')

  const exportsOf = (specifier: string): Map<string, PartBinding> | 'package' | null => {
    if (specifier === PACKAGE) return 'package'
    const target = resolveModule(file, specifier)
    if (!target) return null
    if (packageParts) return 'package'
    return moduleExports(target, parser, stack)
  }

  for (const statement of body) {
    if (statement?.type !== 'ImportDeclaration' || statement.importKind === 'type') continue
    const source = exportsOf(String((child(statement, 'source') as Node).value))
    if (!source) continue
    for (const specifier of children(statement, 'specifiers')) {
      if (!specifier || specifier.importKind === 'type') continue
      const local = nameOf(child(specifier, 'local'))
      if (!local) continue
      if (specifier.type === 'ImportNamespaceSpecifier') {
        if (source === 'package' && !packageParts) locals.set(local, 'namespace')
        continue
      }
      const imported = specifier.type === 'ImportDefaultSpecifier' ? 'default' : nameOf(child(specifier, 'imported'))
      if (!imported) continue
      if (source === 'package') {
        const isPart = packageParts ? packageParts.has(imported) : /^[A-Z]/.test(imported)
        if (isPart) locals.set(local, { part: imported, props: 'all' })
      } else if (source.has(imported)) locals.set(local, source.get(imported) as PartBinding)
    }
  }

  // Inside the package, a part used in the file that declares it.
  const components = functionComponents(program)
  if (packageParts) for (const name of components.keys()) if (packageParts.has(name) && !locals.has(name)) locals.set(name, { part: name, props: 'all' })

  // In an app, a component that hands its props, or its own className, on to a part.
  if (!packageParts) {
    let changed = true
    for (let round = 0; changed && round < 10; round += 1) {
      changed = false
      for (const [name, fn] of components) {
        const binding = handsOnTo(fn, (tag) => bindingOfTag(tag, locals))
        if (!binding) continue
        const next = { ...binding, via: name }
        const previous = locals.get(name)
        if (!previous || JSON.stringify(previous) !== JSON.stringify(next)) {
          if (previous && previous !== 'namespace' && !previous.via) continue
          locals.set(name, next)
          changed = true
        }
      }
    }
  }

  const exports = new Map<string, PartBinding>()
  const localBinding = (name: string | undefined) => {
    const binding = name ? locals.get(name) : undefined
    return binding && binding !== 'namespace' ? binding : undefined
  }
  for (const statement of body) {
    if (!statement) continue
    if (statement.type === 'ExportNamedDeclaration') {
      const declaration = child(statement, 'declaration')
      if (declaration?.type === 'FunctionDeclaration') {
        const name = nameOf(child(declaration, 'id'))
        const binding = localBinding(name)
        if (name && binding) exports.set(name, binding)
      } else if (declaration?.type === 'VariableDeclaration') {
        for (const declarator of children(declaration, 'declarations')) {
          const name = nameOf(child(declarator as Node, 'id'))
          const init = child(declarator as Node, 'init')
          const binding = localBinding(name) ?? (init?.type === 'Identifier' ? localBinding(nameOf(init)) : undefined)
          if (name && binding) exports.set(name, binding)
        }
      }
      const source = child(statement, 'source')
      const from = source ? exportsOf(String(source.value)) : null
      for (const specifier of children(statement, 'specifiers')) {
        if (!specifier || specifier.exportKind === 'type') continue
        const local = nameOf(child(specifier, 'local'))
        const exported = nameOf(child(specifier, 'exported'))
        if (!local || !exported) continue
        if (!source) {
          const binding = localBinding(local)
          if (binding) exports.set(exported, binding)
        } else if (from === 'package') {
          if (/^[A-Z]/.test(local)) exports.set(exported, { part: local, props: 'all' })
        } else if (from?.has(local)) exports.set(exported, from.get(local) as PartBinding)
      }
    } else if (statement.type === 'ExportAllDeclaration' && !child(statement, 'exported')) {
      const from = exportsOf(String((child(statement, 'source') as Node).value))
      if (from && from !== 'package') for (const [name, binding] of from) exports.set(name, binding)
    } else if (statement.type === 'ExportDefaultDeclaration') {
      const declaration = child(statement, 'declaration')
      const name = declaration?.type === 'Identifier' ? nameOf(declaration) : nameOf(child(declaration as Node, 'id'))
      const binding = localBinding(name)
      if (binding) exports.set('default', binding)
    }
  }
  return { locals, exports }
}

function moduleExports(file: string, parser: Parser, stack: Set<string>): Map<string, PartBinding> {
  const mtime = statSync(file).mtimeMs
  const cached = moduleCache.get(file)
  if (cached && cached.mtime === mtime) return cached.exports
  if (stack.has(file)) return new Map()
  stack.add(file)
  const program = parseFile(parser, file)
  const exports = program ? moduleParts(file, program, parser, stack).exports : new Map<string, PartBinding>()
  stack.delete(file)
  moduleCache.set(file, { mtime, exports })
  return exports
}

function bindingOfTag(tag: Node | null | undefined, locals: Map<string, PartBinding | 'namespace'>): PartBinding | undefined {
  if (!tag) return undefined
  if (tag.type === 'JSXIdentifier') {
    const binding = locals.get(tag.name as string)
    return binding && binding !== 'namespace' ? binding : undefined
  }
  if (tag.type === 'JSXMemberExpression') {
    const object = child(tag, 'object')
    const property = nameOf(child(tag, 'property'))
    if (object?.type === 'JSXIdentifier' && locals.get(object.name as string) === 'namespace' && property) return { part: property, props: 'all' }
  }
  return undefined
}

/**
 * Whether a function component hands its props on to a part: its rest or its
 * whole props spread onto one (a wrapper), or its own class props passed into
 * one's class props (a component that places a part by its caller's word).
 */
function handsOnTo(fn: Node, bindingOf: (tag: Node | null | undefined) => PartBinding | undefined): PartBinding | undefined {
  const param = children(fn, 'params')[0]
  if (!param) return undefined
  let restName: string | undefined
  let propsName: string | undefined
  const classParams = new Map<string, string>()
  if (param.type === 'ObjectPattern') {
    for (const property of children(param, 'properties')) {
      if (!property) continue
      if (property.type === 'RestElement') restName = nameOf(child(property, 'argument'))
      else if (property.type === 'Property') {
        const key = nameOf(child(property, 'key'))
        let value = child(property, 'value')
        if (value?.type === 'AssignmentPattern') value = child(value, 'left')
        const local = nameOf(value)
        if (key && local && CLASS_PROP.test(key)) classParams.set(local, key)
      }
    }
  } else if (param.type === 'Identifier') propsName = nameOf(param)

  let wrapper: PartBinding | undefined
  const forwarded: { part?: string; props: Record<string, string> } = { props: {} }
  const body = child(fn, 'body')
  if (!body) return undefined
  walk(body, (node) => {
    if (wrapper || node.type !== 'JSXOpeningElement') return
    const binding = bindingOf(child(node, 'name'))
    if (!binding) return
    for (const attribute of children(node, 'attributes')) {
      if (!attribute) continue
      if (attribute.type === 'JSXSpreadAttribute') {
        const argument = nameOf(child(attribute, 'argument'))
        if (argument && (argument === restName || argument === propsName)) wrapper = { part: binding.part, props: binding.props }
        continue
      }
      const prop = nameOf(child(attribute, 'name'))
      if (!prop || !CLASS_PROP.test(prop)) continue
      const partProp = binding.props === 'all' ? prop : binding.props[prop]
      if (!partProp) continue
      walk(attribute, (inner) => {
        let callerProp: string | undefined
        if (inner.type === 'Identifier') callerProp = classParams.get(inner.name as string)
        if (inner.type === 'MemberExpression' && nameOf(child(inner, 'object')) === propsName) {
          const key = nameOf(child(inner, 'property'))
          if (key && CLASS_PROP.test(key)) callerProp = key
        }
        if (!callerProp) return
        if (forwarded.part && forwarded.part !== binding.part) return
        forwarded.part = binding.part
        forwarded.props[callerProp] = partProp
      })
    }
  })
  if (wrapper) return wrapper
  return forwarded.part ? { part: forwarded.part, props: forwarded.props } : undefined
}

// ---------------------------------------------------------------- reading a class list

const CLASS_FUNCTIONS = new Set(['cn', 'clsx', 'cx', 'twMerge', 'classNames'])

/** The `const` a name stands for in this file, if it is one. */
function constantOf(identifier: Node, scope: Scope.Scope | null): Node | undefined {
  let current = scope
  while (current) {
    const variable = current.set.get(identifier.name as string)
    if (variable) {
      const definition = variable.defs[0] as unknown as { type: string; node: Node; parent?: Node } | undefined
      if (variable.defs.length !== 1 || definition?.type !== 'Variable') return undefined
      if ((definition.parent as Node | undefined)?.kind !== 'const') return undefined
      return child(definition.node, 'init') ?? undefined
    }
    current = current.upper
  }
  return undefined
}

/**
 * Every class the code spells out for a value, as far as it can be read in this
 * file. `asMap` reads an object as a class map (its values) rather than as a
 * `clsx` object (its keys).
 */
export function classesOf(value: Node | null | undefined, scopeOf: (node: Node) => Scope.Scope | null, asMap = false, seen = new Set<Node>()): string[] {
  if (!value || seen.has(value) || seen.size > 200) return []
  seen.add(value)
  const read = (node: Node | null | undefined, map = false) => classesOf(node, scopeOf, map, seen)
  const words = (text: unknown) => (typeof text === 'string' ? text.split(/\s+/).filter(Boolean) : [])
  switch (value.type) {
    case 'Literal':
      return words(value.value)
    case 'TemplateLiteral':
      return [...children(value, 'quasis').flatMap((quasi) => words((quasi?.value as { cooked?: string }).cooked)), ...children(value, 'expressions').flatMap((e) => read(e))]
    case 'JSXExpressionContainer':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
    case 'ChainExpression':
      return read(child(value, 'expression'), asMap)
    case 'ConditionalExpression':
      return [...read(child(value, 'consequent')), ...read(child(value, 'alternate'))]
    case 'LogicalExpression':
      return value.operator === '&&' ? read(child(value, 'right')) : [...read(child(value, 'left')), ...read(child(value, 'right'))]
    case 'BinaryExpression':
      return value.operator === '+' ? [...read(child(value, 'left')), ...read(child(value, 'right'))] : []
    case 'ArrayExpression':
      return children(value, 'elements').flatMap((e) => read(e))
    case 'ObjectExpression':
      return children(value, 'properties').flatMap((property) => {
        if (property?.type !== 'Property') return []
        return asMap ? read(child(property, 'value'), true) : property.computed ? [] : words(nameOf(child(property, 'key')))
      })
    case 'CallExpression': {
      const callee = child(value, 'callee')
      return callee?.type === 'Identifier' && CLASS_FUNCTIONS.has(callee.name as string) ? children(value, 'arguments').flatMap((a) => read(a)) : []
    }
    case 'Identifier': {
      const constant = constantOf(value, scopeOf(value))
      return constant ? read(constant, asMap) : []
    }
    case 'MemberExpression': {
      const object = child(value, 'object')
      const target = object?.type === 'Identifier' ? constantOf(object, scopeOf(object)) : object
      const map = target?.type === 'TSAsExpression' || target?.type === 'TSSatisfiesExpression' ? child(target, 'expression') : target
      if (map?.type !== 'ObjectExpression') return []
      const property = child(value, 'property')
      const key = value.computed ? (property?.type === 'Literal' ? String(property.value) : undefined) : nameOf(property)
      return children(map, 'properties').flatMap((entry) => {
        if (entry?.type !== 'Property') return []
        if (key !== undefined && nameOf(child(entry, 'key')) !== key) return []
        return read(child(entry, 'value'), true)
      })
    }
    default:
      return []
  }
}

// ---------------------------------------------------------------- the rule

const code = (items: string[]) => items.map((item) => `\`${item}\``).join(' ')
const or = (items: string[]) => (items.length === 1 ? code(items) : `${items.slice(0, -1).map((i) => `\`${i}\``).join(', ')} or \`${items[items.length - 1]}\``)

export const noRestyledPart: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Only placement passes into a part of @estiva-app/ui through a class prop' },
    schema: [],
    messages: {
      restyled:
        '{{classes}} on {{where}} changes how it looks. A part of @estiva-app/ui is placed from outside, never restyled: only space, size, flex and grid, and position pass in.{{use}} A look for what is around it goes on your own element around it.',
      emptyStatePadding:
        '{{classes}} pads {{where}}. EmptyState takes no padding (Katerina, 14 September): its room comes from the box its rows live in, so put the padding on that box.',
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const parser = (context.languageOptions?.parser ?? {}) as Parser
    const file = context.filename
    const sourceCode = context.sourceCode
    const scopeOf = (node: Node) => sourceCode.getScope(node as unknown as Parameters<typeof sourceCode.getScope>[0])
    let locals: Map<string, PartBinding | 'namespace'> | undefined
    const escapes = new Map<Node, boolean>()
    const escaped = (anchor: Node) => {
      if (!escapes.has(anchor)) escapes.set(anchor, isEscaped(context, anchor))
      return escapes.get(anchor) === true
    }

    const check = (element: Node, binding: PartBinding, prop: string, value: Node | null | undefined, at: Node) => {
      const partProp = binding.props === 'all' ? prop : binding.props[prop]
      if (!partProp || !value) return
      const classes = classesOf(value, scopeOf)
      const handedOn = binding.props === 'all' ? 'its props' : `its \`${prop}\``
      const via = binding.via && binding.via !== binding.part ? `\`${binding.via}\` (it hands ${handedOn} to \`${binding.part}\`)` : `\`${binding.part}\``
      const where = `${via}${partProp === 'className' ? '' : `'s \`${partProp}\``}`
      const restyled = [...new Set(classes.filter((token) => !isPlacement(token)))]
      const padding = binding.part === 'EmptyState' && binding.props === 'all' ? [...new Set(classes.filter(isPadding))] : []
      if (!restyled.length && !padding.length) return
      if (escaped(element)) return
      if (restyled.length) {
        const props = PART_LOOK_PROPS[binding.part]
        const use = props ? ` Use its ${or(props)}.` : ` \`${binding.part}\` has no prop for this yet: ask Katerina, and it gets made in @estiva-app/ui.`
        context.report({ loc: at.loc as NonNullable<Rule.Node['loc']>, messageId: 'restyled', data: { classes: code(restyled), where, use } })
      }
      if (padding.length) context.report({ loc: at.loc as NonNullable<Rule.Node['loc']>, messageId: 'emptyStatePadding', data: { classes: code(padding), where } })
    }

    return {
      Program(program) {
        locals = moduleParts(file, program as unknown as Node, parser, new Set([file])).locals
      },
      JSXOpeningElement(ruleNode: Rule.Node) {
        const element = ruleNode as unknown as Node
        const binding = locals && bindingOfTag(child(element, 'name'), locals)
        if (!binding) return
        for (const attribute of children(element, 'attributes')) {
          if (!attribute) continue
          if (attribute.type === 'JSXAttribute') {
            const prop = nameOf(child(attribute, 'name'))
            if (prop && CLASS_PROP.test(prop)) check(element, binding, prop, child(attribute, 'value'), attribute)
            continue
          }
          // `{...{ className }}`, or a `const` object spread onto the part.
          let spread = child(attribute, 'argument')
          if (spread?.type === 'Identifier') spread = constantOf(spread, scopeOf(spread))
          while (spread?.type === 'TSAsExpression' || spread?.type === 'TSSatisfiesExpression') spread = child(spread, 'expression')
          if (spread?.type !== 'ObjectExpression') continue
          for (const property of children(spread, 'properties')) {
            const key = property?.type === 'Property' && !property.computed ? nameOf(child(property, 'key')) : undefined
            if (key && CLASS_PROP.test(key)) check(element, binding, key, child(property as Node, 'value'), property as Node)
          }
        }
      },
    }
  },
}
