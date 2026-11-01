import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, within } from 'storybook/test'
import { ArchivedNotice } from './ArchivedNotice'

/** The card at the top of an archived file, and in the comment box's place on its page. */
const meta = {
  title: 'Status & feedback/ArchivedNotice',
  component: ArchivedNotice,
  parameters: { layout: 'padded' },
  args: {
    by: 'Person two',
    when: 'Tue, Oct 28',
    resolution: 'Shipped in the October release. The follow-ups live in the next project.',
    onUnarchive: fn(),
  },
  decorators: [(Story) => <div className="max-w-xl">{Story()}</div>],
} satisfies Meta<typeof ArchivedNotice>

export default meta
type Story = StoryObj<typeof meta>

/** Archived by itself: who, when, the resolution, and Unarchive. */
export const Archived: Story = {}

/** Archived with no resolution: the line alone. */
export const NoResolution: Story = { name: 'No resolution', args: { resolution: undefined } }

/** Archived with the project above it: restored there, so it opens that project. */
export const WithItsParent: Story = {
  name: 'With its parent',
  args: { withWhat: 'project', withTitle: 'October release', resolution: undefined, onUnarchive: undefined, onOpenParent: fn() },
}

/** A resolution over several lines keeps its line breaks. */
export const LongResolution: Story = {
  name: 'Long resolution',
  args: {
    resolution:
      'Shipped in the October release.\nThe two open questions moved to the next project, with their comments.\nThe old drafts stay here to read.',
  },
}

/** Nothing can be done from here: the reader cannot restore it. */
export const ReadOnly: Story = { name: 'Read-only', args: { onUnarchive: undefined } }

/** Unarchive pressed: it waits for the answer, and a second press does nothing. */
export const Unarchiving: Story = {
  args: { onUnarchive: fn(() => new Promise<void>(() => {})) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Unarchive' }))
  },
}
