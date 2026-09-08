import type { ReactNode } from 'react'
import { cn } from './cn'
import { ScrollArea } from './ScrollArea'

/**
 * The navigation column: 240px, a hairline on its right, the surface
 * behind it, scrolling independently of the content beside it (the shell
 * of Ship's Sidebar, 2026-09-02 — its contents stayed in the app).
 *
 * What goes inside is the caller's: NavItem rows, a SectionLabel heading
 * in a 32px row over a group. Desktop only — there is no narrow-screen
 * drawer.
 */
export interface SidebarProps {
  /** Names the navigation region for assistive tech. */
  'aria-label'?: string
  children: ReactNode
  className?: string
}

export function Sidebar({ 'aria-label': ariaLabel = 'Workspace', children, className }: SidebarProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn('flex w-60 shrink-0 flex-col border-r border-border-default bg-bg-surface', className)}
    >
      {/* The rows scroll in a ScrollArea: the bar takes no width, so the
          column's padding reads the same with a long list as with a short
          one (Katerina, 2026-09-08). The padding and the gap are the box's. */}
      <ScrollArea className="min-h-0 flex-1" viewportClassName="flex flex-col gap-px px-2.5 py-3">
        {children}
      </ScrollArea>
    </nav>
  )
}
