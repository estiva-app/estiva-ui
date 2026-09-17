import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  it('counts 81 names over 53 files: 74 components, 6 helpers and 1 hook', () => {
    // The reconciliation GATES.md §24 explains. If this changes, that changes.
    const kinds = registry.entries.reduce<Record<string, number>>((all, one) => ({ ...all, [one.kind]: (all[one.kind] ?? 0) + 1 }), {})
    expect(kinds).toEqual({ component: 74, helper: 6, hook: 1 })
    expect(new Set(registry.entries.map((one) => one.sourceFile)).size).toBe(53)
  })

  it('gives every entry a purpose, from its own page or from the comment above it', () => {
    expect(registry.entries.filter((one) => one.purpose.trim() === '')).toEqual([])
    expect(registry.entries.filter((one) => one.purposeFrom === 'page').length).toBe(53)
    expect(registry.entries.filter((one) => one.purposeFrom === 'comment').length).toBe(28)
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

  it('reads the variants from the props type, following a local alias', () => {
    // ButtonVariant and ButtonSize are aliases; the props type points at them.
    expect(entry('Button').variants).toEqual([
      { prop: 'variant', values: ['primary', 'outlined', 'muted', 'destructive', 'resolve'] },
      { prop: 'size', values: ['default', 'small'] },
    ])
    expect(entry('Menu').variants).toEqual([{ prop: 'align', values: ['left', 'right'] }])
  })

  it('reads them however the component was written', () => {
    // Written out at the parameter, with no named type at all.
    expect(entry('SectionLabel').variants).toEqual([{ prop: 'tone', values: ['primary', 'secondary'] }])
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

describe('ui:find', () => {
  const names = (query: string) => findInRegistry(registry, query).map((finding) => finding.entry.name)

  // The ticket's three. Regression tests, not the scope.
  it('finds Popover for "floating panel"', () => expect(names('floating panel')[0]).toBe('Popover'))
  it('finds ScrollArea for "scrolling"', () => expect(names('scrolling')[0]).toBe('ScrollArea'))
  it('finds EmptyState for "empty"', () => expect(names('empty')[0]).toBe('EmptyState'))

  it('takes a name apart, so "palette" reaches CommandPalette', () => {
    expect(names('palette')).toContain('CommandPalette')
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
