import { useEffect, useReducer, type ReactNode } from 'react'

/**
 * Design-token showcase primitives for the "Design Tokens" docs page.
 *
 * Colours render from live CSS variables (`var(--bg-base)`), so every swatch
 * shows the theme selected in the toolbar, and `useThemeTick` re-reads the
 * resolved hex whenever the theme on <html> changes, keeping the printed
 * value honest. Type / radius / shadow use literal Tailwind classes so they
 * resolve the same tokens the apps do — never hard-coded values.
 *
 * The layout is one labelled row per token group: swatches that show the
 * token doing its job (text colours as type, border colours as borders),
 * name and live hex beneath. Compact on purpose — the whole vocabulary
 * should be one page, not an afternoon of scrolling.
 */

/** Re-render this subtree whenever the theme attribute on <html> changes. */
function useThemeTick() {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const obs = new MutationObserver(tick)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => obs.disconnect()
  }, [])
}

function resolveVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim().toUpperCase()
}

const NAME = 'text-[11px] leading-[14px] font-medium text-text-primary'
const VALUE = 'font-mono text-[10px] leading-[13px] text-text-muted tabular-nums'
const GROUP = 'w-24 shrink-0 pt-3 text-[10px] leading-[14px] font-medium uppercase tracking-[0.08em] text-text-secondary'
const BOX = 'h-10 w-full rounded-lg border border-border-default'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-border-subtle py-3 first:border-t-0 first:pt-0">
      <div className={GROUP}>{label}</div>
      <div className="flex flex-1 flex-wrap gap-x-3 gap-y-4">{children}</div>
    </div>
  )
}

function SwatchCol({ name, value, wide, children }: { name: string; value: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'w-32' : 'w-24'}`}>
      {children}
      <div className={NAME}>{name}</div>
      <div className={VALUE}>{value}</div>
    </div>
  )
}

/** Every colour token, grouped, each swatch doing the token's actual job. */
export function Palette() {
  useThemeTick()
  return (
    <div className="flex flex-col">
      <Row label="Background">
        {BG.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className={BOX} style={{ background: `var(${t.var})` }} />
          </SwatchCol>
        ))}
      </Row>
      <Row label="Text">
        {TEXT.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className={`${BOX} flex items-center justify-center ${t.name === 'inverse' ? 'bg-accent-primary' : 'bg-bg-surface'}`}>
              <span className="text-[16px] font-semibold leading-none" style={{ color: `var(${t.var})` }}>
                Ag
              </span>
            </div>
          </SwatchCol>
        ))}
      </Row>
      <Row label="Border">
        {BORDER.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className="h-10 w-full rounded-lg bg-bg-surface" style={{ border: `2px solid var(${t.var})` }} />
          </SwatchCol>
        ))}
      </Row>
      <Row label="Accent">
        {ACCENT.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className={BOX} style={{ background: `var(${t.var})` }} />
          </SwatchCol>
        ))}
      </Row>
      <Row label="Outline">
        {OUTLINE.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className="h-10 w-full rounded-lg bg-bg-surface" style={{ border: `2px solid var(${t.var})` }} />
          </SwatchCol>
        ))}
      </Row>
      <Row label="Overlay">
        {OVERLAY.map((t) => (
          <SwatchCol key={t.var} name={t.name} value={resolveVar(t.var)}>
            <div className={BOX} style={{ background: `var(${t.var})` }} />
          </SwatchCol>
        ))}
      </Row>
      <Row label="Semantic">
        {SEMANTIC.map((p) => (
          <SwatchCol key={p.name} name={p.name} value={`${resolveVar(p.defaultVar)} · ${resolveVar(p.mutedVar)}`} wide>
            <div className="flex h-10 overflow-hidden rounded-lg border border-border-default">
              <div className="flex-1" style={{ background: `var(${p.defaultVar})` }} />
              <div className="flex-1" style={{ background: `var(${p.mutedVar})` }} />
            </div>
          </SwatchCol>
        ))}
      </Row>
    </div>
  )
}

/** The type ramp in three clusters, every specimen set in its own token. */
export function TypeSpecimens() {
  return (
    <div className="flex flex-col">
      {TYPE_GROUPS.map((g) => (
        <div key={g.label} className="flex gap-4 border-t border-border-subtle py-3 first:border-t-0 first:pt-0">
          <div className={GROUP}>{g.label}</div>
          <div className="flex min-w-0 flex-1 flex-col">
            {g.tokens.map((t) => (
              <div key={t.token} className="flex items-baseline gap-4 py-1">
                <div className="w-28 shrink-0 text-[11px] font-medium leading-[14px] text-text-primary">{t.token}</div>
                <div className={`${t.cls} min-w-0 flex-1 truncate text-text-primary`}>The quick brown fox</div>
                <div className={`${VALUE} shrink-0`}>{t.spec}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Radii() {
  return (
    <div className="flex flex-wrap gap-3 py-1">
      {RADIUS.map((t) => (
        <div key={t.token} className="flex w-24 flex-col items-center gap-1.5 text-center">
          <div className={`size-10 border-2 border-accent-primary bg-accent-muted ${t.cls}`} />
          <div className={NAME}>{t.token}</div>
          <div className={VALUE}>{t.value}</div>
        </div>
      ))}
    </div>
  )
}

export function Shadows() {
  return (
    <div className="flex flex-wrap gap-6 py-1">
      {SHADOW.map((t) => (
        <div key={t.token} className="flex flex-col items-center gap-2 text-center">
          <div className={`h-16 w-24 rounded-xl bg-bg-surface ${t.cls}`} />
          <div className={NAME}>{t.token}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Token data (mirrors tailwind-preset.js + tokens.css) ── */

type Token = { name: string; var: string }

const BG: Token[] = [
  { name: 'base', var: '--bg-base' },
  { name: 'surface', var: '--bg-surface' },
  { name: 'elevated', var: '--bg-elevated' },
  { name: 'inset', var: '--bg-inset' },
  { name: 'hover', var: '--bg-hover' },
  { name: 'selected', var: '--bg-selected' },
  { name: 'active', var: '--bg-active' },
  { name: 'disabled', var: '--bg-disabled' },
  { name: 'wash', var: '--bg-wash' },
]

/** The faint borders a chip wears under Signal; the class is `border-info-outline`. */
const OUTLINE: Token[] = [
  { name: 'accent', var: '--accent-outline' },
  { name: 'info', var: '--info-outline' },
  { name: 'warning', var: '--warning-outline' },
  { name: 'success', var: '--success-outline' },
  { name: 'error', var: '--error-outline' },
]

/** The dialog backdrop; the class is `bg-scrim`. */
const OVERLAY: Token[] = [{ name: 'scrim', var: '--scrim' }]

const TEXT: Token[] = [
  { name: 'primary', var: '--text-primary' },
  { name: 'secondary', var: '--text-secondary' },
  { name: 'muted', var: '--text-muted' },
  { name: 'disabled', var: '--text-disabled' },
  { name: 'inverse', var: '--text-inverse' },
  { name: 'interactive', var: '--text-interactive' },
]

const BORDER: Token[] = [
  { name: 'subtle', var: '--border-subtle' },
  { name: 'default', var: '--border-default' },
  { name: 'strong', var: '--border-strong' },
  { name: 'focus', var: '--border-focus' },
]

const ACCENT: Token[] = [
  { name: 'primary', var: '--accent-primary' },
  { name: 'hover', var: '--accent-hover' },
  { name: 'muted', var: '--accent-muted' },
]

const SEMANTIC = [
  { name: 'info', defaultVar: '--info-default', mutedVar: '--info-muted' },
  { name: 'warning', defaultVar: '--warning-default', mutedVar: '--warning-muted' },
  { name: 'success', defaultVar: '--success-default', mutedVar: '--success-muted' },
  { name: 'error', defaultVar: '--error-default', mutedVar: '--error-muted' },
]

type TypeToken = { token: string; cls: string; spec: string }

const TYPE_GROUPS: { label: string; tokens: TypeToken[] }[] = [
  {
    label: 'Headings',
    tokens: [
      { token: 'h1', cls: 'text-h1', spec: '26 / 115% / 600' },
      { token: 'h2', cls: 'text-h2', spec: '22 / 120% / 600' },
      { token: 'h3', cls: 'text-h3', spec: '18 / 120% / 600' },
      { token: 'h4', cls: 'text-h4', spec: '16 / 150% / 600' },
      { token: 'h5', cls: 'text-h5', spec: '12 / 100% / 500' },
    ],
  },
  {
    label: 'Body',
    tokens: [
      { token: 'body-1', cls: 'text-body-1', spec: '16 / 150% / 400' },
      { token: 'body-2', cls: 'text-body-2', spec: '14 / 140% / 400' },
      { token: 'body-2-strong', cls: 'text-body-2-strong', spec: '14 / 140% / 500' },
      { token: 'caption', cls: 'text-caption', spec: '12 / 120% / 400' },
    ],
  },
  {
    label: 'Controls',
    tokens: [
      { token: 'btn-default', cls: 'text-btn-default', spec: '14 / 14px / 500' },
      { token: 'btn-small', cls: 'text-btn-small', spec: '12 / 12px / 500' },
      { token: 'input-label', cls: 'text-input-label', spec: '12 / 115% / 500' },
      { token: 'input-value', cls: 'text-input-value', spec: '14 / 140% / 400' },
      { token: 'input-helper', cls: 'text-input-helper', spec: '12 / 120% / 400' },
      { token: 'chip', cls: 'text-chip', spec: '11 / 110% / 500' },
      { token: 'menu', cls: 'text-menu', spec: '9 / 115% / 500' },
    ],
  },
]

type RadiusToken = { token: string; cls: string; value: string }

const RADIUS: RadiusToken[] = [
  { token: 'none', cls: 'rounded-none', value: '0px' },
  { token: 'sm', cls: 'rounded-sm', value: '4px' },
  { token: 'md', cls: 'rounded-md', value: '6px' },
  { token: 'lg', cls: 'rounded-lg', value: '8px' },
  { token: 'xl', cls: 'rounded-xl', value: '12px' },
  { token: '2xl', cls: 'rounded-2xl', value: '16px' },
  { token: '3xl', cls: 'rounded-3xl', value: '24px' },
  { token: 'full', cls: 'rounded-full', value: '9999px' },
]

type ShadowToken = { token: string; cls: string }

const SHADOW: ShadowToken[] = [
  { token: 'shadow-sm', cls: 'shadow-sm' },
  { token: 'shadow-md', cls: 'shadow-md' },
  { token: 'shadow-lg', cls: 'shadow-lg' },
  { token: 'focus-ring', cls: 'shadow-focus-ring' },
  { token: 'glow-warning', cls: 'shadow-glow-warning' },
  { token: 'highlight-inset', cls: 'shadow-highlight-inset' },
  { token: 'drop-shadow-glow-success', cls: 'drop-shadow-glow-success' },
  { token: 'drop-shadow-glow-accent', cls: 'drop-shadow-glow-accent' },
]
