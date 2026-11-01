/**
 * Showing one comment or reply: what a link to it does (Peek's INT-3 and INT-8, moved with the conversation for every
 * app). It is scrolled to the middle of the view, the ones round it being what makes it checkable, and marked a moment
 * (`data-shown`, the kit's flash: the accent's wash, fading), so the press lands on it and not near it.
 *
 * What it finds is what the kit draws: a reply's `data-reply-id` (`ReplyCard`'s `id`), a thread's pinned comment's
 * `data-thread-start` (`Thread`'s `start.id`), and, asked for, a comment in a `ConversationLayout`'s list
 * (`data-conversation-item`), after the open thread's.
 */

/** How long it stays marked: the flash's own length (`animate-shown`). */
const SHOWN_MS = 1800
/** How long a show waits for it to be drawn, and how often it looks. */
const WAIT_MS = 3000
const POLL_MS = 50

/**
 * The timer that will take each mark off. Without it, two shows of one comment in quick succession leave the first
 * one's timer to clear the second one's mark: "is it still marked?" cannot tell whose mark it is.
 */
const owed = new WeakMap<HTMLElement, number>()

export interface ShowOptions {
  /** Look in the comments of a `ConversationLayout` too, after the open thread's pinned comment and replies. */
  comments?: boolean
}

export interface ShowWhenDrawnOptions extends ShowOptions {
  /** How long to wait for it to be drawn, in ms: 3 seconds by default. */
  wait?: number
}

function find(id: string, { comments = false }: ShowOptions): HTMLElement | null {
  const quoted = CSS.escape(id)
  return (
    document.querySelector<HTMLElement>(`[data-reply-id="${quoted}"], [data-thread-start="${quoted}"]`) ??
    (comments ? document.querySelector<HTMLElement>(`[data-conversation-item="${quoted}"]`) : null)
  )
}

/**
 * Scrolls a comment or reply drawn by the kit into the middle of the view and flashes it. `false` when it is not
 * drawn (a thread whose older replies are not read yet, a thread not open): never a press that seems to work and does
 * nothing, so the caller says it, or opens its thread and waits with `showInConversationWhenDrawn`.
 */
export function showInConversation(id: string, options: ShowOptions = {}): boolean {
  const el = find(id, options)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const previous = owed.get(el)
  if (previous !== undefined) window.clearTimeout(previous)
  el.dataset.shown = 'true'
  owed.set(
    el,
    window.setTimeout(() => {
      delete el.dataset.shown
      owed.delete(el)
    }, SHOWN_MS),
  )
  return true
}

/**
 * The same, for one that may not be drawn yet: its thread was just asked to open, and the page draws it a moment
 * later. Looks every 50ms, for 3 seconds (`wait`), and answers whether it was shown: `false` must be said, since
 * waiting forever and never working look the same to the person who pressed.
 */
export function showInConversationWhenDrawn(id: string, { wait = WAIT_MS, ...options }: ShowWhenDrawnOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + wait
    const attempt = () => {
      if (showInConversation(id, options)) return resolve(true)
      if (Date.now() >= deadline) return resolve(false)
      window.setTimeout(attempt, POLL_MS)
    }
    attempt()
  })
}
