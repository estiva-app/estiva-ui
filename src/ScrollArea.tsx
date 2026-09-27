import type { ReactNode, Ref, UIEventHandler } from 'react'
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import { cn } from './cn'

/**
 * A region that scrolls without taking width for its scrollbar.
 *
 * A native scrollbar is part of the layout: the moment content overflows, the
 * bar takes its width from the content, the text column narrows, and the
 * right-hand padding looks wider than the left. Katerina saw it in every
 * scrolling surface of both apps (2026-09-08). Base UI's `ScrollArea` hides
 * the native bar and draws its own over the content, so nothing moves when
 * it appears.
 *
 * The bar shows whenever the region has more to scroll to, at rest too
 * (Katerina, 26 September: a long folder list in Peek's side column looked
 * complete, because the bar waited for the pointer). Base UI writes
 * `data-has-overflow-y` / `-x` on the bar while that axis overflows; a region
 * with nothing more to show keeps no bar at all.
 *
 * Three boxes, and each class prop lands on one:
 *
 * - the **region** (`className`): its size and placement — `h-[240px]`, a
 *   grid cell, `flex-1 min-h-0`;
 * - the **viewport** (`viewportClassName`): the box that scrolls — a
 *   `max-h-*` cap goes here, and nowhere else, because a cap on the region
 *   lets the viewport grow to its content and nothing scrolls (measured,
 *   2026-09-08);
 * - the **content** (`contentClassName`): the box the children sit in — the
 *   padding, the gap, `flex flex-col`. Base UI watches this box for size
 *   changes; without it the bar kept showing on Ship's page for overflow that
 *   was no longer there (measured, 2026-09-09).
 *
 * The bar is `border-strong` on nothing, 6px wide, inset 2px from the edge —
 * the thin scrollbar both apps had styled by hand in their `index.css`, drawn
 * once here instead.
 *
 * The bar sits above the content (`z-10`). A sticky row inside — a date line
 * in a conversation, `sticky top-0 z-10` — is at the same level, and the bar
 * comes after the content in the page, so it paints on top. Without it the
 * row hid the bar wherever it crossed it: a gap in the thumb, in Peek's topic
 * and direct-message lists (UIG-8, 16 September).
 *
 * `orientation` says which way the region scrolls; a table that is wider
 * than its box scrolls `horizontal`, a list `vertical` (the default), a board
 * `both`. A vertical region keeps its content no wider than itself, so a
 * long label still truncates.
 */
export interface ScrollAreaProps {
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** On the region: its size and placement. */
  className?: string
  /** On the viewport, the box that scrolls: a `max-h-*` cap. */
  viewportClassName?: string
  /** On the content, the box the children sit in: padding, gap, layout. */
  contentClassName?: string
  /**
   * The scrolling box itself, for a region that reads or drives its own
   * scrolling: `ref.current.scrollTop`, `scrollTo`, `scrollHeight`.
   *
   * A conversation is the case this exists for (ADOPTION B20): it arrives at
   * the newest message, keeps its place when older ones load above, and jumps
   * to the bottom when a reply is sent — none of which the region can do for
   * the caller, and all of which the caller cannot do without the box.
   */
  viewportRef?: Ref<HTMLDivElement>
  /** Fires as the viewport scrolls — the unread policy's input, beside `viewportRef`. */
  onScroll?: UIEventHandler<HTMLDivElement>
  children: ReactNode
}

const BAR = 'z-10 flex touch-none select-none rounded-full opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0'
const THUMB = 'rounded-full bg-border-strong'

export function ScrollArea({ orientation = 'vertical', className, viewportClassName, contentClassName, viewportRef, onScroll, children }: ScrollAreaProps) {
  const vertical = orientation !== 'horizontal'
  const horizontal = orientation !== 'vertical'
  return (
    <BaseScrollArea.Root className={cn('relative min-h-0 min-w-0', className)}>
      {/* `overscroll-contain`, per axis and only while that axis has more to
          show: a list that reaches its end does not hand the wheel to the page
          behind it — the rule every popup here has kept since Peek — but a
          region with nothing to scroll one way passes that way's wheel through.
          Base UI's viewport is `overflow: scroll` on both axes whatever
          `orientation` says, so a sideways table is also a vertical scroll box
          with no room in it, and an unconditional `contain` stopped the page
          under every table and board (Katerina, 2026-09-09: 0px of page scroll
          with the pointer over Ship's table, 446px without the line; PLAN
          Finding 40). `data-has-overflow-x` / `-y` are Base UI's word for
          "this axis really overflows", written on the viewport as it changes. */}
      <BaseScrollArea.Viewport
        ref={viewportRef}
        onScroll={onScroll}
        className={cn(
          'h-full w-full outline-none data-[has-overflow-x]:overscroll-x-contain data-[has-overflow-y]:overscroll-y-contain',
          viewportClassName,
        )}
      >
        {/* Base UI gives the content box `min-width: fit-content`, which is
            right when the region scrolls sideways and wrong when it does not:
            a row's `truncate` needs a box no wider than the viewport. */}
        <BaseScrollArea.Content className={contentClassName} style={horizontal ? undefined : { minWidth: 0 }}>
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {vertical && (
        <BaseScrollArea.Scrollbar orientation="vertical" className={cn(BAR, 'w-1.5 justify-center py-0.5 pr-0.5 data-[has-overflow-y]:opacity-100')}>
          <BaseScrollArea.Thumb className={cn(THUMB, 'w-full')} />
        </BaseScrollArea.Scrollbar>
      )}
      {horizontal && (
        <BaseScrollArea.Scrollbar orientation="horizontal" className={cn(BAR, 'h-1.5 flex-col justify-center px-0.5 pb-0.5 data-[has-overflow-x]:opacity-100')}>
          <BaseScrollArea.Thumb className={cn(THUMB, 'h-full')} />
        </BaseScrollArea.Scrollbar>
      )}
      {vertical && horizontal && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  )
}
