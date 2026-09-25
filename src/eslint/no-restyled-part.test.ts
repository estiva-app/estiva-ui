import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'eslint'
import ts from 'typescript'
import { parser } from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { isPlacement, noRestyledPart, PART_LOOK_PROPS, PLACEMENT } from './no-restyled-part'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
})

/**
 * The rule follows imports on disk, so its cases live in two small folders: an
 * app, whose files re-export and wrap the package's parts the ways Peek and Ship
 * do, and a copy of the package's own layout.
 */
const root = mkdtempSync(join(tmpdir(), 'no-restyled-part-'))
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
write('app/package.json', '{ "name": "app" }')
write('app/src/components/ui/Button.tsx', "export { Button, type ButtonProps } from '@estiva-app/ui'\n")
write('app/src/components/ui/index.ts', "export * from './Button'\n")
write('app/src/components/ui/Skeleton.tsx', "import { SkeletonList } from '@estiva-app/ui'\nexport const SkeletonSidebarList = SkeletonList\n")
write(
  'app/src/components/ui/EmptyState.tsx',
  "import { EmptyState as UiEmptyState, type EmptyStateProps } from '@estiva-app/ui'\nexport function EmptyState({ message = 'Nothing', ...rest }: EmptyStateProps) {\n  return <UiEmptyState message={message} {...rest} />\n}\n",
)
write(
  'app/src/components/ConversationCard.tsx',
  "import { Card, cn } from '@estiva-app/ui'\nexport function ConversationCard({ className, title }: { className?: string; title: string }) {\n  return <Card className={cn('relative', className)}>{title}</Card>\n}\n",
)
write('app/src/components/Button.tsx', 'export function Button() {\n  return null\n}\n')
write('pkg/package.json', '{ "name": "@estiva-app/ui" }')
write('pkg/src/index.ts', "export { Link, type LinkProps } from './Link'\nexport { Card } from './Card'\nexport { cn } from './cn'\n")
write('pkg/src/Link.tsx', 'export function Link() {\n  return null\n}\n')
write('pkg/src/cn.ts', 'export const cn = (...a: string[]) => a.join(" ")\n')

const app = join(root, 'app/src/Probe.tsx')
const pkg = join(root, 'pkg/src/Card.tsx')
const ui = (imports: string, body: string) => `import { ${imports} } from '@estiva-app/ui'\nexport function Probe() {\n  return (\n${body}\n  )\n}\n`
const local = (imports: string, from: string, body: string) => `import { ${imports} } from '${from}'\nexport function Probe() {\n  return (\n${body}\n  )\n}\n`
const USE_VARIANT_OR_SIZE = ' Use its `variant` or `size`.'
const restyled = (classes: string, where: string, use: string) =>
  `${classes} on ${where} changes how it looks. A part of @estiva-app/ui is placed from outside, never restyled: only space, size, flex and grid, and position pass in.${use} A look for what is around it goes on your own element around it.`
const restyledStyle = (keys: string, where: string, use: string) =>
  `${keys} in the \`style\` of ${where} changes how it looks. A part of @estiva-app/ui is placed from outside, never restyled, by class or by style: only space, size, flex and grid, and position pass in.${use} A look for what is around it goes on your own element around it.`
const noProp = (part: string) => ` \`${part}\` has no prop for this yet: ask Katerina, and it gets made in @estiva-app/ui.`

tester.run('no-restyled-part', noRestyledPart, {
  valid: [
    // placement, in every form it is written
    { name: 'space, size, flex and grid', filename: app, code: ui('Button', '    <Button className="mt-2 -mx-2 px-3 w-full min-w-0 h-[240px] flex-1 shrink-0 gap-2 col-start-2 row-span-2 self-start">x</Button>') },
    { name: 'shown or hidden, and position', filename: app, code: ui('Card', '    <Card className="hidden md:block relative z-10 inset-0 items-center justify-between" />') },
    { name: 'placement behind a breakpoint, a theme or a state', filename: app, code: ui('Card', '    <Card className="sm:w-1/2 signal:gap-3 data-[open]:flex-col group-hover:flex" />') },
    { name: 'a name for hover draws nothing', filename: app, code: ui('Card', '    <Card className="group group/row" />') },
    { name: 'cn, a condition and a template, all placement', filename: app, code: ui('Button, cn', '    <Button className={cn(\'mt-2\', wide ? \'w-full\' : \'w-auto\', open && `gap-${1}`)}>x</Button>') },
    { name: 'a class the code works out while it runs passes', filename: app, code: ui('Button', '    <Button className={props.className}>x</Button>') },
    { name: 'an inner box’s own class prop, placement', filename: app, code: ui('ScrollArea', '    <ScrollArea className="min-h-0" contentClassName="flex flex-col gap-6 px-6 pb-5" viewportClassName="max-h-[70vh]" />') },
    { name: 'a raw element is not a part', filename: app, code: ui('Button', '    <div className="bg-bg-surface text-h2 rounded-lg" />') },
    { name: 'an app component of the same name is not a part', filename: app, code: local('Button', './components/Button', '    <Button className="text-h2" />') },
    { name: 'a style prop is not a class prop', filename: app, code: ui('Button', '    <Button style={{ width: 20 }} data-class="text-h2">x</Button>') },
    // style on a part: placement keys pass (B6)
    { name: 'style: space, size, position and a move', filename: app, code: ui('Card', "    <Card style={{ marginTop: 4, 'paddingInline': 8, width: '50%', maxHeight: 240, flexGrow: 1, gridColumn: '1 / 3', position: 'absolute', top: 0, zIndex: 2, transform: `translateY(${y}px)` }} />") },
    { name: 'style: a const of placement, and a custom property', filename: app, code: "import { Card } from '@estiva-app/ui'\nconst at = { top: 0, left: 0 }\nexport function Probe() {\n  return <Card style={at}><Card style={{ '--row': 2 }} /></Card>\n}\n" },
    { name: 'style the code works out while it runs passes', filename: app, code: ui('Card', '    <Card style={props.style} />') },
    { name: 'style on a component that hands on only its className is not read', filename: app, code: local('ConversationCard', './components/ConversationCard', '    <ConversationCard title="x" style={{ opacity: 0.5 }} />') },
    { name: 'EmptyState placed', filename: app, code: ui('EmptyState', '    <EmptyState className="mt-2 flex-1" message="Nothing yet" />') },
    // escapes
    { name: 'escaped, with its reason', filename: app, code: ui('Link', '    // @estiva-escape(no-restyled-part): the whole row is the link, and no part does that yet\n    <Link href="/x" className="after:absolute after:inset-0">x</Link>') },
    // the package itself
    { name: 'inside the package: a name index.ts does not export', filename: pkg, code: local('Base', './Base', '    <Base className="text-h2" />') },
    { name: 'inside the package: a raw element in a part', filename: pkg, code: 'export function Card() {\n  return <div className="rounded-lg border" />\n}\n' },
  ],
  invalid: [
    {
      name: 'style: a corner, an opacity, a weight and a line height (B6)',
      filename: app,
      code: ui('Button', '    <Button style={{ borderRadius: 999, opacity: 0.4, fontWeight: 700, lineHeight: 2, marginTop: 4 }}>x</Button>'),
      errors: [{ message: restyledStyle('`borderRadius` `opacity` `fontWeight` `lineHeight`', '`Button`', USE_VARIANT_OR_SIZE) }],
    },
    {
      name: 'style: quoted keys, a const, and a re-export',
      filename: app,
      code: "import { Button } from './components/ui'\nconst look = { 'background': 'red' } as const\nexport function Probe() {\n  return <Button style={look}>x</Button>\n}\n",
      errors: [{ message: restyledStyle('`background`', '`Button`', USE_VARIANT_OR_SIZE) }],
    },
    {
      name: 'a colour and a text size, naming the props that carry a look',
      filename: app,
      code: ui('Button', '    <Button className="mt-2 text-text-secondary text-caption">x</Button>'),
      errors: [{ message: restyled('`text-text-secondary` `text-caption`', '`Button`', USE_VARIANT_OR_SIZE) }],
    },
    {
      name: 'a part with no look prop says to ask',
      filename: app,
      code: ui('EditableText', '    <EditableText className="-mx-2 text-h2" value="" placeholder="" label="Title" onCommit={() => true} />'),
      errors: [{ message: restyled('`text-h2`', '`EditableText`', noProp('EditableText')) }],
    },
    {
      name: 'border, corner, shadow, clipping, wrapping and effects',
      filename: app,
      code: ui('ScrollArea', '    <ScrollArea className="overflow-hidden rounded-lg border border-border-default shadow-md truncate transition-colors">x</ScrollArea>'),
      errors: [{ message: restyled('`overflow-hidden` `rounded-lg` `border` `border-border-default` `shadow-md` `truncate` `transition-colors`', '`ScrollArea`', noProp('ScrollArea')) }],
    },
    {
      name: 'a look behind a variant, and an extra layer',
      filename: app,
      code: ui('Link', '    <Link href="/x" className="signal:hover:bg-success-muted after:absolute [&>*]:shrink-0">x</Link>'),
      errors: [{ message: restyled('`signal:hover:bg-success-muted` `after:absolute` `[&>*]:shrink-0`', '`Link`', ' Use its `variant` or `truncate`.') }],
    },
    {
      name: 'an inner box’s class prop',
      filename: app,
      code: ui('DialogShell', '    <DialogShell title="t" onClose={close} bodyClassName="flex flex-col text-body-2">x</DialogShell>'),
      errors: [{ message: restyled('`text-body-2`', "`DialogShell`'s `bodyClassName`", noProp('DialogShell')) }],
    },
    {
      name: 'cn, both sides of a condition, a template and a clsx object',
      filename: app,
      code: ui('Card, cn', "    <Card className={cn('p-3', active ? 'bg-bg-active' : 'text-h5', `flex ${big ? 'rounded-lg' : ''}`, { 'text-text-muted': muted })} />"),
      errors: [{ message: restyled('`bg-bg-active` `text-h5` `rounded-lg` `text-text-muted`', '`Card`', ` Use its ${'`fill`, `hover`, `attention`, `selected`, `active`, `hovered`, `quietUntilHover`, `unreadable` or `clip`'}.`) }],
    },
    {
      name: 'a const in the same file, and a class map read from one',
      filename: app,
      code: "import { Person } from '@estiva-app/ui'\nconst NAME = 'text-caption'\nconst toneStyles = { quiet: 'text-text-muted', loud: { strong: 'font-semibold' } } as const\nexport function Probe({ tone }: { tone: 'quiet' | 'loud' }) {\n  return <Person className={`${NAME} ${toneStyles[tone]}`} name=\"x\" />\n}\n",
      errors: [{ message: restyled('`text-caption` `text-text-muted` `font-semibold`', '`Person`', ' Use its `size`.') }],
    },
    {
      name: 'a const object spread onto the part',
      filename: app,
      code: "import { InlineChip } from '@estiva-app/ui'\nexport function Probe() {\n  const chip = { tone: 'neutral', className: 'text-h2' } as const\n  return <InlineChip {...chip}>x</InlineChip>\n}\n",
      errors: [{ message: restyled('`text-h2`', '`InlineChip`', noProp('InlineChip')) }],
    },
    {
      name: 'a namespace import',
      filename: app,
      code: "import * as UI from '@estiva-app/ui'\nexport function Probe() {\n  return <UI.Chip className=\"text-h2\" label=\"x\" />\n}\n",
      errors: [{ message: restyled('`text-h2`', '`Chip`', ' Use its `type`.') }],
    },
    {
      name: 'a re-export through an app file, by the @/ alias',
      filename: app,
      code: local('Button', '@/components/ui/Button', '    <Button className="text-h2">x</Button>'),
      errors: [{ message: restyled('`text-h2`', '`Button`', USE_VARIANT_OR_SIZE) }],
    },
    {
      name: 'a re-export through a barrel, by a relative path',
      filename: app,
      code: local('Button', './components/ui', '    <Button className="text-h2">x</Button>'),
      errors: [{ message: restyled('`text-h2`', '`Button`', USE_VARIANT_OR_SIZE) }],
    },
    {
      name: 'a part given another name in an app file',
      filename: app,
      code: local('SkeletonSidebarList', '@/components/ui/Skeleton', '    <SkeletonSidebarList className="rounded-lg" />'),
      errors: [{ message: restyled('`rounded-lg`', '`SkeletonList`', noProp('SkeletonList')) }],
    },
    {
      name: 'a wrapper that hands its props on, and EmptyState’s padding',
      filename: app,
      code: local('EmptyState', '@/components/ui/EmptyState', '    <EmptyState className="px-3 py-2 text-text-muted" />'),
      errors: [
        { message: restyled('`text-text-muted`', '`EmptyState`', ' Use its `scope`.') },
        { message: '`px-3` `py-2` pads `EmptyState`. EmptyState takes no padding (Katerina, 14 September): its room comes from the box its rows live in, so put the padding on that box.' },
      ],
    },
    {
      name: 'an app component that hands its className on to a part',
      filename: app,
      code: local('ConversationCard', '@/components/ConversationCard', '    <ConversationCard title="t" className="mt-2 bg-bg-hover" />'),
      errors: [{ message: restyled('`bg-bg-hover`', '`ConversationCard` (it hands its `className` to `Card`)', ` Use its ${'`fill`, `hover`, `attention`, `selected`, `active`, `hovered`, `quietUntilHover`, `unreadable` or `clip`'}.`) }],
    },
    {
      name: 'a wrapper declared in the same file',
      filename: app,
      code: "import { Link, type LinkProps } from '@estiva-app/ui'\nfunction RouterLink({ href, ...props }: LinkProps) {\n  return <Link href={href} {...props} />\n}\nexport function Probe() {\n  return <RouterLink href=\"/x\" className=\"text-h5\">x</RouterLink>\n}\n",
      errors: [{ message: restyled('`text-h5`', '`RouterLink` (it hands its props to `Link`)', ' Use its `variant` or `truncate`.') }],
    },
    {
      name: 'EmptyState padded directly',
      filename: app,
      code: ui('EmptyState', '    <EmptyState className="py-6" message="Nothing yet" />'),
      errors: [{ message: '`py-6` pads `EmptyState`. EmptyState takes no padding (Katerina, 14 September): its room comes from the box its rows live in, so put the padding on that box.' }],
    },
    {
      name: 'an escape with no reason is reported, and so is the class',
      filename: app,
      code: ui('Link', '    // @estiva-escape(no-restyled-part):\n    <Link href="/x" className="text-h2">x</Link>'),
      errors: [{ messageId: 'escapeWithoutReason' }, { message: restyled('`text-h2`', '`Link`', ' Use its `variant` or `truncate`.') }],
    },
    {
      name: 'inside the package: a part imported from a sibling',
      filename: pkg,
      code: local('Link', './Link', '    <Link href="/x" className="rounded-lg border">x</Link>'),
      errors: [{ message: restyled('`rounded-lg` `border`', '`Link`', ' Use its `variant` or `truncate`.') }],
    },
    {
      name: 'inside the package: a part used in the file that declares it',
      filename: pkg,
      code: 'export function Link() {\n  return null\n}\nexport function Probe() {\n  return <Link className="text-caption" />\n}\n',
      errors: [{ message: restyled('`text-caption`', '`Link`', ' Use its `variant` or `truncate`.') }],
    },
  ],
})

/** Every part the package exports, from its own index.ts. */
const SRC = new URL('..', import.meta.url)
const indexSource = readFileSync(new URL('index.ts', SRC), 'utf8')
const PARTS = [...indexSource.matchAll(/export \{([^}]*)\} from '\.\/[^']+'/g)]
  .flatMap((m) => m[1].split(','))
  .map((name) => name.trim())
  .filter((name) => /^[A-Z][a-z]/.test(name))

describe('every part of the package is covered, by where it comes from', () => {
  it('finds the parts', () => {
    expect(PARTS.length).toBeGreaterThan(70)
    expect(PARTS).toContain('EnterHint')
  })
  tester.run('no-restyled-part, one case per exported part', noRestyledPart, {
    valid: [],
    invalid: PARTS.map((part) => ({
      name: `${part}, restyled`,
      filename: app,
      code: ui(part, `    <${part} className="bg-bg-surface" />`),
      errors: [{ message: restyled('`bg-bg-surface`', `\`${part}\``, PART_LOOK_PROPS[part] ? ` Use its ${PART_LOOK_PROPS[part].length === 1 ? `\`${PART_LOOK_PROPS[part][0]}\`` : `${PART_LOOK_PROPS[part].slice(0, -1).map((p) => `\`${p}\``).join(', ')} or \`${PART_LOOK_PROPS[part].at(-1)}\``}.` : noProp(part)) }],
    })),
  })
})

describe('the placement list', () => {
  it('lets placement through and stops a look', () => {
    for (const token of ['m-2', '-mt-px', 'px-3', 'w-[244px]', 'max-h-[70vh]', 'flex', 'flex-col', 'grow', 'basis-1/2', 'gap-x-2', 'space-y-1', 'col-span-2', 'row-start-1', 'order-last', 'self-end', 'justify-between', 'items-center', 'content-start', 'hidden', 'inline-flex', 'relative', '-top-1', 'z-10', 'group', '!mt-2', 'md:hidden'])
      expect(isPlacement(token), token).toBe(true)
    for (const token of ['text-h2', 'text-text-primary', 'bg-bg-surface', 'border', 'border-t', 'rounded-lg', 'shadow-md', 'font-mono', 'truncate', 'whitespace-nowrap', 'break-all', 'overflow-hidden', 'opacity-70', 'transition-colors', 'cursor-pointer', 'pointer-events-none', 'resize-none', 'content-[\'x\']', 'placeholder-text-muted', 'after:absolute', '[&>*]:shrink-0', '*:mt-2', 'ring-1'])
      expect(isPlacement(token), token).toBe(false)
  })
  it('names what each entry lets through', () => {
    expect(PLACEMENT.map((p) => p.what)).toEqual(['space around', 'space inside', 'width and height', 'shown, and how it lays out', 'its place in a row or a grid', 'alignment', 'position', 'a name for hover'])
  })
})

/**
 * The message names the props a part has for how it looks. They are read here
 * from the package's own source with the TypeScript parser: every prop named
 * exists on its part, and every prop of one of these names that a part has is
 * named.
 */
describe('the look props the message names are the package’s own', () => {
  const LOOK_NAMES = new Set(['variant', 'size', 'tone', 'fill', 'type', 'scope', 'layout', 'surface', 'pressed', 'attention', 'truncate', 'mono'])
  const files = readdirSync(SRC).filter((f) => f.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(f))
  const interfaces = new Map<string, ts.InterfaceDeclaration>()
  const functions = new Map<string, ts.FunctionDeclaration>()
  const aliases = new Map<string, ts.TypeNode>()
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(new URL(file, SRC), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    source.forEachChild(function visit(node) {
      if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node)
      if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node)
      if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type)
      node.forEachChild(visit)
    })
  }
  /** A prop that chooses between fixed looks: a set of words, a yes/no, or a number (a face's size). */
  const choosesALook = (type: ts.TypeNode | undefined): boolean => {
    if (!type) return false
    if (type.kind === ts.SyntaxKind.BooleanKeyword || type.kind === ts.SyntaxKind.NumberKeyword) return true
    if (ts.isTypeReferenceNode(type)) return choosesALook(aliases.get(type.typeName.getText()))
    if (ts.isUnionTypeNode(type)) return type.types.every((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))
    return ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)
  }
  /** A part's own props (not the HTML element's it extends), and whether each chooses a look. */
  const propsOf = (part: string): Map<string, boolean> => {
    const props = new Map<string, boolean>()
    const add = (member: ts.TypeElement) => {
      if (member.name) props.set(member.name.getText(), ts.isPropertySignature(member) && choosesALook(member.type))
    }
    const fromInterface = (name: string) => {
      const declaration = interfaces.get(name)
      if (!declaration) return false
      declaration.members.forEach(add)
      for (const clause of declaration.heritageClauses ?? []) for (const type of clause.types) fromInterface(type.expression.getText())
      return true
    }
    if (!fromInterface(`${part}Props`)) {
      const type = functions.get(part)?.parameters[0]?.type
      if (type && ts.isTypeLiteralNode(type)) type.members.forEach(add)
    }
    return props
  }

  it('every prop the message names exists on its part', () => {
    for (const [part, props] of Object.entries(PART_LOOK_PROPS)) {
      expect(PARTS, part).toContain(part)
      const own = propsOf(part)
      for (const prop of props) expect(own.get(prop), `${part}.${prop}`).toBe(true)
    }
  })

  /** Named like a look, and not one: AttachmentCard's `size` is the file's, in bytes. */
  const NOT_A_LOOK: Record<string, string[]> = { AttachmentCard: ['size'] }

  it('every look prop a part has is named', () => {
    for (const part of PARTS) {
      const missing = [...propsOf(part)]
        .filter(([prop, chooses]) => chooses && LOOK_NAMES.has(prop) && !(PART_LOOK_PROPS[part] ?? []).includes(prop) && !(NOT_A_LOOK[part] ?? []).includes(prop))
        .map(([prop]) => prop)
      expect(missing, part).toEqual([])
    }
  })
})
