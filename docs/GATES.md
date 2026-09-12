# GATES.md — UI Guardrails

The working record for the UI Guardrails project. Counts, decisions, and what is
left to do.

The reasoning lives in `docs/GATES-GUIDE.md`. If this file and the guide
disagree, the guide wins.

UIG-1 wrote §0 to §10. UIG-2 adds the phase table, the 26 ticket rows, the five
seams, and the `gates:status` script.

Status key: ✅ done · 🚧 in progress · ⬜ not started · ⛔ blocked · ⚠️ needs your
answer

---

## §0 Where we are

**13 September 2026. UIG-1 is done and in estiva-ui PR #21. Not merged.**

### Three things need your answer

| | |
|---|---|
| ⚠️ **1** | **The verdict column in §3 is empty.** Mark each rule *on*, *warn*, or *dropped*. Phase 1 cannot start until you do. |
| ⚠️ **2** | **Stories: in or out?** You asked why I excluded them. The count is in §10. My answer is **in**. Tests stay out. If you agree, UIG-3 goes from 12 violations to 19. |
| ✅ **3** | **The six findings with no ticket now have one.** §13. Three new tickets, three folded into existing ones, and four ticket errors corrected. Done 13 September. |
| ⚠️ **4** | **Four more rules nobody had written down.** §11. The big one: `lint:tokens` blocks `text-sm` but lets `text-[14px]` through, and Peek has 157 of those. I proved it, I did not assume it. |
| ⚠️ **5** | **Should the usage rules come before the wall?** §12. estiva-ui's 44 components already have their pages. Peek's 113 and Ship's 55 have nothing. And UIG-1 hit a lint rule it could not write because the answer had not been decided yet. |

### The running order

**There are 29 tickets now, and the reference number is no longer the order.**
UIG-27, UIG-28 and UIG-29 were created after UIG-1 found six things with no home,
so they carry high numbers but run early. Every *Blocked by* line names the
reference **and** the title, which is what the brief said would make reordering
safe.

| when | tickets |
|---|---|
| done | **UIG-1** |
| now, any order | **UIG-2** · **UIG-27** · **UIG-28** |
| then, phase 1 | **UIG-3** → **UIG-4** → **UIG-5** → **UIG-6** → **UIG-7** → **UIG-8** → **UIG-9** |
| alongside phase 1, never blocking it | **UIG-29** |
| after | UIG-10 onwards, unchanged |

UIG-27 blocks UIG-7 and UIG-8. UIG-28 does not block anything, but it fixes a
hole in a gate the phase-1 rules will sit on top of, so do it first.

### What is ready for the next tickets

| ticket | what UIG-1 gives it |
|---|---|
| UIG-2 | The three guide corrections it must make, and 29 rows not 26. |
| UIG-3 | Raw `<button>` in Peek: **12**, across 7 files. |
| UIG-4 | Raw `<button>` in Ship: **0**. Ship has none. |
| UIG-5 | Tracer rule: **`raw-element-outside-a-wrapper`, 4 violations**, and P2/P3 free at zero. §7. |
| UIG-7 | The full element counts, and a blocker: no Link component. §9.1 |
| UIG-8 | The Base UI name is `@base-ui/react`; `tabIndex={-1}` must pass; the role branch is wider than `dialog`. |
| UIG-25 | The package copies itself 14 times, and it needs a wrapper carve-out. |
| all | Escape-boundary answered: Peek 23, Ship 9. §6 |

Nothing was installed. No source file changed in any repo. The measurement
scripts were throwaway and are deleted. This file is the only thing UIG-1 wrote.

---

## §1 What UIG-1 did

One question: before we switch a rule on, how much would it actually block?

§3 answers it. One row per rule per repo. Real counts, real `file:line`, and the
exact words the error would print.

The verdict column is empty on purpose. That call is yours.

---

## §2 How I counted

### The files

Every `.ts` and `.tsx` under `estiva-ui/src`, `peek/src` and `ship/web/src`,
minus `*.stories.tsx` and `*.test.tsx`. That is the ticket's wording, taken
literally.

| repo | files |
|---|---|
| estiva-ui | 51 |
| peek | 254 |
| ship | 130 |
| **total** | **435** |

Three notes on that number.

**The ticket excludes `*.test.tsx` but not `*.test.ts`.** So 68 unit-test files
are inside the set: 3 in estiva-ui, 49 in Peek, 16 in Ship. They test logic and
contain no JSX. They have zero violations, so they change nothing here. When
UIG-3 writes the real lint, exclude `*.test.ts` too.

**The `*.stories.tsx` exclusion came from the ticket, not the guide.** I think it
was a mistake. §10 has the numbers. §3 to §8 stay on the ticket's file set so the
reconciliation still lines up; §10 is the second column.

**estiva-ui's 51** is 44 component files, plus `index.ts`, `cn.ts`, `fit.ts`,
`triggerDisabled.ts`, plus 3 `.test.ts`. The 44 matches the number UIG-5 quotes.

### The method

A throwaway Node script per rule family. Each one parses the file with the
TypeScript compiler API and walks the AST.

**No grep.** The ticket warned about this and it caught me twice:

- Grep finds 3 `overflow-auto` in estiva-ui. The AST finds 1. The other two are
  the word inside a comment.
- My own first pass measured hand-rolled behaviour by text match and reported
  `createPortal` in 7 package files. There are 2 call sites. The other five are
  prose.

Class rules match on **every string literal in the file**, not just on a
`className` attribute. So a class inside `cn()`, inside a `*Styles` map, or
assigned to a variable counts the same as one written inline.

Where a count depended on a judgement call, I give both numbers instead of
picking one. That is §3 family D, §5 P4, and §7.

---

## §3 The rule table

21 candidate rules, one row per repo. The message column is the exact error text.
Every message names a component.

**Verdict column is yours: on / warn / dropped.**

### Family A — forbid the raw element

Guide T10. Tickets UIG-3, UIG-4, UIG-7.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **raw-button** | estiva-ui | 8 | `src/Menu.tsx:295` · `src/Toast.tsx:105` · `src/Reaction.tsx:58` | see §5 P4 | |
| | **peek** | **12** | `components/CommandLauncher.tsx:1363` · `components/HuddleCreator.tsx:87` · `components/ui/PendingAttachmentChip.tsx:58` | `A <button> here is not ours. Use Button, or IconButton when it is icon-only.` | |
| | **ship** | **0** | none found | same | |
| **raw-input** | estiva-ui | 1 | `src/ChipInput.tsx:205` | see §5 P4 | |
| | **peek** | **4** | `components/CommandLauncher.tsx:1418` · `components/HuddleCreator.tsx:95` · `components/ui/AttachFiles.tsx:30` | `An <input> here is not ours. Use TextInput, SearchInput, or Checkbox for a tick box.` | |
| | **ship** | **2** | `components/Composer.tsx:183` · `components/ui/DescriptionEditing.tsx:215` | same | |
| **raw-anchor** ⛔ | estiva-ui | 3 | `src/NavItem.tsx:31` · `src/RailItem.tsx:27` · `src/Breadcrumb.tsx:91` | see §5 P4 | |
| | **peek** | **7** | `components/ui/MessageBody.tsx:51` · `components/ThreadReplyCard.tsx:500` · `components/ui/ForeignObjectWidget.tsx:277` | **no message possible. §9.1** | |
| | **ship** | **7** | `components/Board.tsx:24` · `components/IssueRow.tsx:66` · `components/IssuesTable.tsx:84` | **no message possible. §9.1** | |
| **raw-dialog** | estiva-ui | 0 | none found | `A <dialog> here is not ours. Use DialogShell, or ConfirmDialog to ask yes or no.` | |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |

### Family B — forbid the reach

Guide T11. Ticket UIG-8.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **no-base-ui-import** | estiva-ui | 22 | `src/Button.tsx:2` · `src/Checkbox.tsx:1` · `src/CollapsibleSection.tsx:2` | legitimate. This is the package's job. | |
| | **peek** | **0** | none found | `Only @estiva-app/ui imports Base UI. Take the component from @estiva-app/ui, or add it there first.` | |
| | **ship** | **0** | none found | same | |
| **no-create-portal** | estiva-ui | 2 | `src/ChipInput.tsx:222` · `src/Toast.tsx:174` | see §5 P1 | |
| | **peek** | **2** | `components/CommandLauncher.tsx:1327` · `components/ui/FileAttachmentCard.tsx:67` | `createPortal is not how we float things. Use Popover, Menu, Tooltip, PreviewCard or DialogShell. Each owns its own portal.` | |
| | **ship** | **0** | none found | same | |
| **no-keydown-listener** | estiva-ui | 0 | none found | same | |
| | **peek** | **2** | `components/HuddleCreator.tsx:64` · `layouts/AppShell.tsx:34` | `A keydown listener on document is not how we take keys. Menu, Select, Popover and DialogShell own their own.` | |
| | **ship** | **0** | none found | same | |
| **no-role-dialog** | estiva-ui | 0 | none found | `A hand-written role="dialog" means a hand-made dialog. Use DialogShell. It traps focus and gives it back.` | |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |
| **hand-written ARIA role**, wider | estiva-ui | 3 | `src/Divider.tsx:33` · `:46` (`separator`) · `src/Tooltip.tsx:69` (`tooltip`) | all legitimate — these components own those roles | |
| *(see note)* | **peek** | **7** | `components/AddToOpenWorkDialog.tsx:71` (`option`) · `components/ui/ProjectTickets.tsx:22` (`progressbar`) · `components/CommandLauncher.tsx:1680` (`alert`) | `A hand-written role="option" means a hand-made listbox. Use Select.` | |
| | **ship** | **4** | `components/ui/ProgressBar.tsx:25` (`progressbar`) · `components/Composer.tsx:229` (`alert`) · `components/ui/DescriptionEditing.tsx:238` (`alert`) | same, per role | |
| **no-tabindex-on-div** | estiva-ui | 0 | none found | `tabIndex turns a box into a control. Use Button, IconButton or NavItem. They are focusable already.` | |
| | peek | **0** | none found | same | |
| | **ship** | **1** | `components/ui/DescriptionEditor.tsx:77` | same | |
| **no-overflow-class** | estiva-ui | 1 | `src/ChipInput.tsx:224` | see §5 P1 | |
| | **peek** | **2** | `components/CommandLauncher.tsx:1689` · `components/HuddleCreator.tsx:143` | `overflow-auto draws the browser's scrollbar. Use ScrollArea. It draws ours.` | |
| | **ship** | **1** | `components/ui/prose.ts:35` | same | |

Two notes on this family.

**`no-tabindex-on-div` as written is too broad.** It flags any `tabIndex` on a
non-interactive element. It should only flag `tabIndex={0}` or higher.
`tabIndex={-1}` is the correct way to make something focusable by script without
adding a Tab stop. See §10.

**I first measured `role="dialog"` only, and got 0 everywhere.** UIG-8's ticket
names `role="dialog"` / `"menu"` / `"listbox"` / `"tooltip"` / `"tab"`, so my
first count was too narrow. I went back and read every `role=` in all three
repos. There are 14. Two matter:

- **`AddToOpenWorkDialog.tsx:71` writes `<div role="option">`.** That is a
  hand-made listbox. `Select` exists.
- **`role="progressbar"` appears twice** — `peek/…/ProjectTickets.tsx:22` and
  `ship/…/ProgressBar.tsx:25`. Two apps each hand-built a progress bar, and the
  package has none. D6 lists Progress as something Base UI should own. That is a
  package gap, not just a rule violation.

The three `role="alert"` are inline error messages. `FieldLine` carries a tone
and may be the right answer; worth checking in UIG-15.

### Family C — fingerprints

Guide T12. Tickets UIG-22 to UIG-25.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **no-handmade-header** | estiva-ui | 1 → **0** | `src/DialogShell.tsx:117`, which owns the shape | `A panel header drawn by hand. Use SectionHeader.` | |
| | **peek** | 4 → **3** | `components/ConversationHeader.tsx:132` · `components/ThreadPanel.tsx:233` · `components/ThreadPanel.tsx:367` | `A panel header drawn by hand. Use ContainerHeader.` | |
| | **ship** | **0** | none found | `A panel header drawn by hand. Use SectionHeader.` | |
| **no-handmade-empty-state** | estiva-ui | 0 | none found | `A line saying there is nothing is an EmptyState. Use EmptyState. scope="section" inside a section, scope="page" for a whole page.` | |
| | **peek** | **7** | `components/CommandLauncher.tsx:1464` · `components/ReadStatePanel.tsx:65` · `components/views/FolderContentsView.tsx:101` | same | |
| | **ship** | **2** | `components/Board.tsx:61` · `components/ui/ForeignObject.tsx:206` | same | |
| **no-native-title** | estiva-ui | **0** | none found | `title= is the browser's tooltip, not ours. Use WithTooltip, or IconButton's tooltip prop.` | |
| | **peek** | **3** | `components/ui/Reference.tsx:116` · `:137` · `:166` | same | |
| | **ship** | **3** | `components/ui/Reference.tsx:87` · `:103` · `:137` | same | |
| **no-copied-class-list** | estiva-ui | 14 | `src/TextInput.tsx:26` ≈ `Textarea.tsx:24` · `src/Chip.tsx:36` ≈ `Reaction.tsx:64` | see §9.4 | |
| | **peek** | **28** | `components/CommandLauncher.tsx:1339` ≈ `DialogShell.tsx:113` · `components/ThreadPanel.tsx:233` ≈ `DialogShell.tsx:117` · `components/ui/PersonRow.tsx:84` ≈ `Skeleton.tsx:22` | `This class list is DialogShell's, re-typed. Import DialogShell from @estiva-app/ui.` | |
| | **ship** | **2** | `auth/AuthShell.tsx:42` ≈ `DialogShell.tsx:87` · `components/Sidebar.tsx:91` ≈ `NavItem.tsx:38` | same | |

The two numbers in `no-handmade-header` are before and after removing the
component that owns the shape. `DialogShell` in the package and `ContainerHeader`
in Peek are the originals, so they should not be flagged against themselves.

### Family D — the className allow-list

Guide T13. Ticket UIG-9.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **className-placement-only** | estiva-ui | **8** | `src/Banner.tsx:62` (IconButton `text-current`) · `src/DialogShell.tsx:150` (ScrollArea `border-b`) · `src/Tooltip.tsx:115` (Tooltip `transition-[…]`) | `Only placement passes through IconButton's className. "text-current" changes how it looks. Ask for a prop on IconButton instead.` | |
| | **peek** | **15** | `components/ui/ForeignObjectWidget.tsx:91` (Person `text-caption`) · `pages/FoldersPage.tsx:260` (EditableText `text-body-2-strong`) · `components/ui/ComposeBox.tsx:407` (IconButton `signal:shadow-glow-accent`) | same, with the component's own name | |
| | **ship** | **8** | `views/IssueView.tsx:120` (EditableText `text-h2`) · `components/NewProjectDialog.tsx:89` (TextInput `font-mono`) · `components/IssuesTable.tsx:47` (ScrollArea `border rounded-lg`) | same | |

**Padding is allowed. That was already decided and I missed it.**

I first reported two numbers here and asked Katerina whether padding counts as
placement. It does. UIG-9's ticket spells the allow-list out and `p-*`, `px-*`,
`py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*` are all in it. The numbers above are the
padding-allowed ones, which is the only set that matters.

For the record, the stricter reading would be estiva-ui 9, Peek 33, Ship 15. The
whole difference is padding pushed into `EmptyState`: 9 places in Peek, 6 in
Ship. That is not a rule violation, but 15 callers adding their own padding to
the same component does suggest `EmptyState` is missing a prop. Worth a look in
UIG-15.

### Already on, recorded so it is not counted twice

| rule | repo | count | note | verdict |
|---|---|---|---|---|
| colours & sizes (`lint:tokens`) | all three | 0 | Already a CI gate. In `eslint.tokens.js` since D36 (Ship) and D55 (Peek). | on, already |

---

## §4 Two rules I added

The guide's T10 names four raw elements. UIG-7's own summary says "text boxes,
dropdowns, links, dialogs". A dropdown is `<select>`, and a text box is as often
`<textarea>` as `<input>`. I measured both so the family has no hole in it.

| rule | estiva-ui | peek | ship | samples | message | verdict |
|---|---|---|---|---|---|---|
| **raw-select** | 0 | **0** | **0** | none found anywhere | `A <select> here is not ours. Use Select.` | |
| **raw-textarea** | 2 | **0** | **0** | `src/Textarea.tsx:22` · `src/EditableText.tsx:143`, both `render` props | `A <textarea> here is not ours. Use Textarea.` | |

Both are free. Zero violations in either app. The package's two are handed to a
Base UI `render` prop, which is the correct pattern. Turn them on in UIG-7 and
they can never regress.

---

## §5 The package-facing rules

UIG-5 names four rules that point inward at the package, and says UIG-1 measures
them. Measured against `estiva-ui/src`.

| | rule | count | what I found | verdict |
|---|---|---|---|---|
| **P1** | hand-rolled behaviour where Base UI has a part (D6) | **2 components, 6 sites** | `ChipInput` is the package's last hand-rolled float. It imports `./fit` (:5), listens to `window` resize and scroll itself (:143, :144), and portals by hand (:222). Base UI's Positioner and Portal do all four. `Toast.tsx:174` is the second `createPortal`. `fit.ts` now has one real caller; everything else moved to Base UI. | |
| **P2** | a component with no `.mdx` doc page | **0** | All 44 have one. There are 46 `.mdx` files. The two extra are `FieldLine` and `MenuItem`, which are exported from a sibling file. That is the false positive UIG-5 warned about, and it is real. | |
| **P3** | a component with no `.stories.tsx` | **0** | All 44 have one. Same two extras, same reason. | |
| **P4** | a raw element outside a wrapper | **9** or **4** | The package has 14 raw elements. 5 are handed to a Base UI `render` prop, which is fine. Of the other 9, **4 sit nested inside a bigger component**: `Breadcrumb.tsx:91`, `ChipInput.tsx:43`, `ChipInput.tsx:205`, `Toast.tsx:105`. The other 5 are the component's own root element: `NavItem`, `RailItem`, `Reaction`, `EditableText`, `Menu.tsx:480`. | |

P2 and P3 are at zero. That is good news, but it means neither can be the tracer:
a rule with nothing to fix proves nothing about the fix-or-escape path. Turn them
on in UIG-5 anyway. They cost nothing and they hold the line.

The package's four numbers, re-counted, all matching what UIG-5 quotes:
**44 component files, 46 doc pages, 46 story files, 45 export lines** in
`index.ts` (65 value exports across those 45 lines).

---

## §6 The escape-boundary number

The question: if we exempt no folder and require an escape marker per line, how
many markers is that?

| | peek | ship |
|---|---|---|
| raw elements (`button`, `input`, `a`, `dialog`) | 23 | 9 |
| of those, inside a pure re-export file | **0** | **0** |
| **escapes needed** | **23** | **9** |
| of those, inside `components/ui/` | 12 | 3 |
| outside it | 11 | 6 |

**Answer: yes, escapes only is workable.** 32 markers across both apps. Each one
names a real place worth a look later.

**Exempting `components/ui/` would be worse than useless.** The ticket suspected
this. The numbers confirm it.

- Peek's `components/ui` holds 83 files, 51 of them in scope. 15 are pure
  re-exports. **None of those 15 contains a raw element**, because a one-line
  re-export has no JSX in it. So the exemption catches nothing.
- What it would exempt is the 7 real components that hold the 12 raw elements:
  `FileAttachmentCard.tsx` (313 lines), `ForeignObjectWidget.tsx` (625),
  `ProjectTickets.tsx` (179), `MessageBody.tsx` (497),
  `PendingAttachmentChip.tsx` (138), `AttachFiles.tsx` (69),
  `MembersPill.tsx` (53).
- `PendingAttachmentChip` is on that list. The guide names it as the component
  nobody can find. An exempt folder would hide it from the thing built to
  surface it.
- Ship is the same shape. 52 files, 40 in scope, 28 pure re-exports with no raw
  element in any of them, and 3 raw elements sitting in 2 real components
  (`ForeignObject.tsx` 232 lines, `DescriptionEditing.tsx` 249).

*The ticket's "80 files" and "50 files" are the same folders counted a day
earlier, before excluding stories and tests.*

---

## §7 The tracer rule for UIG-5

**Use `raw-element-outside-a-wrapper` (P4), narrow definition. 4 violations.**

| candidate | count | why not |
|---|---|---|
| P1 hand-rolled behaviour | 2 components | Fixing it means moving `ChipInput` onto Base UI Combobox. That is stage 5 of the migration, far too big for a tracer. |
| P2 no doc page | 0 | Nothing to fix. |
| P3 no story | 0 | Nothing to fix. |
| `no-copied-class-list` inward | 14 | It is a similarity threshold, not a fact. A tracer has to be unarguable. |
| `className-placement-only` inward | 9 | Solid, but its definition is the thing you still have to settle. |
| **P4, narrow** | **4** | ✅ |

Why P4:

- It mirrors UIG-3's Peek rule almost exactly, so the chain gets proved with the
  same rule code. That is the point of a tracer.
- 4 is the right size. Enough to exercise fix, escape, count and reconcile.
  Small enough to finish in one ticket.
- It is mechanical. Is this element inside a `render` prop? Is it nested inside
  another element? Both are AST facts.
- The narrow definition does not flag a primitive for owning its own root
  element. The wide definition (9) would need 5 escapes on day one for code that
  is correct.

The four: `Breadcrumb.tsx:91` (`<a>`), `ChipInput.tsx:43` (`<button>`),
`ChipInput.tsx:205` (`<input>`), `Toast.tsx:105` (`<button>`).

---

## §8 Reconciliation

Every candidate rule the guide names appears in §3 exactly once.

| source | named | measured | where |
|---|---|---|---|
| Guide T10, forbid the raw element | 4 | 4 | §3 family A |
| Guide T11, forbid the reach | 6 | 6 | §3 family B |
| Guide T12, fingerprints | 4 | 4 | §3 family C |
| Guide T13, className allow-list | 1 | 1 | §3 family D |
| **guide total** | **15** | **15** | ✅ |
| Added by UIG-1 from UIG-7's wording | 2 | 2 | §4 |
| Package-facing, named by UIG-5 | 4 | 4 | §5 |
| **total against the guide** | **21** | **21** | ✅ |
| Found by UIG-1, named nowhere | — | 4 | §11 |
| **candidates in total** | | **25** | |

Two things the guide names that are deliberately not in §3:

- **Colours and sizes.** That is `lint:tokens` and it is already a CI gate.
  Recorded at the foot of §3.
- **"Every control reachable by Tab."** That is a runtime check in gate 3's route
  probe, not a lint rule. Out of scope for UIG-1.

`tabIndex` on a div appears in the guide's gate 2 prose but not in the T11 table
row. I measured it anyway. The standing rule is that a rule the guide names is in
scope even where a ticket's example list forgot it.

**Total violations across the 17 app-facing rules: 200.** That is 198 from the
guide's 15 rules, plus 2 from `raw-textarea`. `raw-select` is 0 everywhere. The
four package-facing rules re-measure the same estiva-ui source from a different
angle, so they add nothing to that total.

That 200 is source files only. §10 counts the stories and tests the ticket's file
set leaves out.

---

## §9 Five things I found that the ticket did not ask for

### ⛔ 1. We cannot turn on the link rule. We have no Link component.

14 raw `<a>` across Peek and Ship. There is no Link component in the package, in
Peek, or in Ship. I checked all three.

`NavItem`, `RailItem` and `Breadcrumb` each take an `href`, but none of them fits
what these 14 do. They are three different jobs:

- **A whole card or row made clickable.** Ship's `Board.tsx:24`,
  `IssueRow.tsx:66`, `IssuesTable.tsx:84`, `ProjectCard.tsx:55`.
- **An external link inside prose.** Peek's `MessageBody.tsx:51` (`BodyLink`).
- **A small inline link.** Peek's `ThreadReplyCard.tsx:500`.

An error message that cannot name a component is a rule people switch off. So
`raw-anchor` waits until the package has a link component. That is a UIG-7
dependency nobody had written down.

There is a second trap here. Ship's `<a>` elements spread `{...linkTo(href)}`,
the wrapper from SHI-20 that stops every click reloading the whole app. Whatever
replaces them has to carry that, or the navigation bug comes straight back.

### ⚠️ 2. The guide names the wrong Base UI package.

The guide says `@base-ui-components/*`. The installed package is
`@base-ui/react`. A rule written from the guide's spelling would match nothing
and pass, silently.

Against the real name: **22 imports in estiva-ui**, which is correct because that
is the package's job, and **0 in either app**. So the rule is free to turn on and
can never regress.

Fix the guide when UIG-2 commits it.

### 🚧 3. `CommandLauncher.tsx` is where the rules will actually hurt.

One file holds 4 of Peek's 12 raw `<button>`, 1 of its 4 raw `<input>`, 1 of its
2 `createPortal`, 1 of its 2 `overflow-auto`, 1 of its 7 hand-made empty states,
and 5 of its 28 copied class lists.

Its copied class lists match `DialogShell`, `ChipInput` and `SearchInput`. In
plain terms: it has hand-built a dialog, chips and a search box that the package
already has.

It is 1,655 lines. It needs its own ticket, whatever the verdicts are. Do not let
it hold up turning the rules on everywhere else.

### 4. The package copies its own class lists.

All 14 of estiva-ui's `no-copied-class-list` hits are the package copying itself.
`TextInput.tsx:26` and `Textarea.tsx:24` share 7 classes out of 7. Also
`Chip.tsx:36` ≈ `Reaction.tsx:64`, `IconButton.tsx:63` ≈ `RailItem.tsx:35`,
`SearchInput.tsx:34` ≈ `Select.tsx:144`, `SectionHeader.tsx:96` ≈
`Skeleton.tsx:22`.

This is a different problem from an app re-typing a component. These are sibling
primitives that should share a constant. UIG-25 is not aimed at it. Noting it so
it does not get lost.

### ⚠️ 5. "Peek has 5 pages and 0 page stories" is out of date.

The guide says it twice, and T17 is costed on it.

Peek has 5 pages and **3** page stories. `stories/layouts/Pages.stories.tsx` runs
Desk, Topics and People through a `PeekApp` harness on seed data.

The gap is still real, just smaller and more specific:

- **`FoldersPage` has no story.** Neither does `ObjectPage`. Folders is the page
  all eight defects were on.
- **No page has an empty or loading state.** The file says so itself: "Empty /
  first-login states arrive with the Convex data layer."

So T17 still stands. It is "2 of 5 pages missing, and only the happy path", not
zero. Fix the guide alongside finding 2.

---

## §10 Stories and tests

**You asked why I excluded `*.stories.tsx` and `*.test.tsx`.**

Because UIG-1's Scope line said to. Nothing in the guide asks for it. That was my
wording when I wrote the ticket, and I think it was wrong.

### What the guide says a story is

| where | what it says |
|---|---|
| T9 | "Storybook as the doc surface. Every registry row links to a live story. One place to look, not three ports." |
| Gate 0 | Every registry entry carries "a link to its live story". |
| Gate 0, *Catches* | "A component with no story and no explanation." |
| Gate 3 | "Every story shot in both themes", diffed, and you accept or reject each canvas. |

So a story is the documentation, it is where gate 1 sends people, and it is what
gate 3 photographs for your review. Exempting it means the surface we built to
teach people is the one surface allowed to get it wrong.

### The count

Same 17 rules, split by what kind of file the violation is in.

| repo | source files | story files | test files |
|---|---|---|---|
| estiva-ui | 48 | 46 | 30 |
| peek | 205 | 59 | 91 |
| ship | 114 | 20 | 50 |

*Source + tests is the 51 / 254 / 130 in §2. The ticket excludes `*.test.tsx` but
not `*.test.ts`, so 3 / 49 / 16 test files were counted as source there.*

| rule | estiva-ui *src/story/test* | peek | ship |
|---|---|---|---|
| raw-button | 8 / **1** / 31 | 12 / **7** / 1 | 0 / 0 / 0 |
| raw-input | 1 / 0 / 1 | 4 / 0 / 0 | 2 / 0 / 0 |
| raw-anchor | 3 / 0 / 2 | 7 / 0 / 0 | 7 / 0 / 0 |
| raw-textarea | 2 / 0 / 0 | 0 / **1** / 0 | 0 / 0 / 0 |
| no-base-ui-import | 22 / 0 / 1 | 0 / 0 / 0 | 0 / 0 / 0 |
| no-tabindex-on-div | 0 / **1** / 0 | 0 / 0 / 0 | 1 / 0 / 0 |
| no-overflow-class | 1 / 0 / 1 | 2 / **1** / 0 | 1 / 0 / 0 |
| no-handmade-empty-state | 0 / **1** / 0 | 7 / 0 / 0 | 2 / 0 / 0 |
| no-native-title | 0 / 0 / 0 | 3 / **3** / 0 | 3 / 0 / 0 |
| no-copied-class-list | 14 / **2** / 0 | 28 / **1** / 0 | 2 / 0 / 0 |
| **className-placement-only** | 9 / **19** / 0 | 33 / 0 / 0 | 15 / **1** / 0 |
| **total, all 17 rules** | 63 / **24** / 36 | 104 / **13** / 1 | 33 / **1** / 0 |

*Rules with nothing in any column are left out of this table.*

**200 in source. 38 in stories. 37 in tests.**

### The finding

**estiva-ui's stories break the className rule 19 times. Its source breaks it 9
times.** The package's documentation is twice as bad as the package.

Three examples:

**`Person.stories.tsx:34-37`** is the *Sizes* story. It shows four Persons, and
changes the type size on each one with `className="text-caption"`,
`text-body-2`, `text-body-1`. That is the doc page teaching people to do the
thing the rule forbids. `Property.stories.tsx:31` and `:45` go further and push
raw `text-[12px] leading-[120%]` through.

**`ScrollArea.stories.tsx`** passes `rounded-lg border border-border-default
bg-bg-surface` into `ScrollArea` in six stories. Ship's `IssuesTable.tsx:47` does
the same thing in the app. The story taught it and the app copied it.

**`ReactionPicker.stories.tsx:100`** writes "Nothing here yet." by hand instead
of using `EmptyState`.

### Tests look different

31 of estiva-ui's 36 test violations are one rule in one place: raw `<button>` in
`Button.compose.test.tsx` and its neighbours, mounting bare elements to check
that composition works.

That is a test doing its job. Tests are not documentation and nobody copies them.

### What I recommend

| | |
|---|---|
| ✅ | **Stories in.** 38 violations across all three repos. A day's work. |
| ❌ | **Tests out.** 37 violations, 31 of them a test legitimately mounting a raw element. Exclude `*.test.tsx` and `*.test.ts`. |

Three of the story violations should get an escape marker rather than a fix. They
are good arguments for having the escape hatch at all:

- **`Checkbox.stories.tsx:43`** wraps a `Checkbox` in a raw `<button>`. That is
  your own "the row is the control" ruling.
- **`Popover.stories.tsx:169`** puts `tabIndex={-1}` on a `<p>`, with a written
  reason and "measured" next to it. This one also tells us the rule is too broad.
  `tabIndex={-1}` is the correct way to make something focusable by script.
  Only `tabIndex={0}` or higher adds a Tab stop. UIG-8 should flag those.
- **`peek/src/stories/SignalTheme.stories.tsx`** has 6 raw `<button>`, a
  `<textarea>` and 3 native `title=`. It is a Storybook-only theme preview with
  its own `<style>` block and `sig-*` CSS. It is deliberately not built from our
  components, and it already carries a file-level `eslint-disable` for the token
  lint for the same reason. Give it one file-level escape. Not a folder
  exemption, for the reason in §6.

⚠️ **If you say yes**, UIG-1's Scope line becomes "excluding `*.test.ts` and
`*.test.tsx`", and UIG-3's Peek count goes from **12 to 19**.

---

## §11 Four more candidates the guide does not name

**Katerina asked whether this is really the full rule set. It is not.**

§3 covers everything the guide's gate 2 names, and §8 proves that. But the guide
wrote gate 2 as four families of examples, not as a finished specification. Here
are four more candidates I found while counting. All four are measured. None of
them has a verdict yet.

### ⚠️ G1. Arbitrary values walk straight through the token gate

This is the important one.

`lint:tokens` has been a CI gate since D36 and D55. It blocks `text-sm`, blocks
Tailwind's palette, and blocks a raw colour inside an arbitrary value.

**It does not block `text-[14px]`.**

I proved it rather than assuming it. `npx eslint --config eslint.tokens.config.js
src/components/CommandLauncher.tsx` exits 0. Line 891 of that file is:

```
<div className="text-[14px] font-normal leading-[1.4] text-text-primary truncate">
```

So the type ramp can be written by hand, today, and the gate we already trust
says nothing.

Counted across source files, arbitrary values that are not colours and that sit
on a type or spacing prefix:

| repo | all arbitrary values | of those, type or spacing |
|---|---|---|
| estiva-ui | 75 | **33** |
| peek | 290 | **157** |
| ship | 21 | **12** |

Peek's 157 is the number that matters. `CommandLauncher.tsx` alone writes
`text-[14px] leading-[1.4]`, `text-[12px] leading-[1.2]`, `text-[13px]`. That is
the ramp, re-typed.

The package does it too: `Breadcrumb.tsx:72` and `Kbd.tsx:33` both carry
`text-[14px] leading-[140%]`.

**My recommendation: this belongs in UIG-9, and it is worth more than most of
§3.** A rule that blocks `text-sm` but allows `text-[14px]` is not a gate, it is
a speed bump. Proposed message:

`text-[14px] is the type ramp written by hand. Use text-body-2. If no token
fits, add one to tokens.css.`

Spacing and size arbitraries (`h-[240px]`, `gap-[3px]`) are a weaker case and
probably want *warn*, not *on*. A one-off panel height is a real thing.

### G2. Inline `style={{ }}`

Not named by the guide. It is the same reach as a hand-written class, and it is
invisible to every class rule we have, including `lint:tokens`.

| repo | source | stories |
|---|---|---|
| estiva-ui | 7 | 0 |
| peek | 20 | 43 |
| ship | 6 | 0 |

Most of them are legitimate: a width computed from a prop (`Avatar.tsx:81`,
`ProgressBar.tsx:32`, `Sidebar.tsx:92`). Those cannot be a class and should not
be.

The ones worth catching are the colours: `HighlightsCard.tsx:169` and
`HighlightPill.tsx:20` and `:33` set `backgroundColor` inline, which is outside
the token system completely.

**Recommendation: narrow rule, not a broad one.** Flag inline `style` only when
it sets a colour, a font size, or a border. Let computed geometry through.

### G3. The same component name in more than one repo

The guide's T3 wants a near-duplicate scan. I ran the cheapest version of it:
which component names are defined in more than one repo.

**17 names.** But most are not what you would think, and this is why T3 needs
care before it becomes a rule.

**Legitimate wrappers, 10 of them.** Peek's `Avatar`, `EmptyState`, `Person`,
`Reaction`, `SearchInput`, `AvatarGroup` are thin files that import the package's
component and add data to it. `peek/src/components/ui/Avatar.tsx` is 20 lines and
its whole job is to feed `useAvatarSrc` into the package's `Avatar`. That is the
right pattern, not a duplicate.

**Real duplicates, 5.** `ColorGrid`, `RadiusGrid`, `SemanticGrid`, `ShadowGrid`,
`TypeRamp` exist in both `peek/src/stories/Swatches.tsx` and
`ship/web/src/stories/Swatches.tsx`. The same swatch page, copied.

**One that matters, 1.** `Reference` is hand-built in both Peek and Ship. Both
copies carry the same three native `title=` attributes I flagged in §3 family C.
**The same bug, twice, because the component was copied instead of shared.** That
is a candidate to promote into the package, and it belongs on UIG-17 and UIG-18's
promote lists.

**Recommendation: T3 needs a wrapper carve-out** or it reports 17 things where 6
are real. A file that imports the same-named component from `@estiva-app/ui` is a
wrapper, not a duplicate.

### G4. The docs contract is already met

The guide's T2 says a component page without *When*, *When not* and *How* should
fail CI.

I checked all 46 `.mdx` pages in the package.

| section | missing from |
|---|---|
| When | **0** |
| When not | **0** |
| How | **0** |
| Props | 1 — `Skeleton.mdx` |

So T2 is free to switch on, same as `raw-select` and `raw-textarea`. It costs
nothing today and it stops the next component shipping without a rule.

Whether `Props` joins the required set is a small call. `Skeleton` exports three
things and has no props of its own, so it may be correct as it is.

### Where this leaves the rule set

| | |
|---|---|
| §3 | 15 rules, from the guide. Complete against the guide. |
| §4 | 2 rules I added from UIG-7's own wording. |
| §5 | 4 package-facing rules, from UIG-5. |
| **§11** | **4 more that nobody had written down.** |
| **total** | **25 candidates** |

I do not think §11 is the last of them. A lint rule set for a design system is
something you grow for a year. What §3 to §5 gives you is the set the guide
committed to, and §11 is what one careful pass over the code turned up on top of
it. If you want, the honest next step is to run the same exercise once more after
UIG-3 proves the chain, when we know what a rule costs to add.

---

## §12 What UIG-1 did not do, and an ordering question

Katerina expected UIG-1 to read every component and write the rule for each one.
It did not, and the reason is a naming problem in our own documents.

**"Rules" means two different things in this project.**

| | |
|---|---|
| **Lint rules** | A machine blocks bad code. "No raw `<button>`." This is UIG-1, §3 to §11. |
| **Usage rules** | A written page per component. What it is for, when to use it, when not to. This is UIG-12 to UIG-19. |

Nothing separates those two words anywhere in the guide, the backlog or the
tickets. They should be named differently from here on.

### estiva-ui already has its usage rules

All 44 components have an `.mdx` page with *When*, *When not*, *How* and a story.
I checked all 46 pages (§11 G4).

They are good. `Popover.mdx` under *When not* sends you to `Menu` for a list of
actions, `Select` for one value from a set, `WithTooltip` for a word about a
control, and says why each. That is the standard the rest should match.

### The gap is Peek and Ship

| repo | exported components | doc pages | real files with no story |
|---|---|---|---|
| estiva-ui | 63 | **46** | 0 |
| peek | 113 | **0** | 37 |
| ship | 55 | **0** | 25 |
| **total** | **231** | **46** | **62** |

Peek and Ship have four `.mdx` files between them: `Introduction` and
`DesignTokens`, twice. **No component page in either app.**

So the usage-rule work is **168 components across Peek and Ship**. That is
UIG-17 and UIG-18, and they are the two biggest tickets in the project.

*(190 real component files hold those 231 exports. Peek has 16 pure re-export
files and Ship has 31, which is why the file counts and the component counts
differ.)*

### ⚠️ The ordering question

The guide calls gate 0 plus gate 1 — the catalogue and the usage rules — "the
single biggest lever on the problem you described."

Our ticket order puts the lint wall in phase 1, Leaf in phase 2, and the
catalogue and usage rules in phase 3.

The guide's own verdict on building the wall alone: *"it refuses the wrong thing
without teaching the right one."*

**UIG-1 produced evidence for that.** §9.1 found a rule I cannot write.
`raw-anchor` has 14 violations and no error message, because no Link component
exists to name. The rule is blocked by missing "know" work.

That will happen again. Every lint message has to name a component. Deciding
which component to name *is* the usage-rule work. Doing the wall first means
writing messages before we have decided what they should say.

**My recommendation: bring the estiva-ui half of gate 0 forward.** UIG-12 (the
registry) and UIG-14 to UIG-16 (estiva-ui's usage rules) are cheap, because the
package's 44 pages already exist — those tickets are mostly reconciling what is
written with what the code does. Doing them before UIG-3 means every lint message
in phase 1 can point at a decided answer.

UIG-17 and UIG-18, the 168 app components, are the expensive half and can stay in
phase 3.

**Not decided. Katerina's call.**

---

## §13 Does every finding here actually get fixed?

Katerina asked. I checked each one against the ticket text rather than assuming.

**Mostly yes. Six things had no ticket at all. They all have one now** — see the
tables below, closed 13 September.

The tickets are written better than I had assumed. UIG-7, UIG-8, UIG-9 and UIG-25
all define their target set by reading the code, not by a list, and each says the
examples are not the scope. So most findings here land somewhere by construction.

### Findings that have a home

| finding | lands in | why it is safe |
|---|---|---|
| raw button / input / dialog counts | UIG-3, UIG-4, UIG-7 | UIG-7 derives the element list from the package's exports, so `<select>` and `<textarea>` (§4) are in without being named. |
| forbid-the-reach counts | UIG-8 | Its target set is "every behaviour the package owns", enumerated from Base UI imports. Wider than my list. |
| the wider `role=` finds | UIG-8 | It already names `menu`, `listbox`, `tooltip`, `tab`. |
| className allow-list | UIG-9 | Target set is import analysis over both apps. |
| copied class lists in the apps | UIG-25 | Reads the registry, covers all 233 components. |
| hand-made header, empty state, native tooltip | UIG-22, UIG-23, UIG-24 | One ticket each. |
| the docs contract (§11 G4) | UIG-19 | Locks it in CI. |
| `Reference` duplicated in both apps (§11 G3) | UIG-17, UIG-18 | Both produce a promote list. |
| escape-boundary numbers | UIG-3, UIG-7 | Feeds the escape design. |
| the tracer recommendation | UIG-5 | Its ticket says UIG-1 names it. |

### ✅ The six with no ticket — closed, 13 September

Katerina said to create them before phase 1 starts. Three became new tickets.
Three were folded into tickets that already existed, because the work belonged
inside them.

| # | finding | where it lives now |
|---|---|---|
| **1** | No Link component. 14 raw `<a>`. | **UIG-27** (new). Also **UIG-7** now waits on it, and its acceptance says all 14 anchors are replaced or escaped — **not** recorded as "allowed". |
| **2** | `CommandLauncher.tsx`, 1,655 lines. | **UIG-29** (new). Runs alongside phase 1 and is explicitly told never to block it. |
| **3** | Arbitrary values outside a package component. Peek 157. | **UIG-28** (new). |
| **4** | Inline `style` that sets a colour. | **UIG-28** (new), same ticket. |
| **5** | estiva-ui copying its own class lists. 14. | **UIG-25**, target set widened to include `estiva-ui/src`, with a second message for a primitive copying a sibling. |
| **6** | "Rules" means two things. | **UIG-2**, item 5c. A wording pass over the guide, the Ship brief and every ambiguous ticket. |

The two smaller ones went with them: **ProgressBar** and **EmptyState's padding
prop** are both in UIG-27, and UIG-8 now waits on UIG-27 for the
`role="progressbar"` branch.

### ✅ The three that were only recorded here — now in their tickets

| finding | added to |
|---|---|
| `tabIndex={-1}` must pass; only `0` and up is a violation | **UIG-8** |
| P2 (no doc page) and P3 (no story) are free at zero — switch them on | **UIG-5** |
| The near-duplicate scan needs a wrapper carve-out, or it reports 17 where 6 are real | **UIG-25** |

### ✅ Four errors found inside the tickets themselves, corrected

Reading the ticket text to answer this question turned up four mistakes that had
nothing to do with UIG-1's count.

| | |
|---|---|
| **UIG-2** | Its acceptance said the committed guide must be "identical in substance to the artifact", which would have **forced it to commit the two errors §9.2 and §9.5 found**. Rewritten: identical *except* the corrections, each listed with its evidence. |
| **UIG-8** | Said "UIG-11's registry". The registry is **UIG-12**. UIG-11 is the Leaf repo. |
| **UIG-5** | Same wrong reference, same fix. |
| **UIG-5** | Said the package's four numbers "do not agree". They do. 44 `.tsx`, 46 `.mdx`, 46 stories, 45 export lines — the two extra are `FieldLine` and `MenuItem`, exported from a sibling file. Corrected. |

### What is still true

Nothing in this document is now waiting on a ticket that does not exist.

Three things still wait on **Katerina**, and they are in §0: the verdict column,
stories in or out, and the ordering question in §12.

---

*UIG-1, 13 September 2026. Measured at estiva-ui `93048cd` (0.12.6), peek
`d094006`, ship `e85de7f`. All three on main, all three clean.*
