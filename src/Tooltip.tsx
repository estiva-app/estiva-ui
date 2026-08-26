import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'

/**
 * Peek's Tooltip and WithTooltip (2026-08-28), verbatim, in one file.
 *
 * `Tooltip` is the surface: a 30px elevated pill with a caption. `WithTooltip`
 * wraps a trigger and portals the surface above or below it on hover, fixed
 * to the viewport and kept 8px inside it. The wrapper is `inline-flex` and
 * shrinks nothing — wrap a control, never a block (a form inside it
 * collapses to its content width; Ship learnt that).
 */
export interface TooltipProps {
  label: string
  className?: string
}

export function Tooltip({ label, className }: TooltipProps) {
  return (
    <div role="tooltip" className={cn('bg-bg-elevated border border-border-default rounded-lg h-[30px] flex items-center justify-center px-2 shadow-lg', className)}>
      <span className="text-caption text-text-primary whitespace-nowrap">{label}</span>
    </div>
  )
}

export interface WithTooltipProps {
  label: string
  placement?: 'top' | 'bottom'
  children: ReactNode
}

const GAP = 6
const VIEWPORT_PAD = 8

export function WithTooltip({ label, placement = 'top', children }: WithTooltipProps) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', zIndex: 9999, pointerEvents: 'none', visibility: 'hidden' })

  const reposition = useCallback(() => {
    const trigger = ref.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return
    const triggerRect = trigger.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    const top = placement === 'bottom' ? triggerRect.bottom + GAP : triggerRect.top - tipRect.height - GAP
    let left = triggerRect.left + triggerRect.width / 2 - tipRect.width / 2
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - tipRect.width - VIEWPORT_PAD))
    setStyle({ position: 'fixed', top, left, zIndex: 9999, pointerEvents: 'none', visibility: 'visible' })
  }, [placement])

  useLayoutEffect(() => {
    if (show) reposition()
  }, [show, reposition])

  return (
    <div ref={ref} className="inline-flex shrink-0" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show &&
        createPortal(
          <div ref={tooltipRef} style={style}>
            <Tooltip label={label} />
          </div>,
          document.body,
        )}
    </div>
  )
}
