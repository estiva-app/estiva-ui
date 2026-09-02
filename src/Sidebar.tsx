import type { ReactNode } from 'react'
import { cn } from './cn'

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
      className={cn(
        'flex w-60 shrink-0 flex-col gap-px overflow-y-auto border-r border-border-default bg-bg-surface px-2.5 py-3',
        className,
      )}
    >
      {children}
    </nav>
  )
}
