import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Added with SHA-17, for the plugin rather than for the environment.
 *
 * The three tests that came before it are pure logic — initials, fit, class
 * merging — and needed no DOM, which is why there was no config at all.
 *
 * **The environment stays Node.** Setting `environment: 'jsdom'` globally broke
 * `tokens.test.ts` immediately: it reads `tokens.css` through
 * `new URL('./tokens.css', import.meta.url)`, and under jsdom `import.meta.url`
 * is an http URL, so `readFileSync` refuses it with "The URL must be of scheme
 * file". A DOM test asks for jsdom in its own docblock instead, which is one
 * line in the file that needs it rather than a default every future logic test
 * has to survive.
 */
export default defineConfig({
  plugins: [react()],
})
