/**
 * A link's card, shown on hover over its chip or its row: read only, in the
 * package's one elevated box. A screen that cannot hover draws no preview, and
 * a tap opens the link (Miky, WID-2: "there's no hover on touch").
 */
import { useSyncExternalStore, type ReactNode } from 'react'
import { LinkCard } from './LinkCard'
import type { Linked } from './linked'
import { MenuPanel } from './Menu'
import { PreviewCard } from './PreviewCard'

const HOVER = '(hover: hover)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(HOVER)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether this screen can hover. Without `matchMedia` (a test, a server) it is taken to. */
export function useCanHover(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window === 'undefined' || !window.matchMedia ? true : window.matchMedia(HOVER).matches),
    () => true,
  )
}

export interface LinkPreviewProps {
  linked: Linked
  /** The trigger fills its column, as a row does; a chip is inline. */
  block?: boolean
  children: ReactNode
}

export function LinkPreview({ linked, block = false, children }: LinkPreviewProps) {
  const canHover = useCanHover()
  if (!canHover) return <>{children}</>
  // A row fills its column; PreviewCard's own trigger is inline and would shrink it to its words.
  return (
    <PreviewCard side="bottom" content={<LinkCard link={{ state: 'ready', linked }} bare readOnly />} wrapperClassName={block ? 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)]' : 'max-w-full'}>
      {children}
    </PreviewCard>
  )
}

/** The preview drawn open, for a still picture of it: the same box PreviewCard draws. */
export function LinkPreviewOpen({ linked }: { linked: Linked }) {
  return (
    <MenuPanel className="w-[360px] p-0">
      <LinkCard link={{ state: 'ready', linked }} bare readOnly />
    </MenuPanel>
  )
}
