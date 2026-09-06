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
