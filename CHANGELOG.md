# Changelog

## 0.14.0 — 2026-09-15 — migration stage 6 and UIG-28

Two pieces of work in one release, by Katerina's word (migration D69, amended
2026-09-15): the migration's stage 6 — the last primitives onto Base UI, a
small `TextInput`, three toasts at once, the avatar's initials centred, a
quieter section empty state — and the UI Guardrails' UIG-28 — the token lint
stops hand-written sizes, corners, shadows and inline colours, and the package
gains `text-small`. What each app changes to take it: migration docs
`ADOPTION.md` P34 (Peek) and S35 (Ship).

### Migration stage 6 — the rest of the primitive tier

**The last primitives move onto Base UI.**

#### Added

- **`TextInput` takes `size="small"`: 24px tall, 12px text** — the small
  `Select`'s trigger, class for class (D67, ADOPTION B35). Peek's reference
  widget hand-built a 24.41px field beside two small selects because this was
  37.59px; it swaps once it takes this release. `size` replaces the native
  attribute of that name, which counts characters: no `TextInput` or
  `ToolbarInput` in Peek or Ship passes one (both `main`s, 2026-09-14).
  `ToolbarInput` passes `size` on to its field. Measured beside two small
  selects in both themes: all three 24px, same radius, padding, fill and
  hairline, and the words' ink on the same pixel rows. The default size is
  unchanged: 45 stories holding a text field identical in both themes. A first
  test file; making small 28px fails it.

#### Changed

- **A section's empty state is the quiet line: 12px caption in the muted
  colour** (Katerina, 2026-09-15, D71), where it was 14px body text in the
  secondary colour. Beside rows it read as one more row. It is now the look a
  `Field`'s helper line has. `page` is unchanged. Contrast: 3.94:1 on the page
  background in signal, below AA for small text; 6.08:1 in ship — parked with
  the rest of contrast (PLAN stage 0.10), and the two section stories carry the
  exception. No caller writes anything; the line is 5.2px shorter, so a panel or
  dialog holding one is shorter by that and what sits under it moves up. Callers:
  Peek 12 (`TopicActivity`, `TopicProjectPanel` ×2, `ActivityTimeline`,
  `ProjectTickets`, `StarredSection`, `FileThreadView` ×2, `FileTreeView`,
  `FolderContentsView` ×3), Ship 5 (`Activity`, `ConversationThread`,
  `History`, `NewIssueDialog`, `ProjectView`). Proof: of the package's stories,
  only *Section* and *Inside the rows box* change, on the line alone; of the
  apps' stories that draw one (65 Peek, 53 Ship), 17 and 4 change, each on the
  line and what sits below it.
- **`Divider` is Base UI's `Separator`** (D6, D66). It wrote the `separator`
  role and `aria-orientation` by hand; Base UI writes both and adds
  `data-orientation`. Props, classes and the labelled line are unchanged.
  Proof: all 59 stories that draw a divider (its own, and every menu, toolbar,
  popover, select, preview card and reaction picker) identical in both themes.
  No caller changes.
- **`Property` is a name and its value in HTML's own markup** (PLAN stage 6):
  a `<dl>` holding the label as `<dt>` and the value as `<dd>`, where it was two
  `<div>`s and a `<span>`. Base UI has no part for it. The `<dd>` draws no box
  (`display: contents`), so a caller's value still lays out as a child of the
  row — Peek's reference widget passes a form with `flex-1` that must keep
  filling it. Proof: 16 stories identical in both themes (Property, Select, the
  tokens page); Chrome's accessibility tree reads `term("Status") · definition`
  for every row; a first test file (5 tests) fails on the old component. No
  caller changes.
- **`Reaction` is Base UI's `Toggle`** (D6, Finding 19). It gains
  `data-pressed` beside `aria-pressed`, a test file and a Keys table, which it
  arrived without. `pressed` stays the caller's: a press calls `onClick` and
  the pill keeps what `pressed` says. Two native props leave its type, because
  `Toggle` ignores them: `type` (always `"button"`) and `value`. No caller in
  Peek or Ship renders a `Reaction` (checked on both `main`s, 2026-09-14), so
  nobody passes either. Its count doc said a `0` "is not drawn"; the component
  always drew it, and the doc now says not to render a reaction with no count.
  Proof: its 9 stories and `ReactionPicker`'s identical in both themes; 5 tests,
  one failing on the old component and two when `pressed` becomes uncontrolled.
- **`ToastProvider` is Base UI's `Toast`, and three toasts stand at once**
  (D6, D7). Before, a new toast replaced the standing one and nothing was
  announced. Now:
  - up to **three** show, bottom-left, the newest nearest the corner; a fourth
    hides the oldest until one of the three closes, so a warning kept up with
    `durationMs: 0` comes back rather than being lost;
  - the stack is a region named "Notifications", announced politely; an
    `error` toast is announced at once;
  - the timers pause while the pointer or focus is on the toasts, and while
    the window is in the background;
  - F6 moves focus to the toasts, Escape closes the focused one, and a toast
    can be swiped away left or down;
  - the portal, the timer and the one-toast state are gone from this file.

  **API.** `showToast` returns the toast's id (it returned nothing).
  `dismissToast(id?)` takes it: with an id it closes that toast, with none it
  closes every toast. **The action closes its own toast** and runs `onAction`
  only if given, so `actionLabel` alone is a Dismiss. `Toast`, the pill drawn
  in place, is unchanged.

  **Callers.** Peek passes `onAction: dismissToast` in two places —
  `lib/reportDelete.ts:38` and `pages/TopicsPage.tsx:162`. Pressed with other
  toasts on screen, that now closes all of them; drop the `onAction` and keep
  `actionLabel: 'Dismiss'` (ADOPTION P34). Ship calls `showToast` once
  (`App.tsx`) and its code needs no change, but **each toast is now a
  `dialog`** to assistive tech (not modal), and `web/src/App.test.tsx:170` waits
  for "no dialog" after creating a project — the toast answers it. Name the
  dialog: `queryByRole('dialog', { name: 'New project' })` (ADOPTION S35,
  measured 25/25).

  Proof: a live toast from the provider photographed and style-diffed (every
  element's box, colour, border, shadow, padding, type) before and after,
  plain and with an action, both themes: identical. In Chrome: three stacked
  8px apart, the fourth hid the kept-up warning, which came back once the
  others expired; hovered for 6s nothing closed; F6, Tab, Escape; drag left
  or down closes, right or up does not. 10 tests (it had none), 9 failing on
  the old provider; breaking the one-toast close, the hidden class or the
  error priority each fails one. Stories: every Toast and Banner story
  identical but *From the provider*, which gained a *Keep one up* button.
- **`Avatar` is Base UI's `Avatar`** (D6). Base UI watches the picture load
  and draws the initials or the silhouette as its fallback; the hand-kept
  `broken` state is gone, and a new `src` after a failed one is tried again
  (the old tile stayed on the initials). The picture keeps today's three
  moments, by Base UI's `keepMounted`: while it loads the tile is empty, when it
  arrives it fills the tile, if it fails the initials show. Base UI's default
  would have shown the initials while loading and swapped them out, and would
  not put the `<img>` in the page until it had loaded — which Peek's
  `TopBar.avatar.test.tsx` looks for. Measured live in Chrome with a picture
  held back 3s and one answered 401. Props, classes and the tile's `div` are
  unchanged. Every story, 287, identical in both themes.
- **`Avatar`'s initials are centred on their capitals** (D27, ADOPTION B11) —
  cap height to baseline, through CSS `text-box`, instead of the line box. This
  moves pixels. Measured as ink against tile in Chrome, every size at eight
  sub-pixel positions, both themes:

  | size | before: average lean | after | worst, before → after |
  |---|---|---|---|
  | 22px | 0.27px low | 0.02px | 0.71 → 0.46px |
  | 24px | 0.66px high | 0.03px | 1.10 → 0.47px |
  | 28px | 0.44px high | 0.06px | 0.88 → 0.50px |
  | 32px | 0.19px high | 0.06px | 0.63 → 0.50px |
  | 16, 20, 36px | within 0.06px | within 0.07px | 0.50 either way |

  Any one face can still be up to half a pixel off: the screen rounds text to
  its pixel grid wherever the tile lands, and no CSS decides that. So a given
  avatar can move down, up, or not at all. In the package's stories 11 of 287
  change in each theme, each by the letters of one 24px face (Person, TopBar,
  AppShell, IdentityMenu, Avatar sizes); in the top bar the letters went up a
  pixel, where that position happened to round the other way. A browser without
  `text-box` draws the old line box; support was checked in Chrome 152 only.
  Both apps change wherever a face shows initials.

### UIG-28 — the two holes in the token lint

**The lint now stops a size, a corner, a shadow or a colour written by hand.**
`text-sm` was blocked and `text-[14px]` was not; `bg-[#fff]` was blocked and
`style={{ color }}` was not (UI Guardrails UIG-28; Katerina's rulings B11, B12
and C3 of 13 September, R1–R5 of 15 September; `docs/GATES.md` §0).

#### Added

- **`text-small`: 10px, a size and nothing else.** A theme's smaller label:
  under `signal:` or `ship:` it shrinks the token beside it and keeps that
  token's line height and weight (`text-caption signal:text-small`). Letter
  spacing, where a label wants some, is Tailwind's own step. Katerina compared
  three tokens, one and none side by side, and picked one. In `cn`'s ramp, and
  on the Design Tokens page.
- **Lint, errors:** type written by hand (`text-[…]`, `leading-[…]`,
  `tracking-[…]`, under any variant, arbitrary ones included), corners
  (`rounded-[…]`), shadows (`shadow-[…]`, `drop-shadow-[…]`), and an inline
  `style` that sets a colour, a font size, a border or a shadow. A hand-written
  size names its token: "`text-[14px]` … Use text-body-2 or …".
- **Lint, warnings:** heights and spacing (`h-[240px]`), border and ring widths.
  Reported, never blocking: the preset has no spacing token.
- The new rules sit under their own names, `token-values` and `token-spacing`,
  so the four older rules are unchanged (byte for byte) and an escape for a size
  cannot silence a raw colour. Test files are not checked. Seven probes in
  `gates:status`, each seen to fail with its rule removed.

#### Changed

- **Every hand-written type size, corner and shadow in the package is a token:
  93 of 93, none escaped.** 31 were a token already, written out (photos, every
  story in both themes: identical). The rest, by Katerina's pick after photos:
  - Chip, Kbd, Reaction, the Enter hint's target and SectionLabel take
    `text-small` in signal (and ship, for Kbd) with Tailwind's spacing:
    SectionLabel's capitals are a little tighter (0.14em → 0.1em), Chip 0.3px
    wider (0.02em → 0.025em). Kbd and Reaction do not move.
  - `AttachmentCard`: the name is `text-caption`; the "PDF · 2.3 MB" line is
    `text-small tracking-wide leading-tight` and sits about a pixel higher; the
    file tile's type label is `text-menu`. Its class maps are named
    `…_CLASSES`, so the lint reads them.
  - `Property`'s label: `tracking-widest` (0.08em → 0.1em), as are the Design
    Tokens page's headings.
  - The small `Select` and small `TextInput`: `text-caption`; the reaction and
    picker emoji: `text-body-1` / `text-h3` with `leading-none`. No pixel moves.
  - Stories: Popover's paragraph and PreviewCard's lines use the ramp's line
    height, so they sit closer.
- Three inline styles keep what they draw, with the reason in an escape:
  `Avatar`'s per-person palette, `AvatarGroup`'s ring width from `ring`, and the
  Design Tokens page's swatches.

Photos, every story, signal and ship, each step against the one before: the
exact tokens 0 of 576 changed; `text-small` changed 26 in signal (SectionLabel
and what holds one, Chip) and 0 in ship; the rest changed 17 in each theme
(AttachmentCard 13, Popover, PreviewCard, Property 2). Every difference was
looked at.

## 0.13.1 — 2026-09-15 — UIG-27

**`Card` holds its hover look while its own menu is open, and the selected
card keeps its pointer.** Found adopting 0.13.0 in an app: a card in a feed
stays lit while its ⋯ menu or emoji picker is open. The menu opens outside the
card, so the pointer on it has left the card, and a card lit only by the
pointer went dark under its own menu (measured: the card lit, `:hover` false).
Katerina, 15 September: fix it in the package, as 0.13.1.

### Added

- **`Card` `hovered`** — draws the hover look now, whatever the pointer does:
  `hover="fill"` lights up and shows its hairline; a link's hairline goes one
  step stronger. Ignored while `selected` or `active`, as the pointer is. The
  app sets it from its own state: on when the pointer enters, off when it
  leaves and nothing of the card's is open. New story, *Held while its menu is
  open*.

### Fixed

- **A selected `Card` with an `onClick` keeps `cursor-pointer`.** It can still
  be clicked: it opens again. The one being changed (`active`) still has none.
  0.13.0 took the pointer from both.

## 0.13.0 — 2026-09-14 — UIG-27

**Five components the apps had to build themselves: `Link`, `InlineChip`,
`ProgressBar`, `Card` and `AttachmentCard`.** Both apps hand-wrote every link
they have (18 raw `<a>` on 13 September, plus 2 through Peek's router), Peek had
the only inline chip and the only attachment cards, in its own code, each app
drew its own progress bar, and 18 cards were drawn by hand across the two.
Nothing a caller writes has to change; the apps take these in UIG-27's own app
PRs.

### Added

- **`AttachmentCard`** — a document or an image attached to something, posted
  or waiting to be sent: Peek's `FileAttachmentCard` and
  `PendingAttachmentChip`, class for class, drawn on `Card`'s frame (Katerina,
  14 September: both apps draw one; Ship's files become this card). The file
  decides the shape — an image with a picture is a 180px thumbnail, anything
  else a 240px row — and `pending` is the composer's 200px row with a remove
  control. It fetches nothing: the app passes `src`, `href` and `state`, and
  takes the clicks back through `onOpen`, `onDownload` and `onRemove`. Measured
  element by element against Peek's stories (every element's box, colour, type,
  hairline and padding): identical for a document, an image, a tall image, no
  address, a long name, several together, and pending ready, ready document,
  uploading, failed and warning. Two changes, by ruling: a file that could not
  be read has a dashed hairline; and a name shows in full on hover only when it
  is cut off, on every card, posted as well as waiting — a name that fits and a
  size show nothing (Katerina, 14 September; Peek's posted cards had no way to
  read a cut-off name, and its waiting card showed the name and the size on
  every hover). A note's `noteHint` is still always on hover. The remove control
  and the picture are buttons on Base UI's `Button`, as InputChip's ✕ is (her
  ruling: not `IconButton`, whose 24px square is a different control).
  Screenshots of every story are identical pixel for pixel before and after, but
  for the warning's note: Peek's clipped 3 pixels off its last letter, and this
  draws it whole. (Peek's *Every type* story draws `.heic` as a broken image,
  where its own comment says it lands on the file glyph; this story draws the
  glyph.)

- **`Card`** — a box that stands for one thing, drawn as its frame: 8px
  corners, a fill, a hairline; no padding or layout of its own. Katerina's
  rulings, 14 September, from photographs of the 18 cards in both apps:

  | | |
  |---|---|
  | `fill` | by what the card sits on: `surface` (the page), `elevated` (something already filled), `inset` (inside something filled), `none` |
  | the hairline | follows the fill — default on `surface` and `elevated`, subtle on `inset` and `none` |
  | `href` | the whole card is a `Link`; its hairline goes one step stronger on hover |
  | `hover="fill"` | a card in a feed lights up; `quietUntilHover` hides its hairline until then |
  | `selected` · `active` · `attention` | the one you are on · the one being changed · a hairline for something new (`accent`) or urgent (`warning`) |
  | `unreadable` | a dashed hairline, in both apps |

  Measured against the cards it replaces, corners, hairline and fill at rest and
  on hover: identical to Ship's project card (link), Ship's object card and its
  can't-read state, Peek's file card, Peek's project box, and Peek's
  conversation card at rest, on hover, selected, unread, urgent and editing.
  Ship's board card moves from 6px to 8px corners, as ruled. A card that never
  changes carries no transition; the apps' still cards disagreed (some had one),
  and nothing animates on a card that does not change.

- **`Link`** — a real anchor in one of four looks, with navigation left to the
  app's router through `onClick`, the way `NavItem` does it. Katerina's
  rulings reduced the apps' five looks to these:

  | look | what it is | where the apps had it |
  |---|---|---|
  | `text` | the info colour, always underlined, dims on hover | a link inside a message body |
  | `quiet` | its text's colour and size, underlines on hover | a title, a reply's timestamp, a title in a table |
  | `underlined` | its text's colour, always underlined, brightens on hover | "Open in app ↗" (was dotted) and "Open it there" |
  | `plain` | no look; what it wraps draws itself | a card or a row that is a link |

  `external` opens a new tab with `noopener noreferrer`. `text` measures
  identical to Peek's body link, 24 computed properties at rest and on hover;
  `quiet`'s underline is identical to Peek's timestamp.

- **`InlineChip`** — Peek's inline chip (D67), a word in a sentence one line
  high, in four tones: `neutral`, `person` (Peek's `mention`), `urgent`,
  `quiet`. `href` makes it a link. `inlineChipClassName(tone)` and the two class
  maps are exported for an editor that renders chips from strings. Measured
  against Peek's chips: 24–26 computed properties identical for neutral,
  person, urgent and a chip with an icon.

- **`ProgressBar`** — on Base UI's `Progress`, which owns the `progressbar`
  role and its numbers; `label` is required. Ship's props, unchanged
  (`value`, `max`, `label`), and both apps' looks, kept because they do
  different jobs: `default` is Ship's, 6px with the success colour, a bar
  someone reads; `quiet` is Peek's, now 4px (Katerina, 14 September; Peek's is 3px) with the muted success colour, a glance
  beside a count. Measured: `default` identical to Ship's bar at 10 of 14,
  empty and complete, track and fill, width and share included; `quiet`
  identical to Peek's but for the height. A screen reader now hears the share as a percentage.

### Documented

- **Where a section's empty state goes** (Katerina, 14 September): inside the
  box its rows live in, with no padding of its own. The box is written once and
  holds the rows or the empty state, so its padding places both. `EmptyState`
  gets no padding prop. A new story, *Inside the rows' box*, draws the same box
  with rows and empty; measured, the line starts where the first row does, 17px
  from the box's corner both ways. A test pins that a section carries no padding
  or margin. The four stories that were there draw byte-identical HTML.

- **Storybook has a Components group, right below Inputs** (Katerina, 14
  September): `AttachmentCard`, `InlineChip`, `Person`, `PersonTrigger`,
  `Reaction` and `ReactionPicker`. Until now it held only `Reaction`, sorted
  after every named group. A saved link to the pages of `Person`,
  `PersonTrigger` or `ReactionPicker` changes address.

### Fixed, against Peek's copy

- **The quiet chip is 19.6px tall, like every other chip.** In Peek it is
  16.8px — `1.4em` of its caption size — with its letters 1.81px above the
  sentence's baseline. Here its height is written out, and they sit 0.41px
  off. Peek's copy keeps the 16.8px box until it takes this one.

## 0.12.10 — 2026-09-13

**Every toolbar in a Popover is its old size again, and the Capped story
draws its panel.** Katerina, in Peek: *"the toolbar has changed size. Why
did this happen."* — and in this Storybook: *"the capped story doesnt show
anything."*

### Fixed

- **A caller's padding replaces the 8px again, instead of adding to it**
  (PLAN Finding 60). `0.12.6` moved `Popover`'s and `Menu`'s padding onto
  the scrolling content so the scrollbar would hug the panel (D63), and
  gave callers no way to set it there. A toolbar that asked for `p-1` on
  `className` had replaced the panel's 8px; from `0.12.6` it sat on the
  panel *and* the content kept its 8px. Measured, toolbar to panel edge:

  | | `0.12.5` | `0.12.6`–`0.12.9` | now |
  |---|---|---|---|
  | `Popover/A toolbar` | 5px, 299 × 38 | 13px, 315 × 54 | 5px, 299 × 38 |
  | `ReactionPicker/From a trigger` | 5px, 158 × 38 | 13px, 174 × 54 | 5px, 158 × 38 |
  | `Toolbar/On an existing surface` | 5px, 90 × 34 | 13px, 106 × 50 | 5px, 90 × 34 |

  The open panels are byte-identical to `0.12.5`'s. The scrollbar still
  hugs the panel.

  `0.12.6`'s entry said *"238 byte-identical"*. It could not see this:
  those stories draw the popover closed, behind its trigger.

- **The `Popover/Capped` story anchors on its marker element** (PLAN
  Finding 61). Arriving at it from another story read the marker's rect
  before the canvas was laid out — 0 × 0 at the corner — and drew a 0px
  panel. Measured now, first load and arriving from another story alike:
  240 × 162, under the marker. **`0.12.6`'s entry below says this was
  fixed. It was not: the story still read a rect.** That sentence was
  written without the change being committed.

### Added

- **`contentClassName` on `Popover` and `Menu`** — the padding around the
  children, default `p-2`. A toolbar asks for `contentClassName="p-1"`.
  `className` is the panel's width, not its padding.

### Callers — each moves its padding off `className`

- **Peek** `components/ui/SelectionToolbar.tsx`, `components/ConversationQuickMenu.tsx`
  (`p-1` → `contentClassName="p-1"`); `components/ReadStatePanel.tsx`
  (`p-2` on the panel added to the content's 8px — remove it);
  `components/ScreenerLaterMenu.tsx` (`Menu`, `p-1` → `contentClassName="p-1"`).
- **Ship** `web/src/components/ConversationThread.tsx` (`p-1` →
  `contentClassName="p-1"`).

## 0.12.9 — 2026-09-13

**ChipInput's field keeps its name once a chip is in it** (PLAN Finding 6,
which stage 5 was meant to clear and did not). Nothing a caller writes has
to change, and nothing a person sees moves: all five `ChipInput` stories
are byte-identical in both themes, with the list open too.

### Fixed

- **The first chip no longer takes the field's name away.** Chrome names an
  empty chip field by its placeholder, and the placeholder is not drawn
  once a chip is in. Measured in Chrome's accessibility tree:

  | | before | now |
  |---|---|---|
  | on its own, no chip | "Search people…" | "Search people…" |
  | on its own, a chip | **""** | "Search people…" |
  | inside a `Field`, chip or not | the label | the label |
  | a caller's `aria-label` | **dropped, ""** | the caller's |

  Inside a `Field` it was always named: Base UI points the input's
  `aria-labelledby` at the `Field`'s label. The defect was only outside
  one — Peek's huddle To: field is such a place.

### Added

- **`ChipInput` takes `aria-label` and `aria-labelledby`**, the same pair as
  `Tabs`. With neither, the placeholder is the name. Only a name that exists
  is passed to the input: Base UI copies a caller's prop over its own even
  when it is `undefined`, so an empty `aria-labelledby` would wipe a
  `Field`'s. A test pins that.

### Changed

- **`InputChip`'s ✕ is Base UI's `Button`** (D6), as every other button in
  the package is. Base UI has no chip of its own — `Combobox.Chip` throws
  outside a combobox — so the ✕ is the one part of a chip standing alone
  that it has a counterpart for. Inside a `ChipInput` the ✕ was already
  Base UI's `ChipRemove`. Measured against `0.12.8`: every computed style
  the same at rest, hovered and keyboard-focused; the button gains
  `tabindex="0"`, which Base UI gives every button.

## 0.12.8 — 2026-09-13

**Select's list is the package's one list.** Katerina: *"i thought we were
getting the menu items and scrollbar position from estiva-ui. pls fix
them in select AND Chip input."*

### Changed

- **`Select`'s panel is `MenuPanel` and its rows wear `MenuItem`'s look**,
  the same list `Menu`, `Popover` and `ChipInput` draw. Before, Select
  spelled out its own box and its own row. Measured against Katerina's
  reference — Peek's `[` menu — with one probe:

  | | rows in from the edge | thumb from the edge | thumb clear of the rows |
  |---|---|---|---|
  | the reference | 9px | 3px | yes |
  | Select before | 5px | 7px | no |
  | **Select now** | **9px** | **3px** | **yes** |
  | ChipInput (0.12.7) | 9px | 3px | yes |

  **The label does not move** — it sits 17px from the panel's edge before
  and after, at 14px, because the panel's padding went 4px → 8px while the
  row's own went 12px → 8px. What you see change is the highlight, which
  now stops 8px short of the edge with the scrollbar in the gap, and the
  highlight no longer fades (as in every menu, Katerina 2026-09-05).
  Select keeps what is its own: the ✓ and the chosen row in medium weight.

- **Select's padding is on its scrolling content, not its panel** (D63) —
  the half of the fix that moves the thumb. The cap loses its `- 0.5rem`
  for the same reason Menu's lost its `- 1rem`: the padding is inside the
  box that scrolls now, so 288px stays 288px.

## 0.12.7 — 2026-09-13

Stage 5 of the migration, the package half. **Nothing a caller writes
changes**, and nothing a person sees moves — every `ChipInput` story is
byte-identical. What changes is what the field *is*.

### Changed

- **`ChipInput` is a combobox over a listbox**, on Base UI's `Combobox`
  with `multiple`. Focus stays in the text while the arrow keys move
  through the suggestions, and the highlighted row is named through
  `aria-activedescendant`. Before, the rows were plain buttons in a
  `<div>` and a screen reader was told nothing.

  The component still decides what is its business and not the part's:
  which options are on offer (never the chosen, never the excluded), that
  a match is on the label *or* the description, that the list opens only
  once you type, and that Backspace on an empty query takes the last chip.
  Escape clears a query and keeps the key; with nothing typed it lets the
  key through to the dialog around the field.

  **The list hangs from the field, not from its input** (PLAN Finding 57).
  Base UI places a combobox's list against the input by default, and in a
  chip field the input sits inside 12px of padding and a border — the
  list came out 358px under a 384px field. It is anchored on the field.

  Peek's `PersonChipInput` needs no change: checked on a copy of Peek with
  this build, typecheck clean and all 1286 tests.

### Removed

- **`fit.ts`** and its test. `ChipInput` was `fitMenu`'s last caller (PLAN
  Finding 22); Base UI's positioner does the flipping and the clamping,
  against the element itself rather than a rect read a frame earlier.
  `fit.ts` was never exported, so no caller can have depended on it.

### Added

- **`ChipInput` has tests** — nine, where it had none, pinning every
  promise its page makes.

## 0.12.6 — 2026-09-13

**The scrollbar hugs the panel, in every menu and every popover.**

### Fixed

- **A `Menu`'s and a `Popover`'s scrollbar sat 9px inside the panel**
  where every other scrolling surface in the suite draws it at 1px.
  Katerina, reading the `Popover/Capped` story: *"there is this gap on
  the right side of the scrollbar and it's not like that in other
  places so it's wrong."* Measured: `Popover` and `Menu` **9px**,
  `DialogShell` **1px**.

  The cause, and `DialogShell` already had it right and said so in its
  own comment: the padding was on the **panel**, so the scrolling box
  sat inside it and the bar was drawn beside the padding instead of
  over it. The padding is on the scrolling box's **content** now, at
  the same 8px, in both components.

  **Nothing else moves.** The rows keep their 8px inset — the padding
  that was the panel's is the content's — and the height cap loses its
  `- 1rem` for the same reason: the padding is inside the scrolling box
  now, so the panel is exactly as tall as Floating UI allowed. Checked
  across this package's 243 stories: **238 byte-identical**, and the
  five are `Popover/Capped` (the bar, and its own anchor fix) plus four
  whose skeletons pulse.

  **A caller's `className` still lands on the panel.** A caller that
  wants different padding around a scrolling menu sets it through
  `MenuPanel` directly, which is what that component is for.

- **The `Popover/Capped` story anchored on a rect of its marker rather
  than on the marker**, so in a Storybook canvas the panel hung off a
  position read before the page had settled — the story looked like a
  line of text with no panel at all. `anchor` takes an element, and an
  element is re-measured. A rect is for a caller that genuinely has no
  element, as Peek's type-ahead popups have only the caret's.

## 0.12.5 — 2026-09-12

One prop, found by Peek's type-ahead menus moving onto `Popover` (D47).

### Added

- **`Popover` takes `maxHeight`** — a cap on the scrolling box, as a class:
  `maxHeight="max-h-[360px]"`. Without one a panel grows to the room the
  positioner has, which is right for a panel as tall as its content and
  wrong for a long list.

  **Why it cannot go on `className`.** That lands on the panel, and the
  panel's children sit inside a `ScrollArea` whose viewport carries its
  own cap — so a `max-h` on the panel is overrun and the content draws
  straight through the panel's border. Measured with Peek's `/` menu on
  2026-09-12: a 400px panel with 559px of rows hanging out of the bottom
  of it. The cap belongs on the viewport, which is how `DialogShell` has
  taken `bodyMaxHeight` since `0.12.2` (B19). This is the same gap in the
  other component — ADOPTION **B31**.

  **What a cap is for, beyond tidiness.** A panel taller than the room
  above *and* below its anchor is not flipped by the positioner: it is
  moved to the **side**. Measured on the same menu — 724px tall, and it
  arrived to the right of the caret, full-window height, where a
  type-ahead belongs above the caret it is completing. A cap keeps the
  choice between above and below.

  It replaces the available-height cap rather than adding to it, so a
  caller that sets one owns it. `Popover/Capped` is the story.

## 0.12.4 — 2026-09-12

One fix, and it is half of 0.12.3's second change taken back out.

**Taking this puts a `Button` back where its caller puts it.** Nothing
else moves. Peek is not affected at all — 0 of its 327 stories — and in
Ship it is the four actions in `ProjectRail`, which go back to the left
edge they sat on before 0.12.3.

### Fixed

- **A `Button` no longer says `self-center`.** `IconButton` keeps it;
  this never needed it. The difference is the `h-8` / `h-6` a Button sets
  for itself: `align-items: stretch` only stretches a child whose cross
  size is `auto`, so a Button could never be stretched, with the class or
  without it. Measured in Chrome on 2026-09-12, in the same 260px row
  Finding 49 came from: **Button 32px with `self-center` and 32px
  without; IconButton 24px with and 226px without.** Only one of the two
  was ever at risk.

  What the class did do was decide the **other** axis. `align-self` beats
  the parent's `align-items`, so in a column a Button ignored the
  `items-start` its caller had asked for and centred itself. Found taking
  Ship to `0.12.3` (ADOPTION S31): its `ProjectRail` actions — "Copy
  Folder link", "Pair with another Folder…", "Archive project", "Delete
  project" — moved from x=1006 to x=1078/1053/1083/1006, with nobody
  asking. **Five of this package's own story frames had the same done to
  them**: `Menu/FromATrigger`, `MenuItem/SubmenuLive`, `Popover/AToolbar`,
  `Popover/FlippedForRoom` and `Popover/FromATrigger` each say
  `items-start … pt-6`, and each was getting a centred trigger instead.
  They draw what they ask for again.

  A control does not get to decide where its caller puts it. The tests
  hold both halves — the height it states, and the alignment it does not
  — and `Button/InATallRow` and `Button/InAColumnThatAsksForTheLeft` are
  the two pictures.

## 0.12.3 — 2026-09-11

Two fixes Katerina found reading Storybook, both about a control's own
size. Neither adds a prop; both change what something measures, so read
the note on each before taking this.

**Taking this moves every menu in both apps by 4.41px a row.** Nothing
else moves unless a button was being stretched, which nothing in either
app was doing outside a story.

### Changed

- **A default menu row is never shorter than 36px** (`min-h-9`). It had no
  floor at all: height came from 14px text and 6px of padding, which lands
  at 31.59px. Peek's Later menu had been forcing `h-9` — exactly 36px —
  since it was written, and was the only menu in either app out of step
  with the other six. Katerina ruled the package was what should change
  (2026-09-11): *"menu item height in the estiva-ui should be 36px and
  peek should stop forcing it there, it should naturally get the
  package's one"*. `tall` keeps its own 40px floor, and a row with a
  description still grows past both. Measured after: every menu row in
  every story in this Storybook is 36.00px, none excepted.

  **This moves every menu in both apps** — six in Peek, and Ship's — by
  4.41px a row. That is the point of it, but it is not a silent change.

- **A button cannot be stretched by the box it is dropped into**
  (`self-center` on `Button` and `IconButton`). `shrink-0` stopped a flex
  parent squashing a button; nothing stopped one stretching it, and a flex
  parent with no `items-*` stretches every child to its own height — so
  the ⋯ trigger in Peek's `TopicMoreMenu` story measured **24 wide and 228
  tall**. The apps never showed it because every real row says
  `items-center`; only the stories, which stand a control in a bare frame
  on purpose.

  **Half of this was taken back out in `0.12.4`**: `Button` never needed
  it, and the class was overriding what a caller asked for on the other
  axis. `IconButton` keeps it — it is the one that could be stretched.

## 0.12.2 — 2026-09-10

The six gaps Peek's adoption found, in one release, so Peek can finish
(D53, and Katerina 2026-09-10: *"let's fix the field issue in estiva-ui
properly and use base UI if needed"*). Nothing here is breaking; every
component without the new prop draws exactly what it drew.

### Added

- **`FieldLine` — the line a `Field` draws, on its own** (ADOPTION B24).
  Three surfaces in Peek put that small line under a *group* of controls
  — a value with Save and Cancel beside it, a Folder's action controls,
  another app's action controls — and each already has a section heading
  above it, so `Field` (which brings a label of its own) could not be
  used. All three spelled `text-xs text-error-default` by hand, and none
  of them was announced. This is the same two classes from one map in
  `Field.tsx`, plus **`warning`**, the tone `Field` has not got and
  deliberately: `Field`'s `error` also marks its control invalid, and a
  warning is not invalid. An `error` is `role="alert"`, the rest are
  `role="status"` — `Banner`'s rule, so the two agree.
- **`SectionHeader` and `CollapsibleSection` take a `trailing` slot**
  (B23): a count beside the title, held on screen while the actions come
  and go, and outside the title button so it is neither part of the
  toggle's name nor part of its hit target. Peek's Screener header
  carries its number as a `Chip` there and was the app's last hand-drawn
  folding header for want of the slot.
- **`ScrollArea` hands back the box that scrolls** — `viewportRef` and
  `onScroll` (B20). A conversation arrives at its newest message, keeps
  its place when older ones load above it, and jumps to the bottom on a
  reply; none of that is the region's to do, and none of it is possible
  without the box. Peek's two streams and its thread panel kept native
  bars for exactly this.
- **`DialogShell` takes `bodyMaxHeight`** (B19): the cap, and with it the
  body becomes a `ScrollArea`, so a long roster or a tall form scrolls in
  the package's bar rather than the browser's. The cap lands on the
  viewport and the padding on the content, so the bar is drawn over the
  padding rather than beside it. Peek's five dialogs passed
  `overflow-y-auto` on the body — and two of the five passed it with no
  cap, which never scrolled anything.
- **`Popover` takes `align="center"`** (B21), mapped to Base UI's own
  `center`. Peek's selection toolbar is centred over the text you
  selected (Katerina, PEE-19); only the two edges were mapped, so it kept
  the placement arithmetic that moving onto `Popover` was meant to
  delete.
- **`Toast` takes `warning` and `error` tones, and its leading icon now
  says which type it is** — a check for `success`, `brand` and `neutral`, a
  `!` for `warning`, an `×` for `error` (Katerina, 2026-09-10: *"the icons
  should be representative, x for error, ! for warning"*). It was a
  circle-check on every pill, so a warning would have arrived with a tick
  beside it, which is why a caller with bad news turned the icon off
  instead. Amber and red in the light themes; under Signal the same dark
  pill with the icon carrying the colour. `glow-warning` is a drop shadow
  as well as a box shadow now, so all three glows are both; `error` has no
  glow, because no theme defines one and a colour with no token is not
  approximated (D16).

## 0.12.1 — 2026-09-09

### Fixed

- **The frame owns the page's scrollbar.** `AppShell`'s content column
  (solid manner) is a `ScrollArea`; it had been a native `overflow-y-auto`
  box since the morning, so Ship's Issues and Projects pages — the two
  that scroll in the frame rather than inside themselves — still drew a
  native bar (Katerina, 2026-09-09: *"it won't take the scrollbar from
  estiva-ui"*). D40 said everywhere; the one place every page passes
  through had been left out. Measured on all four Ship pages: the tall
  Issues page scrolls in the package's bar with the native one hidden; the
  empty page fills and centres; the two detail pages take exactly the
  frame's height and scroll in their own columns. **The page contract**
  is on the AppShell page: a page is a flex child of `main` — `flex-1` to
  fill and scroll here, `flex-1 min-h-0 [contain:size]` to scroll inside
  itself — never `h-full`. Ship's four pages change accordingly (ADOPTION
  S30); Peek's floating manner is untouched. PLAN Finding 42.

## 0.12.0 — 2026-09-09

Katerina's Ship improvements (2026-09-09): three of her five turned out to
be the package's, and a sixth arrived mid-way. Nothing here is breaking;
the version is a minor because it adds.

### Fixed

- **`ScrollArea` stopped the page under every table and board.**
  `overscroll-contain` sat on a viewport Base UI makes `overflow: scroll`
  on *both* axes: a sideways region is also a vertical scroll box with
  nothing to scroll, and a wheel down over it was an overscroll that
  `contain` refused to chain. Measured in Chrome: 0px of page scroll with
  the pointer over Ship's project table, 446px without the line. The wheel
  is now kept per axis and only while that axis really overflows — Base
  UI's `data-has-overflow-x` / `-y` — so a wheel down over a sideways
  region moves the page (measured on the `SidewaysInsideAPage` story:
  page 300px, region 0) and a sideways swipe moves the region (region
  300px, page 0). A list with more to show still keeps the wheel from the
  page behind it. Both apps had it since `0.11.0` (PLAN Finding 40;
  ADOPTION B17).

### Added

- **`EmptyState` has a `scope`**: `page` (the default, today's look — the
  icon over a centred line) for a whole page with nothing on it;
  `section` for one empty section of a page that has other things on it —
  the line alone, left-aligned, no icon (Katerina's rule, 2026-09-09: the
  page decides, not the size of the box). **A `page` sits in the middle of
  its box both ways** (her second look: it sat near the top) — inside a
  flex column it takes the room left and centres in it; drawn straight
  into a page it takes `className="h-full"`. Stories `Page` and
  `Section`, in a box with a hairline so the placement can be seen;
  `Default` is now `Page`. Nothing moves until a caller says `section` or
  gives a `page` room; the callers to sort are ADOPTION B18.
- **`CollapsibleSection`** — a section that opens and closes: a
  `SectionHeader` whose title is the toggle, the rows under it, and the
  slide between (150ms; none under `prefers-reduced-motion`). On Base
  UI's `Collapsible` (D6): the state, `aria-expanded` and `aria-controls`,
  Enter and Space, the panel's height for the slide — `auto` again once it
  ends, so rows that arrive later are not clipped — and `hiddenUntilFound`,
  so the browser's find-in-page opens a closed section that holds the
  match. `storageKey` remembers open or closed in this browser; `open` +
  `onOpenChange` for an app that owns it. A closed section stays closed
  whatever is selected inside it (Katerina, 2026-09-09). Ship's sidebar
  takes it for Projects and Folders (ADOPTION S24); Peek's three
  hand-drawn accordion headers are P15.

### Changed

- **A `NavItem`'s count sits in a 16px centred box** — an icon's width —
  so a number under a `SectionHeader`'s action shares its centre: with
  right edges alone a digit sat 4px off a 16px icon (Katerina,
  2026-09-09; measured 4px, then 0). A one- or two-digit count moves at
  most 4.4px left; a three-digit one grows the box leftwards. The slot is
  the same width an icon would take, for a row that carries one instead.
- **A `Chip` given a `max-w-*` truncates its label** with an ellipsis
  instead of growing past the cap — `overflow-x-clip` + `text-ellipsis`
  on the label, `min-w-0` on the pill. Not `truncate`: that is
  `overflow: hidden` on both axes, and the label's line box (11px under
  Signal) is tighter than its glyphs, so the screenshot diff caught every
  descender cut off; `clip` is the one overflow that leaves the other
  axis visible (PLAN Finding 41). A chip with no cap draws exactly as
  before. For Ship's project chip on an issue row (ADOPTION S26), where a
  project's name can be long.
- **`SectionHeader`'s title is a button when it toggles**, and the
  keyboard can toggle it — the row was a `div` with an `onClick`, so it
  could not. The button fills the row up to the actions, which sit beside
  it now rather than inside it (a button inside a button is invalid
  HTML), so an action's click no longer has to be stopped from toggling.
  The hover fill and the actions' reveal are CSS, not React state — the
  actions are in the row at `opacity-0` until hovered *or focused*, so a
  keyboard user reaches them. A `render` prop swaps the title's element
  in Base UI's manner; it is how `CollapsibleSection` makes it a
  `Collapsible.Trigger`. Props otherwise unchanged; Peek's `TopicsPage`
  (the one caller) needs nothing. Measured at rest: the row is 32px and
  the label sits where it did. **Its own stories show the row and no
  chevron** — one component folds, and that is `CollapsibleSection`
  (Katerina's question, 2026-09-09); the `Collapsible` and `ActionsOnly`
  stories are gone. **A fixed heading no longer lights up on hover**: the
  fill says "this does something", so only a row with a toggle or with
  actions takes it — the Sidebar's fixed group (its Composed canvas shows
  both kinds) reads as a heading, not a control.
- **A `Breadcrumb` crumb takes an `icon`**, 16px before its label, for
  what kind of place it is — so a container's name is not mistaken for an
  item's (Katerina, 2026-09-09). Drawn beside the crumb, not inside it, so
  the crumb stays the one element that truncates; `aria-hidden`, in the
  crumb's own tone. Measured: 16px, centred on the 19.6px line, 6px either
  side — the trail's own gap; a trail without icons is what it was.

## 0.11.0 — 2026-09-08

Three things from Katerina's first look at Ship on `0.10.0`, the same night.

### Added

- **`ScrollArea`** — a region that scrolls without taking width for its
  scrollbar, on Base UI's `ScrollArea`. A native bar is part of the layout:
  the moment content overflows, the text column narrows and the right-hand
  padding looks wider than the left, in every scrolling surface of both apps
  (Katerina, 2026-09-08). The bar is drawn over the content instead — 6px,
  `border-strong`, showing while the pointer is over the region or the
  content moves, faded otherwise — so nothing shifts when it appears.
  Measured in Chrome: with forty rows overflowing a 280px box, the viewport
  keeps its full width; with four rows, no bar is drawn and the box is
  pixel-identical to a plain one.

  **Every scrolling surface in the package sits on it**: the `Menu` and
  `Popover` panels, the `Select` list, the `PreviewCard` card, the
  `Sidebar` column and the `AppShell` content column. The padding each drew
  on its box moved onto the scrolling viewport, so a surface that fits draws
  exactly as before and the bar sits at the panel's edge when it does not.
  In a `Select` of twenty options the arrow keys keep the highlight in view
  and the list stays the trigger's width.
- **`Divider` takes a `label`**: words in the middle of the line — a date
  between two days of messages, or where "new since you last read this"
  begins. `tone="warning"` for the second: the label in the warning colour,
  the lines in its wash. Both apps drew that rule by hand in the accent,
  which measures 3.3:1 on Ship's background and could not be read; the
  warning colour measures 9.6:1 there (Katerina, 2026-09-08). The line is
  named by its label for assistive tech.

### Changed

- **A pressed `Reaction`'s count reads in the text colour under the ship
  theme.** The accent on its own wash measures 2.70:1 there (Finding 4) and
  the number was the thing that vanished. The accent keeps the edge and the
  fill; signal keeps Peek's blue-on-wash, which reads.

### Callers

- Nothing to change to keep working. What is offered: a `ScrollArea` for
  each scrolling surface an app draws itself (Ship: the two detail columns,
  the two rails, the table and the board — ADOPTION S20), and
  `<Divider label tone="warning">` for the unread rule (S21).
- An app that styles native scrollbars in its `index.css` keeps that for the
  page's own bar; the package's surfaces no longer show a native one.

## 0.10.1 — 2026-09-08

Three defects, all found the same night by Ship's adoption of
`0.10.0` — which is what D19's early adoption points are for.

### Fixed

- **A field's control no longer loses focus when its error line appears or
  clears.** The control was wrapped in the 6px stack only when there was a
  line under it, so React re-created it the moment `error` or `helper` came
  or went — a person typing into a field whose error clears on input lost
  focus after the first keystroke, and Ship's dialog test found its input
  handle stale. The control now sits in the same place whatever is under it:
  a one-child flex column, which draws exactly as the bare control did.
  Pinned in `Field.test.tsx` (same element, still focused, across an error
  appearing and clearing).
- **The required asterisk stays out of the accessible name.** It was read as
  part of the label, so a required "Project" select was named "Project*".
  The asterisk is `aria-hidden`; `aria-required` on the control is the word
  for it (B13). Pinned.
- **A disabled button stays disabled as a `Menu` or `Popover` trigger.**
  Base UI's trigger parts keep a disabled state of their own and write it
  over the rendered button's, so a `ToolbarButton` with a `disabledReason`
  came out `aria-disabled="false"` and opened its panel (Finding 39, from
  Ship's message tools). Both parts are now told what the button already
  knows; the button stays reachable, says its reason, and does not open.
  Pinned in `Toolbar.test.tsx` for both parts.

### Callers

- Nothing to change. A test that matched a required control's name with the
  asterisk would change; none does in either app (Ship's matched "Project"
  and was the one that failed).

## 0.10.0 — 2026-09-08

**The second of the three releases D19 asks for.** Stages 3 and 4 of the
Base UI migration, the end-to-end review of stages 0 to 3, and two components
Katerina asked for on the way — `Toolbar` and `ReactionPicker`. `PLAN.md` had
them as two releases, `0.10.0` and `0.11.0`; nothing was published between
them, so they are one (D33).

**What renders differently, all of it ruled:** a tooltip waits 300ms, then
fades in while travelling 4px (D23, D26); a toolbar draws the package's
elevated box, so Peek's two hand-drawn strips become one box (D29); the
compact `PersonTrigger` has a visible focus ring again. Everything else
matches the previous baseline to the pixel in both themes; the only recurring
difference is `Skeleton`'s pulse, which is the shot tooling's own noise floor.

**What a caller must do** is `migration docs/ADOPTION.md`, rows B4 to B16,
S7, S14, S15, P16, P22, P26 and P27. The one change that breaks a build is
`Menu`: it owns its trigger now, and eight call sites across the two apps
delete their open state, anchor arithmetic and `onClose` and pass `trigger`
instead (B9). Sixteen test assertions change from `button` to `combobox` for
a `Select`'s trigger (B8). Each app mounts one `TooltipProvider` at its root
(B6). The rest arrives with the version bump and nothing is written to get
it.

### Two small fixes for links (2026-09-08)

Both found while fixing Ship's SHI-20, where every sidebar click reloaded
the whole app, and held back until stage 4 landed (ADOPTION S14, S15).

#### Added

- **`Breadcrumb`'s `Crumb` takes `onClick`.** A crumb is a plain anchor, so
  in a router app a click on it reloaded the page — and Ship's breadcrumbs
  were the last links doing so, after SHI-20 moved every other link onto
  `linkTo`. The prop is spread onto the anchor and nothing else; the `href`
  stays a real address so the link can still be copied or opened in a new
  tab. Called only on a crumb with an `href`, since a crumb without one is
  not a link. Pinned in `Breadcrumb.test.tsx`, which is new — the page had
  four claims and no test.

#### Changed

- **`Sidebar`'s page repeats `NavItem`'s navigation rule.** `NavItem.mdx`
  said it — a router app keeps a thin wrapper that intercepts the click —
  but `Sidebar.mdx` is the page someone reads while assembling a sidebar,
  and it said nothing, with an example still on hash links. Peek followed
  the rule; Ship did not, and shipped a sidebar whose every click rebooted
  the app. The examples on the three pages now use real paths, and the
  paragraph is there.

#### Callers

- Ship `views/IssueView.tsx` and `views/ProjectView.tsx` pass `linkTo(href)`'s
  `onClick` per crumb, and the breadcrumb reload goes (**S15**). Peek's trail
  is elsewhere and is not affected.
- Nothing else changes: `onClick` is optional, and a crumb without it
  behaves exactly as before.


### Toolbar and ReactionPicker (2026-09-08)

Two components Katerina asked for on 2026-09-08, pulled forward from stage 6,
and two answers to what she found reading stage 4's stories.

#### Added

- **`Toolbar`** — a strip of controls that behaves as **one** control: Tab in,
  arrow keys along, Tab out — **on the elevated box a floating strip needs**.
  Base UI's `Toolbar`, with this package's `IconButton` as **`ToolbarButton`**,
  plus **`ToolbarSeparator`** and **`ToolbarInput`** (a field that keeps the
  arrow keys for its caret while it has focus).

  **The box is the same `MenuPanel` a `Menu` draws**, because a floating strip
  and a floating list are the same box. Peek had built it twice and the two had
  already drifted — its quick menu `rounded-sm` with `shadow-sm` and a subtle
  border, its reaction picker `rounded-lg` with `shadow-lg` and a default one.
  `surface={false}` for a strip inside something that draws it already.

  The panel **wraps** the strip rather than being composed onto it: `MenuPanel`
  is a flex column, right for a menu's rows and wrong for a row of controls,
  and Tailwind emits `flex-col` after `flex-row` — so a merged class list would
  stand the toolbar on its end whatever order the classes arrived in.

  **It exists because every strip in the suite is as many Tab stops as it has
  buttons.** Ship's reaction row, Peek's composer strip and the editor's
  formatting strip are each a hand-rolled `<div class="flex">` of
  `IconButton`s. Measured in Chrome, four buttons: **one Tab stop in a
  `Toolbar`, four in the row beside it** — and the story puts the two side by
  side so the difference can be counted rather than described.

  A disabled control **keeps its place in the walk**, because a strip whose
  controls come and go from the arrow keys as their state changes is a strip
  you cannot learn — and a `disabledReason` you cannot reach is a reason
  nobody reads. A `ToolbarButton` **must be inside a `Toolbar`**: Base UI
  throws otherwise, since a part with no strip has no walk to join.

  **The gap, stated: Home and End do nothing.** Base UI's composite implements
  them behind `enableHomeAndEndKeys` and `Toolbar.Root` does not pass it, so
  the page does not claim them and a test pins the gap. The arrows wrap, which
  reaches either end in one press of a strip this size.

- **`ReactionPicker`** — the reactions on offer, to choose one from. **A
  `Reaction` is the answer; this is the question.** Peek's `ReactionPicker`
  (2026-09-03), moved in, with three things changed on the way:

  - **it is a `Toolbar`**, so the row is one Tab stop rather than one per
    emoji — Peek's five were five things to Tab past to reach anything after
    the card;
  - **its box is `Toolbar`'s**, so it is the one elevated surface rather than
    a second hand-typed copy of it. Inside a `Popover`, which draws that box
    already, it takes `surface={false}`;
  - **it opens above the control that was pressed**, not below — the thing
    being reacted to is underneath it (Katerina, 2026-09-08);
  - **it says nothing about which reactions are yours.** That is `Reaction`'s
    state, in the row of pills on the card. A picker that also reported it
    would be two components wearing one name, so `selected` is gone;
  - **the vocabulary stays with the app.** Which emoji, and what each one
    means, is product knowledge: it arrives as `options`, and every option
    owes a `label`, because the emoji is `aria-hidden` here for the same
    reason it is on `Reaction`.

#### Changed

- **`Popover` takes `side`, and every panel holding a `Toolbar` asks for
  `top`** (Katerina, D30). A strip of controls acts on what is under it, so it
  stands over that rather than on top of it — and over a text selection, a
  panel below covers the line that tells you what you have just selected.
  Measured on all five: `data-side=top`, 4px above the trigger.

  **It is a preference, not a promise.** `side` says which side to try;
  Floating UI measures the room and flips when there is none, which is the
  reason the placement is the library's job and not arithmetic of ours. A
  story shows exactly that — `FlippedForRoom` asks for the top with no room
  above and comes out below. The default stays `bottom`: a rename field is
  *about* its trigger and hangs from it.
- **Every `Popover` story that draws a strip now draws a real `Toolbar`**,
  which is what the hand-rolled rows were standing in for.
- `Reaction` and `Chip` point at `ReactionPicker` and `Toolbar` where they used
  to point at "a toolbar of IconButtons", and `Choosing.mdx` gains a row for
  each.
- The `chip` and `input-label` type tokens are merged with `cn()` like every
  other class. Three files carried a note saying they must **never** be merged;
  that stopped being true when `cn()` was taught the ramp, and `cn.test.ts`
  pins it.

#### Removed

- **`DialogShell`'s `Confirmation` and `Alert` stories — both of them.** Each
  hand-built what `ConfirmDialog` *is*: the same "Delete this?", the same
  Cancel and destructive Delete. `Confirmation` built it wrongly on top of
  that — a plain dialog, so a press on the backdrop dismissed the question,
  which is exactly what D20 stopped. A story showing the thing the page's own
  "When not" tells you not to build is worse than no story (Katerina,
  2026-09-08).

  **`alert` therefore has no story here, on purpose**, and the page says so:
  `ConfirmDialog` is the only thing in the package or either app that uses the
  prop — checked, not assumed — so its canvases and its nine tests are that
  prop's coverage.

  Two stories replace them, and each covers a prop that had none:
  **`WithHeaderContent`** (a back button and a count in place of the title) and
  **`WithoutAFooter`** (the body keeps the card's bottom edge).

- **`Toolbar`'s `AgainstALooseRow` story.** It set a toolbar beside a plain row
  to make the Tab-stop difference countable, which is an argument rather than a
  variant — and stories introduce the component, they do not argue for it
  (Katerina, D32). The measurement it made lives in `Toolbar.test.tsx`, where a
  claim belongs.
- **`ReactionPicker`'s `Fewer` story.** Two options rather than five is not a
  variant: the row is whatever `options` holds, and nothing here caps or wraps
  it. The page says so in a line instead.
- **`ReactionPicker`'s `FromAQuickMenu` story is `FromATrigger`.** "Quick menu"
  is Peek's `ConversationQuickMenu` — furniture this package does not have, and
  a story may not name what does not exist here (Katerina: *"what is the quick
  menu? Do we have it?"*). What it draws is a card with a `Toolbar` of actions,
  one of which opens the picker above itself.

#### Callers

- **Nothing breaks.** Both components are new and `Popover`'s `side` defaults
  to what it did before.
- **Peek's `ReactionPicker` becomes a three-line wrapper** holding
  `REACTION_EMOJIS` and `REACTION_NAMES` — the vocabulary — and its hand-drawn
  panel goes to the `Popover` it already needs (**B16**).
- **Every hand-rolled strip of `IconButton`s becomes a `Toolbar`**: Ship's
  reaction row, Peek's composer strip and the editor's formatting strip
  (**B15**).

### The review of stages 0 to 3 (2026-09-08)

Everything the earlier stages built, read again and driven in a browser. The
code was right; what was wrong was almost all in what the components *say* —
to a screen reader, and on their own pages.

#### Fixed

- **A face said the wrong thing, everywhere one appears.** The initials are a
  drawing of a name, and they were being read as text. Measured with the same
  algorithm an app's own tests use:

  | | Announced as | Now |
  |---|---|---|
  | a button holding a `Person` | "AD Ana Duarte" | "Ana Duarte" |
  | the same, with a picture | "Ana Duarte Ana Duarte" | "Ana Duarte" |
  | a `MenuItem` led by a face | "ADAna Duarte" | "Ana Duarte" |
  | `PersonTrigger`, the row | "AD Ana Duarte" | "Ana Duarte" |
  | `PersonTrigger`, `compact` | **"AD"** | "Ana Duarte" |
  | `AvatarGroup` | "AD BC CD" | "Ana Duarte", "Ben Carter", … |

  **`Avatar` is silent by default now** — almost every face in the suite sits
  beside the name it belongs to, and a picture that spoke there said the name
  twice — and takes **`label`** to name a face that stands on its own.
  `PersonTrigger`'s compact shape takes its own name from the person, so the
  icon-only control that owed a name no longer owes one; a caller can still
  name what it *opens* instead, as `IdentityMenu` does.

- **The compact `PersonTrigger` had no visible focus at all.** It carried
  `focus:outline-none` with nothing put in its place — measured `outline:
  solid 2px rgba(0,0,0,0)`, no shadow — on the account trigger in Peek's top
  bar. It wears the ring `Button`, `IconButton` and a `Tab` already wear.

- **`Field`'s `required` drew the asterisk and told nobody.** The control
  carried neither `required` nor `aria-required`, so the one thing the mark
  means never reached a reader who could not see it. The Field marks the
  control itself (`aria-required`, not the native attribute, which would also
  switch on a validation bubble no app here uses). It reaches **every control
  the package offers**: `Select`, `ChipInput` and `Checkbox` take fixed prop
  lists and dropped it silently until each was told.

- **A `Tabs` row could not be named.** Its `tablist` had no name and no way to
  give one, so two rows on a page were announced as two identical "tab
  lists". `aria-label` / `aria-labelledby` now reach the list.

- **`EditableText` dropped a native `title` and an `aria-label` that was never
  read.** The `title="Click to edit"` was the last browser tooltip in the
  package — its own timing, its own look, no theme — beside an `aria-label`
  that already said it. The read-only branch's `aria-label` sat on a bare
  `<div>`, which ARIA does not let an author name.

#### Added

- **`Rail` has a page and stories**, which it never had while being a public
  export: four canvases, and the two things a caller needs to know — it is a
  `<nav>` landmark and owes a name where an app has two, and it deliberately
  does not scroll.
- **Tests for the two stage-3 components that had none.** `ConfirmDialog` (9):
  the alert role, D20's backdrop that must not close it, Escape and the ✕ that
  must, a refused action that keeps it open, and the buttons that wait.
  `EditableText` (13): every sentence on its page, since Base UI supplies the
  field and *nothing else* — Enter commits trimmed, Escape restores, blur
  commits, an unchanged value is not committed, a refusal and a throw both
  keep the text, and Shift+Enter is a new line only when multiline.
- `Avatar.name.test.tsx` (10) — the table above, pinned.
- The keyboard tests `Menu` never had, and `Field`'s `required` across all six
  controls.

#### Changed

- `Field`'s label is merged with `cn()` like every other class list. It was a
  template literal, under a comment saying the type token must never be merged
  — which stopped being true when `cn()` was taught the ramp.
- `PersonTrigger.mdx` no longer tells callers to swallow `mousedown`: `Menu`
  owns its trigger since stage 4, and the trap that advice worked around is
  gone with it.

#### Callers

- **Nothing to change, and two app tests get easier.** A query for a person's
  name — Ship's `getByRole('button', { name: /Ana Duarte/ })` — matched the
  old "AD Ana Duarte" only because it is a regular expression. An exact name
  now works. Nothing in either app queries by `title` or by the initials
  (**B12**).
- A `Field` with `required` now marks its control, so an app test may assert
  `aria-required` where it could not before. Nothing needs to.

### Stage 4 — everything that floats (2026-09-07, reviewed 2026-09-08)

Tooltip first, because it was in the way of everything else.

#### Changed

- **`Tooltip` and `WithTooltip` are Base UI's `Tooltip`.** The gap this
  library had written down about itself is closed: **a tooltip shows on
  keyboard focus**, not on hover alone. `Tooltip.mdx` said "it shows on hover
  only — there is no focus or touch trigger" until today, which meant the
  reason a disabled control gives — the whole point of `disabledReason` —
  could not be read without a mouse. Gone with it: the `createPortal`, the
  `getBoundingClientRect` arithmetic and the two clamps this file kept
  against the viewport's edges. Floating UI places, flips and clamps it now,
  and the measured geometry is unchanged — 6px from the trigger, centred on
  it, 8px clear of every screen edge, flipped to the other side when that
  edge is close.

- **A tooltip waits 300ms, and a toolbar only pauses once** (Katerina, D23,
  2026-09-07). It used to appear the instant the pointer arrived, which
  flashed a pill per button when sweeping a row. Mount one
  **`TooltipProvider`** (new export) at the top of an app and every tooltip
  below it shares that delay: the first waits, the neighbours open as the
  pointer reaches them while the group stays warm. Measured in Chrome: 325ms,
  then 22ms, then 19ms across three buttons. Without the provider each
  tooltip still waits its own 300ms — nothing breaks, the row simply pauses
  on every button.

- **It fades and moves** (Katerina, D26, 2026-09-07): 120ms in, 80ms out,
  travelling 4px away from the trigger — from below when it stands above a
  control, from above when it hangs beneath one. It had no animation at all,
  and could not have had one: Base UI is what keeps the pill in the DOM until
  the transition finishes. Moving between triggers inside a warm group skips
  it, so a toolbar sweep does not flicker. `prefers-reduced-motion` removes
  it.

- **`Select` is Base UI's `Select`.** Deleted with the port: `createPortal`,
  the whole `onKeyDown` switch, the outside-click, resize and page-scroll
  listeners, the `aria-activedescendant` bookkeeping, the `scrollIntoView`
  that kept the highlight visible, and the index this component counted to
  know which option was active. **Not one pixel moved**: 187 of 190 stories
  identical in signal and 188 of 190 in ship, the rest being Skeleton's
  shimmer. The open list was measured by hand, since a closed trigger is all
  a screenshot sees — 4px under the trigger, as wide as it, capped at 288px
  and scrolling inside that; in a bottom-right corner it flips above the
  trigger and slides left, still at its full height and fully on screen.

  **It keeps opening below the trigger** (Katerina, D24). Base UI would
  rather lay the list *over* it so the chosen option covers the trigger's
  own text, the way macOS does; that is off, because all fourteen call
  sites open below one today.

  **Gained, and nothing here implements any of it: typeahead** — type the
  first letters of an option and the list jumps to it — a highlight that is
  one `data-highlighted` attribute for pointer and keyboard alike rather
  than an index, and a value that can belong to a form.

- **The `Menu` family is Base UI's `Menu`** — `Menu`, `MenuSub`, `MenuItem`,
  `MenuSection`, and `IdentityMenu` with them. **The arrow keys walk the
  rows**, which is the first thing a keyboard user notices and the thing the
  page said did nothing: ↑ ↓ move and wrap, Home and End jump, typing a
  row's first letters goes to it, → opens a submenu and ← closes it, and
  focus moves into the menu on open and back to the trigger on close.

  Deleted with the port: the `createPortal`, the `mousedown` listener on
  `document`, the Escape listener beside it, the resize and scroll
  listeners, the provisional hidden render the shell did in order to measure
  itself, and `MenuSub`'s whole hand-rolled edge-flip. Measured against a
  trigger: 4px below it, left edges flush.

- **`IdentityMenu`'s arrow keys walk the actions only** (Katerina, D22),
  measured: ↓ goes Edit your profile → Copy public key → Sign out → wraps,
  stepping over the identity block, the workspace line and the notes. The
  identity and workspace sections are `Menu.Group`s labelled by their
  headings, so they are announced as named groups rather than as menu items
  that are not items.

- **BREAKING: `Menu` owns its trigger, and its three anchorings are gone.**
  It takes `trigger` — the control itself, as an element — and is always
  mounted; Base UI decides when it shows. `anchor`, `position`, `onClose`
  and `closeOnLeave` are deleted with the code that needed them.

  This is the standard rather than a preference (Katerina, 2026-09-08: *"if
  your fixes are part of base ui, I would definitely be for using the
  standards"*). **Five defects shared one root cause** — Base UI not knowing
  which element opened the menu — and four of them had needed a hand-written
  answer, each of which is now deleted:

  - a press on the trigger stopped closing the menu. Base UI dismisses on a
    **captured `pointerdown`**, which the old `onMouseDown` +
    `stopPropagation` guard could not reach in the bubble phase — measured:
    the identity menu could no longer be closed by clicking its own face;
  - hovering a submenu row unmounted the whole menu (the `sibling-open`
    special case);
  - a hover menu shut itself coming back from a submenu (the
    `data-estiva-menu` tagging, written and then deleted inside this stage);
  - opening from the keyboard highlighted nothing;
  - a hover menu could only be opened by a click.

  **What a caller writes now is nothing**: no open state, no anchor, no
  `onClose`, no `onMouseDown` guard. `Menu` takes `trigger`, and optionally
  `openOnHover`, `open` / `onOpenChange` and `actionsRef`. Every call site is
  a net deletion; the eight of them are listed under Callers.

- **`IdentityMenu` anchors its panel to the trigger, not to the wrapper**, and
  that was a live defect rather than a tidy-up. The wrapper's box is the app's
  to lay out: in a flex row with the default `align-items: stretch` it takes
  the row's full height and the panel hung from the bottom of *that* —
  measured at **360px below the face** in a 420px row, with a scrollbar it
  should not have had. Anchored to the button both go: 4px below, right edges
  flush, standing at its full 380px. Peek already works around a cousin of
  this with `className="flex"`.

- **A hover menu no longer shuts itself when you come back from a submenu
  row** — the defect Katerina reported in Peek, and older than this stage.
  Moving between a row and its panel leaves the parent popup as far as the
  DOM is concerned, so the shell's own 150ms leave timer started. It was
  first patched here by tagging every box of one menu; that patch is deleted
  and the answer is Base UI's, which owns the whole hover choreography
  including the diagonal from a row out to its panel. Measured: `Move to…` →
  the row below it keeps the parent open.

- **`openOnHover` and `MenuSub` cannot be used together, and saying so is now
  the component's job.** Measured 2026-09-08: enter a submenu's panel, then
  leave in any direction that does not cross back over the parent, and
  neither the submenu nor the menu ever closes again — at 200ms, 500ms, 1s
  and 2s. Both triggers hard-code Floating UI's `safePolygon({
  blockPointerEvents: true })`, which blocks pointer events while the path
  from row to panel is live, and leaving that way never resolves the polygon.
  There is no prop for it. So a `MenuSub` inside a hover-opened menu logs a
  development-only error naming the fix — open the menu on a press — because
  the failure is a menu that will not go away and its cause is two files
  from where it shows. The two Peek menus this affects are in Callers.

- **The menu popup takes `outline-none`.** Opened from the keyboard, Chrome
  drew a ring around the **whole panel** (`outline: auto 1px`, measured),
  which reads as “the menu is one thing” rather than “these rows are the
  things”. The rows keep their own highlight. Exactly the fix `DialogShell`'s
  card needed at stage 3, in a second place.
- **A row outside a `Menu` no longer claims `role="menuitem"`.** ARIA requires
  a `menuitem` to sit inside a `menu` or a `menubar`, and `MenuPanel` is a
  `<div>` with no role — so the four Peek files that draw rows on a bare panel
  were each telling a screen reader they held menu items of nothing. They are
  plain buttons now, which is what they behave like. Those pickers are really
  a listbox pattern; saying so properly belongs with `ChipInput` at stage 5,
  and claiming the wrong role in the meantime is worse than claiming none.
  Nothing queries the role outside a real menu — checked in both apps.
- **`MenuItem` and `MenuSection` still work with no `Menu` around them.**
  Peek's `@`, `/` and `[` pickers and its compose menu draw a bare
  `MenuPanel`, because a popup inside a text editor cannot have a menu's
  keyboard — the editor's suggestion plugin already owns it. A Base UI
  `Menu.Item` outside a `Menu.Root` has no context to read, so those rows
  stay the plain buttons they have always been and only rows inside a real
  menu become the part. Four Peek files depend on this; it is pinned by
  tests.

- **A `MenuItem` is still a `<button>`.** Base UI's part draws a `<div>`;
  `render` plus `nativeButton` keeps the element the design was drawn with.
- **A Select's list follows its trigger when the page scrolls.** It used to
  close, and had to: the list was `fixed` to where the trigger *had been*,
  so closing was the only way it could avoid being left behind. It now
  tracks, and disappears if the trigger scrolls out of sight rather than
  floating over whatever has scrolled into its place. The list's own scroll
  never dismissed it and still does not.
- **`Button` and `IconButton` no longer wrap themselves to carry a tooltip.**
  The button *is* the trigger, so the component's root is the `<button>`.
  This was the loose end stage 3 finished on: an `IconButton` with a
  `tooltip` returned `WithTooltip`'s wrapper `<div>` as its root, so a
  `Dialog.Close` or a `Menu.Trigger` composed onto the wrapper and not the
  button. **Measured consequence, and it is a fix rather than a cost:** with
  the wrapper gone an IconButton that carries a tooltip sits at exactly the
  same height as one that does not. It used to sit **1px higher** — the
  wrapper was `inline-flex`, which takes its baseline from its first flex
  item rather than from its own last line box. Inside a flex row, which is
  where both apps put them, the wrapper never made a difference and nothing
  moves. The two IconButton stories are the whole of this stage's screenshot
  diff.

- **A disabled control with a `disabledReason` keeps its pointer events.** It
  had `pointer-events-none`, which was harmless while the wrapper caught the
  hover and fatal once the button became the trigger — a trigger the pointer
  cannot land on never opens a tooltip. Base UI already swallows the click
  (`focusableWhenDisabled` gives `aria-disabled` and a prevented `onClick`),
  so nothing else needed it. A plainly disabled control, with no reason to
  give, keeps `pointer-events-none` as before.

- **`DialogShell`'s ✕ is a `Dialog.Close`**, which is what the wrapper was
  blocking. The dialog now closes through its own state machine whichever way
  it is closed — the ✕, Escape, a press outside — instead of one of the three
  going around it, and Base UI reports which.

#### Added

- **`TooltipProvider`** — one shared delay for every tooltip below it. See
  above; an app mounts one at its root.
- `Tooltip` takes the props of the `<div>` it renders, so it can be what
  `Tooltip.Popup` renders and stay the single definition of the pill.
- `Tooltip.test.tsx`, which the component never had: 14 tests pinning what
  the page claims, including the two exits it now has (Escape, and a click on
  the trigger) and the focus behaviour that replaced the stated gap.
- A **toolbar** story, where the shared delay is visible.
- **`Popover`** — a floating panel from a trigger: the same elevated surface
  a `Menu` draws, with none of a menu's semantics. **It exists because
  `Menu` was being used for this.** Peek's selection toolbar puts a text
  field inside one and its debug panel fills one with toggle rows; since the
  menus moved onto Base UI a `Menu` gives its contents roving focus and
  typeahead, which is wrong for both and would fight the field outright.
  Beyond those two it is what Peek's thirteen hand-written overlays become
  (`COMPONENTS-PEEK.md` F5).

  **The API is `Menu`'s, deliberately**: it takes the `trigger` and owns
  everything after — the toggle, the placement, the dismissal and the focus
  return. What differs is inside: it announces itself as a dialog, Tab walks
  its contents in order, and **focus lands on the first thing in the panel**,
  which is the whole point. Measured in Chrome: 4px under its trigger, the
  field focused on open, Tab going field → Cancel → Save, Escape closing it
  and giving focus back to the trigger, a second press of the trigger closing
  it rather than closing and reopening it, and **zero** elements with a menu
  role anywhere in the panel.

  Plus the one mode a `Menu` has no use for: **a panel with no trigger element
  at all**, hung from a rect the caller measured — a toolbar over a text
  selection, which is not a control and cannot be one. That mode is
  controlled, because there is nothing for Base UI to watch, and **it does not
  take focus**: the person is still in the text, and a toolbar that moved the
  caret out of it would end the edit it exists to serve. Measured with focus
  moved in, before that was decided: the first control's tooltip opened on
  `:focus-visible` and ate the Escape that should have closed the panel, and
  the caller's re-read of the selection fought the panel's own dismissal —
  both intermittently. Neither happens with focus left alone. **The cost is
  stated on the page**: an anchored panel cannot be reached by keyboard, so
  what is in one must be reachable another way.

- **`PreviewCard`** — more of a thing, on hover. **It exists because Peek's
  Screener preview is this, hand-written**: its own `createPortal`, its own
  "prefer the right, flip left if it would run off screen" arithmetic
  against `window.innerWidth`, and its own clamp against the bottom edge.
  Measured against the same numbers: it opens 12px to the right of the row,
  360px wide, and flips when that side has no room.

  It opens 350ms after the pointer rests and closes 200ms after it leaves —
  long enough not to flash a card at every row while crossing a list, and
  long enough to cross the gap into the card. **`content` renders only while
  the card is open**, so a preview that fetches does not fetch once per row
  on screen. Not a tooltip: a tooltip is a word for a control and cannot be
  pointed at; this holds content and can.

- Both draw `MenuPanel`, so the elevated box still has one definition — and
  both have a page, stories and tests of their own (`Popover.test.tsx`, 9;
  `PreviewCard.test.tsx`, 4).
- `Menu.test.tsx`, which the shell never had: 19 tests, including the whole
  Keys table — the arrow keys and their wrap, Home and End, the typeahead,
  and → opening a submenu onto its first row — the rows working on a bare
  `MenuPanel`, and the trigger press that must not reopen the menu.
- Menu stories: **`FromATrigger`** (the live menu, its submenu and the whole
  keyboard), **`InFlow`** (the anchoring two app callers use and no story
  covered), and `IdentityMenu`'s **`FromItsTrigger`**.
- `Select.test.tsx`, which the component never had: 11 tests for what the
  page claims, including the typeahead it just gained and the two
  assertions Ship makes on it, repeated here so a break shows up in this
  repository rather than in Ship's adoption PR.

#### Removed

- **`clampBox` and `fitSubmenu`, and all three geometry helpers stop being
  exported.** Floating UI places every floating surface now, so nothing
  calls the first two. **`fitMenu` survives, for one caller: `ChipInput`**,
  whose suggestion list is still hand-placed — so `fit.ts` is *not* deleted
  at this stage, and `PLAN.md` §6 was wrong to say it could be. It had four
  callers, not three. It goes at stage 5 with `ChipInput`.
  `Menu.fit.test.ts` becomes `fit.test.ts`, keeping the `fitMenu` cases as
  `ChipInput` uses them and dropping the rest.
- **`Select.fit.test.ts`** — eight assertions about the pure geometry this
  component grew and then shared with the Menu shell. The geometry is
  Floating UI's now, so there is nothing of ours left to assert. What it
  covered is measured in a browser instead, because jsdom lays nothing out:
  a jsdom test claiming to check placement checks nothing. (`fit.ts` itself
  goes when the Menu shell follows.)
- **`Menu`'s `anchor`, `position`, `onClose` and `closeOnLeave` props.** See
  the breaking entry above. Every one of them existed because the caller
  owned the open state; the trigger does now.

#### Callers

**This release breaks every `Menu` call site**, and each one shrinks. The
eight are read from the two apps, not estimated:

| File | Today | After |
|---|---|---|
| Peek `ConversationMoreMenu` | in-flow, `onClose` | `trigger` |
| Peek `HuddleCard` | `anchor`, `align`, `closeOnLeave`, `onClose` | `trigger`, `align` |
| Peek `ThreadReplyCard` | `anchor`, `align`, `closeOnLeave`, `onClose` | `trigger`, `align` |
| Peek `ScreenerLaterMenu` | `position` from a measured rect, `onClose` | `trigger` |
| Peek `TopicMoreMenu` (`ConversationHeader`, `PersonRow`) | `position`, `onClose` | `trigger` |
| Peek `SelectionToolbar` | `position`, `onClose` | **`Popover`**, anchored to the selection (P26) |
| Peek `DebugMenu` | `position` from `window.innerWidth`, `onClose` | **`Popover`** with a `trigger` (P26) |
| Ship `ConversationThread` | in-flow, `onClose` | `trigger` |

Each also deletes its `open` state, its `getBoundingClientRect()` call and
the `onMouseDown` + `stopPropagation` guard beside its trigger — those
guards are dead code now, and were already failing against Base UI's
captured `pointerdown`. **`ADOPTION.md` B9** is the row.

- **`openOnHover` must come off any menu that has a `MenuSub`** until Base UI
  offers a way through `safePolygon`. Both Peek menus that use it have one:
  `ConversationMoreMenu` and `ThreadReplyCard`. They open on a press instead;
  the component logs a development error if they do not (**B10**).
- Mount a `TooltipProvider` at each app's root, or tooltips pause one per
  button instead of once per row (**B6**).
- **A Select's trigger is a `combobox`, not a `button`** — the correct ARIA
  pattern for the control, and Base UI's doing. No product code changes;
  **sixteen test assertions do**, read from the two apps rather than
  guessed: Ship's `App.test.tsx` (5), `components/ui/ui.test.tsx` (3),
  `components/dialogs.test.tsx` (2) and `components/rails.test.tsx` (1),
  and Peek's `components/ui/ForeignObjectWidget.test.tsx` (5). Each is a
  `getByRole('button', { name: … })` on a Select trigger and becomes
  `getByRole('combobox', …)`. Peek already has one
  `queryByRole('combobox')` assertion, and it still holds (**B8**).
- Nothing is written to get the 300ms wait, the fade or the focus
  behaviour — they arrive with the release (**B7**).
- `peek/src/components/ui/WithTooltip.tsx` re-exports the package's and needs
  no edit.

### Stage 3 — forms and dialogs (2026-09-07)

Six components onto Base UI, and the one gap this library had written down
about itself is closed: **dialogs trap focus and give it back**.

#### Changed

- **`DialogShell` is Base UI's `Dialog`.** Focus is trapped inside the card
  and returns to whatever opened it when it closes; the rest of the page is
  marked `inert` while it is open. `DialogShell.mdx` said "focus is not
  trapped or moved" until today — that sentence was true, and it is why this
  stage exists. The portal, the backdrop, the outside press and Escape are
  Base UI's now, so the `keydown` listener this component kept on `document`
  is gone. **The DOM shape is unchanged on purpose** — backdrop, then a
  full-screen flex layer centring the card — because Base UI positions
  nothing for a dialog and keeping the layer is what keeps the pixels.

  New prop **`alert`**: a press on the backdrop stops closing it, and the
  card announces itself as `role="alertdialog"`. Escape and the ✕ still
  close it.

- **`ConfirmDialog` is Base UI's `AlertDialog`**, through that prop.
  **A press on the backdrop no longer cancels it** (Katerina, D20,
  2026-09-07): a destructive question is answered rather than clicked away.
  This is the one behaviour stage 3 changes deliberately, and the only one a
  person can notice without a keyboard. No caller changes.

- **`Field` is Base UI's `Field`.** The label names the control by
  construction, for its own `Input` and `Checkbox`, for our `TextInput`,
  `Textarea` and `SearchInput`, and for anything rendered through
  `Field.Control`. Two behaviours reversed and both are improvements:
  **an `id` set on the control is now kept** and the label follows it
  (the Field used to override it), and **a control rendered outside a Field
  now carries a generated id of its own** (it used to carry none). The id is
  inert — nothing points at it — and neither app asserts on its absence.

- **`TextInput` and `SearchInput` render Base UI's `Input`;
  `Textarea` and `EditableText`'s multiline state render `Field.Control`
  as a `<textarea>`.** Class lists verbatim. `EditableText`'s read state,
  its draft, and every rule about when a commit happens stay ours — Base UI
  has no opinion about what an edit means.

- **`Banner` takes an optional `onDismiss`** (Katerina, D21): an ✕ at the
  right-hand end, with `dismissLabel` naming it. Without it the strip is
  byte-for-byte what it was. With it the row is 40px rather than 36px,
  because the button is taller than the line of text.

#### Added

- **`Button` and `IconButton` accept a `ref`.** They typed their props as
  `ButtonHTMLAttributes`, which has no `ref`, so a caller could not take one
  — and a Base UI part composes through `render`, which needs one. React 19
  already handed `ref` to a function component as an ordinary prop, so it was
  riding in on the spread and reaching the element all along; **the type was
  the only thing stopping anyone**. `PersonTrigger` already had it.

  This is stage 4’s prerequisite, done early at Katerina’s asking: a
  `Menu.Trigger` or a `Dialog.Close` **is** one of these buttons rather than
  wrapping one. Both compositions are pinned in `Button.compose.test.tsx`.

  **One thing it does not yet unlock**, and it was measured rather than
  assumed: `DialogShell`’s ✕ still calls `onClose` by hand rather than being
  a `Dialog.Close`. An `IconButton` with a `tooltip` returns `WithTooltip`’s
  wrapper `<div>` as its root, so the part would compose onto the wrapper and
  not the button. **It needs `WithTooltip` on Base UI’s `Tooltip` first**,
  which is stage 4.

- **`Field` gains `helper` and `error`.** The line under the control, which
  Ship built by hand in two dialogs (`COMPONENTS-SHIP.md` F14) and Peek in
  four (`COMPONENTS-PEEK.md` F14) — always the same two class lists, and
  never announced. An error **replaces** the helper rather than joining it,
  which is what those callers did, and setting it marks the control invalid,
  so a caller no longer passes `aria-invalid` beside it.

- **`glow-accent` and `glow-success` are box shadows as well as drop
  shadows** (`shadow-glow-accent`, `shadow-glow-success`). They arrived as
  `dropShadow` only, for D16's icon glows; a glow on a *surface* is a box
  shadow, and Peek's composer had been writing its send button's as an
  arbitrary value for want of the utility (`ADOPTION.md` P22). `cn()` knows
  both, and `cn.test.ts` pins the pair to the preset.

#### Removed

- **`Field`'s `htmlFor` prop is gone.** It existed to name the generated id
  from outside, and there is no generated id to name any more: an `id` set on
  the control is kept, and the label follows it, which is the same job done
  from the side that can actually see the control. **Callers affected: none**
  — the only use was this package's own test.

- **`useFieldControlId` is gone.** It was the opt-in every control had to
  call to be named by a surrounding `Field`, and Base UI does that job now.
  **Callers affected: none** — read from both apps on 2026-09-07, nothing
  outside this package ever imported it. It was exported, so this is a
  breaking change on paper; a consumer with a control of its own should
  render it through `Field.Control` instead.

#### Callers

- **Ship**: `NewProjectDialog` and `PairFolderDialog` can drop their
  hand-built helper and error lines — the `flex flex-col gap-1.5` wrapper,
  the `text-caption` span and the `aria-invalid` they pass — for `helper`
  and `error` (`ADOPTION.md` S7). Nothing forces it; the old markup still
  renders.
- **Peek**: the same in `MembersDialog`, `TopicDetailsDialog` and
  `TopicProjectPanel` (`ADOPTION.md` P16), and `ComposeBox`'s send button
  can trade `signal:shadow-[shadow:var(--glow-accent)]` for
  `signal:shadow-glow-accent` (P22).
- **Both**: any `ConfirmDialog` stops closing on a backdrop press. Nothing
  to change; worth knowing before someone reports it.

## 0.9.0 — 2026-09-07

### Added

- **Two hue washes: `accent-wash` and `success-wash`.** The same colours as
  `accent-outline` and `success-outline`, at a fill's strength rather than an
  edge's: the outlines are the theme's hue at 30%, these are the same hue at
  11%. Every theme gets them by the rule the outlines already follow, so the
  signal values are `rgba(86, 200, 255, 0.11)` and `rgba(63, 222, 140, 0.11)`,
  and ship's are its own accent and success at the same 11%.

  They come from Peek, which had defined its own `--accent-wash` and
  `--success-wash` under `.signal` and tinted rows with them through arbitrary
  values. Two of Peek's four did not move: `--accent-wash-2`, a border at 22%,
  becomes the existing `accent-outline` at 30% (Katerina, 2026-09-07), and
  `--warning-wash` was used by nothing but a swatch in Peek's own theme story,
  so it is deleted rather than adopted.

  The token count the contract test pins goes from 44 to 46.

## 0.8.0 — 2026-09-07

**The first of the three releases D19 asks for**: the apps take the Base UI
migration in three steps rather than one at the end, and this is step one.
Stages 0 to 2 — the rig and the rules, D16's transparent-colour tokens, the
Design Tokens page, then `Tabs`, `Checkbox`, `Button`, `IconButton` and
`PersonTrigger` onto their Base UI parts, with the new `disabledReason`.

`0.7.0` was published by Jan from `main` while this branch was open, and is
merged into it, so everything in `0.7.0` is here too.

**Nothing renders differently**, with two ruled exceptions, both visible in
the stage sections below: D16's scrim rounding, and the unchecked checkbox,
whose tick now sits in the box at rest so the control stops moving a pixel
when it is clicked.

**What a caller must do**, in full, is `migration docs/ADOPTION.md`. In
short: bump the version, and set `isolation: isolate` on the app's root
element, which is Base UI's one layout requirement. No prop changed at any
of the three stages — Ship's 305 tests and Peek's 988 pass against this
build with no caller change — so nothing else is forced. What the release
*offers* is `disabledReason`, which replaces six hand-written wrappers in
Ship, and eleven tokens for transparent colours that an opacity modifier
could never express.

### Stage 2 — the button family (2026-09-07)

The button family moves onto Base UI's Button: `Button`, `IconButton`,
`PersonTrigger`. Nothing renders differently: every story of the three
matches the stage-1 state to the pixel in both themes, and every Peek and
Ship story on the linked package matches 0.6.0 bar the two differences D16
and D17 already explain. Ship's 305 tests and Peek's 988 pass against the
packed tarball.

#### Added

- **`disabledReason` on `Button` and `IconButton`.** "Only offer actions
  that can succeed", done once: the button is disabled, stays reachable by
  Tab, and shows the reason as a tooltip on hover (in place of an
  IconButton's own tooltip). Ship wrote that wrapper by hand six times; each
  can now be `<Button disabledReason={reason}>`. The reason shows on hover
  only until Tooltip moves onto Base UI at stage 4; the pages say so. A
  button with a reason sits inside the tooltip's `inline-flex` wrapper, as
  Ship's hand-written ones already did.

#### Changed

- **`Button`, `IconButton` and `PersonTrigger` are built on Base UI's
  Button.** Same props, same classes, `type="button"` still the default,
  every native prop and a ref still pass through. Button's two sizes are
  spelled with the `btn-default` and `btn-small` type tokens and
  PersonTrigger's row with `body-2`, the same values as the pixel sizes
  they replace. Callers: 53 Button sites and 40 IconButton sites across
  Peek and Ship, and `IdentityMenu` for PersonTrigger; nothing to change.

#### For whoever changes the package

- PersonTrigger's row is named "AD Ana Duarte" by assistive technology,
  because the face's initials are text. Seen, not changed; the Avatar port
  (stage 6) settles it.

### Stage 1 — the pilot: Tabs and Checkbox (2026-09-07)

Two components move onto Base UI parts. Nothing renders differently, with
one ruled exception: every Tabs and Checkbox story matches the stage-0
baseline to the pixel in both themes, except the unchecked Checkbox on a
line of text, which now sits where the checked one does (below); and every
Peek and Ship story rendered against the linked package matches its own
0.6.0 baseline, except where D16 already explains the difference (below).

#### Changed

- **`Tabs` is built on Base UI Tabs.** Same props, same classes. New: the
  keyboard. The selected tab is the row's one Tab stop; ← and → select the
  previous and next tab and wrap at the ends; Home and End select the first
  and last. `onChange` fires only for a person's choice. `className` now
  lands on an outer box around the row (Base UI's Root); no caller passes
  one today. The two sizes are spelled with the type tokens (`text-body-2`,
  `text-caption`) instead of pixel values. Callers: Peek `TopicTabs`; Ship
  `IssuesView`, `ProjectsView`, `ProjectView`.
- **`Checkbox` is built on Base UI Checkbox.** With `onChange` it is the
  control as Base UI renders it, a `<span role="checkbox">` with a hidden
  input beside it; Space toggles, Enter no longer does (it is the form's
  key, as on a native checkbox); its click never reaches the row. **Without
  `onChange` it is now a picture, not a control**: hidden from assistive
  technology, no focus, no role. A row that owns the toggle must say the
  state itself (`aria-pressed`, or `aria-selected` on an option). Caller:
  Peek `AddToOpenWorkDialog`, whose rows are options with `aria-selected`
  already; its `aria-label` on the inert square is now ignored.
- **The Checkbox no longer moves when it toggles.** An empty box and a box
  with the tick hung on a line of text one pixel apart, on 0.6.0 as well, so
  every click moved the square (Katerina, 2026-09-07: "it should be
  fixed"). The tick is now always in the box and hidden when unchecked. The
  unchecked square sits where the checked one always did, one pixel lower
  than before on a line of text; in a flex row, where every caller puts it,
  nothing moved.

#### For whoever changes the package

- The `nested-interactive` exception on the Checkbox "Inside a row" story
  is gone; axe passes it in both themes.
- Two things the link into the apps taught, both in `CLAUDE.md`: stop an
  app's Storybook and Vite servers before `npm ci` there, or the restore
  fails half-way on a locked file; and an app's Vitest cannot run against a
  symlinked package once the package reaches React through a dependency
  (two copies of React), so a caller test runs against `npm pack`'s tarball
  instead. Ship's Tabs test passes that way.
- Seen through the link, not caused by this stage: Ship's dialog backdrops
  differ by one colour level (D16's scrim, the rounding already explained),
  and Peek's "urgent" chips draw Peek's own `--glow-warning` (8px, 0.8)
  instead of the package's (5px, 0.4), because Peek's `index.css` defines
  three `--glow-*` variables with the names D16 chose. `PLAN.md` Finding
  12, for Katerina.

### Stage 0 — the rules and the rig (2026-09-06)

Nothing renders differently. Every package story, both themes, matches the
0.6.0 baseline to the pixel (the three skeleton stories differ by their
pulse, as they always have).

#### Added

- **`@base-ui/react` is a dependency.** Nothing is built on it yet; every
  component with a Base UI counterpart moves onto it in the stages that
  follow (D6). External to the bundle, like `clsx` and `tailwind-merge`, so
  a consumer installs one copy through npm.
- **Eleven tokens for transparent colours (D16).** `bg-wash`, the five
  `*-outline` borders, `glow-warning`, `glow-success`, `glow-accent`,
  `highlight-inset` and `scrim`, in every theme. Kbd, Chip, Toast, AppShell
  and DialogShell spell their wash, outlines, glows, highlight and backdrop
  with them instead of hand-written `rgba(...)` values and `bg-black/50`.
  The signal values are what those components drew before, and the
  screenshots agree. `cn()` now knows the preset's shadow keys as well, so
  two shadow tokens in one merged list conflict the way two sizes do.
- **The guide pages ship.** `stories/` is in `files`, so Introduction,
  Getting started, Choosing a component and Design Tokens reach
  `node_modules/@estiva-app/ui/stories/`. The 37 component pages under
  `src/` already did.

#### For whoever changes the package

- `npm run test:a11y` renders every story in Chromium, once per theme, and
  runs axe on it; a violation fails. Its first run found the IconButton
  stories without an accessible name (fixed), ChipInput's unnamed input and
  the Checkbox row anatomy (cleared by their ports), and token contrast
  below AA in both themes (a ruling, `PLAN.md` stage 0.10). Each open one is
  a single rule switched off on a single story, with the measurement beside
  it.
- `npm run lint` is the token contract: no class Tailwind does not
  generate, no Tailwind ramp or palette, no raw colour in an arbitrary
  value. Class maps are named `*Styles` / `*_STYLES` so the lint reads them;
  Banner's and Toast's were renamed. Nine Signal-only translucent values
  ported verbatim from Peek, and the scrim, are named as exceptions.
- **The Design Tokens page is rebuilt.** One row per colour and shadow
  token: swatch, name, class, live value, and which components use it, read
  from their source when the page builds. Type specimens render in their own
  token and measure themselves; they carry no "used by", because most
  components still spell their sizes in pixels and the column would be half
  true. It sits inside Storybook's `Unstyled` block: the docs
  container used to set 16px on every specimen, so the whole ramp looked
  like one size.
- `isolation: isolate` on the Storybook roots, Base UI's one layout
  requirement. The apps set theirs at adoption.

## 0.7.0 — 2026-09-07

Published by Jan from `main`, before the migration branch above merges.

### Added

- **`Reaction`.** An emoji, how many people chose it, and whether you are
  one of them: Chip's pill at Button `small`'s height, `pressed` as the
  accent's muted tint and edge, `aria-pressed` for assistive technology,
  `aria-label` required because the emoji is decorative. Both apps had
  built their own; this is the one they will adopt. It is a plain
  `<button>` for now; it moves onto Base UI's `Toggle` with the rest of the
  tier (`PLAN.md` §16, stage 6).

## 0.6.0 — 2026-09-05

### Added

- **`Kbd` — the keyboard hint, extracted.** It already existed, drawn inline
  inside `MenuItem` for its `shortcut` prop. `Tooltip` needed the same chip —
  an icon button whose only other affordance is a key has nowhere else to say
  so — and a hint rendered two ways in two files is a hint that drifts. One
  definition now, three users: `MenuItem`, `Tooltip` and `SearchInput`.
  Exported, because a shortcuts sheet is a fourth.

- **`Tooltip` and `WithTooltip` take a `shortcut`.** Drawn as the `Kbd` chip
  after the label, with the gap the pair needs. Absent, nothing changes — every
  tooltip written to date renders exactly as before.

  It renders and does not format: a modifier is called Cmd on Apple platforms
  and Ctrl everywhere else — a word either way, never a glyph — and only the
  caller knows which platform it is looking at, so the finished label is
  passed in.

- **`IconButton` takes a `tooltipShortcut`.** Forwarded to `WithTooltip`, for
  the icon-only control whose only other affordance is a key. It does nothing
  without a `tooltip`, since there is no surface to draw it on.

- **`MenuPanel` — the menu's surface without its behaviour.** `Menu` owns
  Escape, outside-click and placement, which is right for a menu opened from
  a trigger and impossible for a type-ahead popup inside a text editor: the
  editor's suggestion plugin already owns the keyboard and positions the
  popup, so a second Escape handler fights it. Peek's `@`, `/` and `[` menus
  each drew the box by hand for that reason, and the three had drifted.
  `Menu` and `MenuSub` render `MenuPanel` too, so the surface still has
  exactly one definition.

- **`MenuItem` takes a `hint`** — what the row shows at its right edge *only*
  while it is the row you are pointing at or have arrowed onto. Pass it
  unconditionally; it replaces `trailing={active ? <EnterHint/> : undefined}`.

  That pattern could not be made to work, and this is why. The row's fill was
  CSS (`transition-colors`, 150ms); a React mount is instant. Measured, the
  hint was fully drawn at 6ms on a row whose fill had not started, and on the
  way out it vanished while the row stayed lit for another 150ms — so sweeping
  a pointer down a menu left two rows lit and chips popping between them.

  `hint` is always in the DOM and switched by the *same* `:hover` / `selected`
  that drives the fill. Measured across an interrupted 50ms-per-row sweep,
  the two are now identical on every frame. It shares a grid cell with
  `trailing`/`shortcut`/`submenu`, sized to the wider of the two, so the row
  also stops reflowing when the hint appears — labels used to lose 62–105px
  and re-truncate mid-hover.

### Changed

- **`EnterHint` is the `Kbd` chip.** It drew its own thing — a bare `↩` and a
  9px word — so a picker row and a menu row named the same key two ways in
  the same menu. Its `label` prop is now `target`, and it means what it
  always described: what pressing the key gives you (`↩ Enter #topic`), drawn
  after the chip rather than replacing its word. Callers passing `label` must
  rename; there is one in Peek and none in Ship.

- **`SearchInput`'s shortcut hint is the shared `Kbd`.** It used to draw its
  own chip; the chip it drew is the one `Kbd` was modelled on, so nothing
  moves in Signal. Under any other theme the hint now picks up the same
  treatment as every other key hint instead of its own.

- **A `ship` variant in the preset, beside `signal`.** Peek's theme is a class
  and Ship's is an attribute (`[data-theme='ship']`), so a rule written for
  `.signal &` reached only one of the two apps — the keycap treatment stopped
  at Peek's border. `ship:` now exists for the same job, and `Kbd` carries
  both.

- **Every `⌘` is gone from the stories and the docs**, replaced by the word.
  The glyph was wrong on Windows, and it is not in Geist Mono — it fell back
  to a system face and sat oddly beside the letter next to it.

- **A menu row's hover fill is instant.** It faded over 150ms, which meant
  anything appearing with it had to fade too — and a chip fading in and out
  under a moving pointer reads as flicker (Katerina, 2026-09-05, watching a
  fast sweep). Both the fill and the `hint` switch in one frame now. They
  still change on exactly the same `:hover`, so they cannot come apart.

### Fixed

- **A menu that overflows no longer squashes what is inside it.** `MenuItem`
  and the horizontal `Divider` are flex children of a column that scrolls at
  its max height, and a flex child shrinks before its container does — so
  past the fold every row collapsed to its `min-h` and every hairline to
  nothing. Both take `shrink-0` now, the same fix `NavItem` took in 0.4.0.

  Measured in Peek: rows given an explicit `h-12` were rendering 40px, and
  the `/` menu's two dividers had been 0px tall since it was built — designed
  in, never once visible. Nothing changes for a menu that fits.

## 0.5.0 — 2026-09-03

### Added

- **The Menu shell owns its placement.** The two ways a menu goes wrong are
  both placement — it opens inside a stacking context or scroll container
  and something covers or clips it, or it opens near an edge and runs off
  screen — and both shipped in one day (the identity menu under a `z-20`
  panel header; a highlight submenu cut by the right edge). `Menu` now takes
  an `anchor` element (plus `align`): it portals to the body and places
  itself with the same measured geometry `Select` has used since its own
  cut-off — under the trigger, flipped above when the room below is worse,
  clamped inside the viewport, closed by resize or page scroll. It stands at
  its full height whenever the room is there; only a menu taller than the
  screen scrolls (the 288px cap is Select's own, for option lists). `position` (caller-computed coordinates) is
  still honoured but now clamped on screen (`clampBox`). The in-flow mode
  remains for stories and static surfaces only.

- **`MenuSub` — the submenu, in the shell.** Two Peek menus hand-rolled the
  same hover-timed submenu; the copy dropped the ref its edge-flip measured,
  so it measured nothing and always opened rightward, off the screen. The
  shell's version portals, measures real rects (`fitSubmenu`), flips left at
  the right edge, and slides up at the bottom one. Hover timing kept: opens
  at once, closes 150ms after the pointer leaves row and panel both.

- **`AvatarGroup` takes a `size`.** It was fixed at 24px, so a denser row —
  a reply line's authors — hand-drew its own stack instead, and drifted while
  it did (four faces where the shared rule is three, and its own ring). The
  overlap and the ring scale with the size, which reproduces both hand-drawn
  stacks exactly: 8px overlap and a 2px ring at 24, 6px and 1.5px at 18.

- **`fit.ts`** — `fitMenu` (moved from `Select`, unchanged), `clampBox`,
  `fitSubmenu`: the pure viewport geometry, one module, unit-tested, and
  exported — a surface too bespoke for the Menu chrome (a hover preview
  card, say) places itself with the same functions instead of hand-rolling
  the flip.

- **`closeOnLeave` on `Menu`** — the hover-flow menus (a card's quick-menu
  ⋯) dismiss when the pointer leaves. The 150ms grace period is shared with
  any open `MenuSub` panel through context, so crossing into a portalled
  submenu never counts as leaving — the one hover region the old inline
  submenus had for free, kept.

### Changed

- **Initials sit on the tile's centre, not above it.** Centring a flex child
  centres its *line box*, and a line box reserves room under the baseline for
  descenders — which capitals never use — so every set of initials floated
  high. It also inherited whatever line-height surrounded it, so one face sat
  differently in a members pill than in a message row. Measured over six
  letter pairs at 18/24/36px: 0.64px high on average before, 0.06px after.
  (Per-letter variation remains — a "Y" carries its mass up top — but that is
  the letterform, not the box.)

- **A stacked face is the size it says it is.** `AvatarGroup` drew its
  separating ring as a `border`, which box-sizing takes out of the inside: a
  24px avatar showed 20px of face, an 18px one only 14px. The ring is a
  shadow now, drawn outside, costing the face nothing.

- **The last two unclamped axes are clamped.** `WithTooltip` flipped and
  clamped horizontally but not vertically — a `top` tooltip near the
  viewport's top edge left the screen; it now flips and clamps both ways.
  `ChipInput`'s suggestion list hung blindly below its input; it goes
  through `fitMenu` (rows are a fixed 48px, so no second render pass) and
  flips upward when the input sits low.

- **`IdentityMenu` hangs its panel from the trigger through the portal.**
  In-flow, the panel inherited the floating top bar's `z-10` stacking
  context and anything at `z-20` painted over it. Same place on screen,
  nothing can cover it. `IdentityPanel` grew an optional `anchor` for this;
  without it the stories' in-flow rendering is unchanged.

### Fixed

- **The solid `AppShell` seals the document the way the floating one always
  has.** An absolutely positioned descendant with no positioned ancestor —
  Tailwind's `sr-only` is the everyday case — belongs to the *viewport*, so
  no scroll container on the page clips it, and the document gains its
  static position as scroll range: the whole page scrolls, navigation and
  top bar included. The floating frame's root already carried
  `relative overflow-hidden`; the solid frame's root now does too.
  `relative` claims such strays for the shell, `overflow-hidden` clips them
  at its edge — either alone seals nothing.

  Surfaced in Ship: a screen-reader-only table header sitting below the
  first screen of a long project description made the entire project page
  scrollable by exactly that distance.

## 0.4.0 — 2026-09-02

### Fixed

- **`Field`'s label now names its control** (SHA-17). It rendered a `<label>`
  with no `htmlFor` and the control as its *sibling*, so there was neither an
  explicit nor an implicit association: a screen reader announced an unlabelled
  edit box, and clicking the label focused nothing.

  It surfaced in a consumer's test — `getByLabelText(/title/i)` failing with
  *"Found a label with the text of: /title/i, however no form control was found
  associated to that label"* — and that consumer queried by role instead. The
  guard belongs here.

  `Field` generates an id with `useId` and provides it through context;
  `TextInput` and `Textarea` adopt it. `Select` was already reachable, because
  it takes an `ariaLabel` its callers pass.

### Added

- **`Field` takes `htmlFor`**, for when something outside has to name the
  control — a form library, or an `aria-describedby` elsewhere.

- **`useFieldControlId` is exported**, so a new primitive that renders a
  labelable element can join in with one line.

### Changed

- **Inside a `Field`, the Field's id wins over an `id` on the control.** Only
  one of the two places can set both halves of the association; letting the
  control win leaves the label pointing at the generated id and reproduces the
  defect above. Pass `htmlFor` to the `Field` instead. Outside a Field nothing
  changes — the control keeps its own id.

### Notes for consumers

The automatic alternative — nesting the control inside the `<label>` — labels
anything by construction and needs no cooperation from the control. It is not
used here: a control that is both nested in a label and named by its `htmlFor`
can take two activations from one click, which is a real hazard for a checkbox
and this library has one.

These are the package's first DOM tests. `environment: 'jsdom'` is set per-file
rather than globally, because setting it globally broke `tokens.test.ts`, which
reads `tokens.css` through `import.meta.url`.

## 0.3.0 — 2026-09-02

### Added

- **`EditableText` gains `displayNode`** — what to *draw* when not editing,
  for a value that is structured rather than a line of prose. A node rather
  than a string, because a heading and a bullet are elements.

  `display` stays the string and stays what decides emptiness, so a blank
  field still shows its placeholder instead of an empty element, and `value`
  is still what the editor opens with and what a commit compares against —
  **what is edited is unchanged.**

  `whitespace-pre-wrap` is dropped when it is set: structured content carries
  its own line breaks, and preserving the source's as well doubles every one.

  Added for Estiva Ship's issue description, which is rich text under SPEC
  §13. Nothing here knows that — the app renders its own body and hands the
  result in, which is the same seam `display` already had.

## 0.2.0 — 2026-09-02

The library grows from 13 primitives to the whole interface kit: 37
components, every one documented, and the application frame itself.

### Added — components

- **Inputs**: Checkbox · ChipInput + InputChip (generic multi-select with
  typeahead) · EditableText (text you click to edit) · SearchInput.
- **Overlays**: Menu + MenuItem + MenuSection + MenuRow + EnterHint (THE
  menu shell — Escape and outside-click owned by the shell) ·
  ConfirmDialog.
- **Navigation**: Tabs (counts as baseline-aligned mono numbers; a zero is
  drawn) · Breadcrumb (truncating crumbs grow tooltips; mono refs never
  shrink) · SectionHeader · IdentityMenu + IdentityPanel (the account menu,
  ready-made — sections hide when the app cannot fill them).
- **People**: Person · PersonTrigger (row and compact shapes) · AvatarGroup.
- **Feedback**: Toast + ToastProvider/useToast · Banner (four tones; only
  `error` is `role="alert"`).
- **The frame**: TopBar (`solid` in flow / `floating` over the content;
  `menu` + `logo` + `search` + `right` slots) · AppShell (two paired
  manners — solid bar + Sidebar, floating bar + Rail + the rounded content
  card; the banner draws in the content area) · Sidebar + NavItem ·
  Rail + RailItem.
- **Primitives**: Property (row and stacked layouts) · SectionLabel.

### Added — everything else

- **Docs**: every component has a hand-written page — live example first,
  when to use it, when not (with the alternative named), how, a keyboard
  table where one applies, props. Plus Getting started (wire a new app in
  six steps), Choosing a component (decision tables), and a redesigned
  Design Tokens page with live values. All product-agnostic.
- `cn()` knows the preset type ramp — token size classes survive merging
  beside a colour (the tailwind-merge trap, retired for `cn` users).
- `base.css` export: the shared scrollbar chrome.
- `--text-interactive` joins the tokens, in every theme.
- Select keeps its menu on screen (clamped, height-capped, flips upward,
  120px floor) and its own scroll no longer dismisses it.

### Changed

- Rows defend their height: NavItem, RailItem and menu rows carry
  `shrink-0`, so an overflowing column scrolls instead of compressing.
- Avatar initials come from the first two words that begin with a letter —
  a name led by symbols yields one letter, never punctuation.

### Notes for consumers

- Everything is additive; no 0.1.0 API changed shape.
- Documented themes are `signal` and `ship`. The `light`/`dark` blocks
  remain in tokens.css but are no longer part of the documented surface.
