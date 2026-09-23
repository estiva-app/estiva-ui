# `@estiva-app/ui`, for Claude Code

This is Estiva's design package: the tokens every Estiva app must use and the components they may use. It is consumed from npm by Peek and Ship, and it churns faster than anything else in the suite, which is why the rules here are strict and short. Read them before touching `src/`. `README.md` is for consumers; this file is for whoever changes the package.

**The UI Guardrails project:** `docs/GATES.md` §0 says where it stands, and `docs/GATES-GUIDE.md` is its source of truth.
`npm run gates:status` reads the real state of every ticket from the code, here and in the `peek` and `ship` checkouts beside this one.

**The gate lint, and a session opened above this folder.** This package's own gate rules run in `npm run lint:rules`, in CI's job `gate`, and before the write by `.claude/hooks/gates.mjs` — but that hook runs only in a Claude session started in this folder. A session started in a folder above it (a workspace holding several repositories) does not get the hook, so: after changing any `.tsx` under `src/`, run `npm run lint:rules` in this repository and fix everything it reports before you finish.

---

## What the package is, in three sentences

**Tokens are the contract; components are a convenience.** An app that reaches for a colour or a size outside `tailwind-preset.js` is not an Estiva app, whatever else it does.

**Behaviour is rented, appearance is ours.** Every component that has a Base UI counterpart is built on it: popups, focus, keyboard, ARIA and collision come from `@base-ui/react`, and this package writes only the class list, the token usage and the props the apps need.

**Shared means product-agnostic.** No app name and no product noun (topic, issue, huddle, message, file, project) in a component name, a prop, a story label or a docs page. A component that needs one belongs to its app.

---

## In every session

- **Never guess.** Read the source or measure it. A number, a class or a behaviour that was recalled rather than read has been wrong before, in both directions.
- **No axe run on Katerina's machine.** Accessibility is handled later, all at once (Katerina, 2026-09-07). Never run `npm run test:a11y`. A bare `npx vitest run` runs axe too: always name a project (`npm test` runs `--project unit`).
- **Review.** Katerina reviews every component **visually, in the package Storybook on `:6008`, in both themes**, and answers in numbered lists. Nothing merges before that review.
- **One branch and one PR per ticket.**

---

## Commands

```
npm run storybook     # :6008, both themes in the toolbar
npm test              # tokens, cn, components (the `unit` Vitest project)
npm run lint          # the token lint and the gate rules (eslint.config.js)
npm run lint:rules    # the gate rules alone: what the hook and CI's `gate` run
npm run typecheck
npm run build         # esbuild bundle + tsc declarations
```

`npm run test:a11y` puts every story through axe in both themes. CI runs it after a merge to `main` only; never run it locally.
`npm run registry:check` and `npm run skill:check` run in CI's `gate`. `npm run ui:find` is the `estiva-ui` skill's first step.

**CI** (`.github/workflows/check.yml`): `gate` is the only job a merge requires. It runs the gate rules, the token lint, the page contract (`src/pages.test.ts`), the skill check and the registry check. `check` (typecheck, tests, build and more) and `a11y` do not block a merge.

---

## Where rulings live

Katerina's rulings are in `docs/GATES.md`. A ruling outranks anything in this file.

---

## Where the rest lives

Each rule file loads by itself once you read a file it names. A skill loads when its task comes up, or when you call it.

| File | Loads when you read | What it holds |
|---|---|---|
| `.claude/rules/components.md` | a file at the top of `src/` (a component, its test, `cn.ts`) | Base UI first, callers, composing parts, two layout traps, the two exception forms, tests |
| `.claude/rules/stories-and-pages.md` | a story, an `.mdx` page, `stories/` | placeholder words, story rules, axe exceptions, the page |
| `.claude/rules/tokens.md` | `tokens.css`, the preset, the Tailwind config, `cn.ts` | transparent tokens; never weaken `tokens.test.ts` |
| `.claude/rules/release.md` | `CHANGELOG.md`, `package.json`, the lockfile | the changelog, semver, the lockfile |
| skill `port` | — | moving a component onto Base UI, step by step, and the definition of done |
| skill `verify` | — | the photo check, linking into the apps, measuring |
| skill `estiva-ui` | — | the package's own skill (`skill/estiva-ui.md`): search first, and the 24 Gotchas |
