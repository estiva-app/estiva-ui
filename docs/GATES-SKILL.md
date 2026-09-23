# GATES-SKILL.md — the skill's Gotchas, reconciled against the record (UIG-20)

Read 23 September 2026. Sources: `K:\Estiva\migration docs\PEEK-ADOPTION.md` §17 (lines 590–642, end of file), `K:\Estiva\migration docs\PLAN.md` §14 (lines 254–870), `docs/GATES-DEBT.md` in estiva-ui / peek / ship at `origin/main`, estiva-ui `docs/GATES.md` at `origin/main` (3,608 lines, all read). Part names and props checked against estiva-ui `origin/main` `registry.json` (87 entries) and the `.mdx` pages.

## A. Counts

| source | defect rows | → a Gotcha | excluded | excluded, by category |
|---|---|---|---|---|
| PEEK-ADOPTION §17 (rows 1–13) | **13** | 12 | 1 | ruled 1 |
| PLAN §14 (rows 14–75) | **62** | 15 | 47 | tooling 33 · a11y 8 · steps 3 · ruled 2 · removed 1 |
| GATES-DEBT ×3 (rows 76–91) | **16** (estiva-ui 1, peek 5, ship 10) | 1 | 15 | gate 9 · ruled 4 · tooling 2 |
| GATES.md (rows 92–542) | **451** | 83 | 368 | tooling 225 · ruled 72 · gate 32 · removed 18 · steps 15 · a11y 6 |
| **total** | **542** | **111** | **431** | tooling 260 · ruled 79 · gate 41 · removed 19 · steps 18 · a11y 14 |

**111 + 431 = 542.** Every row is either a Gotcha or one of the six exclusions. The exclusions add up: 260 + 79 + 41 + 19 + 18 + 14 = 431.

Rows per Gotcha (all 24 carry at least two recorded defects):

| G | rows | row numbers |
|---|---|---|
| G1 header row by hand | 9 | 2, 4, 54, 217, 326, 328, 329, 337, 499 |
| G2 no scroll container | 4 | 1, 53, 325, 532 |
| G3 EmptyState level | 11 | 7, 10, 128, 132, 133, 264, 265, 332, 372, 373, 500 |
| G4 EditableText size | 6 | 5, 83, 316, 330, 383, 395 |
| G5 flex rows | 5 | 6, 40, 60, 162, 331 |
| G6 group heading by hand | 5 | 9, 255, 301, 321, 322 |
| G7 lines by hand | 6 | 122, 163, 256, 257, 258, 324 |
| G8 browser tooltip | 5 | 8, 131, 189, 190, 216 |
| G9 toolbar | 4 | 46, 56, 59, 211 |
| G10 Form | 3 | 430, 431, 432 |
| G11 in-app link | 2 | 141, 151 |
| G12 loading / failure | 7 | 229, 230, 236, 262, 263, 268, 279 |
| G13 floating panel | 2 | 67, 193 |
| G14 deleting leaves residue | 2 | 61, 65 |
| G15 story branches / fixtures | 5 | 92, 106, 107, 159, 161 |
| G16 no story, look at it | 9 | 3, 11, 13, 64, 71, 160, 327, 507, 517 |
| G17 story placement | 4 | 105, 112, 115, 169 |
| G18 MDX braces, one-line description | 3 | 98, 116, 124 |
| G19 escapes | 4 | 220, 408, 464, 465 |
| G20 class lists the lint cannot see | 3 | 16, 515, 516 |
| G21 hook reach | 2 | 466, 472 |
| G22 lockfile, `npm ci` | 6 | 23, 25, 155, 167, 182, 357 |
| G23 stale Storybook | 2 | 450, 481 |
| G24 lagging main, conflicting PR | 2 | 113, 369 |
| **total** | **111** | |

The rows were counted by a script over table C.

**How a row is counted.** One row per recorded defect, per source. Where one source records the same defect twice (a §0 summary and its "building it" section, or §3's UIG-1 count and a later ticket's recount of the same instances), it is **one row** and every location is cited in it. Where a source records a counted group of the same mistake as one line (e.g. "4 `<form>` in Ship"), the group is one row and the row gives the number. A defect recorded in two different sources gets a row in each (e.g. the Folders mistakes in PEEK-ADOPTION §17 and again in GATES.md's UIG-15 table), so the total counts rows, not distinct instances.

**Exclusion tags** (the six allowed categories):
- `EXCL tooling` = package build/tooling, not screen work (package internals, package doc pages, the gate machinery, tests, records, tickets, local environment)
- `EXCL gate` = a gate already refuses it and its error names the fix (the rule is named)
- `EXCL ruled` = ruled a design decision, not a mistake
- `EXCL removed` = cannot recur: the thing was removed
- `EXCL a11y` = accessibility: deferred by her ruling
- `EXCL steps` = already covered by the skill's steps 1–5 (1 search `ui:find`, 2 read When / When not, 3 ask if nothing fits, 4 never hand-roll what the package owns, 5 escape with `// @estiva-escape: <reason>`)

## B. The Gotchas

They are in `skill/estiva-ui.md`, the skill's one copy, numbered 1–24 in the order the table below
calls G1–G24. The text there was shortened from the first draft; the rows each number stands for
are unchanged. A Gotcha is kept only while at least two recorded defects stand behind it.

## C. Reconciliation table

### Source 1 — PEEK-ADOPTION.md §17 (The Folders page)

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 1 | P §17 table row 1 | The list column did not scroll: 81 folders clipped at the fold (`AppShell` list panel `overflow-hidden`); the native-bar sweep could not see it | G2 |
| 2 | P §17 table row 2 | "Create" clipped out of the 290px column: the field had no width of its own | G1 |
| 3 | P §17 table row 3 | Every folder wore a topic's dashed circle: `PersonRow` → `TopicState` had no `folder` kind and fell through (no story for the page) | G16 |
| 4 | P §17 table row 4 | Right and thread panes headed themselves at `px-3 py-2` (no height, no hairline); #192 replaced a working `ContainerHeader` with a hand-made row | G1 |
| 5 | P §17 table row 5 | Folder name larger than every other pane title: `EditableText` takes its size from the caller and none was passed | G4 |
| 6 | P §17 table row 6 | The row's count and two controls floated: three loose children of an `items-start` row | G5 |
| 7 | P §17 table row 7 | Four empty states with the wrong scope (a centred illustration under a header that named the file; two under a single row inside a list) | G3 |
| 8 | P §17 "Two the audit turned up" 1 | Timestamp in `ForeignConversationView` drew a browser tooltip | G8 |
| 9 | P §17 "Two the audit turned up" 2 | `ForeignObjectWidget` hand-typed `SectionLabel`'s classes | G6 |
| 10 | P §17 "A check that now exists" | A `page`-scope `EmptyState` inside a `ScrollArea` sized to its content collapses to the top of its pane | G3 |
| 11 | P §17 opening | The merge claimed "the adoption extended onto his work"; it had only converted one `div` (a claim not checked by looking) | G16 |
| 12 | P §17 "NOT done" | The foreign-object card's anatomy and the expanding row are hand-rolled (F13, a hand-rolled `CollapsibleSection`) | EXCL ruled: D66, decided at stage 7 with `Card` |
| 13 | P §17 "The lesson" | Every defect sat on a page with no story and no test; the rule-shaped sweeps passed clean | G16 |

### Source 2 — PLAN.md §14 (What stage 0 found)

Findings 29 and 30 do not exist (the numbering runs 28 → 31): 62 findings. Four of them record no defect and are listed in D: 11, 14, 15, 18. Finding 13 has two separate traps, and Finding 37 has four separate defects, so there are 62 rows.

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 14 | PLAN F1 | `@storybook/test-runner` cannot run with Storybook 10.6 | EXCL tooling |
| 15 | PLAN F2 | `no-conflicting-classes` only exists for Tailwind 4 | EXCL tooling |
| 16 | PLAN F3 | The lint cannot see class lists inside a plain object map (Chip's borders) | G20 |
| 17 | PLAN F4 | Muted text and two Ship pairs fail contrast | EXCL a11y |
| 18 | PLAN F5 | IconButton stories had no accessible name | EXCL a11y |
| 19 | PLAN F6 | ChipInput's field had no name once a chip was in it | EXCL a11y |
| 20 | PLAN F7 | Checkbox "row is the control" story nested two controls | EXCL a11y |
| 21 | PLAN F8 | Nine hand-written colours and a Tailwind scrim in package components; a story used `text-xs` | EXCL tooling (package code; the token lint now refuses a raw colour) |
| 22 | PLAN F9 | Storybook's "Run tests" gave two projects one name | EXCL tooling |
| 23 | PLAN F10 | `npm install` on Windows breaks the lockfile for Linux CI | G22 |
| 24 | PLAN F12 | Peek defined three of the package's token names with other values | EXCL removed: Peek dropped its variables (#163) |
| 25 | PLAN F13 (a) | `npm ci` while a Storybook or Vite server runs fails halfway and leaves no `node_modules/@estiva-app` | G22 |
| 26 | PLAN F13 (b) | An app's Vitest against the symlinked package gets two copies of React | EXCL tooling |
| 27 | PLAN F16 | Checkbox moved one pixel on every click | EXCL tooling |
| 28 | PLAN F17 | A person's initials were part of the trigger's name | EXCL a11y |
| 29 | PLAN F19 | `Reaction` arrived as a plain button: not on Toggle, no tests, no Keys table, a one-off story group | EXCL tooling |
| 30 | PLAN F20 | The message edit box is written twice (F4): two `useEditor`, two key handlers | EXCL ruled: F4, the message card stays in the app; not scheduled (P13) |
| 31 | PLAN F21 | An IconButton with a tooltip sat 1px higher | EXCL tooling |
| 32 | PLAN F22 | The plan said `fit.ts` had three callers; it had four (recalled, not grepped) | EXCL tooling |
| 33 | PLAN F23 | The menu-flicker guard stopped working under Base UI; the apps' `stopPropagation` guards became dead code | EXCL tooling (fixed in the package; the app guards were deleted, B9) |
| 34 | PLAN F24 | Hovering a submenu row closed the whole menu | EXCL tooling |
| 35 | PLAN F25 | Sixteen test assertions called a Select trigger a `button` | EXCL tooling (tests) |
| 36 | PLAN F26 | Two Peek surfaces used `Menu` as a floating panel, one with a text field | EXCL steps: 2 (Menu's When not sends a panel to `Popover`) |
| 37 | PLAN F27 | A page scroll closed an open Select (a workaround for a `fixed` list) | EXCL tooling |
| 38 | PLAN F28 | Menu stories moved 2px from a leftover `mt-1` | EXCL tooling |
| 39 | PLAN F31 | An avatar's initials were not reliably centred | EXCL tooling |
| 40 | PLAN F32 | A square control in a flex row stretched (IconButton 24×268; IdentityMenu 360px down) | G5 |
| 41 | PLAN F33 | A face was announced by its initials | EXCL a11y |
| 42 | PLAN F34 | Compact PersonTrigger had no visible focus | EXCL a11y |
| 43 | PLAN F35 | `Field`'s `required` drew a mark and told nobody | EXCL a11y |
| 44 | PLAN F36 | No tests for ConfirmDialog / EditableText; Tabs row unnamed; EditableText `title=`; Rail with no page; PersonTrigger.mdx stale | EXCL tooling |
| 45 | PLAN F37 (a) | DialogShell's Confirmation story hand-built `ConfirmDialog` (a story teaching the opposite of its page) | EXCL steps: 2 (DialogShell's When not → `ConfirmDialog`) |
| 46 | PLAN F37 (b) | The Popover page's formatting strip was a hand-rolled row of IconButtons standing in for `Toolbar` | G9 |
| 47 | PLAN F37 (c) | A selection toolbar was placed below the selection | EXCL tooling (the package's `Popover` takes `side`) |
| 48 | PLAN F37 (d) | Both apps had each built a reaction picker | EXCL steps: 1 and 3 (search; ask) |
| 49 | PLAN F38 | `Field` re-created its control when a line appeared; the name carried the asterisk | EXCL tooling |
| 50 | PLAN F39 | A disabled button used as a Menu or Popover trigger opened | EXCL tooling |
| 51 | PLAN F40 | `ScrollArea` stopped the page scrolling under a table or board; a measuring page lacked the app's `box-sizing` | EXCL tooling |
| 52 | PLAN F41 | `truncate` cut the descenders off a chip label | EXCL tooling |
| 53 | PLAN F42 | The frame's own column was a native scrollbar; `h-full` cannot resolve in the frame; page contract `flex-1` / `flex-1 min-h-0 [contain:size]` | G2 |
| 54 | PLAN F43 | The ⋯ in a direct conversation's header does nothing | G1 |
| 55 | PLAN F44 | A CollapsibleSection clips a glow at its edge | EXCL tooling |
| 56 | PLAN F45 | A caller could not lay out a Popover's content, so the selection toolbar drew as a vertical column | G9 |
| 57 | PLAN F46 | Text inside a ScrollArea renders lighter | EXCL ruled: accepted (D66) |
| 58 | PLAN F47 | ToolbarInput cannot be focused (no ref) | EXCL tooling |
| 59 | PLAN F48 | Three stories threw: `ToolbarButton` placed with no `Toolbar` around it | G9 |
| 60 | PLAN F49 | A button could be stretched by the box it was dropped into (24×228) | G5 |
| 61 | PLAN F50 | A ruling to delete a panel also deleted a diagnostic that shared its home | G14 |
| 62 | PLAN F51 | A gate number was recorded without its command (79 = `eslint src`, 94 = `eslint .`) | EXCL tooling |
| 63 | PLAN F52 | `MenuItem` had no height, so an app invented one | EXCL tooling |
| 64 | PLAN F53 | A sweep finds only the thing its rule names (the Folders page) | G16 |
| 65 | PLAN F54 | A deleted overlay left its imports behind (4 unused) | G14 |
| 66 | PLAN F55 | `self-center` on Button/IconButton overruled callers in a column | EXCL tooling (D62) |
| 67 | PLAN F56 | A 724px type-ahead panel went sideways; a cap in the panel's class let rows run through the border; a Popover around a menu that renders nothing is an empty box | G13 |
| 68 | PLAN F57 | A combobox's list hung from its input, not from the field | EXCL tooling |
| 69 | PLAN F58 | "The scrollbar" measured to lane vs thumb; a probe took the thumb twice | EXCL tooling |
| 70 | PLAN F59 | A launcher test clicked an option in a Select that was still closed | EXCL tooling (tests) |
| 71 | PLAN F60 | Every toolbar in a Popover grew 8px a side; stories drew the popover closed, so no diff saw it | G16 |
| 72 | PLAN F61 | The Capped story's fix was in the changelog and not in the code | EXCL tooling |
| 73 | PLAN F62 | The avatar leaned half a pixel from line-box rounding | EXCL tooling |
| 74 | PLAN F63 | A Base UI toast is `role="dialog"`; an unnamed "no dialog" test waited for it | EXCL tooling (tests) |
| 75 | PLAN F64 | Base UI Avatar would flash initials while a picture loads | EXCL tooling |

### Source 3 — GATES-DEBT.md (estiva-ui, peek, ship; origin/main)

All three read "Nothing is owed". The defects are the ones each list records as found and dealt with.

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 76 | debt estiva-ui, UIG-9 | 34 looks passed from one package part into another, 14 in stories (23 fixed, 5 through new props, 6 escaped) | EXCL tooling (the package's own code; `no-restyled-part` runs inward) |
| 77 | debt peek, `no-raw-element` UIG-3 | 16 raw `<button>`: 8 replaced, 7 gone with the Signal Theme page, 1 escaped | EXCL gate: `estiva/no-raw-element` names `Button` |
| 78 | debt peek, `no-raw-element` UIG-7 | 3 more raw elements, all replaced | EXCL gate: `estiva/no-raw-element` names the part |
| 79 | debt peek, `no-rebuilt-behaviour` UIG-8 | 15 behaviours the package owns, written by hand: 2 fixed, 13 kept with reasons | EXCL gate: `estiva/no-rebuilt-behaviour` names the part |
| 80 | debt peek, `no-restyled-part` UIG-9 | 23 looks passed into parts: 16 fixed, 5 new props, 2 kept (a row that is one link, a search field that is a button) | EXCL gate: `estiva/no-restyled-part` names the look props |
| 81 | debt peek, header | Peek had no debt list until UIG-32 | EXCL tooling |
| 82 | debt ship, UIG-9 | The words' look passed into parts (`IssueRail`, `IssuesTable` title and frame, `ForeignObject`'s unreadable card) | EXCL gate: `estiva/no-restyled-part` |
| 83 | debt ship, UIG-9 | `EditableText` given its title size in the wrong place (`ProjectHeader`, `IssueView`); now it takes the size from where it sits | G4 |
| 84 | debt ship, UIG-9 | Link fields in monospace | EXCL ruled: N5, plain like Peek's |
| 85 | debt ship, UIG-9 | Loading block with a card's corners | EXCL ruled: N6, a bar's corners |
| 86 | debt ship, UIG-9 | `IssueRow`'s whole-row link and its project chip (escaped) | EXCL ruled: escaped, no part yet (UIG-33) |
| 87 | debt ship, UIG-8 | Two error lines written by hand (`Composer`, `ui/DescriptionEditing`) | EXCL gate: `estiva/no-rebuilt-behaviour` (hand-written `role`) names `FieldLine` |
| 88 | debt ship, UIG-8 | A code block scrolled with the browser's scrollbar (`ui/prose.ts`) | EXCL gate: `estiva/no-rebuilt-behaviour` names `ScrollArea` |
| 89 | debt ship, UIG-8 | The description's reading surface is a Tab stop on a `<div>` (escaped) | EXCL ruled: kept with its reason (D37) |
| 90 | debt ship, UIG-7 | 4 raw `<form>` (`Composer`, `NewIssueDialog`, `NewProjectDialog`, `PairFolderDialog`) | EXCL gate: `estiva/no-raw-element` names `Form` |
| 91 | debt ship, UIG-7 | 2 raw file `<input>` | EXCL gate: `estiva/no-raw-element` names `FilePicker` |

### Source 4 — estiva-ui docs/GATES.md (origin/main)

**§0 (UIG-19, UIG-36, UIG-17, UIG-14, UIG-13, UIG-10: paragraphs with no "building it" section of their own)**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 92 | G §0 UIG-19 "What it found"; §13 UIG-28 found (EnterHint) | 11 things a part draws that no story showed (package 7: SectionHeader chevron, CollapsibleSection trailing, ListColumn chevron, MenuItem hint, EnterHint target, a face in Person/PersonTrigger; Peek 4: Header's tabs, three rows of PersonRow's file menu) | G15 |
| 93 | G §0 UIG-19 | The catalogue missed FilesPanel's and TopicDetailsDialog's stories, which draw the `…View` half | EXCL tooling |
| 94 | G §0 UIG-19 | `StartTopicDialog` gained a second caller (reusable) with no usage page | EXCL gate: `estiva-ui check` in `gate` names the part and the file to write |
| 95 | G §0 UIG-19 (#78) | The package's own contract ran outside the required `gate` job | EXCL tooling |
| 96 | G §0 UIG-19 traps | The prop scan counts an unopenable spread as passing everything | EXCL tooling |
| 97 | G §0 UIG-19 traps; UIG-7 traps | npm serves a new version's metadata before its tarball (E404 at `npm ci`); npm lists a version a minute late | EXCL tooling |
| 98 | G §0 UIG-19 traps | `{a long title}` in MDX prose makes a page Storybook cannot compile | G18 |
| 99 | G §0 UIG-19 | Peek Header's `tabs` row, dead since tabs left Peek | EXCL removed: deleted |
| 100 | G §0 UIG-36 | The invite email, bot name and role name fields matched no field rule (only `text` and `url` styled) | EXCL removed: the shared Storybook reset that hid it is gone (UIG-36), fixed |
| 101 | G §0 UIG-36 | `.hint` set only a top margin: 12px under every `<p>` hint | EXCL removed: as above |
| 102 | G §0 UIG-36 | The bots list's `plain` class had no rule | EXCL removed: as above |
| 103 | G §0 UIG-36 | A story rendered in another app's Storybook inherited that app's reset and looked better than the product | EXCL removed: each Storybook now shows only its own app |
| 104 | G §0 UIG-17 | The ticket's numbers were eleven days old (115 parts / 53 reusable vs 145 / 48) | EXCL tooling |
| 105 | G §0 UIG-17 | Peek's sidebar mixed three ideas of a heading; four headings held one entry each | G17 |
| 106 | G §0 UIG-17 | The Screener hover card was blank in 3 of 4 places for lack of a fixture; the fixture was hand-written four times | G15 |
| 107 | G §0 UIG-17 | Four elements behind props no story passed (ConversationCard Reply; ReplyCard Edit/Delete; TopicMoreMenu Rename/Copy link; ThreadPanel Open original) | G15 |
| 108 | G §0 UIG-17 | A `storySort` function with a TypeScript annotation killed the sidebar | EXCL tooling |
| 109 | G §0 UIG-17 | A check named `PendingAttachmentChip.mdx`, which UIG-35 had deleted | EXCL tooling |
| 110 | G §0 UIG-17 | A check read `e.class` where the class is `e.app.class` | EXCL tooling |
| 111 | G §0 UIG-17 (estiva-04) | Two checks could not fail | EXCL tooling |
| 112 | G §0 UIG-17 | The Introduction page named headings that had gone and missed four new ones (twice) | G17 |
| 113 | G §0 UIG-17 | A CONFLICTING PR reported no CI at all | G24 |
| 114 | G §0 UIG-17 | `JoinTopicBanner` is unused since CON-8 and kept | EXCL ruled: deleting an unused part is her call (§15) |
| 115 | G §0 UIG-17 | Three entries named after their file, not their part (PeekLogo, ShipLogo, ScreenerPreviewCard) | G17 |
| 116 | G §0 UIG-17 | `EditedMarker`'s classification reason was cut mid-sentence (the builder reads one line) | G18 |
| 117 | G §0 UIG-17 | Two unnamed headings compared equal and interleaved | EXCL tooling |
| 118 | G §0 UIG-17 | `@estiva-app/interop` 0.24 in a shared `node_modules` gave false type and test failures | EXCL tooling |
| 119 | G §0 UIG-35; UIG-35 section | UIG-35 closed with no record at all | EXCL tooling |
| 120 | G §0 UIG-35; UIG-35 section | UIG-35 was missing from the status script | EXCL tooling |
| 121 | G §0 UIG-14 | Peek's crash screen passed `bg-bg-base` into a package part | EXCL gate: `estiva/no-restyled-part` |
| 122 | G §0 UIG-14; UIG-14 round 9 | The `/` menu's lines between groups were drawn a fourth way (from an 8px gap), missed in the count | G7 |
| 123 | G §0 UIG-13; UIG-13 section | 53 parts had no one-line description | EXCL gate: `estiva-ui check` refuses a part with no description |
| 124 | G §0 UIG-13; UIG-13 section | 15 descriptions described something else, or nothing | G18 |
| 125 | G §0 UIG-13; UIG-13 "Proof" | Four /code-review passes found 18 faults in the builder | EXCL tooling |
| 126 | G §0 UIG-10 (reopened) | The ticket was rewritten so it passed while its goal did not | EXCL tooling |

**UIG-27 (rulings, cards, links, what building it found, adoption)**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 127 | G UIG-27 ruling 2 | Two underline looks (dotted, solid) for one job | EXCL ruled: one `underlined` look |
| 128 | G UIG-27 ruling 6; adoption §2 EmptyState list; §3 family D note | 15 of 17 callers padded `EmptyState`, drawing it instead of the rows' box | G3 |
| 129 | G UIG-27 ruling 8 | Ship drew a file as a 28px line, Peek as a card | EXCL ruled |
| 130 | G UIG-27 ruling 10 | Ship's board card had 6px corners | EXCL ruled |
| 131 | G UIG-27 ruling 18 | A cut-off name could not be read on a posted card; the waiting card showed a tooltip on every hover; Peek clipped a letter | G8 |
| 132 | G UIG-27 ruling 20; adoption §2 | Ship's empty sections took their own room (`py-6/8/10`) | G3 |
| 133 | G UIG-27 ruling 21; adoption §5 "two kinds" | Empty lines in lists whose rows pad themselves: padding would move the line off the rows | G3 |
| 134 | G UIG-27 "the cards, sorted" | A card that cannot be read: solid hairline and caption in Peek, dashed and body text in Ship | EXCL ruled: ruling 12, dashed |
| 135 | G UIG-27 "the cards, sorted" | The same project drawn two ways in Peek | EXCL ruled: both on `Card` |
| 136 | G UIG-27 "the links, recounted" | Two router links that no count had seen | EXCL tooling |
| 137 | G UIG-27 "what building it found" | Peek's quiet chip was 16.8px, not 19.6px | EXCL removed: Peek's chip replaced by `InlineChip` |
| 138 | G UIG-27 "what building it found" | `InlineChip` needs `h-[1.4em]`: no token names a line | EXCL tooling |
| 139 | G UIG-27 "what building it found" | Two stories with a colour-contrast exception | EXCL a11y |
| 140 | G UIG-27 adoption §2; §3 raw-anchor; §9.1; §13 #1; §14 D1 | 18 raw `<a>` and 2 router links | EXCL gate: `estiva/no-raw-element` names `Link` |
| 141 | G UIG-27 adoption §2 ⛔; §9.1 | Ship's links spread `{...linkTo(href)}`: drop it and every click reloads the app | G11 |
| 142 | G UIG-27 adoption §2 and §5 | `EmptyState` used for a failure | EXCL ruled: its page now lets it carry a failure (card 11.6) |
| 143 | G UIG-27 adoption §3 traps | A test pinned to a deleted file tempts a fix in the test | EXCL tooling |
| 144 | G UIG-27 adoption §3 traps | Linking the package checkout gives two Reacts; `npm pack` does not rebuild `dist` | EXCL tooling |
| 145 | G UIG-27 adoption §3 traps | `cn` from `tailwind-merge` drops a size token | EXCL removed: trap retired 1 September |
| 146 | G UIG-27 adoption §3 traps; §0 "since UIG-2"; §22 | A Base UI Select option found by its text flakes (the closed list is mounted) | EXCL tooling (tests) |
| 147 | G UIG-27 adoption §3 traps; §19; §22 estiva-agent | A Ship description edited with `edit-project` renders raw JSON | EXCL tooling |
| 148 | G UIG-27 adoption §3 traps | Accessibility runs on her machine | EXCL a11y |
| 149 | G UIG-27 adoption §3 traps | Editing docs that are not this project's | EXCL tooling |
| 150 | G UIG-27 adoption §5 | A feed card went dark under its own menu (`Card` lit only on `:hover`) | EXCL tooling |
| 151 | G UIG-27 adoption §5 | The first `RouterLink` threw outside a router (`useNavigate()` at the top of the card) | G11 |
| 152 | G UIG-27 adoption §5 | In Ship's description editor, pressing a file's Download committed and closed the editor | EXCL tooling (see D) |
| 153 | G UIG-27 adoption §5 | Ship did not fetch a document it would need in order to open it | EXCL ruled: ruling 22 |
| 154 | G UIG-27 adoption §5 | Ship's link chip no longer fills on hover | EXCL ruled: ruling 3 |
| 155 | G UIG-27 adoption §5 traps | npm 11.6 rewrites unrelated `peer` flags in a lock | G22 |
| 156 | G UIG-27 adoption §5 traps | A `#/…` story address never reloads, so the window marker proves nothing there | EXCL tooling |
| 157 | G "What is ready" UIG-27 line | UIG-30 was missing from both apps' check lists, and nothing caught it | EXCL tooling |

**UIG-18**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 158 | G UIG-18 | The ticket's numbers were eleven days old (74 components, 18 stories) | EXCL tooling |
| 159 | G UIG-18 | `BlockAnchorNote` was drawn by no story: no fixture carried an anchor | G15 |
| 160 | G UIG-18 (F12) | 51 of Ship's 73 part files have no story (pages, one-offs) | G16 |
| 161 | G UIG-18 finding 1; review 1 | A foreign status was always a grey circle; the story fed a raw key the projection never sends | G15 |
| 162 | G UIG-18 review 2 | The conversation count floated 2.6px above the app chip (`items-start`) | G5 |
| 163 | G UIG-18 review 3 | A rule was drawn above a card's children | G7 |
| 164 | G UIG-18 review 5 | `ConversationThread`'s `subdued` could not be judged without its own stories | EXCL ruled: her review |
| 165 | G UIG-18 review 5 | A `ConversationCount` story changed nothing on screen | EXCL ruled: her review |
| 166 | G UIG-18 Tables | A table's round trip emptied every cell on save | EXCL tooling (see D) |
| 167 | G UIG-18 Tables trap | Installing on Windows pruned `@emnapi/*` from the lock | G22 |
| 168 | G UIG-18 found 2 | A "muted" mention card is 8–12 levels darker only | EXCL ruled: "not yet" |
| 169 | G UIG-18 found 3 | Four dialogs' ten stories are invisible to the catalogue (no `component`) | G17 |
| 170 | G UIG-18 checks; UIG-14 checks | The guessed evidence looked for five headings, including "What it is" | EXCL tooling |
| 171 | G UIG-18 checks | Ship's check read `e.class` | EXCL tooling |
| 172 | G UIG-18 checks | Text read without normalising CRLF | EXCL tooling |

**UIG-35**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 173 | G UIG-35 | Both hand-built picture viewers: `createPortal` and a fixed `<div>` with no Escape, no focus trap, no focus returned | EXCL gate: `estiva/no-rebuilt-behaviour` names `Lightbox` |
| 174 | G UIG-35 | Each app kept its own fetch/open/save wrapper (`useBlobUrl`, `saveFile`, `FileAttachmentCard`) | EXCL removed: deleted; `AttachmentCard` owns it |
| 175 | G UIG-35 | Ship could not open a picture full screen | EXCL ruled |
| 176 | G UIG-35 found 1 | A document being fetched drew a picture's loading pulse | EXCL tooling |
| 177 | G UIG-35 found 2 | An empty `alt` on an attachment | EXCL a11y |
| 178 | G UIG-35 found 3 | Saving bytes already in hand fetched them again | EXCL tooling |
| 179 | G UIG-35 | Both apps kept a standalone attachment story | EXCL ruled |

**UIG-14 (with UIG-15 and UIG-16)**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 180 | G UIG-14 "Measured before starting" | The ticket assumed the pages had to be written; its "44" was 12 September's | EXCL tooling |
| 181 | G UIG-14 traps | The script writing What it owns doubled Skeleton's section | EXCL tooling |
| 182 | G UIG-14 traps; UIG-10 traps; UIG-27 adoption §1 | `npm ci` fails with a Storybook or dev server running (EPERM, `node_modules` gone) | G22 |
| 183 | G UIG-14 card 1.1 | Tooltip's page sent "controls inside" to the wrong parts | EXCL tooling (package page) |
| 184 | G UIG-14 card 1.2 | Tooltip's page never named PreviewCard | EXCL tooling (package page) |
| 185 | G UIG-14 card 1.3 | Menu's page sent a strip of icons to IconButtons, not Toolbar | EXCL tooling (package page) |
| 186 | G UIG-14 card 1.4 | MenuItem's reason was out of date | EXCL tooling (package page) |
| 187 | G UIG-14 card 1.5 | Three pages disagreed about pop-up lists while typing | EXCL ruled: left to UIG-31 |
| 188 | G UIG-14 card 1.6 | "Add members" was a MenuItem in a dialog with no Menu | EXCL ruled: "ok" (see D) |
| 189 | G UIG-14 card 1.7; §3 no-native-title (Reference ×3 per app) | A cut reference title showed its full text in the browser's tooltip | G8 |
| 190 | G UIG-14 card 1.8 | An unfound reference hid its address in the browser's tooltip | G8 |
| 191 | G UIG-14 card 1.9 | "Session ended" said only in a hover tooltip on a dot | EXCL ruled: leave |
| 192 | G UIG-14 card 1.10 | A tooltip on the word "edited" | EXCL ruled: allowed |
| 193 | G UIG-14 card 1.11 | A Popover was mounted only while open | G13 |
| 194 | G UIG-14 card 1.12 | PreviewCard's example had a placeholder (did not compile) | EXCL tooling (package page) |
| 195 | G UIG-14 card 1.13 | Popover's anchored example stopped halfway | EXCL tooling (package page) |
| 196 | G UIG-14 card 1.14 | Gap: a panel in the page that closes like a popover | EXCL ruled: leave |
| 197 | G UIG-14 card 2.1 | Select's page never mentioned ticking several | EXCL tooling (package page) |
| 198 | G UIG-14 card 2.2 | Status, Assignee and Project disabled with no reason | EXCL steps: 2 (Select's page: "`disabled` explains nothing by itself — give it `disabledReason`") |
| 199 | G UIG-14 card 2.3 | Selects disabled for a moment while an action runs | EXCL ruled: allowed |
| 200 | G UIG-14 card 2.4 | One person picked with the several-people picker | EXCL ruled: leave |
| 201 | G UIG-14 card 3.1 | Field's page named a part that does not exist ("Field line") | EXCL tooling (package page) |
| 202 | G UIG-14 card 3.2 | FieldLine's example had a placeholder | EXCL tooling (package page) |
| 203 | G UIG-14 card 3.3 | An error line typed by hand under a FieldLine that does the same job | EXCL steps: 4 (`FieldLine`) (see D) |
| 204 | G UIG-14 card 3.4 | Peek's composers send from their own Enter handler, with no Form | EXCL ruled: round 2 B, TipTap keeps the keys |
| 205 | G UIG-14 card 3.5 | Ship edits a message with a Textarea and Save / Cancel | EXCL ruled |
| 206 | G UIG-14 card 3.6 | Two reply boxes are one line | EXCL ruled: Ship's composer will work like Peek's |
| 207 | G UIG-14 card 3.7 | The command palette uses FieldLine for hints | EXCL ruled: keep for now |
| 208 | G UIG-14 card 3.8 | Gap: rich text edited where it is shown | EXCL ruled: UIG-30 |
| 209 | G UIG-14 card 4.1 | Button's page sent navigation to "a plain link", not Link | EXCL tooling (package page) |
| 210 | G UIG-14 card 4.2 | IconButton's page said "a toolbar" without naming Toolbar | EXCL tooling (package page) |
| 211 | G UIG-14 card 4.3 | Five rows of icon buttons not in a Toolbar | G9 |
| 212 | G UIG-14 card 4.4 | Send buttons disabled with no reason, in 16 places | EXCL ruled: keep them disabled |
| 213 | G UIG-14 card 4.5 | A disabled Button used as a display pill | EXCL ruled: it will open a dialog |
| 214 | G UIG-14 card 4.6 | "Back to topics" is a Button that only navigates | EXCL ruled |
| 215 | G UIG-14 card 4.7 | A key inside a button's label and a placeholder | EXCL ruled: keep |
| 216 | G UIG-14 card 4.8 | The Send icon button had no tooltip | G8 |
| 217 | G UIG-14 card 4.9 | Five controls do nothing when pressed | G1 (she ruled the five stay; the gotcha stops new ones) |
| 218 | G UIG-14 card 4.10 | Two primary buttons on one surface | EXCL ruled |
| 219 | G UIG-14 card 4.11 | Cancel beside Save is `muted` in Ship, `outlined` in Peek | EXCL ruled: leave |
| 220 | G UIG-14 card 4.12 | Two escape notes said "no part makes a row that is a link", but Link does | G19 |
| 221 | G UIG-14 card 4.13 | Gap: a link that looks like an icon button | EXCL ruled: `IconButton` `href` |
| 222 | G UIG-14 card 4.14 | Gap: copying falls back to the browser's prompt | EXCL ruled: no part |
| 223 | G UIG-14 card 4.15; round 2 L | Two expand buttons write `aria-expanded` by hand | EXCL ruled: waits for a tree part (UIG-34) |
| 224 | G UIG-14 card 5.1 | DialogShell's page never named CommandPalette | EXCL tooling (package page) |
| 225 | G UIG-14 card 5.2 | Toast's page named Chip without the bold | EXCL tooling (package page) |
| 226 | G UIG-14 card 5.3 | Banner's and Toast's pages both claimed "copied" | EXCL tooling (package page) |
| 227 | G UIG-14 card 5.4 | Banner's page said a notice with an action was "not in the package yet" | EXCL tooling (package page) |
| 228 | G UIG-14 card 5.5 | CommandPalette's example used one name for two things | EXCL tooling (package page) |
| 229 | G UIG-14 card 5.6 | Relay refusals shown as neutral toasts | G12 |
| 230 | G UIG-14 card 5.7 | "Edited here, but not published" neutral in messages, a warning in topics | G12 |
| 231 | G UIG-14 card 5.8 | Toasts that never close have no Dismiss | EXCL ruled: leave |
| 232 | G UIG-14 card 5.9 | One action's failure shown in the error Banner | EXCL ruled: Banner line changed |
| 233 | G UIG-14 card 6.1 | "Resolved" was hand-made coloured text | EXCL steps: 4 (`Chip`) |
| 234 | G UIG-14 card 6.2 | A Chip inside a Link | EXCL ruled: leave |
| 235 | G UIG-14 card 6.3 | Chosen files shown as removable InputChips | EXCL steps: 2 (`AttachmentCard`) |
| 236 | G UIG-14 card 6.4 | A picture on its way was a hand-made pulsing box | G12 |
| 237 | G UIG-14 card 6.5 | A picture is a plain `<img>`, not a thumbnail | EXCL ruled: leave |
| 238 | G UIG-14 card 6.6 | The highlight tag is hand-made | EXCL ruled: leave |
| 239 | G UIG-14 card 6.7 | A status drawn as coloured text | EXCL ruled: leave |
| 240 | G UIG-14 card 6.8 | The pinned message box was hand-made | EXCL steps: 4 (`Card`) |
| 241 | G UIG-14 card 6.9 | Gap: a status as an icon or a coloured word | EXCL ruled: leave |
| 242 | G UIG-14 card 6.10 | Gap: a picture opened full screen | EXCL ruled: later (built as `Lightbox`) |
| 243 | G UIG-14 card 6.11 | Gap: a count beside a section heading | EXCL ruled: leave |
| 244 | G UIG-14 card 7.1 | Avatar's page contradicted itself about bylines | EXCL tooling (package page) |
| 245 | G UIG-14 card 7.2 | Avatar's scale left out 18 and 20 | EXCL tooling (package page) |
| 246 | G UIG-14 card 7.3 | Ship drew faces at 18 and 20 | EXCL ruled: 18 → 16, 20 → 24 |
| 247 | G UIG-14 card 7.4 | A face and a name put together by hand where Person fits | EXCL steps: 4 (`Person`) |
| 248 | G UIG-14 card 7.5; UIG-9 "What it cannot see" + found (MemberAvatars); "What is ready" UIG-25 | The huddle card stacked faces by hand (`MemberAvatars`, drawn from plain boxes: no rule can see it) | EXCL steps: 1 and 4 (`AvatarGroup`) |
| 249 | G UIG-14 card 8.1 | Rail's page said "a toolbar of IconButtons", not Toolbar | EXCL tooling (package page) |
| 250 | G UIG-14 card 8.2 | Tabs' page sent navigation to "links", not Link | EXCL tooling (package page) |
| 251 | G UIG-14 card 9.1 | ScrollArea's When did not make the Folders mistake obvious | EXCL tooling (package page) |
| 252 | G UIG-14 card 9.2 | ScrollArea listed "a rail"; Rail says it never scrolls | EXCL tooling (package page) |
| 253 | G UIG-14 card 9.3; round 2 C | Peek built its floating frame by hand | EXCL steps: 4 (`AppShell`) |
| 254 | G UIG-14 card 10.1 | Divider's page did not mention cards | EXCL tooling (package page) |
| 255 | G UIG-14 card 10.2; round 2 D | The "Open work" heading was hand-made | G6 |
| 256 | G UIG-14 card 10.3; round 2 M | The date line between days was hand-made | G7 |
| 257 | G UIG-14 card 10.4 | A hand-made line between a comment and its replies | G7 |
| 258 | G UIG-14 card 10.5 | Hand-made lines between sections of a card | G7 |
| 259 | G UIG-14 card 10.6 | A line on every row | EXCL ruled: she redesigns it |
| 260 | G UIG-14 card 10.7 | The tickets fold is hand-made | EXCL ruled: leave |
| 261 | G UIG-14 card 10.8 | "Name" is a SectionLabel over a field that becomes an input | EXCL ruled: leave |
| 262 | G UIG-14 card 11.1 | Failures shown in the empty-state look, in 8 places | G12 |
| 263 | G UIG-14 card 11.2 | An empty state while data is still coming | G12 |
| 264 | G UIG-14 card 11.3 | A section's empty line was hand-made | G3 |
| 265 | G UIG-14 card 11.4; round 2 H | An empty issue list was a whole-page empty state under tabs | G3 |
| 266 | G UIG-14 card 11.5 | An empty folder is said in the count line | EXCL ruled: leave |
| 267 | G UIG-14 card 11.6 | Gap: no part says "this failed" in place of content | EXCL ruled: use EmptyState |
| 268 | G UIG-14 card 11.7; round 2 I | One list skeleton for every page, card grids too | G12 |
| 269 | G UIG-14 card 0.1 | The checker called a behaviour "Closes on Escape" that Tabs and Toolbar own too | EXCL tooling |
| 270 | G UIG-14 card 0.2 | Parts no app uses yet | EXCL ruled: leave |
| 271 | G UIG-14 card 0.3 | One test run failed, three reruns did not | EXCL tooling |
| 272 | G UIG-14 round 2 C1 | A Form inside a pop-up inside a Form sent both | EXCL tooling |
| 273 | G UIG-14 round 2 C2 (A) | The package tooltip always wrapped in a box; it could not sit in a sentence | EXCL tooling |
| 274 | G UIG-14 round 2 C3 (D) | SectionHeader could not switch off its hover fill | EXCL tooling |
| 275 | G UIG-14 round 2 C4 | A waiting file's ✕ was invisible on keyboard focus | EXCL tooling |
| 276 | G UIG-14 round 2 C5 (review page) | The Send button could not be pressed from the keyboard (listened to the mouse only) | EXCL a11y (see D) |
| 277 | G UIG-14 round 2 C6 (review page) | "Could not save" hung off a value that did not redraw, so nothing showed after a refused save | EXCL steps: 4 (it is `FieldLine` now) (see D) |
| 278 | G UIG-14 round 2 C7 (review page) | Ship's `InputChip` re-export had no users | EXCL removed: deleted |
| 279 | G UIG-14 round 2 C8 (review page) | The loading picture also showed on a page that never waits | G12 |
| 280 | G UIG-14 round 2 C9 | Three single header buttons stay icon buttons, not a toolbar | EXCL ruled: leave |
| 281 | G UIG-14 round 2 C10 | Two whole-row links keep their classes | EXCL ruled: UIG-33 |
| 282 | G UIG-14 round 2 C11 (review page) | Peek's tests used a library they did not list | EXCL tooling |
| 283 | G UIG-14 round 2 C12 | The photo counter misses changes of 8 levels or less | EXCL tooling |
| 284 | G UIG-14 round 2 PreviewCard | PreviewCard's scrollbar sat 15px from the edge, behind the padding | EXCL tooling |
| 285 | G UIG-14 round 3 F1 | The inline tooltip needed `align-top`, and apps may not add it | EXCL tooling |
| 286 | G UIG-14 round 3 F2 | A Select given both `disabled` and `disabledReason` ignored the reason | EXCL tooling |
| 287 | G UIG-14 round 3 F3 | A link inside a Toolbar had no part (→ `ToolbarLink`) | EXCL tooling |
| 288 | G UIG-14 round 4 N1 | ContainerHeader's page lacked its numbers | EXCL tooling (package page) |
| 289 | G UIG-14 round 4 N2 | SectionHeader's page lacked its numbers | EXCL tooling (package page) |
| 290 | G UIG-14 round 4 N3 | NavItem's page lacked its numbers | EXCL tooling (package page) |
| 291 | G UIG-14 round 4 N4 | RailItem's page lacked its numbers | EXCL tooling (package page) |
| 292 | G UIG-14 round 4 N5 | Rail's page lacked its numbers | EXCL tooling (package page) |
| 293 | G UIG-14 round 4 N6 | TopBar's page lacked its numbers | EXCL tooling (package page) |
| 294 | G UIG-14 round 4 N7 | AppShell's page lacked the floating frame's numbers | EXCL tooling (package page) |
| 295 | G UIG-14 round 4 N8 | Divider's and Breadcrumb's pages lacked two numbers | EXCL tooling (package page) |
| 296 | G UIG-14 round 4 N9 | Gap: the 290px list column was not a package part | EXCL tooling (built as `ListColumn`) |
| 297 | G UIG-14 round 4 S1 | Parts sized by where they sit did not say so first | EXCL tooling (package page) |
| 298 | G UIG-14 round 4 T1; round 5 M4; round 6 M4 | SectionHeader and six more parts squashed in a scrolling column (32 → 24px …) | EXCL tooling (the package parts now keep their height) |
| 299 | G UIG-14 round 4 T2 | ScrollArea's lighter text was unmentioned | EXCL tooling (package page) |
| 300 | G UIG-14 round 4 T3 | AppShell did not say what scrolls in the floating card | EXCL tooling (package page) |
| 301 | G UIG-14 round 4 L1 | SectionLabel copied as classes instead of imported | G6 |
| 302 | G UIG-14 round 4 P1 | Pages lacked their "planned to change" lines | EXCL tooling (package page) |
| 303 | G UIG-14 round 4 X1 | No rule for exports that are not parts | EXCL tooling (package page) |
| 304 | G UIG-14 round 5 M1 | Eight pages named Peek or Ship | EXCL tooling (package page) |
| 305 | G UIG-14 round 5 M2 | Three pages used the apps' things as examples | EXCL tooling (package page) |
| 306 | G UIG-14 round 5 M3 | Pages credited a person, a ruling, a date or a ticket | EXCL tooling (package page) |
| 307 | G UIG-14 round 5 M5 | Card S1 was wrong about InlineChip | EXCL tooling |
| 308 | G UIG-14 round 5 M6; round 6 Q | RailItem had no set height (48.35px) | EXCL tooling |
| 309 | G UIG-14 round 5 M7 | N9 and P1 missed `SplitLayout`, already planned | EXCL tooling |
| 310 | G UIG-14 round 5 M8 | X1 left out what the ticket names | EXCL tooling |
| 311 | G UIG-14 round 5 M9 | The status check did not really check UIG-15 or UIG-16 | EXCL tooling |
| 312 | G UIG-14 round 5 M10 (review page) | Two notes UIG-1 left for UIG-15 were still open | EXCL tooling |
| 313 | G UIG-14 round 5 M11 (review page) | The Folders table missed three mistakes a machine will catch too | EXCL tooling |
| 314 | G UIG-14 round 5 M12 | Three "later" items had no ticket | EXCL tooling |
| 315 | G UIG-14 round 6 card Q; "Round 6" | A set 48px RailItem moves the lower tiles up (0.35px each) | EXCL ruled: kept (card Q) |
| 316 | G UIG-14 round 6 S1 (review page); "The page words" | An approved card told callers to give EditableText its size in `className`, which the lint refuses | G4 |
| 317 | G UIG-14 round 6 R; "The numbers, then and now" | A table read the ticket's "45" as value exports; it was 45 export lines holding 65 names | EXCL tooling |
| 318 | G UIG-14 round 7 D1 | A crashed list column lost its title | EXCL ruled: D1 (a) |
| 319 | G UIG-14 round 7 D2 | A link's keyboard ring is 1px further out than a button's | EXCL a11y: the accessibility pass |
| 320 | G UIG-14 round 7 D3; round 8 D3 | Peek wrapped ListColumn in its own crash catcher | EXCL ruled: D3 (c), `ErrorBoundary` in the package |
| 321 | G UIG-14 round 8 | ListColumn's Sections story drew its group headings by hand (copied from Desk's "Urgent") | G6 |
| 322 | G UIG-14 round 8 D4 | Peek's "Urgent" was a hand-drawn 32px row with a SectionLabel; two package pages allowed it | G6 |
| 323 | G UIG-14 round 8 D5 | Two spacings, `rows` and `sections` | EXCL ruled: D5 (b), one spacing |
| 324 | G UIG-14 round 8 (menu lines) | Lines between a menu's groups touched the rows, drawn three ways; the Divider and Menu pages disagreed | G7 |
| 325 | G UIG-15 table D1 | The list column did not scroll | G2 |
| 326 | G UIG-15 table D2 | "Create" clipped out of the 290px column | G1 |
| 327 | G UIG-15 table D3 | 81 folders wearing a topic's glyph | G16 |
| 328 | G UIG-15 table D4 | The file pane headed itself at 12px / 8px padding | G1 |
| 329 | G UIG-15 table D5 | The thread pane headed itself the same way | G1 |
| 330 | G UIG-15 table D6 | The folder name larger than every other pane title | G4 |
| 331 | G UIG-15 table D7 | A row's count floating at the card's top corner | G5 |
| 332 | G UIG-15 table D8 | Four empty states in the wrong scope | G3 |

**UIG-13, UIG-12, UIG-32, UIG-10**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 333 | G UIG-13 | The ticket's 115 / 74 / 233 were from 12 September, and how 115 was counted was never written down | EXCL tooling |
| 334 | G UIG-13 promote list | 13 of 21 candidates marked "stays in the app" before she had seen them | EXCL steps: 3 (ask) |
| 335 | G UIG-13 promote list | `SkeletonSidebarList` was the package's `SkeletonList` under a second name | EXCL steps: 1 (search) |
| 336 | G UIG-13 proof | The builder counted `displayName` as a use; the counter ignored pictures and a two-line pass-on | EXCL tooling |
| 337 | G UIG-13 A–C | Three header buttons do nothing (New conversation, Sort by ×2) | G1 (she kept these three; the gotcha stops new ones) |
| 338 | G UIG-13 "Found beside it" | The ticket list did not name the relay check as holding a part | EXCL tooling |
| 339 | G UIG-13 "Found beside it" | The ticket's example `PendingAttachmentChip` no longer existed | EXCL tooling |
| 340 | G UIG-13 count; released | Unused parts (`HighlightsCard`, `PeekLogo`, `SkeletonHuddleGrid`) | EXCL removed: deleted (D) |
| 341 | G UIG-12 found 1 | 11 story ids resolved nowhere (`startCase`) | EXCL tooling |
| 342 | G UIG-12 found 2 | "scrolling" found Avatar | EXCL tooling |
| 343 | G UIG-12 found 3 | `SkeletonBar` was given its file's header paragraph | EXCL tooling |
| 344 | G UIG-12 found 4 | Two components' options missing (`SectionLabel`, `TextInput`) | EXCL tooling |
| 345 | G UIG-12 found 5 | The catalogue carried 33 of 336 props | EXCL tooling |
| 346 | G UIG-12 found 6 | "a" matched `Link`'s `external` | EXCL tooling |
| 347 | G UIG-12 found 7 | 13 quoted prop names dropped (`aria-label` …) | EXCL tooling |
| 348 | G UIG-12 found 8 | `ToolbarButton` carried 1 prop of 9 | EXCL tooling |
| 349 | G UIG-12 found 9 | Inherited props read as prose from the wrong file | EXCL tooling |
| 350 | G UIG-12 found 10 | `extends Omit<…>` read as the name `Omit` | EXCL tooling |
| 351 | G UIG-12 found 11 | `estiva-ui find` could not run in an app (`typescript` in its chunk) | EXCL tooling |
| 352 | G UIG-12 released | The 0.21.1 changelog entry was never written; lock version fields and the `estiva-ui` bin were stale | EXCL tooling |
| 353 | G UIG-32 found 1; §21; §22 (UIG-3/UIG-5 row) | Peek never had a debt list | EXCL tooling |
| 354 | G UIG-32 found 2 | The status engine found a checks file only in a repo's top folder | EXCL tooling |
| 355 | G UIG-32 found 4 | Peek's gate ignored two folders Ship's did not | EXCL tooling |
| 356 | G UIG-32 found 5 | `gates:compare` broke on the change it measures | EXCL tooling |
| 357 | G UIG-32 traps | A hand-patched consumer lockfile needs `bin` and `peerDependencies`, or `npm ci` links no command | G22 |
| 358 | G UIG-10 found 1 | The made app's CLAUDE.md named a private doc | EXCL tooling |
| 359 | G UIG-10 found 2 | The printed next steps said `git init` (makes `master`) | EXCL tooling |
| 360 | G UIG-10 found 3 | The first 0.21.0 release run failed at `npm test` (no build) | EXCL tooling |
| 361 | G UIG-10 found 4 | UIG-32's first-guess check would have passed on its own | EXCL tooling |
| 362 | G UIG-10 found 5; §23 "Corrected the same evening" | §23 first said the token block was the same in all three repos | EXCL tooling |
| 363 | G UIG-10 found 6; relay half found 2 | The local Estiva ID could not issue a token (sealed key), and allows no relay | EXCL tooling |
| 364 | G UIG-10 found 7 | The made app asks for a favicon and gets 404 | EXCL ruled: left, an app adds its own |
| 365 | G UIG-10 found 8 | npm 11.19 holds back esbuild's install script | EXCL tooling |
| 366 | G UIG-10 traps | An esbuild split chunk cannot tell it was invoked | EXCL tooling |
| 367 | G UIG-10 traps; UIG-4 traps; UIG-7 traps | A heredoc, `node -e` or template literal mangles backslashes (`\b` becomes backspace) | EXCL tooling |
| 368 | G UIG-10 traps | `git show <ref>:<path>` needs `MSYS_NO_PATHCONV=1` | EXCL tooling |
| 369 | G UIG-10 traps; UIG-28 found (mains moved); UIG-27 adoption §1 | The main checkouts lag `origin/main`; mains moved under open PRs | G24 |
| 370 | G UIG-10 traps | jsdom warns about the engine on node 24.11 | EXCL tooling |
| 371 | G UIG-10 relay found 1 | Estiva ID signs the relay handshake only for relays both lists allow | EXCL tooling |
| 372 | G UIG-10 relay found 4; §0 UIG-10 relay | The home page's EmptyState sat in a box (`flex justify-center px-6 py-16`), pinned 64px from the top; two photo reviews missed it | G3 |
| 373 | G UIG-10 relay found 4 "wider gap" | A box that places or styles a part, and text drawn by hand, pass every gate | G3 (see D) |
| 374 | G UIG-10 relay traps; UIG-9 traps; UIG-3 traps | A stopped background `vite` or Storybook leaves its node process holding the port and folder | EXCL tooling |
| 375 | G UIG-10 relay traps | `docker exec` needs `-i` to read a heredoc | EXCL tooling |
| 376 | G UIG-10 relay traps | The local Estiva ID's database user; the first invite must be `ROLE=admin` | EXCL tooling |
| 377 | G UIG-10 relay traps | A Ship description written through `"$(cat f)"` loses its last newline | EXCL tooling |

**UIG-9, UIG-8, UIG-7**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 378 | G UIG-9 N2; found 3 | The page said "16 of our 73 parts": read as 16, and EnterHint was missed | EXCL tooling |
| 379 | G UIG-9 app changes 1–2; §3 family D | A look passed into `Link` / `Person` (topic links, a reply's time, the reference widget's person and title, Files panel project name, issues table title) | EXCL gate: `estiva/no-restyled-part` |
| 380 | G UIG-9 app changes 3 | The unreadable card's words styled through `Card` | EXCL gate: `estiva/no-restyled-part` |
| 381 | G UIG-9 app changes 4; §10 (ScrollArea stories, IssuesTable) | A comment row's line on `Form`; the issues table's frame on a `ScrollArea` | EXCL gate: `estiva/no-restyled-part` |
| 382 | G UIG-9 app changes 5 | A long link's breaking classes on the link | EXCL gate: `estiva/no-restyled-part` (N7) |
| 383 | G UIG-9 app changes 6; found 6; §3 family D samples (FoldersPage, IssueView) | `EditableText`'s size passed through `className` (folder name; project and issue titles) | G4 |
| 384 | G UIG-9 app changes 7; found 5 | The huddle card's reply faces were a hand-drawn copy of `AvatarGroup`'s row (four faces where the rule is three) | EXCL steps: 4 (`AvatarGroup`) |
| 385 | G UIG-9 app changes 8 | Resolve, send, Bold/Italic/Underline and the huddle card styled through `className` | EXCL gate: `estiva/no-restyled-part` (new props) |
| 386 | G UIG-9 app changes 9 | Dead classes (`resize-none`, `whitespace-nowrap`, `[&>*]:shrink-0`) | EXCL gate: `estiva/no-restyled-part` |
| 387 | G UIG-9 app changes 10 | Ship's link fields in monospace | EXCL ruled: N5 |
| 388 | G UIG-9 app changes 11 | Ship's loading block with 8px corners | EXCL ruled: N6 |
| 389 | G UIG-9 app changes 12; "What is ready" | Peek's top-bar search, a picture of a field (escaped) | EXCL ruled: escaped, no part yet |
| 390 | G UIG-9 app changes 13; "What is ready" | Whole-row links (Peek's ticket rows, Ship's issue row and chip) escaped | EXCL ruled: UIG-33 |
| 391 | G UIG-9 package; §3 family D estiva-ui | The package's own 34 places (Banner ✕, DialogShell line, Tooltip motion, stories …) | EXCL tooling |
| 392 | G UIG-9 found 1 | The ticket's counts were UIG-1's; its `cn()` trap was retired | EXCL tooling |
| 393 | G UIG-9 found 2 | Wrappers and forwarders missed by a name search | EXCL tooling |
| 394 | G UIG-9 found 4 | The huddle card's strip stuck out of its round corners (needs `clip`) | EXCL tooling (`Card` `clip`) |
| 395 | G UIG-9 found 7 | A box around a link can shift a layout (min-width, strut) | G4 |
| 396 | G UIG-9 found 8 | Menus reached into their dividers (`[&>[role=separator]]:mx-0`) | EXCL gate: `estiva/no-restyled-part` refuses `[&…]:` |
| 397 | G UIG-9 traps; UIG-7 traps | An exact-text patch misses on CRLF files | EXCL tooling |
| 398 | G UIG-9 traps | Backticks inside a generated HTML template break the page builder | EXCL tooling |
| 399 | G UIG-9 traps; UIG-27 adoption §5 traps | Two test suites side by side time out a test | EXCL tooling |
| 400 | G UIG-8 found 1 | The ticket's numbers were UIG-1's (22 Base UI imports vs 36) | EXCL tooling |
| 401 | G UIG-8 found 2 | D47 had already happened | EXCL tooling |
| 402 | G UIG-8 found 3 | The gate never read a `.ts` file (`prose.ts`) | EXCL tooling |
| 403 | G UIG-8 found 4; §3 no-overflow-class (ship) | Ship's code block scrolled while read, against the ruling that it wraps | EXCL gate: `estiva/no-rebuilt-behaviour` names `ScrollArea` |
| 404 | G UIG-8 found 5 | The package's scrollbar hid behind sticky rows | EXCL tooling |
| 405 | G UIG-8 found 6; §3 role (`option`) | Add to Open work: `role="option"` by hand; rows not reachable by keyboard | EXCL gate: `estiva/no-rebuilt-behaviour` names `Select` |
| 406 | G UIG-8 found 7 | UIG-7's check said `no-raw-element` was the only app rule | EXCL tooling |
| 407 | G UIG-8 found 8 | Ship's real-page probe read from the repo root | EXCL tooling |
| 408 | G UIG-8 found 9 | The first reason for keeping Ship's code blocks ("ScrollArea cannot go around it") was wrong | G19 |
| 409 | G UIG-8 app changes; §10 (peek story overflow) | The DateDivider story's scroll box drawn by hand | EXCL gate: `estiva/no-rebuilt-behaviour` names `ScrollArea` |
| 410 | G UIG-8 app changes; §3 role (`alert` ship ×2) | Ship's two upload error lines with `role="alert"` by hand | EXCL gate: `estiva/no-rebuilt-behaviour` names `FieldLine` |
| 411 | G UIG-8 app changes; §3 createPortal (FileAttachmentCard) | The full-screen picture viewer's `createPortal` (escaped) | EXCL removed: now `Lightbox` (UIG-35) |
| 412 | G UIG-8 app changes; §3 keydown (HuddleCreator) | The huddle starter's key and press listeners (escaped) | EXCL ruled: escaped, a panel in the page |
| 413 | G UIG-8 app changes | The selection toolbar's press listener (escaped) | EXCL ruled: escaped, no trigger for a selection |
| 414 | G UIG-8 app changes; §3 keydown (AppShell) | Ctrl+K's page-wide key listener (escaped) | EXCL ruled: escaped, no part owns an app shortcut |
| 415 | G UIG-8 app changes | The / @ !@ [ menus' roles and arrow keys, 7 (escaped) | EXCL ruled: UIG-31 |
| 416 | G UIG-8 app changes | The freshness dot's `role="status"` (escaped) | EXCL ruled: escaped |
| 417 | G UIG-8 app changes; §3 tabindex (ship) | Ship's description surface `tabIndex` (escaped) | EXCL ruled: D37 |
| 418 | G UIG-8 traps | Playwright hides scrollbars in headless Chrome | EXCL tooling |
| 419 | G UIG-8 traps | jsdom mounts no ScrollArea bar | EXCL tooling |
| 420 | G UIG-8 traps | A before/after photo must first confirm which code rendered | EXCL tooling |
| 421 | G UIG-8 traps | A Bash call over ~8KB fails | EXCL tooling |
| 422 | G UIG-8 traps | Muted text on a surface (3.94:1) fails CI's axe in a new story | EXCL a11y |
| 423 | G UIG-7 L7; found 2 | A disabled fieldset did not tell Base UI: a busy form's buttons looked usable | EXCL tooling |
| 424 | G UIG-7 L8; found 6 | Text fields had no hover | EXCL tooling |
| 425 | G UIG-7 count (ship 4, peek 1) | Raw `<form>` | EXCL gate: `estiva/no-raw-element` names `Form` |
| 426 | G UIG-7 count; §3 raw-input | Raw file `<input>` (Ship 2, Peek 1) and the other raw inputs | EXCL gate: `estiva/no-raw-element` names `FilePicker` / `TextInput` |
| 427 | G UIG-7 count (peek) | A raw `<label>` | EXCL gate: `estiva/no-raw-element` names `Field` / `Checkbox` `label` |
| 428 | G UIG-7 found 1 | The ticket's counts were UIG-1's | EXCL tooling |
| 429 | G UIG-7 found 3; UIG-29 found 4 | Chrome blurs a field when it is disabled; jsdom does not | EXCL tooling |
| 430 | G UIG-7 found 4 | The browser submits on Shift+Enter and Alt+Enter; a comment sent on Shift+Enter | G10 |
| 431 | G UIG-7 found 5 | A Form will not send while a Field shows an error; the palette's own story stuck | G10 |
| 432 | G UIG-7 found 7; "What is ready" UIG-9/14 | 11 places sent their fields by a hand-written Enter handler, not a `<form>` | G10 |
| 433 | G UIG-7 found 8 | UIG-5's inward set is narrower than the apps' rule | EXCL tooling |
| 434 | G UIG-7 found 9 | Ship's `Description.test.tsx` flaked once | EXCL tooling |
| 435 | G UIG-7 traps | `git rebase` in a worktree failed with update_ref | EXCL tooling |
| 436 | G UIG-7 traps | `RuleTester` refuses two identical cases | EXCL tooling |
| 437 | G UIG-7 traps | React 19's `element.ref` warning comes from a Storybook code sample | EXCL tooling |
| 438 | G UIG-7 traps | Storybook's action events do not show a handler ran | EXCL tooling |

**UIG-29, UIG-6, UIG-5, UIG-4, UIG-3, UIG-28**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 439 | G UIG-29 reconciliation; §9.3 | The old launcher's raw `<button>` ×4 and `<input>` ×1 | EXCL gate: `estiva/no-raw-element` |
| 440 | G UIG-29 reconciliation; §9.3 | The old launcher's `createPortal`, `overflow-auto`, `role="alert"` | EXCL gate: `estiva/no-rebuilt-behaviour` |
| 441 | G UIG-29 reconciliation; §9.3 | The old launcher's hand-made empty state | EXCL steps: 4 (`EmptyState`) |
| 442 | G UIG-29 reconciliation; §9.3 | The old launcher's 5 copied class lists (DialogShell, ChipInput, SearchInput) | EXCL steps: 4 |
| 443 | G UIG-29; UIG-28 count | 58 hand-typed sizes and 2 raw colours in the old launcher | EXCL gate: the token lint (`text-[14px]` names its token) |
| 444 | G UIG-29 "How it was decided" | The old launcher's 9 UX bugs F1–F9 | EXCL removed: the file was rewritten on `CommandPalette` |
| 445 | G UIG-29 found 1; §13 | Base UI Autocomplete moved the highlight on Home and End | EXCL tooling |
| 446 | G UIG-29 found 2; §13 | Base UI kept the highlight's position, not its row | EXCL tooling |
| 447 | G UIG-29 found 3; §13 | The approved prototype had three bugs | EXCL removed: prototype deleted, not carried |
| 448 | G UIG-29 found 5 | Peek had no recents | EXCL ruled: a feature, built |
| 449 | G UIG-29 found 6; §13 | A message search hit dropped its thread's tags | EXCL tooling (see D) |
| 450 | G UIG-29 found 7 | Storybook's Vite cache kept an old `@estiva-app/ui` | G23 |
| 451 | G UIG-29 not built; §13 | The Make proposal card's lines are token classes inside `Card` | EXCL ruled: a palette part when next touched |
| 452 | G UIG-6 gates:status 1 | The status check asked `…/protection` (Not Found to non-admins) | EXCL tooling |
| 453 | G UIG-6 gates:status 2 | The status check knew only classic protection | EXCL tooling |
| 454 | G UIG-6 found 2 | The ticket said to keep checks required; none were | EXCL tooling |
| 455 | G UIG-6 found 5 | The rulesets went on before the job was on `main` | EXCL tooling |
| 456 | G UIG-6 found 6 | A draft PR proves nothing | EXCL tooling |
| 457 | G UIG-6 traps | A proof-merging script must first check that `gate` failed | EXCL tooling |
| 458 | G UIG-6 traps | `gh pr close --delete-branch` from a worktree leaves the local branch | EXCL tooling |
| 459 | G UIG-6 traps; "What is ready" | Renaming the job `gate` needs each ruleset changed | EXCL tooling |
| 460 | G UIG-5 found 1 | The ticket's numbers were stale | EXCL tooling |
| 461 | G UIG-5 count; §5 P4; §7 | Package: raw `<a>` in Breadcrumb and raw `<button>` in Toast, buried | EXCL tooling |
| 462 | G UIG-5 found 2 | A file-system rule breaks probes | EXCL tooling |
| 463 | G UIG-5 traps | In `RuleTester` a rule's id is prefixed | EXCL tooling |
| 464 | G UIG-5 traps | An escape anchors to the statement, not the call | G19 |
| 465 | G UIG-5 traps; UIG-3 E1; §16 S4 | An `eslint-disable` silences the rule and the count fails; the marker inside `eslint-disable` is refused | G19 |
| 466 | G UIG-4 found 1; §16 S1 | A session started below the repo's folder (`web/`) does not get the hook | G21 |
| 467 | G UIG-4 found 2 | Branch protection needs a job by its name; no job was named for the gate | EXCL tooling |
| 468 | G UIG-4 found 3 | The ticket's two hooks warnings were not both in one file | EXCL tooling |
| 469 | G UIG-4 found 4 | A new 0.x minor always moves the range | EXCL tooling |
| 470 | G UIG-4 traps | A shell inside a worktree blocks `git worktree remove` | EXCL tooling |
| 471 | G UIG-4 traps; UIG-27 adoption §5 traps | Ship's root tests stop at the first script, or fail on Windows only | EXCL tooling |
| 472 | G UIG-3 found 1; §16 S1; §18 G1 | The hook reaches only sessions started in the repo's folder; the ticket and the guide claimed every session, unchecked | G21 |
| 473 | G UIG-3 found 2 | `InputChip` could not name its ✕ or cut a long label | EXCL tooling |
| 474 | G UIG-3 found 3 | A stale comment in MembersDialog (MenuItem outside a Menu has no role) | EXCL tooling (see D) |
| 475 | G UIG-3 found 4 | Select's keyboard tests raced the list's focus | EXCL tooling |
| 476 | G UIG-3 count; §3 raw-button; §10 | Raw `<button>`: 8 replaced (Cancel, tickets toggle, Add members, members pill, launcher chips ×3, source row) | EXCL gate: `estiva/no-raw-element` names `Button` |
| 477 | G UIG-3 E3; §10 (SignalTheme story) | 7 raw buttons, a `<textarea>` and 3 `title=` on the Signal Theme page | EXCL removed: page deleted |
| 478 | G UIG-3 E4 | The picture viewer's ✕ (escaped) | EXCL removed: now `Lightbox` |
| 479 | G UIG-3 traps | `eslint -o /dev/null` writes a file named `nul` | EXCL tooling |
| 480 | G UIG-3 traps | The story picker matches per line | EXCL tooling |
| 481 | G UIG-3 traps | Tailwind in a running Storybook does not generate a class new to the app until `index.css` is touched | G23 |
| 482 | G UIG-28 found 1 (§13); R1 | The raw-colour rule in Peek and Ship matched nothing (`[^]`) | EXCL tooling |
| 483 | G UIG-28 count; §11 G1 | Hand-typed type sizes (Peek 175, Ship 14, package 87, incl. Breadcrumb/Kbd `text-[14px]`) | EXCL gate: the token lint names the token |
| 484 | G UIG-28 R3 | Signal's small labels (24) at sizes with no token | EXCL gate: the token lint (`text-small`) |
| 485 | G UIG-28 R4 | Sizes close to a token but not one (14 strings) | EXCL gate: the token lint |
| 486 | G UIG-28 count | Hand-written corners (Peek 5, package 1) | EXCL gate: the token lint |
| 487 | G UIG-28 count | Hand-written shadows (Peek 5, package 5) | EXCL gate: the token lint |
| 488 | G UIG-28 count; §11 G2 | Inline `style` setting a colour, size or border (Peek 36, Ship 3, package 10) | EXCL gate: `no-restricted-syntax` in the token lint |
| 489 | G UIG-28 reconciled | 5 raw colours in Peek hidden by the broken pattern | EXCL gate: the token lint (R1) |
| 490 | G UIG-28 count | UIG-1's scripts were thrown away and its prefix list never written | EXCL tooling |
| 491 | G UIG-28 A4; §13; §11 G3 | The apps' Design Tokens pages drew at 16px and drifted; five swatch grids copied between apps | EXCL removed: deleted |
| 492 | G UIG-28 A3 | Ten looks off-token (resolved line, highlight squares …) | EXCL ruled: A3, named values |

**§2–§23 (UIG-1 and UIG-2's record)**

| # | source & location | the defect | where it goes |
|---|---|---|---|
| 493 | G §2 | The ticket excluded `*.test.tsx` but not `*.test.ts` | EXCL tooling |
| 494 | G §2; §10 | Leaving stories out of the lint was a mistake | EXCL tooling |
| 495 | G §2 method | Grep counted words in comments (`overflow-auto` 3 vs 1; `createPortal` 7 vs 2) | EXCL tooling |
| 496 | G §3 note 1; §13 | `no-tabindex-on-div` was too broad (`tabIndex={-1}`) | EXCL tooling |
| 497 | G §3 note 2 | The first `role` count was too narrow | EXCL tooling |
| 498 | G §3 note 2; §13; §14 D2 | Both apps hand-built a progress bar (`role="progressbar"`) | EXCL removed: deleted, `ProgressBar` (UIG-27) |
| 499 | G §3 family C no-handmade-header | Peek's hand-made panel headers (ConversationHeader, ThreadPanel ×2) | G1 |
| 500 | G §3 family C no-handmade-empty-state; §10 (ReactionPicker story) | Hand-made empty states (Peek 7, Ship 2, a package story 1) | G3 |
| 501 | G §3 family C no-copied-class-list | Copied class lists in the apps (Peek 28; Ship 2: AuthShell ≈ DialogShell, Sidebar ≈ NavItem) | EXCL steps: 4 |
| 502 | G §5 P1; §14 D3 | ChipInput's hand-rolled float and Toast's portal in the package | EXCL tooling |
| 503 | G §5 P2/P3 | FieldLine and MenuItem read as orphans (false positive) | EXCL tooling |
| 504 | G §9.2; §18 (a) | A Base UI package name spelled wrong (in tickets, not the guide) | EXCL tooling |
| 505 | G §9.4; §13 #5 | The package copies its own class lists (14) | EXCL tooling |
| 506 | G §9.5; §18 F2–F5 | "Peek has 5 pages and 0 page stories", four times | EXCL tooling |
| 507 | G §9.5; §18 F2 evidence | FoldersPage and ObjectPage have no story; no page story has an empty or loading state | G16 |
| 508 | G §10 finding | The package's stories restyled parts 19 times (Person Sizes, Property's raw sizes, ScrollArea's border and fill, which Ship copied) | EXCL gate: `estiva/no-restyled-part` (stories are linted) |
| 509 | G §11 G3; §13 | `Reference` hand-built in both apps, with the same bug twice | EXCL ruled: record the pairs, promote none yet (UIG-18) |
| 510 | G §12 | No usage page for any app part (168) | EXCL gate: `estiva-ui check` refuses a reusable part with no page |
| 511 | G §12; §19 | "Rules" meant two, then three, things | EXCL tooling |
| 512 | G §13 errors 1 | UIG-2's acceptance would have forced committing two errors | EXCL tooling |
| 513 | G §13 errors 2–3; §22 UIG-10 | UIG-8, UIG-5 and UIG-10 named UIG-11 as the registry | EXCL tooling |
| 514 | G §13 errors 4 | UIG-5 said the package's four numbers disagreed | EXCL tooling |
| 515 | G §13 UIG-28 found 2 | The token lint could not see a class list in a variable it did not know (`const TH`, an array, AttachmentCard's `NAME`, an editor's `attributes.class`) | G20 |
| 516 | G §13 UIG-28 found 3 | The lint could not read a class list through `.join()` | G20 |
| 517 | G §13 UIG-28 found 5 | No story draws Peek's reference-widget text field | G16 |
| 518 | G §13 UIG-28 found 7 | The ticket's reason for the package's hand-written sizes was out of date | EXCL tooling |
| 519 | G §13 UIG-28 found 8 | The ticket gave all three repos Peek's lint layout | EXCL tooling |
| 520 | G §13 UIG-28 found 10 | The older rules' variant pattern misses arbitrary variants | EXCL tooling |
| 521 | G §13 UIG-28 found 12 | `MenuItem.stories.tsx` has `\r\r\n` lines | EXCL tooling |
| 522 | G §14 "What the rulings change" C1 | UIG-1's empty-state rule flagged a hint as an empty state | EXCL tooling |
| 523 | G §15; §19; §22 | "The same row set" could not be true (UIG-10, UIG-11, UIG-26) | EXCL tooling |
| 524 | G §17 false pass 1 | "token contract" in a comment passed a CI check | EXCL tooling |
| 525 | G §17 false pass 2 | A config that lints nothing passed "a test file is not linted" | EXCL tooling |
| 526 | G §17 false pass 3 | The same, for `tabIndex={-1}` | EXCL tooling |
| 527 | G §17 false pass 4 | "No escape names UIG-29" was true only because no escapes existed | EXCL tooling |
| 528 | G §17 limits | A stale `node_modules` gives a stale status | EXCL tooling |
| 529 | G §17 "It also found" | Three record gaps a fresh agent found | EXCL tooling |
| 530 | G §18 F1 | The guide said 43 components (44) | EXCL tooling |
| 531 | G §18 F6; §22 UIG-3/UIG-29 | Peek's lint quoted as 79 / 94 errors; never those numbers | EXCL tooling |
| 532 | G §18 F7–F8; §22 UIG-8 | The guide and UIG-8's acceptance said a lint rule catches the Folders scroll bug; a missing scroll container has no class to find | G2 |
| 533 | G §18 F9–F10; §22 UIG-10 | "Ship retrofitted in 4 PRs" (8); "Peek … a month" (two days) | EXCL tooling |
| 534 | G §22 UIG-26 | "All 25 rows" written before UIG-27 to UIG-29 existed | EXCL tooling |
| 535 | G §22 UIG-21 | "All of ours have passed [200 lines]": none had | EXCL tooling |
| 536 | G §22 UIG-15 | "No page in Peek has a story or a test": three had | EXCL tooling |
| 537 | G §22 UIG-17 | "58 story files" (59) | EXCL tooling |
| 538 | G §22 GATES.md row | §9.2 and §13 were left saying what UIG-1 wrote | EXCL tooling |
| 539 | G §23; §17; §20 decision 8 | The gate pieces were copied into each repo (hook, count, status engine, checks, folder config, token block) | EXCL removed: one copy, in the package (UIG-32) |
| 540 | G §23 corrected | The README said the count writer was copied and that there were two lint rules | EXCL tooling |
| 541 | G §23 "Still copied" | Each repo's CLAUDE.md carries its own copy of the gate paragraph | EXCL tooling (UIG-21) |
| 542 | G §23 "What changes" | One word for the rules and the switch-on files hid a mistake | EXCL tooling |

## D. Unsure how to classify

1. **Four PLAN findings record no defect, so they have no row:** F11 (stage 0 proof: nothing moved), F14 (two port decisions she ruled), F15 and F18 (the proofs for stages 1 and 2). These are the only entries in the four sources that I read and left without a row. GATES.md also has notes that are not defects and have no row: §0 "UIG-27 overlapped the migration plan", §6 (the escape-boundary numbers), §11 G4 (the docs contract was already met), "the real screens were not re-photographed" (a method note), UIG-29's unbuilt C5 (a ruling not built yet, not a mistake), the UIG-13 "859 pixels" first comparison (the dot grid, not a defect), and the round 2 cards A–M (her decisions on round-1 cards that already have rows).
2. **Rows that fit no category exactly and were given the nearest one:** #152 (Ship's editor committed when a file's Download took focus: app wiring, now `opens={false}`), #166 (the table round trip emptied cells on save: the editor's save path), #449 (a search hit dropped its thread tags: app data code). All three are marked `EXCL tooling`, but they are one-off app logic bugs, each pinned by a test, not screen-building mistakes. #474 (a stale comment in MembersDialog) is also marked `tooling`.
3. **#276 (C5, a Send button that only listens to the mouse) is marked `a11y`, but it was fixed at the time.** "Keyboard reach" fits the deferred accessibility pass. It could also be a gotcha: "press handlers on `onClick`, never on mouse events only".
4. **#188 (card 1.6, a MenuItem in a dialog with no Menu):** she answered "ok", and the record does not say which way that went. UIG-3 had made "Add members" a MenuItem on purpose (E4), so I did not write a gotcha about MenuItem outside a Menu.
5. **#203 (3.3) and #277 (C6)** could be `gate` rather than `steps`: `no-rebuilt-behaviour` refuses a hand-written `role="alert"` and names `FieldLine`. The record does not say whether 3.3's line carried a role.
6. **G1 absorbs controls that do nothing (#54, #217, #337), although she ruled that the existing ones stay.** The gotcha stops new dead buttons. It does not overrule those rulings. ContainerHeader.mdx says: "Only offer a button that does something".
7. **#373 (the wider gap: a box that places or styles any part passes every gate) is mapped to G3**, because the case that happened was `EmptyState`. If the skill wants it general, it could be its own gotcha: "never wrap a part in a box that places it".
8. **Stale ticket counts** recur in almost every ticket (#104, #158, #180, #333, #392, #400, #428, #460 …). They are marked `tooling` because they are not screen work, but a session makes this mistake again and again. The skill could add one line: "recount from the code; never trust a ticket's number".
9. **Two sources overlap.** The UIG-15 table D1–D8 (#325–#332) re-records PEEK-ADOPTION §17 (#1–#7), and PLAN F53 (#64) restates it again. The debt rows #76–#91 re-record instances that also have GATES rows (#379–#391, #403–#417, #425–#427, #476). Each source keeps its own rows, as the ticket asks for counts per source. Rows that count the same instances twice: 8 (UIG-15 table) + 1 (F53) + 16 (debt) = about 25.
10. **C5–C8, C11, M10, M11 and the S1 correction are only named by id in GATES.md.** Their one-line descriptions come from the review page it links (artifact LUhtwcfi5z5J6uhWhDQx9N, "UIG-14 Findings").
