import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { cn } from './cn'

/**
 * Peek's Field (2026-08-28): a label over a control, 8px apart, with a red
 * asterisk when required. The label is the `input-label` type token, merged
 * with `cn()` like every other class list here. On Base UI's `Field` since
 * stage 3 of the migration (2026-09-07).
 *
 * The label names its control. It did not once, and the control was a
 * *sibling* of the label with no `htmlFor`, so there was neither an explicit
 * nor an implicit association: a screen reader announced an unlabelled edit
 * box and clicking the label focused nothing (SHA-17). That fix used to be
 * ours — a context carrying a generated id, which every control had to opt
 * into by calling `useFieldControlId`. **Base UI does it now**, for its own
 * `Input`, `Checkbox`, `Select` and anything rendered through `Field.Control`,
 * so a new control is labelled by construction rather than by remembering.
 *
 * `helper` and `error` are the line under the control, which Ship built by
 * hand in two dialogs (`COMPONENTS-SHIP.md` F14) and Peek in four
 * (`COMPONENTS-PEEK.md` F14), always the same two class lists. **An error
 * replaces the helper rather than joining it** — that is what those callers
 * did (`pairError ?? 'Leave empty and…'`), and a field that says both at once
 * is asking the reader to work out which one is live.
 *
 * The line is announced: Base UI wires `aria-describedby` for the helper and
 * `aria-invalid` + the error's id for the error, which the hand-built spans
 * never did.
 *
 * `required` is announced too, since 2026-09-08. It drew the asterisk and
 * nothing else — measured, the control carried neither `required` nor
 * `aria-required`, so the one thing the mark means never reached anybody who
 * could not see it. Base UI's `Field` has no `required` of its own, so this
 * puts `aria-required` on the control itself.
 */
export interface FieldProps {
  label: string
  /**
   * Draws the asterisk **and** marks the control `aria-required`, so the mark
   * means something to a reader who cannot see it. It reaches a single control
   * element; a `children` of several elements keeps the asterisk and owes its
   * own `aria-required`.
   */
  required?: boolean
  /**
   * A hint under the control — what the format is, what happens if it is left
   * empty. `caption`, muted. Hidden while `error` is set.
   */
  helper?: string
  /**
   * What is wrong, in the same place as the helper and in the error colour.
   * Setting it also marks the control invalid, so the caller no longer passes
   * `aria-invalid` itself.
   */
  error?: string
  children: ReactNode
}

/**
 * The two looks the line under a control wears, in one place so `Field` and
 * `FieldLine` cannot drift apart. `warning` is `FieldLine`'s alone — see there.
 */
const LINE_STYLES = {
  helper: 'text-caption text-text-muted',
  warning: 'text-caption text-warning-default',
  error: 'text-caption text-error-default',
} as const

export function Field({ label, required = false, helper, error, children }: FieldProps) {

  /*
    The asterisk is a picture of `required`; this is the word for it. Base UI's
    `Field` has no `required` to propagate, so the control is marked here —
    `aria-required` rather than the native attribute, because the native one
    also switches on the browser's own validation bubble, which no field in
    either app uses. A control that already says so keeps what it says.
  */
  const control =
    required && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-required'?: boolean | 'true' | 'false' }>, {
          'aria-required': (children as ReactElement<{ 'aria-required'?: boolean | 'true' | 'false' }>).props['aria-required'] ?? true,
        })
      : children
  return (
    <BaseField.Root invalid={!!error} className="flex flex-col gap-2">
      {/* `cn`, like everywhere else. It was a template literal, with a comment
          saying the type token must never be merged — which stopped being true
          when `cn()` was taught the ramp: `input-label` is in it, and
          `cn.test.ts` pins that. */}
      <BaseField.Label className={cn('text-input-label text-text-primary', required && 'flex items-center')}>
        {label}
        {/* A picture, not a word: `aria-required` on the control says it, and
            without this the control was named "Title*" (Finding 38). */}
        {required && (
          <span aria-hidden="true" className="text-error-default ml-0.5">
            *
          </span>
        )}
      </BaseField.Label>
      {/*
        The control sits in the same place whether or not there is a line
        under it. It used to be wrapped only when there was one, and React
        then re-created the control the moment an error appeared or cleared —
        so a person typing into a field whose error clears on input lost
        focus after the first keystroke (found by Ship's adoption, 2026-09-08,
        Finding 38). A one-child flex column draws exactly as the bare control
        did; the 6px stack Ship and Peek both wrote by hand appears only with a
        line.
      */}
      <div className="flex flex-col gap-1.5">
        {control}
        {error != null ? (
          <BaseField.Error match className={LINE_STYLES.error}>
            {error}
          </BaseField.Error>
        ) : helper != null ? (
          <BaseField.Description className={LINE_STYLES.helper}>{helper}</BaseField.Description>
        ) : null}
      </div>
    </BaseField.Root>
  )
}

/**
 * The line on its own — the same small line `Field` draws under a control,
 * for the places where there is no single control to draw it under.
 *
 * **Why it is not a `Field`.** Three surfaces in Peek put this line under a
 * *group*: the rename row (a field and two buttons), a Folder's action
 * controls, another app's action controls. Each already has a section heading
 * above it, and `Field` comes with a label of its own — so wrapping the group
 * in one would either say the heading twice or restyle it. Found at step 4 of
 * Peek's adoption (`ADOPTION.md` B24); until this existed, all three spelled
 * `text-xs text-error-default` by hand.
 *
 * **It announces itself**, which is the half the hand-written spans never had.
 * These lines appear *after* something was done — a rename that the relay
 * refused, an action that failed — so a reader who cannot see them is told:
 * `role="alert"` for an error, `role="status"` for the rest. That is `Banner`'s
 * rule (2026-09-02), kept here so the two agree.
 *
 * **`warning` is the tone `Field` has not got**, and deliberately: `Field`'s
 * `error` also marks its control invalid, and a warning is not invalid — the
 * rename went through, and something about it needs saying. A group has no
 * single control to mark, so the distinction is free here and would not be
 * there.
 *
 * When the line belongs to one control, it is `Field`'s `helper` or `error`:
 * those are wired to the control with `aria-describedby` and `aria-invalid`,
 * which this cannot be.
 */
export type FieldLineTone = 'helper' | 'warning' | 'error'

export interface FieldLineProps {
  /** `helper` (muted) is a hint; `warning` (amber) and `error` (red) are outcomes. Default `helper`. */
  tone?: FieldLineTone
  children: ReactNode
  className?: string
}

export function FieldLine({ tone = 'helper', children, className }: FieldLineProps) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={cn(LINE_STYLES[tone], className)}>
      {children}
    </p>
  )
}
