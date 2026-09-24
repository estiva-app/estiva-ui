---
name: port
description: Use when moving an existing @estiva-app/ui component onto Base UI (a port), or rebuilding one on a Base UI part; the steps, in order, and the definition of done.
---

# A port, step by step

The model is the Tabs port (stage 1, 2026-09-07). Every later port repeats it; none interprets it.
The rules it relies on are in `.claude/rules/components.md` and `.claude/rules/stories-and-pages.md`.

## Before you write

- **Read shadcn's Base UI version of the component into a scratch folder.** Keep its part structure and accessibility wiring; discard every class and its `cva`. Nothing from shadcn is installed or imported.
- **Read the existing component and its `.mdx` page** in full. The class list is the design; it moves across unchanged.

## The steps (Tabs as the example)

1. **Read Base UI's part.** `node_modules/@base-ui/react/tabs/*/*.d.ts` and the `.js` beside it: Root, List, Tab, Panel, Indicator; what each renders, which data attributes it sets, what `onValueChange` reports and when. Read shadcn's Base UI file for its structure (Root > List > Tab), keep nothing else.
2. **Read ours in full**: `src/Tabs.tsx`, `Tabs.stories.tsx`, `Tabs.mdx`. Note the class list, the props, and what the page says it lacks ("no arrow-key roving").
3. **Grep the callers**: `grep -rn "<Tabs" ../peek/src ../ship/src` — four callers and one test. Note what each passes (`className`: nobody).
4. **Write it.** Root carries the caller's `className` and the controlled `value`/`onValueChange`; List carries the row's classes; Tab carries the old class list, keyed to Base UI's state through `className={(state) => cn(...)}` — the ternary that read `active === tab.id` now reads `state.active`. Sizes spelled in pixels become the type tokens.
5. **Pin the page's claims in a test** (`Tabs.test.tsx`: jsdom, Testing Library, user-event; plain matchers, this package has no jest-dom). The Keys table is written from the tests, after they pass.
6. **Update the page**, in the order `src/pages.test.ts` checks: How, then What it owns, then the Keys table, then Props.
7. **Check**: `npm run lint`, `npm run lint:rules`, `npm run typecheck`, `npm test`. Then prove the pixels: the `verify` skill.
8. **No axe run** (CLAUDE.md). If the port removes the cause of a story's exception, remove the exception in the same commit; otherwise leave it.
9. **Link into the apps** and photograph their stories: the `verify` skill.
10. **Commit per component.** The message names the behaviour that changed, the proof, and every caller. The changelog entry does the same in the reader's words.

## The definition of done

All of it, for every component in the PR:

1. behaviour from Base UI or a specialist; no portal, Escape, arrow-key or focus code of our own (CLAUDE.md; the gate rule `estiva/no-hand-rolled-behaviour`);
2. class list verbatim, tokens only; computed-style diff empty (`components.md`; `verify`);
3. props unchanged, additions documented (`components.md`);
4. stories for every variant, both themes, placeholder content (`stories-and-pages.md`; `npm run registry:check`);
5. the page on the contract, Keys table, gaps stated (`stories-and-pages.md`; `src/pages.test.ts`);
6. tests pin the page's claims (`components.md`);
7. `lint`, `lint:rules`, `typecheck` and `test` green; photo diffs empty or ruled (`verify`);
8. changelog entry with callers named (`release.md`).
