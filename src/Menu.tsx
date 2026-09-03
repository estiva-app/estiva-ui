import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
import { clampBox, fitMenu, fitSubmenu } from './fit'
import { SectionLabel } from './SectionLabel'

/**
 * THE menu shell (2026-09-01) — extracted once, for every menu in every app.
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
 * row; and the two exits every menu has — Escape and a click outside —
 * owned by the menu, never copied into a caller.
 *
 * Where it goes is owned here too (2026-09-03), because the two ways a menu
 * goes wrong are both placement: it opens inside a stacking context or a
 * scroll container and something covers or clips it, or it opens near an
 * edge and runs off the screen. Both shipped — the identity menu vanished
 * under a z-indexed panel header, a submenu was cut by the right edge — so
 * the shell now portals to the body (nothing in an app can cover the body's
 * last child at z-50) and fits itself to the viewport (fit.ts, the same
 * measured geometry Select uses). A caller hands over a trigger, not
 * coordinates.
 *
 * Three anchorings, in order of preference:
 * - `anchor` (an element, usually the trigger): portalled, measured, and
 *   placed by `fitMenu` — under the anchor, flipped above when the room
 *   below is worse, clamped inside the viewport, height-capped with its own
 *   scrollbar. `align="right"` hangs the menu's right edge from the
 *   anchor's. Closes on resize and on any page scroll, because both move
 *   the anchor out from under it.
 * - `position` (viewport coordinates the caller computed): portalled and
 *   clamped (`clampBox`) — the caller's corner survives, but can no longer
 *   land off screen.
 * - neither: in-flow under a `relative` wrapper, right-aligned. For stories
 *   and static surfaces only — inside an app this mode inherits every
 *   ancestor's stacking context and clip, which is how the identity menu
 *   got covered.
 */
export interface MenuProps {
  onClose: () => void
  /** The trigger — an element, or the rect a click handler already measured.
   *  The menu portals to the body and places itself against it. */
  anchor?: HTMLElement | DOMRect | null
  /** With `anchor`: which of the menu's edges hangs from the anchor's. Default left. */
  align?: 'left' | 'right'
  /** Viewport coordinates; the menu is portalled, hung from `top`, aligned to whichever edge is given, and clamped on screen. */
  position?: { top: number; right: number } | { top: number; left: number }
  /** Close 150ms after the pointer leaves the menu — the hover-flow menus
   *  (quick-menu cards) dismiss this way. The grace period is shared with any
   *  open MenuSub panel, so crossing into a portalled submenu never counts as
   *  leaving. */
  closeOnLeave?: boolean
  children: ReactNode
  className?: string
}

/** MenuSub reports its hover into the enclosing Menu's leave-grace timer, so
 *  a `closeOnLeave` menu survives the pointer crossing into a portalled
 *  submenu panel — the one hover region the old inline submenus had for free. */
const MenuHoverContext = createContext<{ hold: () => void; release: () => void } | null>(null)

export function Menu({ onClose, anchor, align = 'left', position, closeOnLeave = false, children, className }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hold = useCallback(() => clearTimeout(leaveTimer.current), [])
  const release = useCallback(() => {
    if (!closeOnLeave) return
    clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(onClose, 150)
  }, [closeOnLeave, onClose])
  useEffect(() => () => clearTimeout(leaveTimer.current), [])
  const portalled = Boolean(anchor || position)
  /** Where the menu actually goes — measured against the viewport after a
   *  hidden provisional render, so it is never covered and never cut off. */
  const [placed, setPlaced] = useState<{ left: number; top?: number; bottom?: number; maxHeight: number } | null>(null)

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Callers build `position` inline every render; depending on its
  // coordinates rather than the object keeps the effect from re-running
  // (and re-placing) on every parent render.
  const posLeft = position && 'left' in position ? position.left : undefined
  const posRight = position && 'right' in position ? position.right : undefined
  const posTop = position?.top

  useLayoutEffect(() => {
    if (!portalled || !ref.current) return
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const menu = ref.current
    if (anchor) {
      const rect = anchor instanceof Element ? anchor.getBoundingClientRect() : anchor
      const left = align === 'right' ? rect.right - menu.offsetWidth : rect.left
      setPlaced(
        fitMenu({
          anchor: { left, top: rect.top, bottom: rect.bottom },
          menu: { width: menu.offsetWidth, contentHeight: menu.scrollHeight },
          viewport,
        }),
      )
    } else if (posTop !== undefined) {
      const left = posLeft ?? viewport.width - (posRight ?? 0) - menu.offsetWidth
      setPlaced(clampBox({ box: { left, top: posTop, width: menu.offsetWidth, height: menu.offsetHeight }, viewport }))
    }
  }, [portalled, anchor, align, posLeft, posRight, posTop])

  /* An anchored menu is placed against its trigger's rect, and a resize or a
     page scroll moves the trigger out from under it — close, as Select does.
     A scroll INSIDE the menu is its own capped list working; leave those. */
  useEffect(() => {
    if (!anchor) return
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && ref.current?.contains(event.target)) return
      onClose()
    }
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [anchor, onClose])

  const style: CSSProperties | undefined = portalled
    ? placed
      ? { left: placed.left, top: placed.top, bottom: placed.bottom, maxHeight: placed.maxHeight }
      : // The provisional render: measured by the layout effect, never seen.
        { left: 0, top: 0, visibility: 'hidden' }
    : undefined
  const node = (
    <MenuHoverContext.Provider value={{ hold, release }}>
      <div
        ref={ref}
        role="menu"
        data-interactive
        className={cn(
          'z-50 flex min-w-[180px] flex-col rounded-lg border border-border-default bg-bg-elevated p-2 shadow-lg',
          portalled ? 'fixed overflow-y-auto' : 'absolute right-0 top-full mt-1',
          className,
        )}
        style={style}
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={closeOnLeave ? hold : undefined}
        onMouseLeave={closeOnLeave ? release : undefined}
      >
        {children}
      </div>
    </MenuHoverContext.Provider>
  )
  return portalled ? createPortal(node, document.body) : node
}

/**
 * A row that opens another menu beside it — the submenu two Peek menus
 * hand-rolled before this, one of which dropped the ref its edge-flip
 * measured and shipped a submenu cut off by the screen (2026-09-03).
 *
 * Hover-timed like those were: opens at once, closes 150ms after the
 * pointer leaves row and panel both, so the diagonal from row to panel
 * survives. The panel portals to the body and is placed by `fitSubmenu` —
 * right of the row when it fits, left when it does not, never past an edge
 * — so it also escapes whatever container its menu happens to be in.
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
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [placed, setPlaced] = useState<{ left: number; top: number } | null>(null)
  // The panel portals out of the menu's DOM, so hovering it would read as
  // "left the menu" to a closeOnLeave shell — report hover upward instead.
  const menuHover = useContext(MenuHoverContext)

  const enter = () => {
    clearTimeout(closeTimer.current)
    menuHover?.hold()
    setOpen(true)
  }
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
    menuHover?.release()
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  useLayoutEffect(() => {
    if (!open || !rowRef.current || !panelRef.current) {
      setPlaced(null)
      return
    }
    const row = rowRef.current.getBoundingClientRect()
    setPlaced(
      fitSubmenu({
        row: { left: row.left, right: row.right, top: row.top },
        panel: { width: panelRef.current.offsetWidth, height: panelRef.current.offsetHeight },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }),
    )
  }, [open])

  return (
    <div ref={rowRef} onMouseEnter={enter} onMouseLeave={leave}>
      <MenuItem label={label} leading={leading} selected={selected} submenu />
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            data-interactive
            className={cn('fixed z-50 flex w-[160px] flex-col rounded-lg border border-border-default bg-bg-elevated p-2 shadow-lg', className)}
            style={placed ?? { left: 0, top: 0, visibility: 'hidden' }}
            onMouseEnter={enter}
            onMouseLeave={leave}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
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
  /** A keyboard hint, drawn as the kbd chip. */
  shortcut?: string
  /** The row opens another menu: draws the chevron at the right edge. */
  submenu?: boolean
  destructive?: boolean
  /** The row the menu currently points at (a submenu's chosen value). */
  selected?: boolean
}

export function MenuItem({ label, children, size = 'default', description, leading, trailing, shortcut, submenu, destructive, selected, className, ...props }: MenuItemProps) {
  const edge =
    trailing ??
    (shortcut ? (
      <kbd className="inline-flex shrink-0 items-center justify-center rounded-sm border border-border-strong bg-bg-inset px-1 py-px text-caption text-text-secondary">
        {shortcut}
      </kbd>
    ) : submenu ? (
      <IconChevronRight size={16} stroke={1.5} className="shrink-0 text-text-muted" />
    ) : null)
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full cursor-pointer items-center rounded-lg text-left hover:bg-bg-hover transition-colors',
        // tall: as tall as its content, never shorter than 40px (Katerina,
        // 2026-09-01) — a single-line picker row sits at 40, a row with a
        // 32px face and a role line comes out at its natural 48. One rule,
        // not a hand-picked height per file.
        size === 'tall' ? 'min-h-10 gap-3 px-3 py-1.5' : 'gap-2 px-2 py-1.5',
        selected && 'bg-bg-hover',
        className,
      )}
      {...props}
    >
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
      {edge && <span className="flex shrink-0 items-center">{edge}</span>}
    </button>
  )
}

/**
 * The keyboard hint a picker row shows while highlighted — "↩ Enter",
 * "↩ #topic" — hand-rolled in five files before this (2026-09-01).
 */
export function EnterHint({ label = 'Enter' }: { label?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-text-muted">
      <span className="text-[12px] leading-[120%]">↩</span>
      <span className="text-[9px] font-medium leading-[115%] signal:font-mono signal:text-[9.5px] signal:tracking-[0.04em]">{label}</span>
    </span>
  )
}

/** A section heading inside a menu: the 32px row with a SectionLabel, read
 *  secondary — a heading inside a menu labels the rows, it is not one of
 *  them (Katerina, 2026-09-01). */
export function MenuSection({ label, children, className }: { label: string; children: ReactNode; /** On the heading row — a surface whose rows are px-3 aligns its heading with px-3. */ className?: string }) {
  return (
    <div className="flex flex-col">
      <div className={cn('flex h-8 items-center px-2', className)}>
        <SectionLabel className="text-text-secondary">{label}</SectionLabel>
      </div>
      {children}
    </div>
  )
}

/** A non-interactive row inside a menu, at the item's own geometry. */
export function MenuRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 px-2 py-1.5', className)}>{children}</div>
}
