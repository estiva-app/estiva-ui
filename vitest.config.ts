import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Two kinds of test, as Vitest projects.
 *
 * **`unit`** — tokens, cn and the component tests, as they ran before the
 * migration (SHA-17 added the React plugin for the component tests). The
 * environment stays Node: `environment: 'jsdom'` globally broke
 * `tokens.test.ts` at once, because it reads `tokens.css` through
 * `new URL('./tokens.css', import.meta.url)` and under jsdom that is an http
 * URL, which `readFileSync` refuses. A DOM test asks for jsdom in its own
 * docblock instead, one line in the file that needs it.
 *
 * **`storybook-signal` / `storybook-ship`** — every story rendered in a real
 * Chromium by Storybook's Vitest plugin, once per product theme, with
 * `@storybook/addon-a11y` running axe on each render and failing the story
 * on a violation (`parameters.a11y.test: 'error'`, set in preview.tsx). One
 * project per theme because axe's contrast checks read the theme's actual
 * colours. No Storybook needs to run for this; `storybookUrl` only makes a
 * failure's link open the right one.
 *
 * `npm test` runs the first; `npm run test:a11y` the other two. The stage-0
 * plan named `@storybook/test-runner` for the a11y run; under Storybook 10.6
 * it cannot load its own config file (Storybook's loader calls
 * `module.register()`, which Jest 30 forbids), and this plugin is what
 * Storybook recommends in its place.
 */
const THEMES = ['signal', 'ship'] as const

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['**/node_modules/**', 'dist/**', 'storybook-static/**'],
        },
      },
      ...THEMES.map((theme) => ({
        extends: true as const,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'npm run storybook',
            storybookUrl: 'http://localhost:6008',
            initialGlobals: { theme },
          }),
        ],
        test: {
          name: `storybook-${theme}`,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' as const }],
          },
        },
      })),
    ],
  },
})
