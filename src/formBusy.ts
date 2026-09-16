import { createContext, useContext } from 'react'

/**
 * Whether a `Form` around this is busy (UIG-7).
 *
 * `Form` switches its children off with a disabled `<fieldset>`, which the
 * browser applies to every native control inside — but a part that draws its
 * look from Base UI's own `disabled` (Button, IconButton, Checkbox) is not
 * told, so it kept its normal look while it could not be pressed, and a
 * Checkbox, which is a `<span>`, could still be ticked (Katerina saw the busy
 * story's button unchanged, 16 September). Those parts read this and switch
 * off the way their own `disabled` does. Not exported: it is the package's
 * wiring between Form and its parts.
 */
export const FormBusyContext = createContext(false)

export function useFormBusy(): boolean {
  return useContext(FormBusyContext)
}
