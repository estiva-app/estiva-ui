import { createContext, useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Inside a thread drawn as one card (a comment open in one column, its replies under it): its cards draw no new edge
 * of their own, the one card is their edge. Set by ConversationLayout and Thread; read by ConversationCard and ReplyCard.
 */
export const InThreadCard = createContext(false)

/** A comment's place in a `ConversationLayout`: whether its thread is open, and how a press opens or closes it. */
export interface ConversationItemState {
  /** One column: its thread opens under it. Otherwise two columns, beside. */
  under: boolean
  /** Its thread is the open one. */
  open: boolean
  /** A press on the card or its replies row: opens its thread; in one column, a second press closes it. */
  toggle: () => void
  /** Reply: opens its thread, never closes it. */
  show: () => void
}

/**
 * Set by ConversationLayout round each comment, read by ConversationCard: so a card opens and closes its thread, says
 * so on its replies row, and is marked while open beside, the same in every app with no wiring of its own.
 */
export const InConversationItem = createContext<ConversationItemState | null>(null)

/**
 * Counts the times a thread has opened in a ConversationLayout. The box at the thread's foot takes the caret each time
 * it changes, at the box's end, without scrolling: the comment that was pressed stays where it is (Katerina, 31
 * October). 0, as outside a layout or for the thread open when the page is drawn: the box waits to be pressed.
 */
export const caretOnOpen = createContext(0)

/**
 * Set by ConversationLayout round each comment in one column: it draws an open comment's line itself, one bar from the
 * comment's face to its thread's last reply. The card and the thread then draw no pieces of it.
 */
export const LineByLayout = createContext(false)

/**
 * A comment's exact date and time, from its moment (ms), in the reader's own way: what its time says under the pointer
 * (Peek's words for it: `dateStyle: 'long'`, `timeStyle: 'short'`).
 */
export const exactTime = (at: number) => new Date(at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })

/** A comment's moment when it is one, else none: a moment that is not a number (a bad date read) draws the time as with none, rather than throwing. */
export const momentOf = (at: number | undefined) => (at !== undefined && Number.isFinite(at) ? at : undefined)

/**
 * The flash on a comment or reply a link just showed (`data-shown`, set by `showInConversation`): the accent's wash,
 * fading over 1.8s, in 8px corners; held still, without the fade, for a reader who asks for less motion. Peek's
 * cited-flash, moved (INT-3). On every element the kit marks with an id a link can name.
 */
export const SHOWN_CLASSES = 'data-[shown]:animate-shown data-[shown]:rounded-lg motion-reduce:data-[shown]:animate-none motion-reduce:data-[shown]:bg-accent-wash'

/** The room between a face and the line under it. */
const FACE_GAP = 4

/**
 * The line from a face down, as ONE bar measured in `root`: from 4px under the comment's face (`[data-face]` in
 * `[data-comment-body]`: never a reply's, when the comment is deleted or being edited and shows none) — it never touches the
 * face; Katerina, 1 November — to the end. It ends at the thread's replies (`[data-thread-replies]`), or, with none yet, at
 * the comment's own foot (`[data-comment-body]`); with `toDot`, at the centre of the resolved line's dot (`[data-dot]`). Pieces drawn in separate
 * boxes met a pixel apart at some zooms, a step where the thread began (Katerina, 1 November: "the line breaks in the
 * middle"); one bar cannot. Measured again whenever `root` changes size. `null` until measured, or when `active` is false.
 */
export function useFaceLine(root: RefObject<HTMLElement | null>, active: boolean, toDot = false) {
  const [line, setLine] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const el = root.current
    if (!active || !el) {
      setLine(null)
      return
    }
    const measure = () => {
      const face = el.querySelector('[data-comment-body] [data-face]')
      const target =
        toDot
          ? el.querySelector('[data-dot]')
          : (el.querySelector('[data-thread-replies]') ?? el.querySelector('[data-comment-body]'))
      if (!face || !target) {
        setLine(null)
        return
      }
      const box = el.getBoundingClientRect()
      const origin = box.top + el.clientTop
      const to = target.getBoundingClientRect()
      const top = face.getBoundingClientRect().bottom - origin + FACE_GAP
      const bottom = (toDot ? to.top + to.height / 2 : to.bottom) - origin
      const next = { top, height: Math.max(0, bottom - top) }
      setLine((was) => (was && Math.abs(was.top - next.top) < 0.01 && Math.abs(was.height - next.height) < 0.01 ? was : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [root, active, toDot])
  return line
}
