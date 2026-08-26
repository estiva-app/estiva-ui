# @estiva/ui

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

## Using it

```js
// tailwind.config.js
import estiva from '@estiva/ui/tailwind-preset'
export default {
  presets: [estiva],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { /* your app's own tokens, if any */ } },
}
```

```css
/* your entry CSS, before anything that uses a token */
@import '@estiva/ui/tokens.css';
```

```html
<html data-theme="ship">   <!-- or "signal" / "dark"; nothing = light. Peek uses the classes: <html class="dark signal">. -->
```

Until the package is published (SHA-1), consume it as a local path:
`"@estiva/ui": "file:../estiva-ui"`.

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

### The tailwind-merge pitfall

A custom text-size class (`text-btn-small`, `text-caption`, `text-h2`…) is
**silently dropped** by `tailwind-merge` when a `text-{colour}` class follows
it in the same merged list. In shared components, spell sizes as arbitrary
values — `text-[12px] leading-[12px]` — and keep the token classes for plain
`className` strings that never go through `cn()`. The bug appears in the
consuming app and its cause is in the package, which is why this rule lives
here.

### Menus and popovers — five rules

Stay open on hover · close on mouse leave (for hover-opened menus) · guard
the parent's hover state · close on outside click · close on Escape. Each is
forgettable on its own, and a popover that fails one feels broken without
anyone being able to say why. A click-opened menu (Select, a `…` menu) owes
the last two; a hover-opened one owes all five.

### Only offer actions that can succeed

An action appears only where it works. A control that cannot succeed right
now is disabled *with its reason* (a tooltip), and a control someone may
never use is absent, not disabled. Primitives expose what that needs: a
`disabled` that can explain itself, never a button that fails.

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
npm test            # every theme defines every token the preset names, and no other
npm run storybook   # http://localhost:6008 — Design Tokens, and each primitive, in signal and ship
```

Extracting a primitive from Peek must not change how Peek renders:
screenshot-compare before and after, in Peek's own Storybook.
