import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconAlertCircle, IconCircleCheck, IconCircleX } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * Peek's Toast (Figma: Alert) and its provider (2026-09-01), verbatim.
 *
 * The pill: five types — `success`, `brand`, `neutral`, `warning`, `error` —
 * a leading icon that says which (a check, a `!`, an `×`), an optional action
 * on the right. Under Signal every toast is
 * the same dark overlay pill; the type lives in the icon's colour and glow,
 * not the surface.
 *
 * The provider owns positioning (bottom-left), the portal, and auto-dismiss
 * (5 s; pass `durationMs: 0` to keep one up). One toast at a time — a new
 * one replaces the standing one, it does not queue.
 */
export type ToastType = 'success' | 'brand' | 'neutral' | 'warning' | 'error'

export interface ToastProps {
  label: string
  /**
   * Which of the five this is. It decides the surface in the light themes,
   * and under Signal — where every pill is the same dark overlay — the icon
   * and its colour.
   *
   * `warning` and `error` arrived at 0.12.2, for a notice that has to stay up
   * and for one that reports a failure. Until then the set had no way to say
   * either, so a caller with bad news passed `leadingIcon: false` rather than
   * put a tick beside it.
   */
  type?: ToastType
  /** Show the leading icon — a check, a `!` or an `×`, per `type`. Defaults to true. */
  leadingIcon?: boolean
  /** When set together with onAction, renders a clickable action on the right side. */
  actionLabel?: string
  onAction?: () => void
  className?: string
}

// Signal: every toast is the same dark overlay pill (v3) — the type lives in
// the icon color + glow, not the surface.
const SURFACE_STYLES: Record<ToastType, string> = {
  success: 'bg-success-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-[shadow:var(--shadow-md)]',
  brand: 'bg-accent-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-[shadow:var(--shadow-md)]',
  neutral: 'bg-bg-inset border border-border-subtle signal:border-border-default signal:shadow-[shadow:var(--shadow-md)]',
  warning: 'bg-warning-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-[shadow:var(--shadow-md)]',
  error: 'bg-error-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-[shadow:var(--shadow-md)]',
}

/**
 * The leading icon says which of the five this is (Katerina, 2026-09-10:
 * *"the icons should be representative, x for error, ! for warning"*). It was
 * a circle-check on all of them, so a warning and a failure both arrived with
 * a tick beside them — the reason Peek passed `leadingIcon: false` rather than
 * show one.
 */
const ICONS: Record<ToastType, typeof IconCircleCheck> = {
  success: IconCircleCheck,
  brand: IconCircleCheck,
  neutral: IconCircleCheck,
  warning: IconAlertCircle,
  error: IconCircleX,
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'signal:text-success-default signal:drop-shadow-glow-success',
  brand: 'signal:text-text-interactive signal:drop-shadow-glow-accent',
  neutral: 'signal:text-text-secondary',
  warning: 'signal:text-warning-default signal:drop-shadow-glow-warning',
  // No glow: the theme defines `--glow-warning`, `--glow-success` and
  // `--glow-accent` and no error glow, and a colour with no token is not
  // approximated here (D16).
  error: 'signal:text-error-default',
}

const ACTION_BORDER_STYLES: Record<ToastType, string> = {
  success: 'signal:border signal:border-border-default signal:hover:border-border-strong',
  brand: 'signal:border signal:border-border-default signal:hover:border-border-strong',
  neutral: 'border border-border-default',
  warning: 'signal:border signal:border-border-default signal:hover:border-border-strong',
  error: 'signal:border signal:border-border-default signal:hover:border-border-strong',
}

export function Toast({ label, type = 'neutral', leadingIcon = true, actionLabel, onAction, className }: ToastProps) {
  const hasAction = !!(actionLabel && onAction)
  const LeadingIcon = ICONS[type]
  return (
    <div
      className={cn(
        'inline-flex items-center min-h-[32px] pl-2 py-1 rounded-lg shadow-lg',
        // Without an action the label needs real right padding; the action
        // button brings its own edge, so the tight pr-1 only applies there.
        hasAction ? 'pr-1 gap-[46px]' : 'pr-3',
        SURFACE_STYLES[type],
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        {leadingIcon && <LeadingIcon size={16} stroke={1.5} className={cn('text-text-primary shrink-0', ICON_STYLES[type])} />}
        <span className="font-normal text-[14px] leading-[1.4] text-text-primary whitespace-nowrap">{label}</span>
      </div>
      {hasAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'h-6 flex items-center justify-center gap-1 px-1 py-1 rounded-md shrink-0 transition-colors',
            ACTION_BORDER_STYLES[type],
            type === 'neutral' ? 'hover:border-border-strong' : 'hover:opacity-80',
          )}
        >
          <span className="font-medium text-[12px] leading-[12px] text-text-primary whitespace-nowrap">{actionLabel}</span>
        </button>
      )}
    </div>
  )
}

export interface ToastOptions {
  label: string
  /** Which of the five this is — it decides the surface and the leading icon. Defaults to 'neutral'. */
  type?: ToastType
  /** When set, renders a clickable action on the right side. */
  actionLabel?: string
  onAction?: () => void
  /** Show the leading icon — a check, a `!` or an `×`, per `type`. Defaults to true. */
  leadingIcon?: boolean
  /** Auto-dismiss after this many ms. Defaults to 5000. Pass 0 to disable. */
  durationMs?: number
}

interface ActiveToast extends ToastOptions {
  id: number
}

interface ToastValue {
  showToast: (opts: ToastOptions) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastValue | null>(null)

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)

  const showToast = useCallback((opts: ToastOptions) => {
    setToast({ ...opts, id: ++toastSeq })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    if (!toast) return
    const duration = toast.durationMs ?? 5000
    if (duration <= 0) return
    const timer = setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, duration)
    return () => clearTimeout(timer)
  }, [toast])

  const value = useMemo<ToastValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast &&
        createPortal(
          <div className="fixed bottom-4 left-4 z-[100] pointer-events-none">
            <Toast
              className="pointer-events-auto"
              label={toast.label}
              type={toast.type ?? 'neutral'}
              leadingIcon={toast.leadingIcon ?? true}
              actionLabel={toast.actionLabel}
              onAction={
                toast.onAction
                  ? () => {
                      toast.onAction?.()
                      dismissToast()
                    }
                  : undefined
              }
            />
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
