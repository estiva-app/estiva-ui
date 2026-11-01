/**
 * The one card attached to a piece of text, and the ✕ that removes it (why:
 * https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-link-on-words-counts-toward-the-card.md).
 *
 * Its ✕ is a file's (Katerina, 29 Oct): the round one on the card's corner, from
 * `AttachmentCard`, shown when the pointer is over the card or the ✕ has focus.
 * On a screen that cannot hover it always shows, so a tap reaches it (Miky, 16
 * Oct, kickoff). Inside a box being written in, `CommentBox` places it with the
 * files, and the card there reads as words on the files' fill (`inTheBox`).
 *
 * One inside another draws only its card: the box wraps the card an app hands
 * it, and an app that draws its sent card as an `AttachedCard` hands it that,
 * so the box's ✕ is the one (Katerina, 30 Oct: no card in a card).
 */
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { RemoveBadge } from './AttachmentCard'
import { LinkCard } from './LinkCard'
import { loadingShapeOf, type CardShapeMemory, type LinkState, type LoadingShape } from './linked'

interface AttachedCardBase {
  /** Draws the ✕. Without it the card shows with none, as it does to anyone but the author. */
  onRemove?: () => void
}

/** Where a card's shape is kept between loads: the app's `cardShapeMemory`, and the card's id in it (its address). */
export interface AttachedCardMemory {
  memory: CardShapeMemory
  id: string
}

/**
 * The card is a `LinkCard` of `link`, or the app's own card as `children`: an
 * app that draws a sent card itself draws the one in its box the same way.
 */
export type AttachedCardProps = AttachedCardBase &
  (
    | {
        link: LinkState
        /**
         * Keeps its height while it loads: the card it draws is measured and noted in `memory` under `id`, and the
         * next time it loads it holds that height and that shape, so nothing around it moves.
         */
        remember?: AttachedCardMemory
        children?: never
      }
    | { link?: never; remember?: never; children: ReactNode }
  )

/** Inside an `AttachedCard`: one inside it draws only its card. */
const Attached = createContext(false)

/**
 * A card that keeps its height while it loads (Peek's peek#533 and #534, then Ship's copy, moved here so no app
 * measures its own): drawn, its shape and height are noted, and noted again once a resize settles; loading, it holds
 * the height and the shape it last drew at on this device. Returns the shape to load with and the height to hold.
 */
function useRememberedHeight(link: LinkState | undefined, remember: AttachedCardMemory | undefined, box: RefObject<HTMLDivElement | null>) {
  const memory = remember?.memory
  const id = remember?.id
  const kept = memory && id && link?.state === 'loading' ? memory.of(id, link.kind) : undefined
  // The drawn card's shape, kept for its placeholder next time; the height holds what the shape cannot say: a summary
  // the kit wraps to two lines.
  const shapeKey = memory && id && link?.state === 'ready' ? JSON.stringify(loadingShapeOf(link.linked)) : undefined
  const kind = link?.state === 'ready' ? link.linked.kind : link?.kind
  useEffect(() => {
    const card = box.current
    if (!memory || !id || !kind || !shapeKey || !card) return
    const drawn = JSON.parse(shapeKey) as LoadingShape
    // A card not on screen (a closed panel) measures 0: it keeps the height it last drew at.
    const note = () => {
      const height = Math.round(card.getBoundingClientRect().height)
      memory.note(id, height > 0 ? { ...drawn, height } : { ...drawn, height: memory.of(id, kind)?.height })
    }
    note()
    if (typeof ResizeObserver === 'undefined') return
    // A window being resized changes every card's height each frame: note it once it settles.
    let settle: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(() => {
      clearTimeout(settle)
      settle = setTimeout(note, 500)
    })
    observer.observe(card)
    return () => {
      observer.disconnect()
      clearTimeout(settle)
    }
  }, [box, memory, id, kind, shapeKey])
  return { kept, held: kept?.height ? { minHeight: kept.height } : undefined }
}

export function AttachedCard({ link, children, onRemove, remember }: AttachedCardProps) {
  const box = useRef<HTMLDivElement>(null)
  const { kept, held } = useRememberedHeight(link, remember, box)
  // Loading with no shape of the app's own: the one it last drew at here.
  const shown = link?.state === 'loading' && !link.shape && kept ? { ...link, shape: kept } : link
  const card = shown ? <LinkCard link={shown} /> : children
  const inside = useContext(Attached)
  if (inside) {
    // Only its card, as one inside another draws; remembered, in a plain box of its own that measures and holds it.
    return remember ? (
      <div ref={box} style={held}>
        {card}
      </div>
    ) : (
      <>{card}</>
    )
  }
  return (
    // At most 480px, so it never runs a column's or a wide box's whole width (Katerina, 29 and 30 Oct).
    <div ref={box} className="group/card relative max-w-[480px]" style={held}>
      <Attached.Provider value>{card}</Attached.Provider>
      {onRemove && (
        <RemoveBadge
          label="Remove"
          onRemove={onRemove}
          className="opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        />
      )}
    </div>
  )
}
