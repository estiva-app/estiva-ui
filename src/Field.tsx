import type { ReactNode } from 'react'
import { Field as BaseField } from '@base-ui/react/field'

/**
 * Peek's Field (2026-08-28): a label over a control, 8px apart, with a red
 * asterisk when required. The label is the `input-label` type token as a plain
 * class, never merged. On Base UI's `Field` since stage 3 of the migration
 * (2026-09-07).
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
 */
export interface FieldProps {
  label: string
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

export function Field({ label, required = false, helper, error, children }: FieldProps) {
  const line = error ?? helper
  return (
    <BaseField.Root invalid={!!error} className="flex flex-col gap-2">
      <BaseField.Label className={`text-input-label text-text-primary${required ? ' flex items-center' : ''}`}>
        {label}
        {required && <span className="text-error-default ml-0.5">*</span>}
      </BaseField.Label>
      {/*
        No line, no wrapper: every caller that predates `helper` and `error`
        keeps the exact DOM it had, so the port cannot move a pixel. With a
        line, this is the 6px stack Ship and Peek were both writing by hand.
      */}
      {line == null ? (
        children
      ) : (
        <div className="flex flex-col gap-1.5">
          {children}
          {error != null ? (
            <BaseField.Error match className="text-caption text-error-default">
              {error}
            </BaseField.Error>
          ) : (
            <BaseField.Description className="text-caption text-text-muted">{helper}</BaseField.Description>
          )}
        </div>
      )}
    </BaseField.Root>
  )
}
