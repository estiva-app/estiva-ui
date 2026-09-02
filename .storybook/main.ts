import type { StorybookConfig } from '@storybook/react-vite'

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
  addons: ['@storybook/addon-docs'],
}

export default config
