import type { ReactNode } from 'react'

/**
 * Peek's Field (2026-08-28), verbatim: a label over a control, 8px apart,
 * with a red asterisk when required. The label is the `input-label` type
 * token as a plain class, never merged.
 */
export interface FieldProps {
  label: string
  required?: boolean
  children: ReactNode
}

export function Field({ label, required = false, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`text-input-label text-text-primary${required ? ' flex items-center' : ''}`}>
        {label}
        {required && <span className="text-error-default ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
