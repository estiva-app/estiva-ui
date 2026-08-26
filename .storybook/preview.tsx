import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
import { addons } from 'storybook/preview-api'
import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { themes } from 'storybook/theming'
import './preview.css'

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
  const chosen = (THEMES as readonly string[]).includes(theme ?? '') ? (theme as Theme) : DEFAULT_THEME
  const html = document.documentElement
  html.dataset.theme = chosen
  html.classList.toggle('dark', chosen === 'signal')
  html.classList.toggle('signal', chosen === 'signal')
}

// Drive the theme from the toolbar for EVERY page, including MDX docs pages,
// which do not run story decorators.
try {
  addons.getChannel().on(GLOBALS_UPDATED, ({ globals }: { globals: { theme?: string } }) => {
    applyTheme(globals?.theme)
  })
} catch {
  /* channel not ready at import — the decorator still covers story pages */
}
applyTheme(DEFAULT_THEME)

const withTheme: Decorator = (Story, context) => {
  const theme = (context.parameters.forceTheme as string) ?? context.globals.theme ?? DEFAULT_THEME
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  return <Story />
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
    docs: { theme: themes.dark },
    options: {
      storySort: { order: ['Docs', ['Introduction', 'Design Tokens'], 'Primitives', 'Inputs', 'Feedback', 'Overlays'] },
    },
  },
  decorators: [withTheme],
}

export default preview
