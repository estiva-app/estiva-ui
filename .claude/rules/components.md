---
paths:
  - "src/*.tsx"
  - "src/*.ts"
---

# Building a component

Loads when you read a component, its story, its test, or another file at the top of `src/`.
A port has its own steps: the `port` skill.

## Before you write

- **Check Base UI first.** If Base UI has a part for it (its list is on base-ui.com/react/components), the component is built on that part. There is no "ours already works" argument; that was ruled on 2026-09-06. The only exception is a counterpart that would break the component's logic outright, and that is written into the docs page when met, never assumed.
- **Grep the two apps for every caller** before changing a prop: `grep -rn "<ComponentName" ../peek/src ../ship/web/src`. A prop's name and type are frozen during a port; additions are allowed, renames are a breaking change and name every caller in the changelog.

## Writing it

- Base UI parts compose through `className` (a string, or a function of state) and `render`. Our `Button` becomes a `Menu.Trigger` through `render`, never through a wrapper element. A component used as a `render` target must forward its ref and spread its props.
- Style states through Base UI's data attributes (`data-open`, `data-disabled`, `data-checked`), not through prop-driven conditionals, so that what the DOM says and what the class says cannot disagree.
- The class list arrives **verbatim** from where the design came from. A port that re-expresses a style in raw CSS, a `style` object or a different token has forked the design system and breaks theme switching.
- A hover-only affordance is CSS (`group-hover`, `:hover`), never a React mount; a mount cannot stay in step with a transition.
- Sizes and spacing in the class list, never computed in JavaScript, unless the value depends on data (an avatar's pixel size).
- Where the caller owes something for accessibility (an `aria-label` on an icon-only button, a `label` on a field), the prop is required, not optional.
- **A floating thing draws the package's one elevated box**, `MenuPanel` — a menu, a popover, a preview card and a toolbar are the same box at different widths. A component that floats and draws no box is unfinished; two boxes inside each other is the tell that one of them should have been switched off.
- **A panel that acts on what is under it opens above its trigger**. A toolbar acts; a rename field is *about* its trigger and hangs from it. The side is a *preference* — Floating UI measures the room and overrules it — which is the reason placement is the library's job and never arithmetic of ours.
- **A picker picks**. The state of what it produces belongs to the thing it produces: `ReactionPicker` offers, `Reaction` carries the count and the accent fill. A component that both offers and reports is two components wearing one name.
- Merge classes with this package's `cn()` only. Stock `twMerge` drops `text-body-2` beside `text-text-primary`.

## Two layout traps

- An empty `<span>` for an empty `<button>` sits 1px higher on a text line (the same in a flex row). Keep the element the design was drawn with, or measure both.
- A square control in a flex row: `align-items: stretch` grows it to the row's height — an `IconButton` measured 24×268, and a menu hung 360px below its trigger. Put `items-start` / `items-center` on the row; measure the control, not the row.

## Exceptions

Deliberate exceptions carry a comment saying why. An undocumented raw value is a defect.
There are two forms, and they are not the same:

- **A gate rule** (`estiva/…`, run by `npm run lint:rules`): `// @estiva-escape: <reason>` on the line above, or `{/* @estiva-escape: <reason> */}` in JSX. Never inside an `eslint-disable`.
- **A token rule** (run by `npm run lint`): `// eslint-disable-next-line <rule> -- @estiva-escape: <reason>` (Katerina's ruling A2, 15 September). See `src/Avatar.tsx` and `src/AvatarGroup.tsx`.

## Tests

- Per component: what the docs page claims. If the Keys table says Escape closes, a test presses Escape. If the props table says `disabled` keeps focus, a test tabs to it.
- A component test is `Component.test.tsx`: jsdom, Testing Library, user-event; plain matchers, this package has no jest-dom. The Keys table is written from the tests, after they pass.
