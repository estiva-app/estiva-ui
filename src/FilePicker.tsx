import { forwardRef, type InputHTMLAttributes } from 'react'

/**
 * The browser's file picker, with nothing drawn: a hidden `<input type="file">`
 * that the caller's own button opens with `ref.current.click()` (UIG-7,
 * 16 September). Base UI has no part for it.
 *
 * Peek's paperclip and Ship's two wrote this by hand, each with the same two
 * details — the files handed over as they were chosen, and the value cleared
 * so the same file can be chosen again after a failure or after it was
 * removed. Those are here once.
 *
 * Hidden from the accessibility tree and from Tab: the button that opens it is
 * the control, and two things both named "Attach" is one more than a screen
 * reader should find. A `display: none` input still opens its picker on a
 * scripted click.
 */
export interface FilePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'defaultValue' | 'className' | 'style' | 'children'> {
  /** The chosen files, in the order the picker gave them. Not called when the picker is closed with nothing chosen. */
  onPick: (files: File[]) => void
}

export const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(function FilePicker({ onPick, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="file"
      aria-hidden="true"
      tabIndex={-1}
      className="hidden"
      {...props}
      onChange={(event) => {
        const files = Array.from(event.target.files ?? [])
        // Cleared before anything else runs, so the same file can be chosen again.
        event.target.value = ''
        if (files.length > 0) onPick(files)
      }}
    />
  )
})
