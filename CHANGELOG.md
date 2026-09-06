# Changelog

## Unreleased — the Base UI migration, stage 0 (2026-09-06)

Nothing renders differently. Every package story, both themes, matches the
0.6.0 baseline to the pixel (the three skeleton stories differ by their
pulse, as they always have).

### Added

- **`@base-ui/react` is a dependency.** Nothing is built on it yet; every
  component with a Base UI counterpart moves onto it in the stages that
  follow (D6). External to the bundle, like `clsx` and `tailwind-merge`, so
  a consumer installs one copy through npm.
- **The guide pages ship.** `stories/` is in `files`, so Introduction,
  Getting started, Choosing a component and Design Tokens reach
  `node_modules/@estiva-app/ui/stories/`. The 37 component pages under
  `src/` already did.

### For whoever changes the package

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
- `isolation: isolate` on the Storybook roots, Base UI's one layout
  requirement. The apps set theirs at adoption.

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
