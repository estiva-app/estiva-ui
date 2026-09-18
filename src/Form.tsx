import { useLayoutEffect, useRef, type FormHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { Fieldset } from '@base-ui/react/fieldset'
import { Form as BaseForm } from '@base-ui/react/form'
import { cn } from './cn'
import { FormBusyContext, useFormBusy } from './formBusy'

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
 * and button inside is switched off at once — the package's Button,
 * IconButton and Checkbox wearing their own switched-off look, which a
 * fieldset alone does not give them (`formBusy.ts`) — and focus waits on the form
 * rather than falling to the page. Chrome drops focus to `<body>` the moment
 * the focused field is disabled, before any effect runs, and jsdom does not —
 * so the form remembers the last element inside it that had focus, and takes
 * focus back from the page on its behalf (measured in Chrome, 16 September).
 * When `busy` ends, focus goes to the first invalid field, else to what sent
 * the form, else to the first control. That is `CommandPalette`'s order
 * too, so the two read the same (UIG-29).
 *
 * The keys are ours, the same in every form (Katerina, 16 September): Enter in
 * a one-line field sends; Enter in a text area is a new line; Enter in a list
 * or a people picker picks; Ctrl+Enter (Cmd+Enter) sends from anywhere inside.
 * The form sends on Enter itself rather than leaving it to the browser, whose
 * implicit submission depends on whether the form has a submit button and how
 * many fields it holds. `enterSends={false}` keeps Enter in a one-line field
 * from sending, for a form where only Ctrl+Enter may send (`CommandPalette`).
 * Every way of sending goes through the form's submit, so Base UI's field
 * check runs for each.
 */
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children' | 'noValidate'> {
  /** Enter in a field, or a submit button. The page's own submit is already prevented. */
  onSubmit: () => void | Promise<void>
  /** While sending: every field and button inside is switched off, and focus waits on the form. */
  busy?: boolean
  /**
   * Whether Enter in a one-line field sends. On by default. Off where only
   * Ctrl+Enter may send — a form inside `CommandPalette`. Ctrl+Enter sends either way.
   */
  enterSends?: boolean
  children: ReactNode
}

const CONTROL = 'input:not([type="hidden"]), textarea, select, button, [role="checkbox"], [role="combobox"], [tabindex]:not([tabindex="-1"])'

/** The inputs a person types one line into; a picker's input (`role="combobox"`) is not one. */
const ONE_LINE = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password', 'number'])

function usable(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.isConnected && element.matches(CONTROL) && !element.matches(':disabled') && element.getAttribute('aria-disabled') !== 'true'
}

/** A marked field's own control: Base UI marks the control and the `Field` around it. */
function firstInvalid(form: HTMLElement): HTMLElement | undefined {
  for (const marked of form.querySelectorAll('[data-invalid]')) {
    if (usable(marked)) return marked
    const inside = Array.from(marked.querySelectorAll(CONTROL)).find(usable)
    if (inside) return inside
  }
  return undefined
}

export function Form({ onSubmit, busy: ownBusy = false, enterSends = true, className, children, ...props }: FormProps) {
  // A form inside a busy form is busy too.
  const outerBusy = useFormBusy()
  const busy = ownBusy || outerBusy
  const form = useRef<HTMLFormElement>(null)
  // Read at submit time: a form that is sending does not send again (Ctrl+Enter reaches it while busy).
  const busyNow = useRef(busy)
  busyNow.current = busy
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
    const target = firstInvalid(element) ?? (usable(sender.current) ? sender.current : Array.from(element.querySelectorAll(CONTROL)).find(usable))
    sender.current = null
    target?.focus()
  }, [busy])

  /*
    Bubble phase, after the field's own handler: a picker picks on Enter and
    says so by preventing it, and a field that handles Enter itself does too.
  */
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    props.onKeyDown?.(event)
    if (event.key !== 'Enter' || event.defaultPrevented || event.nativeEvent.isComposing) return
    const target = event.target
    const inInput = target instanceof HTMLInputElement
    /*
      In an input the browser sends a form on its own — on Enter with Shift or
      Alt too (measured in Chrome: Shift+Enter sent Peek's comment box, 16
      September) — so the form stops that every time and sends only by these
      rules. A text area's Enter is a new line and a button's Enter presses it:
      those are left to the browser.
    */
    if (inInput) event.preventDefault()
    if (event.altKey || event.shiftKey) return
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      form.current?.requestSubmit()
      return
    }
    if (!inInput) return
    const oneLine = ONE_LINE.has((target.getAttribute('type') ?? '').toLowerCase()) && target.getAttribute('role') !== 'combobox'
    if (enterSends && oneLine) form.current?.requestSubmit()
  }

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
      onKeyDown={onKeyDown}
      onSubmit={(event) => {
        /*
          A form's own send only. React carries a submit up the component tree,
          through a portal too, so a Form in a Popover inside this Form sent both:
          Enter in a link field sent the whole message around it (UIG-14, C1,
          Katerina 19 September). The inner Form has already handled its own.
        */
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        if (busyNow.current) return
        void onSubmit()
      }}
    >
      <Fieldset.Root disabled={busy} className="contents">
        <FormBusyContext.Provider value={busy}>{children}</FormBusyContext.Provider>
      </Fieldset.Root>
    </BaseForm>
  )
}
