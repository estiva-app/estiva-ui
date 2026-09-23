# @estiva-app/ui

Estiva's design tokens, and a small set of primitives built on them, for
every Estiva app — Peek, Ship, and whatever comes next.

**Tokens are the contract. Components are a convenience.**

## What is in it

- `tailwind-preset.js` — the token *names*, as a Tailwind preset: colours,
  type ramp, radii, shadows, the skeleton animation. Peek's, verbatim.
- `tokens.css` — the token *values*, one block per theme: `signal` (what
  Peek renders), `ship` (what Ship renders), and the `light` / `dark` bases.
  Same names in every block.
- Primitives — arriving one at a time (see Storybook). Each has stories that
  need no app data; if a story needs a fixture, the component is not a
  primitive and does not belong here.
- Behaviour comes from [Base UI](https://base-ui.com) (`@base-ui/react`, a
  dependency installed with the package): keyboard, focus, roles, forms.
  Every component with a Base UI counterpart is built on it. Nothing
  changes how a component looks.

## Using it

```js
// tailwind.config.js
import estiva from '@estiva-app/ui/tailwind-preset'
export default {
  presets: [estiva],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { /* your app's own tokens, if any */ } },
}
```

```css
/* your entry CSS, before anything that uses a token */
@import '@estiva-app/ui/tokens.css';
```

```html
<html data-theme="ship">   <!-- or "signal" / "dark"; nothing = light. Peek uses the classes: <html class="dark signal">. -->
```

Install it:

```bash
npm install @estiva-app/ui
```

**Spread `estivaContent` into your `content`.** Tailwind does not merge
`content` from a preset — measured, see the comment in `tailwind-preset.js` —
so without this every class used only by these components is purged, and the
result is a build that succeeds with components rendering at the wrong size:

```js
import estiva, { estivaContent } from '@estiva-app/ui/tailwind-preset'
export default {
  presets: [estiva],
  content: [...estivaContent, './index.html', './src/**/*.{ts,tsx}'],
}
```

### The lint rules — `@estiva-app/ui/eslint`

The UI Guardrails' rules ship with the package, as an ESLint plugin, so an app
gets a new rule with a version bump. Each rule names the component to use
instead. There are three:

- `estiva/no-raw-element` refuses a raw interactive element (`<a>`, `<input>`,
  `<form>`, `<dialog>`…) and names the part to use, or says the package has none yet.
- `estiva/no-rebuilt-behaviour` refuses behaviour a part already owns, written by
  hand: a Base UI import, `createPortal`, a click or key listener on the whole
  page, arrow keys compared by hand, a hand-written `role` (`option`, `menu`,
  `dialog`, `alert`…), `tabIndex` 0 or more on a box, and a scrolling box
  (`overflow-auto`, behind any variant). `OWNED_BEHAVIOURS` lists each behaviour,
  the Base UI parts that do it, and the components that own it. It cannot find a
  box that should scroll and does not: that has no class to read.
- `estiva/no-restyled-part` refuses a look passed into a part through
  `className` or an inner box's class prop — a colour, a text size, a border, a
  corner, a shadow — and names the part's look props (`PART_LOOK_PROPS`). Only
  placement goes through (`PLACEMENT`), and `EmptyState` takes no padding.

```js
// eslint.config.js — alongside your own rules
import estiva from '@estiva-app/ui/eslint'
export default [
  // …your config, with a parser that reads TSX
  { files: ['src/**/*.{ts,tsx}'], ignores: ['**/*.test.{ts,tsx}'], ...estiva.configs.recommended },
]
```

A place that keeps one on purpose says why, on the line above:

```tsx
// @estiva-escape: the reason, at least ten characters
<button …>
```

or, as a JSX child, `{/* @estiva-escape: the reason */}`. Not `eslint-disable`:
it switches the rule off without saying why, and the gate counts it as a
failure. `countGates(results)` counts errors and escapes for
`.gates-count.json`; lint with `settings: { estiva: { reportEscapes: true } }`
for the escapes to be counted. `estiva-gates count` does both for you (below).

### The gate pieces — `@estiva-app/ui/gates`

Everything else an app needs to be gated ships here too, once, so an app never
carries a copy (`docs/GATES.md` §23). It needs `eslint`, `typescript-eslint` and
`eslint-plugin-better-tailwindcss` installed beside it.

- `tokenLint()` and `tokenValues()` — the token contract as lint: only the
  preset's names, no hand-written values, no colour in an inline style.
- `gateConfig()` — the gate lint on its own (`eslint.gates.config.js`): the
  plugin's rules, with the token plugins registered so their disable comments
  still resolve.
- `estiva-gates count --repo <name>` — lint with the gate config and write
  `.gates-count.json`; fails if an error or an unwritten reason appears.
- `estiva-gates hook` — the same refusal before a file is written, for a Claude
  Code `PreToolUse` hook in `.claude/settings.json`.
- `estiva-gates status` — `gates:status`, read from the code.
- `appChecks(h)` — the checks every app runs in its `scripts/gates-checks.mjs`.
  `npm run gates:compare` holds them to the checks Peek and Ship run.

### A new app — `create-estiva-app`

```bash
npx -p @estiva-app/ui create-estiva-app leaf --title Leaf
```

It makes a folder that builds, runs and signs in with Estiva ID, with every gate
on from its first commit: the lint rules and the token lint at zero, the count
file, the editor hook, the CI job `gate`, and `gates:status`. It reads nothing
but this package. The frame is `AppShell` with a `Sidebar`, one theme
(`--theme`, default `light`) set once in `index.html`. Its README says what is
left to do by hand: register the app with Estiva ID, and protect `main`.

### The catalogue — `estiva-ui`

"Do we already have this?" has one answer: `estiva-ui find <what it does>`.

```bash
npx estiva-ui find a floating panel     # the package's parts, and this app's own
npx estiva-ui check                     # every part says what it is for (CI's job gate)
```

- **The package's catalogue** is `registry.json`, generated from the code,
  committed and shipped: one entry per export, with its purpose, every prop it
  declares, what it owns and where its page is.
- **An app's catalogue** is built from the app's own code each time it is read,
  and never committed. Every part a `.tsx` file exports is listed with its
  purpose (a one-line `/** … */` above it), where the app uses it, and its kind:
  a pass-on of a package part, used in one place, used in several, a candidate to
  move into the package, or used nowhere. `estiva-ui check` fails on a part with
  no description. `--also [name=]<folder>` adds an app that sits beside this one.
- `@estiva-app/ui/registry` exports the builders and the search for a tool that
  reads them itself.

## The rules

### Forking is allowed

> Forking a component into your app is allowed and is not a failure. If you
> fork one, you owe nothing back. Tokens are the only thing you must not
> diverge from.

If a primitive nearly fits but not quite, copy it into your app and change
it. Say so on the package's ticket — a fork is information about the seam —
but do not bend your view around a component, and do not wait for
permission. A library people are afraid to deviate from becomes a tax.

### Tokens, never raw hex

If the colour you need has no token, the token is missing: add it here, in
every theme, rather than reaching for hex in an app.

A transparent colour is a token too. A wash, an outline, a glow or the scrim
lives in `tokens.css`, not in an opacity modifier on another token:
`bg-bg-inset/40` compiles to nothing, because the tokens are plain `var()`
values.

### The tailwind-merge pitfall — retired for `cn()` users

Stock `tailwind-merge` **silently drops** a custom text-size class
(`text-btn-small`, `text-caption`, `text-h2`…) when a `text-{colour}` class
sits in the same merged list — it cannot classify the size, files it as a
colour, and lets the real colour knock it out. Since 2026-09-01 the
package's `cn()` is taught the preset's type ramp (`src/cn.ts`; `cn.test.ts`
pins the list to the preset), so **token size classes are safe in merged
lists** and are what new code should write. The trap still exists for anyone
merging with their own un-extended config — both apps re-export this `cn`,
so don't. Older components still spell sizes as arbitrary values; they
render identically and migrate to tokens as they are touched.

### Menus and popovers — five rules

Stay open on hover · close on mouse leave (for hover-opened menus) · guard
the parent's hover state · close on outside click · close on Escape. Each is
forgettable on its own, and a popover that fails one feels broken without
anyone being able to say why. A click-opened menu (Select, a `…` menu) owes
the last two; a hover-opened one owes all five.

### Only offer actions that can succeed

An action appears only where it works. A control that cannot succeed right
now is disabled *with its reason*, and a control someone may never use is
absent, not disabled. `Button` and `IconButton` carry it as
`disabledReason="Sign in first"`: disabled, still reachable by Tab, the
reason shown as a tooltip. Never a button that fails.

## Themes

| Theme    | Selected by                                    | Whose                          |
|----------|------------------------------------------------|--------------------------------|
| `signal` | `data-theme="signal"` or `.dark.signal`        | Peek — what it renders         |
| `ship`   | `data-theme="ship"`                            | Ship — what it renders         |
| `dark`   | `data-theme="dark"` or `.dark`                 | Peek's base under Signal       |
| `light`  | nothing                                        | the `:root` base; Estiva ID    |

Peek's Signal-only extras (washes, glows, the summary highlight, the huddle
register, the wordmark, the mono stack) are product, not the contract, and
stay in Peek's own `.signal` block.

## Working on it

```
npm install
npm test            # tokens (every theme defines every token the preset names, and no other), cn(), and each component's page claims
npm run lint        # the token contract: no class Tailwind does not generate, no ramp, no raw colour
npm run typecheck
npm run storybook   # http://localhost:6008 — Design Tokens, and each primitive, in signal and ship
```

A change must not change how an app renders: screenshot-compare before and
after, in both themes here and in the apps' own Storybooks. `CLAUDE.md` is
the index. What a component, a story, a page and a release are held to is in
`.claude/rules/`; how a port is done and a change is proved are the `port` and
`verify` skills in `.claude/skills/`.
