import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommentsPage } from './page'

/**
 * A comment on a word, a sentence or several blocks (LEAF-7), on Leaf's page
 * with the comments column (Katerina's option A). Every story is live: select
 * words and press Comment in the strip, use a block's handle, click a
 * highlight or a card, or type over highlighted words and watch its card.
 */
const meta = {
  title: 'Text comments/Page',
  component: CommentsPage,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, iframeHeight: 820 } },
  },
} satisfies Meta<typeof CommentsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Every comment where it is; none open. */
export const Overview: Story = { args: {} }

/** A comment on a few words: the words are highlighted, the open one underlined. */
export const OnAFewWords: Story = { name: 'On a few words', args: { active: 'words' } }

/** A comment on a passage from the middle of one paragraph to the middle of the next: one highlight across both. */
export const OnAPassage: Story = { name: 'On a passage across paragraphs', args: { active: 'passage' } }

/** A comment on two whole paragraphs: both paragraphs are highlighted, and the card says what it is on. */
export const OnWholeParagraphs: Story = { name: 'On two whole paragraphs', args: { active: 'blocks' } }

/** The heading's word was changed after the comment: nothing is highlighted, the card stays beside the heading with the words as quoted. */
export const WordsChanged: Story = { name: 'Words that changed', args: { active: 'reworded' } }

/** The paragraph a comment was on is gone: the card moves to its own section, with the words as quoted. */
export const BlocksDeleted: Story = { name: 'Blocks deleted', args: { active: 'deleted', deletedOpen: true } }

/** Commenting on a selection across two list items: it stays marked while you write. */
export const CommentingOnAPassage: Story = {
  name: 'Commenting on a passage',
  args: { draft: { blocks: ['lp-3b', 'lp-3c'], quote: { start: 'where a document lives.', end: 'The first week' } } },
}

/** Commenting on a whole paragraph, from its handle's Comment row. */
export const CommentingOnABlock: Story = { name: 'Commenting on a whole paragraph', args: { draft: { blocks: ['lp-1'] } } }
