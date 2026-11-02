import { createContext, useEffect, useState, type RefObject } from 'react'

/**
 * Where a conversation scrolls, Peek's way, moved into the kit (C1 of the audit of 2 November): it opens at the newest
 * comment, comes back to where the reader left it, follows what arrives only while the reader is at the bottom, goes
 * down to the reader's own comment as it is sent, and holds still while cards and pictures fill in. ConversationLayout
 * and Thread use it; nothing here is for an app to call but `useLeftAt`.
 */

/**
 * How close to the bottom still counts as at the bottom. Not zero: `scrollHeight - scrollTop - clientHeight` is rarely
 * exactly zero (display scaling, zoom and fractional pixel ratios leave a fraction while the last comment is squarely
 * in view), and a strict check would make following work on one machine and not another. 80px is about one comment,
 * so a glance at the line above still counts as watching. Peek's NEAR_BOTTOM_PX.
 */
export const NEAR_BOTTOM_PX = 80

/** Whether the box is close enough to the bottom to follow what arrives. */
export function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX
}

/**
 * The comment at the top of a conversation's view, and how far below the view's top it is: what "the same spot" means
 * to the reader, whatever above it changed height.
 */
export function anchorIn(el: HTMLElement): { id: string; top: number } | undefined {
  // jsdom has no layout: no anchor, and the restore keeps the plain offset.
  if (typeof document.elementFromPoint !== 'function') return undefined
  const box = el.getBoundingClientRect()
  // A gap between cards, or a day line, is passed over a few pixels at a time.
  for (let y = box.top + 1; y < box.top + 96; y += 8) {
    const marker = document.elementFromPoint(box.left + box.width / 2, y)?.closest<HTMLElement>('[data-conversation-item]')
    const card = marker?.firstElementChild
    if (marker?.dataset.conversationItem && card) return { id: marker.dataset.conversationItem, top: card.getBoundingClientRect().top - box.top }
  }
  return undefined
}

/** The card of the comment `id` in `el`: the first child of its `data-conversation-item`. */
export const cardIn = (el: HTMLElement, id: string) => el.querySelector(`[data-conversation-item="${CSS.escape(id)}"]`)?.firstElementChild ?? null

/**
 * Keeps a conversation where the reader is while what is in it changes size: a card, a chip or a picture filling in, a
 * card shown or hidden (Peek's OPT-10).
 *
 * At the bottom (`atBottom`, the view's own judgement), it stays the same distance from the bottom, so the newest
 * comments stay in view as a card above them loads. Anywhere else, the comment at the top of the view stays at the same
 * height. Browsers that anchor scrolling themselves (Chromium, Firefox) do the second only for what changes above the
 * view, and only roughly; Safari does neither, and a conversation there was pushed thousands of pixels off its bottom
 * by one card.
 *
 * Only once `ready()` says the conversation has been placed: before that, where it lands is the view's to decide.
 * Without `atBottom` (a thread), "at the bottom" is where the last scroll left it. `rebase()` takes it again from where
 * the box is now, at the bottom: a thread that just went down to a new reply.
 */
export function useSteadyScroll(
  scrollRef: RefObject<HTMLElement | null>,
  atBottom: RefObject<boolean> | undefined,
  ready: () => boolean,
  key: unknown,
  enabled: boolean,
): { rebase: () => void } {
  const [handle] = useState(() => ({ rebase: () => {} }))
  useEffect(() => {
    const el = scrollRef.current
    if (!enabled || !el || typeof ResizeObserver === 'undefined') return
    let fromBottom = 0
    let lastTop = 0
    let anchor: ReturnType<typeof anchorIn>
    let scrolledToBottom = true
    const bottom = () => (atBottom ? atBottom.current : scrolledToBottom)
    const remember = () => {
      fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      lastTop = el.scrollTop
      anchor = bottom() ? undefined : anchorIn(el)
    }
    remember()
    handle.rebase = () => {
      scrolledToBottom = true
      remember()
    }
    const onScroll = () => {
      scrolledToBottom = isNearBottom(el)
      remember()
    }
    const keep = () => {
      if (!ready()) return remember()
      if (bottom()) {
        // The distance it was left at, unless the view was moved down to the live edge since (a new comment followed,
        // before its scroll event): that move stands, rather than being put back.
        const now = el.scrollHeight - el.scrollTop - el.clientHeight
        const keepAt = el.scrollTop > lastTop && now < fromBottom ? now : fromBottom
        const top = el.scrollHeight - el.clientHeight - Math.max(0, keepAt)
        if (Math.abs(el.scrollTop - top) >= 1) el.scrollTop = top
      } else if (anchor) {
        const card = cardIn(el, anchor.id)
        if (card) {
          const moved = card.getBoundingClientRect().top - el.getBoundingClientRect().top - anchor.top
          if (Math.abs(moved) >= 1) el.scrollTop += moved
        }
      }
      remember()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    // The scroller for its own height (the box under it grows), its content for everything in it.
    const observer = new ResizeObserver(keep)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    return () => {
      handle.rebase = () => {}
      el.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [scrollRef, atBottom, ready, key, enabled, handle])
  return handle
}

/**
 * Where each conversation was left in this tab (Peek's OPT-3), by the name the app gave it (`rememberAs`): at the
 * bottom or at an offset, the comment at the top of the view and how far down it sat, and when (ms). Not per reader:
 * it holds no words.
 */
export const places = new Map<string, { atBottom: boolean; offset: number; anchor?: { id: string; top: number }; leftAt: number }>()

/**
 * When the reader last left the conversation `key` (a `ConversationLayout`'s `rememberAs`) away from its newest
 * comment, in ms since 1970: what an app draws its "New" line from, over the first comment written since. `null` when
 * it was left at the newest, or not opened before in this tab. Taken once per visit, as the conversation opens: later
 * scrolling moves the record, not the line.
 */
export function useLeftAt(key: string | null | undefined): number | null {
  const [taken, setTaken] = useState<{ key: string; at: number | null }>()
  // Nothing shown: the visit is over, and the next one, to the same conversation too, takes it again.
  if (!key && taken) setTaken(undefined)
  if (key && taken?.key !== key) {
    const left = places.get(key)
    const at = left && !left.atBottom ? left.leftAt : null
    setTaken({ key, at })
    return at
  }
  return key && taken?.key === key ? taken.at : null
}

/**
 * Set by ConversationLayout round its own box, read by CommentBox: the reader's own comment brings them down to it as
 * it is drawn, before the relay has answered (Peek's OPT-6), and a refusal leaves where they actually are to decide.
 */
export const sendsInLayout = createContext<{ sending: () => void; refused: () => void } | null>(null)

/** Set by a Thread round its replies, counted by each ReplyCard drawn in it: a new one takes the thread to its newest. */
export const repliesDrawn = createContext<{ n: number } | null>(null)
