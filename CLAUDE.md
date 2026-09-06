# `@estiva-app/ui`, for Claude Code

This is Estiva's design package: the tokens every Estiva app must use and the components they may use. It is consumed from npm by Peek and Ship, and it churns faster than anything else in the suite, which is why the rules here are strict and short. Read them before touching `src/`. `README.md` is for consumers; this file is for whoever changes the package.

---

## 1. What the package is, in three sentences

**Tokens are the contract; components are a convenience.** An app that reaches for a colour or a size outside `tailwind-preset.js` is not an Estiva app, whatever else it does.

**Behaviour is rented, appearance is ours.** Every component that has a Base UI counterpart is built on it: popups, focus, keyboard, ARIA and collision come from `@base-ui/react`, and this package writes only the class list, the token usage and the props the apps need. Nothing under `src/` may contain `createPortal`, an Escape handler, arrow-key handling, outside-click logic or a focus trap of its own. (Components written before this rule still do; each is replaced as the migration reaches it. Do not add to them.)

**Shared means product-agnostic.** No app name and no product noun (topic, issue, huddle, message, file, project) in a component name, a prop, a story label or a docs page. A component that needs one belongs to its app.

---

## 2. Before you write anything

1. **Check Base UI first.** If Base UI has a part for it (its list is on base-ui.com/react/components), the component is built on that part. There is no "ours already works" argument; that was ruled on 2026-09-06. The only exception is a counterpart that would break the component's logic outright, and that is written into the docs page when met, never assumed.
2. **Read shadcn's Base UI version of the component into a scratch folder.** Keep its part structure and accessibility wiring; discard every class and its `cva`. Nothing from shadcn is installed or imported.
3. **Read the existing component and its `.mdx` page** in full. The class list is the design; it moves across unchanged.
4. **Grep the two apps for every caller** before changing a prop: `grep -rn "<ComponentName" ../peek/src ../ship/web/src`. A prop's name and type are frozen during a port; additions are allowed, renames are a breaking change and name every caller in the changelog.
5. **Never guess.** Read the source or measure it. A number, a class or a behaviour that was recalled rather than read has been wrong before, in both directions.

---

## 3. Tokens

- Colour, size, radius and shadow come from the preset's names and nothing else. The names are doubled in the class: the token `bg-surface` is the class **`bg-bg-surface`**, `text-primary` is **`text-text-primary`**. `bg-surface` compiles to nothing and is dropped silently; Ship shipped a transparent sign-in screen that way.
- No Tailwind default ramp or palette: never `text-sm`, `text-xs`, `bg-gray-100`, `text-white`.
- No hex, no `rgba(...)` beside a variable that holds the same colour. A colour with no token is a missing token: add it to `tokens.css` in **every** theme block (`tokens.test.ts` fails otherwise) and to the preset.
- **No opacity modifiers on token colours** (`bg-bg-inset/40`): the tokens are plain `var()` values and the modifier compiles to nothing. Use the `-muted` token.
- Merge classes with this package's `cn()` only. It is `tailwind-merge` taught the type ramp, so `text-body-2` survives beside `text-text-primary`. Stock `twMerge` drops it. Older components still spell sizes as `text-[14px]`; that is no longer necessary and is migrated to the token as each is touched.
- Deliberate exceptions carry a comment saying why. An undocumented raw value is a defect.

---

## 4. Building a component

- Base UI parts compose through `className` (a string, or a function of state) and `render`. Our `Button` becomes a `Menu.Trigger` through `render`, never through a wrapper element. A component used as a `render` target must forward its ref and spread its props.
- Style states through Base UI's data attributes (`data-open`, `data-disabled`, `data-checked`), not through prop-driven conditionals, so that what the DOM says and what the class says cannot disagree.
- The class list arrives **verbatim** from where the design came from. A port that re-expresses a style in raw CSS, a `style` object or a different token has forked the design system and breaks theme switching.
- `shrink-0` on any hairline or fixed-height child inside a flex column; without it a `1px` rule renders at `0px` and nobody notices.
- A hover-only affordance is CSS (`group-hover`, `:hover`), never a React mount; a mount cannot stay in step with a transition.
- Sizes and spacing in the class list, never computed in JavaScript, unless the value depends on data (an avatar's pixel size).
- Where the caller owes something for accessibility (an `aria-label` on an icon-only button, a `label` on a field), the prop is required, not optional.
- A class map (a `Record<Variant, string>` of class lists) is named so the lint can see it: `typeStyles`, `TONE_STYLES`; a name ending in `Styles` / `_STYLES` or `Classes` / `_CLASSES`. The lint reads `className`, `cn()` and `clsx()` by default and nothing else; a map named any other way is invisible to `no-unknown-classes`.

---

## 5. Stories

- Every component has a `.stories.tsx` beside it. Every variant and every state that has a name in the props table is a story. A story that needs app data does not belong here; the component is then not a primitive.
- Placeholder content only: `IconSquareRounded` at 16 / stroke 1.5 for icons, neutral labels ("Item", "Item one", "Label"), "Nothing here yet." for empty states, no real names, no product nouns.
- Stories render in both product themes from the toolbar (`signal`, `ship`); a story that only reads right in one has a colour from outside the token set.
- Frame and layout stories render full height (`h-screen`) and, where they scroll, with enough rows to actually scroll. Every bar story stands against content.
- Story names are the variant's name, in words a designer uses.

---

## 6. Documentation (the MDX page)

Every component has an attached `.mdx` page, in this order and no other:

1. One-line intro: what it is and what it is for.
2. **The live canvas first**, before any prose.
3. **When** — each variant's job, one line each.
4. **When not** — the alternative, named (a link to the other component's page).
5. **How** — the import and real code; the traps inline where they bite; the accessibility contract where the caller owes something.
6. **Keys** — a table, wherever the keyboard has a contract. Written from what the tests pin, not from Base UI's documentation.
7. **Controls** — the props table.

Vetoed: microcopy sections, provenance footnotes, do/don't image pairs, maturity badges, per-page token lists, per-page changelogs. Provenance lives in `README.md` and git.

**Document only what is tested, and state the gaps plainly.** "Tooltip is hover-only" and "DialogShell does not trap focus" were true sentences on their pages when they were true; a gap written down is a known cost, a gap papered over is somebody else's bug.

`stories/Choosing.mdx` is the decision table every app reads before picking a component. When a component arrives or changes its job, its row changes in the same PR.

---

## 7. Tests

- `tokens.test.ts`: every theme defines every token the preset names, and no other. Never weaken it.
- `cn.test.ts`: the ramp `cn()` knows matches the preset. Add a size, add it there.
- Per component: what the docs page claims. If the Keys table says Escape closes, a test presses Escape. If the props table says `disabled` keeps focus, a test tabs to it.
- Every story runs through axe, in both themes, as the `storybook-signal` and `storybook-ship` Vitest projects (`npm run test:a11y`; CI runs it on every push, in its own job). A story that fails axe does not merge; "it is decorative" is written as `aria-hidden`, not as an exception. Where an exception exists it is one rule on one story or meta (`parameters.a11y.config.rules`), with the measured reason beside it and the stage that clears it; `test: 'todo'` is not used, because it silences every rule at once.

---

## 8. Verification: prove it, do not look at it

A port must not change a pixel in the app the design came from. The proof is:

1. **Screenshot diff** of every story in this package, both themes, against the baseline kept under `.verify-shots/` in the `peek` checkout beside this one (its README explains the tooling).
2. **Screenshot diff of every app story that contains the component**, with the package linked into the app (`npm install K:/Estiva/estiva-ui --no-save` in `ship/web` or `peek`), against that app's baseline. `git status` in the app stays clean; `npm ci` restores it.
3. **Computed-style diff** where a screenshot cannot tell (line height, letter spacing, a 1px radius): the `.verify-*.mjs` scripts drive Chrome and compare `getComputedStyle` on the same theme both sides.
4. **Restart Storybook** after any change to the preset, the Tailwind config, or a file replaced by a re-export. A stale Storybook has cost a review round.

Every non-empty diff is either a ruling (named in the PR) or a defect. "It looks the same" is not a result.

---

## 9. Changelog and versions

- `CHANGELOG.md` gets an entry per change: the trigger (which app needed it, which finding, which ruling), and for a breaking change **every caller it affects, by file, read from the apps**.
- `0.x` semver: a minor carries a breaking change; a patch never does.
- Consumers install from npm; the local link is for verification only and never what a PR asserts.
- A lockfile generated on Windows drops other platforms' optional dependencies. Regenerate consumer-facing lockfiles in a Linux container (`docker run --rm -v <tmp>:/app -w /app node:24 npm install --package-lock-only`).

---

## 10. Review and merge

- Katerina reviews every component **visually, in the package Storybook on `:6008`, in both themes**, and answers in numbered lists. Nothing merges before that review.
- One branch and one PR for the whole migration plan (`base-ui-migration`; D15, 2026-09-06). A stage is a run of commits on it, reviewed in `:6008` as it lands. Never one PR per component: the question a review answers is whether the set still looks right together.
- The definition of done, all of it, for every component in the PR:
  1. behaviour from Base UI or a specialist; no portal, Escape, arrow-key or focus code of our own;
  2. class list verbatim, tokens only; computed-style diff empty;
  3. props unchanged, additions documented;
  4. stories for every variant, both themes, placeholder content;
  5. MDX page on the template, Keys table, gaps stated;
  6. tests pin the page's claims;
  7. lint green, axe green, screenshot diffs empty or ruled;
  8. changelog entry with callers named.

---

## 11. The traps, in one place

| Trap | What happens | Rule |
|---|---|---|
| Doubled prefix | `bg-surface` compiles to nothing | `bg-bg-surface`; the lint's `no-unknown-classes` |
| `tailwind-merge` and the ramp | a token size beside a colour is dropped | use this package's `cn()` |
| Opacity modifier on a token | `bg-bg-inset/40` compiles to nothing | `-muted` token |
| Tailwind `content` | a preset's `content` is not merged; classes purge | consumers spread `estivaContent` |
| Missing `shrink-0` | a hairline renders `0px` in a flex column | `shrink-0` on every fixed-size child |
| Hover hint as a React mount | out of step with the fade | CSS only |
| Stale Storybook | the review sees old code | restart after config or re-export changes |
| Windows lockfile | CI's Linux `npm ci` fails | regenerate in a container |
| Recalled facts | wrong in both directions | read the source, measure the pixel |
| Class map named freely | the lint never reads it | end the name in `Styles` or `Classes` |
| Windows `npm install` | drops Linux optional entries, adds peer flags | regenerate the lock in a container (§9) |

---

## 12. Tooling

```
npm run storybook     # :6008, both themes in the toolbar
npm test              # tokens, cn, components (the `unit` Vitest project)
npm run test:a11y     # every story through axe, both themes (Vitest browser projects; `npx playwright install chromium` once)
npm run lint          # eslint-plugin-better-tailwindcss: no-unknown-classes, no-restricted-classes (ramp, palette, raw colours)
npm run build         # esbuild bundle + tsc declarations
```

The sidebar's test widget in `:6008` runs the same stories through the same plugin, in the toolbar's default theme only: it can hold one project per `.storybook` folder, so the second theme is the command line's. `no-conflicting-classes` is not on: the plugin supports it on Tailwind 4 only. The screenshot baselines are in `../peek/.verify-shots/base-ui-before-ui-signal`, `-ui-ship`, `-peek` and `-ship`, taken 2026-09-06 on 0.6.0 before anything moved; `shots-themed.mjs` beside them shoots this Storybook in a named theme.

The order of work and Katerina's rulings live outside this repository, in `K:\Estiva\migration docs\` (`PLAN.md`, `DECISIONS.md`); a ruling there outranks anything here.
