export interface ReactionHorizonProps {
  /** How many comments and replies back reactions are read for. */
  limit: number
  /** How many older ones were not checked. */
  omitted: number
  /** Some reactions may be missing: the read was cut short. */
  cut?: boolean
  /** What the app calls what is said, in the plural: "messages" in Peek. Default "comments". */
  noun?: string
}

/**
 * The line that says reactions are read only so far back, and how many older comments were not checked. Nothing is
 * drawn when every one was. Peek's, moved with the conversation.
 */
export function ReactionHorizon({ limit, omitted, cut = false, noun = 'comments' }: ReactionHorizonProps) {
  if (omitted <= 0 && !cut) return null
  return (
    <p className="text-caption text-text-muted">
      {omitted > 0 && (
        <>
          Reactions are shown for the latest {limit} {noun} and replies here. {omitted} older {omitted === 1 ? 'one was' : 'ones were'} not checked.
        </>
      )}
      {omitted > 0 && cut && ' '}
      {cut && 'Some reactions may be missing.'}
    </p>
  )
}
