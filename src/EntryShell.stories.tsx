import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { EntryShell } from './EntryShell'

// A stand-in for an app's mark, at the 40px an app's logo badge is drawn at.
const logo = (
  <div role="img" aria-label="Logo" className="flex size-10 items-center justify-center rounded-xl bg-accent-muted text-accent-text">
    <IconSquareRounded size={16} stroke={1.5} />
  </div>
)

const meta = {
  title: 'Frame/EntryShell',
  component: EntryShell,
  parameters: { layout: 'fullscreen' },
  args: { logo },
  argTypes: { logo: { control: false } },
} satisfies Meta<typeof EntryShell>

export default meta
type Story = StoryObj<typeof meta>

/** The line and the one thing to do about it. */
export const MessageWithAction: Story = {
  args: { message: 'One line saying why the app cannot open yet.', action: { label: 'Continue', onClick: () => {} } },
}

/** The logo alone, faded in after 150ms. */
export const Busy: Story = {
  args: { busy: true },
}

/** The line alone, when nothing the person can do would help. A longer line wraps at its width. */
export const MessageOnly: Story = {
  args: {
    message: 'A longer line, for a reason that needs two sentences. It wraps at the width the line is given and stays centred under the logo.',
  },
}

/** The button held while what it started is still running. */
export const ActionDisabled: Story = {
  args: { message: 'One line saying why the app cannot open yet.', action: { label: 'Continue', onClick: () => {}, disabled: true } },
}

/** The button alone, with no line. */
export const ActionOnly: Story = {
  args: { action: { label: 'Try again', onClick: () => {} } },
}
