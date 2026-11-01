import { IconArrowNarrowRight, IconCheck, IconChecks } from '@tabler/icons-react'
import { Button } from './Button'
import { Chip } from './Chip'
import { cn } from './cn'
import { ABOVE_NAME_BAR_CLASSES } from './looks'
import { MetaText } from './MetaText'
import { WithTooltip } from './Tooltip'

export interface ResolutionNoteProps {
  /** Who resolved it, in the app's words: "You", a name. */
  by: string
  /** What they wrote when they resolved it. */
  note?: string
  /** When, in the app's words: said with who, on hover. */
  at?: string
  /**
   * `tab`, the look (5B, Katerina's pick, 31 October): the kit's green Chip, "Resolved by Person two · the note", the
   * note in white inside it, cut at the end of the line, whole on hover with when. A resolved comment wears it on its
   * top edge. The others stay for the proposal boards until they go: `bar` above the name with a green bar, `face`
   * the same with no bar, `chip` the "Resolved" chip then who and the note, `band` a green band across the card's top,
   * `under` the note alone under the words.
   */
  look?: 'tab' | 'bar' | 'face' | 'chip' | 'band' | 'under'
}

/** "Person two resolved", then the note, two lines at most; the whole in the tooltip. */
function Said({ by, note, dot = false, alone = false }: { by: string; note?: string; dot?: boolean; alone?: boolean }) {
  return (
    <WithTooltip label={note ? `${by} resolved: ${note}` : `${by} resolved`} wrapperClassName="flex min-w-0">
      <p className="line-clamp-2 text-caption">
        {!alone && <span className="text-success-default">{by} resolved</span>}
        {note && !alone && !dot && <IconArrowNarrowRight size={12} stroke={1.5} className="mx-1 -mt-px inline text-text-primary" />}
        {note && !alone && dot && <span className="text-text-muted"> · </span>}
        {note && <span className={alone ? 'text-text-secondary' : 'text-text-primary'}>{note}</span>}
      </p>
    </WithTooltip>
  )
}

/**
 * Who resolved a comment and the note they left, on the comment itself: the kit's green Chip on its top edge (5B).
 * Nothing of the comment is hidden. The same in every app, in each app's colours.
 */
export function ResolutionNote({ by, note, at, look = 'tab' }: ResolutionNoteProps) {
  if (look === 'tab') {
    return (
      <WithTooltip label={note ? `${provenance(by, at)}: ${note}` : provenance(by, at)} wrapperClassName="flex min-w-0 max-w-full">
        {/* On the surface's own ground: the chip's fill is see-through in some themes, and a card's edge must not run through it. */}
        <span data-resolved="tab" className="flex min-w-0 max-w-full rounded-full bg-bg-surface">
          <Chip type="success" leadingIcon={<IconCheck size={12} stroke={2} />} label={`Resolved by ${by}`} detail={note} className="max-w-full" />
        </span>
      </WithTooltip>
    )
  }
  if (look === 'face') {
    return (
      <div data-resolution-note="face" className="flex w-full min-w-0 items-start gap-2">
        {/* The check in the 24px face column, so the words start where the name does. */}
        <span className="flex w-6 shrink-0 justify-center pt-px">
          <IconChecks size={14} stroke={1.5} className="text-success-default" />
        </span>
        <Said by={by} note={note} dot />
      </div>
    )
  }
  if (look === 'chip') {
    return (
      <div data-resolution-note="chip" className="flex w-full min-w-0 items-center gap-2 pl-8">
        <Chip type="success" label="Resolved" />
        <WithTooltip label={note ? `${by}: ${note}` : `Resolved by ${by}`} wrapperClassName="flex min-w-0">
          <p className="truncate text-caption text-text-secondary">
            {by}
            {note && <span className="text-text-muted"> · </span>}
            {note && <span className="text-text-primary">{note}</span>}
          </p>
        </WithTooltip>
      </div>
    )
  }
  if (look === 'band') {
    return (
      <div data-resolution-note="band" className="flex min-w-0 items-start gap-2 rounded-t-[7px] border-b border-success-outline bg-success-wash px-3 py-1.5">
        <IconChecks size={14} stroke={1.5} className="mt-px shrink-0 text-success-default" />
        <Said by={by} note={note} />
      </div>
    )
  }
  if (look === 'under') {
    return (
      <div data-resolution-note="under" className="w-full min-w-0 border-l-2 border-success-default pl-3">
        <Said by={by} note={note} alone />
      </div>
    )
  }
  return (
    <div data-resolution-note className={cn('flex w-full min-w-0 items-start gap-1.5 border-success-default', ABOVE_NAME_BAR_CLASSES)}>
      <IconChecks size={14} stroke={1.5} className="mt-px shrink-0 text-success-default" />
      <Said by={by} note={note} />
    </div>
  )
}

/** In the name row, at its right: the check and "Resolved", who on hover. Proposal look `name`. */
export function ResolvedMark({ by }: { by: string }) {
  return (
    <WithTooltip label={`Resolved by ${by}`} wrapperClassName="flex shrink-0">
      <span data-resolved-mark className="flex items-center gap-1 text-caption text-success-default">
        <IconChecks size={14} stroke={1.5} />
        Resolved
      </span>
    </WithTooltip>
  )
}

/** Who resolved it and when, for a tooltip or a meta line: "Resolved by Person two · 12:30 PM". */
function provenance(by: string, at?: string) {
  return at ? `Resolved by ${by} · ${at}` : `Resolved by ${by}`
}

/** The green check in a 20px disc with a ring: the mark of a resolved thread, the size of a face's badge. */
function Seal({ size = 20 }: { size?: 20 | 14 }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-success-outline bg-success-wash text-success-default',
        size === 20 ? 'size-5' : 'size-3.5',
      )}
    >
      <IconCheck size={size === 20 ? 12 : 9} stroke={2.5} />
    </span>
  )
}

/**
 * Round 2, 1 · Outcome first. The decision is the headline, in the face's column a sealed check; who and when under
 * it. The comment that asked follows, quieter. Someone opening a resolved thread later wants the outcome first.
 */
export function ResolvedOutcome({ by, note, at }: { by: string; note?: string; at?: string }) {
  return (
    <div data-resolved="outcome" className="flex w-full min-w-0 items-start gap-2">
      <span className="flex w-6 shrink-0 justify-center pt-0.5">
        <Seal />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-body-2-strong text-text-primary">{note ?? 'Resolved'}</p>
        <MetaText>{note ? provenance(by, at) : at ? `by ${by} · ${at}` : `by ${by}`}</MetaText>
      </div>
    </div>
  )
}

/**
 * Round 2, 2 · Answer. Under the words, the resolution as an answer of its own: a green-edged box, who and when at
 * its top with Reopen at hand, and the note whole, in the words' size. GitHub's answered discussions.
 */
export function ResolvedAnswer({ by, note, at, onReopen }: { by: string; note?: string; at?: string; onReopen?: () => void }) {
  return (
    <div data-resolved="answer" className="flex w-full min-w-0 flex-col gap-1 rounded-md border border-success-outline bg-success-wash px-3 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <IconChecks size={14} stroke={1.5} className="shrink-0 text-success-default" />
        <span className="min-w-0 truncate text-caption font-medium text-success-default">Resolved by {by}</span>
        {at && <MetaText className="shrink-0">· {at}</MetaText>}
        {onReopen && (
          <Button variant="muted" size="small" className="ml-auto shrink-0" onClick={onReopen}>
            Reopen
          </Button>
        )}
      </div>
      {note && <p className="text-body-2 text-text-primary">{note}</p>}
    </div>
  )
}

/**
 * Round 2, 3 · On the thread's line. A line runs down from the face to a green node, where it was resolved: the
 * same dot and words as inside the thread, so the card and its thread tell it alike. It happened last, so it is said
 * last.
 */
export function ResolvedNode({ by, note, at, line = true, through = false }: { by: string; note?: string; at?: string; /** The end of a line from above, down to the node. Round 3, 5D: none, the node alone at the card's foot. */ line?: boolean; /** The line runs on past the node, behind its dot: a comment open under in one column, whose line runs into its thread. */ through?: boolean }) {
  return (
    <div data-resolved="node" className="relative flex w-full min-w-0 items-start gap-2 pb-2">
      {/* The end of the line from the face, down to the node's centre; or, open in one column, the line on through it. */}
      {through ? (
        <span aria-hidden className="absolute bottom-0 left-[12px] top-0 w-px bg-border-default" />
      ) : (
        line && <span aria-hidden className="absolute left-[11.5px] top-0 h-[9px] w-px bg-border-default" />
      )}
      <span className="flex w-6 shrink-0 justify-center pt-[3px]">
        <span className="flex size-3 items-center justify-center rounded-full bg-bg-surface ring-1 ring-success-outline">
          <span className="size-1.5 rounded-full bg-success-default" />
        </span>
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-caption">
          <span className="text-success-default">{by} resolved</span>
          {at && <MetaText> · {at}</MetaText>}
        </p>
        {note && <p className="text-caption text-text-primary">{note}</p>}
      </div>
    </div>
  )
}

/** Round 2, 4 · Seal: the badge on the face's corner. */
export function ResolvedBadge({ by, at }: { by: string; at?: string }) {
  return (
    <WithTooltip label={provenance(by, at)} wrapperClassName="absolute -bottom-1 -right-1 flex">
      <span className="flex rounded-full bg-bg-surface p-px">
        <Seal size={14} />
      </span>
    </WithTooltip>
  )
}

/** Round 2, 4 · Seal: after the time, "Resolved", in green. */
export function ResolvedMeta({ by, at }: { by: string; at?: string }) {
  return (
    <WithTooltip label={provenance(by, at)} wrapperClassName="flex shrink-0">
      <span className="text-caption text-success-default">· Resolved</span>
    </WithTooltip>
  )
}

/**
 * Round 2, 5 · Tab. A small tab standing on the card's top edge, "Resolved", the card's edge green: the whole card is
 * marked done, as a folder is labelled.
 */
export function ResolvedTab({ by, at, note, says = false }: { by: string; at?: string; note?: string; /** 5B, the look: **ResolutionNote** itself, "Resolved by Person two · the note". Otherwise "Resolved" alone (5A, 5C, 5D). */ says?: boolean }) {
  return (
    // On the card's top edge, 12px in, as wide as the card lets it be.
    <div className="absolute -top-2.5 left-3 z-[1] flex max-w-[calc(100%-1.5rem)]">
      {says ? (
        <ResolutionNote by={by} note={note} at={at} />
      ) : (
        <WithTooltip label={note ? `${provenance(by, at)}: ${note}` : provenance(by, at)} wrapperClassName="flex min-w-0 max-w-full">
          <span data-resolved="tab" className="flex min-w-0 max-w-full rounded-full bg-bg-surface">
            <Chip type="success" leadingIcon={<IconCheck size={12} stroke={2} />} label="Resolved" className="max-w-full" />
          </span>
        </WithTooltip>
      )}
    </div>
  )
}

/**
 * Round 3, 5C · Tab and a foot. The card ends in a green strip, edge to edge: who and when, then the note whole, in
 * the words' size. Under the tab that marks the card, the message is the last thing on it.
 */
export function ResolvedFoot({ by, note, at }: { by: string; note?: string; at?: string }) {
  return (
    <div data-resolved="foot" className="flex flex-col gap-0.5 rounded-b-lg border-t border-success-outline bg-success-wash px-4 py-2">
      <p className="flex items-center gap-1.5 text-caption">
        <IconCheck size={12} stroke={2} className="shrink-0 text-success-default" />
        <span className="text-success-default">{by} resolved</span>
        {at && <MetaText>· {at}</MetaText>}
      </p>
      {note && <p className="pl-[18px] text-body-2 text-text-primary">{note}</p>}
    </div>
  )
}

/**
 * Round 2, 6 · Quiet. The outcome as one green pill under the name, the rest of the card stepping back until it is
 * pointed at. Done is out of the way; the decision is still in sight.
 */
export function ResolvedOutcomePill({ by, note, at }: { by: string; note?: string; at?: string }) {
  return (
    <WithTooltip label={provenance(by, at)} wrapperClassName="flex min-w-0 max-w-full">
      <span data-resolved="pill" className="flex min-w-0 items-center gap-1.5 rounded-full border border-success-outline bg-success-wash py-0.5 pl-1 pr-2.5">
        <Seal size={14} />
        <span className="truncate text-caption text-text-primary">{note ?? 'Resolved'}</span>
      </span>
    </WithTooltip>
  )
}

/**
 * Round 2, 7 · As a reaction. The first pill of the reactions, in green, the size of a reaction: people already mark
 * a thing done with ✅. Who, when and the note on hover; Reopen stays on the strip and in the menu.
 */
export function ResolvedReaction({ by, note, at }: { by: string; note?: string; at?: string; onReopen?: () => void }) {
  return (
    <WithTooltip label={`${provenance(by, at)}${note ? `: ${note}` : ''}`} wrapperClassName="flex">
      <Chip type="success" label="Resolved" leadingIcon={<IconCheck size={12} stroke={2.5} />} />
    </WithTooltip>
  )
}

export interface ResolutionEvent {
  /** Opened again, rather than resolved. */
  reopened?: boolean
  /** Who did it, in the app's words. */
  by: string
  /** The note left with a resolve. */
  note?: string
  /** When, in the app's words. */
  at?: string
  /** A stable key, when two events could match. */
  id?: string
}

/**
 * Resolves and reopens inside a thread, in time order among its replies: a dot in the faces' column and a line of
 * words, the whole history so resolve, reopen, resolve reads as it happened. Several in a row share one block, their
 * dots joined. Peek's, moved with the conversation.
 */
export function ResolutionHistory({ events }: { events: readonly ResolutionEvent[] }) {
  if (events.length === 0) return null
  return (
    <div data-resolution-timeline className="relative flex flex-col gap-2 py-1">
      {/* The joining line runs through the dots' centre: x = 20px, the axis of the cards' faces (8px in + 24px face). */}
      {events.length > 1 && <div aria-hidden className="absolute bottom-[12px] left-[19.5px] top-[12px] w-px bg-border-default" />}
      {events.map((e, i) => (
        <div key={e.id ?? `${e.reopened ? 'reopened' : 'resolved'}-${e.at ?? i}`} data-resolution-event={e.reopened ? 'reopened' : 'resolved'} className="relative flex items-start">
          {/* The dot's column is the cards' 40px face column, so dots stand under faces; the disc masks the line. */}
          <span className="flex h-[17px] w-10 shrink-0 items-center justify-center">
            <span className="flex size-2 items-center justify-center rounded-full bg-bg-surface">
              <span className={cn('size-1 rounded-full', e.reopened ? 'bg-text-muted' : 'bg-success-default')} />
            </span>
          </span>
          <p className="min-w-0 text-h5 leading-snug">
            {!e.reopened ? (
              <>
                <span className="whitespace-nowrap text-success-default">{e.by} resolved</span>
                {e.note && (
                  <>
                    <IconArrowNarrowRight size={12} stroke={1.5} className="mx-1.5 -mt-px inline shrink-0 text-text-primary" />
                    <span className="text-text-primary">{e.note}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-text-primary">{e.by}</span>
                <span className="text-text-secondary"> reopened</span>
              </>
            )}
            {e.at && <MetaText size="chip"> · {e.at}</MetaText>}
          </p>
        </div>
      ))}
    </div>
  )
}
