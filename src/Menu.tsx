import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
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
 * Two anchorings: `position` portals it to the body at fixed viewport
 * coordinates (for menus opened inside scrolling containers that clip);
 * without it the menu hangs below its trigger, right-aligned, and the
 * caller's wrapper is `relative`.
 */
export interface MenuProps {
  onClose: () => void
  /** Viewport coordinates; the menu is portalled and right-aligned to them. */
  position?: { top: number; right: number }
  children: ReactNode
  className?: string
}

export function Menu({ onClose, position, children, className }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)

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

  const style: CSSProperties | undefined = position ? { top: position.top, right: position.right } : undefined
  const node = (
    <div
      ref={ref}
      role="menu"
      data-interactive
      className={cn(
        'z-50 flex min-w-[180px] flex-col rounded-lg border border-border-default bg-bg-elevated p-2 shadow-lg',
        position ? 'fixed' : 'absolute right-0 top-full mt-1',
        className,
      )}
      style={style}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  )
  return position ? createPortal(node, document.body) : node
}

export interface MenuItemProps {
  label: string
  onClick?: () => void
  /** A second line under the label — a role, an address — 12px, secondary, truncating. */
  description?: string
  /** Before the label: a 16px icon (stroke 1.5, secondary), or an Avatar — Peek's mention rows lead with a face. */
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

export function MenuItem({ label, onClick, description, leading, trailing, shortcut, submenu, destructive, selected }: MenuItemProps) {
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
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-bg-hover',
        selected && 'bg-bg-hover',
      )}
    >
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      {/* Sizes are arbitrary values (the body-2 and caption tokens): these
          lists merge with a colour, and tw-merge drops a token size beside a
          colour. Ship's copy said `text-sm`, which was never the ramp. */}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-[14px] leading-[140%]', destructive ? 'text-error-default' : 'text-text-primary')}>
          {label}
        </span>
        {description && <span className="truncate text-[12px] leading-[120%] text-text-secondary">{description}</span>}
      </span>
      {edge && <span className="flex shrink-0 items-center">{edge}</span>}
    </button>
  )
}

/** A section heading inside a menu: the 32px row with a SectionLabel. */
export function MenuSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex h-8 items-center px-2">
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </div>
  )
}

/** A non-interactive row inside a menu, at the item's own geometry. */
export function MenuRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-2 px-2 py-1.5', className)}>{children}</div>
}
