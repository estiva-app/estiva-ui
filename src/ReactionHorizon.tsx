export interface ReactionHorizonProps {
  /** How many comments and replies back reactions are read for. */
  limit: number
  /** How many older ones were not checked. */
  omitted: number
  /** Some reactions may be missing: the read was cut short. */
  cut?: boolean
  /** What the app calls what is said, in the plural: "messages" in Peek. Default "comments". */
  noun?: string
  /** Older comments are still being read and the whole read will need the line: its room is kept, unseen, so nothing moves when it lands. */
  keepRoom?: boolean
}

/** The words of the line, for `omitted` older ones. */
function Said({ limit, omitted, noun }: { limit: number; omitted: number; noun: string }) {
  return (
    <>
      Reactions are shown for the latest {limit} {noun} and replies here. {omitted} older {omitted === 1 ? 'one was' : 'ones were'} not checked.
    </>
  )
}

/**
 * The line that says reactions are read only so far back, and how many older comments were not checked. Nothing is
 * drawn when every one was. Peek's, moved with the conversation.
 */
export function ReactionHorizon({ limit, omitted, cut = false, noun = 'comments', keepRoom = false }: ReactionHorizonProps) {
  // While the rest is read, the room of the line it will be, with one older one, unseen: as Peek kept it (PEE-7), so
  // the newest comments do not move up under a reader at the bottom when the rest lands.
  const room = keepRoom && omitted <= 0 && (
    <p aria-hidden className="invisible text-caption text-text-muted">
      <Said limit={limit} omitted={1} noun={noun} />
    </p>
  )
  if (omitted <= 0 && !cut) return room || null
  return (
    <>
      <p className="text-caption text-text-muted">
        {omitted > 0 && <Said limit={limit} omitted={omitted} noun={noun} />}
        {omitted > 0 && cut && ' '}
        {cut && 'Some reactions may be missing.'}
      </p>
      {room}
    </>
  )
}
