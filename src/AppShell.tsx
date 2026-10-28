import type { ReactNode } from 'react'
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react'
import { cn } from './cn'
import { Card } from './Card'
import { IconButton } from './IconButton'
import { ScrollArea } from './ScrollArea'
import { SidebarOnGround } from './Sidebar'
import { TopBar } from './TopBar'

/**
 * The frame of an app, in the manners that pair with the TopBar's
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
 * - `inset` — the structured frame, the other way round: the TopBar and
 *   the Sidebar stand on the ground, and the content is a lighter card
 *   beside them (Katerina, 28 September: Linear's layout, in any theme).
 *
 * The banner belongs to the content area (her ruling, 2026-09-02): it
 * renders at the top of the main column — inside the card, in the
 * floating manner — never across the navigation.
 *
 * Layout only. What goes in each region is the caller's; this component
 * has no data and no routes.
 */
export interface AppShellProps {
  variant?: 'solid' | 'floating' | 'inset'
  /** The top bar's menu button, in an app whose navigation collapses. */
  menu?: ReactNode
  /** The top bar's left: the app's logo mark, or its name as text. */
  logo?: ReactNode
  /** The top bar's centre: something of the caller's own. */
  search?: ReactNode
  /** What searching opens: the top bar then draws its search field and answers Ctrl+K (`TopBar`'s `onSearch`). */
  onSearch?: () => void
  /** The words in the top bar's search field. */
  searchPlaceholder?: string
  /** The top bar's right cluster — an `IdentityMenu`. */
  identity?: ReactNode
  /** A `Banner`, or nothing — drawn at the top of the content area. */
  banner?: ReactNode
  /** The navigation: a `Sidebar` in the solid manner, a `Rail` in the floating one. */
  nav: ReactNode
  /**
   * Whether the navigation is shown, in the solid and inset manners. With `onNavOpenChange`, the frame draws the
   * fold as the top bar's menu button (unless `menu` is given) and, folded, leaves only the content's own margin
   * (LED-3, Katerina, 28 October: the sidebar fold top left, on the top bar's menu button). Where it is kept is
   * the caller's.
   */
  navOpen?: boolean
  onNavOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function AppShell({ variant = 'solid', menu, logo, search, onSearch, searchPlaceholder, identity, banner, nav, navOpen = true, onNavOpenChange, children }: AppShellProps) {
  const fold = onNavOpenChange && (
    <IconButton
      tooltip={navOpen ? 'Hide the sidebar' : 'Show the sidebar'}
      tooltipPlacement="bottom"
      aria-label={navOpen ? 'Hide the sidebar' : 'Show the sidebar'}
      aria-expanded={navOpen}
      onClick={() => onNavOpenChange(!navOpen)}
    >
      {navOpen ? <IconLayoutSidebarLeftCollapse size={16} stroke={1.5} /> : <IconLayoutSidebarLeftExpand size={16} stroke={1.5} />}
    </IconButton>
  )
  const bar = <TopBar variant={variant} menu={menu ?? fold} logo={logo} search={search} onSearch={onSearch} searchPlaceholder={searchPlaceholder} right={identity} />
  const inset = variant === 'inset'

  if (variant === 'floating') {
    return (
      // `signal-canvas`: in the Signal theme, the preset draws the control-room dot
      // grid behind everything in the frame (Peek's, moved here with the frame:
      // UIG-14, Katerina, 19 September — the canvas is the theme's, not an app's).
      <div className="signal-canvas relative h-full min-h-0 overflow-hidden bg-bg-base">
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

  const column = (
    <>
      {banner}
      {/* The frame owns the page's scrollbar (Katerina, 2026-09-09: the
          Issues page still had a native bar — D40 said everywhere, and the
          one place every page passes through had been left out). A
          `ScrollArea` here means no page can forget it. The content box is
          at least the viewport's height and grows with a tall page, so Base
          UI sees its size change (the morning's phantom bar was a content
          box it could not watch); `main` fills it as a flex column. The
          page contract (the AppShell page says it): a page is a flex
          child of `main` — `flex-1` to fill and scroll here; `flex-1
          min-h-0 [contain:size]` to take exactly the frame's height and
          scroll inside itself, as Ship's detail grids do — and the outer
          region, with nothing to scroll, passes the wheel through. Never
          `h-full`: a box that is *at least* the viewport's height gives a
          percentage nothing to resolve against — measured, all four Ship
          pages, 2026-09-09. */}
      <ScrollArea className="min-h-0 flex-1" contentClassName="flex min-h-full flex-col">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </ScrollArea>
    </>
  )

  return (
    /* `relative overflow-hidden` is the seal the floating manner already has
       (and the ScrollArea's own root is `relative`, so an absolutely placed
       stray inside a page now belongs to the region and scrolls with it),
       and it takes both halves: an absolutely positioned descendant with no
       positioned ancestor belongs to the *viewport*, so a scroll container
       never clips it and the document itself gains its position as scroll
       range — the whole page scrolls, navigation and top bar included.
       `relative` claims such strays for the shell; `overflow-hidden` clips
       them at its edge. Either alone seals nothing. */
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-bg-base text-text-primary">
      {bar}
      <div className="flex min-h-0 flex-1">
        {navOpen ? (
          <SidebarOnGround.Provider value={inset}>{nav}</SidebarOnGround.Provider>
        ) : (
          // Folded: the inset card keeps a left margin as wide as its right one.
          inset && <div className="w-4 flex-none" />
        )}
        {/* `inset`: the content is a card on the ground, the Card's own surface look,
            16px from the right and bottom as the floating card is, 8px corners (Katerina,
            28 September). */}
        {inset ? (
          <Card fill="surface" clip className="mb-4 mr-4 flex min-h-0 min-w-0 flex-1 flex-col">
            {column}
          </Card>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{column}</div>
        )}
      </div>
    </div>
  )
}
