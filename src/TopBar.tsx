import { useEffect, useRef, type ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cn } from './cn'
import { Kbd } from './Kbd'
import { FIELD_SHELL_CLASSES } from './looks'
import { shortcutLabel } from './shortcuts'

/**
 * The 52px top bar, in three manners:
 *
 * - `solid` — in flow: a hairline under it, the surface behind it, the
 *   frame's first row (2026-09-02, verbatim from the structured app; its
 *   product title moved to the caller).
 * - `floating` — an overlay: absolute over the content, no border and no
 *   background, and the bar itself ignores the pointer — only its clusters
 *   catch clicks, so the content underneath stays reachable (2026-09-02,
 *   verbatim from the floating app).
 * - `inset` — in flow like `solid`, but standing on the ground: no hairline
 *   and no surface, above a sidebar on the ground and the content's card
 *   (Katerina, 28 September).
 *
 * Geometry both apps agreed on before extraction: 52px tall, `pl-5
 * pr-[26px]`, right cluster `gap-[6px]`. The left region is two slots
 * side by side — `menu` (the menu button, in an app whose navigation
 * collapses) and `logo` (the mark or name beside it; Katerina,
 * 2026-09-02). This component does not know who you are or what is being
 * searched; it only knows where those go.
 *
 * **Search** (Katerina, 8 October: "topbar has a variant with a search input,
 * I assumed it would use it"). Given `onSearch`, the bar draws the search
 * field itself — `SearchInput`'s look, 290px, as a button that opens what the
 * app searches with — and Ctrl+K (Cmd+K on a Mac) presses it from anywhere.
 * Before, every app drew its own field and listened for the keys itself.
 * A `search` of the caller's own still takes the centre.
 */
export interface TopBarProps {
  variant?: 'solid' | 'floating' | 'inset'
  /** Far left: the menu button, in an app whose navigation collapses. Stays the caller's — the bar only places it. */
  menu?: ReactNode
  /** Beside the menu button: the app's logo mark, or its name as text. */
  logo?: ReactNode
  /** The centre: something of the caller's own. Without it, and with `onSearch`, the bar draws its search field. */
  search?: ReactNode
  /** What searching opens — the app's command launcher. Called on a click on the search field, and on Ctrl+K (Cmd+K) anywhere. */
  onSearch?: () => void
  /** The words in the bar's own search field. Default "Search…". */
  searchPlaceholder?: string
  /** The right cluster — an `IdentityMenu` and its neighbours. */
  right?: ReactNode
  className?: string
}

export function TopBar({ variant = 'solid', menu, logo, search, onSearch, searchPlaceholder = 'Search…', right, className }: TopBarProps) {
  const floating = variant === 'floating'
  // The latest handler, so the key listener is set once rather than on every render.
  const searchRef = useRef(onSearch)
  useEffect(() => {
    searchRef.current = onSearch
  })
  const searches = onSearch !== undefined
  useEffect(() => {
    if (!searches) return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.()
      }
    }
    // @estiva-escape(no-hand-rolled-behaviour): Ctrl+K opens search from anywhere on the page, which is a page-wide shortcut and not a floating part; no part listens for a key across the page
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searches])
  const centre =
    search ??
    (onSearch && (
      <BaseButton type="button" onClick={onSearch} className={cn('flex w-[290px] cursor-pointer items-center gap-2 px-3 py-2', FIELD_SHELL_CLASSES)}>
        <span className="min-w-0 flex-1 truncate text-left text-input-value text-text-muted">{searchPlaceholder}</span>
        <Kbd>{shortcutLabel('Mod-K')}</Kbd>
      </BaseButton>
    ))
  return (
    <header
      className={cn(
        'flex h-[52px] items-center pl-5 pr-[26px]',
        floating
          ? 'pointer-events-none absolute left-0 right-0 top-0 z-10'
          : cn('shrink-0 gap-4', variant === 'solid' && 'border-b border-border-default bg-bg-surface'),
        className,
      )}
    >
      {(menu || logo) && (
        <div className={cn('flex shrink-0 items-center gap-2', floating && 'pointer-events-auto')}>
          {menu}
          {logo && <div className="flex items-center text-body-2-strong text-text-primary">{logo}</div>}
        </div>
      )}
      <div className={cn('flex min-w-0 flex-1 items-center justify-center', floating && 'pointer-events-auto')}>{centre}</div>
      <div className={cn('flex shrink-0 items-center gap-[6px]', floating && 'pointer-events-auto')}>{right}</div>
    </header>
  )
}
