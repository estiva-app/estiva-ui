import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
import { addons } from 'storybook/preview-api'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { themes } from 'storybook/theming'
import { TooltipProvider } from '../src/Tooltip'
import './preview.css'

/** Set by vitest.config.ts for `npm run test:stories` only: draw, with axe off (R19). */
declare const __ESTIVA_DRAW_ONLY__: boolean | undefined

/**
 * The two themes the apps render, from the toolbar: `signal` is Peek's,
 * `ship` is Ship's (Katerina, 2026-08-28: the reference shows what the apps
 * show). `light` and `dark` exist in tokens.css as the bases Peek's own
 * Storybook and Estiva ID use, and are not offered here.
 *
 * Selected the way the apps select them: `data-theme` on <html>, plus the
 * `.dark.signal` classes for Signal (Peek's way — Signal layers over dark,
 * and its `dark:` variants key on the class).
 */
const THEMES = ['signal', 'ship'] as const
type Theme = (typeof THEMES)[number]
const DEFAULT_THEME: Theme = 'signal'

const applyTheme = (theme?: string) => {
  // No theme named (an event about other globals) is not a reason to reset.
  if (!theme) return
  const chosen = (THEMES as readonly string[]).includes(theme) ? (theme as Theme) : DEFAULT_THEME
  const html = document.documentElement
  html.dataset.theme = chosen
  html.classList.toggle('dark', chosen === 'signal')
  html.classList.toggle('signal', chosen === 'signal')
}

// Drive the theme from the toolbar for EVERY page — MDX docs pages, and the
// story iframes a Docs page embeds, which do not run story decorators and
// start from the globals the manager hands them (SET_GLOBALS) or from the
// URL when opened directly.
const themeFromUrl = () => {
  const globals = new URLSearchParams(location.search).get('globals') ?? ''
  return globals.match(/(?:^|;)theme:([\w-]+)/)?.[1]
}
/**
 * A story iframe embedded in a Docs page is its own preview with its own
 * globals, and the toolbar's change reaches the page but not it. Such a frame
 * follows its parent's <html data-theme> instead, and ignores the channel.
 */
const parentHtml = (() => {
  try {
    // The manager is also a same-origin parent, but it is not a preview: only
    // a frame whose parent runs a preview (a Docs page) is embedded.
    const parent = window.parent as Window & { __STORYBOOK_PREVIEW__?: unknown }
    return parent !== window && parent.__STORYBOOK_PREVIEW__ ? parent.document.documentElement : null
  } catch {
    return null // cross-origin: not one of ours
  }
})()
if (parentHtml) {
  const follow = () => applyTheme(parentHtml.dataset.theme)
  new MutationObserver(follow).observe(parentHtml, { attributes: true, attributeFilter: ['data-theme'] })
  // Belt and braces: an observer registered while the parent is mid-render
  // has been seen to miss the first change.
  setInterval(follow, 500)
  follow()
}

// The channel is not always there at import time; ask again until it is
// (a Docs page runs no decorator, so this is its only route to the toolbar).
const listen = (attempt = 0) => {
  if (parentHtml) return
  try {
    const channel = addons.getChannel()
    type Payload = { globals?: { theme?: string }; userGlobals?: { theme?: string } }
    const themeIn = (p: Payload) => p.userGlobals?.theme ?? p.globals?.theme
    // A Docs page's embedded story frames re-announce THEIR globals on this
    // channel right after a toolbar change, so the event's payload can be
    // stale; this preview's own store is the truth.
    const storeTheme = (): string | undefined =>
      (window as unknown as { __STORYBOOK_PREVIEW__?: { storyStoreValue?: { userGlobals?: { globals?: { theme?: string } } } } })
        .__STORYBOOK_PREVIEW__?.storyStoreValue?.userGlobals?.globals?.theme
    channel.on(GLOBALS_UPDATED, (p: Payload) => {
      applyTheme(themeIn(p))
      // The store may be written just after the event; read it once it has settled.
      setTimeout(() => applyTheme(storeTheme()), 100)
    })
    // Opened directly (a Docs page's story iframe, a link with ?globals=), the
    // URL is the truth; the preview's own initial globals would say the default.
    channel.on(SET_GLOBALS, (p: Payload) => applyTheme(themeFromUrl() ?? themeIn(p)))
  } catch {
    if (attempt < 40) setTimeout(() => listen(attempt + 1), 50)
  }
}
listen()
if (!parentHtml) applyTheme(themeFromUrl() ?? DEFAULT_THEME)

const withTheme: Decorator = (Story, context) => {
  const theme = (context.parameters.forceTheme as string) ?? context.globals.theme ?? DEFAULT_THEME
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  /* One provider over every story, as an app mounts one over its whole tree:
     the tooltips in a toolbar then share a delay and the neighbours open
     instantly (D23). Without it each would wait its own 300ms. */
  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  )
}

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: [...THEMES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: DEFAULT_THEME },
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    // Every story is an accessibility test: the panel shows axe's findings and
    // `npm run test:a11y` fails on them, in the addon's own vocabulary. The gate's
    // `npm run test:stories` only draws them (R19): vitest.config.ts defines
    // __ESTIVA_DRAW_ONLY__ for that project alone, and axe is off there.
    a11y: { test: typeof __ESTIVA_DRAW_ONLY__ !== 'undefined' && __ESTIVA_DRAW_ONLY__ ? 'off' : 'error' },
    docs: { theme: themes.dark },
    options: {
      storySort: { order: ['Docs', ['Introduction', 'Getting started', 'Choosing a component', 'Design Tokens'], 'Primitives', 'Inputs', 'Components', 'Feedback', 'Overlays', 'Navigation', 'Frame', 'Layout'] },
    },
  },
  decorators: [withTheme],
}

export default preview
