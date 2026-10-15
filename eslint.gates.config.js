import { gateConfig } from './dist/gates/index.js'

/**
 * The UI Guardrails' inward rules on their own (UIG-5) — `npm run lint:rules`,
 * CI's job `gate`, and the config the editor hook lints a proposed write with.
 *
 * The rules and where they apply are the package's own gate piece, `gateConfig`
 * in `src/gates/gate-config.ts` (UIG-10, docs/GATES.md §23): the one copy an app
 * imports too, pointed inward here (`audience: 'package'`) —
 *
 * - a raw element buried inside a component, rather than the component's own
 *   outermost element or one handed to a Base UI `render` prop;
 * - behaviour Base UI owns, written by hand — a portal, a global listener (D6);
 * - a component with no page, or no story;
 * - a look passed into one of the package's own parts (UIG-9).
 *
 * Every `.tsx` under `src`, stories included, tests not. The rules are the built
 * ones in `dist/`, the very files published, so `npm run lint:rules` builds first.
 */
// On `concept/widgets-2` only: the Widgets 2 prototype sits in `src/` so the apps
// can place it (WID-3), and its proposed looks are what Katerina's pass judges.
// The build project brings each part in through these rules.
export default [{ ignores: ['src/widgets-2/**'] }, ...gateConfig({ audience: 'package' })]
