---
paths:
  - "src/*.stories.tsx"
  - "src/*.mdx"
  - "stories/**"
---

# Stories and pages

Loads when you read a story, a component's `.mdx` page, or anything in `stories/`.
A page and its stories are one piece of work: the page imports the stories.

## Words: placeholder content only

- Placeholder content only: `IconSquareRounded` at 16 / stroke 1.5 for icons, neutral labels ("Item", "Item one", "Label"), "Nothing here yet." for empty states, no real names, no product nouns.
- **This applies to every word in a story and on a page, not only to the props.** A row labelled "Mark as Highlight", a section called "Utilities", a card of messages or a preview of a conversation all name one app's furniture, and a reader from the other app has to translate before they can see the component. Katerina, 2026-09-08. Say what the thing *is*: "Item one", "Move to…", "Label" / "Value". Where an example needs prose, write prose that explains the component's own behaviour rather than borrowing a product's.

## Stories

- A story that needs app data does not belong here; the component is then not a primitive.
- Stories render in both product themes from the toolbar (`signal`, `ship`); a story that only reads right in one has a colour from outside the token set.
- Frame and layout stories render full height (`h-screen`) and, where they scroll, with enough rows to actually scroll. Every bar story stands against content.
- Story names are the variant's name, in words a designer uses.
- **A story introduces the component; it does not argue for it**. A canvas that exists to prove a point — the same buttons in a toolbar and in a plain row, so the Tab stops can be counted — is an argument. Make the claim in the test file, where a claim belongs, and spend the canvas on a variant.
- **A story may not name furniture the package has not got**. "From a quick menu" borrowed one app's `ConversationQuickMenu`; what the canvas actually drew was a card with a `Toolbar` of actions, which is what it says now.
- **A story may not hand-build a component this package already has**. Two `DialogShell` stories rebuilt `ConfirmDialog`, and one of them rebuilt it *wrongly*, on a plain dialog whose backdrop dismissed the question. Where the only honest example of a prop is another component, say so on the page and let that component's canvases be the coverage.

## Axe exceptions in a story

No axe run on Katerina's machine (CLAUDE.md). These are for writing a story:

- "It is decorative" is written as `aria-hidden`, not as an exception.
- Where an exception exists it is one rule on one story or meta (`parameters.a11y.config.rules`), with the measured reason beside it and the stage that clears it. `test: 'todo'` is not used, because it silences every rule at once.
- If a change removes the cause of a story's exception, remove the exception in the same commit; otherwise leave it.

## The page (`.mdx`)

The order is what `src/pages.test.ts` checks: the title, a line saying what it is, then `When`, `When not`, `How`, `What it owns`, each once and in that order, before `Keys` and `Props`.
What the test does not check:

- **The live canvas first**, before any prose.
- **When** — each variant's job, one line each.
- **When not** — the alternative, named (a link to the other component's page).
- **How** — the import and real code; the traps inline where they bite; the accessibility contract where the caller owes something.
- **Keys** — a table, wherever the keyboard has a contract. Written from what the tests pin, not from Base UI's documentation.

Vetoed: microcopy sections, provenance footnotes, do/don't image pairs, maturity badges, per-page token lists, per-page changelogs. Provenance lives in `README.md` and git.

**Document only what is tested, and state the gaps plainly.** "Tooltip is hover-only" and "DialogShell does not trap focus" were true sentences on their pages when they were true; a gap written down is a known cost, a gap papered over is somebody else's bug.

`stories/Choosing.mdx` is the decision table every app reads before picking a component. When a component arrives or changes its job, its row changes in the same PR.
