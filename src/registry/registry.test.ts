import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { OWNED_BEHAVIOURS } from '../eslint/index'
import { buildRegistry, readIndexExports, serializeRegistry } from './build'
import { findInRegistry } from './find'
import { SCHEMA_VERSION, validateRegistry, type Registry, type RegistryEntry } from './schema'

/**
 * The catalogue (UIG-12).
 *
 * Three things are held here, and each of them has failed once already while
 * this was being written:
 *
 * 1. **The committed file is what the code produces.** A registry that can
 *    drift is a registry nobody can trust, and the whole reason for generating
 *    it rather than writing it is gone.
 * 2. **The story ids resolve.** They were derived wrongly at first —
 *    `--withcounts` for a story Storybook calls `--with-counts` — and 11 of the
 *    81 pointed nowhere. A real `storybook build` was the only thing that said
 *    so, so the ids it produced are written down here.
 * 3. **Every export is accounted for.** Entries plus explained exclusions must
 *    equal what `index.ts` exports, or the count has been averaged away.
 */
const root = process.cwd()
const registry = buildRegistry({ root })
const entry = (name: string): RegistryEntry => {
  const found = registry.entries.find((candidate) => candidate.name === name)
  if (!found) throw new Error(`no entry for ${name}`)
  return found
}

describe('the registry builds', () => {
  it('matches its own schema', () => {
    expect(validateRegistry(registry)).toEqual([])
  })

  it('accounts for every value export of index.ts', () => {
    const exported = readIndexExports(readFileSync(join(root, 'src', 'index.ts'), 'utf8'))
    const values = exported.filter((one) => !one.isType)
    expect(registry.builtFrom.exports).toBe(values.length)
    expect(registry.entries.length + registry.excluded.length).toBe(values.length)
    // Nothing silently dropped: the names match, not only the count.
    expect(registry.entries.map((one) => one.name).sort()).toEqual(values.map((one) => one.name).sort())
  })

  it('counts 88 names over 58 files: 81 components, 6 helpers and 1 hook (Panel joined on 26 September)', () => {
    // The reconciliation GATES.md §24 explains. If this changes, that changes.
    const kinds = registry.entries.reduce<Record<string, number>>((all, one) => ({ ...all, [one.kind]: (all[one.kind] ?? 0) + 1 }), {})
    expect(kinds).toEqual({ component: 81, helper: 6, hook: 1 })
    expect(new Set(registry.entries.map((one) => one.sourceFile)).size).toBe(58)
  })

  it('gives every entry a purpose, from its own page or from the comment above it', () => {
    expect(registry.entries.filter((one) => one.purpose.trim() === '')).toEqual([])
    expect(registry.entries.filter((one) => one.purposeFrom === 'page').length).toBe(58)
    expect(registry.entries.filter((one) => one.purposeFrom === 'comment').length).toBe(30)
  })

  it('takes a name with a page of its own from the page, and a name without one from the code', () => {
    expect(entry('Menu').purposeFrom).toBe('page')
    expect(entry('Menu').docPage).toBe('src/Menu.mdx')
    // MenuSub is documented inside Menu's page, so its line is the one above it
    // in Menu.tsx. Its docs id is still Menu's page, which is where it is
    // explained.
    expect(entry('MenuSub').purposeFrom).toBe('comment')
    expect(entry('MenuSub').docPage).toBeNull()
    expect(entry('MenuSub').docsId).toBe('overlays-menu--docs')
    expect(entry('MenuSub').sourceFile).toBe('src/Menu.tsx')
  })

  it('reads the behaviours from UIG-8 rather than a list of its own', () => {
    const ids = new Set(OWNED_BEHAVIOURS.map((owned) => owned.id))
    for (const one of registry.entries) {
      for (const owned of one.ownsBehaviours) expect(ids).toContain(owned.id)
    }
    expect(entry('ScrollArea').ownsBehaviours.map((owned) => owned.id)).toContain('scroll')
    expect(entry('Popover').ownsBehaviours.map((owned) => owned.id)).toContain('portal')
    expect(entry('Card').ownsBehaviours).toEqual([])
  })

  // B9: worked out from what a part draws and what it is, not only UIG-8's owners.
  it('gives a part what the part it is owns, and a Base UI piece only what it is', () => {
    const ids = (name: string) => entry(name).ownsBehaviours.map((owned) => owned.id)
    // ConfirmDialog returns a DialogShell: it keeps focus inside and stops the page scrolling.
    expect(ids('ConfirmDialog')).toEqual(expect.arrayContaining(['portal', 'focus', 'scroll-lock', 'press-outside']))
    // MenuItem draws Menu.Item: a menu item, not a floating menu.
    expect(ids('MenuItem')).toEqual(expect.arrayContaining(['base-ui', 'role']))
    expect(ids('MenuItem')).not.toContain('portal')
    // A tooltip's floating stays the tooltip's.
    expect(ids('NavItem')).not.toContain('portal')
    // Being built on Base UI, a role and a Tab stop are not handed on.
    expect(ids('EmptyState')).not.toContain('tab-stop')
  })

  it('reads the variants from the props type, following a local alias', () => {
    // ButtonVariant and ButtonSize are aliases; the props type points at them.
    expect(entry('Button').variants).toEqual([
      { prop: 'variant', values: ['primary', 'outlined', 'muted', 'destructive', 'resolve'] },
      { prop: 'size', values: ['default', 'small'] },
    ])
    expect(entry('Menu').variants).toEqual([{ prop: 'align', values: ['left', 'right'] }])
  })

  it('carries every prop a component declares itself, not only the word-choices', () => {
    // The catalogue's plain-words job is "what it can do". Built first with
    // variants alone, it carried 33 of 336 — a tenth of the answer.
    const all = registry.entries.flatMap((one) => one.props)
    expect(all.length).toBeGreaterThan(330)
    expect(registry.entries.filter((one) => one.props.length).length).toBeGreaterThan(65)
    // The question that started this: does Link already truncate?
    expect(entry('Link').props.find((prop) => prop.name === 'truncate')).toEqual({
      name: 'truncate',
      takes: 'true/false',
      required: false,
      note: 'One line, cut with an ellipsis when it does not fit — a title that is a link.',
    })
    expect(entry('Link').props.find((prop) => prop.name === 'href')?.required).toBe(true)
  })

  it('says what a prop takes in words a person reads', () => {
    const takes = (name: string, prop: string) => entry(name).props.find((one) => one.name === prop)?.takes
    expect(takes('Link', 'external')).toBe('true/false')
    expect(takes('Link', 'href')).toBe('text')
    expect(takes('Link', 'children')).toBe('anything')
    expect(takes('Button', 'variant')).toBe('primary | outlined | muted | destructive | resolve')
    expect(takes('Popover', 'actionsRef')).toBe('a handler')
  })

  it('gives every prop a type that is actually a type', () => {
    // The guard for a whole class of fault. A `ts.TypeElement` carries offsets
    // into its *own* file, so reading a sibling's node with this file's text
    // slices the wrong source: `ToolbarButton` came out with `variant: "ats
    // over what it a"` and `children: "omeAndEndK"`. Real names, prose for
    // types, and every name-based check passed.
    const FRIENDLY = new Set(['anything', 'a handler', 'true/false', 'number', 'text'])
    const sources = readdirSync(join(root, 'src'))
      .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map((file) => readFileSync(join(root, 'src', file), 'utf8'))
      .join('\n')
    const bad: string[] = []
    for (const one of registry.entries) {
      for (const prop of one.props) {
        if (FRIENDLY.has(prop.takes)) continue
        const parsed = ts.createSourceFile('t.ts', `type X = ${prop.takes}`, ts.ScriptTarget.Latest, false)
        // @ts-expect-error parseDiagnostics is internal, and is the only thing that says "this is not a type".
        const errors = (parsed.parseDiagnostics ?? []) as unknown[]
        if (errors.length) {
          bad.push(`${one.name}.${prop.name}: ${JSON.stringify(prop.takes)} does not parse as a type`)
          continue
        }
        // A name that parses but names nothing: `omeAndEndK`, a slice of
        // `HomeAndEndKeys`, is a legal type reference and not a real one.
        if (/^[A-Za-z_$][\w$]*$/.test(prop.takes) && !new RegExp(`\\b${prop.takes}\\b`).test(sources)) {
          bad.push(`${one.name}.${prop.name}: ${JSON.stringify(prop.takes)} is not a word anywhere in src/`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('reads an inherited prop exactly as the file that declares it does', () => {
    // Every one of these was wrong at once, and all four had the same cause.
    const prop = (name: string, key: string) => entry(name).props.find((one) => one.name === key)

    // ToolbarButtonProps extends IconButtonProps, in another file.
    expect(prop('ToolbarButton', 'variant')).toEqual(prop('IconButton', 'variant'))
    expect(entry('ToolbarButton').variants).toContainEqual({ prop: 'variant', values: ['muted', 'outlined', 'primary', 'current', 'resolve'] })
    // type ToolbarInputProps = TextInputProps — an alias to another file, note and all.
    expect(prop('ToolbarInput', 'size')).toEqual(prop('TextInput', 'size'))
    // extends Omit<IdentityMenuProps, 'compact'>: the base was read as the name
    // `Omit`, so everything it wraps was lost.
    expect(entry('IdentityPanel').props.filter((one) => one.required).map((one) => one.name).sort()).toEqual(['me', 'signedIn'])
    // …and `Omit` drops what it names.
    expect(entry('IdentityPanel').props.some((one) => one.name === 'compact')).toBe(false)
    expect(entry('IdentityMenu').props.some((one) => one.name === 'compact')).toBe(true)
    expect(entry('PersonTrigger').props.map((one) => one.name)).toEqual(expect.arrayContaining(['name', 'picture', 'fallback', 'size']))
  })

  it('keeps variants a view of props, never a second reading', () => {
    for (const one of registry.entries) {
      for (const variant of one.variants) {
        const prop = one.props.find((candidate) => candidate.name === variant.prop)
        expect(prop, `${one.name}.${variant.prop}`).toBeDefined()
        expect(prop?.takes).toBe(variant.values.join(' | '))
      }
    }
  })

  it('reads them however the component was written', () => {
    // Written out at the parameter, with no named type at all.
    expect(entry('SectionLabel').variants).toEqual([{ prop: 'tone', values: ['primary', 'secondary', 'muted'] }])
    // forwardRef: the props are its second type argument, and the inner
    // function's parameter is bare.
    expect(entry('TextInput').variants).toEqual([{ prop: 'size', values: ['default', 'small'] }])
  })

  it('misses no set of words any component file declares', () => {
    // Both of the above were found this way, in the ten-entry spot check and
    // then in a sweep. The sweep stays: it is the thing that notices a way of
    // writing a component the builder has not met yet.
    const declared = new Map<string, Set<string>>()
    for (const one of registry.entries) {
      const props = declared.get(one.sourceFile) ?? new Set<string>()
      for (const variant of one.variants) props.add(variant.prop)
      declared.set(one.sourceFile, props)
    }
    const missed: string[] = []
    for (const [file, read] of declared) {
      const source = readFileSync(join(root, file), 'utf8')
      for (const match of source.matchAll(/(\w+)\??:\s*'[^']+'\s*\|\s*'[^']+'/g)) {
        if (!read.has(match[1])) missed.push(`${file}: ${match[1]}`)
      }
    }
    expect(missed).toEqual([])
  })

  it('leaves migrationStage null, because no source a build can read holds it', () => {
    expect(registry.entries.every((one) => one.migrationStage === null)).toBe(true)
  })

  it('never gives an export the file’s own header comment', () => {
    // Skeleton.tsx opens with a paragraph about the whole family and
    // `SkeletonBar` follows it directly. The bar was given the family's
    // description until the builder learnt to refuse a header.
    expect(entry('SkeletonBar').purpose).not.toMatch(/the generic parts only/)
    expect(entry('SkeletonBar').purpose).toMatch(/One pulsing bar/)
    // The opposite case: InlineChip.tsx has a header too, and
    // INLINE_CHIP_CLASSES has its own comment under it. That one is kept.
    expect(entry('INLINE_CHIP_CLASSES').purpose).toMatch(/every tone shares/)
  })
})

describe('the ids point at something', () => {
  /**
   * Taken from a real `npm run build-storybook` on 2026-09-18, which is the
   * only authority for these. Every one of the 81 was checked against that
   * build; these are the shapes that can break — a one-word export, a
   * many-word export, and a name documented on a sibling's page.
   */
  const REAL = [
    ['Button', 'primitives-button--docs', 'primitives-button--primary'],
    ['Tabs', 'navigation-tabs--docs', 'navigation-tabs--with-counts'],
    ['AvatarGroup', 'primitives-avatargroup--docs', 'primitives-avatargroup--three-members'],
    ['Breadcrumb', 'navigation-breadcrumb--docs', 'navigation-breadcrumb--on-an-item'],
    ['CommandPalette', 'overlays-commandpalette--docs', 'overlays-commandpalette--first-level'],
    ['ChipInput', 'inputs-chipinput--docs', 'inputs-chipinput--type-to-search'],
    ['EnterHint', 'overlays-menu--docs', 'overlays-menu--items'],
  ] as const

  it.each(REAL)('%s', (name, docsId, storyId) => {
    expect(entry(name).docsId).toBe(docsId)
    expect(entry(name).storyId).toBe(storyId)
  })

  it('gives every component a page and a story, and only a helper none', () => {
    const without = registry.entries.filter((one) => one.docsId === null || one.storyId === null)
    expect(without.map((one) => one.name)).toEqual(['cn'])
    expect(without.every((one) => one.kind !== 'component')).toBe(true)
  })

  /**
   * Skipped unless a Storybook has been built here. CI does not build one —
   * that is a job of its own and this is not worth it — but when a build is
   * present, every id is checked against it rather than against the seven above.
   */
  const index = join(root, 'storybook-static', 'index.json')
  it.skipIf(!existsSync(index))('every id is in a real Storybook build', () => {
    const real = new Set(Object.keys((JSON.parse(readFileSync(index, 'utf8')) as { entries: Record<string, unknown> }).entries))
    const missing = registry.entries.filter((one) => (one.docsId && !real.has(one.docsId)) || (one.storyId && !real.has(one.storyId)))
    expect(missing.map((one) => one.name)).toEqual([])
  })
})

/**
 * A second parser, which shares none of this one's assumptions.
 *
 * `react-docgen` is what Storybook builds its own Props table with. Comparing
 * against it is the only evidence here that is not this builder checking its own
 * work, and it earned its place immediately: it found **13 props over 10 files**
 * that were silently dropped because their names are quoted (`'aria-label'`),
 * two of them required; and `ToolbarButton` carrying one prop where it should
 * carry nine, because `ToolbarButtonProps extends IconButtonProps` — a type in
 * another file of this package.
 *
 * It arrives with `@storybook/react-vite` rather than as a dependency of its
 * own: adding one would have npm rewrite `package-lock.json`, which on Windows
 * drops the optional Linux entries CI installs. The test skips if it is ever
 * absent rather than pretending to have run.
 */
describe('a second parser agrees', async () => {
  const docgen = await import('react-docgen').catch(() => null)

  it.skipIf(!docgen)('finds the same props on all 79 components', async () => {
    if (!docgen) return
    const resolver = new docgen.builtinResolvers.FindExportedDefinitionsResolver({ limit: 0 })
    const byName = new Map(registry.entries.map((one) => [one.name, one]))
    const differences: string[] = []
    let seen = 0

    for (const file of new Set(registry.entries.map((one) => one.sourceFile))) {
      let docs
      try {
        docs = docgen.parse(readFileSync(join(root, file), 'utf8'), { filename: file, resolver })
      } catch {
        // `cn.ts` holds no component; react-docgen says so and there is nothing to compare.
        continue
      }
      for (const doc of docs) {
        const entry = doc.displayName ? byName.get(doc.displayName) : undefined
        if (!entry) continue
        seen += 1
        const theirs = new Set(Object.keys(doc.props ?? {}))
        const mine = new Set(entry.props.map((prop) => prop.name))
        for (const prop of theirs) if (!mine.has(prop) && !INHERITED_WITH_A_DEFAULT.has(`${entry.name}.${prop}`)) differences.push(`${entry.name}.${prop} is docgen's and not ours`)
        for (const prop of mine) if (!theirs.has(prop) && !DOCGEN_STOPS_AT_OMIT.has(`${entry.name}.${prop}`)) differences.push(`${entry.name}.${prop} is ours and not docgen's`)
      }
    }

    expect(differences).toEqual([])
    expect(seen).toBe(registry.entries.filter((one) => one.kind === 'component').length)
  })
})

/**
 * The four the two parsers are *meant* to disagree on.
 *
 * Each is a DOM attribute the component does not declare — it inherits it from
 * `ComponentPropsWithRef<'button'>` or `InputHTMLAttributes` — and only gives a
 * default while destructuring. react-docgen reports everything inherited; this
 * registry lists what a component declares itself, because otherwise every entry
 * carries `onCopy` and `spellCheck` and buries its own answer.
 */
const INHERITED_WITH_A_DEFAULT = new Set(['Button.type', 'IconButton.type', 'TextInput.type', 'SearchInput.placeholder'])

/**
 * The eighteen where **this registry is right and `react-docgen` is not**.
 *
 * `IdentityPanelProps extends Omit<IdentityMenuProps, 'compact'>` and
 * `PersonTriggerProps extends Omit<PersonProps, 'className'>`: docgen does not
 * follow a heritage clause wrapped in `Omit`, so it reports neither `me` nor
 * `signedIn`, which `IdentityPanel` *requires*. `ToolbarLinkProps extends
 * Omit<IconButtonProps, …>` (UIG-14, F3) is the same: docgen reports none of
 * the IconButton props it keeps. Checked against the source —
 * `IdentityMenuProps` declares both, and `IdentityPanel` spreads `...rest`
 * straight into `IdentityRows`, which destructures them.
 *
 * Listed rather than waved through, so the day docgen learns to follow them
 * this fails and the list goes.
 */
const DOCGEN_STOPS_AT_OMIT = new Set([
  'IdentityPanel.me',
  'IdentityPanel.signedIn',
  'IdentityPanel.relayUrl',
  'IdentityPanel.idBase',
  'IdentityPanel.onCopyKey',
  'IdentityPanel.onSignOut',
  'IdentityPanel.className',
  'IdentityPanel.children',
  'PersonTrigger.name',
  'PersonTrigger.picture',
  'PersonTrigger.fallback',
  'PersonTrigger.size',
  'ToolbarLink.variant',
  'ToolbarLink.glow',
  'ToolbarLink.tooltip',
  'ToolbarLink.tooltipShortcut',
  'ToolbarLink.tooltipPlacement',
  'ToolbarLink.children',
])

describe('ui:find', () => {
  const names = (query: string) => findInRegistry(registry, query).map((finding) => finding.entry.name)

  // The ticket's three. Regression tests, not the scope.
  it('finds Popover for "floating panel"', () => expect(names('floating panel')[0]).toBe('Popover'))
  it('finds ScrollArea for "scrolling"', () => expect(names('scrolling')[0]).toBe('ScrollArea'))
  it('finds EmptyState for "empty"', () => expect(names('empty')[0]).toBe('EmptyState'))

  it('takes a name apart, so "palette" reaches CommandPalette', () => {
    expect(names('palette')).toContain('CommandPalette')
  })

  it('answers what a component can do, and names the prop that does it', () => {
    const found = findInRegistry(registry, 'truncate a long link')
    expect(found[0].entry.name).toBe('Link')
    expect(found[0].props).toContain('truncate')
  })

  it('ignores the words that are in every sentence', () => {
    // "a" appears inside nearly every prop note ("in a new tab"), and an exact
    // match skipped the minimum length. It pulled Link's `external` into the
    // answer for a question that never mentioned it.
    expect(findInRegistry(registry, 'truncate a long link')[0].props).not.toContain('external')
    // A question made only of them still answers something rather than nothing.
    expect(findInRegistry(registry, 'the a of')).not.toEqual([])
  })

  it('shows a prop the question named, not one whose note happens to say the word', () => {
    // Six of Popover's notes say "panel"; showing all six buries the answer.
    const found = findInRegistry(registry, 'floating panel')
    expect(found[0].entry.name).toBe('Popover')
    expect(found[0].props.filter((name) => !['align', 'side'].includes(name))).toEqual([])
  })

  it('does not match on a one-letter word', () => {
    // `person's` puts "s" in Avatar's purpose; before the minimum length,
    // "scrolling" found it.
    expect(names('scrolling')).not.toContain('Avatar')
  })

  it('answers nothing rather than anything', () => {
    expect(findInRegistry(registry, 'kubernetes ingress')).toEqual([])
    expect(findInRegistry(registry, '')).toEqual([])
  })

  it('ranks a row that answers more of the question first', () => {
    const found = findInRegistry(registry, 'floating panel')
    expect(found[0].entry.name).toBe('Popover')
    expect(found[0].matched).toBe(2)
  })
})

describe('the committed registry.json', () => {
  const committed = join(root, 'registry.json')

  it('is what the code produces', () => {
    // Line endings are the checkout's (core.autocrlf is true here); the bytes
    // that matter are everything else.
    expect(readFileSync(committed, 'utf8').replace(/\r\n/g, '\n')).toBe(serializeRegistry(registry))
  })

  it('validates on its own, as a reader loads it', () => {
    expect(validateRegistry(JSON.parse(readFileSync(committed, 'utf8')) as Registry)).toEqual([])
  })
})

describe('validateRegistry refuses', () => {
  const broken = (change: (copy: Registry) => void): string[] => {
    const copy = JSON.parse(JSON.stringify(registry)) as Registry
    change(copy)
    return validateRegistry(copy)
  }

  it('a schema version it does not know', () => {
    expect(broken((copy) => (copy.schemaVersion = SCHEMA_VERSION + 1))[0]).toMatch(/schemaVersion/)
  })

  it('an entry with no purpose', () => {
    expect(broken((copy) => (copy.entries[0].purpose = '  ')).join(' ')).toMatch(/purpose.*is empty/)
  })

  it('the same name twice', () => {
    expect(broken((copy) => copy.entries.push({ ...copy.entries[0] })).join(' ')).toMatch(/appears twice/)
  })

  it('a count that does not reconcile', () => {
    expect(broken((copy) => copy.entries.pop()).join(' ')).toMatch(/but index\.ts exports/)
  })

  it('a component with nowhere to be looked at', () => {
    expect(
      broken((copy) => {
        const one = copy.entries.find((candidate) => candidate.kind === 'component')
        if (one) one.storyId = null
      }).join(' '),
    ).toMatch(/only a helper or a hook/)
  })
})
