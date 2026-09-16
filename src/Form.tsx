import { useLayoutEffect, useRef, type FormHTMLAttributes, type ReactNode } from 'react'
import { Fieldset } from '@base-ui/react/fieldset'
import { Form as BaseForm } from '@base-ui/react/form'
import { cn } from './cn'

/**
 * A form: Enter in a field, or a submit button, sends it, and the page never
 * reloads. On Base UI's `Form` (UIG-7, 16 September), which the apps' five
 * forms had each written around a plain `<form>`: `preventDefault`, a busy
 * flag, and `disabled={busy}` on every field one by one.
 *
 * Base UI's part, as it renders it: a `<form noValidate>` — the browser's own
 * validation bubbles are off, which no field in either app used — that, on
 * submit, checks every `Field` inside and moves focus to the first one that is
 * invalid instead of sending. `Field`'s `error` is still how an error shows.
 *
 * `busy` is ours. While it is on, the children sit in a disabled
 * `<fieldset>` (Base UI's `Fieldset`, with no box of its own), so every field
 * and button inside is switched off at once, and focus waits on the form
 * rather than falling to the page. Chrome drops focus to `<body>` the moment
 * the focused field is disabled, before any effect runs, and jsdom does not —
 * so the form remembers the last element inside it that had focus, and takes
 * focus back from the page on its behalf (measured in Chrome, 16 September).
 * When `busy` ends, focus goes to the first invalid field, else to what sent
 * the form, else to the first control. That is `CommandPalette`'s order
 * too, so the two read the same (UIG-29).
 */
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children' | 'noValidate'> {
  /** Enter in a field, or a submit button. The page's own submit is already prevented. */
  onSubmit: () => void | Promise<void>
  /** While sending: every field and button inside is switched off, and focus waits on the form. */
  busy?: boolean
  children: ReactNode
}

const CONTROL = 'input:not([type="hidden"]), textarea, select, button, [role="checkbox"], [role="combobox"], [tabindex]:not([tabindex="-1"])'

function usable(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.isConnected && element.matches(CONTROL) && !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true'
}

export function Form({ onSubmit, busy = false, className, children, ...props }: FormProps) {
  const form = useRef<HTMLFormElement>(null)
  // What had focus when the form went busy, and whether the form took focus from it.
  const sender = useRef<Element | null>(null)
  const holding = useRef(false)
  // The last element inside the form that had focus, until focus moves to something outside it.
  const lastInside = useRef<Element | null>(null)

  useLayoutEffect(() => {
    const element = form.current
    if (!element) return
    if (busy) {
      const active = document.activeElement
      // Focus is still inside (jsdom, or a field that stayed enabled), or the
      // browser has already dropped it to the page from a field inside (Chrome).
      const from =
        active && active !== element && element.contains(active)
          ? active
          : !active || active === document.body
            ? lastInside.current
            : null
      if (from?.isConnected) {
        sender.current = from
        holding.current = true
        element.focus()
      }
      return
    }
    if (!holding.current) return
    holding.current = false
    // Someone who moved focus on while waiting keeps it where they put it.
    if (document.activeElement !== element && document.activeElement !== document.body) return
    const invalid = Array.from(element.querySelectorAll('[data-invalid]')).find(usable)
    const target = invalid ?? (usable(sender.current) ? sender.current : Array.from(element.querySelectorAll(CONTROL)).find(usable))
    sender.current = null
    target?.focus()
  }, [busy])

  return (
    <BaseForm
      ref={form}
      {...props}
      // Focus waits here only while busy; the rest of the time a click between two fields must not land on the form.
      tabIndex={busy ? -1 : props.tabIndex}
      // A form that holds focus for a moment must not draw a focus ring.
      className={cn('outline-none', className)}
      onFocus={(event) => {
        if (event.target !== form.current) lastInside.current = event.target
        props.onFocus?.(event)
      }}
      onBlur={(event) => {
        const next = event.relatedTarget
        if (next && !form.current?.contains(next)) lastInside.current = null
        props.onBlur?.(event)
      }}
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <Fieldset.Root disabled={busy} className="contents">
        {children}
      </Fieldset.Root>
    </BaseForm>
  )
}
