/// <reference types="node" />
/**
 * `@estiva-app/ui/gates` — everything an app needs to run the UI Guardrails'
 * gates, shipped once (docs/GATES.md §23, Katerina's ruling of 17 September).
 *
 * The rules were always here, in `@estiva-app/ui/eslint`. The pieces that
 * switch them on were copied into every repo from UIG-3 on; UIG-10 moved them
 * here, and an app imports them:
 *
 * - `tokenLint`, `tokenValues` — the token contract's lint settings (UIG-28).
 * - `tokenConfig` — the token lint on its own, as `lint:tokens` runs it (UIG-37).
 * - `gateLint`, `gateConfig` — where the rules apply, and the gate that runs them alone.
 * - `writeGateCount` — `.gates-count.json` (seam S3).
 * - `runHook` — the editor gate a `PreToolUse` hook runs.
 * - `runStatus`, `helpers` — gates:status and the helpers a checks file is written with.
 *
 * - `appChecks` — the gate checks every app runs, for its `scripts/gates-checks.mjs`.
 * - `appFiles`, `createApp`, `themes` — a new app with every gate on (`create-estiva-app`).
 *
 * `estiva-gates` (`cli.ts`) runs the count, the hook and the status as one command.
 *
 * Built by build.mjs into `dist/gates/`, for Node. Nothing here reaches the
 * components' browser bundle.
 */
export { TOKEN_LINT_IGNORES, tokenConfig, tokenLint, tokenValues, type TokenAudience, type TokenConfigOptions, type TokenLintOptions } from './token-lint'
export { gateConfig, gateLint, type GateConfigOptions } from './gate-config'
export { writeGateCount, type CountOptions, type CountResult } from './count'
export { runHook, type HookOptions, type HookResult } from './hook'
export { ENGINE, helpers, runStatus, type CheckResult, type GateCheck, type GateHelpers, type GateSpec, type GateTicket, type LintProbe, type StatusOptions, type TicketListEntry } from './status'
export { APP_TICKET_TITLES, appChecks, type AppCheckOptions } from './app-checks'
export { appFiles, askNpm, createApp, themes, type CreateAppOptions } from './create-app'
