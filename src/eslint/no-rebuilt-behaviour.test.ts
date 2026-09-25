import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { RuleTester } from 'eslint'
import ts from 'typescript'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import {
  BASE_UI_PARTS,
  baseUiModule,
  noRebuiltBehaviour,
  OWNED_BEHAVIOURS,
  ROLE_PARTS,
  utilityOf,
  WALKING_KEYS,
} from './no-rebuilt-behaviour'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

const component = (body: string) => `export function Probe() {\n  return (\n${body}\n  )\n}\n`
const effect = (body: string) => `useEffect(() => {\n${body}\n}, [])\n`
const LIST = ' To pick several, `ChipInput`; to search and act, `CommandPalette`; to tick several in a list, `Checkbox` with `row`.'

tester.run('no-rebuilt-behaviour', noRebuiltBehaviour, {
  valid: [
    // Base UI and portals
    { name: 'a part from the package', code: "import { Select, Popover } from '@estiva-app/ui'" },
    { name: 'react-dom without createPortal', code: "import { flushSync } from 'react-dom'\nflushSync(() => {})" },
    { name: 'a package whose name only starts like Base UI', code: "import x from '@base-uix/react'" },

    // listeners
    { name: 'the window coming back is not a floating part', code: effect("  window.addEventListener('focus', refresh)\n  document.addEventListener('visibilitychange', refresh)\n  window.addEventListener('storage', sync)") },
    { name: 'a listener on an element, not the page', code: effect("  ref.current.addEventListener('keydown', onKey)") },
    { name: 'an event the code computes', code: effect('  document.addEventListener(name, handler)') },
    { name: "the app's own event on window", code: effect("  window.addEventListener('highlight-tag-click', open)") },

    // keys
    { name: 'Enter and Escape in a field are typing', code: "const onKeyDown = (e) => {\n  if (e.key === 'Enter') send()\n  if (e.key === 'Escape') cancel()\n}" },
    { name: 'a shortcut letter', code: "const onKeyDown = (e) => {\n  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') open()\n}" },
    { name: 'the word ArrowDown that is not a key', code: "const label = 'ArrowDown'\nif (label === 'ArrowDown') go()" },

    // roles
    { name: 'role img on an svg', code: component('    <svg role="img" aria-label="Logo"><path d="M0 0" /></svg>') },
    { name: 'the roles that describe rather than behave', code: component('    <div role="group" aria-label="Format">\n      <div role="presentation" />\n      <section role="region" aria-label="A" />\n      <span role="none" />\n    </div>') },
    { name: 'a role the code computes', code: component('    <div role={role} />') },

    // tab stops
    { name: 'tabIndex -1 makes a box focusable by script, not a Tab stop', code: component('    <p tabIndex={-1}>measured</p>') },
    { name: 'tabIndex on a control', code: component('    <div>\n      <button tabIndex={0}>x</button>\n      <input tabIndex={0} />\n      <a href="/x" tabIndex={0}>x</a>\n    </div>') },
    { name: 'tabIndex passed through from a prop', code: component('    <div tabIndex={props.tabIndex} />') },
    { name: 'tabIndex on an editable region', code: component('    <div contentEditable tabIndex={0} />') },
    { name: 'tabIndex on a package component', code: component('    <MenuItem tabIndex={-1} label="Item" />') },

    // scrolling
    { name: 'overflow that does not scroll', code: component('    <div className="overflow-hidden overflow-x-clip overflow-visible overscroll-contain" />') },
    { name: 'a word that only contains the class', code: "const id = 'my-overflow-auto-thing'" },
    { name: 'a style that hides overflow', code: component("    <div style={{ overflow: 'hidden' }} />") },

    // escapes
    {
      name: 'an escape above the statement keeps a page listener',
      code: effect("  // @estiva-escape(no-rebuilt-behaviour): an inline panel, not a floating one, closes on a press outside\n  document.addEventListener('mousedown', close)"),
    },
    {
      name: 'an escape above the element keeps a hand-written role',
      code: component('    // @estiva-escape(no-rebuilt-behaviour): a list the editor drives from its caret\n    <MenuItem role="option" aria-selected label="Item" />'),
    },
    {
      name: 'an escape above the object property keeps its arrow keys',
      code: "useImperativeHandle(ref, () => ({\n  // @estiva-escape(no-rebuilt-behaviour): a list the editor drives from its caret\n  onKeyDown: ({ event }) => {\n    if (event.key === 'ArrowDown') next()\n    if (event.key === 'ArrowUp') previous()\n    return false\n  },\n}))",
    },
    {
      name: 'an escape above the call keeps a portal',
      code: "import { createPortal } from 'react-dom'\nfunction Viewer() {\n  // @estiva-escape(no-rebuilt-behaviour): becomes the package Lightbox at stage 7\n  return createPortal(<div />, document.body)\n}",
    },
    {
      name: 'an escape above an array item keeps its class',
      code: "const CLASSES = [\n  'flex',\n  // @estiva-escape(no-rebuilt-behaviour): a code block the editor draws, which nothing can wrap\n  '[&_pre]:overflow-x-auto',\n]",
    },
    {
      name: 'one escape above an element covers everything found on it',
      code: component('    // @estiva-escape(no-rebuilt-behaviour): a surface that holds headings, which a button cannot\n    <div role="button" tabIndex={0} className="overflow-auto" />'),
    },
  ],
  invalid: [
    // Base UI
    {
      name: 'a Base UI import names the part built on it',
      code: "import { Dialog } from '@base-ui/react/dialog'",
      errors: [{ message: 'Only @estiva-app/ui imports Base UI (`@base-ui/react/dialog`). Use `DialogShell` from @estiva-app/ui. To search and act, `CommandPalette`.', line: 1 }],
    },
    ...Object.entries(BASE_UI_PARTS).map(([module, part]) => ({
      name: part ? `@base-ui/react/${module} names ${part.use}` : `@base-ui/react/${module} has no part yet`,
      code: `import * as Part from '@base-ui/react/${module}'`,
      errors: [{ messageId: part ? 'baseUi' : 'baseUiNoPart' }],
    })),
    { name: 'the old package spelling', code: "import { Menu } from '@base-ui-components/react/menu'", errors: [{ message: 'Only @estiva-app/ui imports Base UI (`@base-ui-components/react/menu`). Use `Menu` from @estiva-app/ui.' }] },
    { name: 'the package root', code: "import { Popover } from '@base-ui/react'", errors: [{ messageId: 'baseUiNoPart' }] },
    { name: "a Base UI utility", code: "import { useRender } from '@base-ui/react/use-render'", errors: [{ messageId: 'baseUiNoPart' }] },
    { name: 'a type-only import', code: "import type { PopoverRootProps } from '@base-ui/react/popover'", errors: [{ messageId: 'baseUi' }] },
    { name: 're-exported', code: "export { Popover } from '@base-ui/react/popover'", errors: [{ messageId: 'baseUi' }] },
    { name: 'imported when needed', code: "const Tabs = lazy(() => import('@base-ui/react/tabs'))", errors: [{ messageId: 'baseUi' }] },
    { name: 'required', code: "const { Toolbar } = require('@base-ui/react/toolbar')", errors: [{ messageId: 'baseUi' }] },

    // portals
    {
      name: 'createPortal, called: reported where it is called, once',
      code: "import { createPortal } from 'react-dom'\nfunction Viewer() {\n  return createPortal(<div />, document.body)\n}",
      errors: [{ messageId: 'portal', line: 3 }],
    },
    { name: 'createPortal imported and never called', code: "import { createPortal } from 'react-dom'\nexport function Header() {\n  return null\n}", errors: [{ messageId: 'portal', line: 1 }] },
    { name: 'createPortal on the namespace', code: "import ReactDOM from 'react-dom'\nReactDOM.createPortal(child, node)", errors: [{ messageId: 'portal', line: 2 }] },

    // listeners
    {
      name: 'a press outside, by hand',
      code: effect("  document.addEventListener('mousedown', close)"),
      errors: [{ message: 'A `mousedown` listener on `document`: closing on a press outside, by hand. `Popover`, `Menu`, `Select`, `DialogShell` and `PreviewCard` from @estiva-app/ui close themselves.', line: 2 }],
    },
    { name: 'keys for the whole page', code: effect("  window.addEventListener('keydown', onKey)"), errors: [{ messageId: 'key', data: { event: 'keydown', target: 'window' } }] },
    { name: 'focus held by hand', code: effect("  document.body.addEventListener('focusin', keep, true)"), errors: [{ messageId: 'focus', data: { event: 'focusin', target: 'document.body' } }] },
    { name: 'following an anchor by hand', code: effect("  window.addEventListener('resize', place)\n  window.addEventListener('scroll', place, true)"), errors: [{ messageId: 'follow', line: 2 }, { messageId: 'follow', line: 3 }] },
    { name: 'a handler property on window', code: 'window.onkeydown = (e) => close(e)', errors: [{ messageId: 'key', data: { event: 'keydown', target: 'window' } }] },
    { name: "the page's scroll locked by hand", code: "document.body.style.overflow = 'hidden'", errors: [{ messageId: 'scrollLock' }] },

    // keys
    {
      name: 'arrow keys in one handler: one report, at the first',
      code: "const onKeyDown = (e) => {\n  if (e.key === 'ArrowDown') next()\n  if (e.key === 'ArrowUp') previous()\n}",
      errors: [{ message: 'Arrow keys handled by hand (`ArrowDown`). `Menu`, `Select`, `ChipInput`, `CommandPalette`, `Tabs` and `Toolbar` from @estiva-app/ui move through their items themselves.', line: 2 }],
    },
    ...WALKING_KEYS.map((key) => ({ name: `${key} is a walking key`, code: `function onKey(event) {\n  if (event.code == '${key}') go()\n}`, errors: [{ messageId: 'walking', data: { key } }] })),
    { name: 'two handlers are two reports', code: "const a = (e) => e.key === 'ArrowLeft'\nconst b = (e) => e.key === 'ArrowRight'", errors: [{ messageId: 'walking', line: 1 }, { messageId: 'walking', line: 2 }] },
    { name: 'a switch on the key', code: "function onKey(e) {\n  switch (e.key) {\n    case 'Enter': return send()\n    case 'Home': return first()\n  }\n}", errors: [{ messageId: 'walking', data: { key: 'Home' }, line: 4 }] },
    { name: 'a list of keys', code: "const walks = (event) => ['ArrowUp', 'ArrowDown'].includes(event.key)", errors: [{ messageId: 'walking', data: { key: 'ArrowUp' } }] },
    { name: 'a destructured key', code: "function onKey({ key }) {\n  if (key !== 'PageDown') return\n}", errors: [{ messageId: 'walking', data: { key: 'PageDown' } }] },
    { name: 'the Tab key, by hand', code: "const trap = (e) => {\n  if (e.key === 'Tab') keepInside(e)\n}", errors: [{ messageId: 'tabKey', line: 2 }] },
    { name: 'arrow keys in a JSX handler', code: component("    <div onKeyDown={(e) => { if (e.key === 'ArrowDown') next() }} />"), errors: [{ messageId: 'walking', line: 3 }] },

    // roles
    ...Object.entries(ROLE_PARTS).map(([role, { thing, part }]) => ({
      name: part ? `role="${role}" names ${part.use}` : `role="${role}" has no part yet`,
      code: component(`    <div role="${role}" />`),
      errors: [
        part
          ? { message: `A hand-written \`role="${role}"\` is a hand-made ${thing}. Use \`${part.use}\` from @estiva-app/ui.${part.more ?? ''}` }
          : { message: `A hand-written \`role="${role}"\` is a hand-made ${thing}, and @estiva-app/ui has no part for one yet. Do not build one here: ask Katerina, and it gets made in @estiva-app/ui.` },
      ],
    })),
    { name: 'a hand-made option row (Peek, AddToOpenWorkDialog)', code: component('    <div role="option" aria-selected={checked} onClick={toggle} />'), errors: [{ message: `A hand-written \`role="option"\` is a hand-made list. Use \`Select\` from @estiva-app/ui.${LIST}` }] },
    { name: 'a role on a package component', code: component('    <MenuItem role="option" label="Item" />'), errors: [{ messageId: 'role' }] },
    { name: 'a role in braces, or one of two', code: component("    <p role={failed ? 'alert' : 'status'} />"), errors: [{ messageId: 'role', data: { role: 'alert', thing: 'message', use: 'FieldLine', more: ' For a notice, `Banner`; for a message that comes and goes, `Toast`.' } }] },

    // tab stops
    { name: 'tabIndex 0 on a div', code: component('    <div tabIndex={0} />'), errors: [{ message: '`tabIndex=0` makes a `<div>` a Tab stop by hand. Use `Button`, `IconButton` or `Link` from @estiva-app/ui, which are reachable already.' }] },
    { name: 'tabIndex written as a string', code: component('    <span tabIndex="0" />'), errors: [{ messageId: 'tabStop' }] },
    { name: 'tabIndex above 0', code: component('    <li tabIndex={2} />'), errors: [{ messageId: 'tabStop' }] },
    { name: 'tabIndex 0 on one side of a condition (Ship, DescriptionEditor)', code: component('    <div tabIndex={readOnly ? undefined : 0} />'), errors: [{ messageId: 'tabStop', data: { value: 'readOnly ? undefined : 0', element: 'div' } }] },

    // scrolling
    { name: 'overflow-y-auto', code: component('    <div className="h-64 overflow-y-auto" />'), errors: [{ message: "`overflow-y-auto` scrolls with the browser's scrollbar. Use `ScrollArea` from @estiva-app/ui, which draws ours." }] },
    { name: 'every overflow that scrolls', code: component('    <div className="overflow-auto overflow-scroll overflow-x-auto overflow-y-scroll" />'), errors: [{ messageId: 'scrollClass' }, { messageId: 'scrollClass' }, { messageId: 'scrollClass' }, { messageId: 'scrollClass' }] },
    { name: 'behind a word-shaped variant', code: component('    <div className="md:overflow-auto" />'), errors: [{ messageId: 'scrollClass', data: { token: 'md:overflow-auto' } }] },
    { name: 'behind an arbitrary variant (Ship, prose.ts)', code: "const PROSE_CLASSES = [\n  '[&_pre]:overflow-x-auto [&_pre]:rounded-md',\n]", errors: [{ messageId: 'scrollClass', data: { token: '[&_pre]:overflow-x-auto' }, line: 2 }] },
    { name: 'marked important', code: "const box = cn('!overflow-y-auto')", errors: [{ messageId: 'scrollClass' }] },
    { name: 'inside a template', code: 'const box = `flex ${open ? "a" : "b"} overflow-y-auto`', errors: [{ messageId: 'scrollClass' }] },
    { name: 'in a style', code: component("    <div style={{ overflowY: 'auto' }} />"), errors: [{ message: "`overflowY: 'auto'` scrolls with the browser's scrollbar. Use `ScrollArea` from @estiva-app/ui, which draws ours." }] },

    // escapes
    {
      name: 'an escape with no reason hides nothing',
      code: effect("  // @estiva-escape(no-rebuilt-behaviour):\n  document.addEventListener('mousedown', close)"),
      errors: [{ messageId: 'escapeWithoutReason', line: 2 }, { messageId: 'press', line: 3 }],
    },
    {
      name: 'an escape above one statement does not reach the next',
      code: effect("  // @estiva-escape(no-rebuilt-behaviour): an inline panel, not a floating one, closes on a press outside\n  document.addEventListener('mousedown', close)\n  document.addEventListener('keydown', onKey)"),
      errors: [{ messageId: 'key', line: 4 }],
    },
    {
      name: 'with reportEscapes on, one escape over two findings is counted once',
      code: component('    // @estiva-escape(no-rebuilt-behaviour): a surface that holds headings, which a button cannot\n    <div role="button" tabIndex={0} />'),
      settings: { estiva: { reportEscapes: true } },
      errors: [{ messageId: 'escaped', line: 3 }],
    },
  ],
})

describe('the behaviour table is derived from the package source', () => {
  const src = new URL('../', import.meta.url)
  const index = readFileSync(new URL('index.ts', src), 'utf8')

  /** Every name the package root exports, and the file it comes from. */
  const exportedFrom = new Map<string, string>()
  for (const statement of ts.createSourceFile('index.ts', index, ts.ScriptTarget.Latest, true).statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
    for (const element of statement.exportClause.elements) exportedFrom.set(element.name.text, statement.moduleSpecifier.text.replace(/^\.\//, ''))
  }

  /** Which Base UI modules each component file imports, read with the TypeScript parser. */
  const importsOf = new Map<string, Set<string>>()
  for (const file of readdirSync(src).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\.tsx?$/.test(f))) {
    const sourceFile = ts.createSourceFile(file, readFileSync(new URL(file, src), 'utf8'), ts.ScriptTarget.Latest, true)
    const modules = new Set<string>()
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
      const module = baseUiModule(statement.moduleSpecifier.text)
      if (module !== undefined) modules.add(module)
    }
    importsOf.set(file.replace(/\.tsx?$/, ''), modules)
  }
  const importedAnywhere = new Set([...importsOf.values()].flatMap((s) => [...s]))

  /** Base UI's helpers, which no component is built on: an import of one says to ask. */
  const UTILITIES = new Set(['', 'types', 'use-render', 'merge-props', 'csp-provider', 'direction-provider', 'unstable-use-media-query'])

  it('names every Base UI part the package imports', () => {
    const unnamed = [...importedAnywhere].filter((m) => !UTILITIES.has(m) && !BASE_UI_PARTS[m])
    expect(unnamed).toEqual([])
    expect(importedAnywhere.size).toBeGreaterThan(20)
  })

  it('names, for each part, a component whose own file imports it', () => {
    for (const [module, part] of Object.entries(BASE_UI_PARTS)) {
      if (!part) continue
      const file = exportedFrom.get(part.use)
      expect(file, `${part.use} is exported`).toBeDefined()
      expect([...(importsOf.get(file as string) ?? [])], `${part.use} (${file}) imports @base-ui/react/${module}`).toContain(module)
    }
  })

  it('says "no part yet" only for parts no component imports', () => {
    const named = Object.entries(BASE_UI_PARTS).filter(([, part]) => part === null).map(([module]) => module)
    expect(named.filter((m) => importedAnywhere.has(m))).toEqual([])
  })

  it("covers every module Base UI publishes", () => {
    const base = createRequire(import.meta.url)('@base-ui/react/package.json') as { exports: Record<string, unknown> }
    const published = Object.keys(base.exports)
      .filter((key) => key.startsWith('./') && !key.startsWith('./internals/') && !key.endsWith('.json'))
      .map((key) => key.slice(2))
    expect(published.filter((m) => !UTILITIES.has(m) && !Object.hasOwn(BASE_UI_PARTS, m))).toEqual([])
  })

  it('names only components the package exports, everywhere it names one', () => {
    const messages = Object.values(noRebuiltBehaviour.meta?.messages ?? {}).join(' ')
    const tables = JSON.stringify([BASE_UI_PARTS, ROLE_PARTS, OWNED_BEHAVIOURS.map((b) => b.owners)])
    const named = new Set([...`${messages} ${tables}`.matchAll(/`([A-Z]\w+)`|"use":"(\w+)"|"([A-Z]\w+)"/g)].map((m) => m[1] ?? m[2] ?? m[3]))
    expect([...named].filter((name) => !exportedFrom.has(name))).toEqual([])
  })

  it('has one row per behaviour, each naming an owner and what it reads', () => {
    expect(OWNED_BEHAVIOURS.map((b) => b.id)).toEqual(['base-ui', 'portal', 'press-outside', 'page-keys', 'focus', 'scroll-lock', 'follow', 'walking', 'role', 'tab-stop', 'scroll'])
    for (const row of OWNED_BEHAVIOURS) {
      expect(row.owners.length, row.id).toBeGreaterThan(0)
      expect(row.baseUi.length, row.id).toBeGreaterThan(0)
      expect(row.reads, row.id).not.toBe('')
    }
  })
})

describe('reading a class past its variants', () => {
  it('keeps brackets whole', () => {
    expect(utilityOf('[&_pre]:overflow-x-auto')).toBe('overflow-x-auto')
    expect(utilityOf('md:hover:overflow-auto')).toBe('overflow-auto')
    expect(utilityOf('[&:not(pre)>code]:overflow-y-scroll')).toBe('overflow-y-scroll')
    expect(utilityOf('!overflow-auto')).toBe('overflow-auto')
  })
})
