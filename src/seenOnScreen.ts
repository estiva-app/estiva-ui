import { useEffect, useMemo, useState, type RefObject } from 'react'

const NONE: ReadonlySet<string> = new Set()
/** How long it must stay on screen, without a break: Peek's READ_DWELL_MS. */
const DWELL_MS = 1500
/** A card taller than the view can never show half of itself: this much of it is enough. */
const TALL_ENOUGH_PX = 120
/** Every tenth, so a tall card's share is reported as it scrolls, not only as it crosses half. */
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10)

/** What has been seen of one conversation or thread: given to a `ConversationLayout`'s or a `Thread`'s `seen`. */
export interface SeenOnScreen {
  /** The ids of the comments or replies that have been on screen a moment, for the key it was made with. */
  readonly ids: ReadonlySet<string>
}

/** The boxes a part hands in, each with the attribute that names its comments, and the watch over them. */
interface Watcher {
  roots: Map<HTMLElement, string>
  watch: { current: ((el: Element, attribute: string) => void) | null }
}

const watchers = new WeakMap<SeenOnScreen, Watcher>()

/**
 * The comments or replies that have been on screen for a moment: what reads them (Katerina, 30 October). Their "new"
 * look goes once they have been seen, by scrolling to them or opening their thread, not when their conversation is
 * opened. Peek's, moved with the conversation (C2 of the audit of 2 November).
 *
 * Hand what it returns to a `ConversationLayout`'s `seen` (its comments, by `data-conversation-item`) or a `Thread`'s
 * (its replies, by `ReplyCard`'s `id`), and read back `ids`. On screen means half of the card shows, or 120px of a
 * taller one, inside every scrolling pane round it, for 1.5 seconds without a break, in a tab that is not hidden.
 * Scrolling past reads nothing. Where there is no IntersectionObserver (a test's page), everything drawn counts as on
 * screen: the dwell alone decides.
 *
 * What has been seen is held for `key`, the conversation or the thread, and starts again empty when it changes;
 * `null` watches nothing (before the app has judged what is new: what is seen first would be read).
 */
export function useSeenOnScreen(key: string | null): SeenOnScreen {
  const [seen, setSeen] = useState<{ key: string | null; ids: ReadonlySet<string> }>({ key: null, ids: NONE })
  const [watcher] = useState<Watcher>(() => ({ roots: new Map(), watch: { current: null } }))

  useEffect(() => {
    if (!key) return
    const timers = new Map<string, ReturnType<typeof setTimeout>>()
    const showing = new Set<string>()
    const done = new Set<string>()
    const idOf = new WeakMap<Element, string>()
    const boxlessOf = new WeakMap<Element, boolean>()

    const arm = (id: string) => {
      if (done.has(id) || timers.has(id) || document.hidden) return
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          done.add(id)
          setSeen((prev) => ({ key, ids: new Set([...(prev.key === key ? prev.ids : []), id]) }))
        }, DWELL_MS),
      )
    }
    const disarm = (id: string) => {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const id = idOf.get(entry.target)
                if (!id) continue
                const onScreen = entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= TALL_ENOUGH_PX)
                if (onScreen) {
                  showing.add(id)
                  arm(id)
                } else {
                  showing.delete(id)
                  disarm(id)
                }
              }
            },
            { threshold: THRESHOLDS },
          )

    const watch = (el: Element, attribute: string) => {
      const id = el.getAttribute(attribute)
      if (!id) return
      // Asked once per element; the card inside is looked up on every draw, since it can be drawn anew. One drawn as
      // `display: contents` has no box of its own and is watched through its first child, the card.
      let boxless = boxlessOf.get(el)
      if (boxless === undefined) boxlessOf.set(el, (boxless = getComputedStyle(el).display === 'contents'))
      const target = boxless ? el.firstElementChild : el
      if (!target || idOf.has(target)) return
      idOf.set(target, id)
      if (observer) observer.observe(target)
      else {
        showing.add(id)
        arm(id)
      }
    }
    watcher.watch.current = watch
    // What the parts drew before this key was known.
    for (const [root, attribute] of watcher.roots) root.querySelectorAll(`[${attribute}]`).forEach((el) => watch(el, attribute))

    // A hidden tab is not being read: its clocks stop, and start again on what still shows.
    const onVisibility = () => {
      if (document.hidden) for (const id of [...timers.keys()]) disarm(id)
      else for (const id of showing) arm(id)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      watcher.watch.current = null
      observer?.disconnect()
      for (const t of timers.values()) clearTimeout(t)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [key, watcher])

  const ids = seen.key === key ? seen.ids : NONE
  return useMemo(() => {
    const handle: SeenOnScreen = { ids }
    watchers.set(handle, watcher)
    return handle
  }, [ids, watcher])
}

/**
 * A part's half: every draw, the comments under `root` that carry `attribute` are watched for `seen`. Used by
 * ConversationLayout and Thread; nothing for an app to call.
 */
export function useWatchSeen(seen: SeenOnScreen | undefined, root: RefObject<HTMLElement | null>, attribute: string) {
  useEffect(() => {
    const watcher = seen && watchers.get(seen)
    const el = root.current
    if (!watcher || !el) return
    watcher.roots.set(el, attribute)
    const watch = watcher.watch.current
    if (watch) el.querySelectorAll(`[${attribute}]`).forEach((item) => watch(item, attribute))
    return () => {
      watcher.roots.delete(el)
    }
  })
}
