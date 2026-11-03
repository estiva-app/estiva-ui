import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, within } from 'storybook/test'
import { DeletedNotice } from './DeletedNotice'

/** What a link to a deleted file opens on. */
const meta = {
  title: 'Status & feedback/DeletedNotice',
  component: DeletedNotice,
  parameters: { layout: 'padded' },
  args: { by: 'Person two', when: 'Mon, Nov 2', onRestore: fn() },
  decorators: [(Story) => <div className="max-w-xl">{Story()}</div>],
} satisfies Meta<typeof DeletedNotice>

export default meta
type Story = StoryObj<typeof meta>

/** For someone who may edit it: who deleted it, when, and Restore. */
export const Deleted: Story = {}

/** For someone who may only read it: the line alone. */
export const ReadOnly: Story = { name: 'Read-only', args: { onRestore: undefined } }

/** Restore pressed: it waits for the answer, and a second press does nothing. */
export const Restoring: Story = {
  args: { onRestore: fn(() => new Promise<void>(() => {})) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Restore' }))
  },
}
