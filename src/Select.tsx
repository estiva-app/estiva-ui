import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'

/**
 * Peek's Select (2026-08-28), verbatim, plus what Ship added: an option may
 * carry a `leading` node — an avatar beside a person's name — shown in the
 * trigger and in the list.
 *
 * A button that opens a portalled listbox under itself: arrows move (and keep
 * the active option scrolled into view), Home and End jump, Enter and Space
 * pick, Escape closes and returns focus to the trigger, Tab closes, a click
 * outside closes, a PAGE scroll or resize closes (the list is fixed to where
 * the trigger was) — a scroll *inside* the list is the list's own business
 * and must not dismiss it. The menu keeps itself on screen: clamped to the
 * viewport's sides, height capped to the space it actually has, opening
 * upward when the room below is worse than the room above (Katerina,
 * 2026-09-01 — the files-panel picker was cut right and bottom, and its own
 * scroll closed it). Two sizes; `disabled` explains nothing by itself — wrap
 * it in a tooltip that does.
 */
export interface SelectOption {
  value: string
  label: string
  /** Drawn before the label, 16px — an Avatar, an icon. */
  leading?: ReactNode
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  size?: 'default' | 'small'
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Where a menu of this size goes, given its anchor and the viewport — pure,
 * so the geometry is testable without a browser.
 *
 * Left is clamped inside the viewport with an 8px margin. Height is capped
 * at 288px (the old `max-h-72`) but never taller than the space it opens
 * into; when the room below the anchor is smaller than both the content and
 * the room above, the menu opens UPWARD (anchored to the trigger's top via
 * `bottom`). The 120px floor keeps a menu usable even in a cramped corner —
 * scrollable beats invisible.
 */
export function fitMenu({
  anchor,
  menu,
  viewport,
}: {
  anchor: { left: number; top: number; bottom: number }
  menu: { width: number; contentHeight: number }
  viewport: { width: number; height: number }
}): { left: number; top?: number; bottom?: number; maxHeight: number } {
  const MARGIN = 8
  const GAP = 4
  const CAP = 288
  const left = Math.max(MARGIN, Math.min(anchor.left, viewport.width - menu.width - MARGIN))
  const below = viewport.height - anchor.bottom - GAP - MARGIN
  const above = anchor.top - GAP - MARGIN
  const openUp = below < Math.min(menu.contentHeight, CAP) && above > below
  const maxHeight = Math.max(Math.min(CAP, openUp ? above : below), 120)
  return openUp
    ? { left, bottom: viewport.height - anchor.top + GAP, maxHeight }
    : { left, top: anchor.bottom + GAP, maxHeight }
}

export function Select({ value, onChange, options, size = 'default', ariaLabel, placeholder = 'Select…', disabled, className }: SelectProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  /** Where the menu actually goes — measured against the viewport after the
   *  provisional render, so it is never cut off by an edge. */
  const [placement, setPlacement] = useState<{
    left: number
    top?: number
    bottom?: number
    maxHeight: number
  } | null>(null)
  const open = rect !== null

  const selectedIndex = useMemo(() => Math.max(0, options.findIndex((o) => o.value === value)), [options, value])
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  const close = useCallback((refocus: boolean) => {
    setRect(null)
    if (refocus) triggerRef.current?.focus()
  }, [])

  const openMenu = useCallback(() => {
    setActiveIndex(selectedIndex)
    setRect(triggerRef.current?.getBoundingClientRect() ?? null)
  }, [selectedIndex])

  /*
   * Fit the menu to the viewport, before paint.
   *
   * The provisional render sits at the trigger's corner and is invisible;
   * this measures it and decides the real box: left clamped inside the
   * viewport, height capped to the space available, and the whole thing
   * opening UPWARD when the room below is smaller than both the content and
   * the room above. A menu that is always fully on screen is also the only
   * kind whose scrollbar can actually be used.
   */
  useLayoutEffect(() => {
    if (!rect || !menuRef.current) {
      setPlacement(null)
      return
    }
    setPlacement(
      fitMenu({
        anchor: { left: rect.left, top: rect.top, bottom: rect.bottom },
        menu: { width: menuRef.current.offsetWidth, contentHeight: menuRef.current.scrollHeight },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }),
    )
  }, [rect, options.length])

  // Keyboard follows the highlight: without this, arrowing past the fold
  // moved `activeIndex` into rows the capped menu never showed.
  useEffect(() => {
    if (!open) return
    // Optional call: jsdom implements neither scrolling nor this method, and
    // a consumer's component tests should not crash for a scroll nicety.
    document.getElementById(`${id}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex, id])

  // Outside click and Escape — the two exits every menu has. `mousedown`
  // rather than `click`, so a press that starts outside dismisses at once.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      setRect(null)
    }
    const onResize = () => setRect(null)
    /*
     * A PAGE scroll moves the anchor out from under the fixed menu, so it
     * closes. A scroll INSIDE the menu is the menu working as designed —
     * capture phase sees those too, and closing on them made the list
     * impossible to scroll at all (the bug this comment survives to prevent).
     */
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return
      setRect(null)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const pick = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    close(true)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        pick(activeIndex)
        break
      case 'Tab':
        close(false)
        break
    }
  }

  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          /*
           * `min-w-0 max-w-full`: a trigger must never outgrow its container
           * (Katerina, 2026-09-01 — a long label stretched the files panel's
           * Lead row past its card). In a flex row the default min-width:auto
           * forbids shrinking below the label's width, which is what kept
           * `truncate` from ever engaging; in a block container max-w-full is
           * the cap. Full-width callers are unaffected.
           */
          'flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border bg-bg-inset text-left',
          'border-border-default text-text-primary outline-none transition-colors',
          'hover:border-border-strong disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled',
          'focus-visible:border-border-focus aria-expanded:border-border-focus',
          'signal:transition-shadow signal:focus-visible:shadow-focus-ring',
          size === 'default' && 'px-3 py-2 text-[14px] leading-[1.4] font-normal',
          size === 'small' && 'h-6 px-2 text-[12px] leading-[1.4] font-normal',
          className,
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-text-muted')}>
          {selected?.leading && <span className="flex shrink-0 items-center">{selected.leading}</span>}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <IconChevronDown size={size === 'small' ? 14 : 16} stroke={1.5} className="shrink-0 text-text-secondary" />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-activedescendant={`${id}-${activeIndex}`}
            tabIndex={-1}
            style={
              placement
                ? { ...placement, minWidth: rect.width }
                : // Provisional frame: measured by the layout effect above,
                  // replaced before paint. Hidden so a cut-off position is
                  // never visible, not even for a frame.
                  { top: rect.bottom + 4, left: rect.left, minWidth: rect.width, visibility: 'hidden' }
            }
            className="fixed z-50 overflow-y-auto rounded-lg border border-border-default bg-bg-elevated p-1 shadow-lg"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  // The document-level dismiss also listens on mousedown.
                  e.preventDefault()
                  pick(index)
                }}
                className={cn(
                  'flex h-9 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 transition-colors',
                  'text-[14px] font-normal leading-[1.4] text-text-primary',
                  index === activeIndex && 'bg-bg-hover',
                  option.value === value && 'font-medium',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {option.leading && <span className="flex shrink-0 items-center">{option.leading}</span>}
                  <span className="truncate">{option.label}</span>
                </span>
                {option.value === value && <IconCheck size={16} stroke={1.5} className="shrink-0 text-text-secondary" />}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
