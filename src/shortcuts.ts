/**
 * How the suite names a keyboard shortcut — Peek's `src/lib/shortcuts.ts`,
 * moved into the package with `SelectionToolbar`, whose tooltips use it (UIG-31).
 *
 * One place, because the app shows shortcuts in three: the top bar's search
 * field, the command launcher's footer, and the selection toolbar's tooltips.
 * They disagreed before this file existed — two of them hardcoded `⌘` and
 * showed a Mac glyph to somebody on Windows.
 *
 * **Words, not glyphs** (Katerina, 2026-09-05). Besides being wrong on the
 * other platform, `⌘` is not in Geist Mono, so it fell back to a system face
 * and sat oddly beside the letter next to it — `K` advances 6px in the chip's
 * own font, `⌘` 10.97px in the fallback.
 *
 * The shared `Kbd` renders what it is handed and formats nothing, by design:
 * only the app knows which platform it is looking at.
 */

import { useEffect, useRef } from 'react'

/** Whether this machine calls the modifier Cmd rather than Ctrl. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')
}

/**
 * `Mod-B` → `Cmd+B` on a Mac, `Ctrl+B` elsewhere.
 *
 * Takes Tiptap's own spelling (`Mod-Shift-B`) so a binding can be passed
 * straight through from wherever it was read.
 */
export function shortcutLabel(keys: string, apple = isApplePlatform()): string {
  return keys
    .split('-')
    .map((part, i, all) => {
      if (i === all.length - 1) return part.length === 1 ? part.toUpperCase() : part
      if (part === 'Mod') return apple ? 'Cmd' : 'Ctrl'
      return part
    })
    .join('+')
}

/** Whether a key press is the shortcut `keys` names, in the spelling above (`Mod-K`, `Mod-Shift-O`). */
export function matchesShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>, keys: string): boolean {
  const parts = keys.split('-')
  const key = parts[parts.length - 1]!
  const mods = new Set(parts.slice(0, -1))
  // Mod is Cmd or Ctrl on any machine, as the top bar's Ctrl+K always took either. A Shift or Alt the shortcut names
  // must be held; one it does not name is let through, as Ctrl+Shift+K always opened search too.
  if (mods.has('Mod') ? !(event.metaKey || event.ctrlKey) : event.metaKey || event.ctrlKey) return false
  if ((mods.has('Shift') && !event.shiftKey) || (mods.has('Alt') && !event.altKey)) return false
  return event.key.toLowerCase() === key.toLowerCase()
}

/**
 * A key that does something from anywhere on the page while the caller is on
 * screen, such as `Mod-K` for search. The browser's own meaning of the key
 * (Ctrl+O, open a file) is taken over: the press is consumed. Off while
 * `enabled` is false. The latest `onPress` runs, so it need not be stable.
 */
export function useShortcut(keys: string, onPress: () => void, enabled = true): void {
  const pressRef = useRef(onPress)
  useEffect(() => {
    pressRef.current = onPress
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (!matchesShortcut(event, keys)) return
      event.preventDefault()
      pressRef.current()
    }
    // @estiva-escape(no-hand-rolled-behaviour): the one listener for a page-wide shortcut, which no floating part owns; every app's shortcut goes through this hook
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keys, enabled])
}
