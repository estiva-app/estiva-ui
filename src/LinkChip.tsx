/**
 * A link in running text: the icon (or the author's face, for words a person
 * wrote), the key, the title cut short, the status as its shape. Loading
 * keeps the icon, since the kind is known from the address; not available says
 * so in words. Hovering it shows its card; a tap opens it.
 */
import { Avatar } from './Avatar'
import { InlineChip } from './InlineChip'
import type { LinkState } from './linked'
import { chosenOf } from './linked'
import { LinkedIcon, LinkKey, StatusMark } from './LinkParts'
import { LinkPreview } from './LinkPreview'
import { SkeletonBar } from './Skeleton'

export interface LinkChipProps {
  link: LinkState
  /** Hovering shows its card. Off where a card would cover what the reader is choosing from. */
  preview?: boolean
}

export function LinkChip({ link, preview = true }: LinkChipProps) {
  if (link.state === 'loading') {
    return (
      <InlineChip icon={<LinkedIcon kind={link.kind} size={14} tone="inherit" />} aria-busy>
        <SkeletonBar className="h-2.5 w-16" />
      </InlineChip>
    )
  }
  if (link.state === 'unavailable') {
    return (
      <InlineChip tone="muted" icon={<LinkedIcon kind={link.kind} size={14} tone="inherit" />}>
        {link.noun}, not available
      </InlineChip>
    )
  }
  const { linked } = link
  const status = chosenOf(linked.status)
  const said = linked.kind === 'message' && linked.author
  const chip = (
    <InlineChip
      icon={said ? <Avatar name={said.name} src={said.picture} size={16} /> : <LinkedIcon kind={linked.kind} size={14} tone="inherit" />}
      href={linked.href}
      className="max-w-[28ch]"
    >
      {linked.key && <LinkKey>{linked.key}</LinkKey>}
      <span className="truncate">{said ? `${said.name}: ${linked.body ?? linked.title}` : linked.title}</span>
      {status?.colour && <StatusMark status={{ label: status.label, colour: status.colour }} />}
    </InlineChip>
  )
  return preview ? <LinkPreview linked={linked}>{chip}</LinkPreview> : chip
}
