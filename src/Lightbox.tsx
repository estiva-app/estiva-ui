import { useRef } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { IconX } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * A picture, full screen, on a scrim — the thing a thumbnail opens into.
 *
 * Both apps had written this by hand and neither had got it right: Peek's
 * `ImageLightbox` and the `FrameLightbox` before it were `createPortal` plus a
 * fixed `<div>`, with no Escape, no focus trap and nothing to return focus to
 * (Peek scan F5, P4; migration B22, Katerina 10 September). Ship never had one
 * at all, so a screenshot in an issue could not be looked at.
 *
 * On Base UI's `Dialog`, like `DialogShell`: the portal, the backdrop, Escape,
 * the outside press and the focus trap are its, and what is written here is the
 * picture, the scrim and the close button.
 *
 * **The close button is this component's own**, not an `IconButton`: a 26px
 * square with no fill is hard to find on top of a photograph, which is why Peek
 * had written an escape note beside its own. A 32px round button on an elevated
 * fill with a hairline reads on any picture.
 */
export interface LightboxProps {
  /** The picture to show. Swapping it — a thumbnail for the original, once it
   *  arrives — swaps what is on screen, with no flash of nothing. */
  src: string
  /** What the picture is. Names the viewer for assistive tech too. */
  alt: string
  onClose: () => void
  /** Extra classes on the picture itself. */
  className?: string
}

export function Lightbox({ src, alt, onClose, className }: LightboxProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim-strong" />
        <Dialog.Popup
          ref={popupRef}
          /*
            Focus the layer, not the ✕ — DialogShell's rule, for the same
            reason: Base UI's default is the first tabbable element, which here
            would open every picture with a ring drawn on its close button. The
            trap is armed either way, and Tab reaches the ✕ first.
          */
          initialFocus={popupRef}
          aria-label={alt}
          /*
            The popup IS the layer: a picture viewer has no card, so the popup
            fills the screen and centres what it holds. `outline-none` because
            it is a programmatic focus target rather than something tabbed to —
            the same reason DialogShell gives.

            A press anywhere on the layer closes it, which is what a full-screen
            picture teaches people to expect. Base UI's outside-press cannot do
            that here: there is no outside.
          */
          className="fixed inset-0 z-50 flex items-center justify-center p-8 outline-none"
          onClick={onClose}
        >
          <img
            src={src}
            alt={alt}
            /* The press on the picture is not a press on the scrim: clicking
               the thing you opened should not close it. */
            onClick={(e) => e.stopPropagation()}
            className={cn('max-w-full max-h-full object-contain rounded-lg', className)}
          />
          <Dialog.Close
            aria-label="Close"
            className="absolute top-4 right-4 size-8 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-text-secondary hover:text-text-primary"
          >
            <IconX size={16} stroke={1.5} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
