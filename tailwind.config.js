import estiva from './tailwind-preset.js'

/**
 * This package's own Tailwind config — for its Storybook only. Consumers do
 * not use this file; they use the preset it uses.
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [estiva],
  content: ['./stories/**/*.{ts,tsx,mdx}', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
}
