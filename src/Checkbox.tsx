import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { IconCheck } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * A 16px square that fills with the accent when checked — Peek's Checkbox
 * (2026-09-01), verbatim; on Base UI Checkbox since stage 1 of the migration
 * (2026-09-06).
 *
 * Controlled only; parents own the state. Two renderings, one class list:
 *
 * - With `onChange` it is the control: Base UI's `role="checkbox"` on a
 *   `<button>` (the element it always was — an empty inline `<span>` sits
 *   1px higher on a line of text, measured), a hidden `<input>` beside it,
 *   Space toggles, and its click never reaches the row around it.
 * - Without `onChange` it is a picture of the state, for a row that toggles
 *   on its own click. It is hidden from assistive technology and takes no
 *   focus, so the row is one control and says the state itself
 *   (`aria-pressed`, or `aria-selected` on an option). Two focusable controls
 *   nested in one another is what axe's `nested-interactive` rule rejects,
 *   and a `<button>` inside a `<button>` is not HTML, so this one is a
 *   `<span>`; inside a flex row it lands where the button did.
 */
export interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

function squareClasses(checked: boolean, disabled: boolean, interactive: boolean, className?: string) {
  return cn(
    'inline-flex items-center justify-center size-4 shrink-0 rounded-[4px] border transition-colors',
    checked ? 'bg-accent-primary border-accent-primary text-text-inverse' : 'bg-transparent border-border-strong hover:border-text-muted',
    disabled && 'opacity-50 pointer-events-none',
    interactive ? 'cursor-pointer' : 'pointer-events-none',
    className,
  )
}

export function Checkbox({ checked, onChange, disabled = false, className, ...aria }: CheckboxProps) {
  if (!onChange) {
    return (
      <span aria-hidden="true" className={squareClasses(checked, disabled, false, className)}>
        {checked && <IconCheck size={12} stroke={3} />}
      </span>
    )
  }
  return (
    <BaseCheckbox.Root
      render={<button type="button" />}
      nativeButton
      checked={checked}
      disabled={disabled}
      aria-label={aria['aria-label']}
      onCheckedChange={(next) => onChange(next)}
      onClick={(e) => e.stopPropagation()}
      className={(state) => squareClasses(state.checked, state.disabled, true, className)}
    >
      {/* `flex`, so the icon is a flex item and not an inline box with a line
          height of its own, which would sit lower than the square's centre. */}
      <BaseCheckbox.Indicator className="flex">
        <IconCheck size={12} stroke={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
}
