import { createContext, useContext, useMemo, type MouseEvent, type MouseEventHandler, type ReactNode } from 'react'

export interface AppProviderProps {
  /**
   * Where this app keeps a person's picture. `Avatar` asks it, with the
   * person's name, whenever it is handed no picture — and so does every part
   * that draws a face through it: `Person`, `AvatarGroup`, `MembersPill`,
   * `MembersDialog`, `PersonTrigger`, `IdentityMenu`.
   */
  pictureFor?: (name: string) => string | null | undefined
  /**
   * How this app changes page without reloading. A plain click on a link to
   * this app's own address calls it with the link's path (`/message/1`, also
   * when the `href` is the whole `https://…` address) instead of loading the
   * page again: `Link` (and so `Card` and `Breadcrumb`'s crumbs),
   * `NavItem` (and so `NavTree`'s rows), `RailItem`, `Chip`, `InlineChip`, and
   * `IconButton` (and so `ToolbarLink`).
   */
  navigate?: (href: string) => void
  children: ReactNode
}

type AppSetup = Omit<AppProviderProps, 'children'>

const Setup = createContext<AppSetup>({})

/**
 * What every part needs to know about the app it is in, said once at the top:
 * where a person's picture comes from, and how to change page.
 *
 * Without it each app wrapped the parts that needed either: Peek's own
 * `Avatar` and `Person` only looked a picture up, and Peek's and Ship's own
 * `NavItem` only stopped a reload (Katerina, 8 October: "we would handle these
 * in estiva-ui so we don't keep copies"). Both are optional, and a part
 * without a provider above it draws exactly as it did.
 */
export function AppProvider({ pictureFor, navigate, children }: AppProviderProps) {
  const value = useMemo(() => ({ pictureFor, navigate }), [pictureFor, navigate])
  return <Setup.Provider value={value}>{children}</Setup.Provider>
}

/** The app's picture lookup, or nothing outside an `AppProvider`. */
export function usePictureFor(): AppSetup['pictureFor'] {
  return useContext(Setup).pictureFor
}

/** Whether a click is a plain one, the browser's to follow in this tab: the main button, with no Ctrl, Cmd, Shift or Alt — what every link part checks before it keeps a click in the app. */
export function isPlainClick(event: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/**
 * A link's click, kept inside the app: the caller's own `onClick` first, then,
 * on a plain left click to this app's own address, the app's `navigate` in
 * place of a page load — or `inPlace`, when the caller opens it its own way
 * (`NavItem`'s `onPlainClick`), with or without a provider.
 *
 * A plain left click to another site's address — another app's file — opens
 * it in a new tab that cannot reach back into this one, as "Open in …" does
 * (Katerina, 30 Oct): the app being written in is not left for it.
 *
 * Left to the browser, as an `<a>` always is: a click the caller already
 * handled (`preventDefault`), a click with a modifier or another button (a new
 * tab), a link that opens elsewhere (`target`) or downloads, and an address in
 * another scheme (`folder:`, `mailto:`). So an app that still passes its own
 * router `onClick`, as Ship's `linkTo` does, is unchanged.
 */
export function useInAppClick<E extends HTMLElement>(href: string | undefined, onClick?: MouseEventHandler<E>, inPlace?: MouseEventHandler<E>): MouseEventHandler<E> | undefined {
  const navigate = useContext(Setup).navigate
  if ((!navigate && !inPlace) || href === undefined) return onClick
  return (event: MouseEvent<E>) => {
    onClick?.(event)
    if (event.defaultPrevented || !isPlainClick(event)) return
    const link = event.currentTarget
    const target = link.getAttribute('target')
    if ((target && target !== '_self') || link.hasAttribute('download')) return
    let url: URL
    try {
      url = new URL(href, window.location.href)
    } catch {
      return
    }
    if (url.origin !== window.location.origin) {
      // Without a provider another site's address is the browser's, as it always was.
      if (!navigate || (url.protocol !== 'https:' && url.protocol !== 'http:')) return
      event.preventDefault()
      window.open(url.href, '_blank', 'noopener,noreferrer')
      return
    }
    event.preventDefault()
    if (inPlace) {
      inPlace(event)
      return
    }
    // The path, never the whole address: a router reads `https://…` as a path
    // under the current page and lands nowhere (Peek's message link, 8 October).
    navigate?.(`${url.pathname}${url.search}${url.hash}`)
  }
}
