import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from '@base-ui/react/input'
import { cn } from './cn'
import { FIELD_BOX_CLASSES, FIELD_DISABLED_CLASSES, FIELD_FOCUS_RING_CLASSES, FIELD_SIZE_CLASSES, FIELD_TEXT_CLASSES } from './looks'

/**
 * Peek's TextInput (2026-08-28): the inset field with a 8px radius, 14px
 * text, the focus border in every theme (Katerina, 2026-08-28: Ship's inputs
 * focus like Signal's) — and Signal's glow on top.
 * Plus a disabled look (Ship's addition): the disabled surface and text,
 * no pointer. On Base UI's `Input` since stage 3 of the migration
 * (2026-09-07).
 *
 * Base UI's `Input` is a native `<input>` that finds a surrounding `Field` on
 * its own, so the id plumbing this used to do — `useFieldControlId`, and the
 * context behind it — is gone. Outside a `Field` it behaves as before: the
 * field context has a default, so nothing has to be wrapped.
 */
export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * `small` is 24px tall with 12px text — the small `Select`'s size, so a
   * field can share a dense row with small selects (D67, 2026-09-13: Peek's
   * reference widget hand-built one because this was 38px). Replaces the
   * native `size` attribute, which counts characters and which no caller
   * used; set a width with the layout instead.
   */
  size?: 'default' | 'small'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({ className, type = 'text', size = 'default', ...props }, ref) {
  return (
    <Input
      ref={ref}
      type={type}
      className={cn(
        // The border strengthens on hover, as Select's and ChipInput's do (Katerina, 16 September:
        // "aren't there hover states in text input and text area?"). Focus comes after hover in
        // Tailwind's order, so a focused field keeps the focus border under the pointer.
        FIELD_BOX_CLASSES,
        // The small size is the small Select's trigger, class for class.
        FIELD_SIZE_CLASSES[size],
        FIELD_TEXT_CLASSES,
        'outline-none transition-colors',
        FIELD_DISABLED_CLASSES,
        FIELD_FOCUS_RING_CLASSES,
        className,
      )}
      {...props}
    />
  )
})
