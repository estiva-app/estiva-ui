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
 * `npm test` runs the first; `npm run test:a11y` the other two.
 *
 * Inside Storybook, the sidebar's test widget starts its own Vitest. It
 * renames every storybookTest project to `storybook:<configDir>` and runs
 * that one name, so two theme projects on the one `.storybook` collide and
 * Vitest refuses to start (seen 2026-09-06: "Project name ... is not
 * unique", and Storybook went down with it). Under the widget
 * (VITEST_STORYBOOK=true, set by the addon) this file therefore defines one
 * project, in the toolbar's default theme; the command line gets both.
 *
 * The stage-0 plan named `@storybook/test-runner` for the a11y run; under
 * Storybook 10.6 it cannot load its own config file (Storybook's loader calls
 * `module.register()`, which Jest 30 forbids), and this plugin is what
 * Storybook recommends in its place.
 */
const THEMES: readonly ('signal' | 'ship')[] = process.env.VITEST_STORYBOOK ? ['signal'] : ['signal', 'ship']

/**
 * **`storybook-draw`** — every story drawn once, with axe off (Katerina's ruling
 * R19, 25 September): a story that throws fails the gate on the pull request,
 * not only after a merge in the accessibility job. The preview sets the addon's
 * own switch, `parameters.a11y.test: 'off'`, where `__ESTIVA_DRAW_ONLY__` is
 * defined (its afterEach runs axe only when the test is not 'off'); a global
 * (`a11y: { manual: true }`) did not reach it, measured 25 September.
 * Accessibility stays one piece of work for later (her ruling of 23 September).
 * `npm run test:stories`. Not under the sidebar widget, for the reason above.
 */
const DRAW = process.env.VITEST_STORYBOOK ? [] : [{ name: 'storybook-draw', globals: { theme: 'signal' }, define: { __ESTIVA_DRAW_ONLY__: 'true' } }]

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
      ...[...THEMES.map((theme) => ({ name: `storybook-${theme}`, globals: { theme } as Record<string, unknown>, define: {} as Record<string, string> })), ...DRAW].map(({ name, globals, define }) => ({
        extends: true as const,
        define,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'npm run storybook',
            storybookUrl: 'http://localhost:6008',
            initialGlobals: globals,
          }),
        ],
        test: {
          name,
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
