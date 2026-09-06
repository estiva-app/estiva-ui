import type { ReactNode } from 'react'
import { cn } from './cn'
import { TopBar } from './TopBar'

/**
 * The frame of an app, in the two manners that pair with the TopBar's
 * (Katerina, 2026-09-02: the two shells go together — the solid bar with
 * the sidebar, the floating bar with the rail):
 *
 * - `solid` — the structured frame: a solid TopBar, the navigation
 *   column, the content beside it, sidebar and main scrolling
 *   independently (2026-09-02, verbatim from the structured app).
 * - `floating` — the floating frame: the TopBar floats over the top
 *   edge, the rail stands on the app background, and the content lives
 *   in the rounded card beside it (2026-09-02, the floating app's frame
 *   geometry; its collapse animation and launcher stay in the app).
 *
 * The banner belongs to the content area (her ruling, 2026-09-02): it
 * renders at the top of the main column — inside the card, in the
 * floating manner — never across the navigation.
 *
 * Layout only. What goes in each region is the caller's; this component
 * has no data and no routes.
 */
export interface AppShellProps {
  variant?: 'solid' | 'floating'
  /** The top bar's menu button, in an app whose navigation collapses. */
  menu?: ReactNode
  /** The top bar's left: the app's logo mark, or its name as text. */
  logo?: ReactNode
  /** The top bar's centre — a search field, when there is one. */
  search?: ReactNode
  /** The top bar's right cluster — an `IdentityMenu`. */
  identity?: ReactNode
  /** A `Banner`, or nothing — drawn at the top of the content area. */
  banner?: ReactNode
  /** The navigation: a `Sidebar` in the solid manner, a `Rail` in the floating one. */
  nav: ReactNode
  children: ReactNode
}

export function AppShell({ variant = 'solid', menu, logo, search, identity, banner, nav, children }: AppShellProps) {
  const bar = <TopBar variant={variant} menu={menu} logo={logo} search={search} right={identity} />

  if (variant === 'floating') {
    return (
      <div className="relative h-full min-h-0 overflow-hidden bg-bg-base">
        {bar}
        <div className="flex h-full pb-4 pr-4 pt-[52px]">
          {nav}
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-bg-surface',
              'signal:border signal:border-border-subtle signal:shadow-highlight-inset',
            )}
          >
            {banner}
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    )
  }

  return (
    /* `relative overflow-hidden` is the seal the floating manner already has,
       and it takes both halves: an absolutely positioned descendant with no
       positioned ancestor belongs to the *viewport*, so a scroll container
       never clips it and the document itself gains its position as scroll
       range — the whole page scrolls, navigation and top bar included.
       `relative` claims such strays for the shell; `overflow-hidden` clips
       them at its edge. Either alone seals nothing. */
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-bg-base text-text-primary">
      {bar}
      <div className="flex min-h-0 flex-1">
        {nav}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {banner}
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
