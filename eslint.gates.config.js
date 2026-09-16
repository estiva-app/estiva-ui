import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { defineConfig, globalIgnores } from 'eslint/config'
import { gateLint, GATE_LINT_IGNORES } from './eslint.gates.js'

/**
 * The UI Guardrails' inward rules on their own — `npm run lint:rules`, the CI
 * gate ("Gate lint"), and the config the editor hook lints a proposed write
 * with.
 *
 * `npm run lint` runs everything, these included. This config runs the gate by
 * itself, so it can fail on one of these rules and on nothing else. Zero errors
 * the day it landed.
 *
 * The other plugins are registered, every rule off, for one reason: the source
 * carries `eslint-disable-next-line` comments for the token lint
 * (`better-tailwindcss`, and the same plugin as `token-values` and
 * `token-spacing`), and ESLint refuses a directive for a rule it does not know.
 * Those rules run in `eslint.config.js`.
 */
export default defineConfig([
  globalIgnores(GATE_LINT_IGNORES),
  {
    plugins: {
      'better-tailwindcss': betterTailwindcss,
      'token-values': betterTailwindcss,
      'token-spacing': betterTailwindcss,
    },
    // Every other config's directives are unused *here*, because their rules
    // are off here. Reporting them would be this config complaining about the
    // others' business.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  gateLint,
])
