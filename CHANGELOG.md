# Changelog

## 0.4.1 — 2026-09-03

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
