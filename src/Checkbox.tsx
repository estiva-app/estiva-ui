import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Field as BaseField } from '@base-ui/react/field'
import { IconCheck } from '@tabler/icons-react'
import { cn } from './cn'
import { useFormBusy } from './formBusy'

/**
 * A 16px square that fills with the accent when checked — Peek's Checkbox
 * (2026-09-01), verbatim; on Base UI Checkbox since stage 1 of the migration
 * (2026-09-06).
 *
 * Controlled only; parents own the state. Two renderings, one class list:
 *
 * - With `onChange` it is the control, as Base UI renders it: a
 *   `<span role="checkbox">` with a hidden `<input>` beside it. Space
 *   toggles, Enter does not, and its click never reaches the row around it.
 * - Without `onChange` it is a picture of the state, for a row that toggles
 *   on its own click. It is hidden from assistive technology and takes no
 *   focus, so the row is one control and says the state itself
 *   (`aria-pressed`, or `aria-selected` on an option). Two focusable controls
 *   nested in one another is what axe's `nested-interactive` rule rejects.
 *
 * The tick is always in the box, hidden when unchecked. A box that is empty
 * in one state and holds an icon in the other hangs on a line of text
 * differently in each, and moved 1px on every click (Katerina, 2026-09-07:
 * "it should be fixed"). With the tick always there, Base UI's `<span>` and
 * the `<button>` this used to be land on the same pixel, measured. In a flex
 * row nothing ever moved.
 *
 * With `label`, the words sit beside the box and are part of the target: Base
 * UI's `Field`, its `Field.Label` around the box and the words — the way its
 * Checkbox page labels a checkbox inside a form. The class list is Peek's
 * Read state panel's, where it was written by hand (UIG-7, 16 September). The
 * words keep their colour when the box is disabled (Katerina: "no need").
 *
 * Inside a busy `Form` it is disabled, and looks it (`formBusy.ts`).
 */
export interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  /**
   * Words beside the box. With `onChange`, clicking them toggles it too, and
   * they name it, so no `aria-label` is needed. `className` stays on the box.
   */
  label?: string
  'aria-label'?: string
  /** Set by a `Field` with `required`; a caller inside one owes nothing. */
  'aria-required'?: boolean | 'true' | 'false'
  className?: string
}

function squareClasses(checked: boolean, disabled: boolean, interactive: boolean, className?: string) {
  return cn(
    'inline-flex items-center justify-center size-4 shrink-0 rounded-sm border transition-colors',
    checked ? 'bg-accent-primary border-accent-primary text-text-inverse' : 'bg-transparent border-border-strong hover:border-text-muted',
    disabled && 'opacity-50 pointer-events-none',
    interactive ? 'cursor-pointer' : 'pointer-events-none',
    className,
  )
}

/** `flex`, so the icon is a flex item and not an inline box with a line height of its own. */
const tickClasses = (checked: boolean) => cn('flex', !checked && 'invisible')

const WORDS_CLASSES = 'text-body-2 text-text-primary'

export function Checkbox({ checked, onChange, disabled: ownDisabled = false, label, className, ...aria }: CheckboxProps) {
  const formBusy = useFormBusy()
  const disabled = ownDisabled || formBusy
  if (!onChange) {
    const picture = (
      <span aria-hidden="true" className={squareClasses(checked, disabled, false, className)}>
        <span className={tickClasses(checked)}>
          <IconCheck size={12} stroke={3} />
        </span>
      </span>
    )
    if (label === undefined) return picture
    // The row around it is the control and says the state; the words are only words.
    return (
      <span className="flex items-center gap-2">
        {picture}
        <span className={WORDS_CLASSES}>{label}</span>
      </span>
    )
  }
  const box = (
    <BaseCheckbox.Root
      checked={checked}
      disabled={disabled}
      aria-label={aria['aria-label']}
      aria-required={aria['aria-required']}
      onCheckedChange={(next) => onChange(next)}
      onClick={(e) => e.stopPropagation()}
      className={(state) => squareClasses(state.checked, state.disabled, true, className)}
    >
      <BaseCheckbox.Indicator keepMounted className={(state) => tickClasses(state.checked)}>
        <IconCheck size={12} stroke={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
  if (label === undefined) return box
  return (
    <BaseField.Root disabled={disabled}>
      {/* No pointer over words that toggle nothing. */}
      <BaseField.Label className={cn('flex items-center gap-2', !disabled && 'cursor-pointer')}>
        {box}
        <span className={WORDS_CLASSES}>{label}</span>
      </BaseField.Label>
    </BaseField.Root>
  )
}
