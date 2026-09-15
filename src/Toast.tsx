import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Toast as BaseToast } from '@base-ui/react/toast'
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
 * The provider sits on Base UI's `Toast` since stage 6 of the migration
 * (2026-09-14). Base UI owns the portal, the timers, the stack and what a
 * screen reader hears; this file owns how a toast looks and where the stack
 * stands (bottom-left). **Up to three show at once** (D7): the newest nearest
 * the corner, a fourth hides the oldest until one of the three closes. Before
 * stage 6 a new toast replaced the standing one, and nothing announced either.
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
  success: 'bg-success-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-md',
  brand: 'bg-accent-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-md',
  neutral: 'bg-bg-inset border border-border-subtle signal:border-border-default signal:shadow-md',
  warning: 'bg-warning-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-md',
  error: 'bg-error-muted signal:bg-bg-inset signal:border signal:border-border-default signal:shadow-md',
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

const LABEL_CLASSES = 'text-body-2 text-text-primary whitespace-nowrap'

const pillClassName = (type: ToastType, hasAction: boolean, className?: string) =>
  cn(
    'inline-flex items-center min-h-[32px] pl-2 py-1 rounded-lg shadow-lg',
    // Without an action the label needs real right padding; the action
    // button brings its own edge, so the tight pr-1 only applies there.
    hasAction ? 'pr-1 gap-[46px]' : 'pr-3',
    SURFACE_STYLES[type],
    className,
  )

const actionClassName = (type: ToastType) =>
  cn(
    'h-6 flex items-center justify-center gap-1 px-1 py-1 rounded-md shrink-0 transition-colors',
    ACTION_BORDER_STYLES[type],
    type === 'neutral' ? 'hover:border-border-strong' : 'hover:opacity-80',
  )

function LeadingIcon({ type }: { type: ToastType }) {
  const Icon = ICONS[type]
  return <Icon size={16} stroke={1.5} className={cn('text-text-primary shrink-0', ICON_STYLES[type])} />
}

const ACTION_LABEL_CLASSES = 'text-btn-small text-text-primary whitespace-nowrap'

/**
 * One toast, drawn in place. What the provider shows is this pill; draw it
 * yourself only where a page needs a toast's look without its timing — a
 * story, a picture of the set.
 */
export function Toast({ label, type = 'neutral', leadingIcon = true, actionLabel, onAction, className }: ToastProps) {
  const hasAction = !!(actionLabel && onAction)
  return (
    <div className={pillClassName(type, hasAction, className)}>
      <div className="flex items-center gap-2 shrink-0">
        {leadingIcon && <LeadingIcon type={type} />}
        <span className={LABEL_CLASSES}>{label}</span>
      </div>
      {hasAction && (
        <button type="button" onClick={onAction} className={actionClassName(type)}>
          <span className={ACTION_LABEL_CLASSES}>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}

export interface ToastOptions {
  label: string
  /** Which of the five this is — it decides the surface and the leading icon. Defaults to 'neutral'. */
  type?: ToastType
  /**
   * Renders an action on the right side. Pressing it runs `onAction`, if
   * given, and closes this toast — so a Dismiss needs only its label.
   */
  actionLabel?: string
  onAction?: () => void
  /** Show the leading icon — a check, a `!` or an `×`, per `type`. Defaults to true. */
  leadingIcon?: boolean
  /** Auto-dismiss after this many ms. Defaults to 5000. Pass 0 to disable. */
  durationMs?: number
}

interface ToastValue {
  /** Shows a toast and returns its id, for `dismissToast`. */
  showToast: (opts: ToastOptions) => string
  /** Closes the toast with this id; with no id, closes every toast on screen. */
  dismissToast: (id?: string) => void
}

/** What a toast carries beyond Base UI's own fields. */
interface ToastData {
  leadingIcon: boolean
  actionLabel?: string
  onAction?: () => void
}

const ToastContext = createContext<ToastValue | null>(null)

/** D7: three on screen at once. */
const VISIBLE_TOASTS = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  // One manager per provider, so `useToast` can add and close without
  // re-rendering every caller each time the list changes.
  const manager = useMemo(() => BaseToast.createToastManager<ToastData>(), [])
  const value = useMemo<ToastValue>(
    () => ({
      showToast: ({ label, type = 'neutral', leadingIcon = true, actionLabel, onAction, durationMs = 5000 }) =>
        manager.add({
          title: label,
          type,
          timeout: durationMs,
          // A failure interrupts; everything else waits for a pause.
          priority: type === 'error' ? 'high' : 'low',
          data: { leadingIcon, actionLabel, onAction },
        }),
      dismissToast: (id) => manager.close(id),
    }),
    [manager],
  )

  return (
    <ToastContext.Provider value={value}>
      <BaseToast.Provider toastManager={manager} limit={VISIBLE_TOASTS}>
        {children}
        <BaseToast.Portal>
          <BaseToast.Viewport className="fixed bottom-4 left-4 z-[100] flex flex-col-reverse items-start gap-2 pointer-events-none">
            <ToastList />
          </BaseToast.Viewport>
        </BaseToast.Portal>
      </BaseToast.Provider>
    </ToastContext.Provider>
  )
}

function ToastList() {
  const { toasts, close } = BaseToast.useToastManager<ToastData>()
  // Base UI lists the newest first; the viewport is `flex-col-reverse`, so
  // the newest stands nearest the corner.
  return toasts.map((toast) => {
    const type = (toast.type ?? 'neutral') as ToastType
    const { leadingIcon = true, actionLabel, onAction } = toast.data ?? {}
    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        // Towards the corner it stands in.
        swipeDirection={['left', 'down']}
        // A fourth toast hides the oldest (`data-limited`) until there is room.
        className={pillClassName(type, !!actionLabel, 'pointer-events-auto data-[limited]:hidden')}
      >
        <div className="flex items-center gap-2 shrink-0">
          {leadingIcon && <LeadingIcon type={type} />}
          <BaseToast.Title render={<span />} className={LABEL_CLASSES} />
        </div>
        {actionLabel && (
          <BaseToast.Action
            onClick={() => {
              onAction?.()
              close(toast.id)
            }}
            className={actionClassName(type)}
          >
            <span className={ACTION_LABEL_CLASSES}>{actionLabel}</span>
          </BaseToast.Action>
        )}
      </BaseToast.Root>
    )
  })
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
