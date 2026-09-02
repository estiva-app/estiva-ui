import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

/**
 * The four regions of a framed app: header, banner, sidebar, main —
 * a column beside a rail, the sidebar and main scrolling independently,
 * so a long list never scrolls the navigation away (Ship's AppShell,
 * 2026-09-02, verbatim).
 *
 * Layout only. What goes in each region is the caller's; this component
 * has no data and no routes. An app whose frame is an overlay (a
 * floating TopBar over edge-to-edge content) is a different animal and
 * composes its own — see the TopBar page.
 */
export interface AppShellProps {
  /** The top bar's burger, in an app whose navigation collapses. */
  menu?: ReactNode
  /** The top bar's left: the app's name or logo mark. */
  brand?: ReactNode
  /** The top bar's centre — a search field, when there is one. */
  search?: ReactNode
  /** The top bar's right cluster — an `IdentityMenu`. */
  identity?: ReactNode
  /** A `Banner`, or nothing. */
  banner?: ReactNode
  /** A `Sidebar` (or `Rail`) with the app's entries. */
  sidebar: ReactNode
  children: ReactNode
}

export function AppShell({ menu, brand, search, identity, banner, sidebar, children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg-base text-text-primary">
      <TopBar menu={menu} brand={brand} search={search} right={identity} />
      {banner}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
