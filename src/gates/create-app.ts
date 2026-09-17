/// <reference types="node" />
/**
 * `create-estiva-app <name>` — a new Estiva app that runs, with every gate on
 * (UIG-10).
 *
 *   npx -p @estiva-app/ui create-estiva-app leaf [--title Leaf] [--theme light]
 *
 * The command is `create-app-cli.ts`; this file is what it runs, and what a test reads.
 *
 * **It reads only this package** (Katerina's ruling of 17 September, docs/GATES.md
 * §23). Never Peek, never Ship: they are private, and reading them would carry
 * their history into every new app. What a new app needs to run a gate is this
 * package's own — the rules, the token and gate configs, the hook, the count,
 * gates:status and the checks every app runs — so the app gets short files that
 * import them, and a gate added later arrives with a version bump.
 *
 * What only a new app has is written here: its first page in the sidebar frame
 * (ruled the same day), its one theme, sign-in the way Ship signs in, one test,
 * one story, the CI workflow with the job `gate`, and its README and CLAUDE.md.
 *
 * Tool versions are this package's own (its devDependencies build and test the
 * same tools). The two it does not use itself — `@estiva-app/identity` and
 * `eslint-plugin-react-hooks` — are asked of the npm registry when the app is
 * made. The lockfile is the app's first `npm install`; make it on Linux.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_RULE_IDS } from '../eslint/index'

interface PackageJson {
  version: string
  devDependencies: Record<string, string>
}

export interface CreateAppOptions {
  /** The folder and npm name: lowercase letters, digits and dashes. */
  name: string
  /** What the app is called on screen. */
  title?: string
  /** One of this package's themes. */
  theme?: string
  /** The folder the app's folder is made in. */
  parent?: string
  /** The `@estiva-app/ui` dependency, when not this package's own version (a tarball, for a proof). */
  ui?: string
  /** Versions of the packages this package does not itself use; asked of npm when absent. */
  versions?: Record<string, string>
}

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..', '..')

/** The package's themes, read from its tokens.css: `light` is the block with no attribute. */
export function themes(): string[] {
  const css = readFileSync(join(packageRoot, 'tokens.css'), 'utf8')
  return ['light', ...new Set([...css.matchAll(/data-theme='([\w-]+)'/g)].map((m) => m[1]))]
}

/** Every file a new app starts with, by path. Nothing is written. */
export function appFiles({ name, title = name, theme = 'light', ui, versions = {} }: CreateAppOptions): Record<string, string> {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`"${name}" is not a name an app can have: lowercase letters, digits and dashes, starting with a letter`)
  const known = themes()
  if (!known.includes(theme)) throw new Error(`"${theme}" is not one of the package's themes: ${known.join(', ')}`)

  const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as PackageJson
  const own = (dep: string) => {
    const range = pkg.devDependencies[dep] ?? versions[dep]
    if (!range) throw new Error(`no version for ${dep}`)
    return range
  }
  const deps = (names: string[]) => Object.fromEntries(names.map((n) => [n, own(n)]))

  const packageJson = {
    name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc -b && vite build',
      preview: 'vite preview',
      typecheck: 'tsc -b',
      lint: 'eslint .',
      'lint:tokens': 'eslint --config eslint.tokens.config.js .',
      'lint:rules': 'eslint --config eslint.gates.config.js .',
      'postlint:rules': `estiva-gates count --repo ${name}`,
      'gates:status': 'estiva-gates status',
      test: 'vitest run',
      storybook: 'storybook dev -p 6006',
      'build-storybook': 'storybook build',
    },
    dependencies: {
      '@estiva-app/identity': own('@estiva-app/identity'),
      '@estiva-app/ui': ui ?? `^${pkg.version}`,
      ...deps(['@tabler/icons-react', 'react', 'react-dom']),
    },
    devDependencies: deps([
      '@eslint/js', '@storybook/addon-docs', '@storybook/react-vite', '@testing-library/dom', '@testing-library/react',
      '@types/node', '@types/react', '@types/react-dom', '@vitejs/plugin-react', 'autoprefixer', 'eslint',
      'eslint-plugin-better-tailwindcss', 'eslint-plugin-react-hooks', 'globals', 'jsdom', 'postcss', 'storybook',
      'tailwindcss', 'typescript', 'typescript-eslint', 'vite', 'vitest',
    ]),
  }

  const count = { schemaVersion: 1, repo: name, generatedAt: new Date().toISOString(), rules: Object.fromEntries(APP_RULE_IDS.map((id) => [id, { errors: 0, warnings: 0, escapes: 0 }])) }
  const themeAttr = ` data-theme="${theme}"`
  const tsBase = {
    target: 'ES2023',
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    moduleDetection: 'force',
    noEmit: true,
    strict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedSideEffectImports: true,
  }
  const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

  return {
    'package.json': json(packageJson),

    '.gitignore': ['node_modules', 'dist', 'storybook-static', '*.local', '*.log', '*.tsbuildinfo', '.DS_Store', ''].join('\n'),

    '.env.example': `# Estiva ID, for signing in. Copy this file to .env.local and fill both in.
#
# Left empty, the app offers no sign-in at all and runs anonymous: it never
# reaches the real Estiva ID by accident.
#
# The app must be registered with that Estiva ID first, as its own app, with
# this redirect address: the origin the app runs on, and a slash
# (http://localhost:5173/). The real Estiva ID registers a new app on the
# server; a local one (http://localhost:8787) in its database.
VITE_ESTIVA_ID_ORIGIN=
VITE_ESTIVA_ID_CLIENT_ID=${name}
`,

    'index.html': `<!doctype html>
<html lang="en"${themeAttr}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

    'tsconfig.json': json({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
    'tsconfig.app.json': json({
      compilerOptions: { tsBuildInfoFile: './node_modules/.tmp/tsconfig.app.tsbuildinfo', ...tsBase, useDefineForClassFields: true, lib: ['ES2023', 'DOM', 'DOM.Iterable'], types: ['vite/client'], jsx: 'react-jsx', paths: { '@/*': ['./src/*'] } },
      include: ['src', '.storybook'],
    }),
    'tsconfig.node.json': json({
      compilerOptions: { tsBuildInfoFile: './node_modules/.tmp/tsconfig.node.tsbuildinfo', ...tsBase, lib: ['ES2023'], types: ['node'] },
      include: ['vite.config.ts'],
    }),

    'vite.config.ts': `import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// \`react\` is deduped because @estiva-app/ui declares it a peer: two copies in one
// tree is the "invalid hook call" crash, and it appears at runtime.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
  },
})
`,

    'tailwind.config.js': `import estiva, { estivaContent } from '@estiva-app/ui/tailwind-preset'

/**
 * The package's preset, and nothing of the app's own: a token is added to the
 * package, in every theme, never here.
 *
 * \`estivaContent\` is the package's own files. Tailwind does not merge \`content\`
 * from a preset, so without it every class used only by a package part is
 * purged, and the app builds clean while rendering at the wrong size.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  presets: [estiva],
  content: [...estivaContent, './index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
}
`,
    'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,

    'eslint.config.js': `import js from '@eslint/js'
import { gateLint, TOKEN_LINT_IGNORES, tokenLint, tokenValues } from '@estiva-app/ui/gates'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Everything, in one lint (\`npm run lint\`, a CI step): TypeScript's and React's
 * recommended rules, the token contract and the UI Guardrails' rules. A new app
 * has no backlog, so all of it is a gate from the first commit.
 *
 * The token contract and the gate are the package's (\`@estiva-app/ui/gates\`),
 * imported, never copied: a rule written later arrives with a version bump.
 */
export default defineConfig([
  globalIgnores(TOKEN_LINT_IGNORES),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  tokenLint(),
  tokenValues(),
  gateLint(),
])
`,
    'eslint.tokens.config.js': `import { TOKEN_LINT_IGNORES, tokenLint, tokenValues } from '@estiva-app/ui/gates'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

// The token contract on its own (\`npm run lint:tokens\`). React's hooks plugin is
// registered with its rules off, so its directives in the source do not break it.
export default defineConfig([
  globalIgnores(TOKEN_LINT_IGNORES),
  { plugins: { 'react-hooks': reactHooks }, linterOptions: { reportUnusedDisableDirectives: 'off' } },
  tokenLint(),
  tokenValues(),
])
`,
    'eslint.gates.config.js': `import { gateConfig } from '@estiva-app/ui/gates'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * The UI Guardrails' rules on their own — \`npm run lint:rules\`, CI's job \`gate\`
 * (GitHub requires it on main: never rename it), and what the editor hook in
 * \`.claude/settings.json\` lints a proposed write with. The package's gate,
 * imported. React's hooks plugin is named so its directives do not break it.
 *
 * A place that keeps something the gate refuses says why, on the line above:
 * \`// @estiva-escape: <reason>\`. Never \`eslint-disable\`: the count refuses it.
 */
export default gateConfig({ quiet: { 'react-hooks': reactHooks } })
`,

    '.claude/settings.json': json({
      hooks: {
        PreToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/node_modules/@estiva-app/ui/dist/gates/cli.js" hook' }] }],
      },
    }),

    'scripts/gates-checks.mjs': `import { appChecks } from '@estiva-app/ui/gates'

/**
 * What gates:status checks in ${name}: the gate checks every app runs, from the
 * package (\`appChecks\`), and nothing of its own yet. A check about this app's
 * own code goes beside them.
 */
export default function define(h) {
  return { repo: '${name}', tickets: appChecks(h, { page: 'src/pages/HomePage.tsx' }) }
}
`,
    '.gates-count.json': json(count),
    'docs/GATES-DEBT.md': `# What ${title} owes the gates

Nothing. ${title} was made with every gate on, at zero.

It should stay that way. A place that keeps something the gate refuses says why on
the line above it, \`// @estiva-escape: <reason>\`, and the count lists it; a whole
file that cannot pass yet goes here, with its reason.
`,

    '.github/workflows/deploy.yml': `name: deploy

# Every pull request and every push to main runs the checks. There is no deploy
# job yet: a new app has nowhere to go until it has a home. When it does, the job
# goes here, and it needs \`check\` and \`gate\` first.

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: deploy-${name}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Typecheck the app
        run: npx tsc -b tsconfig.app.json
      - name: Typecheck the settings files
        run: npx tsc -b tsconfig.node.json
      - name: Lint — everything, the token contract included
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
      # A class only a package part uses reaches the stylesheet only if
      # tailwind.config.js spreads estivaContent. When it does not, the build still
      # succeeds and parts render at the wrong size, so this is where it is caught.
      - name: The package's classes survive Tailwind's purge
        run: |
          if ! grep -qr "max-h-72" dist/assets/*.css; then
            echo "::error::a class used only by @estiva-app/ui is missing from the built CSS — check estivaContent is spread into tailwind.config.js"
            exit 1
          fi

  # The UI Guardrails' rules, on their own: a raw element, behaviour a part owns
  # written by hand, a part restyled. \`npm run lint:rules\` also writes
  # .gates-count.json and fails on an eslint-disable that switches a rule off.
  #
  # A job of its own, because GitHub can require only a whole job, by its name:
  # the rule on main requires \`gate\`. Renaming it leaves every pull request
  # waiting for a check that never reports.
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Gate lint
        run: npm run lint:rules
`,

    'src/index.css': `@import '@estiva-app/ui/tokens.css';
@import '@estiva-app/ui/base.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
}
`,
    'src/vite-env.d.ts': `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESTIVA_ID_ORIGIN?: string
  readonly VITE_ESTIVA_ID_CLIENT_ID?: string
}
`,
    'src/config.ts': `/** What the app is called on screen. */
export const APP_TITLE = ${JSON.stringify(title)}

/**
 * Estiva ID, or \`null\` when this build offers no sign-in at all. Empty is a real
 * mode, not a broken one: the app runs anonymous, and a local build can never
 * reach the real Estiva ID by accident. See .env.example.
 */
export const ID_CONFIG: { base: string; clientId: string } | null =
  import.meta.env.VITE_ESTIVA_ID_ORIGIN && import.meta.env.VITE_ESTIVA_ID_CLIENT_ID
    ? { base: import.meta.env.VITE_ESTIVA_ID_ORIGIN.replace(/\\/+$/, ''), clientId: import.meta.env.VITE_ESTIVA_ID_CLIENT_ID }
    : null
`,
    'src/auth/estivaId.ts': `import { createEstivaId, type ShellReason, type StoredToken } from '@estiva-app/identity'
import { ID_CONFIG } from '../config'

/**
 * Signing in with Estiva ID, the way Ship does: \`@estiva-app/identity\` holds the
 * flow, this file the app's choices.
 *
 * - The redirect is the origin and a slash, never the current path: Estiva ID
 *   compares it exactly against the one address registered for the app.
 * - The session lives in localStorage, so it outlives a tab; a sign-in's
 *   single-use credentials in sessionStorage, per tab.
 */
const client = ID_CONFIG
  ? createEstivaId({
      base: ID_CONFIG.base,
      clientId: ID_CONFIG.clientId,
      redirectUri: () => \`\${window.location.origin}/\`,
      storage: () => (typeof localStorage === 'undefined' ? null : localStorage),
      pendingStore: () => (typeof sessionStorage === 'undefined' ? null : sessionStorage),
      keyPrefix: '${name}.estiva-id',
      navigate: (url) => window.location.assign(url),
    })
  : null

export const signInAvailable = client !== null

export function currentToken(): StoredToken | null {
  return client?.validToken(Date.now() + 60_000) ?? null
}

export function startRenewal(): void {
  client?.scheduleRenewal()
}

export async function beginSignIn(options: { silent?: boolean } = {}): Promise<void> {
  await client?.beginSignIn(\`\${window.location.pathname}\${window.location.search}\`, options)
}

export function beginSignOut(): void {
  client?.beginSignOut()
}

export async function completeSignIn(): Promise<{ token: StoredToken; returnTo: string }> {
  if (!client) throw new Error('this build offers no sign-in')
  return client.completeSignIn(window.location.search)
}

export function stashShellReason(reason: ShellReason): void {
  client?.stashShellReason(reason)
}

export function takeShellReason() {
  return client?.takeShellReason() ?? null
}

export function callbackParams(): { code?: string; error?: string } | null {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code') ?? undefined
  const error = params.get('error') ?? undefined
  return code || error ? { code, error } : null
}

export function clearQuery(): void {
  window.history.replaceState({}, '', window.location.pathname)
}

export function guardAttemptedAt(): number | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem('estiva.authShell.silentAttempt')
  const at = raw ? Number(raw) : NaN
  return Number.isFinite(at) ? at : null
}

/**
 * Who Estiva ID says this is. Asked of its directory with the token, so the
 * answer also proves Estiva ID accepted the sign-in.
 */
export async function whoAmI(): Promise<{ name?: string; email?: string } | null> {
  const token = currentToken()
  if (!ID_CONFIG || !token) return null
  const response = await fetch(\`\${ID_CONFIG.base}/directory/\${token.pubkey}\`, { headers: { Authorization: \`Bearer \${token.accessToken}\` } })
  if (!response.ok) return null
  const entry = (await response.json()) as { displayName?: string; email?: string }
  return { name: entry.displayName, email: entry.email }
}
`,
    'src/auth/boot.ts': `import { decideBoot, type ShellReason, type ShellState } from '@estiva-app/identity'
import {
  beginSignIn,
  callbackParams,
  clearQuery,
  completeSignIn,
  currentToken,
  guardAttemptedAt,
  signInAvailable,
  startRenewal,
  stashShellReason,
  takeShellReason,
} from './estivaId'

export type BootResult = { kind: 'app' } | { kind: 'shell'; state: ShellState } | { kind: 'leaving' }

/**
 * Settle who this load belongs to, before the app renders. The decision is
 * \`decideBoot\` from \`@estiva-app/identity\`; this is the reading and acting
 * around it. It never throws: a blank page is worse than an honest shell.
 */
export async function bootAuth(): Promise<BootResult> {
  if (!signInAvailable) return { kind: 'app' }

  const action = decideBoot({
    callback: callbackParams(),
    hasValidToken: currentToken() !== null,
    guardAttemptedAt: guardAttemptedAt(),
    enteredThisPageLoad: false,
    now: Date.now(),
  })

  switch (action.do) {
    case 'enter':
      startRenewal()
      return { kind: 'app' }
    case 'complete_callback':
      try {
        await completeSignIn()
        clearQuery()
        startRenewal()
        return { kind: 'app' }
      } catch (cause) {
        clearQuery()
        stashShellReason('exchange_failed')
        return shell('exchange_failed', cause)
      }
    case 'probe_silently':
      try {
        await beginSignIn({ silent: true })
        return { kind: 'leaving' }
      } catch {
        return shell('network')
      }
    case 'prompt_passkey':
      return { kind: 'shell', state: { phase: 'authenticating', reason: takeShellReason() ?? action.reason } }
    case 'fail':
      return shell(action.reason)
  }
}

function shell(reason: ShellReason, cause?: unknown): BootResult {
  if (cause) console.warn('[auth] entry failed:', cause)
  return { kind: 'shell', state: { phase: 'failed', reason } }
}

export async function enterFromShell(): Promise<void> {
  await beginSignIn()
}
`,
    'src/auth/AuthShell.tsx': `import { CONTINUE_LABEL, isRecoverable, RETRY_LABEL, SHELL_COPY, type ShellState } from '@estiva-app/identity'
import { Button } from '@estiva-app/ui'
import { APP_TITLE } from '../config'

export interface AuthShellProps {
  state: ShellState
  onContinue: () => void
}

/**
 * What shows while nobody is signed in: the app's name, one line and at most one
 * button. The words are \`@estiva-app/identity\`'s, so every app says the same.
 */
export function AuthShell({ state, onContinue }: AuthShellProps) {
  const waiting = state.phase === 'checking' || state.phase === 'entering' || state.phase === 'ready'
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg-surface px-6 text-center">
      <h1 className="text-h3 text-text-primary">{APP_TITLE}</h1>
      {!waiting && (
        <>
          <p className="max-w-prose text-body-2 text-text-secondary">{SHELL_COPY[state.reason]}</p>
          {isRecoverable(state.reason) && <Button onClick={onContinue}>{state.phase === 'authenticating' ? CONTINUE_LABEL : RETRY_LABEL}</Button>}
        </>
      )}
    </div>
  )
}
`,
    'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthShell } from './auth/AuthShell'
import { bootAuth, enterFromShell } from './auth/boot'

// Settle who this load belongs to first, then render: the app itself is imported
// only once sign-in is settled, so nothing in it evaluates as the wrong person.
void (async () => {
  const root = createRoot(document.getElementById('root')!)
  const boot = await bootAuth()
  if (boot.kind === 'leaving') return
  if (boot.kind === 'shell') {
    root.render(
      <StrictMode>
        <AuthShell state={boot.state} onContinue={() => void enterFromShell()} />
      </StrictMode>,
    )
    return
  }
  const { App } = await import('./App')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
`,
    'src/App.tsx': `import { AppShell, IdentityMenu, NavItem, Sidebar, type Identity } from '@estiva-app/ui'
import { IconHome } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { beginSignOut, currentToken, whoAmI } from './auth/estivaId'
import { APP_TITLE, ID_CONFIG } from './config'
import { HomePage } from './pages/HomePage'

/** The frame: the package's AppShell with a sidebar, and the one page. */
export function App() {
  const signedIn = currentToken() !== null
  const [me, setMe] = useState<Identity>({})

  useEffect(() => {
    if (!signedIn) return
    let live = true
    void whoAmI().then((who) => {
      if (live && who) setMe(who)
    })
    return () => {
      live = false
    }
  }, [signedIn])

  return (
    <AppShell
      logo={APP_TITLE}
      identity={<IdentityMenu me={me} signedIn={signedIn} idBase={ID_CONFIG?.base} onSignOut={signedIn ? beginSignOut : undefined} />}
      nav={
        <Sidebar>
          <NavItem href="/" label="Home" icon={<IconHome size={16} stroke={1.5} />} active />
        </Sidebar>
      }
    >
      <HomePage />
    </AppShell>
  )
}
`,
    'src/pages/HomePage.tsx': `import { EmptyState } from '@estiva-app/ui'

/** The first page. What it becomes is this app's own work. */
export function HomePage() {
  return (
    <div className="flex justify-center px-6 py-16">
      <EmptyState message="Nothing here yet." />
    </div>
  )
}
`,
    'src/pages/HomePage.stories.tsx': `import type { Meta, StoryObj } from '@storybook/react-vite'
import { HomePage } from './HomePage'

const meta = {
  title: 'Pages/Home',
  component: HomePage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomePage>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
`,
    'src/App.test.tsx': `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { APP_TITLE } from './config'

describe('${title}', () => {
  it('opens in its frame, anonymous in a build with no sign-in', () => {
    render(<App />)
    expect(screen.getAllByText(APP_TITLE).length).toBeGreaterThan(0)
    expect(screen.getByText('Nothing here yet.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
  })
})
`,

    '.storybook/main.ts': `import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
}

export default config
`,
    '.storybook/preview.tsx': `import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

// The app's one theme, selected the way the app selects it: on <html>.
document.documentElement.dataset.theme = ${JSON.stringify(theme)}

const preview: Preview = {
  parameters: { layout: 'centered' },
}

export default preview
`,

    'README.md': `# ${title}

An Estiva app, made with \`create-estiva-app\` from \`@estiva-app/ui\`. It starts
with the package's sidebar frame, one theme (\`${theme}\`), sign-in with Estiva ID,
and every UI Guardrails gate on, at zero.

## Run it

\`\`\`sh
npm install
npm run dev
\`\`\`

With no settings it runs **anonymous**: no sign-in is offered, and nothing reaches
the real Estiva ID. To sign in, copy \`.env.example\` to \`.env.local\` and fill it in.
The app must first be registered with that Estiva ID as its own app.

## The checks

| command | what |
|---|---|
| \`npm run typecheck\` | TypeScript, the app and its settings files |
| \`npm run lint\` | everything: TypeScript's and React's rules, the token contract, the gate |
| \`npm run lint:rules\` | the gate alone, and \`.gates-count.json\` — CI's job \`gate\` |
| \`npm test\` | the tests |
| \`npm run build\` | the build |
| \`npm run gates:status\` | which gates are on, read from the code |
| \`npm run storybook\` | the stories |

The gates are the package's, imported rather than copied, so a rule written later
arrives with an ordinary version bump. A Claude session started in this folder is
stopped before it writes code the gate refuses (\`.claude/settings.json\`).
`,
    'CLAUDE.md': `# ${title}, for Claude Code

${title} is an Estiva app. Its parts, tokens and gates come from \`@estiva-app/ui\`.

**Use the package's parts, never a raw element or a hand-built look.** The gate
refuses a raw control, behaviour a part owns written by hand, and a part restyled
through \`className\`, and names what to use instead. It runs before you write
(the hook in \`.claude/settings.json\`, for a session started in this folder), in
\`npm run lint:rules\` and in CI. A session started elsewhere: run
\`npm run lint:rules\` after changing \`src/\`, and fix what it reports. Keep something
only with its reason on the line above, \`// @estiva-escape: <reason>\`, never with
\`eslint-disable\`.

**Tokens only.** Colours, type, corners and shadows come from the package's preset.

**The count starts at zero and stays there** (\`.gates-count.json\`, \`docs/GATES-DEBT.md\`).

The reasoning is the UI Guardrails guide, \`docs/GATES-GUIDE.md\` in estiva-ui.
`,
  }
}

/** The versions of what this package does not use itself, from the npm registry. */
export function askNpm(names: string[]): Record<string, string> {
  const npm = process.env.npm_execpath
  const out: Record<string, string> = {}
  for (const name of names) {
    const args = ['view', name, 'version']
    const version = (npm ? execFileSync(process.execPath, [npm, ...args]) : execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { shell: process.platform === 'win32' }))
      .toString()
      .trim()
    if (!/^\d+\.\d+\.\d+/.test(version)) throw new Error(`npm did not say which version of ${name} is current: "${version}"`)
    out[name] = `^${version}`
  }
  return out
}

/** Write the app. Refuses a folder that already exists. Returns the folder. */
export function createApp(options: CreateAppOptions): string {
  const dir = resolve(options.parent ?? process.cwd(), options.name)
  if (existsSync(dir)) throw new Error(`${dir} already exists: create-estiva-app never writes into a folder that is there`)
  const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as PackageJson
  const missing = ['@estiva-app/identity', 'eslint-plugin-react-hooks'].filter((n) => !pkg.devDependencies[n] && !options.versions?.[n])
  const versions = { ...(missing.length ? askNpm(missing) : {}), ...options.versions }
  const files = appFiles({ ...options, versions })
  for (const [rel, text] of Object.entries(files)) {
    const path = join(dir, rel)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  return dir
}
