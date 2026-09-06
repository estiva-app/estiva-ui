import type { StorybookConfig } from '@storybook/react-vite'
import remarkGfm from 'remark-gfm'

/**
 * The package's own Storybook — the shared reference for every Estiva app.
 *
 * It loads only what is in this package: the Design Tokens page and each
 * primitive's stories, none of which may need an app's data. Peek and Ship
 * each keep a Storybook for what is theirs.
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)', '../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      // remark-gfm: MDX alone has no pipe tables, and the docs pages use them.
      name: '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    // addon-a11y: axe on every story, in the panel while working; CI runs the
    // same checks headless through the test runner (`npm run test:a11y`).
    '@storybook/addon-a11y',
    // addon-vitest: the sidebar's test widget, over the same Vitest projects
    // vitest.config.ts defines (one axe run per theme).
    '@storybook/addon-vitest',
  ],
}

export default config
