import { createContext, useContext, useId, type ReactNode } from 'react'

/**
 * The id of the control this Field labels.
 *
 * **A control has to opt in by calling `useFieldControlId`.** The automatic
 * alternative is nesting the control inside the `<label>`, which associates
 * anything by construction and needs no cooperation — and it is not used here,
 * because a control that is *both* nested in a label and named by its `htmlFor`
 * can receive two activations from one click. That is a real hazard for a
 * checkbox and a latent one for everything else, and this library has a
 * `Checkbox`.
 *
 * So: one explicit mechanism, and a test that pins it for every primitive that
 * uses it (`Field.test.tsx`). A new primitive that renders a labelable element
 * calls this hook and spreads the result; one that does not is unlabelled, and
 * the test is where that gets noticed.
 */
const FieldControlIdContext = createContext<string | undefined>(undefined)

/**
 * The id a surrounding `Field` wants this control to have, falling back to the
 * caller's own outside one.
 *
 * **Inside a Field, the Field wins**, which is the opposite of what I wrote
 * first and the test caught within the minute. Letting a control's own `id`
 * take precedence leaves the label's `htmlFor` pointing at the id the Field
 * generated and the control answering to a different one — which is this
 * ticket's defect exactly, reproduced by the fix for it, and it fails with the
 * same message: *"Found a label with the text of: Title, however no form
 * control was found associated to that label."*
 *
 * A caller who needs to choose the id names it on the Field (`htmlFor`), which
 * is the one place that can set both halves. Outside a Field there is nothing
 * to disagree with, so the caller's id is used.
 */
export function useFieldControlId(ownId?: string): string | undefined {
  const fromField = useContext(FieldControlIdContext)
  return fromField ?? ownId
}

/**
 * Peek's Field (2026-08-28): a label over a control, 8px apart, with a red
 * asterisk when required. The label is the `input-label` type token as a plain
 * class, never merged.
 *
 * The label names its control (SHA-17). It did not, and the control was a
 * *sibling* of the label with no `htmlFor`, so there was neither an explicit
 * nor an implicit association: a screen reader announced an unlabelled edit
 * box and clicking the label focused nothing.
 */
export interface FieldProps {
  label: string
  required?: boolean
  /**
   * Override the generated id. Only needed when something outside has to name
   * the control — an `aria-describedby` elsewhere, or a form library.
   */
  htmlFor?: string
  children: ReactNode
}

export function Field({ label, required = false, htmlFor, children }: FieldProps) {
  const generated = useId()
  const id = htmlFor ?? generated
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={`text-input-label text-text-primary${required ? ' flex items-center' : ''}`}
      >
        {label}
        {required && <span className="text-error-default ml-0.5">*</span>}
      </label>
      <FieldControlIdContext.Provider value={id}>{children}</FieldControlIdContext.Provider>
    </div>
  )
}
