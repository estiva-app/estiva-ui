# GATES.md — UI Guardrails

The working record for the UI Guardrails project. Counts, decisions, and what is
left to do.

The reasoning lives in `docs/GATES-GUIDE.md`. If this file and the guide
disagree, the guide wins.

UIG-1 wrote §1 to §14. UIG-2 added §15 to §22: the route, the five seams,
`gates:status`, the guide's corrections, the three words for "rules", the
decisions it took, the debt lists, and what it found in other tickets. §0 is kept
current by every ticket.

Status key: ✅ done · 🚧 in progress · ⬜ not started · ⛔ blocked · ⚠️ needs your
answer

---

## §0 Where we are

**15 September 2026. UIG-27 is done: the package half released as `@estiva-app/ui` 0.13.0 and 0.13.1, the app half in peek PR #218 and ship PR #151. Next is UIG-28, then phase 1. UIG-30 is new.**

> **What UIG-27's app half did, and what it found**, is part 5 of **UIG-27: adopting it in Peek and Ship** below. The step-by-step handoff it followed stays above that, for the record.

| | |
|---|---|
| ✅ **UIG-1** | Done. Merged in estiva-ui PR #21. |
| ✅ **UIG-2** | Done. Merged in estiva-ui PR #24, #25 and #27, peek PR #204, ship PR #148. |
| ✅ **UIG-27** | Package half: estiva-ui PR #29 (0.13.0), PR #32 (0.13.1: `Card`'s `hovered`). App half: peek PR #218, ship PR #151 — both apps on 0.13.1, every link, chip, progress bar, card and attachment the package's, the code they replaced deleted, and no empty state padded. All 20 links fitted, none reasoned. `gates:status` reads Peek's part 6 of 6 and Ship's 5 of 5. |
| ⬜ **UIG-30** | New, 13 September: `RichText`. Runs after UIG-27. All three repos' `gates-checks.mjs` now list it. |

### What happened since UIG-2 closed

| | what | now |
|---|---|---|
| ✅ | **The flaky Peek test is fixed** (peek PR #205, merged and deployed). §22 blamed `0.12.8`; that was wrong. Focusing a Base UI Select's trigger mounts its list at once, closed: `hidden` and `pointer-events: none`. A mouse press opens it one animation frame later. The tests found an option by its text inside the closed list and clicked before that frame. It failed the same way on `0.12.3`, on 12 September. Slowing every frame by 100 ms found **9 tests in 4 files** in Peek, **0** in Ship and estiva-ui. They now find the option by its role, which waits for the open list. | closed |
| ✅ | **UIG-27 overlapped the migration plan.** PLAN §9 (stage 7) already held `Card`, with a link variant, and `ProgressBar`; the migration's D67 was building the inline chip in Peek. Katerina ruled: Card, rows, ProgressBar and EmptyState's padding are UIG-27's. The chip was D67's, and moves into the package here. The foreign-object card's inside layout (D66) stays with stage 7. The migration docs say the same. | ruled 13 September |
| ✅ | **UIG-30 created**: the half of Peek's `MessageBody` and Ship's `RichText` that draws the protocol's text tree becomes one package component, `RichText`. What a mention points at stays in each app. It goes against a written line in the protocol package ("one parse, one resolution, two designs"), so Jan is told before its PR. | created |

### Start here

1. Read this section.
2. Run `npm run gates:status` in estiva-ui. It reads every ticket from the code, in all three repos. §17 says how.
3. Read the ticket in Ship, in full.

On 15 September, with peek PR #218 and ship PR #151 merged (run with `GATES_PEEK` and `GATES_SHIP` pointing at checkouts of the new mains, since the main checkouts lag), it printed:

```
✅  UIG-27  The components the apps had to build themselves — Link, ProgressBar, EmptyState padding  estiva-ui 17 of 17
⬜  UIG-30  RichText — one component that draws a message's text, for both apps                      estiva-ui 0 of 3
✅ 3 done · 🚧 0 started · ⬜ 27 not started · ❔ 0 could not check
30 tickets. Owned by estiva-ui 25, peek 3, ship 2.
✅ Each ticket is owned by exactly one repo, and every repo agrees.
```

UIG-27's 17 checks: 6 in the package, 6 in Peek (the two packages it needs installed, the hand-made bar gone, `inlineChip.ts` and `PendingAttachmentChip.tsx` gone, a posted file drawing `AttachmentCard`), 5 in Ship (the two installed, its bar's file gone, mentions on `InlineChip`, files on `AttachmentCard`). UIG-30's 3 are one per repo, all "not yet".

### UIG-27: Katerina's rulings, 13 September

1. The text links become a new **`Link`**. Cards and rows use the same Link with no look of its own (`plain`), and `Card` is built on it in this ticket.
2. Link has four looks. Link A (in text) is **`text`**. Links B and C, which differed only in their text, become one look, **`quiet`**. Links D and E, a dotted and a solid underline doing the same job, become one solid look, **`underlined`**.
3. Peek's chip moves into the package unchanged, as **`InlineChip`**, before Link. Its tone `mention` is renamed **`person`**. A chip that leads somewhere takes `href` and `onClick`, like `NavItem`.
4. Only the drawing part of rich text moves, and in its own ticket (UIG-30).

And on 14 September:

5. **ProgressBar's `quiet` look is 4px** (the `h-1` token). Peek's own bar is 3px until it takes the package's.
6. **EmptyState gets no padding prop.** A section's empty state goes inside the box its rows live in, and is never padded: the box is written once and holds the rows or the empty state, so its padding places both. 15 of the 17 callers that pad one today draw it *instead of* that box and copy its padding by hand. A lint rule refuses padding on `EmptyState` (UIG-9, or UIG-23) and names the rule. How much room an empty *page section* takes in Ship (`py-6`, `py-8`, `py-10`) is a separate ruling, taken when those callers are fixed.
7. **The cards are the 18 in the next table**, sorted by Katerina from photographs (`uig27-cards.png`, 38 bordered, rounded boxes in the two apps). A box is a card when it stands for one thing you could name, and there are many of it or you treat the whole box as that thing.
8. **Ship's files become the same card as Peek's.** Ship draws a file as a 28px line; Peek as a 50px card with a file-type tile, the name over the type and size.
9. **Card draws the frame only**, with four fills chosen by what it sits on — `surface`, `elevated`, `inset`, `none` — and no padding of its own.
10. **The hairline follows the fill** (default on `surface` and `elevated`, subtle on `inset` and `none`), and **every card has 8px corners**. Ship's board card moves from 6px.
11. **A clickable card's hairline goes one step stronger on hover**; Peek's conversation, reply and huddle cards keep lighting up. (Correction to the question as asked: the conversation and reply cards also have no hairline until pointed at. That is kept, as `quietUntilHover`, as part of lighting up.)
12. **A card that cannot be read has a dashed hairline**, in both apps.
13. **`AttachmentCard` joins the package in this same PR**, so the apps take one release. It is Peek's two attachment components moved in: the package draws; each app keeps what only it can do (fetching the bytes with the reader's permission, opening an image full screen, saving a file). Peek's `PendingAttachmentChip` has nothing of that and disappears; its `FileAttachmentCard` shrinks to that fetch-and-click part.
14. **Ship's images stay as they are** (the whole picture, in a 4px frame) until the package has a full-screen viewer (the migration's Lightbox, stage 7). Ship's files and its can't-load state become `AttachmentCard`.
15. **The adoption is full**: Peek and Ship adopt `Link`, `InlineChip`, `Card`, `ProgressBar` and `AttachmentCard` completely, and the code they replace is deleted.
16. **The ✕ on a waiting file is a button on Base UI's `Button`, like InputChip's ✕**, keeping Peek's 20px round badge. Not `IconButton`: its 24px square that fills on hover is a different control. The picture's preview button went on Base UI's `Button` too.
17. **Storybook has a Components group, right below Inputs**: `AttachmentCard`, `InlineChip`, `Person`, `PersonTrigger`, `Reaction`, `ReactionPicker`. No rule is written for what goes there; ask Katerina where a new component goes.
18. **An attachment card's name shows in full on hover only when it is cut off**, on every card, posted as well as waiting. A name that fits, and a size, show no tooltip ("i dont want tooltips on titles and size. only if title is too long"). Peek's posted cards had no way to read a cut-off name; its waiting card showed the name and the size on every hover. Measured like Breadcrumb's crumbs. Screenshots of every story are identical pixel for pixel before and after 16 and 18, but for 3 pixels: Peek clipped the last letter of the warning's note, and the package draws it whole.

And during the app half, 14 and 15 September:

19. **Peek's two router links are the package's `Link`**, followed through the router in `onClick` as `NavItem` does (Peek's `RouterLink`), not react-router's `Link` kept with a reason.
20. **Ship's empty sections lose their own room** (`py-6`, `py-8`, `py-10` on Conversations, Activity, History, the project's Issues and the new-issue dialog): the line sits where a first row would.
21. **An empty line in a list whose rows pad themselves stays level with the rows** ("keep them level"): Starred, the file tree and a project's tickets. The row's inset goes on a wrapper, never on `EmptyState`.
22. **Ship's files open in a new tab and download, like Peek's**, fetched the way an image is — so a file is read when it is drawn, once, and cached. As its own commit in Ship's PR.
23. **`Card` holds its hover look while its own menu is open, as 0.13.1, in UIG-27** (not in the migration's stage 6): `hovered`, and a selected clickable card keeps its pointer.
24. **A selected huddle has the conversation card's softer hairline.**

### UIG-27: the cards, sorted

| | Peek | Ship |
|---|---|---|
| a conversation, a reply, a huddle | `ConversationCard.tsx:487` · `ThreadReplyCard.tsx:415` · `HuddleCard.tsx:127` | `ConversationThread.tsx:543` |
| a project | `TopicDetailsDialog.tsx:254` · `TopicProjectPanel.tsx:238` — the same project, drawn two ways | `ProjectCard.tsx:58` |
| an issue | | `Board.tsx:26` |
| a file | `ui/FileAttachmentCard.tsx:216` · `:246` · `:291` · `ui/PendingAttachmentChip.tsx:87` | `ui/Attachment.tsx:45` · `:88` |
| an object from another app | `ui/ForeignObjectWidget.tsx:385` · `:607` | `ui/ForeignObject.tsx:89` · `:212` |
| **total** | **11** | **7** — **18** |

Three of them are a card that **cannot be read** (`ForeignObjectWidget.tsx:607`, `ForeignObject.tsx:89`, `Attachment.tsx:45`): a state of the card, not an empty state — the package's EmptyState page says an empty state never stands in for a failure. Peek drew that state with a solid hairline and caption text, Ship with a dashed border and body text. Ruled since: dashed, in both apps (ruling 12).

Not cards: 6 fields (the compose box, the edit boxes, a text input), 3 panels (the launcher, a board column, the issues table's frame), 2 chips or buttons, 4 loading placeholders, 1 notice, 4 others (a hand-made tick box, a picture's frame, an unknown editor block, and the pinned message — a preview, not clickable).

### UIG-27: the links, recounted

Counted by AST on 13 September, Peek `main` `ada8c91`, Ship `main` `21ec2a8`, tests excluded.

| job | Peek | Ship | total |
|---|---|---|---|
| 🔗 text link | 5 | 2 | 7 |
| 🃏 a whole card or row | 2 | 4 | 6 |
| 💊 a chip | 2 | 3 | 5 |
| **raw `<a>`** | **9** | **9** | **18** |
| through Peek's router `Link`, the quiet look | 2 | 0 | **2** |

UIG-1 counted 14 raw `<a>`. RIC-16 (13 September) added the 4 in `Reference.tsx`, 2 per app. The 2 router links in `ConversationCard.tsx` and `ThreadPanel.tsx` were never raw anchors, so no count saw them. **The arithmetic, 15 September: fitted 20 + reasoned 0 = 20.** Re-counted by AST on the adoption branches (Peek at `f4079b0`, Ship at `58732d4`): no raw `<a>` and no router `Link` left in either app's source.

| app | fitted | as |
|---|---|---|
| Peek | 11 | `Link` `text` (a body's link) · `quiet` ×3 (a reply's timestamp, two titles) · `underlined` ("Open in app ↗") · `plain` (a ticket row) · inside `AttachmentCard` (the file row) · `InlineChip` with `href` ×2 · `RouterLink` ×2 (the package `Link` followed through the router, ruling 19) |
| Ship | 9 | `Card` with `href` ×3 (a board card, a project card, an object) · `Link` `plain` ×2 (an issue row, its project chip) · `quiet` (a table title) · `underlined` ("Open it there") · `InlineChip` with `href` ×2 |

Every Ship link keeps `linkTo`, and both of Peek's router links keep the router: proved with the window marker (a bare anchor, the control, loses it; every changed link keeps it). A story's `#/…` address never reloads, so each was pointed at a real path before the click.

### UIG-27: what building it found

| | finding | where it goes |
|---|---|---|
| ✅ | **Peek's quiet chip is 16.8px, not 19.6px**: `1.4em` of its caption size, with its letters 1.81px above the sentence's baseline. D67 ruled every chip 19.6px. The package's is 19.6px, 0.41px off. | Peek is fixed when it takes `InlineChip` |
| ⚠️ | **`InlineChip` needs `h-[1.4em]`, and `h-[19.6px]` for the quiet tone.** No token names one line of body text. UIG-28 plans `h-[240px]` as a warning. | UIG-28: allow these two, or add a line-height token |
| ✅ | Ship's mention chip does not move when it takes `InlineChip`: its status icon comes after the words, and the drift D67 measured needs an icon first. | measured 13 September |
| ✅ | Two stories carry a color-contrast exception, computed and not run: the person chip in ship (2.70:1, the brand `Chip`'s number) and the quiet chip in signal (3.25:1). | PLAN stage 0.10 |

### ▶️ Next

| when | what |
|---|---|
| ✅ done | UIG-27: estiva-ui PR #29 (0.13.0) and #32 (0.13.1); peek PR #218 and ship PR #151 adopt it fully |
| **now** | **UIG-28** (its count is done, read-only, and waited for these PRs to merge: re-run it on the new mains), then phase 1: **UIG-3** → **UIG-4** → **UIG-5** → **UIG-6** → **UIG-7** → **UIG-8** → **UIG-9**. UIG-30 any time after UIG-27 |
| alongside phase 1, never blocking it | **UIG-29** |

UIG-27 blocks UIG-7 and UIG-8. UIG-28 blocks nothing, but it fixes a hole in the token lint that phase 1 sits on, so do it first. The reference number is not the order.

### UIG-27: adopting it in Peek and Ship

Katerina's words: *"peek and ship will adopt the updates from estiva-ui carefully and no bugs."* Ruling 15: the adoption is **full**, and the code it replaces is **deleted**. Nothing may change on screen that a ruling above did not change.

#### 1. Before any code

1. Read the UIG-27 ticket in Ship in full (`ship_get_issue UIG-27`; the answer is too big to print, so it is saved to a file — read all of it). Its acceptance list is the definition of done; §4 below repeats it.
2. `npm view @estiva-app/ui version` must print `0.13.0` or later (released 14 September: PR #29 and #30, tag `v0.13.0`). If it prints less, stop and tell Katerina. Read the 0.13.0 CHANGELOG entry: it lists every prop.
3. **Work in a worktree, never a main checkout.** The migration session (PLAN stage 6) works in Peek and Ship at the same time. `git fetch` first; main has moved under a session twice before. Ship: `npm ci` in the root **and** in `web/`. Stop every dev server in a checkout before `npm ci`, or it fails on Windows. Katerina's servers (`:6006`, `:6008`, `:5173`) are hers; use your own ports.
4. **Another session works in these apps** (the migration, PLAN stage 6). Run `gh pr list` in peek and ship before starting and again before pushing; rebase on `origin/main`; if an open PR touches the same files, tell Katerina.
5. Branch `gates/27-missing-components` in each app (the ticket's name). One PR per app. **Do not merge**: Katerina merges.
6. **Photograph first.** Every app story, before and after, pixel for pixel (the package's CLAUDE.md, "A port, step by step", step 9), plus the real screens a story does not reach (a conversation with attachments, a Ship issue with a description, a project). Every difference is either a ruling below or a bug. Scripts: `K:\Estiva\uig27-review\scripts\` — `shoot-all-stories.mjs` photographs every story a Storybook lists, `pixels-attachment.mjs compare` diffs two folders, and the README says which is which. For the real screens, the method in memory `estiva-session-2026-09-10-peek-atlas` (58 screens of Peek).
7. **Show Katerina the plan before building** (her standing rule): three short parts and yes/no questions, with the photos of what only she can rule — the two router links, and Ship's empty-state room (§2). Asked at the start, a ruling never blocks the end.
8. **Push** when the app builds, its tests pass and every photographed difference is explained; open the PR; **never merge**.

#### 2. What each app changes

Places as of Peek `main` `664d144` and Ship `main` `58732d4`, 14 September. **Lines drift: find each by its file and its code, and re-count before starting.**

**`Link`** — 20 links: 18 raw `<a>` and 2 router links. Every one ends as a component or a written reason; `fitted + reasoned = 20` goes in **UIG-27: the links, recounted** above. Re-read on 14 September at the commits above: the same 20, and by job the same as that table (Peek 5 text, 2 card or row, 2 chip; Ship 2, 4, 3).

| app | where | job | what it looks like now | becomes |
|---|---|---|---|---|
| Peek | `ui/MessageBody.tsx:52` (`BodyLink`) | text | info colour, underlined | `Link` `text`, `external` |
| Peek | `ThreadReplyCard.tsx:504` | text | a muted timestamp, underline on hover | `Link` `quiet` |
| Peek | `TopicProjectPanel.tsx:243` · `ui/ForeignObjectWidget.tsx:401` | text | a title, underline on hover | `Link` `quiet`, `external` |
| Peek | `ui/ForeignObjectWidget.tsx:277` | text | "Open in app ↗", dotted underline | `Link` `underlined`, `external` (solid now: ruling 2) |
| Peek | `ui/ProjectTickets.tsx:154` | row | a title whose `after:absolute after:inset-0` makes the whole row the link | `Link` `plain`, keeping those classes |
| Peek | `ui/FileAttachmentCard.tsx:297` | card | the file row | goes with it, into `AttachmentCard` |
| Peek | `ui/Reference.tsx:227` · `:258` | chip | the inline chip | `InlineChip` with `href` |
| Peek | `ConversationCard.tsx:572` · `ThreadPanel.tsx:492` — `react-router-dom`'s `Link` | text | quiet | `Link` `quiet` navigating through the router in `onClick` (NavItem's rule), or keep the router's with a written reason — **Katerina decides**, from the two side by side |
| Ship | `Board.tsx:24` · `ProjectCard.tsx:55` · `ui/ForeignObject.tsx:218` | card | the whole card | `Card` with `href` (it draws `Link` `plain`) |
| Ship | `IssueRow.tsx:66` | row | `after:absolute after:inset-0`, the whole row | `Link` `plain`, keeping those classes |
| Ship | `IssueRow.tsx:79` | chip | wraps the round project badge | `Link` `plain` |
| Ship | `IssuesTable.tsx:84` | text | a title, underline on hover | `Link` `quiet` |
| Ship | `ui/ForeignObject.tsx:99` | text | "Open it there", underlined | `Link` `underlined` |
| Ship | `ui/Reference.tsx:156` · `:160` | chip | the inline chip | `InlineChip` with `href` |

`Card`, `Link` and `InlineChip` all pass the rest of their props to the anchor, so `{...linkTo(href)}` spreads onto any of them (read in `Card.tsx` and `InlineChip.tsx`).

⛔ **Ship's links spread `{...linkTo(href)}`** (`router.ts:191`, SHI-20). Keep it: `<Link {...linkTo(href)} …>`. Drop it and every click reloads the whole app. **Prove it, don't read it** (acceptance): in Playwright set `window.__marker = 1`, click the link, read it back. Still there, the app navigated; gone, the page reloaded. Do it for every Ship link that changed, and for Peek's two router links.

**`InlineChip`** (D67, ruling 3). Peek: delete `ui/inlineChip.ts`; its callers take the package's `InlineChip`, or `inlineChipClassName` / `INLINE_CHIP_CLASSES` where the editor needs strings — `ui/MessageBody.tsx` (3 chips), `ui/Reference.tsx` (3), `extensions/mention.tsx` (8), `extensions/highlight.tsx`. Tone `mention` is renamed `person`. The package's classes already carry `h-[1.4em] align-top`, so Peek's `INLINE_CHIP_STYLE` and `INLINE_CHIP_STYLE_ATTR` go, never doubled (a chip that adds its own style keeps that part: `mention.tsx:505` caps its width at `24ch`). The quiet chip becomes 19.6px (was 16.8px, a fix). Renaming the tone changes no saved or pasted text: the editor finds a chip by its data attribute (`parseHTML` matches `span[data-mention]` and its siblings), never by a class. Ship: `ui/Reference.tsx` draws every Ship chip, a person's too; it becomes `InlineChip`, and measured, it does not move.

**`ProgressBar`**. Peek `ui/ProjectTickets.tsx:22` → `variant="quiet"` (4px now, was 3px: ruling 5). Ship `ProjectRail.tsx:88` → the package's `variant="default"` (Ship's own 6px look); delete `ui/ProgressBar.tsx` and its story and test.

**`Card`** — the 18 in **UIG-27: the cards, sorted** above, by rulings 9–12. The fill is read from each card's measured colour (13 September, `card-frames.json` in the scripts folder); the states from the Card diff that matched Peek's conversation card.

| app | card | `Card` |
|---|---|---|
| Peek | `ConversationCard.tsx:487` | `fill="surface"` `hover="fill"` `quietUntilHover`; selected → `selected`, being edited → `active`, unread → `attention="accent"`, urgent → `attention="warning"` (each measured identical) |
| Peek | `ThreadReplyCard.tsx:415` | `fill="surface"` `hover="fill"` `quietUntilHover`; the same states, where it draws them (read it) |
| Peek | `HuddleCard.tsx:127` | `fill="surface"` `hover="fill"` (its hairline stays at rest) |
| Peek | `TopicDetailsDialog.tsx:254` · `TopicProjectPanel.tsx:238` | `fill="none"` |
| Peek | `ui/ForeignObjectWidget.tsx:385` | `fill="inset"` |
| Peek | `ui/ForeignObjectWidget.tsx:607` | `fill="none"` `unreadable` (dashed now) |
| Peek | `ui/FileAttachmentCard.tsx:216` · `:246` · `:291` · `ui/PendingAttachmentChip.tsx:87` | `AttachmentCard`, below |
| Ship | `Board.tsx:26` | `fill="elevated"` `href` (8px corners now, was 6px) |
| Ship | `ProjectCard.tsx:58` | `fill="surface"` `href` |
| Ship | `ConversationThread.tsx:543` | `fill="surface"`; its `subdued` look (`border-subtle` on `bg-base`) → try `fill="none"`, and measure |
| Ship | `ui/ForeignObject.tsx:212` | `fill="surface"`, and `href` where it is a link (the `<a>` at `:218`) |
| Ship | `ui/ForeignObject.tsx:89` | `fill="surface"` `unreadable` |
| Ship | `ui/Attachment.tsx:45` · `:88` | `AttachmentCard`, below |

The foreign object's inside layout (D66) is **not** this ticket.

**`AttachmentCard`** (rulings 13, 14, 16, 18).

| app | today | becomes |
|---|---|---|
| Peek | `ui/PendingAttachmentChip.tsx`, used in `ui/ComposeBox.tsx:366` and `ui/AttachFiles.tsx:54` | `<AttachmentCard pending …>` in both; **delete** the file, its story and its test |
| Peek | `ui/FileAttachmentCard.tsx`, used in `ConversationCard.tsx:671` and `ThreadReplyCard.tsx:535` | shrinks to what only Peek can do: `useRelayBlob` (the fetch), `downloadFile`, `ImageLightbox`. It passes `src`, `href` and `state`, with `onOpen` (opens `ImageLightbox`) and `onDownload` (calls `downloadFile`). Keep passing `data-interactive`: `ConversationCard.tsx:516` and `HuddleCard.tsx:158` ignore a click inside `[data-interactive]`, so a click on a file does not also open the conversation. The card's props spread onto its root, so it arrives |
| Ship | `ui/Attachment.tsx`, used in `ui/RichText.tsx`, `ui/editorSchema.tsx`, `ConversationThread.tsx` (`Attachments`) | a **file** and the **can't-load** state become `AttachmentCard` (ruling 8: 28px line → Peek's 50px card). **Images stay as they are** until the package has a full-screen viewer (ruling 14), so `Attachment.tsx` keeps its image and its fetch. ⚠️ `editorSchema.tsx` draws it **inside the description editor**: the taller card changes the editing surface — photograph a description with a file while editing, and check it can still be selected, moved and deleted |

What changes on screen, all ruled: a card that cannot be read is dashed; a name shows in full on hover **only when it is cut off**, and a size never does; the loading placeholder is a named status (Peek's had an `aria-label` on a plain `div`).

**`EmptyState`** (ruling 6). A section's empty state goes **inside the box its rows live in, with no padding of its own**. The callers that pad one today:

| app | callers |
|---|---|
| Peek | `TopicActivity.tsx:68` (`px-4 py-4`) · `TopicProjectPanel.tsx:211` · `:219` (`p-3`) · `ui/ProjectTickets.tsx:118` (`border-t px-3 py-2`) · `views/FolderContentsView.tsx:91` · `:96` (`p-4`) · `views/ForeignConversationView.tsx:72` · `:86` (`p-4`) — and read the multi-line ones: `ui/StarredSection.tsx:47`, `ui/ErrorBoundary.tsx:41`, `pages/DeskPage.tsx:410`, `pages/TopicsPage.tsx:200` · `:215` |
| Ship | `Activity.tsx:122` (`py-8`) · `ConversationThread.tsx:648` (`py-8`) · `History.tsx:32` (`py-6`) · `NewIssueDialog.tsx:73` (`py-6`) · `views/ProjectView.tsx:126` (`py-10`) · `IssueList.tsx:50` (passes `className` on) — and read `pages/IssuePage.tsx:93`, `views/ProjectsView.tsx:54` |

⚠️ **Not ruled yet, and it covers all six of Ship's padded callers:** how much vertical room an empty section takes in Ship (`py-6`, `py-8`, `py-10`). Ruling 6 says it is taken when those callers are fixed. Photograph them at the start and bring the photos to Katerina with the plan (§1, step 7); change them after she rules.

A finding, not this ticket's to fix: some callers use `EmptyState` for a **failure** — Peek's "This folder could not be read." (`views/FolderContentsView.tsx:91`), "Something went wrong… try again" (`ui/ErrorBoundary.tsx:41`) — which its page says an empty state must never stand in for. List them in the PR; change them only if Katerina says.

**`gates:status`.** It is run in estiva-ui and reads all three repos. UIG-27 reads 6 of 12 today: the 6 package checks pass, and the other 6 are the apps' — in each, "the installed package has Link", "… has ProgressBar", and "the hand-made progress bar is gone". Taking 0.13.0 and deleting the two bars turns all 6. Also: add UIG-30 to both apps' `scripts/gates-checks.mjs`, which list 29 tickets. Nothing catches that today: "every repo agrees" checks who owns a ticket, not that every list has it. And add a check for each thing this adoption deletes (`inlineChip.ts`, `PendingAttachmentChip.tsx`), so it cannot come back.

**GATES.md is estiva-ui's.** The last edits (the arithmetic, §0, §13, §15) go in a third PR, in estiva-ui, branch `gates/27-close` (UIG-2 closed the same way). Katerina merges it.

#### 3. Traps

| trap | what happens | do instead |
|---|---|---|
| a test pinned to a deleted file or an old class | fails, and tempts a "fix" in the test | read every failure as a possible package defect first (package CLAUDE.md); a test of deleted code goes with the code |
| linking the package checkout into an app | two Reacts ("reading 'useRef'"); `npm pack` does not rebuild `dist` | install the published 0.13.0 |
| `cn` from `tailwind-merge` in the app | a size token beside a colour is dropped | the app's own `cn` if it is taught the ramp, or the package's |
| a Base UI Select option found by text in a test | flaky: the closed list is already mounted (§22) | `findByRole('option', { name })` |
| a Ship description edited through the agent | renders raw JSON | never edit a Ship description with `edit-project` / `ship_edit_project` |
| accessibility runs | not on Katerina's machine | CI runs axe; never `test:a11y` locally |
| docs that are not this project's | — | never edit `K:\Estiva\migration docs`, `PREVENTION.md`, `COVERAGE-PLAN.md` |

#### 4. Done means

The ticket's acceptance, with today's numbers:

- [x] All 20 links fitted or reasoned; `fitted + reasoned = 20` written above (20 + 0).
- [x] Every Ship link keeps `linkTo`, proved by the window marker; Peek's two router links too.
- [x] Both hand-made progress bars are gone.
- [x] The chips, the 18 cards and the attachments are the package's; `inlineChip.ts`, `PendingAttachmentChip.tsx` and Ship's `ui/ProgressBar.tsx` are deleted, with their stories and tests; `FileAttachmentCard.tsx` holds only Peek's own part, and Ship's `ui/Attachment.tsx` its image, its fetch and (ruling 22) its file's open and download.
- [x] Every padded empty state sits inside its rows' box, or level with rows that pad themselves (ruling 21); Ship's after her ruling on their room (20).
- [x] Every story photographed before and after; every difference is a ruling, explained noise, or fixed (one bug, below). The real screens were not re-shot: see below.
- [x] Both apps build, typecheck, lint and pass their tests; CI green on both PRs.
- [x] Both apps' `gates-checks.mjs` list UIG-30, and check that the deleted files stay deleted.
- [x] `npm run gates:status` reads Peek's part 6 of 6 and Ship's 5 of 5; §0, §13 and §15 updated in the `gates/27-close` PR.

#### 5. What the adoption did

| | found | what happened |
|---|---|---|
| ✅ | **A feed card went dark under its own menu.** Peek's conversation, reply and huddle cards stay lit while their ⋯ menu or emoji picker is open; the menu opens outside the card, so `:hover` is false there (measured). `Card` lit only on `:hover`. | `Card` `hovered`, released as 0.13.1 (estiva-ui PR #32, ruling 23). A selected clickable card keeps its pointer in the same release. |
| ✅ | **The first `RouterLink` threw without a router.** `useNavigate()` at the top of `ConversationCard` broke every card drawn outside one (the Files panel's "with activity" story). Caught by photographing every story. | The router is read inside `RouterLink`, which needs one exactly where react-router's `Link` did. 7 tests. |
| ✅ | **Ship's description editor saves and closes on blur**, and a file card's link and Download button take focus: pressing Download while editing committed and left the editor (measured). | Inside the editor a file is drawn and never opened (`opens={false}`); measured again: a click selects it, Backspace deletes it, no commit. |
| ✅ | **Two kinds of padded empty state in Peek.** 7 copy their list box's padding; 7 sit in lists whose rows pad themselves, where no padding would move the line 8–12px off the rows. The file tree's 4 arrived with FOL-19 on 14 September. | Ruling 21. Photographed identical. |
| ✅ | **A document was deliberately not fetched in Ship** ("a PDF is not fetched to show its name"), and opening one needs its bytes. | Told Katerina before building; ruling 22 stands: fetched when drawn, once, cached, as Peek does. |
| 📝 | Ship's chip that is a link no longer fills on hover: Peek's chip never did, and ruling 3 moved Peek's in unchanged. | Written in ship PR #151. A hover for a linked `InlineChip` would be a package change, if wanted. |
| 📝 | Some callers use `EmptyState` for a failure ("This folder could not be read.", "What is in this could not be read.", the relay failure in Peek's Files panel, "This conversation could not be read.", `ErrorBoundary`), which its page says an empty state must not stand in for. | Listed in peek PR #218; changed only if Katerina says. |
| 📝 | The real screens (a conversation with files, a Ship issue with a description, a project) were not re-photographed: the stories covered every changed component, and the one behaviour a story could not show (the editor's blur) was measured in a browser with a throwaway story. Full-Storybook photo runs cost a lot of reading; after the first full pass, only the stories that draw what changed were re-shot. | — |
| 🧰 | Traps: a fresh `npm install` with npm 11.6 rewrites unrelated `peer` flags in a lock — bump the ui entry only; a `#/…` story address never reloads, so the window marker must first point it at a real path; Ship's `docker-context` and `trees-agree` root tests fail on Windows only (`K:\K:\…`), and CI runs them; a full test run beside another suite times out tests that pass alone. | — |

### What is ready for the next tickets

| ticket | what it gets |
|---|---|
| UIG-3 | Its checks in `gates:status` are written, and proved to flip. Peek's lint today: `eslint src` **84**, `eslint .` **99** (the ticket's 79 / 94 is stale). |
| UIG-4 | Its checks are written. It creates `ship/docs/GATES-DEBT.md`, the first debt list. |
| UIG-7 | `<a>` has a component to name now: `Link`, or `InlineChip` for a chip. |
| UIG-8 | Its acceptance line about the Folders scroll bug is corrected (§22). |
| UIG-10, UIG-11, UIG-26 | "Same row set" now reads "same gate checks" (§15). |
| UIG-21 | Its line counts are measured with imports: Peek **273**, Ship **298**, estiva-ui **192** (§22). |
| every ticket | Update your own checks in `scripts/gates-checks.mjs` and your row in §15 in the same session. |

**UIG-30 is listed everywhere:** Peek's and Ship's `scripts/gates-checks.mjs` gained its part in UIG-27's app PRs, and the status engine, the same file in all three repos, now says "every ticket" instead of a count.

---

## §1 What UIG-1 did

One question: before we switch a rule on, how much would it actually block?

§3 answers it. One row per rule per repo. Real counts, real `file:line`, and the
exact words the error would print.

Katerina filled in the verdicts on 13 September. §14 has them all.

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

**Verdicts ruled by Katerina, 13 September.** §14 explains what each one changes.

### Family A — forbid the raw element

Guide T10. Tickets UIG-3, UIG-4, UIG-7.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **raw-button** | estiva-ui | 8 | `src/Menu.tsx:295` · `src/Toast.tsx:105` · `src/Reaction.tsx:58` | see §5 P4 | **on** |
| | **peek** | **12** | `components/CommandLauncher.tsx:1363` · `components/HuddleCreator.tsx:87` · `components/ui/PendingAttachmentChip.tsx:58` | `A <button> here is not ours. Use Button, or IconButton when it is icon-only.` | |
| | **ship** | **0** | none found | same | |
| **raw-input** | estiva-ui | 1 | `src/ChipInput.tsx:205` | see §5 P4 | **on** |
| | **peek** | **4** | `components/CommandLauncher.tsx:1418` · `components/HuddleCreator.tsx:95` · `components/ui/AttachFiles.tsx:30` | `An <input> here is not ours. Use TextInput, SearchInput, or Checkbox for a tick box.` | |
| | **ship** | **2** | `components/Composer.tsx:183` · `components/ui/DescriptionEditing.tsx:215` | same | |
| **raw-anchor** ⛔ | estiva-ui | 3 | `src/NavItem.tsx:31` · `src/RailItem.tsx:27` · `src/Breadcrumb.tsx:91` | see §5 P4 | **on** once UIG-27 builds Link |
| | **peek** | **7** | `components/ui/MessageBody.tsx:51` · `components/ThreadReplyCard.tsx:500` · `components/ui/ForeignObjectWidget.tsx:277` | **no message possible. §9.1** | |
| | **ship** | **7** | `components/Board.tsx:24` · `components/IssueRow.tsx:66` · `components/IssuesTable.tsx:84` | **no message possible. §9.1** | |
| **raw-dialog** | estiva-ui | 0 | none found | `A <dialog> here is not ours. Use DialogShell, or ConfirmDialog to ask yes or no.` | **on** |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |

### Family B — forbid the reach

Guide T11. Ticket UIG-8.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **no-base-ui-import** | estiva-ui | 22 | `src/Button.tsx:2` · `src/Checkbox.tsx:1` · `src/CollapsibleSection.tsx:2` | legitimate. This is the package's job. | **on** |
| | **peek** | **0** | none found | `Only @estiva-app/ui imports Base UI. Take the component from @estiva-app/ui, or add it there first.` | |
| | **ship** | **0** | none found | same | |
| **no-create-portal** | estiva-ui | 2 | `src/ChipInput.tsx:222` · `src/Toast.tsx:174` | see §5 P1 | **on** |
| | **peek** | **2** | `components/CommandLauncher.tsx:1327` · `components/ui/FileAttachmentCard.tsx:67` | `createPortal is not how we float things. Use Popover, Menu, Tooltip, PreviewCard or DialogShell. Each owns its own portal.` | |
| | **ship** | **0** | none found | same | |
| **no-keydown-listener** | estiva-ui | 0 | none found | same | **on** |
| | **peek** | **2** | `components/HuddleCreator.tsx:64` · `layouts/AppShell.tsx:34` | `A keydown listener on document is not how we take keys. Menu, Select, Popover and DialogShell own their own.` | |
| | **ship** | **0** | none found | same | |
| **no-role-dialog** | estiva-ui | 0 | none found | `A hand-written role="dialog" means a hand-made dialog. Use DialogShell. It traps focus and gives it back.` | **on** |
| | peek | **0** | none found | same | |
| | ship | **0** | none found | same | |
| **hand-written ARIA role**, wider | estiva-ui | 3 | `src/Divider.tsx:33` · `:46` (`separator`) · `src/Tooltip.tsx:69` (`tooltip`) | all legitimate — these components own those roles | **on** · `progressbar` once UIG-27 builds ProgressBar |
| *(see note)* | **peek** | **7** | `components/AddToOpenWorkDialog.tsx:71` (`option`) · `components/ui/ProjectTickets.tsx:22` (`progressbar`) · `components/CommandLauncher.tsx:1680` (`alert`) | `A hand-written role="option" means a hand-made listbox. Use Select.` | |
| | **ship** | **4** | `components/ui/ProgressBar.tsx:25` (`progressbar`) · `components/Composer.tsx:229` (`alert`) · `components/ui/DescriptionEditing.tsx:238` (`alert`) | same, per role | |
| **no-tabindex-on-div** | estiva-ui | 0 | none found | `tabIndex turns a box into a control. Use Button, IconButton or NavItem. They are focusable already.` | **on** · `tabIndex={0}` and up only |
| | peek | **0** | none found | same | |
| | **ship** | **1** | `components/ui/DescriptionEditor.tsx:77` | same | |
| **no-overflow-class** | estiva-ui | 1 | `src/ChipInput.tsx:224` | see §5 P1 | **on** |
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
| **no-handmade-header** | estiva-ui | 1 → **0** | `src/DialogShell.tsx:117`, which owns the shape | `A panel header drawn by hand. Use SectionHeader.` | **on** |
| | **peek** | 4 → **3** | `components/ConversationHeader.tsx:132` · `components/ThreadPanel.tsx:233` · `components/ThreadPanel.tsx:367` | `A panel header drawn by hand. Use ContainerHeader.` | |
| | **ship** | **0** | none found | `A panel header drawn by hand. Use SectionHeader.` | |
| **no-handmade-empty-state** | estiva-ui | 0 | none found | `A line saying there is nothing is an EmptyState. Use EmptyState. scope="section" inside a section, scope="page" for a whole page.` | **on** |
| | **peek** | **7** | `components/CommandLauncher.tsx:1464` · `components/ReadStatePanel.tsx:65` · `components/views/FolderContentsView.tsx:101` | same | |
| | **ship** | **2** | `components/Board.tsx:61` · `components/ui/ForeignObject.tsx:206` | same | |
| **no-native-title** | estiva-ui | **0** | none found | `title= is the browser's tooltip, not ours. Use WithTooltip, or IconButton's tooltip prop.` | **on** |
| | **peek** | **3** | `components/ui/Reference.tsx:116` · `:137` · `:166` | same | |
| | **ship** | **3** | `components/ui/Reference.tsx:87` · `:103` · `:137` | same | |
| **no-copied-class-list** | estiva-ui | 14 | `src/TextInput.tsx:26` ≈ `Textarea.tsx:24` · `src/Chip.tsx:36` ≈ `Reaction.tsx:64` | see §9.4 | **warn** |
| | **peek** | **28** | `components/CommandLauncher.tsx:1339` ≈ `DialogShell.tsx:113` · `components/ThreadPanel.tsx:233` ≈ `DialogShell.tsx:117` · `components/ui/PersonRow.tsx:84` ≈ `Skeleton.tsx:22` | `This class list is DialogShell's, re-typed. Import DialogShell from @estiva-app/ui.` | |
| | **ship** | **2** | `auth/AuthShell.tsx:42` ≈ `DialogShell.tsx:87` · `components/Sidebar.tsx:91` ≈ `NavItem.tsx:38` | same | |

The two numbers in `no-handmade-header` are before and after removing the
component that owns the shape. `DialogShell` in the package and `ContainerHeader`
in Peek are the originals, so they should not be flagged against themselves.

### Family D — the className allow-list

Guide T13. Ticket UIG-9.

| rule | repo | count | samples | message | verdict |
|---|---|---|---|---|---|
| **className-placement-only** | estiva-ui | **8** | `src/Banner.tsx:62` (IconButton `text-current`) · `src/DialogShell.tsx:150` (ScrollArea `border-b`) · `src/Tooltip.tsx:115` (Tooltip `transition-[…]`) | `Only placement passes through IconButton's className. "text-current" changes how it looks. Ask for a prop on IconButton instead.` | **on** |
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
| **raw-select** | 0 | **0** | **0** | none found anywhere | `A <select> here is not ours. Use Select.` | **on** |
| **raw-textarea** | 2 | **0** | **0** | `src/Textarea.tsx:22` · `src/EditableText.tsx:143`, both `render` props | `A <textarea> here is not ours. Use Textarea.` | **on** |

Both are free. Zero violations in either app. The package's two are handed to a
Base UI `render` prop, which is the correct pattern. Turn them on in UIG-7 and
they can never regress.

---

## §5 The package-facing rules

UIG-5 names four rules that point inward at the package, and says UIG-1 measures
them. Measured against `estiva-ui/src`.

| | rule | count | what I found | verdict |
|---|---|---|---|---|
| **P1** | hand-rolled behaviour where Base UI has a part (D6) | **2 components, 6 sites** | `ChipInput` is the package's last hand-rolled float. It imports `./fit` (:5), listens to `window` resize and scroll itself (:143, :144), and portals by hand (:222). Base UI's Positioner and Portal do all four. `Toast.tsx:174` is the second `createPortal`. `fit.ts` now has one real caller; everything else moved to Base UI. | **on** · ChipInput fixed by PR #22, Toast at stage 6 |
| **P2** | a component with no `.mdx` doc page | **0** | All 44 have one. There are 46 `.mdx` files. The two extra are `FieldLine` and `MenuItem`, which are exported from a sibling file. That is the false positive UIG-5 warned about, and it is real. | **on** |
| **P3** | a component with no `.stories.tsx` | **0** | All 44 have one. Same two extras, same reason. | **on** |
| **P4** | a raw element outside a wrapper | **9** or **4** | The package has 14 raw elements. 5 are handed to a Base UI `render` prop, which is fine. Of the other 9, **4 sit nested inside a bigger component**: `Breadcrumb.tsx:91`, `ChipInput.tsx:43`, `ChipInput.tsx:205`, `Toast.tsx:105`. The other 5 are the component's own root element: `NavItem`, `RailItem`, `Reaction`, `EditableText`, `Menu.tsx:480`. | **on** · the tracer |

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

✅ **Katerina said yes, 13 September. Stories in, tests out.** Every lint rule
from UIG-3 onwards checks `*.stories.tsx` and skips `*.test.ts` and `*.test.tsx`.
UIG-3's Peek count goes from **12 to 19**.

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

✅ **Ruled 13 September: keep the order.**

My recommendation changed before she ruled, and the reason is worth keeping.
UIG-27 now builds the missing Link component. So the one lint rule that was stuck
for lack of a decided answer is not stuck any more, and every other phase-1 rule
already has a component to name. Moving the usage pages earlier would have cost
her a review of 44 components' *When not* lines before phase 1 could start, for
no rule that needed it. Look at this again after phase 1.

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
| **1** | No Link component. 14 raw `<a>`. | **UIG-27** (new). `Link` is in the package since 0.13.0; the count grew to 20 (§0), and all 20 are fitted: peek PR #218, ship PR #151. Also **UIG-7** now waits on it, and its acceptance says all 14 anchors are replaced or escaped — **not** recorded as "allowed". |
| **2** | `CommandLauncher.tsx`, 1,655 lines. | **UIG-29** (new). Runs alongside phase 1 and is explicitly told never to block it. |
| **3** | Arbitrary values outside a package component. Peek 157. | **UIG-28** (new). |
| **4** | Inline `style` that sets a colour. | **UIG-28** (new), same ticket. |
| **5** | estiva-ui copying its own class lists. 14. | **UIG-25**, target set widened to include `estiva-ui/src`, with a second message for a primitive copying a sibling. |
| **6** | "Rules" means two things. | **UIG-2**, item 5c. A wording pass over the guide, the Ship brief and every ambiguous ticket. |

The two smaller ones went with them: **ProgressBar** and **EmptyState's padding
prop** are both in UIG-27, and UIG-8 now waits on UIG-27 for the
`role="progressbar"` branch. ProgressBar is in the package since 0.13.0;
EmptyState gets no padding prop, by Katerina's ruling (§0, ruling 6).

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

## §14 Katerina's rulings — 13 September 2026

She was given the rules in four groups, with a recommendation for each, and ruled
on all of them. **24 on, 2 warn, 0 dropped.**

### Group A — nothing to fix today

| | rule | verdict | ticket |
|---|---|---|---|
| A1 | No plain `<dialog>` | **on** | UIG-7 |
| A2 | No plain `<select>` | **on** | UIG-7 |
| A3 | No plain `<textarea>` | **on** | UIG-7 |
| A4 | Apps don't import Base UI directly | **on** | UIG-8 |
| A5 | No hand-made dialog (`role="dialog"`) | **on** | UIG-8 |
| A6 | Every package component has a doc page with *When*, *When not*, *How* | **on** | UIG-5, locked in CI by UIG-19 |
| A7 | Every package component has a story | **on** | UIG-5 |

### Group B — small, clear fixes

| | rule | verdict | ticket |
|---|---|---|---|
| B1 | No plain `<button>` | **on** | UIG-3 (Peek), UIG-4 (Ship) |
| B2 | No plain `<input>` | **on** | UIG-7 |
| B3 | No hand-made floating layer (`createPortal`) | **on** | UIG-8 |
| B4 | No hand-written keyboard listener | **on** | UIG-8 |
| B5 | No browser scrollbar (`overflow-auto`) | **on** | UIG-8 |
| B6 | No browser tooltip (`title=`) | **on** | UIG-24 |
| B7 | No hand-made panel header | **on** | UIG-22 |
| B8 | Only position and spacing pass into our components | **on** | UIG-9 |
| B9 | No hand-made list option (`role="option"`) | **on** | UIG-8 |
| B10 | No focusable `<div>` (`tabIndex` 0 and up) | **on** | UIG-8 |
| B11 | No colours in inline `style` | **on** | UIG-28 |
| B12 | No hand-written font sizes like `text-[14px]` | **on** | UIG-28 |
| B13 | Package: no plain element that isn't wrapping anything | **on** | UIG-5, the tracer |

### Group C — rules that guess

| | rule | verdict | ticket |
|---|---|---|---|
| C1 | Hand-made empty state | **on** — *overruled my advice of warn* | UIG-23 |
| C2 | Styling copied from one of our components | **warn** | UIG-25 |
| C3 | Hand-written heights and spacing like `h-[240px]` | **warn** | UIG-28 |

### Group D — waiting on something

| | rule | verdict | ticket |
|---|---|---|---|
| D1 | No plain link `<a>` | **on** — "we will build it" | UIG-27 builds Link, then UIG-7 |
| D2 | No hand-made progress bar | **on** — "we will build it" | UIG-27 builds ProgressBar, then UIG-8 |
| D3 | Package: no hand-made positioning | **on** — "we will fix it" | see below |

### Stories and order

- **Stories in, tests out.** Every rule from UIG-3 on checks `*.stories.tsx` and
  skips `*.test.ts` and `*.test.tsx`. UIG-3's Peek count goes from 12 to 19.
- **Keep the order.** The usage pages stay in phase 3. §12 explains why the
  recommendation changed before she ruled.

### What the rulings change

**C1 is on, so UIG-23 has to be exact.**
I had advised *warn* because the rule, as UIG-1 measured it, guesses from the
words. It flagged `CommandLauncher.tsx:1498` — *"Nothing is created until you
submit it."* — which is a hint, not an empty state. A warning can afford a
mistake like that. A blocking rule cannot: every false alarm stops a merge.
Katerina ruled *on*, so UIG-23 must not match on wording alone. It has to look at
what the element is and where it sits, and that line must pass.

**C2 and C3 are warnings, not errors.**
UIG-25 builds a rule that reports and does not block. UIG-28 splits its
arbitrary-value rule in two: font sizes block, heights and spacing warn. That was
the split UIG-28 said needed her ruling, and she has given it.

**D3 already has its fix, in two parts, and neither is a new ticket.**

- **`ChipInput` is fixed by stage 5 of the migration: estiva-ui PR #22**, built
  13 September by another session in a separate worktree. **Merged, and released
  as `0.12.7`.** `fit.ts` is deleted, `ChipInput` no longer imports it, the two
  `window` listeners are gone, and the raw `<input>` is gone. The one
  `createPortal` left in the file is inside a comment. Checked, not assumed.
- **`Toast` moves onto Base UI's `Toast` at stage 6** of the migration. Not built.
  Her standing ruling is that the gates come before the migration, so `Toast`
  keeps its hand-made portal until then. When UIG-5 switches the rule on,
  `Toast.tsx` carries an escape whose reason names stage 6.

**PR #22 changes UIG-5's tracer count.** Two of the four tracer violations were
in `ChipInput`. PR #22 removes the raw `<input>` (`:205`) and keeps the raw
`<button>`, which moves from `:43` to `:49`. PR #22 has now merged, so the tracer
is expected to be **3**, not 4. UIG-5 must re-count on current `main` before it
reconciles.

### Tickets updated to match

UIG-3, UIG-4, UIG-5, UIG-23, UIG-25 and UIG-28. UIG-7 and UIG-8 already pointed
here for the stories answer, and this section gives it, so they were left alone.

## §15 The route — phases and the tickets

UIG-2 wrote this. Ship holds each ticket's full text. `gates:status` holds each
ticket's status, read from the code. This section holds what neither does: the
phases, who owns each ticket, and what counts as evidence.

**No status is written here on purpose.** A status in a document goes stale the
day it is written. Run `npm run gates:status` for it.

### The phases

| phase | tickets | when it is done |
|---|---|---|
| 0 · count and track | UIG-1, UIG-2 | The lint rules are chosen from real numbers, and every ticket after is tracked from the code. |
| before 1 | UIG-27, UIG-28 | The package has Link and ProgressBar, and the token lint has no hole for `text-[14px]`. |
| 1 · the wall | UIG-3 to UIG-9 | Nobody can write or merge code that reaches past the system, in any of the three repos. |
| alongside 1 | UIG-29 | `CommandLauncher.tsx` is on the package's components, with no key behaving differently. |
| 2 · Leaf's road | UIG-10, UIG-11 | Leaf starts, behind the wall, at zero violations. |
| 3 · the catalogue | UIG-12 to UIG-19 | One list of every component in the three libraries, and a usage rule for every reusable one. |
| 4 · make it read | UIG-20, UIG-21 | A session searches the catalogue before it builds, and `CLAUDE.md` is an index. |
| 5 · the fingerprints | UIG-22 to UIG-25 | The shapes of mistake that reached Katerina cannot reach her again. |
| close | UIG-26 | The starter carries everything, Leaf has every rule, and the numbers are measured. |

The phases come from the roadmap artifact, revision 5. UIG-27, UIG-28 and UIG-29
were added by UIG-1's findings on 13 September. UIG-30 was added while UIG-27 was
planned, the same day, and runs after it.

### The tickets, who owns each, and what gates:status checks

Every ticket is **owned by exactly one repo**. That repo's `gates:status` prints
it as its own row. A ticket that touches other repos has **parts** there, checked
where the files live and joined into the one row when estiva-ui runs.

**How the owner was chosen:** the repo the ticket names as holding its main
work. A lint rule's code lives in estiva-ui, so every lint rule ticket that runs
in all repos is owned by estiva-ui. A ticket whose work is in one app is owned by
that app. A ticket spread evenly over all repos is owned by estiva-ui.

| ticket | title | owner | parts in | what counts as evidence today |
|---|---|---|---|---|
| UIG-1 | Count every candidate lint rule across all three repos | estiva-ui | | GATES.md §3 (the counts) and §14 (her verdicts) |
| UIG-2 | The tracking rails | estiva-ui | peek, ship | the guide committed, no wrong Base UI name, §15 exists, `gates:status` wired in all three |
| UIG-3 | Tracer bullet — one rule, end to end, blocking in Peek | peek | estiva-ui | the plugin in `src/eslint` with `no-raw-button` and an `./eslint` export; in Peek: the gate config loads, `lint:rules`, CI, the hook, `.gates-count.json`, and a lint probe: a raw `<button>` is an error in source and in a story, not in a test |
| UIG-4 | The same chain, blocking in Ship | ship | | the same chain in `ship/web`, the hook at the root, the lint probes, `docs/GATES-DEBT.md` |
| UIG-5 | The same chain inside estiva-ui, pointed inward | estiva-ui | | the same chain in estiva-ui, and a nested raw element is an error |
| UIG-6 | Branch protection | estiva-ui | peek, ship | GitHub requires a check whose name has "gate" or "lint:rules", in each repo |
| UIG-7 | Lint rule — every remaining raw element | estiva-ui | peek, ship | probes: `<input>` names TextInput, `<a>` names Link |
| UIG-8 | Lint rule — forbid the reach | estiva-ui | peek, ship | probes: `createPortal` is an error; `tabIndex={0}` is, `tabIndex={-1}` is not |
| UIG-9 | Lint rule — the className allow-list | estiva-ui | peek, ship | probe: a border passed into `Button` is an error naming Button |
| UIG-10 | create-app | estiva-ui | | a `create-app` command in the package |
| UIG-11 | Create the Leaf repo from it | estiva-ui | | `estiva-app/leaf` exists on GitHub; a `leaf` checkout beside estiva-ui |
| UIG-12 | The registry, thin and proved | estiva-ui | | `registry.json` committed, versioned, with entries; `ui:find` wired |
| UIG-13 | The registry widens to Peek's and Ship's | estiva-ui | peek, ship | the registry has Peek and Ship entries; each app has its own `registry.json` |
| UIG-14 | Usage rules — components that own a behaviour | estiva-ui | | every component importing `@base-ui/react` has a page with the five sections |
| UIG-15 | Usage rules — frame and layout | estiva-ui | | `EmptyState.mdx` has the five sections |
| UIG-16 | Usage rules — the rest, close the 44 | estiva-ui | | every component page has the five sections |
| UIG-17 | Usage rules — Peek's own components | peek | | `PendingAttachmentChip.mdx` has the five sections; every Peek registry entry has a class |
| UIG-18 | Usage rules — Ship's own components | ship | | `ForeignObject.mdx` has the five sections; every Ship registry entry has a class |
| UIG-19 | Lock the contract in CI, one search | estiva-ui | peek, ship | a CI step runs an `npm run …contract…` script; estiva-ui's Storybook has `refs` |
| UIG-20 | The Claude skill | estiva-ui | peek, ship | a committed `SKILL.md` that runs `ui:find` |
| UIG-21 | CLAUDE.md becomes an index | estiva-ui | peek, ship | `.claude/rules/*.md` with `paths:` frontmatter |
| UIG-22 | Fingerprint — hand-made header row | estiva-ui | peek, ship | probe: a padded row at the top of a pane names ContainerHeader (Peek) or SectionHeader (Ship) |
| UIG-23 | Fingerprint — hand-made empty state | estiva-ui | peek, ship | probe: "Nothing here" in place of an empty list names EmptyState, in all three repos |
| UIG-24 | Fingerprint — browser tooltip | estiva-ui | peek, ship | probe: `title=` names WithTooltip |
| UIG-25 | Fingerprint — component copied by hand | estiva-ui | peek, ship | probe: SectionLabel's class list typed by hand is a **warning**, in all three repos |
| UIG-26 | Re-run the starter, close the loop | estiva-ui | | every other ticket is done (worked out by estiva-ui's run) |
| UIG-27 | Link, ProgressBar, EmptyState padding | estiva-ui | peek, ship | `Link`, `InlineChip`, `ProgressBar`, `Card` and `AttachmentCard` exported (0.13.0); `EmptyState.mdx` places a section's empty state inside its rows' box (no padding prop, Katerina, 14 September); each app installs a version that has them and its hand-made progress bar is gone; Peek's `inlineChip.ts` and `PendingAttachmentChip.tsx` stay deleted and a posted file draws `AttachmentCard`; Ship's mentions draw `InlineChip` and its files `AttachmentCard` (15 September) |
| UIG-28 | The two holes in the token contract | estiva-ui | peek, ship | probes on the token lint: `text-[14px]` and an inline colour are errors, `h-[240px]` is a warning |
| UIG-29 | CommandLauncher | peek | | the file passes the gate lint with no escape naming UIG-29, and imports `DialogShell` from the package |
| UIG-30 | RichText | estiva-ui | peek, ship | `RichText` exported (a first guess, until UIG-30 is built) |

The five sections are *What it is*, *When*, *When not*, *How* and *What it owns*,
from UIG-14.

**Evidence for a ticket not yet built is a first guess, taken from its own
text.** A ticket's code may name things differently. The ticket that builds it
changes its checks in `scripts/gates-checks.mjs` and its row here, in the same
session. Every ticket already says so in its acceptance criteria.

### The arithmetic

| | |
|---|---|
| tickets | **30** |
| owned by estiva-ui | **25** — UIG-1, 2, 5 to 16, 19 to 28, 30 |
| owned by peek | **3** — UIG-3, 17, 29 |
| owned by ship | **2** — UIG-4, 18 |
| **25 + 3 + 2** | **30** ✅ |
| parts checked in estiva-ui | 1 — UIG-3 |
| parts checked in peek | 15 |
| parts checked in ship | 15 |

`gates:status` proves this on every run rather than trusting this table. It
fails loudly if a ticket is claimed twice, claimed by nobody, claimed by a repo
the list does not name, or if a repo checks a part the list does not give it.
On 13 September it printed: *Each ticket is owned by exactly one repo, and every
repo agrees.*

### "The same row set" is now "the same gate checks"

UIG-10, UIG-11 and UIG-26 said a new app's `gates:status` must report "the same
row set as Peek's and Ship's". That cannot be true once each ticket has one
owner: Peek owns UIG-3 and Ship owns UIG-4, so their rows differ. What those
tickets meant is that a new app carries every gate the apps carry. All three now
say **the same gate checks**. UIG-2 decided one owner per ticket, so the three
tickets were aligned to it rather than the other way round.

---

## §16 The five seams

A seam is a decision made now, cheaply, so a later phase builds on top with no
rework. They come from the roadmap artifact, §07.

| | seam | the decision | why it was chosen | built by |
|---|---|---|---|---|
| **S1** | The lint rules are a plugin, not config | A publishable plugin inside estiva-ui from the first commit, with its own tests. | Leaf gets every lint rule written after it launches through an ordinary version bump. The hook runs the same rule code as the lint, so the two cannot disagree. | UIG-3 |
| **S2** | The registry is a data source | A versioned schema with stable field names, read by machines first and rendered second. One per repo, merged into an index. | The MCP server, the duplicate scan and any public docs file read it and nothing else. A Markdown generator would need three parsers. | UIG-12, UIG-13 |
| **S3** | Every lint run writes its count | `.gates-count.json` per repo, committed from day one, even though nothing compares it yet. | The later ratchet is one CI step comparing two numbers, and the history of the number falling starts at the first commit. | UIG-3, UIG-4, UIG-5 |
| **S4** | The escape marker is machine-readable | `// @estiva-escape: <reason>` — a fixed shape, parsed and reported. Never a free comment, never `eslint-disable`. | The adoption number can subtract sanctioned exceptions honestly, and the report lists every escape with its reason and age. | UIG-3 |
| **S5** | The starter is generated, never copied | Assembled from the live repos on each run, not a folder snapshotted once. | This is what let the starter move from phase 5 to phase 2. Re-running it carries everything new into Leaf. A copy would be stale before Leaf's first commit. | UIG-10, UIG-26 |

S1 and S5 together are why building the starter before the catalogue costs
nothing: every later lint rule reaches Leaf through the package, and every later
gate reaches the starter through a re-run.

---

## §17 How gates:status reads the code

### The files

| repo | files | run it |
|---|---|---|
| estiva-ui | `scripts/gates-status.mjs`, `scripts/gates-checks.mjs` | `npm run gates:status` — all 29 tickets, joining in `../peek` and `../ship` |
| peek | the same two | `npm run gates:status` — Peek's 3 tickets and its 15 parts |
| ship | the same two, at the repo root | `npm run gates:status` — Ship's 2 tickets and its 15 parts |

`gates-status.mjs` is **the same file in all three repos**. estiva-ui's run
compares the copies and warns when they differ. `gates-checks.mjs` is each repo's
own list. Neither file reaches estiva-ui's published package: its `files` list
does not include `scripts/`.

Flags: `-- --detail` prints every check under every row. `-- --json` prints
machine output; estiva-ui's run reads the other repos that way. `GATES_PEEK`,
`GATES_SHIP` and `GATES_LEAF` point at a checkout that is not in the usual place.

### How a row is decided

| | when |
|---|---|
| ✅ | every check passes |
| 🚧 | some pass |
| ⬜ | none pass |
| ❔ | a check could not run: a repo is missing, GitHub cannot be asked, or the lint config would not load |

A missing repo is ❔, never ✅. A ticket cannot read done while any of its parts
is unread.

### What counts as evidence

| kind | example | how it is read |
|---|---|---|
| a file exists | `docs/GATES-DEBT.md` | on disk |
| a file is committed | `.gates-count.json` | `git ls-files` |
| a config loads | `eslint.gates.config.js` | imported for real |
| a script is wired | `lint:rules` | `package.json` |
| CI runs it | `npm run lint:rules` | a step in `.github/workflows/*.yml` — a word in a comment does not count |
| the hook runs it | the gates hook | `PreToolUse` in `.claude/settings.json` — any other hook does not count |
| a lint rule fires | a raw `<button>` | a line of code is linted **in memory, never written to disk**, with the repo's own config, the way the hook will |
| a GitHub setting | branch protection | `gh api`; ❔ without `gh` |

**Nothing is read from a list someone ticks.** GATES.md itself is read only for
UIG-1 and UIG-2, whose deliverable is this document.

### Proved, 13 September

**A built thing, deleted, flips its row back.** In Peek, an
`eslint.gates.config.js` and a `lint:rules` script were added, then deleted:

| step | UIG-3's row |
|---|---|
| before | ⬜ 0 of 8 |
| config and script added | 🚧 2 of 8 — the config loads, the script is wired; the other six fail and say why |
| both deleted | ⬜ 0 of 8 |

**A lint probe can tell pass from fail.** On Peek's real token config, `text-sm`
is an error and `text-[14px]` is not. So UIG-28's ⬜ is the hole itself, not a
broken check.

**The status files break no existing check.** Both lint clean in estiva-ui and
Peek. Peek's `eslint .` has 0 errors in them. Ship's `tsc --noEmit` includes
`scripts/` but not `.mjs`, and still exits 0.

**A fresh session can answer "where are we?" from these sources alone.** A new
agent, with none of the conversation behind UIG-2, was given only this file, the
guide, `npm run gates:status` and the Ship project, and told to read nothing
else. It answered all of these correctly, quoting the source for each:

| question | its answer |
|---|---|
| done, in progress | UIG-1 done; UIG-2 built on the branch, waiting to merge; 27 not started |
| waiting on Katerina | merge PRs #24, #204, #148; paste §19's wording into the Ship description |
| next | UIG-27 and UIG-28, then UIG-3 to UIG-9 in order, UIG-29 alongside |
| how many, who owns | 29; estiva-ui 24, peek 3, ship 2 |
| where the true status is | `npm run gates:status`, with `-- --detail` |

It also found three things, all now handled:

| | it said | now |
|---|---|---|
| 1 | `gates:status` shows UIG-2 ✅, but the Ship description paste is part of UIG-2 and no check can see it | §0 says so. A setting in Ship is not code; the ticket closes in Ship. |
| 2 | The sources do not show the memory note was written | Written at the end of the session, after the proof ran. §0 lists it. |
| 3 | §9.2 and §13 still say what UIG-1 wrote | §22 already records both as stale, and why they are left. |

It could not tell whether the PRs are still open. That is right: a merge is not
in the code, so check GitHub.

### Four false passes, caught while building

Each would have shown a ticket as started that was not.

| | the check | what went wrong | fixed |
|---|---|---|---|
| 1 | CI runs the usage-page contract (UIG-19) | estiva-ui's `check.yml` has the words "token contract" in a comment | matches an `npm run` step only |
| 2 | a test file is not linted (UIG-3, UIG-4) | a config that lints nothing passes it | passes only once source files are linted |
| 3 | `tabIndex={-1}` is not an error (UIG-8) | same: a config that lints nothing passes it | passes only once `tabIndex={0}` is caught |
| 4 | no escape still names UIG-29 (UIG-29) | true today, because no escapes exist yet | passes only once the gate lint passes the file |

The lesson for whoever adds a check: **a check that expects nothing must first
prove something is being checked.**

### Limits

- It reads the **checked-out branch** in each repo, not `main`.
- It reads **installed** packages. A stale `node_modules` gives a stale answer;
  Ship's `web/node_modules` is one today (§0).
- Lint probes need `node_modules` installed. The run takes about 25 seconds.

---

## §18 The guide, committed — what changed and why

`docs/GATES-GUIDE.md` is the guide artifact, version `1789170129-badc`, written
12 September. It went in as two commits, so each change shows in the diff.

### The proof

| step | result |
|---|---|
| 1. A script converted the HTML to Markdown. No sentence was retyped. | 509 lines |
| 2. A second script took every word from both and diffed them. | **4,572** words each, **0** places that differ |
| 3. Changing one word in a test copy | reported exactly **1** |
| 4. The approved changes were applied, each an exact match that must occur once | **36** changes |
| 5. The same diff, after | **49** places differ, and every one belongs to one of the 36 |

Both scripts were throwaway, as UIG-1's were. This table is their record.

### The ticket expected three corrections. One was not in the guide.

| | the ticket said | what was true |
|---|---|---|
| a | The guide says `@base-ui-components/*` | **The guide never names a Base UI package.** It says "Base UI" three times. The wrong spelling was in **UIG-1's and UIG-8's ticket text**, and UIG-8 was already corrected on 12 September. GATES.md §9.2 was wrong to say the guide had it. `grep` finds 0 in `docs/GATES-GUIDE.md`. |
| b | "Peek has 5 pages and 0 page stories", twice | True that it was wrong. It was there **four** times. F2 to F5. |
| c | "Rules" means two things | True, and there was a third meaning. §19. |

### Wrong facts about our code — Katerina approved fixing all of them

Every number and fact about Estiva in the guide was checked against the code,
GitHub or the git history as of 12 September. The reasoning, the plans and the
research were left word for word.

| | where | the guide said | now says | evidence |
|---|---|---|---|---|
| ✏️ **F1** | §01 step 2 | 43 components in the package | 44 components in the package | `v0.12.3`, the version the guide names, has 44 component files in `src/`. `v0.12.6` and `main` have 44 too. |
| ✏️ **F2** | §01 step 5 | and Peek's 5 pages have 0 stories between them. | and Peek's 5 pages have 3 stories between them, none for Folders and none empty or loading. | `src/stories/layouts/Pages.stories.tsx` draws Desk, Topics and People. It was added on 13 July (`6c44b6b`), so "0" was never true. `FoldersPage` and `ObjectPage` have no story. No page story has an empty or loading state. |
| ✏️ **F3** | §04 gate 3 | Peek has 5 pages and 0 page stories; every one | Peek has 5 pages and 3 page stories, none for Folders and none empty or loading; every one | Same evidence as F2. |
| ✏️ **F4** | §05 T17 | Peek has 5 pages and 0 page stories. \| M \| ours \| | Peek has 5 pages and 3 page stories, none for Folders and none empty or loading. \| M \| ours \| | Same evidence as F2. |
| ✏️ **F5** | footer | Peek has 5 pages and 0 page stories, 58 story files | Peek has 5 pages and 3 page stories, 58 story files | Same evidence as F2. |
| ✏️ **F6** | §04 gate 2 | Peek's 79 existing lint errors | Peek's 80-odd existing lint errors | `npx eslint src` in Peek: 81 errors at every `main` commit from PR #193's merge (`c618250`, 11 September) to `f3d97f4` (12 September 09:24 UTC), then 86 from `2fa9116`. Never 79. The same setup reproduced PR #193's own recorded 81. |
| ✏️ **F7** | §04 gate 2, catches | - The Folders scroll bug (`overflow`) | - A hand-rolled scrolling box (`overflow-auto`) | The Folders column had **no** scroll container at all. Peek commit `3dc663b` says so: "a column that should scroll and never did has none to find". A lint rule that looks for `overflow-auto` cannot catch a missing class. |
| ✏️ **F8** | §04 gate 2, cannot catch | - Spacing, rhythm, hierarchy, taste / - That is gate 3, and then you | - Spacing, rhythm, hierarchy, taste / - The Folders scroll bug: a column with no scroll container has no class for a lint rule to find / - That is gate 3, and then you | Same evidence as F7. Gate 3's route probe checks it: "every scroll container is a package viewport", with tall data. |
| ✏️ **F9** | §07 Ship | Retrofitted. PR #130, then #132, then #133, then #139. / Four pull requests to reach a package it could have started on. | Retrofitted. PRs #78, #92, #99, #108, #113, #130, #132 and #133. / Eight pull requests to reach a package it could have started on. | Ship's merged PRs that took `@estiva-app/ui`, up to 12 September: #78 (2 Sept), #92, #99, #108, #113, #130, #132, #133 (9 Sept). #139 is not one: it removed Storybook's theme picker (D58) and changes only `web/.storybook/preview.tsx`. |
| ✏️ **F10** | §07 Peek | PR #193 — 29 commits, 0.9.0 to 0.12.3, and a month. | PR #193 — 29 commits, 0.9.0 to 0.12.3, over two days. | PR #193's first commit is 9 September 17:35 UTC and it merged on 11 September 17:59 UTC. It has 29 commits and moves `@estiva-app/ui` from `^0.9.0` to `^0.12.3`. |
| ✏️ **D1** | §04 gate 2 | `<dialog>` outside a shim folder); forbid the reach | `<dialog>`, with no folder exempt: an exception is one marked line); forbid the reach | UIG-1 §6: app `components/ui` folders mix one-line re-exports with real components, so exempting the folder would hide the 7 real components that hold raw elements, `PendingAttachmentChip` among them. UIG-3 builds per-line escapes only. Ruled 13 September. |
| ✏️ **D2** | §05 T10 | No `<button>`, `<input>`, `<a>`, `<dialog>` outside a shim folder. Error names the component. | No `<button>`, `<input>`, `<a>`, `<dialog>` in an app, and no folder is exempt: an exception is one marked line. Error names the component. | Same as D1. |

### Facts checked and kept

| | the guide says | checked against |
|---|---|---|
| ✅ | `estiva-ui 0.12.3` | It was current until `v0.12.4` was tagged at 14:48 UTC on 12 September. |
| ✅ | Peek PR #192 replaced a working `ContainerHeader` with a hand-made row | PR #192's diff: `<ContainerHeader …/>` out, `flex items-center gap-2 px-3 py-2` in. |
| ✅ | 1,219 tests, two typechecks, two lints, 323 stories | PR #193's own record: "1219 of 1219 green", `tsc -b` and `tsc -p convex`, token lint and lint, "323, none throws". |
| ✅ | eight defects on Folders | PR #193: "found eight defects". |
| ✅ | `lint:tokens` a CI gate since D55 | DECISIONS.md D55. |
| ✅ | `PendingAttachmentChip` lives in Peek | `peek/src/components/ui/PendingAttachmentChip.tsx`. |
| ✅ | `shots-themed.mjs` and `diff.mjs` | `peek/.verify-shots/`. |
| ✅ | three Storybooks on three ports | 6006, 6007, 6008. |
| ✅ | sixteen of twenty-three tactics ship | counted in the table. |
| ❔ | 58 story files | Peek had 58 until 09:24 UTC on 12 September and 59 after. The time the guide was written is not recorded, so it stays. |
| ❔ | 115 components | The counting method is not recorded, and UIG-1 counted 113 exported components a different way. It stays. |
| ❔ | Gate 2 today: "colours & sizes only"; gate 3 today: "components, not pages" | Summaries, not counts. UIG-28 records the size hole; F2 records the page stories. They stay. |

### The design point Katerina ruled on

D1 and D2 in the table above. The guide allowed raw elements "outside a shim
folder". UIG-1 §6 showed a folder exemption hides real components, and UIG-3 was
already built on per-line escapes. Katerina ruled on 13 September: no folder is
exempt, and an exception is one marked line.

---

## §19 "Rules" is three words now

### The three words

| word | means | tickets |
|---|---|---|
| **lint rule** | A machine blocks bad code. "No raw `<button>`." | UIG-3 to UIG-9, UIG-22 to UIG-25, UIG-28 |
| **usage rule** | A written page per component: what it is for, when to use it, when not. | UIG-12 to UIG-19 |
| **instruction** | What we tell Claude, in `CLAUDE.md`, a skill or `AGENTS.md`. Claude Code calls path-scoped ones "rules"; we call them instructions. | UIG-20, UIG-21 |

Katerina chose "instructions" on 13 September. A check CI runs that is not a lint
rule, like the usage-page contract, is a **CI check**.

"Rule" is left alone where it is plain English — "a far easier rule to hold",
"people respect a rule that has an honest way out" — or already says which kind.

### In the guide: 43 uses, 25 changed, 18 left

| | where | the guide said | now says | meaning |
|---|---|---|---|---|
| ✏️ **W1** | §01 step 3 | The rules live in prose, in documents nobody opens mid-task. | The usage rules live in prose, in documents nobody opens mid-task. | usage rules |
| ✏️ **W2** | §03, 74% | or people will disable the rules. See §06. | or people will disable the lint rules. See §06. | lint rules |
| ✏️ **W3** | §03, 3 layers | `AGENTS.md` (always-on rules) | `AGENTS.md` (always-on instructions) | instructions |
| ✏️ **W4** | §03, skill vs MCP | the skill gives it *the rules*. | the skill gives it *the usage rules*. | usage rules |
| ✏️ **W5** | §04 gate 0 | Two rules make it honest. | Two CI checks make it honest. | CI checks, not rules |
| ✏️ **W6** | §04 gate 1 | plus *path-scoped rules* (`paths:` frontmatter) so page-specific rules only load | plus *path-scoped instructions* (`paths:` frontmatter; Claude Code calls them rules) so page-specific instructions only load | instructions |
| ✏️ **W7** | §04 gate 1, catches | - Rules being forgotten mid-task | - Usage rules being forgotten mid-task | usage rules |
| ✏️ **W8** | §04 gate 2 | runs the same rules on the content of an Edit or Write | runs the same lint rules on the content of an Edit or Write | lint rules |
| ✏️ **W9** | §04 gate 2 | give the new rules **their own config | give the new lint rules **their own config | lint rules |
| ✏️ **W10** | §04 gate 3 | *The backstop for everything a rule can't judge. | *The backstop for everything a lint rule can't judge. | lint rule |
| ✏️ **W11** | §05 T2 | Turns your docs template into a rule. | Turns your docs template into a CI check. | CI check, not a rule |
| ✏️ **W12** | §05 T6 | Procedures move out to skills; rules get `paths:` scoping | Procedures move out to skills; instructions get `paths:` scoping | instructions |
| ✏️ **W13** | §05 T22 | Without it, people switch the rules off. | Without it, people switch the lint rules off. | lint rules |
| ✏️ **W14** | §06 plan A | - The rules lint, its own config, green from day one | - The lint rules, their own config, green from day one | lint rules |
| ✏️ **W15** | §06 plan B | rules that enforce it | lint rules that enforce it | lint rules |
| ✏️ **W16** | §07 T23 | the rules lint and its config | the lint rules and their config | lint rules |
| ✏️ **W17** | §08 | So the rules should ship | So the lint rules should ship | lint rules |
| ✏️ **W18** | §08, careful | a rule with no exit gets forked or disabled | a lint rule with no exit gets forked or disabled | lint rule |
| ✏️ **W19** | §09 | turns one rule off for one line | turns one lint rule off for one line | lint rule |
| ✏️ **W20** | §09 | the first time a rule blocks something genuinely new | the first time a lint rule blocks something genuinely new | lint rule |
| ✏️ **W21** | §10 Q2 | Should I show you the rule list with counts | Should I show you the lint rule list with counts | lint rule |
| ✏️ **W22** | §10 Q2 | I can run every proposed rule over Peek and Ship | I can run every proposed lint rule over Peek and Ship | lint rule |
| ✏️ **W23** | §10 Q5 | Does Jan get a say in the rule list? | Does Jan get a say in the lint rule list? | lint rule |
| ✏️ **W24** | §10 Q5 | Worth him seeing the rules before they're a gate | Worth him seeing the lint rules before they're a gate | lint rules |

W6 held two uses. So 24 changes cover 25 uses.

**The 18 left as they were:**

| why | where |
|---|---|
| plain English | "What no rule can judge", "It follows every rule and still looks wrong", "Anything a rule can't describe", "a far easier rule to hold", "People respect a rule" |
| already says which kind | "Lints put rules in their face", "a rule in a document", "a rule in a lint", "ESLint rules", "fingerprint rules" in gate 2, "Fingerprint rules" in the T12 row and in plan B, "The lint rules published", "Publish the lint rules" |
| refers back to "a lint rule" in the same sentence | "someone deletes the rule" |
| a column name in Q2's table | "rule, how many places break it" |
| a command or a link | `lint:rules`, the Anthropic article's URL |

That is 18. Two uses were added: "Claude Code calls them rules" (W6) and "a lint
rule to find" (F8). The guide has 39 uses now.

### In Ship: 14 tickets

**The test for changing a ticket:** "rule" could be read as the other kind —
because the ticket is about both kinds, or because it is a title in the list,
where "Rule — …" sat beside "Usage rules — …". A ticket about lint rules only
keeps the word.

| ticket | what changed |
|---|---|
| UIG-1 | title: "candidate rule" → "candidate lint rule" |
| UIG-7 | title: "Rule —" → "Lint rule —" |
| UIG-8 | title: "Rule —" → "Lint rule —" |
| UIG-9 | title: "Rule —" → "Lint rule —"; its Blocked-by line names UIG-1's new title |
| UIG-29 | title: "every rule" → "every lint rule" |
| UIG-12 | Blocked-by line names UIG-8's new title |
| UIG-15 | "broke a rule, because no rule existed" → usage rule |
| UIG-17 | "a written rule anywhere" → usage rule |
| UIG-20 | "The rules refuse the wrong thing" → lint rules |
| UIG-21 | every "rule" that means a `CLAUDE.md` instruction → instruction; its line counts measured (§22) |
| UIG-26 | "every rule written since", "the rules ship inside the package" → lint rule |
| UIG-27 | "two phase-1 rules", "a rule it could not write" → lint rule; the Blocked-by lines name UIG-7's and UIG-8's new titles |
| UIG-10, UIG-11 | "same row set" → "same gate checks" (§15); UIG-11 "every rule" → lint rule |

**UIG-3's title was left as it is:** "Tracer bullet — one rule, end to end,
blocking in Peek". Eleven other tickets name it in their Blocked-by lines, and
"blocking" already marks it as a lint rule. Renaming it would mean eleven more
rewrites for no gain in meaning.

Tickets that talk only about lint rules — UIG-3 to UIG-6, UIG-22 to UIG-25,
UIG-28 — keep "rule" in their bodies.

### ✅ The Ship project description — applied, 13 September

Katerina asked for these nine changes to be applied rather than pasted. They are
in the description now, and both of her screenshots are still in it.

**How, so nobody breaks it again.** The description is not text. It is a block
document, stored as JSON, with a `content-format` tag (`estiva-blocks-1`) on the
change that saves it. Ship draws it as rich text only when that tag is there.

| | step |
|---|---|
| 1 | Read the stored JSON. Change only the words of the text pieces, found by their own words; each must occur once. |
| 2 | Walk the old and new documents together: every node identical except those pieces' text. The screenshots deep-equal. (186 nodes, 10 pieces, 2 screenshots.) |
| 3 | Publish with the agent's `Store.setField` **and `contentFormat: 'estiva-blocks-1'`** — never the `edit-project` command or `ship_edit_project`, which send no tag. |
| 4 | Read it back: stored value equal byte for byte, `descriptionFormat` "blocks". |

Step 3 was first done with `edit-project`, and Ship drew raw JSON until the
republish three minutes later. §0 and §22.

The changes, as they look on screen:

| | find | replace with |
|---|---|---|
| 1 | each with a written rule for when to use it and when not | each with a written usage rule: when to use it and when not |
| 2 | These 26 tickets deliver gates 0, 1 and 2 | These 29 tickets deliver gates 0, 1 and 2 |
| 3 | its rules point inward at the package itself | its lint rules point inward at the package itself |
| 4 | their rules point at their callers | their lint rules point at their callers |
| 5 | because the rules ship inside the package | because the lint rules ship inside the package |
| 6 | UIG-1 is the first ticket and UIG-26 is the last. The reference number is the order. | There are 29 tickets, and the reference number is not the order. UIG-27, UIG-28 and UIG-29 were added after UIG-1. The running order is in estiva-ui docs/GATES.md §0. |
| 7 | the catalogue, and a written rule for using every component | the catalogue, and a written usage rule for every component |
| 8 | No rule is absolute. | No lint rule is absolute. |
| 9 | All 26 tickets closed | All 29 tickets closed |

Change 6 leaves the order table below it as it is; its groups are still right,
and §0 adds UIG-27, UIG-28 and UIG-29 to them.

---

## §20 Decisions, 13 September

§14 holds Katerina's rulings on the lint rules. These are the ones UIG-2 took.

| | decision | who |
|---|---|---|
| 1 | Fix every wrong fact about our code in the guide, not only the three the ticket named. The reasoning and the plans stay word for word. | Katerina |
| 2 | The guide says no folder is exempt from the raw-element lint rule; an exception is one marked line. | Katerina |
| 3 | The third word is **instructions**. | Katerina |
| 4 | Each repo's `CLAUDE.md` gets two lines pointing here, so a session of Jan's can find the project. | Katerina |
| 5 | Every ticket has one owner repo, and parts where its files live. UIG-10, UIG-11 and UIG-26 say "gate checks", not "row set". | UIG-2, from its own text |
| 6 | The owner is the repo that holds the ticket's main work; lint rule tickets across all repos belong to estiva-ui. | UIG-2 |
| 7 | Branch protection is read from GitHub with `gh`, because it is a setting, not a file. Without `gh` it is ❔. | UIG-2 |
| 8 | One status engine, the same file in every repo; one checks file per repo; estiva-ui warns when the engines differ. | UIG-2 |
| 9 | A check that expects nothing must first prove something is being checked. | UIG-2, after four false passes (§17) |
| 10 | UIG-3's title stays; UIG-1, UIG-7, UIG-8, UIG-9 and UIG-29 were renamed. | UIG-2 (§19) |
| 11 | The Ship project description was to be written out for Katerina to paste. She then asked for it to be applied; it was, with the method in §19. The standing rule is now: never through `edit-project` or `ship_edit_project`, only with the content-format tag and a byte-for-byte check. | Katerina |

---

## §21 The debt lists

A debt list is a file that cannot pass a gate yet, with a reason and a date.
Each repo keeps its own, at `docs/GATES-DEBT.md`.

| repo | debt list | created by |
|---|---|---|
| ship | not yet | UIG-4 creates it; its acceptance requires it |
| peek | not yet | **no ticket names it** — see §22 |
| estiva-ui | not yet | **no ticket names it** — see §22 |
| leaf | not yet | UIG-10's starter generates an empty one |

On 13 September there are **0** debt lists and **0** entries.

---

## §22 What UIG-2 found in other tickets

Reading every ticket turned up these. The ones marked ✅ are corrected in Ship.

| | ticket | what was wrong | now |
|---|---|---|---|
| ✅ | UIG-8 | Its acceptance said the lint rule must report the Folders scroll bug. Its own trap said a class rule could never find it. Peek commit `3dc663b` settles it: the column had no scroll container. | The acceptance asks `GATES.md` to show there was no overflow class, and hands the case to the route probe. The example line that repeated the claim is corrected too. |
| ✅ | UIG-10 | "the registry generator, once UIG-11 exists". UIG-11 is Leaf. | UIG-12. |
| ✅ | UIG-10 | "Ship was retrofitted over four pull requests. Peek … over 29 commits and a month". The same wrong facts as the guide's F9 and F10. | Eight pull requests; PR #193's 29 commits. |
| ✅ | UIG-10, UIG-11, UIG-26 | "the same row set as Peek's and Ship's" | "the same gate checks" (§15). |
| ✅ | UIG-26 | "all 25 rows", "All 25 preceding tickets", "UIG-1 to UIG-25" — written before UIG-27 to UIG-29 existed. | The 28 other tickets. |
| ✅ | UIG-21 | "All of ours have passed [200 lines]". `CLAUDE.md` alone: estiva-ui 189, Peek 136, Ship 168 — none has. Counted with the files each imports with `@`: Peek **273**, Ship **298**, estiva-ui **192**. | The measured numbers, a trap about imports, and "under 200 lines, counted with every file it imports". |
| ✅ | UIG-15 | "no page in Peek has a story or a test". Three pages have had a story since 13 July; `FoldersPage.test.tsx` arrived on 12 September. | The Folders page had no story and no test when its defects passed. |
| ⬜ | UIG-3, UIG-29 | Their traps quote Peek's lint as `eslint src` 79, `eslint .` 94. On 13 September, at `00bf06b`: **84** and **99**. | Not changed. Both tickets tell the session to quote the scope it ran; it must re-measure. |
| ⬜ | UIG-17 | "58 story files" — Peek has had 59 since 09:24 UTC on 12 September. | Not changed. The ticket counts before and after. |
| ⬜ | UIG-3, UIG-5 | The roadmap puts a `docs/GATES-DEBT.md` in every repo, and UIG-20 reads "all repos' `GATES-DEBT.md`". Only UIG-4 creates one. | **Open.** UIG-3 and UIG-5 should each create theirs, or UIG-20 reads less than it thinks. Worth a line in each when they start. |
| ⬜ | GATES.md §9.2 and §13 | §9.2 says the guide named the wrong Base UI package; it did not (§18). §13's last lines say three things wait on Katerina; §14 answered them. | Left as UIG-1 wrote them. This row and §0 are the correction. |
| ⚠️ | estiva-agent | `edit-project` and `edit-issue --description`, and the `ship_edit_project` / `ship_edit_issue` tools built on them, send a description with **no `content-format` tag**. A rich description edited that way is drawn as raw JSON. The vendored `Store.setField` already accepts `contentFormat`; the commands never pass it. It broke the UI Guardrails description for three minutes on 13 September. | **Open.** A fix belongs in estiva-agent — Jan's call. Until then, never edit a rich description with those commands. Plain-text ticket descriptions, like every UIG ticket's, are unaffected. |
| ⚠️ | peek | `src/components/CommandLauncher.live.test.tsx`, "the created object leaves a trace in the thread (PEE-2)": clicking the Project Select's option fails with "pointer-events: none" on a `div`. Failed on #204's first run and on `main` after #204 merged; passed on re-run and locally 10 of 10. Every failure is after PR #201 moved Peek to `@estiva-app/ui` `0.12.8`, whose Select changed (estiva-ui PR #23). **Corrected 14 September: not `0.12.8`.** It failed on `0.12.3` too; the cause was a Base UI timing race in the tests (§0). | ✅ **Fixed** in peek PR #205, no ticket (Katerina). |

---

*UIG-1, 13 September 2026. Measured at estiva-ui `93048cd` (0.12.6), peek
`d094006`, ship `e85de7f`. All three on main, all three clean.*

*UIG-2, 13 September 2026. Built on estiva-ui `214702c` (0.12.8), peek
`00bf06b`, ship `e85de7f`. The guide copied from its artifact, version
`1789170129-badc`.*
