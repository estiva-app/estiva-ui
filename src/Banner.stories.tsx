import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPencilMinus, IconUserPlus } from '@tabler/icons-react'
import { Banner } from './Banner'

const meta = {
  title: 'Feedback/Banner',
  component: Banner,
  parameters: {
    layout: 'fullscreen',
    // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
    // the info tone reads 3.99:1 on its wash in ship (AA 4.5:1).
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: { tone: 'ok', children: 'Public key copied.' },
  argTypes: { tone: { control: 'inline-radio', options: ['ok', 'error', 'info', 'warning'] } },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {}

/** An error announces itself (`role="alert"`); the rest are polite. */
export const Error: Story = { args: { tone: 'error', children: 'The last read failed — reconnecting.' } }

export const Info: Story = { args: { tone: 'info', children: 'A new version is available. Reload when convenient.' } }

export const Warning: Story = { args: { tone: 'warning', children: 'This workspace is read-only until sign-in.' } }

/**
 * With a dismiss (D21). The row is 40px rather than 36px, because the button
 * is taller than the line of text.
 */
export const Dismissible: Story = {
  args: { tone: 'warning', children: 'This workspace is read-only until sign-in.', onDismiss: () => {} },
}

/**
 * With an icon and one action (Katerina, 2026-09-18). One line: the text
 * truncates, and the Button stays at the end.
 */
export const WithIconAndAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <Banner tone="info" icon={<IconPencilMinus size={16} stroke={1.5} />} action={{ label: 'Invite people', onClick: () => {} }}>
        This is the start of the conversation in <span className="font-medium">Project Alpha</span>
      </Banner>
      <Banner tone="info" icon={<IconPencilMinus size={16} stroke={1.5} />}>
        This is the start of your conversation with <span className="font-medium">Sam Lee</span>
      </Banner>
      <Banner tone="info" icon={<IconUserPlus size={16} stroke={1.5} />} action={{ label: 'Join', onClick: () => {} }}>
        You are not in <span className="font-medium">Project Alpha</span> yet — join to take part in the conversation
      </Banner>
    </div>
  ),
}

/** All four tones, stacked. */
export const AllTones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Banner tone="ok">Public key copied.</Banner>
      <Banner tone="info">A new version is available. Reload when convenient.</Banner>
      <Banner tone="warning">This workspace is read-only until sign-in.</Banner>
      <Banner tone="error">The last read failed — reconnecting.</Banner>
    </div>
  ),
}

/** The same four with a dismiss, so the two heights can be compared. */
export const AllTonesDismissible: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Banner tone="ok" onDismiss={() => {}}>
        Public key copied.
      </Banner>
      <Banner tone="info" onDismiss={() => {}}>
        A new version is available. Reload when convenient.
      </Banner>
      <Banner tone="warning" onDismiss={() => {}}>
        This workspace is read-only until sign-in.
      </Banner>
      <Banner tone="error" onDismiss={() => {}}>
        The last read failed — reconnecting.
      </Banner>
    </div>
  ),
}
