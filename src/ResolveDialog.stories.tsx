import type { Meta, StoryObj } from '@storybook/react-vite'
import { ResolveDialog } from './ResolveDialog'

/** Resolve, with an optional note. Ctrl+Enter resolves from the note. */
const meta = {
  title: 'Conversation/ResolveDialog',
  component: ResolveDialog,
  parameters: { layout: 'fullscreen' },
  args: { onResolve: () => {}, onCancel: () => {} },
  decorators: [(Story) => <div className="h-screen">{Story()}</div>],
} satisfies Meta<typeof ResolveDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing written yet: the note is optional. */
export const Resolve: Story = {}

/** Waiting for the answer: everything inside is switched off. */
export const Sending: Story = { args: { onResolve: () => new Promise(() => {}) } }

/** The last resolve was refused: said under the note. */
export const Refused: Story = { args: { refused: 'Not resolved: try again in a moment.' } }
