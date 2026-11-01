import type { Meta, StoryObj } from '@storybook/react-vite'
import { Column } from './conversation.examples'
import { QuotedLine } from './QuotedLine'

/** On a comment on a part of the page, under the name and above its words: the words it is on, in the page's highlight. */
const meta = {
  title: 'Conversation/QuotedLine',
  component: QuotedLine,
  parameters: { layout: 'padded' },
  args: { words: 'the words this comment is on' },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof QuotedLine>

export default meta
type Story = StoryObj<typeof meta>

/** The words the comment is on, still in the text: in the page's highlight, so the two read as one. */
export const Words: Story = { name: 'Words' }

/** The words were changed since: the highlight goes grey, and "Changed since". */
export const Reworded: Story = { name: 'Words changed', args: { state: 'reworded' } }

/** The part was deleted from the page: the words struck through, and "Deleted from the page". */
export const Gone: Story = { name: 'Part deleted', args: { state: 'gone' } }

/** On a part with no words of its own, a picture: its name, in the app's words. */
export const Part: Story = { name: 'No words', args: { words: undefined, label: 'Picture: plan-sketch.png' } }

/** Words longer than two lines: cut, the whole in the tooltip. */
export const Long: Story = { name: 'Long words', args: { words: 'the words this comment is on, which run on past the width of the column, and on again, so that two lines are not enough and the words have to be cut before their end' } }
