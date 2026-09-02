import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * The 52px top bar, in two manners:
 *
 * - `solid` — in flow: a hairline under it, the surface behind it, the
 *   frame's first row (2026-09-02, verbatim from the structured app; its
 *   product title moved to the caller).
 * - `floating` — an overlay: absolute over the content, no border and no
 *   background, and the bar itself ignores the pointer — only its clusters
 *   catch clicks, so the content underneath stays reachable (2026-09-02,
 *   verbatim from the floating app).
 *
 * Geometry both apps agreed on before extraction: 52px tall, `pl-5
 * pr-[26px]`, right cluster `gap-[6px]`. The left region is two slots
 * side by side — `menu` (the menu button, in an app whose navigation
 * collapses) and `logo` (the mark or name beside it; Katerina,
 * 2026-09-02). This component does not know who you are or what is being
 * searched; it only knows where those go.
 */
export interface TopBarProps {
  variant?: 'solid' | 'floating'
  /** Far left: the menu button, in an app whose navigation collapses. Stays the caller's — the bar only places it. */
  menu?: ReactNode
  /** Beside the menu button: the app's logo mark, or its name as text. */
  logo?: ReactNode
  /** The centre: a search field, or a launcher affordance — or nothing; the slot holds its place. */
  search?: ReactNode
  /** The right cluster — an `IdentityMenu` and its neighbours. */
  right?: ReactNode
  className?: string
}

export function TopBar({ variant = 'solid', menu, logo, search, right, className }: TopBarProps) {
  const floating = variant === 'floating'
  return (
    <header
      className={cn(
        'flex h-[52px] items-center pl-5 pr-[26px]',
        floating
          ? 'pointer-events-none absolute left-0 right-0 top-0 z-10'
          : 'shrink-0 gap-4 border-b border-border-default bg-bg-surface',
        className,
      )}
    >
      {(menu || logo) && (
        <div className={cn('flex shrink-0 items-center gap-2', floating && 'pointer-events-auto')}>
          {menu}
          {logo && <div className="flex items-center text-body-2-strong text-text-primary">{logo}</div>}
        </div>
      )}
      <div className={cn('flex min-w-0 flex-1 items-center justify-center', floating && 'pointer-events-auto')}>{search}</div>
      <div className={cn('flex shrink-0 items-center gap-[6px]', floating && 'pointer-events-auto')}>{right}</div>
    </header>
  )
}
