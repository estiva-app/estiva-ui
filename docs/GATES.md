# GATES — UI Guardrails, the route and the record

The route, every decision as it is taken, the reconciliations, the debt lists,
and §0 the live state.

The reasoning behind all of it lives in `docs/GATES-GUIDE.md` — **that is the
source of truth.** Where anything here disagrees with it, the guide wins.
UIG-2 commits the guide and adds this document's phase table, the 26 ticket
rows, the five seams and the `gates:status` script. **UIG-1 created this file
and owns §0 through §8 only**; UIG-2 adds its sections around them.

Status key, emoji first: ✅ done · 🚧 in progress · ⬜ not started · ⛔ blocked
· ⚠️ needs a decision from Katerina

---

## §0 The live state

**Last session: 2026-09-13 — UIG-1.**

| | what |
|---|---|
| ✅ | **UIG-1 — the count.** All 21 candidate rules measured across all three repos. §3–§7 below. |
| ⚠️ | **The verdict column in §3 is blank.** Katerina marks every rule *on* / *warn* / *dropped*. Nothing in phase 1 can start until she has. |
| ⬜ | UIG-2 — the tracking rails. Not started. Can run in parallel; it does not need UIG-1. |
| ⛔ | UIG-3 onwards — waiting on the verdicts. |

**Nothing was installed and no source file changed.** The measurement scripts
were throwaway and are deleted. The only file this ticket wrote is this one.

**What UIG-1 is handing to the next ticket:**

- UIG-3 (tracer in Peek, raw `<button>`): **12 violations in Peek**, in 7 files.
- UIG-4 (the same in Ship): **0 violations in Ship.** Ship has no raw `<button>` at all.
- UIG-5 (the package chain, pointed inward): the recommended tracer is
  **`raw-element-outside-a-wrapper`, 4 violations** — §7.
- UIG-7 (every remaining raw element): ⛔ **`raw-anchor` cannot ship yet** — §9 finding 1.
- The escape-boundary question is answered: **Peek 23, Ship 9** — §6.

---

## §1 What this document records for UIG-1

UIG-1 asked one question: *before we switch anything on, what would it actually
block?*

The answer is §3 — one row per candidate rule per repo, with real counts, real
`file:line` samples, and the exact words the error would say. The verdict column
is blank on purpose. It is Katerina's.

---

## §2 How the counting was done

**The target set, files.** Every `.ts` and `.tsx` under `estiva-ui/src`,
`peek/src` and `ship/web/src`, excluding `*.stories.tsx` and `*.test.tsx` —
the ticket's wording, taken literally.

| repo | files scanned |
|---|---|
| estiva-ui | **51** |
| peek | **254** |
| ship | **130** |
| | **435** |

Two things about that number, both stated because the ticket asks for
completeness, not for a tidy figure:

- The ticket excludes `*.test.tsx` but not `*.test.ts`, so **68 unit-test files
  are inside the target set** (estiva-ui 3, peek 49, ship 16). They are tests of
  logic with no JSX in them, and **they carry 0 violations of any rule** — so
  they change no number here. If UIG-3 writes the real lint, exclude `*.test.ts`
  as well; it costs nothing and the intent is plainly the same.
- estiva-ui's 51 is 44 component `.tsx` files plus `index.ts`, `cn.ts`,
  `fit.ts`, `triggerDisabled.ts`, and 3 `.test.ts`. The **44** agrees with the
  number UIG-5 quotes.

**The method.** One throwaway Node script per rule family, parsing every file
with the TypeScript compiler API and walking the AST. **Never grep** — the
ticket's trap is real and it caught me twice:

- A grep for `overflow-(auto|scroll)` reports **3 hits in estiva-ui**; the AST
  reports **1**. The other two are the word inside a comment. Grep over-counts
  here as often as it under-counts.
- My own first pass measured "hand-rolled behaviour" by text match and found
  `createPortal` in **7** package files. The AST finds **2 call sites**. The
  other five mention it in prose.

Class rules are matched on **every string literal in the file**, not only on a
`className` attribute, so a class inside `cn()`, inside a `*Styles` map or
inside a variable is counted the same as one written inline.

**Where a count needed a judgement, both numbers are given** rather than one
number and an opinion — §3 rows 12, 13 and 17, and §7.

---

## §3 The rule table

One row per candidate rule per repo. 21 rules. The **verdict column is for
Katerina**: *on* / *warn* / *dropped*.

The message column is the exact text the error would print. Every one of them
names a component — that is the rule for the rules.

### Family A · forbid the raw element — the guide's T10, tickets UIG-3, UIG-4, UIG-7

| rule | repo | violations | samples | message | verdict |
|---|---|---|---|---|---|
| **raw-button** | estiva-ui | 8 | `src/Menu.tsx:295` · `src/Toast.tsx:105` · `src/Reaction.tsx:58` | *(package-facing — see §5 P4)* | |
| | **peek** | **12** | `components/CommandLauncher.tsx:1363` · `components/HuddleCreator.tsx:87` · `components/ui/PendingAttachmentChip.tsx:58` | `A <button> here is not ours. Use Button, or IconButton when it is icon-only.` | |
| | **ship** | **0** | none found | same | |
| **raw-input** | estiva-ui | 1 | `src/ChipInput.tsx:205` | *(package-facing — see §5 P4)* | |
| | **peek** | **4** | `components/CommandLauncher.tsx:1418` · `components/HuddleCreator.tsx:95` · `components/ui/AttachFiles.tsx:30` | `An <input> here is not ours. Use TextInput, SearchInput, or Checkbox for a tick box.` | |
| | **ship** | **2** | `components/Composer.tsx:183` · `components/ui/DescriptionEditing.tsx:215` | same | |
| **raw-anchor** ⛔ | estiva-ui | 3 | `src/NavItem.tsx:31` · `src/RailItem.tsx:27` · `src/Breadcrumb.tsx:91` | *(package-facing — see §5 P4)* | |
| | **peek** | **7** | `components/ui/MessageBody.tsx:51` · `components/ThreadReplyCard.tsx:500` · `components/ui/ForeignObjectWidget.tsx:277` | **cannot be written — see §9 finding 1** | |
| | **ship** | **7** | `components/Board.tsx:24` · `components/IssueRow.tsx:66` · `components/IssuesTable.tsx:84` | **cannot be written — see §9 finding 1** | |
| **raw-dialog** | estiva-ui | 0 | none found | `A <dialog> here is not ours. Use DialogShell, or ConfirmDialog to ask yes or no.` | |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |

### Family B · forbid the reach — the guide's T11, ticket UIG-8

| rule | repo | violations | samples | message | verdict |
|---|---|---|---|---|---|
| **no-base-ui-import** | estiva-ui | 22 | `src/Button.tsx:2` · `src/Checkbox.tsx:1` · `src/CollapsibleSection.tsx:2` | *legitimate — this is the package's job* | |
| | **peek** | **0** | none found | `Only @estiva-app/ui imports Base UI. Take the component from @estiva-app/ui, or add it there first.` | |
| | **ship** | **0** | none found | same | |
| **no-create-portal** | estiva-ui | 2 | `src/ChipInput.tsx:222` · `src/Toast.tsx:174` | *(package-facing — see §5 P1)* | |
| | **peek** | **2** | `components/CommandLauncher.tsx:1327` · `components/ui/FileAttachmentCard.tsx:67` | `createPortal is not how we float. Use Popover, Menu, Tooltip, PreviewCard or DialogShell — each owns its own portal.` | |
| | **ship** | **0** | none found | same | |
| **no-keydown-listener** | estiva-ui | 0 | none found | same | |
| | **peek** | **2** | `components/HuddleCreator.tsx:64` · `layouts/AppShell.tsx:34` | `A keydown listener on document is not how we take keys. Menu, Select, Popover and DialogShell own their own.` | |
| | **ship** | **0** | none found | same | |
| **no-role-dialog** | estiva-ui | 0 | none found | `A hand-written role="dialog" is a hand-made dialog. Use DialogShell — it traps focus and gives it back.` | |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |
| **no-tabindex-on-div** | estiva-ui | 0 | none found | `tabIndex turns a box into a control. Use Button, IconButton or NavItem — they are focusable already.` | |
| | peek | **0** | none found | same | |
| | **ship** | **1** | `components/ui/DescriptionEditor.tsx:77` | same | |
| **no-overflow-class** | estiva-ui | 1 | `src/ChipInput.tsx:224` | *(package-facing — see §5 P1)* | |
| | **peek** | **2** | `components/CommandLauncher.tsx:1689` · `components/HuddleCreator.tsx:143` | `overflow-auto draws the browser's scrollbar. Use ScrollArea — it draws ours.` | |
| | **ship** | **1** | `components/ui/prose.ts:35` | same | |

### Family C · fingerprints — the guide's T12, tickets UIG-22 to UIG-25

| rule | repo | violations | samples | message | verdict |
|---|---|---|---|---|---|
| **no-handmade-header** | estiva-ui | 1 → **0** | `src/DialogShell.tsx:117` — the owner | `A panel header drawn by hand. Use SectionHeader.` | |
| | **peek** | 4 → **3** | `components/ConversationHeader.tsx:132` · `components/ThreadPanel.tsx:233` · `components/ThreadPanel.tsx:367` | `A panel header drawn by hand. Use ContainerHeader.` | |
| | **ship** | **0** | none found | `A panel header drawn by hand. Use SectionHeader.` | |
| **no-handmade-empty-state** | estiva-ui | 0 | none found | `A line saying there is nothing is EmptyState. Use EmptyState — scope="section" inside a section, scope="page" for a page.` | |
| | **peek** | **7** | `components/CommandLauncher.tsx:1464` · `components/ReadStatePanel.tsx:65` · `components/views/FolderContentsView.tsx:101` | same | |
| | **ship** | **2** | `components/Board.tsx:61` · `components/ui/ForeignObject.tsx:206` | same | |
| **no-native-title** | estiva-ui | **0** | none found | `title= is the browser's tooltip, not ours. Use WithTooltip, or IconButton's tooltip prop.` | |
| | **peek** | **3** | `components/ui/Reference.tsx:116` · `:137` · `:166` | same | |
| | **ship** | **3** | `components/ui/Reference.tsx:87` · `:103` · `:137` | same | |
| **no-copied-class-list** | estiva-ui | 14 | `src/TextInput.tsx:26` ≈ `Textarea.tsx:24` · `src/Chip.tsx:36` ≈ `Reaction.tsx:64` | *(internal duplication — §9 finding 4)* | |
| | **peek** | **28** | `components/CommandLauncher.tsx:1339` ≈ `DialogShell.tsx:113` · `components/ThreadPanel.tsx:233` ≈ `DialogShell.tsx:117` · `components/ui/PersonRow.tsx:84` ≈ `Skeleton.tsx:22` | `This class list is DialogShell's, re-typed. Import DialogShell from @estiva-app/ui.` | |
| | **ship** | **2** | `auth/AuthShell.tsx:42` ≈ `DialogShell.tsx:87` · `components/Sidebar.tsx:91` ≈ `NavItem.tsx:38` | same | |

### Family D · the className allow-list — the guide's T13, ticket UIG-9

| rule | repo | violations | samples | message | verdict |
|---|---|---|---|---|---|
| **className-placement-only** | estiva-ui | **9** / 8 | `src/Banner.tsx:62` (IconButton `text-current`) · `src/DialogShell.tsx:150` (ScrollArea `border-b`) · `src/Tooltip.tsx:115` (Tooltip `transition-[…]`) | `Only placement passes through IconButton's className. "text-current" changes how it looks — ask for a prop on IconButton.` | |
| | **peek** | **33** / 15 | `components/ui/ForeignObjectWidget.tsx:91` (Person `text-caption`) · `pages/FoldersPage.tsx:260` (EditableText `text-body-2-strong`) · `components/ui/ComposeBox.tsx:407` (IconButton `signal:shadow-glow-accent`) | same, with the component's own name | |
| | **ship** | **15** / 8 | `views/IssueView.tsx:120` (EditableText `text-h2`) · `components/NewProjectDialog.tsx:89` (TextInput `font-mono`) · `components/IssuesTable.tsx:47` (ScrollArea `border rounded-lg`) | same | |

**The two numbers.** The first counts padding (`p-3`, `py-8`) as *not* placement;
the second lets padding through. The difference is almost entirely **padding
pushed into `EmptyState`** — 9 places in Peek, 6 in Ship. ⚠️ **This is the one
definition Katerina has to settle**, because it halves the rule: is padding the
caller's business or the component's?

### Already live, recorded so nothing is counted twice

| rule | repo | violations | samples | message | verdict |
|---|---|---|---|---|---|
| **colours & sizes** (`lint:tokens`) | all three | 0 | none — it is a CI gate already | already in `eslint.tokens.js`, since D36 (Ship) and D55 (Peek) | *on, already* |

---

## §4 The two rules the guide's list does not name

The guide's T10 line names four raw elements. **UIG-7's own summary says "text
boxes, dropdowns, links, dialogs"** — a dropdown is `<select>`, and a text box
is as often `<textarea>` as `<input>`. Both are measured here so the family is
not left with a hole in it.

| rule | estiva-ui | peek | ship | samples | message | verdict |
|---|---|---|---|---|---|---|
| **raw-select** *(added)* | 0 | **0** | **0** | none found anywhere | `A <select> here is not ours. Use Select.` | |
| **raw-textarea** *(added)* | 2 | **0** | **0** | `src/Textarea.tsx:22` (render prop) · `src/EditableText.tsx:143` (render prop) | `A <textarea> here is not ours. Use Textarea.` | |

Both are **free rules**: zero violations in either app, and the package's two are
`render` props handed to a Base UI part, which is the legitimate pattern. Switch
them on with UIG-7 and they can never regress.

---

## §5 The package-facing candidates

UIG-5 names four inward rules and says UIG-1 measures all of them. Measured here,
against `estiva-ui/src` only.

| | rule | violations | what it found | verdict |
|---|---|---|---|---|
| **P1** | hand-rolled behaviour where a Base UI part exists (D6) | **2 components, 6 sites** | **`ChipInput` is the package's last hand-rolled float**: it imports `./fit` (:5), listens to `window` resize and scroll itself (:143, :144) and portals by hand (:222) — four things Base UI's Positioner and Portal own. `Toast.tsx:174` is the second `createPortal`. `fit.ts` now has **one** real caller; the rest moved to Base UI. | |
| **P2** | a component with no `.mdx` doc page | **0** | All 44 components have one. 46 `.mdx` files: the 2 extra are `FieldLine` and `MenuItem`, exported from a sibling file — **the false positive UIG-5 warns about, confirmed present.** | |
| **P3** | a component with no `.stories.tsx` | **0** | All 44 have one. Same 2 extras, same reason. | |
| **P4** | a raw element outside a wrapper | **9** / **4** | 14 raw elements in the package. 5 are handed to a Base UI `render` prop. Of the remaining 9, **4 sit nested inside a larger component** — `Breadcrumb.tsx:91`, `ChipInput.tsx:43`, `ChipInput.tsx:205`, `Toast.tsx:105` — and 5 are the component's own root element (`NavItem`, `RailItem`, `Reaction`, `EditableText`, `Menu.tsx:480`). | |

**P2 and P3 are at zero.** That is good news and it means neither can be a
tracer — a rule with nothing to fix proves nothing about the fix-or-escape path.
Switch both on anyway in UIG-5: they cost nothing and they hold the line.

The package's own four numbers, re-counted and all agreeing with UIG-5:
**44 component files · 46 doc pages · 46 story files · 45 export lines** in
`index.ts` (65 value exports across those 45 lines).

---

## §6 The escape-boundary number

*How many raw elements sit outside a pure re-export file — a file whose only
statement is `export … from '@estiva-app/ui'`.*

| | peek | ship |
|---|---|---|
| raw elements (`button`, `input`, `a`, `dialog`), total | 23 | 9 |
| …of which inside a **pure re-export** file | **0** | **0** |
| **THE ESCAPE-BOUNDARY NUMBER** | **23** | **9** |
| …inside `components/ui/` | 12 | 3 |
| …outside it | 11 | 6 |

**The answer: yes, "no exempt folder, escapes only" is liveable.** 32 escape
markers across both apps, and every one of them names a real place worth looking
at later.

**And exempting the folder would be actively wrong.** The ticket suspected this;
the numbers prove it:

- `peek/src/components/ui` holds 83 files, **51 of them in the target set**
  (the ticket's "80" is the same folder counted a day earlier). **15 of the 51
  are pure re-exports** — and **not one of them contains a raw element**,
  because a one-line re-export has no JSX at all. Exempting the folder buys
  nothing.
- What it *would* exempt is the 7 real components that do hold the 12 raw
  elements: `FileAttachmentCard.tsx` (313 lines), `ForeignObjectWidget.tsx`
  (625), `ProjectTickets.tsx` (179), `MessageBody.tsx` (497),
  `PendingAttachmentChip.tsx` (138), `AttachFiles.tsx` (69), `MembersPill.tsx` (53).
- `PendingAttachmentChip` is in that list — **the component the guide cites as
  the thing nobody can find.** An exempt folder would hide it from the one
  mechanism built to surface it.
- Ship is the same shape: 52 files in `components/ui`, 40 in the target set (the
  ticket's "50"), **28 of them pure re-exports with no raw element in any of
  them**, and the 3 raw elements in 2 real components (`ForeignObject.tsx` 232
  lines, `DescriptionEditing.tsx` 249).

---

## §7 The tracer rule recommended for UIG-5

**Recommendation: `raw-element-outside-a-wrapper` (P4), under the narrow
definition — 4 violations.**

| candidate | count | why not |
|---|---|---|
| P1 hand-rolled behaviour (D6) | 2 components | Fixing it *is* moving `ChipInput` onto Base UI Combobox — stage 5 of the migration. Far too big to carry a tracer. |
| P2 no doc page | 0 | Nothing to fix, so nothing to prove. |
| P3 no story | 0 | Same. |
| `no-copied-class-list` inward | 14 | Fuzzy — it is a similarity threshold, not a fact. A tracer must be unarguable. |
| `className-placement-only` inward | 9 | Real and mechanical, but its definition is the one thing §3 says Katerina still has to settle. |
| **P4 raw element outside a wrapper** | **4** | ✅ |

Why it is the right one:

- It is the **exact mirror of UIG-3's Peek rule**, so the chain is proved with
  near-identical rule code — which is the whole point of a tracer bullet.
- **4 is the right size.** Enough to prove fix, escape, count and reconcile in
  one ticket; small enough to finish it.
- It is **mechanical**: "is this JSX element inside a `render` prop, and is it
  nested inside another element?" Both are AST facts, not opinions.
- The narrow definition **does not accuse a primitive of owning its own root
  element**. The wide definition (9) would need 5 escapes on day one for things
  that are correct — a rule that starts by apologising teaches nobody.

The four: `Breadcrumb.tsx:91` (`<a>`), `ChipInput.tsx:43` (`<button>`),
`ChipInput.tsx:205` (`<input>`), `Toast.tsx:105` (`<button>`).

---

## §8 Reconciliation

**Every candidate rule named in the guide appears in §3 exactly once.**

| source | rules named | measured | where |
|---|---|---|---|
| Guide, gate 2, family "forbid the raw element" (T10) | 4 | 4 | §3 family A |
| Guide, gate 2, family "forbid the reach" (T11) | 6 | 6 | §3 family B |
| Guide, gate 2, family "fingerprint rules" (T12) | 4 | 4 | §3 family C |
| Guide, gate 2, "className allow-list" (T13) | 1 | 1 | §3 family D |
| **guide total** | **15** | **15** | ✅ |
| Added by UIG-1, from UIG-7's own wording | 2 | 2 | §4 |
| Package-facing, named by UIG-5 | 4 | 4 | §5 |
| **grand total** | **21** | **21** | ✅ |

Two things the guide names that are deliberately **not** in §3, so neither is
silently dropped:

- **"Colours and sizes — already live"** (guide, gate 2, *Catches*). That is
  `lint:tokens`, a CI gate already. Recorded at the foot of §3 with the verdict
  pre-filled.
- **"every control reachable by Tab"** (guide, gate 3, the route probe). That is
  a runtime assertion, not a lint rule — gate 3, not gate 2. Out of scope here.

`tabIndex` on a div appears in the guide's gate-2 prose but **not** in the T11
table row. It is measured (§3 family B) — the ticket's standing rule is that a
rule the guide names is in scope even where this ticket's example list forgot it.

**Violations counted, all repos, all 21 rules: 198** — estiva-ui 61, peek 104,
ship 33. In 93 distinct files of the 435 scanned.

---

## §9 What the measurement found that the ticket did not ask for

Four things worth a decision, none of which fits in a table cell.

### ⛔ 1. `raw-anchor` cannot be switched on — there is nothing to point at

14 raw `<a>` across the two apps, and **no `Link` component exists anywhere** —
not in the package, not in Peek, not in Ship. `NavItem`, `RailItem` and
`Breadcrumb` each take an `href`, but none of them fits what these 14 actually
do, which is three different jobs:

- **a whole card or row made clickable** — Ship's `Board.tsx:24`,
  `IssueRow.tsx:66`, `IssuesTable.tsx:84`, `ProjectCard.tsx:55`
- **an external link inside prose** — Peek's `MessageBody.tsx:51` (`BodyLink`)
- **a small inline link** — Peek's `ThreadReplyCard.tsx:500`

An error message that cannot name a component is exactly the kind of rule the
guide warns gets switched off. **`raw-anchor` is blocked until the package has a
link component**, and that is a UIG-7 dependency nobody has written down yet.

There is a second reason to be careful: Ship's `<a>` elements spread
`{...linkTo(href)}`, the wrapper from SHI-20 that stops every click reloading
the whole app. Any replacement must carry that, or the navigation regression
comes straight back.

### ⚠️ 2. The guide's Base UI package name is out of date

The guide and UIG-1 both say `@base-ui-components/*`. **The installed package is
`@base-ui/react`.** A rule written from the guide's spelling would match nothing
and pass silently — the worst possible failure for a guardrail.

Measured against the real name: **22 imports in estiva-ui** (legitimate — it is
the package's job) and **0 in either app**. So the rule is free to switch on and
can never regress. Worth correcting in `GATES-GUIDE.md` when UIG-2 commits it.

### 🚧 3. `CommandLauncher.tsx` is where the rules will actually bite

One file carries 4 of Peek's 12 raw `<button>`, 1 of its 4 raw `<input>`, 1 of
its 2 `createPortal`, 1 of its 2 `overflow-auto`, 1 of its 7 hand-made empty
states and 5 of its 28 copied class lists. Its copied lists match
`DialogShell`, `ChipInput` and `SearchInput` — which is the same as saying it
has hand-built a dialog, chips and a search box that the package already has.

It is 1,655 lines. **Whatever the verdicts, this file will need its own ticket**,
and it should not be allowed to hold up switching the rules on for everything
else.

### 4. The package duplicates its own class lists

All 14 of estiva-ui's `no-copied-class-list` hits are the package copying
*itself*: `TextInput.tsx:26` ≈ `Textarea.tsx:24` (7 of 7 classes identical),
`Chip.tsx:36` ≈ `Reaction.tsx:64`, `IconButton.tsx:63` ≈ `RailItem.tsx:35`,
`SearchInput.tsx:34` ≈ `Select.tsx:144`, `SectionHeader.tsx:96` ≈
`Skeleton.tsx:22`.

That is a different problem from an app re-typing a component — these are
sibling primitives that should share a constant. It is real, and it is not what
UIG-25 is aimed at. Noted here so it is not lost.

---

*UIG-1, 2026-09-13. estiva-ui at `93048cd` (0.12.6), peek at `d094006`,
ship at `e85de7f` — all three on `main`, all three clean.*
