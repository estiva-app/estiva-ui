import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { cn } from './cn'
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
 * are 8px-radius rows, `px-2 py-1.5`, hover fill, 14px text, destructive
 * ones in the error colour; section headings as a SectionLabel in a 32px
 * row; and the two exits every menu has — Escape and a click outside.
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
export interface MenuProps {
  onClose: () => void
  /** The trigger — an element, or the rect a click handler already measured.
   *  The menu portals to the body and places itself against it. */
  anchor?: HTMLElement | DOMRect | null
  /** With `anchor`: which of the menu's edges hangs from the anchor's. Default left. */
  align?: 'left' | 'right'
  /** Viewport coordinates; the menu is portalled, hung from `top`, aligned to whichever edge is given, and kept on screen. */
  position?: { top: number; right: number } | { top: number; left: number }
  /**
   * The control that opens this menu, when it is not the `anchor`.
   *
   * A press on it is the caller's own toggle, not a press outside the menu.
   * Without this the menu closes on the press and the caller's `onClick`
   * reopens it in the same gesture, which reads as "the menu ignores me" —
   * the flicker the old shell avoided with `onMouseDown` / `stopPropagation`,
   * which no longer helps because Base UI dismisses on a captured
   * `pointerdown`.
   *
   * An `anchor` element already does this, so only a `position` menu needs to
   * pass it.
   */
  trigger?: HTMLElement | null
  /** Close 150ms after the pointer leaves the menu — the hover-flow menus
   *  (quick-menu cards) dismiss this way. The grace period is shared with any
   *  open MenuSub panel, so crossing into a submenu never counts as leaving. */
  closeOnLeave?: boolean
  children: ReactNode
  className?: string
}

/** The 4px between a menu and what it hangs from, and the 8px it keeps clear
 *  of every screen edge — the two numbers `fit.ts` used. */
const GAP = 4
const VIEWPORT_PAD = 8

/**
 * Whether a row is inside a `Menu`, and the hover-grace timer it reports to.
 *
 * The first half is load-bearing: `MenuItem` and `MenuSection` are also used
 * inside a bare `MenuPanel`, with no `Menu` around them — Peek's `@`, `/` and
 * `[` pickers and its compose menu all do that, because a popup inside a text
 * editor cannot have a menu's keyboard: the editor's suggestion plugin already
 * owns it. A Base UI `Menu.Item` outside a `Menu.Root` has no context to read,
 * so those rows stay exactly the buttons they have always been, and only rows
 * inside a real menu become the part.
 */
const MenuContext = createContext<{ hold: () => void; release: () => void } | null>(null)

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
      className={cn('flex flex-col rounded-lg border border-border-default bg-bg-elevated p-2 shadow-lg', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** A `position` becomes a virtual anchor: a zero-size rect at the corner the
 *  caller chose. `right` is measured from the viewport's right edge, as it
 *  always was, so the menu's right edge lands there and `align="end"` does
 *  what the old `viewport.width - right - menu.offsetWidth` did. */
function virtualAnchor(x: number, y: number) {
  return {
    getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
  }
}

export function Menu({ onClose, anchor, align = 'left', position, trigger, closeOnLeave = false, children, className }: MenuProps) {
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hold = useCallback(() => clearTimeout(leaveTimer.current), [])
  const release = useCallback(() => {
    if (!closeOnLeave) return
    clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(onClose, 150)
  }, [closeOnLeave, onClose])
  useEffect(() => () => clearTimeout(leaveTimer.current), [])
  const hover = useMemo(() => ({ hold, release }), [hold, release])

  /* In-flow mode has no anchor of its own, so the element this component sits
     in becomes one — which is what `absolute right-0 top-full` was measured
     against anyway. A zero-height marker finds it; it is never seen. */
  const markerRef = useRef<HTMLSpanElement>(null)
  const inFlow = !anchor && !position

  const posLeft = position && 'left' in position ? position.left : undefined
  const posRight = position && 'right' in position ? position.right : undefined
  const posTop = position?.top

  const anchorTarget = useMemo(() => {
    /* A measured rect anchors as the WHOLE rect, not as its corner: the menu
       hangs below the rect's bottom edge and aligns to its left or right one,
       which is what a caller handing over a trigger's rect means by it. */
    if (anchor) return anchor instanceof Element ? anchor : { getBoundingClientRect: () => anchor }
    if (posTop !== undefined) {
      const x = posLeft ?? (posRight !== undefined ? window.innerWidth - posRight : 0)
      return virtualAnchor(x, posTop)
    }
    return () => markerRef.current?.parentElement ?? null
    // Callers build `position` inline every render, so depend on its numbers
    // rather than on the object.
  }, [anchor, posLeft, posRight, posTop])

  /* An anchored menu hangs under its anchor. A `position` menu hangs from the
     exact point the caller computed — that point already includes whatever gap
     the caller wanted (`rect.bottom + 4`), so this adds none. */
  const sideOffset = position ? 0 : GAP
  /* `align="right"` and the in-flow mode both hang the menu's RIGHT edge from
     the anchor's, which is what `right-0` drew. A `position` with `right` is
     the same idea against a point. */
  const alignEnd = inFlow || align === 'right' || posRight !== undefined

  return (
    <>
      {inFlow && <span ref={markerRef} className="hidden" aria-hidden="true" />}
      <MenuContext.Provider value={hover}>
        <BaseMenu.Root
          open
          onOpenChange={(next, details) => {
            if (next) return
            /*
             * Every reason closes the menu except one.
             *
             * `sibling-open` is Base UI saying "another menu opened beside
             * this one" — for a menubar, where opening the next menu closes
             * the last. A `MenuSub` opening fires it here too, measured: the
             * submenu registers with no parent in Floating UI's tree, because
             * this menu is opened by a caller rather than by a `Menu.Trigger`
             * inside the tree, so the parent test `details.parentNodeId ===
             * floatingParentNodeId` compares two nulls and matches. Acting on
             * it unmounted the whole menu the moment the pointer reached a
             * submenu row.
             *
             * Ignoring it is right rather than convenient: a `Menu` here is
             * always the outermost menu of its own tree — a caller renders one
             * and unmounts it — so there is no sibling it could legitimately
             * be closed by. Every real exit has its own reason and still
             * closes it: Escape, a press outside, choosing a row.
             */
            if (details.reason === 'sibling-open') return
            /*
             * A press on the control this menu hangs from is that control's
             * toggle, not a press outside — see the `trigger` prop. Base UI
             * cannot know it, because this menu is opened by a caller rather
             * than by a `Menu.Trigger` it owns.
             */
            const opener = trigger ?? (anchor instanceof Element ? anchor : null) ?? markerRef.current?.parentElement
            if (details.reason === 'outside-press' && opener?.contains(details.event.target as Node)) return
            onClose()
          }}
          /* Non-modal, as every menu here has always been: the page behind
             keeps its scrollbar, so opening a menu never shifts the layout. */
          modal={false}
        >
          <BaseMenu.Portal>
            <BaseMenu.Positioner
              anchor={anchorTarget}
              side="bottom"
              align={alignEnd ? 'end' : 'start'}
              sideOffset={sideOffset}
              collisionPadding={VIEWPORT_PAD}
              className="z-50 data-[anchor-hidden]:hidden"
            >
              <BaseMenu.Popup
                data-interactive
                /* `--available-height` is the room Floating UI found after
                   flipping and clamping — the shell passes no cap of its own,
                   so a menu stands as tall as it can and scrolls only when the
                   screen truly has no room. Select's 288 was never this
                   component's; it got it by accident once, and the identity
                   panel grew a scrollbar at full height (2026-09-03). */
                className={cn('min-w-[180px] max-h-[var(--available-height)] overflow-y-auto', className)}
                onMouseEnter={closeOnLeave ? hold : undefined}
                onMouseLeave={closeOnLeave ? release : undefined}
                render={<MenuPanel />}
              >
                {children}
              </BaseMenu.Popup>
            </BaseMenu.Positioner>
          </BaseMenu.Portal>
        </BaseMenu.Root>
      </MenuContext.Provider>
    </>
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
function menuItemClassName({ size, selected, className }: { size: 'default' | 'tall'; selected?: boolean; className?: string }) {
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
    // tall: as tall as its content, never shorter than 40px (Katerina,
    // 2026-09-01) — a single-line picker row sits at 40, a row with a
    // 32px face and a role line comes out at its natural 48. One rule,
    // not a hand-picked height per file.
    size === 'tall' ? 'min-h-10 gap-3 px-3 py-1.5' : 'gap-2 px-2 py-1.5',
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
          <span className={cn('truncate text-[14px] leading-[140%]', destructive ? 'text-error-default' : 'text-text-primary')}>
            {label}
          </span>
          {description && <span className="truncate text-[12px] leading-[120%] text-text-secondary">{description}</span>}
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

  /* Inside a `Menu` the row is Base UI's `Menu.Item`: it joins the roving
     focus, answers the typeahead, and closes the menu when it is chosen.
     Outside one — a bare `MenuPanel` in an editor popup — it stays the plain
     button it has always been, because there is no menu for it to be an item
     of. `nativeButton` keeps the `<button>`; the part would draw a `<div>`. */
  if (!useContext(MenuContext)) {
    return (
      <button type="button" role="menuitem" className={rowClassName} {...props}>
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
        <span className="text-[9px] font-medium leading-[115%] signal:font-mono signal:text-[9.5px] signal:tracking-[0.04em]">{target}</span>
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
