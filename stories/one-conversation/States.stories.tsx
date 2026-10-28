import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { ITEM, ready } from '../../src/linked.examples'
import { FIRST, FOURTH, LINKS, LONG_NOTE, ON_WORDS, SECOND, THIRD, type Comment } from './fixtures'
import { REFUSED } from './Conversation'
import { Narrow } from './Places'

/**
 * PROTOTYPE (concept/one-conversation): every state of the one conversation,
 * at Leaf's 384 px. Pick the theme in the toolbar: the same states read in
 * `signal`, `ship` and `leaf`.
 */
const meta = {
  title: 'Prototype/One conversation/States',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const open = (c: Comment) => ({ expanded: new Set([c.id]) })

/** A comment with a person named, a link alone on its line, reactions and "edited" with its time. */
export const AComment: Story = { name: 'A comment', render: () => <Narrow comments={[FIRST]} /> }

/** Its thread open under it: the replies, Resolve and the box. */
export const ThreadOpen: Story = { name: 'Thread open', render: () => <Narrow comments={[FIRST]} start={open(FIRST)} /> }

/** A resolved thread, folded where it was said: its head and first line, then who resolved it → the note in the green box, and Reopen. */
export const Resolved: Story = { render: () => <Narrow comments={[SECOND, FIRST]} /> }

/** A long note: three lines in the green box, then Show all. */
export const ResolvedLongNote: Story = {
  name: 'Resolved, a long note',
  render: () => <Narrow comments={[{ ...SECOND, resolutions: [{ ...SECOND.resolutions![0], note: LONG_NOTE }] }, FIRST]} />,
}

/** A resolved thread opened again to read: the replies, then who resolved it → the note, in the order it happened. */
export const ResolvedRead: Story = {
  name: 'Resolved, opened to read',
  render: () => <Narrow comments={[{ ...SECOND, resolutions: [{ ...SECOND.resolutions![0], note: LONG_NOTE }] }]} start={open(SECOND)} />,
}

/** Reopened after a resolve: both lines stay, the newest counts. */
export const Reopened: Story = {
  render: () => (
    <Narrow
      comments={[{ ...SECOND, resolutions: [...SECOND.resolutions!, { resolved: false, by: 'two', at: '11:30', note: 'One more thing came up.' }] }]}
      start={open(SECOND)}
    />
  ),
}

/** Resolving: the reply box becomes the resolution's, with its green bar; what you write is the note, or resolve without one. */
export const Resolving: Story = { render: () => <Narrow comments={[FIRST]} start={{ ...open(FIRST), resolving: FIRST.id }} /> }

/** A deleted comment: its reply kept under it, and no Reply or Resolve. */
export const Deleted: Story = { render: () => <Narrow comments={[THIRD]} start={open(THIRD)} /> }

/** An urgent mention: the grey bar down the card's edge. */
export const UrgentGrey: Story = { name: 'Urgent, grey bar', render: () => <Narrow comments={[FOURTH]} urgentBar="grey" /> }

/** The same, with the red bar — Katerina's call. */
export const UrgentRed: Story = { name: 'Urgent, red bar', render: () => <Narrow comments={[FOURTH]} urgentBar="red" /> }

/** Links alone on their lines: a file's row, a web page, and one this reader cannot open. */
export const Links: Story = { render: () => <Narrow comments={[LINKS]} /> }

/** A comment on part of a page: the words it quoted, reworded since, and gone. */
export const QuotedWords: Story = {
  name: 'Quoted words',
  render: () => (
    <Narrow
      comments={[
        ON_WORDS,
        { ...ON_WORDS, id: 'q2', quote: { words: 'words that were reworded after the comment', now: 'reworded' } },
        { ...ON_WORDS, id: 'q3', quote: { words: 'words that are no longer on the page', now: 'gone' } },
      ]}
    />
  ),
}

/** Editing your own: the same box, with Cancel and Save. */
export const Editing: Story = { render: () => <Narrow comments={[FIRST]} start={{ editing: FIRST.id }} /> }

/** An edit that was refused: the box reopens with why. */
export const EditRefused: Story = { name: 'Edit refused', render: () => <Narrow comments={[FIRST]} start={{ editing: FIRST.id, editRefused: REFUSED.edit }} /> }

/** A reaction that was refused: said under the card. */
export const ReactionRefused: Story = { name: 'Reaction refused', render: () => <Narrow comments={[FIRST]} start={{ refusedReaction: FIRST.id }} /> }

/** A send that was refused: the words stay in the box, with why. */
export const SendRefused: Story = {
  name: 'Send refused',
  render: () => <Narrow comments={[FIRST]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('textbox', { name: 'Write' }))
    await userEvent.keyboard('Please refuse this{Enter}')
  },
}

/** A file over the limit: said under its name in the box. */
export const FileTooLarge: Story = {
  name: 'File too large',
  render: () => <Narrow comments={[FIRST]} />,
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input[type=file]') as HTMLInputElement
    await userEvent.upload(input, new File([new Uint8Array(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' }))
  },
}

/** An archived file: read-only — no menu, no reactions to add, a line in place of the box. */
export const Archived: Story = { render: () => <Narrow comments={[FIRST, SECOND]} start={open(FIRST)} archived /> }

/** Loading. */
export const Loading: Story = { render: () => <Narrow comments={[]} loading /> }

/** Nothing said yet. */
export const Empty: Story = { render: () => <Narrow comments={[]} /> }

/** The way into a thread with no replies yet. */
export const NoReplies: Story = { name: 'No replies yet', render: () => <Narrow comments={[{ id: 'n1', by: 'two', at: '09:15', lines: [[{ text: 'A comment nobody has answered yet offers Reply.' }], { link: ready(ITEM) }] }]} /> }
