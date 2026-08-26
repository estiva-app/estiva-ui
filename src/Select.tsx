import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'

/**
 * Peek's Select (2026-08-28), verbatim, plus what Ship added: an option may
 * carry a `leading` node — an avatar beside a person's name — shown in the
 * trigger and in the list.
 *
 * A button that opens a portalled listbox under itself: arrows move, Home
 * and End jump, Enter and Space pick, Escape closes and returns focus to the
 * trigger, Tab closes, a click outside closes, a scroll or resize closes
 * (the list is fixed to where the trigger was). Two sizes; `disabled`
 * explains nothing by itself — wrap it in a tooltip that does.
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

export function Select({ value, onChange, options, size = 'default', ariaLabel, placeholder = 'Select…', disabled, className }: SelectProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
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

  // Outside click and Escape — the two exits every menu has. `mousedown`
  // rather than `click`, so a press that starts outside dismisses at once.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      setRect(null)
    }
    const onMove = () => setRect(null)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
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
          'flex w-full items-center justify-between gap-2 rounded-lg border bg-bg-inset text-left',
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
            style={{ top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
            className="fixed z-50 max-h-72 overflow-y-auto rounded-lg border border-border-default bg-bg-elevated p-1 shadow-lg"
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
