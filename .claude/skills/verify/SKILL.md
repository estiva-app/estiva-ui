---
name: verify
description: Use before calling a change to a component, a token or the preset done, to prove by photographs and measurement that nothing moved in this Storybook or in the apps' Storybooks.
---

# Verification: prove it, do not look at it

A port must not change a pixel in the app the design came from.
Nothing in CI photographs anything, so the proof is yours.

Every non-empty diff is either a ruling (named in the PR) or a defect. "It looks the same" is not a result.

## 1. Photograph the stories the change reaches

1. **Which stories.** Only the stories whose files reach the changed component through their imports, never the whole Storybook.
2. **Before**, on the unchanged code, **once**. Wait for each story's play script before the photo.
3. **After**: the same stories, into another folder.
4. **Compare**: list only the photos that differ. A channel off by 8 or less is noise.
5. **Look**: put the two crops side by side, magnified. A difference is explained only when its crop has been looked at.

The tooling is in the peek checkout, `.verify-shots/` (its `README.txt` explains it); it drives installed Chrome with `playwright-core`.

Themes: this package `signal` and `ship` (one run each); Peek `signal`; Ship `ship`.

Every non-empty diff gets a measurement, not a guess: Checkbox's 1px came from an empty `<span>` hanging on a text line differently from an empty `<button>`, found by putting both beside each other in the story and reading their boxes.

`shots-themed.mjs` in `../peek/.verify-shots` shoots this Storybook in a named theme.

## 2. Link the package into the apps

1. `npm run build` here.
2. `npm install <this repository's folder> --no-save` (`K:/Estiva/estiva-ui`, or the worktree you built in) in `../peek` and `../ship`. `git status` in the app stays clean.
3. Stop and restart the app's Storybook.
4. Photograph the app's stories that reach the change (step 1 above), before (on the published package, on the checkout as it is now) and after. Diff, explain.
5. **Restore**: stop every Storybook and Vite server in that checkout, then `npm ci`, then start them again. A running server holds a native binary open and `npm ci` dies half-way (the `estiva-ui` skill, Gotcha 22).

The link serves the browser only: an app's Vitest resolves React twice through a symlink once the package reaches React via a dependency (Base UI) — "Cannot read properties of null (reading 'useRef')". A caller's test runs against `npm pack`'s tarball, installed the same way.

`npm pack` after a source change carries the previous `dist/`: `pack` runs `prepack`, not `prepublishOnly`, and an app installing it tests the old code (2026-09-08: an hour on a "fix" that was never in the tarball). `npm run build`, then pack; grep the tarball for the change before installing it.

Consumers install from npm; the local link is for verification only and never what a PR asserts.

## 3. Measure what a photo cannot tell

**Computed-style diff** where a screenshot cannot tell (line height, letter spacing, a 1px radius): the `.verify-*.mjs` scripts (gitignored, in the peek checkout) drive Chrome and compare `getComputedStyle` on the same theme both sides.

**Restart Storybook** after any change to the preset, the Tailwind config, or a file replaced by a re-export. A stale Storybook has cost a review round.

## 4. The app's first hour

Some defects show in no package canvas: a control re-created on a state change, a required field named with its asterisk, a disabled trigger that opens — none visible in Storybook, all three found in an app's first hour (2026-09-08). The app's first hour is part of the work. Read every app failure as a possible package defect before touching the app's test.

## 5. Only when Katerina asks for accessibility

Never otherwise (CLAUDE.md). When she does:

- One theme per run: `npx vitest run --project storybook-signal src/Tabs.stories.tsx`, then `--project storybook-ship`. The two projects race on one cache directory when run together ("Failed to fetch dynamically imported module"); if it already happened, clear `node_modules/.cache/storybook/*/sb-vitest`.
- The sidebar's test widget in `:6008` runs the same stories through the same plugin, in the toolbar's default theme only: it can hold one project per `.storybook` folder, so the second theme is the command line's.
