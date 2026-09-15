import { useEffect, useLayoutEffect, useReducer, useRef, useState, type ReactNode } from 'react'

/**
 * The Design Tokens page: every token the preset names, its live value in the
 * theme chosen from the toolbar, and which components use it.
 *
 * Three things keep the page true without anyone maintaining it:
 * - Values are read from the CSS variables at render time. Nothing is typed in.
 * - "Used by" is read from the components' own source: Vite hands this file
 *   the raw `src/*.tsx` text, and a token's users are whichever files spell
 *   its class. The apps are not counted.
 * - A type specimen measures itself after it renders, so the size, line height
 *   and weight printed beside it are what the browser drew.
 *
 * The page renders inside Storybook's `<Unstyled>` block. Outside it, the docs
 * container sets 16px Nunito Sans on every div, at the same specificity as a
 * token class and later in the sheet, which is why the ramp used to look like
 * one size.
 */

/* ── Which component spells which token ── */

const SOURCES = import.meta.glob('../src/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const COMPONENTS = Object.entries(SOURCES)
  .filter(([path]) => !/\.(stories|test)\.tsx$/.test(path))
  .map(([path, source]) => ({ name: path.replace(/^.*\//, '').replace(/\.tsx$/, ''), source }))
  .sort((a, b) => a.name.localeCompare(b.name))

const COLOUR_UTILITIES = 'bg|text|border|ring|divide|placeholder|fill|stroke|outline'

/** Component names whose source uses `<utility>-<key>`, under any variant. */
function usedBy(key: string, utilities: string): string[] {
  const re = new RegExp(`(?:^|[^a-z0-9-])(?:[a-z]+:)*(?:${utilities})-${key}(?![a-z0-9-])`)
  return COMPONENTS.filter(({ source }) => re.test(source)).map(({ name }) => name)
}

/* ── Live values ── */

/** Re-render whenever the theme on <html> changes (toolbar, or a docs page's parent). */
function useThemeTick() {
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const obs = new MutationObserver(bump)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => obs.disconnect()
  }, [])
  return tick
}

function resolveVar(name: string): string {
  if (typeof window === 'undefined') return ''
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v.startsWith('#') ? v.toUpperCase() : v.replace(/\s+/g, ' ')
}

/* ── The vocabulary (mirrors tailwind-preset.js; tokens.test.ts holds the two together) ── */

type Swatch = 'fill' | 'text' | 'text-inverse' | 'border' | 'outline' | 'shadow' | 'drop-shadow'
type Token = { key: string; cssVar: string; cls: string; swatch: Swatch; note?: string }
type Family = { label: string; blurb: string; utilities: string; tokens: Token[] }

const colour = (prefix: string, key: string, swatch: Swatch, note?: string): Token => ({
  key: `${prefix}-${key}`,
  cssVar: `--${prefix}-${key}`,
  cls: `${swatch === 'text' || swatch === 'text-inverse' ? 'text' : swatch === 'border' || swatch === 'outline' ? 'border' : 'bg'}-${prefix}-${key}`,
  swatch,
  note,
})

const FAMILIES: Family[] = [
  {
    label: 'Background',
    blurb: 'What things sit on. Base is the page, surface a panel, elevated a popup, inset a field. Hover, selected and active are the row states; wash is the faint white a key face wears.',
    utilities: COLOUR_UTILITIES,
    tokens: ['base', 'surface', 'elevated', 'inset', 'hover', 'selected', 'active', 'disabled', 'wash'].map((k) => colour('bg', k, 'fill')),
  },
  {
    label: 'Text',
    blurb: 'Primary for content, secondary for labels and metadata, muted for placeholders and counts, disabled for what cannot be used. Inverse sits on the accent; interactive is the link colour.',
    utilities: COLOUR_UTILITIES,
    tokens: ['primary', 'secondary', 'muted', 'disabled', 'inverse', 'interactive'].map((k) => colour('text', k, k === 'inverse' ? 'text-inverse' : 'text')),
  },
  {
    label: 'Border',
    blurb: 'Subtle separates rows, default outlines a control, strong outlines a key or a checkbox, focus is the ring a focused field shows.',
    utilities: COLOUR_UTILITIES,
    tokens: ['subtle', 'default', 'strong', 'focus'].map((k) => colour('border', k, 'border')),
  },
  {
    label: 'Accent',
    blurb: 'The brand colour: the primary button, the checked box, the brand chip. Muted is its opaque wash, wash the translucent one a row tints with on hover, outline its thin border.',
    utilities: COLOUR_UTILITIES,
    tokens: [colour('accent', 'primary', 'fill'), colour('accent', 'hover', 'fill'), colour('accent', 'muted', 'fill'), colour('accent', 'wash', 'fill'), colour('accent', 'outline', 'outline')],
  },
  {
    label: 'Tones',
    blurb: 'Info, warning, success and error, each as a text colour (default), a wash (muted) and a thin border (outline). Banners, chips and toasts are built from these.',
    utilities: COLOUR_UTILITIES,
    tokens: ['info', 'warning', 'success', 'error'].flatMap((tone) => [
      colour(tone, 'default', 'text'),
      colour(tone, 'muted', 'fill'),
      colour(tone, 'outline', 'outline'),
      // Only success has a translucent wash so far, because only success needed
      // one: it is the tint on a resolved thread. The others gain one when a
      // component asks, not before.
      ...(tone === 'success' ? [colour(tone, 'wash', 'fill')] : []),
    ]),
  },
  {
    label: 'Overlay',
    blurb: 'The scrim behind a dialog.',
    utilities: COLOUR_UTILITIES,
    tokens: [{ key: 'scrim', cssVar: '--scrim', cls: 'bg-scrim', swatch: 'fill' }],
  },
  {
    label: 'Shadow',
    blurb: 'Three elevations, the focus ring, and the glows and inner highlight Signal adds. The two icon glows are drop shadows, so they follow the shape of the icon.',
    utilities: 'shadow|drop-shadow',
    tokens: [
      { key: 'sm', cssVar: '--shadow-sm', cls: 'shadow-sm', swatch: 'shadow' },
      { key: 'md', cssVar: '--shadow-md', cls: 'shadow-md', swatch: 'shadow' },
      { key: 'lg', cssVar: '--shadow-lg', cls: 'shadow-lg', swatch: 'shadow' },
      { key: 'focus-ring', cssVar: '--focus-ring', cls: 'shadow-focus-ring', swatch: 'shadow' },
      { key: 'glow-warning', cssVar: '--glow-warning', cls: 'shadow-glow-warning', swatch: 'shadow' },
      { key: 'highlight-inset', cssVar: '--highlight-inset', cls: 'shadow-highlight-inset', swatch: 'shadow' },
      { key: 'glow-success', cssVar: '--glow-success', cls: 'drop-shadow-glow-success', swatch: 'drop-shadow' },
      { key: 'glow-accent', cssVar: '--glow-accent', cls: 'drop-shadow-glow-accent', swatch: 'drop-shadow' },
    ],
  },
]

type TypeToken = { key: string; cls: string }
const TYPE_GROUPS: { label: string; blurb: string; tokens: TypeToken[] }[] = [
  { label: 'Headings', blurb: 'h1 is a page title, h2 a section, h3 a card or dialog title, h4 a row title, h5 a small label.', tokens: ['h1', 'h2', 'h3', 'h4', 'h5'].map((k) => ({ key: k, cls: `text-${k}` })) },
  { label: 'Body', blurb: 'body-1 for reading, body-2 for the interface, caption for what sits beside it.', tokens: ['body-1', 'body-2', 'body-2-strong', 'caption'].map((k) => ({ key: k, cls: `text-${k}` })) },
  { label: 'Controls', blurb: 'The sizes controls are set in, so a button, a field and a chip read the same everywhere.', tokens: ['btn-default', 'btn-small', 'input-label', 'input-value', 'input-helper', 'chip', 'menu'].map((k) => ({ key: k, cls: `text-${k}` })) },
  { label: 'A theme\'s smaller label', blurb: 'small is a size and nothing else. Under signal: or ship: it shrinks the token beside it to 10px and keeps that token\'s line height and weight. Spacing, where a label wants some, is tracking-wide or tracking-widest.', tokens: [{ key: 'small', cls: 'text-small' }] },
]

const RADII = [
  { key: 'none', cls: 'rounded-none' },
  { key: 'sm', cls: 'rounded-sm' },
  { key: 'md', cls: 'rounded-md' },
  { key: 'lg', cls: 'rounded-lg' },
  { key: 'xl', cls: 'rounded-xl' },
  { key: '2xl', cls: 'rounded-2xl' },
  { key: '3xl', cls: 'rounded-3xl' },
  { key: 'full', cls: 'rounded-full' },
]

/* ── Pieces ── */

function Section({ label, blurb, children }: { label: string; blurb: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-h5 uppercase tracking-widest text-text-secondary">{label}</h2>
      <p className="mt-1.5 max-w-[640px] text-body-2 text-text-secondary">{blurb}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Users({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-caption text-text-secondary">— none yet</span>
  return (
    <span className="truncate text-caption text-text-secondary" title={names.join(', ')}>
      {names.join(', ')}
    </span>
  )
}

function SwatchBox({ token }: { token: Token }) {
  const v = `var(${token.cssVar})`
  const base = 'h-6 w-10 shrink-0 rounded-md'
  /* eslint-disable no-restricted-syntax -- this page draws every token from its CSS
     variable, so a swatch shows the value the theme holds, including a token no
     class spells yet. */
  switch (token.swatch) {
    case 'fill':
      return <div className={`${base} border border-border-subtle`} style={{ background: v }} />
    case 'text':
    case 'text-inverse':
      return (
        <div className={`${base} flex items-center justify-center border border-border-subtle ${token.swatch === 'text-inverse' ? 'bg-accent-primary' : 'bg-bg-surface'}`}>
          <span className="text-body-2-strong leading-none" style={{ color: v }}>Ag</span>
        </div>
      )
    case 'border':
      return <div className={`${base} bg-bg-surface`} style={{ border: `2px solid ${v}` }} />
    case 'outline':
      return <div className={base} style={{ background: `var(--${token.key.replace(/-outline$/, '')}-muted)`, border: `1px solid ${v}` }} />
    case 'shadow':
      return <div className="my-1 h-8 w-12 shrink-0 rounded-md bg-bg-surface" style={{ boxShadow: v }} />
    case 'drop-shadow':
      return <div className="my-1 h-8 w-12 shrink-0 rounded-md bg-bg-surface" style={{ filter: `drop-shadow(${v})` }} />
  }
  /* eslint-enable no-restricted-syntax */
}

function TokenRow({ token, utilities }: { token: Token; utilities: string }) {
  return (
    <div className="grid grid-cols-[48px_9rem_13rem_12rem_minmax(0,1fr)] items-center gap-4 border-t border-border-subtle py-1.5 first:border-t-0">
      <SwatchBox token={token} />
      <span className="truncate text-body-2 text-text-primary">{token.key}</span>
      <code className="truncate font-mono text-caption text-text-secondary">{token.cls}</code>
      <code className="truncate font-mono text-caption text-text-secondary" title={resolveVar(token.cssVar)}>
        {resolveVar(token.cssVar)}
      </code>
      <Users names={usedBy(token.key, utilities)} />
    </div>
  )
}

/** A line set in its own token, measuring what the browser drew. */
function Specimen({ token, tick }: { token: TypeToken; tick: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [spec, setSpec] = useState('')
  useLayoutEffect(() => {
    if (!ref.current) return
    const cs = getComputedStyle(ref.current)
    const tracking = cs.letterSpacing === 'normal' ? '' : ` · ${cs.letterSpacing}`
    setSpec(`${cs.fontSize} / ${cs.lineHeight} · ${cs.fontWeight}${tracking}`)
  }, [token.cls, tick])
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_9rem_13rem] items-baseline gap-4 border-t border-border-subtle py-1.5 first:border-t-0">
      <div ref={ref} className={`${token.cls} truncate text-text-primary`}>
        The quick brown fox jumps
      </div>
      <code className="truncate font-mono text-caption text-text-secondary">{token.cls}</code>
      <code className="truncate font-mono text-caption text-text-secondary">{spec}</code>
    </div>
  )
}

function ColumnHeads({ first, cols }: { first: string; cols: string[] }) {
  return (
    <div className={`grid items-center gap-4 pb-2 ${first === 'Specimen' ? 'grid-cols-[minmax(0,1fr)_9rem_13rem]' : 'grid-cols-[48px_9rem_13rem_12rem_minmax(0,1fr)]'}`}>
      {first === 'Specimen' ? null : <span />}
      {[first, ...cols].map((c) => (
        <span key={c} className="text-caption text-text-secondary">{c}</span>
      ))}
    </div>
  )
}

/* ── The page ── */

export function TokensPage() {
  const tick = useThemeTick()
  return (
    <div className="mx-auto max-w-[960px] font-sans text-text-primary">
      <header>
        <h1 className="text-h2 text-text-primary">Design Tokens</h1>
        <p className="mt-2 max-w-[640px] text-body-2 text-text-secondary">
          Every colour, size, radius and shadow an Estiva surface may use, by name. The name is the class: the background token
          <code className="font-mono text-caption"> surface </code>is<code className="font-mono text-caption"> bg-bg-surface</code>. Values are
          live for the theme in the toolbar. <em>Used by</em> lists the package's own components that spell the token; the apps are not counted.
        </p>
      </header>

      <div className="mt-10">
        {FAMILIES.map((family, i) => (
          <Section key={family.label} label={family.label} blurb={family.blurb}>
            {i === 0 ? <ColumnHeads first="Token" cols={['Class', 'Value', 'Used by']} /> : null}
            {family.tokens.map((t) => (
              <TokenRow key={t.cssVar + tick} token={t} utilities={family.utilities} />
            ))}
          </Section>
        ))}
      </div>

      <div className="mt-14">
        {TYPE_GROUPS.map((g, i) => (
          <Section key={g.label} label={`Type · ${g.label}`} blurb={g.blurb}>
            {i === 0 ? <ColumnHeads first="Specimen" cols={['Class', 'Size / line height · weight']} /> : null}
            {g.tokens.map((t) => (
              <Specimen key={t.key} token={t} tick={tick} />
            ))}
          </Section>
        ))}
        <p className="mt-3 text-caption text-text-secondary">Geist throughout; Geist Mono for code.</p>
      </div>

      <div className="mt-14">
        <Section label="Radius" blurb="Four steps from a key (sm) to a card (2xl), and full for a face or a pill.">
          <div className="flex flex-wrap gap-6 pt-1">
            {RADII.map((r) => (
              <div key={r.key} className="flex flex-col items-center gap-2">
                <div className={`size-12 border-2 border-accent-primary bg-accent-muted ${r.cls}`} />
                <code className="font-mono text-caption text-text-secondary">{r.cls}</code>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <p className="mt-14 border-t border-border-subtle pt-4 text-caption text-text-secondary">
        A colour with no token is a missing token: add it to tokens.css in every theme block and to the preset. Never a hex value in an app, never an opacity modifier on a token.
      </p>
    </div>
  )
}
