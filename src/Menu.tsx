import { createContext, useContext, type ComponentPropsWithRef, type ReactElement, type ReactNode, type RefObject } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { cn } from './cn'
import { triggerDisabled } from './triggerDisabled'
import { ScrollArea } from './ScrollArea'
import { Kbd } from './Kbd'
import { SectionLabel } from './SectionLabel'

/**
 * THE menu shell (2026-09-01) — extracted once, for every menu in every app.
 * On Base UI's `Menu` since stage 4 of the migration (2026-09-07).
 *
 * Peek has no single Menu file; its topic menu, conversation menus, files
 * menu and the top bar's account menu each hand-roll the same thing, and
 * they disagree: some close on Escape, most do not, and row heights and
 * minimum widths drift copy by copy. Ship extracted the shape so it would
 * not become the next copy; the package exists so nobody becomes the one
 * after that.
 *
 * What every menu shares, kept exactly: an elevated container with a
 * hairline border, 8px radius, 8px padding and the large shadow; items that
 * are 8px-radius rows, `px-2 py-1.5` and never shorter than 36px, hover
 * fill, 14px text, destructive ones in the error colour; section headings
 * as a SectionLabel in a 32px row; and the two exits every menu has — Escape and a click outside.
 *
 * **What stage 4 changed, and it is the first thing a keyboard user notices:
 * the arrow keys walk the rows.** ↑ and ↓ move between items and wrap, Home
 * and End jump to the ends, typing a row's first letters jumps to it, and
 * focus moves into the menu when it opens and back out when it closes. None
 * of that existed; a menu was a portalled box of buttons you tabbed through.
 *
 * Deleted with the port: the `createPortal`, the `mousedown` listener on
 * `document`, the Escape listener beside it, the resize and scroll listeners,
 * the provisional hidden render this component did in order to measure
 * itself, and `fit.ts` — the shared geometry the shell and Select both used.
 * Floating UI places, flips and clamps all of it.
 *
 * The three anchorings are unchanged, and all three now portal (the third
 * did not, which is exactly how the identity menu got covered by a z-indexed
 * panel header in the first place):
 * - `anchor` (an element, or a rect a click handler measured): the menu hangs
 *   under it, flips above when the room below is worse, and stays on screen.
 *   `align="right"` hangs the menu's right edge from the anchor's.
 * - `position` (viewport coordinates the caller computed): the corner the
 *   caller chose, as a virtual anchor, so it still cannot land off screen.
 * - neither: under the element the menu sits in, right-aligned — what
 *   `absolute right-0 top-full mt-1` drew, but portalled, so no ancestor's
 *   stacking context or overflow can clip it.
 */
/**
 * Whether a row is inside a `Menu`.
 *
 * It is load-bearing: `MenuItem` and `MenuSection` are also used
 * inside a bare `MenuPanel`, with no `Menu` around them — Peek's `@`, `/` and
 * `[` pickers and its compose menu all do that, because a popup inside a text
 * editor cannot have a menu's keyboard: the editor's suggestion plugin already
 * owns it. A Base UI `Menu.Item` outside a `Menu.Root` has no context to read,
 * so those rows stay exactly the buttons they have always been, and only rows
 * inside a real menu become the part.
 */
const MenuContext = createContext<{ openOnHover: boolean } | null>(null)

/**
 * The menu's surface, with none of its behaviour — an elevated box with a
 * hairline border, 8px radius, 8px padding and the large shadow.
 *
 * Split out of `Menu` on 2026-09-05. `Menu` owns Escape, outside-click,
 * placement and now the keyboard, and that is right for a menu opened from a
 * trigger — but a type-ahead popup inside a text editor cannot have them: the
 * editor's suggestion plugin already owns the keyboard and positions the
 * popup, and a second Escape handler fights it. So Peek's `@`, `/` and `[`
 * menus each drew this box by hand, and the three had already drifted apart.
 *
 * `Menu` renders this, so there is still exactly one definition of the
 * surface — change it here and every menu in every app follows.
 *
 * Width, height and internal rhythm belong to the caller: a picker that lists
 * people is not the width of one that lists verbs.
 */
export interface MenuPanelProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Optional only because Base UI fills it in when this is a `render`
   *  target: `Menu.Popup` supplies the children. Every other caller passes
   *  them. */
  children?: ReactNode
}

export function MenuPanel({ children, className, ...props }: MenuPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border-default bg-bg-elevated p-2 shadow-lg',
        /*
         * A divider in a menu runs the width of the rows it separates.
         *
         * `Divider` is inset 12px each side, which is right in a page and
         * wrong here: measured in a 180px menu, the rule started 21px from the
         * panel's edge where the rows start at 9px — 12px narrower on each side
         * than the things it divides. `IdentityMenu` was already cancelling it
         * by hand with `mx-0`, which is the sign it belonged here (Katerina,
         * 2026-09-08). Direct children only, so a divider a caller puts inside
         * a row keeps its own spacing.
         */
        '[&>[role=separator]]:mx-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface MenuProps {
  /**
   * The control that opens the menu. Any element that forwards its ref and
   * spreads its props — this package's `Button`, `IconButton` and
   * `PersonTrigger` all do.
   *
   * The menu owns it, and that is the point: Base UI can only do the toggle,
   * the placement, the focus return, the first-item highlight and the whole
   * hover choreography if it knows which element opened it.
   */
  trigger: ReactElement
  /** Which of the menu's edges hangs from the trigger's. Default left. */
  align?: 'left' | 'right'
  /**
   * Open on hover, and close shortly after the pointer leaves — for a control
   * that only appears while the pointer is on a card.
   *
   * Base UI owns the whole choreography, including the diagonal from a row
   * out to a submenu panel. The shell used to hand-write this and got it
   * wrong in two directions.
   */
  openOnHover?: boolean
  /** Controlled, for a caller that must know or must force it. Leave both
   *  off and the menu keeps its own state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Base UI's imperative handle. `actions.current?.close()` shuts the menu —
   *  for a row that must close it before opening what it opens. A `MenuItem`
   *  closes the menu by itself, so this is only for content that is not one. */
  actionsRef?: RefObject<{ close: () => void; unmount: () => void } | null>
  children: ReactNode
  /** On the menu's surface — its width. **Not its padding**: see
   *  `contentClassName`. */
  className?: string
  /**
   * The padding around the rows, as a class. Default `p-2`, 8px.
   *
   * It is on the scrolling content, not on the panel, so the scrollbar hugs the
   * panel's edge (D63) — and so a padding class on `className` adds to it
   * rather than replacing it. Peek's Later menu asked for `p-1` there and got
   * 12px from `0.12.6` on (PLAN Finding 60). Set it here.
   */
  contentClassName?: string
}

/**
 * Read from `globalThis` rather than as a bare `process`: the declaration
 * build carries no ambient types on purpose, so that a consumer of this
 * package does not inherit Node's. Every bundler still replaces the value.
 */
const isProduction = () =>
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production'

/** The 4px between a menu and its trigger, and the 8px it keeps clear of
 *  every screen edge — the two numbers `fit.ts` used. */
const GAP = 4
const VIEWPORT_PAD = 8
/** A hover menu opens at once and closes 150ms after the pointer leaves —
 *  the two numbers the hand-written version used. */
const HOVER_OPEN_DELAY = 0
const HOVER_CLOSE_DELAY = 150

export function Menu({ trigger, align = 'left', openOnHover = false, open, onOpenChange, actionsRef, children, className, contentClassName }: MenuProps) {
  return (
    <BaseMenu.Root
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      actionsRef={actionsRef}
      /* Non-modal, as every menu here has always been: the page behind keeps
         its scrollbar, so opening a menu never shifts the layout. */
      modal={false}
    >
      <BaseMenu.Trigger
        render={trigger}
        /* The part writes its own disabled state over the button's, so a
           disabled trigger came out `aria-disabled="false"` and opened
           (Finding 39, Ship's adoption, 2026-09-08). It is told what the
           button already knows. */
        disabled={triggerDisabled(trigger)}
        openOnHover={openOnHover}
        delay={HOVER_OPEN_DELAY}
        closeDelay={HOVER_CLOSE_DELAY}
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          side="bottom"
          align={align === 'right' ? 'end' : 'start'}
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          className="z-50 data-[anchor-hidden]:hidden"
        >
          <BaseMenu.Popup
            data-interactive
            /* `outline-none`: the popup is a programmatic focus target, not
               something a keyboard user tabs to. Without it Chrome rings the
               WHOLE panel when the menu is opened from the keyboard, which
               reads as "the menu is one thing" rather than "these rows are the
               things" — measured, `outline: auto 1px`. The rows keep their own
               highlight. Exactly the fix `DialogShell`'s card needed at stage
               3, in a second place.

               `--available-height` is the room Floating UI found after flipping
               and clamping; the shell passes no cap of its own, so a menu stands
               as tall as it can and scrolls only when the screen truly has no
               room. Select's 288 was never this component's — the identity
               panel got it by accident once and grew a scrollbar at full
               height. */
            className={cn('min-w-[180px] outline-none p-0', className)}
            render={<MenuPanel />}
          >
            {/* The height cap sits on the box that scrolls — on the panel it
                let the box grow to its content and nothing scrolled (measured,
                2026-09-08).
             *
             * And **the padding is on the content, not on the panel** (D63,
             * 2026-09-13). With it on the panel the scrolling box was inset by
             * it, so the bar floated 9px in from the panel's edge where every
             * other scrolling surface in the suite draws it at 1px —
             * `DialogShell` had it right and said so in its own comment, and
             * this is the same arrangement. The rows do not move: the padding
             * that used to be the panel's is now the content's, at the same
             * 8px. The cap loses its `- 1rem` for the same reason — the
             * padding is inside the scrolling box now, so the panel is exactly
             * as tall as Floating UI allowed.
             *
             * A caller's `className` still lands on the panel, so a caller
             * asking for different padding needs `contentClassName`. That
             * sentence was written at 0.12.6 and the prop was not: a `p-1` on
             * `className` added 4px to these 8px instead of replacing them
             * (PLAN Finding 60). The prop exists now. */}
            <ScrollArea viewportClassName="max-h-[var(--available-height)]" contentClassName={cn('flex flex-col p-2 [&>[role=separator]]:mx-0', contentClassName)}>
              <MenuContext.Provider value={{ openOnHover }}>{children}</MenuContext.Provider>
            </ScrollArea>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

/**
 * A row that opens another menu beside it — the submenu two Peek menus
 * hand-rolled before this, one of which dropped the ref its edge-flip
 * measured and shipped a submenu cut off by the screen (2026-09-03).
 *
 * Hover-timed as those were, and as ours was: it opens at once and closes
 * 150ms after the pointer leaves, so the diagonal from row to panel survives.
 * Those two numbers are all that is left of the old implementation — the
 * placement, the flip at a screen edge, and now the arrow keys (→ opens it,
 * ← closes it) are Base UI's.
 */
export interface MenuSubProps {
  /** The trigger row's label. */
  label: string
  leading?: ReactNode
  /** Mark the trigger row as holding a current value. */
  selected?: boolean
  /** The submenu's rows. */
  children: ReactNode
  /** On the submenu panel. */
  className?: string
}

export function MenuSub({ label, leading, selected, children, className }: MenuSubProps) {
  /*
   * A submenu inside a hover-opened menu strands it.
   *
   * Measured 2026-09-08: enter the submenu's panel, then leave in any
   * direction that does not cross back over the parent, and neither the
   * submenu nor the menu ever closes again — at 200ms, 500ms, 1s and 2s.
   * Both triggers hard-code Floating UI's `safePolygon({ blockPointerEvents:
   * true })`, which blocks pointer events while the path from row to panel is
   * live; leaving that way never resolves the polygon. There is no prop.
   *
   * So the rule is: no `openOnHover` on a menu that has one of these. This
   * says so out loud rather than leaving it to the page, because the failure
   * is a menu that will not go away and the cause is two files apart.
   */
  const menu = useContext(MenuContext)
  if (!isProduction() && menu?.openOnHover) {
    console.error(
      '[@estiva-app/ui] Menu: `openOnHover` and `MenuSub` cannot be used together — ' +
        'leaving the submenu panel strands the menu open. Open this menu on a press instead. ' +
        'See Menu.mdx, "Hover-opened menus".',
    )
  }
  return (
    <BaseMenu.SubmenuRoot>
      <BaseMenu.SubmenuTrigger
        openOnHover
        delay={0}
        closeDelay={150}
        nativeButton
        render={<button type="button" />}
        className={menuItemClassName({ size: 'default', selected })}
      >
        <MenuItemBody label={label} leading={leading} submenu />
      </BaseMenu.SubmenuTrigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          side="inline-end"
          align="start"
          sideOffset={GAP}
          collisionPadding={VIEWPORT_PAD}
          className="z-50 data-[anchor-hidden]:hidden"
        >
          <BaseMenu.Popup className={cn('w-[160px]', className)} data-interactive render={<MenuPanel />}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.SubmenuRoot>
  )
}

export interface MenuItemProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  label?: string
  /** Replaces the label/description block — for rows whose middle is richer
   *  than text (the launcher's form rows). Leading/trailing still apply. */
  children?: ReactNode
  /** `tall` is the picker row — content height with a 40px floor, px-3,
   *  gap-3, room for a 32px face or icon tile and the description line.
   *  `default` is the command row. */
  size?: 'default' | 'tall'
  /** A second line under the label — a role, an address — 12px, secondary, truncating. */
  description?: string
  /** Before the label: a 16px icon (stroke 1.5, secondary), or an Avatar, for rows led by a face. */
  leading?: ReactNode
  /** At the right edge: a hint, a value — anything. Wins over `shortcut` and `submenu`. */
  trailing?: ReactNode
  /**
   * Shown at the right edge **only while this row is the one you are pointing
   * at or have arrowed onto** — an `EnterHint`, typically.
   *
   * Pass it unconditionally. Do not do `trailing={active ? <EnterHint/> : undefined}`:
   * that mounts the hint, and a mount is instant while the row's own fill is a
   * 150ms fade, so the hint lands ahead of the highlight on the way in and
   * vanishes ahead of it on the way out (measured 2026-09-05 — ~7 frames of a
   * chip sitting on an unhighlighted row, and two rows lit at once when
   * sweeping). This slot is always in the DOM and revealed by the *same*
   * `:hover` / `selected` the fill uses, on the same duration and curve, so
   * the two cannot come apart — and the row does not reflow when it appears.
   *
   * It cross-fades with `trailing`/`shortcut`/`submenu` rather than displacing
   * them, and reserves the wider of the two, so nothing moves either way.
   */
  hint?: ReactNode
  /** A keyboard hint, drawn as the kbd chip. */
  shortcut?: string
  /** The row opens another menu: draws the chevron at the right edge. */
  submenu?: boolean
  destructive?: boolean
  /** The row the menu currently points at (a submenu's chosen value). */
  selected?: boolean
}

/**
 * The row's class list, written once because `MenuSub`'s trigger row is the
 * same row.
 *
 * `data-highlighted` joins `:hover` here, and that is the whole visible
 * consequence of the port: the fill that followed the pointer now also
 * follows the arrow keys, because Base UI sets one attribute for both.
 */
/** The row's look, shared inside the package: `MenuItem` draws it, and
 *  `Select` puts it on Base UI's `Select.Item`, whose parts (`ItemText`,
 *  `ItemIndicator`) have to stay the element's own. One row, two parts. Not
 *  exported from the package's index. */
export function menuItemClassName({ size, selected, className }: { size: 'default' | 'tall'; selected?: boolean; className?: string }) {
  return cn(
    // shrink-0: a menu is a flex column that scrolls at its max height,
    // and a flex child shrinks before its container does — so every row
    // in an overflowing menu was squashed to its `min-h`, and a row given
    // an explicit height silently lost it (Peek's `[` menu: h-12 rows
    // measured 40px). The same fix NavItem took on 2026-09-02.
    // `group`: the `hint` slot reveals itself from this row's own :hover,
    // so the hint and the fill are one CSS state change, not two engines.
    //
    // No transition on the fill (Katerina, 2026-09-05). It faded over
    // 150ms, and anything appearing with it had to fade too or arrive
    // ahead of it — which, sweeping a pointer down a list, read as the
    // hint flickering in and out. Both are instant now: they still change
    // on exactly the same :hover, so they cannot come apart, and a row
    // lights and unlights crisply as the pointer crosses it.
    'group flex w-full shrink-0 cursor-pointer items-center rounded-lg text-left outline-none hover:bg-bg-hover data-[highlighted]:bg-bg-hover',
    // Both sizes are as tall as their content and never shorter than a
    // floor: 36px for a default row (Katerina, 2026-09-11), 40px for a
    // tall one (Katerina, 2026-09-01). A single-line action row sits at
    // 36, a picker row at 40, a row with a 32px face and a role line
    // comes out at its natural 48. One rule, not a hand-picked height
    // per file — Peek's Later menu had been forcing `h-9` for exactly
    // this 36px and was the only menu in either app out of step.
    size === 'tall' ? 'min-h-10 gap-3 px-3 py-1.5' : 'min-h-9 gap-2 px-2 py-1.5',
    selected && 'bg-bg-hover',
    className,
  )
}

/** Everything inside the row — written once, for the same reason. */
function MenuItemBody({ label, children, size = 'default', description, leading, trailing, hint, shortcut, submenu, destructive, selected }: Pick<MenuItemProps, 'label' | 'children' | 'size' | 'description' | 'leading' | 'trailing' | 'hint' | 'shortcut' | 'submenu' | 'destructive' | 'selected'>) {
  const edge =
    trailing ??
    (shortcut ? (
      <Kbd>{shortcut}</Kbd>
    ) : submenu ? (
      <IconChevronRight size={16} stroke={1.5} className="shrink-0 text-text-muted" />
    ) : null)
  return (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      {/* Sizes are arbitrary values (the body-2 and caption tokens): these
          lists merge with a colour, and tw-merge drops a token size beside a
          colour. Ship's copy said `text-sm`, which was never the ramp. */}
      {children ?? (
        <span className={cn('flex min-w-0 flex-1 flex-col', size === 'tall' && 'gap-[2px]')}>
          <span className={cn('truncate text-body-2', destructive ? 'text-error-default' : 'text-text-primary')}>
            {label}
          </span>
          {description && <span className="truncate text-caption text-text-secondary">{description}</span>}
        </span>
      )}
      {(edge || hint) && (
        // One grid cell holding both, right-aligned: the slot is as wide as
        // the wider of the two and never changes, so revealing the hint moves
        // nothing. No transition here either — the hint switches on the same
        // :hover / `selected` as the fill, in the same frame.
        <span className="grid shrink-0 items-center justify-items-end [&>*]:col-start-1 [&>*]:row-start-1">
          {edge && (
            <span className={cn('flex items-center', hint && 'group-hover:opacity-0 group-data-[highlighted]:opacity-0', hint && selected && 'opacity-0')}>
              {edge}
            </span>
          )}
          {hint && (
            <span className={cn('flex items-center opacity-0 group-hover:opacity-100 group-data-[highlighted]:opacity-100', selected && 'opacity-100')}>
              {hint}
            </span>
          )}
        </span>
      )}
    </>
  )
}

export function MenuItem({ label, children, size = 'default', description, leading, trailing, hint, shortcut, submenu, destructive, selected, className, ...props }: MenuItemProps) {
  const body = (
    <MenuItemBody
      label={label}
      size={size}
      description={description}
      leading={leading}
      trailing={trailing}
      hint={hint}
      shortcut={shortcut}
      submenu={submenu}
      destructive={destructive}
      selected={selected}
    >
      {children}
    </MenuItemBody>
  )
  const rowClassName = menuItemClassName({ size, selected, className })

  /*
   * Inside a `Menu` the row is Base UI's `Menu.Item`: it joins the roving
   * focus, answers the typeahead, and closes the menu when it is chosen.
   * `nativeButton` keeps the `<button>`; the part would draw a `<div>`.
   *
   * Outside one — a bare `MenuPanel` in an editor popup — it is a plain
   * button, **with no `role="menuitem"`**. It used to carry the role
   * unconditionally, which made an orphan: ARIA requires a `menuitem` to sit
   * inside a `menu` or a `menubar`, and `MenuPanel` is a `<div>` with no role
   * at all. Four Peek files draw rows that way, so four surfaces were telling
   * a screen reader they were menu items of nothing.
   *
   * A button is what these rows actually are. The pickers they sit in are a
   * listbox pattern rather than a menu — the editor's plugin owns the
   * highlight and the keyboard — and saying so properly is `ChipInput`'s
   * stage, not this one; claiming the wrong role in the meantime is worse
   * than claiming none.
   */
  if (!useContext(MenuContext)) {
    return (
      <button type="button" className={rowClassName} {...props}>
        {body}
      </button>
    )
  }
  return (
    <BaseMenu.Item
      nativeButton
      render={<button type="button" />}
      className={rowClassName}
      /* `Menu.Item` types its handlers for the `<div>` it would draw by
         default. `render` makes it the `<button>` this row has always been,
         and `nativeButton` tells Base UI so — but the prop types do not
         follow the render target, so a caller's `onClick` is a button
         handler facing a div signature. The element underneath is a
         `<button>`, which `Menu.test.tsx` pins. */
      {...(props as ComponentPropsWithRef<'div'>)}
    >
      {body}
    </BaseMenu.Item>
  )
}

/**
 * The keyboard hint a picker row shows while highlighted — hand-rolled in
 * five files before this (2026-09-01), and drawn as its own thing until
 * 2026-09-05, when it became the `Kbd` chip every other key hint uses. A
 * picker row and a menu row sit in the same menu; they named the same key
 * two ways.
 *
 * `target` is what pressing it gives you, when that is worth saying — the
 * topic picker's "↩ Enter #topic". It sits after the chip, in the picker's
 * own 9px voice, because it is not a key.
 *
 * Katerina, 2026-09-05, told the measurement and asked again: the chip keeps
 * the `↩` character. It is not in Geist Mono — the browser borrows it, so it
 * advances 8.63px where the font's own characters advance 6 — and that is a
 * knowing trade for the glyph, not an oversight. If the width ever has to go,
 * Tabler's IconCornerDownLeft draws the same shape.
 */
export function EnterHint({ target }: { target?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-text-muted">
      <Kbd>↩ Enter</Kbd>
      {target && (
        <span className="text-menu signal:font-mono signal:text-small signal:tracking-wider">{target}</span>
      )}
    </span>
  )
}

/**
 * A section heading inside a menu: the 32px row with a SectionLabel, read
 * secondary — a heading inside a menu labels the rows, it is not one of
 * them (Katerina, 2026-09-01).
 *
 * Inside a `Menu` it is Base UI's `Menu.Group` with the heading as its
 * `GroupLabel`, so the rows under it are announced as a named group rather
 * than as a run of items with a stray line above them. Outside one — the
 * editor pickers, which draw the surface but not the menu — it is the two
 * plain elements it has always been.
 */
export function MenuSection({ label, children, className }: { label: string; children: ReactNode; /** On the heading row — a surface whose rows are px-3 aligns its heading with px-3. */ className?: string }) {
  const inMenu = useContext(MenuContext) !== null
  const heading = (
    <div className={cn('flex h-8 items-center px-2', className)}>
      <SectionLabel className="text-text-secondary">{label}</SectionLabel>
    </div>
  )
  if (!inMenu) {
    return (
      <div className="flex flex-col">
        {heading}
        {children}
      </div>
    )
  }
  return (
    <BaseMenu.Group className="flex flex-col">
      <BaseMenu.GroupLabel render={heading} />
      {children}
    </BaseMenu.Group>
  )
}

/** A non-interactive row inside a menu, at the item's own geometry. */
export function MenuRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 px-2 py-1.5', className)}>{children}</div>
}
