/**
 * A link in running text: the icon (or the author's face, for words a person
 * wrote), the key, the title cut short, the status as its shape. Loading
 * keeps the icon, since the kind is known from the address; not available says
 * so in words. Hovering it shows its card; a tap opens it.
 *
 * Look C (Katerina, 29 Oct): the key a step lighter than LinkKey's muted grey
 * and 8px from the title; room for 40 characters of title, never more than its
 * line, so in a narrow box it truncates instead of running past the edge.
 */
import { Avatar } from './Avatar'
import { InlineChip } from './InlineChip'
import type { LinkState } from './linked'
import { chosenOf } from './linked'
import { LinkedIcon, LinkKey, StatusMark } from './LinkParts'
import { LinkPreview } from './LinkPreview'
import { WrittenUrl } from './LinkRow'
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
    // Written as a URL, it stays that URL (SPEC §13.1); only a `nostr:` reference says why it is not shown.
    if (link.url) return <WrittenUrl url={link.url} />
    return (
      <InlineChip tone="muted" icon={<LinkedIcon kind={link.kind} size={14} tone="inherit" />}>
        {link.noun} {link.deleted ? 'deleted' : 'not available'}
      </InlineChip>
    )
  }
  const { linked } = link
  const status = chosenOf(linked.status)
  const said = linked.kind === 'message' && linked.author
  const chip = (
    <InlineChip
      icon={said ? <Avatar name={said.name} src={said.picture} size={14} /> : <LinkedIcon kind={linked.kind} size={14} tone="inherit" />}
      // No address to open (another app's file with none over https): a label, not a link to nowhere.
      href={linked.href || undefined}
      // Never wider than its line. With its hover card, the card's wrapper holds it to the line (max-w-full): a share of the
      // line on the chip itself made the wrapper as wide as the whole title, and left a gap after the cut-short chip
      // (Katerina, 29 Oct). Without one, it holds itself, less its own 2px each side.
      // min-w-0: inside the wrapper it may shrink below its whole title, which then truncates.
      className={preview ? 'min-w-0 max-w-[40ch]' : 'max-w-[min(40ch,calc(100%_-_4px))]'}
    >
      {linked.key && (
        // 4px more than the chip's gap after it, and kept whole: "ABC-2" never breaks at its hyphen.
        <span className="mr-1 shrink-0 whitespace-nowrap">
          <LinkKey tone="secondary">{linked.key}</LinkKey>
        </span>
      )}
      <span className="truncate">{said ? `${said.name}: ${linked.body ?? linked.title}` : linked.title}</span>
      {status?.colour && <StatusMark status={{ label: status.label, colour: status.colour }} />}
    </InlineChip>
  )
  return preview ? <LinkPreview linked={linked}>{chip}</LinkPreview> : chip
}
