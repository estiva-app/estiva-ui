import type { ReactNode } from 'react'
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
 * it appears; the bar shows while the pointer is over the region or the
 * content is moving, and fades otherwise.
 *
 * The bar is `border-strong` on nothing, 6px wide, inset 2px from the edge —
 * the thin scrollbar both apps had styled by hand in their `index.css`, drawn
 * once here instead.
 *
 * `orientation` says which way the region scrolls; a table that is wider
 * than its box scrolls `horizontal`, a list `vertical` (the default), a board
 * `both`.
 */
export interface ScrollAreaProps {
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** On the region itself: its size and placement. */
  className?: string
  /** On the scrolling viewport: padding, gap, layout of the content. */
  viewportClassName?: string
  children: ReactNode
}

const BAR = 'flex touch-none select-none rounded-full opacity-0 transition-opacity delay-300 data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[scrolling]:opacity-100 data-[scrolling]:delay-0'
const THUMB = 'rounded-full bg-border-strong'

export function ScrollArea({ orientation = 'vertical', className, viewportClassName, children }: ScrollAreaProps) {
  const vertical = orientation !== 'horizontal'
  const horizontal = orientation !== 'vertical'
  return (
    <BaseScrollArea.Root className={cn('relative min-h-0 min-w-0', className)}>
      {/* `overscroll-contain`: a list that reaches its end does not hand the
          wheel to the page behind it, which is the rule every popup here has
          kept since Peek. */}
      <BaseScrollArea.Viewport className={cn('h-full w-full overscroll-contain outline-none', viewportClassName)}>
        {children}
      </BaseScrollArea.Viewport>
      {vertical && (
        <BaseScrollArea.Scrollbar orientation="vertical" className={cn(BAR, 'w-1.5 justify-center py-0.5 pr-0.5')}>
          <BaseScrollArea.Thumb className={cn(THUMB, 'w-full')} />
        </BaseScrollArea.Scrollbar>
      )}
      {horizontal && (
        <BaseScrollArea.Scrollbar orientation="horizontal" className={cn(BAR, 'h-1.5 flex-col justify-center px-0.5 pb-0.5')}>
          <BaseScrollArea.Thumb className={cn(THUMB, 'h-full')} />
        </BaseScrollArea.Scrollbar>
      )}
      {vertical && horizontal && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  )
}
