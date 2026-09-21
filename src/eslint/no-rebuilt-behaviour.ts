import type { Rule } from 'eslint'
import { ESCAPE_MESSAGES, isEscaped } from './escape'

/**
 * Behaviour the package already owns, rebuilt by hand in an app (UIG-8, "forbid
 * the reach"). A hand-made dropdown, dialog, list or scrolling box does not look
 * wrong in review; it shows itself when somebody uses a keyboard, or has 81
 * folders. Every message names the part that already does it.
 *
 * What it reads is derived from the package source: which `@base-ui/react` part
 * each component imports, and so what it owns (`OWNED_BEHAVIOURS`, printed in
 * docs/GATES.md and reused by UIG-12's registry). `no-rebuilt-behaviour.test.ts`
 * holds the tables to the source, so a new part cannot be added without them.
 *
 * What it deliberately does not read, and why:
 *
 * - **A box that should scroll and does not.** A class rule finds the scrolling
 *   box built by hand; it cannot find the one that was never built. Peek's
 *   Folders column (fixed in peek 3dc663b) had no overflow class at all. Only a
 *   check that opens the page can find that.
 * - **Enter and Escape** compared by hand. In a field or an editor they are
 *   typing, and `Form` and `EditableText` own the ones that send or cancel.
 *   Escape and every other key taken for the whole page are read, through the
 *   listener.
 * - **aria-expanded, aria-pressed and the other states** written on a package
 *   component: the component is already the package's (UIG-14's usage rules).
 * - **Measuring arithmetic**, for the reason UIG-5 gave: `Popover` takes a
 *   rectangle to hang from, and a rule that guessed at arithmetic would report it.
 * - A listener on a variable that happens to hold the document.
 *
 * A place that keeps one says why on the line above: `// @estiva-escape: <why>`.
 * An escape above a statement, an element or an object property covers what the
 * rule found there.
 */

/** The part a message names, and where one behaviour has more owners, the others after it. `null`: no part yet. */
export interface OwnerPart {
  use: string
  more?: string
}

/**
 * Every Base UI module, and the package component built on it. Read from the
 * package's imports (`src/*.tsx`); the test fails if a component imports a
 * module this does not name, or names a component that does not import it.
 * A module no component uses has no part yet, and neither do Base UI's utilities.
 */
export const BASE_UI_PARTS: Record<string, OwnerPart | null> = {
  'alert-dialog': { use: 'DialogShell', more: ' To ask yes or no, `ConfirmDialog`.' },
  autocomplete: { use: 'CommandPalette' },
  avatar: { use: 'Avatar' },
  button: { use: 'Button', more: ' Icon only, `IconButton`.' },
  checkbox: { use: 'Checkbox' },
  collapsible: { use: 'CollapsibleSection' },
  combobox: { use: 'ChipInput' },
  dialog: { use: 'DialogShell', more: ' To search and act, `CommandPalette`.' },
  field: { use: 'Field' },
  fieldset: { use: 'Form' },
  form: { use: 'Form' },
  input: { use: 'TextInput', more: ' For a search, `SearchInput`.' },
  menu: { use: 'Menu' },
  popover: { use: 'Popover' },
  'preview-card': { use: 'PreviewCard' },
  progress: { use: 'ProgressBar' },
  'scroll-area': { use: 'ScrollArea' },
  select: { use: 'Select' },
  separator: { use: 'Divider' },
  tabs: { use: 'Tabs' },
  toast: { use: 'Toast' },
  toggle: { use: 'Reaction' },
  toolbar: { use: 'Toolbar' },
  tooltip: { use: 'Tooltip', more: ' Around a control, `WithTooltip`.' },
  accordion: null,
  'checkbox-group': null,
  'context-menu': null,
  drawer: null,
  menubar: null,
  meter: null,
  'navigation-menu': null,
  'number-field': null,
  'otp-field': null,
  radio: null,
  'radio-group': null,
  slider: null,
  switch: null,
  'toggle-group': null,
}

const LIST_PART: OwnerPart = {
  use: 'Select',
  more: ' To pick several, `ChipInput`; to search and act, `CommandPalette`; to tick several in a list, `Checkbox` with `row`.',
}

const MESSAGE_PART: OwnerPart = { use: 'FieldLine', more: ' For a notice, `Banner`; for a message that comes and goes, `Toast`.' }

/**
 * A role written by hand, and the part that sets it. Base UI's parts set most of
 * these; `tooltip` (Base UI's Tooltip sets none), `alert`, `status` and `link` are
 * the package's own. A role Base UI has a part for and this package has not got
 * yet is `null`. Not here, on purpose: `img`, `group`, `presentation`, `none`,
 * `region` and every landmark — they describe, they do not behave.
 */
export const ROLE_PARTS: Record<string, { thing: string; part: OwnerPart | null }> = {
  dialog: { thing: 'dialog', part: { use: 'DialogShell', more: ' To ask yes or no, `ConfirmDialog`.' } },
  alertdialog: { thing: 'dialog', part: { use: 'ConfirmDialog' } },
  menu: { thing: 'menu', part: { use: 'Menu' } },
  menuitem: { thing: 'menu', part: { use: 'Menu' } },
  menuitemcheckbox: { thing: 'menu', part: { use: 'Menu' } },
  menuitemradio: { thing: 'menu', part: { use: 'Menu' } },
  listbox: { thing: 'list', part: LIST_PART },
  option: { thing: 'list', part: LIST_PART },
  combobox: { thing: 'list', part: LIST_PART },
  tablist: { thing: 'set of tabs', part: { use: 'Tabs' } },
  tab: { thing: 'set of tabs', part: { use: 'Tabs' } },
  tabpanel: { thing: 'set of tabs', part: { use: 'Tabs' } },
  toolbar: { thing: 'toolbar', part: { use: 'Toolbar' } },
  progressbar: { thing: 'progress bar', part: { use: 'ProgressBar' } },
  checkbox: { thing: 'tick box', part: { use: 'Checkbox' } },
  separator: { thing: 'divider', part: { use: 'Divider' } },
  button: { thing: 'button', part: { use: 'Button', more: ' Icon only, `IconButton`.' } },
  link: { thing: 'link', part: { use: 'Link' } },
  tooltip: { thing: 'tooltip', part: { use: 'Tooltip', more: ' Around a control, `WithTooltip`.' } },
  alert: { thing: 'message', part: MESSAGE_PART },
  status: { thing: 'message', part: MESSAGE_PART },
  menubar: { thing: 'menu bar', part: null },
  switch: { thing: 'switch', part: null },
  radio: { thing: 'radio button', part: null },
  radiogroup: { thing: 'radio group', part: null },
  slider: { thing: 'slider', part: null },
  spinbutton: { thing: 'number field', part: null },
  meter: { thing: 'meter', part: null },
}

/** The keys a list, a menu, tabs and a toolbar move with. Enter and Escape are not here (see above). */
export const WALKING_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']

/**
 * A listener on the whole page, by what it is for. The events Base UI's own
 * parts listen to on the document (useDismiss, FloatingFocusManager, the
 * Positioner's autoUpdate): a floating part closes, holds focus and follows its
 * anchor with these. `focus`, `blur`, `visibilitychange` and `storage` are not
 * here: an app refreshing when the window comes back is not a floating part.
 */
export const PAGE_EVENTS: Record<string, 'press' | 'key' | 'focus' | 'follow'> = {
  mousedown: 'press',
  pointerdown: 'press',
  click: 'press',
  touchstart: 'press',
  keydown: 'key',
  keyup: 'key',
  keypress: 'key',
  focusin: 'focus',
  focusout: 'focus',
  scroll: 'follow',
  resize: 'follow',
}

/** Elements that are reachable with Tab by themselves; `tabIndex` on these is not a Tab stop made by hand. */
export const INTERACTIVE_ELEMENTS = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'iframe', 'embed', 'object', 'audio', 'video'])

/** `overflow-auto`, `overflow-y-scroll`…: a box that scrolls with the browser's scrollbar. */
export const SCROLL_CLASS = /^overflow(?:-[xy])?-(?:auto|scroll)$/

/** One row of the enumeration (UIG-8's acceptance; the shape UIG-12's registry reads). */
export interface OwnedBehaviour {
  id: string
  /** What a person notices the part doing. */
  behaviour: string
  /** The Base UI parts that do it, read from their source (1.8.0). */
  baseUi: string[]
  /** The package components an error names. */
  owners: string[]
  /** What the rule reads in an app to find it rebuilt. */
  reads: string
}

const uses = (parts: (OwnerPart | null)[]) => [
  ...new Set(parts.flatMap((p) => (p ? [p.use, ...[...(p.more ?? '').matchAll(/`([A-Z]\w+)`/g)].map((m) => m[1])] : []))),
]

export const OWNED_BEHAVIOURS: OwnedBehaviour[] = [
  {
    id: 'base-ui',
    behaviour: 'Is built on Base UI',
    baseUi: Object.keys(BASE_UI_PARTS),
    owners: uses(Object.values(BASE_UI_PARTS)),
    reads: 'an import from @base-ui/react (and the old @base-ui-components spelling)',
  },
  {
    id: 'portal',
    behaviour: 'Floats on top of the page',
    baseUi: ['Dialog', 'AlertDialog', 'Popover', 'Menu', 'Select', 'Combobox', 'Autocomplete', 'Tooltip', 'PreviewCard', 'Toast'],
    owners: ['DialogShell', 'ConfirmDialog', 'CommandPalette', 'Lightbox', 'Popover', 'Menu', 'Select', 'ChipInput', 'Tooltip', 'PreviewCard', 'Toast'],
    reads: 'createPortal, called, or imported and never called',
  },
  {
    id: 'press-outside',
    behaviour: 'Closes on a press outside',
    baseUi: ['Dialog', 'AlertDialog', 'Popover', 'Menu', 'Select', 'Combobox', 'Tooltip', 'PreviewCard'],
    owners: ['DialogShell', 'Popover', 'Menu', 'Select', 'PreviewCard'],
    reads: 'a mousedown, pointerdown, click or touchstart listener on window or document',
  },
  {
    id: 'page-keys',
    behaviour: 'Takes its keys by itself',
    baseUi: ['Dialog', 'AlertDialog', 'Popover', 'Menu', 'Select', 'Combobox', 'Tooltip', 'PreviewCard', 'Toast'],
    owners: ['DialogShell', 'Lightbox', 'Popover', 'Menu', 'Select', 'Tabs', 'Toolbar'],
    reads: 'a keydown, keyup or keypress listener on window or document',
  },
  {
    id: 'focus',
    behaviour: 'Holds focus inside while open, and gives it back',
    baseUi: ['Dialog', 'AlertDialog', 'Popover', 'Menu', 'Select', 'Combobox'],
    owners: ['DialogShell', 'CommandPalette', 'Lightbox'],
    reads: 'a focusin or focusout listener on window or document; the Tab key compared by hand',
  },
  {
    id: 'scroll-lock',
    behaviour: 'Stops the page behind it scrolling',
    baseUi: ['Dialog', 'AlertDialog'],
    owners: ['DialogShell', 'Lightbox'],
    reads: 'overflow written into the style of document.body or document.documentElement',
  },
  {
    id: 'follow',
    behaviour: 'Stays attached to its anchor on scroll and resize',
    baseUi: ['Popover', 'Menu', 'Select', 'Combobox', 'Tooltip', 'PreviewCard', 'Toast'],
    owners: ['Popover', 'Menu', 'Select', 'Tooltip', 'PreviewCard'],
    reads: 'a scroll or resize listener on window or document',
  },
  {
    id: 'walking',
    behaviour: 'Moves through its items with the arrow keys',
    baseUi: ['Menu', 'Select', 'Combobox', 'Autocomplete', 'Tabs', 'Toolbar'],
    owners: ['Menu', 'Select', 'ChipInput', 'CommandPalette', 'Tabs', 'Toolbar'],
    reads: `a key compared by hand with ${WALKING_KEYS.join(', ')}`,
  },
  {
    id: 'role',
    behaviour: 'Says what it is to assistive technology',
    baseUi: ['Dialog', 'AlertDialog', 'Menu', 'Select', 'Combobox', 'Tabs', 'Toolbar', 'Progress', 'Checkbox', 'Separator', 'Button'],
    owners: uses(Object.values(ROLE_PARTS).map((r) => r.part)),
    reads: `role written by hand: ${Object.keys(ROLE_PARTS).join(', ')}`,
  },
  {
    id: 'tab-stop',
    behaviour: 'Is reachable with Tab',
    baseUi: ['Button', 'Toggle', 'Checkbox', 'Tabs', 'Toolbar', 'ScrollArea'],
    owners: ['Button', 'IconButton', 'Link'],
    reads: 'tabIndex that can be 0 or more, on an element that is not a control',
  },
  {
    id: 'scroll',
    behaviour: 'Scrolls with our scrollbar',
    baseUi: ['ScrollArea'],
    owners: ['ScrollArea'],
    reads: 'overflow-auto or overflow-scroll (x or y, behind any variant) in a string, or overflow auto or scroll in a style',
  },
]

interface Node {
  type: string
  loc: NonNullable<Rule.Node['loc']>
  range: [number, number]
  parent?: Node
  [key: string]: unknown
}

const PAGE_TARGETS = new Set(['window', 'document', 'globalThis', 'self', 'document.body', 'document.documentElement', 'window.document'])

/** Where an escape for this node is written: its object property, its element, its array item, or its statement. */
function anchorOf(node: Node): Node {
  if (node.type === 'FunctionDeclaration') {
    return node.parent && /^Export/.test(node.parent.type) ? node.parent : node
  }
  let child = node
  for (let p = node.parent; p; child = p, p = p.parent) {
    if (p.type === 'JSXOpeningElement' || p.type === 'Property' || p.type === 'MethodDefinition' || p.type === 'PropertyDefinition') return p
    if (p.type === 'ArrayExpression') return child
    if (p.type !== 'BlockStatement' && /(Statement|Declaration)$/.test(p.type)) return p
  }
  return node
}

function enclosingFunction(node: Node): Node | undefined {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'FunctionDeclaration' || p.type === 'FunctionExpression' || p.type === 'ArrowFunctionExpression') return p
  }
  return undefined
}

function stringOf(node: Node | undefined | null): string | undefined {
  if (!node) return undefined
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  const quasis = node.quasis as { value: { cooked: string | null } }[] | undefined
  const expressions = node.expressions as unknown[] | undefined
  if (node.type === 'TemplateLiteral' && expressions?.length === 0) return quasis?.[0]?.value.cooked ?? undefined
  return undefined
}

/** Every string a JSX attribute's value can be: `"x"`, `{'x'}`, `{a ? 'x' : 'y'}`, `{a && 'x'}`. */
function stringsOf(node: Node | undefined | null): string[] {
  if (!node) return []
  if (node.type === 'JSXExpressionContainer') return stringsOf(node.expression as Node)
  const s = stringOf(node)
  if (s !== undefined) return [s]
  if (node.type === 'ConditionalExpression') return [...stringsOf(node.consequent as Node), ...stringsOf(node.alternate as Node)]
  if (node.type === 'LogicalExpression') return [...stringsOf(node.left as Node), ...stringsOf(node.right as Node)]
  return []
}

/** Whether a `tabIndex` value can be 0 or more, as far as the code spells it out. */
function canBeTabStop(node: Node | undefined | null): boolean {
  if (!node) return false
  if (node.type === 'JSXExpressionContainer') return canBeTabStop(node.expression as Node)
  if (node.type === 'Literal') {
    if (typeof node.value === 'number') return node.value >= 0
    if (typeof node.value === 'string') return /^\s*\d+\s*$/.test(node.value)
    return false
  }
  if (node.type === 'ConditionalExpression') return canBeTabStop(node.consequent as Node) || canBeTabStop(node.alternate as Node)
  if (node.type === 'LogicalExpression') return canBeTabStop(node.left as Node) || canBeTabStop(node.right as Node)
  if (node.type === 'TSAsExpression' || node.type === 'TSNonNullExpression') return canBeTabStop(node.expression as Node)
  return false
}

/** A class token's utility, past its variants: `[&_pre]:overflow-x-auto` → `overflow-x-auto`. */
export function utilityOf(token: string): string {
  let depth = 0
  let last = -1
  for (let i = 0; i < token.length; i++) {
    const c = token[i]
    if (c === '[') depth++
    else if (c === ']') depth--
    else if (c === ':' && depth === 0) last = i
  }
  return token.slice(last + 1).replace(/^!/, '').replace(/!$/, '')
}

/** The Base UI module an import names, or `undefined` when it is not Base UI. `''` is the package root. */
export function baseUiModule(source: string): string | undefined {
  const m = /^@base-ui(?:-components)?\/([^/]+)(?:\/(.+))?$/.exec(source)
  if (!m) return undefined
  const [, pkg, sub] = m
  return pkg === 'react' ? (sub ?? '') : `${pkg}${sub ? `/${sub}` : ''}`
}

function isKeySubject(node: Node | undefined): boolean {
  if (!node) return false
  if (node.type === 'Identifier') return node.name === 'key' || node.name === 'code'
  if (node.type !== 'MemberExpression' || node.computed) return false
  const property = node.property as Node
  return property.type === 'Identifier' && (property.name === 'key' || property.name === 'code')
}

function pageTarget(node: Node, text: string): boolean {
  return (node.type === 'Identifier' || node.type === 'MemberExpression') && PAGE_TARGETS.has(text)
}

export const noRebuiltBehaviour: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Behaviour @estiva-app/ui already owns, rebuilt by hand in an app' },
    schema: [],
    messages: {
      baseUi: 'Only @estiva-app/ui imports Base UI (`{{module}}`). Use `{{use}}` from @estiva-app/ui.{{more}}',
      baseUiNoPart:
        'Only @estiva-app/ui imports Base UI (`{{module}}`), and it has no part built on it yet. Do not build one here: ask Katerina, and it gets made in @estiva-app/ui.',
      portal:
        'A layer put on top of the page by hand (`createPortal`). Every floating part of @estiva-app/ui carries its own: `DialogShell` for a dialog, `Popover` for a panel, `Menu`, `Select`, `Tooltip`, `PreviewCard`, `Toast`.',
      press:
        'A `{{event}}` listener on `{{target}}`: closing on a press outside, by hand. `Popover`, `Menu`, `Select`, `DialogShell` and `PreviewCard` from @estiva-app/ui close themselves.',
      key: 'A `{{event}}` listener on `{{target}}`: keys taken for the whole page, by hand. `DialogShell`, `Popover`, `Menu` and `Select` from @estiva-app/ui close on Escape themselves; `Menu`, `Select`, `Tabs` and `Toolbar` move with the arrow keys.',
      focus:
        'A `{{event}}` listener on `{{target}}`: focus held by hand. `DialogShell` and `CommandPalette` from @estiva-app/ui keep focus inside and give it back.',
      follow:
        'A `{{event}}` listener on `{{target}}`: following an anchor by hand. `Popover`, `Menu`, `Select`, `Tooltip` and `PreviewCard` from @estiva-app/ui stay attached to theirs.',
      scrollLock: "The page's scroll locked by hand. `DialogShell` from @estiva-app/ui stops the page scrolling while it is open, and gives it back.",
      walking:
        'Arrow keys handled by hand (`{{key}}`). `Menu`, `Select`, `ChipInput`, `CommandPalette`, `Tabs` and `Toolbar` from @estiva-app/ui move through their items themselves.',
      tabKey: 'The Tab key handled by hand. `DialogShell` and `CommandPalette` from @estiva-app/ui keep focus inside themselves.',
      role: 'A hand-written `role="{{role}}"` is a hand-made {{thing}}. Use `{{use}}` from @estiva-app/ui.{{more}}',
      roleNoPart:
        'A hand-written `role="{{role}}"` is a hand-made {{thing}}, and @estiva-app/ui has no part for one yet. Do not build one here: ask Katerina, and it gets made in @estiva-app/ui.',
      tabStop:
        '`tabIndex={{value}}` makes a `<{{element}}>` a Tab stop by hand. Use `Button`, `IconButton` or `Link` from @estiva-app/ui, which are reachable already.',
      scrollClass: "`{{token}}` scrolls with the browser's scrollbar. Use `ScrollArea` from @estiva-app/ui, which draws ours.",
      scrollStyle: "`{{style}}` scrolls with the browser's scrollbar. Use `ScrollArea` from @estiva-app/ui, which draws ours.",
      ...ESCAPE_MESSAGES,
    },
  },
  create(context) {
    const { sourceCode } = context
    const text = (node: Node) => sourceCode.getText(node as unknown as Rule.Node)

    // One escape covers what the rule found at its anchor, and is counted once.
    const escapes = new Map<Node, boolean>()
    const escaped = (anchor: Node) => {
      if (!escapes.has(anchor)) escapes.set(anchor, isEscaped(context, anchor))
      return escapes.get(anchor) === true
    }
    const seen = new Set<string>()
    const report = (anchor: Node, at: Node, messageId: string, data: Record<string, string> = {}, once = `${at.range[0]}`) => {
      const key = `${anchor.range[0]}|${messageId}|${once}`
      if (seen.has(key)) return
      seen.add(key)
      if (escaped(anchor)) return
      context.report({ loc: at.loc, messageId, data })
    }

    const importSource = (node: Node, source: Node | undefined | null) => {
      const value = stringOf(source)
      if (value === undefined) return
      const module = baseUiModule(value)
      if (module === undefined) return
      const part = Object.hasOwn(BASE_UI_PARTS, module) ? BASE_UI_PARTS[module] : null
      const anchor = anchorOf(node)
      if (part) report(anchor, node, 'baseUi', { module: value, use: part.use, more: part.more ?? '' })
      else report(anchor, node, 'baseUiNoPart', { module: value })
    }

    const keyCompared = (node: Node, key: string | undefined) => {
      if (key === undefined) return
      const fn = enclosingFunction(node)
      const anchor = anchorOf(fn ?? node)
      if (WALKING_KEYS.includes(key)) report(anchor, node, 'walking', { key }, `walking@${fn?.range[0] ?? node.range[0]}`)
      else if (key === 'Tab') report(anchor, node, 'tabKey', {}, `tab@${fn?.range[0] ?? node.range[0]}`)
    }

    const classTokens = (node: Node, value: string) => {
      for (const token of value.split(/\s+/)) {
        if (token && SCROLL_CLASS.test(utilityOf(token))) report(anchorOf(node), node, 'scrollClass', { token }, `class@${token}`)
      }
    }

    // `createPortal` imported: reported where it is called, or at the import when it never is.
    const portalImports = new Map<string, Node>()
    let portalCalled = false

    return {
      ImportDeclaration(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        importSource(node, node.source as Node)
        if (stringOf(node.source as Node) !== 'react-dom') return
        for (const specifier of node.specifiers as Node[]) {
          const imported = specifier.imported as Node | undefined
          if (specifier.type === 'ImportSpecifier' && imported?.name === 'createPortal') portalImports.set((specifier.local as Node).name as string, node)
        }
      },
      ExportNamedDeclaration(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        if (node.source) importSource(node, node.source as Node)
      },
      ExportAllDeclaration(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        importSource(node, node.source as Node)
      },
      ImportExpression(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        importSource(node, node.source as Node)
      },

      CallExpression(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        const callee = node.callee as Node
        const args = node.arguments as Node[]

        if (callee.type === 'Identifier' && callee.name === 'require') importSource(node, args[0])

        if (callee.type === 'Identifier' && portalImports.has(callee.name as string)) {
          portalCalled = true
          report(anchorOf(node), node, 'portal')
        }
        if (callee.type !== 'MemberExpression') return
        const object = callee.object as Node
        const property = callee.property as Node
        if (property.type !== 'Identifier') return

        if (property.name === 'createPortal') {
          report(anchorOf(node), node, 'portal')
          return
        }

        if (property.name === 'addEventListener') {
          const target = text(object)
          if (!pageTarget(object, target)) return
          const event = stringOf(args[0])
          const group = event === undefined ? undefined : PAGE_EVENTS[event]
          if (!event || !group) return
          report(anchorOf(node), node, group, { event, target })
          return
        }

        // ['ArrowUp', 'ArrowDown'].includes(event.key)
        if (property.name === 'includes' && object.type === 'ArrayExpression' && isKeySubject(args[0])) {
          for (const element of object.elements as Node[]) keyCompared(node, stringOf(element))
        }
      },

      AssignmentExpression(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        const left = node.left as Node
        if (left.type !== 'MemberExpression') return
        const property = left.property as Node
        const object = left.object as Node
        const handler = property.type === 'Identifier' ? /^on([a-z]+)$/.exec(property.name as string) : null
        if (handler && pageTarget(object, text(object)) && PAGE_EVENTS[handler[1]]) {
          report(anchorOf(node), node, PAGE_EVENTS[handler[1]], { event: handler[1], target: text(object) })
          return
        }
        if (/^document\.(?:body|documentElement)\.style\.overflow[XY]?$/.test(text(left))) report(anchorOf(node), node, 'scrollLock')
      },

      BinaryExpression(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        if (!['===', '==', '!==', '!='].includes(node.operator as string)) return
        const left = node.left as Node
        const right = node.right as Node
        if (isKeySubject(left)) keyCompared(node, stringOf(right))
        else if (isKeySubject(right)) keyCompared(node, stringOf(left))
      },

      SwitchCase(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        const statement = node.parent as Node
        if (node.test && isKeySubject(statement.discriminant as Node)) keyCompared(node, stringOf(node.test as Node))
      },

      JSXAttribute(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        const nameNode = node.name as Node
        if (nameNode.type !== 'JSXIdentifier') return
        const name = nameNode.name as string
        const element = node.parent as Node
        const value = node.value as Node | null

        if (name === 'role') {
          for (const role of stringsOf(value).flatMap((v) => v.trim().split(/\s+/))) {
            if (!Object.hasOwn(ROLE_PARTS, role)) continue
            const { thing, part } = ROLE_PARTS[role]
            if (part) report(element, node, 'role', { role, thing, use: part.use, more: part.more ?? '' })
            else report(element, node, 'roleNoPart', { role, thing })
            return
          }
          return
        }

        if (name === 'tabIndex' || name === 'tabindex') {
          const tag = element.name as Node
          if (tag.type !== 'JSXIdentifier' || !/^[a-z]/.test(tag.name as string) || INTERACTIVE_ELEMENTS.has(tag.name as string)) return
          const attributes = element.attributes as Node[]
          const editable = attributes.some((a) => a.type === 'JSXAttribute' && /^contenteditable$/i.test(((a.name as Node).name as string) ?? ''))
          if (editable || !canBeTabStop(value)) return
          report(element, node, 'tabStop', { value: value ? text(value).replace(/^\{|\}$/g, '') : '', element: tag.name as string })
          return
        }

        if (name === 'style' && value?.type === 'JSXExpressionContainer') {
          const object = value.expression as Node
          if (object.type !== 'ObjectExpression') return
          for (const property of object.properties as Node[]) {
            if (property.type !== 'Property') continue
            const key = property.key as Node
            const keyName = key.type === 'Identifier' ? (key.name as string) : stringOf(key)
            if (!keyName || !/^overflow[XY]?$/.test(keyName)) continue
            const setting = stringOf(property.value as Node)
            if (setting === 'auto' || setting === 'scroll') report(element, property, 'scrollStyle', { style: `${keyName}: '${setting}'` }, `style@${keyName}`)
          }
        }
      },

      Literal(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        if (typeof node.value !== 'string') return
        const parent = node.parent
        if (parent && /^(Import|Export)/.test(parent.type)) return
        if (parent?.type === 'TSLiteralType' || parent?.type === 'TSExternalModuleReference') return
        classTokens(node, node.value)
      },

      TemplateElement(ruleNode: Rule.Node) {
        const node = ruleNode as unknown as Node
        const cooked = (node.value as { cooked: string | null }).cooked
        if (cooked && node.parent) classTokens(node.parent, cooked)
      },

      'Program:exit'() {
        if (portalCalled) return
        for (const declaration of new Set(portalImports.values())) report(anchorOf(declaration), declaration, 'portal')
      },
    }
  },
}
