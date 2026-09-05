import { fileURLToPath } from 'node:url'
import plugin from 'tailwindcss/plugin'

/**
 * The globs a consumer must add to its own `content`, exported so nobody has to
 * write a path into this package by hand.
 *
 * **Spread these — do not rely on the preset carrying them.** Tailwind does not
 * merge `content` from a preset: measured on 2026-08-26 against Peek, with the
 * preset exporting exactly these absolute paths in its own `content`, the class
 * `max-h-72` — used by `Select` and by nothing in Peek — was still absent from
 * the built stylesheet. Moving the identical string into Peek's own `content`
 * put it there. The preset is not a place this can be fixed.
 *
 * Why it matters: Tailwind purges every class it cannot find, so the failure is
 * a build that succeeds, tests that pass and tokens that are present, with
 * components rendering at the wrong size. Nothing reports it.
 *
 * The paths are absolute and derived from this file's own location, because a
 * `content` entry resolves against the consumer's working directory and the
 * consumer has no reliable relative path to us.
 *
 *   import estiva, { estivaContent } from '@estiva-app/ui/tailwind-preset'
 *   export default {
 *     presets: [estiva],
 *     content: [...estivaContent, './index.html', './src/**\/*.{ts,tsx}'],
 *   }
 */
const own = (glob) => fileURLToPath(new URL(glob, import.meta.url))
export const estivaContent = [own('./dist/*.js'), own('./src/*.{ts,tsx}')]

/**
 * The Estiva Tailwind preset — the token NAMES every Estiva app shares.
 *
 * Peek's `tailwind.config.js` `theme.extend`, verbatim (2026-08-28), minus
 * three tokens that are Peek's product and not the suite's: `bg-private`,
 * `border-private` (the huddle register) and `logo` (its wordmark). Peek
 * keeps those in its own `extend`, which merges over this preset.
 *
 * Every colour resolves a CSS variable, and the variables live in
 * `tokens.css` next to this file, one block per theme. Changing a value is a
 * change to a theme; changing a NAME is a change to the contract and needs
 * every consumer looked at.
 *
 * Consume with:
 *
 *   import estiva from '@estiva-app/ui/tailwind-preset'
 *   export default { presets: [estiva], content: [...your app's], theme: { extend: { ...your own } } }
 *
 * A consumer lists only its own files: the preset already contributes this
 * package's, and Tailwind concatenates the two.
 *
 * `darkMode: 'class'` is here because Peek's `dark:` variants key on the
 * `.dark` class, and `tokens.css` answers to both that class and
 * `data-theme="dark"`. The `signal:` variant is here for the same reason:
 * `signal` is a theme in `tokens.css`, and a shared component may carry
 * the few Signal-only touches Peek gives it (a semibold primary, a mono
 * chip label) without the consuming app knowing — an app that never
 * applies `.signal` never sees them.
 *
 * @type {import('tailwindcss').Config}
 */
export default {

  darkMode: 'class',
  // `signal` is Peek's shipped theme (a class); `ship` is Ship's (an attribute,
  // see tokens.css). Both exist so a treatment can be given to the two apps
  // without changing the plain light/dark themes the docs render in.
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('signal', '.signal &')
      addVariant('ship', "[data-theme='ship'] &")
    }),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Headings
        h1: ['26px', { lineHeight: '115%', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['22px', { lineHeight: '120%', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '120%', letterSpacing: '0',        fontWeight: '600' }],
        h4: ['16px', { lineHeight: '150%', letterSpacing: '-0.01em', fontWeight: '600' }],
        h5: ['12px', { lineHeight: '100%', letterSpacing: '0',        fontWeight: '500' }],
        // Body
        'body-1': ['16px', { lineHeight: '150%', letterSpacing: '0', fontWeight: '400' }],
        'body-2': ['14px', { lineHeight: '140%', letterSpacing: '0', fontWeight: '400' }],
        'body-2-strong': ['14px', { lineHeight: '140%', letterSpacing: '0', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '120%', letterSpacing: '0', fontWeight: '400' }],
        menu:    ['9px',  { lineHeight: '115%', letterSpacing: '0', fontWeight: '500' }],
        // Component-specific. The package's cn() names this ramp for
        // tailwind-merge (src/cn.ts, pinned by cn.test.ts), so the token
        // classes survive merged lists — add a size here, add it there too.
        'btn-default': ['14px', { lineHeight: '14px', letterSpacing: '0', fontWeight: '500' }],
        'btn-small':   ['12px', { lineHeight: '12px', letterSpacing: '0', fontWeight: '500' }],
        'input-label':  ['12px', { lineHeight: '115%', letterSpacing: '0', fontWeight: '500' }],
        'input-value':  ['14px', { lineHeight: '140%', letterSpacing: '0', fontWeight: '400' }],
        'input-helper': ['12px', { lineHeight: '120%', letterSpacing: '0', fontWeight: '400' }],
        'chip':         ['11px', { lineHeight: '110%', letterSpacing: '0', fontWeight: '500' }],
      },
      borderRadius: {
        none: '0px',
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },
      colors: {
        // bg
        'bg-base':      'var(--bg-base)',
        'bg-surface':   'var(--bg-surface)',
        'bg-elevated':  'var(--bg-elevated)',
        'bg-inset':     'var(--bg-inset)',
        'bg-hover':     'var(--bg-hover)',
        'bg-selected':  'var(--bg-selected)',
        'bg-active':    'var(--bg-active)',
        'bg-disabled':  'var(--bg-disabled)',
        // text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'text-disabled':  'var(--text-disabled)',
        'text-inverse':   'var(--text-inverse)',
        'text-interactive': 'var(--text-interactive)',
        // border
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'border-focus':   'var(--border-focus)',
        // accent
        'accent-primary': 'var(--accent-primary)',
        'accent-hover':   'var(--accent-hover)',
        'accent-muted':   'var(--accent-muted)',
        // semantic
        'info-default':    'var(--info-default)',
        'info-muted':      'var(--info-muted)',
        'warning-default': 'var(--warning-default)',
        'warning-muted':   'var(--warning-muted)',
        'success-default': 'var(--success-default)',
        'success-muted':   'var(--success-muted)',
        'error-default':   'var(--error-default)',
        'error-muted':     'var(--error-muted)',
      },
      boxShadow: {
        'sm':  'var(--shadow-sm)',
        'md':  'var(--shadow-md)',
        'lg':  'var(--shadow-lg)',
        // The ring a focused control wears where a theme wants one: Signal's
        // glow. Every theme defines it; the shared inputs use it under `signal:`.
        'focus-ring': 'var(--focus-ring)',
      },
      keyframes: {
        'skeleton-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        // Delayed reveal for loading skeletons: invisible for the first 150ms
        // so fast loads never flash a skeleton (Peek's rule, 2026-07-08).
        'skeleton-in': 'skeleton-in 0.2s ease-out 0.15s both',
      },
    },
  },
}
