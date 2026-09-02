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
  ],
}

export default config
